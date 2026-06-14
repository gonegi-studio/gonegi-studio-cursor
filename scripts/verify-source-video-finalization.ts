import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FINAL_SET_PATH,
  FINAL_SET_REGISTRY_PATH,
  FINAL_SET_SCHEMA_PATH,
  writeSourceVideoFinalSet,
} from '../services/sourceVideoFinalSetBuilder.js';
import {
  assertProjectRootPrecheck,
  FINALIZATION_MD_PATH,
  FINALIZATION_PASS_VERDICT,
  FINALIZATION_REPORT_PATH,
  writeSourceVideoFinalizationReport,
} from '../services/sourceVideoFinalSetValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const precheckIssues = assertProjectRootPrecheck();
if (precheckIssues.length > 0) {
  for (const issue of precheckIssues) {
    console.error(`[${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

for (const required of [FINAL_SET_SCHEMA_PATH, FINAL_SET_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required final set asset: ${required}`);
    process.exit(1);
  }
}

writeSourceVideoFinalSet(projectRoot);
const { finalSet, report } = writeSourceVideoFinalizationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `total_videos=${report.total_videos} active=${report.active_count} archive=${report.archive_count} duplicates=${report.duplicates} missing_files=${report.missing_files} registry=${report.registry_consistency} status=${report.finalization_status}`
);
console.log(
  `ghibli=${report.category_counts.GHIBLI} shinkai=${report.category_counts.SHINKAI} live_action=${report.category_counts.LIVE_ACTION} mori=${report.category_counts.MORI} archive_cat=${report.category_counts.ARCHIVE}`
);
for (const video of finalSet.videos) {
  console.log(
    `  ${video.source_video_id}: [${video.category}/${video.tier}] ${video.file_present ? 'PRESENT' : 'MISSING'}`
  );
}
console.log(`gpu_execution=${report.gpu_execution} read_only=${report.read_only}`);
console.log(`final_set=${FINAL_SET_PATH}`);
console.log(`report=${FINALIZATION_REPORT_PATH}`);
console.log(`markdown=${FINALIZATION_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, FINAL_SET_PATH))) {
  console.error('Final set JSON missing.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, FINALIZATION_REPORT_PATH))) {
  console.error('Finalization report missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== FINALIZATION_PASS_VERDICT) {
  process.exit(1);
}

if (report.total_videos !== 15 || report.duplicates !== 0 || report.missing_files !== 0) {
  console.error(
    `Expected total_videos=15 duplicates=0 missing_files=0, got total=${report.total_videos} duplicates=${report.duplicates} missing=${report.missing_files}`
  );
  process.exit(1);
}

process.exit(0);
