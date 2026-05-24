import { PROMPT_GRAPH_OUTPUT_EXAMPLE } from "./prompt-graph.fixtures.ts";
import { compilePromptPack } from "./prompt-compiler.ts";

export const COMPILED_PROMPT_PACK_INPUT_EXAMPLE = PROMPT_GRAPH_OUTPUT_EXAMPLE;

export const COMPILED_PROMPT_PACK_OUTPUT_EXAMPLE = compilePromptPack(
  COMPILED_PROMPT_PACK_INPUT_EXAMPLE
);

export const COMPILED_PROMPT_UNIT_OUTPUT_EXAMPLE = Object.freeze({
  unitId: "prompt-001",
  nodeId: "node-001",
  prompt: "nostalgic;low;slow;fade;shot-001",
  tokenEstimate: 20,
});
