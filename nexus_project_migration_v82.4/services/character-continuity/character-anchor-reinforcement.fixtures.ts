import { CHARACTER_IDENTITY_PROFILE_EXAMPLE } from "./character-continuity.fixtures.ts";
import { CHARACTER_MEMORY_TIMELINE_OUTPUT_EXAMPLE } from "./character-memory-timeline.fixtures.ts";
import { STYLE_DRIFT_SUPPRESSION_OUTPUT_EXAMPLE } from "./style-drift-suppression.fixtures.ts";
import { buildCharacterAnchorReinforcementReport } from "./character-anchor-reinforcement.ts";

export const CHARACTER_ANCHOR_REINFORCEMENT_PROFILE_EXAMPLE = CHARACTER_IDENTITY_PROFILE_EXAMPLE;

export const CHARACTER_ANCHOR_REINFORCEMENT_TIMELINE_EXAMPLE = CHARACTER_MEMORY_TIMELINE_OUTPUT_EXAMPLE;

export const CHARACTER_ANCHOR_REINFORCEMENT_STYLE_EXAMPLE = STYLE_DRIFT_SUPPRESSION_OUTPUT_EXAMPLE;

export const CHARACTER_ANCHOR_REINFORCEMENT_OUTPUT_EXAMPLE = buildCharacterAnchorReinforcementReport(
  CHARACTER_ANCHOR_REINFORCEMENT_PROFILE_EXAMPLE,
  CHARACTER_ANCHOR_REINFORCEMENT_TIMELINE_EXAMPLE,
  CHARACTER_ANCHOR_REINFORCEMENT_STYLE_EXAMPLE
);

export const CHARACTER_ANCHOR_REINFORCEMENT_ORDER_EXPECTED = Object.freeze([
  "anchor-gonegi-face",
  "anchor-gonegi-hair",
  "anchor-gonegi-outfit",
  "anchor-gonegi-silhouette",
] as const);
