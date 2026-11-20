import type { CouncilAdvisor, CouncilBoard } from "./catalog";

export type CouncilRole = "advisor" | "chair";
export interface CouncilPerspective {
  id: string;
  name: string;
  status: "completed" | "failed";
  analysis: string;
  error?: string;
}
export interface CouncilResult {
  status: "completed" | "incomplete";
  perspectives: CouncilPerspective[];
  verdict: string | null;
  failedCount: number;
}
export interface CouncilPrompt {
  role: CouncilRole;
  name: string;
  mandate: string;
  question: string;
  context: string;
  perspectives?: ReadonlyArray<CouncilPerspective>;
}
export type CouncilResponder = (prompt: CouncilPrompt) => Promise<string>;

async function conduct(
  advisor: CouncilAdvisor,
  question: string,
  context: string,
  respond: CouncilResponder
): Promise<CouncilPerspective> {
  try {
    const answer = (await respond({
      role: "advisor", name: advisor.name, mandate: advisor.focus, question, context
    })).trim();
    if (!answer) throw new Error("Empty model response");
    return { id: advisor.id, name: advisor.name, status: "completed", analysis: answer };
  } catch {
    // Incomplete reviews must remain incomplete; never fill in a fictional opinion.
    return { id: advisor.id, name: advisor.name, status: "failed", analysis: "", error: "Advisor unavailable" };
  }
}

/**
 * Concurrency bounded to protect model budget. Advisors are independent:
 * no member ever receives other advisors' text. Chair runs only on success.
 */
export async function runCouncil(args: {
  board: CouncilBoard;
  question: string;
  context: string;
  respond: CouncilResponder;
  concurrency?: number;
}): Promise<CouncilResult> {
  const { board, question, context, respond } = args;
  const concurrency = Math.min(3, Math.max(1, Math.trunc(args.concurrency ?? 2)));
  const perspectives: CouncilPerspective[] = new Array(board.advisors.length);
  let next = 0;
  async function work(): Promise<void> {
    while (next < board.advisors.length) {
      const index = next++;
      perspectives[index] = await conduct(board.advisors[index], question, context, respond);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, board.advisors.length) }, () => work()));
  const failedCount = perspectives.filter((item) => item.status === "failed").length;
  if (failedCount) return { status: "incomplete", perspectives, verdict: null, failedCount };
  try {
    const verdict = (await respond({
      role: "chair", name: board.chair,
      mandate: "Synthesize the independent reviews. Identify real disagreements, fact gaps, risk, recommendation, owner decision and the very next test. Do not claim consensus when there is none.",
      question, context, perspectives
    })).trim();
    if (!verdict) throw new Error("Empty chair response");
    return { status: "completed", perspectives, verdict, failedCount: 0 };
  } catch {
    return { status: "incomplete", perspectives, verdict: null, failedCount: 1 };
  }
}