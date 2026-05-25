import { SINGLE_FRAME_WRITE_TRIAL_OUTPUT_EXAMPLE } from "./single-frame-write-trial.fixtures.ts";
import {
  buildMultiFrameControlledExtraction,
  computeMultiFrameControlledExtractionFingerprint,
} from "./multi-frame-controlled-extraction.ts";

export const MULTI_FRAME_CONTROLLED_EXTRACTION_INPUT_EXAMPLE =
  SINGLE_FRAME_WRITE_TRIAL_OUTPUT_EXAMPLE;

export const MULTI_FRAME_CONTROLLED_EXTRACTION_OUTPUT_EXAMPLE = buildMultiFrameControlledExtraction(
  MULTI_FRAME_CONTROLLED_EXTRACTION_INPUT_EXAMPLE
);

export const MULTI_FRAME_CONTROLLED_EXTRACTION_FINGERPRINT =
  computeMultiFrameControlledExtractionFingerprint(MULTI_FRAME_CONTROLLED_EXTRACTION_OUTPUT_EXAMPLE);

export const MULTI_FRAME_EXTRACTION_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  extractionItemId: "multi-frame-extraction-item-001",
  queueOrder: 0,
  executionItemId: "real-spawn-execution-item-001",
  targetTimestampSec: "4.000",
  expectedOutputPath:
    "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
  itemResult: "reused-existing" as const,
  exitCode: 0,
  signal: null,
  outputFileSizeBytes: 0,
  blockedReason: null,
});

export const MULTI_FRAME_CONTROLLED_EXTRACTION_METADATA_OUTPUT_EXAMPLE = Object.freeze({
  totalExtractedFrames: 3,
  totalOutputBytes: 0,
  extractionDurationMs: 0,
  createdOutputPaths: Object.freeze([
    "storage/pilot-intake/stubs/segment-002/frames/protagonist-arrival-mid-frame-002.jpg",
    "storage/pilot-intake/stubs/segment-003/frames/warm-glaze-final-echo-frame-003.jpg",
  ]),
  blockedOutputPaths: Object.freeze([] as const),
});
