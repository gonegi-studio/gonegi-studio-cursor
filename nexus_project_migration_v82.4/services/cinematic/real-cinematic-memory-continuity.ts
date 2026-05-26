import crypto from "crypto";
import { buildRealCameraGrammarEvolution } from "./real-camera-grammar-evolution.ts";
import type { RealCameraGrammarEvolutionStage } from "./real-camera-grammar-evolution.ts";
import { buildRealCharacterEmotionalTrajectory } from "./real-character-emotional-trajectory.ts";
import type { RealCharacterEmotionalFrameTrajectory } from "./real-character-emotional-trajectory.ts";
import { buildRealEnvironmentalPersistence } from "./real-environmental-persistence.ts";
import type { RealEnvironmentalPersistenceFrame } from "./real-environmental-persistence.ts";
import {
  REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE,
} from "./real-image-app-input-package.ts";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT } from "./real-image-app-input-package.ts";
import {
  buildRealTemporalDedupedCompletionSnapshotPreview,
  computeRealTemporalDedupedCompletionSnapshotFingerprint,
} from "./real-temporal-deduped-completion-snapshot.ts";
import {
  buildRealTemporalContinuityMemory,
} from "./real-temporal-continuity-memory.ts";
import type {
  RealTemporalContinuityMemory,
  RealTemporalContinuityMemorySegment,
} from "./real-temporal-continuity-memory.ts";

export type RealCinematicMemoryContinuityEmotionalCarryoverSegment = {
  queueOrder: number;
  frameEvidenceId: string;
  fromPrevious: number;
  toNext: number;
  decayTau: number;
  residueLabels: readonly string[];
  crossSequenceBinding: number;
};

export type RealCinematicMemoryContinuityEmotionalCarryover = {
  segments: readonly RealCinematicMemoryContinuityEmotionalCarryoverSegment[];
  chainContinuityScore: number;
};

export type RealCinematicMemoryContinuityVisualMotif = {
  motifId: string;
  label: string;
  sourceQueueOrder: number;
  persistenceWeight: number;
  recurrenceFrames: readonly number[];
};

export type RealCinematicMemoryContinuityVisualMotifMemory = {
  motifs: readonly RealCinematicMemoryContinuityVisualMotif[];
  motifCoherenceScore: number;
};

export type RealCinematicMemoryContinuityCameraRhythmStage = {
  queueOrder: number;
  frameEvidenceId: string;
  rhythmPhase: string;
  rhythmMemory: number;
  lensTransition: string;
  focalSpanMm: number;
  distanceCurveMean: number;
};

export type RealCinematicMemoryContinuityCameraRhythmMemory = {
  stages: readonly RealCinematicMemoryContinuityCameraRhythmStage[];
  rhythmChainScore: number;
};

export type RealCinematicMemoryContinuityEnvironmentPersistenceFrame = {
  queueOrder: number;
  frameEvidenceId: string;
  zoneCount: number;
  horizonLockMean: number;
  parallaxCoherenceMean: number;
  atmosphereDriftIndex: number;
};

export type RealCinematicMemoryContinuityEnvironmentPersistence = {
  frames: readonly RealCinematicMemoryContinuityEnvironmentPersistenceFrame[];
  persistenceChainScore: number;
};

export type RealCinematicMemoryContinuityCharacterStateFrame = {
  queueOrder: number;
  frameEvidenceId: string;
  dramaFunction: string;
  entryValence: number;
  resolveValence: number;
  valenceDelta: number;
  arousalDelta: number;
  stateBinding: number;
};

export type RealCinematicMemoryContinuityCharacterStateCarryover = {
  frames: readonly RealCinematicMemoryContinuityCharacterStateFrame[];
  stateChainScore: number;
};

export type RealCinematicMemoryContinuitySnapshot = {
  version: "v1";
  continuityId: string;
  continuityVersion: typeof REAL_CINEMATIC_MEMORY_CONTINUITY_KIND_VERSION;
  activeContinuityState: string;
  inputPackageId: string;
  completionSnapshotFingerprint: string;
  frameCount: typeof REAL_CINEMATIC_MEMORY_CONTINUITY_FRAME_COUNT;
  emotionalCarryover: RealCinematicMemoryContinuityEmotionalCarryover;
  visualMotifMemory: RealCinematicMemoryContinuityVisualMotifMemory;
  cameraRhythmMemory: RealCinematicMemoryContinuityCameraRhythmMemory;
  environmentPersistence: RealCinematicMemoryContinuityEnvironmentPersistence;
  characterStateCarryover: RealCinematicMemoryContinuityCharacterStateCarryover;
  continuityMemoryScore: number;
  inferenceExecuted: false;
  providerCallExecuted: false;
  imageGenerationExecuted: false;
};

export const REAL_CINEMATIC_MEMORY_CONTINUITY_VERSION = "v1" as const;
export const REAL_CINEMATIC_MEMORY_CONTINUITY_KIND_VERSION =
  "real-cinematic-memory-continuity-v1" as const;
export const REAL_CINEMATIC_MEMORY_CONTINUITY_ROOT_ID =
  "real-cinematic-memory-continuity-gonegi-harbor-25s-v1" as const;
export const REAL_CINEMATIC_MEMORY_CONTINUITY_STATE =
  "25s-real-cinematic-memory-continuity-metadata-only" as const;
export const REAL_CINEMATIC_MEMORY_CONTINUITY_FRAME_COUNT = 3 as const;

export const REAL_CINEMATIC_MEMORY_CONTINUITY_KEY_ORDER = Object.freeze([
  "version",
  "continuityId",
  "continuityVersion",
  "activeContinuityState",
  "inputPackageId",
  "completionSnapshotFingerprint",
  "frameCount",
  "emotionalCarryover",
  "visualMotifMemory",
  "cameraRhythmMemory",
  "environmentPersistence",
  "characterStateCarryover",
  "continuityMemoryScore",
  "inferenceExecuted",
  "providerCallExecuted",
  "imageGenerationExecuted",
] as const);

const VISUAL_MOTIF_LABELS = Object.freeze([
  "harbor-establish-glow",
  "flight-bridge-arc",
  "wonder-release-horizon",
] as const);

let cachedRealCinematicMemoryContinuitySnapshot: RealCinematicMemoryContinuitySnapshot | null =
  null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function clampScore(value: number): number {
  return Number(Math.min(1, Math.max(0, value)).toFixed(4));
}

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

function mean(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function resolveOrderedItems(
  realImageAppInputPackage: RealImageAppInputPackage
): readonly RealImageAppInputPackageItem[] {
  return Object.freeze(
    [...realImageAppInputPackage.items].sort((a, b) => a.queueOrder - b.queueOrder)
  );
}

function buildEmotionalCarryover(
  items: readonly RealImageAppInputPackageItem[],
  temporalMemory: RealTemporalContinuityMemory
): RealCinematicMemoryContinuityEmotionalCarryover {
  const segmentByQueue = new Map(
    temporalMemory.segments.map((segment) => [segment.queueOrder, segment])
  );

  const segments = Object.freeze(
    items.map((item) => {
      const segment = segmentByQueue.get(item.queueOrder);
      if (segment === undefined) {
        throw new Error(`Missing temporal continuity segment for queueOrder=${item.queueOrder}`);
      }

      const crossSequenceBinding = clampScore(
        (segment.emotionalCarryOver.fromPrevious + segment.emotionalCarryOver.toNext) / 2
      );

      return Object.freeze({
        queueOrder: item.queueOrder,
        frameEvidenceId: item.frameEvidenceId,
        fromPrevious: segment.emotionalCarryOver.fromPrevious,
        toNext: segment.emotionalCarryOver.toNext,
        decayTau: segment.emotionalCarryOver.decayTau,
        residueLabels: segment.emotionalCarryOver.residueLabels,
        crossSequenceBinding,
      });
    })
  );

  const chainContinuityScore = clampScore(
    mean(segments.map((segment) => segment.crossSequenceBinding))
  );

  return Object.freeze({
    segments,
    chainContinuityScore,
  });
}

function buildVisualMotifMemory(
  items: readonly RealImageAppInputPackageItem[],
  emotionalCarryover: RealCinematicMemoryContinuityEmotionalCarryover
): RealCinematicMemoryContinuityVisualMotifMemory {
  const carryoverByQueue = new Map(
    emotionalCarryover.segments.map((segment) => [segment.queueOrder, segment])
  );

  const motifs = Object.freeze(
    items.map((item) => {
      const carryover = carryoverByQueue.get(item.queueOrder);
      const motifLabel = VISUAL_MOTIF_LABELS[item.queueOrder] ?? `${item.dramaFunction}-motif`;
      const recurrenceFrames = Object.freeze(
        items
          .filter(
            (candidate) =>
              candidate.emotionTone === item.emotionTone ||
              candidate.rhythmPhase === item.rhythmPhase
          )
          .map((candidate) => candidate.queueOrder)
      );

      return Object.freeze({
        motifId: digestValue(
          [REAL_CINEMATIC_MEMORY_CONTINUITY_KIND_VERSION, item.frameEvidenceId, motifLabel].join("|")
        ).slice(0, 20),
        label: motifLabel,
        sourceQueueOrder: item.queueOrder,
        persistenceWeight: clampScore(
          ((carryover?.toNext ?? 0) + (carryover?.fromPrevious ?? 0)) / 2
        ),
        recurrenceFrames,
      });
    })
  );

  const motifCoherenceScore = clampScore(
    mean(motifs.map((motif) => motif.persistenceWeight)) * 0.65 +
      (new Set(motifs.flatMap((motif) => [...motif.recurrenceFrames])).size /
        REAL_CINEMATIC_MEMORY_CONTINUITY_FRAME_COUNT) *
        0.35
  );

  return Object.freeze({
    motifs,
    motifCoherenceScore,
  });
}

function buildCameraRhythmMemory(
  items: readonly RealImageAppInputPackageItem[],
  cameraStages: readonly RealCameraGrammarEvolutionStage[],
  temporalSegments: readonly RealTemporalContinuityMemorySegment[]
): RealCinematicMemoryContinuityCameraRhythmMemory {
  const stageByQueue = new Map(cameraStages.map((stage) => [stage.queueOrder, stage]));
  const temporalByQueue = new Map(temporalSegments.map((segment) => [segment.queueOrder, segment]));

  const stages = Object.freeze(
    items.map((item) => {
      const stage = stageByQueue.get(item.queueOrder);
      const temporal = temporalByQueue.get(item.queueOrder);
      if (stage === undefined || temporal === undefined) {
        throw new Error(`Missing camera rhythm sources for queueOrder=${item.queueOrder}`);
      }

      return Object.freeze({
        queueOrder: item.queueOrder,
        frameEvidenceId: item.frameEvidenceId,
        rhythmPhase: item.rhythmPhase,
        rhythmMemory: temporal.pacingDecay.rhythmMemory,
        lensTransition: stage.lensTransition.transitionType,
        focalSpanMm: stage.lensTransition.toFocalMm - stage.lensTransition.fromFocalMm,
        distanceCurveMean: clampScore(mean(stage.cinematicDistance.distanceCurve)),
      });
    })
  );

  const rhythmChainScore = clampScore(
    mean(stages.map((stage) => stage.rhythmMemory)) * 0.55 +
      mean(stages.map((stage) => stage.distanceCurveMean)) * 0.45
  );

  return Object.freeze({
    stages,
    rhythmChainScore,
  });
}

function buildEnvironmentPersistenceSummary(
  environmentFrames: readonly RealEnvironmentalPersistenceFrame[]
): RealCinematicMemoryContinuityEnvironmentPersistence {
  const frames = Object.freeze(
    environmentFrames.map((frame) => {
      const horizonLockMean = mean(
        frame.zones.map((zone) => zone.spatialConsistency.horizonLock)
      );
      const parallaxCoherenceMean = mean(
        frame.zones.map((zone) => zone.spatialConsistency.parallaxCoherence)
      );
      const atmosphereDriftIndex = mean(
        frame.zones.map(
          (zone) =>
            zone.atmosphereDrift.hazeIndex * 0.4 +
            zone.atmosphereDrift.humidityWeight * 0.3 +
            zone.atmosphereDrift.particulateDensity * 0.3
        )
      );

      return Object.freeze({
        queueOrder: frame.queueOrder,
        frameEvidenceId: frame.frameEvidenceId,
        zoneCount: frame.zones.length,
        horizonLockMean: clampScore(horizonLockMean),
        parallaxCoherenceMean: clampScore(parallaxCoherenceMean),
        atmosphereDriftIndex: clampScore(atmosphereDriftIndex),
      });
    })
  );

  const persistenceChainScore = clampScore(
    mean(frames.map((frame) => frame.horizonLockMean)) * 0.4 +
      mean(frames.map((frame) => frame.parallaxCoherenceMean)) * 0.35 +
      (1 - mean(frames.map((frame) => frame.atmosphereDriftIndex))) * 0.25
  );

  return Object.freeze({
    frames,
    persistenceChainScore,
  });
}

function buildCharacterStateCarryover(
  characterFrames: readonly RealCharacterEmotionalFrameTrajectory[],
  emotionalCarryover: RealCinematicMemoryContinuityEmotionalCarryover
): RealCinematicMemoryContinuityCharacterStateCarryover {
  const carryoverByQueue = new Map(
    emotionalCarryover.segments.map((segment) => [segment.queueOrder, segment])
  );

  const frames = Object.freeze(
    characterFrames.map((frame) => {
      const carryover = carryoverByQueue.get(frame.queueOrder);
      const valenceDelta = clampScore(frame.emotionalResolve.valence - frame.emotionalEntry.valence);
      const arousalDelta = clampScore(frame.emotionalResolve.arousal - frame.emotionalEntry.arousal);

      return Object.freeze({
        queueOrder: frame.queueOrder,
        frameEvidenceId: frame.frameEvidenceId,
        dramaFunction: frame.dramaFunction,
        entryValence: frame.emotionalEntry.valence,
        resolveValence: frame.emotionalResolve.valence,
        valenceDelta,
        arousalDelta,
        stateBinding: clampScore(
          ((carryover?.crossSequenceBinding ?? 0) + valenceDelta + frame.emotionalResolve.confidence) /
            3
        ),
      });
    })
  );

  const stateChainScore = clampScore(mean(frames.map((frame) => frame.stateBinding)));

  return Object.freeze({
    frames,
    stateChainScore,
  });
}

function computeContinuityMemoryScore(snapshot: {
  emotionalCarryover: RealCinematicMemoryContinuityEmotionalCarryover;
  visualMotifMemory: RealCinematicMemoryContinuityVisualMotifMemory;
  cameraRhythmMemory: RealCinematicMemoryContinuityCameraRhythmMemory;
  environmentPersistence: RealCinematicMemoryContinuityEnvironmentPersistence;
  characterStateCarryover: RealCinematicMemoryContinuityCharacterStateCarryover;
}): number {
  return clampScore(
    snapshot.emotionalCarryover.chainContinuityScore * 0.22 +
      snapshot.visualMotifMemory.motifCoherenceScore * 0.18 +
      snapshot.cameraRhythmMemory.rhythmChainScore * 0.2 +
      snapshot.environmentPersistence.persistenceChainScore * 0.2 +
      snapshot.characterStateCarryover.stateChainScore * 0.2
  );
}

export function buildRealCinematicMemoryContinuitySnapshotFromPackage(
  realImageAppInputPackage: RealImageAppInputPackage,
  options?: {
    completionSnapshotFingerprint?: string;
  }
): RealCinematicMemoryContinuitySnapshot {
  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Cinematic memory continuity requires package-complete input package");
  }

  const orderedItems = resolveOrderedItems(realImageAppInputPackage);
  if (orderedItems.length !== REAL_CINEMATIC_MEMORY_CONTINUITY_FRAME_COUNT) {
    throw new Error("Cinematic memory continuity requires three input package items");
  }

  const temporalMemory = buildRealTemporalContinuityMemory(realImageAppInputPackage);
  const cameraEvolution = buildRealCameraGrammarEvolution(realImageAppInputPackage);
  const environmentPersistence = buildRealEnvironmentalPersistence(realImageAppInputPackage);
  const characterTrajectory = buildRealCharacterEmotionalTrajectory(realImageAppInputPackage);

  const emotionalCarryover = buildEmotionalCarryover(orderedItems, temporalMemory);
  const visualMotifMemory = buildVisualMotifMemory(orderedItems, emotionalCarryover);
  const cameraRhythmMemory = buildCameraRhythmMemory(
    orderedItems,
    cameraEvolution.stages,
    temporalMemory.segments
  );
  const environmentPersistenceSummary = buildEnvironmentPersistenceSummary(
    environmentPersistence.frames
  );
  const characterStateCarryover = buildCharacterStateCarryover(
    characterTrajectory.frames,
    emotionalCarryover
  );

  const continuityMemoryScore = computeContinuityMemoryScore({
    emotionalCarryover,
    visualMotifMemory,
    cameraRhythmMemory,
    environmentPersistence: environmentPersistenceSummary,
    characterStateCarryover,
  });

  const completionSnapshotFingerprint =
    options?.completionSnapshotFingerprint ??
    computeRealTemporalDedupedCompletionSnapshotFingerprint(
      buildRealTemporalDedupedCompletionSnapshotPreview()
    );

  const continuityId = digestValue(
    [
      REAL_CINEMATIC_MEMORY_CONTINUITY_KIND_VERSION,
      realImageAppInputPackage.realInputPackageId,
      completionSnapshotFingerprint,
      String(continuityMemoryScore),
    ].join("|")
  );

  return Object.freeze({
    version: REAL_CINEMATIC_MEMORY_CONTINUITY_VERSION,
    continuityId,
    continuityVersion: REAL_CINEMATIC_MEMORY_CONTINUITY_KIND_VERSION,
    activeContinuityState: REAL_CINEMATIC_MEMORY_CONTINUITY_STATE,
    inputPackageId: realImageAppInputPackage.realInputPackageId,
    completionSnapshotFingerprint,
    frameCount: REAL_CINEMATIC_MEMORY_CONTINUITY_FRAME_COUNT,
    emotionalCarryover,
    visualMotifMemory,
    cameraRhythmMemory,
    environmentPersistence: environmentPersistenceSummary,
    characterStateCarryover,
    continuityMemoryScore,
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
    imageGenerationExecuted: false as const,
  });
}

export function serializeRealCinematicMemoryContinuitySnapshot(
  snapshot: RealCinematicMemoryContinuitySnapshot
): string {
  return JSON.stringify(
    orderRecord(
      snapshot as unknown as Record<string, unknown>,
      REAL_CINEMATIC_MEMORY_CONTINUITY_KEY_ORDER
    ),
    null,
    2
  );
}

export function computeRealCinematicMemoryContinuitySnapshotFingerprint(
  snapshot: RealCinematicMemoryContinuitySnapshot
): string {
  return digestValue(serializeRealCinematicMemoryContinuitySnapshot(snapshot));
}

export function buildRealCinematicMemoryContinuityPreview(): RealCinematicMemoryContinuitySnapshot {
  if (cachedRealCinematicMemoryContinuitySnapshot !== null) {
    return cachedRealCinematicMemoryContinuitySnapshot;
  }

  const completionSnapshot = buildRealTemporalDedupedCompletionSnapshotPreview();
  const snapshot = buildRealCinematicMemoryContinuitySnapshotFromPackage(
    REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE as RealImageAppInputPackage,
    {
      completionSnapshotFingerprint: computeRealTemporalDedupedCompletionSnapshotFingerprint(
        completionSnapshot
      ),
    }
  );
  cachedRealCinematicMemoryContinuitySnapshot = snapshot;
  return snapshot;
}

export function resetRealCinematicMemoryContinuityCacheForVerification(): void {
  cachedRealCinematicMemoryContinuitySnapshot = null;
}
