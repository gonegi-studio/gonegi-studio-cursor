import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  LEVEL2_COMPLETE_FINAL_PLUS_STATUS,
  LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT,
  LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
} from '../services/movieAnalysisLevel2RobustnessAudit.js';
import {
  GENERALIZATION_TEST_COUNT,
  LEVEL2_COMPLETE_FINAL_MAX_STATUS,
  LEVEL2_REAL_WORLD_CERTIFIED_STATUS,
  MIN_GENERALIZATION_SCORE,
  REAL_WORLD_GENERALIZATION_AUDIT_DIR,
  REAL_WORLD_GENERALIZATION_AUDIT_EXPORT_DIR,
  REAL_WORLD_GENERALIZATION_AUDIT_MANIFEST_PATH,
  REAL_WORLD_GENERALIZATION_AUDIT_MD_PATH,
  REAL_WORLD_GENERALIZATION_AUDIT_PASS_VERDICT,
  REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH,
  REAL_WORLD_SOURCE_GROUP_COUNT,
  UNSEEN_SOURCE_SPECS,
  writeMovieAnalysisRealWorldGeneralizationAudit,
} from '../services/movieAnalysisRealWorldGeneralizationAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const robustnessPath = path.join(projectRoot, LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH);
if (!fs.existsSync(robustnessPath)) {
  console.error(`PRECHECK FAIL: Missing required upstream asset: ${LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH}`);
  process.exit(1);
}

const robustnessReport = JSON.parse(fs.readFileSync(robustnessPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};

if (robustnessReport.final_verdict !== LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH} must be ${LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT}`
  );
  process.exit(1);
}

if (robustnessReport.certification_status !== LEVEL2_COMPLETE_FINAL_PLUS_STATUS) {
  console.error(`PRECHECK FAIL: robustness audit status must be ${LEVEL2_COMPLETE_FINAL_PLUS_STATUS}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealWorldGeneralizationAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} final_status=${report.final_certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} real_world_source_group_count=${report.real_world_source_group_count} generalization_score=${report.generalization_score.toFixed(4)} level3_entry_ready=${report.level3_entry_ready} scene_boundary_generalization=${report.scene_boundary_generalization} character_detection_generalization=${report.character_detection_generalization} location_detection_generalization=${report.location_detection_generalization} motion_detection_generalization=${report.motion_detection_generalization} emotion_detection_generalization=${report.emotion_detection_generalization} story_arc_generalization=${report.story_arc_generalization} cross_source_dna_binding=${report.cross_source_dna_binding} cross_source_traceability=${report.cross_source_traceability} cross_source_adapter_binding=${report.cross_source_adapter_binding} unseen_source_stability=${report.unseen_source_stability} source_overfit=${report.source_overfit} genre_overfit=${report.genre_overfit} dna_break=${report.dna_break} adapter_break=${report.adapter_break} traceability_break=${report.traceability_break} generalization_failure=${report.generalization_failure} real_world_generalization_audit_ready=${report.real_world_generalization_audit_ready}`
);
for (const test of report.generalization_tests) {
  console.log(`  ${test.test_id}: passed=${test.generalization_test_passed} ${test.from_group}→${test.to_group}`);
}
for (const simulation of report.unseen_source_simulations) {
  console.log(
    `  ${simulation.source_id}: genre=${simulation.genre} template=${simulation.template_source_id} stability=${simulation.unseen_source_stability} score=${simulation.generalization_score.toFixed(3)}`
  );
}
console.log(`report=${REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH}`);
console.log(`markdown=${REAL_WORLD_GENERALIZATION_AUDIT_MD_PATH}`);
console.log(`manifest=${REAL_WORLD_GENERALIZATION_AUDIT_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_WORLD_GENERALIZATION_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, REAL_WORLD_GENERALIZATION_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, REAL_WORLD_GENERALIZATION_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, REAL_WORLD_GENERALIZATION_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(
      projectRoot,
      REAL_WORLD_GENERALIZATION_AUDIT_EXPORT_DIR,
      'real-world-generalization-audit.json'
    )
  ) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.real_world_source_group_count !== REAL_WORLD_SOURCE_GROUP_COUNT ||
  report.generalization_test_count !== GENERALIZATION_TEST_COUNT ||
  report.generalization_score < MIN_GENERALIZATION_SCORE ||
  report.level3_entry_ready !== true ||
  report.real_world_generalization_audit_ready !== 'PASS' ||
  report.certification_status !== LEVEL2_REAL_WORLD_CERTIFIED_STATUS ||
  report.final_certification_status !== LEVEL2_COMPLETE_FINAL_MAX_STATUS ||
  report.scene_boundary_generalization !== 'PASS' ||
  report.character_detection_generalization !== 'PASS' ||
  report.location_detection_generalization !== 'PASS' ||
  report.motion_detection_generalization !== 'PASS' ||
  report.emotion_detection_generalization !== 'PASS' ||
  report.story_arc_generalization !== 'PASS' ||
  report.cross_source_dna_binding !== 'PASS' ||
  report.cross_source_traceability !== 'PASS' ||
  report.cross_source_adapter_binding !== 'PASS' ||
  report.unseen_source_stability !== 'PASS' ||
  report.source_overfit !== false ||
  report.genre_overfit !== false ||
  report.dna_break !== false ||
  report.adapter_break !== false ||
  report.traceability_break !== false ||
  report.generalization_failure !== false ||
  report.generalization_tests.length !== GENERALIZATION_TEST_COUNT ||
  report.unseen_source_simulations.length !== UNSEEN_SOURCE_SPECS.length ||
  report.generalization_tests.every((test) => test.generalization_test_passed === 'PASS') === false
) {
  console.error(
    'Expected PASS with 10+ source groups, generalization_score threshold met, LEVEL2_REAL_WORLD_CERTIFIED, and LEVEL2_COMPLETE_FINAL_MAX'
  );
  process.exit(1);
}

process.exit(0);
