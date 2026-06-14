import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
  TEMPORAL_PRESERVATION_BINDING_PASS_VERDICT,
  TEMPORAL_PRESERVATION_BINDING_REPORT_PATH,
  TEMPORAL_PRESERVATION_BINDING_STATUS,
  TEMPORAL_BINDING_GAP_REPORT_PATH,
  writeTemporalPreservationBindingReport,
} from '../services/temporalPreservationBinding.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTemporalPreservationBindingReport(projectRoot);

const bindingReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_PRESERVATION_BINDING_REPORT_PATH), 'utf8')
) as {
  implemented_bindings: string[];
  coverage_ratio: number;
  traceability_coverage: number;
  remaining_gaps: string[];
};

const bindingPackage = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH), 'utf8')
) as {
  temporal_binding_defined: boolean;
  coverage: { coverage_ratio: number };
};

const gapReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_BINDING_GAP_REPORT_PATH), 'utf8')
) as { defined: string[]; missing: string[]; remaining_blockers: string[]; next_phase: string };

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `temporal_bindings_defined=${report.temporal_bindings_defined}`,
    `temporal_binding_defined=${report.temporal_binding_defined}`,
    `temporal_memory_binding=${report.temporal_memory_binding}`,
    `edit_rhythm_binding=${report.edit_rhythm_binding}`,
    `shot_boundary_continuity_binding=${report.shot_boundary_continuity_binding}`,
    `causal_transition_chain_binding=${report.causal_transition_chain_binding}`,
    `temporal_traceability_binding=${report.temporal_traceability_binding}`,
    `coverage_ratio=${report.coverage_ratio}`,
    `traceability_coverage=${report.traceability_coverage}`,
    `temporal_preservation_solved=${report.temporal_preservation_solved}`,
    `runtime_implemented=${report.runtime_implemented}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
  TEMPORAL_PRESERVATION_BINDING_REPORT_PATH,
  TEMPORAL_BINDING_GAP_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TEMPORAL_PRESERVATION_BINDING_PASS_VERDICT) {
  console.error('TEMPORAL PRESERVATION BINDING VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== TEMPORAL_PRESERVATION_BINDING_STATUS) {
  console.error(`STATUS FAIL: expected ${TEMPORAL_PRESERVATION_BINDING_STATUS}`);
  process.exit(1);
}

if (
  !report.temporal_bindings_defined ||
  !report.temporal_binding_defined ||
  !report.temporal_memory_binding ||
  !report.edit_rhythm_binding ||
  !report.shot_boundary_continuity_binding ||
  !report.causal_transition_chain_binding ||
  !report.temporal_traceability_binding ||
  report.coverage_ratio !== 1.0 ||
  !bindingPackage.temporal_binding_defined ||
  bindingPackage.coverage.coverage_ratio !== 1.0
) {
  console.error('PASS CONDITION FAIL: binding definition or coverage_ratio not met');
  process.exit(1);
}

if (
  report.temporal_preservation_solved ||
  report.runtime_implemented ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify temporal_preservation_solved or runtime readiness');
  process.exit(1);
}

if (bindingReport.implemented_bindings.length !== 5 || bindingReport.remaining_gaps.length === 0) {
  console.error('BINDING REPORT FAIL: implemented_bindings and remaining_gaps required');
  process.exit(1);
}

if (gapReport.defined.length === 0 || gapReport.missing.length === 0 || !gapReport.next_phase) {
  console.error('GAP REPORT FAIL: defined, missing, and next_phase required');
  process.exit(1);
}

process.exit(0);
