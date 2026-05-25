import crypto from "crypto";

export type PilotVideoManifest = {
  version: "v1";
  manifestId: string;
  pilotVideoMode: string;
  canonicalSampleSlotId: string;
  durationSec: number;
  intakeSchemaVersion: string;
  activeIntakeState: string;
  intakeNormalizationScore: number;
  sceneSegments: readonly SceneSegmentStub[];
  frameSamples: readonly FrameSampleStub[];
  evidence: readonly IntakeEvidenceStub[];
};

export type SceneSegmentStub = {
  segmentId: string;
  segmentSlug: string;
  orderIndex: number;
  startSec: number;
  endSec: number;
  durationSec: number;
  continuityState: string;
};

export type FrameSampleStub = {
  frameSampleId: string;
  segmentId: string;
  sampleIndex: number;
  offsetSec: number;
  sampleKind: string;
  extractionState: string;
};

export type IntakeEvidenceStub = {
  evidenceId: string;
  evidenceKind: string;
  linkedSegmentId: string;
  evidenceState: string;
  normalizationScore: number;
};

export const PILOT_VIDEO_MANIFEST_VERSION = "v1" as const;
export const PILOT_INTAKE_SCHEMA_VERSION = "pilot-intake-schema-v1" as const;
export const PILOT_VIDEO_MODE = "single-25s" as const;
export const PILOT_CANONICAL_SAMPLE_SLOT_ID = "gonegi-harbor-pilot-25s-slot-001" as const;
export const PILOT_VIDEO_DURATION_SEC = 25 as const;

const PILOT_SCENE_SEGMENT_DEFINITIONS = Object.freeze([
  Object.freeze({
    segmentSlug: "harbor-opening-hold",
    orderIndex: 0,
    startSec: 0,
    endSec: 8,
    durationSec: 8,
    continuityState: "continuity-safe-harbor-opening",
  }),
  Object.freeze({
    segmentSlug: "protagonist-arrival-mid",
    orderIndex: 1,
    startSec: 8,
    endSec: 17,
    durationSec: 9,
    continuityState: "continuity-safe-protagonist-arrival",
  }),
  Object.freeze({
    segmentSlug: "warm-glaze-final-echo",
    orderIndex: 2,
    startSec: 17,
    endSec: 25,
    durationSec: 8,
    continuityState: "continuity-safe-warm-glaze-echo",
  }),
] as const);

const PILOT_FRAME_SAMPLE_DEFINITIONS = Object.freeze([
  Object.freeze({
    segmentOrderIndex: 0,
    sampleIndex: 0,
    offsetSec: 4,
    sampleKind: "segment-midpoint-hold",
    extractionState: "frame-sample-stub-without-extraction",
  }),
  Object.freeze({
    segmentOrderIndex: 1,
    sampleIndex: 1,
    offsetSec: 12.5,
    sampleKind: "segment-midpoint-arrival",
    extractionState: "frame-sample-stub-without-extraction",
  }),
  Object.freeze({
    segmentOrderIndex: 2,
    sampleIndex: 2,
    offsetSec: 21,
    sampleKind: "segment-midpoint-echo",
    extractionState: "frame-sample-stub-without-extraction",
  }),
] as const);

const PILOT_INTAKE_EVIDENCE_DEFINITIONS = Object.freeze([
  Object.freeze({
    segmentOrderIndex: 0,
    evidenceKind: "segment-boundary-intake",
    evidenceState: "intake-evidence-stub-ready",
    normalizationScore: 0.852333,
  }),
  Object.freeze({
    segmentOrderIndex: 1,
    evidenceKind: "continuity-bridge-intake",
    evidenceState: "intake-evidence-stub-ready",
    normalizationScore: 0.855333,
  }),
  Object.freeze({
    segmentOrderIndex: 2,
    evidenceKind: "segment-closure-intake",
    evidenceState: "intake-evidence-stub-ready",
    normalizationScore: 0.858333,
  }),
] as const);

function buildSegmentId(orderIndex: number): string {
  return `segment-${String(orderIndex + 1).padStart(3, "0")}`;
}

function buildFrameSampleId(sampleIndex: number): string {
  return `frame-sample-${String(sampleIndex + 1).padStart(3, "0")}`;
}

function buildIntakeEvidenceId(orderIndex: number): string {
  return `intake-evidence-${String(orderIndex + 1).padStart(3, "0")}`;
}

function buildSceneSegmentStub(
  definition: (typeof PILOT_SCENE_SEGMENT_DEFINITIONS)[number]
): SceneSegmentStub {
  return Object.freeze({
    segmentId: buildSegmentId(definition.orderIndex),
    segmentSlug: definition.segmentSlug,
    orderIndex: definition.orderIndex,
    startSec: definition.startSec,
    endSec: definition.endSec,
    durationSec: definition.durationSec,
    continuityState: definition.continuityState,
  });
}

function buildFrameSampleStub(
  definition: (typeof PILOT_FRAME_SAMPLE_DEFINITIONS)[number],
  segmentId: string
): FrameSampleStub {
  return Object.freeze({
    frameSampleId: buildFrameSampleId(definition.sampleIndex),
    segmentId,
    sampleIndex: definition.sampleIndex,
    offsetSec: definition.offsetSec,
    sampleKind: definition.sampleKind,
    extractionState: definition.extractionState,
  });
}

function buildIntakeEvidenceStub(
  definition: (typeof PILOT_INTAKE_EVIDENCE_DEFINITIONS)[number],
  segmentId: string
): IntakeEvidenceStub {
  return Object.freeze({
    evidenceId: buildIntakeEvidenceId(definition.segmentOrderIndex),
    evidenceKind: definition.evidenceKind,
    linkedSegmentId: segmentId,
    evidenceState: definition.evidenceState,
    normalizationScore: definition.normalizationScore,
  });
}

export function buildPilotVideoManifest(): PilotVideoManifest {
  const sceneSegments = Object.freeze(
    [...PILOT_SCENE_SEGMENT_DEFINITIONS]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((definition) => buildSceneSegmentStub(definition))
  );

  const segmentIdByOrder = Object.freeze(
    Object.fromEntries(sceneSegments.map((segment) => [segment.orderIndex, segment.segmentId]))
  );

  const frameSamples = Object.freeze(
    [...PILOT_FRAME_SAMPLE_DEFINITIONS]
      .sort((a, b) => a.sampleIndex - b.sampleIndex)
      .map((definition) =>
        buildFrameSampleStub(definition, segmentIdByOrder[definition.segmentOrderIndex])
      )
  );

  const evidence = Object.freeze(
    [...PILOT_INTAKE_EVIDENCE_DEFINITIONS]
      .sort((a, b) => a.segmentOrderIndex - b.segmentOrderIndex)
      .map((definition) =>
        buildIntakeEvidenceStub(definition, segmentIdByOrder[definition.segmentOrderIndex])
      )
  );

  return Object.freeze({
    version: PILOT_VIDEO_MANIFEST_VERSION,
    manifestId: "pilot-video-manifest-gonegi-harbor-25s-v1",
    pilotVideoMode: PILOT_VIDEO_MODE,
    canonicalSampleSlotId: PILOT_CANONICAL_SAMPLE_SLOT_ID,
    durationSec: PILOT_VIDEO_DURATION_SEC,
    intakeSchemaVersion: PILOT_INTAKE_SCHEMA_VERSION,
    activeIntakeState: "25s-pilot-intake-schema-ready-without-file-processing",
    intakeNormalizationScore: 0.852333,
    sceneSegments,
    frameSamples,
    evidence,
  });
}

export const PILOT_VIDEO_MANIFEST_KEY_ORDER = Object.freeze([
  "version",
  "manifestId",
  "pilotVideoMode",
  "canonicalSampleSlotId",
  "durationSec",
  "intakeSchemaVersion",
  "activeIntakeState",
  "intakeNormalizationScore",
  "sceneSegments",
  "frameSamples",
  "evidence",
] as const);

export const SCENE_SEGMENT_STUB_KEY_ORDER = Object.freeze([
  "segmentId",
  "segmentSlug",
  "orderIndex",
  "startSec",
  "endSec",
  "durationSec",
  "continuityState",
] as const);

export const FRAME_SAMPLE_STUB_KEY_ORDER = Object.freeze([
  "frameSampleId",
  "segmentId",
  "sampleIndex",
  "offsetSec",
  "sampleKind",
  "extractionState",
] as const);

export const INTAKE_EVIDENCE_STUB_KEY_ORDER = Object.freeze([
  "evidenceId",
  "evidenceKind",
  "linkedSegmentId",
  "evidenceState",
  "normalizationScore",
] as const);

function orderRecord<T extends Record<string, unknown>>(item: T, keyOrder: readonly string[]): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializePilotVideoManifest(manifest: PilotVideoManifest): string {
  const orderedSceneSegments = [...manifest.sceneSegments]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((segment) => orderRecord(segment, SCENE_SEGMENT_STUB_KEY_ORDER));

  const orderedFrameSamples = [...manifest.frameSamples]
    .sort((a, b) => a.sampleIndex - b.sampleIndex)
    .map((sample) => orderRecord(sample, FRAME_SAMPLE_STUB_KEY_ORDER));

  const orderedEvidence = [...manifest.evidence]
    .sort((a, b) => a.evidenceId.localeCompare(b.evidenceId))
    .map((item) => orderRecord(item, INTAKE_EVIDENCE_STUB_KEY_ORDER));

  const orderedManifest: Record<string, unknown> = {};
  for (const key of PILOT_VIDEO_MANIFEST_KEY_ORDER) {
    if (key === "sceneSegments") {
      orderedManifest.sceneSegments = orderedSceneSegments;
    } else if (key === "frameSamples") {
      orderedManifest.frameSamples = orderedFrameSamples;
    } else if (key === "evidence") {
      orderedManifest.evidence = orderedEvidence;
    } else {
      orderedManifest[key] = manifest[key as keyof PilotVideoManifest];
    }
  }

  return JSON.stringify(orderedManifest);
}

export function computePilotVideoManifestFingerprint(manifest: PilotVideoManifest): string {
  return crypto.createHash("sha256").update(serializePilotVideoManifest(manifest)).digest("hex");
}
