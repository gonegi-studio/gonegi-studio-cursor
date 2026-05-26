import { REAL_FRAME_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE } from "./real-frame-evidence-registry.fixtures.ts";
import {
  buildRealFrameVisualDnaSeed,
  computeRealFrameVisualDnaSeedFingerprint,
} from "./real-frame-visual-dna-seed.ts";

export const REAL_FRAME_VISUAL_DNA_SEED_INPUT_EXAMPLE = Object.freeze({
  realFrameEvidenceRegistry: REAL_FRAME_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE,
});

export const REAL_FRAME_VISUAL_DNA_SEED_OUTPUT_EXAMPLE = buildRealFrameVisualDnaSeed(
  REAL_FRAME_VISUAL_DNA_SEED_INPUT_EXAMPLE.realFrameEvidenceRegistry
);

export const REAL_FRAME_VISUAL_DNA_SEED_FINGERPRINT = computeRealFrameVisualDnaSeedFingerprint(
  REAL_FRAME_VISUAL_DNA_SEED_OUTPUT_EXAMPLE
);

export const REAL_FRAME_VISUAL_DNA_SEED_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  timestampSeconds: "4.000",
  estimatedSceneType: "harbor-town" as const,
  estimatedEmotionTone: "nostalgic-calm" as const,
  seedSource: "deterministic-structural-analysis" as const,
  seedStatus: "seed-ready" as const,
});

export const REAL_FRAME_VISUAL_DNA_SEED_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  seedRootId: REAL_FRAME_VISUAL_DNA_SEED_OUTPUT_EXAMPLE.seedRootId,
  seedVersion: "real-frame-visual-dna-seed-v1" as const,
  activeSeedState: "25s-real-frame-visual-dna-seed-deterministic-structural-only",
  seedBuildStatus: REAL_FRAME_VISUAL_DNA_SEED_OUTPUT_EXAMPLE.seedBuildStatus,
  totalSeedCount: 3,
  readySeedCount: REAL_FRAME_VISUAL_DNA_SEED_OUTPUT_EXAMPLE.readySeedCount,
});
