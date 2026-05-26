import { REAL_MP4_FRAME_EXTRACTION_OUTPUT_EXAMPLE } from "./real-mp4-frame-extraction.fixtures.ts";
import {
  buildRealFrameEvidenceRegistry,
  computeRealFrameEvidenceRegistryFingerprint,
} from "./real-frame-evidence-registry.ts";

export const REAL_FRAME_EVIDENCE_REGISTRY_INPUT_EXAMPLE = Object.freeze({
  realMp4FrameExtraction: REAL_MP4_FRAME_EXTRACTION_OUTPUT_EXAMPLE,
});

export const REAL_FRAME_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE = buildRealFrameEvidenceRegistry(
  REAL_FRAME_EVIDENCE_REGISTRY_INPUT_EXAMPLE.realMp4FrameExtraction
);

export const REAL_FRAME_EVIDENCE_REGISTRY_FINGERPRINT = computeRealFrameEvidenceRegistryFingerprint(
  REAL_FRAME_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE
);

export const REAL_FRAME_EVIDENCE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  timestampSeconds: "4.000",
  framePath:
    "storage/pilot-intake/real-extraction/frames/kiki-real-keyframe-001-4.000.jpg",
  evidenceStatus: "registered" as const,
});

export const REAL_FRAME_EVIDENCE_REGISTRY_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  registryId: REAL_FRAME_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE.registryId,
  registryVersion: "real-frame-evidence-registry-v1" as const,
  activeRegistryState: "25s-real-frame-evidence-registry-metadata-only",
  registryStatus: REAL_FRAME_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE.registryStatus,
  totalFrameCount: 3,
  registeredFrameCount: REAL_FRAME_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE.registeredFrameCount,
});
