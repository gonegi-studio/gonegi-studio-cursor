import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_BRAIN_ARCHITECTURE_VERSION } from './projectBrainFoundationV1.js';
import { captureCycleSnapshot } from './implementationCycleV1Engine.js';
import {
  PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH,
  PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH,
  PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
} from './projectBrainWaveDDevelopmentPluginsV1.js';
import { PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH } from './projectBrainWaveCSemanticUnderstandingV1Engine.js';
import { PROJECT_BRAIN_VERTICAL_ONTOLOGY_V1_PATH } from './projectBrainWaveCSemanticPluginsV1.js';
import { PROJECT_BRAIN_LPM_V1_PATH } from './projectBrainWaveBLpmMaterializationV1Engine.js';
import {
  DATASET_MANAGEMENT_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
  DATASET_MANAGEMENT_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
  DATASET_MANAGEMENT_DOMAIN_CERTIFICATION_V1_PATH,
} from './datasetManagementDomainCertificationV1Engine.js';
import {
  VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
  loadCurrentGoalTruth,
} from './verticalAiDevelopmentV1Engine.js';
import {
  materializeVerifiedRepositoryTruthForVerticalAiSelection,
  VERTICAL_AI_IMPLEMENTATION_CANDIDATES,
} from './verticalAiImplementationSelectionV1.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PHASE =
  'PHASE-VERTICAL-AI-OPPORTUNITY-IDENTIFICATION-V2' as const;
export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PASS_VERDICT =
  'PASS_VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2' as const;
export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2' as const;
export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_STATUS =
  'VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_COMPLETE' as const;

export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_DIR =
  'datasets/stage7/vertical_ai_opportunity_identification_v2' as const;
export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PATH =
  `${VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_DIR}/vertical-ai-opportunity-identification-v2.json` as const;
export const VERTICAL_AI_PROJECT_TRUTH_RESOLUTION_V2_PATH =
  `${VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_DIR}/vertical-ai-project-truth-resolution-v2.json` as const;
export const VERTICAL_AI_BRAIN_ASSIST_EVIDENCE_V2_PATH =
  `${VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_DIR}/vertical-ai-brain-assist-evidence-v2.json` as const;
export const VERTICAL_AI_DOMAIN_OPPORTUNITY_SCORES_V2_PATH =
  `${VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_DIR}/vertical-ai-domain-opportunity-scores-v2.json` as const;
export const VERTICAL_AI_SELECTED_DOMAIN_OPPORTUNITY_V2_PATH =
  `${VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_DIR}/vertical-ai-selected-domain-opportunity-v2.json` as const;
export const VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_REPORT_PATH =
  'reports/stage7/VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_REPORT.json' as const;

export const VAOI2_CONTRACT_IDS = [
  'VAOI2_PROJECT_TRUTH_RESOLVED',
  'VAOI2_BRAIN_ASSIST_EVIDENCE_PRESENT',
  'VAOI2_DOMAIN_SCORES_COMPUTED',
  'VAOI2_DOMAIN_CERTIFICATIONS_INTEGRATED',
  'VAOI2_HIGHEST_VALUE_DOMAIN_SELECTED',
  'VAOI2_EVIDENCE_BASED_DECISION',
] as const;

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

const DOMAIN_CERTIFICATION_EVIDENCE = [
  {
    domain_id: 'dataset_management',
    report_path: DATASET_MANAGEMENT_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: DATASET_MANAGEMENT_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
    artifact_path: DATASET_MANAGEMENT_DOMAIN_CERTIFICATION_V1_PATH,
  },
] as const;

const EXECUTION_FLAGS = {
  vertical_ai_opportunity_identification_v2: true as const,
  project_brain_assisted: true as const,
  read_only: true as const,
  metadata_only: true as const,
  brain_modification: false as const,
  architecture_changes: false as const,
  lpm_mutation: false as const,
  execute_authorized: false as const,
  evidence_derived: true as const,
};

type DomainOpportunityScore = {
  domain_id: string;
  capability_id: string;
  entity_count: number;
  registry_candidate_count: number;
  registry_satisfied_count: number;
  developed: boolean;
  undeveloped: boolean;
  domain_certified: boolean;
  domain_ready: boolean;
  eligible_for_selection: boolean;
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

function pathExists(root: string, rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function phaseReportPassed(root: string, reportPath: string, passVerdict: string): boolean {
  if (!pathExists(root, reportPath)) return false;
  const report = readJson<{ final_verdict?: string; validation_passed?: boolean }>(
    root,
    reportPath
  );
  return report.final_verdict === passVerdict && report.validation_passed === true;
}

function resolveDomainCertifications(root: string) {
  return DOMAIN_CERTIFICATION_EVIDENCE.map((spec) => {
    const certified = phaseReportPassed(root, spec.report_path, spec.pass_verdict);
    const artifactPresent = pathExists(root, spec.artifact_path);
    return {
      domain_id: spec.domain_id,
      report_path: spec.report_path,
      pass_verdict: spec.pass_verdict,
      artifact_path: spec.artifact_path,
      certified: certified && artifactPresent,
      artifact_present: artifactPresent,
    };
  });
}

function computeDecisionFingerprint(input: {
  projectTruthFingerprint: string;
  goalTruthFingerprint: string;
  selectedDomainId: string | null;
  domainScoresFingerprint: string;
  certifiedDomains: string[];
}): string {
  return [
    `project=${input.projectTruthFingerprint}`,
    `goal=${input.goalTruthFingerprint}`,
    `selected=${input.selectedDomainId ?? 'none'}`,
    `certified=${input.certifiedDomains.join(',') || 'none'}`,
    `scores=${input.domainScoresFingerprint}`,
    'mode=PROJECT_BRAIN_ASSISTED',
  ].join('|');
}

function validateContracts(input: {
  projectTruthResolved: boolean;
  brainAssistEvidencePresent: boolean;
  domainScoresComputed: boolean;
  domainCertificationsIntegrated: boolean;
  highestValueDomainSelected: boolean;
  evidenceBasedDecision: boolean;
}) {
  const results = [
    {
      contract_id: 'VAOI2_PROJECT_TRUTH_RESOLVED',
      verdict: input.projectTruthResolved ? 'PASS' : 'FAIL',
    },
    {
      contract_id: 'VAOI2_BRAIN_ASSIST_EVIDENCE_PRESENT',
      verdict: input.brainAssistEvidencePresent ? 'PASS' : 'FAIL',
    },
    {
      contract_id: 'VAOI2_DOMAIN_SCORES_COMPUTED',
      verdict: input.domainScoresComputed ? 'PASS' : 'FAIL',
    },
    {
      contract_id: 'VAOI2_DOMAIN_CERTIFICATIONS_INTEGRATED',
      verdict: input.domainCertificationsIntegrated ? 'PASS' : 'FAIL',
    },
    {
      contract_id: 'VAOI2_HIGHEST_VALUE_DOMAIN_SELECTED',
      verdict: input.highestValueDomainSelected ? 'PASS' : 'FAIL',
    },
    {
      contract_id: 'VAOI2_EVIDENCE_BASED_DECISION',
      verdict: input.evidenceBasedDecision ? 'PASS' : 'FAIL',
    },
  ] as const;

  const pass = results.every((result) => result.verdict === 'PASS');
  return { results, aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const) };
}

export function writeVerticalAiOpportunityIdentificationV2EngineReport(): {
  passed: boolean;
  verdict: string;
  reportPath: string;
  selectedDomainId: string | null;
} {
  const root = resolveProjectRoot();
  const generatedAt = new Date().toISOString();
  const issues: Array<{ code: string; message: string; severity: string }> = [];

  const ontologyExists = pathExists(root, PROJECT_BRAIN_VERTICAL_ONTOLOGY_V1_PATH);
  const capabilityModelExists = pathExists(root, PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH);
  const goalModelExists = pathExists(root, PROJECT_BRAIN_GOAL_MODEL_V1_PATH);
  const lpmExists = pathExists(root, PROJECT_BRAIN_LPM_V1_PATH);

  if (!ontologyExists) {
    issues.push({ code: 'PREREQ', message: 'Vertical ontology required', severity: 'error' });
  }
  if (!capabilityModelExists) {
    issues.push({ code: 'PREREQ', message: 'Capability model required', severity: 'error' });
  }
  if (!goalModelExists) {
    issues.push({ code: 'GOAL_TRUTH', message: 'Current Goal Truth required', severity: 'error' });
  }
  if (!lpmExists) {
    issues.push({ code: 'PREREQ', message: 'LPM required for Project Brain assist', severity: 'error' });
  }

  const precheckPassed = ontologyExists && capabilityModelExists && goalModelExists && lpmExists;
  let goalTruth: ReturnType<typeof loadCurrentGoalTruth> | null = null;
  let domainScores: DomainOpportunityScore[] = [];
  let selectedDomain: DomainOpportunityScore | null = null;
  let decisionFingerprint = '';
  let projectTruthFingerprint = '';
  let domainCertifications = resolveDomainCertifications(root);
  let contractValidation: ReturnType<typeof validateContracts> | null = null;

  if (precheckPassed) {
    goalTruth = loadCurrentGoalTruth(root);
    const snapshot = captureCycleSnapshot(root);
    const materialization = materializeVerifiedRepositoryTruthForVerticalAiSelection(root);

    projectTruthFingerprint = [
      `goal=${goalTruth.fingerprint}`,
      `lpm=${snapshot.entity_count}`,
      `gap=${snapshot.gap_report_id}`,
      `materialization=${materialization.fingerprint.slice(0, 24)}`,
    ].join(':');

    const certifiedDomainIds = new Set(
      domainCertifications.filter((entry) => entry.certified).map((entry) => entry.domain_id)
    );

    writeJson(root, VERTICAL_AI_PROJECT_TRUTH_RESOLUTION_V2_PATH, {
      vertical_ai_project_truth_resolution_v2_id: 'vertical_ai_project_truth_resolution_v2',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      goal_truth_fingerprint: goalTruth.fingerprint,
      evaluated_goals: goalTruth.evaluated_goals,
      satisfied_goals: goalTruth.satisfied_goals,
      entries: goalTruth.entries,
      project_truth_fingerprint: projectTruthFingerprint,
      cycle_snapshot: snapshot,
    });

    writeJson(root, VERTICAL_AI_BRAIN_ASSIST_EVIDENCE_V2_PATH, {
      vertical_ai_brain_assist_evidence_v2_id: 'vertical_ai_brain_assist_evidence_v2',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      lpm_ref: PROJECT_BRAIN_LPM_V1_PATH,
      capability_model_ref: PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH,
      goal_model_ref: PROJECT_BRAIN_GOAL_MODEL_V1_PATH,
      gap_analysis_ref: pathExists(root, PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH)
        ? PROJECT_BRAIN_GAP_ANALYSIS_V1_PATH
        : null,
      development_intelligence_ref: pathExists(root, PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH)
        ? PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH
        : null,
      ontology_ref: PROJECT_BRAIN_VERTICAL_ONTOLOGY_V1_PATH,
      domain_certifications: domainCertifications,
      materialization_fingerprint: materialization.fingerprint,
      repository_truth_satisfied: materialization.entries.filter((entry) => entry.satisfied).length,
      repository_truth_total: VERTICAL_AI_IMPLEMENTATION_CANDIDATES.length,
    });

    const ontology = readJson<{
      domains: string[];
      capabilities: Array<{ capability_id: string; domain_id: string; name: string }>;
    }>(root, PROJECT_BRAIN_VERTICAL_ONTOLOGY_V1_PATH);

    const capabilityModel = readJson<{
      capabilities: Array<{ capability_id: string; name: string; entity_count: number }>;
    }>(root, PROJECT_BRAIN_CAPABILITY_MODEL_V1_PATH);

    const devIntelligence = pathExists(root, PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_V1_PATH)
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
      const domainCertified = certifiedDomainIds.has(domainId);
      const domainReady = domainCertified || developed;
      const eligibleForSelection = !domainReady && !domainCertified;

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
          const upstreamCertified = upstreamDomain
            ? certifiedDomainIds.has(upstreamDomain)
            : false;
          const upstreamRegistryReady =
            upstreamCertified ||
            !upstreamRegistry ||
            upstreamRegistry.total === 0 ||
            upstreamRegistry.satisfied === upstreamRegistry.total;
          return upstreamEntities > 0 && upstreamRegistryReady;
        }).length;
        dependencyReadinessScore = Math.round(
          (readyUpstream / dependency.upstream_capabilities.length) * 20
        );
      } else if (developedRegistryDomains.size > 0 || certifiedDomainIds.size > 0) {
        dependencyReadinessScore = 10;
      }

      const valueScore =
        goalAlignmentScore +
        entityScaleScore +
        dependencyReadinessScore +
        (eligibleForSelection && undeveloped ? 5 : 0);

      const evidence = [
        `entity_count=${entityCount}`,
        `registry_candidates=${registryStats.total}`,
        `registry_satisfied=${registryStats.satisfied}`,
        `developed=${developed}`,
        `undeveloped=${undeveloped}`,
        `domain_certified=${domainCertified}`,
        `domain_ready=${domainReady}`,
        `eligible=${eligibleForSelection}`,
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
        domain_certified: domainCertified,
        domain_ready: domainReady,
        eligible_for_selection: eligibleForSelection,
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
          'domain_certification',
        ],
      });
    }

    const eligibleDomains = domainScores.filter((score) => score.eligible_for_selection);
    selectedDomain =
      eligibleDomains.sort((a, b) => b.value_score - a.value_score)[0] ?? null;

    const domainScoresFingerprint = domainScores
      .map(
        (score) =>
          `${score.domain_id}:${score.value_score}:${score.eligible_for_selection}:${score.domain_certified}`
      )
      .join('|');

    decisionFingerprint = computeDecisionFingerprint({
      projectTruthFingerprint,
      goalTruthFingerprint: goalTruth.fingerprint,
      selectedDomainId: selectedDomain?.domain_id ?? null,
      domainScoresFingerprint,
      certifiedDomains: [...certifiedDomainIds],
    });

    writeJson(root, VERTICAL_AI_DOMAIN_OPPORTUNITY_SCORES_V2_PATH, {
      vertical_ai_domain_opportunity_scores_v2_id: 'vertical_ai_domain_opportunity_scores_v2',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      decision_fingerprint: decisionFingerprint,
      domain_count: domainScores.length,
      eligible_domain_count: eligibleDomains.length,
      domain_certified_count: domainScores.filter((score) => score.domain_certified).length,
      domain_scores: domainScores,
    });

    writeJson(root, VERTICAL_AI_SELECTED_DOMAIN_OPPORTUNITY_V2_PATH, {
      vertical_ai_selected_domain_opportunity_v2_id: 'vertical_ai_selected_domain_opportunity_v2',
      architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
      phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PHASE,
      generated_at: generatedAt,
      mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
      selection_basis: 'highest_value_score_among_eligible_domains',
      selected_domain_id: selectedDomain?.domain_id ?? null,
      selected_capability_id: selectedDomain?.capability_id ?? null,
      value_score: selectedDomain?.value_score ?? 0,
      decision_fingerprint: decisionFingerprint,
      excluded_domain_certified: [...certifiedDomainIds],
      objective_evidence: selectedDomain?.evidence ?? [],
      truth_sources: selectedDomain?.truth_sources ?? [],
      rationale: selectedDomain
        ? `${selectedDomain.domain_id} is the highest-value eligible Vertical AI domain by goal alignment (${selectedDomain.goal_alignment_score}), entity scale (${selectedDomain.entity_scale_score}), and dependency readiness (${selectedDomain.dependency_readiness_score}), excluding domain-certified domains.`
        : 'No eligible domain could be selected.',
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
        message: 'No eligible highest-value domain could be selected',
        severity: 'error',
      });
    }

    for (const certification of domainCertifications) {
      if (!certification.artifact_present) {
        issues.push({
          code: 'DOMAIN_CERTIFICATION_ARTIFACT_MISSING',
          message: `Domain certification artifact missing: ${certification.artifact_path}`,
          severity: 'warning',
        });
      }
    }

    contractValidation = validateContracts({
      projectTruthResolved: goalTruth.evaluated_goals > 0,
      brainAssistEvidencePresent: pathExists(root, VERTICAL_AI_BRAIN_ASSIST_EVIDENCE_V2_PATH),
      domainScoresComputed: domainScores.length > 0,
      domainCertificationsIntegrated: domainCertifications.every(
        (entry) => !entry.artifact_present || entry.certified
      ),
      highestValueDomainSelected: selectedDomain !== null,
      evidenceBasedDecision: selectedDomain !== null && decisionFingerprint.length > 0,
    });

    if (contractValidation.aggregate_verdict !== 'PASS') {
      issues.push({
        code: 'CONTRACT_FAILURE',
        message: 'One or more VAOI2 contracts failed',
        severity: 'error',
      });
    }
  }

  const passed =
    precheckPassed &&
    issues.filter((issue) => issue.severity === 'error').length === 0 &&
    selectedDomain !== null &&
    contractValidation?.aggregate_verdict === 'PASS';

  const verdict = passed
    ? VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PASS_VERDICT
    : VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_FAIL_VERDICT;

  writeJson(root, VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PATH, {
    vertical_ai_opportunity_identification_v2_id: 'vertical_ai_opportunity_identification_v2',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PHASE,
    generated_at: generatedAt,
    mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
    final_verdict: verdict,
    decision_fingerprint: decisionFingerprint,
    selected_domain_id: selectedDomain?.domain_id ?? null,
    project_truth_ref: VERTICAL_AI_PROJECT_TRUTH_RESOLUTION_V2_PATH,
    brain_assist_evidence_ref: VERTICAL_AI_BRAIN_ASSIST_EVIDENCE_V2_PATH,
    domain_scores_ref: VERTICAL_AI_DOMAIN_OPPORTUNITY_SCORES_V2_PATH,
    selected_domain_ref: VERTICAL_AI_SELECTED_DOMAIN_OPPORTUNITY_V2_PATH,
    lpm_mutation: false,
    brain_modification: false,
  });

  const report = {
    report_id: `vertical_ai_opportunity_identification_v2_${Date.now()}`,
    phase: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PHASE,
    generated_at: generatedAt,
    mode: VERTICAL_AI_DEVELOPMENT_MODE_PROJECT_BRAIN_ASSISTED,
    goal: 'Identify the highest-value Vertical AI domain from Current Project Truth.',
    vertical_ai_opportunity_identification_v2_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_STATUS
      : 'VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_FAILED',
    decision_fingerprint: decisionFingerprint,
    goal_truth_fingerprint: goalTruth?.fingerprint ?? null,
    selected_domain_id: selectedDomain?.domain_id ?? null,
    selected_capability_id: selectedDomain?.capability_id ?? null,
    selected_value_score: selectedDomain?.value_score ?? 0,
    eligible_domain_count: domainScores.filter((score) => score.eligible_for_selection).length,
    domain_certified_count: domainScores.filter((score) => score.domain_certified).length,
    project_truth_ref: VERTICAL_AI_PROJECT_TRUTH_RESOLUTION_V2_PATH,
    brain_assist_evidence_ref: VERTICAL_AI_BRAIN_ASSIST_EVIDENCE_V2_PATH,
    domain_scores_ref: VERTICAL_AI_DOMAIN_OPPORTUNITY_SCORES_V2_PATH,
    selected_domain_ref: VERTICAL_AI_SELECTED_DOMAIN_OPPORTUNITY_V2_PATH,
    identification_ref: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_PATH,
    domain_certifications: domainCertifications,
    contract_validation: contractValidation,
    top_eligible_domains: domainScores
      .filter((score) => score.eligible_for_selection)
      .sort((a, b) => b.value_score - a.value_score)
      .slice(0, 5)
      .map((score) => ({
        domain_id: score.domain_id,
        value_score: score.value_score,
        entity_count: score.entity_count,
      })),
    checks: {
      PREREQ: precheckPassed,
      PROJECT_TRUTH_RESOLVED: goalTruth !== null && (goalTruth?.evaluated_goals ?? 0) > 0,
      BRAIN_ASSIST_EVIDENCE_PRESENT: pathExists(root, VERTICAL_AI_BRAIN_ASSIST_EVIDENCE_V2_PATH),
      DOMAIN_SCORES_COMPUTED: domainScores.length > 0,
      DOMAIN_CERTIFICATIONS_INTEGRATED: domainCertifications.every(
        (entry) => !entry.artifact_present || entry.certified
      ),
      HIGHEST_VALUE_DOMAIN_SELECTED: selectedDomain !== null,
      EVIDENCE_BASED_DECISION: selectedDomain !== null,
      CONTRACTS_PASS: contractValidation?.aggregate_verdict === 'PASS',
      NO_LPM_MUTATION: true,
      READ_ONLY: true,
      PROJECT_BRAIN_ASSISTED: true,
    },
    issues,
    execution_flags: EXECUTION_FLAGS,
  };

  writeJson(root, VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_OPPORTUNITY_IDENTIFICATION_V2_REPORT_PATH,
    selectedDomainId: selectedDomain?.domain_id ?? null,
  };
}
