import fs from 'node:fs';
import path from 'node:path';
import { BLEND_CONTRACT_PATH } from './directorGrammarBlendBuilder.js';
import {
  COORDINATE_REGISTRY_PATH,
  type SourceVideoCoordinateRecord,
  loadCoordinateRecord,
} from './sourceVideoSegmentToCoordinateCompiler.js';
import {
  CHARACTER_SOURCE,
  COMPOSITION_LIBRARY_SOURCE,
  EMOTION_INDEX_SOURCE,
  IDENTITY_CONTRACT_SOURCE,
  LIGHTING_INDEX_SOURCE,
  LOCATION_INDEX_SOURCE,
  RELATIONSHIP_SOURCE,
  SCENE_STATE_PHASE,
  SHOT_INDEX_SOURCE,
  WORLD_IDENTITY,
} from './sceneStateBuilder.js';
import { loadSceneSegment } from './sourceVideoSceneSegmentBuilder.js';
import { SCENE_STATE_SCHEMA_PATH } from './sourceVideoSceneStateMapper.js';

const COORDINATE_TO_STATE_LAYER_MAP = Object.freeze({
  camera_coordinate: 'camera_state',
  character_coordinate: 'character_state',
  prop_coordinate: 'composition_state',
  location_coordinate: 'location_state',
  lighting_coordinate: 'lighting_state',
  motion_coordinate: 'camera_state,environment_state',
  blocking_coordinate: 'relationship_state,composition_state',
  depth_coordinate: 'composition_state',
  continuity_locks: 'identity_state',
} as const);
import {
  VIDEO_STATE_DEFAULTS_ID,
  VIDEO_STATE_DEFAULTS_PATH,
  loadVideoStateDefaults,
} from './sourceVideoGrammarToVideoStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const STATE_COMPILER_PHASE =
  'PHASE-SOURCE-VIDEO-010-SOURCE_VIDEO_COORDINATE_TO_STATE_COMPILER_V2' as const;
export const STATE_DRAFT_SCHEMA_PATH =
  'datasets/source_video_state/source-video-state-draft.schema.json' as const;
export const STATE_DRAFT_REGISTRY_PATH =
  'datasets/source_video_state/source-video-state-draft-registry.json' as const;
export const STATE_DRAFTS_DIR = 'datasets/source_video_state/drafts' as const;

export const SEED_STATE_DRAFT_SPECS = Object.freeze([
  {
    state_draft_id: 'state_draft_ghibli_kitchen_001_v2',
    coordinate_record_id: 'coord_ghibli_kitchen_001_v1',
    emotion_id: 'warmth',
    relationship_id: 'companionship',
    location_id: 'draft_domestic_kitchen_ghibli_v2',
  },
  {
    state_draft_id: 'state_draft_shinkai_sky_light_001_v2',
    coordinate_record_id: 'coord_shinkai_sky_light_001_v1',
    emotion_id: 'longing',
    relationship_id: 'solitary_contemplation',
    location_id: 'draft_elevated_overlook_shinkai_v2',
  },
  {
    state_draft_id: 'state_draft_live_action_dialogue_001_v2',
    coordinate_record_id: 'coord_live_action_dialogue_001_v1',
    emotion_id: 'tenderness',
    relationship_id: 'sibling_bond',
    location_id: 'draft_period_parlor_live_action_v2',
  },
  {
    state_draft_id: 'state_draft_mori_emotion_flow_001_v2',
    coordinate_record_id: 'coord_mori_emotion_flow_001_v1',
    emotion_id: 'craft_contentment',
    relationship_id: 'companion_walk',
    location_id: 'draft_woodland_path_mori_v2',
  },
] as const);

type BlendContract = {
  blend_id: string;
  contract_id: string;
};

export type StateDraftExecutionFlags = {
  design_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  frame_extraction: false;
  ocr: false;
  generation: false;
};

export type SourceVideoStateDraft = {
  state_draft_id: string;
  phase: typeof STATE_COMPILER_PHASE;
  scene_state_phase: typeof SCENE_STATE_PHASE;
  world_identity: typeof WORLD_IDENTITY;
  source_coordinate_record_id: string;
  source_segment_id: string;
  source_video_id: string;
  director_family: SourceVideoCoordinateRecord['director_family'];
  director_blend_ref: string;
  video_state_defaults_ref: typeof VIDEO_STATE_DEFAULTS_ID;
  director_grammar_refs: string[];
  scene_state_mapping_ref: string | null;
  identity_state: {
    identity_priority_rank: 1;
    identity_source: string;
    character_first_contract: string;
    protected_character_ids: string[];
    identity_lock_tokens: string[];
    location_lock_tokens: string[];
    composition_lock_tokens: string[];
  };
  character_state: {
    active_character_ids: string[];
    primary_character_id: string;
    character_source: string;
    character_tokens: string[];
  };
  emotion_state: {
    emotion_id: string;
    emotion_source: string;
    intensity: number;
    acting_visibility_weight: string;
  };
  relationship_state: {
    relationship_id: string;
    relationship_source: string;
    participant_ids: string[];
    distance_behavior: string;
    gaze_pattern: string;
    blocking_primary_focus: string;
  };
  camera_state: {
    shot_type: string;
    camera_source: string;
    camera_position: string;
    camera_height: string;
    camera_direction: string;
    motion_vectors: string[];
  };
  composition_state: {
    composition_id: string;
    composition_source: string;
    prop_anchor_ids: string[];
    character_positions: Record<string, string>;
    depth_layers: SourceVideoCoordinateRecord['depth_coordinate'];
    negative_space: string;
  };
  location_state: {
    location_id: string;
    location_name: string;
    location_type: string;
    domain: string;
    location_source: string;
    layout_lock_id: string;
    walkable_zone: string;
  };
  lighting_state: {
    lighting_id: string;
    lighting_source: string;
    direction: string;
    intensity: string;
  };
  environment_state: {
    world_identity: typeof WORLD_IDENTITY;
    world_type: string;
    environment_source: string;
    time_setting_id: string;
    weather_profile: string;
    supporting_elements: string[];
    ambient_motion: string[];
  };
  coordinate_trace: {
    coordinate_record_id: string;
    segment_id: string;
    source_video_id: string;
    source_template_ref: string | null;
    scene_state_mapping_ref: string | null;
    timestamp_start: number;
    timestamp_end: number;
    layer_map: Record<string, string>;
    scene_state_schema: string;
    director_blend_contract: string;
  };
  continuity_locks: SourceVideoCoordinateRecord['continuity_locks'];
  production_status: {
    isolated: true;
    storage_domain: 'source_video_state';
    production_registry: false;
    draft_status: 'coordinate_compiled_v2';
  };
  execution_flags: StateDraftExecutionFlags;
  compiled_at: string;
};

const EXECUTION_FLAGS: StateDraftExecutionFlags = {
  design_only: true,
  gpu_execution: false,
  external_call_allowed: false,
  frame_extraction: false,
  ocr: false,
  generation: false,
};

function loadBlendContract(projectRoot: string): BlendContract | null {
  const abs = path.join(projectRoot, BLEND_CONTRACT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as BlendContract;
}

function inferTimeSetting(colorTemperature: string): string {
  if (colorTemperature.includes('warm-morning')) return 'morning';
  if (colorTemperature.includes('golden')) return 'golden_hour';
  if (colorTemperature.includes('blue') || colorTemperature.includes('twilight')) return 'twilight';
  if (colorTemperature.includes('soft-day-green')) return 'day';
  return 'day';
}

function inferWeather(colorTemperature: string): string {
  if (colorTemperature.includes('rain') || colorTemperature.includes('overcast')) return 'overcast';
  return 'clear_mediterranean';
}

export function compileStateDraftFromCoordinate(
  projectRoot: string,
  spec: (typeof SEED_STATE_DRAFT_SPECS)[number],
  coordinate: SourceVideoCoordinateRecord,
  blend: BlendContract
): SourceVideoStateDraft {
  const segment = loadSceneSegment(projectRoot, coordinate.segment_id);
  const characterIds = coordinate.character_coordinate.map((c) => c.character_ref);
  const primaryCharacter = characterIds[0] ?? 'unknown';
  const characterPositions = Object.fromEntries(
    coordinate.character_coordinate.map((c) => [c.character_ref, c.position])
  );
  const propIds = coordinate.prop_coordinate.map((p) => p.prop_id);
  const motionVectors = coordinate.motion_coordinate.map((m) => m.vector);
  const ambientMotion = coordinate.motion_coordinate
    .filter((m) => !characterIds.includes(m.subject_ref))
    .map((m) => m.vector);

  return {
    state_draft_id: spec.state_draft_id,
    phase: STATE_COMPILER_PHASE,
    scene_state_phase: SCENE_STATE_PHASE,
    world_identity: WORLD_IDENTITY,
    source_coordinate_record_id: coordinate.coordinate_record_id,
    source_segment_id: coordinate.segment_id,
    source_video_id: coordinate.source_video_id,
    director_family: coordinate.director_family,
    director_blend_ref: blend.blend_id,
    video_state_defaults_ref: VIDEO_STATE_DEFAULTS_ID,
    director_grammar_refs: [...coordinate.grammar_refs],
    scene_state_mapping_ref: coordinate.scene_state_mapping_ref,
    identity_state: {
      identity_priority_rank: 1,
      identity_source: IDENTITY_CONTRACT_SOURCE,
      character_first_contract: IDENTITY_CONTRACT_SOURCE,
      protected_character_ids: characterIds,
      identity_lock_tokens: [...coordinate.continuity_locks.identity_locks],
      location_lock_tokens: [...coordinate.continuity_locks.location_locks],
      composition_lock_tokens: [...coordinate.continuity_locks.composition_locks],
    },
    character_state: {
      active_character_ids: characterIds,
      primary_character_id: primaryCharacter,
      character_source: CHARACTER_SOURCE,
      character_tokens: characterIds.map((id) => `character:${id}`),
    },
    emotion_state: {
      emotion_id: spec.emotion_id,
      emotion_source: EMOTION_INDEX_SOURCE,
      intensity: 0.7,
      acting_visibility_weight: 'medium',
    },
    relationship_state: {
      relationship_id: spec.relationship_id,
      relationship_source: RELATIONSHIP_SOURCE,
      participant_ids: characterIds,
      distance_behavior: coordinate.blocking_coordinate.primary_focus,
      gaze_pattern: coordinate.character_coordinate.map((c) => c.facing).join(' / '),
      blocking_primary_focus: coordinate.blocking_coordinate.primary_focus,
    },
    camera_state: {
      shot_type: coordinate.camera_coordinate.shot_type,
      camera_source: SHOT_INDEX_SOURCE,
      camera_position: coordinate.camera_coordinate.position,
      camera_height: coordinate.camera_coordinate.height,
      camera_direction: coordinate.camera_coordinate.facing,
      motion_vectors: motionVectors,
    },
    composition_state: {
      composition_id: `draft_composition_${coordinate.coordinate_record_id}`,
      composition_source: COMPOSITION_LIBRARY_SOURCE,
      prop_anchor_ids: propIds,
      character_positions: characterPositions,
      depth_layers: coordinate.depth_coordinate.map((d) => ({ ...d })),
      negative_space: coordinate.blocking_coordinate.negative_space,
    },
    location_state: {
      location_id: spec.location_id,
      location_name: coordinate.location_coordinate.space_type,
      location_type: coordinate.location_coordinate.space_type,
      domain: 'source_video_state_draft',
      location_source: LOCATION_INDEX_SOURCE,
      layout_lock_id: `layout_lock:${coordinate.location_coordinate.anchor_point}`,
      walkable_zone: coordinate.location_coordinate.walkable_zone,
    },
    lighting_state: {
      lighting_id: `draft_lighting_${coordinate.coordinate_record_id}`,
      lighting_source: LIGHTING_INDEX_SOURCE,
      direction: coordinate.lighting_coordinate.key_direction,
      intensity: coordinate.lighting_coordinate.fill_level,
    },
    environment_state: {
      world_identity: WORLD_IDENTITY,
      world_type: 'early-1900s mediterranean harbor town',
      environment_source: LOCATION_INDEX_SOURCE,
      time_setting_id: inferTimeSetting(coordinate.lighting_coordinate.color_temperature),
      weather_profile: inferWeather(coordinate.lighting_coordinate.color_temperature),
      supporting_elements: coordinate.depth_coordinate.map((l) => l.content_hint),
      ambient_motion: ambientMotion,
    },
    coordinate_trace: {
      coordinate_record_id: coordinate.coordinate_record_id,
      segment_id: coordinate.segment_id,
      source_video_id: coordinate.source_video_id,
      source_template_ref: coordinate.source_template_ref,
      scene_state_mapping_ref: coordinate.scene_state_mapping_ref,
      timestamp_start: segment?.timestamp_start ?? 0,
      timestamp_end: segment?.timestamp_end ?? 0,
      layer_map: { ...COORDINATE_TO_STATE_LAYER_MAP },
      scene_state_schema: SCENE_STATE_SCHEMA_PATH,
      director_blend_contract: blend.contract_id,
    },
    continuity_locks: {
      identity_locks: [...coordinate.continuity_locks.identity_locks],
      location_locks: [...coordinate.continuity_locks.location_locks],
      composition_locks: [...coordinate.continuity_locks.composition_locks],
    },
    production_status: {
      isolated: true,
      storage_domain: 'source_video_state',
      production_registry: false,
      draft_status: 'coordinate_compiled_v2',
    },
    execution_flags: { ...EXECUTION_FLAGS },
    compiled_at: new Date().toISOString(),
  };
}

export function compileAllStateDrafts(projectRoot?: string): SourceVideoStateDraft[] {
  const root = resolveProjectRoot(projectRoot);

  if (!fs.existsSync(path.join(root, COORDINATE_REGISTRY_PATH))) {
    throw new Error(`Missing coordinate registry: ${COORDINATE_REGISTRY_PATH}`);
  }

  const blend = loadBlendContract(root);
  if (!blend) {
    throw new Error(`Missing blend contract: ${BLEND_CONTRACT_PATH}`);
  }

  const defaults = loadVideoStateDefaults(root);
  if (!defaults) {
    throw new Error(`Missing video state defaults: ${VIDEO_STATE_DEFAULTS_PATH}`);
  }

  const drafts: SourceVideoStateDraft[] = [];
  for (const spec of SEED_STATE_DRAFT_SPECS) {
    const coordinate = loadCoordinateRecord(root, spec.coordinate_record_id);
    if (!coordinate) {
      throw new Error(`Missing coordinate record: ${spec.coordinate_record_id}`);
    }
    drafts.push(compileStateDraftFromCoordinate(root, spec, coordinate, blend));
  }

  return drafts;
}

export function writeStateDrafts(projectRoot?: string): {
  drafts: SourceVideoStateDraft[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const drafts = compileAllStateDrafts(root);
  const outDir = path.join(root, STATE_DRAFTS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const draft of drafts) {
    const rel = `${STATE_DRAFTS_DIR}/${draft.state_draft_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  return { drafts, written };
}

export function loadStateDraft(
  projectRoot: string,
  stateDraftId: string
): SourceVideoStateDraft | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, STATE_DRAFTS_DIR, `${stateDraftId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoStateDraft;
}
