import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DIALOGUE_LIPSYNC_PASS_VERDICT,
  DIALOGUE_LIPSYNC_READY_STATUS,
  DIALOGUE_LIPSYNC_REPORT_PATH,
  PROMPT_EVALUATION_READ_ONLY_PATHS,
  writeDialogueLipsyncSystem,
} from '../services/dialogueLipsyncSystem.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const before = Object.fromEntries(
  PROMPT_EVALUATION_READ_ONLY_PATHS.filter((p) =>
    fs.existsSync(path.join(projectRoot, p))
  ).map((p) => [p, fs.readFileSync(path.join(projectRoot, p), 'utf8')])
);

const report = writeDialogueLipsyncSystem(projectRoot);

for (const readOnlyPath of PROMPT_EVALUATION_READ_ONLY_PATHS) {
  if (!before[readOnlyPath]) continue;
  const after = fs.readFileSync(path.join(projectRoot, readOnlyPath), 'utf8');
  if (before[readOnlyPath] !== after) {
    console.error(`POLICY VIOLATION: Prompt evaluation artifact modified: ${readOnlyPath}`);
    process.exit(1);
  }
}

const summary = report.lipsync_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `relationship_context_integrity=${summary.relationship_context_integrity}`,
    `memory_context_integrity=${summary.memory_context_integrity}`,
    `dialogue_style_consistency=${summary.dialogue_style_consistency}`,
    `story_engine_compatibility=${summary.story_engine_compatibility}`,
    `temporal_memory_compatibility=${summary.temporal_memory_compatibility}`,
    `relationship_arc_compatibility=${summary.relationship_arc_compatibility}`,
    `dialogue_spec_integrity=${summary.dialogue_spec_integrity}`,
    `dialogue_continuity_integrity=${summary.dialogue_continuity_integrity}`,
    `prompt_evaluation_mutation=0`,
    `dialogue_lipsync_ready=${report.dialogue_lipsync_ready}`,
  ].join(' ')
);
console.log(`report=${DIALOGUE_LIPSYNC_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const checks: [string, boolean][] = [
  ['relationship_context_integrity=PASS', summary.relationship_context_integrity === 'PASS'],
  ['memory_context_integrity=PASS', summary.memory_context_integrity === 'PASS'],
  ['dialogue_style_consistency=PASS', summary.dialogue_style_consistency === 'PASS'],
  ['story_engine_compatibility=PASS', summary.story_engine_compatibility === 'PASS'],
  ['temporal_memory_compatibility=PASS', summary.temporal_memory_compatibility === 'PASS'],
  ['relationship_arc_compatibility=PASS', summary.relationship_arc_compatibility === 'PASS'],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== DIALOGUE_LIPSYNC_PASS_VERDICT) process.exit(1);
if (report.status !== DIALOGUE_LIPSYNC_READY_STATUS) process.exit(1);
