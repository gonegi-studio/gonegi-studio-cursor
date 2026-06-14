import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OBJECT_IDENTITY_EVIDENCE_DATASET_PATH,
  OBJECT_IDENTITY_EVIDENCE_PASS_VERDICT,
  OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  OBJECT_IDENTITY_EVIDENCE_READINESS_PATH,
  OBJECT_IDENTITY_EVIDENCE_STATUS,
  writeObjectIdentityEvidenceReport,
} from '../services/objectIdentityEvidence.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeObjectIdentityEvidenceReport(projectRoot);

const protocol = JSON.parse(
  fs.readFileSync(path.join(projectRoot, OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH), 'utf8')
) as {
  evidence_defined: boolean;
  pass_threshold: number;
  object_degradation_levels: {
    minor_drift: number;
    moderate_drift: number;
    critical_drift: number;
    identity_break: number;
  };
  object_role_thresholds: {
    hero_prop: number;
    secondary_prop: number;
    background_object: number;
  };
  object_identity_tiers: unknown[];
  object_failure_examples: string[];
  false_positive_examples: string[];
  false_negative_examples: string[];
  object_measurement_rules: Record<string, string>;
  object_scoring_rules: Record<string, string>;
  object_traceability_rules: Record<string, string>;
  example_evidence_record: {
    object_id: string;
    reference_bank_id: string;
    identity_signature: string;
    traceability_score: number;
  };
};

const dataset = JSON.parse(
  fs.readFileSync(path.join(projectRoot, OBJECT_IDENTITY_EVIDENCE_DATASET_PATH), 'utf8')
) as {
  dataset_defined: boolean;
  minimum_batch_size: number;
  easy_batch: unknown[];
  medium_batch: unknown[];
  hard_batch: unknown[];
  stress_batch: Array<{ stress_mode: string }>;
  hero_prop_batch: unknown[];
  secondary_prop_batch: unknown[];
  background_object_batch: unknown[];
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `evidence_contract_defined=${report.evidence_contract_defined}`,
    `measurement_rules_defined=${report.measurement_rules_defined}`,
    `scoring_rules_defined=${report.scoring_rules_defined}`,
    `traceability_rules_defined=${report.traceability_rules_defined}`,
    `object_degradation_levels_defined=${report.object_degradation_levels_defined}`,
    `object_identity_tiers_defined=${report.object_identity_tiers_defined}`,
    `false_positive_examples_defined=${report.false_positive_examples_defined}`,
    `false_negative_examples_defined=${report.false_negative_examples_defined}`,
    `stress_batch_defined=${report.stress_batch_defined}`,
    `hero_prop_batch_defined=${report.hero_prop_batch_defined}`,
    `object_recoverability_defined=${report.object_recoverability_defined}`,
    `dataset_defined=${report.dataset_defined}`,
    `readiness_defined=${report.readiness_defined}`,
    `evidence_collection_ready=${report.evidence_collection_ready}`,
    `execution_ready=${report.execution_ready}`,
    `highest_risk_area=${report.highest_risk_area}`,
    `hero_prop_expected_pass_rate=${report.hero_prop_expected_pass_rate}`,
    `object_recoverability=${report.object_recoverability}`,
    `evidence_sufficient_for_gpu_authorization=${report.evidence_sufficient_for_gpu_authorization}`,
    `object_validated=${report.object_validated}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  OBJECT_IDENTITY_EVIDENCE_DATASET_PATH,
  OBJECT_IDENTITY_EVIDENCE_READINESS_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== OBJECT_IDENTITY_EVIDENCE_PASS_VERDICT) {
  console.error('OBJECT IDENTITY EVIDENCE DEFINITION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== OBJECT_IDENTITY_EVIDENCE_STATUS) {
  console.error(`STATUS FAIL: expected ${OBJECT_IDENTITY_EVIDENCE_STATUS}`);
  process.exit(1);
}

if (
  !report.evidence_contract_defined ||
  !report.measurement_rules_defined ||
  !report.scoring_rules_defined ||
  !report.traceability_rules_defined ||
  !report.object_degradation_levels_defined ||
  !report.object_identity_tiers_defined ||
  !report.false_positive_examples_defined ||
  !report.false_negative_examples_defined ||
  !report.stress_batch_defined ||
  !report.hero_prop_batch_defined ||
  !report.object_recoverability_defined ||
  !report.dataset_defined ||
  !report.readiness_defined ||
  !protocol.evidence_defined ||
  !dataset.dataset_defined
) {
  console.error('PASS CONDITION FAIL: object evidence definition checks not met');
  process.exit(1);
}

if (report.evidence_sufficient_for_gpu_authorization !== false) {
  console.error('GPU AUTHORIZATION FAIL: evidence_sufficient_for_gpu_authorization must remain false');
  process.exit(1);
}

if (
  report.object_validated ||
  report.gpu_validation_executed ||
  report.execution_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify validation executed or object validated');
  process.exit(1);
}

const degradation = protocol.object_degradation_levels;
if (
  degradation.minor_drift !== 0.85 ||
  degradation.moderate_drift !== 0.7 ||
  degradation.critical_drift !== 0.5 ||
  degradation.identity_break !== 0.3
) {
  console.error('DEGRADATION LEVELS FAIL: required object degradation thresholds not met');
  process.exit(1);
}

const roles = protocol.object_role_thresholds;
if (roles.hero_prop !== 0.98 || roles.secondary_prop !== 0.9 || roles.background_object !== 0.75) {
  console.error('ROLE THRESHOLDS FAIL: hero_prop=0.98, secondary_prop=0.90, background_object=0.75');
  process.exit(1);
}

if (
  !protocol.false_positive_examples.includes('similar_suitcase_wrong_pattern') ||
  !protocol.false_negative_examples.includes('same_suitcase_different_lighting')
) {
  console.error('EXAMPLE FAIL: required false positive/negative examples missing');
  process.exit(1);
}

const requiredObjectFailures = [
  'missing_accessory',
  'shape_change',
  'identity_swap',
  'hallucinated_object',
  'texture_drift',
];
for (const example of requiredObjectFailures) {
  if (!protocol.object_failure_examples.includes(example)) {
    console.error(`OBJECT FAILURE EXAMPLE MISSING: ${example}`);
    process.exit(1);
  }
}

if (report.highest_risk_area !== 'hero_prop_identity') {
  console.error('HIGHEST RISK AREA FAIL: expected hero_prop_identity');
  process.exit(1);
}

if (report.hero_prop_expected_pass_rate !== 0.2) {
  console.error('HERO PROP PASS RATE FAIL: hero_prop_expected_pass_rate=0.20 required');
  process.exit(1);
}

if (report.object_recoverability !== 'MEDIUM') {
  console.error('OBJECT RECOVERABILITY FAIL: expected MEDIUM');
  process.exit(1);
}

if (protocol.pass_threshold !== 0.97) {
  console.error('PASS THRESHOLD FAIL: pass_threshold=0.97 required');
  process.exit(1);
}

if (protocol.object_identity_tiers.length < 3) {
  console.error('OBJECT IDENTITY TIERS FAIL: at least 3 tiers required');
  process.exit(1);
}

const stressModes = dataset.stress_batch.map((entry) => entry.stress_mode);
for (const mode of ['extreme_zoom', 'partial_occlusion', 'accessory_visibility_loss']) {
  if (!stressModes.includes(mode)) {
    console.error(`STRESS BATCH FAIL: missing stress_mode ${mode}`);
    process.exit(1);
  }
}

if (dataset.hero_prop_batch.length === 0) {
  console.error('HERO PROP BATCH FAIL: hero_prop_batch required');
  process.exit(1);
}

if (dataset.minimum_batch_size !== 40) {
  console.error('DATASET FAIL: minimum_batch_size=40 required');
  process.exit(1);
}

if (
  Object.keys(protocol.object_measurement_rules).length === 0 ||
  Object.keys(protocol.object_scoring_rules).length === 0 ||
  Object.keys(protocol.object_traceability_rules).length === 0
) {
  console.error('RULES FAIL: measurement, scoring, and traceability rules required');
  process.exit(1);
}

const example = protocol.example_evidence_record;
if (
  !example.object_id ||
  !example.reference_bank_id ||
  !example.identity_signature ||
  typeof example.traceability_score !== 'number'
) {
  console.error('EXAMPLE EVIDENCE RECORD FAIL: required fields missing');
  process.exit(1);
}

process.exit(0);
