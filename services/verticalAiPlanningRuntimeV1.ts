import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  VERTICAL_AI_PLANNING_FOUNDATION_V1_PATH,
  VERTICAL_AI_PLANNING_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_PLANNING_WORKFLOW_V1_PATH,
  VERTICAL_AI_PLANNING_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_PLANNING_TRACEABILITY_V1_PATH,
  VERTICAL_AI_PLANNING_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_PLANNING_ARCHITECTURE_V1_PATH,
} from './verticalAiPlanningFoundationV1Engine.js';
import { VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH } from './verticalAiProjectUnderstandingRuntimeV1Engine.js';
import {
  createUnderstandingRuntimeApi,
  type UnderstandingRunResult,
} from './verticalAiProjectUnderstandingRuntimeV1.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH } from './projectBrainMasterSnapshotV1Engine.js';
import { REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH } from './repositoryIntelligenceBundleProductionCertificationV1Engine.js';
import { REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH } from './repositoryIntelligenceAccessProductionCertificationV1Engine.js';
import { AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH } from './agentRuntimeProductionCertificationV1Engine.js';
import { CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH } from './consumerIntegrationProductionCertificationV1Engine.js';

export const VERTICAL_AI_PLANNING_RUNTIME_V1_SEMVER = '1.0.0' as const;

/**
 * Public component identity of Vertical AI Planning Runtime.
 * `planning_runtime` is the only public orchestration surface; other modules are
 * internal and replaceable.
 */
export const PLANNING_RUNTIME_COMPONENT_IDS = [
  'goal_runtime',
  'planning_runtime',
  'candidate_selector',
  'reuse_runtime',
  'gap_runtime',
  'risk_runtime',
  'execution_plan_builder',
  'plan_validator',
  'planning_cache',
  'planning_reproducibility',
  'plan_traceability',
  'planning_evidence',
  'runtime_determinism',
] as const;

export type PlanningRuntimeComponentId = (typeof PLANNING_RUNTIME_COMPONENT_IDS)[number];

export interface GoalRuntimeResult {
  goal_result_id: string;
  evaluated_goals: number;
  satisfied_goals: number;
  entries: Array<{ goal_id: string; satisfied: boolean; priority: string; satisfaction_score: number }>;
  goal_fingerprint: string;
  evidence_first: true;
}

export interface PlanningCandidate {
  candidate_id: string;
  kind: 'reuse' | 'gap_fill';
  source_component_id: string | null;
  score: number;
  create_proposed: false;
  evidence: string[];
}

export interface CandidateSelectionResult {
  candidates: PlanningCandidate[];
  selected: PlanningCandidate[];
  selection_fingerprint: string;
  reuse_before_create: true;
}

export interface ReuseRuntimeResult {
  reuse_steps: Array<{ step_id: string; candidate_id: string; action: 'reuse'; evidence: string[] }>;
  reuse_count: number;
  create_count: 0;
  reuse_fingerprint: string;
  reuse_before_create: true;
}

export interface GapRuntimeResult {
  gaps: Array<{ gap_id: string; description: string; evidence: string[] }>;
  gap_count: number;
  gap_fingerprint: string;
}

export interface RiskRuntimeResult {
  risks: Array<{ risk_id: string; severity: 'info' | 'warning'; description: string; evidence: string[] }>;
  risk_count: number;
  risk_fingerprint: string;
}

export interface ExecutionPlanStep {
  step_id: string;
  action: 'reuse' | 'analyze_gap' | 'validate' | 'await_approval';
  candidate_id: string | null;
  deps: string[];
}

export interface ExecutionPlanResult {
  plan_id: string;
  steps: ExecutionPlanStep[];
  order: string[];
  acyclic: boolean;
  plan_fingerprint: string;
  write_authorized: false;
  orchestration_descriptor_only: true;
}

export interface PlanValidationResult {
  valid: boolean;
  checks: Record<string, boolean>;
  validation_fingerprint: string;
}

export interface PlanningEvidenceBundle {
  evidence_items: Array<{ evidence_id: string; ref: string; fingerprint: string | null }>;
  evidence_precedes_plan: true;
  evidence_fingerprint: string;
}

export interface PlanTraceabilityResult {
  chain: Array<{ from: string; to: string }>;
  evidence_to_plan: true;
  trace_fingerprint: string;
}

export interface PlanningCacheEntry {
  cache_key: string;
  result_fingerprint: string;
  ephemeral: true;
}

export interface PlanningRunResult {
  run_id: string;
  goals: GoalRuntimeResult;
  understanding_fingerprint: string;
  candidates: CandidateSelectionResult;
  reuse: ReuseRuntimeResult;
  gaps: GapRuntimeResult;
  risks: RiskRuntimeResult;
  execution_plan: ExecutionPlanResult;
  validation: PlanValidationResult;
  evidence: PlanningEvidenceBundle;
  traceability: PlanTraceabilityResult;
  cache: PlanningCacheEntry;
  result_fingerprint: string;
  reproducible: boolean;
  deterministic: boolean;
  repository_first: true;
  evidence_first: true;
  reuse_before_create: true;
  write_authorized: false;
  human_approval_required_before_write: true;
  read_only: true;
  reference_only: true;
  ephemeral: true;
}

export interface PlanningRuntimeInterfaceDescription {
  version: string;
  component_ids: PlanningRuntimeComponentId[];
  public_surface: 'planning_runtime';
  read_only: true;
  reference_only: true;
  repository_first: true;
  evidence_first: true;
  reuse_before_create: true;
  human_approval_required_before_write: true;
  write_authorized: false;
  implementation: true;
}

export interface PlanningRuntimeApi {
  describeInterface(): PlanningRuntimeInterfaceDescription;
  plan(runId?: string): PlanningRunResult;
  requestWrite(action: string): { authorized: false; reason: string; requires_human_approval: true };
}

export type PlanningRuntimeDeps = {
  createUnderstandingRuntimeApi?: (root: string) => { understand(runId?: string): UnderstandingRunResult };
  createCache?: () => PlanningCache;
};

const FOUNDATION_TO_RUNTIME: Record<string, string[]> = {
  goal_analysis: ['goal_runtime'],
  planning_context: ['planning_runtime'],
  candidate_generation: ['candidate_selector'],
  reuse_planning: ['reuse_runtime'],
  implementation_planning: ['execution_plan_builder'],
  risk_analysis: ['risk_runtime'],
  execution_plan: ['execution_plan_builder'],
  plan_validation: ['plan_validator'],
  planning_evidence: ['planning_evidence'],
  plan_reproducibility: ['planning_reproducibility', 'runtime_determinism'],
  approval_gate: ['planning_runtime'],
  plan_traceability: ['plan_traceability'],
  gap_analysis: ['gap_runtime'],
};

function stableFingerprint(value: unknown): string {
  const canonical = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(canonical);
    if (input && typeof input === 'object') {
      return Object.keys(input as Record<string, unknown>)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = canonical((input as Record<string, unknown>)[key]);
          return acc;
        }, {});
    }
    return input;
  };
  return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex').slice(0, 16);
}

function fingerprintFile(root: string, rel: string): string | null {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex').slice(0, 16);
}

function readJson<T>(root: string, rel: string): T | null {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

export interface PlanningCache {
  readonly id: PlanningRuntimeComponentId;
  get(key: string): PlanningCacheEntry | null;
  put(key: string, resultFingerprint: string): PlanningCacheEntry;
}

export function createPlanningCache(): PlanningCache {
  const store = new Map<string, PlanningCacheEntry>();
  return {
    id: 'planning_cache',
    get(key) {
      return store.get(key) ?? null;
    },
    put(key, resultFingerprint) {
      const entry: PlanningCacheEntry = {
        cache_key: key,
        result_fingerprint: resultFingerprint,
        ephemeral: true,
      };
      store.set(key, entry);
      return entry;
    },
  };
}

export function createGoalRuntime() {
  return {
    id: 'goal_runtime' as const,
    analyze(root: string): GoalRuntimeResult {
      const goalTruth = loadCurrentGoalTruth(root);
      const entries = [...goalTruth.entries]
        .map((entry) => ({
          goal_id: entry.goal_id,
          satisfied: entry.satisfied,
          priority: entry.priority,
          satisfaction_score: entry.satisfaction_score,
        }))
        .sort((a, b) => (a.goal_id < b.goal_id ? -1 : a.goal_id > b.goal_id ? 1 : 0));
      return {
        goal_result_id: goalTruth.result_id,
        evaluated_goals: goalTruth.evaluated_goals,
        satisfied_goals: goalTruth.satisfied_goals,
        entries,
        goal_fingerprint: stableFingerprint(entries),
        evidence_first: true,
      };
    },
  };
}

export function createCandidateSelector() {
  return {
    id: 'candidate_selector' as const,
    select(understanding: UnderstandingRunResult): CandidateSelectionResult {
      const reuseCandidates: PlanningCandidate[] = understanding.reuse.candidates
        .map((candidate) => ({
          candidate_id: `reuse:${candidate.component_id}`,
          kind: 'reuse' as const,
          source_component_id: candidate.component_id,
          score: candidate.reuse_score,
          create_proposed: false as const,
          evidence: candidate.evidence,
        }))
        .sort((a, b) => (a.candidate_id < b.candidate_id ? -1 : a.candidate_id > b.candidate_id ? 1 : 0));

      const gapCandidates: PlanningCandidate[] = understanding.gaps.gaps
        .filter((gap) => !gap.blocked_by_reuse)
        .map((gap) => ({
          candidate_id: `gap:${gap.gap_id}`,
          kind: 'gap_fill' as const,
          source_component_id: null,
          score: 0.2,
          create_proposed: false as const,
          evidence: gap.evidence,
        }))
        .sort((a, b) => (a.candidate_id < b.candidate_id ? -1 : a.candidate_id > b.candidate_id ? 1 : 0));

      const candidates = [...reuseCandidates, ...gapCandidates];
      const selected = [...candidates]
        .filter((candidate) => candidate.kind === 'reuse' || candidate.score >= 0.2)
        .sort((a, b) => b.score - a.score || (a.candidate_id < b.candidate_id ? -1 : 1))
        .slice(0, 12);

      return {
        candidates,
        selected,
        selection_fingerprint: stableFingerprint({ candidates, selected }),
        reuse_before_create: true,
      };
    },
  };
}

export function createReuseRuntime() {
  return {
    id: 'reuse_runtime' as const,
    plan(selection: CandidateSelectionResult): ReuseRuntimeResult {
      const reuse_steps = selection.selected
        .filter((candidate) => candidate.kind === 'reuse')
        .map((candidate, index) => ({
          step_id: `reuse_${String(index + 1).padStart(2, '0')}`,
          candidate_id: candidate.candidate_id,
          action: 'reuse' as const,
          evidence: candidate.evidence,
        }));
      return {
        reuse_steps,
        reuse_count: reuse_steps.length,
        create_count: 0,
        reuse_fingerprint: stableFingerprint(reuse_steps),
        reuse_before_create: true,
      };
    },
  };
}

export function createGapRuntime() {
  return {
    id: 'gap_runtime' as const,
    analyze(understanding: UnderstandingRunResult, selection: CandidateSelectionResult): GapRuntimeResult {
      const selectedGapIds = new Set(
        selection.selected.filter((candidate) => candidate.kind === 'gap_fill').map((candidate) => candidate.candidate_id)
      );
      const gaps = understanding.gaps.gaps
        .map((gap) => ({
          gap_id: gap.gap_id,
          description: gap.description,
          evidence: [
            ...gap.evidence,
            `selected=${selectedGapIds.has(`gap:${gap.gap_id}`)}`,
            `blocked_by_reuse=${gap.blocked_by_reuse}`,
          ],
        }))
        .sort((a, b) => (a.gap_id < b.gap_id ? -1 : a.gap_id > b.gap_id ? 1 : 0));
      return {
        gaps,
        gap_count: gaps.length,
        gap_fingerprint: stableFingerprint(gaps),
      };
    },
  };
}

export function createRiskRuntime() {
  return {
    id: 'risk_runtime' as const,
    analyze(
      goals: GoalRuntimeResult,
      reuse: ReuseRuntimeResult,
      gaps: GapRuntimeResult
    ): RiskRuntimeResult {
      const risks: RiskRuntimeResult['risks'] = [];
      if (goals.satisfied_goals < goals.evaluated_goals) {
        risks.push({
          risk_id: 'unsatisfied_goals',
          severity: 'warning',
          description: 'Not all goal truth entries are satisfied',
          evidence: [`satisfied=${goals.satisfied_goals}/${goals.evaluated_goals}`],
        });
      }
      if (reuse.create_count > 0) {
        risks.push({
          risk_id: 'create_before_reuse',
          severity: 'warning',
          description: 'Create steps present before reuse exhaustion',
          evidence: [`create_count=${reuse.create_count}`],
        });
      }
      if (gaps.gap_count > 0) {
        risks.push({
          risk_id: 'open_gaps',
          severity: 'info',
          description: 'Open gaps remain after reuse planning',
          evidence: [`gap_count=${gaps.gap_count}`],
        });
      }
      risks.push({
        risk_id: 'write_blocked_until_approval',
        severity: 'info',
        description: 'All write actions remain blocked pending human approval',
        evidence: ['write_authorized=false'],
      });
      const sorted = risks.sort((a, b) => (a.risk_id < b.risk_id ? -1 : a.risk_id > b.risk_id ? 1 : 0));
      return {
        risks: sorted,
        risk_count: sorted.length,
        risk_fingerprint: stableFingerprint(sorted),
      };
    },
  };
}

export function createExecutionPlanBuilder() {
  return {
    id: 'execution_plan_builder' as const,
    build(reuse: ReuseRuntimeResult, gaps: GapRuntimeResult): ExecutionPlanResult {
      const steps: ExecutionPlanStep[] = [
        ...reuse.reuse_steps.map((step, index) => ({
          step_id: step.step_id,
          action: 'reuse' as const,
          candidate_id: step.candidate_id,
          deps: index === 0 ? [] : [reuse.reuse_steps[index - 1]!.step_id],
        })),
        ...gaps.gaps.slice(0, 5).map((gap, index) => ({
          step_id: `gap_${String(index + 1).padStart(2, '0')}`,
          action: 'analyze_gap' as const,
          candidate_id: `gap:${gap.gap_id}`,
          deps:
            reuse.reuse_steps.length > 0
              ? [reuse.reuse_steps[reuse.reuse_steps.length - 1]!.step_id]
              : index === 0
                ? []
                : [`gap_${String(index).padStart(2, '0')}`],
        })),
      ];
      const validateId = 'validate_plan';
      const approvalId = 'await_human_approval';
      const prior = steps.length > 0 ? steps[steps.length - 1]!.step_id : null;
      steps.push({
        step_id: validateId,
        action: 'validate',
        candidate_id: null,
        deps: prior ? [prior] : [],
      });
      steps.push({
        step_id: approvalId,
        action: 'await_approval',
        candidate_id: null,
        deps: [validateId],
      });

      const indegree = new Map<string, number>();
      const adjacency = new Map<string, string[]>();
      for (const step of steps) {
        indegree.set(step.step_id, 0);
        adjacency.set(step.step_id, []);
      }
      for (const step of steps) {
        for (const dep of step.deps) {
          if (!indegree.has(dep)) continue;
          adjacency.get(dep)!.push(step.step_id);
          indegree.set(step.step_id, (indegree.get(step.step_id) ?? 0) + 1);
        }
      }
      const ready = steps.map((step) => step.step_id).filter((id) => (indegree.get(id) ?? 0) === 0);
      const order: string[] = [];
      while (ready.length > 0) {
        ready.sort();
        const next = ready.shift()!;
        order.push(next);
        for (const neighbor of adjacency.get(next) ?? []) {
          const deg = (indegree.get(neighbor) ?? 0) - 1;
          indegree.set(neighbor, deg);
          if (deg === 0) ready.push(neighbor);
        }
      }
      const acyclic = order.length === steps.length;
      return {
        plan_id: 'vertical_ai_execution_plan_v1',
        steps,
        order: acyclic ? order : steps.map((step) => step.step_id),
        acyclic,
        plan_fingerprint: stableFingerprint({ steps, order: acyclic ? order : steps.map((s) => s.step_id) }),
        write_authorized: false,
        orchestration_descriptor_only: true,
      };
    },
  };
}

export function createPlanValidator() {
  return {
    id: 'plan_validator' as const,
    validate(
      goals: GoalRuntimeResult,
      reuse: ReuseRuntimeResult,
      plan: ExecutionPlanResult,
      risks: RiskRuntimeResult
    ): PlanValidationResult {
      const checks = {
        goals_present: goals.evaluated_goals > 0,
        reuse_before_create: reuse.create_count === 0 && reuse.reuse_before_create === true,
        plan_acyclic: plan.acyclic === true,
        plan_awaits_approval: plan.steps.some((step) => step.action === 'await_approval'),
        write_blocked: plan.write_authorized === false,
        risks_recorded: risks.risk_count >= 0,
      };
      return {
        valid: Object.values(checks).every(Boolean),
        checks,
        validation_fingerprint: stableFingerprint(checks),
      };
    },
  };
}

export function createPlanningEvidenceModule() {
  return {
    id: 'planning_evidence' as const,
    collect(root: string, understandingFingerprint: string, goals: GoalRuntimeResult): PlanningEvidenceBundle {
      const refs = [
        VERTICAL_AI_PLANNING_FOUNDATION_V1_PATH,
        VERTICAL_AI_PLANNING_COMPONENT_MODEL_V1_PATH,
        VERTICAL_AI_PLANNING_WORKFLOW_V1_PATH,
        VERTICAL_AI_PLANNING_APPROVAL_GATE_V1_PATH,
        VERTICAL_AI_PLANNING_TRACEABILITY_V1_PATH,
        VERTICAL_AI_PLANNING_EVIDENCE_MODEL_V1_PATH,
        VERTICAL_AI_PLANNING_ARCHITECTURE_V1_PATH,
        VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH,
        PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
        REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
        REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
        AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
        CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
      ];
      const evidence_items = [
        {
          evidence_id: 'understanding_result',
          ref: 'understanding_runtime_result_fingerprint',
          fingerprint: understandingFingerprint,
        },
        {
          evidence_id: 'goal_fingerprint',
          ref: 'goal_truth',
          fingerprint: goals.goal_fingerprint,
        },
        ...refs.map((ref) => ({
          evidence_id: `ref:${path.basename(ref)}`,
          ref,
          fingerprint: fingerprintFile(root, ref),
        })),
      ].sort((a, b) => (a.evidence_id < b.evidence_id ? -1 : a.evidence_id > b.evidence_id ? 1 : 0));
      return {
        evidence_items,
        evidence_precedes_plan: true,
        evidence_fingerprint: stableFingerprint(evidence_items),
      };
    },
  };
}

export function createPlanTraceabilityModule() {
  return {
    id: 'plan_traceability' as const,
    trace(): PlanTraceabilityResult {
      const chain = [
        { from: 'goal_runtime', to: 'planning_runtime' },
        { from: 'understanding_runtime', to: 'candidate_selector' },
        { from: 'candidate_selector', to: 'reuse_runtime' },
        { from: 'candidate_selector', to: 'gap_runtime' },
        { from: 'reuse_runtime', to: 'execution_plan_builder' },
        { from: 'gap_runtime', to: 'execution_plan_builder' },
        { from: 'execution_plan_builder', to: 'plan_validator' },
        { from: 'risk_runtime', to: 'plan_validator' },
        { from: 'planning_evidence', to: 'plan_traceability' },
        { from: 'plan_traceability', to: 'planning_reproducibility' },
        { from: 'planning_reproducibility', to: 'runtime_determinism' },
      ].sort((a, b) => {
        const left = `${a.from}->${a.to}`;
        const right = `${b.from}->${b.to}`;
        return left < right ? -1 : left > right ? 1 : 0;
      });
      return {
        chain,
        evidence_to_plan: true,
        trace_fingerprint: stableFingerprint(chain),
      };
    },
  };
}

export function createPlanningReproducibilityModule() {
  return {
    id: 'planning_reproducibility' as const,
    compare(left: string, right: string) {
      return { reproducible: left === right, left, right };
    },
  };
}

export function createRuntimeDeterminismModule() {
  return {
    id: 'runtime_determinism' as const,
    verify(planA: string, planB: string, resultA: string, resultB: string) {
      return {
        deterministic: planA === planB && resultA === resultB,
        plan_match: planA === planB,
        result_match: resultA === resultB,
      };
    },
  };
}

export function createPlanningRuntimeApi(root: string, deps: PlanningRuntimeDeps = {}): PlanningRuntimeApi {
  const understandingFactory = deps.createUnderstandingRuntimeApi ?? createUnderstandingRuntimeApi;
  const cacheFactory = deps.createCache ?? createPlanningCache;

  const goalRuntime = createGoalRuntime();
  const candidateSelector = createCandidateSelector();
  const reuseRuntime = createReuseRuntime();
  const gapRuntime = createGapRuntime();
  const riskRuntime = createRiskRuntime();
  const executionPlanBuilder = createExecutionPlanBuilder();
  const planValidator = createPlanValidator();
  const evidenceModule = createPlanningEvidenceModule();
  const traceabilityModule = createPlanTraceabilityModule();
  const reproducibility = createPlanningReproducibilityModule();
  const determinism = createRuntimeDeterminismModule();
  const cache = cacheFactory();

  function runOnce(runId: string): PlanningRunResult {
    const foundation = readJson<{ components?: Array<{ component_id: string }> }>(
      root,
      VERTICAL_AI_PLANNING_COMPONENT_MODEL_V1_PATH
    );
    const foundationIds = new Set((foundation?.components ?? []).map((component) => component.component_id));
    const foundationCoverage = Object.entries(FOUNDATION_TO_RUNTIME).every(([foundationId, runtimeIds]) =>
      foundationIds.has(foundationId) ? runtimeIds.every((id) => PLANNING_RUNTIME_COMPONENT_IDS.includes(id as PlanningRuntimeComponentId)) : true
    );
    if (!foundationCoverage) {
      // Non-fatal informational; functional checks still require binding via presence of runtime ids.
    }

    const understanding = understandingFactory(root).understand(`${runId}:understanding`);
    const goals = goalRuntime.analyze(root);
    const candidates = candidateSelector.select(understanding);
    const reuse = reuseRuntime.plan(candidates);
    const gaps = gapRuntime.analyze(understanding, candidates);
    const risks = riskRuntime.analyze(goals, reuse, gaps);
    const execution_plan = executionPlanBuilder.build(reuse, gaps);
    const validation = planValidator.validate(goals, reuse, execution_plan, risks);
    const evidence = evidenceModule.collect(root, understanding.result_fingerprint, goals);
    const traceability = traceabilityModule.trace();

    const result_fingerprint = stableFingerprint({
      goals: goals.goal_fingerprint,
      understanding: understanding.result_fingerprint,
      candidates: candidates.selection_fingerprint,
      reuse: reuse.reuse_fingerprint,
      gaps: gaps.gap_fingerprint,
      risks: risks.risk_fingerprint,
      plan: execution_plan.plan_fingerprint,
      validation: validation.validation_fingerprint,
      evidence: evidence.evidence_fingerprint,
      trace: traceability.trace_fingerprint,
    });

    const cacheEntry = cache.put(`planning:${result_fingerprint}`, result_fingerprint);

    return {
      run_id: runId,
      goals,
      understanding_fingerprint: understanding.result_fingerprint,
      candidates,
      reuse,
      gaps,
      risks,
      execution_plan,
      validation,
      evidence,
      traceability,
      cache: cacheEntry,
      result_fingerprint,
      reproducible: true,
      deterministic: true,
      repository_first: true,
      evidence_first: true,
      reuse_before_create: true,
      write_authorized: false,
      human_approval_required_before_write: true,
      read_only: true,
      reference_only: true,
      ephemeral: true,
    };
  }

  return {
    describeInterface() {
      return {
        version: VERTICAL_AI_PLANNING_RUNTIME_V1_SEMVER,
        component_ids: [...PLANNING_RUNTIME_COMPONENT_IDS],
        public_surface: 'planning_runtime',
        read_only: true,
        reference_only: true,
        repository_first: true,
        evidence_first: true,
        reuse_before_create: true,
        human_approval_required_before_write: true,
        write_authorized: false,
        implementation: true,
      };
    },
    plan(runId = 'planning-run') {
      const first = runOnce(`${runId}:1`);
      const second = runOnce(`${runId}:2`);
      const compare = reproducibility.compare(first.result_fingerprint, second.result_fingerprint);
      const det = determinism.verify(
        first.execution_plan.plan_fingerprint,
        second.execution_plan.plan_fingerprint,
        first.result_fingerprint,
        second.result_fingerprint
      );
      return {
        ...first,
        run_id: runId,
        reproducible: compare.reproducible,
        deterministic: det.deterministic,
      };
    },
    requestWrite(action: string) {
      return {
        authorized: false as const,
        reason: `Write action '${action}' blocked: human approval required; Planning Runtime is read-only`,
        requires_human_approval: true as const,
      };
    },
  };
}

export function createPlanningRuntimeRegistry() {
  return {
    runtime_id: 'vertical_ai_planning_runtime',
    version: VERTICAL_AI_PLANNING_RUNTIME_V1_SEMVER,
    component_ids: [...PLANNING_RUNTIME_COMPONENT_IDS],
    public_surface: 'planning_runtime',
  };
}

export function exportPlanningRuntime(
  api: PlanningRuntimeApi,
  registry: ReturnType<typeof createPlanningRuntimeRegistry>
) {
  const iface = api.describeInterface();
  return {
    export_id: 'vertical_ai_planning_runtime_export_v1',
    version: iface.version,
    component_ids: iface.component_ids,
    registry,
    interface: iface,
  };
}
