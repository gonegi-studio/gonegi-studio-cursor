import crypto from "node:crypto";
import { buildCinematicPipelinePreview, type CinematicPipelinePreview } from "./pipeline-preview.ts";

export const PIPELINE_PREVIEW_KEY_ORDER = Object.freeze([
  "version",
  "sceneDna",
  "evidence",
  "dataset",
  "storyboard",
] as const);

function canonicalizeValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    const canonicalItems = value.map((item) => canonicalizeValue(item));
    if (canonicalItems.every((item) => typeof item === "string")) {
      return [...(canonicalItems as string[])].sort((a, b) => a.localeCompare(b));
    }
    if (
      canonicalItems.every(
        (item) => item !== null && typeof item === "object" && "shotId" in (item as object)
      )
    ) {
      return [...canonicalItems].sort((a, b) =>
        (a as { shotId: string }).shotId.localeCompare((b as { shotId: string }).shotId)
      );
    }
    if (
      canonicalItems.every(
        (item) => item !== null && typeof item === "object" && "recordId" in (item as object)
      )
    ) {
      return [...canonicalItems].sort((a, b) => {
        const left = a as { partition?: string; recordId: string };
        const right = b as { partition?: string; recordId: string };
        const partitionCmp = (left.partition ?? "").localeCompare(right.partition ?? "");
        if (partitionCmp !== 0) {
          return partitionCmp;
        }
        return left.recordId.localeCompare(right.recordId);
      });
    }
    if (
      canonicalItems.every(
        (item) => item !== null && typeof item === "object" && "id" in (item as object)
      )
    ) {
      return [...canonicalItems].sort((a, b) =>
        (a as { id: string }).id.localeCompare((b as { id: string }).id)
      );
    }
    return canonicalItems;
  }

  const record = value as Record<string, unknown>;
  const ordered: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort((a, b) => a.localeCompare(b))) {
    ordered[key] = canonicalizeValue(record[key]);
  }
  return ordered;
}

export function serializePipelinePreview(preview?: CinematicPipelinePreview): string {
  const source = preview ?? buildCinematicPipelinePreview();
  const ordered: Record<string, unknown> = {};
  for (const key of PIPELINE_PREVIEW_KEY_ORDER) {
    ordered[key] = canonicalizeValue(source[key]);
  }
  return JSON.stringify(ordered);
}

export function computePipelineFingerprint(preview?: CinematicPipelinePreview): string {
  return crypto.createHash("sha256").update(serializePipelinePreview(preview)).digest("hex");
}
