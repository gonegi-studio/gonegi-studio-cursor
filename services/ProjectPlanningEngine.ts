/**
 * PHASE-AGENT-PLANNING-001 (Project Planning Intelligence Foundation): a
 * real, deterministic goal → task → dependency-ordered execution-plan
 * pipeline. This is NOT an LLM-backed "intelligent" planner — the live
 * agent connectors built in PHASE-AGENT-CONNECTOR-001..003 remain
 * unmodified and unused here (Live Connector 변경 금지, and they are
 * currently credential-blocked regardless — see
 * reports/live_agent_integration/CREDENTIAL_HOLD_REPORT.md). Decomposition
 * here means validating and normalizing a caller-supplied task list, not
 * generating one from a natural-language goal description. Dependency
 * ordering and consistency checking are genuine algorithms (topological
 * sort with real cycle detection; real duplicate/dangling-reference
 * detection) — see DependencyPlanningEngine.ts and
 * PlanningConsistencyEngine.ts for their real, independently-testable
 * implementations.
 */

import { decomposeGoal, type DecompositionResult } from './TaskDecompositionEngine.js';
import { planDependencyOrder, type DependencyPlanResult } from './DependencyPlanningEngine.js';
import { validatePlanningConsistency, type ConsistencyReport } from './PlanningConsistencyEngine.js';

export interface PlanningGoal {
  goal_id: string;
  title: string;
  description: string;
  /** Where this goal's truth comes from — a real file path or report, never fabricated. */
  source: string;
}

export type PlanningTaskStatus = 'blocked' | 'ready' | 'in_progress' | 'done';

export interface PlanningTaskInput {
  task_id: string;
  goal_id: string;
  title: string;
  description: string;
  depends_on: string[];
  status: PlanningTaskStatus;
  blocked_reason?: string;
}

export interface NormalizedPlanningTask extends PlanningTaskInput {}

export interface ExecutionPlan {
  goal_id: string;
  execution_order: string[];
  tasks: NormalizedPlanningTask[];
}

export interface ProjectPlanningResult {
  goal: PlanningGoal;
  decomposition: DecompositionResult;
  dependency: DependencyPlanResult;
  consistency: ConsistencyReport;
  execution_plan: ExecutionPlan | null;
  ready: boolean;
}

/**
 * Runs the full real pipeline for one goal: normalize/validate the raw task
 * list, check structural consistency (duplicates, dangling references,
 * cycles), and — only if consistent — compute a genuine dependency-respecting
 * execution order. Never fabricates an execution order for an inconsistent
 * graph; execution_plan is null whenever consistency fails.
 */
export function planGoal(goal: PlanningGoal, rawTasks: PlanningTaskInput[]): ProjectPlanningResult {
  const decomposition = decomposeGoal(goal, rawTasks);
  const consistency = validatePlanningConsistency(goal, decomposition.tasks);

  if (!consistency.ok) {
    return {
      goal,
      decomposition,
      dependency: { ok: false, execution_order: [], cycle: consistency.cycle },
      consistency,
      execution_plan: null,
      ready: false,
    };
  }

  const dependency = planDependencyOrder(decomposition.tasks);
  const execution_plan: ExecutionPlan | null = dependency.ok
    ? { goal_id: goal.goal_id, execution_order: dependency.execution_order, tasks: decomposition.tasks }
    : null;

  return {
    goal,
    decomposition,
    dependency,
    consistency,
    execution_plan,
    ready: decomposition.issues.length === 0 && consistency.ok && dependency.ok,
  };
}
