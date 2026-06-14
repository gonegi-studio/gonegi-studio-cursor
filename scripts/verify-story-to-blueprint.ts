import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATION_OPERATION_STACK_READ_ONLY_PATHS,
  STORY_TO_BLUEPRINT_PASS_VERDICT,
  STORY_TO_BLUEPRINT_READY_STATUS,
  STORY_TO_BLUEPRINT_REPORT_PATH,
  writeStoryToBlueprint,
} from '../services/storyToBlueprint.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const before = Object.fromEntries(
  GENERATION_OPERATION_STACK_READ_ONLY_PATHS.filter((p) =>
    fs.existsSync(path.join(projectRoot, p))
  ).map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeStoryToBlueprint(projectRoot);

for (const readOnlyPath of GENERATION_OPERATION_STACK_READ_ONLY_PATHS) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(
      `POLICY VIOLATION: Generation operation stack artifact modified: ${readOnlyPath}`
    );
    process.exit(1);
  }
}

const summary = report.engine_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `story_analysis_integrity=${summary.story_analysis_integrity}`,
    `act_extraction_integrity=${summary.act_extraction_integrity}`,
    `arc_extraction_integrity=${summary.arc_extraction_integrity}`,
    `story_to_blueprint_integrity=${summary.story_to_blueprint_integrity}`,
    `story_traceability_integrity=${summary.story_traceability_integrity}`,
    `blueprint_generation_integrity=${summary.blueprint_generation_integrity}`,
    `feature_blueprint_compatibility=${summary.feature_blueprint_compatibility}`,
    `generation_operation_stack_mutation=0`,
    `story_to_blueprint_ready=${report.story_to_blueprint_ready}`,
  ].join(' ')
);
console.log(`report=${STORY_TO_BLUEPRINT_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const checks: [string, boolean][] = [
  ['story_analysis_integrity=PASS', summary.story_analysis_integrity === 'PASS'],
  ['act_extraction_integrity=PASS', summary.act_extraction_integrity === 'PASS'],
  ['arc_extraction_integrity=PASS', summary.arc_extraction_integrity === 'PASS'],
  ['story_to_blueprint_integrity=PASS', summary.story_to_blueprint_integrity === 'PASS'],
  ['story_traceability_integrity=PASS', summary.story_traceability_integrity === 'PASS'],
  ['blueprint_generation_integrity=PASS', summary.blueprint_generation_integrity === 'PASS'],
  ['feature_blueprint_compatibility=PASS', summary.feature_blueprint_compatibility === 'PASS'],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== STORY_TO_BLUEPRINT_PASS_VERDICT) {
  console.error(`Expected verdict ${STORY_TO_BLUEPRINT_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== STORY_TO_BLUEPRINT_READY_STATUS) {
  console.error(`Expected status ${STORY_TO_BLUEPRINT_READY_STATUS}`);
  process.exit(1);
}
