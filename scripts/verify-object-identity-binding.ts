import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
  OBJECT_IDENTITY_BINDING_PASS_VERDICT,
  OBJECT_IDENTITY_BINDING_REPORT_PATH,
  OBJECT_IDENTITY_BINDING_STATUS,
  OBJECT_IDENTITY_GAP_REPORT_PATH,
  writeObjectIdentityBindingReport,
} from '../services/objectIdentityBinding.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeObjectIdentityBindingReport(projectRoot);

const bindingReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, OBJECT_IDENTITY_BINDING_REPORT_PATH), 'utf8')
) as {
  implemented_bindings: string[];
  traceability_coverage: number;
  similarity_matching_strategy: { strategy_id: string };
  variation_tolerance_strategy: { strategy_id: string };
  role_binding_strategy: { strategy_id: string };
  remaining_gaps: string[];
};

const bindingPackage = JSON.parse(
  fs.readFileSync(path.join(projectRoot, OBJECT_IDENTITY_BINDING_PACKAGE_PATH), 'utf8')
) as {
  object_binding_defined: boolean;
  entries: Array<{
    object_id: string;
    object_variation_tolerance_binding: { identity_level: string; variation_tolerance: number };
    object_role_binding: { object_role: string };
  }>;
};

const gapReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, OBJECT_IDENTITY_GAP_REPORT_PATH), 'utf8')
) as { defined: string[]; missing: string[]; remaining_blockers: string[]; next_phase: string };

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `object_bindings_defined=${report.object_bindings_defined}`,
    `object_binding_defined=${report.object_binding_defined}`,
    `object_reference_bank_binding=${report.object_reference_bank_binding}`,
    `object_anchor_binding=${report.object_anchor_binding}`,
    `object_memory_binding=${report.object_memory_binding}`,
    `object_traceability_binding=${report.object_traceability_binding}`,
    `object_retrieval_binding=${report.object_retrieval_binding}`,
    `object_variation_tolerance_binding=${report.object_variation_tolerance_binding}`,
    `object_similarity_binding=${report.object_similarity_binding}`,
    `object_role_binding=${report.object_role_binding}`,
    `traceability_coverage=${report.traceability_coverage}`,
    `object_identity_solved=${report.object_identity_solved}`,
    `runtime_implemented=${report.runtime_implemented}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
  OBJECT_IDENTITY_BINDING_REPORT_PATH,
  OBJECT_IDENTITY_GAP_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== OBJECT_IDENTITY_BINDING_PASS_VERDICT) {
  console.error('OBJECT IDENTITY BINDING VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== OBJECT_IDENTITY_BINDING_STATUS) {
  console.error(`STATUS FAIL: expected ${OBJECT_IDENTITY_BINDING_STATUS}`);
  process.exit(1);
}

if (
  !report.object_bindings_defined ||
  !report.object_binding_defined ||
  !report.object_reference_bank_binding ||
  !report.object_anchor_binding ||
  !report.object_memory_binding ||
  !report.object_traceability_binding ||
  !report.object_retrieval_binding ||
  !report.object_variation_tolerance_binding ||
  !report.object_similarity_binding ||
  !report.object_role_binding ||
  !bindingPackage.object_binding_defined
) {
  console.error('PASS CONDITION FAIL: object binding checks not met');
  process.exit(1);
}

if (
  report.object_identity_solved ||
  report.runtime_implemented ||
  report.conditioning_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify object_identity_solved or runtime readiness');
  process.exit(1);
}

const suitcase = bindingPackage.entries.find((entry) => entry.object_id === 'suitcase_001');
if (
  !suitcase ||
  suitcase.object_variation_tolerance_binding.identity_level !== 'strict' ||
  suitcase.object_variation_tolerance_binding.variation_tolerance !== 0.05 ||
  suitcase.object_role_binding.object_role !== 'hero_prop'
) {
  console.error('SUITCASE BINDING FAIL: strict/0.05/hero_prop required');
  process.exit(1);
}

const chair = bindingPackage.entries.find((entry) => entry.object_id === 'chair_014');
if (
  !chair ||
  chair.object_variation_tolerance_binding.identity_level !== 'loose' ||
  chair.object_variation_tolerance_binding.variation_tolerance !== 0.4 ||
  chair.object_role_binding.object_role !== 'background_furniture'
) {
  console.error('CHAIR BINDING FAIL: loose/0.40/background_furniture required');
  process.exit(1);
}

if (
  bindingReport.implemented_bindings.length !== 8 ||
  !bindingReport.similarity_matching_strategy.strategy_id ||
  !bindingReport.variation_tolerance_strategy.strategy_id ||
  !bindingReport.role_binding_strategy.strategy_id ||
  bindingReport.remaining_gaps.length === 0
) {
  console.error('BINDING REPORT FAIL: strategies or implemented_bindings incomplete');
  process.exit(1);
}

if (gapReport.defined.length === 0 || gapReport.missing.length === 0 || !gapReport.next_phase) {
  console.error('GAP REPORT FAIL: defined, missing, and next_phase required');
  process.exit(1);
}

process.exit(0);
