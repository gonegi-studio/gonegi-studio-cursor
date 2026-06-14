import fs from 'node:fs';
import path from 'node:path';
import {
  CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisCrossAppConsumptionCertification.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT,
  GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
  GENERATION_PIPELINE_CERTIFIED_STATUS,
} from './movieAnalysisGenerationPipelineCertification.js';
import {
  LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT,
  LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH,
  LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE,
} from './movieAnalysisLevel2BConsumptionCertification.js';
import {
  LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT,
  LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH,
  LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE,
} from './movieAnalysisLevel2CSimulationCertification.js';
import {
  LEVEL2_FINAL_TRACK_ENTRIES,
  type Level2FinalTrackAudit,
  type Level2FinalTrackEntry,
} from './movieAnalysisLevel2MasterFinalCertification.js';
import {
  LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT,
  LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
  LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE,
} from './movieAnalysisLevel2RuntimeCertification.js';
import {
  REAL_RUNTIME_CERTIFICATION_PASS_VERDICT,
  REAL_RUNTIME_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisRealRuntimeCertification.js';
import {
  REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT,
  REAL_VIDEO_MASTER_CERTIFICATION_PHASE,
  REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
  REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE,
  VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
} from './movieAnalysisRealVideoMasterCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL2_FINAL_CERTIFICATION_V2_PHASE =
  'PHASE-LEVEL2-MASTER-CERTIFICATION-V2' as const;
export const LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL2_FINAL_CERTIFICATION_V2' as const;
export const LEVEL2_FINAL_CERTIFICATION_V2_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL2_FINAL_CERTIFICATION_V2' as const;
export const LEVEL2_FULLY_CERTIFIED_V2_STATUS = 'LEVEL2_FULLY_CERTIFIED_V2' as const;
export const LEVEL2_FINAL_CERTIFICATION_V2_DIR =
  'reports/movie_analysis_level2_final_certification_v2' as const;
export const LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH =
  'reports/movie_analysis_level2_final_certification_v2/movie-analysis-level2-final-certification-v2-report.json' as const;
export const LEVEL2_FINAL_CERTIFICATION_V2_MD_PATH =
  'reports/movie_analysis_level2_final_certification_v2/MOVIE_ANALYSIS_LEVEL2_FINAL_CERTIFICATION_V2.md' as const;

export const LEVEL2_FINAL_TRACK_COUNT_V2 = 6 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type Level2FinalCertificationV2Issue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  track_id?: string;
};

export type MovieAnalysisLevel2FinalCertificationV2Report = {
  report_id: string;
  phase: typeof LEVEL2_FINAL_CERTIFICATION_V2_PHASE;
  timestamp: string;
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: true;
  image_generation: true;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  source_count: number;
  adapter_count: number;
  level2_final_track_count: typeof LEVEL2_FINAL_TRACK_COUNT_V2;
  level2_final_tracks_complete: CertificationStatus;
  runtime_complete: CertificationStatus;
  consumption_complete: CertificationStatus;
  simulation_complete: CertificationStatus;
  real_runtime_complete: CertificationStatus;
  generation_pipeline_complete: CertificationStatus;
  real_video_pipeline_complete: CertificationStatus;
  dna_traceability_preserved: CertificationStatus;
  adapter_traceability_preserved: CertificationStatus;
  cross_app_consistency: CertificationStatus;
  level2_pipeline_break: boolean;
  certification_failure: boolean;
  missing_upstream: boolean;
  traceability_loss: boolean;
  level2_final_certification_v2_ready: CertificationStatus;
  certification_status: typeof LEVEL2_FULLY_CERTIFIED_V2_STATUS | null;
  generation_pipeline_certification_report_path: typeof GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH;
  cross_app_consumption_certification_report_path: typeof CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH;
  real_video_master_certification_report_path: typeof REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH;
  video_master_certification_manifest_path: typeof VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH;
  track_audits: Level2FinalTrackAudit[];
  final_verdict:
    | typeof LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT
    | typeof LEVEL2_FINAL_CERTIFICATION_V2_FAIL_VERDICT;
  issues: Level2FinalCertificationV2Issue[];
};

export const LEVEL2_FINAL_TRACK_ENTRIES_V2: Level2FinalTrackEntry[] = [
  ...LEVEL2_FINAL_TRACK_ENTRIES,
  {
    track_id: 'L2F',
    phase: REAL_VIDEO_MASTER_CERTIFICATION_PHASE,
    report_path: REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
    pass_verdict: REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT,
    status_message: REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE,
    ready_field: 'real_video_master_certification_ready',
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

function buildMarkdown(report: MovieAnalysisLevel2FinalCertificationV2Report): string {
  const lines = [
    '# Movie Analysis Level 2 Final Certification V2',
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
    '## Level 2 Full Chain',
    '',
    'Level2A (Runtime) + Level2B (Consumption) + Level2C (Simulation) + Level2D (Real Runtime) + Level2E (Generation Pipeline) + Level2F (Real Video Pipeline)',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| runtime_complete | ${report.runtime_complete} |`,
    `| consumption_complete | ${report.consumption_complete} |`,
    `| simulation_complete | ${report.simulation_complete} |`,
    `| real_runtime_complete | ${report.real_runtime_complete} |`,
    `| generation_pipeline_complete | ${report.generation_pipeline_complete} |`,
    `| real_video_pipeline_complete | ${report.real_video_pipeline_complete} |`,
    `| dna_traceability_preserved | ${report.dna_traceability_preserved} |`,
    `| adapter_traceability_preserved | ${report.adapter_traceability_preserved} |`,
    `| cross_app_consistency | ${report.cross_app_consistency} |`,
    `| level2_pipeline_break | ${report.level2_pipeline_break} |`,
    `| certification_failure | ${report.certification_failure} |`,
    `| missing_upstream | ${report.missing_upstream} |`,
    `| traceability_loss | ${report.traceability_loss} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| level2_final_track_count | ${report.level2_final_track_count} |`,
    `| level2_final_tracks_complete | ${report.level2_final_tracks_complete} |`,
    `| level2_final_certification_v2_ready | ${report.level2_final_certification_v2_ready} |`,
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
  issues: Level2FinalCertificationV2Issue[],
  trackAudits: Level2FinalTrackAudit[] = []
): MovieAnalysisLevel2FinalCertificationV2Report {
  const missingUpstream =
    trackAudits.some((audit) => !audit.report_exists) ||
    !fs.existsSync(path.join(root, CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH)) ||
    !fs.existsSync(path.join(root, VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH));
  const level2PipelineBreak = trackAudits.some((audit) => !audit.track_passed);

  const report: MovieAnalysisLevel2FinalCertificationV2Report = {
    report_id: 'movie-analysis-level2-final-certification-v2-report-v1',
    phase: LEVEL2_FINAL_CERTIFICATION_V2_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: true,
    image_generation: true,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_count: 0,
    adapter_count: 0,
    level2_final_track_count: LEVEL2_FINAL_TRACK_COUNT_V2,
    level2_final_tracks_complete: 'FAIL',
    runtime_complete: 'FAIL',
    consumption_complete: 'FAIL',
    simulation_complete: 'FAIL',
    real_runtime_complete: 'FAIL',
    generation_pipeline_complete: 'FAIL',
    real_video_pipeline_complete: 'FAIL',
    dna_traceability_preserved: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    cross_app_consistency: 'FAIL',
    level2_pipeline_break: level2PipelineBreak,
    certification_failure: true,
    missing_upstream: missingUpstream,
    traceability_loss: true,
    level2_final_certification_v2_ready: 'FAIL',
    certification_status: null,
    generation_pipeline_certification_report_path: GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
    cross_app_consumption_certification_report_path: CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
    real_video_master_certification_report_path: REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    track_audits: trackAudits,
    final_verdict: LEVEL2_FINAL_CERTIFICATION_V2_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_FINAL_CERTIFICATION_V2_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_FINAL_CERTIFICATION_V2_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel2FinalCertificationV2(
  projectRoot?: string
): MovieAnalysisLevel2FinalCertificationV2Report {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2FinalCertificationV2Issue[] = [];
  const timestamp = new Date().toISOString();
  const trackAudits = LEVEL2_FINAL_TRACK_ENTRIES_V2.map((entry) => auditTrack(root, entry));

  for (const audit of trackAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        track_id: audit.track_id,
      });
    } else if (!audit.track_passed) {
      issues.push({
        code: 'LEVEL2_PIPELINE_BREAK',
        message: `${audit.track_id} must have PASS verdict and expected readiness`,
        severity: 'error',
        track_id: audit.track_id,
      });
    }
  }

  if (!fs.existsSync(path.join(root, CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH}`,
      severity: 'error',
    });
  }

  const missingUpstream = issues.some((issue) => issue.code === 'MISSING_UPSTREAM');

  const generationPipelineReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    generation_pipeline_certification_ready: CertificationStatus;
    traceability_preserved: CertificationStatus;
    dna_to_frame_validated: CertificationStatus;
    source_count: number;
    adapter_count: number;
  }>(root, GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH);

  const crossAppReport = loadReport<{
    final_verdict: string;
    cross_app_consumption_certification_ready: CertificationStatus;
    adapter_traceability_consistency: CertificationStatus;
    cross_app_binding_consistency: CertificationStatus;
    runtime_mapping_consistency: CertificationStatus;
    source_count: number;
    adapter_count: number;
  }>(root, CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH);

  const runtimeReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    level2_runtime_certification_ready: CertificationStatus;
    traceability_preserved: CertificationStatus;
    runtime_mapping_preserved: CertificationStatus;
  }>(root, LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH);

  const consumptionReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    level2b_consumption_certification_ready: CertificationStatus;
    traceability_preserved: CertificationStatus;
  }>(root, LEVEL2B_CONSUMPTION_CERTIFICATION_REPORT_PATH);

  const simulationReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    level2c_simulation_certification_ready: CertificationStatus;
    traceability_consistency: CertificationStatus;
  }>(root, LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH);

  const realRuntimeReport = loadReport<{
    final_verdict: string;
    real_runtime_ready: CertificationStatus;
    traceability_preserved: CertificationStatus;
    runtime_mapping_preserved: CertificationStatus;
  }>(root, REAL_RUNTIME_CERTIFICATION_REPORT_PATH);

  const realVideoMasterReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    real_video_master_certification_ready: CertificationStatus;
    l2f_tracks_complete: CertificationStatus;
    dna_binding_preserved: CertificationStatus;
    adapter_binding_preserved: CertificationStatus;
    traceability_preserved: CertificationStatus;
    traceability_loss: boolean;
    source_count: number;
    adapter_count: number;
  }>(root, REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH);

  if (
    !generationPipelineReport ||
    !crossAppReport ||
    !runtimeReport ||
    !consumptionReport ||
    !simulationReport ||
    !realRuntimeReport ||
    !realVideoMasterReport
  ) {
    return writeFailReport(root, timestamp, issues, trackAudits);
  }

  const trackById = Object.fromEntries(trackAudits.map((audit) => [audit.track_id, audit]));

  const runtimeComplete = toStatus(
    trackById.L2A?.track_passed === true &&
      runtimeReport.final_verdict === LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT &&
      runtimeReport.certification_status === LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE &&
      runtimeReport.level2_runtime_certification_ready === 'PASS'
  );

  if (runtimeComplete === 'FAIL') {
    issues.push({
      code: 'RUNTIME_INCOMPLETE',
      message: 'Level2A runtime certification is not complete',
      severity: 'error',
      track_id: 'L2A',
    });
  }

  const consumptionComplete = toStatus(
    trackById.L2B?.track_passed === true &&
      consumptionReport.final_verdict === LEVEL2B_CONSUMPTION_CERTIFICATION_PASS_VERDICT &&
      consumptionReport.certification_status === LEVEL2B_CONSUMPTION_CERTIFICATION_STATUS_MESSAGE &&
      consumptionReport.level2b_consumption_certification_ready === 'PASS'
  );

  if (consumptionComplete === 'FAIL') {
    issues.push({
      code: 'CONSUMPTION_INCOMPLETE',
      message: 'Level2B consumption certification is not complete',
      severity: 'error',
      track_id: 'L2B',
    });
  }

  const simulationComplete = toStatus(
    trackById.L2C?.track_passed === true &&
      simulationReport.final_verdict === LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT &&
      simulationReport.certification_status === LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE &&
      simulationReport.level2c_simulation_certification_ready === 'PASS'
  );

  if (simulationComplete === 'FAIL') {
    issues.push({
      code: 'SIMULATION_INCOMPLETE',
      message: 'Level2C simulation certification is not complete',
      severity: 'error',
      track_id: 'L2C',
    });
  }

  const realRuntimeComplete = toStatus(
    trackById.L2D?.track_passed === true &&
      realRuntimeReport.final_verdict === REAL_RUNTIME_CERTIFICATION_PASS_VERDICT &&
      realRuntimeReport.real_runtime_ready === 'PASS'
  );

  if (realRuntimeComplete === 'FAIL') {
    issues.push({
      code: 'REAL_RUNTIME_INCOMPLETE',
      message: 'Level2D real runtime certification is not complete',
      severity: 'error',
      track_id: 'L2D',
    });
  }

  const generationPipelineComplete = toStatus(
    trackById.L2E?.track_passed === true &&
      generationPipelineReport.final_verdict === GENERATION_PIPELINE_CERTIFICATION_PASS_VERDICT &&
      generationPipelineReport.certification_status === GENERATION_PIPELINE_CERTIFIED_STATUS &&
      generationPipelineReport.generation_pipeline_certification_ready === 'PASS'
  );

  if (generationPipelineComplete === 'FAIL') {
    issues.push({
      code: 'GENERATION_PIPELINE_INCOMPLETE',
      message: 'Level2E generation pipeline certification is not complete',
      severity: 'error',
      track_id: 'L2E',
    });
  }

  const realVideoPipelineComplete = toStatus(
    trackById.L2F?.track_passed === true &&
      realVideoMasterReport.final_verdict === REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT &&
      realVideoMasterReport.certification_status === REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE &&
      realVideoMasterReport.real_video_master_certification_ready === 'PASS' &&
      realVideoMasterReport.l2f_tracks_complete === 'PASS'
  );

  if (realVideoPipelineComplete === 'FAIL') {
    issues.push({
      code: 'REAL_VIDEO_PIPELINE_INCOMPLETE',
      message: 'Level2F real video pipeline certification is not complete',
      severity: 'error',
      track_id: 'L2F',
    });
  }

  const crossAppConsistency = toStatus(
    crossAppReport.final_verdict === CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT &&
      crossAppReport.cross_app_consumption_certification_ready === 'PASS' &&
      crossAppReport.cross_app_binding_consistency === 'PASS' &&
      crossAppReport.runtime_mapping_consistency === 'PASS'
  );

  if (crossAppConsistency === 'FAIL') {
    issues.push({
      code: 'CROSS_APP_INCONSISTENCY',
      message: 'Cross-app consumption consistency check failed',
      severity: 'error',
    });
  }

  const dnaTraceabilityPreserved = toStatus(
    runtimeReport.traceability_preserved === 'PASS' &&
      consumptionReport.traceability_preserved === 'PASS' &&
      simulationReport.traceability_consistency === 'PASS' &&
      realRuntimeReport.traceability_preserved === 'PASS' &&
      generationPipelineReport.traceability_preserved === 'PASS' &&
      generationPipelineReport.dna_to_frame_validated === 'PASS' &&
      realVideoMasterReport.dna_binding_preserved === 'PASS' &&
      realVideoMasterReport.traceability_preserved === 'PASS'
  );

  if (dnaTraceabilityPreserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'DNA traceability is not preserved across Level2A through Level2F',
      severity: 'error',
    });
  }

  const adapterTraceabilityPreserved = toStatus(
    crossAppReport.adapter_traceability_consistency === 'PASS' &&
      runtimeReport.runtime_mapping_preserved === 'PASS' &&
      realRuntimeReport.runtime_mapping_preserved === 'PASS' &&
      realVideoMasterReport.adapter_binding_preserved === 'PASS'
  );

  if (adapterTraceabilityPreserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Adapter traceability is not preserved across Level2 tracks',
      severity: 'error',
    });
  }

  const traceabilityLoss =
    dnaTraceabilityPreserved === 'FAIL' ||
    adapterTraceabilityPreserved === 'FAIL' ||
    realVideoMasterReport.traceability_loss === true;

  const level2FinalTracksComplete = toStatus(
    trackAudits.length === LEVEL2_FINAL_TRACK_COUNT_V2 &&
      trackAudits.every((audit) => audit.track_passed)
  );

  const level2PipelineBreak =
    level2FinalTracksComplete === 'FAIL' ||
    runtimeComplete === 'FAIL' ||
    consumptionComplete === 'FAIL' ||
    simulationComplete === 'FAIL' ||
    realRuntimeComplete === 'FAIL' ||
    generationPipelineComplete === 'FAIL' ||
    realVideoPipelineComplete === 'FAIL';

  const gateChecks: CertificationStatus[] = [
    level2FinalTracksComplete,
    runtimeComplete,
    consumptionComplete,
    simulationComplete,
    realRuntimeComplete,
    generationPipelineComplete,
    realVideoPipelineComplete,
    dnaTraceabilityPreserved,
    adapterTraceabilityPreserved,
    crossAppConsistency,
  ];

  const level2FinalCertificationV2Ready =
    !missingUpstream &&
    !level2PipelineBreak &&
    !traceabilityLoss &&
    gateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = level2FinalCertificationV2Ready === 'PASS';
  const certificationFailure = !pass;

  if (certificationFailure && !issues.some((issue) => issue.code === 'CERTIFICATION_FAILURE')) {
    issues.push({
      code: 'CERTIFICATION_FAILURE',
      message: 'Level 2 final certification V2 is not ready',
      severity: 'error',
    });
  }

  const sourceCount =
    realVideoMasterReport.source_count ??
    generationPipelineReport.source_count ??
    crossAppReport.source_count;
  const adapterCount =
    realVideoMasterReport.adapter_count ??
    generationPipelineReport.adapter_count ??
    crossAppReport.adapter_count;

  const report: MovieAnalysisLevel2FinalCertificationV2Report = {
    report_id: 'movie-analysis-level2-final-certification-v2-report-v1',
    phase: LEVEL2_FINAL_CERTIFICATION_V2_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: true,
    image_generation: true,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_count: sourceCount,
    adapter_count: adapterCount,
    level2_final_track_count: LEVEL2_FINAL_TRACK_COUNT_V2,
    level2_final_tracks_complete: level2FinalTracksComplete,
    runtime_complete: runtimeComplete,
    consumption_complete: consumptionComplete,
    simulation_complete: simulationComplete,
    real_runtime_complete: realRuntimeComplete,
    generation_pipeline_complete: generationPipelineComplete,
    real_video_pipeline_complete: realVideoPipelineComplete,
    dna_traceability_preserved: dnaTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    cross_app_consistency: crossAppConsistency,
    level2_pipeline_break: level2PipelineBreak,
    certification_failure: certificationFailure,
    missing_upstream: missingUpstream,
    traceability_loss: traceabilityLoss,
    level2_final_certification_v2_ready: level2FinalCertificationV2Ready,
    certification_status: pass ? LEVEL2_FULLY_CERTIFIED_V2_STATUS : null,
    generation_pipeline_certification_report_path: GENERATION_PIPELINE_CERTIFICATION_REPORT_PATH,
    cross_app_consumption_certification_report_path: CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH,
    real_video_master_certification_report_path: REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    track_audits: trackAudits,
    final_verdict: pass
      ? LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT
      : LEVEL2_FINAL_CERTIFICATION_V2_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_FINAL_CERTIFICATION_V2_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_FINAL_CERTIFICATION_V2_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
