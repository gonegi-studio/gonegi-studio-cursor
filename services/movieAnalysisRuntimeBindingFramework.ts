import fs from 'node:fs';
import path from 'node:path';
import {
  DATASET_NORMALIZATION_STRUCTURES_PATH,
  type NormalizedAdapterStructure,
} from './movieAnalysisDatasetNormalization.js';
import {
  ADAPTERS_PER_SOURCE,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
} from './movieAnalysisDnaPackaging.js';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  EXPECTED_SOURCE_VIDEO_IDS,
  type DnaAdapterDefinition,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import {
  IMAGE_APP_BRIDGE_PATH,
  type MovieAnalysisImageAppBridge,
} from './movieAnalysisImageAppBridge.js';
import {
  LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT,
  LEVEL1_MASTER_CERTIFICATION_REPORT_PATH,
  LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisLevel1MasterCertificationReport,
} from './movieAnalysisLevel1MasterCertification.js';
import {
  SCENE_GRANULARITY_RESTORE_REPORT_PATH,
  type MovieAnalysisSceneGranularityRestoreReport,
} from './movieAnalysisSceneGranularityRestore.js';
import {
  VIDEO_APP_BRIDGE_PATH,
  type MovieAnalysisVideoAppBridge,
} from './movieAnalysisVideoAppBridge.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RUNTIME_BINDING_FRAMEWORK_PHASE =
  'PHASE-LEVEL2-001-MOVIE_ANALYSIS_RUNTIME_BINDING_FRAMEWORK_V1' as const;
export const RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_RUNTIME_BINDING_FRAMEWORK_V1' as const;
export const RUNTIME_BINDING_FRAMEWORK_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_RUNTIME_BINDING_FRAMEWORK_V1' as const;
export const RUNTIME_BINDING_FRAMEWORK_DIR =
  'reports/movie_analysis_runtime_binding_framework' as const;
export const RUNTIME_BINDING_FRAMEWORK_REPORT_PATH =
  'reports/movie_analysis_runtime_binding_framework/movie-analysis-runtime-binding-framework-report.json' as const;
export const RUNTIME_BINDING_FRAMEWORK_MD_PATH =
  'reports/movie_analysis_runtime_binding_framework/MOVIE_ANALYSIS_RUNTIME_BINDING_FRAMEWORK.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type BindingStatus = 'PASS' | 'FAIL';

export type RuntimeBindingIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
  adapter_type?: string;
};

export type RuntimeTarget =
  | 'scene_prompt'
  | 'camera_prompt'
  | 'emotion_prompt'
  | 'transition_runtime_rule'
  | 'continuity_runtime_rule'
  | 'narrative_runtime_rule';

export type AnalysisSource =
  | 'scene_analysis'
  | 'camera_dna'
  | 'emotion_dna'
  | 'transition_dna'
  | 'continuity_dna'
  | 'storytelling_dna';

export type RuntimeMappingRule = {
  rule_id: string;
  adapter_type: string;
  analysis_source: AnalysisSource;
  runtime_target: RuntimeTarget;
  binding_kind: 'prompt' | 'runtime_rule';
  consumer_targets: ('image_app' | 'video_app')[];
  planning_only: true;
};

export type AdapterRuntimeBinding = {
  binding_id: string;
  source_video_id: string;
  adapter_type: string;
  adapter_id: string;
  analysis_source: AnalysisSource;
  runtime_target: RuntimeTarget;
  binding_kind: 'prompt' | 'runtime_rule';
  pattern_count: number;
  consumer_targets: ('image_app' | 'video_app')[];
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  traceability_preserved: true;
  binding_only: true;
  planning_only: true;
};

export type RuntimeBindingCandidate = {
  candidate_id: string;
  binding_id: string;
  source_video_id: string;
  adapter_type: string;
  adapter_id: string;
  pattern_id: string;
  pattern_signature: string;
  analysis_source: AnalysisSource;
  runtime_target: RuntimeTarget;
  consumer_target: 'image_app' | 'video_app';
  binding_only: true;
  planning_only: true;
};

export type SourceRuntimeBindingAudit = {
  source_video_id: string;
  scene_binding: BindingStatus;
  camera_binding: BindingStatus;
  emotion_binding: BindingStatus;
  transition_binding: BindingStatus;
  continuity_binding: BindingStatus;
  storytelling_binding: BindingStatus;
  traceability_preserved: BindingStatus;
  source_binding_ready: BindingStatus;
};

export type MovieAnalysisRuntimeBindingFrameworkReport = {
  report_id: string;
  phase: typeof RUNTIME_BINDING_FRAMEWORK_PHASE;
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
  level1_master_certification_report_path: typeof LEVEL1_MASTER_CERTIFICATION_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  runtime_mapping_rules: RuntimeMappingRule[];
  adapter_runtime_bindings: AdapterRuntimeBinding[];
  runtime_binding_candidates: RuntimeBindingCandidate[];
  scene_binding_complete: BindingStatus;
  camera_binding_complete: BindingStatus;
  emotion_binding_complete: BindingStatus;
  transition_binding_complete: BindingStatus;
  continuity_binding_complete: BindingStatus;
  storytelling_binding_complete: BindingStatus;
  runtime_mapping_complete: BindingStatus;
  traceability_preserved: BindingStatus;
  runtime_binding_framework_ready: BindingStatus;
  planning_only_status: BindingStatus;
  source_audits: SourceRuntimeBindingAudit[];
  final_verdict:
    | typeof RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT
    | typeof RUNTIME_BINDING_FRAMEWORK_FAIL_VERDICT;
  issues: RuntimeBindingIssue[];
};

const ADAPTER_FIELDS = [
  'scene_adapter',
  'camera_adapter',
  'emotion_adapter',
  'transition_adapter',
  'continuity_adapter',
  'storytelling_adapter',
] as const;

type AdapterField = (typeof ADAPTER_FIELDS)[number];

const RUNTIME_MAPPING_RULES: RuntimeMappingRule[] = [
  {
    rule_id: 'bind-scene-analysis-to-scene-prompt',
    adapter_type: 'scene_adapter',
    analysis_source: 'scene_analysis',
    runtime_target: 'scene_prompt',
    binding_kind: 'prompt',
    consumer_targets: ['image_app', 'video_app'],
    planning_only: true,
  },
  {
    rule_id: 'bind-camera-dna-to-camera-prompt',
    adapter_type: 'camera_adapter',
    analysis_source: 'camera_dna',
    runtime_target: 'camera_prompt',
    binding_kind: 'prompt',
    consumer_targets: ['image_app', 'video_app'],
    planning_only: true,
  },
  {
    rule_id: 'bind-emotion-dna-to-emotion-prompt',
    adapter_type: 'emotion_adapter',
    analysis_source: 'emotion_dna',
    runtime_target: 'emotion_prompt',
    binding_kind: 'prompt',
    consumer_targets: ['image_app', 'video_app'],
    planning_only: true,
  },
  {
    rule_id: 'bind-transition-dna-to-transition-runtime-rule',
    adapter_type: 'transition_adapter',
    analysis_source: 'transition_dna',
    runtime_target: 'transition_runtime_rule',
    binding_kind: 'runtime_rule',
    consumer_targets: ['image_app', 'video_app'],
    planning_only: true,
  },
  {
    rule_id: 'bind-continuity-dna-to-continuity-runtime-rule',
    adapter_type: 'continuity_adapter',
    analysis_source: 'continuity_dna',
    runtime_target: 'continuity_runtime_rule',
    binding_kind: 'runtime_rule',
    consumer_targets: ['image_app', 'video_app'],
    planning_only: true,
  },
  {
    rule_id: 'bind-storytelling-dna-to-narrative-runtime-rule',
    adapter_type: 'storytelling_adapter',
    analysis_source: 'storytelling_dna',
    runtime_target: 'narrative_runtime_rule',
    binding_kind: 'runtime_rule',
    consumer_targets: ['image_app', 'video_app'],
    planning_only: true,
  },
];

const ANALYSIS_SOURCE_BY_ADAPTER: Record<AdapterField, AnalysisSource> = {
  scene_adapter: 'scene_analysis',
  camera_adapter: 'camera_dna',
  emotion_adapter: 'emotion_dna',
  transition_adapter: 'transition_dna',
  continuity_adapter: 'continuity_dna',
  storytelling_adapter: 'storytelling_dna',
};

const RUNTIME_TARGET_BY_ADAPTER: Record<AdapterField, RuntimeTarget> = {
  scene_adapter: 'scene_prompt',
  camera_adapter: 'camera_prompt',
  emotion_adapter: 'emotion_prompt',
  transition_adapter: 'transition_runtime_rule',
  continuity_adapter: 'continuity_runtime_rule',
  storytelling_adapter: 'narrative_runtime_rule',
};

function loadLevel1MasterReport(
  projectRoot: string
): MovieAnalysisLevel1MasterCertificationReport | null {
  const abs = path.join(projectRoot, LEVEL1_MASTER_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisLevel1MasterCertificationReport;
}

function loadSceneGranularityReport(
  projectRoot: string
): MovieAnalysisSceneGranularityRestoreReport | null {
  const abs = path.join(projectRoot, SCENE_GRANULARITY_RESTORE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisSceneGranularityRestoreReport;
}

function loadNormalizedAdapters(projectRoot: string): NormalizedAdapterStructure[] {
  const abs = path.join(projectRoot, DATASET_NORMALIZATION_STRUCTURES_PATH);
  if (!fs.existsSync(abs)) return [];
  const bundle = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    normalized_adapter_structure?: NormalizedAdapterStructure[];
  };
  return bundle.normalized_adapter_structure ?? [];
}

function loadImageBridge(projectRoot: string): MovieAnalysisImageAppBridge | null {
  const abs = path.join(projectRoot, IMAGE_APP_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageAppBridge;
}

function loadVideoBridge(projectRoot: string): MovieAnalysisVideoAppBridge | null {
  const abs = path.join(projectRoot, VIDEO_APP_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoAppBridge;
}

function buildAdapterBinding(
  sourceVideoId: string,
  adapterType: AdapterField,
  libraryAdapter: DnaAdapterDefinition,
  libraryEntry: DnaAdapterLibraryEntry,
  normalizedStructure: NormalizedAdapterStructure | undefined,
  mappingRule: RuntimeMappingRule
): {
  binding: AdapterRuntimeBinding;
  candidates: RuntimeBindingCandidate[];
  bindingReady: boolean;
} {
  const normalizedAdapter = normalizedStructure?.adapters.find(
    (adapter) => adapter.adapter_type === adapterType
  );
  const patterns = normalizedAdapter?.patterns ?? [];
  const bindingId = `runtime_binding_${sourceVideoId.toLowerCase()}_${adapterType}`;

  const binding: AdapterRuntimeBinding = {
    binding_id: bindingId,
    source_video_id: sourceVideoId,
    adapter_type: adapterType,
    adapter_id: libraryAdapter.adapter_id,
    analysis_source: mappingRule.analysis_source,
    runtime_target: mappingRule.runtime_target,
    binding_kind: mappingRule.binding_kind,
    pattern_count: patterns.length,
    consumer_targets: [...mappingRule.consumer_targets],
    cinematic_dna_id: libraryEntry.cinematic_dna_id,
    integration_id: libraryEntry.integration_id,
    adapter_library_entry_id: libraryEntry.adapter_library_entry_id,
    traceability_preserved: true,
    binding_only: true,
    planning_only: true,
  };

  const candidates: RuntimeBindingCandidate[] = [];
  for (const pattern of patterns) {
    for (const consumerTarget of mappingRule.consumer_targets) {
      candidates.push({
        candidate_id: `runtime_binding_candidate_${pattern.pattern_id}_${consumerTarget}`,
        binding_id: bindingId,
        source_video_id: sourceVideoId,
        adapter_type: adapterType,
        adapter_id: libraryAdapter.adapter_id,
        pattern_id: pattern.pattern_id,
        pattern_signature: pattern.pattern_signature,
        analysis_source: mappingRule.analysis_source,
        runtime_target: mappingRule.runtime_target,
        consumer_target: consumerTarget,
        binding_only: true,
        planning_only: true,
      });
    }
  }

  const bindingReady =
    libraryAdapter.adapter_ready === true &&
    libraryAdapter.adapter_id === binding.adapter_id &&
    patterns.length > 0 &&
    mappingRule.analysis_source === ANALYSIS_SOURCE_BY_ADAPTER[adapterType] &&
    mappingRule.runtime_target === RUNTIME_TARGET_BY_ADAPTER[adapterType];

  return { binding, candidates, bindingReady };
}

function auditSourceBindings(
  sourceVideoId: string,
  bindings: AdapterRuntimeBinding[],
  imageEntry: MovieAnalysisImageAppBridge['entries'][number] | undefined,
  videoEntry: MovieAnalysisVideoAppBridge['entries'][number] | undefined,
  sceneRestoreCount: number
): SourceRuntimeBindingAudit {
  const sourceBindings = bindings.filter((binding) => binding.source_video_id === sourceVideoId);

  const bindingStatus = (adapterType: AdapterField): BindingStatus => {
    const binding = sourceBindings.find((entry) => entry.adapter_type === adapterType);
    if (!binding || binding.pattern_count === 0) {
      return 'FAIL';
    }
    if (adapterType === 'scene_adapter' && sceneRestoreCount === 0) {
      return 'FAIL';
    }
    return 'PASS';
  };

  const traceabilityPreserved =
    sourceBindings.length === ADAPTERS_PER_SOURCE &&
    sourceBindings.every(
      (binding) =>
        binding.cinematic_dna_id === imageEntry?.cinematic_dna_id &&
        binding.cinematic_dna_id === videoEntry?.cinematic_dna_id &&
        binding.integration_id === imageEntry?.integration_id &&
        binding.integration_id === videoEntry?.integration_id &&
        binding.adapter_library_entry_id === imageEntry?.adapter_library_entry_id &&
        binding.adapter_library_entry_id === videoEntry?.adapter_library_entry_id
    )
      ? 'PASS'
      : 'FAIL';

  const adapterStatuses = ADAPTER_FIELDS.map((field) => bindingStatus(field));
  const sourceBindingReady =
    adapterStatuses.every((status) => status === 'PASS') && traceabilityPreserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    scene_binding: adapterStatuses[0],
    camera_binding: adapterStatuses[1],
    emotion_binding: adapterStatuses[2],
    transition_binding: adapterStatuses[3],
    continuity_binding: adapterStatuses[4],
    storytelling_binding: adapterStatuses[5],
    traceability_preserved: traceabilityPreserved,
    source_binding_ready: sourceBindingReady,
  };
}

function aggregateBindingStatus(
  audits: SourceRuntimeBindingAudit[],
  field: keyof Pick<
    SourceRuntimeBindingAudit,
    | 'scene_binding'
    | 'camera_binding'
    | 'emotion_binding'
    | 'transition_binding'
    | 'continuity_binding'
    | 'storytelling_binding'
    | 'traceability_preserved'
  >
): BindingStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRuntimeBindingFrameworkReport): string {
  const lines = [
    '# Movie Analysis Runtime Binding Framework',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Framework Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| no_execution | ${report.no_execution} |`,
    '',
    '## Runtime Mapping Rules',
    '',
  ];

  for (const rule of report.runtime_mapping_rules) {
    lines.push(
      `- **${rule.rule_id}**: ${rule.analysis_source} → ${rule.runtime_target} [${rule.binding_kind}] adapters=${rule.adapter_type}`
    );
  }

  lines.push('', '## Binding Summary', '');
  lines.push(
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| adapter_runtime_bindings | ${report.adapter_runtime_bindings.length} |`,
    `| runtime_binding_candidates | ${report.runtime_binding_candidates.length} |`,
    `| scene_binding_complete | ${report.scene_binding_complete} |`,
    `| camera_binding_complete | ${report.camera_binding_complete} |`,
    `| emotion_binding_complete | ${report.emotion_binding_complete} |`,
    `| transition_binding_complete | ${report.transition_binding_complete} |`,
    `| continuity_binding_complete | ${report.continuity_binding_complete} |`,
    `| storytelling_binding_complete | ${report.storytelling_binding_complete} |`,
    `| runtime_mapping_complete | ${report.runtime_mapping_complete} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| runtime_binding_framework_ready | ${report.runtime_binding_framework_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_binding: ${audit.scene_binding}`,
      `- camera_binding: ${audit.camera_binding}`,
      `- emotion_binding: ${audit.emotion_binding}`,
      `- transition_binding: ${audit.transition_binding}`,
      `- continuity_binding: ${audit.continuity_binding}`,
      `- storytelling_binding: ${audit.storytelling_binding}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- source_binding_ready: ${audit.source_binding_ready}`,
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
  issues: RuntimeBindingIssue[]
): MovieAnalysisRuntimeBindingFrameworkReport {
  const report: MovieAnalysisRuntimeBindingFrameworkReport = {
    report_id: 'movie-analysis-runtime-binding-framework-report-v1',
    phase: RUNTIME_BINDING_FRAMEWORK_PHASE,
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
    level1_master_certification_report_path: LEVEL1_MASTER_CERTIFICATION_REPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    runtime_mapping_rules: [],
    adapter_runtime_bindings: [],
    runtime_binding_candidates: [],
    scene_binding_complete: 'FAIL',
    camera_binding_complete: 'FAIL',
    emotion_binding_complete: 'FAIL',
    transition_binding_complete: 'FAIL',
    continuity_binding_complete: 'FAIL',
    storytelling_binding_complete: 'FAIL',
    runtime_mapping_complete: 'FAIL',
    traceability_preserved: 'FAIL',
    runtime_binding_framework_ready: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: RUNTIME_BINDING_FRAMEWORK_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, RUNTIME_BINDING_FRAMEWORK_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, RUNTIME_BINDING_FRAMEWORK_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RUNTIME_BINDING_FRAMEWORK_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRuntimeBindingFrameworkReport(
  projectRoot?: string
): MovieAnalysisRuntimeBindingFrameworkReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RuntimeBindingIssue[] = [];
  const timestamp = new Date().toISOString();

  const level1Report = loadLevel1MasterReport(root);
  if (!level1Report) {
    issues.push({
      code: 'LEVEL1_MASTER_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${LEVEL1_MASTER_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (level1Report.final_verdict !== LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL1_MASTER_CERTIFICATION_NOT_PASS',
      message: `Level 1 master certification must have ${LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (level1Report.certification_status !== LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE) {
    issues.push({
      code: 'LEVEL1_STATUS_MISMATCH',
      message: `Expected ${LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const dnaLibrary = loadMovieAnalysisDnaAdapterLibrary(root);
  const normalizedAdapters = loadNormalizedAdapters(root);
  const sceneGranularityReport = loadSceneGranularityReport(root);
  const imageBridge = loadImageBridge(root);
  const videoBridge = loadVideoBridge(root);

  if (!dnaLibrary) {
    issues.push({
      code: 'DNA_ADAPTER_LIBRARY_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!imageBridge || !videoBridge) {
    issues.push({
      code: 'CONSUMER_BRIDGE_MISSING',
      message: 'Image App or Video App bridge artifacts are missing',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!sceneGranularityReport) {
    issues.push({
      code: 'SCENE_GRANULARITY_RESTORE_REPORT_MISSING',
      message: `Missing ${SCENE_GRANULARITY_RESTORE_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const adapterRuntimeBindings: AdapterRuntimeBinding[] = [];
  const runtimeBindingCandidates: RuntimeBindingCandidate[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const libraryEntry = dnaLibrary.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const normalizedStructure = normalizedAdapters.find(
      (structure) => structure.source_video_id === sourceVideoId
    );

    if (!libraryEntry || !normalizedStructure) {
      issues.push({
        code: 'SOURCE_BINDING_DATA_MISSING',
        message: `Missing binding data for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      continue;
    }

    for (const adapterType of ADAPTER_FIELDS) {
      const mappingRule = RUNTIME_MAPPING_RULES.find(
        (rule) => rule.adapter_type === adapterType
      );
      if (!mappingRule) {
        continue;
      }

      const libraryAdapter = libraryEntry[adapterType];
      const { binding, candidates, bindingReady } = buildAdapterBinding(
        sourceVideoId,
        adapterType,
        libraryAdapter,
        libraryEntry,
        normalizedStructure,
        mappingRule
      );

      adapterRuntimeBindings.push(binding);
      runtimeBindingCandidates.push(...candidates);

      if (!bindingReady) {
        issues.push({
          code: 'ADAPTER_BINDING_INCOMPLETE',
          message: `Runtime binding incomplete for ${sourceVideoId}/${adapterType}`,
          severity: 'error',
          source_video_id: sourceVideoId,
          adapter_type: adapterType,
        });
      }
    }
  }

  const sourceAudits = EXPECTED_SOURCE_VIDEO_IDS.map((sourceVideoId) => {
    const imageEntry = imageBridge.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const videoEntry = videoBridge.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const sceneRestoreCount = sceneGranularityReport.scene_boundary_restore_candidates.filter(
      (candidate) => candidate.source_video_id === sourceVideoId
    ).length;

    const audit = auditSourceBindings(
      sourceVideoId,
      adapterRuntimeBindings,
      imageEntry,
      videoEntry,
      sceneRestoreCount
    );

    if (audit.source_binding_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_BINDING_NOT_READY',
        message: `Source runtime binding failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    return audit;
  });

  const sceneBindingComplete = aggregateBindingStatus(sourceAudits, 'scene_binding');
  const cameraBindingComplete = aggregateBindingStatus(sourceAudits, 'camera_binding');
  const emotionBindingComplete = aggregateBindingStatus(sourceAudits, 'emotion_binding');
  const transitionBindingComplete = aggregateBindingStatus(sourceAudits, 'transition_binding');
  const continuityBindingComplete = aggregateBindingStatus(sourceAudits, 'continuity_binding');
  const storytellingBindingComplete = aggregateBindingStatus(sourceAudits, 'storytelling_binding');
  const traceabilityPreserved = aggregateBindingStatus(sourceAudits, 'traceability_preserved');

  const runtimeMappingComplete =
    adapterRuntimeBindings.length === EXPECTED_ADAPTER_COUNT &&
    RUNTIME_MAPPING_RULES.every((rule) =>
      adapterRuntimeBindings.some(
        (binding) =>
          binding.adapter_type === rule.adapter_type &&
          binding.analysis_source === rule.analysis_source &&
          binding.runtime_target === rule.runtime_target &&
          binding.pattern_count > 0
      )
    )
      ? 'PASS'
      : 'FAIL';

  if (runtimeMappingComplete === 'FAIL') {
    issues.push({
      code: 'RUNTIME_MAPPING_INCOMPLETE',
      message: 'Runtime mapping validation failed across adapters',
      severity: 'error',
    });
  }

  const safetyValid =
    level1Report.planning_only === true &&
    level1Report.planning_only_status === 'PASS' &&
    imageBridge.safety_summary.planning_only === true &&
    imageBridge.safety_summary.generation === false &&
    videoBridge.safety_summary.planning_only === true &&
    videoBridge.safety_summary.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: BindingStatus = safetyValid ? 'PASS' : 'FAIL';

  const bindingChecks = [
    sceneBindingComplete,
    cameraBindingComplete,
    emotionBindingComplete,
    transitionBindingComplete,
    continuityBindingComplete,
    storytellingBindingComplete,
    runtimeMappingComplete,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  const runtimeBindingFrameworkReady =
    level1Report.source_count === EXPECTED_SOURCE_COUNT &&
    level1Report.adapter_count === EXPECTED_ADAPTER_COUNT &&
    adapterRuntimeBindings.length === EXPECTED_ADAPTER_COUNT &&
    runtimeBindingCandidates.length > 0 &&
    bindingChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_binding_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = runtimeBindingFrameworkReady === 'PASS';

  const report: MovieAnalysisRuntimeBindingFrameworkReport = {
    report_id: 'movie-analysis-runtime-binding-framework-report-v1',
    phase: RUNTIME_BINDING_FRAMEWORK_PHASE,
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
    level1_master_certification_report_path: LEVEL1_MASTER_CERTIFICATION_REPORT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    runtime_mapping_rules: RUNTIME_MAPPING_RULES,
    adapter_runtime_bindings: adapterRuntimeBindings,
    runtime_binding_candidates: runtimeBindingCandidates,
    scene_binding_complete: sceneBindingComplete,
    camera_binding_complete: cameraBindingComplete,
    emotion_binding_complete: emotionBindingComplete,
    transition_binding_complete: transitionBindingComplete,
    continuity_binding_complete: continuityBindingComplete,
    storytelling_binding_complete: storytellingBindingComplete,
    runtime_mapping_complete: runtimeMappingComplete,
    traceability_preserved: traceabilityPreserved,
    runtime_binding_framework_ready: runtimeBindingFrameworkReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT
      : RUNTIME_BINDING_FRAMEWORK_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, RUNTIME_BINDING_FRAMEWORK_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, RUNTIME_BINDING_FRAMEWORK_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RUNTIME_BINDING_FRAMEWORK_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
