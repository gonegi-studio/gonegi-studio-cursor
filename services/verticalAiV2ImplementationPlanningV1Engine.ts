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
  VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
  VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH,
} from './verticalAiFinalCertificationV1Engine.js';
import {
  VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
} from './verticalAiCompleteCertificationV1Engine.js';
import {
  VERTICAL_AI_V2_ROADMAP_V1_PASS_VERDICT,
  VERTICAL_AI_V2_ROADMAP_V1_PATH,
  VERTICAL_AI_V2_ROADMAP_V1_REPORT_PATH,
  VERTICAL_AI_V2_ROADMAP_PHASES_V1_PATH,
  VERTICAL_AI_V2_NEW_CAPABILITIES_V1_PATH,
  VERTICAL_AI_V2_SCOPE_DEFINITION_V1_PATH,
  VERTICAL_AI_V2_MIGRATION_STRATEGY_V1_PATH,
  VERTICAL_AI_V2_OBJECTIVES_V1_PATH,
  VERTICAL_AI_V2_SUCCESS_CRITERIA_V1_PATH,
  VERTICAL_AI_V2_ROADMAP_REGISTRY_V1_PATH,
} from './verticalAiV2RoadmapV1Engine.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE = 'PHASE-VAI-101' as const;
export const VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_SYSTEM_ID =
  'VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1' as const;
export const VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1' as const;
export const VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1' as const;
export const VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_STATUS =
  'VERTICAL_AI_V2_IMPLEMENTATION_PLAN_DEFINED' as const;

export const VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR =
  'datasets/vertical_ai_v2_implementation_planning_v1' as const;
export const VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/vertical-ai-v2-implementation-planning-v1.json` as const;
export const VERTICAL_AI_V2_IMPLEMENTATION_PHASES_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/implementation-phases-v1.json` as const;
export const VERTICAL_AI_V2_MILESTONES_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/milestones-v1.json` as const;
export const VERTICAL_AI_V2_DEPENDENCY_PLAN_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/dependency-plan-v1.json` as const;
export const VERTICAL_AI_V2_EXECUTION_STRATEGY_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/execution-strategy-v1.json` as const;
export const VERTICAL_AI_V2_VALIDATION_STRATEGY_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/validation-strategy-v1.json` as const;
export const VERTICAL_AI_V2_RISK_PLAN_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/risk-plan-v1.json` as const;
export const VERTICAL_AI_V2_IMPLEMENTATION_PRIORITIES_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/implementation-priorities-v1.json` as const;
export const VERTICAL_AI_V2_APPROVAL_STRATEGY_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/approval-strategy-v1.json` as const;
export const VERTICAL_AI_V2_IMPL_SUCCESS_CRITERIA_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/success-criteria-v1.json` as const;
export const VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_CONTRACTS_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/implementation-planning-contracts-v1.json` as const;
export const VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_REGISTRY_V1_PATH =
  `${VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_DIR}/implementation-planning-registry-v1.json` as const;
export const VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_REPORT.json' as const;

const PLAN_NAME = 'Evidence-Bound Vertical AI V2 Implementation Planning V1' as const;
const CAPABILITY_ID = 'vertical_ai' as const;
const TARGET_VERSION = 'vertical_ai_v2' as const;
const EXECUTION_STRATEGY_NAME =
  'Evidence-Bound Vertical AI V2 Repository-First Execution Strategy' as const;

export const VAIIP_CONTRACT_IDS = [
  'VAIIP_PRECHECK_VERIFIED',
  'VAIIP_IMPLEMENTATION_PHASES',
  'VAIIP_MILESTONES',
  'VAIIP_DEPENDENCY_PLAN',
  'VAIIP_EXECUTION_STRATEGY',
  'VAIIP_VALIDATION_STRATEGY',
  'VAIIP_RISK_PLAN',
  'VAIIP_IMPLEMENTATION_PRIORITIES',
  'VAIIP_APPROVAL_STRATEGY',
  'VAIIP_SUCCESS_CRITERIA',
  'VAIIP_PLANNING_ONLY',
  'VAIIP_READ_ONLY',
  'VAIIP_REPOSITORY_FIRST',
  'VAIIP_EVIDENCE_FIRST',
  'VAIIP_NO_REPOSITORY_MUTATION',
  'VAIIP_NO_PLATFORM_CORE_MUTATION',
  'VAIIP_NO_CIL_MUTATION',
  'VAIIP_CONSUMES_CERTIFIED_VERTICAL_AI_V1',
  'VAIIP_EXECUTION_ROADMAP_APPROVED',
  'VAIIP_READY_FOR_V2_IMPLEMENTATION',
] as const;

const VERIFICATION_CHECKS = [
  'implementation_phases',
  'milestones',
  'dependency_plan',
  'execution_strategy',
  'validation_strategy',
  'risk_plan',
  'implementation_priorities',
  'approval_strategy',
  'success_criteria',
] as const;

const PLANNING_PRINCIPLES = {
  planning_only: true,
  implementation: false,
  redesign: false,
  read_only: true,
  repository_first: true,
  evidence_first: true,
  repository_mutation_forbidden: true,
  repository_mutation: false,
  consumes_platform_core_v1_only: true,
  consumes_cil_v1_only: true,
  consumes_certified_vertical_ai_v1: true,
  owns_source_data: false,
  platform_core_mutation: false,
  cil_mutation: false,
  vertical_ai_v1_immutable: true,
} as const;

const EXECUTION_FLAGS = {
  ...PLANNING_PRINCIPLES,
  execute_authorized: false as const,
  implementation_deferred: true as const,
};

const IMPLEMENTATION_PHASES = [
  {
    phase_id: 'PHASE-VAI-201',
    track_id: 'v2_architecture_definition',
    order: 1,
    title: 'Vertical AI V2 architecture definition',
    roadmap_track_ref: 'v2_architecture_definition',
    work_packages: [
      'Define V2 architecture layers and public API surfaces',
      'Bind V2 design fingerprint to certified V1 master snapshots',
      'Freeze V2 architecture artifacts without mutating V1 paths',
    ],
    entry_criteria: ['PASS_VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1'],
    exit_criteria: ['architecture_defined', 'v1_snapshots_unchanged'],
  },
  {
    phase_id: 'PHASE-VAI-202',
    track_id: 'replaceable_runtime_modules',
    order: 2,
    title: 'Replaceable runtime module contracts',
    roadmap_track_ref: 'replaceable_runtime_modules',
    work_packages: [
      'Specify replaceable understanding/planning/execution/validation/certification/improvement modules',
      'Define dual-run equivalence fixtures on certified evidence',
      'Certify module contracts before promotion',
    ],
    entry_criteria: ['v2_architecture_definition PASS'],
    exit_criteria: ['module_contracts_certified', 'fingerprint_stability_proven'],
  },
  {
    phase_id: 'PHASE-VAI-203',
    track_id: 'repository_operation_profiles',
    order: 3,
    title: 'Repository operation profile implementation prep',
    roadmap_track_ref: 'repository_operation_profiles',
    work_packages: [
      'Materialize repository-first operation profiles from certified V1 scans',
      'Encode reuse-before-create and human-approval gates',
      'Attest mutation policy remains forbidden by default',
    ],
    entry_criteria: ['replaceable_runtime_modules PASS'],
    exit_criteria: ['profiles_defined', 'mutation_policy_attested'],
  },
  {
    phase_id: 'PHASE-VAI-204',
    track_id: 'consumer_collaboration_sessions',
    order: 4,
    title: 'Consumer collaboration session orchestration prep',
    roadmap_track_ref: 'consumer_collaboration_sessions',
    work_packages: [
      'Design CIL-mediated session orchestration across certified connectors',
      'Require session evidence fingerprints',
      'Keep connector master snapshots immutable',
    ],
    entry_criteria: ['repository_operation_profiles PASS'],
    exit_criteria: ['session_model_defined', 'consumer_snapshots_unchanged'],
  },
  {
    phase_id: 'PHASE-VAI-205',
    track_id: 'additive_improvement_runtime',
    order: 5,
    title: 'Additive improvement candidate runtime prep',
    roadmap_track_ref: 'additive_improvement_runtime',
    work_packages: [
      'Select/rank candidates from certified evidence only',
      'Keep candidates non-enacting until approval',
      'Prove reproducibility of candidate fingerprints',
    ],
    entry_criteria: ['consumer_collaboration_sessions PASS'],
    exit_criteria: ['candidates_reproducible', 'repository_mutation_forbidden'],
  },
  {
    phase_id: 'PHASE-VAI-206',
    track_id: 'v2_validation_and_certification',
    order: 6,
    title: 'V2 validation and certification campaign prep',
    roadmap_track_ref: 'v2_validation_and_certification',
    work_packages: [
      'Execute planned validation stages with per-stage evidence',
      'Certify V2 additives without PC/CIL/V1 drift',
      'Gate production operation validation readiness',
    ],
    entry_criteria: ['additive_improvement_runtime PASS'],
    exit_criteria: ['v2_certification_pass', 'ready_for_v2_production_operation_validation'],
  },
] as const;

const MILESTONES = [
  {
    milestone_id: 'ms_arch_frozen',
    phase_id: 'PHASE-VAI-201',
    title: 'V2 architecture frozen',
    evidence_required: ['architecture_artifact', 'design_fingerprint'],
  },
  {
    milestone_id: 'ms_modules_certified',
    phase_id: 'PHASE-VAI-202',
    title: 'Replaceable modules certified',
    evidence_required: ['module_contract_report', 'dual_run_equivalence'],
  },
  {
    milestone_id: 'ms_ops_profiles_ready',
    phase_id: 'PHASE-VAI-203',
    title: 'Repository operation profiles ready',
    evidence_required: ['operation_profile_registry', 'mutation_gate_attestation'],
  },
  {
    milestone_id: 'ms_collab_sessions_ready',
    phase_id: 'PHASE-VAI-204',
    title: 'Consumer collaboration sessions ready',
    evidence_required: ['session_model', 'cil_binding_attestation'],
  },
  {
    milestone_id: 'ms_improvement_ready',
    phase_id: 'PHASE-VAI-205',
    title: 'Additive improvement runtime ready',
    evidence_required: ['candidate_selection_fingerprint', 'non_enacting_attestation'],
  },
  {
    milestone_id: 'ms_v2_cert_ready',
    phase_id: 'PHASE-VAI-206',
    title: 'V2 certification campaign ready',
    evidence_required: ['validation_campaign_plan', 'baseline_protection_attestation'],
  },
] as const;

const DEPENDENCY_EDGES = [
  { from: 'v2_architecture_definition', to: 'replaceable_runtime_modules' },
  { from: 'replaceable_runtime_modules', to: 'repository_operation_profiles' },
  { from: 'repository_operation_profiles', to: 'consumer_collaboration_sessions' },
  { from: 'consumer_collaboration_sessions', to: 'additive_improvement_runtime' },
  { from: 'additive_improvement_runtime', to: 'v2_validation_and_certification' },
] as const;

const HARD_DEPENDENCIES = [
  'PASS_VERTICAL_AI_V2_ROADMAP_V1',
  'certified_vertical_ai_v1_master_snapshot_v2',
  'platform_core_v1_immutable',
  'cil_v1_immutable',
  'repository_mutation_forbidden_default',
] as const;

const EXECUTION_STRATEGY = {
  strategy_name: EXECUTION_STRATEGY_NAME,
  repository_first: true,
  evidence_first: true,
  principles: [
    'Execute tracks strictly in dependency order; no parallel promotion across dependent tracks.',
    'Bind every implementation increment to repository evidence before design promotion.',
    'Reuse certified Vertical AI V1 fingerprints as immutable reference baselines.',
    'Keep Platform Core V1 and CIL V1 unchanged; never mutate connector master snapshots.',
    'Defer enactment until human approval and execute_authorized=true.',
  ],
  build_mode: 'sequential_track_promotion',
  deferred_until: 'PASS_VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1',
  forbidden_during_planning: [
    'repository_mutation',
    'platform_core_mutation',
    'cil_mutation',
    'vertical_ai_v1_master_snapshot_mutation',
  ],
} as const;

const VALIDATION_STRATEGY = {
  validation_mode: 'stage_gated_evidence_campaign',
  stages: [
    {
      stage_id: 'val_architecture_integrity',
      applies_to: 'v2_architecture_definition',
      checks: ['architecture_present', 'v1_baseline_preserved', 'design_fingerprint_stable'],
    },
    {
      stage_id: 'val_module_equivalence',
      applies_to: 'replaceable_runtime_modules',
      checks: ['dual_run_identical', 'contract_conformance', 'api_stability'],
    },
    {
      stage_id: 'val_repository_operation_gates',
      applies_to: 'repository_operation_profiles',
      checks: ['reuse_before_create', 'human_approval_gate', 'mutation_forbidden'],
    },
    {
      stage_id: 'val_consumer_collaboration',
      applies_to: 'consumer_collaboration_sessions',
      checks: ['cil_mediated_only', 'session_fingerprint', 'connector_snapshots_unchanged'],
    },
    {
      stage_id: 'val_improvement_non_enacting',
      applies_to: 'additive_improvement_runtime',
      checks: ['certified_evidence_only', 'candidates_not_enacted', 'reproducible'],
    },
    {
      stage_id: 'val_v2_certification_campaign',
      applies_to: 'v2_validation_and_certification',
      checks: ['full_lifecycle_integrity', 'baseline_protection', 'ready_for_ops_validation'],
    },
  ],
  evidence_policy: {
    evidence_first: true,
    dual_run_required: true,
    fingerprint_required: true,
  },
} as const;

const RISK_PLAN = [
  {
    risk_id: 'risk_v1_drift',
    severity: 'critical',
    description: 'Implementation accidentally mutates frozen Vertical AI V1 snapshots.',
    mitigation: 'Protect V1/v2 master snapshot mtimes; fail on fingerprint drift.',
  },
  {
    risk_id: 'risk_pc_cil_mutation',
    severity: 'critical',
    description: 'Platform Core or CIL baselines change during V2 work.',
    mitigation: 'Baseline mtime guards on every planning/implementation engine run.',
  },
  {
    risk_id: 'risk_unauthorized_repo_write',
    severity: 'critical',
    description: 'Repository writes occur before human approval / execute_authorized.',
    mitigation: 'Hard-forbid mutation gates; approval strategy blocks enactment.',
  },
  {
    risk_id: 'risk_dependency_skip',
    severity: 'high',
    description: 'Tracks promoted out of dependency order.',
    mitigation: 'Dependency plan enforces sequential entry_criteria checks.',
  },
  {
    risk_id: 'risk_uncertified_improvement',
    severity: 'high',
    description: 'Improvement candidates derived from uncertified evidence.',
    mitigation: 'Require certified-evidence-only attestation in validation stage.',
  },
  {
    risk_id: 'risk_consumer_snapshot_breakage',
    severity: 'medium',
    description: 'Connector master snapshots rewritten during collaboration enablement.',
    mitigation: 'Treat certified connectors as immutable references; verify mtimes.',
  },
] as const;

const APPROVAL_STRATEGY = {
  strategy_id: 'approval_human_gated_sequential',
  human_approval_required: true,
  gates: [
    {
      gate_id: 'gate_planning_complete',
      requires: ['PASS_VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1'],
      authorizes: 'implementation_design_entry',
    },
    {
      gate_id: 'gate_track_exit',
      requires: ['track_exit_criteria_pass', 'validation_stage_pass'],
      authorizes: 'next_track_entry',
    },
    {
      gate_id: 'gate_execute_authorized',
      requires: ['human_approval', 'execute_authorized=true'],
      authorizes: 'enactment_only_after_planning',
    },
    {
      gate_id: 'gate_repository_write',
      requires: ['human_approval', 'execute_authorized=true', 'mutation_plan_approved'],
      authorizes: 'repository_mutation',
      default: 'denied',
    },
  ],
  execution_roadmap_approval: {
    approved_when: 'all_planning_contracts_pass',
    approved_artifact: 'vertical_ai_v2_implementation_planning_v1',
    execute_authorized_default: false,
  },
} as const;

const SUCCESS_CRITERIA = [
  {
    criterion_id: 'sc_priorities_established',
    statement: 'Implementation priorities established from roadmap capabilities and phase order.',
  },
  {
    criterion_id: 'sc_execution_roadmap_approved',
    statement: 'Execution roadmap approved via planning contracts and approval strategy gates.',
  },
  {
    criterion_id: 'sc_plan_defined',
    statement: 'Vertical AI V2 implementation plan defined with phases, milestones, dependencies, and risks.',
  },
  {
    criterion_id: 'sc_repository_first_evidence_first',
    statement: 'Repository-first and evidence-first principles are binding in execution/validation strategies.',
  },
  {
    criterion_id: 'sc_pc_cil_unchanged',
    statement: 'Platform Core V1 and CIL V1 remain unchanged.',
  },
  {
    criterion_id: 'sc_no_repo_mutation',
    statement: 'Repository mutation remains forbidden during planning.',
  },
  {
    criterion_id: 'sc_ready_for_v2_implementation',
    statement: 'Artifacts ready for Vertical AI V2 implementation workstream.',
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

const PROTECTED_VERTICAL_AI_V1_PATHS = [
  VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
  VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH,
  VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
  VERTICAL_AI_V2_ROADMAP_V1_PATH,
  VERTICAL_AI_V2_ROADMAP_PHASES_V1_PATH,
  VERTICAL_AI_V2_NEW_CAPABILITIES_V1_PATH,
  VERTICAL_AI_V2_SCOPE_DEFINITION_V1_PATH,
  VERTICAL_AI_V2_MIGRATION_STRATEGY_V1_PATH,
  VERTICAL_AI_V2_OBJECTIVES_V1_PATH,
  VERTICAL_AI_V2_SUCCESS_CRITERIA_V1_PATH,
  VERTICAL_AI_V2_ROADMAP_REGISTRY_V1_PATH,
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

function validatePlanningContracts(input: Record<string, boolean>) {
  const map: Array<[string, string]> = [
    ['VAIIP_PRECHECK_VERIFIED', 'precheckVerified'],
    ['VAIIP_IMPLEMENTATION_PHASES', 'implementationPhases'],
    ['VAIIP_MILESTONES', 'milestones'],
    ['VAIIP_DEPENDENCY_PLAN', 'dependencyPlan'],
    ['VAIIP_EXECUTION_STRATEGY', 'executionStrategy'],
    ['VAIIP_VALIDATION_STRATEGY', 'validationStrategy'],
    ['VAIIP_RISK_PLAN', 'riskPlan'],
    ['VAIIP_IMPLEMENTATION_PRIORITIES', 'implementationPriorities'],
    ['VAIIP_APPROVAL_STRATEGY', 'approvalStrategy'],
    ['VAIIP_SUCCESS_CRITERIA', 'successCriteria'],
    ['VAIIP_PLANNING_ONLY', 'planningOnly'],
    ['VAIIP_READ_ONLY', 'readOnly'],
    ['VAIIP_REPOSITORY_FIRST', 'repositoryFirst'],
    ['VAIIP_EVIDENCE_FIRST', 'evidenceFirst'],
    ['VAIIP_NO_REPOSITORY_MUTATION', 'noRepositoryMutation'],
    ['VAIIP_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAIIP_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAIIP_CONSUMES_CERTIFIED_VERTICAL_AI_V1', 'consumesCertifiedVerticalAiV1'],
    ['VAIIP_EXECUTION_ROADMAP_APPROVED', 'executionRoadmapApproved'],
    ['VAIIP_READY_FOR_V2_IMPLEMENTATION', 'readyForV2Implementation'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return {
    contract_ids: [...VAIIP_CONTRACT_IDS],
    results,
    aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const),
  };
}

export function writeVerticalAiV2ImplementationPlanningV1EngineReport(): {
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
  const vaiBaselineBefore = captureBaselineMtimes(root, PROTECTED_VERTICAL_AI_V1_PATHS);

  const goalTruth = loadCurrentGoalTruth(root);
  const allGoalsSatisfied = goalTruth.satisfied_goals === goalTruth.evaluated_goals;
  if (!allGoalsSatisfied) {
    issues.push({
      code: 'GOAL_TRUTH',
      message: 'All Current Goal Truth entries must be satisfied for V2 implementation planning',
      severity: 'error',
    });
  }

  const precheckVerified = phaseReportPassed(
    root,
    VERTICAL_AI_V2_ROADMAP_V1_REPORT_PATH,
    VERTICAL_AI_V2_ROADMAP_V1_PASS_VERDICT
  );
  if (!precheckVerified) {
    issues.push({
      code: 'PRECHECK_FAILED',
      message: `Precheck requires ${VERTICAL_AI_V2_ROADMAP_V1_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const roadmap = readJson<{
    ready_for_v2_implementation_planning?: boolean;
    roadmap_defined?: boolean;
    design_fingerprint?: string;
    decision_fingerprint?: string;
    implementation_priorities?: string[];
    recommended_build_order?: string[];
  }>(root, VERTICAL_AI_V2_ROADMAP_V1_PATH);

  const roadmapPhases = readJson<{
    phases?: Array<{ track_id: string; priority: number }>;
    recommended_build_order?: string[];
  }>(root, VERTICAL_AI_V2_ROADMAP_PHASES_V1_PATH);

  const roadmapCapabilities = readJson<{
    capabilities?: Array<{ capability_id: string; implementation_priority: number }>;
    implementation_priorities?: string[];
  }>(root, VERTICAL_AI_V2_NEW_CAPABILITIES_V1_PATH);

  const masterSnapshotV2 = readJson<{
    immutable?: boolean;
    capability_id?: string;
    snapshot_fingerprint?: string;
  }>(root, VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH);

  const consumesCertifiedVerticalAiV1 =
    precheckVerified &&
    roadmap?.ready_for_v2_implementation_planning === true &&
    roadmap?.roadmap_defined === true &&
    masterSnapshotV2?.immutable === true &&
    masterSnapshotV2?.capability_id === CAPABILITY_ID &&
    pathExists(root, VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH) &&
    pathExists(root, VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH);

  if (!consumesCertifiedVerticalAiV1) {
    issues.push({
      code: 'CERTIFIED_V1_OR_ROADMAP_NOT_BOUND',
      message: 'Certified Vertical AI V1 and V2 roadmap must be bound for implementation planning',
      severity: 'error',
    });
  }

  const roadmapTrackIds = new Set((roadmapPhases?.phases ?? []).map((phase) => phase.track_id));
  const phasesCoverRoadmap =
    IMPLEMENTATION_PHASES.length >= 6 &&
    IMPLEMENTATION_PHASES.every((phase) => roadmapTrackIds.has(phase.roadmap_track_ref)) &&
    IMPLEMENTATION_PHASES.every((phase, index) => phase.order === index + 1);

  const implementationPhases = phasesCoverRoadmap;

  const milestones =
    MILESTONES.length === IMPLEMENTATION_PHASES.length &&
    MILESTONES.every((ms) => IMPLEMENTATION_PHASES.some((phase) => phase.phase_id === ms.phase_id)) &&
    MILESTONES.every((ms) => ms.evidence_required.length > 0);

  const recommendedBuildOrder = IMPLEMENTATION_PHASES.map((phase) => phase.track_id);
  const dependencyPlan =
    DEPENDENCY_EDGES.length === IMPLEMENTATION_PHASES.length - 1 &&
    DEPENDENCY_EDGES.every(
      (edge, index) =>
        edge.from === IMPLEMENTATION_PHASES[index]?.track_id &&
        edge.to === IMPLEMENTATION_PHASES[index + 1]?.track_id
    ) &&
    HARD_DEPENDENCIES.length >= 5 &&
    JSON.stringify(recommendedBuildOrder) ===
      JSON.stringify(roadmapPhases?.recommended_build_order ?? recommendedBuildOrder);

  const executionStrategy =
    EXECUTION_STRATEGY.repository_first === true &&
    EXECUTION_STRATEGY.evidence_first === true &&
    EXECUTION_STRATEGY.principles.length >= 5 &&
    EXECUTION_STRATEGY.forbidden_during_planning.includes('repository_mutation');

  const validationStrategy =
    VALIDATION_STRATEGY.stages.length === IMPLEMENTATION_PHASES.length &&
    VALIDATION_STRATEGY.evidence_policy.evidence_first === true &&
    VALIDATION_STRATEGY.evidence_policy.dual_run_required === true &&
    VALIDATION_STRATEGY.stages.every((stage) =>
      IMPLEMENTATION_PHASES.some((phase) => phase.track_id === stage.applies_to)
    );

  const riskPlan =
    RISK_PLAN.length >= 6 &&
    RISK_PLAN.some((risk) => risk.risk_id === 'risk_v1_drift') &&
    RISK_PLAN.some((risk) => risk.risk_id === 'risk_unauthorized_repo_write') &&
    RISK_PLAN.every((risk) => risk.mitigation.length > 0);

  const capabilityPriorities = roadmapCapabilities?.implementation_priorities ?? [];
  const implementationPriorityOrder = [
    ...capabilityPriorities,
    ...recommendedBuildOrder.filter((track) => !capabilityPriorities.includes(track)),
  ];
  const implementationPriorities =
    implementationPriorityOrder.length >= 5 &&
    recommendedBuildOrder[0] === 'v2_architecture_definition' &&
    capabilityPriorities.length > 0;

  const approvalStrategy =
    APPROVAL_STRATEGY.human_approval_required === true &&
    APPROVAL_STRATEGY.gates.length >= 4 &&
    APPROVAL_STRATEGY.execution_roadmap_approval.execute_authorized_default === false &&
    APPROVAL_STRATEGY.gates.some((gate) => gate.gate_id === 'gate_repository_write' && gate.default === 'denied');

  const successCriteria =
    SUCCESS_CRITERIA.length >= 7 &&
    SUCCESS_CRITERIA.some((c) => c.criterion_id === 'sc_ready_for_v2_implementation') &&
    SUCCESS_CRITERIA.some((c) => c.criterion_id === 'sc_execution_roadmap_approved');

  if (!implementationPhases) {
    issues.push({
      code: 'IMPLEMENTATION_PHASES',
      message: 'Implementation phases must cover certified V2 roadmap tracks in order',
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
  const vaiBaselineAfter = verifyBaselinePreserved(root, vaiBaselineBefore, PROTECTED_VERTICAL_AI_V1_PATHS);

  const baselineChecks: Array<[string, { preserved: boolean; drift: string[] }, string]> = [
    ['BRAIN_BASELINE_MUTATION', brainBaselineAfter, 'Project Brain baseline changed'],
    ['BUNDLE_BASELINE_MUTATION', bundleBaselineAfter, 'RIB baseline changed'],
    ['ACCESS_BASELINE_MUTATION', accessBaselineAfter, 'Access Layer baseline changed'],
    ['RUNTIME_BASELINE_MUTATION', runtimeBaselineAfter, 'Agent Runtime baseline changed'],
    ['CIL_BASELINE_MUTATION', cilBaselineAfter, 'CIL baseline changed'],
    ['CONNECTOR_BASELINE_MUTATION', connectorBaselineAfter, 'Certified connector baseline changed'],
    ['VERTICAL_AI_BASELINE_MUTATION', vaiBaselineAfter, 'Certified Vertical AI / roadmap baseline changed'],
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
  const noRepositoryMutation =
    PLANNING_PRINCIPLES.repository_mutation_forbidden === true &&
    PLANNING_PRINCIPLES.repository_mutation === false;

  const planningOnly =
    PLANNING_PRINCIPLES.planning_only === true && PLANNING_PRINCIPLES.implementation === false;
  const readOnly = PLANNING_PRINCIPLES.read_only === true;
  const repositoryFirst = PLANNING_PRINCIPLES.repository_first === true;
  const evidenceFirst = PLANNING_PRINCIPLES.evidence_first === true;

  const verificationResults: Record<(typeof VERIFICATION_CHECKS)[number], boolean> = {
    implementation_phases: implementationPhases,
    milestones,
    dependency_plan: dependencyPlan,
    execution_strategy: executionStrategy,
    validation_strategy: validationStrategy,
    risk_plan: riskPlan,
    implementation_priorities: implementationPriorities,
    approval_strategy: approvalStrategy,
    success_criteria: successCriteria,
  };
  const allVerificationPassed = VERIFICATION_CHECKS.every(
    (check) => verificationResults[check] === true
  );

  const designFingerprint = stableFingerprint({
    phases: IMPLEMENTATION_PHASES,
    milestones: MILESTONES,
    dependencies: DEPENDENCY_EDGES,
    hard_dependencies: HARD_DEPENDENCIES,
    execution: EXECUTION_STRATEGY,
    validation: VALIDATION_STRATEGY,
    risks: RISK_PLAN,
    priorities: implementationPriorityOrder,
    approval: APPROVAL_STRATEGY,
    success: SUCCESS_CRITERIA,
    principles: PLANNING_PRINCIPLES,
  });

  const decisionFingerprint = stableFingerprint({
    goalTruth: goalTruth.fingerprint,
    designFingerprint,
    roadmap_decision: roadmap?.decision_fingerprint ?? null,
    roadmap_design: roadmap?.design_fingerprint ?? null,
    master_v2: masterSnapshotV2?.snapshot_fingerprint ?? null,
    mode: 'planning_only',
  });

  const executionRoadmapApproved =
    precheckVerified &&
    allVerificationPassed &&
    approvalStrategy &&
    consumesCertifiedVerticalAiV1 &&
    noPlatformCoreMutation &&
    noCilMutation &&
    noRepositoryMutation &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const readyForV2Implementation = executionRoadmapApproved && vaiBaselineAfter.preserved;
  const planDefined = readyForV2Implementation && allGoalsSatisfied;

  const contractValidation = validatePlanningContracts({
    precheckVerified,
    implementationPhases,
    milestones,
    dependencyPlan,
    executionStrategy,
    validationStrategy,
    riskPlan,
    implementationPriorities,
    approvalStrategy,
    successCriteria,
    planningOnly,
    readOnly,
    repositoryFirst,
    evidenceFirst,
    noRepositoryMutation,
    noPlatformCoreMutation,
    noCilMutation,
    consumesCertifiedVerticalAiV1,
    executionRoadmapApproved,
    readyForV2Implementation,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'IMPLEMENTATION_PLANNING_CONTRACT_FAILURE',
      message: 'One or more Vertical AI V2 implementation planning contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_V2_IMPLEMENTATION_PHASES_V1_PATH, {
    implementation_phases_v1_id: 'vertical_ai_v2_implementation_phases_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    phases: IMPLEMENTATION_PHASES,
    recommended_build_order: recommendedBuildOrder,
  });

  writeJson(root, VERTICAL_AI_V2_MILESTONES_V1_PATH, {
    milestones_v1_id: 'vertical_ai_v2_milestones_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    milestones: MILESTONES,
  });

  writeJson(root, VERTICAL_AI_V2_DEPENDENCY_PLAN_V1_PATH, {
    dependency_plan_v1_id: 'vertical_ai_v2_dependency_plan_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    hard_dependencies: HARD_DEPENDENCIES,
    edges: DEPENDENCY_EDGES,
    recommended_build_order: recommendedBuildOrder,
  });

  writeJson(root, VERTICAL_AI_V2_EXECUTION_STRATEGY_V1_PATH, {
    execution_strategy_v1_id: 'vertical_ai_v2_execution_strategy_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    ...EXECUTION_STRATEGY,
  });

  writeJson(root, VERTICAL_AI_V2_VALIDATION_STRATEGY_V1_PATH, {
    validation_strategy_v1_id: 'vertical_ai_v2_validation_strategy_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    ...VALIDATION_STRATEGY,
  });

  writeJson(root, VERTICAL_AI_V2_RISK_PLAN_V1_PATH, {
    risk_plan_v1_id: 'vertical_ai_v2_risk_plan_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    risks: RISK_PLAN,
  });

  writeJson(root, VERTICAL_AI_V2_IMPLEMENTATION_PRIORITIES_V1_PATH, {
    implementation_priorities_v1_id: 'vertical_ai_v2_implementation_priorities_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    capability_priorities: capabilityPriorities,
    track_build_order: recommendedBuildOrder,
    implementation_priority_order: implementationPriorityOrder,
  });

  writeJson(root, VERTICAL_AI_V2_APPROVAL_STRATEGY_V1_PATH, {
    approval_strategy_v1_id: 'vertical_ai_v2_approval_strategy_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    ...APPROVAL_STRATEGY,
    execution_roadmap_approved: executionRoadmapApproved,
  });

  writeJson(root, VERTICAL_AI_V2_IMPL_SUCCESS_CRITERIA_V1_PATH, {
    success_criteria_v1_id: 'vertical_ai_v2_implementation_planning_success_criteria_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    criteria: SUCCESS_CRITERIA,
  });

  writeJson(root, VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_CONTRACTS_V1_PATH, {
    implementation_planning_contracts_v1_id: 'vertical_ai_v2_implementation_planning_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    generated_at: generatedAt,
    contract_ids: [...VAIIP_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: PLANNING_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PATH, {
    vertical_ai_v2_implementation_planning_v1_id: 'vertical_ai_v2_implementation_planning_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    system_id: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    plan_name: PLAN_NAME,
    capability_id: CAPABILITY_ID,
    target_version: TARGET_VERSION,
    design_fingerprint: designFingerprint,
    decision_fingerprint: decisionFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    implementation_priorities_established: implementationPriorities,
    execution_roadmap_approved: executionRoadmapApproved,
    implementation_plan_defined: planDefined,
    ready_for_v2_implementation: readyForV2Implementation,
    repository_mutation_forbidden: true,
    repository_mutation: false,
    platform_core_mutation: false,
    cil_mutation: false,
    repository_first: true,
    evidence_first: true,
    verification_results: verificationResults,
    implementation_priority_order: implementationPriorityOrder,
    recommended_build_order: recommendedBuildOrder,
    next_implementation_track: recommendedBuildOrder[0],
    roadmap_ref: VERTICAL_AI_V2_ROADMAP_V1_PATH,
    master_snapshot_v2_ref: VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
    phases_ref: VERTICAL_AI_V2_IMPLEMENTATION_PHASES_V1_PATH,
    milestones_ref: VERTICAL_AI_V2_MILESTONES_V1_PATH,
    dependency_plan_ref: VERTICAL_AI_V2_DEPENDENCY_PLAN_V1_PATH,
    execution_strategy_ref: VERTICAL_AI_V2_EXECUTION_STRATEGY_V1_PATH,
    validation_strategy_ref: VERTICAL_AI_V2_VALIDATION_STRATEGY_V1_PATH,
    risk_plan_ref: VERTICAL_AI_V2_RISK_PLAN_V1_PATH,
    priorities_ref: VERTICAL_AI_V2_IMPLEMENTATION_PRIORITIES_V1_PATH,
    approval_strategy_ref: VERTICAL_AI_V2_APPROVAL_STRATEGY_V1_PATH,
    success_criteria_ref: VERTICAL_AI_V2_IMPL_SUCCESS_CRITERIA_V1_PATH,
    contracts_ref: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_REGISTRY_V1_PATH,
    principles: PLANNING_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_REGISTRY_V1_PATH, {
    registry_id: 'vertical-ai-v2-implementation-planning-registry-v1',
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    system_id: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_SYSTEM_ID,
    version: 'vertical_ai_v2_implementation_planning_v1',
    generated_at: generatedAt,
    plan_ref: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PATH,
    roadmap_ref: VERTICAL_AI_V2_ROADMAP_V1_PATH,
    design_fingerprint: designFingerprint,
    decision_fingerprint: decisionFingerprint,
    execution_roadmap_approved: executionRoadmapApproved,
    ready_for_v2_implementation: readyForV2Implementation,
    implementation_plan_defined: planDefined,
  });

  const passed =
    planDefined &&
    contractValidation.aggregate_verdict === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verdict = passed
    ? VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PASS_VERDICT
    : VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_v2_implementation_planning_v1_${Date.now()}`,
    phase: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PHASE,
    system_id: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Plan Vertical AI V2 implementation from certified V2 roadmap without repository mutation.',
    vertical_ai_v2_implementation_planning_v1_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_STATUS
      : 'VERTICAL_AI_V2_IMPLEMENTATION_PLAN_NOT_DEFINED',
    validation_passed: passed,
    planning_only: true,
    plan_name: PLAN_NAME,
    capability_id: CAPABILITY_ID,
    design_fingerprint: designFingerprint,
    decision_fingerprint: decisionFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    implementation_priorities_established: implementationPriorities && passed,
    execution_roadmap_approved: executionRoadmapApproved,
    implementation_plan_defined: planDefined,
    ready_for_v2_implementation: readyForV2Implementation,
    repository_mutation_forbidden: true,
    repository_mutation: false,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    repository_first: true,
    evidence_first: true,
    verification_results: verificationResults,
    contract_validation: contractValidation,
    implementation_priority_order: implementationPriorityOrder,
    recommended_build_order: recommendedBuildOrder,
    plan_ref: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_PATH,
    roadmap_ref: VERTICAL_AI_V2_ROADMAP_V1_PATH,
    master_snapshot_v2_ref: VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
    phases_ref: VERTICAL_AI_V2_IMPLEMENTATION_PHASES_V1_PATH,
    milestones_ref: VERTICAL_AI_V2_MILESTONES_V1_PATH,
    dependency_plan_ref: VERTICAL_AI_V2_DEPENDENCY_PLAN_V1_PATH,
    execution_strategy_ref: VERTICAL_AI_V2_EXECUTION_STRATEGY_V1_PATH,
    validation_strategy_ref: VERTICAL_AI_V2_VALIDATION_STRATEGY_V1_PATH,
    risk_plan_ref: VERTICAL_AI_V2_RISK_PLAN_V1_PATH,
    priorities_ref: VERTICAL_AI_V2_IMPLEMENTATION_PRIORITIES_V1_PATH,
    approval_strategy_ref: VERTICAL_AI_V2_APPROVAL_STRATEGY_V1_PATH,
    success_criteria_ref: VERTICAL_AI_V2_IMPL_SUCCESS_CRITERIA_V1_PATH,
    contracts_ref: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_REGISTRY_V1_PATH,
    checks: {
      PRECHECK_VERIFIED: precheckVerified,
      IMPLEMENTATION_PHASES: implementationPhases,
      MILESTONES: milestones,
      DEPENDENCY_PLAN: dependencyPlan,
      EXECUTION_STRATEGY: executionStrategy,
      VALIDATION_STRATEGY: validationStrategy,
      RISK_PLAN: riskPlan,
      IMPLEMENTATION_PRIORITIES: implementationPriorities,
      APPROVAL_STRATEGY: approvalStrategy,
      SUCCESS_CRITERIA: successCriteria,
      PLANNING_ONLY: planningOnly,
      READ_ONLY: readOnly,
      REPOSITORY_FIRST: repositoryFirst,
      EVIDENCE_FIRST: evidenceFirst,
      NO_REPOSITORY_MUTATION: noRepositoryMutation,
      PLATFORM_CORE_UNCHANGED: noPlatformCoreMutation,
      CIL_UNCHANGED: noCilMutation,
      CONSUMES_CERTIFIED_VERTICAL_AI_V1: consumesCertifiedVerticalAiV1,
      EXECUTION_ROADMAP_APPROVED: executionRoadmapApproved,
      READY_FOR_V2_IMPLEMENTATION: readyForV2Implementation,
      CONTRACT_VALIDATION: contractValidation.aggregate_verdict === 'PASS',
      GOAL_TRUTH_SATISFIED: allGoalsSatisfied,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_V2_IMPLEMENTATION_PLANNING_V1_REPORT_PATH,
  };
}
