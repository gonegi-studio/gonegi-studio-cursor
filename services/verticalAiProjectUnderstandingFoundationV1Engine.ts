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
import {
  MCP_CONNECTOR_COMPLETE_V1_PASS_VERDICT,
  MCP_CONNECTOR_PRODUCTION_CERTIFICATION_V1_PATH,
  MCP_CONNECTOR_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
  MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
} from './mcpConnectorProductionCertificationV1Engine.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PHASE = 'PHASE-VAI-001' as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_SYSTEM_ID =
  'VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1' as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1' as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1' as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_STATUS =
  'VERTICAL_AI_PROJECT_UNDERSTANDING_DEFINED' as const;

export const VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_DIR =
  'datasets/vertical_ai_project_understanding_foundation_v1' as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_DIR}/vertical-ai-project-understanding-foundation-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_ARCHITECTURE_V1_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_DIR}/project-understanding-architecture-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_DIR}/project-understanding-component-model-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_WORKFLOW_V1_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_DIR}/project-understanding-workflow-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_BOUNDARY_MODEL_V1_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_DIR}/project-understanding-boundary-model-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_CONTRACTS_V1_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_DIR}/project-understanding-contracts-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_REGISTRY_V1_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_DIR}/project-understanding-registry-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_DIR}/project-understanding-approval-gate-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_EVIDENCE_MODEL_V1_PATH =
  `${VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_DIR}/project-understanding-evidence-model-v1.json` as const;
export const VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_REPORT.json' as const;

const FOUNDATION_NAME = 'Evidence-Bound Vertical AI Project Understanding Foundation V1' as const;
const CAPABILITY_ID = 'vertical_ai_project_understanding' as const;
const LAYER_ID = 'project_understanding' as const;

export const VAIPUF_CONTRACT_IDS = [
  'VAIPUF_MCP_CONNECTOR_COMPLETE_VERIFIED',
  'VAIPUF_CIL_COMPLETE_VERIFIED',
  'VAIPUF_PLATFORM_CORE_READY',
  'VAIPUF_REPOSITORY_INTELLIGENCE_READY',
  'VAIPUF_CERTIFIED_CONNECTORS_BOUND',
  'VAIPUF_COMPONENTS_DEFINED',
  'VAIPUF_REPOSITORY_FIRST_WORKFLOW',
  'VAIPUF_REUSE_BEFORE_CREATE',
  'VAIPUF_EVIDENCE_PRECEDES_CONCLUSIONS',
  'VAIPUF_HUMAN_APPROVAL_BEFORE_WRITE',
  'VAIPUF_CONSUMES_PLATFORM_CORE_V1_ONLY',
  'VAIPUF_CONSUMES_CIL_V1_ONLY',
  'VAIPUF_CONSUMES_REPOSITORY_INTELLIGENCE_ONLY',
  'VAIPUF_CONSUMES_CERTIFIED_CONNECTORS_ONLY',
  'VAIPUF_DESIGN_ONLY',
  'VAIPUF_READ_ONLY',
  'VAIPUF_REFERENCE_ONLY',
  'VAIPUF_NO_SOURCE_DATA_OWNERSHIP',
  'VAIPUF_NO_PLATFORM_CORE_MUTATION',
  'VAIPUF_NO_CIL_MUTATION',
  'VAIPUF_NO_REPOSITORY_MUTATION',
  'VAIPUF_READY_FOR_PLANNING',
  'VAIPUF_FOUNDATION_READY',
] as const;

const REQUIRED_COMPONENT_IDS = [
  'repository_discovery',
  'repository_inventory',
  'component_lookup',
  'reference_resolution',
  'dependency_resolution',
  'duplicate_detection',
  'reuse_candidate_analysis',
  'understanding_report',
  'gap_analysis',
  'approval_gate',
  'understanding_evidence',
] as const;

/**
 * Project Understanding is the first Vertical AI responsibility after certified consumer
 * connectors: understand the existing repository before proposing or creating any
 * implementation. It is design-only, read-only, and reference-only. It consumes Platform
 * Core V1, CIL V1, Repository Intelligence, and certified Consumer Connectors exclusively.
 * Human approval is required before any write action. Planning is deferred until understanding
 * is complete.
 */
const PROJECT_UNDERSTANDING_COMPONENTS = [
  {
    component_id: 'repository_discovery',
    name: 'Repository Discovery',
    responsibility:
      'Discover repository structure, certified baselines, and entry surfaces read-only via Repository Intelligence and Access references; never scans to mutate or invent capabilities.',
    interface_kind: 'discovery',
    owns_source_data: false,
    mode: 'reference_only',
    precedes_planning: true,
    write_authorized: false,
  },
  {
    component_id: 'repository_inventory',
    name: 'Repository Inventory',
    responsibility:
      'Inventory known modules, datasets, services, connectors, and frozen snapshots as an evidence-bound catalog; inventory is descriptive only and never creates repository assets.',
    interface_kind: 'inventory',
    owns_source_data: false,
    mode: 'reference_only',
    precedes_planning: true,
    write_authorized: false,
  },
  {
    component_id: 'component_lookup',
    name: 'Component Lookup',
    responsibility:
      'Locate existing components that may satisfy a need by querying inventory and Repository Intelligence references; lookup must complete before any create proposal.',
    interface_kind: 'lookup',
    owns_source_data: false,
    mode: 'reference_only',
    precedes_planning: true,
    write_authorized: false,
  },
  {
    component_id: 'reference_resolution',
    name: 'Reference Resolution',
    responsibility:
      'Resolve citations and artifact refs through Access / CIL reference contracts without copying payloads or mutating frozen Platform Core, CIL, or connector baselines.',
    interface_kind: 'resolver',
    owns_source_data: false,
    mode: 'reference_only',
    precedes_planning: true,
    write_authorized: false,
  },
  {
    component_id: 'dependency_resolution',
    name: 'Dependency Resolution',
    responsibility:
      'Resolve declared dependencies among inventoried components and frozen contracts so understanding describes coupling without proposing implementation.',
    interface_kind: 'resolver',
    owns_source_data: false,
    mode: 'reference_only',
    precedes_planning: true,
    write_authorized: false,
  },
  {
    component_id: 'duplicate_detection',
    name: 'Duplicate Detection',
    responsibility:
      'Detect likely duplicate modules, overlapping contracts, and redundant surfaces so reuse can be preferred over new creation; detection never deletes or rewrites existing code.',
    interface_kind: 'analysis',
    owns_source_data: false,
    mode: 'evidence_only',
    precedes_planning: true,
    write_authorized: false,
  },
  {
    component_id: 'reuse_candidate_analysis',
    name: 'Reuse Candidate Analysis',
    responsibility:
      'Rank reuse candidates against gaps using inventory, lookup, and duplicate evidence; enforces reuse-before-create policy before any planning phase.',
    interface_kind: 'analysis',
    owns_source_data: false,
    mode: 'evidence_only',
    precedes_planning: true,
    write_authorized: false,
  },
  {
    component_id: 'understanding_report',
    name: 'Understanding Report',
    responsibility:
      'Emit a structured repository-understanding report that aggregates discovery, inventory, refs, dependencies, duplicates, and reuse candidates; conclusions require evidence.',
    interface_kind: 'report',
    owns_source_data: false,
    mode: 'evidence_bound',
    precedes_planning: true,
    write_authorized: false,
  },
  {
    component_id: 'gap_analysis',
    name: 'Gap Analysis',
    responsibility:
      'Identify remaining gaps only after reuse candidates are exhausted in analysis; gaps feed planning readiness and never authorize silent creation.',
    interface_kind: 'analysis',
    owns_source_data: false,
    mode: 'evidence_only',
    precedes_planning: true,
    write_authorized: false,
  },
  {
    component_id: 'approval_gate',
    name: 'Approval Gate',
    responsibility:
      'Require explicit human approval before any write action (planning package materialization or later implementation). Design/read understanding runs without write authority.',
    interface_kind: 'gate',
    owns_source_data: false,
    mode: 'human_approval_required',
    precedes_planning: true,
    write_authorized: false,
  },
  {
    component_id: 'understanding_evidence',
    name: 'Understanding Evidence',
    responsibility:
      'Bind fingerprints, refs, and precondition citations so every understanding conclusion is evidence-preceded and reproducible without mutating source baselines.',
    interface_kind: 'evidence',
    owns_source_data: false,
    mode: 'evidence_only',
    precedes_planning: true,
    write_authorized: false,
  },
] as const;

const FOUNDATION_PRINCIPLES = {
  design_only: true,
  implementation: false,
  implementation_deferred: true,
  read_only: true,
  reference_only: true,
  repository_understanding_precedes_planning: true,
  reuse_precedes_creation: true,
  evidence_precedes_conclusions: true,
  human_approval_required_before_write: true,
  consumes_platform_core_v1_only: true,
  consumes_cil_v1_only: true,
  consumes_repository_intelligence_only: true,
  consumes_certified_connectors_only: true,
  owns_source_data: false,
  platform_core_mutation: false,
  cil_mutation: false,
  repository_mutation: false,
  planning_deferred_until_understanding: true,
  independently_evolvable: true,
} as const;

const EXECUTION_FLAGS = { ...FOUNDATION_PRINCIPLES, execute_authorized: false as const, write_authorized: false as const };

const REPOSITORY_FIRST_WORKFLOW = {
  workflow_id: 'repository_first_understanding_v1',
  policy: 'repository_understanding_precedes_planning',
  reuse_policy: 'reuse_before_create',
  evidence_policy: 'evidence_precedes_conclusions',
  write_policy: 'human_approval_required_before_any_write',
  steps: [
    { step_id: 'discover', component_id: 'repository_discovery', write: false },
    { step_id: 'inventory', component_id: 'repository_inventory', write: false },
    { step_id: 'lookup', component_id: 'component_lookup', write: false },
    { step_id: 'resolve_refs', component_id: 'reference_resolution', write: false },
    { step_id: 'resolve_deps', component_id: 'dependency_resolution', write: false },
    { step_id: 'detect_duplicates', component_id: 'duplicate_detection', write: false },
    { step_id: 'analyze_reuse', component_id: 'reuse_candidate_analysis', write: false },
    { step_id: 'report', component_id: 'understanding_report', write: false },
    { step_id: 'gaps', component_id: 'gap_analysis', write: false },
    { step_id: 'evidence', component_id: 'understanding_evidence', write: false },
    { step_id: 'approval', component_id: 'approval_gate', write: false, blocks_write_until_human_approval: true },
    { step_id: 'planning_handoff', deferred: true, requires: ['understanding_complete', 'human_approval_if_write'] },
  ],
  forbidden_before_understanding: ['propose_implementation', 'create_implementation', 'mutate_repository'],
} as const;

const PROPOSED_VAI_PHASE_CHAIN = [
  {
    phase_id: 'PHASE-VAI-001',
    title: 'Project Understanding foundation',
    focus: 'Design repository-first understanding capability',
  },
  {
    phase_id: 'PHASE-VAI-002',
    title: 'Project Understanding contract',
    focus: 'Freeze understanding contracts and evidence shapes',
  },
  {
    phase_id: 'PHASE-VAI-003',
    title: 'Vertical AI planning readiness',
    focus: 'Hand off certified understanding into planning (design-only)',
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
  MCP_CONNECTOR_PRODUCTION_CERTIFICATION_V1_PATH,
] as const;

const PRECONDITION_EVIDENCE = [
  {
    precondition_id: 'mcp_connector_complete',
    report_path: MCP_CONNECTOR_PRODUCTION_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: MCP_CONNECTOR_COMPLETE_V1_PASS_VERDICT,
    artifact_path: MCP_CONNECTOR_PRODUCTION_CERTIFICATION_V1_PATH,
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

function computeContentFingerprint(root: string, rel: string): string | null {
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

function validateFoundationContracts(input: Record<string, boolean>) {
  const map: Array<[string, string]> = [
    ['VAIPUF_MCP_CONNECTOR_COMPLETE_VERIFIED', 'mcpConnectorCompleteVerified'],
    ['VAIPUF_CIL_COMPLETE_VERIFIED', 'cilCompleteVerified'],
    ['VAIPUF_PLATFORM_CORE_READY', 'platformCoreReady'],
    ['VAIPUF_REPOSITORY_INTELLIGENCE_READY', 'repositoryIntelligenceReady'],
    ['VAIPUF_CERTIFIED_CONNECTORS_BOUND', 'certifiedConnectorsBound'],
    ['VAIPUF_COMPONENTS_DEFINED', 'componentsDefined'],
    ['VAIPUF_REPOSITORY_FIRST_WORKFLOW', 'repositoryFirstWorkflow'],
    ['VAIPUF_REUSE_BEFORE_CREATE', 'reuseBeforeCreate'],
    ['VAIPUF_EVIDENCE_PRECEDES_CONCLUSIONS', 'evidencePrecedesConclusions'],
    ['VAIPUF_HUMAN_APPROVAL_BEFORE_WRITE', 'humanApprovalBeforeWrite'],
    ['VAIPUF_CONSUMES_PLATFORM_CORE_V1_ONLY', 'consumesPlatformCoreV1Only'],
    ['VAIPUF_CONSUMES_CIL_V1_ONLY', 'consumesCilV1Only'],
    ['VAIPUF_CONSUMES_REPOSITORY_INTELLIGENCE_ONLY', 'consumesRepositoryIntelligenceOnly'],
    ['VAIPUF_CONSUMES_CERTIFIED_CONNECTORS_ONLY', 'consumesCertifiedConnectorsOnly'],
    ['VAIPUF_DESIGN_ONLY', 'designOnly'],
    ['VAIPUF_READ_ONLY', 'readOnly'],
    ['VAIPUF_REFERENCE_ONLY', 'referenceOnly'],
    ['VAIPUF_NO_SOURCE_DATA_OWNERSHIP', 'noSourceDataOwnership'],
    ['VAIPUF_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAIPUF_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAIPUF_NO_REPOSITORY_MUTATION', 'noRepositoryMutation'],
    ['VAIPUF_READY_FOR_PLANNING', 'readyForPlanning'],
    ['VAIPUF_FOUNDATION_READY', 'foundationReady'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return { contract_ids: [...VAIPUF_CONTRACT_IDS], results, aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const) };
}

export function writeVerticalAiProjectUnderstandingFoundationV1EngineReport(): {
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
    return {
      ...entry,
      satisfied: satisfied && artifactPresent,
      artifact_present: artifactPresent,
    };
  });

  const mcpConnectorCompleteVerified = preconditionResults.find(
    (entry) => entry.precondition_id === 'mcp_connector_complete'
  )?.satisfied === true;
  const cilCompleteVerified = preconditionResults.find((entry) => entry.precondition_id === 'cil_complete')
    ?.satisfied === true;
  const preconditionsSatisfied = preconditionResults.every((entry) => entry.satisfied);

  const brainComplete = readJson<{ decision_fingerprint?: string; production_ready?: boolean }>(
    root,
    PROJECT_BRAIN_COMPLETE_V1_PATH
  );
  const bundleComplete = readJson<{ decision_fingerprint?: string; bundle_complete?: boolean }>(
    root,
    REPOSITORY_INTELLIGENCE_BUNDLE_PRODUCTION_CERTIFICATION_V1_PATH
  );
  const accessComplete = readJson<{
    decision_fingerprint?: string;
    access_complete?: boolean;
  }>(root, REPOSITORY_INTELLIGENCE_ACCESS_PRODUCTION_CERTIFICATION_V1_PATH);
  const mcpComplete = readJson<{
    decision_fingerprint?: string;
    mcp_connector_complete?: boolean;
    production_ready?: boolean;
  }>(root, MCP_CONNECTOR_PRODUCTION_CERTIFICATION_V1_PATH);

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
    certified_connectors: {
      claude_ref: CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
      chatgpt_ref: CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
      gemini_ref: GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
      cursor_ref: CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
      mcp_ref: MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH,
    },
    reference_mode: 'read_only' as const,
    duplication_policy: 'references_only' as const,
    mutation_policy: 'never_mutate_platform_core_cil_or_repository' as const,
  };

  const certifiedConnectorsBound = Object.values(consumedRefs.certified_connectors).every((rel) =>
    pathExists(root, rel)
  );
  if (!certifiedConnectorsBound) {
    issues.push({
      code: 'CERTIFIED_CONNECTORS_MISSING',
      message: 'All certified consumer connector master snapshots must exist',
      severity: 'error',
    });
  }

  const designFingerprint = stableFingerprint({
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    components: PROJECT_UNDERSTANDING_COMPONENTS,
    principles: FOUNDATION_PRINCIPLES,
    workflow: REPOSITORY_FIRST_WORKFLOW,
    phase_chain: PROPOSED_VAI_PHASE_CHAIN,
  });

  const decisionFingerprint = stableFingerprint({
    goalTruthFingerprint: goalTruth.fingerprint,
    mcpDecision: mcpComplete?.decision_fingerprint ?? null,
    brainDecision: brainComplete?.decision_fingerprint ?? null,
    bundleDecision: bundleComplete?.decision_fingerprint ?? null,
    accessDecision: accessComplete?.decision_fingerprint ?? null,
    designFingerprint,
    preconditionCount: preconditionResults.filter((entry) => entry.satisfied).length,
    mode: 'design_only',
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH, {
    project_understanding_component_model_v1_id: 'project_understanding_component_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    responsibility:
      'Understand the existing repository before proposing or creating any implementation',
    components: PROJECT_UNDERSTANDING_COMPONENTS,
    principles: FOUNDATION_PRINCIPLES,
    design_only: true,
    implementation: false,
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_WORKFLOW_V1_PATH, {
    project_understanding_workflow_v1_id: 'project_understanding_workflow_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    repository_first: true,
    reuse_before_create: true,
    evidence_precedes_conclusions: true,
    human_approval_required_before_write: true,
    planning_deferred_until_understanding: true,
    workflow: REPOSITORY_FIRST_WORKFLOW,
    readiness_for_planning: {
      requires: [
        'repository_understanding_complete',
        'reuse_candidates_analyzed',
        'gaps_evidence_bound',
        'approval_gate_armed',
      ],
      creates_implementation: false,
      mutates_repository: false,
    },
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH, {
    project_understanding_approval_gate_v1_id: 'project_understanding_approval_gate_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    gate_policy: {
      human_approval_required_before_any_write: true,
      understanding_runs_are_read_only: true,
      write_actions_blocked_until_approval: true,
      planning_handoff_requires_understanding: true,
      repository_mutation_forbidden_in_foundation: true,
    },
    write_actions_gated: [
      'planning_package_materialization',
      'implementation_proposal_persist',
      'repository_create',
      'repository_modify',
    ],
    design_only: true,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_EVIDENCE_MODEL_V1_PATH, {
    project_understanding_evidence_model_v1_id: 'project_understanding_evidence_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    evidence_policy: {
      evidence_precedes_conclusions: true,
      conclusions_without_evidence_forbidden: true,
      fingerprints_required: true,
      reference_citations_required: true,
    },
    precondition_evidence: preconditionResults,
    consumed_refs: consumedRefs,
    objective_evidence: preconditionResults.map(
      (entry) =>
        `${entry.precondition_id}=${entry.satisfied}:${entry.pass_verdict}:artifact=${entry.artifact_present}`
    ),
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_BOUNDARY_MODEL_V1_PATH, {
    project_understanding_boundary_model_v1_id: 'project_understanding_boundary_model_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    boundary_policy: {
      consumes_platform_core_v1_only: true,
      consumes_cil_v1_only: true,
      consumes_repository_intelligence_only: true,
      consumes_certified_connectors_only: true,
      owns_source_data: false,
      platform_core_mutation: false,
      cil_mutation: false,
      repository_mutation: false,
      planning_deferred: true,
      human_approval_before_write: true,
    },
    consumed_refs: consumedRefs,
    forbidden_operations: [
      'platform_core_mutation',
      'cil_mutation',
      'repository_mutation',
      'create_before_reuse_analysis',
      'plan_before_understanding',
      'conclude_without_evidence',
      'write_without_human_approval',
    ],
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_ARCHITECTURE_V1_PATH, {
    project_understanding_architecture_v1_id: 'project_understanding_architecture_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    selected_architecture: 'Repository-First Vertical AI Project Understanding',
    independence_statement:
      'Vertical AI Project Understanding is the first Vertical AI responsibility after certified connectors. It understands the existing repository before proposing or creating any implementation. It consumes Platform Core V1, CIL V1, Repository Intelligence, and certified Consumer Connectors only — read-only and reference-only — and never mutates those baselines. Human approval is required before any write. Evolution of this capability is independent of Platform Core and CIL.',
    stack: {
      platform_core: { role: 'Semantic + structural + execution truth', interaction: 'consume_v1_only' },
      cil: { role: 'Certified integration contracts', interaction: 'consume_v1_only' },
      repository_intelligence: { role: 'Structural repository truth', interaction: 'reference_only' },
      certified_connectors: { role: 'Bound certified consumers', interaction: 'reference_only' },
      project_understanding: {
        role: 'Repository-first understanding before planning',
        interaction: 'design_only_foundation',
        owns_source_data: false,
      },
    },
    component_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_EVIDENCE_MODEL_V1_PATH,
    proposed_phase_chain: PROPOSED_VAI_PHASE_CHAIN,
    design_principles: Object.entries(FOUNDATION_PRINCIPLES)
      .filter(([, value]) => value === true)
      .map(([key]) => key),
  });

  const componentsDefined =
    PROJECT_UNDERSTANDING_COMPONENTS.length === REQUIRED_COMPONENT_IDS.length &&
    REQUIRED_COMPONENT_IDS.every((id) =>
      PROJECT_UNDERSTANDING_COMPONENTS.some((component) => component.component_id === id)
    );

  const repositoryFirstWorkflow =
    FOUNDATION_PRINCIPLES.repository_understanding_precedes_planning === true &&
    REPOSITORY_FIRST_WORKFLOW.policy === 'repository_understanding_precedes_planning' &&
    PROJECT_UNDERSTANDING_COMPONENTS.every((component) => component.precedes_planning === true);

  const reuseBeforeCreate =
    FOUNDATION_PRINCIPLES.reuse_precedes_creation === true &&
    REPOSITORY_FIRST_WORKFLOW.reuse_policy === 'reuse_before_create' &&
    PROJECT_UNDERSTANDING_COMPONENTS.some(
      (component) => component.component_id === 'reuse_candidate_analysis'
    );

  const evidencePrecedesConclusions =
    FOUNDATION_PRINCIPLES.evidence_precedes_conclusions === true &&
    PROJECT_UNDERSTANDING_COMPONENTS.some(
      (component) => component.component_id === 'understanding_evidence'
    );

  const humanApprovalBeforeWrite =
    FOUNDATION_PRINCIPLES.human_approval_required_before_write === true &&
    PROJECT_UNDERSTANDING_COMPONENTS.some((component) => component.component_id === 'approval_gate') &&
    PROJECT_UNDERSTANDING_COMPONENTS.every((component) => component.write_authorized === false);

  const designOnly =
    FOUNDATION_PRINCIPLES.design_only === true &&
    FOUNDATION_PRINCIPLES.implementation_deferred === true &&
    FOUNDATION_PRINCIPLES.implementation === false;

  const readOnly = FOUNDATION_PRINCIPLES.read_only === true && consumedRefs.reference_mode === 'read_only';
  const referenceOnly =
    FOUNDATION_PRINCIPLES.reference_only === true && consumedRefs.duplication_policy === 'references_only';
  const noSourceDataOwnership =
    FOUNDATION_PRINCIPLES.owns_source_data === false &&
    PROJECT_UNDERSTANDING_COMPONENTS.every((component) => component.owns_source_data === false);

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

  const baselineChecks: Array<[string, { preserved: boolean; drift: string[] }, string]> = [
    ['BRAIN_BASELINE_MUTATION', brainBaselineAfter, 'Project Brain baseline changed'],
    ['BUNDLE_BASELINE_MUTATION', bundleBaselineAfter, 'RIB baseline changed'],
    ['ACCESS_BASELINE_MUTATION', accessBaselineAfter, 'Access Layer baseline changed'],
    ['RUNTIME_BASELINE_MUTATION', runtimeBaselineAfter, 'Agent Runtime baseline changed'],
    ['CIL_BASELINE_MUTATION', cilBaselineAfter, 'CIL baseline changed'],
    ['CONNECTOR_BASELINE_MUTATION', connectorBaselineAfter, 'Certified connector baseline changed'],
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
    mcpConnectorCompleteVerified &&
    cilCompleteVerified &&
    platformCoreReady &&
    repositoryIntelligenceReady &&
    certifiedConnectorsBound &&
    repositoryFirstWorkflow &&
    reuseBeforeCreate &&
    evidencePrecedesConclusions &&
    humanApprovalBeforeWrite &&
    noPlatformCoreMutation &&
    noCilMutation &&
    noRepositoryMutation &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const readyForPlanning =
    foundationReadyCandidate &&
    FOUNDATION_PRINCIPLES.planning_deferred_until_understanding === true &&
    designOnly;

  const foundationReady = foundationReadyCandidate && readyForPlanning;

  const contractValidation = validateFoundationContracts({
    mcpConnectorCompleteVerified,
    cilCompleteVerified,
    platformCoreReady,
    repositoryIntelligenceReady,
    certifiedConnectorsBound,
    componentsDefined,
    repositoryFirstWorkflow,
    reuseBeforeCreate,
    evidencePrecedesConclusions,
    humanApprovalBeforeWrite,
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
    noRepositoryMutation,
    readyForPlanning,
    foundationReady,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'FOUNDATION_CONTRACT_FAILURE',
      message: 'One or more Vertical AI Project Understanding foundation contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_CONTRACTS_V1_PATH, {
    project_understanding_contracts_v1_id: 'project_understanding_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PHASE,
    generated_at: generatedAt,
    foundation_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
    contract_ids: [...VAIPUF_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: FOUNDATION_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH, {
    vertical_ai_project_understanding_foundation_v1_id:
      'vertical_ai_project_understanding_foundation_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    preconditions_satisfied: preconditionsSatisfied,
    design_only: true,
    execution: false,
    implementation: false,
    foundation_ready: foundationReady,
    ready_for_planning: readyForPlanning,
    repository_first_workflow: repositoryFirstWorkflow,
    reuse_before_create: reuseBeforeCreate,
    evidence_precedes_conclusions: evidencePrecedesConclusions,
    human_approval_required_before_write: humanApprovalBeforeWrite,
    architecture_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_ARCHITECTURE_V1_PATH,
    component_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_EVIDENCE_MODEL_V1_PATH,
    contracts_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_REGISTRY_V1_PATH,
    components: PROJECT_UNDERSTANDING_COMPONENTS.map((component) => component.component_id),
    principles: FOUNDATION_PRINCIPLES,
    platform_core_mutation: false,
    cil_mutation: false,
    repository_mutation: false,
    execute_authorized: false,
    write_authorized: false,
  });

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_REGISTRY_V1_PATH, {
    registry_id: 'project-understanding-registry-v1',
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_SYSTEM_ID,
    version: 'vertical_ai_project_understanding_foundation_v1',
    generated_at: generatedAt,
    foundation_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
    architecture_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_ARCHITECTURE_V1_PATH,
    contracts_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_CONTRACTS_V1_PATH,
    component_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_EVIDENCE_MODEL_V1_PATH,
    component_ids: PROJECT_UNDERSTANDING_COMPONENTS.map((component) => component.component_id),
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    foundation_ready: foundationReady,
    ready_for_planning: readyForPlanning,
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
    ? VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PASS_VERDICT
    : VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_project_understanding_foundation_v1_${Date.now()}`,
    phase: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PHASE,
    system_id: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Design the Project Understanding foundation for Vertical AI so repository understanding precedes planning, reuse precedes creation, and human approval gates any write.',
    vertical_ai_project_understanding_foundation_v1_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_STATUS
      : 'VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_NOT_READY',
    validation_passed: passed,
    design_only: true,
    foundation_name: FOUNDATION_NAME,
    capability_id: CAPABILITY_ID,
    layer_id: LAYER_ID,
    decision_fingerprint: decisionFingerprint,
    design_fingerprint: designFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    precondition_evidence: preconditionResults,
    brain_baseline_preserved: brainBaselineAfter.preserved,
    brain_baseline_drift: brainBaselineAfter.drift,
    bundle_baseline_preserved: bundleBaselineAfter.preserved,
    bundle_baseline_drift: bundleBaselineAfter.drift,
    access_baseline_preserved: accessBaselineAfter.preserved,
    access_baseline_drift: accessBaselineAfter.drift,
    runtime_baseline_preserved: runtimeBaselineAfter.preserved,
    runtime_baseline_drift: runtimeBaselineAfter.drift,
    cil_baseline_preserved: cilBaselineAfter.preserved,
    cil_baseline_drift: cilBaselineAfter.drift,
    connector_baseline_preserved: connectorBaselineAfter.preserved,
    connector_baseline_drift: connectorBaselineAfter.drift,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    repository_unchanged: noRepositoryMutation,
    components: PROJECT_UNDERSTANDING_COMPONENTS.map((component) => component.component_id),
    foundation_ready: foundationReady,
    ready_for_planning: readyForPlanning,
    repository_first_workflow_established: repositoryFirstWorkflow,
    reuse_before_create_policy_established: reuseBeforeCreate,
    contract_validation: contractValidation,
    foundation_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_PATH,
    architecture_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_ARCHITECTURE_V1_PATH,
    component_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_COMPONENT_MODEL_V1_PATH,
    workflow_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_WORKFLOW_V1_PATH,
    boundary_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_BOUNDARY_MODEL_V1_PATH,
    approval_gate_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_APPROVAL_GATE_V1_PATH,
    evidence_model_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_EVIDENCE_MODEL_V1_PATH,
    contracts_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_REGISTRY_V1_PATH,
    checks: {
      PRECONDITIONS_SATISFIED: preconditionsSatisfied,
      MCP_CONNECTOR_COMPLETE: mcpConnectorCompleteVerified,
      CIL_COMPLETE: cilCompleteVerified,
      PLATFORM_CORE_READY: platformCoreReady,
      REPOSITORY_INTELLIGENCE_READY: repositoryIntelligenceReady,
      CERTIFIED_CONNECTORS_BOUND: certifiedConnectorsBound,
      COMPONENTS_DEFINED: componentsDefined,
      REPOSITORY_FIRST_WORKFLOW: repositoryFirstWorkflow,
      REUSE_BEFORE_CREATE: reuseBeforeCreate,
      EVIDENCE_PRECEDES_CONCLUSIONS: evidencePrecedesConclusions,
      HUMAN_APPROVAL_BEFORE_WRITE: humanApprovalBeforeWrite,
      DESIGN_ONLY: designOnly,
      READ_ONLY: readOnly,
      REFERENCE_ONLY: referenceOnly,
      NO_SOURCE_DATA_OWNERSHIP: noSourceDataOwnership,
      PLATFORM_CORE_UNCHANGED: noPlatformCoreMutation,
      CIL_UNCHANGED: noCilMutation,
      REPOSITORY_UNCHANGED: noRepositoryMutation,
      READY_FOR_PLANNING: readyForPlanning,
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

  writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_PROJECT_UNDERSTANDING_FOUNDATION_V1_REPORT_PATH,
  };
}
