import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealCameraGrammarEvolution,
  computeRealCameraGrammarEvolutionFingerprint,
} from "./real-camera-grammar-evolution.ts";

export const REAL_CAMERA_GRAMMAR_EVOLUTION_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_CAMERA_GRAMMAR_EVOLUTION_OUTPUT_EXAMPLE = buildRealCameraGrammarEvolution(
  REAL_CAMERA_GRAMMAR_EVOLUTION_INPUT_EXAMPLE.realImageAppInputPackage
);

export const REAL_CAMERA_GRAMMAR_EVOLUTION_FINGERPRINT =
  computeRealCameraGrammarEvolutionFingerprint(
    REAL_CAMERA_GRAMMAR_EVOLUTION_OUTPUT_EXAMPLE
  );
