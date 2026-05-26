import crypto from "crypto";
import {
  REAL_IMAGE_APP_JSON_FILE_EXPORT_MODE,
  REAL_IMAGE_APP_JSON_FILE_EXPORT_SCHEMA_VERSION,
  REAL_IMAGE_APP_JSON_FILE_EXPORT_SOURCE,
} from "./real-image-app-json-file-export.ts";
import {
  REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE,
} from "./real-image-app-input-package.ts";
import type { RealImageAppInputPackage } from "./real-image-app-input-package.ts";
import {
  buildRealCinematicMemoryContinuityPreview,
  buildRealCinematicMemoryContinuitySnapshotFromPackage,
  computeRealCinematicMemoryContinuitySnapshotFingerprint,
  type RealCinematicMemoryContinuitySnapshot,
} from "./real-cinematic-memory-continuity.ts";

export type RealCinematicMemoryDatasetExportImageAppBinding = {
  schemaVersion: typeof REAL_IMAGE_APP_JSON_FILE_EXPORT_SCHEMA_VERSION;
  source: typeof REAL_IMAGE_APP_JSON_FILE_EXPORT_SOURCE;
  mode: typeof REAL_IMAGE_APP_JSON_FILE_EXPORT_MODE;
  itemCount: typeof REAL_CINEMATIC_MEMORY_DATASET_EXPORT_ITEM_COUNT;
  queueOrders: readonly [0, 1, 2];
  frameEvidenceIds: readonly string[];
};

export type RealCinematicMemoryDatasetExport = {
  schemaVersion: typeof REAL_CINEMATIC_MEMORY_DATASET_EXPORT_SCHEMA_VERSION;
  source: typeof REAL_CINEMATIC_MEMORY_DATASET_EXPORT_SOURCE;
  mode: typeof REAL_CINEMATIC_MEMORY_DATASET_EXPORT_MODE;
  exportKind: typeof REAL_CINEMATIC_MEMORY_DATASET_EXPORT_KIND_VERSION;
  inputPackageId: string;
  continuitySnapshotFingerprint: string;
  completionSnapshotFingerprint: string;
  frameCount: typeof REAL_CINEMATIC_MEMORY_DATASET_EXPORT_ITEM_COUNT;
  imageAppBinding: RealCinematicMemoryDatasetExportImageAppBinding;
  emotionalCarryover: RealCinematicMemoryContinuitySnapshot["emotionalCarryover"];
  visualMotifMemory: RealCinematicMemoryContinuitySnapshot["visualMotifMemory"];
  cameraRhythmMemory: RealCinematicMemoryContinuitySnapshot["cameraRhythmMemory"];
  environmentPersistence: RealCinematicMemoryContinuitySnapshot["environmentPersistence"];
  characterStateCarryover: RealCinematicMemoryContinuitySnapshot["characterStateCarryover"];
  continuityMemoryScore: number;
  inferenceExecuted: false;
  providerCallExecuted: false;
  imageGenerationExecuted: false;
};

export type RealCinematicMemoryDatasetExportDownload = {
  filename: typeof REAL_CINEMATIC_MEMORY_DATASET_EXPORT_FILENAME;
  contentType: "application/json";
  body: string;
  exportFingerprint: string;
};

export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_SCHEMA_VERSION =
  "real-cinematic-memory-dataset-v1" as const;
export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_SOURCE = REAL_IMAGE_APP_JSON_FILE_EXPORT_SOURCE;
export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_MODE = REAL_IMAGE_APP_JSON_FILE_EXPORT_MODE;
export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_KIND_VERSION =
  "real-cinematic-memory-dataset-export-v1" as const;
export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_FILENAME =
  "real-cinematic-memory-dataset-export.json" as const;
export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_ITEM_COUNT = 3 as const;

export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_KEY_ORDER = Object.freeze([
  "schemaVersion",
  "source",
  "mode",
  "exportKind",
  "inputPackageId",
  "continuitySnapshotFingerprint",
  "completionSnapshotFingerprint",
  "frameCount",
  "imageAppBinding",
  "emotionalCarryover",
  "visualMotifMemory",
  "cameraRhythmMemory",
  "environmentPersistence",
  "characterStateCarryover",
  "continuityMemoryScore",
  "inferenceExecuted",
  "providerCallExecuted",
  "imageGenerationExecuted",
] as const);

export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_IMAGE_APP_BINDING_KEY_ORDER = Object.freeze([
  "schemaVersion",
  "source",
  "mode",
  "itemCount",
  "queueOrders",
  "frameEvidenceIds",
] as const);

let cachedRealCinematicMemoryDatasetExport: RealCinematicMemoryDatasetExport | null = null;
let cachedRealCinematicMemoryDatasetExportDownload: RealCinematicMemoryDatasetExportDownload | null =
  null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

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

function buildImageAppBinding(
  realImageAppInputPackage: RealImageAppInputPackage
): RealCinematicMemoryDatasetExportImageAppBinding {
  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_CINEMATIC_MEMORY_DATASET_EXPORT_ITEM_COUNT) {
    throw new Error("Cinematic memory dataset export requires three image app input items");
  }

  const queueOrders = orderedItems.map((item) => item.queueOrder);
  if (queueOrders.join(",") !== "0,1,2") {
    throw new Error("Cinematic memory dataset export requires queue order zero through two");
  }

  return Object.freeze({
    schemaVersion: REAL_IMAGE_APP_JSON_FILE_EXPORT_SCHEMA_VERSION,
    source: REAL_IMAGE_APP_JSON_FILE_EXPORT_SOURCE,
    mode: REAL_IMAGE_APP_JSON_FILE_EXPORT_MODE,
    itemCount: REAL_CINEMATIC_MEMORY_DATASET_EXPORT_ITEM_COUNT,
    queueOrders: Object.freeze([0, 1, 2] as const),
    frameEvidenceIds: Object.freeze(orderedItems.map((item) => item.frameEvidenceId)),
  });
}

export function buildRealCinematicMemoryDatasetExportFromSnapshot(
  continuitySnapshot: RealCinematicMemoryContinuitySnapshot,
  realImageAppInputPackage: RealImageAppInputPackage
): RealCinematicMemoryDatasetExport {
  if (continuitySnapshot.frameCount !== REAL_CINEMATIC_MEMORY_DATASET_EXPORT_ITEM_COUNT) {
    throw new Error("Cinematic memory dataset export requires three continuity frames");
  }

  if (continuitySnapshot.inputPackageId !== realImageAppInputPackage.realInputPackageId) {
    throw new Error("Cinematic memory dataset export input package id mismatch");
  }

  const continuitySnapshotFingerprint =
    computeRealCinematicMemoryContinuitySnapshotFingerprint(continuitySnapshot);

  return Object.freeze({
    schemaVersion: REAL_CINEMATIC_MEMORY_DATASET_EXPORT_SCHEMA_VERSION,
    source: REAL_CINEMATIC_MEMORY_DATASET_EXPORT_SOURCE,
    mode: REAL_CINEMATIC_MEMORY_DATASET_EXPORT_MODE,
    exportKind: REAL_CINEMATIC_MEMORY_DATASET_EXPORT_KIND_VERSION,
    inputPackageId: continuitySnapshot.inputPackageId,
    continuitySnapshotFingerprint,
    completionSnapshotFingerprint: continuitySnapshot.completionSnapshotFingerprint,
    frameCount: REAL_CINEMATIC_MEMORY_DATASET_EXPORT_ITEM_COUNT,
    imageAppBinding: buildImageAppBinding(realImageAppInputPackage),
    emotionalCarryover: continuitySnapshot.emotionalCarryover,
    visualMotifMemory: continuitySnapshot.visualMotifMemory,
    cameraRhythmMemory: continuitySnapshot.cameraRhythmMemory,
    environmentPersistence: continuitySnapshot.environmentPersistence,
    characterStateCarryover: continuitySnapshot.characterStateCarryover,
    continuityMemoryScore: continuitySnapshot.continuityMemoryScore,
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
    imageGenerationExecuted: false as const,
  });
}

export function buildRealCinematicMemoryDatasetExportFromPackage(
  realImageAppInputPackage: RealImageAppInputPackage,
  options?: {
    completionSnapshotFingerprint?: string;
  }
): RealCinematicMemoryDatasetExport {
  const continuitySnapshot = buildRealCinematicMemoryContinuitySnapshotFromPackage(
    realImageAppInputPackage,
    options
  );

  return buildRealCinematicMemoryDatasetExportFromSnapshot(
    continuitySnapshot,
    realImageAppInputPackage
  );
}

export function serializeRealCinematicMemoryDatasetExport(
  datasetExport: RealCinematicMemoryDatasetExport
): string {
  const orderedExport = orderRecord(
    {
      ...datasetExport,
      imageAppBinding: orderRecord(
        datasetExport.imageAppBinding as unknown as Record<string, unknown>,
        REAL_CINEMATIC_MEMORY_DATASET_EXPORT_IMAGE_APP_BINDING_KEY_ORDER
      ),
    } as unknown as Record<string, unknown>,
    REAL_CINEMATIC_MEMORY_DATASET_EXPORT_KEY_ORDER
  );

  return JSON.stringify(orderedExport, null, 2);
}

export function computeRealCinematicMemoryDatasetExportFingerprint(
  datasetExport: RealCinematicMemoryDatasetExport
): string {
  return digestValue(serializeRealCinematicMemoryDatasetExport(datasetExport));
}

export function buildRealCinematicMemoryDatasetExportDownloadFromExport(
  datasetExport: RealCinematicMemoryDatasetExport
): RealCinematicMemoryDatasetExportDownload {
  return Object.freeze({
    filename: REAL_CINEMATIC_MEMORY_DATASET_EXPORT_FILENAME,
    contentType: "application/json",
    body: serializeRealCinematicMemoryDatasetExport(datasetExport),
    exportFingerprint: computeRealCinematicMemoryDatasetExportFingerprint(datasetExport),
  });
}

export function buildRealCinematicMemoryDatasetExportDownloadFromPackage(
  realImageAppInputPackage: RealImageAppInputPackage
): RealCinematicMemoryDatasetExportDownload {
  return buildRealCinematicMemoryDatasetExportDownloadFromExport(
    buildRealCinematicMemoryDatasetExportFromPackage(realImageAppInputPackage)
  );
}

export function buildRealCinematicMemoryDatasetExportDownload(): RealCinematicMemoryDatasetExportDownload {
  if (cachedRealCinematicMemoryDatasetExportDownload !== null) {
    return cachedRealCinematicMemoryDatasetExportDownload;
  }

  const continuitySnapshot = buildRealCinematicMemoryContinuityPreview();
  const datasetExport = buildRealCinematicMemoryDatasetExportFromSnapshot(
    continuitySnapshot,
    REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE as RealImageAppInputPackage
  );
  cachedRealCinematicMemoryDatasetExport = datasetExport;

  const download = buildRealCinematicMemoryDatasetExportDownloadFromExport(datasetExport);
  cachedRealCinematicMemoryDatasetExportDownload = download;
  return download;
}

export function resetRealCinematicMemoryDatasetExportCacheForVerification(): void {
  cachedRealCinematicMemoryDatasetExport = null;
  cachedRealCinematicMemoryDatasetExportDownload = null;
}
