import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CINEMATIC_DNA_PATH } from '../services/movieAnalysisCinematicDnaExtraction.js';
import { CINEMATIC_DNA_INTEGRATION_PATH } from '../services/movieAnalysisCinematicDnaIntegration.js';
import { DNA_ADAPTER_CERTIFICATION_REPORT_PATH } from '../services/movieAnalysisDnaAdapterCertification.js';
import { DNA_ADAPTER_LIBRARY_PATH } from '../services/movieAnalysisDnaAdapterLibrary.js';
import {
  DNA_PACKAGE_MANIFEST_PATH,
  DNA_PACKAGE_PATH,
  DNA_PACKAGE_REPORT_PATH,
  DNA_PACKAGING_PASS_VERDICT,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDnaPackaging,
} from '../services/movieAnalysisDnaPackaging.js';
import { writeMovieAnalysisDnaPackagingValidationReport } from '../services/movieAnalysisDnaPackagingValidator.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  CINEMATIC_DNA_PATH,
  CINEMATIC_DNA_INTEGRATION_PATH,
  DNA_ADAPTER_LIBRARY_PATH,
  DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const { dnaPackage } = writeMovieAnalysisDnaPackaging(projectRoot);
const report = writeMovieAnalysisDnaPackagingValidationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_count=${report.adapter_count} adapter_count_valid=${report.adapter_count_valid} certification_preserved=${report.certification_preserved} dna_traceability_preserved=${report.dna_traceability_preserved} image_mapping_preserved=${report.image_mapping_preserved} video_mapping_preserved=${report.video_mapping_preserved} package_ready=${report.package_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: adapters=${audit.adapter_count_valid} certification=${audit.certification_preserved} trace=${audit.dna_traceability_preserved} image=${audit.image_mapping_preserved} video=${audit.video_mapping_preserved} source_ready=${audit.source_ready}`
  );
}
console.log(`package=${DNA_PACKAGE_PATH}`);
console.log(`manifest=${DNA_PACKAGE_MANIFEST_PATH}`);
console.log(`report=${DNA_PACKAGE_REPORT_PATH}`);
console.log(`package_ready=${dnaPackage.package_readiness.package_ready}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_PACKAGING_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.adapter_count_valid !== 'PASS' ||
  report.certification_preserved !== 'PASS' ||
  report.dna_traceability_preserved !== 'PASS' ||
  report.image_mapping_preserved !== 'PASS' ||
  report.video_mapping_preserved !== 'PASS' ||
  report.package_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS'
) {
  console.error(
    'Expected source_count=4 adapter_count=24 adapter_count_valid=PASS certification_preserved=PASS dna_traceability_preserved=PASS image_mapping_preserved=PASS video_mapping_preserved=PASS package_ready=PASS planning_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
