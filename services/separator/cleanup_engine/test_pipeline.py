from __future__ import annotations
import json
import zipfile
import numpy as np
import soundfile as sf
import pytest
from .pipeline import CORE_NAMES, restore_core6

def make_job(root, sr=32000, length=32000, channels=2):
    root.mkdir()
    (root/'stems').mkdir()
    stems=[]
    t=np.arange(length)/sr
    total=np.zeros((length,channels))
    for index,name in enumerate(CORE_NAMES):
        wave=(0.015+index*.002)*np.sin(2*np.pi*(170+index*50)*t)
        sound=np.tile(wave[:,None],(1,channels))
        sf.write(root/'stems'/f'{name}.wav',sound,sr,subtype='PCM_24')
        total+=sound
        stems.append({'name':name,'group':'Core 6','mixable':True,'file':f'stems/{name}.wav'})
    sf.write(root/'source.wav',total,sr,subtype='PCM_24')
    (root/'manifest.json').write_text(json.dumps({'stems':stems}))

def test_exports_synchronized_and_reconstruct(tmp_path):
    job=tmp_path/'job';make_job(job)
    out=tmp_path/'results'
    result=restore_core6(job,out,denoise_strength=0,match_strength=0)
    assert result['samples']==32000 and result['sampleRate']==32000
    assert len(result['stems'])==6 and result['maxMasterSumDifference']<1e-5
    with zipfile.ZipFile(out/'Ableton_Clean_Stems.zip') as z:
        assert len(z.namelist())==8 and 'master.wav' in z.namelist()

def test_shared_reference_and_midi_pass_through(tmp_path):
    job=tmp_path/'job';make_job(job)
    t=np.arange(48000)/48000
    sf.write(tmp_path/'ref.wav',0.08*np.sin(2*np.pi*670*t),48000)
    (tmp_path/'notes.mid').write_bytes(b'MThd\\x00\\x00\\x00\\x06\\x00\\x00\\x00\\x01\\x01\\xe0MTrk\\x00\\x00\\x00\\x04\\x00\\xff\\x2f\\x00')
    out=tmp_path/'results'
    result=restore_core6(job,out,reference=tmp_path/'ref.wav',midi=tmp_path/'notes.mid',denoise_strength=.1)
    assert result['referenceMatchApplied'] and result['midiIncluded']
    assert not result['midiExtracted'] and result['maxMasterSumDifference']<1e-5

def test_missing_stem_rejected(tmp_path):
    job=tmp_path/'job';make_job(job)
    (job/'stems'/'other.wav').unlink()
    with pytest.raises(ValueError,match='missing'):
        restore_core6(job,tmp_path/'results')

def test_path_traversal_rejected(tmp_path):
    job=tmp_path/'job';make_job(job)
    x=json.loads((job/'manifest.json').read_text())
    x['stems'][0]['file']='../../secrets.wav'
    (job/'manifest.json').write_text(json.dumps(x))
    with pytest.raises(ValueError,match='outside job'):
        restore_core6(job,tmp_path/'results')

def test_duplicate_stem_rejected(tmp_path):
    job=tmp_path/'job';make_job(job)
    x=json.loads((job/'manifest.json').read_text())
    x['stems'].append(x['stems'][0])
    (job/'manifest.json').write_text(json.dumps(x))
    with pytest.raises(ValueError,match='Duplicate'):
        restore_core6(job,tmp_path/'results')

def test_invalid_strength_rejected(tmp_path):
    job=tmp_path/'job';make_job(job)
    with pytest.raises(ValueError,match='Strengths'):
        restore_core6(job,tmp_path/'results',denoise_strength=2)

def test_deep_isolates_not_summed(tmp_path):
    job=tmp_path/'job';make_job(job)
    x=json.loads((job/'manifest.json').read_text())
    x['stems'].append({'name':'synth','group':'Deep','mixable':False,'file':'stems/synth.wav'})
    (job/'manifest.json').write_text(json.dumps(x))
    assert len(restore_core6(job,tmp_path/'results',denoise_strength=0)['stems'])==6
