import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_PATH,
  type MovieAnalysisRealImagePromptExportPackage,
  type RealImagePromptExportEntry,
} from './movieAnalysisRealImagePromptExport.js';
import {
  REAL_RUNTIME_CERTIFICATION_DIR,
  REAL_RUNTIME_CERTIFICATION_PASS_VERDICT,
  REAL_RUNTIME_CERTIFICATION_REPORT_PATH,
  type MovieAnalysisRealRuntimeCertificationReport,
} from './movieAnalysisRealRuntimeCertification.js';
import {
  REAL_VIDEO_PROMPT_EXPORT_PATH,
  type MovieAnalysisRealVideoPromptExportPackage,
  type RealVideoPromptExportEntry,
} from './movieAnalysisRealVideoPromptExport.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_RUNTIME_EXECUTION_READINESS_PHASE =
  'PHASE-LEVEL2D-006-MOVIE_ANALYSIS_REAL_RUNTIME_EXECUTION_READINESS_V1' as const;
export const REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_RUNTIME_EXECUTION_READINESS_V1' as const;
export const REAL_RUNTIME_EXECUTION_READINESS_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_RUNTIME_EXECUTION_READINESS_V1' as const;
export const REAL_RUNTIME_EXECUTION_READINESS_DIR =
  'reports/movie_analysis_real_runtime_execution_readiness' as const;
export const REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH =
  'reports/movie_analysis_real_runtime_execution_readiness/movie-analysis-real-runtime-execution-readiness-report.json' as const;
export const REAL_RUNTIME_EXECUTION_READINESS_MD_PATH =
  'reports/movie_analysis_real_runtime_execution_readiness/MOVIE_ANALYSIS_REAL_RUNTIME_EXECUTION_READINESS.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ReadinessStatus = 'PASS' | 'FAIL';

export type RealRuntimeExecutionReadinessIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type RealRuntimeExecutionReadinessEntry = {
  source_id: string;
  image_prompt_export_present: true;
  video_prompt_export_present: true;
  execution_readiness_ready: true;
  planning_only: true;
  generation: false;
};

export type SourceRealRuntimeExecutionReadinessAudit = {
  source_id: string;
  image_prompt_export_present: ReadinessStatus;
  video_prompt_export_present: ReadinessStatus;
  runtime_mapping_preserved: ReadinessStatus;
  traceability_preserved: ReadinessStatus;
  source_execution_readiness_ready: ReadinessStatus;
};

export type MovieAnalysisRealRuntimeExecutionReadinessReport = {
  report_id: string;
  phase: typeof REAL_RUNTIME_EXECUTION_READINESS_PHASE;
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
  real_runtime_certification_report_path: typeof REAL_RUNTIME_CERTIFICATION_REPORT_PATH;
  real_image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  real_video_prompt_export_path: typeof REAL_VIDEO_PROMPT_EXPORT_PATH;
  source_count: number;
  adapter_count: number;
  real_runtime_ready: ReadinessStatus;
  image_prompt_export_ready: ReadinessStatus;
  video_prompt_export_ready: ReadinessStatus;
  runtime_mapping_preserved: ReadinessStatus;
  traceability_preserved: ReadinessStatus;
  execution_readiness_ready: ReadinessStatus;
  planning_only_status: ReadinessStatus;
  readiness_entries: RealRuntimeExecutionReadinessEntry[];
  source_audits: SourceRealRuntimeExecutionReadinessAudit[];
  final_verdict:
    | typeof REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT
    | typeof REAL_RUNTIME_EXECUTION_READINESS_FAIL_VERDICT;
  issues: RealRuntimeExecutionReadinessIssue[];
};

function loadCertificationReport(
  projectRoot: string
): MovieAnalysisRealRuntimeCertificationReport | null {
  const abs = path.join(projectRoot, REAL_RUNTIME_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealRuntimeCertificationReport;
}

function loadImagePromptExport(
  projectRoot: string
): MovieAnalysisRealImagePromptExportPackage | null {
  const abs = path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealImagePromptExportPackage;
}

function loadVideoPromptExport(
  projectRoot: string
): MovieAnalysisRealVideoPromptExportPackage | null {
  const abs = path.join(projectRoot, REAL_VIDEO_PROMPT_EXPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealVideoPromptExportPackage;
}

function imageExportEntryReady(entry: RealImagePromptExportEntry | undefined): boolean {
  return (
    entry !== undefined &&
    entry.export_ready === true &&
    entry.planning_only === true &&
    entry.generation === false &&
    entry.resolved_image_prompt.startsWith('image_prompt:') &&
    entry.resolved_image_prompt.trim().length > 0 &&
    entry.negative_prompt.trim().length > 0 &&
    entry.resolved_runtime_mappings.length === 6 &&
    entry.adapter_traceability.traceability_preserved === true
  );
}

function videoExportEntryReady(entry: RealVideoPromptExportEntry | undefined): boolean {
  return (
    entry !== undefined &&
    entry.export_ready === true &&
    entry.planning_only === true &&
    entry.generation === false &&
    entry.resolved_video_prompt.startsWith('video_prompt:') &&
    entry.resolved_video_prompt.trim().length > 0 &&
    entry.resolved_runtime_mappings.length === 6 &&
    entry.traceability.traceability_preserved === true
  );
}

function auditSourceReadiness(
  imageEntry: RealImagePromptExportEntry | undefined,
  videoEntry: RealVideoPromptExportEntry | undefined,
  sourceId: string
): SourceRealRuntimeExecutionReadinessAudit {
  if (!imageEntry || !videoEntry) {
    return {
      source_id: sourceId,
      image_prompt_export_present: 'FAIL',
      video_prompt_export_present: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      source_execution_readiness_ready: 'FAIL',
    };
  }

  const imagePromptExportPresent = imageExportEntryReady(imageEntry) ? 'PASS' : 'FAIL';
  const videoPromptExportPresent = videoExportEntryReady(videoEntry) ? 'PASS' : 'FAIL';

  const mappingPreserved =
    imageEntry.resolved_runtime_mappings.every((mapping) => mapping.conflict_free === true) &&
    videoEntry.resolved_runtime_mappings.every((mapping) => mapping.conflict_free === true) &&
    imageEntry.resolved_runtime_mappings.length === 6 &&
    videoEntry.resolved_runtime_mappings.length === 6
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    imageEntry.adapter_traceability.traceability_preserved === true &&
    videoEntry.traceability.traceability_preserved === true &&
    imageEntry.adapter_traceability.adapter_ids.length === 6 &&
    videoEntry.traceability.adapter_ids.length === 6
      ? 'PASS'
      : 'FAIL';

  const checks: ReadinessStatus[] = [
    imagePromptExportPresent,
    videoPromptExportPresent,
    mappingPreserved,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    image_prompt_export_present: imagePromptExportPresent,
    video_prompt_export_present: videoPromptExportPresent,
    runtime_mapping_preserved: mappingPreserved,
    traceability_preserved: traceabilityPreserved,
    source_execution_readiness_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealRuntimeExecutionReadinessAudit[],
  field: keyof Omit<
    SourceRealRuntimeExecutionReadinessAudit,
    'source_id' | 'source_execution_readiness_ready'
  >
): ReadinessStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealRuntimeExecutionReadinessReport): string {
  const lines = [
    '# Movie Analysis Real Runtime Execution Readiness',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Readiness Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Readiness Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| real_runtime_ready | ${report.real_runtime_ready} |`,
    `| image_prompt_export_ready | ${report.image_prompt_export_ready} |`,
    `| video_prompt_export_ready | ${report.video_prompt_export_ready} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| execution_readiness_ready | ${report.execution_readiness_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- image_prompt_export_present: ${audit.image_prompt_export_present}`,
      `- video_prompt_export_present: ${audit.video_prompt_export_present}`,
      `- runtime_mapping_preserved: ${audit.runtime_mapping_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- source_execution_readiness_ready: ${audit.source_execution_readiness_ready}`,
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
  issues: RealRuntimeExecutionReadinessIssue[]
): MovieAnalysisRealRuntimeExecutionReadinessReport {
  const report: MovieAnalysisRealRuntimeExecutionReadinessReport = {
    report_id: 'movie-analysis-real-runtime-execution-readiness-report-v1',
    phase: REAL_RUNTIME_EXECUTION_READINESS_PHASE,
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
    real_runtime_certification_report_path: REAL_RUNTIME_CERTIFICATION_REPORT_PATH,
    real_image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    real_video_prompt_export_path: REAL_VIDEO_PROMPT_EXPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    real_runtime_ready: 'FAIL',
    image_prompt_export_ready: 'FAIL',
    video_prompt_export_ready: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    execution_readiness_ready: 'FAIL',
    planning_only_status: 'FAIL',
    readiness_entries: [],
    source_audits: [],
    final_verdict: REAL_RUNTIME_EXECUTION_READINESS_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_RUNTIME_EXECUTION_READINESS_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_RUNTIME_EXECUTION_READINESS_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealRuntimeExecutionReadiness(
  projectRoot?: string
): MovieAnalysisRealRuntimeExecutionReadinessReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealRuntimeExecutionReadinessIssue[] = [];
  const timestamp = new Date().toISOString();

  const certificationDir = path.join(root, REAL_RUNTIME_CERTIFICATION_DIR);
  if (!fs.existsSync(certificationDir)) {
    issues.push({
      code: 'REAL_RUNTIME_CERTIFICATION_DIR_MISSING',
      message: `Missing ${REAL_RUNTIME_CERTIFICATION_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const certificationReport = loadCertificationReport(root);
  if (!certificationReport) {
    issues.push({
      code: 'REAL_RUNTIME_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${REAL_RUNTIME_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    certificationReport.final_verdict !== REAL_RUNTIME_CERTIFICATION_PASS_VERDICT ||
    certificationReport.real_runtime_ready !== 'PASS'
  ) {
    issues.push({
      code: 'LEVEL2D_005_NOT_PASS',
      message: `Real runtime certification must have ${REAL_RUNTIME_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const imagePromptExport = loadImagePromptExport(root);
  if (!imagePromptExport) {
    issues.push({
      code: 'REAL_IMAGE_PROMPT_EXPORT_MISSING',
      message: `Missing ${REAL_IMAGE_PROMPT_EXPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const videoPromptExport = loadVideoPromptExport(root);
  if (!videoPromptExport) {
    issues.push({
      code: 'REAL_VIDEO_PROMPT_EXPORT_MISSING',
      message: `Missing ${REAL_VIDEO_PROMPT_EXPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const readinessEntries: RealRuntimeExecutionReadinessEntry[] = [];
  const sourceAudits: SourceRealRuntimeExecutionReadinessAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const imageEntry = imagePromptExport.entries.find(
      (item) => item.source_video_id === sourceId
    );
    const videoEntry = videoPromptExport.entries.find((item) => item.source_id === sourceId);

    if (imageEntry && videoEntry && imageExportEntryReady(imageEntry) && videoExportEntryReady(videoEntry)) {
      readinessEntries.push({
        source_id: sourceId,
        image_prompt_export_present: true,
        video_prompt_export_present: true,
        execution_readiness_ready: true,
        planning_only: true,
        generation: false,
      });
    }

    const audit = auditSourceReadiness(imageEntry, videoEntry, sourceId);
    sourceAudits.push(audit);

    if (audit.source_execution_readiness_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_EXECUTION_READINESS_NOT_READY',
        message: `Real runtime execution readiness failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
  }

  const packageMappingPreserved = aggregateStatus(sourceAudits, 'runtime_mapping_preserved');
  const packageTraceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const realRuntimeReady: ReadinessStatus =
    certificationReport.real_runtime_ready === 'PASS' &&
    certificationReport.final_verdict === REAL_RUNTIME_CERTIFICATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const imagePromptExportReady: ReadinessStatus =
    certificationReport.image_prompt_export_ready === 'PASS' &&
    imagePromptExport.source_count === EXPECTED_SOURCE_COUNT &&
    imagePromptExport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    imagePromptExport.safety_summary.planning_only === true &&
    imagePromptExport.safety_summary.generation === false &&
    imagePromptExport.entries.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.image_prompt_export_present === 'PASS')
      ? 'PASS'
      : 'FAIL';

  const videoPromptExportReady: ReadinessStatus =
    certificationReport.video_prompt_export_ready === 'PASS' &&
    videoPromptExport.source_count === EXPECTED_SOURCE_COUNT &&
    videoPromptExport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    videoPromptExport.safety_summary.planning_only === true &&
    videoPromptExport.safety_summary.generation === false &&
    videoPromptExport.entries.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.video_prompt_export_present === 'PASS')
      ? 'PASS'
      : 'FAIL';

  const runtimeMappingPreserved: ReadinessStatus =
    packageMappingPreserved === 'PASS' &&
    certificationReport.runtime_mapping_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved: ReadinessStatus =
    packageTraceabilityPreserved === 'PASS' &&
    certificationReport.traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const sourceCount = certificationReport.source_count;
  const adapterCount = certificationReport.adapter_count;

  if (
    sourceCount !== EXPECTED_SOURCE_COUNT ||
    imagePromptExport.source_count !== EXPECTED_SOURCE_COUNT ||
    videoPromptExport.source_count !== EXPECTED_SOURCE_COUNT
  ) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (
    adapterCount !== EXPECTED_ADAPTER_COUNT ||
    imagePromptExport.adapter_count !== EXPECTED_ADAPTER_COUNT ||
    videoPromptExport.adapter_count !== EXPECTED_ADAPTER_COUNT
  ) {
    issues.push({
      code: 'ADAPTER_COUNT_INVALID',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const safetyValid =
    certificationReport.planning_only === true &&
    certificationReport.planning_only_status === 'PASS' &&
    certificationReport.generation === false &&
    imagePromptExport.safety_summary.planning_only === true &&
    imagePromptExport.safety_summary.generation === false &&
    videoPromptExport.safety_summary.planning_only === true &&
    videoPromptExport.safety_summary.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: ReadinessStatus = safetyValid ? 'PASS' : 'FAIL';

  const gateChecks: ReadinessStatus[] = [
    realRuntimeReady,
    imagePromptExportReady,
    videoPromptExportReady,
    runtimeMappingPreserved,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_RUNTIME_EXECUTION_READINESS_VALIDATION_FAIL',
        message: 'Real runtime execution readiness validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const executionReadinessReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    readinessEntries.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.source_execution_readiness_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = executionReadinessReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_RUNTIME_EXECUTION_READINESS_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'EXECUTION_READINESS_NOT_READY',
      message: 'Real runtime execution readiness is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealRuntimeExecutionReadinessReport = {
    report_id: 'movie-analysis-real-runtime-execution-readiness-report-v1',
    phase: REAL_RUNTIME_EXECUTION_READINESS_PHASE,
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
    real_runtime_certification_report_path: REAL_RUNTIME_CERTIFICATION_REPORT_PATH,
    real_image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    real_video_prompt_export_path: REAL_VIDEO_PROMPT_EXPORT_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    real_runtime_ready: realRuntimeReady,
    image_prompt_export_ready: imagePromptExportReady,
    video_prompt_export_ready: videoPromptExportReady,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    execution_readiness_ready: executionReadinessReady,
    planning_only_status: planningOnlyStatus,
    readiness_entries: readinessEntries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT
      : REAL_RUNTIME_EXECUTION_READINESS_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_RUNTIME_EXECUTION_READINESS_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_RUNTIME_EXECUTION_READINESS_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
