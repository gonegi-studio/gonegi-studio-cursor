import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  CROSS_APP_CONSUMPTION_CERTIFICATION_PHASE,
  CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
  type MovieAnalysisCrossAppConsumptionCertificationReport,
} from './movieAnalysisCrossAppConsumptionCertification.js';
import {
  IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  IMAGE_APP_CONSUMPTION_VALIDATION_PHASE,
  IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
  type MovieAnalysisImageAppConsumptionValidationReport,
} from './movieAnalysisImageAppConsumptionValidation.js';
import {
  VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  VIDEO_APP_CONSUMPTION_VALIDATION_PHASE,
  VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
  type MovieAnalysisVideoAppConsumptionValidationReport,
} from './movieAnalysisVideoAppConsumptionValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL2B_CONSUMPTION_CERTIFICATION_PHASE =
  'PHASE-LEVEL2B-004-MOVIE_ANALYSIS_LEVEL2B_CONSUMPTION_CERTIFICATION_V1' as const;
export const LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL2B_CONSUMPTION_CERTIFICATION_V1' as const;
export const LEVEL2B_CONSUMPTION_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL2B_CONSUMPTION_CERTIFICATION_V1' as const;
export const LEVEL2B_CONSUMPTION_CERTIFICATION_DIR =
  'reports/movie_analysis_level2b_consumption_certification' as const;
export const LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_level2b_consumption_certification/movie-analysis-level2b-consumption-certification-report.json' as const;
export const LEVEL2B_CONSUMPTION_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_level2b_consumption_certification/MOVIE_ANALYSIS_LEVEL2B_CONSUMPTION_CERTIFICATION.md' as const;
export const LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE = 'LEVEL2B_COMPLETE' as const;

export const LEVEL2B_PHASE_COUNT = 3 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type Level2BConsumptionCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_id?: string;
};

export type Level2BPhaseEntry = {
  phase_id: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
};

export type Level2BPhaseAudit = {
  phase_id: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  phase_passed: boolean;
};

export type Level2BCompletionValidation = {
  image_app_consumption_ready: CertificationStatus;
  video_app_consumption_ready: CertificationStatus;
  cross_app_consumption_ready: CertificationStatus;
};

export type MovieAnalysisLevel2BConsumptionCertificationReport = {
  report_id: string;
  phase: typeof LEVEL2B_CONSUMPTION_CERTIFICATION_PHASE;
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
  level2b_phase_count: typeof LEVEL2B_PHASE_COUNT;
  level2b_phases_complete: CertificationStatus;
  completion_validation: Level2BCompletionValidation;
  runtime_mapping_preserved: CertificationStatus;
  traceability_preserved: CertificationStatus;
  cross_app_binding_consistency: CertificationStatus;
  level2b_consumption_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE | null;
  image_app_consumption_validation_report_path: typeof IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH;
  video_app_consumption_validation_report_path: typeof VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH;
  cross_app_consumption_certification_report_path: typeof CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH;
  phase_audits: Level2BPhaseAudit[];
  final_verdict:
    | typeof LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT
    | typeof LEVEL2B_CONSUMPTION_CERTIFICATION_FAIL_VERDICT;
  issues: Level2BConsumptionCertificationIssue[];
};

export const LEVEL2B_PHASE_ENTRIES: Level2BPhaseEntry[] = [
  {
    phase_id: 'L2B-001',
    phase: IMAGE_APP_CONSUMPTION_VALIDATION_PHASE,
    report_path: IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    pass_verdict: IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  },
  {
    phase_id: 'L2B-002',
    phase: VIDEO_APP_CONSUMPTION_VALIDATION_PHASE,
    report_path: VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    pass_verdict: VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  },
  {
    phase_id: 'L2B-003',
    phase: CROSS_APP_CONSUMPTION_CERTIFICATION_PHASE,
    report_path: CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
    pass_verdict: CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  },
];

function loadReport<T>(projectRoot: string, reportPath: string): T | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function auditPhase(projectRoot: string, entry: Level2BPhaseEntry): Level2BPhaseAudit {
  const report = loadReport<{ final_verdict?: string }>(projectRoot, entry.report_path);
  const reportExists = report !== null;
  const phasePassed = reportExists && report.final_verdict === entry.pass_verdict;

  return {
    phase_id: entry.phase_id,
    phase: entry.phase,
    report_path: entry.report_path,
    report_exists: reportExists,
    phase_passed: phasePassed,
  };
}

function buildMarkdown(report: MovieAnalysisLevel2BConsumptionCertificationReport): string {
  const lines = [
    '# Movie Analysis Level 2B Consumption Certification',
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
    '## Certification Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Level 2B Chain',
    '',
    'Image App Consumption → Video App Consumption → Cross App Consumption',
    '',
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| level2b_phase_count | ${report.level2b_phase_count} |`,
    `| level2b_phases_complete | ${report.level2b_phases_complete} |`,
    `| image_app_consumption_ready | ${report.completion_validation.image_app_consumption_ready} |`,
    `| video_app_consumption_ready | ${report.completion_validation.video_app_consumption_ready} |`,
    `| cross_app_consumption_ready | ${report.completion_validation.cross_app_consumption_ready} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| cross_app_binding_consistency | ${report.cross_app_binding_consistency} |`,
    `| level2b_consumption_certification_ready | ${report.level2b_consumption_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
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
      `- report_exists: ${audit.report_exists}`,
      `- phase_passed: ${audit.phase_passed}`,
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
  issues: Level2BConsumptionCertificationIssue[],
  phaseAudits: Level2BPhaseAudit[] = []
): MovieAnalysisLevel2BConsumptionCertificationReport {
  const report: MovieAnalysisLevel2BConsumptionCertificationReport = {
    report_id: 'movie-analysis-level2b-consumption-certification-report-v1',
    phase: LEVEL2B_CONSUMPTION_CERTIFICATION_PHASE,
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
    level2b_phase_count: LEVEL2B_PHASE_COUNT,
    level2b_phases_complete: 'FAIL',
    completion_validation: {
      image_app_consumption_ready: 'FAIL',
      video_app_consumption_ready: 'FAIL',
      cross_app_consumption_ready: 'FAIL',
    },
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    cross_app_binding_consistency: 'FAIL',
    level2b_consumption_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    image_app_consumption_validation_report_path: IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    video_app_consumption_validation_report_path: VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    cross_app_consumption_certification_report_path: CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
    phase_audits: phaseAudits,
    final_verdict: LEVEL2B_CONSUMPTION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2B_CONSUMPTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2B_CONSUMPTION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel2BConsumptionCertification(
  projectRoot?: string
): MovieAnalysisLevel2BConsumptionCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2BConsumptionCertificationIssue[] = [];
  const timestamp = new Date().toISOString();
  const phaseAudits = LEVEL2B_PHASE_ENTRIES.map((entry) => auditPhase(root, entry));

  for (const audit of phaseAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'LEVEL2B_PHASE_REPORT_MISSING',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        phase_id: audit.phase_id,
      });
    } else if (!audit.phase_passed) {
      issues.push({
        code: 'LEVEL2B_PHASE_NOT_PASS',
        message: `${audit.phase_id} must have PASS verdict`,
        severity: 'error',
        phase_id: audit.phase_id,
      });
    }
  }

  const imageConsumptionReport = loadReport<MovieAnalysisImageAppConsumptionValidationReport>(
    root,
    IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH
  );
  const videoConsumptionReport = loadReport<MovieAnalysisVideoAppConsumptionValidationReport>(
    root,
    VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH
  );
  const crossAppReport = loadReport<MovieAnalysisCrossAppConsumptionCertificationReport>(
    root,
    CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH
  );

  if (!imageConsumptionReport || !videoConsumptionReport || !crossAppReport) {
    return writeFailReport(root, timestamp, issues, phaseAudits);
  }

  const completionValidation: Level2BCompletionValidation = {
    image_app_consumption_ready: toStatus(
      imageConsumptionReport.image_app_consumption_ready === 'PASS' &&
        imageConsumptionReport.final_verdict === IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT
    ),
    video_app_consumption_ready: toStatus(
      videoConsumptionReport.video_app_consumption_ready === 'PASS' &&
        videoConsumptionReport.final_verdict === VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT
    ),
    cross_app_consumption_ready: toStatus(
      crossAppReport.cross_app_consumption_certification_ready === 'PASS' &&
        crossAppReport.final_verdict === CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT
    ),
  };

  const runtimeMappingPreserved = toStatus(
    imageConsumptionReport.runtime_mapping_preserved === 'PASS' &&
      videoConsumptionReport.runtime_mapping_preserved === 'PASS' &&
      crossAppReport.runtime_mapping_consistency === 'PASS'
  );

  const traceabilityPreserved = toStatus(
    imageConsumptionReport.traceability_preserved === 'PASS' &&
      videoConsumptionReport.traceability_preserved === 'PASS' &&
      crossAppReport.adapter_traceability_consistency === 'PASS'
  );

  const crossAppBindingConsistency = toStatus(
    crossAppReport.cross_app_binding_consistency === 'PASS'
  );

  const sourceCount = crossAppReport.source_count;
  const adapterCount = crossAppReport.adapter_count;

  if (sourceCount !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (adapterCount !== EXPECTED_ADAPTER_COUNT) {
    issues.push({
      code: 'ADAPTER_COUNT_INVALID',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const safetyValid =
    imageConsumptionReport.planning_only === true &&
    imageConsumptionReport.planning_only_status === 'PASS' &&
    imageConsumptionReport.generation === false &&
    videoConsumptionReport.planning_only === true &&
    videoConsumptionReport.planning_only_status === 'PASS' &&
    videoConsumptionReport.generation === false &&
    crossAppReport.planning_only === true &&
    crossAppReport.planning_only_status === 'PASS' &&
    crossAppReport.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = toStatus(safetyValid);

  const level2bPhasesComplete = toStatus(
    phaseAudits.length === LEVEL2B_PHASE_COUNT && phaseAudits.every((audit) => audit.phase_passed)
  );

  const completionChecks = Object.values(completionValidation);
  const aggregateChecks: CertificationStatus[] = [
    level2bPhasesComplete,
    ...completionChecks,
    runtimeMappingPreserved,
    traceabilityPreserved,
    crossAppBindingConsistency,
    planningOnlyStatus,
  ];

  for (const status of aggregateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'LEVEL2B_VALIDATION_FAIL',
        message: 'Level 2B consumption certification validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const level2bConsumptionCertificationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    imageConsumptionReport.source_count === EXPECTED_SOURCE_COUNT &&
    videoConsumptionReport.source_count === EXPECTED_SOURCE_COUNT &&
    imageConsumptionReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    videoConsumptionReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    aggregateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = level2bConsumptionCertificationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'LEVEL2B_VALIDATION_FAIL')) {
    issues.push({
      code: 'LEVEL2B_CONSUMPTION_NOT_READY',
      message: 'Level 2B consumption certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisLevel2BConsumptionCertificationReport = {
    report_id: 'movie-analysis-level2b-consumption-certification-report-v1',
    phase: LEVEL2B_CONSUMPTION_CERTIFICATION_PHASE,
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
    level2b_phase_count: LEVEL2B_PHASE_COUNT,
    level2b_phases_complete: level2bPhasesComplete,
    completion_validation: completionValidation,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    cross_app_binding_consistency: crossAppBindingConsistency,
    level2b_consumption_certification_ready: level2bConsumptionCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE : null,
    image_app_consumption_validation_report_path: IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    video_app_consumption_validation_report_path: VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    cross_app_consumption_certification_report_path: CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
    phase_audits: phaseAudits,
    final_verdict: pass
      ? LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT
      : LEVEL2B_CONSUMPTION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2B_CONSUMPTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2B_CONSUMPTION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
