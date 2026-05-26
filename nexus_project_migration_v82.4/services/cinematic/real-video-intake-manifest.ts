import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export type RealVideoIntakeSourceRole = "reference-video";

export type RealVideoIntakeManifest = {
  intakeVideoId: string;
  sourceFilename: string;
  sourcePath: string;
  sourceFingerprint: string;
  durationSeconds: number;
  sourceRole: RealVideoIntakeSourceRole;
  datasetIntent: string;
  safetyNote: string;
};

export const REAL_VIDEO_INTAKE_MANIFEST_KIND_VERSION = "real-video-intake-manifest-v1" as const;
export const REAL_VIDEO_INTAKE_SOURCE_FILENAME =
  "Kiki's Delivery Service(FHD)_25s.mp4" as const;
export const REAL_VIDEO_INTAKE_SOURCE_PATH =
  "storage/pilot-intake/source-videos/Kiki's Delivery Service(FHD)_25s.mp4" as const;
export const REAL_VIDEO_INTAKE_DURATION_SECONDS = 25 as const;
export const REAL_VIDEO_INTAKE_SOURCE_ROLE = "reference-video" as const;
export const REAL_VIDEO_INTAKE_DATASET_INTENT =
  "25s-pilot-reference-video-dataset-intake-metadata-only" as const;
export const REAL_VIDEO_INTAKE_SAFETY_NOTE =
  "metadata-intake-only-no-ffmpeg-no-inference-no-generation" as const;

export const REAL_VIDEO_INTAKE_MANIFEST_KEY_ORDER = Object.freeze([
  "intakeVideoId",
  "sourceFilename",
  "sourcePath",
  "sourceFingerprint",
  "durationSeconds",
  "sourceRole",
  "datasetIntent",
  "safetyNote",
] as const);

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let cachedRealVideoIntakeManifest: RealVideoIntakeManifest | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function digestBuffer(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function resolveAbsolutePath(relativePath: string): string {
  return path.resolve(PROJECT_ROOT, relativePath);
}

type ResolvedSourceVideoMetadata = {
  sourceFilename: typeof REAL_VIDEO_INTAKE_SOURCE_FILENAME;
  sourcePath: typeof REAL_VIDEO_INTAKE_SOURCE_PATH;
  sourceFileSizeBytes: number;
  sourceContentFingerprint: string;
};

function resolveSourceVideoMetadata(): ResolvedSourceVideoMetadata {
  const sourcePath = REAL_VIDEO_INTAKE_SOURCE_PATH;
  const sourceFilename = REAL_VIDEO_INTAKE_SOURCE_FILENAME;
  const absolutePath = resolveAbsolutePath(sourcePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error("Real video intake source file must exist at canonical path");
  }

  const sourceFileSizeBytes = fs.statSync(absolutePath).size;
  const sourceContentFingerprint = digestBuffer(fs.readFileSync(absolutePath));

  return Object.freeze({
    sourceFilename,
    sourcePath,
    sourceFileSizeBytes,
    sourceContentFingerprint,
  });
}

function computeSourceFingerprint(metadata: ResolvedSourceVideoMetadata): string {
  return digestValue(
    [
      REAL_VIDEO_INTAKE_MANIFEST_KIND_VERSION,
      "source-fingerprint",
      metadata.sourcePath,
      metadata.sourceFilename,
      String(metadata.sourceFileSizeBytes),
      metadata.sourceContentFingerprint,
    ].join("|")
  );
}

function computeIntakeVideoId(sourceFingerprint: string): string {
  return digestValue(
    [
      REAL_VIDEO_INTAKE_MANIFEST_KIND_VERSION,
      "intake-video",
      REAL_VIDEO_INTAKE_SOURCE_FILENAME,
      REAL_VIDEO_INTAKE_SOURCE_PATH,
      sourceFingerprint,
    ].join("|")
  );
}

export function buildRealVideoIntakeManifest(): RealVideoIntakeManifest {
  if (cachedRealVideoIntakeManifest !== null) {
    return cachedRealVideoIntakeManifest;
  }

  const metadata = resolveSourceVideoMetadata();
  const sourceFingerprint = computeSourceFingerprint(metadata);

  const manifest = Object.freeze({
    intakeVideoId: computeIntakeVideoId(sourceFingerprint),
    sourceFilename: metadata.sourceFilename,
    sourcePath: metadata.sourcePath,
    sourceFingerprint,
    durationSeconds: REAL_VIDEO_INTAKE_DURATION_SECONDS,
    sourceRole: REAL_VIDEO_INTAKE_SOURCE_ROLE,
    datasetIntent: REAL_VIDEO_INTAKE_DATASET_INTENT,
    safetyNote: REAL_VIDEO_INTAKE_SAFETY_NOTE,
  });

  cachedRealVideoIntakeManifest = manifest;
  return manifest;
}

export function serializeRealVideoIntakeManifest(manifest: RealVideoIntakeManifest): string {
  const orderedManifest: Record<string, unknown> = {};
  for (const key of REAL_VIDEO_INTAKE_MANIFEST_KEY_ORDER) {
    orderedManifest[key] = manifest[key as keyof RealVideoIntakeManifest];
  }
  return JSON.stringify(orderedManifest);
}

export function computeRealVideoIntakeManifestFingerprint(
  manifest: RealVideoIntakeManifest
): string {
  return digestValue(serializeRealVideoIntakeManifest(manifest));
}

export function resetRealVideoIntakeManifestCacheForVerification(): void {
  cachedRealVideoIntakeManifest = null;
}

export function resolveRealVideoIntakeSourceAbsolutePath(): string {
  return resolveAbsolutePath(REAL_VIDEO_INTAKE_SOURCE_PATH);
}

export function resolveRealVideoIntakeSourceFileSizeBytes(): number {
  const absolutePath = resolveRealVideoIntakeSourceAbsolutePath();
  if (!fs.existsSync(absolutePath)) {
    throw new Error("Real video intake source file must exist at canonical path");
  }
  return fs.statSync(absolutePath).size;
}
