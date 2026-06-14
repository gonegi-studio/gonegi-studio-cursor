import fs from 'node:fs';
import path from 'node:path';
import {
  CHARACTER_DNA_FIELDS,
  CHARACTER_DNA_MARKER,
  CharacterSimpleProfileFull,
  loadFullCharacterSimpleLibrary,
} from './movieCharacterDNALock.js';
import { loadCanonicalGonegiArtStyle } from './canonicalGonegiArtStyle.js';
import {
  CANONICAL_ARTSTYLE_PATH,
  CANONICAL_CHARACTER_PROMPTS_PATH,
  CANONICAL_TIMESETTING_LIBRARY_PATH,
  GENERATION_CONTEXT_MANIFEST_PATH,
  GENERATION_CONTEXT_PHASE,
  GENERATION_CONTEXT_SYSTEM_ID,
  GenerationContextManifest,
} from './generationContextLoader.js';
import { deriveLockedLightingId, TimeSettingLibraryEntryFull } from './movieTimeSettingLock.js';
import { TIME_SETTING_LIBRARY_PATH, loadTimeSettingLibrary } from './scenarioGenerator/scenario-generator-foundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

function writeText(root: string, rel: string, value: string): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function serializeDnaValue(value: string | number): string {
  return String(value).replace(/\s+/g, ' ').trim();
}

function serializeCharacterPrompt(profile: CharacterSimpleProfileFull): string {
  const parts = CHARACTER_DNA_FIELDS.map(
    (field) => `${field}=${serializeDnaValue(profile[field])}`
  );
  return `${CHARACTER_DNA_MARKER} ${parts.join(' ')}`;
}

function serializeCanonicalTimeSettingBlock(entry: TimeSettingLibraryEntryFull): string {
  const locationId = entry.recommended_locations[0] ?? 'harbor';
  const parts = [
    `time_id=${entry.time_setting_id}`,
    `location_id=${locationId}`,
    `lighting_id=${deriveLockedLightingId(entry)}`,
    `weather_id=${entry.weather}`,
    `color_temperature=${entry.light_color}`,
    `atmosphere=${entry.atmosphere}`,
  ];
  return `[TIME_SETTING] ${parts.join(' ')}`;
}

export function writeGenerationContextCanonicalFiles(projectRoot?: string): {
  artstyle_count: number;
  character_count: number;
  timesetting_count: number;
} {
  const root = resolveProjectRoot(projectRoot);
  const canonicalArtStyle = loadCanonicalGonegiArtStyle(root);

  writeText(root, CANONICAL_ARTSTYLE_PATH, canonicalArtStyle);

  const characterLibrary = loadFullCharacterSimpleLibrary(root);
  const characterPrompts: Record<string, string> = {};
  for (const profile of characterLibrary.characters) {
    characterPrompts[profile.character_id] = serializeCharacterPrompt(profile);
  }

  writeJson(root, CANONICAL_CHARACTER_PROMPTS_PATH, {
    library_id: 'CANONICAL-CHARACTER-PROMPTS-V1',
    phase: GENERATION_CONTEXT_PHASE,
    copy_only: true,
    source_ref: 'datasets/character/character-simple-v1.json',
    prompts: characterPrompts,
  });

  const timeLibrary = loadTimeSettingLibrary() as { items: TimeSettingLibraryEntryFull[] };
  const timeBlocks: Record<string, string> = {};
  for (const entry of timeLibrary.items) {
    if (!timeBlocks[entry.time_setting_id]) {
      timeBlocks[entry.time_setting_id] = serializeCanonicalTimeSettingBlock(entry);
    }
  }

  writeJson(root, CANONICAL_TIMESETTING_LIBRARY_PATH, {
    library_id: 'CANONICAL-TIMESETTING-LIBRARY-V1',
    phase: GENERATION_CONTEXT_PHASE,
    copy_only: true,
    source_ref: TIME_SETTING_LIBRARY_PATH,
    blocks: timeBlocks,
  });

  const manifest: GenerationContextManifest = {
    phase: GENERATION_CONTEXT_PHASE,
    system_id: GENERATION_CONTEXT_SYSTEM_ID,
    copy_only_mode: true,
    artstyle_source: 'artstyle/canonical-artstyle.txt',
    character_source: 'character/canonical-character-prompts.json',
    timesetting_source: 'timesetting/canonical-timesetting-library.json',
    rules: {
      no_generation: true,
      no_rewriting: true,
      no_summarization: true,
      copy_only: true,
    },
  };

  writeJson(root, GENERATION_CONTEXT_MANIFEST_PATH, manifest);

  return {
    artstyle_count: 1,
    character_count: Object.keys(characterPrompts).length,
    timesetting_count: Object.keys(timeBlocks).length,
  };
}

export function generationContextFilesExist(root: string): boolean {
  return [
    GENERATION_CONTEXT_MANIFEST_PATH,
    CANONICAL_ARTSTYLE_PATH,
    CANONICAL_CHARACTER_PROMPTS_PATH,
    CANONICAL_TIMESETTING_LIBRARY_PATH,
  ].every((rel) => fs.existsSync(path.join(root, rel)));
}
