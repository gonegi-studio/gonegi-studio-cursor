export const FORBIDDEN_LEGACY_SOURCE_PREFIXES = [
  'master_style_core/',
  'datasets/generation_context/prompts/',
  'datasets/generation_context/source_of_truth/',
  'datasets/character/character-simple-v1.json',
  'datasets/time/time-setting-library-v1.json',
] as const;

export const FORBIDDEN_LEGACY_SOURCE_PATHS = FORBIDDEN_LEGACY_SOURCE_PREFIXES;

export function isForbiddenLegacySourceRef(sourceRef: string): boolean {
  return FORBIDDEN_LEGACY_SOURCE_PREFIXES.some((prefix) => sourceRef.includes(prefix));
}
