import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHARACTER_EVOLUTION_VALIDATION_EXPORT_DIR,
  CHARACTER_EVOLUTION_VALIDATION_MANIFEST_PATH,
  CHARACTER_EVOLUTION_VALIDATION_MD_PATH,
  CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
  CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
  CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE,
  GROWTH_JOURNEY_STAGE_COUNT,
  GROWTH_JOURNEY_TRANSITION_COUNT,
  writeMovieAnalysisCharacterEvolutionValidation,
} from '../services/movieAnalysisCharacterEvolutionValidation.js';
import {
  LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT,
  LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
} from '../services/movieAnalysisLevel2CompletenessAudit.js';
import {
  LEVEL2_COMPLETE_STATUS,
  LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
} from '../services/movieAnalysisLevel2MasterCertificationV3.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { VIDEO_IDENTITY_DIR } from '../services/movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { VIDEO_MOTION_DIR } from '../services/movieAnalysisRealVideoMotionConsistencyValidation.js';
import { VIDEO_STYLE_DIR } from '../services/movieAnalysisRealVideoStyleConsistencyValidation.js';

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
  LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
  LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT,
  LEVEL2_COMPLETE_STATUS,
  'LEVEL2-MASTER-V3'
);

const gapAuditPath = path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH);
if (!fs.existsSync(gapAuditPath)) {
  console.error(`PRECHECK FAIL: Missing required upstream asset: ${LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH}`);
  process.exit(1);
}
const gapAuditReport = JSON.parse(fs.readFileSync(gapAuditPath, 'utf8')) as { final_verdict: string };
if (gapAuditReport.final_verdict !== LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT) {
  console.error(`PRECHECK FAIL: ${LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH} must be ${LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT}`);
  process.exit(1);
}

for (const asset of [VIDEO_IDENTITY_DIR, VIDEO_STYLE_DIR, VIDEO_MOTION_DIR]) {
  if (!fs.existsSync(path.join(projectRoot, asset))) {
    console.error(`Missing required upstream asset: ${asset}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisCharacterEvolutionValidation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} growth_journey_stage_count=${report.growth_journey_stage_count} growth_journey_transition_count=${report.growth_journey_transition_count} character_identity_preserved=${report.character_identity_preserved} age_progression_valid=${report.age_progression_valid} costume_evolution_valid=${report.costume_evolution_valid} personality_evolution_valid=${report.personality_evolution_valid} role_evolution_valid=${report.role_evolution_valid} growth_memory_preserved=${report.growth_memory_preserved} dna_binding_preserved=${report.dna_binding_preserved} adapter_binding_preserved=${report.adapter_binding_preserved} traceability_preserved=${report.traceability_preserved} identity_loss=${report.identity_loss} character_reset=${report.character_reset} growth_regression=${report.growth_regression} dna_binding_break=${report.dna_binding_break} adapter_binding_break=${report.adapter_binding_break} traceability_loss=${report.traceability_loss} character_evolution_validation_ready=${report.character_evolution_validation_ready}`
);
for (const step of report.journey_steps) {
  console.log(
    `  ${step.age_stage}: source=${step.source_id} face=${step.face_identity} hair=${step.hair_identity} core_dna=${step.core_visual_dna_preserved} costume=${step.costume_evolution} growth=${step.growth_score.toFixed(3)}`
  );
}
console.log(
  `  reentry: face=${report.reentry_result.face_identity} hair=${report.reentry_result.hair_identity} core_dna=${report.reentry_result.core_visual_dna_preserved} memory=${report.reentry_result.growth_memory_preserved}`
);
console.log(`report=${CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${CHARACTER_EVOLUTION_VALIDATION_MD_PATH}`);
console.log(`manifest=${CHARACTER_EVOLUTION_VALIDATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, CHARACTER_EVOLUTION_VALIDATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, CHARACTER_EVOLUTION_VALIDATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, CHARACTER_EVOLUTION_VALIDATION_EXPORT_DIR, 'character-evolution-journey.json')
  ) ||
  report.certification_status !== CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.growth_journey_stage_count !== GROWTH_JOURNEY_STAGE_COUNT ||
  report.growth_journey_transition_count !== GROWTH_JOURNEY_TRANSITION_COUNT ||
  report.character_identity_preserved !== 'PASS' ||
  report.age_progression_valid !== 'PASS' ||
  report.costume_evolution_valid !== 'PASS' ||
  report.personality_evolution_valid !== 'PASS' ||
  report.role_evolution_valid !== 'PASS' ||
  report.growth_memory_preserved !== 'PASS' ||
  report.dna_binding_preserved !== 'PASS' ||
  report.adapter_binding_preserved !== 'PASS' ||
  report.traceability_preserved !== 'PASS' ||
  report.identity_loss !== false ||
  report.character_reset !== false ||
  report.growth_regression !== false ||
  report.dna_binding_break !== false ||
  report.adapter_binding_break !== false ||
  report.traceability_loss !== false ||
  report.character_evolution_validation_ready !== 'PASS' ||
  report.journey_steps.length !== GROWTH_JOURNEY_STAGE_COUNT
) {
  console.error(
    'Expected CHARACTER_EVOLUTION_VALIDATED with Child→Adult growth journey and GHIBLI reentry PASS'
  );
  process.exit(1);
}

process.exit(0);
