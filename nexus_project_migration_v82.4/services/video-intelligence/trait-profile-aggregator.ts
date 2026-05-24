/** Phase-8E: trait profile aggregator — sequence-level emotional grammar (pure, deterministic) */

import crypto from "crypto";
import type {
  CinematicTraitId,
  CinematicTraitProfile,
} from "./cinematic-traits.types.ts";
import { CINEMATIC_TRAIT_IDS, VIDEO_INTELLIGENCE_LAYER_VERSION } from "./cinematic-traits.types.ts";

export type AggregatedTraitProfileVersion = "v1";

export type AggregatedTraitWeight = {
  readonly traitId: CinematicTraitId;
  readonly score: number;
};

export type DominantTraitEntry = {
  readonly rank: number;
  readonly traitId: CinematicTraitId;
  readonly score: number;
};

export type EmotionalRhythmSignature = {
  readonly warmthArc: number;
  readonly nostalgicArc: number;
  readonly distanceArc: number;
  readonly silenceArc: number;
};

export type PacingSignature = {
  readonly slowBreathingCut: number;
  readonly motionStillness: number;
  readonly editorialCalm: number;
};

export type AggregatedTraitProfile = {
  readonly version: AggregatedTraitProfileVersion;
  readonly aggregateTraits: readonly AggregatedTraitWeight[];
  readonly dominantTraits: readonly DominantTraitEntry[];
  readonly emotionalRhythm: EmotionalRhythmSignature;
  readonly pacingSignature: PacingSignature;
};

export const AGGREGATED_TRAIT_PROFILE_VERSION: AggregatedTraitProfileVersion = "v1";
export const DOMINANT_TRAIT_TOP_N = 3;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function buildAggregatedWeight(traitId: CinematicTraitId, score: number): AggregatedTraitWeight {
  return Object.freeze({
    traitId,
    score: clampScore(score),
  });
}

function collectTraitScores(profiles: readonly CinematicTraitProfile[]): Map<CinematicTraitId, number[]> {
  const buckets = new Map<CinematicTraitId, number[]>();

  for (const traitId of CINEMATIC_TRAIT_IDS) {
    buckets.set(traitId, []);
  }

  for (const profile of profiles) {
    for (const trait of profile.traits) {
      buckets.get(trait.traitId)?.push(trait.weight);
    }
  }

  return buckets;
}

function averageScores(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return clampScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function resolveAggregateTraits(profiles: readonly CinematicTraitProfile[]): readonly AggregatedTraitWeight[] {
  const buckets = collectTraitScores(profiles);

  return Object.freeze(
    [...CINEMATIC_TRAIT_IDS]
      .sort((a, b) => a.localeCompare(b))
      .map((traitId) => buildAggregatedWeight(traitId, averageScores(buckets.get(traitId) ?? [])))
  );
}

function resolveDominantTraits(
  aggregateTraits: readonly AggregatedTraitWeight[]
): readonly DominantTraitEntry[] {
  const ranked = [...aggregateTraits].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.traitId.localeCompare(b.traitId);
  });

  return Object.freeze(
    ranked.slice(0, DOMINANT_TRAIT_TOP_N).map((trait, index) =>
      Object.freeze({
        rank: index + 1,
        traitId: trait.traitId,
        score: trait.score,
      })
    )
  );
}

function lookupAggregateScore(
  aggregateTraits: readonly AggregatedTraitWeight[],
  traitId: CinematicTraitId
): number {
  return aggregateTraits.find((trait) => trait.traitId === traitId)?.score ?? 0;
}

function resolveEmotionalRhythm(
  aggregateTraits: readonly AggregatedTraitWeight[]
): EmotionalRhythmSignature {
  return Object.freeze({
    warmthArc: lookupAggregateScore(aggregateTraits, "warmth"),
    nostalgicArc: lookupAggregateScore(aggregateTraits, "nostalgic-light"),
    distanceArc: lookupAggregateScore(aggregateTraits, "emotional-distance"),
    silenceArc: lookupAggregateScore(aggregateTraits, "peaceful-silence"),
  });
}

function resolvePacingSignature(
  aggregateTraits: readonly AggregatedTraitWeight[]
): PacingSignature {
  const slowBreathingCut = lookupAggregateScore(aggregateTraits, "slow-breathing-cut");
  const motionStillness = lookupAggregateScore(aggregateTraits, "peaceful-silence");
  const editorialCalm = averageScores([slowBreathingCut, motionStillness]);

  return Object.freeze({
    slowBreathingCut,
    motionStillness,
    editorialCalm,
  });
}

export function aggregateTraitProfiles(
  profiles: readonly CinematicTraitProfile[]
): AggregatedTraitProfile {
  const aggregateTraits = resolveAggregateTraits(profiles);
  const dominantTraits = resolveDominantTraits(aggregateTraits);

  return Object.freeze({
    version: AGGREGATED_TRAIT_PROFILE_VERSION,
    aggregateTraits,
    dominantTraits,
    emotionalRhythm: resolveEmotionalRhythm(aggregateTraits),
    pacingSignature: resolvePacingSignature(aggregateTraits),
  });
}

export const AGGREGATED_TRAIT_WEIGHT_KEY_ORDER = Object.freeze(["traitId", "score"] as const);
export const DOMINANT_TRAIT_ENTRY_KEY_ORDER = Object.freeze(["rank", "traitId", "score"] as const);

export function serializeAggregatedTraitProfile(profile: AggregatedTraitProfile): string {
  const orderedAggregateTraits = [...profile.aggregateTraits]
    .sort((a, b) => a.traitId.localeCompare(b.traitId))
    .map((trait) => Object.freeze({ traitId: trait.traitId, score: trait.score }));

  const orderedDominantTraits = [...profile.dominantTraits]
    .sort((a, b) => a.rank - b.rank)
    .map((trait) => Object.freeze({ rank: trait.rank, traitId: trait.traitId, score: trait.score }));

  return JSON.stringify({
    version: profile.version,
    aggregateTraits: orderedAggregateTraits,
    dominantTraits: orderedDominantTraits,
    emotionalRhythm: profile.emotionalRhythm,
    pacingSignature: profile.pacingSignature,
  });
}

export function computeAggregatedTraitProfileFingerprint(profile: AggregatedTraitProfile): string {
  return crypto.createHash("sha256").update(serializeAggregatedTraitProfile(profile)).digest("hex");
}

export function assertAggregatedTraitProfileScoresInRange(profile: AggregatedTraitProfile): boolean {
  const aggregateValid = profile.aggregateTraits.every(
    (trait) => trait.score >= 0 && trait.score <= 1
  );
  const dominantValid = profile.dominantTraits.every(
    (trait) => trait.score >= 0 && trait.score <= 1
  );
  const rhythmValid = Object.values(profile.emotionalRhythm).every(
    (value) => value >= 0 && value <= 1
  );
  const pacingValid = Object.values(profile.pacingSignature).every(
    (value) => value >= 0 && value <= 1
  );

  return aggregateValid && dominantValid && rhythmValid && pacingValid;
}
