import { buildRealImageAppInputPreview } from "./real-image-app-input-package.ts";
import {
  buildRealImageAppJsonFileDownload,
  buildRealImageAppJsonFileExport,
  computeRealImageAppJsonFileExportFingerprint,
} from "./real-image-app-json-file-export.ts";

export const REAL_IMAGE_APP_JSON_FILE_EXPORT_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPreview: buildRealImageAppInputPreview(),
});

export const REAL_IMAGE_APP_JSON_FILE_EXPORT_OUTPUT_EXAMPLE = buildRealImageAppJsonFileExport(
  REAL_IMAGE_APP_JSON_FILE_EXPORT_INPUT_EXAMPLE.realImageAppInputPreview
);

export const REAL_IMAGE_APP_JSON_FILE_EXPORT_FINGERPRINT =
  computeRealImageAppJsonFileExportFingerprint(REAL_IMAGE_APP_JSON_FILE_EXPORT_OUTPUT_EXAMPLE);

export const REAL_IMAGE_APP_JSON_FILE_DOWNLOAD_OUTPUT_EXAMPLE = buildRealImageAppJsonFileDownload();

export const REAL_IMAGE_APP_JSON_FILE_EXPORT_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  timestampSeconds: "4.000",
  dramaFunction: "real-frame-establish" as const,
  rhythmPhase: "rhythm-rise" as const,
  suggestedMusicEnergy: "gentle-build" as const,
});

export const REAL_IMAGE_APP_JSON_FILE_EXPORT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  schemaVersion: "real-image-app-input-v1" as const,
  source: "kiki-25s-real-mp4" as const,
  mode: "cinematic-dna-lab-import" as const,
  filename: REAL_IMAGE_APP_JSON_FILE_DOWNLOAD_OUTPUT_EXAMPLE.filename,
  itemCount: 3,
});
