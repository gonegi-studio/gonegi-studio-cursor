import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "url";
import { CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS } from "./real-spawn-execution-gate.ts";
import { FFMPEG_SOURCE_INPUT_STUB_PATH } from "./ffmpeg-execution-plan.ts";
import type { SingleFrameWriteTrial } from "./single-frame-write-trial.ts";
import {
  SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH,
  SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE,
  computeSingleFrameWriteTrialFingerprint,
} from "./single-frame-write-trial.ts";

export type MultiFrameControlledExtractionResult =
  | "extraction-success"
  | "extraction-failed"
  | "extraction-blocked";

export type MultiFrameExtractionItemResult = "extracted" | "reused-existing" | "spawn-failed" | "blocked";

export type MultiFrameExtractionItem = {
  extractionItemId: string;
  queueOrder: number;
  executionItemId: string;
  targetTimestampSec: string;
  expectedOutputPath: string;
  itemResult: MultiFrameExtractionItemResult;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdoutDigest: string;
  stderrDigest: string;
  outputFileSizeBytes: number;
  blockedReason: string | null;
};

export type MultiFrameControlledExtractionMetadata = {
  totalExtractedFrames: number;
  totalOutputBytes: number;
  extractionDurationMs: number;
  createdOutputPaths: readonly string[];
  blockedOutputPaths: readonly string[];
};

export type MultiFrameControlledExtraction = {
  version: "v1";
  extractionId: string;
  singleFrameTrialId: string;
  singleFrameTrialFingerprint: string;
  writeGateFingerprint: string;
  activeExtractionState: string;
  maxFrameCount: typeof MULTI_FRAME_CONTROLLED_MAX_FRAME_COUNT;
  spawnCount: number;
  result: MultiFrameControlledExtractionResult;
  resolvedExecutable: typeof SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE;
  shell: false;
  stdioMode: "pipe";
  timeoutMs: typeof CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS;
  items: readonly MultiFrameExtractionItem[];
  metadata: MultiFrameControlledExtractionMetadata;
  segmentExportExecuted: false;
  overwriteExecuted: false;
  networkAccess: false;
  uploadExecuted: false;
};

export const MULTI_FRAME_CONTROLLED_EXTRACTION_VERSION = "v1" as const;
export const MULTI_FRAME_CONTROLLED_EXTRACTION_ID =
  "multi-frame-controlled-extraction-gonegi-harbor-25s-v1" as const;
export const MULTI_FRAME_CONTROLLED_EXTRACTION_STATE =
  "25s-multi-frame-controlled-extraction-three-jpg-only" as const;
export const MULTI_FRAME_CONTROLLED_MAX_FRAME_COUNT = 3 as const;
export const MULTI_FRAME_CONTROLLED_MAX_SPAWN_COUNT = 3 as const;

export const MULTI_FRAME_CONTROLLED_TARGET_SPECS = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    executionItemId: "real-spawn-execution-item-001",
    targetTimestampSec: "4.000",
    expectedOutputPath: SINGLE_FRAME_WRITE_EXPECTED_OUTPUT_PATH,
  }),
  Object.freeze({
    queueOrder: 1,
    executionItemId: "real-spawn-execution-item-002",
    targetTimestampSec: "12.500",
    expectedOutputPath:
      "storage/pilot-intake/stubs/segment-002/frames/protagonist-arrival-mid-frame-002.jpg",
  }),
  Object.freeze({
    queueOrder: 2,
    executionItemId: "real-spawn-execution-item-003",
    targetTimestampSec: "21.000",
    expectedOutputPath:
      "storage/pilot-intake/stubs/segment-003/frames/warm-glaze-final-echo-frame-003.jpg",
  }),
] as const);

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const EXPECTED_OUTPUT_PATH_SET: ReadonlySet<string> = new Set(
  MULTI_FRAME_CONTROLLED_TARGET_SPECS.map((target) => target.expectedOutputPath)
);

let cachedMultiFrameControlledExtraction: MultiFrameControlledExtraction | null = null;
let multiFrameControlledSpawnCount = 0;

function digestBuffer(buffer: Buffer | null | undefined): string {
  return crypto.createHash("sha256").update(buffer ?? Buffer.alloc(0)).digest("hex");
}

function resolveAbsolutePath(relativePath: string): string {
  return path.join(PROJECT_ROOT, relativePath);
}

function buildExtractionItemId(index: number): string {
  return `multi-frame-extraction-item-${String(index + 1).padStart(3, "0")}`;
}

function buildSpawnArgs(targetTimestampSec: string, expectedOutputPath: string): readonly string[] {
  return Object.freeze([
    "-ss",
    targetTimestampSec,
    "-i",
    FFMPEG_SOURCE_INPUT_STUB_PATH,
    "-frames:v",
    "1",
    expectedOutputPath,
  ]);
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

function listFrameOutputPaths(): string[] {
  const stubsRoot = resolveAbsolutePath("storage/pilot-intake/stubs");
  if (!fs.existsSync(stubsRoot)) {
    return [];
  }

  const framePaths: string[] = [];
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
        framePaths.push(
          path.relative(PROJECT_ROOT, entryPath).split(path.sep).join("/")
        );
      }
    }
  };

  walk(stubsRoot);
  return framePaths.sort((a, b) => a.localeCompare(b));
}

function resolveOutputFileSizeBytes(relativePath: string): number {
  const absolutePath = resolveAbsolutePath(relativePath);
  if (!fs.existsSync(absolutePath)) {
    return 0;
  }
  return fs.statSync(absolutePath).size;
}

function resolveGlobalBlockedReason(singleFrameWriteTrial: SingleFrameWriteTrial): string | null {
  if (singleFrameWriteTrial.segmentExportExecuted) {
    return "segment-export-forbidden";
  }
  if (singleFrameWriteTrial.multiFrameExecuted) {
    return "prior-multi-frame-flag-set";
  }
  if (singleFrameWriteTrial.expectedOutputPath !== MULTI_FRAME_CONTROLLED_TARGET_SPECS[0].expectedOutputPath) {
    return "single-frame-output-path-mismatch";
  }
  if (singleFrameWriteTrial.result !== "write-success") {
    return singleFrameWriteTrial.blockedReason ?? `single-frame-${singleFrameWriteTrial.result}`;
  }
  if (multiFrameControlledSpawnCount >= MULTI_FRAME_CONTROLLED_MAX_SPAWN_COUNT) {
    return "max-spawn-count-reached";
  }
  if (!ensureSourceInputStubExists()) {
    return "source-input-stub-unavailable";
  }
  return null;
}

function executeTargetExtraction(
  target: (typeof MULTI_FRAME_CONTROLLED_TARGET_SPECS)[number],
  index: number,
  createdOutputPaths: string[],
  blockedOutputPaths: string[],
  extractionDurationMs: { value: number }
): MultiFrameExtractionItem {
  const outputAbsolutePath = resolveAbsolutePath(target.expectedOutputPath);
  const existingSize = resolveOutputFileSizeBytes(target.expectedOutputPath);

  if (existingSize > 0) {
    return Object.freeze({
      extractionItemId: buildExtractionItemId(index),
      queueOrder: target.queueOrder,
      executionItemId: target.executionItemId,
      targetTimestampSec: target.targetTimestampSec,
      expectedOutputPath: target.expectedOutputPath,
      itemResult: "reused-existing",
      exitCode: 0,
      signal: null,
      stdoutDigest: digestBuffer(null),
      stderrDigest: digestBuffer(null),
      outputFileSizeBytes: existingSize,
      blockedReason: null,
    });
  }

  if (fs.existsSync(outputAbsolutePath)) {
    blockedOutputPaths.push(target.expectedOutputPath);
    return Object.freeze({
      extractionItemId: buildExtractionItemId(index),
      queueOrder: target.queueOrder,
      executionItemId: target.executionItemId,
      targetTimestampSec: target.targetTimestampSec,
      expectedOutputPath: target.expectedOutputPath,
      itemResult: "blocked",
      exitCode: null,
      signal: null,
      stdoutDigest: digestBuffer(null),
      stderrDigest: digestBuffer(null),
      outputFileSizeBytes: 0,
      blockedReason: "output-already-exists-no-overwrite",
    });
  }

  if (multiFrameControlledSpawnCount >= MULTI_FRAME_CONTROLLED_MAX_SPAWN_COUNT) {
    blockedOutputPaths.push(target.expectedOutputPath);
    return Object.freeze({
      extractionItemId: buildExtractionItemId(index),
      queueOrder: target.queueOrder,
      executionItemId: target.executionItemId,
      targetTimestampSec: target.targetTimestampSec,
      expectedOutputPath: target.expectedOutputPath,
      itemResult: "blocked",
      exitCode: null,
      signal: null,
      stdoutDigest: digestBuffer(null),
      stderrDigest: digestBuffer(null),
      outputFileSizeBytes: 0,
      blockedReason: "max-spawn-count-reached",
    });
  }

  fs.mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });
  multiFrameControlledSpawnCount += 1;

  const spawnArgs = buildSpawnArgs(target.targetTimestampSec, target.expectedOutputPath);
  const startedAt = Date.now();
  const spawnResult = spawnSync(SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE, [...spawnArgs], {
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
    windowsHide: true,
  });
  extractionDurationMs.value += Date.now() - startedAt;

  const outputFileSizeBytes = resolveOutputFileSizeBytes(target.expectedOutputPath);
  const spawnFailed =
    spawnResult.error !== undefined ||
    spawnResult.status !== 0 ||
    spawnResult.signal !== null ||
    outputFileSizeBytes <= 0;

  if (!spawnFailed) {
    createdOutputPaths.push(target.expectedOutputPath);
  }

  return Object.freeze({
    extractionItemId: buildExtractionItemId(index),
    queueOrder: target.queueOrder,
    executionItemId: target.executionItemId,
    targetTimestampSec: target.targetTimestampSec,
    expectedOutputPath: target.expectedOutputPath,
    itemResult: spawnFailed ? "spawn-failed" : "extracted",
    exitCode: spawnResult.status,
    signal: spawnResult.signal,
    stdoutDigest: digestBuffer(spawnResult.stdout),
    stderrDigest: digestBuffer(spawnResult.stderr),
    outputFileSizeBytes,
    blockedReason: spawnResult.error?.message ?? null,
  });
}

function buildMetadata(
  createdOutputPaths: readonly string[],
  blockedOutputPaths: readonly string[],
  extractionDurationMs: number
): MultiFrameControlledExtractionMetadata {
  const framePaths = listFrameOutputPaths();
  const allowedFramePaths = framePaths.filter((framePath) => EXPECTED_OUTPUT_PATH_SET.has(framePath));
  const totalOutputBytes = allowedFramePaths.reduce(
    (sum, framePath) => sum + resolveOutputFileSizeBytes(framePath),
    0
  );

  return Object.freeze({
    totalExtractedFrames: allowedFramePaths.length,
    totalOutputBytes,
    extractionDurationMs,
    createdOutputPaths: Object.freeze([...createdOutputPaths]),
    blockedOutputPaths: Object.freeze([...blockedOutputPaths]),
  });
}

function resolveExtractionResult(
  items: readonly MultiFrameExtractionItem[],
  metadata: MultiFrameControlledExtractionMetadata
): MultiFrameControlledExtractionResult {
  if (items.some((item) => item.itemResult === "blocked")) {
    return "extraction-blocked";
  }
  if (
    items.some((item) => item.itemResult === "spawn-failed") ||
    metadata.totalExtractedFrames !== MULTI_FRAME_CONTROLLED_MAX_FRAME_COUNT ||
    metadata.totalOutputBytes <= 0
  ) {
    return "extraction-failed";
  }

  const framePaths = listFrameOutputPaths();
  const extraOutputs = framePaths.some((framePath) => !EXPECTED_OUTPUT_PATH_SET.has(framePath));
  if (extraOutputs || hasSegmentOutputs()) {
    return "extraction-failed";
  }

  return "extraction-success";
}

function buildMultiFrameControlledExtractionInternal(
  singleFrameWriteTrial: SingleFrameWriteTrial
): MultiFrameControlledExtraction {
  const globalBlockedReason = resolveGlobalBlockedReason(singleFrameWriteTrial);
  const createdOutputPaths: string[] = [];
  const blockedOutputPaths: string[] = [];
  const extractionDurationMs = { value: 0 };

  const items =
    globalBlockedReason === null
      ? Object.freeze(
          MULTI_FRAME_CONTROLLED_TARGET_SPECS.map((target, index) =>
            executeTargetExtraction(
              target,
              index,
              createdOutputPaths,
              blockedOutputPaths,
              extractionDurationMs
            )
          )
        )
      : Object.freeze(
          MULTI_FRAME_CONTROLLED_TARGET_SPECS.map((target, index) => {
            blockedOutputPaths.push(target.expectedOutputPath);
            return Object.freeze({
              extractionItemId: buildExtractionItemId(index),
              queueOrder: target.queueOrder,
              executionItemId: target.executionItemId,
              targetTimestampSec: target.targetTimestampSec,
              expectedOutputPath: target.expectedOutputPath,
              itemResult: "blocked" as const,
              exitCode: null,
              signal: null,
              stdoutDigest: digestBuffer(null),
              stderrDigest: digestBuffer(null),
              outputFileSizeBytes: resolveOutputFileSizeBytes(target.expectedOutputPath),
              blockedReason: globalBlockedReason,
            });
          })
        );

  const metadata = buildMetadata(createdOutputPaths, blockedOutputPaths, extractionDurationMs.value);

  return Object.freeze({
    version: MULTI_FRAME_CONTROLLED_EXTRACTION_VERSION,
    extractionId: MULTI_FRAME_CONTROLLED_EXTRACTION_ID,
    singleFrameTrialId: singleFrameWriteTrial.trialId,
    singleFrameTrialFingerprint: computeSingleFrameWriteTrialFingerprint(singleFrameWriteTrial),
    writeGateFingerprint: singleFrameWriteTrial.writeGateFingerprint,
    activeExtractionState: MULTI_FRAME_CONTROLLED_EXTRACTION_STATE,
    maxFrameCount: MULTI_FRAME_CONTROLLED_MAX_FRAME_COUNT,
    spawnCount: multiFrameControlledSpawnCount,
    result: resolveExtractionResult(items, metadata),
    resolvedExecutable: SINGLE_FRAME_WRITE_RESOLVED_EXECUTABLE,
    shell: false,
    stdioMode: "pipe",
    timeoutMs: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
    items,
    metadata,
    segmentExportExecuted: false,
    overwriteExecuted: false,
    networkAccess: false,
    uploadExecuted: false,
  });
}

export function buildMultiFrameControlledExtraction(
  singleFrameWriteTrial: SingleFrameWriteTrial
): MultiFrameControlledExtraction {
  if (cachedMultiFrameControlledExtraction !== null) {
    return cachedMultiFrameControlledExtraction;
  }

  const extraction = buildMultiFrameControlledExtractionInternal(singleFrameWriteTrial);
  cachedMultiFrameControlledExtraction = extraction;
  return extraction;
}

export const MULTI_FRAME_CONTROLLED_EXTRACTION_KEY_ORDER = Object.freeze([
  "version",
  "extractionId",
  "singleFrameTrialId",
  "singleFrameTrialFingerprint",
  "writeGateFingerprint",
  "activeExtractionState",
  "maxFrameCount",
  "spawnCount",
  "result",
  "resolvedExecutable",
  "shell",
  "stdioMode",
  "timeoutMs",
  "items",
  "metadata",
  "segmentExportExecuted",
  "overwriteExecuted",
  "networkAccess",
  "uploadExecuted",
] as const);

export const MULTI_FRAME_EXTRACTION_ITEM_KEY_ORDER = Object.freeze([
  "extractionItemId",
  "queueOrder",
  "executionItemId",
  "targetTimestampSec",
  "expectedOutputPath",
  "itemResult",
  "exitCode",
  "signal",
  "stdoutDigest",
  "stderrDigest",
  "outputFileSizeBytes",
  "blockedReason",
] as const);

export const MULTI_FRAME_CONTROLLED_EXTRACTION_METADATA_KEY_ORDER = Object.freeze([
  "totalExtractedFrames",
  "totalOutputBytes",
  "extractionDurationMs",
  "createdOutputPaths",
  "blockedOutputPaths",
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

export function serializeMultiFrameControlledExtraction(
  extraction: MultiFrameControlledExtraction
): string {
  const orderedItems = [...extraction.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, MULTI_FRAME_EXTRACTION_ITEM_KEY_ORDER));

  const orderedMetadata = orderRecord(extraction.metadata, MULTI_FRAME_CONTROLLED_EXTRACTION_METADATA_KEY_ORDER);
  orderedMetadata.createdOutputPaths = [...extraction.metadata.createdOutputPaths];
  orderedMetadata.blockedOutputPaths = [...extraction.metadata.blockedOutputPaths];

  const orderedExtraction: Record<string, unknown> = {};
  for (const key of MULTI_FRAME_CONTROLLED_EXTRACTION_KEY_ORDER) {
    if (key === "items") {
      orderedExtraction.items = orderedItems;
    } else if (key === "metadata") {
      orderedExtraction.metadata = orderedMetadata;
    } else {
      orderedExtraction[key] = extraction[key as keyof MultiFrameControlledExtraction];
    }
  }

  return JSON.stringify(orderedExtraction);
}

export function computeMultiFrameControlledExtractionFingerprint(
  extraction: MultiFrameControlledExtraction
): string {
  return crypto
    .createHash("sha256")
    .update(serializeMultiFrameControlledExtraction(extraction))
    .digest("hex");
}

export function resetMultiFrameControlledExtractionCacheForVerification(): void {
  cachedMultiFrameControlledExtraction = null;
  multiFrameControlledSpawnCount = 0;
}
