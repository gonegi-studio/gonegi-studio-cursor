import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MULTI_FRAME_MOTION_MANIFEST_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealMultiFrameMotionConsistencyValidation.js';
import {
  MODEL_TEST_GENERATION_IMAGES_DIR,
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealModelTestGeneration.js';
import {
  CLIP_FRAMES_PER_SOURCE,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_VIDEO_CLIP_COUNT,
  EXPECTED_VIDEO_CLIP_FRAME_COUNT,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_MD_PATH,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE,
  VIDEO_CLIP_DIR,
  VIDEO_CLIP_MANIFEST_PATH,
  writeMovieAnalysisRealVideoClipMotionValidation,
} from '../services/movieAnalysisRealVideoClipMotionValidation.js';

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
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  'L2F-008'
);
assertUpstreamReport(
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
  'L2F-002'
);

for (const asset of [MODEL_TEST_GENERATION_MANIFEST_PATH, MULTI_FRAME_MOTION_MANIFEST_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, MODEL_TEST_GENERATION_IMAGES_DIR))) {
  console.error(`Missing required input directory: ${MODEL_TEST_GENERATION_IMAGES_DIR}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealVideoClipMotionValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} clip_count=${report.clip_count} frame_count=${report.frame_count} optical_flow_consistency=${report.optical_flow_consistency} camera_motion_consistency=${report.camera_motion_consistency} subject_motion_consistency=${report.subject_motion_consistency} temporal_identity_persistence=${report.temporal_identity_persistence} frame_to_frame_drift=${report.frame_to_frame_drift} traceability_preserved=${report.traceability_preserved} video_clip_motion_consistency=${report.video_clip_motion_consistency} motion_drift=${report.motion_drift} camera_jump=${report.camera_jump} identity_break=${report.identity_break} temporal_flicker=${report.temporal_flicker} image_based_motion_phase_complete=${report.image_based_motion_phase_complete} video_clip_motion_phase_started=${report.video_clip_motion_phase_started} real_video_clip_motion_validation_ready=${report.real_video_clip_motion_validation_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: optical_flow=${audit.optical_flow_consistency} camera=${audit.camera_motion_consistency} subject=${audit.subject_motion_consistency} identity=${audit.temporal_identity_persistence} drift=${audit.frame_to_frame_drift} trace=${audit.traceability_preserved} ready=${audit.source_video_clip_motion_validated} frames=${audit.clip_frames.length}`
  );
}
console.log(`report=${REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${REAL_VIDEO_CLIP_MOTION_VALIDATION_MD_PATH}`);
console.log(`manifest=${VIDEO_CLIP_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

const clipDescriptors = fs.existsSync(path.join(projectRoot, VIDEO_CLIP_DIR))
  ? fs.readdirSync(path.join(projectRoot, VIDEO_CLIP_DIR)).filter((name) =>
      name.endsWith('_video-clip.json')
    )
  : [];

if (
  !fs.existsSync(path.join(projectRoot, REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, VIDEO_CLIP_MANIFEST_PATH)) ||
  report.certification_status !== REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.clip_count !== EXPECTED_VIDEO_CLIP_COUNT ||
  report.frame_count !== EXPECTED_VIDEO_CLIP_FRAME_COUNT ||
  report.optical_flow_consistency !== 'PASS' ||
  report.camera_motion_consistency !== 'PASS' ||
  report.subject_motion_consistency !== 'PASS' ||
  report.temporal_identity_persistence !== 'PASS' ||
  report.frame_to_frame_drift !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.video_clip_motion_consistency !== 'PASS' ||
  report.motion_drift !== false ||
  report.camera_jump !== false ||
  report.identity_break !== false ||
  report.temporal_flicker !== false ||
  report.image_based_motion_phase_complete !== true ||
  report.video_clip_motion_phase_started !== true ||
  report.video_generation !== true ||
  report.real_video_clip_motion_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_video_clip_motion_validated === 'PASS') ===
    false ||
  report.source_audits.every((audit) => audit.clip_frames.length === CLIP_FRAMES_PER_SOURCE) ===
    false ||
  clipDescriptors.length !== EXPECTED_VIDEO_CLIP_COUNT
) {
  console.error(
    'Expected video clip motion validation for 4 clips with 32 frames and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
