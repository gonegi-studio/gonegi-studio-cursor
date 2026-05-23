import { CinematicExtractionResult } from '../types';

export const LUMET_12_ANGRY_MEN_SCENE: CinematicExtractionResult = {
  id: "SCENE-LUMET-COURTROOM-CLIMAX",
  schema_version: "82.4",
  schema_signature: "CINEMATIC-WORLD-STATE-ENGINE-UNIFIED-V82.4",
  schema_meta: {
    latent_engine: "vector_encoder_v82.4",
    vector_semantics: "full_cognitive_reactivation",
    revision: 1,
    production_ready: true,
    perception_mode: "evidence_grounded_logic"
  },
  analysis_timestamp: "2024-05-20T12:00:00Z",
  source_hash: "sha256:lumet_12_angry_men_focal_progression_final",
  core_dna_id: "LUMET-CORE-001",
  category: "DRAMA",
  scene_indexing: {
    scene_id: "SCENE-LUMET-COURTROOM-CLIMAX",
    source_material: "12 Angry Men (1957)",
    shot_purpose: ["narrative_tension_peak", "spatial_compression"],
    director_family: "Sidney Lumet",
    v_timestamp_start: 4800,
    v_timestamp_end: 4920
  },
  generative_layer: {
    midjourney: "Sidney Lumet directed scene, 12 Angry Men, extreme focal compression, sweating juror, sweltering courtroom, 1950s cinematic black and white, high tension --ar 16:9 --style raw",
    runway: "Static close-up on sweating juror, sweltering courtroom atmosphere, extreme focal compression, high internal tension, black and white fine grain.",
    kling: "Cinematic close-up of a man sweating in a courtroom, 1957 realistic lighting, high detail skin textures, 35mm film grain, 12 angry men style.",
    prompt_compression_ratio: 0.45
  },
  layers: {
    raw_semantic: {
      visual_description: "A sweating juror leans forward in a crowded, sweltering courtroom. The walls feel like they are closing in due to high focal compression.",
      raw_tags: ["courtroom", "sweat", "tension", "close-up"],
      provenance_notes: "Expert manual encoding for v51.0 Evidence Core."
    },
    scene_language: {
      cinematography_tokens: ["DeepFocus", "TightCloseUp", "LowAngleTracking"],
      narrative_tokens: ["Confrontation", "Climax"],
      emotion_tokens: ["VisceralDread", "SuppressedRage"],
      dsl_version: "5.1.0"
    }
  },
  scene_state: {
    physics: {
      luminance_contrast: { value: 0.72, confidence: 0.98, source: 'observed', reasoning: 'High key lighting with dark suits' },
      motion_density: { value: 0.05, confidence: 0.99, source: 'observed', reasoning: 'Static character position' },
      depth_isolation: { value: 0.88, confidence: 0.95, source: 'observed', reasoning: 'Compressed space via telephoto' },
      camera_velocity_mps: { value: 0.1, confidence: 0.9, source: 'inferred', reasoning: 'Slow creep forward' },
      subject_distance_meter: { value: 0.8, confidence: 0.95, source: 'observed', reasoning: 'Close-up framing' },
      luminance_balance: { value: 0.45, confidence: 0.9, source: 'observed', reasoning: 'Monochrome distribution' },
      chroma_intensity: { value: 0.0, confidence: 1.0, source: 'observed', reasoning: 'Black and white production' }
    },
    emotion: {
      dread: { value: 0.88, confidence: 0.9, source: 'observed', reasoning: 'High tension facial cues' },
      melancholy: { value: 0.2, confidence: 0.85, source: 'inferred', reasoning: 'Aggressive heat vs sadness' },
      anticipation: { value: 0.95, confidence: 0.98, source: 'observed', reasoning: 'Gaze vector persistence' },
      intimacy: { value: 0.9, confidence: 0.95, source: 'observed', reasoning: 'Shot scale proximity' },
      arousal_rate: { value: 0.92, confidence: 0.9, source: 'inferred', reasoning: 'Sweat and rapid breathing' },
      valence_bias: { value: 0.1, confidence: 0.9, source: 'inferred', reasoning: 'Severe negative pressure' },
      catharsis_ready: { value: 0.85, confidence: 0.9, source: 'inferred', reasoning: 'Narrative peak approaching' },
      isolation_score: { value: 0.85, confidence: 0.9, source: 'observed', reasoning: 'Framing confinement' }
    },
    temporal: {
      time_tension_curve: { value: 'suspended', confidence: 0.95, source: 'observed', reasoning: 'Frozen action intensity' },
      rhythm_pressure: { value: 0.9, confidence: 0.9, source: 'observed', reasoning: 'Aggressive shot duration' },
      pacing_memory: { value: 0.98, confidence: 0.95, source: 'observed', reasoning: 'Sequence logic consistency' },
      pacing_waveform: [0.72, 0.75, 0.78, 0.82, 0.9, 0.95, 0.98]
    },
    optics: {
      sensor_alias: { value: '35mm-b&w-film', confidence: 1.0, source: 'observed', reasoning: 'Production metadata' },
      focal_length_mm: { value: 150, confidence: 0.98, source: 'observed', reasoning: 'Extreme compression artifacts' },
      aperture_f_stop: { value: 8, confidence: 0.9, source: 'inferred', reasoning: 'Deep focus background visibility' },
      halation_response: { value: 0.05, confidence: 1.0, source: 'observed', reasoning: 'Optical grain check' },
      grain_profile: { value: 'fine_clump', confidence: 0.95, source: 'observed', reasoning: 'B&W film grain analysis' }
    }
  },
  latent_steering: {
    vectors: {
      semantic_16d: {
        "dim_0": 0.05,
        "dim_1": 0.95,
        "dim_2": 0.15
      }
    },
    legacy_spaces: {
        cinematic_latent_embeddings_v2: Array(32).fill(0.5)
    },
    engine_adapters: {
        midjourney: {
            engine_params: {
                aspect_ratio: '16:9',
                stylize: 250,
                chaos: 0
            }
        }
    }
  },
  sequence_graph: {
    previous_node: "SCENE-LUMET-COURTROOM-INT-04",
    current_node: "SCENE-LUMET-COURTROOM-CLIMAX",
    next_candidates: [],
    transition_logic: {
      energy_delta: 0.95,
      camera_flow_vector: [0, 0],
      emotion_continuity: 1.0
    }
  },
  visual_atoms: [],
  relationship_graph: [],
  director_dna: {
    camera_motion: {
      continuous_motion: { value: 0.1, confidence: 1.0, source: 'observed', reasoning: 'Locked tripod' },
      human_tracking_bias: { value: 0.95, confidence: 0.9, source: 'observed', reasoning: 'Eye-level lock' },
      kinetic_aggression: { value: 0.0, confidence: 1.0, source: 'observed', reasoning: 'Stationary shot' },
      static_patience: { value: 0.98, confidence: 1.0, source: 'observed', reasoning: 'Long take stability' }
    },
    lens_behavior: {
      focal_range: { value: [85, 200], confidence: 0.95, source: 'observed', reasoning: 'Telephoto compression' },
      distortion_acceptance: { value: 0.05, confidence: 0.9, source: 'observed', reasoning: 'Prime lens linearity' },
      optical_abstraction: { value: 0.1, confidence: 0.95, source: 'observed', reasoning: 'Sharp realistic focus' },
      bokeh_texture: { value: 'creamy', confidence: 0.85, source: 'observed', reasoning: 'Out of focus background lights' }
    },
    lighting_behavior: {
      naturalism_index: { value: 0.95, confidence: 0.9, source: 'observed', reasoning: 'Pragmatic courtroom light' },
      shadow_density: { value: 0.7, confidence: 0.95, source: 'observed', reasoning: 'High-contrast monochrome' },
      atmospheric_occlusion: { value: 0.3, confidence: 0.85, source: 'inferred', reasoning: 'Heat haze haze' },
      color_drift: { value: 0.0, confidence: 1.0, source: 'observed', reasoning: 'Fixed black/white LUT' }
    },
    composition_logic: {
      rule_of_thirds: { value: 0.85, confidence: 0.9, source: 'observed', reasoning: 'Juror eye-line on grid' },
      subject_isolation: { value: 0.9, confidence: 0.95, source: 'observed', reasoning: 'Depth compression isolation' },
      spatial_honesty: { value: 0.98, confidence: 0.9, source: 'inferred', reasoning: 'Rigid geometry' },
      symmetry_bias: { value: 0.5, confidence: 0.9, source: 'observed', reasoning: 'Balanced asymmetrical' },
      negative_space_ratio: { value: 0.2, confidence: 0.9, source: 'observed', reasoning: 'Tight framing' },
      symmetry_score: { value: 0.4, confidence: 0.9, source: 'observed', reasoning: 'Dynamic human posture' },
      dominance: {
        layer_priority: 'front',
        frame_occupancy_ratio: 0.65,
        depth_isolation_lock: true,
        subject_focus_score: 0.98
      }
    },
    editing_pacing: {
      avg_shot_duration: { value: 12.5, confidence: 1.0, source: 'observed', reasoning: 'Timeline measurement' },
      rhythm_uniformity: { value: 0.92, confidence: 0.9, source: 'observed', reasoning: 'Steady tension build' },
      montage_intensity: { value: 0.1, confidence: 0.95, source: 'observed', reasoning: 'Slow cut rate' },
      cut_pressure: { value: 0.05, confidence: 0.95, source: 'observed', reasoning: 'Lingering takes' }
    },
    style_normalization: { ghibli_base: 0, modern_shinkai: 0, live_fidelity: 1.0, normalized_sum: 1.0 },
    visual_style: { color_palette_intent: 'monochrome', contrast_philosophy: 'severe', dominant_palette: ['#000000', '#222222', '#FFFFFF'], lighting_type: 'hard_key' }
  },
  confidence_profile: {
    aggregate_certainty: 0.98,
    inference_depth: 0.95
  },
    schema_migration_history: ["14.5 -> 51.0", "51.0 -> 51.1"],
    production_v82: {
      orchestrator: { active_engine: 'local_sim', render_queue_pos: 0, estimated_completion: '0s', engine_health_score: 1.0 },
      continuity_controller: { 
        character_persistence: { value: 1.0, confidence: 1.0, source: 'observed', reasoning: 'Fixed camera state' }, 
        camera_path_continuity: { value: 0.98, confidence: 1.0, source: 'observed', reasoning: 'Rock solid mount' }, 
        lighting_consistency: { value: 0.99, confidence: 0.98, source: 'observed', reasoning: 'No light source change' }, 
        emotion_drift_locked: true, overall_continuity_score: 0.99 
      },
      autonomous_quality_loop: { loop_iteration: 1, last_correction_instruction: 'None', quality_trend: 'stable', auto_finalize_ready: true },
      world_state_provenance: {},
      relative_scales: {
        value: [
          { base_entity_id: "JUROR_01", target_entity_id: "JUDGE_BENCH", ratio: 0.35, reference_axis: 'height', confidence: 0.92 }
        ],
        confidence: 0.92,
        source: 'observed',
        reasoning: 'Geometric analysis of foreground vs background bench'
      },
      subject_composition: {
          type: 'S',
          primary_subject_count: { value: 1, confidence: 1.0, source: 'observed', reasoning: 'Single juror in close-up' },
          supporting_population: { value: 11, confidence: 0.95, source: 'inferred', reasoning: 'Other jurors off-screen' },
          animal_population: { value: 0, confidence: 1.0, source: 'observed', reasoning: 'Indoor set' },
          social_density: { value: 0.9, confidence: 0.9, source: 'inferred', reasoning: 'Extreme tension spatial density' },
          lod: { 
            level: 'close_up_detail', 
            facial_fidelity_priority: 0.98, 
            texture_density: 0.95,
            filter: { skip_facial_features: false, focus_silhouette_only: false, texture_simplification_ratio: 0.0 }
          }
      },
    relationship_dynamics: {
        trust: { value: 0.1, confidence: 0.9, source: 'inferred', reasoning: 'Hostile environment' },
        emotional_distance: { value: 0.05, confidence: 0.95, source: 'observed', reasoning: 'Extremely aggressive proximity' },
        protective_instinct: { value: 0.2, confidence: 0.85, source: 'inferred', reasoning: 'Vulnerability in heat' },
        suppression: { value: 0.85, confidence: 0.9, source: 'observed', reasoning: 'Suppressed rage dynamics' },
        reunion_tension: { value: null, confidence: 0.0, source: 'pending', reasoning: 'N/A' },
        guilt_devotion: { value: 0.15, confidence: 0.8, source: 'inferred', reasoning: 'Low devotion' }
    },
    situation_state: {
        scenario_type: 'secret_revealed',
        urgency: { value: 0.95, confidence: 1.0, source: 'observed', reasoning: 'Narrative climax timing' },
        irreversibility: { value: 0.98, confidence: 0.95, source: 'inferred', reasoning: 'Final vote pressure' },
        emotional_pressure: { value: 0.99, confidence: 1.0, source: 'observed', reasoning: 'Peak tension' },
        logical_precedents: []
    },
    temporal_bridge: { inherits_motion_from: 'NULL', gaze_vector_continuity: { value: 1.0, confidence: 0.98, source: 'observed', reasoning: 'Locked lock' }, emotional_decay_tau: { value: 5.0, confidence: 1.0, source: 'observed', reasoning: 'Permanent pressure' }, spatial_anchor_offset: [0, 0, 0] },
    spectator_state: { 
      tension: { value: 0.99, confidence: 1.0, source: 'observed', reasoning: 'Cinematic height' }, 
      anticipation: { value: 0.98, confidence: 0.9, source: 'observed', reasoning: 'Climactic expectation' }, 
      perceptual_intimacy: { value: 0.95, confidence: 1.0, source: 'observed', reasoning: 'Extreme close framing' }, 
      comfort_decay: { value: 0.9, confidence: 0.9, source: 'inferred', reasoning: 'Viewer claustrophobia' },
      narrative_immersion_index: { value: 0.98, confidence: 1.0, source: 'observed', reasoning: 'Masterpiece engagement' } 
    },
    interpretable_latents: { 
      loneliness: { value: 0.4, confidence: 0.85, source: 'inferred', reasoning: 'Isolated in a group' }, 
      dreamlike_index: { value: 0.05, confidence: 1.0, source: 'observed', reasoning: 'Hard realism' }, 
      kinetic_energy: { value: 0.02, confidence: 1.0, source: 'observed', reasoning: 'Static heat' }, 
      memory_decay: { value: 1.0, confidence: 0.9, source: 'inferred', reasoning: 'Persistent trauma' }, 
      nostalgia_bias: { value: 0.85, confidence: 0.9, source: 'inferred', reasoning: 'Classic era aesthetic' } 
    },
    narrative_causality: { purpose: 'climax_beat', setup_for: [], tension_release_delta: { value: 0.05, confidence: 0.9, source: 'inferred', reasoning: 'No release yet' }, logical_precedents: [] }
  }
};
