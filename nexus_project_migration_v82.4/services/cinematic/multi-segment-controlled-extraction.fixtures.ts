import { SINGLE_SEGMENT_WRITE_TRIAL_OUTPUT_EXAMPLE } from "./single-segment-write-trial.fixtures.ts";
import {
  buildMultiSegmentControlledExtraction,
  computeMultiSegmentControlledExtractionFingerprint,
} from "./multi-segment-controlled-extraction.ts";

export const MULTI_SEGMENT_CONTROLLED_EXTRACTION_INPUT_EXAMPLE =
  SINGLE_SEGMENT_WRITE_TRIAL_OUTPUT_EXAMPLE;

export const MULTI_SEGMENT_CONTROLLED_EXTRACTION_OUTPUT_EXAMPLE = buildMultiSegmentControlledExtraction(
  MULTI_SEGMENT_CONTROLLED_EXTRACTION_INPUT_EXAMPLE
);

export const MULTI_SEGMENT_CONTROLLED_EXTRACTION_FINGERPRINT =
  computeMultiSegmentControlledExtractionFingerprint(MULTI_SEGMENT_CONTROLLED_EXTRACTION_OUTPUT_EXAMPLE);

export const MULTI_SEGMENT_EXTRACTION_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  extractionItemId: "multi-segment-extraction-item-001",
  queueOrder: 3,
  executionItemId: "real-spawn-execution-item-004",
  segmentId: "segment-001",
  mode: "segment-export" as const,
  startTimestampSec: "0",
  durationTimestampSec: "8",
  expectedOutputPath:
    "storage/pilot-intake/stubs/segment-001/segments/harbor-opening-segment-001.mp4",
  itemResult: "reused-existing" as const,
  exitCode: 0,
  signal: null,
  outputFileSizeBytes: 0,
  executionDurationMs: 0,
  blockedReason: null,
});

export const MULTI_SEGMENT_CONTROLLED_EXTRACTION_METADATA_OUTPUT_EXAMPLE = Object.freeze({
  totalExtractedSegments: 3,
  totalOutputBytes: 0,
  extractionDurationMs: 0,
  createdSegmentPaths: Object.freeze([
    "storage/pilot-intake/stubs/segment-002/segments/protagonist-arrival-segment-002.mp4",
    "storage/pilot-intake/stubs/segment-003/segments/warm-glaze-final-echo-segment-003.mp4",
  ]),
  reusedSegmentPaths: Object.freeze([
    "storage/pilot-intake/stubs/segment-001/segments/harbor-opening-segment-001.mp4",
  ]),
  blockedSegmentPaths: Object.freeze([] as const),
});
