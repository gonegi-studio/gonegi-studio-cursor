import fs from 'node:fs';
import path from 'node:path';
import { MovieSpatialGraph } from './movieSpatialGraphBuilder.js';
import { resolveCharacterId } from './movieCharacterDNALock.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GENERATION_CONTEXT_PHASE = 'PHASE-GENERATION-CONTEXT-001' as const;
export const GENERATION_CONTEXT_SYSTEM_ID = 'GENERATION_CONTEXT_V1' as const;

export const GENERATION_CONTEXT_DIR = 'datasets/generation_context' as const;
export const GENERATION_CONTEXT_MANIFEST_PATH =
  `${GENERATION_CONTEXT_DIR}/manifest/generation-context-manifest.json` as const;
export const CANONICAL_ARTSTYLE_PATH =
  `${GENERATION_CONTEXT_DIR}/artstyle/canonical-artstyle.txt` as const;
export const CANONICAL_CHARACTER_PROMPTS_PATH =
  `${GENERATION_CONTEXT_DIR}/character/canonical-character-prompts.json` as const;
export const CANONICAL_TIMESETTING_LIBRARY_PATH =
  `${GENERATION_CONTEXT_DIR}/timesetting/canonical-timesetting-library.json` as const;

export const GENERATION_CONTEXT_ARTSTYLE_REF = `${CANONICAL_ARTSTYLE_PATH}#canonical_artstyle` as const;
export const GENERATION_CONTEXT_CHARACTER_REF = `${CANONICAL_CHARACTER_PROMPTS_PATH}#character_prompt` as const;
export const GENERATION_CONTEXT_TIMESETTING_REF =
  `${CANONICAL_TIMESETTING_LIBRARY_PATH}#timesetting_block` as const;

export const COPY_ONLY_MODE = true as const;

export interface GenerationContextManifest {
  phase: typeof GENERATION_CONTEXT_PHASE;
  system_id: typeof GENERATION_CONTEXT_SYSTEM_ID;
  copy_only_mode: true;
  artstyle_source: string;
  character_source: string;
  timesetting_source: string;
  rules: {
    no_generation: true;
    no_rewriting: true;
    no_summarization: true;
    copy_only: true;
  };
}

export interface CanonicalCharacterPromptsFile {
  library_id: string;
  copy_only: true;
  prompts: Record<string, string>;
}

export interface CanonicalTimeSettingLibraryFile {
  library_id: string;
  copy_only: true;
  blocks: Record<string, string>;
}

function readText(root: string, rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8').trim();
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

export function loadGenerationContextManifest(root: string): GenerationContextManifest {
  return readJson<GenerationContextManifest>(root, GENERATION_CONTEXT_MANIFEST_PATH);
}

export function loadCanonicalCharacterPrompts(root: string): CanonicalCharacterPromptsFile {
  return readJson<CanonicalCharacterPromptsFile>(root, CANONICAL_CHARACTER_PROMPTS_PATH);
}

export function loadCanonicalTimeSettingLibrary(root: string): CanonicalTimeSettingLibraryFile {
  return readJson<CanonicalTimeSettingLibraryFile>(root, CANONICAL_TIMESETTING_LIBRARY_PATH);
}

export function copyCanonicalArtStyle(projectRoot?: string): string {
  const root = resolveProjectRoot(projectRoot);
  return readText(root, CANONICAL_ARTSTYLE_PATH);
}

export function copyCanonicalCharacterPrompt(
  characterId: string,
  projectRoot?: string
): string {
  const root = resolveProjectRoot(projectRoot);
  const library = loadCanonicalCharacterPrompts(root);
  const prompt = library.prompts[characterId];
  if (!prompt) {
    throw new Error(`Missing canonical character prompt for character_id=${characterId}`);
  }
  return prompt;
}

export function copyCanonicalCharacterField(
  characterIds: readonly string[],
  projectRoot?: string
): string {
  return characterIds
    .map((characterId) => copyCanonicalCharacterPrompt(characterId, projectRoot))
    .join(' || ');
}

export function copyCanonicalCharacterFieldFromGraph(
  graph: MovieSpatialGraph,
  projectRoot?: string
): string {
  const characterIds = graph.character_nodes.map((node) => resolveCharacterId(node.character_id));
  return copyCanonicalCharacterField(characterIds, projectRoot);
}

export function copyCanonicalTimeSetting(
  timeSettingId: string,
  projectRoot?: string
): string {
  const root = resolveProjectRoot(projectRoot);
  const library = loadCanonicalTimeSettingLibrary(root);
  const block = library.blocks[timeSettingId];
  if (!block) {
    throw new Error(`Missing canonical timesetting block for time_id=${timeSettingId}`);
  }
  return block;
}

export function generationContextCharacterRefs(characterIds: readonly string[]): string {
  return characterIds.map((id) => `${GENERATION_CONTEXT_CHARACTER_REF}=${id}`).join('|');
}

export function generationContextTimeSettingRef(timeSettingId: string): string {
  return `${GENERATION_CONTEXT_TIMESETTING_REF}=${timeSettingId}`;
}
