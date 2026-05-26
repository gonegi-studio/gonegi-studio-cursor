import crypto from "crypto";
import {
  REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE,
} from "./real-image-app-input-package.ts";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import type { RealMusicDramaFunction } from "./real-music-drama-scene-plan.ts";
import { REAL_VIDEO_INTAKE_SOURCE_FILENAME } from "./real-video-intake-manifest.ts";

export type RealV826CinematicDnaExportRecord = {
  id: string;
  schema_version: typeof REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION;
  schema_signature: typeof REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE;
  schema_meta: {
    latent_engine: string;
    vector_semantics: "evidence_grounded_logic";
    revision: number;
    production_ready: boolean;
    perception_mode: string;
  };
  analysis_timestamp: string;
  source_hash: string;
  core_dna_id: string;
  category: string;
  scene_indexing: {
    scene_id: string;
    source_material: string;
    shot_purpose: readonly string[];
    director_family: string;
    v_timestamp_start: number;
    v_timestamp_end: number;
    director_signature_id: string;
  };
  generative_layer: {
    midjourney: string;
    runway: string;
    kling: string;
    prompt_compression_ratio: number;
  };
  layers: {
    raw_semantic: {
      visual_description: string;
      raw_tags: readonly string[];
      provenance_notes: string;
    };
    scene_language: {
      cinematography_tokens: readonly string[];
      narrative_tokens: readonly string[];
      emotion_tokens: readonly string[];
      dsl_version: string;
    };
  };
  scene_state: {
    physics: {
      motion_density: { value: number; confidence: number; source: string; reasoning: string };
      luminance_balance: { value: number; confidence: number; source: string; reasoning: string };
    };
    emotion: {
      valence_bias: { value: number; confidence: number; source: string; reasoning: string };
      isolation_score: { value: number; confidence: number; source: string; reasoning: string };
    };
  };
  director_dna: {
    camera_motion: {
      continuous_motion: { value: number; confidence: number; source: string; reasoning: string };
    };
    composition_logic: {
      subject_isolation: { value: number; confidence: number; source: string; reasoning: string };
    };
    visual_style: {
      color_palette_intent: string;
      dominant_palette: readonly string[];
    };
  };
  visual_atoms: readonly [];
  relationship_graph: readonly [];
  sequence_graph: {
    previous_node: string;
    current_node: string;
    next_candidates: readonly { id: string; probability: number }[];
    transition_logic: {
      energy_delta: number;
      camera_flow_vector: readonly [number, number];
      emotion_continuity: number;
    };
  };
  confidence_profile: {
    aggregate_certainty: number;
    inference_depth: number;
    semantic_confidence: number;
  };
};

export type RealV826CinematicDnaExportAdapter = readonly RealV826CinematicDnaExportRecord[];

export type RealV826CinematicDnaExportDownload = {
  filename: typeof REAL_V826_CINEMATIC_DNA_EXPORT_FILENAME;
  contentType: "application/json";
  body: string;
  exportFingerprint: string;
};

export const REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION = "v82.6" as const;
export const REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE =
  "CINEMATIC-WORLD-STATE-ENGINE-UNIFIED-V82.6" as const;
export const REAL_V826_CINEMATIC_DNA_EXPORT_FILENAME =
  "kiki-25s-v826-cinematic-dna-export.json" as const;
export const REAL_V826_CINEMATIC_DNA_EXPORT_KIND_VERSION =
  "real-v826-cinematic-dna-export-adapter-v1" as const;
export const REAL_V826_CINEMATIC_DNA_EXPORT_ITEM_COUNT = 3 as const;
export const REAL_V826_CINEMATIC_DNA_EXPORT_FRAME_QUEUE_MAX = 2 as const;
export const REAL_V826_CINEMATIC_DNA_EXPORT_SOURCE_MATERIAL = REAL_VIDEO_INTAKE_SOURCE_FILENAME;
export const REAL_V826_CINEMATIC_DNA_EXPORT_DIRECTOR_FAMILY =
  "Ghibli-Harbor-Real-Frame" as const;

export const REAL_V826_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER = Object.freeze([
  "id",
  "schema_version",
  "schema_signature",
  "schema_meta",
  "analysis_timestamp",
  "source_hash",
  "core_dna_id",
  "category",
  "scene_indexing",
  "generative_layer",
  "layers",
  "scene_state",
  "director_dna",
  "visual_atoms",
  "relationship_graph",
  "sequence_graph",
  "confidence_profile",
] as const);

export const REAL_V826_RECORD_PROFILES = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    category: "ESTABLISH",
    shotPurpose: Object.freeze(["real-frame-establish", "visual-anchor"]),
    timestampEndSeconds: 12.5,
    motionDensity: 0.18,
    luminanceBalance: 0.62,
    valenceBias: 0.72,
    isolationScore: 0.28,
    continuousMotion: 0.12,
    subjectIsolation: 0.82,
    energyDelta: 0.35,
    emotionContinuity: 0.88,
  }),
  Object.freeze({
    queueOrder: 1,
    category: "BRIDGE",
    shotPurpose: Object.freeze(["real-frame-bridge", "motion-bridge"]),
    timestampEndSeconds: 21.0,
    motionDensity: 0.42,
    luminanceBalance: 0.58,
    valenceBias: 0.64,
    isolationScore: 0.36,
    continuousMotion: 0.38,
    subjectIsolation: 0.68,
    energyDelta: 0.12,
    emotionContinuity: 0.91,
  }),
  Object.freeze({
    queueOrder: 2,
    category: "RESOLVE",
    shotPurpose: Object.freeze(["real-frame-resolve", "emotional-anchor"]),
    timestampEndSeconds: 25.0,
    motionDensity: 0.14,
    luminanceBalance: 0.66,
    valenceBias: 0.78,
    isolationScore: 0.22,
    continuousMotion: 0.08,
    subjectIsolation: 0.86,
    energyDelta: -0.18,
    emotionContinuity: 0.94,
  }),
] as const);

const REAL_V826_TIMESTAMP_END_BY_QUEUE = Object.freeze([12.5, 21.0, 25.0] as const);

let cachedRealV826CinematicDnaExportAdapter: RealV826CinematicDnaExportAdapter | null = null;
let cachedRealV826CinematicDnaExportDownload: RealV826CinematicDnaExportDownload | null = null;

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

function resolveRecordProfile(queueOrder: number) {
  const profile = REAL_V826_RECORD_PROFILES.find((entry) => entry.queueOrder === queueOrder);
  if (profile === undefined) {
    throw new Error(`Unknown real v826 record profile for queueOrder=${queueOrder}`);
  }
  return profile;
}

function buildSceneNodeId(queueOrder: number): string {
  return `SCENE-KIKI-REAL-25S-${String(queueOrder).padStart(3, "0")}`;
}

function computeRecordId(item: RealImageAppInputPackageItem): string {
  return digestValue(
    [
      REAL_V826_CINEMATIC_DNA_EXPORT_KIND_VERSION,
      "v826-record",
      String(item.queueOrder),
      item.sceneId,
      item.frameEvidenceId,
      item.frameFingerprint,
    ].join("|")
  );
}

function computeCoreDnaId(item: RealImageAppInputPackageItem): string {
  return digestValue(
    [
      REAL_V826_CINEMATIC_DNA_EXPORT_KIND_VERSION,
      "core-dna",
      item.sceneId,
      item.dramaFunction,
      item.frameFingerprint,
    ].join("|")
  );
}

function buildDeterministicAnalysisTimestamp(recordId: string): string {
  return `2026-01-01T00:00:00.${recordId.slice(0, 3)}Z`;
}

function buildGenerativeLayer(
  item: RealImageAppInputPackageItem
): RealV826CinematicDnaExportRecord["generative_layer"] {
  return Object.freeze({
    midjourney: `Kiki 25s real frame ${item.dramaFunction}, ${item.emotionTone}, ${item.rhythmPhase}, ${item.suggestedMusicEnergy} --ar 16:9 --style raw`,
    runway: `Real extracted frame at ${item.timestampSeconds}s, ${item.emotionTone}, ${item.dramaFunction}, metadata-only reference.`,
    kling: `Studio Ghibli harbor aesthetic, ${item.emotionTone}, ${item.dramaFunction}, real frame evidence.`,
    prompt_compression_ratio: 0.42,
  });
}

function buildSequenceGraph(
  queueOrder: number,
  sceneNodeId: string,
  profile: (typeof REAL_V826_RECORD_PROFILES)[number]
): RealV826CinematicDnaExportRecord["sequence_graph"] {
  const previousNode =
    queueOrder === 0 ? "REAL-KIKI-25S-ROOT" : buildSceneNodeId(queueOrder - 1);
  const nextCandidates =
    queueOrder === REAL_V826_CINEMATIC_DNA_EXPORT_FRAME_QUEUE_MAX
      ? Object.freeze([] as const)
      : Object.freeze([
          Object.freeze({
            id: buildSceneNodeId(queueOrder + 1),
            probability: 1,
          }),
        ]);

  return Object.freeze({
    previous_node: previousNode,
    current_node: sceneNodeId,
    next_candidates: nextCandidates,
    transition_logic: Object.freeze({
      energy_delta: profile.energyDelta,
      camera_flow_vector: Object.freeze([0, 0] as const),
      emotion_continuity: profile.emotionContinuity,
    }),
  });
}

function buildV826Record(
  item: RealImageAppInputPackageItem,
  realInputPackageId: string
): RealV826CinematicDnaExportRecord {
  const profile = resolveRecordProfile(item.queueOrder);
  const recordId = computeRecordId(item);
  const sceneNodeId = buildSceneNodeId(item.queueOrder);
  const timestampStart = Number.parseFloat(item.timestampSeconds);
  const timestampEnd = REAL_V826_TIMESTAMP_END_BY_QUEUE[item.queueOrder] ?? profile.timestampEndSeconds;

  return Object.freeze({
    id: recordId,
    schema_version: REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION,
    schema_signature: REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE,
    schema_meta: Object.freeze({
      latent_engine: "real-frame-metadata-v826",
      vector_semantics: "evidence_grounded_logic" as const,
      revision: 1,
      production_ready: true,
      perception_mode: "real-mp4-frame-evidence",
    }),
    analysis_timestamp: buildDeterministicAnalysisTimestamp(recordId),
    source_hash: item.frameFingerprint,
    core_dna_id: computeCoreDnaId(item),
    category: profile.category,
    scene_indexing: Object.freeze({
      scene_id: sceneNodeId,
      source_material: REAL_V826_CINEMATIC_DNA_EXPORT_SOURCE_MATERIAL,
      shot_purpose: profile.shotPurpose,
      director_family: REAL_V826_CINEMATIC_DNA_EXPORT_DIRECTOR_FAMILY,
      v_timestamp_start: timestampStart,
      v_timestamp_end: timestampEnd,
      director_signature_id: digestValue(
        [realInputPackageId, sceneNodeId, item.frameEvidenceId].join("|")
      ).slice(0, 16),
    }),
    generative_layer: buildGenerativeLayer(item),
    layers: Object.freeze({
      raw_semantic: Object.freeze({
        visual_description: `Real 25s reference frame at ${item.timestampSeconds}s (${item.dramaFunction}).`,
        raw_tags: Object.freeze([
          item.dramaFunction,
          item.emotionTone,
          item.rhythmPhase,
          item.suggestedMusicEnergy,
        ]),
        provenance_notes: "real-frame-evidence-metadata-only",
      }),
      scene_language: Object.freeze({
        cinematography_tokens: Object.freeze([item.rhythmPhase, item.suggestedMusicEnergy]),
        narrative_tokens: Object.freeze([item.dramaFunction]),
        emotion_tokens: Object.freeze([item.emotionTone]),
        dsl_version: "5.1.0",
      }),
    }),
    scene_state: Object.freeze({
      physics: Object.freeze({
        motion_density: Object.freeze({
          value: profile.motionDensity,
          confidence: 0.92,
          source: "metadata",
          reasoning: `${item.rhythmPhase} rhythm phase`,
        }),
        luminance_balance: Object.freeze({
          value: profile.luminanceBalance,
          confidence: 0.9,
          source: "metadata",
          reasoning: `${item.dramaFunction} frame profile`,
        }),
      }),
      emotion: Object.freeze({
        valence_bias: Object.freeze({
          value: profile.valenceBias,
          confidence: 0.88,
          source: "metadata",
          reasoning: item.emotionTone,
        }),
        isolation_score: Object.freeze({
          value: profile.isolationScore,
          confidence: 0.86,
          source: "metadata",
          reasoning: item.dramaFunction,
        }),
      }),
    }),
    director_dna: Object.freeze({
      camera_motion: Object.freeze({
        continuous_motion: Object.freeze({
          value: profile.continuousMotion,
          confidence: 0.9,
          source: "metadata",
          reasoning: item.rhythmPhase,
        }),
      }),
      composition_logic: Object.freeze({
        subject_isolation: Object.freeze({
          value: profile.subjectIsolation,
          confidence: 0.91,
          source: "metadata",
          reasoning: item.dramaFunction,
        }),
      }),
      visual_style: Object.freeze({
        color_palette_intent: "warm-harbor-evening",
        dominant_palette: Object.freeze(["#F4D03F", "#5DADE2", "#1B4F72"]),
      }),
    }),
    visual_atoms: Object.freeze([] as const),
    relationship_graph: Object.freeze([] as const),
    sequence_graph: buildSequenceGraph(item.queueOrder, sceneNodeId, profile),
    confidence_profile: Object.freeze({
      aggregate_certainty: 0.94,
      inference_depth: 0.12,
      semantic_confidence: 0.91,
    }),
  });
}

export function buildRealV826CinematicDnaExportAdapter(
  realImageAppInputPackage: RealImageAppInputPackage
): RealV826CinematicDnaExportAdapter {
  if (cachedRealV826CinematicDnaExportAdapter !== null) {
    return cachedRealV826CinematicDnaExportAdapter;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real v826 cinematic dna export requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_V826_CINEMATIC_DNA_EXPORT_ITEM_COUNT) {
    throw new Error("Real v826 cinematic dna export requires three input package items");
  }

  const queueOrders = orderedItems.map((item) => item.queueOrder);
  if (queueOrders.join(",") !== "0,1,2") {
    throw new Error("Real v826 cinematic dna export requires queue order zero through two");
  }

  const records = Object.freeze(
    orderedItems.map((item) =>
      buildV826Record(item, realImageAppInputPackage.realInputPackageId)
    )
  );

  cachedRealV826CinematicDnaExportAdapter = records;
  return records;
}

export function serializeRealV826CinematicDnaExportAdapter(
  adapter: RealV826CinematicDnaExportAdapter
): string {
  const orderedRecords = [...adapter]
    .sort((a, b) => a.scene_indexing.v_timestamp_start - b.scene_indexing.v_timestamp_start)
    .map((record) =>
      orderRecord(record as unknown as Record<string, unknown>, REAL_V826_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER)
    );

  return JSON.stringify(orderedRecords, null, 2);
}

export function computeRealV826CinematicDnaExportAdapterFingerprint(
  adapter: RealV826CinematicDnaExportAdapter
): string {
  return digestValue(serializeRealV826CinematicDnaExportAdapter(adapter));
}

export function buildRealV826CinematicDnaExportDownloadFromAdapter(
  adapter: RealV826CinematicDnaExportAdapter
): RealV826CinematicDnaExportDownload {
  return Object.freeze({
    filename: REAL_V826_CINEMATIC_DNA_EXPORT_FILENAME,
    contentType: "application/json",
    body: serializeRealV826CinematicDnaExportAdapter(adapter),
    exportFingerprint: computeRealV826CinematicDnaExportAdapterFingerprint(adapter),
  });
}

export function buildRealV826CinematicDnaExportDownloadFromPackage(
  realImageAppInputPackage: RealImageAppInputPackage
): RealV826CinematicDnaExportDownload {
  return buildRealV826CinematicDnaExportDownloadFromAdapter(
    buildRealV826CinematicDnaExportAdapter(realImageAppInputPackage)
  );
}

export function buildRealV826CinematicDnaExportDownload(): RealV826CinematicDnaExportDownload {
  if (cachedRealV826CinematicDnaExportDownload !== null) {
    return cachedRealV826CinematicDnaExportDownload;
  }

  const download = buildRealV826CinematicDnaExportDownloadFromPackage(
    REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE as RealImageAppInputPackage
  );
  cachedRealV826CinematicDnaExportDownload = download;
  return download;
}

export function resetRealV826CinematicDnaExportAdapterCacheForVerification(): void {
  cachedRealV826CinematicDnaExportAdapter = null;
  cachedRealV826CinematicDnaExportDownload = null;
}

export function resolveRealV826CategoryForDramaFunction(
  dramaFunction: RealMusicDramaFunction
): string | null {
  const profile = REAL_V826_RECORD_PROFILES.find((entry) =>
    entry.shotPurpose.includes(dramaFunction)
  );
  return profile?.category ?? null;
}
