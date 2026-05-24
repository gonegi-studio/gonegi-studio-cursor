/** Phase-9A: identity lock policy — deterministic priority (zero-runtime) */

import type {
  CharacterContinuityLock,
  CharacterContinuityLockLevel,
  CharacterVisualAnchor,
  StyleDriftSuppressionPolicy,
} from "./character-identity.types.ts";
import { CHARACTER_CONTINUITY_LAYER_VERSION } from "./character-identity.types.ts";

export type IdentityLockPolicyVersion = "v1";

export type LockPriorityEntry = {
  readonly level: CharacterContinuityLockLevel;
  readonly rank: number;
};

export type IdentityLockPolicy = {
  readonly version: IdentityLockPolicyVersion;
  readonly priorityOrder: readonly LockPriorityEntry[];
  readonly principle: string;
};

export const IDENTITY_LOCK_POLICY_VERSION: IdentityLockPolicyVersion = "v1";

export const CHARACTER_CONTINUITY_PRIORITY_PRINCIPLE =
  "character consistency > scene emotion";

export const LOCK_PRIORITY_ORDER: readonly LockPriorityEntry[] = Object.freeze([
  Object.freeze({ level: "identity", rank: 1 }),
  Object.freeze({ level: "pose", rank: 2 }),
  Object.freeze({ level: "emotion", rank: 3 }),
  Object.freeze({ level: "style", rank: 4 }),
]);

export const DEFAULT_IDENTITY_LOCK_POLICY: Readonly<IdentityLockPolicy> = Object.freeze({
  version: IDENTITY_LOCK_POLICY_VERSION,
  priorityOrder: LOCK_PRIORITY_ORDER,
  principle: CHARACTER_CONTINUITY_PRIORITY_PRINCIPLE,
});

export const DEFAULT_STYLE_DRIFT_SUPPRESSION_POLICY: Readonly<StyleDriftSuppressionPolicy> =
  Object.freeze({
    version: CHARACTER_CONTINUITY_LAYER_VERSION,
    maxPaletteDrift: 0.12,
    maxLineWeightDrift: 0.08,
    maxLightingDrift: 0.1,
    suppressionStrength: 0.85,
  });

export const DEFAULT_CHARACTER_CONTINUITY_LOCK: Readonly<CharacterContinuityLock> = Object.freeze({
  lockId: "lock-gonegi-primary-identity",
  level: "identity",
  priority: 1,
  strictness: 0.92,
  overridesSceneEmotion: true,
});

export function resolveLockPriority(level: CharacterContinuityLockLevel): number {
  const entry = LOCK_PRIORITY_ORDER.find((item) => item.level === level);
  return entry?.rank ?? LOCK_PRIORITY_ORDER.length + 1;
}

export function sortVisualAnchorsByPriority(
  anchors: readonly CharacterVisualAnchor[]
): readonly CharacterVisualAnchor[] {
  return Object.freeze(
    [...anchors].sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }
      return left.anchorId.localeCompare(right.anchorId);
    })
  );
}

export function assertLockPriorityDeterministic(): boolean {
  const ranks = LOCK_PRIORITY_ORDER.map((entry) => entry.rank);
  const uniqueRanks = new Set(ranks);
  if (uniqueRanks.size !== ranks.length) {
    return false;
  }
  for (let index = 1; index < ranks.length; index += 1) {
    if (ranks[index] <= ranks[index - 1]) {
      return false;
    }
  }
  return true;
}
