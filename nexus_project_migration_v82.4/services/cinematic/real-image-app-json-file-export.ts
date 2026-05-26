import crypto from "crypto";
import {
  buildRealImageAppInputPreview,
  type RealImageAppInputPreview,
} from "./real-image-app-input-package.ts";
import type { RealMusicDramaFunction } from "./real-music-drama-scene-plan.ts";
import type { RealSuggestedMusicEnergy } from "./real-music-sync-contract.ts";
import type { RealVisualRhythmPhase } from "./real-visual-rhythm-map.ts";

export type RealImageAppJsonFileExportItem = {
  queueOrder: number;
  timestampSeconds: string;
  frameEvidenceId: string;
  frameFingerprint: string;
  sceneId: string;
  dramaFunction: RealMusicDramaFunction;
  emotionTone: string;
  rhythmPhase: RealVisualRhythmPhase;
  suggestedMusicEnergy: RealSuggestedMusicEnergy;
  imageAppInputJson: string;
};

export type RealImageAppJsonFileExport = {
  schemaVersion: typeof REAL_IMAGE_APP_JSON_FILE_EXPORT_SCHEMA_VERSION;
  source: typeof REAL_IMAGE_APP_JSON_FILE_EXPORT_SOURCE;
  mode: typeof REAL_IMAGE_APP_JSON_FILE_EXPORT_MODE;
  items: readonly RealImageAppJsonFileExportItem[];
};

export type RealImageAppJsonFileDownload = {
  filename: typeof REAL_IMAGE_APP_JSON_FILE_EXPORT_FILENAME;
  contentType: "application/json";
  body: string;
  exportFingerprint: string;
};

export const REAL_IMAGE_APP_JSON_FILE_EXPORT_SCHEMA_VERSION = "real-image-app-input-v1" as const;
export const REAL_IMAGE_APP_JSON_FILE_EXPORT_SOURCE = "kiki-25s-real-mp4" as const;
export const REAL_IMAGE_APP_JSON_FILE_EXPORT_MODE = "cinematic-dna-lab-import" as const;
export const REAL_IMAGE_APP_JSON_FILE_EXPORT_FILENAME =
  "kiki-25s-real-image-app-input.json" as const;
export const REAL_IMAGE_APP_JSON_FILE_EXPORT_KIND_VERSION =
  "real-image-app-json-file-export-v1" as const;
export const REAL_IMAGE_APP_JSON_FILE_EXPORT_ITEM_COUNT = 3 as const;
export const REAL_IMAGE_APP_JSON_FILE_EXPORT_FRAME_QUEUE_MAX = 2 as const;

export const REAL_IMAGE_APP_JSON_FILE_EXPORT_KEY_ORDER = Object.freeze([
  "schemaVersion",
  "source",
  "mode",
  "items",
] as const);

export const REAL_IMAGE_APP_JSON_FILE_EXPORT_ITEM_KEY_ORDER = Object.freeze([
  "queueOrder",
  "timestampSeconds",
  "frameEvidenceId",
  "frameFingerprint",
  "sceneId",
  "dramaFunction",
  "emotionTone",
  "rhythmPhase",
  "suggestedMusicEnergy",
  "imageAppInputJson",
] as const);

type PreviewPackageItem = {
  queueOrder: number;
  timestampSeconds: string;
  frameEvidenceId: string;
  frameFingerprint: string;
  sceneId: string;
  dramaFunction: RealMusicDramaFunction;
  emotionTone: string;
  rhythmPhase: RealVisualRhythmPhase;
  suggestedMusicEnergy: RealSuggestedMusicEnergy;
  imageAppInputJson: string;
};

let cachedRealImageAppJsonFileExport: RealImageAppJsonFileExport | null = null;
let cachedRealImageAppJsonFileDownload: RealImageAppJsonFileDownload | null = null;

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

function resolvePreviewPackageItems(
  preview: RealImageAppInputPreview
): readonly PreviewPackageItem[] {
  const inputPackage = preview.realImageAppInputPackage as {
    items: readonly PreviewPackageItem[];
  };
  return inputPackage.items;
}

function buildRealImageAppJsonFileExportItem(
  item: PreviewPackageItem
): RealImageAppJsonFileExportItem {
  return Object.freeze({
    queueOrder: item.queueOrder,
    timestampSeconds: item.timestampSeconds,
    frameEvidenceId: item.frameEvidenceId,
    frameFingerprint: item.frameFingerprint,
    sceneId: item.sceneId,
    dramaFunction: item.dramaFunction,
    emotionTone: item.emotionTone,
    rhythmPhase: item.rhythmPhase,
    suggestedMusicEnergy: item.suggestedMusicEnergy,
    imageAppInputJson: item.imageAppInputJson,
  });
}

export function buildRealImageAppJsonFileExport(
  realImageAppInputPreview: RealImageAppInputPreview
): RealImageAppJsonFileExport {
  if (cachedRealImageAppJsonFileExport !== null) {
    return cachedRealImageAppJsonFileExport;
  }

  const previewItems = [...resolvePreviewPackageItems(realImageAppInputPreview)].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (previewItems.length !== REAL_IMAGE_APP_JSON_FILE_EXPORT_ITEM_COUNT) {
    throw new Error("Real image app json file export requires three preview package items");
  }

  const queueOrders = previewItems.map((item) => item.queueOrder);
  if (queueOrders.join(",") !== "0,1,2") {
    throw new Error("Real image app json file export requires queue order zero through two");
  }

  const items = Object.freeze(previewItems.map((item) => buildRealImageAppJsonFileExportItem(item)));

  const fileExport = Object.freeze({
    schemaVersion: REAL_IMAGE_APP_JSON_FILE_EXPORT_SCHEMA_VERSION,
    source: REAL_IMAGE_APP_JSON_FILE_EXPORT_SOURCE,
    mode: REAL_IMAGE_APP_JSON_FILE_EXPORT_MODE,
    items,
  });

  cachedRealImageAppJsonFileExport = fileExport;
  return fileExport;
}

export function serializeRealImageAppJsonFileExport(
  fileExport: RealImageAppJsonFileExport
): string {
  const orderedItems = [...fileExport.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, REAL_IMAGE_APP_JSON_FILE_EXPORT_ITEM_KEY_ORDER));

  const orderedExport: Record<string, unknown> = {};
  for (const key of REAL_IMAGE_APP_JSON_FILE_EXPORT_KEY_ORDER) {
    if (key === "items") {
      orderedExport.items = orderedItems;
    } else {
      orderedExport[key] = fileExport[key as keyof RealImageAppJsonFileExport];
    }
  }

  return JSON.stringify(orderedExport, null, 2);
}

export function computeRealImageAppJsonFileExportFingerprint(
  fileExport: RealImageAppJsonFileExport
): string {
  return digestValue(serializeRealImageAppJsonFileExport(fileExport));
}

export function buildRealImageAppJsonFileDownloadFromExport(
  fileExport: RealImageAppJsonFileExport
): RealImageAppJsonFileDownload {
  return Object.freeze({
    filename: REAL_IMAGE_APP_JSON_FILE_EXPORT_FILENAME,
    contentType: "application/json",
    body: serializeRealImageAppJsonFileExport(fileExport),
    exportFingerprint: computeRealImageAppJsonFileExportFingerprint(fileExport),
  });
}

export function buildRealImageAppJsonFileDownloadFromPreview(
  realImageAppInputPreview: RealImageAppInputPreview
): RealImageAppJsonFileDownload {
  return buildRealImageAppJsonFileDownloadFromExport(
    buildRealImageAppJsonFileExport(realImageAppInputPreview)
  );
}

export function buildRealImageAppJsonFileDownload(): RealImageAppJsonFileDownload {
  if (cachedRealImageAppJsonFileDownload !== null) {
    return cachedRealImageAppJsonFileDownload;
  }

  const download = buildRealImageAppJsonFileDownloadFromPreview(buildRealImageAppInputPreview());
  cachedRealImageAppJsonFileDownload = download;
  return download;
}

export function resetRealImageAppJsonFileExportCacheForVerification(): void {
  cachedRealImageAppJsonFileExport = null;
  cachedRealImageAppJsonFileDownload = null;
}
