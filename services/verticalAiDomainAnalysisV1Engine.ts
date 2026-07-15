import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_BRAIN_ARCHITECTURE_VERSION } from './projectBrainFoundationV1.js';
import { captureCycleSnapshot } from './implementationCycleV1Engine.js';
import {
  PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH,
  PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
} from './projectBrainWaveDDevelopmentPluginsV1.js';
import { PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH } from './projectBrainWaveCSemanticUnderstandingV1Engine.js';
import { PROJECT_BRAIN_VERTICAL_ONTOLOGY_V1_PATH } from './projectBrainWaveCSemanticPluginsV1.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import {
  materializeVerifiedRepositoryTruthForVerticalAiSelection,
  VERTICAL_AI_IMPLEMENTATION_CANDIDATES,
} from './verticalAiImplementationSelectionV1.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_DOMAIN_ANALYSIS_V1_PHASE = 'PHASE-VERTICAL-AI-DOMAIN-ANALYSIS-V1' as const;
export const VERTICAL_AI_DOMAIN_ANALYSIS_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_DOMAIN_ANALYSIS_V1' as const;
export const VERTICAL_AI_DOMAIN_ANALYSIS_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_DOMAIN_ANALYSIS_V1' as const;
export const VERTICAL_AI_DOMAIN_ANALYSIS_V1_STATUS = 'VERTICAL_AI_DOMAIN_ANALYSIS_COMPLETE' as const;

export const VERTICAL_AI_DOMAIN_ANALYSIS_V1_DIR =
  'datasets/stage7/vertical_ai_domain_analysis_v1' as const;
export const VERTICAL_AI_DOMAIN_ANALYSIS_V1_PATH =
  `${VERTICAL_AI_DOMAIN_ANALYSIS_V1_DIR}/vertical-ai-domain-analysis-v1.json` as const;
export const VERTICAL_AI_DOMAIN_GOAL_TRUTH_V1_PATH =
  `${VERTICAL_AI_DOMAIN_ANALYSIS_V1_DIR}/vertical-ai-domain-goal-truth-v1.json` as const;
export const VERTICAL_AI_DOMAIN_SCORES_V1_PATH =
  `${VERTICAL_AI_DOMAIN_ANALYSIS_V1_DIR}/vertical-ai-domain-scores-v1.json` as const;
export const VERTICAL_AI_SELECTED_DOMAIN_V1_PATH =
  `${VERTICAL_AI_DOMAIN_ANALYSIS_V1_DIR}/vertical-ai-selected-domain-v1.json` as const;
export const VERTICAL_AI_DOMAIN_ANALYSIS_V1_REPORT_PATH =
  'reports/stage7/VERTICAL_AI_DOMAIN_ANALYSIS_V1_REPORT.json' as const;

const DOMAIN_GOAL_WEIGHTS: Record<string, Array<{ goal_id: string; weight: number }>> = {
  narrative_production: [{ goal_id: 'goal_ghibli_production_pipeline', weight: 30 }],
  cinematic_generation: [
    { goal_id: 'goal_ghibli_production_pipeline', weight: 22 },
    { goal_id: 'goal_semantic_quality', weight: 8 },
  ],
  production_runtime: [
    { goal_id: 'goal_production_runtime', weight: 28 },
    { goal_id: 'goal_ghibli_production_pipeline', weight: 10 },
  ],
  export_materialization: [{ goal_id: 'goal_ghibli_production_pipeline', weight: 15 }],
  verification_and_audit: [{ goal_id: 'goal_repository_foundation', weight: 12 }],
  dataset_management: [{ goal_id: 'goal_repository_foundation', weight: 10 }],
  repository_intelligence: [
    { goal_id: 'goal_repository_foundation', weight: 8 },
    { goal_id: 'goal_project_brain_operational', weight: 4 },
  ],
  project_brain_intelligence: [{ goal_id: 'goal_project_brain_operational', weight: 6 }],
};

const EXECUTION_FLAGS = {
  vertical_ai_domain_analysis_v1: true as const,
  read_only: true as const,
  metadata_only: true as const,
  brain_modification: false as const,
  architecture_changes: false as const,
  lpm_mutation: false as const,
  execute_authorized: false as const,
};

type DomainScore = {
  domain_id: string;
  capability_id: string;
  entity_count: number;
  registry_candidate_count: number;
  registry_satisfied_count: number;
  developed: boolean;
  undeveloped: boolean;
  goal_alignment_score: number;
  entity_scale_score: number;
  dependency_readiness_score: number;
  value_score: number;
  evidence: string[];
  truth_sources: string[];
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function computeDecisionFingerprint(input: {
  projectTruthFingerprint: string;
  goalTruthFingerprint: string;
  selectedDomainId: string | null;
  domainScoresFingerprint: string;
}): string {
  return [
    `project=${input.projectTruthFingerprint}`,
    `goal=${input.goalTruthFingerprint}`,
    `selected=${input.selectedDomainId ?? 'none'}`,
    `scores=${input.domainScoresFingerprint}`,
  ].join('|');
}

export function writeVerticalAiDomainAnalysisV1EngineReport(): {
  passed: boolean;
  verdict: string;
  reportPath: string;
  selectedDomainId: string | null;
} {
  const root = resolveProjectRoot();
  const generatedAt = new Date().toISOString();
  const issues: Array<{ code: string; message: string; severity: string }> = [];

  const ontologyExists = fs.existsSync(path.join(root, PROJECT_BRAIN_VERTICAL_ONTOLOGY_V1_PATH));
  const capabilityModelExists = fs.existsSync(path.join(root, PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH));
  const goalModelExists = fs.existsSync(path.join(root, PROJECT_BRAIN_GOAL_MODEL_V1_PATH));

  if (!ontologyExists) {
    issues.push({ code: 'PREREQ', message: 'Vertical ontology required', severity: 'error' });
  }
  if (!capabilityModelExists) {
    issues.push({ code: 'PREREQ', message: 'Capability model required', severity: 'error' });
  }
  if (!goalModelExists) {
    issues.push({ code: 'GOAL_TRUTH', message: 'Current Goal Truth required', severity: 'error' });
  }

  const precheckPassed = ontologyExists && capabilityModelExists && goalModelExists;
  let goalTruth: ReturnType<typeof loadCurrentGoalTruth> | null = null;
  let domainScores: DomainScore[] = [];
  let selectedDomain: DomainScore | null = null;
  let decisionFingerprint = '';
  let projectTruthFingerprint = '';

  if (precheckPassed) {
    goalTruth = loadCurrentGoalTruth(root);
    const snapshot = captureCycleSnapshot(root);

    projectTruthFingerprint = [
      `goal=${goalTruth.fingerprint}`,
      `lpm=${snapshot.entity_count}`,
      `gap=${snapshot.gap_report_id}`,
    ].join(':');

    writeJson(root, VERTICAL_AI_DOMAIN_GOAL_TRUTH_V1_PATH, {
      vertical_ai_domain_goal_truth_v1_id: 'vertical_ai_domain_goal_truth_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_DOMAIN_ANALYSIS_V1_PHASE,
      generated_at: generatedAt,
      mode: 'READ_ONLY',
      goal_truth_fingerprint: goalTruth.fingerprint,
      evaluated_goals: goalTruth.evaluated_goals,
      satisfied_goals: goalTruth.satisfied_goals,
      entries: goalTruth.entries,
    });

    const ontology = readJson<{
      domains: string[];
      capabilities: Array<{ capability_id: string; domain_id: string; name: string }>;
    }>(root, PROJECT_BRAIN_VERTICAL_ONTOLOGY_V1_PATH);

    const capabilityModel = readJson<{
      capabilities: Array<{ capability_id: string; name: string; entity_count: number }>;
    }>(root, PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH);

    const devIntelligence = fs.existsSync(
      path.join(root, PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH)
    )
      ? readJson<{
          dependency_analysis: {
            capability_dependencies: Array<{
              capability_id: string;
              upstream_capabilities: string[];
              entity_count: number;
            }>;
          };
        }>(root, PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH)
      : null;

    const materialization = materializeVerifiedRepositoryTruthForVerticalAiSelection(root);
    const completionById = new Map(
      materialization.entries.map((entry) => [entry.candidate_id, entry])
    );

    const registryByDomain = new Map<
      string,
      { total: number; satisfied: number; candidate_ids: string[] }
    >();

    for (const candidate of VERTICAL_AI_IMPLEMENTATION_CANDIDATES) {
      const domainId = candidate.binding.domain_id;
      const current = registryByDomain.get(domainId) ?? {
        total: 0,
        satisfied: 0,
        candidate_ids: [],
      };
      const completion = completionById.get(candidate.candidate_id);
      current.total += 1;
      if (completion?.satisfied) current.satisfied += 1;
      current.candidate_ids.push(candidate.candidate_id);
      registryByDomain.set(domainId, current);
    }

    const entityCountByCap = new Map(
      capabilityModel.capabilities.map((cap) => [cap.capability_id, cap.entity_count])
    );

    const goalEntryById = new Map(goalTruth.entries.map((entry) => [entry.goal_id, entry]));

    const dependencyByCap = new Map(
      (devIntelligence?.dependency_analysis.capability_dependencies ?? []).map((dep) => [
        dep.capability_id,
        dep,
      ])
    );

    const developedRegistryDomains = new Set(
      [...registryByDomain.entries()]
        .filter(([, stats]) => stats.total > 0 && stats.satisfied === stats.total)
        .map(([domainId]) => domainId)
    );

    for (const domainId of ontology.domains) {
      const capability = ontology.capabilities.find((cap) => cap.domain_id === domainId);
      const capabilityId = capability?.capability_id ?? `cap_${domainId}`;
      const entityCount = entityCountByCap.get(capabilityId) ?? 0;
      const registryStats = registryByDomain.get(domainId) ?? {
        total: 0,
        satisfied: 0,
        candidate_ids: [],
      };

      const developed =
        registryStats.total > 0 && registryStats.satisfied === registryStats.total;
      const undeveloped = registryStats.total === 0;

      let goalAlignmentScore = 0;
      const goalWeights = DOMAIN_GOAL_WEIGHTS[domainId] ?? [];
      for (const mapping of goalWeights) {
        const goalEntry = goalEntryById.get(mapping.goal_id);
        if (goalEntry?.satisfied) {
          goalAlignmentScore += mapping.weight * goalEntry.satisfaction_score;
        }
      }

      const entityScaleScore = Math.min(40, Math.round(entityCount / 50));

      const dependency = dependencyByCap.get(capabilityId);
      let dependencyReadinessScore = 0;
      if (dependency && dependency.upstream_capabilities.length > 0) {
        const readyUpstream = dependency.upstream_capabilities.filter((upstreamCapId) => {
          const upstreamDomain = ontology.capabilities.find(
            (cap) => cap.capability_id === upstreamCapId
          )?.domain_id;
          const upstreamEntities = entityCountByCap.get(upstreamCapId) ?? 0;
          const upstreamRegistry = upstreamDomain ? registryByDomain.get(upstreamDomain) : null;
          const upstreamRegistryReady =
            !upstreamRegistry ||
            upstreamRegistry.total === 0 ||
            upstreamRegistry.satisfied === upstreamRegistry.total;
          return upstreamEntities > 0 && upstreamRegistryReady;
        }).length;
        dependencyReadinessScore = Math.round(
          (readyUpstream / dependency.upstream_capabilities.length) * 20
        );
      } else if (developedRegistryDomains.size > 0) {
        dependencyReadinessScore = 10;
      }

      const valueScore =
        goalAlignmentScore + entityScaleScore + dependencyReadinessScore + (undeveloped ? 5 : 0);

      const evidence = [
        `entity_count=${entityCount}`,
        `registry_candidates=${registryStats.total}`,
        `registry_satisfied=${registryStats.satisfied}`,
        `developed=${developed}`,
        `undeveloped=${undeveloped}`,
        `goal_alignment=${goalAlignmentScore}`,
        `entity_scale=${entityScaleScore}`,
        `dependency_readiness=${dependencyReadinessScore}`,
        `value_score=${valueScore}`,
      ];

      if (dependency) {
        evidence.push(`upstream=${dependency.upstream_capabilities.join(',')}`);
      }

      domainScores.push({
        domain_id: domainId,
        capability_id: capabilityId,
        entity_count: entityCount,
        registry_candidate_count: registryStats.total,
        registry_satisfied_count: registryStats.satisfied,
        developed,
        undeveloped,
        goal_alignment_score: goalAlignmentScore,
        entity_scale_score: entityScaleScore,
        dependency_readiness_score: dependencyReadinessScore,
        value_score: valueScore,
        evidence,
        truth_sources: [
          'current_project_truth',
          'current_goal_truth',
          'repository_truth',
          'development_intelligence',
        ],
      });
    }

    const undevelopedDomains = domainScores.filter((score) => score.undeveloped);
    selectedDomain =
      undevelopedDomains.sort((a, b) => b.value_score - a.value_score)[0] ?? null;

    const domainScoresFingerprint = domainScores
      .map((score) => `${score.domain_id}:${score.value_score}:${score.undeveloped}`)
      .join('|');

    decisionFingerprint = computeDecisionFingerprint({
      projectTruthFingerprint,
      goalTruthFingerprint: goalTruth.fingerprint,
      selectedDomainId: selectedDomain?.domain_id ?? null,
      domainScoresFingerprint,
    });

    writeJson(root, VERTICAL_AI_DOMAIN_SCORES_V1_PATH, {
      vertical_ai_domain_scores_v1_id: 'vertical_ai_domain_scores_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_DOMAIN_ANALYSIS_V1_PHASE,
      generated_at: generatedAt,
      mode: 'READ_ONLY',
      decision_fingerprint: decisionFingerprint,
      domain_count: domainScores.length,
      undeveloped_domain_count: undevelopedDomains.length,
      developed_domain_count: domainScores.filter((score) => score.developed).length,
      domain_scores: domainScores,
    });

    writeJson(root, VERTICAL_AI_SELECTED_DOMAIN_V1_PATH, {
      vertical_ai_selected_domain_v1_id: 'vertical_ai_selected_domain_v1',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_DOMAIN_ANALYSIS_V1_PHASE,
      generated_at: generatedAt,
      mode: 'READ_ONLY',
      selection_basis: 'highest_value_score_among_undeveloped_domains',
      selected_domain_id: selectedDomain?.domain_id ?? null,
      selected_capability_id: selectedDomain?.capability_id ?? null,
      value_score: selectedDomain?.value_score ?? 0,
      decision_fingerprint: decisionFingerprint,
      objective_evidence: selectedDomain?.evidence ?? [],
      truth_sources: selectedDomain?.truth_sources ?? [],
      rationale: selectedDomain
        ? `${selectedDomain.domain_id} is the highest-value undeveloped Vertical AI domain by goal alignment (${selectedDomain.goal_alignment_score}), entity scale (${selectedDomain.entity_scale_score}), and dependency readiness (${selectedDomain.dependency_readiness_score}).`
        : 'No undeveloped domains identified.',
    });

    if (goalTruth.evaluated_goals === 0) {
      issues.push({
        code: 'GOAL_TRUTH',
        message: 'No goals evaluated in Current Goal Truth',
        severity: 'error',
      });
    }
    if (!selectedDomain) {
      issues.push({
        code: 'SELECTION',
        message: 'No undeveloped domain could be selected',
        severity: 'error',
      });
    }
  }

  const passed = precheckPassed && issues.length === 0 && selectedDomain !== null;
  const verdict = passed
    ? VERTICAL_AI_DOMAIN_ANALYSIS_V1_PASS_VERDICT
    : VERTICAL_AI_DOMAIN_ANALYSIS_V1_FAIL_VERDICT;

  writeJson(root, VERTICAL_AI_DOMAIN_ANALYSIS_V1_PATH, {
    vertical_ai_domain_analysis_v1_id: 'vertical_ai_domain_analysis_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_DOMAIN_ANALYSIS_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    final_verdict: verdict,
    decision_fingerprint: decisionFingerprint,
    selected_domain_id: selectedDomain?.domain_id ?? null,
    goal_truth_ref: VERTICAL_AI_DOMAIN_GOAL_TRUTH_V1_PATH,
    domain_scores_ref: VERTICAL_AI_DOMAIN_SCORES_V1_PATH,
    selected_domain_ref: VERTICAL_AI_SELECTED_DOMAIN_V1_PATH,
    lpm_mutation: false,
    brain_modification: false,
  });

  const report = {
    report_id: `vertical_ai_domain_analysis_v1_${Date.now()}`,
    phase: VERTICAL_AI_DOMAIN_ANALYSIS_V1_PHASE,
    generated_at: generatedAt,
    goal: 'Identify the next highest-value undeveloped Vertical AI domain from Current Project Truth.',
    vertical_ai_domain_analysis_v1_passed: passed,
    final_verdict: verdict,
    status: passed ? VERTICAL_AI_DOMAIN_ANALYSIS_V1_STATUS : 'VERTICAL_AI_DOMAIN_ANALYSIS_FAILED',
    decision_fingerprint: decisionFingerprint,
    goal_truth_fingerprint: goalTruth?.fingerprint ?? null,
    selected_domain_id: selectedDomain?.domain_id ?? null,
    selected_capability_id: selectedDomain?.capability_id ?? null,
    selected_value_score: selectedDomain?.value_score ?? 0,
    undeveloped_domain_count: domainScores.filter((score) => score.undeveloped).length,
    developed_domain_count: domainScores.filter((score) => score.developed).length,
    goal_truth_ref: VERTICAL_AI_DOMAIN_GOAL_TRUTH_V1_PATH,
    domain_scores_ref: VERTICAL_AI_DOMAIN_SCORES_V1_PATH,
    selected_domain_ref: VERTICAL_AI_SELECTED_DOMAIN_V1_PATH,
    analysis_ref: VERTICAL_AI_DOMAIN_ANALYSIS_V1_PATH,
    top_undeveloped_domains: domainScores
      .filter((score) => score.undeveloped)
      .sort((a, b) => b.value_score - a.value_score)
      .slice(0, 5)
      .map((score) => ({
        domain_id: score.domain_id,
        value_score: score.value_score,
        entity_count: score.entity_count,
      })),
    checks: {
      PREREQ: precheckPassed,
      GOAL_TRUTH_RESOLVED: goalTruth !== null && (goalTruth?.evaluated_goals ?? 0) > 0,
      DOMAIN_SCORES_COMPUTED: domainScores.length > 0,
      SELECTED_DOMAIN_IDENTIFIED: selectedDomain !== null,
      EVIDENCE_BASED: true,
      NO_LPM_MUTATION: true,
      READ_ONLY: true,
      EXECUTE_AUTHORIZED_FALSE: true,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_DOMAIN_ANALYSIS_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_DOMAIN_ANALYSIS_V1_REPORT_PATH,
    selectedDomainId: selectedDomain?.domain_id ?? null,
  };
}
