import { SEQUENCE_COMPOSITION_OUTPUT_EXAMPLE } from "./sequence.fixtures.ts";
import { buildPromptGraph } from "./prompt-graph.ts";

export const PROMPT_GRAPH_INPUT_EXAMPLE = SEQUENCE_COMPOSITION_OUTPUT_EXAMPLE;

export const PROMPT_GRAPH_OUTPUT_EXAMPLE = buildPromptGraph(PROMPT_GRAPH_INPUT_EXAMPLE);

export const PROMPT_GRAPH_NODE_OUTPUT_EXAMPLE = Object.freeze({
  nodeId: "node-001",
  segmentId: "segment-001",
  shotIds: Object.freeze(["shot-001"] as const),
  promptIntent: "nostalgic|low|slow-fade",
  tokenBudget: 56,
});
