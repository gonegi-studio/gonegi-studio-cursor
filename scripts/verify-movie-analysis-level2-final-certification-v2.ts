import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GENERATION_PIPELINE_CERTIFIED_STATUS,
  GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT,
  GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
} from '../services/movieAnalysisGenerationPipelineCertification.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  LEVEL2_FINAL_CERTIFICATION_V2_DIR,
  LEVEL2_FINAL_CERTIFICATION_V2_MD_PATH,
  LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT,
  LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
  LEVEL2_FINAL_TRACK_COUNT_V2,
  LEVEL2_FINAL_TRACK_ENTRIES_V2,
  LEVEL2_FULLY_CERTIFIED_V2_STATUS,
  writeMovieAnalysisLevel2FinalCertificationV2,
} from '../services/movieAnalysisLevel2FinalCertificationV2.js';
import {
  REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT,
  REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
  REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE,
  VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
} from '../services/movieAnalysisRealVideoMasterCertification.js';

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
  REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
  REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT,
  REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE,
  'L2F-015'
);

assertUpstreamReport(
  GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
  GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT,
  GENERATION_PIPELINE_CERTIFIED_STATUS,
  'L2E-014'
);

if (!fs.existsSync(path.join(projectRoot, VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH))) {
  console.error(`Missing required upstream asset: ${VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH}`);
  process.exit(1);
}

for (const entry of LEVEL2_FINAL_TRACK_ENTRIES_V2) {
  const abs = path.join(projectRoot, entry.report_path);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${entry.report_path} (${entry.track_id})`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisLevel2FinalCertificationV2(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level2_final_tracks_complete=${report.level2_final_tracks_complete} runtime_complete=${report.runtime_complete} consumption_complete=${report.consumption_complete} simulation_complete=${report.simulation_complete} real_runtime_complete=${report.real_runtime_complete} generation_pipeline_complete=${report.generation_pipeline_complete} real_video_pipeline_complete=${report.real_video_pipeline_complete} dna_traceability_preserved=${report.dna_traceability_preserved} adapter_traceability_preserved=${report.adapter_traceability_preserved} cross_app_consistency=${report.cross_app_consistency} level2_pipeline_break=${report.level2_pipeline_break} certification_failure=${report.certification_failure} missing_upstream=${report.missing_upstream} traceability_loss=${report.traceability_loss} level2_final_certification_v2_ready=${report.level2_final_certification_v2_ready}`
);
for (const audit of report.track_audits) {
  console.log(`  ${audit.track_id}: exists=${audit.report_exists} passed=${audit.track_passed}`);
}
console.log(`report=${LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH}`);
console.log(`markdown=${LEVEL2_FINAL_CERTIFICATION_V2_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_FINAL_CERTIFICATION_V2_DIR)) ||
  report.certification_status !== LEVEL2_FULLY_CERTIFIED_V2_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2_final_track_count !== LEVEL2_FINAL_TRACK_COUNT_V2 ||
  report.level2_final_tracks_complete !== 'PASS' ||
  report.runtime_complete !== 'PASS' ||
  report.consumption_complete !== 'PASS' ||
  report.simulation_complete !== 'PASS' ||
  report.real_runtime_complete !== 'PASS' ||
  report.generation_pipeline_complete !== 'PASS' ||
  report.real_video_pipeline_complete !== 'PASS' ||
  report.dna_traceability_preserved !== 'PASS' ||
  report.adapter_traceability_preserved !== 'PASS' ||
  report.cross_app_consistency !== 'PASS' ||
  report.level2_pipeline_break !== false ||
  report.certification_failure !== false ||
  report.missing_upstream !== false ||
  report.traceability_loss !== false ||
  report.level2_final_certification_v2_ready !== 'PASS' ||
  report.track_audits.length !== LEVEL2_FINAL_TRACK_COUNT_V2 ||
  report.track_audits.every((audit) => audit.track_passed) === false
) {
  console.error(
    'Expected LEVEL2_FULLY_CERTIFIED_V2 with complete Level2A through Level2F integration and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
