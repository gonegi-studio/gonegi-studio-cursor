import crypto from "crypto";
import type { RealFrameEvidenceItem, RealFrameEvidenceRegistry } from "./real-frame-evidence-registry.ts";
import {
  REAL_FRAME_EVIDENCE_REGISTRY_MAX_FRAME_COUNT,
  computeRealFrameEvidenceRegistryFingerprint,
} from "./real-frame-evidence-registry.ts";

export type EstimatedSceneType =
  | "harbor-town"
  | "sky-flight"
  | "interior-warm"
  | "reflective-night"
  | "landscape-wide";

export type EstimatedLightingClass =
  | "warm-golden"
  | "overcast-soft"
  | "twilight-blue"
  | "reflective-night";

export type EstimatedPaletteClass =
  | "warm-earth"
  | "ocean-blue"
  | "sunset-orange"
  | "muted-natural";

export type EstimatedCompositionClass =
  | "wide-cinematic"
  | "centered-subject"
  | "environmental-depth"
  | "layered-foreground";

export type EstimatedMotionClass = "calm-static" | "slow-drift" | "forward-travel";

export type EstimatedDepthClass = "shallow-layered" | "deep-environmental";

export type EstimatedEmotionTone =
  | "nostalgic-calm"
  | "adventurous-soft"
  | "reflective-melancholy"
  | "peaceful-wonder";

export type RealFrameVisualDnaSeedItemStatus = "seed-ready" | "seed-blocked" | "seed-mismatch";

export type RealFrameVisualDnaSeedBuildStatus =
  | "seed-build-complete"
  | "seed-build-blocked"
  | "seed-build-mismatch";

export type RealFrameVisualDnaSeedItem = {
  visualDnaSeedId: string;
  frameEvidenceId: string;
  queueOrder: number;
  timestampSeconds: string;
  estimatedSceneType: EstimatedSceneType;
  estimatedLightingClass: EstimatedLightingClass;
  estimatedPaletteClass: EstimatedPaletteClass;
  estimatedCompositionClass: EstimatedCompositionClass;
  estimatedMotionClass: EstimatedMotionClass;
  estimatedDepthClass: EstimatedDepthClass;
  estimatedEmotionTone: EstimatedEmotionTone;
  frameFingerprint: string;
  sourceFingerprint: string;
  intakeVideoId: string;
  seedConfidence: string;
  seedSource: typeof REAL_FRAME_VISUAL_DNA_SEED_SOURCE;
  seedStatus: RealFrameVisualDnaSeedItemStatus;
};

export type RealFrameVisualDnaSeed = {
  version: "v1";
  seedRootId: string;
  registryId: string;
  registryFingerprint: string;
  seedVersion: typeof REAL_FRAME_VISUAL_DNA_SEED_KIND_VERSION;
  activeSeedState: string;
  seedBuildStatus: RealFrameVisualDnaSeedBuildStatus;
  totalSeedCount: typeof REAL_FRAME_VISUAL_DNA_SEED_MAX_COUNT;
  readySeedCount: number;
  items: readonly RealFrameVisualDnaSeedItem[];
  inferenceExecuted: false;
  ocrExecuted: false;
  captionModelExecuted: false;
  providerCallExecuted: false;
};

export const REAL_FRAME_VISUAL_DNA_SEED_VERSION = "v1" as const;
export const REAL_FRAME_VISUAL_DNA_SEED_KIND_VERSION = "real-frame-visual-dna-seed-v1" as const;
export const REAL_FRAME_VISUAL_DNA_SEED_ROOT_ID =
  "real-frame-visual-dna-seed-gonegi-harbor-25s-v1" as const;
export const REAL_FRAME_VISUAL_DNA_SEED_STATE =
  "25s-real-frame-visual-dna-seed-deterministic-structural-only" as const;
export const REAL_FRAME_VISUAL_DNA_SEED_SOURCE = "deterministic-structural-analysis" as const;
export const REAL_FRAME_VISUAL_DNA_SEED_MAX_COUNT = 3 as const;

export const ALLOWED_ESTIMATED_SCENE_TYPES = Object.freeze([
  "harbor-town",
  "sky-flight",
  "interior-warm",
  "reflective-night",
  "landscape-wide",
] as const);

export const ALLOWED_ESTIMATED_LIGHTING_CLASSES = Object.freeze([
  "warm-golden",
  "overcast-soft",
  "twilight-blue",
  "reflective-night",
] as const);

export const ALLOWED_ESTIMATED_PALETTE_CLASSES = Object.freeze([
  "warm-earth",
  "ocean-blue",
  "sunset-orange",
  "muted-natural",
] as const);

export const ALLOWED_ESTIMATED_COMPOSITION_CLASSES = Object.freeze([
  "wide-cinematic",
  "centered-subject",
  "environmental-depth",
  "layered-foreground",
] as const);

export const ALLOWED_ESTIMATED_MOTION_CLASSES = Object.freeze([
  "calm-static",
  "slow-drift",
  "forward-travel",
] as const);

export const ALLOWED_ESTIMATED_DEPTH_CLASSES = Object.freeze([
  "shallow-layered",
  "deep-environmental",
] as const);

export const ALLOWED_ESTIMATED_EMOTION_TONES = Object.freeze([
  "nostalgic-calm",
  "adventurous-soft",
  "reflective-melancholy",
  "peaceful-wonder",
] as const);

export const REAL_FRAME_VISUAL_DNA_QUEUE_PROFILES = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    timestampSeconds: "4.000",
    estimatedSceneType: "harbor-town" as const,
    estimatedLightingClass: "warm-golden" as const,
    estimatedPaletteClass: "warm-earth" as const,
    estimatedCompositionClass: "wide-cinematic" as const,
    estimatedMotionClass: "calm-static" as const,
    estimatedDepthClass: "deep-environmental" as const,
    estimatedEmotionTone: "nostalgic-calm" as const,
  }),
  Object.freeze({
    queueOrder: 1,
    timestampSeconds: "12.500",
    estimatedSceneType: "sky-flight" as const,
    estimatedLightingClass: "overcast-soft" as const,
    estimatedPaletteClass: "ocean-blue" as const,
    estimatedCompositionClass: "environmental-depth" as const,
    estimatedMotionClass: "slow-drift" as const,
    estimatedDepthClass: "deep-environmental" as const,
    estimatedEmotionTone: "adventurous-soft" as const,
  }),
  Object.freeze({
    queueOrder: 2,
    timestampSeconds: "21.000",
    estimatedSceneType: "interior-warm" as const,
    estimatedLightingClass: "twilight-blue" as const,
    estimatedPaletteClass: "sunset-orange" as const,
    estimatedCompositionClass: "layered-foreground" as const,
    estimatedMotionClass: "calm-static" as const,
    estimatedDepthClass: "shallow-layered" as const,
    estimatedEmotionTone: "peaceful-wonder" as const,
  }),
] as const);

export const REAL_FRAME_VISUAL_DNA_SEED_KEY_ORDER = Object.freeze([
  "version",
  "seedRootId",
  "registryId",
  "registryFingerprint",
  "seedVersion",
  "activeSeedState",
  "seedBuildStatus",
  "totalSeedCount",
  "readySeedCount",
  "items",
  "inferenceExecuted",
  "ocrExecuted",
  "captionModelExecuted",
  "providerCallExecuted",
] as const);

export const REAL_FRAME_VISUAL_DNA_SEED_ITEM_KEY_ORDER = Object.freeze([
  "visualDnaSeedId",
  "frameEvidenceId",
  "queueOrder",
  "timestampSeconds",
  "estimatedSceneType",
  "estimatedLightingClass",
  "estimatedPaletteClass",
  "estimatedCompositionClass",
  "estimatedMotionClass",
  "estimatedDepthClass",
  "estimatedEmotionTone",
  "frameFingerprint",
  "sourceFingerprint",
  "intakeVideoId",
  "seedConfidence",
  "seedSource",
  "seedStatus",
] as const);

let cachedRealFrameVisualDnaSeed: RealFrameVisualDnaSeed | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function computeSeedRootId(
  registry: RealFrameEvidenceRegistry,
  registryFingerprint: string
): string {
  return digestValue(
    [
      REAL_FRAME_VISUAL_DNA_SEED_KIND_VERSION,
      "seed-root",
      registry.registryId,
      registryFingerprint,
    ].join("|")
  );
}

function computeVisualDnaSeedId(
  frameEvidenceId: string,
  frameFingerprint: string,
  queueOrder: number
): string {
  return digestValue(
    [
      REAL_FRAME_VISUAL_DNA_SEED_KIND_VERSION,
      "visual-dna-seed",
      String(queueOrder),
      frameEvidenceId,
      frameFingerprint,
    ].join("|")
  );
}

function computeSeedConfidence(fileSizeBytes: number, frameFingerprint: string): string {
  const normalizedSize = Math.min(Math.max(fileSizeBytes, 0) / 200_000, 1);
  const hashComponent = Number.parseInt(frameFingerprint.slice(0, 8), 16) / 0xffff_ffff;
  const confidence = normalizedSize * 0.6 + hashComponent * 0.4;
  return confidence.toFixed(6);
}

function resolveSeedBuildBlockedReason(registry: RealFrameEvidenceRegistry): string | null {
  if (registry.registryStatus !== "registry-complete") {
    return "registry-not-complete";
  }
  if (registry.registeredFrameCount !== REAL_FRAME_VISUAL_DNA_SEED_MAX_COUNT) {
    return "registered-frame-count-mismatch";
  }
  if (registry.items.length !== REAL_FRAME_VISUAL_DNA_SEED_MAX_COUNT) {
    return "registry-item-count-mismatch";
  }
  if (!registry.items.every((item) => item.evidenceStatus === "registered")) {
    return "registry-item-not-registered";
  }
  return null;
}

function resolveSeedItemStatus(
  evidenceItem: RealFrameEvidenceItem | undefined,
  profile: (typeof REAL_FRAME_VISUAL_DNA_QUEUE_PROFILES)[number],
  seedBuildBlocked: boolean
): RealFrameVisualDnaSeedItemStatus {
  if (seedBuildBlocked) {
    return "seed-blocked";
  }

  if (evidenceItem === undefined) {
    return "seed-mismatch";
  }

  const linkagePass =
    evidenceItem.queueOrder === profile.queueOrder &&
    evidenceItem.timestampSeconds === profile.timestampSeconds &&
    evidenceItem.evidenceStatus === "registered" &&
    evidenceItem.fileSizeBytes > 0 &&
    evidenceItem.frameFingerprint.length === 64;

  return linkagePass ? "seed-ready" : "seed-mismatch";
}

function buildVisualDnaSeedItem(
  profile: (typeof REAL_FRAME_VISUAL_DNA_QUEUE_PROFILES)[number],
  evidenceItem: RealFrameEvidenceItem | undefined,
  seedBuildBlocked: boolean
): RealFrameVisualDnaSeedItem {
  const seedStatus = resolveSeedItemStatus(evidenceItem, profile, seedBuildBlocked);
  const frameFingerprint = evidenceItem?.frameFingerprint ?? "";
  const sourceFingerprint = evidenceItem?.sourceFingerprint ?? "";
  const intakeVideoId = evidenceItem?.intakeVideoId ?? "";
  const frameEvidenceId = evidenceItem?.frameEvidenceId ?? "";
  const fileSizeBytes = evidenceItem?.fileSizeBytes ?? 0;

  return Object.freeze({
    visualDnaSeedId: computeVisualDnaSeedId(frameEvidenceId, frameFingerprint, profile.queueOrder),
    frameEvidenceId,
    queueOrder: profile.queueOrder,
    timestampSeconds: profile.timestampSeconds,
    estimatedSceneType: profile.estimatedSceneType,
    estimatedLightingClass: profile.estimatedLightingClass,
    estimatedPaletteClass: profile.estimatedPaletteClass,
    estimatedCompositionClass: profile.estimatedCompositionClass,
    estimatedMotionClass: profile.estimatedMotionClass,
    estimatedDepthClass: profile.estimatedDepthClass,
    estimatedEmotionTone: profile.estimatedEmotionTone,
    frameFingerprint,
    sourceFingerprint,
    intakeVideoId,
    seedConfidence: computeSeedConfidence(fileSizeBytes, frameFingerprint),
    seedSource: REAL_FRAME_VISUAL_DNA_SEED_SOURCE,
    seedStatus,
  });
}

function resolveSeedBuildStatus(
  seedBuildBlocked: boolean,
  items: readonly RealFrameVisualDnaSeedItem[]
): RealFrameVisualDnaSeedBuildStatus {
  if (seedBuildBlocked) {
    return "seed-build-blocked";
  }

  const queueOrderValid = items.every((item, index) => item.queueOrder === index);
  const allReady =
    items.length === REAL_FRAME_VISUAL_DNA_SEED_MAX_COUNT &&
    items.every((item) => item.seedStatus === "seed-ready");

  if (!queueOrderValid || !allReady) {
    return "seed-build-mismatch";
  }

  return "seed-build-complete";
}

function buildRealFrameVisualDnaSeedInternal(
  realFrameEvidenceRegistry: RealFrameEvidenceRegistry
): RealFrameVisualDnaSeed {
  const seedBuildBlockedReason = resolveSeedBuildBlockedReason(realFrameEvidenceRegistry);
  const seedBuildBlocked = seedBuildBlockedReason !== null;

  const evidenceByQueue = new Map(
    realFrameEvidenceRegistry.items.map((item) => [item.queueOrder, item] as const)
  );

  const items = Object.freeze(
    REAL_FRAME_VISUAL_DNA_QUEUE_PROFILES.map((profile) =>
      buildVisualDnaSeedItem(profile, evidenceByQueue.get(profile.queueOrder), seedBuildBlocked)
    )
  );

  const readySeedCount = items.filter((item) => item.seedStatus === "seed-ready").length;
  const registryFingerprint = computeRealFrameEvidenceRegistryFingerprint(realFrameEvidenceRegistry);

  return Object.freeze({
    version: REAL_FRAME_VISUAL_DNA_SEED_VERSION,
    seedRootId: computeSeedRootId(realFrameEvidenceRegistry, registryFingerprint),
    registryId: realFrameEvidenceRegistry.registryId,
    registryFingerprint,
    seedVersion: REAL_FRAME_VISUAL_DNA_SEED_KIND_VERSION,
    activeSeedState: REAL_FRAME_VISUAL_DNA_SEED_STATE,
    seedBuildStatus: resolveSeedBuildStatus(seedBuildBlocked, items),
    totalSeedCount: REAL_FRAME_VISUAL_DNA_SEED_MAX_COUNT,
    readySeedCount,
    items,
    inferenceExecuted: false,
    ocrExecuted: false,
    captionModelExecuted: false,
    providerCallExecuted: false,
  });
}

export function buildRealFrameVisualDnaSeed(
  realFrameEvidenceRegistry: RealFrameEvidenceRegistry
): RealFrameVisualDnaSeed {
  if (cachedRealFrameVisualDnaSeed !== null) {
    return cachedRealFrameVisualDnaSeed;
  }

  const seed = buildRealFrameVisualDnaSeedInternal(realFrameEvidenceRegistry);
  cachedRealFrameVisualDnaSeed = seed;
  return seed;
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

export function serializeRealFrameVisualDnaSeed(seed: RealFrameVisualDnaSeed): string {
  const orderedItems = [...seed.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, REAL_FRAME_VISUAL_DNA_SEED_ITEM_KEY_ORDER));

  const orderedSeed: Record<string, unknown> = {};
  for (const key of REAL_FRAME_VISUAL_DNA_SEED_KEY_ORDER) {
    if (key === "items") {
      orderedSeed.items = orderedItems;
    } else {
      orderedSeed[key] = seed[key as keyof RealFrameVisualDnaSeed];
    }
  }

  return JSON.stringify(orderedSeed);
}

export function computeRealFrameVisualDnaSeedFingerprint(seed: RealFrameVisualDnaSeed): string {
  return digestValue(serializeRealFrameVisualDnaSeed(seed));
}

export function resetRealFrameVisualDnaSeedCacheForVerification(): void {
  cachedRealFrameVisualDnaSeed = null;
}

export function isAllowedDeterministicVisualDnaClass(
  dimension:
    | "scene"
    | "lighting"
    | "palette"
    | "composition"
    | "motion"
    | "depth"
    | "emotion",
  value: string
): boolean {
  switch (dimension) {
    case "scene":
      return (ALLOWED_ESTIMATED_SCENE_TYPES as readonly string[]).includes(value);
    case "lighting":
      return (ALLOWED_ESTIMATED_LIGHTING_CLASSES as readonly string[]).includes(value);
    case "palette":
      return (ALLOWED_ESTIMATED_PALETTE_CLASSES as readonly string[]).includes(value);
    case "composition":
      return (ALLOWED_ESTIMATED_COMPOSITION_CLASSES as readonly string[]).includes(value);
    case "motion":
      return (ALLOWED_ESTIMATED_MOTION_CLASSES as readonly string[]).includes(value);
    case "depth":
      return (ALLOWED_ESTIMATED_DEPTH_CLASSES as readonly string[]).includes(value);
    case "emotion":
      return (ALLOWED_ESTIMATED_EMOTION_TONES as readonly string[]).includes(value);
  }
}
