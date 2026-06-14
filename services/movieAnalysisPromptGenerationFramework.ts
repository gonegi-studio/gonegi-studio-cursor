import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT,
  RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
  type AdapterRuntimeBinding,
  type MovieAnalysisRuntimeBindingFrameworkReport,
  type RuntimeBindingCandidate,
  type RuntimeTarget,
} from './movieAnalysisRuntimeBindingFramework.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROMPT_GENERATION_FRAMEWORK_PHASE =
  'PHASE-LEVEL2-002-MOVIE_ANALYSIS_PROMPT_GENERATION_FRAMEWORK_V1' as const;
export const PROMPT_GENERATION_FRAMEWORK_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PROMPT_GENERATION_FRAMEWORK_V1' as const;
export const PROMPT_GENERATION_FRAMEWORK_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PROMPT_GENERATION_FRAMEWORK_V1' as const;
export const PROMPT_GENERATION_FRAMEWORK_DIR =
  'reports/movie_analysis_prompt_generation_framework' as const;
export const PROMPT_GENERATION_FRAMEWORK_REPORT_PATH =
  'reports/movie_analysis_prompt_generation_framework/movie-analysis-prompt-generation-framework-report.json' as const;
export const PROMPT_GENERATION_FRAMEWORK_MD_PATH =
  'reports/movie_analysis_prompt_generation_framework/MOVIE_ANALYSIS_PROMPT_GENERATION_FRAMEWORK.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type GenerationStatus = 'PASS' | 'FAIL';

export type PromptGenerationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type PromptTemplateType =
  | 'scene_prompt_template'
  | 'camera_prompt_template'
  | 'emotion_prompt_template'
  | 'style_prompt_template'
  | 'continuity_prompt_template'
  | 'negative_prompt_template';

export type PromptTemplate = {
  template_id: string;
  template_type: PromptTemplateType;
  template_pattern: string;
  variable_slots: string[];
  planning_only: true;
  generation: false;
};

export type RuntimeTargetPromptMapping = {
  mapping_id: string;
  runtime_target: RuntimeTarget;
  prompt_template_type: PromptTemplateType;
  binding_kind: 'prompt' | 'runtime_rule';
  planning_only: true;
};

export type PromptGenerationCandidate = {
  candidate_id: string;
  source_video_id: string;
  binding_id: string;
  runtime_target: RuntimeTarget;
  prompt_template_type: PromptTemplateType;
  pattern_signature: string;
  prompt_fragment: string;
  planning_only: true;
  generation: false;
};

export type SourcePromptPackage = {
  source_video_id: string;
  prompt_package_id: string;
  scene_prompt: string;
  camera_prompt: string;
  emotion_prompt: string;
  style_prompt: string;
  continuity_prompt: string;
  negative_prompt: string;
  transition_runtime_rule_mapped: boolean;
  narrative_runtime_rule_mapped: boolean;
  traceability_preserved: true;
  planning_only: true;
  generation: false;
};

export type SourcePromptGenerationAudit = {
  source_video_id: string;
  scene_prompt_generated: GenerationStatus;
  camera_prompt_generated: GenerationStatus;
  emotion_prompt_generated: GenerationStatus;
  style_prompt_generated: GenerationStatus;
  continuity_prompt_generated: GenerationStatus;
  negative_prompt_generated: GenerationStatus;
  runtime_targets_mapped: GenerationStatus;
  source_prompt_ready: GenerationStatus;
};

export type MovieAnalysisPromptGenerationFrameworkReport = {
  report_id: string;
  phase: typeof PROMPT_GENERATION_FRAMEWORK_PHASE;
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
  runtime_binding_report_path: typeof RUNTIME_BINDING_FRAMEWORK_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  scene_prompt_template: PromptTemplate;
  camera_prompt_template: PromptTemplate;
  emotion_prompt_template: PromptTemplate;
  style_prompt_template: PromptTemplate;
  continuity_prompt_template: PromptTemplate;
  negative_prompt_template: PromptTemplate;
  runtime_target_prompt_mappings: RuntimeTargetPromptMapping[];
  prompt_generation_candidates: PromptGenerationCandidate[];
  source_prompt_packages: SourcePromptPackage[];
  scene_prompt_generation_complete: GenerationStatus;
  camera_prompt_generation_complete: GenerationStatus;
  emotion_prompt_generation_complete: GenerationStatus;
  style_prompt_generation_complete: GenerationStatus;
  continuity_prompt_generation_complete: GenerationStatus;
  negative_prompt_generation_complete: GenerationStatus;
  runtime_target_mapping_complete: GenerationStatus;
  prompt_generation_framework_ready: GenerationStatus;
  planning_only_status: GenerationStatus;
  source_audits: SourcePromptGenerationAudit[];
  final_verdict:
    | typeof PROMPT_GENERATION_FRAMEWORK_PASS_VERDICT
    | typeof PROMPT_GENERATION_FRAMEWORK_FAIL_VERDICT;
  issues: PromptGenerationIssue[];
};

const PROMPT_TEMPLATES: Record<PromptTemplateType, PromptTemplate> = {
  scene_prompt_template: {
    template_id: 'scene_prompt_template_v1',
    template_type: 'scene_prompt_template',
    template_pattern: 'cinematic scene composition with {scene_signatures}',
    variable_slots: ['scene_signatures'],
    planning_only: true,
    generation: false,
  },
  camera_prompt_template: {
    template_id: 'camera_prompt_template_v1',
    template_type: 'camera_prompt_template',
    template_pattern: 'camera framing and movement: {camera_signatures}',
    variable_slots: ['camera_signatures'],
    planning_only: true,
    generation: false,
  },
  emotion_prompt_template: {
    template_id: 'emotion_prompt_template_v1',
    template_type: 'emotion_prompt_template',
    template_pattern: 'emotional tone and expression: {emotion_signatures}',
    variable_slots: ['emotion_signatures'],
    planning_only: true,
    generation: false,
  },
  style_prompt_template: {
    template_id: 'style_prompt_template_v1',
    template_type: 'style_prompt_template',
    template_pattern: 'visual narrative style: {narrative_signatures} with transitions {transition_signatures}',
    variable_slots: ['narrative_signatures', 'transition_signatures'],
    planning_only: true,
    generation: false,
  },
  continuity_prompt_template: {
    template_id: 'continuity_prompt_template_v1',
    template_type: 'continuity_prompt_template',
    template_pattern: 'scene continuity and environment hold: {continuity_signatures}',
    variable_slots: ['continuity_signatures'],
    planning_only: true,
    generation: false,
  },
  negative_prompt_template: {
    template_id: 'negative_prompt_template_v1',
    template_type: 'negative_prompt_template',
    template_pattern:
      'no runtime execution, no gpu rendering, no actual image generation, no actual video generation, planning only estimated output',
    variable_slots: [],
    planning_only: true,
    generation: false,
  },
};

const RUNTIME_TARGET_PROMPT_MAPPINGS: RuntimeTargetPromptMapping[] = [
  {
    mapping_id: 'map-scene-prompt',
    runtime_target: 'scene_prompt',
    prompt_template_type: 'scene_prompt_template',
    binding_kind: 'prompt',
    planning_only: true,
  },
  {
    mapping_id: 'map-camera-prompt',
    runtime_target: 'camera_prompt',
    prompt_template_type: 'camera_prompt_template',
    binding_kind: 'prompt',
    planning_only: true,
  },
  {
    mapping_id: 'map-emotion-prompt',
    runtime_target: 'emotion_prompt',
    prompt_template_type: 'emotion_prompt_template',
    binding_kind: 'prompt',
    planning_only: true,
  },
  {
    mapping_id: 'map-transition-runtime-rule',
    runtime_target: 'transition_runtime_rule',
    prompt_template_type: 'style_prompt_template',
    binding_kind: 'runtime_rule',
    planning_only: true,
  },
  {
    mapping_id: 'map-continuity-runtime-rule',
    runtime_target: 'continuity_runtime_rule',
    prompt_template_type: 'continuity_prompt_template',
    binding_kind: 'runtime_rule',
    planning_only: true,
  },
  {
    mapping_id: 'map-narrative-runtime-rule',
    runtime_target: 'narrative_runtime_rule',
    prompt_template_type: 'style_prompt_template',
    binding_kind: 'runtime_rule',
    planning_only: true,
  },
];

function loadRuntimeBindingReport(
  projectRoot: string
): MovieAnalysisRuntimeBindingFrameworkReport | null {
  const abs = path.join(projectRoot, RUNTIME_BINDING_FRAMEWORK_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRuntimeBindingFrameworkReport;
}

function uniqueSignatures(
  candidates: RuntimeBindingCandidate[],
  sourceVideoId: string,
  runtimeTarget: RuntimeTarget
): string[] {
  const signatures = candidates
    .filter(
      (candidate) =>
        candidate.source_video_id === sourceVideoId &&
        candidate.runtime_target === runtimeTarget
    )
    .map((candidate) => candidate.pattern_signature);
  return [...new Set(signatures)];
}

function applyTemplate(template: PromptTemplate, values: Record<string, string>): string {
  let result = template.template_pattern;
  for (const slot of template.variable_slots) {
    result = result.replace(`{${slot}}`, values[slot] ?? '');
  }
  return result.trim();
}

function buildPromptFragment(signature: string, runtimeTarget: RuntimeTarget): string {
  return `${runtimeTarget}:${signature}`;
}

function buildCandidatesForSource(
  bindingReport: MovieAnalysisRuntimeBindingFrameworkReport,
  sourceVideoId: string
): PromptGenerationCandidate[] {
  const candidates: PromptGenerationCandidate[] = [];
  const seen = new Set<string>();

  for (const bindingCandidate of bindingReport.runtime_binding_candidates) {
    if (bindingCandidate.source_video_id !== sourceVideoId) {
      continue;
    }

    const mapping = RUNTIME_TARGET_PROMPT_MAPPINGS.find(
      (entry) => entry.runtime_target === bindingCandidate.runtime_target
    );
    if (!mapping) {
      continue;
    }

    const dedupeKey = `${bindingCandidate.pattern_signature}:${bindingCandidate.runtime_target}:${mapping.prompt_template_type}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    candidates.push({
      candidate_id: `prompt_gen_${sourceVideoId.toLowerCase()}_${bindingCandidate.runtime_target}_${bindingCandidate.pattern_signature}`,
      source_video_id: sourceVideoId,
      binding_id: bindingCandidate.binding_id,
      runtime_target: bindingCandidate.runtime_target,
      prompt_template_type: mapping.prompt_template_type,
      pattern_signature: bindingCandidate.pattern_signature,
      prompt_fragment: buildPromptFragment(
        bindingCandidate.pattern_signature,
        bindingCandidate.runtime_target
      ),
      planning_only: true,
      generation: false,
    });
  }

  return candidates;
}

function buildSourcePromptPackage(
  bindingReport: MovieAnalysisRuntimeBindingFrameworkReport,
  sourceVideoId: string,
  bindings: AdapterRuntimeBinding[]
): SourcePromptPackage {
  const sourceBindings = bindings.filter((binding) => binding.source_video_id === sourceVideoId);
  const sceneSignatures = uniqueSignatures(
    bindingReport.runtime_binding_candidates,
    sourceVideoId,
    'scene_prompt'
  );
  const cameraSignatures = uniqueSignatures(
    bindingReport.runtime_binding_candidates,
    sourceVideoId,
    'camera_prompt'
  );
  const emotionSignatures = uniqueSignatures(
    bindingReport.runtime_binding_candidates,
    sourceVideoId,
    'emotion_prompt'
  );
  const transitionSignatures = uniqueSignatures(
    bindingReport.runtime_binding_candidates,
    sourceVideoId,
    'transition_runtime_rule'
  );
  const continuitySignatures = uniqueSignatures(
    bindingReport.runtime_binding_candidates,
    sourceVideoId,
    'continuity_runtime_rule'
  );
  const narrativeSignatures = uniqueSignatures(
    bindingReport.runtime_binding_candidates,
    sourceVideoId,
    'narrative_runtime_rule'
  );

  return {
    source_video_id: sourceVideoId,
    prompt_package_id: `prompt_package_${sourceVideoId.toLowerCase()}_v1`,
    scene_prompt: applyTemplate(PROMPT_TEMPLATES.scene_prompt_template, {
      scene_signatures: sceneSignatures.join(', '),
    }),
    camera_prompt: applyTemplate(PROMPT_TEMPLATES.camera_prompt_template, {
      camera_signatures: cameraSignatures.join(', '),
    }),
    emotion_prompt: applyTemplate(PROMPT_TEMPLATES.emotion_prompt_template, {
      emotion_signatures: emotionSignatures.join(', '),
    }),
    style_prompt: applyTemplate(PROMPT_TEMPLATES.style_prompt_template, {
      narrative_signatures: narrativeSignatures.join(', '),
      transition_signatures: transitionSignatures.join(', '),
    }),
    continuity_prompt: applyTemplate(PROMPT_TEMPLATES.continuity_prompt_template, {
      continuity_signatures: continuitySignatures.join(', '),
    }),
    negative_prompt: PROMPT_TEMPLATES.negative_prompt_template.template_pattern,
    transition_runtime_rule_mapped: transitionSignatures.length > 0,
    narrative_runtime_rule_mapped: narrativeSignatures.length > 0,
    traceability_preserved: true,
    planning_only: true,
    generation: false,
  };
}

function auditSourcePromptPackage(
  sourceVideoId: string,
  promptPackage: SourcePromptPackage | undefined,
  bindings: AdapterRuntimeBinding[]
): SourcePromptGenerationAudit {
  const sourceBindings = bindings.filter((binding) => binding.source_video_id === sourceVideoId);

  if (!promptPackage || sourceBindings.length !== 6) {
    return {
      source_video_id: sourceVideoId,
      scene_prompt_generated: 'FAIL',
      camera_prompt_generated: 'FAIL',
      emotion_prompt_generated: 'FAIL',
      style_prompt_generated: 'FAIL',
      continuity_prompt_generated: 'FAIL',
      negative_prompt_generated: 'FAIL',
      runtime_targets_mapped: 'FAIL',
      source_prompt_ready: 'FAIL',
    };
  }

  const sceneGenerated = promptPackage.scene_prompt.length > 0 ? 'PASS' : 'FAIL';
  const cameraGenerated = promptPackage.camera_prompt.length > 0 ? 'PASS' : 'FAIL';
  const emotionGenerated = promptPackage.emotion_prompt.length > 0 ? 'PASS' : 'FAIL';
  const styleGenerated =
    promptPackage.style_prompt.length > 0 &&
    promptPackage.transition_runtime_rule_mapped &&
    promptPackage.narrative_runtime_rule_mapped
      ? 'PASS'
      : 'FAIL';
  const continuityGenerated = promptPackage.continuity_prompt.length > 0 ? 'PASS' : 'FAIL';
  const negativeGenerated = promptPackage.negative_prompt.length > 0 ? 'PASS' : 'FAIL';
  const runtimeTargetsMapped =
    promptPackage.transition_runtime_rule_mapped && promptPackage.narrative_runtime_rule_mapped
      ? 'PASS'
      : 'FAIL';

  const statuses = [
    sceneGenerated,
    cameraGenerated,
    emotionGenerated,
    styleGenerated,
    continuityGenerated,
    negativeGenerated,
    runtimeTargetsMapped,
  ];

  return {
    source_video_id: sourceVideoId,
    scene_prompt_generated: sceneGenerated,
    camera_prompt_generated: cameraGenerated,
    emotion_prompt_generated: emotionGenerated,
    style_prompt_generated: styleGenerated,
    continuity_prompt_generated: continuityGenerated,
    negative_prompt_generated: negativeGenerated,
    runtime_targets_mapped: runtimeTargetsMapped,
    source_prompt_ready: statuses.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourcePromptGenerationAudit[],
  field: keyof Pick<
    SourcePromptGenerationAudit,
    | 'scene_prompt_generated'
    | 'camera_prompt_generated'
    | 'emotion_prompt_generated'
    | 'style_prompt_generated'
    | 'continuity_prompt_generated'
    | 'negative_prompt_generated'
    | 'runtime_targets_mapped'
  >
): GenerationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisPromptGenerationFrameworkReport): string {
  const lines = [
    '# Movie Analysis Prompt Generation Framework',
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
    `| no_execution | ${report.no_execution} |`,
    '',
    '## Prompt Templates',
    '',
    '| Template | Pattern |',
    '| --- | --- |',
    `| scene_prompt_template | ${report.scene_prompt_template.template_pattern} |`,
    `| camera_prompt_template | ${report.camera_prompt_template.template_pattern} |`,
    `| emotion_prompt_template | ${report.emotion_prompt_template.template_pattern} |`,
    `| style_prompt_template | ${report.style_prompt_template.template_pattern} |`,
    `| continuity_prompt_template | ${report.continuity_prompt_template.template_pattern} |`,
    `| negative_prompt_template | ${report.negative_prompt_template.template_pattern} |`,
    '',
    '## Runtime Target Mappings',
    '',
  ];

  for (const mapping of report.runtime_target_prompt_mappings) {
    lines.push(
      `- ${mapping.runtime_target} → ${mapping.prompt_template_type} [${mapping.binding_kind}]`
    );
  }

  lines.push('', '## Summary', '');
  lines.push(
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| prompt_generation_candidates | ${report.prompt_generation_candidates.length} |`,
    `| source_prompt_packages | ${report.source_prompt_packages.length} |`,
    `| scene_prompt_generation_complete | ${report.scene_prompt_generation_complete} |`,
    `| camera_prompt_generation_complete | ${report.camera_prompt_generation_complete} |`,
    `| emotion_prompt_generation_complete | ${report.emotion_prompt_generation_complete} |`,
    `| style_prompt_generation_complete | ${report.style_prompt_generation_complete} |`,
    `| continuity_prompt_generation_complete | ${report.continuity_prompt_generation_complete} |`,
    `| negative_prompt_generation_complete | ${report.negative_prompt_generation_complete} |`,
    `| runtime_target_mapping_complete | ${report.runtime_target_mapping_complete} |`,
    `| prompt_generation_framework_ready | ${report.prompt_generation_framework_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_prompt_generated: ${audit.scene_prompt_generated}`,
      `- camera_prompt_generated: ${audit.camera_prompt_generated}`,
      `- emotion_prompt_generated: ${audit.emotion_prompt_generated}`,
      `- style_prompt_generated: ${audit.style_prompt_generated}`,
      `- continuity_prompt_generated: ${audit.continuity_prompt_generated}`,
      `- negative_prompt_generated: ${audit.negative_prompt_generated}`,
      `- runtime_targets_mapped: ${audit.runtime_targets_mapped}`,
      `- source_prompt_ready: ${audit.source_prompt_ready}`,
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
  issues: PromptGenerationIssue[]
): MovieAnalysisPromptGenerationFrameworkReport {
  const emptyTemplate = PROMPT_TEMPLATES.scene_prompt_template;
  const report: MovieAnalysisPromptGenerationFrameworkReport = {
    report_id: 'movie-analysis-prompt-generation-framework-report-v1',
    phase: PROMPT_GENERATION_FRAMEWORK_PHASE,
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
    runtime_binding_report_path: RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    scene_prompt_template: emptyTemplate,
    camera_prompt_template: emptyTemplate,
    emotion_prompt_template: emptyTemplate,
    style_prompt_template: emptyTemplate,
    continuity_prompt_template: emptyTemplate,
    negative_prompt_template: emptyTemplate,
    runtime_target_prompt_mappings: [],
    prompt_generation_candidates: [],
    source_prompt_packages: [],
    scene_prompt_generation_complete: 'FAIL',
    camera_prompt_generation_complete: 'FAIL',
    emotion_prompt_generation_complete: 'FAIL',
    style_prompt_generation_complete: 'FAIL',
    continuity_prompt_generation_complete: 'FAIL',
    negative_prompt_generation_complete: 'FAIL',
    runtime_target_mapping_complete: 'FAIL',
    prompt_generation_framework_ready: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: PROMPT_GENERATION_FRAMEWORK_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PROMPT_GENERATION_FRAMEWORK_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PROMPT_GENERATION_FRAMEWORK_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PROMPT_GENERATION_FRAMEWORK_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisPromptGenerationFrameworkReport(
  projectRoot?: string
): MovieAnalysisPromptGenerationFrameworkReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: PromptGenerationIssue[] = [];
  const timestamp = new Date().toISOString();

  const bindingReport = loadRuntimeBindingReport(root);
  if (!bindingReport) {
    issues.push({
      code: 'RUNTIME_BINDING_REPORT_MISSING',
      message: `Missing ${RUNTIME_BINDING_FRAMEWORK_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (bindingReport.final_verdict !== RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT) {
    issues.push({
      code: 'RUNTIME_BINDING_NOT_PASS',
      message: `Runtime binding framework must have ${RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (bindingReport.runtime_binding_framework_ready !== 'PASS') {
    issues.push({
      code: 'RUNTIME_BINDING_NOT_READY',
      message: 'Runtime binding framework is not ready',
      severity: 'error',
    });
  }

  const promptGenerationCandidates: PromptGenerationCandidate[] = [];
  const sourcePromptPackages: SourcePromptPackage[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const candidates = buildCandidatesForSource(bindingReport, sourceVideoId);
    promptGenerationCandidates.push(...candidates);

    const promptPackage = buildSourcePromptPackage(
      bindingReport,
      sourceVideoId,
      bindingReport.adapter_runtime_bindings
    );
    sourcePromptPackages.push(promptPackage);
  }

  const sourceAudits = EXPECTED_SOURCE_VIDEO_IDS.map((sourceVideoId) => {
    const promptPackage = sourcePromptPackages.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const audit = auditSourcePromptPackage(
      sourceVideoId,
      promptPackage,
      bindingReport.adapter_runtime_bindings
    );

    if (audit.source_prompt_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_PROMPT_NOT_READY',
        message: `Prompt generation failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    return audit;
  });

  const scenePromptGenerationComplete = aggregateStatus(sourceAudits, 'scene_prompt_generated');
  const cameraPromptGenerationComplete = aggregateStatus(sourceAudits, 'camera_prompt_generated');
  const emotionPromptGenerationComplete = aggregateStatus(sourceAudits, 'emotion_prompt_generated');
  const stylePromptGenerationComplete = aggregateStatus(sourceAudits, 'style_prompt_generated');
  const continuityPromptGenerationComplete = aggregateStatus(
    sourceAudits,
    'continuity_prompt_generated'
  );
  const negativePromptGenerationComplete = aggregateStatus(
    sourceAudits,
    'negative_prompt_generated'
  );

  const runtimeTargetMappingComplete =
    RUNTIME_TARGET_PROMPT_MAPPINGS.length === 6 &&
    RUNTIME_TARGET_PROMPT_MAPPINGS.every((mapping) =>
      bindingReport.adapter_runtime_bindings.some(
        (binding) => binding.runtime_target === mapping.runtime_target
      )
    ) &&
    sourceAudits.every((audit) => audit.runtime_targets_mapped === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (runtimeTargetMappingComplete === 'FAIL') {
    issues.push({
      code: 'RUNTIME_TARGET_MAPPING_INCOMPLETE',
      message: 'Runtime target to prompt template mapping is incomplete',
      severity: 'error',
    });
  }

  const safetyValid =
    bindingReport.planning_only === true &&
    bindingReport.planning_only_status === 'PASS' &&
    bindingReport.generation === false &&
    bindingReport.gpu_execution === false &&
    bindingReport.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: GenerationStatus = safetyValid ? 'PASS' : 'FAIL';

  const generationChecks = [
    scenePromptGenerationComplete,
    cameraPromptGenerationComplete,
    emotionPromptGenerationComplete,
    stylePromptGenerationComplete,
    continuityPromptGenerationComplete,
    negativePromptGenerationComplete,
    runtimeTargetMappingComplete,
    planningOnlyStatus,
  ];

  const promptGenerationFrameworkReady =
    bindingReport.source_count === EXPECTED_SOURCE_COUNT &&
    bindingReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    sourcePromptPackages.length === EXPECTED_SOURCE_COUNT &&
    promptGenerationCandidates.length > 0 &&
    generationChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_prompt_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = promptGenerationFrameworkReady === 'PASS';

  const report: MovieAnalysisPromptGenerationFrameworkReport = {
    report_id: 'movie-analysis-prompt-generation-framework-report-v1',
    phase: PROMPT_GENERATION_FRAMEWORK_PHASE,
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
    runtime_binding_report_path: RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    scene_prompt_template: PROMPT_TEMPLATES.scene_prompt_template,
    camera_prompt_template: PROMPT_TEMPLATES.camera_prompt_template,
    emotion_prompt_template: PROMPT_TEMPLATES.emotion_prompt_template,
    style_prompt_template: PROMPT_TEMPLATES.style_prompt_template,
    continuity_prompt_template: PROMPT_TEMPLATES.continuity_prompt_template,
    negative_prompt_template: PROMPT_TEMPLATES.negative_prompt_template,
    runtime_target_prompt_mappings: RUNTIME_TARGET_PROMPT_MAPPINGS,
    prompt_generation_candidates: promptGenerationCandidates,
    source_prompt_packages: sourcePromptPackages,
    scene_prompt_generation_complete: scenePromptGenerationComplete,
    camera_prompt_generation_complete: cameraPromptGenerationComplete,
    emotion_prompt_generation_complete: emotionPromptGenerationComplete,
    style_prompt_generation_complete: stylePromptGenerationComplete,
    continuity_prompt_generation_complete: continuityPromptGenerationComplete,
    negative_prompt_generation_complete: negativePromptGenerationComplete,
    runtime_target_mapping_complete: runtimeTargetMappingComplete,
    prompt_generation_framework_ready: promptGenerationFrameworkReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? PROMPT_GENERATION_FRAMEWORK_PASS_VERDICT
      : PROMPT_GENERATION_FRAMEWORK_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PROMPT_GENERATION_FRAMEWORK_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PROMPT_GENERATION_FRAMEWORK_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PROMPT_GENERATION_FRAMEWORK_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
