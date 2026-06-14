import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_SOURCE_COUNT,
  IMAGE_UPLOAD_PATH,
  UPLOAD_MANIFEST_PATH,
  VIDEO_UPLOAD_PATH,
} from '../services/movieAnalysisUploadBundle.js';
import {
  UPLOAD_BUNDLE_QUALITY_GATE_MD_PATH,
  UPLOAD_BUNDLE_QUALITY_GATE_PASS_VERDICT,
  UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH,
  writeMovieAnalysisUploadBundleQualityGateReport,
} from '../services/movieAnalysisUploadBundleQualityGate.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [IMAGE_UPLOAD_PATH, VIDEO_UPLOAD_PATH, UPLOAD_MANIFEST_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisUploadBundleQualityGateReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} image_upload_schema_valid=${report.image_upload_schema_valid} video_upload_schema_valid=${report.video_upload_schema_valid} manifest_links_valid=${report.manifest_links_valid} dataset_links_valid=${report.dataset_links_valid} package_trace_preserved=${report.package_trace_preserved} chain_ids_preserved=${report.chain_ids_preserved} safety_flags_preserved=${report.safety_flags_preserved} no_runtime_execution=${report.no_runtime_execution} no_video_generation=${report.no_video_generation} no_image_generation=${report.no_image_generation} no_gpu_execution=${report.no_gpu_execution}`
);
console.log(`report=${UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH}`);
console.log(`markdown=${UPLOAD_BUNDLE_QUALITY_GATE_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== UPLOAD_BUNDLE_QUALITY_GATE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.image_upload_schema_valid !== true ||
  report.video_upload_schema_valid !== true ||
  report.manifest_links_valid !== true ||
  report.dataset_links_valid !== true ||
  report.package_trace_preserved !== true ||
  report.chain_ids_preserved !== true ||
  report.safety_flags_preserved !== true ||
  report.no_runtime_execution !== true ||
  report.no_video_generation !== true ||
  report.no_image_generation !== true ||
  report.no_gpu_execution !== true
) {
  console.error(
    'Expected source_count=4 image_upload_schema_valid=true video_upload_schema_valid=true manifest_links_valid=true dataset_links_valid=true package_trace_preserved=true chain_ids_preserved=true safety_flags_preserved=true no_runtime_execution=true no_video_generation=true no_image_generation=true no_gpu_execution=true'
  );
  process.exit(1);
}

process.exit(0);
