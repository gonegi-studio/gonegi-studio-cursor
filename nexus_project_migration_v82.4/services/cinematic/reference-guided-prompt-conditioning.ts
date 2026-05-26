import crypto from "crypto";
import type {
  ReferenceAnchorAllowedUsage,
  ReferenceAnchorBlockedUsage,
  ReferenceAnchorUsagePolicy,
} from "./reference-anchor-usage-policy.ts";
import { computeReferenceAnchorUsagePolicyFingerprint } from "./reference-anchor-usage-policy.ts";
import type { ReferenceDatasetAnchorRole } from "./reference-dataset-anchor.ts";

export type ReferenceGuidedConditioningIntent =
  | "style-and-visual-prompt-conditioning"
  | "continuity-chain-prompt-conditioning"
  | "prompt-alignment-conditioning";

export type ReferenceGuidedConditioningStatus = "conditioning-metadata-ready";

export type ReferenceGuidedPromptConditioningItem = {
  conditioningId: string;
  queueOrder: number;
  anchorId: string;
  anchorRole: ReferenceDatasetAnchorRole;
  conditioningIntent: ReferenceGuidedConditioningIntent;
  allowedReferenceUse: readonly ReferenceAnchorAllowedUsage[];
  blockedReferenceUse: readonly ReferenceAnchorBlockedUsage[];
  safetyNote: string;
  conditioningStatus: ReferenceGuidedConditioningStatus;
};

export type ReferenceGuidedPromptConditioning = {
  version: "v1";
  conditioningRootId: string;
  usagePolicyRootId: string;
  referenceAnchorUsagePolicyFingerprint: string;
  sourceFingerprint: string;
  conditioningVersion: typeof REFERENCE_GUIDED_PROMPT_CONDITIONING_KIND_VERSION;
  activeConditioningState: string;
  totalConditioningCount: number;
  items: readonly ReferenceGuidedPromptConditioningItem[];
};

export const REFERENCE_GUIDED_PROMPT_CONDITIONING_VERSION = "v1" as const;
export const REFERENCE_GUIDED_PROMPT_CONDITIONING_ID =
  "reference-guided-prompt-conditioning-gonegi-harbor-25s-v1" as const;
export const REFERENCE_GUIDED_PROMPT_CONDITIONING_STATE =
  "25s-reference-guided-prompt-conditioning-metadata-only" as const;
export const REFERENCE_GUIDED_PROMPT_CONDITIONING_KIND_VERSION =
  "reference-guided-prompt-conditioning-v1" as const;
export const REFERENCE_GUIDED_PROMPT_CONDITIONING_SAFETY_NOTE =
  "metadata-conditioning-only-no-direct-asset-reuse" as const;

const CONDITIONING_INTENT_BY_ANCHOR_ROLE = Object.freeze({
  "visual-reference": "style-and-visual-prompt-conditioning",
  "continuity-reference": "continuity-chain-prompt-conditioning",
  "prompt-reference": "prompt-alignment-conditioning",
} as const satisfies Record<ReferenceDatasetAnchorRole, ReferenceGuidedConditioningIntent>);

let cachedReferenceGuidedPromptConditioning: ReferenceGuidedPromptConditioning | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function orderRecord<T extends Record<string, unknown>>(
  item: T,
  keyOrder: readonly string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

function resolveConditioningIntent(
  anchorRole: ReferenceDatasetAnchorRole
): ReferenceGuidedConditioningIntent {
  return CONDITIONING_INTENT_BY_ANCHOR_ROLE[anchorRole];
}

function computeConditioningId(queueOrder: number, anchorId: string): string {
  return digestValue(
    [
      REFERENCE_GUIDED_PROMPT_CONDITIONING_KIND_VERSION,
      "reference-guided-prompt-conditioning-item",
      String(queueOrder),
      anchorId,
    ].join("|")
  );
}

function buildReferenceGuidedPromptConditioningItem(
  policyItem: ReferenceAnchorUsagePolicy["items"][number]
): ReferenceGuidedPromptConditioningItem {
  if (!policyItem.allowedUsage.includes("prompt-conditioning")) {
    throw new Error("Reference guided prompt conditioning requires prompt-conditioning allowance");
  }

  return Object.freeze({
    conditioningId: computeConditioningId(policyItem.queueOrder, policyItem.anchorId),
    queueOrder: policyItem.queueOrder,
    anchorId: policyItem.anchorId,
    anchorRole: policyItem.anchorRole,
    conditioningIntent: resolveConditioningIntent(policyItem.anchorRole),
    allowedReferenceUse: policyItem.allowedUsage,
    blockedReferenceUse: policyItem.blockedUsage,
    safetyNote: REFERENCE_GUIDED_PROMPT_CONDITIONING_SAFETY_NOTE,
    conditioningStatus: "conditioning-metadata-ready",
  });
}

export function buildReferenceGuidedPromptConditioning(
  referenceAnchorUsagePolicy: ReferenceAnchorUsagePolicy
): ReferenceGuidedPromptConditioning {
  if (cachedReferenceGuidedPromptConditioning !== null) {
    return cachedReferenceGuidedPromptConditioning;
  }

  if (referenceAnchorUsagePolicy.totalUsagePolicyCount !== 3) {
    throw new Error("Reference guided prompt conditioning requires exactly three usage policy items");
  }

  const orderedPolicyItems = [...referenceAnchorUsagePolicy.items].sort(
    (left, right) => left.queueOrder - right.queueOrder
  );

  const queueOrders = orderedPolicyItems.map((item) => item.queueOrder);
  if (queueOrders.join(",") !== "0,1,2") {
    throw new Error("Reference guided prompt conditioning requires queue order zero through two");
  }

  const items = Object.freeze(
    orderedPolicyItems.map((policyItem) => buildReferenceGuidedPromptConditioningItem(policyItem))
  );

  const conditioning = Object.freeze({
    version: REFERENCE_GUIDED_PROMPT_CONDITIONING_VERSION,
    conditioningRootId: REFERENCE_GUIDED_PROMPT_CONDITIONING_ID,
    usagePolicyRootId: referenceAnchorUsagePolicy.usagePolicyRootId,
    referenceAnchorUsagePolicyFingerprint:
      computeReferenceAnchorUsagePolicyFingerprint(referenceAnchorUsagePolicy),
    sourceFingerprint: referenceAnchorUsagePolicy.sourceFingerprint,
    conditioningVersion: REFERENCE_GUIDED_PROMPT_CONDITIONING_KIND_VERSION,
    activeConditioningState: REFERENCE_GUIDED_PROMPT_CONDITIONING_STATE,
    totalConditioningCount: items.length,
    items,
  });

  cachedReferenceGuidedPromptConditioning = conditioning;
  return conditioning;
}

export const REFERENCE_GUIDED_PROMPT_CONDITIONING_ITEM_KEY_ORDER = Object.freeze([
  "conditioningId",
  "queueOrder",
  "anchorId",
  "anchorRole",
  "conditioningIntent",
  "allowedReferenceUse",
  "blockedReferenceUse",
  "safetyNote",
  "conditioningStatus",
] as const);

export const REFERENCE_GUIDED_PROMPT_CONDITIONING_KEY_ORDER = Object.freeze([
  "version",
  "conditioningRootId",
  "usagePolicyRootId",
  "referenceAnchorUsagePolicyFingerprint",
  "sourceFingerprint",
  "conditioningVersion",
  "activeConditioningState",
  "totalConditioningCount",
  "items",
] as const);

export function serializeReferenceGuidedPromptConditioning(
  conditioning: ReferenceGuidedPromptConditioning
): string {
  const orderedItems = conditioning.items.map((item) =>
    orderRecord(item, REFERENCE_GUIDED_PROMPT_CONDITIONING_ITEM_KEY_ORDER)
  );

  const orderedConditioning: Record<string, unknown> = {};
  for (const key of REFERENCE_GUIDED_PROMPT_CONDITIONING_KEY_ORDER) {
    if (key === "items") {
      orderedConditioning.items = orderedItems;
    } else {
      orderedConditioning[key] = conditioning[key as keyof ReferenceGuidedPromptConditioning];
    }
  }

  return JSON.stringify(orderedConditioning);
}

export function computeReferenceGuidedPromptConditioningFingerprint(
  conditioning: ReferenceGuidedPromptConditioning
): string {
  return digestValue(serializeReferenceGuidedPromptConditioning(conditioning));
}

export function resetReferenceGuidedPromptConditioningCacheForVerification(): void {
  cachedReferenceGuidedPromptConditioning = null;
}
