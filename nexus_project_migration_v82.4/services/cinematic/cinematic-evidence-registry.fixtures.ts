import { MULTI_SEGMENT_CONTROLLED_EXTRACTION_OUTPUT_EXAMPLE } from "./multi-segment-controlled-extraction.fixtures.ts";
import {
  buildCinematicEvidenceRegistry,
  buildSegmentManifestSerialization,
  computeCinematicEvidenceRegistryFingerprint,
  computeSegmentManifestSerializationFingerprint,
} from "./cinematic-evidence-registry.ts";

export const SEGMENT_MANIFEST_SERIALIZATION_INPUT_EXAMPLE =
  MULTI_SEGMENT_CONTROLLED_EXTRACTION_OUTPUT_EXAMPLE;

export const SEGMENT_MANIFEST_SERIALIZATION_OUTPUT_EXAMPLE = buildSegmentManifestSerialization(
  SEGMENT_MANIFEST_SERIALIZATION_INPUT_EXAMPLE
);

export const SEGMENT_MANIFEST_SERIALIZATION_FINGERPRINT =
  computeSegmentManifestSerializationFingerprint(SEGMENT_MANIFEST_SERIALIZATION_OUTPUT_EXAMPLE);

export const CINEMATIC_EVIDENCE_REGISTRY_INPUT_EXAMPLE = SEGMENT_MANIFEST_SERIALIZATION_OUTPUT_EXAMPLE;

export const CINEMATIC_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE = buildCinematicEvidenceRegistry(
  CINEMATIC_EVIDENCE_REGISTRY_INPUT_EXAMPLE
);

export const CINEMATIC_EVIDENCE_REGISTRY_FINGERPRINT = computeCinematicEvidenceRegistryFingerprint(
  CINEMATIC_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE
);

export const CINEMATIC_EVIDENCE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  segmentId: "segment-001",
  queueOrder: 0,
  cinematicRole: "harbor-opening-anchor",
  cinematicPhase: "opening-hold",
  emotionalPhase: "nostalgic-calm",
  framePaths: Object.freeze([
    "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
  ]),
  segmentPath: "",
  startSeconds: 0,
  endSeconds: 8,
  durationSeconds: 8,
  evidenceBindingVersion: "cinematic-evidence-binding-v1" as const,
});

export const CINEMATIC_EVIDENCE_TIMELINE_ENTRY_OUTPUT_EXAMPLE = Object.freeze({
  timelineIndex: 0,
  queueOrder: 0,
  segmentId: "segment-001",
  bindingKind: "frame-export" as const,
});

export const CINEMATIC_EVIDENCE_REGISTRY_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  registryId: "cinematic-evidence-registry-gonegi-harbor-25s-v1",
  registryRoot: "storage/pilot-intake/evidence-registry/",
  activeRegistryState: "25s-cinematic-evidence-registry-metadata-only",
  evidenceBindingVersion: "cinematic-evidence-binding-v1" as const,
});
