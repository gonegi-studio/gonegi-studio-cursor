import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACTIVE_PROJECT_MAP_PATH,
  PROJECT_CLASSIFICATION_REGISTRY_PATH,
  PROJECT_CLASSIFICATION_REPORT_PATH,
} from '../services/projectClassificationBuilder.js';
import {
  PROJECT_RESTRUCTURE_PASS_VERDICT,
  PROJECT_RESTRUCTURE_AUDIT_REPORT_PATH,
  writeProjectRestructureAuditReport,
} from '../services/projectRestructureAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeProjectRestructureAuditReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `classification_complete=${report.classification_complete}`,
    `active_assets_identified=${report.active_assets_identified}`,
    `legacy_assets_relocated=${report.legacy_assets_relocated}`,
    `orphan_asset_count_reduced=${report.orphan_asset_count_reduced}`,
    `project_structure_clean=${report.project_structure_clean}`,
    `active_count=${report.metrics.active_count}`,
    `legacy_count=${report.metrics.legacy_count}`,
    `archived_count=${report.metrics.archived_count}`,
    `experimental_count=${report.metrics.experimental_count}`,
    `unclassified_count=${report.metrics.unclassified_count}`,
    `orphan_asset_count=${report.metrics.orphan_asset_count}`,
    `orphan_baseline=${report.metrics.orphan_baseline}`,
    `orphan_target=${report.metrics.orphan_target}`,
    `relocated_count=${report.metrics.relocated_count}`,
    `active_export_count=${report.metrics.active_export_count}`,
    `legacy_export_count=${report.metrics.legacy_export_count}`,
  ].join(' | ')
);

for (const rel of [
  PROJECT_CLASSIFICATION_REGISTRY_PATH,
  PROJECT_CLASSIFICATION_REPORT_PATH,
  ACTIVE_PROJECT_MAP_PATH,
  PROJECT_RESTRUCTURE_AUDIT_REPORT_PATH,
  'legacy/',
  'archive/',
  'experimental/',
  'exports/movie_spatial/ACTIVE/titanic-image-app-native-import-v8.json',
  'exports/movie_spatial/ACTIVE/spirited-away-image-app-native-import-v8.json',
  'legacy/exports/movie_spatial/titanic-image-app-native-import-v7.json',
  'legacy/exports/movie_spatial/titanic-image-app-native-import.json',
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== PROJECT_RESTRUCTURE_PASS_VERDICT) {
  console.error('PROJECT RESTRUCTURE AUDIT FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
