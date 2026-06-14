import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  LEVEL2E_FULLY_CERTIFIED_STATUS,
  LEVEL2E_PHASE_COUNT,
  LEVEL2E_PHASE_ENTRIES,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_EXPORT_DIR,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MANIFEST_PATH,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MD_PATH,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
  writeMovieAnalysisLevel2EProductionScaleCertification,
} from '../services/movieAnalysisLevel2EProductionScaleCertification.js';
import {
  MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisMultiEpisodeConsistencyValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const entry of LEVEL2E_PHASE_ENTRIES) {
  if (!fs.existsSync(path.join(projectRoot, entry.report_path))) {
    console.error(`Missing required upstream asset: ${entry.report_path}`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(projectRoot, entry.manifest_path))) {
    console.error(`Missing required upstream asset: ${entry.manifest_path}`);
    process.exit(1);
  }
  const phaseReport = JSON.parse(
    fs.readFileSync(path.join(projectRoot, entry.report_path), 'utf8')
  ) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (phaseReport.final_verdict !== entry.pass_verdict) {
    console.error(`PRECHECK FAIL: ${entry.phase_id} requires ${entry.pass_verdict}`);
    process.exit(1);
  }
  if (phaseReport.certification_status !== entry.status_message) {
    console.error(`PRECHECK FAIL: ${entry.phase_id} requires status ${entry.status_message}`);
    process.exit(1);
  }
}

const multiEpisodePath = path.join(projectRoot, MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH);
if (!fs.existsSync(multiEpisodePath)) {
  console.error(`Missing required upstream asset: ${MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(projectRoot, MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH))) {
  console.error(`Missing required upstream asset: ${MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH}`);
  process.exit(1);
}

const report = writeMovieAnalysisLevel2EProductionScaleCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level2e_phase_count=${report.level2e_phase_count} long_sequence_certified=${report.long_sequence_certified} multi_scene_certified=${report.multi_scene_certified} character_reentry_certified=${report.character_reentry_certified} location_reentry_certified=${report.location_reentry_certified} multi_character_certified=${report.multi_character_certified} production_batch_certified=${report.production_batch_certified} memory_stress_certified=${report.memory_stress_certified} story_arc_certified=${report.story_arc_certified} multi_episode_certified=${report.multi_episode_certified} production_scale_certified=${report.production_scale_certified} dna_binding_preserved=${report.dna_binding_preserved} adapter_binding_preserved=${report.adapter_binding_preserved} traceability_preserved=${report.traceability_preserved} missing_upstream=${report.missing_upstream} certification_failure=${report.certification_failure} memory_break=${report.memory_break} continuity_break=${report.continuity_break} traceability_loss=${report.traceability_loss} level2e_production_scale_certification_ready=${report.level2e_production_scale_certification_ready}`
);
for (const audit of report.phase_audits) {
  console.log(
    `  ${audit.phase_id}: passed=${audit.phase_passed} ${audit.certified_field}=${audit.certified}`
  );
}
console.log(`report=${LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(
      projectRoot,
      LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_EXPORT_DIR,
      'level2e-production-scale-certification.json'
    )
  ) ||
  report.certification_status !== LEVEL2E_FULLY_CERTIFIED_STATUS ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2e_phase_count !== LEVEL2E_PHASE_COUNT ||
  report.long_sequence_certified !== 'PASS' ||
  report.multi_scene_certified !== 'PASS' ||
  report.character_reentry_certified !== 'PASS' ||
  report.location_reentry_certified !== 'PASS' ||
  report.multi_character_certified !== 'PASS' ||
  report.production_batch_certified !== 'PASS' ||
  report.memory_stress_certified !== 'PASS' ||
  report.story_arc_certified !== 'PASS' ||
  report.multi_episode_certified !== 'PASS' ||
  report.production_scale_certified !== 'PASS' ||
  report.dna_binding_preserved !== 'PASS' ||
  report.adapter_binding_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.missing_upstream !== false ||
  report.certification_failure !== false ||
  report.memory_break !== false ||
  report.continuity_break !== false ||
  report.traceability_loss !== false ||
  report.level2e_production_scale_certification_ready !== 'PASS' ||
  report.phase_audits.length !== LEVEL2E_PHASE_COUNT ||
  report.phase_audits.every((audit) => audit.certified === 'PASS') === false
) {
  console.error('Expected LEVEL2E_FULLY_CERTIFIED with all L2E-001..009 phases PASS');
  process.exit(1);
}

process.exit(0);
