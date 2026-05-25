import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "url";
import { CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS } from "./real-spawn-execution-gate.ts";
import { FFMPEG_SOURCE_INPUT_STUB_PATH } from "./ffmpeg-execution-plan.ts";
import type { OutputWriteSafetyGate } from "./output-write-safety-gate.ts";
import { computeOutputWriteSafetyGateFingerprint } from "./output-write-safety-gate.ts";

export type SingleFrameWriteTrialResult = "write-success" | "write-failed" | "write-blocked";

export type SingleFrameWriteMetadata = {
  outputRelativePath: string;
  outputFileExists: boolean;
  outputFileSizeBytes: number;
  overwriteAttempted: false;
  segmentOutputsCreated: boolean;
  additionalOutputsCreated: boolean;
};

export type SingleFrameWriteTrial = {
  version: "v1";
  trialId: string;
  writeGateId: string;
  writeGateFingerprint: string;
  activeTrialState: string;
  maxSpawnCount: typeof SINGLE_FRAME_WRITE_MAX_SPAWN_COUNT;
  spawnCount: number;
  result: SingleFrameWriteTrialResult;
  executionItemId: string;
  executionQueueOrder: typeof SINGLE_FRAME_WRITE_EXECUTION_QUEUE_ORDER;
  targetTimestampSec: typeof SINGLE_FRAME_WRITE_TARGET_TIMESTAMP;
  expectedOutputPath: typeof SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH;
  resolvedExecutable: typeof SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE;
  spawnArgs: readonly string[];
  shell: false;
  stdioMode: "pipe";
  timeoutMs: typeof CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdoutDigest: string;
  stderrDigest: string;
  blockedReason: string | null;
  writeMetadata: SingleFrameWriteMetadata;
  segmentExportExecuted: false;
  multiFrameExecuted: false;
  networkAccess: false;
  uploadExecuted: false;
};

export const SINGLE_FRAME_WRITE_TRIAL_VERSION = "v1" as const;
export const SINGLE_FRAME_WRITE_TRIAL_ID =
  "single-frame-write-trial-gonegi-harbor-25s-v1" as const;
export const SINGLE_FRAME_WRITE_TRIAL_STATE =
  "25s-single-frame-write-trial-one-jpg-only" as const;
export const SINGLE_FRAME_WRITE_MAX_SPAWN_COUNT = 1 as const;
export const SINGLE_FRAME_WRITE_EXECUTION_QUEUE_ORDER = 0 as const;
export const SINGLE_FRAME_WRITE_TARGET_TIMESTAMP = "4.000" as const;
export const SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE = "ffmpeg" as const;
export const SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH =
  "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg" as const;

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let cachedSingleFrameWriteTrial: SingleFrameWriteTrial | null = null;
let singleFrameWriteSpawnCount = 0;

function digestBuffer(buffer: Buffer | null | undefined): string {
  return crypto.createHash("sha256").update(buffer ?? Buffer.alloc(0)).digest("hex");
}

function resolveAbsolutePath(relativePath: string): string {
  return path.join(PROJECT_ROOT, relativePath);
}

function buildSpawnArgs(expectedOutputPath: string): readonly string[] {
  return Object.freeze([
    "-ss",
    SINGLE_FRAME_WRITE_TARGET_TIMESTAMP,
    "-i",
    FFMPEG_SOURCE_INPUT_STUB_PATH,
    "-frames:v",
    "1",
    expectedOutputPath,
  ]);
}

function resolvePrimaryWriteItem(writeGate: OutputWriteSafetyGate) {
  return [...writeGate.items].sort((a, b) => a.queueOrder - b.queueOrder)[0] ?? null;
}

function ensureSourceInputStubExists(): boolean {
  const sourceAbsolutePath = resolveAbsolutePath(FFMPEG_SOURCE_INPUT_STUB_PATH);
  if (fs.existsSync(sourceAbsolutePath)) {
    return true;
  }

  fs.mkdirSync(path.dirname(sourceAbsolutePath), { recursive: true });

  const bootstrapResult = spawnSync(
    SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE,
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

function countFrameOutputs(): number {
  const framesRoot = resolveAbsolutePath("storage/pilot-intake/stubs");
  if (!fs.existsSync(framesRoot)) {
    return 0;
  }

  let frameCount = 0;
  const walk = (currentPath: string): void => {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "segments") {
          continue;
        }
        walk(entryPath);
        continue;
      }
      if (entry.name.endsWith(".jpg")) {
        frameCount += 1;
      }
    }
  };

  walk(framesRoot);
  return frameCount;
}

function hasSegmentOutputs(): boolean {
  const stubsRoot = resolveAbsolutePath("storage/pilot-intake/stubs");
  if (!fs.existsSync(stubsRoot)) {
    return false;
  }

  for (const segmentEntry of fs.readdirSync(stubsRoot, { withFileTypes: true })) {
    if (!segmentEntry.isDirectory()) {
      continue;
    }
    const segmentsDir = path.join(stubsRoot, segmentEntry.name, "segments");
    if (fs.existsSync(segmentsDir) && fs.readdirSync(segmentsDir).length > 0) {
      return true;
    }
  }

  return false;
}

function resolveWriteBlockedReason(
  writeGate: OutputWriteSafetyGate,
  writeItem: NonNullable<ReturnType<typeof resolvePrimaryWriteItem>>,
  outputAbsolutePath: string
): string | null {
  if (writeGate.writeEnabled) {
    return "write-gate-enabled-unexpected";
  }
  if (writeGate.frameExtractionEnabled || writeGate.segmentExtractionEnabled) {
    return "extraction-enabled-unexpected";
  }
  if (singleFrameWriteSpawnCount >= SINGLE_FRAME_WRITE_MAX_SPAWN_COUNT) {
    return "max-spawn-count-reached";
  }
  if (writeItem.queueOrder !== SINGLE_FRAME_WRITE_EXECUTION_QUEUE_ORDER) {
    return "execution-item-not-zero";
  }
  if (writeItem.mode !== "frame-export") {
    return "segment-export-forbidden";
  }
  if (writeItem.writeState !== "write-ready") {
    return writeItem.blockedReason ?? "write-item-not-ready";
  }
  if (writeItem.expectedOutputPath !== SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH) {
    return "expected-output-path-mismatch";
  }
  if (fs.existsSync(outputAbsolutePath)) {
    return "output-already-exists-no-overwrite";
  }
  if (!ensureSourceInputStubExists()) {
    return "source-input-stub-unavailable";
  }
  return null;
}

function buildWriteMetadata(outputRelativePath: string): SingleFrameWriteMetadata {
  const outputAbsolutePath = resolveAbsolutePath(outputRelativePath);
  const outputFileExists = fs.existsSync(outputAbsolutePath);
  const outputFileSizeBytes = outputFileExists ? fs.statSync(outputAbsolutePath).size : 0;
  const frameOutputCount = countFrameOutputs();
  const segmentOutputsCreated = hasSegmentOutputs();
  const additionalOutputsCreated =
    frameOutputCount > 1 ||
    (frameOutputCount === 1 && outputRelativePath !== SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH);

  return Object.freeze({
    outputRelativePath,
    outputFileExists,
    outputFileSizeBytes,
    overwriteAttempted: false,
    segmentOutputsCreated,
    additionalOutputsCreated,
  });
}

function buildBlockedTrial(
  writeGate: OutputWriteSafetyGate,
  writeItem: NonNullable<ReturnType<typeof resolvePrimaryWriteItem>>,
  blockedReason: string,
  spawnArgs: readonly string[]
): SingleFrameWriteTrial {
  return Object.freeze({
    version: SINGLE_FRAME_WRITE_TRIAL_VERSION,
    trialId: SINGLE_FRAME_WRITE_TRIAL_ID,
    writeGateId: writeGate.writeGateId,
    writeGateFingerprint: computeOutputWriteSafetyGateFingerprint(writeGate),
    activeTrialState: SINGLE_FRAME_WRITE_TRIAL_STATE,
    maxSpawnCount: SINGLE_FRAME_WRITE_MAX_SPAWN_COUNT,
    spawnCount: singleFrameWriteSpawnCount,
    result: "write-blocked",
    executionItemId: writeItem.executionItemId,
    executionQueueOrder: SINGLE_FRAME_WRITE_EXECUTION_QUEUE_ORDER,
    targetTimestampSec: SINGLE_FRAME_WRITE_TARGET_TIMESTAMP,
    expectedOutputPath: SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH,
    resolvedExecutable: SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE,
    spawnArgs,
    shell: false,
    stdioMode: "pipe",
    timeoutMs: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
    exitCode: null,
    signal: null,
    stdoutDigest: digestBuffer(null),
    stderrDigest: digestBuffer(null),
    blockedReason,
    writeMetadata: buildWriteMetadata(SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH),
    segmentExportExecuted: false,
    multiFrameExecuted: false,
    networkAccess: false,
    uploadExecuted: false,
  });
}

function executeSingleFrameWrite(
  writeGate: OutputWriteSafetyGate,
  writeItem: NonNullable<ReturnType<typeof resolvePrimaryWriteItem>>,
  spawnArgs: readonly string[]
): SingleFrameWriteTrial {
  singleFrameWriteSpawnCount += 1;

  const outputAbsolutePath = resolveAbsolutePath(SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH);
  fs.mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });

  const spawnResult = spawnSync(SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE, [...spawnArgs], {
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
    windowsHide: true,
  });

  const stdoutDigest = digestBuffer(spawnResult.stdout);
  const stderrDigest = digestBuffer(spawnResult.stderr);
  const exitCode = spawnResult.status;
  const signal = spawnResult.signal;
  const writeMetadata = buildWriteMetadata(SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH);
  const writeFailed =
    spawnResult.error !== undefined ||
    exitCode !== 0 ||
    signal !== null ||
    !writeMetadata.outputFileExists ||
    writeMetadata.outputFileSizeBytes <= 0 ||
    writeMetadata.segmentOutputsCreated ||
    writeMetadata.additionalOutputsCreated;

  return Object.freeze({
    version: SINGLE_FRAME_WRITE_TRIAL_VERSION,
    trialId: SINGLE_FRAME_WRITE_TRIAL_ID,
    writeGateId: writeGate.writeGateId,
    writeGateFingerprint: computeOutputWriteSafetyGateFingerprint(writeGate),
    activeTrialState: SINGLE_FRAME_WRITE_TRIAL_STATE,
    maxSpawnCount: SINGLE_FRAME_WRITE_MAX_SPAWN_COUNT,
    spawnCount: singleFrameWriteSpawnCount,
    result: writeFailed ? "write-failed" : "write-success",
    executionItemId: writeItem.executionItemId,
    executionQueueOrder: SINGLE_FRAME_WRITE_EXECUTION_QUEUE_ORDER,
    targetTimestampSec: SINGLE_FRAME_WRITE_TARGET_TIMESTAMP,
    expectedOutputPath: SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH,
    resolvedExecutable: SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE,
    spawnArgs,
    shell: false,
    stdioMode: "pipe",
    timeoutMs: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
    exitCode,
    signal,
    stdoutDigest,
    stderrDigest,
    blockedReason: spawnResult.error?.message ?? null,
    writeMetadata,
    segmentExportExecuted: false,
    multiFrameExecuted: false,
    networkAccess: false,
    uploadExecuted: false,
  });
}

export function buildSingleFrameWriteTrial(
  writeGate: OutputWriteSafetyGate
): SingleFrameWriteTrial {
  if (cachedSingleFrameWriteTrial !== null) {
    return cachedSingleFrameWriteTrial;
  }

  const writeItem = resolvePrimaryWriteItem(writeGate);
  if (writeItem === null) {
    throw new Error("Missing primary output write safety item");
  }

  const spawnArgs = buildSpawnArgs(writeItem.expectedOutputPath);
  const blockedReason = resolveWriteBlockedReason(
    writeGate,
    writeItem,
    resolveAbsolutePath(SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH)
  );

  const trial =
    blockedReason === null
      ? executeSingleFrameWrite(writeGate, writeItem, spawnArgs)
      : buildBlockedTrial(writeGate, writeItem, blockedReason, spawnArgs);

  cachedSingleFrameWriteTrial = trial;
  return trial;
}

export const SINGLE_FRAME_WRITE_TRIAL_KEY_ORDER = Object.freeze([
  "version",
  "trialId",
  "writeGateId",
  "writeGateFingerprint",
  "activeTrialState",
  "maxSpawnCount",
  "spawnCount",
  "result",
  "executionItemId",
  "executionQueueOrder",
  "targetTimestampSec",
  "expectedOutputPath",
  "resolvedExecutable",
  "spawnArgs",
  "shell",
  "stdioMode",
  "timeoutMs",
  "exitCode",
  "signal",
  "stdoutDigest",
  "stderrDigest",
  "blockedReason",
  "writeMetadata",
  "segmentExportExecuted",
  "multiFrameExecuted",
  "networkAccess",
  "uploadExecuted",
] as const);

export const SINGLE_FRAME_WRITE_METADATA_KEY_ORDER = Object.freeze([
  "outputRelativePath",
  "outputFileExists",
  "outputFileSizeBytes",
  "overwriteAttempted",
  "segmentOutputsCreated",
  "additionalOutputsCreated",
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

export function serializeSingleFrameWriteTrial(trial: SingleFrameWriteTrial): string {
  const orderedTrial = orderRecord(trial, SINGLE_FRAME_WRITE_TRIAL_KEY_ORDER);
  orderedTrial.spawnArgs = [...trial.spawnArgs];
  orderedTrial.writeMetadata = orderRecord(trial.writeMetadata, SINGLE_FRAME_WRITE_METADATA_KEY_ORDER);
  return JSON.stringify(orderedTrial);
}

export function computeSingleFrameWriteTrialFingerprint(trial: SingleFrameWriteTrial): string {
  return crypto.createHash("sha256").update(serializeSingleFrameWriteTrial(trial)).digest("hex");
}

export function resetSingleFrameWriteTrialCacheForVerification(): void {
  cachedSingleFrameWriteTrial = null;
  singleFrameWriteSpawnCount = 0;
}
