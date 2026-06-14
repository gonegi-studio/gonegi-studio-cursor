import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHANNEL_VALIDATION_ROADMAP_PATH,
  GPU_EXECUTION_READINESS_REPORT_PATH,
  GPU_VALIDATION_CAMPAIGN_PASS_VERDICT,
  GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
  GPU_VALIDATION_CAMPAIGN_STATUS,
  GPU_VALIDATION_RISK_REPORT_PATH,
  writeGpuValidationCampaignReport,
} from '../services/gpuValidationCampaign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeGpuValidationCampaignReport(projectRoot);

const campaign = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GPU_VALIDATION_CAMPAIGN_REPORT_PATH), 'utf8')
) as {
  stages: Array<{
    validation_stage: string;
    validation_exit_criteria: { pass_rate: number; same_environment_score?: number };
  }>;
  validation_stage_order: string[];
};

const risk = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GPU_VALIDATION_RISK_REPORT_PATH), 'utf8')
) as {
  highest_risk_channel: string;
  expected_failure_modes: unknown[];
  campaign_abort_conditions: string[];
};

const readiness = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GPU_EXECUTION_READINESS_REPORT_PATH), 'utf8')
) as {
  execution_readiness_defined: boolean;
  ready_channels: string[];
  blocked_channels: string[];
  gpu_execution_allowed: boolean;
};

const roadmap = JSON.parse(
  fs.readFileSync(path.join(projectRoot, CHANNEL_VALIDATION_ROADMAP_PATH), 'utf8')
) as {
  channel_validation_roadmap_defined: boolean;
  channel_phase_order: Array<{ phase: string; phase_name: string }>;
  next_channel_phase: string;
  deferred_channels: string[];
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `gpu_validation_campaign_defined=${report.gpu_validation_campaign_defined}`,
    `campaign_defined=${report.campaign_defined}`,
    `stage_order_defined=${report.stage_order_defined}`,
    `stop_conditions_defined=${report.stop_conditions_defined}`,
    `escalation_rules_defined=${report.escalation_rules_defined}`,
    `exit_criteria_defined=${report.exit_criteria_defined}`,
    `execution_readiness_defined=${report.execution_readiness_defined}`,
    `channel_validation_roadmap_defined=${report.channel_validation_roadmap_defined}`,
    `gpu_validation_executed=${report.gpu_validation_executed}`,
    `gpu_execution_allowed=${readiness.gpu_execution_allowed}`,
    `next_channel_phase=${roadmap.next_channel_phase}`,
  ].join(' | ')
);

for (const rel of [
  GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
  GPU_VALIDATION_RISK_REPORT_PATH,
  GPU_EXECUTION_READINESS_REPORT_PATH,
  CHANNEL_VALIDATION_ROADMAP_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== GPU_VALIDATION_CAMPAIGN_PASS_VERDICT) {
  console.error('GPU VALIDATION CAMPAIGN VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== GPU_VALIDATION_CAMPAIGN_STATUS) {
  console.error(`STATUS FAIL: expected ${GPU_VALIDATION_CAMPAIGN_STATUS}`);
  process.exit(1);
}

if (
  !report.gpu_validation_campaign_defined ||
  !report.campaign_defined ||
  !report.stage_order_defined ||
  !report.stop_conditions_defined ||
  !report.escalation_rules_defined ||
  !report.exit_criteria_defined ||
  !report.execution_readiness_defined ||
  !report.channel_validation_roadmap_defined
) {
  console.error('PASS CONDITION FAIL: campaign definition checks not met');
  process.exit(1);
}

if (
  report.gpu_validation_executed ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready ||
  readiness.gpu_execution_allowed
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify gpu_validation_executed or gpu_execution_allowed');
  process.exit(1);
}

const envStage = campaign.stages.find((stage) => stage.validation_stage === 'environment_identity');
if (
  !envStage ||
  envStage.validation_exit_criteria.pass_rate !== 0.8 ||
  envStage.validation_exit_criteria.same_environment_score !== 0.95
) {
  console.error('ENVIRONMENT EXIT CRITERIA EXAMPLE FAIL');
  process.exit(1);
}

if (
  risk.highest_risk_channel !== 'environment_identity' ||
  risk.expected_failure_modes.length === 0 ||
  risk.campaign_abort_conditions.length === 0
) {
  console.error('RISK REPORT FAIL');
  process.exit(1);
}

if (
  !readiness.execution_readiness_defined ||
  readiness.ready_channels.length === 0 ||
  readiness.blocked_channels.length === 0
) {
  console.error('EXECUTION READINESS FAIL');
  process.exit(1);
}

if (
  !roadmap.channel_validation_roadmap_defined ||
  roadmap.next_channel_phase !== 'PHASE-GPU-CONDITIONING-VALIDATION-005A' ||
  roadmap.channel_phase_order.length !== 3 ||
  roadmap.deferred_channels.length === 0
) {
  console.error('CHANNEL ROADMAP FAIL');
  process.exit(1);
}

const firstPhase = roadmap.channel_phase_order[0];
if (firstPhase.phase_name !== 'ENVIRONMENT_IDENTITY_GPU_VALIDATION_V1') {
  console.error('ROADMAP PRIORITY FAIL: environment_identity must be first');
  process.exit(1);
}

if (campaign.validation_stage_order[0] !== 'environment_identity') {
  console.error('STAGE ORDER FAIL: environment_identity must be first');
  process.exit(1);
}

process.exit(0);
