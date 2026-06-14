import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  IMAGE_RUNTIME_PACKAGE_PASS_VERDICT,
  IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
  type MovieAnalysisImageRuntimePackageReport,
} from './movieAnalysisImageRuntimePackage.js';
import {
  PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT,
  PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
  type MovieAnalysisPromptConflictResolutionReport,
  type ResolvedPromptTemplate,
  type ResolvedRuntimeMapping,
} from './movieAnalysisPromptConflictResolution.js';
import {
  RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT,
  RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
  type AdapterRuntimeBinding,
  type MovieAnalysisRuntimeBindingFrameworkReport,
  type RuntimeTarget,
} from './movieAnalysisRuntimeBindingFramework.js';
import {
  VIDEO_APP_BRIDGE_PATH,
  type VideoAppBridgeEntry,
  type MovieAnalysisVideoAppBridge,
} from './movieAnalysisVideoAppBridge.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_RUNTIME_PACKAGE_PHASE =
  'PHASE-LEVEL2-007-MOVIE_ANALYSIS_VIDEO_RUNTIME_PACKAGE_V1' as const;
export const VIDEO_RUNTIME_PACKAGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_VIDEO_RUNTIME_PACKAGE_V1' as const;
export const VIDEO_RUNTIME_PACKAGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_VIDEO_RUNTIME_PACKAGE_V1' as const;
export const VIDEO_RUNTIME_PACKAGE_DIR = 'exports/movie_analysis_video_runtime' as const;
export const VIDEO_RUNTIME_PACKAGE_PATH =
  'exports/movie_analysis_video_runtime/movie-analysis-video-runtime-package.json' as const;
export const VIDEO_RUNTIME_PACKAGE_REPORT_DIR =
  'reports/movie_analysis_video_runtime_package' as const;
export const VIDEO_RUNTIME_PACKAGE_REPORT_PATH =
  'reports/movie_analysis_video_runtime_package/movie-analysis-video-runtime-package-report.json' as const;
export const VIDEO_RUNTIME_PACKAGE_MD_PATH =
  'reports/movie_analysis_video_runtime_package/MOVIE_ANALYSIS_VIDEO_RUNTIME_PACKAGE.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type PackageStatus = 'PASS' | 'FAIL';

export type VideoRuntimePackageIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type AdapterTraceability = {
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  adapter_ids: string[];
  traceability_preserved: true;
};

export type VideoRuntimeBlock = {
  binding_id: string;
  adapter_type: string;
  adapter_id: string;
  analysis_source: string;
  runtime_target: RuntimeTarget;
  resolved_pattern_signatures: string[];
  resolved_section?: string;
  consumer_target: 'video_app';
  planning_only: true;
  binding_only: true;
  runtime_ready: true;
};

export type VideoRuntimePackageInner = {
  scene_runtime: VideoRuntimeBlock;
  camera_runtime: VideoRuntimeBlock;
  emotion_runtime: VideoRuntimeBlock;
  transition_runtime: VideoRuntimeBlock;
  continuity_runtime: VideoRuntimeBlock;
  storytelling_runtime: VideoRuntimeBlock;
};

export type VideoRuntimePackageEntry = {
  source_id: string;
  video_runtime_package: VideoRuntimePackageInner;
  resolved_video_prompt: string;
  traceability: AdapterTraceability;
  resolved_runtime_mappings: ResolvedRuntimeMapping[];
  planning_only: true;
  generation: false;
  bridge_only: true;
};

export type VideoRuntimePackageSafety = {
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisVideoRuntimePackage = {
  package_id: string;
  package_type: 'movie_analysis_video_runtime_package';
  phase: typeof VIDEO_RUNTIME_PACKAGE_PHASE;
  consumer_target: 'video_app';
  generated_at: string;
  runtime_binding_report_path: typeof RUNTIME_BINDING_FRAMEWORK_REPORT_PATH;
  conflict_resolution_report_path: typeof PROMPT_CONFLICT_RESOLUTION_REPORT_PATH;
  image_runtime_package_report_path: typeof IMAGE_RUNTIME_PACKAGE_REPORT_PATH;
  video_app_bridge_path: typeof VIDEO_APP_BRIDGE_PATH;
  source_count: number;
  adapter_count: number;
  entries: VideoRuntimePackageEntry[];
  safety_summary: VideoRuntimePackageSafety;
};

export type SourceVideoRuntimePackageAudit = {
  source_id: string;
  scene_runtime_present: PackageStatus;
  camera_runtime_present: PackageStatus;
  emotion_runtime_present: PackageStatus;
  transition_runtime_present: PackageStatus;
  continuity_runtime_present: PackageStatus;
  storytelling_runtime_present: PackageStatus;
  resolved_video_prompt_present: PackageStatus;
  adapter_traceability_preserved: PackageStatus;
  runtime_mapping_preserved: PackageStatus;
  source_package_ready: PackageStatus;
};

export type MovieAnalysisVideoRuntimePackageReport = {
  report_id: string;
  phase: typeof VIDEO_RUNTIME_PACKAGE_PHASE;
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
  package_path: typeof VIDEO_RUNTIME_PACKAGE_PATH;
  runtime_binding_report_path: typeof RUNTIME_BINDING_FRAMEWORK_REPORT_PATH;
  conflict_resolution_report_path: typeof PROMPT_CONFLICT_RESOLUTION_REPORT_PATH;
  image_runtime_package_report_path: typeof IMAGE_RUNTIME_PACKAGE_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  scene_runtime_present: PackageStatus;
  camera_runtime_present: PackageStatus;
  emotion_runtime_present: PackageStatus;
  transition_runtime_present: PackageStatus;
  continuity_runtime_present: PackageStatus;
  storytelling_runtime_present: PackageStatus;
  resolved_video_prompt_present: PackageStatus;
  runtime_mapping_preserved: PackageStatus;
  adapter_traceability_preserved: PackageStatus;
  video_runtime_package_ready: PackageStatus;
  planning_only_status: PackageStatus;
  source_audits: SourceVideoRuntimePackageAudit[];
  final_verdict:
    | typeof VIDEO_RUNTIME_PACKAGE_PASS_VERDICT
    | typeof VIDEO_RUNTIME_PACKAGE_FAIL_VERDICT;
  issues: VideoRuntimePackageIssue[];
};

const VIDEO_RUNTIME_TARGETS: RuntimeTarget[] = [
  'scene_prompt',
  'camera_prompt',
  'emotion_prompt',
  'transition_runtime_rule',
  'continuity_runtime_rule',
  'narrative_runtime_rule',
];

const RUNTIME_KEY_BY_TARGET: Record<RuntimeTarget, keyof VideoRuntimePackageInner> = {
  scene_prompt: 'scene_runtime',
  camera_prompt: 'camera_runtime',
  emotion_prompt: 'emotion_runtime',
  transition_runtime_rule: 'transition_runtime',
  continuity_runtime_rule: 'continuity_runtime',
  narrative_runtime_rule: 'storytelling_runtime',
};

const PACKAGE_SAFETY: VideoRuntimePackageSafety = {
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

function loadBindingReport(
  projectRoot: string
): MovieAnalysisRuntimeBindingFrameworkReport | null {
  const abs = path.join(projectRoot, RUNTIME_BINDING_FRAMEWORK_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRuntimeBindingFrameworkReport;
}

function loadImageRuntimeReport(
  projectRoot: string
): MovieAnalysisImageRuntimePackageReport | null {
  const abs = path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisImageRuntimePackageReport;
}

function loadVideoBridge(projectRoot: string): MovieAnalysisVideoAppBridge | null {
  const abs = path.join(projectRoot, VIDEO_APP_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoAppBridge;
}

function buildTraceability(
  bridgeEntry: VideoAppBridgeEntry,
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

function buildRuntimeBlock(
  binding: AdapterRuntimeBinding,
  mapping: ResolvedRuntimeMapping | undefined,
  resolvedSection?: string
): VideoRuntimeBlock {
  return {
    binding_id: binding.binding_id,
    adapter_type: binding.adapter_type,
    adapter_id: binding.adapter_id,
    analysis_source: binding.analysis_source,
    runtime_target: binding.runtime_target,
    resolved_pattern_signatures: mapping?.resolved_pattern_signatures ?? [],
    resolved_section: resolvedSection,
    consumer_target: 'video_app',
    planning_only: true,
    binding_only: true,
    runtime_ready: true,
  };
}

function runtimeBlockPresent(block: VideoRuntimeBlock): PackageStatus {
  return block.binding_id.length > 0 &&
    block.resolved_pattern_signatures.length > 0 &&
    block.consumer_target === 'video_app'
    ? 'PASS'
    : 'FAIL';
}

function buildVideoRuntimePackage(
  bindings: AdapterRuntimeBinding[],
  mappings: ResolvedRuntimeMapping[],
  resolved: ResolvedPromptTemplate
): VideoRuntimePackageInner {
  const inner = {} as VideoRuntimePackageInner;

  for (const target of VIDEO_RUNTIME_TARGETS) {
    const binding = bindings.find((entry) => entry.runtime_target === target);
    const mapping = mappings.find((entry) => entry.runtime_target === target);
    const key = RUNTIME_KEY_BY_TARGET[target];

    if (!binding) {
      inner[key] = {
        binding_id: '',
        adapter_type: '',
        adapter_id: '',
        analysis_source: '',
        runtime_target: target,
        resolved_pattern_signatures: [],
        consumer_target: 'video_app',
        planning_only: true,
        binding_only: true,
        runtime_ready: true,
      };
      continue;
    }

    let resolvedSection: string | undefined;
    if (target === 'scene_prompt') {
      resolvedSection = resolved.resolved_sections.scene;
    } else if (target === 'camera_prompt') {
      resolvedSection = resolved.resolved_sections.camera;
    } else if (target === 'emotion_prompt') {
      resolvedSection = resolved.resolved_sections.emotion;
    } else if (target === 'transition_runtime_rule' || target === 'narrative_runtime_rule') {
      resolvedSection = resolved.resolved_sections.style;
    } else if (target === 'continuity_runtime_rule') {
      resolvedSection = resolved.resolved_sections.continuity;
    }

    inner[key] = buildRuntimeBlock(binding, mapping, resolvedSection);
  }

  return inner;
}

function auditSourceEntry(
  resolved: ResolvedPromptTemplate | undefined,
  mappings: ResolvedRuntimeMapping[],
  bindings: AdapterRuntimeBinding[],
  bridgeEntry: VideoAppBridgeEntry | undefined,
  sourceId: string
): SourceVideoRuntimePackageAudit {
  if (!resolved || !bridgeEntry) {
    return {
      source_id: sourceId,
      scene_runtime_present: 'FAIL',
      camera_runtime_present: 'FAIL',
      emotion_runtime_present: 'FAIL',
      transition_runtime_present: 'FAIL',
      continuity_runtime_present: 'FAIL',
      storytelling_runtime_present: 'FAIL',
      resolved_video_prompt_present: 'FAIL',
      adapter_traceability_preserved: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      source_package_ready: 'FAIL',
    };
  }

  const videoRuntimePackage = buildVideoRuntimePackage(bindings, mappings, resolved);

  const resolvedVideoPromptPresent =
    resolved.final_video_prompt_resolved.trim().length > 0 &&
    resolved.final_video_prompt_resolved.startsWith('video_prompt:')
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
    VIDEO_RUNTIME_TARGETS.every((target) =>
      mappings.some((mapping) => mapping.runtime_target === target)
    )
      ? 'PASS'
      : 'FAIL';

  const sceneRuntimePresent = runtimeBlockPresent(videoRuntimePackage.scene_runtime);
  const cameraRuntimePresent = runtimeBlockPresent(videoRuntimePackage.camera_runtime);
  const emotionRuntimePresent = runtimeBlockPresent(videoRuntimePackage.emotion_runtime);
  const transitionRuntimePresent = runtimeBlockPresent(videoRuntimePackage.transition_runtime);
  const continuityRuntimePresent = runtimeBlockPresent(videoRuntimePackage.continuity_runtime);
  const storytellingRuntimePresent = runtimeBlockPresent(
    videoRuntimePackage.storytelling_runtime
  );

  const checks: PackageStatus[] = [
    sceneRuntimePresent,
    cameraRuntimePresent,
    emotionRuntimePresent,
    transitionRuntimePresent,
    continuityRuntimePresent,
    storytellingRuntimePresent,
    resolvedVideoPromptPresent,
    traceabilityPreserved,
    mappingPreserved,
  ];

  return {
    source_id: sourceId,
    scene_runtime_present: sceneRuntimePresent,
    camera_runtime_present: cameraRuntimePresent,
    emotion_runtime_present: emotionRuntimePresent,
    transition_runtime_present: transitionRuntimePresent,
    continuity_runtime_present: continuityRuntimePresent,
    storytelling_runtime_present: storytellingRuntimePresent,
    resolved_video_prompt_present: resolvedVideoPromptPresent,
    adapter_traceability_preserved: traceabilityPreserved,
    runtime_mapping_preserved: mappingPreserved,
    source_package_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceVideoRuntimePackageAudit[],
  field: keyof Omit<SourceVideoRuntimePackageAudit, 'source_id' | 'source_package_ready'>
): PackageStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisVideoRuntimePackageReport,
  runtimePackage: MovieAnalysisVideoRuntimePackage
): string {
  const lines = [
    '# Movie Analysis Video Runtime Package',
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
    `| scene_runtime_present | ${report.scene_runtime_present} |`,
    `| camera_runtime_present | ${report.camera_runtime_present} |`,
    `| emotion_runtime_present | ${report.emotion_runtime_present} |`,
    `| transition_runtime_present | ${report.transition_runtime_present} |`,
    `| continuity_runtime_present | ${report.continuity_runtime_present} |`,
    `| storytelling_runtime_present | ${report.storytelling_runtime_present} |`,
    `| resolved_video_prompt_present | ${report.resolved_video_prompt_present} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| adapter_traceability_preserved | ${report.adapter_traceability_preserved} |`,
    `| video_runtime_package_ready | ${report.video_runtime_package_ready} |`,
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
      `### ${audit.source_id}`,
      '',
      `- scene_runtime_present: ${audit.scene_runtime_present}`,
      `- camera_runtime_present: ${audit.camera_runtime_present}`,
      `- emotion_runtime_present: ${audit.emotion_runtime_present}`,
      `- transition_runtime_present: ${audit.transition_runtime_present}`,
      `- continuity_runtime_present: ${audit.continuity_runtime_present}`,
      `- storytelling_runtime_present: ${audit.storytelling_runtime_present}`,
      `- resolved_video_prompt_present: ${audit.resolved_video_prompt_present}`,
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
  issues: VideoRuntimePackageIssue[]
): MovieAnalysisVideoRuntimePackageReport {
  const report: MovieAnalysisVideoRuntimePackageReport = {
    report_id: 'movie-analysis-video-runtime-package-report-v1',
    phase: VIDEO_RUNTIME_PACKAGE_PHASE,
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
    package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    runtime_binding_report_path: RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
    conflict_resolution_report_path: PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
    image_runtime_package_report_path: IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    scene_runtime_present: 'FAIL',
    camera_runtime_present: 'FAIL',
    emotion_runtime_present: 'FAIL',
    transition_runtime_present: 'FAIL',
    continuity_runtime_present: 'FAIL',
    storytelling_runtime_present: 'FAIL',
    resolved_video_prompt_present: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    video_runtime_package_ready: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: VIDEO_RUNTIME_PACKAGE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, VIDEO_RUNTIME_PACKAGE_REPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_RUNTIME_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_RUNTIME_PACKAGE_MD_PATH),
    `${buildMarkdown(report, null as unknown as MovieAnalysisVideoRuntimePackage)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisVideoRuntimePackage(
  projectRoot?: string
): {
  runtimePackage: MovieAnalysisVideoRuntimePackage;
  report: MovieAnalysisVideoRuntimePackageReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const issues: VideoRuntimePackageIssue[] = [];
  const timestamp = new Date().toISOString();

  const bindingReport = loadBindingReport(root);
  if (!bindingReport) {
    issues.push({
      code: 'RUNTIME_BINDING_REPORT_MISSING',
      message: `Missing ${RUNTIME_BINDING_FRAMEWORK_REPORT_PATH}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { runtimePackage: null as unknown as MovieAnalysisVideoRuntimePackage, report };
  }

  if (bindingReport.final_verdict !== RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT) {
    issues.push({
      code: 'RUNTIME_BINDING_NOT_PASS',
      message: `Runtime binding must have ${RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const conflictReport = loadConflictResolutionReport(root);
  if (!conflictReport) {
    issues.push({
      code: 'CONFLICT_RESOLUTION_REPORT_MISSING',
      message: `Missing ${PROMPT_CONFLICT_RESOLUTION_REPORT_PATH}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { runtimePackage: null as unknown as MovieAnalysisVideoRuntimePackage, report };
  }

  if (conflictReport.final_verdict !== PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT) {
    issues.push({
      code: 'CONFLICT_RESOLUTION_NOT_PASS',
      message: `Conflict resolution must have ${PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const imageRuntimeReport = loadImageRuntimeReport(root);
  if (!imageRuntimeReport) {
    issues.push({
      code: 'IMAGE_RUNTIME_PACKAGE_REPORT_MISSING',
      message: `Missing ${IMAGE_RUNTIME_PACKAGE_REPORT_PATH}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { runtimePackage: null as unknown as MovieAnalysisVideoRuntimePackage, report };
  }

  if (imageRuntimeReport.final_verdict !== IMAGE_RUNTIME_PACKAGE_PASS_VERDICT) {
    issues.push({
      code: 'IMAGE_RUNTIME_PACKAGE_NOT_PASS',
      message: `Image runtime package must have ${IMAGE_RUNTIME_PACKAGE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const videoBridge = loadVideoBridge(root);
  if (!videoBridge) {
    issues.push({
      code: 'VIDEO_APP_BRIDGE_MISSING',
      message: `Missing ${VIDEO_APP_BRIDGE_PATH}`,
      severity: 'error',
    });
    const report = writeFailReport(root, timestamp, issues);
    return { runtimePackage: null as unknown as MovieAnalysisVideoRuntimePackage, report };
  }

  const entries: VideoRuntimePackageEntry[] = [];
  const sourceAudits: SourceVideoRuntimePackageAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const resolved = conflictReport.resolved_prompt_templates.find(
      (entry) => entry.source_video_id === sourceId
    );
    const mappings = conflictReport.resolved_runtime_mappings.filter(
      (entry) => entry.source_video_id === sourceId
    );
    const bindings = bindingReport.adapter_runtime_bindings.filter(
      (entry) => entry.source_video_id === sourceId
    );
    const bridgeEntry = videoBridge.entries.find((entry) => entry.source_video_id === sourceId);

    const audit = auditSourceEntry(resolved, mappings, bindings, bridgeEntry, sourceId);
    sourceAudits.push(audit);

    if (audit.source_package_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_PACKAGE_NOT_READY',
        message: `Video runtime package failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
      continue;
    }

    if (!resolved || !bridgeEntry) {
      continue;
    }

    entries.push({
      source_id: sourceId,
      video_runtime_package: buildVideoRuntimePackage(bindings, mappings, resolved),
      resolved_video_prompt: resolved.final_video_prompt_resolved,
      traceability: buildTraceability(bridgeEntry, bindings),
      resolved_runtime_mappings: mappings,
      planning_only: true,
      generation: false,
      bridge_only: true,
    });
  }

  const sceneRuntimePresent = aggregateStatus(sourceAudits, 'scene_runtime_present');
  const cameraRuntimePresent = aggregateStatus(sourceAudits, 'camera_runtime_present');
  const emotionRuntimePresent = aggregateStatus(sourceAudits, 'emotion_runtime_present');
  const transitionRuntimePresent = aggregateStatus(sourceAudits, 'transition_runtime_present');
  const continuityRuntimePresent = aggregateStatus(sourceAudits, 'continuity_runtime_present');
  const storytellingRuntimePresent = aggregateStatus(
    sourceAudits,
    'storytelling_runtime_present'
  );
  const resolvedVideoPromptPresent = aggregateStatus(
    sourceAudits,
    'resolved_video_prompt_present'
  );
  const adapterTraceabilityPreserved = aggregateStatus(
    sourceAudits,
    'adapter_traceability_preserved'
  );
  const runtimeMappingPreserved = aggregateStatus(sourceAudits, 'runtime_mapping_preserved');

  const gateChecks: PackageStatus[] = [
    sceneRuntimePresent,
    cameraRuntimePresent,
    emotionRuntimePresent,
    transitionRuntimePresent,
    continuityRuntimePresent,
    storytellingRuntimePresent,
    resolvedVideoPromptPresent,
    adapterTraceabilityPreserved,
    runtimeMappingPreserved,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'PACKAGE_VALIDATION_FAIL',
        message: 'Video runtime package validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const safetyValid =
    conflictReport.planning_only === true &&
    conflictReport.planning_only_status === 'PASS' &&
    conflictReport.generation === false &&
    bindingReport.planning_only === true &&
    bindingReport.planning_only_status === 'PASS' &&
    imageRuntimeReport.planning_only === true &&
    imageRuntimeReport.planning_only_status === 'PASS' &&
    videoBridge.safety_summary.planning_only === true &&
    videoBridge.safety_summary.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: PackageStatus = safetyValid ? 'PASS' : 'FAIL';

  const runtimePackage: MovieAnalysisVideoRuntimePackage = {
    package_id: 'movie-analysis-video-runtime-package-v1',
    package_type: 'movie_analysis_video_runtime_package',
    phase: VIDEO_RUNTIME_PACKAGE_PHASE,
    consumer_target: 'video_app',
    generated_at: timestamp,
    runtime_binding_report_path: RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
    conflict_resolution_report_path: PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
    image_runtime_package_report_path: IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
    video_app_bridge_path: VIDEO_APP_BRIDGE_PATH,
    source_count: entries.length,
    adapter_count: entries.reduce(
      (sum, entry) => sum + entry.traceability.adapter_ids.length,
      0
    ),
    entries,
    safety_summary: PACKAGE_SAFETY,
  };

  const videoRuntimePackageReady =
    bindingReport.source_count === EXPECTED_SOURCE_COUNT &&
    bindingReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    conflictReport.source_count === EXPECTED_SOURCE_COUNT &&
    conflictReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    imageRuntimeReport.source_count === EXPECTED_SOURCE_COUNT &&
    imageRuntimeReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    entries.length === EXPECTED_SOURCE_COUNT &&
    runtimePackage.adapter_count === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_package_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const packageReady: PackageStatus = videoRuntimePackageReady;
  const pass = packageReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'PACKAGE_VALIDATION_FAIL')) {
    issues.push({
      code: 'VIDEO_RUNTIME_PACKAGE_NOT_READY',
      message: 'Video runtime package is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisVideoRuntimePackageReport = {
    report_id: 'movie-analysis-video-runtime-package-report-v1',
    phase: VIDEO_RUNTIME_PACKAGE_PHASE,
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
    package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    runtime_binding_report_path: RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
    conflict_resolution_report_path: PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
    image_runtime_package_report_path: IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
    source_count: runtimePackage.source_count,
    adapter_count: runtimePackage.adapter_count,
    scene_runtime_present: sceneRuntimePresent,
    camera_runtime_present: cameraRuntimePresent,
    emotion_runtime_present: emotionRuntimePresent,
    transition_runtime_present: transitionRuntimePresent,
    continuity_runtime_present: continuityRuntimePresent,
    storytelling_runtime_present: storytellingRuntimePresent,
    resolved_video_prompt_present: resolvedVideoPromptPresent,
    runtime_mapping_preserved: runtimeMappingPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    video_runtime_package_ready: packageReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass ? VIDEO_RUNTIME_PACKAGE_PASS_VERDICT : VIDEO_RUNTIME_PACKAGE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, VIDEO_RUNTIME_PACKAGE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_RUNTIME_PACKAGE_PATH),
    `${JSON.stringify(runtimePackage, null, 2)}\n`,
    'utf8'
  );

  fs.mkdirSync(path.join(root, VIDEO_RUNTIME_PACKAGE_REPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_RUNTIME_PACKAGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_RUNTIME_PACKAGE_MD_PATH),
    `${buildMarkdown(report, runtimePackage)}\n`,
    'utf8'
  );

  return { runtimePackage, report };
}
