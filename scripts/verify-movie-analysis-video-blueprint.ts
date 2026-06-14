import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SEQUENCE_ASSEMBLY_PASS_VERDICT,
  SEQUENCE_ASSEMBLY_REPORT_PATH,
} from '../services/movieAnalysisSequenceAssemblyValidator.js';
import {
  SEQUENCE_ASSEMBLY_REGISTRY_PATH,
} from '../services/movieAnalysisSequenceAssemblyDesign.js';
import {
  VIDEO_BLUEPRINT_MD_PATH,
  VIDEO_BLUEPRINT_PASS_VERDICT,
  VIDEO_BLUEPRINT_REPORT_PATH,
  writeMovieAnalysisVideoBlueprintReport,
} from '../services/movieAnalysisVideoBlueprintValidator.js';
import {
  VIDEO_BLUEPRINT_REGISTRY_PATH,
  VIDEO_BLUEPRINT_SCHEMA_PATH,
  writeMovieAnalysisVideoBlueprintPlans,
} from '../services/movieAnalysisVideoBlueprintDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  SEQUENCE_ASSEMBLY_REGISTRY_PATH,
  SEQUENCE_ASSEMBLY_REPORT_PATH,
  VIDEO_BLUEPRINT_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const sequenceAssemblyReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, SEQUENCE_ASSEMBLY_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (sequenceAssemblyReport.final_verdict !== SEQUENCE_ASSEMBLY_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${SEQUENCE_ASSEMBLY_REPORT_PATH} must have ${SEQUENCE_ASSEMBLY_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisVideoBlueprintPlans(projectRoot);
const report = writeMovieAnalysisVideoBlueprintReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `video_blueprint_plans=${report.video_blueprint_plans} sequence_assembly_links=${report.sequence_assembly_links} source_links=${report.source_links} blueprint_structures=${report.blueprint_structures} scene_counts_valid=${report.scene_counts_valid} blueprint_only=${report.blueprint_only}`
);
console.log(
  `planning_only=${report.planning_only} video_generation=${report.video_generation} sequence_generation=${report.sequence_generation} gpu_execution=${report.gpu_execution} ocr=${report.ocr} external_call_allowed=${report.external_call_allowed}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.video_blueprint_id === plan.video_blueprint_id
  );
  console.log(
    `  ${plan.video_blueprint_id} ← ${plan.sequence_assembly_id}: ${validation?.status ?? 'FAIL'} scenes=${plan.scene_count} blocks=${plan.sequence_blocks.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${VIDEO_BLUEPRINT_REGISTRY_PATH}`);
console.log(`report=${VIDEO_BLUEPRINT_REPORT_PATH}`);
console.log(`markdown=${VIDEO_BLUEPRINT_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== VIDEO_BLUEPRINT_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.video_blueprint_plans !== 4 ||
  report.sequence_assembly_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.blueprint_structures !== 'PASS' ||
  report.scene_counts_valid !== 'PASS' ||
  report.blueprint_only !== 'PASS'
) {
  console.error(
    `Expected video_blueprint_plans=4 sequence_assembly_links=PASS source_links=PASS blueprint_structures=PASS scene_counts_valid=PASS blueprint_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
