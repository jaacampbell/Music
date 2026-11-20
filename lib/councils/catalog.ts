/**
 * Shared Council Engine catalog. Each advisor receives the same evidence but no
 * other advisor's answer; only the chair sees the finished set.
 */
export interface CouncilAdvisor {
  id: string;
  name: string;
  focus: string;
}
export interface CouncilBoard {
  id: string;
  name: string;
  description: string;
  chair: string;
  advisors: readonly CouncilAdvisor[];
}
export const COUNCIL_BOARDS = {
  decision: {
    id: "decision", name: "Decision Council",
    description: "Pressure-test an idea before you commit money or time.",
    chair: "Independent Chairman",
    advisors: [
      { id: "contrarian", name: "Contrarian", focus: "Find the fatal flaw, the weak assumption, and the uncomfortable truth." },
      { id: "first-principles", name: "First-Principles Thinker", focus: "Strip away noise. Identify the core question and smallest valid test." },
      { id: "expansionist", name: "Expansionist", focus: "Find missing upside and a practical third option." },
      { id: "outsider", name: "Outsider", focus: "Challenge the positioning as a skeptical customer or competitor." },
      { id: "executor", name: "Executor", focus: "Define the concrete next three actions, success metric and stop signal." }
    ]
  },
  "music-ar": {
    id: "music-ar", name: "Music · A&R Council",
    description: "Evaluate songs, lyrics, hooks, originality, emotional arc and album fit.",
    chair: "Head of A&R",
    advisors: [
      { id: "songwriter", name: "Songwriter", focus: "Analyze hook, structure, lyrics, storytelling, memorability and revisions." },
      { id: "producer", name: "Record Producer", focus: "Review production concept, dynamics, arrangement and sonic identity using only provided evidence." },
      { id: "ar", name: "A&R Critic", focus: "Challenge the song's distinctive point of view, artistic fit and commercial readiness without claiming it will be a hit." },
      { id: "audience", name: "Audience & Culture", focus: "Assess audience resonance, authentic New Orleans context and discoverability without inventing streaming metrics." },
      { id: "rights", name: "Originality & Rights", focus: "Flag potential originality, sample, split and clearance questions; never invent ownership or legal conclusions." }
    ]
  },
  "music-production": {
    id: "music-production", name: "Music · Production Council",
    description: "Critique vocal recording, mixing, mastering and delivery readiness.",
    chair: "Executive Producer",
    advisors: [
      { id: "vocal", name: "Vocal Producer", focus: "Review performance direction, breath control, articulation and delivery from supplied notes only." },
      { id: "mix", name: "Mix Engineer", focus: "Identify arrangement masking, vocal placement, dynamics, tonal balance and mixing experiments." },
      { id: "master", name: "Mastering Engineer", focus: "Assess export and mastering readiness; do not invent measured LUFS or claim to have heard audio." },
      { id: "quality", name: "Technical QC", focus: "Find missing deliverables, format checks, clipping risks, mono compatibility and session hygiene." },
      { id: "listener", name: "Critical Listener", focus: "Challenge whether the listener understands the emotion and main musical idea." }
    ]
  },
  "music-release": {
    id: "music-release", name: "Music · Release Council",
    description: "Decide sequencing, campaign readiness and commercial launch priorities.",
    chair: "Artist Executive Director",
    advisors: [
      { id: "release", name: "Release Manager", focus: "Check asset readiness, deadlines, dependencies and delivery gates." },
      { id: "publicity", name: "Publicity Director", focus: "Evaluate narrative, media opportunities, interviews and campaign integrity." },
      { id: "sync", name: "Sync & Licensing", focus: "Review clean/instrumental/stem packages, metadata and clearance questions without inventing approvals." },
      { id: "growth", name: "Audience Growth", focus: "Design a realistic distribution and content test using verified audience signals." },
      { id: "finance", name: "Release Finance", focus: "Challenge spend, opportunity cost, conversion assumptions and budget caps." }
    ]
  },
  "artist-brand": {
    id: "artist-brand", name: "JO₵YN · Brand & PR Council",
    description: "Pressure-test artist positioning, imagery, publicity and cultural authenticity.",
    chair: "Creative Executive",
    advisors: [
      { id: "creative", name: "Creative Director", focus: "Preserve distinctive typography, visual references and premium editorial art direction." },
      { id: "pr", name: "Publicist", focus: "Challenge the story a journalist or booker would actually care about." },
      { id: "identity", name: "Brand Strategist", focus: "Check positioning, coherence and long-term artist identity." },
      { id: "outsider", name: "Cultural Outsider", focus: "Flag generic aesthetics, confusing copy, appropriation risks and tired tropes." },
      { id: "executor", name: "Campaign Producer", focus: "Specify feasible assets, sequencing, deadlines and approval gates." }
    ]
  },
  creative: {
    id: "creative", name: "Creative Production Council",
    description: "Evaluate cinematic concepts, art direction and production feasibility.",
    chair: "Executive Creative Director",
    advisors: [
      { id: "director", name: "Film Director", focus: "Evaluate visual storytelling, scene continuity, camera logic and pacing." },
      { id: "dp", name: "Cinematographer", focus: "Critique lighting, optics, blocking and physical realism." },
      { id: "art", name: "Art Director", focus: "Check references, wardrobe, set design, color and typography continuity." },
      { id: "producer", name: "Line Producer", focus: "Challenge timeline, credits, costs and practical production method." },
      { id: "audience", name: "Audience Critic", focus: "Evaluate clarity, emotional effect and platform fit." }
    ]
  },
  executive: {
    id: "executive", name: "Executive Leadership Council",
    description: "Review commercial, operational and technical business decisions.",
    chair: "Executive Director",
    advisors: [
      { id: "ceo", name: "CEO", focus: "Challenge strategy, customer value and business positioning." },
      { id: "coo", name: "COO", focus: "Examine real-world operations, fulfillment and dependencies." },
      { id: "cfo", name: "CFO", focus: "Evaluate cash risk, margin, opportunity cost and verified budget." },
      { id: "cto", name: "CTO", focus: "Review implementation risk, security, maintainability and verifiability." },
      { id: "cmo", name: "CMO", focus: "Review customer acquisition, creative positioning and launch conversion." }
    ]
  },
  engineering: {
    id: "engineering", name: "Engineering Release Council",
    description: "Assess shipping decisions with a bias for security and recovery.",
    chair: "Release Director",
    advisors: [
      { id: "security", name: "Security Engineer", focus: "Flag authentication, privacy, RLS, trust boundaries and secret-handling risks." },
      { id: "reliability", name: "Reliability Engineer", focus: "Challenge rollback, retries, incident response and race conditions." },
      { id: "ux", name: "Product & Accessibility", focus: "Test the user journey, accessibility and error recovery." },
      { id: "qa", name: "QA Lead", focus: "Define executable acceptance cases, failures and evidence needed." },
      { id: "cost", name: "Engineering Manager", focus: "Minimize complexity, build cost, technical debt and premature rewrites." }
    ]
  }
} satisfies Record<string, CouncilBoard>;
export type CouncilBoardId = keyof typeof COUNCIL_BOARDS;
export function getCouncilBoard(id: string): CouncilBoard | undefined {
  return Object.prototype.hasOwnProperty.call(COUNCIL_BOARDS, id)
    ? COUNCIL_BOARDS[id as CouncilBoardId] : undefined;
}
export const councilSummaries = Object.values(COUNCIL_BOARDS).map(({ id, name, description, advisors }) => ({
  id, name, description, advisors: advisors.map(({ id: advisorId, name: advisorName }) => ({ id: advisorId, name: advisorName }))
}));