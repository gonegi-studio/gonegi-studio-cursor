import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_BRAIN_ARCHITECTURE_VERSION } from './projectBrainFoundationV1.js';
import {
  PROJECT_BRAIN_COMPLETE_V1_PASS_VERDICT,
  PROJECT_BRAIN_COMPLETE_V1_PATH,
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
  REPOSITORY_INTELLIGENCE_BUNDLE_COMPLETE_V1_PASS_VERDICT,
  REPOSITORY_INTELLIGENCE_BUNDLE_PRODUCTION_CERTIFICATION_V1_PATH,
  REPOSITORY_INTELLIGENCE_BUNDLE_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
  REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
} from './repositoryIntelligenceBundleProductionCertificationV1Engine.js';
import {
  REPOSITORY_INTELLIGENCE_ACCESS_CONTRACT_V1_PATH,
  REPOSITORY_INTELLIGENCE_ACCESS_API_V1_PATH,
} from './repositoryIntelligenceAccessContractV1Engine.js';
import { REPOSITORY_INTELLIGENCE_ACCESS_V1_PATH } from './repositoryIntelligenceAccessImplementationV1Engine.js';
import {
  REPOSITORY_INTELLIGENCE_ACCESS_COMPLETE_V1_PASS_VERDICT,
  REPOSITORY_INTELLIGENCE_ACCESS_PRODUCTION_CERTIFICATION_V1_PATH,
  REPOSITORY_INTELLIGENCE_ACCESS_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
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
  CONSUMER_INTEGRATION_COMPLETE_V1_PASS_VERDICT,
  CONSUMER_INTEGRATION_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
} from './consumerIntegrationProductionCertificationV1Engine.js';
import {
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
  VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PASS_VERDICT,
  VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPORT_PATH,
} from './verticalAiProjectUnderstandingRuntimeV1Engine.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE = 'PHASE-VAI-003' as const;
export const VERTICAL_AI_PLANNING_FOUNDATION_V1_SYSTEM_ID = 'VERTICAL_AI_PLANNING_FOUNDATION_V1' as const;
export const VERTICAL_AI_PLANNING_FOUNDATION_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_PLANNING_FOUNDATION_V1' as const;
export const VERTICAL_AI_PLANNING_FOUNDATION_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_PLANNING_FOUNDATION_V1' as const;
export const VERTICAL_AI_PLANNING_FOUNDATION_V1_STATUS = 'VERTICAL_AI_PLANNING_DEFINED' as const;

export const VERTICAL_AI_PLANNING_FOUNDATION_V1_DIR = 'datasets/vertical_ai_planning_foundation_v1' as const;
export const VERTICAL_AI_PLANNING_FOUNDATION_V1_PATH =
  `${VERTICAL_AI_PLANNING_FOUNDATION_V1_DIR}/vertical-ai-planning-foundation-v1.json` as const;
export const VERTICAL_AI_PLANNING_ARCHITECTURE_V1_PATH =
  `${VERTICAL_AI_PLANNING_FOUNDATION_V1_DIR}/planning-architecture-v1.json` as const;
export const VERTICAL_AI_PLANNING_COMPONENT_MODEL_V1_PATH =
  `${VERTICAL_AI_PLANNING_FOUNDATION_V1_DIR}/planning-component-model-v1.json` as const;
export const VERTICAL_AI_PLANNING_WORKFLOW_V1_PATH =
  `${VERTICAL_AI_PLANNING_FOUNDATION_V1_DIR}/planning-workflow-v1.json` as const;
export const VERTICAL_AI_PLANNING_BOUNDARY_MODEL_V1_PATH =
  `${VERTICAL_AI_PLANNING_FOUNDATION_V1_DIR}/planning-boundary-model-v1.json` as const;
export const VERTICAL_AI_PLANNING_CONTRACTS_V1_PATH =
  `${VERTICAL_AI_PLANNING_FOUNDATION_V1_DIR}/planning-contracts-v1.json` as const;
export const VERTICAL_AI_PLANNING_REGISTRY_V1_PATH =
  `${VERTICAL_AI_PLANNING_FOUNDATION_V1_DIR}/planning-registry-v1.json` as const;
export const VERTICAL_AI_PLANNING_APPROVAL_GATE_V1_PATH =
  `${VERTICAL_AI_PLANNING_FOUNDATION_V1_DIR}/planning-approval-gate-v1.json` as const;
export const VERTICAL_AI_PLANNING_EVIDENCE_MODEL_V1_PATH =
  `${VERTICAL_AI_PLANNING_FOUNDATION_V1_DIR}/planning-evidence-model-v1.json` as const;
export const VERTICAL_AI_PLANNING_TRACEABILITY_V1_PATH =
  `${VERTICAL_AI_PLANNING_FOUNDATION_V1_DIR}/planning-traceability-v1.json` as const;
export const VERTICAL_AI_PLANNING_FOUNDATION_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_PLANNING_FOUNDATION_V1_REPORT.json' as const;

const FOUNDATION_NAME = 'Evidence-Bound Vertical AI Planning Foundation V1' as const;
const CAPABILITY_ID = 'vertical_ai_planning' as const;
const LAYER_ID = 'planning' as const;

export const VAIPF_CONTRACT_IDS = [
  'VAIPF_UNDERSTANDING_RUNTIME_VERIFIED',
  'VAIPF_CIL_COMPLETE_VERIFIED',
  'VAIPF_PLATFORM_CORE_READY',
  'VAIPF_REPOSITORY_INTELLIGENCE_READY',
  'VAIPF_COMPONENTS_DEFINED',
  'VAIPF_EVIDENCE_FIRST_PLANNING',
  'VAIPF_REPOSITORY_FIRST',
  'VAIPF_REUSE_BEFORE_CREATE',
  'VAIPF_EVIDENCE_TO_PLAN_TRACEABILITY',
  'VAIPF_PLAN_REPRODUCIBILITY',
  'VAIPF_HUMAN_APPROVAL_BEFORE_WRITE',
  'VAIPF_CONSUMES_PLATFORM_CORE_V1_ONLY',
  'VAIPF_CONSUMES_CIL_V1_ONLY',
  'VAIPF_CONSUMES_REPOSITORY_INTELLIGENCE_ONLY',
  'VAIPF_DESIGN_ONLY',
  'VAIPF_READ_ONLY',
  'VAIPF_REFERENCE_ONLY',
  'VAIPF_NO_SOURCE_DATA_OWNERSHIP',
  'VAIPF_NO_PLATFORM_CORE_MUTATION',
  'VAIPF_NO_CIL_MUTATION',
  'VAIPF_NO_REPOSITORY_MUTATION',
  'VAIPF_READY_FOR_PLANNING_RUNTIME',
  'VAIPF_FOUNDATION_READY',
] as const;

const REQUIRED_COMPONENT_IDS = [
  'goal_analysis',
  'planning_context',
  'candidate_generation',
  'reuse_planning',
  'implementation_planning',
  'risk_analysis',
  'execution_plan',
  'plan_validation',
  'planning_evidence',
  'plan_reproducibility',
  'approval_gate',
  'plan_traceability',
] as const;

/**
 * Vertical AI Planning is the design-only capacity that turns repository understanding
 * and evidence into reproducible plans. Planning never mutates Platform Core, CIL, or the
 * repository; reuse precedes create; evidence precedes plan conclusions; human approval
 * gates any write.
 */
const PLANNING_COMPONENTS = [
  {
    component_id: 'goal_analysis',
    name: 'Goal Analysis',
    responsibility:
      'Analyze active goal truth against repository understanding evidence so planning starts from certified goals, not invented intent.',
    interface_kind: 'analysis',
    owns_source_data: false,
    mode: 'evidence_bound',
    write_authorized: false,
  },
  {
    component_id: 'planning_context',
    name: 'Planning Context',
    responsibility:
      'Assemble a read-only planning context from Platform Core, CIL, Repository Intelligence, and Project Understanding Runtime outputs without owning source data.',
    interface_kind: 'context',
    owns_source_data: false,
    mode: 'reference_only',
    write_authorized: false,
  },
  {
    component_id: 'candidate_generation',
    name: 'Candidate Generation',
    responsibility:
      'Generate plan candidates from gaps and understanding evidence; candidates prefer reuse surfaces and never execute repository writes.',
    interface_kind: 'generation',
    owns_source_data: false,
    mode: 'evidence_bound',
    write_authorized: false,
  },
  {
    component_id: 'reuse_planning',
    name: 'Reuse Planning',
    responsibility:
      'Prioritize reuse-plan steps over create-plan steps; enforces reuse-before-create for every candidate that reaches implementation planning.',
    interface_kind: 'planning',
    owns_source_data: false,
    mode: 'reuse_first',
    write_authorized: false,
  },
  {
    component_id: 'implementation_planning',
    name: 'Implementation Planning',
    responsibility:
      'Shape implementation plan descriptors only after reuse planning; descriptors are design artifacts and do not authorize mutation.',
    interface_kind: 'planning',
    owns_source_data: false,
    mode: 'design_only',
    write_authorized: false,
  },
  {
    component_id: 'risk_analysis',
    name: 'Risk Analysis',
    responsibility:
      'Identify planning risks (baseline drift, unapproved write, weak evidence, create-before-reuse) as evidence-bound risk records.',
    interface_kind: 'analysis',
    owns_source_data: false,
    mode: 'evidence_only',
    write_authorized: false,
  },
  {
    component_id: 'execution_plan',
    name: 'Execution Plan',
    responsibility:
      'Compose an ordered execution plan for Agent Runtime handoff; the plan describes orchestration requests and never performs domain mutation itself.',
    interface_kind: 'plan',
    owns_source_data: false,
    mode: 'orchestration_descriptor',
    write_authorized: false,
  },
  {
    component_id: 'plan_validation',
    name: 'Plan Validation',
    responsibility:
      'Validate plan structure, evidence citations, reuse precedence, and gate readiness before any approval or runtime handoff.',
    interface_kind: 'validation',
    owns_source_data: false,
    mode: 'evidence_bound',
    write_authorized: false,
  },
  {
    component_id: 'planning_evidence',
    name: 'Planning Evidence',
    responsibility:
      'Bind fingerprints and refs so every plan conclusion is preceded by understanding and Platform Core evidence.',
    interface_kind: 'evidence',
    owns_source_data: false,
    mode: 'evidence_only',
    write_authorized: false,
  },
  {
    component_id: 'plan_reproducibility',
    name: 'Plan Reproducibility',
    responsibility:
      'Ensure identical evidence inputs yield identical plan fingerprints across dual runs; planning design must be deterministic.',
    interface_kind: 'reproducibility',
    owns_source_data: false,
    mode: 'deterministic',
    write_authorized: false,
  },
  {
    component_id: 'approval_gate',
    name: 'Approval Gate',
    responsibility:
      'Require explicit human approval before any write action arising from a plan; foundation/design planning runs remain read-only.',
    interface_kind: 'gate',
    owns_source_data: false,
    mode: 'human_approval_required',
    write_authorized: false,
  },
  {
    component_id: 'plan_traceability',
    name: 'Plan Traceability',
    responsibility:
      'Maintain evidence-to-plan traceability from goal analysis through candidates, reuse, risks, execution plan, and validation.',
    interface_kind: 'traceability',
    owns_source_data: false,
    mode: 'evidence_to_plan',
    write_authorized: false,
  },
] as const;

const FOUNDATION_PRINCIPLES = {
  design_only: true,
  implementation: false,
  implementation_deferred: true,
  read_only: true,
  reference_only: true,
  repository_first: true,
  reuse_precedes_creation: true,
  evidence_first_planning: true,
  evidence_to_plan_traceability: true,
  plan_reproducibility: true,
  human_approval_required_before_write: true,
  consumes_platform_core_v1_only: true,
  consumes_cil_v1_only: true,
  consumes_repository_intelligence_only: true,
  consumes_understanding_runtime: true,
  owns_source_data: false,
  platform_core_mutation: false,
  cil_mutation: false,
  repository_mutation: false,
  planning_runtime_deferred: true,
  independently_evolvable: true,
} as const;

const EXECUTION_FLAGS = {
  ...FOUNDATION_PRINCIPLES,
  execute_authorized: false as const,
  write_authorized: false as const,
};

const EVIDENCE_FIRST_PLANNING_WORKFLOW = {
  workflow_id: 'evidence_first_planning_v1',
  policy: 'evidence_first_planning',
  reuse_policy: 'reuse_before_create',
  repository_policy: 'repository_first',
  evidence_policy: 'evidence_precedes_plan_conclusions',
  write_policy: 'human_approval_required_before_any_write',
  traceability_policy: 'evidence_to_plan',
  steps: [
    { step_id: 'analyze_goals', component_id: 'goal_analysis', write: false },
    { step_id: 'build_context', component_id: 'planning_context', write: false },
    { step_id: 'generate_candidates', component_id: 'candidate_generation', write: false },
    { step_id: 'plan_reuse', component_id: 'reuse_planning', write: false },
    { step_id: 'plan_implementation', component_id: 'implementation_planning', write: false },
    { step_id: 'analyze_risks', component_id: 'risk_analysis', write: false },
    { step_id: 'compose_execution_plan', component_id: 'execution_plan', write: false },
    { step_id: 'validate_plan', component_id: 'plan_validation', write: false },
    { step_id: 'bind_evidence', component_id: 'planning_evidence', write: false },
    { step_id: 'trace_plan', component_id: 'plan_traceability', write: false },
    { step_id: 'check_reproducibility', component_id: 'plan_reproducibility', write: false },
    {
      step_id: 'approval',
      component_id: 'approval_gate',
      write: false,
      blocks_write_until_human_approval: true,
    },
    {
      step_id: 'planning_runtime_handoff',
      deferred: true,
      requires: ['planning_foundation_ready', 'human_approval_if_write'],
    },
  ],
  forbidden_before_evidence: [
    'execute_plan_without_validation',
    'create_before_reuse_planning',
    'write_without_human_approval',
    'mutate_repository',
  ],
} as const;

const PROPOSED_VAI_PHASE_CHAIN = [
  {
    phase_id: 'PHASE-VAI-001',
    title: 'Project Understanding foundation',
    focus: 'Design repository-first understanding',
  },
  {
    phase_id: 'PHASE-VAI-002',
    title: 'Project Understanding runtime',
    focus: 'Implement understanding runtime',
  },
  {
    phase_id: 'PHASE-VAI-003',
    title: 'Planning foundation',
    focus: 'Design evidence-first planning capability',
  },
  {
    phase_id: 'PHASE-VAI-004',
    title: 'Planning runtime',
    focus: 'Implement planning runtime over certified foundation',
  },
] as const;

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

const PROTECTED_UNDERSTANDING_PATHS = [
  VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_WORKFLOW_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_CONTRACTS_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_REGISTRY_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH,
] as const;

const PRECONDITION_EVIDENCE = [
  {
    precondition_id: 'understanding_runtime',
    report_path: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH,
  },
  {
    precondition_id: 'cil_complete',
    report_path: CONSUMER_INTEGRATION_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: CONSUMER_INTEGRATION_COMPLETE_V1_PASS_VERDICT,
    artifact_path: CONSUMER_INTEGRATION_PRODUCTION_CERTIFICATION_V1_PATH,
  },
  {
    precondition_id: 'project_brain_complete',
    report_path: PROJECT_BRAIN_COMPLETE_V1_REPORT_PATH,
    pass_verdict: PROJECT_BRAIN_COMPLETE_V1_PASS_VERDICT,
    artifact_path: PROJECT_BRAIN_COMPLETE_V1_PATH,
  },
  {
    precondition_id: 'repository_intelligence_bundle_complete',
    report_path: REPOSITORY_INTELLIGENCE_BUNDLE_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: REPOSITORY_INTELLIGENCE_BUNDLE_COMPLETE_V1_PASS_VERDICT,
    artifact_path: REPOSITORY_INTELLIGENCE_BUNDLE_PRODUCTION_CERTIFICATION_V1_PATH,
  },
  {
    precondition_id: 'repository_intelligence_access_complete',
    report_path: REPOSITORY_INTELLIGENCE_ACCESS_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: REPOSITORY_INTELLIGENCE_ACCESS_COMPLETE_V1_PASS_VERDICT,
    artifact_path: REPOSITORY_INTELLIGENCE_ACCESS_PRODUCTION_CERTIFICATION_V1_PATH,
  },
] as const;

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

function validateFoundationContracts(input: Record<string, boolean>) {
  const map: Array<[string, string]> = [
    ['VAIPF_UNDERSTANDING_RUNTIME_VERIFIED', 'understandingRuntimeVerified'],
    ['VAIPF_CIL_COMPLETE_VERIFIED', 'cilCompleteVerified'],
    ['VAIPF_PLATFORM_CORE_READY', 'platformCoreReady'],
    ['VAIPF_REPOSITORY_INTELLIGENCE_READY', 'repositoryIntelligenceReady'],
    ['VAIPF_COMPONENTS_DEFINED', 'componentsDefined'],
    ['VAIPF_EVIDENCE_FIRST_PLANNING', 'evidenceFirstPlanning'],
    ['VAIPF_REPOSITORY_FIRST', 'repositoryFirst'],
    ['VAIPF_REUSE_BEFORE_CREATE', 'reuseBeforeCreate'],
    ['VAIPF_EVIDENCE_TO_PLAN_TRACEABILITY', 'evidenceToPlanTraceability'],
    ['VAIPF_PLAN_REPRODUCIBILITY', 'planReproducibility'],
    ['VAIPF_HUMAN_APPROVAL_BEFORE_WRITE', 'humanApprovalBeforeWrite'],
    ['VAIPF_CONSUMES_PLATFORM_CORE_V1_ONLY', 'consumesPlatformCoreV1Only'],
    ['VAIPF_CONSUMES_CIL_V1_ONLY', 'consumesCilV1Only'],
    ['VAIPF_CONSUMES_REPOSITORY_INTELLIGENCE_ONLY', 'consumesRepositoryIntelligenceOnly'],
    ['VAIPF_DESIGN_ONLY', 'designOnly'],
    ['VAIPF_READ_ONLY', 'readOnly'],
    ['VAIPF_REFERENCE_ONLY', 'referenceOnly'],
    ['VAIPF_NO_SOURCE_DATA_OWNERSHIP', 'noSourceDataOwnership'],
    ['VAIPF_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAIPF_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAIPF_NO_REPOSITORY_MUTATION', 'noRepositoryMutation'],
    ['VAIPF_READY_FOR_PLANNING_RUNTIME', 'readyForPlanningRuntime'],
    ['VAIPF_FOUNDATION_READY', 'foundationReady'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return {
    contract_ids: [...VAIPF_CONTRACT_IDS],
    results,
    aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const),
  };
}

export function writeVerticalAiPlanningFoundationV1EngineReport(): {
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
  const understandingBaselineBefore = captureBaselineMtimes(root, PROTECTED_UNDERSTANDING_PATHS);

  const goalTruth = loadCurrentGoalTruth(root);
  const allGoalsSatisfied = goalTruth.satisfied_goals === goalTruth.evaluated_goals;

  const preconditionResults = PRECONDITION_EVIDENCE.map((entry) => {
    const satisfied = phaseReportPassed(root, entry.report_path, entry.pass_verdict);
    const artifactPresent = pathExists(root, entry.artifact_path);
    if (!satisfied) {
      issues.push({
        code: 'PRECONDITION_FAILED',
        message: `Precondition ${entry.precondition_id} failed (expected ${entry.pass_verdict})`,
        severity: 'error',
      });
    }
    if (!artifactPresent) {
      issues.push({
        code: 'PRECONDITION_ARTIFACT_MISSING',
        message: `Precondition artifact missing: ${entry.artifact_path}`,
        severity: 'error',
      });
    }
    return { ...entry, satisfied: satisfied && artifactPresent, artifact_present: artifactPresent };
  });

  const understandingRuntimeVerified =
    preconditionResults.find((entry) => entry.precondition_id === 'understanding_runtime')
      ?.satisfied === true;
  const cilCompleteVerified =
    preconditionResults.find((entry) => entry.precondition_id === 'cil_complete')?.satisfied === true;
  const preconditionsSatisfied = preconditionResults.every((entry) => entry.satisfied);

  const brainComplete = readJson<{ decision_fingerprint?: string; production_ready?: boolean }>(
    root,
    PROJECT_BRAIN_COMPLETE_V1_PATH
  );
  const bundleComplete = readJson<{ decision_fingerprint?: string; bundle_complete?: boolean }>(
    root,
    REPOSITORY_INTELLIGENCE_BUNDLE_PRODUCTION_CERTIFICATION_V1_PATH
  );
  const accessComplete = readJson<{ decision_fingerprint?: string; access_complete?: boolean }>(
    root,
    REPOSITORY_INTELLIGENCE_ACCESS_PRODUCTION_CERTIFICATION_V1_PATH
  );
  const understandingRuntime = readJson<{
    decision_fingerprint?: string;
    runtime_implemented?: boolean;
    ready_for_planning?: boolean;
    result_fingerprint?: string;
  }>(root, VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH);

  if (brainComplete?.production_ready !== true) {
    issues.push({
      code: 'PLATFORM_CORE_BRAIN_NOT_READY',
      message: 'Project Brain must be production-ready',
      severity: 'error',
    });
  }
  if (bundleComplete?.bundle_complete !== true) {
    issues.push({
      code: 'REPOSITORY_INTELLIGENCE_BUNDLE_NOT_COMPLETE',
      message: 'RIB V1 must be production-complete',
      severity: 'error',
    });
  }
  if (accessComplete?.access_complete !== true) {
    issues.push({
      code: 'REPOSITORY_INTELLIGENCE_ACCESS_NOT_COMPLETE',
      message: 'Access Layer V1 must be production-complete',
      severity: 'error',
    });
  }
  if (understandingRuntime?.runtime_implemented !== true) {
    issues.push({
      code: 'UNDERSTANDING_RUNTIME_NOT_IMPLEMENTED',
      message: 'Project Understanding Runtime must be implemented',
      severity: 'error',
    });
  }

  const consumedRefs = {
    platform_core: {
      project_brain_master_snapshot_ref: PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
      bundle_master_snapshot_ref: REPOSITORY_INTELLIGENCE_BUNDLE_MASTER_SNAPSHOT_V1_PATH,
      access_master_snapshot_ref: REPOSITORY_INTELLIGENCE_ACCESS_MASTER_SNAPSHOT_V1_PATH,
      runtime_master_snapshot_ref: AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
    },
    cil: {
      consumer_integration_master_snapshot_ref: CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
      connector_contract_ref: CONSUMER_CONNECTOR_CONTRACT_V1_PATH,
      consumer_profile_ref: CONSUMER_PROFILE_V1_PATH,
      runtime_connector_ref: RUNTIME_CONNECTOR_V1_PATH,
    },
    repository_intelligence: {
      bundle_ref: REPOSITORY_INTELLIGENCE_BUNDLE_V1_PATH,
      access_contract_ref: REPOSITORY_INTELLIGENCE_ACCESS_CONTRACT_V1_PATH,
      access_api_ref: REPOSITORY_INTELLIGENCE_ACCESS_API_V1_PATH,
      access_impl_ref: REPOSITORY_INTELLIGENCE_ACCESS_V1_PATH,
    },
    understanding: {
      foundation_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
      runtime_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_RUNTIME_V1_PATH,
      runtime_result_fingerprint: understandingRuntime?.result_fingerprint ?? null,
    },
    reference_mode: 'read_only' as const,
    duplication_policy: 'references_only' as const,
    mutation_policy: 'never_mutate_platform_core_cil_or_repository' as const,
  };

  const designFingerprint = stableFingerprint({
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    components: PLANNING_COMPONENTS,
    principles: FOUNDATION_PRINCIPLES,
    workflow: EVIDENCE_FIRST_PLANNING_WORKFLOW,
    phase_chain: PROPOSED_VAI_PHASE_CHAIN,
  });

  const decisionFingerprint = stableFingerprint({
    goalTruthFingerprint: goalTruth.fingerprint,
    understandingDecision: understandingRuntime?.decision_fingerprint ?? null,
    brainDecision: brainComplete?.decision_fingerprint ?? null,
    bundleDecision: bundleComplete?.decision_fingerprint ?? null,
    accessDecision: accessComplete?.decision_fingerprint ?? null,
    designFingerprint,
    preconditionCount: preconditionResults.filter((entry) => entry.satisfied).length,
    mode: 'design_only',
  });

  const planningReproducibilityFingerprint = stableFingerprint({
    designFingerprint,
    understandingResult: understandingRuntime?.result_fingerprint ?? null,
    evidenceFirst: true,
  });

  writeJson(root, VERTICAL_AI_PLANNING_COMPONENT_MODEL_V1_PATH, {
    planning_component_model_v1_id: 'planning_component_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    responsibility:
      'Design evidence-first Vertical AI planning that turns repository understanding into reproducible plans without repository mutation',
    components: PLANNING_COMPONENTS,
    principles: FOUNDATION_PRINCIPLES,
    design_only: true,
    implementation: false,
  });

  writeJson(root, VERTICAL_AI_PLANNING_WORKFLOW_V1_PATH, {
    planning_workflow_v1_id: 'planning_workflow_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_first_planning: true,
    repository_first: true,
    reuse_before_create: true,
    evidence_to_plan_traceability: true,
    plan_reproducibility: true,
    human_approval_required_before_write: true,
    planning_runtime_deferred: true,
    workflow: EVIDENCE_FIRST_PLANNING_WORKFLOW,
    readiness_for_planning_runtime: {
      requires: [
        'planning_components_defined',
        'evidence_to_plan_traceability',
        'plan_reproducibility_designed',
        'approval_gate_armed',
      ],
      creates_implementation: false,
      mutates_repository: false,
    },
  });

  writeJson(root, VERTICAL_AI_PLANNING_APPROVAL_GATE_V1_PATH, {
    planning_approval_gate_v1_id: 'planning_approval_gate_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    gate_policy: {
      human_approval_required_before_any_write: true,
      planning_foundation_runs_are_read_only: true,
      write_actions_blocked_until_approval: true,
      planning_runtime_handoff_requires_foundation: true,
      repository_mutation_forbidden_in_foundation: true,
    },
    write_actions_gated: [
      'planning_runtime_materialization',
      'implementation_proposal_persist',
      'repository_create',
      'repository_modify',
      'execution_plan_enactment',
    ],
    design_only: true,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_PLANNING_EVIDENCE_MODEL_V1_PATH, {
    planning_evidence_model_v1_id: 'planning_evidence_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_policy: {
      evidence_first_planning: true,
      evidence_precedes_plan_conclusions: true,
      conclusions_without_evidence_forbidden: true,
      fingerprints_required: true,
      understanding_runtime_citations_required: true,
    },
    precondition_evidence: preconditionResults,
    consumed_refs: consumedRefs,
    objective_evidence: preconditionResults.map(
      (entry) =>
        `${entry.precondition_id}=${entry.satisfied}:${entry.pass_verdict}:artifact=${entry.artifact_present}`
    ),
  });

  writeJson(root, VERTICAL_AI_PLANNING_TRACEABILITY_V1_PATH, {
    planning_traceability_v1_id: 'planning_traceability_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_to_plan_traceability: true,
    chain: [
      { from: 'understanding_runtime', to: 'planning_context' },
      { from: 'goal_analysis', to: 'candidate_generation' },
      { from: 'planning_context', to: 'candidate_generation' },
      { from: 'candidate_generation', to: 'reuse_planning' },
      { from: 'reuse_planning', to: 'implementation_planning' },
      { from: 'implementation_planning', to: 'risk_analysis' },
      { from: 'risk_analysis', to: 'execution_plan' },
      { from: 'execution_plan', to: 'plan_validation' },
      { from: 'planning_evidence', to: 'plan_traceability' },
      { from: 'plan_traceability', to: 'plan_reproducibility' },
      { from: 'plan_validation', to: 'approval_gate' },
    ],
    reproducibility_fingerprint: planningReproducibilityFingerprint,
  });

  writeJson(root, VERTICAL_AI_PLANNING_BOUNDARY_MODEL_V1_PATH, {
    planning_boundary_model_v1_id: 'planning_boundary_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    boundary_policy: {
      consumes_platform_core_v1_only: true,
      consumes_cil_v1_only: true,
      consumes_repository_intelligence_only: true,
      consumes_understanding_runtime: true,
      owns_source_data: false,
      platform_core_mutation: false,
      cil_mutation: false,
      repository_mutation: false,
      planning_runtime_deferred: true,
      human_approval_before_write: true,
    },
    consumed_refs: consumedRefs,
    forbidden_operations: [
      'platform_core_mutation',
      'cil_mutation',
      'repository_mutation',
      'create_before_reuse_planning',
      'plan_without_evidence',
      'write_without_human_approval',
      'execute_without_approval',
    ],
  });

  writeJson(root, VERTICAL_AI_PLANNING_ARCHITECTURE_V1_PATH, {
    planning_architecture_v1_id: 'planning_architecture_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    selected_architecture: 'Evidence-First Vertical AI Planning Foundation',
    independence_statement:
      'Vertical AI Planning turns repository understanding into reproducible, evidence-traced plans. It consumes Platform Core V1, CIL V1, Repository Intelligence, and Project Understanding Runtime only — read-only and reference-only — and never mutates those baselines. Reuse precedes create. Human approval is required before any write. Evolution of this capability is independent of Platform Core and CIL.',
    stack: {
      platform_core: { role: 'Semantic + structural + execution truth', interaction: 'consume_v1_only' },
      cil: { role: 'Certified integration contracts', interaction: 'consume_v1_only' },
      repository_intelligence: { role: 'Structural repository truth', interaction: 'reference_only' },
      understanding_runtime: {
        role: 'Repository understanding evidence',
        interaction: 'consume_operational_understanding',
      },
      planning: {
        role: 'Evidence-first planning before planning runtime',
        interaction: 'design_only_foundation',
        owns_source_data: false,
      },
    },
    component_model_ref: VERTICAL_AI_PLANNING_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_PLANNING_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_PLANNING_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_PLANNING_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_PLANNING_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_PLANNING_TRACEABILITY_V1_PATH,
    proposed_phase_chain: PROPOSED_VAI_PHASE_CHAIN,
    design_principles: Object.entries(FOUNDATION_PRINCIPLES)
      .filter(([, value]) => value === true)
      .map(([key]) => key),
  });

  const componentsDefined =
    PLANNING_COMPONENTS.length === REQUIRED_COMPONENT_IDS.length &&
    REQUIRED_COMPONENT_IDS.every((id) =>
      PLANNING_COMPONENTS.some((component) => component.component_id === id)
    );

  const evidenceFirstPlanning =
    FOUNDATION_PRINCIPLES.evidence_first_planning === true &&
    EVIDENCE_FIRST_PLANNING_WORKFLOW.policy === 'evidence_first_planning' &&
    PLANNING_COMPONENTS.some((component) => component.component_id === 'planning_evidence');

  const repositoryFirst =
    FOUNDATION_PRINCIPLES.repository_first === true &&
    EVIDENCE_FIRST_PLANNING_WORKFLOW.repository_policy === 'repository_first';

  const reuseBeforeCreate =
    FOUNDATION_PRINCIPLES.reuse_precedes_creation === true &&
    EVIDENCE_FIRST_PLANNING_WORKFLOW.reuse_policy === 'reuse_before_create' &&
    PLANNING_COMPONENTS.some((component) => component.component_id === 'reuse_planning');

  const evidenceToPlanTraceability =
    FOUNDATION_PRINCIPLES.evidence_to_plan_traceability === true &&
    PLANNING_COMPONENTS.some((component) => component.component_id === 'plan_traceability');

  const planReproducibility =
    FOUNDATION_PRINCIPLES.plan_reproducibility === true &&
    PLANNING_COMPONENTS.some((component) => component.component_id === 'plan_reproducibility') &&
    planningReproducibilityFingerprint.length === 16;

  const humanApprovalBeforeWrite =
    FOUNDATION_PRINCIPLES.human_approval_required_before_write === true &&
    PLANNING_COMPONENTS.some((component) => component.component_id === 'approval_gate') &&
    PLANNING_COMPONENTS.every((component) => component.write_authorized === false);

  const designOnly =
    FOUNDATION_PRINCIPLES.design_only === true &&
    FOUNDATION_PRINCIPLES.implementation_deferred === true &&
    FOUNDATION_PRINCIPLES.implementation === false;

  const readOnly = FOUNDATION_PRINCIPLES.read_only === true && consumedRefs.reference_mode === 'read_only';
  const referenceOnly =
    FOUNDATION_PRINCIPLES.reference_only === true && consumedRefs.duplication_policy === 'references_only';
  const noSourceDataOwnership =
    FOUNDATION_PRINCIPLES.owns_source_data === false &&
    PLANNING_COMPONENTS.every((component) => component.owns_source_data === false);

  const platformCoreReady =
    brainComplete?.production_ready === true &&
    bundleComplete?.bundle_complete === true &&
    accessComplete?.access_complete === true;
  const repositoryIntelligenceReady =
    bundleComplete?.bundle_complete === true && accessComplete?.access_complete === true;

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
  const understandingBaselineAfter = verifyBaselinePreserved(
    root,
    understandingBaselineBefore,
    PROTECTED_UNDERSTANDING_PATHS
  );

  const baselineChecks: Array<[string, { preserved: boolean; drift: string[] }, string]> = [
    ['BRAIN_BASELINE_MUTATION', brainBaselineAfter, 'Project Brain baseline changed'],
    ['BUNDLE_BASELINE_MUTATION', bundleBaselineAfter, 'RIB baseline changed'],
    ['ACCESS_BASELINE_MUTATION', accessBaselineAfter, 'Access Layer baseline changed'],
    ['RUNTIME_BASELINE_MUTATION', runtimeBaselineAfter, 'Agent Runtime baseline changed'],
    ['CIL_BASELINE_MUTATION', cilBaselineAfter, 'CIL baseline changed'],
    ['UNDERSTANDING_BASELINE_MUTATION', understandingBaselineAfter, 'Understanding baseline changed'],
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
    runtimeBaselineAfter.preserved &&
    FOUNDATION_PRINCIPLES.platform_core_mutation === false;
  const noCilMutation = cilBaselineAfter.preserved && FOUNDATION_PRINCIPLES.cil_mutation === false;
  const noRepositoryMutation =
    FOUNDATION_PRINCIPLES.repository_mutation === false &&
    EXECUTION_FLAGS.write_authorized === false &&
    EXECUTION_FLAGS.execute_authorized === false;

  const foundationReadyCandidate =
    preconditionsSatisfied &&
    allGoalsSatisfied &&
    componentsDefined &&
    understandingRuntimeVerified &&
    cilCompleteVerified &&
    platformCoreReady &&
    repositoryIntelligenceReady &&
    evidenceFirstPlanning &&
    repositoryFirst &&
    reuseBeforeCreate &&
    evidenceToPlanTraceability &&
    planReproducibility &&
    humanApprovalBeforeWrite &&
    noPlatformCoreMutation &&
    noCilMutation &&
    noRepositoryMutation &&
    understandingBaselineAfter.preserved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const readyForPlanningRuntime =
    foundationReadyCandidate &&
    FOUNDATION_PRINCIPLES.planning_runtime_deferred === true &&
    designOnly &&
    understandingRuntime?.ready_for_planning === true;

  const foundationReady = foundationReadyCandidate && readyForPlanningRuntime;

  const contractValidation = validateFoundationContracts({
    understandingRuntimeVerified,
    cilCompleteVerified,
    platformCoreReady,
    repositoryIntelligenceReady,
    componentsDefined,
    evidenceFirstPlanning,
    repositoryFirst,
    reuseBeforeCreate,
    evidenceToPlanTraceability,
    planReproducibility,
    humanApprovalBeforeWrite,
    consumesPlatformCoreV1Only: FOUNDATION_PRINCIPLES.consumes_platform_core_v1_only === true,
    consumesCilV1Only: FOUNDATION_PRINCIPLES.consumes_cil_v1_only === true,
    consumesRepositoryIntelligenceOnly:
      FOUNDATION_PRINCIPLES.consumes_repository_intelligence_only === true,
    designOnly,
    readOnly,
    referenceOnly,
    noSourceDataOwnership,
    noPlatformCoreMutation,
    noCilMutation,
    noRepositoryMutation,
    readyForPlanningRuntime,
    foundationReady,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'FOUNDATION_CONTRACT_FAILURE',
      message: 'One or more Vertical AI Planning foundation contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_PLANNING_CONTRACTS_V1_PATH, {
    planning_contracts_v1_id: 'planning_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    foundation_ref: VERTICAL_AI_PLANNING_FOUNDATION_V1_PATH,
    contract_ids: [...VAIPF_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: FOUNDATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_PLANNING_FOUNDATION_V1_PATH, {
    vertical_ai_planning_foundation_v1_id: 'vertical_ai_planning_foundation_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_PLANNING_FOUNDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    planning_reproducibility_fingerprint: planningReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    preconditions_satisfied: preconditionsSatisfied,
    design_only: true,
    execution: false,
    implementation: false,
    foundation_ready: foundationReady,
    ready_for_planning_runtime: readyForPlanningRuntime,
    evidence_first_planning: evidenceFirstPlanning,
    evidence_to_plan_traceability: evidenceToPlanTraceability,
    planning_reproducible: planReproducibility,
    repository_first: repositoryFirst,
    reuse_before_create: reuseBeforeCreate,
    human_approval_required_before_write: humanApprovalBeforeWrite,
    architecture_ref: VERTICAL_AI_PLANNING_ARCHITECTURE_V1_PATH,
    component_model_ref: VERTICAL_AI_PLANNING_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_PLANNING_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_PLANNING_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_PLANNING_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_PLANNING_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_PLANNING_TRACEABILITY_V1_PATH,
    contracts_ref: VERTICAL_AI_PLANNING_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_PLANNING_REGISTRY_V1_PATH,
    components: PLANNING_COMPONENTS.map((component) => component.component_id),
    principles: FOUNDATION_PRINCIPLES,
    platform_core_mutation: false,
    cil_mutation: false,
    repository_mutation: false,
    execute_authorized: false,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_PLANNING_REGISTRY_V1_PATH, {
    registry_id: 'planning-registry-v1',
    phase: VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_PLANNING_FOUNDATION_V1_SYSTEM_ID,
    version: 'vertical_ai_planning_foundation_v1',
    generated_at: generatedAt,
    foundation_ref: VERTICAL_AI_PLANNING_FOUNDATION_V1_PATH,
    architecture_ref: VERTICAL_AI_PLANNING_ARCHITECTURE_V1_PATH,
    contracts_ref: VERTICAL_AI_PLANNING_CONTRACTS_V1_PATH,
    component_model_ref: VERTICAL_AI_PLANNING_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_PLANNING_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_PLANNING_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_PLANNING_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_PLANNING_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_PLANNING_TRACEABILITY_V1_PATH,
    component_ids: PLANNING_COMPONENTS.map((component) => component.component_id),
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    planning_reproducibility_fingerprint: planningReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    foundation_ready: foundationReady,
    ready_for_planning_runtime: readyForPlanningRuntime,
    independent_capability: CAPABILITY_ID,
  });

  const passed =
    foundationReady &&
    noPlatformCoreMutation &&
    noCilMutation &&
    noRepositoryMutation &&
    contractValidation.aggregate_verdict === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verdict = passed
    ? VERTICAL_AI_PLANNING_FOUNDATION_V1_PASS_VERDICT
    : VERTICAL_AI_PLANNING_FOUNDATION_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_planning_foundation_v1_${Date.now()}`,
    phase: VERTICAL_AI_PLANNING_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_PLANNING_FOUNDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Design the Vertical AI Planning Foundation as evidence-first, repository-first, reuse-before-create planning with evidence-to-plan traceability and human approval before write.',
    vertical_ai_planning_foundation_v1_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_PLANNING_FOUNDATION_V1_STATUS
      : 'VERTICAL_AI_PLANNING_FOUNDATION_NOT_READY',
    validation_passed: passed,
    design_only: true,
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    planning_reproducibility_fingerprint: planningReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    precondition_evidence: preconditionResults,
    brain_baseline_preserved: brainBaselineAfter.preserved,
    bundle_baseline_preserved: bundleBaselineAfter.preserved,
    access_baseline_preserved: accessBaselineAfter.preserved,
    runtime_baseline_preserved: runtimeBaselineAfter.preserved,
    cil_baseline_preserved: cilBaselineAfter.preserved,
    understanding_baseline_preserved: understandingBaselineAfter.preserved,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    repository_unchanged: noRepositoryMutation,
    components: PLANNING_COMPONENTS.map((component) => component.component_id),
    foundation_ready: foundationReady,
    ready_for_planning_runtime: readyForPlanningRuntime,
    planning_reproducible: planReproducibility,
    evidence_to_plan_traceability_established: evidenceToPlanTraceability,
    evidence_first_planning_established: evidenceFirstPlanning,
    contract_validation: contractValidation,
    foundation_ref: VERTICAL_AI_PLANNING_FOUNDATION_V1_PATH,
    architecture_ref: VERTICAL_AI_PLANNING_ARCHITECTURE_V1_PATH,
    component_model_ref: VERTICAL_AI_PLANNING_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_PLANNING_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_PLANNING_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_PLANNING_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_PLANNING_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_PLANNING_TRACEABILITY_V1_PATH,
    contracts_ref: VERTICAL_AI_PLANNING_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_PLANNING_REGISTRY_V1_PATH,
    checks: {
      PRECONDITIONS_SATISFIED: preconditionsSatisfied,
      UNDERSTANDING_RUNTIME_VERIFIED: understandingRuntimeVerified,
      CIL_COMPLETE: cilCompleteVerified,
      PLATFORM_CORE_READY: platformCoreReady,
      REPOSITORY_INTELLIGENCE_READY: repositoryIntelligenceReady,
      COMPONENTS_DEFINED: componentsDefined,
      EVIDENCE_FIRST_PLANNING: evidenceFirstPlanning,
      REPOSITORY_FIRST: repositoryFirst,
      REUSE_BEFORE_CREATE: reuseBeforeCreate,
      EVIDENCE_TO_PLAN_TRACEABILITY: evidenceToPlanTraceability,
      PLAN_REPRODUCIBILITY: planReproducibility,
      HUMAN_APPROVAL_BEFORE_WRITE: humanApprovalBeforeWrite,
      DESIGN_ONLY: designOnly,
      READ_ONLY: readOnly,
      REFERENCE_ONLY: referenceOnly,
      NO_SOURCE_DATA_OWNERSHIP: noSourceDataOwnership,
      PLATFORM_CORE_UNCHANGED: noPlatformCoreMutation,
      CIL_UNCHANGED: noCilMutation,
      REPOSITORY_UNCHANGED: noRepositoryMutation,
      READY_FOR_PLANNING_RUNTIME: readyForPlanningRuntime,
      FOUNDATION_READY: foundationReady,
      CONTRACT_VALIDATION: contractValidation.aggregate_verdict === 'PASS',
      GOAL_TRUTH_SATISFIED: allGoalsSatisfied,
      EXECUTION: false,
      IMPLEMENTATION: false,
      WRITE_AUTHORIZED: false,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_PLANNING_FOUNDATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_PLANNING_FOUNDATION_V1_REPORT_PATH,
  };
}
