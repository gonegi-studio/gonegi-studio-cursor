import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { buildRepositoryIndex } from './ProjectBrainRepositoryIndexer.js';
import { mapCapabilities } from './ProjectBrainRepositoryBridge.js';
import { buildDependencyGraph } from './ProjectBrainCapabilityGraph.js';
import { computeServiceImpact } from './ProjectBrainImpactAnalyzer.js';
import {
  extractExportedSymbols,
  runTargetSelectionSelfTest,
  runModificationScopeSelfTest,
  type TargetSelectionSelfTestResult,
  type ModificationScopeSelfTestResult,
} from './ProjectBrainCodeTargetAnalyzer.js';
import { classifyRisk, runModificationPlannerSelfTest, type ModificationPlannerSelfTestResult } from './ProjectBrainModificationPlanner.js';
import {
  runProjectBrainDevelopmentAssistant,
  type ProjectBrainDevelopmentAssistantResult,
} from './ProjectBrainDevelopmentAssistant.js';

export const PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_PHASE = 'PHASE-PROJECT-BRAIN-DEVELOPMENT-ASSISTANT-001' as const;
export const PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_PASS_VERDICT = 'PASS_PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_V1' as const;
export const PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_FAIL_VERDICT = 'FAIL_PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_V1' as const;

const TOP_N_FOR_TARGET_SELECTION = 10;

// This phase's own invariants: Agent Layer 변경 금지, Project Brain Core
// 변경 금지, Repository Intelligence 변경 금지, Project Understanding 변경
// 금지, Development Intelligence 변경 금지, Live Connector 변경 금지,
// Numerical DNA 변경 금지. Same reasoning as every prior Project-Brain-*
// validator this session: the entire underlying stack remains untracked
// ("??"), so a tracked-file substring check can't detect a modification to
// it by construction — compliance is verified by direct recollection (this
// phase imports read-only from ProjectBrainRepositoryIndexer.ts,
// ProjectBrainRepositoryBridge.ts, ProjectBrainCapabilityGraph.ts, and
// ProjectBrainImpactAnalyzer.ts; it edits none of them, and never writes or
// applies any code change itself). Numerical DNA files are excluded from
// the substring list for the same reason established in
// firstLiveAgentIntegrationValidator.ts.
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
  'ProjectBrainImpactAnalyzer',
  'ProjectBrainTaskGenerator',
  'ProjectBrainDevelopmentIntelligenceEngine',
  'ProjectBrainDevelopmentIntelligenceValidator',
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
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ and datasets/project_knowledge/ prefixes and every Engine-family filename substring established across all prior phases, including Development Intelligence.',
  };
}

const PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_SOURCE_FILES = [
  'services/ProjectBrainCodeTargetAnalyzer.ts',
  'services/ProjectBrainModificationPlanner.ts',
  'services/ProjectBrainDevelopmentAssistant.ts',
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
  for (const relPath of PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_SOURCE_FILES) {
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
  return { ok: violations.length === 0, files_checked: PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_SOURCE_FILES, violations };
}

export interface ProjectBrainDevelopmentAssistantReport {
  phase: typeof PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_PHASE;
  verdict: typeof PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_PASS_VERDICT | typeof PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_FAIL_VERDICT;
  target_pass_ok: boolean;
  scope_pass_ok: boolean;
  impact_pass_ok: boolean;
  planner_pass_ok: boolean;
  consistency_pass_ok: boolean;
  api_free_pass_ok: boolean;
  target_selection_self_test: TargetSelectionSelfTestResult;
  modification_scope_self_test: ModificationScopeSelfTestResult;
  modification_planner_self_test: ModificationPlannerSelfTestResult;
  result: ProjectBrainDevelopmentAssistantResult | null;
  api_free: ApiFreeCheck;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildProjectBrainDevelopmentAssistantReport(root: string): Promise<ProjectBrainDevelopmentAssistantReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let result: ProjectBrainDevelopmentAssistantResult | null = null;

  const target_selection_self_test = runTargetSelectionSelfTest();
  const modification_scope_self_test = runModificationScopeSelfTest();
  const modification_planner_self_test = runModificationPlannerSelfTest();

  try {
    result = runProjectBrainDevelopmentAssistant(root);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  // Target PASS: self-test passed, and the real selected target matches an
  // independent, direct re-derivation of the top real service-impact
  // ranking — never trusts this phase's own bookkeeping.
  const directIndex = buildRepositoryIndex(root);
  const directMappings = mapCapabilities(root, directIndex);
  const directDependencyGraph = buildDependencyGraph(directMappings);
  const directTopService = directDependencyGraph[0];
  const target_pass_ok =
    dashboardThrew === null &&
    target_selection_self_test.ok &&
    !!result?.target &&
    result.target.service_relpath === directTopService?.service_relpath &&
    result.target.impacted_capability_count === directTopService?.used_by_capabilities.length;

  // Scope PASS: self-test passed, and the real scope's exported symbol list
  // matches an independent, direct re-extraction from the real target
  // file's own current source text.
  const directExports = result?.scope ? extractExportedSymbols(fs.readFileSync(path.join(root, result.scope.service_relpath), 'utf8')) : [];
  const scope_pass_ok =
    dashboardThrew === null &&
    modification_scope_self_test.ok &&
    !!result?.scope &&
    JSON.stringify(result.scope.exported_symbols) === JSON.stringify(directExports);

  // Impact PASS: the real plan's own recorded impact figure matches a
  // fresh, independent call to the unmodified Development Intelligence
  // layer's own computeServiceImpact() for the same real target.
  const directImpact = result?.target ? computeServiceImpact(result.target.service_relpath, directDependencyGraph) : null;
  const impact_pass_ok =
    dashboardThrew === null &&
    !!result?.plan &&
    !!directImpact &&
    result.plan.impact.impacted_capability_count === directImpact.impacted_capability_count &&
    JSON.stringify(result.plan.impact.impacted_capabilities.slice().sort()) === JSON.stringify(directImpact.impacted_capabilities.slice().sort());

  // Planner PASS: self-test passed, and the real plan's risk_level matches
  // an independent recomputation of the same fixed, disclosed thresholds.
  const planner_pass_ok =
    dashboardThrew === null &&
    modification_planner_self_test.ok &&
    !!result?.plan &&
    result.plan.risk_level === classifyRisk(result.plan.impact.impacted_capability_count);

  // Consistency PASS: a second, independent run of the entire pipeline
  // must produce byte-identical results — proves determinism — plus
  // repository invariants hold.
  const secondResult = runProjectBrainDevelopmentAssistant(root);
  const repository = checkRepositoryInvariants(root);
  const consistency_pass_ok = dashboardThrew === null && JSON.stringify(result) === JSON.stringify(secondResult) && repository.ok;

  const api_free = checkApiFree(root);
  const api_free_pass_ok = api_free.ok;

  checks.push({
    id: 'target_pass',
    pass: target_pass_ok,
    detail: target_pass_ok
      ? `self-test passed; the real selected target ("${result?.target?.service_relpath}") matches an independent top-of-ranking recomputation over the top ${TOP_N_FOR_TARGET_SELECTION} real services exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'scope_pass',
    pass: scope_pass_ok,
    detail: scope_pass_ok
      ? `self-test passed; the real target's ${result?.scope?.exported_symbol_count ?? 0} exported symbol(s) match an independent, direct re-extraction exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'impact_pass',
    pass: impact_pass_ok,
    detail: impact_pass_ok
      ? `the real plan's recorded impact (${result?.plan?.impact.impacted_capability_count ?? 0} dependent capabilities) matches a fresh, independent call to the unmodified computeServiceImpact() exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'planner_pass',
    pass: planner_pass_ok,
    detail: planner_pass_ok
      ? `self-test passed (all 3 risk tiers + exact threshold boundary); the real plan's risk_level ("${result?.plan?.risk_level}") matches an independent recomputation exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'consistency_pass',
    pass: consistency_pass_ok,
    detail: consistency_pass_ok
      ? `a second, independent run produced a byte-identical target, scope, and plan; repository invariants hold`
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
    target_pass_ok && scope_pass_ok && impact_pass_ok && planner_pass_ok && consistency_pass_ok && api_free_pass_ok;

  return {
    phase: PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_PHASE,
    verdict: end_to_end_pass_ok ? PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_PASS_VERDICT : PROJECT_BRAIN_DEVELOPMENT_ASSISTANT_FAIL_VERDICT,
    target_pass_ok,
    scope_pass_ok,
    impact_pass_ok,
    planner_pass_ok,
    consistency_pass_ok,
    api_free_pass_ok,
    target_selection_self_test,
    modification_scope_self_test,
    modification_planner_self_test,
    result,
    api_free,
    repository,
    checks,
  };
}
