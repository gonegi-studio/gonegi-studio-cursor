import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONFLICT_REPORT_PATH,
  LEGACY_HARVEST_AUDIT_REPORT_PATH,
  LEGACY_HARVEST_PASS_VERDICT,
  LEGACY_KNOWLEDGE_INVENTORY_PATH,
  LEGACY_PATTERN_MATRIX_PATH,
  V5_ENRICHMENT_PLAN_PATH,
  writeLegacyKnowledgeHarvest,
} from '../services/legacyKnowledgeHarvest.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeLegacyKnowledgeHarvest(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `harvest_passed=${report.harvest_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `legacy_pattern_count=${summary.legacy_pattern_count}`,
    `useful_pattern_count=${summary.useful_pattern_count}`,
    `harvested_pattern_count=${summary.harvested_pattern_count}`,
    `harvest_ratio=${summary.harvest_ratio}`,
    `critical_pattern_harvested_count=${summary.critical_pattern_harvested_count}`,
    `critical_pattern_missing_count=${summary.critical_pattern_missing_count}`,
    `latest_v5_structure_preserved=${summary.latest_v5_structure_preserved}`,
    `legacy_structure_restored=${summary.legacy_structure_restored}`,
    `canonical_upload_architecture_preserved=${summary.canonical_upload_architecture_preserved}`,
    `patterns_enriched=${summary.patterns_enriched}`,
    `next_order=${summary.next_order}`,
  ].join(' | ')
);

const requiredOutputs = [
  LEGACY_KNOWLEDGE_INVENTORY_PATH,
  LEGACY_PATTERN_MATRIX_PATH,
  CONFLICT_REPORT_PATH,
  V5_ENRICHMENT_PLAN_PATH,
  LEGACY_HARVEST_AUDIT_REPORT_PATH,
];

for (const rel of requiredOutputs) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== LEGACY_HARVEST_PASS_VERDICT) {
  console.error('LEGACY KNOWLEDGE HARVEST FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
