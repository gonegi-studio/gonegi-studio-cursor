import fs from 'node:fs';
import { resolveProjectRelativePath } from '../projectRootResolver.js';

export const CHARACTER_SIMPLE_LIBRARY_PATH =
  'datasets/character/character-simple-v1.json' as const;

export const TIME_SETTING_LIBRARY_PATH =
  'datasets/time/time-setting-library-v1.json' as const;

export const LIVING_WORLD_CORE_PATH =
  'exports/shared/latest/living-world-core-v1-package.json' as const;

export type CharacterSimpleEntry = {
  character_id: string;
  display_name_ko: string;
  display_name_en: string;
  role_type: string;
};

export type CharacterSimpleLibrary = {
  asset_type: string;
  asset_version: string;
  characters: readonly CharacterSimpleEntry[];
};

export type TimeSettingEntry = {
  time_setting_id: string;
  label: string;
  raw_timeSetting: string;
};

export type TimeSettingLibrary = {
  asset_type: string;
  asset_version: string;
  items: readonly TimeSettingEntry[];
};

export type LivingWorldCoreLibrary = {
  library_id: string;
  patterns: readonly Record<string, unknown>[];
};

export type LivingWorldCorePackage = {
  package_type: string;
  package_version: string;
  libraries: Record<string, LivingWorldCoreLibrary>;
  source_audit?: {
    total_item_count?: number;
    library_count?: number;
  };
};

function readJsonAsset<T>(relativePath: string): T {
  const absolutePath = resolveProjectRelativePath(relativePath);
  const raw = fs.readFileSync(absolutePath, 'utf8');
  return JSON.parse(raw) as T;
}

export function loadCharacterSimpleLibrary(): CharacterSimpleLibrary {
  return readJsonAsset<CharacterSimpleLibrary>(CHARACTER_SIMPLE_LIBRARY_PATH);
}

export function loadTimeSettingLibrary(): TimeSettingLibrary {
  return readJsonAsset<TimeSettingLibrary>(TIME_SETTING_LIBRARY_PATH);
}

export function loadLivingWorldCore(): LivingWorldCorePackage {
  return readJsonAsset<LivingWorldCorePackage>(LIVING_WORLD_CORE_PATH);
}

export function countLivingWorldLibraries(pkg: LivingWorldCorePackage): number {
  return Object.keys(pkg.libraries).length;
}

export function countLivingWorldItems(pkg: LivingWorldCorePackage): number {
  return Object.values(pkg.libraries).reduce(
    (sum, library) => sum + library.patterns.length,
    0
  );
}
