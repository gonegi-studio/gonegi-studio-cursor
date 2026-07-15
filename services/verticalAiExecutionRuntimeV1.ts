import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  VERTICAL_AI_EXECUTION_FOUNDATION_V1_PATH,
  VERTICAL_AI_EXECUTION_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_EXECUTION_WORKFLOW_V1_PATH,
  VERTICAL_AI_EXECUTION_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_EXECUTION_TRACEABILITY_V1_PATH,
  VERTICAL_AI_EXECUTION_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_EXECUTION_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_EXECUTION_CONNECTOR_SELECTION_V1_PATH,
  VERTICAL_AI_EXECUTION_RUNTIME_REF_V1_PATH,
  VERTICAL_AI_EXECUTION_BOUNDARY_MODEL_V1_PATH,
} from './verticalAiExecutionFoundationV1Engine.js';
import { VERTICAL_AI_PLANNING_RUNTIME_V1_PATH } from './verticalAiPlanningRuntimeV1Engine.js';
import {
  createPlanningRuntimeApi,
  type PlanningRunResult,
} from './verticalAiPlanningRuntimeV1.js';
import { createRuntimeApi } from './agentRuntimeV1.js';
import { CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './claudeConnectorProductionCertificationV1Engine.js';
import { CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './chatgptConnectorProductionCertificationV1Engine.js';
import { GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './geminiConnectorProductionCertificationV1Engine.js';
import { CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './cursorConnectorProductionCertificationV1Engine.js';
import { MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './mcpConnectorProductionCertificationV1Engine.js';
import { AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH } from './agentRuntimeProductionCertificationV1Engine.js';
import { CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH } from './consumerIntegrationProductionCertificationV1Engine.js';
import { PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH } from './projectBrainMasterSnapshotV1Engine.js';
import { REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH } from './repositoryIntelligenceBundleProductionCertificationV1Engine.js';
import { REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH } from './repositoryIntelligenceAccessProductionCertificationV1Engine.js';

export const VERTICAL_AI_EXECUTION_RUNTIME_V1_SEMVER = '1.0.0' as const;

/**
 * Public component identity of Vertical AI Execution Runtime.
 * `execution_runtime` is the only public orchestration surface; other modules are
 * internal and replaceable.
 */
export const EXECUTION_RUNTIME_COMPONENT_IDS = [
  'execution_runtime',
  'execution_dispatcher',
  'connector_selector',
  'tool_executor',
  'execution_validator',
  'execution_cache',
  'execution_traceability',
  'execution_reproducibility',
  'execution_evidence',
  'execution_contract_conformance',
  'runtime_determinism',
  'execution_boundary_integrity',
] as const;

export type ExecutionRuntimeComponentId = (typeof EXECUTION_RUNTIME_COMPONENT_IDS)[number];

const CERTIFIED_CONNECTORS = [
  { connector_id: 'claude_connector', master_snapshot_ref: CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'chatgpt_connector', master_snapshot_ref: CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'gemini_connector', master_snapshot_ref: GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'cursor_connector', master_snapshot_ref: CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'mcp_connector', master_snapshot_ref: MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
] as const;

export interface ConnectorSelectionResult {
  connectors: Array<{
    connector_id: string;
    master_snapshot_ref: string;
    present: boolean;
    selected: boolean;
    certified: true;
  }>;
  selected_connector_ids: string[];
  uncertified_rejected: true;
  selection_fingerprint: string;
}

export interface ToolExecutionResult {
  tool_invocations: Array<{
    step_id: string;
    tool: string;
    routed: boolean;
    output_fingerprint: string;
  }>;
  invocation_count: number;
  tool_fingerprint: string;
  repository_mutated: false;
}

export interface DispatchResult {
  dispatch_id: string;
  steps: Array<{
    step_id: string;
    action: string;
    connector_id: string | null;
    tool: string | null;
    status: 'described' | 'simulated';
  }>;
  order: string[];
  dispatch_fingerprint: string;
  enacted: false;
  write_authorized: false;
}

export interface ExecutionValidationResult {
  valid: boolean;
  checks: Record<string, boolean>;
  validation_fingerprint: string;
}

export interface ExecutionEvidenceBundle {
  evidence_items: Array<{ evidence_id: string; ref: string; fingerprint: string | null }>;
  evidence_precedes_execution: true;
  evidence_fingerprint: string;
}

export interface ExecutionTraceabilityResult {
  chain: Array<{ from: string; to: string }>;
  evidence_to_execution: true;
  trace_fingerprint: string;
}

export interface ContractConformanceResult {
  conforms: boolean;
  contracts: Record<string, boolean>;
  conformance_fingerprint: string;
}

export interface BoundaryIntegrityResult {
  intact: boolean;
  boundaries: Record<string, boolean>;
  boundary_fingerprint: string;
}

export interface ExecutionCacheEntry {
  cache_key: string;
  result_fingerprint: string;
  ephemeral: true;
}

export interface ExecutionRunResult {
  run_id: string;
  planning_fingerprint: string;
  plan_fingerprint: string;
  connectors: ConnectorSelectionResult;
  tools: ToolExecutionResult;
  dispatch: DispatchResult;
  validation: ExecutionValidationResult;
  evidence: ExecutionEvidenceBundle;
  traceability: ExecutionTraceabilityResult;
  contract_conformance: ContractConformanceResult;
  boundary_integrity: BoundaryIntegrityResult;
  cache: ExecutionCacheEntry;
  result_fingerprint: string;
  reproducible: boolean;
  deterministic: boolean;
  repository_first: true;
  evidence_first: true;
  reuse_before_create: true;
  write_authorized: false;
  human_approval_required_before_repository_mutation: true;
  certified_boundaries_preserved: boolean;
  read_only: true;
  reference_only: true;
  ephemeral: true;
}

export interface ExecutionRuntimeInterfaceDescription {
  version: string;
  component_ids: ExecutionRuntimeComponentId[];
  public_surface: 'execution_runtime';
  read_only: true;
  reference_only: true;
  repository_first: true;
  evidence_first: true;
  reuse_before_create: true;
  human_approval_required_before_repository_mutation: true;
  write_authorized: false;
  implementation: true;
}

export interface ExecutionRuntimeApi {
  describeInterface(): ExecutionRuntimeInterfaceDescription;
  execute(runId?: string): ExecutionRunResult;
  requestRepositoryMutation(action: string): {
    authorized: false;
    reason: string;
    requires_human_approval: true;
  };
}

export type ExecutionRuntimeDeps = {
  createPlanningRuntimeApi?: (root: string) => { plan(runId?: string): PlanningRunResult };
  createCache?: () => ExecutionCache;
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

export interface ExecutionCache {
  readonly id: ExecutionRuntimeComponentId;
  get(key: string): ExecutionCacheEntry | null;
  put(key: string, resultFingerprint: string): ExecutionCacheEntry;
}

export function createExecutionCache(): ExecutionCache {
  const store = new Map<string, ExecutionCacheEntry>();
  return {
    id: 'execution_cache',
    get(key) {
      return store.get(key) ?? null;
    },
    put(key, resultFingerprint) {
      const entry: ExecutionCacheEntry = {
        cache_key: key,
        result_fingerprint: resultFingerprint,
        ephemeral: true,
      };
      store.set(key, entry);
      return entry;
    },
  };
}

export function createConnectorSelector() {
  return {
    id: 'connector_selector' as const,
    select(root: string, preferred: string[] = ['cursor_connector', 'mcp_connector']): ConnectorSelectionResult {
      const foundationSelection = readJson<{
        selection_order?: string[];
        selection_policy?: string;
      }>(root, VERTICAL_AI_EXECUTION_CONNECTOR_SELECTION_V1_PATH);
      const order =
        foundationSelection?.selection_order && foundationSelection.selection_order.length > 0
          ? foundationSelection.selection_order
          : CERTIFIED_CONNECTORS.map((connector) => connector.connector_id);

      const connectors = CERTIFIED_CONNECTORS.map((connector) => {
        const present = fs.existsSync(path.join(root, connector.master_snapshot_ref));
        const preferredRank = preferred.indexOf(connector.connector_id);
        const selected = present && (preferredRank >= 0 || order.includes(connector.connector_id));
        return {
          connector_id: connector.connector_id,
          master_snapshot_ref: connector.master_snapshot_ref,
          present,
          selected,
          certified: true as const,
        };
      }).sort((a, b) => (a.connector_id < b.connector_id ? -1 : a.connector_id > b.connector_id ? 1 : 0));

      const selected_connector_ids = connectors
        .filter((connector) => connector.selected && connector.present)
        .map((connector) => connector.connector_id)
        .sort();

      return {
        connectors,
        selected_connector_ids,
        uncertified_rejected: true,
        selection_fingerprint: stableFingerprint({ connectors, selected_connector_ids }),
      };
    },
  };
}

export function createToolExecutor() {
  return {
    id: 'tool_executor' as const,
    execute(root: string, planning: PlanningRunResult): ToolExecutionResult {
      const runtime = createRuntimeApi(root);
      const planSteps = planning.execution_plan.steps
        .filter((step) => step.action === 'reuse' || step.action === 'analyze_gap')
        .slice(0, 8);

      const tool_invocations = planSteps.map((step) => {
        const tool = step.action === 'reuse' ? 'platform.resolve' : 'echo';
        const args =
          tool === 'platform.resolve'
            ? { reference: 'brain_reference:project-brain-master-snapshot-v1' }
            : { value: step.step_id };
        try {
          const result = runtime.execute({
            run_id: `vai-exec-${step.step_id}`,
            steps: [{ id: step.step_id, tool, args }],
          });
          const outcome = result.step_outcomes[0];
          return {
            step_id: step.step_id,
            tool,
            routed: true,
            output_fingerprint: outcome?.output_fingerprint ?? result.result_fingerprint,
          };
        } catch {
          return {
            step_id: step.step_id,
            tool,
            routed: false,
            output_fingerprint: stableFingerprint({ step: step.step_id, failed: true }),
          };
        }
      });

      return {
        tool_invocations: tool_invocations.sort((a, b) =>
          a.step_id < b.step_id ? -1 : a.step_id > b.step_id ? 1 : 0
        ),
        invocation_count: tool_invocations.length,
        tool_fingerprint: stableFingerprint(tool_invocations),
        repository_mutated: false,
      };
    },
  };
}

export function createExecutionDispatcher() {
  return {
    id: 'execution_dispatcher' as const,
    dispatch(
      planning: PlanningRunResult,
      connectors: ConnectorSelectionResult,
      tools: ToolExecutionResult
    ): DispatchResult {
      const primaryConnector = connectors.selected_connector_ids[0] ?? null;
      const toolByStep = new Map(tools.tool_invocations.map((entry) => [entry.step_id, entry.tool]));
      const steps = planning.execution_plan.steps.map((step) => ({
        step_id: step.step_id,
        action: step.action,
        connector_id:
          step.action === 'await_approval' || step.action === 'validate' ? null : primaryConnector,
        tool: toolByStep.get(step.step_id) ?? null,
        status: 'described' as const,
      }));
      return {
        dispatch_id: 'vertical_ai_execution_dispatch_v1',
        steps,
        order: [...planning.execution_plan.order],
        dispatch_fingerprint: stableFingerprint({ steps, order: planning.execution_plan.order }),
        enacted: false,
        write_authorized: false,
      };
    },
  };
}

export function createExecutionValidator() {
  return {
    id: 'execution_validator' as const,
    validate(
      planning: PlanningRunResult,
      connectors: ConnectorSelectionResult,
      tools: ToolExecutionResult,
      dispatch: DispatchResult
    ): ExecutionValidationResult {
      const checks = {
        planning_valid: planning.validation.valid === true,
        connectors_certified: connectors.uncertified_rejected === true,
        connectors_present: connectors.selected_connector_ids.length > 0,
        tools_read_only: tools.repository_mutated === false,
        dispatch_not_enacted: dispatch.enacted === false,
        reuse_before_create: planning.reuse.create_count === 0,
        write_blocked: dispatch.write_authorized === false,
        awaits_approval: dispatch.steps.some((step) => step.action === 'await_approval'),
      };
      return {
        valid: Object.values(checks).every(Boolean),
        checks,
        validation_fingerprint: stableFingerprint(checks),
      };
    },
  };
}

export function createExecutionEvidenceModule() {
  return {
    id: 'execution_evidence' as const,
    collect(
      root: string,
      planning: PlanningRunResult,
      connectors: ConnectorSelectionResult
    ): ExecutionEvidenceBundle {
      const refs = [
        VERTICAL_AI_EXECUTION_FOUNDATION_V1_PATH,
        VERTICAL_AI_EXECUTION_COMPONENT_MODEL_V1_PATH,
        VERTICAL_AI_EXECUTION_WORKFLOW_V1_PATH,
        VERTICAL_AI_EXECUTION_APPROVAL_GATE_V1_PATH,
        VERTICAL_AI_EXECUTION_TRACEABILITY_V1_PATH,
        VERTICAL_AI_EXECUTION_EVIDENCE_MODEL_V1_PATH,
        VERTICAL_AI_EXECUTION_ARCHITECTURE_V1_PATH,
        VERTICAL_AI_EXECUTION_CONNECTOR_SELECTION_V1_PATH,
        VERTICAL_AI_EXECUTION_RUNTIME_REF_V1_PATH,
        VERTICAL_AI_EXECUTION_BOUNDARY_MODEL_V1_PATH,
        VERTICAL_AI_PLANNING_RUNTIME_V1_PATH,
        PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
        REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
        REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
        AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
        CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
        ...CERTIFIED_CONNECTORS.map((connector) => connector.master_snapshot_ref),
      ];
      const evidence_items = [
        {
          evidence_id: 'planning_result',
          ref: 'planning_runtime_result_fingerprint',
          fingerprint: planning.result_fingerprint,
        },
        {
          evidence_id: 'planning_plan',
          ref: 'planning_runtime_plan_fingerprint',
          fingerprint: planning.execution_plan.plan_fingerprint,
        },
        {
          evidence_id: 'connector_selection',
          ref: 'connector_selector',
          fingerprint: connectors.selection_fingerprint,
        },
        ...refs.map((ref) => ({
          evidence_id: `ref:${path.basename(ref)}`,
          ref,
          fingerprint: fingerprintFile(root, ref),
        })),
      ].sort((a, b) => (a.evidence_id < b.evidence_id ? -1 : a.evidence_id > b.evidence_id ? 1 : 0));
      return {
        evidence_items,
        evidence_precedes_execution: true,
        evidence_fingerprint: stableFingerprint(evidence_items),
      };
    },
  };
}

export function createExecutionTraceabilityModule() {
  return {
    id: 'execution_traceability' as const,
    trace(): ExecutionTraceabilityResult {
      const chain = [
        { from: 'planning_runtime', to: 'execution_runtime' },
        { from: 'execution_runtime', to: 'connector_selector' },
        { from: 'execution_runtime', to: 'tool_executor' },
        { from: 'connector_selector', to: 'execution_dispatcher' },
        { from: 'tool_executor', to: 'execution_dispatcher' },
        { from: 'execution_dispatcher', to: 'execution_validator' },
        { from: 'execution_evidence', to: 'execution_traceability' },
        { from: 'execution_traceability', to: 'execution_reproducibility' },
        { from: 'execution_contract_conformance', to: 'execution_boundary_integrity' },
        { from: 'execution_reproducibility', to: 'runtime_determinism' },
      ].sort((a, b) => {
        const left = `${a.from}->${a.to}`;
        const right = `${b.from}->${b.to}`;
        return left < right ? -1 : left > right ? 1 : 0;
      });
      return {
        chain,
        evidence_to_execution: true,
        trace_fingerprint: stableFingerprint(chain),
      };
    },
  };
}

export function createExecutionContractConformanceModule() {
  return {
    id: 'execution_contract_conformance' as const,
    check(
      connectors: ConnectorSelectionResult,
      validation: ExecutionValidationResult,
      dispatch: DispatchResult
    ): ContractConformanceResult {
      const contracts = {
        certified_connectors_only: connectors.uncertified_rejected === true,
        validation_passed: validation.valid === true,
        dispatch_descriptor_only: dispatch.enacted === false,
        no_write_authority: dispatch.write_authorized === false,
        evidence_first: true,
      };
      return {
        conforms: Object.values(contracts).every(Boolean),
        contracts,
        conformance_fingerprint: stableFingerprint(contracts),
      };
    },
  };
}

export function createExecutionBoundaryIntegrityModule() {
  return {
    id: 'execution_boundary_integrity' as const,
    verify(
      tools: ToolExecutionResult,
      dispatch: DispatchResult,
      connectors: ConnectorSelectionResult
    ): BoundaryIntegrityResult {
      const boundaries = {
        platform_core_unmutated: true,
        cil_unmutated: true,
        repository_unmutated: tools.repository_mutated === false,
        certified_connectors_only: connectors.connectors.every((connector) => connector.certified),
        dispatch_not_enacted: dispatch.enacted === false,
        write_blocked: dispatch.write_authorized === false,
      };
      return {
        intact: Object.values(boundaries).every(Boolean),
        boundaries,
        boundary_fingerprint: stableFingerprint(boundaries),
      };
    },
  };
}

export function createExecutionReproducibilityModule() {
  return {
    id: 'execution_reproducibility' as const,
    compare(left: string, right: string) {
      return { reproducible: left === right, left, right };
    },
  };
}

export function createRuntimeDeterminismModule() {
  return {
    id: 'runtime_determinism' as const,
    verify(dispatchA: string, dispatchB: string, resultA: string, resultB: string) {
      return {
        deterministic: dispatchA === dispatchB && resultA === resultB,
        dispatch_match: dispatchA === dispatchB,
        result_match: resultA === resultB,
      };
    },
  };
}

export function createExecutionRuntimeApi(
  root: string,
  deps: ExecutionRuntimeDeps = {}
): ExecutionRuntimeApi {
  const planningFactory = deps.createPlanningRuntimeApi ?? createPlanningRuntimeApi;
  const cacheFactory = deps.createCache ?? createExecutionCache;

  const connectorSelector = createConnectorSelector();
  const toolExecutor = createToolExecutor();
  const dispatcher = createExecutionDispatcher();
  const validator = createExecutionValidator();
  const evidenceModule = createExecutionEvidenceModule();
  const traceabilityModule = createExecutionTraceabilityModule();
  const contractConformance = createExecutionContractConformanceModule();
  const boundaryIntegrity = createExecutionBoundaryIntegrityModule();
  const reproducibility = createExecutionReproducibilityModule();
  const determinism = createRuntimeDeterminismModule();
  const cache = cacheFactory();

  function runOnce(runId: string): ExecutionRunResult {
    const planning = planningFactory(root).plan(`${runId}:planning`);
    const connectors = connectorSelector.select(root);
    const tools = toolExecutor.execute(root, planning);
    const dispatch = dispatcher.dispatch(planning, connectors, tools);
    const validation = validator.validate(planning, connectors, tools, dispatch);
    const evidence = evidenceModule.collect(root, planning, connectors);
    const traceability = traceabilityModule.trace();
    const contract_conformance = contractConformance.check(connectors, validation, dispatch);
    const boundary_integrity = boundaryIntegrity.verify(tools, dispatch, connectors);

    const result_fingerprint = stableFingerprint({
      planning: planning.result_fingerprint,
      plan: planning.execution_plan.plan_fingerprint,
      connectors: connectors.selection_fingerprint,
      tools: tools.tool_fingerprint,
      dispatch: dispatch.dispatch_fingerprint,
      validation: validation.validation_fingerprint,
      evidence: evidence.evidence_fingerprint,
      trace: traceability.trace_fingerprint,
      contracts: contract_conformance.conformance_fingerprint,
      boundary: boundary_integrity.boundary_fingerprint,
    });

    const cacheEntry = cache.put(`execution:${result_fingerprint}`, result_fingerprint);

    return {
      run_id: runId,
      planning_fingerprint: planning.result_fingerprint,
      plan_fingerprint: planning.execution_plan.plan_fingerprint,
      connectors,
      tools,
      dispatch,
      validation,
      evidence,
      traceability,
      contract_conformance,
      boundary_integrity,
      cache: cacheEntry,
      result_fingerprint,
      reproducible: true,
      deterministic: true,
      repository_first: true,
      evidence_first: true,
      reuse_before_create: true,
      write_authorized: false,
      human_approval_required_before_repository_mutation: true,
      certified_boundaries_preserved: boundary_integrity.intact && contract_conformance.conforms,
      read_only: true,
      reference_only: true,
      ephemeral: true,
    };
  }

  return {
    describeInterface() {
      return {
        version: VERTICAL_AI_EXECUTION_RUNTIME_V1_SEMVER,
        component_ids: [...EXECUTION_RUNTIME_COMPONENT_IDS],
        public_surface: 'execution_runtime',
        read_only: true,
        reference_only: true,
        repository_first: true,
        evidence_first: true,
        reuse_before_create: true,
        human_approval_required_before_repository_mutation: true,
        write_authorized: false,
        implementation: true,
      };
    },
    execute(runId = 'execution-run') {
      const first = runOnce(`${runId}:1`);
      const second = runOnce(`${runId}:2`);
      const compare = reproducibility.compare(first.result_fingerprint, second.result_fingerprint);
      const det = determinism.verify(
        first.dispatch.dispatch_fingerprint,
        second.dispatch.dispatch_fingerprint,
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
        reason: `Repository mutation '${action}' blocked: human approval required; Execution Runtime is read-only`,
        requires_human_approval: true as const,
      };
    },
  };
}

export function createExecutionRuntimeRegistry() {
  return {
    runtime_id: 'vertical_ai_execution_runtime',
    version: VERTICAL_AI_EXECUTION_RUNTIME_V1_SEMVER,
    component_ids: [...EXECUTION_RUNTIME_COMPONENT_IDS],
    public_surface: 'execution_runtime',
  };
}

export function exportExecutionRuntime(
  api: ExecutionRuntimeApi,
  registry: ReturnType<typeof createExecutionRuntimeRegistry>
) {
  const iface = api.describeInterface();
  return {
    export_id: 'vertical_ai_execution_runtime_export_v1',
    version: iface.version,
    component_ids: iface.component_ids,
    registry,
    interface: iface,
  };
}
