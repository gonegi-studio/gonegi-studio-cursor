import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_BRAIN_ARCHITECTURE_VERSION } from './projectBrainFoundationV1.js';
import { captureCycleSnapshot, writeImplementationCycleV1EngineReport } from './implementationCycleV1Engine.js';
import { IMPLEMENTATION_PLAN_APPROVAL_V1_PATH } from './projectBrainOperationV1Engine.js';
import {
  PROJECT_BRAIN_STAGE7_SUPPORT_V1_PATH,
  PROJECT_BRAIN_V1_FREEZE_V1_PATH,
} from './projectBrainOperationModeActivationV1Engine.js';
import {
  PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH,
  PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH,
  PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
} from './projectBrainWaveDDevelopmentPluginsV1.js';
import { PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH } from './projectBrainWaveCSemanticUnderstandingV1Engine.js';
import { PROJECT_BRAIN_V1_CERTIFICATION_PATH } from './projectBrainWaveFAcceptanceV1Engine.js';
import {
  PROJECT_BRAIN_V1_COMPLETE_PASS_VERDICT,
  PROJECT_BRAIN_V1_COMPLETE_V1_REPORT_PATH,
} from './projectBrainV1CompleteV1Engine.js';
import { PROJECT_BRAIN_LPM_V1_PATH } from './projectBrainWaveBLpmMaterializationV1Engine.js';
import {
  STAGE7_IMPLEMENTATION_V1_PATH,
  STAGE7_ROADMAP_V1_PATH,
} from './stage7BootstrapV1Engine.js';
import {
  BRAIN_ASSISTED_SCOPES,
  VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
  VERTICAL_AI_DEVELOPMENT_V1_PASS_VERDICT,
  VERTICAL_AI_DEVELOPMENT_V1_REPORT_PATH,
  VERTICAL_AI_WORKFLOW_STEPS,
  hasApprovedPlan,
  loadCurrentGoalTruth,
} from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_OPERATION_V1_PHASE = 'PHASE-VERTICAL-AI-OPERATION-V1' as const;
export const VERTICAL_AI_OPERATION_V1_SYSTEM_ID = 'VERTICAL_AI_OPERATION_V1' as const;
export const VERTICAL_AI_OPERATION_V1_PASS_VERDICT = 'PASS_VERTICAL_AI_OPERATION_V1' as const;
export const VERTICAL_AI_OPERATION_V1_FAIL_VERDICT = 'FAIL_VERTICAL_AI_OPERATION_V1' as const;
export const VERTICAL_AI_OPERATION_STATE_READY = 'READY' as const;
export const VERTICAL_AI_OPERATION_V1_STATUS = 'VERTICAL_AI_OPERATION_READY' as const;

export const VERTICAL_AI_OPERATION_V1_DIR = 'datasets/stage7/vertical_ai_operation_v1' as const;
export const VERTICAL_AI_OPERATION_V1_PATH =
  `${VERTICAL_AI_OPERATION_V1_DIR}/vertical-ai-operation-v1.json` as const;
export const VERTICAL_AI_OPERATION_WORKFLOW_V1_PATH =
  `${VERTICAL_AI_OPERATION_V1_DIR}/vertical-ai-operation-workflow-v1.json` as const;
export const VERTICAL_AI_OPERATION_UNDERSTANDING_V1_PATH =
  `${VERTICAL_AI_OPERATION_V1_DIR}/vertical-ai-operation-understanding-v1.json` as const;
export const VERTICAL_AI_OPERATION_DECISION_V1_PATH =
  `${VERTICAL_AI_OPERATION_V1_DIR}/vertical-ai-operation-decision-v1.json` as const;
export const VERTICAL_AI_OPERATION_IMPLEMENTATION_PLAN_V1_PATH =
  `${VERTICAL_AI_OPERATION_V1_DIR}/vertical-ai-operation-implementation-plan-v1.json` as const;
export const VERTICAL_AI_OPERATION_WATCH_V1_PATH =
  `${VERTICAL_AI_OPERATION_V1_DIR}/vertical-ai-operation-watch-v1.json` as const;
export const VERTICAL_AI_OPERATION_SNAPSHOT_V1_PATH =
  `${VERTICAL_AI_OPERATION_V1_DIR}/vertical-ai-operation-snapshot-v1.json` as const;
export const VERTICAL_AI_OPERATION_V1_REPORT_PATH =
  'reports/stage7/VERTICAL_AI_OPERATION_V1_REPORT.json' as const;
export const VERTICAL_AI_OPERATION_V1_VERSION = 'vertical_ai_operation_v1' as const;

export const BRAIN_ENGAGEMENT_TRIGGER_IDS = [
  'repository_change_detected',
  'goal_truth_changed',
  'approved_implementation_required',
] as const;

export const VAO_CONTRACT_IDS = [
  'VAO_OPERATION_READY',
  'VAO_BRAIN_FROZEN',
  'VAO_BRAIN_ENGAGEMENT_CONDITIONAL',
  'VAO_VERTICAL_AI_DEVELOPMENT_DEFAULT',
  'VAO_GOAL_TRUTH_WORKFLOW',
  'VAO_IMPLEMENTATION_PLAN_EMITTED',
  'VAO_APPROVAL_GATE',
  'VAO_BRAIN_STABLE',
  'VAO_WATCH_ACTIVE',
] as const;

const EXECUTION_FLAGS = {
  vertical_ai_operation_v1: true as const,
  project_brain_assisted: true as const,
  operation_state_ready: true as const,
  read_only_brain: true as const,
  execute_authorized: false as const,
  brain_architecture_evolution: false as const,
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function loadPriorOperationSnapshot(
  root: string
): { entity_count: number; goal_truth_fingerprint: string } | null {
  if (fs.existsSync(path.join(root, VERTICAL_AI_OPERATION_SNAPSHOT_V1_PATH))) {
    return readJson(root, VERTICAL_AI_OPERATION_SNAPSHOT_V1_PATH);
  }
  return null;
}

export function detectBrainEngagementTriggers(
  root: string,
  priorSnapshot: { entity_count: number; goal_truth_fingerprint: string } | null
): {
  triggers: string[];
  brainEngaged: boolean;
  goalTruthFingerprint: string;
  currentSnapshot: ReturnType<typeof captureCycleSnapshot>;
  approved: ReturnType<typeof hasApprovedPlan>;
} {
  const currentSnapshot = captureCycleSnapshot(root);
  const goalTruth = loadCurrentGoalTruth(root);
  const approved = hasApprovedPlan(root);
  const triggers: string[] = [];

  if (priorSnapshot) {
    if (currentSnapshot.entity_count !== priorSnapshot.entity_count) {
      triggers.push('repository_change_detected');
    }
    if (goalTruth.fingerprint !== priorSnapshot.goal_truth_fingerprint) {
      triggers.push('goal_truth_changed');
    }
  }

  if (approved.approved) {
    triggers.push('approved_implementation_required');
  }

  return {
    triggers: [...new Set(triggers)],
    brainEngaged: triggers.length > 0,
    goalTruthFingerprint: goalTruth.fingerprint,
    currentSnapshot,
    approved,
  };
}

function validateOperationContracts(input: {
  operationReady: boolean;
  brainFrozen: boolean;
  brainEngagementConditional: boolean;
  verticalAiDevelopmentDefault: boolean;
  goalTruthWorkflow: boolean;
  implementationPlanEmitted: boolean;
  approvalGateHonored: boolean;
  brainStable: boolean;
  watchActive: boolean;
}) {
  const results = [
    { contract_id: 'VAO_OPERATION_READY', verdict: input.operationReady ? 'PASS' : 'FAIL', evidence: `ready=${input.operationReady}` },
    { contract_id: 'VAO_BRAIN_FROZEN', verdict: input.brainFrozen ? 'PASS' : 'FAIL', evidence: `frozen=${input.brainFrozen}` },
    { contract_id: 'VAO_BRAIN_ENGAGEMENT_CONDITIONAL', verdict: input.brainEngagementConditional ? 'PASS' : 'FAIL', evidence: `conditional=${input.brainEngagementConditional}` },
    { contract_id: 'VAO_VERTICAL_AI_DEVELOPMENT_DEFAULT', verdict: input.verticalAiDevelopmentDefault ? 'PASS' : 'FAIL', evidence: `default=${input.verticalAiDevelopmentDefault}` },
    { contract_id: 'VAO_GOAL_TRUTH_WORKFLOW', verdict: input.goalTruthWorkflow ? 'PASS' : 'FAIL', evidence: `workflow=${input.goalTruthWorkflow}` },
    { contract_id: 'VAO_IMPLEMENTATION_PLAN_EMITTED', verdict: input.implementationPlanEmitted ? 'PASS' : 'FAIL', evidence: `plan=${input.implementationPlanEmitted}` },
    { contract_id: 'VAO_APPROVAL_GATE', verdict: input.approvalGateHonored ? 'PASS' : 'FAIL', evidence: `approval=${input.approvalGateHonored}` },
    { contract_id: 'VAO_BRAIN_STABLE', verdict: input.brainStable ? 'PASS' : 'FAIL', evidence: `stable=${input.brainStable}` },
    { contract_id: 'VAO_WATCH_ACTIVE', verdict: input.watchActive ? 'PASS' : 'FAIL', evidence: `watch=${input.watchActive}` },
  ] as const;

  const pass = results.every((r) => r.verdict === 'PASS');
  return { results, aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const) };
}

export function writeVerticalAiOperationV1EngineReport(): {
  passed: boolean;
  verdict: string;
  reportPath: string;
  workflowStep: string;
  brainEngaged: boolean;
  operationReady: boolean;
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

  const v1CompleteReport = fs.existsSync(path.join(root, PROJECT_BRAIN_V1_COMPLETE_V1_REPORT_PATH))
    ? readJson<{ final_verdict: string; project_brain_v1_complete_passed: boolean }>(
        root,
        PROJECT_BRAIN_V1_COMPLETE_V1_REPORT_PATH
      )
    : null;

  const certification = fs.existsSync(path.join(root, PROJECT_BRAIN_V1_CERTIFICATION_PATH))
    ? readJson<{ verdict: string }>(root, PROJECT_BRAIN_V1_CERTIFICATION_PATH)
    : null;

  const v1Freeze = fs.existsSync(path.join(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH))
    ? readJson<{ verdict: string }>(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH)
    : null;

  const stage7Support = fs.existsSync(path.join(root, PROJECT_BRAIN_STAGE7_SUPPORT_V1_PATH))
    ? readJson<{ owner: string; vertical: string; stage_name: string }>(
        root,
        PROJECT_BRAIN_STAGE7_SUPPORT_V1_PATH
      )
    : null;

  const brainFrozen =
    v1CompleteReport?.final_verdict === PROJECT_BRAIN_V1_COMPLETE_PASS_VERDICT &&
    certification?.verdict === 'PASS_PROJECT_BRAIN_V1_ACCEPTED' &&
    v1Freeze?.verdict === 'PASS_PROJECT_BRAIN_V1_FROZEN';

  const developmentReady =
    developmentReport?.final_verdict === VERTICAL_AI_DEVELOPMENT_V1_PASS_VERDICT &&
    developmentReport?.vertical_ai_development_v1_passed === true;

  const precheckPassed =
    brainFrozen &&
    developmentReady &&
    stage7Support?.owner === 'vertical_ai' &&
    fs.existsSync(path.join(root, PROJECT_BRAIN_LPM_V1_PATH));

  if (!precheckPassed) {
    issues.push({
      code: 'PREREQ',
      message: 'Vertical AI development ready, brain frozen, and stage7 support required',
      severity: 'error',
    });
  }

  const certificationBeforeMtime = fs.existsSync(path.join(root, PROJECT_BRAIN_V1_CERTIFICATION_PATH))
    ? fs.statSync(path.join(root, PROJECT_BRAIN_V1_CERTIFICATION_PATH)).mtimeMs
    : 0;
  const v1FreezeBeforeMtime = fs.existsSync(path.join(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH))
    ? fs.statSync(path.join(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH)).mtimeMs
    : 0;
  const lpmBeforeMtime = fs.existsSync(path.join(root, PROJECT_BRAIN_LPM_V1_PATH))
    ? fs.statSync(path.join(root, PROJECT_BRAIN_LPM_V1_PATH)).mtimeMs
    : 0;

  let goalTruth = null as ReturnType<typeof loadCurrentGoalTruth> | null;
  let triggerEvaluation: ReturnType<typeof detectBrainEngagementTriggers> | null = null;
  let brainEngaged = false;
  let workflowStep = 'goal';
  let cycleRun = false;
  let cycleVerdict: string | null = null;
  let lpmUpdated = false;
  let brainStable = false;
  let operationReady = false;
  let contractValidation: ReturnType<typeof validateOperationContracts> | null = null;
  let verticalAiDevelopmentDefault = false;

  if (precheckPassed) {
    goalTruth = loadCurrentGoalTruth(root);
    const priorSnapshot = loadPriorOperationSnapshot(root);
    triggerEvaluation = detectBrainEngagementTriggers(root, priorSnapshot);
    brainEngaged = triggerEvaluation.brainEngaged;
    verticalAiDevelopmentDefault = !brainEngaged;

    const lpm = readJson<{
      entity_count?: number;
      capabilities: Array<{ capability_id: string; name: string }>;
    }>(root, PROJECT_BRAIN_LPM_V1_PATH);

    const capabilityModel = fs.existsSync(path.join(root, PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH))
      ? readJson<{ capability_count?: number }>(root, PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH)
      : null;

    const gapAnalysis = fs.existsSync(path.join(root, PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH))
      ? readJson<{
          gap_analysis_report: {
            gaps: Array<{ severity: string }>;
            development_candidates: Array<{ candidate_id: string }>;
          };
        }>(root, PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH)
      : null;

    const devIntel = fs.existsSync(path.join(root, PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH))
      ? readJson<{ development_plan: { plan_id: string } }>(
          root,
          PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH
        )
      : null;

    const stage7Implementation = fs.existsSync(path.join(root, STAGE7_IMPLEMENTATION_V1_PATH))
      ? readJson<{
          implementation_tracks: Array<{
            track_id: string;
            priority: string;
            status: string;
            phase: string;
          }>;
        }>(root, STAGE7_IMPLEMENTATION_V1_PATH)
      : null;

    writeJson(root, VERTICAL_AI_OPERATION_UNDERSTANDING_V1_PATH, {
      vertical_ai_operation_understanding_v1_id: 'vertical_ai_operation_understanding_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPERATION_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      state: VERTICAL_AI_OPERATION_STATE_READY,
      brain_assisted_scope: 'project_understanding',
      read_only: true,
      brain_engaged: brainEngaged,
      goal_truth_ref: PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
      goal_truth: goalTruth,
      entity_count: lpm.entity_count ?? lpm.capabilities.length,
      capability_count: capabilityModel?.capability_count ?? lpm.capabilities.length,
      gap_count: gapAnalysis?.gap_analysis_report.gaps.length ?? 0,
    });

    const productionTracks =
      stage7Implementation?.implementation_tracks.filter((t) => t.track_id !== 'track_brain_handoff') ??
      [];
    const primaryTrack =
      productionTracks.find((t) => t.priority === 'critical') ?? productionTracks[0] ?? null;
    const nextVerticalFocus = brainEngaged
      ? 'brain_triggered_implementation'
      : 'vertical_ai_operational_development';

    writeJson(root, VERTICAL_AI_OPERATION_DECISION_V1_PATH, {
      vertical_ai_operation_decision_v1_id: 'vertical_ai_operation_decision_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPERATION_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      state: VERTICAL_AI_OPERATION_STATE_READY,
      brain_assisted_scope: 'decision',
      read_only: true,
      brain_engaged: brainEngaged,
      brain_engagement_triggers: triggerEvaluation.triggers,
      decision_basis: brainEngaged
        ? 'brain_engagement_trigger'
        : 'vertical_ai_development_with_brain_assistance',
      goal_truth_fingerprint: goalTruth.fingerprint,
      next_vertical_focus: nextVerticalFocus,
      primary_track: primaryTrack,
      modify_brain: false,
    });

    const planPhase =
      triggerEvaluation.approved.approved_plan_phase ??
      (brainEngaged
        ? 'PHASE-VERTICAL-AI-BRAIN-TRIGGERED-IMPLEMENTATION-V1'
        : 'PHASE-VERTICAL-AI-OPERATIONAL-DEVELOPMENT-V1');

    writeJson(root, VERTICAL_AI_OPERATION_IMPLEMENTATION_PLAN_V1_PATH, {
      vertical_ai_operation_implementation_plan_v1_id: 'vertical_ai_operation_implementation_plan_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPERATION_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      state: VERTICAL_AI_OPERATION_STATE_READY,
      brain_assisted_scope: 'implementation_plan',
      vertical: stage7Support?.vertical ?? 'digital_ghibli_video_production',
      plan_phase: planPhase,
      brain_engaged: brainEngaged,
      brain_engagement_triggers: triggerEvaluation.triggers,
      goal_alignment: {
        satisfied_goals: goalTruth.satisfied_goals,
        evaluated_goals: goalTruth.evaluated_goals,
        fingerprint: goalTruth.fingerprint,
      },
      target_track: nextVerticalFocus,
      roadmap_ref: STAGE7_ROADMAP_V1_PATH,
      development_plan_ref: devIntel?.development_plan.plan_id ?? null,
      approval_required: true,
      approval_ref: IMPLEMENTATION_PLAN_APPROVAL_V1_PATH,
      brain_modification: false,
      vertical_ai_development_only: true,
      workflow_steps: [...VERTICAL_AI_WORKFLOW_STEPS],
    });

    workflowStep = 'implementation_plan';

    if (brainEngaged && triggerEvaluation.approved.approved) {
      workflowStep = 'implementation';
      const cycleResult = writeImplementationCycleV1EngineReport();
      cycleRun = cycleResult.passed;
      cycleVerdict = cycleResult.verdict;
      if (cycleRun) {
        workflowStep = 'lpm_update';
        lpmUpdated = true;
        workflowStep = 'watch';
      }
    } else {
      workflowStep = 'watch';
    }

    const certificationAfterMtime = fs.statSync(
      path.join(root, PROJECT_BRAIN_V1_CERTIFICATION_PATH)
    ).mtimeMs;
    const v1FreezeAfterMtime = fs.statSync(path.join(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH)).mtimeMs;
    const lpmAfterMtime = fs.statSync(path.join(root, PROJECT_BRAIN_LPM_V1_PATH)).mtimeMs;

    brainStable =
      certificationAfterMtime === certificationBeforeMtime &&
      v1FreezeAfterMtime === v1FreezeBeforeMtime &&
      (brainEngaged && triggerEvaluation.approved.approved ? cycleRun : lpmAfterMtime === lpmBeforeMtime);

    writeJson(root, VERTICAL_AI_OPERATION_SNAPSHOT_V1_PATH, {
      entity_count: triggerEvaluation.currentSnapshot.entity_count,
      goal_truth_fingerprint: triggerEvaluation.goalTruthFingerprint,
      captured_at: generatedAt,
    });

    writeJson(root, VERTICAL_AI_OPERATION_WATCH_V1_PATH, {
      vertical_ai_operation_watch_v1_id: 'vertical_ai_operation_watch_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPERATION_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      state: VERTICAL_AI_OPERATION_STATE_READY,
      workflow_step: workflowStep,
      brain_engaged: brainEngaged,
      brain_engagement_triggers: triggerEvaluation.triggers,
      vertical_ai_development_default: verticalAiDevelopmentDefault,
      approval_pending: !triggerEvaluation.approved.approved,
      brain_stable: brainStable,
      brain_modification: false,
      goal_truth_fingerprint: goalTruth.fingerprint,
      execute_authorized: false,
    });

    const completedSteps = brainEngaged && triggerEvaluation.approved.approved && cycleRun
      ? [...VERTICAL_AI_WORKFLOW_STEPS]
      : (['goal', 'implementation_plan', 'watch'] as const);

    writeJson(root, VERTICAL_AI_OPERATION_WORKFLOW_V1_PATH, {
      vertical_ai_operation_workflow_v1_id: 'vertical_ai_operation_workflow_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      state: VERTICAL_AI_OPERATION_STATE_READY,
      input: 'current_goal_truth',
      workflow_steps: [...VERTICAL_AI_WORKFLOW_STEPS],
      completed_steps: completedSteps,
      current_step: workflowStep,
      brain_engaged: brainEngaged,
      brain_engagement_triggers: triggerEvaluation.triggers,
      vertical_ai_development_default: verticalAiDevelopmentDefault,
      approval_status: triggerEvaluation.approved.approved ? 'approved' : 'pending',
      implementation_cycle_run: cycleRun,
      lpm_updated: lpmUpdated,
    });

    operationReady =
      precheckPassed &&
      workflowStep === 'watch' &&
      brainStable &&
      (!brainEngaged || !triggerEvaluation.approved.approved || cycleRun);

    writeJson(root, VERTICAL_AI_OPERATION_V1_PATH, {
      vertical_ai_operation_v1_id: 'vertical_ai_operation_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPERATION_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      state: VERTICAL_AI_OPERATION_STATE_READY,
      operation_ready: operationReady,
      vertical: stage7Support?.vertical ?? 'digital_ghibli_video_production',
      stage_name: stage7Support?.stage_name ?? 'Digital Ghibli Video Production Vertical AI',
      brain_frozen: true,
      brain_assisted_scopes: [...BRAIN_ASSISTED_SCOPES],
      brain_engaged: brainEngaged,
      brain_engagement_triggers: triggerEvaluation.triggers,
      vertical_ai_development_default: verticalAiDevelopmentDefault,
      workflow_step: workflowStep,
      approval_pending: !triggerEvaluation.approved.approved,
      implementation_cycle_run: cycleRun,
      implementation_cycle_verdict: cycleVerdict,
      lpm_updated: lpmUpdated,
      brain_stable: brainStable,
      goal_truth_fingerprint: goalTruth.fingerprint,
      workflow_ref: VERTICAL_AI_OPERATION_WORKFLOW_V1_PATH,
      understanding_ref: VERTICAL_AI_OPERATION_UNDERSTANDING_V1_PATH,
      decision_ref: VERTICAL_AI_OPERATION_DECISION_V1_PATH,
      implementation_plan_ref: VERTICAL_AI_OPERATION_IMPLEMENTATION_PLAN_V1_PATH,
      watch_ref: VERTICAL_AI_OPERATION_WATCH_V1_PATH,
      development_ref: VERTICAL_AI_DEVELOPMENT_V1_REPORT_PATH,
      execute_authorized: false,
    });

    contractValidation = validateOperationContracts({
      operationReady,
      brainFrozen: true,
      brainEngagementConditional: brainEngaged === triggerEvaluation.triggers.length > 0,
      verticalAiDevelopmentDefault,
      goalTruthWorkflow: goalTruth !== null,
      implementationPlanEmitted: true,
      approvalGateHonored: !triggerEvaluation.approved.approved || cycleRun,
      brainStable,
      watchActive: workflowStep === 'watch',
    });
  }

  const passed =
    precheckPassed &&
    operationReady &&
    contractValidation?.aggregate_verdict === 'PASS' &&
    issues.length === 0;

  const report = {
    report_id: `vertical_ai_operation_v1_${Date.now()}`,
    phase: VERTICAL_AI_OPERATION_V1_PHASE,
    generated_at: generatedAt,
    mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
    state: VERTICAL_AI_OPERATION_STATE_READY,
    input: 'current_goal_truth',
    vertical_ai_operation_v1_passed: passed,
    final_verdict: passed ? VERTICAL_AI_OPERATION_V1_PASS_VERDICT : VERTICAL_AI_OPERATION_V1_FAIL_VERDICT,
    status: passed ? VERTICAL_AI_OPERATION_V1_STATUS : 'VERTICAL_AI_OPERATION_FAILED',
    operation_ref: VERTICAL_AI_OPERATION_V1_PATH,
    workflow_ref: VERTICAL_AI_OPERATION_WORKFLOW_V1_PATH,
    workflow_step: workflowStep,
    brain_engaged: brainEngaged,
    brain_engagement_triggers: triggerEvaluation?.triggers ?? [],
    vertical_ai_development_default: verticalAiDevelopmentDefault,
    approval_pending: !triggerEvaluation?.approved.approved,
    implementation_cycle_run: cycleRun,
    implementation_cycle_verdict: cycleVerdict,
    lpm_updated: lpmUpdated,
    brain_stable: brainStable,
    brain_modification: false,
    checks: {
      PREREQ: precheckPassed,
      OPERATION_READY: operationReady,
      BRAIN_FROZEN: brainFrozen,
      BRAIN_ENGAGEMENT_CONDITIONAL: triggerEvaluation !== null,
      VERTICAL_AI_DEVELOPMENT_DEFAULT: verticalAiDevelopmentDefault,
      GOAL_TRUTH_WORKFLOW: goalTruth !== null,
      WORKFLOW_WATCH: workflowStep === 'watch',
      IMPLEMENTATION_PLAN_EMITTED: precheckPassed,
      BRAIN_STABLE: brainStable,
      CONTRACT_VALIDATION: contractValidation?.aggregate_verdict === 'PASS',
    },
    contract_results: contractValidation?.results ?? [],
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_OPERATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict: passed ? VERTICAL_AI_OPERATION_V1_PASS_VERDICT : VERTICAL_AI_OPERATION_V1_FAIL_VERDICT,
    reportPath: VERTICAL_AI_OPERATION_V1_REPORT_PATH,
    workflowStep,
    brainEngaged,
    operationReady,
  };
}
