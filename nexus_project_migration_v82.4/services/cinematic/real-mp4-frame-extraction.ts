import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "url";
import { CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS } from "./real-spawn-execution-gate.ts";
import type { RealVideoFingerprintVerification } from "./real-video-fingerprint-verification.ts";
import {
  REAL_VIDEO_INTAKE_SOURCE_PATH,
  resolveRealVideoIntakeSourceAbsolutePath,
} from "./real-video-intake-manifest.ts";

export type RealMp4FrameExtractionStatus =
  | "extraction-success"
  | "extraction-blocked"
  | "extraction-failed";

export type RealMp4ExtractedFrame = {
  framePath: string;
  timestampSeconds: string;
  frameFingerprint: string;
  fileSizeBytes: number;
};

export type RealMp4FrameExtraction = {
  version: "v1";
  extractionId: string;
  sourceFingerprint: string;
  intakeVideoId: string;
  extractionVersion: typeof REAL_MP4_FRAME_EXTRACTION_KIND_VERSION;
  activeExtractionState: string;
  maxFrameCount: typeof REAL_MP4_FRAME_EXTRACTION_MAX_FRAME_COUNT;
  spawnCount: number;
  extractedFrames: readonly RealMp4ExtractedFrame[];
  extractionStatus: RealMp4FrameExtractionStatus;
  resolvedExecutable: typeof REAL_MP4_FRAME_EXTRACTION_RESOLVED_EXECUTABLE;
  shell: false;
  stdioMode: "pipe";
  timeoutMs: typeof CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS;
  overwriteExecuted: false;
  networkAccess: false;
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_MP4_FRAME_EXTRACTION_VERSION = "v1" as const;
export const REAL_MP4_FRAME_EXTRACTION_KIND_VERSION = "real-mp4-frame-extraction-v1" as const;
export const REAL_MP4_FRAME_EXTRACTION_ID =
  "real-mp4-frame-extraction-gonegi-harbor-25s-v1" as const;
export const REAL_MP4_FRAME_EXTRACTION_STATE =
  "25s-real-mp4-controlled-frame-extraction-three-jpg-only" as const;
export const REAL_MP4_FRAME_EXTRACTION_OUTPUT_ROOT =
  "storage/pilot-intake/real-extraction/frames/" as const;
export const REAL_MP4_FRAME_EXTRACTION_MAX_FRAME_COUNT = 3 as const;
export const REAL_MP4_FRAME_EXTRACTION_MAX_SPAWN_COUNT = 3 as const;
export const REAL_MP4_FRAME_EXTRACTION_RESOLVED_EXECUTABLE = "ffmpeg" as const;
export const REAL_VIDEO_REGISTRATION_STUB_MARKER = "REAL-VIDEO-INTAKE-MANIFEST-V1" as const;
export const REAL_VIDEO_REGISTRATION_STUB_MAX_BYTES = 4096 as const;

export const REAL_MP4_FRAME_EXTRACTION_TARGET_SPECS = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    timestampSeconds: "4.000",
    frameFilename: "kiki-real-keyframe-001-4.000.jpg",
  }),
  Object.freeze({
    queueOrder: 1,
    timestampSeconds: "12.500",
    frameFilename: "kiki-real-keyframe-002-12.500.jpg",
  }),
  Object.freeze({
    queueOrder: 2,
    timestampSeconds: "21.000",
    frameFilename: "kiki-real-keyframe-003-21.000.jpg",
  }),
] as const);

export const REAL_MP4_FRAME_EXTRACTION_KEY_ORDER = Object.freeze([
  "version",
  "extractionId",
  "sourceFingerprint",
  "intakeVideoId",
  "extractionVersion",
  "activeExtractionState",
  "maxFrameCount",
  "spawnCount",
  "extractedFrames",
  "extractionStatus",
  "resolvedExecutable",
  "shell",
  "stdioMode",
  "timeoutMs",
  "overwriteExecuted",
  "networkAccess",
  "inferenceExecuted",
  "providerCallExecuted",
] as const);

export const REAL_MP4_EXTRACTED_FRAME_KEY_ORDER = Object.freeze([
  "framePath",
  "timestampSeconds",
  "frameFingerprint",
  "fileSizeBytes",
] as const);

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const EXPECTED_FRAME_PATH_SET: ReadonlySet<string> = new Set(
  REAL_MP4_FRAME_EXTRACTION_TARGET_SPECS.map(
    (target) => `${REAL_MP4_FRAME_EXTRACTION_OUTPUT_ROOT}${target.frameFilename}`
  )
);

let cachedRealMp4FrameExtraction: RealMp4FrameExtraction | null = null;
let realMp4FrameExtractionSpawnCount = 0;

function digestBuffer(buffer: Buffer | null | undefined): string {
  return crypto.createHash("sha256").update(buffer ?? Buffer.alloc(0)).digest("hex");
}

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveAbsolutePath(relativePath: string): string {
  return path.join(PROJECT_ROOT, relativePath);
}

function buildFramePath(frameFilename: string): string {
  return `${REAL_MP4_FRAME_EXTRACTION_OUTPUT_ROOT}${frameFilename}`;
}

function computeExtractionId(verification: RealVideoFingerprintVerification): string {
  return digestValue(
    [
      REAL_MP4_FRAME_EXTRACTION_KIND_VERSION,
      "extraction",
      verification.verificationRootId,
      verification.sourceFingerprint,
      verification.intakeVideoId,
    ].join("|")
  );
}

function isRegistrationStubSource(): boolean {
  const absolutePath = resolveRealVideoIntakeSourceAbsolutePath();
  if (!fs.existsSync(absolutePath)) {
    return false;
  }

  const sourceFileSizeBytes = fs.statSync(absolutePath).size;
  if (sourceFileSizeBytes > REAL_VIDEO_REGISTRATION_STUB_MAX_BYTES) {
    return false;
  }

  const head = fs
    .readFileSync(absolutePath)
    .subarray(0, REAL_VIDEO_REGISTRATION_STUB_MARKER.length)
    .toString("utf8");
  return head === REAL_VIDEO_REGISTRATION_STUB_MARKER;
}

function resolveOutputFileSizeBytes(relativePath: string): number {
  const absolutePath = resolveAbsolutePath(relativePath);
  if (!fs.existsSync(absolutePath)) {
    return 0;
  }
  return fs.statSync(absolutePath).size;
}

function resolveFrameFingerprint(relativePath: string): string {
  const absolutePath = resolveAbsolutePath(relativePath);
  if (!fs.existsSync(absolutePath)) {
    return digestBuffer(null);
  }
  return digestBuffer(fs.readFileSync(absolutePath));
}

function buildSpawnArgs(timestampSeconds: string, framePath: string): readonly string[] {
  return Object.freeze([
    "-ss",
    timestampSeconds,
    "-i",
    REAL_VIDEO_INTAKE_SOURCE_PATH,
    "-frames:v",
    "1",
    framePath,
  ]);
}

function listRealExtractionFramePaths(): string[] {
  const framesRoot = resolveAbsolutePath(REAL_MP4_FRAME_EXTRACTION_OUTPUT_ROOT);
  if (!fs.existsSync(framesRoot)) {
    return [];
  }

  return fs
    .readdirSync(framesRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jpg"))
    .map((entry) =>
      path
        .relative(PROJECT_ROOT, path.join(framesRoot, entry.name))
        .split(path.sep)
        .join("/")
    )
    .sort((a, b) => a.localeCompare(b));
}

function resolveGlobalBlockedReason(
  verification: RealVideoFingerprintVerification
): string | null {
  if (verification.verificationStatus !== "verified") {
    return "verification-not-verified";
  }
  if (verification.passedCheckCount !== verification.totalCheckCount) {
    return "verification-checks-incomplete";
  }
  if (isRegistrationStubSource()) {
    return "registration-stub-rejected";
  }
  if (!fs.existsSync(resolveRealVideoIntakeSourceAbsolutePath())) {
    return "real-source-video-missing";
  }
  if (realMp4FrameExtractionSpawnCount >= REAL_MP4_FRAME_EXTRACTION_MAX_SPAWN_COUNT) {
    return "max-spawn-count-reached";
  }
  return null;
}

type FrameExtractionAttempt = {
  blocked: boolean;
  spawnFailed: boolean;
};

function executeFrameExtraction(
  target: (typeof REAL_MP4_FRAME_EXTRACTION_TARGET_SPECS)[number]
): FrameExtractionAttempt {
  const framePath = buildFramePath(target.frameFilename);
  const outputAbsolutePath = resolveAbsolutePath(framePath);
  const existingSize = resolveOutputFileSizeBytes(framePath);

  if (existingSize > 0) {
    return Object.freeze({ blocked: false, spawnFailed: false });
  }

  if (fs.existsSync(outputAbsolutePath)) {
    return Object.freeze({ blocked: true, spawnFailed: false });
  }

  if (realMp4FrameExtractionSpawnCount >= REAL_MP4_FRAME_EXTRACTION_MAX_SPAWN_COUNT) {
    return Object.freeze({ blocked: true, spawnFailed: false });
  }

  fs.mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });
  realMp4FrameExtractionSpawnCount += 1;

  const spawnResult = spawnSync(
    REAL_MP4_FRAME_EXTRACTION_RESOLVED_EXECUTABLE,
    [...buildSpawnArgs(target.timestampSeconds, framePath)],
    {
      cwd: PROJECT_ROOT,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
      windowsHide: true,
    }
  );

  const outputFileSizeBytes = resolveOutputFileSizeBytes(framePath);
  const spawnFailed =
    spawnResult.error !== undefined ||
    spawnResult.status !== 0 ||
    spawnResult.signal !== null ||
    outputFileSizeBytes <= 0;

  return Object.freeze({ blocked: false, spawnFailed });
}

function buildExtractedFrame(
  target: (typeof REAL_MP4_FRAME_EXTRACTION_TARGET_SPECS)[number]
): RealMp4ExtractedFrame {
  const framePath = buildFramePath(target.frameFilename);
  const fileSizeBytes = resolveOutputFileSizeBytes(framePath);

  return Object.freeze({
    framePath,
    timestampSeconds: target.timestampSeconds,
    frameFingerprint: resolveFrameFingerprint(framePath),
    fileSizeBytes,
  });
}

function resolveExtractionStatus(
  globalBlockedReason: string | null,
  attempts: readonly FrameExtractionAttempt[],
  extractedFrames: readonly RealMp4ExtractedFrame[]
): RealMp4FrameExtractionStatus {
  if (globalBlockedReason !== null || attempts.some((attempt) => attempt.blocked)) {
    return "extraction-blocked";
  }

  if (
    attempts.some((attempt) => attempt.spawnFailed) ||
    extractedFrames.length !== REAL_MP4_FRAME_EXTRACTION_MAX_FRAME_COUNT ||
    extractedFrames.some((frame) => frame.fileSizeBytes <= 0)
  ) {
    return "extraction-failed";
  }

  const framePaths = listRealExtractionFramePaths();
  const extraOutputs = framePaths.some((framePath) => !EXPECTED_FRAME_PATH_SET.has(framePath));
  if (extraOutputs) {
    return "extraction-failed";
  }

  return "extraction-success";
}

function buildRealMp4FrameExtractionInternal(
  verification: RealVideoFingerprintVerification
): RealMp4FrameExtraction {
  const globalBlockedReason = resolveGlobalBlockedReason(verification);

  const attempts =
    globalBlockedReason === null
      ? Object.freeze(
          REAL_MP4_FRAME_EXTRACTION_TARGET_SPECS.map((target) => executeFrameExtraction(target))
        )
      : Object.freeze([] as FrameExtractionAttempt[]);

  const extractedFrames = Object.freeze(
    REAL_MP4_FRAME_EXTRACTION_TARGET_SPECS.map((target) => buildExtractedFrame(target))
  );

  return Object.freeze({
    version: REAL_MP4_FRAME_EXTRACTION_VERSION,
    extractionId: computeExtractionId(verification),
    sourceFingerprint: verification.sourceFingerprint,
    intakeVideoId: verification.intakeVideoId,
    extractionVersion: REAL_MP4_FRAME_EXTRACTION_KIND_VERSION,
    activeExtractionState: REAL_MP4_FRAME_EXTRACTION_STATE,
    maxFrameCount: REAL_MP4_FRAME_EXTRACTION_MAX_FRAME_COUNT,
    spawnCount: realMp4FrameExtractionSpawnCount,
    extractedFrames,
    extractionStatus: resolveExtractionStatus(globalBlockedReason, attempts, extractedFrames),
    resolvedExecutable: REAL_MP4_FRAME_EXTRACTION_RESOLVED_EXECUTABLE,
    shell: false,
    stdioMode: "pipe",
    timeoutMs: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
    overwriteExecuted: false,
    networkAccess: false,
    inferenceExecuted: false,
    providerCallExecuted: false,
  });
}

export function buildRealMp4FrameExtraction(
  realVideoFingerprintVerification: RealVideoFingerprintVerification
): RealMp4FrameExtraction {
  if (cachedRealMp4FrameExtraction !== null) {
    return cachedRealMp4FrameExtraction;
  }

  const extraction = buildRealMp4FrameExtractionInternal(realVideoFingerprintVerification);
  cachedRealMp4FrameExtraction = extraction;
  return extraction;
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

export function serializeRealMp4FrameExtraction(extraction: RealMp4FrameExtraction): string {
  const orderedFrames = [...extraction.extractedFrames]
    .sort((a, b) => a.timestampSeconds.localeCompare(b.timestampSeconds))
    .map((frame) => orderRecord(frame, REAL_MP4_EXTRACTED_FRAME_KEY_ORDER));

  const orderedExtraction: Record<string, unknown> = {};
  for (const key of REAL_MP4_FRAME_EXTRACTION_KEY_ORDER) {
    if (key === "extractedFrames") {
      orderedExtraction.extractedFrames = orderedFrames;
    } else {
      orderedExtraction[key] = extraction[key as keyof RealMp4FrameExtraction];
    }
  }

  return JSON.stringify(orderedExtraction);
}

export function computeRealMp4FrameExtractionFingerprint(
  extraction: RealMp4FrameExtraction
): string {
  return digestValue(serializeRealMp4FrameExtraction(extraction));
}

export function resetRealMp4FrameExtractionCacheForVerification(): void {
  cachedRealMp4FrameExtraction = null;
  realMp4FrameExtractionSpawnCount = 0;
}

export function isRealVideoRegistrationStubSource(): boolean {
  return isRegistrationStubSource();
}
