import type { CharacterIdentityProfile } from "./character-identity.types.ts";
import { CHARACTER_CONTINUITY_LAYER_VERSION } from "./character-identity.types.ts";
import {
  CHARACTER_IDENTITY_PROFILE_EXAMPLE,
  EMOTION_CONTINUITY_HINT_EXAMPLE,
  GONEGI_CHARACTER_ID,
  POSE_CONTINUITY_HINT_EXAMPLE,
} from "./character-continuity.fixtures.ts";
import { buildCharacterMemoryTimeline } from "./character-memory-timeline.ts";

const FRAME_A_PROFILE: CharacterIdentityProfile = CHARACTER_IDENTITY_PROFILE_EXAMPLE;

const FRAME_B_PROFILE: CharacterIdentityProfile = Object.freeze({
  version: CHARACTER_CONTINUITY_LAYER_VERSION,
  characterId: GONEGI_CHARACTER_ID,
  displayName: "Gonegi",
  role: "protagonist",
  visualAnchors: CHARACTER_IDENTITY_PROFILE_EXAMPLE.visualAnchors,
  continuityLock: CHARACTER_IDENTITY_PROFILE_EXAMPLE.continuityLock,
  poseHint: Object.freeze({
    poseFamily: "domestic-seated",
    anchorPosture: "relaxed-upright",
    driftTolerance: POSE_CONTINUITY_HINT_EXAMPLE.driftTolerance,
    continuityWeight: POSE_CONTINUITY_HINT_EXAMPLE.continuityWeight,
  }),
  emotionHint: EMOTION_CONTINUITY_HINT_EXAMPLE,
  styleDriftPolicy: CHARACTER_IDENTITY_PROFILE_EXAMPLE.styleDriftPolicy,
});

const FRAME_C_PROFILE: CharacterIdentityProfile = Object.freeze({
  version: CHARACTER_CONTINUITY_LAYER_VERSION,
  characterId: GONEGI_CHARACTER_ID,
  displayName: "Gonegi",
  role: "protagonist",
  visualAnchors: CHARACTER_IDENTITY_PROFILE_EXAMPLE.visualAnchors,
  continuityLock: CHARACTER_IDENTITY_PROFILE_EXAMPLE.continuityLock,
  poseHint: Object.freeze({
    poseFamily: "domestic-seated",
    anchorPosture: "forward-lean",
    driftTolerance: POSE_CONTINUITY_HINT_EXAMPLE.driftTolerance,
    continuityWeight: POSE_CONTINUITY_HINT_EXAMPLE.continuityWeight,
  }),
  emotionHint: Object.freeze({
    baselineEmotion: "gentle-warmth",
    allowedDriftRange: 0.22,
    sceneEmotionCap: EMOTION_CONTINUITY_HINT_EXAMPLE.sceneEmotionCap,
    continuityWeight: EMOTION_CONTINUITY_HINT_EXAMPLE.continuityWeight,
  }),
  styleDriftPolicy: CHARACTER_IDENTITY_PROFILE_EXAMPLE.styleDriftPolicy,
});

export const CHARACTER_MEMORY_TIMELINE_INPUT_EXAMPLE = Object.freeze([
  FRAME_A_PROFILE,
  FRAME_B_PROFILE,
  FRAME_C_PROFILE,
]);

export const CHARACTER_MEMORY_TIMELINE_OUTPUT_EXAMPLE = buildCharacterMemoryTimeline(
  CHARACTER_MEMORY_TIMELINE_INPUT_EXAMPLE
);

export const CHARACTER_MEMORY_FRAME_ORDER_EXPECTED = Object.freeze([
  "frame-001",
  "frame-002",
  "frame-003",
] as const);
