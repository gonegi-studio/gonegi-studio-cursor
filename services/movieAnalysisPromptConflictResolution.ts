import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  PROMPT_ASSEMBLY_ENGINE_REPORT_PATH,
  type AssembledPromptPackage,
  type MovieAnalysisPromptAssemblyEngineReport,
  type PromptSectionId,
} from './movieAnalysisPromptAssemblyEngine.js';
import {
  PROMPT_QUALITY_GATE_PASS_VERDICT,
  PROMPT_QUALITY_GATE_REPORT_PATH,
  type MovieAnalysisPromptQualityGateReport,
  type PromptQualityRiskDetection,
} from './movieAnalysisPromptQualityGate.js';
import {
  RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
  type AdapterRuntimeBinding,
  type MovieAnalysisRuntimeBindingFrameworkReport,
  type RuntimeTarget,
} from './movieAnalysisRuntimeBindingFramework.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROMPT_CONFLICT_RESOLUTION_PHASE =
  'PHASE-LEVEL2-005-MOVIE_ANALYSIS_PROMPT_CONFLICT_RESOLUTION_V1' as const;
export const PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PROMPT_CONFLICT_RESOLUTION_V1' as const;
export const PROMPT_CONFLICT_RESOLUTION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PROMPT_CONFLICT_RESOLUTION_V1' as const;
export const PROMPT_CONFLICT_RESOLUTION_DIR =
  'reports/movie_analysis_prompt_conflict_resolution' as const;
export const PROMPT_CONFLICT_RESOLUTION_REPORT_PATH =
  'reports/movie_analysis_prompt_conflict_resolution/movie-analysis-prompt-conflict-resolution-report.json' as const;
export const PROMPT_CONFLICT_RESOLUTION_MD_PATH =
  'reports/movie_analysis_prompt_conflict_resolution/MOVIE_ANALYSIS_PROMPT_CONFLICT_RESOLUTION.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ResolutionStatus = 'PASS' | 'FAIL';

export type PromptConflictResolutionIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type ConflictCategory =
  | 'execution_vs_planning'
  | 'runtime_vs_non_runtime'
  | 'generation_vs_no_generation'
  | 'duplicate_style_directives'
  | 'adapter_instruction_conflicts';

export type ConflictCategoryDetection = {
  category: ConflictCategory;
  source_video_id: string;
  conflict_pair: string;
  detected_from: string;
  severity: 'warning';
};

export type ConflictResolutionRule = {
  rule_id: string;
  category: ConflictCategory;
  priority: 'high' | 'medium';
  description: string;
  planning_only: true;
};

export type PriorityRule = {
  rule_id: string;
  priority_order: number;
  directive: string;
  planning_only: true;
};

export type PromptCleanupRule = {
  rule_id: string;
  target_section: PromptSectionId | 'all_positive';
  cleanup_action: 'strip_planning_meta_tokens' | 'deduplicate_scene_signatures' | 'prefer_negated_form' | 'isolate_adapter_instructions';
  planning_only: true;
};

export type ResolvedPromptTemplate = {
  template_id: string;
  source_video_id: string;
  assembly_id: string;
  final_image_prompt_resolved: string;
  final_video_prompt_resolved: string;
  resolved_sections: Record<PromptSectionId, string>;
  conflicts_resolved: number;
  planning_only: true;
  generation: false;
};

export type ResolvedRuntimeMapping = {
  mapping_id: string;
  source_video_id: string;
  binding_id: string;
  runtime_target: RuntimeTarget;
  resolved_pattern_signatures: string[];
  conflict_free: true;
  planning_only: true;
};

export type ConflictResolutionMetrics = {
  conflicts_before: number;
  conflicts_after: number;
  resolution_ratio: number;
};

export type SourceConflictResolutionAudit = {
  source_video_id: string;
  conflicts_before: number;
  conflicts_after: number;
  resolution_ratio: number;
  conflict_resolution_ready: ResolutionStatus;
};

export type MovieAnalysisPromptConflictResolutionReport = {
  report_id: string;
  phase: typeof PROMPT_CONFLICT_RESOLUTION_PHASE;
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
  prompt_quality_gate_report_path: typeof PROMPT_QUALITY_GATE_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  conflicting_prompt_terms: PromptQualityRiskDetection[];
  conflict_category_detections: ConflictCategoryDetection[];
  conflict_resolution_rules: ConflictResolutionRule[];
  priority_rules: PriorityRule[];
  prompt_cleanup_rules: PromptCleanupRule[];
  resolved_prompt_templates: ResolvedPromptTemplate[];
  resolved_runtime_mappings: ResolvedRuntimeMapping[];
  conflict_resolution_metrics: ConflictResolutionMetrics;
  prompt_conflict_resolution_ready: ResolutionStatus;
  planning_only_status: ResolutionStatus;
  source_audits: SourceConflictResolutionAudit[];
  final_verdict:
    | typeof PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT
    | typeof PROMPT_CONFLICT_RESOLUTION_FAIL_VERDICT;
  issues: PromptConflictResolutionIssue[];
};

const ASSEMBLY_ORDER: PromptSectionId[] = [
  'scene',
  'camera',
  'emotion',
  'style',
  'continuity',
  'negative',
];

const SECTION_MARKERS: Record<PromptSectionId, string> = {
  scene: '[scene]',
  camera: '[camera]',
  emotion: '[emotion]',
  style: '[style]',
  continuity: '[continuity]',
  negative: '[negative]',
};

const PLANNING_META_TOKENS = [
  'runtime_layout',
  'runtime_estimated_only',
  'execution_readiness_only',
  'no_runtime_execution',
  'no_video_generation',
  'no_image_generation',
  'no_gpu_ready',
];

const CONFLICT_PAIRS: [string, string][] = [
  ['no_runtime_execution', 'runtime_execution'],
  ['no_video_generation', 'video_generation'],
  ['no_image_generation', 'image_generation'],
  ['no_gpu', 'gpu_ready'],
];

const CONFLICT_RESOLUTION_RULES: ConflictResolutionRule[] = [
  {
    rule_id: 'resolve-execution-vs-planning',
    category: 'execution_vs_planning',
    priority: 'high',
    description:
      'Strip planning-meta tokens from positive style sections to eliminate execution vs planning substring conflicts.',
    planning_only: true,
  },
  {
    rule_id: 'resolve-generation-vs-no-generation',
    category: 'generation_vs_no_generation',
    priority: 'high',
    description:
      'Retain negated planning tokens in negative section only; remove generation tokens from positive style content.',
    planning_only: true,
  },
  {
    rule_id: 'resolve-runtime-vs-non-runtime',
    category: 'runtime_vs_non_runtime',
    priority: 'high',
    description:
      'Prefer non-runtime planning directives and remove gpu_ready/runtime_execution positive tokens from resolved prompts.',
    planning_only: true,
  },
  {
    rule_id: 'resolve-duplicate-style-directives',
    category: 'duplicate_style_directives',
    priority: 'medium',
    description:
      'Deduplicate scene signatures appearing in both scene and style sections, keeping scene section as canonical.',
    planning_only: true,
  },
  {
    rule_id: 'resolve-adapter-instruction-conflicts',
    category: 'adapter_instruction_conflicts',
    priority: 'medium',
    description:
      'Isolate adapter-specific instructions per runtime target to prevent cross-adapter signature bleed in style prompts.',
    planning_only: true,
  },
];

const PRIORITY_RULES: PriorityRule[] = [
  {
    rule_id: 'priority-planning-only-first',
    priority_order: 1,
    directive: 'Planning-only safety tokens take precedence over runtime/generation directives.',
    planning_only: true,
  },
  {
    rule_id: 'priority-adapter-dna-second',
    priority_order: 2,
    directive: 'Adapter DNA signatures in canonical sections override duplicated style-section copies.',
    planning_only: true,
  },
  {
    rule_id: 'priority-narrative-style-third',
    priority_order: 3,
    directive: 'Narrative and transition signatures are retained after planning-meta cleanup.',
    planning_only: true,
  },
  {
    rule_id: 'priority-negative-last',
    priority_order: 4,
    directive: 'Negative prompt section remains last and absorbs planning-only exclusion directives.',
    planning_only: true,
  },
];

const PROMPT_CLEANUP_RULES: PromptCleanupRule[] = [
  {
    rule_id: 'cleanup-strip-planning-meta',
    target_section: 'style',
    cleanup_action: 'strip_planning_meta_tokens',
    planning_only: true,
  },
  {
    rule_id: 'cleanup-dedupe-scene-style',
    target_section: 'style',
    cleanup_action: 'deduplicate_scene_signatures',
    planning_only: true,
  },
  {
    rule_id: 'cleanup-prefer-negated-form',
    target_section: 'all_positive',
    cleanup_action: 'prefer_negated_form',
    planning_only: true,
  },
  {
    rule_id: 'cleanup-isolate-adapter-instructions',
    target_section: 'style',
    cleanup_action: 'isolate_adapter_instructions',
    planning_only: true,
  },
];

function loadQualityGateReport(
  projectRoot: string
): MovieAnalysisPromptQualityGateReport | null {
  const abs = path.join(projectRoot, PROMPT_QUALITY_GATE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisPromptQualityGateReport;
}

function loadAssemblyReport(
  projectRoot: string
): MovieAnalysisPromptAssemblyEngineReport | null {
  const abs = path.join(projectRoot, PROMPT_ASSEMBLY_ENGINE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisPromptAssemblyEngineReport;
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

function parseConflictPair(detail: string): string | null {
  const match = detail.match(/Conflicting terms detected: ([^/]+)\/(.+)/);
  if (!match) return null;
  return `${match[1]}/${match[2]}`;
}

function categorizeConflict(pair: string): ConflictCategory {
  if (pair.includes('runtime_execution')) return 'execution_vs_planning';
  if (pair.includes('video_generation') || pair.includes('image_generation')) {
    return 'generation_vs_no_generation';
  }
  if (pair.includes('gpu')) return 'runtime_vs_non_runtime';
  return 'adapter_instruction_conflicts';
}

function extractSignatures(content: string): string[] {
  const afterColon = content.includes(':') ? content.split(':').slice(1).join(':') : content;
  return afterColon
    .split(/with transitions |, /)
    .flatMap((part) => part.split(', '))
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function rebuildStylePrompt(narrative: string[], transitions: string[]): string {
  const narrativePart = narrative.length > 0 ? narrative.join(', ') : 'narrative_hold';
  const transitionPart = transitions.length > 0 ? transitions.join(', ') : 'transition_hold';
  return `visual narrative style: ${narrativePart} with transitions ${transitionPart}`;
}

function cleanupStyleSection(
  styleContent: string,
  sceneContent: string
): { resolved: string; duplicatesRemoved: number; planningStripped: number } {
  const sceneSignatures = new Set(
    extractSignatures(sceneContent).filter((sig) => sig.startsWith('scene_'))
  );

  let tokens = extractSignatures(styleContent);
  const planningStripped = tokens.filter((token) => PLANNING_META_TOKENS.includes(token)).length;
  tokens = tokens.filter((token) => !PLANNING_META_TOKENS.includes(token));

  const narrative: string[] = [];
  const transitions: string[] = [];
  let duplicatesRemoved = 0;

  for (const token of tokens) {
    if (token.startsWith('transition_') || token.includes('transition')) {
      transitions.push(token);
      continue;
    }
    if (token.startsWith('scene_') && sceneSignatures.has(token)) {
      duplicatesRemoved += 1;
      continue;
    }
    if (token.startsWith('scene_') || token.startsWith('runtime_')) {
      narrative.push(token);
    }
  }

  return {
    resolved: rebuildStylePrompt(narrative, transitions),
    duplicatesRemoved,
    planningStripped,
  };
}

function assembleResolvedPrompt(
  sections: Record<PromptSectionId, string>,
  consumerTarget: 'image_app' | 'video_app'
): string {
  const prefix = consumerTarget === 'image_app' ? 'image_prompt:' : 'video_prompt:';
  const body = ASSEMBLY_ORDER.map(
    (sectionId) => `${SECTION_MARKERS[sectionId]} ${sections[sectionId]}`
  ).join(' ');
  return `${prefix} ${body}`.trim();
}

function detectConflictsInPrompt(prompt: string): string[] {
  const negativeIndex = prompt.indexOf(SECTION_MARKERS.negative);
  const positive = negativeIndex >= 0 ? prompt.slice(0, negativeIndex).toLowerCase() : prompt.toLowerCase();
  const conflicts: string[] = [];
  for (const [a, b] of CONFLICT_PAIRS) {
    if (positive.includes(a.toLowerCase()) && positive.includes(b.toLowerCase())) {
      conflicts.push(`${a}/${b}`);
    }
  }
  return conflicts;
}

function buildCategoryDetections(
  conflicts: PromptQualityRiskDetection[]
): ConflictCategoryDetection[] {
  return conflicts.map((conflict) => {
    const pair = parseConflictPair(conflict.detail) ?? 'unknown/unknown';
    return {
      category: categorizeConflict(pair),
      source_video_id: conflict.source_video_id,
      conflict_pair: pair,
      detected_from: conflict.risk_id,
      severity: 'warning' as const,
    };
  });
}

function buildResolvedRuntimeMappings(
  bindings: AdapterRuntimeBinding[],
  sourceVideoId: string,
  resolvedStyle: string
): ResolvedRuntimeMapping[] {
  return bindings
    .filter((binding) => binding.source_video_id === sourceVideoId)
    .map((binding) => {
      const styleSignatures =
        binding.runtime_target === 'narrative_runtime_rule' ||
        binding.runtime_target === 'transition_runtime_rule'
          ? extractSignatures(resolvedStyle)
          : [];

      return {
        mapping_id: `resolved_runtime_mapping_${binding.binding_id}`,
        source_video_id: sourceVideoId,
        binding_id: binding.binding_id,
        runtime_target: binding.runtime_target,
        resolved_pattern_signatures:
          styleSignatures.length > 0
            ? styleSignatures
            : [`resolved_${binding.runtime_target}`],
        conflict_free: true as const,
        planning_only: true as const,
      };
    });
}

function buildMarkdown(report: MovieAnalysisPromptConflictResolutionReport): string {
  const lines = [
    '# Movie Analysis Prompt Conflict Resolution',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Resolution Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    '',
    '## Conflict Resolution Metrics',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| conflicts_before | ${report.conflict_resolution_metrics.conflicts_before} |`,
    `| conflicts_after | ${report.conflict_resolution_metrics.conflicts_after} |`,
    `| resolution_ratio | ${report.conflict_resolution_metrics.resolution_ratio} |`,
    '',
    '## Conflict Categories',
    '',
  ];

  const categories = [...new Set(report.conflict_category_detections.map((d) => d.category))];
  for (const category of categories) {
    const count = report.conflict_category_detections.filter((d) => d.category === category).length;
    lines.push(`- ${category}: ${count}`);
  }

  lines.push('', '## Resolution Rules', '');
  for (const rule of report.conflict_resolution_rules) {
    lines.push(`- **${rule.rule_id}** [${rule.category}] ${rule.description}`);
  }

  lines.push('', '## Source Audits', '');
  for (const audit of report.source_audits) {
    lines.push(
      `- ${audit.source_video_id}: before=${audit.conflicts_before} after=${audit.conflicts_after} ratio=${audit.resolution_ratio} ready=${audit.conflict_resolution_ready}`
    );
  }

  if (report.issues.length > 0) {
    lines.push('', '## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: PromptConflictResolutionIssue[]
): MovieAnalysisPromptConflictResolutionReport {
  const report: MovieAnalysisPromptConflictResolutionReport = {
    report_id: 'movie-analysis-prompt-conflict-resolution-report-v1',
    phase: PROMPT_CONFLICT_RESOLUTION_PHASE,
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
    prompt_quality_gate_report_path: PROMPT_QUALITY_GATE_REPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    conflicting_prompt_terms: [],
    conflict_category_detections: [],
    conflict_resolution_rules: [],
    priority_rules: [],
    prompt_cleanup_rules: [],
    resolved_prompt_templates: [],
    resolved_runtime_mappings: [],
    conflict_resolution_metrics: {
      conflicts_before: -1,
      conflicts_after: -1,
      resolution_ratio: 0,
    },
    prompt_conflict_resolution_ready: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: PROMPT_CONFLICT_RESOLUTION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PROMPT_CONFLICT_RESOLUTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PROMPT_CONFLICT_RESOLUTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PROMPT_CONFLICT_RESOLUTION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisPromptConflictResolutionReport(
  projectRoot?: string
): MovieAnalysisPromptConflictResolutionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: PromptConflictResolutionIssue[] = [];
  const timestamp = new Date().toISOString();

  const qualityGateReport = loadQualityGateReport(root);
  if (!qualityGateReport) {
    issues.push({
      code: 'PROMPT_QUALITY_GATE_REPORT_MISSING',
      message: `Missing ${PROMPT_QUALITY_GATE_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (qualityGateReport.final_verdict !== PROMPT_QUALITY_GATE_PASS_VERDICT) {
    issues.push({
      code: 'PROMPT_QUALITY_GATE_NOT_PASS',
      message: `Prompt quality gate must have ${PROMPT_QUALITY_GATE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const assemblyReport = loadAssemblyReport(root);
  const bindingReport = loadBindingReport(root);

  if (!assemblyReport || !bindingReport) {
    issues.push({
      code: 'UPSTREAM_REPORT_MISSING',
      message: 'Missing prompt assembly or runtime binding report',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const conflictingPromptTerms = qualityGateReport.conflicting_prompt_terms;
  const conflictCategoryDetections = buildCategoryDetections(conflictingPromptTerms);

  const resolvedPromptTemplates: ResolvedPromptTemplate[] = [];
  const resolvedRuntimeMappings: ResolvedRuntimeMapping[] = [];
  const sourceAudits: SourceConflictResolutionAudit[] = [];

  let totalConflictsAfter = 0;

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const assembled = assemblyReport.assembled_prompt_packages.find(
      (entry) => entry.source_video_id === sourceVideoId
    );

    const sourceConflictsBefore = conflictingPromptTerms.filter(
      (conflict) => conflict.source_video_id === sourceVideoId
    ).length;

    if (!assembled) {
      issues.push({
        code: 'ASSEMBLED_PACKAGE_MISSING',
        message: `Missing assembled package for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      sourceAudits.push({
        source_video_id: sourceVideoId,
        conflicts_before: sourceConflictsBefore,
        conflicts_after: sourceConflictsBefore,
        resolution_ratio: 0,
        conflict_resolution_ready: 'FAIL',
      });
      continue;
    }

    const sectionMap = Object.fromEntries(
      assembled.assembly_sections.map((section) => [section.section_id, section.content])
    ) as Record<PromptSectionId, string>;

    const sceneContent = sectionMap.scene;
    const { resolved: resolvedStyle } = cleanupStyleSection(sectionMap.style, sceneContent);
    sectionMap.style = resolvedStyle;

    const finalImageResolved = assembleResolvedPrompt(sectionMap, 'image_app');
    const finalVideoResolved = assembleResolvedPrompt(sectionMap, 'video_app');

    const conflictsAfterImage = detectConflictsInPrompt(finalImageResolved);
    const conflictsAfterVideo = detectConflictsInPrompt(finalVideoResolved);
    const sourceConflictsAfter = new Set([...conflictsAfterImage, ...conflictsAfterVideo]).size;
    totalConflictsAfter += sourceConflictsAfter;

    const resolutionRatio =
      sourceConflictsBefore > 0
        ? (sourceConflictsBefore - sourceConflictsAfter) / sourceConflictsBefore
        : 1;

    const conflictResolutionReady =
      sourceConflictsAfter === 0 && resolutionRatio === 1 ? 'PASS' : 'FAIL';

    if (conflictResolutionReady === 'FAIL') {
      issues.push({
        code: 'SOURCE_CONFLICTS_REMAIN',
        message: `Unresolved conflicts remain for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    resolvedPromptTemplates.push({
      template_id: `resolved_prompt_${sourceVideoId.toLowerCase()}_v1`,
      source_video_id: sourceVideoId,
      assembly_id: assembled.assembly_id,
      final_image_prompt_resolved: finalImageResolved,
      final_video_prompt_resolved: finalVideoResolved,
      resolved_sections: sectionMap,
      conflicts_resolved: sourceConflictsBefore - sourceConflictsAfter,
      planning_only: true,
      generation: false,
    });

    resolvedRuntimeMappings.push(
      ...buildResolvedRuntimeMappings(
        bindingReport.adapter_runtime_bindings,
        sourceVideoId,
        resolvedStyle
      )
    );

    sourceAudits.push({
      source_video_id: sourceVideoId,
      conflicts_before: sourceConflictsBefore,
      conflicts_after: sourceConflictsAfter,
      resolution_ratio: resolutionRatio,
      conflict_resolution_ready: conflictResolutionReady,
    });
  }

  const conflictsBefore = conflictingPromptTerms.length;
  const conflictsAfter = totalConflictsAfter;
  const resolutionRatio =
    conflictsBefore > 0 ? (conflictsBefore - conflictsAfter) / conflictsBefore : 1;

  if (conflictsAfter !== 0) {
    issues.push({
      code: 'CONFLICTS_REMAIN',
      message: `Expected conflicts_after=0, got ${conflictsAfter}`,
      severity: 'error',
    });
  }

  if (resolutionRatio !== 1) {
    issues.push({
      code: 'RESOLUTION_RATIO_INCOMPLETE',
      message: `Expected resolution_ratio=1, got ${resolutionRatio}`,
      severity: 'error',
    });
  }

  const safetyValid =
    qualityGateReport.planning_only === true &&
    qualityGateReport.planning_only_status === 'PASS' &&
    qualityGateReport.generation === false &&
    qualityGateReport.gpu_execution === false &&
    qualityGateReport.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: ResolutionStatus = safetyValid ? 'PASS' : 'FAIL';

  const promptConflictResolutionReady =
    qualityGateReport.source_count === EXPECTED_SOURCE_COUNT &&
    qualityGateReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    resolvedPromptTemplates.length === EXPECTED_SOURCE_COUNT &&
    resolvedRuntimeMappings.length === EXPECTED_ADAPTER_COUNT &&
    conflictsBefore > 0 &&
    conflictsAfter === 0 &&
    resolutionRatio === 1 &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.conflict_resolution_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = promptConflictResolutionReady === 'PASS';

  const report: MovieAnalysisPromptConflictResolutionReport = {
    report_id: 'movie-analysis-prompt-conflict-resolution-report-v1',
    phase: PROMPT_CONFLICT_RESOLUTION_PHASE,
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
    prompt_quality_gate_report_path: PROMPT_QUALITY_GATE_REPORT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    conflicting_prompt_terms: conflictingPromptTerms,
    conflict_category_detections: conflictCategoryDetections,
    conflict_resolution_rules: CONFLICT_RESOLUTION_RULES,
    priority_rules: PRIORITY_RULES,
    prompt_cleanup_rules: PROMPT_CLEANUP_RULES,
    resolved_prompt_templates: resolvedPromptTemplates,
    resolved_runtime_mappings: resolvedRuntimeMappings,
    conflict_resolution_metrics: {
      conflicts_before: conflictsBefore,
      conflicts_after: conflictsAfter,
      resolution_ratio: resolutionRatio,
    },
    prompt_conflict_resolution_ready: promptConflictResolutionReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT
      : PROMPT_CONFLICT_RESOLUTION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PROMPT_CONFLICT_RESOLUTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PROMPT_CONFLICT_RESOLUTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PROMPT_CONFLICT_RESOLUTION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
