import crypto from "crypto";
import type {
  ReferenceDatasetAnchor,
  ReferenceDatasetAnchorRole,
} from "./reference-dataset-anchor.ts";
import { computeReferenceDatasetAnchorFingerprint } from "./reference-dataset-anchor.ts";

export type ReferenceAnchorAllowedUsage =
  | "prompt-conditioning"
  | "continuity-check"
  | "style-reference";

export type ReferenceAnchorBlockedUsage =
  | "direct-copy"
  | "asset-reuse"
  | "copyright-leakage";

export type ReferenceAnchorUsagePriority = "high" | "normal" | "deferred";

export type ReferenceAnchorUsagePolicyStatus = "policy-active";

export type ReferenceAnchorUsagePolicyItem = {
  usagePolicyId: string;
  queueOrder: number;
  anchorId: string;
  anchorRole: ReferenceDatasetAnchorRole;
  allowedUsage: readonly ReferenceAnchorAllowedUsage[];
  blockedUsage: readonly ReferenceAnchorBlockedUsage[];
  priority: ReferenceAnchorUsagePriority;
  policyStatus: ReferenceAnchorUsagePolicyStatus;
};

export type ReferenceAnchorUsagePolicy = {
  version: "v1";
  usagePolicyRootId: string;
  anchorRootId: string;
  referenceDatasetAnchorFingerprint: string;
  sourceFingerprint: string;
  usagePolicyVersion: typeof REFERENCE_ANCHOR_USAGE_POLICY_KIND_VERSION;
  activeUsagePolicyState: string;
  totalUsagePolicyCount: number;
  items: readonly ReferenceAnchorUsagePolicyItem[];
};

export const REFERENCE_ANCHOR_USAGE_POLICY_VERSION = "v1" as const;
export const REFERENCE_ANCHOR_USAGE_POLICY_ID =
  "reference-anchor-usage-policy-gonegi-harbor-25s-v1" as const;
export const REFERENCE_ANCHOR_USAGE_POLICY_STATE =
  "25s-reference-anchor-usage-policy-metadata-only" as const;
export const REFERENCE_ANCHOR_USAGE_POLICY_KIND_VERSION =
  "reference-anchor-usage-policy-v1" as const;

export const REFERENCE_ANCHOR_ALLOWED_USAGE_CATALOG = Object.freeze([
  "prompt-conditioning",
  "continuity-check",
  "style-reference",
] as const satisfies readonly ReferenceAnchorAllowedUsage[]);

export const REFERENCE_ANCHOR_BLOCKED_USAGE_CATALOG = Object.freeze([
  "direct-copy",
  "asset-reuse",
  "copyright-leakage",
] as const satisfies readonly ReferenceAnchorBlockedUsage[]);

const ALLOWED_USAGE_BY_ANCHOR_ROLE = Object.freeze({
  "visual-reference": Object.freeze([
    "style-reference",
    "prompt-conditioning",
  ] as const satisfies readonly ReferenceAnchorAllowedUsage[]),
  "continuity-reference": Object.freeze([
    "continuity-check",
    "prompt-conditioning",
  ] as const satisfies readonly ReferenceAnchorAllowedUsage[]),
  "prompt-reference": Object.freeze([
    "prompt-conditioning",
    "continuity-check",
    "style-reference",
  ] as const satisfies readonly ReferenceAnchorAllowedUsage[]),
} as const satisfies Record<ReferenceDatasetAnchorRole, readonly ReferenceAnchorAllowedUsage[]>);

const PRIORITY_BY_QUEUE_ORDER = Object.freeze({
  0: "high",
  1: "normal",
  2: "normal",
} as const satisfies Record<number, ReferenceAnchorUsagePriority>);

let cachedReferenceAnchorUsagePolicy: ReferenceAnchorUsagePolicy | null = null;

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

function resolveAllowedUsage(
  anchorRole: ReferenceDatasetAnchorRole
): readonly ReferenceAnchorAllowedUsage[] {
  return ALLOWED_USAGE_BY_ANCHOR_ROLE[anchorRole];
}

function resolvePriority(queueOrder: number): ReferenceAnchorUsagePriority {
  const priority = PRIORITY_BY_QUEUE_ORDER[queueOrder as keyof typeof PRIORITY_BY_QUEUE_ORDER];
  if (priority === undefined) {
    throw new Error("Reference anchor usage policy requires a queue order priority definition");
  }
  return priority;
}

function computeUsagePolicyId(queueOrder: number, anchorId: string): string {
  return digestValue(
    [
      REFERENCE_ANCHOR_USAGE_POLICY_KIND_VERSION,
      "reference-anchor-usage-policy-item",
      String(queueOrder),
      anchorId,
    ].join("|")
  );
}

function buildReferenceAnchorUsagePolicyItem(
  anchorItem: ReferenceDatasetAnchor["items"][number]
): ReferenceAnchorUsagePolicyItem {
  return Object.freeze({
    usagePolicyId: computeUsagePolicyId(anchorItem.queueOrder, anchorItem.anchorId),
    queueOrder: anchorItem.queueOrder,
    anchorId: anchorItem.anchorId,
    anchorRole: anchorItem.anchorRole,
    allowedUsage: resolveAllowedUsage(anchorItem.anchorRole),
    blockedUsage: REFERENCE_ANCHOR_BLOCKED_USAGE_CATALOG,
    priority: resolvePriority(anchorItem.queueOrder),
    policyStatus: "policy-active",
  });
}

export function buildReferenceAnchorUsagePolicy(
  referenceDatasetAnchor: ReferenceDatasetAnchor
): ReferenceAnchorUsagePolicy {
  if (cachedReferenceAnchorUsagePolicy !== null) {
    return cachedReferenceAnchorUsagePolicy;
  }

  if (referenceDatasetAnchor.totalAnchorCount !== 3) {
    throw new Error("Reference anchor usage policy requires exactly three anchor items");
  }

  const orderedAnchorItems = [...referenceDatasetAnchor.items].sort(
    (left, right) => left.queueOrder - right.queueOrder
  );

  const queueOrders = orderedAnchorItems.map((item) => item.queueOrder);
  if (queueOrders.join(",") !== "0,1,2") {
    throw new Error("Reference anchor usage policy requires queue order zero through two");
  }

  const items = Object.freeze(
    orderedAnchorItems.map((anchorItem) => buildReferenceAnchorUsagePolicyItem(anchorItem))
  );

  const policy = Object.freeze({
    version: REFERENCE_ANCHOR_USAGE_POLICY_VERSION,
    usagePolicyRootId: REFERENCE_ANCHOR_USAGE_POLICY_ID,
    anchorRootId: referenceDatasetAnchor.anchorRootId,
    referenceDatasetAnchorFingerprint:
      computeReferenceDatasetAnchorFingerprint(referenceDatasetAnchor),
    sourceFingerprint: referenceDatasetAnchor.sourceFingerprint,
    usagePolicyVersion: REFERENCE_ANCHOR_USAGE_POLICY_KIND_VERSION,
    activeUsagePolicyState: REFERENCE_ANCHOR_USAGE_POLICY_STATE,
    totalUsagePolicyCount: items.length,
    items,
  });

  cachedReferenceAnchorUsagePolicy = policy;
  return policy;
}

export const REFERENCE_ANCHOR_USAGE_POLICY_ITEM_KEY_ORDER = Object.freeze([
  "usagePolicyId",
  "queueOrder",
  "anchorId",
  "anchorRole",
  "allowedUsage",
  "blockedUsage",
  "priority",
  "policyStatus",
] as const);

export const REFERENCE_ANCHOR_USAGE_POLICY_KEY_ORDER = Object.freeze([
  "version",
  "usagePolicyRootId",
  "anchorRootId",
  "referenceDatasetAnchorFingerprint",
  "sourceFingerprint",
  "usagePolicyVersion",
  "activeUsagePolicyState",
  "totalUsagePolicyCount",
  "items",
] as const);

export function serializeReferenceAnchorUsagePolicy(
  policy: ReferenceAnchorUsagePolicy
): string {
  const orderedItems = policy.items.map((item) =>
    orderRecord(item, REFERENCE_ANCHOR_USAGE_POLICY_ITEM_KEY_ORDER)
  );

  const orderedPolicy: Record<string, unknown> = {};
  for (const key of REFERENCE_ANCHOR_USAGE_POLICY_KEY_ORDER) {
    if (key === "items") {
      orderedPolicy.items = orderedItems;
    } else {
      orderedPolicy[key] = policy[key as keyof ReferenceAnchorUsagePolicy];
    }
  }

  return JSON.stringify(orderedPolicy);
}

export function computeReferenceAnchorUsagePolicyFingerprint(
  policy: ReferenceAnchorUsagePolicy
): string {
  return digestValue(serializeReferenceAnchorUsagePolicy(policy));
}

export function resetReferenceAnchorUsagePolicyCacheForVerification(): void {
  cachedReferenceAnchorUsagePolicy = null;
}
