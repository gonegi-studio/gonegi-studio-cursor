import {
  type DriftDimensionResult,
  type DriftFinding,
  buildDimensionResult,
  loadCharacterFirstContract,
  loadCharacterProfiles,
  mainCharacters,
  CHARACTER_FIRST_CONTRACT_PATH,
} from './driftPredictorShared.js';

const GENERIC_CLOTHING_WORDS = [
  'shirt',
  'dress',
  'pants',
  'trousers',
  'boots',
  'shoes',
  'uniform',
  'cloak',
  'robe',
] as const;

const VAGUE_COLOR_WORDS = ['dark', 'light', 'simple', 'worn', 'faded'] as const;

export function predictCostumeDrift(projectRoot: string): DriftDimensionResult {
  const findings: DriftFinding[] = [];
  const profiles = loadCharacterProfiles(projectRoot);
  const contract = loadCharacterFirstContract(projectRoot);

  for (const character of mainCharacters(profiles)) {
    const clothing = character.clothing.trim();
    if (!clothing || clothing === 'none') continue;

    const wordCount = clothing.split(/\s+/).length;
    const genericOnly =
      wordCount <= 4 &&
      GENERIC_CLOTHING_WORDS.some((w) => clothing.toLowerCase().includes(w));
    if (genericOnly) {
      findings.push({
        code: 'GENERIC_CLOTHING_DESCRIPTION',
        message: `${character.character_id} clothing may be too generic: "${clothing}"`,
        severity: 'moderate',
        source: character.character_id,
      });
    }

    const colorTokens = clothing.match(/\b[a-z]+(-[a-z]+)?\b/gi) ?? [];
    const vagueColors = colorTokens.filter((t) =>
      VAGUE_COLOR_WORDS.includes(t.toLowerCase() as (typeof VAGUE_COLOR_WORDS)[number])
    );
    const specificColors = colorTokens.filter((t) =>
      /navy|cornflower|terracotta|indigo|charcoal|ginger|chestnut|jet-black|off-white|cream|lavender|olive|grey|gray|brown|white|black|blue|red|green/i.test(
        t
      )
    );
    if (vagueColors.length > 0 && specificColors.length < 2) {
      findings.push({
        code: 'COLOR_AMBIGUITY',
        message: `${character.character_id} wardrobe has ambiguous color tokens: ${vagueColors.join(', ')}`,
        severity: 'moderate',
        source: character.character_id,
      });
    }

    const anchorPieces = ['suspenders', 'pendant', 'apron', 'vest', 'henley', 'ponytail'];
    const hasAnchorPiece = anchorPieces.some((p) => clothing.toLowerCase().includes(p));
    if (!hasAnchorPiece && character.character_id === 'gonegi') {
      findings.push({
        code: 'MISSING_COSTUME_ANCHOR',
        message: 'Gonegi missing distinctive costume anchor (suspenders/henley expected)',
        severity: 'low',
        source: 'gonegi',
      });
    }
  }

  if (contract) {
    const rules = contract.rules as { environment_may_never_override?: string[] } | undefined;
    const overrides = rules?.environment_may_never_override ?? [];
    if (!overrides.some((r) => r.toLowerCase().includes('clothing'))) {
      findings.push({
        code: 'COSTUME_LOCK_MISSING',
        message: 'character-first-contract does not lock character clothing against override',
        severity: 'high',
        source: CHARACTER_FIRST_CONTRACT_PATH,
      });
    }
  }

  const wardrobeByCharacter = new Map(
    mainCharacters(profiles).map((c) => [c.character_id, c.clothing.toLowerCase()])
  );
  for (const [id, clothing] of wardrobeByCharacter) {
    if (clothing.includes('navy') && id === 'dana') {
      findings.push({
        code: 'WARDROBE_CROSS_CONTAMINATION',
        message: 'Dana and Gonegi both use navy tones — color confusion risk in multi-character shots',
        severity: 'low',
        source: id,
      });
      break;
    }
  }

  return buildDimensionResult(findings, {
    costume_drift_risk: buildDimensionResult(findings).risk_score,
    main_characters_checked: mainCharacters(profiles).length,
  });
}
