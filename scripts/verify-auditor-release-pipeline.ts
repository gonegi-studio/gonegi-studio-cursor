import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RELEASE_PIPELINE_JSON_PATH,
  RELEASE_PIPELINE_MD_PATH,
  RELEASE_PIPELINE_PASS_VERDICT,
  validateReleasePipelineFixtures,
  writeAuditorReleasePipelineReport,
} from '../services/auditorReleasePipeline.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('Running auditor release pipeline (9 sequential steps)...');
const report = writeAuditorReleasePipelineReport(projectRoot);
const validation = validateReleasePipelineFixtures(report);

console.log(report.final_verdict);
console.log(
  `release_status=${report.release_status} score=${report.release_score} tier=${report.readiness_tier} promotion_ready=${report.promotion_ready}`
);
console.log(`steps=${report.steps_passed}/${report.pipeline_steps.length} passed`);
for (const candidate of report.candidate_evaluations) {
  console.log(
    `  ${candidate.candidate_id}: ${candidate.release_status} promotion_allowed=${candidate.promotion_allowed}`
  );
}
console.log(`json=${RELEASE_PIPELINE_JSON_PATH} md=${RELEASE_PIPELINE_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, RELEASE_PIPELINE_JSON_PATH))) {
  console.error('Release pipeline JSON report missing.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, RELEASE_PIPELINE_MD_PATH))) {
  console.error('Release pipeline MD report missing.');
  process.exit(1);
}

if (!validation.pass) {
  for (const v of validation.violations) console.error(v);
  process.exit(1);
}

if (report.final_verdict !== RELEASE_PIPELINE_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
