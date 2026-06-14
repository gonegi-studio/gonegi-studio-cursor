import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_MULTI_FRAME_COUNT,
  EXPECTED_SOURCE_COUNT,
  FRAMES_PER_SOURCE,
  MULTI_FRAME_MOTION_DIR,
  MULTI_FRAME_MOTION_MANIFEST_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_MD_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  writeMovieAnalysisRealMultiFrameMotionConsistencyValidation,
} from '../services/movieAnalysisRealMultiFrameMotionConsistencyValidation.js';
import {
  MULTI_FRAME_STYLE_MANIFEST_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealMultiFrameStyleConsistencyValidation.js';
import {
  MODEL_TEST_GENERATION_IMAGES_DIR,
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealModelTestGeneration.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

function assertUpstreamReport(
  reportPath: string,
  passVerdict: string,
  statusMessage: string | null,
  label: string
): void {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${reportPath}`);
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (report.final_verdict !== passVerdict) {
    console.error(`PRECHECK FAIL: ${label} ${reportPath} must be ${passVerdict}`);
    process.exit(1);
  }
  if (statusMessage && report.certification_status !== statusMessage) {
    console.error(`PRECHECK FAIL: ${label} status must be ${statusMessage}`);
    process.exit(1);
  }
}

assertUpstreamReport(
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  'L2F-007'
);
assertUpstreamReport(
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
  'L2F-002'
);

for (const asset of [MODEL_TEST_GENERATION_MANIFEST_PATH, MULTI_FRAME_STYLE_MANIFEST_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, MODEL_TEST_GENERATION_IMAGES_DIR))) {
  console.error(`Missing required input directory: ${MODEL_TEST_GENERATION_IMAGES_DIR}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealMultiFrameMotionConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} frame_count=${report.frame_count} motion_direction_persistence=${report.motion_direction_persistence} motion_speed_consistency=${report.motion_speed_consistency} temporal_flow_consistency=${report.temporal_flow_consistency} transition_continuity=${report.transition_continuity} cross_frame_motion_consistency=${report.cross_frame_motion_consistency} traceability_preserved=${report.traceability_preserved} multi_frame_motion_consistency=${report.multi_frame_motion_consistency} motion_drift=${report.motion_drift} temporal_break=${report.temporal_break} transition_break=${report.transition_break} motion_direction_conflict=${report.motion_direction_conflict} real_multi_frame_motion_consistency_validation_ready=${report.real_multi_frame_motion_consistency_validation_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: direction=${audit.motion_direction_persistence} speed=${audit.motion_speed_consistency} temporal=${audit.temporal_flow_consistency} transition=${audit.transition_continuity} cross_frame=${audit.cross_frame_motion_consistency} trace=${audit.traceability_preserved} ready=${audit.source_multi_frame_motion_validated} frames=${audit.motion_frames.length}`
  );
}
console.log(`report=${REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_MD_PATH}`);
console.log(`manifest=${MULTI_FRAME_MOTION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

const multiFrameFiles = fs.existsSync(path.join(projectRoot, MULTI_FRAME_MOTION_DIR))
  ? fs.readdirSync(path.join(projectRoot, MULTI_FRAME_MOTION_DIR)).filter((name) =>
      name.endsWith('-multi-frame-motion.json')
    )
  : [];

if (
  !fs.existsSync(path.join(projectRoot, REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MULTI_FRAME_MOTION_MANIFEST_PATH)) ||
  report.certification_status !== REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.frame_count !== EXPECTED_MULTI_FRAME_COUNT ||
  report.motion_direction_persistence !== 'PASS' ||
  report.motion_speed_consistency !== 'PASS' ||
  report.temporal_flow_consistency !== 'PASS' ||
  report.transition_continuity !== 'PASS' ||
  report.cross_frame_motion_consistency !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.multi_frame_motion_consistency !== 'PASS' ||
  report.motion_drift !== false ||
  report.temporal_break !== false ||
  report.transition_break !== false ||
  report.motion_direction_conflict !== false ||
  report.real_multi_frame_motion_consistency_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_multi_frame_motion_validated === 'PASS') === false ||
  report.source_audits.every((audit) => audit.motion_frames.length === FRAMES_PER_SOURCE) === false ||
  multiFrameFiles.length !== EXPECTED_SOURCE_COUNT
) {
  console.error(
    'Expected multi-frame motion consistency validation for 4 sources with 16 frames and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
