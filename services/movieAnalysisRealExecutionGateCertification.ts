import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  REAL_EXECUTION_PACKAGE_CERTIFICATION_DIR,
  REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT,
  REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH,
  REAL_EXECUTION_PACKAGE_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisRealExecutionPackageCertificationReport,
} from './movieAnalysisRealExecutionPackageCertification.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_DIR,
  REAL_IMAGE_PROMPT_EXPORT_PATH,
  type MovieAnalysisRealImagePromptExportPackage,
  type RealImagePromptExportEntry,
} from './movieAnalysisRealImagePromptExport.js';
import {
  REAL_VIDEO_PROMPT_EXPORT_DIR,
  REAL_VIDEO_PROMPT_EXPORT_PATH,
  type MovieAnalysisRealVideoPromptExportPackage,
  type RealVideoPromptExportEntry,
} from './movieAnalysisRealVideoPromptExport.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_EXECUTION_GATE_CERTIFICATION_PHASE =
  'PHASE-LEVEL2D-008-MOVIE_ANALYSIS_REAL_EXECUTION_GATE_CERTIFICATION_V1' as const;
export const REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_EXECUTION_GATE_CERTIFICATION_V1' as const;
export const REAL_EXECUTION_GATE_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_EXECUTION_GATE_CERTIFICATION_V1' as const;
export const REAL_EXECUTION_GATE_CERTIFICATION_DIR =
  'reports/movie_analysis_real_execution_gate_certification' as const;
export const REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_real_execution_gate_certification/movie-analysis-real-execution-gate-certification-report.json' as const;
export const REAL_EXECUTION_GATE_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_real_execution_gate_certification/MOVIE_ANALYSIS_REAL_EXECUTION_GATE_CERTIFICATION.md' as const;
export const REAL_EXECUTION_GATE_CERTIFICATION_STATUS_MESSAGE =
  'REAL_EXECUTION_GATE_READY' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type GateStatus = 'PASS' | 'FAIL';

export type RealExecutionGateCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type RealExecutionGateEntry = {
  source_id: string;
  image_prompt_export_ready: true;
  video_prompt_export_ready: true;
  execution_gate_ready: true;
  planning_only: true;
  generation: false;
  execution_gate_only: true;
};

export type SourceRealExecutionGateAudit = {
  source_id: string;
  image_prompt_export_ready: GateStatus;
  video_prompt_export_ready: GateStatus;
  runtime_mapping_preserved: GateStatus;
  traceability_preserved: GateStatus;
  source_execution_gate_ready: GateStatus;
};

export type MovieAnalysisRealExecutionGateCertificationReport = {
  report_id: string;
  phase: typeof REAL_EXECUTION_GATE_CERTIFICATION_PHASE;
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
  execution_gate_only: true;
  real_execution_package_certification_report_path: typeof REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH;
  real_image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  real_video_prompt_export_path: typeof REAL_VIDEO_PROMPT_EXPORT_PATH;
  source_count: number;
  adapter_count: number;
  real_execution_package_ready: GateStatus;
  image_prompt_export_ready: GateStatus;
  video_prompt_export_ready: GateStatus;
  runtime_mapping_preserved: GateStatus;
  traceability_preserved: GateStatus;
  real_execution_gate_certification_ready: GateStatus;
  planning_only_status: GateStatus;
  certification_status: typeof REAL_EXECUTION_GATE_CERTIFICATION_STATUS_MESSAGE | null;
  gate_entries: RealExecutionGateEntry[];
  source_audits: SourceRealExecutionGateAudit[];
  final_verdict:
    | typeof REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT
    | typeof REAL_EXECUTION_GATE_CERTIFICATION_FAIL_VERDICT;
  issues: RealExecutionGateCertificationIssue[];
};

function loadPackageCertificationReport(
  projectRoot: string
): MovieAnalysisRealExecutionPackageCertificationReport | null {
  const abs = path.join(projectRoot, REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealExecutionPackageCertificationReport;
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

function auditSourceGate(
  imageEntry: RealImagePromptExportEntry | undefined,
  videoEntry: RealVideoPromptExportEntry | undefined,
  packageEntry:
    | MovieAnalysisRealExecutionPackageCertificationReport['package_entries'][number]
    | undefined,
  sourceId: string
): SourceRealExecutionGateAudit {
  if (!imageEntry || !videoEntry || !packageEntry) {
    return {
      source_id: sourceId,
      image_prompt_export_ready: 'FAIL',
      video_prompt_export_ready: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      source_execution_gate_ready: 'FAIL',
    };
  }

  const imagePromptExportReady =
    imageExportEntryReady(imageEntry) && packageEntry.image_prompt_export_ready === true
      ? 'PASS'
      : 'FAIL';

  const videoPromptExportReady =
    videoExportEntryReady(videoEntry) && packageEntry.video_prompt_export_ready === true
      ? 'PASS'
      : 'FAIL';

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
    packageEntry.package_certification_ready === true &&
    packageEntry.planning_only === true &&
    packageEntry.generation === false
      ? 'PASS'
      : 'FAIL';

  const checks: GateStatus[] = [
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
    source_execution_gate_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealExecutionGateAudit[],
  field: keyof Omit<SourceRealExecutionGateAudit, 'source_id' | 'source_execution_gate_ready'>
): GateStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealExecutionGateCertificationReport): string {
  const lines = [
    '# Movie Analysis Real Execution Gate Certification',
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
    '## Gate Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| execution_gate_only | ${report.execution_gate_only} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| image_generation | ${report.image_generation} |`,
    `| video_generation | ${report.video_generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Gate Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| real_execution_package_ready | ${report.real_execution_package_ready} |`,
    `| image_prompt_export_ready | ${report.image_prompt_export_ready} |`,
    `| video_prompt_export_ready | ${report.video_prompt_export_ready} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| real_execution_gate_certification_ready | ${report.real_execution_gate_certification_ready} |`,
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
      `- source_execution_gate_ready: ${audit.source_execution_gate_ready}`,
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
  issues: RealExecutionGateCertificationIssue[]
): MovieAnalysisRealExecutionGateCertificationReport {
  const report: MovieAnalysisRealExecutionGateCertificationReport = {
    report_id: 'movie-analysis-real-execution-gate-certification-report-v1',
    phase: REAL_EXECUTION_GATE_CERTIFICATION_PHASE,
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
    execution_gate_only: true,
    real_execution_package_certification_report_path: REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH,
    real_image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    real_video_prompt_export_path: REAL_VIDEO_PROMPT_EXPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    real_execution_package_ready: 'FAIL',
    image_prompt_export_ready: 'FAIL',
    video_prompt_export_ready: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    real_execution_gate_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    gate_entries: [],
    source_audits: [],
    final_verdict: REAL_EXECUTION_GATE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_EXECUTION_GATE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_EXECUTION_GATE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealExecutionGateCertification(
  projectRoot?: string
): MovieAnalysisRealExecutionGateCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealExecutionGateCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(path.join(root, REAL_EXECUTION_PACKAGE_CERTIFICATION_DIR))) {
    issues.push({
      code: 'REAL_EXECUTION_PACKAGE_CERTIFICATION_DIR_MISSING',
      message: `Missing ${REAL_EXECUTION_PACKAGE_CERTIFICATION_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const packageReport = loadPackageCertificationReport(root);
  if (!packageReport) {
    issues.push({
      code: 'REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    packageReport.final_verdict !== REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT ||
    packageReport.certification_status !== REAL_EXECUTION_PACKAGE_CERTIFICATION_STATUS_MESSAGE ||
    packageReport.real_execution_package_certification_ready !== 'PASS'
  ) {
    issues.push({
      code: 'LEVEL2D_007_NOT_PASS',
      message: `Real execution package certification must have ${REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

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

  const gateEntries: RealExecutionGateEntry[] = [];
  const sourceAudits: SourceRealExecutionGateAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const imageEntry = imagePromptExport.entries.find(
      (item) => item.source_video_id === sourceId
    );
    const videoEntry = videoPromptExport.entries.find((item) => item.source_id === sourceId);
    const packageEntry = packageReport.package_entries.find((item) => item.source_id === sourceId);

    const audit = auditSourceGate(imageEntry, videoEntry, packageEntry, sourceId);
    sourceAudits.push(audit);

    if (audit.source_execution_gate_ready === 'PASS') {
      gateEntries.push({
        source_id: sourceId,
        image_prompt_export_ready: true,
        video_prompt_export_ready: true,
        execution_gate_ready: true,
        planning_only: true,
        generation: false,
        execution_gate_only: true,
      });
    } else {
      issues.push({
        code: 'SOURCE_EXECUTION_GATE_NOT_READY',
        message: `Real execution gate certification failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
  }

  const realExecutionPackageReady: GateStatus =
    packageReport.real_execution_package_certification_ready === 'PASS' &&
    packageReport.certification_status === REAL_EXECUTION_PACKAGE_CERTIFICATION_STATUS_MESSAGE &&
    packageReport.final_verdict === REAL_EXECUTION_PACKAGE_CERTIFICATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const imagePromptExportReady: GateStatus =
    packageReport.image_prompt_export_ready === 'PASS' &&
    imagePromptExport.entries.length === EXPECTED_SOURCE_COUNT &&
    aggregateStatus(sourceAudits, 'image_prompt_export_ready') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const videoPromptExportReady: GateStatus =
    packageReport.video_prompt_export_ready === 'PASS' &&
    videoPromptExport.entries.length === EXPECTED_SOURCE_COUNT &&
    aggregateStatus(sourceAudits, 'video_prompt_export_ready') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const runtimeMappingPreserved: GateStatus =
    aggregateStatus(sourceAudits, 'runtime_mapping_preserved') === 'PASS' &&
    packageReport.runtime_mapping_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved: GateStatus =
    aggregateStatus(sourceAudits, 'traceability_preserved') === 'PASS' &&
    packageReport.traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const sourceCount = packageReport.source_count;
  const adapterCount = packageReport.adapter_count;

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
    packageReport.planning_only === true &&
    packageReport.planning_only_status === 'PASS' &&
    packageReport.generation === false &&
    packageReport.gpu_execution === false &&
    packageReport.image_generation === false &&
    packageReport.video_generation === false &&
    packageReport.certification_only === true &&
    imagePromptExport.safety_summary.planning_only === true &&
    imagePromptExport.safety_summary.generation === false &&
    imagePromptExport.safety_summary.gpu_execution === false &&
    videoPromptExport.safety_summary.planning_only === true &&
    videoPromptExport.safety_summary.generation === false &&
    videoPromptExport.safety_summary.gpu_execution === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only gate safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: GateStatus = safetyValid ? 'PASS' : 'FAIL';

  const gateChecks: GateStatus[] = [
    realExecutionPackageReady,
    imagePromptExportReady,
    videoPromptExportReady,
    runtimeMappingPreserved,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_EXECUTION_GATE_CERTIFICATION_VALIDATION_FAIL',
        message: 'Real execution gate certification validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const realExecutionGateCertificationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    gateEntries.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.source_execution_gate_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realExecutionGateCertificationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_EXECUTION_GATE_CERTIFICATION_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'REAL_EXECUTION_GATE_NOT_READY',
      message: 'Real execution gate certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealExecutionGateCertificationReport = {
    report_id: 'movie-analysis-real-execution-gate-certification-report-v1',
    phase: REAL_EXECUTION_GATE_CERTIFICATION_PHASE,
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
    execution_gate_only: true,
    real_execution_package_certification_report_path: REAL_EXECUTION_PACKAGE_CERTIFICATION_REPORT_PATH,
    real_image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    real_video_prompt_export_path: REAL_VIDEO_PROMPT_EXPORT_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    real_execution_package_ready: realExecutionPackageReady,
    image_prompt_export_ready: imagePromptExportReady,
    video_prompt_export_ready: videoPromptExportReady,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    real_execution_gate_certification_ready: realExecutionGateCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? REAL_EXECUTION_GATE_CERTIFICATION_STATUS_MESSAGE : null,
    gate_entries: gateEntries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_EXECUTION_GATE_CERTIFICATION_PASS_VERDICT
      : REAL_EXECUTION_GATE_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_EXECUTION_GATE_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_EXECUTION_GATE_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_EXECUTION_GATE_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
