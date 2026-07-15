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
  VERTICAL_AI_FINAL_CERTIFICATION_V1_PASS_VERDICT,
  VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH,
  VERTICAL_AI_FINAL_CERTIFICATION_V1_REPORT_PATH,
  VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
  VERTICAL_AI_V1_MASTER_SNAPSHOT_FINGERPRINTS_V2_PATH,
} from './verticalAiFinalCertificationV1Engine.js';
import {
  VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
  VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
} from './verticalAiCompleteCertificationV1Engine.js';
import { VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH } from './verticalAiProductionOperationValidationV1Engine.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_V2_ROADMAP_V1_PHASE = 'PHASE-VAI-100' as const;
export const VERTICAL_AI_V2_ROADMAP_V1_SYSTEM_ID = 'VERTICAL_AI_V2_ROADMAP_V1' as const;
export const VERTICAL_AI_V2_ROADMAP_V1_PASS_VERDICT = 'PASS_VERTICAL_AI_V2_ROADMAP_V1' as const;
export const VERTICAL_AI_V2_ROADMAP_V1_FAIL_VERDICT = 'FAIL_VERTICAL_AI_V2_ROADMAP_V1' as const;
export const VERTICAL_AI_V2_ROADMAP_V1_STATUS = 'VERTICAL_AI_V2_ROADMAP_DEFINED' as const;

export const VERTICAL_AI_V2_ROADMAP_V1_DIR = 'datasets/vertical_ai_v2_roadmap_v1' as const;
export const VERTICAL_AI_V2_ROADMAP_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/vertical-ai-v2-roadmap-v1.json` as const;
export const VERTICAL_AI_V2_OBJECTIVES_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/v2-objectives-v1.json` as const;
export const VERTICAL_AI_V2_NEW_CAPABILITIES_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/new-capabilities-v1.json` as const;
export const VERTICAL_AI_V2_PRODUCTION_USE_CASES_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/production-use-cases-v1.json` as const;
export const VERTICAL_AI_V2_REPOSITORY_OPERATION_SCOPE_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/repository-operation-scope-v1.json` as const;
export const VERTICAL_AI_V2_CONSUMER_COLLABORATION_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/consumer-collaboration-v1.json` as const;
export const VERTICAL_AI_V2_ROADMAP_PHASES_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/roadmap-phases-v1.json` as const;
export const VERTICAL_AI_V2_SCOPE_DEFINITION_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/v2-scope-definition-v1.json` as const;
export const VERTICAL_AI_V2_MIGRATION_STRATEGY_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/migration-strategy-v1.json` as const;
export const VERTICAL_AI_V2_SUCCESS_CRITERIA_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/v2-success-criteria-v1.json` as const;
export const VERTICAL_AI_V2_ROADMAP_CONTRACTS_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/roadmap-contracts-v1.json` as const;
export const VERTICAL_AI_V2_ROADMAP_REGISTRY_V1_PATH =
  `${VERTICAL_AI_V2_ROADMAP_V1_DIR}/roadmap-registry-v1.json` as const;
export const VERTICAL_AI_V2_ROADMAP_V1_REPORT_PATH =
  'reports/vertical_ai/VERTICAL_AI_V2_ROADMAP_V1_REPORT.json' as const;

const ROADMAP_NAME = 'Evidence-Bound Vertical AI V2 Roadmap V1' as const;
const CAPABILITY_ID = 'vertical_ai' as const;
const TARGET_VERSION = 'vertical_ai_v2' as const;
const SOURCE_VERSION = 'vertical_ai_v1' as const;

export const VAIRMAP_CONTRACT_IDS = [
  'VAIRMAP_PRECHECK_VERIFIED',
  'VAIRMAP_V2_OBJECTIVES',
  'VAIRMAP_NEW_CAPABILITIES',
  'VAIRMAP_PRODUCTION_USE_CASES',
  'VAIRMAP_REPOSITORY_OPERATION_SCOPE',
  'VAIRMAP_CONSUMER_COLLABORATION',
  'VAIRMAP_ROADMAP',
  'VAIRMAP_V2_SCOPE_DEFINITION',
  'VAIRMAP_MIGRATION_STRATEGY',
  'VAIRMAP_V2_SUCCESS_CRITERIA',
  'VAIRMAP_PLANNING_ONLY',
  'VAIRMAP_READ_ONLY',
  'VAIRMAP_REFERENCE_ONLY',
  'VAIRMAP_NO_REPOSITORY_MUTATION',
  'VAIRMAP_NO_PLATFORM_CORE_MUTATION',
  'VAIRMAP_NO_CIL_MUTATION',
  'VAIRMAP_CONSUMES_CERTIFIED_VERTICAL_AI_V1',
  'VAIRMAP_READY_FOR_V2_IMPLEMENTATION_PLANNING',
] as const;

const VERIFICATION_CHECKS = [
  'v2_objectives',
  'new_capabilities',
  'production_use_cases',
  'repository_operation_scope',
  'consumer_collaboration',
  'roadmap',
  'v2_scope_definition',
  'migration_strategy',
  'v2_success_criteria',
] as const;

const PLANNING_PRINCIPLES = {
  planning_only: true,
  implementation: false,
  redesign: false,
  read_only: true,
  reference_only: true,
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

const V2_OBJECTIVES = [
  {
    objective_id: 'obj_additive_lifecycle_evolution',
    priority: 1,
    statement:
      'Evolve Vertical AI lifecycle layers additively without mutating frozen Vertical AI V1 master snapshots or Platform Core / CIL baselines.',
  },
  {
    objective_id: 'obj_deeper_repository_operations',
    priority: 2,
    statement:
      'Extend repository understanding, reuse, gap analysis, and human-approved planning into broader production repository operation scopes.',
  },
  {
    objective_id: 'obj_consumer_collaborative_operations',
    priority: 3,
    statement:
      'Enable multi-consumer collaboration through CIL while keeping reasoning owned by consumers and execution delegated to Agent Runtime.',
  },
  {
    objective_id: 'obj_certified_improvement_loops',
    priority: 4,
    statement:
      'Operationalize additive improvement candidates derived only from certified V1/V2 evidence with repository mutation still forbidden until explicit human approval.',
  },
  {
    objective_id: 'obj_traceability_and_reproducibility',
    priority: 5,
    statement:
      'Strengthen evidence-to-decision traceability and dual-run reproducibility across understanding through improvement.',
  },
] as const;

const NEW_CAPABILITIES = [
  {
    capability_id: 'cap_vai_v2_replaceable_runtime_modules',
    title: 'Replaceable runtime modules',
    description:
      'Swap alternative understanding/planning/execution/validation/certification/improvement modules behind stable V2 APIs without breaking V1 contracts.',
    inherits_from_v1: true,
    implementation_priority: 1,
  },
  {
    capability_id: 'cap_vai_v2_additive_improvement_candidates',
    title: 'Additive improvement candidates',
    description:
      'Select and rank improvement candidates from certified evidence only; candidates remain non-enacting until authorized.',
    inherits_from_v1: true,
    implementation_priority: 2,
  },
  {
    capability_id: 'cap_vai_v2_incremental_traceability',
    title: 'Incremental traceability extensions',
    description:
      'Extend evidence chains with finer-grained fingerprints across lifecycle stages and consumer collaboration sessions.',
    inherits_from_v1: true,
    implementation_priority: 3,
  },
  {
    capability_id: 'cap_vai_v2_multi_repo_operation_profiles',
    title: 'Multi-repository operation profiles',
    description:
      'Define scoped repository operation profiles for production pipelines while remaining reference-only until execute_authorized.',
    inherits_from_v1: false,
    implementation_priority: 4,
  },
  {
    capability_id: 'cap_vai_v2_consumer_session_orchestration',
    title: 'Consumer session orchestration',
    description:
      'Coordinate Cursor/Claude/ChatGPT/Gemini/MCP collaboration sessions through CIL with reproducible session fingerprints.',
    inherits_from_v1: false,
    implementation_priority: 5,
  },
] as const;

const PRODUCTION_USE_CASES = [
  {
    use_case_id: 'uc_ghibli_production_pipeline_ops',
    title: 'Ghibli production pipeline Vertical AI operations',
    goal_ref: 'goal_ghibli_production_pipeline',
    description:
      'Run understanding→planning→execution→validation→certification→improvement against the production pipeline repository surface without mutating Platform Core.',
  },
  {
    use_case_id: 'uc_production_runtime_alignment',
    title: 'Production runtime alignment operations',
    goal_ref: 'goal_production_runtime',
    description:
      'Align Vertical AI planning and validation with certified production runtime readiness using CIL connectors.',
  },
  {
    use_case_id: 'uc_project_brain_operational_queries',
    title: 'Project Brain operational query assist',
    goal_ref: 'goal_project_brain_operational',
    description:
      'Assist repository understanding and reuse decisions against Project Brain baselines as immutable reference evidence.',
  },
  {
    use_case_id: 'uc_repository_foundation_hardening',
    title: 'Repository foundation hardening assist',
    goal_ref: 'goal_repository_foundation',
    description:
      'Detect duplication/gaps and propose reuse-before-create plans with human approval gates before any write.',
  },
  {
    use_case_id: 'uc_semantic_quality_improvement',
    title: 'Semantic quality improvement loops',
    goal_ref: 'goal_semantic_quality',
    description:
      'Derive certified improvement candidates that improve semantic quality metrics without enacting repository mutations.',
  },
] as const;

const REPOSITORY_OPERATION_SCOPE = {
  mode: 'READ_ONLY_REFERENCE',
  in_scope: [
    'repository_surface_scan',
    'component_resolution',
    'reuse_before_create_analysis',
    'gap_detection',
    'planning_descriptor_generation',
    'human_approval_gate_simulation',
    'execution_dispatch_descriptor_only',
    'validation_and_certification_evidence',
    'improvement_candidate_selection',
  ],
  out_of_scope: [
    'platform_core_mutation',
    'cil_mutation',
    'vertical_ai_v1_master_snapshot_mutation',
    'unauthorized_repository_writes',
    'breaking_lifecycle_contract_changes_on_v1',
    'uncertified_evidence_improvement',
  ],
  mutation_policy: {
    repository_mutation_forbidden_by_default: true,
    human_approval_required_before_write: true,
    execute_authorized_required_for_enactment: true,
  },
  reference_baselines: [
    VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
    PROJECT_BRAIN_MASTER_SNAPSHOT_V1_PATH,
    CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
  ],
} as const;

const CONSUMER_COLLABORATION = {
  collaboration_mode: 'CIL_MEDIATED_REFERENCE_CONSUMERS',
  consumers: [
    { consumer_id: 'consumer.claude', role: 'reasoning_peer', snapshot_ref: CLAUDE_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
    { consumer_id: 'consumer.chatgpt', role: 'reasoning_peer', snapshot_ref: CHATGPT_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
    { consumer_id: 'consumer.gemini', role: 'reasoning_peer', snapshot_ref: GEMINI_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
    { consumer_id: 'consumer.cursor', role: 'primary_ide_operator', snapshot_ref: CURSOR_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
    { consumer_id: 'consumer.mcp', role: 'tool_protocol_peer', snapshot_ref: MCP_CONNECTOR_MASTER_SNAPSHOT_V1_PATH },
  ],
  rules: [
    'Consumers collaborate through CIL only; Vertical AI V2 does not own connector internals.',
    'Execution remains delegated to Agent Runtime; consumers own reasoning.',
    'Platform Core V1 and CIL V1 remain immutable references.',
    'Collaboration sessions must emit reproducible fingerprints for V2 validation.',
  ],
  cil_master_snapshot_ref: CONSUMER_INTEGRATION_MASTER_SNAPSHOT_V1_PATH,
} as const;

const ROADMAP_PHASES = [
  {
    phase_id: 'PHASE-VAI-201',
    track_id: 'v2_architecture_definition',
    priority: 1,
    title: 'Vertical AI V2 architecture definition',
    deliverable: 'Stable V2 architecture, component model, and API surfaces while V1 remains frozen.',
    entry_criteria: ['PASS_VERTICAL_AI_V2_ROADMAP_V1', 'planning_complete'],
    exit_criteria: ['V2 architecture artifacts frozen', 'V1 snapshots unchanged'],
  },
  {
    phase_id: 'PHASE-VAI-202',
    track_id: 'replaceable_runtime_modules',
    priority: 2,
    title: 'Replaceable runtime module contracts',
    deliverable: 'Module-replaceability contracts for each lifecycle runtime with dual-run equivalence tests.',
    entry_criteria: ['v2_architecture_definition PASS'],
    exit_criteria: ['Module contracts certified', 'Fingerprint stability proven'],
  },
  {
    phase_id: 'PHASE-VAI-203',
    track_id: 'repository_operation_profiles',
    priority: 3,
    title: 'Repository operation profile design',
    deliverable: 'Scoped production repository operation profiles with reuse/gap/approval gates.',
    entry_criteria: ['replaceable_runtime_modules PASS'],
    exit_criteria: ['Profiles defined', 'Mutation policy attested'],
  },
  {
    phase_id: 'PHASE-VAI-204',
    track_id: 'consumer_collaboration_sessions',
    priority: 4,
    title: 'Consumer collaboration session model',
    deliverable: 'CIL-mediated multi-consumer session orchestration design with evidence fingerprints.',
    entry_criteria: ['repository_operation_profiles PASS'],
    exit_criteria: ['Session model defined', 'Consumer snapshots unchanged'],
  },
  {
    phase_id: 'PHASE-VAI-205',
    track_id: 'additive_improvement_runtime',
    priority: 5,
    title: 'Additive improvement candidate runtime',
    deliverable: 'V2 improvement selection/ranking from certified evidence only, non-enacting by default.',
    entry_criteria: ['consumer_collaboration_sessions PASS'],
    exit_criteria: ['Candidates reproducible', 'Repository mutation forbidden'],
  },
  {
    phase_id: 'PHASE-VAI-206',
    track_id: 'v2_validation_and_certification',
    priority: 6,
    title: 'V2 validation and certification campaign',
    deliverable: 'Validation/certification campaign proving V2 additives without V1/PC/CIL drift.',
    entry_criteria: ['additive_improvement_runtime PASS'],
    exit_criteria: ['V2 certification PASS', 'Ready for V2 production operation validation'],
  },
] as const;

const V2_SCOPE_DEFINITION = {
  in_scope: [
    'Additive Vertical AI V2 lifecycle evolution',
    'Replaceable runtime modules behind stable APIs',
    'Incremental traceability extensions',
    'Repository operation profiles (read-only until authorized)',
    'CIL-mediated consumer collaboration sessions',
    'Certified-evidence-only improvement candidates',
  ],
  out_of_scope: [
    'Mutation of frozen Vertical AI V1 artifacts',
    'Platform Core V1 changes',
    'CIL V1 changes',
    'Breaking changes to V1 public lifecycle contracts',
    'Unauthorized repository writes',
    'Uncertified evidence improvement loops',
  ],
  frozen_v1_refs: [
    VERTICAL_AI_MASTER_SNAPSHOT_V1_PATH,
    VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
    VERTICAL_AI_COMPLETE_CERTIFICATION_V1_PATH,
    VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH,
    VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH,
  ],
  next_workstream: 'vertical_ai_v2_implementation_planning',
} as const;

const MIGRATION_STRATEGY = [
  {
    stage_id: 'mig_a_freeze_guard',
    title: 'Freeze guard',
    actions: [
      'Treat Vertical AI V1 / master snapshot v2 as immutable references.',
      'Reject any V2 work that mutates V1 fingerprints or PC/CIL baselines.',
    ],
  },
  {
    stage_id: 'mig_b_parallel_v2_surfaces',
    title: 'Parallel V2 surfaces',
    actions: [
      'Introduce V2 datasets/APIs alongside V1 without replacing V1 paths.',
      'Bind V2 design to certified V1 fingerprints for continuity evidence.',
    ],
  },
  {
    stage_id: 'mig_c_module_swap_equivalence',
    title: 'Module swap equivalence',
    actions: [
      'Prove replaceable modules dual-run equivalent on certified fixtures.',
      'Promote modules only after contract + reproducibility PASS.',
    ],
  },
  {
    stage_id: 'mig_d_ops_profile_rollout',
    title: 'Operation profile rollout',
    actions: [
      'Adopt repository operation profiles in planning-only mode first.',
      'Require human approval + execute_authorized before any enactment.',
    ],
  },
  {
    stage_id: 'mig_e_consumer_session_enablement',
    title: 'Consumer session enablement',
    actions: [
      'Enable CIL-mediated collaboration sessions using certified connectors.',
      'Keep connector master snapshots immutable during enablement.',
    ],
  },
  {
    stage_id: 'mig_f_v2_certification',
    title: 'V2 certification',
    actions: [
      'Run V2 validation/certification campaign.',
      'Freeze Vertical AI V2 master snapshot only after production operation readiness.',
    ],
  },
] as const;

const V2_SUCCESS_CRITERIA = [
  {
    criterion_id: 'sc_v2_scope_defined',
    statement: 'V2 scope, objectives, capabilities, use cases, and roadmap phases are defined and reproducible.',
  },
  {
    criterion_id: 'sc_implementation_priorities_established',
    statement: 'Roadmap phases and capability priorities establish ordered implementation planning entry.',
  },
  {
    criterion_id: 'sc_v1_frozen',
    statement: 'Certified Vertical AI V1 master snapshots remain immutable throughout V2 planning.',
  },
  {
    criterion_id: 'sc_pc_cil_unchanged',
    statement: 'Platform Core V1 and CIL V1 baselines remain unchanged.',
  },
  {
    criterion_id: 'sc_no_repo_mutation',
    statement: 'Repository mutation remains forbidden in planning; human approval required before any future write.',
  },
  {
    criterion_id: 'sc_ready_for_v2_implementation_planning',
    statement: 'Artifacts ready for Vertical AI V2 implementation planning workstream.',
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
  VERTICAL_AI_V1_MASTER_SNAPSHOT_FINGERPRINTS_V2_PATH,
  VERTICAL_AI_PRODUCTION_OPERATION_VALIDATION_V1_PATH,
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

function validateRoadmapContracts(input: Record<string, boolean>) {
  const map: Array<[string, string]> = [
    ['VAIRMAP_PRECHECK_VERIFIED', 'precheckVerified'],
    ['VAIRMAP_V2_OBJECTIVES', 'v2Objectives'],
    ['VAIRMAP_NEW_CAPABILITIES', 'newCapabilities'],
    ['VAIRMAP_PRODUCTION_USE_CASES', 'productionUseCases'],
    ['VAIRMAP_REPOSITORY_OPERATION_SCOPE', 'repositoryOperationScope'],
    ['VAIRMAP_CONSUMER_COLLABORATION', 'consumerCollaboration'],
    ['VAIRMAP_ROADMAP', 'roadmap'],
    ['VAIRMAP_V2_SCOPE_DEFINITION', 'v2ScopeDefinition'],
    ['VAIRMAP_MIGRATION_STRATEGY', 'migrationStrategy'],
    ['VAIRMAP_V2_SUCCESS_CRITERIA', 'v2SuccessCriteria'],
    ['VAIRMAP_PLANNING_ONLY', 'planningOnly'],
    ['VAIRMAP_READ_ONLY', 'readOnly'],
    ['VAIRMAP_REFERENCE_ONLY', 'referenceOnly'],
    ['VAIRMAP_NO_REPOSITORY_MUTATION', 'noRepositoryMutation'],
    ['VAIRMAP_NO_PLATFORM_CORE_MUTATION', 'noPlatformCoreMutation'],
    ['VAIRMAP_NO_CIL_MUTATION', 'noCilMutation'],
    ['VAIRMAP_CONSUMES_CERTIFIED_VERTICAL_AI_V1', 'consumesCertifiedVerticalAiV1'],
    ['VAIRMAP_READY_FOR_V2_IMPLEMENTATION_PLANNING', 'readyForV2ImplementationPlanning'],
  ];
  const results = map.map(([contractId, key]) => ({
    contract_id: contractId,
    verdict: input[key] ? 'PASS' : 'FAIL',
    evidence: `${key}=${input[key]}`,
  }));
  const pass = results.every((result) => result.verdict === 'PASS');
  return {
    contract_ids: [...VAIRMAP_CONTRACT_IDS],
    results,
    aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const),
  };
}

export function writeVerticalAiV2RoadmapV1EngineReport(): {
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
  const vaiV1BaselineBefore = captureBaselineMtimes(root, PROTECTED_VERTICAL_AI_V1_PATHS);

  const goalTruth = loadCurrentGoalTruth(root);
  const allGoalsSatisfied = goalTruth.satisfied_goals === goalTruth.evaluated_goals;
  if (!allGoalsSatisfied) {
    issues.push({
      code: 'GOAL_TRUTH',
      message: 'All Current Goal Truth entries must be satisfied for Vertical AI V2 roadmap',
      severity: 'error',
    });
  }

  const precheckVerified = phaseReportPassed(
    root,
    VERTICAL_AI_FINAL_CERTIFICATION_V1_REPORT_PATH,
    VERTICAL_AI_FINAL_CERTIFICATION_V1_PASS_VERDICT
  );
  if (!precheckVerified) {
    issues.push({
      code: 'PRECHECK_FAILED',
      message: `Precheck requires ${VERTICAL_AI_FINAL_CERTIFICATION_V1_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const finalCert = readJson<{
    vertical_ai_finalized?: boolean;
    ready_for_vertical_ai_v2?: boolean;
    snapshot_fingerprint?: string;
    decision_fingerprint?: string;
  }>(root, VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH);

  const masterSnapshotV2 = readJson<{
    immutable?: boolean;
    snapshot_fingerprint?: string;
    capability_id?: string;
    evolution_policy?: {
      next_evolution_version?: string;
      vertical_ai_v1_finalized?: boolean;
      allowed_on_v2?: string[];
    };
  }>(root, VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH);

  const consumesCertifiedVerticalAiV1 =
    precheckVerified &&
    finalCert?.vertical_ai_finalized === true &&
    finalCert?.ready_for_vertical_ai_v2 === true &&
    masterSnapshotV2?.immutable === true &&
    masterSnapshotV2?.capability_id === CAPABILITY_ID &&
    masterSnapshotV2?.evolution_policy?.next_evolution_version === TARGET_VERSION &&
    masterSnapshotV2?.evolution_policy?.vertical_ai_v1_finalized === true &&
    Array.isArray(masterSnapshotV2?.evolution_policy?.allowed_on_v2) &&
    (masterSnapshotV2?.evolution_policy?.allowed_on_v2?.length ?? 0) > 0;

  if (!consumesCertifiedVerticalAiV1) {
    issues.push({
      code: 'CERTIFIED_V1_NOT_BOUND',
      message: 'Certified Vertical AI V1 finalization and master snapshot v2 must be bound',
      severity: 'error',
    });
  }

  const goalRefs = new Set(
    Object.keys(
      (goalTruth as { goals?: Record<string, unknown> }).goals ??
        Object.fromEntries(
          ((goalTruth as { entries?: Array<{ goal_id: string }> }).entries ?? []).map((e) => [
            e.goal_id,
            true,
          ])
        )
    )
  );
  // Fallback: match goal refs from fingerprint string pattern used by prior engines
  const goalFingerprint = goalTruth.fingerprint ?? '';
  const productionUseCasesBound = PRODUCTION_USE_CASES.every(
    (uc) => goalFingerprint.includes(uc.goal_ref) || goalRefs.has(uc.goal_ref)
  );

  const v2Objectives = V2_OBJECTIVES.length >= 5 && V2_OBJECTIVES.every((o) => o.priority >= 1);
  const newCapabilities =
    NEW_CAPABILITIES.length >= 5 &&
    NEW_CAPABILITIES.every((c) => typeof c.implementation_priority === 'number') &&
    NEW_CAPABILITIES.some((c) => c.capability_id === 'cap_vai_v2_replaceable_runtime_modules') &&
    NEW_CAPABILITIES.some((c) => c.capability_id === 'cap_vai_v2_additive_improvement_candidates');
  const productionUseCases = PRODUCTION_USE_CASES.length >= 5 && productionUseCasesBound;
  const repositoryOperationScope =
    REPOSITORY_OPERATION_SCOPE.in_scope.length > 0 &&
    REPOSITORY_OPERATION_SCOPE.out_of_scope.length > 0 &&
    REPOSITORY_OPERATION_SCOPE.mutation_policy.repository_mutation_forbidden_by_default === true &&
    REPOSITORY_OPERATION_SCOPE.mutation_policy.human_approval_required_before_write === true;
  const consumerCollaboration =
    CONSUMER_COLLABORATION.consumers.length === 5 &&
    CONSUMER_COLLABORATION.consumers.every((c) => pathExists(root, c.snapshot_ref)) &&
    CONSUMER_COLLABORATION.rules.length >= 4;
  const roadmap =
    ROADMAP_PHASES.length >= 6 &&
    ROADMAP_PHASES.every((phase, index) => phase.priority === index + 1) &&
    ROADMAP_PHASES[0]?.track_id === 'v2_architecture_definition';
  const v2ScopeDefinition =
    V2_SCOPE_DEFINITION.in_scope.length > 0 &&
    V2_SCOPE_DEFINITION.out_of_scope.length > 0 &&
    V2_SCOPE_DEFINITION.frozen_v1_refs.every((rel) => pathExists(root, rel)) &&
    V2_SCOPE_DEFINITION.next_workstream === 'vertical_ai_v2_implementation_planning';
  const migrationStrategy =
    MIGRATION_STRATEGY.length >= 6 &&
    MIGRATION_STRATEGY[0]?.stage_id === 'mig_a_freeze_guard' &&
    MIGRATION_STRATEGY.every((stage) => stage.actions.length > 0);
  const v2SuccessCriteria =
    V2_SUCCESS_CRITERIA.length >= 6 &&
    V2_SUCCESS_CRITERIA.some((c) => c.criterion_id === 'sc_ready_for_v2_implementation_planning');

  if (!productionUseCases) {
    issues.push({
      code: 'PRODUCTION_USE_CASES',
      message: 'Production use cases must bind to Current Goal Truth refs',
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
  const vaiV1BaselineAfter = verifyBaselinePreserved(
    root,
    vaiV1BaselineBefore,
    PROTECTED_VERTICAL_AI_V1_PATHS
  );

  const baselineChecks: Array<[string, { preserved: boolean; drift: string[] }, string]> = [
    ['BRAIN_BASELINE_MUTATION', brainBaselineAfter, 'Project Brain baseline changed'],
    ['BUNDLE_BASELINE_MUTATION', bundleBaselineAfter, 'RIB baseline changed'],
    ['ACCESS_BASELINE_MUTATION', accessBaselineAfter, 'Access Layer baseline changed'],
    ['RUNTIME_BASELINE_MUTATION', runtimeBaselineAfter, 'Agent Runtime baseline changed'],
    ['CIL_BASELINE_MUTATION', cilBaselineAfter, 'CIL baseline changed'],
    ['CONNECTOR_BASELINE_MUTATION', connectorBaselineAfter, 'Certified connector baseline changed'],
    ['VERTICAL_AI_V1_BASELINE_MUTATION', vaiV1BaselineAfter, 'Certified Vertical AI V1 baseline changed'],
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
    PLANNING_PRINCIPLES.repository_mutation === false &&
    REPOSITORY_OPERATION_SCOPE.mutation_policy.repository_mutation_forbidden_by_default === true;

  const planningOnly =
    PLANNING_PRINCIPLES.planning_only === true && PLANNING_PRINCIPLES.implementation === false;
  const readOnly = PLANNING_PRINCIPLES.read_only === true;
  const referenceOnly = PLANNING_PRINCIPLES.reference_only === true;

  const verificationResults: Record<(typeof VERIFICATION_CHECKS)[number], boolean> = {
    v2_objectives: v2Objectives,
    new_capabilities: newCapabilities,
    production_use_cases: productionUseCases,
    repository_operation_scope: repositoryOperationScope,
    consumer_collaboration: consumerCollaboration,
    roadmap,
    v2_scope_definition: v2ScopeDefinition,
    migration_strategy: migrationStrategy,
    v2_success_criteria: v2SuccessCriteria,
  };
  const allVerificationPassed = VERIFICATION_CHECKS.every(
    (check) => verificationResults[check] === true
  );

  const designFingerprint = stableFingerprint({
    objectives: V2_OBJECTIVES,
    capabilities: NEW_CAPABILITIES,
    use_cases: PRODUCTION_USE_CASES,
    scope: V2_SCOPE_DEFINITION,
    operation_scope: REPOSITORY_OPERATION_SCOPE,
    collaboration: CONSUMER_COLLABORATION,
    phases: ROADMAP_PHASES,
    migration: MIGRATION_STRATEGY,
    success: V2_SUCCESS_CRITERIA,
    principles: PLANNING_PRINCIPLES,
  });

  const decisionFingerprint = stableFingerprint({
    goalTruth: goalTruth.fingerprint,
    designFingerprint,
    final_cert: finalCert?.decision_fingerprint ?? null,
    master_v2: masterSnapshotV2?.snapshot_fingerprint ?? null,
    mode: 'planning_only',
  });

  const implementationPriorities = [...NEW_CAPABILITIES]
    .sort((a, b) => a.implementation_priority - b.implementation_priority)
    .map((c) => c.capability_id);
  const recommendedBuildOrder = ROADMAP_PHASES.map((phase) => phase.track_id);

  const readyForV2ImplementationPlanning =
    precheckVerified &&
    allVerificationPassed &&
    consumesCertifiedVerticalAiV1 &&
    noPlatformCoreMutation &&
    noCilMutation &&
    noRepositoryMutation &&
    vaiV1BaselineAfter.preserved &&
    connectorBaselineAfter.preserved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const roadmapDefined = readyForV2ImplementationPlanning && allGoalsSatisfied;

  const contractValidation = validateRoadmapContracts({
    precheckVerified,
    v2Objectives,
    newCapabilities,
    productionUseCases,
    repositoryOperationScope,
    consumerCollaboration,
    roadmap,
    v2ScopeDefinition,
    migrationStrategy,
    v2SuccessCriteria,
    planningOnly,
    readOnly,
    referenceOnly,
    noRepositoryMutation,
    noPlatformCoreMutation,
    noCilMutation,
    consumesCertifiedVerticalAiV1,
    readyForV2ImplementationPlanning,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'ROADMAP_CONTRACT_FAILURE',
      message: 'One or more Vertical AI V2 roadmap contracts failed',
      severity: 'error',
    });
  }

  writeJson(root, VERTICAL_AI_V2_OBJECTIVES_V1_PATH, {
    v2_objectives_v1_id: 'vertical_ai_v2_objectives_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    objectives: V2_OBJECTIVES,
  });

  writeJson(root, VERTICAL_AI_V2_NEW_CAPABILITIES_V1_PATH, {
    new_capabilities_v1_id: 'vertical_ai_v2_new_capabilities_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    capabilities: NEW_CAPABILITIES,
    implementation_priorities: implementationPriorities,
  });

  writeJson(root, VERTICAL_AI_V2_PRODUCTION_USE_CASES_V1_PATH, {
    production_use_cases_v1_id: 'vertical_ai_v2_production_use_cases_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    use_cases: PRODUCTION_USE_CASES,
  });

  writeJson(root, VERTICAL_AI_V2_REPOSITORY_OPERATION_SCOPE_V1_PATH, {
    repository_operation_scope_v1_id: 'vertical_ai_v2_repository_operation_scope_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    ...REPOSITORY_OPERATION_SCOPE,
  });

  writeJson(root, VERTICAL_AI_V2_CONSUMER_COLLABORATION_V1_PATH, {
    consumer_collaboration_v1_id: 'vertical_ai_v2_consumer_collaboration_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    ...CONSUMER_COLLABORATION,
  });

  writeJson(root, VERTICAL_AI_V2_ROADMAP_PHASES_V1_PATH, {
    roadmap_phases_v1_id: 'vertical_ai_v2_roadmap_phases_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    phases: ROADMAP_PHASES,
    recommended_build_order: recommendedBuildOrder,
    next_implementation_track: recommendedBuildOrder[0],
  });

  writeJson(root, VERTICAL_AI_V2_SCOPE_DEFINITION_V1_PATH, {
    v2_scope_definition_v1_id: 'vertical_ai_v2_scope_definition_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    source_version: SOURCE_VERSION,
    target_version: TARGET_VERSION,
    ...V2_SCOPE_DEFINITION,
  });

  writeJson(root, VERTICAL_AI_V2_MIGRATION_STRATEGY_V1_PATH, {
    migration_strategy_v1_id: 'vertical_ai_v2_migration_strategy_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    stages: MIGRATION_STRATEGY,
  });

  writeJson(root, VERTICAL_AI_V2_SUCCESS_CRITERIA_V1_PATH, {
    v2_success_criteria_v1_id: 'vertical_ai_v2_success_criteria_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    criteria: V2_SUCCESS_CRITERIA,
  });

  writeJson(root, VERTICAL_AI_V2_ROADMAP_CONTRACTS_V1_PATH, {
    roadmap_contracts_v1_id: 'vertical_ai_v2_roadmap_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    generated_at: generatedAt,
    contract_ids: [...VAIRMAP_CONTRACT_IDS],
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
    principles: PLANNING_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_V2_ROADMAP_V1_PATH, {
    vertical_ai_v2_roadmap_v1_id: 'vertical_ai_v2_roadmap_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    system_id: VERTICAL_AI_V2_ROADMAP_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    planning_only: true,
    roadmap_name: ROADMAP_NAME,
    capability_id: CAPABILITY_ID,
    source_version: SOURCE_VERSION,
    target_version: TARGET_VERSION,
    design_fingerprint: designFingerprint,
    decision_fingerprint: decisionFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    v2_scope_defined: v2ScopeDefinition,
    implementation_priorities_established: newCapabilities && roadmap,
    roadmap_defined: roadmapDefined,
    ready_for_v2_implementation_planning: readyForV2ImplementationPlanning,
    repository_mutation_forbidden: true,
    repository_mutation: false,
    platform_core_mutation: false,
    cil_mutation: false,
    verification_results: verificationResults,
    implementation_priorities: implementationPriorities,
    recommended_build_order: recommendedBuildOrder,
    final_certification_ref: VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH,
    master_snapshot_v2_ref: VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
    objectives_ref: VERTICAL_AI_V2_OBJECTIVES_V1_PATH,
    capabilities_ref: VERTICAL_AI_V2_NEW_CAPABILITIES_V1_PATH,
    use_cases_ref: VERTICAL_AI_V2_PRODUCTION_USE_CASES_V1_PATH,
    operation_scope_ref: VERTICAL_AI_V2_REPOSITORY_OPERATION_SCOPE_V1_PATH,
    collaboration_ref: VERTICAL_AI_V2_CONSUMER_COLLABORATION_V1_PATH,
    phases_ref: VERTICAL_AI_V2_ROADMAP_PHASES_V1_PATH,
    scope_ref: VERTICAL_AI_V2_SCOPE_DEFINITION_V1_PATH,
    migration_ref: VERTICAL_AI_V2_MIGRATION_STRATEGY_V1_PATH,
    success_criteria_ref: VERTICAL_AI_V2_SUCCESS_CRITERIA_V1_PATH,
    contracts_ref: VERTICAL_AI_V2_ROADMAP_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_V2_ROADMAP_REGISTRY_V1_PATH,
    principles: PLANNING_PRINCIPLES,
  });

  writeJson(root, VERTICAL_AI_V2_ROADMAP_REGISTRY_V1_PATH, {
    registry_id: 'vertical-ai-v2-roadmap-registry-v1',
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    system_id: VERTICAL_AI_V2_ROADMAP_V1_SYSTEM_ID,
    version: 'vertical_ai_v2_roadmap_v1',
    generated_at: generatedAt,
    roadmap_ref: VERTICAL_AI_V2_ROADMAP_V1_PATH,
    final_certification_ref: VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH,
    master_snapshot_v2_ref: VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
    design_fingerprint: designFingerprint,
    decision_fingerprint: decisionFingerprint,
    ready_for_v2_implementation_planning: readyForV2ImplementationPlanning,
    roadmap_defined: roadmapDefined,
  });

  const passed =
    roadmapDefined &&
    contractValidation.aggregate_verdict === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verdict = passed
    ? VERTICAL_AI_V2_ROADMAP_V1_PASS_VERDICT
    : VERTICAL_AI_V2_ROADMAP_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_v2_roadmap_v1_${Date.now()}`,
    phase: VERTICAL_AI_V2_ROADMAP_V1_PHASE,
    system_id: VERTICAL_AI_V2_ROADMAP_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Design Vertical AI V2 roadmap from certified Vertical AI V1 without repository mutation.',
    vertical_ai_v2_roadmap_v1_passed: passed,
    final_verdict: verdict,
    status: passed ? VERTICAL_AI_V2_ROADMAP_V1_STATUS : 'VERTICAL_AI_V2_ROADMAP_NOT_DEFINED',
    validation_passed: passed,
    planning_only: true,
    roadmap_name: ROADMAP_NAME,
    capability_id: CAPABILITY_ID,
    design_fingerprint: designFingerprint,
    decision_fingerprint: decisionFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    v2_scope_defined: v2ScopeDefinition && passed,
    implementation_priorities_established: newCapabilities && roadmap && passed,
    roadmap_defined: roadmapDefined,
    ready_for_v2_implementation_planning: readyForV2ImplementationPlanning,
    repository_mutation_forbidden: true,
    repository_mutation: false,
    platform_core_unchanged: noPlatformCoreMutation,
    cil_unchanged: noCilMutation,
    verification_results: verificationResults,
    contract_validation: contractValidation,
    implementation_priorities: implementationPriorities,
    recommended_build_order: recommendedBuildOrder,
    roadmap_ref: VERTICAL_AI_V2_ROADMAP_V1_PATH,
    final_certification_ref: VERTICAL_AI_FINAL_CERTIFICATION_V1_PATH,
    master_snapshot_v2_ref: VERTICAL_AI_V1_MASTER_SNAPSHOT_V2_PATH,
    objectives_ref: VERTICAL_AI_V2_OBJECTIVES_V1_PATH,
    capabilities_ref: VERTICAL_AI_V2_NEW_CAPABILITIES_V1_PATH,
    use_cases_ref: VERTICAL_AI_V2_PRODUCTION_USE_CASES_V1_PATH,
    operation_scope_ref: VERTICAL_AI_V2_REPOSITORY_OPERATION_SCOPE_V1_PATH,
    collaboration_ref: VERTICAL_AI_V2_CONSUMER_COLLABORATION_V1_PATH,
    phases_ref: VERTICAL_AI_V2_ROADMAP_PHASES_V1_PATH,
    scope_ref: VERTICAL_AI_V2_SCOPE_DEFINITION_V1_PATH,
    migration_ref: VERTICAL_AI_V2_MIGRATION_STRATEGY_V1_PATH,
    success_criteria_ref: VERTICAL_AI_V2_SUCCESS_CRITERIA_V1_PATH,
    contracts_ref: VERTICAL_AI_V2_ROADMAP_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_V2_ROADMAP_REGISTRY_V1_PATH,
    checks: {
      PRECHECK_VERIFIED: precheckVerified,
      V2_OBJECTIVES: v2Objectives,
      NEW_CAPABILITIES: newCapabilities,
      PRODUCTION_USE_CASES: productionUseCases,
      REPOSITORY_OPERATION_SCOPE: repositoryOperationScope,
      CONSUMER_COLLABORATION: consumerCollaboration,
      ROADMAP: roadmap,
      V2_SCOPE_DEFINITION: v2ScopeDefinition,
      MIGRATION_STRATEGY: migrationStrategy,
      V2_SUCCESS_CRITERIA: v2SuccessCriteria,
      PLANNING_ONLY: planningOnly,
      READ_ONLY: readOnly,
      REFERENCE_ONLY: referenceOnly,
      NO_REPOSITORY_MUTATION: noRepositoryMutation,
      PLATFORM_CORE_UNCHANGED: noPlatformCoreMutation,
      CIL_UNCHANGED: noCilMutation,
      CONSUMES_CERTIFIED_VERTICAL_AI_V1: consumesCertifiedVerticalAiV1,
      READY_FOR_V2_IMPLEMENTATION_PLANNING: readyForV2ImplementationPlanning,
      CONTRACT_VALIDATION: contractValidation.aggregate_verdict === 'PASS',
      GOAL_TRUTH_SATISFIED: allGoalsSatisfied,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_V2_ROADMAP_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_V2_ROADMAP_V1_REPORT_PATH,
  };
}
