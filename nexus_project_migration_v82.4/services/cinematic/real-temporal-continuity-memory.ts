import crypto from "crypto";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT } from "./real-image-app-input-package.ts";

export type RealTemporalContinuityMemorySegment = {
  queueOrder: number;
  frameEvidenceId: string;
  timestampSeconds: string;
  emotionalCarryOver: {
    fromPrevious: number;
    toNext: number;
    decayTau: number;
    residueLabels: readonly string[];
    carryWaveform: readonly number[];
  };
  motionPersistence: {
    velocityInheritance: number;
    vectorContinuity: readonly [number, number, number];
    decelerationRate: number;
    motionWaveform: readonly number[];
  };
  pacingDecay: {
    rhythmMemory: number;
    beatDecay: number;
    tensionRelease: number;
    pacingWaveform: readonly number[];
  };
};

export type RealTemporalContinuityMemory = {
  version: "v1";
  memoryId: string;
  inputPackageId: string;
  memoryVersion: typeof REAL_TEMPORAL_CONTINUITY_MEMORY_KIND_VERSION;
  activeMemoryState: string;
  frameCount: typeof REAL_TEMPORAL_CONTINUITY_MEMORY_FRAME_COUNT;
  segments: readonly RealTemporalContinuityMemorySegment[];
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_TEMPORAL_CONTINUITY_MEMORY_VERSION = "v1" as const;
export const REAL_TEMPORAL_CONTINUITY_MEMORY_KIND_VERSION =
  "real-temporal-continuity-memory-v1" as const;
export const REAL_TEMPORAL_CONTINUITY_MEMORY_ROOT_ID =
  "real-temporal-continuity-memory-gonegi-harbor-25s-v1" as const;
export const REAL_TEMPORAL_CONTINUITY_MEMORY_STATE =
  "25s-real-temporal-continuity-memory-metadata-only" as const;
export const REAL_TEMPORAL_CONTINUITY_MEMORY_FRAME_COUNT = 3 as const;
export const REAL_TEMPORAL_CONTINUITY_MEMORY_WAVEFORM_LENGTH = 16 as const;

const SEGMENT_PROFILES = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    fromPrevious: 0,
    toNext: 0.72,
    decayTau: 6.8,
    velocityInheritance: 0.18,
    decelerationRate: 0.08,
    rhythmMemory: 0.84,
    beatDecay: 0.12,
    tensionRelease: 0.22,
  }),
  Object.freeze({
    queueOrder: 1,
    fromPrevious: 0.72,
    toNext: 0.68,
    decayTau: 5.4,
    velocityInheritance: 0.42,
    decelerationRate: 0.14,
    rhythmMemory: 0.88,
    beatDecay: 0.18,
    tensionRelease: 0.38,
  }),
  Object.freeze({
    queueOrder: 2,
    fromPrevious: 0.68,
    toNext: 0.92,
    decayTau: 4.2,
    velocityInheritance: 0.08,
    decelerationRate: 0.22,
    rhythmMemory: 0.92,
    beatDecay: 0.28,
    tensionRelease: 0.78,
  }),
] as const);

let cachedRealTemporalContinuityMemory: RealTemporalContinuityMemory | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildWaveform(seed: string, length: number): readonly number[] {
  const bytes = crypto.createHash("sha256").update(seed).digest();
  return Object.freeze(
    Array.from({ length }, (_, index) =>
      Number(((bytes[index % bytes.length] ?? 0) / 255).toFixed(6))
    )
  );
}

function buildVectorContinuity(item: RealImageAppInputPackageItem): readonly [number, number, number] {
  const bytes = crypto.createHash("sha256").update(`${item.frameEvidenceId}|vector`).digest();
  return Object.freeze([
    Number(((bytes[0] ?? 0) / 255).toFixed(4)),
    Number(((bytes[1] ?? 0) / 255).toFixed(4)),
    Number(((bytes[2] ?? 0) / 255).toFixed(4)),
  ] as const);
}

function resolveSegmentProfile(queueOrder: number) {
  const profile = SEGMENT_PROFILES.find((entry) => entry.queueOrder === queueOrder);
  if (profile === undefined) {
    throw new Error(`Unknown temporal continuity profile for queueOrder=${queueOrder}`);
  }
  return profile;
}

function buildResidueLabels(item: RealImageAppInputPackageItem): readonly string[] {
  return Object.freeze([
    item.emotionTone,
    item.rhythmPhase,
    item.suggestedMusicEnergy,
    item.dramaFunction,
  ]);
}

function buildSegment(item: RealImageAppInputPackageItem): RealTemporalContinuityMemorySegment {
  const profile = resolveSegmentProfile(item.queueOrder);
  const waveformSeed = [REAL_TEMPORAL_CONTINUITY_MEMORY_KIND_VERSION, item.frameEvidenceId].join(
    "|"
  );

  return Object.freeze({
    queueOrder: item.queueOrder,
    frameEvidenceId: item.frameEvidenceId,
    timestampSeconds: item.timestampSeconds,
    emotionalCarryOver: Object.freeze({
      fromPrevious: profile.fromPrevious,
      toNext: profile.toNext,
      decayTau: profile.decayTau,
      residueLabels: buildResidueLabels(item),
      carryWaveform: buildWaveform(`${waveformSeed}|carry`, REAL_TEMPORAL_CONTINUITY_MEMORY_WAVEFORM_LENGTH),
    }),
    motionPersistence: Object.freeze({
      velocityInheritance: profile.velocityInheritance,
      vectorContinuity: buildVectorContinuity(item),
      decelerationRate: profile.decelerationRate,
      motionWaveform: buildWaveform(`${waveformSeed}|motion`, REAL_TEMPORAL_CONTINUITY_MEMORY_WAVEFORM_LENGTH),
    }),
    pacingDecay: Object.freeze({
      rhythmMemory: profile.rhythmMemory,
      beatDecay: profile.beatDecay,
      tensionRelease: profile.tensionRelease,
      pacingWaveform: buildWaveform(`${waveformSeed}|pacing`, REAL_TEMPORAL_CONTINUITY_MEMORY_WAVEFORM_LENGTH),
    }),
  });
}

export function buildRealTemporalContinuityMemory(
  realImageAppInputPackage: RealImageAppInputPackage
): RealTemporalContinuityMemory {
  if (cachedRealTemporalContinuityMemory !== null) {
    return cachedRealTemporalContinuityMemory;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real temporal continuity memory requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT) {
    throw new Error("Real temporal continuity memory requires three input package items");
  }

  const memoryId = digestValue(
    [
      REAL_TEMPORAL_CONTINUITY_MEMORY_KIND_VERSION,
      realImageAppInputPackage.realInputPackageId,
      orderedItems.map((item) => item.frameEvidenceId).join(","),
    ].join("|")
  );

  const memory = Object.freeze({
    version: REAL_TEMPORAL_CONTINUITY_MEMORY_VERSION,
    memoryId,
    inputPackageId: realImageAppInputPackage.realInputPackageId,
    memoryVersion: REAL_TEMPORAL_CONTINUITY_MEMORY_KIND_VERSION,
    activeMemoryState: REAL_TEMPORAL_CONTINUITY_MEMORY_STATE,
    frameCount: REAL_TEMPORAL_CONTINUITY_MEMORY_FRAME_COUNT,
    segments: Object.freeze(orderedItems.map((item) => buildSegment(item))),
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });

  cachedRealTemporalContinuityMemory = memory;
  return memory;
}

export function computeRealTemporalContinuityMemoryFingerprint(
  memory: RealTemporalContinuityMemory
): string {
  return digestValue(JSON.stringify(memory));
}

export function resetRealTemporalContinuityMemoryCacheForVerification(): void {
  cachedRealTemporalContinuityMemory = null;
}

export function resolveRealTemporalContinuitySegmentForQueue(
  memory: RealTemporalContinuityMemory,
  queueOrder: number
): RealTemporalContinuityMemorySegment | null {
  return memory.segments.find((segment) => segment.queueOrder === queueOrder) ?? null;
}
