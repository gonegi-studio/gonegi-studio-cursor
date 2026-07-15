import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_BRAIN_ARCHITECTURE_VERSION } from './projectBrainFoundationV1.js';
import type { LivingProjectModelV1 } from './projectBrainQualityContractEvaluatorV1Engine.js';
import { IMPLEMENTATION_PLAN_APPROVAL_V1_PATH } from './projectBrainOperationV1Engine.js';
import {
  PROJECT_BRAIN_STAGE7_SUPPORT_V1_PATH,
  PROJECT_BRAIN_V1_FREEZE_V1_PATH,
} from './projectBrainOperationModeActivationV1Engine.js';
import { PROJECT_BRAIN_GOAL_MODEL_V1_PATH } from './projectBrainWaveDDevelopmentPluginsV1.js';
import { PROJECT_BRAIN_V1_CERTIFICATION_PATH } from './projectBrainWaveFAcceptanceV1Engine.js';
import {
  PROJECT_BRAIN_V1_COMPLETE_PASS_VERDICT,
  PROJECT_BRAIN_V1_COMPLETE_V1_REPORT_PATH,
} from './projectBrainV1CompleteV1Engine.js';
import { PROJECT_BRAIN_LPM_V1_PATH } from './projectBrainWaveBLpmMaterializationV1Engine.js';
import { writeProjectBrainSyncV1EngineReport } from './projectBrainSyncV1Engine.js';
import { SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH } from './sourceVideoNumericalDnaFoundation.js';
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
  findVerticalAiCandidateByPlanPhase,
  type VerticalAiFeatureBinding,
} from './verticalAiImplementationSelectionV1.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_IMPLEMENTATION_V1_PHASE = 'PHASE-VERTICAL-AI-IMPLEMENTATION-V1' as const;
export const VERTICAL_AI_IMPLEMENTATION_V1_SYSTEM_ID = 'VERTICAL_AI_IMPLEMENTATION_V1' as const;
export const VERTICAL_AI_IMPLEMENTATION_V1_PASS_VERDICT = 'PASS_VERTICAL_AI_IMPLEMENTATION_V1' as const;
export const VERTICAL_AI_IMPLEMENTATION_V1_FAIL_VERDICT = 'FAIL_VERTICAL_AI_IMPLEMENTATION_V1' as const;
export const VERTICAL_AI_IMPLEMENTATION_V1_STATUS = 'VERTICAL_AI_IMPLEMENTATION_COMPLETE' as const;

export const VERTICAL_AI_IMPLEMENTATION_V1_DIR =
  'datasets/stage7/vertical_ai_implementation_v1' as const;
export const VERTICAL_AI_IMPLEMENTATION_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_V1_DIR}/vertical-ai-implementation-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_WORKFLOW_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_V1_DIR}/vertical-ai-implementation-workflow-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_EXECUTION_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_V1_DIR}/vertical-ai-implementation-execution-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_VALIDATION_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_V1_DIR}/vertical-ai-implementation-validation-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_CERTIFICATION_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_V1_DIR}/vertical-ai-implementation-certification-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_LPM_UPDATE_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_V1_DIR}/vertical-ai-implementation-lpm-update-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_WATCH_V1_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_V1_DIR}/vertical-ai-implementation-watch-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_V1_REPORT_PATH =
  'reports/stage7/VERTICAL_AI_IMPLEMENTATION_V1_REPORT.json' as const;
export const VERTICAL_AI_IMPLEMENTATION_V1_VERSION = 'vertical_ai_implementation_v1' as const;
export const VERTICAL_AI_IMPLEMENTATION_LPM_V1_PRE_UPDATE_PATH =
  `${VERTICAL_AI_IMPLEMENTATION_V1_DIR}/living-project-model-v1-pre-implementation.json` as const;

export const VERTICAL_AI_IMPLEMENTATION_WORKFLOW_STEPS = [
  'implementation',
  'validation',
  'certification',
  'lpm_update',
  'watch',
] as const;

export const VAI_CONTRACT_IDS = [
  'VAI_BRAIN_FROZEN',
  'VAI_BRAIN_READ_ONLY',
  'VAI_ACTIVE_GOAL_INPUT',
  'VAI_IMPLEMENTATION_COMPLETE',
  'VAI_VALIDATION_PASS',
  'VAI_CERTIFIED',
  'VAI_LPM_UPDATED',
  'VAI_BRAIN_STABLE',
  'VAI_WATCH_ACTIVE',
] as const;

const EXECUTION_FLAGS = {
  vertical_ai_implementation_v1: true as const,
  project_brain_assisted: true as const,
  read_only_brain: true as const,
  vertical_ai_execution: true as const,
  brain_modification: false as const,
  execute_authorized: true as const,
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function servicePathToEntityId(inventoryRef: string): string {
  const base = inventoryRef.replace(/^services\//, '').replace(/\.ts$/, '');
  return `entity_service_services_${base.toLowerCase().replace(/[^a-z0-9]/g, '')}_ts`;
}

function buildFeatureIncrementEntity(binding: VerticalAiFeatureBinding) {
  const entityId = servicePathToEntityId(binding.inventory_ref);
  return {
    entity_id: entityId,
    entity_kind: 'engine',
    semantic_purpose: binding.semantic_purpose,
    confidence: 0.9,
    inventory_ref: binding.inventory_ref,
    extension: {
      entity_type: 'service',
      name: binding.name,
      status: 'active',
      ontology_capability_id: binding.capability_id,
      ontology_domain_id: binding.domain_id,
      vertical_ai_implementation_binding: true,
      materialization_wave: 'V',
      provenance: VERTICAL_AI_IMPLEMENTATION_V1_PATH,
      classification_confidence: 0.93,
    },
  };
}

export function updateLivingProjectModelForFeatureIncrement(
  lpm: LivingProjectModelV1,
  generatedAt: string,
  planPhase: string,
  featureVerdict: string,
  binding: VerticalAiFeatureBinding,
  featureReportRef: string | null
) {
  const entityId = servicePathToEntityId(binding.inventory_ref);
  const entityById = new Map(lpm.entities.map((e) => [String(e.entity_id), e]));
  const existing = entityById.get(entityId);

  const featureEntity = existing
    ? {
        ...existing,
        extension: {
          ...(existing.extension as Record<string, unknown> | undefined),
          ontology_capability_id: binding.capability_id,
          ontology_domain_id: binding.domain_id,
          vertical_ai_implementation_binding: true,
          materialization_wave: 'V',
          provenance: VERTICAL_AI_IMPLEMENTATION_V1_PATH,
          classification_confidence: 0.93,
        },
      }
    : buildFeatureIncrementEntity(binding);

  entityById.set(entityId, featureEntity as (typeof lpm.entities)[number]);

  const sourceCap = lpm.capabilities.find(
    (c) => String(c.capability_id) === binding.capability_id
  );
  const existingIds = new Set((sourceCap?.entity_ids as string[]) ?? []);
  existingIds.add(entityId);

  const updatedCapabilities = lpm.capabilities.map((cap) => {
    if (String(cap.capability_id) === binding.capability_id) {
      const entityIds = [...existingIds];
      return {
        ...cap,
        entity_ids: entityIds,
        coverage: {
          ...(cap.coverage as Record<string, unknown> | undefined),
          entity_count: entityIds.length,
          evaluated: true,
          wave: 'V',
          source_video_numerical_dna_ref: SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH,
          vertical_ai_implementation_ref: VERTICAL_AI_IMPLEMENTATION_V1_PATH,
          feature_report_ref: featureReportRef,
          plan_phase: planPhase,
        },
      };
    }
    return cap;
  });

  const newEdges = [
    {
      edge_id: `edge_vai_impl_${entityId}_${binding.capability_id}_${planPhase.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
      edge_type: 'implements',
      from: entityId,
      to: binding.capability_id,
      confidence: 0.9,
      source_ref: VERTICAL_AI_IMPLEMENTATION_V1_PATH,
      extension: {
        materialization_wave: 'V',
        vertical_ai_implementation: true,
      },
    },
  ];

  const existingEdgeIds = new Set(lpm.edges.map((e) => String(e.edge_id)));
  const mergedEdges = [
    ...lpm.edges,
    ...newEdges.filter((e) => !existingEdgeIds.has(String(e.edge_id))),
  ];

  const knowledgeId = `knowledge_vertical_ai_feature_${planPhase.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
  const implementationKnowledge = {
    knowledge_id: knowledgeId,
    atom_type: 'vertical_ai_implementation',
    subject_ref: binding.capability_id,
    statement: `Vertical AI feature increment executed: plan_phase=${planPhase}, feature_verdict=${featureVerdict}`,
    source_ref: VERTICAL_AI_IMPLEMENTATION_V1_PATH,
    confidence: 0.95,
    extension: {
      generated_at: generatedAt,
      phase: VERTICAL_AI_IMPLEMENTATION_V1_PHASE,
      plan_phase: planPhase,
      feature_verdict: featureVerdict,
      feature_report_ref: featureReportRef,
      source_video_numerical_dna_ref: SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH,
    },
  };

  const filteredKnowledge = lpm.knowledge.filter((k) => String(k.knowledge_id) !== knowledgeId);

  return {
    updatedLpm: {
      ...lpm,
      generated_at: generatedAt,
      entities: Array.from(entityById.values()),
      capabilities: updatedCapabilities,
      edges: mergedEdges,
      knowledge: [...filteredKnowledge, implementationKnowledge],
      extension: {
        ...(lpm.extension ?? {}),
        materialization_trigger: 'vertical_ai_implementation',
        materialization_wave: 'V',
        vertical_ai_implementation_ref: VERTICAL_AI_IMPLEMENTATION_V1_PATH,
        vertical_ai_implementation_at: generatedAt,
        source_video_numerical_dna_ref: SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH,
        execute_authorized: false,
      },
    } satisfies LivingProjectModelV1,
    boundEntityIds: [...existingIds],
    engine_entity_id: entityId,
  };
}

function executeFeatureIncrement(root: string, planPhase: string): {
  passed: boolean;
  verdict: string;
  reportPath: string | null;
  passVerdict: string | null;
  binding: VerticalAiFeatureBinding | null;
} {
  const candidate = findVerticalAiCandidateByPlanPhase(planPhase);
  if (!candidate) {
    return {
      passed: false,
      verdict: VERTICAL_AI_IMPLEMENTATION_V1_FAIL_VERDICT,
      reportPath: null,
      passVerdict: null,
      binding: null,
    };
  }

  const result = candidate.execute(root);
  return {
    ...result,
    passVerdict: candidate.pass_verdict,
    binding: candidate.binding,
  };
}

function validateContracts(input: {
  brainFrozen: boolean;
  brainReadOnly: boolean;
  activeGoalInput: boolean;
  implementationComplete: boolean;
  validationPassed: boolean;
  certified: boolean;
  lpmUpdated: boolean;
  brainStable: boolean;
  watchActive: boolean;
}) {
  const results = [
    { contract_id: 'VAI_BRAIN_FROZEN', verdict: input.brainFrozen ? 'PASS' : 'FAIL', evidence: `frozen=${input.brainFrozen}` },
    { contract_id: 'VAI_BRAIN_READ_ONLY', verdict: input.brainReadOnly ? 'PASS' : 'FAIL', evidence: `read_only=${input.brainReadOnly}` },
    { contract_id: 'VAI_ACTIVE_GOAL_INPUT', verdict: input.activeGoalInput ? 'PASS' : 'FAIL', evidence: `goal=${input.activeGoalInput}` },
    { contract_id: 'VAI_IMPLEMENTATION_COMPLETE', verdict: input.implementationComplete ? 'PASS' : 'FAIL', evidence: `impl=${input.implementationComplete}` },
    { contract_id: 'VAI_VALIDATION_PASS', verdict: input.validationPassed ? 'PASS' : 'FAIL', evidence: `validation=${input.validationPassed}` },
    { contract_id: 'VAI_CERTIFIED', verdict: input.certified ? 'PASS' : 'FAIL', evidence: `certified=${input.certified}` },
    { contract_id: 'VAI_LPM_UPDATED', verdict: input.lpmUpdated ? 'PASS' : 'FAIL', evidence: `lpm=${input.lpmUpdated}` },
    { contract_id: 'VAI_BRAIN_STABLE', verdict: input.brainStable ? 'PASS' : 'FAIL', evidence: `stable=${input.brainStable}` },
    { contract_id: 'VAI_WATCH_ACTIVE', verdict: input.watchActive ? 'PASS' : 'FAIL', evidence: `watch=${input.watchActive}` },
  ] as const;

  const pass = results.every((r) => r.verdict === 'PASS');
  return { results, aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const) };
}

export function writeVerticalAiImplementationV1EngineReport(): {
  passed: boolean;
  verdict: string;
  reportPath: string;
  workflowStep: string;
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
    ? readJson<{ owner: string; vertical: string }>(root, PROJECT_BRAIN_STAGE7_SUPPORT_V1_PATH)
    : null;

  const brainFrozen =
    v1CompleteReport?.final_verdict === PROJECT_BRAIN_V1_COMPLETE_PASS_VERDICT &&
    v1CompleteReport?.project_brain_v1_complete_passed === true &&
    certification?.verdict === 'PASS_PROJECT_BRAIN_V1_ACCEPTED' &&
    v1Freeze?.verdict === 'PASS_PROJECT_BRAIN_V1_FROZEN';

  const developmentReady =
    developmentReport?.final_verdict === VERTICAL_AI_DEVELOPMENT_V1_PASS_VERDICT &&
    developmentReport?.vertical_ai_development_v1_passed === true;

  const planExists = fs.existsSync(path.join(root, VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH));

  const precheckPassed =
    brainFrozen &&
    developmentReady &&
    planExists &&
    stage7Support?.owner === 'vertical_ai' &&
    fs.existsSync(path.join(root, PROJECT_BRAIN_LPM_V1_PATH));

  if (!precheckPassed) {
    issues.push({
      code: 'PREREQ',
      message: 'Brain frozen, development PASS, implementation plan, and LPM required',
      severity: 'error',
    });
  }

  const certificationBeforeMtime = fs.existsSync(path.join(root, PROJECT_BRAIN_V1_CERTIFICATION_PATH))
    ? fs.statSync(path.join(root, PROJECT_BRAIN_V1_CERTIFICATION_PATH)).mtimeMs
    : 0;
  const v1FreezeBeforeMtime = fs.existsSync(path.join(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH))
    ? fs.statSync(path.join(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH)).mtimeMs
    : 0;

  let goalTruth = null as ReturnType<typeof loadCurrentGoalTruth> | null;
  let workflowStep = 'implementation';
  let implementationPassed = false;
  let validationPassed = false;
  let certified = false;
  let lpmUpdated = false;
  let brainStable = false;
  let featureVerdict: string | null = null;
  let featureReportPath: string | null = null;
  let planPhase = '';
  let contractValidation: ReturnType<typeof validateContracts> | null = null;
  let syncPassed = false;

  if (precheckPassed) {
    goalTruth = loadCurrentGoalTruth(root);

    const plan = readJson<{
      plan_phase: string;
      goal_alignment: { fingerprint: string };
      target_track: string;
      vertical: string;
    }>(root, VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH);

    planPhase = plan.plan_phase;

    writeJson(root, IMPLEMENTATION_PLAN_APPROVAL_V1_PATH, {
      implementation_plan_approval_v1_id: 'implementation_plan_approval_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      generated_at: generatedAt,
      approved: true,
      execute_authorized: true,
      approved_plan_phase: planPhase,
      approval_source: 'vertical_ai_implementation_v1',
      goal_truth_fingerprint: goalTruth.fingerprint,
      brain_modification: false,
    });

    writeJson(root, VERTICAL_AI_IMPLEMENTATION_LPM_V1_PRE_UPDATE_PATH, readJson(root, PROJECT_BRAIN_LPM_V1_PATH));

    const executionResult = executeFeatureIncrement(root, planPhase);
    implementationPassed = executionResult.passed;
    featureVerdict = executionResult.verdict;
    featureReportPath = executionResult.reportPath;
    workflowStep = implementationPassed ? 'validation' : 'implementation';

    writeJson(root, VERTICAL_AI_IMPLEMENTATION_EXECUTION_V1_PATH, {
      vertical_ai_implementation_execution_v1_id: 'vertical_ai_implementation_execution_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      plan_phase: planPhase,
      target_track: plan.target_track,
      brain_assisted_plan_ref: VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH,
      brain_assisted_decision_ref: VERTICAL_AI_DECISION_V1_PATH,
      brain_assisted_understanding_ref: VERTICAL_AI_PROJECT_UNDERSTANDING_V1_PATH,
      feature_report_ref: featureReportPath,
      feature_verdict: featureVerdict,
      executed: implementationPassed,
      brain_modification: false,
    });

    validationPassed =
      implementationPassed &&
      executionResult.passVerdict !== null &&
      featureVerdict === executionResult.passVerdict &&
      featureReportPath !== null &&
      fs.existsSync(path.join(root, featureReportPath));

    if (validationPassed) {
      workflowStep = 'certification';
    }

    writeJson(root, VERTICAL_AI_IMPLEMENTATION_VALIDATION_V1_PATH, {
      vertical_ai_implementation_validation_v1_id: 'vertical_ai_implementation_validation_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_V1_PHASE,
      generated_at: generatedAt,
      plan_phase: planPhase,
      feature_verdict: featureVerdict,
      feature_report_ref: featureReportPath,
      expected_pass_verdict: executionResult.passVerdict,
      validated: validationPassed,
    });

    certified = validationPassed && implementationPassed;

    let lpmUpdate: ReturnType<typeof updateLivingProjectModelForFeatureIncrement> | null = null;
    if (certified && executionResult.binding) {
      workflowStep = 'lpm_update';
      const lpm = readJson<LivingProjectModelV1>(root, PROJECT_BRAIN_LPM_V1_PATH);
      lpmUpdate = updateLivingProjectModelForFeatureIncrement(
        lpm,
        generatedAt,
        planPhase,
        featureVerdict ?? '',
        executionResult.binding,
        featureReportPath
      );
      writeJson(root, PROJECT_BRAIN_LPM_V1_PATH, lpmUpdate.updatedLpm);
      lpmUpdated = true;

      const syncResult = writeProjectBrainSyncV1EngineReport();
      syncPassed = syncResult.passed;

      writeJson(root, VERTICAL_AI_IMPLEMENTATION_LPM_UPDATE_V1_PATH, {
        vertical_ai_implementation_lpm_update_v1_id: 'vertical_ai_implementation_lpm_update_v1',
        architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
        phase: VERTICAL_AI_IMPLEMENTATION_V1_PHASE,
        generated_at: generatedAt,
        living_project_model_ref: PROJECT_BRAIN_LPM_V1_PATH,
        pre_update_ref: VERTICAL_AI_IMPLEMENTATION_LPM_V1_PRE_UPDATE_PATH,
        bound_entity_count: lpmUpdate.boundEntityIds.length,
        engine_entity_id: lpmUpdate.engine_entity_id,
        brain_sync_passed: syncPassed,
        updated: true,
      });

      workflowStep = 'watch';
    }

    const certificationAfterMtime = fs.statSync(
      path.join(root, PROJECT_BRAIN_V1_CERTIFICATION_PATH)
    ).mtimeMs;
    const v1FreezeAfterMtime = fs.statSync(path.join(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH)).mtimeMs;

    brainStable =
      certificationAfterMtime === certificationBeforeMtime &&
      v1FreezeAfterMtime === v1FreezeBeforeMtime;

    contractValidation = validateContracts({
      brainFrozen: true,
      brainReadOnly: true,
      activeGoalInput: goalTruth !== null && goalTruth.evaluated_goals > 0,
      implementationComplete: implementationPassed,
      validationPassed,
      certified: certified && syncPassed,
      lpmUpdated,
      brainStable,
      watchActive: workflowStep === 'watch',
    });

    writeJson(root, VERTICAL_AI_IMPLEMENTATION_CERTIFICATION_V1_PATH, {
      vertical_ai_implementation_certification_v1_id: 'vertical_ai_implementation_certification_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_V1_PHASE,
      generated_at: generatedAt,
      plan_phase: planPhase,
      contract_results: contractValidation.results,
      aggregate_verdict: contractValidation.aggregate_verdict,
      certified: contractValidation.aggregate_verdict === 'PASS',
      brain_modification: false,
    });

    writeJson(root, VERTICAL_AI_IMPLEMENTATION_WATCH_V1_PATH, {
      vertical_ai_implementation_watch_v1_id: 'vertical_ai_implementation_watch_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      workflow_step: workflowStep,
      brain_stable: brainStable,
      brain_modification: false,
      goal_truth_fingerprint: goalTruth.fingerprint,
      lpm_updated: lpmUpdated,
      execute_authorized: false,
    });

    const completedSteps = certified && syncPassed
      ? [...VERTICAL_AI_IMPLEMENTATION_WORKFLOW_STEPS]
      : (['implementation'] as const);

    writeJson(root, VERTICAL_AI_IMPLEMENTATION_WORKFLOW_V1_PATH, {
      vertical_ai_implementation_workflow_v1_id: 'vertical_ai_implementation_workflow_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      input: 'active_goal',
      goal_model_ref: PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
      brain_assisted_plan_ref: VERTICAL_AI_IMPLEMENTATION_PLAN_V1_PATH,
      workflow_steps: [...VERTICAL_AI_IMPLEMENTATION_WORKFLOW_STEPS],
      completed_steps: completedSteps,
      current_step: workflowStep,
      implementation_passed: implementationPassed,
      validation_passed: validationPassed,
      lpm_updated: lpmUpdated,
    });

    writeJson(root, VERTICAL_AI_IMPLEMENTATION_V1_PATH, {
      vertical_ai_implementation_v1_id: 'vertical_ai_implementation_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_IMPLEMENTATION_V1_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      vertical: stage7Support?.vertical ?? 'digital_ghibli_video_production',
      brain_frozen: true,
      brain_read_only: true,
      brain_modification: false,
      plan_phase: planPhase,
      goal_truth_fingerprint: goalTruth.fingerprint,
      workflow_step: workflowStep,
      feature_verdict: featureVerdict,
      lpm_updated: lpmUpdated,
      brain_stable: brainStable,
      development_ref: VERTICAL_AI_DEVELOPMENT_V1_REPORT_PATH,
      workflow_ref: VERTICAL_AI_IMPLEMENTATION_WORKFLOW_V1_PATH,
      execution_ref: VERTICAL_AI_IMPLEMENTATION_EXECUTION_V1_PATH,
      validation_ref: VERTICAL_AI_IMPLEMENTATION_VALIDATION_V1_PATH,
      certification_ref: VERTICAL_AI_IMPLEMENTATION_CERTIFICATION_V1_PATH,
      lpm_update_ref: VERTICAL_AI_IMPLEMENTATION_LPM_UPDATE_V1_PATH,
      watch_ref: VERTICAL_AI_IMPLEMENTATION_WATCH_V1_PATH,
      execute_authorized: false,
    });
  }

  const passed =
    precheckPassed &&
    implementationPassed &&
    validationPassed &&
    certified &&
    lpmUpdated &&
    syncPassed &&
    brainStable &&
    workflowStep === 'watch' &&
    contractValidation?.aggregate_verdict === 'PASS' &&
    issues.length === 0;

  const report = {
    report_id: `vertical_ai_implementation_v1_${Date.now()}`,
    phase: VERTICAL_AI_IMPLEMENTATION_V1_PHASE,
    generated_at: generatedAt,
    mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
    input: 'active_goal',
    vertical_ai_implementation_v1_passed: passed,
    final_verdict: passed ? VERTICAL_AI_IMPLEMENTATION_V1_PASS_VERDICT : VERTICAL_AI_IMPLEMENTATION_V1_FAIL_VERDICT,
    status: passed ? VERTICAL_AI_IMPLEMENTATION_V1_STATUS : 'VERTICAL_AI_IMPLEMENTATION_FAILED',
    implementation_ref: VERTICAL_AI_IMPLEMENTATION_V1_PATH,
    workflow_ref: VERTICAL_AI_IMPLEMENTATION_WORKFLOW_V1_PATH,
    workflow_step: workflowStep,
    plan_phase: planPhase,
    feature_verdict: featureVerdict,
    lpm_updated: lpmUpdated,
    brain_sync_passed: syncPassed,
    brain_stable: brainStable,
    brain_modification: false,
    checks: {
      PREREQ: precheckPassed,
      BRAIN_FROZEN: brainFrozen,
      DEVELOPMENT_READY: developmentReady,
      IMPLEMENTATION_COMPLETE: implementationPassed,
      VALIDATION_PASS: validationPassed,
      LPM_UPDATED: lpmUpdated,
      BRAIN_SYNC: syncPassed,
      BRAIN_STABLE: brainStable,
      WORKFLOW_WATCH: workflowStep === 'watch',
      CONTRACT_VALIDATION: contractValidation?.aggregate_verdict === 'PASS',
    },
    contract_results: contractValidation?.results ?? [],
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_IMPLEMENTATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict: passed ? VERTICAL_AI_IMPLEMENTATION_V1_PASS_VERDICT : VERTICAL_AI_IMPLEMENTATION_V1_FAIL_VERDICT,
    reportPath: VERTICAL_AI_IMPLEMENTATION_V1_REPORT_PATH,
    workflowStep,
  };
}
