import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCE_VIDEO_COVERAGE_REPORT_PATH } from '../services/exportRebuild/datasetMaterializer.js';
import { SIGNATURE_DISTANCE_REPORT_PATH } from '../services/cinematicSignatureDifferentiation.js';
import { SOURCE_VIDEO_DNA_DATASET_DIR, TITANIC_SOURCE_ID } from '../services/sourceVideoNumericalAndCinematicDna.js';
import {
  TITANIC_IMPORT_MANIFEST_PATH,
  TITANIC_INTEGRATION_PASS_VERDICT,
  TITANIC_INTEGRATION_READY_STATUS,
  TITANIC_INTEGRATION_REPORT_PATH,
  writeTitanicSourceIntegration,
} from '../services/titanicSourceIntegration.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTitanicSourceIntegration(projectRoot);
const summary = report.integration_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `titanic_source_id=${summary.titanic_source_id}`,
    `live_action_count=${summary.live_action_count}`,
    `source_video_count=${summary.source_video_count}`,
    `signature_quality=${summary.signature_quality}`,
    `signature_confusion=${summary.signature_confusion}`,
    `minimum_pairwise_distance=${summary.minimum_pairwise_distance}`,
    `coverage_live_action=${summary.coverage_live_action}`,
    `audit_report_refreshed=${summary.audit_report_refreshed}`,
    `signature_report_refreshed=${summary.signature_report_refreshed}`,
    `gpu_execution=${summary.gpu_execution}`,
    `integration_passed=${report.integration_passed}`,
  ].join(' ')
);
console.log(`report=${TITANIC_INTEGRATION_REPORT_PATH}`);
console.log(`manifest=${TITANIC_IMPORT_MANIFEST_PATH}`);
console.log(`coverage=${SOURCE_VIDEO_COVERAGE_REPORT_PATH}`);
console.log(`distance=${SIGNATURE_DISTANCE_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const registry = JSON.parse(
  fs.readFileSync(path.join(projectRoot, `${SOURCE_VIDEO_DNA_DATASET_DIR}/source-video-registry-v2.json`), 'utf8')
) as { live_action_count: number; source_videos: { source_video_id: string }[] };

const distance = JSON.parse(
  fs.readFileSync(path.join(projectRoot, SIGNATURE_DISTANCE_REPORT_PATH), 'utf8')
) as { minimum_pairwise_distance: number };

const checks: [string, boolean][] = [
  ['live_action_count=2', registry.live_action_count === 2],
  ['titanic_source_present', registry.source_videos.some((s) => s.source_video_id === TITANIC_SOURCE_ID)],
  ['signature_confusion<=10', Number(summary.signature_confusion) <= 10],
  ['minimum_pairwise_distance>=0.30', distance.minimum_pairwise_distance >= 0.3],
  ['titanic_manifest_exists', fs.existsSync(path.join(projectRoot, TITANIC_IMPORT_MANIFEST_PATH))],
  ['coverage_live_action=2', Number(summary.coverage_live_action) === 2],
  ['gpu_execution=false', summary.gpu_execution === false],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TITANIC_INTEGRATION_PASS_VERDICT) process.exit(1);
if (report.status !== TITANIC_INTEGRATION_READY_STATUS) process.exit(1);
