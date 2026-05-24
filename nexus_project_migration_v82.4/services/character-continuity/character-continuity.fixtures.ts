import type {
  CharacterIdentityProfile,
  CharacterVisualAnchor,
  EmotionContinuityHint,
  PoseContinuityHint,
} from "./character-identity.types.ts";
import { CHARACTER_CONTINUITY_LAYER_VERSION } from "./character-identity.types.ts";
import {
  DEFAULT_CHARACTER_CONTINUITY_LOCK,
  DEFAULT_STYLE_DRIFT_SUPPRESSION_POLICY,
  sortVisualAnchorsByPriority,
} from "./identity-lock-policy.ts";

export const GONEGI_CHARACTER_ID = "gonegi-primary";

const GONEGI_VISUAL_ANCHORS_UNSORTED: readonly CharacterVisualAnchor[] = Object.freeze([
  Object.freeze({
    anchorId: "anchor-gonegi-outfit",
    kind: "outfit-signature" as const,
    label: "Signature Apron Layer",
    priority: 3,
    descriptorTokens: Object.freeze(["apron-fold", "warm-cotton", "domestic-tone"] as const),
  }),
  Object.freeze({
    anchorId: "anchor-gonegi-face",
    kind: "face-signature" as const,
    label: "Gonegi Face Geometry",
    priority: 1,
    descriptorTokens: Object.freeze(["soft-jaw", "gentle-eye-ratio", "warm-skin-tone"] as const),
  }),
  Object.freeze({
    anchorId: "anchor-gonegi-hair",
    kind: "hair-signature" as const,
    label: "Hair Volume Signature",
    priority: 2,
    descriptorTokens: Object.freeze(["rounded-bob", "warm-brown", "soft-edge"] as const),
  }),
  Object.freeze({
    anchorId: "anchor-gonegi-silhouette",
    kind: "silhouette" as const,
    label: "Compact Silhouette",
    priority: 4,
    descriptorTokens: Object.freeze(["compact-frame", "rounded-shoulder", "low-center"] as const),
  }),
]);

export const CHARACTER_VISUAL_ANCHORS_EXAMPLE: readonly CharacterVisualAnchor[] =
  sortVisualAnchorsByPriority(GONEGI_VISUAL_ANCHORS_UNSORTED);

export const POSE_CONTINUITY_HINT_EXAMPLE: Readonly<PoseContinuityHint> = Object.freeze({
  poseFamily: "domestic-standing",
  anchorPosture: "relaxed-upright",
  driftTolerance: 0.14,
  continuityWeight: 0.88,
});

export const EMOTION_CONTINUITY_HINT_EXAMPLE: Readonly<EmotionContinuityHint> = Object.freeze({
  baselineEmotion: "gentle-warmth",
  allowedDriftRange: 0.18,
  sceneEmotionCap: 0.35,
  continuityWeight: 0.9,
});

export const CHARACTER_IDENTITY_PROFILE_EXAMPLE: Readonly<CharacterIdentityProfile> = Object.freeze({
  version: CHARACTER_CONTINUITY_LAYER_VERSION,
  characterId: GONEGI_CHARACTER_ID,
  displayName: "Gonegi",
  role: "protagonist",
  visualAnchors: CHARACTER_VISUAL_ANCHORS_EXAMPLE,
  continuityLock: DEFAULT_CHARACTER_CONTINUITY_LOCK,
  poseHint: POSE_CONTINUITY_HINT_EXAMPLE,
  emotionHint: EMOTION_CONTINUITY_HINT_EXAMPLE,
  styleDriftPolicy: DEFAULT_STYLE_DRIFT_SUPPRESSION_POLICY,
});

export const CHARACTER_VISUAL_ANCHOR_ORDER_EXPECTED = Object.freeze([
  "anchor-gonegi-face",
  "anchor-gonegi-hair",
  "anchor-gonegi-outfit",
  "anchor-gonegi-silhouette",
] as const);
