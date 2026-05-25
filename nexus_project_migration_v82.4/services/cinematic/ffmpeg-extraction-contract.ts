import crypto from "crypto";
import type { MockIngestionTimeline, MockIngestionTimelineItem } from "./mock-ingestion-timeline.ts";
import { computeMockIngestionTimelineFingerprint } from "./mock-ingestion-timeline.ts";

export type ExtractionFrameTarget = {
  frameTargetId: string;
  segmentId: string;
  segmentSlug: string;
  targetTimestampSec: number;
  expectedFrameName: string;
  timelineItemId: string;
};

export type ExtractionSegmentTarget = {
  segmentTargetId: string;
  segmentId: string;
  segmentSlug: string;
  startTimestampSec: number;
  endTimestampSec: number;
  timelineStartItemId: string;
  timelineEndItemId: string;
};

export type ExtractionOutputStub = {
  outputStubId: string;
  segmentId: string;
  outputKind: "frame" | "segment";
  stubPath: string;
};

export type FFmpegExtractionContract = {
  version: "v1";
  contractId: string;
  timelineId: string;
  sessionId: string;
  manifestId: string;
  timelineFingerprint: string;
  activeContractState: string;
  frameTargets: readonly ExtractionFrameTarget[];
  segmentTargets: readonly ExtractionSegmentTarget[];
  outputStubs: readonly ExtractionOutputStub[];
};

export const FFMPEG_EXTRACTION_CONTRACT_VERSION = "v1" as const;

function formatTimestampSec(sec: number): number {
  return Number(sec.toFixed(3));
}

function buildFrameTargetId(orderIndex: number): string {
  return `extraction-frame-target-${String(orderIndex + 1).padStart(3, "0")}`;
}

function buildSegmentTargetId(orderIndex: number): string {
  return `extraction-segment-target-${String(orderIndex + 1).padStart(3, "0")}`;
}

function buildOutputStubId(index: number): string {
  return `extraction-output-stub-${String(index + 1).padStart(3, "0")}`;
}

function buildExpectedFrameName(segmentSlug: string, orderIndex: number): string {
  return `${segmentSlug}-frame-${String(orderIndex + 1).padStart(3, "0")}.jpg`;
}

function buildFrameStubPath(segmentId: string, expectedFrameName: string): string {
  return `storage/pilot-intake/stubs/${segmentId}/frames/${expectedFrameName}`;
}

function buildSegmentStubPath(segmentId: string, segmentSlug: string): string {
  return `storage/pilot-intake/stubs/${segmentId}/segments/${segmentSlug}.segment.stub`;
}

function buildExtractionFrameTarget(item: MockIngestionTimelineItem): ExtractionFrameTarget {
  const expectedFrameName = buildExpectedFrameName(item.segmentSlug, item.orderIndex);

  return Object.freeze({
    frameTargetId: buildFrameTargetId(item.orderIndex),
    segmentId: item.segmentId,
    segmentSlug: item.segmentSlug,
    targetTimestampSec: formatTimestampSec(item.offsetSec),
    expectedFrameName,
    timelineItemId: item.timelineItemId,
  });
}

function buildExtractionSegmentTarget(
  segmentReadyItem: MockIngestionTimelineItem,
  evidenceLinkedItem: MockIngestionTimelineItem
): ExtractionSegmentTarget {
  return Object.freeze({
    segmentTargetId: buildSegmentTargetId(segmentReadyItem.orderIndex),
    segmentId: segmentReadyItem.segmentId,
    segmentSlug: segmentReadyItem.segmentSlug,
    startTimestampSec: formatTimestampSec(segmentReadyItem.offsetSec),
    endTimestampSec: formatTimestampSec(evidenceLinkedItem.offsetSec),
    timelineStartItemId: segmentReadyItem.timelineItemId,
    timelineEndItemId: evidenceLinkedItem.timelineItemId,
  });
}

function buildFrameOutputStub(frameTarget: ExtractionFrameTarget, index: number): ExtractionOutputStub {
  return Object.freeze({
    outputStubId: buildOutputStubId(index),
    segmentId: frameTarget.segmentId,
    outputKind: "frame",
    stubPath: buildFrameStubPath(frameTarget.segmentId, frameTarget.expectedFrameName),
  });
}

function buildSegmentOutputStub(segmentTarget: ExtractionSegmentTarget, index: number): ExtractionOutputStub {
  return Object.freeze({
    outputStubId: buildOutputStubId(index),
    segmentId: segmentTarget.segmentId,
    outputKind: "segment",
    stubPath: buildSegmentStubPath(segmentTarget.segmentId, segmentTarget.segmentSlug),
  });
}

export function buildFFmpegExtractionContract(timeline: MockIngestionTimeline): FFmpegExtractionContract {
  const orderedItems = [...timeline.items].sort((a, b) => a.timelineItemId.localeCompare(b.timelineItemId));

  const frameTargets = Object.freeze(
    orderedItems
      .filter((item) => item.stage === "frame-sample-ready")
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((item) => buildExtractionFrameTarget(item))
  );

  const segmentTargets = Object.freeze(
    [...new Set(orderedItems.map((item) => item.segmentId))]
      .sort()
      .map((segmentId) => {
        const segmentItems = orderedItems
          .filter((item) => item.segmentId === segmentId)
          .sort((a, b) => a.orderIndex - b.orderIndex);
        const segmentReadyItem = segmentItems.find((item) => item.stage === "segment-ready");
        const evidenceLinkedItem = segmentItems.find((item) => item.stage === "evidence-linked");
        if (!segmentReadyItem || !evidenceLinkedItem) {
          throw new Error(`Missing segment boundary items for ${segmentId}`);
        }
        return buildExtractionSegmentTarget(segmentReadyItem, evidenceLinkedItem);
      })
  );

  const frameOutputStubs = frameTargets.map((frameTarget, index) => buildFrameOutputStub(frameTarget, index));
  const segmentOutputStubs = segmentTargets.map((segmentTarget, index) =>
    buildSegmentOutputStub(segmentTarget, frameOutputStubs.length + index)
  );
  const outputStubs = Object.freeze([...frameOutputStubs, ...segmentOutputStubs]);

  return Object.freeze({
    version: FFMPEG_EXTRACTION_CONTRACT_VERSION,
    contractId: "ffmpeg-extraction-contract-gonegi-harbor-25s-v1",
    timelineId: timeline.timelineId,
    sessionId: timeline.sessionId,
    manifestId: timeline.manifestId,
    timelineFingerprint: computeMockIngestionTimelineFingerprint(timeline),
    activeContractState: "25s-ffmpeg-extraction-contract-ready-without-execution",
    frameTargets,
    segmentTargets,
    outputStubs,
  });
}

export const FFMPEG_EXTRACTION_CONTRACT_KEY_ORDER = Object.freeze([
  "version",
  "contractId",
  "timelineId",
  "sessionId",
  "manifestId",
  "timelineFingerprint",
  "activeContractState",
  "frameTargets",
  "segmentTargets",
  "outputStubs",
] as const);

export const EXTRACTION_FRAME_TARGET_KEY_ORDER = Object.freeze([
  "frameTargetId",
  "segmentId",
  "segmentSlug",
  "targetTimestampSec",
  "expectedFrameName",
  "timelineItemId",
] as const);

export const EXTRACTION_SEGMENT_TARGET_KEY_ORDER = Object.freeze([
  "segmentTargetId",
  "segmentId",
  "segmentSlug",
  "startTimestampSec",
  "endTimestampSec",
  "timelineStartItemId",
  "timelineEndItemId",
] as const);

export const EXTRACTION_OUTPUT_STUB_KEY_ORDER = Object.freeze([
  "outputStubId",
  "segmentId",
  "outputKind",
  "stubPath",
] as const);

function orderRecord<T extends Record<string, unknown>>(item: T, keyOrder: readonly string[]): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeFFmpegExtractionContract(contract: FFmpegExtractionContract): string {
  const orderedFrameTargets = [...contract.frameTargets]
    .sort((a, b) => a.frameTargetId.localeCompare(b.frameTargetId))
    .map((item) => orderRecord(item, EXTRACTION_FRAME_TARGET_KEY_ORDER));

  const orderedSegmentTargets = [...contract.segmentTargets]
    .sort((a, b) => a.segmentTargetId.localeCompare(b.segmentTargetId))
    .map((item) => orderRecord(item, EXTRACTION_SEGMENT_TARGET_KEY_ORDER));

  const orderedOutputStubs = [...contract.outputStubs]
    .sort((a, b) => a.outputStubId.localeCompare(b.outputStubId))
    .map((item) => orderRecord(item, EXTRACTION_OUTPUT_STUB_KEY_ORDER));

  const orderedContract: Record<string, unknown> = {};
  for (const key of FFMPEG_EXTRACTION_CONTRACT_KEY_ORDER) {
    if (key === "frameTargets") {
      orderedContract.frameTargets = orderedFrameTargets;
    } else if (key === "segmentTargets") {
      orderedContract.segmentTargets = orderedSegmentTargets;
    } else if (key === "outputStubs") {
      orderedContract.outputStubs = orderedOutputStubs;
    } else {
      orderedContract[key] = contract[key as keyof FFmpegExtractionContract];
    }
  }

  return JSON.stringify(orderedContract);
}

export function computeFFmpegExtractionContractFingerprint(contract: FFmpegExtractionContract): string {
  return crypto.createHash("sha256").update(serializeFFmpegExtractionContract(contract)).digest("hex");
}
