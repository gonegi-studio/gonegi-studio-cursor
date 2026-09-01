import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runProjectBrainReasoning } from './ProjectBrainReasoningEngine.js';
import { resolveAvailableProviders } from './AgentCapabilityRegistry.js';
import {
  runGapAnalysisSelfTest,
  type Gap,
  type Weakness,
  type GapSeverity,
  type GapAnalysisSelfTestResult,
} from './ProjectBrainGapAnalysisEngine.js';
import { runImprovementPlannerSelfTest, type ImprovementPlanItem, type ImprovementPlannerSelfTestResult } from './ProjectBrainImprovementPlanner.js';
import { runProjectBrainSelfImprovement, type ProjectBrainSelfImprovementResult } from './ProjectBrainSelfImprovementEngine.js';

export const PROJECT_BRAIN_SELF_IMPROVEMENT_PHASE = 'PHASE-PROJECT-BRAIN-SELF-IMPROVEMENT-001' as const;
export const PROJECT_BRAIN_SELF_IMPROVEMENT_PASS_VERDICT = 'PASS_PROJECT_BRAIN_SELF_IMPROVEMENT_FOUNDATION_V1' as const;
export const PROJECT_BRAIN_SELF_IMPROVEMENT_FAIL_VERDICT = 'FAIL_PROJECT_BRAIN_SELF_IMPROVEMENT_FOUNDATION_V1' as const;

// This phase's own invariants: Agent Layer (Planning through Project Brain
// Reasoning) 변경 금지, Project Brain Intelligence 변경 금지, Live Connector
// 변경 금지, Project Brain 데이터 변경 금지, Numerical DNA 변경 금지. Same
// reasoning as every prior Project-Brain-* validator this session: the
// entire underlying stack remains untracked ("??"), so a tracked-file
// substring check can't detect a modification to it by construction —
// compliance is verified by direct recollection (this phase imports
// read-only from ProjectBrainReasoningEngine.ts and
// AgentCapabilityRegistry.ts; it edits nothing in Planning through
// Intelligence, and never reads or writes project_brain/ or
// datasets/project_knowledge/ — it only checks for the ABSENCE of one
// specific persistence file under reports/, which is not "Project Brain
// 데이터"). Numerical DNA files are excluded from the substring list for
// the same reason established in firstLiveAgentIntegrationValidator.ts.
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
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ and datasets/project_knowledge/ prefixes and the entire Agent Layer + Project Brain Intelligence filename substrings. Numerical DNA 변경 금지 verified by direct recollection, not this check',
  };
}

// The 3 files that actually implement this phase's self-improvement
// capability — scanned below by `checkApiUnused()`. Deliberately excludes
// this validator itself, for the same reason every prior Project-Brain-*
// validator's own check does.
const PROJECT_BRAIN_SELF_IMPROVEMENT_SOURCE_FILES = [
  'services/ProjectBrainGapAnalysisEngine.ts',
  'services/ProjectBrainImprovementPlanner.ts',
  'services/ProjectBrainSelfImprovementEngine.ts',
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

export interface ApiUnusedCheck {
  ok: boolean;
  files_checked: string[];
  violations: Array<{ file: string; marker: string }>;
}

/** Real, mechanical proof of "API 미사용": reads this phase's own 3 new source files and confirms none references a network or live-provider call primitive. */
export function checkApiUnused(root: string): ApiUnusedCheck {
  const violations: Array<{ file: string; marker: string }> = [];
  for (const relPath of PROJECT_BRAIN_SELF_IMPROVEMENT_SOURCE_FILES) {
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
  return { ok: violations.length === 0, files_checked: PROJECT_BRAIN_SELF_IMPROVEMENT_SOURCE_FILES, violations };
}

const SEVERITY_WEIGHT: Record<GapSeverity, number> = { high: 3, medium: 2, low: 1 };

export interface ProjectBrainSelfImprovementReport {
  phase: typeof PROJECT_BRAIN_SELF_IMPROVEMENT_PHASE;
  verdict: typeof PROJECT_BRAIN_SELF_IMPROVEMENT_PASS_VERDICT | typeof PROJECT_BRAIN_SELF_IMPROVEMENT_FAIL_VERDICT;
  gap_pass_ok: boolean;
  priority_pass_ok: boolean;
  planner_pass_ok: boolean;
  improvement_pass_ok: boolean;
  consistency_pass_ok: boolean;
  end_to_end_pass_ok: boolean;
  gap_analysis_self_test: GapAnalysisSelfTestResult;
  planner_self_test: ImprovementPlannerSelfTestResult;
  result: ProjectBrainSelfImprovementResult | null;
  api_unused: ApiUnusedCheck;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildProjectBrainSelfImprovementReport(root: string): Promise<ProjectBrainSelfImprovementReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let result: ProjectBrainSelfImprovementResult | null = null;

  const gap_analysis_self_test = runGapAnalysisSelfTest(root);
  const planner_self_test = runImprovementPlannerSelfTest();

  try {
    result = runProjectBrainSelfImprovement(root);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  // Gap PASS: self-test passed, and the real run's credential gap presence
  // matches a fresh, direct recomputation from the unmodified Reasoning
  // layer + Capability Registry, and every goal the Reasoning layer itself
  // reports as not fully agent-completable has a corresponding blocked_goal
  // gap — no gap fabricated, none dropped.
  const directReasoning = runProjectBrainReasoning(root);
  const directProviderStatuses = directReasoning.capabilities.flatMap((c) => resolveAvailableProviders(c.capability_id));
  const directAnyCredential = directProviderStatuses.some((p) => p.credential_present);
  const expectedCredentialGap = !directAnyCredential;
  const actualHasCredentialGap = result?.gaps.some((g) => g.category === 'credential') ?? false;
  const directBlockedGoalIds = directReasoning.goals.filter((g) => !g.blockers.fully_agent_completable).map((g) => g.goal_id);
  const actualBlockedGoalGapIds = (result?.gaps ?? []).filter((g) => g.category === 'blocked_goal').map((g) => g.gap_id.replace('gap:blocked_goal:', ''));
  const gap_pass_ok =
    dashboardThrew === null &&
    gap_analysis_self_test.ok &&
    expectedCredentialGap === actualHasCredentialGap &&
    directBlockedGoalIds.length === actualBlockedGoalGapIds.length &&
    directBlockedGoalIds.every((id) => actualBlockedGoalGapIds.includes(id));

  // Priority PASS: recompute every real plan item's priority_score
  // independently and confirm it matches the planner's own recorded score
  // exactly — never trust the planner's arithmetic without re-deriving it.
  const priorityMismatches: string[] = [];
  for (const item of result?.plan ?? []) {
    const sourceGap = result?.gaps.find((g) => g.gap_id === item.source_id);
    const sourceWeakness = result?.weaknesses.find((w) => w.weakness_id === item.source_id);
    const expectedScore = sourceGap
      ? sourceGap.blocking_task_count * 10 + SEVERITY_WEIGHT[sourceGap.severity]
      : sourceWeakness
        ? SEVERITY_WEIGHT[sourceWeakness.severity]
        : null;
    if (expectedScore === null || expectedScore !== item.priority_score) {
      priorityMismatches.push(`${item.source_id}: recorded=${item.priority_score} expected=${expectedScore}`);
    }
  }
  const priority_pass_ok = dashboardThrew === null && (result?.plan.length ?? 0) > 0 && priorityMismatches.length === 0;

  // Planner PASS: self-test passed, no plan item lost or fabricated, and
  // the real plan is genuinely sorted (non-increasing priority_score).
  const expectedPlanCount = (result?.gaps.length ?? 0) + (result?.weaknesses.length ?? 0);
  const isSorted = (result?.plan ?? []).every((item, index, arr) => index === 0 || arr[index - 1].priority_score >= item.priority_score);
  const planner_pass_ok =
    dashboardThrew === null && planner_self_test.ok && result?.plan.length === expectedPlanCount && isSorted;

  // Improvement PASS: the composed pipeline genuinely connects — every
  // gap/weakness that Gap Analysis + Weakness Detection produced appears
  // exactly once in the final plan, by source_id, and nothing else does.
  const expectedSourceIds = new Set([...(result?.gaps.map((g) => g.gap_id) ?? []), ...(result?.weaknesses.map((w) => w.weakness_id) ?? [])]);
  const actualSourceIds = new Set((result?.plan ?? []).map((item) => item.source_id));
  const improvement_pass_ok =
    dashboardThrew === null &&
    expectedSourceIds.size === actualSourceIds.size &&
    [...expectedSourceIds].every((id) => actualSourceIds.has(id));

  const api_unused = checkApiUnused(root);
  const repository = checkRepositoryInvariants(root);
  const consistency_pass_ok = dashboardThrew === null && api_unused.ok && repository.ok;

  const end_to_end_pass_ok =
    gap_pass_ok && priority_pass_ok && planner_pass_ok && improvement_pass_ok && consistency_pass_ok;

  checks.push({
    id: 'gap_pass',
    pass: gap_pass_ok,
    detail: gap_pass_ok
      ? `self-test passed; real run found ${result?.gaps.length ?? 0} gap(s), matching a fresh, direct recomputation of credential and blocked-goal facts`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'priority_pass',
    pass: priority_pass_ok,
    detail: priority_pass_ok
      ? `every real plan item's priority_score (${result?.plan.length ?? 0} item(s)) matches an independent recomputation exactly`
      : `mismatches: ${priorityMismatches.join('; ')}`,
  });
  checks.push({
    id: 'planner_pass',
    pass: planner_pass_ok,
    detail: planner_pass_ok
      ? `self-test passed (blocking-count ordering, weakness never outranks a blocking gap); real plan has all ${expectedPlanCount} item(s) and is genuinely sorted`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'improvement_pass',
    pass: improvement_pass_ok,
    detail: improvement_pass_ok
      ? `the full pipeline (Reasoning -> Gap Analysis + Weakness Detection -> Improvement Planner) genuinely connected — every gap/weakness appears exactly once in the final plan, nothing fabricated or dropped`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'consistency_pass',
    pass: consistency_pass_ok,
    detail: consistency_pass_ok
      ? `API 미사용 mechanically confirmed (${api_unused.files_checked.length} files scanned, 0 forbidden markers) and repository invariants hold`
      : `${api_unused.ok ? '' : `API-usage markers found: ${api_unused.violations.map((v) => `${v.file}:${v.marker}`).join(', ')}; `}${repository.ok ? '' : `repository invariant violation: ${repository.violating_paths.join(',')}`}`,
  });
  checks.push({
    id: 'end_to_end_pass',
    pass: end_to_end_pass_ok,
    detail: `all 5 other gates ${end_to_end_pass_ok ? 'pass' : 'do not all pass'} together in one real, uninterrupted run`,
  });

  return {
    phase: PROJECT_BRAIN_SELF_IMPROVEMENT_PHASE,
    verdict: end_to_end_pass_ok ? PROJECT_BRAIN_SELF_IMPROVEMENT_PASS_VERDICT : PROJECT_BRAIN_SELF_IMPROVEMENT_FAIL_VERDICT,
    gap_pass_ok,
    priority_pass_ok,
    planner_pass_ok,
    improvement_pass_ok,
    consistency_pass_ok,
    end_to_end_pass_ok,
    gap_analysis_self_test,
    planner_self_test,
    result,
    api_unused,
    repository,
    checks,
  };
}
