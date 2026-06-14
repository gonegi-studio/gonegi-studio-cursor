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
  CLIP_FRAMES_PER_SOURCE,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE,
  VIDEO_CLIP_MANIFEST_PATH,
} from '../services/movieAnalysisRealVideoClipMotionValidation.js';
import { extractPngSamplesFromMp4 } from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';
import {
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealVideoStyleConsistencyValidation.js';
import {
  REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT,
  REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
  REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE,
  VIDEO_MODEL_GENERATION_MANIFEST_PATH,
  VIDEO_MODEL_OUTPUT_DIR,
} from '../services/movieAnalysisRealVideoModelGeneration.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_VIDEO_MOTION_FRAME_COUNT,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_MD_PATH,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  VIDEO_MOTION_DIR,
  VIDEO_MOTION_MANIFEST_PATH,
  writeMovieAnalysisRealVideoMotionConsistencyValidation,
} from '../services/movieAnalysisRealVideoMotionConsistencyValidation.js';

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
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  'L2F-013'
);
assertUpstreamReport(
  REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE,
  'L2F-009'
);
assertUpstreamReport(
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  'L2F-008'
);
assertUpstreamReport(
  REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
  REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT,
  REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE,
  'L2F-010'
);

for (const asset of [
  VIDEO_MODEL_GENERATION_MANIFEST_PATH,
  MULTI_FRAME_MOTION_MANIFEST_PATH,
  VIDEO_CLIP_MANIFEST_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_MODEL_OUTPUT_DIR))) {
  console.error(`Missing required input directory: ${VIDEO_MODEL_OUTPUT_DIR}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealVideoMotionConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} frame_count=${report.frame_count} motion_direction_persistence=${report.motion_direction_persistence} motion_speed_consistency=${report.motion_speed_consistency} camera_motion_consistency=${report.camera_motion_consistency} temporal_flow_consistency=${report.temporal_flow_consistency} frame_to_frame_motion_drift=${report.frame_to_frame_motion_drift} video_motion_consistency=${report.video_motion_consistency} motion_drift=${report.motion_drift} camera_jump=${report.camera_jump} temporal_break=${report.temporal_break} motion_direction_conflict=${report.motion_direction_conflict} real_video_motion_consistency_validation_ready=${report.real_video_motion_consistency_validation_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: direction=${audit.motion_direction_persistence} speed=${audit.motion_speed_consistency} camera=${audit.camera_motion_consistency} temporal=${audit.temporal_flow_consistency} drift=${audit.frame_to_frame_motion_drift} ready=${audit.source_video_motion_consistency_validated} frames=${audit.motion_frames.length}`
  );
}
console.log(`report=${REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_MD_PATH}`);
console.log(`manifest=${VIDEO_MOTION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

const motionFiles = fs.existsSync(path.join(projectRoot, VIDEO_MOTION_DIR))
  ? fs.readdirSync(path.join(projectRoot, VIDEO_MOTION_DIR)).filter((name) =>
      name.endsWith('-video-motion.json')
    )
  : [];

const mp4SamplesValid = fs
  .readdirSync(path.join(projectRoot, VIDEO_MODEL_OUTPUT_DIR))
  .filter((name) => name.endsWith('.mp4'))
  .every((name) => {
    const samples = extractPngSamplesFromMp4(
      fs.readFileSync(path.join(projectRoot, VIDEO_MODEL_OUTPUT_DIR, name))
    );
    return samples.length === CLIP_FRAMES_PER_SOURCE;
  });

if (
  !fs.existsSync(path.join(projectRoot, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, VIDEO_MOTION_MANIFEST_PATH)) ||
  report.certification_status !== REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.frame_count !== EXPECTED_VIDEO_MOTION_FRAME_COUNT ||
  report.motion_direction_persistence !== 'PASS' ||
  report.motion_speed_consistency !== 'PASS' ||
  report.camera_motion_consistency !== 'PASS' ||
  report.temporal_flow_consistency !== 'PASS' ||
  report.frame_to_frame_motion_drift !== 'PASS' ||
  report.video_motion_consistency !== 'PASS' ||
  report.motion_drift !== false ||
  report.camera_jump !== false ||
  report.temporal_break !== false ||
  report.motion_direction_conflict !== false ||
  report.real_video_motion_consistency_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_video_motion_consistency_validated === 'PASS') ===
    false ||
  report.source_audits.every((audit) => audit.motion_frames.length === CLIP_FRAMES_PER_SOURCE) ===
    false ||
  motionFiles.length !== EXPECTED_SOURCE_COUNT ||
  !mp4SamplesValid
) {
  console.error(
    'Expected video motion consistency validation for 4 sources with 32 frames and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
