import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACTIVE_CONSOLIDATION_PASS_VERDICT,
  writeActiveConsolidationAuditReport,
} from '../services/projectActiveConsolidationAudit.js';
import {
  ACTIVE_CONSOLIDATION_REPORT_PATH,
  CORE_PROJECT_MAP_PATH,
} from '../services/projectActiveConsolidationBuilder.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeActiveConsolidationAuditReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `core_assets_identified=${report.core_assets_identified}`,
    `duplicate_active_assets_removed=${report.duplicate_active_assets_removed}`,
    `production_surface_reduced=${report.production_surface_reduced}`,
    `active_baseline=${report.metrics.active_baseline}`,
    `active_after=${report.metrics.active_after}`,
    `active_target_min=${report.metrics.active_target_min}`,
    `active_target_max=${report.metrics.active_target_max}`,
    `core_count=${report.metrics.core_count}`,
    `optional_count=${report.metrics.optional_count}`,
    `obsolete_active_count=${report.metrics.obsolete_active_count}`,
    `demoted_count=${report.metrics.demoted_count}`,
    `duplicate_builder_count=${report.metrics.duplicate_builder_count}`,
    `parallel_pipeline_count=${report.metrics.parallel_pipeline_count}`,
    `redundant_validator_count=${report.metrics.redundant_validator_count}`,
    `unused_active_report_count=${report.metrics.unused_active_report_count}`,
    `overlapping_dataset_count=${report.metrics.overlapping_dataset_count}`,
  ].join(' | ')
);

for (const rel of [CORE_PROJECT_MAP_PATH, ACTIVE_CONSOLIDATION_REPORT_PATH, 'project_governance/ACTIVE_CONSOLIDATION_REGISTRY.json']) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== ACTIVE_CONSOLIDATION_PASS_VERDICT) {
  console.error('ACTIVE CONSOLIDATION AUDIT FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
