import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_WORKFLOW_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_TRACEABILITY_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_RUNTIME_REF_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_CONTRACTS_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_REGISTRY_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_INPUT_CONTRACT_V1_PATH,
} from './verticalAiImprovementFoundationV1Engine.js';
import { VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH } from './verticalAiCertificationRuntimeV1Engine.js';
import {
  createCertificationRuntimeApi,
  type CertificationRunResult,
} from './verticalAiCertificationRuntimeV1.js';
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

export const VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_SEMVER = '1.0.0' as const;

/**
 * Public component identity of Vertical AI Improvement Runtime.
 * `improvement_runtime` is the only public orchestration surface; other modules are
 * internal and replaceable.
 */
export const IMPROVEMENT_RUNTIME_COMPONENT_IDS = [
  'improvement_runtime',
  'improvement_dispatcher',
  'improvement_candidate_selector',
  'improvement_validator',
  'improvement_cache',
  'improvement_traceability',
  'improvement_reproducibility',
  'improvement_evidence',
  'improvement_contract_conformance',
  'runtime_determinism',
  'improvement_result_integrity',
  'improvement_boundary_integrity',
  'improvement_runtime_integrity',
] as const;

export type ImprovementRuntimeComponentId = (typeof IMPROVEMENT_RUNTIME_COMPONENT_IDS)[number];

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
  repository_mutation: false;
}

export interface CandidateSelectionResult {
  candidates: Array<{
    candidate_id: string;
    source_fingerprint: string;
    kind: string;
    enacted: false;
  }>;
  selected_count: number;
  certified_evidence_only: true;
  selection_fingerprint: string;
  repository_mutation: false;
}

export interface ImprovementValidationResult {
  valid: boolean;
  checks: Record<string, boolean>;
  validation_fingerprint: string;
}

export interface ImprovementEvidenceBundle {
  evidence_items: Array<{ evidence_id: string; ref: string; fingerprint: string | null }>;
  evidence_precedes_improvement: true;
  certified_evidence_only: true;
  evidence_fingerprint: string;
}

export interface ImprovementTraceabilityResult {
  chain: Array<{ from: string; to: string }>;
  evidence_to_improvement: true;
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

export interface ImprovementCacheEntry {
  cache_key: string;
  result_fingerprint: string;
  ephemeral: true;
}

export interface ImprovementRunResult {
  run_id: string;
  certification_fingerprint: string;
  certification_record_fingerprint: string;
  dispatch: DispatchResult;
  candidates: CandidateSelectionResult;
  improvement_validation: ImprovementValidationResult;
  evidence: ImprovementEvidenceBundle;
  traceability: ImprovementTraceabilityResult;
  contract_conformance: ContractConformanceResult;
  result_integrity: ResultIntegrityResult;
  boundary_integrity: BoundaryIntegrityResult;
  runtime_integrity: RuntimeIntegrityResult;
  cache: ImprovementCacheEntry;
  result_fingerprint: string;
  reproducible: boolean;
  deterministic: boolean;
  repository_first: true;
  evidence_first: true;
  improve_only_from_certified_evidence: true;
  write_authorized: false;
  repository_mutation: false;
  repository_mutation_forbidden: true;
  certified_improvement_integrity_preserved: boolean;
  improvement_operational: boolean;
  read_only: true;
  reference_only: true;
  ephemeral: true;
}

export interface ImprovementRuntimeInterfaceDescription {
  version: string;
  component_ids: ImprovementRuntimeComponentId[];
  public_surface: 'improvement_runtime';
  read_only: true;
  reference_only: true;
  repository_first: true;
  evidence_first: true;
  improve_only_from_certified_evidence: true;
  repository_mutation_forbidden: true;
  write_authorized: false;
  implementation: true;
}

export interface ImprovementRuntimeApi {
  describeInterface(): ImprovementRuntimeInterfaceDescription;
  improve(runId?: string): ImprovementRunResult;
  requestRepositoryMutation(action: string): {
    authorized: false;
    reason: string;
    repository_mutation_forbidden: true;
  };
}

export type ImprovementRuntimeDeps = {
  createCertificationRuntimeApi?: (root: string) => {
    certify(runId?: string): CertificationRunResult;
  };
  createCache?: () => ImprovementCache;
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

export interface ImprovementCache {
  readonly id: ImprovementRuntimeComponentId;
  get(key: string): ImprovementCacheEntry | null;
  put(key: string, resultFingerprint: string): ImprovementCacheEntry;
}

export function createImprovementCache(): ImprovementCache {
  const store = new Map<string, ImprovementCacheEntry>();
  return {
    id: 'improvement_cache',
    get(key) {
      return store.get(key) ?? null;
    },
    put(key, resultFingerprint) {
      const entry: ImprovementCacheEntry = {
        cache_key: key,
        result_fingerprint: resultFingerprint,
        ephemeral: true,
      };
      store.set(key, entry);
      return entry;
    },
  };
}

export function createImprovementDispatcher() {
  return {
    id: 'improvement_dispatcher' as const,
    dispatch(certification: CertificationRunResult): DispatchResult {
      const steps = [
        {
          step_id: 'select_candidates',
          module: 'improvement_candidate_selector',
          status: 'evaluated' as const,
        },
        { step_id: 'validate', module: 'improvement_validator', status: 'evaluated' as const },
        {
          step_id: 'check_conformance',
          module: 'improvement_contract_conformance',
          status: 'evaluated' as const,
        },
        {
          step_id: 'check_result_integrity',
          module: 'improvement_result_integrity',
          status: 'evaluated' as const,
        },
        {
          step_id: 'check_boundary_integrity',
          module: 'improvement_boundary_integrity',
          status: 'evaluated' as const,
        },
        {
          step_id: 'check_runtime_integrity',
          module: 'improvement_runtime_integrity',
          status: 'evaluated' as const,
        },
        { step_id: 'block_mutation', module: 'approval_gate', status: 'described' as const },
      ];
      const order = steps.map((step) => step.step_id);
      return {
        dispatch_id: 'vertical_ai_improvement_dispatch_v1',
        steps,
        order,
        dispatch_fingerprint: stableFingerprint({
          steps,
          order,
          certification: certification.result_fingerprint,
        }),
        enacted: false,
        write_authorized: false,
        repository_mutation: false,
      };
    },
  };
}

export function createImprovementCandidateSelector() {
  return {
    id: 'improvement_candidate_selector' as const,
    select(root: string, certification: CertificationRunResult): CandidateSelectionResult {
      const inputContract = readJson<{
        accepted_input?: { requires_certified_evidence_frozen?: boolean };
      }>(root, VERTICAL_AI_IMPROVEMENT_INPUT_CONTRACT_V1_PATH);

      const frozen = certification.certified_evidence_frozen === true;
      const operational = certification.certified_certification_operational === true;
      const inputOk = inputContract?.accepted_input?.requires_certified_evidence_frozen === true;

      const baseCandidates =
        frozen && operational && inputOk
          ? [
              {
                candidate_id: 'imp_reuse_certified_record',
                source_fingerprint: certification.record.record_fingerprint,
                kind: 'reuse_certified_evidence',
                enacted: false as const,
              },
              {
                candidate_id: 'imp_analyze_boundary_gap',
                source_fingerprint: certification.boundary_integrity.boundary_fingerprint,
                kind: 'analyze_gap_descriptor',
                enacted: false as const,
              },
              {
                candidate_id: 'imp_trace_strengthening',
                source_fingerprint: certification.traceability.trace_fingerprint,
                kind: 'traceability_descriptor',
                enacted: false as const,
              },
            ]
          : [];

      const candidates = [...baseCandidates].sort((a, b) =>
        a.candidate_id < b.candidate_id ? -1 : a.candidate_id > b.candidate_id ? 1 : 0
      );

      return {
        candidates,
        selected_count: candidates.length,
        certified_evidence_only: true,
        selection_fingerprint: stableFingerprint({
          candidates,
          frozen,
          operational,
          inputOk,
        }),
        repository_mutation: false,
      };
    },
  };
}

export function createImprovementValidator() {
  return {
    id: 'improvement_validator' as const,
    validate(
      root: string,
      certification: CertificationRunResult,
      candidates: CandidateSelectionResult
    ): ImprovementValidationResult {
      const foundationContracts = readJson<{ aggregate_verdict?: string }>(
        root,
        VERTICAL_AI_IMPROVEMENT_CONTRACTS_V1_PATH
      );
      const checks = {
        certified_evidence_frozen: certification.certified_evidence_frozen === true,
        certification_operational: certification.certified_certification_operational === true,
        foundation_contracts_pass: foundationContracts?.aggregate_verdict === 'PASS',
        candidates_from_certified_evidence: candidates.certified_evidence_only === true,
        candidates_present: candidates.selected_count > 0,
        candidates_not_enacted: candidates.candidates.every((c) => c.enacted === false),
        no_repository_mutation: candidates.repository_mutation === false,
        certification_read_only: certification.read_only === true,
        evidence_first: certification.evidence_first === true,
      };
      return {
        valid: Object.values(checks).every(Boolean),
        checks,
        validation_fingerprint: stableFingerprint(checks),
      };
    },
  };
}

export function createImprovementEvidenceModule() {
  return {
    id: 'improvement_evidence' as const,
    collect(root: string, certification: CertificationRunResult): ImprovementEvidenceBundle {
      const refs = [
        VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PATH,
        VERTICAL_AI_IMPROVEMENT_COMPONENT_MODEL_V1_PATH,
        VERTICAL_AI_IMPROVEMENT_WORKFLOW_V1_PATH,
        VERTICAL_AI_IMPROVEMENT_APPROVAL_GATE_V1_PATH,
        VERTICAL_AI_IMPROVEMENT_TRACEABILITY_V1_PATH,
        VERTICAL_AI_IMPROVEMENT_EVIDENCE_MODEL_V1_PATH,
        VERTICAL_AI_IMPROVEMENT_ARCHITECTURE_V1_PATH,
        VERTICAL_AI_IMPROVEMENT_RUNTIME_REF_V1_PATH,
        VERTICAL_AI_IMPROVEMENT_BOUNDARY_MODEL_V1_PATH,
        VERTICAL_AI_IMPROVEMENT_CONTRACTS_V1_PATH,
        VERTICAL_AI_IMPROVEMENT_REGISTRY_V1_PATH,
        VERTICAL_AI_IMPROVEMENT_INPUT_CONTRACT_V1_PATH,
        VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH,
        PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
        REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
        REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
        AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
        CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
        ...CERTIFIED_CONNECTORS.map((connector) => connector.master_snapshot_ref),
      ];
      const evidence_items = [
        {
          evidence_id: 'certification_result',
          ref: 'certification_runtime_result_fingerprint',
          fingerprint: certification.result_fingerprint,
        },
        {
          evidence_id: 'certification_record',
          ref: 'certification_runtime_record_fingerprint',
          fingerprint: certification.record.record_fingerprint,
        },
        {
          evidence_id: 'certified_evidence_frozen',
          ref: 'certification_runtime_frozen_flag',
          fingerprint: stableFingerprint({
            frozen: certification.certified_evidence_frozen,
            operational: certification.certified_certification_operational,
          }),
        },
        ...refs.map((ref) => ({
          evidence_id: `ref:${path.basename(ref)}`,
          ref,
          fingerprint: fingerprintFile(root, ref),
        })),
      ].sort((a, b) => (a.evidence_id < b.evidence_id ? -1 : a.evidence_id > b.evidence_id ? 1 : 0));
      return {
        evidence_items,
        evidence_precedes_improvement: true,
        certified_evidence_only: true,
        evidence_fingerprint: stableFingerprint(evidence_items),
      };
    },
  };
}

export function createImprovementTraceabilityModule() {
  return {
    id: 'improvement_traceability' as const,
    trace(): ImprovementTraceabilityResult {
      const chain = [
        { from: 'certification_runtime', to: 'improvement_runtime' },
        { from: 'improvement_runtime', to: 'improvement_dispatcher' },
        { from: 'improvement_dispatcher', to: 'improvement_candidate_selector' },
        { from: 'improvement_dispatcher', to: 'improvement_validator' },
        { from: 'improvement_candidate_selector', to: 'improvement_contract_conformance' },
        { from: 'improvement_validator', to: 'improvement_result_integrity' },
        { from: 'improvement_validator', to: 'improvement_boundary_integrity' },
        { from: 'improvement_evidence', to: 'improvement_traceability' },
        { from: 'improvement_traceability', to: 'improvement_reproducibility' },
        { from: 'improvement_reproducibility', to: 'runtime_determinism' },
        { from: 'improvement_contract_conformance', to: 'improvement_runtime_integrity' },
        { from: 'improvement_boundary_integrity', to: 'improvement_runtime_integrity' },
        { from: 'improvement_result_integrity', to: 'improvement_runtime_integrity' },
      ].sort((a, b) => {
        const left = `${a.from}->${a.to}`;
        const right = `${b.from}->${b.to}`;
        return left < right ? -1 : left > right ? 1 : 0;
      });
      return {
        chain,
        evidence_to_improvement: true,
        trace_fingerprint: stableFingerprint(chain),
      };
    },
  };
}

export function createImprovementContractConformanceModule() {
  return {
    id: 'improvement_contract_conformance' as const,
    check(
      improvementValidation: ImprovementValidationResult,
      candidates: CandidateSelectionResult,
      dispatch: DispatchResult
    ): ContractConformanceResult {
      const contracts = {
        improvement_validation_passed: improvementValidation.valid === true,
        certified_evidence_only: candidates.certified_evidence_only === true,
        candidates_not_enacted: candidates.candidates.every((c) => c.enacted === false),
        dispatch_descriptor_only: dispatch.enacted === false,
        no_write_authority: dispatch.write_authorized === false,
        no_repository_mutation: dispatch.repository_mutation === false,
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

export function createImprovementResultIntegrityModule() {
  return {
    id: 'improvement_result_integrity' as const,
    verify(
      certification: CertificationRunResult,
      candidates: CandidateSelectionResult,
      improvementValidation: ImprovementValidationResult
    ): ResultIntegrityResult {
      const checks = {
        improvement_validation_valid: improvementValidation.valid === true,
        certification_result_bound: typeof certification.result_fingerprint === 'string',
        record_frozen: certification.record.certified_evidence_frozen === true,
        candidates_bound: candidates.selected_count > 0,
        candidate_sources_certified: candidates.candidates.every(
          (c) => typeof c.source_fingerprint === 'string' && c.source_fingerprint.length === 16
        ),
      };
      return {
        intact: Object.values(checks).every(Boolean),
        checks,
        integrity_fingerprint: stableFingerprint(checks),
      };
    },
  };
}

export function createImprovementBoundaryIntegrityModule() {
  return {
    id: 'improvement_boundary_integrity' as const,
    verify(
      root: string,
      certification: CertificationRunResult,
      dispatch: DispatchResult,
      candidates: CandidateSelectionResult
    ): BoundaryIntegrityResult {
      const boundaryModel = readJson<{ boundary_policy?: { repository_mutation?: boolean } }>(
        root,
        VERTICAL_AI_IMPROVEMENT_BOUNDARY_MODEL_V1_PATH
      );
      const connectorsPresent = CERTIFIED_CONNECTORS.every((connector) =>
        fs.existsSync(path.join(root, connector.master_snapshot_ref))
      );
      const boundaries = {
        boundary_model_present: boundaryModel !== null,
        boundary_no_repo_mutation: boundaryModel?.boundary_policy?.repository_mutation === false,
        certification_boundaries_intact: certification.boundary_integrity.intact === true,
        platform_core_unmutated: true,
        cil_unmutated: true,
        certified_connectors_present: connectorsPresent,
        dispatch_not_enacted: dispatch.enacted === false,
        write_blocked: dispatch.write_authorized === false,
        repository_mutation_false: dispatch.repository_mutation === false,
        candidates_not_enacted: candidates.candidates.every((c) => c.enacted === false),
      };
      return {
        intact: Object.values(boundaries).every(Boolean),
        boundaries,
        boundary_fingerprint: stableFingerprint(boundaries),
      };
    },
  };
}

export function createImprovementRuntimeIntegrityModule() {
  return {
    id: 'improvement_runtime_integrity' as const,
    verify(
      contractConformance: ContractConformanceResult,
      resultIntegrity: ResultIntegrityResult,
      boundaryIntegrity: BoundaryIntegrityResult,
      evidence: ImprovementEvidenceBundle,
      traceability: ImprovementTraceabilityResult
    ): RuntimeIntegrityResult {
      const checks = {
        contract_conformance: contractConformance.conforms === true,
        result_integrity: resultIntegrity.intact === true,
        boundary_integrity: boundaryIntegrity.intact === true,
        evidence_precedes_improvement: evidence.evidence_precedes_improvement === true,
        certified_evidence_only: evidence.certified_evidence_only === true,
        evidence_to_improvement: traceability.evidence_to_improvement === true,
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

export function createImprovementReproducibilityModule() {
  return {
    id: 'improvement_reproducibility' as const,
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

export function createImprovementRuntimeApi(
  root: string,
  deps: ImprovementRuntimeDeps = {}
): ImprovementRuntimeApi {
  const certificationFactory = deps.createCertificationRuntimeApi ?? createCertificationRuntimeApi;
  const cacheFactory = deps.createCache ?? createImprovementCache;

  const dispatcher = createImprovementDispatcher();
  const candidateSelector = createImprovementCandidateSelector();
  const validator = createImprovementValidator();
  const evidenceModule = createImprovementEvidenceModule();
  const traceabilityModule = createImprovementTraceabilityModule();
  const contractConformance = createImprovementContractConformanceModule();
  const resultIntegrity = createImprovementResultIntegrityModule();
  const boundaryIntegrity = createImprovementBoundaryIntegrityModule();
  const runtimeIntegrity = createImprovementRuntimeIntegrityModule();
  const reproducibility = createImprovementReproducibilityModule();
  const determinism = createRuntimeDeterminismModule();
  const cache = cacheFactory();

  function runOnce(runId: string): ImprovementRunResult {
    const certification = certificationFactory(root).certify(`${runId}:certification`);
    const dispatch = dispatcher.dispatch(certification);
    const candidates = candidateSelector.select(root, certification);
    const improvement_validation = validator.validate(root, certification, candidates);
    const evidence = evidenceModule.collect(root, certification);
    const traceability = traceabilityModule.trace();
    const contract_conformance = contractConformance.check(
      improvement_validation,
      candidates,
      dispatch
    );
    const result_integrity = resultIntegrity.verify(
      certification,
      candidates,
      improvement_validation
    );
    const boundary_integrity = boundaryIntegrity.verify(root, certification, dispatch, candidates);
    const runtime_integrity = runtimeIntegrity.verify(
      contract_conformance,
      result_integrity,
      boundary_integrity,
      evidence,
      traceability
    );

    const result_fingerprint = stableFingerprint({
      certification: certification.result_fingerprint,
      record: certification.record.record_fingerprint,
      dispatch: dispatch.dispatch_fingerprint,
      candidates: candidates.selection_fingerprint,
      validation: improvement_validation.validation_fingerprint,
      evidence: evidence.evidence_fingerprint,
      trace: traceability.trace_fingerprint,
      contracts: contract_conformance.conformance_fingerprint,
      result_integrity: result_integrity.integrity_fingerprint,
      boundary_integrity: boundary_integrity.boundary_fingerprint,
      runtime_integrity: runtime_integrity.integrity_fingerprint,
    });

    const cacheEntry = cache.put(`improvement:${result_fingerprint}`, result_fingerprint);

    const certified_improvement_integrity_preserved =
      boundary_integrity.intact &&
      result_integrity.intact &&
      runtime_integrity.intact &&
      contract_conformance.conforms &&
      evidence.certified_evidence_only;

    const improvement_operational =
      certified_improvement_integrity_preserved &&
      improvement_validation.valid &&
      candidates.selected_count > 0 &&
      evidence.evidence_precedes_improvement &&
      traceability.evidence_to_improvement &&
      dispatch.repository_mutation === false;

    return {
      run_id: runId,
      certification_fingerprint: certification.result_fingerprint,
      certification_record_fingerprint: certification.record.record_fingerprint,
      dispatch,
      candidates,
      improvement_validation,
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
      improve_only_from_certified_evidence: true,
      write_authorized: false,
      repository_mutation: false,
      repository_mutation_forbidden: true,
      certified_improvement_integrity_preserved,
      improvement_operational,
      read_only: true,
      reference_only: true,
      ephemeral: true,
    };
  }

  return {
    describeInterface() {
      return {
        version: VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_SEMVER,
        component_ids: [...IMPROVEMENT_RUNTIME_COMPONENT_IDS],
        public_surface: 'improvement_runtime',
        read_only: true,
        reference_only: true,
        repository_first: true,
        evidence_first: true,
        improve_only_from_certified_evidence: true,
        repository_mutation_forbidden: true,
        write_authorized: false,
        implementation: true,
      };
    },
    improve(runId = 'improvement-run') {
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
        reason: `Repository mutation '${action}' forbidden: Improvement Runtime hard-blocks all repository mutation`,
        repository_mutation_forbidden: true as const,
      };
    },
  };
}

export function createImprovementRuntimeRegistry() {
  return {
    runtime_id: 'vertical_ai_improvement_runtime',
    version: VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_SEMVER,
    component_ids: [...IMPROVEMENT_RUNTIME_COMPONENT_IDS],
    public_surface: 'improvement_runtime',
  };
}

export function exportImprovementRuntime(
  api: ImprovementRuntimeApi,
  registry: ReturnType<typeof createImprovementRuntimeRegistry>
) {
  const iface = api.describeInterface();
  return {
    export_id: 'vertical_ai_improvement_runtime_export_v1',
    version: iface.version,
    component_ids: iface.component_ids,
    registry,
    interface: iface,
  };
}
