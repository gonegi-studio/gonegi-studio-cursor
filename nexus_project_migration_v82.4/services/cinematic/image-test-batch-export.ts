import crypto from "crypto";
import type { ReferenceAnchorBlockedUsage } from "./reference-anchor-usage-policy.ts";
import type { ReferenceConditionedImageInputPreview } from "./reference-conditioned-image-input.ts";

export type ImageTestBatchExportSafety = {
  directAssetReuse: false;
  blockedUsage: readonly ReferenceAnchorBlockedUsage[];
};

export type ImageTestBatchExportItem = {
  batchItemId: string;
  queueOrder: number;
  segmentId: string;
  finalImageAppInputJson: string;
  safety: ImageTestBatchExportSafety;
};

export type ImageTestBatchExport = {
  batchId: string;
  batchVersion: typeof IMAGE_TEST_BATCH_EXPORT_KIND_VERSION;
  itemCount: number;
  items: readonly ImageTestBatchExportItem[];
};

export const IMAGE_TEST_BATCH_EXPORT_KIND_VERSION = "image-test-batch-export-v1" as const;

const FRAME_EXPORT_QUEUE_MAX = 2;

let cachedImageTestBatchExport: ImageTestBatchExport | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

type PreviewConditionedInputItem = {
  queueOrder: number;
  segmentId: string;
  finalImageAppInputJson: string;
  blockedReferenceUse: readonly ReferenceAnchorBlockedUsage[];
};

function resolvePreviewItems(
  preview: ReferenceConditionedImageInputPreview
): readonly PreviewConditionedInputItem[] {
  const conditionedInput = preview.referenceConditionedImageInput as {
    items: readonly PreviewConditionedInputItem[];
  };
  return conditionedInput.items;
}

function computeBatchItemId(
  queueOrder: number,
  segmentId: string,
  finalImageAppInputJson: string
): string {
  return digestValue(
    [
      IMAGE_TEST_BATCH_EXPORT_KIND_VERSION,
      "image-test-batch-item",
      String(queueOrder),
      segmentId,
      finalImageAppInputJson,
    ].join("|")
  );
}

function computeBatchId(previewFingerprint: string, itemCount: number): string {
  return digestValue(
    [
      IMAGE_TEST_BATCH_EXPORT_KIND_VERSION,
      "image-test-batch",
      previewFingerprint,
      String(itemCount),
    ].join("|")
  );
}

function buildImageTestBatchExportItem(
  item: PreviewConditionedInputItem
): ImageTestBatchExportItem {
  return Object.freeze({
    batchItemId: computeBatchItemId(item.queueOrder, item.segmentId, item.finalImageAppInputJson),
    queueOrder: item.queueOrder,
    segmentId: item.segmentId,
    finalImageAppInputJson: item.finalImageAppInputJson,
    safety: Object.freeze({
      directAssetReuse: false as const,
      blockedUsage: item.blockedReferenceUse,
    }),
  });
}

export function buildImageTestBatchExport(
  referenceConditionedImageInputPreview: ReferenceConditionedImageInputPreview
): ImageTestBatchExport {
  if (cachedImageTestBatchExport !== null) {
    return cachedImageTestBatchExport;
  }

  const previewItems = [...resolvePreviewItems(referenceConditionedImageInputPreview)].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (previewItems.length !== FRAME_EXPORT_QUEUE_MAX + 1) {
    throw new Error("Image test batch export requires three reference conditioned preview items");
  }

  const queueOrders = previewItems.map((item) => item.queueOrder);
  if (queueOrders.join(",") !== "0,1,2") {
    throw new Error("Image test batch export requires queue order zero through two");
  }

  const items = Object.freeze(previewItems.map((item) => buildImageTestBatchExportItem(item)));

  const batchExport = Object.freeze({
    batchId: computeBatchId(referenceConditionedImageInputPreview.fingerprint, items.length),
    batchVersion: IMAGE_TEST_BATCH_EXPORT_KIND_VERSION,
    itemCount: items.length,
    items,
  });

  cachedImageTestBatchExport = batchExport;
  return batchExport;
}

export const IMAGE_TEST_BATCH_EXPORT_ITEM_KEY_ORDER = Object.freeze([
  "batchItemId",
  "queueOrder",
  "segmentId",
  "finalImageAppInputJson",
  "safety",
] as const);

export const IMAGE_TEST_BATCH_EXPORT_SAFETY_KEY_ORDER = Object.freeze([
  "directAssetReuse",
  "blockedUsage",
] as const);

export const IMAGE_TEST_BATCH_EXPORT_KEY_ORDER = Object.freeze([
  "batchId",
  "batchVersion",
  "itemCount",
  "items",
] as const);

function orderRecord<T extends Record<string, unknown>>(
  item: T,
  keyOrder: readonly string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeImageTestBatchExport(batchExport: ImageTestBatchExport): string {
  const orderedItems = [...batchExport.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => {
      const orderedSafety = orderRecord(
        item.safety as unknown as Record<string, unknown>,
        IMAGE_TEST_BATCH_EXPORT_SAFETY_KEY_ORDER
      );
      return orderRecord(
        {
          ...item,
          safety: orderedSafety,
        } as unknown as Record<string, unknown>,
        IMAGE_TEST_BATCH_EXPORT_ITEM_KEY_ORDER
      );
    });

  const orderedBatchExport: Record<string, unknown> = {};
  for (const key of IMAGE_TEST_BATCH_EXPORT_KEY_ORDER) {
    if (key === "items") {
      orderedBatchExport.items = orderedItems;
    } else {
      orderedBatchExport[key] = batchExport[key as keyof ImageTestBatchExport];
    }
  }

  return JSON.stringify(orderedBatchExport);
}

export function computeImageTestBatchExportFingerprint(
  batchExport: ImageTestBatchExport
): string {
  return digestValue(serializeImageTestBatchExport(batchExport));
}

export function resetImageTestBatchExportCacheForVerification(): void {
  cachedImageTestBatchExport = null;
}
