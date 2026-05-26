import crypto from "crypto";
import {
  REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE,
} from "./real-image-app-input-package.ts";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import type { RealMusicDramaFunction } from "./real-music-drama-scene-plan.ts";
import {
  REAL_V826_CINEMATIC_DNA_EXPORT_DIRECTOR_FAMILY,
  REAL_V826_CINEMATIC_DNA_EXPORT_FRAME_QUEUE_MAX,
  REAL_V826_CINEMATIC_DNA_EXPORT_ITEM_COUNT,
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE,
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION,
  REAL_V826_CINEMATIC_DNA_EXPORT_SOURCE_MATERIAL,
  REAL_V826_RECORD_PROFILES,
} from "./real-v826-cinematic-dna-export-adapter.ts";

type GroundedScalar<T> = Readonly<{
  value: T;
  confidence: number;
  source: string;
  reasoning: string;
}>;

export type RealV826DenseCinematicDnaExportRecord = {
  id: string;
  schema_version: typeof REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION;
  schema_signature: typeof REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE;
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
      luminance_contrast: GroundedScalar<number>;
      motion_density: GroundedScalar<number>;
      depth_isolation: GroundedScalar<number>;
      camera_velocity_mps: GroundedScalar<number>;
      subject_distance_meter: GroundedScalar<number>;
      luminance_balance: GroundedScalar<number>;
      chroma_intensity: GroundedScalar<number>;
    };
    emotion: {
      dread: GroundedScalar<number>;
      melancholy: GroundedScalar<number>;
      anticipation: GroundedScalar<number>;
      intimacy: GroundedScalar<number>;
      arousal_rate: GroundedScalar<number>;
      valence_bias: GroundedScalar<number>;
      catharsis_ready: GroundedScalar<number>;
      isolation_score: GroundedScalar<number>;
    };
    temporal: {
      time_tension_curve: GroundedScalar<string>;
      rhythm_pressure: GroundedScalar<number>;
      pacing_memory: GroundedScalar<number>;
      pacing_waveform: readonly number[];
      shot_memory: GroundedScalar<number>;
      scene_memory: GroundedScalar<number>;
      emotional_afterimage: GroundedScalar<number>;
    };
    optics: {
      sensor_alias: GroundedScalar<string>;
      focal_length_mm: GroundedScalar<number>;
      aperture_f_stop: GroundedScalar<number>;
      halation_response: GroundedScalar<number>;
      grain_profile: GroundedScalar<string>;
    };
  };
  latent_steering: {
    vectors: {
      semantic_16d: Readonly<Record<string, number>>;
    };
    legacy_spaces: {
      cinematic_latent_embeddings_v2: readonly number[];
    };
    engine_adapters: {
      midjourney: {
        engine_params: {
          aspect_ratio: string;
          stylize: number;
          chaos: number;
        };
      };
    };
  };
  director_dna: {
    camera_motion: {
      continuous_motion: GroundedScalar<number>;
      human_tracking_bias: GroundedScalar<number>;
      kinetic_aggression: GroundedScalar<number>;
      static_patience: GroundedScalar<number>;
    };
    lens_behavior: {
      focal_range: GroundedScalar<readonly [number, number]>;
      distortion_acceptance: GroundedScalar<number>;
      optical_abstraction: GroundedScalar<number>;
      bokeh_texture: GroundedScalar<string>;
    };
    lighting_behavior: {
      naturalism_index: GroundedScalar<number>;
      shadow_density: GroundedScalar<number>;
      atmospheric_occlusion: GroundedScalar<number>;
      color_drift: GroundedScalar<number>;
    };
    composition_logic: {
      rule_of_thirds: GroundedScalar<number>;
      subject_isolation: GroundedScalar<number>;
      spatial_honesty: GroundedScalar<number>;
      symmetry_bias: GroundedScalar<number>;
      negative_space_ratio: GroundedScalar<number>;
      symmetry_score: GroundedScalar<number>;
      dominance: {
        layer_priority: "front" | "middle" | "back";
        frame_occupancy_ratio: number;
        depth_isolation_lock: boolean;
        subject_focus_score: number;
      };
    };
    editing_pacing: {
      avg_shot_duration: GroundedScalar<number>;
      rhythm_uniformity: GroundedScalar<number>;
      montage_intensity: GroundedScalar<number>;
      cut_pressure: GroundedScalar<number>;
      rhythm_anchors: readonly string[];
    };
    style_normalization: {
      ghibli_base: number;
      modern_shinkai: number;
      live_fidelity: number;
      normalized_sum: number;
    };
    visual_style: {
      color_palette_intent: string;
      contrast_philosophy: string;
      dominant_palette: readonly string[];
      lighting_type: string;
    };
    director_grammar: {
      pacing_philosophy: GroundedScalar<string>;
      framing_rhythm: GroundedScalar<string>;
      transition_grammar: GroundedScalar<string>;
      emotional_escalation_logic: GroundedScalar<string>;
      spatial_blocking_signatures: GroundedScalar<string>;
    };
  };
  visual_atoms: readonly {
    atom_id: string;
    label: string;
    coordinate_box: readonly [number, number, number, number];
    significance: number;
    material_properties: {
      surface_type: string;
      roughness: number;
      reflectivity: number;
      degradation: number;
    };
    spatial_intelligence: {
      screen_position: string;
      depth_layer: "foreground" | "midground" | "background";
      framing: "ECU" | "CU" | "MCU" | "MS" | "MLS" | "LS" | "ELS" | "FS";
      camera_relation: string;
      focus_priority: number;
    };
    semantic_role: string;
  }[];
  relationship_graph: readonly {
    subject: string;
    predicate: string;
    object: string;
    weight: number;
  }[];
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
  production_v72: {
    orchestrator: {
      active_engine: "local_sim";
      render_queue_pos: number;
      estimated_completion: string;
      engine_health_score: number;
    };
    continuity_controller: {
      character_persistence: GroundedScalar<number>;
      camera_path_continuity: GroundedScalar<number>;
      lighting_consistency: GroundedScalar<number>;
      emotion_drift_locked: boolean;
      overall_continuity_score: number;
    };
    autonomous_quality_loop: {
      loop_iteration: number;
      last_correction_instruction: string;
      quality_trend: "improving" | "stable" | "degrading";
      auto_finalize_ready: boolean;
    };
    subject_composition: {
      type: "S" | "M" | "L";
      primary_subject_count: GroundedScalar<number>;
      supporting_population: GroundedScalar<number>;
      animal_population: GroundedScalar<number>;
      social_density: GroundedScalar<number>;
    };
    relationship_dynamics: {
      trust: GroundedScalar<number>;
      emotional_distance: GroundedScalar<number>;
      protective_instinct: GroundedScalar<number>;
      suppression: GroundedScalar<number>;
      reunion_tension: GroundedScalar<number | null>;
      guilt_devotion: GroundedScalar<number>;
    };
    situation_state: {
      scenario_type:
        | "farewell_before_departure"
        | "secret_revealed"
        | "reunion_after_separation"
        | "everyday_peace"
        | "pre_confession";
      urgency: GroundedScalar<number>;
      irreversibility: GroundedScalar<number>;
      emotional_pressure: GroundedScalar<number>;
      logical_precedents: readonly string[];
    };
    temporal_bridge: {
      inherits_motion_from: string;
      gaze_vector_continuity: GroundedScalar<number>;
      emotional_decay_tau: GroundedScalar<number>;
      spatial_anchor_offset: readonly [number, number, number];
      gaze_carry_over: GroundedScalar<number>;
      emotional_residue: GroundedScalar<number>;
    };
    spectator_state: {
      tension: GroundedScalar<number>;
      anticipation: GroundedScalar<number>;
      perceptual_intimacy: GroundedScalar<number>;
      narrative_immersion_index: GroundedScalar<number>;
    };
  };
};

export type RealV826DenseCinematicDnaExportAdapter = readonly RealV826DenseCinematicDnaExportRecord[];

export type RealV826DenseCinematicDnaExportDownload = {
  filename: typeof REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_FILENAME;
  contentType: "application/json";
  body: string;
  exportFingerprint: string;
};

export const REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION =
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION;
export const REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE =
  REAL_V826_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE;
export const REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_FILENAME =
  "kiki-25s-v826-dense-cinematic-dna-export.json" as const;
export const REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_KIND_VERSION =
  "real-v826-dense-cinematic-dna-export-adapter-v1" as const;

export const REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER = Object.freeze([
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
  "latent_steering",
  "director_dna",
  "visual_atoms",
  "relationship_graph",
  "sequence_graph",
  "confidence_profile",
  "production_v72",
] as const);

const REAL_V826_DENSE_TIMESTAMP_END_BY_QUEUE = Object.freeze([12.5, 21.0, 25.0] as const);

const REAL_V826_DENSE_RECORD_PROFILES = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    luminanceContrast: 0.48,
    depthIsolation: 0.74,
    cameraVelocityMps: 0.09,
    subjectDistanceMeter: 14.5,
    chromaIntensity: 0.68,
    dread: 0.08,
    melancholy: 0.52,
    anticipation: 0.71,
    intimacy: 0.58,
    arousalRate: 0.22,
    catharsisReady: 0.18,
    timeTensionCurve: "rising-gentle",
    rhythmPressure: 0.38,
    pacingMemory: 0.84,
    pacingWaveform: Object.freeze([0.18, 0.28, 0.42, 0.55] as const),
    shotMemory: 0.72,
    sceneMemory: 0.68,
    emotionalAfterimage: 0.24,
    focalLengthMm: 28,
    apertureFStop: 4.0,
    halationResponse: 0.22,
    grainProfile: "soft-cel",
    humanTrackingBias: 0.88,
    kineticAggression: 0.04,
    staticPatience: 0.92,
    focalRangeLow: 24,
    focalRangeHigh: 35,
    distortionAcceptance: 0.12,
    opticalAbstraction: 0.08,
    bokehTexture: "gentle-round",
    naturalismIndex: 0.94,
    shadowDensity: 0.32,
    atmosphericOcclusion: 0.18,
    colorDrift: 0.06,
    ruleOfThirds: 0.82,
    spatialHonesty: 0.91,
    symmetryBias: 0.44,
    negativeSpaceRatio: 0.28,
    symmetryScore: 0.52,
    frameOccupancyRatio: 0.58,
    layerPriority: "middle" as const,
    avgShotDuration: 8.5,
    rhythmUniformity: 0.86,
    montageIntensity: 0.12,
    cutPressure: 0.08,
    contrastPhilosophy: "warm-evening-soft",
    lightingType: "golden-hour-diffused",
    pacingPhilosophy: "gentle-establishment",
    framingRhythm: "wide-to-mid-breathe",
    transitionGrammar: "dissolve-friendly",
    emotionalEscalation: "nostalgic-build",
    spatialBlocking: "harbor-horizon-anchor",
    scenarioType: "everyday_peace" as const,
    urgency: 0.18,
    irreversibility: 0.12,
    emotionalPressure: 0.28,
    stylize: 180,
    chaos: 8,
  }),
  Object.freeze({
    queueOrder: 1,
    luminanceContrast: 0.52,
    depthIsolation: 0.68,
    cameraVelocityMps: 0.22,
    subjectDistanceMeter: 9.2,
    chromaIntensity: 0.72,
    dread: 0.05,
    melancholy: 0.28,
    anticipation: 0.78,
    intimacy: 0.62,
    arousalRate: 0.38,
    catharsisReady: 0.42,
    timeTensionCurve: "sustained-flow",
    rhythmPressure: 0.52,
    pacingMemory: 0.88,
    pacingWaveform: Object.freeze([0.42, 0.48, 0.52, 0.55] as const),
    shotMemory: 0.81,
    sceneMemory: 0.76,
    emotionalAfterimage: 0.36,
    focalLengthMm: 50,
    apertureFStop: 2.8,
    halationResponse: 0.16,
    grainProfile: "fine-anime",
    humanTrackingBias: 0.92,
    kineticAggression: 0.18,
    staticPatience: 0.74,
    focalRangeLow: 35,
    focalRangeHigh: 70,
    distortionAcceptance: 0.08,
    opticalAbstraction: 0.12,
    bokehTexture: "creamy-soft",
    naturalismIndex: 0.91,
    shadowDensity: 0.38,
    atmosphericOcclusion: 0.22,
    colorDrift: 0.04,
    ruleOfThirds: 0.78,
    spatialHonesty: 0.88,
    symmetryBias: 0.48,
    negativeSpaceRatio: 0.22,
    symmetryScore: 0.46,
    frameOccupancyRatio: 0.64,
    layerPriority: "front" as const,
    avgShotDuration: 8.5,
    rhythmUniformity: 0.9,
    montageIntensity: 0.18,
    cutPressure: 0.14,
    contrastPhilosophy: "adventurous-midtone",
    lightingType: "coastal-fill",
    pacingPhilosophy: "bridge-momentum",
    framingRhythm: "tracking-mid-shot",
    transitionGrammar: "match-cut-motion",
    emotionalEscalation: "adventurous-soft-rise",
    spatialBlocking: "flight-path-diagonal",
    scenarioType: "pre_confession" as const,
    urgency: 0.42,
    irreversibility: 0.28,
    emotionalPressure: 0.48,
    stylize: 210,
    chaos: 12,
  }),
  Object.freeze({
    queueOrder: 2,
    luminanceContrast: 0.44,
    depthIsolation: 0.82,
    cameraVelocityMps: 0.05,
    subjectDistanceMeter: 18.0,
    chromaIntensity: 0.64,
    dread: 0.02,
    melancholy: 0.18,
    anticipation: 0.62,
    intimacy: 0.74,
    arousalRate: 0.12,
    catharsisReady: 0.88,
    timeTensionCurve: "release-wonder",
    rhythmPressure: 0.22,
    pacingMemory: 0.92,
    pacingWaveform: Object.freeze([0.55, 0.48, 0.38, 0.28] as const),
    shotMemory: 0.89,
    sceneMemory: 0.84,
    emotionalAfterimage: 0.72,
    focalLengthMm: 85,
    apertureFStop: 2.0,
    halationResponse: 0.28,
    grainProfile: "dream-soft",
    humanTrackingBias: 0.86,
    kineticAggression: 0.02,
    staticPatience: 0.96,
    focalRangeLow: 70,
    focalRangeHigh: 105,
    distortionAcceptance: 0.06,
    opticalAbstraction: 0.18,
    bokehTexture: "ethereal-glow",
    naturalismIndex: 0.96,
    shadowDensity: 0.24,
    atmosphericOcclusion: 0.14,
    colorDrift: 0.03,
    ruleOfThirds: 0.86,
    spatialHonesty: 0.94,
    symmetryBias: 0.56,
    negativeSpaceRatio: 0.36,
    symmetryScore: 0.62,
    frameOccupancyRatio: 0.52,
    layerPriority: "back" as const,
    avgShotDuration: 4.0,
    rhythmUniformity: 0.94,
    montageIntensity: 0.08,
    cutPressure: 0.04,
    contrastPhilosophy: "peaceful-wonder-soft",
    lightingType: "twilight-resolve",
    pacingPhilosophy: "gentle-resolve",
    framingRhythm: "wide-contemplative-hold",
    transitionGrammar: "fade-to-still",
    emotionalEscalation: "wonder-release",
    spatialBlocking: "horizon-rest-pose",
    scenarioType: "everyday_peace" as const,
    urgency: 0.08,
    irreversibility: 0.06,
    emotionalPressure: 0.18,
    stylize: 165,
    chaos: 5,
  }),
] as const);

let cachedRealV826DenseCinematicDnaExportAdapter: RealV826DenseCinematicDnaExportAdapter | null =
  null;
let cachedRealV826DenseCinematicDnaExportDownload: RealV826DenseCinematicDnaExportDownload | null =
  null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function grounded<T>(
  value: T,
  confidence: number,
  source: string,
  reasoning: string
): GroundedScalar<T> {
  return Object.freeze({ value, confidence, source, reasoning });
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

function resolveDenseProfile(queueOrder: number) {
  const baseProfile = REAL_V826_RECORD_PROFILES.find((entry) => entry.queueOrder === queueOrder);
  const denseProfile = REAL_V826_DENSE_RECORD_PROFILES.find(
    (entry) => entry.queueOrder === queueOrder
  );
  if (baseProfile === undefined || denseProfile === undefined) {
    throw new Error(`Unknown real v826 dense record profile for queueOrder=${queueOrder}`);
  }
  return Object.freeze({ ...baseProfile, ...denseProfile });
}

function buildSceneNodeId(queueOrder: number): string {
  return `SCENE-KIKI-REAL-25S-${String(queueOrder).padStart(3, "0")}`;
}

function computeRecordId(item: RealImageAppInputPackageItem): string {
  return digestValue(
    [
      REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_KIND_VERSION,
      "v826-dense-record",
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
      REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_KIND_VERSION,
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

function buildLatentEmbedding(seed: string, length: number): readonly number[] {
  const bytes = crypto.createHash("sha256").update(seed).digest();
  return Object.freeze(
    Array.from({ length }, (_, index) =>
      Number(((bytes[index % bytes.length] ?? 0) / 255).toFixed(6))
    )
  );
}

function buildSemantic16d(recordId: string): Readonly<Record<string, number>> {
  const bytes = crypto.createHash("sha256").update(`${recordId}|semantic-16d`).digest();
  const semantic: Record<string, number> = {};
  for (let index = 0; index < 16; index += 1) {
    semantic[`dim_${index}`] = Number(((bytes[index] ?? 0) / 255).toFixed(6));
  }
  return Object.freeze(semantic);
}

function buildAtomId(recordId: string, label: string): string {
  return digestValue([recordId, "atom", label].join("|")).slice(0, 24);
}

function buildVisualAtoms(
  item: RealImageAppInputPackageItem,
  recordId: string,
  profile: ReturnType<typeof resolveDenseProfile>
): RealV826DenseCinematicDnaExportRecord["visual_atoms"] {
  const atomSpecs = Object.freeze([
    Object.freeze({
      label: "harbor-evening-sky",
      coordinateBox: Object.freeze([0.05, 0.1, 0.45, 0.95] as const),
      significance: 0.82,
      surfaceType: "atmospheric-gradient",
      roughness: 0.08,
      reflectivity: 0.12,
      degradation: 0.02,
      screenPosition: "upper_third",
      depthLayer: "background" as const,
      framing: "LS" as const,
      cameraRelation: "ambient-backdrop",
      focusPriority: 0.42,
      semanticRole: "environmental_mood_carrier",
    }),
    Object.freeze({
      label: "kiki-flight-subject",
      coordinateBox: Object.freeze([0.35, 0.38, 0.78, 0.62] as const),
      significance: 0.96,
      surfaceType: "organic-fabric",
      roughness: 0.32,
      reflectivity: 0.18,
      degradation: 0.04,
      screenPosition: "center_middle",
      depthLayer: "foreground" as const,
      framing: "MS" as const,
      cameraRelation: "eye-level-tracking",
      focusPriority: 0.98,
      semanticRole: "primary_narrative_subject",
    }),
    Object.freeze({
      label: "coastal-town-silhouette",
      coordinateBox: Object.freeze([0.52, 0.05, 0.92, 0.88] as const),
      significance: 0.74,
      surfaceType: "architectural-matte",
      roughness: 0.58,
      reflectivity: 0.06,
      degradation: 0.12,
      screenPosition: "lower_third",
      depthLayer: "midground" as const,
      framing: "MLS" as const,
      cameraRelation: "ground-plane-anchor",
      focusPriority: 0.55,
      semanticRole: "spatial_context_anchor",
    }),
  ]);

  return Object.freeze(
    atomSpecs.map((spec) =>
      Object.freeze({
        atom_id: buildAtomId(recordId, spec.label),
        label: spec.label,
        coordinate_box: spec.coordinateBox,
        significance: spec.significance,
        material_properties: Object.freeze({
          surface_type: spec.surfaceType,
          roughness: spec.roughness,
          reflectivity: spec.reflectivity,
          degradation: spec.degradation,
        }),
        spatial_intelligence: Object.freeze({
          screen_position: spec.screenPosition,
          depth_layer: spec.depthLayer,
          framing: spec.framing,
          camera_relation: spec.cameraRelation,
          focus_priority: spec.focusPriority,
        }),
        semantic_role: spec.semanticRole,
      })
    )
  );
}

function buildRelationshipGraph(
  visualAtoms: RealV826DenseCinematicDnaExportRecord["visual_atoms"],
  item: RealImageAppInputPackageItem
): RealV826DenseCinematicDnaExportRecord["relationship_graph"] {
  const subjectAtom = visualAtoms.find((atom) => atom.semantic_role === "primary_narrative_subject");
  const skyAtom = visualAtoms.find((atom) => atom.semantic_role === "environmental_mood_carrier");
  const townAtom = visualAtoms.find((atom) => atom.semantic_role === "spatial_context_anchor");

  if (subjectAtom === undefined || skyAtom === undefined || townAtom === undefined) {
    throw new Error("Real v826 dense export requires three visual atoms");
  }

  return Object.freeze([
    Object.freeze({
      subject: subjectAtom.atom_id,
      predicate: "flies_over",
      object: townAtom.atom_id,
      weight: 0.92,
    }),
    Object.freeze({
      subject: skyAtom.atom_id,
      predicate: "bathes",
      object: subjectAtom.atom_id,
      weight: 0.86,
    }),
    Object.freeze({
      subject: townAtom.atom_id,
      predicate: "anchors",
      object: subjectAtom.atom_id,
      weight: 0.78,
    }),
    Object.freeze({
      subject: subjectAtom.atom_id,
      predicate: "expresses",
      object: item.emotionTone,
      weight: 0.88,
    }),
  ]);
}

function buildSceneState(
  item: RealImageAppInputPackageItem,
  profile: ReturnType<typeof resolveDenseProfile>
): RealV826DenseCinematicDnaExportRecord["scene_state"] {
  return Object.freeze({
    physics: Object.freeze({
      luminance_contrast: grounded(
        profile.luminanceContrast,
        0.91,
        "metadata",
        `${item.dramaFunction} luminance profile`
      ),
      motion_density: grounded(
        profile.motionDensity,
        0.92,
        "metadata",
        `${item.rhythmPhase} rhythm phase`
      ),
      depth_isolation: grounded(
        profile.depthIsolation,
        0.9,
        "metadata",
        `${item.dramaFunction} depth layering`
      ),
      camera_velocity_mps: grounded(
        profile.cameraVelocityMps,
        0.88,
        "metadata",
        `${item.rhythmPhase} camera velocity`
      ),
      subject_distance_meter: grounded(
        profile.subjectDistanceMeter,
        0.87,
        "metadata",
        `${item.dramaFunction} subject distance`
      ),
      luminance_balance: grounded(
        profile.luminanceBalance,
        0.9,
        "metadata",
        `${item.dramaFunction} frame profile`
      ),
      chroma_intensity: grounded(
        profile.chromaIntensity,
        0.89,
        "metadata",
        `${item.emotionTone} chroma envelope`
      ),
    }),
    emotion: Object.freeze({
      dread: grounded(profile.dread, 0.84, "metadata", `${item.emotionTone} dread envelope`),
      melancholy: grounded(
        profile.melancholy,
        0.86,
        "metadata",
        `${item.emotionTone} melancholy bias`
      ),
      anticipation: grounded(
        profile.anticipation,
        0.88,
        "metadata",
        `${item.rhythmPhase} anticipation curve`
      ),
      intimacy: grounded(profile.intimacy, 0.87, "metadata", `${item.dramaFunction} intimacy`),
      arousal_rate: grounded(
        profile.arousalRate,
        0.85,
        "metadata",
        `${item.suggestedMusicEnergy} arousal`
      ),
      valence_bias: grounded(profile.valenceBias, 0.88, "metadata", item.emotionTone),
      catharsis_ready: grounded(
        profile.catharsisReady,
        0.86,
        "metadata",
        `${item.dramaFunction} catharsis readiness`
      ),
      isolation_score: grounded(
        profile.isolationScore,
        0.86,
        "metadata",
        item.dramaFunction
      ),
    }),
    temporal: Object.freeze({
      time_tension_curve: grounded(
        profile.timeTensionCurve,
        0.9,
        "metadata",
        `${item.rhythmPhase} temporal curve`
      ),
      rhythm_pressure: grounded(
        profile.rhythmPressure,
        0.89,
        "metadata",
        item.suggestedMusicEnergy
      ),
      pacing_memory: grounded(
        profile.pacingMemory,
        0.91,
        "metadata",
        `${item.dramaFunction} pacing memory`
      ),
      pacing_waveform: profile.pacingWaveform,
      shot_memory: grounded(profile.shotMemory, 0.88, "metadata", item.frameEvidenceId),
      scene_memory: grounded(profile.sceneMemory, 0.87, "metadata", item.sceneId),
      emotional_afterimage: grounded(
        profile.emotionalAfterimage,
        0.86,
        "metadata",
        item.emotionTone
      ),
    }),
    optics: Object.freeze({
      sensor_alias: grounded(
        "35mm-anime-film",
        0.94,
        "metadata",
        "Ghibli harbor real-frame optics template"
      ),
      focal_length_mm: grounded(
        profile.focalLengthMm,
        0.92,
        "metadata",
        `${item.dramaFunction} focal length`
      ),
      aperture_f_stop: grounded(
        profile.apertureFStop,
        0.9,
        "metadata",
        `${item.rhythmPhase} depth-of-field`
      ),
      halation_response: grounded(
        profile.halationResponse,
        0.88,
        "metadata",
        `${item.emotionTone} halation`
      ),
      grain_profile: grounded(
        profile.grainProfile,
        0.91,
        "metadata",
        "real-frame cel grain profile"
      ),
    }),
  });
}

function buildLatentSteering(
  item: RealImageAppInputPackageItem,
  recordId: string,
  profile: ReturnType<typeof resolveDenseProfile>
): RealV826DenseCinematicDnaExportRecord["latent_steering"] {
  return Object.freeze({
    vectors: Object.freeze({
      semantic_16d: buildSemantic16d(recordId),
    }),
    legacy_spaces: Object.freeze({
      cinematic_latent_embeddings_v2: buildLatentEmbedding(
        [recordId, item.frameFingerprint, "legacy-v2"].join("|"),
        32
      ),
    }),
    engine_adapters: Object.freeze({
      midjourney: Object.freeze({
        engine_params: Object.freeze({
          aspect_ratio: "16:9",
          stylize: profile.stylize,
          chaos: profile.chaos,
        }),
      }),
    }),
  });
}

function buildDirectorDna(
  item: RealImageAppInputPackageItem,
  profile: ReturnType<typeof resolveDenseProfile>
): RealV826DenseCinematicDnaExportRecord["director_dna"] {
  return Object.freeze({
    camera_motion: Object.freeze({
      continuous_motion: grounded(
        profile.continuousMotion,
        0.9,
        "metadata",
        item.rhythmPhase
      ),
      human_tracking_bias: grounded(
        profile.humanTrackingBias,
        0.91,
        "metadata",
        `${item.dramaFunction} tracking bias`
      ),
      kinetic_aggression: grounded(
        profile.kineticAggression,
        0.89,
        "metadata",
        item.suggestedMusicEnergy
      ),
      static_patience: grounded(
        profile.staticPatience,
        0.92,
        "metadata",
        `${item.rhythmPhase} static patience`
      ),
    }),
    lens_behavior: Object.freeze({
      focal_range: grounded(
        Object.freeze([profile.focalRangeLow, profile.focalRangeHigh] as const),
        0.9,
        "metadata",
        `${item.dramaFunction} focal envelope`
      ),
      distortion_acceptance: grounded(
        profile.distortionAcceptance,
        0.88,
        "metadata",
        "anime spherical lens profile"
      ),
      optical_abstraction: grounded(
        profile.opticalAbstraction,
        0.87,
        "metadata",
        item.emotionTone
      ),
      bokeh_texture: grounded(
        profile.bokehTexture,
        0.86,
        "metadata",
        `${item.dramaFunction} bokeh texture`
      ),
    }),
    lighting_behavior: Object.freeze({
      naturalism_index: grounded(
        profile.naturalismIndex,
        0.93,
        "metadata",
        "harbor evening natural light"
      ),
      shadow_density: grounded(
        profile.shadowDensity,
        0.9,
        "metadata",
        item.emotionTone
      ),
      atmospheric_occlusion: grounded(
        profile.atmosphericOcclusion,
        0.88,
        "metadata",
        "coastal haze envelope"
      ),
      color_drift: grounded(
        profile.colorDrift,
        0.91,
        "metadata",
        `${item.rhythmPhase} color drift`
      ),
    }),
    composition_logic: Object.freeze({
      rule_of_thirds: grounded(
        profile.ruleOfThirds,
        0.9,
        "metadata",
        `${item.dramaFunction} composition grid`
      ),
      subject_isolation: grounded(
        profile.subjectIsolation,
        0.91,
        "metadata",
        item.dramaFunction
      ),
      spatial_honesty: grounded(
        profile.spatialHonesty,
        0.9,
        "metadata",
        "real-frame spatial honesty"
      ),
      symmetry_bias: grounded(
        profile.symmetryBias,
        0.88,
        "metadata",
        item.emotionTone
      ),
      negative_space_ratio: grounded(
        profile.negativeSpaceRatio,
        0.87,
        "metadata",
        `${item.dramaFunction} negative space`
      ),
      symmetry_score: grounded(
        profile.symmetryScore,
        0.86,
        "metadata",
        item.rhythmPhase
      ),
      dominance: Object.freeze({
        layer_priority: profile.layerPriority,
        frame_occupancy_ratio: profile.frameOccupancyRatio,
        depth_isolation_lock: true,
        subject_focus_score: profile.subjectIsolation,
      }),
    }),
    editing_pacing: Object.freeze({
      avg_shot_duration: grounded(
        profile.avgShotDuration,
        0.92,
        "metadata",
        "25s real-frame segment duration"
      ),
      rhythm_uniformity: grounded(
        profile.rhythmUniformity,
        0.9,
        "metadata",
        item.suggestedMusicEnergy
      ),
      montage_intensity: grounded(
        profile.montageIntensity,
        0.89,
        "metadata",
        item.rhythmPhase
      ),
      cut_pressure: grounded(
        profile.cutPressure,
        0.88,
        "metadata",
        `${item.dramaFunction} cut pressure`
      ),
      rhythm_anchors: Object.freeze([item.rhythmPhase, item.suggestedMusicEnergy]),
    }),
    style_normalization: Object.freeze({
      ghibli_base: 0.82,
      modern_shinkai: 0.12,
      live_fidelity: 0.06,
      normalized_sum: 1.0,
    }),
    visual_style: Object.freeze({
      color_palette_intent: "warm-harbor-evening",
      contrast_philosophy: profile.contrastPhilosophy,
      dominant_palette: Object.freeze(["#F4D03F", "#5DADE2", "#1B4F72", "#E8DAEF"]),
      lighting_type: profile.lightingType,
    }),
    director_grammar: Object.freeze({
      pacing_philosophy: grounded(
        profile.pacingPhilosophy,
        0.9,
        "metadata",
        item.dramaFunction
      ),
      framing_rhythm: grounded(
        profile.framingRhythm,
        0.89,
        "metadata",
        item.rhythmPhase
      ),
      transition_grammar: grounded(
        profile.transitionGrammar,
        0.88,
        "metadata",
        item.suggestedMusicEnergy
      ),
      emotional_escalation_logic: grounded(
        profile.emotionalEscalation,
        0.87,
        "metadata",
        item.emotionTone
      ),
      spatial_blocking_signatures: grounded(
        profile.spatialBlocking,
        0.86,
        "metadata",
        `${item.dramaFunction} blocking`
      ),
    }),
  });
}

function buildProductionV72(
  item: RealImageAppInputPackageItem,
  profile: ReturnType<typeof resolveDenseProfile>,
  sceneNodeId: string,
  queueOrder: number
): RealV826DenseCinematicDnaExportRecord["production_v72"] {
  const previousNode =
    queueOrder === 0 ? "REAL-KIKI-25S-ROOT" : buildSceneNodeId(queueOrder - 1);

  return Object.freeze({
    orchestrator: Object.freeze({
      active_engine: "local_sim" as const,
      render_queue_pos: queueOrder,
      estimated_completion: "0s",
      engine_health_score: 1.0,
    }),
    continuity_controller: Object.freeze({
      character_persistence: grounded(0.96, 0.94, "metadata", item.frameEvidenceId),
      camera_path_continuity: grounded(
        profile.emotionContinuity,
        0.93,
        "metadata",
        item.rhythmPhase
      ),
      lighting_consistency: grounded(0.92, 0.91, "metadata", "harbor evening continuity"),
      emotion_drift_locked: true,
      overall_continuity_score: 0.94,
    }),
    autonomous_quality_loop: Object.freeze({
      loop_iteration: 1,
      last_correction_instruction: "None",
      quality_trend: "stable" as const,
      auto_finalize_ready: true,
    }),
    subject_composition: Object.freeze({
      type: "S" as const,
      primary_subject_count: grounded(1, 0.98, "metadata", "Kiki single-subject frame"),
      supporting_population: grounded(2, 0.82, "metadata", "background harbor population"),
      animal_population: grounded(1, 0.88, "metadata", "Jiji companion presence"),
      social_density: grounded(0.24, 0.86, "metadata", "open harbor spatial density"),
    }),
    relationship_dynamics: Object.freeze({
      trust: grounded(0.78, 0.84, "metadata", item.emotionTone),
      emotional_distance: grounded(profile.isolationScore, 0.85, "metadata", item.dramaFunction),
      protective_instinct: grounded(0.62, 0.83, "metadata", "mentor-distance warmth"),
      suppression: grounded(0.12, 0.82, "metadata", "peaceful suppression envelope"),
      reunion_tension: grounded(null, 0.0, "pending", "N/A for 25s harbor segment"),
      guilt_devotion: grounded(0.42, 0.8, "metadata", "independence devotion arc"),
    }),
    situation_state: Object.freeze({
      scenario_type: profile.scenarioType,
      urgency: grounded(profile.urgency, 0.88, "metadata", item.suggestedMusicEnergy),
      irreversibility: grounded(
        profile.irreversibility,
        0.86,
        "metadata",
        item.dramaFunction
      ),
      emotional_pressure: grounded(
        profile.emotionalPressure,
        0.87,
        "metadata",
        item.emotionTone
      ),
      logical_precedents: Object.freeze([
        item.dramaFunction,
        item.rhythmPhase,
        item.suggestedMusicEnergy,
      ]),
    }),
    temporal_bridge: Object.freeze({
      inherits_motion_from: previousNode,
      gaze_vector_continuity: grounded(
        profile.emotionContinuity,
        0.9,
        "metadata",
        sceneNodeId
      ),
      emotional_decay_tau: grounded(6.5, 0.88, "metadata", item.emotionTone),
      spatial_anchor_offset: Object.freeze([0, 0, 0] as const),
      gaze_carry_over: grounded(0.82, 0.87, "metadata", item.rhythmPhase),
      emotional_residue: grounded(profile.emotionalAfterimage, 0.86, "metadata", item.emotionTone),
    }),
    spectator_state: Object.freeze({
      tension: grounded(profile.rhythmPressure, 0.9, "metadata", item.suggestedMusicEnergy),
      anticipation: grounded(profile.anticipation, 0.89, "metadata", item.rhythmPhase),
      perceptual_intimacy: grounded(profile.intimacy, 0.88, "metadata", item.dramaFunction),
      narrative_immersion_index: grounded(
        profile.pacingMemory,
        0.91,
        "metadata",
        "Ghibli harbor immersion"
      ),
    }),
  });
}

function buildSequenceGraph(
  queueOrder: number,
  sceneNodeId: string,
  profile: ReturnType<typeof resolveDenseProfile>
): RealV826DenseCinematicDnaExportRecord["sequence_graph"] {
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

function buildDenseRecord(
  item: RealImageAppInputPackageItem,
  realInputPackageId: string
): RealV826DenseCinematicDnaExportRecord {
  const profile = resolveDenseProfile(item.queueOrder);
  const recordId = computeRecordId(item);
  const sceneNodeId = buildSceneNodeId(item.queueOrder);
  const timestampStart = Number.parseFloat(item.timestampSeconds);
  const timestampEnd =
    REAL_V826_DENSE_TIMESTAMP_END_BY_QUEUE[item.queueOrder] ?? profile.timestampEndSeconds;
  const visualAtoms = buildVisualAtoms(item, recordId, profile);

  return Object.freeze({
    id: recordId,
    schema_version: REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_SCHEMA_VERSION,
    schema_signature: REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_SCHEMA_SIGNATURE,
    schema_meta: Object.freeze({
      latent_engine: "real-frame-dense-v826",
      vector_semantics: "evidence_grounded_logic" as const,
      revision: 1,
      production_ready: true,
      perception_mode: "real-mp4-frame-evidence-dense",
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
    generative_layer: Object.freeze({
      midjourney: `Kiki 25s dense real frame ${item.dramaFunction}, ${item.emotionTone}, ${item.rhythmPhase}, ${item.suggestedMusicEnergy} --ar 16:9 --style raw`,
      runway: `Dense real extracted frame at ${item.timestampSeconds}s, ${item.emotionTone}, ${item.dramaFunction}, metadata-only reference.`,
      kling: `Studio Ghibli harbor dense aesthetic, ${item.emotionTone}, ${item.dramaFunction}, real frame evidence.`,
      prompt_compression_ratio: 0.38,
    }),
    layers: Object.freeze({
      raw_semantic: Object.freeze({
        visual_description: `Dense real 25s reference frame at ${item.timestampSeconds}s (${item.dramaFunction}).`,
        raw_tags: Object.freeze([
          item.dramaFunction,
          item.emotionTone,
          item.rhythmPhase,
          item.suggestedMusicEnergy,
          "dense-v826",
        ]),
        provenance_notes: "real-frame-evidence-dense-metadata-only",
      }),
      scene_language: Object.freeze({
        cinematography_tokens: Object.freeze([
          item.rhythmPhase,
          item.suggestedMusicEnergy,
          profile.lightingType,
        ]),
        narrative_tokens: Object.freeze([item.dramaFunction, profile.pacingPhilosophy]),
        emotion_tokens: Object.freeze([item.emotionTone, profile.emotionalEscalation]),
        dsl_version: "5.1.0",
      }),
    }),
    scene_state: buildSceneState(item, profile),
    latent_steering: buildLatentSteering(item, recordId, profile),
    director_dna: buildDirectorDna(item, profile),
    visual_atoms: visualAtoms,
    relationship_graph: buildRelationshipGraph(visualAtoms, item),
    sequence_graph: buildSequenceGraph(item.queueOrder, sceneNodeId, profile),
    confidence_profile: Object.freeze({
      aggregate_certainty: 0.93,
      inference_depth: 0.42,
      semantic_confidence: 0.9,
    }),
    production_v72: buildProductionV72(item, profile, sceneNodeId, item.queueOrder),
  });
}

export function buildRealV826DenseCinematicDnaExportAdapter(
  realImageAppInputPackage: RealImageAppInputPackage
): RealV826DenseCinematicDnaExportAdapter {
  if (cachedRealV826DenseCinematicDnaExportAdapter !== null) {
    return cachedRealV826DenseCinematicDnaExportAdapter;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real v826 dense cinematic dna export requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_V826_CINEMATIC_DNA_EXPORT_ITEM_COUNT) {
    throw new Error("Real v826 dense cinematic dna export requires three input package items");
  }

  const queueOrders = orderedItems.map((item) => item.queueOrder);
  if (queueOrders.join(",") !== "0,1,2") {
    throw new Error("Real v826 dense cinematic dna export requires queue order zero through two");
  }

  const records = Object.freeze(
    orderedItems.map((item) =>
      buildDenseRecord(item, realImageAppInputPackage.realInputPackageId)
    )
  );

  cachedRealV826DenseCinematicDnaExportAdapter = records;
  return records;
}

export function serializeRealV826DenseCinematicDnaExportAdapter(
  adapter: RealV826DenseCinematicDnaExportAdapter
): string {
  const orderedRecords = [...adapter]
    .sort((a, b) => a.scene_indexing.v_timestamp_start - b.scene_indexing.v_timestamp_start)
    .map((record) =>
      orderRecord(
        record as unknown as Record<string, unknown>,
        REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_RECORD_KEY_ORDER
      )
    );

  return JSON.stringify(orderedRecords, null, 2);
}

export function computeRealV826DenseCinematicDnaExportAdapterFingerprint(
  adapter: RealV826DenseCinematicDnaExportAdapter
): string {
  return digestValue(serializeRealV826DenseCinematicDnaExportAdapter(adapter));
}

export function buildRealV826DenseCinematicDnaExportDownloadFromAdapter(
  adapter: RealV826DenseCinematicDnaExportAdapter
): RealV826DenseCinematicDnaExportDownload {
  return Object.freeze({
    filename: REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_FILENAME,
    contentType: "application/json",
    body: serializeRealV826DenseCinematicDnaExportAdapter(adapter),
    exportFingerprint: computeRealV826DenseCinematicDnaExportAdapterFingerprint(adapter),
  });
}

export function buildRealV826DenseCinematicDnaExportDownloadFromPackage(
  realImageAppInputPackage: RealImageAppInputPackage
): RealV826DenseCinematicDnaExportDownload {
  return buildRealV826DenseCinematicDnaExportDownloadFromAdapter(
    buildRealV826DenseCinematicDnaExportAdapter(realImageAppInputPackage)
  );
}

export function buildRealV826DenseCinematicDnaExportDownload(): RealV826DenseCinematicDnaExportDownload {
  if (cachedRealV826DenseCinematicDnaExportDownload !== null) {
    return cachedRealV826DenseCinematicDnaExportDownload;
  }

  const download = buildRealV826DenseCinematicDnaExportDownloadFromPackage(
    REAL_IMAGE_APP_INPUT_PREVIEW_PACKAGE as RealImageAppInputPackage
  );
  cachedRealV826DenseCinematicDnaExportDownload = download;
  return download;
}

export function resetRealV826DenseCinematicDnaExportAdapterCacheForVerification(): void {
  cachedRealV826DenseCinematicDnaExportAdapter = null;
  cachedRealV826DenseCinematicDnaExportDownload = null;
}

export function resolveRealV826DenseCategoryForDramaFunction(
  dramaFunction: RealMusicDramaFunction
): string | null {
  const profile = REAL_V826_RECORD_PROFILES.find((entry) =>
    entry.shotPurpose.includes(dramaFunction)
  );
  return profile?.category ?? null;
}
