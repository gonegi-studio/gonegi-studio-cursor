import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
  ENVIRONMENT_IDENTITY_BINDING_PASS_VERDICT,
  ENVIRONMENT_IDENTITY_BINDING_REPORT_PATH,
  ENVIRONMENT_IDENTITY_BINDING_STATUS,
  ENVIRONMENT_IDENTITY_GAP_REPORT_PATH,
  writeEnvironmentIdentityBindingReport,
} from '../services/environmentIdentityBinding.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeEnvironmentIdentityBindingReport(projectRoot);

const bindingReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENVIRONMENT_IDENTITY_BINDING_REPORT_PATH), 'utf8')
) as {
  implemented_bindings: string[];
  traceability_coverage: number;
  similarity_matching_strategy: { strategy_id: string; same_environment_threshold: number };
  remaining_gaps: string[];
};

const bindingPackage = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH), 'utf8')
) as {
  environment_binding_defined: boolean;
  entries: Array<{ environment_id: string }>;
};

const gapReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENVIRONMENT_IDENTITY_GAP_REPORT_PATH), 'utf8')
) as { defined: string[]; missing: string[]; remaining_blockers: string[]; next_phase: string };

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `environment_bindings_defined=${report.environment_bindings_defined}`,
    `environment_binding_defined=${report.environment_binding_defined}`,
    `environment_reference_bank_binding=${report.environment_reference_bank_binding}`,
    `environment_anchor_binding=${report.environment_anchor_binding}`,
    `environment_memory_binding=${report.environment_memory_binding}`,
    `environment_traceability_binding=${report.environment_traceability_binding}`,
    `environment_retrieval_binding=${report.environment_retrieval_binding}`,
    `environment_similarity_binding=${report.environment_similarity_binding}`,
    `traceability_coverage=${report.traceability_coverage}`,
    `environment_identity_solved=${report.environment_identity_solved}`,
    `runtime_implemented=${report.runtime_implemented}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
  ENVIRONMENT_IDENTITY_BINDING_REPORT_PATH,
  ENVIRONMENT_IDENTITY_GAP_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== ENVIRONMENT_IDENTITY_BINDING_PASS_VERDICT) {
  console.error('ENVIRONMENT IDENTITY BINDING VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== ENVIRONMENT_IDENTITY_BINDING_STATUS) {
  console.error(`STATUS FAIL: expected ${ENVIRONMENT_IDENTITY_BINDING_STATUS}`);
  process.exit(1);
}

if (
  !report.environment_bindings_defined ||
  !report.environment_binding_defined ||
  !report.environment_reference_bank_binding ||
  !report.environment_anchor_binding ||
  !report.environment_memory_binding ||
  !report.environment_traceability_binding ||
  !report.environment_retrieval_binding ||
  !report.environment_similarity_binding ||
  !bindingPackage.environment_binding_defined
) {
  console.error('PASS CONDITION FAIL: environment binding checks not met');
  process.exit(1);
}

if (
  report.environment_identity_solved ||
  report.runtime_implemented ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify environment_identity_solved or runtime readiness');
  process.exit(1);
}

const titanic = bindingPackage.entries.find(
  (entry) => entry.environment_id === 'titanic_staircase_001'
);
if (!titanic) {
  console.error('TITANIC BINDING FAIL: titanic_staircase_001 entry required');
  process.exit(1);
}

if (
  bindingReport.implemented_bindings.length !== 6 ||
  !bindingReport.similarity_matching_strategy.strategy_id ||
  bindingReport.remaining_gaps.length === 0
) {
  console.error('BINDING REPORT FAIL: implemented_bindings, similarity strategy, or remaining_gaps incomplete');
  process.exit(1);
}

if (gapReport.defined.length === 0 || gapReport.missing.length === 0 || !gapReport.next_phase) {
  console.error('GAP REPORT FAIL: defined, missing, and next_phase required');
  process.exit(1);
}

process.exit(0);
