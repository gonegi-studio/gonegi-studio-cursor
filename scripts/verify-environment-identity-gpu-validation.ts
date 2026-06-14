import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH,
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_PASS_VERDICT,
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_STATUS,
  writeEnvironmentIdentityGpuValidationReport,
} from '../services/environmentIdentityGpuValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeEnvironmentIdentityGpuValidationReport(projectRoot);

const protocol = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH), 'utf8')
) as {
  environment_validation_defined: boolean;
  environment_drift_levels: {
    same_environment: number;
    strict_environment: number;
    similar_environment: number;
    different_environment: number;
  };
  reference_bank_recall_rules: {
    required_reference_count: number;
    minimum_anchor_match: number;
  };
  tiers: Array<{ difficulty_tier: string; failure_examples: string[] }>;
};

const datasetPlan = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH), 'utf8')
) as {
  dataset_plan_defined: boolean;
  minimum_batch_size: number;
  easy_cases: unknown[];
  medium_cases: unknown[];
  hard_cases: unknown[];
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `environment_validation_defined=${report.environment_validation_defined}`,
    `same_environment_criteria_defined=${report.same_environment_criteria_defined}`,
    `similar_environment_criteria_defined=${report.similar_environment_criteria_defined}`,
    `drift_levels_defined=${report.drift_levels_defined}`,
    `failure_criteria_defined=${report.failure_criteria_defined}`,
    `reference_bank_recall_rules_defined=${report.reference_bank_recall_rules_defined}`,
    `dataset_plan_defined=${report.dataset_plan_defined}`,
    `expected_pass_rate_defined=${report.expected_pass_rate_defined}`,
    `readiness_defined=${report.readiness_defined}`,
    `validation_ready=${report.validation_ready}`,
    `execution_ready=${report.execution_ready}`,
    `hard.expected_pass_rate=${report.expected_pass_rate.hard}`,
    `environment_identity_validated=${report.environment_identity_validated}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH,
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== ENVIRONMENT_IDENTITY_GPU_VALIDATION_PASS_VERDICT) {
  console.error('ENVIRONMENT IDENTITY GPU VALIDATION DEFINITION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== ENVIRONMENT_IDENTITY_GPU_VALIDATION_STATUS) {
  console.error(`STATUS FAIL: expected ${ENVIRONMENT_IDENTITY_GPU_VALIDATION_STATUS}`);
  process.exit(1);
}

if (
  !report.environment_validation_defined ||
  !report.same_environment_criteria_defined ||
  !report.similar_environment_criteria_defined ||
  !report.drift_levels_defined ||
  !report.failure_criteria_defined ||
  !report.reference_bank_recall_rules_defined ||
  !report.dataset_plan_defined ||
  !report.expected_pass_rate_defined ||
  !report.readiness_defined ||
  !protocol.environment_validation_defined ||
  !datasetPlan.dataset_plan_defined
) {
  console.error('PASS CONDITION FAIL: environment GPU validation definition checks not met');
  process.exit(1);
}

if (
  report.environment_identity_validated ||
  report.gpu_validation_executed ||
  report.execution_ready ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify validation executed or readiness flags');
  process.exit(1);
}

const drift = protocol.environment_drift_levels;
if (
  drift.same_environment !== 0.98 ||
  drift.strict_environment !== 0.95 ||
  drift.similar_environment !== 0.8 ||
  drift.different_environment !== 0.5
) {
  console.error('DRIFT LEVELS FAIL: required thresholds not met');
  process.exit(1);
}

if (
  protocol.reference_bank_recall_rules.required_reference_count !== 5 ||
  protocol.reference_bank_recall_rules.minimum_anchor_match !== 3
) {
  console.error('RECALL RULES FAIL: required_reference_count=5, minimum_anchor_match=3');
  process.exit(1);
}

if (report.expected_pass_rate.hard !== 0.15) {
  console.error('EXPECTED PASS RATE FAIL: hard.expected_pass_rate=0.15 required');
  process.exit(1);
}

if (datasetPlan.minimum_batch_size !== 50) {
  console.error('DATASET PLAN FAIL: minimum_batch_size=50 required');
  process.exit(1);
}

const hardTier = protocol.tiers.find((tier) => tier.difficulty_tier === 'hard');
if (
  !hardTier ||
  !hardTier.failure_examples.includes('different_staircase') ||
  !hardTier.failure_examples.includes('missing_railing')
) {
  console.error('HARD TIER FAILURE EXAMPLES FAIL');
  process.exit(1);
}

process.exit(0);
