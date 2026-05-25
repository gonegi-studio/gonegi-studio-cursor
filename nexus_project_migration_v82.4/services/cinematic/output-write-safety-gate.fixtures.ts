import { CONTROLLED_FFMPEG_SPAWN_TRIAL_OUTPUT_EXAMPLE } from "./controlled-ffmpeg-spawn-trial.fixtures.ts";
import { REAL_SPAWN_EXECUTION_GATE_OUTPUT_EXAMPLE } from "./real-spawn-execution-gate.fixtures.ts";
import {
  buildOutputWriteSafetyGate,
  computeOutputWriteSafetyGateFingerprint,
} from "./output-write-safety-gate.ts";

export const OUTPUT_WRITE_SAFETY_GATE_INPUT_EXAMPLE = Object.freeze({
  gate: REAL_SPAWN_EXECUTION_GATE_OUTPUT_EXAMPLE,
  trial: CONTROLLED_FFMPEG_SPAWN_TRIAL_OUTPUT_EXAMPLE,
});

export const OUTPUT_WRITE_SAFETY_GATE_OUTPUT_EXAMPLE = buildOutputWriteSafetyGate(
  OUTPUT_WRITE_SAFETY_GATE_INPUT_EXAMPLE.gate,
  OUTPUT_WRITE_SAFETY_GATE_INPUT_EXAMPLE.trial
);

export const OUTPUT_WRITE_SAFETY_GATE_FINGERPRINT = computeOutputWriteSafetyGateFingerprint(
  OUTPUT_WRITE_SAFETY_GATE_OUTPUT_EXAMPLE
);

export const OUTPUT_WRITE_SAFETY_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  writeItemId: "output-write-safety-item-001",
  queueOrder: 0,
  executionItemId: "real-spawn-execution-item-001",
  spawnItemId: "safe-process-spawn-item-001",
  segmentId: "segment-001",
  mode: "frame-export" as const,
  writeState: "write-ready" as const,
  expectedOutputPath:
    "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
  pathWithinAllowedRoot: true,
  pathTraversalBlocked: false,
  blockedReason: null,
});

export const EXPECTED_OUTPUT_MAP_ENTRY_OUTPUT_EXAMPLE = Object.freeze({
  outputMapKey: "expected-output-map-001",
  executionItemId: "real-spawn-execution-item-001",
  segmentId: "segment-001",
  outputKind: "frame" as const,
  expectedOutputPath:
    "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
});
