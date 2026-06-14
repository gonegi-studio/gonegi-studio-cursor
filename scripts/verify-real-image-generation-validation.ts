import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REAL_GENERATION_IMAGES_DIR,
  REAL_IMAGE_GENERATION_METRICS_PATH,
  REAL_IMAGE_GENERATION_PASS_VERDICT,
  REAL_IMAGE_GENERATION_REPORT_PATH,
  REAL_IMAGE_GENERATION_RESULTS_PATH,
  writeRealImageGenerationValidation,
} from '../services/realImageGenerationValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeRealImageGenerationValidation(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `simulation_pass=${summary.simulation_pass}`,
    `real_generation_pass=${summary.real_generation_pass}`,
    `total_generated_images=${summary.total_generated_images}`,
    `character_identity=${summary.character_identity}`,
    `world_identity=${summary.world_identity}`,
    `movie_recognition=${summary.movie_recognition}`,
    `movie_swap_separation=${summary.movie_swap_separation}`,
    `geometry=${summary.geometry}`,
    `composition=${summary.composition}`,
    `semantic_anchor=${summary.semantic_anchor}`,
  ].join(' | ')
);

for (const rel of [
  REAL_IMAGE_GENERATION_RESULTS_PATH,
  REAL_IMAGE_GENERATION_METRICS_PATH,
  REAL_IMAGE_GENERATION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

const imagesDir = path.join(projectRoot, REAL_GENERATION_IMAGES_DIR);
if (!fs.existsSync(imagesDir) || fs.readdirSync(imagesDir).filter((f) => f.endsWith('.png')).length < 10) {
  console.error(`OUTPUT MISSING: ${REAL_GENERATION_IMAGES_DIR} (expected 10 PNG images)`);
  process.exit(1);
}

if (report.final_verdict !== REAL_IMAGE_GENERATION_PASS_VERDICT) {
  console.error('REAL IMAGE GENERATION VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
