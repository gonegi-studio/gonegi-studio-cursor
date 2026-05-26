import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealMotionDensityScore,
  computeRealMotionDensityScoreFingerprint,
} from "./real-motion-density-score.ts";

export const REAL_MOTION_DENSITY_SCORE_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_MOTION_DENSITY_SCORE_OUTPUT_EXAMPLE = buildRealMotionDensityScore(
  REAL_MOTION_DENSITY_SCORE_INPUT_EXAMPLE.realImageAppInputPackage
);

export const REAL_MOTION_DENSITY_SCORE_FINGERPRINT = computeRealMotionDensityScoreFingerprint(
  REAL_MOTION_DENSITY_SCORE_OUTPUT_EXAMPLE
);
