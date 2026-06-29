import { buildPromptWithCache } from "@/lib/prompt-cache";
import { runAgentLoop, runAnalysis, runExport, runExtraction } from "@/lib/store";

export interface AgentDecision {
  intent: string;
  stemMode: 2 | 4 | 6 | 10;
  modelProfile:
    | "htdemucs-default"
    | "mdx-power-user"
    | "spleeter-fast"
    | "openunmix-cpu"
    | "api-fallback";
  actions: Array<"extract" | "analyze" | "export">;
  exportProfile?: "wav-zip" | "reaper-rpp" | "ableton-folder" | "logic-folder";
}

const chooseStemMode = (command: string): 2 | 4 | 6 | 10 => {
  if (/\b10\s*stems?\b/i.test(command)) return 10;
  if (/\b6\s*stems?\b/i.test(command)) return 6;
  if (/\b2\s*stems?\b/i.test(command) || /\bkaraoke\b/i.test(command)) return 2;
  return 4;
};

const chooseModel = (command: string): AgentDecision["modelProfile"] => {
  const lowered = command.toLowerCase();
  if (lowered.includes("fast")) return "spleeter-fast";
  if (lowered.includes("cpu")) return "openunmix-cpu";
  if (lowered.includes("power")) return "mdx-power-user";
  if (lowered.includes("api")) return "api-fallback";
  return "htdemucs-default";
};

const chooseExport = (
  command: string
): AgentDecision["exportProfile"] | undefined => {
  const lowered = command.toLowerCase();
  if (lowered.includes("reaper")) return "reaper-rpp";
  if (lowered.includes("ableton")) return "ableton-folder";
  if (lowered.includes("logic") || lowered.includes("garageband")) {
    return "logic-folder";
  }
  if (lowered.includes("export")) return "wav-zip";
  return undefined;
};

export const decideAgentPlan = (command: string): AgentDecision => {
  const stemMode = chooseStemMode(command);
  const exportProfile = chooseExport(command);
  const actions: AgentDecision["actions"] = ["extract", "analyze"];
  if (exportProfile) {
    actions.push("export");
  }
  return {
    intent: command.trim() || "Run full production loop",
    stemMode,
    modelProfile: chooseModel(command),
    actions,
    exportProfile
  };
};

export const executeAgentCommand = (
  projectId: string,
  command: string
): {
  decision: AgentDecision;
  jobIds: string[];
  promptPreview: string;
  cacheHit: boolean;
  tokensSaved: number;
} => {
  const decision = decideAgentPlan(command);
  const { prompt, telemetry } = buildPromptWithCache({
    templateId: "agentic-beat-lab-router-v1",
    systemPrefix:
      "You are the Agentic Beat Lab OS. Keep outputs structured, rights-safe, and iteration-focused.",
    tier1Facts: `Intent:${decision.intent}\nStemMode:${decision.stemMode}\nModel:${decision.modelProfile}`,
    tier2Examples: [
      "Approved example: Version 2 drums + Version 1 atmosphere.",
      "Rejected pattern: crowded 2-4k range blocks vocal pocket."
    ],
    tier3Summary:
      "Long-term memory: preserve originality, maintain stem alignment, and explain limitations clearly.",
    revisionDelta: command
  });

  const jobIds: string[] = [];
  const loopJob = runAgentLoop(projectId, command, telemetry);
  if (loopJob) jobIds.push(loopJob.id);

  if (decision.actions.includes("extract")) {
    const extractJob = runExtraction(projectId, decision.stemMode);
    if (extractJob) jobIds.push(extractJob.id);
  }
  if (decision.actions.includes("analyze")) {
    const analyzeJob = runAnalysis(projectId);
    if (analyzeJob) jobIds.push(analyzeJob.id);
  }
  if (decision.actions.includes("export") && decision.exportProfile) {
    const exportJob = runExport(projectId, decision.exportProfile);
    if (exportJob) jobIds.push(exportJob.id);
  }

  return {
    decision,
    jobIds,
    promptPreview: prompt,
    cacheHit: telemetry.cacheHit,
    tokensSaved: telemetry.tokensSaved
  };
};
