import crypto from "crypto";
import { spawn } from "node:child_process";
import type { SpawnOptions } from "node:child_process";
import { buildFFmpegExtractionContract } from "./ffmpeg-extraction-contract.ts";
import { buildFFmpegExecutionPlan } from "./ffmpeg-execution-plan.ts";
import { buildFFmpegRuntimeAdapterPayload } from "./ffmpeg-runtime-adapter.ts";
import type { DryRunSpawnItem, DryRunSpawnSimulation } from "./dry-run-spawn-simulator.ts";
import { computeDryRunSpawnSimulationFingerprint } from "./dry-run-spawn-simulator.ts";
import { buildMockIngestionTimeline } from "./mock-ingestion-timeline.ts";
import { buildPilotIntakeSession } from "./pilot-intake-session.ts";
import { buildPilotVideoManifest } from "./pilot-intake-schema.ts";
import type { SafeProcessSpawnBoundary } from "./safe-process-spawn-boundary.ts";
import {
  buildSafeProcessSpawnBoundary,
  computeSafeProcessSpawnBoundaryFingerprint,
} from "./safe-process-spawn-boundary.ts";

export type RealSpawnExecutionState = "execution-disabled" | "execution-ready";

export type RealSpawnExecutionItem = {
  executionItemId: string;
  queueOrder: number;
  simulationItemId: string;
  spawnItemId: string;
  segmentId: string;
  mode: DryRunSpawnItem["mode"];
  executionState: RealSpawnExecutionState;
  resolvedExecutable: string;
  validatedArgs: readonly string[];
  spawnStrategy: string;
  dryRunResult: DryRunSpawnItem["result"];
  blockedReason: string | null;
};

export type RealSpawnExecutionGate = {
  version: "v1";
  gateId: string;
  simulationId: string;
  boundaryId: string;
  manifestId: string;
  simulationFingerprint: string;
  activeGateState: string;
  executionEnabled: false;
  spawnStrategy: string;
  resolvedExecutable: string;
  spawnOptionsMetadata: SpawnOptions;
  runtimeQueueMapping: readonly string[];
  items: readonly RealSpawnExecutionItem[];
};

export const REAL_SPAWN_EXECUTION_GATE_VERSION = "v1" as const;
export const REAL_SPAWN_EXECUTION_ENABLED = false as const;
export const REAL_SPAWN_RESOLVED_EXECUTABLE = "ffmpeg" as const;
export const REAL_SPAWN_STRATEGY = "child-process-spawn-synchronous-queue-disabled" as const;
export const REAL_SPAWN_GATE_STATE = "25s-real-spawn-execution-gate-ready-with-spawn-disabled" as const;
export const REAL_SPAWN_SPAWN_OPTIONS_METADATA = Object.freeze({
  shell: false,
  windowsHide: true,
  stdio: ["pipe", "pipe", "pipe"] as ["pipe", "pipe", "pipe"],
}) satisfies SpawnOptions;

void spawn;

function buildExecutionItemId(index: number): string {
  return `real-spawn-execution-item-${String(index + 1).padStart(3, "0")}`;
}

function rebuildCanonicalSpawnBoundary(): SafeProcessSpawnBoundary {
  const manifest = buildPilotVideoManifest();
  const session = buildPilotIntakeSession(manifest);
  const timeline = buildMockIngestionTimeline(session);
  const contract = buildFFmpegExtractionContract(timeline);
  const plan = buildFFmpegExecutionPlan(contract);
  const adapterPayload = buildFFmpegRuntimeAdapterPayload(plan);
  return buildSafeProcessSpawnBoundary(adapterPayload);
}

function resolveValidatedArgs(
  boundary: SafeProcessSpawnBoundary,
  spawnItemId: string
): readonly string[] {
  const spawnItem = boundary.items.find((item) => item.spawnItemId === spawnItemId);
  if (!spawnItem) {
    throw new Error(`Missing spawn item for validated args lookup: ${spawnItemId}`);
  }
  return spawnItem.normalizedArgs;
}

function resolveExecutionState(simulationItem: DryRunSpawnItem): RealSpawnExecutionState {
  if (simulationItem.result === "blocked") {
    return "execution-disabled";
  }
  return "execution-ready";
}

function buildRealSpawnExecutionItem(
  simulationItem: DryRunSpawnItem,
  boundary: SafeProcessSpawnBoundary
): RealSpawnExecutionItem {
  const validatedArgs =
    simulationItem.result === "blocked"
      ? Object.freeze([] as const)
      : resolveValidatedArgs(boundary, simulationItem.spawnItemId);

  return Object.freeze({
    executionItemId: buildExecutionItemId(simulationItem.queueOrder),
    queueOrder: simulationItem.queueOrder,
    simulationItemId: simulationItem.simulationItemId,
    spawnItemId: simulationItem.spawnItemId,
    segmentId: simulationItem.segmentId,
    mode: simulationItem.mode,
    executionState: resolveExecutionState(simulationItem),
    resolvedExecutable: REAL_SPAWN_RESOLVED_EXECUTABLE,
    validatedArgs,
    spawnStrategy: REAL_SPAWN_STRATEGY,
    dryRunResult: simulationItem.result,
    blockedReason: simulationItem.blockedReason,
  });
}

export function buildRealSpawnExecutionGate(simulation: DryRunSpawnSimulation): RealSpawnExecutionGate {
  const boundary = rebuildCanonicalSpawnBoundary();
  const boundaryFingerprint = computeSafeProcessSpawnBoundaryFingerprint(boundary);

  if (boundaryFingerprint !== simulation.boundaryFingerprint) {
    throw new Error("Dry-run simulation boundary fingerprint mismatch");
  }

  const items = Object.freeze(
    [...simulation.items]
      .sort((a, b) => a.queueOrder - b.queueOrder)
      .map((simulationItem) => buildRealSpawnExecutionItem(simulationItem, boundary))
  );

  const runtimeQueueMapping = Object.freeze(items.map((item) => item.spawnItemId));

  return Object.freeze({
    version: REAL_SPAWN_EXECUTION_GATE_VERSION,
    gateId: "real-spawn-execution-gate-gonegi-harbor-25s-v1",
    simulationId: simulation.simulationId,
    boundaryId: simulation.boundaryId,
    manifestId: simulation.manifestId,
    simulationFingerprint: computeDryRunSpawnSimulationFingerprint(simulation),
    activeGateState: REAL_SPAWN_GATE_STATE,
    executionEnabled: REAL_SPAWN_EXECUTION_ENABLED,
    spawnStrategy: REAL_SPAWN_STRATEGY,
    resolvedExecutable: REAL_SPAWN_RESOLVED_EXECUTABLE,
    spawnOptionsMetadata: REAL_SPAWN_SPAWN_OPTIONS_METADATA,
    runtimeQueueMapping,
    items,
  });
}

export const REAL_SPAWN_EXECUTION_GATE_KEY_ORDER = Object.freeze([
  "version",
  "gateId",
  "simulationId",
  "boundaryId",
  "manifestId",
  "simulationFingerprint",
  "activeGateState",
  "executionEnabled",
  "spawnStrategy",
  "resolvedExecutable",
  "spawnOptionsMetadata",
  "runtimeQueueMapping",
  "items",
] as const);

export const REAL_SPAWN_EXECUTION_ITEM_KEY_ORDER = Object.freeze([
  "executionItemId",
  "queueOrder",
  "simulationItemId",
  "spawnItemId",
  "segmentId",
  "mode",
  "executionState",
  "resolvedExecutable",
  "validatedArgs",
  "spawnStrategy",
  "dryRunResult",
  "blockedReason",
] as const);

function orderRecord<T extends Record<string, unknown>>(item: T, keyOrder: readonly string[]): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeRealSpawnExecutionGate(gate: RealSpawnExecutionGate): string {
  const orderedItems = [...gate.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, REAL_SPAWN_EXECUTION_ITEM_KEY_ORDER));

  const orderedGate: Record<string, unknown> = {};
  for (const key of REAL_SPAWN_EXECUTION_GATE_KEY_ORDER) {
    if (key === "items") {
      orderedGate.items = orderedItems;
    } else if (key === "spawnOptionsMetadata") {
      orderedGate.spawnOptionsMetadata = gate.spawnOptionsMetadata;
    } else if (key === "runtimeQueueMapping") {
      orderedGate.runtimeQueueMapping = [...gate.runtimeQueueMapping];
    } else {
      orderedGate[key] = gate[key as keyof RealSpawnExecutionGate];
    }
  }

  return JSON.stringify(orderedGate);
}

export function computeRealSpawnExecutionGateFingerprint(gate: RealSpawnExecutionGate): string {
  return crypto.createHash("sha256").update(serializeRealSpawnExecutionGate(gate)).digest("hex");
}
