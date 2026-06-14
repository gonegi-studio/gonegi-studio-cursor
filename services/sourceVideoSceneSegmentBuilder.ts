import fs from 'node:fs';
import path from 'node:path';
import { loadDirectorGrammarProfile } from './directorGrammarBlendBuilder.js';
import {
  DIRECTOR_GRAMMAR_REGISTRY_PATH,
  type DirectorGrammarProfile,
  type ExtractableFamily,
} from './directorGrammarExtractor.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import {
  VIDEO_STATE_DEFAULTS_ID,
  VIDEO_STATE_DEFAULTS_PATH,
  loadVideoStateDefaults,
} from './sourceVideoGrammarToVideoStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SEGMENT_PHASE =
  'PHASE-SOURCE-VIDEO-008-SOURCE_VIDEO_SCENE_SEGMENT_SCHEMA_V1' as const;
export const SEGMENT_SCHEMA_PATH =
  'datasets/source_video_segments/source-video-scene-segment.schema.json' as const;
export const SEGMENT_REGISTRY_PATH =
  'datasets/source_video_segments/source-video-scene-segment-registry.json' as const;
export const SEGMENTS_DIR = 'datasets/source_video_segments/segments' as const;

export type ContextBlock = {
  summary: string;
  tokens: string[];
};

export type SegmentExecutionFlags = {
  design_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  frame_extraction: false;
  ocr: false;
  generation: false;
};

export type DominantGrammar =
  | 'visual_style'
  | 'camera_grammar'
  | 'lighting_grammar'
  | 'blocking_grammar'
  | 'emotion_grammar'
  | 'motion_grammar'
  | 'environment_grammar';

export type SourceVideoSceneSegment = {
  segment_id: string;
  phase: typeof SEGMENT_PHASE;
  source_video_id: string;
  segment_index: number;
  timestamp_start: number;
  timestamp_end: number;
  duration_seconds: number;
  segment_type: 'kitchen_blocking' | 'light_sky' | 'dialogue_blocking' | 'emotion_flow';
  director_family: ExtractableFamily;
  dominant_grammar: DominantGrammar;
  location_context: ContextBlock;
  character_context: ContextBlock;
  camera_context: ContextBlock;
  lighting_context: ContextBlock;
  motion_context: ContextBlock;
  emotion_context: ContextBlock;
  transition_in: string;
  transition_out: string;
  coordinate_template_ref: string | null;
  scene_state_mapping_ref: string | null;
  video_state_defaults_ref: typeof VIDEO_STATE_DEFAULTS_ID;
  director_grammar_ref: string;
  execution_flags: SegmentExecutionFlags;
  built_at: string;
};

export const SEED_SEGMENT_SPECS = Object.freeze([
  {
    segment_id: 'segment_ghibli_kitchen_001_v1',
    source_video_id: 'GHIBLI_01',
    segment_index: 1,
    timestamp_start: 48.0,
    timestamp_end: 72.0,
    segment_type: 'kitchen_blocking' as const,
    director_family: 'GHIBLI' as const,
    dominant_grammar: 'blocking_grammar' as const,
    coordinate_template_ref: 'movie_coord_ghibli_kitchen_blocking_v1',
    scene_state_mapping_ref: 'map_ghibli_kitchen_to_scene_state_v1',
    transition_in: 'establishing_hold',
    transition_out: 'gentle_cut',
    location_summary: 'Domestic kitchen with hearth-centered blocking geometry',
    character_summary: 'Two-character counter-and-hearth ensemble',
    camera_summary: 'Eye-level two-shot medium with patient observational framing',
    lighting_summary: 'Morning-window wash with warm interior practicals',
    motion_summary: 'Task-detail close-ups and tracking-walk with deep focus',
    emotion_summary: 'Warmth-through-routine with calm domestic intimacy',
  },
  {
    segment_id: 'segment_shinkai_sky_light_001_v1',
    source_video_id: 'SHINKAI_01',
    segment_index: 1,
    timestamp_start: 12.0,
    timestamp_end: 38.0,
    segment_type: 'light_sky' as const,
    director_family: 'SHINKAI' as const,
    dominant_grammar: 'lighting_grammar' as const,
    coordinate_template_ref: 'movie_coord_shinkai_light_sky_v1',
    scene_state_mapping_ref: 'map_shinkai_light_sky_to_scene_state_v1',
    transition_in: 'sky_dominant_fade_in',
    transition_out: 'horizon_hold_dissolve',
    location_summary: 'Elevated overlook with sky-dominant horizon geometry',
    character_summary: 'Solitary contemplative figure at rail or window',
    camera_summary: 'Sky-dominant establishing with slow-push on revelation',
    lighting_summary: 'Sunset-gradient backlight and cloud-break god-rays',
    motion_summary: 'Rail-and-window framing with tele-compressed depth',
    emotion_summary: 'Longing expressed through horizon gaze and light shift',
  },
  {
    segment_id: 'segment_live_action_dialogue_001_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    segment_index: 1,
    timestamp_start: 95.0,
    timestamp_end: 128.0,
    segment_type: 'dialogue_blocking' as const,
    director_family: 'LIVE_ACTION' as const,
    dominant_grammar: 'blocking_grammar' as const,
    coordinate_template_ref: 'movie_coord_live_action_dialogue_blocking_v1',
    scene_state_mapping_ref: 'map_live_action_dialogue_to_scene_state_v1',
    transition_in: 'scene_entry_cut',
    transition_out: 'dialogue_beat_hold',
    location_summary: 'Interior social space with hearth or table ensemble',
    character_summary: 'Family ensemble with relationship-implied staging',
    camera_summary: 'Eye-level dialogue pairs with motivated reframes',
    lighting_summary: 'Practical interior warmth with soft shadow rolloff',
    motion_summary: 'Minimal performance beats preserving blocking geometry',
    emotion_summary: 'Subtext-over-dialogue emotional carry',
  },
  {
    segment_id: 'segment_mori_emotion_flow_001_v1',
    source_video_id: 'MORI_01',
    segment_index: 1,
    timestamp_start: 20.0,
    timestamp_end: 45.0,
    segment_type: 'emotion_flow' as const,
    director_family: 'MORI' as const,
    dominant_grammar: 'emotion_grammar' as const,
    coordinate_template_ref: null,
    scene_state_mapping_ref: null,
    transition_in: 'path_walk_entry',
    transition_out: 'rain_shelter_hold',
    location_summary: 'Woodland path with village-earth-tone surroundings',
    character_summary: 'Companion walk with craft-life daily motion',
    camera_summary: 'Grounded nature framing with path-following movement',
    lighting_summary: 'Canopy-dappled daylight with rain-soft diffusion option',
    motion_summary: 'Foraging-motion and bridge-cross daily-life movement',
    emotion_summary: 'Quiet emotional flow through gesture and environmental reaction',
  },
] as const);

const EXECUTION_FLAGS: SegmentExecutionFlags = {
  design_only: true,
  gpu_execution: false,
  external_call_allowed: false,
  frame_extraction: false,
  ocr: false,
  generation: false,
};

type DirectorGrammarRegistry = {
  grammar_profiles: Array<{
    grammar_id: string;
    source_family: ExtractableFamily;
    profile_path: string;
  }>;
};

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function loadGrammarRegistry(projectRoot: string): DirectorGrammarRegistry | null {
  const abs = path.join(projectRoot, DIRECTOR_GRAMMAR_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as DirectorGrammarRegistry;
}

function grammarIdForFamily(
  registry: DirectorGrammarRegistry,
  family: ExtractableFamily
): string | null {
  const entry = registry.grammar_profiles.find((p) => p.source_family === family);
  return entry?.grammar_id ?? null;
}

function contextFromGrammar(
  grammar: DirectorGrammarProfile,
  dominant: DominantGrammar,
  summaryOverride: string,
  tokenKeys: DominantGrammar[]
): ContextBlock {
  const tokens: string[] = [];
  for (const key of tokenKeys) {
    const block = grammar[key];
    if (block?.patterns?.length) {
      tokens.push(...block.patterns.slice(0, 2));
    }
  }
  const dominantBlock = grammar[dominant];
  if (dominantBlock?.patterns?.length) {
    for (const p of dominantBlock.patterns.slice(0, 3)) {
      if (!tokens.includes(p)) tokens.push(p);
    }
  }
  return {
    summary: summaryOverride,
    tokens: tokens.length ? tokens.slice(0, 5) : [summaryOverride],
  };
}

function buildSegment(
  spec: (typeof SEED_SEGMENT_SPECS)[number],
  grammar: DirectorGrammarProfile,
  grammarRef: string
): SourceVideoSceneSegment {
  const duration = Math.round((spec.timestamp_end - spec.timestamp_start) * 100) / 100;

  return {
    segment_id: spec.segment_id,
    phase: SEGMENT_PHASE,
    source_video_id: spec.source_video_id,
    segment_index: spec.segment_index,
    timestamp_start: spec.timestamp_start,
    timestamp_end: spec.timestamp_end,
    duration_seconds: duration,
    segment_type: spec.segment_type,
    director_family: spec.director_family,
    dominant_grammar: spec.dominant_grammar,
    location_context: contextFromGrammar(grammar, spec.dominant_grammar, spec.location_summary, [
      'environment_grammar',
      'blocking_grammar',
    ]),
    character_context: contextFromGrammar(grammar, spec.dominant_grammar, spec.character_summary, [
      'blocking_grammar',
      'emotion_grammar',
    ]),
    camera_context: contextFromGrammar(grammar, spec.dominant_grammar, spec.camera_summary, [
      'camera_grammar',
    ]),
    lighting_context: contextFromGrammar(grammar, spec.dominant_grammar, spec.lighting_summary, [
      'lighting_grammar',
    ]),
    motion_context: contextFromGrammar(grammar, spec.dominant_grammar, spec.motion_summary, [
      'motion_grammar',
    ]),
    emotion_context: contextFromGrammar(grammar, spec.dominant_grammar, spec.emotion_summary, [
      'emotion_grammar',
    ]),
    transition_in: spec.transition_in,
    transition_out: spec.transition_out,
    coordinate_template_ref: spec.coordinate_template_ref,
    scene_state_mapping_ref: spec.scene_state_mapping_ref,
    video_state_defaults_ref: VIDEO_STATE_DEFAULTS_ID,
    director_grammar_ref: grammarRef,
    execution_flags: { ...EXECUTION_FLAGS },
    built_at: new Date().toISOString(),
  };
}

export function buildSeedSceneSegments(projectRoot?: string): SourceVideoSceneSegment[] {
  const root = resolveProjectRoot(projectRoot);
  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    throw new Error(`Missing final set: ${FINAL_SET_PATH}`);
  }

  const grammarRegistry = loadGrammarRegistry(root);
  if (!grammarRegistry) {
    throw new Error(`Missing grammar registry: ${DIRECTOR_GRAMMAR_REGISTRY_PATH}`);
  }

  const defaults = loadVideoStateDefaults(root);
  if (!defaults) {
    throw new Error(`Missing video state defaults: ${VIDEO_STATE_DEFAULTS_PATH}`);
  }

  const segments: SourceVideoSceneSegment[] = [];

  for (const spec of SEED_SEGMENT_SPECS) {
    const video = finalSet.videos.find((v) => v.source_video_id === spec.source_video_id);
    if (!video || video.tier !== 'active') {
      throw new Error(`Source video not active in final set: ${spec.source_video_id}`);
    }

    const grammarRef = grammarIdForFamily(grammarRegistry, spec.director_family);
    if (!grammarRef) {
      throw new Error(`No grammar profile for family: ${spec.director_family}`);
    }

    const grammar = loadDirectorGrammarProfile(root, spec.director_family);
    if (!grammar) {
      throw new Error(`Missing grammar profile for family: ${spec.director_family}`);
    }

    segments.push(buildSegment(spec, grammar, grammarRef));
  }

  return segments;
}

export function writeSceneSegments(projectRoot?: string): {
  segments: SourceVideoSceneSegment[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const segments = buildSeedSceneSegments(root);
  const outDir = path.join(root, SEGMENTS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const segment of segments) {
    const rel = `${SEGMENTS_DIR}/${segment.segment_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(segment, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  return { segments, written };
}

export function loadSceneSegment(
  projectRoot: string,
  segmentId: string
): SourceVideoSceneSegment | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, SEGMENTS_DIR, `${segmentId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoSceneSegment;
}
