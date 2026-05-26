import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealEnvironmentalMotionField,
  computeRealEnvironmentalMotionFieldFingerprint,
} from "./real-environmental-motion-field.ts";

export const REAL_ENVIRONMENTAL_MOTION_FIELD_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_ENVIRONMENTAL_MOTION_FIELD_OUTPUT_EXAMPLE = buildRealEnvironmentalMotionField(
  REAL_ENVIRONMENTAL_MOTION_FIELD_INPUT_EXAMPLE.realImageAppInputPackage
);

export const REAL_ENVIRONMENTAL_MOTION_FIELD_FINGERPRINT =
  computeRealEnvironmentalMotionFieldFingerprint(
    REAL_ENVIRONMENTAL_MOTION_FIELD_OUTPUT_EXAMPLE
  );
