import { SCENE_DNA_OUTPUT_EXAMPLE } from "../scene-analysis/scene-dna.fixtures.ts";
import type { EvidenceAssemblerInput, EvidenceBundle } from "./evidence.types.ts";
import { assembleEvidenceBundle } from "./evidence-assembler.ts";

export const EVIDENCE_ASSEMBLER_INPUT_EXAMPLE: Readonly<EvidenceAssemblerInput> = Object.freeze({
  sourceId: "scene-001",
  profile: SCENE_DNA_OUTPUT_EXAMPLE,
  artifactKind: "scene-dna",
});

export const EVIDENCE_BUNDLE_OUTPUT_EXAMPLE: Readonly<EvidenceBundle> = assembleEvidenceBundle(
  EVIDENCE_ASSEMBLER_INPUT_EXAMPLE
);
