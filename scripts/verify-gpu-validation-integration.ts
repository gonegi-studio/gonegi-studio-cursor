import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GPU_VALIDATION_EXECUTION_SEQUENCE_PATH,
  GPU_VALIDATION_INTEGRATION_PASS_VERDICT,
  GPU_VALIDATION_INTEGRATION_REPORT_PATH,
  GPU_VALIDATION_INTEGRATION_STATUS,
  GPU_VALIDATION_MASTER_READINESS_PATH,
  writeGpuValidationIntegrationReport,
} from '../services/gpuValidationIntegration.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeGpuValidationIntegrationReport(projectRoot);

const integrationReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GPU_VALIDATION_INTEGRATION_REPORT_PATH), 'utf8')
) as {
  validation_integration_defined: boolean;
  validation_priority_order: string[];
  channel_abort_rules: Record<string, { abort_below: number }>;
  cross_channel_failure_rules: Record<string, string>;
  cross_channel_dependencies: Record<string, string[]>;
};

const executionSequence = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GPU_VALIDATION_EXECUTION_SEQUENCE_PATH), 'utf8')
) as {
  execution_sequence_defined: boolean;
  retry_rules_defined: boolean;
  stage_order: string[];
  stages: Array<{ stage: string; max_retry: number }>;
  retry_rules: { default_max_retry: number };
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `validation_integration_defined=${report.validation_integration_defined}`,
    `integration_contract_defined=${report.integration_contract_defined}`,
    `dependency_rules_defined=${report.dependency_rules_defined}`,
    `failure_rules_defined=${report.failure_rules_defined}`,
    `channel_abort_rules_defined=${report.channel_abort_rules_defined}`,
    `execution_sequence_defined=${report.execution_sequence_defined}`,
    `retry_rules_defined=${report.retry_rules_defined}`,
    `master_readiness_defined=${report.master_readiness_defined}`,
    `evidence_layer_ready=${report.evidence_layer_ready}`,
    `environment_ready=${report.environment_ready}`,
    `temporal_ready=${report.temporal_ready}`,
    `object_ready=${report.object_ready}`,
    `integration_ready=${report.integration_ready}`,
    `gpu_execution_allowed=${report.gpu_execution_allowed}`,
    `highest_risk_channel=${report.highest_risk_channel}`,
    `gpu_validation_executed=${report.gpu_validation_executed}`,
    `environment_validated=${report.environment_validated}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  GPU_VALIDATION_INTEGRATION_REPORT_PATH,
  GPU_VALIDATION_EXECUTION_SEQUENCE_PATH,
  GPU_VALIDATION_MASTER_READINESS_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== GPU_VALIDATION_INTEGRATION_PASS_VERDICT) {
  console.error('GPU VALIDATION INTEGRATION DEFINITION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== GPU_VALIDATION_INTEGRATION_STATUS) {
  console.error(`STATUS FAIL: expected ${GPU_VALIDATION_INTEGRATION_STATUS}`);
  process.exit(1);
}

if (
  !report.integration_contract_defined ||
  !report.dependency_rules_defined ||
  !report.failure_rules_defined ||
  !report.channel_abort_rules_defined ||
  !report.execution_sequence_defined ||
  !report.retry_rules_defined ||
  !report.master_readiness_defined ||
  report.evidence_layer_ready !== true ||
  !integrationReport.validation_integration_defined ||
  !executionSequence.execution_sequence_defined
) {
  console.error('PASS CONDITION FAIL: GPU validation integration definition checks not met');
  process.exit(1);
}

if (
  report.gpu_validation_executed ||
  report.environment_validated ||
  report.temporal_validated ||
  report.object_validated ||
  report.gpu_execution_allowed ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify validation executed or channel validated');
  process.exit(1);
}

if (integrationReport.channel_abort_rules.environment_identity?.abort_below !== 0.3) {
  console.error('ABORT RULES FAIL: environment_identity abort_below=0.30 required');
  process.exit(1);
}

if (
  integrationReport.validation_priority_order[0] !== 'environment_identity' ||
  integrationReport.validation_priority_order[1] !== 'temporal_preservation' ||
  integrationReport.validation_priority_order[2] !== 'object_identity'
) {
  console.error('PRIORITY ORDER FAIL: environment -> temporal -> object required');
  process.exit(1);
}

if (
  !integrationReport.cross_channel_dependencies.temporal_preservation?.includes('environment_identity') ||
  !integrationReport.cross_channel_dependencies.object_identity?.includes('temporal_preservation')
) {
  console.error('DEPENDENCY RULES FAIL: cross-channel dependencies not wired');
  process.exit(1);
}

if (Object.keys(integrationReport.cross_channel_failure_rules).length === 0) {
  console.error('FAILURE RULES FAIL: cross_channel_failure_rules empty');
  process.exit(1);
}

if (executionSequence.stages.length !== 3) {
  console.error('EXECUTION SEQUENCE FAIL: three stages required');
  process.exit(1);
}

const envStage = executionSequence.stages.find((stage) => stage.stage === 'environment_identity');
if (!envStage || envStage.max_retry !== 2) {
  console.error('RETRY RULES FAIL: environment_identity max_retry=2 required');
  process.exit(1);
}

if (executionSequence.retry_rules.default_max_retry !== 2) {
  console.error('RETRY RULES FAIL: default_max_retry=2 required');
  process.exit(1);
}

if (!report.environment_ready || !report.temporal_ready || !report.object_ready) {
  console.error('CHANNEL READINESS FAIL: all channel protocols must be validation_ready');
  process.exit(1);
}

if (report.highest_risk_channel !== 'environment_identity') {
  console.error('HIGHEST RISK CHANNEL FAIL: expected environment_identity');
  process.exit(1);
}

process.exit(0);
