import { mapLegacyV826ToTraitProfile } from "./legacy-v826-trait-mapper.ts";
import type { LegacyV826ShotLike } from "./legacy-v826-trait-mapper.ts";
import { aggregateTraitProfiles } from "./trait-profile-aggregator.ts";

const LEGACY_V826_SHOT_A: LegacyV826ShotLike = Object.freeze({
  shotId: "shot-001",
  physics: Object.freeze({
    luminance_balance: 0.72,
    chroma_intensity: 0.28,
    motion_density: 0.14,
  }),
  emotion: Object.freeze({
    valence_bias: 0.68,
    isolation_score: 0.42,
    emotional_distance: 0.38,
  }),
  temporal: Object.freeze({
    rhythm_pressure: 0.22,
    avg_shot_duration: 8.5,
  }),
  optics: Object.freeze({
    halation_response: 0.61,
  }),
  composition: Object.freeze({
    negative_space_ratio: 0.58,
    spatial_honesty: 0.74,
  }),
});

const LEGACY_V826_SHOT_B: LegacyV826ShotLike = Object.freeze({
  shotId: "shot-002",
  physics: Object.freeze({
    luminance_balance: 0.64,
    chroma_intensity: 0.34,
    motion_density: 0.2,
  }),
  emotion: Object.freeze({
    valence_bias: 0.54,
    isolation_score: 0.56,
    emotional_distance: 0.48,
  }),
  temporal: Object.freeze({
    rhythm_pressure: 0.31,
    avg_shot_duration: 6.8,
  }),
  optics: Object.freeze({
    halation_response: 0.52,
  }),
  composition: Object.freeze({
    negative_space_ratio: 0.62,
    spatial_honesty: 0.69,
  }),
});

const LEGACY_V826_SHOT_C: LegacyV826ShotLike = Object.freeze({
  shotId: "shot-003",
  physics: Object.freeze({
    luminance_balance: 0.78,
    chroma_intensity: 0.24,
    motion_density: 0.1,
  }),
  emotion: Object.freeze({
    valence_bias: 0.74,
    isolation_score: 0.36,
    emotional_distance: 0.32,
  }),
  temporal: Object.freeze({
    rhythm_pressure: 0.18,
    avg_shot_duration: 9.2,
  }),
  optics: Object.freeze({
    halation_response: 0.67,
  }),
  composition: Object.freeze({
    negative_space_ratio: 0.55,
    spatial_honesty: 0.78,
  }),
});

export const TRAIT_PROFILE_AGGREGATOR_INPUT_EXAMPLE = Object.freeze([
  mapLegacyV826ToTraitProfile(LEGACY_V826_SHOT_A),
  mapLegacyV826ToTraitProfile(LEGACY_V826_SHOT_B),
  mapLegacyV826ToTraitProfile(LEGACY_V826_SHOT_C),
]);

export const TRAIT_PROFILE_AGGREGATOR_OUTPUT_EXAMPLE = aggregateTraitProfiles(
  TRAIT_PROFILE_AGGREGATOR_INPUT_EXAMPLE
);

export const TRAIT_PROFILE_AGGREGATOR_DOMINANT_EXAMPLE = Object.freeze({
  rank: 1,
  traitId: "domestic-composition" as const,
  score: 0.795,
});
