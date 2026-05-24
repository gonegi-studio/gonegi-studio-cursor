/** Phase-8G: trait timeline memory — sequence-to-timeline continuity (pure, deterministic) */

import crypto from "crypto";
import type {
  AggregatedTraitProfile,
  EmotionalRhythmSignature,
  PacingSignature,
} from "./trait-profile-aggregator.ts";
import type { CinematicTraitId } from "./cinematic-traits.types.ts";

export type TraitTimelineMemoryVersion = "v1";

export type TraitTimelineMemoryNode = {
  readonly memoryNodeId: string;
  readonly sequenceId: string;
  readonly sequenceIndex: number;
  readonly dominantTraitId: CinematicTraitId;
  readonly continuityScore: number;
  readonly emotionalRhythm: EmotionalRhythmSignature;
  readonly pacingSignature: PacingSignature;
};

export type TraitTimelineContinuitySegment = {
  readonly fromMemoryNodeId: string;
  readonly toMemoryNodeId: string;
  readonly score: number;
};

export type TraitTimelineContinuityCurve = {
  readonly nodeCount: number;
  readonly segmentContinuity: readonly TraitTimelineContinuitySegment[];
  readonly overallContinuity: number;
};

export type TraitTimelineEmotionalResidue = {
  readonly warmthResidue: number;
  readonly nostalgicResidue: number;
  readonly distanceResidue: number;
  readonly silenceResidue: number;
  readonly carryoverStrength: number;
};

export type TraitTimelinePacingContinuity = {
  readonly slowBreathingContinuity: number;
  readonly editorialContinuity: number;
  readonly segmentPacingContinuity: number;
};

export type TraitTimelineMemory = {
  readonly version: TraitTimelineMemoryVersion;
  readonly memoryNodes: readonly TraitTimelineMemoryNode[];
  readonly continuityCurve: TraitTimelineContinuityCurve;
  readonly emotionalResidue: TraitTimelineEmotionalResidue;
  readonly pacingContinuity: TraitTimelinePacingContinuity;
};

export const TRAIT_TIMELINE_MEMORY_VERSION: TraitTimelineMemoryVersion = "v1";

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function averageScores(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return clampScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildMemoryNodeId(index: number): string {
  return `memory-${String(index + 1).padStart(3, "0")}`;
}

function buildSequenceId(index: number): string {
  return `sequence-${String(index + 1).padStart(3, "0")}`;
}

function resolveRhythmDelta(
  left: EmotionalRhythmSignature,
  right: EmotionalRhythmSignature
): number {
  return averageScores([
    Math.abs(left.warmthArc - right.warmthArc),
    Math.abs(left.nostalgicArc - right.nostalgicArc),
    Math.abs(left.distanceArc - right.distanceArc),
    Math.abs(left.silenceArc - right.silenceArc),
  ]);
}

function resolvePacingDelta(left: PacingSignature, right: PacingSignature): number {
  return averageScores([
    Math.abs(left.slowBreathingCut - right.slowBreathingCut),
    Math.abs(left.motionStillness - right.motionStillness),
    Math.abs(left.editorialCalm - right.editorialCalm),
  ]);
}

function resolveDominantDelta(left: AggregatedTraitProfile, right: AggregatedTraitProfile): number {
  const leftDominant = left.dominantTraits[0]?.score ?? 0;
  const rightDominant = right.dominantTraits[0]?.score ?? 0;
  const leftTrait = left.dominantTraits[0]?.traitId ?? "";
  const rightTrait = right.dominantTraits[0]?.traitId ?? "";
  const traitMismatch = leftTrait === rightTrait ? 0 : 0.15;
  return clampScore(Math.abs(leftDominant - rightDominant) + traitMismatch);
}

function resolveSegmentContinuity(
  left: AggregatedTraitProfile,
  right: AggregatedTraitProfile
): number {
  const blend = averageScores([
    resolveDominantDelta(left, right),
    resolveRhythmDelta(left.emotionalRhythm, right.emotionalRhythm),
    resolvePacingDelta(left.pacingSignature, right.pacingSignature),
  ]);
  return clampScore(1 - blend);
}

function resolveMemoryNodeContinuity(
  profile: AggregatedTraitProfile,
  previous: AggregatedTraitProfile | null
): number {
  if (!previous) {
    return 1;
  }
  return resolveSegmentContinuity(previous, profile);
}

function buildMemoryNode(
  profile: AggregatedTraitProfile,
  index: number,
  previous: AggregatedTraitProfile | null
): TraitTimelineMemoryNode {
  return Object.freeze({
    memoryNodeId: buildMemoryNodeId(index),
    sequenceId: buildSequenceId(index),
    sequenceIndex: index,
    dominantTraitId: profile.dominantTraits[0]?.traitId ?? "warmth",
    continuityScore: resolveMemoryNodeContinuity(profile, previous),
    emotionalRhythm: profile.emotionalRhythm,
    pacingSignature: profile.pacingSignature,
  });
}

function resolveContinuityCurve(
  profiles: readonly AggregatedTraitProfile[],
  memoryNodes: readonly TraitTimelineMemoryNode[]
): TraitTimelineContinuityCurve {
  const segmentContinuity = profiles.slice(1).map((profile, index) => {
    const previous = profiles[index];
    return Object.freeze({
      fromMemoryNodeId: memoryNodes[index].memoryNodeId,
      toMemoryNodeId: memoryNodes[index + 1].memoryNodeId,
      score: resolveSegmentContinuity(previous, profile),
    });
  });

  return Object.freeze({
    nodeCount: memoryNodes.length,
    segmentContinuity: Object.freeze(segmentContinuity),
    overallContinuity: averageScores(segmentContinuity.map((segment) => segment.score)),
  });
}

function resolveWeightedResidue(
  profiles: readonly AggregatedTraitProfile[],
  selector: (profile: AggregatedTraitProfile) => number
): number {
  if (profiles.length === 0) {
    return 0;
  }

  let weightedSum = 0;
  let weightTotal = 0;

  profiles.forEach((profile, index) => {
    const weight = index + 1;
    weightedSum += selector(profile) * weight;
    weightTotal += weight;
  });

  return clampScore(weightedSum / weightTotal);
}

function resolveEmotionalResidue(
  profiles: readonly AggregatedTraitProfile[],
  overallContinuity: number
): TraitTimelineEmotionalResidue {
  return Object.freeze({
    warmthResidue: resolveWeightedResidue(profiles, (profile) => profile.emotionalRhythm.warmthArc),
    nostalgicResidue: resolveWeightedResidue(
      profiles,
      (profile) => profile.emotionalRhythm.nostalgicArc
    ),
    distanceResidue: resolveWeightedResidue(
      profiles,
      (profile) => profile.emotionalRhythm.distanceArc
    ),
    silenceResidue: resolveWeightedResidue(
      profiles,
      (profile) => profile.emotionalRhythm.silenceArc
    ),
    carryoverStrength: clampScore(overallContinuity),
  });
}

function resolvePacingContinuity(
  profiles: readonly AggregatedTraitProfile[],
  continuityCurve: TraitTimelineContinuityCurve
): TraitTimelinePacingContinuity {
  const pacingSegments = continuityCurve.segmentContinuity.map((segment, index) => {
    const left = profiles[index];
    const right = profiles[index + 1];
    return clampScore(1 - resolvePacingDelta(left.pacingSignature, right.pacingSignature));
  });

  return Object.freeze({
    slowBreathingContinuity: resolveWeightedResidue(
      profiles,
      (profile) => profile.pacingSignature.slowBreathingCut
    ),
    editorialContinuity: resolveWeightedResidue(
      profiles,
      (profile) => profile.pacingSignature.editorialCalm
    ),
    segmentPacingContinuity: averageScores(pacingSegments),
  });
}

export function buildTraitTimelineMemory(
  profiles: readonly AggregatedTraitProfile[]
): TraitTimelineMemory {
  const orderedProfiles = Object.freeze([...profiles]);
  const memoryNodes = Object.freeze(
    orderedProfiles.map((profile, index) =>
      buildMemoryNode(profile, index, index > 0 ? orderedProfiles[index - 1] : null)
    )
  );

  const continuityCurve = resolveContinuityCurve(orderedProfiles, memoryNodes);
  const emotionalResidue = resolveEmotionalResidue(orderedProfiles, continuityCurve.overallContinuity);
  const pacingContinuity = resolvePacingContinuity(orderedProfiles, continuityCurve);

  return Object.freeze({
    version: TRAIT_TIMELINE_MEMORY_VERSION,
    memoryNodes,
    continuityCurve,
    emotionalResidue,
    pacingContinuity,
  });
}

export function serializeTraitTimelineMemory(memory: TraitTimelineMemory): string {
  return JSON.stringify({
    version: memory.version,
    memoryNodes: memory.memoryNodes,
    continuityCurve: memory.continuityCurve,
    emotionalResidue: memory.emotionalResidue,
    pacingContinuity: memory.pacingContinuity,
  });
}

export function computeTraitTimelineMemoryFingerprint(memory: TraitTimelineMemory): string {
  return crypto.createHash("sha256").update(serializeTraitTimelineMemory(memory)).digest("hex");
}

export function assertTraitTimelineMemoryScoresInRange(memory: TraitTimelineMemory): boolean {
  const nodeValid = memory.memoryNodes.every(
    (node) => node.continuityScore >= 0 && node.continuityScore <= 1
  );
  const segmentValid = memory.continuityCurve.segmentContinuity.every(
    (segment) => segment.score >= 0 && segment.score <= 1
  );
  const overallValid =
    memory.continuityCurve.overallContinuity >= 0 && memory.continuityCurve.overallContinuity <= 1;
  const residueValid = Object.values(memory.emotionalResidue).every(
    (value) => value >= 0 && value <= 1
  );
  const pacingValid = Object.values(memory.pacingContinuity).every(
    (value) => value >= 0 && value <= 1
  );

  return nodeValid && segmentValid && overallValid && residueValid && pacingValid;
}
