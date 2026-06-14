import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  MOVIE_COORDINATE_REGISTRY_PATH,
  type MovieSceneCoordinate,
} from './movieSceneCoordinateBuilder.js';
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
import { resolveProjectRoot } from './projectRootResolver.js';

export const SCENE_STATE_MAP_PHASE =
  'PHASE-SOURCE-VIDEO-005-SOURCE_VIDEO_TO_SCENE_STATE_MAPPING_V1' as const;
export const SCENE_STATE_MAP_REGISTRY_PATH =
  'datasets/source_video_mapping/source-video-scene-state-map-registry.json' as const;
export const SCENE_STATE_MAP_SCHEMA_PATH =
  'datasets/source_video_mapping/source-video-scene-state-map.schema.json' as const;
export const SCENE_STATE_SCHEMA_PATH = 'datasets/state/scene-state.schema.json' as const;

export const STANDARD_COORDINATE_TO_STATE_MAP = Object.freeze({
  camera_coordinate: 'camera_state',
  character_coordinates: 'character_state',
  prop_coordinates: 'composition_state',
  location_coordinates: 'location_state',
  lighting_coordinates: 'lighting_state',
  motion_vectors: ['camera_state', 'environment_state'],
  blocking_map: ['relationship_state', 'composition_state'],
  depth_layers: 'composition_state',
  continuity_locks: 'identity_state',
} as const);

export const SEED_MAPPING_SPECS = Object.freeze([
  {
    mapping_id: 'map_ghibli_kitchen_to_scene_state_v1',
    source_coordinate_id: 'movie_coord_ghibli_kitchen_blocking_v1',
    target_scene_state_id: 'scene_draft_ghibli_kitchen_blocking_v1',
    emotion_id: 'warmth',
    relationship_id: 'companionship',
    location_id: 'draft_domestic_kitchen_ghibli',
  },
  {
    mapping_id: 'map_shinkai_light_sky_to_scene_state_v1',
    source_coordinate_id: 'movie_coord_shinkai_light_sky_v1',
    target_scene_state_id: 'scene_draft_shinkai_light_sky_v1',
    emotion_id: 'longing',
    relationship_id: 'solitary_contemplation',
    location_id: 'draft_elevated_overlook_shinkai',
  },
  {
    mapping_id: 'map_live_action_dialogue_to_scene_state_v1',
    source_coordinate_id: 'movie_coord_live_action_dialogue_blocking_v1',
    target_scene_state_id: 'scene_draft_live_action_dialogue_v1',
    emotion_id: 'tenderness',
    relationship_id: 'sibling_bond',
    location_id: 'draft_period_parlor_live_action',
  },
] as const);

export type SourceVideoSceneStateMap = {
  mapping_id: string;
  phase: typeof SCENE_STATE_MAP_PHASE;
  source_coordinate_id: string;
  target_scene_state_id: string;
  source_video_id: string;
  director_grammar_refs: string[];
  coordinate_to_state_map: typeof STANDARD_COORDINATE_TO_STATE_MAP;
  execution_flags: {
    design_only: true;
    gpu_execution: false;
    frame_extraction: false;
    external_call_allowed: false;
  };
  mapped_at: string;
};

export type MappedSceneStateDraft = {
  scene_state_id: string;
  mapping_phase: typeof SCENE_STATE_MAP_PHASE;
  draft_status: 'mapped_draft';
  source_mapping_id: string;
  source_coordinate_id: string;
  source_video_id: string;
  director_grammar_refs: string[];
  phase: typeof SCENE_STATE_PHASE;
  world_identity: typeof WORLD_IDENTITY;
  character_state: {
    active_character_ids: string[];
    primary_character_id: string;
    character_source: string;
    character_tokens: string[];
  };
  location_state: {
    location_id: string;
    location_name: string;
    location_type: string;
    domain: string;
    location_source: string;
    layout_lock_id?: string;
    walkable_zone?: string;
  };
  lighting_state: {
    lighting_id: string;
    lighting_source: string;
    direction?: string;
    intensity?: string;
    color_temperature_k?: number;
  };
  emotion_state: {
    emotion_id: string;
    emotion_source: string;
    intensity: number;
    acting_visibility_weight: string;
  };
  relationship_state: {
    relationship_id?: string;
    relationship_source: string;
    participant_ids: string[];
    distance_behavior?: string;
    gaze_pattern?: string;
    blocking_primary_focus?: string;
  };
  camera_state: {
    shot_type: string;
    camera_source: string;
    camera_position?: string;
    camera_height?: string;
    camera_direction?: string;
    motion_vectors?: string[];
  };
  composition_state: {
    composition_id?: string;
    composition_source: string;
    prop_anchor_ids: string[];
    character_positions: Record<string, string>;
    depth_layers?: Array<{ layer_index: number; layer_role: string; content_hint: string }>;
    negative_space?: string;
  };
  environment_state: {
    world_identity: string;
    world_type: string;
    environment_source: string;
    time_setting_id?: string;
    weather_profile?: string;
    supporting_elements: string[];
    ambient_motion?: string[];
  };
  identity_state: {
    identity_priority_rank: number;
    identity_source: string;
    character_first_contract: string;
    protected_character_ids: string[];
    identity_lock_tokens: string[];
    location_lock_tokens: string[];
    composition_lock_tokens: string[];
  };
  source_refs: Record<string, string>;
  design_only: true;
  gpu_execution: false;
  built_at: string;
};

export function loadCoordinateTemplate(
  projectRoot: string,
  coordinateId: string
): MovieSceneCoordinate | null {
  const root = resolveProjectRoot(projectRoot);
  const registry = readJsonRecord(root, MOVIE_COORDINATE_REGISTRY_PATH) as {
    coordinate_templates?: Array<{ coordinate_id: string; template_path: string }>;
  } | null;

  const entry = registry?.coordinate_templates?.find((t) => t.coordinate_id === coordinateId);
  if (!entry) return null;

  const abs = path.join(root, entry.template_path);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieSceneCoordinate;
}

function inferTimeSetting(lighting: MovieSceneCoordinate['lighting_coordinates']): string {
  if (lighting.color_temperature.includes('warm-morning')) return 'morning';
  if (lighting.color_temperature.includes('golden')) return 'golden_hour';
  if (lighting.color_temperature.includes('twilight')) return 'twilight';
  return 'day';
}

export function buildSceneStateMapRecord(
  coordinate: MovieSceneCoordinate,
  spec: (typeof SEED_MAPPING_SPECS)[number]
): SourceVideoSceneStateMap {
  return {
    mapping_id: spec.mapping_id,
    phase: SCENE_STATE_MAP_PHASE,
    source_coordinate_id: coordinate.coordinate_id,
    target_scene_state_id: spec.target_scene_state_id,
    source_video_id: coordinate.source_video_id,
    director_grammar_refs: [...coordinate.director_grammar_refs],
    coordinate_to_state_map: STANDARD_COORDINATE_TO_STATE_MAP,
    execution_flags: {
      design_only: true,
      gpu_execution: false,
      frame_extraction: false,
      external_call_allowed: false,
    },
    mapped_at: new Date().toISOString(),
  };
}

export function mapCoordinateToSceneStateDraft(
  coordinate: MovieSceneCoordinate,
  spec: (typeof SEED_MAPPING_SPECS)[number]
): MappedSceneStateDraft {
  const characterIds = coordinate.character_coordinates.map((c) => c.character_ref);
  const primaryCharacter = characterIds[0] ?? 'unknown';
  const characterPositions = Object.fromEntries(
    coordinate.character_coordinates.map((c) => [c.character_ref, c.position])
  );
  const propIds = coordinate.prop_coordinates.map((p) => p.prop_id);
  const motionSubjects = coordinate.motion_vectors.map((m) => m.vector);
  const ambientMotion = coordinate.motion_vectors
    .filter((m) => !m.subject_ref.startsWith('protagonist') && !m.subject_ref.startsWith('sister'))
    .map((m) => m.vector);

  return {
    scene_state_id: spec.target_scene_state_id,
    mapping_phase: SCENE_STATE_MAP_PHASE,
    draft_status: 'mapped_draft',
    source_mapping_id: spec.mapping_id,
    source_coordinate_id: coordinate.coordinate_id,
    source_video_id: coordinate.source_video_id,
    director_grammar_refs: [...coordinate.director_grammar_refs],
    phase: SCENE_STATE_PHASE,
    world_identity: WORLD_IDENTITY,
    character_state: {
      active_character_ids: characterIds,
      primary_character_id: primaryCharacter,
      character_source: CHARACTER_SOURCE,
      character_tokens: characterIds.map((id) => `character:${id}`),
    },
    location_state: {
      location_id: spec.location_id,
      location_name: coordinate.location_coordinates.space_type,
      location_type: coordinate.location_coordinates.space_type,
      domain: 'source_video_mapping_draft',
      location_source: LOCATION_INDEX_SOURCE,
      layout_lock_id: `layout_lock:${coordinate.location_coordinates.anchor_point}`,
      walkable_zone: coordinate.location_coordinates.walkable_zone,
    },
    lighting_state: {
      lighting_id: `draft_lighting_${coordinate.coordinate_id}`,
      lighting_source: LIGHTING_INDEX_SOURCE,
      direction: coordinate.lighting_coordinates.key_direction,
      intensity: coordinate.lighting_coordinates.fill_level,
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
      distance_behavior: coordinate.blocking_map.primary_focus,
      gaze_pattern: coordinate.character_coordinates.map((c) => c.facing).join(' / '),
      blocking_primary_focus: coordinate.blocking_map.primary_focus,
    },
    camera_state: {
      shot_type: coordinate.camera_coordinate.shot_type,
      camera_source: SHOT_INDEX_SOURCE,
      camera_position: coordinate.camera_coordinate.position,
      camera_height: coordinate.camera_coordinate.height,
      camera_direction: coordinate.camera_coordinate.facing,
      motion_vectors: motionSubjects,
    },
    composition_state: {
      composition_id: `draft_composition_${coordinate.coordinate_id}`,
      composition_source: COMPOSITION_LIBRARY_SOURCE,
      prop_anchor_ids: propIds,
      character_positions: characterPositions,
      depth_layers: coordinate.depth_layers,
      negative_space: coordinate.blocking_map.negative_space,
    },
    environment_state: {
      world_identity: WORLD_IDENTITY,
      world_type: 'early-1900s mediterranean harbor town',
      environment_source: LOCATION_INDEX_SOURCE,
      time_setting_id: inferTimeSetting(coordinate.lighting_coordinates),
      weather_profile: coordinate.lighting_coordinates.color_temperature.includes('rain')
        ? 'overcast'
        : 'clear_mediterranean',
      supporting_elements: coordinate.depth_layers.map((l) => l.content_hint),
      ambient_motion: ambientMotion,
    },
    identity_state: {
      identity_priority_rank: 1,
      identity_source: IDENTITY_CONTRACT_SOURCE,
      character_first_contract: IDENTITY_CONTRACT_SOURCE,
      protected_character_ids: characterIds,
      identity_lock_tokens: coordinate.continuity_locks.identity_locks,
      location_lock_tokens: coordinate.continuity_locks.location_locks,
      composition_lock_tokens: coordinate.continuity_locks.composition_locks,
    },
    source_refs: {
      source_video_id: coordinate.source_video_id,
      source_coordinate_id: coordinate.coordinate_id,
      mapping_id: spec.mapping_id,
      scene_state_schema: SCENE_STATE_SCHEMA_PATH,
      timestamp_start: String(coordinate.timestamp_start),
      timestamp_end: String(coordinate.timestamp_end),
    },
    design_only: true,
    gpu_execution: false,
    built_at: new Date().toISOString(),
  };
}

export function buildSeedSceneStateMappings(projectRoot?: string): Array<{
  mapping: SourceVideoSceneStateMap;
  draft: MappedSceneStateDraft;
}> {
  const root = resolveProjectRoot(projectRoot);
  const results: Array<{ mapping: SourceVideoSceneStateMap; draft: MappedSceneStateDraft }> = [];

  for (const spec of SEED_MAPPING_SPECS) {
    const coordinate = loadCoordinateTemplate(root, spec.source_coordinate_id);
    if (!coordinate) {
      throw new Error(`Missing coordinate template: ${spec.source_coordinate_id}`);
    }
    results.push({
      mapping: buildSceneStateMapRecord(coordinate, spec),
      draft: mapCoordinateToSceneStateDraft(coordinate, spec),
    });
  }

  return results;
}

export function writeSceneStateMappings(
  projectRoot: string,
  pairs: Array<{ mapping: SourceVideoSceneStateMap; draft: MappedSceneStateDraft }>
): { mappings: string[]; drafts: string[] } {
  const root = resolveProjectRoot(projectRoot);
  const mappingDir = path.join(root, 'datasets/source_video_mapping/mappings');
  const draftDir = path.join(root, 'datasets/source_video_mapping/mapped-scene-states');
  fs.mkdirSync(mappingDir, { recursive: true });
  fs.mkdirSync(draftDir, { recursive: true });

  const mappings: string[] = [];
  const drafts: string[] = [];

  for (const { mapping, draft } of pairs) {
    const mapRel = `datasets/source_video_mapping/mappings/${mapping.mapping_id}.json`;
    const draftRel = `datasets/source_video_mapping/mapped-scene-states/${draft.scene_state_id}.json`;
    fs.writeFileSync(path.join(root, mapRel), `${JSON.stringify(mapping, null, 2)}\n`, 'utf8');
    fs.writeFileSync(path.join(root, draftRel), `${JSON.stringify(draft, null, 2)}\n`, 'utf8');
    mappings.push(mapRel);
    drafts.push(draftRel);
  }

  return { mappings, drafts };
}
