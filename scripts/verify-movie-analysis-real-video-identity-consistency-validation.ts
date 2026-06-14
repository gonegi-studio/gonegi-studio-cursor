import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLIP_FRAMES_PER_SOURCE } from '../services/movieAnalysisRealVideoClipMotionValidation.js';
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
  EXPECTED_VIDEO_IDENTITY_FRAME_COUNT,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_MD_PATH,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  VIDEO_IDENTITY_DIR,
  VIDEO_IDENTITY_MANIFEST_PATH,
  extractPngSamplesFromMp4,
  writeMovieAnalysisRealVideoIdentityConsistencyValidation,
} from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';

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

const report = writeMovieAnalysisRealVideoIdentityConsistencyValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} frame_count=${report.frame_count} face_identity_persistence=${report.face_identity_persistence} hairstyle_persistence=${report.hairstyle_persistence} clothing_persistence=${report.clothing_persistence} dna_persistence=${report.dna_persistence} frame_to_frame_identity_drift=${report.frame_to_frame_identity_drift} video_identity_consistency=${report.video_identity_consistency} identity_break=${report.identity_break} character_swap=${report.character_swap} dna_mismatch=${report.dna_mismatch} real_video_identity_consistency_validation_ready=${report.real_video_identity_consistency_validation_ready}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_id}: face=${audit.face_identity_persistence} hair=${audit.hairstyle_persistence} clothing=${audit.clothing_persistence} dna=${audit.dna_persistence} drift=${audit.frame_to_frame_identity_drift} ready=${audit.source_video_identity_consistency_validated} frames=${audit.identity_frames.length}`
  );
}
console.log(`report=${REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_MD_PATH}`);
console.log(`manifest=${VIDEO_IDENTITY_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

const identityFiles = fs.existsSync(path.join(projectRoot, VIDEO_IDENTITY_DIR))
  ? fs.readdirSync(path.join(projectRoot, VIDEO_IDENTITY_DIR)).filter((name) =>
      name.endsWith('-video-identity.json')
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
  !fs.existsSync(path.join(projectRoot, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, VIDEO_IDENTITY_MANIFEST_PATH)) ||
  report.certification_status !== REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.frame_count !== EXPECTED_VIDEO_IDENTITY_FRAME_COUNT ||
  report.face_identity_persistence !== 'PASS' ||
  report.hairstyle_persistence !== 'PASS' ||
  report.clothing_persistence !== 'PASS' ||
  report.dna_persistence !== 'PASS' ||
  report.frame_to_frame_identity_drift !== 'PASS' ||
  report.video_identity_consistency !== 'PASS' ||
  report.identity_break !== false ||
  report.character_swap !== false ||
  report.dna_mismatch !== false ||
  report.real_video_identity_consistency_validation_ready !== 'PASS' ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_video_identity_consistency_validated === 'PASS') ===
    false ||
  report.source_audits.every((audit) => audit.identity_frames.length === CLIP_FRAMES_PER_SOURCE) ===
    false ||
  identityFiles.length !== EXPECTED_SOURCE_COUNT ||
  !mp4SamplesValid
) {
  console.error(
    'Expected video identity consistency validation for 4 sources with 32 frames and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
