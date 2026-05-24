/** Phase-8A: source mix policy — influence grammar weights (zero-runtime) */

import type { CinematicInfluenceSource } from "./cinematic-traits.types.ts";

export type SourceMixPolicyVersion = "v1";

export type SourceMixInfluenceWeights = {
  readonly ghibliInfluence: number;
  readonly shinkaiInfluence: number;
  readonly domesticCinematicInfluence: number;
};

export type SourceMixPolicy = {
  readonly version: SourceMixPolicyVersion;
  readonly weights: SourceMixInfluenceWeights;
  readonly note: string;
};

export type InfluenceSourceBinding = {
  readonly source: CinematicInfluenceSource;
  readonly weightKey: keyof SourceMixInfluenceWeights;
};

export const SOURCE_MIX_POLICY_VERSION: SourceMixPolicyVersion = "v1";

export const SOURCE_MIX_INFLUENCE_BINDINGS: readonly InfluenceSourceBinding[] = Object.freeze([
  Object.freeze({ source: "ghibli-grammar", weightKey: "ghibliInfluence" }),
  Object.freeze({ source: "shinkai-grammar", weightKey: "shinkaiInfluence" }),
  Object.freeze({ source: "domestic-cinematic-grammar", weightKey: "domesticCinematicInfluence" }),
]);

export const DEFAULT_SOURCE_MIX_POLICY: Readonly<SourceMixPolicy> = Object.freeze({
  version: SOURCE_MIX_POLICY_VERSION,
  weights: Object.freeze({
    ghibliInfluence: 70,
    shinkaiInfluence: 20,
    domesticCinematicInfluence: 10,
  }),
  note: "Trait grammar absorption — not movie-title replication",
});

export function resolveSourceMixWeightTotal(policy: SourceMixPolicy): number {
  const { ghibliInfluence, shinkaiInfluence, domesticCinematicInfluence } = policy.weights;
  return ghibliInfluence + shinkaiInfluence + domesticCinematicInfluence;
}
