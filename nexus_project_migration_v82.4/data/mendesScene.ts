import { CinematicExtractionResult } from '../types';

export const MENDES_1917_SCENE: CinematicExtractionResult = {
  id: "SCENE-MENDES-1917-TRENCH-TRACKING",
  schema_version: "82.4",
  schema_signature: "CINEMATIC-WORLD-STATE-ENGINE-UNIFIED-V82.4",
  schema_meta: {
    latent_engine: "vision_production_v82.4",
    vector_semantics: "full_cognitive_reactivation",
    revision: 1,
    production_ready: true,
    perception_mode: "evidence_grounded_logic"
  },
  analysis_timestamp: "2024-05-20T14:30:00Z",
  source_hash: "sha256:mendes-1917-trench-ref-v14.7",
  core_dna_id: "SCENE-MENDES-1917-TRENCH-TRACKING",
  category: "ACTION",
  scene_indexing: {
    scene_id: "SCENE-MENDES-1917-TRENCH-TRACKING",
    source_material: "1917.mp4",
    shot_purpose: ["Environmental Establishment", "Tension Building", "One-Shot Aesthetic"],
    director_family: "Mendes-Deakins",
    v_timestamp_start: 120,
    v_timestamp_end: 185
  },
  generative_layer: {
    midjourney: "Sam Mendes directed scene, 1917 war film, smooth tracking shot, winding narrow trench, British WWI uniforms, visceral mud, overcast lighting, naturalistic color palette, cinematic high-budget realism, immersive steadicam --ar 16:9 --style raw",
    runway: "Smooth tracking shot through narrow WWI trench, British soldiers, cinematic mud, overcast lighting, immersive motion.",
    kling: "Realistic 1917 war movie scene, soldiers in muddy trench, tracking camera movement, high fidelity, 70mm look.",
    prompt_compression_ratio: 0.45
  },
  layers: {
    raw_semantic: {
      visual_description: "Soldiers in British WWI uniforms navigate a winding, narrow trench. The camera tracks smoothly with them, capturing the visceral mud and the frantic energy. The sense of unbroken flow is paradoxical with the claustrophobic walls.",
      raw_tags: ["trench", "ww1", "mud", "tracking shot", "unbroken"],
      provenance_notes: "Expert manual encoding for v51.0 Evidence Core."
    },
    scene_language: {
      cinematography_tokens: ["SmoothTracking", "SteadicamNavigation", "EyeLevelImmersion"],
      narrative_tokens: ["WWIInfantry", "PreBattleNavigation"],
      emotion_tokens: ["FranticEnergy", "LoomingDread"],
      dsl_version: "5.1.0"
    }
  },
  scene_state: {
    physics: {
      luminance_contrast: { value: 0.45, confidence: 0.95, source: 'observed', reasoning: 'Overcast soft diffuse light' },
      motion_density: { value: 0.88, confidence: 0.98, source: 'observed', reasoning: 'High relative motion in tracking' },
      depth_isolation: { value: 0.35, confidence: 0.92, source: 'observed', reasoning: 'Wide lens background visibility' },
      camera_velocity_mps: { value: 1.45, confidence: 0.95, source: 'inferred', reasoning: 'Brisk walking pace tracking' },
      subject_distance_meter: { value: 2.5, confidence: 0.9, source: 'inferred', reasoning: 'Medium shot distance' },
      luminance_balance: { value: 0.5, confidence: 1.0, source: 'observed', reasoning: 'Balanced grey day' },
      chroma_intensity: { value: 0.55, confidence: 0.9, source: 'observed', reasoning: 'Naturalistic earth tones' }
    },
    emotion: {
      dread: { value: 0.74, confidence: 0.95, source: 'observed', reasoning: 'War environment cues' },
      melancholy: { value: 0.18, confidence: 0.9, source: 'inferred', reasoning: 'Action intensity overshadowing' },
      anticipation: { value: 0.88, confidence: 0.96, source: 'observed', reasoning: 'Directional movement intensity' },
      intimacy: { value: 0.35, confidence: 0.85, source: 'inferred', reasoning: 'Communal tension' },
      arousal_rate: { value: 0.78, confidence: 0.9, source: 'inferred', reasoning: 'Steady camera motion' },
      valence_bias: { value: 0.4, confidence: 1.0, source: 'observed', reasoning: 'Standard negative state' },
      catharsis_ready: { value: 0.1, confidence: 0.9, source: 'inferred', reasoning: 'Mid-journey navigation' },
      isolation_score: { value: 0.4, confidence: 0.8, source: 'observed', reasoning: 'Group formation' }
    },
    temporal: {
      time_tension_curve: { value: 'fluid', confidence: 0.98, source: 'observed', reasoning: 'Unbroken one-shot flow' },
      rhythm_pressure: { value: 0.92, confidence: 0.95, source: 'observed', reasoning: 'Constant forward motion' },
      pacing_memory: { value: 0.98, confidence: 1.0, source: 'observed', reasoning: 'Seamless continuity' },
      pacing_waveform: [0.3, 0.42, 0.55, 0.78, 0.91, 0.85]
    },
    optics: {
      sensor_alias: { value: 'Arri-Alexa-LF', confidence: 1.0, source: 'observed', reasoning: 'Known production gear' },
      focal_length_mm: { value: 40, confidence: 1.0, source: 'observed', reasoning: 'Deakins standard preference' },
      aperture_f_stop: { value: 4.5, confidence: 0.9, source: 'inferred', reasoning: 'Medium depth of field' },
      halation_response: { value: 0.1, confidence: 0.95, source: 'observed', reasoning: 'Clean digital highlights' },
      grain_profile: { value: 'clean-digital-log', confidence: 1.0, source: 'observed', reasoning: 'Modern sensor output' }
    }
  },
  latent_steering: {
    vectors: {
      semantic_16d: {
        "dim_0": 0.88,
        "dim_1": 0.75,
        "dim_2": 0.25
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
    previous_node: "SCENE-MENDES-1917-INTRO",
    current_node: "SCENE-MENDES-1917-TRENCH-TRACKING",
    next_candidates: [],
    transition_logic: {
      energy_delta: 0.8,
      camera_flow_vector: [1, 0],
      emotion_continuity: 0.95
    }
  },
  visual_atoms: [],
  relationship_graph: [],
  director_dna: {
    camera_motion: {
      continuous_motion: { value: 0.99, confidence: 1.0, source: 'observed', reasoning: 'Legendary steadicam take' },
      human_tracking_bias: { value: 0.95, confidence: 1.0, source: 'observed', reasoning: 'Shoulder-level companion' },
      kinetic_aggression: { value: 0.45, confidence: 0.9, source: 'inferred', reasoning: 'Steady but urgent walk' },
      static_patience: { value: 0.05, confidence: 1.0, source: 'observed', reasoning: 'Zero static periods' }
    },
    lens_behavior: {
      focal_range: { value: [40, 40], confidence: 1.0, source: 'observed', reasoning: 'Static prime usage' },
      distortion_acceptance: { value: 0.1, confidence: 0.9, source: 'observed', reasoning: 'Clean wide optics' },
      optical_abstraction: { value: 0.3, confidence: 0.9, source: 'observed', reasoning: 'High-detail realistic' },
      bokeh_texture: { value: 'neutral', confidence: 0.8, source: 'observed', reasoning: 'Clean digital rolloff' }
    },
    lighting_behavior: {
      naturalism_index: { value: 0.98, confidence: 1.0, source: 'observed', reasoning: 'Natural light only' },
      shadow_density: { value: 0.55, confidence: 0.9, source: 'observed', reasoning: 'Soft overcast sky' },
      atmospheric_occlusion: { value: 0.7, confidence: 0.9, source: 'observed', reasoning: 'Dust and haze layers' },
      color_drift: { value: 0.02, confidence: 0.95, source: 'observed', reasoning: 'Rigid neutral balance' }
    },
    composition_logic: {
      rule_of_thirds: { value: 0.5, confidence: 0.9, source: 'observed', reasoning: 'Central tracking' },
      subject_isolation: { value: 0.4, confidence: 0.9, source: 'observed', reasoning: 'Environment integrated' },
      spatial_honesty: { value: 0.99, confidence: 1.0, source: 'observed', reasoning: 'Perfect continuity' },
      symmetry_bias: { value: 0.4, confidence: 0.85, source: 'observed', reasoning: 'Natural chaotic trench' },
      negative_space_ratio: { value: 0.3, confidence: 0.9, source: 'observed', reasoning: 'Walls filling frame' },
      symmetry_score: { value: 0.3, confidence: 0.9, source: 'observed', reasoning: 'Winding irregular path' },
      dominance: {
        layer_priority: 'middle',
        frame_occupancy_ratio: 0.45,
        depth_isolation_lock: false,
        subject_focus_score: 0.85
      }
    },
    editing_pacing: {
      avg_shot_duration: { value: 180.0, confidence: 1.0, source: 'observed', reasoning: 'Long take timing' },
      rhythm_uniformity: { value: 0.99, confidence: 1.0, source: 'observed', reasoning: 'Unbroken pulse' },
      montage_intensity: { value: 0.0, confidence: 1.0, source: 'observed', reasoning: 'Zero cuts' },
      cut_pressure: { value: 0.0, confidence: 1.0, source: 'observed', reasoning: 'No cutting tension' }
    },
    style_normalization: { ghibli_base: 0, modern_shinkai: 0, live_fidelity: 1.0, normalized_sum: 1.0 },
    visual_style: { color_palette_intent: 'naturalistic', contrast_philosophy: 'immersive', dominant_palette: ['#556644', '#888888', '#332211'], lighting_type: 'natural' }
  },
  confidence_profile: {
    aggregate_certainty: 0.95,
    inference_depth: 0.92
  },
    schema_migration_history: ["36.5 -> 51.0", "51.0 -> 51.1"],
    production_v82: {
      orchestrator: { active_engine: 'local_sim', render_queue_pos: 0, estimated_completion: '0s', engine_health_score: 1.0 },
      continuity_controller: { 
        character_persistence: { value: 1.0, confidence: 1.0, source: 'observed', reasoning: 'Seamless shot' }, 
        camera_path_continuity: { value: 1.0, confidence: 1.0, source: 'observed', reasoning: 'Physically continuous' }, 
        lighting_consistency: { value: 0.99, confidence: 1.0, source: 'observed', reasoning: 'Natural progression' }, 
        emotion_drift_locked: true, overall_continuity_score: 1.0 
      },
      autonomous_quality_loop: { loop_iteration: 1, last_correction_instruction: 'None', quality_trend: 'stable', auto_finalize_ready: true },
      world_state_provenance: {},
      relative_scales: {
        value: [
          { base_entity_id: "SOLDIER_01", target_entity_id: "TRENCH_HEIGHT", ratio: 0.85, reference_axis: 'height', confidence: 0.95 }
        ],
        confidence: 0.95,
        source: 'observed',
        reasoning: 'Human reference against known trench depth'
      },
      subject_composition: {
          type: 'R',
          primary_subject_count: { value: 2, confidence: 1.0, source: 'observed', reasoning: 'Two main soldiers' },
          supporting_population: { value: 50, confidence: 0.85, source: 'inferred', reasoning: 'Background troop density' },
          animal_population: { value: 0, confidence: 1.0, source: 'observed', reasoning: 'Combat zone' },
          social_density: { value: 0.7, confidence: 0.9, source: 'inferred', reasoning: 'Frontline crowding' },
          lod: { 
            level: 'medium_shot_structural', 
            facial_fidelity_priority: 0.85, 
            texture_density: 0.9,
            filter: { skip_facial_features: false, focus_silhouette_only: false, texture_simplification_ratio: 0.0 }
          }
      },
    relationship_dynamics: {
        trust: { value: 0.95, confidence: 0.9, source: 'inferred', reasoning: 'Comrades in arms' },
        emotional_distance: { value: 0.1, confidence: 0.95, source: 'observed', reasoning: 'Extreme proximity' },
        protective_instinct: { value: 0.9, confidence: 0.95, source: 'inferred', reasoning: 'Shared peril' },
        suppression: { value: 0.5, confidence: 0.8, source: 'inferred', reasoning: 'Controlled fear' },
        reunion_tension: { value: null, confidence: 0.0, source: 'pending', reasoning: 'N/A' },
        guilt_devotion: { value: 0.8, confidence: 0.9, source: 'inferred', reasoning: 'Duty bound' }
    },
    situation_state: {
        scenario_type: 'everyday_peace',
        urgency: { value: 0.85, confidence: 0.95, source: 'observed', reasoning: 'Steady urgent pace' },
        irreversibility: { value: 0.9, confidence: 0.9, source: 'inferred', reasoning: 'Frontline commitment' },
        emotional_pressure: { value: 0.75, confidence: 1.0, source: 'observed', reasoning: 'Wartime environment' },
        logical_precedents: []
    },
    temporal_bridge: { inherits_motion_from: 'NULL', gaze_vector_continuity: { value: 0.95, confidence: 0.9, source: 'observed', reasoning: 'Consistent focus' }, emotional_decay_tau: { value: 10.0, confidence: 0.8, source: 'inferred', reasoning: 'Strong mission persistence' }, spatial_anchor_offset: [0, 0, 0] },
    spectator_state: { 
      tension: { value: 0.85, confidence: 1.0, source: 'observed', reasoning: 'Spatial claustrophobia' }, 
      anticipation: { value: 0.9, confidence: 0.95, source: 'observed', reasoning: 'Winding path reveals' }, 
      perceptual_intimacy: { value: 0.75, confidence: 0.9, source: 'observed', reasoning: 'In-trench companion' }, 
      comfort_decay: { value: 0.6, confidence: 0.8, source: 'inferred', reasoning: 'Harsh environment' },
      narrative_immersion_index: { value: 0.99, confidence: 1.0, source: 'observed', reasoning: 'Technological feat' } 
    },
    interpretable_latents: { 
      loneliness: { value: 0.1, confidence: 0.95, source: 'observed', reasoning: 'Group cohesive' }, 
      dreamlike_index: { value: 0.0, confidence: 1.0, source: 'observed', reasoning: 'Hyper realism' }, 
      kinetic_energy: { value: 0.8, confidence: 1.0, source: 'observed', reasoning: 'Constant motion' }, 
      memory_decay: { value: 0.7, confidence: 0.85, source: 'inferred', reasoning: 'Immediate focus' }, 
      nostalgia_bias: { value: 0.1, confidence: 1.0, source: 'observed', reasoning: 'Documentary feel' } 
    },
    narrative_causality: { purpose: 'exposition', setup_for: [], tension_release_delta: { value: 0.0, confidence: 1.0, source: 'observed', reasoning: 'Continuous build' }, logical_precedents: [] }
  }
};
