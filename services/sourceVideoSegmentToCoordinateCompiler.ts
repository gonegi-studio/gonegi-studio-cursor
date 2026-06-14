import fs from 'node:fs';
import path from 'node:path';
import {
  SEGMENT_REGISTRY_PATH,
  type SourceVideoSceneSegment,
  loadSceneSegment,
} from './sourceVideoSceneSegmentBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const COORDINATE_COMPILER_PHASE =
  'PHASE-SOURCE-VIDEO-009-SOURCE_VIDEO_SEGMENT_TO_COORDINATE_COMPILER_V1' as const;
export const COORDINATE_SCHEMA_PATH =
  'datasets/source_video_coordinate/source-video-coordinate.schema.json' as const;
export const COORDINATE_REGISTRY_PATH =
  'datasets/source_video_coordinate/source-video-coordinate-registry.json' as const;
export const COORDINATE_RECORDS_DIR = 'datasets/source_video_coordinate/records' as const;
export const MOVIE_COORDINATE_TEMPLATE_DIR = 'datasets/movie_coordinate/templates' as const;

export const SEED_COORDINATE_SPECS = Object.freeze([
  {
    coordinate_record_id: 'coord_ghibli_kitchen_001_v1',
    segment_id: 'segment_ghibli_kitchen_001_v1',
  },
  {
    coordinate_record_id: 'coord_shinkai_sky_light_001_v1',
    segment_id: 'segment_shinkai_sky_light_001_v1',
  },
  {
    coordinate_record_id: 'coord_live_action_dialogue_001_v1',
    segment_id: 'segment_live_action_dialogue_001_v1',
  },
  {
    coordinate_record_id: 'coord_mori_emotion_flow_001_v1',
    segment_id: 'segment_mori_emotion_flow_001_v1',
  },
] as const);

type MovieCoordinateTemplate = {
  camera_coordinate: {
    position: string;
    facing: string;
    height: string;
    fov_hint?: string;
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
  director_grammar_refs?: string[];
};

export type CoordinateExecutionFlags = {
  design_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  frame_extraction: false;
  ocr: false;
  generation: false;
};

export type SourceVideoCoordinateRecord = {
  coordinate_record_id: string;
  phase: typeof COORDINATE_COMPILER_PHASE;
  segment_id: string;
  source_video_id: string;
  director_family: SourceVideoSceneSegment['director_family'];
  camera_coordinate: {
    position: string;
    facing: string;
    height: string;
    fov_hint?: string;
    shot_type: string;
    context_summary: string;
    context_tokens: string[];
  };
  character_coordinate: MovieCoordinateTemplate['character_coordinates'];
  prop_coordinate: MovieCoordinateTemplate['prop_coordinates'];
  location_coordinate: MovieCoordinateTemplate['location_coordinates'] & {
    context_summary: string;
    context_tokens: string[];
  };
  lighting_coordinate: MovieCoordinateTemplate['lighting_coordinates'] & {
    context_summary: string;
    context_tokens: string[];
  };
  motion_coordinate: MovieCoordinateTemplate['motion_vectors'];
  blocking_coordinate: MovieCoordinateTemplate['blocking_map'] & {
    context_summary: string;
    context_tokens: string[];
  };
  depth_coordinate: MovieCoordinateTemplate['depth_layers'];
  continuity_locks: MovieCoordinateTemplate['continuity_locks'];
  grammar_refs: string[];
  scene_state_mapping_ref: string | null;
  source_template_ref: string | null;
  execution_flags: CoordinateExecutionFlags;
  compiled_at: string;
};

const EXECUTION_FLAGS: CoordinateExecutionFlags = {
  design_only: true,
  gpu_execution: false,
  external_call_allowed: false,
  frame_extraction: false,
  ocr: false,
  generation: false,
};

function loadMovieTemplate(projectRoot: string, templateId: string): MovieCoordinateTemplate | null {
  const abs = path.join(projectRoot, MOVIE_COORDINATE_TEMPLATE_DIR, `${templateId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieCoordinateTemplate;
}

function compileFromTemplate(
  spec: (typeof SEED_COORDINATE_SPECS)[number],
  segment: SourceVideoSceneSegment,
  template: MovieCoordinateTemplate
): SourceVideoCoordinateRecord {
  return {
    coordinate_record_id: spec.coordinate_record_id,
    phase: COORDINATE_COMPILER_PHASE,
    segment_id: segment.segment_id,
    source_video_id: segment.source_video_id,
    director_family: segment.director_family,
    camera_coordinate: {
      ...template.camera_coordinate,
      context_summary: segment.camera_context.summary,
      context_tokens: [...segment.camera_context.tokens],
    },
    character_coordinate: template.character_coordinates.map((c) => ({ ...c })),
    prop_coordinate: template.prop_coordinates.map((p) => ({ ...p })),
    location_coordinate: {
      ...template.location_coordinates,
      context_summary: segment.location_context.summary,
      context_tokens: [...segment.location_context.tokens],
    },
    lighting_coordinate: {
      ...template.lighting_coordinates,
      context_summary: segment.lighting_context.summary,
      context_tokens: [...segment.lighting_context.tokens],
    },
    motion_coordinate: template.motion_vectors.map((m) => ({ ...m })),
    blocking_coordinate: {
      ...template.blocking_map,
      context_summary: segment.character_context.summary,
      context_tokens: [...segment.character_context.tokens],
    },
    depth_coordinate: template.depth_layers.map((d) => ({ ...d })),
    continuity_locks: {
      identity_locks: [...template.continuity_locks.identity_locks],
      location_locks: [...template.continuity_locks.location_locks],
      composition_locks: [...template.continuity_locks.composition_locks],
    },
    grammar_refs: [
      segment.director_grammar_ref,
      ...(template.director_grammar_refs ?? []).filter((r) => r !== segment.director_grammar_ref),
    ],
    scene_state_mapping_ref: segment.scene_state_mapping_ref,
    source_template_ref: segment.coordinate_template_ref,
    execution_flags: { ...EXECUTION_FLAGS },
    compiled_at: new Date().toISOString(),
  };
}

function compileMoriFromSegment(
  spec: (typeof SEED_COORDINATE_SPECS)[number],
  segment: SourceVideoSceneSegment
): SourceVideoCoordinateRecord {
  return {
    coordinate_record_id: spec.coordinate_record_id,
    phase: COORDINATE_COMPILER_PHASE,
    segment_id: segment.segment_id,
    source_video_id: segment.source_video_id,
    director_family: segment.director_family,
    camera_coordinate: {
      position: 'forest-path-mid',
      facing: 'trail-ahead',
      height: 'human-scale-eye',
      fov_hint: 'path-following-wide',
      shot_type: 'forest-path-wide',
      context_summary: segment.camera_context.summary,
      context_tokens: [...segment.camera_context.tokens],
    },
    character_coordinate: [
      {
        character_ref: 'walker_companion',
        position: 'path-center-left',
        facing: 'trail-ahead',
        posture: 'walking-contemplative',
        identity_anchor: 'identity_anchor:walker_companion_mori_v1',
      },
    ],
    prop_coordinate: [
      {
        prop_id: 'forage_basket',
        position: 'hand-carry-foreground',
        interaction_state: 'carry-steady',
      },
    ],
    location_coordinate: {
      space_type: 'woodland-path',
      anchor_point: 'trail-bend',
      walkable_zone: 'forest-trail-dirt',
      context_summary: segment.location_context.summary,
      context_tokens: [...segment.location_context.tokens],
    },
    lighting_coordinate: {
      key_direction: 'canopy-dappled-overhead',
      fill_level: 'forest-floor-bounce',
      color_temperature: 'soft-day-green-gold',
      context_summary: segment.lighting_context.summary,
      context_tokens: [...segment.lighting_context.tokens],
    },
    motion_coordinate: [
      {
        subject_ref: 'walker_companion',
        vector: 'path-walk-steady',
        duration_hint: 'daily-life-pace',
      },
      {
        subject_ref: 'canopy_foliage',
        vector: 'gentle-sway',
        duration_hint: 'ambient-continuous',
      },
    ],
    blocking_coordinate: {
      primary_focus: 'walker-path-relationship',
      secondary_focus: 'forage-carry-gesture',
      negative_space: 'forest-depth-right',
      context_summary: segment.emotion_context.summary,
      context_tokens: [...segment.emotion_context.tokens],
    },
    depth_coordinate: [
      {
        layer_index: 0,
        layer_role: 'foreground',
        content_hint: 'path-texture-forage-basket',
      },
      {
        layer_index: 1,
        layer_role: 'midground',
        content_hint: 'walker-companion-figure',
      },
      {
        layer_index: 2,
        layer_role: 'background',
        content_hint: 'woodland-canopy-depth',
      },
    ],
    continuity_locks: {
      identity_locks: [
        'identity_anchor:walker_companion_mori_v1',
        'identity_lock:preserve_face_geometry',
        'identity_lock:preserve_woodland_costume_silhouette',
      ],
      location_locks: [
        'location_lock:woodland-path',
        'walkable-zone:forest-trail-dirt',
      ],
      composition_locks: [
        'composition_lock:path-leading-line',
        'prop_anchor:forage_basket',
      ],
    },
    grammar_refs: [segment.director_grammar_ref],
    scene_state_mapping_ref: segment.scene_state_mapping_ref,
    source_template_ref: null,
    execution_flags: { ...EXECUTION_FLAGS },
    compiled_at: new Date().toISOString(),
  };
}

export function compileCoordinateRecord(
  projectRoot: string,
  spec: (typeof SEED_COORDINATE_SPECS)[number]
): SourceVideoCoordinateRecord {
  const segment = loadSceneSegment(projectRoot, spec.segment_id);
  if (!segment) {
    throw new Error(`Missing segment: ${spec.segment_id}`);
  }

  if (segment.coordinate_template_ref) {
    const template = loadMovieTemplate(projectRoot, segment.coordinate_template_ref);
    if (!template) {
      throw new Error(`Missing movie coordinate template: ${segment.coordinate_template_ref}`);
    }
    return compileFromTemplate(spec, segment, template);
  }

  return compileMoriFromSegment(spec, segment);
}

export function compileAllCoordinateRecords(projectRoot?: string): SourceVideoCoordinateRecord[] {
  const root = resolveProjectRoot(projectRoot);

  if (!fs.existsSync(path.join(root, SEGMENT_REGISTRY_PATH))) {
    throw new Error(`Missing segment registry: ${SEGMENT_REGISTRY_PATH}`);
  }

  return SEED_COORDINATE_SPECS.map((spec) => compileCoordinateRecord(root, spec));
}

export function writeCoordinateRecords(projectRoot?: string): {
  records: SourceVideoCoordinateRecord[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const records = compileAllCoordinateRecords(root);
  const outDir = path.join(root, COORDINATE_RECORDS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const record of records) {
    const rel = `${COORDINATE_RECORDS_DIR}/${record.coordinate_record_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  return { records, written };
}

export function loadCoordinateRecord(
  projectRoot: string,
  coordinateRecordId: string
): SourceVideoCoordinateRecord | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, COORDINATE_RECORDS_DIR, `${coordinateRecordId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoCoordinateRecord;
}
