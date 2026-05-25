import { OUTPUT_WRITE_SAFETY_GATE_OUTPUT_EXAMPLE } from "./output-write-safety-gate.fixtures.ts";
import {
  buildSingleFrameWriteTrial,
  computeSingleFrameWriteTrialFingerprint,
} from "./single-frame-write-trial.ts";

export const SINGLE_FRAME_WRITE_TRIAL_INPUT_EXAMPLE = OUTPUT_WRITE_SAFETY_GATE_OUTPUT_EXAMPLE;

export const SINGLE_FRAME_WRITE_TRIAL_OUTPUT_EXAMPLE = buildSingleFrameWriteTrial(
  SINGLE_FRAME_WRITE_TRIAL_INPUT_EXAMPLE
);

export const SINGLE_FRAME_WRITE_TRIAL_FINGERPRINT = computeSingleFrameWriteTrialFingerprint(
  SINGLE_FRAME_WRITE_TRIAL_OUTPUT_EXAMPLE
);

export const SINGLE_FRAME_WRITE_METADATA_OUTPUT_EXAMPLE = Object.freeze({
  outputRelativePath:
    "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
  outputFileExists: true,
  outputFileSizeBytes: 0,
  overwriteAttempted: false as const,
  segmentOutputsCreated: false as const,
  additionalOutputsCreated: false as const,
});

export const SINGLE_FRAME_WRITE_TRIAL_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  trialId: "single-frame-write-trial-gonegi-harbor-25s-v1",
  writeGateId: "output-write-safety-gate-gonegi-harbor-25s-v1",
  activeTrialState: "25s-single-frame-write-trial-one-jpg-only",
  maxSpawnCount: 1 as const,
  spawnCount: 1,
  result: "write-success" as const,
  executionItemId: "real-spawn-execution-item-001",
  executionQueueOrder: 0 as const,
  targetTimestampSec: "4.000" as const,
  expectedOutputPath:
    "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
  resolvedExecutable: "ffmpeg",
  shell: false as const,
  stdioMode: "pipe" as const,
  timeoutMs: 5000 as const,
  segmentExportExecuted: false as const,
  multiFrameExecuted: false as const,
  networkAccess: false as const,
  uploadExecuted: false as const,
});
