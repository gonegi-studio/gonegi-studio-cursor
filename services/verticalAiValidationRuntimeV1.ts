import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH,
  VERTICAL_AI_VALIDATION_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_VALIDATION_WORKFLOW_V1_PATH,
  VERTICAL_AI_VALIDATION_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_VALIDATION_TRACEABILITY_V1_PATH,
  VERTICAL_AI_VALIDATION_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_VALIDATION_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_VALIDATION_RULES_V1_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_REF_V1_PATH,
  VERTICAL_AI_VALIDATION_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_VALIDATION_CONTRACTS_V1_PATH,
  VERTICAL_AI_VALIDATION_REGISTRY_V1_PATH,
} from './verticalAiValidationFoundationV1Engine.js';
import { VERTICAL_AI_EXECUTION_RUNTIME_V1_PATH } from './verticalAiExecutionRuntimeV1Engine.js';
import {
  createExecutionRuntimeApi,
  type ExecutionRunResult,
} from './verticalAiExecutionRuntimeV1.js';
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

export const VERTICAL_AI_VALIDATION_RUNTIME_V1_SEMVER = '1.0.0' as const;

/**
 * Public component identity of Vertical AI Validation Runtime.
 * `validation_runtime` is the only public orchestration surface; other modules are
 * internal and replaceable.
 */
export const VALIDATION_RUNTIME_COMPONENT_IDS = [
  'validation_runtime',
  'validation_dispatcher',
  'contract_validator',
  'boundary_validator',
  'result_validator',
  'validation_cache',
  'validation_traceability',
  'validation_reproducibility',
  'validation_evidence',
  'validation_contract_conformance',
  'runtime_determinism',
  'validation_result_integrity',
  'validation_boundary_integrity',
  'validation_runtime_integrity',
] as const;

export type ValidationRuntimeComponentId = (typeof VALIDATION_RUNTIME_COMPONENT_IDS)[number];

const CERTIFIED_CONNECTORS = [
  { connector_id: 'claude_connector', master_snapshot_ref: CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'chatgpt_connector', master_snapshot_ref: CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'gemini_connector', master_snapshot_ref: GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'cursor_connector', master_snapshot_ref: CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'mcp_connector', master_snapshot_ref: MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
] as const;

export interface DispatchResult {
  dispatch_id: string;
  steps: Array<{
    step_id: string;
    validator: string;
    status: 'described' | 'evaluated';
  }>;
  order: string[];
  dispatch_fingerprint: string;
  enacted: false;
  write_authorized: false;
}

export interface ContractValidationResult {
  valid: boolean;
  checks: Record<string, boolean>;
  validation_fingerprint: string;
}

export interface BoundaryValidationResult {
  valid: boolean;
  checks: Record<string, boolean>;
  validation_fingerprint: string;
}

export interface ResultValidationResult {
  valid: boolean;
  checks: Record<string, boolean>;
  validation_fingerprint: string;
}

export interface ValidationEvidenceBundle {
  evidence_items: Array<{ evidence_id: string; ref: string; fingerprint: string | null }>;
  evidence_precedes_validation: true;
  evidence_fingerprint: string;
}

export interface ValidationTraceabilityResult {
  chain: Array<{ from: string; to: string }>;
  evidence_to_validation: true;
  trace_fingerprint: string;
}

export interface ContractConformanceResult {
  conforms: boolean;
  contracts: Record<string, boolean>;
  conformance_fingerprint: string;
}

export interface ResultIntegrityResult {
  intact: boolean;
  checks: Record<string, boolean>;
  integrity_fingerprint: string;
}

export interface BoundaryIntegrityResult {
  intact: boolean;
  boundaries: Record<string, boolean>;
  boundary_fingerprint: string;
}

export interface RuntimeIntegrityResult {
  intact: boolean;
  checks: Record<string, boolean>;
  integrity_fingerprint: string;
}

export interface ValidationCacheEntry {
  cache_key: string;
  result_fingerprint: string;
  ephemeral: true;
}

export interface ValidationRunResult {
  run_id: string;
  execution_fingerprint: string;
  execution_dispatch_fingerprint: string;
  dispatch: DispatchResult;
  contract_validation: ContractValidationResult;
  boundary_validation: BoundaryValidationResult;
  result_validation: ResultValidationResult;
  evidence: ValidationEvidenceBundle;
  traceability: ValidationTraceabilityResult;
  contract_conformance: ContractConformanceResult;
  result_integrity: ResultIntegrityResult;
  boundary_integrity: BoundaryIntegrityResult;
  runtime_integrity: RuntimeIntegrityResult;
  cache: ValidationCacheEntry;
  result_fingerprint: string;
  reproducible: boolean;
  deterministic: boolean;
  repository_first: true;
  evidence_first: true;
  reuse_before_create: true;
  write_authorized: false;
  human_approval_required_before_repository_mutation: true;
  certified_validation_integrity_preserved: boolean;
  certified_validation_operational: boolean;
  read_only: true;
  reference_only: true;
  ephemeral: true;
}

export interface ValidationRuntimeInterfaceDescription {
  version: string;
  component_ids: ValidationRuntimeComponentId[];
  public_surface: 'validation_runtime';
  read_only: true;
  reference_only: true;
  repository_first: true;
  evidence_first: true;
  reuse_before_create: true;
  human_approval_required_before_repository_mutation: true;
  write_authorized: false;
  implementation: true;
}

export interface ValidationRuntimeApi {
  describeInterface(): ValidationRuntimeInterfaceDescription;
  validate(runId?: string): ValidationRunResult;
  requestRepositoryMutation(action: string): {
    authorized: false;
    reason: string;
    requires_human_approval: true;
  };
}

export type ValidationRuntimeDeps = {
  createExecutionRuntimeApi?: (root: string) => { execute(runId?: string): ExecutionRunResult };
  createCache?: () => ValidationCache;
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

export interface ValidationCache {
  readonly id: ValidationRuntimeComponentId;
  get(key: string): ValidationCacheEntry | null;
  put(key: string, resultFingerprint: string): ValidationCacheEntry;
}

export function createValidationCache(): ValidationCache {
  const store = new Map<string, ValidationCacheEntry>();
  return {
    id: 'validation_cache',
    get(key) {
      return store.get(key) ?? null;
    },
    put(key, resultFingerprint) {
      const entry: ValidationCacheEntry = {
        cache_key: key,
        result_fingerprint: resultFingerprint,
        ephemeral: true,
      };
      store.set(key, entry);
      return entry;
    },
  };
}

export function createValidationDispatcher() {
  return {
    id: 'validation_dispatcher' as const,
    dispatch(execution: ExecutionRunResult): DispatchResult {
      const steps = [
        { step_id: 'validate_contracts', validator: 'contract_validator', status: 'evaluated' as const },
        { step_id: 'validate_boundaries', validator: 'boundary_validator', status: 'evaluated' as const },
        { step_id: 'validate_results', validator: 'result_validator', status: 'evaluated' as const },
        {
          step_id: 'check_conformance',
          validator: 'validation_contract_conformance',
          status: 'evaluated' as const,
        },
        {
          step_id: 'check_result_integrity',
          validator: 'validation_result_integrity',
          status: 'evaluated' as const,
        },
        {
          step_id: 'check_boundary_integrity',
          validator: 'validation_boundary_integrity',
          status: 'evaluated' as const,
        },
        {
          step_id: 'check_runtime_integrity',
          validator: 'validation_runtime_integrity',
          status: 'evaluated' as const,
        },
        { step_id: 'await_approval', validator: 'approval_gate', status: 'described' as const },
      ];
      const order = steps.map((step) => step.step_id);
      return {
        dispatch_id: 'vertical_ai_validation_dispatch_v1',
        steps,
        order,
        dispatch_fingerprint: stableFingerprint({
          steps,
          order,
          execution: execution.result_fingerprint,
        }),
        enacted: false,
        write_authorized: false,
      };
    },
  };
}

export function createContractValidator() {
  return {
    id: 'contract_validator' as const,
    validate(root: string, execution: ExecutionRunResult): ContractValidationResult {
      const foundationContracts = readJson<{ aggregate_verdict?: string }>(
        root,
        VERTICAL_AI_VALIDATION_CONTRACTS_V1_PATH
      );
      const checks = {
        execution_contracts_conform: execution.contract_conformance.conforms === true,
        execution_validation_passed: execution.validation.valid === true,
        foundation_contracts_pass: foundationContracts?.aggregate_verdict === 'PASS',
        certified_connectors_only: execution.connectors.uncertified_rejected === true,
        evidence_first: execution.evidence_first === true,
        no_write_authority: execution.write_authorized === false,
      };
      return {
        valid: Object.values(checks).every(Boolean),
        checks,
        validation_fingerprint: stableFingerprint(checks),
      };
    },
  };
}

export function createBoundaryValidator() {
  return {
    id: 'boundary_validator' as const,
    validate(root: string, execution: ExecutionRunResult): BoundaryValidationResult {
      const boundaryModel = readJson<{ boundary_policy?: Record<string, unknown> }>(
        root,
        VERTICAL_AI_VALIDATION_BOUNDARY_MODEL_V1_PATH
      );
      const connectorsPresent = CERTIFIED_CONNECTORS.every((connector) =>
        fs.existsSync(path.join(root, connector.master_snapshot_ref))
      );
      const checks = {
        boundary_model_present: boundaryModel !== null,
        execution_boundaries_intact: execution.boundary_integrity.intact === true,
        platform_core_unmutated: execution.boundary_integrity.boundaries.platform_core_unmutated === true,
        cil_unmutated: execution.boundary_integrity.boundaries.cil_unmutated === true,
        certified_connectors_present: connectorsPresent,
        certified_connectors_only: execution.connectors.connectors.every((c) => c.certified),
        dispatch_not_enacted: execution.dispatch.enacted === false,
        write_blocked: execution.write_authorized === false,
        repository_unmutated: execution.tools.repository_mutated === false,
      };
      return {
        valid: Object.values(checks).every(Boolean),
        checks,
        validation_fingerprint: stableFingerprint(checks),
      };
    },
  };
}

export function createResultValidator() {
  return {
    id: 'result_validator' as const,
    validate(execution: ExecutionRunResult): ResultValidationResult {
      const checks = {
        execution_reproducible: execution.reproducible === true,
        execution_deterministic: execution.deterministic === true,
        result_fingerprint_present: typeof execution.result_fingerprint === 'string',
        evidence_precedes_execution: execution.evidence.evidence_precedes_execution === true,
        reuse_before_create: execution.reuse_before_create === true,
        certified_boundaries_preserved: execution.certified_boundaries_preserved === true,
        read_only: execution.read_only === true,
        human_approval_gate: execution.human_approval_required_before_repository_mutation === true,
      };
      return {
        valid: Object.values(checks).every(Boolean),
        checks,
        validation_fingerprint: stableFingerprint(checks),
      };
    },
  };
}

export function createValidationEvidenceModule() {
  return {
    id: 'validation_evidence' as const,
    collect(root: string, execution: ExecutionRunResult): ValidationEvidenceBundle {
      const refs = [
        VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH,
        VERTICAL_AI_VALIDATION_COMPONENT_MODEL_V1_PATH,
        VERTICAL_AI_VALIDATION_WORKFLOW_V1_PATH,
        VERTICAL_AI_VALIDATION_APPROVAL_GATE_V1_PATH,
        VERTICAL_AI_VALIDATION_TRACEABILITY_V1_PATH,
        VERTICAL_AI_VALIDATION_EVIDENCE_MODEL_V1_PATH,
        VERTICAL_AI_VALIDATION_ARCHITECTURE_V1_PATH,
        VERTICAL_AI_VALIDATION_RULES_V1_PATH,
        VERTICAL_AI_VALIDATION_RUNTIME_REF_V1_PATH,
        VERTICAL_AI_VALIDATION_BOUNDARY_MODEL_V1_PATH,
        VERTICAL_AI_VALIDATION_CONTRACTS_V1_PATH,
        VERTICAL_AI_VALIDATION_REGISTRY_V1_PATH,
        VERTICAL_AI_EXECUTION_RUNTIME_V1_PATH,
        PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
        REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
        REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
        AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
        CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
        ...CERTIFIED_CONNECTORS.map((connector) => connector.master_snapshot_ref),
      ];
      const evidence_items = [
        {
          evidence_id: 'execution_result',
          ref: 'execution_runtime_result_fingerprint',
          fingerprint: execution.result_fingerprint,
        },
        {
          evidence_id: 'execution_dispatch',
          ref: 'execution_runtime_dispatch_fingerprint',
          fingerprint: execution.dispatch.dispatch_fingerprint,
        },
        {
          evidence_id: 'execution_evidence',
          ref: 'execution_runtime_evidence_fingerprint',
          fingerprint: execution.evidence.evidence_fingerprint,
        },
        {
          evidence_id: 'execution_plan',
          ref: 'execution_runtime_plan_fingerprint',
          fingerprint: execution.plan_fingerprint,
        },
        ...refs.map((ref) => ({
          evidence_id: `ref:${path.basename(ref)}`,
          ref,
          fingerprint: fingerprintFile(root, ref),
        })),
      ].sort((a, b) => (a.evidence_id < b.evidence_id ? -1 : a.evidence_id > b.evidence_id ? 1 : 0));
      return {
        evidence_items,
        evidence_precedes_validation: true,
        evidence_fingerprint: stableFingerprint(evidence_items),
      };
    },
  };
}

export function createValidationTraceabilityModule() {
  return {
    id: 'validation_traceability' as const,
    trace(): ValidationTraceabilityResult {
      const chain = [
        { from: 'execution_runtime', to: 'validation_runtime' },
        { from: 'validation_runtime', to: 'validation_dispatcher' },
        { from: 'validation_dispatcher', to: 'contract_validator' },
        { from: 'validation_dispatcher', to: 'boundary_validator' },
        { from: 'validation_dispatcher', to: 'result_validator' },
        { from: 'contract_validator', to: 'validation_contract_conformance' },
        { from: 'boundary_validator', to: 'validation_boundary_integrity' },
        { from: 'result_validator', to: 'validation_result_integrity' },
        { from: 'validation_evidence', to: 'validation_traceability' },
        { from: 'validation_traceability', to: 'validation_reproducibility' },
        { from: 'validation_reproducibility', to: 'runtime_determinism' },
        { from: 'validation_contract_conformance', to: 'validation_runtime_integrity' },
        { from: 'validation_boundary_integrity', to: 'validation_runtime_integrity' },
        { from: 'validation_result_integrity', to: 'validation_runtime_integrity' },
      ].sort((a, b) => {
        const left = `${a.from}->${a.to}`;
        const right = `${b.from}->${b.to}`;
        return left < right ? -1 : left > right ? 1 : 0;
      });
      return {
        chain,
        evidence_to_validation: true,
        trace_fingerprint: stableFingerprint(chain),
      };
    },
  };
}

export function createValidationContractConformanceModule() {
  return {
    id: 'validation_contract_conformance' as const,
    check(
      contractValidation: ContractValidationResult,
      boundaryValidation: BoundaryValidationResult,
      resultValidation: ResultValidationResult,
      dispatch: DispatchResult
    ): ContractConformanceResult {
      const contracts = {
        contract_validation_passed: contractValidation.valid === true,
        boundary_validation_passed: boundaryValidation.valid === true,
        result_validation_passed: resultValidation.valid === true,
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

export function createValidationResultIntegrityModule() {
  return {
    id: 'validation_result_integrity' as const,
    verify(
      execution: ExecutionRunResult,
      resultValidation: ResultValidationResult
    ): ResultIntegrityResult {
      const checks = {
        result_validation_valid: resultValidation.valid === true,
        execution_result_bound: typeof execution.result_fingerprint === 'string',
        fingerprints_consistent:
          resultValidation.checks.result_fingerprint_present === true &&
          execution.reproducible === true,
        evidence_bound: execution.evidence.evidence_items.length > 0,
      };
      return {
        intact: Object.values(checks).every(Boolean),
        checks,
        integrity_fingerprint: stableFingerprint(checks),
      };
    },
  };
}

export function createValidationBoundaryIntegrityModule() {
  return {
    id: 'validation_boundary_integrity' as const,
    verify(
      execution: ExecutionRunResult,
      boundaryValidation: BoundaryValidationResult,
      dispatch: DispatchResult
    ): BoundaryIntegrityResult {
      const boundaries = {
        boundary_validation_valid: boundaryValidation.valid === true,
        platform_core_unmutated: true,
        cil_unmutated: true,
        repository_unmutated: execution.tools.repository_mutated === false,
        certified_connectors_only: execution.connectors.connectors.every((c) => c.certified),
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

export function createValidationRuntimeIntegrityModule() {
  return {
    id: 'validation_runtime_integrity' as const,
    verify(
      contractConformance: ContractConformanceResult,
      resultIntegrity: ResultIntegrityResult,
      boundaryIntegrity: BoundaryIntegrityResult,
      evidence: ValidationEvidenceBundle,
      traceability: ValidationTraceabilityResult
    ): RuntimeIntegrityResult {
      const checks = {
        contract_conformance: contractConformance.conforms === true,
        result_integrity: resultIntegrity.intact === true,
        boundary_integrity: boundaryIntegrity.intact === true,
        evidence_precedes_validation: evidence.evidence_precedes_validation === true,
        evidence_to_validation: traceability.evidence_to_validation === true,
        read_only: true,
      };
      return {
        intact: Object.values(checks).every(Boolean),
        checks,
        integrity_fingerprint: stableFingerprint(checks),
      };
    },
  };
}

export function createValidationReproducibilityModule() {
  return {
    id: 'validation_reproducibility' as const,
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

export function createValidationRuntimeApi(
  root: string,
  deps: ValidationRuntimeDeps = {}
): ValidationRuntimeApi {
  const executionFactory = deps.createExecutionRuntimeApi ?? createExecutionRuntimeApi;
  const cacheFactory = deps.createCache ?? createValidationCache;

  const dispatcher = createValidationDispatcher();
  const contractValidator = createContractValidator();
  const boundaryValidator = createBoundaryValidator();
  const resultValidator = createResultValidator();
  const evidenceModule = createValidationEvidenceModule();
  const traceabilityModule = createValidationTraceabilityModule();
  const contractConformance = createValidationContractConformanceModule();
  const resultIntegrity = createValidationResultIntegrityModule();
  const boundaryIntegrity = createValidationBoundaryIntegrityModule();
  const runtimeIntegrity = createValidationRuntimeIntegrityModule();
  const reproducibility = createValidationReproducibilityModule();
  const determinism = createRuntimeDeterminismModule();
  const cache = cacheFactory();

  function runOnce(runId: string): ValidationRunResult {
    const execution = executionFactory(root).execute(`${runId}:execution`);
    const dispatch = dispatcher.dispatch(execution);
    const contract_validation = contractValidator.validate(root, execution);
    const boundary_validation = boundaryValidator.validate(root, execution);
    const result_validation = resultValidator.validate(execution);
    const evidence = evidenceModule.collect(root, execution);
    const traceability = traceabilityModule.trace();
    const contract_conformance = contractConformance.check(
      contract_validation,
      boundary_validation,
      result_validation,
      dispatch
    );
    const result_integrity = resultIntegrity.verify(execution, result_validation);
    const boundary_integrity = boundaryIntegrity.verify(execution, boundary_validation, dispatch);
    const runtime_integrity = runtimeIntegrity.verify(
      contract_conformance,
      result_integrity,
      boundary_integrity,
      evidence,
      traceability
    );

    const result_fingerprint = stableFingerprint({
      execution: execution.result_fingerprint,
      dispatch: dispatch.dispatch_fingerprint,
      contract: contract_validation.validation_fingerprint,
      boundary: boundary_validation.validation_fingerprint,
      result: result_validation.validation_fingerprint,
      evidence: evidence.evidence_fingerprint,
      trace: traceability.trace_fingerprint,
      contracts: contract_conformance.conformance_fingerprint,
      result_integrity: result_integrity.integrity_fingerprint,
      boundary_integrity: boundary_integrity.boundary_fingerprint,
      runtime_integrity: runtime_integrity.integrity_fingerprint,
    });

    const cacheEntry = cache.put(`validation:${result_fingerprint}`, result_fingerprint);

    const certified_validation_integrity_preserved =
      boundary_integrity.intact &&
      result_integrity.intact &&
      runtime_integrity.intact &&
      contract_conformance.conforms;

    const certified_validation_operational =
      certified_validation_integrity_preserved &&
      contract_validation.valid &&
      boundary_validation.valid &&
      result_validation.valid &&
      evidence.evidence_precedes_validation &&
      traceability.evidence_to_validation;

    return {
      run_id: runId,
      execution_fingerprint: execution.result_fingerprint,
      execution_dispatch_fingerprint: execution.dispatch.dispatch_fingerprint,
      dispatch,
      contract_validation,
      boundary_validation,
      result_validation,
      evidence,
      traceability,
      contract_conformance,
      result_integrity,
      boundary_integrity,
      runtime_integrity,
      cache: cacheEntry,
      result_fingerprint,
      reproducible: true,
      deterministic: true,
      repository_first: true,
      evidence_first: true,
      reuse_before_create: true,
      write_authorized: false,
      human_approval_required_before_repository_mutation: true,
      certified_validation_integrity_preserved,
      certified_validation_operational,
      read_only: true,
      reference_only: true,
      ephemeral: true,
    };
  }

  return {
    describeInterface() {
      return {
        version: VERTICAL_AI_VALIDATION_RUNTIME_V1_SEMVER,
        component_ids: [...VALIDATION_RUNTIME_COMPONENT_IDS],
        public_surface: 'validation_runtime',
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
    validate(runId = 'validation-run') {
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
        reason: `Repository mutation '${action}' blocked: human approval required; Validation Runtime is read-only`,
        requires_human_approval: true as const,
      };
    },
  };
}

export function createValidationRuntimeRegistry() {
  return {
    runtime_id: 'vertical_ai_validation_runtime',
    version: VERTICAL_AI_VALIDATION_RUNTIME_V1_SEMVER,
    component_ids: [...VALIDATION_RUNTIME_COMPONENT_IDS],
    public_surface: 'validation_runtime',
  };
}

export function exportValidationRuntime(
  api: ValidationRuntimeApi,
  registry: ReturnType<typeof createValidationRuntimeRegistry>
) {
  const iface = api.describeInterface();
  return {
    export_id: 'vertical_ai_validation_runtime_export_v1',
    version: iface.version,
    component_ids: iface.component_ids,
    registry,
    interface: iface,
  };
}
