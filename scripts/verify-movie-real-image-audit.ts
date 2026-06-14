import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_IMAGE_GENERATION_OUTPUT_DIR,
  TITANIC_GENERATION_TEST_SCENES,
} from '../services/movieImageGenerationValidation.js';
import {
  MOVIE_REAL_IMAGE_AUDIT_PASS_VERDICT,
  MOVIE_REAL_IMAGE_AUDIT_REPORT_PATH,
  writeMovieRealImageAuditReport,
} from '../services/movieRealImageAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieRealImageAuditReport(projectRoot);
const { metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `real_generation_test_complete=${report.real_generation_test_complete}`,
    `real_image_validation_complete=${report.real_image_validation_complete}`,
    `scene_count=${metrics.scene_count}`,
    `successful_generation_count=${metrics.successful_generation_count}`,
    `camera_match_avg=${metrics.camera_match_avg}`,
    `composition_match_avg=${metrics.composition_match_avg}`,
    `character_match_avg=${metrics.character_match_avg}`,
    `environment_match_avg=${metrics.environment_match_avg}`,
    `semantic_match_avg=${metrics.semantic_match_avg}`,
    `overall_generation_score=${metrics.overall_generation_score}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_REAL_IMAGE_AUDIT_REPORT_PATH,
  ...TITANIC_GENERATION_TEST_SCENES.map(
    (spec) => `${MOVIE_IMAGE_GENERATION_OUTPUT_DIR}/${spec.expected_image_filename}`
  ),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_REAL_IMAGE_AUDIT_PASS_VERDICT) {
  console.error('MOVIE REAL IMAGE AUDIT FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
