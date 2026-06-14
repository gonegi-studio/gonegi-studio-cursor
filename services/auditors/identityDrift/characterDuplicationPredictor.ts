import {
  type DriftDimensionResult,
  type DriftFinding,
  buildDimensionResult,
  collectStringsFromJson,
  loadCharacterProfiles,
  loadLatestAdapterDocuments,
  CHARACTER_SIMPLE_PATH,
} from './driftPredictorShared.js';
import { readJsonRecord } from '../auditorShared.js';

const DUPLICATION_SIGNAL_PATTERNS = [
  /\bdouble\s+gonegi\b/i,
  /\bdouble\s+dana\b/i,
  /\btwo\s+gonegi\b/i,
  /\btwo\s+dana\b/i,
  /\bduplicate\s+subject\b/i,
  /\bparallel\s+subject\b/i,
  /\bmultiple\s+interpretations\b/i,
] as const;

const SUBJECT_PATHWAY_PATTERNS = [
  /\bmain_subject\b/i,
  /\bhero_subject\b/i,
  /\bsubject_focus\b/i,
  /\bsecondary_subject\b/i,
] as const;

export function predictCharacterDuplication(projectRoot: string): DriftDimensionResult {
  const findings: DriftFinding[] = [];
  const profiles = loadCharacterProfiles(projectRoot);
  const characterDoc = readJsonRecord(projectRoot, CHARACTER_SIMPLE_PATH);

  const mainIds = profiles.filter((c) => c.role_type === 'main').map((c) => c.character_id);
  const soloRules = profiles
    .filter((c) => c.scenario_usage_rule.toLowerCase().includes('solo'))
    .map((c) => c.character_id);

  if (soloRules.length < 2) {
    findings.push({
      code: 'SOLO_SCENE_GUARD_WEAK',
      message: 'Insufficient solo-scene injection guards for main characters',
      severity: 'moderate',
      source: CHARACTER_SIMPLE_PATH,
    });
  }

  const injectionRules = characterDoc?.injection_rules as
    | { forbidden?: string; solo_scene?: string }
    | undefined;
  if (!injectionRules?.forbidden?.toLowerCase().includes('absent')) {
    findings.push({
      code: 'ABSENT_CHARACTER_GUARD_MISSING',
      message: 'character-simple missing explicit absent-character injection guard',
      severity: 'high',
      source: CHARACTER_SIMPLE_PATH,
    });
  }

  let subjectPathwayCount = 0;
  let duplicationSignalCount = 0;

  for (const { path, doc } of loadLatestAdapterDocuments(projectRoot)) {
    const strings: string[] = [];
    collectStringsFromJson(doc, strings);
    const blob = strings.join(' ');

    for (const pattern of DUPLICATION_SIGNAL_PATTERNS) {
      if (pattern.test(blob)) {
        duplicationSignalCount += 1;
        findings.push({
          code: 'DUPLICATE_SUBJECT_PATHWAY',
          message: `${path} contains duplication risk language: ${pattern.source}`,
          severity: 'high',
          source: path,
        });
      }
    }

    for (const pattern of SUBJECT_PATHWAY_PATTERNS) {
      if (pattern.test(blob)) subjectPathwayCount += 1;
    }

    const characterMentions = mainIds.reduce(
      (sum, id) => sum + (blob.toLowerCase().split(id).length - 1),
      0
    );
    if (characterMentions > 12 && path.includes('living-world')) {
      findings.push({
        code: 'MULTIPLE_CHARACTER_INTERPRETATIONS',
        message: `${path} references main characters ${characterMentions} times — parallel interpretation risk`,
        severity: 'moderate',
        source: path,
      });
    }
  }

  if (subjectPathwayCount > 2) {
    findings.push({
      code: 'PARALLEL_SUBJECT_GENERATION_RISK',
      message: `${subjectPathwayCount} subject pathway tokens across adapters`,
      severity: 'moderate',
    });
  }

  const gonegiRule = profiles.find((c) => c.character_id === 'gonegi')?.scenario_usage_rule ?? '';
  const danaRule = profiles.find((c) => c.character_id === 'dana')?.scenario_usage_rule ?? '';
  if (!gonegiRule.includes('Do not inject Dana') || !danaRule.includes('Do not inject Gonegi')) {
    findings.push({
      code: 'CROSS_INJECTION_RISK',
      message: 'Gonegi/Dana solo cross-injection guards incomplete — double-character event risk',
      severity: 'high',
    });
  }

  return buildDimensionResult(findings, {
    duplication_risk: buildDimensionResult(findings).risk_score,
    main_character_count: mainIds.length,
    duplication_signal_count: duplicationSignalCount,
    subject_pathway_count: subjectPathwayCount,
  });
}
