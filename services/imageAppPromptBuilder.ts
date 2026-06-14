import fs from 'node:fs';
import path from 'node:path';
import { FORBIDDEN_GENERATED_ART_STYLES } from './canonicalGonegiArtStyle.js';
import {
  CharacterSimpleProfileFull,
  loadFullCharacterSimpleLibrary,
} from './movieCharacterDNALock.js';
import { TimeSettingLibraryEntryFull } from './movieTimeSettingLock.js';
import {
  CANONICAL_ARTSTYLE_PROMPT_PATH,
  CANONICAL_CHARACTER_PROMPTS_V2_PATH,
  CANONICAL_TIMESETTING_PROMPTS_PATH,
  GENERATION_PROMPT_DIR,
  GENERATION_PROMPT_MANIFEST_PATH,
  GenerationPromptManifest,
  IMAGE_APP_PROMPT_COPY_ONLY_MODE,
  IMAGE_APP_PROMPT_PHASE,
  IMAGE_APP_PROMPT_SYSTEM_ID,
} from './imageAppPromptLoader.js';
import { TIME_SETTING_LIBRARY_PATH, loadTimeSettingLibrary } from './scenarioGenerator/scenario-generator-foundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

const REQUIRED_CHARACTER_IDS = [
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

function writeText(root: string, rel: string, value: string): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function serializeApprovedPlainCharacterPrompt(profile: CharacterSimpleProfileFull): string {
  return `${profile.display_name_en}: ${profile.age_or_type}. ${profile.hair}. ${profile.visual_identity}. ${profile.skin_or_fur}. ${profile.eyes}. ${profile.clothing}.`;
}

export function resolveApprovedArtStylePromptSentence(): string {
  return FORBIDDEN_GENERATED_ART_STYLES[0];
}

export function writeImageAppPromptCanonicalFiles(projectRoot?: string): {
  artstyle_prompt_count: number;
  character_prompt_count: number;
  timesetting_prompt_count: number;
} {
  const root = resolveProjectRoot(projectRoot);
  const artStylePrompt = resolveApprovedArtStylePromptSentence();

  writeText(root, CANONICAL_ARTSTYLE_PROMPT_PATH, artStylePrompt);

  const characterLibrary = loadFullCharacterSimpleLibrary(root);
  const characterPrompts: Record<string, string> = {};
  for (const profile of characterLibrary.characters) {
    characterPrompts[profile.character_id] = serializeApprovedPlainCharacterPrompt(profile);
  }

  writeJson(root, CANONICAL_CHARACTER_PROMPTS_V2_PATH, characterPrompts);

  const timeLibrary = loadTimeSettingLibrary() as { items: TimeSettingLibraryEntryFull[] };
  const timeSettingPrompts: Record<string, string> = {};
  for (const entry of timeLibrary.items) {
    if (!timeSettingPrompts[entry.time_setting_id]) {
      timeSettingPrompts[entry.time_setting_id] = entry.raw_timeSetting;
    }
  }

  writeJson(root, CANONICAL_TIMESETTING_PROMPTS_PATH, timeSettingPrompts);

  const manifest: GenerationPromptManifest = {
    phase: IMAGE_APP_PROMPT_PHASE,
    system_id: IMAGE_APP_PROMPT_SYSTEM_ID,
    copy_only_mode: IMAGE_APP_PROMPT_COPY_ONLY_MODE,
    artstyle_prompt_source: 'canonical-artstyle-prompt.txt',
    character_prompt_source: 'canonical-character-prompts-v2.json',
    timesetting_prompt_source: 'canonical-timesetting-prompts.json',
    rules: {
      no_ids: true,
      no_serialization: true,
      no_runtime_assembly: true,
      no_runtime_formatting: true,
      copy_only: true,
    },
  };

  writeJson(root, GENERATION_PROMPT_MANIFEST_PATH, manifest);

  return {
    artstyle_prompt_count: 1,
    character_prompt_count: Object.keys(characterPrompts).length,
    timesetting_prompt_count: Object.keys(timeSettingPrompts).length,
  };
}

export function imageAppPromptFilesExist(root: string): boolean {
  return [
    GENERATION_PROMPT_MANIFEST_PATH,
    CANONICAL_ARTSTYLE_PROMPT_PATH,
    CANONICAL_CHARACTER_PROMPTS_V2_PATH,
    CANONICAL_TIMESETTING_PROMPTS_PATH,
  ].every((rel) => fs.existsSync(path.join(root, rel)));
}

export { REQUIRED_CHARACTER_IDS, GENERATION_PROMPT_DIR, TIME_SETTING_LIBRARY_PATH };
