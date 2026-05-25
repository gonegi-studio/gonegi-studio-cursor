import { FFMPEG_EXTRACTION_CONTRACT_OUTPUT_EXAMPLE } from "./ffmpeg-extraction-contract.fixtures.ts";
import { buildFFmpegExecutionPlan } from "./ffmpeg-execution-plan.ts";

export const FFMPEG_EXECUTION_PLAN_INPUT_EXAMPLE = FFMPEG_EXTRACTION_CONTRACT_OUTPUT_EXAMPLE;

export const FFMPEG_EXECUTION_PLAN_OUTPUT_EXAMPLE = buildFFmpegExecutionPlan(
  FFMPEG_EXECUTION_PLAN_INPUT_EXAMPLE
);

export const FFMPEG_EXECUTION_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  executionItemId: "ffmpeg-execution-item-001",
  executionOrder: 0,
  mode: "frame-export" as const,
  segmentId: "segment-001",
  segmentSlug: "harbor-opening-hold",
  targetTimestampSec: 4,
  startTimestampSec: null,
  endTimestampSec: null,
  expectedOutputStubPath:
    "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
  outputStubId: "extraction-output-stub-001",
  commandStub:
    "ffmpeg -ss 4.000 -i storage/pilot-intake/stubs/gonegi-harbor-pilot-25s-slot-001/source/pilot-25s.stub -frames:v 1 storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
});
