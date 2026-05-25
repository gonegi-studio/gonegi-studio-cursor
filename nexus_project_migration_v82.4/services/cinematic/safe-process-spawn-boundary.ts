import crypto from "crypto";
import type {
  FFmpegRuntimeAdapterItem,
  FFmpegRuntimeAdapterPayload,
} from "./ffmpeg-runtime-adapter.ts";
import { computeFFmpegRuntimeAdapterFingerprint } from "./ffmpeg-runtime-adapter.ts";

export type SafeProcessSpawnPolicy = {
  policyId: string;
  allowlistedBinary: "ffmpeg";
  spawnExecutionEnabled: false;
  blockedUnsafeArgPatterns: readonly string[];
  allowedStubPathPrefixes: readonly string[];
  allowedFlagTokens: readonly string[];
  validationMode: string;
};

export type SafeProcessSpawnItem = {
  spawnItemId: string;
  queueOrder: number;
  adapterItemId: string;
  mode: FFmpegRuntimeAdapterItem["mode"];
  segmentId: string;
  allowlistedBinary: "ffmpeg";
  normalizedArgs: readonly string[];
  argsValidationState: "passed" | "blocked";
  blockedUnsafeArgs: readonly string[];
  expectedOutputStubPath: string;
  spawnState: string;
};

export type SafeProcessSpawnBoundary = {
  version: "v1";
  boundaryId: string;
  adapterId: string;
  planId: string;
  manifestId: string;
  adapterFingerprint: string;
  activeBoundaryState: string;
  policy: SafeProcessSpawnPolicy;
  items: readonly SafeProcessSpawnItem[];
};

export const SAFE_PROCESS_SPAWN_BOUNDARY_VERSION = "v1" as const;
export const SAFE_PROCESS_SPAWN_ALLOWLISTED_BINARY = "ffmpeg" as const;
export const SAFE_PROCESS_SPAWN_BOUNDARY_STATE =
  "25s-safe-process-spawn-boundary-ready-without-spawn" as const;
export const SAFE_PROCESS_SPAWN_ITEM_STATE = "spawn-blocked-pending-safe-runtime-gate" as const;
export const SAFE_PROCESS_SPAWN_VALIDATION_MODE = "deterministic-args-only-no-shell-metacharacters" as const;

export const BLOCKED_UNSAFE_ARG_PATTERNS = Object.freeze([
  ";",
  "|",
  "&&",
  "||",
  "$(",
  "`",
  "\n",
  "\r",
  "<",
  ">",
] as const);

export const ALLOWED_STUB_PATH_PREFIXES = Object.freeze([
  "storage/pilot-intake/stubs/",
] as const);

export const ALLOWED_FLAG_TOKENS = Object.freeze([
  "-ss",
  "-to",
  "-i",
  "-frames:v",
  "-c",
  "copy",
  "1",
] as const);

function buildSpawnItemId(index: number): string {
  return `safe-process-spawn-item-${String(index + 1).padStart(3, "0")}`;
}

function findBlockedUnsafeArgs(args: readonly string[]): readonly string[] {
  const blocked = args.filter((arg) =>
    BLOCKED_UNSAFE_ARG_PATTERNS.some((pattern) => arg.includes(pattern))
  );

  if (args[0] !== SAFE_PROCESS_SPAWN_ALLOWLISTED_BINARY) {
    return Object.freeze([...blocked, args[0] ?? "missing-allowlisted-binary"]);
  }

  const invalidPaths = args.filter(
    (arg) =>
      arg.includes("/") &&
      !ALLOWED_STUB_PATH_PREFIXES.some((prefix) => arg.startsWith(prefix))
  );

  return Object.freeze([...blocked, ...invalidPaths]);
}

function validateNormalizedArgs(args: readonly string[]): {
  argsValidationState: "passed" | "blocked";
  blockedUnsafeArgs: readonly string[];
} {
  const blockedUnsafeArgs = findBlockedUnsafeArgs(args);
  return Object.freeze({
    argsValidationState: blockedUnsafeArgs.length === 0 ? "passed" : "blocked",
    blockedUnsafeArgs,
  });
}

function buildSafeProcessSpawnPolicy(): SafeProcessSpawnPolicy {
  return Object.freeze({
    policyId: "safe-process-spawn-policy-gonegi-harbor-25s-v1",
    allowlistedBinary: SAFE_PROCESS_SPAWN_ALLOWLISTED_BINARY,
    spawnExecutionEnabled: false,
    blockedUnsafeArgPatterns: BLOCKED_UNSAFE_ARG_PATTERNS,
    allowedStubPathPrefixes: ALLOWED_STUB_PATH_PREFIXES,
    allowedFlagTokens: ALLOWED_FLAG_TOKENS,
    validationMode: SAFE_PROCESS_SPAWN_VALIDATION_MODE,
  });
}

function buildSafeProcessSpawnItem(adapterItem: FFmpegRuntimeAdapterItem): SafeProcessSpawnItem {
  const normalizedArgs = Object.freeze([...adapterItem.commandArgs]);
  const validation = validateNormalizedArgs(normalizedArgs);

  return Object.freeze({
    spawnItemId: buildSpawnItemId(adapterItem.executionOrder),
    queueOrder: adapterItem.executionOrder,
    adapterItemId: adapterItem.adapterItemId,
    mode: adapterItem.mode,
    segmentId: adapterItem.segmentId,
    allowlistedBinary: SAFE_PROCESS_SPAWN_ALLOWLISTED_BINARY,
    normalizedArgs,
    argsValidationState: validation.argsValidationState,
    blockedUnsafeArgs: validation.blockedUnsafeArgs,
    expectedOutputStubPath: adapterItem.expectedOutputStubPath,
    spawnState: SAFE_PROCESS_SPAWN_ITEM_STATE,
  });
}

export function buildSafeProcessSpawnBoundary(
  payload: FFmpegRuntimeAdapterPayload
): SafeProcessSpawnBoundary {
  const items = Object.freeze(
    [...payload.items]
      .sort((a, b) => a.executionOrder - b.executionOrder)
      .map((adapterItem) => buildSafeProcessSpawnItem(adapterItem))
  );

  return Object.freeze({
    version: SAFE_PROCESS_SPAWN_BOUNDARY_VERSION,
    boundaryId: "safe-process-spawn-boundary-gonegi-harbor-25s-v1",
    adapterId: payload.adapterId,
    planId: payload.planId,
    manifestId: payload.manifestId,
    adapterFingerprint: computeFFmpegRuntimeAdapterFingerprint(payload),
    activeBoundaryState: SAFE_PROCESS_SPAWN_BOUNDARY_STATE,
    policy: buildSafeProcessSpawnPolicy(),
    items,
  });
}

export const SAFE_PROCESS_SPAWN_BOUNDARY_KEY_ORDER = Object.freeze([
  "version",
  "boundaryId",
  "adapterId",
  "planId",
  "manifestId",
  "adapterFingerprint",
  "activeBoundaryState",
  "policy",
  "items",
] as const);

export const SAFE_PROCESS_SPAWN_POLICY_KEY_ORDER = Object.freeze([
  "policyId",
  "allowlistedBinary",
  "spawnExecutionEnabled",
  "blockedUnsafeArgPatterns",
  "allowedStubPathPrefixes",
  "allowedFlagTokens",
  "validationMode",
] as const);

export const SAFE_PROCESS_SPAWN_ITEM_KEY_ORDER = Object.freeze([
  "spawnItemId",
  "queueOrder",
  "adapterItemId",
  "mode",
  "segmentId",
  "allowlistedBinary",
  "normalizedArgs",
  "argsValidationState",
  "blockedUnsafeArgs",
  "expectedOutputStubPath",
  "spawnState",
] as const);

function orderRecord<T extends Record<string, unknown>>(item: T, keyOrder: readonly string[]): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeSafeProcessSpawnBoundary(boundary: SafeProcessSpawnBoundary): string {
  const orderedItems = [...boundary.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, SAFE_PROCESS_SPAWN_ITEM_KEY_ORDER));

  const orderedBoundary: Record<string, unknown> = {};
  for (const key of SAFE_PROCESS_SPAWN_BOUNDARY_KEY_ORDER) {
    if (key === "policy") {
      orderedBoundary.policy = orderRecord(boundary.policy, SAFE_PROCESS_SPAWN_POLICY_KEY_ORDER);
    } else if (key === "items") {
      orderedBoundary.items = orderedItems;
    } else {
      orderedBoundary[key] = boundary[key as keyof SafeProcessSpawnBoundary];
    }
  }

  return JSON.stringify(orderedBoundary);
}

export function computeSafeProcessSpawnBoundaryFingerprint(boundary: SafeProcessSpawnBoundary): string {
  return crypto.createHash("sha256").update(serializeSafeProcessSpawnBoundary(boundary)).digest("hex");
}
