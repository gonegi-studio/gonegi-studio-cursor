import { buildDatasetExportPreview } from "./dataset-export-package.ts";
import {
  buildImageAppDatasetJsonBridge,
  computeImageAppDatasetJsonBridgeFingerprint,
} from "./image-app-dataset-json-bridge.ts";

export const IMAGE_APP_DATASET_JSON_BRIDGE_INPUT_EXAMPLE = buildDatasetExportPreview();

export const IMAGE_APP_DATASET_JSON_BRIDGE_OUTPUT_EXAMPLE = buildImageAppDatasetJsonBridge(
  IMAGE_APP_DATASET_JSON_BRIDGE_INPUT_EXAMPLE
);

export const IMAGE_APP_DATASET_JSON_BRIDGE_FINGERPRINT = computeImageAppDatasetJsonBridgeFingerprint(
  IMAGE_APP_DATASET_JSON_BRIDGE_OUTPUT_EXAMPLE
);

export const IMAGE_APP_DATASET_JSON_BRIDGE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
  continuityAnchor: "continuity-anchor-segment-001",
  readinessScore: 0.900205,
});

export const IMAGE_APP_DATASET_JSON_BRIDGE_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  imageAppDatasetJsonBridgeId: "image-app-dataset-json-bridge-gonegi-harbor-25s-v1",
  bridgeVersion: "image-app-dataset-json-bridge-v1" as const,
  activeBridgeState: "25s-image-app-dataset-json-bridge-metadata-only",
  totalImageItemCount: 3,
});
