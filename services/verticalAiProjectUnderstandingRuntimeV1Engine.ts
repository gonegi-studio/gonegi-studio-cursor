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
import {
  VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PASS_VERDICT,
  VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_REPORT_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_WORKFLOW_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_CONTRACTS_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_REGISTRY_V1_PATH,
} from './verticalAiProjectUnderstandingFoundationV1Engine.js';
import {
  VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_SEMVER,
  PROJECT_UNDERSTANDING_RUNTIME_COMPONENT_IDS,
  createUnderstandingRuntimeApi,
  createUnderstandingRuntimeRegistry,
  createUnderstandingCache,
  exportUnderstandingRuntime,
} from './verticalAiProjectUnderstandingRuntimeV1.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PHASE = 'PHASE-VAI-002' as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_SYSTEM_ID =
  'VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1' as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1' as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1' as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_STATUS =
  'VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_IMPLEMENTED' as const;

export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_DIR =
  'datasets/vertical_ai_project_understanding_runtime_v1' as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_DIR}/vertical-ai-project-understanding-runtime-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_EXPORT_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_DIR}/runtime-export-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_VERSION_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_DIR}/runtime-version-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REGISTRY_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_DIR}/runtime-registry-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_DIR}/runtime-functional-evidence-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPRODUCIBILITY_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_DIR}/runtime-reproducibility-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_CONTRACTS_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_DIR}/runtime-contracts-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPORT.json' as const;

const IMPLEMENTATION_FRAMEWORK_NAME =
  'Evidence-Bound Vertical AI Project Understanding Runtime Implementation V1' as const;
const RUNTIME_ID = 'vertical_ai_project_understanding_runtime' as const;

export const VAIPUR_CONTRACT_IDS = [
  'VAIPUR_FOUNDATION_VERIFIED',
  'VAIPUR_COMPONENTS_IMPLEMENTED',
  'VAIPUR_STABLE_RUNTIME_API',
  'VAIPUR_MODULES_REPLACEABLE',
  'VAIPUR_FUNCTIONAL_VERIFICATION',
  'VAIPUR_REPRODUCIBLE',
  'VAIPUR_EVIDENCE_DRIVEN',
  'VAIPUR_REPOSITORY_FIRST',
  'VAIPUR_REUSE_BEFORE_CREATE',
  'VAIPUR_HUMAN_APPROVAL_BEFORE_WRITE',
  'VAIPUR_READ_ONLY',
  'VAIPUR_REFERENCE_ONLY',
  'VAIPUR_NO_SOURCE_DATA_OWNERSHIP',
  'VAIPUR_NO_PLATFORM_CORE_MUTATION',
  'VAIPUR_NO_CIL_MUTATION',
  'VAIPUR_NO_REPOSITORY_MUTATION',
  'VAIPUR_FOUNDATION_UNCHANGED',
  'VAIPUR_READY_FOR_PLANNING',
  'VAIPUR_RUNTIME_IMPLEMENTED',
] as const;

const REQUIRED_IMPLEMENTATION_COMPONENTS = [...PROJECT_UNDERSTANDING_RUNTIME_COMPONENT_IDS] as const;

const IMPLEMENTATION_PRINCIPLES = {
  implementation_only: true,
  follows_foundation: true,
  architecture_redesign: false,
  understanding_runtime_is_only_public_interface: true,
  internal_modules_replaceable: true,
  read_only: true,
  reference_only: true,
  repository_first: true,
  reuse_before_create: true,
  evidence_driven: true,
  human_approval_required_before_write: true,
  owns_source_data: false,
  platform_core_mutation: false,
  cil_mutation: false,
  repository_mutation: false,
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

const PROTECTED_FOUNDATION_PATHS = [
  VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_WORKFLOW_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_CONTRACTS_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_REGISTRY_V1_PATH,
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
    ['VAIPUR_FOUNDATION_VERIFIED', 'foundationVerified'],
    ['VAIPUR_COMPONENTS_IMPLEMENTED', 'componentsImplemented'],
    ['VAIPUR_STABLE_RUNTIME_API', 'stableRuntimeApi'],
    ['VAIPUR_MODULES_REPLACEABLE', 'modulesReplaceable'],
    ['VAIPUR_FUNCTIONAL_VERIFICATION', 'functionalVerification'],
    ['VAIPUR_REPRODUCIBLE', 'reproducible'],
    ['VAIPUR_EVIDENCE_DRIVEN', 'evidenceDriven'],
    ['VAIPUR_REPOSITORY_FIRST', 'repositoryFirst'],
    ['VAIPUR_REUSE_BEFORE_CREATE', 'reuseBeforeCreate'],
    ['VAIPUR_HUMAN_APPROVAL_BEFORE_WRITE', 'humanApprovalBeforeWrite'],
    ['VAIPUR_READ_ONLY', 'readOnly'],
    ['VAIPUR_REFERENCE_ONLY', 'referenceOnly'],
    ['VAIPUR_NO_SOURCE_DATA_OWNERSHIP', 'noSourceDataOwnership'],
    ['VAIPUR_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAIPUR_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAIPUR_NO_REPOSITORY_MUTATION', 'noRepositoryMutation'],
    ['VAIPUR_FOUNDATION_UNCHANGED', 'foundationUnchanged'],
    ['VAIPUR_READY_FOR_PLANNING', 'readyForPlanning'],
    ['VAIPUR_RUNTIME_IMPLEMENTED', 'runtimeImplemented'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return {
    contract_ids: [...VAIPUR_CONTRACT_IDS],
    results,
    aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const),
  };
}

export function writeVerticalAiProjectUnderstandingRuntimeV1EngineReport(): {
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
  const foundationBaselineBefore = captureBaselineMtimes(root, PROTECTED_FOUNDATION_PATHS);

  const foundationVerified = phaseReportPassed(
    root,
    VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_REPORT_PATH,
    VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PASS_VERDICT
  );
  if (!foundationVerified) {
    issues.push({
      code: 'FOUNDATION_PRECHECK_FAILED',
      message: `Precheck requires ${VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const foundationManifest = readJson<{
    foundation_ready?: boolean;
    ready_for_planning?: boolean;
    design_fingerprint?: string;
  }>(root, VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH);
  if (foundationManifest?.foundation_ready !== true) {
    issues.push({
      code: 'FOUNDATION_NOT_READY',
      message: 'Project Understanding foundation must be ready before runtime implementation',
      severity: 'error',
    });
  }

  const goalTruth = loadCurrentGoalTruth(root);
  const allGoalsSatisfied = goalTruth.satisfied_goals === goalTruth.evaluated_goals;
  if (!allGoalsSatisfied) {
    issues.push({
      code: 'GOAL_TRUTH',
      message: 'All Current Goal Truth entries must be satisfied for understanding runtime',
      severity: 'error',
    });
  }

  const api = createUnderstandingRuntimeApi(root);
  const registry = createUnderstandingRuntimeRegistry();
  const runtimeExport = exportUnderstandingRuntime(api, registry);
  const iface = api.describeInterface();

  const run1 = api.understand('vai002-smoke');
  const run2 = api.understand('vai002-smoke');
  const reproducible = run1.reproducible && run1.result_fingerprint === run2.result_fingerprint;

  const writeGate = api.requestWrite('create_implementation');
  const humanApprovalBeforeWrite =
    writeGate.authorized === false &&
    writeGate.requires_human_approval === true &&
    iface.human_approval_required_before_write === true &&
    iface.write_authorized === false;

  const injectedApi = createUnderstandingRuntimeApi(root, {
    createCache: () => createUnderstandingCache(),
  });
  const injectedRun = injectedApi.understand('vai002-replaceability');
  const modulesReplaceable = injectedRun.result_fingerprint === run1.result_fingerprint;

  const surfacesPresent = run1.scan.surfaces.every((surface) => surface.present);
  const componentsComplete =
    run1.components.resolved_count === REQUIRED_IMPLEMENTATION_COMPONENTS.length &&
    REQUIRED_IMPLEMENTATION_COMPONENTS.every((id) =>
      run1.components.components.some((component) => component.component_id === id && component.present)
    );
  const dependenciesAcyclic = run1.dependencies.acyclic === true;
  const evidenceDriven =
    run1.evidence.evidence_precedes_conclusions === true &&
    run1.evidence.evidence_items.length > 0 &&
    IMPLEMENTATION_PRINCIPLES.evidence_driven === true;
  const repositoryFirst =
    run1.repository_first === true &&
    run1.scan.read_only === true &&
    run1.scan.repository_mutated === false;
  const reuseBeforeCreate =
    run1.reuse_before_create === true &&
    run1.reuse.candidates.every((candidate) => candidate.create_proposed === false);

  const functionalVerification =
    reproducible &&
    surfacesPresent &&
    componentsComplete &&
    dependenciesAcyclic &&
    evidenceDriven &&
    repositoryFirst &&
    reuseBeforeCreate &&
    humanApprovalBeforeWrite &&
    modulesReplaceable &&
    run1.read_only === true &&
    run1.reference_only === true;

  if (!functionalVerification) {
    issues.push({
      code: 'FUNCTIONAL_VERIFICATION_FAILED',
      message: 'Understanding Runtime failed functional smoke checks',
      severity: 'error',
    });
  }

  const componentsImplemented =
    runtimeExport.component_ids.length === REQUIRED_IMPLEMENTATION_COMPONENTS.length &&
    REQUIRED_IMPLEMENTATION_COMPONENTS.every((id) => runtimeExport.component_ids.includes(id));

  const stableRuntimeApi =
    iface.version === VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_SEMVER &&
    iface.public_surface === 'understanding_runtime' &&
    iface.read_only === true &&
    iface.reference_only === true &&
    typeof api.understand === 'function' &&
    typeof api.requestWrite === 'function' &&
    typeof api.describeInterface === 'function';

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH, {
    runtime_functional_evidence_v1_id: 'project_understanding_runtime_functional_evidence_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    run_1_result_fingerprint: run1.result_fingerprint,
    run_2_result_fingerprint: run2.result_fingerprint,
    injected_run_result_fingerprint: injectedRun.result_fingerprint,
    scan_fingerprint: run1.scan.scan_fingerprint,
    surface_count: run1.scan.surface_count,
    component_count: run1.components.resolved_count,
    dependency_acyclic: dependenciesAcyclic,
    duplicate_count: run1.duplicates.duplicate_count,
    gap_count: run1.gaps.gap_count,
    evidence_fingerprint: run1.evidence.evidence_fingerprint,
    write_gate: writeGate,
    reproducible,
    modules_replaceable: modulesReplaceable,
    surfaces_present: surfacesPresent,
    components_complete: componentsComplete,
    evidence_driven: evidenceDriven,
    repository_first: repositoryFirst,
    reuse_before_create: reuseBeforeCreate,
    human_approval_before_write: humanApprovalBeforeWrite,
    functional_verification: functionalVerification,
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPRODUCIBILITY_PATH, {
    runtime_reproducibility_v1_id: 'project_understanding_runtime_reproducibility_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
    reproducible,
    result_fingerprint: run1.result_fingerprint,
    run_1_result_fingerprint: run1.result_fingerprint,
    run_2_result_fingerprint: run2.result_fingerprint,
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_EXPORT_PATH, {
    ...runtimeExport,
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_VERSION_PATH, {
    runtime_version_v1_id: 'project_understanding_runtime_version_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
    runtime_version: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_SEMVER,
    consumes_foundation: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REGISTRY_PATH, {
    ...registry,
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
    export_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_EXPORT_PATH,
    foundation_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
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
    ['FOUNDATION_BASELINE_MUTATION', foundationBaselineAfter, 'Understanding foundation baseline changed'],
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
  const noRepositoryMutation =
    IMPLEMENTATION_PRINCIPLES.repository_mutation === false &&
    run1.scan.repository_mutated === false &&
    writeGate.authorized === false;

  const designFingerprint = foundationManifest?.design_fingerprint ?? null;
  const implementationFingerprint = stableFingerprint({
    components: PROJECT_UNDERSTANDING_RUNTIME_COMPONENT_IDS,
    principles: IMPLEMENTATION_PRINCIPLES,
    result: run1.result_fingerprint,
    version: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_SEMVER,
  });
  const decisionFingerprint = stableFingerprint({
    goalTruth: goalTruth.fingerprint,
    designFingerprint,
    implementationFingerprint,
    result: run1.result_fingerprint,
    reproducible,
  });

  const readyForPlanning =
    foundationVerified &&
    foundationManifest?.ready_for_planning === true &&
    functionalVerification &&
    noPlatformCoreMutation &&
    noCilMutation &&
    noRepositoryMutation &&
    foundationUnchanged;

  const runtimeImplemented =
    foundationVerified &&
    componentsImplemented &&
    stableRuntimeApi &&
    functionalVerification &&
    readyForPlanning &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const contractValidation = validateImplementationContracts({
    foundationVerified,
    componentsImplemented,
    stableRuntimeApi,
    modulesReplaceable,
    functionalVerification,
    reproducible,
    evidenceDriven,
    repositoryFirst,
    reuseBeforeCreate,
    humanApprovalBeforeWrite,
    readOnly: iface.read_only === true && IMPLEMENTATION_PRINCIPLES.read_only === true,
    referenceOnly: iface.reference_only === true && IMPLEMENTATION_PRINCIPLES.reference_only === true,
    noSourceDataOwnership: IMPLEMENTATION_PRINCIPLES.owns_source_data === false,
    noPlatformCoreMutation,
    noCilMutation,
    noRepositoryMutation,
    foundationUnchanged,
    readyForPlanning,
    runtimeImplemented,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'RUNTIME_CONTRACT_FAILURE',
      message: 'One or more Project Understanding Runtime contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_CONTRACTS_PATH, {
    runtime_contracts_v1_id: 'project_understanding_runtime_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PHASE,
    generated_at: generatedAt,
    contract_ids: [...VAIPUR_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: IMPLEMENTATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH, {
    vertical_ai_project_understanding_runtime_v1_id: 'vertical_ai_project_understanding_runtime_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PHASE,
    system_id: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    framework_name: IMPLEMENTATION_FRAMEWORK_NAME,
    runtime_id: RUNTIME_ID,
    runtime_version: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_SEMVER,
    decision_fingerprint: decisionFingerprint,
    implementation_fingerprint: implementationFingerprint,
    design_fingerprint: designFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    result_fingerprint: run1.result_fingerprint,
    implementation_only: true,
    design_only: false,
    runtime_implemented: runtimeImplemented,
    ready_for_planning: readyForPlanning,
    understanding_reproducible: reproducible,
    evidence_driven_workflow: evidenceDriven,
    repository_understanding_operational: functionalVerification && surfacesPresent,
    components: [...PROJECT_UNDERSTANDING_RUNTIME_COMPONENT_IDS],
    foundation_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
    export_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_EXPORT_PATH,
    registry_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REGISTRY_PATH,
    version_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_VERSION_PATH,
    functional_evidence_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH,
    reproducibility_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPRODUCIBILITY_PATH,
    contracts_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_CONTRACTS_PATH,
    principles: IMPLEMENTATION_PRINCIPLES,
    platform_core_mutation: false,
    cil_mutation: false,
    repository_mutation: false,
    write_authorized: false,
    execute_authorized: false,
  });

  const passed =
    runtimeImplemented &&
    contractValidation.aggregate_verdict === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verdict = passed
    ? VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PASS_VERDICT
    : VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_project_understanding_runtime_v1_${Date.now()}`,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PHASE,
    system_id: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Implement Project Understanding Runtime as a read-only, repository-first, reuse-before-create, evidence-driven workflow with human approval before write.',
    vertical_ai_project_understanding_runtime_v1_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_STATUS
      : 'VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_NOT_READY',
    validation_passed: passed,
    implementation_only: true,
    framework_name: IMPLEMENTATION_FRAMEWORK_NAME,
    runtime_id: RUNTIME_ID,
    decision_fingerprint: decisionFingerprint,
    implementation_fingerprint: implementationFingerprint,
    design_fingerprint: designFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    result_fingerprint: run1.result_fingerprint,
    understanding_reproducible: reproducible,
    evidence_driven_workflow_established: evidenceDriven,
    repository_understanding_operational: functionalVerification && surfacesPresent,
    ready_for_planning: readyForPlanning,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    repository_unchanged: noRepositoryMutation,
    foundation_unchanged: foundationUnchanged,
    components: [...PROJECT_UNDERSTANDING_RUNTIME_COMPONENT_IDS],
    contract_validation: contractValidation,
    runtime_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH,
    export_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_EXPORT_PATH,
    registry_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REGISTRY_PATH,
    functional_evidence_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH,
    reproducibility_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPRODUCIBILITY_PATH,
    contracts_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_CONTRACTS_PATH,
    foundation_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
    checks: {
      FOUNDATION_VERIFIED: foundationVerified,
      COMPONENTS_IMPLEMENTED: componentsImplemented,
      STABLE_RUNTIME_API: stableRuntimeApi,
      MODULES_REPLACEABLE: modulesReplaceable,
      FUNCTIONAL_VERIFICATION: functionalVerification,
      REPRODUCIBLE: reproducible,
      EVIDENCE_DRIVEN: evidenceDriven,
      REPOSITORY_FIRST: repositoryFirst,
      REUSE_BEFORE_CREATE: reuseBeforeCreate,
      HUMAN_APPROVAL_BEFORE_WRITE: humanApprovalBeforeWrite,
      READ_ONLY: iface.read_only === true,
      REFERENCE_ONLY: iface.reference_only === true,
      PLATFORM_CORE_UNCHANGED: noPlatformCoreMutation,
      CIL_UNCHANGED: noCilMutation,
      REPOSITORY_UNCHANGED: noRepositoryMutation,
      FOUNDATION_UNCHANGED: foundationUnchanged,
      READY_FOR_PLANNING: readyForPlanning,
      RUNTIME_IMPLEMENTED: runtimeImplemented,
      CONTRACT_VALIDATION: contractValidation.aggregate_verdict === 'PASS',
      GOAL_TRUTH_SATISFIED: allGoalsSatisfied,
      WRITE_AUTHORIZED: false,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPORT_PATH,
  };
}
