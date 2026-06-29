import { getProducerDnaForAgent, listProducerDnaRecords } from "@/lib/producer-dna/store";

const producerNames = (): Array<{ id: string; name: string }> =>
  listProducerDnaRecords().map((r) => ({ id: r.producer.id, name: r.producer.name }));

/** Detect a Batch 001 producer reference in an agent command. */
export const findProducerInCommand = (command: string): string | null => {
  const lowered = command.toLowerCase();
  for (const { id, name } of producerNames()) {
    if (lowered.includes(name.toLowerCase())) return id;
  }
  const idMatch = command.match(/PDNA-\d{6}/i);
  return idMatch ? idMatch[0].toUpperCase() : null;
};

export const buildProducerDnaPromptContext = (
  command: string
): { tier2Examples: string[]; tier3Summary: string } | null => {
  const producerId = findProducerInCommand(command);
  if (!producerId) return null;
  const context = getProducerDnaForAgent(producerId);
  if (!context) return null;
  return {
    tier2Examples: context.tier2Examples,
    tier3Summary: context.tier3Summary
  };
};
