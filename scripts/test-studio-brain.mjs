import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import ts from "typescript";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
function compile(path, overrides = {}, env = {}, fetcher) {
  const compiledModule = { exports: {} };
  const source = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const sandbox = { module: compiledModule, exports: compiledModule.exports, require: name => overrides[name] ?? require(name), process: { env }, fetch: fetcher, AbortSignal, console };
  vm.runInNewContext(source, sandbox, { filename: path });
  return compiledModule.exports;
}
const content = compile("lib/studio-brain/content.ts");
const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
function route(fetcher, live = false) {
  return compile("app/api/music-assistant/route.ts", {
    "next/server": { NextResponse: { json: (body, options) => new Response(JSON.stringify(body), { status: options?.status ?? 200 }) } },
    "@/lib/studio-brain/content": content
  }, { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test", ...(live ? {OPENAI_API_KEY:"test-only"} : {}) }, fetcher);
}
const request = (body, token = true) => new Request("http://localhost/api/music-assistant", { method: "POST", headers: { ...(token ? {Authorization:"Bearer test-session"} : {}), Cookie: "music-os-auth="+userId }, body: JSON.stringify(body) });
const ok = body => new Response(JSON.stringify(body));
async function run() {
  assert.equal(content.dnaFields.length,15);
  assert.equal(content.toolConcepts.length,10);
  assert.ok(content.retrieveKnowledge("publishing royalties").some(c=>c.source));
  let calls=0;
  let api=route(async()=>{calls++;return ok({id:userId});});
  assert.equal((await api.POST(request({question:"hello"},false))).status,401);
  assert.equal(calls,0,"An unsigned UUID cookie must not authorize spending.");
  api=route(async()=>new Response("invalid",{status:401}));
  assert.equal((await api.POST(request({question:"hello"}))).status,401);
  api=route(async()=>ok({id:userId}));
  assert.equal((await api.POST(request({question:""}))).status,400);
  assert.equal((await api.POST(request({question:"hello",projectId:"not-a-uuid"}))).status,400);
  const fallback=await (await api.POST(request({question:"vocal recording"}))).json();
  assert.equal(fallback.model,"guided-reference");
  assert.match(fallback.answer,/no live AI response/);
  api=route(async url=>url.includes("/auth/")?ok({id:userId}):ok([]));
  assert.equal((await api.POST(request({question:"mix",projectId}))).status,403);
  let sent;
  api=route(async(url,init)=>{
    if(url.includes("/auth/"))return ok({id:userId});
    if(url.includes("music_projects")){assert.ok(url.includes("user_id=eq."+userId));return ok([{id:projectId,title:"Verified song"}]);}
    if(url.includes("/rest/"))return ok([]);
    sent=JSON.parse(init.body);return ok({output:[{content:[{type:"output_text",text:"A bounded recommendation."}]}]});
  },true);
  const result=await (await api.POST(request({question:"mix",projectId,context:{project:{title:"SPOOFED"}},dna:{rules:"Preserve my words"},course:"My course lesson"}))).json();
  assert.equal(result.answer,"A bounded recommendation.");
  assert.ok(sent.input.includes("Verified song"));
  assert.ok(!sent.input.includes("SPOOFED"));
  assert.ok(sent.input.includes("Preserve my words"));
  assert.equal(sent.store,false);
  api=route(async url=>url.includes("/auth/")?ok({id:userId}):new Response('{"error":{"message":"sensitive provider detail"}}',{status:500}),true);
  const failure=await (await api.POST(request({question:"mix"}))).json();
  assert.equal(failure.model,"guided-reference");
  assert.ok(!JSON.stringify(failure).includes("sensitive"));
  api=route(async()=>ok({id:userId}));
  for(let i=0;i<10;i++)assert.equal((await api.POST(request({question:"mix"}))).status,200);
  assert.equal((await api.POST(request({question:"mix"}))).status,429);
  console.log("Studio Brain: content, authentication, project ownership, context integrity, provider fallback, and rate-limit checks passed.");
}
run().catch(e=>{console.error(e);process.exitCode=1;});
