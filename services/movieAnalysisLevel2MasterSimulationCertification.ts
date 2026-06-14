import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT,
  LEVEL2C_SIMULATION_CERTIFICATION_PHASE,
  LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH,
  LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisLevel2CSimulationCertificationReport,
} from './movieAnalysisLevel2CSimulationCertification.js';
import {
  LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_PHASE,
  LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
  LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisLevel2MasterCertificationReport,
} from './movieAnalysisLevel2MasterCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL2_MASTER_SIMULATION_CERTIFICATION_PHASE =
  'PHASE-LEVEL2C-005-MOVIE_ANALYSIS_LEVEL2_MASTER_SIMULATION_CERTIFICATION_V1' as const;
export const LEVEL2_MASTER_SIMULATION_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL2_MASTER_SIMULATION_CERTIFICATION_V1' as const;
export const LEVEL2_MASTER_SIMULATION_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL2_MASTER_SIMULATION_CERTIFICATION_V1' as const;
export const LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR =
  'reports/movie_analysis_level2_master_simulation_certification' as const;
export const LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_level2_master_simulation_certification/movie-analysis-level2-master-simulation-certification-report.json' as const;
export const LEVEL2_MASTER_SIMULATION_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_level2_master_simulation_certification/MOVIE_ANALYSIS_LEVEL2_MASTER_SIMULATION_CERTIFICATION.md' as const;
export const LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE =
  'LEVEL2_SIMULATION_COMPLETE' as const;

export const LEVEL2_MASTER_SIMULATION_TRACK_COUNT = 2 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type Level2MasterSimulationCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  track_id?: string;
};

export type Level2MasterSimulationTrackEntry = {
  track_id: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
  status_message: string;
};

export type Level2MasterSimulationTrackAudit = {
  track_id: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  track_passed: boolean;
};

export type Level2MasterSimulationCompletionValidation = {
  level2_runtime_complete: CertificationStatus;
  level2b_consumption_complete: CertificationStatus;
  level2c_simulation_complete: CertificationStatus;
  image_runtime_ready: CertificationStatus;
  video_runtime_ready: CertificationStatus;
  image_app_consumption_ready: CertificationStatus;
  video_app_consumption_ready: CertificationStatus;
  cross_app_consumption_ready: CertificationStatus;
  image_generation_simulation_ready: CertificationStatus;
  video_generation_simulation_ready: CertificationStatus;
  cross_generation_simulation_ready: CertificationStatus;
};

export type MovieAnalysisLevel2MasterSimulationCertificationReport = {
  report_id: string;
  phase: typeof LEVEL2_MASTER_SIMULATION_CERTIFICATION_PHASE;
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
  simulation_only: true;
  source_count: number;
  adapter_count: number;
  level2_master_simulation_track_count: typeof LEVEL2_MASTER_SIMULATION_TRACK_COUNT;
  level2_master_simulation_tracks_complete: CertificationStatus;
  completion_validation: Level2MasterSimulationCompletionValidation;
  runtime_mapping_preserved: CertificationStatus;
  traceability_preserved: CertificationStatus;
  level2_master_simulation_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE | null;
  level2_master_certification_report_path: typeof LEVEL2_MASTER_CERTIFICATION_REPORT_PATH;
  level2c_simulation_certification_report_path: typeof LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH;
  track_audits: Level2MasterSimulationTrackAudit[];
  final_verdict:
    | typeof LEVEL2_MASTER_SIMULATION_CERTIFICATION_PASS_VERDICT
    | typeof LEVEL2_MASTER_SIMULATION_CERTIFICATION_FAIL_VERDICT;
  issues: Level2MasterSimulationCertificationIssue[];
};

export const LEVEL2_MASTER_SIMULATION_TRACK_ENTRIES: Level2MasterSimulationTrackEntry[] = [
  {
    track_id: 'L2B-005',
    phase: LEVEL2_MASTER_CERTIFICATION_PHASE,
    report_path: LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
    pass_verdict: LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT,
    status_message: LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE,
  },
  {
    track_id: 'L2C-004',
    phase: LEVEL2C_SIMULATION_CERTIFICATION_PHASE,
    report_path: LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH,
    pass_verdict: LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT,
    status_message: LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE,
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
  entry: Level2MasterSimulationTrackEntry
): Level2MasterSimulationTrackAudit {
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

function buildMarkdown(report: MovieAnalysisLevel2MasterSimulationCertificationReport): string {
  const lines = [
    '# Movie Analysis Level 2 Master Simulation Certification',
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
    `| simulation_only | ${report.simulation_only} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Level 2 Master Simulation Chain',
    '',
    'Level 2 Master (L2B-005) + Level 2C Simulation (L2C-004)',
    '',
    '## Completion Validation',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| level2_runtime_complete | ${report.completion_validation.level2_runtime_complete} |`,
    `| level2b_consumption_complete | ${report.completion_validation.level2b_consumption_complete} |`,
    `| level2c_simulation_complete | ${report.completion_validation.level2c_simulation_complete} |`,
    `| image_runtime_ready | ${report.completion_validation.image_runtime_ready} |`,
    `| video_runtime_ready | ${report.completion_validation.video_runtime_ready} |`,
    `| image_app_consumption_ready | ${report.completion_validation.image_app_consumption_ready} |`,
    `| video_app_consumption_ready | ${report.completion_validation.video_app_consumption_ready} |`,
    `| cross_app_consumption_ready | ${report.completion_validation.cross_app_consumption_ready} |`,
    `| image_generation_simulation_ready | ${report.completion_validation.image_generation_simulation_ready} |`,
    `| video_generation_simulation_ready | ${report.completion_validation.video_generation_simulation_ready} |`,
    `| cross_generation_simulation_ready | ${report.completion_validation.cross_generation_simulation_ready} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| level2_master_simulation_track_count | ${report.level2_master_simulation_track_count} |`,
    `| level2_master_simulation_tracks_complete | ${report.level2_master_simulation_tracks_complete} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| level2_master_simulation_certification_ready | ${report.level2_master_simulation_certification_ready} |`,
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
  issues: Level2MasterSimulationCertificationIssue[],
  trackAudits: Level2MasterSimulationTrackAudit[] = []
): MovieAnalysisLevel2MasterSimulationCertificationReport {
  const report: MovieAnalysisLevel2MasterSimulationCertificationReport = {
    report_id: 'movie-analysis-level2-master-simulation-certification-report-v1',
    phase: LEVEL2_MASTER_SIMULATION_CERTIFICATION_PHASE,
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
    simulation_only: true,
    source_count: 0,
    adapter_count: 0,
    level2_master_simulation_track_count: LEVEL2_MASTER_SIMULATION_TRACK_COUNT,
    level2_master_simulation_tracks_complete: 'FAIL',
    completion_validation: {
      level2_runtime_complete: 'FAIL',
      level2b_consumption_complete: 'FAIL',
      level2c_simulation_complete: 'FAIL',
      image_runtime_ready: 'FAIL',
      video_runtime_ready: 'FAIL',
      image_app_consumption_ready: 'FAIL',
      video_app_consumption_ready: 'FAIL',
      cross_app_consumption_ready: 'FAIL',
      image_generation_simulation_ready: 'FAIL',
      video_generation_simulation_ready: 'FAIL',
      cross_generation_simulation_ready: 'FAIL',
    },
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    level2_master_simulation_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    level2_master_certification_report_path: LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
    level2c_simulation_certification_report_path: LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH,
    track_audits: trackAudits,
    final_verdict: LEVEL2_MASTER_SIMULATION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_SIMULATION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel2MasterSimulationCertification(
  projectRoot?: string
): MovieAnalysisLevel2MasterSimulationCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2MasterSimulationCertificationIssue[] = [];
  const timestamp = new Date().toISOString();
  const trackAudits = LEVEL2_MASTER_SIMULATION_TRACK_ENTRIES.map((entry) =>
    auditTrack(root, entry)
  );

  for (const audit of trackAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'LEVEL2_MASTER_SIMULATION_TRACK_REPORT_MISSING',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        track_id: audit.track_id,
      });
    } else if (!audit.track_passed) {
      issues.push({
        code: 'LEVEL2_MASTER_SIMULATION_TRACK_NOT_PASS',
        message: `${audit.track_id} must have PASS verdict and expected status`,
        severity: 'error',
        track_id: audit.track_id,
      });
    }
  }

  const level2MasterReport = loadReport<MovieAnalysisLevel2MasterCertificationReport>(
    root,
    LEVEL2_MASTER_CERTIFICATION_REPORT_PATH
  );
  const simulationReport = loadReport<MovieAnalysisLevel2CSimulationCertificationReport>(
    root,
    LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH
  );

  if (!level2MasterReport || !simulationReport) {
    return writeFailReport(root, timestamp, issues, trackAudits);
  }

  const completionValidation: Level2MasterSimulationCompletionValidation = {
    level2_runtime_complete: toStatus(
      level2MasterReport.completion_validation.level2_runtime_complete === 'PASS' &&
        level2MasterReport.final_verdict === LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT &&
        level2MasterReport.certification_status === LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE
    ),
    level2b_consumption_complete: toStatus(
      level2MasterReport.completion_validation.level2b_consumption_complete === 'PASS' &&
        level2MasterReport.final_verdict === LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT &&
        level2MasterReport.certification_status === LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE
    ),
    level2c_simulation_complete: toStatus(
      simulationReport.level2c_simulation_certification_ready === 'PASS' &&
        simulationReport.final_verdict === LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT &&
        simulationReport.certification_status === LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE
    ),
    image_runtime_ready: toStatus(
      level2MasterReport.completion_validation.image_runtime_ready === 'PASS'
    ),
    video_runtime_ready: toStatus(
      level2MasterReport.completion_validation.video_runtime_ready === 'PASS'
    ),
    image_app_consumption_ready: toStatus(
      level2MasterReport.completion_validation.image_app_consumption_ready === 'PASS'
    ),
    video_app_consumption_ready: toStatus(
      level2MasterReport.completion_validation.video_app_consumption_ready === 'PASS'
    ),
    cross_app_consumption_ready: toStatus(
      level2MasterReport.completion_validation.cross_app_consumption_ready === 'PASS'
    ),
    image_generation_simulation_ready: toStatus(
      simulationReport.completion_validation.image_generation_simulation_ready === 'PASS'
    ),
    video_generation_simulation_ready: toStatus(
      simulationReport.completion_validation.video_generation_simulation_ready === 'PASS'
    ),
    cross_generation_simulation_ready: toStatus(
      simulationReport.completion_validation.cross_generation_simulation_ready === 'PASS'
    ),
  };

  const runtimeMappingPreserved = toStatus(
    level2MasterReport.runtime_mapping_preserved === 'PASS' &&
      simulationReport.runtime_mapping_consistency === 'PASS'
  );

  const traceabilityPreserved = toStatus(
    level2MasterReport.traceability_preserved === 'PASS' &&
      simulationReport.traceability_consistency === 'PASS'
  );

  const sourceCount = level2MasterReport.source_count;
  const adapterCount = level2MasterReport.adapter_count;

  if (
    sourceCount !== EXPECTED_SOURCE_COUNT ||
    simulationReport.source_count !== EXPECTED_SOURCE_COUNT
  ) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (
    adapterCount !== EXPECTED_ADAPTER_COUNT ||
    simulationReport.adapter_count !== EXPECTED_ADAPTER_COUNT
  ) {
    issues.push({
      code: 'ADAPTER_COUNT_INVALID',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const safetyValid =
    level2MasterReport.planning_only === true &&
    level2MasterReport.planning_only_status === 'PASS' &&
    level2MasterReport.generation === false &&
    simulationReport.planning_only === true &&
    simulationReport.planning_only_status === 'PASS' &&
    simulationReport.generation === false &&
    simulationReport.simulation_only === true;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = toStatus(safetyValid);

  const level2MasterSimulationTracksComplete = toStatus(
    trackAudits.length === LEVEL2_MASTER_SIMULATION_TRACK_COUNT &&
      trackAudits.every((audit) => audit.track_passed)
  );

  const completionChecks = Object.values(completionValidation);
  const aggregateChecks: CertificationStatus[] = [
    level2MasterSimulationTracksComplete,
    ...completionChecks,
    runtimeMappingPreserved,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  for (const status of aggregateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'LEVEL2_MASTER_SIMULATION_VALIDATION_FAIL',
        message: 'Level 2 master simulation certification validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const level2MasterSimulationCertificationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    aggregateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = level2MasterSimulationCertificationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'LEVEL2_MASTER_SIMULATION_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'LEVEL2_MASTER_SIMULATION_NOT_READY',
      message: 'Level 2 master simulation certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisLevel2MasterSimulationCertificationReport = {
    report_id: 'movie-analysis-level2-master-simulation-certification-report-v1',
    phase: LEVEL2_MASTER_SIMULATION_CERTIFICATION_PHASE,
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
    simulation_only: true,
    source_count: sourceCount,
    adapter_count: adapterCount,
    level2_master_simulation_track_count: LEVEL2_MASTER_SIMULATION_TRACK_COUNT,
    level2_master_simulation_tracks_complete: level2MasterSimulationTracksComplete,
    completion_validation: completionValidation,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    level2_master_simulation_certification_ready: level2MasterSimulationCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE : null,
    level2_master_certification_report_path: LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
    level2c_simulation_certification_report_path: LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH,
    track_audits: trackAudits,
    final_verdict: pass
      ? LEVEL2_MASTER_SIMULATION_CERTIFICATION_PASS_VERDICT
      : LEVEL2_MASTER_SIMULATION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_SIMULATION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
