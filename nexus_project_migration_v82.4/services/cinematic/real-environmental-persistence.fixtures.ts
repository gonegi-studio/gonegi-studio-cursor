import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealEnvironmentalPersistence,
  computeRealEnvironmentalPersistenceFingerprint,
} from "./real-environmental-persistence.ts";

export const REAL_ENVIRONMENTAL_PERSISTENCE_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_ENVIRONMENTAL_PERSISTENCE_OUTPUT_EXAMPLE = buildRealEnvironmentalPersistence(
  REAL_ENVIRONMENTAL_PERSISTENCE_INPUT_EXAMPLE.realImageAppInputPackage
);

export const REAL_ENVIRONMENTAL_PERSISTENCE_FINGERPRINT =
  computeRealEnvironmentalPersistenceFingerprint(
    REAL_ENVIRONMENTAL_PERSISTENCE_OUTPUT_EXAMPLE
  );
