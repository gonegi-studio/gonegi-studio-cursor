import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealCameraMomentumGrammar,
  computeRealCameraMomentumGrammarFingerprint,
} from "./real-camera-momentum-grammar.ts";

export const REAL_CAMERA_MOMENTUM_GRAMMAR_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_CAMERA_MOMENTUM_GRAMMAR_OUTPUT_EXAMPLE = buildRealCameraMomentumGrammar(
  REAL_CAMERA_MOMENTUM_GRAMMAR_INPUT_EXAMPLE.realImageAppInputPackage
);

export const REAL_CAMERA_MOMENTUM_GRAMMAR_FINGERPRINT =
  computeRealCameraMomentumGrammarFingerprint(
    REAL_CAMERA_MOMENTUM_GRAMMAR_OUTPUT_EXAMPLE
  );
