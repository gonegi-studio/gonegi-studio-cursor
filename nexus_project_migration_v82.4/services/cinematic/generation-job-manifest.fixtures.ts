import { buildGenerationJobManifest } from "./generation-job-manifest.ts";
import { GENERATOR_ADAPTER_OUTPUT_EXAMPLE } from "./generator-adapter.fixtures.ts";

export const GENERATION_JOB_MANIFEST_INPUT_EXAMPLE = GENERATOR_ADAPTER_OUTPUT_EXAMPLE;

export const GENERATION_JOB_MANIFEST_OUTPUT_EXAMPLE = buildGenerationJobManifest(
  GENERATION_JOB_MANIFEST_INPUT_EXAMPLE
);

export const GENERATION_JOB_MANIFEST_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  manifestId: "manifest-001",
  jobId: "job-001",
  sceneId: "scene-001",
  provider: "generic" as const,
  mode: "video" as const,
  prompt: "nostalgic;low;slow;fade;shot-001",
  durationSec: 5,
  status: "ready" as const,
});
