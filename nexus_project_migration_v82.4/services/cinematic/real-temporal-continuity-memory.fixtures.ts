import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealTemporalContinuityMemory,
  computeRealTemporalContinuityMemoryFingerprint,
} from "./real-temporal-continuity-memory.ts";

export const REAL_TEMPORAL_CONTINUITY_MEMORY_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_TEMPORAL_CONTINUITY_MEMORY_OUTPUT_EXAMPLE = buildRealTemporalContinuityMemory(
  REAL_TEMPORAL_CONTINUITY_MEMORY_INPUT_EXAMPLE.realImageAppInputPackage
);

export const REAL_TEMPORAL_CONTINUITY_MEMORY_FINGERPRINT =
  computeRealTemporalContinuityMemoryFingerprint(
    REAL_TEMPORAL_CONTINUITY_MEMORY_OUTPUT_EXAMPLE
  );
