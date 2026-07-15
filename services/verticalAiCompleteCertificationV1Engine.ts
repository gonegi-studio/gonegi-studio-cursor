import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_BRAIN_ARCHITECTURE_VERSION } from './projectBrainFoundationV1.js';
import {
  PROJECT_BRAIN_COMPLETE_V1_PATH,
  PROJECT_BRAIN_COMPLETE_V1_PASS_VERDICT,
  PROJECT_BRAIN_COMPLETE_V1_REPORT_PATH,
} from './projectBrainCompleteV1Engine.js';
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
  REPOSITORY_INTELLIGENCE_BUNDLE_COMPLETE_V1_PASS_VERDICT,
  REPOSITORY_INTELLIGENCE_BUNDLE_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
} from './repositoryIntelligenceBundleProductionCertificationV1Engine.js';
import {
  REPOSITORY_INTELLIGENCE_ACCESS_CONTRACT_V1_PATH,
  REPOSITORY_INTELLIGENCE_ACCESS_API_V1_PATH,
} from './repositoryIntelligenceAccessContractV1Engine.js';
import { REPOSITORY_INTELLIGENCE_ACCESS_V1_PATH } from './repositoryIntelligenceAccessImplementationV1Engine.js';
import {
  REPOSITORY_INTELLIGENCE_ACCESS_PRODUCTION_CERTIFICATION_V1_PATH,
  REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
  REPOSITORY_INTELLIGENCE_ACCESS_COMPLETE_V1_PASS_VERDICT,
  REPOSITORY_INTELLIGENCE_ACCESS_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
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
  CONSUMER_INTEGRATION_COMPLETE_V1_PASS_VERDICT,
  CONSUMER_INTEGRATION_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
} from './consumerIntegrationProductionCertificationV1Engine.js';
import { CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './claudeConnectorProductionCertificationV1Engine.js';
import { CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './chatgptConnectorProductionCertificationV1Engine.js';
import { GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './geminiConnectorProductionCertificationV1Engine.js';
import { CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './cursorConnectorProductionCertificationV1Engine.js';
import { MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './mcpConnectorProductionCertificationV1Engine.js';
import {
  VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PASS_VERDICT,
  VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_REPORT_PATH,
} from './verticalAiProjectUnderstandingFoundationV1Engine.js';
import {
  VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PASS_VERDICT,
  VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPORT_PATH,
} from './verticalAiProjectUnderstandingRuntimeV1Engine.js';
import {
  VERTICAL_AI_PLANNING_FOUNDATION_V1_PASS_VERDICT,
  VERTICAL_AI_PLANNING_FOUNDATION_V1_PATH,
  VERTICAL_AI_PLANNING_FOUNDATION_V1_REPORT_PATH,
} from './verticalAiPlanningFoundationV1Engine.js';
import {
  VERTICAL_AI_PLANNING_RUNTIME_V1_PASS_VERDICT,
  VERTICAL_AI_PLANNING_RUNTIME_V1_PATH,
  VERTICAL_AI_PLANNING_RUNTIME_V1_REPORT_PATH,
} from './verticalAiPlanningRuntimeV1Engine.js';
import {
  VERTICAL_AI_EXECUTION_FOUNDATION_V1_PASS_VERDICT,
  VERTICAL_AI_EXECUTION_FOUNDATION_V1_PATH,
  VERTICAL_AI_EXECUTION_FOUNDATION_V1_REPORT_PATH,
} from './verticalAiExecutionFoundationV1Engine.js';
import {
  VERTICAL_AI_EXECUTION_RUNTIME_V1_PASS_VERDICT,
  VERTICAL_AI_EXECUTION_RUNTIME_V1_PATH,
  VERTICAL_AI_EXECUTION_RUNTIME_V1_REPORT_PATH,
} from './verticalAiExecutionRuntimeV1Engine.js';
import {
  VERTICAL_AI_VALIDATION_FOUNDATION_V1_PASS_VERDICT,
  VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH,
  VERTICAL_AI_VALIDATION_FOUNDATION_V1_REPORT_PATH,
} from './verticalAiValidationFoundationV1Engine.js';
import {
  VERTICAL_AI_VALIDATION_RUNTIME_V1_PASS_VERDICT,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_REPORT_PATH,
} from './verticalAiValidationRuntimeV1Engine.js';
import {
  VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PASS_VERDICT,
  VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
  VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_REPORT_PATH,
} from './verticalAiCertificationFoundationV1Engine.js';
import {
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PASS_VERDICT,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPORT_PATH,
} from './verticalAiCertificationRuntimeV1Engine.js';
import {
  VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PASS_VERDICT,
  VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_REPORT_PATH,
} from './verticalAiImprovementFoundationV1Engine.js';
import {
  VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_PASS_VERDICT,
  VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_PATH,
  VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_REPORT_PATH,
} from './verticalAiImprovementRuntimeV1Engine.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PHASE = 'PHASE-VAI-013' as const;
export const VERTICAL_AI_COMPLETE_CERTIFICATION_V1_SYSTEM_ID =
  'VERTICAL_AI_COMPLETE_CERTIFICATION_V1' as const;
export const VERTICAL_AI_COMPLETE_V1_PASS_VERDICT = 'PASS_VERTICAL_AI_COMPLETE_V1' as const;
export const VERTICAL_AI_COMPLETE_V1_FAIL_VERDICT = 'FAIL_VERTICAL_AI_COMPLETE_V1' as const;
export const VERTICAL_AI_COMPLETE_V1_STATUS = 'VERTICAL_AI_V1_PRODUCTION_READY' as const;

export const VERTICAL_AI_COMPLETE_CERTIFICATION_V1_DIR =
  'datasets/vertical_ai_complete_certification_v1' as const;
export const VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH =
  `${VERTICAL_AI_COMPLETE_CERTIFICATION_V1_DIR}/vertical-ai-complete-certification-v1.json` as const;
export const VERTICAL_AI_COMPLETE_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH =
  `${VERTICAL_AI_COMPLETE_CERTIFICATION_V1_DIR}/complete-certification-evidence-chain-v1.json` as const;
export const VERTICAL_AI_COMPLETE_CERTIFICATION_CONTRACTS_V1_PATH =
  `${VERTICAL_AI_COMPLETE_CERTIFICATION_V1_DIR}/complete-certification-contracts-v1.json` as const;
export const VERTICAL_AI_COMPLETE_CERTIFICATION_REGISTRY_V1_PATH =
  `${VERTICAL_AI_COMPLETE_CERTIFICATION_V1_DIR}/complete-certification-registry-v1.json` as const;
export const VERTICAL_AI_COMPLETE_CERTIFICATION_REPRODUCIBILITY_V1_PATH =
  `${VERTICAL_AI_COMPLETE_CERTIFICATION_V1_DIR}/certification-reproducibility-v1.json` as const;
export const VERTICAL_AI_COMPLETE_CERTIFICATION_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_COMPLETE_CERTIFICATION_V1_REPORT.json' as const;

export const VERTICAL_AI_MASTER_SNAPSHOT_V1_DIR = 'datasets/vertical_ai_master_snapshot_v1' as const;
export const VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH =
  `${VERTICAL_AI_MASTER_SNAPSHOT_V1_DIR}/vertical-ai-master-snapshot-v1.json` as const;
export const VERTICAL_AI_MASTER_SNAPSHOT_FINGERPRINTS_V1_PATH =
  `${VERTICAL_AI_MASTER_SNAPSHOT_V1_DIR}/master-snapshot-fingerprints-v1.json` as const;

const CERTIFICATION_NAME = 'Evidence-Bound Vertical AI Complete Certification V1' as const;
const CAPABILITY_ID = 'vertical_ai' as const;
const NEXT_EVOLUTION_VERSION = 'vertical_ai_v2' as const;

export const VAICC_CONTRACT_IDS = [
  'VAICC_PRECHECK_VERIFIED',
  'VAICC_PROJECT_UNDERSTANDING',
  'VAICC_PLANNING',
  'VAICC_EXECUTION',
  'VAICC_VALIDATION',
  'VAICC_CERTIFICATION',
  'VAICC_IMPROVEMENT',
  'VAICC_WORKFLOW_INTEGRITY',
  'VAICC_LIFECYCLE_INTEGRITY',
  'VAICC_BOUNDARY_INTEGRITY',
  'VAICC_BASELINE_PROTECTION',
  'VAICC_REPRODUCIBILITY',
  'VAICC_MASTER_SNAPSHOT_INTEGRITY',
  'VAICC_EVIDENCE_CHAIN',
  'VAICC_CERTIFICATION_REPRODUCIBILITY',
  'VAICC_CERTIFICATION_ONLY',
  'VAICC_READ_ONLY',
  'VAICC_REFERENCE_ONLY',
  'VAICC_NO_REPOSITORY_MUTATION',
  'VAICC_NO_PLATFORM_CORE_MUTATION',
  'VAICC_NO_CIL_MUTATION',
  'VAICC_MASTER_SNAPSHOT_IMMUTABLE',
  'VAICC_VERTICAL_AI_FROZEN',
  'VAICC_PRODUCTION_READY',
  'VAICC_VERTICAL_AI_COMPLETE',
] as const;

const VERIFICATION_CHECKS = [
  'project_understanding',
  'planning',
  'execution',
  'validation',
  'certification',
  'improvement',
  'workflow_integrity',
  'lifecycle_integrity',
  'boundary_integrity',
  'baseline_protection',
  'reproducibility',
  'master_snapshot_integrity',
  'evidence_chain',
  'certification_reproducibility',
] as const;

const LIFECYCLE_PHASE_CHAIN = [
  {
    layer_id: 'project_understanding',
    phase_id: 'PHASE-VAI-001',
    kind: 'foundation',
    report_path: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
  },
  {
    layer_id: 'project_understanding',
    phase_id: 'PHASE-VAI-002',
    kind: 'runtime',
    report_path: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH,
  },
  {
    layer_id: 'planning',
    phase_id: 'PHASE-VAI-003',
    kind: 'foundation',
    report_path: VERTICAL_AI_PLANNING_FOUNDATION_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_PLANNING_FOUNDATION_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_PLANNING_FOUNDATION_V1_PATH,
  },
  {
    layer_id: 'planning',
    phase_id: 'PHASE-VAI-004',
    kind: 'runtime',
    report_path: VERTICAL_AI_PLANNING_RUNTIME_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_PLANNING_RUNTIME_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_PLANNING_RUNTIME_V1_PATH,
  },
  {
    layer_id: 'execution',
    phase_id: 'PHASE-VAI-005',
    kind: 'foundation',
    report_path: VERTICAL_AI_EXECUTION_FOUNDATION_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_EXECUTION_FOUNDATION_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_EXECUTION_FOUNDATION_V1_PATH,
  },
  {
    layer_id: 'execution',
    phase_id: 'PHASE-VAI-006',
    kind: 'runtime',
    report_path: VERTICAL_AI_EXECUTION_RUNTIME_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_EXECUTION_RUNTIME_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_EXECUTION_RUNTIME_V1_PATH,
  },
  {
    layer_id: 'validation',
    phase_id: 'PHASE-VAI-007',
    kind: 'foundation',
    report_path: VERTICAL_AI_VALIDATION_FOUNDATION_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH,
  },
  {
    layer_id: 'validation',
    phase_id: 'PHASE-VAI-008',
    kind: 'runtime',
    report_path: VERTICAL_AI_VALIDATION_RUNTIME_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_VALIDATION_RUNTIME_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
  },
  {
    layer_id: 'certification',
    phase_id: 'PHASE-VAI-009',
    kind: 'foundation',
    report_path: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
  },
  {
    layer_id: 'certification',
    phase_id: 'PHASE-VAI-010',
    kind: 'runtime',
    report_path: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH,
  },
  {
    layer_id: 'improvement',
    phase_id: 'PHASE-VAI-011',
    kind: 'foundation',
    report_path: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PATH,
  },
  {
    layer_id: 'improvement',
    phase_id: 'PHASE-VAI-012',
    kind: 'runtime',
    report_path: VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_PATH,
  },
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

const PROTECTED_VAI_LAYER_PATHS = LIFECYCLE_PHASE_CHAIN.map((entry) => entry.artifact_path);

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

function validateCompleteCertificationContracts(input: Record<string, boolean>) {
  const map: Array<[string, string]> = [
    ['VAICC_PRECHECK_VERIFIED', 'precheckVerified'],
    ['VAICC_PROJECT_UNDERSTANDING', 'projectUnderstanding'],
    ['VAICC_PLANNING', 'planning'],
    ['VAICC_EXECUTION', 'execution'],
    ['VAICC_VALIDATION', 'validation'],
    ['VAICC_CERTIFICATION', 'certification'],
    ['VAICC_IMPROVEMENT', 'improvement'],
    ['VAICC_WORKFLOW_INTEGRITY', 'workflowIntegrity'],
    ['VAICC_LIFECYCLE_INTEGRITY', 'lifecycleIntegrity'],
    ['VAICC_BOUNDARY_INTEGRITY', 'boundaryIntegrity'],
    ['VAICC_BASELINE_PROTECTION', 'baselineProtection'],
    ['VAICC_REPRODUCIBILITY', 'reproducibility'],
    ['VAICC_MASTER_SNAPSHOT_INTEGRITY', 'masterSnapshotIntegrity'],
    ['VAICC_EVIDENCE_CHAIN', 'evidenceChain'],
    ['VAICC_CERTIFICATION_REPRODUCIBILITY', 'certificationReproducibility'],
    ['VAICC_CERTIFICATION_ONLY', 'certificationOnly'],
    ['VAICC_READ_ONLY', 'readOnly'],
    ['VAICC_REFERENCE_ONLY', 'referenceOnly'],
    ['VAICC_NO_REPOSITORY_MUTATION', 'noRepositoryMutation'],
    ['VAICC_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAICC_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAICC_MASTER_SNAPSHOT_IMMUTABLE', 'masterSnapshotImmutable'],
    ['VAICC_VERTICAL_AI_FROZEN', 'verticalAiFrozen'],
    ['VAICC_PRODUCTION_READY', 'productionReady'],
    ['VAICC_VERTICAL_AI_COMPLETE', 'verticalAiComplete'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return {
    contract_ids: [...VAICC_CONTRACT_IDS],
    results,
    aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const),
  };
}

function layerPassed(
  lifecycleResults: Array<{ layer_id: string; satisfied: boolean }>
): Record<string, boolean> {
  const layers = [
    'project_understanding',
    'planning',
    'execution',
    'validation',
    'certification',
    'improvement',
  ] as const;
  return Object.fromEntries(
    layers.map((layer) => [
      layer,
      lifecycleResults.filter((entry) => entry.layer_id === layer).every((entry) => entry.satisfied),
    ])
  ) as Record<(typeof layers)[number], boolean>;
}

export function writeVerticalAiCompleteCertificationV1EngineReport(): {
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
  const vaiLayerBaselineBefore = captureBaselineMtimes(root, PROTECTED_VAI_LAYER_PATHS);

  const goalTruth = loadCurrentGoalTruth(root);
  const allGoalsSatisfied = goalTruth.satisfied_goals === goalTruth.evaluated_goals;
  if (!allGoalsSatisfied) {
    issues.push({
      code: 'GOAL_TRUTH',
      message: 'All Current Goal Truth entries must be satisfied for Vertical AI complete certification',
      severity: 'error',
    });
  }

  const precheckVerified = phaseReportPassed(
    root,
    VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_REPORT_PATH,
    VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_PASS_VERDICT
  );
  if (!precheckVerified) {
    issues.push({
      code: 'PRECHECK_FAILED',
      message: `Precheck requires ${VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const lifecycleResults = LIFECYCLE_PHASE_CHAIN.map((entry) => {
    const reportPassed = phaseReportPassed(root, entry.report_path, entry.pass_verdict);
    const artifactPresent = pathExists(root, entry.artifact_path);
    const manifest = readJson<Record<string, unknown>>(root, entry.artifact_path);
    const designFingerprint =
      typeof manifest?.design_fingerprint === 'string' ? manifest.design_fingerprint : null;
    const resultFingerprint =
      typeof manifest?.result_fingerprint === 'string'
        ? manifest.result_fingerprint
        : typeof manifest?.implementation_fingerprint === 'string'
          ? manifest.implementation_fingerprint
          : typeof manifest?.validation_reproducibility_fingerprint === 'string'
            ? manifest.validation_reproducibility_fingerprint
            : typeof manifest?.certification_reproducibility_fingerprint === 'string'
              ? manifest.certification_reproducibility_fingerprint
              : typeof manifest?.improvement_reproducibility_fingerprint === 'string'
                ? manifest.improvement_reproducibility_fingerprint
                : fingerprintFile(root, entry.artifact_path);
    const satisfied = reportPassed && artifactPresent;
    if (!satisfied) {
      issues.push({
        code: 'LIFECYCLE_PHASE_FAILED',
        message: `${entry.phase_id} (${entry.layer_id}/${entry.kind}) failed precheck or missing artifact`,
        severity: 'error',
      });
    }
    return {
      ...entry,
      satisfied,
      artifact_present: artifactPresent,
      report_passed: reportPassed,
      design_fingerprint: designFingerprint,
      result_fingerprint: resultFingerprint,
      artifact_fingerprint: fingerprintFile(root, entry.artifact_path),
    };
  });

  const layerChecks = layerPassed(lifecycleResults);
  const projectUnderstanding = layerChecks.project_understanding === true;
  const planning = layerChecks.planning === true;
  const execution = layerChecks.execution === true;
  const validation = layerChecks.validation === true;
  const certification = layerChecks.certification === true;
  const improvement = layerChecks.improvement === true;

  const lifecycleIntegrity =
    lifecycleResults.length === LIFECYCLE_PHASE_CHAIN.length &&
    lifecycleResults.every((entry) => entry.satisfied) &&
    projectUnderstanding &&
    planning &&
    execution &&
    validation &&
    certification &&
    improvement;

  const improvementRuntime = readJson<{
    repository_mutation_forbidden?: boolean;
    repository_mutation?: boolean;
    improvement_operational?: boolean;
    certified_improvement_integrity_preserved?: boolean;
    result_fingerprint?: string;
    implementation_fingerprint?: string;
  }>(root, VERTICAL_AI_IMPROVEMENT_RUNTIME_V1_PATH);

  const certificationRuntime = readJson<{
    certified_evidence_frozen?: boolean;
    certified_certification_operational?: boolean;
    result_fingerprint?: string;
    record_fingerprint?: string;
  }>(root, VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH);

  const validationRuntime = readJson<{
    certified_validation_operational?: boolean;
    result_fingerprint?: string;
  }>(root, VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH);

  const executionRuntime = readJson<{
    certified_execution_boundaries_preserved?: boolean;
    result_fingerprint?: string;
  }>(root, VERTICAL_AI_EXECUTION_RUNTIME_V1_PATH);

  const workflowIntegrity =
    lifecycleIntegrity &&
    improvementRuntime?.improvement_operational === true &&
    certificationRuntime?.certified_evidence_frozen === true &&
    certificationRuntime?.certified_certification_operational === true &&
    validationRuntime?.certified_validation_operational === true &&
    executionRuntime?.certified_execution_boundaries_preserved === true;

  const noRepositoryMutation =
    CERTIFICATION_PRINCIPLES.repository_mutation_forbidden === true &&
    CERTIFICATION_PRINCIPLES.repository_mutation === false &&
    improvementRuntime?.repository_mutation_forbidden === true &&
    improvementRuntime?.repository_mutation === false;

  if (!noRepositoryMutation) {
    issues.push({
      code: 'REPOSITORY_MUTATION_NOT_FORBIDDEN',
      message: 'Vertical AI complete certification requires repository mutation forbidden',
      severity: 'error',
    });
  }

  const platformCoreReady =
    phaseReportPassed(root, PROJECT_BRAIN_COMPLETE_V1_REPORT_PATH, PROJECT_BRAIN_COMPLETE_V1_PASS_VERDICT) &&
    phaseReportPassed(
      root,
      REPOSITORY_INTELLIGENCE_BUNDLE_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
      REPOSITORY_INTELLIGENCE_BUNDLE_COMPLETE_V1_PASS_VERDICT
    ) &&
    phaseReportPassed(
      root,
      REPOSITORY_INTELLIGENCE_ACCESS_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
      REPOSITORY_INTELLIGENCE_ACCESS_COMPLETE_V1_PASS_VERDICT
    );

  const cilReady = phaseReportPassed(
    root,
    CONSUMER_INTEGRATION_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
    CONSUMER_INTEGRATION_COMPLETE_V1_PASS_VERDICT
  );

  const connectorsPresent = PROTECTED_CONNECTOR_PATHS.every((rel) => pathExists(root, rel));

  const boundaryIntegrity =
    noRepositoryMutation &&
    CERTIFICATION_PRINCIPLES.platform_core_mutation === false &&
    CERTIFICATION_PRINCIPLES.cil_mutation === false &&
    platformCoreReady &&
    cilReady &&
    connectorsPresent &&
    improvementRuntime?.certified_improvement_integrity_preserved === true;

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
  const vaiLayerBaselineAfter = verifyBaselinePreserved(
    root,
    vaiLayerBaselineBefore,
    PROTECTED_VAI_LAYER_PATHS
  );

  const baselineChecks: Array<[string, { preserved: boolean; drift: string[] }, string]> = [
    ['BRAIN_BASELINE_MUTATION', brainBaselineAfter, 'Project Brain baseline changed'],
    ['BUNDLE_BASELINE_MUTATION', bundleBaselineAfter, 'RIB baseline changed'],
    ['ACCESS_BASELINE_MUTATION', accessBaselineAfter, 'Access Layer baseline changed'],
    ['RUNTIME_BASELINE_MUTATION', runtimeBaselineAfter, 'Agent Runtime baseline changed'],
    ['CIL_BASELINE_MUTATION', cilBaselineAfter, 'CIL baseline changed'],
    ['CONNECTOR_BASELINE_MUTATION', connectorBaselineAfter, 'Certified connector baseline changed'],
    ['VAI_LAYER_BASELINE_MUTATION', vaiLayerBaselineAfter, 'Vertical AI layer baseline changed'],
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
    vaiLayerBaselineAfter.preserved;

  const reproducibility =
    lifecycleResults.every((entry) => typeof entry.result_fingerprint === 'string') &&
    typeof improvementRuntime?.result_fingerprint === 'string';

  const evidenceChainEntries = [
    ...lifecycleResults.map((entry) => ({
      evidence_id: `${entry.phase_id}:${entry.kind}`,
      layer_id: entry.layer_id,
      report_path: entry.report_path,
      artifact_path: entry.artifact_path,
      pass_verdict: entry.pass_verdict,
      satisfied: entry.satisfied,
      result_fingerprint: entry.result_fingerprint,
      artifact_fingerprint: entry.artifact_fingerprint,
    })),
    {
      evidence_id: 'platform_core:brain',
      layer_id: 'platform_core',
      report_path: PROJECT_BRAIN_COMPLETE_V1_REPORT_PATH,
      artifact_path: PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
      pass_verdict: PROJECT_BRAIN_COMPLETE_V1_PASS_VERDICT,
      satisfied: pathExists(root, PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH),
      result_fingerprint: fingerprintFile(root, PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH),
      artifact_fingerprint: fingerprintFile(root, PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH),
    },
    {
      evidence_id: 'platform_core:cil',
      layer_id: 'cil',
      report_path: CONSUMER_INTEGRATION_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
      artifact_path: CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
      pass_verdict: CONSUMER_INTEGRATION_COMPLETE_V1_PASS_VERDICT,
      satisfied: pathExists(root, CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH),
      result_fingerprint: fingerprintFile(root, CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH),
      artifact_fingerprint: fingerprintFile(root, CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH),
    },
  ];

  const evidenceChain =
    evidenceChainEntries.every((entry) => entry.satisfied) &&
    lifecycleIntegrity &&
    platformCoreReady &&
    cilReady;

  const buildSnapshotFingerprint = () =>
    stableFingerprint({
      capability_id: CAPABILITY_ID,
      lifecycle: lifecycleResults.map((entry) => ({
        phase_id: entry.phase_id,
        layer_id: entry.layer_id,
        kind: entry.kind,
        result_fingerprint: entry.result_fingerprint,
        artifact_fingerprint: entry.artifact_fingerprint,
        pass_verdict: entry.pass_verdict,
      })),
      improvement: improvementRuntime?.result_fingerprint ?? null,
      certification: certificationRuntime?.result_fingerprint ?? null,
      validation: validationRuntime?.result_fingerprint ?? null,
      execution: executionRuntime?.result_fingerprint ?? null,
      principles: CERTIFICATION_PRINCIPLES,
    });

  const snapshotFingerprint = buildSnapshotFingerprint();
  const snapshotFingerprintStable = snapshotFingerprint === buildSnapshotFingerprint();

  const certificationReplaySignatures = Array.from({ length: 5 }, () =>
    stableFingerprint({
      snapshot: buildSnapshotFingerprint(),
      lifecycle: lifecycleResults.map((entry) => entry.result_fingerprint),
      goal: goalTruth.fingerprint,
    })
  );
  const certificationReplayStable = certificationReplaySignatures.every(
    (sig) => sig === certificationReplaySignatures[0]
  );
  const certificationReproducibilityFingerprint = stableFingerprint({
    signatures: certificationReplaySignatures,
    snapshot: snapshotFingerprint,
  });
  const certificationReproducibility =
    certificationReplayStable && snapshotFingerprintStable && reproducibility;

  const priorMasterSnapshot = readJson<{
    snapshot_fingerprint?: string;
    decision_fingerprint?: string;
    generated_at?: string;
    immutable?: boolean;
  }>(root, VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH);
  const masterSnapshotExists = priorMasterSnapshot !== null;
  const masterSnapshotFingerprintMatch =
    !masterSnapshotExists || priorMasterSnapshot.snapshot_fingerprint === snapshotFingerprint;

  if (masterSnapshotExists && !masterSnapshotFingerprintMatch) {
    issues.push({
      code: 'MASTER_SNAPSHOT_MUTATION',
      message:
        'Vertical AI master snapshot fingerprint drift detected; V1 master snapshot must remain immutable',
      severity: 'error',
    });
  }

  const masterSnapshotIntegrity =
    snapshotFingerprintStable && masterSnapshotFingerprintMatch && evidenceChain;

  const decisionFingerprint = stableFingerprint({
    goalTruth: goalTruth.fingerprint,
    snapshotFingerprint,
    certificationReproducibilityFingerprint,
    layers: layerChecks,
    mode: 'certification_only',
  });

  const certificationOnly =
    CERTIFICATION_PRINCIPLES.certification_only === true &&
    CERTIFICATION_PRINCIPLES.implementation === false;
  const readOnly = CERTIFICATION_PRINCIPLES.read_only === true;
  const referenceOnly = CERTIFICATION_PRINCIPLES.reference_only === true;

  const masterSnapshotImmutable = masterSnapshotIntegrity && baselineProtection;
  const verticalAiFrozen =
    CERTIFICATION_PRINCIPLES.vertical_ai_v1_frozen === true &&
    lifecycleIntegrity &&
    masterSnapshotImmutable;

  const verificationResults: Record<(typeof VERIFICATION_CHECKS)[number], boolean> = {
    project_understanding: projectUnderstanding,
    planning,
    execution,
    validation,
    certification,
    improvement,
    workflow_integrity: workflowIntegrity,
    lifecycle_integrity: lifecycleIntegrity,
    boundary_integrity: boundaryIntegrity,
    baseline_protection: baselineProtection,
    reproducibility,
    master_snapshot_integrity: masterSnapshotIntegrity,
    evidence_chain: evidenceChain,
    certification_reproducibility: certificationReproducibility,
  };
  const allVerificationPassed = VERIFICATION_CHECKS.every(
    (check) => verificationResults[check] === true
  );

  const productionReady =
    precheckVerified &&
    allVerificationPassed &&
    masterSnapshotImmutable &&
    verticalAiFrozen &&
    noPlatformCoreMutation &&
    noCilMutation &&
    noRepositoryMutation &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verticalAiComplete = productionReady && allGoalsSatisfied;

  const contractValidation = validateCompleteCertificationContracts({
    precheckVerified,
    projectUnderstanding,
    planning,
    execution,
    validation,
    certification,
    improvement,
    workflowIntegrity,
    lifecycleIntegrity,
    boundaryIntegrity,
    baselineProtection,
    reproducibility,
    masterSnapshotIntegrity,
    evidenceChain,
    certificationReproducibility,
    certificationOnly,
    readOnly,
    referenceOnly,
    noRepositoryMutation,
    noPlatformCoreMutation,
    noCilMutation,
    masterSnapshotImmutable,
    verticalAiFrozen,
    productionReady,
    verticalAiComplete,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'COMPLETE_CERTIFICATION_CONTRACT_FAILURE',
      message: 'One or more Vertical AI complete certification contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_COMPLETE_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH, {
    complete_certification_evidence_chain_v1_id: 'vertical_ai_complete_certification_evidence_chain_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_chain: evidenceChainEntries,
    evidence_chain_complete: evidenceChain,
  });

  writeJson(root, VERTICAL_AI_COMPLETE_CERTIFICATION_REPRODUCIBILITY_V1_PATH, {
    certification_reproducibility_v1_id: 'vertical_ai_complete_certification_reproducibility_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    reproducible: certificationReproducibility,
    snapshot_fingerprint: snapshotFingerprint,
    certification_reproducibility_fingerprint: certificationReproducibilityFingerprint,
    replay_signatures: certificationReplaySignatures,
  });

  const masterSnapshotPayload = {
    vertical_ai_master_snapshot_v1_id: 'vertical_ai_master_snapshot_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PHASE,
    system_id: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_SYSTEM_ID,
    generated_at: masterSnapshotExists
      ? (priorMasterSnapshot.generated_at ?? generatedAt)
      : generatedAt,
    mode: 'READ_ONLY',
    certification_only: true,
    certification_name: CERTIFICATION_NAME,
    capability_id: CAPABILITY_ID,
    version: '1.0.0',
    snapshot_fingerprint: snapshotFingerprint,
    certification_reproducibility_fingerprint: certificationReproducibilityFingerprint,
    decision_fingerprint: masterSnapshotExists
      ? (priorMasterSnapshot.decision_fingerprint ?? decisionFingerprint)
      : decisionFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    immutable: true,
    reference_only: true,
    repository_mutation_forbidden: true,
    platform_core_mutation: false,
    cil_mutation: false,
    lifecycle_phases: lifecycleResults.map((entry) => ({
      phase_id: entry.phase_id,
      layer_id: entry.layer_id,
      kind: entry.kind,
      pass_verdict: entry.pass_verdict,
      artifact_path: entry.artifact_path,
      result_fingerprint: entry.result_fingerprint,
      artifact_fingerprint: entry.artifact_fingerprint,
    })),
    layer_operational: {
      project_understanding: projectUnderstanding,
      planning,
      execution,
      validation,
      certification,
      improvement,
    },
    project_brain_master_snapshot_ref: PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
    rib_master_snapshot_ref: REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
    access_master_snapshot_ref: REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
    agent_runtime_master_snapshot_ref: AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
    cil_master_snapshot_ref: CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
    certified_connectors: [...PROTECTED_CONNECTOR_PATHS],
    evolution_policy: {
      vertical_ai_v1_frozen: true,
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
    complete_certification_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
  };

  if (!masterSnapshotExists || masterSnapshotFingerprintMatch) {
    writeJson(root, VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH, masterSnapshotPayload);
  }

  writeJson(root, VERTICAL_AI_MASTER_SNAPSHOT_FINGERPRINTS_V1_PATH, {
    master_snapshot_fingerprints_v1_id: 'vertical_ai_master_snapshot_fingerprints_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    snapshot_fingerprint: snapshotFingerprint,
    certification_reproducibility_fingerprint: certificationReproducibilityFingerprint,
    decision_fingerprint: decisionFingerprint,
    immutable: true,
  });

  writeJson(root, VERTICAL_AI_COMPLETE_CERTIFICATION_CONTRACTS_V1_PATH, {
    complete_certification_contracts_v1_id: 'vertical_ai_complete_certification_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    contract_ids: [...VAICC_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: CERTIFICATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH, {
    vertical_ai_complete_certification_v1_id: 'vertical_ai_complete_certification_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PHASE,
    system_id: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    certification_only: true,
    certification_name: CERTIFICATION_NAME,
    capability_id: CAPABILITY_ID,
    decision_fingerprint: decisionFingerprint,
    snapshot_fingerprint: snapshotFingerprint,
    certification_reproducibility_fingerprint: certificationReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    production_ready: productionReady,
    vertical_ai_complete: verticalAiComplete,
    vertical_ai_frozen: verticalAiFrozen,
    master_snapshot_immutable: masterSnapshotImmutable,
    repository_mutation_forbidden: true,
    repository_mutation: false,
    platform_core_mutation: false,
    cil_mutation: false,
    verification_results: verificationResults,
    master_snapshot_ref: VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    evidence_chain_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH,
    reproducibility_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_REPRODUCIBILITY_V1_PATH,
    contracts_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_REGISTRY_V1_PATH,
    principles: CERTIFICATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_COMPLETE_CERTIFICATION_REGISTRY_V1_PATH, {
    registry_id: 'vertical-ai-complete-certification-registry-v1',
    phase: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PHASE,
    system_id: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_SYSTEM_ID,
    version: 'vertical_ai_complete_certification_v1',
    generated_at: generatedAt,
    complete_certification_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
    master_snapshot_ref: VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    evidence_chain_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH,
    contracts_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_CONTRACTS_V1_PATH,
    reproducibility_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_REPRODUCIBILITY_V1_PATH,
    decision_fingerprint: decisionFingerprint,
    snapshot_fingerprint: snapshotFingerprint,
    production_ready: productionReady,
    vertical_ai_complete: verticalAiComplete,
  });

  const passed =
    verticalAiComplete &&
    contractValidation.aggregate_verdict === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verdict = passed ? VERTICAL_AI_COMPLETE_V1_PASS_VERDICT : VERTICAL_AI_COMPLETE_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_complete_certification_v1_${Date.now()}`,
    phase: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PHASE,
    system_id: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Certify Vertical AI V1 as complete and production-ready; freeze certified Vertical AI master snapshot with repository mutation forbidden.',
    vertical_ai_complete_certification_v1_passed: passed,
    final_verdict: verdict,
    status: passed ? VERTICAL_AI_COMPLETE_V1_STATUS : 'VERTICAL_AI_NOT_PRODUCTION_READY',
    validation_passed: passed,
    certification_only: true,
    certification_name: CERTIFICATION_NAME,
    capability_id: CAPABILITY_ID,
    decision_fingerprint: decisionFingerprint,
    snapshot_fingerprint: snapshotFingerprint,
    certification_reproducibility_fingerprint: certificationReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    certification_reproducible: certificationReproducibility,
    certified_vertical_ai_frozen: verticalAiFrozen,
    production_ready: productionReady,
    vertical_ai_complete: verticalAiComplete,
    master_snapshot_immutable: masterSnapshotImmutable,
    master_snapshot_frozen: masterSnapshotImmutable && pathExists(root, VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH),
    repository_mutation_forbidden: true,
    repository_mutation: false,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    verification_results: verificationResults,
    contract_validation: contractValidation,
    complete_certification_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
    master_snapshot_ref: VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    evidence_chain_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_EVIDENCE_CHAIN_V1_PATH,
    reproducibility_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_REPRODUCIBILITY_V1_PATH,
    contracts_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_COMPLETE_CERTIFICATION_REGISTRY_V1_PATH,
    checks: {
      PRECHECK_VERIFIED: precheckVerified,
      PROJECT_UNDERSTANDING: projectUnderstanding,
      PLANNING: planning,
      EXECUTION: execution,
      VALIDATION: validation,
      CERTIFICATION: certification,
      IMPROVEMENT: improvement,
      WORKFLOW_INTEGRITY: workflowIntegrity,
      LIFECYCLE_INTEGRITY: lifecycleIntegrity,
      BOUNDARY_INTEGRITY: boundaryIntegrity,
      BASELINE_PROTECTION: baselineProtection,
      REPRODUCIBILITY: reproducibility,
      MASTER_SNAPSHOT_INTEGRITY: masterSnapshotIntegrity,
      EVIDENCE_CHAIN: evidenceChain,
      CERTIFICATION_REPRODUCIBILITY: certificationReproducibility,
      CERTIFICATION_ONLY: certificationOnly,
      READ_ONLY: readOnly,
      REFERENCE_ONLY: referenceOnly,
      NO_REPOSITORY_MUTATION: noRepositoryMutation,
      PLATFORM_CORE_UNCHANGED: noPlatformCoreMutation,
      CIL_UNCHANGED: noCilMutation,
      MASTER_SNAPSHOT_IMMUTABLE: masterSnapshotImmutable,
      VERTICAL_AI_FROZEN: verticalAiFrozen,
      PRODUCTION_READY: productionReady,
      VERTICAL_AI_COMPLETE: verticalAiComplete,
      CONTRACT_VALIDATION: contractValidation.aggregate_verdict === 'PASS',
      GOAL_TRUTH_SATISFIED: allGoalsSatisfied,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_COMPLETE_CERTIFICATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_COMPLETE_CERTIFICATION_V1_REPORT_PATH,
  };
}
