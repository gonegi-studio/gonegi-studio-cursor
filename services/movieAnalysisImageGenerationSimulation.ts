import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  IMAGE_RUNTIME_PACKAGE_DIR,
  IMAGE_RUNTIME_PACKAGE_PATH,
  type ImageRuntimePackageEntry,
  type MovieAnalysisImageRuntimePackage,
} from './movieAnalysisImageRuntimePackage.js';
import type { ResolvedRuntimeMapping } from './movieAnalysisPromptConflictResolution.js';
import {
  LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT,
  LEVEL1_MASTER_CERTIFICATION_REPORT_PATH,
  LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisLevel1MasterCertificationReport,
} from './movieAnalysisLevel1MasterCertification.js';
import {
  LEVEL2_MASTER_CERTIFICATION_DIR,
  LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
  LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisLevel2MasterCertificationReport,
} from './movieAnalysisLevel2MasterCertification.js';
import type { RuntimeTarget } from './movieAnalysisRuntimeBindingFramework.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const IMAGE_GENERATION_SIMULATION_PHASE =
  'PHASE-LEVEL2C-001-MOVIE_ANALYSIS_IMAGE_GENERATION_SIMULATION_V1' as const;
export const IMAGE_GENERATION_SIMULATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_IMAGE_GENERATION_SIMULATION_V1' as const;
export const IMAGE_GENERATION_SIMULATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_IMAGE_GENERATION_SIMULATION_V1' as const;
export const IMAGE_GENERATION_SIMULATION_DIR =
  'reports/movie_analysis_image_generation_simulation' as const;
export const IMAGE_GENERATION_SIMULATION_REPORT_PATH =
  'reports/movie_analysis_image_generation_simulation/movie-analysis-image-generation-simulation-report.json' as const;
export const IMAGE_GENERATION_SIMULATION_MD_PATH =
  'reports/movie_analysis_image_generation_simulation/MOVIE_ANALYSIS_IMAGE_GENERATION_SIMULATION.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type SimulationStatus = 'PASS' | 'FAIL';

export type ImageGenerationSimulationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type ImageGenerationSimulationBlock = {
  binding_id: string;
  runtime_target: RuntimeTarget;
  resolved_pattern_signatures: string[];
  simulated_section: string;
  consumer_target: 'image_app';
  simulation_only: true;
  planning_only: true;
  generation: false;
  binding_ready: true;
};

export type ImageGenerationSimulationEntry = {
  source_video_id: string;
  resolved_image_prompt: string;
  scene_runtime: ImageGenerationSimulationBlock;
  camera_runtime: ImageGenerationSimulationBlock;
  emotion_runtime: ImageGenerationSimulationBlock;
  continuity_runtime: ImageGenerationSimulationBlock;
  storytelling_runtime: ImageGenerationSimulationBlock;
  simulation_ready: true;
  planning_only: true;
  generation: false;
};

export type SourceImageGenerationSimulationAudit = {
  source_video_id: string;
  image_prompt_ready: SimulationStatus;
  scene_binding_ready: SimulationStatus;
  camera_binding_ready: SimulationStatus;
  emotion_binding_ready: SimulationStatus;
  continuity_binding_ready: SimulationStatus;
  storytelling_binding_ready: SimulationStatus;
  runtime_mapping_preserved: SimulationStatus;
  traceability_preserved: SimulationStatus;
  source_simulation_ready: SimulationStatus;
};

export type MovieAnalysisImageGenerationSimulationReport = {
  report_id: string;
  phase: typeof IMAGE_GENERATION_SIMULATION_PHASE;
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
  level1_master_certification_report_path: typeof LEVEL1_MASTER_CERTIFICATION_REPORT_PATH;
  level2_master_certification_report_path: typeof LEVEL2_MASTER_CERTIFICATION_REPORT_PATH;
  image_runtime_package_dir: typeof IMAGE_RUNTIME_PACKAGE_DIR;
  image_runtime_package_path: typeof IMAGE_RUNTIME_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  image_prompt_ready: SimulationStatus;
  scene_binding_ready: SimulationStatus;
  camera_binding_ready: SimulationStatus;
  emotion_binding_ready: SimulationStatus;
  continuity_binding_ready: SimulationStatus;
  storytelling_binding_ready: SimulationStatus;
  runtime_mapping_preserved: SimulationStatus;
  traceability_preserved: SimulationStatus;
  image_generation_simulation_ready: SimulationStatus;
  planning_only_status: SimulationStatus;
  simulation_entries: ImageGenerationSimulationEntry[];
  source_audits: SourceImageGenerationSimulationAudit[];
  final_verdict:
    | typeof IMAGE_GENERATION_SIMULATION_PASS_VERDICT
    | typeof IMAGE_GENERATION_SIMULATION_FAIL_VERDICT;
  issues: ImageGenerationSimulationIssue[];
};

const SIMULATION_RUNTIME_TARGETS: {
  key: keyof Omit<
    ImageGenerationSimulationEntry,
    'source_video_id' | 'resolved_image_prompt' | 'simulation_ready' | 'planning_only' | 'generation'
  >;
  runtime_target: RuntimeTarget;
  prompt_section: string;
  audit_field: keyof Pick<
    SourceImageGenerationSimulationAudit,
    | 'scene_binding_ready'
    | 'camera_binding_ready'
    | 'emotion_binding_ready'
    | 'continuity_binding_ready'
    | 'storytelling_binding_ready'
  >;
}[] = [
  {
    key: 'scene_runtime',
    runtime_target: 'scene_prompt',
    prompt_section: 'scene',
    audit_field: 'scene_binding_ready',
  },
  {
    key: 'camera_runtime',
    runtime_target: 'camera_prompt',
    prompt_section: 'camera',
    audit_field: 'camera_binding_ready',
  },
  {
    key: 'emotion_runtime',
    runtime_target: 'emotion_prompt',
    prompt_section: 'emotion',
    audit_field: 'emotion_binding_ready',
  },
  {
    key: 'continuity_runtime',
    runtime_target: 'continuity_runtime_rule',
    prompt_section: 'continuity',
    audit_field: 'continuity_binding_ready',
  },
  {
    key: 'storytelling_runtime',
    runtime_target: 'narrative_runtime_rule',
    prompt_section: 'style',
    audit_field: 'storytelling_binding_ready',
  },
];

const ALL_RUNTIME_TARGETS: RuntimeTarget[] = [
  'scene_prompt',
  'camera_prompt',
  'emotion_prompt',
  'transition_runtime_rule',
  'continuity_runtime_rule',
  'narrative_runtime_rule',
];

function loadLevel1MasterReport(
  projectRoot: string
): MovieAnalysisLevel1MasterCertificationReport | null {
  const abs = path.join(projectRoot, LEVEL1_MASTER_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisLevel1MasterCertificationReport;
}

function loadLevel2MasterReport(
  projectRoot: string
): MovieAnalysisLevel2MasterCertificationReport | null {
  const abs = path.join(projectRoot, LEVEL2_MASTER_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisLevel2MasterCertificationReport;
}

function loadImageRuntimePackage(projectRoot: string): MovieAnalysisImageRuntimePackage | null {
  const abs = path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageRuntimePackage;
}

function extractPromptSection(prompt: string, section: string): string {
  const regex = new RegExp(`\\[${section}\\]\\s*([^\\[]+)`, 'i');
  const match = prompt.match(regex);
  return match?.[1]?.trim() ?? '';
}

function buildSimulationBlock(
  mapping: ResolvedRuntimeMapping | undefined,
  prompt: string,
  promptSection: string,
  runtimeTarget: RuntimeTarget
): ImageGenerationSimulationBlock {
  const simulatedSection = extractPromptSection(prompt, promptSection);

  return {
    binding_id: mapping?.binding_id ?? '',
    runtime_target: runtimeTarget,
    resolved_pattern_signatures: mapping?.resolved_pattern_signatures ?? [],
    simulated_section: simulatedSection,
    consumer_target: 'image_app',
    simulation_only: true,
    planning_only: true,
    generation: false,
    binding_ready: true,
  };
}

function bindingReady(block: ImageGenerationSimulationBlock): boolean {
  return (
    block.binding_id.length > 0 &&
    block.resolved_pattern_signatures.length > 0 &&
    block.simulated_section.length > 0 &&
    block.consumer_target === 'image_app' &&
    block.simulation_only === true &&
    block.planning_only === true &&
    block.generation === false
  );
}

function buildSimulationEntry(entry: ImageRuntimePackageEntry): ImageGenerationSimulationEntry {
  const prompt = entry.final_image_prompt_resolved;
  const simulationEntry = {
    source_video_id: entry.source_video_id,
    resolved_image_prompt: prompt,
    simulation_ready: true as const,
    planning_only: true as const,
    generation: false as const,
  } as ImageGenerationSimulationEntry;

  for (const spec of SIMULATION_RUNTIME_TARGETS) {
    const mapping = entry.resolved_runtime_mappings.find(
      (item) => item.runtime_target === spec.runtime_target
    );
    simulationEntry[spec.key] = buildSimulationBlock(
      mapping,
      prompt,
      spec.prompt_section,
      spec.runtime_target
    );
  }

  return simulationEntry;
}

function auditSourceSimulation(
  entry: ImageRuntimePackageEntry | undefined,
  simulationEntry: ImageGenerationSimulationEntry | undefined,
  sourceVideoId: string
): SourceImageGenerationSimulationAudit {
  if (!entry || !simulationEntry) {
    return {
      source_video_id: sourceVideoId,
      image_prompt_ready: 'FAIL',
      scene_binding_ready: 'FAIL',
      camera_binding_ready: 'FAIL',
      emotion_binding_ready: 'FAIL',
      continuity_binding_ready: 'FAIL',
      storytelling_binding_ready: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      source_simulation_ready: 'FAIL',
    };
  }

  const imagePromptReady =
    entry.final_image_prompt_resolved.startsWith('image_prompt:') &&
    entry.image_prompt_ready === true &&
    simulationEntry.resolved_image_prompt.length > 0
      ? 'PASS'
      : 'FAIL';

  const bindingStatuses = Object.fromEntries(
    SIMULATION_RUNTIME_TARGETS.map((spec) => [
      spec.audit_field,
      bindingReady(simulationEntry[spec.key]) ? 'PASS' : 'FAIL',
    ])
  ) as Pick<
    SourceImageGenerationSimulationAudit,
    | 'scene_binding_ready'
    | 'camera_binding_ready'
    | 'emotion_binding_ready'
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
    entry.adapter_traceability.traceability_preserved === true &&
    entry.adapter_traceability.adapter_ids.length === 6
      ? 'PASS'
      : 'FAIL';

  const checks: SimulationStatus[] = [
    imagePromptReady,
    ...Object.values(bindingStatuses),
    runtimeMappingPreserved,
    traceabilityPreserved,
  ];

  return {
    source_video_id: sourceVideoId,
    image_prompt_ready: imagePromptReady,
    ...bindingStatuses,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    source_simulation_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceImageGenerationSimulationAudit[],
  field: keyof Omit<SourceImageGenerationSimulationAudit, 'source_video_id' | 'source_simulation_ready'>
): SimulationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisImageGenerationSimulationReport
): string {
  const lines = [
    '# Movie Analysis Image Generation Simulation',
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
    `| image_prompt_ready | ${report.image_prompt_ready} |`,
    `| scene_binding_ready | ${report.scene_binding_ready} |`,
    `| camera_binding_ready | ${report.camera_binding_ready} |`,
    `| emotion_binding_ready | ${report.emotion_binding_ready} |`,
    `| continuity_binding_ready | ${report.continuity_binding_ready} |`,
    `| storytelling_binding_ready | ${report.storytelling_binding_ready} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| image_generation_simulation_ready | ${report.image_generation_simulation_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- image_prompt_ready: ${audit.image_prompt_ready}`,
      `- scene_binding_ready: ${audit.scene_binding_ready}`,
      `- camera_binding_ready: ${audit.camera_binding_ready}`,
      `- emotion_binding_ready: ${audit.emotion_binding_ready}`,
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
  issues: ImageGenerationSimulationIssue[]
): MovieAnalysisImageGenerationSimulationReport {
  const report: MovieAnalysisImageGenerationSimulationReport = {
    report_id: 'movie-analysis-image-generation-simulation-report-v1',
    phase: IMAGE_GENERATION_SIMULATION_PHASE,
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
    level1_master_certification_report_path: LEVEL1_MASTER_CERTIFICATION_REPORT_PATH,
    level2_master_certification_report_path: LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
    image_runtime_package_dir: IMAGE_RUNTIME_PACKAGE_DIR,
    image_runtime_package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    image_prompt_ready: 'FAIL',
    scene_binding_ready: 'FAIL',
    camera_binding_ready: 'FAIL',
    emotion_binding_ready: 'FAIL',
    continuity_binding_ready: 'FAIL',
    storytelling_binding_ready: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    image_generation_simulation_ready: 'FAIL',
    planning_only_status: 'FAIL',
    simulation_entries: [],
    source_audits: [],
    final_verdict: IMAGE_GENERATION_SIMULATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, IMAGE_GENERATION_SIMULATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, IMAGE_GENERATION_SIMULATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMAGE_GENERATION_SIMULATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisImageGenerationSimulation(
  projectRoot?: string
): MovieAnalysisImageGenerationSimulationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ImageGenerationSimulationIssue[] = [];
  const timestamp = new Date().toISOString();

  const level1Report = loadLevel1MasterReport(root);
  if (!level1Report) {
    issues.push({
      code: 'LEVEL1_MASTER_REPORT_MISSING',
      message: `Missing ${LEVEL1_MASTER_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    level1Report.final_verdict !== LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT ||
    level1Report.certification_status !== LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL1_NOT_COMPLETE',
      message: `Level 1 must be ${LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const level2MasterDir = path.join(root, LEVEL2_MASTER_CERTIFICATION_DIR);
  if (!fs.existsSync(level2MasterDir)) {
    issues.push({
      code: 'LEVEL2_MASTER_DIR_MISSING',
      message: `Missing ${LEVEL2_MASTER_CERTIFICATION_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const level2Report = loadLevel2MasterReport(root);
  if (!level2Report) {
    issues.push({
      code: 'LEVEL2_MASTER_REPORT_MISSING',
      message: `Missing ${LEVEL2_MASTER_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    level2Report.final_verdict !== LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT ||
    level2Report.certification_status !== LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2_NOT_COMPLETE',
      message: `Level 2 must be ${LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE}`,
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
  if (!runtimePackage) {
    issues.push({
      code: 'IMAGE_RUNTIME_PACKAGE_MISSING',
      message: `Missing ${IMAGE_RUNTIME_PACKAGE_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const simulationEntries: ImageGenerationSimulationEntry[] = [];
  const sourceAudits: SourceImageGenerationSimulationAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const entry = runtimePackage.entries.find((item) => item.source_video_id === sourceVideoId);
    const simulationEntry = entry ? buildSimulationEntry(entry) : undefined;
    if (simulationEntry) {
      simulationEntries.push(simulationEntry);
    }

    const audit = auditSourceSimulation(entry, simulationEntry, sourceVideoId);
    sourceAudits.push(audit);

    if (audit.source_simulation_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_SIMULATION_NOT_READY',
        message: `Image generation simulation failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const imagePromptReady = aggregateStatus(sourceAudits, 'image_prompt_ready');
  const sceneBindingReady = aggregateStatus(sourceAudits, 'scene_binding_ready');
  const cameraBindingReady = aggregateStatus(sourceAudits, 'camera_binding_ready');
  const emotionBindingReady = aggregateStatus(sourceAudits, 'emotion_binding_ready');
  const continuityBindingReady = aggregateStatus(sourceAudits, 'continuity_binding_ready');
  const storytellingBindingReady = aggregateStatus(sourceAudits, 'storytelling_binding_ready');
  const runtimeMappingPreserved = aggregateStatus(sourceAudits, 'runtime_mapping_preserved');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const gateChecks: SimulationStatus[] = [
    imagePromptReady,
    sceneBindingReady,
    cameraBindingReady,
    emotionBindingReady,
    continuityBindingReady,
    storytellingBindingReady,
    runtimeMappingPreserved,
    traceabilityPreserved,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'SIMULATION_VALIDATION_FAIL',
        message: 'Image generation simulation validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const safetyValid =
    level1Report.planning_only === true &&
    level1Report.planning_only_status === 'PASS' &&
    level1Report.generation === false &&
    level2Report.planning_only === true &&
    level2Report.planning_only_status === 'PASS' &&
    level2Report.generation === false &&
    runtimePackage.safety_summary.planning_only === true &&
    runtimePackage.safety_summary.generation === false &&
    level2Report.completion_validation.image_runtime_ready === 'PASS' &&
    level2Report.completion_validation.image_app_consumption_ready === 'PASS';

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

  const imageGenerationSimulationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    simulationEntries.length === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_simulation_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = imageGenerationSimulationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'SIMULATION_VALIDATION_FAIL')) {
    issues.push({
      code: 'IMAGE_GENERATION_SIMULATION_NOT_READY',
      message: 'Image generation simulation is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisImageGenerationSimulationReport = {
    report_id: 'movie-analysis-image-generation-simulation-report-v1',
    phase: IMAGE_GENERATION_SIMULATION_PHASE,
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
    level1_master_certification_report_path: LEVEL1_MASTER_CERTIFICATION_REPORT_PATH,
    level2_master_certification_report_path: LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
    image_runtime_package_dir: IMAGE_RUNTIME_PACKAGE_DIR,
    image_runtime_package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_prompt_ready: imagePromptReady,
    scene_binding_ready: sceneBindingReady,
    camera_binding_ready: cameraBindingReady,
    emotion_binding_ready: emotionBindingReady,
    continuity_binding_ready: continuityBindingReady,
    storytelling_binding_ready: storytellingBindingReady,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    image_generation_simulation_ready: imageGenerationSimulationReady,
    planning_only_status: planningOnlyStatus,
    simulation_entries: simulationEntries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? IMAGE_GENERATION_SIMULATION_PASS_VERDICT
      : IMAGE_GENERATION_SIMULATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, IMAGE_GENERATION_SIMULATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, IMAGE_GENERATION_SIMULATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMAGE_GENERATION_SIMULATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
