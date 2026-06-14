import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_DIR,
  REAL_IMAGE_PROMPT_EXPORT_PATH,
  type MovieAnalysisRealImagePromptExportPackage,
  type RealImagePromptExportEntry,
} from './movieAnalysisRealImagePromptExport.js';
import {
  REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT,
  REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH,
  type MovieAnalysisRealRuntimeExecutionReadinessReport,
} from './movieAnalysisRealRuntimeExecutionReadiness.js';
import {
  REAL_VIDEO_PROMPT_EXPORT_DIR,
  REAL_VIDEO_PROMPT_EXPORT_PATH,
  type MovieAnalysisRealVideoPromptExportPackage,
  type RealVideoPromptExportEntry,
} from './movieAnalysisRealVideoPromptExport.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_EXECUTION_PACKAGE_CERTIFICATION_PHASE =
  'PHASE-LEVEL2D-007-MOVIE_ANALYSIS_REAL_EXECUTION_PACKAGE_CERTIFICATION_V1' as const;
export const REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_EXECUTION_PACKAGE_CERTIFICATION_V1' as const;
export const REAL_EXECUTION_PACKAGE_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_EXECUTION_PACKAGE_CERTIFICATION_V1' as const;
export const REAL_EXECUTION_PACKAGE_CERTIFICATION_DIR =
  'reports/movie_analysis_real_execution_package_certification' as const;
export const REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_real_execution_package_certification/movie-analysis-real-execution-package-certification-report.json' as const;
export const REAL_EXECUTION_PACKAGE_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_real_execution_package_certification/MOVIE_ANALYSIS_REAL_EXECUTION_PACKAGE_CERTIFICATION.md' as const;
export const REAL_EXECUTION_PACKAGE_CERTIFICATION_STATUS_MESSAGE =
  'REAL_EXECUTION_PACKAGE_READY' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type CertificationStatus = 'PASS' | 'FAIL';

export type RealExecutionPackageCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type RealExecutionPackageEntry = {
  source_id: string;
  image_prompt_export_ready: true;
  video_prompt_export_ready: true;
  package_certification_ready: true;
  planning_only: true;
  generation: false;
  certification_only: true;
};

export type SourceRealExecutionPackageAudit = {
  source_id: string;
  image_prompt_export_ready: CertificationStatus;
  video_prompt_export_ready: CertificationStatus;
  runtime_mapping_preserved: CertificationStatus;
  traceability_preserved: CertificationStatus;
  source_package_certification_ready: CertificationStatus;
};

export type MovieAnalysisRealExecutionPackageCertificationReport = {
  report_id: string;
  phase: typeof REAL_EXECUTION_PACKAGE_CERTIFICATION_PHASE;
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
  certification_only: true;
  real_runtime_execution_readiness_report_path: typeof REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH;
  real_image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  real_video_prompt_export_path: typeof REAL_VIDEO_PROMPT_EXPORT_PATH;
  source_count: number;
  adapter_count: number;
  image_prompt_export_ready: CertificationStatus;
  video_prompt_export_ready: CertificationStatus;
  execution_readiness_ready: CertificationStatus;
  runtime_mapping_preserved: CertificationStatus;
  traceability_preserved: CertificationStatus;
  real_execution_package_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof REAL_EXECUTION_PACKAGE_CERTIFICATION_STATUS_MESSAGE | null;
  package_entries: RealExecutionPackageEntry[];
  source_audits: SourceRealExecutionPackageAudit[];
  final_verdict:
    | typeof REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT
    | typeof REAL_EXECUTION_PACKAGE_CERTIFICATION_FAIL_VERDICT;
  issues: RealExecutionPackageCertificationIssue[];
};

function loadExecutionReadinessReport(
  projectRoot: string
): MovieAnalysisRealRuntimeExecutionReadinessReport | null {
  const abs = path.join(projectRoot, REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealRuntimeExecutionReadinessReport;
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
    entry.resolved_runtime_mappings.length === 6 &&
    entry.traceability.traceability_preserved === true
  );
}

function auditSourcePackage(
  imageEntry: RealImagePromptExportEntry | undefined,
  videoEntry: RealVideoPromptExportEntry | undefined,
  sourceId: string
): SourceRealExecutionPackageAudit {
  if (!imageEntry || !videoEntry) {
    return {
      source_id: sourceId,
      image_prompt_export_ready: 'FAIL',
      video_prompt_export_ready: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      source_package_certification_ready: 'FAIL',
    };
  }

  const imagePromptExportReady = imageExportEntryReady(imageEntry) ? 'PASS' : 'FAIL';
  const videoPromptExportReady = videoExportEntryReady(videoEntry) ? 'PASS' : 'FAIL';

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
    imageEntry.source_video_id === sourceId &&
    videoEntry.source_id === sourceId
      ? 'PASS'
      : 'FAIL';

  const checks: CertificationStatus[] = [
    imagePromptExportReady,
    videoPromptExportReady,
    mappingPreserved,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    image_prompt_export_ready: imagePromptExportReady,
    video_prompt_export_ready: videoPromptExportReady,
    runtime_mapping_preserved: mappingPreserved,
    traceability_preserved: traceabilityPreserved,
    source_package_certification_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealExecutionPackageAudit[],
  field: keyof Omit<SourceRealExecutionPackageAudit, 'source_id' | 'source_package_certification_ready'>
): CertificationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealExecutionPackageCertificationReport): string {
  const lines = [
    '# Movie Analysis Real Execution Package Certification',
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
    `| certification_only | ${report.certification_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| image_generation | ${report.image_generation} |`,
    `| video_generation | ${report.video_generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Execution Package',
    '',
    `- image_export: ${report.real_image_prompt_export_path}`,
    `- video_export: ${report.real_video_prompt_export_path}`,
    '',
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| image_prompt_export_ready | ${report.image_prompt_export_ready} |`,
    `| video_prompt_export_ready | ${report.video_prompt_export_ready} |`,
    `| execution_readiness_ready | ${report.execution_readiness_ready} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| real_execution_package_certification_ready | ${report.real_execution_package_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- image_prompt_export_ready: ${audit.image_prompt_export_ready}`,
      `- video_prompt_export_ready: ${audit.video_prompt_export_ready}`,
      `- runtime_mapping_preserved: ${audit.runtime_mapping_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- source_package_certification_ready: ${audit.source_package_certification_ready}`,
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
  issues: RealExecutionPackageCertificationIssue[]
): MovieAnalysisRealExecutionPackageCertificationReport {
  const report: MovieAnalysisRealExecutionPackageCertificationReport = {
    report_id: 'movie-analysis-real-execution-package-certification-report-v1',
    phase: REAL_EXECUTION_PACKAGE_CERTIFICATION_PHASE,
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
    certification_only: true,
    real_runtime_execution_readiness_report_path: REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH,
    real_image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    real_video_prompt_export_path: REAL_VIDEO_PROMPT_EXPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    image_prompt_export_ready: 'FAIL',
    video_prompt_export_ready: 'FAIL',
    execution_readiness_ready: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    real_execution_package_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    package_entries: [],
    source_audits: [],
    final_verdict: REAL_EXECUTION_PACKAGE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_EXECUTION_PACKAGE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_EXECUTION_PACKAGE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealExecutionPackageCertification(
  projectRoot?: string
): MovieAnalysisRealExecutionPackageCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealExecutionPackageCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(path.join(root, REAL_IMAGE_PROMPT_EXPORT_DIR))) {
    issues.push({
      code: 'REAL_IMAGE_PROMPT_EXPORT_DIR_MISSING',
      message: `Missing ${REAL_IMAGE_PROMPT_EXPORT_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(path.join(root, REAL_VIDEO_PROMPT_EXPORT_DIR))) {
    issues.push({
      code: 'REAL_VIDEO_PROMPT_EXPORT_DIR_MISSING',
      message: `Missing ${REAL_VIDEO_PROMPT_EXPORT_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const readinessReport = loadExecutionReadinessReport(root);
  if (!readinessReport) {
    issues.push({
      code: 'REAL_RUNTIME_EXECUTION_READINESS_REPORT_MISSING',
      message: `Missing ${REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    readinessReport.final_verdict !== REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT ||
    readinessReport.execution_readiness_ready !== 'PASS'
  ) {
    issues.push({
      code: 'LEVEL2D_006_NOT_PASS',
      message: `Real runtime execution readiness must have ${REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT}`,
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

  const packageEntries: RealExecutionPackageEntry[] = [];
  const sourceAudits: SourceRealExecutionPackageAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const imageEntry = imagePromptExport.entries.find(
      (item) => item.source_video_id === sourceId
    );
    const videoEntry = videoPromptExport.entries.find((item) => item.source_id === sourceId);

    const audit = auditSourcePackage(imageEntry, videoEntry, sourceId);
    sourceAudits.push(audit);

    if (audit.source_package_certification_ready === 'PASS') {
      packageEntries.push({
        source_id: sourceId,
        image_prompt_export_ready: true,
        video_prompt_export_ready: true,
        package_certification_ready: true,
        planning_only: true,
        generation: false,
        certification_only: true,
      });
    } else {
      issues.push({
        code: 'SOURCE_PACKAGE_CERTIFICATION_NOT_READY',
        message: `Real execution package certification failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
  }

  const imagePromptExportReady: CertificationStatus =
    readinessReport.image_prompt_export_ready === 'PASS' &&
    imagePromptExport.source_count === EXPECTED_SOURCE_COUNT &&
    imagePromptExport.entries.length === EXPECTED_SOURCE_COUNT &&
    aggregateStatus(sourceAudits, 'image_prompt_export_ready') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const videoPromptExportReady: CertificationStatus =
    readinessReport.video_prompt_export_ready === 'PASS' &&
    videoPromptExport.source_count === EXPECTED_SOURCE_COUNT &&
    videoPromptExport.entries.length === EXPECTED_SOURCE_COUNT &&
    aggregateStatus(sourceAudits, 'video_prompt_export_ready') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const executionReadinessReady: CertificationStatus =
    readinessReport.execution_readiness_ready === 'PASS' &&
    readinessReport.final_verdict === REAL_RUNTIME_EXECUTION_READINESS_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const runtimeMappingPreserved: CertificationStatus =
    aggregateStatus(sourceAudits, 'runtime_mapping_preserved') === 'PASS' &&
    readinessReport.runtime_mapping_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved: CertificationStatus =
    aggregateStatus(sourceAudits, 'traceability_preserved') === 'PASS' &&
    readinessReport.traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const sourceCount = readinessReport.source_count;
  const adapterCount = readinessReport.adapter_count;

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
    readinessReport.planning_only === true &&
    readinessReport.planning_only_status === 'PASS' &&
    readinessReport.generation === false &&
    readinessReport.gpu_execution === false &&
    readinessReport.image_generation === false &&
    readinessReport.video_generation === false &&
    imagePromptExport.safety_summary.planning_only === true &&
    imagePromptExport.safety_summary.generation === false &&
    imagePromptExport.safety_summary.gpu_execution === false &&
    videoPromptExport.safety_summary.planning_only === true &&
    videoPromptExport.safety_summary.generation === false &&
    videoPromptExport.safety_summary.gpu_execution === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only certification safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = safetyValid ? 'PASS' : 'FAIL';

  const gateChecks: CertificationStatus[] = [
    imagePromptExportReady,
    videoPromptExportReady,
    executionReadinessReady,
    runtimeMappingPreserved,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_EXECUTION_PACKAGE_CERTIFICATION_VALIDATION_FAIL',
        message: 'Real execution package certification validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const realExecutionPackageCertificationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    packageEntries.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.source_package_certification_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realExecutionPackageCertificationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_EXECUTION_PACKAGE_CERTIFICATION_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'REAL_EXECUTION_PACKAGE_NOT_READY',
      message: 'Real execution package certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealExecutionPackageCertificationReport = {
    report_id: 'movie-analysis-real-execution-package-certification-report-v1',
    phase: REAL_EXECUTION_PACKAGE_CERTIFICATION_PHASE,
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
    certification_only: true,
    real_runtime_execution_readiness_report_path: REAL_RUNTIME_EXECUTION_READINESS_REPORT_PATH,
    real_image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    real_video_prompt_export_path: REAL_VIDEO_PROMPT_EXPORT_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_prompt_export_ready: imagePromptExportReady,
    video_prompt_export_ready: videoPromptExportReady,
    execution_readiness_ready: executionReadinessReady,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    real_execution_package_certification_ready: realExecutionPackageCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? REAL_EXECUTION_PACKAGE_CERTIFICATION_STATUS_MESSAGE : null,
    package_entries: packageEntries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT
      : REAL_EXECUTION_PACKAGE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_EXECUTION_PACKAGE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_EXECUTION_PACKAGE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
