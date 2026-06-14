import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_RUNTIME_PACKAGE_DIR, IMAGE_RUNTIME_PACKAGE_PATH } from '../services/movieAnalysisImageRuntimePackage.js';
import {
  LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
  LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE,
} from '../services/movieAnalysisLevel2MasterCertification.js';
import {
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_PASS_VERDICT,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE,
} from '../services/movieAnalysisLevel2MasterSimulationCertification.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_IMAGE_RUNTIME_PREPARATION_MD_PATH,
  REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT,
  REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH,
  writeMovieAnalysisRealImageRuntimePreparation,
} from '../services/movieAnalysisRealImageRuntimePreparation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const level2MasterReportPath = path.join(projectRoot, LEVEL2_MASTER_CERTIFICATION_REPORT_PATH);
if (!fs.existsSync(level2MasterReportPath)) {
  console.error(`Missing required upstream asset: ${LEVEL2_MASTER_CERTIFICATION_REPORT_PATH}`);
  process.exit(1);
}

const level2MasterReport = JSON.parse(fs.readFileSync(level2MasterReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
};
if (
  level2MasterReport.final_verdict !== LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT ||
  level2MasterReport.certification_status !== LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE
) {
  console.error(
    `PRECHECK FAIL: LEVEL2_COMPLETE required (${LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE})`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR))) {
  console.error(`Missing required upstream directory: ${LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR}`);
  process.exit(1);
}

const masterSimulationReportPath = path.join(
  projectRoot,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH
);
if (!fs.existsSync(masterSimulationReportPath)) {
  console.error(
    `Missing required upstream asset: ${LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH}`
  );
  process.exit(1);
}

const masterSimulationReport = JSON.parse(
  fs.readFileSync(masterSimulationReportPath, 'utf8')
) as { final_verdict: string; certification_status: string | null };
if (
  masterSimulationReport.final_verdict !== LEVEL2_MASTER_SIMULATION_CERTIFICATION_PASS_VERDICT ||
  masterSimulationReport.certification_status !== LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE
) {
  console.error(
    `PRECHECK FAIL: LEVEL2_SIMULATION_COMPLETE required (${LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE})`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_DIR))) {
  console.error(`Missing required input directory: ${IMAGE_RUNTIME_PACKAGE_DIR}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_PATH))) {
  console.error(`Missing required input package: ${IMAGE_RUNTIME_PACKAGE_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealImageRuntimePreparation(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} image_runtime_ready=${report.image_runtime_ready} image_app_consumption_ready=${report.image_app_consumption_ready} image_generation_simulation_ready=${report.image_generation_simulation_ready} runtime_mapping_preserved=${report.runtime_mapping_preserved} traceability_preserved=${report.traceability_preserved} runtime_preparation_ready=${report.runtime_preparation_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: entry=${audit.image_runtime_entry_present} mapping=${audit.runtime_mapping_preserved} trace=${audit.traceability_preserved} ready=${audit.source_preparation_ready}`
  );
}
console.log(`report=${REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH}`);
console.log(`markdown=${REAL_IMAGE_RUNTIME_PREPARATION_MD_PATH}`);
console.log(`preparation_entries=${report.preparation_entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.image_runtime_ready !== 'PASS' ||
  report.image_app_consumption_ready !== 'PASS' ||
  report.image_generation_simulation_ready !== 'PASS' ||
  report.runtime_mapping_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.runtime_preparation_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.preparation_entries.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_preparation_ready === 'PASS') === false
) {
  console.error(
    'Expected real image runtime preparation for all sources with preserved mappings and traceability'
  );
  process.exit(1);
}

process.exit(0);
