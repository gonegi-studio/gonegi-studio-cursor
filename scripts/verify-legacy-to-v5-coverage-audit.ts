import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LEGACY_COVERAGE_AUDIT_REPORT_PATH,
  LEGACY_COVERAGE_PASS_VERDICT,
  LEGACY_LATEST_INVENTORY_PATH,
  LEGACY_PRESERVATION_VERIFIED_STATUS,
  LEGACY_TO_V5_MAPPING_PATH,
  LATEST_V5_INVENTORY_PATH,
  LATEST_V5_PATCH_CANDIDATES_PATH,
  LATEST_V5_PATCH_PLAN_PATH,
  MISSING_FUNCTIONALITY_REPORT_PATH,
  writeLegacyToV5CoverageAudit,
} from '../services/legacyToV5CoverageAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeLegacyToV5CoverageAudit(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `legacy_file_count=${summary.legacy_file_count}`,
    `fully_preserved_count=${summary.fully_preserved_count}`,
    `partially_preserved_count=${summary.partially_preserved_count}`,
    `missing_count=${summary.missing_count}`,
    `critical_missing_count=${summary.critical_missing_count}`,
    `preservation_ratio=${summary.preservation_ratio}`,
    `critical_preservation_ratio=${summary.critical_preservation_ratio}`,
    `identity_lock_support=${summary.identity_lock_support}`,
    `brain_ingestion_support=${summary.brain_ingestion_support}`,
    `cinematic_dna_support=${summary.cinematic_dna_support}`,
    `patches_applied=${summary.patches_applied}`,
    `preservation_passed=${report.preservation_passed}`,
    `next_order=${summary.next_order}`,
  ].join(' | ')
);

const requiredOutputs = [
  LEGACY_LATEST_INVENTORY_PATH,
  LATEST_V5_INVENTORY_PATH,
  LEGACY_TO_V5_MAPPING_PATH,
  MISSING_FUNCTIONALITY_REPORT_PATH,
  LATEST_V5_PATCH_PLAN_PATH,
  LEGACY_COVERAGE_AUDIT_REPORT_PATH,
];

for (const rel of requiredOutputs) {
  const full = path.join(projectRoot, rel);
  if (!fs.existsSync(full)) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (Number(summary.patches_applied) > 0) {
  const patchCandidates = path.join(projectRoot, LATEST_V5_PATCH_CANDIDATES_PATH);
  if (!fs.existsSync(patchCandidates)) {
    console.error(`OUTPUT MISSING: ${LATEST_V5_PATCH_CANDIDATES_PATH}`);
    process.exit(1);
  }
}

if (report.final_verdict !== LEGACY_COVERAGE_PASS_VERDICT) {
  console.error('LEGACY TO V5 COVERAGE AUDIT FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== LEGACY_PRESERVATION_VERIFIED_STATUS) {
  console.error(`STATUS FAIL: expected ${LEGACY_PRESERVATION_VERIFIED_STATUS}, got ${report.status}`);
  process.exit(1);
}

process.exit(0);
