
// Fix: Added missing type exports for Scene, EmotionWave, and QualityScore, and expanded CharacterBook interface to support system data

export type TimeOfDay = 'morning' | 'afternoon' | 'late_afternoon' | 'sunset' | 'night';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Weather = 'sunny' | 'rainy' | 'snowy' | 'windy' | 'foggy';
export type Scene = 'outdoor' | 'indoor' | 'night';

export interface EmotionWave {
  scene_id: string;
  timecode: string;
  context: {
    environment: Scene;
    lighting: string;
    time_of_day: TimeOfDay;
  };
  emotion_wave: {
    intensity: number;
    color_bias: {
      warmth: number;
      softness: number;
      melancholy: number;
    };
  };
  light_signature: {
    diffusion: number;
  };
}

export interface QualityScore {
  score: number;
  feedback: string;
  checklist?: {
    isLayerSeparated?: boolean;
    isAmberSoul?: boolean;
    isMinimalist?: boolean;
    isI2VReady?: boolean;
    isHobbitReady?: boolean;
    isSkyBlue?: boolean;
    isCharacterStatic?: boolean;
    isDepthGap?: boolean;
    [key: string]: boolean | undefined;
  };
}

export interface CharacterBook {
  version: string;
  master_image_id?: string;
  global_height_scale?: string;
  styleAnchor?: string;
  globalEnvironmentDNA?: string;
  characters: CharacterEntry[];
  subCharacters?: SubCharacterEntry[];
  environmentDNA?: {
    dawn: string;
    morning: string;
    afternoon: string;
    late_afternoon: string;
    sunset: string;
    night: string;
    dream: string;
    spiritual: string;
    global: string;
  };
}

export interface CharacterDNA {
  // --- Core Identity (Master) ---
  age?: string;
  species?: string;
  relationship?: string;
  core_identity?: string;
  
  // --- Visual DNA ---
  face_eyes?: string;
  hair?: string;
  skin?: string;
  outfit?: string;
  footwear?: string;
  
  // --- AGI World Logic Metrics (Normalized 0.0 ~ 1.0) ---
  aura_fidelity?: number; 
  
  gaze_logic?: {
    default_target?: string;
    eye_contact_duration_norm?: number; // Relative to scene length
    focus_intensity?: number;
    gaze_vector?: { x: number; y: number; z: number };
  };
  
  spatial_context?: {
    preferred_depth?: string; 
    z_axis_offset_norm?: number;
    emotional_proximity_score?: number; // 0.0 ~ 1.0
    distance_to_camera_norm?: number;
  };
  
  physical_granularity?: {
    material_resistance_norm?: number; // Drag coefficient
    mass_density_norm?: number;
    physics_exaggeration_factor?: number; // 지브리식 과장 정도
  };
  
  interaction_logic?: {
    contact_pressure_norm?: number;
    grip_precision_score?: number;
    reaction_time_delta_t?: number; // Δt (Seconds)
  };

  additional_notes?: string;
}

export interface CausalityPoint {
  id: string;
  trigger_entity_id: string;
  action_intent: string;
  causality_type: 'physical' | 'emotional' | 'narrative';
  reaction_delay_sec: number; // Δt
  normalized_intensity: number;
}

export interface TimelineSegment {
  id: string;
  start_time: number;
  end_time: number;
  action_tag: string; // E.g. "walking", "eye_contact"
  semantic_description: string;
  intensity: number; // 0.0 ~ 1.0
}

export interface WorldLogicMetadata {
  normalization_reference: {
    velocity?: string; // e.g., "character_max_run", "frame_width_unit"
    distance?: string; // e.g., "gonegi_height_unit"
    time?: string;     // e.g., "scene_length_sec"
  };
  value_source: {
    method: 'llm_inference' | 'pixel_analysis' | 'manual_input' | 'simulation';
    confidence_score: number; // 0.0 ~ 1.0
  };
  causality_link?: {
    cause_id?: string; // Links to WorldLogicCause
    effect_id?: string; // Links to WorldLogicEffect
  };
}

export interface CharacterEntry {
  id: string;
  name: string;
  species?: string;
  visual_dna: string;
  dna_details?: CharacterDNA;
  master_image_id?: string;
  elite_image_id?: string;
  type: string;
  slot_index?: number;
  grid_position?: string;
  qualityScore?: number;
  auditFeedback?: string;
  causality_chain?: CausalityPoint[];
  world_logic?: WorldLogicMetadata; // AGI 학습용 메타데이터
}

export interface SubCharacterEntry {
  id: string;
  name: string;
  description: string;
  visual_dna?: string;
  image_id?: string; // NPC 비주얼 앵커
}

export interface MetaConfig {
  meta_id: string;
  palette_bank: string[];
  lighting_bank: {
    indoor: { rolloff: number; ambient_haze: number; };
    outdoor?: { rolloff: number; ambient_haze: number; };
  };
  material_rules: {
    metal_to_wood: number;
    plastic_to_wood: number;
    net_to_vine: number;
    rubber_to_stone: number;
  };
  notes: string;
}

export interface ProfileConfig {
  style_weight: number;
  color_weight: number;
  structure_weight: number;
  painterly: {
    stroke_depth: number;
    edge_soften: number;
    color_bleed: number;
    film_softness: number;
    grain: number;
  };
  profile_overrides: {
    contrast: number;
    air_haze: number;
    white_balance_cool: number;
    palette: string;
  };
  remap: { replacement_strength: number; };
  subject: { animal_closeup: boolean; };
  profile_id: string;
  profile_version: string;
  category: string;
  scene: Scene;
  notes: string;
}

export interface GhibliAnchor {
  id: string;
  status: 'SUCCESS' | 'FAILURE';
  metaConfig: MetaConfig;
  profileConfig: ProfileConfig;
  userDescription: string;
  timestamp: number;
  thumbnail?: string;
  origin_app_id?: string; // 어느 앱에서 왔는지 기록
}

export interface CertaintyValue {
  value: number;
  certainty: number;
}

export interface VisualAtoms {
  light_type: 'hard_side' | 'soft_top' | 'rim_back' | 'natural_diffused' | 'practical_point';
  camera_proximity: number;             // 0.0 ~ 1.0
  grain_density: number;                // Texture granularity
  lens_profile: 'anamorphic' | 'spherical' | 'vintage' | 'broadcast' | 'macro';
  surface_response: 'wet_reflective' | 'matte_diffuse' | 'metallic' | 'organic_soft';
}

export interface FeedbackLoopData {
  target_vector: number[];
  generated_vector: number[];
  vector_loss: number;                  // Error delta
  correction_bias: {
    [key: string]: number;
  };
}

export interface VisualAtom {
  atom_id: string;
  label: string;
  coordinate_box?: [number, number, number, number]; // [y1, x1, y2, x2]
  significance: number;
  material_properties?: {
    surface_type: string;
    roughness: number;
    reflectivity: number;
    degradation: number;
  };
  spatial_intelligence: {
    screen_position: string; // e.g. "center_middle"
    depth_layer: 'foreground' | 'midground' | 'background';
    framing: 'ECU' | 'CU' | 'MCU' | 'MS' | 'MLS' | 'LS' | 'ELS' | 'FS';
    camera_relation: string; // e.g. "eye-level-gaze"
    focus_priority: number; // 0.0 ~ 1.0
  };
  semantic_role?: string; // e.g., "symbolic_antagonist_object"
}

export interface VectorSpaces {
  cinematic_latent_embeddings_v2: number[];
}

export enum MeasurementStatus {
  Observed = 'Observed',
  Derived = 'Derived',
  Inferred = 'Inferred',
  Speculative = 'Speculative',
  Symbolic = 'Symbolic',
  Pending = 'Pending',
  Rejected = 'Rejected'
}

export enum ReasonCode {
  LOW_VISIBILITY = 'LOW_VISIBILITY',
  NPC_OCCLUSION = 'NPC_OCCLUSION',
  BACKLIGHT = 'BACKLIGHT',
  NO_REFERENCE_OBJECT = 'NO_REFERENCE_OBJECT',
  DISTANCE_LIMIT = 'DISTANCE_LIMIT',
  FOG_ATMOSPHERIC = 'FOG_ATMOSPHERIC',
  UNRECOVERABLE_NO_SIGNAL = 'UNRECOVERABLE_NO_SIGNAL',
  NONE = 'NONE'
}

export interface GroundedValue<T> {
  value: T | null;
  confidence: number;
  source: 'observed' | 'inferred' | 'speculative' | 'symbolic' | 'pending' | 'unmeasurable' | 'default';
  reasoning: string;
  evidence_count?: number;
  measurement_status?: MeasurementStatus;
  reason_code?: ReasonCode;
  retry_count?: number;
  audit_score?: number;
  evidence_sources?: string[];
  probabilistic_uncertainty_band?: [number, number]; // [lower_bound, upper_bound]
}

export interface FrameDominance {
  layer_priority: 'front' | 'middle' | 'back';
  frame_occupancy_ratio: number;
  depth_isolation_lock: boolean;
  subject_focus_score: number;
}

export type SubjectCompositionType = 'S' | 'R' | 'G' | 'M' | 'MIX';

export interface RelativeScaleReference {
  base_entity_id: string; 
  target_entity_id: string; 
  ratio: number; 
  reference_axis: 'height' | 'width' | 'volume';
  confidence: number;
  evidence_count?: number;
  status?: MeasurementStatus;
}

export interface LODDescriptionFilter {
  skip_facial_features: boolean; 
  focus_silhouette_only: boolean;
  texture_simplification_ratio: number; 
}

export interface CharacterLOD {
  level: 'long_shot_silhouette' | 'medium_shot_structural' | 'close_up_detail' | 'extreme_long_shot_dot';
  facial_fidelity_priority: number;
  texture_density: number;
  filter?: LODDescriptionFilter;
}

export interface CinematicDirectorDNA {
  camera_motion: {
    continuous_motion: GroundedValue<number>;
    human_tracking_bias: GroundedValue<number>;
    kinetic_aggression: GroundedValue<number>;
    static_patience: GroundedValue<number>;
  };
  lens_behavior: {
    focal_range: GroundedValue<[number, number]>;
    distortion_acceptance: GroundedValue<number>;
    optical_abstraction: GroundedValue<number>;
    bokeh_texture: GroundedValue<string>;
  };
  lighting_behavior: {
    naturalism_index: GroundedValue<number>;
    shadow_density: GroundedValue<number>;
    atmospheric_occlusion: GroundedValue<number>;
    color_drift: GroundedValue<number>;
  };
  composition_logic: {
    rule_of_thirds: GroundedValue<number>;
    subject_isolation: GroundedValue<number>;
    spatial_honesty: GroundedValue<number>;
    symmetry_bias: GroundedValue<number>;
    negative_space_ratio?: GroundedValue<number>;
    symmetry_score?: GroundedValue<number>;
    dominance?: FrameDominance;
  };
  editing_pacing: {
    avg_shot_duration: GroundedValue<number>;
    rhythm_uniformity: GroundedValue<number>;
    montage_intensity: GroundedValue<number>;
    cut_pressure: GroundedValue<number>;
    rhythm_anchors?: string[];
  };
  style_normalization: {
    ghibli_base: number;      // Target: 0.7
    modern_shinkai: number;  // Target: 0.2
    live_fidelity: number;    // Target: 0.1
    normalized_sum: number;   // Should be 1.0
  };
  visual_style?: {
    color_palette_intent: string;
    contrast_philosophy: string;
    dominant_palette?: string[];
    lighting_type?: string;
  };
  director_grammar?: {
    pacing_philosophy: GroundedValue<string>;
    framing_rhythm: GroundedValue<string>;
    transition_grammar: GroundedValue<string>;
    emotional_escalation_logic: GroundedValue<string>;
    spatial_blocking_signatures: GroundedValue<string>;
  };
}

export interface CinematicSceneState {
  physics: {
    luminance_contrast: GroundedValue<number>;
    motion_density: GroundedValue<number>;
    depth_isolation: GroundedValue<number>;
    camera_velocity_mps: GroundedValue<number>;
    subject_distance_meter: GroundedValue<number>;
    luminance_balance?: GroundedValue<number>;
    chroma_intensity?: GroundedValue<number>;
  };
  emotion: {
    dread: GroundedValue<number>;
    melancholy: GroundedValue<number>;
    anticipation: GroundedValue<number>;
    intimacy?: GroundedValue<number>;
    arousal_rate?: GroundedValue<number>;
    valence_bias?: GroundedValue<number>;
    catharsis_ready: GroundedValue<number>;
    isolation_score: GroundedValue<number>;
  };
  temporal: {
    time_tension_curve: GroundedValue<string>;
    rhythm_pressure: GroundedValue<number>;
    pacing_memory: GroundedValue<number>;
    pacing_waveform: number[];
    shot_memory?: GroundedValue<number>;
    scene_memory?: GroundedValue<number>;
    sequence_memory?: GroundedValue<number>;
    act_memory?: GroundedValue<number>;
    film_memory?: GroundedValue<number>;
    relationship_state_memory?: GroundedValue<string>;
    callback_residue_tracking?: GroundedValue<number>;
    motif_decay_memory?: GroundedValue<number>;
    emotional_afterimage?: GroundedValue<number>;
    scene_emotional_inheritance?: GroundedValue<number>;
  };
  optics: {
    sensor_alias: GroundedValue<string>;
    focal_length_mm: GroundedValue<number>;
    aperture_f_stop: GroundedValue<number>;
    halation_response: GroundedValue<number>;
    grain_profile: GroundedValue<string>;
  };
}

export interface ConsistencyScore {
  face: number;      // 0.0 ~ 1.0
  silhouette: number; // 0.0 ~ 1.0
  motion: number;    // 0.0 ~ 1.0
  overall: number;   // 0.0 ~ 1.0
}

export interface CharacterIdentityDNA {
  character_id: string;
  label: string;
  canonical_name?: string;
  role?: "protagonist" | "supporting" | "antagonist" | "extra";
  signature_features?: string[];
  face_signature: {
    geometric_ratios: { [key: string]: number };
    eye_geometry: string;
    jaw_line_id: string;
    skin_tone_hex: string;
  };
  hair_structure: {
    volume_index: number;
    texture_profile: string;
    chroma_signature: string;
  };
  silhouette_signature: {
    body_ratio: number;
    shoulder_breadth: number;
    trunk_profile: string;
  };
  motion_identity: {
    kinetic_rhythm: number;
    gesture_pattern: string[];
    gait_signature: string;
  };
  wardrobe_identity: {
    primary_palette: string[];
    material_texture: string;
    accessory_memory: string[];
  };
  emotion_baseline: { [key: string]: number };
}

export interface TemporalIdentityGraph {
  same_character_probability: number;
  costume_transition_delta: number;
  facial_stability_score: number;
  hair_consistency_score: number;
  identity_drift_detected: boolean;
}

export interface CinematicIdentityMemory {
  core_personality: string[];
  speech_behavior: string;
  gesture_vocabulary: string[];
  interaction_history: string[];
}

export interface SparseLatentVectors {
  semantic_16d?: { [key: string]: number };
  cinematic_latent_embeddings_v2?: number[];
}

export interface CharacterAnchorV24 {
  anchor_id: string; // e.g., ENTITY_A, KIKI_01
  label: string;
  geometric_signature: {
    face_geometry: {
      eye_ratio: number;
      jaw_line_profile: string;
      facial_width_norm: number;
    };
    hair?: {
      style: string;
      color: string;
      flow_intensity: number;
    };
    silhouette_embedding: string; // e.g., "triangular_top_heavy"
    body_ratio_signature?: string; // e.g., "1:7.5_proportions"
    motion_signature: {
      step_frequency?: number;
      kinetic_bias: string;
    };
  };
  clothing_palette: {
    primary_hex: string;
    secondary_hex?: string;
    accessory_id?: string; // e.g., "RED_RIBBON"
    material_texture: string;
  };
  persistence_score: number; // 0.0 ~ 1.0 (How reliably this character is tracked)
  spatial_anchor_region?: [number, number, number, number]; // [y1, x1, y2, x2]
}

export interface DetectedSubject {
  entity_id: string;
  type?: string;
  label?: string; // v36.0 standard
  confidence: number;
  bbox: [number, number, number, number]; // [y1, x1, y2, x2]
  spatial_identity_map?: {
    head_region: [number, number, number, number];
    torso_region: [number, number, number, number];
    motion_center: [number, number];
    color_anchor_regions: { [key: string]: [number, number, number, number] };
  };
}

export interface TemporalMemoryNode {
  frame_index: number;
  timecode?: string;
  emotion_state: string;
  pose_state?: string; // e.g., "sitting", "walking"
  motion_vector: [number, number]; // [x, y] direction
  interaction_event?: string;
  focus_point?: [number, number]; // [x, y] normalized
  activity_phase?: 'startup' | 'stable' | 'transition' | 'termination';
  primary_motion?: string;   // v36.0 standard
  secondary_motion?: string; // v36.0 standard
  narrative_beat?: string;   // v36.0 standard
}

export interface RealMeasurementV24 {
  color_distribution: { [hex: string]: number };
  lighting_vectors: {
    direction: string;
    intensity: number | null;
    color_temperature_k: number | null;
  };
  composition_metrics: {
    rule_of_thirds_compliance: number | null;
    subject_size_ratio: number | null;
    depth_variance: number | null;
    subject_grid_position: [number, number] | null; // [row, col] 1-3
  };
  optical_flow_map?: {
    intensity: number | null;
    dominant_direction: string | null;
  };
}

export interface AuditMetrics {
  observed_ratio: number;
  inferred_ratio: number;
  rejected_ratio: number;
  pending_ratio: number;
  average_confidence: number;
  total_evidence_count: number;
  audit_score: number; // 0~10 scale
  quality_grade: string; // A+, A, B...
}

export interface RemediationCost {
  token_usage: number;
  processing_time_ms: number;
  score_gain: number;
  efficiency_ratio: number; // score_gain / (token_usage / 1000)
}

export interface RemediationAttempt {
  attempt_index: number;
  strategy: 'contrast_boost' | 'frame_shift' | 'high_res_crop' | 'spatial_re-estimation' | 'spectral_analysis';
  trigger_reason: ReasonCode;
  pre_audit_score: number;
  post_audit_score: number;
  improvement: number;
  accepted: boolean;
  cost?: RemediationCost;
  timestamp: string;
}

export interface DriftMetrics {
  domain: 'physics' | 'emotion' | 'composition' | 'scale';
  average_confidence_history: { timestamp: string; value: number }[];
  drift_status: 'stable' | 'improving' | 'degrading';
  drift_slope: number;
}

export interface AuditSummary {
  overall: AuditMetrics;
  domains: {
    physics: AuditMetrics;
    emotion: AuditMetrics;
    composition: AuditMetrics;
    scale: AuditMetrics;
  };
  remediation_history?: RemediationAttempt[];
  drift_analysis?: DriftMetrics[];
  regression_detected: boolean;
  previous_score?: number;
  audit_timestamp: string;
}

// --- Pipeline Bridge (PHASE-1 additive extension) ---

export const PIPELINE_BRIDGE_VERSION = 'BRIDGE-v1' as const;

export type PipelineBridgeMode = 'A_TO_B' | 'B_TO_A' | 'BIDIRECTIONAL' | 'DRY_RUN';

export interface ContinuityMemoryState {
  continuity_lock_status?: string;
  gaze_persistence_score?: number;
  pose_drift_tolerance?: number;
  lighting_deviation_norm?: number;
  state_snapshots_count?: number;
  active_memory_references?: string[];
}

export interface EmotionalCarryoverState {
  carryover_intensity?: number;
  decay_ratio_per_frame?: number;
  underlying_mood_base?: string;
  emotional_resonance_active?: boolean;
}

export interface CameraRhythmMemoryState {
  rhythm_continuity?: number;
  velocity_delta_variance?: number;
  frame_rate_hz?: number;
  shutter_angle_deg?: number;
}

export interface MotifPersistenceState {
  motif_id?: string;
  activation_ratio?: number;
  viewer_recognition_index?: number;
  thematic_weight?: number;
}

export interface CharacterPersistenceMemoryState {
  face_topology_lock?: number;
  silhouette_persistence?: number;
  outfit_continuity_graph?: string;
  gaze_memory?: string;
  micro_expression_carryover?: number;
}

export interface PipelineMemoryBundle {
  continuity_memory?: ContinuityMemoryState;
  emotional_carryover?: EmotionalCarryoverState;
  camera_rhythm_memory?: CameraRhythmMemoryState;
  motif_persistence?: MotifPersistenceState;
  character_persistence?: CharacterPersistenceMemoryState;
}

export interface RecursiveMergeState {
  merge_iteration?: number;
  overlapping_anchors_count?: number;
  duplicates_purged?: number;
  confidence_delta?: number;
  stability_grade?: string;
}

export interface PipelineAuditMetrics {
  observed_ratio?: number;
  inferred_ratio?: number;
  rejected_ratio?: number;
  pending_ratio?: number;
  average_confidence?: number;
  total_evidence_count?: number;
  audit_score?: number;
  quality_grade?: string;
}

export interface OrchestrationStates {
  active_engine?: string;
  rendering_nodes_count?: number;
  queue_occupancy_ratio?: number;
  engine_health_score?: number;
  gpu_temperature_celsius?: number;
}

export interface PipelineExtractionBundle {
  intermediate_pipeline_states?: Record<string, unknown>;
  prompts_extraction?: Record<string, unknown>;
  configurations_extraction?: Record<string, unknown>;
  graphs_extraction?: Record<string, unknown>;
  raw_caches_extraction?: Record<string, unknown>;
}

export type ExportBridgeMode = 'OFF' | 'MEMORY_ONLY' | 'FULL_DENSITY';

export interface PipelineBridgeProvenance {
  pipeline_a_fields: string[];
  pipeline_b_fields: string[];
  bridged_at: string;
  bridge_version: typeof PIPELINE_BRIDGE_VERSION;
  mode?: PipelineBridgeMode;
  bridge_mode?: ExportBridgeMode;
}

export interface BridgeReceipt {
  added_fields: string[];
  skipped_fields: string[];
  conflict_fields: string[];
  archived_fields: string[];
  dry_run: boolean;
  mode: PipelineBridgeMode;
  bridged_at: string;
  bridge_version: typeof PIPELINE_BRIDGE_VERSION;
}

export interface BridgeExportReceipt extends BridgeReceipt {
  export_bridge_mode: ExportBridgeMode;
  scene_index: number;
}

export interface BridgeCompletenessResult {
  has_pipeline_a_memory: boolean;
  has_pipeline_b_audit: boolean;
  has_visual_atoms: boolean;
  has_relationship_graph: boolean;
  has_dense_trajectories: boolean;
  has_grounded_metadata: boolean;
  bridge_score: number;
}

// --- Temporal Cinematic Memory Graph (PHASE-5 additive extension) ---

export const TEMPORAL_MEMORY_GRAPH_VERSION = 'TEMPORAL-MEMORY-GRAPH-v1' as const;

export type TemporalMemoryEdgeKind =
  | 'emotional_transition'
  | 'visual_motif'
  | 'character_memory'
  | 'environment_memory'
  | 'cinematic_callback';

export interface TemporalMemoryEdge {
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  edge_kind: TemporalMemoryEdgeKind;
  persistence_strength: number;
  emotional_decay: number;
  recurrence_weight: number;
  narrative_distance: number;
  temporal_anchor_id: string;
  callback_strength?: number;
  propagation_tag?: string;
}

export interface SceneMemoryNode {
  node_id: string;
  scene_id: string;
  scene_index: number;
  temporal_anchor_id: string;
  mood_signature: string;
  motif_signatures: string[];
  character_signatures: string[];
  environment_signature: string;
  framing_signature: string;
  color_harmony_signature: string;
  rhythm_signature: string;
}

export interface CharacterContinuityState {
  scene_index: number;
  scene_id: string;
  emotional_drift: number;
  clothing_continuity: number;
  relationship_evolution: number;
  trust_accumulation: number;
  conflict_accumulation: number;
  companion_attachment: number;
  protagonist_authority: number;
}

export interface EnvironmentContinuityState {
  scene_index: number;
  scene_id: string;
  weather_persistence: number;
  atmospheric_evolution: number;
  lighting_progression: number;
  environmental_callback_weight: number;
  location_state_drift: number;
}

export interface TemporalMemoryGraphBundle {
  scene_memory_nodes: SceneMemoryNode[];
  emotional_transition_edges: TemporalMemoryEdge[];
  visual_motif_edges: TemporalMemoryEdge[];
  character_memory_edges: TemporalMemoryEdge[];
  environment_memory_edges: TemporalMemoryEdge[];
  cinematic_callback_edges: TemporalMemoryEdge[];
}

export interface TemporalMemoryContinuitySummary {
  total_scenes: number;
  total_edges: number;
  emotional_propagation_chains: number;
  motif_recurrence_links: number;
  character_continuity_links: number;
  environment_continuity_links: number;
  cinematic_callback_links: number;
  average_persistence_strength: number;
  average_callback_strength: number;
  character_continuity: CharacterContinuityState[];
  environment_continuity: EnvironmentContinuityState[];
}

export interface TemporalMemoryGraphValidation {
  no_orphan_memory_nodes: boolean;
  continuity_edge_validity: boolean;
  motif_recurrence_integrity: boolean;
  emotional_propagation_consistency: boolean;
  deterministic_checksum_stable: boolean;
  no_overwrite_conflicts: boolean;
  validation_score: number;
  issues: string[];
}

export interface TemporalMemoryGraphExport {
  schema_version: typeof TEMPORAL_MEMORY_GRAPH_VERSION;
  generated_at: string;
  temporal_memory_graph: TemporalMemoryGraphBundle;
  memory_node_index: Record<string, SceneMemoryNode>;
  callback_index: Record<string, TemporalMemoryEdge[]>;
  continuity_summary: TemporalMemoryContinuitySummary;
  memory_density_score: number;
  validation: TemporalMemoryGraphValidation;
  export_checksum: string;
}

// --- MasterCore DNA Injection Adapter (PHASE-6 additive extension) ---

export const MASTER_CORE_DNA_ADAPTER_VERSION = 'MASTER-CORE-DNA-ADAPTER-v1' as const;

export interface MasterCoreStyleCoreInput {
  styleKey?: string;
  materialKey?: string;
  lightingKey?: string;
  brushworkKey?: string;
  paletteKey?: string;
  styleAnchor?: string;
  styleStrength?: number;
}

export interface MasterCoreStyleCoreMetrics {
  contrast_norm?: number;
  warmth_norm?: number;
  brushwork_density?: number;
  palette_coherence?: number;
  material_fidelity?: number;
  lighting_consistency?: number;
}

export interface MasterCoreRenderRules {
  global?: string;
  character?: string;
  environment?: string;
  composition?: string;
  [key: string]: string | undefined;
}

export interface MasterCoreAssetEntry {
  asset_id: string;
  asset_kind?: 'master_image' | 'elite_image' | 'npc_image' | 'reference' | 'style_anchor';
  character_id?: string;
  label?: string;
  uri?: string;
  fingerprint?: string;
}

export interface MasterCoreDNASnapshot {
  schema_version?: string;
  characterBook?: CharacterBook;
  environmentDNA?: CharacterBook['environmentDNA'];
  styleCore?: MasterCoreStyleCoreInput;
  render_rules?: MasterCoreRenderRules | string;
  masterAssetLibrary?: MasterCoreAssetEntry[];
  global_height_scale?: string;
  styleCoreMetrics?: MasterCoreStyleCoreMetrics;
  master_image_id?: string;
  styleAnchor?: string;
  characters?: CharacterEntry[];
  subCharacters?: SubCharacterEntry[];
}

export interface MasterCoreProfile {
  adapter_version: typeof MASTER_CORE_DNA_ADAPTER_VERSION;
  book_version?: string;
  global_height_scale?: string;
  style_anchor?: string;
  master_image_id?: string;
  character_count: number;
  sub_character_count: number;
  environment_slot_count: number;
  style_core_id: string;
  render_rule_keys: string[];
  asset_count: number;
}

export interface CharacterDNAIndexEntry {
  index_key: string;
  character_id: string;
  name: string;
  type: string;
  visual_dna: string;
  grid_position?: string;
  slot_index?: number;
  dna_details?: CharacterDNA;
  master_image_id?: string;
  elite_image_id?: string;
  source: 'character' | 'sub_character';
}

export interface EnvironmentDNAIndexEntry {
  slot_key: string;
  dna_text: string;
  fingerprint: string;
}

export interface StyleCoreProfileOutput {
  style_core_id: string;
  styleKey: string;
  materialKey: string;
  lightingKey: string;
  brushworkKey: string;
  paletteKey?: string;
  styleAnchor?: string;
  styleStrength?: number;
  metrics?: MasterCoreStyleCoreMetrics;
}

export interface MasterAssetIndexEntry {
  asset_id: string;
  asset_kind: MasterCoreAssetEntry['asset_kind'];
  character_id?: string;
  label?: string;
  fingerprint: string;
  source: 'library' | 'character_book' | 'character_entry';
}

export interface MasterCoreDNAAdapterDetection {
  characters_detected: number;
  sub_characters_detected: number;
  environment_dna_detected: boolean;
  style_core_detected: boolean;
  master_image_asset_detected: boolean;
  render_rules_detected: boolean;
}

export interface MasterCoreDNAAdapterResult {
  schema_version: typeof MASTER_CORE_DNA_ADAPTER_VERSION;
  generated_at: string;
  master_core_profile: MasterCoreProfile;
  character_dna_index: Record<string, CharacterDNAIndexEntry>;
  environment_dna_index: Record<string, EnvironmentDNAIndexEntry>;
  style_core_profile: StyleCoreProfileOutput;
  master_asset_index: Record<string, MasterAssetIndexEntry>;
  detection: MasterCoreDNAAdapterDetection;
  export_checksum: string;
}

// --- Dataset Completion Audit (PHASE-5 readonly extension) ---

export const DATASET_COMPLETION_AUDIT_VERSION = 'DATASET-COMPLETION-AUDIT-v1' as const;

export type DatasetProductionReadiness =
  | 'insufficient'
  | 'partial'
  | 'strong'
  | 'feature_ready';

export interface DatasetCompletionAuditDimension {
  key: string;
  label: string;
  score: number;
  passed: boolean;
  detail: string;
}

export interface DatasetCompletionAuditGap {
  gap_id: string;
  severity: 'critical' | 'moderate' | 'informational';
  message: string;
  dimension_key: string;
}

export interface DatasetCompletionAuditCanonicalExport {
  source_file: string;
  scene_count: number;
  size_bytes: number;
  size_mb: number;
  export_checksum: string;
}

export interface DatasetCompletionAuditBridgeMetadata {
  scenes_with_bridge_provenance: number;
  scenes_with_bridge_receipt: number;
  scenes_with_export_bridge: number;
  scenes_with_pipeline_a_memory: number;
  scenes_with_pipeline_b_audit: number;
  average_bridge_score: number;
  bridge_mode_distribution: Record<string, number>;
}

export interface DatasetCompletionAuditResult {
  schema_version: typeof DATASET_COMPLETION_AUDIT_VERSION;
  generated_at: string;
  readonly_audit: true;
  canonical_export: DatasetCompletionAuditCanonicalExport;
  optional_bridge_metadata: DatasetCompletionAuditBridgeMetadata;
  dimensions: DatasetCompletionAuditDimension[];
  completion_score: number;
  gaps: DatasetCompletionAuditGap[];
  next_recommended_phase: string;
  production_readiness: DatasetProductionReadiness;
  validation: {
    deterministic_checksum_stable: boolean;
    readonly_audit: true;
    no_dataset_mutation: true;
  };
  export_checksum: string;
}

// --- Pipeline B Certification Bridge (PHASE-6 additive extension) ---

export const PIPELINE_B_CERTIFICATION_BRIDGE_VERSION = 'PIPELINE-B-CERTIFICATION-BRIDGE-v1' as const;

export interface PipelineBCertificationCoverage {
  audit_summary_coverage: number;
  golden_record_coverage: number;
  remediation_history_coverage: number;
  scenes_with_audit_summary: number;
  scenes_with_golden_record: number;
  scenes_with_remediation_history: number;
  total_scenes: number;
}

export interface PipelineBCertificationBridgeReceipt {
  scene_id: string;
  scene_index: number;
  added_fields: string[];
  skipped_fields: string[];
  conflict_fields: string[];
  bridged_at: string;
  donor_source: 'lab_import' | 'deterministic_template';
}

export interface PipelineBCertificationProvenance {
  bridged_at: string;
  bridge_version: typeof PIPELINE_B_CERTIFICATION_BRIDGE_VERSION;
  donor_source: 'lab_import' | 'deterministic_template';
  scene_index: number;
}

export interface PipelineBCertificationBridgeResult {
  schema_version: typeof PIPELINE_B_CERTIFICATION_BRIDGE_VERSION;
  generated_at: string;
  enabled: boolean;
  canonical_export_unchanged: true;
  coverage_before: PipelineBCertificationCoverage;
  coverage_after: PipelineBCertificationCoverage;
  certification_readiness_score: number;
  certification_readiness_score_before: number;
  completion_audit_score_before?: number;
  completion_audit_score_after?: number;
  completion_audit_score_delta?: number;
  bridged_scene_count: number;
  lab_import_records_available: number;
  bridge_receipts: PipelineBCertificationBridgeReceipt[];
  bridge_metadata: {
    bridge_version: typeof PIPELINE_B_CERTIFICATION_BRIDGE_VERSION;
    mode: 'B_TO_A';
    opt_in: boolean;
  };
  export_checksum: string;
}

// --- Video Grounded Quality Audit — Kiki 25s benchmark (PHASE-7 readonly) ---

export const VIDEO_GROUNDED_QUALITY_AUDIT_VERSION = 'VIDEO-GROUNDED-QUALITY-AUDIT-v1' as const;

export type VideoProductionReadinessVerdict =
  | 'insufficient'
  | 'partial'
  | 'strong'
  | 'video_ready';

export interface VideoGroundedQualityDimension {
  key: string;
  label: string;
  score: number;
  passed: boolean;
  detail: string;
}

export interface VideoGroundedQualityGap {
  gap_id: string;
  severity: 'critical' | 'moderate' | 'informational';
  message: string;
  dimension_key: string;
}

export interface Kiki25sBenchmarkReference {
  reference_title: string;
  target_scene_window_min: number;
  target_scene_window_max: number;
  target_duration_seconds: number;
  actual_scene_count: number;
  within_scene_window: boolean;
}

export interface VideoGroundedQualityAuditInputs {
  canonical_scene_count: number;
  certification_enriched_scene_count: number;
  scenes_with_temporal_bridge: number;
  scenes_with_visual_atoms: number;
  scenes_with_relationship_graph: number;
  certification_readiness_score: number;
}

export interface VideoGroundedQualityAuditResult {
  schema_version: typeof VIDEO_GROUNDED_QUALITY_AUDIT_VERSION;
  generated_at: string;
  readonly_audit: true;
  kiki_25s_benchmark: Kiki25sBenchmarkReference;
  audit_inputs: VideoGroundedQualityAuditInputs;
  dimensions: VideoGroundedQualityDimension[];
  quality_score: number;
  production_readiness_verdict: VideoProductionReadinessVerdict;
  gaps: VideoGroundedQualityGap[];
  next_recommended_phase: string;
  validation: {
    deterministic_checksum_stable: boolean;
    readonly_audit: true;
    no_dataset_mutation: true;
  };
  export_checksum: string;
}

// --- Production Certification Lock (PHASE-8 readonly) ---

export const PRODUCTION_CERTIFICATION_LOCK_VERSION = 'PRODUCTION-CERTIFICATION-LOCK-v1' as const;

export type OrchestrationReadinessLevel =
  | 'not_ready'
  | 'partial'
  | 'certified'
  | 'production_locked';

export interface FrozenFingerprintLock {
  export_fingerprint: string;
  quality_audit_fingerprint: string;
  bridge_certification_fingerprint: string;
  temporal_graph_fingerprint: string;
  locked_at: string;
  canonical_export_unchanged: true;
  scene_count: number;
  canonical_export_size_bytes: number;
}

export interface ProductionCertificationLockResult {
  schema_version: typeof PRODUCTION_CERTIFICATION_LOCK_VERSION;
  generated_at: string;
  readonly_lock: true;
  production_certification_lock: FrozenFingerprintLock;
  production_dataset_candidate_id: string;
  orchestration_readiness: OrchestrationReadinessLevel;
  quality_score_ref: number;
  video_readiness_verdict_ref: VideoProductionReadinessVerdict;
  validation: {
    deterministic_lock_checksum_stable: boolean;
    readonly_lock: true;
    no_dataset_mutation: true;
    all_fingerprints_present: boolean;
  };
  deterministic_lock_checksum: string;
}

// --- Render Orchestration Dry-Run (PHASE-8 readonly simulation) ---

export const RENDER_ORCHESTRATION_DRY_RUN_VERSION = 'RENDER-ORCHESTRATION-DRY-RUN-v1' as const;

export interface OrchestrationDryRunStep {
  step_key: string;
  label: string;
  transitions_passed: number;
  transitions_total: number;
  stability_score: number;
}

export interface OrchestrationDryRunTransition {
  from_scene_id: string;
  to_scene_id: string;
  stable: boolean;
  failure_reasons: string[];
}

export interface OrchestrationDryRunReport {
  scene_count: number;
  transition_count: number;
  steps: OrchestrationDryRunStep[];
  unstable_transitions: OrchestrationDryRunTransition[];
  simulated_duration_seconds: number;
  no_provider_calls: true;
  no_gpu_execution: true;
  no_image_generation: true;
}

export interface RenderOrchestrationDryRunResult {
  schema_version: typeof RENDER_ORCHESTRATION_DRY_RUN_VERSION;
  generated_at: string;
  readonly_simulation: true;
  production_dataset_candidate_id: string;
  orchestration_dry_run_report: OrchestrationDryRunReport;
  continuity_failure_count: number;
  scene_transition_stability: number;
  orchestration_score: number;
  validation: {
    deterministic_checksum_stable: boolean;
    readonly_simulation: true;
    no_dataset_mutation: true;
  };
  export_checksum: string;
}

// --- Multi-Sequence Expansion Blueprint (PHASE-9 readonly) ---

export const MULTI_SEQUENCE_EXPANSION_BLUEPRINT_VERSION =
  'MULTI-SEQUENCE-EXPANSION-BLUEPRINT-v1' as const;

export interface SequenceIdDefinition {
  sequence_id: string;
  sequence_index: number;
  role: 'anchor' | 'expansion' | 'bridge';
  parent_candidate_id: string;
  benchmark_ref: string;
  scene_window: { min: number; max: number };
  duration_seconds: number;
  scene_count_ref?: number;
}

export interface CrossSequenceContinuityRule {
  rule_id: string;
  dimension: string;
  required_signal: string;
  merge_strategy: string;
  gate_threshold: number;
}

export interface MemoryCarryoverSpec {
  carryover_key: string;
  source_layer: string;
  target_layer: string;
  propagation_mode: 'inherit' | 'blend' | 'reset_with_anchor';
  minimum_coverage: number;
}

export interface ProductionLockInheritance {
  parent_dataset_candidate_id: string;
  parent_lock_checksum: string;
  parent_orchestration_readiness: OrchestrationReadinessLevel;
  inherited_fingerprints: {
    export_fingerprint: string;
    quality_audit_fingerprint: string;
    bridge_certification_fingerprint: string;
    temporal_graph_fingerprint: string;
  };
  inheritance_mode: 'append_only';
  lock_epoch_ref: string;
}

export interface ExpansionSafetyGate {
  gate_id: string;
  label: string;
  required: boolean;
  pass_condition: string;
  current_status: 'pass' | 'blocked' | 'warn';
}

export interface ExpansionBlueprint {
  anchor_sequence: SequenceIdDefinition;
  planned_sequences: SequenceIdDefinition[];
  cross_sequence_continuity_rules: CrossSequenceContinuityRule[];
  character_memory_carryover: MemoryCarryoverSpec[];
  environment_memory_carryover: MemoryCarryoverSpec[];
  emotional_arc_carryover: MemoryCarryoverSpec[];
  production_lock_inheritance: ProductionLockInheritance;
  expansion_safety_gates: ExpansionSafetyGate[];
}

export interface NextSequenceRequirement {
  requirement_id: string;
  category: string;
  description: string;
  mandatory: boolean;
}

export interface ReusableDatasetContract {
  contract_id: string;
  schema_version: string;
  parent_candidate_id: string;
  required_fields: string[];
  optional_bridge_fields: string[];
  density_preservation: true;
  readonly_expansion: true;
}

export interface SequenceMergePolicy {
  policy_id: string;
  merge_mode: 'additive_append' | 'temporal_chain' | 'parallel_arc';
  fingerprint_revalidation_required: true;
  canonical_export_mutation: false;
  rules: string[];
}

export interface MultiSequenceExpansionBlueprintResult {
  schema_version: typeof MULTI_SEQUENCE_EXPANSION_BLUEPRINT_VERSION;
  generated_at: string;
  readonly_blueprint: true;
  production_lock_ref: {
    production_dataset_candidate_id: string;
    deterministic_lock_checksum: string;
    orchestration_readiness: OrchestrationReadinessLevel;
  };
  expansion_blueprint: ExpansionBlueprint;
  next_sequence_requirements: NextSequenceRequirement[];
  reusable_dataset_contract: ReusableDatasetContract;
  sequence_merge_policy: SequenceMergePolicy;
  validation: {
    deterministic_blueprint_checksum_stable: boolean;
    readonly_blueprint: true;
    no_dataset_mutation: true;
    no_video_ingestion: true;
    no_provider_calls: true;
  };
  blueprint_checksum: string;
}

// --- Expansion Readiness Gate (PHASE-10 readonly) ---

export const EXPANSION_READINESS_GATE_VERSION = 'EXPANSION-READINESS-GATE-v1' as const;

export type ExpansionReadinessVerdict = 'blocked' | 'conditional' | 'approved';

export interface ExpansionReadinessCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ExpansionReadinessIssue {
  issue_id: string;
  severity: 'blocking' | 'warning';
  check_key: string;
  message: string;
}

export interface ExpansionReadinessGateResult {
  schema_version: typeof EXPANSION_READINESS_GATE_VERSION;
  generated_at: string;
  readonly_gate: true;
  production_lock_ref: {
    production_dataset_candidate_id: string;
    deterministic_lock_checksum: string;
    orchestration_readiness: OrchestrationReadinessLevel;
  };
  blueprint_checksum_ref: string;
  checks: ExpansionReadinessCheck[];
  expansion_readiness_verdict: ExpansionReadinessVerdict;
  blocking_issues: ExpansionReadinessIssue[];
  warnings: ExpansionReadinessIssue[];
  approved_next_action: string;
  validation: {
    deterministic_gate_checksum_stable: boolean;
    readonly_gate: true;
    no_dataset_mutation: true;
    no_video_ingestion: true;
    no_provider_calls: true;
  };
  gate_checksum: string;
}

// --- SEQ-002 In-Memory Expansion Simulation (PHASE-11 readonly) ---

export const SEQ002_EXPANSION_SIMULATION_VERSION = 'SEQ002-EXPANSION-SIMULATION-v1' as const;

export interface Seq002SimulationStep {
  step_key: string;
  label: string;
  passed: boolean;
  score: number;
  detail: string;
}

export interface MergeConflictPrediction {
  conflict_id: string;
  severity: 'critical' | 'moderate' | 'informational';
  dimension: string;
  message: string;
}

export interface Seq002ContinuityBridge {
  from_sequence_id: string;
  to_sequence_id: string;
  anchor_terminal_scene_id: string;
  seq002_opening_scene_id: string;
  bridge_stable: boolean;
  timestamp_continuity: boolean;
  temporal_edge_appended: boolean;
}

export interface Seq002SimulationReport {
  anchor_sequence_id: string;
  expansion_sequence_id: string;
  anchor_scene_count: number;
  simulated_scene_count: number;
  continuity_bridge: Seq002ContinuityBridge;
  simulation_steps: Seq002SimulationStep[];
  merged_in_memory_scene_count: number;
  density_preservation: {
    structural_density_maintained: boolean;
    contract_field_coverage: number;
    canonical_export_unchanged: true;
  };
  in_memory_only: true;
  no_real_ingestion: true;
}

export interface Seq002ExpansionSimulationResult {
  schema_version: typeof SEQ002_EXPANSION_SIMULATION_VERSION;
  generated_at: string;
  readonly_simulation: true;
  production_lock_ref: {
    production_dataset_candidate_id: string;
    deterministic_lock_checksum: string;
  };
  expansion_gate_ref: {
    gate_checksum: string;
    expansion_readiness_verdict: ExpansionReadinessVerdict;
  };
  seq002_simulation_report: Seq002SimulationReport;
  predicted_merge_score: number;
  continuity_risk_score: number;
  conflict_list: MergeConflictPrediction[];
  recommended_ingestion_policy: string;
  validation: {
    deterministic_simulation_checksum_stable: boolean;
    readonly_simulation: true;
    in_memory_only: true;
    no_dataset_mutation: true;
    no_real_ingestion: true;
    no_provider_calls: true;
  };
  simulation_checksum: string;
}

// --- Lab Import Ingestion Contract (PHASE-12 readonly) ---

export const LAB_IMPORT_INGESTION_CONTRACT_VERSION = 'LAB-IMPORT-INGESTION-CONTRACT-v1' as const;

export interface AcceptedInputShape {
  format: 'json_array' | 'json_single';
  record_type: 'CinematicExtractionResult';
  target_sequence_id: string;
  candidate_file_paths: string[];
  min_scenes_per_import: number;
  max_scenes_per_import: number;
  encoding: 'utf8';
}

export interface RequiredTimestampRules {
  opening_scene_must_chain_from_anchor: true;
  v_timestamp_start_gte_anchor_terminal_end: true;
  monotonic_within_import: true;
  v_timestamp_end_gt_start: true;
  anchor_terminal_scene_id_ref: string;
}

export interface IngestionCarryoverRequirement {
  requirement_key: string;
  layer: string;
  minimum_coverage: number;
  mandatory: boolean;
}

export interface BridgeModeRequirement {
  pipeline_bridge_mode: 'B_TO_A';
  certification_bridge_enabled: true;
  merge_policy: 'temporal_chain';
  export_bridge_mode: 'OFF';
  in_memory_only_until_audit_pass: true;
}

export interface IngestionContract {
  contract_id: string;
  schema_version: typeof LAB_IMPORT_INGESTION_CONTRACT_VERSION;
  parent_dataset_candidate_id: string;
  target_sequence_id: string;
  accepted_input_shape: AcceptedInputShape;
  required_scene_fields: string[];
  required_timestamps: RequiredTimestampRules;
  character_carryover_requirements: IngestionCarryoverRequirement[];
  environment_carryover_requirements: IngestionCarryoverRequirement[];
  bridge_mode_requirement: BridgeModeRequirement;
  density_preservation: true;
  canonical_export_mutation: false;
}

export interface ValidationOrderStep {
  step_index: number;
  phase_ref: string;
  service_or_route: string;
  pass_condition: string;
}

export interface IngestionRejectionRule {
  rule_id: string;
  trigger: string;
  severity: 'hard_reject' | 'soft_reject';
  message: string;
}

export interface ApprovedImportPath {
  path_id: string;
  label: string;
  steps: string[];
  endpoint_refs: string[];
}

export interface LabImportIngestionContractResult {
  schema_version: typeof LAB_IMPORT_INGESTION_CONTRACT_VERSION;
  generated_at: string;
  readonly_contract: true;
  production_lock_ref: {
    production_dataset_candidate_id: string;
    deterministic_lock_checksum: string;
  };
  seq002_simulation_ref: {
    simulation_checksum: string;
    predicted_merge_score: number;
    recommended_ingestion_policy: string;
  };
  expansion_gate_ref: {
    gate_checksum: string;
    expansion_readiness_verdict: ExpansionReadinessVerdict;
  };
  ingestion_contract: IngestionContract;
  required_validation_order: ValidationOrderStep[];
  rejection_rules: IngestionRejectionRule[];
  approved_import_path: ApprovedImportPath;
  validation: {
    deterministic_contract_checksum_stable: boolean;
    readonly_contract: true;
    no_ingestion_executed: true;
    no_dataset_mutation: true;
    no_provider_calls: true;
  };
  contract_checksum: string;
}

// --- SEQ-002 Candidate Import Validator (PHASE-13 readonly) ---

export const SEQ002_CANDIDATE_IMPORT_VALIDATOR_VERSION =
  'SEQ002-CANDIDATE-IMPORT-VALIDATOR-v1' as const;

export type CandidateValidationVerdict = 'pass' | 'fail';

export interface CandidateValidationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface CandidateValidationReport {
  candidate_source_file: string | null;
  candidate_file_found: boolean;
  candidate_scene_count: number;
  contract_id: string;
  contract_checksum_ref: string;
  checks: CandidateValidationCheck[];
  field_coverage: Record<string, number>;
}

export interface RepairSuggestion {
  suggestion_id: string;
  check_key: string;
  message: string;
}

export interface Seq002CandidateImportValidatorResult {
  schema_version: typeof SEQ002_CANDIDATE_IMPORT_VALIDATOR_VERSION;
  generated_at: string;
  readonly_validation: true;
  candidate_validation_report: CandidateValidationReport;
  validation_verdict: CandidateValidationVerdict;
  rejection_reasons: string[];
  repair_suggestions: RepairSuggestion[];
  approved_for_ingestion: boolean;
  validation: {
    deterministic_validator_checksum_stable: boolean;
    readonly_validation: true;
    no_ingestion_executed: true;
    no_dataset_mutation: true;
    no_provider_calls: true;
  };
  validator_checksum: string;
}

// --- SEQ-002 Candidate Fixture Builder (PHASE-14 deterministic fixture) ---

export const SEQ002_CANDIDATE_FIXTURE_BUILDER_VERSION =
  'SEQ002-CANDIDATE-FIXTURE-BUILDER-v1' as const;

export interface Seq002FixtureBuildReport {
  output_file: string;
  scene_count: number;
  anchor_terminal_scene_id: string;
  sequence_id: string;
  fixture_scene_ids: string[];
  pipeline_b_audit_coverage: number;
  pipeline_b_golden_coverage: number;
  canonical_export_unchanged: true;
  fixture_only: true;
}

export interface Seq002CandidateFixtureBuilderResult {
  schema_version: typeof SEQ002_CANDIDATE_FIXTURE_BUILDER_VERSION;
  generated_at: string;
  fixture_build_report: Seq002FixtureBuildReport;
  validator_verdict_after_build: CandidateValidationVerdict;
  approved_for_ingestion_after_build: boolean;
  validation: {
    deterministic_fixture_checksum_stable: boolean;
    fixture_only: true;
    no_canonical_export_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
  };
  fixture_checksum: string;
}

// --- SEQ-002 Ingestion Dry-Run (PHASE-15 readonly in-memory) ---

export const SEQ002_INGESTION_DRY_RUN_VERSION = 'SEQ002-INGESTION-DRY-RUN-v1' as const;

export interface IngestionDryRunStep {
  step_key: string;
  label: string;
  passed: boolean;
  score: number;
  detail: string;
}

export interface IngestionDryRunReport {
  anchor_scene_count: number;
  candidate_scene_count: number;
  merged_in_memory_scene_count: number;
  candidate_source_file: string | null;
  validator_pass_ref: boolean;
  validator_checksum_ref: string;
  simulation_steps: IngestionDryRunStep[];
  canonical_export_unchanged: true;
  in_memory_only: true;
}

export interface Seq002IngestionDryRunResult {
  schema_version: typeof SEQ002_INGESTION_DRY_RUN_VERSION;
  generated_at: string;
  readonly_dry_run: true;
  ingestion_dry_run_report: IngestionDryRunReport;
  predicted_scene_count: number;
  predicted_quality_score: number;
  predicted_orchestration_score: number;
  merge_conflicts: MergeConflictPrediction[];
  approved_for_real_ingestion: boolean;
  validation: {
    deterministic_dry_run_checksum_stable: boolean;
    readonly_dry_run: true;
    in_memory_only: true;
    no_canonical_export_mutation: true;
    no_provider_calls: true;
  };
  dry_run_checksum: string;
}

// --- Real SEQ-002 In-Memory Ingestion (PHASE-16 runtime merge, no export overwrite) ---

export const REAL_SEQ002_INGESTION_VERSION = 'REAL-SEQ002-INGESTION-v1' as const;

export interface RealIngestionStep {
  step_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface MergedLockCandidate {
  parent_production_dataset_candidate_id: string;
  parent_orchestration_readiness: OrchestrationReadinessLevel;
  merged_production_dataset_candidate_id: string;
  merged_orchestration_readiness: OrchestrationReadinessLevel;
  lock_inheritance: 'preserved' | 'degraded' | 'blocked';
  parent_lock_checksum_ref: string;
}

export interface RealIngestionReport {
  anchor_scene_count: number;
  seq002_scene_count: number;
  active_scene_count: number;
  candidate_source_file: string | null;
  dry_run_approval_ref: boolean;
  dry_run_checksum_ref: string;
  ingestion_steps: RealIngestionStep[];
  temporal_chain_merged: boolean;
  certification_preserved: boolean;
  continuity_preserved: boolean;
  production_lock_inherited: boolean;
  canonical_export_unchanged: true;
  in_memory_only: true;
  destructive_merge: false;
}

export interface RealSeq002IngestionResult {
  schema_version: typeof REAL_SEQ002_INGESTION_VERSION;
  generated_at: string;
  readonly_ingestion: true;
  real_ingestion_report: RealIngestionReport;
  active_scene_count: number;
  merged_quality_score: number;
  merged_orchestration_score: number;
  merged_lock_candidate: MergedLockCandidate;
  validation: {
    deterministic_ingestion_checksum_stable: boolean;
    readonly_ingestion: true;
    in_memory_only: true;
    no_canonical_export_mutation: true;
    no_overwrite: true;
    no_destructive_merge: true;
    no_provider_calls: true;
    no_image_generation: true;
  };
  ingestion_checksum: string;
}

// --- Runtime Dataset Re-Certification (PHASE-17 readonly, 33-scene active runtime) ---

export const RUNTIME_DATASET_RECERTIFICATION_VERSION =
  'RUNTIME-DATASET-RECERTIFICATION-v1' as const;

export interface RuntimeRecertificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  score: number;
  detail: string;
}

export interface RuntimeLockCandidate {
  phase16_merged_candidate_id_ref: string;
  runtime_production_dataset_candidate_id: string;
  runtime_orchestration_readiness: OrchestrationReadinessLevel;
  lock_inheritance: 'preserved' | 'degraded' | 'blocked';
  parent_lock_checksum_ref: string;
  phase16_lock_inheritance_ref: MergedLockCandidate['lock_inheritance'];
}

export interface RuntimeRecertificationReport {
  active_scene_count: number;
  anchor_scene_count: number;
  seq002_scene_count: number;
  phase16_ingestion_checksum_ref: string;
  inherited_lock_candidate_ref: string;
  temporal_graph_checksum_ref: string;
  recertification_checks: RuntimeRecertificationCheck[];
  all_checks_passed: boolean;
  canonical_export_unchanged: true;
  in_memory_only: true;
}

export interface RuntimeDatasetRecertificationResult {
  schema_version: typeof RUNTIME_DATASET_RECERTIFICATION_VERSION;
  generated_at: string;
  readonly_recertification: true;
  runtime_recertification_report: RuntimeRecertificationReport;
  runtime_quality_score: number;
  runtime_orchestration_score: number;
  runtime_production_readiness: VideoProductionReadinessVerdict;
  runtime_lock_candidate: RuntimeLockCandidate;
  runtime_dataset_fingerprint: string;
  validation: {
    deterministic_recertification_checksum_stable: boolean;
    readonly_recertification: true;
    in_memory_only: true;
    no_canonical_export_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
  };
  recertification_checksum: string;
}

// --- Runtime Temporal Chain Stabilization (PHASE-18 readonly longform analyzer) ---

export const RUNTIME_TEMPORAL_CHAIN_STABILIZER_VERSION =
  'RUNTIME-TEMPORAL-CHAIN-STABILIZER-v1' as const;

export type RuntimeChainVerdict = 'stable' | 'warning' | 'unstable';

export interface EmotionalDecayMapEntry {
  scene_index: number;
  scene_id: string;
  emotional_decay: number;
  carryover_intensity: number;
}

export interface TemporalDriftAnalysis {
  temporal_drift_score: number;
  temporal_anchor_stability: number;
  recursive_memory_integrity: number;
  continuity_decay: number;
  callback_fragmentation: number;
  memory_anchor_divergence: number;
}

export interface EmotionalEntropyAnalysis {
  emotional_entropy_score: number;
  emotion_chain_stability: number;
  emotional_decay_map: EmotionalDecayMapEntry[];
  abrupt_discontinuities: number;
  unresolved_emotional_chains: number;
  emotional_loop_instability: number;
}

export interface CallbackSaturationAnalysis {
  callback_saturation_score: number;
  motif_repetition_density: number;
  cinematic_callback_balance: number;
  framing_repetition_density: number;
  color_callback_oversaturation: number;
  rhythm_callback_collisions: number;
}

export interface RecursiveMemoryLoadAnalysis {
  recursive_load_score: number;
  memory_graph_pressure: number;
  edge_density_risk: number;
  accumulated_continuity_burden: number;
  graph_recursion_depth: number;
}

export interface TemporalGrowthProjection {
  target_scene_count: number;
  projected_stability: number;
  projected_temporal_drift: number;
  projected_emotional_entropy: number;
  projected_callback_saturation: number;
  projected_edge_density: number;
}

export interface LongformRuntimeStability {
  predicted_50_scene_stability: number;
  predicted_75_scene_stability: number;
  predicted_120_scene_stability: number;
  projections: TemporalGrowthProjection[];
}

export interface RuntimeChainSafetyGates {
  temporal_drift_max: number;
  emotional_entropy_max: number;
  callback_saturation_max: number;
  edge_density_max: number;
  longform_stability_min: number;
}

export interface RuntimeTemporalStabilizationReport {
  active_scene_count: number;
  runtime_dataset_fingerprint_ref: string;
  runtime_recertification_checksum_ref: string;
  runtime_lock_inheritance_ref: RuntimeLockCandidate['lock_inheritance'];
  temporal_graph_checksum_ref: string;
  temporal_drift: TemporalDriftAnalysis;
  emotional_entropy: EmotionalEntropyAnalysis;
  callback_saturation: CallbackSaturationAnalysis;
  recursive_memory_load: RecursiveMemoryLoadAnalysis;
  longform_stability: LongformRuntimeStability;
  safety_gates: RuntimeChainSafetyGates;
  runtime_chain_verdict: RuntimeChainVerdict;
  canonical_export_unchanged: true;
  runtime_dataset_unchanged: true;
  readonly_analysis: true;
}

export interface RuntimeTemporalChainStabilizationResult {
  schema_version: typeof RUNTIME_TEMPORAL_CHAIN_STABILIZER_VERSION;
  generated_at: string;
  readonly_stabilization: true;
  runtime_temporal_stabilization_report: RuntimeTemporalStabilizationReport;
  temporal_drift_score: number;
  emotional_entropy_score: number;
  callback_saturation_score: number;
  recursive_load_score: number;
  runtime_chain_verdict: RuntimeChainVerdict;
  predicted_120_scene_stability: number;
  validation: {
    deterministic_stabilization_checksum_stable: boolean;
    readonly_stabilization: true;
    in_memory_only: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
    no_graph_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
    runtime_lock_inheritance_preserved: boolean;
  };
  stabilization_checksum: string;
}

// --- Longform Dataset Export Candidate (PHASE-19 runtime export packaging) ---

export const LONGFORM_DATASET_EXPORT_CANDIDATE_VERSION =
  'LONGFORM-DATASET-EXPORT-CANDIDATE-v1' as const;

export interface ProvenanceChainLink {
  phase_key: string;
  phase_label: string;
  artifact_ref: string;
  checksum_ref: string;
}

export interface SequenceExpansionMetadata {
  anchor_sequence_id: string;
  expansion_sequence_id: string;
  anchor_scene_count: number;
  expansion_scene_count: number;
  active_scene_count: number;
  merge_policy_id: string;
  expansion_contract_id: string;
  candidate_source_file: string | null;
  longform_projection_120_stability: number;
  runtime_chain_verdict: RuntimeChainVerdict;
}

export interface LongformExportCandidatePackage {
  runtime_scene_count: number;
  runtime_dataset: CinematicExtractionResult[];
  runtime_lock_candidate: RuntimeLockCandidate;
  runtime_recertification_report: RuntimeRecertificationReport;
  runtime_temporal_stabilization_report: RuntimeTemporalStabilizationReport;
  sequence_expansion_metadata: SequenceExpansionMetadata;
  provenance_chain: ProvenanceChainLink[];
  canonical_export_unchanged: true;
  runtime_export_only: true;
}

export interface LongformDatasetExportCandidateResult {
  schema_version: typeof LONGFORM_DATASET_EXPORT_CANDIDATE_VERSION;
  generated_at: string;
  readonly_export_candidate: true;
  longform_export_candidate_package: LongformExportCandidatePackage;
  export_candidate_id: string;
  runtime_dataset_fingerprint: string;
  export_checksum: string;
  validation: {
    deterministic_export_checksum_stable: boolean;
    readonly_export_candidate: true;
    runtime_export_only: true;
    no_canonical_export_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
    runtime_lock_inheritance_preserved: boolean;
  };
}

// --- Longform Dataset Production Lock (PHASE-20 readonly lock on export candidate) ---

export const LONGFORM_DATASET_PRODUCTION_LOCK_VERSION =
  'LONGFORM-DATASET-PRODUCTION-LOCK-v1' as const;

export interface LongformProductionLockCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface LongformProductionLock {
  export_candidate_checksum_ref: string;
  runtime_dataset_fingerprint: string;
  runtime_lock_candidate_id: string;
  locked_export_id: string;
  locked_at: string;
  runtime_scene_count: number;
  canonical_export_unchanged: true;
  parent_canonical_size_bytes: number;
  recertification_checksum_ref: string;
  stabilization_checksum_ref: string;
  provenance_chain_length: number;
}

export interface LongformDatasetProductionLockResult {
  schema_version: typeof LONGFORM_DATASET_PRODUCTION_LOCK_VERSION;
  generated_at: string;
  readonly_lock: true;
  lock_verification_checks: LongformProductionLockCheck[];
  longform_production_lock: LongformProductionLock;
  locked_export_id: string;
  production_lock_checksum: string;
  release_readiness_verdict: OrchestrationReadinessLevel;
  export_candidate_id_ref: string;
  validation: {
    deterministic_production_lock_checksum_stable: boolean;
    readonly_lock: true;
    no_canonical_export_mutation: true;
    no_runtime_export_rewrite: true;
    no_provider_calls: true;
    all_lock_checks_passed: boolean;
  };
}

// --- Runtime Image Generation Compiler (PHASE-21A foundation — deterministic packages only) ---

export const RUNTIME_IMAGE_GENERATION_COMPILER_VERSION =
  'RUNTIME-IMAGE-GENERATION-COMPILER-v1' as const;

export interface RuntimeImageGenerationCharacterRef {
  character_id: string;
  index_key: string;
  name: string;
  visual_dna_ref: string;
  source_layer: 'relationship_graph' | 'visual_atoms' | 'memory_node' | 'character_persistence';
}

export interface RuntimeImageGenerationEnvironmentRef {
  slot_key: string;
  fingerprint: string;
  dna_text_ref: string;
}

export interface RuntimeImageGenerationVisualIdentity {
  atom_labels: string[];
  composition_hash?: string;
  palette_hash?: string;
  framing_signatures: string[];
  depth_layers: string[];
}

export interface RuntimeImageGenerationCameraProfile {
  focal_length_mm?: number | null;
  aperture_f_stop?: number | null;
  sensor_alias?: string | null;
  cinematography_tokens: string[];
  camera_motion_summary: string;
  framing: string[];
}

export interface RuntimeImageGenerationLightingProfile {
  lighting_type?: string;
  naturalism_index?: number | null;
  shadow_density?: number | null;
  color_temperature_k?: number | null;
  lighting_direction?: string | null;
  environment_tokens: string[];
}

export interface RuntimeImageGenerationEmotionalProfile {
  dominant_emotions: string[];
  mood_signature?: string;
  relationship_state_memory?: string | null;
  emotional_carryover_intensity?: number | null;
  emotion_tokens: string[];
}

export interface RuntimeImageGenerationContinuityMemory {
  temporal_anchor_id: string;
  continuity_lock_status?: string;
  active_memory_references: string[];
  character_signatures: string[];
  motif_signatures: string[];
  relationship_wording: string[];
  temporal_continuity_wording: string[];
}

export interface RuntimeImageGenerationPackage {
  scene_id: string;
  sequence_id: string;
  cinematic_prompt: string;
  negative_prompt: string;
  visual_identity: RuntimeImageGenerationVisualIdentity;
  camera_profile: RuntimeImageGenerationCameraProfile;
  lighting_profile: RuntimeImageGenerationLightingProfile;
  emotional_profile: RuntimeImageGenerationEmotionalProfile;
  continuity_memory: RuntimeImageGenerationContinuityMemory;
  temporal_anchor_id: string;
  style_core_ref: string;
  character_refs: RuntimeImageGenerationCharacterRef[];
  environment_ref: RuntimeImageGenerationEnvironmentRef;
  production_lock_ref: string;
  runtime_dataset_fingerprint: string;
}

export interface RuntimeImageGenerationCompilerCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface RuntimeImageGenerationCompilerResult {
  schema_version: typeof RUNTIME_IMAGE_GENERATION_COMPILER_VERSION;
  generated_at: string;
  readonly_compiler: true;
  production_lock_ref: string;
  locked_export_id: string;
  runtime_dataset_fingerprint: string;
  temporal_graph_checksum_ref: string;
  stabilization_verdict: string;
  style_core_ref: string;
  scene_count: number;
  scene_packages: RuntimeImageGenerationPackage[];
  compiler_verification_checks: RuntimeImageGenerationCompilerCheck[];
  compiler_checksum: string;
  validation: {
    deterministic_compiler_checksum_stable: boolean;
    readonly_compiler: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
    no_engine_adapters: true;
    all_scenes_compiled: boolean;
    all_prompts_generated: boolean;
  };
}

// --- Image Package Readiness Audit (PHASE-21B readonly pre-generation gate) ---

export const IMAGE_PACKAGE_READINESS_AUDIT_VERSION =
  'IMAGE-PACKAGE-READINESS-AUDIT-v1' as const;

export type ImagePackageReadinessVerdict = 'ready' | 'conditional' | 'not_ready';

export interface ImagePackageReadinessGap {
  gap_id: string;
  severity: 'critical' | 'moderate' | 'informational';
  check_key: string;
  message: string;
  scene_id?: string;
}

export interface ImagePackageReadinessCheck {
  check_key: string;
  label: string;
  passed: boolean;
  score: number;
  detail: string;
}

export interface ImagePackageReadinessAuditResult {
  schema_version: typeof IMAGE_PACKAGE_READINESS_AUDIT_VERSION;
  generated_at: string;
  readonly_audit: true;
  compiler_checksum_ref: string;
  production_lock_ref: string;
  runtime_dataset_fingerprint: string;
  scene_count: number;
  checks: ImagePackageReadinessCheck[];
  image_package_readiness_score: number;
  readiness_verdict: ImagePackageReadinessVerdict;
  gap_list: ImagePackageReadinessGap[];
  risky_scene_ids: string[];
  next_recommended_phase: string;
  prompt_length_stats: {
    min: number;
    max: number;
    avg: number;
    within_range_count: number;
    acceptable_min: number;
    acceptable_max: number;
  };
  audit_checksum: string;
  validation: {
    deterministic_audit_checksum_stable: boolean;
    readonly_audit: true;
    no_prompt_rewrite: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
  };
}

// --- Prompt Compression Engine (PHASE-21C engine-neutral packaging) ---

export const PROMPT_COMPRESSION_ENGINE_VERSION = 'PROMPT-COMPRESSION-ENGINE-v1' as const;

export interface CompressedImagePackage {
  scene_id: string;
  sequence_id: string;
  cinematic_prompt: string;
  negative_prompt: string;
  original_prompt_length: number;
  compressed_prompt_length: number;
  compression_steps: string[];
  visual_identity: RuntimeImageGenerationVisualIdentity;
  camera_profile: RuntimeImageGenerationCameraProfile;
  lighting_profile: RuntimeImageGenerationLightingProfile;
  emotional_profile: RuntimeImageGenerationEmotionalProfile;
  continuity_memory: RuntimeImageGenerationContinuityMemory;
  temporal_anchor_id: string;
  style_core_ref: string;
  character_refs: RuntimeImageGenerationCharacterRef[];
  environment_ref: RuntimeImageGenerationEnvironmentRef;
  production_lock_ref: string;
  runtime_dataset_fingerprint: string;
}

export interface PromptCompressionVerificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface PromptCompressionEngineResult {
  schema_version: typeof PROMPT_COMPRESSION_ENGINE_VERSION;
  generated_at: string;
  readonly_compression: true;
  compiler_checksum_ref: string;
  audit_checksum_ref: string;
  readiness_verdict_ref: ImagePackageReadinessVerdict;
  scene_count: number;
  compressed_image_packages: CompressedImagePackage[];
  compression_ratio: number;
  token_savings_estimate: number;
  preserved_identity_score: number;
  engine_neutral_package_checksum: string;
  compression_stats: {
    original_total_length: number;
    compressed_total_length: number;
    original_avg_length: number;
    compressed_avg_length: number;
    avg_length_reduction_pct: number;
  };
  compression_verification_checks: PromptCompressionVerificationCheck[];
  validation: {
    deterministic_compression_checksum_stable: boolean;
    readonly_compression: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
    no_prompt_hallucination: true;
    readiness_still_pass: boolean;
    avg_prompt_length_reduced: boolean;
  };
}

// --- Identity Lock Continuity Engine (PHASE-21D pre-generation identity persistence) ---

export const IDENTITY_LOCK_CONTINUITY_ENGINE_VERSION =
  'IDENTITY-LOCK-CONTINUITY-ENGINE-v1' as const;

export interface CharacterIdentityLock {
  character_id: string;
  face_topology: string;
  silhouette: string;
  eye_spacing: string;
  hair_rhythm: string;
  cloth_geometry: string;
  color_persistence: string;
  accessory_persistence: string;
  lock_strength: number;
}

export interface EnvironmentIdentityLock {
  city_topology: string;
  architecture_rhythm: string;
  lighting_continuity: string;
  atmosphere_continuity: string;
  weather_persistence: string;
  material_response: string;
  lock_strength: number;
}

export interface TemporalVisualPersistence {
  visual_carryover: number;
  framing_continuity: number;
  color_continuity: number;
  camera_rhythm_continuity: number;
  emotional_visual_continuity: number;
}

export interface LockedImageGenerationPackage extends CompressedImagePackage {
  continuity_seed: string;
  character_identity_lock: CharacterIdentityLock[];
  environment_identity_lock: EnvironmentIdentityLock;
  temporal_visual_persistence: TemporalVisualPersistence;
  continuity_strength_score: number;
}

export interface ContinuitySeedGraphNode {
  scene_id: string;
  scene_index: number;
  sequence_id: string;
  continuity_seed: string;
  previous_seed_ref?: string;
  carryover_weight: number;
  temporal_anchor_id: string;
}

export interface ContinuitySeedGraph {
  sequence_base_seeds: Record<string, string>;
  nodes: ContinuitySeedGraphNode[];
  edge_count: number;
}

export interface IdentityLockVerificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface IdentityLockContinuityEngineResult {
  schema_version: typeof IDENTITY_LOCK_CONTINUITY_ENGINE_VERSION;
  generated_at: string;
  readonly_identity_lock: true;
  compression_checksum_ref: string;
  stabilization_verdict_ref: string;
  temporal_graph_checksum_ref: string;
  scene_count: number;
  locked_image_generation_packages: LockedImageGenerationPackage[];
  continuity_chain_integrity: boolean;
  identity_stability_score: number;
  temporal_visual_stability: number;
  continuity_seed_graph: ContinuitySeedGraph;
  identity_lock_verification_checks: IdentityLockVerificationCheck[];
  identity_lock_checksum: string;
  validation: {
    deterministic_identity_lock_checksum_stable: boolean;
    readonly_identity_lock: true;
    no_prompt_corruption: true;
    no_identity_drift: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
  };
}

// --- Engine Adapter Export Pack (PHASE-21E readonly multi-engine format export) ---

export const ENGINE_ADAPTER_EXPORT_PACK_VERSION = 'ENGINE-ADAPTER-EXPORT-PACK-v1' as const;

export type EngineAdapterFormatKey =
  | 'image_app_unified'
  | 'midjourney_pack'
  | 'flux_pack'
  | 'sdxl_pack'
  | 'runway_reference_pack';

export interface EngineAdapterExportCoreFields {
  scene_id: string;
  sequence_id: string;
  compressed_prompt: string;
  negative_prompt: string;
  identity_lock: CharacterIdentityLock[];
  continuity_seed: string;
  style_core_ref: string;
  environment_lock: EnvironmentIdentityLock;
  production_lock_ref: string;
}

export interface ImageAppUnifiedEntry extends EngineAdapterExportCoreFields {
  format: 'image_app_unified';
  temporal_anchor_id: string;
  continuity_strength_score: number;
  runtime_dataset_fingerprint: string;
}

export interface MidjourneyPackEntry extends EngineAdapterExportCoreFields {
  format: 'midjourney_pack';
  engine_prompt: string;
  engine_parameters: {
    aspect_ratio: string;
    stylize: number;
    seed: string;
    style_mode: string;
  };
}

export interface FluxPackEntry extends EngineAdapterExportCoreFields {
  format: 'flux_pack';
  engine_prompt: string;
  engine_parameters: {
    seed: number;
    guidance: number;
    steps: number;
  };
}

export interface SdxlPackEntry extends EngineAdapterExportCoreFields {
  format: 'sdxl_pack';
  engine_prompt: string;
  engine_parameters: {
    seed: number;
    cfg_scale: number;
    sampler: string;
  };
}

export interface RunwayReferencePackEntry extends EngineAdapterExportCoreFields {
  format: 'runway_reference_pack';
  engine_prompt: string;
  reference_metadata: {
    motion_hint: string;
    camera_profile_summary: string;
    continuity_seed_ref: string;
  };
}

export interface EngineAdapterFormatPack<T> {
  format_key: EngineAdapterFormatKey;
  scene_count: number;
  entries: T[];
  pack_checksum: string;
}

export interface EngineAdapterExportVerificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface EngineAdapterExportPackResult {
  schema_version: typeof ENGINE_ADAPTER_EXPORT_PACK_VERSION;
  generated_at: string;
  readonly_export: true;
  identity_lock_checksum_ref: string;
  scene_count: number;
  export_formats: {
    image_app_unified: EngineAdapterFormatPack<ImageAppUnifiedEntry>;
    midjourney_pack: EngineAdapterFormatPack<MidjourneyPackEntry>;
    flux_pack: EngineAdapterFormatPack<FluxPackEntry>;
    sdxl_pack: EngineAdapterFormatPack<SdxlPackEntry>;
    runway_reference_pack: EngineAdapterFormatPack<RunwayReferencePackEntry>;
  };
  export_pack_verification_checks: EngineAdapterExportVerificationCheck[];
  export_pack_checksum: string;
  validation: {
    deterministic_export_checksum_stable: boolean;
    readonly_export: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
    all_formats_exported: boolean;
    identity_locks_preserved: boolean;
  };
}

// --- Single Scene Generation Test (PHASE-22A controlled test generation) ---

export const SINGLE_SCENE_GENERATION_TEST_VERSION = 'SINGLE-SCENE-GENERATION-TEST-v1' as const;

export type SingleSceneTestEngine = 'midjourney_pack' | 'flux_pack';

export type SingleSceneGenerationTestStatus =
  | 'test_pass'
  | 'test_conditional'
  | 'test_fail'
  | 'test_skipped';

export interface SingleSceneGenerationEngineResult {
  scene_id: string;
  engine: SingleSceneTestEngine;
  generation_test_status: SingleSceneGenerationTestStatus;
  identity_match_score: number;
  environment_match_score: number;
  style_alignment_score: number;
  continuity_alignment_score: number;
  render_notes: string;
  recommended_adjustments: string[];
  simulated_render_fingerprint: string;
  continuity_seed_used: string;
  render_index: number;
  prompt_fidelity_score: number;
  face_consistency_score: number;
  lighting_consistency_score: number;
  continuity_lock_adherence: number;
}

export interface SingleSceneCandidateScore {
  scene_id: string;
  composite_score: number;
  emotional_stability: number;
  camera_motion_fit: number;
  environment_visibility: number;
  character_visibility: number;
  crowd_density_inverse: number;
}

export interface SingleSceneGenerationVerificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface SingleSceneGenerationTestResult {
  schema_version: typeof SINGLE_SCENE_GENERATION_TEST_VERSION;
  generated_at: string;
  readonly_test: true;
  export_pack_checksum_ref: string;
  selected_scene_id: string;
  selected_scene_rationale: string;
  candidate_scores: SingleSceneCandidateScore[];
  engines_tested: SingleSceneTestEngine[];
  render_count: number;
  max_render_count: number;
  engine_results: SingleSceneGenerationEngineResult[];
  generation_test_verification_checks: SingleSceneGenerationVerificationCheck[];
  test_checksum: string;
  validation: {
    deterministic_test_checksum_stable: boolean;
    readonly_test: true;
    single_scene_only: true;
    no_provider_calls: true;
    no_dataset_mutation: true;
    no_prompt_rewrite: true;
    no_automatic_retries: true;
    simulated_test_generation_only: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Real Render Input Pack Export (PHASE-22B external engine copy-ready export) ---

export const REAL_RENDER_INPUT_PACK_EXPORT_VERSION = 'REAL-RENDER-INPUT-PACK-EXPORT-v1' as const;

export interface SelectedSceneRenderPack {
  scene_id: string;
  sequence_id: string;
  compressed_prompt: string;
  negative_prompt: string;
  continuity_seed: string;
  style_core_ref: string;
  production_lock_ref: string;
  identity_lock: CharacterIdentityLock[];
  environment_lock: EnvironmentIdentityLock;
  temporal_anchor_id: string;
  continuity_strength_score: number;
  phase_22a_test_status: SingleSceneGenerationTestStatus;
  export_ready: true;
}

export interface MidjourneyRenderInput {
  engine: 'midjourney';
  scene_id: string;
  prompt: string;
  negative_prompt: string;
  copy_paste_command: string;
  parameters: {
    aspect_ratio: string;
    stylize: number;
    seed: string;
    style_mode: string;
  };
  identity_lock_included: true;
  continuity_seed_included: true;
}

export interface FluxRenderInput {
  engine: 'flux';
  scene_id: string;
  prompt: string;
  negative_prompt: string;
  copy_paste_json: string;
  parameters: {
    seed: number;
    guidance: number;
    steps: number;
  };
  identity_lock_included: true;
  continuity_seed_included: true;
}

export interface RealRenderSettings {
  selected_scene_id: string;
  engines: ('midjourney' | 'flux')[];
  max_renders: number;
  deterministic_seed_policy: 'continuity_seed_from_phase_21d';
  single_scene_only: true;
  external_generation_required: true;
}

export interface RealRenderInputVerificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface RealRenderInputPackExportResult {
  schema_version: typeof REAL_RENDER_INPUT_PACK_EXPORT_VERSION;
  generated_at: string;
  readonly_export: true;
  phase_22a_test_checksum_ref: string;
  export_pack_checksum_ref: string;
  identity_lock_checksum_ref: string;
  selected_scene_id: string;
  selected_scene_rationale: string;
  selected_scene_render_pack: SelectedSceneRenderPack;
  midjourney_input: MidjourneyRenderInput;
  flux_input: FluxRenderInput;
  render_settings: RealRenderSettings;
  verification_notes: string[];
  export_verification_checks: RealRenderInputVerificationCheck[];
  render_input_pack_checksum: string;
  validation: {
    deterministic_export_checksum_stable: boolean;
    readonly_export: true;
    export_only: true;
    single_scene_only: true;
    no_provider_calls: true;
    no_in_app_image_generation: true;
    prompt_copy_ready: boolean;
    identity_lock_included: boolean;
    seed_included: boolean;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Final Dataset Export Verifier (PHASE-22C longform completion gate) ---

export const FINAL_DATASET_EXPORT_VERIFIER_VERSION = 'FINAL-DATASET-EXPORT-VERIFIER-v1' as const;

export type FinalDatasetExportVerdict = 'complete' | 'incomplete';

export interface FinalDatasetExportGap {
  gap_id: string;
  severity: 'critical' | 'moderate';
  check_key: string;
  message: string;
}

export interface FinalDatasetExportVerificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface FinalDatasetExportVerifierResult {
  schema_version: typeof FINAL_DATASET_EXPORT_VERIFIER_VERSION;
  generated_at: string;
  readonly_verifier: true;
  export_candidate_id: string;
  locked_export_id: string;
  export_candidate_checksum_ref: string;
  production_lock_checksum_ref: string;
  export_candidate_json_fingerprint_ref: string;
  production_lock_json_fingerprint_ref: string;
  identity_lock_checksum_ref: string;
  engine_adapter_pack_checksum_ref: string;
  scene_count: number;
  final_verdict: FinalDatasetExportVerdict;
  gap_list: FinalDatasetExportGap[];
  verification_checks: FinalDatasetExportVerificationCheck[];
  export_route_refs: {
    export_candidate_json_file: string;
    production_lock_json_file: string;
  };
  verifier_checksum: string;
  validation: {
    deterministic_verifier_checksum_stable: boolean;
    readonly_verifier: true;
    no_dataset_rewrite: true;
    no_provider_calls: true;
    no_image_generation: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Generated Image Feedback Analyzer (PHASE-23A post-generation analysis foundation) ---

export const GENERATED_IMAGE_FEEDBACK_ANALYZER_VERSION =
  'GENERATED-IMAGE-FEEDBACK-ANALYZER-v1' as const;

export type GeneratedImageFeedbackEngine = 'midjourney' | 'flux';

export interface GeneratedImageDriftHotspot {
  hotspot_id: string;
  category: 'identity' | 'environment' | 'style' | 'temporal' | 'prompt_fidelity';
  severity: 'low' | 'moderate' | 'high';
  signal: string;
  detail: string;
}

export interface GeneratedImageFeedbackReport {
  scene_id: string;
  engine: GeneratedImageFeedbackEngine;
  identity_drift_score: number;
  environment_drift_score: number;
  style_drift_score: number;
  temporal_drift_score: number;
  prompt_fidelity_score: number;
  overall_alignment_score: number;
  drift_hotspots: GeneratedImageDriftHotspot[];
  recommended_manual_adjustments: string[];
  feedback_checksum: string;
  simulated_result_fingerprint: string;
}

export interface GeneratedImageFeedbackVerificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface GeneratedImageFeedbackAnalyzerResult {
  schema_version: typeof GENERATED_IMAGE_FEEDBACK_ANALYZER_VERSION;
  generated_at: string;
  readonly_analysis: true;
  render_input_pack_checksum_ref: string;
  identity_lock_checksum_ref: string;
  style_core_ref: string;
  scene_id: string;
  generation_results_analyzed: number;
  feedback_reports: GeneratedImageFeedbackReport[];
  analysis_verification_checks: GeneratedImageFeedbackVerificationCheck[];
  analyzer_checksum: string;
  validation: {
    deterministic_analyzer_checksum_stable: boolean;
    readonly_analysis: true;
    no_prompt_rewrite: true;
    no_auto_correction: true;
    no_dataset_mutation: true;
    no_provider_calls: true;
    no_runtime_mutation: true;
    no_canonical_export_mutation: true;
  };
}

// --- Manual Correction Pack Builder (PHASE-23B human-applicable correction suggestions) ---

export const MANUAL_CORRECTION_PACK_BUILDER_VERSION = 'MANUAL-CORRECTION-PACK-BUILDER-v1' as const;

export type PromptDeltaSuggestionType = 'prepend' | 'append' | 'emphasis' | 'parameter';

export interface SafePromptDeltaSuggestion {
  suggestion_id: string;
  category: 'identity' | 'environment' | 'style' | 'temporal' | 'prompt_fidelity';
  delta_type: PromptDeltaSuggestionType;
  suggested_text: string;
  rationale: string;
  target_engine: 'midjourney' | 'flux' | 'both';
  severity: 'low' | 'moderate' | 'high';
}

export interface ManualCorrectionPack {
  scene_id: string;
  original_compressed_prompt: string;
  original_negative_prompt: string;
  continuity_seed: string;
  style_core_ref: string;
  production_lock_ref: string;
  identity_lock_checksum_ref: string;
  feedback_analyzer_checksum_ref: string;
  render_input_pack_checksum_ref: string;
  engines_analyzed: string[];
  overall_alignment_average: number;
  suggestions_only: true;
}

export interface ManualCorrectionPackVerificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ManualCorrectionPackBuilderResult {
  schema_version: typeof MANUAL_CORRECTION_PACK_BUILDER_VERSION;
  generated_at: string;
  readonly_suggestions: true;
  manual_correction_pack: ManualCorrectionPack;
  identity_correction_notes: string[];
  environment_correction_notes: string[];
  style_correction_notes: string[];
  temporal_correction_notes: string[];
  prompt_fidelity_notes: string[];
  safe_prompt_delta_suggestions: SafePromptDeltaSuggestion[];
  correction_pack_verification_checks: ManualCorrectionPackVerificationCheck[];
  correction_pack_checksum: string;
  validation: {
    deterministic_correction_pack_checksum_stable: boolean;
    readonly_suggestions: true;
    original_prompt_unchanged: true;
    no_auto_prompt_rewrite: true;
    no_dataset_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Corrected Render Input Pack (PHASE-23C second-pass render export) ---

export const CORRECTED_RENDER_INPUT_PACK_VERSION = 'CORRECTED-RENDER-INPUT-PACK-v1' as const;

export type AppliedDeltaApplication =
  | 'prompt_prepend'
  | 'prompt_append'
  | 'prompt_emphasis'
  | 'parameter_only';

export interface AppliedManualDelta {
  suggestion_id: string;
  category: SafePromptDeltaSuggestion['category'];
  delta_type: PromptDeltaSuggestionType;
  applied_text: string;
  target_engine: 'midjourney' | 'flux' | 'both';
  application: AppliedDeltaApplication;
  rationale: string;
}

export interface CorrectionSafetyReport {
  original_prompt_preserved: true;
  corrected_prompt_is_separate_field: true;
  no_auto_rewrite_of_original: true;
  deltas_applied_count: number;
  prompt_text_delta_count: number;
  parameter_only_delta_count: number;
  safety_verdict: 'safe_for_second_pass';
  safety_notes: string[];
  blocked_operations: string[];
}

export interface CorrectedSceneRenderPack extends SelectedSceneRenderPack {
  original_compressed_prompt: string;
  corrected_compressed_prompt: string;
  original_negative_prompt: string;
  corrected_negative_prompt: string;
  correction_pass: 2;
  manual_correction_pack_checksum_ref: string;
  render_input_pack_checksum_ref: string;
}

export interface CorrectedMidjourneyRenderInput {
  engine: 'midjourney';
  scene_id: string;
  prompt: string;
  corrected_prompt: string;
  negative_prompt: string;
  corrected_negative_prompt: string;
  copy_paste_command: string;
  corrected_copy_paste_command: string;
  parameters: MidjourneyRenderInput['parameters'];
  identity_lock_included: true;
  continuity_seed_included: true;
}

export interface CorrectedFluxRenderInput {
  engine: 'flux';
  scene_id: string;
  prompt: string;
  corrected_prompt: string;
  negative_prompt: string;
  corrected_negative_prompt: string;
  copy_paste_json: string;
  corrected_copy_paste_json: string;
  parameters: FluxRenderInput['parameters'];
  identity_lock_included: true;
  continuity_seed_included: true;
}

export interface CorrectedRenderInputVerificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface CorrectedRenderInputPackResult {
  schema_version: typeof CORRECTED_RENDER_INPUT_PACK_VERSION;
  generated_at: string;
  readonly_second_pass_export: true;
  render_input_pack_checksum_ref: string;
  manual_correction_pack_checksum_ref: string;
  selected_scene_id: string;
  corrected_render_input_pack: CorrectedSceneRenderPack;
  corrected_midjourney_input: CorrectedMidjourneyRenderInput;
  corrected_flux_input: CorrectedFluxRenderInput;
  applied_manual_deltas: AppliedManualDelta[];
  correction_safety_report: CorrectionSafetyReport;
  corrected_export_verification_checks: CorrectedRenderInputVerificationCheck[];
  corrected_render_input_pack_checksum: string;
  validation: {
    deterministic_corrected_pack_checksum_stable: boolean;
    readonly_second_pass_export: true;
    original_prompt_unchanged: true;
    corrected_prompt_exists: boolean;
    no_dataset_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Correction Delta Audit (PHASE-23D second-pass safety verification) ---

export const CORRECTION_DELTA_AUDIT_VERSION = 'CORRECTION-DELTA-AUDIT-v1' as const;

export type SecondPassReadinessVerdict = 'ready' | 'blocked';

export type CorrectionDeltaRiskSeverity = 'critical' | 'moderate' | 'low';

export interface CorrectionDeltaRisk {
  risk_id: string;
  severity: CorrectionDeltaRiskSeverity;
  category: string;
  signal: string;
  detail: string;
}

export interface CorrectionDeltaCheck {
  check_key: string;
  label: string;
  passed: boolean;
  score: number;
  detail: string;
}

export interface CorrectionDeltaReport {
  scene_id: string;
  original_render_pack_checksum_ref: string;
  corrected_render_pack_checksum_ref: string;
  manual_correction_pack_checksum_ref: string;
  checks: CorrectionDeltaCheck[];
  checks_passed: number;
  checks_total: number;
}

export interface ApprovedCorrectedEngineInput {
  engine: 'midjourney' | 'flux';
  approved: boolean;
  scene_id: string;
  original_prompt: string;
  corrected_prompt: string;
  copy_paste_payload: string;
  continuity_seed: string;
  approval_reason: string;
}

export interface CorrectionDeltaAuditResult {
  schema_version: typeof CORRECTION_DELTA_AUDIT_VERSION;
  generated_at: string;
  readonly_audit: true;
  render_input_pack_checksum_ref: string;
  corrected_render_input_pack_checksum_ref: string;
  manual_correction_pack_checksum_ref: string;
  scene_id: string;
  correction_delta_report: CorrectionDeltaReport;
  delta_safety_score: number;
  second_pass_readiness_verdict: SecondPassReadinessVerdict;
  blocked_risks: CorrectionDeltaRisk[];
  approved_corrected_inputs: ApprovedCorrectedEngineInput[];
  audit_verification_checks: CorrectionDeltaCheck[];
  correction_delta_audit_checksum: string;
  validation: {
    deterministic_audit_checksum_stable: boolean;
    readonly_audit: true;
    no_prompt_rewrite: true;
    no_dataset_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Final Dataset Structural Integrity Audit (PHASE-24A longform completeness gate) ---

export const FINAL_DATASET_STRUCTURAL_INTEGRITY_AUDIT_VERSION =
  'FINAL-DATASET-STRUCTURAL-INTEGRITY-AUDIT-v1' as const;

export type FinalDatasetIntegrityVerdict = 'structurally_complete' | 'structurally_incomplete';

export interface FinalDatasetStructuralGap {
  gap_id: string;
  severity: 'critical' | 'moderate';
  check_key: string;
  scene_id?: string;
  message: string;
}

export interface FinalDatasetBlockingIssue {
  issue_id: string;
  severity: 'critical';
  check_key: string;
  scene_id?: string;
  message: string;
}

export interface FinalDatasetStructuralIntegrityCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
  scenes_affected?: number;
}

export interface FinalDatasetStructuralIntegrityAuditResult {
  schema_version: typeof FINAL_DATASET_STRUCTURAL_INTEGRITY_AUDIT_VERSION;
  generated_at: string;
  readonly_audit: true;
  export_candidate_id: string;
  locked_export_id: string;
  export_candidate_checksum_ref: string;
  production_lock_checksum_ref: string;
  export_candidate_json_fingerprint_ref: string;
  production_lock_json_fingerprint_ref: string;
  identity_lock_checksum_ref: string;
  engine_adapter_pack_checksum_ref: string;
  scene_count: number;
  final_dataset_integrity_verdict: FinalDatasetIntegrityVerdict;
  gap_list: FinalDatasetStructuralGap[];
  blocking_issues: FinalDatasetBlockingIssue[];
  structural_integrity_checks: FinalDatasetStructuralIntegrityCheck[];
  export_route_refs: {
    export_candidate_json_file: string;
    production_lock_json_file: string;
  };
  structural_integrity_audit_checksum: string;
  validation: {
    deterministic_structural_integrity_checksum_stable: boolean;
    readonly_audit: true;
    no_dataset_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
    no_prompt_rewrite: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Final Dataset Semantic Quality Audit (PHASE-24B longform semantic readiness gate) ---

export const FINAL_DATASET_SEMANTIC_QUALITY_AUDIT_VERSION =
  'FINAL-DATASET-SEMANTIC-QUALITY-AUDIT-v1' as const;

export type FinalSemanticVerdict = 'semantically_ready' | 'semantically_insufficient';

export type LongformGenerationReadiness = 'ready' | 'conditional' | 'not_ready';

export type SemanticAuditDimensionKey =
  | 'scene_semantic_density'
  | 'character_semantic_continuity'
  | 'environment_semantic_continuity'
  | 'temporal_narrative_coherence'
  | 'visual_generation_usefulness'
  | 'longform_fatigue_risk';

export interface SemanticDimensionScore {
  dimension_key: SemanticAuditDimensionKey;
  label: string;
  score: number;
  inverse_risk: boolean;
}

export interface SemanticQualityGap {
  gap_id: string;
  severity: 'critical' | 'moderate' | 'low';
  dimension_key: SemanticAuditDimensionKey;
  scene_id?: string;
  message: string;
}

export interface SemanticBlockingIssue {
  issue_id: string;
  severity: 'critical';
  dimension_key: SemanticAuditDimensionKey;
  scene_id?: string;
  message: string;
}

export interface FinalDatasetSemanticQualityAuditResult {
  schema_version: typeof FINAL_DATASET_SEMANTIC_QUALITY_AUDIT_VERSION;
  generated_at: string;
  readonly_audit: true;
  export_candidate_id: string;
  locked_export_id: string;
  export_candidate_checksum_ref: string;
  production_lock_checksum_ref: string;
  temporal_graph_checksum_ref: string;
  identity_lock_checksum_ref: string;
  stabilization_verdict_ref: string;
  scene_count: number;
  semantic_quality_score: number;
  semantic_density_score: number;
  continuity_realism_score: number;
  longform_generation_readiness: LongformGenerationReadiness;
  fatigue_risk_score: number;
  weak_scene_ids: string[];
  semantic_gap_list: SemanticQualityGap[];
  semantic_blocking_issues: SemanticBlockingIssue[];
  dimension_scores: SemanticDimensionScore[];
  strongest_dimensions: SemanticAuditDimensionKey[];
  weakest_dimensions: SemanticAuditDimensionKey[];
  final_semantic_verdict: FinalSemanticVerdict;
  semantic_audit_checksum: string;
  validation: {
    deterministic_semantic_audit_checksum_stable: boolean;
    readonly_audit: true;
    no_dataset_mutation: true;
    no_provider_calls: true;
    no_image_generation: true;
    no_prompt_rewrite: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Longform Fatigue Risk Reducer Audit (PHASE-24C non-mutating fatigue mitigation plan) ---

export const LONGFORM_FATIGUE_RISK_REDUCER_AUDIT_VERSION =
  'LONGFORM-FATIGUE-RISK-REDUCER-AUDIT-v1' as const;

export type FatigueRiskCauseCategory =
  | 'repeated_motif'
  | 'repeated_emotion'
  | 'repeated_framing'
  | 'repeated_color'
  | 'callback_oversaturation'
  | 'memory_overload';

export interface FatigueRiskCause {
  cause_id: string;
  category: FatigueRiskCauseCategory;
  severity: 'high' | 'moderate' | 'low';
  signal: string;
  occurrence_count: number;
  affected_scene_ids: string[];
  detail: string;
}

export interface FatigueVariationCandidate {
  candidate_id: string;
  category: FatigueRiskCauseCategory;
  target_cluster: string;
  suggested_variation: string;
  rationale: string;
  affected_scene_ids: string[];
  safe_manual_only: true;
}

export interface FatigueReductionPlanStep {
  step_id: string;
  priority: number;
  category: FatigueRiskCauseCategory;
  action: string;
  target_scenes: string[];
  non_mutating: true;
}

export interface FatigueReductionPlan {
  plan_id: string;
  baseline_fatigue_risk_score: number;
  semantic_audit_checksum_ref: string;
  target_fatigue_reduction_estimate: number;
  steps: FatigueReductionPlanStep[];
  causes_addressed: number;
}

export interface FatigueReducerBlockingIssue {
  issue_id: string;
  severity: 'critical';
  category: FatigueRiskCauseCategory | 'audit_integrity';
  message: string;
}

export interface LongformFatigueRiskReducerAuditResult {
  schema_version: typeof LONGFORM_FATIGUE_RISK_REDUCER_AUDIT_VERSION;
  generated_at: string;
  readonly_audit: true;
  export_candidate_checksum_ref: string;
  semantic_audit_checksum_ref: string;
  temporal_graph_checksum_ref: string;
  scene_count: number;
  fatigue_risk_causes: FatigueRiskCause[];
  fatigue_reduction_plan: FatigueReductionPlan;
  motif_diversification_candidates: FatigueVariationCandidate[];
  emotion_variation_candidates: FatigueVariationCandidate[];
  framing_variation_candidates: FatigueVariationCandidate[];
  color_variation_candidates: FatigueVariationCandidate[];
  safe_non_mutating_recommendations: string[];
  reducer_blocking_issues: FatigueReducerBlockingIssue[];
  fatigue_reducer_audit_checksum: string;
  validation: {
    deterministic_fatigue_reducer_checksum_stable: boolean;
    readonly_audit: true;
    no_dataset_mutation: true;
    no_prompt_rewrite: true;
    no_image_generation: true;
    no_provider_calls: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Final Dataset Completion Certification (PHASE-24D integrated completion gate) ---

export const FINAL_DATASET_COMPLETION_CERTIFICATION_VERSION =
  'FINAL-DATASET-COMPLETION-CERTIFICATION-v1' as const;

export type CompletionVerdict = 'certified_complete' | 'certified_conditional' | 'not_certified';

export type ImageGenerationApproval = 'approved' | 'conditional' | 'blocked';

export type NextPhaseRecommendation =
  | 'proceed_external_image_generation'
  | 'proceed_with_fatigue_mitigation_plan'
  | 'resolve_structural_gaps'
  | 'resolve_semantic_gaps'
  | 'hold_until_blocking_issues_cleared';

export interface FinalDatasetCompletionCertificate {
  certificate_id: string;
  certified_at: string;
  export_candidate_id: string;
  locked_export_id: string;
  scene_count: number;
  structural_integrity_verdict: FinalDatasetIntegrityVerdict;
  semantic_verdict: FinalSemanticVerdict;
  longform_generation_readiness: LongformGenerationReadiness;
  fatigue_risk_acknowledged: true;
  fatigue_causes_documented: number;
  production_lock_valid: boolean;
  structural_audit_checksum_ref: string;
  semantic_audit_checksum_ref: string;
  fatigue_reducer_audit_checksum_ref: string;
  production_lock_checksum_ref: string;
  readonly_certification: true;
}

export interface CompletionCertificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface FinalDatasetCompletionCertificationResult {
  schema_version: typeof FINAL_DATASET_COMPLETION_CERTIFICATION_VERSION;
  generated_at: string;
  readonly_certification: true;
  final_dataset_completion_certificate: FinalDatasetCompletionCertificate;
  completion_verdict: CompletionVerdict;
  approved_for_image_generation: ImageGenerationApproval;
  remaining_advisories: string[];
  next_phase_recommendation: NextPhaseRecommendation;
  completion_certification_checks: CompletionCertificationCheck[];
  final_certificate_checksum: string;
  validation: {
    deterministic_certificate_checksum_stable: boolean;
    readonly_certification: true;
    no_dataset_mutation: true;
    no_prompt_rewrite: true;
    no_image_generation: true;
    no_provider_calls: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Longform Rhythm Diversification Planner (PHASE-25A planning-only fatigue mitigation) ---

export const LONGFORM_RHYTHM_DIVERSIFICATION_PLANNER_VERSION =
  'LONGFORM-RHYTHM-DIVERSIFICATION-PLANNER-v1' as const;

export type RhythmDiversificationCategory =
  | 'emotional'
  | 'cinematic'
  | 'visual'
  | 'narrative'
  | 'orchestration';

export type FatigueAccumulationTrend = 'rising' | 'stable' | 'mitigated_with_plan';

export type ProjectedLongformReadinessLevel = 'ready' | 'conditional' | 'at_risk';

export interface RhythmMapPoint {
  scene_index: number;
  scene_id: string;
  signal: string;
  intensity: number;
  rhythm_note: string;
}

export interface RhythmDiversificationPlanStep {
  step_id: string;
  category: RhythmDiversificationCategory;
  priority: number;
  action: string;
  target_scene_ids: string[];
  planning_only: true;
}

export interface RhythmDiversificationPlan {
  plan_id: string;
  semantic_audit_checksum_ref: string;
  fatigue_reducer_audit_checksum_ref: string;
  expansion_blueprint_ref: string;
  steps: RhythmDiversificationPlanStep[];
  planning_only: true;
}

export interface DiversificationHotspot {
  hotspot_id: string;
  category: RhythmDiversificationCategory;
  severity: 'high' | 'moderate' | 'low';
  signal: string;
  affected_scene_ids: string[];
  detail: string;
}

export interface SafeDiversificationCandidate {
  candidate_id: string;
  category: RhythmDiversificationCategory;
  target_signal: string;
  suggested_planning_action: string;
  rationale: string;
  affected_scene_ids: string[];
  planning_only: true;
}

export interface SceneCountFatigueProjection {
  target_scene_count: number;
  projected_fatigue_score: number;
  projected_stability: number;
  projected_readiness: ProjectedLongformReadinessLevel;
}

export interface FatigueReductionProjection {
  baseline_fatigue_score: number;
  scene_projections: SceneCountFatigueProjection[];
  fatigue_accumulation_trend: FatigueAccumulationTrend;
  continuity_stability_under_diversification: number;
  diversification_mitigation_estimate: number;
}

export interface ProjectedFatigueScores {
  current_scene_count: number;
  current_fatigue_score: number;
  at_60_scenes: number;
  at_90_scenes: number;
  at_120_scenes: number;
}

export interface ProjectedLongformReadiness {
  at_60_scenes: ProjectedLongformReadinessLevel;
  at_90_scenes: ProjectedLongformReadinessLevel;
  at_120_scenes: ProjectedLongformReadinessLevel;
  orchestration_verdict: string;
}

export interface LongformRhythmDiversificationPlannerResult {
  schema_version: typeof LONGFORM_RHYTHM_DIVERSIFICATION_PLANNER_VERSION;
  generated_at: string;
  readonly_planning: true;
  export_candidate_checksum_ref: string;
  semantic_audit_checksum_ref: string;
  fatigue_reducer_audit_checksum_ref: string;
  temporal_graph_checksum_ref: string;
  identity_lock_checksum_ref: string;
  scene_count: number;
  rhythm_diversification_plan: RhythmDiversificationPlan;
  emotional_wave_map: RhythmMapPoint[];
  cinematic_rhythm_map: RhythmMapPoint[];
  visual_rhythm_map: RhythmMapPoint[];
  narrative_rhythm_map: RhythmMapPoint[];
  fatigue_reduction_projection: FatigueReductionProjection;
  diversification_hotspots: DiversificationHotspot[];
  safe_diversification_candidates: SafeDiversificationCandidate[];
  projected_fatigue_scores: ProjectedFatigueScores;
  projected_longform_readiness: ProjectedLongformReadiness;
  planner_checksum: string;
  validation: {
    deterministic_planner_checksum_stable: boolean;
    readonly_planning: true;
    no_dataset_mutation: true;
    no_prompt_mutation: true;
    no_image_generation: true;
    no_provider_calls: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Longform Fatigue Mitigation Blueprint (PHASE-25B planning-only expansion mitigation) ---

export const LONGFORM_FATIGUE_MITIGATION_BLUEPRINT_VERSION =
  'LONGFORM-FATIGUE-MITIGATION-BLUEPRINT-v1' as const;

export interface MitigationPolicyBase {
  policy_id: string;
  policy_name: string;
  planning_only: true;
  no_dataset_mutation: true;
  rules: string[];
  target_scene_ids: string[];
  severity_threshold: 'high' | 'moderate' | 'low';
}

export interface MotifSpacingPolicy extends MitigationPolicyBase {
  min_scenes_between_motif_recurrence: number;
  max_motif_cluster_size: number;
}

export interface EmotionalRestBeatPolicy extends MitigationPolicyBase {
  rest_beat_after_high_intensity_scenes: number;
  max_consecutive_high_intensity: number;
  target_rest_intensity_max: number;
}

export interface FramingAlternationPolicy extends MitigationPolicyBase {
  alternate_shot_scales: string[];
  max_same_framing_streak: number;
}

export interface ColorTemperatureModulationPolicy extends MitigationPolicyBase {
  warm_cool_alternation_interval: number;
  max_palette_cluster_scenes: number;
}

export interface EnvironmentOnlyBeatPolicy extends MitigationPolicyBase {
  environment_only_beat_interval: number;
  min_environment_token_richness: number;
}

export interface CompanionPresenceSpacingPolicy extends MitigationPolicyBase {
  max_companion_dense_block: number;
  solitude_spacing_interval: number;
}

export interface CallbackThrottlingPolicy extends MitigationPolicyBase {
  max_callbacks_per_sequence_block: number;
  min_scenes_between_callbacks: number;
}

export interface MemoryLoadBalancingPolicy extends MitigationPolicyBase {
  max_edges_per_memory_node: number;
  batch_isolation_threshold: number;
}

export interface FatigueMitigationBlueprint {
  blueprint_id: string;
  planner_checksum_ref: string;
  fatigue_reducer_checksum_ref: string;
  expansion_blueprint_ref: string;
  motif_spacing_policy: MotifSpacingPolicy;
  emotional_rest_beat_policy: EmotionalRestBeatPolicy;
  framing_alternation_policy: FramingAlternationPolicy;
  color_temperature_modulation_policy: ColorTemperatureModulationPolicy;
  environment_only_beat_policy: EnvironmentOnlyBeatPolicy;
  companion_presence_spacing_policy: CompanionPresenceSpacingPolicy;
  callback_throttling_policy: CallbackThrottlingPolicy;
  memory_load_balancing_policy: MemoryLoadBalancingPolicy;
  planning_only: true;
}

export interface SequenceLevelRhythmPolicy {
  sequence_id: string;
  rhythm_guidance: string[];
  rest_beat_frequency: number;
  callback_budget: number;
  framing_alternation_required: true;
}

export interface SceneInsertionRecommendation {
  recommendation_id: string;
  insertion_type: 'rest_beat' | 'environment_only' | 'reflective_pause' | 'framing_break';
  after_scene_id: string;
  before_scene_id?: string;
  planning_rationale: string;
  planning_only: true;
}

export interface CallbackThrottleRule {
  rule_id: string;
  scope: 'sequence' | 'act' | 'global';
  max_callbacks: number;
  min_spacing_scenes: number;
  detail: string;
}

export interface EmotionalWaveTarget {
  target_id: string;
  scene_range: string;
  target_intensity_band: 'rest' | 'moderate' | 'peak';
  target_value: number;
}

export interface VisualVariationTarget {
  target_id: string;
  dimension: 'framing' | 'color_temperature' | 'lighting' | 'atmosphere';
  target_signal: string;
  affected_scene_ids: string[];
}

export interface PostMitigationFatigueProjection {
  baseline_at_60: number;
  baseline_at_90: number;
  baseline_at_120: number;
  post_mitigation_at_60: number;
  post_mitigation_at_90: number;
  post_mitigation_at_120: number;
  fatigue_improvement_at_120: number;
}

export interface LongformFatigueMitigationBlueprintResult {
  schema_version: typeof LONGFORM_FATIGUE_MITIGATION_BLUEPRINT_VERSION;
  generated_at: string;
  readonly_planning: true;
  planner_checksum_ref: string;
  fatigue_reducer_checksum_ref: string;
  temporal_graph_checksum_ref: string;
  expansion_blueprint_ref: string;
  scene_count: number;
  fatigue_mitigation_blueprint: FatigueMitigationBlueprint;
  sequence_level_rhythm_policy: SequenceLevelRhythmPolicy[];
  scene_insertion_recommendations: SceneInsertionRecommendation[];
  callback_throttle_rules: CallbackThrottleRule[];
  emotional_wave_targets: EmotionalWaveTarget[];
  visual_variation_targets: VisualVariationTarget[];
  projected_post_mitigation_fatigue: PostMitigationFatigueProjection;
  projected_longform_readiness_after_mitigation: ProjectedLongformReadiness;
  mitigation_blueprint_checksum: string;
  validation: {
    deterministic_mitigation_blueprint_checksum_stable: boolean;
    readonly_planning: true;
    projected_fatigue_improved: boolean;
    readiness_120_improved: boolean;
    no_dataset_mutation: true;
    no_prompt_rewrite: true;
    no_image_generation: true;
    no_provider_calls: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Mitigation Stability Simulation (PHASE-25C virtual mitigation continuity gate) ---

export const MITIGATION_STABILITY_SIMULATION_VERSION = 'MITIGATION-STABILITY-SIMULATION-v1' as const;

export type MitigationSimulationDimensionKey =
  | 'motif_spacing'
  | 'emotional_rest_beat'
  | 'framing_alternation'
  | 'callback_throttling'
  | 'memory_load_balancing'
  | 'longform_continuity';

export interface MitigationSimulationDimension {
  dimension_key: MitigationSimulationDimensionKey;
  label: string;
  simulated_impact_score: number;
  continuity_delta: number;
  detail: string;
}

export interface MitigationSimulationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface MitigationSideEffect {
  effect_id: string;
  severity: 'low' | 'moderate';
  category: MitigationSimulationDimensionKey;
  signal: string;
  detail: string;
}

export interface RuntimeLockCompatibility {
  compatible: true;
  production_lock_ref: string;
  export_candidate_checksum_ref: string;
  lock_inheritance_preserved: true;
  simulation_only: true;
  detail: string;
}

export interface MitigationSimulationReport {
  simulation_id: string;
  mitigation_blueprint_checksum_ref: string;
  temporal_graph_checksum_ref: string;
  stabilization_verdict_ref: string;
  dimensions: MitigationSimulationDimension[];
  simulation_checks: MitigationSimulationCheck[];
  checks_passed: number;
  checks_total: number;
}

export interface PostMitigationProjectionSimulation {
  fatigue_at_60: number;
  fatigue_at_90: number;
  fatigue_at_120: number;
  readiness_at_120: ProjectedLongformReadinessLevel;
  continuity_preserved: true;
  orchestration_stable: true;
}

export interface MitigationStabilitySimulationResult {
  schema_version: typeof MITIGATION_STABILITY_SIMULATION_VERSION;
  generated_at: string;
  readonly_simulation: true;
  mitigation_blueprint_checksum_ref: string;
  export_candidate_checksum_ref: string;
  identity_lock_checksum_ref: string;
  expansion_blueprint_ref: string;
  scene_count: number;
  mitigation_simulation_report: MitigationSimulationReport;
  continuity_preservation_score: number;
  temporal_integrity_score: number;
  orchestration_stability_score: number;
  mitigation_side_effects: MitigationSideEffect[];
  runtime_lock_compatibility: RuntimeLockCompatibility;
  post_mitigation_projection: PostMitigationProjectionSimulation;
  simulation_checksum: string;
  validation: {
    deterministic_simulation_checksum_stable: boolean;
    readonly_simulation: true;
    continuity_preserved: boolean;
    orchestration_stable: boolean;
    no_dataset_mutation: true;
    no_prompt_rewrite: true;
    no_image_generation: true;
    no_provider_calls: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Longform Readiness Re-Certification (PHASE-25D post-mitigation readiness gate) ---

export const LONGFORM_READINESS_RECERTIFICATION_VERSION =
  'LONGFORM-READINESS-RECERTIFICATION-v1' as const;

export type FinalReadinessVerdict = 'ready' | 'conditional' | 'not_ready';

export interface ReadinessRecertificationCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface LongformReadinessCertificate {
  certificate_id: string;
  certified_at: string;
  prior_completion_verdict: CompletionVerdict;
  prior_completion_certificate_checksum_ref: string;
  rhythm_planner_checksum_ref: string;
  mitigation_blueprint_checksum_ref: string;
  stability_simulation_checksum_ref: string;
  production_lock_checksum_ref: string;
  export_candidate_id: string;
  scene_count: number;
  structural_integrity_verdict: string;
  semantic_verdict: string;
  post_mitigation_fatigue_at_120: number;
  readiness_at_120_scenes: ProjectedLongformReadinessLevel;
  continuity_preservation_score: number;
  orchestration_stability_score: number;
  readonly_recertification: true;
}

export interface LongformReadinessRecertificationResult {
  schema_version: typeof LONGFORM_READINESS_RECERTIFICATION_VERSION;
  generated_at: string;
  readonly_recertification: true;
  longform_readiness_certificate: LongformReadinessCertificate;
  final_readiness_verdict: FinalReadinessVerdict;
  approved_for_image_generation: ImageGenerationApproval;
  remaining_advisories: string[];
  recertification_checks: ReadinessRecertificationCheck[];
  checks_passed: number;
  checks_total: number;
  certificate_checksum: string;
  validation: {
    deterministic_certificate_checksum_stable: boolean;
    readonly_recertification: true;
    final_readiness_ready: boolean;
    no_dataset_mutation: true;
    no_prompt_rewrite: true;
    no_image_generation: true;
    no_provider_calls: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

// --- Real Longform Dataset Synthesis (PHASE-26A additive longform expansion artifact) ---

export const REAL_LONGFORM_DATASET_SYNTHESIS_VERSION =
  'REAL-LONGFORM-DATASET-SYNTHESIS-v1' as const;

export type SynthesizedLongformTier = 60 | 90 | 120;

export type SynthesizedSceneKind =
  | 'source_preserved'
  | 'expansion_cycle'
  | 'rest_beat'
  | 'environment_only'
  | 'framing_variation';

export interface SynthesizedSceneMetadata {
  scene_id: string;
  synthesis_kind: SynthesizedSceneKind;
  source_scene_ref?: string;
  mitigation_policies_applied: string[];
  synth_index: number;
}

export interface SynthesizedLongformDataset {
  tier: SynthesizedLongformTier;
  dataset_id: string;
  scene_count: number;
  scenes: CinematicExtractionResult[];
  scene_metadata: SynthesizedSceneMetadata[];
  expanded_continuity_graph: TemporalMemoryGraphBundle;
  continuity_graph_checksum: string;
  source_runtime_fingerprint_ref: string;
  additive_synthesis_only: true;
}

export interface SynthesisFatigueScores {
  at_60: number;
  at_90: number;
  at_120: number;
}

export interface SynthesisContinuityScores {
  at_60: number;
  at_90: number;
  at_120: number;
}

export interface SynthesisOrchestrationScores {
  at_60: number;
  at_90: number;
  at_120: number;
}

export interface SynthesisIntegrityCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface SynthesisIntegrityReport {
  report_id: string;
  source_scene_count: number;
  synthesized_tiers: SynthesizedLongformTier[];
  policies_applied: string[];
  source_preserved_count: number;
  expansion_scene_count: number;
  rest_beat_insertions: number;
  environment_only_insertions: number;
  framing_alternations: number;
  callback_throttle_applied: true;
  memory_load_balancing_applied: true;
  integrity_checks: SynthesisIntegrityCheck[];
  integrity_checks_passed: number;
  integrity_checks_total: number;
}

export interface SynthesisBlockingIssue {
  issue_id: string;
  severity: 'blocking' | 'advisory';
  signal: string;
  detail: string;
}

export interface SynthesizedDatasetChecksums {
  at_60: string;
  at_90: string;
  at_120: string;
}

export interface RealLongformDatasetSynthesisResult {
  schema_version: typeof REAL_LONGFORM_DATASET_SYNTHESIS_VERSION;
  generated_at: string;
  readonly_synthesis: true;
  export_candidate_checksum_ref: string;
  mitigation_blueprint_checksum_ref: string;
  stability_simulation_checksum_ref: string;
  temporal_graph_checksum_ref: string;
  expansion_blueprint_ref: string;
  runtime_orchestration_metadata_ref: string;
  synthesized_60_scene_dataset: SynthesizedLongformDataset;
  synthesized_90_scene_dataset: SynthesizedLongformDataset;
  synthesized_120_scene_dataset: SynthesizedLongformDataset;
  synthesis_integrity_report: SynthesisIntegrityReport;
  synthesis_fatigue_scores: SynthesisFatigueScores;
  synthesis_continuity_scores: SynthesisContinuityScores;
  synthesis_orchestration_scores: SynthesisOrchestrationScores;
  synthesis_blocking_issues: SynthesisBlockingIssue[];
  synthesized_dataset_checksums: SynthesizedDatasetChecksums;
  synthesis_checksum: string;
  validation: {
    deterministic_synthesis_checksum_stable: boolean;
    readonly_synthesis: true;
    synthesized_datasets_generated: boolean;
    fatigue_scores_acceptable: boolean;
    continuity_preserved: boolean;
    orchestration_stable: boolean;
    no_blocking_issues: boolean;
    no_dataset_mutation: true;
    no_prompt_rewrite: true;
    no_image_generation: true;
    no_provider_calls: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
    production_lock_unchanged: true;
  };
}

// --- Synthesized Longform Dataset Quality Audit (PHASE-26B actual synthesis audit) ---

export const SYNTHESIZED_LONGFORM_DATASET_QUALITY_AUDIT_VERSION =
  'SYNTHESIZED-LONGFORM-DATASET-QUALITY-AUDIT-v1' as const;

export type SynthesizedExpansionDimensionKey =
  | 'expansion_semantic_quality'
  | 'expansion_continuity_realism'
  | 'longform_pacing_quality'
  | 'expansion_orchestration_quality'
  | 'expansion_usefulness';

export type FinalSynthesizedDatasetVerdict =
  | 'synthesized_ready'
  | 'synthesized_conditional'
  | 'synthesized_not_ready';

export interface SynthesizedAuditDimensionScore {
  dimension_key: SynthesizedExpansionDimensionKey;
  label: string;
  score: number;
  detail: string;
}

export interface SynthesizedQualityAuditCheck {
  check_key: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface SynthesizedLongformDatasetQualityAuditResult {
  schema_version: typeof SYNTHESIZED_LONGFORM_DATASET_QUALITY_AUDIT_VERSION;
  generated_at: string;
  readonly_audit: true;
  synthesis_checksum_ref: string;
  mitigation_blueprint_checksum_ref: string;
  temporal_graph_checksum_ref: string;
  audited_tiers: SynthesizedLongformTier[];
  expansion_scene_count: number;
  synthesized_quality_score: number;
  synthesized_continuity_score: number;
  synthesized_orchestration_score: number;
  synthesized_fatigue_score: number;
  weak_synthesized_scene_ids: string[];
  filler_scene_ids: string[];
  strongest_expansion_dimensions: SynthesizedExpansionDimensionKey[];
  weakest_expansion_dimensions: SynthesizedExpansionDimensionKey[];
  dimension_scores: SynthesizedAuditDimensionScore[];
  audit_checks: SynthesizedQualityAuditCheck[];
  final_synthesized_dataset_verdict: FinalSynthesizedDatasetVerdict;
  synthesized_audit_checksum: string;
  validation: {
    deterministic_audit_checksum_stable: boolean;
    readonly_audit: true;
    synthesized_scenes_audited: boolean;
    filler_detection_executed: boolean;
    continuity_realism_evaluated: boolean;
    no_dataset_mutation: true;
    no_prompt_rewrite: true;
    no_image_generation: true;
    no_provider_calls: true;
    no_canonical_export_mutation: true;
    no_runtime_dataset_mutation: true;
  };
}

export interface GoldenRecord {
  record_id: string;
  certified_by: 'human' | 'audit_engine';
  certification_date: string;
  audit_score: number;
  quality_grade: string;
  locked: boolean;
  immutable_hash: string;
}

export interface CinematicExtractionResult {
    id: string;
    schema_version: string;
    schema_signature: string;
    audit_summary?: AuditSummary;
    golden_record?: GoldenRecord;
    snapshot_reason?: string;
    schema_meta: {
        latent_engine: string;
        vector_semantics: "locked" | "dynamic" | "active_realtime" | "active_perception" | "full_cognitive_reactivation";
        revision: number;
        production_ready: boolean;
        perception_mode?: string;
    };
    shot_fingerprint?: {
        composition_hash: string;
        lighting_hash: string;
        motion_hash: string;
        palette_hash: string;
    };
    analysis_timestamp: string;
  source_hash: string;
  core_dna_id: string;
  category?: string;
  canonical_dna?: CanonicalDNA; // Added in v53.2
  generation_validation?: RealizedGenerationScore[]; // Added in v53.2
  human_semantic_bridge?: string;
  
  scene_indexing: {
    scene_id: string;
    source_material: string;
    shot_purpose: string[];
    director_family: string;
    v_timestamp_start: number;
    v_timestamp_end: number;
    director_signature_id?: string;
  };

  generation_cache?: {
    midjourney_prompt: string;
    style_summary: string;
    engine_contract: {
        photorealism: number;
        stylization: number;
        motion_scale: number;
    };
    logic_steps?: { [key: string]: string };
  };
  
  generative_layer: {
    midjourney: string;    // Style-first compressed latent prompt
    runway: string;       // Motion-first technical prompt
    kling: string;        // Physics-first realism prompt
    prompt_compression_ratio: number;
    identity_locked_context?: string;
  };

  layers: {
    raw_semantic: {
      visual_description: string;
      raw_tags: string[];
      provenance_notes: string;
      derived_tags?: string[];
    };
    human_semantic_bridge?: string;
    scene_language: {
      cinematography_tokens: string[];
      narrative_tokens: string[];
      emotion_tokens: string[];
      director_tokens?: string[];
      environment_tokens?: string[];
      dsl_version: string;
    };
  };

  scene_state: CinematicSceneState;
  
  latent_steering: {
    vectors: SparseLatentVectors;
    legacy_spaces?: VectorSpaces;
    dimension_registry?: any;
    dense_latent_trajectories?: number[][];
    engine_adapters: {
      midjourney?: {
        engine_params: {
          aspect_ratio: string;
          stylize: number;
          chaos: number;
        };
        prompt_blueprint?: any;
      };
    };
  };

  visual_atoms: VisualAtom[];               
  relationship_graph: {
    subject: string;
    predicate?: string; // v33/v34/v35 SPO standard
    object?: string;    // v33/v34/v35 SPO standard
    relation?: string;  // Legacy v32
    target?: string;    // Legacy v32
    weight?: number;    // intensity of the connection
  }[];
  director_dna: CinematicDirectorDNA;

  sequence_graph: {
    previous_node: string;
    current_node: string;
    next_candidates: { id: string; probability: number; }[];
    transition_logic?: {
        energy_delta: number;
        camera_flow_vector: number[];
        emotion_continuity: number;
    };
    transition_rules?: any;
  };

  schema_migration_history: string[];
  confidence_profile: {
    aggregate_certainty: number;
    inference_depth: number;
    semantic_confidence?: number;
  };
  
  pipeline_v22_6?: {
    purity_score: number;      // 0.0 ~ 1.0 (No subtitles, logos, noise)
    saliency_score: number;    // 0.0 ~ 1.0 (Cinematic importance)
    event_delta: number;       // Change from last frame
    cognition_tags: string[];  // Higher level cognitive associations
  };
  
  feedback_calibration?: any;
  calibration?: any;
  character_identities?: CharacterIdentityDNA[];
  identity_consistency?: ConsistencyScore;
  temporal_identity_graph?: TemporalIdentityGraph;
  identity_memory?: CinematicIdentityMemory;

  // v26.0 REAL VISUAL GROUNDING
  character_anchors_v24?: CharacterAnchorV24[];
  temporal_memory?: TemporalMemoryNode[];
  real_measurements?: RealMeasurementV24;
  detected_subjects?: DetectedSubject[];
  scene_graph?: {
      nodes: { id: string; label: string; type: string; properties?: any }[];
      edges: { source: string; target: string; relation: string; weight?: number }[];
  };
  identity_timeline?: {
    frame: number;
    entity_id: string;
    persistence: number;
    spatial_delta: [number, number];
    action_state?: string;
  }[];
  character_dna?: {
    [entity_id: string]: {
      face_embedding?: number[];
      silhouette_signature?: string;
      hair_geometry?: any;
      eye_distance_ratio?: number;
      costume_palette?: string[];
      accessory_map?: string[];
      motion_behavior?: any;
      appearance_embedding?: string;
      style_lock?: boolean;
    }
  };
  production_status?: {
    current_phase: 'analysis' | 'generation' | 're_analysis' | 'correction' | 'finalized';
    pipeline_connector: 'comfyui' | 'runway' | 'kling' | 'cogvideox' | 'local_sim';
    render_job_id?: string;
    quality_score_v41?: number;
    correction_needed?: boolean;
    last_loop_timestamp?: string;
  };
  quality_analysis?: {
    spatial_consistency: number;
    identity_drift: number;
    motion_fidelity: number;
    target_vs_actual_score: number;
    feedback_directives: string[];
  };
  execution_trace?: {
    caption_model: string;
    object_detector: string;
    started_at: string;
    duration_seconds: number;
    gpu_peak_memory_gb?: number;
    inference_engine_version: string;
  };
  input_fingerprint?: {
    file_name: string;
    sha256: string;
    file_size_bytes: number;
    input_type: 'image' | 'video';
  };
  validation_report?: {
    object_match_score: number;
    caption_consistency_score: number;
    overall_validation_score: number;
    regression_status: 'stable' | 'drifted' | 'improved';
    evidence_verified: boolean;
  };

  // v42.0 PRODUCTION ENGINE TYPES
  production_v42?: {
    gpu_connector: {
      engine: 'comfyui' | 'runway' | 'kling' | 'cogvideox' | 'local_sim';
      config_hash: string;
      node_status: 'online' | 'optimizing' | 'rendering' | 'offline';
      last_latency_ms: number;
    };
    quality_scoring: {
      character_consistency: number;
      scene_match: number;
      style_integrity: number;
      temporal_stability: number;
      emotional_impact: number;
      aggregate_production_score: number;
    };
    prompt_optimization?: {
      original_prompt_hash: string;
      optimized_prompt: string;
      feedback_loop_count: number;
      improvement_delta: number;
      token_efficiency: number;
    };
    sequence_context?: {
      shot_index: number;
      total_shots: number;
      narrative_arc: 'setup' | 'confrontation' | 'resolution';
      visual_rhythm_locked: boolean;
    };
  };

  // v43.0 PLACEHOLDER DETECTION & PROVENANCE
  v43_provenance?: {
    placeholder_report: {
      total_scalar_fields: number;
      placeholder_count: number;
      placeholder_ratio: number;
      last_detection_timestamp: string;
    };
    field_sources: {
      [field_path: string]: {
        value: number | string | any;
        value_source: 'optical_flow' | 'llm_inference' | 'deterministic_calc' | 'default' | 'vector_encoder';
        state: 'valid' | 'not_measured' | 'unknown' | 'deprecated';
        confidence: number;
      }
    };
  };

  // v47.0 VECTOR DENSITY & BENCHMARK SUITE
  production_v44?: {
    vector_density: {
      cinematic_64d_active: boolean;
      temporal_32d_active: boolean;
      retrieval_24d_active: boolean;
      overall_density_score: number;
    };
    benchmark_suite?: {
      composition_fidelity: number;
      motion_continuity_score: number;
      identity_persistence_benchmark: number;
      style_drift_ratio: number;
      benchmark_status: 'passed' | 'warning' | 'failed';
    };
    encoder_trace?: {
      cinematic_encoder_id: string;
      temporal_encoder_id: string;
      retrieval_encoder_id: string;
      latent_refinement_cycles: number;
    };
  };

  // v47.0 UNIFIED PRODUCTION OS (ORCHESTRATOR & CONTINUITY)
  production_v45?: {
    orchestrator: {
      active_engine: 'comfyui' | 'runway' | 'kling' | 'cogvideox' | 'local_sim';
      render_queue_pos: number;
      estimated_completion: string;
      last_error_log?: string;
      engine_health_score: number;
    };
    continuity_controller: {
      character_persistence: number;
      camera_path_continuity: number;
      lighting_consistency: number;
      emotion_drift_locked: boolean;
      overall_continuity_score: number;
    };
    autonomous_quality_loop: {
      loop_iteration: number;
      last_correction_instruction: string;
      quality_trend: 'improving' | 'stable' | 'degrading';
      auto_finalize_ready: boolean;
    };
    benchmark_refs?: {
      ghibli_fidelity_totoro: number;
      ghibli_fidelity_kiki: number;
      ghibli_fidelity_spirited: number;
    };
  };

  // v49.0 UNIFIED PRODUCTION OS (ORCHESTRATOR & CONTINUITY)
  production_v49?: {
    orchestrator?: {
      active_engine: 'comfyui' | 'runway' | 'kling' | 'cogvideox' | 'local_sim';
      render_queue_pos: number;
      estimated_completion: string;
      last_error_log?: string;
      engine_health_score: number;
    };
    continuity_controller?: {
      character_persistence: number;
      camera_path_continuity: number;
      lighting_consistency: number;
      emotion_drift_locked: boolean;
      overall_continuity_score: number;
    };
    autonomous_quality_loop?: {
      loop_iteration: number;
      last_correction_instruction: string;
      quality_trend: 'improving' | 'stable' | 'degrading';
      auto_finalize_ready: boolean;
    };
    benchmark_refs?: {
      ghibli_fidelity_totoro: number;
      ghibli_fidelity_kiki: number;
      ghibli_fidelity_spirited: number;
    };
    world_state_provenance?: {
      [field_path: string]: {
        value: any;
        value_source: 'measured' | 'estimated' | 'inferred' | 'default' | 'not_measured';
        state: 'valid' | 'not_measured' | 'unknown' | 'deprecated';
        confidence: number;
      }
    };
    subject_composition?: {
      type: 'S' | 'S+' | 'R' | 'R+';
      primary_subject_count: number;
      supporting_population: number;
      animal_population: number;
      social_density: number;
    };
    relationship_dynamics?: {
      trust: number | null;
      emotional_distance: number | null;
      protective_instinct: number | null;
      suppression: number | null;
      reunion_tension: number | null;
      guilt_devotion: number | null;
    };
    situation_state?: {
      scenario_type: 'farewell_before_departure' | 'secret_revealed' | 'reunion_after_separation' | 'everyday_peace' | 'pre_confession';
      urgency: number | null;
      irreversibility: number | null;
      emotional_pressure: number | null;
      logical_precedents: string[];
    };
    temporal_bridge?: {
      inherits_motion_from: string;
      gaze_vector_continuity: number | null;
      emotional_decay_tau: number | null;
      spatial_anchor_offset: [number, number, number];
    };
    spectator_state?: {
      tension: number | null;
      anticipation: number | null;
      perceptual_intimacy: number | null;
      comfort_decay?: number | null;
      narrative_immersion_index?: number | null;
    };
    interpretable_latents?: {
      loneliness: number | null;
      dreamlike_index: number | null;
      kinetic_energy: number | null;
      memory_decay: number | null;
      nostalgia_bias: number | null;
    };
    engine_capabilities?: {
      high_motion_coherence_verified: boolean;
      identity_lock_strength: number;
      camera_path_support_active: boolean;
      temporal_physics_engine: string;
    };
    narrative_causality?: {
      purpose: 'setup' | 'payoff' | 'breathing_room' | 'exposition' | 'climax_beat';
      setup_for: string[];
      tension_release_delta: number | null;
      logical_precedents: string[];
    };
    agi_asset_readiness?: {
      is_contamination_free: boolean;
      is_long_term_accumulable: boolean;
      reliability_score: number;
      semantic_density: number;
      semantic_density_score?: number;
    };
    config_hash?: string;
    original_prompt_hash?: string;
    optimized_prompt?: string;
    gpu_connector?: {
      engine: 'comfyui' | 'runway' | 'kling' | 'cogvideox' | 'local_sim';
      config_hash: string;
      node_status: 'online' | 'optimizing' | 'rendering' | 'offline';
      last_latency_ms: number;
    };
    quality_scoring?: {
      character_consistency: number;
      scene_match: number;
      style_integrity: number;
      temporal_stability: number;
      emotional_impact: number;
      aggregate_production_score: number;
    };
    prompt_optimization?: {
      original_prompt_hash: string;
      optimized_prompt: string;
      feedback_loop_count: number;
      improvement_delta: number;
      token_efficiency: number;
    };
    sequence_context?: {
      shot_index: number;
      total_shots: number;
      narrative_arc: 'setup' | 'confrontation' | 'resolution';
      visual_rhythm_locked: boolean;
    };
    vector_density?: {
      cinematic_64d_active: boolean;
      temporal_32d_active: boolean;
      retrieval_24d_active: boolean;
      overall_density_score: number;
    };
    benchmark_suite?: {
      composition_fidelity: number;
      motion_continuity_score: number;
      identity_persistence_benchmark: number;
      style_drift_ratio: number;
      benchmark_status: 'passed' | 'warning' | 'failed';
    };
    encoder_trace?: {
      cinematic_encoder_id: string;
      temporal_encoder_id: string;
      retrieval_encoder_id: string;
      latent_refinement_cycles: number;
    };
  };
  // v48.0 PRODUCTION ENGINE TYPES
  production_v48?: {
    orchestrator?: {
      token_handshake?: 'verified' | 'pending';
      render_queue_id?: string;
    };
    aq_loop?: {
      scoring_metrics?: {
        temporal_stability: number;
        style_integrity: number;
        composition_loyalty: number;
      };
    };
    continuity?: {
      identity_lock_score: number;
      geometry_persistence: number;
    };
    benchmarks?: {
      ghibli_reference_match: number;
      shinkai_fidelity_score: number;
      live_production_readiness: number;
    };
    gpu_connector?: {
      engine: string;
      config_hash: string;
      node_status: string;
      last_latency_ms: number;
    };
    quality_scoring?: {
      character_consistency: number;
      scene_match: number;
      style_integrity: number;
      temporal_stability: number;
      emotional_impact: number;
      aggregate_production_score: number;
    };
    prompt_optimization?: {
      original_prompt_hash: string;
      optimized_prompt: string;
      feedback_loop_count: number;
      improvement_delta: number;
      token_efficiency: number;
    };
    sequence_context?: {
      shot_index: number;
      total_shots: number;
      narrative_arc: string;
      visual_rhythm_locked: boolean;
    };
    vector_density?: {
      cinematic_64d_active: boolean;
      temporal_32d_active: boolean;
      retrieval_24d_active: boolean;
      overall_density_score: number;
    };
    benchmark_suite?: {
      composition_fidelity: number;
      motion_continuity_score: number;
      identity_persistence_benchmark: number;
      style_drift_ratio: number;
      benchmark_status: string;
    };
    encoder_trace?: {
      cinematic_encoder_id: string;
      temporal_encoder_id: string;
      retrieval_encoder_id: string;
      latent_refinement_cycles: number;
    };
    world_state_provenance?: { [key: string]: any };
    temporal_bridge?: {
      gaze_vector_continuity: number;
      emotional_decay_tau: number;
      inherits_motion_from: string;
      spatial_anchor_offset: number[];
    };
    spectator_state?: {
      tension: number;
      anticipation: number;
      perceptual_intimacy: number;
      comfort_decay: number;
      narrative_immersion_index: number;
    };
    interpretable_latents?: {
      loneliness: number;
      dreamlike_index: number;
      kinetic_energy: number;
      memory_decay: number;
      nostalgia_bias: number;
    };
    engine_capabilities?: {
      high_motion_coherence_verified: boolean;
      identity_lock_strength: number;
      camera_path_support_active: boolean;
      temporal_physics_engine: string;
    };
    narrative_causality?: {
      purpose: string;
      setup_for: any[];
      tension_release_delta: number;
      logical_precedents: any[];
    };
    agi_asset_readiness?: {
      reliability_score: number;
      is_contamination_free: boolean;
      is_long_term_accumulable: boolean;
      semantic_density: number;
    };
  };

  // v50.0 UNIFIED PRODUCTION OS (AI MOVIE ENGINE)
  production_v50?: {
    orchestrator?: {
      active_engine: 'comfyui' | 'runway' | 'kling' | 'cogvideox' | 'local_sim';
      render_queue_pos: number;
      estimated_completion: string;
      last_error_log?: string;
      engine_health_score: number;
    };
    continuity_controller?: {
      character_persistence: number;
      camera_path_continuity: number;
      lighting_consistency: number;
      emotion_drift_locked: boolean;
      overall_continuity_score: number;
    };
    autonomous_quality_loop?: {
      loop_iteration: number;
      last_correction_instruction: string;
      quality_trend: 'improving' | 'stable' | 'degrading';
      auto_finalize_ready: boolean;
    };
    benchmark_refs?: {
      ghibli_fidelity_totoro: number;
      ghibli_fidelity_kiki: number;
      ghibli_fidelity_spirited: number;
    };
    world_state_provenance?: {
      [field_path: string]: {
        value: any;
        value_source: 'measured' | 'estimated' | 'inferred' | 'default' | 'not_measured';
        state: 'valid' | 'not_measured' | 'unknown' | 'deprecated';
        confidence: number;
      }
    };
    subject_composition?: {
      type: 'S' | 'S+' | 'R' | 'R+';
      primary_subject_count: number;
      supporting_population: number;
      animal_population: number;
      social_density: number;
    };
    relationship_dynamics?: {
      trust: number | null;
      emotional_distance: number | null;
      protective_instinct: number | null;
      suppression: number | null;
      reunion_tension: number | null;
      guilt_devotion: number | null;
    };
    situation_state?: {
      scenario_type: 'farewell_before_departure' | 'secret_revealed' | 'reunion_after_separation' | 'everyday_peace' | 'pre_confession';
      urgency: number | null;
      irreversibility: number | null;
      emotional_pressure: number | null;
      logical_precedents: string[];
    };
    temporal_bridge?: {
      inherits_motion_from: string;
      gaze_vector_continuity: number | null;
      emotional_decay_tau: number | null;
      spatial_anchor_offset: [number, number, number];
    };
    spectator_state?: {
      tension: number | null;
      anticipation: number | null;
      perceptual_intimacy: number | null;
      comfort_decay?: number | null;
      narrative_immersion_index?: number | null;
    };
    interpretable_latents?: {
      loneliness: number | null;
      dreamlike_index: number | null;
      kinetic_energy: number | null;
      memory_decay: number | null;
      nostalgia_bias: number | null;
    };
    engine_capabilities?: {
      high_motion_coherence_verified: boolean;
      identity_lock_strength: number;
      camera_path_support_active: boolean;
      temporal_physics_engine: string;
    };
    narrative_causality?: {
      purpose: 'setup' | 'payoff' | 'breathing_room' | 'exposition' | 'climax_beat';
      setup_for: string[];
      tension_release_delta: number | null;
      logical_precedents: string[];
    };
    agi_asset_readiness?: {
      is_contamination_free: boolean;
      is_long_term_accumulable: boolean;
      reliability_score: number;
      semantic_density: number;
      semantic_density_score?: number;
    };
  };
  production_v72?: ProductionOS_v72;

  // v73.3 IMAGE NARRATIVE CONTROL EXPANSION
  production_v73?: ProductionOS_v73;

  // v74.0 IMAGE RECONSTRUCTION & NARRATIVE FIDELITY PLAN
  production_v74?: ProductionOS_v74;

  // v75.0 CINEMATIC GENERATION STABILIZATION PLAN
  production_v75?: ProductionOS_v75;

  // v76.0 CORE STABILIZATION PLAN
  production_v76?: ProductionOS_v76;

  // v77.0 INCREMENTAL PRODUCTION STABILIZATION PLAN
  production_v77?: ProductionOS_v77;

  // v78.0 INCREMENTAL CINEMATIC PRODUCTION OPTIMIZATION PLAN
  production_v78?: ProductionOS_v78;

  // v79.0 INCREMENTAL CINEMATIC PRODUCTION OPTIMIZATION PLAN
  production_v79?: ProductionOS_v79;

  // v80.0 INCREMENTAL CINEMATIC PRODUCTION OPTIMIZATION PLAN
  production_v80?: ProductionOS_v80;

  // v82.4 RELATIONSHIP DYNAMICS & IMAGE GENERATION BRIDGE PATCH
  production_v82?: ProductionOS_v82;

  // PHASE-1 Pipeline Bridge (optional additive namespaces — no schema break)
  continuity_memory?: ContinuityMemoryState;
  emotional_carryover?: EmotionalCarryoverState;
  camera_rhythm_memory?: CameraRhythmMemoryState;
  motif_persistence?: MotifPersistenceState;
  /** Root-level sequence memory from Pipeline A (distinct from production character locks). */
  character_persistence?: CharacterPersistenceMemoryState;
  recursive_merge_state?: RecursiveMergeState;
  validation_metrics?: Record<string, unknown>;
  audit_metrics?: PipelineAuditMetrics;
  confidence_profiles?: Record<string, unknown>;
  orchestration_states?: OrchestrationStates;
  intermediate_pipeline_states?: Record<string, unknown>;
  prompts_extraction?: Record<string, unknown>;
  configurations_extraction?: Record<string, unknown>;
  graphs_extraction?: Record<string, unknown>;
  raw_caches_extraction?: Record<string, unknown>;
  pipeline_bridge_provenance?: PipelineBridgeProvenance;
  pipeline_bridge_receipt?: BridgeReceipt;
  /** Server export bridge mode metadata (opt-in post-pass only). */
  bridge_mode?: ExportBridgeMode;
  bridge_export_receipt?: BridgeExportReceipt;
  export_bridge_score?: number;
  /** PHASE-5 temporal memory graph anchor (additive, opt-in enrichment). */
  temporal_memory_anchor_id?: string;
  /** Per-scene memory density from temporal graph propagation. */
  memory_density_score?: number;
  /** Pipeline B certification bridge provenance (opt-in post-pass only). */
  pipeline_b_certification_provenance?: PipelineBCertificationProvenance;
  /** Preserves Pipeline A canonical_dna when both pipelines contribute. */
  canonical_dna_pipeline_a_archive?: CanonicalDNA | Record<string, unknown>;
  /** Preserves Pipeline B canonical_dna when both pipelines contribute. */
  canonical_dna_pipeline_b_archive?: CanonicalDNA | Record<string, unknown>;
  /** Preserves Pipeline A production_v82 when both pipelines contribute. */
  production_v82_pipeline_a_archive?: ProductionOS_v82 | Record<string, unknown>;
  /** Preserves Pipeline B production_v82 when both pipelines contribute. */
  production_v82_pipeline_b_archive?: ProductionOS_v82 | Record<string, unknown>;

  [key: string]: any;
}

export interface VisualGrammarTranslation {
  framing: GroundedValue<string>;
  lighting: GroundedValue<string>;
  lens: GroundedValue<string>;
  gaze: GroundedValue<string>;
  spatial_composition: GroundedValue<string>;
}

export interface EmotionVisualGrammar {
  melancholy: VisualGrammarTranslation;
  anticipation: VisualGrammarTranslation;
  isolation: VisualGrammarTranslation;
}

export interface CharacterVisualDNA {
  silhouette: GroundedValue<string>;
  eye_shape: GroundedValue<string>;
  clothing_identity: GroundedValue<string>;
  hair_behavior: GroundedValue<string>;
  emotional_micro_expression: GroundedValue<string>;
}

export interface StoryBeatEngine {
  active_beat: 'setup' | 'tension' | 'hesitation' | 'reveal' | 'release';
  beat_intensity: GroundedValue<number>;
  beat_instruction: GroundedValue<string>;
  transition_rules: GroundedValue<string[]>;
}

export interface VisualContinuityLock {
  lighting_continuity: GroundedValue<number>;
  weather_continuity: GroundedValue<string>;
  costume_continuity: GroundedValue<string>;
  object_persistence: GroundedValue<string[]>;
  ambient_lock_active: boolean;
}

export interface CinematicPromptMemory {
  camera_language: GroundedValue<string>;
  visual_motifs: GroundedValue<string[]>;
  relationship_framing: GroundedValue<string>;
  reused_keys_count: number;
}

export interface ProductionOS_v73 extends ProductionOS_v72 {
  emotion_to_visual_grammar?: EmotionVisualGrammar;
  character_visual_dna?: CharacterVisualDNA;
  story_beat_engine?: StoryBeatEngine;
  visual_continuity_lock?: VisualContinuityLock;
  narrative_visual_intent?: GroundedValue<string>;
  cinematic_prompt_memory?: CinematicPromptMemory;
}

export interface ImageReconstructionFidelity {
  prompt_fidelity_score: GroundedValue<number>;
  image_reconstruction_score: GroundedValue<number>;
  character_identity_retention: GroundedValue<number>;
  continuity_reconstruction_score: GroundedValue<number>;
}

export interface ShotIdentityEngine {
  shot_signature: GroundedValue<string>;
  visual_memory_anchor: GroundedValue<string>;
  scene_uniqueness_hash: GroundedValue<string>;
  motif_priority_weight: GroundedValue<number>;
}

export interface NarrativeImagePlanning {
  scene_goal: GroundedValue<string>;
  emotional_transition: GroundedValue<string>;
  visual_payoff: GroundedValue<string>;
  reveal_logic: GroundedValue<string>;
  narrative_progression: GroundedValue<string>;
}

export interface CharacterVisualDNA_v74 extends CharacterVisualDNA {
  face_topology_persistence?: GroundedValue<string>;
  silhouette_consistency?: GroundedValue<string>;
  outfit_continuity?: GroundedValue<string>;
  gaze_behavior_memory?: GroundedValue<string>;
  emotional_micro_expression_carry_over?: GroundedValue<string>;
}

export interface ProductionOS_v74 extends ProductionOS_v73 {
  image_reconstruction_fidelity?: ImageReconstructionFidelity;
  shot_identity_engine?: ShotIdentityEngine;
  narrative_image_planning?: NarrativeImagePlanning;
  character_visual_dna_v74?: CharacterVisualDNA_v74;
}

export interface ProductionOS_v75 extends ProductionOS_v74 {
  reconstruction_similarity_score?: GroundedValue<number>;
  prompt_fidelity_score?: GroundedValue<number>;
  visual_drift_score?: GroundedValue<number>;
  identity_retention_score?: GroundedValue<number>;
  continuity_reconstruction_score?: GroundedValue<number>;

  shot_identity_vector?: GroundedValue<number[]>;
  scene_uniqueness_hash?: GroundedValue<string>;
  visual_memory_anchor?: GroundedValue<string>;
  composition_signature?: GroundedValue<string>;
  cinematic_fingerprint?: GroundedValue<string>;

  engine_prompt_grammars?: {
    [engineName: string]: {
      syntax: string;
      style_weighting: number;
      motion_grammar: string;
      continuity_routing: string;
    };
  };

  character_persistence_lock?: {
    face_topology_lock: number;
    silhouette_persistence: number;
    outfit_continuity_graph: string;
    gaze_memory: string;
    emotional_micro_expression_carryover: number;
  };

  narrative_video_plan?: {
    reveal_timing: string;
    emotional_pacing_map: string;
    transition_intention: string;
    visual_payoff_routing: string;
    sequence_level_emotional_inheritance: string;
  };
}

export interface ProductionOS_v76 {
  // Point 4: Real Fidelity Metrics
  reconstruction_similarity_score?: GroundedValue<number>;
  style_fidelity_score?: GroundedValue<number>;
  identity_retention_score?: GroundedValue<number>;
  motion_consistency_score?: GroundedValue<number>;
  continuity_accuracy_score?: GroundedValue<number>;

  // Point 5: Shot Identity System
  scene_uniqueness_hash?: GroundedValue<string>;
  visual_anchor_signature?: GroundedValue<string>;
  composition_memory?: GroundedValue<string>;
  cinematic_fingerprint?: GroundedValue<string>;

  // Point 3: Engine-Specific Prompt Compiler
  engine_prompt_grammars?: {
    [engineName: string]: {
      syntax: string;
      style_weighting: number;
      motion_grammar: string;
      continuity_routing: string;
    };
  };

  // Point 6: Character Persistence Layer
  character_persistence_lock?: {
    face_topology_lock: number;
    silhouette_persistence: number;
    outfit_continuity: string;
    gaze_memory: string;
    micro_expression_carryover: number;
  };

  // Point 7: Temporal Narrative Engine
  narrative_video_plan?: {
    reveal_timing: string;
    emotional_pacing: string;
    transition_intention: string;
    sequence_level_inheritance: string;
    narrative_payoff_planning: string;
  };

  narrative_visual_intent?: GroundedValue<string>;
  cinematic_prompt_memory?: CinematicPromptMemory;
  story_beat_engine?: StoryBeatEngine;
}

export interface ProductionOS_v77 {
  // Real Fidelity Metrics
  reconstruction_similarity_score?: GroundedValue<number>;
  style_fidelity_score?: GroundedValue<number>;
  identity_retention_score?: GroundedValue<number>;
  motion_consistency_score?: GroundedValue<number>;
  continuity_accuracy_score?: GroundedValue<number>;

  // Shot Identity System
  scene_uniqueness_hash?: GroundedValue<string>;
  visual_anchor_signature?: GroundedValue<string>;
  composition_fingerprint?: GroundedValue<string>;
  lens_personality_vector?: GroundedValue<string>;
  cinematic_fingerprint?: GroundedValue<string>;

  // Engine-Specific Prompt Compiler
  engine_prompt_grammars?: {
    [engineName: string]: {
      image_generation: string;
      motion_generation: string;
      cinematic_sequencing: string;
    };
  };

  // Prompt Compression Pipeline
  prompt_compression_pipeline?: {
    visual_anchors: string[];
    motion_anchors: string[];
    framing_tokens: string[];
    emotional_vectors: string[];
  };

  // Character Persistence Layer
  character_persistence_lock?: {
    face_topology_lock: number;
    silhouette_persistence: number;
    outfit_continuity: string;
    gaze_continuity: string;
    micro_expression_inheritance: string;
  };

  // Temporal Narrative Engine
  temporal_narrative_expansion?: {
    reveal_timing: string;
    emotional_pacing: string;
    transition_intention: string;
    sequence_inheritance: string;
    narrative_payoff_logic: string;
    cinematic_rhythm_planning: string;
  };

  // Token Governance
  token_governance?: {
    adaptive_semantic_pruning: boolean;
    telemetry_collapse: boolean;
    low_value_namespace_removal: boolean;
    export_budget_controller: string;
  };

  // Observed First Governance
  observed_first_governance?: {
    evidence_hierarchy: string;
    speculative_semantic_generation_reduced: boolean;
  };

  narrative_visual_intent?: GroundedValue<string>;
  cinematic_prompt_memory?: CinematicPromptMemory;
  story_beat_engine?: StoryBeatEngine;
}

export interface ProductionOS_v82 extends ProductionOS_v80 {
  [key: string]: any;
  relationship_dynamics?: {
    trust?: GroundedValue<number>;
    emotional_distance?: GroundedValue<number>;
    suppression?: GroundedValue<number>;
    unresolved_tension?: GroundedValue<number>;
    attachment_bias?: GroundedValue<number>;
    protective_instinct?: GroundedValue<number>;
    dependency_vector?: GroundedValue<number>;
    reunion_tension?: GroundedValue<number>;
    guilt_devotion?: GroundedValue<number>;
  };
  situation_state?: {
    urgency?: GroundedValue<number>;
    irreversibility?: GroundedValue<number>;
    emotional_pressure?: GroundedValue<number>;
    intimacy_asymmetry?: GroundedValue<number>;
    separation_pressure?: GroundedValue<number>;
    emotional_asymmetry?: GroundedValue<number>;
    reunion_probability?: GroundedValue<number>;
    scenario_type?: string;
    logical_precedents?: string[];
  };
  merge_metrics?: any;
  agi_asset_readiness?: any;
  subject_composition?: any;
}

export interface ProductionOS_v80 extends ProductionOS_v79 {
  // Reconstruction Fidelity Metrics
  scene_similarity_score?: GroundedValue<number>;
  
  // Shot Identity Engine
  visual_uniqueness_score?: GroundedValue<number>;
  framing_diversity_engine?: GroundedValue<string>;
  lens_personality_vectors?: GroundedValue<string>;
  cinematic_anchor_signatures?: GroundedValue<string[]>;

  // Prompt Compression DSL
  prompt_compression_dsl?: {
    subject?: string;
    camera?: string;
    light?: string;
    motion?: string;
    emotion?: string;
    style?: string;
    composition?: string;
    timing?: string;
  };

  // Token Governance
  token_governance?: {
    adaptive_semantic_pruning: boolean;
    telemetry_collapse: boolean;
    low_value_namespace_removal: boolean;
    export_budget_controller: string;
    telemetry_decay_logic?: string;
    export_level_semantic_compression?: string;
    hierarchical_memory_budgeting?: string;
  };

  // Observed First Governance
  observed_first_governance?: {
    evidence_hierarchy: string;
    speculative_semantic_generation_reduced: boolean;
    optical_grounding_enhanced?: boolean;
    geometry_reconstruction_matched?: boolean;
    motion_vector_evidence_bound?: boolean;
    physical_scene_calibration?: string;
  };

  // Runtime Layer Separation
  runtime_layer_separation?: {
    active_runtime: 'archival' | 'lightweight_export' | 'training' | 'production';
    hierarchical_memory_budgeting?: string;
  };
}

export interface ProductionOS_v79 extends ProductionOS_v78 {}

export interface ProductionOS_v78 {
  // Real Fidelity Metrics
  reconstruction_similarity_score?: GroundedValue<number>;
  style_fidelity_score?: GroundedValue<number>;
  identity_retention_score?: GroundedValue<number>;
  motion_consistency_score?: GroundedValue<number>;
  continuity_accuracy_score?: GroundedValue<number>;

  // Shot Identity System
  scene_uniqueness_hash?: GroundedValue<string>;
  visual_anchor_signature?: GroundedValue<string>;
  composition_fingerprint?: GroundedValue<string>;
  lens_personality_vector?: GroundedValue<string>;
  cinematic_fingerprint?: GroundedValue<string>;

  // Engine-Specific Prompt Compiler
  engine_prompt_grammars?: {
    [engineName: string]: {
      image_generation: string;
      motion_generation: string;
      cinematic_sequencing: string;
    };
  };

  // Prompt Compression Pipeline
  prompt_compression_pipeline?: {
    visual_anchors: string[];
    motion_anchors: string[];
    framing_tokens: string[];
    emotional_vectors: string[];
  };

  // Character Persistence Layer
  character_persistence_lock?: {
    face_topology_lock: number;
    silhouette_persistence: number;
    hair_signature_memory: string;
    outfit_continuity: string;
    gaze_continuity: string;
    micro_expression_inheritance: string;
  };

  // Temporal Narrative Engine
  temporal_narrative_expansion?: {
    reveal_timing: string;
    emotional_pacing: string;
    transition_intention: string;
    sequence_inheritance: string;
    narrative_payoff_logic: string;
    cinematic_rhythm_planning: string;
  };

  // Token Governance
  token_governance?: {
    adaptive_semantic_pruning: boolean;
    telemetry_collapse: boolean;
    low_value_namespace_removal: boolean;
    export_budget_controller: string;
  };

  // Observed First Governance
  observed_first_governance?: {
    evidence_hierarchy: string;
    speculative_semantic_generation_reduced: boolean;
  };

  narrative_visual_intent?: GroundedValue<string>;
  cinematic_prompt_memory?: CinematicPromptMemory;
  story_beat_engine?: StoryBeatEngine;
}

export interface ProductionOS_v72 {
  orchestrator?: {
    active_engine: 'comfyui' | 'runway' | 'kling' | 'cogvideox' | 'local_sim';
    render_queue_pos: number;
    estimated_completion: string;
    last_error_log?: string;
    engine_health_score: number;
  };
  continuity_controller?: {
    character_persistence: GroundedValue<number>;
    camera_path_continuity: GroundedValue<number>;
    lighting_consistency: GroundedValue<number>;
    emotion_drift_locked: boolean;
    overall_continuity_score: number;
  };
  autonomous_quality_loop?: {
    loop_iteration: number;
    last_correction_instruction: string;
    quality_trend: 'improving' | 'stable' | 'degrading';
    auto_finalize_ready: boolean;
  };
  benchmark_refs?: {
    ghibli_fidelity_totoro: number;
    ghibli_fidelity_kiki: number;
    ghibli_fidelity_spirited: number;
  };
  world_state_provenance?: {
    [field_path: string]: GroundedValue<any>;
  };
  relative_scales?: GroundedValue<RelativeScaleReference[]>;
  subject_composition?: {
    type: SubjectCompositionType;
    primary_subject_count: GroundedValue<number>;
    supporting_population: GroundedValue<number>;
    animal_population: GroundedValue<number>;
    social_density: GroundedValue<number>;
    lod?: CharacterLOD;
  };
  relationship_dynamics?: {
    trust: GroundedValue<number>;
    emotional_distance: GroundedValue<number>;
    protective_instinct: GroundedValue<number>;
    suppression: GroundedValue<number>;
    reunion_tension: GroundedValue<number>;
    guilt_devotion: GroundedValue<number>;
  };
  situation_state?: {
    scenario_type: 'farewell_before_departure' | 'secret_revealed' | 'reunion_after_separation' | 'everyday_peace' | 'pre_confession';
    urgency: GroundedValue<number>;
    irreversibility: GroundedValue<number>;
    emotional_pressure: GroundedValue<number>;
    logical_precedents: string[];
  };
  temporal_bridge?: {
    inherits_motion_from: string;
    gaze_vector_continuity: GroundedValue<number>;
    emotional_decay_tau: GroundedValue<number>;
    spatial_anchor_offset: [number, number, number];
    gaze_carry_over?: GroundedValue<number>;
    emotional_residue?: GroundedValue<number>;
    motion_inheritance?: GroundedValue<number>;
    pacing_continuity?: GroundedValue<number>;
    emotional_momentum?: GroundedValue<number>;
  };
  spectator_state?: {
    tension: GroundedValue<number>;
    anticipation: GroundedValue<number>;
    perceptual_intimacy: GroundedValue<number>;
    comfort_decay?: GroundedValue<number>;
    narrative_immersion_index?: GroundedValue<number>;
  };
  interpretable_latents?: {
    loneliness: GroundedValue<number>;
    dreamlike_index: GroundedValue<number>;
    kinetic_energy: GroundedValue<number>;
    memory_decay: GroundedValue<number>;
    nostalgia_bias: GroundedValue<number>;
  };
  engine_capabilities?: {
    high_motion_coherence_verified: boolean;
    identity_lock_strength: number;
    camera_path_support_active: boolean;
    temporal_physics_engine: string;
  };
  narrative_causality?: {
    purpose: 'setup' | 'payoff' | 'breathing_room' | 'exposition' | 'climax_beat';
    setup_for: string[];
    tension_release_delta: GroundedValue<number>;
    logical_precedents: string[];
    shot_purpose?: GroundedValue<string>;
    emotional_transition?: GroundedValue<string>;
    viewer_expectation?: GroundedValue<string>;
    payoff_reference?: GroundedValue<string>;
    symbolic_callback?: GroundedValue<string>;
    emotional_residue?: GroundedValue<number>;
    dramatic_intent?: GroundedValue<string>;
    thematic_function?: GroundedValue<string>;
    symbolic_role?: GroundedValue<string>;
    emotional_payoff_target?: GroundedValue<string>;
    viewer_psychology_shift?: GroundedValue<string>;
  };
  semantic_memory_graph?: SemanticMemoryGraph;
  agi_asset_readiness?: {
    is_contamination_free: boolean;
    is_long_term_accumulable: boolean;
    reliability_score: number;
    semantic_density: number;
    semantic_density_score?: number;
  };
  merge_metrics?: MergeMetrics;
}

export interface MergeMetrics {
  merge_overlap_count: number;
  merge_duplicate_removed: number;
  merge_confidence: number;
  timeline_integrity_score: number;
}

export interface SemanticObjectSymbolism {
  object: string;
  symbolism: string;
  persistence_index: number;
}

export interface SemanticCallbackChain {
  callback_trigger: string;
  target_scene: string;
  callback_strength: number;
}

export interface SemanticMemoryGraph {
  object_symbolism_persistence: GroundedValue<SemanticObjectSymbolism[]>;
  recurring_visual_motifs: GroundedValue<string[]>;
  emotional_callback_chains: GroundedValue<SemanticCallbackChain[]>;
  narrative_expectation_tracking: GroundedValue<string[]>;
}

export interface CanonicalDNA {
  version: string; // "53.2-FINAL-OS"
  domains: {
    composition: { layouts: string[]; points: number[] };
    camera: { motion: string; focal_length: number };
    lighting: { intensity: number; direction: string; color_temp: number };
    color_palette: { dominant: string[]; scheme: string };
    character: { 
      morphology_index: number; 
      lod_level: string;
      face_anchor_vector?: number[];
      hairstyle_signature?: string;
      costume_signature?: string;
      eye_ratio_lock?: number;
      silhouette_memory?: string;
      identity_drift_prevention?: number;
    };
    emotion: { primary: string; intensity: number };
    physics: { gravity_sim: number; spatial_depth: number };
    motion: { density: number; kinetic_energy: number };
    atmosphere: { haze: number; particle_purity: number };
    narrative: { function: string; energy_delta: number };
    relationship_dynamics?: {
      trust: number;
      emotional_distance: number;
      suppression: number;
      attachment_bias: number;
      unresolved_tension: number;
      dependency_vector: number;
      protective_instinct?: number;
    };
    situation_vector?: {
      urgency: number;
      irreversibility: number;
      emotional_asymmetry: number;
      reunion_probability: number;
      separation_pressure: number;
      emotional_pressure?: number;
      intimacy_asymmetry?: number;
    };
    style_core_library?: string[];
    environment_neutral_style_references?: string[];
    scene_independent_aesthetic_anchors?: string[];
    prompt_entropy_mode?: 'stable_mode' | 'balanced_mode' | 'creative_mode';
    gaze_memory?: number[];
    motion_path_memory?: string[];
    emotional_decay_tracking?: number;
    continuity_bridge_vectors?: number[];
  };
  metadata: {
    frozen_at: string;
    compatibility_hash: string;
  };
}

export interface RealizedGenerationScore {
  rgs_total: number; // 0-10
  structural_similarity: number;
  style_bible_match: number;
  semantic_match?: number;
  human_approval_ratio: number;
  validation_confidence: number; // 0.0 - 1.0
  validation_timestamp: string;
  validated_engine: string;
  semantic_reconstruction_score?: number;
  semantic_drift_score?: number;
  reconstruction_fidelity_score?: number;
  director_dna_retention?: number;
  visual_fidelity_score?: number;
  visual_reconstruction_score?: number;
  visual_reconstruction_accuracy?: number;
  director_dna_retention_score?: number;
  pacing_reconstruction_score?: number;
  continuity_reconstruction_score?: number;
  motif_reconstruction_score?: number;
  emotional_continuity_score?: number;
  emotional_reconstruction_score?: number;
  director_dna_reconstruction_score?: number;
  shot_identity_retention_score?: number;
  structural_deviation?: number;
  emotional_drift?: number;
  composition_fidelity?: number;
  cinematic_consistency?: number;
  style_consistency?: number;
  motion_consistency?: number;
  palette_deviation?: number;
  cinematic_identity_stability?: number;
  recipe_stability?: {
    style_drift: number;
    framing_drift: number;
    emotion_consistency: number;
    lens_continuity: number;
    multi_engine_harmony: number;
  };
  generated_outputs?: string[]; // Store generated outputs, added in v54.10
  validation_lineage?: {
    parent_dna_id: string;
    recipe_id?: string;
    model_version: string;
    seed: number;
  };
  feedback_deltas?: {
    structural_diff: number;
    style_diff: number;
    semantic_diff: number;
  };
  correction_history?: Array<{
    timestamp: string;
    applied_delta: string;
    accepted: boolean;
  }>;
}

export interface PromptPackage {
  engine: string;
  composite_prompt: string;
  negative_prompt?: string;
  parameters: Record<string, string | number>;
  adapter_coverage_score: number; // 0-10, added in v53.2
}

export interface ProductionRecipe {
  recipe_id: string;
  source_id: string;
  canonical_dna: CanonicalDNA;
  prompt_package: PromptPackage;
  engine_settings: {
    model_version: string;
    seed: number;
    negative_prompt?: string;
    sampler?: string;
    cfg_scale?: number;
    steps?: number;
  };
  rgs_score: number;
  created_at: string;
  label: string;
}

export interface StyleBible {
  project_name: string;
  sbci_score: number; // Style Bible Confidence Index (0.0 - 1.0)
  sample_count: number;
  status: 'insufficient' | 'emerging' | 'stable' | 'master';
  signature: {
    lens_range: [number, number];
    dominant_palette: string[];
    lighting_profile: string;
    composition_bias: string;
    global_style_tags: string[];
  };
  master_prefix: string;
  global_negative_prompt: string;
  last_updated: string;
}

export interface DatasetGovernance {
  dri_score: number; // Dataset Readiness Index (0-10)
  grs_score: number; // Generation Readiness Score (0-10)
  rgs_avg_score: number; // Realized Generation Score (0-10)
  recipe_stability?: number; // Added in v53.3A (0-10)
  style_consistency_score?: number; // Added in v53.3B (0-10)
  production_certified: boolean;
  library_health_status: 'prototype' | 'beta' | 'production_ready' | 'library_ready' | 'full_production_authorized';
  last_calculation: string;
  golden_record_count: number;
  golden_record_ratio: number;
  average_audit_score: number;
  remediation_success_rate: number;
  global_drift_stability: number;
  global_cost_efficiency: number;
  dataset_lock?: {
    locked_at: string;
    locked_dri: number;
    locked_by: string;
  };
}

export interface CinematicLibrary {
  version: string; // "13.5"
  last_updated: number;
  author: string;
  collections: CinematicExtractionResult[];
  governance?: DatasetGovernance;
  golden_anchor_lut_v13_5?: {
    [anchor_id: string]: {
      name: string;
      description: string;
      cinematic_vector_32d: number[];
      physics_signature: number[];
      symbolic_motifs?: string[];
      framing_signatures?: string[];
      emotional_pacing_patterns?: string[];
      director_specific_cinematic_grammar?: string[];
    };
  };
  library_statistics?: {
    total_items: number;
    director_families: string[];
    average_tension?: number;
    average_dread?: number;
    build_info?: {
      compiled_at: string;
      compiled_with: string;
    };
  };
  index_manifest?: {
    vector_spaces: {
      retrieval_24d: number;
      retrieval_14d: number;
      cinematic_64d: number;
      temporal_32d: number;
      perceptual_32d: number;
    };
    schema_signatures: string[];
  };
}

export interface GhibliLibrary {
  version: string; // "2.6" 표준
  last_updated: number;
  anchors: GhibliAnchor[];
}
