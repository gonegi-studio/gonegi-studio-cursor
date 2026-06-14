import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPORT_PACKAGE_PATH } from '../services/movieAnalysisExportPackage.js';
import {
  EXPECTED_SOURCE_COUNT,
  IMPORT_SIMULATION_MD_PATH,
  IMPORT_SIMULATION_PASS_VERDICT,
  IMPORT_SIMULATION_REPORT_PATH,
  writeMovieAnalysisImportSimulationReport,
} from '../services/movieAnalysisImportSimulation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, EXPORT_PACKAGE_PATH))) {
  console.error(`Missing required upstream asset: ${EXPORT_PACKAGE_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisImportSimulationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} image_app_importable=${report.image_app_importable} video_app_importable=${report.video_app_importable} chain_trace_preserved=${report.chain_trace_preserved} payload_integrity=${report.payload_integrity} schema_integrity=${report.schema_integrity} consumer_integrity=${report.consumer_integrity}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: image=${audit.image_app_importable} video=${audit.video_app_importable} trace=${audit.chain_trace_preserved} payload=${audit.payload_integrity}`
  );
}
console.log(`report=${IMPORT_SIMULATION_REPORT_PATH}`);
console.log(`markdown=${IMPORT_SIMULATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== IMPORT_SIMULATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.image_app_importable !== true ||
  report.video_app_importable !== true ||
  report.chain_trace_preserved !== true ||
  report.payload_integrity !== true ||
  report.schema_integrity !== true ||
  report.consumer_integrity !== true
) {
  console.error(
    'Expected source_count=4 image_app_importable=true video_app_importable=true chain_trace_preserved=true payload_integrity=true schema_integrity=true consumer_integrity=true'
  );
  process.exit(1);
}

process.exit(0);
