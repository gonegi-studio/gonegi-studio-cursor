import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { loadPbrpKnowledgeRepository } from '../services/pbrpKnowledgeRepository.js';
import { analyzeIntent } from '../services/pbrpIntentAnalyzer.js';
import { selectKnowledge } from '../services/pbrpKnowledgeSelector.js';
import { composeKnowledge } from '../services/pbrpKnowledgeComposer.js';
import { planPrompt } from '../services/pbrpPromptPlanner.js';
import { optimizePrompt } from '../services/pbrpPromptOptimizer.js';
import { getAiAdapter } from '../services/pbrpAiAdapter.js';
import { runPbrpRuntimeExecutionPreparation } from '../services/pbrpRuntimeOrchestrator.js';

/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-006: PBRP Runtime Validation V1.
 *
 * Real stability validation of the PHASE-005 Runtime Skeleton -- per-module
 * unit checks for all 7 components, plus multi-scenario / multi-source
 * integration checks, determinism, PASS->PASS regression, failure/partial
 * output blocking, and API-free confirmation. No network call, no external
 * API; real data only (Titanic + Spirited Away movie-reconstruction
 * registries).
 */

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const issues: string[] = [];
const results: Record<string, unknown> = {};

function check(label: string, condition: boolean, detail?: string): void {
  results[label] = condition ? 'PASS' : `FAIL${detail ? `: ${detail}` : ''}`;
  if (!condition) {
    issues.push(`${label}${detail ? ` -- ${detail}` : ''}`);
  }
}

// =========================================================================
// 1. Intent Analyzer -- unit tests against known inputs (exact expectation,
//    not just "truthy")
// =========================================================================
{
  const t1 = analyzeIntent('A scene full of freedom, romance and wonder, set in bright clear daylight.');
  check('intent_analyzer.emotion_match', JSON.stringify(t1.emotion_query.sort()) === JSON.stringify(['freedom', 'romance', 'wonder'].sort()), JSON.stringify(t1.emotion_query));
  check('intent_analyzer.lighting_day_clear', t1.lighting_query.time_of_day === 'day' && t1.lighting_query.weather === 'clear');
  check('intent_analyzer.confidence_full', t1.confidence_score === 1, `got ${t1.confidence_score}`);
  check('intent_analyzer.no_missing', t1.missing_capabilities.length === 0, JSON.stringify(t1.missing_capabilities));

  const t2 = analyzeIntent('A quiet abstract scene about mathematics and geometry.');
  check('intent_analyzer.no_emotion_match', t2.emotion_query.length === 0);
  check('intent_analyzer.missing_character_style_shot', JSON.stringify(t2.missing_capabilities.sort()) === JSON.stringify(['character', 'shot', 'style'].sort()), JSON.stringify(t2.missing_capabilities));
  check('intent_analyzer.lighting_unspecified', t2.required_capabilities.includes('lighting') === false, 'lighting should not be required when no lighting keyword is present');

  const t3 = analyzeIntent(t1.raw_input);
  check('intent_analyzer.deterministic_id', t1.intent_id === t3.intent_id, `${t1.intent_id} vs ${t3.intent_id}`);
}

// =========================================================================
// 2. Knowledge Selector -- unit tests against real repository fixtures,
//    exact expected id (not just non-null)
// =========================================================================
{
  const titanicRepo = loadPbrpKnowledgeRepository(projectRoot, 'titanic');
  const intent = analyzeIntent('A scene full of freedom, romance and wonder.');
  const selection = selectKnowledge(titanicRepo, intent);
  check('knowledge_selector.titanic_exact_character', selection.character?.anchor_id === 'titanic_bow_pose', selection.character?.anchor_id);
  check('knowledge_selector.titanic_style_resolved', selection.style !== null);
  check('knowledge_selector.titanic_shot_resolved', selection.shot !== null);
  check('knowledge_selector.titanic_no_unresolved', selection.unresolved_capabilities.length === 0, JSON.stringify(selection.unresolved_capabilities));

  const spiritedRepo = loadPbrpKnowledgeRepository(projectRoot, 'spirited_away');
  const intent2 = analyzeIntent('A scene full of wonder and disorientation, bathhouse arrival.');
  const selection2 = selectKnowledge(spiritedRepo, intent2);
  check('knowledge_selector.spirited_exact_character', selection2.character?.anchor_id === 'bathhouse_arrival', selection2.character?.anchor_id);

  const emptyIntent = analyzeIntent('mathematics and geometry');
  const emptySelection = selectKnowledge(titanicRepo, emptyIntent);
  check('knowledge_selector.reports_unresolved_on_no_match', emptySelection.unresolved_capabilities.includes('character'), JSON.stringify(emptySelection.unresolved_capabilities));
}

// =========================================================================
// 3. Knowledge Composer -- unit tests, exact field checks
// =========================================================================
{
  const titanicRepo = loadPbrpKnowledgeRepository(projectRoot, 'titanic');
  const intent = analyzeIntent('A tenderness and longing farewell scene at golden hour, with grief and impermanence, gentle rain in the air.');
  const selection = selectKnowledge(titanicRepo, intent);
  const context = composeKnowledge(selection, intent.lighting_query);

  check('knowledge_composer.character_applied', context.character_dna_applied === (selection.character !== null));
  check('knowledge_composer.lighting_label_consistent', !(context.lighting.time_of_day !== 'unspecified' && context.lighting.descriptor === 'neutral, balanced natural light'), `time_of_day=${context.lighting.time_of_day} descriptor="${context.lighting.descriptor}"`);
  check('knowledge_composer.world_identity_lock_pass', context.consistency.world_identity_lock === 'PASS');
  check('knowledge_composer.negative_rules_present', context.negative_rules.length > 0);
  check('knowledge_composer.negative_rules_include_harbor_rule', context.negative_rules.includes('no generic harbor drift'));

  // Unresolved-selection input must not silently fabricate applied=true.
  const emptySelection = selectKnowledge(titanicRepo, analyzeIntent('mathematics and geometry'));
  const emptyContext = composeKnowledge(emptySelection, { time_of_day: 'unspecified', weather: 'unspecified' });
  check('knowledge_composer.unresolved_not_fabricated', emptyContext.character_dna_applied === false && emptyContext.character_summary === null);
}

// =========================================================================
// 4. Prompt Planner -- unit tests, section id/order + content propagation
// =========================================================================
{
  const titanicRepo = loadPbrpKnowledgeRepository(projectRoot, 'titanic');
  const intent = analyzeIntent('A scene full of freedom, romance and wonder, set in bright clear daylight.');
  const selection = selectKnowledge(titanicRepo, intent);
  const context = composeKnowledge(selection, intent.lighting_query);
  const plan = planPrompt(context);

  const EXPECTED_ORDER = ['scene', 'camera', 'emotion', 'style', 'continuity', 'negative'];
  check('prompt_planner.section_order', JSON.stringify(plan.sections.map((s) => s.section_id)) === JSON.stringify(EXPECTED_ORDER), JSON.stringify(plan.sections.map((s) => s.section_id)));
  check('prompt_planner.section_order_field_matches_array_position', plan.sections.every((s, i) => s.section_order === i));

  const sceneSection = plan.sections.find((s) => s.section_id === 'scene');
  check('prompt_planner.character_propagated_to_scene', !!sceneSection && selection.character !== null && sceneSection.content.includes(selection.character.anchor_id), sceneSection?.content);

  const styleSection = plan.sections.find((s) => s.section_id === 'style');
  check('prompt_planner.style_propagated', !!styleSection && selection.style !== null && styleSection.content.includes(selection.style.composition_id), styleSection?.content);

  const cameraSection = plan.sections.find((s) => s.section_id === 'camera');
  check('prompt_planner.shot_propagated', !!cameraSection && selection.shot !== null && cameraSection.content.includes(selection.shot.shot_id), cameraSection?.content);
}

// =========================================================================
// 5. Prompt Optimizer -- unit test with a deliberately duplicated plan
// =========================================================================
{
  const duplicatedPlan = {
    sections: [
      { section_id: 'scene' as const, section_order: 0, content: 'wonder, wonder, freedom' },
      { section_id: 'camera' as const, section_order: 1, content: 'wide shot' },
      { section_id: 'emotion' as const, section_order: 2, content: 'joy' },
      { section_id: 'style' as const, section_order: 3, content: 'narrative' },
      { section_id: 'continuity' as const, section_order: 4, content: 'lock' },
      { section_id: 'negative' as const, section_order: 5, content: 'no generic harbor drift, no generic harbor drift' },
    ],
    plan_mode: 'deterministic_structure_v1' as const,
  };
  const optimized = optimizePrompt(duplicatedPlan);
  const sceneOut = optimized.sections.find((s) => s.section_id === 'scene')!.content;
  check('prompt_optimizer.dedupes_within_section', sceneOut === 'wonder, freedom', sceneOut);
  const negativeOut = optimized.sections.find((s) => s.section_id === 'negative')!.content;
  check('prompt_optimizer.dedupes_negative_section', negativeOut === 'no generic harbor drift', negativeOut);
  check('prompt_optimizer.reduction_ratio_positive', optimized.metrics.reduction_ratio > 0, `${optimized.metrics.reduction_ratio}`);
  check('prompt_optimizer.negative_excluded_from_positive_text', !optimized.positive_text.includes('no generic harbor drift'));
}

// =========================================================================
// 6. AI Adapter -- unit tests
// =========================================================================
{
  const adapter = getAiAdapter('ai_studio');
  check('ai_adapter.ai_studio_registered', adapter !== null);
  check('ai_adapter.unknown_consumer_returns_null', getAiAdapter('nonexistent_consumer_xyz') === null);

  if (adapter) {
    const titanicRepo = loadPbrpKnowledgeRepository(projectRoot, 'titanic');
    const intent = analyzeIntent('A scene full of freedom, romance and wonder, set in bright clear daylight.');
    const selection = selectKnowledge(titanicRepo, intent);
    const context = composeKnowledge(selection, intent.lighting_query);
    const plan = planPrompt(context);
    const optimized = optimizePrompt(plan);
    const final = adapter.adapt(optimized, context);
    check('ai_adapter.consumer_id_correct', final.consumer_id === 'ai_studio');
    check('ai_adapter.positive_prompt_nonempty', final.positive_prompt.trim().length > 0);
    check('ai_adapter.metadata_flags_match_context', final.metadata.character_dna_applied === context.character_dna_applied && final.metadata.style_dna_applied === context.style_dna_applied && final.metadata.shot_grammar_applied === context.shot_grammar_applied);
  }
}

// =========================================================================
// 7. Runtime Orchestrator -- multi-scenario, multi-source integration
// =========================================================================
type Scenario = { label: string; input: string; source: 'titanic' | 'spirited_away'; expectPass: boolean };
const SCENARIOS: Scenario[] = [
  { label: 'titanic_bow_pose', input: 'A scene full of freedom, romance and wonder, set in bright clear daylight.', source: 'titanic', expectPass: true },
  { label: 'titanic_sunset_rail', input: 'A tenderness and longing farewell scene at golden hour, with grief and impermanence, gentle rain in the air.', source: 'titanic', expectPass: true },
  { label: 'spirited_bathhouse', input: 'A scene full of wonder and disorientation, bathhouse arrival at night.', source: 'spirited_away', expectPass: true },
  { label: 'spirited_bridge', input: 'A scene of awe, fear and determination, crossing the bridge.', source: 'spirited_away', expectPass: true },
  { label: 'no_capability_match', input: 'A quiet abstract scene about mathematics and geometry.', source: 'titanic', expectPass: false },
];

const scenarioResults: Record<string, unknown> = {};
for (const scenario of SCENARIOS) {
  const runs = Array.from({ length: 5 }, () => runPbrpRuntimeExecutionPreparation(projectRoot, scenario.input, 'ai_studio', scenario.source));
  const serialized = runs.map((r) => JSON.stringify(r));
  const allIdentical = serialized.every((s) => s === serialized[0]);
  check(`orchestrator.${scenario.label}.deterministic_5x`, allIdentical, 'repeated runs of the same input produced different output');

  const first = runs[0];
  check(`orchestrator.${scenario.label}.pass_matches_expectation`, first.pass === scenario.expectPass, `pass=${first.pass}, expected=${scenario.expectPass}`);

  if (scenario.expectPass) {
    check(`orchestrator.${scenario.label}.character_applied`, first.final_prompt?.metadata.character_dna_applied === true);
    check(`orchestrator.${scenario.label}.style_applied`, first.final_prompt?.metadata.style_dna_applied === true);
    check(`orchestrator.${scenario.label}.shot_applied`, first.final_prompt?.metadata.shot_grammar_applied === true);
    // Traceability: the character id selected must appear, unbroken, in the
    // final positive prompt (proves propagation end to end, not just a
    // "some text was produced" check).
    const charId = first.selection?.character?.anchor_id;
    check(`orchestrator.${scenario.label}.character_id_traceable_to_final_prompt`, !!charId && !!first.final_prompt?.positive_prompt.includes(charId), charId);
  } else {
    // Failure / Partial Output 차단: on failure, no downstream artifact may
    // be non-null -- the pipeline must not leak a partially-built result.
    check(`orchestrator.${scenario.label}.no_partial_scene_context`, first.scene_context === null);
    check(`orchestrator.${scenario.label}.no_partial_prompt_plan`, first.prompt_plan === null);
    check(`orchestrator.${scenario.label}.no_partial_optimized_plan`, first.optimized_plan === null);
    check(`orchestrator.${scenario.label}.no_partial_final_prompt`, first.final_prompt === null);
    check(`orchestrator.${scenario.label}.error_recorded`, first.error !== null && first.error.module === 'knowledge_selection', JSON.stringify(first.error));
    const skipped = first.trace.filter((t) => t.status === 'SKIPPED');
    check(`orchestrator.${scenario.label}.downstream_stages_skipped`, skipped.length > 0);
  }

  scenarioResults[scenario.label] = { pass: first.pass, deterministic_5x: allIdentical, trace: first.trace };
}

// Cross-scenario distinctness: different real inputs against different real
// sources must not collapse onto the same selection (proves this isn't
// hardcoded / a fixed fallback).
{
  const titanicRun = scenarioResults['titanic_bow_pose'] as { trace: unknown };
  const spiritedRun = scenarioResults['spirited_bathhouse'] as { trace: unknown };
  check('orchestrator.cross_source_distinct_traces', JSON.stringify(titanicRun.trace) !== JSON.stringify(spiritedRun.trace));
}

// --- Repository-load failure path (a second, distinct failure mode from
// "no matching capability") -- confirm it also stops cleanly with no
// partial output. -------------------------------------------------------
{
  const badRoot = path.join(projectRoot, 'this-directory-does-not-exist-pbrp-006');
  const failedRun = runPbrpRuntimeExecutionPreparation(badRoot, 'A scene full of freedom, romance and wonder.', 'ai_studio', 'titanic');
  check('orchestrator.repository_load_failure.pass_false', failedRun.pass === false);
  check('orchestrator.repository_load_failure.error_module_correct', failedRun.error?.module === 'repository_load', failedRun.error?.module);
  check('orchestrator.repository_load_failure.no_partial_output', failedRun.intent === null && failedRun.selection === null && failedRun.final_prompt === null);
}

// --- Unknown consumer failure path (third distinct failure mode) --------
{
  const unknownConsumerRun = runPbrpRuntimeExecutionPreparation(projectRoot, 'A scene full of freedom, romance and wonder.', 'nonexistent_consumer_xyz', 'titanic');
  check('orchestrator.unknown_consumer.pass_false', unknownConsumerRun.pass === false);
  check('orchestrator.unknown_consumer.error_module_correct', unknownConsumerRun.error?.module === 'ai_adapt', unknownConsumerRun.error?.module);
  check('orchestrator.unknown_consumer.final_prompt_null', unknownConsumerRun.final_prompt === null);
  // Upstream artifacts *should* exist here -- the pipeline reached ai_adapt
  // legitimately; only the adapt stage itself and beyond must be absent.
  check('orchestrator.unknown_consumer.upstream_artifacts_present', unknownConsumerRun.scene_context !== null && unknownConsumerRun.optimized_plan !== null);
}

// =========================================================================
// API-Free confirmation (structural scan across all 8 pipeline files)
// =========================================================================
{
  const pbrpServiceFiles = [
    'services/pbrpKnowledgeRepository.ts',
    'services/pbrpIntentAnalyzer.ts',
    'services/pbrpKnowledgeSelector.ts',
    'services/pbrpKnowledgeComposer.ts',
    'services/pbrpPromptPlanner.ts',
    'services/pbrpPromptOptimizer.ts',
    'services/pbrpAiAdapter.ts',
    'services/pbrpRuntimeOrchestrator.ts',
  ];
  const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY/i;
  for (const rel of pbrpServiceFiles) {
    const full = path.join(projectRoot, rel);
    const content = fs.readFileSync(full, 'utf8');
    check(`api_free.${rel}`, !apiPattern.test(content));
  }
}

// --- Report ---------------------------------------------------------------
const REPORT_DIR = 'reports/project_brain_integration';
const REPORT_PATH = 'reports/project_brain_integration/pbrp-runtime-validation-v1-report.json';
fs.mkdirSync(path.join(projectRoot, REPORT_DIR), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PROJECT-BRAIN-INTEGRATION-006', generated_at: new Date().toISOString(), results, scenarios: scenarioResults, issues }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PROJECT_BRAIN_INTEGRATION_006_PBRP_RUNTIME_VALIDATION_V1' : 'FAIL_PROJECT_BRAIN_INTEGRATION_006_PBRP_RUNTIME_VALIDATION_V1');
console.log(
  [
    `total_checks=${checkCount}`,
    `pass_count=${checkCount - failCount}`,
    `fail_count=${failCount}`,
    `scenarios=${SCENARIOS.length}`,
    `sources=titanic,spirited_away`,
  ].join(' | ')
);

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[error] ${issue}`);
  }
  process.exit(1);
}

process.exit(0);
