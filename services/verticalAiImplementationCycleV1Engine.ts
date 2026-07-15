import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_BRAIN_ARCHITECTURE_VERSION } from './projectBrainFoundationV1.js';
import {
  PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH,
  PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
  PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH,
} from './projectBrainWaveDDevelopmentPluginsV1.js';
import { PROJECT_BRAIN_LPM_V1_PATH } from './projectBrainWaveBLpmMaterializationV1Engine.js';
import {
  PROJECT_BRAIN_SYNC_V1_PASS_VERDICT,
  PROJECT_BRAIN_SYNC_V1_REPORT_PATH,
  writeProjectBrainSyncV1EngineReport,
} from './projectBrainSyncV1Engine.js';
import {
  STAGE7_ROADMAP_V1_PATH,
} from './stage7BootstrapV1Engine.js';
import {
  VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
  VERTICAL_AI_DEVELOPMENT_V1_PASS_VERDICT,
  VERTICAL_AI_DEVELOPMENT_V1_REPORT_PATH,
  VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH,
  VERTICAL_AI_DECISION_V1_PATH,
  VERTICAL_AI_PROJECT_UNDERSTANDING_V1_PATH,
  loadCurrentGoalTruth,
} from './verticalAiDevelopmentV1Engine.js';
import {
  VERTICAL_AI_IMPLEMENTATION_V1_PASS_VERDICT,
  writeVerticalAiImplementationV1EngineReport,
} from './verticalAiImplementationV1Engine.js';
import { captureCycleSnapshot } from './implementationCycleV1Engine.js';
import {
  PROJECT_BRAIN_OPERATIONAL_BASELINE_V1_PATH,
  PROJECT_BRAIN_V1_FREEZE_V1_PATH,
} from './projectBrainOperationModeActivationV1Engine.js';
import {
  selectHighestValueVerticalAiImplementation,
  materializeVerifiedRepositoryTruthForVerticalAiSelection,
  type VerticalAiDiscoveryInput,
} from './verticalAiImplementationSelectionV1.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE =
  'PHASE-VERTICAL-AI-IMPLEMENTATION-CYCLE-V1' as const;
export const VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_SYSTEM_ID =
  'VERTICAL_AI_IMPLEMENTATION_CYCLE_V1' as const;
export const VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PASS_VERDICT =
  VERTICAL_AI_IMPLEMENTATION_V1_PASS_VERDICT;
export const VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_IMPLEMENTATION_CYCLE_V1' as const;
export const VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_STATUS =
  'VERTICAL_AI_IMPLEMENTATION_CYCLE_COMPLETE' as const;
export const VERTICAL_AI_IMPLEMENTATION_CYCLE_WATCH_STATUS =
  'VERTICAL_AI_IMPLEMENTATION_CYCLE_WATCH' as const;

export const VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR =
  'datasets/stage7/vertical_ai_implementation_cycle_v1' as const;
export const VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-implementation-cycle-v1.json` as const;
export const VERTICAL_AI_REPOSITORY_TRUTH_REFRESH_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-repository-truth-refresh-v1.json` as const;
export const VERTICAL_AI_PROJECT_TRUTH_REFRESH_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-project-truth-refresh-v1.json` as const;
export const VERTICAL_AI_ACTIVE_GOAL_RESOLUTION_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-active-goal-resolution-v1.json` as const;
export const VERTICAL_AI_OPERATIONAL_CONSTRAINTS_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-operational-constraints-v1.json` as const;
export const VERTICAL_AI_DEVELOPMENT_INTELLIGENCE_READ_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-development-intelligence-read-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_CYCLE_TRIGGER_SNAPSHOT_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-implementation-cycle-trigger-snapshot-v1.json` as const;
export const VERTICAL_AI_BRAIN_ASSIST_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-brain-assist-v1.json` as const;
export const VERTICAL_AI_SELECTED_IMPLEMENTATION_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-selected-implementation-v1.json` as const;
export const VERTICAL_AI_BRAIN_SYNC_CONFIRMATION_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-brain-sync-confirmation-v1.json` as const;
export const VERTICAL_AI_REPOSITORY_EVALUATION_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-repository-evaluation-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_CYCLE_WORKFLOW_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-implementation-cycle-workflow-v1.json` as const;
export const VERTICAL_AI_REPOSITORY_TRUTH_MATERIALIZATION_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-repository-truth-materialization-v1.json` as const;
export const VERTICAL_AI_CANDIDATE_DISCOVERY_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-candidate-discovery-v1.json` as const;
export const VERTICAL_AI_CANDIDATE_EVALUATION_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-candidate-evaluation-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_CYCLE_WATCH_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-implementation-cycle-watch-v1.json` as const;
export const VERTICAL_AI_CYCLE_DECISION_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_DIR}/vertical-ai-cycle-decision-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_REPORT_PATH =
  'reports/stage7/VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_REPORT.json' as const;

export const VERTICAL_AI_IMPLEMENTATION_CYCLE_WORKFLOW_STEPS = [
  'repository_truth_refresh',
  'project_truth_refresh',
  'brain_sync',
  'goal_truth_resolution',
  'operational_constraints',
  'development_intelligence_read',
  'repository_truth_materialization',
  'candidate_discovery',
  'candidate_evaluation',
  'watch_idle',
  'implementation_execution',
  'validation',
  'lpm_update',
  'brain_resync',
  'watch',
] as const;

const PROJECT_ENTITY_EXTRACTION_V1_PATH =
  'datasets/repository_intelligence/project-entity-extraction-v1.json' as const;

const EXECUTION_FLAGS = {
  vertical_ai_implementation_cycle_v1: true as const,
  project_brain_assisted: true as const,
  read_only_brain: true as const,
  brain_modification: false as const,
  architecture_changes: false as const,
  execute_authorized: false as const,
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function loadPriorCycleSnapshot(
  root: string
): ReturnType<typeof captureCycleSnapshot> | null {
  if (!fs.existsSync(path.join(root, VERTICAL_AI_IMPLEMENTATION_CYCLE_TRIGGER_SNAPSHOT_V1_PATH))) {
    return null;
  }
  return readJson(root, VERTICAL_AI_IMPLEMENTATION_CYCLE_TRIGGER_SNAPSHOT_V1_PATH);
}

function shouldRefreshRepositoryTruth(
  root: string,
  currentSnapshot: ReturnType<typeof captureCycleSnapshot>,
  priorSnapshot: ReturnType<typeof captureCycleSnapshot> | null
): { required: boolean; reason: string | null } {
  if (!fs.existsSync(path.join(root, PROJECT_ENTITY_EXTRACTION_V1_PATH))) {
    return { required: true, reason: 'inventory_v1_missing' };
  }
  if (!priorSnapshot) {
    return { required: true, reason: 'prior_cycle_snapshot_missing' };
  }
  if (currentSnapshot.entity_count !== priorSnapshot.entity_count) {
    return { required: true, reason: 'entity_count_changed' };
  }
  if (currentSnapshot.gap_report_id !== priorSnapshot.gap_report_id) {
    return { required: true, reason: 'gap_report_changed' };
  }
  return { required: false, reason: null };
}

function computeDecisionFingerprint(input: {
  repositoryTruthFingerprint: string;
  projectTruthFingerprint: string;
  goalTruthFingerprint: string;
  operationalConstraintsFingerprint: string;
  developmentPlanId: string | null;
  candidateVerdicts: string;
}): string {
  return [
    `repository=${input.repositoryTruthFingerprint}`,
    `project=${input.projectTruthFingerprint}`,
    `goal=${input.goalTruthFingerprint}`,
    `constraints=${input.operationalConstraintsFingerprint}`,
    `dev_plan=${input.developmentPlanId ?? 'none'}`,
    `candidates=${input.candidateVerdicts}`,
  ].join('|');
}

function loadOperationalConstraints(root: string) {
  const v1Freeze = fs.existsSync(path.join(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH))
    ? readJson<{ verdict: string; change_policy: string }>(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH)
    : null;
  const operationalBaseline = fs.existsSync(
    path.join(root, PROJECT_BRAIN_OPERATIONAL_BASELINE_V1_PATH)
  )
    ? readJson<{ synchronized_at?: string }>(root, PROJECT_BRAIN_OPERATIONAL_BASELINE_V1_PATH)
    : null;

  const constraints = {
    project_brain_frozen: v1Freeze?.verdict === 'PASS_PROJECT_BRAIN_V1_FROZEN',
    brain_modification: false,
    architecture_changes: false,
    read_only_brain: true,
    manual_phase_selection: false,
    execute_authorized: false,
    change_policy: v1Freeze?.change_policy ?? null,
    operational_baseline_ref: PROJECT_BRAIN_OPERATIONAL_BASELINE_V1_PATH,
    operational_baseline_synchronized_at: operationalBaseline?.synchronized_at ?? null,
  };

  const fingerprint = [
    `frozen=${constraints.project_brain_frozen}`,
    `brain_mod=${constraints.brain_modification}`,
    `arch=${constraints.architecture_changes}`,
    `manual=${constraints.manual_phase_selection}`,
    `exec=${constraints.execute_authorized}`,
  ].join(':');

  return { constraints, fingerprint, respected: constraints.project_brain_frozen === true };
}

function evaluateCurrentRepository(
  root: string,
  candidateEvaluations: Array<{ candidate_id: string; verdict: string | null; satisfied: boolean }>
) {
  const lpm = readJson<{
    entities: unknown[];
    capabilities: unknown[];
    knowledge: unknown[];
  }>(root, PROJECT_BRAIN_LPM_V1_PATH);

  const gapAnalysis = readJson<{
    gap_analysis_report: {
      gaps: Array<{ severity: string }>;
      development_candidates: unknown[];
    };
  }>(root, PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH);

  const pendingCandidates = candidateEvaluations.filter((c) => !c.satisfied);
  const satisfiedCandidates = candidateEvaluations.filter((c) => c.satisfied);

  return {
    entity_count: lpm.entities.length,
    capability_count: lpm.capabilities.length,
    knowledge_count: lpm.knowledge.length,
    inventory_v1_ref: PROJECT_ENTITY_EXTRACTION_V1_PATH,
    inventory_v1_exists: fs.existsSync(path.join(root, PROJECT_ENTITY_EXTRACTION_V1_PATH)),
    gap_count: gapAnalysis.gap_analysis_report.gaps.length,
    high_gap_count: gapAnalysis.gap_analysis_report.gaps.filter(
      (g) => g.severity === 'high' || g.severity === 'critical'
    ).length,
    development_candidate_count: gapAnalysis.gap_analysis_report.development_candidates.length,
    vertical_ai_candidate_count: candidateEvaluations.length,
    vertical_ai_pending_count: pendingCandidates.length,
    vertical_ai_satisfied_count: satisfiedCandidates.length,
    pending_candidate_ids: pendingCandidates.map((c) => c.candidate_id),
    satisfied_candidate_ids: satisfiedCandidates.map((c) => c.candidate_id),
    evidence_based_selection_ready: pendingCandidates.length > 0,
  };
}

export function writeVerticalAiImplementationCycleV1EngineReport(): {
  passed: boolean;
  verdict: string;
  reportPath: string;
  implementationVerdict: string | null;
  selectedCandidateId: string | null;
} {
  const root = resolveProjectRoot();
  const generatedAt = new Date().toISOString();
  const issues: Array<{ code: string; message: string; severity: string }> = [];

  const developmentReport = fs.existsSync(path.join(root, VERTICAL_AI_DEVELOPMENT_V1_REPORT_PATH))
    ? readJson<{ final_verdict: string; vertical_ai_development_v1_passed: boolean }>(
        root,
        VERTICAL_AI_DEVELOPMENT_V1_REPORT_PATH
      )
    : null;

  const precheckPassed =
    developmentReport?.final_verdict === VERTICAL_AI_DEVELOPMENT_V1_PASS_VERDICT &&
    developmentReport?.vertical_ai_development_v1_passed === true &&
    fs.existsSync(path.join(root, PROJECT_BRAIN_LPM_V1_PATH));

  if (!precheckPassed) {
    issues.push({
      code: 'PREREQ',
      message: 'Vertical AI development PASS and LPM required',
      severity: 'error',
    });
  }

  let syncPassed = false;
  let syncVerdict: string | null = null;
  let postSyncPassed = false;
  let postSyncVerdict: string | null = null;
  let goalTruth: ReturnType<typeof loadCurrentGoalTruth> | null = null;
  let selection: ReturnType<typeof selectHighestValueVerticalAiImplementation> | null = null;
  let repositoryEvaluation: ReturnType<typeof evaluateCurrentRepository> | null = null;
  let operationalConstraints: ReturnType<typeof loadOperationalConstraints> | null = null;
  let developmentIntelligenceRead: {
    read_only: boolean;
    development_plan_id: string | null;
    development_candidate_count: number;
    top_candidate_ids: string[];
  } | null = null;
  let repositoryTruthMaterialization: ReturnType<
    typeof materializeVerifiedRepositoryTruthForVerticalAiSelection
  > | null = null;
  let decisionFingerprint: string | null = null;
  let repositoryTruthRefreshRequired = false;
  let implementationResult: ReturnType<typeof writeVerticalAiImplementationV1EngineReport> | null =
    null;
  let watchWithoutMutation = false;
  let workflowStep = 'repository_truth_refresh';
  const completedSteps: string[] = [];

  if (precheckPassed) {
    const currentSnapshot = captureCycleSnapshot(root);
    const priorSnapshot = loadPriorCycleSnapshot(root);
    const repositoryTruthDecision = shouldRefreshRepositoryTruth(
      root,
      currentSnapshot,
      priorSnapshot
    );
    repositoryTruthRefreshRequired = repositoryTruthDecision.required;

    const repositoryTruthFingerprint = [
      `inventory=${fs.existsSync(path.join(root, PROJECT_ENTITY_EXTRACTION_V1_PATH))}`,
      `entities=${currentSnapshot.entity_count}`,
      `gap=${currentSnapshot.gap_report_id}`,
    ].join(':');

    writeJson(root, VERTICAL_AI_REPOSITORY_TRUTH_REFRESH_V1_PATH, {
      vertical_ai_repository_truth_refresh_v1_id: 'vertical_ai_repository_truth_refresh_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      refresh_required: repositoryTruthRefreshRequired,
      refresh_reason: repositoryTruthDecision.reason,
      inventory_v1_ref: PROJECT_ENTITY_EXTRACTION_V1_PATH,
      inventory_v1_exists: fs.existsSync(path.join(root, PROJECT_ENTITY_EXTRACTION_V1_PATH)),
      current_snapshot: currentSnapshot,
      prior_snapshot_ref: priorSnapshot
        ? VERTICAL_AI_IMPLEMENTATION_CYCLE_TRIGGER_SNAPSHOT_V1_PATH
        : null,
      repository_truth_fingerprint: repositoryTruthFingerprint,
    });
    completedSteps.push('repository_truth_refresh');
    workflowStep = 'project_truth_refresh';

    const preSyncGoalFingerprint = loadCurrentGoalTruth(root).fingerprint;
    const projectTruthFingerprint = [
      `goal=${preSyncGoalFingerprint}`,
      `lpm=${currentSnapshot.entity_count}`,
      `gap=${currentSnapshot.gap_report_id}`,
    ].join(':');

    writeJson(root, VERTICAL_AI_PROJECT_TRUTH_REFRESH_V1_PATH, {
      vertical_ai_project_truth_refresh_v1_id: 'vertical_ai_project_truth_refresh_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      pre_sync_goal_fingerprint: preSyncGoalFingerprint,
      project_truth_fingerprint: projectTruthFingerprint,
      living_project_model_ref: PROJECT_BRAIN_LPM_V1_PATH,
      goal_model_ref: PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
      gap_analysis_ref: PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH,
      development_intelligence_ref: PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH,
      truth_refresh_trigger: 'implementation_cycle_v1',
    });
    completedSteps.push('project_truth_refresh');
    workflowStep = 'brain_sync';

    const syncResult = writeProjectBrainSyncV1EngineReport();
    syncPassed = syncResult.passed;
    syncVerdict = syncResult.verdict;

    writeJson(root, VERTICAL_AI_BRAIN_SYNC_CONFIRMATION_V1_PATH, {
      vertical_ai_brain_sync_confirmation_v1_id: 'vertical_ai_brain_sync_confirmation_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      sync_report_ref: PROJECT_BRAIN_SYNC_V1_REPORT_PATH,
      sync_verdict: syncVerdict,
      synchronized: syncPassed,
      living_project_model_ref: PROJECT_BRAIN_LPM_V1_PATH,
      goal_model_ref: PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
      gap_analysis_ref: PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH,
      development_intelligence_ref: PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH,
    });
    completedSteps.push('brain_sync');
    workflowStep = 'goal_truth_resolution';

    if (!syncPassed || syncVerdict !== PROJECT_BRAIN_SYNC_V1_PASS_VERDICT) {
      issues.push({
        code: 'BRAIN_SYNC',
        message: 'Project Brain sync required before goal truth resolution',
        severity: 'error',
      });
    }

    goalTruth = loadCurrentGoalTruth(root);

    writeJson(root, VERTICAL_AI_ACTIVE_GOAL_RESOLUTION_V1_PATH, {
      vertical_ai_active_goal_resolution_v1_id: 'vertical_ai_active_goal_resolution_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      goal_model_ref: PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
      goal_truth: goalTruth,
      active_goals: goalTruth.entries.filter((entry) => entry.satisfied).length,
      evaluated_goals: goalTruth.evaluated_goals,
    });
    completedSteps.push('goal_truth_resolution');
    workflowStep = 'operational_constraints';

    operationalConstraints = loadOperationalConstraints(root);
    writeJson(root, VERTICAL_AI_OPERATIONAL_CONSTRAINTS_V1_PATH, {
      vertical_ai_operational_constraints_v1_id: 'vertical_ai_operational_constraints_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      ...operationalConstraints.constraints,
      constraints_fingerprint: operationalConstraints.fingerprint,
      constraints_respected: operationalConstraints.respected,
      v1_freeze_ref: PROJECT_BRAIN_V1_FREEZE_V1_PATH,
    });
    completedSteps.push('operational_constraints');
    workflowStep = 'development_intelligence_read';

    if (!operationalConstraints.respected) {
      issues.push({
        code: 'OPERATIONAL_CONSTRAINTS',
        message: 'Project Brain frozen operational constraints must be respected',
        severity: 'error',
      });
    }

    const gapAnalysis = readJson<{
      gap_analysis_report: {
        gaps: Array<{ severity: string; rule_id: string }>;
        development_candidates: Array<{
          candidate_id: string;
          title: string;
          priority: string;
          confidence: number;
        }>;
      };
    }>(root, PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH);

    const devIntel = fs.existsSync(path.join(root, PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH))
      ? readJson<{
          development_plan: { plan_id: string };
          development_intelligence_v1_id: string;
        }>(root, PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH)
      : null;

    developmentIntelligenceRead = {
      read_only: true,
      development_plan_id: devIntel?.development_plan.plan_id ?? null,
      development_candidate_count: gapAnalysis.gap_analysis_report.development_candidates.length,
      top_candidate_ids: gapAnalysis.gap_analysis_report.development_candidates
        .slice(0, 5)
        .map((candidate) => candidate.candidate_id),
    };

    writeJson(root, VERTICAL_AI_DEVELOPMENT_INTELLIGENCE_READ_V1_PATH, {
      vertical_ai_development_intelligence_read_v1_id:
        'vertical_ai_development_intelligence_read_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      read_only: true,
      brain_modification: false,
      development_intelligence_ref: PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH,
      ...developmentIntelligenceRead,
    });
    completedSteps.push('development_intelligence_read');
    workflowStep = 'repository_truth_materialization';

    if (!devIntel) {
      issues.push({
        code: 'DEVELOPMENT_INTELLIGENCE',
        message: 'Development Intelligence artifact required for read-only assist',
        severity: 'error',
      });
    }

    repositoryTruthMaterialization =
      materializeVerifiedRepositoryTruthForVerticalAiSelection(root);

    writeJson(root, VERTICAL_AI_REPOSITORY_TRUTH_MATERIALIZATION_V1_PATH, {
      vertical_ai_repository_truth_materialization_v1_id:
        'vertical_ai_repository_truth_materialization_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      materialized_count: repositoryTruthMaterialization.materialized_count,
      materialization_fingerprint: repositoryTruthMaterialization.fingerprint,
      candidate_completions: repositoryTruthMaterialization.entries,
      repository_truth_fingerprint: repositoryTruthFingerprint,
    });
    completedSteps.push('repository_truth_materialization');
    workflowStep = 'candidate_discovery';

    const discoveryInput: VerticalAiDiscoveryInput = {
      repositoryTruthFingerprint,
      projectTruthFingerprint,
      goalTruthFingerprint: goalTruth.fingerprint,
      activeGoalIds: goalTruth.entries.filter((entry) => entry.satisfied).map((entry) => entry.goal_id),
      operationalConstraintsRespected: operationalConstraints.respected,
      developmentPlanId: devIntel?.development_plan.plan_id ?? null,
      inventoryExists: fs.existsSync(path.join(root, PROJECT_ENTITY_EXTRACTION_V1_PATH)),
    };

    selection = selectHighestValueVerticalAiImplementation(root, discoveryInput);

    writeJson(root, VERTICAL_AI_CANDIDATE_DISCOVERY_V1_PATH, {
      vertical_ai_candidate_discovery_v1_id: 'vertical_ai_candidate_discovery_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      discovery_basis: [
        'repository_truth',
        'current_project_truth',
        'current_goal_truth',
        'operational_constraints',
        'development_intelligence',
      ],
      registry_records_decisions_only: true,
      discovery_input: discoveryInput,
      discovered_candidates: selection.discovery,
      discovered_count: selection.discovery.length,
      materialization_fingerprint: repositoryTruthMaterialization.fingerprint,
      repository_truth_materialization_ref: VERTICAL_AI_REPOSITORY_TRUTH_MATERIALIZATION_V1_PATH,
    });
    completedSteps.push('candidate_discovery');
    workflowStep = 'candidate_evaluation';
    repositoryEvaluation = evaluateCurrentRepository(root, selection.evaluated);

    const candidateVerdicts = selection.evaluated
      .map((entry) => `${entry.candidate_id}:${entry.verdict ?? 'pending'}`)
      .join('|');

    decisionFingerprint = computeDecisionFingerprint({
      repositoryTruthFingerprint,
      projectTruthFingerprint,
      goalTruthFingerprint: goalTruth.fingerprint,
      operationalConstraintsFingerprint: operationalConstraints.fingerprint,
      developmentPlanId: devIntel?.development_plan.plan_id ?? null,
      candidateVerdicts,
    });

    writeJson(root, VERTICAL_AI_REPOSITORY_EVALUATION_V1_PATH, {
      vertical_ai_repository_evaluation_v1_id: 'vertical_ai_repository_evaluation_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      ...repositoryEvaluation,
      candidate_evaluations: selection.evaluated,
    });
    writeJson(root, VERTICAL_AI_BRAIN_ASSIST_V1_PATH, {
      vertical_ai_brain_assist_v1_id: 'vertical_ai_brain_assist_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      read_only: true,
      brain_modification: false,
      living_project_model_ref: PROJECT_BRAIN_LPM_V1_PATH,
      goal_model_ref: PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
      gap_analysis_ref: PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH,
      development_intelligence_ref: PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH,
      gap_count: gapAnalysis.gap_analysis_report.gaps.length,
      high_gap_count: gapAnalysis.gap_analysis_report.gaps.filter(
        (g) => g.severity === 'high' || g.severity === 'critical'
      ).length,
      development_candidate_count: gapAnalysis.gap_analysis_report.development_candidates.length,
      development_plan_ref: devIntel?.development_plan.plan_id ?? null,
    });

    writeJson(root, VERTICAL_AI_CANDIDATE_EVALUATION_V1_PATH, {
      vertical_ai_candidate_evaluation_v1_id: 'vertical_ai_candidate_evaluation_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      decision_fingerprint: decisionFingerprint,
      pending_candidate_count: repositoryEvaluation?.vertical_ai_pending_count ?? 0,
      satisfied_candidate_count: repositoryEvaluation?.vertical_ai_satisfied_count ?? 0,
      pending_candidate_ids: repositoryEvaluation?.pending_candidate_ids ?? [],
      evidence_based_selection_ready: repositoryEvaluation?.evidence_based_selection_ready === true,
      discovered_candidates: selection.discovery,
      discovered_count: selection.discovery.length,
      candidate_discovery_ref: VERTICAL_AI_CANDIDATE_DISCOVERY_V1_PATH,
      registry_records_decisions_only: true,
      candidate_evaluations: selection.evaluated,
      repository_evaluation_ref: VERTICAL_AI_REPOSITORY_EVALUATION_V1_PATH,
      repository_truth_materialization_ref: VERTICAL_AI_REPOSITORY_TRUTH_MATERIALIZATION_V1_PATH,
      selected_candidate_id: selection.selected?.candidate_id ?? null,
    });
    completedSteps.push('candidate_evaluation');

    if (!selection.selected) {
      watchWithoutMutation = true;
      workflowStep = 'watch_idle';

      writeJson(root, VERTICAL_AI_CYCLE_DECISION_V1_PATH, {
        vertical_ai_cycle_decision_v1_id: 'vertical_ai_cycle_decision_v1',
        architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
        phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
        generated_at: generatedAt,
        mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
        decision_basis: 'evidence_based_candidate_evaluation',
        decision_outcome: 'watch_without_mutation',
        decision_fingerprint: decisionFingerprint,
        objective_evidence: {
          repository_truth_fingerprint: repositoryTruthFingerprint,
          project_truth_fingerprint: projectTruthFingerprint,
          goal_truth_fingerprint: goalTruth.fingerprint,
          operational_constraints_ref: VERTICAL_AI_OPERATIONAL_CONSTRAINTS_V1_PATH,
          development_intelligence_read_ref: VERTICAL_AI_DEVELOPMENT_INTELLIGENCE_READ_V1_PATH,
          repository_evaluation_ref: VERTICAL_AI_REPOSITORY_EVALUATION_V1_PATH,
          repository_truth_materialization_ref: VERTICAL_AI_REPOSITORY_TRUTH_MATERIALIZATION_V1_PATH,
          candidate_discovery_ref: VERTICAL_AI_CANDIDATE_DISCOVERY_V1_PATH,
          discovered_count: selection.discovery.length,
          candidate_verdicts: selection.evaluated,
          pending_candidate_count: repositoryEvaluation?.vertical_ai_pending_count ?? 0,
          development_plan_id: developmentIntelligenceRead?.development_plan_id ?? null,
        },
        selection_rationale: selection.rationale,
        brain_modification: false,
        mutation_performed: false,
      });

      writeJson(root, VERTICAL_AI_IMPLEMENTATION_CYCLE_WATCH_V1_PATH, {
        vertical_ai_implementation_cycle_watch_v1_id: 'vertical_ai_implementation_cycle_watch_v1',
        architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
        phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
        generated_at: generatedAt,
        mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
        watch_without_mutation: true,
        watch_reason: 'no_pending_evidence_based_implementation_candidate',
        decision_fingerprint: decisionFingerprint,
        cycle_decision_ref: VERTICAL_AI_CYCLE_DECISION_V1_PATH,
        candidate_discovery_ref: VERTICAL_AI_CANDIDATE_DISCOVERY_V1_PATH,
        candidate_evaluation_ref: VERTICAL_AI_CANDIDATE_EVALUATION_V1_PATH,
        repository_evaluation_ref: VERTICAL_AI_REPOSITORY_EVALUATION_V1_PATH,
        satisfied_candidate_count: repositoryEvaluation?.vertical_ai_satisfied_count ?? 0,
        pending_candidate_count: 0,
        brain_modification: false,
        lpm_updated: false,
        implementation_executed: false,
      });

      postSyncPassed = syncPassed;
      postSyncVerdict = syncVerdict;
      completedSteps.push('watch_idle', 'watch');
      workflowStep = 'watch';
    } else {
      writeJson(root, VERTICAL_AI_SELECTED_IMPLEMENTATION_V1_PATH, {
        vertical_ai_selected_implementation_v1_id: 'vertical_ai_selected_implementation_v1',
        architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
        phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
        generated_at: generatedAt,
        mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
        selection_rationale: selection.rationale,
        decision_basis: [
          'repository_truth',
          'current_project_truth',
          'current_goal_truth',
          'operational_constraints',
          'development_intelligence',
        ],
        decision_fingerprint: decisionFingerprint,
        selected_candidate_id: selection.selected.candidate_id,
        selected_title: selection.selected.title,
        plan_phase: selection.selected.plan_phase,
        feature_phase: selection.selected.feature_phase,
        pass_verdict: selection.selected.pass_verdict,
        report_path: selection.selected.report_path,
        evaluated_candidates: selection.evaluated,
        repository_evaluation_ref: VERTICAL_AI_REPOSITORY_EVALUATION_V1_PATH,
        development_intelligence_read_ref: VERTICAL_AI_DEVELOPMENT_INTELLIGENCE_READ_V1_PATH,
        operational_constraints_ref: VERTICAL_AI_OPERATIONAL_CONSTRAINTS_V1_PATH,
      });
      workflowStep = 'implementation_execution';

      const lpm = readJson<{ entity_count?: number; capabilities: unknown[] }>(
        root,
        PROJECT_BRAIN_LPM_V1_PATH
      );

      writeJson(root, VERTICAL_AI_PROJECT_UNDERSTANDING_V1_PATH, {
        vertical_ai_project_understanding_v1_id: 'vertical_ai_project_understanding_v1',
        architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
        phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
        generated_at: generatedAt,
        mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
        brain_assisted_scope: 'project_understanding',
        read_only: true,
        cycle_ref: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PATH,
        goal_truth_ref: PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
        living_project_model_ref: PROJECT_BRAIN_LPM_V1_PATH,
        entity_count: lpm.entity_count ?? lpm.capabilities.length,
        goal_truth: goalTruth,
        selected_candidate_id: selection.selected.candidate_id,
      });

      writeJson(root, VERTICAL_AI_DECISION_V1_PATH, {
        vertical_ai_decision_v1_id: 'vertical_ai_decision_v1',
        architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
        phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
        generated_at: generatedAt,
        mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
        brain_assisted_scope: 'decision',
        read_only: true,
        decision_basis: 'evidence_based_highest_value_implementation',
        decision_fingerprint: decisionFingerprint,
        goal_truth_fingerprint: goalTruth.fingerprint,
        selected_candidate_id: selection.selected.candidate_id,
        selected_title: selection.selected.title,
        plan_phase: selection.selected.plan_phase,
        develop_vertical_ai_only: true,
        modify_brain: false,
      });

      writeJson(root, VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH, {
        vertical_ai_implementation_plan_v1_id: 'vertical_ai_implementation_plan_v1',
        architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
        phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
        generated_at: generatedAt,
        mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
        brain_assisted_scope: 'implementation_plan',
        vertical: 'digital_ghibli_video_production',
        plan_phase: selection.selected.plan_phase,
        selected_candidate_id: selection.selected.candidate_id,
        selected_title: selection.selected.title,
        selection_rationale: selection.rationale,
        decision_fingerprint: decisionFingerprint,
        objective_evidence: {
          repository_truth_fingerprint: repositoryTruthFingerprint,
          project_truth_fingerprint: projectTruthFingerprint,
          goal_truth_fingerprint: goalTruth.fingerprint,
          operational_constraints_ref: VERTICAL_AI_OPERATIONAL_CONSTRAINTS_V1_PATH,
          development_intelligence_read_ref: VERTICAL_AI_DEVELOPMENT_INTELLIGENCE_READ_V1_PATH,
          repository_evaluation_ref: VERTICAL_AI_REPOSITORY_EVALUATION_V1_PATH,
          repository_truth_materialization_ref: VERTICAL_AI_REPOSITORY_TRUTH_MATERIALIZATION_V1_PATH,
          candidate_discovery_ref: VERTICAL_AI_CANDIDATE_DISCOVERY_V1_PATH,
          materialization_fingerprint: repositoryTruthMaterialization?.fingerprint ?? null,
          discovered_candidates: selection.discovery,
          selected_report_path: selection.selected.report_path,
          expected_pass_verdict: selection.selected.pass_verdict,
          candidate_verdicts: selection.evaluated,
          development_plan_id: developmentIntelligenceRead?.development_plan_id ?? null,
        },
        goal_alignment: {
          satisfied_goals: goalTruth.satisfied_goals,
          evaluated_goals: goalTruth.evaluated_goals,
          fingerprint: goalTruth.fingerprint,
        },
        target_track: 'vertical_ai_feature_increment',
        roadmap_ref: STAGE7_ROADMAP_V1_PATH,
        cycle_ref: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PATH,
        approval_required: true,
        brain_modification: false,
        vertical_ai_development_only: true,
      });

      implementationResult = writeVerticalAiImplementationV1EngineReport();
      if (implementationResult.passed) {
        completedSteps.push(
          'implementation_execution',
          'validation',
          'lpm_update',
          'brain_resync',
          'watch'
        );
        workflowStep = 'watch';
      } else {
        completedSteps.push('implementation_execution');
        workflowStep = 'validation';
      }

      writeJson(root, VERTICAL_AI_IMPLEMENTATION_CYCLE_TRIGGER_SNAPSHOT_V1_PATH, currentSnapshot);

      if (fs.existsSync(path.join(root, PROJECT_BRAIN_SYNC_V1_REPORT_PATH))) {
        const postSyncReport = readJson<{ final_verdict: string }>(
          root,
          PROJECT_BRAIN_SYNC_V1_REPORT_PATH
        );
        postSyncVerdict = postSyncReport.final_verdict;
        postSyncPassed = postSyncVerdict === PROJECT_BRAIN_SYNC_V1_PASS_VERDICT;
      }

      if (!implementationResult.passed) {
        issues.push({
          code: 'IMPLEMENTATION',
          message: `Vertical AI implementation failed: ${implementationResult.verdict}`,
          severity: 'error',
        });
      }

      if (!postSyncPassed) {
        issues.push({
          code: 'BRAIN_RESYNC',
          message: 'Post-implementation Project Brain sync required',
          severity: 'error',
        });
      }
    }
  }

  writeJson(root, VERTICAL_AI_IMPLEMENTATION_CYCLE_WORKFLOW_V1_PATH, {
    vertical_ai_implementation_cycle_workflow_v1_id:
      'vertical_ai_implementation_cycle_workflow_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    generated_at: generatedAt,
    mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
    workflow_steps: [...VERTICAL_AI_IMPLEMENTATION_CYCLE_WORKFLOW_STEPS],
    completed_steps: completedSteps,
    current_step: workflowStep,
    implementation_passed: implementationResult?.passed === true,
  });

  const watchOnlyPassed =
    watchWithoutMutation &&
    selection !== null &&
    selection.selected === null &&
    selection.discovery.length === 0 &&
    completedSteps.includes('candidate_discovery') &&
    completedSteps.includes('candidate_evaluation') &&
    completedSteps.includes('watch_idle') &&
    decisionFingerprint !== null;

  const implementationPassed =
    selection?.selected !== null &&
    decisionFingerprint !== null &&
    (() => {
      if (!selection?.selected || !fs.existsSync(path.join(root, VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH))) {
        return false;
      }
      const plan = readJson<{ objective_evidence?: { selected_report_path?: string } }>(
        root,
        VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH
      );
      return plan.objective_evidence?.selected_report_path === selection.selected.report_path;
    })() &&
    implementationResult?.passed === true &&
    postSyncPassed;

  const passed =
    precheckPassed &&
    syncPassed &&
    syncVerdict === PROJECT_BRAIN_SYNC_V1_PASS_VERDICT &&
    operationalConstraints?.respected === true &&
    developmentIntelligenceRead?.read_only === true &&
    repositoryTruthMaterialization !== null &&
    completedSteps.includes('repository_truth_materialization') &&
    workflowStep === 'watch' &&
    issues.length === 0 &&
    (watchOnlyPassed || implementationPassed);

  const report = {
    report_id: `vertical_ai_implementation_cycle_v1_${Date.now()}`,
    phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
    generated_at: generatedAt,
    mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
    goal: 'Continue Vertical AI development using Project Brain assistance.',
    vertical_ai_implementation_cycle_v1_passed: passed,
    final_verdict: passed
      ? VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PASS_VERDICT
      : VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_FAIL_VERDICT,
    status: passed
      ? watchWithoutMutation
        ? VERTICAL_AI_IMPLEMENTATION_CYCLE_WATCH_STATUS
        : VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_STATUS
      : 'VERTICAL_AI_IMPLEMENTATION_CYCLE_FAILED',
    watch_without_mutation: watchWithoutMutation,
    candidate_discovery_ref: VERTICAL_AI_CANDIDATE_DISCOVERY_V1_PATH,
    candidate_evaluation_ref: VERTICAL_AI_CANDIDATE_EVALUATION_V1_PATH,
    cycle_decision_ref: watchWithoutMutation ? VERTICAL_AI_CYCLE_DECISION_V1_PATH : null,
    cycle_watch_ref: watchWithoutMutation ? VERTICAL_AI_IMPLEMENTATION_CYCLE_WATCH_V1_PATH : null,
    cycle_ref: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PATH,
    repository_truth_refresh_ref: VERTICAL_AI_REPOSITORY_TRUTH_REFRESH_V1_PATH,
    repository_truth_materialization_ref: VERTICAL_AI_REPOSITORY_TRUTH_MATERIALIZATION_V1_PATH,
    project_truth_refresh_ref: VERTICAL_AI_PROJECT_TRUTH_REFRESH_V1_PATH,
    active_goal_resolution_ref: VERTICAL_AI_ACTIVE_GOAL_RESOLUTION_V1_PATH,
    operational_constraints_ref: VERTICAL_AI_OPERATIONAL_CONSTRAINTS_V1_PATH,
    development_intelligence_read_ref: VERTICAL_AI_DEVELOPMENT_INTELLIGENCE_READ_V1_PATH,
    brain_sync_confirmation_ref: VERTICAL_AI_BRAIN_SYNC_CONFIRMATION_V1_PATH,
    repository_evaluation_ref: VERTICAL_AI_REPOSITORY_EVALUATION_V1_PATH,
    brain_assist_ref: VERTICAL_AI_BRAIN_ASSIST_V1_PATH,
    selected_implementation_ref: VERTICAL_AI_SELECTED_IMPLEMENTATION_V1_PATH,
    implementation_plan_ref: VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH,
    workflow_ref: VERTICAL_AI_IMPLEMENTATION_CYCLE_WORKFLOW_V1_PATH,
    trigger_snapshot_ref: VERTICAL_AI_IMPLEMENTATION_CYCLE_TRIGGER_SNAPSHOT_V1_PATH,
    implementation_verdict: implementationResult?.verdict ?? null,
    selected_candidate_id: selection?.selected?.candidate_id ?? null,
    selected_plan_phase: selection?.selected?.plan_phase ?? null,
    decision_fingerprint: decisionFingerprint,
    repository_truth_refresh_required: repositoryTruthRefreshRequired,
    sync_verdict: syncVerdict,
    post_sync_verdict: postSyncVerdict,
    workflow_step: workflowStep,
    goal_truth_fingerprint: goalTruth?.fingerprint ?? null,
    checks: {
      PREREQ: precheckPassed,
      REPOSITORY_TRUTH_REFRESH: completedSteps.includes('repository_truth_refresh'),
      PROJECT_TRUTH_REFRESH: completedSteps.includes('project_truth_refresh'),
      BRAIN_SYNC: syncPassed && syncVerdict === PROJECT_BRAIN_SYNC_V1_PASS_VERDICT,
      GOAL_TRUTH_RESOLVED: goalTruth !== null,
      OPERATIONAL_CONSTRAINTS: operationalConstraints?.respected === true,
      DEVELOPMENT_INTELLIGENCE_READ: developmentIntelligenceRead?.read_only === true,
      REPOSITORY_TRUTH_MATERIALIZED: completedSteps.includes('repository_truth_materialization'),
      CANDIDATE_DISCOVERED: completedSteps.includes('candidate_discovery'),
      REPOSITORY_EVALUATED: repositoryEvaluation !== null,
      CANDIDATE_EVALUATED: completedSteps.includes('candidate_evaluation'),
      WATCH_WITHOUT_MUTATION: watchWithoutMutation,
      IMPLEMENTATION_SELECTED: selection?.selected !== null,
      IMPLEMENTATION_PLAN_EMITTED:
        selection?.selected !== null &&
        fs.existsSync(path.join(root, VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH)),
      IMPLEMENTATION_PLAN_OBJECTIVE_EVIDENCE:
        selection?.selected !== null &&
        fs.existsSync(path.join(root, VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH)) &&
        readJson<{ objective_evidence?: { selected_report_path?: string } }>(
          root,
          VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH
        ).objective_evidence?.selected_report_path === selection.selected.report_path,
      IMPLEMENTATION_EXECUTED: implementationResult !== null,
      VALIDATION_PASS: watchWithoutMutation || completedSteps.includes('validation'),
      LPM_UPDATED: watchWithoutMutation ? false : completedSteps.includes('lpm_update'),
      BRAIN_RESYNC: postSyncPassed,
      WORKFLOW_WATCH: workflowStep === 'watch',
      IMPLEMENTATION_PASS: watchWithoutMutation || implementationResult?.passed === true,
      EXECUTE_AUTHORIZED_FALSE: EXECUTION_FLAGS.execute_authorized === false,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PATH, {
    vertical_ai_implementation_cycle_v1_id: 'vertical_ai_implementation_cycle_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PHASE,
    generated_at: generatedAt,
    mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
    cycle_ref: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PATH,
    report_ref: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_REPORT_PATH,
    repository_truth_refresh_ref: VERTICAL_AI_REPOSITORY_TRUTH_REFRESH_V1_PATH,
    repository_truth_materialization_ref: VERTICAL_AI_REPOSITORY_TRUTH_MATERIALIZATION_V1_PATH,
    project_truth_refresh_ref: VERTICAL_AI_PROJECT_TRUTH_REFRESH_V1_PATH,
    active_goal_resolution_ref: VERTICAL_AI_ACTIVE_GOAL_RESOLUTION_V1_PATH,
    operational_constraints_ref: VERTICAL_AI_OPERATIONAL_CONSTRAINTS_V1_PATH,
    development_intelligence_read_ref: VERTICAL_AI_DEVELOPMENT_INTELLIGENCE_READ_V1_PATH,
    brain_sync_confirmation_ref: VERTICAL_AI_BRAIN_SYNC_CONFIRMATION_V1_PATH,
    repository_evaluation_ref: VERTICAL_AI_REPOSITORY_EVALUATION_V1_PATH,
    brain_assist_ref: VERTICAL_AI_BRAIN_ASSIST_V1_PATH,
    selected_implementation_ref: VERTICAL_AI_SELECTED_IMPLEMENTATION_V1_PATH,
    implementation_plan_ref: VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH,
    workflow_ref: VERTICAL_AI_IMPLEMENTATION_CYCLE_WORKFLOW_V1_PATH,
    trigger_snapshot_ref: VERTICAL_AI_IMPLEMENTATION_CYCLE_TRIGGER_SNAPSHOT_V1_PATH,
    decision_fingerprint: decisionFingerprint,
    workflow_step: workflowStep,
    selected_candidate_id: selection?.selected?.candidate_id ?? null,
    implementation_verdict: implementationResult?.verdict ?? null,
    post_sync_verdict: postSyncVerdict,
    execute_authorized: false,
    passed,
  });

  writeJson(root, VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_REPORT_PATH, report);

  return {
    passed,
    verdict: passed
      ? VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_PASS_VERDICT
      : VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_FAIL_VERDICT,
    reportPath: VERTICAL_AI_IMPLEMENTATION_CYCLE_V1_REPORT_PATH,
    implementationVerdict: implementationResult?.verdict ?? null,
    selectedCandidateId: selection?.selected?.candidate_id ?? null,
  };
}
