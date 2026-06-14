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
  PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT,
  PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
  type MovieAnalysisPromptConflictResolutionReport,
  type ResolvedPromptTemplate,
  type ResolvedRuntimeMapping,
} from './movieAnalysisPromptConflictResolution.js';
import {
  RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
  type AdapterRuntimeBinding,
  type MovieAnalysisRuntimeBindingFrameworkReport,
  type RuntimeTarget,
} from './movieAnalysisRuntimeBindingFramework.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const IMAGE_RUNTIME_PACKAGE_PHASE =
  'PHASE-LEVEL2-006-MOVIE_ANALYSIS_IMAGE_RUNTIME_PACKAGE_V1' as const;
export const IMAGE_RUNTIME_PACKAGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_IMAGE_RUNTIME_PACKAGE_V1' as const;
export const IMAGE_RUNTIME_PACKAGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_IMAGE_RUNTIME_PACKAGE_V1' as const;
export const IMAGE_RUNTIME_PACKAGE_DIR = 'exports/movie_analysis_image_runtime' as const;
export const IMAGE_RUNTIME_PACKAGE_PATH =
  'exports/movie_analysis_image_runtime/movie-analysis-image-runtime-package.json' as const;
export const IMAGE_RUNTIME_PACKAGE_REPORT_DIR =
  'reports/movie_analysis_image_runtime_package' as const;
export const IMAGE_RUNTIME_PACKAGE_REPORT_PATH =
  'reports/movie_analysis_image_runtime_package/movie-analysis-image-runtime-package-report.json' as const;
export const IMAGE_RUNTIME_PACKAGE_MD_PATH =
  'reports/movie_analysis_image_runtime_package/MOVIE_ANALYSIS_IMAGE_RUNTIME_PACKAGE.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type PackageStatus = 'PASS' | 'FAIL';

export type ImageRuntimePackageIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type AdapterTraceability = {
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  adapter_ids: string[];
  traceability_preserved: true;
};

export type ImageRuntimePackageEntry = {
  source_video_id: string;
  template_id: string;
  assembly_id: string;
  final_image_prompt_resolved: string;
  negative_prompt: string;
  resolved_runtime_mappings: ResolvedRuntimeMapping[];
  adapter_traceability: AdapterTraceability;
  image_prompt_ready: true;
  planning_only: true;
  generation: false;
  bridge_only: true;
};

export type ImageRuntimePackageSafety = {
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisImageRuntimePackage = {
  package_id: string;
  package_type: 'movie_analysis_image_runtime_package';
  phase: typeof IMAGE_RUNTIME_PACKAGE_PHASE;
  consumer_target: 'image_app';
  generated_at: string;
  conflict_resolution_report_path: typeof PROMPT_CONFLICT_RESOLUTION_REPORT_PATH;
  image_app_bridge_path: typeof IMAGE_APP_BRIDGE_PATH;
  runtime_binding_report_path: typeof RUNTIME_BINDING_FRAMEWORK_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  entries: ImageRuntimePackageEntry[];
  safety_summary: ImageRuntimePackageSafety;
};

export type SourceImageRuntimePackageAudit = {
  source_video_id: string;
  resolved_prompt_present: PackageStatus;
  image_prompt_ready: PackageStatus;
  negative_prompt_ready: PackageStatus;
  adapter_traceability_preserved: PackageStatus;
  runtime_mapping_preserved: PackageStatus;
  source_package_ready: PackageStatus;
};

export type MovieAnalysisImageRuntimePackageReport = {
  report_id: string;
  phase: typeof IMAGE_RUNTIME_PACKAGE_PHASE;
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
  package_path: typeof IMAGE_RUNTIME_PACKAGE_PATH;
  conflict_resolution_report_path: typeof PROMPT_CONFLICT_RESOLUTION_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  resolved_prompt_present: PackageStatus;
  image_prompt_ready: PackageStatus;
  negative_prompt_ready: PackageStatus;
  adapter_traceability_preserved: PackageStatus;
  runtime_mapping_preserved: PackageStatus;
  image_runtime_package_ready: PackageStatus;
  planning_only_status: PackageStatus;
  source_audits: SourceImageRuntimePackageAudit[];
  final_verdict:
    | typeof IMAGE_RUNTIME_PACKAGE_PASS_VERDICT
    | typeof IMAGE_RUNTIME_PACKAGE_FAIL_VERDICT;
  issues: ImageRuntimePackageIssue[];
};

const IMAGE_PRIMARY_TARGETS: RuntimeTarget[] = [
  'scene_prompt',
  'camera_prompt',
  'emotion_prompt',
];

const PACKAGE_SAFETY: ImageRuntimePackageSafety = {
  planning_only: true,
  generation: false,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

function loadConflictResolutionReport(
  projectRoot: string
): MovieAnalysisPromptConflictResolutionReport | null {
  const abs = path.join(projectRoot, PROMPT_CONFLICT_RESOLUTION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisPromptConflictResolutionReport;
}

function loadImageBridge(projectRoot: string): MovieAnalysisImageAppBridge | null {
  const abs = path.join(projectRoot, IMAGE_APP_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageAppBridge;
}

function loadBindingReport(
  projectRoot: string
): MovieAnalysisRuntimeBindingFrameworkReport | null {
  const abs = path.join(projectRoot, RUNTIME_BINDING_FRAMEWORK_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRuntimeBindingFrameworkReport;
}

function buildTraceability(
  bridgeEntry: ImageAppBridgeEntry,
  bindings: AdapterRuntimeBinding[]
): AdapterTraceability {
  return {
    cinematic_dna_id: bridgeEntry.cinematic_dna_id,
    integration_id: bridgeEntry.integration_id,
    adapter_library_entry_id: bridgeEntry.adapter_library_entry_id,
    adapter_ids: [...bridgeEntry.adapter_ids],
    traceability_preserved: true,
  };
}

function auditSourceEntry(
  resolved: ResolvedPromptTemplate | undefined,
  mappings: ResolvedRuntimeMapping[],
  bindings: AdapterRuntimeBinding[],
  bridgeEntry: ImageAppBridgeEntry | undefined,
  sourceVideoId: string
): SourceImageRuntimePackageAudit {
  if (!resolved || !bridgeEntry) {
    return {
      source_video_id: sourceVideoId,
      resolved_prompt_present: 'FAIL',
      image_prompt_ready: 'FAIL',
      negative_prompt_ready: 'FAIL',
      adapter_traceability_preserved: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      source_package_ready: 'FAIL',
    };
  }

  const resolvedPresent =
    resolved.final_image_prompt_resolved.trim().length > 0 ? 'PASS' : 'FAIL';

  const imagePromptReady =
    resolved.final_image_prompt_resolved.startsWith('image_prompt:') &&
    resolved.resolved_sections.scene.length > 0 &&
    resolved.resolved_sections.camera.length > 0 &&
    resolved.resolved_sections.emotion.length > 0
      ? 'PASS'
      : 'FAIL';

  const negativeReady =
    resolved.resolved_sections.negative.trim().length > 0 &&
    resolved.final_image_prompt_resolved.includes('[negative]')
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    bridgeEntry.cinematic_dna_id.length > 0 &&
    bridgeEntry.integration_id.length > 0 &&
    bridgeEntry.adapter_library_entry_id.length > 0 &&
    bridgeEntry.adapter_ids.length === 6 &&
    bindings.length === 6 &&
    bindings.every((binding) => binding.traceability_preserved === true) &&
    bindings.every(
      (binding) =>
        binding.cinematic_dna_id === bridgeEntry.cinematic_dna_id &&
        binding.integration_id === bridgeEntry.integration_id &&
        binding.adapter_library_entry_id === bridgeEntry.adapter_library_entry_id
    )
      ? 'PASS'
      : 'FAIL';

  const mappingPreserved =
    mappings.length === 6 &&
    mappings.every((mapping) => mapping.conflict_free === true) &&
    IMAGE_PRIMARY_TARGETS.every((target) =>
      mappings.some((mapping) => mapping.runtime_target === target)
    )
      ? 'PASS'
      : 'FAIL';

  const checks: PackageStatus[] = [
    resolvedPresent,
    imagePromptReady,
    negativeReady,
    traceabilityPreserved,
    mappingPreserved,
  ];

  return {
    source_video_id: sourceVideoId,
    resolved_prompt_present: resolvedPresent,
    image_prompt_ready: imagePromptReady,
    negative_prompt_ready: negativeReady,
    adapter_traceability_preserved: traceabilityPreserved,
    runtime_mapping_preserved: mappingPreserved,
    source_package_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceImageRuntimePackageAudit[],
  field: keyof Omit<SourceImageRuntimePackageAudit, 'source_video_id' | 'source_package_ready'>
): PackageStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisImageRuntimePackageReport,
  runtimePackage: MovieAnalysisImageRuntimePackage
): string {
  const lines = [
    '# Movie Analysis Image Runtime Package',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Package Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| consumer_target | ${runtimePackage.consumer_target} |`,
    '',
    '## Validation Summary',
    '',
    '| Check | Result |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| resolved_prompt_present | ${report.resolved_prompt_present} |`,
    `| image_prompt_ready | ${report.image_prompt_ready} |`,
    `| negative_prompt_ready | ${report.negative_prompt_ready} |`,
    `| adapter_traceability_preserved | ${report.adapter_traceability_preserved} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| image_runtime_package_ready | ${report.image_runtime_package_ready} |`,
    '',
    '## Package',
    '',
    `- package_path: ${report.package_path}`,
    `- entries: ${runtimePackage.entries.length}`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- resolved_prompt_present: ${audit.resolved_prompt_present}`,
      `- image_prompt_ready: ${audit.image_prompt_ready}`,
      `- negative_prompt_ready: ${audit.negative_prompt_ready}`,
      `- adapter_traceability_preserved: ${audit.adapter_traceability_preserved}`,
      `- runtime_mapping_preserved: ${audit.runtime_mapping_preserved}`,
      `- source_package_ready: ${audit.source_package_ready}`,
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
  issues: ImageRuntimePackageIssue[]
): MovieAnalysisImageRuntimePackageReport {
  const report: MovieAnalysisImageRuntimePackageReport = {
    report_id: 'movie-analysis-image-runtime-package-report-v1',
    phase: IMAGE_RUNTIME_PACKAGE_PHASE,
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
    package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    conflict_resolution_report_path: PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    resolved_prompt_present: 'FAIL',
    image_prompt_ready: 'FAIL',
    negative_prompt_ready: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    image_runtime_package_ready: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: IMAGE_RUNTIME_PACKAGE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, IMAGE_RUNTIME_PACKAGE_REPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, IMAGE_RUNTIME_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMAGE_RUNTIME_PACKAGE_MD_PATH),
    `${buildMarkdown(report, null as unknown as MovieAnalysisImageRuntimePackage)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisImageRuntimePackage(
  projectRoot?: string
): {
  runtimePackage: MovieAnalysisImageRuntimePackage;
  report: MovieAnalysisImageRuntimePackageReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const issues: ImageRuntimePackageIssue[] = [];
  const timestamp = new Date().toISOString();

  const conflictReport = loadConflictResolutionReport(root);
  if (!conflictReport) {
    issues.push({
      code: 'CONFLICT_RESOLUTION_REPORT_MISSING',
      message: `Missing ${PROMPT_CONFLICT_RESOLUTION_REPORT_PATH}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { runtimePackage: null as unknown as MovieAnalysisImageRuntimePackage, report };
  }

  if (conflictReport.final_verdict !== PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT) {
    issues.push({
      code: 'CONFLICT_RESOLUTION_NOT_PASS',
      message: `Conflict resolution must have ${PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const imageBridge = loadImageBridge(root);
  const bindingReport = loadBindingReport(root);

  if (!imageBridge || !bindingReport) {
    issues.push({
      code: 'UPSTREAM_ASSET_MISSING',
      message: 'Missing image app bridge or runtime binding report',
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { runtimePackage: null as unknown as MovieAnalysisImageRuntimePackage, report };
  }

  const entries: ImageRuntimePackageEntry[] = [];
  const sourceAudits: SourceImageRuntimePackageAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const resolved = conflictReport.resolved_prompt_templates.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const mappings = conflictReport.resolved_runtime_mappings.filter(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const bindings = bindingReport.adapter_runtime_bindings.filter(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const bridgeEntry = imageBridge.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );

    const audit = auditSourceEntry(resolved, mappings, bindings, bridgeEntry, sourceVideoId);
    sourceAudits.push(audit);

    if (audit.source_package_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_PACKAGE_NOT_READY',
        message: `Image runtime package failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      continue;
    }

    if (!resolved || !bridgeEntry) {
      continue;
    }

    entries.push({
      source_video_id: sourceVideoId,
      template_id: resolved.template_id,
      assembly_id: resolved.assembly_id,
      final_image_prompt_resolved: resolved.final_image_prompt_resolved,
      negative_prompt: resolved.resolved_sections.negative,
      resolved_runtime_mappings: mappings,
      adapter_traceability: buildTraceability(bridgeEntry, bindings),
      image_prompt_ready: true,
      planning_only: true,
      generation: false,
      bridge_only: true,
    });
  }

  const resolvedPromptPresent = aggregateStatus(sourceAudits, 'resolved_prompt_present');
  const imagePromptReady = aggregateStatus(sourceAudits, 'image_prompt_ready');
  const negativePromptReady = aggregateStatus(sourceAudits, 'negative_prompt_ready');
  const adapterTraceabilityPreserved = aggregateStatus(
    sourceAudits,
    'adapter_traceability_preserved'
  );
  const runtimeMappingPreserved = aggregateStatus(sourceAudits, 'runtime_mapping_preserved');

  const gateChecks: PackageStatus[] = [
    resolvedPromptPresent,
    imagePromptReady,
    negativePromptReady,
    adapterTraceabilityPreserved,
    runtimeMappingPreserved,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'PACKAGE_VALIDATION_FAIL',
        message: 'Image runtime package validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const safetyValid =
    conflictReport.planning_only === true &&
    conflictReport.planning_only_status === 'PASS' &&
    conflictReport.generation === false &&
    imageBridge.safety_summary.planning_only === true &&
    imageBridge.safety_summary.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: PackageStatus = safetyValid ? 'PASS' : 'FAIL';

  const runtimePackage: MovieAnalysisImageRuntimePackage = {
    package_id: 'movie-analysis-image-runtime-package-v1',
    package_type: 'movie_analysis_image_runtime_package',
    phase: IMAGE_RUNTIME_PACKAGE_PHASE,
    consumer_target: 'image_app',
    generated_at: timestamp,
    conflict_resolution_report_path: PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
    image_app_bridge_path: IMAGE_APP_BRIDGE_PATH,
    runtime_binding_report_path: RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
    source_count: entries.length,
    adapter_count: entries.reduce(
      (sum, entry) => sum + entry.adapter_traceability.adapter_ids.length,
      0
    ),
    entries,
    safety_summary: PACKAGE_SAFETY,
  };

  const imageRuntimePackageReady =
    conflictReport.source_count === EXPECTED_SOURCE_COUNT &&
    conflictReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    entries.length === EXPECTED_SOURCE_COUNT &&
    runtimePackage.adapter_count === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_package_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const packageReady: PackageStatus = imageRuntimePackageReady;
  const pass = packageReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'PACKAGE_VALIDATION_FAIL')) {
    issues.push({
      code: 'IMAGE_RUNTIME_PACKAGE_NOT_READY',
      message: 'Image runtime package is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisImageRuntimePackageReport = {
    report_id: 'movie-analysis-image-runtime-package-report-v1',
    phase: IMAGE_RUNTIME_PACKAGE_PHASE,
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
    package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    conflict_resolution_report_path: PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
    source_count: runtimePackage.source_count,
    adapter_count: runtimePackage.adapter_count,
    resolved_prompt_present: resolvedPromptPresent,
    image_prompt_ready: imagePromptReady,
    negative_prompt_ready: negativePromptReady,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    runtime_mapping_preserved: runtimeMappingPreserved,
    image_runtime_package_ready: packageReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass ? IMAGE_RUNTIME_PACKAGE_PASS_VERDICT : IMAGE_RUNTIME_PACKAGE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, IMAGE_RUNTIME_PACKAGE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, IMAGE_RUNTIME_PACKAGE_PATH),
    `${JSON.stringify(runtimePackage, null, 2)}\n`,
    'utf8'
  );

  fs.mkdirSync(path.join(root, IMAGE_RUNTIME_PACKAGE_REPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, IMAGE_RUNTIME_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMAGE_RUNTIME_PACKAGE_MD_PATH),
    `${buildMarkdown(report, runtimePackage)}\n`,
    'utf8'
  );

  return { runtimePackage, report };
}
