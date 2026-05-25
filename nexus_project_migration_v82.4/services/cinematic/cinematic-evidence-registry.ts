import crypto from "crypto";
import type { MultiSegmentControlledExtraction } from "./multi-segment-controlled-extraction.ts";
import {
  MULTI_FRAME_CONTROLLED_TARGET_SPECS,
  computeMultiFrameControlledExtractionFingerprint,
} from "./multi-frame-controlled-extraction.ts";
import {
  MULTI_SEGMENT_CONTROLLED_TARGET_SPECS,
  computeMultiSegmentControlledExtractionFingerprint,
} from "./multi-segment-controlled-extraction.ts";
import {
  buildPilotVideoManifest,
  computePilotVideoManifestFingerprint,
} from "./pilot-intake-schema.ts";

export type SegmentManifestEntry = {
  segmentId: string;
  segmentSlug: string;
  orderIndex: number;
  frameQueueOrder: number;
  segmentQueueOrder: number;
  framePath: string;
  segmentPath: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  frameExtractionFingerprint: string;
  segmentExtractionFingerprint: string;
  manifestEntryFingerprint: string;
};

export type SegmentManifestSerialization = {
  version: "v1";
  serializationId: string;
  multiSegmentExtractionFingerprint: string;
  multiFrameExtractionFingerprint: string;
  pilotManifestFingerprint: string;
  registryRoot: typeof CINEMATIC_EVIDENCE_REGISTRY_ROOT;
  activeSerializationState: string;
  segments: readonly SegmentManifestEntry[];
};

export type CinematicEvidenceItem = {
  evidenceId: string;
  segmentId: string;
  queueOrder: number;
  cinematicRole: string;
  cinematicPhase: string;
  emotionalPhase: string;
  framePaths: readonly string[];
  segmentPath: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  extractionFingerprint: string;
  manifestFingerprint: string;
  sourceFingerprint: string;
  evidenceTimelineIndex: number;
  evidenceBindingVersion: typeof CINEMATIC_EVIDENCE_BINDING_VERSION;
};

export type CinematicEvidenceTimelineEntry = {
  timelineIndex: number;
  queueOrder: number;
  evidenceId: string;
  segmentId: string;
  bindingKind: "frame-export" | "segment-export";
};

export type CinematicEvidenceTimeline = {
  version: "v1";
  timelineId: string;
  entries: readonly CinematicEvidenceTimelineEntry[];
};

export type CinematicEvidenceRegistry = {
  version: "v1";
  registryId: string;
  serializationId: string;
  serializationFingerprint: string;
  multiSegmentExtractionFingerprint: string;
  registryRoot: typeof CINEMATIC_EVIDENCE_REGISTRY_ROOT;
  activeRegistryState: string;
  evidenceBindingVersion: typeof CINEMATIC_EVIDENCE_BINDING_VERSION;
  sourceFingerprint: string;
  timeline: CinematicEvidenceTimeline;
  items: readonly CinematicEvidenceItem[];
};

export const CINEMATIC_EVIDENCE_REGISTRY_VERSION = "v1" as const;
export const CINEMATIC_EVIDENCE_REGISTRY_ID =
  "cinematic-evidence-registry-gonegi-harbor-25s-v1" as const;
export const CINEMATIC_EVIDENCE_REGISTRY_ROOT = "storage/pilot-intake/evidence-registry/" as const;
export const CINEMATIC_EVIDENCE_REGISTRY_STATE =
  "25s-cinematic-evidence-registry-metadata-only" as const;
export const CINEMATIC_EVIDENCE_BINDING_VERSION = "cinematic-evidence-binding-v1" as const;
export const SEGMENT_MANIFEST_SERIALIZATION_ID =
  "segment-manifest-serialization-gonegi-harbor-25s-v1" as const;
export const SEGMENT_MANIFEST_SERIALIZATION_STATE =
  "25s-segment-manifest-serialization-ready" as const;
export const CINEMATIC_EVIDENCE_TIMELINE_ID =
  "cinematic-evidence-timeline-gonegi-harbor-25s-v1" as const;

const SEGMENT_EVIDENCE_DEFINITIONS = Object.freeze([
  Object.freeze({
    segmentId: "segment-001",
    segmentSlug: "harbor-opening-hold",
    orderIndex: 0,
    frameQueueOrder: 0,
    segmentQueueOrder: 3,
    framePath: MULTI_FRAME_CONTROLLED_TARGET_SPECS[0].expectedOutputPath,
    segmentPath: MULTI_SEGMENT_CONTROLLED_TARGET_SPECS[0].expectedOutputPath,
    startSeconds: 0,
    endSeconds: 8,
    durationSeconds: 8,
    cinematicRole: "harbor-opening-anchor",
    cinematicPhase: "opening-hold",
    emotionalPhase: "nostalgic-calm",
  }),
  Object.freeze({
    segmentId: "segment-002",
    segmentSlug: "protagonist-arrival-mid",
    orderIndex: 1,
    frameQueueOrder: 1,
    segmentQueueOrder: 4,
    framePath: MULTI_FRAME_CONTROLLED_TARGET_SPECS[1].expectedOutputPath,
    segmentPath: MULTI_SEGMENT_CONTROLLED_TARGET_SPECS[1].expectedOutputPath,
    startSeconds: 8,
    endSeconds: 17,
    durationSeconds: 9,
    cinematicRole: "protagonist-arrival-bridge",
    cinematicPhase: "mid-arrival",
    emotionalPhase: "reflective-bridge",
  }),
  Object.freeze({
    segmentId: "segment-003",
    segmentSlug: "warm-glaze-final-echo",
    orderIndex: 2,
    frameQueueOrder: 2,
    segmentQueueOrder: 5,
    framePath: MULTI_FRAME_CONTROLLED_TARGET_SPECS[2].expectedOutputPath,
    segmentPath: MULTI_SEGMENT_CONTROLLED_TARGET_SPECS[2].expectedOutputPath,
    startSeconds: 17,
    endSeconds: 25,
    durationSeconds: 8,
    cinematicRole: "warm-glaze-closure-echo",
    cinematicPhase: "closing-echo",
    emotionalPhase: "warm-resolution",
  }),
] as const);

let cachedSegmentManifestSerialization: SegmentManifestSerialization | null = null;
let cachedCinematicEvidenceRegistry: CinematicEvidenceRegistry | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function computePathExtractionFingerprint(relativePath: string): string {
  return digestValue(`controlled-extraction-path|${relativePath}`);
}

function computeSegmentManifestEntryFingerprint(
  entry: Omit<SegmentManifestEntry, "manifestEntryFingerprint">
): string {
  return digestValue(
    [
      entry.segmentId,
      entry.segmentSlug,
      String(entry.orderIndex),
      String(entry.frameQueueOrder),
      String(entry.segmentQueueOrder),
      entry.framePath,
      entry.segmentPath,
      String(entry.startSeconds),
      String(entry.endSeconds),
      String(entry.durationSeconds),
      entry.frameExtractionFingerprint,
      entry.segmentExtractionFingerprint,
    ].join("|")
  );
}

function resolveSegmentExtractionFingerprint(
  multiSegmentExtraction: MultiSegmentControlledExtraction,
  queueOrder: number,
  fallbackPath: string
): string {
  const segmentItem = multiSegmentExtraction.items.find((item) => item.queueOrder === queueOrder);
  if (segmentItem === undefined) {
    return computePathExtractionFingerprint(fallbackPath);
  }
  return digestValue(`${segmentItem.stdoutDigest}|${segmentItem.stderrDigest}|${fallbackPath}`);
}

function buildSegmentManifestEntry(
  definition: (typeof SEGMENT_EVIDENCE_DEFINITIONS)[number],
  multiSegmentExtraction: MultiSegmentControlledExtraction
): SegmentManifestEntry {
  const frameExtractionFingerprint = computePathExtractionFingerprint(definition.framePath);
  const segmentExtractionFingerprint = resolveSegmentExtractionFingerprint(
    multiSegmentExtraction,
    definition.segmentQueueOrder,
    definition.segmentPath
  );

  const baseEntry = {
    segmentId: definition.segmentId,
    segmentSlug: definition.segmentSlug,
    orderIndex: definition.orderIndex,
    frameQueueOrder: definition.frameQueueOrder,
    segmentQueueOrder: definition.segmentQueueOrder,
    framePath: definition.framePath,
    segmentPath: definition.segmentPath,
    startSeconds: definition.startSeconds,
    endSeconds: definition.endSeconds,
    durationSeconds: definition.durationSeconds,
    frameExtractionFingerprint,
    segmentExtractionFingerprint,
  };

  return Object.freeze({
    ...baseEntry,
    manifestEntryFingerprint: computeSegmentManifestEntryFingerprint(baseEntry),
  });
}

export function buildSegmentManifestSerialization(
  multiSegmentExtraction: MultiSegmentControlledExtraction
): SegmentManifestSerialization {
  if (cachedSegmentManifestSerialization !== null) {
    return cachedSegmentManifestSerialization;
  }

  if (multiSegmentExtraction.result !== "extraction-success") {
    throw new Error("Multi-segment controlled extraction must succeed before manifest serialization");
  }

  const pilotManifest = buildPilotVideoManifest();
  const segments = Object.freeze(
    SEGMENT_EVIDENCE_DEFINITIONS.map((definition) =>
      buildSegmentManifestEntry(definition, multiSegmentExtraction)
    )
  );

  const serialization = Object.freeze({
    version: CINEMATIC_EVIDENCE_REGISTRY_VERSION,
    serializationId: SEGMENT_MANIFEST_SERIALIZATION_ID,
    multiSegmentExtractionFingerprint:
      computeMultiSegmentControlledExtractionFingerprint(multiSegmentExtraction),
    multiFrameExtractionFingerprint: computeMultiFrameExtractionBundleFingerprint(),
    pilotManifestFingerprint: computePilotVideoManifestFingerprint(pilotManifest),
    registryRoot: CINEMATIC_EVIDENCE_REGISTRY_ROOT,
    activeSerializationState: SEGMENT_MANIFEST_SERIALIZATION_STATE,
    segments,
  });

  cachedSegmentManifestSerialization = serialization;
  return serialization;
}

function computeMultiFrameExtractionBundleFingerprint(): string {
  return digestValue(
    MULTI_FRAME_CONTROLLED_TARGET_SPECS.map(
      (target) => `${target.queueOrder}|${target.expectedOutputPath}|${target.targetTimestampSec}`
    ).join("|")
  );
}

function computeEvidenceId(
  queueOrder: number,
  segmentId: string,
  framePaths: readonly string[],
  segmentPath: string
): string {
  return digestValue(
    [
      CINEMATIC_EVIDENCE_BINDING_VERSION,
      String(queueOrder),
      segmentId,
      framePaths.join("|"),
      segmentPath,
    ].join("|")
  );
}

function buildEvidenceItemForQueue(
  segmentEntry: SegmentManifestEntry,
  queueOrder: number,
  bindingKind: "frame-export" | "segment-export",
  sourceFingerprint: string,
  evidenceTimelineIndex: number
): CinematicEvidenceItem {
  const framePaths = Object.freeze([segmentEntry.framePath]);
  const segmentPath = bindingKind === "segment-export" ? segmentEntry.segmentPath : "";
  const extractionFingerprint =
    bindingKind === "segment-export"
      ? segmentEntry.segmentExtractionFingerprint
      : segmentEntry.frameExtractionFingerprint;

  return Object.freeze({
    evidenceId: computeEvidenceId(queueOrder, segmentEntry.segmentId, framePaths, segmentPath),
    segmentId: segmentEntry.segmentId,
    queueOrder,
    cinematicRole: SEGMENT_EVIDENCE_DEFINITIONS[segmentEntry.orderIndex].cinematicRole,
    cinematicPhase: SEGMENT_EVIDENCE_DEFINITIONS[segmentEntry.orderIndex].cinematicPhase,
    emotionalPhase: SEGMENT_EVIDENCE_DEFINITIONS[segmentEntry.orderIndex].emotionalPhase,
    framePaths,
    segmentPath,
    startSeconds: segmentEntry.startSeconds,
    endSeconds: segmentEntry.endSeconds,
    durationSeconds: segmentEntry.durationSeconds,
    extractionFingerprint,
    manifestFingerprint: segmentEntry.manifestEntryFingerprint,
    sourceFingerprint,
    evidenceTimelineIndex,
    evidenceBindingVersion: CINEMATIC_EVIDENCE_BINDING_VERSION,
  });
}

function buildCinematicEvidenceTimeline(items: readonly CinematicEvidenceItem[]): CinematicEvidenceTimeline {
  const entries = Object.freeze(
    [...items]
      .sort((a, b) => a.queueOrder - b.queueOrder)
      .map((item, timelineIndex) =>
        Object.freeze({
          timelineIndex,
          queueOrder: item.queueOrder,
          evidenceId: item.evidenceId,
          segmentId: item.segmentId,
          bindingKind: item.segmentPath === "" ? ("frame-export" as const) : ("segment-export" as const),
        })
      )
  );

  return Object.freeze({
    version: CINEMATIC_EVIDENCE_REGISTRY_VERSION,
    timelineId: CINEMATIC_EVIDENCE_TIMELINE_ID,
    entries,
  });
}

export function buildCinematicEvidenceRegistry(
  segmentManifestSerialization: SegmentManifestSerialization
): CinematicEvidenceRegistry {
  if (cachedCinematicEvidenceRegistry !== null) {
    return cachedCinematicEvidenceRegistry;
  }

  const sourceFingerprint = segmentManifestSerialization.pilotManifestFingerprint;
  const items = Object.freeze(
    segmentManifestSerialization.segments.flatMap((segmentEntry) => [
      buildEvidenceItemForQueue(
        segmentEntry,
        segmentEntry.frameQueueOrder,
        "frame-export",
        sourceFingerprint,
        segmentEntry.orderIndex * 2
      ),
      buildEvidenceItemForQueue(
        segmentEntry,
        segmentEntry.segmentQueueOrder,
        "segment-export",
        sourceFingerprint,
        segmentEntry.orderIndex * 2 + 1
      ),
    ])
  );

  const timeline = buildCinematicEvidenceTimeline(items);
  const serializationFingerprint = computeSegmentManifestSerializationFingerprint(
    segmentManifestSerialization
  );

  const registry = Object.freeze({
    version: CINEMATIC_EVIDENCE_REGISTRY_VERSION,
    registryId: CINEMATIC_EVIDENCE_REGISTRY_ID,
    serializationId: segmentManifestSerialization.serializationId,
    serializationFingerprint,
    multiSegmentExtractionFingerprint: segmentManifestSerialization.multiSegmentExtractionFingerprint,
    registryRoot: CINEMATIC_EVIDENCE_REGISTRY_ROOT,
    activeRegistryState: CINEMATIC_EVIDENCE_REGISTRY_STATE,
    evidenceBindingVersion: CINEMATIC_EVIDENCE_BINDING_VERSION,
    sourceFingerprint,
    timeline,
    items,
  });

  cachedCinematicEvidenceRegistry = registry;
  return registry;
}

export const SEGMENT_MANIFEST_ENTRY_KEY_ORDER = Object.freeze([
  "segmentId",
  "segmentSlug",
  "orderIndex",
  "frameQueueOrder",
  "segmentQueueOrder",
  "framePath",
  "segmentPath",
  "startSeconds",
  "endSeconds",
  "durationSeconds",
  "frameExtractionFingerprint",
  "segmentExtractionFingerprint",
  "manifestEntryFingerprint",
] as const);

export const SEGMENT_MANIFEST_SERIALIZATION_KEY_ORDER = Object.freeze([
  "version",
  "serializationId",
  "multiSegmentExtractionFingerprint",
  "multiFrameExtractionFingerprint",
  "pilotManifestFingerprint",
  "registryRoot",
  "activeSerializationState",
  "segments",
] as const);

export const CINEMATIC_EVIDENCE_ITEM_KEY_ORDER = Object.freeze([
  "evidenceId",
  "segmentId",
  "queueOrder",
  "cinematicRole",
  "cinematicPhase",
  "emotionalPhase",
  "framePaths",
  "segmentPath",
  "startSeconds",
  "endSeconds",
  "durationSeconds",
  "extractionFingerprint",
  "manifestFingerprint",
  "sourceFingerprint",
  "evidenceTimelineIndex",
  "evidenceBindingVersion",
] as const);

export const CINEMATIC_EVIDENCE_TIMELINE_ENTRY_KEY_ORDER = Object.freeze([
  "timelineIndex",
  "queueOrder",
  "evidenceId",
  "segmentId",
  "bindingKind",
] as const);

export const CINEMATIC_EVIDENCE_TIMELINE_KEY_ORDER = Object.freeze([
  "version",
  "timelineId",
  "entries",
] as const);

export const CINEMATIC_EVIDENCE_REGISTRY_KEY_ORDER = Object.freeze([
  "version",
  "registryId",
  "serializationId",
  "serializationFingerprint",
  "multiSegmentExtractionFingerprint",
  "registryRoot",
  "activeRegistryState",
  "evidenceBindingVersion",
  "sourceFingerprint",
  "timeline",
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

export function serializeSegmentManifestSerialization(
  serialization: SegmentManifestSerialization
): string {
  const orderedSegments = [...serialization.segments]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((segment) => orderRecord(segment, SEGMENT_MANIFEST_ENTRY_KEY_ORDER));

  const orderedSerialization: Record<string, unknown> = {};
  for (const key of SEGMENT_MANIFEST_SERIALIZATION_KEY_ORDER) {
    if (key === "segments") {
      orderedSerialization.segments = orderedSegments;
    } else {
      orderedSerialization[key] = serialization[key as keyof SegmentManifestSerialization];
    }
  }

  return JSON.stringify(orderedSerialization);
}

export function computeSegmentManifestSerializationFingerprint(
  serialization: SegmentManifestSerialization
): string {
  return digestValue(serializeSegmentManifestSerialization(serialization));
}

export function serializeCinematicEvidenceRegistry(registry: CinematicEvidenceRegistry): string {
  const orderedItems = [...registry.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => {
      const orderedItem = orderRecord(item, CINEMATIC_EVIDENCE_ITEM_KEY_ORDER);
      orderedItem.framePaths = [...item.framePaths];
      return orderedItem;
    });

  const orderedTimelineEntries = [...registry.timeline.entries]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((entry) => orderRecord(entry, CINEMATIC_EVIDENCE_TIMELINE_ENTRY_KEY_ORDER));

  const orderedTimeline = orderRecord(registry.timeline, CINEMATIC_EVIDENCE_TIMELINE_KEY_ORDER);
  orderedTimeline.entries = orderedTimelineEntries;

  const orderedRegistry: Record<string, unknown> = {};
  for (const key of CINEMATIC_EVIDENCE_REGISTRY_KEY_ORDER) {
    if (key === "items") {
      orderedRegistry.items = orderedItems;
    } else if (key === "timeline") {
      orderedRegistry.timeline = orderedTimeline;
    } else {
      orderedRegistry[key] = registry[key as keyof CinematicEvidenceRegistry];
    }
  }

  return JSON.stringify(orderedRegistry);
}

export function computeCinematicEvidenceRegistryFingerprint(
  registry: CinematicEvidenceRegistry
): string {
  return digestValue(serializeCinematicEvidenceRegistry(registry));
}

export function resetCinematicEvidenceRegistryCacheForVerification(): void {
  cachedSegmentManifestSerialization = null;
  cachedCinematicEvidenceRegistry = null;
}
