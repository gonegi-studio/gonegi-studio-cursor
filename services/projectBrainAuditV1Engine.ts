import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_BRAIN_ARCHITECTURE_VERSION, PROJECT_BRAIN_INVENTORY_V1_PATH } from './projectBrainFoundationV1.js';
import type { LivingProjectModelV1 } from './projectBrainQualityContractEvaluatorV1Engine.js';
import {
  GPU_RUNTIME_FOUNDATION_V1_PASS_VERDICT,
  GPU_RUNTIME_FOUNDATION_V1_PATH,
  GPU_RUNTIME_FOUNDATION_V1_REPORT_PATH,
} from './gpuRuntimeFoundationV1Engine.js';
import {
  PROJECT_BRAIN_OPERATIONAL_BASELINE_V1_PATH,
} from './projectBrainOperationModeActivationV1Engine.js';
import {
  PROJECT_BRAIN_LPM_V1_PATH,
} from './projectBrainWaveBLpmMaterializationV1Engine.js';
import {
  PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH,
} from './projectBrainWaveCSemanticUnderstandingV1Engine.js';
import {
  PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH,
  PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH,
  PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
  type GapAnalysisArtifact,
  type GoalIntelligenceArtifact,
} from './projectBrainWaveDDevelopmentPluginsV1.js';
import { PROJECT_BRAIN_SYNC_V1_PASS_VERDICT, PROJECT_BRAIN_SYNC_V1_REPORT_PATH } from './projectBrainSyncV1Engine.js';
import { STAGE7_IMPLEMENTATION_V1_PATH } from './stage7BootstrapV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_BRAIN_AUDIT_PHASE = 'PHASE-201J-PROJECT-BRAIN-AUDIT' as const;
export const PROJECT_BRAIN_AUDIT_V1_SYSTEM_ID = 'PROJECT_BRAIN_AUDIT_V1' as const;
export const PROJECT_BRAIN_AUDIT_V1_PASS_VERDICT = 'PASS_PROJECT_BRAIN_AUDIT_V1' as const;
export const PROJECT_BRAIN_AUDIT_V1_FAIL_VERDICT = 'FAIL_PROJECT_BRAIN_AUDIT_V1' as const;
export const PROJECT_BRAIN_AUDIT_V1_STATUS = 'PROJECT_BRAIN_AUDIT_COMPLETE' as const;
export const PROJECT_BRAIN_AUDIT_V1_PRECHECK_VERDICT = GPU_RUNTIME_FOUNDATION_V1_PASS_VERDICT;

export const PROJECT_BRAIN_AUDIT_V1_DIR = 'datasets/project_brain/audit_v1' as const;
export const PROJECT_BRAIN_AUDIT_V1_PATH =
  `${PROJECT_BRAIN_AUDIT_V1_DIR}/project-brain-audit-v1.json` as const;
export const PROJECT_UNDERSTANDING_AUDIT_V1_PATH =
  `${PROJECT_BRAIN_AUDIT_V1_DIR}/project-understanding-audit-v1.json` as const;
export const CAPABILITY_COVERAGE_AUDIT_V1_PATH =
  `${PROJECT_BRAIN_AUDIT_V1_DIR}/capability-coverage-audit-v1.json` as const;
export const GAP_ANALYSIS_AUDIT_V1_PATH =
  `${PROJECT_BRAIN_AUDIT_V1_DIR}/gap-analysis-audit-v1.json` as const;
export const DEVELOPMENT_INTELLIGENCE_AUDIT_V1_PATH =
  `${PROJECT_BRAIN_AUDIT_V1_DIR}/development-intelligence-audit-v1.json` as const;
export const IMPLEMENTATION_PLAN_REASONING_AUDIT_V1_PATH =
  `${PROJECT_BRAIN_AUDIT_V1_DIR}/implementation-plan-reasoning-audit-v1.json` as const;
export const BRAIN_READINESS_CERTIFICATION_V1_PATH =
  `${PROJECT_BRAIN_AUDIT_V1_DIR}/brain-readiness-certification-v1.json` as const;
export const PROJECT_BRAIN_AUDIT_CONTRACTS_V1_PATH =
  `${PROJECT_BRAIN_AUDIT_V1_DIR}/project-brain-audit-contracts-v1.json` as const;
export const PROJECT_BRAIN_AUDIT_V1_REGISTRY_PATH =
  `${PROJECT_BRAIN_AUDIT_V1_DIR}/project-brain-audit-v1-registry.json` as const;
export const PROJECT_BRAIN_AUDIT_V1_REPORT_PATH =
  'reports/project_brain/PROJECT_BRAIN_AUDIT_V1_REPORT.json' as const;
export const PROJECT_BRAIN_AUDIT_V1_VERSION = 'project_brain_audit_v1' as const;

export const PBA_CONTRACT_IDS = [
  'PBA_PROJECT_UNDERSTANDING_VALID',
  'PBA_CAPABILITY_COVERAGE_VALID',
  'PBA_GAP_ANALYSIS_VALID',
  'PBA_DEVELOPMENT_INTELLIGENCE_VALID',
  'PBA_IMPLEMENTATION_PLAN_REASONING_VALID',
  'PBA_READINESS_CERTIFIED',
] as const;

const STAGE7_PHASE_CHAIN_BASE = [
  { phase: 'PHASE-201-STAGE7-BOOTSTRAP', report: 'reports/stage7/STAGE7_BOOTSTRAP_V1_REPORT.json' },
  { phase: 'PHASE-201A-PRODUCTION-PIPELINE', report: 'reports/stage7/PRODUCTION_PIPELINE_FOUNDATION_V1_REPORT.json' },
  { phase: 'PHASE-201B-GENERATION-PIPELINE', report: 'reports/stage7/GENERATION_PIPELINE_V1_REPORT.json' },
  { phase: 'PHASE-201C-PRODUCTION-RUNTIME', report: 'reports/stage7/PRODUCTION_RUNTIME_V1_REPORT.json' },
  { phase: 'PHASE-201D-CINEMATIC-FIDELITY', report: 'reports/stage7/CINEMATIC_FIDELITY_V1_REPORT.json' },
  { phase: 'PHASE-201E-PRODUCTION-VALIDATION', report: 'reports/stage7/STAGE7_PRODUCTION_READINESS_V1_REPORT.json' },
  { phase: 'PHASE-201F-GAP-RESOLUTION', report: 'reports/stage7/STAGE7_GAP_RESOLUTION_V1_REPORT.json' },
  { phase: 'PHASE-PROJECT-BRAIN-SYNC-V1', report: 'reports/project_brain/PROJECT_BRAIN_SYNC_V1_REPORT.json', pass: PROJECT_BRAIN_SYNC_V1_PASS_VERDICT },
  { phase: 'PHASE-201I-GPU-RUNTIME-FOUNDATION', report: GPU_RUNTIME_FOUNDATION_V1_REPORT_PATH, pass: GPU_RUNTIME_FOUNDATION_V1_PASS_VERDICT },
] as const;

const STAGE7_PHASE_CHAIN_EXTENDED = [
  { phase: 'PHASE-201K-EXPORT-MATERIALIZATION-INTEGRATION', report: 'reports/stage7/EXPORT_MATERIALIZATION_INTEGRATION_V1_REPORT.json', pass: 'PASS_EXPORT_MATERIALIZATION_INTEGRATION_V1' },
  { phase: 'PHASE-201L-GENERATION-RUNTIME-VALIDATION', report: 'reports/stage7/GENERATION_RUNTIME_VALIDATION_V1_REPORT.json', pass: 'PASS_GENERATION_RUNTIME_VALIDATION_V1' },
  { phase: 'PHASE-201M-BRAIN-HANDOFF-FOUNDATION', report: 'reports/stage7/STAGE7_BRAIN_HANDOFF_FOUNDATION_V1_REPORT.json', pass: 'PASS_STAGE7_BRAIN_HANDOFF_FOUNDATION_V1' },
  { phase: 'PHASE-201N-STAGE7-VERIFY-COVERAGE-EXPANSION', report: 'reports/stage7/STAGE7_VERIFY_COVERAGE_EXPANSION_V1_REPORT.json', pass: 'PASS_STAGE7_VERIFY_COVERAGE_EXPANSION_V1' },
  { phase: 'PHASE-201O-STAGE7-LOW-CONFIDENCE-REMEDIATION', report: 'reports/stage7/STAGE7_LOW_CONFIDENCE_REMEDIATION_V1_REPORT.json', pass: 'PASS_STAGE7_LOW_CONFIDENCE_REMEDIATION_V1' },
  { phase: 'PHASE-201P-STAGE7-PRODUCTION-VERIFY-BINDING', report: 'reports/stage7/STAGE7_PRODUCTION_VERIFY_BINDING_V1_REPORT.json', pass: 'PASS_STAGE7_PRODUCTION_VERIFY_BINDING_V1' },
  { phase: 'PHASE-201Q-STAGE7-RUNTIME-VERIFY-CLOSURE', report: 'reports/stage7/STAGE7_RUNTIME_VERIFY_CLOSURE_V1_REPORT.json', pass: 'PASS_STAGE7_RUNTIME_VERIFY_CLOSURE_V1' },
  { phase: 'PHASE-201R-STAGE7-BRAIN-HANDOFF-CERTIFICATION', report: 'reports/stage7/STAGE7_BRAIN_HANDOFF_CERTIFICATION_V1_REPORT.json', pass: 'PASS_STAGE7_BRAIN_HANDOFF_CERTIFICATION_V1' },
] as const;

const RUNTIME_TRACK_ACCEPTED_STATUSES = ['FOUNDATION_COMPLETE', 'RUNTIME_VALIDATED'] as const;
const BRAIN_HANDOFF_TRACK_ACCEPTED_STATUSES = ['VERIFY_COVERAGE_CLOSED', 'BRAIN_HANDOFF_CERTIFIED'] as const;
const DEVELOPMENT_PLAN_COMPLETENESS_ATTESTATION_V1_PATH =
  'datasets/stage7/brain_audit_reconciliation_v1/development-plan-completeness-attestation-v1.json' as const;

function resolveStage7PhaseChain(root: string, implementation?: {
  implementation_tracks: Array<{ track_id: string; status: string }>;
}) {
  const handoffCertified =
    implementation?.implementation_tracks.find((t) => t.track_id === 'track_brain_handoff')
      ?.status === 'BRAIN_HANDOFF_CERTIFIED';
  const reconciliationExists = fs.existsSync(
    path.join(root, 'datasets/stage7/brain_audit_reconciliation_v1/audit-phase-chain-reconciliation-v1.json')
  );
  if (handoffCertified || reconciliationExists) {
    return [...STAGE7_PHASE_CHAIN_BASE, ...STAGE7_PHASE_CHAIN_EXTENDED];
  }
  return [...STAGE7_PHASE_CHAIN_BASE];
}

const EXECUTION_FLAGS = {
  project_brain_audit_v1: true as const,
  project_brain_operation_mode_v1: true as const,
  read_only: true as const,
  metadata_only: true as const,
  execute_authorized: false as const,
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

const MIN_SYNCED_LPM_ENTITY_COUNT = 2800 as const;

function auditProjectUnderstanding(
  lpm: LivingProjectModelV1,
  goalArtifact: GoalIntelligenceArtifact,
  baseline: Record<string, unknown>
) {
  const activeGoals = goalArtifact.goal_model.goals.filter((g) => g.active);
  const satisfiedGoals = goalArtifact.goal_intelligence_result.alignment_report.entries as Array<{
    goal_id: string;
    satisfied: boolean;
    satisfaction_score: number;
  }>;
  const criticalHighSatisfied = satisfiedGoals.filter(
    (e) => e.satisfied && e.satisfaction_score >= 0.8
  );

  const stage7EngineCount = lpm.entities.filter((e) =>
    /stage7|productionpipeline|generationpipeline|cinematicfidelity|productionruntime|gpuruntime|projectbrain|gapresolution|productionvalidation/i.test(
      String(e.inventory_ref ?? '')
    )
  ).length;

  const inventoryAligned = lpm.inventory_v1_ref === PROJECT_BRAIN_INVENTORY_V1_PATH;

  const valid =
    inventoryAligned &&
    lpm.entities.length >= MIN_SYNCED_LPM_ENTITY_COUNT &&
    lpm.capabilities.length >= 10 &&
    lpm.knowledge.length >= 20 &&
    activeGoals.length >= 5 &&
    criticalHighSatisfied.length >= 4 &&
    baseline.sync_status === 'SYNCHRONIZED' &&
    stage7EngineCount >= 8;

  return {
    project_understanding_audit_v1_id: 'project_understanding_audit_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: PROJECT_BRAIN_AUDIT_PHASE,
    generated_at: new Date().toISOString(),
    entity_count: lpm.entities.length,
    capability_count: lpm.capabilities.length,
    knowledge_count: lpm.knowledge.length,
    workflow_count: lpm.workflows.length,
    active_goal_count: activeGoals.length,
    satisfied_critical_high_count: criticalHighSatisfied.length,
    stage7_engine_count: stage7EngineCount,
    inventory_aligned: inventoryAligned,
    baseline_status: baseline.baseline_status,
    sync_status: baseline.sync_status,
    valid,
  };
}

function auditCapabilityCoverage(
  lpm: LivingProjectModelV1,
  capabilityModel: { capabilities: Array<{ capability_id: string; entity_count: number }> }
) {
  const undercover = lpm.capabilities.filter(
    (c) => ((c.entity_ids as string[]) ?? []).length === 0
  );
  const modelMismatches = capabilityModel.capabilities.filter((cm) => {
    const lpmCap = lpm.capabilities.find((c) => String(c.capability_id) === cm.capability_id);
    const lpmCount = ((lpmCap?.entity_ids as string[]) ?? []).length;
    return lpmCount !== cm.entity_count;
  });

  const productionCaps = [
    'cap_narrative_production',
    'cap_cinematic_generation',
    'cap_movie_reconstruction',
    'cap_source_video_analysis',
    'cap_production_runtime',
    'cap_export_materialization',
    'cap_project_brain_intelligence',
  ];
  const productionCovered = productionCaps.every((capId) => {
    const cm = capabilityModel.capabilities.find((c) => c.capability_id === capId);
    return (cm?.entity_count ?? 0) >= 1;
  });

  const valid =
    undercover.length === 0 &&
    modelMismatches.length === 0 &&
    productionCovered &&
    capabilityModel.capabilities.length >= 10;

  return {
    capability_coverage_audit_v1_id: 'capability_coverage_audit_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: PROJECT_BRAIN_AUDIT_PHASE,
    generated_at: new Date().toISOString(),
    capability_count: capabilityModel.capabilities.length,
    undercover_count: undercover.length,
    model_mismatch_count: modelMismatches.length,
    production_capabilities_covered: productionCovered,
    valid,
  };
}

function auditGapAnalysis(gapAnalysis: GapAnalysisArtifact, lpm: LivingProjectModelV1) {
  const gaps = gapAnalysis.gap_analysis_report.gaps;
  const highGaps = gaps.filter((g) => g.severity === 'high' || g.severity === 'critical');
  const undercoverGap = gaps.find((g) => g.rule_id === 'GR_CAPABILITY_UNDERCOVER');
  const mandatoryEvaluated =
    gapAnalysis.gap_analysis_report.mandatory_rules_evaluated.length >= 5;
  const allEvaluated = gaps.every((g) => g.evaluated);

  const lpmUndercover = lpm.capabilities.filter(
    (c) => ((c.entity_ids as string[]) ?? []).length === 0
  );
  const consistent =
    undercoverGap?.evidence.includes('none') === true && lpmUndercover.length === 0;

  const valid =
    mandatoryEvaluated &&
    allEvaluated &&
    highGaps.length === 0 &&
    consistent &&
    gapAnalysis.living_project_model_ref === PROJECT_BRAIN_LPM_V1_PATH;

  return {
    gap_analysis_audit_v1_id: 'gap_analysis_audit_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: PROJECT_BRAIN_AUDIT_PHASE,
    generated_at: new Date().toISOString(),
    gap_count: gaps.length,
    high_severity_count: highGaps.length,
    medium_severity_count: gaps.filter((g) => g.severity === 'medium').length,
    mandatory_rules_evaluated: gapAnalysis.gap_analysis_report.mandatory_rules_evaluated.length,
    lpm_consistent: consistent,
    valid,
  };
}

function auditDevelopmentIntelligence(
  devIntel: {
    dependency_analysis: {
      capability_dependencies: Array<{ capability_id: string; entity_count: number }>;
    };
    confidence_scoring: { aggregate_confidence: number; goal_alignment_confidence: number };
    development_plan: { phases: unknown[] };
  },
  lpm: LivingProjectModelV1,
  gapAnalysis: GapAnalysisArtifact,
  root: string
) {
  const brainCap = devIntel.dependency_analysis.capability_dependencies.find(
    (c) => c.capability_id === 'cap_project_brain_intelligence'
  );
  const lpmBrain = lpm.capabilities.find((c) => String(c.capability_id) === 'cap_project_brain_intelligence');
  const lpmBrainCount = ((lpmBrain?.entity_ids as string[]) ?? []).length;

  const entityCountAligned = (brainCap?.entity_count ?? 0) === lpmBrainCount;
  const candidatesMatch =
    gapAnalysis.gap_analysis_report.development_candidates.length >= 1;
  const confidenceValid =
    devIntel.confidence_scoring.aggregate_confidence >= 0.85 &&
    devIntel.confidence_scoring.goal_alignment_confidence >= 0.95;

  const highGaps = gapAnalysis.gap_analysis_report.gaps.filter(
    (g) => g.severity === 'high' || g.severity === 'critical'
  );
  const planAttestation = fs.existsSync(path.join(root, DEVELOPMENT_PLAN_COMPLETENESS_ATTESTATION_V1_PATH))
    ? readJson<{ complete: boolean; maintenance_mode: boolean }>(
        root,
        DEVELOPMENT_PLAN_COMPLETENESS_ATTESTATION_V1_PATH
      )
    : null;
  const planPhaseValid =
    devIntel.development_plan.phases.length >= 3 ||
    (planAttestation?.complete === true && highGaps.length === 0) ||
    (highGaps.length === 0 && devIntel.development_plan.phases.length >= 2);

  const valid =
    entityCountAligned &&
    candidatesMatch &&
    confidenceValid &&
    planPhaseValid;

  return {
    development_intelligence_audit_v1_id: 'development_intelligence_audit_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: PROJECT_BRAIN_AUDIT_PHASE,
    generated_at: new Date().toISOString(),
    aggregate_confidence: devIntel.confidence_scoring.aggregate_confidence,
    goal_alignment_confidence: devIntel.confidence_scoring.goal_alignment_confidence,
    brain_entity_count_aligned: entityCountAligned,
    development_candidate_count: gapAnalysis.gap_analysis_report.development_candidates.length,
    development_plan_phase_count: devIntel.development_plan.phases.length,
    plan_phase_valid: planPhaseValid,
    valid,
  };
}

function auditImplementationPlanReasoning(root: string, implementation: {
  implementation_tracks: Array<{ track_id: string; status: string; phase?: string }>;
  last_phase?: string;
  execute_authorized: boolean;
}) {
  const phaseChain = resolveStage7PhaseChain(root, implementation);
  const phaseResults = phaseChain.map((step) => {
    const full = path.join(root, step.report);
    const exists = fs.existsSync(full);
    const report = exists
      ? readJson<{ final_verdict: string }>(root, step.report)
      : null;
    const expectedPass = 'pass' in step ? step.pass : null;
    const passed = report?.final_verdict?.startsWith('PASS') === true &&
      (expectedPass ? report.final_verdict === expectedPass : true);

    return { phase: step.phase, report_path: step.report, exists, passed };
  });

  const tracks = implementation.implementation_tracks;
  const productionValidated = tracks.find((t) => t.track_id === 'track_production_pipeline')?.status === 'PRODUCTION_VALIDATED';
  const fidelityIntegrated = tracks.find((t) => t.track_id === 'track_cinematic_fidelity')?.status === 'INTEGRATED';
  const runtimeStatus = tracks.find((t) => t.track_id === 'track_generation_runtime')?.status ?? '';
  const runtimeValidated = RUNTIME_TRACK_ACCEPTED_STATUSES.includes(
    runtimeStatus as (typeof RUNTIME_TRACK_ACCEPTED_STATUSES)[number]
  );
  const handoffStatus = tracks.find((t) => t.track_id === 'track_brain_handoff')?.status ?? '';
  const handoffReady = BRAIN_HANDOFF_TRACK_ACCEPTED_STATUSES.includes(
    handoffStatus as (typeof BRAIN_HANDOFF_TRACK_ACCEPTED_STATUSES)[number]
  );
  const gpuFoundationExists = fs.existsSync(path.join(root, GPU_RUNTIME_FOUNDATION_V1_PATH));

  const passedPhases = phaseResults.filter((p) => p.passed);
  const lastPassed = passedPhases[passedPhases.length - 1];

  const reasoningValid =
    passedPhases.length >= 8 &&
    productionValidated === true &&
    fidelityIntegrated === true &&
    runtimeValidated === true &&
    handoffReady === true &&
    gpuFoundationExists &&
    implementation.execute_authorized === false;

  return {
    implementation_plan_reasoning_audit_v1_id: 'implementation_plan_reasoning_audit_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: PROJECT_BRAIN_AUDIT_PHASE,
    generated_at: new Date().toISOString(),
    phase_chain: phaseResults,
    phases_passed: passedPhases.length,
    track_production_pipeline: productionValidated,
    track_cinematic_fidelity: fidelityIntegrated,
    track_generation_runtime: runtimeValidated,
    track_brain_handoff: handoffReady,
    gpu_foundation_materialized: gpuFoundationExists,
    last_implementation_plan_phase: lastPassed?.phase ?? 'PHASE-201I-GPU-RUNTIME-FOUNDATION',
    last_implementation_plan_verdict: lastPassed
      ? readJson<{ final_verdict: string }>(root, lastPassed.report_path).final_verdict
      : GPU_RUNTIME_FOUNDATION_V1_PASS_VERDICT,
    reasoning_valid: reasoningValid,
  };
}

function buildBrainReadinessCertification(input: {
  understanding: ReturnType<typeof auditProjectUnderstanding>;
  capability: ReturnType<typeof auditCapabilityCoverage>;
  gap: ReturnType<typeof auditGapAnalysis>;
  devIntel: ReturnType<typeof auditDevelopmentIntelligence>;
  planReasoning: ReturnType<typeof auditImplementationPlanReasoning>;
  generatedAt: string;
}) {
  const certified =
    input.understanding.valid &&
    input.capability.valid &&
    input.gap.valid &&
    input.devIntel.valid &&
    input.planReasoning.reasoning_valid;

  return {
    brain_readiness_certification_v1_id: 'brain_readiness_certification_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: PROJECT_BRAIN_AUDIT_PHASE,
    generated_at: input.generatedAt,
    vertical: 'digital_ghibli_video_production',
    certified,
    continue_stage7_implementation: certified,
    execute_authorized: false,
    audit_refs: {
      project_understanding: PROJECT_UNDERSTANDING_AUDIT_V1_PATH,
      capability_coverage: CAPABILITY_COVERAGE_AUDIT_V1_PATH,
      gap_analysis: GAP_ANALYSIS_AUDIT_V1_PATH,
      development_intelligence: DEVELOPMENT_INTELLIGENCE_AUDIT_V1_PATH,
      implementation_plan_reasoning: IMPLEMENTATION_PLAN_REASONING_AUDIT_V1_PATH,
    },
    readiness_verdict: certified ? PROJECT_BRAIN_AUDIT_V1_PASS_VERDICT : PROJECT_BRAIN_AUDIT_V1_FAIL_VERDICT,
  };
}

function validateBrainAuditContracts(input: {
  understanding: ReturnType<typeof auditProjectUnderstanding>;
  capability: ReturnType<typeof auditCapabilityCoverage>;
  gap: ReturnType<typeof auditGapAnalysis>;
  devIntel: ReturnType<typeof auditDevelopmentIntelligence>;
  planReasoning: ReturnType<typeof auditImplementationPlanReasoning>;
  certification: ReturnType<typeof buildBrainReadinessCertification>;
}) {
  const results = [
    {
      contract_id: 'PBA_PROJECT_UNDERSTANDING_VALID',
      verdict: input.understanding.valid ? 'PASS' : 'FAIL',
      evidence: `entities=${input.understanding.entity_count} goals=${input.understanding.satisfied_critical_high_count}`,
    },
    {
      contract_id: 'PBA_CAPABILITY_COVERAGE_VALID',
      verdict: input.capability.valid ? 'PASS' : 'FAIL',
      evidence: `undercover=${input.capability.undercover_count} mismatches=${input.capability.model_mismatch_count}`,
    },
    {
      contract_id: 'PBA_GAP_ANALYSIS_VALID',
      verdict: input.gap.valid ? 'PASS' : 'FAIL',
      evidence: `high=${input.gap.high_severity_count} lpm_consistent=${input.gap.lpm_consistent}`,
    },
    {
      contract_id: 'PBA_DEVELOPMENT_INTELLIGENCE_VALID',
      verdict: input.devIntel.valid ? 'PASS' : 'FAIL',
      evidence: `confidence=${input.devIntel.aggregate_confidence}`,
    },
    {
      contract_id: 'PBA_IMPLEMENTATION_PLAN_REASONING_VALID',
      verdict: input.planReasoning.reasoning_valid ? 'PASS' : 'FAIL',
      evidence: `phases_passed=${input.planReasoning.phases_passed}`,
    },
    {
      contract_id: 'PBA_READINESS_CERTIFIED',
      verdict: input.certification.certified ? 'PASS' : 'FAIL',
      evidence: `continue_stage7=${input.certification.continue_stage7_implementation}`,
    },
  ] as const;

  const pass = results.every((r) => r.verdict === 'PASS');
  return { results, aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const) };
}

export function writeProjectBrainAuditV1EngineReport(): {
  passed: boolean;
  verdict: string;
  reportPath: string;
} {
  const root = resolveProjectRoot();
  const generatedAt = new Date().toISOString();
  const issues: Array<{ code: string; message: string; severity: string }> = [];

  const gpuReport = fs.existsSync(path.join(root, GPU_RUNTIME_FOUNDATION_V1_REPORT_PATH))
    ? readJson<{ final_verdict: string; gpu_runtime_foundation_v1_passed: boolean }>(
        root,
        GPU_RUNTIME_FOUNDATION_V1_REPORT_PATH
      )
    : null;

  const syncReport = fs.existsSync(path.join(root, PROJECT_BRAIN_SYNC_V1_REPORT_PATH))
    ? readJson<{ final_verdict: string; project_brain_sync_v1_passed: boolean }>(
        root,
        PROJECT_BRAIN_SYNC_V1_REPORT_PATH
      )
    : null;

  const implementation = fs.existsSync(path.join(root, STAGE7_IMPLEMENTATION_V1_PATH))
    ? readJson<{
        status: string;
        brain_consumer_refs: Record<string, string>;
        implementation_tracks: Array<{ track_id: string; status: string; phase?: string }>;
        last_phase?: string;
        execute_authorized: boolean;
      }>(root, STAGE7_IMPLEMENTATION_V1_PATH)
    : null;

  const precheckPassed =
    gpuReport?.final_verdict === PROJECT_BRAIN_AUDIT_V1_PRECHECK_VERDICT &&
    gpuReport?.gpu_runtime_foundation_v1_passed === true &&
    syncReport?.final_verdict === PROJECT_BRAIN_SYNC_V1_PASS_VERDICT &&
    syncReport?.project_brain_sync_v1_passed === true &&
    fs.existsSync(path.join(root, PROJECT_BRAIN_LPM_V1_PATH)) &&
    implementation?.status === 'ACTIVE';

  if (!precheckPassed) {
    issues.push({
      code: 'PREREQ',
      message: 'GPU runtime foundation and brain sync must PASS before project brain audit',
      severity: 'error',
    });
  }

  let understanding: ReturnType<typeof auditProjectUnderstanding> | null = null;
  let capability: ReturnType<typeof auditCapabilityCoverage> | null = null;
  let gap: ReturnType<typeof auditGapAnalysis> | null = null;
  let devIntelAudit: ReturnType<typeof auditDevelopmentIntelligence> | null = null;
  let planReasoning: ReturnType<typeof auditImplementationPlanReasoning> | null = null;
  let certification: ReturnType<typeof buildBrainReadinessCertification> | null = null;
  let contractValidation: ReturnType<typeof validateBrainAuditContracts> | null = null;

  if (precheckPassed && implementation) {
    const lpm = readJson<LivingProjectModelV1>(root, PROJECT_BRAIN_LPM_V1_PATH);
    const goalArtifact = readJson<GoalIntelligenceArtifact>(root, PROJECT_BRAIN_GOAL_MODEL_V1_PATH);
    const gapAnalysis = readJson<GapAnalysisArtifact>(root, PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH);
    const devIntel = readJson<{
      dependency_analysis: {
        capability_dependencies: Array<{ capability_id: string; entity_count: number }>;
      };
      confidence_scoring: { aggregate_confidence: number; goal_alignment_confidence: number };
      development_plan: { phases: unknown[] };
    }>(root, PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH);
    const capabilityModel = readJson<{ capabilities: Array<{ capability_id: string; entity_count: number }> }>(
      root,
      PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH
    );
    const baseline = readJson<Record<string, unknown>>(root, PROJECT_BRAIN_OPERATIONAL_BASELINE_V1_PATH);

    understanding = auditProjectUnderstanding(lpm, goalArtifact, baseline);
    capability = auditCapabilityCoverage(lpm, capabilityModel);
    gap = auditGapAnalysis(gapAnalysis, lpm);
    devIntelAudit = auditDevelopmentIntelligence(devIntel, lpm, gapAnalysis, root);
    planReasoning = auditImplementationPlanReasoning(root, implementation);
    certification = buildBrainReadinessCertification({
      understanding,
      capability,
      gap,
      devIntel: devIntelAudit,
      planReasoning,
      generatedAt,
    });

    contractValidation = validateBrainAuditContracts({
      understanding,
      capability,
      gap,
      devIntel: devIntelAudit,
      planReasoning,
      certification,
    });

    writeJson(root, PROJECT_UNDERSTANDING_AUDIT_V1_PATH, understanding);
    writeJson(root, CAPABILITY_COVERAGE_AUDIT_V1_PATH, capability);
    writeJson(root, GAP_ANALYSIS_AUDIT_V1_PATH, gap);
    writeJson(root, DEVELOPMENT_INTELLIGENCE_AUDIT_V1_PATH, devIntelAudit);
    writeJson(root, IMPLEMENTATION_PLAN_REASONING_AUDIT_V1_PATH, planReasoning);
    writeJson(root, BRAIN_READINESS_CERTIFICATION_V1_PATH, certification);

    writeJson(root, PROJECT_BRAIN_AUDIT_V1_PATH, {
      project_brain_audit_v1_id: 'project_brain_audit_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: PROJECT_BRAIN_AUDIT_PHASE,
      generated_at: generatedAt,
      project_understanding_ref: PROJECT_UNDERSTANDING_AUDIT_V1_PATH,
      capability_coverage_ref: CAPABILITY_COVERAGE_AUDIT_V1_PATH,
      gap_analysis_audit_ref: GAP_ANALYSIS_AUDIT_V1_PATH,
      development_intelligence_audit_ref: DEVELOPMENT_INTELLIGENCE_AUDIT_V1_PATH,
      implementation_plan_reasoning_ref: IMPLEMENTATION_PLAN_REASONING_AUDIT_V1_PATH,
      readiness_certification_ref: BRAIN_READINESS_CERTIFICATION_V1_PATH,
      audited: contractValidation.aggregate_verdict === 'PASS',
      execute_authorized: false,
    });

    writeJson(root, PROJECT_BRAIN_AUDIT_CONTRACTS_V1_PATH, {
      project_brain_audit_contracts_v1_id: 'project_brain_audit_contracts_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      generated_at: generatedAt,
      audit_ref: PROJECT_BRAIN_AUDIT_V1_PATH,
      contract_results: contractValidation.results,
      aggregate_verdict: contractValidation.aggregate_verdict,
    });

    writeJson(root, PROJECT_BRAIN_AUDIT_V1_REGISTRY_PATH, {
      registry_id: 'project-brain-audit-v1-registry',
      phase: PROJECT_BRAIN_AUDIT_PHASE,
      version: PROJECT_BRAIN_AUDIT_V1_VERSION,
      precheck_verdict: PROJECT_BRAIN_AUDIT_V1_PRECHECK_VERDICT,
      ...EXECUTION_FLAGS,
    });

    writeJson(root, PROJECT_BRAIN_OPERATIONAL_BASELINE_V1_PATH, {
      ...baseline,
      audit_ref: PROJECT_BRAIN_AUDIT_V1_PATH,
      readiness_certification_ref: BRAIN_READINESS_CERTIFICATION_V1_PATH,
      audit_status: certification.certified ? 'AUDIT_CERTIFIED' : 'NOT_CERTIFIED',
      baseline_status: certification.certified ? 'AUDIT_CERTIFIED' : baseline.baseline_status,
      audited_at: generatedAt,
    });

    writeJson(root, STAGE7_IMPLEMENTATION_V1_PATH, {
      ...implementation,
      project_brain_audit_ref: PROJECT_BRAIN_AUDIT_V1_PATH,
      brain_readiness_certification_ref: BRAIN_READINESS_CERTIFICATION_V1_PATH,
      project_brain_audit_contracts_ref: PROJECT_BRAIN_AUDIT_CONTRACTS_V1_PATH,
      last_phase: PROJECT_BRAIN_AUDIT_PHASE,
      updated_at: generatedAt,
    });
  }

  const passed =
    precheckPassed &&
    understanding?.valid === true &&
    capability?.valid === true &&
    gap?.valid === true &&
    devIntelAudit?.valid === true &&
    planReasoning?.reasoning_valid === true &&
    certification?.certified === true &&
    contractValidation?.aggregate_verdict === 'PASS' &&
    issues.length === 0;

  const report = {
    report_id: `project_brain_audit_v1_${Date.now()}`,
    phase: PROJECT_BRAIN_AUDIT_PHASE,
    generated_at: generatedAt,
    project_brain_audit_v1_passed: passed,
    final_verdict: passed ? PROJECT_BRAIN_AUDIT_V1_PASS_VERDICT : PROJECT_BRAIN_AUDIT_V1_FAIL_VERDICT,
    status: passed ? PROJECT_BRAIN_AUDIT_V1_STATUS : 'PROJECT_BRAIN_AUDIT_FAILED',
    audit_ref: PROJECT_BRAIN_AUDIT_V1_PATH,
    readiness_certification_ref: BRAIN_READINESS_CERTIFICATION_V1_PATH,
    checks: {
      PREREQ: precheckPassed,
      PROJECT_UNDERSTANDING_VALID: understanding?.valid === true,
      CAPABILITY_COVERAGE_VALID: capability?.valid === true,
      GAP_ANALYSIS_VALID: gap?.valid === true,
      DEVELOPMENT_INTELLIGENCE_VALID: devIntelAudit?.valid === true,
      IMPLEMENTATION_PLAN_REASONING_VALID: planReasoning?.reasoning_valid === true,
      READINESS_CERTIFIED: certification?.certified === true,
      CONTRACT_VALIDATION: contractValidation?.aggregate_verdict === 'PASS',
    },
    contract_results: contractValidation?.results ?? [],
    phases_passed: planReasoning?.phases_passed ?? 0,
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, PROJECT_BRAIN_AUDIT_V1_REPORT_PATH, report);

  return {
    passed,
    verdict: report.final_verdict as string,
    reportPath: PROJECT_BRAIN_AUDIT_V1_REPORT_PATH,
  };
}
