import fs from 'node:fs';
import path from 'node:path';
import {
  ADAPTER_DETAIL_RESTORE_PASS_VERDICT,
  ADAPTER_DETAIL_RESTORE_PHASE,
  ADAPTER_DETAIL_RESTORE_REPORT_PATH,
  type MovieAnalysisAdapterDetailRestoreReport,
} from './movieAnalysisAdapterDetailRestore.js';
import {
  DATASET_NORMALIZATION_PASS_VERDICT,
  DATASET_NORMALIZATION_PHASE,
  DATASET_NORMALIZATION_REPORT_PATH,
  type MovieAnalysisDatasetNormalizationReport,
} from './movieAnalysisDatasetNormalization.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  NORMALIZATION_QUALITY_GATE_PASS_VERDICT,
  NORMALIZATION_QUALITY_GATE_PHASE,
  NORMALIZATION_QUALITY_GATE_REPORT_PATH,
  type MovieAnalysisNormalizationQualityGateReport,
} from './movieAnalysisNormalizationQualityGate.js';
import {
  REAL_WORLD_VALIDATION_PASS_VERDICT,
  REAL_WORLD_VALIDATION_PHASE,
  REAL_WORLD_VALIDATION_REPORT_PATH,
  type MovieAnalysisRealWorldValidationReport,
} from './movieAnalysisRealWorldValidation.js';
import {
  REDUNDANCY_DEDUP_FIX_PASS_VERDICT,
  REDUNDANCY_DEDUP_FIX_PHASE,
  REDUNDANCY_DEDUP_FIX_REPORT_PATH,
  type MovieAnalysisRedundancyDedupFixReport,
} from './movieAnalysisRedundancyDedupFix.js';
import {
  SCENE_GRANULARITY_RESTORE_PASS_VERDICT,
  SCENE_GRANULARITY_RESTORE_PHASE,
  SCENE_GRANULARITY_RESTORE_REPORT_PATH,
  type MovieAnalysisSceneGranularityRestoreReport,
} from './movieAnalysisSceneGranularityRestore.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const L1B_FINAL_CERTIFICATION_PHASE =
  'PHASE-L1B-007-MOVIE_ANALYSIS_L1B_FINAL_CERTIFICATION_V1' as const;
export const L1B_FINAL_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_L1B_FINAL_CERTIFICATION_V1' as const;
export const L1B_FINAL_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_L1B_FINAL_CERTIFICATION_V1' as const;
export const L1B_FINAL_CERTIFICATION_DIR =
  'reports/movie_analysis_level1b_certification' as const;
export const L1B_FINAL_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_level1b_certification/movie-analysis-level1b-certification-report.json' as const;
export const L1B_FINAL_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_level1b_certification/MOVIE_ANALYSIS_LEVEL1B_CERTIFICATION.md' as const;
export const L1B_FINAL_CERTIFICATION_STATUS_MESSAGE = 'LEVEL_1B_COMPLETE' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type L1bFinalCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_id?: string;
};

export type L1bPhaseEntry = {
  phase_id: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
};

export type L1bPhaseAudit = {
  phase_id: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  phase_passed: boolean;
};

export type L1bAdditionalValidation = {
  redundancy_after_fix: number;
  scene_granularity_restored: CertificationStatus;
  adapter_detail_restored: CertificationStatus;
  traceability_preserved: CertificationStatus;
  dna_coverage_preserved: CertificationStatus;
  adapter_coverage_preserved: CertificationStatus;
};

export type MovieAnalysisL1bFinalCertificationReport = {
  report_id: string;
  phase: typeof L1B_FINAL_CERTIFICATION_PHASE;
  timestamp: string;
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  source_count: number;
  adapter_count: number;
  real_world_validation: CertificationStatus;
  dedup_fix: CertificationStatus;
  dataset_normalization: CertificationStatus;
  normalization_quality_gate: CertificationStatus;
  scene_granularity_restore: CertificationStatus;
  adapter_detail_restore: CertificationStatus;
  l1b_phases_complete: CertificationStatus;
  additional_validation: L1bAdditionalValidation;
  level1b_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof L1B_FINAL_CERTIFICATION_STATUS_MESSAGE | null;
  phase_audits: L1bPhaseAudit[];
  final_verdict:
    | typeof L1B_FINAL_CERTIFICATION_PASS_VERDICT
    | typeof L1B_FINAL_CERTIFICATION_FAIL_VERDICT;
  issues: L1bFinalCertificationIssue[];
};

const L1B_PHASE_ENTRIES: L1bPhaseEntry[] = [
  {
    phase_id: 'L1B-001',
    phase: REAL_WORLD_VALIDATION_PHASE,
    report_path: REAL_WORLD_VALIDATION_REPORT_PATH,
    pass_verdict: REAL_WORLD_VALIDATION_PASS_VERDICT,
  },
  {
    phase_id: 'L1B-002',
    phase: REDUNDANCY_DEDUP_FIX_PHASE,
    report_path: REDUNDANCY_DEDUP_FIX_REPORT_PATH,
    pass_verdict: REDUNDANCY_DEDUP_FIX_PASS_VERDICT,
  },
  {
    phase_id: 'L1B-003',
    phase: DATASET_NORMALIZATION_PHASE,
    report_path: DATASET_NORMALIZATION_REPORT_PATH,
    pass_verdict: DATASET_NORMALIZATION_PASS_VERDICT,
  },
  {
    phase_id: 'L1B-004',
    phase: NORMALIZATION_QUALITY_GATE_PHASE,
    report_path: NORMALIZATION_QUALITY_GATE_REPORT_PATH,
    pass_verdict: NORMALIZATION_QUALITY_GATE_PASS_VERDICT,
  },
  {
    phase_id: 'L1B-005',
    phase: SCENE_GRANULARITY_RESTORE_PHASE,
    report_path: SCENE_GRANULARITY_RESTORE_REPORT_PATH,
    pass_verdict: SCENE_GRANULARITY_RESTORE_PASS_VERDICT,
  },
  {
    phase_id: 'L1B-006',
    phase: ADAPTER_DETAIL_RESTORE_PHASE,
    report_path: ADAPTER_DETAIL_RESTORE_REPORT_PATH,
    pass_verdict: ADAPTER_DETAIL_RESTORE_PASS_VERDICT,
  },
];

function loadReport<T>(projectRoot: string, reportPath: string): T | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function auditPhase(
  projectRoot: string,
  entry: L1bPhaseEntry,
  issues: L1bFinalCertificationIssue[]
): L1bPhaseAudit {
  const abs = path.join(projectRoot, entry.report_path);
  const reportExists = fs.existsSync(abs);

  if (!reportExists) {
    issues.push({
      code: 'PHASE_REPORT_MISSING',
      message: `Missing ${entry.report_path}`,
      severity: 'error',
      phase_id: entry.phase_id,
    });
    return {
      phase_id: entry.phase_id,
      phase: entry.phase,
      report_path: entry.report_path,
      report_exists: false,
      phase_passed: false,
    };
  }

  const report = JSON.parse(fs.readFileSync(abs, 'utf8')) as { final_verdict?: string };
  const phasePassed = report.final_verdict === entry.pass_verdict;

  if (!phasePassed) {
    issues.push({
      code: 'PHASE_NOT_PASS',
      message: `${entry.phase_id} must have ${entry.pass_verdict}`,
      severity: 'error',
      phase_id: entry.phase_id,
    });
  }

  return {
    phase_id: entry.phase_id,
    phase: entry.phase,
    report_path: entry.report_path,
    report_exists: true,
    phase_passed: phasePassed,
  };
}

function buildMarkdown(report: MovieAnalysisL1bFinalCertificationReport): string {
  const lines = [
    '# Movie Analysis Level 1B Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## ${report.certification_status}`, '');
  }

  lines.push(
    '## Certification Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    '',
    '## L1B Phase Validation',
    '',
    '| Phase | Status |',
    '| --- | --- |',
    `| real_world_validation | ${report.real_world_validation} |`,
    `| dedup_fix | ${report.dedup_fix} |`,
    `| dataset_normalization | ${report.dataset_normalization} |`,
    `| normalization_quality_gate | ${report.normalization_quality_gate} |`,
    `| scene_granularity_restore | ${report.scene_granularity_restore} |`,
    `| adapter_detail_restore | ${report.adapter_detail_restore} |`,
    `| l1b_phases_complete | ${report.l1b_phases_complete} |`,
    '',
    '## Additional Validation',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| redundancy_after_fix | ${report.additional_validation.redundancy_after_fix} |`,
    `| scene_granularity_restored | ${report.additional_validation.scene_granularity_restored} |`,
    `| adapter_detail_restored | ${report.additional_validation.adapter_detail_restored} |`,
    `| traceability_preserved | ${report.additional_validation.traceability_preserved} |`,
    `| dna_coverage_preserved | ${report.additional_validation.dna_coverage_preserved} |`,
    `| adapter_coverage_preserved | ${report.additional_validation.adapter_coverage_preserved} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| level1b_certification_ready | ${report.level1b_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Phase Audits',
    ''
  );

  for (const audit of report.phase_audits) {
    lines.push(
      `- ${audit.phase_id} ${audit.phase}: report=${audit.report_exists ? 'PASS' : 'FAIL'} phase=${audit.phase_passed ? 'PASS' : 'FAIL'}`
    );
  }

  if (report.issues.length > 0) {
    lines.push('', '## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: L1bFinalCertificationIssue[],
  phaseAudits: L1bPhaseAudit[] = []
): MovieAnalysisL1bFinalCertificationReport {
  const report: MovieAnalysisL1bFinalCertificationReport = {
    report_id: 'movie-analysis-level1b-certification-report-v1',
    phase: L1B_FINAL_CERTIFICATION_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_count: 0,
    adapter_count: 0,
    real_world_validation: 'FAIL',
    dedup_fix: 'FAIL',
    dataset_normalization: 'FAIL',
    normalization_quality_gate: 'FAIL',
    scene_granularity_restore: 'FAIL',
    adapter_detail_restore: 'FAIL',
    l1b_phases_complete: 'FAIL',
    additional_validation: {
      redundancy_after_fix: -1,
      scene_granularity_restored: 'FAIL',
      adapter_detail_restored: 'FAIL',
      traceability_preserved: 'FAIL',
      dna_coverage_preserved: 'FAIL',
      adapter_coverage_preserved: 'FAIL',
    },
    level1b_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    phase_audits: phaseAudits,
    final_verdict: L1B_FINAL_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, L1B_FINAL_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, L1B_FINAL_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, L1B_FINAL_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisL1bFinalCertificationReport(
  projectRoot?: string
): MovieAnalysisL1bFinalCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: L1bFinalCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const adapterDetailReport = loadReport<MovieAnalysisAdapterDetailRestoreReport>(
    root,
    ADAPTER_DETAIL_RESTORE_REPORT_PATH
  );
  if (!adapterDetailReport) {
    issues.push({
      code: 'ADAPTER_DETAIL_RESTORE_REPORT_MISSING',
      message: `Missing ${ADAPTER_DETAIL_RESTORE_REPORT_PATH}`,
      severity: 'error',
      phase_id: 'L1B-006',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (adapterDetailReport.final_verdict !== ADAPTER_DETAIL_RESTORE_PASS_VERDICT) {
    issues.push({
      code: 'ADAPTER_DETAIL_RESTORE_NOT_PASS',
      message: `Adapter detail restore must have ${ADAPTER_DETAIL_RESTORE_PASS_VERDICT}`,
      severity: 'error',
      phase_id: 'L1B-006',
    });
  }

  const phaseAudits = L1B_PHASE_ENTRIES.map((entry) => auditPhase(root, entry, issues));
  const l1bPhasesComplete = phaseAudits.every(
    (audit) => audit.report_exists && audit.phase_passed
  )
    ? 'PASS'
    : 'FAIL';

  const realWorldReport = loadReport<MovieAnalysisRealWorldValidationReport>(
    root,
    REAL_WORLD_VALIDATION_REPORT_PATH
  );
  const dedupReport = loadReport<MovieAnalysisRedundancyDedupFixReport>(
    root,
    REDUNDANCY_DEDUP_FIX_REPORT_PATH
  );
  const normalizationReport = loadReport<MovieAnalysisDatasetNormalizationReport>(
    root,
    DATASET_NORMALIZATION_REPORT_PATH
  );
  const qualityGateReport = loadReport<MovieAnalysisNormalizationQualityGateReport>(
    root,
    NORMALIZATION_QUALITY_GATE_REPORT_PATH
  );
  const sceneGranularityReport = loadReport<MovieAnalysisSceneGranularityRestoreReport>(
    root,
    SCENE_GRANULARITY_RESTORE_REPORT_PATH
  );

  const phaseStatus = (phaseId: string): CertificationStatus => {
    const audit = phaseAudits.find((entry) => entry.phase_id === phaseId);
    return audit?.report_exists && audit.phase_passed ? 'PASS' : 'FAIL';
  };

  const redundancyAfterFix = normalizationReport?.redundant_fields_after_normalization ?? -1;
  const sceneGranularityRestored =
    sceneGranularityReport?.scene_granularity_restore_ready === 'PASS' &&
    sceneGranularityReport.source_audits.every((audit) => audit.granularity_restored === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const adapterDetailRestored =
    adapterDetailReport.adapter_detail_restore_ready === 'PASS' &&
    adapterDetailReport.source_audits.every((audit) => audit.adapter_detail_restored === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const traceabilityPreserved = qualityGateReport?.traceability_preserved ?? 'FAIL';
  const dnaCoveragePreserved = qualityGateReport?.dna_coverage_preserved ?? 'FAIL';
  const adapterCoveragePreserved = qualityGateReport?.adapter_coverage_preserved ?? 'FAIL';

  if (redundancyAfterFix !== 0) {
    issues.push({
      code: 'REDUNDANCY_AFTER_FIX_NOT_ZERO',
      message: `Expected redundancy_after_fix=0, got ${redundancyAfterFix}`,
      severity: 'error',
      phase_id: 'L1B-003',
    });
  }

  if (sceneGranularityRestored !== 'PASS') {
    issues.push({
      code: 'SCENE_GRANULARITY_NOT_RESTORED',
      message: 'scene_granularity_restored must be PASS',
      severity: 'error',
      phase_id: 'L1B-005',
    });
  }

  if (adapterDetailRestored !== 'PASS') {
    issues.push({
      code: 'ADAPTER_DETAIL_NOT_RESTORED',
      message: 'adapter_detail_restored must be PASS',
      severity: 'error',
      phase_id: 'L1B-006',
    });
  }

  if (traceabilityPreserved !== 'PASS') {
    issues.push({
      code: 'TRACEABILITY_NOT_PRESERVED',
      message: 'traceability_preserved must be PASS',
      severity: 'error',
      phase_id: 'L1B-004',
    });
  }

  if (dnaCoveragePreserved !== 'PASS') {
    issues.push({
      code: 'DNA_COVERAGE_NOT_PRESERVED',
      message: 'dna_coverage_preserved must be PASS',
      severity: 'error',
      phase_id: 'L1B-004',
    });
  }

  if (adapterCoveragePreserved !== 'PASS') {
    issues.push({
      code: 'ADAPTER_COVERAGE_NOT_PRESERVED',
      message: 'adapter_coverage_preserved must be PASS',
      severity: 'error',
      phase_id: 'L1B-004',
    });
  }

  const sourceCount = realWorldReport?.source_count ?? EXPECTED_SOURCE_COUNT;
  const adapterCount = realWorldReport?.adapter_count ?? EXPECTED_ADAPTER_COUNT;

  if (sourceCount !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (adapterCount !== EXPECTED_ADAPTER_COUNT) {
    issues.push({
      code: 'ADAPTER_COUNT_MISMATCH',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const planningReports = [
    realWorldReport,
    dedupReport,
    normalizationReport,
    qualityGateReport,
    sceneGranularityReport,
    adapterDetailReport,
  ].filter((report): report is NonNullable<typeof report> => report !== null);

  const safetyValid = planningReports.every(
    (report) => report.planning_only === true && report.planning_only_status === 'PASS'
  );

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed across L1B phases',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = safetyValid ? 'PASS' : 'FAIL';

  const additionalValidation: L1bAdditionalValidation = {
    redundancy_after_fix: redundancyAfterFix,
    scene_granularity_restored: sceneGranularityRestored,
    adapter_detail_restored: adapterDetailRestored,
    traceability_preserved: traceabilityPreserved,
    dna_coverage_preserved: dnaCoveragePreserved,
    adapter_coverage_preserved: adapterCoveragePreserved,
  };

  const additionalValid =
    redundancyAfterFix === 0 &&
    sceneGranularityRestored === 'PASS' &&
    adapterDetailRestored === 'PASS' &&
    traceabilityPreserved === 'PASS' &&
    dnaCoveragePreserved === 'PASS' &&
    adapterCoveragePreserved === 'PASS';

  const level1bCertificationReady =
    l1bPhasesComplete === 'PASS' &&
    additionalValid &&
    planningOnlyStatus === 'PASS' &&
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = level1bCertificationReady === 'PASS';

  const report: MovieAnalysisL1bFinalCertificationReport = {
    report_id: 'movie-analysis-level1b-certification-report-v1',
    phase: L1B_FINAL_CERTIFICATION_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_count: sourceCount,
    adapter_count: adapterCount,
    real_world_validation: phaseStatus('L1B-001'),
    dedup_fix: phaseStatus('L1B-002'),
    dataset_normalization: phaseStatus('L1B-003'),
    normalization_quality_gate: phaseStatus('L1B-004'),
    scene_granularity_restore: phaseStatus('L1B-005'),
    adapter_detail_restore: phaseStatus('L1B-006'),
    l1b_phases_complete: l1bPhasesComplete,
    additional_validation: additionalValidation,
    level1b_certification_ready: level1bCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? L1B_FINAL_CERTIFICATION_STATUS_MESSAGE : null,
    phase_audits: phaseAudits,
    final_verdict: pass
      ? L1B_FINAL_CERTIFICATION_PASS_VERDICT
      : L1B_FINAL_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, L1B_FINAL_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, L1B_FINAL_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, L1B_FINAL_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
