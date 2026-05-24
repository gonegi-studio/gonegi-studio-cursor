import { mapLegacyV826ToTraitProfile } from "./legacy-v826-trait-mapper.ts";
import type { LegacyV826ShotLike } from "./legacy-v826-trait-mapper.ts";

/** Fixture-only legacy slice — no movieTitle / source_material fields */
export const LEGACY_V826_INPUT_EXAMPLE: LegacyV826ShotLike = Object.freeze({
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

export const LEGACY_V826_OUTPUT_EXAMPLE = mapLegacyV826ToTraitProfile(LEGACY_V826_INPUT_EXAMPLE);

export const LEGACY_V826_TRAIT_SCORE_EXAMPLE = Object.freeze({
  traitId: "warmth" as const,
  weight: 0.665,
});
