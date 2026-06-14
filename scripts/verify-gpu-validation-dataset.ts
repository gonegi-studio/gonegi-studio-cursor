import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GPU_VALIDATION_COVERAGE_REPORT_PATH,
  GPU_VALIDATION_DATASET_DIR,
  GPU_VALIDATION_DATASET_PASS_VERDICT,
  GPU_VALIDATION_DATASET_REPORT_PATH,
  GPU_VALIDATION_DATASET_STATUS,
  GPU_VALIDATION_EXECUTION_PLAN_PATH,
  writeGpuValidationDatasetReport,
} from '../services/gpuValidationDataset.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeGpuValidationDatasetReport(projectRoot);

const datasetReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GPU_VALIDATION_DATASET_REPORT_PATH), 'utf8')
) as {
  channels: Array<{
    validation_channel: string;
    difficulty_tiers: string[];
    failure_examples: string[];
  }>;
};

const coverage = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GPU_VALIDATION_COVERAGE_REPORT_PATH), 'utf8')
) as {
  covered_channels: string[];
  coverage_ratio: number;
  highest_risk_channel: string;
};

const executionPlan = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GPU_VALIDATION_EXECUTION_PLAN_PATH), 'utf8')
) as {
  execution_plan_defined: boolean;
  channel_priority: string[];
  failure_escalation_rules: string[];
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `validation_datasets_defined=${report.validation_datasets_defined}`,
    `measurement_methods_linked=${report.measurement_methods_linked}`,
    `pass_thresholds_defined=${report.pass_thresholds_defined}`,
    `difficulty_tiers_defined=${report.difficulty_tiers_defined}`,
    `failure_examples_defined=${report.failure_examples_defined}`,
    `execution_plan_defined=${report.execution_plan_defined}`,
    `channel_priority_defined=${report.channel_priority_defined}`,
    `coverage_ratio=${coverage.coverage_ratio}`,
    `highest_risk_channel=${coverage.highest_risk_channel}`,
    `gpu_validation_executed=${report.gpu_validation_executed}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  GPU_VALIDATION_DATASET_REPORT_PATH,
  GPU_VALIDATION_COVERAGE_REPORT_PATH,
  GPU_VALIDATION_EXECUTION_PLAN_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

const datasetDir = path.join(projectRoot, GPU_VALIDATION_DATASET_DIR);
if (!fs.existsSync(datasetDir)) {
  console.error(`DATASET DIR MISSING: ${GPU_VALIDATION_DATASET_DIR}`);
  process.exit(1);
}

if (report.final_verdict !== GPU_VALIDATION_DATASET_PASS_VERDICT) {
  console.error('GPU VALIDATION DATASET VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== GPU_VALIDATION_DATASET_STATUS) {
  console.error(`STATUS FAIL: expected ${GPU_VALIDATION_DATASET_STATUS}`);
  process.exit(1);
}

if (
  !report.validation_datasets_defined ||
  !report.measurement_methods_linked ||
  !report.pass_thresholds_defined ||
  !report.difficulty_tiers_defined ||
  !report.failure_examples_defined ||
  !report.execution_plan_defined ||
  !report.channel_priority_defined
) {
  console.error('PASS CONDITION FAIL: dataset definition checks not met');
  process.exit(1);
}

if (
  report.gpu_validation_executed ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify gpu_validation_executed or readiness');
  process.exit(1);
}

const envChannel = datasetReport.channels.find(
  (entry) => entry.validation_channel === 'environment_identity'
);
if (
  !envChannel ||
  !envChannel.difficulty_tiers.includes('hard') ||
  !envChannel.failure_examples.includes('different_staircase')
) {
  console.error('ENVIRONMENT DATASET EXAMPLE FAIL');
  process.exit(1);
}

if (coverage.coverage_ratio !== 1 || coverage.highest_risk_channel !== 'environment_identity') {
  console.error('COVERAGE FAIL: full coverage and environment_identity highest risk required');
  process.exit(1);
}

if (
  !executionPlan.execution_plan_defined ||
  executionPlan.channel_priority[0] !== 'environment_identity' ||
  executionPlan.channel_priority.length !== 5 ||
  executionPlan.failure_escalation_rules.length === 0
) {
  console.error('EXECUTION PLAN FAIL');
  process.exit(1);
}

process.exit(0);
