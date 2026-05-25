import crypto from "crypto";
import type { SafeProcessSpawnBoundary, SafeProcessSpawnItem } from "./safe-process-spawn-boundary.ts";
import { computeSafeProcessSpawnBoundaryFingerprint } from "./safe-process-spawn-boundary.ts";

export type DryRunSpawnResult = "simulated-pass" | "blocked";

export type DryRunSpawnItem = {
  simulationItemId: string;
  queueOrder: number;
  spawnItemId: string;
  segmentId: string;
  mode: SafeProcessSpawnItem["mode"];
  result: DryRunSpawnResult;
  simulatedStdoutStub: string;
  simulatedStderrStub: string;
  blockedReason: string | null;
  simulatedStartOffsetMs: number;
  simulatedDurationMs: number;
};

export type DryRunSpawnSimulation = {
  version: "v1";
  simulationId: string;
  boundaryId: string;
  adapterId: string;
  manifestId: string;
  boundaryFingerprint: string;
  activeSimulationState: string;
  totalSimulatedDurationMs: number;
  passedItemCount: number;
  blockedItemCount: number;
  items: readonly DryRunSpawnItem[];
};

export const DRY_RUN_SPAWN_SIMULATION_VERSION = "v1" as const;
export const DRY_RUN_SPAWN_SIMULATION_STATE =
  "25s-dry-run-spawn-simulation-ready-without-process-spawn" as const;
export const DRY_RUN_FRAME_EXPORT_SIMULATED_DURATION_MS = 125 as const;
export const DRY_RUN_SEGMENT_EXPORT_SIMULATED_DURATION_MS = 250 as const;

function buildSimulationItemId(index: number): string {
  return `dry-run-spawn-item-${String(index + 1).padStart(3, "0")}`;
}

function resolveSimulatedDurationMs(mode: SafeProcessSpawnItem["mode"]): number {
  return mode === "frame-export"
    ? DRY_RUN_FRAME_EXPORT_SIMULATED_DURATION_MS
    : DRY_RUN_SEGMENT_EXPORT_SIMULATED_DURATION_MS;
}

function resolveDryRunResult(spawnItem: SafeProcessSpawnItem): DryRunSpawnResult {
  return spawnItem.argsValidationState === "passed" ? "simulated-pass" : "blocked";
}

function buildBlockedReason(spawnItem: SafeProcessSpawnItem): string | null {
  if (spawnItem.argsValidationState !== "blocked") {
    return null;
  }
  if (spawnItem.blockedUnsafeArgs.length === 0) {
    return "spawn validation blocked without unsafe arg detail";
  }
  return `unsafe args blocked: ${spawnItem.blockedUnsafeArgs.join(",")}`;
}

function buildSimulatedStdoutStub(
  spawnItem: SafeProcessSpawnItem,
  result: DryRunSpawnResult
): string {
  if (result === "blocked") {
    return "[dry-run] stdout stub empty due to blocked spawn";
  }
  return `[dry-run] ffmpeg stdout stub ${spawnItem.spawnItemId} -> ${spawnItem.expectedOutputStubPath}`;
}

function buildSimulatedStderrStub(
  spawnItem: SafeProcessSpawnItem,
  result: DryRunSpawnResult,
  blockedReason: string | null
): string {
  if (result === "blocked") {
    return `[dry-run] stderr stub spawn blocked: ${blockedReason ?? "validation failed"}`;
  }
  return `[dry-run] ffmpeg stderr stub empty for ${spawnItem.spawnItemId}`;
}

function buildDryRunSpawnItem(
  spawnItem: SafeProcessSpawnItem,
  simulatedStartOffsetMs: number
): DryRunSpawnItem {
  const result = resolveDryRunResult(spawnItem);
  const blockedReason = buildBlockedReason(spawnItem);
  const simulatedDurationMs = resolveSimulatedDurationMs(spawnItem.mode);

  return Object.freeze({
    simulationItemId: buildSimulationItemId(spawnItem.queueOrder),
    queueOrder: spawnItem.queueOrder,
    spawnItemId: spawnItem.spawnItemId,
    segmentId: spawnItem.segmentId,
    mode: spawnItem.mode,
    result,
    simulatedStdoutStub: buildSimulatedStdoutStub(spawnItem, result),
    simulatedStderrStub: buildSimulatedStderrStub(spawnItem, result, blockedReason),
    blockedReason,
    simulatedStartOffsetMs,
    simulatedDurationMs,
  });
}

export function buildDryRunSpawnSimulation(boundary: SafeProcessSpawnBoundary): DryRunSpawnSimulation {
  const orderedSpawnItems = [...boundary.items].sort((a, b) => a.queueOrder - b.queueOrder);
  let simulatedStartOffsetMs = 0;
  const items = Object.freeze(
    orderedSpawnItems.map((spawnItem) => {
      const item = buildDryRunSpawnItem(spawnItem, simulatedStartOffsetMs);
      simulatedStartOffsetMs += item.simulatedDurationMs;
      return item;
    })
  );

  const passedItemCount = items.filter((item) => item.result === "simulated-pass").length;
  const blockedItemCount = items.filter((item) => item.result === "blocked").length;
  const totalSimulatedDurationMs = items.reduce((sum, item) => sum + item.simulatedDurationMs, 0);

  return Object.freeze({
    version: DRY_RUN_SPAWN_SIMULATION_VERSION,
    simulationId: "dry-run-spawn-simulation-gonegi-harbor-25s-v1",
    boundaryId: boundary.boundaryId,
    adapterId: boundary.adapterId,
    manifestId: boundary.manifestId,
    boundaryFingerprint: computeSafeProcessSpawnBoundaryFingerprint(boundary),
    activeSimulationState: DRY_RUN_SPAWN_SIMULATION_STATE,
    totalSimulatedDurationMs,
    passedItemCount,
    blockedItemCount,
    items,
  });
}

export const DRY_RUN_SPAWN_SIMULATION_KEY_ORDER = Object.freeze([
  "version",
  "simulationId",
  "boundaryId",
  "adapterId",
  "manifestId",
  "boundaryFingerprint",
  "activeSimulationState",
  "totalSimulatedDurationMs",
  "passedItemCount",
  "blockedItemCount",
  "items",
] as const);

export const DRY_RUN_SPAWN_ITEM_KEY_ORDER = Object.freeze([
  "simulationItemId",
  "queueOrder",
  "spawnItemId",
  "segmentId",
  "mode",
  "result",
  "simulatedStdoutStub",
  "simulatedStderrStub",
  "blockedReason",
  "simulatedStartOffsetMs",
  "simulatedDurationMs",
] as const);

function orderRecord<T extends Record<string, unknown>>(item: T, keyOrder: readonly string[]): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeDryRunSpawnSimulation(simulation: DryRunSpawnSimulation): string {
  const orderedItems = [...simulation.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, DRY_RUN_SPAWN_ITEM_KEY_ORDER));

  const orderedSimulation: Record<string, unknown> = {};
  for (const key of DRY_RUN_SPAWN_SIMULATION_KEY_ORDER) {
    if (key === "items") {
      orderedSimulation.items = orderedItems;
    } else {
      orderedSimulation[key] = simulation[key as keyof DryRunSpawnSimulation];
    }
  }

  return JSON.stringify(orderedSimulation);
}

export function computeDryRunSpawnSimulationFingerprint(simulation: DryRunSpawnSimulation): string {
  return crypto.createHash("sha256").update(serializeDryRunSpawnSimulation(simulation)).digest("hex");
}
