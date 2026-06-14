import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  IMAGE_RUNTIME_PACKAGE_PATH,
  type AdapterTraceability,
  type ImageRuntimePackageEntry,
  type MovieAnalysisImageRuntimePackage,
} from './movieAnalysisImageRuntimePackage.js';
import type { ResolvedRuntimeMapping } from './movieAnalysisPromptConflictResolution.js';
import {
  REAL_IMAGE_RUNTIME_PREPARATION_DIR,
  REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT,
  REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH,
  type MovieAnalysisRealImageRuntimePreparationReport,
  type RealImageRuntimePreparationEntry,
} from './movieAnalysisRealImageRuntimePreparation.js';
import type { RuntimeTarget } from './movieAnalysisRuntimeBindingFramework.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_IMAGE_PROMPT_EXPORT_PHASE =
  'PHASE-LEVEL2D-002-MOVIE_ANALYSIS_REAL_IMAGE_PROMPT_EXPORT_V1' as const;
export const REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_IMAGE_PROMPT_EXPORT_V1' as const;
export const REAL_IMAGE_PROMPT_EXPORT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_IMAGE_PROMPT_EXPORT_V1' as const;
export const REAL_IMAGE_PROMPT_EXPORT_DIR = 'exports/movie_analysis_real_image_prompt_export' as const;
export const REAL_IMAGE_PROMPT_EXPORT_PATH =
  'exports/movie_analysis_real_image_prompt_export/movie-analysis-real-image-prompts.json' as const;
export const REAL_IMAGE_PROMPT_EXPORT_REPORT_DIR =
  'reports/movie_analysis_real_image_prompt_export' as const;
export const REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH =
  'reports/movie_analysis_real_image_prompt_export/movie-analysis-real-image-prompt-export-report.json' as const;
export const REAL_IMAGE_PROMPT_EXPORT_MD_PATH =
  'reports/movie_analysis_real_image_prompt_export/MOVIE_ANALYSIS_REAL_IMAGE_PROMPT_EXPORT.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ExportStatus = 'PASS' | 'FAIL';

export type RealImagePromptExportIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type RealImagePromptExportEntry = {
  source_video_id: string;
  template_id: string;
  assembly_id: string;
  resolved_image_prompt: string;
  negative_prompt: string;
  resolved_runtime_mappings: ResolvedRuntimeMapping[];
  adapter_traceability: AdapterTraceability;
  export_ready: true;
  planning_only: true;
  generation: false;
};

export type RealImagePromptExportSafety = {
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisRealImagePromptExportPackage = {
  export_id: string;
  export_type: 'movie_analysis_real_image_prompt_export';
  phase: typeof REAL_IMAGE_PROMPT_EXPORT_PHASE;
  consumer_target: 'image_app';
  generated_at: string;
  preparation_report_path: typeof REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH;
  image_runtime_package_path: typeof IMAGE_RUNTIME_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  entries: RealImagePromptExportEntry[];
  safety_summary: RealImagePromptExportSafety;
};

export type SourceRealImagePromptExportAudit = {
  source_video_id: string;
  resolved_image_prompt_present: ExportStatus;
  negative_prompt_present: ExportStatus;
  runtime_mapping_preserved: ExportStatus;
  traceability_preserved: ExportStatus;
  source_export_ready: ExportStatus;
};

export type MovieAnalysisRealImagePromptExportReport = {
  report_id: string;
  phase: typeof REAL_IMAGE_PROMPT_EXPORT_PHASE;
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
  real_image_runtime_preparation_report_path: typeof REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH;
  export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  source_count: number;
  adapter_count: number;
  resolved_image_prompt_present: ExportStatus;
  negative_prompt_present: ExportStatus;
  runtime_mapping_preserved: ExportStatus;
  traceability_preserved: ExportStatus;
  image_prompt_export_ready: ExportStatus;
  planning_only_status: ExportStatus;
  export_entries: RealImagePromptExportEntry[];
  source_audits: SourceRealImagePromptExportAudit[];
  final_verdict:
    | typeof REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT
    | typeof REAL_IMAGE_PROMPT_EXPORT_FAIL_VERDICT;
  issues: RealImagePromptExportIssue[];
};

const IMAGE_PRIMARY_TARGETS: RuntimeTarget[] = [
  'scene_prompt',
  'camera_prompt',
  'emotion_prompt',
  'transition_runtime_rule',
  'continuity_runtime_rule',
  'narrative_runtime_rule',
];

function loadPreparationReport(
  projectRoot: string
): MovieAnalysisRealImageRuntimePreparationReport | null {
  const abs = path.join(projectRoot, REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealImageRuntimePreparationReport;
}

function loadImageRuntimePackage(projectRoot: string): MovieAnalysisImageRuntimePackage | null {
  const abs = path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageRuntimePackage;
}

function preparationEntryMatches(
  preparationEntry: RealImageRuntimePreparationEntry,
  runtimeEntry: ImageRuntimePackageEntry
): boolean {
  return (
    preparationEntry.source_video_id === runtimeEntry.source_video_id &&
    preparationEntry.resolved_image_prompt === runtimeEntry.final_image_prompt_resolved &&
    preparationEntry.negative_prompt === runtimeEntry.negative_prompt &&
    preparationEntry.preparation_ready === true
  );
}

function buildExportEntry(entry: ImageRuntimePackageEntry): RealImagePromptExportEntry {
  return {
    source_video_id: entry.source_video_id,
    template_id: entry.template_id,
    assembly_id: entry.assembly_id,
    resolved_image_prompt: entry.final_image_prompt_resolved,
    negative_prompt: entry.negative_prompt,
    resolved_runtime_mappings: entry.resolved_runtime_mappings.map((mapping) => ({ ...mapping })),
    adapter_traceability: { ...entry.adapter_traceability },
    export_ready: true,
    planning_only: true,
    generation: false,
  };
}

function auditSourceExport(
  entry: ImageRuntimePackageEntry | undefined,
  preparationEntry: RealImageRuntimePreparationEntry | undefined,
  sourceVideoId: string
): SourceRealImagePromptExportAudit {
  if (!entry || !preparationEntry) {
    return {
      source_video_id: sourceVideoId,
      resolved_image_prompt_present: 'FAIL',
      negative_prompt_present: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      source_export_ready: 'FAIL',
    };
  }

  const resolvedImagePromptPresent =
    entry.final_image_prompt_resolved.trim().length > 0 &&
    entry.final_image_prompt_resolved.startsWith('image_prompt:') &&
    preparationEntry.resolved_image_prompt === entry.final_image_prompt_resolved
      ? 'PASS'
      : 'FAIL';

  const negativePromptPresent =
    entry.negative_prompt.trim().length > 0 &&
    entry.final_image_prompt_resolved.includes('[negative]') &&
    preparationEntry.negative_prompt === entry.negative_prompt
      ? 'PASS'
      : 'FAIL';

  const mappingPreserved =
    entry.resolved_runtime_mappings.length === 6 &&
    entry.resolved_runtime_mappings.every((mapping) => mapping.conflict_free === true) &&
    IMAGE_PRIMARY_TARGETS.every((target) =>
      entry.resolved_runtime_mappings.some((mapping) => mapping.runtime_target === target)
    ) &&
    preparationEntry.runtime_mapping_count === 6
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    entry.adapter_traceability.traceability_preserved === true &&
    entry.adapter_traceability.adapter_ids.length === 6 &&
    preparationEntry.adapter_traceability_preserved === true &&
    preparationEntryMatches(preparationEntry, entry)
      ? 'PASS'
      : 'FAIL';

  const checks: ExportStatus[] = [
    resolvedImagePromptPresent,
    negativePromptPresent,
    mappingPreserved,
    traceabilityPreserved,
  ];

  return {
    source_video_id: sourceVideoId,
    resolved_image_prompt_present: resolvedImagePromptPresent,
    negative_prompt_present: negativePromptPresent,
    runtime_mapping_preserved: mappingPreserved,
    traceability_preserved: traceabilityPreserved,
    source_export_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealImagePromptExportAudit[],
  field: keyof Omit<SourceRealImagePromptExportAudit, 'source_video_id' | 'source_export_ready'>
): ExportStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisRealImagePromptExportReport,
  exportPackage: MovieAnalysisRealImagePromptExportPackage | null
): string {
  const lines = [
    '# Movie Analysis Real Image Prompt Export',
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
    `| resolved_image_prompt_present | ${report.resolved_image_prompt_present} |`,
    `| negative_prompt_present | ${report.negative_prompt_present} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| image_prompt_export_ready | ${report.image_prompt_export_ready} |`,
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
      `### ${audit.source_video_id}`,
      '',
      `- resolved_image_prompt_present: ${audit.resolved_image_prompt_present}`,
      `- negative_prompt_present: ${audit.negative_prompt_present}`,
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
  issues: RealImagePromptExportIssue[]
): MovieAnalysisRealImagePromptExportReport {
  const report: MovieAnalysisRealImagePromptExportReport = {
    report_id: 'movie-analysis-real-image-prompt-export-report-v1',
    phase: REAL_IMAGE_PROMPT_EXPORT_PHASE,
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
    real_image_runtime_preparation_report_path: REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH,
    export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    resolved_image_prompt_present: 'FAIL',
    negative_prompt_present: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    image_prompt_export_ready: 'FAIL',
    planning_only_status: 'FAIL',
    export_entries: [],
    source_audits: [],
    final_verdict: REAL_IMAGE_PROMPT_EXPORT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_PROMPT_EXPORT_REPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_PROMPT_EXPORT_MD_PATH),
    `${buildMarkdown(report, null)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealImagePromptExport(projectRoot?: string): {
  exportPackage: MovieAnalysisRealImagePromptExportPackage;
  report: MovieAnalysisRealImagePromptExportReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealImagePromptExportIssue[] = [];
  const timestamp = new Date().toISOString();

  const preparationDir = path.join(root, REAL_IMAGE_RUNTIME_PREPARATION_DIR);
  if (!fs.existsSync(preparationDir)) {
    issues.push({
      code: 'REAL_IMAGE_RUNTIME_PREPARATION_DIR_MISSING',
      message: `Missing ${REAL_IMAGE_RUNTIME_PREPARATION_DIR}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { exportPackage: null as unknown as MovieAnalysisRealImagePromptExportPackage, report };
  }

  const preparationReport = loadPreparationReport(root);
  if (!preparationReport) {
    issues.push({
      code: 'REAL_IMAGE_RUNTIME_PREPARATION_REPORT_MISSING',
      message: `Missing ${REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { exportPackage: null as unknown as MovieAnalysisRealImagePromptExportPackage, report };
  }

  if (
    preparationReport.final_verdict !== REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT ||
    preparationReport.runtime_preparation_ready !== 'PASS'
  ) {
    issues.push({
      code: 'LEVEL2D_001_NOT_PASS',
      message: `Real image runtime preparation must have ${REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const runtimePackage = loadImageRuntimePackage(root);
  if (!runtimePackage) {
    issues.push({
      code: 'IMAGE_RUNTIME_PACKAGE_MISSING',
      message: `Missing ${IMAGE_RUNTIME_PACKAGE_PATH}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { exportPackage: null as unknown as MovieAnalysisRealImagePromptExportPackage, report };
  }

  const exportEntries: RealImagePromptExportEntry[] = [];
  const sourceAudits: SourceRealImagePromptExportAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const runtimeEntry = runtimePackage.entries.find(
      (item) => item.source_video_id === sourceVideoId
    );
    const preparationEntry = preparationReport.preparation_entries.find(
      (item) => item.source_video_id === sourceVideoId
    );

    if (runtimeEntry && preparationEntry) {
      exportEntries.push(buildExportEntry(runtimeEntry));
    }

    const audit = auditSourceExport(runtimeEntry, preparationEntry, sourceVideoId);
    sourceAudits.push(audit);

    if (audit.source_export_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_EXPORT_NOT_READY',
        message: `Real image prompt export failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const resolvedImagePromptPresent = aggregateStatus(sourceAudits, 'resolved_image_prompt_present');
  const negativePromptPresent = aggregateStatus(sourceAudits, 'negative_prompt_present');
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
    resolvedImagePromptPresent,
    negativePromptPresent,
    runtimeMappingPreserved,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_IMAGE_PROMPT_EXPORT_VALIDATION_FAIL',
        message: 'Real image prompt export validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const imagePromptExportReady =
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

  const pass = imagePromptExportReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_IMAGE_PROMPT_EXPORT_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'REAL_IMAGE_PROMPT_EXPORT_NOT_READY',
      message: 'Real image prompt export is not ready',
      severity: 'error',
    });
  }

  const exportPackage: MovieAnalysisRealImagePromptExportPackage = {
    export_id: 'movie-analysis-real-image-prompts-v1',
    export_type: 'movie_analysis_real_image_prompt_export',
    phase: REAL_IMAGE_PROMPT_EXPORT_PHASE,
    consumer_target: 'image_app',
    generated_at: timestamp,
    preparation_report_path: REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH,
    image_runtime_package_path: IMAGE_RUNTIME_PACKAGE_PATH,
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

  const report: MovieAnalysisRealImagePromptExportReport = {
    report_id: 'movie-analysis-real-image-prompt-export-report-v1',
    phase: REAL_IMAGE_PROMPT_EXPORT_PHASE,
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
    real_image_runtime_preparation_report_path: REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH,
    export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    resolved_image_prompt_present: resolvedImagePromptPresent,
    negative_prompt_present: negativePromptPresent,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    image_prompt_export_ready: imagePromptExportReady,
    planning_only_status: planningOnlyStatus,
    export_entries: exportEntries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT
      : REAL_IMAGE_PROMPT_EXPORT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_PROMPT_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, REAL_IMAGE_PROMPT_EXPORT_REPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_PROMPT_EXPORT_PATH),
    `${JSON.stringify(exportPackage, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_PROMPT_EXPORT_MD_PATH),
    `${buildMarkdown(report, exportPackage)}\n`,
    'utf8'
  );

  return { exportPackage, report };
}
