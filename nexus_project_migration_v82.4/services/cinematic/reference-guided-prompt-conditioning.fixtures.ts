import { REFERENCE_ANCHOR_USAGE_POLICY_OUTPUT_EXAMPLE } from "./reference-anchor-usage-policy.fixtures.ts";
import {
  buildReferenceGuidedPromptConditioning,
  computeReferenceGuidedPromptConditioningFingerprint,
  REFERENCE_GUIDED_PROMPT_CONDITIONING_SAFETY_NOTE,
} from "./reference-guided-prompt-conditioning.ts";

export const REFERENCE_GUIDED_PROMPT_CONDITIONING_INPUT_EXAMPLE = Object.freeze({
  referenceAnchorUsagePolicy: REFERENCE_ANCHOR_USAGE_POLICY_OUTPUT_EXAMPLE,
});

export const REFERENCE_GUIDED_PROMPT_CONDITIONING_OUTPUT_EXAMPLE =
  buildReferenceGuidedPromptConditioning(
    REFERENCE_GUIDED_PROMPT_CONDITIONING_INPUT_EXAMPLE.referenceAnchorUsagePolicy
  );

export const REFERENCE_GUIDED_PROMPT_CONDITIONING_FINGERPRINT =
  computeReferenceGuidedPromptConditioningFingerprint(
    REFERENCE_GUIDED_PROMPT_CONDITIONING_OUTPUT_EXAMPLE
  );

export const REFERENCE_GUIDED_PROMPT_CONDITIONING_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  anchorRole: "visual-reference" as const,
  conditioningIntent: "style-and-visual-prompt-conditioning" as const,
  allowedReferenceUse: Object.freeze(["style-reference", "prompt-conditioning"]),
  blockedReferenceUse: Object.freeze(["direct-copy", "asset-reuse", "copyright-leakage"]),
  safetyNote: REFERENCE_GUIDED_PROMPT_CONDITIONING_SAFETY_NOTE,
  conditioningStatus: "conditioning-metadata-ready" as const,
});

export const REFERENCE_GUIDED_PROMPT_CONDITIONING_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  conditioningRootId: "reference-guided-prompt-conditioning-gonegi-harbor-25s-v1",
  conditioningVersion: "reference-guided-prompt-conditioning-v1" as const,
  activeConditioningState: "25s-reference-guided-prompt-conditioning-metadata-only",
  totalConditioningCount: 3,
  queueOrderSequence: Object.freeze([0, 1, 2]),
});
