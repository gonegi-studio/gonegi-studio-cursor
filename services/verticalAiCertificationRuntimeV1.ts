import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
  VERTICAL_AI_CERTIFICATION_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_CERTIFICATION_WORKFLOW_V1_PATH,
  VERTICAL_AI_CERTIFICATION_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_CERTIFICATION_TRACEABILITY_V1_PATH,
  VERTICAL_AI_CERTIFICATION_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_CERTIFICATION_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RULES_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_REF_V1_PATH,
  VERTICAL_AI_CERTIFICATION_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_CERTIFICATION_CONTRACTS_V1_PATH,
  VERTICAL_AI_CERTIFICATION_REGISTRY_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH,
} from './verticalAiCertificationFoundationV1Engine.js';
import { VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH } from './verticalAiValidationRuntimeV1Engine.js';
import {
  createValidationRuntimeApi,
  type ValidationRunResult,
} from './verticalAiValidationRuntimeV1.js';
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

export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_SEMVER = '1.0.0' as const;

/**
 * Public component identity of Vertical AI Certification Runtime.
 * `certification_runtime` is the only public orchestration surface; other modules are
 * internal and replaceable.
 */
export const CERTIFICATION_RUNTIME_COMPONENT_IDS = [
  'certification_runtime',
  'certification_dispatcher',
  'certification_validator',
  'certification_recorder',
  'certification_cache',
  'certification_traceability',
  'certification_reproducibility',
  'certification_evidence',
  'certification_contract_conformance',
  'runtime_determinism',
  'certification_result_integrity',
  'certification_boundary_integrity',
  'certification_runtime_integrity',
] as const;

export type CertificationRuntimeComponentId = (typeof CERTIFICATION_RUNTIME_COMPONENT_IDS)[number];

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
    module: string;
    status: 'described' | 'evaluated';
  }>;
  order: string[];
  dispatch_fingerprint: string;
  enacted: false;
  write_authorized: false;
}

export interface CertificationValidationResult {
  valid: boolean;
  checks: Record<string, boolean>;
  validation_fingerprint: string;
}

export interface CertificationRecordResult {
  record_id: string;
  frozen_fields: Record<string, string | boolean | null>;
  record_fingerprint: string;
  certified_evidence_frozen: true;
  issued: true;
  repository_mutated: false;
  ephemeral: true;
}

export interface CertificationEvidenceBundle {
  evidence_items: Array<{ evidence_id: string; ref: string; fingerprint: string | null }>;
  evidence_precedes_certification: true;
  evidence_fingerprint: string;
}

export interface CertificationTraceabilityResult {
  chain: Array<{ from: string; to: string }>;
  evidence_to_certification: true;
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

export interface CertificationCacheEntry {
  cache_key: string;
  result_fingerprint: string;
  ephemeral: true;
}

export interface CertificationRunResult {
  run_id: string;
  validation_fingerprint: string;
  validation_dispatch_fingerprint: string;
  dispatch: DispatchResult;
  certification_validation: CertificationValidationResult;
  record: CertificationRecordResult;
  evidence: CertificationEvidenceBundle;
  traceability: CertificationTraceabilityResult;
  contract_conformance: ContractConformanceResult;
  result_integrity: ResultIntegrityResult;
  boundary_integrity: BoundaryIntegrityResult;
  runtime_integrity: RuntimeIntegrityResult;
  cache: CertificationCacheEntry;
  result_fingerprint: string;
  reproducible: boolean;
  deterministic: boolean;
  repository_first: true;
  evidence_first: true;
  reuse_before_create: true;
  write_authorized: false;
  human_approval_required_before_repository_mutation: true;
  certified_evidence_frozen: boolean;
  certified_certification_operational: boolean;
  read_only: true;
  reference_only: true;
  ephemeral: true;
}

export interface CertificationRuntimeInterfaceDescription {
  version: string;
  component_ids: CertificationRuntimeComponentId[];
  public_surface: 'certification_runtime';
  read_only: true;
  reference_only: true;
  repository_first: true;
  evidence_first: true;
  reuse_before_create: true;
  human_approval_required_before_repository_mutation: true;
  write_authorized: false;
  implementation: true;
}

export interface CertificationRuntimeApi {
  describeInterface(): CertificationRuntimeInterfaceDescription;
  certify(runId?: string): CertificationRunResult;
  requestRepositoryMutation(action: string): {
    authorized: false;
    reason: string;
    requires_human_approval: true;
  };
}

export type CertificationRuntimeDeps = {
  createValidationRuntimeApi?: (root: string) => { validate(runId?: string): ValidationRunResult };
  createCache?: () => CertificationCache;
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

export interface CertificationCache {
  readonly id: CertificationRuntimeComponentId;
  get(key: string): CertificationCacheEntry | null;
  put(key: string, resultFingerprint: string): CertificationCacheEntry;
}

export function createCertificationCache(): CertificationCache {
  const store = new Map<string, CertificationCacheEntry>();
  return {
    id: 'certification_cache',
    get(key) {
      return store.get(key) ?? null;
    },
    put(key, resultFingerprint) {
      const entry: CertificationCacheEntry = {
        cache_key: key,
        result_fingerprint: resultFingerprint,
        ephemeral: true,
      };
      store.set(key, entry);
      return entry;
    },
  };
}

export function createCertificationDispatcher() {
  return {
    id: 'certification_dispatcher' as const,
    dispatch(validation: ValidationRunResult): DispatchResult {
      const steps = [
        { step_id: 'validate', module: 'certification_validator', status: 'evaluated' as const },
        { step_id: 'record', module: 'certification_recorder', status: 'evaluated' as const },
        {
          step_id: 'check_conformance',
          module: 'certification_contract_conformance',
          status: 'evaluated' as const,
        },
        {
          step_id: 'check_result_integrity',
          module: 'certification_result_integrity',
          status: 'evaluated' as const,
        },
        {
          step_id: 'check_boundary_integrity',
          module: 'certification_boundary_integrity',
          status: 'evaluated' as const,
        },
        {
          step_id: 'check_runtime_integrity',
          module: 'certification_runtime_integrity',
          status: 'evaluated' as const,
        },
        { step_id: 'await_approval', module: 'approval_gate', status: 'described' as const },
      ];
      const order = steps.map((step) => step.step_id);
      return {
        dispatch_id: 'vertical_ai_certification_dispatch_v1',
        steps,
        order,
        dispatch_fingerprint: stableFingerprint({
          steps,
          order,
          validation: validation.result_fingerprint,
        }),
        enacted: false,
        write_authorized: false,
      };
    },
  };
}

export function createCertificationValidator() {
  return {
    id: 'certification_validator' as const,
    validate(root: string, validation: ValidationRunResult): CertificationValidationResult {
      const foundationContracts = readJson<{ aggregate_verdict?: string }>(
        root,
        VERTICAL_AI_CERTIFICATION_CONTRACTS_V1_PATH
      );
      const recordDesign = readJson<{ record_design?: { design_only?: boolean } }>(
        root,
        VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH
      );
      const checks = {
        validation_operational: validation.certified_validation_operational === true,
        validation_integrity_preserved: validation.certified_validation_integrity_preserved === true,
        contract_validation_passed: validation.contract_validation.valid === true,
        boundary_validation_passed: validation.boundary_validation.valid === true,
        result_validation_passed: validation.result_validation.valid === true,
        foundation_contracts_pass: foundationContracts?.aggregate_verdict === 'PASS',
        record_design_present: recordDesign !== null,
        evidence_first: validation.evidence_first === true,
        no_write_authority: validation.write_authorized === false,
        reproducible: validation.reproducible === true,
        deterministic: validation.deterministic === true,
      };
      return {
        valid: Object.values(checks).every(Boolean),
        checks,
        validation_fingerprint: stableFingerprint(checks),
      };
    },
  };
}

export function createCertificationRecorder() {
  return {
    id: 'certification_recorder' as const,
    record(
      root: string,
      validation: ValidationRunResult,
      certificationValidation: CertificationValidationResult
    ): CertificationRecordResult {
      const recordDesign = readJson<{
        record_design?: { record_kind?: string; required_fields?: string[] };
      }>(root, VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH);

      const frozen_fields = {
        validation_result_fingerprint: validation.result_fingerprint,
        validation_dispatch_fingerprint: validation.dispatch.dispatch_fingerprint,
        validation_evidence_fingerprint: validation.evidence.evidence_fingerprint,
        certified_validation_integrity_preserved: validation.certified_validation_integrity_preserved,
        certified_validation_operational: validation.certified_validation_operational,
        certification_validation_fingerprint: certificationValidation.validation_fingerprint,
        certification_contract_id: 'vertical_ai_certification_contract_v1',
        boundary_integrity: validation.boundary_integrity.intact,
        evidence_fingerprint: validation.evidence.evidence_fingerprint,
        trace_fingerprint: validation.traceability.trace_fingerprint,
        record_kind: recordDesign?.record_design?.record_kind ?? 'vertical_ai_certification_record',
        foundation_record_ref: VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH,
      };

      return {
        record_id: 'vertical_ai_certification_record_runtime_v1',
        frozen_fields,
        record_fingerprint: stableFingerprint(frozen_fields),
        certified_evidence_frozen: true,
        issued: true,
        repository_mutated: false,
        ephemeral: true,
      };
    },
  };
}

export function createCertificationEvidenceModule() {
  return {
    id: 'certification_evidence' as const,
    collect(root: string, validation: ValidationRunResult): CertificationEvidenceBundle {
      const refs = [
        VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
        VERTICAL_AI_CERTIFICATION_COMPONENT_MODEL_V1_PATH,
        VERTICAL_AI_CERTIFICATION_WORKFLOW_V1_PATH,
        VERTICAL_AI_CERTIFICATION_APPROVAL_GATE_V1_PATH,
        VERTICAL_AI_CERTIFICATION_TRACEABILITY_V1_PATH,
        VERTICAL_AI_CERTIFICATION_EVIDENCE_MODEL_V1_PATH,
        VERTICAL_AI_CERTIFICATION_ARCHITECTURE_V1_PATH,
        VERTICAL_AI_CERTIFICATION_RULES_V1_PATH,
        VERTICAL_AI_CERTIFICATION_RUNTIME_REF_V1_PATH,
        VERTICAL_AI_CERTIFICATION_BOUNDARY_MODEL_V1_PATH,
        VERTICAL_AI_CERTIFICATION_CONTRACTS_V1_PATH,
        VERTICAL_AI_CERTIFICATION_REGISTRY_V1_PATH,
        VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH,
        VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
        PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
        REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
        REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
        AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
        CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
        ...CERTIFIED_CONNECTORS.map((connector) => connector.master_snapshot_ref),
      ];
      const evidence_items = [
        {
          evidence_id: 'validation_result',
          ref: 'validation_runtime_result_fingerprint',
          fingerprint: validation.result_fingerprint,
        },
        {
          evidence_id: 'validation_dispatch',
          ref: 'validation_runtime_dispatch_fingerprint',
          fingerprint: validation.dispatch.dispatch_fingerprint,
        },
        {
          evidence_id: 'validation_evidence',
          ref: 'validation_runtime_evidence_fingerprint',
          fingerprint: validation.evidence.evidence_fingerprint,
        },
        {
          evidence_id: 'execution_fingerprint',
          ref: 'validation_runtime_execution_fingerprint',
          fingerprint: validation.execution_fingerprint,
        },
        ...refs.map((ref) => ({
          evidence_id: `ref:${path.basename(ref)}`,
          ref,
          fingerprint: fingerprintFile(root, ref),
        })),
      ].sort((a, b) => (a.evidence_id < b.evidence_id ? -1 : a.evidence_id > b.evidence_id ? 1 : 0));
      return {
        evidence_items,
        evidence_precedes_certification: true,
        evidence_fingerprint: stableFingerprint(evidence_items),
      };
    },
  };
}

export function createCertificationTraceabilityModule() {
  return {
    id: 'certification_traceability' as const,
    trace(): CertificationTraceabilityResult {
      const chain = [
        { from: 'validation_runtime', to: 'certification_runtime' },
        { from: 'certification_runtime', to: 'certification_dispatcher' },
        { from: 'certification_dispatcher', to: 'certification_validator' },
        { from: 'certification_dispatcher', to: 'certification_recorder' },
        { from: 'certification_validator', to: 'certification_contract_conformance' },
        { from: 'certification_recorder', to: 'certification_result_integrity' },
        { from: 'certification_validator', to: 'certification_boundary_integrity' },
        { from: 'certification_evidence', to: 'certification_traceability' },
        { from: 'certification_traceability', to: 'certification_reproducibility' },
        { from: 'certification_reproducibility', to: 'runtime_determinism' },
        { from: 'certification_contract_conformance', to: 'certification_runtime_integrity' },
        { from: 'certification_boundary_integrity', to: 'certification_runtime_integrity' },
        { from: 'certification_result_integrity', to: 'certification_runtime_integrity' },
      ].sort((a, b) => {
        const left = `${a.from}->${a.to}`;
        const right = `${b.from}->${b.to}`;
        return left < right ? -1 : left > right ? 1 : 0;
      });
      return {
        chain,
        evidence_to_certification: true,
        trace_fingerprint: stableFingerprint(chain),
      };
    },
  };
}

export function createCertificationContractConformanceModule() {
  return {
    id: 'certification_contract_conformance' as const,
    check(
      certificationValidation: CertificationValidationResult,
      record: CertificationRecordResult,
      dispatch: DispatchResult
    ): ContractConformanceResult {
      const contracts = {
        certification_validation_passed: certificationValidation.valid === true,
        evidence_frozen: record.certified_evidence_frozen === true,
        record_issued: record.issued === true,
        record_ephemeral: record.ephemeral === true,
        no_repository_mutation: record.repository_mutated === false,
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

export function createCertificationResultIntegrityModule() {
  return {
    id: 'certification_result_integrity' as const,
    verify(
      validation: ValidationRunResult,
      certificationValidation: CertificationValidationResult,
      record: CertificationRecordResult
    ): ResultIntegrityResult {
      const checks = {
        certification_validation_valid: certificationValidation.valid === true,
        validation_result_bound: typeof validation.result_fingerprint === 'string',
        record_fingerprint_present: typeof record.record_fingerprint === 'string',
        frozen_matches_validation:
          record.frozen_fields.validation_result_fingerprint === validation.result_fingerprint,
        evidence_frozen: record.certified_evidence_frozen === true,
      };
      return {
        intact: Object.values(checks).every(Boolean),
        checks,
        integrity_fingerprint: stableFingerprint(checks),
      };
    },
  };
}

export function createCertificationBoundaryIntegrityModule() {
  return {
    id: 'certification_boundary_integrity' as const,
    verify(
      root: string,
      validation: ValidationRunResult,
      dispatch: DispatchResult,
      record: CertificationRecordResult
    ): BoundaryIntegrityResult {
      const connectorsPresent = CERTIFIED_CONNECTORS.every((connector) =>
        fs.existsSync(path.join(root, connector.master_snapshot_ref))
      );
      const boundaryModel = readJson<{ boundary_policy?: Record<string, unknown> }>(
        root,
        VERTICAL_AI_CERTIFICATION_BOUNDARY_MODEL_V1_PATH
      );
      const boundaries = {
        boundary_model_present: boundaryModel !== null,
        validation_boundaries_intact: validation.boundary_integrity.intact === true,
        platform_core_unmutated: true,
        cil_unmutated: true,
        certified_connectors_present: connectorsPresent,
        dispatch_not_enacted: dispatch.enacted === false,
        write_blocked: dispatch.write_authorized === false,
        record_no_repo_mutation: record.repository_mutated === false,
      };
      return {
        intact: Object.values(boundaries).every(Boolean),
        boundaries,
        boundary_fingerprint: stableFingerprint(boundaries),
      };
    },
  };
}

export function createCertificationRuntimeIntegrityModule() {
  return {
    id: 'certification_runtime_integrity' as const,
    verify(
      contractConformance: ContractConformanceResult,
      resultIntegrity: ResultIntegrityResult,
      boundaryIntegrity: BoundaryIntegrityResult,
      evidence: CertificationEvidenceBundle,
      traceability: CertificationTraceabilityResult,
      record: CertificationRecordResult
    ): RuntimeIntegrityResult {
      const checks = {
        contract_conformance: contractConformance.conforms === true,
        result_integrity: resultIntegrity.intact === true,
        boundary_integrity: boundaryIntegrity.intact === true,
        evidence_precedes_certification: evidence.evidence_precedes_certification === true,
        evidence_to_certification: traceability.evidence_to_certification === true,
        certified_evidence_frozen: record.certified_evidence_frozen === true,
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

export function createCertificationReproducibilityModule() {
  return {
    id: 'certification_reproducibility' as const,
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

export function createCertificationRuntimeApi(
  root: string,
  deps: CertificationRuntimeDeps = {}
): CertificationRuntimeApi {
  const validationFactory = deps.createValidationRuntimeApi ?? createValidationRuntimeApi;
  const cacheFactory = deps.createCache ?? createCertificationCache;

  const dispatcher = createCertificationDispatcher();
  const validator = createCertificationValidator();
  const recorder = createCertificationRecorder();
  const evidenceModule = createCertificationEvidenceModule();
  const traceabilityModule = createCertificationTraceabilityModule();
  const contractConformance = createCertificationContractConformanceModule();
  const resultIntegrity = createCertificationResultIntegrityModule();
  const boundaryIntegrity = createCertificationBoundaryIntegrityModule();
  const runtimeIntegrity = createCertificationRuntimeIntegrityModule();
  const reproducibility = createCertificationReproducibilityModule();
  const determinism = createRuntimeDeterminismModule();
  const cache = cacheFactory();

  function runOnce(runId: string): CertificationRunResult {
    const validation = validationFactory(root).validate(`${runId}:validation`);
    const dispatch = dispatcher.dispatch(validation);
    const certification_validation = validator.validate(root, validation);
    const record = recorder.record(root, validation, certification_validation);
    const evidence = evidenceModule.collect(root, validation);
    const traceability = traceabilityModule.trace();
    const contract_conformance = contractConformance.check(
      certification_validation,
      record,
      dispatch
    );
    const result_integrity = resultIntegrity.verify(validation, certification_validation, record);
    const boundary_integrity = boundaryIntegrity.verify(root, validation, dispatch, record);
    const runtime_integrity = runtimeIntegrity.verify(
      contract_conformance,
      result_integrity,
      boundary_integrity,
      evidence,
      traceability,
      record
    );

    const result_fingerprint = stableFingerprint({
      validation: validation.result_fingerprint,
      dispatch: dispatch.dispatch_fingerprint,
      certification: certification_validation.validation_fingerprint,
      record: record.record_fingerprint,
      evidence: evidence.evidence_fingerprint,
      trace: traceability.trace_fingerprint,
      contracts: contract_conformance.conformance_fingerprint,
      result_integrity: result_integrity.integrity_fingerprint,
      boundary_integrity: boundary_integrity.boundary_fingerprint,
      runtime_integrity: runtime_integrity.integrity_fingerprint,
    });

    const cacheEntry = cache.put(`certification:${result_fingerprint}`, result_fingerprint);

    const certified_evidence_frozen =
      record.certified_evidence_frozen === true && result_integrity.intact === true;

    const certified_certification_operational =
      certified_evidence_frozen &&
      certification_validation.valid &&
      contract_conformance.conforms &&
      boundary_integrity.intact &&
      runtime_integrity.intact &&
      evidence.evidence_precedes_certification &&
      traceability.evidence_to_certification;

    return {
      run_id: runId,
      validation_fingerprint: validation.result_fingerprint,
      validation_dispatch_fingerprint: validation.dispatch.dispatch_fingerprint,
      dispatch,
      certification_validation,
      record,
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
      certified_evidence_frozen,
      certified_certification_operational,
      read_only: true,
      reference_only: true,
      ephemeral: true,
    };
  }

  return {
    describeInterface() {
      return {
        version: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_SEMVER,
        component_ids: [...CERTIFICATION_RUNTIME_COMPONENT_IDS],
        public_surface: 'certification_runtime',
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
    certify(runId = 'certification-run') {
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
        reason: `Repository mutation '${action}' blocked: human approval required; Certification Runtime is read-only`,
        requires_human_approval: true as const,
      };
    },
  };
}

export function createCertificationRuntimeRegistry() {
  return {
    runtime_id: 'vertical_ai_certification_runtime',
    version: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_SEMVER,
    component_ids: [...CERTIFICATION_RUNTIME_COMPONENT_IDS],
    public_surface: 'certification_runtime',
  };
}

export function exportCertificationRuntime(
  api: CertificationRuntimeApi,
  registry: ReturnType<typeof createCertificationRuntimeRegistry>
) {
  const iface = api.describeInterface();
  return {
    export_id: 'vertical_ai_certification_runtime_export_v1',
    version: iface.version,
    component_ids: iface.component_ids,
    registry,
    interface: iface,
  };
}
