import { CINEMATIC_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE } from "./cinematic-evidence-registry.fixtures.ts";
import {
  buildCinematicGrammarBinding,
  computeCinematicGrammarBindingFingerprint,
} from "./cinematic-grammar-binding.ts";

export const CINEMATIC_GRAMMAR_BINDING_INPUT_EXAMPLE = CINEMATIC_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE;

export const CINEMATIC_GRAMMAR_BINDING_OUTPUT_EXAMPLE = buildCinematicGrammarBinding(
  CINEMATIC_GRAMMAR_BINDING_INPUT_EXAMPLE
);

export const CINEMATIC_GRAMMAR_BINDING_FINGERPRINT = computeCinematicGrammarBindingFingerprint(
  CINEMATIC_GRAMMAR_BINDING_OUTPUT_EXAMPLE
);

export const CINEMATIC_GRAMMAR_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  segmentId: "segment-001",
  queueOrder: 0,
  cinematicRole: "opening" as const,
  transitionRole: "hold" as const,
  pacingRole: "slow-build" as const,
  emotionalBeat: "nostalgic-calm",
  previousEvidenceId: "",
  startSeconds: 0,
  endSeconds: 8,
  durationSeconds: 8,
});

export const CINEMATIC_TRANSITION_BINDING_OUTPUT_EXAMPLE = Object.freeze({
  transitionIndex: 0,
  fromQueueOrder: 0,
  toQueueOrder: 1,
  transitionRole: "bridge" as const,
});

export const CINEMATIC_GRAMMAR_BINDING_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  bindingId: "cinematic-grammar-binding-gonegi-harbor-25s-v1",
  grammarBindingVersion: "cinematic-grammar-binding-v1" as const,
  activeBindingState: "25s-cinematic-grammar-binding-metadata-only",
});
