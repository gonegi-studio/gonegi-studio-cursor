import { ELITE_25S_REFERENCE_LOCK_OUTPUT_EXAMPLE } from "./elite-25s-reference-lock.fixtures.ts";
import {
  buildReferenceDatasetAnchor,
  computeReferenceDatasetAnchorFingerprint,
} from "./reference-dataset-anchor.ts";

export const REFERENCE_DATASET_ANCHOR_INPUT_EXAMPLE = Object.freeze({
  elite25sReferenceLock: ELITE_25S_REFERENCE_LOCK_OUTPUT_EXAMPLE,
});

export const REFERENCE_DATASET_ANCHOR_OUTPUT_EXAMPLE = buildReferenceDatasetAnchor(
  REFERENCE_DATASET_ANCHOR_INPUT_EXAMPLE.elite25sReferenceLock
);

export const REFERENCE_DATASET_ANCHOR_FINGERPRINT = computeReferenceDatasetAnchorFingerprint(
  REFERENCE_DATASET_ANCHOR_OUTPUT_EXAMPLE
);

export const REFERENCE_DATASET_ANCHOR_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  legacyRecordId: "GONEGI-HARBOR-25S-SEGMENT-001",
  targetDatasetQueue: 0,
  anchorRole: "visual-reference" as const,
  anchorStatus: "anchor-registered" as const,
});

export const REFERENCE_DATASET_ANCHOR_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  anchorRootId: "reference-dataset-anchor-gonegi-harbor-25s-v1",
  anchorVersion: "reference-dataset-anchor-v1" as const,
  activeAnchorState: "25s-reference-dataset-anchor-metadata-only",
  totalAnchorCount: 3,
  queueOrderSequence: Object.freeze([0, 1, 2]),
  anchorRoleSequence: Object.freeze([
    "visual-reference",
    "continuity-reference",
    "prompt-reference",
  ] as const),
});
