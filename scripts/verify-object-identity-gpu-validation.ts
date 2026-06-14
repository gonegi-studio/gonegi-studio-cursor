import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OBJECT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH,
  OBJECT_IDENTITY_GPU_VALIDATION_PASS_VERDICT,
  OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
  OBJECT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
  OBJECT_IDENTITY_GPU_VALIDATION_STATUS,
  writeObjectIdentityGpuValidationReport,
} from '../services/objectIdentityGpuValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeObjectIdentityGpuValidationReport(projectRoot);

const protocol = JSON.parse(
  fs.readFileSync(path.join(projectRoot, OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH), 'utf8')
) as {
  object_validation_defined: boolean;
  object_drift_levels: {
    same_object: number;
    strict_object: number;
    similar_object: number;
    different_object: number;
  };
  object_degradation_levels: {
    minor_drift: number;
    moderate_drift: number;
    critical_drift: number;
  };
  object_role_thresholds: {
    hero_prop: number;
    secondary_prop: number;
    background_object: number;
  };
  object_identity_tiers: unknown[];
  object_failure_examples: string[];
  tiers: Array<{ difficulty_tier: string; failure_examples: string[] }>;
};

const datasetPlan = JSON.parse(
  fs.readFileSync(path.join(projectRoot, OBJECT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH), 'utf8')
) as {
  dataset_plan_defined: boolean;
  minimum_batch_size: number;
  easy_cases: unknown[];
  medium_cases: unknown[];
  hard_cases: unknown[];
  hero_prop_cases: unknown[];
  secondary_prop_cases: unknown[];
  background_object_cases: unknown[];
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `object_validation_defined=${report.object_validation_defined}`,
    `same_object_criteria_defined=${report.same_object_criteria_defined}`,
    `drift_levels_defined=${report.drift_levels_defined}`,
    `degradation_levels_defined=${report.degradation_levels_defined}`,
    `object_identity_tiers_defined=${report.object_identity_tiers_defined}`,
    `failure_criteria_defined=${report.failure_criteria_defined}`,
    `role_thresholds_defined=${report.role_thresholds_defined}`,
    `object_failure_examples_defined=${report.object_failure_examples_defined}`,
    `dataset_plan_defined=${report.dataset_plan_defined}`,
    `expected_pass_rate_defined=${report.expected_pass_rate_defined}`,
    `hero_prop_expected_pass_rate_defined=${report.hero_prop_expected_pass_rate_defined}`,
    `readiness_defined=${report.readiness_defined}`,
    `validation_ready=${report.validation_ready}`,
    `execution_ready=${report.execution_ready}`,
    `highest_risk_area=${report.highest_risk_area}`,
    `hero_prop_expected_pass_rate=${report.hero_prop_expected_pass_rate}`,
    `hard.expected_pass_rate=${report.expected_pass_rate.hard}`,
    `object_identity_validated=${report.object_identity_validated}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
  OBJECT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH,
  OBJECT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== OBJECT_IDENTITY_GPU_VALIDATION_PASS_VERDICT) {
  console.error('OBJECT IDENTITY GPU VALIDATION DEFINITION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== OBJECT_IDENTITY_GPU_VALIDATION_STATUS) {
  console.error(`STATUS FAIL: expected ${OBJECT_IDENTITY_GPU_VALIDATION_STATUS}`);
  process.exit(1);
}

if (
  !report.object_validation_defined ||
  !report.same_object_criteria_defined ||
  !report.drift_levels_defined ||
  !report.degradation_levels_defined ||
  !report.object_identity_tiers_defined ||
  !report.failure_criteria_defined ||
  !report.role_thresholds_defined ||
  !report.object_failure_examples_defined ||
  !report.dataset_plan_defined ||
  !report.expected_pass_rate_defined ||
  !report.hero_prop_expected_pass_rate_defined ||
  !report.readiness_defined ||
  !protocol.object_validation_defined ||
  !datasetPlan.dataset_plan_defined
) {
  console.error('PASS CONDITION FAIL: object GPU validation definition checks not met');
  process.exit(1);
}

if (
  report.object_identity_validated ||
  report.gpu_validation_executed ||
  report.execution_ready ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify validation executed or readiness flags');
  process.exit(1);
}

const drift = protocol.object_drift_levels;
if (
  drift.same_object !== 0.97 ||
  drift.strict_object !== 0.95 ||
  drift.similar_object !== 0.8 ||
  drift.different_object !== 0.5
) {
  console.error('DRIFT LEVELS FAIL: required object thresholds not met');
  process.exit(1);
}

const degradation = protocol.object_degradation_levels;
if (
  degradation.minor_drift !== 0.85 ||
  degradation.moderate_drift !== 0.7 ||
  degradation.critical_drift !== 0.5
) {
  console.error('DEGRADATION LEVELS FAIL: required object degradation thresholds not met');
  process.exit(1);
}

const roles = protocol.object_role_thresholds;
if (roles.hero_prop !== 0.98 || roles.secondary_prop !== 0.9 || roles.background_object !== 0.75) {
  console.error('ROLE THRESHOLDS FAIL: hero_prop=0.98, secondary_prop=0.90, background_object=0.75');
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

if (protocol.object_identity_tiers.length < 3) {
  console.error('OBJECT IDENTITY TIERS FAIL: at least 3 tiers required');
  process.exit(1);
}

if (datasetPlan.minimum_batch_size !== 40) {
  console.error('DATASET PLAN FAIL: minimum_batch_size=40 required');
  process.exit(1);
}

if (
  datasetPlan.hero_prop_cases.length === 0 ||
  datasetPlan.secondary_prop_cases.length === 0 ||
  datasetPlan.background_object_cases.length === 0
) {
  console.error('ROLE CASES FAIL: hero_prop, secondary_prop, and background_object cases required');
  process.exit(1);
}

const hardTier = protocol.tiers.find((tier) => tier.difficulty_tier === 'hard');
if (!hardTier || hardTier.failure_examples.length === 0) {
  console.error('HARD TIER FAILURE EXAMPLES FAIL');
  process.exit(1);
}

process.exit(0);
