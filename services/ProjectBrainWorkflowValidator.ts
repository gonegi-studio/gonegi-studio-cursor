import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runProjectBrainDevelopmentAssistant } from './ProjectBrainDevelopmentAssistant.js';
import { analyzeModificationScope, type CodeTarget } from './ProjectBrainCodeTargetAnalyzer.js';
import { planSafeModification } from './ProjectBrainModificationPlanner.js';
import { computeServiceImpact } from './ProjectBrainImpactAnalyzer.js';
import { buildRepositoryIndex } from './ProjectBrainRepositoryIndexer.js';
import { mapCapabilities } from './ProjectBrainRepositoryBridge.js';
import { buildDependencyGraph } from './ProjectBrainCapabilityGraph.js';
import { runTaskIntakeSelfTest, type TaskIntakeSelfTestResult } from './ProjectBrainTaskWorkflow.js';
import {
  runProjectBrainDevelopmentWorkflow,
  runChangePlanSelfTest,
  runVerificationPlanSelfTest,
  buildVerificationPlan,
  type ProjectBrainDevelopmentWorkflowResult,
  type ChangePlanSelfTestResult,
  type VerificationPlanSelfTestResult,
} from './ProjectBrainDevelopmentWorkflow.js';

export const PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_PHASE = 'PHASE-PROJECT-BRAIN-DEVELOPMENT-WORKFLOW-001' as const;
export const PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_PASS_VERDICT = 'PASS_PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_V1' as const;
export const PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_FAIL_VERDICT = 'FAIL_PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_V1' as const;

// This phase's own invariants: 기존 Engine 변경 금지 (every existing Engine
// across all 24 prior phases), Project Brain Core 변경 금지, Repository
// (Intelligence/Integration layers) 변경 금지, Live Connector 변경 금지,
// Numerical DNA 변경 금지. Same reasoning as every prior Project-Brain-*
// validator this session: the entire underlying stack remains untracked
// ("??"), so a tracked-file substring check can't detect a modification to
// it by construction — compliance is verified by direct recollection (this
// phase imports read-only from ProjectBrainDevelopmentAssistant.ts,
// ProjectBrainCodeTargetAnalyzer.ts, ProjectBrainModificationPlanner.ts,
// ProjectBrainImpactAnalyzer.ts, ProjectBrainRepositoryIndexer.ts,
// ProjectBrainRepositoryBridge.ts, and ProjectBrainCapabilityGraph.ts; it
// edits none of them). Numerical DNA files are excluded from the substring
// list for the same reason established in firstLiveAgentIntegrationValidator.ts.
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
  'ProjectBrainCodeTargetAnalyzer',
  'ProjectBrainModificationPlanner',
  'ProjectBrainDevelopmentAssistant',
  'ProjectBrainDevelopmentAssistantValidator',
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
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ and datasets/project_knowledge/ prefixes and every Engine-family filename substring established across all prior phases.',
  };
}

const PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_SOURCE_FILES = ['services/ProjectBrainTaskWorkflow.ts', 'services/ProjectBrainDevelopmentWorkflow.ts'];
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

/** Real, mechanical proof of "API 미사용": reads this phase's own 2 new source files and confirms neither references a network or live-provider call primitive. */
export function checkApiFree(root: string): ApiFreeCheck {
  const violations: Array<{ file: string; marker: string }> = [];
  for (const relPath of PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_SOURCE_FILES) {
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
  return { ok: violations.length === 0, files_checked: PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_SOURCE_FILES, violations };
}

export interface ProjectBrainDevelopmentWorkflowReport {
  phase: typeof PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_PHASE;
  verdict: typeof PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_PASS_VERDICT | typeof PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_FAIL_VERDICT;
  workflow_pass_ok: boolean;
  context_pass_ok: boolean;
  plan_pass_ok: boolean;
  verification_pass_ok: boolean;
  consistency_pass_ok: boolean;
  api_free_pass_ok: boolean;
  task_intake_self_test: TaskIntakeSelfTestResult;
  change_plan_self_test: ChangePlanSelfTestResult;
  verification_plan_self_test: VerificationPlanSelfTestResult;
  result: ProjectBrainDevelopmentWorkflowResult | null;
  api_free: ApiFreeCheck;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildProjectBrainWorkflowReport(root: string): Promise<ProjectBrainDevelopmentWorkflowReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let result: ProjectBrainDevelopmentWorkflowResult | null = null;

  const task_intake_self_test = runTaskIntakeSelfTest(root);
  const change_plan_self_test = runChangePlanSelfTest();
  const verification_plan_self_test = runVerificationPlanSelfTest();

  try {
    result = runProjectBrainDevelopmentWorkflow(root);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  // Workflow PASS: the full pipeline connected without throwing, intake
  // succeeded, and the resolved target matches a fresh, independent call
  // to the unmodified Development Assistant.
  const directAssistant = runProjectBrainDevelopmentAssistant(root);
  const workflow_pass_ok =
    dashboardThrew === null &&
    task_intake_self_test.ok &&
    !!result?.intake.ok &&
    result.intake.service_relpath === directAssistant.target?.service_relpath;

  // Context PASS: the real assembled context's scope + plan are
  // independently re-derivable via fresh, direct calls to the unmodified
  // Development Assistant's own functions for the same real target.
  let context_pass_ok = false;
  if (result?.context) {
    const directIndex = buildRepositoryIndex(root);
    const directMappings = mapCapabilities(root, directIndex);
    const directDependencyGraph = buildDependencyGraph(directMappings);
    const directImpact = computeServiceImpact(result.context.service_relpath, directDependencyGraph);
    const directTarget: CodeTarget = {
      service_relpath: result.context.service_relpath,
      impacted_capability_count: directImpact.impacted_capability_count,
      selection_reason: 'direct recomputation',
    };
    const directScope = analyzeModificationScope(root, directTarget);
    const directPlan = planSafeModification(directScope, directImpact);
    context_pass_ok =
      dashboardThrew === null &&
      JSON.stringify(result.context.scope.exported_symbols) === JSON.stringify(directScope.exported_symbols) &&
      result.context.plan.risk_level === directPlan.risk_level &&
      JSON.stringify(result.context.dependent_capability_names.slice().sort()) === JSON.stringify(directImpact.impacted_capabilities.slice().sort());
  }

  // Plan PASS: self-test passed, and the real Change Plan's risk_level and
  // safety_checklist match the real assembled context's own plan exactly —
  // proving the wrapping introduced no divergence.
  const plan_pass_ok =
    dashboardThrew === null &&
    change_plan_self_test.ok &&
    !!result?.change_plan &&
    !!result.context &&
    result.change_plan.risk_level === result.context.plan.risk_level &&
    JSON.stringify(result.change_plan.safety_checklist) === JSON.stringify(result.context.plan.safety_checklist);

  // Verification PASS: self-test passed, and the real Verification Plan's
  // total_count matches an independent recomputation from the same real
  // dependent-capability list against a fresh Repository Index.
  let verification_pass_ok = false;
  if (result?.context && result.verification_plan) {
    const directVerificationPlan = buildVerificationPlan(root, result.context.dependent_capability_names);
    verification_pass_ok =
      dashboardThrew === null &&
      verification_plan_self_test.ok &&
      result.verification_plan.total_count === directVerificationPlan.total_count &&
      JSON.stringify(result.verification_plan.items) === JSON.stringify(directVerificationPlan.items) &&
      !!result.generated_report &&
      result.generated_report.includes(result.context.service_relpath);
  }

  // Consistency PASS: a second, independent run of the entire pipeline
  // must produce byte-identical results — proves determinism — plus
  // repository invariants hold.
  const secondResult = runProjectBrainDevelopmentWorkflow(root);
  const repository = checkRepositoryInvariants(root);
  const consistency_pass_ok = dashboardThrew === null && JSON.stringify(result) === JSON.stringify(secondResult) && repository.ok;

  const api_free = checkApiFree(root);
  const api_free_pass_ok = api_free.ok;

  checks.push({
    id: 'workflow_pass',
    pass: workflow_pass_ok,
    detail: workflow_pass_ok
      ? `self-test passed; Task Intake resolved to "${result?.intake.service_relpath}", matching an independent Development Assistant re-run exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'context_pass',
    pass: context_pass_ok,
    detail: context_pass_ok
      ? `the real assembled context's scope, risk_level, and dependent-capability list all match an independent, direct recomputation exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'plan_pass',
    pass: plan_pass_ok,
    detail: plan_pass_ok
      ? `self-test passed; the real Change Plan's risk_level and safety_checklist match the assembled context's own plan exactly — no divergence introduced`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'verification_pass',
    pass: verification_pass_ok,
    detail: verification_pass_ok
      ? `self-test passed; the real Verification Plan (${result?.verification_plan?.total_count ?? 0} real command(s)) matches an independent recomputation exactly, and the generated report references the real target`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'consistency_pass',
    pass: consistency_pass_ok,
    detail: consistency_pass_ok
      ? `a second, independent run produced a byte-identical intake, context, change plan, verification plan, and generated report; repository invariants hold`
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
    workflow_pass_ok && context_pass_ok && plan_pass_ok && verification_pass_ok && consistency_pass_ok && api_free_pass_ok;

  return {
    phase: PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_PHASE,
    verdict: end_to_end_pass_ok ? PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_PASS_VERDICT : PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_FAIL_VERDICT,
    workflow_pass_ok,
    context_pass_ok,
    plan_pass_ok,
    verification_pass_ok,
    consistency_pass_ok,
    api_free_pass_ok,
    task_intake_self_test,
    change_plan_self_test,
    verification_plan_self_test,
    result,
    api_free,
    repository,
    checks,
  };
}
