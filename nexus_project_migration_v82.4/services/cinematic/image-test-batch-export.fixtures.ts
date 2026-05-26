import { buildReferenceConditionedImageInputPreview } from "./reference-conditioned-image-input.ts";
import {
  buildImageTestBatchExport,
  computeImageTestBatchExportFingerprint,
} from "./image-test-batch-export.ts";
import { REFERENCE_ANCHOR_BLOCKED_USAGE_CATALOG } from "./reference-anchor-usage-policy.ts";

export const IMAGE_TEST_BATCH_EXPORT_INPUT_EXAMPLE = Object.freeze({
  referenceConditionedImageInputPreview: buildReferenceConditionedImageInputPreview(),
});

export const IMAGE_TEST_BATCH_EXPORT_OUTPUT_EXAMPLE = buildImageTestBatchExport(
  IMAGE_TEST_BATCH_EXPORT_INPUT_EXAMPLE.referenceConditionedImageInputPreview
);

export const IMAGE_TEST_BATCH_EXPORT_FINGERPRINT = computeImageTestBatchExportFingerprint(
  IMAGE_TEST_BATCH_EXPORT_OUTPUT_EXAMPLE
);

export const IMAGE_TEST_BATCH_EXPORT_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  safety: Object.freeze({
    directAssetReuse: false as const,
    blockedUsage: REFERENCE_ANCHOR_BLOCKED_USAGE_CATALOG,
  }),
});

export const IMAGE_TEST_BATCH_EXPORT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  batchVersion: "image-test-batch-export-v1" as const,
  itemCount: 3,
  queueOrderSequence: Object.freeze([0, 1, 2]),
});
