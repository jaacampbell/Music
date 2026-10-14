"""Isolated Music OS cleanup worker. Deploy behind authenticated routing."""
import json, os, re, subprocess, zipfile
from pathlib import Path
import numpy as np
import soundfile as sf
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool
from cleanup_engine.engine import process_stem, CleanupSettings
from cleanup_engine.quality import inspect_pair, QualityLimits

DATA=Path(__file__).parent/"data"
app=FastAPI(title="Music OS Cleanup",version="0.3.0")
app.add_middleware(CORSMiddleware,allow_origins=os.getenv("CORS_ORIGINS","http://localhost:3000").split(","),allow_methods=["GET","POST"],allow_headers=["*"])
NAMES=("vocals","drums","bass","guitar","piano","other")

def folder_for(job_id):
    if not re.fullmatch(r"[a-f0-9]{12}",job_id): raise HTTPException(400,"Invalid job ID")
    folder=(DATA/job_id).resolve()
    if not folder.is_dir(): raise HTTPException(404,"Job not found")
    return folder

def run_cleanup(folder,reference,denoise,match):
    root=folder/"stems"
    if not root.is_dir(): raise ValueError("Separated stems not found")
    original=folder/"source.wav"
    if not original.is_file(): raise ValueError("Original audio missing")
    dest=folder/"cleaned";dest.mkdir(exist_ok=True)
    outputs=[]; reports=[]
    for name in NAMES:
        matches=sorted(root.rglob(f"*_{name.title()}.wav"))
        if not matches: raise ValueError(f"Missing {name} stem")
        src=matches[0];target=dest/f"{name}.wav"
        options=CleanupSettings(highpass_hz=0 if name=="bass" else 25,
            denoise_strength=min(denoise,.15) if name=="drums" else denoise,
            match_strength=match if name not in ("drums","vocals") else 0)
        report=process_stem(str(src),str(target),str(reference) if reference else None,options)
        gate=inspect_pair(src,target)
        if not gate["passed"]:
            target.unlink(missing_ok=True)
            raise ValueError(f"Quality gate failed for {name}: {', '.join(gate['errors'])}")
        outputs.append(target)
        reports.append({"name":name,"quality":gate,**report,"url":f"/cleanup/jobs/{folder.name}/files/{name}.wav"})
    audio=[sf.read(p,always_2d=True) for p in outputs]
    sr=audio[0][1];shape=audio[0][0].shape
    if any(rate!=sr or part.shape!=shape for part,rate in audio): raise ValueError("Misaligned stems")
    mix=np.sum([part for part,_ in audio],axis=0)
    peak=float(np.max(np.abs(mix)))
    if peak>10**(-1/20): mix*=10**(-1/20)/peak
    master=dest/"master.wav"
    sf.write(master,mix,sr,subtype="PCM_24")
    gate=inspect_pair(original,master,QualityLimits(max_level_drop_db=24,max_level_rise_db=24))
    if not gate["passed"]:
        master.unlink(missing_ok=True)
        raise ValueError(f"Master quality gate failed: {', '.join(gate['errors'])}")
    bundle=dest/"Ableton_Clean_Stems.zip"
    with zipfile.ZipFile(bundle,"w",compression=zipfile.ZIP_DEFLATED) as z:
        for p in outputs+[master]: z.write(p,p.name)
        z.write(original,"original_reference_source.wav")
        z.writestr("manifest.json",json.dumps({"sample_rate":sr,"samples":shape[0],"stems":[p.name for p in outputs],"reference_eq":bool(reference),"midi_extracted":False,"pitch_corrected":False,"master_quality":gate},indent=2))
    return {"jobId":folder.name,"stems":reports,"masterQuality":gate,"masterUrl":f"/cleanup/jobs/{folder.name}/files/master.wav","zipUrl":f"/cleanup/jobs/{folder.name}/files/{bundle.name}","midiExtracted":False,"pitchCorrected":False}

@app.get("/cleanup/health")
def health(): return {"status":"ok","version":"0.3.0"}

@app.post("/cleanup/jobs/{job_id}")
async def cleanup(job_id:str,reference:UploadFile|None=File(None),denoise:float=Form(.3),match:float=Form(.3)):
    folder=folder_for(job_id)
    if not (0<=denoise<=1 and 0<=match<=1): raise HTTPException(400,"Invalid settings")
    ref=None
    if reference is not None:
        raw=folder/"cleanup_reference_upload";ref=folder/"cleanup_reference.wav"
        with raw.open("wb") as f:
            while chunk:=await reference.read(1024*1024):
                f.write(chunk)
                if f.tell()>100*1024*1024:
                    raw.unlink(missing_ok=True)
                    raise HTTPException(413,"Reference too large")
        proc=await run_in_threadpool(subprocess.run,["ffmpeg","-y","-i",str(raw),"-ac","2","-ar","44100",str(ref)],capture_output=True)
        raw.unlink(missing_ok=True)
        if proc.returncode: raise HTTPException(400,"Reference decode failed")
    try: return await run_in_threadpool(run_cleanup,folder,ref,denoise,match)
    except ValueError as exc: raise HTTPException(400,str(exc)) from exc

@app.get("/cleanup/jobs/{job_id}/files/{filename}")
def output(job_id:str,filename:str):
    folder=folder_for(job_id)
    if filename not in {*(f"{name}.wav" for name in NAMES),"master.wav","Ableton_Clean_Stems.zip"}: raise HTTPException(404,"Not found")
    path=folder/"cleaned"/filename
    if not path.is_file(): raise HTTPException(404,"Not found")
    return FileResponse(path,filename=filename)
