import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditAllSourceVideos,
  SOURCE_VIDEO_REGISTRY_PATH,
  SOURCE_VIDEO_SCHEMA_PATH,
} from '../services/sourceVideoCoverageAuditor.js';
import {
  GAP_PASS_VERDICT,
  GAP_REPORT_PATH,
  GAP_SUMMARY_MD_PATH,
  writeSourceVideoGapReports,
} from '../services/sourceVideoGapDetector.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [SOURCE_VIDEO_SCHEMA_PATH, SOURCE_VIDEO_REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required source video asset: ${required}`);
    process.exit(1);
  }
}

const records = auditAllSourceVideos(projectRoot);
const report = writeSourceVideoGapReports(projectRoot, records);

console.log(report.final_verdict);
console.log(
  `videos=${report.video_count} audited=${report.audited_video_count} coverage_score=${report.coverage_score} readiness_tier=${report.readiness_tier}`
);
for (const record of records.filter((r) => r.audit_status !== 'unregistered')) {
  console.log(
    `  ${record.source_video_id}: ${record.audit_status} size_mb=${(record.file_size_bytes / 1024 / 1024).toFixed(1)}`
  );
}
if (report.missing_categories.length > 0) {
  console.log(`missing_categories=${report.missing_categories.join(',')}`);
}
if (report.weak_categories.length > 0) {
  console.log(`weak_categories=${report.weak_categories.join(',')}`);
}
console.log(`gpu_execution=${report.gpu_execution} audit_only=${report.audit_only}`);
console.log(`report=${GAP_REPORT_PATH}`);
console.log(`markdown=${GAP_SUMMARY_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, GAP_REPORT_PATH))) {
  console.error('Source video gap report missing.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, GAP_SUMMARY_MD_PATH))) {
  console.error('Source video audit summary markdown missing.');
  process.exit(1);
}

if (report.final_verdict !== GAP_PASS_VERDICT) {
  process.exit(1);
}

if (report.audited_video_count !== 5) {
  console.error(`Expected 5 audited videos, got ${report.audited_video_count}`);
  process.exit(1);
}

if (!report.readiness_tier) {
  console.error('Readiness tier not assigned.');
  process.exit(1);
}

process.exit(0);
