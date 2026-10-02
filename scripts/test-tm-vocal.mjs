import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import ts from "typescript";
function compile(path, overrides = {}) {
  const m = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      module: m,
      exports: m.exports,
      require: (n) => overrides[n],
      File,
      Blob,
      console,
    },
    { filename: path },
  );
  return m.exports;
}
const chain = compile("lib/tm-vocal/chain.ts");
const bounded = chain.sanitizeChain({
  input: Infinity,
  space: 999,
  ratio: -8,
  order: ["eq", "eq", "not-a-module"],
});
assert.equal(bounded.input, 0);
assert.equal(bounded.space, 60);
assert.equal(bounded.ratio, 1);
assert.deepEqual(Array.from(bounded.order), ["eq"]);
const change = chain.commandChain(
  chain.DEFAULT_CHAIN,
  "darker, more space on the hook, less harsh",
);
assert.equal(change.chain.air, -2);
assert.equal(change.chain.space, 20);
assert.equal(change.chain.presence, -1);
assert.match(change.explanation, /whole take/);
assert.equal(
  chain.commandChain(chain.DEFAULT_CHAIN, "remove all noise").changed,
  false,
);
for (const name of Object.keys(chain.PRESETS))
  for (const role of ["Lead", "Adlib", "Double", "Harmony"]) {
    const p = chain.presetChain(name, role);
    for (const [key, [lo, hi]] of Object.entries(chain.PARAMETERS))
      assert.ok(p[key] >= lo && p[key] <= hi);
  }
const audio = compile("lib/tm-vocal/audio.ts");
const wav = audio.encodeWav({
  numberOfChannels: 2,
  length: 3,
  sampleRate: 48000,
  getChannelData: (c) =>
    new Float32Array(c ? [0.25, -0.25, 2] : [0.5, -0.5, -2]),
});
const v = new DataView(wav);
assert.equal(wav.byteLength, 56);
assert.equal(v.getUint16(22, true), 2);
assert.equal(v.getUint32(24, true), 48000);
assert.equal(v.getInt16(52, true), -32768);
assert.equal(v.getInt16(54, true), 32767);
const projectId = "22222222-2222-4222-8222-222222222222",
  userId = "11111111-1111-4111-8111-111111111111";
async function handoff({
  owner = true,
  fail = false,
  verifyFail = false,
} = {}) {
  const calls = [],
    objects = new Map();
  let count = 0;
  const api = {
    getCurrentUser: async () => ({ id: userId }),
    supabaseRest: async (table, options) => {
      calls.push({ table, ...options });
      if (table === "music_projects")
        return owner ? [{ id: projectId, user_id: userId }] : [];
      if (options.method === "POST") {
        if (fail && options.body.kind === "other")
          throw new Error("Manifest write failed");
        return [{ id: "asset-" + ++count }];
      }
      return [];
    },
    uploadPrivateFile: async (id, file, folder) => {
      assert.equal(id, projectId);
      assert.equal(folder, "tm-vocal");
      const path = "private/" + file.name;
      objects.set(path, file);
      return path;
    },
    deletePrivateFile: async (path) => objects.delete(path),
    downloadPrivateFile: async (path) =>
      verifyFail ? new Blob(["{}"]) : objects.get(path),
  };
  const h = compile("lib/tm-vocal/handoff.ts", {
    "@/lib/persistence/supabase-rest": api,
  });
  let error;
  try {
    await h.saveHandoff(
      projectId,
      [
        {
          file: new File(["test"], "dry.wav", { type: "audio/wav" }),
          kind: "stem",
          label: "Dry",
        },
      ],
      { schema: "tm-vocal-session/v1" },
    );
  } catch (e) {
    error = e;
  }
  return { calls, objects, error };
}
const good = await handoff();
assert.equal(good.error, undefined);
assert.equal(good.objects.size, 2);
assert.equal(
  good.calls.filter((c) => c.method === "POST").at(-1).body.label,
  "TM Vocal session",
);
assert.ok(good.calls[0].query.includes("user_id=eq." + userId));
const denied = await handoff({ owner: false });
assert.match(denied.error.message, /not saved/);
assert.equal(denied.objects.size, 0);
for (const scenario of [{ fail: true }, { verifyFail: true }]) {
  const bad = await handoff(scenario);
  assert.ok(bad.error);
  assert.equal(bad.objects.size, 0);
  assert.ok(bad.calls.some((c) => c.method === "DELETE"));
}
console.log(
  "TM Vocal: bounded parameters, role presets, phrase mapping, WAV encoding, owner checks, manifest verification, and failed-upload cleanup passed.",
);
