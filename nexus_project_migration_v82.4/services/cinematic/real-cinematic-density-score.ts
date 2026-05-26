import crypto from "crypto";
import type { RealCameraGrammarEvolution } from "./real-camera-grammar-evolution.ts";
import type { RealCharacterEmotionalTrajectory } from "./real-character-emotional-trajectory.ts";
import type { RealEnvironmentalPersistence } from "./real-environmental-persistence.ts";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT } from "./real-image-app-input-package.ts";
import type { RealTemporalContinuityMemory } from "./real-temporal-continuity-memory.ts";
import { buildRealCameraGrammarEvolution } from "./real-camera-grammar-evolution.ts";
import { buildRealCharacterEmotionalTrajectory } from "./real-character-emotional-trajectory.ts";
import { buildRealEnvironmentalPersistence } from "./real-environmental-persistence.ts";
import { buildRealTemporalContinuityMemory } from "./real-temporal-continuity-memory.ts";

export type RealCinematicDensityScoreFrame = {
  queueOrder: number;
  frameEvidenceId: string;
  continuityDensity: number;
  emotionalDensity: number;
  cinematicDensity: number;
  narrativeDensity: number;
  overallDensityScore: number;
  densityFactors: {
    temporalMemoryWeight: number;
    cameraGrammarWeight: number;
    environmentalWeight: number;
    emotionalTrajectoryWeight: number;
    edgeGraphWeight: number;
  };
};

export type RealCinematicDensityScore = {
  version: "v1";
  scoreId: string;
  inputPackageId: string;
  scoreVersion: typeof REAL_CINEMATIC_DENSITY_SCORE_KIND_VERSION;
  activeScoreState: string;
  frameCount: typeof REAL_CINEMATIC_DENSITY_SCORE_FRAME_COUNT;
  frames: readonly RealCinematicDensityScoreFrame[];
  datasetOverallDensityScore: number;
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_CINEMATIC_DENSITY_SCORE_VERSION = "v1" as const;
export const REAL_CINEMATIC_DENSITY_SCORE_KIND_VERSION = "real-cinematic-density-score-v1" as const;
export const REAL_CINEMATIC_DENSITY_SCORE_ROOT_ID =
  "real-cinematic-density-score-gonegi-harbor-25s-v1" as const;
export const REAL_CINEMATIC_DENSITY_SCORE_STATE =
  "25s-real-cinematic-density-score-metadata-only" as const;
export const REAL_CINEMATIC_DENSITY_SCORE_FRAME_COUNT = 3 as const;

let cachedRealCinematicDensityScore: RealCinematicDensityScore | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function clampScore(value: number): number {
  return Number(Math.min(1, Math.max(0, value)).toFixed(4));
}

function computeFrameScore(
  item: RealImageAppInputPackageItem,
  temporalMemory: RealTemporalContinuityMemory,
  cameraGrammar: RealCameraGrammarEvolution,
  environmentalPersistence: RealEnvironmentalPersistence,
  characterTrajectory: RealCharacterEmotionalTrajectory,
  projectedEdgeCount: number
): RealCinematicDensityScoreFrame {
  const temporalSegment = temporalMemory.segments.find(
    (segment) => segment.queueOrder === item.queueOrder
  );
  const cameraStage = cameraGrammar.stages.find((stage) => stage.queueOrder === item.queueOrder);
  const environmentalFrame = environmentalPersistence.frames.find(
    (frame) => frame.queueOrder === item.queueOrder
  );
  const emotionalFrame = characterTrajectory.frames.find(
    (frame) => frame.queueOrder === item.queueOrder
  );

  const temporalMemoryWeight = clampScore(
    (temporalSegment?.emotionalCarryOver.toNext ?? 0) * 0.35 +
      (temporalSegment?.motionPersistence.velocityInheritance ?? 0) * 0.35 +
      (temporalSegment?.pacingDecay.rhythmMemory ?? 0) * 0.3
  );
  const cameraGrammarWeight = clampScore(
    (cameraStage?.lensTransition.focusPullIntensity ?? 0) * 0.4 +
      (cameraStage?.framingIntent.compositionDelta ?? 0) * 0.35 +
      (cameraStage?.cinematicDistance.subjectScaleRatio ?? 0) * 0.25
  );
  const environmentalWeight = clampScore(
    ((environmentalFrame?.zones.length ?? 0) / 8) * 0.55 +
      (environmentalFrame?.zones[0]?.spatialConsistency.horizonLock ?? 0) * 0.45
  );
  const emotionalTrajectoryWeight = clampScore(
    ((emotionalFrame?.timeline.length ?? 0) / 12) * 0.5 +
      (emotionalFrame?.emotionalResolve.confidence ?? 0) * 0.5
  );
  const edgeGraphWeight = clampScore(projectedEdgeCount / 24);

  const continuityDensity = clampScore(
    temporalMemoryWeight * 0.45 + edgeGraphWeight * 0.3 + environmentalWeight * 0.25
  );
  const emotionalDensity = clampScore(
    emotionalTrajectoryWeight * 0.6 + temporalMemoryWeight * 0.4
  );
  const cinematicDensity = clampScore(
    cameraGrammarWeight * 0.55 + edgeGraphWeight * 0.25 + environmentalWeight * 0.2
  );
  const narrativeDensity = clampScore(
    emotionalTrajectoryWeight * 0.4 +
      continuityDensity * 0.25 +
      cinematicDensity * 0.2 +
      environmentalWeight * 0.15
  );
  const overallDensityScore = clampScore(
    continuityDensity * 0.28 +
      emotionalDensity * 0.26 +
      cinematicDensity * 0.24 +
      narrativeDensity * 0.22
  );

  return Object.freeze({
    queueOrder: item.queueOrder,
    frameEvidenceId: item.frameEvidenceId,
    continuityDensity,
    emotionalDensity,
    cinematicDensity,
    narrativeDensity,
    overallDensityScore,
    densityFactors: Object.freeze({
      temporalMemoryWeight,
      cameraGrammarWeight,
      environmentalWeight,
      emotionalTrajectoryWeight,
      edgeGraphWeight,
    }),
  });
}

export function buildRealCinematicDensityScore(
  realImageAppInputPackage: RealImageAppInputPackage,
  options?: {
    temporalMemory?: RealTemporalContinuityMemory;
    cameraGrammar?: RealCameraGrammarEvolution;
    environmentalPersistence?: RealEnvironmentalPersistence;
    characterTrajectory?: RealCharacterEmotionalTrajectory;
    projectedEdgeCountByQueue?: Readonly<Record<number, number>>;
  }
): RealCinematicDensityScore {
  if (cachedRealCinematicDensityScore !== null && options === undefined) {
    return cachedRealCinematicDensityScore;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real cinematic density score requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT) {
    throw new Error("Real cinematic density score requires three input package items");
  }

  const temporalMemory =
    options?.temporalMemory ?? buildRealTemporalContinuityMemory(realImageAppInputPackage);
  const cameraGrammar =
    options?.cameraGrammar ?? buildRealCameraGrammarEvolution(realImageAppInputPackage);
  const environmentalPersistence =
    options?.environmentalPersistence ??
    buildRealEnvironmentalPersistence(realImageAppInputPackage);
  const characterTrajectory =
    options?.characterTrajectory ??
    buildRealCharacterEmotionalTrajectory(realImageAppInputPackage);

  const frames = Object.freeze(
    orderedItems.map((item) =>
      computeFrameScore(
        item,
        temporalMemory,
        cameraGrammar,
        environmentalPersistence,
        characterTrajectory,
        options?.projectedEdgeCountByQueue?.[item.queueOrder] ?? 20
      )
    )
  );

  const datasetOverallDensityScore = clampScore(
    frames.reduce((sum, frame) => sum + frame.overallDensityScore, 0) / frames.length
  );

  const scoreId = digestValue(
    [
      REAL_CINEMATIC_DENSITY_SCORE_KIND_VERSION,
      realImageAppInputPackage.realInputPackageId,
      frames.map((frame) => frame.overallDensityScore).join(","),
    ].join("|")
  );

  const score = Object.freeze({
    version: REAL_CINEMATIC_DENSITY_SCORE_VERSION,
    scoreId,
    inputPackageId: realImageAppInputPackage.realInputPackageId,
    scoreVersion: REAL_CINEMATIC_DENSITY_SCORE_KIND_VERSION,
    activeScoreState: REAL_CINEMATIC_DENSITY_SCORE_STATE,
    frameCount: REAL_CINEMATIC_DENSITY_SCORE_FRAME_COUNT,
    frames,
    datasetOverallDensityScore,
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });

  if (options === undefined) {
    cachedRealCinematicDensityScore = score;
  }

  return score;
}

export function computeRealCinematicDensityScoreFingerprint(
  score: RealCinematicDensityScore
): string {
  return digestValue(JSON.stringify(score));
}

export function resetRealCinematicDensityScoreCacheForVerification(): void {
  cachedRealCinematicDensityScore = null;
}

export function resolveRealCinematicDensityScoreForQueue(
  score: RealCinematicDensityScore,
  queueOrder: number
): RealCinematicDensityScoreFrame | null {
  return score.frames.find((frame) => frame.queueOrder === queueOrder) ?? null;
}
