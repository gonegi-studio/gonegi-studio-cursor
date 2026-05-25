import crypto from "crypto";
import type { FFmpegExecutionItem, FFmpegExecutionPlan } from "./ffmpeg-execution-plan.ts";
import { computeFFmpegExecutionPlanFingerprint } from "./ffmpeg-execution-plan.ts";

export type FFmpegRuntimeExecutionMode = "frame-export" | "segment-export";

export type FFmpegRuntimeAdapterItem = {
  adapterItemId: string;
  executionOrder: number;
  mode: FFmpegRuntimeExecutionMode;
  segmentId: string;
  segmentSlug: string;
  targetTimestampSec: number;
  startTimestampSec: number | null;
  endTimestampSec: number | null;
  expectedOutputStubPath: string;
  outputStubId: string;
  commandArgs: readonly string[];
  runtimeState: string;
};

export type FFmpegRuntimeAdapterPayload = {
  version: "v1";
  adapterId: string;
  planId: string;
  contractId: string;
  manifestId: string;
  planFingerprint: string;
  sourceInputStubPath: string;
  activeAdapterState: string;
  runtimeExecutionPolicy: string;
  items: readonly FFmpegRuntimeAdapterItem[];
};

export const FFMPEG_RUNTIME_ADAPTER_VERSION = "v1" as const;
export const FFMPEG_RUNTIME_ADAPTER_STATE = "25s-ffmpeg-runtime-adapter-ready-without-process-spawn" as const;
export const FFMPEG_RUNTIME_EXECUTION_POLICY = "stub-path-only-no-file-io-no-child-process" as const;
export const FFMPEG_RUNTIME_ITEM_STATE = "runtime-adapter-item-ready-without-execution" as const;

function formatTimestampToken(sec: number): string {
  return sec.toFixed(3);
}

function buildAdapterItemId(index: number): string {
  return `ffmpeg-runtime-adapter-item-${String(index + 1).padStart(3, "0")}`;
}

function buildFrameCommandArgs(
  targetTimestampSec: number,
  sourceInputStubPath: string,
  expectedOutputStubPath: string
): readonly string[] {
  return Object.freeze([
    "ffmpeg",
    "-ss",
    formatTimestampToken(targetTimestampSec),
    "-i",
    sourceInputStubPath,
    "-frames:v",
    "1",
    expectedOutputStubPath,
  ]);
}

function buildSegmentCommandArgs(
  startTimestampSec: number,
  endTimestampSec: number,
  sourceInputStubPath: string,
  expectedOutputStubPath: string
): readonly string[] {
  return Object.freeze([
    "ffmpeg",
    "-ss",
    formatTimestampToken(startTimestampSec),
    "-to",
    formatTimestampToken(endTimestampSec),
    "-i",
    sourceInputStubPath,
    "-c",
    "copy",
    expectedOutputStubPath,
  ]);
}

function buildRuntimeAdapterItem(
  executionItem: FFmpegExecutionItem,
  sourceInputStubPath: string
): FFmpegRuntimeAdapterItem {
  const commandArgs =
    executionItem.mode === "frame-export"
      ? buildFrameCommandArgs(
          executionItem.targetTimestampSec,
          sourceInputStubPath,
          executionItem.expectedOutputStubPath
        )
      : buildSegmentCommandArgs(
          executionItem.startTimestampSec ?? executionItem.targetTimestampSec,
          executionItem.endTimestampSec ?? executionItem.targetTimestampSec,
          sourceInputStubPath,
          executionItem.expectedOutputStubPath
        );

  return Object.freeze({
    adapterItemId: buildAdapterItemId(executionItem.executionOrder),
    executionOrder: executionItem.executionOrder,
    mode: executionItem.mode,
    segmentId: executionItem.segmentId,
    segmentSlug: executionItem.segmentSlug,
    targetTimestampSec: executionItem.targetTimestampSec,
    startTimestampSec: executionItem.startTimestampSec,
    endTimestampSec: executionItem.endTimestampSec,
    expectedOutputStubPath: executionItem.expectedOutputStubPath,
    outputStubId: executionItem.outputStubId,
    commandArgs,
    runtimeState: FFMPEG_RUNTIME_ITEM_STATE,
  });
}

export function buildFFmpegRuntimeAdapterPayload(plan: FFmpegExecutionPlan): FFmpegRuntimeAdapterPayload {
  const items = Object.freeze(
    [...plan.items]
      .sort((a, b) => a.executionOrder - b.executionOrder)
      .map((executionItem) => buildRuntimeAdapterItem(executionItem, plan.sourceInputStubPath))
  );

  return Object.freeze({
    version: FFMPEG_RUNTIME_ADAPTER_VERSION,
    adapterId: "ffmpeg-runtime-adapter-gonegi-harbor-25s-v1",
    planId: plan.planId,
    contractId: plan.contractId,
    manifestId: plan.manifestId,
    planFingerprint: computeFFmpegExecutionPlanFingerprint(plan),
    sourceInputStubPath: plan.sourceInputStubPath,
    activeAdapterState: FFMPEG_RUNTIME_ADAPTER_STATE,
    runtimeExecutionPolicy: FFMPEG_RUNTIME_EXECUTION_POLICY,
    items,
  });
}

export const FFMPEG_RUNTIME_ADAPTER_KEY_ORDER = Object.freeze([
  "version",
  "adapterId",
  "planId",
  "contractId",
  "manifestId",
  "planFingerprint",
  "sourceInputStubPath",
  "activeAdapterState",
  "runtimeExecutionPolicy",
  "items",
] as const);

export const FFMPEG_RUNTIME_ADAPTER_ITEM_KEY_ORDER = Object.freeze([
  "adapterItemId",
  "executionOrder",
  "mode",
  "segmentId",
  "segmentSlug",
  "targetTimestampSec",
  "startTimestampSec",
  "endTimestampSec",
  "expectedOutputStubPath",
  "outputStubId",
  "commandArgs",
  "runtimeState",
] as const);

function orderRecord<T extends Record<string, unknown>>(item: T, keyOrder: readonly string[]): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeFFmpegRuntimeAdapterPayload(payload: FFmpegRuntimeAdapterPayload): string {
  const orderedItems = [...payload.items]
    .sort((a, b) => a.executionOrder - b.executionOrder)
    .map((item) => orderRecord(item, FFMPEG_RUNTIME_ADAPTER_ITEM_KEY_ORDER));

  const orderedPayload: Record<string, unknown> = {};
  for (const key of FFMPEG_RUNTIME_ADAPTER_KEY_ORDER) {
    if (key === "items") {
      orderedPayload.items = orderedItems;
    } else {
      orderedPayload[key] = payload[key as keyof FFmpegRuntimeAdapterPayload];
    }
  }

  return JSON.stringify(orderedPayload);
}

export function computeFFmpegRuntimeAdapterFingerprint(payload: FFmpegRuntimeAdapterPayload): string {
  return crypto.createHash("sha256").update(serializeFFmpegRuntimeAdapterPayload(payload)).digest("hex");
}
