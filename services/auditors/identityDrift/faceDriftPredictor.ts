import {
  type DriftDimensionResult,
  type DriftFinding,
  buildDimensionResult,
  scanInjectableHarmfulTokens,
  loadCharacterFirstContract,
  loadCharacterProfiles,
  loadLatestAdapterDocuments,
  mainCharacters,
  CHARACTER_FIRST_CONTRACT_PATH,
} from './driftPredictorShared.js';
import { extractPriorityOrder } from '../auditorShared.js';

const FACE_ANCHOR_FIELDS = ['eyes', 'visual_identity'] as const;
const WEAK_FACE_PATTERNS = [
  /\bexpressive eyes\b/i,
  /\bdark eyes\b/i,
  /\bsoft eyes\b/i,
  /\beyes\b/i,
];

export function predictFaceDrift(projectRoot: string): DriftDimensionResult {
  const findings: DriftFinding[] = [];
  const profiles = loadCharacterProfiles(projectRoot);
  const contract = loadCharacterFirstContract(projectRoot);

  for (const character of mainCharacters(profiles)) {
    const eyesWeak = WEAK_FACE_PATTERNS.some((p) => p.test(character.eyes));
    const identityHasFace = /face|eyes|silhouette/i.test(character.visual_identity);
    if (eyesWeak && !identityHasFace) {
      findings.push({
        code: 'WEAK_FACE_ANCHOR',
        message: `${character.character_id} eyes description is generic: "${character.eyes}"`,
        severity: 'moderate',
        source: character.character_id,
      });
    }

    if (!character.eyes || character.eyes.length < 8) {
      findings.push({
        code: 'MISSING_FACE_DETAIL',
        message: `${character.character_id} missing sufficient eye/face anchor detail`,
        severity: 'high',
        source: character.character_id,
      });
    }
  }

  if (!contract) {
    findings.push({
      code: 'CHARACTER_FIRST_CONTRACT_MISSING',
      message: 'character-first-contract missing — face override guard unavailable',
      severity: 'critical',
    });
  } else {
    const rules = contract.rules as { environment_may_never_override?: string[] } | undefined;
    const overrides = rules?.environment_may_never_override ?? [];
    if (!overrides.some((r) => r.toLowerCase().includes('face'))) {
      findings.push({
        code: 'FACE_OVERRIDE_GUARD_MISSING',
        message: 'character-first-contract does not explicitly protect character face',
        severity: 'critical',
        source: CHARACTER_FIRST_CONTRACT_PATH,
      });
    }

    const priorityOrder = extractPriorityOrder(contract);
    if (!priorityOrder?.includes('character_reference')) {
      findings.push({
        code: 'MISSING_REFERENCE_TRIGGER',
        message: 'priority_order missing character_reference — reference weakening risk',
        severity: 'high',
        source: CHARACTER_FIRST_CONTRACT_PATH,
      });
    }
    if (priorityOrder && priorityOrder.indexOf('character_identity') !== 0) {
      findings.push({
        code: 'FACE_PRIORITY_NOT_FIRST',
        message: 'character_identity not highest priority — face override risk elevated',
        severity: 'critical',
        source: CHARACTER_FIRST_CONTRACT_PATH,
      });
    }
  }

  let harmfulTokenCount = 0;
  for (const { path, doc } of loadLatestAdapterDocuments(projectRoot)) {
    const harmful = scanInjectableHarmfulTokens(doc);
    if (harmful.length > 0) {
      harmfulTokenCount += harmful.length;
      findings.push({
        code: 'FACE_OVERRIDE_RISK_TOKEN',
        message: `${path} injects ${harmful.length} enforcement token(s) that may override face anchors`,
        severity: path.includes('outdoor-layout-lock') ? 'high' : 'moderate',
        source: path,
      });
    }
  }

  return buildDimensionResult(findings, {
    face_drift_risk: computeFaceRisk(findings),
    main_characters_checked: mainCharacters(profiles).length,
    harmful_adapter_count: harmfulTokenCount,
    face_anchor_fields: FACE_ANCHOR_FIELDS,
  });
}

function computeFaceRisk(findings: DriftFinding[]): number {
  const base = findings.reduce((sum, f) => {
    if (f.severity === 'critical') return sum + 25;
    if (f.severity === 'high') return sum + 12;
    if (f.severity === 'moderate') return sum + 5;
    return sum + 2;
  }, 0);
  return Math.min(100, base);
}
