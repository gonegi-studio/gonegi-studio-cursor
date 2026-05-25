import { PILOT_INTAKE_SESSION_OUTPUT_EXAMPLE } from "./pilot-intake-session.fixtures.ts";
import { buildMockIngestionTimeline } from "./mock-ingestion-timeline.ts";

export const MOCK_INGESTION_TIMELINE_INPUT_EXAMPLE = PILOT_INTAKE_SESSION_OUTPUT_EXAMPLE;

export const MOCK_INGESTION_TIMELINE_OUTPUT_EXAMPLE = buildMockIngestionTimeline(
  MOCK_INGESTION_TIMELINE_INPUT_EXAMPLE
);

export const MOCK_INGESTION_TIMELINE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  timelineItemId: "mock-ingestion-timeline-item-001",
  sessionId: "pilot-intake-session-gonegi-harbor-25s-v1",
  sessionItemId: "pilot-intake-session-item-001",
  segmentId: "segment-001",
  segmentSlug: "harbor-opening-hold",
  orderIndex: 0,
  stage: "segment-ready" as const,
  offsetSec: 0,
  stageState: "mock segment boundary staged without extraction",
});
