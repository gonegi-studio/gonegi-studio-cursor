import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "url";
import { CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS } from "./real-spawn-execution-gate.ts";
import { FFMPEG_SOURCE_INPUT_STUB_PATH } from "./ffmpeg-execution-plan.ts";
import { MULTI_FRAME_CONTROLLED_TARGET_SPECS } from "./multi-frame-controlled-extraction.ts";
import { OUTPUT_WRITE_ALLOWED_ROOT } from "./output-write-safety-gate.ts";
import type { SingleSegmentWriteTrial } from "./single-segment-write-trial.ts";
import {
  SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH,
  SINGLE_SEGMENT_WRITE_RESOLVED_EXECUTABLE,
  computeSingleSegmentWriteTrialFingerprint,
} from "./single-segment-write-trial.ts";

export type MultiSegmentExtractionResult = "extraction-success" | "extraction-failed" | "extraction-blocked";

export type MultiSegmentExtractionItemResult = "extracted" | "reused-existing" | "spawn-failed" | "blocked";

export type MultiSegmentExtractionItem = {
  extractionItemId: string;
  queueOrder: number;
  executionItemId: string;
  segmentId: string;
  mode: "segment-export";
  startTimestampSec: string;
  durationTimestampSec: string;
  expectedOutputPath: string;
  itemResult: MultiSegmentExtractionItemResult;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdoutDigest: string;
  stderrDigest: string;
  outputFileSizeBytes: number;
  executionDurationMs: number;
  blockedReason: string | null;
};

export type MultiSegmentControlledExtractionMetadata = {
  totalExtractedSegments: number;
  totalOutputBytes: number;
  extractionDurationMs: number;
  createdSegmentPaths: readonly string[];
  reusedSegmentPaths: readonly string[];
  blockedSegmentPaths: readonly string[];
};

export type MultiSegmentControlledExtraction = {
  version: "v1";
  extractionId: string;
  singleSegmentTrialId: string;
  singleSegmentTrialFingerprint: string;
  activeExtractionState: string;
  segmentExtractionEnabled: true;
  multiSegmentExtractionEnabled: true;
  parallelExtractionEnabled: false;
  maxSegmentsPerRun: typeof MULTI_SEGMENT_CONTROLLED_MAX_SEGMENTS_PER_RUN;
  overwriteExistingOutputs: false;
  allowedOutputExtensions: typeof MULTI_SEGMENT_CONTROLLED_ALLOWED_OUTPUT_EXTENSIONS;
  maxSpawnCount: typeof MULTI_SEGMENT_CONTROLLED_MAX_SPAWN_COUNT;
  spawnCount: number;
  result: MultiSegmentExtractionResult;
  resolvedExecutable: typeof SINGLE_SEGMENT_WRITE_RESOLVED_EXECUTABLE;
  shell: false;
  stdioMode: "pipe";
  timeoutMs: typeof CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS;
  items: readonly MultiSegmentExtractionItem[];
  metadata: MultiSegmentControlledExtractionMetadata;
  jpgOverwriteDetected: boolean;
  frameRegenerationDetected: boolean;
  networkAccess: false;
  uploadExecuted: false;
};

export const MULTI_SEGMENT_CONTROLLED_EXTRACTION_VERSION = "v1" as const;
export const MULTI_SEGMENT_CONTROLLED_EXTRACTION_ID =
  "multi-segment-controlled-extraction-gonegi-harbor-25s-v1" as const;
export const MULTI_SEGMENT_CONTROLLED_EXTRACTION_STATE =
  "25s-multi-segment-controlled-extraction-three-mp4-only" as const;
export const MULTI_SEGMENT_CONTROLLED_MAX_SEGMENTS_PER_RUN = 3 as const;
export const MULTI_SEGMENT_CONTROLLED_MAX_SPAWN_COUNT = 3 as const;
export const MULTI_SEGMENT_CONTROLLED_ALLOWED_OUTPUT_EXTENSIONS = Object.freeze([".mp4"] as const);

export const MULTI_SEGMENT_CONTROLLED_TARGET_SPECS = Object.freeze([
  Object.freeze({
    queueOrder: 3,
    executionItemId: "real-spawn-execution-item-004",
    segmentId: "segment-001",
    startTimestampSec: "0",
    durationTimestampSec: "8",
    expectedOutputPath: SINGLE_SEGMENT_WRITE_EXPECTED_OUTPUT_PATH,
  }),
  Object.freeze({
    queueOrder: 4,
    executionItemId: "real-spawn-execution-item-005",
    segmentId: "segment-002",
    startTimestampSec: "8",
    durationTimestampSec: "9",
    expectedOutputPath:
      "storage/pilot-intake/stubs/segment-002/segments/protagonist-arrival-segment-002.mp4",
  }),
  Object.freeze({
    queueOrder: 5,
    executionItemId: "real-spawn-execution-item-006",
    segmentId: "segment-003",
    startTimestampSec: "17",
    durationTimestampSec: "8",
    expectedOutputPath:
      "storage/pilot-intake/stubs/segment-003/segments/warm-glaze-final-echo-segment-003.mp4",
  }),
] as const);

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const EXPECTED_SEGMENT_OUTPUT_PATH_SET: ReadonlySet<string> = new Set(
  MULTI_SEGMENT_CONTROLLED_TARGET_SPECS.map((target) => target.expectedOutputPath)
);

let cachedMultiSegmentControlledExtraction: MultiSegmentControlledExtraction | null = null;
let multiSegmentControlledSpawnCount = 0;

function digestBuffer(buffer: Buffer | null | undefined): string {
  return crypto.createHash("sha256").update(buffer ?? Buffer.alloc(0)).digest("hex");
}

function resolveAbsolutePath(relativePath: string): string {
  return path.join(PROJECT_ROOT, relativePath);
}

function buildExtractionItemId(index: number): string {
  return `multi-segment-extraction-item-${String(index + 1).padStart(3, "0")}`;
}

function buildSpawnArgs(
  startTimestampSec: string,
  durationTimestampSec: string,
  expectedOutputPath: string
): readonly string[] {
  return Object.freeze([
    "-ss",
    startTimestampSec,
    "-t",
    durationTimestampSec,
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

function resolveOutputFileSizeBytes(relativePath: string): number {
  const absolutePath = resolveAbsolutePath(relativePath);
  if (!fs.existsSync(absolutePath)) {
    return 0;
  }
  return fs.statSync(absolutePath).size;
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

function listSegmentMp4OutputPaths(): string[] {
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
      if (!fileEntry.isFile() || !fileEntry.name.endsWith(".mp4")) {
        continue;
      }
      segmentPaths.push(
        path.relative(PROJECT_ROOT, path.join(segmentsDir, fileEntry.name)).split(path.sep).join("/")
      );
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

function resolveGlobalBlockedReason(singleSegmentWriteTrial: SingleSegmentWriteTrial): string | null {
  if (singleSegmentWriteTrial.result !== "write-success") {
    return singleSegmentWriteTrial.blockedReason ?? `single-segment-${singleSegmentWriteTrial.result}`;
  }
  if (singleSegmentWriteTrial.item.expectedOutputPath !== MULTI_SEGMENT_CONTROLLED_TARGET_SPECS[0].expectedOutputPath) {
    return "single-segment-output-path-mismatch";
  }
  if (multiSegmentControlledSpawnCount >= MULTI_SEGMENT_CONTROLLED_MAX_SPAWN_COUNT) {
    return "max-spawn-count-reached";
  }
  if (!ensureSourceInputStubExists()) {
    return "source-input-stub-unavailable";
  }
  return null;
}

function executeTargetExtraction(
  target: (typeof MULTI_SEGMENT_CONTROLLED_TARGET_SPECS)[number],
  index: number,
  createdSegmentPaths: string[],
  reusedSegmentPaths: string[],
  blockedSegmentPaths: string[],
  extractionDurationMs: { value: number },
  jpgSnapshot: Map<string, number>
): MultiSegmentExtractionItem {
  if (!isPathWithinAllowedRoot(target.expectedOutputPath)) {
    blockedSegmentPaths.push(target.expectedOutputPath);
    return Object.freeze({
      extractionItemId: buildExtractionItemId(index),
      queueOrder: target.queueOrder,
      executionItemId: target.executionItemId,
      segmentId: target.segmentId,
      mode: "segment-export",
      startTimestampSec: target.startTimestampSec,
      durationTimestampSec: target.durationTimestampSec,
      expectedOutputPath: target.expectedOutputPath,
      itemResult: "blocked",
      exitCode: null,
      signal: null,
      stdoutDigest: digestBuffer(null),
      stderrDigest: digestBuffer(null),
      outputFileSizeBytes: 0,
      executionDurationMs: 0,
      blockedReason: "path-outside-allowed-root",
    });
  }

  const outputAbsolutePath = resolveAbsolutePath(target.expectedOutputPath);
  const existingSize = resolveOutputFileSizeBytes(target.expectedOutputPath);

  if (existingSize > 0) {
    reusedSegmentPaths.push(target.expectedOutputPath);
    return Object.freeze({
      extractionItemId: buildExtractionItemId(index),
      queueOrder: target.queueOrder,
      executionItemId: target.executionItemId,
      segmentId: target.segmentId,
      mode: "segment-export",
      startTimestampSec: target.startTimestampSec,
      durationTimestampSec: target.durationTimestampSec,
      expectedOutputPath: target.expectedOutputPath,
      itemResult: "reused-existing",
      exitCode: 0,
      signal: null,
      stdoutDigest: digestBuffer(null),
      stderrDigest: digestBuffer(null),
      outputFileSizeBytes: existingSize,
      executionDurationMs: 0,
      blockedReason: null,
    });
  }

  if (fs.existsSync(outputAbsolutePath)) {
    blockedSegmentPaths.push(target.expectedOutputPath);
    return Object.freeze({
      extractionItemId: buildExtractionItemId(index),
      queueOrder: target.queueOrder,
      executionItemId: target.executionItemId,
      segmentId: target.segmentId,
      mode: "segment-export",
      startTimestampSec: target.startTimestampSec,
      durationTimestampSec: target.durationTimestampSec,
      expectedOutputPath: target.expectedOutputPath,
      itemResult: "blocked",
      exitCode: null,
      signal: null,
      stdoutDigest: digestBuffer(null),
      stderrDigest: digestBuffer(null),
      outputFileSizeBytes: 0,
      executionDurationMs: 0,
      blockedReason: "output-already-exists-no-overwrite",
    });
  }

  if (multiSegmentControlledSpawnCount >= MULTI_SEGMENT_CONTROLLED_MAX_SPAWN_COUNT) {
    blockedSegmentPaths.push(target.expectedOutputPath);
    return Object.freeze({
      extractionItemId: buildExtractionItemId(index),
      queueOrder: target.queueOrder,
      executionItemId: target.executionItemId,
      segmentId: target.segmentId,
      mode: "segment-export",
      startTimestampSec: target.startTimestampSec,
      durationTimestampSec: target.durationTimestampSec,
      expectedOutputPath: target.expectedOutputPath,
      itemResult: "blocked",
      exitCode: null,
      signal: null,
      stdoutDigest: digestBuffer(null),
      stderrDigest: digestBuffer(null),
      outputFileSizeBytes: 0,
      executionDurationMs: 0,
      blockedReason: "max-spawn-count-reached",
    });
  }

  fs.mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });
  multiSegmentControlledSpawnCount += 1;

  const spawnArgs = buildSpawnArgs(
    target.startTimestampSec,
    target.durationTimestampSec,
    target.expectedOutputPath
  );
  const startedAt = Date.now();
  const spawnResult = spawnSync(SINGLE_SEGMENT_WRITE_RESOLVED_EXECUTABLE, [...spawnArgs], {
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
    windowsHide: true,
  });
  const itemDurationMs = Date.now() - startedAt;
  extractionDurationMs.value += itemDurationMs;

  const outputFileSizeBytes = resolveOutputFileSizeBytes(target.expectedOutputPath);
  const spawnFailed =
    spawnResult.error !== undefined ||
    spawnResult.status !== 0 ||
    spawnResult.signal !== null ||
    outputFileSizeBytes <= 0 ||
    detectJpgOverwrite(jpgSnapshot);

  if (!spawnFailed) {
    createdSegmentPaths.push(target.expectedOutputPath);
  }

  return Object.freeze({
    extractionItemId: buildExtractionItemId(index),
    queueOrder: target.queueOrder,
    executionItemId: target.executionItemId,
    segmentId: target.segmentId,
    mode: "segment-export",
    startTimestampSec: target.startTimestampSec,
    durationTimestampSec: target.durationTimestampSec,
    expectedOutputPath: target.expectedOutputPath,
    itemResult: spawnFailed ? "spawn-failed" : "extracted",
    exitCode: spawnResult.status,
    signal: spawnResult.signal,
    stdoutDigest: digestBuffer(spawnResult.stdout),
    stderrDigest: digestBuffer(spawnResult.stderr),
    outputFileSizeBytes,
    executionDurationMs: itemDurationMs,
    blockedReason: spawnResult.error?.message ?? null,
  });
}

function buildMetadata(
  createdSegmentPaths: readonly string[],
  reusedSegmentPaths: readonly string[],
  blockedSegmentPaths: readonly string[],
  extractionDurationMs: number
): MultiSegmentControlledExtractionMetadata {
  const segmentPaths = listSegmentMp4OutputPaths();
  const allowedSegmentPaths = segmentPaths.filter((segmentPath) =>
    EXPECTED_SEGMENT_OUTPUT_PATH_SET.has(segmentPath)
  );
  const totalOutputBytes = allowedSegmentPaths.reduce(
    (sum, segmentPath) => sum + resolveOutputFileSizeBytes(segmentPath),
    0
  );

  return Object.freeze({
    totalExtractedSegments: allowedSegmentPaths.length,
    totalOutputBytes,
    extractionDurationMs,
    createdSegmentPaths: Object.freeze([...createdSegmentPaths]),
    reusedSegmentPaths: Object.freeze([...reusedSegmentPaths]),
    blockedSegmentPaths: Object.freeze([...blockedSegmentPaths]),
  });
}

function resolveExtractionResult(
  items: readonly MultiSegmentExtractionItem[],
  metadata: MultiSegmentControlledExtractionMetadata,
  jpgOverwriteDetected: boolean,
  frameRegenerationDetected: boolean
): MultiSegmentExtractionResult {
  if (items.some((item) => item.itemResult === "blocked")) {
    return "extraction-blocked";
  }
  if (
    items.some((item) => item.itemResult === "spawn-failed") ||
    metadata.totalExtractedSegments !== MULTI_SEGMENT_CONTROLLED_MAX_SEGMENTS_PER_RUN ||
    metadata.totalOutputBytes <= 0 ||
    jpgOverwriteDetected ||
    frameRegenerationDetected
  ) {
    return "extraction-failed";
  }

  const segmentPaths = listSegmentMp4OutputPaths();
  const extraOutputs = segmentPaths.some(
    (segmentPath) => !EXPECTED_SEGMENT_OUTPUT_PATH_SET.has(segmentPath)
  );
  if (extraOutputs) {
    return "extraction-failed";
  }

  const queueOrders = items.map((item) => item.queueOrder);
  const expectedQueueOrders = MULTI_SEGMENT_CONTROLLED_TARGET_SPECS.map((target) => target.queueOrder);
  if (queueOrders.join(",") !== expectedQueueOrders.join(",")) {
    return "extraction-failed";
  }

  return "extraction-success";
}

function buildMultiSegmentControlledExtractionInternal(
  singleSegmentWriteTrial: SingleSegmentWriteTrial
): MultiSegmentControlledExtraction {
  const jpgSnapshot = snapshotJpgFileSizes();
  const globalBlockedReason = resolveGlobalBlockedReason(singleSegmentWriteTrial);
  const createdSegmentPaths: string[] = [];
  const reusedSegmentPaths: string[] = [];
  const blockedSegmentPaths: string[] = [];
  const extractionDurationMs = { value: 0 };

  const items =
    globalBlockedReason === null
      ? Object.freeze(
          MULTI_SEGMENT_CONTROLLED_TARGET_SPECS.map((target, index) =>
            executeTargetExtraction(
              target,
              index,
              createdSegmentPaths,
              reusedSegmentPaths,
              blockedSegmentPaths,
              extractionDurationMs,
              jpgSnapshot
            )
          )
        )
      : Object.freeze(
          MULTI_SEGMENT_CONTROLLED_TARGET_SPECS.map((target, index) => {
            blockedSegmentPaths.push(target.expectedOutputPath);
            return Object.freeze({
              extractionItemId: buildExtractionItemId(index),
              queueOrder: target.queueOrder,
              executionItemId: target.executionItemId,
              segmentId: target.segmentId,
              mode: "segment-export" as const,
              startTimestampSec: target.startTimestampSec,
              durationTimestampSec: target.durationTimestampSec,
              expectedOutputPath: target.expectedOutputPath,
              itemResult: "blocked" as const,
              exitCode: null,
              signal: null,
              stdoutDigest: digestBuffer(null),
              stderrDigest: digestBuffer(null),
              outputFileSizeBytes: resolveOutputFileSizeBytes(target.expectedOutputPath),
              executionDurationMs: 0,
              blockedReason: globalBlockedReason,
            });
          })
        );

  const jpgOverwriteDetected = detectJpgOverwrite(jpgSnapshot);
  const frameRegenerationDetected = jpgOverwriteDetected;
  const metadata = buildMetadata(
    createdSegmentPaths,
    reusedSegmentPaths,
    blockedSegmentPaths,
    extractionDurationMs.value
  );

  return Object.freeze({
    version: MULTI_SEGMENT_CONTROLLED_EXTRACTION_VERSION,
    extractionId: MULTI_SEGMENT_CONTROLLED_EXTRACTION_ID,
    singleSegmentTrialId: singleSegmentWriteTrial.trialId,
    singleSegmentTrialFingerprint: computeSingleSegmentWriteTrialFingerprint(singleSegmentWriteTrial),
    activeExtractionState: MULTI_SEGMENT_CONTROLLED_EXTRACTION_STATE,
    segmentExtractionEnabled: true,
    multiSegmentExtractionEnabled: true,
    parallelExtractionEnabled: false,
    maxSegmentsPerRun: MULTI_SEGMENT_CONTROLLED_MAX_SEGMENTS_PER_RUN,
    overwriteExistingOutputs: false,
    allowedOutputExtensions: MULTI_SEGMENT_CONTROLLED_ALLOWED_OUTPUT_EXTENSIONS,
    maxSpawnCount: MULTI_SEGMENT_CONTROLLED_MAX_SPAWN_COUNT,
    spawnCount: multiSegmentControlledSpawnCount,
    result: resolveExtractionResult(items, metadata, jpgOverwriteDetected, frameRegenerationDetected),
    resolvedExecutable: SINGLE_SEGMENT_WRITE_RESOLVED_EXECUTABLE,
    shell: false,
    stdioMode: "pipe",
    timeoutMs: CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
    items,
    metadata,
    jpgOverwriteDetected,
    frameRegenerationDetected,
    networkAccess: false,
    uploadExecuted: false,
  });
}

export function buildMultiSegmentControlledExtraction(
  singleSegmentWriteTrial: SingleSegmentWriteTrial
): MultiSegmentControlledExtraction {
  if (cachedMultiSegmentControlledExtraction !== null) {
    return cachedMultiSegmentControlledExtraction;
  }

  const extraction = buildMultiSegmentControlledExtractionInternal(singleSegmentWriteTrial);
  cachedMultiSegmentControlledExtraction = extraction;
  return extraction;
}

export const MULTI_SEGMENT_CONTROLLED_EXTRACTION_KEY_ORDER = Object.freeze([
  "version",
  "extractionId",
  "singleSegmentTrialId",
  "singleSegmentTrialFingerprint",
  "activeExtractionState",
  "segmentExtractionEnabled",
  "multiSegmentExtractionEnabled",
  "parallelExtractionEnabled",
  "maxSegmentsPerRun",
  "overwriteExistingOutputs",
  "allowedOutputExtensions",
  "maxSpawnCount",
  "spawnCount",
  "result",
  "resolvedExecutable",
  "shell",
  "stdioMode",
  "timeoutMs",
  "items",
  "metadata",
  "jpgOverwriteDetected",
  "frameRegenerationDetected",
  "networkAccess",
  "uploadExecuted",
] as const);

export const MULTI_SEGMENT_EXTRACTION_ITEM_KEY_ORDER = Object.freeze([
  "extractionItemId",
  "queueOrder",
  "executionItemId",
  "segmentId",
  "mode",
  "startTimestampSec",
  "durationTimestampSec",
  "expectedOutputPath",
  "itemResult",
  "exitCode",
  "signal",
  "stdoutDigest",
  "stderrDigest",
  "outputFileSizeBytes",
  "executionDurationMs",
  "blockedReason",
] as const);

export const MULTI_SEGMENT_CONTROLLED_EXTRACTION_METADATA_KEY_ORDER = Object.freeze([
  "totalExtractedSegments",
  "totalOutputBytes",
  "extractionDurationMs",
  "createdSegmentPaths",
  "reusedSegmentPaths",
  "blockedSegmentPaths",
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

export function serializeMultiSegmentControlledExtraction(
  extraction: MultiSegmentControlledExtraction
): string {
  const orderedItems = [...extraction.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, MULTI_SEGMENT_EXTRACTION_ITEM_KEY_ORDER));

  const orderedMetadata = orderRecord(
    extraction.metadata,
    MULTI_SEGMENT_CONTROLLED_EXTRACTION_METADATA_KEY_ORDER
  );
  orderedMetadata.createdSegmentPaths = [...extraction.metadata.createdSegmentPaths];
  orderedMetadata.reusedSegmentPaths = [...extraction.metadata.reusedSegmentPaths];
  orderedMetadata.blockedSegmentPaths = [...extraction.metadata.blockedSegmentPaths];

  const orderedExtraction: Record<string, unknown> = {};
  for (const key of MULTI_SEGMENT_CONTROLLED_EXTRACTION_KEY_ORDER) {
    if (key === "items") {
      orderedExtraction.items = orderedItems;
    } else if (key === "metadata") {
      orderedExtraction.metadata = orderedMetadata;
    } else if (key === "allowedOutputExtensions") {
      orderedExtraction.allowedOutputExtensions = [...extraction.allowedOutputExtensions];
    } else {
      orderedExtraction[key] = extraction[key as keyof MultiSegmentControlledExtraction];
    }
  }

  return JSON.stringify(orderedExtraction);
}

export function computeMultiSegmentControlledExtractionFingerprint(
  extraction: MultiSegmentControlledExtraction
): string {
  return crypto
    .createHash("sha256")
    .update(serializeMultiSegmentControlledExtraction(extraction))
    .digest("hex");
}

export function resetMultiSegmentControlledExtractionCacheForVerification(): void {
  cachedMultiSegmentControlledExtraction = null;
  multiSegmentControlledSpawnCount = 0;
}
