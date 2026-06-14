import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealModelTestGeneration.js';
import {
  CLIP_FRAMES_PER_SOURCE,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE,
  VIDEO_CLIP_MANIFEST_PATH,
} from '../services/movieAnalysisRealVideoClipMotionValidation.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_VIDEO_COUNT,
  MIN_MP4_BYTES,
  REAL_VIDEO_MODEL_GENERATION_MD_PATH,
  REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT,
  REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
  REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE,
  VIDEO_FRAME_SEQUENCE_EXPORT_DIR,
  VIDEO_MODEL_GENERATION_MANIFEST_PATH,
  VIDEO_MODEL_OUTPUT_DIR,
  validateMp4Buffer,
  writeMovieAnalysisRealVideoModelGeneration,
} from '../services/movieAnalysisRealVideoModelGeneration.js';

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
  REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE,
  'L2F-009'
);
assertUpstreamReport(
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
  'L2F-002'
);

for (const asset of [MODEL_TEST_GENERATION_MANIFEST_PATH, VIDEO_CLIP_MANIFEST_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisRealVideoModelGeneration(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} video_count=${report.video_count} mp4_generation=${report.mp4_generation} frame_sequence_export=${report.frame_sequence_export} video_traceability=${report.video_traceability} video_adapter_binding=${report.video_adapter_binding} video_generation_failed=${report.video_generation_failed} adapter_binding_loss=${report.adapter_binding_loss} traceability_loss=${report.traceability_loss} real_video_model_generation_ready=${report.real_video_model_generation_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: mp4=${audit.mp4_generation} frames=${audit.frame_sequence_export} trace=${audit.video_traceability} adapter=${audit.video_adapter_binding} ready=${audit.source_video_model_generated}`
  );
}
console.log(`report=${REAL_VIDEO_MODEL_GENERATION_REPORT_PATH}`);
console.log(`markdown=${REAL_VIDEO_MODEL_GENERATION_MD_PATH}`);
console.log(`manifest=${VIDEO_MODEL_GENERATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT) {
  process.exit(1);
}

const mp4Files = fs.existsSync(path.join(projectRoot, VIDEO_MODEL_OUTPUT_DIR))
  ? fs.readdirSync(path.join(projectRoot, VIDEO_MODEL_OUTPUT_DIR)).filter((name) => name.endsWith('.mp4'))
  : [];

const frameSequenceFiles = fs.existsSync(path.join(projectRoot, VIDEO_FRAME_SEQUENCE_EXPORT_DIR))
  ? fs
      .readdirSync(path.join(projectRoot, VIDEO_FRAME_SEQUENCE_EXPORT_DIR))
      .filter((name) => name.endsWith('_frame-sequence.json'))
  : [];

const mp4Valid =
  mp4Files.length === EXPECTED_VIDEO_COUNT &&
  mp4Files.every((name) => {
    const buffer = fs.readFileSync(path.join(projectRoot, VIDEO_MODEL_OUTPUT_DIR, name));
    const validation = validateMp4Buffer(buffer);
    return validation.valid && validation.sample_count === CLIP_FRAMES_PER_SOURCE && buffer.length >= MIN_MP4_BYTES;
  });

if (
  !fs.existsSync(path.join(projectRoot, REAL_VIDEO_MODEL_GENERATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, VIDEO_MODEL_GENERATION_MANIFEST_PATH)) ||
  report.certification_status !== REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.video_count !== EXPECTED_VIDEO_COUNT ||
  report.mp4_generation !== 'PASS' ||
  report.frame_sequence_export !== 'PASS' ||
  report.video_traceability !== 'PASS' ||
  report.video_adapter_binding !== 'PASS' ||
  report.video_generation_failed !== false ||
  report.adapter_binding_loss !== false ||
  report.traceability_loss !== false ||
  report.video_generation !== true ||
  report.real_video_model_generation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_video_model_generated === 'PASS') === false ||
  frameSequenceFiles.length !== EXPECTED_VIDEO_COUNT ||
  !mp4Valid
) {
  console.error('Expected real video model generation for 4 sources with valid MP4 outputs');
  process.exit(1);
}

process.exit(0);
