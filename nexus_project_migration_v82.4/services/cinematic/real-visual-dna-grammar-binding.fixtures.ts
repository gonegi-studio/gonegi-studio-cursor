import { REAL_FRAME_VISUAL_DNA_SEED_OUTPUT_EXAMPLE } from "./real-frame-visual-dna-seed.fixtures.ts";
import {
  buildRealVisualDnaGrammarBinding,
  computeRealVisualDnaGrammarBindingFingerprint,
} from "./real-visual-dna-grammar-binding.ts";

export const REAL_VISUAL_DNA_GRAMMAR_BINDING_INPUT_EXAMPLE = Object.freeze({
  realFrameVisualDnaSeed: REAL_FRAME_VISUAL_DNA_SEED_OUTPUT_EXAMPLE,
});

export const REAL_VISUAL_DNA_GRAMMAR_BINDING_OUTPUT_EXAMPLE = buildRealVisualDnaGrammarBinding(
  REAL_VISUAL_DNA_GRAMMAR_BINDING_INPUT_EXAMPLE.realFrameVisualDnaSeed
);

export const REAL_VISUAL_DNA_GRAMMAR_BINDING_FINGERPRINT =
  computeRealVisualDnaGrammarBindingFingerprint(
    REAL_VISUAL_DNA_GRAMMAR_BINDING_OUTPUT_EXAMPLE
  );

export const REAL_VISUAL_DNA_GRAMMAR_BINDING_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  cinematicRole: "opening" as const,
  pacingRole: "slow-build" as const,
  continuityRole: "visual-anchor" as const,
  sceneType: "harbor-town" as const,
  bindingStatus: "bound" as const,
});

export const REAL_VISUAL_DNA_GRAMMAR_BINDING_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  bindingRootId: REAL_VISUAL_DNA_GRAMMAR_BINDING_OUTPUT_EXAMPLE.bindingRootId,
  bindingVersion: "real-visual-dna-grammar-binding-v1" as const,
  activeBindingState: "25s-real-visual-dna-grammar-binding-metadata-only",
  bindingStatus: REAL_VISUAL_DNA_GRAMMAR_BINDING_OUTPUT_EXAMPLE.bindingStatus,
  totalItemCount: 3,
  boundItemCount: REAL_VISUAL_DNA_GRAMMAR_BINDING_OUTPUT_EXAMPLE.boundItemCount,
});
