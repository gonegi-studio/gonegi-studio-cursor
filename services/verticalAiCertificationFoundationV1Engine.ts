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
  VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH,
  VERTICAL_AI_VALIDATION_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_VALIDATION_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_VALIDATION_WORKFLOW_V1_PATH,
  VERTICAL_AI_VALIDATION_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_VALIDATION_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_VALIDATION_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_VALIDATION_TRACEABILITY_V1_PATH,
  VERTICAL_AI_VALIDATION_RULES_V1_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_REF_V1_PATH,
  VERTICAL_AI_VALIDATION_CONTRACTS_V1_PATH,
  VERTICAL_AI_VALIDATION_REGISTRY_V1_PATH,
} from './verticalAiValidationFoundationV1Engine.js';
import {
  VERTICAL_AI_VALIDATION_RUNTIME_V1_PASS_VERDICT,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_REPORT_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_EXPORT_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_VERSION_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_REGISTRY_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_REPRODUCIBILITY_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_CONTRACTS_PATH,
} from './verticalAiValidationRuntimeV1Engine.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE = 'PHASE-VAI-009' as const;
export const VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_SYSTEM_ID =
  'VERTICAL_AI_CERTIFICATION_FOUNDATION_V1' as const;
export const VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_CERTIFICATION_FOUNDATION_V1' as const;
export const VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_CERTIFICATION_FOUNDATION_V1' as const;
export const VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_STATUS =
  'VERTICAL_AI_CERTIFICATION_DEFINED' as const;

export const VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR =
  'datasets/vertical_ai_certification_foundation_v1' as const;
export const VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/vertical-ai-certification-foundation-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_ARCHITECTURE_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-architecture-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_COMPONENT_MODEL_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-component-model-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_WORKFLOW_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-workflow-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_BOUNDARY_MODEL_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-boundary-model-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_CONTRACTS_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-contracts-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_REGISTRY_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-registry-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_APPROVAL_GATE_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-approval-gate-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_EVIDENCE_MODEL_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-evidence-model-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_TRACEABILITY_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-traceability-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_RULES_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-rules-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-record-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_RUNTIME_REF_V1_PATH =
  `${VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_DIR}/certification-runtime-ref-v1.json` as const;
export const VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_REPORT.json' as const;

const FOUNDATION_NAME = 'Evidence-Bound Vertical AI Certification Foundation V1' as const;
const CAPABILITY_ID = 'vertical_ai_certification' as const;
const LAYER_ID = 'certification' as const;

export const VAICF_CONTRACT_IDS = [
  'VAICF_VALIDATION_RUNTIME_VERIFIED',
  'VAICF_CIL_COMPLETE_VERIFIED',
  'VAICF_PLATFORM_CORE_READY',
  'VAICF_REPOSITORY_INTELLIGENCE_READY',
  'VAICF_CERTIFIED_CONNECTORS_BOUND',
  'VAICF_COMPONENTS_DEFINED',
  'VAICF_CERTIFIED_CERTIFICATION_BOUNDARIES_DEFINED',
  'VAICF_EVIDENCE_TO_CERTIFICATION_TRACEABILITY',
  'VAICF_CERTIFICATION_REPRODUCIBILITY',
  'VAICF_REPOSITORY_FIRST',
  'VAICF_EVIDENCE_FIRST',
  'VAICF_REUSE_BEFORE_CREATE',
  'VAICF_HUMAN_APPROVAL_BEFORE_REPO_MUTATION',
  'VAICF_CONSUMES_PLATFORM_CORE_V1_ONLY',
  'VAICF_CONSUMES_CIL_V1_ONLY',
  'VAICF_CONSUMES_REPOSITORY_INTELLIGENCE_ONLY',
  'VAICF_CONSUMES_CERTIFIED_CONNECTORS_ONLY',
  'VAICF_DESIGN_ONLY',
  'VAICF_READ_ONLY',
  'VAICF_REFERENCE_ONLY',
  'VAICF_NO_SOURCE_DATA_OWNERSHIP',
  'VAICF_NO_PLATFORM_CORE_MUTATION',
  'VAICF_NO_CIL_MUTATION',
  'VAICF_READY_FOR_CERTIFICATION_RUNTIME',
  'VAICF_FOUNDATION_READY',
] as const;

const REQUIRED_COMPONENT_IDS = [
  'certification_context',
  'certification_selector',
  'certification_rules',
  'certification_contract',
  'certification_boundary',
  'certification_evidence',
  'certification_traceability',
  'certification_reproducibility',
  'certification_record',
  'certification_runtime_ref',
  'approval_gate',
  'certification_integrity',
] as const;

const CERTIFIED_CONNECTORS = [
  { connector_id: 'claude_connector', master_snapshot_ref: CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'chatgpt_connector', master_snapshot_ref: CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'gemini_connector', master_snapshot_ref: GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'cursor_connector', master_snapshot_ref: CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  { connector_id: 'mcp_connector', master_snapshot_ref: MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
] as const;

/**
 * Vertical AI Certification is design-only capacity that turns validation runtime outputs into
 * evidence-traced certification descriptors and records. It certifies contracts, boundaries, and
 * integrity without mutating Platform Core or CIL. Repository mutation requires human approval.
 */
const CERTIFICATION_COMPONENTS = [
  {
    component_id: 'certification_context',
    name: 'Certification Context',
    responsibility:
      'Assemble a read-only certification context from validation runtime outputs, Platform Core, CIL, Repository Intelligence, and certified connector snapshots.',
    interface_kind: 'context',
    owns_source_data: false,
    mode: 'reference_only',
    write_authorized: false,
  },
  {
    component_id: 'certification_selector',
    name: 'Certification Selector',
    responsibility:
      'Select which validation results, contracts, and boundaries to certify using repository-first, evidence-first priority; never invents unauthorized writes.',
    interface_kind: 'selection',
    owns_source_data: false,
    mode: 'evidence_bound',
    write_authorized: false,
  },
  {
    component_id: 'certification_rules',
    name: 'Certification Rules',
    responsibility:
      'Declare reusable, deterministic certification rules for contracts, boundaries, integrity, and record issuance without owning source data.',
    interface_kind: 'rules',
    owns_source_data: false,
    mode: 'rule_catalog',
    write_authorized: false,
  },
  {
    component_id: 'certification_contract',
    name: 'Certification Contract',
    responsibility:
      'Declare the certification boundary contract: consumes PC/CIL/RI/certified connectors/validation runtime only; forbids PC/CIL mutation and unapproved repository mutation.',
    interface_kind: 'contract',
    owns_source_data: false,
    mode: 'boundary_contract',
    write_authorized: false,
  },
  {
    component_id: 'certification_boundary',
    name: 'Certification Boundary',
    responsibility:
      'Define certified certification boundaries: no PC/CIL mutation, certified connectors only, validation integrity required, write authorization blocked.',
    interface_kind: 'boundary',
    owns_source_data: false,
    mode: 'boundary_definition',
    write_authorized: false,
  },
  {
    component_id: 'certification_evidence',
    name: 'Certification Evidence',
    responsibility:
      'Bind fingerprints and refs so every certification conclusion is preceded by validation and execution evidence.',
    interface_kind: 'evidence',
    owns_source_data: false,
    mode: 'evidence_only',
    write_authorized: false,
  },
  {
    component_id: 'certification_traceability',
    name: 'Certification Traceability',
    responsibility:
      'Maintain evidence-to-certification traceability from validation outputs through rules, contract/boundary checks, record design, and approval readiness.',
    interface_kind: 'traceability',
    owns_source_data: false,
    mode: 'evidence_to_certification',
    write_authorized: false,
  },
  {
    component_id: 'certification_reproducibility',
    name: 'Certification Reproducibility',
    responsibility:
      'Ensure identical evidence and validation inputs yield identical certification design fingerprints across dual runs.',
    interface_kind: 'reproducibility',
    owns_source_data: false,
    mode: 'deterministic',
    write_authorized: false,
  },
  {
    component_id: 'certification_record',
    name: 'Certification Record',
    responsibility:
      'Design the certification record shape binding validation fingerprints, boundary integrity, and contract conformance for future certification runtime issuance.',
    interface_kind: 'record',
    owns_source_data: false,
    mode: 'record_design',
    write_authorized: false,
  },
  {
    component_id: 'certification_runtime_ref',
    name: 'Certification Runtime Reference',
    responsibility:
      'Reference the certified surfaces future Certification Runtime will bind (validation runtime, Agent Runtime, CIL); reference-only, no mutation.',
    interface_kind: 'reference',
    owns_source_data: false,
    mode: 'runtime_ref',
    write_authorized: false,
  },
  {
    component_id: 'approval_gate',
    name: 'Approval Gate',
    responsibility:
      'Require explicit human approval before any repository mutation that certification might later recommend; foundation runs remain read-only.',
    interface_kind: 'gate',
    owns_source_data: false,
    mode: 'human_approval_required',
    write_authorized: false,
  },
  {
    component_id: 'certification_integrity',
    name: 'Certification Integrity',
    responsibility:
      'Codify and design integrity checks for certified certification boundaries across Platform Core, CIL, connectors, validation integrity, and repository mutation gates.',
    interface_kind: 'integrity',
    owns_source_data: false,
    mode: 'integrity_enforcement_design',
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
  evidence_to_certification_traceability: true,
  certification_reproducibility: true,
  certified_certification_boundaries_defined: true,
  human_approval_required_before_repository_mutation: true,
  consumes_platform_core_v1_only: true,
  consumes_cil_v1_only: true,
  consumes_repository_intelligence_only: true,
  consumes_certified_connectors_only: true,
  consumes_validation_runtime: true,
  owns_source_data: false,
  platform_core_mutation: false,
  cil_mutation: false,
  certification_runtime_deferred: true,
  independently_evolvable: true,
} as const;

const EXECUTION_FLAGS = {
  ...FOUNDATION_PRINCIPLES,
  execute_authorized: false as const,
  write_authorized: false as const,
};

const EVIDENCE_TO_CERTIFICATION_WORKFLOW = {
  workflow_id: 'evidence_to_certification_v1',
  policy: 'evidence_first_certification',
  reuse_policy: 'reuse_before_create',
  repository_policy: 'repository_first',
  connector_policy: 'certified_connectors_only',
  evidence_policy: 'evidence_precedes_certification_conclusions',
  write_policy: 'human_approval_required_before_repository_mutation',
  traceability_policy: 'evidence_to_certification',
  steps: [
    { step_id: 'build_context', component_id: 'certification_context', write: false },
    { step_id: 'bind_runtime_ref', component_id: 'certification_runtime_ref', write: false },
    { step_id: 'select', component_id: 'certification_selector', write: false },
    { step_id: 'load_rules', component_id: 'certification_rules', write: false },
    { step_id: 'declare_contract', component_id: 'certification_contract', write: false },
    { step_id: 'define_boundary', component_id: 'certification_boundary', write: false },
    { step_id: 'design_record', component_id: 'certification_record', write: false },
    { step_id: 'bind_evidence', component_id: 'certification_evidence', write: false },
    { step_id: 'trace', component_id: 'certification_traceability', write: false },
    { step_id: 'reproducibility', component_id: 'certification_reproducibility', write: false },
    { step_id: 'integrity', component_id: 'certification_integrity', write: false },
    {
      step_id: 'approval',
      component_id: 'approval_gate',
      write: false,
      blocks_repository_mutation_until_human_approval: true,
    },
    {
      step_id: 'certification_runtime_handoff',
      deferred: true,
      requires: ['certification_foundation_ready', 'human_approval_if_repository_mutation'],
    },
  ],
  forbidden_before_evidence: [
    'pass_without_validation_integrity',
    'pass_without_boundary_definition',
    'select_uncertified_connector',
    'mutate_platform_core',
    'mutate_cil',
    'repository_mutation_without_human_approval',
  ],
} as const;

const CERTIFICATION_RULE_CATALOG = [
  { rule_id: 'CR_VALIDATION_INTEGRITY', target: 'certification_integrity', requires_evidence: true },
  { rule_id: 'CR_CONTRACT_CONFORMANCE', target: 'certification_contract', requires_evidence: true },
  { rule_id: 'CR_BOUNDARY_INTEGRITY', target: 'certification_boundary', requires_evidence: true },
  { rule_id: 'CR_RECORD_COMPLETENESS', target: 'certification_record', requires_evidence: true },
  { rule_id: 'CR_REUSE_BEFORE_CREATE', target: 'certification_rules', requires_evidence: true },
  { rule_id: 'CR_CERTIFIED_CONNECTORS_ONLY', target: 'certification_boundary', requires_evidence: true },
  { rule_id: 'CR_WRITE_BLOCKED_WITHOUT_APPROVAL', target: 'approval_gate', requires_evidence: true },
] as const;

const PROPOSED_VAI_PHASE_CHAIN = [
  { phase_id: 'PHASE-VAI-007', title: 'Validation foundation', focus: 'Evidence-to-validation design' },
  { phase_id: 'PHASE-VAI-008', title: 'Validation runtime', focus: 'Operational validation runtime' },
  {
    phase_id: 'PHASE-VAI-009',
    title: 'Certification foundation',
    focus: 'Design evidence-to-certification with certified boundaries',
  },
  {
    phase_id: 'PHASE-VAI-010',
    title: 'Certification runtime',
    focus: 'Implement certification runtime over certified foundation',
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

const PROTECTED_VALIDATION_PATHS = [
  VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH,
  VERTICAL_AI_VALIDATION_ARCHITECTURE_V1_PATH,
  VERTICAL_AI_VALIDATION_COMPONENT_MODEL_V1_PATH,
  VERTICAL_AI_VALIDATION_WORKFLOW_V1_PATH,
  VERTICAL_AI_VALIDATION_BOUNDARY_MODEL_V1_PATH,
  VERTICAL_AI_VALIDATION_APPROVAL_GATE_V1_PATH,
  VERTICAL_AI_VALIDATION_EVIDENCE_MODEL_V1_PATH,
  VERTICAL_AI_VALIDATION_TRACEABILITY_V1_PATH,
  VERTICAL_AI_VALIDATION_RULES_V1_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_REF_V1_PATH,
  VERTICAL_AI_VALIDATION_CONTRACTS_V1_PATH,
  VERTICAL_AI_VALIDATION_REGISTRY_V1_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_EXPORT_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_VERSION_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_REGISTRY_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_FUNCTIONAL_EVIDENCE_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_REPRODUCIBILITY_PATH,
  VERTICAL_AI_VALIDATION_RUNTIME_V1_CONTRACTS_PATH,
] as const;

const PRECONDITION_EVIDENCE = [
  {
    precondition_id: 'validation_runtime',
    report_path: VERTICAL_AI_VALIDATION_RUNTIME_V1_REPORT_PATH,
    pass_verdict: VERTICAL_AI_VALIDATION_RUNTIME_V1_PASS_VERDICT,
    artifact_path: VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
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
    ['VAICF_VALIDATION_RUNTIME_VERIFIED', 'validationRuntimeVerified'],
    ['VAICF_CIL_COMPLETE_VERIFIED', 'cilCompleteVerified'],
    ['VAICF_PLATFORM_CORE_READY', 'platformCoreReady'],
    ['VAICF_REPOSITORY_INTELLIGENCE_READY', 'repositoryIntelligenceReady'],
    ['VAICF_CERTIFIED_CONNECTORS_BOUND', 'certifiedConnectorsBound'],
    ['VAICF_COMPONENTS_DEFINED', 'componentsDefined'],
    ['VAICF_CERTIFIED_CERTIFICATION_BOUNDARIES_DEFINED', 'certifiedCertificationBoundariesDefined'],
    ['VAICF_EVIDENCE_TO_CERTIFICATION_TRACEABILITY', 'evidenceToCertificationTraceability'],
    ['VAICF_CERTIFICATION_REPRODUCIBILITY', 'certificationReproducibility'],
    ['VAICF_REPOSITORY_FIRST', 'repositoryFirst'],
    ['VAICF_EVIDENCE_FIRST', 'evidenceFirst'],
    ['VAICF_REUSE_BEFORE_CREATE', 'reuseBeforeCreate'],
    ['VAICF_HUMAN_APPROVAL_BEFORE_REPO_MUTATION', 'humanApprovalBeforeRepoMutation'],
    ['VAICF_CONSUMES_PLATFORM_CORE_V1_ONLY', 'consumesPlatformCoreV1Only'],
    ['VAICF_CONSUMES_CIL_V1_ONLY', 'consumesCilV1Only'],
    ['VAICF_CONSUMES_REPOSITORY_INTELLIGENCE_ONLY', 'consumesRepositoryIntelligenceOnly'],
    ['VAICF_CONSUMES_CERTIFIED_CONNECTORS_ONLY', 'consumesCertifiedConnectorsOnly'],
    ['VAICF_DESIGN_ONLY', 'designOnly'],
    ['VAICF_READ_ONLY', 'readOnly'],
    ['VAICF_REFERENCE_ONLY', 'referenceOnly'],
    ['VAICF_NO_SOURCE_DATA_OWNERSHIP', 'noSourceDataOwnership'],
    ['VAICF_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAICF_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAICF_READY_FOR_CERTIFICATION_RUNTIME', 'readyForCertificationRuntime'],
    ['VAICF_FOUNDATION_READY', 'foundationReady'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return {
    contract_ids: [...VAICF_CONTRACT_IDS],
    results,
    aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const),
  };
}

export function writeVerticalAiCertificationFoundationV1EngineReport(): {
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
  const validationBaselineBefore = captureBaselineMtimes(root, PROTECTED_VALIDATION_PATHS);

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

  const validationRuntimeVerified =
    preconditionResults.find((entry) => entry.precondition_id === 'validation_runtime')?.satisfied ===
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
  const validationRuntime = readJson<{
    decision_fingerprint?: string;
    runtime_implemented?: boolean;
    ready_for_certification?: boolean;
    result_fingerprint?: string;
    dispatch_fingerprint?: string;
    certified_validation_integrity_preserved?: boolean;
    certified_validation_operational?: boolean;
  }>(root, VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH);

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
  if (validationRuntime?.runtime_implemented !== true) {
    issues.push({
      code: 'VALIDATION_RUNTIME_NOT_IMPLEMENTED',
      message: 'Validation Runtime must be implemented',
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
    validation: {
      foundation_ref: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH,
      runtime_ref: VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
      result_fingerprint: validationRuntime?.result_fingerprint ?? null,
      dispatch_fingerprint: validationRuntime?.dispatch_fingerprint ?? null,
      certified_validation_integrity_preserved:
        validationRuntime?.certified_validation_integrity_preserved === true,
      certified_validation_operational: validationRuntime?.certified_validation_operational === true,
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
    components: CERTIFICATION_COMPONENTS,
    principles: FOUNDATION_PRINCIPLES,
    workflow: EVIDENCE_TO_CERTIFICATION_WORKFLOW,
    rules: CERTIFICATION_RULE_CATALOG,
    phase_chain: PROPOSED_VAI_PHASE_CHAIN,
  });

  const decisionFingerprint = stableFingerprint({
    goalTruthFingerprint: goalTruth.fingerprint,
    validationDecision: validationRuntime?.decision_fingerprint ?? null,
    brainDecision: brainComplete?.decision_fingerprint ?? null,
    bundleDecision: bundleComplete?.decision_fingerprint ?? null,
    accessDecision: accessComplete?.decision_fingerprint ?? null,
    designFingerprint,
    preconditionCount: preconditionResults.filter((entry) => entry.satisfied).length,
    mode: 'design_only',
  });

  const certificationReproducibilityFingerprint = stableFingerprint({
    designFingerprint,
    validationResult: validationRuntime?.result_fingerprint ?? null,
    validationDispatch: validationRuntime?.dispatch_fingerprint ?? null,
    rules: CERTIFICATION_RULE_CATALOG.map((rule) => rule.rule_id),
    evidenceFirst: true,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_COMPONENT_MODEL_V1_PATH, {
    certification_component_model_v1_id: 'certification_component_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    responsibility:
      'Design evidence-to-certification Vertical AI capacity that certifies validation integrity and boundaries without mutating Platform Core or CIL',
    components: CERTIFICATION_COMPONENTS,
    principles: FOUNDATION_PRINCIPLES,
    design_only: true,
    implementation: false,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_RULES_V1_PATH, {
    certification_rules_v1_id: 'certification_rules_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    rule_catalog: CERTIFICATION_RULE_CATALOG,
    deterministic: true,
    reusable: true,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_RUNTIME_REF_V1_PATH, {
    certification_runtime_ref_v1_id: 'certification_runtime_ref_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    validation_runtime_ref: VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
    validation_foundation_ref: VERTICAL_AI_VALIDATION_FOUNDATION_V1_PATH,
    agent_runtime_ref: AGENT_RUNTIME_V1_PATH,
    agent_runtime_master_snapshot_ref: AGENT_RUNTIME_MASTER_SNAPSHOT_V1_PATH,
    cil_runtime_connector_ref: RUNTIME_CONNECTOR_V1_PATH,
    reference_only: true,
    mutation_forbidden: true,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH, {
    certification_record_v1_id: 'certification_record_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    record_design: {
      record_kind: 'vertical_ai_certification_record',
      required_fields: [
        'validation_result_fingerprint',
        'validation_dispatch_fingerprint',
        'certified_validation_integrity_preserved',
        'certified_validation_operational',
        'certification_contract_id',
        'boundary_integrity',
        'evidence_fingerprint',
        'trace_fingerprint',
        'reproducibility_fingerprint',
      ],
      issued_by_runtime: false,
      design_only: true,
    },
    binds_validation_runtime: VERTICAL_AI_VALIDATION_RUNTIME_V1_PATH,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_WORKFLOW_V1_PATH, {
    certification_workflow_v1_id: 'certification_workflow_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_first: true,
    repository_first: true,
    reuse_before_create: true,
    evidence_to_certification_traceability: true,
    certification_reproducibility: true,
    certified_certification_boundaries_defined: true,
    human_approval_required_before_repository_mutation: true,
    certification_runtime_deferred: true,
    workflow: EVIDENCE_TO_CERTIFICATION_WORKFLOW,
    readiness_for_certification_runtime: {
      requires: [
        'certification_components_defined',
        'certified_certification_boundaries_defined',
        'evidence_to_certification_traceability',
        'approval_gate_armed',
      ],
      creates_implementation: false,
      mutates_platform_core: false,
      mutates_cil: false,
    },
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_APPROVAL_GATE_V1_PATH, {
    certification_approval_gate_v1_id: 'certification_approval_gate_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    gate_policy: {
      human_approval_required_before_repository_mutation: true,
      certification_foundation_runs_are_read_only: true,
      repository_mutation_blocked_until_approval: true,
      platform_core_mutation_forbidden: true,
      cil_mutation_forbidden: true,
      certification_runtime_handoff_requires_foundation: true,
    },
    write_actions_gated: [
      'repository_create',
      'repository_modify',
      'repository_delete',
      'certification_runtime_materialization',
      'certification_record_issuance',
    ],
    design_only: true,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_EVIDENCE_MODEL_V1_PATH, {
    certification_evidence_model_v1_id: 'certification_evidence_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_policy: {
      evidence_first: true,
      evidence_precedes_certification_conclusions: true,
      conclusions_without_evidence_forbidden: true,
      fingerprints_required: true,
      validation_runtime_citations_required: true,
      certified_connector_citations_required: true,
    },
    precondition_evidence: preconditionResults,
    consumed_refs: consumedRefs,
    objective_evidence: preconditionResults.map(
      (entry) =>
        `${entry.precondition_id}=${entry.satisfied}:${entry.pass_verdict}:artifact=${entry.artifact_present}`
    ),
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_TRACEABILITY_V1_PATH, {
    certification_traceability_v1_id: 'certification_traceability_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_to_certification_traceability: true,
    chain: [
      { from: 'validation_runtime', to: 'certification_context' },
      { from: 'certification_context', to: 'certification_selector' },
      { from: 'certification_runtime_ref', to: 'certification_rules' },
      { from: 'certification_selector', to: 'certification_contract' },
      { from: 'certification_rules', to: 'certification_contract' },
      { from: 'certification_rules', to: 'certification_boundary' },
      { from: 'certification_contract', to: 'certification_record' },
      { from: 'certification_boundary', to: 'certification_record' },
      { from: 'certification_evidence', to: 'certification_traceability' },
      { from: 'certification_traceability', to: 'certification_reproducibility' },
      { from: 'certification_integrity', to: 'approval_gate' },
      { from: 'certification_record', to: 'certification_integrity' },
    ],
    reproducibility_fingerprint: certificationReproducibilityFingerprint,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_BOUNDARY_MODEL_V1_PATH, {
    certification_boundary_model_v1_id: 'certification_boundary_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    boundary_policy: {
      consumes_platform_core_v1_only: true,
      consumes_cil_v1_only: true,
      consumes_repository_intelligence_only: true,
      consumes_certified_connectors_only: true,
      consumes_validation_runtime: true,
      owns_source_data: false,
      platform_core_mutation: false,
      cil_mutation: false,
      repository_mutation_requires_human_approval: true,
      certification_runtime_deferred: true,
      certified_certification_boundaries_defined: true,
    },
    consumed_refs: consumedRefs,
    forbidden_operations: [
      'platform_core_mutation',
      'cil_mutation',
      'uncertified_connector_selection',
      'repository_mutation_without_human_approval',
      'certification_without_evidence',
      'pass_without_validation_integrity',
    ],
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_ARCHITECTURE_V1_PATH, {
    certification_architecture_v1_id: 'certification_architecture_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    selected_architecture:
      'Evidence-to-Certification Vertical AI Foundation with Certified Boundaries',
    independence_statement:
      'Vertical AI Certification turns validation runtime outputs into evidence-traced certification descriptors and records. It consumes Platform Core V1, CIL V1, Repository Intelligence, certified Consumer Connectors, and Validation Runtime only — read-only and reference-only — and never mutates Platform Core or CIL. Certified certification boundaries are defined for contracts, integrity, and records. Human approval is required before repository mutation. Evolution of this capability is independent of Platform Core and CIL.',
    stack: {
      platform_core: { role: 'Semantic + structural + execution truth', interaction: 'consume_v1_only' },
      cil: { role: 'Certified integration contracts', interaction: 'consume_v1_only' },
      repository_intelligence: { role: 'Structural repository truth', interaction: 'reference_only' },
      certified_connectors: { role: 'Reasoning-side certified consumers', interaction: 'reference_only' },
      validation_runtime: {
        role: 'Validation results and certified validation integrity',
        interaction: 'consume_operational_validation',
      },
      certification: {
        role: 'Evidence-to-certification design before certification runtime',
        interaction: 'design_only_foundation',
        owns_source_data: false,
      },
    },
    component_model_ref: VERTICAL_AI_CERTIFICATION_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_CERTIFICATION_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_CERTIFICATION_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_CERTIFICATION_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_CERTIFICATION_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_CERTIFICATION_TRACEABILITY_V1_PATH,
    rules_ref: VERTICAL_AI_CERTIFICATION_RULES_V1_PATH,
    record_ref: VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH,
    certification_runtime_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_REF_V1_PATH,
    proposed_phase_chain: PROPOSED_VAI_PHASE_CHAIN,
    design_principles: Object.entries(FOUNDATION_PRINCIPLES)
      .filter(([, value]) => value === true)
      .map(([key]) => key),
  });

  const componentsDefined =
    CERTIFICATION_COMPONENTS.length === REQUIRED_COMPONENT_IDS.length &&
    REQUIRED_COMPONENT_IDS.every((id) =>
      CERTIFICATION_COMPONENTS.some((component) => component.component_id === id)
    );

  const certifiedCertificationBoundariesDefined =
    FOUNDATION_PRINCIPLES.certified_certification_boundaries_defined === true &&
    CERTIFICATION_COMPONENTS.some((component) => component.component_id === 'certification_integrity') &&
    CERTIFICATION_COMPONENTS.some((component) => component.component_id === 'certification_boundary');

  const evidenceToCertificationTraceability =
    FOUNDATION_PRINCIPLES.evidence_to_certification_traceability === true &&
    CERTIFICATION_COMPONENTS.some((component) => component.component_id === 'certification_traceability');

  const certificationReproducibility =
    FOUNDATION_PRINCIPLES.certification_reproducibility === true &&
    CERTIFICATION_COMPONENTS.some(
      (component) => component.component_id === 'certification_reproducibility'
    ) &&
    certificationReproducibilityFingerprint.length === 16;

  const repositoryFirst =
    FOUNDATION_PRINCIPLES.repository_first === true &&
    EVIDENCE_TO_CERTIFICATION_WORKFLOW.repository_policy === 'repository_first';
  const evidenceFirst =
    FOUNDATION_PRINCIPLES.evidence_first === true &&
    EVIDENCE_TO_CERTIFICATION_WORKFLOW.policy === 'evidence_first_certification';
  const reuseBeforeCreate =
    FOUNDATION_PRINCIPLES.reuse_precedes_creation === true &&
    EVIDENCE_TO_CERTIFICATION_WORKFLOW.reuse_policy === 'reuse_before_create';

  const humanApprovalBeforeRepoMutation =
    FOUNDATION_PRINCIPLES.human_approval_required_before_repository_mutation === true &&
    CERTIFICATION_COMPONENTS.some((component) => component.component_id === 'approval_gate') &&
    CERTIFICATION_COMPONENTS.every((component) => component.write_authorized === false);

  const designOnly =
    FOUNDATION_PRINCIPLES.design_only === true &&
    FOUNDATION_PRINCIPLES.implementation_deferred === true &&
    FOUNDATION_PRINCIPLES.implementation === false;
  const readOnly = FOUNDATION_PRINCIPLES.read_only === true && consumedRefs.reference_mode === 'read_only';
  const referenceOnly =
    FOUNDATION_PRINCIPLES.reference_only === true && consumedRefs.duplication_policy === 'references_only';
  const noSourceDataOwnership =
    FOUNDATION_PRINCIPLES.owns_source_data === false &&
    CERTIFICATION_COMPONENTS.every((component) => component.owns_source_data === false);

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
  const validationBaselineAfter = verifyBaselinePreserved(
    root,
    validationBaselineBefore,
    PROTECTED_VALIDATION_PATHS
  );

  const baselineChecks: Array<[string, { preserved: boolean; drift: string[] }, string]> = [
    ['BRAIN_BASELINE_MUTATION', brainBaselineAfter, 'Project Brain baseline changed'],
    ['BUNDLE_BASELINE_MUTATION', bundleBaselineAfter, 'RIB baseline changed'],
    ['ACCESS_BASELINE_MUTATION', accessBaselineAfter, 'Access Layer baseline changed'],
    ['RUNTIME_BASELINE_MUTATION', runtimeBaselineAfter, 'Agent Runtime baseline changed'],
    ['CIL_BASELINE_MUTATION', cilBaselineAfter, 'CIL baseline changed'],
    ['CONNECTOR_BASELINE_MUTATION', connectorBaselineAfter, 'Certified connector baseline changed'],
    ['VALIDATION_BASELINE_MUTATION', validationBaselineAfter, 'Validation baseline changed'],
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
    validationRuntimeVerified &&
    cilCompleteVerified &&
    platformCoreReady &&
    repositoryIntelligenceReady &&
    certifiedConnectorsBound &&
    certifiedCertificationBoundariesDefined &&
    evidenceToCertificationTraceability &&
    certificationReproducibility &&
    repositoryFirst &&
    evidenceFirst &&
    reuseBeforeCreate &&
    humanApprovalBeforeRepoMutation &&
    noPlatformCoreMutation &&
    noCilMutation &&
    connectorBaselineAfter.preserved &&
    validationBaselineAfter.preserved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const readyForCertificationRuntime =
    foundationReadyCandidate &&
    FOUNDATION_PRINCIPLES.certification_runtime_deferred === true &&
    designOnly &&
    validationRuntime?.ready_for_certification === true;

  const foundationReady = foundationReadyCandidate && readyForCertificationRuntime;

  const contractValidation = validateFoundationContracts({
    validationRuntimeVerified,
    cilCompleteVerified,
    platformCoreReady,
    repositoryIntelligenceReady,
    certifiedConnectorsBound,
    componentsDefined,
    certifiedCertificationBoundariesDefined,
    evidenceToCertificationTraceability,
    certificationReproducibility,
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
    readyForCertificationRuntime,
    foundationReady,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'FOUNDATION_CONTRACT_FAILURE',
      message: 'One or more Vertical AI Certification foundation contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_CERTIFICATION_CONTRACTS_V1_PATH, {
    certification_contracts_v1_id: 'certification_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    foundation_ref: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
    contract_ids: [...VAICF_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: FOUNDATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH, {
    vertical_ai_certification_foundation_v1_id: 'vertical_ai_certification_foundation_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    certification_reproducibility_fingerprint: certificationReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    preconditions_satisfied: preconditionsSatisfied,
    design_only: true,
    execution: false,
    implementation: false,
    foundation_ready: foundationReady,
    ready_for_certification_runtime: readyForCertificationRuntime,
    certification_foundation_established: foundationReady,
    certified_certification_boundaries_defined: certifiedCertificationBoundariesDefined,
    evidence_to_certification_traceability: evidenceToCertificationTraceability,
    certification_reproducible: certificationReproducibility,
    repository_first: repositoryFirst,
    evidence_first: evidenceFirst,
    reuse_before_create: reuseBeforeCreate,
    human_approval_required_before_repository_mutation: humanApprovalBeforeRepoMutation,
    architecture_ref: VERTICAL_AI_CERTIFICATION_ARCHITECTURE_V1_PATH,
    component_model_ref: VERTICAL_AI_CERTIFICATION_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_CERTIFICATION_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_CERTIFICATION_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_CERTIFICATION_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_CERTIFICATION_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_CERTIFICATION_TRACEABILITY_V1_PATH,
    rules_ref: VERTICAL_AI_CERTIFICATION_RULES_V1_PATH,
    record_ref: VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH,
    certification_runtime_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_REF_V1_PATH,
    contracts_ref: VERTICAL_AI_CERTIFICATION_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_CERTIFICATION_REGISTRY_V1_PATH,
    components: CERTIFICATION_COMPONENTS.map((component) => component.component_id),
    principles: FOUNDATION_PRINCIPLES,
    platform_core_mutation: false,
    cil_mutation: false,
    execute_authorized: false,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_CERTIFICATION_REGISTRY_V1_PATH, {
    registry_id: 'certification-registry-v1',
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_SYSTEM_ID,
    version: 'vertical_ai_certification_foundation_v1',
    generated_at: generatedAt,
    foundation_ref: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
    architecture_ref: VERTICAL_AI_CERTIFICATION_ARCHITECTURE_V1_PATH,
    contracts_ref: VERTICAL_AI_CERTIFICATION_CONTRACTS_V1_PATH,
    component_model_ref: VERTICAL_AI_CERTIFICATION_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_CERTIFICATION_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_CERTIFICATION_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_CERTIFICATION_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_CERTIFICATION_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_CERTIFICATION_TRACEABILITY_V1_PATH,
    rules_ref: VERTICAL_AI_CERTIFICATION_RULES_V1_PATH,
    record_ref: VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH,
    certification_runtime_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_REF_V1_PATH,
    component_ids: CERTIFICATION_COMPONENTS.map((component) => component.component_id),
    connector_ids: CERTIFIED_CONNECTORS.map((connector) => connector.connector_id),
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    certification_reproducibility_fingerprint: certificationReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    foundation_ready: foundationReady,
    ready_for_certification_runtime: readyForCertificationRuntime,
    independent_capability: CAPABILITY_ID,
  });

  const passed =
    foundationReady &&
    noPlatformCoreMutation &&
    noCilMutation &&
    contractValidation.aggregate_verdict === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verdict = passed
    ? VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PASS_VERDICT
    : VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_certification_foundation_v1_${Date.now()}`,
    phase: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Design the Vertical AI Certification Foundation as evidence-to-certification capability with certified certification boundaries and human approval before repository mutation.',
    vertical_ai_certification_foundation_v1_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_STATUS
      : 'VERTICAL_AI_CERTIFICATION_FOUNDATION_NOT_READY',
    validation_passed: passed,
    design_only: true,
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    certification_reproducibility_fingerprint: certificationReproducibilityFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    precondition_evidence: preconditionResults,
    brain_baseline_preserved: brainBaselineAfter.preserved,
    bundle_baseline_preserved: bundleBaselineAfter.preserved,
    access_baseline_preserved: accessBaselineAfter.preserved,
    runtime_baseline_preserved: runtimeBaselineAfter.preserved,
    cil_baseline_preserved: cilBaselineAfter.preserved,
    connector_baseline_preserved: connectorBaselineAfter.preserved,
    validation_baseline_preserved: validationBaselineAfter.preserved,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    components: CERTIFICATION_COMPONENTS.map((component) => component.component_id),
    foundation_ready: foundationReady,
    ready_for_certification_runtime: readyForCertificationRuntime,
    certification_foundation_established: foundationReady,
    certified_certification_boundaries_defined: certifiedCertificationBoundariesDefined,
    evidence_to_certification_traceability_established: evidenceToCertificationTraceability,
    certification_reproducible: certificationReproducibility,
    contract_validation: contractValidation,
    foundation_ref: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_PATH,
    architecture_ref: VERTICAL_AI_CERTIFICATION_ARCHITECTURE_V1_PATH,
    component_model_ref: VERTICAL_AI_CERTIFICATION_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_CERTIFICATION_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_CERTIFICATION_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_CERTIFICATION_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_CERTIFICATION_EVIDENCE_MODEL_V1_PATH,
    traceability_ref: VERTICAL_AI_CERTIFICATION_TRACEABILITY_V1_PATH,
    rules_ref: VERTICAL_AI_CERTIFICATION_RULES_V1_PATH,
    record_ref: VERTICAL_AI_CERTIFICATION_RECORD_V1_PATH,
    certification_runtime_ref: VERTICAL_AI_CERTIFICATION_RUNTIME_REF_V1_PATH,
    contracts_ref: VERTICAL_AI_CERTIFICATION_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_CERTIFICATION_REGISTRY_V1_PATH,
    checks: {
      PRECONDITIONS_SATISFIED: preconditionsSatisfied,
      VALIDATION_RUNTIME_VERIFIED: validationRuntimeVerified,
      CIL_COMPLETE: cilCompleteVerified,
      PLATFORM_CORE_READY: platformCoreReady,
      REPOSITORY_INTELLIGENCE_READY: repositoryIntelligenceReady,
      CERTIFIED_CONNECTORS_BOUND: certifiedConnectorsBound,
      COMPONENTS_DEFINED: componentsDefined,
      CERTIFIED_CERTIFICATION_BOUNDARIES_DEFINED: certifiedCertificationBoundariesDefined,
      EVIDENCE_TO_CERTIFICATION_TRACEABILITY: evidenceToCertificationTraceability,
      CERTIFICATION_REPRODUCIBILITY: certificationReproducibility,
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
      READY_FOR_CERTIFICATION_RUNTIME: readyForCertificationRuntime,
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

  writeJson(root, VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_CERTIFICATION_FOUNDATION_V1_REPORT_PATH,
  };
}
