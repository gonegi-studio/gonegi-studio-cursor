import fs from 'node:fs';
import path from 'node:path';
import {
  CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  CROSS_APP_CONSUMPTION_CERTIFICATION_PHASE,
  CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisCrossAppConsumptionCertification.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT,
  GENERATION_PIPELINE_CERTIFICATION_PHASE,
  GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
  GENERATION_PIPELINE_CERTIFIED_STATUS,
} from './movieAnalysisGenerationPipelineCertification.js';
import {
  LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  LEVEL2B_CONSUMPTION_CERTIFICATION_PHASE,
  LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH,
  LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE,
} from './movieAnalysisLevel2BConsumptionCertification.js';
import {
  LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT,
  LEVEL2C_SIMULATION_CERTIFICATION_PHASE,
  LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH,
  LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE,
} from './movieAnalysisLevel2CSimulationCertification.js';
import {
  LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT,
  LEVEL2_RUNTIME_CERTIFICATION_PHASE,
  LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
  LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE,
} from './movieAnalysisLevel2RuntimeCertification.js';
import {
  REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT,
  REAL_EXECUTION_GATE_CERTIFICATION_PHASE,
  REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH,
  REAL_EXECUTION_GATE_CERTIFICATION_STATUS_MESSAGE,
} from './movieAnalysisRealExecutionGateCertification.js';
import {
  REAL_RUNTIME_CERTIFICATION_PASS_VERDICT,
  REAL_RUNTIME_CERTIFICATION_PHASE,
  REAL_RUNTIME_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisRealRuntimeCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL2_MASTER_FINAL_CERTIFICATION_PHASE =
  'PHASE-LEVEL2-MASTER-CERTIFICATION-MOVIE_ANALYSIS_LEVEL2_MASTER_FINAL_CERTIFICATION_V1' as const;
export const LEVEL2_MASTER_FINAL_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL2_MASTER_FINAL_CERTIFICATION_V1' as const;
export const LEVEL2_MASTER_FINAL_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL2_MASTER_FINAL_CERTIFICATION_V1' as const;
export const LEVEL2_MASTER_FINAL_CERTIFICATION_DIR =
  'reports/movie_analysis_level2_master_final_certification' as const;
export const LEVEL2_MASTER_FINAL_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_level2_master_final_certification/movie-analysis-level2-master-final-certification-report.json' as const;
export const LEVEL2_MASTER_FINAL_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_level2_master_final_certification/MOVIE_ANALYSIS_LEVEL2_MASTER_FINAL_CERTIFICATION.md' as const;
export const LEVEL2_FULLY_CERTIFIED_STATUS = 'LEVEL2_FULLY_CERTIFIED' as const;

export const LEVEL2_FINAL_TRACK_COUNT = 5 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type Level2MasterFinalCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  track_id?: string;
};

export type Level2FinalTrackEntry = {
  track_id: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
  status_message?: string;
  ready_field: string;
};

export type Level2FinalTrackAudit = {
  track_id: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  track_passed: boolean;
};

export type MovieAnalysisLevel2MasterFinalCertificationReport = {
  report_id: string;
  phase: typeof LEVEL2_MASTER_FINAL_CERTIFICATION_PHASE;
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
  level2_final_track_count: typeof LEVEL2_FINAL_TRACK_COUNT;
  level2_final_tracks_complete: CertificationStatus;
  runtime_complete: CertificationStatus;
  consumption_complete: CertificationStatus;
  simulation_complete: CertificationStatus;
  execution_gate_complete: CertificationStatus;
  generation_pipeline_complete: CertificationStatus;
  traceability_preserved: CertificationStatus;
  cross_app_consistency: CertificationStatus;
  pipeline_break: boolean;
  certification_failure: boolean;
  level2_master_final_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof LEVEL2_FULLY_CERTIFIED_STATUS | null;
  generation_pipeline_certification_report_path: typeof GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH;
  cross_app_consumption_certification_report_path: typeof CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH;
  real_execution_gate_certification_report_path: typeof REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH;
  track_audits: Level2FinalTrackAudit[];
  final_verdict:
    | typeof LEVEL2_MASTER_FINAL_CERTIFICATION_PASS_VERDICT
    | typeof LEVEL2_MASTER_FINAL_CERTIFICATION_FAIL_VERDICT;
  issues: Level2MasterFinalCertificationIssue[];
};

export const LEVEL2_FINAL_TRACK_ENTRIES: Level2FinalTrackEntry[] = [
  {
    track_id: 'L2A',
    phase: LEVEL2_RUNTIME_CERTIFICATION_PHASE,
    report_path: LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
    pass_verdict: LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT,
    status_message: LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE,
    ready_field: 'level2_runtime_certification_ready',
  },
  {
    track_id: 'L2B',
    phase: LEVEL2B_CONSUMPTION_CERTIFICATION_PHASE,
    report_path: LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH,
    pass_verdict: LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
    status_message: LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE,
    ready_field: 'level2b_consumption_certification_ready',
  },
  {
    track_id: 'L2C',
    phase: LEVEL2C_SIMULATION_CERTIFICATION_PHASE,
    report_path: LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH,
    pass_verdict: LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT,
    status_message: LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE,
    ready_field: 'level2c_simulation_certification_ready',
  },
  {
    track_id: 'L2D',
    phase: REAL_RUNTIME_CERTIFICATION_PHASE,
    report_path: REAL_RUNTIME_CERTIFICATION_REPORT_PATH,
    pass_verdict: REAL_RUNTIME_CERTIFICATION_PASS_VERDICT,
    ready_field: 'real_runtime_ready',
  },
  {
    track_id: 'L2E',
    phase: GENERATION_PIPELINE_CERTIFICATION_PHASE,
    report_path: GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
    pass_verdict: GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT,
    status_message: GENERATION_PIPELINE_CERTIFIED_STATUS,
    ready_field: 'generation_pipeline_certification_ready',
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

function auditTrack(projectRoot: string, entry: Level2FinalTrackEntry): Level2FinalTrackAudit {
  const report = loadReport<{
    final_verdict?: string;
    certification_status?: string | null;
    [key: string]: unknown;
  }>(projectRoot, entry.report_path);
  const reportExists = report !== null;
  const readyValue = report?.[entry.ready_field];
  const trackPassed =
    reportExists &&
    report.final_verdict === entry.pass_verdict &&
    readyValue === 'PASS' &&
    (entry.status_message ? report.certification_status === entry.status_message : true);

  return {
    track_id: entry.track_id,
    phase: entry.phase,
    report_path: entry.report_path,
    report_exists: reportExists,
    track_passed: trackPassed,
  };
}

function buildMarkdown(report: MovieAnalysisLevel2MasterFinalCertificationReport): string {
  const lines = [
    '# Movie Analysis Level 2 Master Final Certification',
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
    '## Level 2 Full Chain',
    '',
    'Level2A (Runtime) + Level2B (Consumption) + Level2C (Simulation) + Level2D (Real Runtime) + Level2E (Generation Pipeline)',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| runtime_complete | ${report.runtime_complete} |`,
    `| consumption_complete | ${report.consumption_complete} |`,
    `| simulation_complete | ${report.simulation_complete} |`,
    `| execution_gate_complete | ${report.execution_gate_complete} |`,
    `| generation_pipeline_complete | ${report.generation_pipeline_complete} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| cross_app_consistency | ${report.cross_app_consistency} |`,
    `| pipeline_break | ${report.pipeline_break} |`,
    `| certification_failure | ${report.certification_failure} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| level2_final_track_count | ${report.level2_final_track_count} |`,
    `| level2_final_tracks_complete | ${report.level2_final_tracks_complete} |`,
    `| level2_master_final_certification_ready | ${report.level2_master_final_certification_ready} |`,
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
  issues: Level2MasterFinalCertificationIssue[],
  trackAudits: Level2FinalTrackAudit[] = []
): MovieAnalysisLevel2MasterFinalCertificationReport {
  const pipelineBreak = trackAudits.some((audit) => !audit.track_passed);
  const report: MovieAnalysisLevel2MasterFinalCertificationReport = {
    report_id: 'movie-analysis-level2-master-final-certification-report-v1',
    phase: LEVEL2_MASTER_FINAL_CERTIFICATION_PHASE,
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
    level2_final_track_count: LEVEL2_FINAL_TRACK_COUNT,
    level2_final_tracks_complete: 'FAIL',
    runtime_complete: 'FAIL',
    consumption_complete: 'FAIL',
    simulation_complete: 'FAIL',
    execution_gate_complete: 'FAIL',
    generation_pipeline_complete: 'FAIL',
    traceability_preserved: 'FAIL',
    cross_app_consistency: 'FAIL',
    pipeline_break: pipelineBreak,
    certification_failure: true,
    level2_master_final_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    generation_pipeline_certification_report_path: GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
    cross_app_consumption_certification_report_path: CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
    real_execution_gate_certification_report_path: REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH,
    track_audits: trackAudits,
    final_verdict: LEVEL2_MASTER_FINAL_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_MASTER_FINAL_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_FINAL_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_FINAL_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel2MasterFinalCertification(
  projectRoot?: string
): MovieAnalysisLevel2MasterFinalCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2MasterFinalCertificationIssue[] = [];
  const timestamp = new Date().toISOString();
  const trackAudits = LEVEL2_FINAL_TRACK_ENTRIES.map((entry) => auditTrack(root, entry));

  for (const audit of trackAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'LEVEL2_FINAL_TRACK_REPORT_MISSING',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        track_id: audit.track_id,
      });
    } else if (!audit.track_passed) {
      issues.push({
        code: 'PIPELINE_BREAK',
        message: `${audit.track_id} must have PASS verdict and expected readiness`,
        severity: 'error',
        track_id: audit.track_id,
      });
    }
  }

  const generationPipelineReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    generation_pipeline_certification_ready: CertificationStatus;
    traceability_preserved: CertificationStatus;
    source_count: number;
    adapter_count: number;
  }>(root, GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH);

  const executionGateReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    real_execution_gate_certification_ready: CertificationStatus;
    traceability_preserved: CertificationStatus;
  }>(root, REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH);

  const crossAppReport = loadReport<{
    final_verdict: string;
    cross_app_consumption_certification_ready: CertificationStatus;
    adapter_traceability_consistency: CertificationStatus;
    cross_app_binding_consistency: CertificationStatus;
    source_count: number;
    adapter_count: number;
  }>(root, CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH);

  const runtimeReport = loadReport<{
    traceability_preserved: CertificationStatus;
    runtime_mapping_preserved: CertificationStatus;
  }>(root, LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH);

  const consumptionReport = loadReport<{
    traceability_preserved: CertificationStatus;
  }>(root, LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH);

  const simulationReport = loadReport<{
    traceability_consistency: CertificationStatus;
  }>(root, LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH);

  const realRuntimeReport = loadReport<{
    traceability_preserved: CertificationStatus;
  }>(root, REAL_RUNTIME_CERTIFICATION_REPORT_PATH);

  if (!generationPipelineReport || !executionGateReport || !crossAppReport) {
    if (!generationPipelineReport) {
      issues.push({
        code: 'GENERATION_PIPELINE_REPORT_MISSING',
        message: `Missing ${GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH}`,
        severity: 'error',
      });
    }
    if (!executionGateReport) {
      issues.push({
        code: 'EXECUTION_GATE_REPORT_MISSING',
        message: `Missing ${REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH}`,
        severity: 'error',
      });
    }
    if (!crossAppReport) {
      issues.push({
        code: 'CROSS_APP_CONSUMPTION_REPORT_MISSING',
        message: `Missing ${CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH}`,
        severity: 'error',
      });
    }
    return writeFailReport(root, timestamp, issues, trackAudits);
  }

  const trackById = Object.fromEntries(trackAudits.map((audit) => [audit.track_id, audit]));

  const runtimeComplete = toStatus(trackById.L2A?.track_passed === true);
  const consumptionComplete = toStatus(trackById.L2B?.track_passed === true);
  const simulationComplete = toStatus(trackById.L2C?.track_passed === true);
  const generationPipelineComplete = toStatus(trackById.L2E?.track_passed === true);

  const executionGateComplete = toStatus(
    executionGateReport.final_verdict === REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT &&
      executionGateReport.certification_status === REAL_EXECUTION_GATE_CERTIFICATION_STATUS_MESSAGE &&
      executionGateReport.real_execution_gate_certification_ready === 'PASS'
  );

  if (executionGateComplete === 'FAIL') {
    issues.push({
      code: 'EXECUTION_GATE_INCOMPLETE',
      message: 'Real execution gate certification is not complete',
      severity: 'error',
    });
  }

  const crossAppConsistency = toStatus(
    crossAppReport.final_verdict === CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT &&
      crossAppReport.cross_app_consumption_certification_ready === 'PASS' &&
      crossAppReport.cross_app_binding_consistency === 'PASS'
  );

  if (crossAppConsistency === 'FAIL') {
    issues.push({
      code: 'CROSS_APP_INCONSISTENCY',
      message: 'Cross-app consumption consistency check failed',
      severity: 'error',
    });
  }

  const traceabilityPreserved = toStatus(
    generationPipelineReport.traceability_preserved === 'PASS' &&
      executionGateReport.traceability_preserved === 'PASS' &&
      crossAppReport.adapter_traceability_consistency === 'PASS' &&
      runtimeReport?.traceability_preserved === 'PASS' &&
      consumptionReport?.traceability_preserved === 'PASS' &&
      simulationReport?.traceability_consistency === 'PASS' &&
      realRuntimeReport?.traceability_preserved === 'PASS'
  );

  if (traceabilityPreserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_NOT_PRESERVED',
      message: 'Traceability is not preserved across Level 2 tracks',
      severity: 'error',
    });
  }

  const level2FinalTracksComplete = toStatus(
    trackAudits.length === LEVEL2_FINAL_TRACK_COUNT && trackAudits.every((audit) => audit.track_passed)
  );

  const pipelineBreak = level2FinalTracksComplete === 'FAIL' || executionGateComplete === 'FAIL';

  const gateChecks: CertificationStatus[] = [
    runtimeComplete,
    consumptionComplete,
    simulationComplete,
    executionGateComplete,
    generationPipelineComplete,
    traceabilityPreserved,
    crossAppConsistency,
  ];

  const level2MasterFinalCertificationReady =
    level2FinalTracksComplete === 'PASS' &&
    gateChecks.every((status) => status === 'PASS') &&
    !pipelineBreak &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = level2MasterFinalCertificationReady === 'PASS';
  const certificationFailure = !pass;

  if (certificationFailure && !issues.some((issue) => issue.code === 'CERTIFICATION_FAILURE')) {
    issues.push({
      code: 'CERTIFICATION_FAILURE',
      message: 'Level 2 master final certification is not ready',
      severity: 'error',
    });
  }

  const sourceCount = generationPipelineReport.source_count ?? crossAppReport.source_count;
  const adapterCount = generationPipelineReport.adapter_count ?? crossAppReport.adapter_count;

  const report: MovieAnalysisLevel2MasterFinalCertificationReport = {
    report_id: 'movie-analysis-level2-master-final-certification-report-v1',
    phase: LEVEL2_MASTER_FINAL_CERTIFICATION_PHASE,
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
    level2_final_track_count: LEVEL2_FINAL_TRACK_COUNT,
    level2_final_tracks_complete: level2FinalTracksComplete,
    runtime_complete: runtimeComplete,
    consumption_complete: consumptionComplete,
    simulation_complete: simulationComplete,
    execution_gate_complete: executionGateComplete,
    generation_pipeline_complete: generationPipelineComplete,
    traceability_preserved: traceabilityPreserved,
    cross_app_consistency: crossAppConsistency,
    pipeline_break: pipelineBreak,
    certification_failure: certificationFailure,
    level2_master_final_certification_ready: level2MasterFinalCertificationReady,
    planning_only_status: 'PASS',
    certification_status: pass ? LEVEL2_FULLY_CERTIFIED_STATUS : null,
    generation_pipeline_certification_report_path: GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
    cross_app_consumption_certification_report_path: CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
    real_execution_gate_certification_report_path: REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH,
    track_audits: trackAudits,
    final_verdict: pass
      ? LEVEL2_MASTER_FINAL_CERTIFICATION_PASS_VERDICT
      : LEVEL2_MASTER_FINAL_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_MASTER_FINAL_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_FINAL_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_FINAL_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
