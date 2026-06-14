import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  LEVEL2B_CONSUMPTION_CERTIFICATION_PHASE,
  LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH,
  LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisLevel2BConsumptionCertificationReport,
} from './movieAnalysisLevel2BConsumptionCertification.js';
import {
  LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT,
  LEVEL2_RUNTIME_CERTIFICATION_PHASE,
  LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
  LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisLevel2RuntimeCertificationReport,
} from './movieAnalysisLevel2RuntimeCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL2_MASTER_CERTIFICATION_PHASE =
  'PHASE-LEVEL2B-005-MOVIE_ANALYSIS_LEVEL2_MASTER_CERTIFICATION_V1' as const;
export const LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL2_MASTER_CERTIFICATION_V1' as const;
export const LEVEL2_MASTER_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL2_MASTER_CERTIFICATION_V1' as const;
export const LEVEL2_MASTER_CERTIFICATION_DIR =
  'reports/movie_analysis_level2_master_certification' as const;
export const LEVEL2_MASTER_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_level2_master_certification/movie-analysis-level2-master-certification-report.json' as const;
export const LEVEL2_MASTER_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_level2_master_certification/MOVIE_ANALYSIS_LEVEL2_MASTER_CERTIFICATION.md' as const;
export const LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE = 'LEVEL2_COMPLETE' as const;

export const LEVEL2_MASTER_TRACK_COUNT = 2 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type Level2MasterCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  track_id?: string;
};

export type Level2MasterTrackEntry = {
  track_id: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
  status_message: string;
};

export type Level2MasterTrackAudit = {
  track_id: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  track_passed: boolean;
};

export type Level2MasterCompletionValidation = {
  level2_runtime_complete: CertificationStatus;
  level2b_consumption_complete: CertificationStatus;
  runtime_binding_complete: CertificationStatus;
  prompt_generation_complete: CertificationStatus;
  prompt_assembly_complete: CertificationStatus;
  image_runtime_ready: CertificationStatus;
  video_runtime_ready: CertificationStatus;
  image_app_consumption_ready: CertificationStatus;
  video_app_consumption_ready: CertificationStatus;
  cross_app_consumption_ready: CertificationStatus;
};

export type MovieAnalysisLevel2MasterCertificationReport = {
  report_id: string;
  phase: typeof LEVEL2_MASTER_CERTIFICATION_PHASE;
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
  level2_master_track_count: typeof LEVEL2_MASTER_TRACK_COUNT;
  level2_master_tracks_complete: CertificationStatus;
  completion_validation: Level2MasterCompletionValidation;
  runtime_mapping_preserved: CertificationStatus;
  traceability_preserved: CertificationStatus;
  level2_master_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE | null;
  level2_runtime_certification_report_path: typeof LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH;
  level2b_consumption_certification_report_path: typeof LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH;
  track_audits: Level2MasterTrackAudit[];
  final_verdict:
    | typeof LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT
    | typeof LEVEL2_MASTER_CERTIFICATION_FAIL_VERDICT;
  issues: Level2MasterCertificationIssue[];
};

export const LEVEL2_MASTER_TRACK_ENTRIES: Level2MasterTrackEntry[] = [
  {
    track_id: 'L2-009',
    phase: LEVEL2_RUNTIME_CERTIFICATION_PHASE,
    report_path: LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
    pass_verdict: LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT,
    status_message: LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE,
  },
  {
    track_id: 'L2B-004',
    phase: LEVEL2B_CONSUMPTION_CERTIFICATION_PHASE,
    report_path: LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH,
    pass_verdict: LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
    status_message: LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE,
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

function auditTrack(
  projectRoot: string,
  entry: Level2MasterTrackEntry
): Level2MasterTrackAudit {
  const report = loadReport<{
    final_verdict?: string;
    certification_status?: string | null;
  }>(projectRoot, entry.report_path);
  const reportExists = report !== null;
  const trackPassed =
    reportExists &&
    report.final_verdict === entry.pass_verdict &&
    report.certification_status === entry.status_message;

  return {
    track_id: entry.track_id,
    phase: entry.phase,
    report_path: entry.report_path,
    report_exists: reportExists,
    track_passed: trackPassed,
  };
}

function buildMarkdown(report: MovieAnalysisLevel2MasterCertificationReport): string {
  const lines = [
    '# Movie Analysis Level 2 Master Certification',
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
    '## Level 2 Master Chain',
    '',
    'Level 2 Runtime (L2-009) + Level 2B Consumption (L2B-004)',
    '',
    '## Completion Validation',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| level2_runtime_complete | ${report.completion_validation.level2_runtime_complete} |`,
    `| level2b_consumption_complete | ${report.completion_validation.level2b_consumption_complete} |`,
    `| runtime_binding_complete | ${report.completion_validation.runtime_binding_complete} |`,
    `| prompt_generation_complete | ${report.completion_validation.prompt_generation_complete} |`,
    `| prompt_assembly_complete | ${report.completion_validation.prompt_assembly_complete} |`,
    `| image_runtime_ready | ${report.completion_validation.image_runtime_ready} |`,
    `| video_runtime_ready | ${report.completion_validation.video_runtime_ready} |`,
    `| image_app_consumption_ready | ${report.completion_validation.image_app_consumption_ready} |`,
    `| video_app_consumption_ready | ${report.completion_validation.video_app_consumption_ready} |`,
    `| cross_app_consumption_ready | ${report.completion_validation.cross_app_consumption_ready} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| level2_master_track_count | ${report.level2_master_track_count} |`,
    `| level2_master_tracks_complete | ${report.level2_master_tracks_complete} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| level2_master_certification_ready | ${report.level2_master_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Track Audits',
    ''
  );

  for (const audit of report.track_audits) {
    lines.push(
      `### ${audit.track_id}`,
      '',
      `- phase: ${audit.phase}`,
      `- report_path: ${audit.report_path}`,
      `- report_exists: ${audit.report_exists}`,
      `- track_passed: ${audit.track_passed}`,
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
  issues: Level2MasterCertificationIssue[],
  trackAudits: Level2MasterTrackAudit[] = []
): MovieAnalysisLevel2MasterCertificationReport {
  const report: MovieAnalysisLevel2MasterCertificationReport = {
    report_id: 'movie-analysis-level2-master-certification-report-v1',
    phase: LEVEL2_MASTER_CERTIFICATION_PHASE,
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
    level2_master_track_count: LEVEL2_MASTER_TRACK_COUNT,
    level2_master_tracks_complete: 'FAIL',
    completion_validation: {
      level2_runtime_complete: 'FAIL',
      level2b_consumption_complete: 'FAIL',
      runtime_binding_complete: 'FAIL',
      prompt_generation_complete: 'FAIL',
      prompt_assembly_complete: 'FAIL',
      image_runtime_ready: 'FAIL',
      video_runtime_ready: 'FAIL',
      image_app_consumption_ready: 'FAIL',
      video_app_consumption_ready: 'FAIL',
      cross_app_consumption_ready: 'FAIL',
    },
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    level2_master_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    level2_runtime_certification_report_path: LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
    level2b_consumption_certification_report_path: LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH,
    track_audits: trackAudits,
    final_verdict: LEVEL2_MASTER_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_MASTER_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel2MasterCertification(
  projectRoot?: string
): MovieAnalysisLevel2MasterCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2MasterCertificationIssue[] = [];
  const timestamp = new Date().toISOString();
  const trackAudits = LEVEL2_MASTER_TRACK_ENTRIES.map((entry) => auditTrack(root, entry));

  for (const audit of trackAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'LEVEL2_MASTER_TRACK_REPORT_MISSING',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        track_id: audit.track_id,
      });
    } else if (!audit.track_passed) {
      issues.push({
        code: 'LEVEL2_MASTER_TRACK_NOT_PASS',
        message: `${audit.track_id} must have PASS verdict and expected status`,
        severity: 'error',
        track_id: audit.track_id,
      });
    }
  }

  const runtimeReport = loadReport<MovieAnalysisLevel2RuntimeCertificationReport>(
    root,
    LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH
  );
  const consumptionReport = loadReport<MovieAnalysisLevel2BConsumptionCertificationReport>(
    root,
    LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH
  );

  if (!runtimeReport || !consumptionReport) {
    return writeFailReport(root, timestamp, issues, trackAudits);
  }

  const completionValidation: Level2MasterCompletionValidation = {
    level2_runtime_complete: toStatus(
      runtimeReport.level2_runtime_certification_ready === 'PASS' &&
        runtimeReport.final_verdict === LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT &&
        runtimeReport.certification_status === LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE
    ),
    level2b_consumption_complete: toStatus(
      consumptionReport.level2b_consumption_certification_ready === 'PASS' &&
        consumptionReport.final_verdict === LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT &&
        consumptionReport.certification_status === LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE
    ),
    runtime_binding_complete: toStatus(
      runtimeReport.completion_validation.runtime_binding_complete === 'PASS'
    ),
    prompt_generation_complete: toStatus(
      runtimeReport.completion_validation.prompt_generation_complete === 'PASS'
    ),
    prompt_assembly_complete: toStatus(
      runtimeReport.completion_validation.prompt_assembly_complete === 'PASS'
    ),
    image_runtime_ready: toStatus(
      runtimeReport.completion_validation.image_runtime_package_ready === 'PASS'
    ),
    video_runtime_ready: toStatus(
      runtimeReport.completion_validation.video_runtime_package_ready === 'PASS'
    ),
    image_app_consumption_ready: toStatus(
      consumptionReport.completion_validation.image_app_consumption_ready === 'PASS'
    ),
    video_app_consumption_ready: toStatus(
      consumptionReport.completion_validation.video_app_consumption_ready === 'PASS'
    ),
    cross_app_consumption_ready: toStatus(
      consumptionReport.completion_validation.cross_app_consumption_ready === 'PASS'
    ),
  };

  const runtimeMappingPreserved = toStatus(
    runtimeReport.runtime_mapping_preserved === 'PASS' &&
      consumptionReport.runtime_mapping_preserved === 'PASS'
  );

  const traceabilityPreserved = toStatus(
    runtimeReport.traceability_preserved === 'PASS' &&
      consumptionReport.traceability_preserved === 'PASS'
  );

  const sourceCount = runtimeReport.source_count;
  const adapterCount = runtimeReport.adapter_count;

  if (
    sourceCount !== EXPECTED_SOURCE_COUNT ||
    consumptionReport.source_count !== EXPECTED_SOURCE_COUNT
  ) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (
    adapterCount !== EXPECTED_ADAPTER_COUNT ||
    consumptionReport.adapter_count !== EXPECTED_ADAPTER_COUNT
  ) {
    issues.push({
      code: 'ADAPTER_COUNT_INVALID',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const safetyValid =
    runtimeReport.planning_only === true &&
    runtimeReport.planning_only_status === 'PASS' &&
    runtimeReport.generation === false &&
    consumptionReport.planning_only === true &&
    consumptionReport.planning_only_status === 'PASS' &&
    consumptionReport.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = toStatus(safetyValid);

  const level2MasterTracksComplete = toStatus(
    trackAudits.length === LEVEL2_MASTER_TRACK_COUNT &&
      trackAudits.every((audit) => audit.track_passed)
  );

  const completionChecks = Object.values(completionValidation);
  const aggregateChecks: CertificationStatus[] = [
    level2MasterTracksComplete,
    ...completionChecks,
    runtimeMappingPreserved,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  for (const status of aggregateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'LEVEL2_MASTER_VALIDATION_FAIL',
        message: 'Level 2 master certification validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const level2MasterCertificationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    aggregateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = level2MasterCertificationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'LEVEL2_MASTER_VALIDATION_FAIL')) {
    issues.push({
      code: 'LEVEL2_MASTER_NOT_READY',
      message: 'Level 2 master certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisLevel2MasterCertificationReport = {
    report_id: 'movie-analysis-level2-master-certification-report-v1',
    phase: LEVEL2_MASTER_CERTIFICATION_PHASE,
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
    level2_master_track_count: LEVEL2_MASTER_TRACK_COUNT,
    level2_master_tracks_complete: level2MasterTracksComplete,
    completion_validation: completionValidation,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    level2_master_certification_ready: level2MasterCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE : null,
    level2_runtime_certification_report_path: LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
    level2b_consumption_certification_report_path: LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH,
    track_audits: trackAudits,
    final_verdict: pass
      ? LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT
      : LEVEL2_MASTER_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_MASTER_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
