/** Phase-8C: legacy v82.6 → cinematic trait profile mapper (pure, deterministic) */

import crypto from "crypto";
import type {
  CinematicTraitId,
  CinematicTraitProfile,
  CinematicTraitWeight,
} from "./cinematic-traits.types.ts";
import { CINEMATIC_TRAIT_IDS, VIDEO_INTELLIGENCE_LAYER_VERSION } from "./cinematic-traits.types.ts";

export type LegacyV826PhysicsLike = {
  readonly luminance_balance: number;
  readonly chroma_intensity: number;
  readonly motion_density: number;
};

export type LegacyV826EmotionLike = {
  readonly valence_bias: number;
  readonly isolation_score: number;
  readonly emotional_distance: number;
};

export type LegacyV826TemporalLike = {
  readonly rhythm_pressure: number;
  readonly avg_shot_duration: number;
};

export type LegacyV826OpticsLike = {
  readonly halation_response: number;
};

export type LegacyV826CompositionLike = {
  readonly negative_space_ratio: number;
  readonly spatial_honesty: number;
};

export type LegacyV826ShotLike = {
  readonly shotId: string;
  readonly physics: LegacyV826PhysicsLike;
  readonly emotion: LegacyV826EmotionLike;
  readonly temporal: LegacyV826TemporalLike;
  readonly optics: LegacyV826OpticsLike;
  readonly composition: LegacyV826CompositionLike;
};

const AVG_SHOT_DURATION_SCALE_SEC = 12;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function averageScore(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return clampScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function inverseScore(value: number): number {
  return clampScore(1 - clampScore(value));
}

function normalizeAvgShotDuration(durationSec: number): number {
  return clampScore(durationSec / AVG_SHOT_DURATION_SCALE_SEC);
}

function buildTraitWeight(traitId: CinematicTraitId, weight: number): CinematicTraitWeight {
  return Object.freeze({
    traitId,
    weight: clampScore(weight),
  });
}

function resolveTraitScores(shot: LegacyV826ShotLike): Readonly<Record<CinematicTraitId, number>> {
  const { physics, emotion, temporal, optics, composition } = shot;

  return Object.freeze({
    warmth: averageScore([physics.luminance_balance, optics.halation_response]),
    "nostalgic-light": averageScore([emotion.valence_bias, physics.luminance_balance]),
    "slow-breathing-cut": averageScore([
      inverseScore(temporal.rhythm_pressure),
      normalizeAvgShotDuration(temporal.avg_shot_duration),
    ]),
    "environmental-framing": averageScore([
      composition.negative_space_ratio,
      composition.spatial_honesty,
    ]),
    "watercolor-glaze": averageScore([inverseScore(physics.chroma_intensity), optics.halation_response]),
    "soft-grain": averageScore([inverseScore(physics.chroma_intensity), inverseScore(physics.motion_density)]),
    "emotional-distance": averageScore([emotion.emotional_distance, emotion.isolation_score]),
    "domestic-composition": averageScore([composition.spatial_honesty, inverseScore(physics.motion_density)]),
    "reflective-lighting": averageScore([optics.halation_response, physics.luminance_balance]),
    "peaceful-silence": averageScore([inverseScore(physics.motion_density), emotion.valence_bias]),
  });
}

export function mapLegacyV826ToTraitProfile(shot: LegacyV826ShotLike): CinematicTraitProfile {
  const scores = resolveTraitScores(shot);
  const traits = Object.freeze(
    [...CINEMATIC_TRAIT_IDS]
      .sort((a, b) => a.localeCompare(b))
      .map((traitId) => buildTraitWeight(traitId, scores[traitId]))
  );

  return Object.freeze({
    version: VIDEO_INTELLIGENCE_LAYER_VERSION,
    traits,
  });
}

export function serializeCinematicTraitProfile(profile: CinematicTraitProfile): string {
  const orderedTraits = [...profile.traits]
    .sort((a, b) => a.traitId.localeCompare(b.traitId))
    .map((trait) => Object.freeze({ traitId: trait.traitId, weight: trait.weight }));

  return JSON.stringify({
    version: profile.version,
    traits: orderedTraits,
  });
}

export function computeCinematicTraitProfileFingerprint(profile: CinematicTraitProfile): string {
  return crypto.createHash("sha256").update(serializeCinematicTraitProfile(profile)).digest("hex");
}

export function assertTraitProfileScoresInRange(profile: CinematicTraitProfile): boolean {
  return profile.traits.every((trait) => trait.weight >= 0 && trait.weight <= 1);
}
