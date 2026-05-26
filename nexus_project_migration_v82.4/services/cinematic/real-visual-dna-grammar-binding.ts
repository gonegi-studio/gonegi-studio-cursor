import crypto from "crypto";
import type {
  RealFrameVisualDnaSeed,
  RealFrameVisualDnaSeedItem,
} from "./real-frame-visual-dna-seed.ts";
import {
  REAL_FRAME_VISUAL_DNA_SEED_MAX_COUNT,
  computeRealFrameVisualDnaSeedFingerprint,
} from "./real-frame-visual-dna-seed.ts";

export type RealVisualDnaCinematicRole = "opening" | "transition" | "resolution";
export type RealVisualDnaPacingRole = "slow-build" | "sustain" | "release";
export type RealVisualDnaContinuityRole = "visual-anchor" | "motion-bridge" | "emotional-anchor";

export type RealVisualDnaGrammarBindingItemStatus = "bound" | "binding-blocked" | "binding-mismatch";

export type RealVisualDnaGrammarBindingStatus =
  | "binding-complete"
  | "binding-blocked"
  | "binding-mismatch";

export type RealVisualDnaGrammarBindingItem = {
  grammarBindingId: string;
  queueOrder: number;
  frameEvidenceId: string;
  visualDnaSeedId: string;
  sceneType: RealFrameVisualDnaSeedItem["estimatedSceneType"];
  lightingClass: RealFrameVisualDnaSeedItem["estimatedLightingClass"];
  paletteClass: RealFrameVisualDnaSeedItem["estimatedPaletteClass"];
  compositionClass: RealFrameVisualDnaSeedItem["estimatedCompositionClass"];
  motionClass: RealFrameVisualDnaSeedItem["estimatedMotionClass"];
  depthClass: RealFrameVisualDnaSeedItem["estimatedDepthClass"];
  emotionTone: RealFrameVisualDnaSeedItem["estimatedEmotionTone"];
  cinematicRole: RealVisualDnaCinematicRole;
  pacingRole: RealVisualDnaPacingRole;
  continuityRole: RealVisualDnaContinuityRole;
  grammarConfidence: string;
  bindingStatus: RealVisualDnaGrammarBindingItemStatus;
};

export type RealVisualDnaGrammarBinding = {
  version: "v1";
  bindingRootId: string;
  seedRootId: string;
  seedFingerprint: string;
  bindingVersion: typeof REAL_VISUAL_DNA_GRAMMAR_BINDING_KIND_VERSION;
  activeBindingState: string;
  bindingStatus: RealVisualDnaGrammarBindingStatus;
  totalItemCount: typeof REAL_VISUAL_DNA_GRAMMAR_BINDING_MAX_ITEM_COUNT;
  boundItemCount: number;
  items: readonly RealVisualDnaGrammarBindingItem[];
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_VISUAL_DNA_GRAMMAR_BINDING_VERSION = "v1" as const;
export const REAL_VISUAL_DNA_GRAMMAR_BINDING_KIND_VERSION =
  "real-visual-dna-grammar-binding-v1" as const;
export const REAL_VISUAL_DNA_GRAMMAR_BINDING_ROOT_ID =
  "real-visual-dna-grammar-binding-gonegi-harbor-25s-v1" as const;
export const REAL_VISUAL_DNA_GRAMMAR_BINDING_STATE =
  "25s-real-visual-dna-grammar-binding-metadata-only" as const;
export const REAL_VISUAL_DNA_GRAMMAR_BINDING_MAX_ITEM_COUNT = 3 as const;

export const REAL_VISUAL_DNA_GRAMMAR_ROLE_PROFILES = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    cinematicRole: "opening" as const,
    pacingRole: "slow-build" as const,
    continuityRole: "visual-anchor" as const,
  }),
  Object.freeze({
    queueOrder: 1,
    cinematicRole: "transition" as const,
    pacingRole: "sustain" as const,
    continuityRole: "motion-bridge" as const,
  }),
  Object.freeze({
    queueOrder: 2,
    cinematicRole: "resolution" as const,
    pacingRole: "release" as const,
    continuityRole: "emotional-anchor" as const,
  }),
] as const);

export const REAL_VISUAL_DNA_GRAMMAR_BINDING_KEY_ORDER = Object.freeze([
  "version",
  "bindingRootId",
  "seedRootId",
  "seedFingerprint",
  "bindingVersion",
  "activeBindingState",
  "bindingStatus",
  "totalItemCount",
  "boundItemCount",
  "items",
  "inferenceExecuted",
  "providerCallExecuted",
] as const);

export const REAL_VISUAL_DNA_GRAMMAR_BINDING_ITEM_KEY_ORDER = Object.freeze([
  "grammarBindingId",
  "queueOrder",
  "frameEvidenceId",
  "visualDnaSeedId",
  "sceneType",
  "lightingClass",
  "paletteClass",
  "compositionClass",
  "motionClass",
  "depthClass",
  "emotionTone",
  "cinematicRole",
  "pacingRole",
  "continuityRole",
  "grammarConfidence",
  "bindingStatus",
] as const);

let cachedRealVisualDnaGrammarBinding: RealVisualDnaGrammarBinding | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function computeBindingRootId(seed: RealFrameVisualDnaSeed, seedFingerprint: string): string {
  return digestValue(
    [
      REAL_VISUAL_DNA_GRAMMAR_BINDING_KIND_VERSION,
      "binding-root",
      seed.seedRootId,
      seedFingerprint,
    ].join("|")
  );
}

function computeGrammarBindingId(
  visualDnaSeedId: string,
  queueOrder: number,
  cinematicRole: RealVisualDnaCinematicRole,
  pacingRole: RealVisualDnaPacingRole,
  continuityRole: RealVisualDnaContinuityRole
): string {
  return digestValue(
    [
      REAL_VISUAL_DNA_GRAMMAR_BINDING_KIND_VERSION,
      "grammar-binding",
      String(queueOrder),
      visualDnaSeedId,
      cinematicRole,
      pacingRole,
      continuityRole,
    ].join("|")
  );
}

function computeGrammarConfidence(seedConfidence: string, queueOrder: number): string {
  const seedValue = Number.parseFloat(seedConfidence);
  const queueWeight = [0.34, 0.33, 0.33][queueOrder] ?? 0.33;
  const confidence = Number.isFinite(seedValue) ? seedValue * queueWeight + queueWeight * 0.5 : 0;
  return confidence.toFixed(6);
}

function resolveBindingBlockedReason(seed: RealFrameVisualDnaSeed): string | null {
  if (seed.seedBuildStatus !== "seed-build-complete") {
    return "seed-build-not-complete";
  }
  if (seed.readySeedCount !== REAL_VISUAL_DNA_GRAMMAR_BINDING_MAX_ITEM_COUNT) {
    return "ready-seed-count-mismatch";
  }
  if (seed.items.length !== REAL_VISUAL_DNA_GRAMMAR_BINDING_MAX_ITEM_COUNT) {
    return "seed-item-count-mismatch";
  }
  if (!seed.items.every((item) => item.seedStatus === "seed-ready")) {
    return "seed-item-not-ready";
  }
  return null;
}

function resolveItemBindingStatus(
  seedItem: RealFrameVisualDnaSeedItem | undefined,
  roleProfile: (typeof REAL_VISUAL_DNA_GRAMMAR_ROLE_PROFILES)[number],
  bindingBlocked: boolean
): RealVisualDnaGrammarBindingItemStatus {
  if (bindingBlocked) {
    return "binding-blocked";
  }

  if (seedItem === undefined) {
    return "binding-mismatch";
  }

  const linkagePass =
    seedItem.queueOrder === roleProfile.queueOrder &&
    seedItem.seedStatus === "seed-ready" &&
    seedItem.frameEvidenceId.length === 64 &&
    seedItem.visualDnaSeedId.length === 64;

  return linkagePass ? "bound" : "binding-mismatch";
}

function buildGrammarBindingItem(
  roleProfile: (typeof REAL_VISUAL_DNA_GRAMMAR_ROLE_PROFILES)[number],
  seedItem: RealFrameVisualDnaSeedItem | undefined,
  bindingBlocked: boolean
): RealVisualDnaGrammarBindingItem {
  const bindingStatus = resolveItemBindingStatus(seedItem, roleProfile, bindingBlocked);
  const visualDnaSeedId = seedItem?.visualDnaSeedId ?? "";
  const frameEvidenceId = seedItem?.frameEvidenceId ?? "";
  const seedConfidence = seedItem?.seedConfidence ?? "0.000000";

  return Object.freeze({
    grammarBindingId: computeGrammarBindingId(
      visualDnaSeedId,
      roleProfile.queueOrder,
      roleProfile.cinematicRole,
      roleProfile.pacingRole,
      roleProfile.continuityRole
    ),
    queueOrder: roleProfile.queueOrder,
    frameEvidenceId,
    visualDnaSeedId,
    sceneType: seedItem?.estimatedSceneType ?? "harbor-town",
    lightingClass: seedItem?.estimatedLightingClass ?? "warm-golden",
    paletteClass: seedItem?.estimatedPaletteClass ?? "warm-earth",
    compositionClass: seedItem?.estimatedCompositionClass ?? "wide-cinematic",
    motionClass: seedItem?.estimatedMotionClass ?? "calm-static",
    depthClass: seedItem?.estimatedDepthClass ?? "deep-environmental",
    emotionTone: seedItem?.estimatedEmotionTone ?? "nostalgic-calm",
    cinematicRole: roleProfile.cinematicRole,
    pacingRole: roleProfile.pacingRole,
    continuityRole: roleProfile.continuityRole,
    grammarConfidence: computeGrammarConfidence(seedConfidence, roleProfile.queueOrder),
    bindingStatus,
  });
}

function resolveBindingStatus(
  bindingBlocked: boolean,
  items: readonly RealVisualDnaGrammarBindingItem[]
): RealVisualDnaGrammarBindingStatus {
  if (bindingBlocked) {
    return "binding-blocked";
  }

  const queueOrderValid = items.every((item, index) => item.queueOrder === index);
  const allBound =
    items.length === REAL_VISUAL_DNA_GRAMMAR_BINDING_MAX_ITEM_COUNT &&
    items.every((item) => item.bindingStatus === "bound");

  if (!queueOrderValid || !allBound) {
    return "binding-mismatch";
  }

  return "binding-complete";
}

function buildRealVisualDnaGrammarBindingInternal(
  realFrameVisualDnaSeed: RealFrameVisualDnaSeed
): RealVisualDnaGrammarBinding {
  const bindingBlockedReason = resolveBindingBlockedReason(realFrameVisualDnaSeed);
  const bindingBlocked = bindingBlockedReason !== null;

  const seedByQueue = new Map(
    realFrameVisualDnaSeed.items.map((item) => [item.queueOrder, item] as const)
  );

  const items = Object.freeze(
    REAL_VISUAL_DNA_GRAMMAR_ROLE_PROFILES.map((roleProfile) =>
      buildGrammarBindingItem(roleProfile, seedByQueue.get(roleProfile.queueOrder), bindingBlocked)
    )
  );

  const boundItemCount = items.filter((item) => item.bindingStatus === "bound").length;
  const seedFingerprint = computeRealFrameVisualDnaSeedFingerprint(realFrameVisualDnaSeed);

  return Object.freeze({
    version: REAL_VISUAL_DNA_GRAMMAR_BINDING_VERSION,
    bindingRootId: computeBindingRootId(realFrameVisualDnaSeed, seedFingerprint),
    seedRootId: realFrameVisualDnaSeed.seedRootId,
    seedFingerprint,
    bindingVersion: REAL_VISUAL_DNA_GRAMMAR_BINDING_KIND_VERSION,
    activeBindingState: REAL_VISUAL_DNA_GRAMMAR_BINDING_STATE,
    bindingStatus: resolveBindingStatus(bindingBlocked, items),
    totalItemCount: REAL_VISUAL_DNA_GRAMMAR_BINDING_MAX_ITEM_COUNT,
    boundItemCount,
    items,
    inferenceExecuted: false,
    providerCallExecuted: false,
  });
}

export function buildRealVisualDnaGrammarBinding(
  realFrameVisualDnaSeed: RealFrameVisualDnaSeed
): RealVisualDnaGrammarBinding {
  if (cachedRealVisualDnaGrammarBinding !== null) {
    return cachedRealVisualDnaGrammarBinding;
  }

  const binding = buildRealVisualDnaGrammarBindingInternal(realFrameVisualDnaSeed);
  cachedRealVisualDnaGrammarBinding = binding;
  return binding;
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

export function serializeRealVisualDnaGrammarBinding(binding: RealVisualDnaGrammarBinding): string {
  const orderedItems = [...binding.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, REAL_VISUAL_DNA_GRAMMAR_BINDING_ITEM_KEY_ORDER));

  const orderedBinding: Record<string, unknown> = {};
  for (const key of REAL_VISUAL_DNA_GRAMMAR_BINDING_KEY_ORDER) {
    if (key === "items") {
      orderedBinding.items = orderedItems;
    } else {
      orderedBinding[key] = binding[key as keyof RealVisualDnaGrammarBinding];
    }
  }

  return JSON.stringify(orderedBinding);
}

export function computeRealVisualDnaGrammarBindingFingerprint(
  binding: RealVisualDnaGrammarBinding
): string {
  return digestValue(serializeRealVisualDnaGrammarBinding(binding));
}

export function resetRealVisualDnaGrammarBindingCacheForVerification(): void {
  cachedRealVisualDnaGrammarBinding = null;
}

export function resolveRealVisualDnaGrammarRoleProfile(queueOrder: number) {
  const profile = REAL_VISUAL_DNA_GRAMMAR_ROLE_PROFILES.find(
    (entry) => entry.queueOrder === queueOrder
  );
  if (profile === undefined) {
    throw new Error(`Unknown grammar role profile for queueOrder=${queueOrder}`);
  }
  return profile;
}
