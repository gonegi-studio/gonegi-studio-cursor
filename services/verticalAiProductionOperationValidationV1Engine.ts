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
import { createUnderstandingRuntimeApi } from './verticalAiProjectUnderstandingRuntimeV1.js';
import { createPlanningRuntimeApi } from './verticalAiPlanningRuntimeV1.js';
import { createExecutionRuntimeApi } from './verticalAiExecutionRuntimeV1.js';
import { createValidationRuntimeApi } from './verticalAiValidationRuntimeV1.js';
import { createCertificationRuntimeApi } from './verticalAiCertificationRuntimeV1.js';
import { createImprovementRuntimeApi } from './verticalAiImprovementRuntimeV1.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PHASE = 'PHASE-VAI-014' as const;
export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_SYSTEM_ID =
  'VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1' as const;
export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1' as const;
export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1' as const;
export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_STATUS =
  'VERTICAL_AI_PRODUCTION_OPERATION_VALIDATED' as const;

export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_DIR =
  'datasets/vertical_ai_production_operation_validation_v1' as const;
export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH =
  `${VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_DIR}/vertical-ai-production-operation-validation-v1.json` as const;
export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_EVIDENCE_V1_PATH =
  `${VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_DIR}/operational-evidence-v1.json` as const;
export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_WORKFLOW_V1_PATH =
  `${VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_DIR}/end-to-end-operation-v1.json` as const;
export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REPRODUCIBILITY_V1_PATH =
  `${VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_DIR}/operational-reproducibility-v1.json` as const;
export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_CONTRACTS_V1_PATH =
  `${VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_DIR}/operation-validation-contracts-v1.json` as const;
export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REGISTRY_V1_PATH =
  `${VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_DIR}/operation-validation-registry-v1.json` as const;
export const VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_REPORT.json' as const;

const VALIDATION_NAME =
  'Evidence-Bound Vertical AI Production Operation Validation V1' as const;

export const VAIPOV_CONTRACT_IDS = [
  'VAIPOV_COMPLETE_CERTIFICATION_VERIFIED',
  'VAIPOV_MASTER_SNAPSHOT_BOUND',
  'VAIPOV_REPOSITORY_UNDERSTANDING',
  'VAIPOV_REUSE_DECISION',
  'VAIPOV_GAP_ANALYSIS',
  'VAIPOV_PLANNING',
  'VAIPOV_HUMAN_APPROVAL',
  'VAIPOV_EXECUTION',
  'VAIPOV_VALIDATION',
  'VAIPOV_CERTIFICATION',
  'VAIPOV_IMPROVEMENT',
  'VAIPOV_OPERATIONAL_REPRODUCIBILITY',
  'VAIPOV_END_TO_END_OPERATION',
  'VAIPOV_OPERATIONAL_EVIDENCE',
  'VAIPOV_VALIDATION_ONLY',
  'VAIPOV_READ_ONLY',
  'VAIPOV_REFERENCE_ONLY',
  'VAIPOV_NO_REPOSITORY_MUTATION',
  'VAIPOV_NO_PLATFORM_CORE_MUTATION',
  'VAIPOV_NO_CIL_MUTATION',
  'VAIPOV_USES_CERTIFIED_VERTICAL_AI_V1',
  'VAIPOV_READY_FOR_VERTICAL_AI_V2',
  'VAIPOV_PRODUCTION_OPERATION_VALIDATED',
] as const;

const VERIFICATION_CHECKS = [
  'repository_understanding',
  'reuse_decision',
  'gap_analysis',
  'planning',
  'human_approval',
  'execution',
  'validation',
  'certification',
  'improvement',
  'operational_reproducibility',
  'end_to_end_operation',
  'operational_evidence',
] as const;

const VALIDATION_PRINCIPLES = {
  validation_only: true,
  implementation: false,
  redesign: false,
  read_only: true,
  reference_only: true,
  repository_mutation_forbidden: true,
  repository_mutation: false,
  uses_certified_vertical_ai_v1: true,
  consumes_platform_core_v1_only: true,
  consumes_cil_v1_only: true,
  owns_source_data: false,
  platform_core_mutation: false,
  cil_mutation: false,
} as const;

const EXECUTION_FLAGS = { ...VALIDATION_PRINCIPLES, execute_authorized: false as const };

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

const PROTECTED_VERTICAL_AI_CERT_PATHS = [
  VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_CONTRACTS_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_REGISTRY_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_REPRODUCIBILITY_V1_PATH,
  VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
  VERTICAL_AI_MASTER_SNAPSHOT_FINGERPRINTS_V1_PATH,
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

function validateOperationContracts(input: Record<string, boolean>) {
  const map: Array<[string, string]> = [
    ['VAIPOV_COMPLETE_CERTIFICATION_VERIFIED', 'completeCertificationVerified'],
    ['VAIPOV_MASTER_SNAPSHOT_BOUND', 'masterSnapshotBound'],
    ['VAIPOV_REPOSITORY_UNDERSTANDING', 'repositoryUnderstanding'],
    ['VAIPOV_REUSE_DECISION', 'reuseDecision'],
    ['VAIPOV_GAP_ANALYSIS', 'gapAnalysis'],
    ['VAIPOV_PLANNING', 'planning'],
    ['VAIPOV_HUMAN_APPROVAL', 'humanApproval'],
    ['VAIPOV_EXECUTION', 'execution'],
    ['VAIPOV_VALIDATION', 'validation'],
    ['VAIPOV_CERTIFICATION', 'certification'],
    ['VAIPOV_IMPROVEMENT', 'improvement'],
    ['VAIPOV_OPERATIONAL_REPRODUCIBILITY', 'operationalReproducibility'],
    ['VAIPOV_END_TO_END_OPERATION', 'endToEndOperation'],
    ['VAIPOV_OPERATIONAL_EVIDENCE', 'operationalEvidence'],
    ['VAIPOV_VALIDATION_ONLY', 'validationOnly'],
    ['VAIPOV_READ_ONLY', 'readOnly'],
    ['VAIPOV_REFERENCE_ONLY', 'referenceOnly'],
    ['VAIPOV_NO_REPOSITORY_MUTATION', 'noRepositoryMutation'],
    ['VAIPOV_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAIPOV_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAIPOV_USES_CERTIFIED_VERTICAL_AI_V1', 'usesCertifiedVerticalAiV1'],
    ['VAIPOV_READY_FOR_VERTICAL_AI_V2', 'readyForVerticalAiV2'],
    ['VAIPOV_PRODUCTION_OPERATION_VALIDATED', 'productionOperationValidated'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return {
    contract_ids: [...VAIPOV_CONTRACT_IDS],
    results,
    aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const),
  };
}

export function writeVerticalAiProductionOperationValidationV1EngineReport(): {
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
  const certBaselineBefore = captureBaselineMtimes(root, PROTECTED_VERTICAL_AI_CERT_PATHS);

  const goalTruth = loadCurrentGoalTruth(root);
  const allGoalsSatisfied = goalTruth.satisfied_goals === goalTruth.evaluated_goals;
  if (!allGoalsSatisfied) {
    issues.push({
      code: 'GOAL_TRUTH',
      message: 'All Current Goal Truth entries must be satisfied for production operation validation',
      severity: 'error',
    });
  }

  const completeCertificationVerified = phaseReportPassed(
    root,
    VERTICAL_AI_COMPLETE_CERTIFICATION_V1_REPORT_PATH,
    VERTICAL_AI_COMPLETE_V1_PASS_VERDICT
  );
  if (!completeCertificationVerified) {
    issues.push({
      code: 'PRECHECK_FAILED',
      message: `Precheck requires ${VERTICAL_AI_COMPLETE_V1_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const completeCert = readJson<{
    production_ready?: boolean;
    vertical_ai_complete?: boolean;
    snapshot_fingerprint?: string;
    master_snapshot_immutable?: boolean;
  }>(root, VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH);

  const masterSnapshot = readJson<{
    snapshot_fingerprint?: string;
    immutable?: boolean;
    lifecycle_phases?: unknown[];
    capability_id?: string;
  }>(root, VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH);

  const masterSnapshotBound =
    pathExists(root, VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH) &&
    masterSnapshot?.immutable === true &&
    typeof masterSnapshot.snapshot_fingerprint === 'string' &&
    completeCert?.snapshot_fingerprint === masterSnapshot.snapshot_fingerprint &&
    completeCert?.production_ready === true &&
    completeCert?.vertical_ai_complete === true;

  if (!masterSnapshotBound) {
    issues.push({
      code: 'MASTER_SNAPSHOT_NOT_BOUND',
      message: 'Certified Vertical AI V1 master snapshot must be present, immutable, and bound',
      severity: 'error',
    });
  }

  // Inject upstream stages so one live chain validates E2E without exponential nested re-scans.
  const understandingApi = createUnderstandingRuntimeApi(root);
  const understanding = understandingApi.understand('vai014-ops-understanding');

  const planningApi = createPlanningRuntimeApi(root, {
    createUnderstandingRuntimeApi: () => ({ understand: () => understanding }),
  });
  const planning = planningApi.plan('vai014-ops-planning');

  const executionApi = createExecutionRuntimeApi(root, {
    createPlanningRuntimeApi: () => ({ plan: () => planning }),
  });
  const execution = executionApi.execute('vai014-ops-execution');

  const validationApi = createValidationRuntimeApi(root, {
    createExecutionRuntimeApi: () => ({ execute: () => execution }),
  });
  const validation = validationApi.validate('vai014-ops-validation');

  const certificationApi = createCertificationRuntimeApi(root, {
    createValidationRuntimeApi: () => ({ validate: () => validation }),
  });
  const certification = certificationApi.certify('vai014-ops-certification');

  const improvementApi = createImprovementRuntimeApi(root, {
    createCertificationRuntimeApi: () => ({ certify: () => certification }),
  });
  const improvement1 = improvementApi.improve('vai014-ops-improvement');
  const improvement2 = improvementApi.improve('vai014-ops-improvement');

  const understandingMutation = understandingApi.requestWrite('create_file');
  const planningMutation = planningApi.requestWrite('create_file');
  const executionMutation = executionApi.requestRepositoryMutation('create_file');
  const validationMutation = validationApi.requestRepositoryMutation('create_file');
  const certificationMutation = certificationApi.requestRepositoryMutation('create_file');
  const improvementMutation = improvementApi.requestRepositoryMutation('create_file');

  const repositoryUnderstanding =
    understanding.scan.surface_count > 0 &&
    understanding.components.resolved_count > 0 &&
    understanding.repository_first === true &&
    understanding.read_only === true;

  const reuseDecision =
    understanding.reuse.reuse_before_create === true &&
    understanding.reuse.candidates.length > 0 &&
    planning.reuse.reuse_before_create === true &&
    planning.reuse.create_count === 0 &&
    planning.reuse.reuse_count > 0;

  const gapAnalysis =
    typeof understanding.gaps.gap_count === 'number' &&
    typeof planning.gaps.gap_count === 'number' &&
    planning.execution_plan.steps.some((step) => step.action === 'analyze_gap' || step.action === 'reuse');

  const planningOk =
    planning.validation.valid === true &&
    planning.execution_plan.orchestration_descriptor_only === true &&
    planning.execution_plan.write_authorized === false &&
    planning.reproducible === true;

  const humanApproval =
    planning.human_approval_required_before_write === true &&
    planning.execution_plan.steps.some((step) => step.action === 'await_approval') &&
    planningMutation.authorized === false &&
    planningMutation.requires_human_approval === true &&
    understandingMutation.authorized === false;

  const executionOk =
    execution.validation.valid === true &&
    execution.certified_boundaries_preserved === true &&
    execution.dispatch.enacted === false &&
    execution.write_authorized === false &&
    execution.tools.repository_mutated === false &&
    execution.reproducible === true;

  const validationOk =
    validation.certified_validation_operational === true &&
    validation.certified_validation_integrity_preserved === true &&
    validation.contract_validation.valid === true &&
    validation.write_authorized === false &&
    validation.reproducible === true;

  const certificationOk =
    certification.certified_evidence_frozen === true &&
    certification.certified_certification_operational === true &&
    certification.record.repository_mutated === false &&
    certification.write_authorized === false &&
    certification.reproducible === true;

  const improvementOk =
    improvement1.improvement_operational === true &&
    improvement1.certified_improvement_integrity_preserved === true &&
    improvement1.improve_only_from_certified_evidence === true &&
    improvement1.repository_mutation_forbidden === true &&
    improvement1.repository_mutation === false &&
    improvement1.candidates.candidates.every((c) => c.enacted === false) &&
    improvement1.reproducible === true;

  const operationalReproducibility =
    improvement1.reproducible &&
    improvement2.reproducible &&
    improvement1.result_fingerprint === improvement2.result_fingerprint &&
    improvement1.dispatch.dispatch_fingerprint === improvement2.dispatch.dispatch_fingerprint &&
    planning.reproducible &&
    execution.reproducible &&
    validation.reproducible &&
    certification.reproducible;

  const endToEndBound =
    typeof planning.result_fingerprint === 'string' &&
    typeof execution.result_fingerprint === 'string' &&
    typeof validation.result_fingerprint === 'string' &&
    typeof certification.result_fingerprint === 'string' &&
    typeof improvement1.result_fingerprint === 'string' &&
    execution.planning_fingerprint === planning.result_fingerprint &&
    validation.execution_fingerprint === execution.result_fingerprint &&
    certification.validation_fingerprint === validation.result_fingerprint &&
    improvement1.certification_fingerprint === certification.result_fingerprint;

  const endToEndFinal =
    repositoryUnderstanding &&
    reuseDecision &&
    gapAnalysis &&
    planningOk &&
    humanApproval &&
    executionOk &&
    validationOk &&
    certificationOk &&
    improvementOk &&
    operationalReproducibility &&
    endToEndBound;

  const operationalEvidenceItems = [
    {
      evidence_id: 'understanding',
      fingerprint: understanding.result_fingerprint,
      surfaces: understanding.scan.surface_count,
      reuse_candidates: understanding.reuse.candidates.length,
      gaps: understanding.gaps.gap_count,
    },
    {
      evidence_id: 'planning',
      fingerprint: planning.result_fingerprint,
      plan_fingerprint: planning.execution_plan.plan_fingerprint,
      reuse_count: planning.reuse.reuse_count,
      gap_count: planning.gaps.gap_count,
      awaits_approval: planning.execution_plan.steps.some((s) => s.action === 'await_approval'),
    },
    {
      evidence_id: 'execution',
      fingerprint: execution.result_fingerprint,
      dispatch_fingerprint: execution.dispatch.dispatch_fingerprint,
      planning_fingerprint: execution.planning_fingerprint,
    },
    {
      evidence_id: 'validation',
      fingerprint: validation.result_fingerprint,
      execution_fingerprint: validation.execution_fingerprint,
    },
    {
      evidence_id: 'certification',
      fingerprint: certification.result_fingerprint,
      record_fingerprint: certification.record.record_fingerprint,
      frozen: certification.certified_evidence_frozen,
    },
    {
      evidence_id: 'improvement_run_1',
      fingerprint: improvement1.result_fingerprint,
      selection_fingerprint: improvement1.candidates.selection_fingerprint,
      operational: improvement1.improvement_operational,
    },
    {
      evidence_id: 'improvement_run_2',
      fingerprint: improvement2.result_fingerprint,
    },
    {
      evidence_id: 'master_snapshot',
      fingerprint: masterSnapshot?.snapshot_fingerprint ?? null,
      immutable: masterSnapshot?.immutable === true,
    },
  ];

  const operationalEvidence =
    operationalEvidenceItems.every(
      (item) => item.fingerprint !== null && typeof item.fingerprint === 'string'
    ) && endToEndFinal;

  const noRepositoryMutation =
    VALIDATION_PRINCIPLES.repository_mutation_forbidden === true &&
    improvement1.repository_mutation_forbidden === true &&
    improvementMutation.authorized === false &&
    improvementMutation.repository_mutation_forbidden === true &&
    executionMutation.authorized === false &&
    validationMutation.authorized === false &&
    certificationMutation.authorized === false &&
    understandingMutation.authorized === false &&
    planningMutation.authorized === false;

  if (!noRepositoryMutation) {
    issues.push({
      code: 'REPOSITORY_MUTATION_NOT_FORBIDDEN',
      message: 'Production operation validation requires repository mutation forbidden across runtimes',
      severity: 'error',
    });
  }

  if (!operationalReproducibility) {
    issues.push({
      code: 'OPERATIONAL_REPRODUCIBILITY_FAILED',
      message: 'Improvement dual-run fingerprints diverged or nested runtimes were not reproducible',
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
  const certBaselineAfter = verifyBaselinePreserved(
    root,
    certBaselineBefore,
    PROTECTED_VERTICAL_AI_CERT_PATHS
  );

  const baselineChecks: Array<[string, { preserved: boolean; drift: string[] }, string]> = [
    ['BRAIN_BASELINE_MUTATION', brainBaselineAfter, 'Project Brain baseline changed'],
    ['BUNDLE_BASELINE_MUTATION', bundleBaselineAfter, 'RIB baseline changed'],
    ['ACCESS_BASELINE_MUTATION', accessBaselineAfter, 'Access Layer baseline changed'],
    ['RUNTIME_BASELINE_MUTATION', runtimeBaselineAfter, 'Agent Runtime baseline changed'],
    ['CIL_BASELINE_MUTATION', cilBaselineAfter, 'CIL baseline changed'],
    ['CONNECTOR_BASELINE_MUTATION', connectorBaselineAfter, 'Certified connector baseline changed'],
    ['VERTICAL_AI_CERT_BASELINE_MUTATION', certBaselineAfter, 'Vertical AI certification baseline changed'],
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

  const usesCertifiedVerticalAiV1 =
    masterSnapshotBound &&
    completeCertificationVerified &&
    certBaselineAfter.preserved &&
    masterSnapshot?.capability_id === 'vertical_ai';

  const verificationResults: Record<(typeof VERIFICATION_CHECKS)[number], boolean> = {
    repository_understanding: repositoryUnderstanding,
    reuse_decision: reuseDecision,
    gap_analysis: gapAnalysis,
    planning: planningOk,
    human_approval: humanApproval,
    execution: executionOk,
    validation: validationOk,
    certification: certificationOk,
    improvement: improvementOk,
    operational_reproducibility: operationalReproducibility,
    end_to_end_operation: endToEndFinal,
    operational_evidence: operationalEvidence,
  };
  const allVerificationPassed = VERIFICATION_CHECKS.every(
    (check) => verificationResults[check] === true
  );

  const validationOnly =
    VALIDATION_PRINCIPLES.validation_only === true && VALIDATION_PRINCIPLES.implementation === false;
  const readOnly = VALIDATION_PRINCIPLES.read_only === true;
  const referenceOnly = VALIDATION_PRINCIPLES.reference_only === true;

  const readyForVerticalAiV2 =
    completeCertificationVerified &&
    allVerificationPassed &&
    noPlatformCoreMutation &&
    noCilMutation &&
    noRepositoryMutation &&
    usesCertifiedVerticalAiV1 &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const productionOperationValidated = readyForVerticalAiV2 && allGoalsSatisfied;

  const operationalFingerprint = stableFingerprint({
    understanding: understanding.result_fingerprint,
    planning: planning.result_fingerprint,
    execution: execution.result_fingerprint,
    validation: validation.result_fingerprint,
    certification: certification.result_fingerprint,
    improvement: improvement1.result_fingerprint,
    master: masterSnapshot?.snapshot_fingerprint ?? null,
  });

  const decisionFingerprint = stableFingerprint({
    goalTruth: goalTruth.fingerprint,
    operationalFingerprint,
    verificationResults,
    master: masterSnapshot?.snapshot_fingerprint ?? null,
    mode: 'validation_only',
  });

  const contractValidation = validateOperationContracts({
    completeCertificationVerified,
    masterSnapshotBound,
    repositoryUnderstanding,
    reuseDecision,
    gapAnalysis,
    planning: planningOk,
    humanApproval,
    execution: executionOk,
    validation: validationOk,
    certification: certificationOk,
    improvement: improvementOk,
    operationalReproducibility,
    endToEndOperation: endToEndFinal,
    operationalEvidence,
    validationOnly,
    readOnly,
    referenceOnly,
    noRepositoryMutation,
    noPlatformCoreMutation,
    noCilMutation,
    usesCertifiedVerticalAiV1,
    readyForVerticalAiV2,
    productionOperationValidated,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'OPERATION_VALIDATION_CONTRACT_FAILURE',
      message: 'One or more production operation validation contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_EVIDENCE_V1_PATH, {
    operational_evidence_v1_id: 'vertical_ai_production_operation_evidence_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_items: operationalEvidenceItems,
    mutation_gates: {
      understanding: understandingMutation,
      planning: planningMutation,
      execution: executionMutation,
      validation: validationMutation,
      certification: certificationMutation,
      improvement: improvementMutation,
    },
    operational_evidence_verified: operationalEvidence,
  });

  writeJson(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_WORKFLOW_V1_PATH, {
    end_to_end_operation_v1_id: 'vertical_ai_end_to_end_operation_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    workflow_order: [
      'repository_understanding',
      'reuse_decision',
      'gap_analysis',
      'planning',
      'human_approval',
      'execution',
      'validation',
      'certification',
      'improvement',
    ],
    chain_bindings: {
      planning_to_execution: execution.planning_fingerprint === planning.result_fingerprint,
      execution_to_validation: validation.execution_fingerprint === execution.result_fingerprint,
      validation_to_certification:
        certification.validation_fingerprint === validation.result_fingerprint,
      certification_to_improvement:
        improvement1.certification_fingerprint === certification.result_fingerprint,
    },
    end_to_end_verified: endToEndFinal,
  });

  writeJson(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REPRODUCIBILITY_V1_PATH, {
    operational_reproducibility_v1_id: 'vertical_ai_operational_reproducibility_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PHASE,
    generated_at: generatedAt,
    reproducible: operationalReproducibility,
    improvement_run_1_fingerprint: improvement1.result_fingerprint,
    improvement_run_2_fingerprint: improvement2.result_fingerprint,
    dispatch_fingerprint: improvement1.dispatch.dispatch_fingerprint,
    operational_fingerprint: operationalFingerprint,
  });

  writeJson(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_CONTRACTS_V1_PATH, {
    operation_validation_contracts_v1_id: 'vertical_ai_production_operation_validation_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PHASE,
    generated_at: generatedAt,
    contract_ids: [...VAIPOV_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: VALIDATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH, {
    vertical_ai_production_operation_validation_v1_id:
      'vertical_ai_production_operation_validation_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PHASE,
    system_id: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    validation_only: true,
    validation_name: VALIDATION_NAME,
    decision_fingerprint: decisionFingerprint,
    operational_fingerprint: operationalFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    production_operation_reproducible: operationalReproducibility,
    operational_evidence_verified: operationalEvidence,
    end_to_end_workflow_verified: endToEndFinal,
    production_operation_validated: productionOperationValidated,
    ready_for_vertical_ai_v2: readyForVerticalAiV2,
    repository_mutation_forbidden: true,
    repository_mutation: false,
    platform_core_mutation: false,
    cil_mutation: false,
    verification_results: verificationResults,
    master_snapshot_ref: VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    complete_certification_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
    operational_evidence_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_EVIDENCE_V1_PATH,
    end_to_end_operation_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_WORKFLOW_V1_PATH,
    reproducibility_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REPRODUCIBILITY_V1_PATH,
    contracts_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REGISTRY_V1_PATH,
    principles: VALIDATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REGISTRY_V1_PATH, {
    registry_id: 'vertical-ai-production-operation-validation-registry-v1',
    phase: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PHASE,
    system_id: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_SYSTEM_ID,
    version: 'vertical_ai_production_operation_validation_v1',
    generated_at: generatedAt,
    validation_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH,
    master_snapshot_ref: VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    complete_certification_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
    decision_fingerprint: decisionFingerprint,
    operational_fingerprint: operationalFingerprint,
    ready_for_vertical_ai_v2: readyForVerticalAiV2,
    production_operation_validated: productionOperationValidated,
  });

  const passed =
    productionOperationValidated &&
    contractValidation.aggregate_verdict === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verdict = passed
    ? VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PASS_VERDICT
    : VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_production_operation_validation_v1_${Date.now()}`,
    phase: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PHASE,
    system_id: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Validate certified Vertical AI V1 on real project operations end-to-end without repository mutation.',
    vertical_ai_production_operation_validation_v1_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_STATUS
      : 'VERTICAL_AI_PRODUCTION_OPERATION_NOT_VALIDATED',
    validation_passed: passed,
    validation_only: true,
    validation_name: VALIDATION_NAME,
    decision_fingerprint: decisionFingerprint,
    operational_fingerprint: operationalFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    production_operation_reproducible: operationalReproducibility,
    operational_evidence_verified: operationalEvidence,
    end_to_end_workflow_verified: endToEndFinal,
    production_operation_validated: productionOperationValidated,
    ready_for_vertical_ai_v2: readyForVerticalAiV2,
    repository_mutation_forbidden: true,
    repository_mutation: false,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    verification_results: verificationResults,
    contract_validation: contractValidation,
    validation_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH,
    master_snapshot_ref: VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    complete_certification_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
    operational_evidence_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_EVIDENCE_V1_PATH,
    end_to_end_operation_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_WORKFLOW_V1_PATH,
    reproducibility_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REPRODUCIBILITY_V1_PATH,
    contracts_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_REGISTRY_V1_PATH,
    checks: {
      COMPLETE_CERTIFICATION_VERIFIED: completeCertificationVerified,
      MASTER_SNAPSHOT_BOUND: masterSnapshotBound,
      REPOSITORY_UNDERSTANDING: repositoryUnderstanding,
      REUSE_DECISION: reuseDecision,
      GAP_ANALYSIS: gapAnalysis,
      PLANNING: planningOk,
      HUMAN_APPROVAL: humanApproval,
      EXECUTION: executionOk,
      VALIDATION: validationOk,
      CERTIFICATION: certificationOk,
      IMPROVEMENT: improvementOk,
      OPERATIONAL_REPRODUCIBILITY: operationalReproducibility,
      END_TO_END_OPERATION: endToEndFinal,
      OPERATIONAL_EVIDENCE: operationalEvidence,
      VALIDATION_ONLY: validationOnly,
      READ_ONLY: readOnly,
      REFERENCE_ONLY: referenceOnly,
      NO_REPOSITORY_MUTATION: noRepositoryMutation,
      PLATFORM_CORE_UNCHANGED: noPlatformCoreMutation,
      CIL_UNCHANGED: noCilMutation,
      USES_CERTIFIED_VERTICAL_AI_V1: usesCertifiedVerticalAiV1,
      READY_FOR_VERTICAL_AI_V2: readyForVerticalAiV2,
      PRODUCTION_OPERATION_VALIDATED: productionOperationValidated,
      CONTRACT_VALIDATION: contractValidation.aggregate_verdict === 'PASS',
      GOAL_TRUTH_SATISFIED: allGoalsSatisfied,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_REPORT_PATH,
  };
}
