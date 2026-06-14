import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  L2F_TRACK_COUNT,
  L2F_TRACK_ENTRIES,
  REAL_VIDEO_MASTER_CERTIFICATION_DIR,
  REAL_VIDEO_MASTER_CERTIFICATION_MD_PATH,
  REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT,
  REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
  REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE,
  VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
  VIDEO_MASTER_DIR,
  writeMovieAnalysisRealVideoMasterCertification,
} from '../services/movieAnalysisRealVideoMasterCertification.js';
import {
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
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
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  'L2F-014'
);

for (const entry of L2F_TRACK_ENTRIES) {
  const abs = path.join(projectRoot, entry.report_path);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${entry.report_path} (${entry.track_id})`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisRealVideoMasterCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} l2f_tracks_complete=${report.l2f_tracks_complete} video_generation_complete=${report.video_generation_complete} identity_consistency_validated=${report.identity_consistency_validated} location_consistency_validated=${report.location_consistency_validated} style_consistency_validated=${report.style_consistency_validated} motion_consistency_validated=${report.motion_consistency_validated} dna_binding_preserved=${report.dna_binding_preserved} adapter_binding_preserved=${report.adapter_binding_preserved} traceability_preserved=${report.traceability_preserved} pipeline_break=${report.pipeline_break} certification_failure=${report.certification_failure} missing_upstream=${report.missing_upstream} traceability_loss=${report.traceability_loss} real_video_master_certification_ready=${report.real_video_master_certification_ready}`
);
for (const audit of report.track_audits) {
  console.log(`  ${audit.track_id}: exists=${audit.report_exists} passed=${audit.track_passed}`);
}
console.log(`report=${REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${REAL_VIDEO_MASTER_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, REAL_VIDEO_MASTER_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, VIDEO_MASTER_DIR)) ||
  !fs.existsSync(path.join(projectRoot, VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH)) ||
  report.certification_status !== REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.l2f_track_count !== L2F_TRACK_COUNT ||
  report.l2f_tracks_complete !== 'PASS' ||
  report.video_generation_complete !== 'PASS' ||
  report.identity_consistency_validated !== 'PASS' ||
  report.location_consistency_validated !== 'PASS' ||
  report.style_consistency_validated !== 'PASS' ||
  report.motion_consistency_validated !== 'PASS' ||
  report.dna_binding_preserved !== 'PASS' ||
  report.adapter_binding_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.pipeline_break !== false ||
  report.certification_failure !== false ||
  report.missing_upstream !== false ||
  report.traceability_loss !== false ||
  report.real_video_master_certification_ready !== 'PASS' ||
  report.track_audits.length !== L2F_TRACK_COUNT ||
  report.track_audits.every((audit) => audit.track_passed) === false
) {
  console.error(
    'Expected REAL_VIDEO_PIPELINE_CERTIFIED with complete L2F-001 through L2F-014 integration and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
