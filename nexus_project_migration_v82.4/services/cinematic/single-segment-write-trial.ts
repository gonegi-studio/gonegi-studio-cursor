import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "url";
import { CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS } from "./real-spawn-execution-gate.ts";
import { FFMPEG_SOURCE_INPUT_STUB_PATH } from "./ffmpeg-execution-plan.ts";
import type { MultiFrameControlledExtraction } from "./multi-frame-controlled-extraction.ts";
import {
  MULTI_FRAME_CONTROLLED_TARGET_SPECS,
  computeMultiFrameControlledExtractionFingerprint,
} from "./multi-frame-controlled-extraction.ts";
import { OUTPUT_WRITE_ALLOWED_ROOT } from "./output-write-safety-gate.ts";
import { SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE } from "./single-frame-write-trial.ts";

export type SingleSegmentWriteResult = "write-success" | "write-failed" | "write-blocked";

export type SingleSegmentWriteItem = {
  writeItemId: string;
  queueOrder: typeof SINGLE_SEGMENT_WRITE_QUEUE_ORDER;
  executionItemId: typeof SINGLE_SEGMENT_WRITE_EXECUTION_ITEM_ID;
  segmentId: typeof SINGLE_SEGMENT_WRITE_SEGMENT_ID;
  mode: "segment-export";
  startTimestampSec: typeof SINGLE_SEGMENT_WRITE_START_TIMESTAMP;
  durationTimestampSec: typeof SINGLE_SEGMENT_WRITE_DURATION_TIMESTAMP;
  expectedOutputPath: typeof SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH;
  writeState: "write-ready" | "write-blocked";
  blockedReason: string | null;
};

export type SingleSegmentWriteTrial = {
  version: "v1";
  trialId: string;
  multiFrameExtractionId: string;
  multiFrameExtractionFingerprint: string;
  activeTrialState: string;
  writeEnabled: true;
  segmentExtractionEnabled: true;
  multiSegmentExtractionEnabled: false;
  maxSegmentsPerRun: typeof SINGLE_SEGMENT_WRITE_MAX_SEGMENTS_PER_RUN;
  overwriteExistingOutputs: false;
  allowedOutputExtensions: typeof SINGLE_SEGMENT_WRITE_ALLOWED_OUTPUT_EXTENSIONS;
  maxSpawnCount: typeof SINGLE_SEGMENT_WRITE_MAX_SPAWN_COUNT;
  spawnCount: number;
  result: SingleSegmentWriteResult;
  item: SingleSegmentWriteItem;
  resolvedExecutable: typeof SINGLE_SEGMENT_WRITE_RESOLVED_EXECUTABLE;
  spawnArgs: readonly string[];
  shell: false;
  stdioMode: "pipe";
  timeoutMs: typeof CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdoutDigest: string;
  stderrDigest: string;
  outputFileExists: boolean;
  outputFileSizeBytes: number;
  jpgOverwriteDetected: boolean;
  additionalSegmentOutputsDetected: boolean;
  blockedReason: string | null;
  networkAccess: false;
  uploadExecuted: false;
};

export const SINGLE_SEGMENT_WRITE_TRIAL_VERSION = "v1" as const;
export const SINGLE_SEGMENT_WRITE_TRIAL_ID =
  "single-segment-write-trial-gonegi-harbor-25s-v1" as const;
export const SINGLE_SEGMENT_WRITE_TRIAL_STATE =
  "25s-single-segment-write-trial-one-mp4-only" as const;
export const SINGLE_SEGMENT_WRITE_MAX_SPAWN_COUNT = 1 as const;
export const SINGLE_SEGMENT_WRITE_MAX_SEGMENTS_PER_RUN = 1 as const;
export const SINGLE_SEGMENT_WRITE_QUEUE_ORDER = 3 as const;
export const SINGLE_SEGMENT_WRITE_EXECUTION_ITEM_ID = "real-spawn-execution-item-004" as const;
export const SINGLE_SEGMENT_WRITE_SEGMENT_ID = "segment-001" as const;
export const SINGLE_SEGMENT_WRITE_START_TIMESTAMP = "0" as const;
export const SINGLE_SEGMENT_WRITE_DURATION_TIMESTAMP = "8" as const;
export const SINGLE_SEGMENT_WRITE_RESOLVED_EXECUTABLE = SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE;
export const SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH =
  "storage/pilot-intake/stubs/segment-001/segments/harbor-opening-segment-001.mp4" as const;
export const SINGLE_SEGMENT_WRITE_ALLOWED_OUTPUT_EXTENSIONS = Object.freeze([".mp4"] as const);

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let cachedSingleSegmentWriteTrial: SingleSegmentWriteTrial | null = null;
let singleSegmentWriteSpawnCount = 0;

function digestBuffer(buffer: Buffer | null | undefined): string {
  return crypto.createHash("sha256").update(buffer ?? Buffer.alloc(0)).digest("hex");
}

function resolveAbsolutePath(relativePath: string): string {
  return path.join(PROJECT_ROOT, relativePath);
}

function buildSpawnArgs(expectedOutputPath: string): readonly string[] {
  return Object.freeze([
    "-ss",
    SINGLE_SEGMENT_WRITE_START_TIMESTAMP,
    "-t",
    SINGLE_SEGMENT_WRITE_DURATION_TIMESTAMP,
    "-i",
    FFMPEG_SOURCE_INPUT_STUB_PATH,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "ultrafast",
    "-crf",
    "23",
    "-an",
    expectedOutputPath,
  ]);
}

function buildWriteItemId(): string {
  return "single-segment-write-item-001";
}

function ensureSourceInputStubExists(): boolean {
  const sourceAbsolutePath = resolveAbsolutePath(FFMPEG_SOURCE_INPUT_STUB_PATH);
  if (fs.existsSync(sourceAbsolutePath)) {
    return true;
  }

  fs.mkdirSync(path.dirname(sourceAbsolutePath), { recursive: true });

  const bootstrapResult = spawnSync(
    SINGLE_SEGMENT_WRITE_RESOLVED_EXECUTABLE,
    [
      "-f",
      "lavfi",
      "-i",
      "color=c=0x1a2b3c:s=320x240:d=25",
      "-pix_fmt",
      "yuv420p",
      "-c:v",
      "libx264",
      "-t",
      "25",
      "-an",
      "-f",
      "mp4",
      sourceAbsolutePath,
    ],
    {
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
      windowsHide: true,
    }
  );

  return (
    bootstrapResult.error === undefined &&
    bootstrapResult.status === 0 &&
    bootstrapResult.signal === null &&
    fs.existsSync(sourceAbsolutePath)
  );
}

function snapshotJpgFileSizes(): Map<string, number> {
  const sizes = new Map<string, number>();
  for (const target of MULTI_FRAME_CONTROLLED_TARGET_SPECS) {
    const absolutePath = resolveAbsolutePath(target.expectedOutputPath);
    sizes.set(target.expectedOutputPath, fs.existsSync(absolutePath) ? fs.statSync(absolutePath).size : 0);
  }
  return sizes;
}

function detectJpgOverwrite(before: Map<string, number>): boolean {
  for (const [relativePath, previousSize] of before.entries()) {
    const absolutePath = resolveAbsolutePath(relativePath);
    if (!fs.existsSync(absolutePath)) {
      if (previousSize > 0) {
        return true;
      }
      continue;
    }
    if (fs.statSync(absolutePath).size !== previousSize) {
      return true;
    }
  }
  return false;
}

function listSegmentOutputPaths(): string[] {
  const stubsRoot = resolveAbsolutePath(OUTPUT_WRITE_ALLOWED_ROOT);
  if (!fs.existsSync(stubsRoot)) {
    return [];
  }

  const segmentPaths: string[] = [];
  for (const segmentEntry of fs.readdirSync(stubsRoot, { withFileTypes: true })) {
    if (!segmentEntry.isDirectory()) {
      continue;
    }
    const segmentsDir = path.join(stubsRoot, segmentEntry.name, "segments");
    if (!fs.existsSync(segmentsDir)) {
      continue;
    }
    for (const fileEntry of fs.readdirSync(segmentsDir, { withFileTypes: true })) {
      if (!fileEntry.isFile()) {
        continue;
      }
      if (fileEntry.name.endsWith(".mp4") || fileEntry.name.endsWith(".stub")) {
        segmentPaths.push(
          path
            .relative(PROJECT_ROOT, path.join(segmentsDir, fileEntry.name))
            .split(path.sep)
            .join("/")
        );
      }
    }
  }

  return segmentPaths.sort((a, b) => a.localeCompare(b));
}

function isPathWithinAllowedRoot(outputPath: string): boolean {
  return (
    outputPath.startsWith(OUTPUT_WRITE_ALLOWED_ROOT) &&
    !outputPath.split("/").some((segment) => segment === "..")
  );
}

function buildWriteItem(blockedReason: string | null): SingleSegmentWriteItem {
  return Object.freeze({
    writeItemId: buildWriteItemId(),
    queueOrder: SINGLE_SEGMENT_WRITE_QUEUE_ORDER,
    executionItemId: SINGLE_SEGMENT_WRITE_EXECUTION_ITEM_ID,
    segmentId: SINGLE_SEGMENT_WRITE_SEGMENT_ID,
    mode: "segment-export",
    startTimestampSec: SINGLE_SEGMENT_WRITE_START_TIMESTAMP,
    durationTimestampSec: SINGLE_SEGMENT_WRITE_DURATION_TIMESTAMP,
    expectedOutputPath: SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH,
    writeState: blockedReason === null ? "write-ready" : "write-blocked",
    blockedReason,
  });
}

function resolveBlockedReason(multiFrameExtraction: MultiFrameControlledExtraction): string | null {
  if (multiFrameExtraction.segmentExportExecuted) {
    return "prior-segment-export-flag-set";
  }
  if (multiFrameExtraction.result !== "extraction-success") {
    return "multi-frame-extraction-not-success";
  }
  if (multiFrameExtraction.metadata.totalExtractedFrames !== 3) {
    return "frame-prerequisite-count-mismatch";
  }
  if (singleSegmentWriteSpawnCount >= SINGLE_SEGMENT_WRITE_MAX_SPAWN_COUNT) {
    return "max-spawn-count-reached";
  }
  if (!isPathWithinAllowedRoot(SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH)) {
    return "path-outside-allowed-root";
  }
  if (!SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH.endsWith(".mp4")) {
    return "output-extension-not-allowed";
  }
  const outputAbsolutePath = resolveAbsolutePath(SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH);
  if (fs.existsSync(outputAbsolutePath)) {
    return "output-already-exists-no-overwrite";
  }
  if (!ensureSourceInputStubExists()) {
    return "source-input-stub-unavailable";
  }
  return null;
}

function buildBlockedTrial(
  multiFrameExtraction: MultiFrameControlledExtraction,
  blockedReason: string,
  spawnArgs: readonly string[]
): SingleSegmentWriteTrial {
  return Object.freeze({
    version: SINGLE_SEGMENT_WRITE_TRIAL_VERSION,
    trialId: SINGLE_SEGMENT_WRITE_TRIAL_ID,
    multiFrameExtractionId: multiFrameExtraction.extractionId,
    multiFrameExtractionFingerprint: computeMultiFrameControlledExtractionFingerprint(multiFrameExtraction),
    activeTrialState: SINGLE_SEGMENT_WRITE_TRIAL_STATE,
    writeEnabled: true,
    segmentExtractionEnabled: true,
    multiSegmentExtractionEnabled: false,
    maxSegmentsPerRun: SINGLE_SEGMENT_WRITE_MAX_SEGMENTS_PER_RUN,
    overwriteExistingOutputs: false,
    allowedOutputExtensions: SINGLE_SEGMENT_WRITE_ALLOWED_OUTPUT_EXTENSIONS,
    maxSpawnCount: SINGLE_SEGMENT_WRITE_MAX_SPAWN_COUNT,
    spawnCount: singleSegmentWriteSpawnCount,
    result: "write-blocked",
    item: buildWriteItem(blockedReason),
    resolvedExecutable: SINGLE_SEGMENT_WRITE_RESOLVED_EXECUTABLE,
    spawnArgs,
    shell: false,
    stdioMode: "pipe",
    timeoutMs: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
    exitCode: null,
    signal: null,
    stdoutDigest: digestBuffer(null),
    stderrDigest: digestBuffer(null),
    outputFileExists: fs.existsSync(resolveAbsolutePath(SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH)),
    outputFileSizeBytes: 0,
    jpgOverwriteDetected: false,
    additionalSegmentOutputsDetected: listSegmentOutputPaths().length > 0,
    blockedReason,
    networkAccess: false,
    uploadExecuted: false,
  });
}

function executeSingleSegmentWrite(
  multiFrameExtraction: MultiFrameControlledExtraction,
  spawnArgs: readonly string[]
): SingleSegmentWriteTrial {
  singleSegmentWriteSpawnCount += 1;

  const outputAbsolutePath = resolveAbsolutePath(SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH);
  const jpgSnapshot = snapshotJpgFileSizes();
  fs.mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });

  const spawnResult = spawnSync(SINGLE_SEGMENT_WRITE_RESOLVED_EXECUTABLE, [...spawnArgs], {
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
    windowsHide: true,
  });

  const outputFileExists = fs.existsSync(outputAbsolutePath);
  const outputFileSizeBytes = outputFileExists ? fs.statSync(outputAbsolutePath).size : 0;
  const segmentPaths = listSegmentOutputPaths();
  const additionalSegmentOutputsDetected =
    segmentPaths.length > 1 ||
    (segmentPaths.length === 1 && segmentPaths[0] !== SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH);
  const jpgOverwriteDetected = detectJpgOverwrite(jpgSnapshot);
  const writeFailed =
    spawnResult.error !== undefined ||
    spawnResult.status !== 0 ||
    spawnResult.signal !== null ||
    !outputFileExists ||
    outputFileSizeBytes <= 0 ||
    jpgOverwriteDetected ||
    additionalSegmentOutputsDetected;

  return Object.freeze({
    version: SINGLE_SEGMENT_WRITE_TRIAL_VERSION,
    trialId: SINGLE_SEGMENT_WRITE_TRIAL_ID,
    multiFrameExtractionId: multiFrameExtraction.extractionId,
    multiFrameExtractionFingerprint: computeMultiFrameControlledExtractionFingerprint(multiFrameExtraction),
    activeTrialState: SINGLE_SEGMENT_WRITE_TRIAL_STATE,
    writeEnabled: true,
    segmentExtractionEnabled: true,
    multiSegmentExtractionEnabled: false,
    maxSegmentsPerRun: SINGLE_SEGMENT_WRITE_MAX_SEGMENTS_PER_RUN,
    overwriteExistingOutputs: false,
    allowedOutputExtensions: SINGLE_SEGMENT_WRITE_ALLOWED_OUTPUT_EXTENSIONS,
    maxSpawnCount: SINGLE_SEGMENT_WRITE_MAX_SPAWN_COUNT,
    spawnCount: singleSegmentWriteSpawnCount,
    result: writeFailed ? "write-failed" : "write-success",
    item: buildWriteItem(null),
    resolvedExecutable: SINGLE_SEGMENT_WRITE_RESOLVED_EXECUTABLE,
    spawnArgs,
    shell: false,
    stdioMode: "pipe",
    timeoutMs: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
    exitCode: spawnResult.status,
    signal: spawnResult.signal,
    stdoutDigest: digestBuffer(spawnResult.stdout),
    stderrDigest: digestBuffer(spawnResult.stderr),
    outputFileExists,
    outputFileSizeBytes,
    jpgOverwriteDetected,
    additionalSegmentOutputsDetected,
    blockedReason: spawnResult.error?.message ?? null,
    networkAccess: false,
    uploadExecuted: false,
  });
}

export function buildSingleSegmentWriteTrial(
  multiFrameExtraction: MultiFrameControlledExtraction
): SingleSegmentWriteTrial {
  if (cachedSingleSegmentWriteTrial !== null) {
    return cachedSingleSegmentWriteTrial;
  }

  const spawnArgs = buildSpawnArgs(SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH);
  const blockedReason = resolveBlockedReason(multiFrameExtraction);
  const trial =
    blockedReason === null
      ? executeSingleSegmentWrite(multiFrameExtraction, spawnArgs)
      : buildBlockedTrial(multiFrameExtraction, blockedReason, spawnArgs);

  cachedSingleSegmentWriteTrial = trial;
  return trial;
}

export const SINGLE_SEGMENT_WRITE_TRIAL_KEY_ORDER = Object.freeze([
  "version",
  "trialId",
  "multiFrameExtractionId",
  "multiFrameExtractionFingerprint",
  "activeTrialState",
  "writeEnabled",
  "segmentExtractionEnabled",
  "multiSegmentExtractionEnabled",
  "maxSegmentsPerRun",
  "overwriteExistingOutputs",
  "allowedOutputExtensions",
  "maxSpawnCount",
  "spawnCount",
  "result",
  "item",
  "resolvedExecutable",
  "spawnArgs",
  "shell",
  "stdioMode",
  "timeoutMs",
  "exitCode",
  "signal",
  "stdoutDigest",
  "stderrDigest",
  "outputFileExists",
  "outputFileSizeBytes",
  "jpgOverwriteDetected",
  "additionalSegmentOutputsDetected",
  "blockedReason",
  "networkAccess",
  "uploadExecuted",
] as const);

export const SINGLE_SEGMENT_WRITE_ITEM_KEY_ORDER = Object.freeze([
  "writeItemId",
  "queueOrder",
  "executionItemId",
  "segmentId",
  "mode",
  "startTimestampSec",
  "durationTimestampSec",
  "expectedOutputPath",
  "writeState",
  "blockedReason",
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

export function serializeSingleSegmentWriteTrial(trial: SingleSegmentWriteTrial): string {
  const orderedTrial = orderRecord(trial, SINGLE_SEGMENT_WRITE_TRIAL_KEY_ORDER);
  orderedTrial.spawnArgs = [...trial.spawnArgs];
  orderedTrial.allowedOutputExtensions = [...trial.allowedOutputExtensions];
  orderedTrial.item = orderRecord(trial.item, SINGLE_SEGMENT_WRITE_ITEM_KEY_ORDER);
  return JSON.stringify(orderedTrial);
}

export function computeSingleSegmentWriteTrialFingerprint(trial: SingleSegmentWriteTrial): string {
  return crypto.createHash("sha256").update(serializeSingleSegmentWriteTrial(trial)).digest("hex");
}

export function resetSingleSegmentWriteTrialCacheForVerification(): void {
  cachedSingleSegmentWriteTrial = null;
  singleSegmentWriteSpawnCount = 0;
}
