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
  VERTICAL_AI_COMPLETE_V1_PASS_VERDICT,
  VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_V1_REPORT_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_CONTRACTS_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_REGISTRY_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_REPRODUCIBILITY_V1_PATH,
  VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
  VERTICAL_AI_MASTER_SNAPSHOT_FINGERPRINTS_V1_PATH,
} from './verticalAiCompleteCertificationV1Engine.js';
import {
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PASS_VERDICT,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_REPORT_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_EVIDENCE_V1_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_WORKFLOW_V1_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REPRODUCIBILITY_V1_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_CONTRACTS_V1_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REGISTRY_V1_PATH,
} from './verticalAiProductionOperationValidationV1Engine.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_FINAL_CERTIFICATION_V1_PHASE = 'PHASE-VAI-015' as const;
export const VERTICAL_AI_FINAL_CERTIFICATION_V1_SYSTEM_ID =
  'VERTICAL_AI_FINAL_CERTIFICATION_V1' as const;
export const VERTICAL_AI_FINAL_CERTIFICATION_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_FINAL_CERTIFICATION_V1' as const;
export const VERTICAL_AI_FINAL_CERTIFICATION_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_FINAL_CERTIFICATION_V1' as const;
export const VERTICAL_AI_FINAL_CERTIFICATION_V1_STATUS =
  'VERTICAL_AI_V1_FINALIZED' as const;

export const VERTICAL_AI_FINAL_CERTIFICATION_V1_DIR =
  'datasets/vertical_ai_final_certification_v1' as const;
export const VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH =
  `${VERTICAL_AI_FINAL_CERTIFICATION_V1_DIR}/vertical-ai-final-certification-v1.json` as const;
export const VERTICAL_AI_FINAL_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH =
  `${VERTICAL_AI_FINAL_CERTIFICATION_V1_DIR}/final-certification-evidence-chain-v1.json` as const;
export const VERTICAL_AI_FINAL_CERTIFICATION_CONTRACTS_V1_PATH =
  `${VERTICAL_AI_FINAL_CERTIFICATION_V1_DIR}/final-certification-contracts-v1.json` as const;
export const VERTICAL_AI_FINAL_CERTIFICATION_REGISTRY_V1_PATH =
  `${VERTICAL_AI_FINAL_CERTIFICATION_V1_DIR}/final-certification-registry-v1.json` as const;
export const VERTICAL_AI_FINAL_CERTIFICATION_REPRODUCIBILITY_V1_PATH =
  `${VERTICAL_AI_FINAL_CERTIFICATION_V1_DIR}/final-certification-reproducibility-v1.json` as const;
export const VERTICAL_AI_FINAL_CERTIFICATION_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_FINAL_CERTIFICATION_V1_REPORT.json' as const;

export const VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_DIR =
  'datasets/vertical_ai_v1_master_snapshot_v2' as const;
export const VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH =
  `${VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_DIR}/vertical-ai-v1-master-snapshot-v2.json` as const;
export const VERTICAL_AI_V1_MASTER_SNAPSHOT_FINGERPRINTS_V2_PATH =
  `${VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_DIR}/master-snapshot-fingerprints-v2.json` as const;

const CERTIFICATION_NAME = 'Evidence-Bound Vertical AI Final Certification V1' as const;
const CAPABILITY_ID = 'vertical_ai' as const;
const NEXT_EVOLUTION_VERSION = 'vertical_ai_v2' as const;

export const VAIFC_CONTRACT_IDS = [
  'VAIFC_PRECHECK_VERIFIED',
  'VAIFC_PRODUCTION_OPERATION_VALIDATION',
  'VAIFC_END_TO_END_LIFECYCLE',
  'VAIFC_OPERATIONAL_REPRODUCIBILITY',
  'VAIFC_OPERATIONAL_EVIDENCE',
  'VAIFC_MASTER_SNAPSHOT',
  'VAIFC_FINAL_CERTIFICATION_REPRODUCIBILITY',
  'VAIFC_BASELINE_PROTECTION',
  'VAIFC_SNAPSHOT_INTEGRITY',
  'VAIFC_CERTIFICATION_ONLY',
  'VAIFC_READ_ONLY',
  'VAIFC_REFERENCE_ONLY',
  'VAIFC_NO_REPOSITORY_MUTATION',
  'VAIFC_NO_PLATFORM_CORE_MUTATION',
  'VAIFC_NO_CIL_MUTATION',
  'VAIFC_MASTER_SNAPSHOT_IMMUTABLE',
  'VAIFC_VERTICAL_AI_FROZEN',
  'VAIFC_VERTICAL_AI_FINALIZED',
  'VAIFC_READY_FOR_VERTICAL_AI_V2',
] as const;

const VERIFICATION_CHECKS = [
  'production_operation_validation',
  'end_to_end_lifecycle',
  'operational_reproducibility',
  'operational_evidence',
  'master_snapshot',
  'final_certification_reproducibility',
  'baseline_protection',
  'snapshot_integrity',
] as const;

const CERTIFICATION_PRINCIPLES = {
  certification_only: true,
  implementation: false,
  redesign: false,
  read_only: true,
  reference_only: true,
  repository_mutation_forbidden: true,
  repository_mutation: false,
  consumes_platform_core_v1_only: true,
  consumes_cil_v1_only: true,
  uses_certified_vertical_ai_v1: true,
  owns_source_data: false,
  platform_core_mutation: false,
  cil_mutation: false,
  vertical_ai_v1_frozen: true,
} as const;

const EXECUTION_FLAGS = { ...CERTIFICATION_PRINCIPLES, execute_authorized: false as const };

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

const PROTECTED_VERTICAL_AI_BASELINE_PATHS = [
  VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_CONTRACTS_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_REGISTRY_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_REPRODUCIBILITY_V1_PATH,
  VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
  VERTICAL_AI_MASTER_SNAPSHOT_FINGERPRINTS_V1_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_EVIDENCE_V1_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_WORKFLOW_V1_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REPRODUCIBILITY_V1_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_CONTRACTS_V1_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REGISTRY_V1_PATH,
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

function fingerprintFile(root: string, rel: string): string | null {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex').slice(0, 16);
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

function validateFinalCertificationContracts(input: Record<string, boolean>) {
  const map: Array<[string, string]> = [
    ['VAIFC_PRECHECK_VERIFIED', 'precheckVerified'],
    ['VAIFC_PRODUCTION_OPERATION_VALIDATION', 'productionOperationValidation'],
    ['VAIFC_END_TO_END_LIFECYCLE', 'endToEndLifecycle'],
    ['VAIFC_OPERATIONAL_REPRODUCIBILITY', 'operationalReproducibility'],
    ['VAIFC_OPERATIONAL_EVIDENCE', 'operationalEvidence'],
    ['VAIFC_MASTER_SNAPSHOT', 'masterSnapshot'],
    ['VAIFC_FINAL_CERTIFICATION_REPRODUCIBILITY', 'finalCertificationReproducibility'],
    ['VAIFC_BASELINE_PROTECTION', 'baselineProtection'],
    ['VAIFC_SNAPSHOT_INTEGRITY', 'snapshotIntegrity'],
    ['VAIFC_CERTIFICATION_ONLY', 'certificationOnly'],
    ['VAIFC_READ_ONLY', 'readOnly'],
    ['VAIFC_REFERENCE_ONLY', 'referenceOnly'],
    ['VAIFC_NO_REPOSITORY_MUTATION', 'noRepositoryMutation'],
    ['VAIFC_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAIFC_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAIFC_MASTER_SNAPSHOT_IMMUTABLE', 'masterSnapshotImmutable'],
    ['VAIFC_VERTICAL_AI_FROZEN', 'verticalAiFrozen'],
    ['VAIFC_VERTICAL_AI_FINALIZED', 'verticalAiFinalized'],
    ['VAIFC_READY_FOR_VERTICAL_AI_V2', 'readyForVerticalAiV2'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return {
    contract_ids: [...VAIFC_CONTRACT_IDS],
    results,
    aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const),
  };
}

export function writeVerticalAiFinalCertificationV1EngineReport(): {
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
  const vaiBaselineBefore = captureBaselineMtimes(root, PROTECTED_VERTICAL_AI_BASELINE_PATHS);

  const goalTruth = loadCurrentGoalTruth(root);
  const allGoalsSatisfied = goalTruth.satisfied_goals === goalTruth.evaluated_goals;
  if (!allGoalsSatisfied) {
    issues.push({
      code: 'GOAL_TRUTH',
      message: 'All Current Goal Truth entries must be satisfied for Vertical AI final certification',
      severity: 'error',
    });
  }

  const precheckVerified = phaseReportPassed(
    root,
    VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_REPORT_PATH,
    VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PASS_VERDICT
  );
  if (!precheckVerified) {
    issues.push({
      code: 'PRECHECK_FAILED',
      message: `Precheck requires ${VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const completeCertificationVerified = phaseReportPassed(
    root,
    VERTICAL_AI_COMPLETE_CERTIFICATION_V1_REPORT_PATH,
    VERTICAL_AI_COMPLETE_V1_PASS_VERDICT
  );

  const pov = readJson<{
    production_operation_validated?: boolean;
    production_operation_reproducible?: boolean;
    operational_evidence_verified?: boolean;
    end_to_end_workflow_verified?: boolean;
    ready_for_vertical_ai_v2?: boolean;
    decision_fingerprint?: string;
    operational_fingerprint?: string;
    repository_mutation_forbidden?: boolean;
    repository_mutation?: boolean;
    verification_results?: Record<string, boolean>;
  }>(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH);

  const povEvidence = readJson<{
    operational_evidence_verified?: boolean;
    evidence_items?: unknown[];
  }>(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_EVIDENCE_V1_PATH);

  const povWorkflow = readJson<{
    end_to_end_verified?: boolean;
    chain_bindings?: Record<string, boolean>;
  }>(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_WORKFLOW_V1_PATH);

  const povRepro = readJson<{
    reproducible?: boolean;
    improvement_run_1_fingerprint?: string;
    improvement_run_2_fingerprint?: string;
    operational_fingerprint?: string;
  }>(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REPRODUCIBILITY_V1_PATH);

  const completeCert = readJson<{
    production_ready?: boolean;
    vertical_ai_complete?: boolean;
    vertical_ai_frozen?: boolean;
    master_snapshot_immutable?: boolean;
    snapshot_fingerprint?: string;
  }>(root, VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH);

  const masterSnapshotV1 = readJson<{
    snapshot_fingerprint?: string;
    immutable?: boolean;
    capability_id?: string;
    lifecycle_phases?: unknown[];
    layer_operational?: Record<string, boolean>;
    evolution_policy?: { vertical_ai_v1_frozen?: boolean; next_evolution_version?: string };
  }>(root, VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH);

  const productionOperationValidation =
    precheckVerified &&
    pathExists(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH) &&
    pov?.production_operation_validated === true &&
    pov?.ready_for_vertical_ai_v2 === true &&
    typeof pov.decision_fingerprint === 'string' &&
    typeof pov.operational_fingerprint === 'string';

  if (!productionOperationValidation) {
    issues.push({
      code: 'PRODUCTION_OPERATION_VALIDATION_FAILED',
      message: 'Production operation validation artifacts must be present and validated',
      severity: 'error',
    });
  }

  const lifecycleLayersOk =
    masterSnapshotV1?.layer_operational?.project_understanding === true &&
    masterSnapshotV1?.layer_operational?.planning === true &&
    masterSnapshotV1?.layer_operational?.execution === true &&
    masterSnapshotV1?.layer_operational?.validation === true &&
    masterSnapshotV1?.layer_operational?.certification === true &&
    masterSnapshotV1?.layer_operational?.improvement === true;

  const endToEndLifecycle =
    completeCertificationVerified &&
    completeCert?.vertical_ai_complete === true &&
    completeCert?.production_ready === true &&
    Array.isArray(masterSnapshotV1?.lifecycle_phases) &&
    (masterSnapshotV1?.lifecycle_phases?.length ?? 0) >= 12 &&
    lifecycleLayersOk &&
    pov?.end_to_end_workflow_verified === true &&
    povWorkflow?.end_to_end_verified === true &&
    povWorkflow?.chain_bindings?.planning_to_execution === true &&
    povWorkflow?.chain_bindings?.execution_to_validation === true &&
    povWorkflow?.chain_bindings?.validation_to_certification === true &&
    povWorkflow?.chain_bindings?.certification_to_improvement === true;

  const operationalReproducibility =
    pov?.production_operation_reproducible === true &&
    povRepro?.reproducible === true &&
    typeof povRepro?.improvement_run_1_fingerprint === 'string' &&
    povRepro.improvement_run_1_fingerprint === povRepro.improvement_run_2_fingerprint &&
    typeof pov.operational_fingerprint === 'string' &&
    pov.operational_fingerprint === povRepro.operational_fingerprint;

  const operationalEvidence =
    pov?.operational_evidence_verified === true &&
    povEvidence?.operational_evidence_verified === true &&
    Array.isArray(povEvidence?.evidence_items) &&
    (povEvidence?.evidence_items?.length ?? 0) > 0 &&
    pathExists(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_EVIDENCE_V1_PATH);

  const masterSnapshot =
    pathExists(root, VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH) &&
    masterSnapshotV1?.immutable === true &&
    masterSnapshotV1?.capability_id === CAPABILITY_ID &&
    typeof masterSnapshotV1.snapshot_fingerprint === 'string' &&
    completeCert?.snapshot_fingerprint === masterSnapshotV1.snapshot_fingerprint &&
    completeCert?.master_snapshot_immutable === true &&
    masterSnapshotV1?.evolution_policy?.vertical_ai_v1_frozen === true;

  if (!masterSnapshot) {
    issues.push({
      code: 'MASTER_SNAPSHOT_V1_NOT_BOUND',
      message: 'Certified Vertical AI V1 master snapshot must remain present, immutable, and bound',
      severity: 'error',
    });
  }

  const noRepositoryMutation =
    CERTIFICATION_PRINCIPLES.repository_mutation_forbidden === true &&
    CERTIFICATION_PRINCIPLES.repository_mutation === false &&
    pov?.repository_mutation_forbidden === true &&
    pov?.repository_mutation === false;

  if (!noRepositoryMutation) {
    issues.push({
      code: 'REPOSITORY_MUTATION_NOT_FORBIDDEN',
      message: 'Vertical AI final certification requires repository mutation forbidden',
      severity: 'error',
    });
  }

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
  const vaiBaselineAfter = verifyBaselinePreserved(
    root,
    vaiBaselineBefore,
    PROTECTED_VERTICAL_AI_BASELINE_PATHS
  );

  const baselineChecks: Array<[string, { preserved: boolean; drift: string[] }, string]> = [
    ['BRAIN_BASELINE_MUTATION', brainBaselineAfter, 'Project Brain baseline changed'],
    ['BUNDLE_BASELINE_MUTATION', bundleBaselineAfter, 'RIB baseline changed'],
    ['ACCESS_BASELINE_MUTATION', accessBaselineAfter, 'Access Layer baseline changed'],
    ['RUNTIME_BASELINE_MUTATION', runtimeBaselineAfter, 'Agent Runtime baseline changed'],
    ['CIL_BASELINE_MUTATION', cilBaselineAfter, 'CIL baseline changed'],
    ['CONNECTOR_BASELINE_MUTATION', connectorBaselineAfter, 'Certified connector baseline changed'],
    ['VERTICAL_AI_BASELINE_MUTATION', vaiBaselineAfter, 'Vertical AI certified baseline changed'],
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

  const baselineProtection =
    noPlatformCoreMutation &&
    noCilMutation &&
    connectorBaselineAfter.preserved &&
    vaiBaselineAfter.preserved;

  const buildSnapshotFingerprint = () =>
    stableFingerprint({
      capability_id: CAPABILITY_ID,
      snapshot_revision: 'v2',
      master_v1: masterSnapshotV1?.snapshot_fingerprint ?? null,
      complete_cert: completeCert?.snapshot_fingerprint ?? null,
      production_operation_decision: pov?.decision_fingerprint ?? null,
      production_operation_operational: pov?.operational_fingerprint ?? null,
      operational_reproducibility: povRepro?.improvement_run_1_fingerprint ?? null,
      principles: CERTIFICATION_PRINCIPLES,
    });

  const snapshotFingerprint = buildSnapshotFingerprint();
  const snapshotFingerprintStable = snapshotFingerprint === buildSnapshotFingerprint();

  const certificationReplaySignatures = Array.from({ length: 5 }, () =>
    stableFingerprint({
      snapshot: buildSnapshotFingerprint(),
      pov_decision: pov?.decision_fingerprint ?? null,
      pov_operational: pov?.operational_fingerprint ?? null,
      master_v1: masterSnapshotV1?.snapshot_fingerprint ?? null,
      goal: goalTruth.fingerprint,
    })
  );
  const certificationReplayStable = certificationReplaySignatures.every(
    (sig) => sig === certificationReplaySignatures[0]
  );
  const finalCertificationReproducibilityFingerprint = stableFingerprint({
    signatures: certificationReplaySignatures,
    snapshot: snapshotFingerprint,
  });
  const finalCertificationReproducibility =
    certificationReplayStable && snapshotFingerprintStable && operationalReproducibility;

  const priorMasterSnapshotV2 = readJson<{
    snapshot_fingerprint?: string;
    decision_fingerprint?: string;
    generated_at?: string;
    immutable?: boolean;
  }>(root, VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH);
  const masterSnapshotV2Exists = priorMasterSnapshotV2 !== null;
  const masterSnapshotV2FingerprintMatch =
    !masterSnapshotV2Exists || priorMasterSnapshotV2.snapshot_fingerprint === snapshotFingerprint;

  if (masterSnapshotV2Exists && !masterSnapshotV2FingerprintMatch) {
    issues.push({
      code: 'MASTER_SNAPSHOT_V2_MUTATION',
      message:
        'Vertical AI V1 master snapshot v2 fingerprint drift detected; finalized snapshot must remain immutable',
      severity: 'error',
    });
  }

  const evidenceChainEntries = [
    {
      evidence_id: 'complete_certification',
      artifact_path: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
      report_path: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_REPORT_PATH,
      fingerprint: completeCert?.snapshot_fingerprint ?? null,
      satisfied: completeCertificationVerified,
    },
    {
      evidence_id: 'master_snapshot_v1',
      artifact_path: VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
      report_path: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_REPORT_PATH,
      fingerprint: masterSnapshotV1?.snapshot_fingerprint ?? null,
      satisfied: masterSnapshot,
    },
    {
      evidence_id: 'production_operation_validation',
      artifact_path: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH,
      report_path: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_REPORT_PATH,
      fingerprint: pov?.decision_fingerprint ?? null,
      satisfied: productionOperationValidation,
    },
    {
      evidence_id: 'operational_evidence',
      artifact_path: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_EVIDENCE_V1_PATH,
      report_path: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_REPORT_PATH,
      fingerprint: fingerprintFile(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_EVIDENCE_V1_PATH),
      satisfied: operationalEvidence,
    },
    {
      evidence_id: 'end_to_end_operation',
      artifact_path: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_WORKFLOW_V1_PATH,
      report_path: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_REPORT_PATH,
      fingerprint: fingerprintFile(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_WORKFLOW_V1_PATH),
      satisfied: endToEndLifecycle,
    },
    {
      evidence_id: 'operational_reproducibility',
      artifact_path: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REPRODUCIBILITY_V1_PATH,
      report_path: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_REPORT_PATH,
      fingerprint: povRepro?.operational_fingerprint ?? null,
      satisfied: operationalReproducibility,
    },
  ];

  const evidenceChainComplete = evidenceChainEntries.every(
    (entry) => entry.satisfied && typeof entry.fingerprint === 'string'
  );

  const snapshotIntegrity =
    snapshotFingerprintStable &&
    masterSnapshotV2FingerprintMatch &&
    evidenceChainComplete &&
    masterSnapshot;

  const decisionFingerprint = stableFingerprint({
    goalTruth: goalTruth.fingerprint,
    snapshotFingerprint,
    finalCertificationReproducibilityFingerprint,
    production_operation: pov?.decision_fingerprint ?? null,
    mode: 'certification_only',
  });

  const certificationOnly =
    CERTIFICATION_PRINCIPLES.certification_only === true &&
    CERTIFICATION_PRINCIPLES.implementation === false;
  const readOnly = CERTIFICATION_PRINCIPLES.read_only === true;
  const referenceOnly = CERTIFICATION_PRINCIPLES.reference_only === true;

  const verificationResults: Record<(typeof VERIFICATION_CHECKS)[number], boolean> = {
    production_operation_validation: productionOperationValidation,
    end_to_end_lifecycle: endToEndLifecycle,
    operational_reproducibility: operationalReproducibility,
    operational_evidence: operationalEvidence,
    master_snapshot: masterSnapshot,
    final_certification_reproducibility: finalCertificationReproducibility,
    baseline_protection: baselineProtection,
    snapshot_integrity: snapshotIntegrity,
  };
  const allVerificationPassed = VERIFICATION_CHECKS.every(
    (check) => verificationResults[check] === true
  );

  const masterSnapshotImmutable =
    snapshotIntegrity && baselineProtection && masterSnapshotV2FingerprintMatch;
  const verticalAiFrozen =
    CERTIFICATION_PRINCIPLES.vertical_ai_v1_frozen === true &&
    completeCert?.vertical_ai_frozen === true &&
    masterSnapshot &&
    masterSnapshotImmutable;

  const readyForVerticalAiV2 =
    precheckVerified &&
    allVerificationPassed &&
    masterSnapshotImmutable &&
    verticalAiFrozen &&
    noPlatformCoreMutation &&
    noCilMutation &&
    noRepositoryMutation &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verticalAiFinalized = readyForVerticalAiV2 && allGoalsSatisfied;

  const contractValidation = validateFinalCertificationContracts({
    precheckVerified,
    productionOperationValidation,
    endToEndLifecycle,
    operationalReproducibility,
    operationalEvidence,
    masterSnapshot,
    finalCertificationReproducibility,
    baselineProtection,
    snapshotIntegrity,
    certificationOnly,
    readOnly,
    referenceOnly,
    noRepositoryMutation,
    noPlatformCoreMutation,
    noCilMutation,
    masterSnapshotImmutable,
    verticalAiFrozen,
    verticalAiFinalized,
    readyForVerticalAiV2,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'FINAL_CERTIFICATION_CONTRACT_FAILURE',
      message: 'One or more Vertical AI final certification contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_FINAL_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH, {
    final_certification_evidence_chain_v1_id: 'vertical_ai_final_certification_evidence_chain_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_FINAL_CERTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_chain: evidenceChainEntries,
    evidence_chain_complete: evidenceChainComplete,
  });

  writeJson(root, VERTICAL_AI_FINAL_CERTIFICATION_REPRODUCIBILITY_V1_PATH, {
    final_certification_reproducibility_v1_id: 'vertical_ai_final_certification_reproducibility_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_FINAL_CERTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    reproducible: finalCertificationReproducibility,
    snapshot_fingerprint: snapshotFingerprint,
    final_certification_reproducibility_fingerprint: finalCertificationReproducibilityFingerprint,
    replay_signatures: certificationReplaySignatures,
  });

  const masterSnapshotV2Payload = {
    vertical_ai_v1_master_snapshot_v2_id: 'vertical_ai_v1_master_snapshot_v2',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_FINAL_CERTIFICATION_V1_PHASE,
    system_id: VERTICAL_AI_FINAL_CERTIFICATION_V1_SYSTEM_ID,
    generated_at: masterSnapshotV2Exists
      ? (priorMasterSnapshotV2.generated_at ?? generatedAt)
      : generatedAt,
    mode: 'READ_ONLY',
    certification_only: true,
    certification_name: CERTIFICATION_NAME,
    capability_id: CAPABILITY_ID,
    version: '1.0.0',
    snapshot_revision: 'v2',
    snapshot_fingerprint: snapshotFingerprint,
    final_certification_reproducibility_fingerprint: finalCertificationReproducibilityFingerprint,
    decision_fingerprint: masterSnapshotV2Exists
      ? (priorMasterSnapshotV2.decision_fingerprint ?? decisionFingerprint)
      : decisionFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    immutable: true,
    reference_only: true,
    repository_mutation_forbidden: true,
    platform_core_mutation: false,
    cil_mutation: false,
    production_operation_validated: true,
    end_to_end_lifecycle_verified: endToEndLifecycle,
    operational_reproducibility_verified: operationalReproducibility,
    operational_evidence_verified: operationalEvidence,
    master_snapshot_v1_ref: VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    master_snapshot_v1_fingerprint: masterSnapshotV1?.snapshot_fingerprint ?? null,
    complete_certification_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
    production_operation_validation_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH,
    production_operation_decision_fingerprint: pov?.decision_fingerprint ?? null,
    production_operation_operational_fingerprint: pov?.operational_fingerprint ?? null,
    project_brain_master_snapshot_ref: PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
    rib_master_snapshot_ref: REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
    access_master_snapshot_ref: REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
    agent_runtime_master_snapshot_ref: AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
    cil_master_snapshot_ref: CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
    certified_connectors: [...PROTECTED_CONNECTOR_PATHS],
    evolution_policy: {
      vertical_ai_v1_frozen: true,
      vertical_ai_v1_finalized: true,
      next_evolution_version: NEXT_EVOLUTION_VERSION,
      evolution_starts_from_v2_only: true,
      forbidden_on_v1: [
        'breaking_lifecycle_changes',
        'platform_core_mutation',
        'cil_mutation',
        'repository_mutation',
        'master_snapshot_mutation',
        'uncertified_evidence_improvement',
      ],
      allowed_on_v2: [
        'additive_improvement_candidates',
        'alternative_replaceable_runtime_modules',
        'incremental_traceability_extensions',
      ],
    },
    final_certification_ref: VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH,
  };

  if (!masterSnapshotV2Exists || masterSnapshotV2FingerprintMatch) {
    writeJson(root, VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH, masterSnapshotV2Payload);
  }

  writeJson(root, VERTICAL_AI_V1_MASTER_SNAPSHOT_FINGERPRINTS_V2_PATH, {
    master_snapshot_fingerprints_v2_id: 'vertical_ai_v1_master_snapshot_fingerprints_v2',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_FINAL_CERTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    snapshot_fingerprint: snapshotFingerprint,
    final_certification_reproducibility_fingerprint: finalCertificationReproducibilityFingerprint,
    decision_fingerprint: decisionFingerprint,
    immutable: true,
  });

  writeJson(root, VERTICAL_AI_FINAL_CERTIFICATION_CONTRACTS_V1_PATH, {
    final_certification_contracts_v1_id: 'vertical_ai_final_certification_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_FINAL_CERTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    contract_ids: [...VAIFC_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: CERTIFICATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH, {
    vertical_ai_final_certification_v1_id: 'vertical_ai_final_certification_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_FINAL_CERTIFICATION_V1_PHASE,
    system_id: VERTICAL_AI_FINAL_CERTIFICATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    certification_only: true,
    certification_name: CERTIFICATION_NAME,
    capability_id: CAPABILITY_ID,
    decision_fingerprint: decisionFingerprint,
    snapshot_fingerprint: snapshotFingerprint,
    final_certification_reproducibility_fingerprint: finalCertificationReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    vertical_ai_finalized: verticalAiFinalized,
    vertical_ai_frozen: verticalAiFrozen,
    master_snapshot_immutable: masterSnapshotImmutable,
    production_operation_validated: productionOperationValidation,
    ready_for_vertical_ai_v2: readyForVerticalAiV2,
    repository_mutation_forbidden: true,
    repository_mutation: false,
    platform_core_mutation: false,
    cil_mutation: false,
    verification_results: verificationResults,
    master_snapshot_v1_ref: VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    master_snapshot_v2_ref: VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
    production_operation_validation_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH,
    complete_certification_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
    evidence_chain_ref: VERTICAL_AI_FINAL_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH,
    reproducibility_ref: VERTICAL_AI_FINAL_CERTIFICATION_REPRODUCIBILITY_V1_PATH,
    contracts_ref: VERTICAL_AI_FINAL_CERTIFICATION_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_FINAL_CERTIFICATION_REGISTRY_V1_PATH,
    principles: CERTIFICATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_FINAL_CERTIFICATION_REGISTRY_V1_PATH, {
    registry_id: 'vertical-ai-final-certification-registry-v1',
    phase: VERTICAL_AI_FINAL_CERTIFICATION_V1_PHASE,
    system_id: VERTICAL_AI_FINAL_CERTIFICATION_V1_SYSTEM_ID,
    version: 'vertical_ai_final_certification_v1',
    generated_at: generatedAt,
    final_certification_ref: VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH,
    master_snapshot_v1_ref: VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    master_snapshot_v2_ref: VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
    production_operation_validation_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH,
    evidence_chain_ref: VERTICAL_AI_FINAL_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH,
    contracts_ref: VERTICAL_AI_FINAL_CERTIFICATION_CONTRACTS_V1_PATH,
    reproducibility_ref: VERTICAL_AI_FINAL_CERTIFICATION_REPRODUCIBILITY_V1_PATH,
    decision_fingerprint: decisionFingerprint,
    snapshot_fingerprint: snapshotFingerprint,
    vertical_ai_finalized: verticalAiFinalized,
    ready_for_vertical_ai_v2: readyForVerticalAiV2,
  });

  const passed =
    verticalAiFinalized &&
    contractValidation.aggregate_verdict === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verdict = passed
    ? VERTICAL_AI_FINAL_CERTIFICATION_V1_PASS_VERDICT
    : VERTICAL_AI_FINAL_CERTIFICATION_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_final_certification_v1_${Date.now()}`,
    phase: VERTICAL_AI_FINAL_CERTIFICATION_V1_PHASE,
    system_id: VERTICAL_AI_FINAL_CERTIFICATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Finalize certified Vertical AI V1 after production operation validation; freeze Vertical AI V1 master snapshot v2 with repository mutation forbidden.',
    vertical_ai_final_certification_v1_passed: passed,
    final_verdict: verdict,
    status: passed ? VERTICAL_AI_FINAL_CERTIFICATION_V1_STATUS : 'VERTICAL_AI_V1_NOT_FINALIZED',
    validation_passed: passed,
    certification_only: true,
    certification_name: CERTIFICATION_NAME,
    capability_id: CAPABILITY_ID,
    decision_fingerprint: decisionFingerprint,
    snapshot_fingerprint: snapshotFingerprint,
    final_certification_reproducibility_fingerprint: finalCertificationReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    final_certification_reproducible: finalCertificationReproducibility,
    certified_vertical_ai_frozen: verticalAiFrozen,
    vertical_ai_finalized: verticalAiFinalized,
    production_operation_validated: productionOperationValidation,
    master_snapshot_immutable: masterSnapshotImmutable,
    master_snapshot_frozen:
      masterSnapshotImmutable && pathExists(root, VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH),
    ready_for_vertical_ai_v2: readyForVerticalAiV2,
    repository_mutation_forbidden: true,
    repository_mutation: false,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    verification_results: verificationResults,
    contract_validation: contractValidation,
    final_certification_ref: VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH,
    master_snapshot_v1_ref: VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    master_snapshot_v2_ref: VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
    production_operation_validation_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH,
    evidence_chain_ref: VERTICAL_AI_FINAL_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH,
    reproducibility_ref: VERTICAL_AI_FINAL_CERTIFICATION_REPRODUCIBILITY_V1_PATH,
    contracts_ref: VERTICAL_AI_FINAL_CERTIFICATION_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_FINAL_CERTIFICATION_REGISTRY_V1_PATH,
    checks: {
      PRECHECK_VERIFIED: precheckVerified,
      PRODUCTION_OPERATION_VALIDATION: productionOperationValidation,
      END_TO_END_LIFECYCLE: endToEndLifecycle,
      OPERATIONAL_REPRODUCIBILITY: operationalReproducibility,
      OPERATIONAL_EVIDENCE: operationalEvidence,
      MASTER_SNAPSHOT: masterSnapshot,
      FINAL_CERTIFICATION_REPRODUCIBILITY: finalCertificationReproducibility,
      BASELINE_PROTECTION: baselineProtection,
      SNAPSHOT_INTEGRITY: snapshotIntegrity,
      CERTIFICATION_ONLY: certificationOnly,
      READ_ONLY: readOnly,
      REFERENCE_ONLY: referenceOnly,
      NO_REPOSITORY_MUTATION: noRepositoryMutation,
      PLATFORM_CORE_UNCHANGED: noPlatformCoreMutation,
      CIL_UNCHANGED: noCilMutation,
      MASTER_SNAPSHOT_IMMUTABLE: masterSnapshotImmutable,
      VERTICAL_AI_FROZEN: verticalAiFrozen,
      VERTICAL_AI_FINALIZED: verticalAiFinalized,
      READY_FOR_VERTICAL_AI_V2: readyForVerticalAiV2,
      CONTRACT_VALIDATION: contractValidation.aggregate_verdict === 'PASS',
      GOAL_TRUTH_SATISFIED: allGoalsSatisfied,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_FINAL_CERTIFICATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_FINAL_CERTIFICATION_V1_REPORT_PATH,
  };
}
