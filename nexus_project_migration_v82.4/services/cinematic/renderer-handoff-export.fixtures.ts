import { MUSIC_DRAMA_GENERATOR_PAYLOAD_OUTPUT_EXAMPLE } from "./music-drama-generator-payload.fixtures.ts";
import {
  buildRendererHandoffExport,
  computeRendererHandoffExportFingerprint,
} from "./renderer-handoff-export.ts";

export const RENDERER_HANDOFF_EXPORT_INPUT_EXAMPLE = MUSIC_DRAMA_GENERATOR_PAYLOAD_OUTPUT_EXAMPLE;

export const RENDERER_HANDOFF_EXPORT_OUTPUT_EXAMPLE = buildRendererHandoffExport(
  RENDERER_HANDOFF_EXPORT_INPUT_EXAMPLE
);

export const RENDERER_HANDOFF_EXPORT_FINGERPRINT = computeRendererHandoffExportFingerprint(
  RENDERER_HANDOFF_EXPORT_OUTPUT_EXAMPLE
);

export const RENDERER_HANDOFF_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  target: "image-renderer" as const,
  mode: "image" as const,
  promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
  continuityAnchor: "continuity-anchor-segment-001",
  outputSlot: "generator-output-slot-segment-001-queue-000",
  adapterHint: "generic-image-adapter-v1",
});

export const RENDERER_HANDOFF_EXPORT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  handoffExportId: "renderer-handoff-export-gonegi-harbor-25s-v1",
  handoffExportVersion: "renderer-handoff-export-v1" as const,
  activeHandoffExportState: "25s-renderer-handoff-export-metadata-only",
});
