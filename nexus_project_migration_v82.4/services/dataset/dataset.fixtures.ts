import { EVIDENCE_BUNDLE_OUTPUT_EXAMPLE } from "../evidence/evidence.fixtures.ts";
import type { EvidenceBundle } from "../evidence/evidence.types.ts";
import { buildDatasetIndex } from "./dataset-index-builder.ts";

export const DATASET_BUILDER_INPUT_EXAMPLE: readonly EvidenceBundle[] = Object.freeze([
  EVIDENCE_BUNDLE_OUTPUT_EXAMPLE,
]);

export const DATASET_INDEX_OUTPUT_EXAMPLE = buildDatasetIndex(DATASET_BUILDER_INPUT_EXAMPLE);
