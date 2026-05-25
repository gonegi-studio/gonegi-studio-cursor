import crypto from "crypto";
import type { ControlledFFmpegSpawnTrial } from "./controlled-ffmpeg-spawn-trial.ts";
import { computeControlledFFmpegSpawnTrialFingerprint } from "./controlled-ffmpeg-spawn-trial.ts";
import type { RealSpawnExecutionGate, RealSpawnExecutionItem } from "./real-spawn-execution-gate.ts";
import { computeRealSpawnExecutionGateFingerprint } from "./real-spawn-execution-gate.ts";

export type OutputWriteState = "write-disabled" | "write-ready";

export type OutputWritePathTraversalBlockPolicy = {
  policyId: string;
  blockDotDotSegments: true;
  blockAbsolutePaths: true;
  blockWindowsDrivePrefixes: true;
  requireAllowedRootPrefix: true;
};

export type OutputWriteOverwritePolicy = {
  policyId: string;
  overwriteEnabled: false;
  existingFilePolicy: "fail-closed-no-overwrite";
  requireWriteGateEnabled: true;
};

export type ExpectedOutputMapEntry = {
  outputMapKey: string;
  executionItemId: string;
  segmentId: string;
  outputKind: "frame" | "segment";
  expectedOutputPath: string;
};

export type OutputWriteSafetyItem = {
  writeItemId: string;
  queueOrder: number;
  executionItemId: string;
  spawnItemId: string;
  segmentId: string;
  mode: RealSpawnExecutionItem["mode"];
  writeState: OutputWriteState;
  expectedOutputPath: string;
  pathWithinAllowedRoot: boolean;
  pathTraversalBlocked: boolean;
  blockedReason: string | null;
};

export type OutputWriteSafetyGate = {
  version: "v1";
  writeGateId: string;
  executionGateId: string;
  trialId: string;
  executionGateFingerprint: string;
  trialFingerprint: string;
  activeWriteGateState: string;
  writeEnabled: false;
  frameExtractionEnabled: false;
  segmentExtractionEnabled: false;
  allowedOutputRoot: typeof OUTPUT_WRITE_ALLOWED_ROOT;
  pathTraversalBlockPolicy: OutputWritePathTraversalBlockPolicy;
  overwritePolicy: OutputWriteOverwritePolicy;
  expectedOutputMap: readonly ExpectedOutputMapEntry[];
  items: readonly OutputWriteSafetyItem[];
};

export const OUTPUT_WRITE_SAFETY_GATE_VERSION = "v1" as const;
export const OUTPUT_WRITE_SAFETY_GATE_ID =
  "output-write-safety-gate-gonegi-harbor-25s-v1" as const;
export const OUTPUT_WRITE_SAFETY_GATE_STATE =
  "25s-output-write-safety-gate-ready-with-write-disabled" as const;
export const OUTPUT_WRITE_ALLOWED_ROOT = "storage/pilot-intake/stubs/" as const;
export const OUTPUT_WRITE_ENABLED = false as const;
export const OUTPUT_WRITE_FRAME_EXTRACTION_ENABLED = false as const;
export const OUTPUT_WRITE_SEGMENT_EXTRACTION_ENABLED = false as const;

export const OUTPUT_WRITE_PATH_TRAVERSAL_BLOCK_POLICY = Object.freeze({
  policyId: "output-write-path-traversal-block-v1",
  blockDotDotSegments: true,
  blockAbsolutePaths: true,
  blockWindowsDrivePrefixes: true,
  requireAllowedRootPrefix: true,
}) satisfies OutputWritePathTraversalBlockPolicy;

export const OUTPUT_WRITE_OVERWRITE_POLICY = Object.freeze({
  policyId: "output-write-overwrite-fail-closed-v1",
  overwriteEnabled: false,
  existingFilePolicy: "fail-closed-no-overwrite",
  requireWriteGateEnabled: true,
}) satisfies OutputWriteOverwritePolicy;

function buildWriteItemId(index: number): string {
  return `output-write-safety-item-${String(index + 1).padStart(3, "0")}`;
}

function buildOutputMapKey(index: number): string {
  return `expected-output-map-${String(index + 1).padStart(3, "0")}`;
}

function resolveOutputKind(mode: RealSpawnExecutionItem["mode"]): ExpectedOutputMapEntry["outputKind"] {
  return mode === "frame-export" ? "frame" : "segment";
}

function hasPathTraversalSegment(outputPath: string): boolean {
  return outputPath.split("/").some((segment) => segment === "..");
}

function hasAbsolutePathPrefix(outputPath: string): boolean {
  return outputPath.startsWith("/") || /^[a-zA-Z]:[\\/]/.test(outputPath);
}

function hasWindowsDrivePrefix(outputPath: string): boolean {
  return /^[a-zA-Z]:/.test(outputPath);
}

function isPathWithinAllowedRoot(outputPath: string): boolean {
  return (
    outputPath.startsWith(OUTPUT_WRITE_ALLOWED_ROOT) &&
    !hasPathTraversalSegment(outputPath) &&
    !hasAbsolutePathPrefix(outputPath)
  );
}

function isPathTraversalBlocked(outputPath: string): boolean {
  if (hasPathTraversalSegment(outputPath)) {
    return true;
  }
  if (OUTPUT_WRITE_PATH_TRAVERSAL_BLOCK_POLICY.blockAbsolutePaths && hasAbsolutePathPrefix(outputPath)) {
    return true;
  }
  if (
    OUTPUT_WRITE_PATH_TRAVERSAL_BLOCK_POLICY.blockWindowsDrivePrefixes &&
    hasWindowsDrivePrefix(outputPath)
  ) {
    return true;
  }
  if (
    OUTPUT_WRITE_PATH_TRAVERSAL_BLOCK_POLICY.requireAllowedRootPrefix &&
    !outputPath.startsWith(OUTPUT_WRITE_ALLOWED_ROOT)
  ) {
    return true;
  }
  return false;
}

function extractExpectedOutputPath(validatedArgs: readonly string[]): string {
  const stubPaths = validatedArgs.filter((arg) => arg.startsWith(OUTPUT_WRITE_ALLOWED_ROOT));
  const outputPath = stubPaths[stubPaths.length - 1];
  if (!outputPath) {
    throw new Error("Missing expected output stub path in validated args");
  }
  return outputPath;
}

function resolveWriteBlockedReason(
  executionItem: RealSpawnExecutionItem,
  trial: ControlledFFmpegSpawnTrial,
  expectedOutputPath: string
): string | null {
  if (executionItem.executionState !== "execution-ready") {
    return "execution-not-ready";
  }
  if (trial.result !== "spawn-success") {
    return "controlled-spawn-trial-not-success";
  }
  if (isPathTraversalBlocked(expectedOutputPath)) {
    return "path-traversal-blocked";
  }
  if (!isPathWithinAllowedRoot(expectedOutputPath)) {
    return "path-outside-allowed-root";
  }
  return null;
}

function resolveWriteState(blockedReason: string | null): OutputWriteState {
  return blockedReason === null ? "write-ready" : "write-disabled";
}

function buildOutputWriteSafetyItem(
  executionItem: RealSpawnExecutionItem,
  trial: ControlledFFmpegSpawnTrial,
  index: number
): OutputWriteSafetyItem {
  const expectedOutputPath = extractExpectedOutputPath(executionItem.validatedArgs);
  const pathWithinAllowedRoot = isPathWithinAllowedRoot(expectedOutputPath);
  const pathTraversalBlocked = isPathTraversalBlocked(expectedOutputPath);
  const blockedReason = resolveWriteBlockedReason(executionItem, trial, expectedOutputPath);

  return Object.freeze({
    writeItemId: buildWriteItemId(index),
    queueOrder: executionItem.queueOrder,
    executionItemId: executionItem.executionItemId,
    spawnItemId: executionItem.spawnItemId,
    segmentId: executionItem.segmentId,
    mode: executionItem.mode,
    writeState: resolveWriteState(blockedReason),
    expectedOutputPath,
    pathWithinAllowedRoot,
    pathTraversalBlocked,
    blockedReason,
  });
}

function buildExpectedOutputMapEntry(
  item: OutputWriteSafetyItem,
  index: number
): ExpectedOutputMapEntry {
  return Object.freeze({
    outputMapKey: buildOutputMapKey(index),
    executionItemId: item.executionItemId,
    segmentId: item.segmentId,
    outputKind: resolveOutputKind(item.mode),
    expectedOutputPath: item.expectedOutputPath,
  });
}

export function buildOutputWriteSafetyGate(
  gate: RealSpawnExecutionGate,
  trial: ControlledFFmpegSpawnTrial
): OutputWriteSafetyGate {
  const executionGateFingerprint = computeRealSpawnExecutionGateFingerprint(gate);
  const trialFingerprint = computeControlledFFmpegSpawnTrialFingerprint(trial);

  if (trial.gateId !== gate.gateId) {
    throw new Error("Controlled FFmpeg spawn trial gate id mismatch");
  }
  if (trial.gateFingerprint !== executionGateFingerprint) {
    throw new Error("Controlled FFmpeg spawn trial gate fingerprint mismatch");
  }

  const items = Object.freeze(
    [...gate.items]
      .sort((a, b) => a.queueOrder - b.queueOrder)
      .map((executionItem, index) => buildOutputWriteSafetyItem(executionItem, trial, index))
  );

  const expectedOutputMap = Object.freeze(
    items.map((item, index) => buildExpectedOutputMapEntry(item, index))
  );

  return Object.freeze({
    version: OUTPUT_WRITE_SAFETY_GATE_VERSION,
    writeGateId: OUTPUT_WRITE_SAFETY_GATE_ID,
    executionGateId: gate.gateId,
    trialId: trial.trialId,
    executionGateFingerprint,
    trialFingerprint,
    activeWriteGateState: OUTPUT_WRITE_SAFETY_GATE_STATE,
    writeEnabled: OUTPUT_WRITE_ENABLED,
    frameExtractionEnabled: OUTPUT_WRITE_FRAME_EXTRACTION_ENABLED,
    segmentExtractionEnabled: OUTPUT_WRITE_SEGMENT_EXTRACTION_ENABLED,
    allowedOutputRoot: OUTPUT_WRITE_ALLOWED_ROOT,
    pathTraversalBlockPolicy: OUTPUT_WRITE_PATH_TRAVERSAL_BLOCK_POLICY,
    overwritePolicy: OUTPUT_WRITE_OVERWRITE_POLICY,
    expectedOutputMap,
    items,
  });
}

export const OUTPUT_WRITE_SAFETY_GATE_KEY_ORDER = Object.freeze([
  "version",
  "writeGateId",
  "executionGateId",
  "trialId",
  "executionGateFingerprint",
  "trialFingerprint",
  "activeWriteGateState",
  "writeEnabled",
  "frameExtractionEnabled",
  "segmentExtractionEnabled",
  "allowedOutputRoot",
  "pathTraversalBlockPolicy",
  "overwritePolicy",
  "expectedOutputMap",
  "items",
] as const);

export const OUTPUT_WRITE_SAFETY_ITEM_KEY_ORDER = Object.freeze([
  "writeItemId",
  "queueOrder",
  "executionItemId",
  "spawnItemId",
  "segmentId",
  "mode",
  "writeState",
  "expectedOutputPath",
  "pathWithinAllowedRoot",
  "pathTraversalBlocked",
  "blockedReason",
] as const);

export const EXPECTED_OUTPUT_MAP_ENTRY_KEY_ORDER = Object.freeze([
  "outputMapKey",
  "executionItemId",
  "segmentId",
  "outputKind",
  "expectedOutputPath",
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

export function serializeOutputWriteSafetyGate(gate: OutputWriteSafetyGate): string {
  const orderedItems = [...gate.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, OUTPUT_WRITE_SAFETY_ITEM_KEY_ORDER));

  const orderedOutputMap = [...gate.expectedOutputMap].map((entry) =>
    orderRecord(entry, EXPECTED_OUTPUT_MAP_ENTRY_KEY_ORDER)
  );

  const orderedGate: Record<string, unknown> = {};
  for (const key of OUTPUT_WRITE_SAFETY_GATE_KEY_ORDER) {
    if (key === "items") {
      orderedGate.items = orderedItems;
    } else if (key === "expectedOutputMap") {
      orderedGate.expectedOutputMap = orderedOutputMap;
    } else if (key === "pathTraversalBlockPolicy") {
      orderedGate.pathTraversalBlockPolicy = gate.pathTraversalBlockPolicy;
    } else if (key === "overwritePolicy") {
      orderedGate.overwritePolicy = gate.overwritePolicy;
    } else {
      orderedGate[key] = gate[key as keyof OutputWriteSafetyGate];
    }
  }

  return JSON.stringify(orderedGate);
}

export function computeOutputWriteSafetyGateFingerprint(gate: OutputWriteSafetyGate): string {
  return crypto.createHash("sha256").update(serializeOutputWriteSafetyGate(gate)).digest("hex");
}
