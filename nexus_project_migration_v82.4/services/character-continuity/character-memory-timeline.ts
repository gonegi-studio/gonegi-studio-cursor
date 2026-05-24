/** Phase-9C: character memory timeline — sequence-level identity persistence (pure, deterministic) */

import crypto from "crypto";
import type {
  CharacterIdentityProfile,
  CharacterVisualAnchor,
  EmotionContinuityHint,
  PoseContinuityHint,
  StyleDriftSuppressionPolicy,
} from "./character-identity.types.ts";
import { CHARACTER_CONTINUITY_LAYER_VERSION } from "./character-identity.types.ts";
import { resolveLockPriority } from "./identity-lock-policy.ts";

export type CharacterMemoryTimelineVersion = "v1";

export type CharacterMemoryFrame = {
  readonly frameId: string;
  readonly frameIndex: number;
  readonly characterId: string;
  readonly anchorIds: readonly string[];
  readonly continuityScore: number;
  readonly identityScore: number;
  readonly emotionalScore: number;
  readonly poseScore: number;
  readonly styleScore: number;
};

export type CharacterMemoryIdentityPersistence = {
  readonly frameCount: number;
  readonly anchorConsistency: number;
  readonly lockStrictness: number;
  readonly overallPersistence: number;
};

export type CharacterMemoryEmotionalCarryover = {
  readonly baselineEmotion: string;
  readonly carryoverStrength: number;
  readonly sceneEmotionInfluence: number;
  readonly persistenceScore: number;
};

export type CharacterMemoryPoseContinuity = {
  readonly poseFamilyContinuity: number;
  readonly postureContinuity: number;
  readonly segmentContinuity: number;
};

export type CharacterMemoryStyleDriftResistance = {
  readonly paletteStability: number;
  readonly lineWeightStability: number;
  readonly lightingStability: number;
  readonly overallResistance: number;
};

export type CharacterMemoryTimeline = {
  readonly version: CharacterMemoryTimelineVersion;
  readonly memoryFrames: readonly CharacterMemoryFrame[];
  readonly identityPersistence: CharacterMemoryIdentityPersistence;
  readonly emotionalCarryover: CharacterMemoryEmotionalCarryover;
  readonly poseContinuity: CharacterMemoryPoseContinuity;
  readonly styleDriftResistance: CharacterMemoryStyleDriftResistance;
};

export const CHARACTER_MEMORY_TIMELINE_VERSION: CharacterMemoryTimelineVersion = "v1";

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

function buildFrameId(index: number): string {
  return `frame-${String(index + 1).padStart(3, "0")}`;
}

function resolveAnchorIds(anchors: readonly CharacterVisualAnchor[]): readonly string[] {
  return Object.freeze(anchors.map((anchor) => anchor.anchorId));
}

function resolveAnchorOverlap(
  left: readonly CharacterVisualAnchor[],
  right: readonly CharacterVisualAnchor[]
): number {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftTokens = new Set(left.flatMap((anchor) => [...anchor.descriptorTokens]));
  const rightTokens = new Set(right.flatMap((anchor) => [...anchor.descriptorTokens]));
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  const unionSize = new Set([...leftTokens, ...rightTokens]).size;
  return clampScore(unionSize === 0 ? 1 : overlap / unionSize);
}

function resolveIdentityDelta(left: CharacterIdentityProfile, right: CharacterIdentityProfile): number {
  if (left.characterId !== right.characterId) {
    return 1;
  }

  const anchorMismatch =
    left.visualAnchors.length === right.visualAnchors.length
      ? 0
      : clampScore(Math.abs(left.visualAnchors.length - right.visualAnchors.length) * 0.1);
  const tokenDrift = clampScore(1 - resolveAnchorOverlap(left.visualAnchors, right.visualAnchors));
  const strictnessDelta = clampScore(
    Math.abs(left.continuityLock.strictness - right.continuityLock.strictness)
  );

  return clampScore(averageScores([anchorMismatch, tokenDrift, strictnessDelta]));
}

function resolvePoseDelta(left: PoseContinuityHint, right: PoseContinuityHint): number {
  const familyMismatch = left.poseFamily === right.poseFamily ? 0 : 0.2;
  const postureMismatch = left.anchorPosture === right.anchorPosture ? 0 : 0.12;
  const toleranceDelta = clampScore(Math.abs(left.driftTolerance - right.driftTolerance));
  return clampScore(averageScores([familyMismatch, postureMismatch, toleranceDelta]));
}

function resolveEmotionDelta(left: EmotionContinuityHint, right: EmotionContinuityHint): number {
  const baselineMismatch = left.baselineEmotion === right.baselineEmotion ? 0 : 0.18;
  const driftDelta = clampScore(Math.abs(left.allowedDriftRange - right.allowedDriftRange));
  const capDelta = clampScore(Math.abs(left.sceneEmotionCap - right.sceneEmotionCap));
  return clampScore(averageScores([baselineMismatch, driftDelta, capDelta]));
}

function resolveStyleDelta(
  left: StyleDriftSuppressionPolicy,
  right: StyleDriftSuppressionPolicy
): number {
  return averageScores([
    clampScore(Math.abs(left.maxPaletteDrift - right.maxPaletteDrift)),
    clampScore(Math.abs(left.maxLineWeightDrift - right.maxLineWeightDrift)),
    clampScore(Math.abs(left.maxLightingDrift - right.maxLightingDrift)),
    clampScore(Math.abs(left.suppressionStrength - right.suppressionStrength)),
  ]);
}

function resolveFrameContinuity(
  left: CharacterIdentityProfile,
  right: CharacterIdentityProfile
): number {
  const identityWeight = resolveLockPriority("identity");
  const poseWeight = resolveLockPriority("pose");
  const emotionWeight = resolveLockPriority("emotion");
  const styleWeight = resolveLockPriority("style");
  const weightTotal = identityWeight + poseWeight + emotionWeight + styleWeight;

  const identityDelta = resolveIdentityDelta(left, right);
  const poseDelta = resolvePoseDelta(left.poseHint, right.poseHint);
  const emotionDelta = resolveEmotionDelta(left.emotionHint, right.emotionHint);
  const styleDelta = resolveStyleDelta(left.styleDriftPolicy, right.styleDriftPolicy);

  const weightedDelta =
    (identityDelta * identityWeight +
      poseDelta * poseWeight +
      emotionDelta * emotionWeight +
      styleDelta * styleWeight) /
    weightTotal;

  return clampScore(1 - weightedDelta);
}

function resolveFrameScores(
  profile: CharacterIdentityProfile,
  previous: CharacterIdentityProfile | null
): {
  continuityScore: number;
  identityScore: number;
  emotionalScore: number;
  poseScore: number;
  styleScore: number;
} {
  if (!previous) {
    return {
      continuityScore: 1,
      identityScore: clampScore(profile.continuityLock.strictness),
      emotionalScore: clampScore(profile.emotionHint.continuityWeight),
      poseScore: clampScore(profile.poseHint.continuityWeight),
      styleScore: clampScore(profile.styleDriftPolicy.suppressionStrength),
    };
  }

  const continuityScore = resolveFrameContinuity(previous, profile);
  const identityScore = clampScore(1 - resolveIdentityDelta(previous, profile));
  const emotionalScore = clampScore(1 - resolveEmotionDelta(previous.emotionHint, profile.emotionHint));
  const poseScore = clampScore(1 - resolvePoseDelta(previous.poseHint, profile.poseHint));
  const styleScore = clampScore(1 - resolveStyleDelta(previous.styleDriftPolicy, profile.styleDriftPolicy));

  return { continuityScore, identityScore, emotionalScore, poseScore, styleScore };
}

function buildMemoryFrame(
  profile: CharacterIdentityProfile,
  index: number,
  previous: CharacterIdentityProfile | null
): CharacterMemoryFrame {
  const scores = resolveFrameScores(profile, previous);

  return Object.freeze({
    frameId: buildFrameId(index),
    frameIndex: index,
    characterId: profile.characterId,
    anchorIds: resolveAnchorIds(profile.visualAnchors),
    continuityScore: scores.continuityScore,
    identityScore: scores.identityScore,
    emotionalScore: scores.emotionalScore,
    poseScore: scores.poseScore,
    styleScore: scores.styleScore,
  });
}

function resolveWeightedSignal(
  profiles: readonly CharacterIdentityProfile[],
  selector: (profile: CharacterIdentityProfile) => number
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

function resolveIdentityPersistence(
  profiles: readonly CharacterIdentityProfile[],
  memoryFrames: readonly CharacterMemoryFrame[]
): CharacterMemoryIdentityPersistence {
  const anchorPairs = profiles.slice(1).map((profile, index) =>
    resolveAnchorOverlap(profiles[index].visualAnchors, profile.visualAnchors)
  );

  return Object.freeze({
    frameCount: memoryFrames.length,
    anchorConsistency: averageScores(anchorPairs.length > 0 ? anchorPairs : [1]),
    lockStrictness: resolveWeightedSignal(profiles, (profile) => profile.continuityLock.strictness),
    overallPersistence: averageScores(memoryFrames.map((frame) => frame.identityScore)),
  });
}

function resolveEmotionalCarryover(
  profiles: readonly CharacterIdentityProfile[],
  memoryFrames: readonly CharacterMemoryFrame[]
): CharacterMemoryEmotionalCarryover {
  const leadProfile = profiles[0];
  const sceneInfluenceCap = leadProfile?.emotionHint.sceneEmotionCap ?? 0;
  const overridesSceneEmotion = leadProfile?.continuityLock.overridesSceneEmotion ?? true;
  const rawInfluence = profiles.slice(1).map((profile, index) =>
    resolveEmotionDelta(profiles[index].emotionHint, profile.emotionHint)
  );
  const sceneEmotionInfluence = overridesSceneEmotion
    ? clampScore(Math.min(sceneInfluenceCap, averageScores(rawInfluence)))
    : clampScore(averageScores(rawInfluence));

  return Object.freeze({
    baselineEmotion: leadProfile?.emotionHint.baselineEmotion ?? "",
    carryoverStrength: resolveWeightedSignal(
      profiles,
      (profile) => profile.emotionHint.continuityWeight
    ),
    sceneEmotionInfluence,
    persistenceScore: averageScores(memoryFrames.map((frame) => frame.emotionalScore)),
  });
}

function resolvePoseContinuity(
  profiles: readonly CharacterIdentityProfile[],
  memoryFrames: readonly CharacterMemoryFrame[]
): CharacterMemoryPoseContinuity {
  const segmentScores = profiles.slice(1).map((profile, index) =>
    clampScore(1 - resolvePoseDelta(profiles[index].poseHint, profile.poseHint))
  );

  return Object.freeze({
    poseFamilyContinuity: resolveWeightedSignal(
      profiles,
      (profile) => (profile.poseHint.poseFamily ? 1 : 0)
    ),
    postureContinuity: resolveWeightedSignal(
      profiles,
      (profile) => profile.poseHint.continuityWeight
    ),
    segmentContinuity: averageScores(segmentScores.length > 0 ? segmentScores : [1]),
  });
}

function resolveStyleDriftResistance(
  profiles: readonly CharacterIdentityProfile[]
): CharacterMemoryStyleDriftResistance {
  const leadPolicy = profiles[0]?.styleDriftPolicy;
  const paletteStability = clampScore(1 - (leadPolicy?.maxPaletteDrift ?? 0));
  const lineWeightStability = clampScore(1 - (leadPolicy?.maxLineWeightDrift ?? 0));
  const lightingStability = clampScore(1 - (leadPolicy?.maxLightingDrift ?? 0));

  const segmentResistance = profiles.slice(1).map((profile, index) =>
    clampScore(1 - resolveStyleDelta(profiles[index].styleDriftPolicy, profile.styleDriftPolicy))
  );

  return Object.freeze({
    paletteStability,
    lineWeightStability,
    lightingStability,
    overallResistance: averageScores([
      paletteStability,
      lineWeightStability,
      lightingStability,
      averageScores(segmentResistance.length > 0 ? segmentResistance : [1]),
    ]),
  });
}

export function buildCharacterMemoryTimeline(
  profiles: readonly CharacterIdentityProfile[]
): CharacterMemoryTimeline {
  const orderedProfiles = Object.freeze([...profiles]);
  const memoryFrames = Object.freeze(
    orderedProfiles.map((profile, index) =>
      buildMemoryFrame(profile, index, index > 0 ? orderedProfiles[index - 1] : null)
    )
  );

  return Object.freeze({
    version: CHARACTER_MEMORY_TIMELINE_VERSION,
    memoryFrames,
    identityPersistence: resolveIdentityPersistence(orderedProfiles, memoryFrames),
    emotionalCarryover: resolveEmotionalCarryover(orderedProfiles, memoryFrames),
    poseContinuity: resolvePoseContinuity(orderedProfiles, memoryFrames),
    styleDriftResistance: resolveStyleDriftResistance(orderedProfiles),
  });
}

export function serializeCharacterMemoryTimeline(timeline: CharacterMemoryTimeline): string {
  return JSON.stringify({
    version: timeline.version,
    memoryFrames: timeline.memoryFrames,
    identityPersistence: timeline.identityPersistence,
    emotionalCarryover: timeline.emotionalCarryover,
    poseContinuity: timeline.poseContinuity,
    styleDriftResistance: timeline.styleDriftResistance,
  });
}

export function computeCharacterMemoryTimelineFingerprint(timeline: CharacterMemoryTimeline): string {
  return crypto.createHash("sha256").update(serializeCharacterMemoryTimeline(timeline)).digest("hex");
}

export function assertCharacterMemoryTimelineScoresInRange(timeline: CharacterMemoryTimeline): boolean {
  const frameValid = timeline.memoryFrames.every(
    (frame) =>
      frame.continuityScore >= 0 &&
      frame.continuityScore <= 1 &&
      frame.identityScore >= 0 &&
      frame.identityScore <= 1 &&
      frame.emotionalScore >= 0 &&
      frame.emotionalScore <= 1 &&
      frame.poseScore >= 0 &&
      frame.poseScore <= 1 &&
      frame.styleScore >= 0 &&
      frame.styleScore <= 1
  );

  const { identityPersistence, emotionalCarryover } = timeline;
  const identityValid =
    identityPersistence.frameCount >= 0 &&
    identityPersistence.anchorConsistency >= 0 &&
    identityPersistence.anchorConsistency <= 1 &&
    identityPersistence.lockStrictness >= 0 &&
    identityPersistence.lockStrictness <= 1 &&
    identityPersistence.overallPersistence >= 0 &&
    identityPersistence.overallPersistence <= 1;
  const emotionalValid =
    emotionalCarryover.carryoverStrength >= 0 &&
    emotionalCarryover.carryoverStrength <= 1 &&
    emotionalCarryover.sceneEmotionInfluence >= 0 &&
    emotionalCarryover.sceneEmotionInfluence <= 1 &&
    emotionalCarryover.persistenceScore >= 0 &&
    emotionalCarryover.persistenceScore <= 1;
  const poseValid = Object.values(timeline.poseContinuity).every(
    (value) => value >= 0 && value <= 1
  );
  const styleValid = Object.values(timeline.styleDriftResistance).every(
    (value) => value >= 0 && value <= 1
  );

  return frameValid && identityValid && emotionalValid && poseValid && styleValid;
}
