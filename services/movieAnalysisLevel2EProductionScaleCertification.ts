import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH,
  CHARACTER_REENTRY_VALIDATION_PASS_VERDICT,
  CHARACTER_REENTRY_VALIDATION_PHASE,
  CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
  CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisCharacterReentryValidation.js';
import {
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_PHASE,
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH,
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  LONG_SEQUENCE_VALIDATION_MANIFEST_PATH,
} from './movieAnalysisLongSequenceConsistencyValidation.js';
import {
  LOCATION_REENTRY_VALIDATION_MANIFEST_PATH,
  LOCATION_REENTRY_VALIDATION_PASS_VERDICT,
  LOCATION_REENTRY_VALIDATION_PHASE,
  LOCATION_REENTRY_VALIDATION_REPORT_PATH,
  LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisLocationReentryValidation.js';
import {
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_PHASE,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisMultiCharacterConsistencyValidation.js';
import {
  MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_PHASE,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisMultiEpisodeConsistencyValidation.js';
import {
  MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_SCENE_CONSISTENCY_VALIDATION_PHASE,
  MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH,
  MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  MULTI_SCENE_VALIDATION_MANIFEST_PATH,
} from './movieAnalysisMultiSceneConsistencyValidation.js';
import {
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PHASE,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisProductionBatchConsistencyValidation.js';
import {
  PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH,
  PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT,
  PRODUCTION_MEMORY_STRESS_TEST_PHASE,
  PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
  PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE,
} from './movieAnalysisProductionMemoryStressTest.js';
import {
  STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH,
  STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
  STORY_ARC_CONSISTENCY_VALIDATION_PHASE,
  STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
  STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisStoryArcConsistencyValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PHASE =
  'PHASE-LEVEL2E-010-LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_V1' as const;
export const LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_V1' as const;
export const LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_V1' as const;
export const LEVEL2E_FULLY_CERTIFIED_STATUS = 'LEVEL2E_FULLY_CERTIFIED' as const;
export const LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_DIR =
  'reports/movie_analysis_level2e_production_scale_certification' as const;
export const LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_level2e_production_scale_certification/movie-analysis-level2e-production-scale-certification-report.json' as const;
export const LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_level2e_production_scale_certification/MOVIE_ANALYSIS_LEVEL2E_PRODUCTION_SCALE_CERTIFICATION.md' as const;
export const LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_EXPORT_DIR =
  'exports/movie_analysis_level2e_production_scale_certification' as const;
export const LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MANIFEST_PATH =
  'exports/movie_analysis_level2e_production_scale_certification/movie-analysis-level2e-production-scale-certification-manifest.json' as const;

export const LEVEL2E_PHASE_COUNT = 9 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type Level2EProductionScaleCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_id?: string;
};

export type Level2EPhaseEntry = {
  phase_id: string;
  phase: string;
  report_path: string;
  manifest_path: string;
  pass_verdict: string;
  status_message: string;
  ready_field: string;
  certified_field: string;
};

export type Level2EPhaseAudit = {
  phase_id: string;
  phase: string;
  report_path: string;
  manifest_path: string;
  report_exists: boolean;
  manifest_exists: boolean;
  phase_passed: boolean;
  certified_field: string;
  certified: CertificationStatus;
};

export type MovieAnalysisLevel2EProductionScaleCertificationManifest = {
  manifest_id: string;
  phase: typeof LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PHASE;
  generated_at: string;
  level2e_phase_count: typeof LEVEL2E_PHASE_COUNT;
  phase_entries: Level2EPhaseEntry[];
  phase_audits: Level2EPhaseAudit[];
  production_scale_certified: CertificationStatus;
  certification_status: typeof LEVEL2E_FULLY_CERTIFIED_STATUS | null;
};

export type MovieAnalysisLevel2EProductionScaleCertificationReport = {
  report_id: string;
  phase: typeof LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PHASE;
  timestamp: string;
  planning_only: false;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  level2e_production_scale_certification_export_dir: typeof LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_EXPORT_DIR;
  level2e_production_scale_certification_manifest_path: typeof LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  level2e_phase_count: typeof LEVEL2E_PHASE_COUNT;
  long_sequence_certified: CertificationStatus;
  multi_scene_certified: CertificationStatus;
  character_reentry_certified: CertificationStatus;
  location_reentry_certified: CertificationStatus;
  multi_character_certified: CertificationStatus;
  production_batch_certified: CertificationStatus;
  memory_stress_certified: CertificationStatus;
  story_arc_certified: CertificationStatus;
  multi_episode_certified: CertificationStatus;
  production_scale_certified: CertificationStatus;
  dna_binding_preserved: CertificationStatus;
  adapter_binding_preserved: CertificationStatus;
  traceability_preserved: CertificationStatus;
  missing_upstream: boolean;
  certification_failure: boolean;
  memory_break: boolean;
  continuity_break: boolean;
  traceability_loss: boolean;
  level2e_production_scale_certification_ready: CertificationStatus;
  certification_status: typeof LEVEL2E_FULLY_CERTIFIED_STATUS | null;
  phase_audits: Level2EPhaseAudit[];
  final_verdict:
    | typeof LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT
    | typeof LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_FAIL_VERDICT;
  issues: Level2EProductionScaleCertificationIssue[];
};

export const LEVEL2E_PHASE_ENTRIES: Level2EPhaseEntry[] = [
  {
    phase_id: 'L2E-001',
    phase: LONG_SEQUENCE_CONSISTENCY_VALIDATION_PHASE,
    report_path: LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH,
    manifest_path: LONG_SEQUENCE_VALIDATION_MANIFEST_PATH,
    pass_verdict: LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'long_sequence_consistency_validation_ready',
    certified_field: 'long_sequence_certified',
  },
  {
    phase_id: 'L2E-002',
    phase: MULTI_SCENE_CONSISTENCY_VALIDATION_PHASE,
    report_path: MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH,
    manifest_path: MULTI_SCENE_VALIDATION_MANIFEST_PATH,
    pass_verdict: MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'multi_scene_consistency_validation_ready',
    certified_field: 'multi_scene_certified',
  },
  {
    phase_id: 'L2E-003',
    phase: CHARACTER_REENTRY_VALIDATION_PHASE,
    report_path: CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
    manifest_path: CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH,
    pass_verdict: CHARACTER_REENTRY_VALIDATION_PASS_VERDICT,
    status_message: CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'character_reentry_validation_ready',
    certified_field: 'character_reentry_certified',
  },
  {
    phase_id: 'L2E-004',
    phase: LOCATION_REENTRY_VALIDATION_PHASE,
    report_path: LOCATION_REENTRY_VALIDATION_REPORT_PATH,
    manifest_path: LOCATION_REENTRY_VALIDATION_MANIFEST_PATH,
    pass_verdict: LOCATION_REENTRY_VALIDATION_PASS_VERDICT,
    status_message: LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'location_reentry_validation_ready',
    certified_field: 'location_reentry_certified',
  },
  {
    phase_id: 'L2E-005',
    phase: MULTI_CHARACTER_CONSISTENCY_VALIDATION_PHASE,
    report_path: MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
    manifest_path: MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    pass_verdict: MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'multi_character_consistency_validation_ready',
    certified_field: 'multi_character_certified',
  },
  {
    phase_id: 'L2E-006',
    phase: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PHASE,
    report_path: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH,
    manifest_path: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    pass_verdict: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'production_batch_consistency_validation_ready',
    certified_field: 'production_batch_certified',
  },
  {
    phase_id: 'L2E-007',
    phase: PRODUCTION_MEMORY_STRESS_TEST_PHASE,
    report_path: PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
    manifest_path: PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH,
    pass_verdict: PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT,
    status_message: PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE,
    ready_field: 'production_memory_stress_test_ready',
    certified_field: 'memory_stress_certified',
  },
  {
    phase_id: 'L2E-008',
    phase: STORY_ARC_CONSISTENCY_VALIDATION_PHASE,
    report_path: STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
    manifest_path: STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    pass_verdict: STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'story_arc_consistency_validation_ready',
    certified_field: 'story_arc_certified',
  },
  {
    phase_id: 'L2E-009',
    phase: MULTI_EPISODE_CONSISTENCY_VALIDATION_PHASE,
    report_path: MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
    manifest_path: MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    pass_verdict: MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
    status_message: MULTI_EPISODE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
    ready_field: 'multi_episode_consistency_validation_ready',
    certified_field: 'multi_episode_certified',
  },
];

function loadReport(
  projectRoot: string,
  reportPath: string
): Record<string, unknown> | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as Record<string, unknown>;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function aggregateBindingStatus(
  reports: Array<Record<string, unknown> | null>,
  field: string
): CertificationStatus {
  const values = reports
    .filter((report): report is Record<string, unknown> => report !== null)
    .map((report) => report[field])
    .filter((value): value is CertificationStatus => value === 'PASS' || value === 'FAIL');
  if (values.length === 0) {
    return 'FAIL';
  }
  return toStatus(values.every((value) => value === 'PASS'));
}

function reportMemoryBreak(report: Record<string, unknown>): boolean {
  return (
    report.long_sequence_identity_break === true ||
    report.long_sequence_location_break === true ||
    report.long_sequence_style_break === true ||
    report.long_sequence_motion_break === true ||
    report.long_sequence_story_break === true ||
    report.identity_memory_loss === true ||
    report.location_memory_loss === true ||
    report.batch_memory_loss === true ||
    report.batch_identity_break === true ||
    report.memory_loss === true ||
    report.episode_memory_loss === true
  );
}

function reportContinuityBreak(report: Record<string, unknown>): boolean {
  return (
    report.story_continuity_break === true ||
    report.character_reentry_failure === true ||
    report.location_reentry_failure === true ||
    report.story_arc_break === true ||
    report.continuity_break === true
  );
}

function reportTraceabilityLoss(report: Record<string, unknown>): boolean {
  return (
    report.traceability_loss === true ||
    report.traceability_preserved === 'FAIL' ||
    report.dna_binding_preserved === 'FAIL' ||
    report.adapter_binding_preserved === 'FAIL'
  );
}

function auditPhase(projectRoot: string, entry: Level2EPhaseEntry): Level2EPhaseAudit {
  const report = loadReport(projectRoot, entry.report_path);
  const manifestExists = fs.existsSync(path.join(projectRoot, entry.manifest_path));
  const reportExists = report !== null;
  const readyValue = report?.[entry.ready_field];
  const phasePassed =
    reportExists &&
    manifestExists &&
    report.final_verdict === entry.pass_verdict &&
    readyValue === 'PASS' &&
    report.certification_status === entry.status_message;

  return {
    phase_id: entry.phase_id,
    phase: entry.phase,
    report_path: entry.report_path,
    manifest_path: entry.manifest_path,
    report_exists: reportExists,
    manifest_exists: manifestExists,
    phase_passed: phasePassed,
    certified_field: entry.certified_field,
    certified: toStatus(phasePassed),
  };
}

function buildMarkdown(report: MovieAnalysisLevel2EProductionScaleCertificationReport): string {
  const lines = [
    '# Movie Analysis Level 2E Production Scale Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    '## Level 2E Production Chain',
    '',
    'L2E-001 → L2E-002 → L2E-003 → L2E-004 → L2E-005 → L2E-006 → L2E-007 → L2E-008 → L2E-009',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| long_sequence_certified | ${report.long_sequence_certified} |`,
    `| multi_scene_certified | ${report.multi_scene_certified} |`,
    `| character_reentry_certified | ${report.character_reentry_certified} |`,
    `| location_reentry_certified | ${report.location_reentry_certified} |`,
    `| multi_character_certified | ${report.multi_character_certified} |`,
    `| production_batch_certified | ${report.production_batch_certified} |`,
    `| memory_stress_certified | ${report.memory_stress_certified} |`,
    `| story_arc_certified | ${report.story_arc_certified} |`,
    `| multi_episode_certified | ${report.multi_episode_certified} |`,
    `| production_scale_certified | ${report.production_scale_certified} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| adapter_binding_preserved | ${report.adapter_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| missing_upstream | ${report.missing_upstream ? 'BLOCKED' : 'PASS'} |`,
    `| certification_failure | ${report.certification_failure ? 'BLOCKED' : 'PASS'} |`,
    `| memory_break | ${report.memory_break ? 'BLOCKED' : 'PASS'} |`,
    `| continuity_break | ${report.continuity_break ? 'BLOCKED' : 'PASS'} |`,
    `| traceability_loss | ${report.traceability_loss ? 'BLOCKED' : 'PASS'} |`,
    '',
    '## Phase Audits',
    ''
  );

  for (const audit of report.phase_audits) {
    lines.push(
      `### ${audit.phase_id}`,
      '',
      `- phase: ${audit.phase}`,
      `- report_path: ${audit.report_path}`,
      `- manifest_path: ${audit.manifest_path}`,
      `- report_exists: ${audit.report_exists}`,
      `- manifest_exists: ${audit.manifest_exists}`,
      `- phase_passed: ${audit.phase_passed}`,
      `- ${audit.certified_field}: ${audit.certified}`,
      ''
    );
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: Level2EProductionScaleCertificationIssue[],
  phaseAudits: Level2EPhaseAudit[] = []
): MovieAnalysisLevel2EProductionScaleCertificationReport {
  const missingUpstream = phaseAudits.some(
    (audit) => !audit.report_exists || !audit.manifest_exists
  );
  const certificationFailure = phaseAudits.some((audit) => !audit.phase_passed);

  const report: MovieAnalysisLevel2EProductionScaleCertificationReport = {
    report_id: 'movie-analysis-level2e-production-scale-certification-report-v1',
    phase: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PHASE,
    timestamp,
    planning_only: false,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    level2e_production_scale_certification_export_dir: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_EXPORT_DIR,
    level2e_production_scale_certification_manifest_path: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    level2e_phase_count: LEVEL2E_PHASE_COUNT,
    long_sequence_certified: 'FAIL',
    multi_scene_certified: 'FAIL',
    character_reentry_certified: 'FAIL',
    location_reentry_certified: 'FAIL',
    multi_character_certified: 'FAIL',
    production_batch_certified: 'FAIL',
    memory_stress_certified: 'FAIL',
    story_arc_certified: 'FAIL',
    multi_episode_certified: 'FAIL',
    production_scale_certified: 'FAIL',
    dna_binding_preserved: 'FAIL',
    adapter_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    missing_upstream: missingUpstream,
    certification_failure: certificationFailure,
    memory_break: true,
    continuity_break: true,
    traceability_loss: true,
    level2e_production_scale_certification_ready: 'FAIL',
    certification_status: null,
    phase_audits: phaseAudits,
    final_verdict: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel2EProductionScaleCertification(
  projectRoot?: string
): MovieAnalysisLevel2EProductionScaleCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2EProductionScaleCertificationIssue[] = [];
  const timestamp = new Date().toISOString();
  const phaseAudits = LEVEL2E_PHASE_ENTRIES.map((entry) => auditPhase(root, entry));
  const loadedReports = LEVEL2E_PHASE_ENTRIES.map((entry) => loadReport(root, entry.report_path));

  for (const audit of phaseAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        phase_id: audit.phase_id,
      });
    }
    if (!audit.manifest_exists) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing ${audit.manifest_path}`,
        severity: 'error',
        phase_id: audit.phase_id,
      });
    }
    if (audit.report_exists && !audit.phase_passed) {
      issues.push({
        code: 'CERTIFICATION_FAILURE',
        message: `${audit.phase_id} did not pass production-scale validation`,
        severity: 'error',
        phase_id: audit.phase_id,
      });
    }
  }

  const missingUpstream = phaseAudits.some(
    (audit) => !audit.report_exists || !audit.manifest_exists
  );
  const certificationFailure = phaseAudits.some((audit) => !audit.phase_passed);

  const memoryBreak = loadedReports.some(
    (report) => report !== null && reportMemoryBreak(report)
  );
  const continuityBreak = loadedReports.some(
    (report) => report !== null && reportContinuityBreak(report)
  );
  const traceabilityLoss = loadedReports.some(
    (report) => report !== null && reportTraceabilityLoss(report)
  );

  if (memoryBreak) {
    issues.push({
      code: 'MEMORY_BREAK',
      message: 'Memory break detected in Level 2E production chain',
      severity: 'error',
    });
  }
  if (continuityBreak) {
    issues.push({
      code: 'CONTINUITY_BREAK',
      message: 'Continuity break detected in Level 2E production chain',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability loss detected in Level 2E production chain',
      severity: 'error',
    });
  }

  const dnaBindingPreserved = aggregateBindingStatus(loadedReports, 'dna_binding_preserved');
  const adapterBindingPreserved = aggregateBindingStatus(
    loadedReports,
    'adapter_binding_preserved'
  );
  const traceabilityPreserved = aggregateBindingStatus(loadedReports, 'traceability_preserved');

  const certifiedByField = Object.fromEntries(
    phaseAudits.map((audit) => [audit.certified_field, audit.certified])
  ) as Record<string, CertificationStatus>;

  const productionScaleCertified = toStatus(
    phaseAudits.every((audit) => audit.certified === 'PASS') &&
      dnaBindingPreserved === 'PASS' &&
      adapterBindingPreserved === 'PASS' &&
      traceabilityPreserved === 'PASS' &&
      !memoryBreak &&
      !continuityBreak &&
      !traceabilityLoss
  );

  const gateChecks: CertificationStatus[] = [
    certifiedByField.long_sequence_certified ?? 'FAIL',
    certifiedByField.multi_scene_certified ?? 'FAIL',
    certifiedByField.character_reentry_certified ?? 'FAIL',
    certifiedByField.location_reentry_certified ?? 'FAIL',
    certifiedByField.multi_character_certified ?? 'FAIL',
    certifiedByField.production_batch_certified ?? 'FAIL',
    certifiedByField.memory_stress_certified ?? 'FAIL',
    certifiedByField.story_arc_certified ?? 'FAIL',
    certifiedByField.multi_episode_certified ?? 'FAIL',
    productionScaleCertified,
    dnaBindingPreserved,
    adapterBindingPreserved,
    traceabilityPreserved,
  ];

  const level2eProductionScaleCertificationReady =
    gateChecks.every((status) => status === 'PASS') &&
    !missingUpstream &&
    !certificationFailure &&
    !memoryBreak &&
    !continuityBreak &&
    !traceabilityLoss &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = level2eProductionScaleCertificationReady === 'PASS';

  const manifest: MovieAnalysisLevel2EProductionScaleCertificationManifest = {
    manifest_id: 'movie-analysis-level2e-production-scale-certification-manifest-v1',
    phase: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PHASE,
    generated_at: timestamp,
    level2e_phase_count: LEVEL2E_PHASE_COUNT,
    phase_entries: LEVEL2E_PHASE_ENTRIES,
    phase_audits: phaseAudits,
    production_scale_certified: productionScaleCertified,
    certification_status: pass ? LEVEL2E_FULLY_CERTIFIED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_EXPORT_DIR), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(
      root,
      LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_EXPORT_DIR,
      'level2e-production-scale-certification.json'
    ),
    `${JSON.stringify(
      {
        level2e_phase_count: LEVEL2E_PHASE_COUNT,
        phase_audits: phaseAudits.map((audit) => ({
          phase_id: audit.phase_id,
          phase: audit.phase,
          report_path: audit.report_path,
          manifest_path: audit.manifest_path,
          phase_passed: audit.phase_passed,
          certified_field: audit.certified_field,
          certified: audit.certified,
        })),
        production_scale_certified: productionScaleCertified,
        dna_binding_preserved: dnaBindingPreserved,
        adapter_binding_preserved: adapterBindingPreserved,
        traceability_preserved: traceabilityPreserved,
        certification_status: pass ? LEVEL2E_FULLY_CERTIFIED_STATUS : null,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  const report: MovieAnalysisLevel2EProductionScaleCertificationReport = {
    report_id: 'movie-analysis-level2e-production-scale-certification-report-v1',
    phase: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PHASE,
    timestamp,
    planning_only: false,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    level2e_production_scale_certification_export_dir: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_EXPORT_DIR,
    level2e_production_scale_certification_manifest_path: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MANIFEST_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    level2e_phase_count: LEVEL2E_PHASE_COUNT,
    long_sequence_certified: certifiedByField.long_sequence_certified ?? 'FAIL',
    multi_scene_certified: certifiedByField.multi_scene_certified ?? 'FAIL',
    character_reentry_certified: certifiedByField.character_reentry_certified ?? 'FAIL',
    location_reentry_certified: certifiedByField.location_reentry_certified ?? 'FAIL',
    multi_character_certified: certifiedByField.multi_character_certified ?? 'FAIL',
    production_batch_certified: certifiedByField.production_batch_certified ?? 'FAIL',
    memory_stress_certified: certifiedByField.memory_stress_certified ?? 'FAIL',
    story_arc_certified: certifiedByField.story_arc_certified ?? 'FAIL',
    multi_episode_certified: certifiedByField.multi_episode_certified ?? 'FAIL',
    production_scale_certified: productionScaleCertified,
    dna_binding_preserved: dnaBindingPreserved,
    adapter_binding_preserved: adapterBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    missing_upstream: missingUpstream,
    certification_failure: certificationFailure,
    memory_break: memoryBreak,
    continuity_break: continuityBreak,
    traceability_loss: traceabilityLoss,
    level2e_production_scale_certification_ready: level2eProductionScaleCertificationReady,
    certification_status: pass ? LEVEL2E_FULLY_CERTIFIED_STATUS : null,
    phase_audits: phaseAudits,
    final_verdict: pass
      ? LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT
      : LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
