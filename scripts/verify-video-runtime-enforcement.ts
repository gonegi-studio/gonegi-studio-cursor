import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GPU_VALIDATION_ENTRY_CRITERIA_PATH,
  RUNTIME_ENFORCEMENT_READINESS_REPORT_PATH,
  VIDEO_RUNTIME_ENFORCEMENT_PASS_VERDICT,
  VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL_PATH,
  VIDEO_RUNTIME_ENFORCEMENT_STATUS,
  writeVideoRuntimeEnforcementReport,
} from '../services/videoRuntimeEnforcement.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeVideoRuntimeEnforcementReport(projectRoot);

const protocol = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL_PATH), 'utf8')
) as {
  enforcement_protocol_defined: boolean;
  channels: Array<{
    runtime_channel: string;
    enforcement_level: string;
    success_conditions: string[];
    failure_conditions: string[];
    measurement_method: string[];
    expected_degradation_path: string[];
    minimum_validation_batch_size: number;
  }>;
};

const readiness = JSON.parse(
  fs.readFileSync(path.join(projectRoot, RUNTIME_ENFORCEMENT_READINESS_REPORT_PATH), 'utf8')
) as {
  validated_channels: string[];
  non_validated_channels: string[];
  highest_risk_channel: string;
  channel_batch_requirements: Array<{ runtime_channel: string; minimum_validation_batch_size: number }>;
};

const entryCriteria = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GPU_VALIDATION_ENTRY_CRITERIA_PATH), 'utf8')
) as {
  required_conditions: string[];
  blocked_conditions: string[];
  ready_for_gpu_validation: boolean;
  gpu_entry_criteria_defined: boolean;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `runtime_enforcement_protocol_defined=${report.runtime_enforcement_protocol_defined}`,
    `enforcement_protocol_defined=${report.enforcement_protocol_defined}`,
    `success_conditions_defined=${report.success_conditions_defined}`,
    `failure_conditions_defined=${report.failure_conditions_defined}`,
    `measurement_methods_defined=${report.measurement_methods_defined}`,
    `degradation_rules_defined=${report.degradation_rules_defined}`,
    `minimum_validation_batch_sizes_defined=${report.minimum_validation_batch_sizes_defined}`,
    `gpu_entry_criteria_defined=${report.gpu_entry_criteria_defined}`,
    `runtime_enforced=${report.runtime_enforced}`,
    `gpu_validated=${report.gpu_validated}`,
    `highest_risk_channel=${readiness.highest_risk_channel}`,
    `ready_for_gpu_validation=${entryCriteria.ready_for_gpu_validation}`,
  ].join(' | ')
);

for (const rel of [
  VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL_PATH,
  RUNTIME_ENFORCEMENT_READINESS_REPORT_PATH,
  GPU_VALIDATION_ENTRY_CRITERIA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== VIDEO_RUNTIME_ENFORCEMENT_PASS_VERDICT) {
  console.error('VIDEO RUNTIME ENFORCEMENT VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== VIDEO_RUNTIME_ENFORCEMENT_STATUS) {
  console.error(`STATUS FAIL: expected ${VIDEO_RUNTIME_ENFORCEMENT_STATUS}`);
  process.exit(1);
}

if (
  !report.runtime_enforcement_protocol_defined ||
  !report.enforcement_protocol_defined ||
  !report.success_conditions_defined ||
  !report.failure_conditions_defined ||
  !report.measurement_methods_defined ||
  !report.degradation_rules_defined ||
  !report.minimum_validation_batch_sizes_defined ||
  !report.gpu_entry_criteria_defined ||
  !protocol.enforcement_protocol_defined ||
  !entryCriteria.gpu_entry_criteria_defined
) {
  console.error('PASS CONDITION FAIL: enforcement protocol checks not met');
  process.exit(1);
}

if (
  report.runtime_enforced ||
  report.gpu_validated ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready ||
  entryCriteria.ready_for_gpu_validation
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify runtime_enforced or gpu_validated');
  process.exit(1);
}

const envChannel = protocol.channels.find(
  (channel) => channel.runtime_channel === 'environment_identity'
);
if (
  !envChannel ||
  envChannel.enforcement_level !== 'STRICT' ||
  !envChannel.success_conditions.includes('reference_bank_match') ||
  !envChannel.failure_conditions.includes('reference_drift') ||
  envChannel.minimum_validation_batch_size !== 50
) {
  console.error('ENVIRONMENT PROTOCOL EXAMPLE FAIL');
  process.exit(1);
}

const envBatch = readiness.channel_batch_requirements.find(
  (entry) => entry.runtime_channel === 'environment_identity'
);
if (!envBatch || envBatch.minimum_validation_batch_size !== 50) {
  console.error('ENVIRONMENT BATCH SIZE FAIL: minimum_validation_batch_size=50 required');
  process.exit(1);
}

if (
  readiness.validated_channels.length === 0 ||
  readiness.non_validated_channels.length === 0 ||
  readiness.highest_risk_channel !== 'environment_identity'
) {
  console.error('READINESS REPORT FAIL: channel classification incomplete');
  process.exit(1);
}

if (entryCriteria.required_conditions.length === 0 || entryCriteria.blocked_conditions.length === 0) {
  console.error('GPU ENTRY CRITERIA FAIL: required and blocked conditions required');
  process.exit(1);
}

process.exit(0);
