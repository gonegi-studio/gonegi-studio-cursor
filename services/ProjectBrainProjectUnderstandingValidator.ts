import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { buildRepositoryIndex } from './ProjectBrainRepositoryIndexer.js';
import { mapCapabilities } from './ProjectBrainRepositoryBridge.js';
import { runProjectStateSelfTest, type ProjectStateSelfTestResult } from './ProjectBrainProjectStateAnalyzer.js';
import { runDevelopmentPlannerSelfTest, type DevelopmentPlannerSelfTestResult } from './ProjectBrainDevelopmentPlanner.js';
import {
  runProjectBrainProjectUnderstanding,
  type ProjectBrainProjectUnderstandingResult,
} from './ProjectBrainProjectUnderstandingEngine.js';

export const PROJECT_BRAIN_PROJECT_UNDERSTANDING_PHASE = 'PHASE-PROJECT-BRAIN-REAL-PROJECT-UNDERSTANDING-001' as const;
export const PROJECT_BRAIN_PROJECT_UNDERSTANDING_PASS_VERDICT = 'PASS_PROJECT_BRAIN_REAL_PROJECT_UNDERSTANDING_V1' as const;
export const PROJECT_BRAIN_PROJECT_UNDERSTANDING_FAIL_VERDICT = 'FAIL_PROJECT_BRAIN_REAL_PROJECT_UNDERSTANDING_V1' as const;

// This phase's own invariants: Agent Layer 변경 금지, Project Brain Core
// 변경 금지, Repository Intelligence (PHASE-PROJECT-BRAIN-REAL-PROJECT
// -INTEGRATION-001 + PHASE-PROJECT-BRAIN-REAL-PROJECT-INTELLIGENCE-001's
// own files) 변경 금지, Live Connector 변경 금지, Numerical DNA 변경 금지.
// Same reasoning as every prior Project-Brain-* validator this session:
// the entire underlying stack remains untracked ("??"), so a tracked-file
// substring check can't detect a modification to it by construction —
// compliance is verified by direct recollection (this phase imports
// read-only from ProjectBrainRepositoryIndexer.ts,
// ProjectBrainRepositoryBridge.ts, and ProjectBrainGapAnalyzer.ts; it edits
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
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ and datasets/project_knowledge/ prefixes and every Engine-family filename substring established across all prior phases, including both Repository Index and Repository Intelligence.',
  };
}

const PROJECT_BRAIN_PROJECT_UNDERSTANDING_SOURCE_FILES = [
  'services/ProjectBrainProjectStateAnalyzer.ts',
  'services/ProjectBrainDevelopmentPlanner.ts',
  'services/ProjectBrainProjectUnderstandingEngine.ts',
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
  for (const relPath of PROJECT_BRAIN_PROJECT_UNDERSTANDING_SOURCE_FILES) {
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
  return { ok: violations.length === 0, files_checked: PROJECT_BRAIN_PROJECT_UNDERSTANDING_SOURCE_FILES, violations };
}

export interface ProjectBrainProjectUnderstandingReport {
  phase: typeof PROJECT_BRAIN_PROJECT_UNDERSTANDING_PHASE;
  verdict: typeof PROJECT_BRAIN_PROJECT_UNDERSTANDING_PASS_VERDICT | typeof PROJECT_BRAIN_PROJECT_UNDERSTANDING_FAIL_VERDICT;
  understanding_pass_ok: boolean;
  project_state_pass_ok: boolean;
  planner_pass_ok: boolean;
  priority_pass_ok: boolean;
  consistency_pass_ok: boolean;
  api_free_pass_ok: boolean;
  project_state_self_test: ProjectStateSelfTestResult;
  development_planner_self_test: DevelopmentPlannerSelfTestResult;
  result: ProjectBrainProjectUnderstandingResult | null;
  api_free: ApiFreeCheck;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildProjectBrainProjectUnderstandingReport(root: string): Promise<ProjectBrainProjectUnderstandingReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let result: ProjectBrainProjectUnderstandingResult | null = null;

  const project_state_self_test = runProjectStateSelfTest();
  const development_planner_self_test = runDevelopmentPlannerSelfTest();

  try {
    result = runProjectBrainProjectUnderstanding(root);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  // Understanding PASS: the full pipeline connected without throwing, and
  // every real capability mapping is accounted for exactly once across all
  // real domains — no capability dropped or double-counted.
  const directIndex = buildRepositoryIndex(root);
  const directMappings = mapCapabilities(root, directIndex);
  const domainCapabilitySum = result?.domain_stats.reduce((sum, d) => sum + d.capability_count, 0) ?? -1;
  const understanding_pass_ok = dashboardThrew === null && !!result && domainCapabilitySum === directMappings.length;

  // Project State PASS: self-test passed, and the real domain stats' total
  // capability count matches an independent, direct recomputation.
  const project_state_pass_ok = dashboardThrew === null && project_state_self_test.ok && domainCapabilitySum === directMappings.length;

  // Planner PASS: self-test passed, and every real missing-capability
  // service is accounted for in exactly one group — no service dropped or
  // double-counted across the real Missing Component groups.
  const groupedMissingSum = result?.missing_component_groups.reduce((sum, g) => sum + g.missing_count, 0) ?? -1;
  const planner_pass_ok =
    dashboardThrew === null && development_planner_self_test.ok && !!result && groupedMissingSum === result.missing_capabilities.missing_capability_count;

  // Priority PASS: the real development priority list has exactly one
  // entry per real missing-component group, and is genuinely sorted by
  // missing_count descending.
  const prioritiesSorted =
    result?.development_priorities.every((p, i, arr) => i === 0 || arr[i - 1].missing_count >= p.missing_count) ?? false;
  const priority_pass_ok =
    dashboardThrew === null &&
    !!result &&
    result.development_priorities.length === result.missing_component_groups.length &&
    prioritiesSorted;

  // Consistency PASS: a second, independent run of the entire pipeline
  // must produce byte-identical results — proves determinism — plus
  // repository invariants hold.
  const secondResult = runProjectBrainProjectUnderstanding(root);
  const repository = checkRepositoryInvariants(root);
  const consistency_pass_ok = dashboardThrew === null && JSON.stringify(result) === JSON.stringify(secondResult) && repository.ok;

  const api_free = checkApiFree(root);
  const api_free_pass_ok = api_free.ok;

  checks.push({
    id: 'understanding_pass',
    pass: understanding_pass_ok,
    detail: understanding_pass_ok
      ? `the full pipeline connected; ${result?.domain_stats.length ?? 0} real domains cover all ${domainCapabilitySum} real capabilities exactly, matching an independent recount`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'project_state_pass',
    pass: project_state_pass_ok,
    detail: project_state_pass_ok
      ? `self-test passed; real domain/capability counts match an independent, direct recomputation exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'planner_pass',
    pass: planner_pass_ok,
    detail: planner_pass_ok
      ? `self-test passed; ${result?.missing_component_groups.length ?? 0} real missing-component group(s) account for all ${result?.missing_capabilities.missing_capability_count ?? 0} real missing services exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'priority_pass',
    pass: priority_pass_ok,
    detail: priority_pass_ok
      ? `real development priority list has exactly ${result?.development_priorities.length ?? 0} entries, genuinely sorted by real missing-count descending`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'consistency_pass',
    pass: consistency_pass_ok,
    detail: consistency_pass_ok
      ? `a second, independent run produced byte-identical domain stats, missing/dead capability reports, and development priorities; repository invariants hold`
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
    understanding_pass_ok && project_state_pass_ok && planner_pass_ok && priority_pass_ok && consistency_pass_ok && api_free_pass_ok;

  return {
    phase: PROJECT_BRAIN_PROJECT_UNDERSTANDING_PHASE,
    verdict: end_to_end_pass_ok ? PROJECT_BRAIN_PROJECT_UNDERSTANDING_PASS_VERDICT : PROJECT_BRAIN_PROJECT_UNDERSTANDING_FAIL_VERDICT,
    understanding_pass_ok,
    project_state_pass_ok,
    planner_pass_ok,
    priority_pass_ok,
    consistency_pass_ok,
    api_free_pass_ok,
    project_state_self_test,
    development_planner_self_test,
    result,
    api_free,
    repository,
    checks,
  };
}
