import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';

export { isForbiddenLegacySourceRef } from './forbiddenLegacySourcePaths.js';

export const FINAL_SOURCE_LOCK_PHASE = 'PHASE-GENERATION-CONTEXT-008' as const;
export const FINAL_SOURCE_LOCK_SYSTEM_ID = 'FINAL_SOURCE_LOCK_V1' as const;

export const APPROVED_ORIGINALS_PHASE = FINAL_SOURCE_LOCK_PHASE;
export const APPROVED_ORIGINALS_SYSTEM_ID = FINAL_SOURCE_LOCK_SYSTEM_ID;

export const APPROVED_ORIGINALS_DIR = 'datasets/generation_context/approved_originals' as const;
export const APPROVED_ORIGINALS_MANIFEST_PATH =
  `${APPROVED_ORIGINALS_DIR}/APPROVED_ORIGINALS_MANIFEST.json` as const;
export const ARTSTYLE_APPROVED_PATH = `${APPROVED_ORIGINALS_DIR}/artstyle-approved.txt` as const;
export const CHARACTER_APPROVED_PATH = `${APPROVED_ORIGINALS_DIR}/character-approved.txt` as const;
export const TIMESETTING_APPROVED_PATH = `${APPROVED_ORIGINALS_DIR}/timesetting-approved.json` as const;

export const APPROVED_ORIGINALS_ARTSTYLE_REF =
  `${ARTSTYLE_APPROVED_PATH}#artstyle_approved` as const;
export const APPROVED_ORIGINALS_CHARACTER_REF =
  `${CHARACTER_APPROVED_PATH}#character_approved` as const;
export const APPROVED_ORIGINALS_TIMESETTING_REF =
  `${TIMESETTING_APPROVED_PATH}#timesetting_approved` as const;

export const REQUIRED_APPROVED_ORIGINAL_PATHS = [
  APPROVED_ORIGINALS_MANIFEST_PATH,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  TIMESETTING_APPROVED_PATH,
] as const;

export const REQUIRED_APPROVED_CHARACTER_IDS = [
  'gonegi',
  'dana',
  'bardo',
  'mare',
  'elio',
  'serena',
  'kael',
  'zephyro',
  'charon',
  'pietro',
  'enzo',
  'aengdu',
  'gamja',
] as const;

export interface ApprovedOriginalsManifest {
  source_locked: true;
  cursor_modification_allowed: false;
  cursor_regeneration_allowed: false;
  artstyle_source: 'USER_MANAGED';
  character_source: 'USER_MANAGED';
  timesetting_source: 'USER_MANAGED';
}

function readRawText(root: string, rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

export function loadApprovedOriginalsManifest(root: string): ApprovedOriginalsManifest {
  return readJson<ApprovedOriginalsManifest>(root, APPROVED_ORIGINALS_MANIFEST_PATH);
}

export function extractApprovedCharacterId(block: string): string {
  const match = block.trim().match(/^([A-Za-z]+)/);
  if (!match) {
    throw new Error(`Invalid character-approved block: ${block.slice(0, 40)}`);
  }
  const raw = match[1].toLowerCase();
  if (raw === 'goneg') {
    return 'gonegi';
  }
  return raw;
}

export function parseCharacterApprovedText(content: string): Record<string, string> {
  const normalized = content.replace(/\r\n/g, '\n').trim();
  const blocks = normalized.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const prompts: Record<string, string> = {};

  for (const block of blocks) {
    const characterId = extractApprovedCharacterId(block);
    prompts[characterId] = block.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return prompts;
}

export function loadApprovedOriginalCharacterPrompts(root: string): Record<string, string> {
  return parseCharacterApprovedText(readRawText(root, CHARACTER_APPROVED_PATH));
}

let cachedTimeSettingPrompts: Record<string, string> | null = null;

export function loadApprovedOriginalTimeSettingPrompts(root: string): Record<string, string> {
  if (cachedTimeSettingPrompts) {
    return cachedTimeSettingPrompts;
  }

  const prompts = readJson<Record<string, string>>(root, TIMESETTING_APPROVED_PATH);
  cachedTimeSettingPrompts = prompts;
  return prompts;
}

export function copyApprovedOriginalArtStyle(projectRoot?: string): string {
  const root = resolveProjectRoot(projectRoot);
  return readRawText(root, ARTSTYLE_APPROVED_PATH);
}

export function copyApprovedOriginalCharacterPrompt(
  characterId: string,
  projectRoot?: string
): string {
  const root = resolveProjectRoot(projectRoot);
  const prompts = loadApprovedOriginalCharacterPrompts(root);
  const prompt = prompts[characterId];
  if (!prompt) {
    throw new Error(`Missing approved original character prompt for character_id=${characterId}`);
  }
  return prompt;
}

export function copyApprovedOriginalCharacterField(
  characterIds: readonly string[],
  projectRoot?: string
): string {
  return characterIds
    .map((characterId) => copyApprovedOriginalCharacterPrompt(characterId, projectRoot))
    .join(' || ');
}

export function copyApprovedOriginalTimeSettingPrompt(
  timeSettingId: string,
  projectRoot?: string
): string {
  const root = resolveProjectRoot(projectRoot);
  const prompts = loadApprovedOriginalTimeSettingPrompts(root);
  const prompt = prompts[timeSettingId];
  if (!prompt) {
    throw new Error(`Missing approved original timesetting prompt for time_id=${timeSettingId}`);
  }
  return prompt;
}

export function approvedOriginalCharacterPromptRefs(characterIds: readonly string[]): string {
  return characterIds.map((id) => `${APPROVED_ORIGINALS_CHARACTER_REF}=${id}`).join('|');
}

export function approvedOriginalTimeSettingPromptRef(timeSettingId: string): string {
  return `${APPROVED_ORIGINALS_TIMESETTING_REF}=${timeSettingId}`;
}

export function approvedOriginalsFilesExist(root: string): boolean {
  return REQUIRED_APPROVED_ORIGINAL_PATHS.every((rel) => fs.existsSync(path.join(root, rel)));
}

export function assertApprovedOriginalsPresent(projectRoot?: string): {
  artstyle_count: number;
  character_count: number;
  timesetting_count: number;
  manifest_locked: boolean;
} {
  const root = resolveProjectRoot(projectRoot);

  if (!approvedOriginalsFilesExist(root)) {
    const missing = REQUIRED_APPROVED_ORIGINAL_PATHS.filter((rel) => !fs.existsSync(path.join(root, rel)));
    throw new Error(`Missing user-managed approved originals: ${missing.join(', ')}`);
  }

  const manifest = loadApprovedOriginalsManifest(root);
  if (
    manifest.source_locked !== true ||
    manifest.cursor_modification_allowed !== false ||
    manifest.cursor_regeneration_allowed !== false ||
    manifest.artstyle_source !== 'USER_MANAGED' ||
    manifest.character_source !== 'USER_MANAGED' ||
    manifest.timesetting_source !== 'USER_MANAGED'
  ) {
    throw new Error('APPROVED_ORIGINALS_MANIFEST.json does not match final source lock policy');
  }

  const characterPrompts = loadApprovedOriginalCharacterPrompts(root);
  for (const characterId of REQUIRED_APPROVED_CHARACTER_IDS) {
    if (!characterPrompts[characterId]) {
      throw new Error(`approved_originals missing character block for ${characterId}`);
    }
  }

  const timeSettingPrompts = loadApprovedOriginalTimeSettingPrompts(root);
  if (Object.keys(timeSettingPrompts).length === 0) {
    throw new Error('approved_originals/timesetting-approved.json is empty');
  }

  return {
    artstyle_count: 1,
    character_count: Object.keys(characterPrompts).length,
    timesetting_count: Object.keys(timeSettingPrompts).length,
    manifest_locked: true,
  };
}

/** @deprecated Use assertApprovedOriginalsPresent — approved originals are user-managed and must not be written. */
export function ensureApprovedOriginalsFrozen(projectRoot?: string): {
  artstyle_count: number;
  character_count: number;
  frozen: boolean;
} {
  const result = assertApprovedOriginalsPresent(projectRoot);
  return {
    artstyle_count: result.artstyle_count,
    character_count: result.character_count,
    frozen: result.manifest_locked,
  };
}
