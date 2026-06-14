import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  VIDEO_CONDITIONING_ARCHITECTURE_REPORT_PATH,
  VIDEO_CONDITIONING_BACKEND_PASS_VERDICT,
  VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH,
  VIDEO_CONDITIONING_BACKEND_STATUS,
  VIDEO_CONDITIONING_GAP_REPORT_PATH,
  writeVideoConditioningBackendReport,
} from '../services/videoConditioningBackend.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeVideoConditioningBackendReport(projectRoot);

const requirements = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH), 'utf8')
) as {
  channel_failure_modes: Array<{
    channel: string;
    runtime_enforcement_level: string;
    expected_runtime_failure_modes: string[];
  }>;
  required_runtime_channels: string[];
  critical_runtime_channels: string[];
};

const architecture = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_CONDITIONING_ARCHITECTURE_REPORT_PATH), 'utf8')
) as {
  selected_architecture: string;
  runtime_layers: string[];
  identity_layers: string[];
  temporal_layers: string[];
  continuity_layers: string[];
};

const gapReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_CONDITIONING_GAP_REPORT_PATH), 'utf8')
) as { defined: string[]; missing: string[]; remaining_blockers: string[]; next_phase: string };

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `video_backend_design_defined=${report.video_backend_design_defined}`,
    `video_conditioning_contract_defined=${report.video_conditioning_contract_defined}`,
    `environment_runtime_channel_defined=${report.environment_runtime_channel_defined}`,
    `object_runtime_channel_defined=${report.object_runtime_channel_defined}`,
    `temporal_runtime_channel_defined=${report.temporal_runtime_channel_defined}`,
    `camera_continuity_channel_defined=${report.camera_continuity_channel_defined}`,
    `multi_scene_consistency_channel_defined=${report.multi_scene_consistency_channel_defined}`,
    `runtime_enforcement_level_defined=${report.runtime_enforcement_level_defined}`,
    `expected_runtime_failure_modes_defined=${report.expected_runtime_failure_modes_defined}`,
    `video_backend_implemented=${report.video_backend_implemented}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `selected_architecture=${architecture.selected_architecture}`,
  ].join(' | ')
);

for (const rel of [
  VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH,
  VIDEO_CONDITIONING_ARCHITECTURE_REPORT_PATH,
  VIDEO_CONDITIONING_GAP_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== VIDEO_CONDITIONING_BACKEND_PASS_VERDICT) {
  console.error('VIDEO CONDITIONING BACKEND VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== VIDEO_CONDITIONING_BACKEND_STATUS) {
  console.error(`STATUS FAIL: expected ${VIDEO_CONDITIONING_BACKEND_STATUS}`);
  process.exit(1);
}

if (
  !report.video_backend_design_defined ||
  !report.video_conditioning_contract_defined ||
  !report.environment_runtime_channel_defined ||
  !report.object_runtime_channel_defined ||
  !report.temporal_runtime_channel_defined ||
  !report.camera_continuity_channel_defined ||
  !report.multi_scene_consistency_channel_defined ||
  !report.runtime_enforcement_level_defined ||
  !report.expected_runtime_failure_modes_defined
) {
  console.error('PASS CONDITION FAIL: video backend design checks not met');
  process.exit(1);
}

if (
  report.video_backend_implemented ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify video_backend_implemented or readiness flags');
  process.exit(1);
}

const envFailure = requirements.channel_failure_modes.find(
  (entry) => entry.channel === 'environment_identity'
);
if (
  !envFailure ||
  envFailure.runtime_enforcement_level !== 'STRICT' ||
  !envFailure.expected_runtime_failure_modes.includes('reference_drift')
) {
  console.error('ENVIRONMENT FAILURE MODE EXAMPLE FAIL');
  process.exit(1);
}

if (
  architecture.runtime_layers.length === 0 ||
  architecture.identity_layers.length === 0 ||
  architecture.temporal_layers.length === 0 ||
  architecture.continuity_layers.length === 0
) {
  console.error('ARCHITECTURE REPORT FAIL: all layer arrays required');
  process.exit(1);
}

if (
  requirements.required_runtime_channels.length === 0 ||
  requirements.critical_runtime_channels.length === 0 ||
  gapReport.defined.length === 0 ||
  gapReport.missing.length === 0 ||
  !gapReport.next_phase
) {
  console.error('REQUIREMENTS/GAP REPORT FAIL: channels or gap fields incomplete');
  process.exit(1);
}

process.exit(0);
