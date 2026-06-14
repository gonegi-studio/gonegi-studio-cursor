import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
  CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
  CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisCharacterEvolutionValidation.js';
import {
  LEVEL2_COMPLETE_FINAL_STATUS,
  LEVEL2_COMPLETENESS_AUDIT_DIR,
  LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR,
  LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH,
  LEVEL2_COMPLETENESS_AUDIT_MD_PATH,
  LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT,
  LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT,
  LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
  LEVEL2_GAP_AUDIT_COUNT,
  writeMovieAnalysisLevel2CompletenessRecheck,
} from '../services/movieAnalysisLevel2CompletenessAudit.js';
import {
  MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
  MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
  MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisMultiSeasonContinuityValidation.js';
import {
  RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT,
  RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
  RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRelationshipEvolutionValidation.js';
import {
  RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT,
  RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH,
  RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisRuntimeScalabilityValidation.js';
import {
  WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
  WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
  WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE,
} from '../services/movieAnalysisWorldStateMemoryValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const CLOSED_GAP_LABELS = [
  'Character Evolution',
  'Relationship Evolution',
  'World State Memory',
  'Long Form Narrative',
  'Production Scale',
];

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const priorAuditPath = path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH);
if (!fs.existsSync(priorAuditPath)) {
  console.error(`PRECHECK FAIL: Missing required upstream asset: ${LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH}`);
  process.exit(1);
}

const priorAudit = JSON.parse(fs.readFileSync(priorAuditPath, 'utf8')) as {
  final_verdict: string;
};

if (priorAudit.final_verdict !== LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH} must be ${LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT}`
  );
  process.exit(1);
}

const l2gPrechecks = [
  {
    path: CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
    passVerdict: CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
    statusMessage: CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE,
    readyField: 'character_evolution_validation_ready',
    phase: 'L2G-001',
  },
  {
    path: RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
    passVerdict: RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT,
    statusMessage: RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE,
    readyField: 'relationship_evolution_validation_ready',
    phase: 'L2G-002',
  },
  {
    path: WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
    passVerdict: WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
    statusMessage: WORLD_STATE_MEMORY_VALIDATION_STATUS_MESSAGE,
    readyField: 'world_state_memory_validation_ready',
    phase: 'L2G-003',
  },
  {
    path: MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
    passVerdict: MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
    statusMessage: MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE,
    readyField: 'multi_season_continuity_validation_ready',
    phase: 'L2G-004',
  },
  {
    path: RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH,
    passVerdict: RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT,
    statusMessage: RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE,
    readyField: 'runtime_scalability_validation_ready',
    phase: 'L2G-005',
  },
] as const;

for (const precheck of l2gPrechecks) {
  const reportPath = path.join(projectRoot, precheck.path);
  if (!fs.existsSync(reportPath)) {
    console.error(`PRECHECK FAIL: Missing required upstream asset: ${precheck.path}`);
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as Record<string, unknown>;
  if (
    report.final_verdict !== precheck.passVerdict ||
    report.certification_status !== precheck.statusMessage ||
    report[precheck.readyField] !== 'PASS'
  ) {
    console.error(`PRECHECK FAIL: ${precheck.phase} must be PASS before completeness recheck`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisLevel2CompletenessRecheck(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} gap_count=${report.gap_count} level3_entry_ready=${report.level3_entry_ready} level2_complete_claim_validated=${report.level2_complete_claim_validated} audit_failure=${report.audit_failure} level2_completeness_audit_ready=${report.level2_completeness_audit_ready}`
);
for (const audit of report.gap_audits) {
  console.log(`  ${audit.audit_id}: has_gap=${audit.has_gap} category=${audit.gap_category}`);
}
console.log(`report=${LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH}`);
console.log(`markdown=${LEVEL2_COMPLETENESS_AUDIT_MD_PATH}`);
console.log(`manifest=${LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR, 'level2-completeness-audit.json')
  ) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2_gap_audit_count !== LEVEL2_GAP_AUDIT_COUNT ||
  report.gap_count !== 0 ||
  report.gaps.length !== 0 ||
  report.level3_entry_ready !== true ||
  report.level2_complete_claim_validated !== true ||
  report.audit_failure !== false ||
  report.level2_completeness_audit_ready !== 'PASS' ||
  report.certification_status !== LEVEL2_COMPLETE_FINAL_STATUS ||
  report.gap_audits.length !== LEVEL2_GAP_AUDIT_COUNT ||
  report.gap_audits.filter((audit) => audit.has_gap).length !== 0 ||
  CLOSED_GAP_LABELS.every((label) =>
    report.gap_audits.some((audit) => audit.gap_label === label && audit.has_gap === false)
  ) === false
) {
  console.error(
    'Expected PASS with gap_count=0, LEVEL2_COMPLETE_FINAL, and all five L2G gap categories closed'
  );
  process.exit(1);
}

process.exit(0);
