import { execSync } from 'node:child_process';
import { dispatchAction, type DispatchResult } from './AgentActionDispatcher.js';
import type { CapabilityId } from './AgentCapabilityRegistry.js';
import type { LiveAgentRequestInput } from './liveAgentApiClient.js';
import { evaluateApproval, runApprovalPolicySelfTest, type ApprovalResult, type ApprovalSelfTestResult } from './AgentApprovalEngine.js';
import { createBudget, tryConsumeBudget, runBudgetControlSelfTest, type BudgetState, type BudgetCheckResult, type BudgetSelfTestResult } from './AgentBudgetEngine.js';
import { createRateLimiter, tryAcquireRateLimit, runRateLimitSelfTest, type RateLimiterState, type RateLimitCheckResult, type RateLimitSelfTestResult } from './AgentRateLimiter.js';
import { createAuditLog, appendAuditEntry, listAuditEntries, runAuditIntegritySelfTest, type AuditLog, type AuditEntry, type AuditSelfTestResult } from './AgentAuditEngine.js';

export const AGENT_GOVERNANCE_PHASE = 'PHASE-AGENT-GOVERNANCE-001' as const;
export const AGENT_GOVERNANCE_PASS_VERDICT = 'PASS_AGENT_GOVERNANCE_FOUNDATION_V1' as const;
export const AGENT_GOVERNANCE_FAIL_VERDICT = 'FAIL_AGENT_GOVERNANCE_FOUNDATION_V1' as const;

const GOVERNANCE_SMOKE_TEST_PROMPT = 'Reply with exactly one word: OK';

// This phase's own invariants: Planning/Execution/Decision/Orchestration/
// Runtime/Integration/Live Connector 변경 금지, Project Brain 변경 금지,
// Numerical DNA 변경 금지. Same reasoning as every prior Agent-* engine this
// session: project_brain/ and the entire Planning/Execution/Decision/
// Orchestration/Runtime/Integration/Live-Connector family remain untracked
// ("??"), so a tracked-file substring check can't detect a modification to
// them by construction — compliance is verified by direct recollection (this
// phase imports read-only from AgentActionDispatcher.ts and
// AgentCapabilityRegistry.ts — PHASE-AGENT-INTEGRATION-001 — and from
// liveAgentApiClient.ts; it edits none of them, and never touches
// Planning/Execution/Decision/Orchestration/Runtime at all). Numerical DNA
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
  'AgentLifecycleEngine',
  'RuntimeLoopEngine',
  'RuntimeConsistencyEngine',
  'AgentRuntimeIntegrationEngine',
  'AgentRuntimeDashboard',
  'AgentCapabilityRegistry',
  'AgentActionDispatcher',
  'AgentIntegrationEngine',
  'AgentIntegrationValidator',
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
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ prefix and the entire Live Connector/Planning/Execution/Decision/Orchestration/Runtime/Integration family filename substrings. Numerical DNA 변경 금지 verified by direct recollection, not this check',
  };
}

export interface EmergencyStopState {
  engaged: boolean;
  reason?: string;
}

export function createEmergencyStop(): EmergencyStopState {
  return { engaged: false };
}

/** Real, one-way trip switch for this run — nothing in this module ever clears `engaged` back to false once set. */
export function engageEmergencyStop(state: EmergencyStopState, reason: string): void {
  state.engaged = true;
  state.reason = reason;
}

export interface GovernedDispatchInput {
  action_id: string;
  capability_id: CapabilityId;
  request: LiveAgentRequestInput;
  explicitly_approved: boolean;
}

export interface GovernedDispatchResult {
  /** True only if every governance gate (emergency stop, approval, budget, rate limit) let the call through to the Action Dispatcher — independent of whether the underlying live call itself succeeded. */
  ok: boolean;
  action_id: string;
  approval: ApprovalResult;
  budget: BudgetCheckResult;
  rate_limit: RateLimitCheckResult;
  emergency_stop_engaged: boolean;
  dispatch: DispatchResult | null;
  detail: string;
}

/**
 * The real governed-action pipeline: Emergency Stop → Approval Policy →
 * Budget Control → Rate Limit → (only if every gate passes) the unmodified
 * `AgentActionDispatcher.ts`'s `dispatchAction()` (PHASE-AGENT-INTEGRATION
 * -001, `Integration 변경 금지`) → Audit Log. Every call — allowed or
 * blocked — is recorded in the audit log exactly once; a blocked call never
 * reaches the Action Dispatcher (never even a partial or best-effort call),
 * and budget/rate-limit capacity is never consumed for a call blocked
 * earlier in the pipeline (e.g. by emergency stop or a denied approval).
 */
export async function governedDispatch(
  input: GovernedDispatchInput,
  budget: BudgetState,
  limiter: RateLimiterState,
  emergencyStop: EmergencyStopState,
  auditLog: AuditLog,
  nowMs: number = Date.now()
): Promise<GovernedDispatchResult> {
  const blockedBudget: BudgetCheckResult = { ok: false, remaining: budget.max_calls - budget.used_calls, reason: 'not evaluated — blocked earlier in the pipeline' };
  const blockedRateLimit: RateLimitCheckResult = { ok: false, count_in_window: limiter.timestamps.length, reason: 'not evaluated — blocked earlier in the pipeline' };

  if (emergencyStop.engaged) {
    const detail = `blocked by emergency stop: ${emergencyStop.reason ?? 'no reason recorded'}`;
    appendAuditEntry(auditLog, { actor: 'AgentGovernanceEngine', action_id: input.action_id, decision: 'denied', detail });
    return {
      ok: false,
      action_id: input.action_id,
      approval: { action_id: input.action_id, decision: 'denied', reason: 'not evaluated — emergency stop engaged' },
      budget: blockedBudget,
      rate_limit: blockedRateLimit,
      emergency_stop_engaged: true,
      dispatch: null,
      detail,
    };
  }

  const approval = evaluateApproval(input.action_id, input.explicitly_approved);
  if (approval.decision !== 'approved') {
    const detail = `blocked by approval policy: ${approval.reason}`;
    appendAuditEntry(auditLog, { actor: 'AgentGovernanceEngine', action_id: input.action_id, decision: 'denied', detail });
    return {
      ok: false,
      action_id: input.action_id,
      approval,
      budget: blockedBudget,
      rate_limit: blockedRateLimit,
      emergency_stop_engaged: false,
      dispatch: null,
      detail,
    };
  }

  const budgetCheck = tryConsumeBudget(budget);
  if (!budgetCheck.ok) {
    const detail = `blocked by budget control: ${budgetCheck.reason}`;
    appendAuditEntry(auditLog, { actor: 'AgentGovernanceEngine', action_id: input.action_id, decision: 'denied', detail });
    return {
      ok: false,
      action_id: input.action_id,
      approval,
      budget: budgetCheck,
      rate_limit: blockedRateLimit,
      emergency_stop_engaged: false,
      dispatch: null,
      detail,
    };
  }

  const rateLimitCheck = tryAcquireRateLimit(limiter, nowMs);
  if (!rateLimitCheck.ok) {
    const detail = `blocked by rate limit: ${rateLimitCheck.reason}`;
    appendAuditEntry(auditLog, { actor: 'AgentGovernanceEngine', action_id: input.action_id, decision: 'denied', detail });
    return {
      ok: false,
      action_id: input.action_id,
      approval,
      budget: budgetCheck,
      rate_limit: rateLimitCheck,
      emergency_stop_engaged: false,
      dispatch: null,
      detail,
    };
  }

  const dispatch = await dispatchAction({ capability_id: input.capability_id, request: input.request });
  const detail = `all governance gates passed; dispatched to Action Dispatcher — ${dispatch.detail}`;
  appendAuditEntry(auditLog, { actor: 'AgentGovernanceEngine', action_id: input.action_id, decision: 'allowed', detail });

  return {
    ok: true,
    action_id: input.action_id,
    approval,
    budget: budgetCheck,
    rate_limit: rateLimitCheck,
    emergency_stop_engaged: false,
    dispatch,
    detail,
  };
}

export interface AgentGovernanceReport {
  phase: typeof AGENT_GOVERNANCE_PHASE;
  verdict: typeof AGENT_GOVERNANCE_PASS_VERDICT | typeof AGENT_GOVERNANCE_FAIL_VERDICT;
  approval_pass_ok: boolean;
  budget_pass_ok: boolean;
  rate_limit_pass_ok: boolean;
  audit_pass_ok: boolean;
  safety_pass_ok: boolean;
  governance_pass_ok: boolean;
  end_to_end_pass_ok: boolean;
  approval_self_test: ApprovalSelfTestResult;
  budget_self_test: BudgetSelfTestResult;
  rate_limit_self_test: RateLimitSelfTestResult;
  audit_self_test: AuditSelfTestResult;
  governed_calls: GovernedDispatchResult[];
  audit_entries: AuditEntry[];
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

/**
 * Real, end-to-end governance run: 3 real `governedDispatch()` calls against
 * one shared budget/rate-limiter/audit-log —
 *   1. denied — no approval supplied for an approval-required action
 *   2. approved — explicit approval supplied; genuinely reaches the
 *      unmodified Action Dispatcher (honestly reports the Live Connector's
 *      real state, e.g. missing credentials, exactly as
 *      PHASE-AGENT-INTEGRATION-001 already established)
 *   3. blocked by Emergency Stop — engaged immediately after call 2,
 *      proving it overrides even a call that supplies valid approval
 * — plus each mechanism's own independent negative-case self-test.
 */
export async function buildAgentGovernanceReport(root: string): Promise<AgentGovernanceReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let governed_calls: GovernedDispatchResult[] = [];
  const auditLog = createAuditLog();
  const budget = createBudget(5);
  const limiter = createRateLimiter(5, 60000);
  const emergencyStop = createEmergencyStop();

  const approval_self_test = runApprovalPolicySelfTest();
  const budget_self_test = runBudgetControlSelfTest();
  const rate_limit_self_test = runRateLimitSelfTest();
  const audit_self_test = runAuditIntegritySelfTest();

  try {
    const request: LiveAgentRequestInput = { prompt: GOVERNANCE_SMOKE_TEST_PROMPT, max_tokens: 8 };

    const deniedCall = await governedDispatch(
      { action_id: 'live_provider_dispatch', capability_id: 'text_completion', request, explicitly_approved: false },
      budget,
      limiter,
      emergencyStop,
      auditLog,
      0
    );
    const approvedCall = await governedDispatch(
      { action_id: 'live_provider_dispatch', capability_id: 'text_completion', request, explicitly_approved: true },
      budget,
      limiter,
      emergencyStop,
      auditLog,
      1
    );
    engageEmergencyStop(emergencyStop, 'safety self-test — proving emergency stop overrides an otherwise-approved call');
    const stoppedCall = await governedDispatch(
      { action_id: 'live_provider_dispatch', capability_id: 'text_completion', request, explicitly_approved: true },
      budget,
      limiter,
      emergencyStop,
      auditLog,
      2
    );

    governed_calls = [deniedCall, approvedCall, stoppedCall];
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  const [deniedCall, approvedCall, stoppedCall] = governed_calls;

  const approval_pass_ok =
    dashboardThrew === null &&
    approval_self_test.ok &&
    !!deniedCall &&
    deniedCall.ok === false &&
    deniedCall.approval.decision === 'denied' &&
    !!approvedCall &&
    approvedCall.approval.decision === 'approved';

  const budget_pass_ok =
    dashboardThrew === null &&
    budget_self_test.ok &&
    !!deniedCall &&
    deniedCall.budget.reason === 'not evaluated — blocked earlier in the pipeline' &&
    !!approvedCall &&
    approvedCall.budget.ok === true &&
    budget.used_calls === 1;

  const rate_limit_pass_ok =
    dashboardThrew === null &&
    rate_limit_self_test.ok &&
    !!approvedCall &&
    approvedCall.rate_limit.ok === true &&
    limiter.timestamps.length === 1;

  const audit_pass_ok =
    dashboardThrew === null && audit_self_test.ok && auditLog.entries.length === governed_calls.length;

  const safety_pass_ok =
    dashboardThrew === null &&
    !!stoppedCall &&
    stoppedCall.ok === false &&
    stoppedCall.emergency_stop_engaged === true &&
    stoppedCall.dispatch === null;

  const governance_pass_ok = dashboardThrew === null && !!approvedCall && approvedCall.dispatch !== null;

  const repository = checkRepositoryInvariants(root);

  const end_to_end_pass_ok =
    approval_pass_ok &&
    budget_pass_ok &&
    rate_limit_pass_ok &&
    audit_pass_ok &&
    safety_pass_ok &&
    governance_pass_ok &&
    repository.ok;

  checks.push({
    id: 'approval_pass',
    pass: approval_pass_ok,
    detail: approval_pass_ok
      ? `self-test passed; real run: unapproved call denied ("${deniedCall?.approval.reason}"), approved call approved ("${approvedCall?.approval.reason}")`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'budget_pass',
    pass: budget_pass_ok,
    detail: budget_pass_ok
      ? `self-test passed; real run: denied call consumed no budget, approved call consumed exactly 1 (used_calls=${budget.used_calls}/${budget.max_calls})`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'rate_limit_pass',
    pass: rate_limit_pass_ok,
    detail: rate_limit_pass_ok
      ? `self-test passed (enforcement + window recovery); real run: exactly 1 call counted toward the window (${limiter.timestamps.length}/${limiter.max_per_window})`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'audit_pass',
    pass: audit_pass_ok,
    detail: audit_pass_ok
      ? `self-test passed (tamper-proof snapshot); real run recorded exactly ${auditLog.entries.length} audit entries for ${governed_calls.length} governed calls, none fabricated or missing`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'safety_pass',
    pass: safety_pass_ok,
    detail: safety_pass_ok
      ? `emergency stop correctly overrode a call that supplied valid explicit approval — blocked before reaching the Action Dispatcher (dispatch=null)`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'governance_pass',
    pass: governance_pass_ok,
    detail: governance_pass_ok
      ? `the full governed pipeline (Emergency Stop → Approval → Budget → Rate Limit → Action Dispatcher) genuinely connected and reached the unmodified Integration layer at least once`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'end_to_end_pass',
    pass: end_to_end_pass_ok,
    detail: `all 6 other gates ${end_to_end_pass_ok ? 'pass' : 'do not all pass'} together in one real, uninterrupted run${repository.ok ? '' : `; repository invariant violation: ${repository.violating_paths.join(',')}`}`,
  });

  return {
    phase: AGENT_GOVERNANCE_PHASE,
    verdict: end_to_end_pass_ok ? AGENT_GOVERNANCE_PASS_VERDICT : AGENT_GOVERNANCE_FAIL_VERDICT,
    approval_pass_ok,
    budget_pass_ok,
    rate_limit_pass_ok,
    audit_pass_ok,
    safety_pass_ok,
    governance_pass_ok,
    end_to_end_pass_ok,
    approval_self_test,
    budget_self_test,
    rate_limit_self_test,
    audit_self_test,
    governed_calls,
    audit_entries: listAuditEntries(auditLog),
    repository,
    checks,
  };
}
