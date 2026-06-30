import crypto from "node:crypto";

import type { PromptCacheTelemetry } from "@/lib/types";

export interface PromptBuildInput {
  templateId: string;
  systemPrefix: string;
  tier1Facts: string;
  tier2Examples: string[];
  tier3Summary: string;
  revisionDelta?: string;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

interface CacheEntry {
  cacheKey: string;
  prompt: string;
  createdAt: string;
}

const promptCache = new Map<string, CacheEntry>();

const DEFAULT_MAX_INPUT_TOKENS = 1800;
const DEFAULT_MAX_OUTPUT_TOKENS = 700;

const estimateTokens = (value: string): number => {
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.3);
};

const hash = (value: string): string =>
  crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);

const clamp = (value: string, tokenLimit: number): string => {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const roughLimit = Math.max(40, Math.floor(tokenLimit / 1.3));
  return words.slice(0, roughLimit).join(" ");
};

export const buildPromptWithCache = (
  input: PromptBuildInput
): { prompt: string; telemetry: PromptCacheTelemetry } => {
  const maxInputTokens = input.maxInputTokens ?? DEFAULT_MAX_INPUT_TOKENS;
  const maxOutputTokens = input.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;

  const tier2 = input.tier2Examples.join("\n");
  const assembled = [
    input.systemPrefix,
    `Template:${input.templateId}`,
    `Tier1:${input.tier1Facts}`,
    `Tier2:${tier2}`,
    `Tier3:${input.tier3Summary}`,
    `Delta:${input.revisionDelta ?? "none"}`
  ].join("\n\n");

  const trimmedPrompt = clamp(assembled, maxInputTokens);
  const cacheKey = hash(
    [
      input.templateId,
      hash(input.systemPrefix),
      hash(input.tier1Facts),
      hash(tier2),
      hash(input.tier3Summary),
      hash(input.revisionDelta ?? "")
    ].join("|")
  );

  const cached = promptCache.get(cacheKey);
  if (cached) {
    const inputTokens = estimateTokens(cached.prompt);
    return {
      prompt: cached.prompt,
      telemetry: {
        cacheKey,
        cacheHit: true,
        inputTokens,
        outputTokens: maxOutputTokens,
        tokensSaved: inputTokens,
        templateId: input.templateId
      }
    };
  }

  const entry: CacheEntry = {
    cacheKey,
    prompt: trimmedPrompt,
    createdAt: new Date().toISOString()
  };
  promptCache.set(cacheKey, entry);

  const inputTokens = estimateTokens(trimmedPrompt);
  return {
    prompt: trimmedPrompt,
    telemetry: {
      cacheKey,
      cacheHit: false,
      inputTokens,
      outputTokens: maxOutputTokens,
      tokensSaved: 0,
      templateId: input.templateId
    }
  };
};

export const getPromptCacheStats = (): {
  entries: number;
  keys: string[];
} => ({
  entries: promptCache.size,
  keys: [...promptCache.keys()]
});
