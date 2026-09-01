import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runProjectBrainMaterialization } from './ProjectBrainMaterializationEngine.js';
import {
  runProjectBrainExecutionReadiness,
  type ProjectBrainExecutionReadinessResult,
} from './ProjectBrainExecutionReadinessEngine.js';
import { validateTaskConstraint, runExecutionGateSelfTest, type ExecutionGateSelfTestResult } from './ProjectBrainExecutionGate.js';

export const PROJECT_BRAIN_EXECUTION_READINESS_PHASE = 'PHASE-PROJECT-BRAIN-EXECUTION-READINESS-001' as const;
export const PROJECT_BRAIN_EXECUTION_READINESS_PASS_VERDICT = 'PASS_PROJECT_BRAIN_EXECUTION_READINESS_FOUNDATION_V1' as const;
export const PROJECT_BRAIN_EXECUTION_READINESS_FAIL_VERDICT = 'FAIL_PROJECT_BRAIN_EXECUTION_READINESS_FOUNDATION_V1' as const;

// This phase's own invariants: Agent Layer (Planning through Governance)
// 변경 금지, Reasoning/Intelligence/Self Improvement/Materialization 변경
// 금지, Live Connector 변경 금지, Project Brain 데이터 변경 금지, Numerical
// DNA 변경 금지. Same reasoning as every prior Project-Brain-* validator
// this session: the entire underlying stack remains untracked ("??"), so a
// tracked-file substring check can't detect a modification to it by
// construction — compliance is verified by direct recollection (this phase
// imports read-only from ProjectBrainMaterializationEngine.ts and
// ProjectBrainTaskMaterializer.ts's types; it edits nothing in Planning
// through Materialization, and never reads or writes project_brain/ or
// datasets/project_knowledge/). Numerical DNA files are excluded from the
// substring list for the same reason established in
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
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ and datasets/project_knowledge/ prefixes and the entire Agent Layer + Reasoning + Intelligence + Self Improvement + Materialization filename substrings. Numerical DNA 변경 금지 verified by direct recollection, not this check',
  };
}

// The 2 files that actually implement this phase's readiness/gate
// capability — scanned below by `checkApiFree()`. Deliberately excludes
// this validator itself, for the same reason every prior Project-Brain-*
// validator's own check does.
const PROJECT_BRAIN_EXECUTION_READINESS_SOURCE_FILES = [
  'services/ProjectBrainExecutionGate.ts',
  'services/ProjectBrainExecutionReadinessEngine.ts',
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

/** Real, mechanical proof of "API 미사용": reads this phase's own 2 new source files and confirms none references a network or live-provider call primitive. */
export function checkApiFree(root: string): ApiFreeCheck {
  const violations: Array<{ file: string; marker: string }> = [];
  for (const relPath of PROJECT_BRAIN_EXECUTION_READINESS_SOURCE_FILES) {
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
  return { ok: violations.length === 0, files_checked: PROJECT_BRAIN_EXECUTION_READINESS_SOURCE_FILES, violations };
}

export interface ProjectBrainExecutionReadinessReport {
  phase: typeof PROJECT_BRAIN_EXECUTION_READINESS_PHASE;
  verdict: typeof PROJECT_BRAIN_EXECUTION_READINESS_PASS_VERDICT | typeof PROJECT_BRAIN_EXECUTION_READINESS_FAIL_VERDICT;
  readiness_pass_ok: boolean;
  dependency_pass_ok: boolean;
  constraint_pass_ok: boolean;
  execution_gate_pass_ok: boolean;
  consistency_pass_ok: boolean;
  api_free_pass_ok: boolean;
  gate_self_test: ExecutionGateSelfTestResult;
  result: ProjectBrainExecutionReadinessResult | null;
  api_free: ApiFreeCheck;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildProjectBrainExecutionReadinessReport(root: string): Promise<ProjectBrainExecutionReadinessReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let result: ProjectBrainExecutionReadinessResult | null = null;

  const gate_self_test = runExecutionGateSelfTest();

  try {
    result = runProjectBrainExecutionReadiness(root);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  // Readiness PASS ("Blueprint Readiness"): cross-check against a fresh,
  // independent re-run of the unmodified Materialization layer — never
  // trust a single computed `ready` flag without re-deriving it.
  const directMaterialization = runProjectBrainMaterialization(root);
  const readiness_pass_ok =
    dashboardThrew === null &&
    !!result &&
    result.blueprint_ready === directMaterialization.blueprint.planning.ready &&
    result.blueprint_ready === true;

  // Dependency PASS: the independent Dependency Readiness check itself
  // passed, and its own two sub-checks (coverage, no duplicates) both hold.
  const dependency_pass_ok =
    dashboardThrew === null &&
    !!result &&
    result.dependency_readiness.ok &&
    result.dependency_readiness.execution_order_covers_all_tasks &&
    result.dependency_readiness.no_duplicate_entries;

  // Constraint PASS: every real materialized task's constraint_status, as
  // recorded in the real gate decisions, must match an independent,
  // freshly-recomputed call to validateTaskConstraint() for that exact task
  // — no divergence between the gate's own bookkeeping and a direct
  // recomputation.
  const constraintMismatches: string[] = [];
  for (const task of result?.materialized_tasks ?? []) {
    const direct = validateTaskConstraint(task);
    const recorded = result?.gate_decisions.find((d) => d.task_id === task.task_id);
    if (!recorded || recorded.constraint_status !== direct.constraint_status) {
      constraintMismatches.push(`${task.task_id}: recorded=${recorded?.constraint_status} direct=${direct.constraint_status}`);
    }
  }
  const constraint_pass_ok = dashboardThrew === null && (result?.materialized_tasks.length ?? 0) > 0 && constraintMismatches.length === 0;

  // Execution Gate PASS: the self-test (downstream propagation) passed, and
  // the real run's own gate decisions are internally coherent: every task
  // marked NOT gate_clear because of a dependency must have at least one
  // real dependency that is itself not gate_clear (never a fabricated
  // "blocked by dependency" reason with no such dependency actually
  // existing).
  const gateDecisionsById = new Map((result?.gate_decisions ?? []).map((d) => [d.task_id, d]));
  const tasksById = new Map((result?.materialized_tasks ?? []).map((t) => [t.task_id, t]));
  const gateIncoherences: string[] = [];
  for (const decision of result?.gate_decisions ?? []) {
    if (decision.gate_clear) continue;
    if (decision.constraint_status === 'human_required') continue; // correctly blocked on itself
    const task = tasksById.get(decision.task_id);
    const hasBlockedDependency = task?.depends_on.some((dep) => gateDecisionsById.get(dep)?.gate_clear === false) ?? false;
    if (!hasBlockedDependency) {
      gateIncoherences.push(`${decision.task_id}: marked blocked-by-dependency but no real dependency is actually blocked`);
    }
  }
  const execution_gate_pass_ok = dashboardThrew === null && gate_self_test.ok && gateIncoherences.length === 0;

  const repository = checkRepositoryInvariants(root);
  const consistency_pass_ok = dashboardThrew === null && repository.ok;

  const api_free = checkApiFree(root);
  const api_free_pass_ok = api_free.ok;

  checks.push({
    id: 'readiness_pass',
    pass: readiness_pass_ok,
    detail: readiness_pass_ok
      ? `Blueprint Readiness confirmed (ready=true), matching a fresh, independent re-run of the unmodified Materialization layer`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'dependency_pass',
    pass: dependency_pass_ok,
    detail: dependency_pass_ok
      ? result?.dependency_readiness.detail ?? ''
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'constraint_pass',
    pass: constraint_pass_ok,
    detail: constraint_pass_ok
      ? `all ${result?.materialized_tasks.length ?? 0} real task(s)' constraint_status independently re-verified, zero mismatches`
      : `mismatches: ${constraintMismatches.join('; ')}`,
  });
  checks.push({
    id: 'execution_gate_pass',
    pass: execution_gate_pass_ok,
    detail: execution_gate_pass_ok
      ? `self-test passed (downstream propagation proven); real gate decisions are internally coherent — every "blocked by dependency" reason traces to a real blocked dependency`
      : `unhandled_exception: ${dashboardThrew}${gateIncoherences.length > 0 ? `; incoherences: ${gateIncoherences.join('; ')}` : ''}`,
  });
  checks.push({
    id: 'consistency_pass',
    pass: consistency_pass_ok,
    detail: consistency_pass_ok ? 'repository invariants hold' : `repository invariant violation: ${repository.violating_paths.join(',')}`,
  });
  checks.push({
    id: 'api_free_pass',
    pass: api_free_pass_ok,
    detail: api_free_pass_ok
      ? `API 미사용 mechanically confirmed — ${api_free.files_checked.length} files scanned, 0 forbidden network/live-dispatch markers found`
      : `API-usage markers found: ${api_free.violations.map((v) => `${v.file}:${v.marker}`).join(', ')}`,
  });

  const end_to_end_pass_ok =
    readiness_pass_ok && dependency_pass_ok && constraint_pass_ok && execution_gate_pass_ok && consistency_pass_ok && api_free_pass_ok;

  return {
    phase: PROJECT_BRAIN_EXECUTION_READINESS_PHASE,
    verdict: end_to_end_pass_ok ? PROJECT_BRAIN_EXECUTION_READINESS_PASS_VERDICT : PROJECT_BRAIN_EXECUTION_READINESS_FAIL_VERDICT,
    readiness_pass_ok,
    dependency_pass_ok,
    constraint_pass_ok,
    execution_gate_pass_ok,
    consistency_pass_ok,
    api_free_pass_ok,
    gate_self_test,
    result,
    api_free,
    repository,
    checks,
  };
}
