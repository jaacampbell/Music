export const MODULES = [
  "eq",
  "compression",
  "saturation",
  "reverb",
  "delay",
  "double",
  "limiter",
] as const;
export type Module = (typeof MODULES)[number];
export interface Chain {
  input: number;
  output: number;
  highpass: number;
  warmth: number;
  presence: number;
  air: number;
  threshold: number;
  ratio: number;
  drive: number;
  space: number;
  echo: number;
  delayTime: number;
  width: number;
  order: Module[];
}
export const DEFAULT_CHAIN: Chain = {
  input: 0,
  output: -2,
  highpass: 70,
  warmth: 0,
  presence: 1,
  air: 0,
  threshold: -22,
  ratio: 3,
  drive: 8,
  space: 12,
  echo: 8,
  delayTime: 250,
  width: 0,
  order: [...MODULES],
};
const bounds: Record<Exclude<keyof Chain, "order">, [number, number]> = {
  input: [-24, 18],
  output: [-24, 6],
  highpass: [20, 240],
  warmth: [-9, 9],
  presence: [-9, 9],
  air: [-9, 9],
  threshold: [-48, 0],
  ratio: [1, 12],
  drive: [0, 50],
  space: [0, 60],
  echo: [0, 60],
  delayTime: [60, 800],
  width: [0, 50],
};
export type Parameter = keyof typeof bounds;
export const PARAMETERS = bounds;
export function sanitizeChain(value: unknown): Chain {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const chain = { ...DEFAULT_CHAIN, order: [...DEFAULT_CHAIN.order] };
  for (const key of Object.keys(bounds) as Parameter[]) {
    const v = raw[key];
    if (typeof v === "number" && Number.isFinite(v))
      chain[key] = Math.max(bounds[key][0], Math.min(bounds[key][1], v));
  }
  if (Array.isArray(raw.order))
    chain.order = [
      ...new Set(
        raw.order.filter((v): v is Module => MODULES.includes(v as Module)),
      ),
    ];
  return chain;
}
export const PRESETS: Record<string, Partial<Chain>> = {
  "Baritone Forward": {
    highpass: 65,
    warmth: 1,
    presence: 2,
    air: 0,
    space: 7,
    echo: 4,
  },
  "Dry Southern Lead": {
    highpass: 75,
    warmth: 0,
    presence: 2,
    space: 3,
    echo: 0,
    drive: 12,
  },
  "Melodic Trap": { space: 20, echo: 15, air: 2, width: 12 },
  Rage: { threshold: -26, ratio: 5, drive: 24, presence: 3, space: 7 },
  "R&B": { threshold: -20, ratio: 2.5, drive: 5, space: 23, echo: 12, air: 2 },
  Pluggnb: { space: 28, echo: 22, air: 3, width: 20 },
  Drill: { space: 5, echo: 5, presence: 3, drive: 15 },
  Hyperpop: { drive: 25, space: 18, echo: 20, width: 25, air: 4 },
  Gospel: { space: 28, echo: 5, ratio: 2.5, air: 2, width: 12 },
};
export function presetChain(name: string, role: string): Chain {
  const chain = sanitizeChain({ ...DEFAULT_CHAIN, ...PRESETS[name] });
  if (role === "Adlib")
    return sanitizeChain({
      ...chain,
      highpass: 180,
      space: chain.space + 12,
      echo: chain.echo + 15,
      width: 25,
      output: -6,
    });
  if (role === "Double")
    return sanitizeChain({ ...chain, width: 28, output: -6, presence: 0 });
  if (role === "Harmony")
    return sanitizeChain({
      ...chain,
      width: 20,
      space: chain.space + 10,
      output: -5,
    });
  return chain;
}
export function commandChain(
  chain: Chain,
  text: string,
): { chain: Chain; explanation: string; changed: boolean } {
  const next = { ...chain, order: [...chain.order] };
  const reasons: string[] = [];
  const command = text.toLowerCase();
  const change = (key: Parameter, delta: number, reason: string) => {
    next[key] += delta;
    reasons.push(reason);
  };
  if (/darker|less bright/.test(command))
    change("air", -2, "Reduced the high shelf by 2 dB for a darker tone.");
  if (/brighter|more air/.test(command))
    change("air", 2, "Raised the high shelf by 2 dB for more air.");
  if (/less harsh|softer/.test(command))
    change(
      "presence",
      -2,
      "Reduced the 3 kHz presence band by 2 dB; audition consonant clarity.",
    );
  if (/more space|more reverb/.test(command))
    change(
      "space",
      8,
      "Increased the reverb blend by 8 points across the whole take.",
    );
  if (/drier|less reverb|less space/.test(command))
    change("space", -8, "Reduced the reverb blend by 8 points.");
  if (/more delay|more echo/.test(command))
    change("echo", 8, "Increased the delay blend by 8 points.");
  if (/less delay|less echo/.test(command))
    change("echo", -8, "Reduced the delay blend by 8 points.");
  if (/warmer|more body/.test(command))
    change("warmth", 1.5, "Raised the 220 Hz body band by 1.5 dB.");
  if (/less mud|less muddy/.test(command))
    change("warmth", -2, "Reduced the 220 Hz body band by 2 dB.");
  if (/more grit|more saturation/.test(command))
    change("drive", 8, "Increased saturation drive by 8 points.");
  if (/wider/.test(command))
    change("width", 10, "Increased the short-delay double blend by 10 points.");
  if (/louder/.test(command))
    change("output", 1, "Raised output by 1 dB; check exported peaks.");
  const clean = sanitizeChain(next);
  const changed = JSON.stringify(clean) !== JSON.stringify(chain);
  return {
    chain: clean,
    changed,
    explanation: reasons.length
      ? reasons.join(" ") +
        (/hook|verse|bridge/.test(command)
          ? " Section automation is not available yet; this change applies to the whole take."
          : "")
      : "Supported directions: darker, brighter, warmer, less harsh, less mud, more/less reverb, more/less delay, more grit, wider, louder. No settings changed.",
  };
}
