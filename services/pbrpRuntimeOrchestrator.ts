import { loadPbrpKnowledgeRepository, type MovieSourceId, type PbrpKnowledgeRepository } from './pbrpKnowledgeRepository.js';
import { analyzeIntent, type IntentAnalysisResult } from './pbrpIntentAnalyzer.js';
import { selectKnowledge, type KnowledgeSelection } from './pbrpKnowledgeSelector.js';
import { composeKnowledge, type SceneContext } from './pbrpKnowledgeComposer.js';
import { planPrompt, type PromptPlan } from './pbrpPromptPlanner.js';
import { optimizePrompt, type OptimizedPromptPlan } from './pbrpPromptOptimizer.js';
import { getAiAdapter, type FinalPromptPackage } from './pbrpAiAdapter.js';

/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-005: PBRP Runtime Execution Preparation V1.
 *
 * Runtime Orchestrator (04A_PBRP_Engineering_Recommendations.txt,
 * "Recommendation 01: Runtime Orchestrator", HIGH priority): a single entry
 * point controlling the Execution Pipeline --
 *   Intent Analyzer -> Knowledge Selector -> Knowledge Composer ->
 *   Prompt Planner -> Prompt Optimizer -> AI Adapter
 * with a Pipeline Trace (Recommendation 04) and a structured Error Report
 * (Recommendation 05). On failure, the pipeline stops at that stage and
 * records the cause -- it does not attempt a partial or best-effort result
 * (matches PBRP's own Execution Boundary rule: "AI Studio는 부분 실행을
 * 하지 않는다.").
 */

export type PipelineStageStatus = 'PASS' | 'FAIL' | 'SKIPPED';

export type PipelineTraceEntry = {
  stage: 'repository_load' | 'intent_analysis' | 'knowledge_selection' | 'knowledge_composition' | 'prompt_planning' | 'prompt_optimization' | 'ai_adapt';
  status: PipelineStageStatus;
  detail: string;
};

export type PbrpErrorReport = {
  module: PipelineTraceEntry['stage'];
  error_type: string;
  input_summary: string;
  recommendation: string;
} | null;

export type PbrpRuntimeExecutionResult = {
  pass: boolean;
  consumer_id: string;
  trace: PipelineTraceEntry[];
  error: PbrpErrorReport;
  intent: IntentAnalysisResult | null;
  selection: KnowledgeSelection | null;
  scene_context: SceneContext | null;
  prompt_plan: PromptPlan | null;
  optimized_plan: OptimizedPromptPlan | null;
  final_prompt: FinalPromptPackage | null;
};

function fail(
  trace: PipelineTraceEntry[],
  stage: PipelineTraceEntry['stage'],
  errorType: string,
  inputSummary: string,
  recommendation: string,
  remainingStages: PipelineTraceEntry['stage'][]
): { trace: PipelineTraceEntry[]; error: PbrpErrorReport } {
  trace.push({ stage, status: 'FAIL', detail: errorType });
  for (const s of remainingStages) {
    trace.push({ stage: s, status: 'SKIPPED', detail: 'pipeline stopped at an earlier failed stage' });
  }
  return {
    trace,
    error: { module: stage, error_type: errorType, input_summary: inputSummary, recommendation },
  };
}

const ALL_STAGES: PipelineTraceEntry['stage'][] = [
  'repository_load',
  'intent_analysis',
  'knowledge_selection',
  'knowledge_composition',
  'prompt_planning',
  'prompt_optimization',
  'ai_adapt',
];

function stagesAfter(stage: PipelineTraceEntry['stage']): PipelineTraceEntry['stage'][] {
  const idx = ALL_STAGES.indexOf(stage);
  return ALL_STAGES.slice(idx + 1);
}

export function runPbrpRuntimeExecutionPreparation(
  projectRoot: string,
  rawInput: string,
  consumerId = 'ai_studio',
  source: MovieSourceId = 'titanic'
): PbrpRuntimeExecutionResult {
  const trace: PipelineTraceEntry[] = [];

  let repository: PbrpKnowledgeRepository;
  try {
    repository = loadPbrpKnowledgeRepository(projectRoot, source);
    trace.push({ stage: 'repository_load', status: 'PASS', detail: `source=${repository.source}` });
  } catch (e) {
    const { trace: t, error } = fail(
      trace,
      'repository_load',
      e instanceof Error ? e.message : 'unknown repository load error',
      rawInput,
      'Confirm the Titanic movie-reconstruction registries exist under datasets/movie_reconstruction/.',
      stagesAfter('repository_load')
    );
    return { pass: false, consumer_id: consumerId, trace: t, error, intent: null, selection: null, scene_context: null, prompt_plan: null, optimized_plan: null, final_prompt: null };
  }

  const intent = analyzeIntent(rawInput);
  trace.push({
    stage: 'intent_analysis',
    status: 'PASS',
    detail: `confidence=${intent.confidence_score}, required=[${intent.required_capabilities.join(',')}]`,
  });

  const selection = selectKnowledge(repository, intent);
  if (selection.unresolved_capabilities.length > 0) {
    const { trace: t, error } = fail(
      trace,
      'knowledge_selection',
      'UNRESOLVED_REQUIRED_CAPABILITY',
      `unresolved=[${selection.unresolved_capabilities.join(',')}]`,
      'Broaden the input\'s emotion keywords, or extend EMOTION_KEYWORDS in pbrpIntentAnalyzer.ts to cover this scene.',
      stagesAfter('knowledge_selection')
    );
    return { pass: false, consumer_id: consumerId, trace: t, error, intent, selection, scene_context: null, prompt_plan: null, optimized_plan: null, final_prompt: null };
  }
  trace.push({
    stage: 'knowledge_selection',
    status: 'PASS',
    detail: `character=${selection.character?.anchor_id ?? 'none'}, style=${selection.style?.composition_id ?? 'none'}, shot=${selection.shot?.shot_id ?? 'none'}`,
  });

  const scene_context = composeKnowledge(selection, intent.lighting_query);
  trace.push({
    stage: 'knowledge_composition',
    status: 'PASS',
    detail: `character_dna_applied=${scene_context.character_dna_applied}, style_dna_applied=${scene_context.style_dna_applied}, shot_grammar_applied=${scene_context.shot_grammar_applied}`,
  });

  const prompt_plan = planPrompt(scene_context);
  trace.push({ stage: 'prompt_planning', status: 'PASS', detail: `sections=${prompt_plan.sections.length}` });

  const optimized_plan = optimizePrompt(prompt_plan);
  trace.push({
    stage: 'prompt_optimization',
    status: 'PASS',
    detail: `reduction_ratio=${optimized_plan.metrics.reduction_ratio}`,
  });

  const adapter = getAiAdapter(consumerId);
  if (!adapter) {
    const { trace: t, error } = fail(
      trace,
      'ai_adapt',
      'UNKNOWN_CONSUMER',
      consumerId,
      'Register a new AiAdapter for this consumer_id in pbrpAiAdapter.ts.',
      stagesAfter('ai_adapt')
    );
    return { pass: false, consumer_id: consumerId, trace: t, error, intent, selection, scene_context, prompt_plan, optimized_plan, final_prompt: null };
  }
  const final_prompt = adapter.adapt(optimized_plan, scene_context);
  trace.push({ stage: 'ai_adapt', status: 'PASS', detail: `consumer_id=${final_prompt.consumer_id}` });

  return {
    pass: true,
    consumer_id: consumerId,
    trace,
    error: null,
    intent,
    selection,
    scene_context,
    prompt_plan,
    optimized_plan,
    final_prompt,
  };
}
