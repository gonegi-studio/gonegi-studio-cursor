import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FRAME_GENERATION_OUTPUTS,
  MOVIE_FRAME_GENERATION_PASS_VERDICT,
  MOVIE_FRAME_GENERATION_REPORT_PATH,
  MOVIE_FRAME_GENERATION_SCHEMA_PATH,
} from '../services/movieFrameGenerationOrchestrator.js';
import { writeMovieFrameGenerationReport } from '../services/movieFrameGenerationValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieFrameGenerationReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `frame_generation_ready=${report.frame_generation_ready}`,
    `generation_order_present=${report.generation_order_present}`,
    `batch_assignment_present=${report.batch_assignment_present}`,
    `replacement_map_present=${report.replacement_map_present}`,
    `priority_present=${report.priority_present}`,
    `scene_count=${metrics.scene_count}`,
    `keyframe_count=${metrics.keyframe_count}`,
    `generation_unit_count=${metrics.generation_unit_count}`,
    `batch_count=${metrics.batch_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_FRAME_GENERATION_SCHEMA_PATH,
  MOVIE_FRAME_GENERATION_REPORT_PATH,
  ...FRAME_GENERATION_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_FRAME_GENERATION_PASS_VERDICT) {
  console.error('MOVIE FRAME GENERATION VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
