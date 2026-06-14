import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TEMPORAL_PRESERVATION_GPU_VALIDATION_DATASET_PLAN_PATH,
  TEMPORAL_PRESERVATION_GPU_VALIDATION_PASS_VERDICT,
  TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL_PATH,
  TEMPORAL_PRESERVATION_GPU_VALIDATION_READINESS_PATH,
  TEMPORAL_PRESERVATION_GPU_VALIDATION_STATUS,
  writeTemporalPreservationGpuValidationReport,
} from '../services/temporalPreservationGpuValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTemporalPreservationGpuValidationReport(projectRoot);

const protocol = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL_PATH), 'utf8')
) as {
  temporal_validation_defined: boolean;
  temporal_drift_levels: {
    same_timeline: number;
    strict_timeline: number;
    similar_timeline: number;
    broken_timeline: number;
  };
  timeline_degradation_levels: {
    minor_drift: number;
    moderate_drift: number;
    critical_drift: number;
  };
  transition_failure_examples: string[];
  tiers: Array<{ difficulty_tier: string; failure_examples: string[] }>;
};

const datasetPlan = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_PRESERVATION_GPU_VALIDATION_DATASET_PLAN_PATH), 'utf8')
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
    `temporal_validation_defined=${report.temporal_validation_defined}`,
    `same_timeline_criteria_defined=${report.same_timeline_criteria_defined}`,
    `drift_levels_defined=${report.drift_levels_defined}`,
    `timeline_degradation_levels_defined=${report.timeline_degradation_levels_defined}`,
    `failure_criteria_defined=${report.failure_criteria_defined}`,
    `transition_failure_examples_defined=${report.transition_failure_examples_defined}`,
    `dataset_plan_defined=${report.dataset_plan_defined}`,
    `expected_pass_rate_defined=${report.expected_pass_rate_defined}`,
    `readiness_defined=${report.readiness_defined}`,
    `validation_ready=${report.validation_ready}`,
    `execution_ready=${report.execution_ready}`,
    `highest_risk_area=${report.highest_risk_area}`,
    `hard.expected_pass_rate=${report.expected_pass_rate.hard}`,
    `temporal_preservation_validated=${report.temporal_preservation_validated}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL_PATH,
  TEMPORAL_PRESERVATION_GPU_VALIDATION_DATASET_PLAN_PATH,
  TEMPORAL_PRESERVATION_GPU_VALIDATION_READINESS_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TEMPORAL_PRESERVATION_GPU_VALIDATION_PASS_VERDICT) {
  console.error('TEMPORAL PRESERVATION GPU VALIDATION DEFINITION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== TEMPORAL_PRESERVATION_GPU_VALIDATION_STATUS) {
  console.error(`STATUS FAIL: expected ${TEMPORAL_PRESERVATION_GPU_VALIDATION_STATUS}`);
  process.exit(1);
}

if (
  !report.temporal_validation_defined ||
  !report.same_timeline_criteria_defined ||
  !report.drift_levels_defined ||
  !report.timeline_degradation_levels_defined ||
  !report.failure_criteria_defined ||
  !report.transition_failure_examples_defined ||
  !report.dataset_plan_defined ||
  !report.expected_pass_rate_defined ||
  !report.readiness_defined ||
  !protocol.temporal_validation_defined ||
  !datasetPlan.dataset_plan_defined
) {
  console.error('PASS CONDITION FAIL: temporal GPU validation definition checks not met');
  process.exit(1);
}

if (
  report.temporal_preservation_validated ||
  report.gpu_validation_executed ||
  report.execution_ready ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify validation executed or readiness flags');
  process.exit(1);
}

const drift = protocol.temporal_drift_levels;
if (
  drift.same_timeline !== 0.95 ||
  drift.strict_timeline !== 0.9 ||
  drift.similar_timeline !== 0.75 ||
  drift.broken_timeline !== 0.5
) {
  console.error('DRIFT LEVELS FAIL: required temporal thresholds not met');
  process.exit(1);
}

const degradation = protocol.timeline_degradation_levels;
if (
  degradation.minor_drift !== 0.85 ||
  degradation.moderate_drift !== 0.7 ||
  degradation.critical_drift !== 0.5
) {
  console.error('DEGRADATION LEVELS FAIL: required timeline degradation thresholds not met');
  process.exit(1);
}

const requiredTransitionFailures = [
  'character_position_jump',
  'missing_transition_cause',
  'edit_rhythm_break',
  'timeline_reset',
];
for (const example of requiredTransitionFailures) {
  if (!protocol.transition_failure_examples.includes(example)) {
    console.error(`TRANSITION FAILURE EXAMPLE MISSING: ${example}`);
    process.exit(1);
  }
}

if (report.highest_risk_area !== 'causal_transition_chain') {
  console.error('HIGHEST RISK AREA FAIL: expected causal_transition_chain');
  process.exit(1);
}

if (datasetPlan.minimum_batch_size !== 30) {
  console.error('DATASET PLAN FAIL: minimum_batch_size=30 required');
  process.exit(1);
}

const hardTier = protocol.tiers.find((tier) => tier.difficulty_tier === 'hard');
if (!hardTier || hardTier.failure_examples.length === 0) {
  console.error('HARD TIER FAILURE EXAMPLES FAIL');
  process.exit(1);
}

process.exit(0);
