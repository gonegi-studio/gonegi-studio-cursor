import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
  type MovieAnalysisImageAppConsumptionValidationReport,
} from './movieAnalysisImageAppConsumptionValidation.js';
import {
  VIDEO_APP_BRIDGE_PATH,
  type VideoAppBridgeEntry,
  type MovieAnalysisVideoAppBridge,
} from './movieAnalysisVideoAppBridge.js';
import {
  VIDEO_RUNTIME_PACKAGE_DIR,
  VIDEO_RUNTIME_PACKAGE_PATH,
  type MovieAnalysisVideoRuntimePackage,
  type VideoRuntimeBlock,
  type VideoRuntimePackageEntry,
  type VideoRuntimePackageInner,
} from './movieAnalysisVideoRuntimePackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_APP_CONSUMPTION_VALIDATION_PHASE =
  'PHASE-LEVEL2B-002-MOVIE_ANALYSIS_VIDEO_APP_CONSUMPTION_VALIDATION_V1' as const;
export const VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_VIDEO_APP_CONSUMPTION_VALIDATION_V1' as const;
export const VIDEO_APP_CONSUMPTION_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_VIDEO_APP_CONSUMPTION_VALIDATION_V1' as const;
export const VIDEO_APP_CONSUMPTION_VALIDATION_DIR =
  'reports/movie_analysis_video_app_consumption_validation' as const;
export const VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_video_app_consumption_validation/movie-analysis-video-app-consumption-validation-report.json' as const;
export const VIDEO_APP_CONSUMPTION_VALIDATION_MD_PATH =
  'reports/movie_analysis_video_app_consumption_validation/MOVIE_ANALYSIS_VIDEO_APP_CONSUMPTION_VALIDATION.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type VideoAppConsumptionValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type SourceVideoAppConsumptionAudit = {
  source_id: string;
  video_runtime_package_present: ValidationStatus;
  resolved_video_prompt_present: ValidationStatus;
  runtime_mapping_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  video_app_binding_complete: ValidationStatus;
  source_consumption_ready: ValidationStatus;
};

export type MovieAnalysisVideoAppConsumptionValidationReport = {
  report_id: string;
  phase: typeof VIDEO_APP_CONSUMPTION_VALIDATION_PHASE;
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
  image_app_consumption_validation_report_path: typeof IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH;
  video_runtime_package_dir: typeof VIDEO_RUNTIME_PACKAGE_DIR;
  video_runtime_package_path: typeof VIDEO_RUNTIME_PACKAGE_PATH;
  video_app_bridge_path: typeof VIDEO_APP_BRIDGE_PATH;
  source_count: number;
  adapter_count: number;
  video_runtime_package_present: ValidationStatus;
  resolved_video_prompt_present: ValidationStatus;
  runtime_mapping_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  video_app_binding_complete: ValidationStatus;
  video_app_consumption_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  source_audits: SourceVideoAppConsumptionAudit[];
  final_verdict:
    | typeof VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT
    | typeof VIDEO_APP_CONSUMPTION_VALIDATION_FAIL_VERDICT;
  issues: VideoAppConsumptionValidationIssue[];
};

const VIDEO_RUNTIME_TARGETS = [
  'scene_prompt',
  'camera_prompt',
  'emotion_prompt',
  'transition_runtime_rule',
  'continuity_runtime_rule',
  'narrative_runtime_rule',
] as const;

const VIDEO_RUNTIME_BLOCKS: (keyof VideoRuntimePackageInner)[] = [
  'scene_runtime',
  'camera_runtime',
  'emotion_runtime',
  'transition_runtime',
  'continuity_runtime',
  'storytelling_runtime',
];

function loadImageConsumptionReport(
  projectRoot: string
): MovieAnalysisImageAppConsumptionValidationReport | null {
  const abs = path.join(projectRoot, IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisImageAppConsumptionValidationReport;
}

function loadVideoRuntimePackage(projectRoot: string): MovieAnalysisVideoRuntimePackage | null {
  const abs = path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoRuntimePackage;
}

function loadVideoBridge(projectRoot: string): MovieAnalysisVideoAppBridge | null {
  const abs = path.join(projectRoot, VIDEO_APP_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoAppBridge;
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

function bridgeBindingComplete(
  entry: VideoRuntimePackageEntry,
  bridgeEntry: VideoAppBridgeEntry
): boolean {
  return (
    bridgeEntry.source_video_id === entry.source_id &&
    bridgeEntry.cinematic_dna_id === entry.traceability.cinematic_dna_id &&
    bridgeEntry.integration_id === entry.traceability.integration_id &&
    bridgeEntry.adapter_library_entry_id === entry.traceability.adapter_library_entry_id &&
    JSON.stringify(bridgeEntry.adapter_ids) === JSON.stringify(entry.traceability.adapter_ids) &&
    bridgeEntry.adapter_mapping.consumer_target === 'video_app' &&
    bridgeEntry.adapter_mapping.scene_adapter === true &&
    bridgeEntry.adapter_mapping.camera_adapter === true &&
    bridgeEntry.adapter_mapping.emotion_adapter === true &&
    bridgeEntry.adapter_mapping.transition_adapter === true &&
    bridgeEntry.adapter_mapping.continuity_adapter === true &&
    bridgeEntry.adapter_mapping.storytelling_adapter === true &&
    bridgeEntry.video_app_ready === true &&
    bridgeEntry.bridge_only === true
  );
}

function auditSourceEntry(
  entry: VideoRuntimePackageEntry | undefined,
  bridgeEntry: VideoAppBridgeEntry | undefined,
  sourceId: string
): SourceVideoAppConsumptionAudit {
  if (!entry || !bridgeEntry) {
    return {
      source_id: sourceId,
      video_runtime_package_present: 'FAIL',
      resolved_video_prompt_present: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      video_app_binding_complete: 'FAIL',
      source_consumption_ready: 'FAIL',
    };
  }

  const packagePresent =
    videoRuntimePackagePresent(entry.video_runtime_package) &&
    entry.planning_only === true &&
    entry.generation === false &&
    entry.bridge_only === true
      ? 'PASS'
      : 'FAIL';

  const resolvedPromptPresent =
    entry.resolved_video_prompt.trim().length > 0 &&
    entry.resolved_video_prompt.startsWith('video_prompt:')
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
    entry.traceability.adapter_ids.length === 6 &&
    bridgeBindingComplete(entry, bridgeEntry)
      ? 'PASS'
      : 'FAIL';

  const bindingComplete = bridgeBindingComplete(entry, bridgeEntry) ? 'PASS' : 'FAIL';

  const checks: ValidationStatus[] = [
    packagePresent,
    resolvedPromptPresent,
    mappingPreserved,
    traceabilityPreserved,
    bindingComplete,
  ];

  return {
    source_id: sourceId,
    video_runtime_package_present: packagePresent,
    resolved_video_prompt_present: resolvedPromptPresent,
    runtime_mapping_preserved: mappingPreserved,
    traceability_preserved: traceabilityPreserved,
    video_app_binding_complete: bindingComplete,
    source_consumption_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceVideoAppConsumptionAudit[],
  field: keyof Omit<SourceVideoAppConsumptionAudit, 'source_id' | 'source_consumption_ready'>
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisVideoAppConsumptionValidationReport): string {
  const lines = [
    '# Movie Analysis Video App Consumption Validation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Validation Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| consumer_input | ${report.video_runtime_package_dir} |`,
    '',
    '## Validation Summary',
    '',
    '| Check | Result |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| video_runtime_package_present | ${report.video_runtime_package_present} |`,
    `| resolved_video_prompt_present | ${report.resolved_video_prompt_present} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| video_app_binding_complete | ${report.video_app_binding_complete} |`,
    `| video_app_consumption_ready | ${report.video_app_consumption_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- video_runtime_package_present: ${audit.video_runtime_package_present}`,
      `- resolved_video_prompt_present: ${audit.resolved_video_prompt_present}`,
      `- runtime_mapping_preserved: ${audit.runtime_mapping_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- video_app_binding_complete: ${audit.video_app_binding_complete}`,
      `- source_consumption_ready: ${audit.source_consumption_ready}`,
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
  issues: VideoAppConsumptionValidationIssue[]
): MovieAnalysisVideoAppConsumptionValidationReport {
  const report: MovieAnalysisVideoAppConsumptionValidationReport = {
    report_id: 'movie-analysis-video-app-consumption-validation-report-v1',
    phase: VIDEO_APP_CONSUMPTION_VALIDATION_PHASE,
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
    image_app_consumption_validation_report_path: IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    video_runtime_package_dir: VIDEO_RUNTIME_PACKAGE_DIR,
    video_runtime_package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    video_app_bridge_path: VIDEO_APP_BRIDGE_PATH,
    source_count: 0,
    adapter_count: 0,
    video_runtime_package_present: 'FAIL',
    resolved_video_prompt_present: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    video_app_binding_complete: 'FAIL',
    video_app_consumption_ready: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: VIDEO_APP_CONSUMPTION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, VIDEO_APP_CONSUMPTION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_APP_CONSUMPTION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisVideoAppConsumptionValidation(
  projectRoot?: string
): MovieAnalysisVideoAppConsumptionValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: VideoAppConsumptionValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const imageConsumptionReport = loadImageConsumptionReport(root);
  if (!imageConsumptionReport) {
    issues.push({
      code: 'IMAGE_APP_CONSUMPTION_REPORT_MISSING',
      message: `Missing ${IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (imageConsumptionReport.final_verdict !== IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2B_001_NOT_PASS',
      message: `Image app consumption must have ${IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT}`,
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
  const videoBridge = loadVideoBridge(root);

  if (!runtimePackage || !videoBridge) {
    issues.push({
      code: 'CONSUMPTION_INPUT_MISSING',
      message: 'Missing video runtime package or video app bridge',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    runtimePackage.package_type !== 'movie_analysis_video_runtime_package' ||
    runtimePackage.consumer_target !== 'video_app'
  ) {
    issues.push({
      code: 'VIDEO_RUNTIME_PACKAGE_INVALID',
      message: 'Video runtime package is not video_app consumable',
      severity: 'error',
    });
  }

  const sourceAudits: SourceVideoAppConsumptionAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const entry = runtimePackage.entries.find((item) => item.source_id === sourceId);
    const bridgeEntry = videoBridge.entries.find((item) => item.source_video_id === sourceId);
    const audit = auditSourceEntry(entry, bridgeEntry, sourceId);
    sourceAudits.push(audit);

    if (audit.source_consumption_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_CONSUMPTION_NOT_READY',
        message: `Video app consumption validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
  }

  const videoRuntimePackagePresent = aggregateStatus(
    sourceAudits,
    'video_runtime_package_present'
  );
  const resolvedVideoPromptPresent = aggregateStatus(
    sourceAudits,
    'resolved_video_prompt_present'
  );
  const runtimeMappingPreserved = aggregateStatus(sourceAudits, 'runtime_mapping_preserved');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');
  const videoAppBindingComplete = aggregateStatus(sourceAudits, 'video_app_binding_complete');

  const gateChecks: ValidationStatus[] = [
    videoRuntimePackagePresent,
    resolvedVideoPromptPresent,
    runtimeMappingPreserved,
    traceabilityPreserved,
    videoAppBindingComplete,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'CONSUMPTION_VALIDATION_FAIL',
        message: 'Video app consumption validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const safetyValid =
    imageConsumptionReport.planning_only === true &&
    imageConsumptionReport.planning_only_status === 'PASS' &&
    imageConsumptionReport.generation === false &&
    imageConsumptionReport.image_app_consumption_ready === 'PASS' &&
    runtimePackage.safety_summary.planning_only === true &&
    runtimePackage.safety_summary.generation === false &&
    videoBridge.safety_summary.planning_only === true &&
    videoBridge.safety_summary.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: ValidationStatus = safetyValid ? 'PASS' : 'FAIL';

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

  const videoAppConsumptionReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    runtimePackage.entries.length === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_consumption_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = videoAppConsumptionReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'CONSUMPTION_VALIDATION_FAIL')) {
    issues.push({
      code: 'VIDEO_APP_CONSUMPTION_NOT_READY',
      message: 'Video app consumption is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisVideoAppConsumptionValidationReport = {
    report_id: 'movie-analysis-video-app-consumption-validation-report-v1',
    phase: VIDEO_APP_CONSUMPTION_VALIDATION_PHASE,
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
    image_app_consumption_validation_report_path: IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    video_runtime_package_dir: VIDEO_RUNTIME_PACKAGE_DIR,
    video_runtime_package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    video_app_bridge_path: VIDEO_APP_BRIDGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    video_runtime_package_present: videoRuntimePackagePresent,
    resolved_video_prompt_present: resolvedVideoPromptPresent,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    video_app_binding_complete: videoAppBindingComplete,
    video_app_consumption_ready: videoAppConsumptionReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT
      : VIDEO_APP_CONSUMPTION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, VIDEO_APP_CONSUMPTION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_APP_CONSUMPTION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
