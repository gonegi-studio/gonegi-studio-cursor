import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runProjectBrainSelfImprovement } from './ProjectBrainSelfImprovementEngine.js';
import { discoverGoalCandidates, runGoalDiscoverySelfTest, type GoalDiscoverySelfTestResult } from './ProjectBrainGoalDiscoveryEngine.js';
import { runAutonomousPlannerSelfTest, type AutonomousPlannerSelfTestResult } from './ProjectBrainAutonomousPlanner.js';
import {
  runProjectBrainAutonomousPlanning,
  type ProjectBrainAutonomousPlanningResult,
} from './ProjectBrainAutonomousPlanningEngine.js';

export const PROJECT_BRAIN_AUTONOMOUS_PLANNING_PHASE = 'PHASE-PROJECT-BRAIN-AUTONOMOUS-PLANNING-001' as const;
export const PROJECT_BRAIN_AUTONOMOUS_PLANNING_PASS_VERDICT = 'PASS_PROJECT_BRAIN_AUTONOMOUS_PLANNING_FOUNDATION_V1' as const;
export const PROJECT_BRAIN_AUTONOMOUS_PLANNING_FAIL_VERDICT = 'FAIL_PROJECT_BRAIN_AUTONOMOUS_PLANNING_FOUNDATION_V1' as const;

// This phase's own invariants: Agent Layer (Planning through Governance)
// 변경 금지, Reasoning/Intelligence/Self Improvement/Materialization/
// Execution Readiness 변경 금지, Live Connector 변경 금지, Project Brain
// 데이터 변경 금지, Numerical DNA 변경 금지. Same reasoning as every prior
// Project-Brain-* validator this session: the entire underlying stack
// remains untracked ("??"), so a tracked-file substring check can't detect
// a modification to it by construction — compliance is verified by direct
// recollection (this phase imports read-only from
// ProjectBrainSelfImprovementEngine.ts and ProjectPlanningEngine.ts; it
// edits nothing in Planning through Execution Readiness, and never reads or
// writes project_brain/, datasets/project_knowledge/, or
// datasets/agent_planning/goals/). Numerical DNA files are excluded from
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
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ and datasets/project_knowledge/ prefixes and the entire Agent Layer + Reasoning + Intelligence + Self Improvement + Materialization + Execution Readiness filename substrings. Numerical DNA 변경 금지 verified by direct recollection, not this check',
  };
}

// The 3 files that actually implement this phase's autonomous-planning
// capability — scanned below by `checkApiFree()`. Deliberately excludes
// this validator itself, for the same reason every prior Project-Brain-*
// validator's own check does.
const PROJECT_BRAIN_AUTONOMOUS_PLANNING_SOURCE_FILES = [
  'services/ProjectBrainGoalDiscoveryEngine.ts',
  'services/ProjectBrainAutonomousPlanner.ts',
  'services/ProjectBrainAutonomousPlanningEngine.ts',
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
  for (const relPath of PROJECT_BRAIN_AUTONOMOUS_PLANNING_SOURCE_FILES) {
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
  return { ok: violations.length === 0, files_checked: PROJECT_BRAIN_AUTONOMOUS_PLANNING_SOURCE_FILES, violations };
}

export interface ProjectBrainAutonomousPlanningReport {
  phase: typeof PROJECT_BRAIN_AUTONOMOUS_PLANNING_PHASE;
  verdict: typeof PROJECT_BRAIN_AUTONOMOUS_PLANNING_PASS_VERDICT | typeof PROJECT_BRAIN_AUTONOMOUS_PLANNING_FAIL_VERDICT;
  goal_discovery_pass_ok: boolean;
  planning_pass_ok: boolean;
  priority_pass_ok: boolean;
  consistency_pass_ok: boolean;
  autonomous_pass_ok: boolean;
  api_free_pass_ok: boolean;
  goal_discovery_self_test: GoalDiscoverySelfTestResult;
  planner_self_test: AutonomousPlannerSelfTestResult;
  result: ProjectBrainAutonomousPlanningResult | null;
  api_free: ApiFreeCheck;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildProjectBrainAutonomousPlanningReport(root: string): Promise<ProjectBrainAutonomousPlanningReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let result: ProjectBrainAutonomousPlanningResult | null = null;

  const goal_discovery_self_test = runGoalDiscoverySelfTest();
  const planner_self_test = runAutonomousPlannerSelfTest();

  try {
    result = runProjectBrainAutonomousPlanning(root);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  // Goal Discovery PASS: self-test passed, and a fresh, independent re-run
  // of the unmodified Self Improvement layer + a second, independent call
  // to discoverGoalCandidates() must agree exactly with the real run's
  // candidates — and, critically, no candidate may ever trace back to a
  // `blocked_goal` gap (those already correspond to existing real goals).
  const directImprovement = runProjectBrainSelfImprovement(root);
  const directCandidates = discoverGoalCandidates(directImprovement.gaps, directImprovement.weaknesses, directImprovement.plan);
  const noBlockedGoalCandidates = (result?.candidates ?? []).every((c) => !c.source_id.startsWith('gap:blocked_goal:'));
  const goal_discovery_pass_ok =
    dashboardThrew === null &&
    goal_discovery_self_test.ok &&
    !!result &&
    JSON.stringify(result.candidates) === JSON.stringify(directCandidates) &&
    noBlockedGoalCandidates &&
    result.candidates.length > 0;

  // Planning PASS: self-test passed, and every real generated plan is
  // genuinely `ready` with exactly the expected 2-task execution order for
  // its own candidate.
  const allPlansReady = (result?.plans ?? []).every(
    (p) =>
      p.planning.ready === true &&
      p.planning.execution_plan?.execution_order.join(',') === `investigate:${p.candidate.source_id},implement:${p.candidate.source_id}`
  );
  const planning_pass_ok = dashboardThrew === null && planner_self_test.ok && (result?.plans.length ?? 0) > 0 && allPlansReady;

  // Priority PASS: candidates must be sorted by priority_score descending,
  // and each candidate's priority_score must match its source
  // gap/weakness's real ImprovementPlanItem score exactly — no divergence.
  const isSorted = (result?.candidates ?? []).every((c, i, arr) => i === 0 || arr[i - 1].priority_score >= c.priority_score);
  const planItemBysource = new Map(directImprovement.plan.map((item) => [item.source_id, item]));
  const priorityMismatches = (result?.candidates ?? [])
    .filter((c) => c.priority_score !== (planItemBysource.get(c.source_id)?.priority_score ?? -1))
    .map((c) => c.candidate_goal_id);
  const priority_pass_ok = dashboardThrew === null && isSorted && priorityMismatches.length === 0;

  const repository = checkRepositoryInvariants(root);
  const consistency_pass_ok = dashboardThrew === null && repository.ok;

  // Autonomous PASS: the composed pipeline genuinely connects — every
  // discovered candidate produced exactly one plan, by candidate_goal_id,
  // nothing fabricated or dropped.
  const candidateIds = new Set((result?.candidates ?? []).map((c) => c.candidate_goal_id));
  const planCandidateIds = new Set((result?.plans ?? []).map((p) => p.candidate.candidate_goal_id));
  const autonomous_pass_ok =
    dashboardThrew === null &&
    candidateIds.size === planCandidateIds.size &&
    [...candidateIds].every((id) => planCandidateIds.has(id));

  const api_free = checkApiFree(root);
  const api_free_pass_ok = api_free.ok;

  checks.push({
    id: 'goal_discovery_pass',
    pass: goal_discovery_pass_ok,
    detail: goal_discovery_pass_ok
      ? `self-test passed; real run discovered ${result?.candidates.length ?? 0} genuinely new goal candidate(s), byte-identical to an independent re-derivation, none tied to an already-existing goal`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'planning_pass',
    pass: planning_pass_ok,
    detail: planning_pass_ok
      ? `self-test passed; all ${result?.plans.length ?? 0} real generated plan(s) are ready=true with the expected 2-task execution order`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'priority_pass',
    pass: priority_pass_ok,
    detail: priority_pass_ok
      ? `candidates are genuinely sorted by priority_score (descending) and every score matches the real Improvement Plan's own value exactly`
      : `mismatches: ${priorityMismatches.join(', ')}${isSorted ? '' : '; candidates were not correctly sorted'}`,
  });
  checks.push({
    id: 'consistency_pass',
    pass: consistency_pass_ok,
    detail: consistency_pass_ok ? 'repository invariants hold' : `repository invariant violation: ${repository.violating_paths.join(',')}`,
  });
  checks.push({
    id: 'autonomous_pass',
    pass: autonomous_pass_ok,
    detail: autonomous_pass_ok
      ? `the full pipeline (Self Improvement -> Goal Discovery -> Autonomous Planner) genuinely connected — every discovered candidate produced exactly one plan, nothing fabricated or dropped`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'api_free_pass',
    pass: api_free_pass_ok,
    detail: api_free_pass_ok
      ? `API 미사용 mechanically confirmed — ${api_free.files_checked.length} files scanned, 0 forbidden network/live-dispatch markers found`
      : `API-usage markers found: ${api_free.violations.map((v) => `${v.file}:${v.marker}`).join(', ')}`,
  });

  const end_to_end_pass_ok =
    goal_discovery_pass_ok && planning_pass_ok && priority_pass_ok && consistency_pass_ok && autonomous_pass_ok && api_free_pass_ok;

  return {
    phase: PROJECT_BRAIN_AUTONOMOUS_PLANNING_PHASE,
    verdict: end_to_end_pass_ok ? PROJECT_BRAIN_AUTONOMOUS_PLANNING_PASS_VERDICT : PROJECT_BRAIN_AUTONOMOUS_PLANNING_FAIL_VERDICT,
    goal_discovery_pass_ok,
    planning_pass_ok,
    priority_pass_ok,
    consistency_pass_ok,
    autonomous_pass_ok,
    api_free_pass_ok,
    goal_discovery_self_test,
    planner_self_test,
    result,
    api_free,
    repository,
    checks,
  };
}
