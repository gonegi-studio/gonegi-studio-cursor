/** Phase-8A: cinematic trait dataset scaffold — type layer only (zero-runtime) */

export type VideoIntelligenceLayerVersion = "v1";

export type CinematicTraitId =
  | "warmth"
  | "nostalgic-light"
  | "environmental-framing"
  | "slow-breathing-cut"
  | "watercolor-glaze"
  | "soft-grain"
  | "emotional-distance"
  | "domestic-composition"
  | "reflective-lighting"
  | "peaceful-silence";

export type CinematicTraitCategory =
  | "lighting"
  | "pacing"
  | "composition"
  | "texture"
  | "emotional-tone"
  | "atmosphere";

export type CinematicInfluenceSource =
  | "ghibli-grammar"
  | "shinkai-grammar"
  | "domestic-cinematic-grammar";

export type CinematicTraitDefinition = {
  readonly traitId: CinematicTraitId;
  readonly category: CinematicTraitCategory;
  readonly label: string;
  readonly description: string;
  readonly influenceSources: readonly CinematicInfluenceSource[];
};

export type CinematicTraitWeight = {
  readonly traitId: CinematicTraitId;
  readonly weight: number;
};

export type CinematicTraitProfile = {
  readonly version: VideoIntelligenceLayerVersion;
  readonly traits: readonly CinematicTraitWeight[];
};

export type CinematicTraitDatasetEntry = {
  readonly entryId: string;
  readonly profile: CinematicTraitProfile;
  readonly sourceMixRef: "default";
};

export const VIDEO_INTELLIGENCE_LAYER_VERSION: VideoIntelligenceLayerVersion = "v1";

export const CINEMATIC_TRAIT_IDS: readonly CinematicTraitId[] = Object.freeze([
  "warmth",
  "nostalgic-light",
  "environmental-framing",
  "slow-breathing-cut",
  "watercolor-glaze",
  "soft-grain",
  "emotional-distance",
  "domestic-composition",
  "reflective-lighting",
  "peaceful-silence",
]);
