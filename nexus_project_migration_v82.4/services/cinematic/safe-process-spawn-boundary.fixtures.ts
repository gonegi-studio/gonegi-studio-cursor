import { FFMPEG_RUNTIME_ADAPTER_OUTPUT_EXAMPLE } from "./ffmpeg-runtime-adapter.fixtures.ts";
import { buildSafeProcessSpawnBoundary } from "./safe-process-spawn-boundary.ts";

export const SAFE_PROCESS_SPAWN_BOUNDARY_INPUT_EXAMPLE = FFMPEG_RUNTIME_ADAPTER_OUTPUT_EXAMPLE;

export const SAFE_PROCESS_SPAWN_BOUNDARY_OUTPUT_EXAMPLE = buildSafeProcessSpawnBoundary(
  SAFE_PROCESS_SPAWN_BOUNDARY_INPUT_EXAMPLE
);

export const SAFE_PROCESS_SPAWN_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  spawnItemId: "safe-process-spawn-item-001",
  queueOrder: 0,
  adapterItemId: "ffmpeg-runtime-adapter-item-001",
  mode: "frame-export" as const,
  segmentId: "segment-001",
  allowlistedBinary: "ffmpeg" as const,
  normalizedArgs: Object.freeze([
    "ffmpeg",
    "-ss",
    "4.000",
    "-i",
    "storage/pilot-intake/stubs/gonegi-harbor-pilot-25s-slot-001/source/pilot-25s.stub",
    "-frames:v",
    "1",
    "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
  ]),
  argsValidationState: "passed" as const,
  blockedUnsafeArgs: Object.freeze([]),
  expectedOutputStubPath:
    "storage/pilot-intake/stubs/segment-001/frames/harbor-opening-hold-frame-001.jpg",
  spawnState: "spawn-blocked-pending-safe-runtime-gate",
});

export const SAFE_PROCESS_SPAWN_POLICY_OUTPUT_EXAMPLE = Object.freeze({
  policyId: "safe-process-spawn-policy-gonegi-harbor-25s-v1",
  allowlistedBinary: "ffmpeg" as const,
  spawnExecutionEnabled: false as const,
  blockedUnsafeArgPatterns: Object.freeze([";", "|", "&&", "||", "$(", "`", "\n", "\r", "<", ">"]),
  allowedStubPathPrefixes: Object.freeze(["storage/pilot-intake/stubs/"]),
  allowedFlagTokens: Object.freeze(["-ss", "-to", "-i", "-frames:v", "-c", "copy", "1"]),
  validationMode: "deterministic-args-only-no-shell-metacharacters",
});
