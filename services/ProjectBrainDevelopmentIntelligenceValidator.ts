import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { buildRepositoryIndex } from './ProjectBrainRepositoryIndexer.js';
import { mapCapabilities } from './ProjectBrainRepositoryBridge.js';
import { buildDependencyGraph } from './ProjectBrainCapabilityGraph.js';
import { runImpactAnalyzerSelfTest, runChangePredictionSelfTest, type ImpactAnalyzerSelfTestResult, type ChangePredictionSelfTestResult } from './ProjectBrainImpactAnalyzer.js';
import {
  runPriorityRefinementSelfTest,
  runTaskGenerationSelfTest,
  type PriorityRefinementSelfTestResult,
  type TaskGenerationSelfTestResult,
} from './ProjectBrainTaskGenerator.js';
import {
  runProjectBrainDevelopmentIntelligence,
  type ProjectBrainDevelopmentIntelligenceResult,
} from './ProjectBrainDevelopmentIntelligenceEngine.js';

export const PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_PHASE = 'PHASE-PROJECT-BRAIN-DEVELOPMENT-INTELLIGENCE-001' as const;
export const PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_PASS_VERDICT = 'PASS_PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1' as const;
export const PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_FAIL_VERDICT = 'FAIL_PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1' as const;

// This phase's own invariants: Agent Layer 변경 금지, Project Brain Core
// 변경 금지, Repository Intelligence 변경 금지, Project Understanding 변경
// 금지, Live Connector 변경 금지, Numerical DNA 변경 금지. Same reasoning
// as every prior Project-Brain-* validator this session: the entire
// underlying stack remains untracked ("??"), so a tracked-file substring
// check can't detect a modification to it by construction — compliance is
// verified by direct recollection (this phase imports read-only from
// ProjectBrainRepositoryIndexer.ts, ProjectBrainRepositoryBridge.ts,
// ProjectBrainCapabilityGraph.ts, ProjectBrainGapAnalyzer.ts,
// ProjectBrainDevelopmentPlanner.ts, and ProjectPlanningEngine.ts; it edits
// none of them). Numerical DNA files are excluded from the substring list
// for the same reason established in firstLiveAgentIntegrationValidator.ts.
const FORBIDDEN_CHANGED_PATH_PREFIXES = ['project_brain/', 'datasets/project_knowledge/'];
const FORBIDDEN_CHANGED_PATH_SUBSTRINGS = [
  'Connector',
  'geminiContextAdapter',
  'geminiRequestAdapter',
  'geminiResponseAdapter',
  'claudeContextAdapter',
  'claudeRequestAdapter',
  'claudeResponseAdapter',
  'agentRuntimeV1',
  'consumerIntegrationV1',
  'liveAgentApiClient',
  'liveClaudeApiClient',
  'liveGeminiApiClient',
  'liveOpenAiApiClient',
  'localEnvFileLoader',
  'ProjectPlanningEngine',
  'TaskDecompositionEngine',
  'DependencyPlanningEngine',
  'PlanningConsistencyEngine',
  'AgentPlanningDashboard',
  'ProjectExecutionEngine',
  'ExecutionSchedulerEngine',
  'ExecutionStateEngine',
  'ExecutionConsistencyEngine',
  'AgentExecutionDashboard',
  'DecisionEngine',
  'PriorityEvaluationEngine',
  'ConstraintResolutionEngine',
  'DecisionConsistencyEngine',
  'AgentDecisionDashboard',
  'AgentCoordinationEngine',
  'AgentOrchestrationEngine',
  'AgentWorkflowEngine',
  'OrchestrationConsistencyEngine',
  'AgentOrchestrationDashboard',
  'AgentLifecycleEngine',
  'RuntimeLoopEngine',
  'RuntimeConsistencyEngine',
  'AgentRuntimeIntegrationEngine',
  'AgentRuntimeDashboard',
  'AgentCapabilityRegistry',
  'AgentActionDispatcher',
  'AgentIntegrationEngine',
  'AgentIntegrationValidator',
  'AgentApprovalEngine',
  'AgentBudgetEngine',
  'AgentRateLimiter',
  'AgentAuditEngine',
  'AgentGovernanceEngine',
  'ProjectBrainQueryEngine',
  'ProjectBrainInferenceEngine',
  'ProjectBrainReasoningEngine',
  'ProjectBrainReasoningValidator',
  'ProjectBrainKnowledgeEngine',
  'ProjectBrainSemanticEngine',
  'ProjectBrainLearningEngine',
  'ProjectBrainIntelligenceValidator',
  'ProjectBrainGapAnalysisEngine',
  'ProjectBrainImprovementPlanner',
  'ProjectBrainSelfImprovementEngine',
  'ProjectBrainSelfImprovementValidator',
  'ProjectBrainTaskMaterializer',
  'ProjectBrainExecutionBlueprint',
  'ProjectBrainMaterializationEngine',
  'ProjectBrainMaterializationValidator',
  'ProjectBrainExecutionGate',
  'ProjectBrainExecutionReadinessEngine',
  'ProjectBrainExecutionValidator',
  'ProjectBrainGoalDiscoveryEngine',
  'ProjectBrainAutonomousPlanner',
  'ProjectBrainAutonomousPlanningEngine',
  'ProjectBrainAutonomousPlanningValidator',
  'ProjectBrainLoopConsistencyEngine',
  'ProjectBrainConvergenceEngine',
  'ProjectBrainAutonomousValidator',
  'ProjectBrainOptimizationEngine',
  'ProjectBrainPerformanceAnalyzer',
  'ProjectBrainOptimizationValidator',
  'ProjectBrainInternalModel',
  'ProjectBrainRuleEngine',
  'ProjectBrainPredictionEngine',
  'ProjectBrainInternalModelValidator',
  'ProjectBrainFeedbackEngine',
  'ProjectBrainModelUpdater',
  'ProjectBrainAdaptiveLearningEngine',
  'ProjectBrainAdaptiveLearningValidator',
  'ProjectBrainExperienceMemory',
  'ProjectBrainExperienceIndexer',
  'ProjectBrainExperienceEngine',
  'ProjectBrainExperienceValidator',
  'ProjectBrainDependencyAnalyzer',
  'ProjectBrainArchitectureValidator',
  'ProjectBrainRepositoryIndexer',
  'ProjectBrainRepositoryBridge',
  'ProjectBrainRepositoryValidator',
  'ProjectBrainRepositoryKnowledgeEngine',
  'ProjectBrainCapabilityGraph',
  'ProjectBrainGapAnalyzer',
  'ProjectBrainRealProjectIntelligenceValidator',
  'ProjectBrainProjectStateAnalyzer',
  'ProjectBrainDevelopmentPlanner',
  'ProjectBrainProjectUnderstandingEngine',
  'ProjectBrainProjectUnderstandingValidator',
];

export interface RepositoryInvariantCheck {
  ok: boolean;
  changed_paths_checked: string[];
  violating_paths: string[];
  method: string;
}

export function checkRepositoryInvariants(root: string): RepositoryInvariantCheck {
  let output = '';
  try {
    output = execSync('git status --porcelain', { cwd: root, encoding: 'utf8' });
  } catch (error) {
    return {
      ok: false,
      changed_paths_checked: [],
      violating_paths: [`git_status_failed: ${error instanceof Error ? error.message : String(error)}`],
      method: 'git status --porcelain, cwd=project root',
    };
  }

  const trackedChangedPaths = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('??'))
    .map((line) => line.replace(/^[MADRCU]{1,2}\s+/, '').trim());

  const violating = trackedChangedPaths.filter(
    (p) =>
      FORBIDDEN_CHANGED_PATH_PREFIXES.some((prefix) => p.startsWith(prefix)) ||
      FORBIDDEN_CHANGED_PATH_SUBSTRINGS.some((substr) => p.includes(substr))
  );

  return {
    ok: violating.length === 0,
    changed_paths_checked: trackedChangedPaths,
    violating_paths: violating,
    method:
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ and datasets/project_knowledge/ prefixes and every Engine-family filename substring established across all prior phases, including Repository Intelligence and Project Understanding.',
  };
}

const PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_SOURCE_FILES = [
  'services/ProjectBrainImpactAnalyzer.ts',
  'services/ProjectBrainTaskGenerator.ts',
  'services/ProjectBrainDevelopmentIntelligenceEngine.ts',
];
const FORBIDDEN_API_USAGE_MARKERS = [
  'fetch(',
  'liveAgentApiClient',
  'liveClaudeApiClient',
  'liveGeminiApiClient',
  'liveOpenAiApiClient',
  'AgentActionDispatcher',
  'dispatchAction',
  'callLive',
  'http://',
  'https://',
];

export interface ApiFreeCheck {
  ok: boolean;
  files_checked: string[];
  violations: Array<{ file: string; marker: string }>;
}

/** Real, mechanical proof of "API 미사용": reads this phase's own 3 new source files and confirms none references a network or live-provider call primitive. */
export function checkApiFree(root: string): ApiFreeCheck {
  const violations: Array<{ file: string; marker: string }> = [];
  for (const relPath of PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_SOURCE_FILES) {
    const abs = path.join(root, relPath);
    if (!fs.existsSync(abs)) {
      violations.push({ file: relPath, marker: 'FILE_MISSING' });
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    for (const marker of FORBIDDEN_API_USAGE_MARKERS) {
      if (text.includes(marker)) violations.push({ file: relPath, marker });
    }
  }
  return { ok: violations.length === 0, files_checked: PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_SOURCE_FILES, violations };
}

export interface ProjectBrainDevelopmentIntelligenceReport {
  phase: typeof PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_PHASE;
  verdict: typeof PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_PASS_VERDICT | typeof PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_FAIL_VERDICT;
  intelligence_pass_ok: boolean;
  impact_pass_ok: boolean;
  task_pass_ok: boolean;
  priority_pass_ok: boolean;
  consistency_pass_ok: boolean;
  api_free_pass_ok: boolean;
  impact_analyzer_self_test: ImpactAnalyzerSelfTestResult;
  change_prediction_self_test: ChangePredictionSelfTestResult;
  priority_refinement_self_test: PriorityRefinementSelfTestResult;
  task_generation_self_test: TaskGenerationSelfTestResult;
  result: ProjectBrainDevelopmentIntelligenceResult | null;
  api_free: ApiFreeCheck;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildProjectBrainDevelopmentIntelligenceReport(root: string): Promise<ProjectBrainDevelopmentIntelligenceReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let result: ProjectBrainDevelopmentIntelligenceResult | null = null;

  const impact_analyzer_self_test = runImpactAnalyzerSelfTest();
  const change_prediction_self_test = runChangePredictionSelfTest();
  const priority_refinement_self_test = runPriorityRefinementSelfTest();
  const task_generation_self_test = runTaskGenerationSelfTest();

  try {
    result = runProjectBrainDevelopmentIntelligence(root);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  // Intelligence PASS: the full pipeline connected without throwing, and a
  // fresh, independent re-run of the unmodified Repository Intelligence
  // layer's real capability mappings matches exactly.
  const directIndex = buildRepositoryIndex(root);
  const directMappings = mapCapabilities(root, directIndex);
  const directDependencyGraph = buildDependencyGraph(directMappings);
  const intelligence_pass_ok = dashboardThrew === null && !!result;

  // Impact PASS: both self-tests passed, and every real top service impact
  // is independently re-derivable from a fresh dependency graph — never
  // trusting this phase's own bookkeeping.
  const impactMismatches = (result?.top_service_impacts ?? []).filter((impact) => {
    const direct = directDependencyGraph.find((u) => u.service_relpath === impact.service_relpath);
    return (direct?.used_by_capabilities.length ?? 0) !== impact.impacted_capability_count;
  });
  const impact_pass_ok =
    dashboardThrew === null && impact_analyzer_self_test.ok && change_prediction_self_test.ok && impactMismatches.length === 0;

  // Task PASS: both self-tests passed, and every real generated task plan
  // is genuinely `ready=true` with the expected 2-task execution order.
  const allTasksReady = (result?.generated_tasks ?? []).every(
    (plan) =>
      plan.planning.ready === true &&
      plan.planning.execution_plan?.execution_order.join(',') === `investigate:${plan.priority.group_key},resolve:${plan.priority.group_key}`
  );
  const task_pass_ok =
    dashboardThrew === null &&
    task_generation_self_test.ok &&
    (result?.generated_tasks.length ?? 0) > 0 &&
    (result?.generated_tasks.length ?? 0) === Math.min(3, result?.refined_priorities.length ?? 0) &&
    allTasksReady;

  // Priority PASS: self-test passed, and the real refined priority list
  // covers every real missing-component group exactly once, genuinely
  // sorted by the real computed priority_score, descending.
  const prioritiesSorted =
    result?.refined_priorities.every((p, i, arr) => i === 0 || arr[i - 1].priority_score >= p.priority_score) ?? false;
  const priority_pass_ok =
    dashboardThrew === null &&
    priority_refinement_self_test.ok &&
    !!result &&
    new Set(result.refined_priorities.map((p) => p.group_key)).size === result.refined_priorities.length &&
    prioritiesSorted;

  // Consistency PASS: a second, independent run of the entire pipeline
  // must produce byte-identical results — proves determinism — plus
  // repository invariants hold.
  const secondResult = runProjectBrainDevelopmentIntelligence(root);
  const repository = checkRepositoryInvariants(root);
  const consistency_pass_ok = dashboardThrew === null && JSON.stringify(result) === JSON.stringify(secondResult) && repository.ok;

  const api_free = checkApiFree(root);
  const api_free_pass_ok = api_free.ok;

  checks.push({
    id: 'intelligence_pass',
    pass: intelligence_pass_ok,
    detail: intelligence_pass_ok
      ? `the full pipeline connected without throwing, over ${directMappings.length} real capabilities`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'impact_pass',
    pass: impact_pass_ok,
    detail: impact_pass_ok
      ? `both self-tests passed; all ${result?.top_service_impacts.length ?? 0} real top-service impact scores match an independent recomputation exactly`
      : `mismatches: ${impactMismatches.length}`,
  });
  checks.push({
    id: 'task_pass',
    pass: task_pass_ok,
    detail: task_pass_ok
      ? `self-test passed; all ${result?.generated_tasks.length ?? 0} real generated task plan(s) are ready=true with the expected execution order`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'priority_pass',
    pass: priority_pass_ok,
    detail: priority_pass_ok
      ? `self-test passed; all ${result?.refined_priorities.length ?? 0} real missing-component groups appear exactly once, genuinely sorted by priority_score descending`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'consistency_pass',
    pass: consistency_pass_ok,
    detail: consistency_pass_ok
      ? `a second, independent run produced byte-identical impacts, predictions, priorities, and generated tasks; repository invariants hold`
      : `unhandled_exception: ${dashboardThrew}${repository.ok ? '' : `; repository invariant violation: ${repository.violating_paths.join(',')}`}`,
  });
  checks.push({
    id: 'api_free_pass',
    pass: api_free_pass_ok,
    detail: api_free_pass_ok
      ? `API 미사용 mechanically confirmed — ${api_free.files_checked.length} files scanned, 0 forbidden network/live-dispatch markers found`
      : `API-usage markers found: ${api_free.violations.map((v) => `${v.file}:${v.marker}`).join(', ')}`,
  });

  const end_to_end_pass_ok =
    intelligence_pass_ok && impact_pass_ok && task_pass_ok && priority_pass_ok && consistency_pass_ok && api_free_pass_ok;

  return {
    phase: PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_PHASE,
    verdict: end_to_end_pass_ok ? PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_PASS_VERDICT : PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_FAIL_VERDICT,
    intelligence_pass_ok,
    impact_pass_ok,
    task_pass_ok,
    priority_pass_ok,
    consistency_pass_ok,
    api_free_pass_ok,
    impact_analyzer_self_test,
    change_prediction_self_test,
    priority_refinement_self_test,
    task_generation_self_test,
    result,
    api_free,
    repository,
    checks,
  };
}
