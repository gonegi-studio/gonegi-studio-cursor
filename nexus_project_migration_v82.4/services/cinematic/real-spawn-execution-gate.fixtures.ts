import { DRY_RUN_SPAWN_SIMULATION_OUTPUT_EXAMPLE } from "./dry-run-spawn-simulator.fixtures.ts";
import { buildRealSpawnExecutionGate } from "./real-spawn-execution-gate.ts";

export const REAL_SPAWN_EXECUTION_GATE_INPUT_EXAMPLE = DRY_RUN_SPAWN_SIMULATION_OUTPUT_EXAMPLE;

export const REAL_SPAWN_EXECUTION_GATE_OUTPUT_EXAMPLE = buildRealSpawnExecutionGate(
  REAL_SPAWN_EXECUTION_GATE_INPUT_EXAMPLE
);

export const REAL_SPAWN_EXECUTION_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  executionItemId: "real-spawn-execution-item-001",
  queueOrder: 0,
  simulationItemId: "dry-run-spawn-item-001",
  spawnItemId: "safe-process-spawn-item-001",
  segmentId: "segment-001",
  mode: "frame-export" as const,
  executionState: "execution-ready" as const,
  resolvedExecutable: "ffmpeg",
  validatedArgs: Object.freeze([
    "ffmpeg",
    "-ss",
    "4.000",
    "-i",
    "storage/pilot-intake/stubs/gonegi-harbor-pilot-25s-slot-001/source/pilot-25s.stub",
    "-frames:v",
    "1",
    "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
  ]),
  spawnStrategy: "child-process-spawn-synchronous-queue-disabled",
  dryRunResult: "simulated-pass" as const,
  blockedReason: null,
});
