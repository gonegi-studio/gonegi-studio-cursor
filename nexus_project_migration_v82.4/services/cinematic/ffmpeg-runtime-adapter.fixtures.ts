import { FFMPEG_EXECUTION_PLAN_OUTPUT_EXAMPLE } from "./ffmpeg-execution-plan.fixtures.ts";
import { buildFFmpegRuntimeAdapterPayload } from "./ffmpeg-runtime-adapter.ts";

export const FFMPEG_RUNTIME_ADAPTER_INPUT_EXAMPLE = FFMPEG_EXECUTION_PLAN_OUTPUT_EXAMPLE;

export const FFMPEG_RUNTIME_ADAPTER_OUTPUT_EXAMPLE = buildFFmpegRuntimeAdapterPayload(
  FFMPEG_RUNTIME_ADAPTER_INPUT_EXAMPLE
);

export const FFMPEG_RUNTIME_ADAPTER_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  adapterItemId: "ffmpeg-runtime-adapter-item-001",
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
  commandArgs: Object.freeze([
    "ffmpeg",
    "-ss",
    "4.000",
    "-i",
    "storage/pilot-intake/stubs/gonegi-harbor-pilot-25s-slot-001/source/pilot-25s.stub",
    "-frames:v",
    "1",
    "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
  ]),
  runtimeState: "runtime-adapter-item-ready-without-execution",
});
