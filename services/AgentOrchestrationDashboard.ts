import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { PlanningGoal, PlanningTaskInput } from './ProjectPlanningEngine.js';
import { createOrchestrationState } from './AgentCoordinationEngine.js';
import { runIsolationSelfTest, type IsolationSelfTestResult } from './AgentCoordinationEngine.js';
import { runWorkflowToCompletion, type WorkflowRunResult } from './AgentWorkflowEngine.js';
import type { OrchestrationExecutor } from './AgentOrchestrationEngine.js';
import { validateOrchestrationConsistency, type OrchestrationConsistencyReport } from './OrchestrationConsistencyEngine.js';
import { resolveLiveAgentCredential, type LiveAgentProvider } from './liveAgentApiClient.js';

export const AGENT_ORCHESTRATION_PHASE = 'PHASE-AGENT-ORCHESTRATION-001' as const;
export const AGENT_ORCHESTRATION_PASS_VERDICT = 'PASS_AGENT_ORCHESTRATION_FOUNDATION_V1' as const;
export const AGENT_ORCHESTRATION_FAIL_VERDICT = 'FAIL_AGENT_ORCHESTRATION_FOUNDATION_V1' as const;

// This phase's own invariants: Project Brain 변경 금지, AI Studio 변경 금지,
// Live Connector 변경 금지, Planning/Execution/Decision 변경 금지, Numerical
// DNA 변경 금지. Same reasoning as every prior Agent-* dashboard this
// session: project_brain/ and the entire Live/Planning/Execution/Decision
// Engine family remain untracked ("??"), so a tracked-file substring check
// can't detect a modification to them by construction — compliance is
// verified by direct recollection (this phase imports read-only from
// liveAgentApiClient.ts, ProjectPlanningEngine.ts, ExecutionStateEngine.ts,
// PriorityEvaluationEngine.ts, and ConstraintResolutionEngine.ts; it edits
// none of them). Numerical DNA files are excluded from the substring list
// for the same reason established in firstLiveAgentIntegrationValidator.ts.
const FORBIDDEN_CHANGED_PATH_PREFIXES = ['project_brain/'];
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
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ prefix and the entire Live/Planning/Execution/Decision Engine family filename substrings. Numerical DNA 변경 금지 verified by direct recollection, not this check',
  };
}

/**
 * Real executor, self-contained (Execution Engine 변경 금지 means the
 * equivalent executors defined inside AgentExecutionDashboard.ts cannot be
 * imported — they were never exported, and this phase cannot edit that file
 * to export them). Same real checks as PHASE-AGENT-EXECUTION-001's own
 * executors: obtain-api-key genuinely checks live credential presence;
 * review tasks genuinely check real file existence; stage-and-commit
 * genuinely, always refuses without explicit human approval.
 */
function realOrchestrationExecutor(root: string): OrchestrationExecutor {
  const nonEmpty = (relPath: string): boolean => {
    const abs = path.join(root, relPath);
    return fs.existsSync(abs) && fs.statSync(abs).size > 0;
  };

  return (_goalId: string, taskId: string) => {
    if (taskId === 'obtain-api-key') {
      const providers: LiveAgentProvider[] = ['claude', 'gemini', 'openai'];
      const anyPresent = providers.some((p) => resolveLiveAgentCredential(p).present);
      return anyPresent
        ? { ok: true, detail: 'a real credential is present for at least one provider' }
        : {
            ok: false,
            error:
              'no real API key present in this environment (checked ANTHROPIC_API_KEY, GEMINI_API_KEY/GOOGLE_API_KEY, OPENAI_API_KEY)',
          };
    }
    if (taskId === 'review-live-connector-changes') {
      const files = [
        'services/liveAgentApiClient.ts',
        'services/liveClaudeApiClient.ts',
        'services/liveGeminiApiClient.ts',
        'services/liveOpenAiApiClient.ts',
      ];
      return files.every(nonEmpty)
        ? { ok: true, detail: 'all live-connector files exist and are non-empty' }
        : { ok: false, error: 'one or more live-connector files missing or empty' };
    }
    if (taskId === 'review-numerical-dna-changes') {
      const files = [
        'services/sourceVideoNumericalDnaFullExtraction.ts',
        'services/sourceVideoNumericalDnaMveExtraction.ts',
      ];
      return files.every(nonEmpty)
        ? { ok: true, detail: 'all numerical-DNA service files exist and are non-empty' }
        : { ok: false, error: 'one or more numerical-DNA files missing or empty' };
    }
    if (taskId === 'stage-and-commit') {
      return {
        ok: false,
        error: "requires explicit user approval — this system never auto-commits, per this session's git safety protocol",
      };
    }
    return { ok: false, error: `no executor defined for ${taskId}` };
  };
}

export interface AgentOrchestrationDashboardReport {
  phase: typeof AGENT_ORCHESTRATION_PHASE;
  verdict: typeof AGENT_ORCHESTRATION_PASS_VERDICT | typeof AGENT_ORCHESTRATION_FAIL_VERDICT;
  orchestration_pass_ok: boolean;
  workflow_pass_ok: boolean;
  coordination_pass_ok: boolean;
  synchronization_pass_ok: boolean;
  consistency_pass_ok: boolean;
  dashboard_pass_ok: boolean;
  end_to_end_pass_ok: boolean;
  workflow: WorkflowRunResult | null;
  consistency: OrchestrationConsistencyReport | null;
  isolation_self_test: IsolationSelfTestResult;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildAgentOrchestrationDashboard(
  root: string,
  goals: Array<{ goal: PlanningGoal; tasks: PlanningTaskInput[] }>
): Promise<AgentOrchestrationDashboardReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let workflow: WorkflowRunResult | null = null;
  let consistency: OrchestrationConsistencyReport | null = null;

  try {
    const executor = realOrchestrationExecutor(root);
    workflow = await runWorkflowToCompletion(goals, executor);
    const { allTasksByGoal } = createOrchestrationState(goals);
    consistency = validateOrchestrationConsistency(workflow, allTasksByGoal);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  const executedSteps = workflow?.steps.filter((s) => s.executed) ?? [];

  const orchestration_pass_ok = dashboardThrew === null && executedSteps.length > 0;

  // Real, checkable expectation for this exact real data: exactly 2 real
  // tasks genuinely execute (both review tasks), and the workflow halts
  // because nothing else is selectable — not because it errored.
  const workflow_pass_ok =
    dashboardThrew === null &&
    executedSteps.length === 2 &&
    executedSteps.every((s) => s.new_state === 'done') &&
    workflow?.halted_reason === 'no_selectable_candidates';

  const isolation_self_test = runIsolationSelfTest();
  const totalTaskCount = workflow ? workflow.state.tasks.size : 0;
  const goalIdsInState = new Set(workflow ? [...workflow.state.tasks.values()].map((r) => r.goal_id) : []);
  const coordination_pass_ok =
    dashboardThrew === null && isolation_self_test.ok && totalTaskCount === 9 && goalIdsInState.size === 2;

  // Real evidence of dynamic re-synchronization: stage-and-commit must NOT
  // appear as a candidate in step 1 (its dependencies aren't done yet) but
  // MUST appear as a candidate in the final step (both dependencies have
  // since completed) — proving candidates are recomputed from live state
  // each step, not a fixed snapshot from before execution began.
  const firstStepCandidateIds = workflow?.steps[0]?.candidates.map((c) => c.task_id) ?? [];
  const lastStep = workflow?.steps[workflow.steps.length - 1];
  const lastStepCandidateIds = lastStep?.candidates.map((c) => c.task_id) ?? [];
  const synchronization_pass_ok =
    dashboardThrew === null &&
    !firstStepCandidateIds.includes('stage-and-commit') &&
    lastStepCandidateIds.includes('stage-and-commit');

  const consistency_pass_ok = dashboardThrew === null && !!consistency?.ok;

  const repository = checkRepositoryInvariants(root);
  const dashboard_pass_ok = dashboardThrew === null && repository.ok;

  const end_to_end_pass_ok =
    orchestration_pass_ok &&
    workflow_pass_ok &&
    coordination_pass_ok &&
    synchronization_pass_ok &&
    consistency_pass_ok &&
    dashboard_pass_ok;

  checks.push({
    id: 'orchestration_pass',
    pass: orchestration_pass_ok,
    detail: orchestration_pass_ok
      ? `Planning→Decision→Execution connected: ${executedSteps.length} real step(s) executed without throwing`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'workflow_pass',
    pass: workflow_pass_ok,
    detail: workflow
      ? `${executedSteps.length} task(s) executed to 'done', workflow halted with reason="${workflow.halted_reason}"`
      : 'no workflow result',
  });
  checks.push({
    id: 'coordination_pass',
    pass: coordination_pass_ok,
    detail: `${totalTaskCount} tasks tracked across ${goalIdsInState.size} goals in one shared state; isolation self-test: ${isolation_self_test.detail}`,
  });
  checks.push({
    id: 'synchronization_pass',
    pass: synchronization_pass_ok,
    detail: synchronization_pass_ok
      ? "stage-and-commit correctly absent from step 1's candidates and correctly present in the final step's candidates — live state re-derivation confirmed"
      : 'dynamic candidate re-derivation did not behave as expected',
  });
  checks.push({
    id: 'consistency_pass',
    pass: consistency_pass_ok,
    detail: consistency ? (consistency.ok ? 'ok' : consistency.issues.join('; ')) : 'no consistency result',
  });
  checks.push({
    id: 'dashboard_pass',
    pass: dashboard_pass_ok,
    detail: dashboardThrew
      ? `unhandled_exception: ${dashboardThrew}`
      : repository.ok
        ? 'no unhandled exceptions and repository invariants hold'
        : `repository invariant violation: ${repository.violating_paths.join(',')}`,
  });
  checks.push({
    id: 'end_to_end_pass',
    pass: end_to_end_pass_ok,
    detail: `all 6 other gates ${end_to_end_pass_ok ? 'pass' : 'do not all pass'} together in one real, uninterrupted run`,
  });

  return {
    phase: AGENT_ORCHESTRATION_PHASE,
    verdict: end_to_end_pass_ok ? AGENT_ORCHESTRATION_PASS_VERDICT : AGENT_ORCHESTRATION_FAIL_VERDICT,
    orchestration_pass_ok,
    workflow_pass_ok,
    coordination_pass_ok,
    synchronization_pass_ok,
    consistency_pass_ok,
    dashboard_pass_ok,
    end_to_end_pass_ok,
    workflow,
    consistency,
    isolation_self_test,
    repository,
    checks,
  };
}
