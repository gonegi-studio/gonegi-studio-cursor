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
  VERTICAL_AI_EXECUTION_FOUNDATION_V1_PATH,
  VERTICAL_AI_EXECUTION_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_EXECUTION_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_EXECUTION_WORKFLOW_V1_PATH,
  VERTICAL_AI_EXECUTION_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_EXECUTION_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_EXECUTION_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_EXECUTION_TRACEABILITY_V1_PATH,
  VERTICAL_AI_EXECUTION_CONNECTOR_SELECTION_V1_PATH,
  VERTICAL_AI_EXECUTION_RUNTIME_REF_V1_PATH,
  VERTICAL_AI_EXECUTION_CONTRACTS_V1_PATH,
  VERTICAL_AI_EXECUTION_REGISTRY_V1_PATH,
} from './verticalAiExecutionFoundationV1Engine.js';
import {
  VERTICAL_AI_EXECUTION_RUNTIME_V1_PASS_VERDICT,
  VERTICAL_AI_EXECUTION_RUNTIME_V1_PATH,
  VERTICAL_AI_EXECUTION_RUNTIME_V1_REPORT_PATH,
} from './verticalAiExecutionRuntimeV1Engine.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE = 'PHASE-VAI-007' as const;
export const VERTICAL_AI_VALIDATION_FOUNDATION_V1_SYSTEM_ID = 'VERTICAL_AI_VALIDATION_FOUNDATION_V1' as const;
export const VERTICAL_AI_VALIDATION_FOUNDATION_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_VALIDATION_FOUNDATION_V1' as const;
export const VERTICAL_AI_VALIDATION_FOUNDATION_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_VALIDATION_FOUNDATION_V1' as const;
export const VERTICAL_AI_VALIDATION_FOUNDATION_V1_STATUS = 'VERTICAL_AI_VALIDATION_DEFINED' as const;

export const VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR = 'datasets/vertical_ai_validation_foundation_v1' as const;
export const VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/vertical-ai-validation-foundation-v1.json` as const;
export const VERTICAL_AI_VALIDATION_ARCHITECTURE_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/validation-architecture-v1.json` as const;
export const VERTICAL_AI_VALIDATION_COMPONENT_MODEL_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/validation-component-model-v1.json` as const;
export const VERTICAL_AI_VALIDATION_WORKFLOW_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/validation-workflow-v1.json` as const;
export const VERTICAL_AI_VALIDATION_BOUNDARY_MODEL_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/validation-boundary-model-v1.json` as const;
export const VERTICAL_AI_VALIDATION_CONTRACTS_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/validation-contracts-v1.json` as const;
export const VERTICAL_AI_VALIDATION_REGISTRY_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/validation-registry-v1.json` as const;
export const VERTICAL_AI_VALIDATION_APPROVAL_GATE_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/validation-approval-gate-v1.json` as const;
export const VERTICAL_AI_VALIDATION_EVIDENCE_MODEL_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/validation-evidence-model-v1.json` as const;
export const VERTICAL_AI_VALIDATION_TRACEABILITY_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/validation-traceability-v1.json` as const;
export const VERTICAL_AI_VALIDATION_RULES_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/validation-rules-v1.json` as const;
export const VERTICAL_AI_VALIDATION_RUNTIME_REF_V1_PATH =
  `${VERTICAL_AI_VALIDATION_FOUNDATION_V1_DIR}/validation-runtime-ref-v1.json` as const;
export const VERTICAL_AI_VALIDATION_FOUNDATION_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_VALIDATION_FOUNDATION_V1_REPORT.json' as const;

const FOUNDATION_NAME = 'Evidence-Bound Vertical AI Validation Foundation V1' as const;
const CAPABILITY_ID = 'vertical_ai_validation' as const;
const LAYER_ID = 'validation' as const;

export const VAIVF_CONTRACT_IDS = [
  'VAIVF_EXECUTION_RUNTIME_VERIFIED',
  'VAIVF_CIL_COMPLETE_VERIFIED',
  'VAIVF_PLATFORM_CORE_READY',
  'VAIVF_REPOSITORY_INTELLIGENCE_READY',
  'VAIVF_CERTIFIED_CONNECTORS_BOUND',
  'VAIVF_COMPONENTS_DEFINED',
  'VAIVF_CERTIFIED_VALIDATION_BOUNDARIES_DEFINED',
  'VAIVF_EVIDENCE_TO_VALIDATION_TRACEABILITY',
  'VAIVF_VALIDATION_REPRODUCIBILITY',
  'VAIVF_REPOSITORY_FIRST',
  'VAIVF_EVIDENCE_FIRST',
  'VAIVF_REUSE_BEFORE_CREATE',
  'VAIVF_HUMAN_APPROVAL_BEFORE_REPO_MUTATION',
  'VAIVF_CONSUMES_PLATFORM_CORE_V1_ONLY',
  'VAIVF_CONSUMES_CIL_V1_ONLY',
  'VAIVF_CONSUMES_REPOSITORY_INTELLIGENCE_ONLY',
  'VAIVF_CONSUMES_CERTIFIED_CONNECTORS_ONLY',
  'VAIVF_DESIGN_ONLY',
  'VAIVF_READ_ONLY',
  'VAIVF_REFERENCE_ONLY',
  'VAIVF_NO_SOURCE_DATA_OWNERSHIP',
  'VAIVF_NO_PLATFORM_CORE_MUTATION',
  'VAIVF_NO_CIL_MUTATION',
  'VAIVF_READY_FOR_VALIDATION_RUNTIME',
  'VAIVF_FOUNDATION_READY',
] as const;

const REQUIRED_COMPONENT_IDS = [
  'validation_context',
  'validation_selector',
  'validation_rules',
  'contract_validation',
  'boundary_validation',
  'result_validation',
  'validation_evidence',
  'validation_traceability',
  'validation_reproducibility',
  'validation_contract',
  'validation_runtime_ref',
  'approval_gate',
  'validation_boundary_integrity',
] as const;

const CERTIFIED_CONNECTORS = [
  { connector_id: 'claude_connector', master_snapshot_ref: CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'chatgpt_connector', master_snapshot_ref: CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'gemini_connector', master_snapshot_ref: GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'cursor_connector', master_snapshot_ref: CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'mcp_connector', master_snapshot_ref: MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
] as const;

/**
 * Vertical AI Validation is design-only capacity that turns execution runtime outputs into
 * evidence-traced validation descriptors. It validates contracts, boundaries, and results
 * without mutating Platform Core or CIL. Repository mutation requires human approval.
 */
const VALIDATION_COMPONENTS = [
  {
    component_id: 'validation_context',
    name: 'Validation Context',
    responsibility:
      'Assemble a read-only validation context from execution runtime outputs, Platform Core, CIL, Repository Intelligence, and certified connector snapshots.',
    interface_kind: 'context',
    owns_source_data: false,
    mode: 'reference_only',
    write_authorized: false,
  },
  {
    component_id: 'validation_selector',
    name: 'Validation Selector',
    responsibility:
      'Select which execution results, contracts, and boundaries to validate using repository-first, evidence-first priority; never invents unauthorized writes.',
    interface_kind: 'selection',
    owns_source_data: false,
    mode: 'evidence_bound',
    write_authorized: false,
  },
  {
    component_id: 'validation_rules',
    name: 'Validation Rules',
    responsibility:
      'Declare reusable, deterministic validation rules for contracts, boundaries, reuse-before-create, and result integrity without owning source data.',
    interface_kind: 'rules',
    owns_source_data: false,
    mode: 'rule_catalog',
    write_authorized: false,
  },
  {
    component_id: 'contract_validation',
    name: 'Contract Validation',
    responsibility:
      'Validate conformance to certified Platform Core, CIL, connector, and Vertical AI contracts cited by execution outputs.',
    interface_kind: 'validation',
    owns_source_data: false,
    mode: 'evidence_bound',
    write_authorized: false,
  },
  {
    component_id: 'boundary_validation',
    name: 'Boundary Validation',
    responsibility:
      'Validate that certified execution boundaries remain intact: no PC/CIL mutation, certified connectors only, write authorization blocked.',
    interface_kind: 'validation',
    owns_source_data: false,
    mode: 'boundary_check',
    write_authorized: false,
  },
  {
    component_id: 'result_validation',
    name: 'Result Validation',
    responsibility:
      'Validate execution result fingerprints for reproducibility, determinism, and evidence precedence before any approval or runtime handoff.',
    interface_kind: 'validation',
    owns_source_data: false,
    mode: 'result_check',
    write_authorized: false,
  },
  {
    component_id: 'validation_evidence',
    name: 'Validation Evidence',
    responsibility:
      'Bind fingerprints and refs so every validation conclusion is preceded by execution and planning evidence.',
    interface_kind: 'evidence',
    owns_source_data: false,
    mode: 'evidence_only',
    write_authorized: false,
  },
  {
    component_id: 'validation_traceability',
    name: 'Validation Traceability',
    responsibility:
      'Maintain evidence-to-validation traceability from execution outputs through rules, contract/boundary/result checks, and approval readiness.',
    interface_kind: 'traceability',
    owns_source_data: false,
    mode: 'evidence_to_validation',
    write_authorized: false,
  },
  {
    component_id: 'validation_reproducibility',
    name: 'Validation Reproducibility',
    responsibility:
      'Ensure identical evidence and execution inputs yield identical validation design fingerprints across dual runs.',
    interface_kind: 'reproducibility',
    owns_source_data: false,
    mode: 'deterministic',
    write_authorized: false,
  },
  {
    component_id: 'validation_contract',
    name: 'Validation Contract',
    responsibility:
      'Declare the validation boundary contract: consumes PC/CIL/RI/certified connectors/execution runtime only; forbids PC/CIL mutation and unapproved repository mutation.',
    interface_kind: 'contract',
    owns_source_data: false,
    mode: 'boundary_contract',
    write_authorized: false,
  },
  {
    component_id: 'validation_runtime_ref',
    name: 'Validation Runtime Reference',
    responsibility:
      'Reference the certified surfaces future Validation Runtime will bind (execution runtime, Agent Runtime, CIL); reference-only, no mutation.',
    interface_kind: 'reference',
    owns_source_data: false,
    mode: 'runtime_ref',
    write_authorized: false,
  },
  {
    component_id: 'approval_gate',
    name: 'Approval Gate',
    responsibility:
      'Require explicit human approval before any repository mutation that validation might later recommend; foundation runs remain read-only.',
    interface_kind: 'gate',
    owns_source_data: false,
    mode: 'human_approval_required',
    write_authorized: false,
  },
  {
    component_id: 'validation_boundary_integrity',
    name: 'Validation Boundary Integrity',
    responsibility:
      'Codify and design integrity checks for certified validation boundaries across Platform Core, CIL, connectors, and repository mutation gates.',
    interface_kind: 'boundary',
    owns_source_data: false,
    mode: 'boundary_enforcement_design',
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
  reuse_precedes_creation: true,
  evidence_to_validation_traceability: true,
  validation_reproducibility: true,
  certified_validation_boundaries_defined: true,
  human_approval_required_before_repository_mutation: true,
  consumes_platform_core_v1_only: true,
  consumes_cil_v1_only: true,
  consumes_repository_intelligence_only: true,
  consumes_certified_connectors_only: true,
  consumes_execution_runtime: true,
  owns_source_data: false,
  platform_core_mutation: false,
  cil_mutation: false,
  validation_runtime_deferred: true,
  independently_evolvable: true,
} as const;

const EXECUTION_FLAGS = {
  ...FOUNDATION_PRINCIPLES,
  execute_authorized: false as const,
  write_authorized: false as const,
};

const EVIDENCE_TO_VALIDATION_WORKFLOW = {
  workflow_id: 'evidence_to_validation_v1',
  policy: 'evidence_first_validation',
  reuse_policy: 'reuse_before_create',
  repository_policy: 'repository_first',
  connector_policy: 'certified_connectors_only',
  evidence_policy: 'evidence_precedes_validation_conclusions',
  write_policy: 'human_approval_required_before_repository_mutation',
  traceability_policy: 'evidence_to_validation',
  steps: [
    { step_id: 'build_context', component_id: 'validation_context', write: false },
    { step_id: 'bind_runtime_ref', component_id: 'validation_runtime_ref', write: false },
    { step_id: 'select', component_id: 'validation_selector', write: false },
    { step_id: 'load_rules', component_id: 'validation_rules', write: false },
    { step_id: 'validate_contracts', component_id: 'contract_validation', write: false },
    { step_id: 'validate_boundaries', component_id: 'boundary_validation', write: false },
    { step_id: 'validate_results', component_id: 'result_validation', write: false },
    { step_id: 'declare_contract', component_id: 'validation_contract', write: false },
    { step_id: 'bind_evidence', component_id: 'validation_evidence', write: false },
    { step_id: 'trace', component_id: 'validation_traceability', write: false },
    { step_id: 'reproducibility', component_id: 'validation_reproducibility', write: false },
    { step_id: 'integrity', component_id: 'validation_boundary_integrity', write: false },
    {
      step_id: 'approval',
      component_id: 'approval_gate',
      write: false,
      blocks_repository_mutation_until_human_approval: true,
    },
    {
      step_id: 'validation_runtime_handoff',
      deferred: true,
      requires: ['validation_foundation_ready', 'human_approval_if_repository_mutation'],
    },
  ],
  forbidden_before_evidence: [
    'pass_without_contract_validation',
    'pass_without_boundary_validation',
    'select_uncertified_connector',
    'mutate_platform_core',
    'mutate_cil',
    'repository_mutation_without_human_approval',
  ],
} as const;

const VALIDATION_RULE_CATALOG = [
  { rule_id: 'VR_CONTRACT_CONFORMANCE', target: 'contract_validation', requires_evidence: true },
  { rule_id: 'VR_BOUNDARY_INTEGRITY', target: 'boundary_validation', requires_evidence: true },
  { rule_id: 'VR_RESULT_REPRODUCIBILITY', target: 'result_validation', requires_evidence: true },
  { rule_id: 'VR_REUSE_BEFORE_CREATE', target: 'validation_rules', requires_evidence: true },
  { rule_id: 'VR_CERTIFIED_CONNECTORS_ONLY', target: 'boundary_validation', requires_evidence: true },
  { rule_id: 'VR_WRITE_BLOCKED_WITHOUT_APPROVAL', target: 'approval_gate', requires_evidence: true },
] as const;

const PROPOSED_VAI_PHASE_CHAIN = [
  { phase_id: 'PHASE-VAI-005', title: 'Execution foundation', focus: 'Evidence-to-execution design' },
  { phase_id: 'PHASE-VAI-006', title: 'Execution runtime', focus: 'Operational execution runtime' },
  {
    phase_id: 'PHASE-VAI-007',
    title: 'Validation foundation',
    focus: 'Design evidence-to-validation with certified boundaries',
  },
  {
    phase_id: 'PHASE-VAI-008',
    title: 'Validation runtime',
    focus: 'Implement validation runtime over certified foundation',
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

const PROTECTED_EXECUTION_PATHS = [
  VERTICAL_AI_EXECUTION_FOUNDATION_V1_PATH,
  VERTICAL_AI_EXECUTION_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_EXECUTION_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_EXECUTION_WORKFLOW_V1_PATH,
  VERTICAL_AI_EXECUTION_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_EXECUTION_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_EXECUTION_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_EXECUTION_TRACEABILITY_V1_PATH,
  VERTICAL_AI_EXECUTION_CONNECTOR_SELECTION_V1_PATH,
  VERTICAL_AI_EXECUTION_RUNTIME_REF_V1_PATH,
  VERTICAL_AI_EXECUTION_CONTRACTS_V1_PATH,
  VERTICAL_AI_EXECUTION_REGISTRY_V1_PATH,
  VERTICAL_AI_EXECUTION_RUNTIME_V1_PATH,
] as const;

const PRECONDITION_EVIDENCE = [
  {
    precondition_id: 'execution_runtime',
    report_path: VERTICAL_AI_EXECUTION_RUNTIME_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_EXECUTION_RUNTIME_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_EXECUTION_RUNTIME_V1_PATH,
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
    ['VAIVF_EXECUTION_RUNTIME_VERIFIED', 'executionRuntimeVerified'],
    ['VAIVF_CIL_COMPLETE_VERIFIED', 'cilCompleteVerified'],
    ['VAIVF_PLATFORM_CORE_READY', 'platformCoreReady'],
    ['VAIVF_REPOSITORY_INTELLIGENCE_READY', 'repositoryIntelligenceReady'],
    ['VAIVF_CERTIFIED_CONNECTORS_BOUND', 'certifiedConnectorsBound'],
    ['VAIVF_COMPONENTS_DEFINED', 'componentsDefined'],
    ['VAIVF_CERTIFIED_VALIDATION_BOUNDARIES_DEFINED', 'certifiedValidationBoundariesDefined'],
    ['VAIVF_EVIDENCE_TO_VALIDATION_TRACEABILITY', 'evidenceToValidationTraceability'],
    ['VAIVF_VALIDATION_REPRODUCIBILITY', 'validationReproducibility'],
    ['VAIVF_REPOSITORY_FIRST', 'repositoryFirst'],
    ['VAIVF_EVIDENCE_FIRST', 'evidenceFirst'],
    ['VAIVF_REUSE_BEFORE_CREATE', 'reuseBeforeCreate'],
    ['VAIVF_HUMAN_APPROVAL_BEFORE_REPO_MUTATION', 'humanApprovalBeforeRepoMutation'],
    ['VAIVF_CONSUMES_PLATFORM_CORE_V1_ONLY', 'consumesPlatformCoreV1Only'],
    ['VAIVF_CONSUMES_CIL_V1_ONLY', 'consumesCilV1Only'],
    ['VAIVF_CONSUMES_REPOSITORY_INTELLIGENCE_ONLY', 'consumesRepositoryIntelligenceOnly'],
    ['VAIVF_CONSUMES_CERTIFIED_CONNECTORS_ONLY', 'consumesCertifiedConnectorsOnly'],
    ['VAIVF_DESIGN_ONLY', 'designOnly'],
    ['VAIVF_READ_ONLY', 'readOnly'],
    ['VAIVF_REFERENCE_ONLY', 'referenceOnly'],
    ['VAIVF_NO_SOURCE_DATA_OWNERSHIP', 'noSourceDataOwnership'],
    ['VAIVF_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAIVF_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAIVF_READY_FOR_VALIDATION_RUNTIME', 'readyForValidationRuntime'],
    ['VAIVF_FOUNDATION_READY', 'foundationReady'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return {
    contract_ids: [...VAIVF_CONTRACT_IDS],
    results,
    aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const),
  };
}

export function writeVerticalAiValidationFoundationV1EngineReport(): {
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
  const executionBaselineBefore = captureBaselineMtimes(root, PROTECTED_EXECUTION_PATHS);

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

  const executionRuntimeVerified =
    preconditionResults.find((entry) => entry.precondition_id === 'execution_runtime')?.satisfied ===
    true;
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
  const executionRuntime = readJson<{
    decision_fingerprint?: string;
    runtime_implemented?: boolean;
    ready_for_validation?: boolean;
    result_fingerprint?: string;
    dispatch_fingerprint?: string;
    certified_execution_boundaries_preserved?: boolean;
  }>(root, VERTICAL_AI_EXECUTION_RUNTIME_V1_PATH);

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
  if (executionRuntime?.runtime_implemented !== true) {
    issues.push({
      code: 'EXECUTION_RUNTIME_NOT_IMPLEMENTED',
      message: 'Execution Runtime must be implemented',
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
    execution: {
      foundation_ref: VERTICAL_AI_EXECUTION_FOUNDATION_V1_PATH,
      runtime_ref: VERTICAL_AI_EXECUTION_RUNTIME_V1_PATH,
      result_fingerprint: executionRuntime?.result_fingerprint ?? null,
      dispatch_fingerprint: executionRuntime?.dispatch_fingerprint ?? null,
      certified_boundaries_preserved:
        executionRuntime?.certified_execution_boundaries_preserved === true,
    },
    certified_connectors: Object.fromEntries(
      CERTIFIED_CONNECTORS.map((connector) => [connector.connector_id, connector.master_snapshot_ref])
    ),
    reference_mode: 'read_only' as const,
    duplication_policy: 'references_only' as const,
    mutation_policy: 'never_mutate_platform_core_or_cil' as const,
  };

  const designFingerprint = stableFingerprint({
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    components: VALIDATION_COMPONENTS,
    principles: FOUNDATION_PRINCIPLES,
    workflow: EVIDENCE_TO_VALIDATION_WORKFLOW,
    rules: VALIDATION_RULE_CATALOG,
    phase_chain: PROPOSED_VAI_PHASE_CHAIN,
  });

  const decisionFingerprint = stableFingerprint({
    goalTruthFingerprint: goalTruth.fingerprint,
    executionDecision: executionRuntime?.decision_fingerprint ?? null,
    brainDecision: brainComplete?.decision_fingerprint ?? null,
    bundleDecision: bundleComplete?.decision_fingerprint ?? null,
    accessDecision: accessComplete?.decision_fingerprint ?? null,
    designFingerprint,
    preconditionCount: preconditionResults.filter((entry) => entry.satisfied).length,
    mode: 'design_only',
  });

  const validationReproducibilityFingerprint = stableFingerprint({
    designFingerprint,
    executionResult: executionRuntime?.result_fingerprint ?? null,
    executionDispatch: executionRuntime?.dispatch_fingerprint ?? null,
    rules: VALIDATION_RULE_CATALOG.map((rule) => rule.rule_id),
    evidenceFirst: true,
  });

  writeJson(root, VERTICAL_AI_VALIDATION_COMPONENT_MODEL_V1_PATH, {
    validation_component_model_v1_id: 'validation_component_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    responsibility:
      'Design evidence-to-validation Vertical AI capacity that verifies contracts, boundaries, and results without mutating Platform Core or CIL',
    components: VALIDATION_COMPONENTS,
    principles: FOUNDATION_PRINCIPLES,
    design_only: true,
    implementation: false,
  });

  writeJson(root, VERTICAL_AI_VALIDATION_RULES_V1_PATH, {
    validation_rules_v1_id: 'validation_rules_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    rule_catalog: VALIDATION_RULE_CATALOG,
    deterministic: true,
    reusable: true,
  });

  writeJson(root, VERTICAL_AI_VALIDATION_RUNTIME_REF_V1_PATH, {
    validation_runtime_ref_v1_id: 'validation_runtime_ref_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    execution_runtime_ref: VERTICAL_AI_EXECUTION_RUNTIME_V1_PATH,
    execution_foundation_ref: VERTICAL_AI_EXECUTION_FOUNDATION_V1_PATH,
    agent_runtime_ref: AGENT_RUNTIME_V1_PATH,
    agent_runtime_master_snapshot_ref: AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
    cil_runtime_connector_ref: RUNTIME_CONNECTOR_V1_PATH,
    reference_only: true,
    mutation_forbidden: true,
  });

  writeJson(root, VERTICAL_AI_VALIDATION_WORKFLOW_V1_PATH, {
    validation_workflow_v1_id: 'validation_workflow_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_first: true,
    repository_first: true,
    reuse_before_create: true,
    evidence_to_validation_traceability: true,
    validation_reproducibility: true,
    certified_validation_boundaries_defined: true,
    human_approval_required_before_repository_mutation: true,
    validation_runtime_deferred: true,
    workflow: EVIDENCE_TO_VALIDATION_WORKFLOW,
    readiness_for_validation_runtime: {
      requires: [
        'validation_components_defined',
        'certified_validation_boundaries_defined',
        'evidence_to_validation_traceability',
        'approval_gate_armed',
      ],
      creates_implementation: false,
      mutates_platform_core: false,
      mutates_cil: false,
    },
  });

  writeJson(root, VERTICAL_AI_VALIDATION_APPROVAL_GATE_V1_PATH, {
    validation_approval_gate_v1_id: 'validation_approval_gate_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    gate_policy: {
      human_approval_required_before_repository_mutation: true,
      validation_foundation_runs_are_read_only: true,
      repository_mutation_blocked_until_approval: true,
      platform_core_mutation_forbidden: true,
      cil_mutation_forbidden: true,
      validation_runtime_handoff_requires_foundation: true,
    },
    write_actions_gated: [
      'repository_create',
      'repository_modify',
      'repository_delete',
      'validation_runtime_materialization',
      'remediation_enactment',
    ],
    design_only: true,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_VALIDATION_EVIDENCE_MODEL_V1_PATH, {
    validation_evidence_model_v1_id: 'validation_evidence_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_policy: {
      evidence_first: true,
      evidence_precedes_validation_conclusions: true,
      conclusions_without_evidence_forbidden: true,
      fingerprints_required: true,
      execution_runtime_citations_required: true,
      certified_connector_citations_required: true,
    },
    precondition_evidence: preconditionResults,
    consumed_refs: consumedRefs,
    objective_evidence: preconditionResults.map(
      (entry) =>
        `${entry.precondition_id}=${entry.satisfied}:${entry.pass_verdict}:artifact=${entry.artifact_present}`
    ),
  });

  writeJson(root, VERTICAL_AI_VALIDATION_TRACEABILITY_V1_PATH, {
    validation_traceability_v1_id: 'validation_traceability_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_to_validation_traceability: true,
    chain: [
      { from: 'execution_runtime', to: 'validation_context' },
      { from: 'validation_context', to: 'validation_selector' },
      { from: 'validation_runtime_ref', to: 'validation_rules' },
      { from: 'validation_selector', to: 'contract_validation' },
      { from: 'validation_rules', to: 'contract_validation' },
      { from: 'validation_rules', to: 'boundary_validation' },
      { from: 'validation_rules', to: 'result_validation' },
      { from: 'validation_contract', to: 'validation_boundary_integrity' },
      { from: 'validation_evidence', to: 'validation_traceability' },
      { from: 'validation_traceability', to: 'validation_reproducibility' },
      { from: 'validation_boundary_integrity', to: 'approval_gate' },
    ],
    reproducibility_fingerprint: validationReproducibilityFingerprint,
  });

  writeJson(root, VERTICAL_AI_VALIDATION_BOUNDARY_MODEL_V1_PATH, {
    validation_boundary_model_v1_id: 'validation_boundary_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    boundary_policy: {
      consumes_platform_core_v1_only: true,
      consumes_cil_v1_only: true,
      consumes_repository_intelligence_only: true,
      consumes_certified_connectors_only: true,
      consumes_execution_runtime: true,
      owns_source_data: false,
      platform_core_mutation: false,
      cil_mutation: false,
      repository_mutation_requires_human_approval: true,
      validation_runtime_deferred: true,
      certified_validation_boundaries_defined: true,
    },
    consumed_refs: consumedRefs,
    forbidden_operations: [
      'platform_core_mutation',
      'cil_mutation',
      'uncertified_connector_selection',
      'repository_mutation_without_human_approval',
      'validation_without_evidence',
      'pass_without_boundary_validation',
    ],
  });

  writeJson(root, VERTICAL_AI_VALIDATION_ARCHITECTURE_V1_PATH, {
    validation_architecture_v1_id: 'validation_architecture_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    selected_architecture: 'Evidence-to-Validation Vertical AI Foundation with Certified Boundaries',
    independence_statement:
      'Vertical AI Validation turns execution runtime outputs into evidence-traced validation descriptors. It consumes Platform Core V1, CIL V1, Repository Intelligence, certified Consumer Connectors, and Execution Runtime only — read-only and reference-only — and never mutates Platform Core or CIL. Certified validation boundaries are defined for contracts, execution boundaries, and results. Human approval is required before repository mutation. Evolution of this capability is independent of Platform Core and CIL.',
    stack: {
      platform_core: { role: 'Semantic + structural + execution truth', interaction: 'consume_v1_only' },
      cil: { role: 'Certified integration contracts', interaction: 'consume_v1_only' },
      repository_intelligence: { role: 'Structural repository truth', interaction: 'reference_only' },
      certified_connectors: { role: 'Reasoning-side certified consumers', interaction: 'reference_only' },
      execution_runtime: {
        role: 'Execution results and certified boundaries',
        interaction: 'consume_operational_execution',
      },
      validation: {
        role: 'Evidence-to-validation design before validation runtime',
        interaction: 'design_only_foundation',
        owns_source_data: false,
      },
    },
    component_model_ref: VERTICAL_AI_VALIDATION_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_VALIDATION_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_VALIDATION_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_VALIDATION_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_VALIDATION_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_VALIDATION_TRACEABILITY_V1_PATH,
    rules_ref: VERTICAL_AI_VALIDATION_RULES_V1_PATH,
    validation_runtime_ref: VERTICAL_AI_VALIDATION_RUNTIME_REF_V1_PATH,
    proposed_phase_chain: PROPOSED_VAI_PHASE_CHAIN,
    design_principles: Object.entries(FOUNDATION_PRINCIPLES)
      .filter(([, value]) => value === true)
      .map(([key]) => key),
  });

  const componentsDefined =
    VALIDATION_COMPONENTS.length === REQUIRED_COMPONENT_IDS.length &&
    REQUIRED_COMPONENT_IDS.every((id) =>
      VALIDATION_COMPONENTS.some((component) => component.component_id === id)
    );

  const certifiedValidationBoundariesDefined =
    FOUNDATION_PRINCIPLES.certified_validation_boundaries_defined === true &&
    VALIDATION_COMPONENTS.some((component) => component.component_id === 'validation_boundary_integrity') &&
    VALIDATION_COMPONENTS.some((component) => component.component_id === 'boundary_validation');

  const evidenceToValidationTraceability =
    FOUNDATION_PRINCIPLES.evidence_to_validation_traceability === true &&
    VALIDATION_COMPONENTS.some((component) => component.component_id === 'validation_traceability');

  const validationReproducibility =
    FOUNDATION_PRINCIPLES.validation_reproducibility === true &&
    VALIDATION_COMPONENTS.some((component) => component.component_id === 'validation_reproducibility') &&
    validationReproducibilityFingerprint.length === 16;

  const repositoryFirst =
    FOUNDATION_PRINCIPLES.repository_first === true &&
    EVIDENCE_TO_VALIDATION_WORKFLOW.repository_policy === 'repository_first';
  const evidenceFirst =
    FOUNDATION_PRINCIPLES.evidence_first === true &&
    EVIDENCE_TO_VALIDATION_WORKFLOW.policy === 'evidence_first_validation';
  const reuseBeforeCreate =
    FOUNDATION_PRINCIPLES.reuse_precedes_creation === true &&
    EVIDENCE_TO_VALIDATION_WORKFLOW.reuse_policy === 'reuse_before_create';

  const humanApprovalBeforeRepoMutation =
    FOUNDATION_PRINCIPLES.human_approval_required_before_repository_mutation === true &&
    VALIDATION_COMPONENTS.some((component) => component.component_id === 'approval_gate') &&
    VALIDATION_COMPONENTS.every((component) => component.write_authorized === false);

  const designOnly =
    FOUNDATION_PRINCIPLES.design_only === true &&
    FOUNDATION_PRINCIPLES.implementation_deferred === true &&
    FOUNDATION_PRINCIPLES.implementation === false;
  const readOnly = FOUNDATION_PRINCIPLES.read_only === true && consumedRefs.reference_mode === 'read_only';
  const referenceOnly =
    FOUNDATION_PRINCIPLES.reference_only === true && consumedRefs.duplication_policy === 'references_only';
  const noSourceDataOwnership =
    FOUNDATION_PRINCIPLES.owns_source_data === false &&
    VALIDATION_COMPONENTS.every((component) => component.owns_source_data === false);

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
  const executionBaselineAfter = verifyBaselinePreserved(
    root,
    executionBaselineBefore,
    PROTECTED_EXECUTION_PATHS
  );

  const baselineChecks: Array<[string, { preserved: boolean; drift: string[] }, string]> = [
    ['BRAIN_BASELINE_MUTATION', brainBaselineAfter, 'Project Brain baseline changed'],
    ['BUNDLE_BASELINE_MUTATION', bundleBaselineAfter, 'RIB baseline changed'],
    ['ACCESS_BASELINE_MUTATION', accessBaselineAfter, 'Access Layer baseline changed'],
    ['RUNTIME_BASELINE_MUTATION', runtimeBaselineAfter, 'Agent Runtime baseline changed'],
    ['CIL_BASELINE_MUTATION', cilBaselineAfter, 'CIL baseline changed'],
    ['CONNECTOR_BASELINE_MUTATION', connectorBaselineAfter, 'Certified connector baseline changed'],
    ['EXECUTION_BASELINE_MUTATION', executionBaselineAfter, 'Execution baseline changed'],
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
    executionRuntimeVerified &&
    cilCompleteVerified &&
    platformCoreReady &&
    repositoryIntelligenceReady &&
    certifiedConnectorsBound &&
    certifiedValidationBoundariesDefined &&
    evidenceToValidationTraceability &&
    validationReproducibility &&
    repositoryFirst &&
    evidenceFirst &&
    reuseBeforeCreate &&
    humanApprovalBeforeRepoMutation &&
    noPlatformCoreMutation &&
    noCilMutation &&
    connectorBaselineAfter.preserved &&
    executionBaselineAfter.preserved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const readyForValidationRuntime =
    foundationReadyCandidate &&
    FOUNDATION_PRINCIPLES.validation_runtime_deferred === true &&
    designOnly &&
    executionRuntime?.ready_for_validation === true;

  const foundationReady = foundationReadyCandidate && readyForValidationRuntime;

  const contractValidation = validateFoundationContracts({
    executionRuntimeVerified,
    cilCompleteVerified,
    platformCoreReady,
    repositoryIntelligenceReady,
    certifiedConnectorsBound,
    componentsDefined,
    certifiedValidationBoundariesDefined,
    evidenceToValidationTraceability,
    validationReproducibility,
    repositoryFirst,
    evidenceFirst,
    reuseBeforeCreate,
    humanApprovalBeforeRepoMutation,
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
    readyForValidationRuntime,
    foundationReady,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'FOUNDATION_CONTRACT_FAILURE',
      message: 'One or more Vertical AI Validation foundation contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_VALIDATION_CONTRACTS_V1_PATH, {
    validation_contracts_v1_id: 'validation_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    foundation_ref: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH,
    contract_ids: [...VAIVF_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: FOUNDATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH, {
    vertical_ai_validation_foundation_v1_id: 'vertical_ai_validation_foundation_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_VALIDATION_FOUNDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    validation_reproducibility_fingerprint: validationReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    preconditions_satisfied: preconditionsSatisfied,
    design_only: true,
    execution: false,
    implementation: false,
    foundation_ready: foundationReady,
    ready_for_validation_runtime: readyForValidationRuntime,
    validation_foundation_established: foundationReady,
    certified_validation_boundaries_defined: certifiedValidationBoundariesDefined,
    evidence_to_validation_traceability: evidenceToValidationTraceability,
    validation_reproducible: validationReproducibility,
    repository_first: repositoryFirst,
    evidence_first: evidenceFirst,
    reuse_before_create: reuseBeforeCreate,
    human_approval_required_before_repository_mutation: humanApprovalBeforeRepoMutation,
    architecture_ref: VERTICAL_AI_VALIDATION_ARCHITECTURE_V1_PATH,
    component_model_ref: VERTICAL_AI_VALIDATION_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_VALIDATION_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_VALIDATION_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_VALIDATION_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_VALIDATION_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_VALIDATION_TRACEABILITY_V1_PATH,
    rules_ref: VERTICAL_AI_VALIDATION_RULES_V1_PATH,
    validation_runtime_ref: VERTICAL_AI_VALIDATION_RUNTIME_REF_V1_PATH,
    contracts_ref: VERTICAL_AI_VALIDATION_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_VALIDATION_REGISTRY_V1_PATH,
    components: VALIDATION_COMPONENTS.map((component) => component.component_id),
    principles: FOUNDATION_PRINCIPLES,
    platform_core_mutation: false,
    cil_mutation: false,
    execute_authorized: false,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_VALIDATION_REGISTRY_V1_PATH, {
    registry_id: 'validation-registry-v1',
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_VALIDATION_FOUNDATION_V1_SYSTEM_ID,
    version: 'vertical_ai_validation_foundation_v1',
    generated_at: generatedAt,
    foundation_ref: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH,
    architecture_ref: VERTICAL_AI_VALIDATION_ARCHITECTURE_V1_PATH,
    contracts_ref: VERTICAL_AI_VALIDATION_CONTRACTS_V1_PATH,
    component_model_ref: VERTICAL_AI_VALIDATION_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_VALIDATION_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_VALIDATION_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_VALIDATION_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_VALIDATION_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_VALIDATION_TRACEABILITY_V1_PATH,
    rules_ref: VERTICAL_AI_VALIDATION_RULES_V1_PATH,
    validation_runtime_ref: VERTICAL_AI_VALIDATION_RUNTIME_REF_V1_PATH,
    component_ids: VALIDATION_COMPONENTS.map((component) => component.component_id),
    connector_ids: CERTIFIED_CONNECTORS.map((connector) => connector.connector_id),
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    validation_reproducibility_fingerprint: validationReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    foundation_ready: foundationReady,
    ready_for_validation_runtime: readyForValidationRuntime,
    independent_capability: CAPABILITY_ID,
  });

  const passed =
    foundationReady &&
    noPlatformCoreMutation &&
    noCilMutation &&
    contractValidation.aggregate_verdict === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verdict = passed
    ? VERTICAL_AI_VALIDATION_FOUNDATION_V1_PASS_VERDICT
    : VERTICAL_AI_VALIDATION_FOUNDATION_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_validation_foundation_v1_${Date.now()}`,
    phase: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_VALIDATION_FOUNDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Design the Vertical AI Validation Foundation as evidence-to-validation capability with certified validation boundaries and human approval before repository mutation.',
    vertical_ai_validation_foundation_v1_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_VALIDATION_FOUNDATION_V1_STATUS
      : 'VERTICAL_AI_VALIDATION_FOUNDATION_NOT_READY',
    validation_passed: passed,
    design_only: true,
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    validation_reproducibility_fingerprint: validationReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    precondition_evidence: preconditionResults,
    brain_baseline_preserved: brainBaselineAfter.preserved,
    bundle_baseline_preserved: bundleBaselineAfter.preserved,
    access_baseline_preserved: accessBaselineAfter.preserved,
    runtime_baseline_preserved: runtimeBaselineAfter.preserved,
    cil_baseline_preserved: cilBaselineAfter.preserved,
    connector_baseline_preserved: connectorBaselineAfter.preserved,
    execution_baseline_preserved: executionBaselineAfter.preserved,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    components: VALIDATION_COMPONENTS.map((component) => component.component_id),
    foundation_ready: foundationReady,
    ready_for_validation_runtime: readyForValidationRuntime,
    validation_foundation_established: foundationReady,
    certified_validation_boundaries_defined: certifiedValidationBoundariesDefined,
    evidence_to_validation_traceability_established: evidenceToValidationTraceability,
    validation_reproducible: validationReproducibility,
    contract_validation: contractValidation,
    foundation_ref: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH,
    architecture_ref: VERTICAL_AI_VALIDATION_ARCHITECTURE_V1_PATH,
    component_model_ref: VERTICAL_AI_VALIDATION_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_VALIDATION_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_VALIDATION_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_VALIDATION_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_VALIDATION_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_VALIDATION_TRACEABILITY_V1_PATH,
    rules_ref: VERTICAL_AI_VALIDATION_RULES_V1_PATH,
    validation_runtime_ref: VERTICAL_AI_VALIDATION_RUNTIME_REF_V1_PATH,
    contracts_ref: VERTICAL_AI_VALIDATION_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_VALIDATION_REGISTRY_V1_PATH,
    checks: {
      PRECONDITIONS_SATISFIED: preconditionsSatisfied,
      EXECUTION_RUNTIME_VERIFIED: executionRuntimeVerified,
      CIL_COMPLETE: cilCompleteVerified,
      PLATFORM_CORE_READY: platformCoreReady,
      REPOSITORY_INTELLIGENCE_READY: repositoryIntelligenceReady,
      CERTIFIED_CONNECTORS_BOUND: certifiedConnectorsBound,
      COMPONENTS_DEFINED: componentsDefined,
      CERTIFIED_VALIDATION_BOUNDARIES_DEFINED: certifiedValidationBoundariesDefined,
      EVIDENCE_TO_VALIDATION_TRACEABILITY: evidenceToValidationTraceability,
      VALIDATION_REPRODUCIBILITY: validationReproducibility,
      REPOSITORY_FIRST: repositoryFirst,
      EVIDENCE_FIRST: evidenceFirst,
      REUSE_BEFORE_CREATE: reuseBeforeCreate,
      HUMAN_APPROVAL_BEFORE_REPO_MUTATION: humanApprovalBeforeRepoMutation,
      DESIGN_ONLY: designOnly,
      READ_ONLY: readOnly,
      REFERENCE_ONLY: referenceOnly,
      NO_SOURCE_DATA_OWNERSHIP: noSourceDataOwnership,
      PLATFORM_CORE_UNCHANGED: noPlatformCoreMutation,
      CIL_UNCHANGED: noCilMutation,
      READY_FOR_VALIDATION_RUNTIME: readyForValidationRuntime,
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

  writeJson(root, VERTICAL_AI_VALIDATION_FOUNDATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_VALIDATION_FOUNDATION_V1_REPORT_PATH,
  };
}
