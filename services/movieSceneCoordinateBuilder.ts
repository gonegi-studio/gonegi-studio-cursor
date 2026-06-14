import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { DIRECTOR_GRAMMAR_REGISTRY_PATH } from './directorGrammarExtractor.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_COORDINATE_PHASE =
  'PHASE-SOURCE-VIDEO-004-MOVIE_SCENE_COORDINATE_SYSTEM_V1' as const;
export const MOVIE_COORDINATE_REGISTRY_PATH =
  'datasets/movie_coordinate/movie-scene-coordinate-registry.json' as const;
export const MOVIE_COORDINATE_SCHEMA_PATH =
  'datasets/movie_coordinate/movie-scene-coordinate.schema.json' as const;

export const SEED_COORDINATE_SPECS = Object.freeze([
  {
    coordinate_id: 'movie_coord_ghibli_kitchen_blocking_v1',
    source_video_id: 'GHIBLI_01',
    scene_index: 1,
    timestamp_start: 48.0,
    timestamp_end: 72.0,
    director_grammar_refs: ['director_grammar_ghibli_v1'],
    template_kind: 'kitchen_blocking' as const,
  },
  {
    coordinate_id: 'movie_coord_shinkai_light_sky_v1',
    source_video_id: 'SHINKAI_01',
    scene_index: 1,
    timestamp_start: 12.0,
    timestamp_end: 38.0,
    director_grammar_refs: ['director_grammar_shinkai_v1'],
    template_kind: 'light_sky' as const,
  },
  {
    coordinate_id: 'movie_coord_live_action_dialogue_blocking_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    scene_index: 1,
    timestamp_start: 95.0,
    timestamp_end: 128.0,
    director_grammar_refs: ['director_grammar_live_action_v1'],
    template_kind: 'dialogue_blocking' as const,
  },
] as const);

export type MovieSceneCoordinate = {
  coordinate_id: string;
  phase: typeof MOVIE_COORDINATE_PHASE;
  source_video_id: string;
  scene_index: number;
  timestamp_start: number;
  timestamp_end: number;
  camera_coordinate: {
    position: string;
    facing: string;
    height: string;
    fov_hint: string;
    shot_type: string;
  };
  character_coordinates: Array<{
    character_ref: string;
    position: string;
    facing: string;
    posture: string;
    identity_anchor: string;
  }>;
  prop_coordinates: Array<{
    prop_id: string;
    position: string;
    interaction_state: string;
  }>;
  location_coordinates: {
    space_type: string;
    anchor_point: string;
    walkable_zone: string;
  };
  lighting_coordinates: {
    key_direction: string;
    fill_level: string;
    color_temperature: string;
  };
  motion_vectors: Array<{
    subject_ref: string;
    vector: string;
    duration_hint: string;
  }>;
  blocking_map: {
    primary_focus: string;
    secondary_focus: string;
    negative_space: string;
  };
  depth_layers: Array<{
    layer_index: number;
    layer_role: string;
    content_hint: string;
  }>;
  continuity_locks: {
    identity_locks: string[];
    location_locks: string[];
    composition_locks: string[];
  };
  director_grammar_refs: string[];
  execution_flags: {
    design_only: true;
    gpu_execution: false;
    frame_extraction: false;
    external_call_allowed: false;
  };
  template_kind: 'design_template';
  built_at: string;
};

function buildGhibliKitchenTemplate(spec: (typeof SEED_COORDINATE_SPECS)[number]): MovieSceneCoordinate {
  return {
    coordinate_id: spec.coordinate_id,
    phase: MOVIE_COORDINATE_PHASE,
    source_video_id: spec.source_video_id,
    scene_index: spec.scene_index,
    timestamp_start: spec.timestamp_start,
    timestamp_end: spec.timestamp_end,
    camera_coordinate: {
      position: 'kitchen-entry-third',
      facing: 'hearth-center',
      height: 'eye-level',
      fov_hint: 'normal-neutral',
      shot_type: 'two-shot-medium',
    },
    character_coordinates: [
      {
        character_ref: 'protagonist_a',
        position: 'counter-left-third',
        facing: 'hearth',
        posture: 'standing-work',
        identity_anchor: 'identity_anchor:protagonist_a_face_v1',
      },
      {
        character_ref: 'protagonist_b',
        position: 'counter-right-third',
        facing: 'protagonist_a',
        posture: 'seated-relaxed',
        identity_anchor: 'identity_anchor:protagonist_b_face_v1',
      },
    ],
    prop_coordinates: [
      {
        prop_id: 'tea_pot',
        position: 'counter-center',
        interaction_state: 'pour-ready',
      },
      {
        prop_id: 'window_sill_herbs',
        position: 'background-window',
        interaction_state: 'static-anchor',
      },
    ],
    location_coordinates: {
      space_type: 'domestic-kitchen',
      anchor_point: 'hearth-center',
      walkable_zone: 'kitchen-floor-tile',
    },
    lighting_coordinates: {
      key_direction: 'window-left',
      fill_level: 'hearth-warm-fill',
      color_temperature: 'warm-morning',
    },
    motion_vectors: [
      {
        subject_ref: 'protagonist_a',
        vector: 'counter-reach-to-teapot',
        duration_hint: 'slow-deliberate',
      },
    ],
    blocking_map: {
      primary_focus: 'counter-exchange',
      secondary_focus: 'hearth-glow',
      negative_space: 'window-background',
    },
    depth_layers: [
      { layer_index: 0, layer_role: 'foreground', content_hint: 'counter-props' },
      { layer_index: 1, layer_role: 'midground', content_hint: 'character-pair' },
      { layer_index: 2, layer_role: 'background', content_hint: 'window-hearth-wall' },
    ],
    continuity_locks: {
      identity_locks: [
        'identity_anchor:protagonist_a_face_v1',
        'identity_anchor:protagonist_b_face_v1',
        'identity_lock:preserve_face_geometry',
      ],
      location_locks: [
        'location_lock:domestic-kitchen',
        'walkable-zone:kitchen-floor-tile',
      ],
      composition_locks: [
        'composition_lock:two-shot-balance',
        'prop_anchor:tea_pot',
        'prop_anchor:window_sill_herbs',
      ],
    },
    director_grammar_refs: [...spec.director_grammar_refs],
    execution_flags: {
      design_only: true,
      gpu_execution: false,
      frame_extraction: false,
      external_call_allowed: false,
    },
    template_kind: 'design_template',
    built_at: new Date().toISOString(),
  };
}

function buildShinkaiLightSkyTemplate(spec: (typeof SEED_COORDINATE_SPECS)[number]): MovieSceneCoordinate {
  return {
    coordinate_id: spec.coordinate_id,
    phase: MOVIE_COORDINATE_PHASE,
    source_video_id: spec.source_video_id,
    scene_index: spec.scene_index,
    timestamp_start: spec.timestamp_start,
    timestamp_end: spec.timestamp_end,
    camera_coordinate: {
      position: 'overlook-rail-center',
      facing: 'horizon-sky',
      height: 'chest-level',
      fov_hint: 'wide-expansive',
      shot_type: 'sky-dominant-wide',
    },
    character_coordinates: [
      {
        character_ref: 'solitary_figure',
        position: 'rail-left-third',
        facing: 'horizon',
        posture: 'standing-contemplative',
        identity_anchor: 'identity_anchor:solitary_figure_silhouette_v1',
      },
    ],
    prop_coordinates: [
      {
        prop_id: 'transit_ticket',
        position: 'hand-hold-foreground',
        interaction_state: 'grip-tight',
      },
    ],
    location_coordinates: {
      space_type: 'elevated-overlook',
      anchor_point: 'horizon-line',
      walkable_zone: 'overlook-platform',
    },
    lighting_coordinates: {
      key_direction: 'sunset-backlight',
      fill_level: 'sky-gradient-fill',
      color_temperature: 'golden-to-blue-shift',
    },
    motion_vectors: [
      {
        subject_ref: 'cloud_layer',
        vector: 'slow-lateral-drift',
        duration_hint: 'ambient-continuous',
      },
      {
        subject_ref: 'solitary_figure',
        vector: 'minimal-head-turn',
        duration_hint: 'emotional-hold',
      },
    ],
    blocking_map: {
      primary_focus: 'figure-sky-silhouette',
      secondary_focus: 'horizon-gradient',
      negative_space: 'upper-sky-dominant',
    },
    depth_layers: [
      { layer_index: 0, layer_role: 'foreground', content_hint: 'rail-figure-silhouette' },
      { layer_index: 1, layer_role: 'midground', content_hint: 'city-depth-layer' },
      { layer_index: 2, layer_role: 'background', content_hint: 'sky-gradient-clouds' },
    ],
    continuity_locks: {
      identity_locks: [
        'identity_anchor:solitary_figure_silhouette_v1',
        'identity_lock:preserve_silhouette_read',
      ],
      location_locks: [
        'location_lock:elevated-overlook',
        'walkable-zone:overlook-platform',
      ],
      composition_locks: [
        'composition_lock:sky-negative-space',
        'composition_lock:horizon-third',
        'prop_anchor:transit_ticket',
      ],
    },
    director_grammar_refs: [...spec.director_grammar_refs],
    execution_flags: {
      design_only: true,
      gpu_execution: false,
      frame_extraction: false,
      external_call_allowed: false,
    },
    template_kind: 'design_template',
    built_at: new Date().toISOString(),
  };
}

function buildLiveActionDialogueTemplate(spec: (typeof SEED_COORDINATE_SPECS)[number]): MovieSceneCoordinate {
  return {
    coordinate_id: spec.coordinate_id,
    phase: MOVIE_COORDINATE_PHASE,
    source_video_id: spec.source_video_id,
    scene_index: spec.scene_index,
    timestamp_start: spec.timestamp_start,
    timestamp_end: spec.timestamp_end,
    camera_coordinate: {
      position: 'parlor-master-left',
      facing: 'hearth-ensemble',
      height: 'eye-level',
      fov_hint: 'normal-neutral',
      shot_type: 'master-two-shot',
    },
    character_coordinates: [
      {
        character_ref: 'sister_a',
        position: 'hearth-chair-left',
        facing: 'sister_b',
        posture: 'seated-upright',
        identity_anchor: 'identity_anchor:sister_a_period_face_v1',
      },
      {
        character_ref: 'sister_b',
        position: 'hearth-chair-right',
        facing: 'sister_a',
        posture: 'seated-lean-forward',
        identity_anchor: 'identity_anchor:sister_b_period_face_v1',
      },
    ],
    prop_coordinates: [
      {
        prop_id: 'writing_desk_letter',
        position: 'side-table-mid',
        interaction_state: 'reference-prop',
      },
      {
        prop_id: 'fireplace_practical',
        position: 'hearth-center-back',
        interaction_state: 'lit-warm',
      },
    ],
    location_coordinates: {
      space_type: 'period-parlor',
      anchor_point: 'hearth-center',
      walkable_zone: 'parlor-rug-zone',
    },
    lighting_coordinates: {
      key_direction: 'window-side-key',
      fill_level: 'fireplace-warm-fill',
      color_temperature: 'soft-day-interior',
    },
    motion_vectors: [
      {
        subject_ref: 'sister_b',
        vector: 'gesture-open-hand',
        duration_hint: 'dialogue-beat',
      },
    ],
    blocking_map: {
      primary_focus: 'sister-dialogue-pair',
      secondary_focus: 'hearth-practical',
      negative_space: 'window-wall-left',
    },
    depth_layers: [
      { layer_index: 0, layer_role: 'foreground', content_hint: 'side-table-props' },
      { layer_index: 1, layer_role: 'midground', content_hint: 'seated-ensemble' },
      { layer_index: 2, layer_role: 'background', content_hint: 'hearth-window-wall' },
    ],
    continuity_locks: {
      identity_locks: [
        'identity_anchor:sister_a_period_face_v1',
        'identity_anchor:sister_b_period_face_v1',
        'identity_lock:preserve_period_costume_silhouette',
      ],
      location_locks: [
        'location_lock:period-parlor',
        'walkable-zone:parlor-rug-zone',
      ],
      composition_locks: [
        'composition_lock:master-two-shot',
        'prop_anchor:writing_desk_letter',
        'prop_anchor:fireplace_practical',
      ],
    },
    director_grammar_refs: [...spec.director_grammar_refs],
    execution_flags: {
      design_only: true,
      gpu_execution: false,
      frame_extraction: false,
      external_call_allowed: false,
    },
    template_kind: 'design_template',
    built_at: new Date().toISOString(),
  };
}

export function loadSourceVideoFinalSetForCoordinates(projectRoot?: string): SourceVideoFinalSet | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

export function loadDirectorGrammarRegistry(projectRoot?: string) {
  return readJsonRecord(resolveProjectRoot(projectRoot), DIRECTOR_GRAMMAR_REGISTRY_PATH) as {
    grammar_profiles?: Array<{ grammar_id: string; source_family: string }>;
  } | null;
}

export function buildMovieSceneCoordinateTemplate(
  spec: (typeof SEED_COORDINATE_SPECS)[number]
): MovieSceneCoordinate {
  switch (spec.template_kind) {
    case 'kitchen_blocking':
      return buildGhibliKitchenTemplate(spec);
    case 'light_sky':
      return buildShinkaiLightSkyTemplate(spec);
    case 'dialogue_blocking':
      return buildLiveActionDialogueTemplate(spec);
    default:
      throw new Error(`Unknown template kind: ${spec.template_kind}`);
  }
}

export function buildSeedCoordinateTemplates(projectRoot?: string): MovieSceneCoordinate[] {
  const root = resolveProjectRoot(projectRoot);
  const finalSet = loadSourceVideoFinalSetForCoordinates(root);
  if (!finalSet) {
    throw new Error(`Missing final set: ${FINAL_SET_PATH}`);
  }

  const grammarRegistry = loadDirectorGrammarRegistry(root);
  if (!grammarRegistry?.grammar_profiles?.length) {
    throw new Error(`Missing director grammar registry: ${DIRECTOR_GRAMMAR_REGISTRY_PATH}`);
  }

  return SEED_COORDINATE_SPECS.map((spec) => {
    const video = finalSet.videos.find((v) => v.source_video_id === spec.source_video_id);
    if (!video?.file_present) {
      throw new Error(`Source video not present: ${spec.source_video_id}`);
    }
    for (const ref of spec.director_grammar_refs) {
      if (!grammarRegistry.grammar_profiles!.some((p) => p.grammar_id === ref)) {
        throw new Error(`Director grammar ref not found: ${ref}`);
      }
    }
    return buildMovieSceneCoordinateTemplate(spec);
  });
}

export function writeCoordinateTemplates(
  projectRoot: string,
  templates: MovieSceneCoordinate[],
  storageDir = 'datasets/movie_coordinate/templates'
): string[] {
  const root = resolveProjectRoot(projectRoot);
  const absDir = path.join(root, storageDir);
  fs.mkdirSync(absDir, { recursive: true });

  const written: string[] = [];
  for (const template of templates) {
    const rel = `${storageDir}/${template.coordinate_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(template, null, 2)}\n`, 'utf8');
    written.push(rel);
  }
  return written;
}
