import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MASTER_PACKAGE_REGISTRY_PATH } from '../services/movieAnalysisMasterPackageDesign.js';
import {
  DATASET_EXPORT_PASS_VERDICT,
  DATASET_MANIFEST_PATH,
  DATASET_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDatasetExport,
} from '../services/movieAnalysisDatasetExport.js';
import {
  DATASET_EXPORT_VALIDATION_MD_PATH,
  DATASET_EXPORT_VALIDATION_REPORT_PATH,
  writeMovieAnalysisDatasetExportValidationReport,
} from '../services/movieAnalysisDatasetExportValidator.js';
import {
  EXPORT_MANIFEST_PATH,
  EXPORT_PACKAGE_PATH,
} from '../services/movieAnalysisExportPackage.js';
import {
  IMPORT_SIMULATION_PASS_VERDICT,
  IMPORT_SIMULATION_REPORT_PATH,
} from '../services/movieAnalysisImportSimulation.js';
import {
  REAL_SOURCE_INTEGRATION_PASS_VERDICT,
  REAL_SOURCE_INTEGRATION_REPORT_PATH,
} from '../services/movieAnalysisRealSourceIntegration.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  MASTER_PACKAGE_REGISTRY_PATH,
  EXPORT_PACKAGE_PATH,
  EXPORT_MANIFEST_PATH,
  IMPORT_SIMULATION_REPORT_PATH,
  REAL_SOURCE_INTEGRATION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const importSimulation = JSON.parse(
  fs.readFileSync(path.join(projectRoot, IMPORT_SIMULATION_REPORT_PATH), 'utf8')
) as { final_verdict?: string };
if (importSimulation.final_verdict !== IMPORT_SIMULATION_PASS_VERDICT) {
  console.error(
    `${IMPORT_SIMULATION_REPORT_PATH} must have ${IMPORT_SIMULATION_PASS_VERDICT}`
  );
  process.exit(1);
}

const realSourceIntegration = JSON.parse(
  fs.readFileSync(path.join(projectRoot, REAL_SOURCE_INTEGRATION_REPORT_PATH), 'utf8')
) as { final_verdict?: string };
if (realSourceIntegration.final_verdict !== REAL_SOURCE_INTEGRATION_PASS_VERDICT) {
  console.error(
    `${REAL_SOURCE_INTEGRATION_REPORT_PATH} must have ${REAL_SOURCE_INTEGRATION_PASS_VERDICT}`
  );
  process.exit(1);
}

const { dataset } = writeMovieAnalysisDatasetExport(projectRoot);
const report = writeMovieAnalysisDatasetExportValidationReport(projectRoot, dataset);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} trace_integrity=${report.trace_integrity} chain_integrity=${report.chain_integrity} payload_integrity=${report.payload_integrity} image_app_ready=${report.image_app_ready} video_app_ready=${report.video_app_ready} dataset_export_complete=${report.dataset_export_complete}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: trace=${audit.trace_integrity} chain=${audit.chain_integrity} payload=${audit.payload_integrity} image=${audit.image_app_ready} video=${audit.video_app_ready}`
  );
}
console.log(`dataset=${DATASET_PATH}`);
console.log(`manifest=${DATASET_MANIFEST_PATH}`);
console.log(`report=${DATASET_EXPORT_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${DATASET_EXPORT_VALIDATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DATASET_EXPORT_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.trace_integrity !== 'PASS' ||
  report.chain_integrity !== 'PASS' ||
  report.payload_integrity !== 'PASS' ||
  report.image_app_ready !== 'PASS' ||
  report.video_app_ready !== 'PASS' ||
  report.dataset_export_complete !== 'PASS'
) {
  console.error(
    'Expected source_count=4 trace_integrity=PASS chain_integrity=PASS payload_integrity=PASS image_app_ready=PASS video_app_ready=PASS dataset_export_complete=PASS'
  );
  process.exit(1);
}

process.exit(0);
