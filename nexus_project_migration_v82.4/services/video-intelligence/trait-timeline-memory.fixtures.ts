import { aggregateTraitProfiles } from "./trait-profile-aggregator.ts";
import { TRAIT_PROFILE_AGGREGATOR_INPUT_EXAMPLE } from "./trait-profile-aggregator.fixtures.ts";
import { buildTraitTimelineMemory } from "./trait-timeline-memory.ts";

const SEQUENCE_A_PROFILE = aggregateTraitProfiles([TRAIT_PROFILE_AGGREGATOR_INPUT_EXAMPLE[0]]);
const SEQUENCE_B_PROFILE = aggregateTraitProfiles([
  TRAIT_PROFILE_AGGREGATOR_INPUT_EXAMPLE[1],
  TRAIT_PROFILE_AGGREGATOR_INPUT_EXAMPLE[2],
]);
const SEQUENCE_C_PROFILE = aggregateTraitProfiles(TRAIT_PROFILE_AGGREGATOR_INPUT_EXAMPLE);

export const TRAIT_TIMELINE_MEMORY_INPUT_EXAMPLE = Object.freeze([
  SEQUENCE_A_PROFILE,
  SEQUENCE_B_PROFILE,
  SEQUENCE_C_PROFILE,
]);

export const TRAIT_TIMELINE_MEMORY_OUTPUT_EXAMPLE = buildTraitTimelineMemory(
  TRAIT_TIMELINE_MEMORY_INPUT_EXAMPLE
);

export const TRAIT_TIMELINE_MEMORY_NODE_EXAMPLE = Object.freeze({
  memoryNodeId: "memory-001",
  sequenceId: "sequence-001",
  sequenceIndex: 0,
  dominantTraitId: "domestic-composition" as const,
  continuityScore: 1,
});
