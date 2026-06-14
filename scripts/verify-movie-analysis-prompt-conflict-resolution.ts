import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROMPT_QUALITY_GATE_REPORT_PATH } from '../services/movieAnalysisPromptQualityGate.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  PROMPT_CONFLICT_RESOLUTION_MD_PATH,
  PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT,
  PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
  writeMovieAnalysisPromptConflictResolutionReport,
} from '../services/movieAnalysisPromptConflictResolution.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, PROMPT_QUALITY_GATE_REPORT_PATH))) {
  console.error(`Missing required upstream asset: ${PROMPT_QUALITY_GATE_REPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisPromptConflictResolutionReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `conflicts_before=${report.conflict_resolution_metrics.conflicts_before} conflicts_after=${report.conflict_resolution_metrics.conflicts_after} resolution_ratio=${report.conflict_resolution_metrics.resolution_ratio} resolved_templates=${report.resolved_prompt_templates.length} resolved_mappings=${report.resolved_runtime_mappings.length} conflict_categories=${report.conflict_category_detections.length} resolution_rules=${report.conflict_resolution_rules.length} priority_rules=${report.priority_rules.length} cleanup_rules=${report.prompt_cleanup_rules.length} prompt_conflict_resolution_ready=${report.prompt_conflict_resolution_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: before=${audit.conflicts_before} after=${audit.conflicts_after} ratio=${audit.resolution_ratio} ready=${audit.conflict_resolution_ready}`
  );
}
console.log(`report=${PROMPT_CONFLICT_RESOLUTION_REPORT_PATH}`);
console.log(`markdown=${PROMPT_CONFLICT_RESOLUTION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.conflict_resolution_metrics.conflicts_before > 0 === false ||
  report.conflict_resolution_metrics.conflicts_after !== 0 ||
  report.conflict_resolution_metrics.resolution_ratio !== 1 ||
  report.resolved_prompt_templates.length !== EXPECTED_SOURCE_COUNT ||
  report.resolved_runtime_mappings.length !== EXPECTED_ADAPTER_COUNT ||
  report.conflict_resolution_rules.length >= 5 === false ||
  report.priority_rules.length >= 4 === false ||
  report.prompt_cleanup_rules.length >= 4 === false ||
  report.prompt_conflict_resolution_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.conflict_resolution_ready === 'PASS') === false
) {
  console.error(
    'Expected all prompt conflicts resolved with resolution_ratio=1 and conflict-free runtime mappings for all sources'
  );
  process.exit(1);
}

process.exit(0);
