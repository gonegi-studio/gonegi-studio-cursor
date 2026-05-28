/** PHASE-31A: remove conflicting descriptors from compiled prompt sections. */

const FORBIDDEN_POSITIVE_TOKENS = [
  'soldier',
  'soldiers',
  'warrior',
  'warriors',
  'war',
  'war scene',
  'wwi',
  'ww1',
  'trench',
  'trenches',
  'battlefield',
  'rifle',
  'army',
  'fantasy prince',
  'realistic man',
  'beautiful woman',
  'generic handsome man',
  'photoreal',
  'photoreal face',
  '3d render',
  '3d face',
  'generic anime girl',
  'generic ghibli boy',
  'generic ghibli girl',
  'small anime boy',
  'young girl',
  'invented face',
  'unknown generic characters',
] as const;

const CONFLICTING_AGE_PATTERN = /\b(11-year-old|11 year old|teenager|adult man|elderly)\b/gi;
const CONFLICTING_OUTFIT_PATTERN = /\b(modern streetwear|business suit|sci-fi armor|military uniform)\b/gi;

const FORBIDDEN_REPLACE_PATTERN = new RegExp(
  `\\b(${FORBIDDEN_POSITIVE_TOKENS.map((t) => t.replace(/\s+/g, '\\s+')).join('|')})\\b`,
  'gi'
);

const FORBIDDEN_TEST_PATTERN = new RegExp(
  `\\b(${FORBIDDEN_POSITIVE_TOKENS.map((t) => t.replace(/\s+/g, '\\s+')).join('|')})\\b`,
  'i'
);

export function cleanPromptSection(section: string): string {
  let text = section
    .replace(FORBIDDEN_REPLACE_PATTERN, ' ')
    .replace(CONFLICTING_AGE_PATTERN, ' ')
    .replace(CONFLICTING_OUTFIT_PATTERN, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = text
    .split(/(?<=\.)\s+|,\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const sentence of sentences) {
    const key = sentence.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(sentence);
  }
  return deduped.join(', ');
}

export function buildCompiledNegativePrompt(baseNegative: string, extraNegative: string[] = []): string {
  const merged = [
    baseNegative,
    ...extraNegative,
    ...FORBIDDEN_POSITIVE_TOKENS,
    'face drift',
    'identity collapse',
    'generic fantasy faces',
    'style collapse',
    'conflicting age',
    'conflicting outfit',
  ]
    .join(', ')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const token of merged.sort()) {
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(token);
  }
  return unique.join(', ');
}

export function assertForbiddenTokensAbsent(text: string): boolean {
  return !FORBIDDEN_TEST_PATTERN.test(text);
}

export function findForbiddenTermHits(text: string): string[] {
  const hits: string[] = [];
  for (const token of FORBIDDEN_POSITIVE_TOKENS) {
    const pattern = new RegExp(`\\b${token.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (pattern.test(text)) hits.push(token);
  }
  return hits.sort();
}
