import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  IMAGE_GENERATION_SIMULATION_PASS_VERDICT,
  IMAGE_GENERATION_SIMULATION_REPORT_PATH,
  type MovieAnalysisImageGenerationSimulationReport,
} from './movieAnalysisImageGenerationSimulation.js';
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

export const VIDEO_GENERATION_SIMULATION_PHASE =
  'PHASE-LEVEL2C-002-MOVIE_ANALYSIS_VIDEO_GENERATION_SIMULATION_V1' as const;
export const VIDEO_GENERATION_SIMULATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_VIDEO_GENERATION_SIMULATION_V1' as const;
export const VIDEO_GENERATION_SIMULATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_VIDEO_GENERATION_SIMULATION_V1' as const;
export const VIDEO_GENERATION_SIMULATION_DIR =
  'reports/movie_analysis_video_generation_simulation' as const;
export const VIDEO_GENERATION_SIMULATION_REPORT_PATH =
  'reports/movie_analysis_video_generation_simulation/movie-analysis-video-generation-simulation-report.json' as const;
export const VIDEO_GENERATION_SIMULATION_MD_PATH =
  'reports/movie_analysis_video_generation_simulation/MOVIE_ANALYSIS_VIDEO_GENERATION_SIMULATION.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type SimulationStatus = 'PASS' | 'FAIL';

export type VideoGenerationSimulationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type VideoGenerationSimulationBlock = {
  binding_id: string;
  runtime_target: RuntimeTarget;
  resolved_pattern_signatures: string[];
  resolved_section: string;
  consumer_target: 'video_app';
  simulation_only: true;
  planning_only: true;
  generation: false;
  binding_ready: true;
};

export type VideoGenerationSimulationEntry = {
  source_id: string;
  resolved_video_prompt: string;
  scene_runtime: VideoGenerationSimulationBlock;
  camera_runtime: VideoGenerationSimulationBlock;
  emotion_runtime: VideoGenerationSimulationBlock;
  transition_runtime: VideoGenerationSimulationBlock;
  continuity_runtime: VideoGenerationSimulationBlock;
  storytelling_runtime: VideoGenerationSimulationBlock;
  simulation_ready: true;
  planning_only: true;
  generation: false;
};

export type SourceVideoGenerationSimulationAudit = {
  source_id: string;
  video_prompt_ready: SimulationStatus;
  scene_binding_ready: SimulationStatus;
  camera_binding_ready: SimulationStatus;
  emotion_binding_ready: SimulationStatus;
  transition_binding_ready: SimulationStatus;
  continuity_binding_ready: SimulationStatus;
  storytelling_binding_ready: SimulationStatus;
  runtime_mapping_preserved: SimulationStatus;
  traceability_preserved: SimulationStatus;
  source_simulation_ready: SimulationStatus;
};

export type MovieAnalysisVideoGenerationSimulationReport = {
  report_id: string;
  phase: typeof VIDEO_GENERATION_SIMULATION_PHASE;
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
  simulation_only: true;
  image_generation_simulation_report_path: typeof IMAGE_GENERATION_SIMULATION_REPORT_PATH;
  video_runtime_package_dir: typeof VIDEO_RUNTIME_PACKAGE_DIR;
  video_runtime_package_path: typeof VIDEO_RUNTIME_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  video_prompt_ready: SimulationStatus;
  scene_binding_ready: SimulationStatus;
  camera_binding_ready: SimulationStatus;
  emotion_binding_ready: SimulationStatus;
  transition_binding_ready: SimulationStatus;
  continuity_binding_ready: SimulationStatus;
  storytelling_binding_ready: SimulationStatus;
  runtime_mapping_preserved: SimulationStatus;
  traceability_preserved: SimulationStatus;
  video_generation_simulation_ready: SimulationStatus;
  planning_only_status: SimulationStatus;
  simulation_entries: VideoGenerationSimulationEntry[];
  source_audits: SourceVideoGenerationSimulationAudit[];
  final_verdict:
    | typeof VIDEO_GENERATION_SIMULATION_PASS_VERDICT
    | typeof VIDEO_GENERATION_SIMULATION_FAIL_VERDICT;
  issues: VideoGenerationSimulationIssue[];
};

const SIMULATION_RUNTIME_SPECS: {
  key: keyof VideoRuntimePackageInner;
  audit_field: keyof Pick<
    SourceVideoGenerationSimulationAudit,
    | 'scene_binding_ready'
    | 'camera_binding_ready'
    | 'emotion_binding_ready'
    | 'transition_binding_ready'
    | 'continuity_binding_ready'
    | 'storytelling_binding_ready'
  >;
}[] = [
  { key: 'scene_runtime', audit_field: 'scene_binding_ready' },
  { key: 'camera_runtime', audit_field: 'camera_binding_ready' },
  { key: 'emotion_runtime', audit_field: 'emotion_binding_ready' },
  { key: 'transition_runtime', audit_field: 'transition_binding_ready' },
  { key: 'continuity_runtime', audit_field: 'continuity_binding_ready' },
  { key: 'storytelling_runtime', audit_field: 'storytelling_binding_ready' },
];

const ALL_RUNTIME_TARGETS: RuntimeTarget[] = [
  'scene_prompt',
  'camera_prompt',
  'emotion_prompt',
  'transition_runtime_rule',
  'continuity_runtime_rule',
  'narrative_runtime_rule',
];

function loadImageSimulationReport(
  projectRoot: string
): MovieAnalysisImageGenerationSimulationReport | null {
  const abs = path.join(projectRoot, IMAGE_GENERATION_SIMULATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisImageGenerationSimulationReport;
}

function loadVideoRuntimePackage(projectRoot: string): MovieAnalysisVideoRuntimePackage | null {
  const abs = path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoRuntimePackage;
}

function buildSimulationBlock(block: VideoRuntimeBlock): VideoGenerationSimulationBlock {
  return {
    binding_id: block.binding_id,
    runtime_target: block.runtime_target,
    resolved_pattern_signatures: [...block.resolved_pattern_signatures],
    resolved_section: block.resolved_section ?? '',
    consumer_target: 'video_app',
    simulation_only: true,
    planning_only: true,
    generation: false,
    binding_ready: true,
  };
}

function bindingReady(block: VideoGenerationSimulationBlock): boolean {
  return (
    block.binding_id.length > 0 &&
    block.resolved_pattern_signatures.length > 0 &&
    block.resolved_section.length > 0 &&
    block.consumer_target === 'video_app' &&
    block.simulation_only === true &&
    block.planning_only === true &&
    block.generation === false
  );
}

function buildSimulationEntry(entry: VideoRuntimePackageEntry): VideoGenerationSimulationEntry {
  const simulationEntry = {
    source_id: entry.source_id,
    resolved_video_prompt: entry.resolved_video_prompt,
    simulation_ready: true as const,
    planning_only: true as const,
    generation: false as const,
  } as VideoGenerationSimulationEntry;

  for (const spec of SIMULATION_RUNTIME_SPECS) {
    simulationEntry[spec.key] = buildSimulationBlock(entry.video_runtime_package[spec.key]);
  }

  return simulationEntry;
}

function auditSourceSimulation(
  entry: VideoRuntimePackageEntry | undefined,
  simulationEntry: VideoGenerationSimulationEntry | undefined,
  sourceId: string
): SourceVideoGenerationSimulationAudit {
  if (!entry || !simulationEntry) {
    return {
      source_id: sourceId,
      video_prompt_ready: 'FAIL',
      scene_binding_ready: 'FAIL',
      camera_binding_ready: 'FAIL',
      emotion_binding_ready: 'FAIL',
      transition_binding_ready: 'FAIL',
      continuity_binding_ready: 'FAIL',
      storytelling_binding_ready: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      source_simulation_ready: 'FAIL',
    };
  }

  const videoPromptReady =
    entry.resolved_video_prompt.startsWith('video_prompt:') &&
    entry.planning_only === true &&
    entry.generation === false &&
    simulationEntry.resolved_video_prompt.length > 0
      ? 'PASS'
      : 'FAIL';

  const bindingStatuses = Object.fromEntries(
    SIMULATION_RUNTIME_SPECS.map((spec) => [
      spec.audit_field,
      bindingReady(simulationEntry[spec.key]) ? 'PASS' : 'FAIL',
    ])
  ) as Pick<
    SourceVideoGenerationSimulationAudit,
    | 'scene_binding_ready'
    | 'camera_binding_ready'
    | 'emotion_binding_ready'
    | 'transition_binding_ready'
    | 'continuity_binding_ready'
    | 'storytelling_binding_ready'
  >;

  const runtimeMappingPreserved =
    entry.resolved_runtime_mappings.length === 6 &&
    entry.resolved_runtime_mappings.every((mapping) => mapping.conflict_free === true) &&
    ALL_RUNTIME_TARGETS.every((target) =>
      entry.resolved_runtime_mappings.some((mapping) => mapping.runtime_target === target)
    )
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    entry.traceability.traceability_preserved === true &&
    entry.traceability.adapter_ids.length === 6
      ? 'PASS'
      : 'FAIL';

  const checks: SimulationStatus[] = [
    videoPromptReady,
    ...Object.values(bindingStatuses),
    runtimeMappingPreserved,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    video_prompt_ready: videoPromptReady,
    ...bindingStatuses,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    source_simulation_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceVideoGenerationSimulationAudit[],
  field: keyof Omit<SourceVideoGenerationSimulationAudit, 'source_id' | 'source_simulation_ready'>
): SimulationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisVideoGenerationSimulationReport): string {
  const lines = [
    '# Movie Analysis Video Generation Simulation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Simulation Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| simulation_only | ${report.simulation_only} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Validation Summary',
    '',
    '| Check | Result |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| video_prompt_ready | ${report.video_prompt_ready} |`,
    `| scene_binding_ready | ${report.scene_binding_ready} |`,
    `| camera_binding_ready | ${report.camera_binding_ready} |`,
    `| emotion_binding_ready | ${report.emotion_binding_ready} |`,
    `| transition_binding_ready | ${report.transition_binding_ready} |`,
    `| continuity_binding_ready | ${report.continuity_binding_ready} |`,
    `| storytelling_binding_ready | ${report.storytelling_binding_ready} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| video_generation_simulation_ready | ${report.video_generation_simulation_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- video_prompt_ready: ${audit.video_prompt_ready}`,
      `- scene_binding_ready: ${audit.scene_binding_ready}`,
      `- camera_binding_ready: ${audit.camera_binding_ready}`,
      `- emotion_binding_ready: ${audit.emotion_binding_ready}`,
      `- transition_binding_ready: ${audit.transition_binding_ready}`,
      `- continuity_binding_ready: ${audit.continuity_binding_ready}`,
      `- storytelling_binding_ready: ${audit.storytelling_binding_ready}`,
      `- runtime_mapping_preserved: ${audit.runtime_mapping_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- source_simulation_ready: ${audit.source_simulation_ready}`,
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
  issues: VideoGenerationSimulationIssue[]
): MovieAnalysisVideoGenerationSimulationReport {
  const report: MovieAnalysisVideoGenerationSimulationReport = {
    report_id: 'movie-analysis-video-generation-simulation-report-v1',
    phase: VIDEO_GENERATION_SIMULATION_PHASE,
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
    simulation_only: true,
    image_generation_simulation_report_path: IMAGE_GENERATION_SIMULATION_REPORT_PATH,
    video_runtime_package_dir: VIDEO_RUNTIME_PACKAGE_DIR,
    video_runtime_package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    video_prompt_ready: 'FAIL',
    scene_binding_ready: 'FAIL',
    camera_binding_ready: 'FAIL',
    emotion_binding_ready: 'FAIL',
    transition_binding_ready: 'FAIL',
    continuity_binding_ready: 'FAIL',
    storytelling_binding_ready: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    video_generation_simulation_ready: 'FAIL',
    planning_only_status: 'FAIL',
    simulation_entries: [],
    source_audits: [],
    final_verdict: VIDEO_GENERATION_SIMULATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, VIDEO_GENERATION_SIMULATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_GENERATION_SIMULATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_GENERATION_SIMULATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisVideoGenerationSimulation(
  projectRoot?: string
): MovieAnalysisVideoGenerationSimulationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: VideoGenerationSimulationIssue[] = [];
  const timestamp = new Date().toISOString();

  const imageSimulationReport = loadImageSimulationReport(root);
  if (!imageSimulationReport) {
    issues.push({
      code: 'IMAGE_GENERATION_SIMULATION_REPORT_MISSING',
      message: `Missing ${IMAGE_GENERATION_SIMULATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (imageSimulationReport.final_verdict !== IMAGE_GENERATION_SIMULATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2C_001_NOT_PASS',
      message: `Image generation simulation must have ${IMAGE_GENERATION_SIMULATION_PASS_VERDICT}`,
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

  const simulationEntries: VideoGenerationSimulationEntry[] = [];
  const sourceAudits: SourceVideoGenerationSimulationAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const entry = runtimePackage.entries.find((item) => item.source_id === sourceId);
    const simulationEntry = entry ? buildSimulationEntry(entry) : undefined;
    if (simulationEntry) {
      simulationEntries.push(simulationEntry);
    }

    const audit = auditSourceSimulation(entry, simulationEntry, sourceId);
    sourceAudits.push(audit);

    if (audit.source_simulation_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_SIMULATION_NOT_READY',
        message: `Video generation simulation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
  }

  const videoPromptReady = aggregateStatus(sourceAudits, 'video_prompt_ready');
  const sceneBindingReady = aggregateStatus(sourceAudits, 'scene_binding_ready');
  const cameraBindingReady = aggregateStatus(sourceAudits, 'camera_binding_ready');
  const emotionBindingReady = aggregateStatus(sourceAudits, 'emotion_binding_ready');
  const transitionBindingReady = aggregateStatus(sourceAudits, 'transition_binding_ready');
  const continuityBindingReady = aggregateStatus(sourceAudits, 'continuity_binding_ready');
  const storytellingBindingReady = aggregateStatus(sourceAudits, 'storytelling_binding_ready');
  const runtimeMappingPreserved = aggregateStatus(sourceAudits, 'runtime_mapping_preserved');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const gateChecks: SimulationStatus[] = [
    videoPromptReady,
    sceneBindingReady,
    cameraBindingReady,
    emotionBindingReady,
    transitionBindingReady,
    continuityBindingReady,
    storytellingBindingReady,
    runtimeMappingPreserved,
    traceabilityPreserved,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'SIMULATION_VALIDATION_FAIL',
        message: 'Video generation simulation validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const safetyValid =
    imageSimulationReport.planning_only === true &&
    imageSimulationReport.planning_only_status === 'PASS' &&
    imageSimulationReport.generation === false &&
    imageSimulationReport.image_generation_simulation_ready === 'PASS' &&
    runtimePackage.safety_summary.planning_only === true &&
    runtimePackage.safety_summary.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: SimulationStatus = safetyValid ? 'PASS' : 'FAIL';

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

  const videoGenerationSimulationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    simulationEntries.length === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_simulation_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = videoGenerationSimulationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'SIMULATION_VALIDATION_FAIL')) {
    issues.push({
      code: 'VIDEO_GENERATION_SIMULATION_NOT_READY',
      message: 'Video generation simulation is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisVideoGenerationSimulationReport = {
    report_id: 'movie-analysis-video-generation-simulation-report-v1',
    phase: VIDEO_GENERATION_SIMULATION_PHASE,
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
    simulation_only: true,
    image_generation_simulation_report_path: IMAGE_GENERATION_SIMULATION_REPORT_PATH,
    video_runtime_package_dir: VIDEO_RUNTIME_PACKAGE_DIR,
    video_runtime_package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    video_prompt_ready: videoPromptReady,
    scene_binding_ready: sceneBindingReady,
    camera_binding_ready: cameraBindingReady,
    emotion_binding_ready: emotionBindingReady,
    transition_binding_ready: transitionBindingReady,
    continuity_binding_ready: continuityBindingReady,
    storytelling_binding_ready: storytellingBindingReady,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    video_generation_simulation_ready: videoGenerationSimulationReady,
    planning_only_status: planningOnlyStatus,
    simulation_entries: simulationEntries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? VIDEO_GENERATION_SIMULATION_PASS_VERDICT
      : VIDEO_GENERATION_SIMULATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, VIDEO_GENERATION_SIMULATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_GENERATION_SIMULATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_GENERATION_SIMULATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
