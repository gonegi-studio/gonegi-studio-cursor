import crypto from "crypto";
import type { ReferenceAnchorBlockedUsage } from "./reference-anchor-usage-policy.ts";
import { REFERENCE_ANCHOR_BLOCKED_USAGE_CATALOG } from "./reference-anchor-usage-policy.ts";
import {
  buildReferenceConditionedImageInputPreview,
  type ReferenceConditionedImageInputPreview,
} from "./reference-conditioned-image-input.ts";

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

export const IMAGE_TEST_BATCH_EXPORT_PREVIEW_FINGERPRINT =
  "366dfd9dab0d751de7851aca0ff0db0f1eee02eb4fc2353471af27ff60cbc103" as const;

export type ImageTestBatchPreviewItemCounts = {
  totalItemCount: number;
  batchItemCount: number;
};

export type ImageTestBatchPreviewSafetyItem = {
  queueOrder: number;
  directAssetReuse: false;
  blockedUsage: readonly ReferenceAnchorBlockedUsage[];
};

export type ImageTestBatchPreviewSafetySummary = {
  blockedUsageCatalog: readonly ReferenceAnchorBlockedUsage[];
  enforcedItemCount: number;
  directAssetReuseBlocked: boolean;
  items: readonly ImageTestBatchPreviewSafetyItem[];
};

export type ImageTestBatchPreview = {
  imageTestBatchExport: ReturnType<typeof JSON.parse>;
  fingerprint: string;
  itemCounts: ImageTestBatchPreviewItemCounts;
  safetySummary: ImageTestBatchPreviewSafetySummary;
};

function aggregateSafetySummary(
  batchExport: ImageTestBatchExport
): ImageTestBatchPreviewSafetySummary {
  return Object.freeze({
    blockedUsageCatalog: REFERENCE_ANCHOR_BLOCKED_USAGE_CATALOG,
    enforcedItemCount: batchExport.itemCount,
    directAssetReuseBlocked: true,
    items: Object.freeze(
      [...batchExport.items]
        .sort((a, b) => a.queueOrder - b.queueOrder)
        .map((item) =>
          Object.freeze({
            queueOrder: item.queueOrder,
            directAssetReuse: false as const,
            blockedUsage: item.safety.blockedUsage,
          })
        )
    ),
  });
}

export function buildImageTestBatchPreviewFromBatch(
  batchExport: ImageTestBatchExport
): ImageTestBatchPreview {
  const fingerprint = computeImageTestBatchExportFingerprint(batchExport);
  const safetySummary = aggregateSafetySummary(batchExport);

  return Object.freeze({
    imageTestBatchExport: JSON.parse(serializeImageTestBatchExport(batchExport)),
    fingerprint,
    itemCounts: Object.freeze({
      totalItemCount: batchExport.itemCount,
      batchItemCount: batchExport.itemCount,
    }),
    safetySummary,
  });
}

export function buildImageTestBatchPreview(): ImageTestBatchPreview {
  return buildImageTestBatchPreviewFromBatch(
    buildImageTestBatchExport(buildReferenceConditionedImageInputPreview())
  );
}

export function serializeImageTestBatchPreview(preview: ImageTestBatchPreview): string {
  return JSON.stringify({
    imageTestBatchExport: preview.imageTestBatchExport,
    fingerprint: preview.fingerprint,
    itemCounts: preview.itemCounts,
    safetySummary: preview.safetySummary,
  });
}
