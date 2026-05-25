import crypto from "crypto";
import type { CinematicEvidenceItem, CinematicEvidenceRegistry } from "./cinematic-evidence-registry.ts";
import { computeCinematicEvidenceRegistryFingerprint } from "./cinematic-evidence-registry.ts";

export type CinematicGrammarRole = "opening" | "arrival" | "transition" | "echo";
export type CinematicTransitionRole = "hold" | "bridge" | "release";
export type CinematicPacingRole = "slow-build" | "sustain" | "resolve";

export type CinematicGrammarItem = {
  evidenceId: string;
  queueOrder: number;
  segmentId: string;
  cinematicRole: CinematicGrammarRole;
  transitionRole: CinematicTransitionRole;
  pacingRole: CinematicPacingRole;
  emotionalBeat: string;
  previousEvidenceId: string;
  nextEvidenceId: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  registryFingerprint: string;
  grammarFingerprint: string;
  sourceFingerprint: string;
};

export type CinematicTransitionBinding = {
  transitionIndex: number;
  fromQueueOrder: number;
  toQueueOrder: number;
  fromEvidenceId: string;
  toEvidenceId: string;
  transitionRole: CinematicTransitionRole;
  transitionFingerprint: string;
};

export type CinematicGrammarBinding = {
  version: "v1";
  bindingId: string;
  registryId: string;
  registryFingerprint: string;
  sourceFingerprint: string;
  grammarBindingVersion: typeof CINEMATIC_GRAMMAR_BINDING_KIND_VERSION;
  activeBindingState: string;
  transitions: readonly CinematicTransitionBinding[];
  items: readonly CinematicGrammarItem[];
};

export const CINEMATIC_GRAMMAR_BINDING_VERSION = "v1" as const;
export const CINEMATIC_GRAMMAR_BINDING_ID =
  "cinematic-grammar-binding-gonegi-harbor-25s-v1" as const;
export const CINEMATIC_GRAMMAR_BINDING_STATE =
  "25s-cinematic-grammar-binding-metadata-only" as const;
export const CINEMATIC_GRAMMAR_BINDING_KIND_VERSION = "cinematic-grammar-binding-v1" as const;

const SEGMENT_GRAMMAR_PROFILES = Object.freeze([
  Object.freeze({
    segmentId: "segment-001",
    orderIndex: 0,
    frameCinematicRole: "opening" as const,
    segmentCinematicRole: "opening" as const,
    transitionRole: "hold" as const,
    pacingRole: "slow-build" as const,
    emotionalBeat: "nostalgic-calm",
  }),
  Object.freeze({
    segmentId: "segment-002",
    orderIndex: 1,
    frameCinematicRole: "arrival" as const,
    segmentCinematicRole: "transition" as const,
    transitionRole: "bridge" as const,
    pacingRole: "sustain" as const,
    emotionalBeat: "reflective-bridge",
  }),
  Object.freeze({
    segmentId: "segment-003",
    orderIndex: 2,
    frameCinematicRole: "echo" as const,
    segmentCinematicRole: "echo" as const,
    transitionRole: "release" as const,
    pacingRole: "resolve" as const,
    emotionalBeat: "warm-resolution",
  }),
] as const);

let cachedCinematicGrammarBinding: CinematicGrammarBinding | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveBindingKind(item: CinematicEvidenceItem): "frame-export" | "segment-export" {
  return item.segmentPath === "" ? "frame-export" : "segment-export";
}

function resolveSegmentGrammarProfile(segmentId: string) {
  const profile = SEGMENT_GRAMMAR_PROFILES.find((entry) => entry.segmentId === segmentId);
  if (profile === undefined) {
    throw new Error(`Unknown segment grammar profile for segmentId=${segmentId}`);
  }
  return profile;
}

function resolveCinematicRole(
  profile: (typeof SEGMENT_GRAMMAR_PROFILES)[number],
  bindingKind: "frame-export" | "segment-export"
): CinematicGrammarRole {
  return bindingKind === "frame-export" ? profile.frameCinematicRole : profile.segmentCinematicRole;
}

function computeGrammarItemFingerprint(
  item: Omit<CinematicGrammarItem, "grammarFingerprint">
): string {
  return digestValue(
    [
      CINEMATIC_GRAMMAR_BINDING_KIND_VERSION,
      item.evidenceId,
      String(item.queueOrder),
      item.segmentId,
      item.cinematicRole,
      item.transitionRole,
      item.pacingRole,
      item.emotionalBeat,
      item.previousEvidenceId,
      item.nextEvidenceId,
      String(item.startSeconds),
      String(item.endSeconds),
      String(item.durationSeconds),
      item.registryFingerprint,
      item.sourceFingerprint,
    ].join("|")
  );
}

function computeTransitionBindingFingerprint(
  binding: Omit<CinematicTransitionBinding, "transitionFingerprint">
): string {
  return digestValue(
    [
      CINEMATIC_GRAMMAR_BINDING_KIND_VERSION,
      String(binding.transitionIndex),
      String(binding.fromQueueOrder),
      String(binding.toQueueOrder),
      binding.fromEvidenceId,
      binding.toEvidenceId,
      binding.transitionRole,
    ].join("|")
  );
}

function buildCinematicGrammarItem(
  evidenceItem: CinematicEvidenceItem,
  registryFingerprint: string,
  previousEvidenceId: string,
  nextEvidenceId: string
): CinematicGrammarItem {
  const profile = resolveSegmentGrammarProfile(evidenceItem.segmentId);
  const bindingKind = resolveBindingKind(evidenceItem);
  const cinematicRole = resolveCinematicRole(profile, bindingKind);

  const baseItem: Omit<CinematicGrammarItem, "grammarFingerprint"> = {
    evidenceId: evidenceItem.evidenceId,
    queueOrder: evidenceItem.queueOrder,
    segmentId: evidenceItem.segmentId,
    cinematicRole,
    transitionRole: profile.transitionRole,
    pacingRole: profile.pacingRole,
    emotionalBeat: profile.emotionalBeat,
    previousEvidenceId,
    nextEvidenceId,
    startSeconds: evidenceItem.startSeconds,
    endSeconds: evidenceItem.endSeconds,
    durationSeconds: evidenceItem.durationSeconds,
    registryFingerprint,
    sourceFingerprint: evidenceItem.sourceFingerprint,
  };

  return Object.freeze({
    ...baseItem,
    grammarFingerprint: computeGrammarItemFingerprint(baseItem),
  });
}

function buildCinematicTransitionBinding(
  fromItem: CinematicGrammarItem,
  toItem: CinematicGrammarItem,
  transitionIndex: number
): CinematicTransitionBinding {
  const baseBinding: Omit<CinematicTransitionBinding, "transitionFingerprint"> = {
    transitionIndex,
    fromQueueOrder: fromItem.queueOrder,
    toQueueOrder: toItem.queueOrder,
    fromEvidenceId: fromItem.evidenceId,
    toEvidenceId: toItem.evidenceId,
    transitionRole: toItem.transitionRole,
  };

  return Object.freeze({
    ...baseBinding,
    transitionFingerprint: computeTransitionBindingFingerprint(baseBinding),
  });
}

export function buildCinematicGrammarBinding(
  cinematicEvidenceRegistry: CinematicEvidenceRegistry
): CinematicGrammarBinding {
  if (cachedCinematicGrammarBinding !== null) {
    return cachedCinematicGrammarBinding;
  }

  const registryFingerprint = computeCinematicEvidenceRegistryFingerprint(cinematicEvidenceRegistry);
  const orderedEvidenceItems = [...cinematicEvidenceRegistry.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  const items = Object.freeze(
    orderedEvidenceItems.map((evidenceItem, index) => {
      const previousEvidenceId =
        index === 0 ? "" : orderedEvidenceItems[index - 1]?.evidenceId ?? "";
      const nextEvidenceId =
        index === orderedEvidenceItems.length - 1
          ? ""
          : orderedEvidenceItems[index + 1]?.evidenceId ?? "";

      return buildCinematicGrammarItem(
        evidenceItem,
        registryFingerprint,
        previousEvidenceId,
        nextEvidenceId
      );
    })
  );

  const transitions = Object.freeze(
    items.slice(0, -1).map((fromItem, index) => {
      const toItem = items[index + 1];
      if (toItem === undefined) {
        throw new Error("Transition binding requires a successor grammar item");
      }
      return buildCinematicTransitionBinding(fromItem, toItem, index);
    })
  );

  const binding = Object.freeze({
    version: CINEMATIC_GRAMMAR_BINDING_VERSION,
    bindingId: CINEMATIC_GRAMMAR_BINDING_ID,
    registryId: cinematicEvidenceRegistry.registryId,
    registryFingerprint,
    sourceFingerprint: cinematicEvidenceRegistry.sourceFingerprint,
    grammarBindingVersion: CINEMATIC_GRAMMAR_BINDING_KIND_VERSION,
    activeBindingState: CINEMATIC_GRAMMAR_BINDING_STATE,
    transitions,
    items,
  });

  cachedCinematicGrammarBinding = binding;
  return binding;
}

export const CINEMATIC_GRAMMAR_ITEM_KEY_ORDER = Object.freeze([
  "evidenceId",
  "queueOrder",
  "segmentId",
  "cinematicRole",
  "transitionRole",
  "pacingRole",
  "emotionalBeat",
  "previousEvidenceId",
  "nextEvidenceId",
  "startSeconds",
  "endSeconds",
  "durationSeconds",
  "registryFingerprint",
  "grammarFingerprint",
  "sourceFingerprint",
] as const);

export const CINEMATIC_TRANSITION_BINDING_KEY_ORDER = Object.freeze([
  "transitionIndex",
  "fromQueueOrder",
  "toQueueOrder",
  "fromEvidenceId",
  "toEvidenceId",
  "transitionRole",
  "transitionFingerprint",
] as const);

export const CINEMATIC_GRAMMAR_BINDING_KEY_ORDER = Object.freeze([
  "version",
  "bindingId",
  "registryId",
  "registryFingerprint",
  "sourceFingerprint",
  "grammarBindingVersion",
  "activeBindingState",
  "transitions",
  "items",
] as const);

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

export function serializeCinematicGrammarBinding(binding: CinematicGrammarBinding): string {
  const orderedItems = [...binding.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, CINEMATIC_GRAMMAR_ITEM_KEY_ORDER));

  const orderedTransitions = [...binding.transitions]
    .sort((a, b) => a.transitionIndex - b.transitionIndex)
    .map((transition) => orderRecord(transition, CINEMATIC_TRANSITION_BINDING_KEY_ORDER));

  const orderedBinding: Record<string, unknown> = {};
  for (const key of CINEMATIC_GRAMMAR_BINDING_KEY_ORDER) {
    if (key === "items") {
      orderedBinding.items = orderedItems;
    } else if (key === "transitions") {
      orderedBinding.transitions = orderedTransitions;
    } else {
      orderedBinding[key] = binding[key as keyof CinematicGrammarBinding];
    }
  }

  return JSON.stringify(orderedBinding);
}

export function computeCinematicGrammarBindingFingerprint(
  binding: CinematicGrammarBinding
): string {
  return digestValue(serializeCinematicGrammarBinding(binding));
}

export function resetCinematicGrammarBindingCacheForVerification(): void {
  cachedCinematicGrammarBinding = null;
}
