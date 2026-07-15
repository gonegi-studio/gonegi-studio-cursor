import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_BRAIN_ARCHITECTURE_VERSION } from './projectBrainFoundationV1.js';
import { captureCycleSnapshot } from './implementationCycleV1Engine.js';
import {
  PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH,
  PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH,
} from './projectBrainWaveDDevelopmentPluginsV1.js';
import { PROJECT_BRAIN_LPM_V1_PATH } from './projectBrainWaveBLpmMaterializationV1Engine.js';
import { PROJECT_BRAIN_V1_FREEZE_V1_PATH } from './projectBrainOperationModeActivationV1Engine.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import {
  discoverEvidenceBasedVerticalAiImplementationCandidates,
  materializeVerifiedRepositoryTruthForVerticalAiSelection,
  VERTICAL_AI_IMPLEMENTATION_CANDIDATES,
  type VerticalAiDiscoveryInput,
} from './verticalAiImplementationSelectionV1.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PHASE =
  'PHASE-VERTICAL-AI-OPPORTUNITY-IDENTIFICATION-V1' as const;
export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1' as const;
export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1' as const;
export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_STATUS =
  'VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_COMPLETE' as const;

export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_DIR =
  'datasets/stage7/vertical_ai_opportunity_identification_v1' as const;
export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PATH =
  `${VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_DIR}/vertical-ai-opportunity-identification-v1.json` as const;
export const VERTICAL_AI_REPOSITORY_TRUTH_SCAN_V1_PATH =
  `${VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_DIR}/vertical-ai-repository-truth-scan-v1.json` as const;
export const VERTICAL_AI_GOAL_TRUTH_RESOLUTION_V1_PATH =
  `${VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_DIR}/vertical-ai-goal-truth-resolution-v1.json` as const;
export const VERTICAL_AI_IMPLEMENTATION_OPPORTUNITIES_V1_PATH =
  `${VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_DIR}/vertical-ai-implementation-opportunities-v1.json` as const;
export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_REPORT_PATH =
  'reports/stage7/VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_REPORT.json' as const;

const PROJECT_ENTITY_EXTRACTION_V1_PATH =
  'datasets/repository_intelligence/project-entity-extraction-v1.json' as const;

const DISCOVERY_BASIS = [
  'repository_truth',
  'current_project_truth',
  'current_goal_truth',
  'operational_constraints',
  'development_intelligence',
] as const;

const EXECUTION_FLAGS = {
  vertical_ai_opportunity_identification_v1: true as const,
  read_only: true as const,
  metadata_only: true as const,
  brain_modification: false as const,
  architecture_changes: false as const,
  lpm_mutation: false as const,
  execute_authorized: false as const,
  manual_phase_selection: false as const,
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function gapEvidenceSupportsOpportunity(gap: { severity: string; evidence: string }): boolean {
  if (gap.severity === 'high' || gap.severity === 'critical') {
    return true;
  }
  const evidence = gap.evidence.toLowerCase();
  if (
    evidence.includes('=0') ||
    evidence.includes('zero_') ||
    evidence.includes('=none') ||
    evidence.includes('undercover=none')
  ) {
    return false;
  }
  return gap.severity === 'medium';
}

function computeDecisionFingerprint(input: {
  repositoryTruthFingerprint: string;
  projectTruthFingerprint: string;
  goalTruthFingerprint: string;
  operationalConstraintsFingerprint: string;
  developmentPlanId: string | null;
  opportunityIds: string[];
}): string {
  return [
    `repository=${input.repositoryTruthFingerprint}`,
    `project=${input.projectTruthFingerprint}`,
    `goal=${input.goalTruthFingerprint}`,
    `constraints=${input.operationalConstraintsFingerprint}`,
    `dev_plan=${input.developmentPlanId ?? 'none'}`,
    `opportunities=${input.opportunityIds.join(',') || 'none'}`,
  ].join('|');
}

export function writeVerticalAiOpportunityIdentificationV1EngineReport(): {
  passed: boolean;
  verdict: string;
  reportPath: string;
  opportunityCount: number;
} {
  const root = resolveProjectRoot();
  const generatedAt = new Date().toISOString();
  const issues: Array<{ code: string; message: string; severity: string }> = [];

  const inventoryExists = fs.existsSync(path.join(root, PROJECT_ENTITY_EXTRACTION_V1_PATH));
  const lpmExists = fs.existsSync(path.join(root, PROJECT_BRAIN_LPM_V1_PATH));
  const goalModelExists = fs.existsSync(
    path.join(root, 'datasets/project_brain/goal_model_v1/project-brain-goal-model-v1.json')
  );

  if (!inventoryExists) {
    issues.push({ code: 'PREREQ', message: 'Inventory v1 required', severity: 'error' });
  }
  if (!lpmExists) {
    issues.push({ code: 'PREREQ', message: 'LPM required', severity: 'error' });
  }
  if (!goalModelExists) {
    issues.push({ code: 'GOAL_TRUTH', message: 'Current Goal Truth required', severity: 'error' });
  }

  const precheckPassed = inventoryExists && lpmExists && goalModelExists;
  let goalTruth: ReturnType<typeof loadCurrentGoalTruth> | null = null;
  let discoveredRegistry: ReturnType<
    typeof discoverEvidenceBasedVerticalAiImplementationCandidates
  > = [];
  let gapOpportunities: Array<{
    opportunity_id: string;
    category: string;
    title: string;
    evidence: string[];
    truth_sources: string[];
    evidence_score: number;
  }> = [];
  let decisionFingerprint = '';
  let materializationFingerprint = '';
  let repositoryTruthFingerprint = '';
  let projectTruthFingerprint = '';
  let registrySatisfiedCount = 0;

  if (precheckPassed) {
    goalTruth = loadCurrentGoalTruth(root);
    const snapshot = captureCycleSnapshot(root);

    repositoryTruthFingerprint = [
      `inventory=${inventoryExists}`,
      `entities=${snapshot.entity_count}`,
      `gap=${snapshot.gap_report_id}`,
    ].join(':');

    projectTruthFingerprint = [
      `goal=${goalTruth.fingerprint}`,
      `lpm=${snapshot.entity_count}`,
      `gap=${snapshot.gap_report_id}`,
    ].join(':');

    writeJson(root, VERTICAL_AI_REPOSITORY_TRUTH_SCAN_V1_PATH, {
      vertical_ai_repository_truth_scan_v1_id: 'vertical_ai_repository_truth_scan_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PHASE,
      generated_at: generatedAt,
      mode: 'READ_ONLY',
      inventory_v1_ref: PROJECT_ENTITY_EXTRACTION_V1_PATH,
      snapshot,
      repository_truth_fingerprint: repositoryTruthFingerprint,
      materialization_pending: true,
    });

    writeJson(root, VERTICAL_AI_GOAL_TRUTH_RESOLUTION_V1_PATH, {
      vertical_ai_goal_truth_resolution_v1_id: 'vertical_ai_goal_truth_resolution_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PHASE,
      generated_at: generatedAt,
      mode: 'READ_ONLY',
      goal_truth_fingerprint: goalTruth.fingerprint,
      evaluated_goals: goalTruth.evaluated_goals,
      satisfied_goals: goalTruth.satisfied_goals,
      active_goal_ids: goalTruth.entries.map((e) => e.goal_id),
      entries: goalTruth.entries,
    });

    const v1Freeze = fs.existsSync(path.join(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH))
      ? readJson<{ verdict: string }>(root, PROJECT_BRAIN_V1_FREEZE_V1_PATH)
      : null;

    const devIntelligence = fs.existsSync(
      path.join(root, PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH)
    )
      ? readJson<{ development_plan: { plan_id: string } }>(
          root,
          PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH
        )
      : null;

    const operationalConstraintsRespected =
      v1Freeze?.verdict === 'PASS_PROJECT_BRAIN_V1_FROZEN' &&
      EXECUTION_FLAGS.brain_modification === false &&
      EXECUTION_FLAGS.manual_phase_selection === false;

    const constraintsFingerprint = [
      `frozen=${operationalConstraintsRespected}`,
      `brain_mod=${EXECUTION_FLAGS.brain_modification}`,
      `manual=${EXECUTION_FLAGS.manual_phase_selection}`,
      `exec=${EXECUTION_FLAGS.execute_authorized}`,
    ].join(':');

    const materialization = materializeVerifiedRepositoryTruthForVerticalAiSelection(root);
    materializationFingerprint = materialization.fingerprint;
    registrySatisfiedCount = materialization.entries.filter((e) => e.satisfied).length;

    const discoveryInput: VerticalAiDiscoveryInput = {
      repositoryTruthFingerprint,
      projectTruthFingerprint,
      goalTruthFingerprint: goalTruth.fingerprint,
      activeGoalIds: goalTruth.entries.map((e) => e.goal_id),
      operationalConstraintsRespected,
      developmentPlanId: devIntelligence?.development_plan.plan_id ?? null,
      inventoryExists,
    };

    discoveredRegistry = discoverEvidenceBasedVerticalAiImplementationCandidates(
      materialization,
      discoveryInput
    );

    if (fs.existsSync(path.join(root, PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH))) {
      const gapAnalysis = readJson<{
        gap_analysis_report: {
          gaps: Array<{ gap_id: string; severity: string; evidence: string }>;
          development_candidates: Array<{
            candidate_id: string;
            gap_id: string;
            title: string;
            confidence: number;
          }>;
        };
      }>(root, PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH);

      const gapById = new Map(
        gapAnalysis.gap_analysis_report.gaps.map((gap) => [gap.gap_id, gap])
      );

      for (const devCandidate of gapAnalysis.gap_analysis_report.development_candidates) {
        const gap = gapById.get(devCandidate.gap_id);
        if (!gap || !gapEvidenceSupportsOpportunity(gap)) {
          continue;
        }
        gapOpportunities.push({
          opportunity_id: devCandidate.candidate_id,
          category: 'gap_development_intelligence',
          title: devCandidate.title,
          evidence: [
            `gap_id=${devCandidate.gap_id}`,
            `gap_severity=${gap.severity}`,
            `gap_evidence=${gap.evidence}`,
            `confidence=${devCandidate.confidence}`,
          ],
          truth_sources: ['repository_truth', 'current_project_truth', 'development_intelligence'],
          evidence_score: Math.round(devCandidate.confidence * 100),
        });
      }
    }

    const registryOpportunities = discoveredRegistry.map((candidate) => ({
      opportunity_id: `registry_${candidate.candidate_id}`,
      category: 'registry_repository_truth',
      title: `Pending registry candidate: ${candidate.candidate_id}`,
      plan_phase: candidate.plan_phase,
      candidate_id: candidate.candidate_id,
      evidence_score: candidate.evidence_score,
      evidence_sources: candidate.evidence_sources,
      evidence: [
        `candidate_id=${candidate.candidate_id}`,
        `plan_phase=${candidate.plan_phase}`,
        `evidence_score=${candidate.evidence_score}`,
        `evidence_sources=${candidate.evidence_sources.join(',')}`,
        `dependencies_satisfied=${candidate.dependencies_satisfied}`,
        `repository_verdict=${candidate.repository_verdict ?? 'pending'}`,
      ],
      truth_sources: candidate.evidence_sources,
    }));

    const allOpportunities = [...registryOpportunities, ...gapOpportunities];
    const opportunityIds = allOpportunities.map((o) => o.opportunity_id);

    decisionFingerprint = computeDecisionFingerprint({
      repositoryTruthFingerprint,
      projectTruthFingerprint,
      goalTruthFingerprint: goalTruth.fingerprint,
      operationalConstraintsFingerprint: constraintsFingerprint,
      developmentPlanId: devIntelligence?.development_plan.plan_id ?? null,
      opportunityIds,
    });

    writeJson(root, VERTICAL_AI_IMPLEMENTATION_OPPORTUNITIES_V1_PATH, {
      vertical_ai_implementation_opportunities_v1_id:
        'vertical_ai_implementation_opportunities_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PHASE,
      generated_at: generatedAt,
      mode: 'READ_ONLY',
      discovery_basis: DISCOVERY_BASIS,
      registry_records_decisions_only: true,
      manual_phase_selection: false,
      discovery_input: discoveryInput,
      materialization_fingerprint: materializationFingerprint,
      registry_satisfied: materialization.entries.filter((e) => e.satisfied).length,
      registry_total: VERTICAL_AI_IMPLEMENTATION_CANDIDATES.length,
      discovered_registry_count: discoveredRegistry.length,
      gap_opportunity_count: gapOpportunities.length,
      opportunity_count: allOpportunities.length,
      opportunities: allOpportunities,
      decision_fingerprint: decisionFingerprint,
      identification_outcome:
        allOpportunities.length > 0 ? 'opportunities_identified' : 'no_evidence_supported_opportunities',
    });

    writeJson(root, VERTICAL_AI_REPOSITORY_TRUTH_SCAN_V1_PATH, {
      vertical_ai_repository_truth_scan_v1_id: 'vertical_ai_repository_truth_scan_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PHASE,
      generated_at: generatedAt,
      mode: 'READ_ONLY',
      inventory_v1_ref: PROJECT_ENTITY_EXTRACTION_V1_PATH,
      snapshot,
      repository_truth_fingerprint: repositoryTruthFingerprint,
      materialization_fingerprint: materializationFingerprint,
      satisfied_count: materialization.entries.filter((e) => e.satisfied).length,
      pending_count:
        VERTICAL_AI_IMPLEMENTATION_CANDIDATES.length -
        materialization.entries.filter((e) => e.satisfied).length,
    });

    if (goalTruth.evaluated_goals === 0) {
      issues.push({
        code: 'GOAL_TRUTH',
        message: 'No goals evaluated in Current Goal Truth',
        severity: 'error',
      });
    }
  }

  const opportunityCount =
    discoveredRegistry.length +
    gapOpportunities.length;

  const identificationPassed =
    precheckPassed &&
    goalTruth !== null &&
    goalTruth.evaluated_goals > 0 &&
    materializationFingerprint.length > 0 &&
    issues.length === 0;

  const passed = identificationPassed;
  const verdict = passed
    ? VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PASS_VERDICT
    : VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_FAIL_VERDICT;

  writeJson(root, VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PATH, {
    vertical_ai_opportunity_identification_v1_id: 'vertical_ai_opportunity_identification_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    final_verdict: verdict,
    decision_fingerprint: decisionFingerprint,
    opportunity_count: opportunityCount,
    repository_truth_scan_ref: VERTICAL_AI_REPOSITORY_TRUTH_SCAN_V1_PATH,
    goal_truth_resolution_ref: VERTICAL_AI_GOAL_TRUTH_RESOLUTION_V1_PATH,
    opportunities_ref: VERTICAL_AI_IMPLEMENTATION_OPPORTUNITIES_V1_PATH,
    lpm_mutation: false,
    brain_modification: false,
  });

  const report = {
    report_id: `vertical_ai_opportunity_identification_v1_${Date.now()}`,
    phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    goal: 'Identify evidence-supported implementation opportunities from the current Repository Truth.',
    vertical_ai_opportunity_identification_v1_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_STATUS
      : 'VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_FAILED',
    decision_fingerprint: decisionFingerprint,
    goal_truth_fingerprint: goalTruth?.fingerprint ?? null,
    opportunity_count: opportunityCount,
    registry_satisfied: registrySatisfiedCount,
    registry_total: VERTICAL_AI_IMPLEMENTATION_CANDIDATES.length,
    repository_truth_scan_ref: VERTICAL_AI_REPOSITORY_TRUTH_SCAN_V1_PATH,
    goal_truth_resolution_ref: VERTICAL_AI_GOAL_TRUTH_RESOLUTION_V1_PATH,
    opportunities_ref: VERTICAL_AI_IMPLEMENTATION_OPPORTUNITIES_V1_PATH,
    identification_ref: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_PATH,
    checks: {
      PREREQ: precheckPassed,
      REPOSITORY_TRUTH_SCANNED: precheckPassed,
      GOAL_TRUTH_RESOLVED: goalTruth !== null && (goalTruth?.evaluated_goals ?? 0) > 0,
      EVIDENCE_BASED_DISCOVERY: precheckPassed,
      MANUAL_PHASE_SELECTION_FALSE: true,
      OPPORTUNITIES_IDENTIFIED: true,
      NO_LPM_MUTATION: true,
      READ_ONLY: true,
      EXECUTE_AUTHORIZED_FALSE: true,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V1_REPORT_PATH,
    opportunityCount,
  };
}
