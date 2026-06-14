import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REAL_IMAGE_PROMPT_EXPORT_PATH } from '../services/movieAnalysisRealImagePromptExport.js';
import {
  REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT,
  REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH,
} from '../services/movieAnalysisRealVisualContentAudit.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  REAL_SCENE_CONTENT_INGESTION_MD_PATH,
  REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT,
  REAL_SCENE_CONTENT_INGESTION_REPORT_PATH,
  REAL_SCENE_CONTENT_INGESTION_STATUS_MESSAGE,
  REAL_SCENE_CONTENT_MANIFEST_PATH,
  writeMovieAnalysisRealSceneContentIngestion,
} from '../services/movieAnalysisRealSceneContentIngestion.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const auditReportPath = path.join(projectRoot, REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH);
if (!fs.existsSync(auditReportPath)) {
  console.error(`Missing required upstream asset: ${REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH}`);
  process.exit(1);
}

const auditReport = JSON.parse(fs.readFileSync(auditReportPath, 'utf8')) as {
  final_verdict: string;
};
if (auditReport.final_verdict !== REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: LEVEL2E-007 ${REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH} must be ${REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT}`
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH))) {
  console.error(`Missing required input: ${REAL_IMAGE_PROMPT_EXPORT_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisRealSceneContentIngestion(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} scene_objects_present=${report.scene_objects_present} environment_present=${report.environment_present} composition_present=${report.composition_present} multi_region_variation=${report.multi_region_variation} non_gradient_only=${report.non_gradient_only} traceability_preserved=${report.traceability_preserved} real_scene_content_ingestion_ready=${report.real_scene_content_ingestion_ready}`
);
for (const audit of report.source_audits) {
  const metrics = audit.metrics
    ? `edge=${audit.metrics.edge_density.toFixed(4)} center=${audit.metrics.center_band_edge_density.toFixed(4)} step=${audit.metrics.gradient_step_dominance.toFixed(4)}`
    : 'none';
  console.log(
    `  ${audit.source_video_id}: objects=${audit.scene_objects_present} env=${audit.environment_present} comp=${audit.composition_present} regions=${audit.multi_region_variation} non_gradient=${audit.non_gradient_only} trace=${audit.traceability_preserved} gradient=${audit.gradient_only_detected} ${metrics} ready=${audit.source_ingestion_ready}`
  );
}
console.log(`report=${REAL_SCENE_CONTENT_INGESTION_REPORT_PATH}`);
console.log(`markdown=${REAL_SCENE_CONTENT_INGESTION_MD_PATH}`);
console.log(`manifest=${REAL_SCENE_CONTENT_MANIFEST_PATH}`);
console.log(`entries=${report.entries.length}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REAL_SCENE_CONTENT_INGESTION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, REAL_SCENE_CONTENT_INGESTION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, REAL_SCENE_CONTENT_MANIFEST_PATH)) ||
  report.certification_status !== REAL_SCENE_CONTENT_INGESTION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.scene_objects_present !== 'PASS' ||
  report.environment_present !== 'PASS' ||
  report.composition_present !== 'PASS' ||
  report.multi_region_variation !== 'PASS' ||
  report.non_gradient_only !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.real_scene_content_ingestion_ready !== 'PASS' ||
  report.entries.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.length !== EXPECTED_SOURCE_COUNT ||
  report.source_audits.every((audit) => audit.source_ingestion_ready === 'PASS') === false ||
  report.source_audits.every((audit) => audit.gradient_only_detected === false) === false
) {
  console.error(
    'Expected real scene content ingestion with scene visual information and all checks PASS'
  );
  process.exit(1);
}

process.exit(0);
