import crypto from "crypto";
import type { PilotIntakeSession } from "./pilot-intake-session.ts";
import { computePilotIntakeSessionFingerprint } from "./pilot-intake-session.ts";

export type MockIngestionStage = "segment-ready" | "frame-sample-ready" | "evidence-linked";

export type MockIngestionTimelineItem = {
  timelineItemId: string;
  sessionId: string;
  sessionItemId: string;
  segmentId: string;
  segmentSlug: string;
  orderIndex: number;
  stage: MockIngestionStage;
  offsetSec: number;
  stageState: string;
};

export type MockIngestionTimeline = {
  version: "v1";
  timelineId: string;
  sessionId: string;
  manifestId: string;
  manifestFingerprint: string;
  sessionFingerprint: string;
  activeTimelineState: string;
  items: readonly MockIngestionTimelineItem[];
};

export const MOCK_INGESTION_TIMELINE_VERSION = "v1" as const;

const MOCK_INGESTION_STAGE_SEQUENCE: readonly MockIngestionStage[] = Object.freeze([
  "segment-ready",
  "frame-sample-ready",
  "evidence-linked",
]);

const MOCK_INGESTION_STAGE_STATE: Readonly<Record<MockIngestionStage, string>> = Object.freeze({
  "segment-ready": "mock segment boundary staged without extraction",
  "frame-sample-ready": "mock frame sample slot staged without extraction",
  "evidence-linked": "mock intake evidence linked without file processing",
});

function buildTimelineItemId(index: number): string {
  return `mock-ingestion-timeline-item-${String(index + 1).padStart(3, "0")}`;
}

function resolveSegmentStartSec(session: PilotIntakeSession, orderIndex: number): number {
  return [...session.items]
    .filter((item) => item.orderIndex < orderIndex)
    .reduce((sum, item) => sum + item.durationSec, 0);
}

function resolveStageOffsetSec(
  sessionItem: PilotIntakeSession["items"][number],
  segmentStartSec: number,
  stage: MockIngestionStage
): number {
  if (stage === "segment-ready") {
    return segmentStartSec;
  }
  if (stage === "frame-sample-ready") {
    return segmentStartSec + sessionItem.durationSec / 2;
  }
  return segmentStartSec + sessionItem.durationSec;
}

function buildMockIngestionTimelineItem(
  session: PilotIntakeSession,
  sessionItem: PilotIntakeSession["items"][number],
  stage: MockIngestionStage,
  timelineIndex: number
): MockIngestionTimelineItem {
  const segmentStartSec = resolveSegmentStartSec(session, sessionItem.orderIndex);

  return Object.freeze({
    timelineItemId: buildTimelineItemId(timelineIndex),
    sessionId: session.sessionId,
    sessionItemId: sessionItem.itemId,
    segmentId: sessionItem.segmentId,
    segmentSlug: sessionItem.segmentSlug,
    orderIndex: sessionItem.orderIndex,
    stage,
    offsetSec: resolveStageOffsetSec(sessionItem, segmentStartSec, stage),
    stageState: MOCK_INGESTION_STAGE_STATE[stage],
  });
}

export function buildMockIngestionTimeline(session: PilotIntakeSession): MockIngestionTimeline {
  const orderedSessionItems = [...session.items].sort((a, b) => a.orderIndex - b.orderIndex);
  let timelineIndex = 0;
  const items = Object.freeze(
    orderedSessionItems.flatMap((sessionItem) =>
      MOCK_INGESTION_STAGE_SEQUENCE.map((stage) => {
        const item = buildMockIngestionTimelineItem(session, sessionItem, stage, timelineIndex);
        timelineIndex += 1;
        return item;
      })
    )
  );

  return Object.freeze({
    version: MOCK_INGESTION_TIMELINE_VERSION,
    timelineId: "mock-ingestion-timeline-gonegi-harbor-25s-v1",
    sessionId: session.sessionId,
    manifestId: session.manifestId,
    manifestFingerprint: session.manifestFingerprint,
    sessionFingerprint: computePilotIntakeSessionFingerprint(session),
    activeTimelineState: "25s-mock-ingestion-timeline-ready-without-file-processing",
    items,
  });
}

export const MOCK_INGESTION_TIMELINE_KEY_ORDER = Object.freeze([
  "version",
  "timelineId",
  "sessionId",
  "manifestId",
  "manifestFingerprint",
  "sessionFingerprint",
  "activeTimelineState",
  "items",
] as const);

export const MOCK_INGESTION_TIMELINE_ITEM_KEY_ORDER = Object.freeze([
  "timelineItemId",
  "sessionId",
  "sessionItemId",
  "segmentId",
  "segmentSlug",
  "orderIndex",
  "stage",
  "offsetSec",
  "stageState",
] as const);

function orderRecord<T extends Record<string, unknown>>(item: T, keyOrder: readonly string[]): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeMockIngestionTimeline(timeline: MockIngestionTimeline): string {
  const orderedItems = [...timeline.items]
    .sort((a, b) => a.timelineItemId.localeCompare(b.timelineItemId))
    .map((item) => orderRecord(item, MOCK_INGESTION_TIMELINE_ITEM_KEY_ORDER));

  const orderedTimeline: Record<string, unknown> = {};
  for (const key of MOCK_INGESTION_TIMELINE_KEY_ORDER) {
    if (key === "items") {
      orderedTimeline.items = orderedItems;
    } else {
      orderedTimeline[key] = timeline[key as keyof MockIngestionTimeline];
    }
  }

  return JSON.stringify(orderedTimeline);
}

export function computeMockIngestionTimelineFingerprint(timeline: MockIngestionTimeline): string {
  return crypto.createHash("sha256").update(serializeMockIngestionTimeline(timeline)).digest("hex");
}
