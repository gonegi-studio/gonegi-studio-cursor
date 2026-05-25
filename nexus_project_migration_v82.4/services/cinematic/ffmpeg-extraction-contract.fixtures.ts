import { MOCK_INGESTION_TIMELINE_OUTPUT_EXAMPLE } from "./mock-ingestion-timeline.fixtures.ts";
import { buildFFmpegExtractionContract } from "./ffmpeg-extraction-contract.ts";

export const FFMPEG_EXTRACTION_CONTRACT_INPUT_EXAMPLE = MOCK_INGESTION_TIMELINE_OUTPUT_EXAMPLE;

export const FFMPEG_EXTRACTION_CONTRACT_OUTPUT_EXAMPLE = buildFFmpegExtractionContract(
  FFMPEG_EXTRACTION_CONTRACT_INPUT_EXAMPLE
);

export const EXTRACTION_FRAME_TARGET_OUTPUT_EXAMPLE = Object.freeze({
  frameTargetId: "extraction-frame-target-001",
  segmentId: "segment-001",
  segmentSlug: "harbor-opening-hold",
  targetTimestampSec: 4,
  expectedFrameName: "harbor-opening-hold-frame-001.jpg",
  timelineItemId: "mock-ingestion-timeline-item-002",
});

export const EXTRACTION_SEGMENT_TARGET_OUTPUT_EXAMPLE = Object.freeze({
  segmentTargetId: "extraction-segment-target-001",
  segmentId: "segment-001",
  segmentSlug: "harbor-opening-hold",
  startTimestampSec: 0,
  endTimestampSec: 8,
  timelineStartItemId: "mock-ingestion-timeline-item-001",
  timelineEndItemId: "mock-ingestion-timeline-item-003",
});

export const EXTRACTION_OUTPUT_STUB_OUTPUT_EXAMPLE = Object.freeze({
  outputStubId: "extraction-output-stub-001",
  segmentId: "segment-001",
  outputKind: "frame" as const,
  stubPath: "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
});
