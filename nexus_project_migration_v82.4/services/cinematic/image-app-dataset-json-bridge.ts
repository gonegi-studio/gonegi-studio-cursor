import crypto from "crypto";
import type { DatasetExportPreview } from "./dataset-export-package.ts";

export type ImageAppDatasetJsonItem = {
  bridgeId: string;
  queueOrder: number;
  segmentId: string;
  promptIntent: string;
  continuityAnchor: string;
  rendererInputJson: string;
  datasetLockId: string;
  readinessScore: number;
  bridgeItemFingerprint: string;
};

export type ImageAppDatasetJsonBridge = {
  version: "v1";
  imageAppDatasetJsonBridgeId: string;
  datasetExportPreviewFingerprint: string;
  sourceFingerprint: string;
  readinessScore: number;
  bridgeVersion: typeof IMAGE_APP_DATASET_JSON_BRIDGE_KIND_VERSION;
  activeBridgeState: string;
  totalImageItemCount: number;
  items: readonly ImageAppDatasetJsonItem[];
};

export const IMAGE_APP_DATASET_JSON_BRIDGE_VERSION = "v1" as const;
export const IMAGE_APP_DATASET_JSON_BRIDGE_ID =
  "image-app-dataset-json-bridge-gonegi-harbor-25s-v1" as const;
export const IMAGE_APP_DATASET_JSON_BRIDGE_STATE =
  "25s-image-app-dataset-json-bridge-metadata-only" as const;
export const IMAGE_APP_DATASET_JSON_BRIDGE_KIND_VERSION =
  "image-app-dataset-json-bridge-v1" as const;

const FRAME_EXPORT_QUEUE_MAX = 2;

const IMAGE_APP_RENDERER_INPUT_JSON_KEY_ORDER = Object.freeze([
  "version",
  "target",
  "mode",
  "queueOrder",
  "segmentId",
  "promptIntent",
  "continuityAnchor",
  "outputSlot",
  "adapterHint",
] as const);

const IMAGE_FRAME_PROMPT_DEFINITIONS = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    segmentId: "segment-001",
    promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
    continuityAnchor: "continuity-anchor-segment-001",
    outputSlot: "generator-output-slot-segment-001-queue-000",
  }),
  Object.freeze({
    queueOrder: 1,
    segmentId: "segment-002",
    promptIntent: "frame-bridge|reflective-bridge|rhythm-hold|medium|moderate",
    continuityAnchor: "continuity-anchor-segment-002",
    outputSlot: "generator-output-slot-segment-002-queue-001",
  }),
  Object.freeze({
    queueOrder: 2,
    segmentId: "segment-003",
    promptIntent: "frame-resolve|warm-resolution|rhythm-release|low|gentle",
    continuityAnchor: "continuity-anchor-segment-003",
    outputSlot: "generator-output-slot-segment-003-queue-002",
  }),
]);

let cachedImageAppDatasetJsonBridge: ImageAppDatasetJsonBridge | null = null;

type DatasetExportPreviewPackageItem = {
  lockId: string;
  queueOrder: number;
  segmentId: string;
  datasetLayerKind: "frame-export" | "segment-export";
};

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveImageFramePromptDefinition(queueOrder: number) {
  const definition = IMAGE_FRAME_PROMPT_DEFINITIONS.find((item) => item.queueOrder === queueOrder);
  if (definition === undefined) {
    throw new Error("Image app dataset json bridge requires a frame prompt definition");
  }
  return definition;
}

function buildImageAppRendererInputJson(
  queueOrder: number,
  segmentId: string,
  promptIntent: string,
  continuityAnchor: string,
  outputSlot: string
): string {
  const orderedInput: Record<string, unknown> = {};
  const values: Record<(typeof IMAGE_APP_RENDERER_INPUT_JSON_KEY_ORDER)[number], unknown> = {
    version: IMAGE_APP_DATASET_JSON_BRIDGE_VERSION,
    target: "image-renderer",
    mode: "image",
    queueOrder,
    segmentId,
    promptIntent,
    continuityAnchor,
    outputSlot,
    adapterHint: "generic-image-adapter-v1",
  };

  for (const key of IMAGE_APP_RENDERER_INPUT_JSON_KEY_ORDER) {
    orderedInput[key] = values[key];
  }

  return JSON.stringify(orderedInput);
}

function computeBridgeItemId(queueOrder: number, datasetLockId: string): string {
  return digestValue(
    [
      IMAGE_APP_DATASET_JSON_BRIDGE_KIND_VERSION,
      "image-app-bridge-item",
      String(queueOrder),
      datasetLockId,
    ].join("|")
  );
}

function computeBridgeItemFingerprint(
  item: Omit<ImageAppDatasetJsonItem, "bridgeItemFingerprint">
): string {
  return digestValue(
    [
      IMAGE_APP_DATASET_JSON_BRIDGE_KIND_VERSION,
      item.bridgeId,
      String(item.queueOrder),
      item.segmentId,
      item.promptIntent,
      item.continuityAnchor,
      item.rendererInputJson,
      item.datasetLockId,
      String(item.readinessScore),
    ].join("|")
  );
}

function buildImageAppDatasetJsonBridgeItem(
  exportItem: DatasetExportPreviewPackageItem,
  readinessScore: number
): ImageAppDatasetJsonItem {
  const promptDefinition = resolveImageFramePromptDefinition(exportItem.queueOrder);
  if (promptDefinition.segmentId !== exportItem.segmentId) {
    throw new Error("Image app dataset json bridge segment linkage mismatch");
  }

  const rendererInputJson = buildImageAppRendererInputJson(
    exportItem.queueOrder,
    exportItem.segmentId,
    promptDefinition.promptIntent,
    promptDefinition.continuityAnchor,
    promptDefinition.outputSlot
  );

  const baseItem: Omit<ImageAppDatasetJsonItem, "bridgeItemFingerprint"> = {
    bridgeId: computeBridgeItemId(exportItem.queueOrder, exportItem.lockId),
    queueOrder: exportItem.queueOrder,
    segmentId: exportItem.segmentId,
    promptIntent: promptDefinition.promptIntent,
    continuityAnchor: promptDefinition.continuityAnchor,
    rendererInputJson,
    datasetLockId: exportItem.lockId,
    readinessScore,
  };

  return Object.freeze({
    ...baseItem,
    bridgeItemFingerprint: computeBridgeItemFingerprint(baseItem),
  });
}

export function buildImageAppDatasetJsonBridge(
  datasetExportPreview: DatasetExportPreview
): ImageAppDatasetJsonBridge {
  if (cachedImageAppDatasetJsonBridge !== null) {
    return cachedImageAppDatasetJsonBridge;
  }

  const exportPackage = datasetExportPreview.datasetExportPackage as {
    sourceFingerprint: string;
    items: readonly DatasetExportPreviewPackageItem[];
  };

  const frameExportItems = [...exportPackage.items]
    .filter((item) => item.datasetLayerKind === "frame-export")
    .sort((a, b) => a.queueOrder - b.queueOrder);

  if (frameExportItems.length !== FRAME_EXPORT_QUEUE_MAX + 1) {
    throw new Error("Image app dataset json bridge requires three frame-export items");
  }

  const items = Object.freeze(
    frameExportItems.map((exportItem) =>
      buildImageAppDatasetJsonBridgeItem(exportItem, datasetExportPreview.readinessScore)
    )
  );

  const bridge = Object.freeze({
    version: IMAGE_APP_DATASET_JSON_BRIDGE_VERSION,
    imageAppDatasetJsonBridgeId: IMAGE_APP_DATASET_JSON_BRIDGE_ID,
    datasetExportPreviewFingerprint: datasetExportPreview.fingerprint,
    sourceFingerprint: exportPackage.sourceFingerprint,
    readinessScore: datasetExportPreview.readinessScore,
    bridgeVersion: IMAGE_APP_DATASET_JSON_BRIDGE_KIND_VERSION,
    activeBridgeState: IMAGE_APP_DATASET_JSON_BRIDGE_STATE,
    totalImageItemCount: items.length,
    items,
  });

  cachedImageAppDatasetJsonBridge = bridge;
  return bridge;
}

export const IMAGE_APP_DATASET_JSON_BRIDGE_ITEM_KEY_ORDER = Object.freeze([
  "bridgeId",
  "queueOrder",
  "segmentId",
  "promptIntent",
  "continuityAnchor",
  "rendererInputJson",
  "datasetLockId",
  "readinessScore",
  "bridgeItemFingerprint",
] as const);

export const IMAGE_APP_DATASET_JSON_BRIDGE_KEY_ORDER = Object.freeze([
  "version",
  "imageAppDatasetJsonBridgeId",
  "datasetExportPreviewFingerprint",
  "sourceFingerprint",
  "readinessScore",
  "bridgeVersion",
  "activeBridgeState",
  "totalImageItemCount",
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

export function serializeImageAppDatasetJsonBridge(bridge: ImageAppDatasetJsonBridge): string {
  const orderedItems = [...bridge.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, IMAGE_APP_DATASET_JSON_BRIDGE_ITEM_KEY_ORDER));

  const orderedBridge: Record<string, unknown> = {};
  for (const key of IMAGE_APP_DATASET_JSON_BRIDGE_KEY_ORDER) {
    if (key === "items") {
      orderedBridge.items = orderedItems;
    } else {
      orderedBridge[key] = bridge[key as keyof ImageAppDatasetJsonBridge];
    }
  }

  return JSON.stringify(orderedBridge);
}

export function computeImageAppDatasetJsonBridgeFingerprint(
  bridge: ImageAppDatasetJsonBridge
): string {
  return digestValue(serializeImageAppDatasetJsonBridge(bridge));
}

export function resetImageAppDatasetJsonBridgeCacheForVerification(): void {
  cachedImageAppDatasetJsonBridge = null;
}
