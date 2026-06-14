import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  LEVEL2E_FULLY_CERTIFIED_STATUS,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
} from '../services/movieAnalysisLevel2EProductionScaleCertification.js';
import {
  LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT,
  LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
  LEVEL2_FINAL_TRACK_ENTRIES_V2,
  LEVEL2_FULLY_CERTIFIED_V2_STATUS,
} from '../services/movieAnalysisLevel2FinalCertificationV2.js';
import {
  LEVEL2_COMPLETE_STATUS,
  LEVEL2_MASTER_CERTIFICATION_V3_DIR,
  LEVEL2_MASTER_CERTIFICATION_V3_EXPORT_DIR,
  LEVEL2_MASTER_CERTIFICATION_V3_MANIFEST_PATH,
  LEVEL2_MASTER_CERTIFICATION_V3_MD_PATH,
  LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
  LEVEL2_MASTER_PRECHECK_ENTRIES_V3,
  LEVEL2_MASTER_TRACK_COUNT_V3,
  writeMovieAnalysisLevel2MasterCertificationV3,
} from '../services/movieAnalysisLevel2MasterCertificationV3.js';
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
    console.error(`PRECHECK FAIL: Missing required upstream asset: ${reportPath}`);
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
  LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
  LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT,
  LEVEL2_FULLY_CERTIFIED_V2_STATUS,
  'LEVEL2-FINAL-V2'
);

assertUpstreamReport(
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT,
  LEVEL2E_FULLY_CERTIFIED_STATUS,
  'LEVEL2E-PRODUCTION-SCALE'
);

assertUpstreamReport(
  REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
  REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT,
  REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE,
  'REAL-VIDEO-MASTER'
);

for (const entry of LEVEL2_MASTER_PRECHECK_ENTRIES_V3) {
  const abs = path.join(projectRoot, entry.report_path);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${entry.report_path} (${entry.upstream_id})`);
    process.exit(1);
  }
}

for (const entry of LEVEL2_FINAL_TRACK_ENTRIES_V2) {
  const abs = path.join(projectRoot, entry.report_path);
  if (!fs.existsSync(abs)) {
    console.error(`Missing required upstream asset: ${entry.report_path} (${entry.track_id})`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH))) {
  console.error(`Missing required upstream asset: ${VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisLevel2MasterCertificationV3(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} runtime_track_complete=${report.runtime_track_complete} consumption_track_complete=${report.consumption_track_complete} simulation_track_complete=${report.simulation_track_complete} real_runtime_track_complete=${report.real_runtime_track_complete} generation_track_complete=${report.generation_track_complete} real_video_track_complete=${report.real_video_track_complete} production_scale_complete=${report.production_scale_complete} multi_episode_complete=${report.multi_episode_complete} long_term_memory_complete=${report.long_term_memory_complete} cross_track_consistency=${report.cross_track_consistency} dna_traceability_preserved=${report.dna_traceability_preserved} adapter_traceability_preserved=${report.adapter_traceability_preserved} pipeline_traceability_preserved=${report.pipeline_traceability_preserved} level2_incomplete=${report.level2_incomplete} track_missing=${report.track_missing} cross_track_break=${report.cross_track_break} production_scale_failure=${report.production_scale_failure} video_pipeline_failure=${report.video_pipeline_failure} traceability_loss=${report.traceability_loss} certification_failure=${report.certification_failure} level2_master_certification_v3_ready=${report.level2_master_certification_v3_ready}`
);
for (const audit of report.precheck_audits) {
  console.log(`  ${audit.upstream_id}: exists=${audit.report_exists} passed=${audit.precheck_passed}`);
}
for (const audit of report.track_audits) {
  console.log(`  ${audit.track_id}: exists=${audit.report_exists} passed=${audit.track_passed}`);
}
console.log(`report=${LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH}`);
console.log(`markdown=${LEVEL2_MASTER_CERTIFICATION_V3_MD_PATH}`);
console.log(`manifest=${LEVEL2_MASTER_CERTIFICATION_V3_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_CERTIFICATION_V3_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_CERTIFICATION_V3_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_CERTIFICATION_V3_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(
      projectRoot,
      LEVEL2_MASTER_CERTIFICATION_V3_EXPORT_DIR,
      'level2-master-certification-v3.json'
    )
  ) ||
  report.certification_status !== LEVEL2_COMPLETE_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2_master_track_count !== LEVEL2_MASTER_TRACK_COUNT_V3 ||
  report.runtime_track_complete !== 'PASS' ||
  report.consumption_track_complete !== 'PASS' ||
  report.simulation_track_complete !== 'PASS' ||
  report.real_runtime_track_complete !== 'PASS' ||
  report.generation_track_complete !== 'PASS' ||
  report.real_video_track_complete !== 'PASS' ||
  report.production_scale_complete !== 'PASS' ||
  report.multi_episode_complete !== 'PASS' ||
  report.long_term_memory_complete !== 'PASS' ||
  report.cross_track_consistency !== 'PASS' ||
  report.dna_traceability_preserved !== 'PASS' ||
  report.adapter_traceability_preserved !== 'PASS' ||
  report.pipeline_traceability_preserved !== 'PASS' ||
  report.level2_incomplete !== false ||
  report.track_missing !== false ||
  report.cross_track_break !== false ||
  report.production_scale_failure !== false ||
  report.video_pipeline_failure !== false ||
  report.traceability_loss !== false ||
  report.certification_failure !== false ||
  report.level2_master_certification_v3_ready !== 'PASS' ||
  report.track_audits.length !== LEVEL2_MASTER_TRACK_COUNT_V3 ||
  report.track_audits.every((audit) => audit.track_passed) === false ||
  report.precheck_audits.every((audit) => audit.precheck_passed) === false
) {
  console.error(
    'Expected LEVEL2_COMPLETE with complete Level2A through Level2F integration, production scale, and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
