import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealCharacterEmotionalTrajectory,
  computeRealCharacterEmotionalTrajectoryFingerprint,
} from "./real-character-emotional-trajectory.ts";

export const REAL_CHARACTER_EMOTIONAL_TRAJECTORY_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_CHARACTER_EMOTIONAL_TRAJECTORY_OUTPUT_EXAMPLE =
  buildRealCharacterEmotionalTrajectory(
    REAL_CHARACTER_EMOTIONAL_TRAJECTORY_INPUT_EXAMPLE.realImageAppInputPackage
  );

export const REAL_CHARACTER_EMOTIONAL_TRAJECTORY_FINGERPRINT =
  computeRealCharacterEmotionalTrajectoryFingerprint(
    REAL_CHARACTER_EMOTIONAL_TRAJECTORY_OUTPUT_EXAMPLE
  );
