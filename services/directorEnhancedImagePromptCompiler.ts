import { getImageActingCameraById } from './imageActingCameraGrammarDefinitions.js';
import {
  DIRECTOR_GRAMMAR_VERSION,
  getDirectorGrammarByStoryboardId,
  getDirectorGrammarSeedLibrary,
  type DirectorGrammarEntry,
} from './directorGrammarDefinitions.js';
import {
  buildImageAppPayloads,
  type ImageAppScenePayload,
} from './imageAppInputExport.js';
import {
  buildStoryDrivenImageAppExport,
  STORY_DRIVEN_IMAGE_APP_EXPORT_ID,
  STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH,
  STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT,
  type StoryDrivenImageGenerationPayload,
} from './storyDrivenImageAppExport.js';

export const DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_VERSION =
  'DIRECTOR-ENHANCED-IMAGE-PROMPT-COMPILER-PHASE-100-v1' as const;
export const DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_ID = 'DEIPC-song_master_01' as const;
export const DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_JSON_PATH =
  'exports/director-enhanced-image-prompt-compiler.json' as const;
export const DIRECTOR_GRAMMAR_REPORT_PATH = 'exports/director-grammar-report.json' as const;

export const REQUIRED_COMPILER_EXPORT_FIELDS = [
  'export_id',
  'source_export_id',
  'director_grammar_source',
  'scene_count',
  'compiled_payloads',
  'image_app_ready',
] as const;

export type RequiredCompilerExportField = (typeof REQUIRED_COMPILER_EXPORT_FIELDS)[number];

export const REQUIRED_COMPILED_PAYLOAD_FIELDS = [
  'payload_id',
  'storyboard_id',
  'bundle_id',
  'scene_order',
  'compiled_image_prompt',
  'compiled_negative_prompt',
  'continuity_anchors',
  'is_ready_for_generation',
] as const;

export type RequiredCompiledPayloadField = (typeof REQUIRED_COMPILED_PAYLOAD_FIELDS)[number];

export interface CompiledContinuityAnchors {
  character: string[];
  location: string[];
  world: string[];
}

export interface CompiledImagePromptPayload {
  payload_id: string;
  storyboard_id: string;
  bundle_id: string;
  scene_order: number;
  compiled_image_prompt: string;
  compiled_negative_prompt: string;
  continuity_anchors: CompiledContinuityAnchors;
  is_ready_for_generation: boolean;
}

export interface DirectorEnhancedImagePromptCompilerExport {
  export_id: typeof DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_ID;
  source_export_id: typeof STORY_DRIVEN_IMAGE_APP_EXPORT_ID;
  director_grammar_source: typeof DIRECTOR_GRAMMAR_VERSION;
  scene_count: typeof STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT;
  compiled_payloads: CompiledImagePromptPayload[];
  image_app_ready: boolean;
}

const STANDARD_NEGATIVE_GUARDS = [
  'no front-facing idle pose',
  'no camera-staring portrait',
  'no generic modern setting',
  'no world DNA violation',
] as const;

function formatAvoidRules(rules: readonly string[]): string {
  return rules.map((rule) => `avoid: ${rule}`).join(', ');
}

function mergeUniqueSegments(segments: readonly string[]): string {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    merged.push(trimmed);
  }
  return merged.join(' ');
}

function compileImagePrompt(
  storyPayload: StoryDrivenImageGenerationPayload,
  imagePayload: ImageAppScenePayload,
  director: DirectorGrammarEntry
): string {
  return mergeUniqueSegments([
    storyPayload.image_prompt,
    `Acting intent: ${imagePayload.acting_intent}.`,
    `Body: ${imagePayload.body_action}. Hand: ${imagePayload.hand_action}.`,
    `Gaze: ${imagePayload.gaze_direction}. Posture: ${imagePayload.posture_variation}.`,
    `Director camera (priority): ${director.camera_reason}`,
    `Director blocking (priority): ${director.blocking_reason}`,
    `Directorial intent: ${director.directorial_intent}`,
    `Emotional subtext: ${director.emotional_subtext}`,
    `Cut purpose: ${director.cut_purpose}`,
    `Pacing: ${director.silence_or_action}`,
    `Visual motifs: ${director.visual_motif_usage.join(', ')}.`,
  ]);
}

function compileNegativePrompt(
  storyPayload: StoryDrivenImageGenerationPayload,
  director: DirectorGrammarEntry,
  actingCameraId: string
): string {
  const acting = getImageActingCameraById(actingCameraId);
  const antiStatic = acting?.anti_static_pose_rules ?? [];
  const antiFlat = director.anti_flat_scene_rules;

  return mergeUniqueSegments([
    storyPayload.negative_prompt,
    formatAvoidRules(antiStatic),
    formatAvoidRules(antiFlat),
    formatAvoidRules(STANDARD_NEGATIVE_GUARDS),
  ]);
}

function buildCompiledPayload(
  storyPayload: StoryDrivenImageGenerationPayload,
  imagePayload: ImageAppScenePayload,
  director: DirectorGrammarEntry
): CompiledImagePromptPayload {
  return {
    payload_id: `CEIP-${storyPayload.storyboard_id}`,
    storyboard_id: storyPayload.storyboard_id,
    bundle_id: storyPayload.bundle_id,
    scene_order: imagePayload.scene_order,
    compiled_image_prompt: compileImagePrompt(storyPayload, imagePayload, director),
    compiled_negative_prompt: compileNegativePrompt(
      storyPayload,
      director,
      storyPayload.acting_camera_id
    ),
    continuity_anchors: {
      character: [...storyPayload.character_continuity_anchors],
      location: [...storyPayload.location_continuity_anchors],
      world: [...storyPayload.world_continuity_anchors],
    },
    is_ready_for_generation: true,
  };
}

function buildCompiledPayloadsFromSources(
  storyExport: ReturnType<typeof buildStoryDrivenImageAppExport>,
  directorByStoryboard: ReadonlyMap<string, DirectorGrammarEntry>,
  imagePayloadByStoryboard: ReadonlyMap<string, ImageAppScenePayload>
): CompiledImagePromptPayload[] {
  return storyExport.image_generation_payloads
    .map((storyPayload) => {
      const imagePayload = imagePayloadByStoryboard.get(storyPayload.storyboard_id);
      const director = directorByStoryboard.get(storyPayload.storyboard_id);

      if (!imagePayload) {
        throw new Error(`Missing image app payload for ${storyPayload.storyboard_id}`);
      }
      if (!director) {
        throw new Error(`Missing director grammar for ${storyPayload.storyboard_id}`);
      }

      return buildCompiledPayload(storyPayload, imagePayload, director);
    })
    .sort((left, right) => left.scene_order - right.scene_order)
    .map((payload) => ({
      ...payload,
      continuity_anchors: {
        character: [...payload.continuity_anchors.character],
        location: [...payload.continuity_anchors.location],
        world: [...payload.continuity_anchors.world],
      },
    }));
}

export function buildCompiledImagePromptPayloads(): CompiledImagePromptPayload[] {
  const storyExport = buildStoryDrivenImageAppExport();
  const directorByStoryboard = new Map(
    getDirectorGrammarSeedLibrary().map((entry) => [entry.storyboard_id, entry] as const)
  );
  const imagePayloadByStoryboard = new Map(
    buildImageAppPayloads().map((payload) => [payload.storyboard_id, payload] as const)
  );
  return buildCompiledPayloadsFromSources(
    storyExport,
    directorByStoryboard,
    imagePayloadByStoryboard
  );
}

export function buildDirectorEnhancedImagePromptCompilerExport(): DirectorEnhancedImagePromptCompilerExport {
  const storyExport = buildStoryDrivenImageAppExport();
  const directorEntries = getDirectorGrammarSeedLibrary();
  const directorByStoryboard = new Map(
    directorEntries.map((entry) => [entry.storyboard_id, entry] as const)
  );
  const imagePayloadByStoryboard = new Map(
    buildImageAppPayloads().map((payload) => [payload.storyboard_id, payload] as const)
  );
  const compiledPayloads = buildCompiledPayloadsFromSources(
    storyExport,
    directorByStoryboard,
    imagePayloadByStoryboard
  );

  const ready =
    storyExport.story_engine_ready &&
    directorEntries.length === STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT &&
    compiledPayloads.length === STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT &&
    compiledPayloads.every((payload) => payload.is_ready_for_generation);

  return {
    export_id: DIRECTOR_ENHANCED_IMAGE_PROMPT_COMPILER_ID,
    source_export_id: STORY_DRIVEN_IMAGE_APP_EXPORT_ID,
    director_grammar_source: DIRECTOR_GRAMMAR_VERSION,
    scene_count: STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT,
    compiled_payloads: compiledPayloads,
    image_app_ready: ready,
  };
}

export function findDuplicateCompiledPayloadIds(payloadIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of payloadIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates].sort();
}

export function getCompiledPayloadByStoryboardId(
  storyboardId: string
): CompiledImagePromptPayload | undefined {
  return buildCompiledImagePromptPayloads().find(
    (payload) => payload.storyboard_id === storyboardId
  );
}

export { STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH };
