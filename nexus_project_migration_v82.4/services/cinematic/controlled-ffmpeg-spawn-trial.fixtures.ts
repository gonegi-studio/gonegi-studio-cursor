import { REAL_SPAWN_EXECUTION_GATE_OUTPUT_EXAMPLE } from "./real-spawn-execution-gate.fixtures.ts";
import {
  buildControlledFFmpegSpawnTrial,
  computeControlledFFmpegSpawnTrialFingerprint,
} from "./controlled-ffmpeg-spawn-trial.ts";

export const CONTROLLED_FFMPEG_SPAWN_TRIAL_INPUT_EXAMPLE = REAL_SPAWN_EXECUTION_GATE_OUTPUT_EXAMPLE;

export const CONTROLLED_FFMPEG_SPAWN_TRIAL_OUTPUT_EXAMPLE = buildControlledFFmpegSpawnTrial(
  CONTROLLED_FFMPEG_SPAWN_TRIAL_INPUT_EXAMPLE
);

export const CONTROLLED_FFMPEG_SPAWN_TRIAL_FINGERPRINT = computeControlledFFmpegSpawnTrialFingerprint(
  CONTROLLED_FFMPEG_SPAWN_TRIAL_OUTPUT_EXAMPLE
);

export const CONTROLLED_FFMPEG_SPAWN_TRIAL_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  trialId: "controlled-ffmpeg-spawn-trial-gonegi-harbor-25s-v1",
  gateId: "real-spawn-execution-gate-gonegi-harbor-25s-v1",
  activeTrialState: "25s-controlled-ffmpeg-version-spawn-single-trial",
  maxSpawnCount: 1 as const,
  spawnCount: 1,
  result: "spawn-success" as const,
  resolvedExecutable: "ffmpeg",
  trialArgs: Object.freeze(["-version"] as const),
  shell: false as const,
  stdioMode: "pipe" as const,
  timeoutMs: 5000 as const,
  outputFileWriteExecuted: false as const,
  extractionExecuted: false as const,
  inputVideoReferenced: false as const,
  recursiveExecution: false as const,
  networkAccess: false as const,
});
