import {
  type DriftDimensionResult,
  type DriftFinding,
  buildDimensionResult,
  loadCharacterProfiles,
  mainCharacters,
} from './driftPredictorShared.js';

const ALTERNATE_PATHWAY_PATTERNS = [/\bor\b/i, /\blike\b/i, /\bsimilar\b/i, /\bstyle\b/i] as const;
const LOCK_ATTRIBUTES = [
  'ponytail',
  'braid',
  'bun',
  'side-part',
  'slicked',
  'twin',
  'matte',
  'jet-black',
  'chestnut',
  'beard',
  'curled',
] as const;

export function predictHairstyleDrift(projectRoot: string): DriftDimensionResult {
  const findings: DriftFinding[] = [];
  const profiles = loadCharacterProfiles(projectRoot);

  for (const character of mainCharacters(profiles)) {
    const hair = character.hair.trim();
    if (!hair) {
      findings.push({
        code: 'HAIRSTYLE_MISSING',
        message: `${character.character_id} has no hairstyle lock`,
        severity: 'high',
        source: character.character_id,
      });
      continue;
    }

    const hasAlternatePath = ALTERNATE_PATHWAY_PATTERNS.some((p) => p.test(hair));
    if (hasAlternatePath) {
      findings.push({
        code: 'ALTERNATE_HAIRSTYLE_PATHWAY',
        message: `${character.character_id} hair allows alternate interpretation: "${hair}"`,
        severity: 'moderate',
        source: character.character_id,
      });
    }

    const lockCount = LOCK_ATTRIBUTES.filter((attr) =>
      hair.toLowerCase().includes(attr.replace('-', ''))
    ).length;
    if (lockCount < 1 && hair.length < 20) {
      findings.push({
        code: 'HAIRSTYLE_AMBIGUITY',
        message: `${character.character_id} hairstyle lacks lock attributes: "${hair}"`,
        severity: 'moderate',
        source: character.character_id,
      });
    }

    if (hair.split(/\s+/).length < 4 && character.role_type === 'main') {
      findings.push({
        code: 'MISSING_HAIR_LOCK',
        message: `${character.character_id} main character hair description is short — drift risk`,
        severity: 'low',
        source: character.character_id,
      });
    }
  }

  const gonegi = profiles.find((c) => c.character_id === 'gonegi');
  const dana = profiles.find((c) => c.character_id === 'dana');
  if (gonegi && dana) {
    const bothChestnut =
      gonegi.hair.toLowerCase().includes('black') === false &&
      dana.hair.toLowerCase().includes('chestnut');
    if (bothChestnut && gonegi.hair.toLowerCase().includes('jet-black') === false) {
      findings.push({
        code: 'HAIR_COLOR_COLLISION',
        message: 'Gonegi/Dana hair color distinction should remain jet-black vs chestnut',
        severity: 'low',
      });
    }
  }

  return buildDimensionResult(findings, {
    hairstyle_drift_risk: buildDimensionResult(findings).risk_score,
    main_characters_checked: mainCharacters(profiles).length,
  });
}
