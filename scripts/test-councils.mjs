/* Minimal deterministic Council Engine regression suite; no API calls or test secrets. */
import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createRequire } from "node:module";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname || process.cwd(), "..");
const scratch = mkdtempSync(join(tmpdir(), "music-council-test-"));
after(() => rmSync(scratch, { recursive: true, force: true }));
writeFileSync(join(scratch, "package.json"), '{"type":"commonjs"}');
for (const name of ["catalog", "engine"]) {
  const source = readFileSync(join(root, "lib/councils", name + ".ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    fileName: name + ".ts",
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  });
  writeFileSync(join(scratch, name + ".js"), compiled.outputText);
}
const require = createRequire(import.meta.url);
const { COUNCIL_BOARDS, getCouncilBoard } = require(join(scratch, "catalog.js"));
const { runCouncil } = require(join(scratch, "engine.js"));

test("all named boards have distinct independent advisors", () => {
  assert.equal(Object.keys(COUNCIL_BOARDS).length, 8);
  for (const board of Object.values(COUNCIL_BOARDS)) {
    assert.equal(board.advisors.length, 5);
    assert.equal(new Set(board.advisors.map(a => a.id)).size, 5);
    assert.ok(board.chair);
  }
  assert.equal(getCouncilBoard("__proto__"), undefined);
  assert.equal(getCouncilBoard("music-ar").name, "Music · A&R Council");
});

test("advisors cannot read each other's opinions; chair sees all", async () => {
  const calls = [];
  const outcome = await runCouncil({
    board: COUNCIL_BOARDS.decision, question: "Test this decision", context: "Facts vs assumptions",
    respond: async prompt => {
      calls.push(prompt);
      return prompt.role === "chair" ? "VERDICT: Test first" : "CORE FINDING: " + prompt.name;
    }
  });
  assert.equal(outcome.status, "completed");
  assert.equal(outcome.perspectives.length, 5);
  assert.equal(outcome.verdict, "VERDICT: Test first");
  assert.equal(calls.length, 6);
  assert.ok(calls.filter(c => c.role === "advisor").every(c => c.perspectives === undefined));
  assert.equal(calls.at(-1).role, "chair");
  assert.equal(calls.at(-1).perspectives.length, 5);
});

test("one missing advisor means no invented verdict", async () => {
  let chairCalls = 0;
  const outcome = await runCouncil({
    board: COUNCIL_BOARDS["music-ar"], question: "Evaluate song", context: "",
    respond: async prompt => {
      if (prompt.role === "chair") chairCalls++;
      if (prompt.name === "A&R Critic") throw new Error("provider outage");
      return "Evidence-dependent answer";
    }
  });
  assert.equal(outcome.status, "incomplete");
  assert.equal(outcome.verdict, null);
  assert.equal(chairCalls, 0);
  assert.equal(outcome.failedCount, 1);
  assert.equal(outcome.perspectives.filter(p => p.status === "failed").length, 1);
});

test("chair failure is explicitly incomplete, never a fake recommendation", async () => {
  const outcome = await runCouncil({
    board: COUNCIL_BOARDS.creative, question: "Storyboard", context: "",
    respond: async prompt => {
      if (prompt.role === "chair") throw new Error("chair unavailable");
      return "Evidence-dependent answer";
    }
  });
  assert.equal(outcome.status, "incomplete");
  assert.equal(outcome.verdict, null);
});

test("concurrency is capped and output order remains board order", async () => {
  let active = 0;
  let maxActive = 0;
  const outcome = await runCouncil({
    board: COUNCIL_BOARDS.engineering, question: "Review release", context: "",
    concurrency: 200,
    respond: async prompt => {
      if (prompt.role === "chair") return "VERDICT: Check rollback";
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise(resolve => setTimeout(resolve, 5));
      active--;
      return prompt.name;
    }
  });
  assert.ok(maxActive <= 3);
  assert.deepEqual(outcome.perspectives.map(p => p.name),
    COUNCIL_BOARDS.engineering.advisors.map(a => a.name));
});

test("empty model responses are failures, not votes", async () => {
  const result = await runCouncil({
    board: COUNCIL_BOARDS.executive, question: "Business", context: "",
    respond: async prompt => prompt.role === "advisor" ? "  " : "VERDICT"
  });
  assert.equal(result.status, "incomplete");
  assert.equal(result.failedCount, 5);
  assert.equal(result.verdict, null);
});
