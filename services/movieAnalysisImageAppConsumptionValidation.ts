import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  IMAGE_APP_BRIDGE_PATH,
  type ImageAppBridgeEntry,
  type MovieAnalysisImageAppBridge,
} from './movieAnalysisImageAppBridge.js';
import {
  IMAGE_RUNTIME_PACKAGE_DIR,
  IMAGE_RUNTIME_PACKAGE_PATH,
  type ImageRuntimePackageEntry,
  type MovieAnalysisImageRuntimePackage,
} from './movieAnalysisImageRuntimePackage.js';
import {
  LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT,
  LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
  LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisLevel2RuntimeCertificationReport,
} from './movieAnalysisLevel2RuntimeCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const IMAGE_APP_CONSUMPTION_VALIDATION_PHASE =
  'PHASE-LEVEL2B-001-MOVIE_ANALYSIS_IMAGE_APP_CONSUMPTION_VALIDATION_V1' as const;
export const IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_IMAGE_APP_CONSUMPTION_VALIDATION_V1' as const;
export const IMAGE_APP_CONSUMPTION_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_IMAGE_APP_CONSUMPTION_VALIDATION_V1' as const;
export const IMAGE_APP_CONSUMPTION_VALIDATION_DIR =
  'reports/movie_analysis_image_app_consumption_validation' as const;
export const IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_image_app_consumption_validation/movie-analysis-image-app-consumption-validation-report.json' as const;
export const IMAGE_APP_CONSUMPTION_VALIDATION_MD_PATH =
  'reports/movie_analysis_image_app_consumption_validation/MOVIE_ANALYSIS_IMAGE_APP_CONSUMPTION_VALIDATION.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type ImageAppConsumptionValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceImageAppConsumptionAudit = {
  source_video_id: string;
  image_runtime_package_present: ValidationStatus;
  resolved_image_prompt_present: ValidationStatus;
  runtime_mapping_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  image_app_binding_complete: ValidationStatus;
  source_consumption_ready: ValidationStatus;
};

export type MovieAnalysisImageAppConsumptionValidationReport = {
  report_id: string;
  phase: typeof IMAGE_APP_CONSUMPTION_VALIDATION_PHASE;
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
  level2_runtime_certification_report_path: typeof LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH;
  image_runtime_package_dir: typeof IMAGE_RUNTIME_PACKAGE_DIR;
  image_runtime_package_path: typeof IMAGE_RUNTIME_PACKAGE_PATH;
  image_app_bridge_path: typeof IMAGE_APP_BRIDGE_PATH;
  source_count: number;
  adapter_count: number;
  image_runtime_package_present: ValidationStatus;
  resolved_image_prompt_present: ValidationStatus;
  runtime_mapping_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  image_app_binding_complete: ValidationStatus;
  image_app_consumption_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  source_audits: SourceImageAppConsumptionAudit[];
  final_verdict:
    | typeof IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT
    | typeof IMAGE_APP_CONSUMPTION_VALIDATION_FAIL_VERDICT;
  issues: ImageAppConsumptionValidationIssue[];
};

const IMAGE_PRIMARY_TARGETS = [
  'scene_prompt',
  'camera_prompt',
  'emotion_prompt',
  'transition_runtime_rule',
  'continuity_runtime_rule',
  'narrative_runtime_rule',
] as const;

function loadLevel2Report(
  projectRoot: string
): MovieAnalysisLevel2RuntimeCertificationReport | null {
  const abs = path.join(projectRoot, LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisLevel2RuntimeCertificationReport;
}

function loadImageRuntimePackage(projectRoot: string): MovieAnalysisImageRuntimePackage | null {
  const abs = path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageRuntimePackage;
}

function loadImageBridge(projectRoot: string): MovieAnalysisImageAppBridge | null {
  const abs = path.join(projectRoot, IMAGE_APP_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageAppBridge;
}

function bridgeBindingComplete(
  entry: ImageRuntimePackageEntry,
  bridgeEntry: ImageAppBridgeEntry
): boolean {
  return (
    bridgeEntry.source_video_id === entry.source_video_id &&
    bridgeEntry.cinematic_dna_id === entry.adapter_traceability.cinematic_dna_id &&
    bridgeEntry.integration_id === entry.adapter_traceability.integration_id &&
    bridgeEntry.adapter_library_entry_id ===
      entry.adapter_traceability.adapter_library_entry_id &&
    JSON.stringify(bridgeEntry.adapter_ids) ===
      JSON.stringify(entry.adapter_traceability.adapter_ids) &&
    bridgeEntry.adapter_mapping.consumer_target === 'image_app' &&
    bridgeEntry.adapter_mapping.scene_adapter === true &&
    bridgeEntry.adapter_mapping.camera_adapter === true &&
    bridgeEntry.adapter_mapping.emotion_adapter === true &&
    bridgeEntry.adapter_mapping.transition_adapter === true &&
    bridgeEntry.adapter_mapping.continuity_adapter === true &&
    bridgeEntry.adapter_mapping.storytelling_adapter === true &&
    bridgeEntry.image_app_ready === true &&
    bridgeEntry.bridge_only === true
  );
}

function auditSourceEntry(
  entry: ImageRuntimePackageEntry | undefined,
  bridgeEntry: ImageAppBridgeEntry | undefined,
  sourceVideoId: string
): SourceImageAppConsumptionAudit {
  if (!entry || !bridgeEntry) {
    return {
      source_video_id: sourceVideoId,
      image_runtime_package_present: 'FAIL',
      resolved_image_prompt_present: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      image_app_binding_complete: 'FAIL',
      source_consumption_ready: 'FAIL',
    };
  }

  const packagePresent =
    entry.template_id.length > 0 &&
    entry.assembly_id.length > 0 &&
    entry.image_prompt_ready === true &&
    entry.planning_only === true &&
    entry.generation === false &&
    entry.bridge_only === true
      ? 'PASS'
      : 'FAIL';

  const resolvedPromptPresent =
    entry.final_image_prompt_resolved.trim().length > 0 &&
    entry.final_image_prompt_resolved.startsWith('image_prompt:') &&
    entry.negative_prompt.trim().length > 0
      ? 'PASS'
      : 'FAIL';

  const mappingPreserved =
    entry.resolved_runtime_mappings.length === 6 &&
    entry.resolved_runtime_mappings.every((mapping) => mapping.conflict_free === true) &&
    IMAGE_PRIMARY_TARGETS.every((target) =>
      entry.resolved_runtime_mappings.some((mapping) => mapping.runtime_target === target)
    )
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    entry.adapter_traceability.traceability_preserved === true &&
    entry.adapter_traceability.adapter_ids.length === 6 &&
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
    source_video_id: sourceVideoId,
    image_runtime_package_present: packagePresent,
    resolved_image_prompt_present: resolvedPromptPresent,
    runtime_mapping_preserved: mappingPreserved,
    traceability_preserved: traceabilityPreserved,
    image_app_binding_complete: bindingComplete,
    source_consumption_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceImageAppConsumptionAudit[],
  field: keyof Omit<SourceImageAppConsumptionAudit, 'source_video_id' | 'source_consumption_ready'>
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisImageAppConsumptionValidationReport): string {
  const lines = [
    '# Movie Analysis Image App Consumption Validation',
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
    `| consumer_input | ${report.image_runtime_package_dir} |`,
    '',
    '## Validation Summary',
    '',
    '| Check | Result |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| image_runtime_package_present | ${report.image_runtime_package_present} |`,
    `| resolved_image_prompt_present | ${report.resolved_image_prompt_present} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| image_app_binding_complete | ${report.image_app_binding_complete} |`,
    `| image_app_consumption_ready | ${report.image_app_consumption_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- image_runtime_package_present: ${audit.image_runtime_package_present}`,
      `- resolved_image_prompt_present: ${audit.resolved_image_prompt_present}`,
      `- runtime_mapping_preserved: ${audit.runtime_mapping_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- image_app_binding_complete: ${audit.image_app_binding_complete}`,
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
  issues: ImageAppConsumptionValidationIssue[]
): MovieAnalysisImageAppConsumptionValidationReport {
  const report: MovieAnalysisImageAppConsumptionValidationReport = {
    report_id: 'movie-analysis-image-app-consumption-validation-report-v1',
    phase: IMAGE_APP_CONSUMPTION_VALIDATION_PHASE,
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
    level2_runtime_certification_report_path: LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
    image_runtime_package_dir: IMAGE_RUNTIME_PACKAGE_DIR,
    image_runtime_package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    image_app_bridge_path: IMAGE_APP_BRIDGE_PATH,
    source_count: 0,
    adapter_count: 0,
    image_runtime_package_present: 'FAIL',
    resolved_image_prompt_present: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    image_app_binding_complete: 'FAIL',
    image_app_consumption_ready: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: IMAGE_APP_CONSUMPTION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, IMAGE_APP_CONSUMPTION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMAGE_APP_CONSUMPTION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisImageAppConsumptionValidation(
  projectRoot?: string
): MovieAnalysisImageAppConsumptionValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ImageAppConsumptionValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const level2Report = loadLevel2Report(root);
  if (!level2Report) {
    issues.push({
      code: 'LEVEL2_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    level2Report.final_verdict !== LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT ||
    level2Report.certification_status !== LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2_NOT_COMPLETE',
      message: `Level 2 must be ${LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const runtimePackageDir = path.join(root, IMAGE_RUNTIME_PACKAGE_DIR);
  if (!fs.existsSync(runtimePackageDir)) {
    issues.push({
      code: 'IMAGE_RUNTIME_PACKAGE_DIR_MISSING',
      message: `Missing ${IMAGE_RUNTIME_PACKAGE_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const runtimePackage = loadImageRuntimePackage(root);
  const imageBridge = loadImageBridge(root);

  if (!runtimePackage || !imageBridge) {
    issues.push({
      code: 'CONSUMPTION_INPUT_MISSING',
      message: 'Missing image runtime package or image app bridge',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    runtimePackage.package_type !== 'movie_analysis_image_runtime_package' ||
    runtimePackage.consumer_target !== 'image_app'
  ) {
    issues.push({
      code: 'IMAGE_RUNTIME_PACKAGE_INVALID',
      message: 'Image runtime package is not image_app consumable',
      severity: 'error',
    });
  }

  const sourceAudits: SourceImageAppConsumptionAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const entry = runtimePackage.entries.find(
      (item) => item.source_video_id === sourceVideoId
    );
    const bridgeEntry = imageBridge.entries.find(
      (item) => item.source_video_id === sourceVideoId
    );
    const audit = auditSourceEntry(entry, bridgeEntry, sourceVideoId);
    sourceAudits.push(audit);

    if (audit.source_consumption_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_CONSUMPTION_NOT_READY',
        message: `Image app consumption validation failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const imageRuntimePackagePresent = aggregateStatus(
    sourceAudits,
    'image_runtime_package_present'
  );
  const resolvedImagePromptPresent = aggregateStatus(
    sourceAudits,
    'resolved_image_prompt_present'
  );
  const runtimeMappingPreserved = aggregateStatus(sourceAudits, 'runtime_mapping_preserved');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');
  const imageAppBindingComplete = aggregateStatus(sourceAudits, 'image_app_binding_complete');

  const gateChecks: ValidationStatus[] = [
    imageRuntimePackagePresent,
    resolvedImagePromptPresent,
    runtimeMappingPreserved,
    traceabilityPreserved,
    imageAppBindingComplete,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'CONSUMPTION_VALIDATION_FAIL',
        message: 'Image app consumption validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const safetyValid =
    level2Report.planning_only === true &&
    level2Report.planning_only_status === 'PASS' &&
    level2Report.generation === false &&
    runtimePackage.safety_summary.planning_only === true &&
    runtimePackage.safety_summary.generation === false &&
    imageBridge.safety_summary.planning_only === true &&
    imageBridge.safety_summary.generation === false &&
    level2Report.completion_validation.image_runtime_package_ready === 'PASS';

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

  const imageAppConsumptionReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    runtimePackage.entries.length === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_consumption_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = imageAppConsumptionReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'CONSUMPTION_VALIDATION_FAIL')) {
    issues.push({
      code: 'IMAGE_APP_CONSUMPTION_NOT_READY',
      message: 'Image app consumption is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisImageAppConsumptionValidationReport = {
    report_id: 'movie-analysis-image-app-consumption-validation-report-v1',
    phase: IMAGE_APP_CONSUMPTION_VALIDATION_PHASE,
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
    level2_runtime_certification_report_path: LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH,
    image_runtime_package_dir: IMAGE_RUNTIME_PACKAGE_DIR,
    image_runtime_package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    image_app_bridge_path: IMAGE_APP_BRIDGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_runtime_package_present: imageRuntimePackagePresent,
    resolved_image_prompt_present: resolvedImagePromptPresent,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    image_app_binding_complete: imageAppBindingComplete,
    image_app_consumption_ready: imageAppConsumptionReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT
      : IMAGE_APP_CONSUMPTION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, IMAGE_APP_CONSUMPTION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMAGE_APP_CONSUMPTION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
