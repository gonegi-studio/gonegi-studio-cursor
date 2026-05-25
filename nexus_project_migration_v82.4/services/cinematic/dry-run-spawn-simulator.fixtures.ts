import { SAFE_PROCESS_SPAWN_BOUNDARY_OUTPUT_EXAMPLE } from "./safe-process-spawn-boundary.fixtures.ts";
import { buildDryRunSpawnSimulation } from "./dry-run-spawn-simulator.ts";

export const DRY_RUN_SPAWN_SIMULATION_INPUT_EXAMPLE = SAFE_PROCESS_SPAWN_BOUNDARY_OUTPUT_EXAMPLE;

export const DRY_RUN_SPAWN_SIMULATION_OUTPUT_EXAMPLE = buildDryRunSpawnSimulation(
  DRY_RUN_SPAWN_SIMULATION_INPUT_EXAMPLE
);

export const DRY_RUN_SPAWN_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  simulationItemId: "dry-run-spawn-item-001",
  queueOrder: 0,
  spawnItemId: "safe-process-spawn-item-001",
  segmentId: "segment-001",
  mode: "frame-export" as const,
  result: "simulated-pass" as const,
  simulatedStdoutStub:
    "[dry-run] ffmpeg stdout stub safe-process-spawn-item-001 -> storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
  simulatedStderrStub: "[dry-run] ffmpeg stderr stub empty for safe-process-spawn-item-001",
  blockedReason: null,
  simulatedStartOffsetMs: 0,
  simulatedDurationMs: 125,
});
