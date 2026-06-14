import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BACKEND_RUNTIME_BRIDGE_PASS_VERDICT,
  BACKEND_RUNTIME_BRIDGE_REPORT_PATH,
  BACKEND_RUNTIME_BRIDGE_STATUS,
  RUNTIME_BRIDGE_GAP_REPORT_PATH,
  RUNTIME_BRIDGE_TRACEABILITY_REPORT_PATH,
  writeBackendRuntimeBridgeReport,
} from '../services/backendRuntimeBridge.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeBackendRuntimeBridgeReport(projectRoot);

const bridgeReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, BACKEND_RUNTIME_BRIDGE_REPORT_PATH), 'utf8')
) as {
  bridge_mode: string;
  runtime_targets: Array<{
    runtime_target: string;
    runtime_capability_level: {
      layout: boolean;
      depth: boolean;
      pose: boolean;
      environment_identity: boolean;
      object_identity: boolean;
      temporal_preservation: boolean;
    };
  }>;
};

const gapReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, RUNTIME_BRIDGE_GAP_REPORT_PATH), 'utf8')
) as { implemented: string[]; missing: string[]; runtime_blockers: string[]; next_phase: string };

const traceReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, RUNTIME_BRIDGE_TRACEABILITY_REPORT_PATH), 'utf8')
) as {
  entries: Array<{
    runtime_target: string;
    runtime_degradation_path: string[];
  }>;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `runtime_bridge_defined=${report.runtime_bridge_defined}`,
    `execution_path_defined=${report.execution_path_defined}`,
    `fallback_path_defined=${report.fallback_path_defined}`,
    `traceability_defined=${report.traceability_defined}`,
    `bridge_mode_defined=${report.bridge_mode_defined}`,
    `runtime_capability_level_defined=${report.runtime_capability_level_defined}`,
    `runtime_connected=${report.runtime_connected}`,
    `backend_executed=${report.backend_executed}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `movie_reconstruction_ready=${report.movie_reconstruction_ready}`,
    `gpu_ready=${report.gpu_ready}`,
    `bridge_mode=${bridgeReport.bridge_mode}`,
  ].join(' | ')
);

for (const rel of [
  BACKEND_RUNTIME_BRIDGE_REPORT_PATH,
  RUNTIME_BRIDGE_GAP_REPORT_PATH,
  RUNTIME_BRIDGE_TRACEABILITY_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== BACKEND_RUNTIME_BRIDGE_PASS_VERDICT) {
  console.error('BACKEND RUNTIME BRIDGE VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== BACKEND_RUNTIME_BRIDGE_STATUS) {
  console.error(`STATUS FAIL: expected ${BACKEND_RUNTIME_BRIDGE_STATUS}`);
  process.exit(1);
}

if (
  !report.runtime_bridge_defined ||
  !report.execution_path_defined ||
  !report.fallback_path_defined ||
  !report.traceability_defined ||
  !report.bridge_mode_defined ||
  !report.runtime_capability_level_defined
) {
  console.error('PASS CONDITION FAIL: runtime bridge definition checks not met');
  process.exit(1);
}

if (
  report.runtime_connected ||
  report.backend_executed ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify runtime_connected or reconstruction readiness');
  process.exit(1);
}

const controlnet = bridgeReport.runtime_targets.find(
  (entry) => entry.runtime_target === 'controlnet_backend'
);
if (
  !controlnet ||
  !controlnet.runtime_capability_level.layout ||
  !controlnet.runtime_capability_level.depth ||
  !controlnet.runtime_capability_level.pose ||
  controlnet.runtime_capability_level.environment_identity ||
  controlnet.runtime_capability_level.object_identity ||
  controlnet.runtime_capability_level.temporal_preservation
) {
  console.error('CONTROLNET CAPABILITY FAIL: layout/depth/pose true; identity/temporal false required');
  process.exit(1);
}

const controlnetTrace = traceReport.entries.find(
  (entry) => entry.runtime_target === 'controlnet_backend'
);
if (
  !controlnetTrace ||
  !controlnetTrace.runtime_degradation_path.includes('controlnet_adapter') ||
  !controlnetTrace.runtime_degradation_path.includes('fallback_text_path')
) {
  console.error('TRACEABILITY FAIL: controlnet_backend degradation path required');
  process.exit(1);
}

if (gapReport.implemented.length === 0 || gapReport.missing.length === 0 || !gapReport.next_phase) {
  console.error('GAP REPORT FAIL: implemented, missing, and next_phase required');
  process.exit(1);
}

process.exit(0);
