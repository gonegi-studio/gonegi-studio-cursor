import { buildGeneratorAdapterPayload } from "./generator-adapter.ts";
import { SCENE_PROMPT_EXPORT_OUTPUT_EXAMPLE } from "./scene-prompt-export.fixtures.ts";

export const GENERATOR_ADAPTER_INPUT_EXAMPLE = SCENE_PROMPT_EXPORT_OUTPUT_EXAMPLE;

export const GENERATOR_ADAPTER_OUTPUT_EXAMPLE = buildGeneratorAdapterPayload(
  GENERATOR_ADAPTER_INPUT_EXAMPLE
);

export const GENERATOR_ADAPTER_JOB_OUTPUT_EXAMPLE = Object.freeze({
  jobId: "job-001",
  sceneId: "scene-001",
  prompt: "nostalgic;low;slow;fade;shot-001",
  durationSec: 5,
  provider: "generic" as const,
  mode: "video" as const,
});
