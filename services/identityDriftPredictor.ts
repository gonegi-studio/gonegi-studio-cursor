import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { predictAnchorDilution } from './auditors/identityDrift/anchorDilutionPredictor.js';
import { predictCharacterDuplication } from './auditors/identityDrift/characterDuplicationPredictor.js';
import { predictCostumeDrift } from './auditors/identityDrift/costumeDriftPredictor.js';
import {
  IDENTITY_DRIFT_FAIL_VERDICT,
  IDENTITY_DRIFT_PASS_VERDICT,
  IDENTITY_DRIFT_PHASE,
  IDENTITY_DRIFT_REPORT_PATH,
  type DriftDimensionResult,
  type RiskLevel,
  riskLevelFromScore,
} from './auditors/identityDrift/driftPredictorShared.js';
import { predictFaceDrift } from './auditors/identityDrift/faceDriftPredictor.js';
import { predictHairstyleDrift } from './auditors/identityDrift/hairstyleDriftPredictor.js';

export {
  IDENTITY_DRIFT_FAIL_VERDICT,
  IDENTITY_DRIFT_PASS_VERDICT,
  IDENTITY_DRIFT_PHASE,
  IDENTITY_DRIFT_REPORT_PATH,
} from './auditors/identityDrift/driftPredictorShared.js';

export type IdentityDriftPredictorReport = {
  predictor_id: string;
  phase: typeof IDENTITY_DRIFT_PHASE;
  timestamp: string;
  face_risk: number;
  costume_risk: number;
  hairstyle_risk: number;
  duplication_risk: number;
  anchor_dilution_risk: number;
  overall_identity_risk: number;
  overall_risk_level: RiskLevel;
  face_drift_risk: number;
  costume_drift_risk: number;
  hairstyle_drift_risk: number;
  duplication_risk_score: number;
  anchor_dilution_risk_score: number;
  critical_findings_count: number;
  dimensions: {
    face: DriftDimensionResult;
    costume: DriftDimensionResult;
    hairstyle: DriftDimensionResult;
    duplication: DriftDimensionResult;
    anchor_dilution: DriftDimensionResult;
  };
  recommended_actions: readonly string[];
  final_verdict: typeof IDENTITY_DRIFT_PASS_VERDICT | typeof IDENTITY_DRIFT_FAIL_VERDICT;
};

function newPredictorId(): string {
  return `identity_drift_${Date.now().toString(36)}`;
}

function buildRecommendedActions(
  face: DriftDimensionResult,
  costume: DriftDimensionResult,
  hairstyle: DriftDimensionResult,
  duplication: DriftDimensionResult,
  anchorDilution: DriftDimensionResult
): string[] {
  const actions: string[] = [];

  const allFindings = [
    ...face.findings,
    ...costume.findings,
    ...hairstyle.findings,
    ...duplication.findings,
    ...anchorDilution.findings,
  ];

  if (allFindings.some((f) => f.code === 'FACE_OVERRIDE_RISK_TOKEN')) {
    actions.push(
      'Remove or soften hard-enforcement outdoor tokens (must_show, FAIL-if-ignored) before generation.'
    );
  }
  if (allFindings.some((f) => f.code.includes('DILUTION') || f.code.includes('OVERFLOW'))) {
    actions.push(
      'Reduce environment/composition token weight; ensure character-priority tokens inject first.'
    );
  }
  if (allFindings.some((f) => f.code.includes('DUPLICATE') || f.code === 'CROSS_INJECTION_RISK')) {
    actions.push(
      'Enforce solo-scene character injection rules; verify only one main subject pathway per shot.'
    );
  }
  if (allFindings.some((f) => f.code.includes('COSTUME') || f.code === 'COLOR_AMBIGUITY')) {
    actions.push('Strengthen costume anchors with specific color + garment locks for active characters.');
  }
  if (allFindings.some((f) => f.code.includes('HAIR'))) {
    actions.push('Add hairstyle lock attributes (length, part, color) before rendering main characters.');
  }
  if (allFindings.some((f) => f.severity === 'critical')) {
    actions.push(
      'Block generation until character-first-contract and face/clothing override guards are verified.'
    );
  }

  if (actions.length === 0) {
    actions.push('Continue with standard pre-generation identity check; no critical drift predicted.');
  }

  return actions;
}

export function runIdentityDriftPrediction(projectRoot?: string): IdentityDriftPredictorReport {
  const root = resolveProjectRoot(projectRoot);

  const face = predictFaceDrift(root);
  const costume = predictCostumeDrift(root);
  const hairstyle = predictHairstyleDrift(root);
  const duplication = predictCharacterDuplication(root);
  const anchorDilution = predictAnchorDilution(root);

  const face_risk = face.risk_score;
  const costume_risk = costume.risk_score;
  const hairstyle_risk = hairstyle.risk_score;
  const duplication_risk = duplication.risk_score;
  const anchor_dilution_risk = anchorDilution.risk_score;

  const overall_identity_risk = Math.max(
    face_risk,
    costume_risk,
    hairstyle_risk,
    duplication_risk,
    anchor_dilution_risk
  );

  const allFindings = [
    ...face.findings,
    ...costume.findings,
    ...hairstyle.findings,
    ...duplication.findings,
    ...anchorDilution.findings,
  ];
  const critical_findings_count = allFindings.filter((f) => f.severity === 'critical').length;

  const pass =
    critical_findings_count === 0 && overall_identity_risk < 61;

  const recommended_actions = Object.freeze(
    buildRecommendedActions(face, costume, hairstyle, duplication, anchorDilution)
  );

  return {
    predictor_id: newPredictorId(),
    phase: IDENTITY_DRIFT_PHASE,
    timestamp: new Date().toISOString(),
    face_risk,
    costume_risk,
    hairstyle_risk,
    duplication_risk,
    anchor_dilution_risk,
    overall_identity_risk,
    overall_risk_level: riskLevelFromScore(overall_identity_risk),
    face_drift_risk: face_risk,
    costume_drift_risk: costume_risk,
    hairstyle_drift_risk: hairstyle_risk,
    duplication_risk_score: duplication_risk,
    anchor_dilution_risk_score: anchor_dilution_risk,
    critical_findings_count,
    dimensions: {
      face,
      costume,
      hairstyle,
      duplication,
      anchor_dilution: anchorDilution,
    },
    recommended_actions,
    final_verdict: pass ? IDENTITY_DRIFT_PASS_VERDICT : IDENTITY_DRIFT_FAIL_VERDICT,
  };
}

export function writeIdentityDriftPredictorReport(projectRoot?: string): {
  report: IdentityDriftPredictorReport;
  reportPath: string;
} {
  const root = resolveProjectRoot(projectRoot);
  const report = runIdentityDriftPrediction(root);

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const payload = {
    ...report,
    report_type: 'identity_drift_predictor_report',
    report_version: 'v1',
    export_path: IDENTITY_DRIFT_REPORT_PATH,
    next_phase: 'PHASE-AUDITOR-004 PRE-GENERATION_SIMULATOR_V1',
  };

  const reportPath = path.join(root, IDENTITY_DRIFT_REPORT_PATH);
  fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return { report, reportPath: IDENTITY_DRIFT_REPORT_PATH };
}
