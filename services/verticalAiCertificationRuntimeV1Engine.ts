import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_BRAIN_ARCHITECTURE_VERSION } from './projectBrainFoundationV1.js';
import { PROJECT_BRAIN_COMPLETE_V1_PATH } from './projectBrainCompleteV1Engine.js';
import { PROJECT_BRAIN_FINAL_CERTIFICATION_V1_PATH } from './projectBrainFinalCertificationV1Engine.js';
import { PROJECT_BRAIN_MASTER_CAPABILITY_REGISTRATION_V1_PATH } from './projectBrainMasterCapabilityRegistrationV1Engine.js';
import { PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH } from './projectBrainMasterSnapshotV1Engine.js';
import { VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PATH } from './verticalAiGlobalCertificationV1Engine.js';
import { PROJECT_BRAIN_LPM_V1_PATH } from './projectBrainWaveBLpmMaterializationV1Engine.js';
import { PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH } from './projectBrainWaveCSemanticUnderstandingV1Engine.js';
import {
  REPOSITORY_INTELLIGENCE_BUNDLE_V1_PATH,
  REPOSITORY_INTELLIGENCE_BUNDLE_V1_VERSION_PATH,
  REPOSITORY_INTELLIGENCE_BUNDLE_V1_REGISTRY_PATH,
  REPOSITORY_INTELLIGENCE_BUNDLE_V1_EXPORT_PATH,
} from './repositoryIntelligenceBundleIntegrationImplementationV1Engine.js';
import {
  REPOSITORY_INTELLIGENCE_BUNDLE_PRODUCTION_CERTIFICATION_V1_PATH,
  REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
} from './repositoryIntelligenceBundleProductionCertificationV1Engine.js';
import {
  REPOSITORY_INTELLIGENCE_ACCESS_CONTRACT_V1_PATH,
  REPOSITORY_INTELLIGENCE_ACCESS_API_V1_PATH,
} from './repositoryIntelligenceAccessContractV1Engine.js';
import { REPOSITORY_INTELLIGENCE_ACCESS_V1_PATH } from './repositoryIntelligenceAccessImplementationV1Engine.js';
import {
  REPOSITORY_INTELLIGENCE_ACCESS_PRODUCTION_CERTIFICATION_V1_PATH,
  REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
} from './repositoryIntelligenceAccessProductionCertificationV1Engine.js';
import { AGENT_RUNTIME_V1_PATH } from './agentRuntimeImplementationV1Engine.js';
import {
  AGENT_RUNTIME_PRODUCTION_CERTIFICATION_V1_PATH,
  AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
} from './agentRuntimeProductionCertificationV1Engine.js';
import {
  CONSUMER_CONNECTOR_CONTRACT_V1_PATH,
  CONNECTOR_CONTRACT_REGISTRY_V1_PATH,
} from './consumerConnectorContractV1Engine.js';
import { CONSUMER_PROFILE_V1_PATH } from './consumerProfileV1Engine.js';
import { RUNTIME_CONNECTOR_V1_PATH } from './runtimeConnectorV1Engine.js';
import { COMPATIBILITY_MODEL_V1_PATH } from './compatibilityModelV1Engine.js';
import {
  CONSUMER_INTEGRATION_PRODUCTION_CERTIFICATION_V1_PATH,
  CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
} from './consumerIntegrationProductionCertificationV1Engine.js';
import { CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './claudeConnectorProductionCertificationV1Engine.js';
import { CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './chatgptConnectorProductionCertificationV1Engine.js';
import { GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './geminiConnectorProductionCertificationV1Engine.js';
import { CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './cursorConnectorProductionCertificationV1Engine.js';
import { MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './mcpConnectorProductionCertificationV1Engine.js';
import {
  VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PASS_VERDICT,
  VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_REPORT_PATH,
  VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
  VERTICAL_AI_CERTIFICATION_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_CERTIFICATION_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_CERTIFICATION_WORKFLOW_V1_PATH,
  VERTICAL_AI_CERTIFICATION_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_CERTIFICATION_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_CERTIFICATION_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_CERTIFICATION_TRACEABILITY_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RULES_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_REF_V1_PATH,
  VERTICAL_AI_CERTIFICATION_CONTRACTS_V1_PATH,
  VERTICAL_AI_CERTIFICATION_REGISTRY_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH,
} from './verticalAiCertificationFoundationV1Engine.js';
import {
  VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_EXPORT_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_VERSION_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_REGISTRY_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_REPRODUCIBILITY_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_CONTRACTS_PATH,
} from './verticalAiValidationRuntimeV1Engine.js';
import {
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_SEMVER,
  CERTIFICATION_RUNTIME_COMPONENT_IDS,
  createCertificationRuntimeApi,
  createCertificationRuntimeRegistry,
  createCertificationCache,
  exportCertificationRuntime,
} from './verticalAiCertificationRuntimeV1.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PHASE = 'PHASE-VAI-010' as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_SYSTEM_ID =
  'VERTICAL_AI_CERTIFICATION_RUNTIME_V1' as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_CERTIFICATION_RUNTIME_V1' as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_CERTIFICATION_RUNTIME_V1' as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_STATUS =
  'VERTICAL_AI_CERTIFICATION_RUNTIME_IMPLEMENTED' as const;

export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_DIR =
  'datasets/vertical_ai_certification_runtime_v1' as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_RUNTIME_V1_DIR}/vertical-ai-certification-runtime-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_EXPORT_PATH =
  `${VERTICAL_AI_CERTIFICATION_RUNTIME_V1_DIR}/runtime-export-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_VERSION_PATH =
  `${VERTICAL_AI_CERTIFICATION_RUNTIME_V1_DIR}/runtime-version-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REGISTRY_PATH =
  `${VERTICAL_AI_CERTIFICATION_RUNTIME_V1_DIR}/runtime-registry-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH =
  `${VERTICAL_AI_CERTIFICATION_RUNTIME_V1_DIR}/runtime-functional-evidence-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPRODUCIBILITY_PATH =
  `${VERTICAL_AI_CERTIFICATION_RUNTIME_V1_DIR}/runtime-reproducibility-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_CONTRACTS_PATH =
  `${VERTICAL_AI_CERTIFICATION_RUNTIME_V1_DIR}/runtime-contracts-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPORT.json' as const;

const IMPLEMENTATION_FRAMEWORK_NAME =
  'Evidence-Bound Vertical AI Certification Runtime Implementation V1' as const;
const RUNTIME_ID = 'vertical_ai_certification_runtime' as const;

export const VAICR_CONTRACT_IDS = [
  'VAICR_FOUNDATION_VERIFIED',
  'VAICR_COMPONENTS_IMPLEMENTED',
  'VAICR_STABLE_RUNTIME_API',
  'VAICR_MODULES_REPLACEABLE',
  'VAICR_FUNCTIONAL_VERIFICATION',
  'VAICR_REPRODUCIBLE',
  'VAICR_DETERMINISTIC',
  'VAICR_EVIDENCE_TO_CERTIFICATION_OPERATIONAL',
  'VAICR_CERTIFIED_EVIDENCE_FROZEN',
  'VAICR_CERTIFIED_CERTIFICATION_OPERATIONAL',
  'VAICR_REPOSITORY_FIRST',
  'VAICR_EVIDENCE_FIRST',
  'VAICR_REUSE_BEFORE_CREATE',
  'VAICR_HUMAN_APPROVAL_BEFORE_REPO_MUTATION',
  'VAICR_READ_ONLY',
  'VAICR_REFERENCE_ONLY',
  'VAICR_NO_SOURCE_DATA_OWNERSHIP',
  'VAICR_NO_PLATFORM_CORE_MUTATION',
  'VAICR_NO_CIL_MUTATION',
  'VAICR_FOUNDATION_UNCHANGED',
  'VAICR_READY_FOR_IMPROVEMENT_FOUNDATION',
  'VAICR_RUNTIME_IMPLEMENTED',
] as const;

const REQUIRED_IMPLEMENTATION_COMPONENTS = [...CERTIFICATION_RUNTIME_COMPONENT_IDS] as const;

const IMPLEMENTATION_PRINCIPLES = {
  implementation_only: true,
  follows_foundation: true,
  architecture_redesign: false,
  certification_runtime_is_only_public_interface: true,
  internal_modules_replaceable: true,
  read_only: true,
  reference_only: true,
  repository_first: true,
  evidence_first: true,
  reuse_before_create: true,
  evidence_to_certification_operational: true,
  human_approval_required_before_repository_mutation: true,
  owns_source_data: false,
  platform_core_mutation: false,
  cil_mutation: false,
  write_authorized: false,
  versioned: true,
} as const;

const EXECUTION_FLAGS = { ...IMPLEMENTATION_PRINCIPLES, execute_authorized: false as const };

const PROTECTED_BRAIN_BASELINE_PATHS = [
  PROJECT_BRAIN_LPM_V1_PATH,
  PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH,
  PROJECT_BRAIN_COMPLETE_V1_PATH,
  PROJECT_BRAIN_FINAL_CERTIFICATION_V1_PATH,
  PROJECT_BRAIN_MASTER_CAPABILITY_REGISTRATION_V1_PATH,
  PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
  VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PATH,
] as const;

const PROTECTED_BUNDLE_BASELINE_PATHS = [
  REPOSITORY_INTELLIGENCE_BUNDLE_V1_PATH,
  REPOSITORY_INTELLIGENCE_BUNDLE_V1_VERSION_PATH,
  REPOSITORY_INTELLIGENCE_BUNDLE_V1_REGISTRY_PATH,
  REPOSITORY_INTELLIGENCE_BUNDLE_V1_EXPORT_PATH,
  REPOSITORY_INTELLIGENCE_BUNDLE_PRODUCTION_CERTIFICATION_V1_PATH,
  REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
] as const;

const PROTECTED_ACCESS_BASELINE_PATHS = [
  REPOSITORY_INTELLIGENCE_ACCESS_CONTRACT_V1_PATH,
  REPOSITORY_INTELLIGENCE_ACCESS_API_V1_PATH,
  REPOSITORY_INTELLIGENCE_ACCESS_V1_PATH,
  REPOSITORY_INTELLIGENCE_ACCESS_PRODUCTION_CERTIFICATION_V1_PATH,
  REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
] as const;

const PROTECTED_RUNTIME_BASELINE_PATHS = [
  AGENT_RUNTIME_V1_PATH,
  AGENT_RUNTIME_PRODUCTION_CERTIFICATION_V1_PATH,
  AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
] as const;

const PROTECTED_CIL_PATHS = [
  CONSUMER_CONNECTOR_CONTRACT_V1_PATH,
  CONNECTOR_CONTRACT_REGISTRY_V1_PATH,
  CONSUMER_PROFILE_V1_PATH,
  RUNTIME_CONNECTOR_V1_PATH,
  COMPATIBILITY_MODEL_V1_PATH,
  CONSUMER_INTEGRATION_PRODUCTION_CERTIFICATION_V1_PATH,
  CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
] as const;

const PROTECTED_CONNECTOR_PATHS = [
  CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
] as const;

const PROTECTED_FOUNDATION_PATHS = [
  VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
  VERTICAL_AI_CERTIFICATION_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_CERTIFICATION_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_CERTIFICATION_WORKFLOW_V1_PATH,
  VERTICAL_AI_CERTIFICATION_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_CERTIFICATION_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_CERTIFICATION_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_CERTIFICATION_TRACEABILITY_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RULES_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_REF_V1_PATH,
  VERTICAL_AI_CERTIFICATION_CONTRACTS_V1_PATH,
  VERTICAL_AI_CERTIFICATION_REGISTRY_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_EXPORT_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_VERSION_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_REGISTRY_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_REPRODUCIBILITY_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_CONTRACTS_PATH,
] as const;

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T | null {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function pathExists(root: string, rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function captureBaselineMtimes(root: string, paths: readonly string[]): Record<string, number> {
  return Object.fromEntries(
    paths.map((rel) => {
      const abs = path.join(root, rel);
      return [rel, fs.existsSync(abs) ? fs.statSync(abs).mtimeMs : 0];
    })
  );
}

function verifyBaselinePreserved(
  root: string,
  before: Record<string, number>,
  paths: readonly string[]
): { preserved: boolean; drift: string[] } {
  const drift: string[] = [];
  for (const rel of paths) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      drift.push(`${rel}=missing`);
      continue;
    }
    const after = fs.statSync(abs).mtimeMs;
    if (after !== before[rel]) {
      drift.push(`${rel}=${before[rel]}->${after}`);
    }
  }
  return { preserved: drift.length === 0, drift };
}

function phaseReportPassed(root: string, reportPath: string, passVerdict: string): boolean {
  if (!pathExists(root, reportPath)) return false;
  const report = readJson<Record<string, unknown>>(root, reportPath);
  if (!report) return false;
  if (report.final_verdict !== passVerdict) return false;
  return (
    report.validation_passed === true ||
    Object.entries(report).some(
      ([key, value]) => key.endsWith('_passed') && key !== 'validation_passed' && value === true
    )
  );
}

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

function validateImplementationContracts(input: Record<string, boolean>) {
  const map: Array<[string, string]> = [
    ['VAICR_FOUNDATION_VERIFIED', 'foundationVerified'],
    ['VAICR_COMPONENTS_IMPLEMENTED', 'componentsImplemented'],
    ['VAICR_STABLE_RUNTIME_API', 'stableRuntimeApi'],
    ['VAICR_MODULES_REPLACEABLE', 'modulesReplaceable'],
    ['VAICR_FUNCTIONAL_VERIFICATION', 'functionalVerification'],
    ['VAICR_REPRODUCIBLE', 'reproducible'],
    ['VAICR_DETERMINISTIC', 'deterministic'],
    ['VAICR_EVIDENCE_TO_CERTIFICATION_OPERATIONAL', 'evidenceToCertificationOperational'],
    ['VAICR_CERTIFIED_EVIDENCE_FROZEN', 'certifiedEvidenceFrozen'],
    ['VAICR_CERTIFIED_CERTIFICATION_OPERATIONAL', 'certifiedCertificationOperational'],
    ['VAICR_REPOSITORY_FIRST', 'repositoryFirst'],
    ['VAICR_EVIDENCE_FIRST', 'evidenceFirst'],
    ['VAICR_REUSE_BEFORE_CREATE', 'reuseBeforeCreate'],
    ['VAICR_HUMAN_APPROVAL_BEFORE_REPO_MUTATION', 'humanApprovalBeforeRepoMutation'],
    ['VAICR_READ_ONLY', 'readOnly'],
    ['VAICR_REFERENCE_ONLY', 'referenceOnly'],
    ['VAICR_NO_SOURCE_DATA_OWNERSHIP', 'noSourceDataOwnership'],
    ['VAICR_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAICR_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAICR_FOUNDATION_UNCHANGED', 'foundationUnchanged'],
    ['VAICR_READY_FOR_IMPROVEMENT_FOUNDATION', 'readyForImprovementFoundation'],
    ['VAICR_RUNTIME_IMPLEMENTED', 'runtimeImplemented'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return {
    contract_ids: [...VAICR_CONTRACT_IDS],
    results,
    aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const),
  };
}

export function writeVerticalAiCertificationRuntimeV1EngineReport(): {
  passed: boolean;
  verdict: string;
  reportPath: string;
} {
  const root = resolveProjectRoot();
  const generatedAt = new Date().toISOString();
  const issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }> = [];

  const brainBaselineBefore = captureBaselineMtimes(root, PROTECTED_BRAIN_BASELINE_PATHS);
  const bundleBaselineBefore = captureBaselineMtimes(root, PROTECTED_BUNDLE_BASELINE_PATHS);
  const accessBaselineBefore = captureBaselineMtimes(root, PROTECTED_ACCESS_BASELINE_PATHS);
  const runtimeBaselineBefore = captureBaselineMtimes(root, PROTECTED_RUNTIME_BASELINE_PATHS);
  const cilBaselineBefore = captureBaselineMtimes(root, PROTECTED_CIL_PATHS);
  const connectorBaselineBefore = captureBaselineMtimes(root, PROTECTED_CONNECTOR_PATHS);
  const foundationBaselineBefore = captureBaselineMtimes(root, PROTECTED_FOUNDATION_PATHS);

  const foundationVerified = phaseReportPassed(
    root,
    VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_REPORT_PATH,
    VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PASS_VERDICT
  );
  if (!foundationVerified) {
    issues.push({
      code: 'FOUNDATION_PRECHECK_FAILED',
      message: `Precheck requires ${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const foundationManifest = readJson<{
    foundation_ready?: boolean;
    ready_for_certification_runtime?: boolean;
    design_fingerprint?: string;
  }>(root, VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH);
  if (foundationManifest?.foundation_ready !== true) {
    issues.push({
      code: 'FOUNDATION_NOT_READY',
      message: 'Certification foundation must be ready before runtime implementation',
      severity: 'error',
    });
  }

  const goalTruth = loadCurrentGoalTruth(root);
  const allGoalsSatisfied = goalTruth.satisfied_goals === goalTruth.evaluated_goals;
  if (!allGoalsSatisfied) {
    issues.push({
      code: 'GOAL_TRUTH',
      message: 'All Current Goal Truth entries must be satisfied for certification runtime',
      severity: 'error',
    });
  }

  const api = createCertificationRuntimeApi(root);
  const registry = createCertificationRuntimeRegistry();
  const runtimeExport = exportCertificationRuntime(api, registry);
  const iface = api.describeInterface();

  const run1 = api.certify('vai010-smoke');
  const run2 = api.certify('vai010-smoke');
  const reproducible =
    run1.reproducible && run2.reproducible && run1.result_fingerprint === run2.result_fingerprint;
  const deterministic =
    run1.deterministic &&
    run1.dispatch.dispatch_fingerprint === run2.dispatch.dispatch_fingerprint;

  const mutationGate = api.requestRepositoryMutation('create_file');
  const humanApprovalBeforeRepoMutation =
    mutationGate.authorized === false &&
    mutationGate.requires_human_approval === true &&
    iface.human_approval_required_before_repository_mutation === true &&
    iface.write_authorized === false;

  const injectedApi = createCertificationRuntimeApi(root, {
    createCache: () => createCertificationCache(),
  });
  const injectedRun = injectedApi.certify('vai010-replaceability');
  const modulesReplaceable = injectedRun.result_fingerprint === run1.result_fingerprint;

  const evidenceToCertificationOperational =
    run1.evidence.evidence_precedes_certification === true &&
    run1.traceability.evidence_to_certification === true &&
    run1.evidence.evidence_items.length > 0;

  const certifiedEvidenceFrozen =
    run1.certified_evidence_frozen === true &&
    run1.record.certified_evidence_frozen === true &&
    run1.result_integrity.intact === true;

  const certifiedCertificationOperational =
    run1.certified_certification_operational === true &&
    run1.certification_validation.valid === true &&
    run1.contract_conformance.conforms === true &&
    run1.boundary_integrity.intact === true &&
    run1.runtime_integrity.intact === true;

  const repositoryFirst = run1.repository_first === true;
  const evidenceFirst = run1.evidence_first === true && iface.evidence_first === true;
  const reuseBeforeCreate = run1.reuse_before_create === true;

  const functionalVerification =
    reproducible &&
    deterministic &&
    evidenceToCertificationOperational &&
    certifiedEvidenceFrozen &&
    certifiedCertificationOperational &&
    repositoryFirst &&
    evidenceFirst &&
    reuseBeforeCreate &&
    humanApprovalBeforeRepoMutation &&
    modulesReplaceable &&
    run1.read_only === true &&
    run1.reference_only === true &&
    run1.dispatch.enacted === false &&
    run1.write_authorized === false &&
    run1.record.repository_mutated === false;

  if (!functionalVerification) {
    issues.push({
      code: 'FUNCTIONAL_VERIFICATION_FAILED',
      message: 'Certification Runtime failed functional smoke checks',
      severity: 'error',
    });
  }

  const componentsImplemented =
    runtimeExport.component_ids.length === REQUIRED_IMPLEMENTATION_COMPONENTS.length &&
    REQUIRED_IMPLEMENTATION_COMPONENTS.every((id) => runtimeExport.component_ids.includes(id));

  const stableRuntimeApi =
    iface.version === VERTICAL_AI_CERTIFICATION_RUNTIME_V1_SEMVER &&
    iface.public_surface === 'certification_runtime' &&
    iface.read_only === true &&
    iface.reference_only === true &&
    typeof api.certify === 'function' &&
    typeof api.requestRepositoryMutation === 'function' &&
    typeof api.describeInterface === 'function';

  writeJson(root, VERTICAL_AI_CERTIFICATION_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH, {
    runtime_functional_evidence_v1_id: 'certification_runtime_functional_evidence_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    run_1_result_fingerprint: run1.result_fingerprint,
    run_2_result_fingerprint: run2.result_fingerprint,
    injected_run_result_fingerprint: injectedRun.result_fingerprint,
    dispatch_fingerprint: run1.dispatch.dispatch_fingerprint,
    validation_fingerprint: run1.validation_fingerprint,
    validation_dispatch_fingerprint: run1.validation_dispatch_fingerprint,
    record_fingerprint: run1.record.record_fingerprint,
    certification_validation_valid: run1.certification_validation.valid,
    contract_conforms: run1.contract_conformance.conforms,
    result_integrity_intact: run1.result_integrity.intact,
    boundary_intact: run1.boundary_integrity.intact,
    runtime_integrity_intact: run1.runtime_integrity.intact,
    evidence_fingerprint: run1.evidence.evidence_fingerprint,
    trace_fingerprint: run1.traceability.trace_fingerprint,
    mutation_gate: mutationGate,
    reproducible,
    deterministic,
    modules_replaceable: modulesReplaceable,
    evidence_to_certification_operational: evidenceToCertificationOperational,
    certified_evidence_frozen: certifiedEvidenceFrozen,
    certified_certification_operational: certifiedCertificationOperational,
    repository_first: repositoryFirst,
    evidence_first: evidenceFirst,
    reuse_before_create: reuseBeforeCreate,
    human_approval_before_repo_mutation: humanApprovalBeforeRepoMutation,
    functional_verification: functionalVerification,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPRODUCIBILITY_PATH, {
    runtime_reproducibility_v1_id: 'certification_runtime_reproducibility_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
    reproducible,
    deterministic,
    result_fingerprint: run1.result_fingerprint,
    dispatch_fingerprint: run1.dispatch.dispatch_fingerprint,
    record_fingerprint: run1.record.record_fingerprint,
    run_1_result_fingerprint: run1.result_fingerprint,
    run_2_result_fingerprint: run2.result_fingerprint,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_RUNTIME_V1_EXPORT_PATH, {
    ...runtimeExport,
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_RUNTIME_V1_VERSION_PATH, {
    runtime_version_v1_id: 'certification_runtime_version_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
    runtime_version: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_SEMVER,
    consumes_foundation: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
    consumes_validation_runtime: VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REGISTRY_PATH, {
    ...registry,
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
    export_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_EXPORT_PATH,
    foundation_ref: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
  });

  const brainBaselineAfter = verifyBaselinePreserved(root, brainBaselineBefore, PROTECTED_BRAIN_BASELINE_PATHS);
  const bundleBaselineAfter = verifyBaselinePreserved(
    root,
    bundleBaselineBefore,
    PROTECTED_BUNDLE_BASELINE_PATHS
  );
  const accessBaselineAfter = verifyBaselinePreserved(
    root,
    accessBaselineBefore,
    PROTECTED_ACCESS_BASELINE_PATHS
  );
  const runtimeBaselineAfter = verifyBaselinePreserved(
    root,
    runtimeBaselineBefore,
    PROTECTED_RUNTIME_BASELINE_PATHS
  );
  const cilBaselineAfter = verifyBaselinePreserved(root, cilBaselineBefore, PROTECTED_CIL_PATHS);
  const connectorBaselineAfter = verifyBaselinePreserved(
    root,
    connectorBaselineBefore,
    PROTECTED_CONNECTOR_PATHS
  );
  const foundationBaselineAfter = verifyBaselinePreserved(
    root,
    foundationBaselineBefore,
    PROTECTED_FOUNDATION_PATHS
  );

  const baselineChecks: Array<[string, { preserved: boolean; drift: string[] }, string]> = [
    ['BRAIN_BASELINE_MUTATION', brainBaselineAfter, 'Project Brain baseline changed'],
    ['BUNDLE_BASELINE_MUTATION', bundleBaselineAfter, 'RIB baseline changed'],
    ['ACCESS_BASELINE_MUTATION', accessBaselineAfter, 'Access Layer baseline changed'],
    ['RUNTIME_BASELINE_MUTATION', runtimeBaselineAfter, 'Agent Runtime baseline changed'],
    ['CIL_BASELINE_MUTATION', cilBaselineAfter, 'CIL baseline changed'],
    ['CONNECTOR_BASELINE_MUTATION', connectorBaselineAfter, 'Certified connector baseline changed'],
    ['FOUNDATION_BASELINE_MUTATION', foundationBaselineAfter, 'Certification foundation baseline changed'],
  ];
  for (const [code, result, message] of baselineChecks) {
    if (!result.preserved) {
      for (const drift of result.drift) {
        issues.push({ code, message: `${message}: ${drift}`, severity: 'error' });
      }
    }
  }

  const noPlatformCoreMutation =
    brainBaselineAfter.preserved &&
    bundleBaselineAfter.preserved &&
    accessBaselineAfter.preserved &&
    runtimeBaselineAfter.preserved;
  const noCilMutation = cilBaselineAfter.preserved;
  const foundationUnchanged = foundationBaselineAfter.preserved;

  const designFingerprint = foundationManifest?.design_fingerprint ?? null;
  const implementationFingerprint = stableFingerprint({
    components: CERTIFICATION_RUNTIME_COMPONENT_IDS,
    principles: IMPLEMENTATION_PRINCIPLES,
    result: run1.result_fingerprint,
    version: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_SEMVER,
  });
  const decisionFingerprint = stableFingerprint({
    goalTruth: goalTruth.fingerprint,
    designFingerprint,
    implementationFingerprint,
    result: run1.result_fingerprint,
    dispatch: run1.dispatch.dispatch_fingerprint,
    record: run1.record.record_fingerprint,
    reproducible,
    deterministic,
  });

  const readyForImprovementFoundation =
    foundationVerified &&
    foundationManifest?.ready_for_certification_runtime === true &&
    functionalVerification &&
    noPlatformCoreMutation &&
    noCilMutation &&
    foundationUnchanged &&
    connectorBaselineAfter.preserved;

  const runtimeImplemented =
    foundationVerified &&
    componentsImplemented &&
    stableRuntimeApi &&
    functionalVerification &&
    readyForImprovementFoundation &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const contractValidation = validateImplementationContracts({
    foundationVerified,
    componentsImplemented,
    stableRuntimeApi,
    modulesReplaceable,
    functionalVerification,
    reproducible,
    deterministic,
    evidenceToCertificationOperational,
    certifiedEvidenceFrozen,
    certifiedCertificationOperational,
    repositoryFirst,
    evidenceFirst,
    reuseBeforeCreate,
    humanApprovalBeforeRepoMutation,
    readOnly: iface.read_only === true && IMPLEMENTATION_PRINCIPLES.read_only === true,
    referenceOnly: iface.reference_only === true && IMPLEMENTATION_PRINCIPLES.reference_only === true,
    noSourceDataOwnership: IMPLEMENTATION_PRINCIPLES.owns_source_data === false,
    noPlatformCoreMutation,
    noCilMutation,
    foundationUnchanged,
    readyForImprovementFoundation,
    runtimeImplemented,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'RUNTIME_CONTRACT_FAILURE',
      message: 'One or more Certification Runtime contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_CERTIFICATION_RUNTIME_V1_CONTRACTS_PATH, {
    runtime_contracts_v1_id: 'certification_runtime_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
    contract_ids: [...VAICR_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: IMPLEMENTATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH, {
    vertical_ai_certification_runtime_v1_id: 'vertical_ai_certification_runtime_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PHASE,
    system_id: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    framework_name: IMPLEMENTATION_FRAMEWORK_NAME,
    runtime_id: RUNTIME_ID,
    runtime_version: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_SEMVER,
    decision_fingerprint: decisionFingerprint,
    implementation_fingerprint: implementationFingerprint,
    design_fingerprint: designFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    result_fingerprint: run1.result_fingerprint,
    dispatch_fingerprint: run1.dispatch.dispatch_fingerprint,
    validation_fingerprint: run1.validation_fingerprint,
    record_fingerprint: run1.record.record_fingerprint,
    implementation_only: true,
    design_only: false,
    runtime_implemented: runtimeImplemented,
    ready_for_improvement_foundation: readyForImprovementFoundation,
    certification_reproducible: reproducible,
    deterministic,
    evidence_to_certification_operational: evidenceToCertificationOperational,
    certified_evidence_frozen: certifiedEvidenceFrozen,
    certified_certification_operational: certifiedCertificationOperational,
    components: [...CERTIFICATION_RUNTIME_COMPONENT_IDS],
    foundation_ref: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
    validation_runtime_ref: VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
    export_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_EXPORT_PATH,
    registry_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REGISTRY_PATH,
    version_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_VERSION_PATH,
    functional_evidence_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH,
    reproducibility_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPRODUCIBILITY_PATH,
    contracts_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_CONTRACTS_PATH,
    principles: IMPLEMENTATION_PRINCIPLES,
    platform_core_mutation: false,
    cil_mutation: false,
    write_authorized: false,
    execute_authorized: false,
  });

  const passed =
    runtimeImplemented &&
    contractValidation.aggregate_verdict === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verdict = passed
    ? VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PASS_VERDICT
    : VERTICAL_AI_CERTIFICATION_RUNTIME_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_certification_runtime_v1_${Date.now()}`,
    phase: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PHASE,
    system_id: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Implement Vertical AI Certification Runtime as a read-only, evidence-first, repository-first certifier with frozen certified evidence and human approval before repository mutation.',
    vertical_ai_certification_runtime_v1_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_CERTIFICATION_RUNTIME_V1_STATUS
      : 'VERTICAL_AI_CERTIFICATION_RUNTIME_NOT_READY',
    validation_passed: passed,
    implementation_only: true,
    framework_name: IMPLEMENTATION_FRAMEWORK_NAME,
    runtime_id: RUNTIME_ID,
    decision_fingerprint: decisionFingerprint,
    implementation_fingerprint: implementationFingerprint,
    design_fingerprint: designFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    result_fingerprint: run1.result_fingerprint,
    dispatch_fingerprint: run1.dispatch.dispatch_fingerprint,
    validation_fingerprint: run1.validation_fingerprint,
    record_fingerprint: run1.record.record_fingerprint,
    certification_reproducible: reproducible,
    deterministic,
    evidence_to_certification_operational: evidenceToCertificationOperational,
    certified_evidence_frozen: certifiedEvidenceFrozen,
    certified_certification_operational: certifiedCertificationOperational,
    ready_for_improvement_foundation: readyForImprovementFoundation,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    foundation_unchanged: foundationUnchanged,
    connector_baseline_preserved: connectorBaselineAfter.preserved,
    components: [...CERTIFICATION_RUNTIME_COMPONENT_IDS],
    contract_validation: contractValidation,
    runtime_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH,
    export_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_EXPORT_PATH,
    registry_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REGISTRY_PATH,
    functional_evidence_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH,
    reproducibility_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPRODUCIBILITY_PATH,
    contracts_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_CONTRACTS_PATH,
    foundation_ref: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
    validation_runtime_ref: VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
    checks: {
      FOUNDATION_VERIFIED: foundationVerified,
      COMPONENTS_IMPLEMENTED: componentsImplemented,
      STABLE_RUNTIME_API: stableRuntimeApi,
      MODULES_REPLACEABLE: modulesReplaceable,
      FUNCTIONAL_VERIFICATION: functionalVerification,
      REPRODUCIBLE: reproducible,
      DETERMINISTIC: deterministic,
      EVIDENCE_TO_CERTIFICATION_OPERATIONAL: evidenceToCertificationOperational,
      CERTIFIED_EVIDENCE_FROZEN: certifiedEvidenceFrozen,
      CERTIFIED_CERTIFICATION_OPERATIONAL: certifiedCertificationOperational,
      REPOSITORY_FIRST: repositoryFirst,
      EVIDENCE_FIRST: evidenceFirst,
      REUSE_BEFORE_CREATE: reuseBeforeCreate,
      HUMAN_APPROVAL_BEFORE_REPO_MUTATION: humanApprovalBeforeRepoMutation,
      READ_ONLY: iface.read_only === true,
      REFERENCE_ONLY: iface.reference_only === true,
      PLATFORM_CORE_UNCHANGED: noPlatformCoreMutation,
      CIL_UNCHANGED: noCilMutation,
      FOUNDATION_UNCHANGED: foundationUnchanged,
      READY_FOR_IMPROVEMENT_FOUNDATION: readyForImprovementFoundation,
      RUNTIME_IMPLEMENTED: runtimeImplemented,
      CONTRACT_VALIDATION: contractValidation.aggregate_verdict === 'PASS',
      GOAL_TRUTH_SATISFIED: allGoalsSatisfied,
      WRITE_AUTHORIZED: false,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPORT_PATH,
  };
}
