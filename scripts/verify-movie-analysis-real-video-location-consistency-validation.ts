import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLIP_FRAMES_PER_SOURCE } from '../services/movieAnalysisRealVideoClipMotionValidation.js';
import {
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  extractPngSamplesFromMp4,
} from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';
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
  EXPECTED_VIDEO_LOCATION_FRAME_COUNT,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_MD_PATH,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  VIDEO_LOCATION_DIR,
  VIDEO_LOCATION_MANIFEST_PATH,
  writeMovieAnalysisRealVideoLocationConsistencyValidation,
} from '../services/movieAnalysisRealVideoLocationConsistencyValidation.js';

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
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  'L2F-011'
);
assertUpstreamReport(
  REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
  REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT,
  REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE,
  'L2F-010'
);

if (!fs.existsSync(path.join(projectRoot, VIDEO_MODEL_GENERATION_MANIFEST_PATH))) {
  console.error(`Missing required upstream asset: ${VIDEO_MODEL_GENERATION_MANIFEST_PATH}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_MODEL_OUTPUT_DIR))) {
  console.error(`Missing required input directory: ${VIDEO_MODEL_OUTPUT_DIR}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealVideoLocationConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} frame_count=${report.frame_count} location_identity_persistence=${report.location_identity_persistence} indoor_anchor_persistence=${report.indoor_anchor_persistence} lighting_anchor_persistence=${report.lighting_anchor_persistence} environment_layout_persistence=${report.environment_layout_persistence} frame_to_frame_location_drift=${report.frame_to_frame_location_drift} video_location_consistency=${report.video_location_consistency} location_drift=${report.location_drift} anchor_loss=${report.anchor_loss} lighting_break=${report.lighting_break} environment_break=${report.environment_break} real_video_location_consistency_validation_ready=${report.real_video_location_consistency_validation_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: location=${audit.location_identity_persistence} indoor=${audit.indoor_anchor_persistence} lighting=${audit.lighting_anchor_persistence} layout=${audit.environment_layout_persistence} drift=${audit.frame_to_frame_location_drift} ready=${audit.source_video_location_consistency_validated} frames=${audit.location_frames.length}`
  );
}
console.log(`report=${REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_MD_PATH}`);
console.log(`manifest=${VIDEO_LOCATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

const locationFiles = fs.existsSync(path.join(projectRoot, VIDEO_LOCATION_DIR))
  ? fs.readdirSync(path.join(projectRoot, VIDEO_LOCATION_DIR)).filter((name) =>
      name.endsWith('-video-location.json')
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
  !fs.existsSync(path.join(projectRoot, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, VIDEO_LOCATION_MANIFEST_PATH)) ||
  report.certification_status !== REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.frame_count !== EXPECTED_VIDEO_LOCATION_FRAME_COUNT ||
  report.location_identity_persistence !== 'PASS' ||
  report.indoor_anchor_persistence !== 'PASS' ||
  report.lighting_anchor_persistence !== 'PASS' ||
  report.environment_layout_persistence !== 'PASS' ||
  report.frame_to_frame_location_drift !== 'PASS' ||
  report.video_location_consistency !== 'PASS' ||
  report.location_drift !== false ||
  report.anchor_loss !== false ||
  report.lighting_break !== false ||
  report.environment_break !== false ||
  report.real_video_location_consistency_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_video_location_consistency_validated === 'PASS') ===
    false ||
  report.source_audits.every((audit) => audit.location_frames.length === CLIP_FRAMES_PER_SOURCE) ===
    false ||
  locationFiles.length !== EXPECTED_SOURCE_COUNT ||
  !mp4SamplesValid
) {
  console.error(
    'Expected video location consistency validation for 4 sources with 32 frames and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
