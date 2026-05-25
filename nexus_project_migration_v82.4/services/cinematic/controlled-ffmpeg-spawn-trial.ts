import crypto from "crypto";
import { spawnSync } from "node:child_process";
import type { RealSpawnExecutionGate } from "./real-spawn-execution-gate.ts";
import {
  CONTROLLED_FFMPEG_SPAWN_TRIAL_ARGS,
  CONTROLLED_FFMPEG_SPAWN_TRIAL_MAX_SPAWN_COUNT,
  CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS,
  computeRealSpawnExecutionGateFingerprint,
} from "./real-spawn-execution-gate.ts";

export type ControlledFFmpegSpawnResult = "spawn-success" | "spawn-failed" | "spawn-blocked";

export type ControlledFFmpegSpawnTrial = {
  version: "v1";
  trialId: string;
  gateId: string;
  gateFingerprint: string;
  activeTrialState: string;
  maxSpawnCount: typeof CONTROLLED_FFMPEG_SPAWN_TRIAL_MAX_SPAWN_COUNT;
  spawnCount: number;
  result: ControlledFFmpegSpawnResult;
  resolvedExecutable: string;
  trialArgs: typeof CONTROLLED_FFMPEG_SPAWN_TRIAL_ARGS;
  shell: false;
  stdioMode: "pipe";
  timeoutMs: typeof CONTROLLED_FFMPEG_SPAWN_TRIAL_TIMEOUT_MS;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdoutDigest: string;
  stderrDigest: string;
  spawnBlockedReason: string | null;
  outputFileWriteExecuted: false;
  extractionExecuted: false;
  inputVideoReferenced: false;
  recursiveExecution: false;
  networkAccess: false;
};

export const CONTROLLED_FFMPEG_SPAWN_TRIAL_VERSION = "v1" as const;
export const CONTROLLED_FFMPEG_SPAWN_TRIAL_ID =
  "controlled-ffmpeg-spawn-trial-gonegi-harbor-25s-v1" as const;
export const CONTROLLED_FFMPEG_SPAWN_TRIAL_STATE =
  "25s-controlled-ffmpeg-version-spawn-single-trial" as const;
export const CONTROLLED_FFMPEG_SPAWN_TRIAL_RESOLVED_EXECUTABLE = "ffmpeg" as const;

let cachedControlledFFmpegSpawnTrial: ControlledFFmpegSpawnTrial | null = null;
let controlledTrialSpawnCount = 0;

function digestBuffer(buffer: Buffer | null | undefined): string {
  return crypto.createHash("sha256").update(buffer ?? Buffer.alloc(0)).digest("hex");
}

function resolveSpawnBlockedReason(gate: RealSpawnExecutionGate): string | null {
  if (!gate.controlledTrialEligible) {
    return "controlled-trial-not-eligible";
  }
  if (gate.executionEnabled) {
    return "extraction-execution-enabled";
  }
  if (controlledTrialSpawnCount >= gate.maxSpawnCount) {
    return "max-spawn-count-reached";
  }
  if (gate.controlledTrialArgs.length !== 1 || gate.controlledTrialArgs[0] !== "-version") {
    return "trial-args-not-version-only";
  }
  return null;
}

function buildBlockedTrial(
  gate: RealSpawnExecutionGate,
  blockedReason: string
): ControlledFFmpegSpawnTrial {
  return Object.freeze({
    version: CONTROLLED_FFMPEG_SPAWN_TRIAL_VERSION,
    trialId: CONTROLLED_FFMPEG_SPAWN_TRIAL_ID,
    gateId: gate.gateId,
    gateFingerprint: computeRealSpawnExecutionGateFingerprint(gate),
    activeTrialState: CONTROLLED_FFMPEG_SPAWN_TRIAL_STATE,
    maxSpawnCount: gate.maxSpawnCount,
    spawnCount: controlledTrialSpawnCount,
    result: "spawn-blocked",
    resolvedExecutable: gate.resolvedExecutable,
    trialArgs: gate.controlledTrialArgs,
    shell: false,
    stdioMode: "pipe",
    timeoutMs: gate.controlledTrialTimeoutMs,
    exitCode: null,
    signal: null,
    stdoutDigest: digestBuffer(null),
    stderrDigest: digestBuffer(null),
    spawnBlockedReason: blockedReason,
    outputFileWriteExecuted: false,
    extractionExecuted: false,
    inputVideoReferenced: false,
    recursiveExecution: false,
    networkAccess: false,
  });
}

function executeVersionSpawn(gate: RealSpawnExecutionGate): ControlledFFmpegSpawnTrial {
  controlledTrialSpawnCount += 1;

  const spawnResult = spawnSync(gate.resolvedExecutable, [...gate.controlledTrialArgs], {
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
    timeout: gate.controlledTrialTimeoutMs,
    windowsHide: true,
  });

  const stdoutDigest = digestBuffer(spawnResult.stdout);
  const stderrDigest = digestBuffer(spawnResult.stderr);
  const exitCode = spawnResult.status;
  const signal = spawnResult.signal;
  const spawnFailed =
    spawnResult.error !== undefined ||
    exitCode !== 0 ||
    signal !== null;

  return Object.freeze({
    version: CONTROLLED_FFMPEG_SPAWN_TRIAL_VERSION,
    trialId: CONTROLLED_FFMPEG_SPAWN_TRIAL_ID,
    gateId: gate.gateId,
    gateFingerprint: computeRealSpawnExecutionGateFingerprint(gate),
    activeTrialState: CONTROLLED_FFMPEG_SPAWN_TRIAL_STATE,
    maxSpawnCount: gate.maxSpawnCount,
    spawnCount: controlledTrialSpawnCount,
    result: spawnFailed ? "spawn-failed" : "spawn-success",
    resolvedExecutable: gate.resolvedExecutable,
    trialArgs: gate.controlledTrialArgs,
    shell: false,
    stdioMode: "pipe",
    timeoutMs: gate.controlledTrialTimeoutMs,
    exitCode,
    signal,
    stdoutDigest,
    stderrDigest,
    spawnBlockedReason: spawnResult.error?.message ?? null,
    outputFileWriteExecuted: false,
    extractionExecuted: false,
    inputVideoReferenced: false,
    recursiveExecution: false,
    networkAccess: false,
  });
}

export function buildControlledFFmpegSpawnTrial(
  gate: RealSpawnExecutionGate
): ControlledFFmpegSpawnTrial {
  if (cachedControlledFFmpegSpawnTrial !== null) {
    return cachedControlledFFmpegSpawnTrial;
  }

  const blockedReason = resolveSpawnBlockedReason(gate);
  const trial =
    blockedReason === null ? executeVersionSpawn(gate) : buildBlockedTrial(gate, blockedReason);

  cachedControlledFFmpegSpawnTrial = trial;
  return trial;
}

export const CONTROLLED_FFMPEG_SPAWN_TRIAL_KEY_ORDER = Object.freeze([
  "version",
  "trialId",
  "gateId",
  "gateFingerprint",
  "activeTrialState",
  "maxSpawnCount",
  "spawnCount",
  "result",
  "resolvedExecutable",
  "trialArgs",
  "shell",
  "stdioMode",
  "timeoutMs",
  "exitCode",
  "signal",
  "stdoutDigest",
  "stderrDigest",
  "spawnBlockedReason",
  "outputFileWriteExecuted",
  "extractionExecuted",
  "inputVideoReferenced",
  "recursiveExecution",
  "networkAccess",
] as const);

function orderRecord<T extends Record<string, unknown>>(
  item: T,
  keyOrder: readonly string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeControlledFFmpegSpawnTrial(trial: ControlledFFmpegSpawnTrial): string {
  const orderedTrial = orderRecord(trial, CONTROLLED_FFMPEG_SPAWN_TRIAL_KEY_ORDER);
  orderedTrial.trialArgs = [...trial.trialArgs];
  return JSON.stringify(orderedTrial);
}

export function computeControlledFFmpegSpawnTrialFingerprint(
  trial: ControlledFFmpegSpawnTrial
): string {
  return crypto.createHash("sha256").update(serializeControlledFFmpegSpawnTrial(trial)).digest("hex");
}

export function resetControlledFFmpegSpawnTrialCacheForVerification(): void {
  cachedControlledFFmpegSpawnTrial = null;
  controlledTrialSpawnCount = 0;
}
