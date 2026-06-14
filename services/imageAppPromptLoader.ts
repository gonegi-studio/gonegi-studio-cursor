import fs from 'node:fs';
import path from 'node:path';
import { MovieSpatialGraph } from './movieSpatialGraphBuilder.js';
import { resolveCharacterId } from './movieCharacterDNALock.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const IMAGE_APP_PROMPT_PHASE = 'PHASE-GENERATION-CONTEXT-002' as const;
export const IMAGE_APP_PROMPT_SYSTEM_ID = 'CANONICAL_PROMPT_RESTORATION_V1' as const;

export const GENERATION_PROMPT_DIR = 'datasets/generation_context/prompts' as const;
export const GENERATION_PROMPT_MANIFEST_PATH =
  `${GENERATION_PROMPT_DIR}/generation-prompt-manifest.json` as const;
export const CANONICAL_ARTSTYLE_PROMPT_PATH =
  `${GENERATION_PROMPT_DIR}/canonical-artstyle-prompt.txt` as const;
export const CANONICAL_CHARACTER_PROMPTS_V2_PATH =
  `${GENERATION_PROMPT_DIR}/canonical-character-prompts-v2.json` as const;
export const CANONICAL_TIMESETTING_PROMPTS_PATH =
  `${GENERATION_PROMPT_DIR}/canonical-timesetting-prompts.json` as const;

export const IMAGE_APP_ARTSTYLE_PROMPT_REF =
  `${CANONICAL_ARTSTYLE_PROMPT_PATH}#artstyle_prompt` as const;
export const IMAGE_APP_CHARACTER_PROMPT_REF =
  `${CANONICAL_CHARACTER_PROMPTS_V2_PATH}#character_prompt` as const;
export const IMAGE_APP_TIMESETTING_PROMPT_REF =
  `${CANONICAL_TIMESETTING_PROMPTS_PATH}#timesetting_prompt` as const;

export const IMAGE_APP_PROMPT_COPY_ONLY_MODE = true as const;

export interface GenerationPromptManifest {
  phase: typeof IMAGE_APP_PROMPT_PHASE;
  system_id: typeof IMAGE_APP_PROMPT_SYSTEM_ID;
  copy_only_mode: true;
  artstyle_prompt_source: string;
  character_prompt_source: string;
  timesetting_prompt_source: string;
  rules: {
    no_ids: true;
    no_serialization: true;
    no_runtime_assembly: true;
    no_runtime_formatting: true;
    copy_only: true;
  };
}

export type CanonicalCharacterPromptsV2 = Record<string, string>;
export type CanonicalTimeSettingPrompts = Record<string, string>;

function readText(root: string, rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8').trim();
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

export function loadGenerationPromptManifest(root: string): GenerationPromptManifest {
  return readJson<GenerationPromptManifest>(root, GENERATION_PROMPT_MANIFEST_PATH);
}

export function loadCanonicalCharacterPromptsV2(root: string): CanonicalCharacterPromptsV2 {
  return readJson<CanonicalCharacterPromptsV2>(root, CANONICAL_CHARACTER_PROMPTS_V2_PATH);
}

export function loadCanonicalTimeSettingPrompts(root: string): CanonicalTimeSettingPrompts {
  return readJson<CanonicalTimeSettingPrompts>(root, CANONICAL_TIMESETTING_PROMPTS_PATH);
}

export function copyImageAppArtStylePrompt(projectRoot?: string): string {
  const root = resolveProjectRoot(projectRoot);
  return readText(root, CANONICAL_ARTSTYLE_PROMPT_PATH);
}

export function copyImageAppCharacterPrompt(
  characterId: string,
  projectRoot?: string
): string {
  const root = resolveProjectRoot(projectRoot);
  const prompts = loadCanonicalCharacterPromptsV2(root);
  const prompt = prompts[characterId];
  if (!prompt) {
    throw new Error(`Missing Image App character prompt for character_id=${characterId}`);
  }
  return prompt;
}

export function copyImageAppCharacterField(
  characterIds: readonly string[],
  projectRoot?: string
): string {
  return characterIds
    .map((characterId) => copyImageAppCharacterPrompt(characterId, projectRoot))
    .join(' || ');
}

export function copyImageAppCharacterFieldFromGraph(
  graph: MovieSpatialGraph,
  projectRoot?: string
): string {
  const characterIds = graph.character_nodes.map((node) => resolveCharacterId(node.character_id));
  return copyImageAppCharacterField(characterIds, projectRoot);
}

export function copyImageAppTimeSettingPrompt(
  timeSettingId: string,
  projectRoot?: string
): string {
  const root = resolveProjectRoot(projectRoot);
  const prompts = loadCanonicalTimeSettingPrompts(root);
  const prompt = prompts[timeSettingId];
  if (!prompt) {
    throw new Error(`Missing Image App timesetting prompt for time_id=${timeSettingId}`);
  }
  return prompt;
}

export function imageAppCharacterPromptRefs(characterIds: readonly string[]): string {
  return characterIds.map((id) => `${IMAGE_APP_CHARACTER_PROMPT_REF}=${id}`).join('|');
}

export function imageAppTimeSettingPromptRef(timeSettingId: string): string {
  return `${IMAGE_APP_TIMESETTING_PROMPT_REF}=${timeSettingId}`;
}

export function detectArtStyleIdOnly(artStyle: string): boolean {
  if (artStyle.includes('Hand-painted') || artStyle.includes('Studio Ghibli')) {
    return false;
  }
  return /^Ghibli Mediterranean Chronicles/.test(artStyle.trim());
}

export function detectCharacterDnaMarker(character: string): boolean {
  return character.includes('[CHARACTER_DNA]') || character.includes('character_id=');
}

export function detectMetadataFields(text: string): boolean {
  return /(?:^|\s)(character_id|time_id|location_id|lighting_id|weather_id|color_temperature|atmosphere)=/.test(
    text
  );
}

export function detectTimesettingMetadataFormat(timeSetting: string): boolean {
  return (
    timeSetting.includes('[TIME_SETTING]') ||
    timeSetting.includes('time_id=') ||
    timeSetting.includes('location_id=') ||
    timeSetting.includes('lighting_id=') ||
    timeSetting.includes('weather_id=')
  );
}
