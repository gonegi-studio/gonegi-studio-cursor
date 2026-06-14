import {
  type DriftDimensionResult,
  type DriftFinding,
  buildDimensionResult,
  countTokenBuckets,
  loadCharacterFirstContract,
  CHARACTER_FIRST_CONTRACT_PATH,
} from './driftPredictorShared.js';

const MIN_IDENTITY_DOMINANCE_RATIO = 0.12;
const CRITICAL_DILUTION_RATIO = 0.05;

export function predictAnchorDilution(projectRoot: string): DriftDimensionResult {
  const findings: DriftFinding[] = [];
  const buckets = countTokenBuckets(projectRoot);
  const contract = loadCharacterFirstContract(projectRoot);

  const nonCharacter =
    buckets.environment + buckets.camera + buckets.composition + buckets.location;
  const identityDominanceRatio =
    buckets.total > 0 ? buckets.character / buckets.total : 1;

  if (identityDominanceRatio < CRITICAL_DILUTION_RATIO) {
    findings.push({
      code: 'CRITICAL_ANCHOR_DILUTION',
      message: `Identity dominance ratio ${identityDominanceRatio.toFixed(3)} below critical threshold ${CRITICAL_DILUTION_RATIO}`,
      severity: 'critical',
    });
  } else if (identityDominanceRatio < MIN_IDENTITY_DOMINANCE_RATIO) {
    findings.push({
      code: 'ANCHOR_DILUTION',
      message: `Identity dominance ratio ${identityDominanceRatio.toFixed(3)} below safe threshold ${MIN_IDENTITY_DOMINANCE_RATIO}`,
      severity: 'high',
    });
  }

  if (buckets.environment > buckets.character * 2) {
    findings.push({
      code: 'ENVIRONMENT_TOKEN_OVERFLOW',
      message: `Environment tokens (${buckets.environment}) exceed 2× character tokens (${buckets.character})`,
      severity: 'high',
    });
  }

  if (buckets.composition > buckets.character) {
    findings.push({
      code: 'COMPOSITION_TOKEN_DOMINANCE',
      message: `Composition tokens (${buckets.composition}) outweigh character tokens (${buckets.character})`,
      severity: 'moderate',
    });
  }

  if (buckets.camera > buckets.character * 1.5) {
    findings.push({
      code: 'CAMERA_TOKEN_DOMINANCE',
      message: `Camera tokens (${buckets.camera}) may dilute character anchors`,
      severity: 'moderate',
    });
  }

  if (contract) {
    const injection = contract.injection_policy as
      | { character_tokens_inject_first?: boolean }
      | undefined;
    if (injection?.character_tokens_inject_first !== true) {
      findings.push({
        code: 'CHARACTER_INJECT_NOT_FIRST',
        message: 'character-first-contract does not enforce character_tokens_inject_first',
        severity: 'high',
        source: CHARACTER_FIRST_CONTRACT_PATH,
      });
    }
  }

  return buildDimensionResult(findings, {
    anchor_dilution_risk: buildDimensionResult(findings).risk_score,
    identity_dominance_ratio: Number(identityDominanceRatio.toFixed(4)),
    token_buckets: buckets,
    non_character_token_total: nonCharacter,
  });
}
