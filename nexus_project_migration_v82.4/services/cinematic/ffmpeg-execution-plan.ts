import crypto from "crypto";
import type {
  ExtractionFrameTarget,
  ExtractionOutputStub,
  ExtractionSegmentTarget,
  FFmpegExtractionContract,
} from "./ffmpeg-extraction-contract.ts";
import { computeFFmpegExtractionContractFingerprint } from "./ffmpeg-extraction-contract.ts";

export type FFmpegExecutionMode = "frame-export" | "segment-export";

export type FFmpegExecutionItem = {
  executionItemId: string;
  executionOrder: number;
  mode: FFmpegExecutionMode;
  segmentId: string;
  segmentSlug: string;
  targetTimestampSec: number;
  startTimestampSec: number | null;
  endTimestampSec: number | null;
  expectedOutputStubPath: string;
  outputStubId: string;
  commandStub: string;
};

export type FFmpegExecutionPlan = {
  version: "v1";
  planId: string;
  contractId: string;
  timelineId: string;
  manifestId: string;
  contractFingerprint: string;
  activePlanState: string;
  sourceInputStubPath: string;
  items: readonly FFmpegExecutionItem[];
};

export const FFMPEG_EXECUTION_PLAN_VERSION = "v1" as const;
export const FFMPEG_SOURCE_INPUT_STUB_PATH =
  "storage/pilot-intake/stubs/gonegi-harbor-pilot-25s-slot-001/source/pilot-25s.stub" as const;

function formatTimestampSec(sec: number): number {
  return Number(sec.toFixed(3));
}

function formatTimestampToken(sec: number): string {
  return sec.toFixed(3);
}

function buildExecutionItemId(index: number): string {
  return `ffmpeg-execution-item-${String(index + 1).padStart(3, "0")}`;
}

function resolveOutputStub(
  contract: FFmpegExtractionContract,
  segmentId: string,
  outputKind: ExtractionOutputStub["outputKind"]
): ExtractionOutputStub {
  const stub = contract.outputStubs.find(
    (item) => item.segmentId === segmentId && item.outputKind === outputKind
  );
  if (!stub) {
    throw new Error(`Missing ${outputKind} output stub for ${segmentId}`);
  }
  return stub;
}

function buildFrameExportCommandStub(
  targetTimestampSec: number,
  expectedOutputStubPath: string
): string {
  return [
    "ffmpeg",
    `-ss ${formatTimestampToken(targetTimestampSec)}`,
    `-i ${FFMPEG_SOURCE_INPUT_STUB_PATH}`,
    "-frames:v 1",
    expectedOutputStubPath,
  ].join(" ");
}

function buildSegmentExportCommandStub(
  startTimestampSec: number,
  endTimestampSec: number,
  expectedOutputStubPath: string
): string {
  return [
    "ffmpeg",
    `-ss ${formatTimestampToken(startTimestampSec)}`,
    `-to ${formatTimestampToken(endTimestampSec)}`,
    `-i ${FFMPEG_SOURCE_INPUT_STUB_PATH}`,
    "-c copy",
    expectedOutputStubPath,
  ].join(" ");
}

function buildFrameExecutionItem(
  frameTarget: ExtractionFrameTarget,
  outputStub: ExtractionOutputStub,
  executionOrder: number
): FFmpegExecutionItem {
  const targetTimestampSec = formatTimestampSec(frameTarget.targetTimestampSec);

  return Object.freeze({
    executionItemId: buildExecutionItemId(executionOrder),
    executionOrder,
    mode: "frame-export",
    segmentId: frameTarget.segmentId,
    segmentSlug: frameTarget.segmentSlug,
    targetTimestampSec,
    startTimestampSec: null,
    endTimestampSec: null,
    expectedOutputStubPath: outputStub.stubPath,
    outputStubId: outputStub.outputStubId,
    commandStub: buildFrameExportCommandStub(targetTimestampSec, outputStub.stubPath),
  });
}

function buildSegmentExecutionItem(
  segmentTarget: ExtractionSegmentTarget,
  outputStub: ExtractionOutputStub,
  executionOrder: number
): FFmpegExecutionItem {
  const startTimestampSec = formatTimestampSec(segmentTarget.startTimestampSec);
  const endTimestampSec = formatTimestampSec(segmentTarget.endTimestampSec);

  return Object.freeze({
    executionItemId: buildExecutionItemId(executionOrder),
    executionOrder,
    mode: "segment-export",
    segmentId: segmentTarget.segmentId,
    segmentSlug: segmentTarget.segmentSlug,
    targetTimestampSec: startTimestampSec,
    startTimestampSec,
    endTimestampSec,
    expectedOutputStubPath: outputStub.stubPath,
    outputStubId: outputStub.outputStubId,
    commandStub: buildSegmentExportCommandStub(startTimestampSec, endTimestampSec, outputStub.stubPath),
  });
}

export function buildFFmpegExecutionPlan(contract: FFmpegExtractionContract): FFmpegExecutionPlan {
  const orderedFrameTargets = [...contract.frameTargets].sort((a, b) =>
    a.frameTargetId.localeCompare(b.frameTargetId)
  );
  const orderedSegmentTargets = [...contract.segmentTargets].sort((a, b) =>
    a.segmentTargetId.localeCompare(b.segmentTargetId)
  );

  let executionOrder = 0;
  const frameItems = orderedFrameTargets.map((frameTarget) => {
    const item = buildFrameExecutionItem(
      frameTarget,
      resolveOutputStub(contract, frameTarget.segmentId, "frame"),
      executionOrder
    );
    executionOrder += 1;
    return item;
  });

  const segmentItems = orderedSegmentTargets.map((segmentTarget) => {
    const item = buildSegmentExecutionItem(
      segmentTarget,
      resolveOutputStub(contract, segmentTarget.segmentId, "segment"),
      executionOrder
    );
    executionOrder += 1;
    return item;
  });

  const items = Object.freeze([...frameItems, ...segmentItems]);

  return Object.freeze({
    version: FFMPEG_EXECUTION_PLAN_VERSION,
    planId: "ffmpeg-execution-plan-gonegi-harbor-25s-v1",
    contractId: contract.contractId,
    timelineId: contract.timelineId,
    manifestId: contract.manifestId,
    contractFingerprint: computeFFmpegExtractionContractFingerprint(contract),
    activePlanState: "25s-ffmpeg-execution-plan-ready-without-execution",
    sourceInputStubPath: FFMPEG_SOURCE_INPUT_STUB_PATH,
    items,
  });
}

export const FFMPEG_EXECUTION_PLAN_KEY_ORDER = Object.freeze([
  "version",
  "planId",
  "contractId",
  "timelineId",
  "manifestId",
  "contractFingerprint",
  "activePlanState",
  "sourceInputStubPath",
  "items",
] as const);

export const FFMPEG_EXECUTION_ITEM_KEY_ORDER = Object.freeze([
  "executionItemId",
  "executionOrder",
  "mode",
  "segmentId",
  "segmentSlug",
  "targetTimestampSec",
  "startTimestampSec",
  "endTimestampSec",
  "expectedOutputStubPath",
  "outputStubId",
  "commandStub",
] as const);

function orderRecord<T extends Record<string, unknown>>(item: T, keyOrder: readonly string[]): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeFFmpegExecutionPlan(plan: FFmpegExecutionPlan): string {
  const orderedItems = [...plan.items]
    .sort((a, b) => a.executionOrder - b.executionOrder)
    .map((item) => orderRecord(item, FFMPEG_EXECUTION_ITEM_KEY_ORDER));

  const orderedPlan: Record<string, unknown> = {};
  for (const key of FFMPEG_EXECUTION_PLAN_KEY_ORDER) {
    if (key === "items") {
      orderedPlan.items = orderedItems;
    } else {
      orderedPlan[key] = plan[key as keyof FFmpegExecutionPlan];
    }
  }

  return JSON.stringify(orderedPlan);
}

export function computeFFmpegExecutionPlanFingerprint(plan: FFmpegExecutionPlan): string {
  return crypto.createHash("sha256").update(serializeFFmpegExecutionPlan(plan)).digest("hex");
}
