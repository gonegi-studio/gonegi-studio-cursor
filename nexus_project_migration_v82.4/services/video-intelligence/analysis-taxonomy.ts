/** Phase-8A: analysis taxonomy — trait-centered dataset scaffold (zero-runtime) */

import type {
  CinematicInfluenceSource,
  CinematicTraitCategory,
  CinematicTraitDefinition,
  CinematicTraitId,
} from "./cinematic-traits.types.ts";
import { CINEMATIC_TRAIT_IDS, VIDEO_INTELLIGENCE_LAYER_VERSION } from "./cinematic-traits.types.ts";

export type AnalysisTaxonomyVersion = "v1";

export type AnalysisTaxonomyScope = "cinematic-trait" | "source-mix";

export type AnalysisTaxonomy = {
  readonly version: AnalysisTaxonomyVersion;
  readonly scope: AnalysisTaxonomyScope;
  readonly traitDefinitions: readonly CinematicTraitDefinition[];
  readonly categoryOrder: readonly CinematicTraitCategory[];
};

export const ANALYSIS_TAXONOMY_VERSION: AnalysisTaxonomyVersion = "v1";

export const CINEMATIC_TRAIT_CATEGORY_ORDER: readonly CinematicTraitCategory[] = Object.freeze([
  "lighting",
  "pacing",
  "composition",
  "texture",
  "emotional-tone",
  "atmosphere",
]);

function freezeInfluenceSources(
  sources: readonly CinematicInfluenceSource[]
): readonly CinematicInfluenceSource[] {
  return Object.freeze([...sources]);
}

const TRAIT_DEFINITIONS: readonly CinematicTraitDefinition[] = Object.freeze([
  Object.freeze({
    traitId: "warmth",
    category: "lighting",
    label: "Warmth",
    description: "Soft thermal light bias and gentle highlight roll-off",
    influenceSources: freezeInfluenceSources(["ghibli-grammar", "domestic-cinematic-grammar"]),
  }),
  Object.freeze({
    traitId: "nostalgic-light",
    category: "lighting",
    label: "Nostalgic Light",
    description: "Memory-toned illumination with amber edge bias",
    influenceSources: freezeInfluenceSources(["ghibli-grammar", "shinkai-grammar"]),
  }),
  Object.freeze({
    traitId: "reflective-lighting",
    category: "lighting",
    label: "Reflective Lighting",
    description: "Specular bounce and mirrored light paths in frame",
    influenceSources: freezeInfluenceSources(["shinkai-grammar"]),
  }),
  Object.freeze({
    traitId: "slow-breathing-cut",
    category: "pacing",
    label: "Slow Breathing Cut",
    description: "Extended hold rhythm with minimal editorial pressure",
    influenceSources: freezeInfluenceSources(["ghibli-grammar", "domestic-cinematic-grammar"]),
  }),
  Object.freeze({
    traitId: "environmental-framing",
    category: "composition",
    label: "Environmental Framing",
    description: "Subject nested within lived-in spatial context",
    influenceSources: freezeInfluenceSources(["ghibli-grammar"]),
  }),
  Object.freeze({
    traitId: "domestic-composition",
    category: "composition",
    label: "Domestic Composition",
    description: "Interior geometry and household object anchoring",
    influenceSources: freezeInfluenceSources(["domestic-cinematic-grammar"]),
  }),
  Object.freeze({
    traitId: "watercolor-glaze",
    category: "texture",
    label: "Watercolor Glaze",
    description: "Layered pigment wash with soft edge diffusion",
    influenceSources: freezeInfluenceSources(["ghibli-grammar"]),
  }),
  Object.freeze({
    traitId: "soft-grain",
    category: "texture",
    label: "Soft Grain",
    description: "Fine particulate texture without harsh digital crispness",
    influenceSources: freezeInfluenceSources(["domestic-cinematic-grammar", "shinkai-grammar"]),
  }),
  Object.freeze({
    traitId: "emotional-distance",
    category: "emotional-tone",
    label: "Emotional Distance",
    description: "Restrained proximity between camera empathy and subject",
    influenceSources: freezeInfluenceSources(["domestic-cinematic-grammar"]),
  }),
  Object.freeze({
    traitId: "peaceful-silence",
    category: "atmosphere",
    label: "Peaceful Silence",
    description: "Negative-space stillness and low narrative urgency",
    influenceSources: freezeInfluenceSources(["ghibli-grammar", "domestic-cinematic-grammar"]),
  }),
]);

export const DEFAULT_ANALYSIS_TAXONOMY: Readonly<AnalysisTaxonomy> = Object.freeze({
  version: ANALYSIS_TAXONOMY_VERSION,
  scope: "cinematic-trait",
  traitDefinitions: TRAIT_DEFINITIONS,
  categoryOrder: CINEMATIC_TRAIT_CATEGORY_ORDER,
});

export function listTraitIdsInTaxonomy(taxonomy: AnalysisTaxonomy): readonly CinematicTraitId[] {
  return Object.freeze(taxonomy.traitDefinitions.map((definition) => definition.traitId));
}

export function assertTaxonomyTraitCoverage(taxonomy: AnalysisTaxonomy): boolean {
  if (taxonomy.traitDefinitions.length !== CINEMATIC_TRAIT_IDS.length) {
    return false;
  }

  const covered = new Set(listTraitIdsInTaxonomy(taxonomy));
  return CINEMATIC_TRAIT_IDS.every((traitId) => covered.has(traitId));
}

export const VIDEO_INTELLIGENCE_TAXONOMY_NAMESPACE = Object.freeze({
  layer: "video-intelligence",
  version: VIDEO_INTELLIGENCE_LAYER_VERSION,
  scope: "cinematic-trait" as const,
});
