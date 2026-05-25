import { buildPilotVideoManifest } from "./pilot-intake-schema.ts";

export const PILOT_VIDEO_MANIFEST_OUTPUT_EXAMPLE = buildPilotVideoManifest();

export const SCENE_SEGMENT_STUB_OUTPUT_EXAMPLE = Object.freeze({
  segmentId: "segment-001",
  segmentSlug: "harbor-opening-hold",
  orderIndex: 0,
  startSec: 0,
  endSec: 8,
  durationSec: 8,
  continuityState: "continuity-safe-harbor-opening",
});

export const FRAME_SAMPLE_STUB_OUTPUT_EXAMPLE = Object.freeze({
  frameSampleId: "frame-sample-001",
  segmentId: "segment-001",
  sampleIndex: 0,
  offsetSec: 4,
  sampleKind: "segment-midpoint-hold",
  extractionState: "frame-sample-stub-without-extraction",
});

export const INTAKE_EVIDENCE_STUB_OUTPUT_EXAMPLE = Object.freeze({
  evidenceId: "intake-evidence-001",
  evidenceKind: "segment-boundary-intake",
  linkedSegmentId: "segment-001",
  evidenceState: "intake-evidence-stub-ready",
  normalizationScore: 0.852333,
});
