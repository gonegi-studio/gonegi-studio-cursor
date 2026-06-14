import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_PASS_VERDICT,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisLevel2MasterSimulationCertificationReport,
} from './movieAnalysisLevel2MasterSimulationCertification.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT,
  REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
} from './movieAnalysisRealImagePromptExport.js';
import type { RuntimeTarget } from './movieAnalysisRuntimeBindingFramework.js';
import {
  VIDEO_RUNTIME_PACKAGE_DIR,
  VIDEO_RUNTIME_PACKAGE_PATH,
  type MovieAnalysisVideoRuntimePackage,
  type VideoRuntimeBlock,
  type VideoRuntimePackageEntry,
  type VideoRuntimePackageInner,
} from './movieAnalysisVideoRuntimePackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_VIDEO_RUNTIME_PREPARATION_PHASE =
  'PHASE-LEVEL2D-003-MOVIE_ANALYSIS_REAL_VIDEO_RUNTIME_PREPARATION_V1' as const;
export const REAL_VIDEO_RUNTIME_PREPARATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_VIDEO_RUNTIME_PREPARATION_V1' as const;
export const REAL_VIDEO_RUNTIME_PREPARATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_VIDEO_RUNTIME_PREPARATION_V1' as const;
export const REAL_VIDEO_RUNTIME_PREPARATION_DIR =
  'reports/movie_analysis_real_video_runtime_preparation' as const;
export const REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH =
  'reports/movie_analysis_real_video_runtime_preparation/movie-analysis-real-video-runtime-preparation-report.json' as const;
export const REAL_VIDEO_RUNTIME_PREPARATION_MD_PATH =
  'reports/movie_analysis_real_video_runtime_preparation/MOVIE_ANALYSIS_REAL_VIDEO_RUNTIME_PREPARATION.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type PreparationStatus = 'PASS' | 'FAIL';

export type RealVideoRuntimePreparationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type RealVideoRuntimePreparationEntry = {
  source_id: string;
  resolved_video_prompt: string;
  runtime_mapping_count: number;
  runtime_targets: RuntimeTarget[];
  traceability_preserved: true;
  preparation_ready: true;
  planning_only: true;
  generation: false;
};

export type SourceRealVideoRuntimePreparationAudit = {
  source_id: string;
  video_runtime_entry_present: PreparationStatus;
  runtime_mapping_preserved: PreparationStatus;
  traceability_preserved: PreparationStatus;
  source_preparation_ready: PreparationStatus;
};

export type MovieAnalysisRealVideoRuntimePreparationReport = {
  report_id: string;
  phase: typeof REAL_VIDEO_RUNTIME_PREPARATION_PHASE;
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
  real_image_prompt_export_report_path: typeof REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH;
  level2_master_simulation_certification_report_path: typeof LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH;
  video_runtime_package_dir: typeof VIDEO_RUNTIME_PACKAGE_DIR;
  video_runtime_package_path: typeof VIDEO_RUNTIME_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  video_runtime_ready: PreparationStatus;
  video_app_consumption_ready: PreparationStatus;
  video_generation_simulation_ready: PreparationStatus;
  runtime_mapping_preserved: PreparationStatus;
  traceability_preserved: PreparationStatus;
  runtime_preparation_ready: PreparationStatus;
  planning_only_status: PreparationStatus;
  preparation_entries: RealVideoRuntimePreparationEntry[];
  source_audits: SourceRealVideoRuntimePreparationAudit[];
  final_verdict:
    | typeof REAL_VIDEO_RUNTIME_PREPARATION_PASS_VERDICT
    | typeof REAL_VIDEO_RUNTIME_PREPARATION_FAIL_VERDICT;
  issues: RealVideoRuntimePreparationIssue[];
};

const VIDEO_RUNTIME_TARGETS: RuntimeTarget[] = [
  'scene_prompt',
  'camera_prompt',
  'emotion_prompt',
  'transition_runtime_rule',
  'continuity_runtime_rule',
  'narrative_runtime_rule',
];

const VIDEO_RUNTIME_BLOCKS: (keyof VideoRuntimePackageInner)[] = [
  'scene_runtime',
  'camera_runtime',
  'emotion_runtime',
  'transition_runtime',
  'continuity_runtime',
  'storytelling_runtime',
];

function loadImagePromptExportReport(projectRoot: string): { final_verdict?: string } | null {
  const abs = path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as { final_verdict?: string };
}

function loadMasterSimulationReport(
  projectRoot: string
): MovieAnalysisLevel2MasterSimulationCertificationReport | null {
  const abs = path.join(projectRoot, LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisLevel2MasterSimulationCertificationReport;
}

function loadVideoRuntimePackage(projectRoot: string): MovieAnalysisVideoRuntimePackage | null {
  const abs = path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoRuntimePackage;
}

function runtimeBlockReady(block: VideoRuntimeBlock): boolean {
  return (
    block.binding_id.length > 0 &&
    block.resolved_pattern_signatures.length > 0 &&
    block.consumer_target === 'video_app' &&
    block.runtime_ready === true &&
    block.planning_only === true &&
    block.binding_only === true
  );
}

function videoRuntimePackagePresent(inner: VideoRuntimePackageInner): boolean {
  return VIDEO_RUNTIME_BLOCKS.every((key) => runtimeBlockReady(inner[key]));
}

function buildPreparationEntry(entry: VideoRuntimePackageEntry): RealVideoRuntimePreparationEntry {
  return {
    source_id: entry.source_id,
    resolved_video_prompt: entry.resolved_video_prompt,
    runtime_mapping_count: entry.resolved_runtime_mappings.length,
    runtime_targets: entry.resolved_runtime_mappings.map((mapping) => mapping.runtime_target),
    traceability_preserved: true,
    preparation_ready: true,
    planning_only: true,
    generation: false,
  };
}

function auditSourcePreparation(
  entry: VideoRuntimePackageEntry | undefined,
  sourceId: string
): SourceRealVideoRuntimePreparationAudit {
  if (!entry) {
    return {
      source_id: sourceId,
      video_runtime_entry_present: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      source_preparation_ready: 'FAIL',
    };
  }

  const entryPresent =
    videoRuntimePackagePresent(entry.video_runtime_package) &&
    entry.resolved_video_prompt.startsWith('video_prompt:') &&
    entry.resolved_video_prompt.trim().length > 0 &&
    entry.planning_only === true &&
    entry.generation === false &&
    entry.bridge_only === true
      ? 'PASS'
      : 'FAIL';

  const mappingPreserved =
    entry.resolved_runtime_mappings.length === 6 &&
    entry.resolved_runtime_mappings.every((mapping) => mapping.conflict_free === true) &&
    VIDEO_RUNTIME_TARGETS.every((target) =>
      entry.resolved_runtime_mappings.some((mapping) => mapping.runtime_target === target)
    )
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    entry.traceability.traceability_preserved === true &&
    entry.traceability.cinematic_dna_id.length > 0 &&
    entry.traceability.integration_id.length > 0 &&
    entry.traceability.adapter_library_entry_id.length > 0 &&
    entry.traceability.adapter_ids.length === 6
      ? 'PASS'
      : 'FAIL';

  const checks: PreparationStatus[] = [entryPresent, mappingPreserved, traceabilityPreserved];

  return {
    source_id: sourceId,
    video_runtime_entry_present: entryPresent,
    runtime_mapping_preserved: mappingPreserved,
    traceability_preserved: traceabilityPreserved,
    source_preparation_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealVideoRuntimePreparationAudit[],
  field: keyof Omit<SourceRealVideoRuntimePreparationAudit, 'source_id' | 'source_preparation_ready'>
): PreparationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealVideoRuntimePreparationReport): string {
  const lines = [
    '# Movie Analysis Real Video Runtime Preparation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Preparation Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Preparation Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| video_runtime_ready | ${report.video_runtime_ready} |`,
    `| video_app_consumption_ready | ${report.video_app_consumption_ready} |`,
    `| video_generation_simulation_ready | ${report.video_generation_simulation_ready} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| runtime_preparation_ready | ${report.runtime_preparation_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- video_runtime_entry_present: ${audit.video_runtime_entry_present}`,
      `- runtime_mapping_preserved: ${audit.runtime_mapping_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- source_preparation_ready: ${audit.source_preparation_ready}`,
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
  issues: RealVideoRuntimePreparationIssue[]
): MovieAnalysisRealVideoRuntimePreparationReport {
  const report: MovieAnalysisRealVideoRuntimePreparationReport = {
    report_id: 'movie-analysis-real-video-runtime-preparation-report-v1',
    phase: REAL_VIDEO_RUNTIME_PREPARATION_PHASE,
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
    real_image_prompt_export_report_path: REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
    level2_master_simulation_certification_report_path:
      LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH,
    video_runtime_package_dir: VIDEO_RUNTIME_PACKAGE_DIR,
    video_runtime_package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    video_runtime_ready: 'FAIL',
    video_app_consumption_ready: 'FAIL',
    video_generation_simulation_ready: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    runtime_preparation_ready: 'FAIL',
    planning_only_status: 'FAIL',
    preparation_entries: [],
    source_audits: [],
    final_verdict: REAL_VIDEO_RUNTIME_PREPARATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_RUNTIME_PREPARATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_RUNTIME_PREPARATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealVideoRuntimePreparation(
  projectRoot?: string
): MovieAnalysisRealVideoRuntimePreparationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealVideoRuntimePreparationIssue[] = [];
  const timestamp = new Date().toISOString();

  const imagePromptExportReport = loadImagePromptExportReport(root);
  if (!imagePromptExportReport) {
    issues.push({
      code: 'REAL_IMAGE_PROMPT_EXPORT_REPORT_MISSING',
      message: `Missing ${REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (imagePromptExportReport.final_verdict !== REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2D_002_NOT_PASS',
      message: `Real image prompt export must have ${REAL_IMAGE_PROMPT_EXPORT_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const masterSimulationDir = path.join(root, LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR);
  if (!fs.existsSync(masterSimulationDir)) {
    issues.push({
      code: 'LEVEL2_MASTER_SIMULATION_DIR_MISSING',
      message: `Missing ${LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const masterSimulationReport = loadMasterSimulationReport(root);
  if (!masterSimulationReport) {
    issues.push({
      code: 'LEVEL2_MASTER_SIMULATION_REPORT_MISSING',
      message: `Missing ${LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    masterSimulationReport.final_verdict !== LEVEL2_MASTER_SIMULATION_CERTIFICATION_PASS_VERDICT ||
    masterSimulationReport.certification_status !==
      LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2_SIMULATION_NOT_COMPLETE',
      message: `Level 2 simulation must be ${LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const runtimePackageDir = path.join(root, VIDEO_RUNTIME_PACKAGE_DIR);
  if (!fs.existsSync(runtimePackageDir)) {
    issues.push({
      code: 'VIDEO_RUNTIME_PACKAGE_DIR_MISSING',
      message: `Missing ${VIDEO_RUNTIME_PACKAGE_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const runtimePackage = loadVideoRuntimePackage(root);
  if (!runtimePackage) {
    issues.push({
      code: 'VIDEO_RUNTIME_PACKAGE_MISSING',
      message: `Missing ${VIDEO_RUNTIME_PACKAGE_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const preparationEntries: RealVideoRuntimePreparationEntry[] = [];
  const sourceAudits: SourceRealVideoRuntimePreparationAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const entry = runtimePackage.entries.find((item) => item.source_id === sourceId);
    if (entry) {
      preparationEntries.push(buildPreparationEntry(entry));
    }

    const audit = auditSourcePreparation(entry, sourceId);
    sourceAudits.push(audit);

    if (audit.source_preparation_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_PREPARATION_NOT_READY',
        message: `Real video runtime preparation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
  }

  const packageRuntimeMappingPreserved = aggregateStatus(sourceAudits, 'runtime_mapping_preserved');
  const packageTraceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const videoRuntimeReady: PreparationStatus =
    masterSimulationReport.completion_validation.video_runtime_ready === 'PASS' &&
    runtimePackage.source_count === EXPECTED_SOURCE_COUNT &&
    runtimePackage.adapter_count === EXPECTED_ADAPTER_COUNT &&
    runtimePackage.safety_summary.planning_only === true &&
    runtimePackage.safety_summary.generation === false &&
    preparationEntries.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.video_runtime_entry_present === 'PASS')
      ? 'PASS'
      : 'FAIL';

  const videoAppConsumptionReady: PreparationStatus =
    masterSimulationReport.completion_validation.video_app_consumption_ready === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const videoGenerationSimulationReady: PreparationStatus =
    masterSimulationReport.completion_validation.video_generation_simulation_ready === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const runtimeMappingPreserved: PreparationStatus =
    packageRuntimeMappingPreserved === 'PASS' &&
    masterSimulationReport.runtime_mapping_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved: PreparationStatus =
    packageTraceabilityPreserved === 'PASS' &&
    masterSimulationReport.traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

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
    masterSimulationReport.planning_only === true &&
    masterSimulationReport.planning_only_status === 'PASS' &&
    masterSimulationReport.generation === false &&
    runtimePackage.safety_summary.planning_only === true &&
    runtimePackage.safety_summary.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: PreparationStatus = safetyValid ? 'PASS' : 'FAIL';

  const gateChecks: PreparationStatus[] = [
    videoRuntimeReady,
    videoAppConsumptionReady,
    videoGenerationSimulationReady,
    runtimeMappingPreserved,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_VIDEO_RUNTIME_PREPARATION_VALIDATION_FAIL',
        message: 'Real video runtime preparation validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const runtimePreparationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_preparation_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = runtimePreparationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_VIDEO_RUNTIME_PREPARATION_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'REAL_VIDEO_RUNTIME_PREPARATION_NOT_READY',
      message: 'Real video runtime preparation is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealVideoRuntimePreparationReport = {
    report_id: 'movie-analysis-real-video-runtime-preparation-report-v1',
    phase: REAL_VIDEO_RUNTIME_PREPARATION_PHASE,
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
    real_image_prompt_export_report_path: REAL_IMAGE_PROMPT_EXPORT_REPORT_PATH,
    level2_master_simulation_certification_report_path:
      LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH,
    video_runtime_package_dir: VIDEO_RUNTIME_PACKAGE_DIR,
    video_runtime_package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    video_runtime_ready: videoRuntimeReady,
    video_app_consumption_ready: videoAppConsumptionReady,
    video_generation_simulation_ready: videoGenerationSimulationReady,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    runtime_preparation_ready: runtimePreparationReady,
    planning_only_status: planningOnlyStatus,
    preparation_entries: preparationEntries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_VIDEO_RUNTIME_PREPARATION_PASS_VERDICT
      : REAL_VIDEO_RUNTIME_PREPARATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_RUNTIME_PREPARATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_RUNTIME_PREPARATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_RUNTIME_PREPARATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
