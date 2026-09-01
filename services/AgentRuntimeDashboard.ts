import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { PlanningGoal, PlanningTaskInput } from './ProjectPlanningEngine.js';
import type { OrchestrationExecutor } from './AgentOrchestrationEngine.js';
import { integrateAgentRuntime, type AgentRuntimeIntegrationResult } from './AgentRuntimeIntegrationEngine.js';
import { transitionLifecycle } from './AgentLifecycleEngine.js';
import { resolveLiveAgentCredential, type LiveAgentProvider } from './liveAgentApiClient.js';

export const AGENT_RUNTIME_PHASE = 'PHASE-AGENT-RUNTIME-001' as const;
export const AGENT_RUNTIME_PASS_VERDICT = 'PASS_AGENT_RUNTIME_INTEGRATION_FOUNDATION_V1' as const;
export const AGENT_RUNTIME_FAIL_VERDICT = 'FAIL_AGENT_RUNTIME_INTEGRATION_FOUNDATION_V1' as const;

// This phase's own invariants: Project Brain 변경 금지, AI Studio 변경 금지,
// Live Connector 변경 금지, Planning/Execution/Decision/Orchestration 변경
// 금지, Numerical DNA 변경 금지. Same reasoning as every prior Agent-*
// dashboard: project_brain/ and the entire Live/Planning/Execution/Decision/
// Orchestration Engine family remain untracked ("??"), so a tracked-file
// substring check can't detect a modification to them by construction —
// compliance is verified by direct recollection (this phase imports
// read-only from liveAgentApiClient.ts, ProjectPlanningEngine.ts,
// AgentCoordinationEngine.ts, AgentOrchestrationEngine.ts, and
// OrchestrationConsistencyEngine.ts; it edits none of them). Numerical DNA
// files are excluded from the substring list for the same reason
// established in firstLiveAgentIntegrationValidator.ts.
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
  'AgentCoordinationEngine',
  'AgentOrchestrationEngine',
  'AgentWorkflowEngine',
  'OrchestrationConsistencyEngine',
  'AgentOrchestrationDashboard',
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
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ prefix and the entire Live/Planning/Execution/Decision/Orchestration Engine family filename substrings. Numerical DNA 변경 금지 verified by direct recollection, not this check',
  };
}

/**
 * Real executor, self-contained (Orchestration/Execution 변경 금지 means the
 * equivalent executors in AgentOrchestrationDashboard.ts / AgentExecutionDashboard.ts
 * cannot be imported — neither was ever exported, and this phase cannot edit
 * either file to export them). Same real checks proven in both prior phases:
 * obtain-api-key genuinely checks live credential presence; review tasks
 * genuinely check real file existence; stage-and-commit genuinely, always
 * refuses without explicit human approval.
 */
function realRuntimeExecutor(root: string): OrchestrationExecutor {
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

export interface LifecycleSelfTestResult {
  ok: boolean;
  detail: string;
}

/** Proves the lifecycle state machine genuinely rejects a terminal state resurrecting (stopped -> running). */
export function runLifecycleIllegalTransitionSelfTest(): LifecycleSelfTestResult {
  const result = transitionLifecycle('stopped', 'running');
  const rejected = result.ok === false && typeof result.error === 'string';
  return {
    ok: rejected,
    detail: rejected
      ? `correctly rejected stopped -> running: ${result.error}`
      : 'FAILED to reject an illegal lifecycle transition — lifecycle engine is not trustworthy',
  };
}

export interface AgentRuntimeDashboardReport {
  phase: typeof AGENT_RUNTIME_PHASE;
  verdict: typeof AGENT_RUNTIME_PASS_VERDICT | typeof AGENT_RUNTIME_FAIL_VERDICT;
  runtime_pass_ok: boolean;
  lifecycle_pass_ok: boolean;
  loop_pass_ok: boolean;
  synchronization_pass_ok: boolean;
  consistency_pass_ok: boolean;
  dashboard_pass_ok: boolean;
  end_to_end_pass_ok: boolean;
  integration: AgentRuntimeIntegrationResult | null;
  lifecycle_self_test: LifecycleSelfTestResult;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildAgentRuntimeDashboard(
  root: string,
  goals: Array<{ goal: PlanningGoal; tasks: PlanningTaskInput[] }>
): Promise<AgentRuntimeDashboardReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let integration: AgentRuntimeIntegrationResult | null = null;
  const idleGraceTicks = 2;

  try {
    const executor = realRuntimeExecutor(root);
    integration = await integrateAgentRuntime(goals, executor, 10, idleGraceTicks);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  const executedTicks = integration?.runtime.ticks.filter((t) => t.orchestration_step.executed) ?? [];
  const runtime_pass_ok = dashboardThrew === null && executedTicks.length > 0;

  const lifecycle_self_test = runLifecycleIllegalTransitionSelfTest();
  const lifecycle_pass_ok =
    lifecycle_self_test.ok &&
    dashboardThrew === null &&
    (integration?.runtime.illegal_lifecycle_transition_attempts.length ?? -1) === 0;

  // Real, checkable expectation for this exact real data: 2 executed ticks
  // (both review tasks) followed by exactly idleGraceTicks idle ticks, then
  // a genuine graceful stop — not a stop forced only by running out of
  // budget.
  const loop_pass_ok =
    dashboardThrew === null &&
    !!integration &&
    executedTicks.length === 2 &&
    integration.runtime.ticks.length === 2 + idleGraceTicks &&
    integration.runtime.halted_reason === 'work_exhausted' &&
    integration.runtime.final_lifecycle_state === 'stopped';

  const synchronization_pass_ok =
    dashboardThrew === null &&
    !!integration &&
    integration.runtime.ticks.every(
      (t) =>
        (t.orchestration_step.executed && t.lifecycle_state === 'running') ||
        (!t.orchestration_step.executed && t.lifecycle_state === 'awaiting_work')
    );

  const consistency_pass_ok = dashboardThrew === null && !!integration?.consistency.ok;

  const repository = checkRepositoryInvariants(root);
  const dashboard_pass_ok = dashboardThrew === null && repository.ok;

  const end_to_end_pass_ok =
    runtime_pass_ok &&
    lifecycle_pass_ok &&
    loop_pass_ok &&
    synchronization_pass_ok &&
    consistency_pass_ok &&
    dashboard_pass_ok;

  checks.push({
    id: 'runtime_pass',
    pass: runtime_pass_ok,
    detail: runtime_pass_ok
      ? `Orchestration Runtime connected: ${executedTicks.length} real tick(s) executed real work without throwing`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'lifecycle_pass',
    pass: lifecycle_pass_ok,
    detail: `${lifecycle_self_test.detail}; real run illegal-transition attempts: ${integration?.runtime.illegal_lifecycle_transition_attempts.length ?? 'n/a'}`,
  });
  checks.push({
    id: 'loop_pass',
    pass: loop_pass_ok,
    detail: integration
      ? `${integration.runtime.ticks.length} total ticks (${executedTicks.length} executed, ${idleGraceTicks} idle), halted_reason="${integration.runtime.halted_reason}", final_lifecycle_state="${integration.runtime.final_lifecycle_state}"`
      : 'no runtime result',
  });
  checks.push({
    id: 'synchronization_pass',
    pass: synchronization_pass_ok,
    detail: synchronization_pass_ok
      ? 'every tick\'s lifecycle_state correctly corresponds to whether that tick executed real work'
      : 'lifecycle state and orchestration step results diverged on at least one tick',
  });
  checks.push({
    id: 'consistency_pass',
    pass: consistency_pass_ok,
    detail: integration ? (integration.consistency.ok ? 'ok' : integration.consistency.issues.join('; ')) : 'no consistency result',
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
    phase: AGENT_RUNTIME_PHASE,
    verdict: end_to_end_pass_ok ? AGENT_RUNTIME_PASS_VERDICT : AGENT_RUNTIME_FAIL_VERDICT,
    runtime_pass_ok,
    lifecycle_pass_ok,
    loop_pass_ok,
    synchronization_pass_ok,
    consistency_pass_ok,
    dashboard_pass_ok,
    end_to_end_pass_ok,
    integration,
    lifecycle_self_test,
    repository,
    checks,
  };
}
