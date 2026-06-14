import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT,
  REAL_IMAGE_PROMPT_EXPORT_PHASE,
  REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
  type MovieAnalysisRealImagePromptExportReport,
} from './movieAnalysisRealImagePromptExport.js';
import {
  REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT,
  REAL_IMAGE_RUNTIME_PREPARATION_PHASE,
  REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH,
  type MovieAnalysisRealImageRuntimePreparationReport,
} from './movieAnalysisRealImageRuntimePreparation.js';
import {
  REAL_VIDEO_PROMPT_EXPORT_PASS_VERDICT,
  REAL_VIDEO_PROMPT_EXPORT_PHASE,
  REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH,
  type MovieAnalysisRealVideoPromptExportReport,
} from './movieAnalysisRealVideoPromptExport.js';
import {
  REAL_VIDEO_RUNTIME_PREPARATION_PASS_VERDICT,
  REAL_VIDEO_RUNTIME_PREPARATION_PHASE,
  REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH,
  type MovieAnalysisRealVideoRuntimePreparationReport,
} from './movieAnalysisRealVideoRuntimePreparation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_RUNTIME_CERTIFICATION_PHASE =
  'PHASE-LEVEL2D-005-MOVIE_ANALYSIS_REAL_RUNTIME_CERTIFICATION_V1' as const;
export const REAL_RUNTIME_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_RUNTIME_CERTIFICATION_V1' as const;
export const REAL_RUNTIME_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_RUNTIME_CERTIFICATION_V1' as const;
export const REAL_RUNTIME_CERTIFICATION_DIR =
  'reports/movie_analysis_real_runtime_certification' as const;
export const REAL_RUNTIME_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_real_runtime_certification/movie-analysis-real-runtime-certification-report.json' as const;
export const REAL_RUNTIME_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_real_runtime_certification/MOVIE_ANALYSIS_REAL_RUNTIME_CERTIFICATION.md' as const;

export const REAL_RUNTIME_PHASE_COUNT = 4 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type RealRuntimeCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_id?: string;
};

export type RealRuntimePhaseEntry = {
  phase_id: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
};

export type RealRuntimePhaseAudit = {
  phase_id: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  phase_passed: boolean;
};

export type MovieAnalysisRealRuntimeCertificationReport = {
  report_id: string;
  phase: typeof REAL_RUNTIME_CERTIFICATION_PHASE;
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
  real_runtime_phase_count: typeof REAL_RUNTIME_PHASE_COUNT;
  real_runtime_phases_complete: CertificationStatus;
  image_runtime_preparation_ready: CertificationStatus;
  video_runtime_preparation_ready: CertificationStatus;
  image_prompt_export_ready: CertificationStatus;
  video_prompt_export_ready: CertificationStatus;
  runtime_mapping_preserved: CertificationStatus;
  traceability_preserved: CertificationStatus;
  real_runtime_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  real_image_runtime_preparation_report_path: typeof REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH;
  real_video_runtime_preparation_report_path: typeof REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH;
  real_image_prompt_export_report_path: typeof REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH;
  real_video_prompt_export_report_path: typeof REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH;
  phase_audits: RealRuntimePhaseAudit[];
  final_verdict:
    | typeof REAL_RUNTIME_CERTIFICATION_PASS_VERDICT
    | typeof REAL_RUNTIME_CERTIFICATION_FAIL_VERDICT;
  issues: RealRuntimeCertificationIssue[];
};

export const REAL_RUNTIME_PHASE_ENTRIES: RealRuntimePhaseEntry[] = [
  {
    phase_id: 'L2D-001',
    phase: REAL_IMAGE_RUNTIME_PREPARATION_PHASE,
    report_path: REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH,
    pass_verdict: REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT,
  },
  {
    phase_id: 'L2D-002',
    phase: REAL_IMAGE_PROMPT_EXPORT_PHASE,
    report_path: REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
    pass_verdict: REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT,
  },
  {
    phase_id: 'L2D-003',
    phase: REAL_VIDEO_RUNTIME_PREPARATION_PHASE,
    report_path: REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH,
    pass_verdict: REAL_VIDEO_RUNTIME_PREPARATION_PASS_VERDICT,
  },
  {
    phase_id: 'L2D-004',
    phase: REAL_VIDEO_PROMPT_EXPORT_PHASE,
    report_path: REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH,
    pass_verdict: REAL_VIDEO_PROMPT_EXPORT_PASS_VERDICT,
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

function auditPhase(projectRoot: string, entry: RealRuntimePhaseEntry): RealRuntimePhaseAudit {
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

function buildMarkdown(report: MovieAnalysisRealRuntimeCertificationReport): string {
  const lines = [
    '# Movie Analysis Real Runtime Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Certification Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Real Runtime Chain',
    '',
    'Image Runtime Preparation → Image Prompt Export → Video Runtime Preparation → Video Prompt Export',
    '',
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| real_runtime_phase_count | ${report.real_runtime_phase_count} |`,
    `| real_runtime_phases_complete | ${report.real_runtime_phases_complete} |`,
    `| image_runtime_preparation_ready | ${report.image_runtime_preparation_ready} |`,
    `| video_runtime_preparation_ready | ${report.video_runtime_preparation_ready} |`,
    `| image_prompt_export_ready | ${report.image_prompt_export_ready} |`,
    `| video_prompt_export_ready | ${report.video_prompt_export_ready} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| real_runtime_ready | ${report.real_runtime_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Phase Audits',
    '',
  ];

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
  issues: RealRuntimeCertificationIssue[],
  phaseAudits: RealRuntimePhaseAudit[] = []
): MovieAnalysisRealRuntimeCertificationReport {
  const report: MovieAnalysisRealRuntimeCertificationReport = {
    report_id: 'movie-analysis-real-runtime-certification-report-v1',
    phase: REAL_RUNTIME_CERTIFICATION_PHASE,
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
    real_runtime_phase_count: REAL_RUNTIME_PHASE_COUNT,
    real_runtime_phases_complete: 'FAIL',
    image_runtime_preparation_ready: 'FAIL',
    video_runtime_preparation_ready: 'FAIL',
    image_prompt_export_ready: 'FAIL',
    video_prompt_export_ready: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    real_runtime_ready: 'FAIL',
    planning_only_status: 'FAIL',
    real_image_runtime_preparation_report_path: REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH,
    real_video_runtime_preparation_report_path: REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH,
    real_image_prompt_export_report_path: REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
    real_video_prompt_export_report_path: REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH,
    phase_audits: phaseAudits,
    final_verdict: REAL_RUNTIME_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_RUNTIME_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_RUNTIME_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_RUNTIME_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealRuntimeCertification(
  projectRoot?: string
): MovieAnalysisRealRuntimeCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealRuntimeCertificationIssue[] = [];
  const timestamp = new Date().toISOString();
  const phaseAudits = REAL_RUNTIME_PHASE_ENTRIES.map((entry) => auditPhase(root, entry));

  for (const audit of phaseAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'REAL_RUNTIME_PHASE_REPORT_MISSING',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        phase_id: audit.phase_id,
      });
    } else if (!audit.phase_passed) {
      issues.push({
        code: 'REAL_RUNTIME_PHASE_NOT_PASS',
        message: `${audit.phase_id} must have PASS verdict`,
        severity: 'error',
        phase_id: audit.phase_id,
      });
    }
  }

  const imagePreparationReport = loadReport<MovieAnalysisRealImageRuntimePreparationReport>(
    root,
    REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH
  );
  const imageExportReport = loadReport<MovieAnalysisRealImagePromptExportReport>(
    root,
    REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH
  );
  const videoPreparationReport = loadReport<MovieAnalysisRealVideoRuntimePreparationReport>(
    root,
    REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH
  );
  const videoExportReport = loadReport<MovieAnalysisRealVideoPromptExportReport>(
    root,
    REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH
  );

  if (
    !imagePreparationReport ||
    !imageExportReport ||
    !videoPreparationReport ||
    !videoExportReport
  ) {
    return writeFailReport(root, timestamp, issues, phaseAudits);
  }

  const imageRuntimePreparationReady = toStatus(
    imagePreparationReport.runtime_preparation_ready === 'PASS' &&
      imagePreparationReport.final_verdict === REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT
  );

  const videoRuntimePreparationReady = toStatus(
    videoPreparationReport.runtime_preparation_ready === 'PASS' &&
      videoPreparationReport.final_verdict === REAL_VIDEO_RUNTIME_PREPARATION_PASS_VERDICT
  );

  const imagePromptExportReady = toStatus(
    imageExportReport.image_prompt_export_ready === 'PASS' &&
      imageExportReport.final_verdict === REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT
  );

  const videoPromptExportReady = toStatus(
    videoExportReport.video_prompt_export_ready === 'PASS' &&
      videoExportReport.final_verdict === REAL_VIDEO_PROMPT_EXPORT_PASS_VERDICT
  );

  const runtimeMappingPreserved = toStatus(
    imagePreparationReport.runtime_mapping_preserved === 'PASS' &&
      videoPreparationReport.runtime_mapping_preserved === 'PASS' &&
      imageExportReport.runtime_mapping_preserved === 'PASS' &&
      videoExportReport.runtime_mapping_preserved === 'PASS'
  );

  const traceabilityPreserved = toStatus(
    imagePreparationReport.traceability_preserved === 'PASS' &&
      videoPreparationReport.traceability_preserved === 'PASS' &&
      imageExportReport.traceability_preserved === 'PASS' &&
      videoExportReport.traceability_preserved === 'PASS'
  );

  const sourceCount = videoExportReport.source_count;
  const adapterCount = videoExportReport.adapter_count;

  if (
    sourceCount !== EXPECTED_SOURCE_COUNT ||
    imagePreparationReport.source_count !== EXPECTED_SOURCE_COUNT ||
    imageExportReport.source_count !== EXPECTED_SOURCE_COUNT ||
    videoPreparationReport.source_count !== EXPECTED_SOURCE_COUNT
  ) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (
    adapterCount !== EXPECTED_ADAPTER_COUNT ||
    imagePreparationReport.adapter_count !== EXPECTED_ADAPTER_COUNT ||
    imageExportReport.adapter_count !== EXPECTED_ADAPTER_COUNT ||
    videoPreparationReport.adapter_count !== EXPECTED_ADAPTER_COUNT
  ) {
    issues.push({
      code: 'ADAPTER_COUNT_INVALID',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const safetyValid =
    imagePreparationReport.planning_only === true &&
    imagePreparationReport.planning_only_status === 'PASS' &&
    imagePreparationReport.generation === false &&
    imageExportReport.planning_only === true &&
    imageExportReport.planning_only_status === 'PASS' &&
    imageExportReport.generation === false &&
    videoPreparationReport.planning_only === true &&
    videoPreparationReport.planning_only_status === 'PASS' &&
    videoPreparationReport.generation === false &&
    videoExportReport.planning_only === true &&
    videoExportReport.planning_only_status === 'PASS' &&
    videoExportReport.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = toStatus(safetyValid);

  const realRuntimePhasesComplete = toStatus(
    phaseAudits.length === REAL_RUNTIME_PHASE_COUNT &&
      phaseAudits.every((audit) => audit.phase_passed)
  );

  const gateChecks: CertificationStatus[] = [
    realRuntimePhasesComplete,
    imageRuntimePreparationReady,
    videoRuntimePreparationReady,
    imagePromptExportReady,
    videoPromptExportReady,
    runtimeMappingPreserved,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_RUNTIME_CERTIFICATION_VALIDATION_FAIL',
        message: 'Real runtime certification validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const realRuntimeReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realRuntimeReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_RUNTIME_CERTIFICATION_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'REAL_RUNTIME_NOT_READY',
      message: 'Real runtime certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealRuntimeCertificationReport = {
    report_id: 'movie-analysis-real-runtime-certification-report-v1',
    phase: REAL_RUNTIME_CERTIFICATION_PHASE,
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
    real_runtime_phase_count: REAL_RUNTIME_PHASE_COUNT,
    real_runtime_phases_complete: realRuntimePhasesComplete,
    image_runtime_preparation_ready: imageRuntimePreparationReady,
    video_runtime_preparation_ready: videoRuntimePreparationReady,
    image_prompt_export_ready: imagePromptExportReady,
    video_prompt_export_ready: videoPromptExportReady,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    real_runtime_ready: realRuntimeReady,
    planning_only_status: planningOnlyStatus,
    real_image_runtime_preparation_report_path: REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH,
    real_video_runtime_preparation_report_path: REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH,
    real_image_prompt_export_report_path: REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
    real_video_prompt_export_report_path: REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH,
    phase_audits: phaseAudits,
    final_verdict: pass
      ? REAL_RUNTIME_CERTIFICATION_PASS_VERDICT
      : REAL_RUNTIME_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_RUNTIME_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_RUNTIME_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_RUNTIME_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
