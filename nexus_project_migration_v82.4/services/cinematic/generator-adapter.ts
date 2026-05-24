import crypto from "crypto";
import type { ScenePromptExport } from "./scene-prompt-export.ts";

export type GeneratorAdapterMode = "image" | "video";
export type GeneratorAdapterProvider = "generic";

export type GeneratorAdapterJob = {
  jobId: string;
  sceneId: string;
  prompt: string;
  durationSec: number;
  provider: GeneratorAdapterProvider;
  mode: GeneratorAdapterMode;
};

export type GeneratorAdapterPayload = {
  version: "v1";
  jobs: readonly GeneratorAdapterJob[];
};

export const GENERATOR_ADAPTER_PAYLOAD_VERSION = "v1" as const;
export const GENERATOR_ADAPTER_PROVIDER = "generic" as const;
export const GENERATOR_ADAPTER_MODE = "video" as const;

function buildJobId(index: number): string {
  return `job-${String(index + 1).padStart(3, "0")}`;
}

function buildAdapterJob(scene: ScenePromptExport["scenes"][number], index: number): GeneratorAdapterJob {
  return Object.freeze({
    jobId: buildJobId(index),
    sceneId: scene.sceneId,
    prompt: scene.prompt,
    durationSec: scene.durationSec,
    provider: GENERATOR_ADAPTER_PROVIDER,
    mode: GENERATOR_ADAPTER_MODE,
  });
}

export function buildGeneratorAdapterPayload(exportPack: ScenePromptExport): GeneratorAdapterPayload {
  const orderedScenes = [...exportPack.scenes].sort((a, b) => a.sceneId.localeCompare(b.sceneId));
  const jobs = Object.freeze(orderedScenes.map((scene, index) => buildAdapterJob(scene, index)));

  return Object.freeze({
    version: GENERATOR_ADAPTER_PAYLOAD_VERSION,
    jobs,
  });
}

export const GENERATOR_ADAPTER_JOB_KEY_ORDER = Object.freeze([
  "jobId",
  "sceneId",
  "prompt",
  "durationSec",
  "provider",
  "mode",
] as const);

export function serializeGeneratorAdapterPayload(payload: GeneratorAdapterPayload): string {
  const orderedJobs = [...payload.jobs]
    .sort((a, b) => a.sceneId.localeCompare(b.sceneId))
    .map((job) => {
      const ordered: Record<string, unknown> = {};
      for (const key of GENERATOR_ADAPTER_JOB_KEY_ORDER) {
        ordered[key] = job[key as keyof GeneratorAdapterJob];
      }
      return ordered;
    });

  return JSON.stringify({
    version: payload.version,
    jobs: orderedJobs,
  });
}

export function computeGeneratorAdapterFingerprint(payload: GeneratorAdapterPayload): string {
  return crypto.createHash("sha256").update(serializeGeneratorAdapterPayload(payload)).digest("hex");
}
