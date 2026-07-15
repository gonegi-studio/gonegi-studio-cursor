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
import { CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './claudeConnectorProductionCertificationV1Engine.js';
import { CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './chatgptConnectorProductionCertificationV1Engine.js';
import { GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './geminiConnectorProductionCertificationV1Engine.js';
import { CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './cursorConnectorProductionCertificationV1Engine.js';
import { MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH } from './mcpConnectorProductionCertificationV1Engine.js';
import {
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
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PASS_VERDICT,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPORT_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_EXPORT_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_VERSION_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REGISTRY_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPRODUCIBILITY_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_CONTRACTS_PATH,
} from './verticalAiCertificationRuntimeV1Engine.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE = 'PHASE-VAI-011' as const;
export const VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_SYSTEM_ID =
  'VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1' as const;
export const VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1' as const;
export const VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1' as const;
export const VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_STATUS =
  'VERTICAL_AI_IMPROVEMENT_DEFINED' as const;

export const VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR =
  'datasets/vertical_ai_improvement_foundation_v1' as const;
export const VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/vertical-ai-improvement-foundation-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_ARCHITECTURE_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/improvement-architecture-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_COMPONENT_MODEL_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/improvement-component-model-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_WORKFLOW_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/improvement-workflow-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_BOUNDARY_MODEL_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/improvement-boundary-model-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_CONTRACTS_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/improvement-contracts-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_REGISTRY_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/improvement-registry-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_APPROVAL_GATE_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/improvement-approval-gate-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_EVIDENCE_MODEL_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/improvement-evidence-model-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_TRACEABILITY_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/improvement-traceability-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_INPUT_CONTRACT_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/improvement-input-contract-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_RUNTIME_REF_V1_PATH =
  `${VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_DIR}/improvement-runtime-ref-v1.json` as const;
export const VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_REPORT.json' as const;

const FOUNDATION_NAME = 'Evidence-Bound Vertical AI Improvement Foundation V1' as const;
const CAPABILITY_ID = 'vertical_ai_improvement' as const;
const LAYER_ID = 'improvement' as const;

export const VAIIF_CONTRACT_IDS = [
  'VAIIF_CERTIFICATION_RUNTIME_VERIFIED',
  'VAIIF_CIL_COMPLETE_VERIFIED',
  'VAIIF_PLATFORM_CORE_READY',
  'VAIIF_REPOSITORY_INTELLIGENCE_READY',
  'VAIIF_CERTIFIED_CONNECTORS_BOUND',
  'VAIIF_COMPONENTS_DEFINED',
  'VAIIF_CERTIFIED_IMPROVEMENT_BOUNDARIES_DEFINED',
  'VAIIF_IMPROVE_ONLY_FROM_CERTIFIED_EVIDENCE',
  'VAIIF_EVIDENCE_TO_IMPROVEMENT_TRACEABILITY',
  'VAIIF_IMPROVEMENT_REPRODUCIBILITY',
  'VAIIF_REPOSITORY_FIRST',
  'VAIIF_EVIDENCE_FIRST',
  'VAIIF_NO_REPOSITORY_MUTATION',
  'VAIIF_CONSUMES_PLATFORM_CORE_V1_ONLY',
  'VAIIF_CONSUMES_CIL_V1_ONLY',
  'VAIIF_CONSUMES_REPOSITORY_INTELLIGENCE_ONLY',
  'VAIIF_CONSUMES_CERTIFIED_CONNECTORS_ONLY',
  'VAIIF_DESIGN_ONLY',
  'VAIIF_READ_ONLY',
  'VAIIF_REFERENCE_ONLY',
  'VAIIF_NO_SOURCE_DATA_OWNERSHIP',
  'VAIIF_NO_PLATFORM_CORE_MUTATION',
  'VAIIF_NO_CIL_MUTATION',
  'VAIIF_READY_FOR_IMPROVEMENT_RUNTIME',
  'VAIIF_FOUNDATION_READY',
] as const;

const REQUIRED_COMPONENT_IDS = [
  'improvement_context',
  'improvement_selector',
  'improvement_candidate_generation',
  'improvement_risk_analysis',
  'improvement_contract',
  'improvement_evidence',
  'improvement_traceability',
  'improvement_reproducibility',
  'improvement_input_contract',
  'improvement_runtime_ref',
  'approval_gate',
  'improvement_boundary',
] as const;

const CERTIFIED_CONNECTORS = [
  { connector_id: 'claude_connector', master_snapshot_ref: CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'chatgpt_connector', master_snapshot_ref: CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'gemini_connector', master_snapshot_ref: GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'cursor_connector', master_snapshot_ref: CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'mcp_connector', master_snapshot_ref: MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
] as const;

/**
 * Vertical AI Improvement is design-only capacity that proposes improvement candidates
 * only from certified evidence. It never mutates Platform Core, CIL, or the repository.
 */
const IMPROVEMENT_COMPONENTS = [
  {
    component_id: 'improvement_context',
    name: 'Improvement Context',
    responsibility:
      'Assemble a read-only improvement context from certification runtime outputs (frozen certified evidence), Platform Core, CIL, Repository Intelligence, and certified connector snapshots.',
    interface_kind: 'context',
    owns_source_data: false,
    mode: 'reference_only',
    write_authorized: false,
  },
  {
    component_id: 'improvement_selector',
    name: 'Improvement Selector',
    responsibility:
      'Select certified evidence fields eligible for improvement analysis using repository-first, evidence-first priority; rejects uncertified or unfrozen inputs.',
    interface_kind: 'selection',
    owns_source_data: false,
    mode: 'certified_evidence_only',
    write_authorized: false,
  },
  {
    component_id: 'improvement_candidate_generation',
    name: 'Improvement Candidate Generation',
    responsibility:
      'Generate descriptive improvement candidates only from certified evidence fingerprints; candidates are non-enacted descriptors.',
    interface_kind: 'generation',
    owns_source_data: false,
    mode: 'descriptor_only',
    write_authorized: false,
  },
  {
    component_id: 'improvement_risk_analysis',
    name: 'Improvement Risk Analysis',
    responsibility:
      'Analyze candidate risk against certified boundaries: no PC/CIL/repository mutation, certified connectors only, evidence integrity.',
    interface_kind: 'analysis',
    owns_source_data: false,
    mode: 'risk_bound',
    write_authorized: false,
  },
  {
    component_id: 'improvement_contract',
    name: 'Improvement Contract',
    responsibility:
      'Declare the improvement boundary contract: consumes certified evidence / PC / CIL / RI / connectors only; forbids all repository, PC, and CIL mutation.',
    interface_kind: 'contract',
    owns_source_data: false,
    mode: 'boundary_contract',
    write_authorized: false,
  },
  {
    component_id: 'improvement_evidence',
    name: 'Improvement Evidence',
    responsibility:
      'Bind fingerprints so every improvement conclusion is preceded by frozen certified evidence from certification runtime.',
    interface_kind: 'evidence',
    owns_source_data: false,
    mode: 'certified_evidence_only',
    write_authorized: false,
  },
  {
    component_id: 'improvement_traceability',
    name: 'Improvement Traceability',
    responsibility:
      'Maintain evidence-to-improvement traceability from certified records through candidate generation, risk analysis, and approval gates.',
    interface_kind: 'traceability',
    owns_source_data: false,
    mode: 'evidence_to_improvement',
    write_authorized: false,
  },
  {
    component_id: 'improvement_reproducibility',
    name: 'Improvement Reproducibility',
    responsibility:
      'Ensure identical certified evidence inputs yield identical improvement design fingerprints across dual runs.',
    interface_kind: 'reproducibility',
    owns_source_data: false,
    mode: 'deterministic',
    write_authorized: false,
  },
  {
    component_id: 'improvement_input_contract',
    name: 'Improvement Input Contract',
    responsibility:
      'Declare the only accepted input: certified evidence records with frozen fingerprints from certification runtime; uncertified inputs rejected.',
    interface_kind: 'input_contract',
    owns_source_data: false,
    mode: 'certified_input_only',
    write_authorized: false,
  },
  {
    component_id: 'improvement_runtime_ref',
    name: 'Improvement Runtime Reference',
    responsibility:
      'Reference surfaces future Improvement Runtime will bind (certification runtime, Agent Runtime, CIL); reference-only, no mutation.',
    interface_kind: 'reference',
    owns_source_data: false,
    mode: 'runtime_ref',
    write_authorized: false,
  },
  {
    component_id: 'approval_gate',
    name: 'Approval Gate',
    responsibility:
      'Hard-block repository mutation and any enactment; improvement foundation and future runtime proposals remain non-mutative and read-only.',
    interface_kind: 'gate',
    owns_source_data: false,
    mode: 'mutation_forbidden',
    write_authorized: false,
  },
  {
    component_id: 'improvement_boundary',
    name: 'Improvement Boundary',
    responsibility:
      'Define certified improvement boundaries: operate only on certified evidence; no PC/CIL/repository mutation; candidates never auto-enact.',
    interface_kind: 'boundary',
    owns_source_data: false,
    mode: 'boundary_definition',
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
  evidence_first: true,
  improve_only_from_certified_evidence: true,
  evidence_to_improvement_traceability: true,
  improvement_reproducibility: true,
  certified_improvement_boundaries_defined: true,
  no_repository_mutation: true,
  repository_mutation: false,
  human_approval_cannot_authorize_repository_mutation_in_foundation: true,
  consumes_platform_core_v1_only: true,
  consumes_cil_v1_only: true,
  consumes_repository_intelligence_only: true,
  consumes_certified_connectors_only: true,
  consumes_certification_runtime: true,
  owns_source_data: false,
  platform_core_mutation: false,
  cil_mutation: false,
  improvement_runtime_deferred: true,
  independently_evolvable: true,
} as const;

const EXECUTION_FLAGS = {
  ...FOUNDATION_PRINCIPLES,
  execute_authorized: false as const,
  write_authorized: false as const,
};

const EVIDENCE_TO_IMPROVEMENT_WORKFLOW = {
  workflow_id: 'certified_evidence_to_improvement_v1',
  policy: 'evidence_first_improvement',
  repository_policy: 'repository_first',
  connector_policy: 'certified_connectors_only',
  evidence_policy: 'improve_only_from_certified_evidence',
  write_policy: 'no_repository_mutation',
  traceability_policy: 'evidence_to_improvement',
  steps: [
    { step_id: 'build_context', component_id: 'improvement_context', write: false },
    { step_id: 'bind_runtime_ref', component_id: 'improvement_runtime_ref', write: false },
    { step_id: 'bind_input_contract', component_id: 'improvement_input_contract', write: false },
    { step_id: 'select', component_id: 'improvement_selector', write: false },
    { step_id: 'generate_candidates', component_id: 'improvement_candidate_generation', write: false },
    { step_id: 'analyze_risk', component_id: 'improvement_risk_analysis', write: false },
    { step_id: 'declare_contract', component_id: 'improvement_contract', write: false },
    { step_id: 'define_boundary', component_id: 'improvement_boundary', write: false },
    { step_id: 'bind_evidence', component_id: 'improvement_evidence', write: false },
    { step_id: 'trace', component_id: 'improvement_traceability', write: false },
    { step_id: 'reproducibility', component_id: 'improvement_reproducibility', write: false },
    {
      step_id: 'approval',
      component_id: 'approval_gate',
      write: false,
      repository_mutation_forbidden: true,
    },
    {
      step_id: 'improvement_runtime_handoff',
      deferred: true,
      requires: ['improvement_foundation_ready', 'certified_evidence_only'],
    },
  ],
  forbidden_before_evidence: [
    'improve_from_uncertified_evidence',
    'improve_without_frozen_evidence',
    'select_uncertified_connector',
    'mutate_platform_core',
    'mutate_cil',
    'repository_mutation',
    'auto_enact_candidate',
  ],
} as const;

const PROPOSED_VAI_PHASE_CHAIN = [
  {
    phase_id: 'PHASE-VAI-009',
    title: 'Certification foundation',
    focus: 'Evidence-to-certification design',
  },
  {
    phase_id: 'PHASE-VAI-010',
    title: 'Certification runtime',
    focus: 'Operational certification with frozen evidence',
  },
  {
    phase_id: 'PHASE-VAI-011',
    title: 'Improvement foundation',
    focus: 'Design certified-evidence-only improvement with hard no-mutation boundaries',
  },
  {
    phase_id: 'PHASE-VAI-012',
    title: 'Improvement runtime',
    focus: 'Implement improvement runtime over certified foundation',
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

const PROTECTED_CONNECTOR_PATHS = [
  CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
  MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
] as const;

const PROTECTED_CERTIFICATION_PATHS = [
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
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_EXPORT_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_VERSION_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REGISTRY_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPRODUCIBILITY_PATH,
  VERTICAL_AI_CERTIFICATION_RUNTIME_V1_CONTRACTS_PATH,
] as const;

const PRECONDITION_EVIDENCE = [
  {
    precondition_id: 'certification_runtime',
    report_path: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH,
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
    ['VAIIF_CERTIFICATION_RUNTIME_VERIFIED', 'certificationRuntimeVerified'],
    ['VAIIF_CIL_COMPLETE_VERIFIED', 'cilCompleteVerified'],
    ['VAIIF_PLATFORM_CORE_READY', 'platformCoreReady'],
    ['VAIIF_REPOSITORY_INTELLIGENCE_READY', 'repositoryIntelligenceReady'],
    ['VAIIF_CERTIFIED_CONNECTORS_BOUND', 'certifiedConnectorsBound'],
    ['VAIIF_COMPONENTS_DEFINED', 'componentsDefined'],
    ['VAIIF_CERTIFIED_IMPROVEMENT_BOUNDARIES_DEFINED', 'certifiedImprovementBoundariesDefined'],
    ['VAIIF_IMPROVE_ONLY_FROM_CERTIFIED_EVIDENCE', 'improveOnlyFromCertifiedEvidence'],
    ['VAIIF_EVIDENCE_TO_IMPROVEMENT_TRACEABILITY', 'evidenceToImprovementTraceability'],
    ['VAIIF_IMPROVEMENT_REPRODUCIBILITY', 'improvementReproducibility'],
    ['VAIIF_REPOSITORY_FIRST', 'repositoryFirst'],
    ['VAIIF_EVIDENCE_FIRST', 'evidenceFirst'],
    ['VAIIF_NO_REPOSITORY_MUTATION', 'noRepositoryMutation'],
    ['VAIIF_CONSUMES_PLATFORM_CORE_V1_ONLY', 'consumesPlatformCoreV1Only'],
    ['VAIIF_CONSUMES_CIL_V1_ONLY', 'consumesCilV1Only'],
    ['VAIIF_CONSUMES_REPOSITORY_INTELLIGENCE_ONLY', 'consumesRepositoryIntelligenceOnly'],
    ['VAIIF_CONSUMES_CERTIFIED_CONNECTORS_ONLY', 'consumesCertifiedConnectorsOnly'],
    ['VAIIF_DESIGN_ONLY', 'designOnly'],
    ['VAIIF_READ_ONLY', 'readOnly'],
    ['VAIIF_REFERENCE_ONLY', 'referenceOnly'],
    ['VAIIF_NO_SOURCE_DATA_OWNERSHIP', 'noSourceDataOwnership'],
    ['VAIIF_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAIIF_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAIIF_READY_FOR_IMPROVEMENT_RUNTIME', 'readyForImprovementRuntime'],
    ['VAIIF_FOUNDATION_READY', 'foundationReady'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return {
    contract_ids: [...VAIIF_CONTRACT_IDS],
    results,
    aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const),
  };
}

export function writeVerticalAiImprovementFoundationV1EngineReport(): {
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
  const certificationBaselineBefore = captureBaselineMtimes(root, PROTECTED_CERTIFICATION_PATHS);

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

  const certificationRuntimeVerified =
    preconditionResults.find((entry) => entry.precondition_id === 'certification_runtime')
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
  const certificationRuntime = readJson<{
    decision_fingerprint?: string;
    runtime_implemented?: boolean;
    ready_for_improvement_foundation?: boolean;
    result_fingerprint?: string;
    dispatch_fingerprint?: string;
    record_fingerprint?: string;
    certified_evidence_frozen?: boolean;
    certified_certification_operational?: boolean;
  }>(root, VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH);

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
  if (certificationRuntime?.runtime_implemented !== true) {
    issues.push({
      code: 'CERTIFICATION_RUNTIME_NOT_IMPLEMENTED',
      message: 'Certification Runtime must be implemented',
      severity: 'error',
    });
  }
  if (certificationRuntime?.certified_evidence_frozen !== true) {
    issues.push({
      code: 'CERTIFIED_EVIDENCE_NOT_FROZEN',
      message: 'Improvement foundation requires frozen certified evidence',
      severity: 'error',
    });
  }

  const certifiedConnectorsBound = CERTIFIED_CONNECTORS.every((connector) =>
    pathExists(root, connector.master_snapshot_ref)
  );
  if (!certifiedConnectorsBound) {
    issues.push({
      code: 'CERTIFIED_CONNECTORS_MISSING',
      message: 'All certified consumer connector master snapshots must exist',
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
    certification: {
      foundation_ref: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
      runtime_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH,
      result_fingerprint: certificationRuntime?.result_fingerprint ?? null,
      dispatch_fingerprint: certificationRuntime?.dispatch_fingerprint ?? null,
      record_fingerprint: certificationRuntime?.record_fingerprint ?? null,
      certified_evidence_frozen: certificationRuntime?.certified_evidence_frozen === true,
      certified_certification_operational:
        certificationRuntime?.certified_certification_operational === true,
    },
    certified_connectors: Object.fromEntries(
      CERTIFIED_CONNECTORS.map((connector) => [connector.connector_id, connector.master_snapshot_ref])
    ),
    reference_mode: 'read_only' as const,
    duplication_policy: 'references_only' as const,
    mutation_policy: 'never_mutate_platform_core_cil_or_repository' as const,
    input_policy: 'certified_evidence_only' as const,
  };

  const designFingerprint = stableFingerprint({
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    components: IMPROVEMENT_COMPONENTS,
    principles: FOUNDATION_PRINCIPLES,
    workflow: EVIDENCE_TO_IMPROVEMENT_WORKFLOW,
    phase_chain: PROPOSED_VAI_PHASE_CHAIN,
  });

  const decisionFingerprint = stableFingerprint({
    goalTruthFingerprint: goalTruth.fingerprint,
    certificationDecision: certificationRuntime?.decision_fingerprint ?? null,
    brainDecision: brainComplete?.decision_fingerprint ?? null,
    bundleDecision: bundleComplete?.decision_fingerprint ?? null,
    accessDecision: accessComplete?.decision_fingerprint ?? null,
    designFingerprint,
    preconditionCount: preconditionResults.filter((entry) => entry.satisfied).length,
    mode: 'design_only',
  });

  const improvementReproducibilityFingerprint = stableFingerprint({
    designFingerprint,
    certificationResult: certificationRuntime?.result_fingerprint ?? null,
    certificationRecord: certificationRuntime?.record_fingerprint ?? null,
    certifiedEvidenceFrozen: certificationRuntime?.certified_evidence_frozen === true,
    evidenceFirst: true,
  });

  writeJson(root, VERTICAL_AI_IMPROVEMENT_COMPONENT_MODEL_V1_PATH, {
    improvement_component_model_v1_id: 'improvement_component_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    responsibility:
      'Design certified-evidence-only Vertical AI improvement capacity that never mutates Platform Core, CIL, or the repository',
    components: IMPROVEMENT_COMPONENTS,
    principles: FOUNDATION_PRINCIPLES,
    design_only: true,
    implementation: false,
  });

  writeJson(root, VERTICAL_AI_IMPROVEMENT_INPUT_CONTRACT_V1_PATH, {
    improvement_input_contract_v1_id: 'improvement_input_contract_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    accepted_input: {
      source: 'certification_runtime',
      requires_certified_evidence_frozen: true,
      requires_certified_certification_operational: true,
      requires_record_fingerprint: true,
      uncertified_inputs_rejected: true,
    },
    certification_runtime_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH,
    certification_record_design_ref: VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_IMPROVEMENT_RUNTIME_REF_V1_PATH, {
    improvement_runtime_ref_v1_id: 'improvement_runtime_ref_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    certification_runtime_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_V1_PATH,
    certification_foundation_ref: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
    agent_runtime_ref: AGENT_RUNTIME_V1_PATH,
    agent_runtime_master_snapshot_ref: AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
    cil_runtime_connector_ref: RUNTIME_CONNECTOR_V1_PATH,
    reference_only: true,
    mutation_forbidden: true,
  });

  writeJson(root, VERTICAL_AI_IMPROVEMENT_WORKFLOW_V1_PATH, {
    improvement_workflow_v1_id: 'improvement_workflow_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_first: true,
    repository_first: true,
    improve_only_from_certified_evidence: true,
    evidence_to_improvement_traceability: true,
    improvement_reproducibility: true,
    certified_improvement_boundaries_defined: true,
    no_repository_mutation: true,
    improvement_runtime_deferred: true,
    workflow: EVIDENCE_TO_IMPROVEMENT_WORKFLOW,
    readiness_for_improvement_runtime: {
      requires: [
        'improvement_components_defined',
        'certified_improvement_boundaries_defined',
        'improve_only_from_certified_evidence',
        'approval_gate_armed',
      ],
      creates_implementation: false,
      mutates_platform_core: false,
      mutates_cil: false,
      mutates_repository: false,
    },
  });

  writeJson(root, VERTICAL_AI_IMPROVEMENT_APPROVAL_GATE_V1_PATH, {
    improvement_approval_gate_v1_id: 'improvement_approval_gate_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    gate_policy: {
      repository_mutation_forbidden: true,
      platform_core_mutation_forbidden: true,
      cil_mutation_forbidden: true,
      candidate_auto_enactment_forbidden: true,
      improvement_foundation_runs_are_read_only: true,
      improvement_runtime_handoff_requires_foundation: true,
      certified_evidence_required: true,
    },
    write_actions_gated: [
      'repository_create',
      'repository_modify',
      'repository_delete',
      'improvement_candidate_enactment',
      'improvement_runtime_materialization',
    ],
    design_only: true,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_IMPROVEMENT_EVIDENCE_MODEL_V1_PATH, {
    improvement_evidence_model_v1_id: 'improvement_evidence_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_policy: {
      evidence_first: true,
      improve_only_from_certified_evidence: true,
      conclusions_without_certified_evidence_forbidden: true,
      fingerprints_required: true,
      certification_runtime_citations_required: true,
      frozen_evidence_required: true,
    },
    precondition_evidence: preconditionResults,
    consumed_refs: consumedRefs,
    objective_evidence: preconditionResults.map(
      (entry) =>
        `${entry.precondition_id}=${entry.satisfied}:${entry.pass_verdict}:artifact=${entry.artifact_present}`
    ),
  });

  writeJson(root, VERTICAL_AI_IMPROVEMENT_TRACEABILITY_V1_PATH, {
    improvement_traceability_v1_id: 'improvement_traceability_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_to_improvement_traceability: true,
    chain: [
      { from: 'certification_runtime', to: 'improvement_context' },
      { from: 'improvement_context', to: 'improvement_input_contract' },
      { from: 'improvement_input_contract', to: 'improvement_selector' },
      { from: 'improvement_runtime_ref', to: 'improvement_selector' },
      { from: 'improvement_selector', to: 'improvement_candidate_generation' },
      { from: 'improvement_candidate_generation', to: 'improvement_risk_analysis' },
      { from: 'improvement_risk_analysis', to: 'improvement_contract' },
      { from: 'improvement_contract', to: 'improvement_boundary' },
      { from: 'improvement_evidence', to: 'improvement_traceability' },
      { from: 'improvement_traceability', to: 'improvement_reproducibility' },
      { from: 'improvement_boundary', to: 'approval_gate' },
    ],
    reproducibility_fingerprint: improvementReproducibilityFingerprint,
  });

  writeJson(root, VERTICAL_AI_IMPROVEMENT_BOUNDARY_MODEL_V1_PATH, {
    improvement_boundary_model_v1_id: 'improvement_boundary_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    boundary_policy: {
      consumes_platform_core_v1_only: true,
      consumes_cil_v1_only: true,
      consumes_repository_intelligence_only: true,
      consumes_certified_connectors_only: true,
      consumes_certification_runtime: true,
      improve_only_from_certified_evidence: true,
      owns_source_data: false,
      platform_core_mutation: false,
      cil_mutation: false,
      repository_mutation: false,
      improvement_runtime_deferred: true,
      certified_improvement_boundaries_defined: true,
    },
    consumed_refs: consumedRefs,
    forbidden_operations: [
      'platform_core_mutation',
      'cil_mutation',
      'repository_mutation',
      'improve_from_uncertified_evidence',
      'uncertified_connector_selection',
      'auto_enact_candidate',
    ],
  });

  writeJson(root, VERTICAL_AI_IMPROVEMENT_ARCHITECTURE_V1_PATH, {
    improvement_architecture_v1_id: 'improvement_architecture_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    selected_architecture:
      'Certified-Evidence-Only Vertical AI Improvement Foundation with Hard No-Mutation Boundaries',
    independence_statement:
      'Vertical AI Improvement proposes improvement candidates only from frozen certified evidence produced by Certification Runtime. It consumes Platform Core V1, CIL V1, Repository Intelligence, certified Consumer Connectors, and Certification Runtime only — read-only and reference-only — and never mutates Platform Core, CIL, or the repository. Certified improvement boundaries forbid auto-enactment. Evolution of this capability is independent of Platform Core and CIL.',
    stack: {
      platform_core: { role: 'Semantic + structural + execution truth', interaction: 'consume_v1_only' },
      cil: { role: 'Certified integration contracts', interaction: 'consume_v1_only' },
      repository_intelligence: { role: 'Structural repository truth', interaction: 'reference_only' },
      certified_connectors: { role: 'Reasoning-side certified consumers', interaction: 'reference_only' },
      certification_runtime: {
        role: 'Frozen certified evidence and certification records',
        interaction: 'consume_certified_evidence_only',
      },
      improvement: {
        role: 'Certified-evidence-only improvement design before improvement runtime',
        interaction: 'design_only_foundation',
        owns_source_data: false,
      },
    },
    component_model_ref: VERTICAL_AI_IMPROVEMENT_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_IMPROVEMENT_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_IMPROVEMENT_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_IMPROVEMENT_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_IMPROVEMENT_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_IMPROVEMENT_TRACEABILITY_V1_PATH,
    input_contract_ref: VERTICAL_AI_IMPROVEMENT_INPUT_CONTRACT_V1_PATH,
    improvement_runtime_ref: VERTICAL_AI_IMPROVEMENT_RUNTIME_REF_V1_PATH,
    proposed_phase_chain: PROPOSED_VAI_PHASE_CHAIN,
    design_principles: Object.entries(FOUNDATION_PRINCIPLES)
      .filter(([, value]) => value === true)
      .map(([key]) => key),
  });

  const componentsDefined =
    IMPROVEMENT_COMPONENTS.length === REQUIRED_COMPONENT_IDS.length &&
    REQUIRED_COMPONENT_IDS.every((id) =>
      IMPROVEMENT_COMPONENTS.some((component) => component.component_id === id)
    );

  const certifiedImprovementBoundariesDefined =
    FOUNDATION_PRINCIPLES.certified_improvement_boundaries_defined === true &&
    IMPROVEMENT_COMPONENTS.some((component) => component.component_id === 'improvement_boundary') &&
    IMPROVEMENT_COMPONENTS.some((component) => component.component_id === 'approval_gate');

  const improveOnlyFromCertifiedEvidence =
    FOUNDATION_PRINCIPLES.improve_only_from_certified_evidence === true &&
    IMPROVEMENT_COMPONENTS.some((component) => component.component_id === 'improvement_input_contract') &&
    certificationRuntime?.certified_evidence_frozen === true;

  const evidenceToImprovementTraceability =
    FOUNDATION_PRINCIPLES.evidence_to_improvement_traceability === true &&
    IMPROVEMENT_COMPONENTS.some((component) => component.component_id === 'improvement_traceability');

  const improvementReproducibility =
    FOUNDATION_PRINCIPLES.improvement_reproducibility === true &&
    IMPROVEMENT_COMPONENTS.some(
      (component) => component.component_id === 'improvement_reproducibility'
    ) &&
    improvementReproducibilityFingerprint.length === 16;

  const repositoryFirst =
    FOUNDATION_PRINCIPLES.repository_first === true &&
    EVIDENCE_TO_IMPROVEMENT_WORKFLOW.repository_policy === 'repository_first';
  const evidenceFirst =
    FOUNDATION_PRINCIPLES.evidence_first === true &&
    EVIDENCE_TO_IMPROVEMENT_WORKFLOW.policy === 'evidence_first_improvement';

  const noRepositoryMutation =
    FOUNDATION_PRINCIPLES.no_repository_mutation === true &&
    FOUNDATION_PRINCIPLES.repository_mutation === false &&
    IMPROVEMENT_COMPONENTS.every((component) => component.write_authorized === false) &&
    EVIDENCE_TO_IMPROVEMENT_WORKFLOW.write_policy === 'no_repository_mutation';

  const designOnly =
    FOUNDATION_PRINCIPLES.design_only === true &&
    FOUNDATION_PRINCIPLES.implementation_deferred === true &&
    FOUNDATION_PRINCIPLES.implementation === false;
  const readOnly = FOUNDATION_PRINCIPLES.read_only === true && consumedRefs.reference_mode === 'read_only';
  const referenceOnly =
    FOUNDATION_PRINCIPLES.reference_only === true && consumedRefs.duplication_policy === 'references_only';
  const noSourceDataOwnership =
    FOUNDATION_PRINCIPLES.owns_source_data === false &&
    IMPROVEMENT_COMPONENTS.every((component) => component.owns_source_data === false);

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
  const connectorBaselineAfter = verifyBaselinePreserved(
    root,
    connectorBaselineBefore,
    PROTECTED_CONNECTOR_PATHS
  );
  const certificationBaselineAfter = verifyBaselinePreserved(
    root,
    certificationBaselineBefore,
    PROTECTED_CERTIFICATION_PATHS
  );

  const baselineChecks: Array<[string, { preserved: boolean; drift: string[] }, string]> = [
    ['BRAIN_BASELINE_MUTATION', brainBaselineAfter, 'Project Brain baseline changed'],
    ['BUNDLE_BASELINE_MUTATION', bundleBaselineAfter, 'RIB baseline changed'],
    ['ACCESS_BASELINE_MUTATION', accessBaselineAfter, 'Access Layer baseline changed'],
    ['RUNTIME_BASELINE_MUTATION', runtimeBaselineAfter, 'Agent Runtime baseline changed'],
    ['CIL_BASELINE_MUTATION', cilBaselineAfter, 'CIL baseline changed'],
    ['CONNECTOR_BASELINE_MUTATION', connectorBaselineAfter, 'Certified connector baseline changed'],
    ['CERTIFICATION_BASELINE_MUTATION', certificationBaselineAfter, 'Certification baseline changed'],
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

  const foundationReadyCandidate =
    preconditionsSatisfied &&
    allGoalsSatisfied &&
    componentsDefined &&
    certificationRuntimeVerified &&
    cilCompleteVerified &&
    platformCoreReady &&
    repositoryIntelligenceReady &&
    certifiedConnectorsBound &&
    certifiedImprovementBoundariesDefined &&
    improveOnlyFromCertifiedEvidence &&
    evidenceToImprovementTraceability &&
    improvementReproducibility &&
    repositoryFirst &&
    evidenceFirst &&
    noRepositoryMutation &&
    noPlatformCoreMutation &&
    noCilMutation &&
    connectorBaselineAfter.preserved &&
    certificationBaselineAfter.preserved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const readyForImprovementRuntime =
    foundationReadyCandidate &&
    FOUNDATION_PRINCIPLES.improvement_runtime_deferred === true &&
    designOnly &&
    certificationRuntime?.ready_for_improvement_foundation === true;

  const foundationReady = foundationReadyCandidate && readyForImprovementRuntime;

  const contractValidation = validateFoundationContracts({
    certificationRuntimeVerified,
    cilCompleteVerified,
    platformCoreReady,
    repositoryIntelligenceReady,
    certifiedConnectorsBound,
    componentsDefined,
    certifiedImprovementBoundariesDefined,
    improveOnlyFromCertifiedEvidence,
    evidenceToImprovementTraceability,
    improvementReproducibility,
    repositoryFirst,
    evidenceFirst,
    noRepositoryMutation,
    consumesPlatformCoreV1Only: FOUNDATION_PRINCIPLES.consumes_platform_core_v1_only === true,
    consumesCilV1Only: FOUNDATION_PRINCIPLES.consumes_cil_v1_only === true,
    consumesRepositoryIntelligenceOnly:
      FOUNDATION_PRINCIPLES.consumes_repository_intelligence_only === true,
    consumesCertifiedConnectorsOnly: FOUNDATION_PRINCIPLES.consumes_certified_connectors_only === true,
    designOnly,
    readOnly,
    referenceOnly,
    noSourceDataOwnership,
    noPlatformCoreMutation,
    noCilMutation,
    readyForImprovementRuntime,
    foundationReady,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'FOUNDATION_CONTRACT_FAILURE',
      message: 'One or more Vertical AI Improvement foundation contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_IMPROVEMENT_CONTRACTS_V1_PATH, {
    improvement_contracts_v1_id: 'improvement_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    foundation_ref: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PATH,
    contract_ids: [...VAIIF_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: FOUNDATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PATH, {
    vertical_ai_improvement_foundation_v1_id: 'vertical_ai_improvement_foundation_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    improvement_reproducibility_fingerprint: improvementReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    preconditions_satisfied: preconditionsSatisfied,
    design_only: true,
    execution: false,
    implementation: false,
    foundation_ready: foundationReady,
    ready_for_improvement_runtime: readyForImprovementRuntime,
    improvement_foundation_established: foundationReady,
    certified_improvement_boundaries_defined: certifiedImprovementBoundariesDefined,
    improve_only_from_certified_evidence: improveOnlyFromCertifiedEvidence,
    evidence_to_improvement_traceability: evidenceToImprovementTraceability,
    improvement_reproducible: improvementReproducibility,
    repository_first: repositoryFirst,
    evidence_first: evidenceFirst,
    no_repository_mutation: noRepositoryMutation,
    architecture_ref: VERTICAL_AI_IMPROVEMENT_ARCHITECTURE_V1_PATH,
    component_model_ref: VERTICAL_AI_IMPROVEMENT_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_IMPROVEMENT_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_IMPROVEMENT_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_IMPROVEMENT_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_IMPROVEMENT_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_IMPROVEMENT_TRACEABILITY_V1_PATH,
    input_contract_ref: VERTICAL_AI_IMPROVEMENT_INPUT_CONTRACT_V1_PATH,
    improvement_runtime_ref: VERTICAL_AI_IMPROVEMENT_RUNTIME_REF_V1_PATH,
    contracts_ref: VERTICAL_AI_IMPROVEMENT_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_IMPROVEMENT_REGISTRY_V1_PATH,
    components: IMPROVEMENT_COMPONENTS.map((component) => component.component_id),
    principles: FOUNDATION_PRINCIPLES,
    platform_core_mutation: false,
    cil_mutation: false,
    repository_mutation: false,
    execute_authorized: false,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_IMPROVEMENT_REGISTRY_V1_PATH, {
    registry_id: 'improvement-registry-v1',
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_SYSTEM_ID,
    version: 'vertical_ai_improvement_foundation_v1',
    generated_at: generatedAt,
    foundation_ref: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PATH,
    architecture_ref: VERTICAL_AI_IMPROVEMENT_ARCHITECTURE_V1_PATH,
    contracts_ref: VERTICAL_AI_IMPROVEMENT_CONTRACTS_V1_PATH,
    component_model_ref: VERTICAL_AI_IMPROVEMENT_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_IMPROVEMENT_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_IMPROVEMENT_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_IMPROVEMENT_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_IMPROVEMENT_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_IMPROVEMENT_TRACEABILITY_V1_PATH,
    input_contract_ref: VERTICAL_AI_IMPROVEMENT_INPUT_CONTRACT_V1_PATH,
    improvement_runtime_ref: VERTICAL_AI_IMPROVEMENT_RUNTIME_REF_V1_PATH,
    component_ids: IMPROVEMENT_COMPONENTS.map((component) => component.component_id),
    connector_ids: CERTIFIED_CONNECTORS.map((connector) => connector.connector_id),
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    improvement_reproducibility_fingerprint: improvementReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    foundation_ready: foundationReady,
    ready_for_improvement_runtime: readyForImprovementRuntime,
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
    ? VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PASS_VERDICT
    : VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_improvement_foundation_v1_${Date.now()}`,
    phase: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Design the Vertical AI Improvement Foundation as certified-evidence-only improvement capability with hard no-mutation boundaries.',
    vertical_ai_improvement_foundation_v1_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_STATUS
      : 'VERTICAL_AI_IMPROVEMENT_FOUNDATION_NOT_READY',
    validation_passed: passed,
    design_only: true,
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    improvement_reproducibility_fingerprint: improvementReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    precondition_evidence: preconditionResults,
    brain_baseline_preserved: brainBaselineAfter.preserved,
    bundle_baseline_preserved: bundleBaselineAfter.preserved,
    access_baseline_preserved: accessBaselineAfter.preserved,
    runtime_baseline_preserved: runtimeBaselineAfter.preserved,
    cil_baseline_preserved: cilBaselineAfter.preserved,
    connector_baseline_preserved: connectorBaselineAfter.preserved,
    certification_baseline_preserved: certificationBaselineAfter.preserved,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    components: IMPROVEMENT_COMPONENTS.map((component) => component.component_id),
    foundation_ready: foundationReady,
    ready_for_improvement_runtime: readyForImprovementRuntime,
    improvement_foundation_established: foundationReady,
    certified_improvement_boundaries_defined: certifiedImprovementBoundariesDefined,
    improve_only_from_certified_evidence: improveOnlyFromCertifiedEvidence,
    evidence_to_improvement_traceability_established: evidenceToImprovementTraceability,
    improvement_reproducible: improvementReproducibility,
    no_repository_mutation: noRepositoryMutation,
    contract_validation: contractValidation,
    foundation_ref: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_PATH,
    architecture_ref: VERTICAL_AI_IMPROVEMENT_ARCHITECTURE_V1_PATH,
    component_model_ref: VERTICAL_AI_IMPROVEMENT_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_IMPROVEMENT_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_IMPROVEMENT_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_IMPROVEMENT_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_IMPROVEMENT_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_IMPROVEMENT_TRACEABILITY_V1_PATH,
    input_contract_ref: VERTICAL_AI_IMPROVEMENT_INPUT_CONTRACT_V1_PATH,
    improvement_runtime_ref: VERTICAL_AI_IMPROVEMENT_RUNTIME_REF_V1_PATH,
    contracts_ref: VERTICAL_AI_IMPROVEMENT_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_IMPROVEMENT_REGISTRY_V1_PATH,
    checks: {
      PRECONDITIONS_SATISFIED: preconditionsSatisfied,
      CERTIFICATION_RUNTIME_VERIFIED: certificationRuntimeVerified,
      CIL_COMPLETE: cilCompleteVerified,
      PLATFORM_CORE_READY: platformCoreReady,
      REPOSITORY_INTELLIGENCE_READY: repositoryIntelligenceReady,
      CERTIFIED_CONNECTORS_BOUND: certifiedConnectorsBound,
      COMPONENTS_DEFINED: componentsDefined,
      CERTIFIED_IMPROVEMENT_BOUNDARIES_DEFINED: certifiedImprovementBoundariesDefined,
      IMPROVE_ONLY_FROM_CERTIFIED_EVIDENCE: improveOnlyFromCertifiedEvidence,
      EVIDENCE_TO_IMPROVEMENT_TRACEABILITY: evidenceToImprovementTraceability,
      IMPROVEMENT_REPRODUCIBILITY: improvementReproducibility,
      REPOSITORY_FIRST: repositoryFirst,
      EVIDENCE_FIRST: evidenceFirst,
      NO_REPOSITORY_MUTATION: noRepositoryMutation,
      DESIGN_ONLY: designOnly,
      READ_ONLY: readOnly,
      REFERENCE_ONLY: referenceOnly,
      NO_SOURCE_DATA_OWNERSHIP: noSourceDataOwnership,
      PLATFORM_CORE_UNCHANGED: noPlatformCoreMutation,
      CIL_UNCHANGED: noCilMutation,
      READY_FOR_IMPROVEMENT_RUNTIME: readyForImprovementRuntime,
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

  writeJson(root, VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_IMPROVEMENT_FOUNDATION_V1_REPORT_PATH,
  };
}
