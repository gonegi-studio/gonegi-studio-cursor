import { MULTI_FRAME_CONTROLLED_EXTRACTION_OUTPUT_EXAMPLE } from "./multi-frame-controlled-extraction.fixtures.ts";
import {
  buildSingleSegmentWriteTrial,
  computeSingleSegmentWriteTrialFingerprint,
} from "./single-segment-write-trial.ts";

export const SINGLE_SEGMENT_WRITE_TRIAL_INPUT_EXAMPLE = MULTI_FRAME_CONTROLLED_EXTRACTION_OUTPUT_EXAMPLE;

export const SINGLE_SEGMENT_WRITE_TRIAL_OUTPUT_EXAMPLE = buildSingleSegmentWriteTrial(
  SINGLE_SEGMENT_WRITE_TRIAL_INPUT_EXAMPLE
);

export const SINGLE_SEGMENT_WRITE_TRIAL_FINGERPRINT = computeSingleSegmentWriteTrialFingerprint(
  SINGLE_SEGMENT_WRITE_TRIAL_OUTPUT_EXAMPLE
);

export const SINGLE_SEGMENT_WRITE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  writeItemId: "single-segment-write-item-001",
  queueOrder: 3 as const,
  executionItemId: "real-spawn-execution-item-004",
  segmentId: "segment-001",
  mode: "segment-export" as const,
  startTimestampSec: "0" as const,
  durationTimestampSec: "8" as const,
  expectedOutputPath:
    "storage/pilot-intake/stubs/segment-001/segments/harbor-opening-segment-001.mp4",
  writeState: "write-ready" as const,
  blockedReason: null,
});

export const SINGLE_SEGMENT_WRITE_TRIAL_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  trialId: "single-segment-write-trial-gonegi-harbor-25s-v1",
  activeTrialState: "25s-single-segment-write-trial-one-mp4-only",
  writeEnabled: true as const,
  segmentExtractionEnabled: true as const,
  multiSegmentExtractionEnabled: false as const,
  maxSegmentsPerRun: 1 as const,
  overwriteExistingOutputs: false as const,
  maxSpawnCount: 1 as const,
  spawnCount: 1,
  result: "write-success" as const,
  resolvedExecutable: "ffmpeg",
  shell: false as const,
  stdioMode: "pipe" as const,
  timeoutMs: 5000 as const,
  jpgOverwriteDetected: false as const,
  networkAccess: false as const,
  uploadExecuted: false as const,
});
