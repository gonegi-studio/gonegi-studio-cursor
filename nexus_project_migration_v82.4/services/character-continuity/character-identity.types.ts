/** Phase-9A: character identity profile — type scaffold only (zero-runtime) */

export type CharacterContinuityLayerVersion = "v1";

export type CharacterId = string;

export type CharacterRole = "protagonist" | "supporting" | "antagonist" | "extra";

export type CharacterAnchorKind =
  | "face-signature"
  | "hair-signature"
  | "outfit-signature"
  | "silhouette"
  | "gaze-pattern";

export type CharacterVisualAnchor = {
  readonly anchorId: string;
  readonly kind: CharacterAnchorKind;
  readonly label: string;
  readonly priority: number;
  readonly descriptorTokens: readonly string[];
};

export type PoseContinuityHint = {
  readonly poseFamily: string;
  readonly anchorPosture: string;
  readonly driftTolerance: number;
  readonly continuityWeight: number;
};

export type EmotionContinuityHint = {
  readonly baselineEmotion: string;
  readonly allowedDriftRange: number;
  readonly sceneEmotionCap: number;
  readonly continuityWeight: number;
};

export type StyleDriftSuppressionPolicy = {
  readonly version: CharacterContinuityLayerVersion;
  readonly maxPaletteDrift: number;
  readonly maxLineWeightDrift: number;
  readonly maxLightingDrift: number;
  readonly suppressionStrength: number;
};

export type CharacterContinuityLockLevel = "identity" | "pose" | "emotion" | "style";

export type CharacterContinuityLock = {
  readonly lockId: string;
  readonly level: CharacterContinuityLockLevel;
  readonly priority: number;
  readonly strictness: number;
  readonly overridesSceneEmotion: boolean;
};

export type CharacterIdentityProfile = {
  readonly version: CharacterContinuityLayerVersion;
  readonly characterId: CharacterId;
  readonly displayName: string;
  readonly role: CharacterRole;
  readonly visualAnchors: readonly CharacterVisualAnchor[];
  readonly continuityLock: CharacterContinuityLock;
  readonly poseHint: PoseContinuityHint;
  readonly emotionHint: EmotionContinuityHint;
  readonly styleDriftPolicy: StyleDriftSuppressionPolicy;
};

export const CHARACTER_CONTINUITY_LAYER_VERSION: CharacterContinuityLayerVersion = "v1";

export const CHARACTER_CONTINUITY_LOCK_LEVELS: readonly CharacterContinuityLockLevel[] = Object.freeze([
  "identity",
  "pose",
  "emotion",
  "style",
]);

export const CHARACTER_CONTINUITY_MODULE_NAMESPACE = Object.freeze({
  layer: "character-continuity",
  version: CHARACTER_CONTINUITY_LAYER_VERSION,
  scope: "identity-persistence" as const,
});
