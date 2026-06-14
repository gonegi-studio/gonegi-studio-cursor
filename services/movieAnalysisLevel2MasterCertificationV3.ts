import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  LEVEL2E_FULLY_CERTIFIED_STATUS,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_EXPORT_DIR,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MANIFEST_PATH,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT,
  LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisLevel2EProductionScaleCertification.js';
import {
  LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT,
  LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
  LEVEL2_FINAL_TRACK_ENTRIES_V2,
  LEVEL2_FULLY_CERTIFIED_V2_STATUS,
  type Level2FinalTrackAudit,
  type Level2FinalTrackEntry,
} from './movieAnalysisLevel2FinalCertificationV2.js';
import {
  REAL_VIDEO_MASTER_CERTIFICATION_PASS_VERDICT,
  REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
  REAL_VIDEO_MASTER_CERTIFICATION_STATUS_MESSAGE,
  VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
} from './movieAnalysisRealVideoMasterCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL2_MASTER_CERTIFICATION_V3_PHASE =
  'PHASE-LEVEL2-MASTER-CERTIFICATION-V3' as const;
export const LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL2_MASTER_CERTIFICATION_V3' as const;
export const LEVEL2_MASTER_CERTIFICATION_V3_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL2_MASTER_CERTIFICATION_V3' as const;
export const LEVEL2_COMPLETE_STATUS = 'LEVEL2_COMPLETE' as const;
export const LEVEL2_MASTER_CERTIFICATION_V3_DIR =
  'reports/movie_analysis_level2_master_certification_v3' as const;
export const LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH =
  'reports/movie_analysis_level2_master_certification_v3/movie-analysis-level2-master-certification-v3-report.json' as const;
export const LEVEL2_MASTER_CERTIFICATION_V3_MD_PATH =
  'reports/movie_analysis_level2_master_certification_v3/MOVIE_ANALYSIS_LEVEL2_MASTER_CERTIFICATION_V3.md' as const;
export const LEVEL2_MASTER_CERTIFICATION_V3_EXPORT_DIR =
  'exports/movie_analysis_level2_master_certification_v3' as const;
export const LEVEL2_MASTER_CERTIFICATION_V3_MANIFEST_PATH =
  'exports/movie_analysis_level2_master_certification_v3/movie-analysis-level2-master-certification-v3-manifest.json' as const;

export const LEVEL2_MASTER_TRACK_COUNT_V3 = 6 as const;
export const LEVEL2_MASTER_PRECHECK_COUNT_V3 = 3 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, LEVEL2_FINAL_TRACK_ENTRIES_V2 };

export type CertificationStatus = 'PASS' | 'FAIL';

export type Level2MasterCertificationV3Issue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  track_id?: string;
  upstream_id?: string;
};

export type Level2MasterPrecheckEntry = {
  upstream_id: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
  status_message: string | null;
  ready_field: string;
};

export type Level2MasterPrecheckAudit = {
  upstream_id: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  precheck_passed: boolean;
};

export type MovieAnalysisLevel2MasterCertificationV3Manifest = {
  manifest_id: string;
  phase: typeof LEVEL2_MASTER_CERTIFICATION_V3_PHASE;
  generated_at: string;
  level2_master_track_count: typeof LEVEL2_MASTER_TRACK_COUNT_V3;
  level2_master_precheck_count: typeof LEVEL2_MASTER_PRECHECK_COUNT_V3;
  precheck_entries: Level2MasterPrecheckEntry[];
  precheck_audits: Level2MasterPrecheckAudit[];
  track_audits: Level2FinalTrackAudit[];
  runtime_track_complete: CertificationStatus;
  consumption_track_complete: CertificationStatus;
  simulation_track_complete: CertificationStatus;
  real_runtime_track_complete: CertificationStatus;
  generation_track_complete: CertificationStatus;
  real_video_track_complete: CertificationStatus;
  production_scale_complete: CertificationStatus;
  multi_episode_complete: CertificationStatus;
  long_term_memory_complete: CertificationStatus;
  cross_track_consistency: CertificationStatus;
  dna_traceability_preserved: CertificationStatus;
  adapter_traceability_preserved: CertificationStatus;
  pipeline_traceability_preserved: CertificationStatus;
  certification_status: typeof LEVEL2_COMPLETE_STATUS | null;
};

export type MovieAnalysisLevel2MasterCertificationV3Report = {
  report_id: string;
  phase: typeof LEVEL2_MASTER_CERTIFICATION_V3_PHASE;
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
  level2_master_certification_v3_export_dir: typeof LEVEL2_MASTER_CERTIFICATION_V3_EXPORT_DIR;
  level2_master_certification_v3_manifest_path: typeof LEVEL2_MASTER_CERTIFICATION_V3_MANIFEST_PATH;
  level2_final_certification_v2_report_path: typeof LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH;
  level2e_production_scale_certification_report_path: typeof LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH;
  real_video_master_certification_report_path: typeof REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH;
  video_master_certification_manifest_path: typeof VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  level2_master_track_count: typeof LEVEL2_MASTER_TRACK_COUNT_V3;
  level2_master_precheck_count: typeof LEVEL2_MASTER_PRECHECK_COUNT_V3;
  runtime_track_complete: CertificationStatus;
  consumption_track_complete: CertificationStatus;
  simulation_track_complete: CertificationStatus;
  real_runtime_track_complete: CertificationStatus;
  generation_track_complete: CertificationStatus;
  real_video_track_complete: CertificationStatus;
  production_scale_complete: CertificationStatus;
  multi_episode_complete: CertificationStatus;
  long_term_memory_complete: CertificationStatus;
  cross_track_consistency: CertificationStatus;
  dna_traceability_preserved: CertificationStatus;
  adapter_traceability_preserved: CertificationStatus;
  pipeline_traceability_preserved: CertificationStatus;
  level2_incomplete: boolean;
  track_missing: boolean;
  cross_track_break: boolean;
  production_scale_failure: boolean;
  video_pipeline_failure: boolean;
  traceability_loss: boolean;
  certification_failure: boolean;
  level2_master_certification_v3_ready: CertificationStatus;
  certification_status: typeof LEVEL2_COMPLETE_STATUS | null;
  precheck_audits: Level2MasterPrecheckAudit[];
  track_audits: Level2FinalTrackAudit[];
  final_verdict:
    | typeof LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT
    | typeof LEVEL2_MASTER_CERTIFICATION_V3_FAIL_VERDICT;
  issues: Level2MasterCertificationV3Issue[];
};

export const LEVEL2_MASTER_PRECHECK_ENTRIES_V3: Level2MasterPrecheckEntry[] = [
  {
    upstream_id: 'PRECHECK-V2',
    phase: 'PHASE-LEVEL2-MASTER-CERTIFICATION-V2',
    report_path: LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
    pass_verdict: LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT,
    status_message: LEVEL2_FULLY_CERTIFIED_V2_STATUS,
    ready_field: 'level2_final_certification_v2_ready',
  },
  {
    upstream_id: 'PRECHECK-L2E',
    phase: 'PHASE-LEVEL2E-010-LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_V1',
    report_path: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
    pass_verdict: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_PASS_VERDICT,
    status_message: LEVEL2E_FULLY_CERTIFIED_STATUS,
    ready_field: 'level2e_production_scale_certification_ready',
  },
  {
    upstream_id: 'PRECHECK-L2F',
    phase: 'PHASE-LEVEL2F-015-REAL_VIDEO_MASTER_CERTIFICATION_V1',
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

function auditPrecheck(projectRoot: string, entry: Level2MasterPrecheckEntry): Level2MasterPrecheckAudit {
  const report = loadReport<{
    final_verdict?: string;
    certification_status?: string | null;
    [key: string]: unknown;
  }>(projectRoot, entry.report_path);
  const reportExists = report !== null;
  const readyValue = report?.[entry.ready_field];
  const precheckPassed =
    reportExists &&
    report.final_verdict === entry.pass_verdict &&
    readyValue === 'PASS' &&
    (entry.status_message ? report.certification_status === entry.status_message : true);

  return {
    upstream_id: entry.upstream_id,
    phase: entry.phase,
    report_path: entry.report_path,
    report_exists: reportExists,
    precheck_passed: precheckPassed,
  };
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

function buildMarkdown(report: MovieAnalysisLevel2MasterCertificationV3Report): string {
  const lines = [
    '# Movie Analysis Level 2 Master Certification V3',
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
    'Level2A (Runtime) + Level2B (Consumption) + Level2C (Simulation) + Level2D (Real Runtime) + Level2E (Generation) + Level2F (Real Video) + Level2E Production Scale',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| runtime_track_complete | ${report.runtime_track_complete} |`,
    `| consumption_track_complete | ${report.consumption_track_complete} |`,
    `| simulation_track_complete | ${report.simulation_track_complete} |`,
    `| real_runtime_track_complete | ${report.real_runtime_track_complete} |`,
    `| generation_track_complete | ${report.generation_track_complete} |`,
    `| real_video_track_complete | ${report.real_video_track_complete} |`,
    `| production_scale_complete | ${report.production_scale_complete} |`,
    `| multi_episode_complete | ${report.multi_episode_complete} |`,
    `| long_term_memory_complete | ${report.long_term_memory_complete} |`,
    `| cross_track_consistency | ${report.cross_track_consistency} |`,
    `| dna_traceability_preserved | ${report.dna_traceability_preserved} |`,
    `| adapter_traceability_preserved | ${report.adapter_traceability_preserved} |`,
    `| pipeline_traceability_preserved | ${report.pipeline_traceability_preserved} |`,
    `| level2_incomplete | ${report.level2_incomplete} |`,
    `| track_missing | ${report.track_missing} |`,
    `| cross_track_break | ${report.cross_track_break} |`,
    `| production_scale_failure | ${report.production_scale_failure} |`,
    `| video_pipeline_failure | ${report.video_pipeline_failure} |`,
    `| traceability_loss | ${report.traceability_loss} |`,
    `| certification_failure | ${report.certification_failure} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| level2_master_track_count | ${report.level2_master_track_count} |`,
    `| level2_master_precheck_count | ${report.level2_master_precheck_count} |`,
    `| level2_master_certification_v3_ready | ${report.level2_master_certification_v3_ready} |`,
    '',
    '## Precheck Audits',
    ''
  );

  for (const audit of report.precheck_audits) {
    lines.push(
      `### ${audit.upstream_id}`,
      '',
      `- phase: ${audit.phase}`,
      `- report_path: ${audit.report_path}`,
      `- report_exists: ${audit.report_exists}`,
      `- precheck_passed: ${audit.precheck_passed}`,
      ''
    );
  }

  lines.push('## Track Audits', '');

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
  issues: Level2MasterCertificationV3Issue[],
  precheckAudits: Level2MasterPrecheckAudit[] = [],
  trackAudits: Level2FinalTrackAudit[] = []
): MovieAnalysisLevel2MasterCertificationV3Report {
  const trackMissing =
    precheckAudits.some((audit) => !audit.report_exists) ||
    trackAudits.some((audit) => !audit.report_exists);
  const crossTrackBreak =
    precheckAudits.some((audit) => !audit.precheck_passed) ||
    trackAudits.some((audit) => !audit.track_passed);

  const report: MovieAnalysisLevel2MasterCertificationV3Report = {
    report_id: 'movie-analysis-level2-master-certification-v3-report-v1',
    phase: LEVEL2_MASTER_CERTIFICATION_V3_PHASE,
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
    level2_master_certification_v3_export_dir: LEVEL2_MASTER_CERTIFICATION_V3_EXPORT_DIR,
    level2_master_certification_v3_manifest_path: LEVEL2_MASTER_CERTIFICATION_V3_MANIFEST_PATH,
    level2_final_certification_v2_report_path: LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
    level2e_production_scale_certification_report_path: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
    real_video_master_certification_report_path: REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    level2_master_track_count: LEVEL2_MASTER_TRACK_COUNT_V3,
    level2_master_precheck_count: LEVEL2_MASTER_PRECHECK_COUNT_V3,
    runtime_track_complete: 'FAIL',
    consumption_track_complete: 'FAIL',
    simulation_track_complete: 'FAIL',
    real_runtime_track_complete: 'FAIL',
    generation_track_complete: 'FAIL',
    real_video_track_complete: 'FAIL',
    production_scale_complete: 'FAIL',
    multi_episode_complete: 'FAIL',
    long_term_memory_complete: 'FAIL',
    cross_track_consistency: 'FAIL',
    dna_traceability_preserved: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    pipeline_traceability_preserved: 'FAIL',
    level2_incomplete: true,
    track_missing: trackMissing,
    cross_track_break: crossTrackBreak,
    production_scale_failure: true,
    video_pipeline_failure: true,
    traceability_loss: true,
    certification_failure: true,
    level2_master_certification_v3_ready: 'FAIL',
    certification_status: null,
    precheck_audits: precheckAudits,
    track_audits: trackAudits,
    final_verdict: LEVEL2_MASTER_CERTIFICATION_V3_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_MASTER_CERTIFICATION_V3_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_CERTIFICATION_V3_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel2MasterCertificationV3(
  projectRoot?: string
): MovieAnalysisLevel2MasterCertificationV3Report {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2MasterCertificationV3Issue[] = [];
  const timestamp = new Date().toISOString();
  const precheckAudits = LEVEL2_MASTER_PRECHECK_ENTRIES_V3.map((entry) => auditPrecheck(root, entry));
  const trackAudits = LEVEL2_FINAL_TRACK_ENTRIES_V2.map((entry) => auditTrack(root, entry));

  for (const audit of precheckAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'TRACK_MISSING',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        upstream_id: audit.upstream_id,
      });
    } else if (!audit.precheck_passed) {
      issues.push({
        code: 'CERTIFICATION_FAILURE',
        message: `${audit.upstream_id} must have PASS verdict and expected readiness`,
        severity: 'error',
        upstream_id: audit.upstream_id,
      });
    }
  }

  for (const audit of trackAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'TRACK_MISSING',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        track_id: audit.track_id,
      });
    } else if (!audit.track_passed) {
      issues.push({
        code: 'CROSS_TRACK_BREAK',
        message: `${audit.track_id} must have PASS verdict and expected readiness`,
        severity: 'error',
        track_id: audit.track_id,
      });
    }
  }

  const trackMissing = issues.some((issue) => issue.code === 'TRACK_MISSING');

  const v2Report = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    level2_final_certification_v2_ready: CertificationStatus;
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
    traceability_loss: boolean;
    source_count: number;
    adapter_count: number;
  }>(root, LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH);

  const l2eProductionScaleReport = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    level2e_production_scale_certification_ready: CertificationStatus;
    production_scale_certified: CertificationStatus;
    multi_episode_certified: CertificationStatus;
    memory_stress_certified: CertificationStatus;
    dna_binding_preserved: CertificationStatus;
    adapter_binding_preserved: CertificationStatus;
    traceability_preserved: CertificationStatus;
    traceability_loss: boolean;
    source_count: number;
    adapter_count: number;
  }>(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH);

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

  if (!v2Report || !l2eProductionScaleReport || !realVideoMasterReport) {
    return writeFailReport(root, timestamp, issues, precheckAudits, trackAudits);
  }

  if (!fs.existsSync(path.join(root, VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH))) {
    issues.push({
      code: 'TRACK_MISSING',
      message: `Missing ${VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MANIFEST_PATH))) {
    issues.push({
      code: 'TRACK_MISSING',
      message: `Missing ${LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_MANIFEST_PATH}`,
      severity: 'error',
    });
  }

  const trackById = Object.fromEntries(trackAudits.map((audit) => [audit.track_id, audit]));

  const runtimeTrackComplete = toStatus(
    trackById.L2A?.track_passed === true && v2Report.runtime_complete === 'PASS'
  );
  if (runtimeTrackComplete === 'FAIL') {
    issues.push({
      code: 'LEVEL2_INCOMPLETE',
      message: 'Level2A runtime track is not complete',
      severity: 'error',
      track_id: 'L2A',
    });
  }

  const consumptionTrackComplete = toStatus(
    trackById.L2B?.track_passed === true && v2Report.consumption_complete === 'PASS'
  );
  if (consumptionTrackComplete === 'FAIL') {
    issues.push({
      code: 'LEVEL2_INCOMPLETE',
      message: 'Level2B consumption track is not complete',
      severity: 'error',
      track_id: 'L2B',
    });
  }

  const simulationTrackComplete = toStatus(
    trackById.L2C?.track_passed === true && v2Report.simulation_complete === 'PASS'
  );
  if (simulationTrackComplete === 'FAIL') {
    issues.push({
      code: 'LEVEL2_INCOMPLETE',
      message: 'Level2C simulation track is not complete',
      severity: 'error',
      track_id: 'L2C',
    });
  }

  const realRuntimeTrackComplete = toStatus(
    trackById.L2D?.track_passed === true && v2Report.real_runtime_complete === 'PASS'
  );
  if (realRuntimeTrackComplete === 'FAIL') {
    issues.push({
      code: 'LEVEL2_INCOMPLETE',
      message: 'Level2D real runtime track is not complete',
      severity: 'error',
      track_id: 'L2D',
    });
  }

  const generationTrackComplete = toStatus(
    trackById.L2E?.track_passed === true && v2Report.generation_pipeline_complete === 'PASS'
  );
  if (generationTrackComplete === 'FAIL') {
    issues.push({
      code: 'LEVEL2_INCOMPLETE',
      message: 'Level2E generation track is not complete',
      severity: 'error',
      track_id: 'L2E',
    });
  }

  const realVideoTrackComplete = toStatus(
    trackById.L2F?.track_passed === true &&
      v2Report.real_video_pipeline_complete === 'PASS' &&
      realVideoMasterReport.real_video_master_certification_ready === 'PASS' &&
      realVideoMasterReport.l2f_tracks_complete === 'PASS'
  );
  if (realVideoTrackComplete === 'FAIL') {
    issues.push({
      code: 'VIDEO_PIPELINE_FAILURE',
      message: 'Level2F real video track is not complete',
      severity: 'error',
      track_id: 'L2F',
    });
  }

  const productionScaleComplete = toStatus(
    l2eProductionScaleReport.production_scale_certified === 'PASS' &&
      l2eProductionScaleReport.level2e_production_scale_certification_ready === 'PASS'
  );
  if (productionScaleComplete === 'FAIL') {
    issues.push({
      code: 'PRODUCTION_SCALE_FAILURE',
      message: 'Level2E production scale certification is not complete',
      severity: 'error',
      upstream_id: 'PRECHECK-L2E',
    });
  }

  const multiEpisodeComplete = toStatus(l2eProductionScaleReport.multi_episode_certified === 'PASS');
  if (multiEpisodeComplete === 'FAIL') {
    issues.push({
      code: 'PRODUCTION_SCALE_FAILURE',
      message: 'Multi-episode consistency is not certified',
      severity: 'error',
      upstream_id: 'PRECHECK-L2E',
    });
  }

  const longTermMemoryComplete = toStatus(l2eProductionScaleReport.memory_stress_certified === 'PASS');
  if (longTermMemoryComplete === 'FAIL') {
    issues.push({
      code: 'PRODUCTION_SCALE_FAILURE',
      message: 'Long-term memory stress test is not certified',
      severity: 'error',
      upstream_id: 'PRECHECK-L2E',
    });
  }

  const sourceCount =
    realVideoMasterReport.source_count ??
    l2eProductionScaleReport.source_count ??
    v2Report.source_count;
  const adapterCount =
    realVideoMasterReport.adapter_count ??
    l2eProductionScaleReport.adapter_count ??
    v2Report.adapter_count;

  const sourceAdapterConsistent =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    v2Report.source_count === EXPECTED_SOURCE_COUNT &&
    v2Report.adapter_count === EXPECTED_ADAPTER_COUNT &&
    l2eProductionScaleReport.source_count === EXPECTED_SOURCE_COUNT &&
    l2eProductionScaleReport.adapter_count === EXPECTED_ADAPTER_COUNT;

  const crossTrackConsistency = toStatus(
    precheckAudits.every((audit) => audit.precheck_passed) &&
      trackAudits.every((audit) => audit.track_passed) &&
      v2Report.level2_final_tracks_complete === 'PASS' &&
      v2Report.cross_app_consistency === 'PASS' &&
      sourceAdapterConsistent
  );
  if (crossTrackConsistency === 'FAIL') {
    issues.push({
      code: 'CROSS_TRACK_BREAK',
      message: 'Cross-track consistency check failed across Level2A through Level2F and production scale',
      severity: 'error',
    });
  }

  const dnaTraceabilityPreserved = toStatus(
    v2Report.dna_traceability_preserved === 'PASS' &&
      l2eProductionScaleReport.dna_binding_preserved === 'PASS' &&
      realVideoMasterReport.dna_binding_preserved === 'PASS'
  );
  if (dnaTraceabilityPreserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'DNA traceability is not preserved across Level2 master chain',
      severity: 'error',
    });
  }

  const adapterTraceabilityPreserved = toStatus(
    v2Report.adapter_traceability_preserved === 'PASS' &&
      l2eProductionScaleReport.adapter_binding_preserved === 'PASS' &&
      realVideoMasterReport.adapter_binding_preserved === 'PASS'
  );
  if (adapterTraceabilityPreserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Adapter traceability is not preserved across Level2 master chain',
      severity: 'error',
    });
  }

  const pipelineTraceabilityPreserved = toStatus(
    l2eProductionScaleReport.traceability_preserved === 'PASS' &&
      realVideoMasterReport.traceability_preserved === 'PASS' &&
      v2Report.generation_pipeline_complete === 'PASS' &&
      v2Report.real_video_pipeline_complete === 'PASS'
  );
  if (pipelineTraceabilityPreserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Pipeline traceability is not preserved across generation and video pipelines',
      severity: 'error',
    });
  }

  const traceabilityLoss =
    dnaTraceabilityPreserved === 'FAIL' ||
    adapterTraceabilityPreserved === 'FAIL' ||
    pipelineTraceabilityPreserved === 'FAIL' ||
    v2Report.traceability_loss === true ||
    l2eProductionScaleReport.traceability_loss === true ||
    realVideoMasterReport.traceability_loss === true;

  const level2Incomplete =
    runtimeTrackComplete === 'FAIL' ||
    consumptionTrackComplete === 'FAIL' ||
    simulationTrackComplete === 'FAIL' ||
    realRuntimeTrackComplete === 'FAIL' ||
    generationTrackComplete === 'FAIL' ||
    realVideoTrackComplete === 'FAIL' ||
    productionScaleComplete === 'FAIL' ||
    multiEpisodeComplete === 'FAIL' ||
    longTermMemoryComplete === 'FAIL';

  const crossTrackBreak = crossTrackConsistency === 'FAIL';
  const productionScaleFailure = productionScaleComplete === 'FAIL';
  const videoPipelineFailure = realVideoTrackComplete === 'FAIL';

  const gateChecks: CertificationStatus[] = [
    runtimeTrackComplete,
    consumptionTrackComplete,
    simulationTrackComplete,
    realRuntimeTrackComplete,
    generationTrackComplete,
    realVideoTrackComplete,
    productionScaleComplete,
    multiEpisodeComplete,
    longTermMemoryComplete,
    crossTrackConsistency,
    dnaTraceabilityPreserved,
    adapterTraceabilityPreserved,
    pipelineTraceabilityPreserved,
  ];

  const level2MasterCertificationV3Ready =
    !trackMissing &&
    !level2Incomplete &&
    !crossTrackBreak &&
    !productionScaleFailure &&
    !videoPipelineFailure &&
    !traceabilityLoss &&
    gateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = level2MasterCertificationV3Ready === 'PASS';
  const certificationFailure = !pass;

  if (certificationFailure && !issues.some((issue) => issue.code === 'CERTIFICATION_FAILURE')) {
    issues.push({
      code: 'CERTIFICATION_FAILURE',
      message: 'Level 2 master certification V3 is not ready',
      severity: 'error',
    });
  }

  const manifest: MovieAnalysisLevel2MasterCertificationV3Manifest = {
    manifest_id: 'movie-analysis-level2-master-certification-v3-manifest-v1',
    phase: LEVEL2_MASTER_CERTIFICATION_V3_PHASE,
    generated_at: timestamp,
    level2_master_track_count: LEVEL2_MASTER_TRACK_COUNT_V3,
    level2_master_precheck_count: LEVEL2_MASTER_PRECHECK_COUNT_V3,
    precheck_entries: LEVEL2_MASTER_PRECHECK_ENTRIES_V3,
    precheck_audits: precheckAudits,
    track_audits: trackAudits,
    runtime_track_complete: runtimeTrackComplete,
    consumption_track_complete: consumptionTrackComplete,
    simulation_track_complete: simulationTrackComplete,
    real_runtime_track_complete: realRuntimeTrackComplete,
    generation_track_complete: generationTrackComplete,
    real_video_track_complete: realVideoTrackComplete,
    production_scale_complete: productionScaleComplete,
    multi_episode_complete: multiEpisodeComplete,
    long_term_memory_complete: longTermMemoryComplete,
    cross_track_consistency: crossTrackConsistency,
    dna_traceability_preserved: dnaTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    pipeline_traceability_preserved: pipelineTraceabilityPreserved,
    certification_status: pass ? LEVEL2_COMPLETE_STATUS : null,
  };

  fs.mkdirSync(path.join(root, LEVEL2_MASTER_CERTIFICATION_V3_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_CERTIFICATION_V3_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(
      root,
      LEVEL2_MASTER_CERTIFICATION_V3_EXPORT_DIR,
      'level2-master-certification-v3.json'
    ),
    `${JSON.stringify(
      {
        level2_master_track_count: LEVEL2_MASTER_TRACK_COUNT_V3,
        level2_master_precheck_count: LEVEL2_MASTER_PRECHECK_COUNT_V3,
        precheck_audits: precheckAudits,
        track_audits: trackAudits,
        runtime_track_complete: runtimeTrackComplete,
        consumption_track_complete: consumptionTrackComplete,
        simulation_track_complete: simulationTrackComplete,
        real_runtime_track_complete: realRuntimeTrackComplete,
        generation_track_complete: generationTrackComplete,
        real_video_track_complete: realVideoTrackComplete,
        production_scale_complete: productionScaleComplete,
        multi_episode_complete: multiEpisodeComplete,
        long_term_memory_complete: longTermMemoryComplete,
        cross_track_consistency: crossTrackConsistency,
        dna_traceability_preserved: dnaTraceabilityPreserved,
        adapter_traceability_preserved: adapterTraceabilityPreserved,
        pipeline_traceability_preserved: pipelineTraceabilityPreserved,
        certification_status: pass ? LEVEL2_COMPLETE_STATUS : null,
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  const report: MovieAnalysisLevel2MasterCertificationV3Report = {
    report_id: 'movie-analysis-level2-master-certification-v3-report-v1',
    phase: LEVEL2_MASTER_CERTIFICATION_V3_PHASE,
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
    level2_master_certification_v3_export_dir: LEVEL2_MASTER_CERTIFICATION_V3_EXPORT_DIR,
    level2_master_certification_v3_manifest_path: LEVEL2_MASTER_CERTIFICATION_V3_MANIFEST_PATH,
    level2_final_certification_v2_report_path: LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
    level2e_production_scale_certification_report_path: LEVEL2E_PRODUCTION_SCALE_CERTIFICATION_REPORT_PATH,
    real_video_master_certification_report_path: REAL_VIDEO_MASTER_CERTIFICATION_REPORT_PATH,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    level2_master_track_count: LEVEL2_MASTER_TRACK_COUNT_V3,
    level2_master_precheck_count: LEVEL2_MASTER_PRECHECK_COUNT_V3,
    runtime_track_complete: runtimeTrackComplete,
    consumption_track_complete: consumptionTrackComplete,
    simulation_track_complete: simulationTrackComplete,
    real_runtime_track_complete: realRuntimeTrackComplete,
    generation_track_complete: generationTrackComplete,
    real_video_track_complete: realVideoTrackComplete,
    production_scale_complete: productionScaleComplete,
    multi_episode_complete: multiEpisodeComplete,
    long_term_memory_complete: longTermMemoryComplete,
    cross_track_consistency: crossTrackConsistency,
    dna_traceability_preserved: dnaTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    pipeline_traceability_preserved: pipelineTraceabilityPreserved,
    level2_incomplete: level2Incomplete,
    track_missing: trackMissing,
    cross_track_break: crossTrackBreak,
    production_scale_failure: productionScaleFailure,
    video_pipeline_failure: videoPipelineFailure,
    traceability_loss: traceabilityLoss,
    certification_failure: certificationFailure,
    level2_master_certification_v3_ready: level2MasterCertificationV3Ready,
    certification_status: pass ? LEVEL2_COMPLETE_STATUS : null,
    precheck_audits: precheckAudits,
    track_audits: trackAudits,
    final_verdict: pass
      ? LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT
      : LEVEL2_MASTER_CERTIFICATION_V3_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_MASTER_CERTIFICATION_V3_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_MASTER_CERTIFICATION_V3_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
