"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dnaFields, emptyDna, starterDna, knowledge, toolConcepts, type ProducerDna } from "@/lib/studio-brain/content";
import { getCurrentUser, getSessionAccessToken, supabaseRest, uploadPrivateFile, downloadPrivateFile, deletePrivateFile } from "@/lib/persistence/supabase-rest";
import type { CloudUser, MusicProjectRow, AgentMessageRow, MusicAssetRow } from "@/lib/persistence/types";
import styles from "./studioBrain.module.css";

type Tab = "chat" | "dna" | "tools" | "knowledge";
type Message = { role: "user" | "assistant"; body: string; sources?: Array<{label:string;url:string}>; model?: string };
const welcome: Message = { role:"assistant", body:"Welcome to TM Studio Brain. Tell me what you are working on: a cleaner recording, a stronger song, a release, or a platform feature. Choose a song to use its verified project context." };
const prompts = ["Help me fix my vocals.", "Develop my song without rewriting approved lyrics.", "What is missing before release?", "Help me specify a new studio feature."];
const DNA_LABEL = "TM Studio Brain DNA";
export default function StudioBrain(): React.JSX.Element {
  const [tab,setTab] = useState<Tab>("chat");
  const [user,setUser] = useState<CloudUser|null>(null);
  const [projects,setProjects] = useState<MusicProjectRow[]>([]);
  const [projectId,setProjectId] = useState("");
  const [messages,setMessages] = useState<Message[]>([welcome]);
  const [question,setQuestion] = useState("");
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("");
  const [dna,setDna] = useState<ProducerDna>({...emptyDna});
  const [course,setCourse] = useState("");
  const [applyDna,setApplyDna] = useState(false);
  const [level,setLevel] = useState("beginner");
  const [mode,setMode] = useState("creative");
  const [ai,setAi] = useState<boolean|null>(null);
  const [search,setSearch] = useState("");
  const [ready,setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/music-assistant").then(r=>r.json()).then((v:{aiConfigured:boolean})=>{if(!cancelled)setAi(v.aiConfigured);}).catch(()=>undefined);
    void getCurrentUser().then(async u=>{
      if(cancelled)return;
      setUser(u);
      if(u) {
        try {
          const saved = JSON.parse(localStorage.getItem("tm-studio-dna:"+u.id) ?? "null") as {dna?:ProducerDna;course?:string;apply?:boolean}|null;
          if(saved?.dna) setDna({...emptyDna,...saved.dna});
          if(saved?.course) setCourse(saved.course);
          setApplyDna(saved?.apply===true);
        } catch { /* Keep a clean editable profile if the device record is malformed. */ }
        const rows = await supabaseRest<MusicProjectRow[]>("music_projects",{query:"select=*&order=updated_at.desc&limit=100"});
        if(cancelled)return;
        setProjects(rows);
        const requested = new URLSearchParams(window.location.search).get("projectId");
        if(requested && rows.some(p=>p.id===requested))setProjectId(requested);
      }
    }).catch(()=>{if(!cancelled)setNotice("Cloud sign-in is unavailable. Knowledge and tool specifications remain available.");}).finally(()=>{if(!cancelled)setReady(true);});
    return ()=>{cancelled=true;};
  },[]);
  useEffect(()=>{
    if(!ready || !user)return;
    try { localStorage.setItem("tm-studio-dna:"+user.id,JSON.stringify({dna,course,apply:applyDna})); }
    catch { setNotice("Device storage is unavailable. Export your DNA to keep it."); }
  },[dna,course,applyDna,ready,user]);
  useEffect(()=>{
    let cancelled=false;
    if(projectId) {
      void supabaseRest<AgentMessageRow[]>("music_agent_messages",{query:`select=*&project_id=eq.${projectId}&order=created_at.desc&limit=12`})
        .then(rows=>{if(!cancelled)setMessages(rows.length?rows.reverse().map(r=>({role:r.role,body:r.body,model:r.model??undefined})):[welcome]);})
        .catch(()=>{if(!cancelled){setMessages([welcome]);setNotice("Could not restore project chat. New conversation is available.");}});
    } else setMessages([welcome]);
    return ()=>{cancelled=true;};
  },[projectId]);

  async function ask() {
    if(!question.trim() || busy)return;
    if(!user){setNotice("Sign in to use the assistant. Browse Knowledge or Tools without an account.");return;}
    const input=question.trim();
    setBusy(true);setNotice("");
    const previous=messages.filter(m=>m!==welcome).slice(-8).map(({role,body})=>({role,body:body.slice(0,8000)}));
    setMessages(v=>[...v,{role:"user",body:input}]);setQuestion("");
    try {
      const token=await getSessionAccessToken();
      if(!token)throw new Error("Your session ended. Sign in again.");
      const response=await fetch("/api/music-assistant",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({question:input,projectId:projectId||undefined,level,mode,dna:applyDna?dna:{},course:applyDna?course:"",history:previous})});
      const payload=await response.json() as {answer?:string;error?:string;model?:string;warning?:string;sources?:Message["sources"]};
      if(!response.ok || !payload.answer)throw new Error(payload.error??"Assistant unavailable.");
      const answer=payload.answer;
      setMessages(v=>[...v,{role:"assistant",body:answer,model:payload.model,sources:payload.sources}]);
      if(payload.warning)setNotice(payload.warning);
      if(projectId) {
        await supabaseRest("music_agent_messages",{method:"POST",body:[{project_id:projectId,user_id:user.id,role:"user",body:input},{project_id:projectId,user_id:user.id,role:"assistant",body:answer,model:payload.model}]})
          .catch(()=>setNotice("Answer received, but cloud conversation saving failed. Export this session."));
      }
    } catch(error){setNotice(error instanceof Error?error.message:"Assistant unavailable.");setQuestion(input);}
    finally{setBusy(false);}
  }
  function exportJson(filename:string,data:unknown) {
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  }
  async function saveDna() {
    if(!projectId || !user)return;
    setBusy(true);setNotice("");
    let path:string|null=null;
    try {
      const file=new File([JSON.stringify({schema:"tm-dna-v1",savedAt:new Date().toISOString(),dna,course,apply:applyDna})],"tm-producer-dna.json",{type:"application/json"});
      path=await uploadPrivateFile(projectId,file,"studio-brain");
      await supabaseRest("music_assets",{method:"POST",body:{project_id:projectId,user_id:user.id,kind:"other",label:DNA_LABEL,storage_path:path,original_name:file.name,mime_type:file.type,byte_size:file.size}});
      setNotice("DNA snapshot saved privately to this song's Files. Previous snapshots are preserved.");
    }catch(error){if(path)await deletePrivateFile(path).catch(()=>undefined);setNotice(error instanceof Error?error.message:"DNA save failed.");}
    finally{setBusy(false);}
  }
  async function loadDna() {
    if(!projectId)return;
    setBusy(true);
    try {
      const rows=await supabaseRest<MusicAssetRow[]>("music_assets",{query:`project_id=eq.${projectId}&label=eq.${encodeURIComponent(DNA_LABEL)}&order=created_at.desc&limit=1`});
      if(!rows.length)throw new Error("No DNA snapshot has been saved to this song.");
      const blob=await downloadPrivateFile(rows[0].storage_path);
      if(blob.size>50000)throw new Error("DNA snapshot exceeds the supported size.");
      const data=JSON.parse(await blob.text()) as {schema?:string;dna?:Record<string,unknown>;course?:unknown;apply?:boolean};
      if(data.schema!=="tm-dna-v1" || !data.dna)throw new Error("Unsupported DNA snapshot.");
      const next={...emptyDna};
      for(const [key] of dnaFields) if(typeof data.dna[key]==="string")next[key]=(data.dna[key] as string).slice(0,1800);
      setDna(next);setCourse(typeof data.course==="string"?data.course.slice(0,12000):"");setApplyDna(data.apply===true);
      setNotice("Latest project DNA restored. Review it before continuing.");
    }catch(error){setNotice(error instanceof Error?error.message:"Could not restore DNA.");}
    finally{setBusy(false);}
  }
  const selected=projects.find(p=>p.id===projectId);
  return <main className={styles.root}>
    <header className={styles.header}><Link href="/studio" className={styles.brand}><span>TM</span><div><strong>TM Music Studio</strong><small>Studio Brain</small></div></Link><nav><Link href="/studio">Studio</Link><Link href="/dashboard">Projects</Link><Link href="/">Music OS</Link>{!user&&<Link href="/login">Sign in</Link>}</nav></header>
    <section className={styles.hero}><div><p className={styles.kicker}>YOUR METHOD. YOUR MUSIC.</p><h1>A studio brain.<br/>Built around you.</h1><p>Develop the song, shape the sound, and prepare the release—with your creative method in the conversation.</p></div><aside><span className={styles.badge}>{ai===null?"Checking connection":ai?"AI configured · sign-in required":"Guided reference mode"}</span><h2>{selected?.title??"Choose your context"}</h2><label htmlFor="brain-project">Song project</label><select id="brain-project" value={projectId} disabled={busy} onChange={e=>{setProjectId(e.target.value);setNotice("");}}><option value="">General session</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><p>{selected?"Uses your account-verified song metadata and available analysis.":"General chat is session-only. Choose a song for private cloud chat history."}</p></aside></section>
    <nav className={styles.tabs} aria-label="Studio Brain sections">{(["chat","dna","tools","knowledge"] as Tab[]).map(t=><button key={t} aria-current={tab===t?"page":undefined} onClick={()=>setTab(t)}>{t==="chat"?"Ask the Brain":t==="dna"?"Producer DNA":t==="tools"?"DNA Tools":"Knowledge"}</button>)}</nav>
    {notice&&<p role="status" className={styles.notice}>{notice}</p>}
    {tab==="chat"&&<section className={styles.chatLayout}>
      <div className={styles.chat}><div className={styles.chatHead}><span>SESSION / {selected?.title??"GENERAL"}</span><button disabled={busy} onClick={()=>exportJson("tm-studio-session.json",{projectId,messages})}>Export session</button></div>
      <div className={styles.messages} role="log" aria-live="polite">{messages.map((m,i)=><article key={i} className={m.role==="user"?styles.userMessage:styles.message}><small>{m.role==="user"?"YOU":m.model==="guided-reference"?"STUDIO BRAIN · REFERENCE":"STUDIO BRAIN"}</small><p>{m.body}</p>{m.sources&&m.sources.length>0&&<div className={styles.sources}>{m.sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.label} ↗</a>)}</div>}</article>)}{busy&&<p role="status">Working with your current context…</p>}</div>
      <form className={styles.composer} onSubmit={e=>{e.preventDefault();void ask();}}><label htmlFor="brain-question">What are you working on?</label><textarea id="brain-question" maxLength={4000} value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Describe your goal, the problem, and what you have already tried." rows={3}/><div><small>Metadata guidance, not live audio listening. AI replies use the configured provider.</small><button disabled={busy||!ready||!question.trim()} type="submit">Ask Studio Brain →</button></div></form></div>
      <aside className={styles.side}><h2>Make it useful.</h2><label>Experience<select value={level} onChange={e=>setLevel(e.target.value)}><option value="beginner">Beginner · one step at a time</option><option value="intermediate">Intermediate · explain the choices</option><option value="advanced">Advanced · technical detail</option></select></label><label>Session focus<select value={mode} onChange={e=>setMode(e.target.value)}><option value="creative">Creative / artist development</option><option value="technical">Technical / production</option><option value="development">Product development / specifications</option></select></label><label className={styles.check}><input type="checkbox" checked={applyDna} onChange={e=>setApplyDna(e.target.checked)}/>Apply my DNA and course notes</label><p>Only your selected DNA is sent. Development mode drafts specifications; it cannot change code or deploy.</p><div className={styles.prompts}>{prompts.map(p=><button key={p} onClick={()=>setQuestion(p)}>{p}</button>)}</div>{!user&&<Link className={styles.primary} href="/login">Sign in to start</Link>}</aside>
    </section>}
    {tab==="dna"&&<section className={styles.panel}><p className={styles.kicker}>PERSONAL METHOD / EDITABLE</p><h2>Capture how you make decisions.</h2><p>Your course is not preloaded. Add your own lesson excerpts and approve the direction you want applied. Signed-in device drafts are private to your account on this browser; project snapshots support cross-device restore.</p><div className={styles.actions}><button disabled={busy} onClick={()=>{if(confirm("Replace the current DNA draft with the proposed JO₵YN starter?")){setDna({...starterDna});setApplyDna(false);setNotice("Provisional JO₵YN starter loaded. Review and enable Apply my DNA when ready.");}}}>Load proposed JO₵YN starter</button><button onClick={()=>exportJson("tm-producer-dna.json",{schema:"tm-dna-v1",dna,course,apply:applyDna})}>Export DNA</button><button disabled={!projectId||busy} onClick={()=>void saveDna()}>Save private project snapshot</button><button disabled={!projectId||busy} onClick={()=>void loadDna()}>Restore latest snapshot</button></div><label className={styles.check}><input type="checkbox" checked={applyDna} onChange={e=>setApplyDna(e.target.checked)}/>Use this reviewed direction in my conversations</label><div className={styles.dnaGrid}>{dnaFields.map(([key,title,prompt])=><details key={key} open={key==="soundIdentity"?true:undefined}><summary>{title}<small>{dna[key]?"Added":"Not filled"}</small></summary><label htmlFor={"dna-"+key}>{prompt}</label><textarea id={"dna-"+key} maxLength={1800} rows={4} value={dna[key]} onChange={e=>setDna(v=>({...v,[key]:e.target.value}))}/></details>)}</div><label className={styles.course}>Course lesson excerpts<textarea rows={6} maxLength={12000} value={course} onChange={e=>setCourse(e.target.value)} placeholder="Paste material you own or have permission to use. Include lesson title, principle, exercise, decision rule, and exceptions."/></label></section>}
    {tab==="tools"&&<section className={styles.panel}><p className={styles.kicker}>COURSE → METHOD → TOOL</p><h2>Ten tools. One production method.</h2><Link href="/tm-vocal">Open TM Vocal audio workspace →</Link><p>Guided briefs are available through Studio Brain. TM Vocal is available as a browser audio processor and a separate native alpha source project for VST3, Mac AU and standalone builds. Other guided concepts are not installed DAW plugins.</p><p><a href="https://github.com/jaacampbell/Music/tree/feat/native-tm-vocal/native/tm-vocal" target="_blank" rel="noreferrer">TM Vocal native source and installation guide ↗</a></p><div className={styles.toolGrid}>{toolConcepts.map((t,i)=><article key={t.id} className={styles.tool}><span className={styles.kicker}>{String(i+1).padStart(2,"0")} / GUIDED CONCEPT</span><h3>{t.name}</h3><p>{t.purpose}</p><details><summary>View product specification</summary><dl>{[["Target user",t.audience],["Problem",t.problem],["Features",t.features.join(" · ")],["Workflow",t.workflow],["Interface",t.ui],["AI role",t.ai],["Preset direction",t.presets.join(" · ")],["Current MVP scope",t.mvp],["Advanced scope",t.advanced],["Course mapping",t.lesson]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></details><button onClick={()=>{setQuestion(t.prompt);setTab("chat");}}>Start guided brief →</button></article>)}</div></section>}
    {tab==="knowledge"&&<section className={styles.panel}><p className={styles.kicker}>PRODUCTION + ARTIST BUSINESS</p><h2>Know the next move.</h2><p>Curated educational references, reviewed October 2, 2026. Not live policy monitoring or legal advice. Verify current requirements with the relevant organization.</p><label className={styles.search}>Search topics<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Publishing, vocals, sync, release, performance…"/></label><div className={styles.toolGrid}>{knowledge.filter(k=>(k.topic+" "+k.title+" "+k.guidance).toLowerCase().includes(search.toLowerCase())).map(k=><article key={k.id} className={styles.tool}><span className={styles.kicker}>{k.topic}</span><h3>{k.title}</h3><p>{k.guidance}</p><p><strong>Next:</strong> {k.next}</p>{k.jurisdiction&&<small>{k.jurisdiction}</small>}{k.source&&<a href={k.source.url} target="_blank" rel="noreferrer">{k.source.label} ↗</a>}<button onClick={()=>{setQuestion("Help me with "+k.topic+". Ask for the context you need.");setTab("chat");}}>Discuss this →</button></article>)}</div></section>}
    <footer className={styles.footer}>TM Music Studio · Your explicit instructions come first. No invented listening findings, rights clearances, or guaranteed outcomes.</footer>
  </main>;
}
