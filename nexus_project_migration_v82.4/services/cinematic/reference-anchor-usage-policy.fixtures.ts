import { REFERENCE_DATASET_ANCHOR_OUTPUT_EXAMPLE } from "./reference-dataset-anchor.fixtures.ts";
import {
  buildReferenceAnchorUsagePolicy,
  computeReferenceAnchorUsagePolicyFingerprint,
  REFERENCE_ANCHOR_BLOCKED_USAGE_CATALOG,
} from "./reference-anchor-usage-policy.ts";

export const REFERENCE_ANCHOR_USAGE_POLICY_INPUT_EXAMPLE = Object.freeze({
  referenceDatasetAnchor: REFERENCE_DATASET_ANCHOR_OUTPUT_EXAMPLE,
});

export const REFERENCE_ANCHOR_USAGE_POLICY_OUTPUT_EXAMPLE = buildReferenceAnchorUsagePolicy(
  REFERENCE_ANCHOR_USAGE_POLICY_INPUT_EXAMPLE.referenceDatasetAnchor
);

export const REFERENCE_ANCHOR_USAGE_POLICY_FINGERPRINT = computeReferenceAnchorUsagePolicyFingerprint(
  REFERENCE_ANCHOR_USAGE_POLICY_OUTPUT_EXAMPLE
);

export const REFERENCE_ANCHOR_USAGE_POLICY_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  anchorRole: "visual-reference" as const,
  allowedUsage: Object.freeze(["style-reference", "prompt-conditioning"]),
  blockedUsage: REFERENCE_ANCHOR_BLOCKED_USAGE_CATALOG,
  priority: "high" as const,
  policyStatus: "policy-active" as const,
});

export const REFERENCE_ANCHOR_USAGE_POLICY_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  usagePolicyRootId: "reference-anchor-usage-policy-gonegi-harbor-25s-v1",
  usagePolicyVersion: "reference-anchor-usage-policy-v1" as const,
  activeUsagePolicyState: "25s-reference-anchor-usage-policy-metadata-only",
  totalUsagePolicyCount: 3,
  queueOrderSequence: Object.freeze([0, 1, 2]),
});
