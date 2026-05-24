import crypto from "crypto";
import type { GeneratorAdapterPayload } from "./generator-adapter.ts";

export type GenerationJobStatus = "ready";
export type GenerationJobManifestProvider = "generic";
export type GenerationJobManifestMode = "video";

export type GenerationJobManifestItem = {
  manifestId: string;
  jobId: string;
  sceneId: string;
  provider: GenerationJobManifestProvider;
  mode: GenerationJobManifestMode;
  prompt: string;
  durationSec: number;
  status: GenerationJobStatus;
};

export type GenerationJobManifest = {
  version: "v1";
  items: readonly GenerationJobManifestItem[];
};

export const GENERATION_JOB_MANIFEST_VERSION = "v1" as const;
export const GENERATION_JOB_MANIFEST_STATUS = "ready" as const;

function buildManifestId(index: number): string {
  return `manifest-${String(index + 1).padStart(3, "0")}`;
}

function buildManifestItem(
  job: GeneratorAdapterPayload["jobs"][number],
  index: number
): GenerationJobManifestItem {
  return Object.freeze({
    manifestId: buildManifestId(index),
    jobId: job.jobId,
    sceneId: job.sceneId,
    provider: job.provider as GenerationJobManifestProvider,
    mode: job.mode as GenerationJobManifestMode,
    prompt: job.prompt,
    durationSec: job.durationSec,
    status: GENERATION_JOB_MANIFEST_STATUS,
  });
}

export function buildGenerationJobManifest(payload: GeneratorAdapterPayload): GenerationJobManifest {
  const orderedJobs = [...payload.jobs].sort((a, b) => a.jobId.localeCompare(b.jobId));
  const items = Object.freeze(orderedJobs.map((job, index) => buildManifestItem(job, index)));

  return Object.freeze({
    version: GENERATION_JOB_MANIFEST_VERSION,
    items,
  });
}

export const GENERATION_JOB_MANIFEST_ITEM_KEY_ORDER = Object.freeze([
  "manifestId",
  "jobId",
  "sceneId",
  "provider",
  "mode",
  "prompt",
  "durationSec",
  "status",
] as const);

export function serializeGenerationJobManifest(manifest: GenerationJobManifest): string {
  const orderedItems = [...manifest.items]
    .sort((a, b) => a.jobId.localeCompare(b.jobId))
    .map((item) => {
      const ordered: Record<string, unknown> = {};
      for (const key of GENERATION_JOB_MANIFEST_ITEM_KEY_ORDER) {
        ordered[key] = item[key as keyof GenerationJobManifestItem];
      }
      return ordered;
    });

  return JSON.stringify({
    version: manifest.version,
    items: orderedItems,
  });
}

export function computeGenerationJobManifestFingerprint(manifest: GenerationJobManifest): string {
  return crypto.createHash("sha256").update(serializeGenerationJobManifest(manifest)).digest("hex");
}
