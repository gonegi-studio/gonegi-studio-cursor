import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  createUnderstandingRuntimeApi,
  type UnderstandingRunResult,
} from './verticalAiProjectUnderstandingRuntimeV1.js';
import {
  VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PATH,
  VERTICAL_AI_V2_APPROVAL_STRATEGY_V1_PATH,
  VERTICAL_AI_V2_EXECUTION_STRATEGY_V1_PATH,
  VERTICAL_AI_V2_VALIDATION_STRATEGY_V1_PATH,
} from './verticalAiV2ImplementationPlanningV1Engine.js';
import { VERTICAL_AI_V2_REPOSITORY_OPERATION_SCOPE_V1_PATH } from './verticalAiV2RoadmapV1Engine.js';
import { PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH } from './projectBrainMasterSnapshotV1Engine.js';
import { CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH } from './consumerIntegrationProductionCertificationV1Engine.js';
import { CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './claudeConnectorProductionCertificationV1Engine.js';
import { CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './chatgptConnectorProductionCertificationV1Engine.js';
import { GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './geminiConnectorProductionCertificationV1Engine.js';
import { CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './cursorConnectorProductionCertificationV1Engine.js';
import { MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './mcpConnectorProductionCertificationV1Engine.js';
import { VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH } from './verticalAiCompleteCertificationV1Engine.js';
import { VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH } from './verticalAiFinalCertificationV1Engine.js';

export const VERTICAL_AI_REPOSITORY_OPERATION_RUNTIME_V1_SEMVER = '1.0.0' as const;

/** Public surface: repository_operation_runtime only. */
export const REPOSITORY_OPERATION_RUNTIME_COMPONENT_IDS = [
  'repository_operation_runtime',
  'repository_change_analyzer',
  'reuse_decision_engine',
  'duplicate_prevention',
  'impact_analyzer',
  'operation_evidence',
  'operation_traceability',
  'operation_reproducibility',
  'repository_operation_boundary',
  'approval_gate',
  'operation_contract_conformance',
] as const;

export type RepositoryOperationRuntimeComponentId =
  (typeof REPOSITORY_OPERATION_RUNTIME_COMPONENT_IDS)[number];

const CONNECTOR_SNAPSHOTS = [
  CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
] as const;

export interface ChangeAnalysisResult {
  changes: Array<{
    change_id: string;
    surface_id: string;
    change_kind: 'inventory' | 'gap' | 'duplicate' | 'reuse_candidate';
    evidence: string[];
  }>;
  change_count: number;
  analysis_fingerprint: string;
  repository_mutated: false;
}

export interface ReuseDecisionResult {
  decisions: Array<{
    candidate_id: string;
    action: 'reuse';
    create_proposed: false;
    reuse_score: number;
    evidence: string[];
  }>;
  reuse_count: number;
  create_count: 0;
  reuse_before_create: true;
  decision_fingerprint: string;
}

export interface DuplicatePreventionResult {
  duplicates_detected: number;
  prevented_create_count: number;
  prevention_actions: Array<{ duplicate_id: string; action: 'block_create'; evidence: string[] }>;
  prevention_fingerprint: string;
}

export interface ImpactAnalysisResult {
  impacts: Array<{
    impact_id: string;
    target: string;
    severity: 'info' | 'warning';
    requires_approval: boolean;
    evidence: string[];
  }>;
  impact_count: number;
  analysis_fingerprint: string;
}

export interface ApprovalGateResult {
  gate_id: 'gate_repository_write';
  authorized: false;
  requires_human_approval: true;
  execute_authorized: false;
  repository_mutation_forbidden: true;
  reason: string;
  gate_fingerprint: string;
}

export interface OperationEvidenceBundle {
  evidence_items: Array<{ evidence_id: string; ref: string; fingerprint: string | null }>;
  evidence_precedes_operation: true;
  evidence_fingerprint: string;
}

export interface OperationTraceabilityResult {
  chain: Array<{ from: string; to: string }>;
  evidence_to_operation: true;
  trace_fingerprint: string;
}

export interface OperationContractConformanceResult {
  conforms: boolean;
  contracts: Record<string, boolean>;
  conformance_fingerprint: string;
}

export interface RepositoryOperationBoundaryResult {
  intact: boolean;
  boundaries: Record<string, boolean>;
  boundary_fingerprint: string;
}

export interface OperationCacheEntry {
  cache_key: string;
  result_fingerprint: string;
  ephemeral: true;
}

export interface RepositoryOperationRunResult {
  run_id: string;
  understanding_fingerprint: string;
  change_analysis: ChangeAnalysisResult;
  reuse_decision: ReuseDecisionResult;
  duplicate_prevention: DuplicatePreventionResult;
  impact_analysis: ImpactAnalysisResult;
  approval_gate: ApprovalGateResult;
  evidence: OperationEvidenceBundle;
  traceability: OperationTraceabilityResult;
  contract_conformance: OperationContractConformanceResult;
  boundary: RepositoryOperationBoundaryResult;
  cache: OperationCacheEntry;
  result_fingerprint: string;
  reproducible: boolean;
  deterministic: boolean;
  repository_first: true;
  evidence_first: true;
  reuse_before_create: true;
  write_authorized: false;
  human_approval_required_before_repository_mutation: true;
  repository_mutation_forbidden: true;
  repository_mutation: false;
  certified_boundaries_preserved: boolean;
  repository_operation_operational: boolean;
  ready_for_multi_ai_operation: boolean;
  read_only: true;
  reference_only: true;
  ephemeral: true;
}

export interface RepositoryOperationRuntimeInterfaceDescription {
  version: string;
  component_ids: RepositoryOperationRuntimeComponentId[];
  public_surface: 'repository_operation_runtime';
  read_only: true;
  reference_only: true;
  repository_first: true;
  evidence_first: true;
  reuse_before_create: true;
  human_approval_required_before_repository_mutation: true;
  write_authorized: false;
  repository_mutation_forbidden: true;
  implementation: true;
}

export interface RepositoryOperationRuntimeApi {
  describeInterface(): RepositoryOperationRuntimeInterfaceDescription;
  operate(runId?: string): RepositoryOperationRunResult;
  requestRepositoryMutation(action: string): {
    authorized: false;
    reason: string;
    requires_human_approval: true;
    repository_mutation_forbidden: true;
  };
}

export type RepositoryOperationRuntimeDeps = {
  createUnderstandingRuntimeApi?: (root: string) => {
    understand(runId?: string): UnderstandingRunResult;
  };
  createCache?: () => RepositoryOperationCache;
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

function pathExists(root: string, rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
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

export interface RepositoryOperationCache {
  readonly id: RepositoryOperationRuntimeComponentId;
  get(key: string): OperationCacheEntry | null;
  put(key: string, resultFingerprint: string): OperationCacheEntry;
}

export function createRepositoryOperationCache(): RepositoryOperationCache {
  const store = new Map<string, OperationCacheEntry>();
  return {
    id: 'operation_reproducibility',
    get(key) {
      return store.get(key) ?? null;
    },
    put(key, resultFingerprint) {
      const entry: OperationCacheEntry = {
        cache_key: key,
        result_fingerprint: resultFingerprint,
        ephemeral: true,
      };
      store.set(key, entry);
      return entry;
    },
  };
}

export function createRepositoryChangeAnalyzer() {
  return {
    id: 'repository_change_analyzer' as const,
    analyze(understanding: UnderstandingRunResult): ChangeAnalysisResult {
      const changes: ChangeAnalysisResult['changes'] = [];
      for (const surface of understanding.scan.surfaces) {
        changes.push({
          change_id: `change_inventory_${surface.surface_id}`,
          surface_id: surface.surface_id,
          change_kind: 'inventory',
          evidence: [`scan:${surface.surface_id}`, surface.ref],
        });
      }
      for (const gap of understanding.gaps.gaps) {
        changes.push({
          change_id: `change_gap_${gap.gap_id}`,
          surface_id: 'gap_surface',
          change_kind: 'gap',
          evidence: gap.evidence,
        });
      }
      for (const dup of understanding.duplicates.duplicates) {
        changes.push({
          change_id: `change_duplicate_${dup.signature}`,
          surface_id: 'duplicate_surface',
          change_kind: 'duplicate',
          evidence: [`duplicate:${dup.signature}`, ...dup.component_ids],
        });
      }
      for (const candidate of understanding.reuse.candidates) {
        changes.push({
          change_id: `change_reuse_${candidate.component_id}`,
          surface_id: 'reuse_surface',
          change_kind: 'reuse_candidate',
          evidence: candidate.evidence,
        });
      }
      const sorted = changes.sort((a, b) =>
        a.change_id < b.change_id ? -1 : a.change_id > b.change_id ? 1 : 0
      );
      return {
        changes: sorted,
        change_count: sorted.length,
        analysis_fingerprint: stableFingerprint(sorted),
        repository_mutated: false,
      };
    },
  };
}

export function createReuseDecisionEngine() {
  return {
    id: 'reuse_decision_engine' as const,
    decide(understanding: UnderstandingRunResult): ReuseDecisionResult {
      const decisions = understanding.reuse.candidates
        .map((candidate) => ({
          candidate_id: candidate.component_id,
          action: 'reuse' as const,
          create_proposed: false as const,
          reuse_score: candidate.reuse_score,
          evidence: candidate.evidence,
        }))
        .sort((a, b) =>
          a.candidate_id < b.candidate_id ? -1 : a.candidate_id > b.candidate_id ? 1 : 0
        );
      return {
        decisions,
        reuse_count: decisions.length,
        create_count: 0,
        reuse_before_create: true,
        decision_fingerprint: stableFingerprint(decisions),
      };
    },
  };
}

export function createDuplicatePrevention() {
  return {
    id: 'duplicate_prevention' as const,
    prevent(understanding: UnderstandingRunResult): DuplicatePreventionResult {
      const prevention_actions = understanding.duplicates.duplicates
        .map((dup) => ({
          duplicate_id: dup.signature,
          action: 'block_create' as const,
          evidence: [`duplicate:${dup.signature}`, ...dup.component_ids],
        }))
        .sort((a, b) =>
          a.duplicate_id < b.duplicate_id ? -1 : a.duplicate_id > b.duplicate_id ? 1 : 0
        );
      return {
        duplicates_detected: prevention_actions.length,
        prevented_create_count: prevention_actions.length,
        prevention_actions,
        prevention_fingerprint: stableFingerprint(prevention_actions),
      };
    },
  };
}

export function createImpactAnalyzer() {
  return {
    id: 'impact_analyzer' as const,
    analyze(
      root: string,
      change: ChangeAnalysisResult,
      reuse: ReuseDecisionResult,
      duplicates: DuplicatePreventionResult
    ): ImpactAnalysisResult {
      const impacts: ImpactAnalysisResult['impacts'] = [
        {
          impact_id: 'impact_platform_core_baseline',
          target: PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
          severity: 'info',
          requires_approval: true,
          evidence: [`present=${pathExists(root, PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH)}`],
        },
        {
          impact_id: 'impact_cil_baseline',
          target: CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
          severity: 'info',
          requires_approval: true,
          evidence: [`present=${pathExists(root, CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH)}`],
        },
        {
          impact_id: 'impact_change_surface',
          target: 'repository_operation_scope',
          severity: change.change_count > 0 ? 'warning' : 'info',
          requires_approval: true,
          evidence: [`change_count=${change.change_count}`],
        },
        {
          impact_id: 'impact_reuse_create_gate',
          target: 'reuse_decision_engine',
          severity: 'info',
          requires_approval: true,
          evidence: [`reuse=${reuse.reuse_count}`, `create=${reuse.create_count}`],
        },
        {
          impact_id: 'impact_duplicate_prevention',
          target: 'duplicate_prevention',
          severity: duplicates.duplicates_detected > 0 ? 'warning' : 'info',
          requires_approval: true,
          evidence: [`duplicates=${duplicates.duplicates_detected}`],
        },
      ];
      const sorted = impacts.sort((a, b) =>
        a.impact_id < b.impact_id ? -1 : a.impact_id > b.impact_id ? 1 : 0
      );
      return {
        impacts: sorted,
        impact_count: sorted.length,
        analysis_fingerprint: stableFingerprint(sorted),
      };
    },
  };
}

export function createApprovalGate() {
  return {
    id: 'approval_gate' as const,
    evaluate(root: string, impact: ImpactAnalysisResult): ApprovalGateResult {
      const approval = readJson<{
        human_approval_required?: boolean;
        gates?: Array<{ gate_id: string; default?: string }>;
      }>(root, VERTICAL_AI_V2_APPROVAL_STRATEGY_V1_PATH);
      return {
        gate_id: 'gate_repository_write',
        authorized: false,
        requires_human_approval: true,
        execute_authorized: false,
        repository_mutation_forbidden: true,
        reason: `Repository mutation denied: human approval required; ${impact.impact_count} impacts require approval; planning_gate_default=${
          approval?.gates?.find((g) => g.gate_id === 'gate_repository_write')?.default ?? 'denied'
        }`,
        gate_fingerprint: stableFingerprint({
          gate: 'gate_repository_write',
          authorized: false,
          impacts: impact.analysis_fingerprint,
        }),
      };
    },
  };
}

export function createOperationEvidenceModule() {
  return {
    id: 'operation_evidence' as const,
    collect(
      root: string,
      understanding: UnderstandingRunResult,
      change: ChangeAnalysisResult,
      reuse: ReuseDecisionResult,
      duplicates: DuplicatePreventionResult,
      impact: ImpactAnalysisResult,
      approval: ApprovalGateResult
    ): OperationEvidenceBundle {
      const evidence_items = [
        {
          evidence_id: 'understanding',
          ref: 'understanding_runtime_result_fingerprint',
          fingerprint: understanding.result_fingerprint,
        },
        {
          evidence_id: 'change_analysis',
          ref: 'repository_change_analyzer',
          fingerprint: change.analysis_fingerprint,
        },
        {
          evidence_id: 'reuse_decision',
          ref: 'reuse_decision_engine',
          fingerprint: reuse.decision_fingerprint,
        },
        {
          evidence_id: 'duplicate_prevention',
          ref: 'duplicate_prevention',
          fingerprint: duplicates.prevention_fingerprint,
        },
        {
          evidence_id: 'impact_analysis',
          ref: 'impact_analyzer',
          fingerprint: impact.analysis_fingerprint,
        },
        {
          evidence_id: 'approval_gate',
          ref: 'approval_gate',
          fingerprint: approval.gate_fingerprint,
        },
        {
          evidence_id: 'operation_scope',
          ref: VERTICAL_AI_V2_REPOSITORY_OPERATION_SCOPE_V1_PATH,
          fingerprint: fingerprintFile(root, VERTICAL_AI_V2_REPOSITORY_OPERATION_SCOPE_V1_PATH),
        },
        {
          evidence_id: 'implementation_planning',
          ref: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PATH,
          fingerprint: fingerprintFile(root, VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PATH),
        },
      ];
      return {
        evidence_items,
        evidence_precedes_operation: true,
        evidence_fingerprint: stableFingerprint(evidence_items),
      };
    },
  };
}

export function createOperationTraceabilityModule() {
  return {
    id: 'operation_traceability' as const,
    trace(): OperationTraceabilityResult {
      const chain = [
        { from: 'operation_evidence', to: 'repository_change_analyzer' },
        { from: 'repository_change_analyzer', to: 'reuse_decision_engine' },
        { from: 'reuse_decision_engine', to: 'duplicate_prevention' },
        { from: 'duplicate_prevention', to: 'impact_analyzer' },
        { from: 'impact_analyzer', to: 'approval_gate' },
        { from: 'approval_gate', to: 'repository_operation_runtime' },
        { from: 'operation_evidence', to: 'operation_contract_conformance' },
        { from: 'repository_operation_boundary', to: 'repository_operation_runtime' },
      ];
      return {
        chain,
        evidence_to_operation: true,
        trace_fingerprint: stableFingerprint(chain),
      };
    },
  };
}

export function createOperationContractConformanceModule() {
  return {
    id: 'operation_contract_conformance' as const,
    check(
      root: string,
      reuse: ReuseDecisionResult,
      duplicates: DuplicatePreventionResult,
      approval: ApprovalGateResult,
      change: ChangeAnalysisResult
    ): OperationContractConformanceResult {
      const scope = readJson<{
        mutation_policy?: { repository_mutation_forbidden_by_default?: boolean };
      }>(root, VERTICAL_AI_V2_REPOSITORY_OPERATION_SCOPE_V1_PATH);
      const execution = readJson<{ repository_first?: boolean; evidence_first?: boolean }>(
        root,
        VERTICAL_AI_V2_EXECUTION_STRATEGY_V1_PATH
      );
      const validation = readJson<{ stages?: Array<{ stage_id: string }> }>(
        root,
        VERTICAL_AI_V2_VALIDATION_STRATEGY_V1_PATH
      );
      const contracts = {
        reuse_before_create: reuse.reuse_before_create === true && reuse.create_count === 0,
        duplicate_prevention_active: typeof duplicates.prevention_fingerprint === 'string',
        approval_denies_mutation: approval.authorized === false,
        mutation_forbidden_default:
          scope?.mutation_policy?.repository_mutation_forbidden_by_default === true,
        repository_first: execution?.repository_first === true,
        evidence_first: execution?.evidence_first === true,
        planning_bound: pathExists(root, VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PATH),
        validation_gate_present:
          validation?.stages?.some((s) => s.stage_id === 'val_repository_operation_gates') === true,
        change_analysis_present: change.repository_mutated === false,
      };
      return {
        conforms: Object.values(contracts).every((v) => v === true),
        contracts,
        conformance_fingerprint: stableFingerprint(contracts),
      };
    },
  };
}

export function createRepositoryOperationBoundaryModule() {
  return {
    id: 'repository_operation_boundary' as const,
    verify(
      root: string,
      approval: ApprovalGateResult,
      change: ChangeAnalysisResult
    ): RepositoryOperationBoundaryResult {
      const boundaries = {
        platform_core_present: pathExists(root, PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH),
        cil_present: pathExists(root, CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH),
        vertical_ai_v1_present: pathExists(root, VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH),
        vertical_ai_v1_master_v2_present: pathExists(root, VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH),
        connectors_present: CONNECTOR_SNAPSHOTS.every((rel) => pathExists(root, rel)),
        approval_blocks_write: approval.authorized === false,
        change_non_mutating: change.repository_mutated === false,
        mutation_forbidden: approval.repository_mutation_forbidden === true,
      };
      return {
        intact: Object.values(boundaries).every((v) => v === true),
        boundaries,
        boundary_fingerprint: stableFingerprint(boundaries),
      };
    },
  };
}

export function createOperationReproducibilityModule() {
  return {
    id: 'operation_reproducibility' as const,
    compare(left: string, right: string) {
      return { reproducible: left === right, left, right };
    },
  };
}

export function createRuntimeDeterminismModule() {
  return {
    verify(a: string, b: string, resultA: string, resultB: string) {
      return {
        deterministic: a === b && resultA === resultB,
        dispatch_match: a === b,
        result_match: resultA === resultB,
      };
    },
  };
}

export function createRepositoryOperationRuntimeApi(
  root: string,
  deps: RepositoryOperationRuntimeDeps = {}
): RepositoryOperationRuntimeApi {
  const understandingFactory = deps.createUnderstandingRuntimeApi ?? createUnderstandingRuntimeApi;
  const cacheFactory = deps.createCache ?? createRepositoryOperationCache;
  let cachedUnderstanding: UnderstandingRunResult | null = null;

  const changeAnalyzer = createRepositoryChangeAnalyzer();
  const reuseDecisionEngine = createReuseDecisionEngine();
  const duplicatePrevention = createDuplicatePrevention();
  const impactAnalyzer = createImpactAnalyzer();
  const approvalGate = createApprovalGate();
  const evidenceModule = createOperationEvidenceModule();
  const traceabilityModule = createOperationTraceabilityModule();
  const contractConformance = createOperationContractConformanceModule();
  const boundaryModule = createRepositoryOperationBoundaryModule();
  const reproducibility = createOperationReproducibilityModule();
  const determinism = createRuntimeDeterminismModule();
  const cache = cacheFactory();

  function runOnce(runId: string): RepositoryOperationRunResult {
    if (!cachedUnderstanding) {
      cachedUnderstanding = understandingFactory(root).understand(`${runId}:understanding`);
    }
    const understanding = cachedUnderstanding;
    const change_analysis = changeAnalyzer.analyze(understanding);
    const reuse_decision = reuseDecisionEngine.decide(understanding);
    const duplicate_prevention = duplicatePrevention.prevent(understanding);
    const impact_analysis = impactAnalyzer.analyze(
      root,
      change_analysis,
      reuse_decision,
      duplicate_prevention
    );
    const approval_gate = approvalGate.evaluate(root, impact_analysis);
    const evidence = evidenceModule.collect(
      root,
      understanding,
      change_analysis,
      reuse_decision,
      duplicate_prevention,
      impact_analysis,
      approval_gate
    );
    const traceability = traceabilityModule.trace();
    const contract_conformance = contractConformance.check(
      root,
      reuse_decision,
      duplicate_prevention,
      approval_gate,
      change_analysis
    );
    const boundary = boundaryModule.verify(root, approval_gate, change_analysis);

    const result_fingerprint = stableFingerprint({
      understanding: understanding.result_fingerprint,
      change: change_analysis.analysis_fingerprint,
      reuse: reuse_decision.decision_fingerprint,
      duplicates: duplicate_prevention.prevention_fingerprint,
      impact: impact_analysis.analysis_fingerprint,
      approval: approval_gate.gate_fingerprint,
      evidence: evidence.evidence_fingerprint,
      trace: traceability.trace_fingerprint,
      contracts: contract_conformance.conformance_fingerprint,
      boundary: boundary.boundary_fingerprint,
    });

    const cacheEntry = cache.put(`roe:${result_fingerprint}`, result_fingerprint);
    const certified_boundaries_preserved = boundary.intact && contract_conformance.conforms;
    const repository_operation_operational =
      certified_boundaries_preserved &&
      reuse_decision.reuse_before_create === true &&
      approval_gate.authorized === false &&
      evidence.evidence_precedes_operation === true &&
      change_analysis.repository_mutated === false;
    const ready_for_multi_ai_operation =
      repository_operation_operational &&
      CONNECTOR_SNAPSHOTS.every((rel) => pathExists(root, rel));

    return {
      run_id: runId,
      understanding_fingerprint: understanding.result_fingerprint,
      change_analysis,
      reuse_decision,
      duplicate_prevention,
      impact_analysis,
      approval_gate,
      evidence,
      traceability,
      contract_conformance,
      boundary,
      cache: cacheEntry,
      result_fingerprint,
      reproducible: true,
      deterministic: true,
      repository_first: true,
      evidence_first: true,
      reuse_before_create: true,
      write_authorized: false,
      human_approval_required_before_repository_mutation: true,
      repository_mutation_forbidden: true,
      repository_mutation: false,
      certified_boundaries_preserved,
      repository_operation_operational,
      ready_for_multi_ai_operation,
      read_only: true,
      reference_only: true,
      ephemeral: true,
    };
  }

  return {
    describeInterface() {
      return {
        version: VERTICAL_AI_REPOSITORY_OPERATION_RUNTIME_V1_SEMVER,
        component_ids: [...REPOSITORY_OPERATION_RUNTIME_COMPONENT_IDS],
        public_surface: 'repository_operation_runtime',
        read_only: true,
        reference_only: true,
        repository_first: true,
        evidence_first: true,
        reuse_before_create: true,
        human_approval_required_before_repository_mutation: true,
        write_authorized: false,
        repository_mutation_forbidden: true,
        implementation: true,
      };
    },
    operate(runId = 'repository-operation-run') {
      const first = runOnce(`${runId}:1`);
      const second = runOnce(`${runId}:2`);
      const compare = reproducibility.compare(first.result_fingerprint, second.result_fingerprint);
      const det = determinism.verify(
        first.approval_gate.gate_fingerprint,
        second.approval_gate.gate_fingerprint,
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
    requestRepositoryMutation(action: string) {
      return {
        authorized: false as const,
        reason: `Repository mutation '${action}' blocked: human approval required; Repository Operation Engine is read-only`,
        requires_human_approval: true as const,
        repository_mutation_forbidden: true as const,
      };
    },
  };
}

export function createRepositoryOperationRuntimeRegistry() {
  return {
    registry_id: 'vertical-ai-repository-operation-runtime-registry-v1',
    component_ids: [...REPOSITORY_OPERATION_RUNTIME_COMPONENT_IDS],
    public_surface: 'repository_operation_runtime' as const,
    version: VERTICAL_AI_REPOSITORY_OPERATION_RUNTIME_V1_SEMVER,
  };
}

export function exportRepositoryOperationRuntime(
  api: RepositoryOperationRuntimeApi,
  registry: ReturnType<typeof createRepositoryOperationRuntimeRegistry>
) {
  const iface = api.describeInterface();
  return {
    runtime_id: 'vertical_ai_repository_operation_runtime',
    version: iface.version,
    public_surface: iface.public_surface,
    component_ids: iface.component_ids,
    registry_id: registry.registry_id,
    read_only: iface.read_only,
    reference_only: iface.reference_only,
    repository_first: iface.repository_first,
    evidence_first: iface.evidence_first,
    reuse_before_create: iface.reuse_before_create,
    write_authorized: iface.write_authorized,
    repository_mutation_forbidden: iface.repository_mutation_forbidden,
  };
}
