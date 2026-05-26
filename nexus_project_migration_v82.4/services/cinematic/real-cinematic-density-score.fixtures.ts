import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealCinematicDensityScore,
  computeRealCinematicDensityScoreFingerprint,
} from "./real-cinematic-density-score.ts";

export const REAL_CINEMATIC_DENSITY_SCORE_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_CINEMATIC_DENSITY_SCORE_OUTPUT_EXAMPLE = buildRealCinematicDensityScore(
  REAL_CINEMATIC_DENSITY_SCORE_INPUT_EXAMPLE.realImageAppInputPackage
);

export const REAL_CINEMATIC_DENSITY_SCORE_FINGERPRINT = computeRealCinematicDensityScoreFingerprint(
  REAL_CINEMATIC_DENSITY_SCORE_OUTPUT_EXAMPLE
);
