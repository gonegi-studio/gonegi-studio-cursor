import {
  CinematicExtractionResult,
  PipelineAuditMetrics,
  PipelineExtractionBundle,
  PipelineMemoryBundle,
  RecursiveMergeState,
  VisualAtom,
} from '../types';

/** Director templates shared by Pipeline A hydration and composeRecursiveDataset. */
export const PIPELINE_A_DIRECTORS = [
  { name: 'Kubrick-Alcott', genre: 'SCI_FI', title: '2001 Space Odyssey Centrifuge' },
  { name: 'Tarkovsky-Rerberg', genre: 'POETIC', title: 'Stalker Room of Wishes' },
  { name: 'Coppola-Willis', genre: 'NOIR', title: 'Godfather Study Discussion' },
  { name: 'Hitchcock-Burks', genre: 'SUSPENSE', title: 'Vertigo Tower Spiral Ascent' },
  { name: 'Kurosawa-Nakai', genre: 'EPIC', title: 'Ran Fortress Siege Rain' },
  { name: 'Villeneuve-Deakins', genre: 'NEO_NOIR', title: 'Blade Runner Yellow Rain' },
  { name: 'Nolan-Pfister', genre: 'INTELLECTUAL', title: 'Inception Hallway Gravitational Tumult' },
  { name: 'Anderson-Yeoman', genre: 'SYMMETRICAL', title: 'Budapest Lobby Frontal Elevation' },
  { name: 'Fincher-Cronenweth', genre: 'CYNIC', title: 'Social Network Wylie Suite Coding' },
  { name: 'Wong-Doyle', genre: 'MELODRAMA', title: 'In the Mood for Love Alleyway Gaze' },
] as const;

const VISUAL_ATOM_LABELS = [
  'primary_subject_character',
  'supporting_witness',
  'background_architectural_pillar',
  'foreground_occluding_barrier',
  'key_symbolic_handheld_props',
  'secondary_luminaire_source',
  'environmental_element_smoke',
  'cinematographic_depth_anchor',
  'implied_spectator_vantage',
] as const;

const RELATIONSHIP_GRAPH_TEMPLATE = [
  { subject: 'primary_subject_character', predicate: 'confronts', object: 'supporting_witness', weight: 0.88 },
  { subject: 'primary_subject_character', predicate: 'seeks_escape_via', object: 'foreground_occluding_barrier', weight: 0.45 },
  { subject: 'supporting_witness', predicate: 'fears', object: 'primary_subject_character', weight: 0.62 },
  { subject: 'key_symbolic_handheld_props', predicate: 'symbolizes', object: 'primary_subject_character', weight: 0.95 },
  { subject: 'secondary_luminaire_source', predicate: 'reveals_secrets_of', object: 'background_architectural_pillar', weight: 0.72 },
  { subject: 'environmental_element_smoke', predicate: 'shrouds', object: 'foreground_occluding_barrier', weight: 0.8 },
  { subject: 'primary_subject_character', predicate: 'focus_anchored_on', object: 'key_symbolic_handheld_props', weight: 0.99 },
  { subject: 'supporting_witness', predicate: 'gaze_parallel_to', object: 'cinematographic_depth_anchor', weight: 0.5 },
] as const;

export interface PipelineAExtractorContext {
  seed: number;
  sceneId: string;
  index?: number;
  totalDms?: number;
  totalFrames?: number;
  directorTitle?: string;
  directorName?: string;
  /** When false, skips dense_latent_trajectories generation (lab import bridge). */
  includeDenseTrajectories?: boolean;
  /** Fixed timestamp for deterministic export-bridge donor snapshots. */
  deterministicTimestamp?: string;
}

export interface PipelineTelemetryBundle {
  recursive_merge_state: RecursiveMergeState;
  validation_metrics: Record<string, unknown>;
  audit_metrics: PipelineAuditMetrics;
  confidence_profiles: Record<string, unknown>;
  orchestration_states: Record<string, unknown>;
}

export interface PipelineAExtractionNamespaces extends PipelineExtractionBundle {
  intermediate_pipeline_states: Record<string, unknown>;
  prompts_extraction: Record<string, unknown>;
  configurations_extraction: Record<string, unknown>;
  graphs_extraction: Record<string, unknown>;
  raw_caches_extraction: Record<string, unknown>;
}

function resolveDirector(context: PipelineAExtractorContext) {
  const director = PIPELINE_A_DIRECTORS[context.seed % PIPELINE_A_DIRECTORS.length];
  return {
    title: context.directorTitle ?? director.title,
    name: context.directorName ?? director.name,
  };
}

/**
 * Pure Pipeline A extractor — 9 rich visual atoms with material/spatial metadata.
 */
export function extractRichVisualAtoms(sceneId: string, seed: number): VisualAtom[] {
  return VISUAL_ATOM_LABELS.map((label, lIdx) => {
    const aid = `ATOM-${sceneId.slice(0, 10).toUpperCase()}-${lIdx + 1}`;
    const y1 = Number((0.15 + ((seed * 0.08 + lIdx * 0.11) % 0.6)).toFixed(3));
    const x1 = Number((0.1 + ((seed * 0.13 + lIdx * 0.07) % 0.7)).toFixed(3));
    const y2 = Number((y1 + 0.2 + ((lIdx * 0.03) % 0.4)).toFixed(3));
    const x2 = Number((x1 + 0.15 + ((lIdx * 0.04) % 0.5)).toFixed(3));

    return {
      atom_id: aid,
      label,
      coordinate_box: [y1, x1, y2, x2] as [number, number, number, number],
      significance: Number((0.65 + ((seed * lIdx + 3) % 5) * 0.07).toFixed(2)),
      material_properties: {
        surface_type: lIdx % 2 === 0 ? 'wet_reflective_metal' : 'organic_worn_fabric',
        roughness: Number((0.2 + ((seed + lIdx) % 10) * 0.07).toFixed(2)),
        reflectivity: Number((0.1 + ((seed * lIdx) % 8) * 0.11).toFixed(2)),
        degradation: Number((0.3 + ((seed - lIdx + 10) % 9) * 0.08).toFixed(2)),
      },
      spatial_intelligence: {
        screen_position: lIdx % 3 === 0 ? 'center_middle' : lIdx % 3 === 1 ? 'left_third' : 'right_third',
        depth_layer: lIdx % 3 === 0 ? 'foreground' : lIdx % 3 === 1 ? 'midground' : 'background',
        framing: lIdx % 4 === 0 ? 'CU' : lIdx % 4 === 1 ? 'MS' : 'MLS',
        camera_relation: 'eye-level-gaze',
        focus_priority: Number((0.4 + ((seed + lIdx) % 7) * 0.09).toFixed(2)),
      },
      semantic_role: lIdx === 0 ? 'symbolic_protagonist' : 'thematic_anchor',
    };
  });
}

/**
 * Pure Pipeline A extractor — 8 SPO relationship edges with legacy relation/target fields.
 */
export function extractRichRelationshipGraph(
  seed: number
): CinematicExtractionResult['relationship_graph'] {
  return RELATIONSHIP_GRAPH_TEMPLATE.map((rel, rIdx) => ({
    subject: rel.subject,
    predicate: rel.predicate,
    object: rel.object,
    relation: rel.predicate,
    target: rel.object,
    weight: Number((rel.weight * (0.85 + ((seed * rIdx) % 4) * 0.05)).toFixed(2)),
  }));
}

/**
 * Pure Pipeline A extractor — deterministic dense latent trajectory matrix.
 */
export function extractDenseLatentTrajectories(
  seed: number,
  totalDms = 120,
  totalFrames = 80
): number[][] {
  return Array.from({ length: totalFrames }).map((_, fIdx) =>
    Array.from({ length: totalDms }).map((_, dIdx) => {
      const val =
        Math.sin(fIdx * 0.17 + dIdx * 0.05 + seed * 0.11) *
        Math.cos(dIdx * 0.23 - fIdx * 0.09 + seed * 0.19);
      return Number(val.toFixed(8));
    })
  );
}

/**
 * Pure Pipeline A extractor — sequence memory bundle (continuity, emotional, rhythm, motif, character).
 */
export function extractPipelineMemoryBundle(seed: number): PipelineMemoryBundle {
  return {
    continuity_memory: {
      continuity_lock_status: 'ACTIVE_LOCKED',
      gaze_persistence_score: 0.99,
      pose_drift_tolerance: 0.05,
      lighting_deviation_norm: 0.02,
      state_snapshots_count: seed,
    },
    emotional_carryover: {
      carryover_intensity: 0.88,
      decay_ratio_per_frame: 0.015,
      underlying_mood_base: 'tension_buildup',
      emotional_resonance_active: true,
    },
    camera_rhythm_memory: {
      rhythm_continuity: 0.97,
      velocity_delta_variance: 0.08,
      frame_rate_hz: 24,
      shutter_angle_deg: 180,
    },
    motif_persistence: {
      motif_id: 'amber_gaze',
      activation_ratio: 0.92,
      viewer_recognition_index: 0.94,
      thematic_weight: 0.95,
    },
    character_persistence: {
      face_topology_lock: 0.99,
      silhouette_persistence: 0.98,
      outfit_continuity_graph: 'STABLE_PAIRINGS',
      gaze_memory: 'eye_contact_gaze_lock_active',
      micro_expression_carryover: 0.91,
    },
  };
}

/**
 * Pure Pipeline A extractor — merge/validation/audit/orchestration telemetry.
 */
export function extractPipelineTelemetryBundle(seed: number): PipelineTelemetryBundle {
  return {
    recursive_merge_state: {
      merge_iteration: seed,
      overlapping_anchors_count: 14,
      duplicates_purged: 3,
      confidence_delta: +0.06,
      stability_grade: 'EXCELLENT',
    },
    validation_metrics: {
      structural_similarity_mssim: 0.982,
      color_palette_fidelity: 0.974,
      gaze_angle_deviation_deg: 1.4,
      overall_production_grade: 'A+',
    },
    audit_metrics: {
      observed_ratio: 0.88,
      inferred_ratio: 0.12,
      rejected_ratio: 0.0,
      pending_ratio: 0.0,
      average_confidence: 0.96,
      total_evidence_count: 1420,
      audit_score: 9.8,
      quality_grade: 'A+',
    },
    confidence_profiles: {
      aggregate_certainty: 0.97,
      inference_depth: 4,
      semantic_confidence: 0.98,
    },
    orchestration_states: {
      active_engine: 'local_sim',
      rendering_nodes_count: 8,
      queue_occupancy_ratio: 0.12,
      engine_health_score: 1.0,
      gpu_temperature_celsius: 64,
    },
  };
}

/**
 * Pure Pipeline A extractor — intermediate pipeline, prompts, configs, graphs, and cache namespaces.
 */
export function extractExtractionNamespaces(
  context: PipelineAExtractorContext
): PipelineAExtractionNamespaces {
  const { seed } = context;
  const totalDms = context.totalDms ?? 120;
  const totalFrames = context.totalFrames ?? 80;
  const director = resolveDirector(context);

  const pre_normalization_states = {
    raw_luminance_mean: 112.4,
    gaze_divergence_raw_deg: 4.8,
    raw_motion_vectors_magnitude: 14.2,
  };

  const post_normalization_states = {
    target_luminance_mean: 120.0,
    gaze_divergence_normalized_deg: 1.5,
    normalized_motion_vectors_magnitude: 8.5,
  };

  const pre_merge_states = {
    nodes_count: 42,
    edges_count: 118,
    isolated_subgraphs: 4,
  };

  const post_merge_states = {
    nodes_count: 38,
    edges_count: 126,
    isolated_subgraphs: 0,
  };

  const recursive_hydration_states = {
    hydration_cycles: seed,
    dimension_scale: totalDms,
    frames_allocated: totalFrames,
  };

  const temporal_dedup_states = {
    redundant_frames_purged: 12,
    compression_efficiency: 0.15,
    temporal_stability_boost_score: 0.96,
  };

  const quality_lock_states = {
    locked_features: ['face_topology', 'lighting_direction', 'chromatic_palette'],
    safety_margins: 0.98,
    override_active: false,
  };

  const completion_snapshot_states = {
    snapshot_id: `SNAP-${seed}`,
    timestamp: context.deterministicTimestamp ?? new Date().toISOString(),
    hash: `SHA256-SNAP-MIGRATION-${seed}`,
  };

  const continuity_graph_states = {
    continuity_paths: ['primary_subject_tracking', 'ambient_fog_decay', 'camera_glide_continuity'],
    overall_path_score: 0.98,
  };

  const memory_graph_states = {
    active_memory_references: [`SCENE-REF-${seed - 1}`, `SCENE-REF-${seed - 2}`],
    recalled_relationships_count: 12,
  };

  const midjourney_prompts = [
    `Cinematography snapshot of ${director.title}, directed by ${director.name}, visual atoms populated, extreme high fidelity --ar 16:9 --v 6.1 --style raw`,
  ];
  const kling_prompts = [
    'Steady walk tracking camera, realistic cinematic physics simulation, fluid atmospheric dynamics, 4k ultra realistic, cinematic lighting',
  ];
  const runway_prompts = [
    'Camera panning left slowly, smooth lens stabilization 100%, motion flow intensity 0.8, absolute spatial consistency',
  ];
  const flux_prompts = [
    'Gaze lock eye contact details, high color depth, Inter font subtitle telemetry, Space Grotesk cinematic composition template',
  ];
  const sdxl_prompts = [
    'Masterful lighting geometry, rim spotlighting, ambient dust particles visible, organic worn fabric texture representation',
  ];
  const style_core_prompts = [
    'cinematic style bible v82.6, ultra high details, golden ratio symmetry framing, immersive color grade',
  ];
  const character_lock_prompts = [
    'character identity lock ENTITY-A, stabilized face morphology ratio, exact costume replication slate duster coat',
  ];
  const engine_adapter_outputs = {
    midjourney_v6: { aspect_ratio: '16:9', quality: 'high', stylize: 300 },
    runway_gen3: { resolution: '1080p', upscale: true, motion: 5 },
  };
  const style_bible_outputs = {
    palette: ['#1C1D21', '#C7C4B7', '#9E9E9C'],
    theme: 'poetic_realism',
    grain_density: 'fine_filmic',
  };

  const stabilityConfig = {
    gaze_persistence_threshold: 0.95,
    pose_drift_tolerance: 0.1,
    lighting_continuity_limit: 0.05,
    reconstruction_attempts_max: 3,
  };

  const quality_gates = {
    minimum_composition_fidelity: 0.9,
    minimum_identity_retention: 0.95,
    minimum_motion_continuity: 0.85,
    strict_mode_active: true,
  };

  const orchestration_configs = {
    concurrency_limit: 4,
    gpu_allocation_weight: 1.0,
    simulated_pacing_delay_ms: 1500,
  };

  const model_configs = {
    perception_model: 'gemini-2.0-flash',
    diffusion_model: 'flux-1-pro-ultra',
    video_generative_model: 'runway-gen3-alpha',
  };

  const scoring_configs = {
    composition_weight: 0.3,
    identity_weight: 0.4,
    motion_weight: 0.3,
  };

  const validation_configs = {
    ground_truth_library_hash: 'SHA256-GT-LIB-82-6',
    auto_revalidate_on_drift: true,
    drift_trigger_threshold: 0.15,
  };

  const dataset_thresholds = {
    minimum_sequence_scenes: 10,
    target_export_size_mb: 10.0,
    required_file_count_parity: true,
  };

  const continuity_thresholds = {
    maximum_allowable_spatial_delta: 0.12,
    maximum_allowable_color_deviation: 0.08,
  };

  const persistence_thresholds = {
    minimum_face_geometry_match_ratio: 0.98,
    minimum_costume_palette_retention: 0.96,
  };

  const scene_graph = {
    nodes: [
      { id: 'NODE_SUBJECT', label: 'Subject', type: 'Character' },
      { id: 'NODE_FOCUS', label: 'Focus Object', type: 'Prop' },
      { id: 'NODE_ATMOSPHERE', label: 'Atmosphere', type: 'Environment' },
    ],
    edges: [
      { source: 'NODE_SUBJECT', target: 'NODE_FOCUS', relation: 'gaze_anchored', weight: 0.95 },
      { source: 'NODE_ATMOSPHERE', target: 'NODE_SUBJECT', relation: 'shrouds', weight: 0.85 },
    ],
  };

  const continuity_graph = {
    nodes: [
      { id: 'SCENE_PREV', label: 'Previous Scene Frame', type: 'State' },
      { id: 'SCENE_CURRENT', label: 'Current Scene Frame', type: 'State' },
    ],
    edges: [
      { source: 'SCENE_PREV', target: 'SCENE_CURRENT', relation: 'motion_carry_over', weight: 0.98 },
    ],
  };

  const emotional_graph = {
    nodes: [
      { id: 'DREAD', label: 'Narrative Tension / Dread', type: 'Emotion' },
      { id: 'ANTICIPATION', label: 'Viewer Expectation', type: 'Emotion' },
    ],
    edges: [
      { source: 'DREAD', target: 'ANTICIPATION', relation: 'compounds', weight: 0.9 },
    ],
  };

  const temporal_graph = {
    nodes: [
      { id: 'T1', label: 'Introduction Beat', type: 'Timecode' },
      { id: 'T2', label: 'Escalation Beat', type: 'Timecode' },
    ],
    edges: [
      { source: 'T1', target: 'T2', relation: 'time_transition_fluid', weight: 1.0 },
    ],
  };

  const cinematic_grammar_graph = {
    nodes: [
      { id: 'RULE_CU', label: 'Close-up Framing', type: 'GrammarRule' },
      { id: 'RULE_EYE_LEVEL', label: 'Eye-level Spectator Relation', type: 'GrammarRule' },
    ],
    edges: [
      { source: 'RULE_CU', target: 'RULE_EYE_LEVEL', relation: 'enhances_intimacy', weight: 0.95 },
    ],
  };

  const motif_graph = {
    nodes: [
      { id: 'MOTIF_AMBER', label: 'Amber Color Temperature', type: 'Motif' },
      { id: 'MOTIF_RAIN', label: 'Continuous Wet Refraction', type: 'Motif' },
    ],
    edges: [
      { source: 'MOTIF_AMBER', target: 'MOTIF_RAIN', relation: 'creates_nostalgic_depth', weight: 0.92 },
    ],
  };

  const hydrated_caches = {
    cache_id: `HYD-CACHE-${seed}`,
    size_elements: 250,
    hit_ratio: 0.99,
  };

  const recursive_caches = {
    recursion_depth: 3,
    computed_states_reused: 1420,
  };

  const runtime_caches = {
    memory_allocated_mb: 128,
    active_connections: 4,
  };

  const merge_caches = {
    merged_elements_count: 48,
    collisions_resolved: 0,
  };

  const temporal_caches = {
    pacing_waveform_cached: [0.22, 0.35, 0.48, 0.72, 0.88, 0.65],
    duration: 120.0,
  };

  const memory_caches = {
    recalled_identities_hash: `SHA256-MEM-CACHE-${seed}`,
    retention_factor: 1.0,
  };

  return {
    intermediate_pipeline_states: {
      pre_normalization_states,
      post_normalization_states,
      pre_merge_states,
      post_merge_states,
      recursive_hydration_states,
      temporal_dedup_states,
      quality_lock_states,
      completion_snapshot_states,
      continuity_graph_states,
      memory_graph_states,
    },
    prompts_extraction: {
      midjourney_prompts,
      kling_prompts,
      runway_prompts,
      flux_prompts,
      sdxl_prompts,
      style_core_prompts,
      character_lock_prompts,
      engine_adapter_outputs,
      style_bible_outputs,
    },
    configurations_extraction: {
      stabilityConfig,
      quality_gates,
      orchestration_configs,
      model_configs,
      scoring_configs,
      validation_configs,
      dataset_thresholds,
      continuity_thresholds,
      persistence_thresholds,
    },
    graphs_extraction: {
      scene_graph,
      continuity_graph,
      emotional_graph,
      temporal_graph,
      cinematic_grammar_graph,
      motif_graph,
    },
    raw_caches_extraction: {
      hydrated_caches,
      recursive_caches,
      runtime_caches,
      merge_caches,
      temporal_caches,
      memory_caches,
    },
  };
}

/**
 * Builds a partial Pipeline A donor snapshot from pure extractors (bridge-ready, no hydration side effects).
 */
export function buildPipelineADonorSnapshot(
  context: PipelineAExtractorContext
): Partial<CinematicExtractionResult> {
  const { seed, sceneId } = context;
  const totalDms = context.totalDms ?? 120;
  const totalFrames = context.totalFrames ?? 80;
  const memory = extractPipelineMemoryBundle(seed);
  const telemetry = extractPipelineTelemetryBundle(seed);
  const namespaces = extractExtractionNamespaces(context);
  const includeDense = context.includeDenseTrajectories !== false;

  return {
    visual_atoms: extractRichVisualAtoms(sceneId, seed),
    relationship_graph: extractRichRelationshipGraph(seed),
    latent_steering: {
      vectors: { semantic_16d: {} },
      engine_adapters: {},
      ...(includeDense
        ? { dense_latent_trajectories: extractDenseLatentTrajectories(seed, totalDms, totalFrames) }
        : {}),
    },
    ...memory,
    ...telemetry,
    ...namespaces,
  };
}
