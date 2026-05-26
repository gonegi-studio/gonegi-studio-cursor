import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import { REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_FINGERPRINT } from "./real-temporal-deduped-completion-snapshot.fixtures.ts";
import {
  buildRealCinematicMemoryContinuityPreview,
  buildRealCinematicMemoryContinuitySnapshotFromPackage,
  computeRealCinematicMemoryContinuitySnapshotFingerprint,
} from "./real-cinematic-memory-continuity.ts";

export const REAL_CINEMATIC_MEMORY_CONTINUITY_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
  completionSnapshotFingerprint: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_FINGERPRINT,
});

export const REAL_CINEMATIC_MEMORY_CONTINUITY_OUTPUT_EXAMPLE =
  buildRealCinematicMemoryContinuitySnapshotFromPackage(
    REAL_CINEMATIC_MEMORY_CONTINUITY_INPUT_EXAMPLE.realImageAppInputPackage,
    {
      completionSnapshotFingerprint:
        REAL_CINEMATIC_MEMORY_CONTINUITY_INPUT_EXAMPLE.completionSnapshotFingerprint,
    }
  );

export const REAL_CINEMATIC_MEMORY_CONTINUITY_PREVIEW_OUTPUT_EXAMPLE =
  buildRealCinematicMemoryContinuityPreview();

export const REAL_CINEMATIC_MEMORY_CONTINUITY_FINGERPRINT =
  computeRealCinematicMemoryContinuitySnapshotFingerprint(
    REAL_CINEMATIC_MEMORY_CONTINUITY_OUTPUT_EXAMPLE
  );

export const REAL_CINEMATIC_MEMORY_CONTINUITY_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  frameCount: REAL_CINEMATIC_MEMORY_CONTINUITY_OUTPUT_EXAMPLE.frameCount,
  continuityMemoryScore: REAL_CINEMATIC_MEMORY_CONTINUITY_OUTPUT_EXAMPLE.continuityMemoryScore,
  emotionalChainScore:
    REAL_CINEMATIC_MEMORY_CONTINUITY_OUTPUT_EXAMPLE.emotionalCarryover.chainContinuityScore,
  motifCoherenceScore:
    REAL_CINEMATIC_MEMORY_CONTINUITY_OUTPUT_EXAMPLE.visualMotifMemory.motifCoherenceScore,
  rhythmChainScore:
    REAL_CINEMATIC_MEMORY_CONTINUITY_OUTPUT_EXAMPLE.cameraRhythmMemory.rhythmChainScore,
  persistenceChainScore:
    REAL_CINEMATIC_MEMORY_CONTINUITY_OUTPUT_EXAMPLE.environmentPersistence.persistenceChainScore,
  stateChainScore:
    REAL_CINEMATIC_MEMORY_CONTINUITY_OUTPUT_EXAMPLE.characterStateCarryover.stateChainScore,
});
