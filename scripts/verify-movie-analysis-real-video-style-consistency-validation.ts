import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MULTI_FRAME_STYLE_MANIFEST_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealMultiFrameStyleConsistencyValidation.js';
import { CLIP_FRAMES_PER_SOURCE } from '../services/movieAnalysisRealVideoClipMotionValidation.js';
import {
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRealVideoLocationConsistencyValidation.js';
import { extractPngSamplesFromMp4 } from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';
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
  EXPECTED_VIDEO_STYLE_FRAME_COUNT,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_MD_PATH,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  VIDEO_STYLE_DIR,
  VIDEO_STYLE_MANIFEST_PATH,
  writeMovieAnalysisRealVideoStyleConsistencyValidation,
} from '../services/movieAnalysisRealVideoStyleConsistencyValidation.js';

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
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  'L2F-012'
);
assertUpstreamReport(
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  'L2F-007'
);
assertUpstreamReport(
  REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
  REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT,
  REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE,
  'L2F-010'
);

for (const asset of [VIDEO_MODEL_GENERATION_MANIFEST_PATH, MULTI_FRAME_STYLE_MANIFEST_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_MODEL_OUTPUT_DIR))) {
  console.error(`Missing required input directory: ${VIDEO_MODEL_OUTPUT_DIR}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealVideoStyleConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} frame_count=${report.frame_count} style_palette_persistence=${report.style_palette_persistence} lighting_style_persistence=${report.lighting_style_persistence} texture_style_persistence=${report.texture_style_persistence} composition_style_persistence=${report.composition_style_persistence} frame_to_frame_style_drift=${report.frame_to_frame_style_drift} style_adapter_binding=${report.style_adapter_binding} video_style_consistency=${report.video_style_consistency} style_drift=${report.style_drift} lighting_style_break=${report.lighting_style_break} texture_mismatch=${report.texture_mismatch} composition_break=${report.composition_break} real_video_style_consistency_validation_ready=${report.real_video_style_consistency_validation_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: palette=${audit.style_palette_persistence} lighting=${audit.lighting_style_persistence} texture=${audit.texture_style_persistence} composition=${audit.composition_style_persistence} drift=${audit.frame_to_frame_style_drift} adapter=${audit.style_adapter_binding} ready=${audit.source_video_style_consistency_validated} frames=${audit.style_frames.length}`
  );
}
console.log(`report=${REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_MD_PATH}`);
console.log(`manifest=${VIDEO_STYLE_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

const styleFiles = fs.existsSync(path.join(projectRoot, VIDEO_STYLE_DIR))
  ? fs.readdirSync(path.join(projectRoot, VIDEO_STYLE_DIR)).filter((name) =>
      name.endsWith('-video-style.json')
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
  !fs.existsSync(path.join(projectRoot, REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, VIDEO_STYLE_MANIFEST_PATH)) ||
  report.certification_status !== REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.frame_count !== EXPECTED_VIDEO_STYLE_FRAME_COUNT ||
  report.style_palette_persistence !== 'PASS' ||
  report.lighting_style_persistence !== 'PASS' ||
  report.texture_style_persistence !== 'PASS' ||
  report.composition_style_persistence !== 'PASS' ||
  report.frame_to_frame_style_drift !== 'PASS' ||
  report.style_adapter_binding !== 'PASS' ||
  report.video_style_consistency !== 'PASS' ||
  report.style_drift !== false ||
  report.lighting_style_break !== false ||
  report.texture_mismatch !== false ||
  report.composition_break !== false ||
  report.real_video_style_consistency_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_video_style_consistency_validated === 'PASS') ===
    false ||
  report.source_audits.every((audit) => audit.style_frames.length === CLIP_FRAMES_PER_SOURCE) ===
    false ||
  styleFiles.length !== EXPECTED_SOURCE_COUNT ||
  !mp4SamplesValid
) {
  console.error(
    'Expected video style consistency validation for 4 sources with 32 frames and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
