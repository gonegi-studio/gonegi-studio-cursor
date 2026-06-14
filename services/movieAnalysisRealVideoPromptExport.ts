import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import type { ResolvedRuntimeMapping } from './movieAnalysisPromptConflictResolution.js';
import type { RuntimeTarget } from './movieAnalysisRuntimeBindingFramework.js';
import {
  REAL_VIDEO_RUNTIME_PREPARATION_DIR,
  REAL_VIDEO_RUNTIME_PREPARATION_PASS_VERDICT,
  REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH,
  type MovieAnalysisRealVideoRuntimePreparationReport,
  type RealVideoRuntimePreparationEntry,
} from './movieAnalysisRealVideoRuntimePreparation.js';
import {
  VIDEO_RUNTIME_PACKAGE_PATH,
  type AdapterTraceability,
  type MovieAnalysisVideoRuntimePackage,
  type VideoRuntimePackageEntry,
  type VideoRuntimePackageInner,
} from './movieAnalysisVideoRuntimePackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_VIDEO_PROMPT_EXPORT_PHASE =
  'PHASE-LEVEL2D-004-MOVIE_ANALYSIS_REAL_VIDEO_PROMPT_EXPORT_V1' as const;
export const REAL_VIDEO_PROMPT_EXPORT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_VIDEO_PROMPT_EXPORT_V1' as const;
export const REAL_VIDEO_PROMPT_EXPORT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_VIDEO_PROMPT_EXPORT_V1' as const;
export const REAL_VIDEO_PROMPT_EXPORT_DIR = 'exports/movie_analysis_real_video_prompt_export' as const;
export const REAL_VIDEO_PROMPT_EXPORT_PATH =
  'exports/movie_analysis_real_video_prompt_export/movie-analysis-real-video-prompts.json' as const;
export const REAL_VIDEO_PROMPT_EXPORT_REPORT_DIR =
  'reports/movie_analysis_real_video_prompt_export' as const;
export const REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH =
  'reports/movie_analysis_real_video_prompt_export/movie-analysis-real-video-prompt-export-report.json' as const;
export const REAL_VIDEO_PROMPT_EXPORT_MD_PATH =
  'reports/movie_analysis_real_video_prompt_export/MOVIE_ANALYSIS_REAL_VIDEO_PROMPT_EXPORT.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ExportStatus = 'PASS' | 'FAIL';

export type RealVideoPromptExportIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type RealVideoPromptExportEntry = {
  source_id: string;
  resolved_video_prompt: string;
  video_runtime_package: VideoRuntimePackageInner;
  resolved_runtime_mappings: ResolvedRuntimeMapping[];
  traceability: AdapterTraceability;
  export_ready: true;
  planning_only: true;
  generation: false;
};

export type RealVideoPromptExportSafety = {
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisRealVideoPromptExportPackage = {
  export_id: string;
  export_type: 'movie_analysis_real_video_prompt_export';
  phase: typeof REAL_VIDEO_PROMPT_EXPORT_PHASE;
  consumer_target: 'video_app';
  generated_at: string;
  preparation_report_path: typeof REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH;
  video_runtime_package_path: typeof VIDEO_RUNTIME_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  entries: RealVideoPromptExportEntry[];
  safety_summary: RealVideoPromptExportSafety;
};

export type SourceRealVideoPromptExportAudit = {
  source_id: string;
  resolved_video_prompt_present: ExportStatus;
  runtime_mapping_preserved: ExportStatus;
  traceability_preserved: ExportStatus;
  source_export_ready: ExportStatus;
};

export type MovieAnalysisRealVideoPromptExportReport = {
  report_id: string;
  phase: typeof REAL_VIDEO_PROMPT_EXPORT_PHASE;
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
  real_video_runtime_preparation_report_path: typeof REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH;
  export_path: typeof REAL_VIDEO_PROMPT_EXPORT_PATH;
  source_count: number;
  adapter_count: number;
  resolved_video_prompt_present: ExportStatus;
  runtime_mapping_preserved: ExportStatus;
  traceability_preserved: ExportStatus;
  video_prompt_export_ready: ExportStatus;
  planning_only_status: ExportStatus;
  export_entries: RealVideoPromptExportEntry[];
  source_audits: SourceRealVideoPromptExportAudit[];
  final_verdict:
    | typeof REAL_VIDEO_PROMPT_EXPORT_PASS_VERDICT
    | typeof REAL_VIDEO_PROMPT_EXPORT_FAIL_VERDICT;
  issues: RealVideoPromptExportIssue[];
};

const VIDEO_RUNTIME_TARGETS: RuntimeTarget[] = [
  'scene_prompt',
  'camera_prompt',
  'emotion_prompt',
  'transition_runtime_rule',
  'continuity_runtime_rule',
  'narrative_runtime_rule',
];

function loadPreparationReport(
  projectRoot: string
): MovieAnalysisRealVideoRuntimePreparationReport | null {
  const abs = path.join(projectRoot, REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealVideoRuntimePreparationReport;
}

function loadVideoRuntimePackage(projectRoot: string): MovieAnalysisVideoRuntimePackage | null {
  const abs = path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoRuntimePackage;
}

function preparationEntryMatches(
  preparationEntry: RealVideoRuntimePreparationEntry,
  runtimeEntry: VideoRuntimePackageEntry
): boolean {
  return (
    preparationEntry.source_id === runtimeEntry.source_id &&
    preparationEntry.resolved_video_prompt === runtimeEntry.resolved_video_prompt &&
    preparationEntry.preparation_ready === true
  );
}

function cloneVideoRuntimePackage(inner: VideoRuntimePackageInner): VideoRuntimePackageInner {
  const cloned = {} as VideoRuntimePackageInner;
  for (const key of Object.keys(inner) as (keyof VideoRuntimePackageInner)[]) {
    const block = inner[key];
    cloned[key] = {
      ...block,
      resolved_pattern_signatures: [...block.resolved_pattern_signatures],
    };
  }
  return cloned;
}

function buildExportEntry(entry: VideoRuntimePackageEntry): RealVideoPromptExportEntry {
  return {
    source_id: entry.source_id,
    resolved_video_prompt: entry.resolved_video_prompt,
    video_runtime_package: cloneVideoRuntimePackage(entry.video_runtime_package),
    resolved_runtime_mappings: entry.resolved_runtime_mappings.map((mapping) => ({ ...mapping })),
    traceability: { ...entry.traceability, adapter_ids: [...entry.traceability.adapter_ids] },
    export_ready: true,
    planning_only: true,
    generation: false,
  };
}

function auditSourceExport(
  entry: VideoRuntimePackageEntry | undefined,
  preparationEntry: RealVideoRuntimePreparationEntry | undefined,
  sourceId: string
): SourceRealVideoPromptExportAudit {
  if (!entry || !preparationEntry) {
    return {
      source_id: sourceId,
      resolved_video_prompt_present: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      source_export_ready: 'FAIL',
    };
  }

  const resolvedVideoPromptPresent =
    entry.resolved_video_prompt.trim().length > 0 &&
    entry.resolved_video_prompt.startsWith('video_prompt:') &&
    preparationEntry.resolved_video_prompt === entry.resolved_video_prompt
      ? 'PASS'
      : 'FAIL';

  const mappingPreserved =
    entry.resolved_runtime_mappings.length === 6 &&
    entry.resolved_runtime_mappings.every((mapping) => mapping.conflict_free === true) &&
    VIDEO_RUNTIME_TARGETS.every((target) =>
      entry.resolved_runtime_mappings.some((mapping) => mapping.runtime_target === target)
    ) &&
    preparationEntry.runtime_mapping_count === 6
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    entry.traceability.traceability_preserved === true &&
    entry.traceability.adapter_ids.length === 6 &&
    preparationEntry.traceability_preserved === true &&
    preparationEntryMatches(preparationEntry, entry)
      ? 'PASS'
      : 'FAIL';

  const checks: ExportStatus[] = [
    resolvedVideoPromptPresent,
    mappingPreserved,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    resolved_video_prompt_present: resolvedVideoPromptPresent,
    runtime_mapping_preserved: mappingPreserved,
    traceability_preserved: traceabilityPreserved,
    source_export_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealVideoPromptExportAudit[],
  field: keyof Omit<SourceRealVideoPromptExportAudit, 'source_id' | 'source_export_ready'>
): ExportStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisRealVideoPromptExportReport,
  exportPackage: MovieAnalysisRealVideoPromptExportPackage | null
): string {
  const lines = [
    '# Movie Analysis Real Video Prompt Export',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Export Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Export Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| resolved_video_prompt_present | ${report.resolved_video_prompt_present} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| video_prompt_export_ready | ${report.video_prompt_export_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Export',
    '',
    `- export_path: ${report.export_path}`,
    `- entries: ${exportPackage?.entries.length ?? 0}`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- resolved_video_prompt_present: ${audit.resolved_video_prompt_present}`,
      `- runtime_mapping_preserved: ${audit.runtime_mapping_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- source_export_ready: ${audit.source_export_ready}`,
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
  issues: RealVideoPromptExportIssue[]
): MovieAnalysisRealVideoPromptExportReport {
  const report: MovieAnalysisRealVideoPromptExportReport = {
    report_id: 'movie-analysis-real-video-prompt-export-report-v1',
    phase: REAL_VIDEO_PROMPT_EXPORT_PHASE,
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
    real_video_runtime_preparation_report_path: REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH,
    export_path: REAL_VIDEO_PROMPT_EXPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    resolved_video_prompt_present: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    video_prompt_export_ready: 'FAIL',
    planning_only_status: 'FAIL',
    export_entries: [],
    source_audits: [],
    final_verdict: REAL_VIDEO_PROMPT_EXPORT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_PROMPT_EXPORT_REPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_PROMPT_EXPORT_MD_PATH),
    `${buildMarkdown(report, null)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealVideoPromptExport(projectRoot?: string): {
  exportPackage: MovieAnalysisRealVideoPromptExportPackage;
  report: MovieAnalysisRealVideoPromptExportReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealVideoPromptExportIssue[] = [];
  const timestamp = new Date().toISOString();

  const preparationDir = path.join(root, REAL_VIDEO_RUNTIME_PREPARATION_DIR);
  if (!fs.existsSync(preparationDir)) {
    issues.push({
      code: 'REAL_VIDEO_RUNTIME_PREPARATION_DIR_MISSING',
      message: `Missing ${REAL_VIDEO_RUNTIME_PREPARATION_DIR}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { exportPackage: null as unknown as MovieAnalysisRealVideoPromptExportPackage, report };
  }

  const preparationReport = loadPreparationReport(root);
  if (!preparationReport) {
    issues.push({
      code: 'REAL_VIDEO_RUNTIME_PREPARATION_REPORT_MISSING',
      message: `Missing ${REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { exportPackage: null as unknown as MovieAnalysisRealVideoPromptExportPackage, report };
  }

  if (
    preparationReport.final_verdict !== REAL_VIDEO_RUNTIME_PREPARATION_PASS_VERDICT ||
    preparationReport.runtime_preparation_ready !== 'PASS'
  ) {
    issues.push({
      code: 'LEVEL2D_003_NOT_PASS',
      message: `Real video runtime preparation must have ${REAL_VIDEO_RUNTIME_PREPARATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const runtimePackage = loadVideoRuntimePackage(root);
  if (!runtimePackage) {
    issues.push({
      code: 'VIDEO_RUNTIME_PACKAGE_MISSING',
      message: `Missing ${VIDEO_RUNTIME_PACKAGE_PATH}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { exportPackage: null as unknown as MovieAnalysisRealVideoPromptExportPackage, report };
  }

  const exportEntries: RealVideoPromptExportEntry[] = [];
  const sourceAudits: SourceRealVideoPromptExportAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const runtimeEntry = runtimePackage.entries.find((item) => item.source_id === sourceId);
    const preparationEntry = preparationReport.preparation_entries.find(
      (item) => item.source_id === sourceId
    );

    if (runtimeEntry && preparationEntry) {
      exportEntries.push(buildExportEntry(runtimeEntry));
    }

    const audit = auditSourceExport(runtimeEntry, preparationEntry, sourceId);
    sourceAudits.push(audit);

    if (audit.source_export_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_EXPORT_NOT_READY',
        message: `Real video prompt export failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
  }

  const resolvedVideoPromptPresent = aggregateStatus(sourceAudits, 'resolved_video_prompt_present');
  const runtimeMappingPreserved = aggregateStatus(sourceAudits, 'runtime_mapping_preserved');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const sourceCount = runtimePackage.source_count;
  const adapterCount = runtimePackage.adapter_count;

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
    preparationReport.planning_only === true &&
    preparationReport.planning_only_status === 'PASS' &&
    preparationReport.generation === false &&
    runtimePackage.safety_summary.planning_only === true &&
    runtimePackage.safety_summary.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: ExportStatus = safetyValid ? 'PASS' : 'FAIL';

  const gateChecks: ExportStatus[] = [
    resolvedVideoPromptPresent,
    runtimeMappingPreserved,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_VIDEO_PROMPT_EXPORT_VALIDATION_FAIL',
        message: 'Real video prompt export validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const videoPromptExportReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    preparationReport.source_count === EXPECTED_SOURCE_COUNT &&
    preparationReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    exportEntries.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.source_export_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = videoPromptExportReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_VIDEO_PROMPT_EXPORT_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'REAL_VIDEO_PROMPT_EXPORT_NOT_READY',
      message: 'Real video prompt export is not ready',
      severity: 'error',
    });
  }

  const exportPackage: MovieAnalysisRealVideoPromptExportPackage = {
    export_id: 'movie-analysis-real-video-prompts-v1',
    export_type: 'movie_analysis_real_video_prompt_export',
    phase: REAL_VIDEO_PROMPT_EXPORT_PHASE,
    consumer_target: 'video_app',
    generated_at: timestamp,
    preparation_report_path: REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH,
    video_runtime_package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    entries: exportEntries,
    safety_summary: {
      planning_only: true,
      generation: false,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
    },
  };

  const report: MovieAnalysisRealVideoPromptExportReport = {
    report_id: 'movie-analysis-real-video-prompt-export-report-v1',
    phase: REAL_VIDEO_PROMPT_EXPORT_PHASE,
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
    real_video_runtime_preparation_report_path: REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH,
    export_path: REAL_VIDEO_PROMPT_EXPORT_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    resolved_video_prompt_present: resolvedVideoPromptPresent,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    video_prompt_export_ready: videoPromptExportReady,
    planning_only_status: planningOnlyStatus,
    export_entries: exportEntries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_VIDEO_PROMPT_EXPORT_PASS_VERDICT
      : REAL_VIDEO_PROMPT_EXPORT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_PROMPT_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, REAL_VIDEO_PROMPT_EXPORT_REPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_PROMPT_EXPORT_PATH),
    `${JSON.stringify(exportPackage, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_PROMPT_EXPORT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_PROMPT_EXPORT_MD_PATH),
    `${buildMarkdown(report, exportPackage)}\n`,
    'utf8'
  );

  return { exportPackage, report };
}
