import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_BRAIN_ARCHITECTURE_VERSION } from './projectBrainFoundationV1.js';
import { PROJECT_BRAIN_VERTICAL_ONTOLOGY_V1_PATH } from './projectBrainWaveCSemanticPluginsV1.js';
import { PROJECT_BRAIN_LPM_V1_PATH } from './projectBrainWaveBLpmMaterializationV1Engine.js';
import {
  DATASET_MANAGEMENT_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
  DATASET_MANAGEMENT_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
  DATASET_MANAGEMENT_V2_DOMAIN_CERTIFICATION_V1_PATH,
} from './datasetManagementV2DomainCertificationV1Engine.js';
import {
  PRODUCTION_RUNTIME_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
  PRODUCTION_RUNTIME_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
  PRODUCTION_RUNTIME_V2_DOMAIN_CERTIFICATION_V1_PATH,
} from './productionRuntimeV2DomainCertificationV1Engine.js';
import {
  MOVIE_RECONSTRUCTION_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
  MOVIE_RECONSTRUCTION_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
  MOVIE_RECONSTRUCTION_V2_DOMAIN_CERTIFICATION_V1_PATH,
} from './movieReconstructionV2DomainCertificationV1Engine.js';
import {
  NARRATIVE_PRODUCTION_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
  NARRATIVE_PRODUCTION_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
  NARRATIVE_PRODUCTION_V2_DOMAIN_CERTIFICATION_V1_PATH,
} from './narrativeProductionV2DomainCertificationV1Engine.js';
import {
  CINEMATIC_GENERATION_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
  CINEMATIC_GENERATION_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
  CINEMATIC_GENERATION_V2_DOMAIN_CERTIFICATION_V1_PATH,
} from './cinematicGenerationV2DomainCertificationV1Engine.js';
import {
  SOURCE_VIDEO_ANALYSIS_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
  SOURCE_VIDEO_ANALYSIS_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
  SOURCE_VIDEO_ANALYSIS_V2_DOMAIN_CERTIFICATION_V1_PATH,
} from './sourceVideoAnalysisV2DomainCertificationV1Engine.js';
import {
  EXPORT_MATERIALIZATION_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
  EXPORT_MATERIALIZATION_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
  EXPORT_MATERIALIZATION_V2_DOMAIN_CERTIFICATION_V1_PATH,
} from './exportMaterializationV2DomainCertificationV1Engine.js';
import {
  VERIFICATION_AND_AUDIT_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
  VERIFICATION_AND_AUDIT_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
  VERIFICATION_AND_AUDIT_V2_DOMAIN_CERTIFICATION_V1_PATH,
} from './verificationAndAuditV2DomainCertificationV1Engine.js';
import {
  PROJECT_BRAIN_INTELLIGENCE_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
  PROJECT_BRAIN_INTELLIGENCE_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
  PROJECT_BRAIN_INTELLIGENCE_V2_DOMAIN_CERTIFICATION_V1_PATH,
} from './projectBrainIntelligenceV2DomainCertificationV1Engine.js';
import {
  REPOSITORY_INTELLIGENCE_V2_PROJECT_BRAIN_SYNC_V1_PASS_VERDICT,
  REPOSITORY_INTELLIGENCE_V2_PROJECT_BRAIN_SYNC_V1_REPORT_PATH,
  REPOSITORY_INTELLIGENCE_V2_PROJECT_BRAIN_SYNC_V1_PATH,
} from './repositoryIntelligenceV2ProjectBrainSyncV1Engine.js';
import {
  REPOSITORY_INTELLIGENCE_V2_CAPABILITY_REGISTRATION_V1_PASS_VERDICT,
  REPOSITORY_INTELLIGENCE_V2_CAPABILITY_REGISTRATION_V1_REPORT_PATH,
} from './repositoryIntelligenceV2CapabilityRegistrationV1Engine.js';
import { loadCurrentGoalTruth } from './verticalAiDevelopmentV1Engine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PHASE =
  'PHASE-VERTICAL-AI-GLOBAL-CERTIFICATION-V1' as const;
export const VERTICAL_AI_GLOBAL_CERTIFICATION_V1_SYSTEM_ID =
  'VERTICAL_AI_GLOBAL_CERTIFICATION_V1' as const;
export const VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PASS_VERDICT =
  'PASS_VERTICAL_AI_GLOBAL_CERTIFICATION_V1' as const;
export const VERTICAL_AI_GLOBAL_CERTIFICATION_V1_FAIL_VERDICT =
  'FAIL_VERTICAL_AI_GLOBAL_CERTIFICATION_V1' as const;
export const VERTICAL_AI_GLOBAL_CERTIFICATION_V1_STATUS =
  'VERTICAL_AI_V2_GLOBAL_DOMAIN_READY' as const;

export const VERTICAL_AI_GLOBAL_CERTIFICATION_V1_DIR =
  'datasets/stage7/vertical_ai_global_certification_v1' as const;
export const VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PATH =
  `${VERTICAL_AI_GLOBAL_CERTIFICATION_V1_DIR}/vertical-ai-global-certification-v1.json` as const;
export const VERTICAL_AI_GLOBAL_DOMAIN_EVIDENCE_CHAIN_CERTIFICATION_V1_PATH =
  `${VERTICAL_AI_GLOBAL_CERTIFICATION_V1_DIR}/vertical-ai-global-domain-evidence-chain-certification-v1.json` as const;
export const VERTICAL_AI_GLOBAL_CERTIFICATION_CONTRACTS_V1_PATH =
  `${VERTICAL_AI_GLOBAL_CERTIFICATION_V1_DIR}/vertical-ai-global-certification-contracts-v1.json` as const;
export const VERTICAL_AI_GLOBAL_CERTIFICATION_REGISTRY_V1_PATH =
  `${VERTICAL_AI_GLOBAL_CERTIFICATION_V1_DIR}/vertical-ai-global-certification-registry-v1.json` as const;
export const VERTICAL_AI_GLOBAL_CERTIFICATION_V1_REPORT_PATH =
  'reports/stage7/VERTICAL_AI_GLOBAL_CERTIFICATION_V1_REPORT.json' as const;

const CERTIFICATION_NAME =
  'Evidence-Bound Vertical AI V2 Global Domain Readiness Certification' as const;

export const VAGC_CONTRACT_IDS = [
  'VAGC_GOAL_TRUTH_SATISFIED',
  'VAGC_ALL_ELIGIBLE_DOMAINS_COMPLETED',
  'VAGC_DOMAIN_CERTIFICATIONS_VERIFIED',
  'VAGC_EVIDENCE_CHAIN_COMPLETE',
  'VAGC_GLOBAL_READY',
] as const;

const ELIGIBLE_V2_DOMAIN_EVIDENCE = [
  {
    domain_id: 'dataset_management',
    capability_id: 'cap_dataset_management',
    report_path: DATASET_MANAGEMENT_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: DATASET_MANAGEMENT_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
    artifact_path: DATASET_MANAGEMENT_V2_DOMAIN_CERTIFICATION_V1_PATH,
    completion_mode: 'v2_domain_certification' as const,
  },
  {
    domain_id: 'production_runtime',
    capability_id: 'cap_production_runtime',
    report_path: PRODUCTION_RUNTIME_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: PRODUCTION_RUNTIME_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
    artifact_path: PRODUCTION_RUNTIME_V2_DOMAIN_CERTIFICATION_V1_PATH,
    completion_mode: 'v2_domain_certification' as const,
  },
  {
    domain_id: 'movie_reconstruction',
    capability_id: 'cap_movie_reconstruction',
    report_path: MOVIE_RECONSTRUCTION_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: MOVIE_RECONSTRUCTION_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
    artifact_path: MOVIE_RECONSTRUCTION_V2_DOMAIN_CERTIFICATION_V1_PATH,
    completion_mode: 'v2_domain_certification' as const,
  },
  {
    domain_id: 'narrative_production',
    capability_id: 'cap_narrative_production',
    report_path: NARRATIVE_PRODUCTION_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: NARRATIVE_PRODUCTION_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
    artifact_path: NARRATIVE_PRODUCTION_V2_DOMAIN_CERTIFICATION_V1_PATH,
    completion_mode: 'v2_domain_certification' as const,
  },
  {
    domain_id: 'cinematic_generation',
    capability_id: 'cap_cinematic_generation',
    report_path: CINEMATIC_GENERATION_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: CINEMATIC_GENERATION_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
    artifact_path: CINEMATIC_GENERATION_V2_DOMAIN_CERTIFICATION_V1_PATH,
    completion_mode: 'v2_domain_certification' as const,
  },
  {
    domain_id: 'source_video_analysis',
    capability_id: 'cap_source_video_analysis',
    report_path: SOURCE_VIDEO_ANALYSIS_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: SOURCE_VIDEO_ANALYSIS_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
    artifact_path: SOURCE_VIDEO_ANALYSIS_V2_DOMAIN_CERTIFICATION_V1_PATH,
    completion_mode: 'v2_domain_certification' as const,
  },
  {
    domain_id: 'export_materialization',
    capability_id: 'cap_export_materialization',
    report_path: EXPORT_MATERIALIZATION_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: EXPORT_MATERIALIZATION_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
    artifact_path: EXPORT_MATERIALIZATION_V2_DOMAIN_CERTIFICATION_V1_PATH,
    completion_mode: 'v2_domain_certification' as const,
  },
  {
    domain_id: 'verification_and_audit',
    capability_id: 'cap_verification_and_audit',
    report_path: VERIFICATION_AND_AUDIT_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: VERIFICATION_AND_AUDIT_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
    artifact_path: VERIFICATION_AND_AUDIT_V2_DOMAIN_CERTIFICATION_V1_PATH,
    completion_mode: 'v2_domain_certification' as const,
  },
  {
    domain_id: 'project_brain_intelligence',
    capability_id: 'cap_project_brain_intelligence',
    report_path: PROJECT_BRAIN_INTELLIGENCE_V2_DOMAIN_CERTIFICATION_V1_REPORT_PATH,
    pass_verdict: PROJECT_BRAIN_INTELLIGENCE_V2_DOMAIN_CERTIFICATION_V1_PASS_VERDICT,
    artifact_path: PROJECT_BRAIN_INTELLIGENCE_V2_DOMAIN_CERTIFICATION_V1_PATH,
    completion_mode: 'v2_domain_certification' as const,
  },
  {
    domain_id: 'repository_intelligence',
    capability_id: 'cap_repository_intelligence',
    report_path: REPOSITORY_INTELLIGENCE_V2_PROJECT_BRAIN_SYNC_V1_REPORT_PATH,
    pass_verdict: REPOSITORY_INTELLIGENCE_V2_PROJECT_BRAIN_SYNC_V1_PASS_VERDICT,
    artifact_path: REPOSITORY_INTELLIGENCE_V2_PROJECT_BRAIN_SYNC_V1_PATH,
    completion_mode: 'v2_project_brain_sync' as const,
  },
] as const;

type DomainCompletionEvidence = {
  domain_id: string;
  capability_id: string;
  report_path: string;
  pass_verdict: string;
  artifact_path: string;
  completion_mode: 'v2_domain_certification' | 'v2_project_brain_sync';
  report_passed: boolean;
  artifact_present: boolean;
  domain_ready: boolean;
  v2_reinvestment_complete: boolean;
  completed: boolean;
  certified: boolean;
  decision_fingerprint: string | null;
};

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

function phaseReportPassed(root: string, reportPath: string, passVerdict: string): boolean {
  if (!pathExists(root, reportPath)) return false;
  const report = readJson<Record<string, unknown>>(root, reportPath);
  if (!report) return false;
  const verdictPassed = report.final_verdict === passVerdict;
  const validated =
    report.validation_passed === true ||
    Object.entries(report).some(
      ([key, value]) => key.endsWith('_passed') && key !== 'validation_passed' && value === true
    );
  return verdictPassed && validated;
}

function resolveRepositoryIntelligenceCompletion(root: string): {
  domain_ready: boolean;
  v2_reinvestment_complete: boolean;
  completed: boolean;
} {
  const capabilityRegistrationPassed = phaseReportPassed(
    root,
    REPOSITORY_INTELLIGENCE_V2_CAPABILITY_REGISTRATION_V1_REPORT_PATH,
    REPOSITORY_INTELLIGENCE_V2_CAPABILITY_REGISTRATION_V1_PASS_VERDICT
  );
  const capabilityReport = capabilityRegistrationPassed
    ? readJson<{ registration_status?: string; v2_validated_entity_count?: number }>(
        root,
        REPOSITORY_INTELLIGENCE_V2_CAPABILITY_REGISTRATION_V1_REPORT_PATH
      )
    : null;
  const syncReport = readJson<{
    synchronized?: boolean;
    v2_validated_entity_count?: number;
  }>(root, REPOSITORY_INTELLIGENCE_V2_PROJECT_BRAIN_SYNC_V1_REPORT_PATH);
  const syncArtifact = readJson<{ synchronized?: boolean }>(
    root,
    REPOSITORY_INTELLIGENCE_V2_PROJECT_BRAIN_SYNC_V1_PATH
  );

  const domainReady =
    syncReport?.synchronized === true &&
    syncArtifact?.synchronized === true &&
    capabilityRegistrationPassed &&
    capabilityReport?.registration_status === 'registered';

  const v2ReinvestmentComplete =
    domainReady && (capabilityReport?.v2_validated_entity_count ?? 0) > 0;

  return {
    domain_ready: domainReady,
    v2_reinvestment_complete: v2ReinvestmentComplete,
    completed: domainReady && v2ReinvestmentComplete,
  };
}

function resolveDomainCompletionEvidence(
  root: string,
  spec: (typeof ELIGIBLE_V2_DOMAIN_EVIDENCE)[number]
): DomainCompletionEvidence {
  const reportPassed = phaseReportPassed(root, spec.report_path, spec.pass_verdict);
  const artifactPresent = pathExists(root, spec.artifact_path);
  const report = reportPassed
    ? readJson<{
        domain_ready?: boolean;
        v2_reinvestment_complete?: boolean;
        synchronized?: boolean;
        decision_fingerprint?: string;
      }>(root, spec.report_path)
    : null;

  let domainReady = false;
  let v2ReinvestmentComplete = false;
  let completed = false;

  if (spec.completion_mode === 'v2_domain_certification') {
    domainReady = report?.domain_ready === true;
    v2ReinvestmentComplete = report?.v2_reinvestment_complete === true;
    completed = domainReady && v2ReinvestmentComplete;
  } else {
    const repositoryCompletion = resolveRepositoryIntelligenceCompletion(root);
    domainReady = repositoryCompletion.domain_ready;
    v2ReinvestmentComplete = repositoryCompletion.v2_reinvestment_complete;
    completed = repositoryCompletion.completed;
  }

  const certified = reportPassed && artifactPresent && completed;

  return {
    domain_id: spec.domain_id,
    capability_id: spec.capability_id,
    report_path: spec.report_path,
    pass_verdict: spec.pass_verdict,
    artifact_path: spec.artifact_path,
    completion_mode: spec.completion_mode,
    report_passed: reportPassed,
    artifact_present: artifactPresent,
    domain_ready: domainReady,
    v2_reinvestment_complete: v2ReinvestmentComplete,
    completed,
    certified,
    decision_fingerprint: report?.decision_fingerprint ?? null,
  };
}

function validateGlobalContracts(input: {
  goalTruthSatisfied: boolean;
  allEligibleDomainsCompleted: boolean;
  domainCertificationsVerified: boolean;
  evidenceChainComplete: boolean;
  globalReady: boolean;
}) {
  const results = [
    {
      contract_id: 'VAGC_GOAL_TRUTH_SATISFIED',
      verdict: input.goalTruthSatisfied ? 'PASS' : 'FAIL',
    },
    {
      contract_id: 'VAGC_ALL_ELIGIBLE_DOMAINS_COMPLETED',
      verdict: input.allEligibleDomainsCompleted ? 'PASS' : 'FAIL',
    },
    {
      contract_id: 'VAGC_DOMAIN_CERTIFICATIONS_VERIFIED',
      verdict: input.domainCertificationsVerified ? 'PASS' : 'FAIL',
    },
    {
      contract_id: 'VAGC_EVIDENCE_CHAIN_COMPLETE',
      verdict: input.evidenceChainComplete ? 'PASS' : 'FAIL',
    },
    { contract_id: 'VAGC_GLOBAL_READY', verdict: input.globalReady ? 'PASS' : 'FAIL' },
  ] as const;

  const pass = results.every((result) => result.verdict === 'PASS');
  return { results, aggregate_verdict: pass ? ('PASS' as const) : ('FAIL' as const) };
}

function computeDecisionFingerprint(input: {
  goalTruthFingerprint: string;
  certifiedDomains: string[];
  completedCount: number;
  eligibleCount: number;
  certificationName: string;
}): string {
  return [
    input.goalTruthFingerprint,
    `certified=${input.certifiedDomains.join(',')}`,
    `completed=${input.completedCount}/${input.eligibleCount}`,
    `cert=${input.certificationName}`,
  ].join('|');
}

export function writeVerticalAiGlobalCertificationV1EngineReport(): {
  passed: boolean;
  verdict: string;
  reportPath: string;
} {
  const root = resolveProjectRoot();
  const generatedAt = new Date().toISOString();
  const issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }> = [];

  if (!pathExists(root, PROJECT_BRAIN_VERTICAL_ONTOLOGY_V1_PATH)) {
    issues.push({
      code: 'ONTOLOGY_MISSING',
      message: `Vertical ontology required: ${PROJECT_BRAIN_VERTICAL_ONTOLOGY_V1_PATH}`,
      severity: 'error',
    });
  }

  if (!pathExists(root, PROJECT_BRAIN_LPM_V1_PATH)) {
    issues.push({
      code: 'LPM_MISSING',
      message: `LPM required for global certification evidence: ${PROJECT_BRAIN_LPM_V1_PATH}`,
      severity: 'error',
    });
  }

  const domainEvidence = ELIGIBLE_V2_DOMAIN_EVIDENCE.map((spec) =>
    resolveDomainCompletionEvidence(root, spec)
  );

  for (const domain of domainEvidence) {
    if (!domain.report_passed) {
      issues.push({
        code: 'DOMAIN_REPORT_NOT_PASSED',
        message: `${domain.pass_verdict} required for ${domain.domain_id}`,
        severity: 'error',
      });
    }
    if (!domain.artifact_present) {
      issues.push({
        code: 'DOMAIN_ARTIFACT_MISSING',
        message: `V2 completion artifact required for ${domain.domain_id}: ${domain.artifact_path}`,
        severity: 'error',
      });
    }
    if (!domain.completed) {
      issues.push({
        code: 'DOMAIN_NOT_COMPLETED',
        message: `${domain.domain_id} must show domain_ready and v2_reinvestment_complete evidence`,
        severity: 'error',
      });
    }
    if (!domain.certified) {
      issues.push({
        code: 'DOMAIN_NOT_CERTIFIED',
        message: `${domain.domain_id} failed V2 global eligibility certification checks`,
        severity: 'error',
      });
    }
  }

  const goalTruth = loadCurrentGoalTruth(root);
  const allGoalsSatisfied = goalTruth.entries.every((entry) => entry.satisfied);

  if (!allGoalsSatisfied) {
    issues.push({
      code: 'GOAL_TRUTH',
      message: 'All Current Goal Truth entries must be satisfied for global V2 certification',
      severity: 'error',
    });
  }

  const completedCount = domainEvidence.filter((domain) => domain.completed).length;
  const certifiedCount = domainEvidence.filter((domain) => domain.certified).length;
  const eligibleCount = ELIGIBLE_V2_DOMAIN_EVIDENCE.length;
  const certifiedDomains = domainEvidence
    .filter((domain) => domain.certified)
    .map((domain) => domain.domain_id);

  const allEligibleDomainsCompleted = completedCount === eligibleCount;
  const domainCertificationsVerified = certifiedCount === eligibleCount;
  const evidenceChainComplete =
    domainEvidence.every((domain) => domain.report_passed && domain.artifact_present) &&
    allEligibleDomainsCompleted;

  const globalReady =
    allGoalsSatisfied &&
    allEligibleDomainsCompleted &&
    domainCertificationsVerified &&
    evidenceChainComplete;

  const contractValidation = validateGlobalContracts({
    goalTruthSatisfied: allGoalsSatisfied,
    allEligibleDomainsCompleted,
    domainCertificationsVerified,
    evidenceChainComplete,
    globalReady,
  });

  if (contractValidation.aggregate_verdict !== 'PASS') {
    issues.push({
      code: 'GLOBAL_CONTRACT_FAILURE',
      message: 'One or more Vertical AI global certification contracts failed',
      severity: 'error',
    });
  }

  const decisionFingerprint = computeDecisionFingerprint({
    goalTruthFingerprint: goalTruth.fingerprint,
    certifiedDomains,
    completedCount,
    eligibleCount,
    certificationName: CERTIFICATION_NAME,
  });

  writeJson(root, VERTICAL_AI_GLOBAL_DOMAIN_EVIDENCE_CHAIN_CERTIFICATION_V1_PATH, {
    vertical_ai_global_domain_evidence_chain_certification_v1_id:
      'vertical_ai_global_domain_evidence_chain_certification_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    certification_only: true,
    certification_name: CERTIFICATION_NAME,
    eligible_domain_count: eligibleCount,
    completed_domain_count: completedCount,
    certified_domain_count: certifiedCount,
    domain_completion_evidence: domainEvidence,
    evidence_chain_complete: evidenceChainComplete,
    objective_evidence: domainEvidence.map(
      (domain) =>
        `${domain.domain_id}=${domain.certified}:${domain.pass_verdict}:completed=${domain.completed}:artifact=${domain.artifact_present}`
    ),
  });

  writeJson(root, VERTICAL_AI_GLOBAL_CERTIFICATION_CONTRACTS_V1_PATH, {
    vertical_ai_global_certification_contracts_v1_id:
      'vertical_ai_global_certification_contracts_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PHASE,
    generated_at: generatedAt,
    certification_ref: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PATH,
    contract_results: contractValidation.results,
    aggregate_verdict: contractValidation.aggregate_verdict,
  });

  writeJson(root, VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PATH, {
    vertical_ai_global_certification_v1_id: 'vertical_ai_global_certification_v1',
    architecture_version: PROJECT_BRAIN_ARCHITECTURE_VERSION,
    phase: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PHASE,
    system_id: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    mode: 'READ_ONLY',
    certification_only: true,
    certification_name: CERTIFICATION_NAME,
    decision_fingerprint: decisionFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    eligible_domain_count: eligibleCount,
    completed_domain_count: completedCount,
    certified_domain_count: certifiedCount,
    certified_domains: certifiedDomains,
    evidence_chain_complete: evidenceChainComplete,
    global_ready: globalReady,
    domain_completion_evidence: domainEvidence,
    evidence_chain_ref: VERTICAL_AI_GLOBAL_DOMAIN_EVIDENCE_CHAIN_CERTIFICATION_V1_PATH,
    contracts_ref: VERTICAL_AI_GLOBAL_CERTIFICATION_CONTRACTS_V1_PATH,
    certification_scope:
      'Global V2 domain readiness certified from per-domain PASS evidence; no additional implementation performed.',
    objective_evidence: [
      `eligible=${eligibleCount}`,
      `completed=${completedCount}`,
      `certified=${certifiedCount}`,
      `domains=${certifiedDomains.join(',')}`,
      `goal_truth=${allGoalsSatisfied}`,
    ],
  });

  writeJson(root, VERTICAL_AI_GLOBAL_CERTIFICATION_REGISTRY_V1_PATH, {
    registry_id: 'vertical-ai-global-certification-registry-v1',
    phase: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PHASE,
    system_id: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_SYSTEM_ID,
    version: 'global_certification_v1',
    generated_at: generatedAt,
    certification_ref: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PATH,
    evidence_chain_ref: VERTICAL_AI_GLOBAL_DOMAIN_EVIDENCE_CHAIN_CERTIFICATION_V1_PATH,
    contracts_ref: VERTICAL_AI_GLOBAL_CERTIFICATION_CONTRACTS_V1_PATH,
    decision_fingerprint: decisionFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    global_ready: globalReady,
    certified_domain_count: certifiedCount,
    certified_domains: certifiedDomains,
  });

  const passed =
    globalReady &&
    contractValidation.aggregate_verdict === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const verdict = passed
    ? VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PASS_VERDICT
    : VERTICAL_AI_GLOBAL_CERTIFICATION_V1_FAIL_VERDICT;

  const report = {
    report_id: `vertical_ai_global_certification_v1_${Date.now()}`,
    phase: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PHASE,
    system_id: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_SYSTEM_ID,
    generated_at: generatedAt,
    goal: 'Certify all eligible completed Vertical AI V2 domains.',
    vertical_ai_global_certification_v1_passed: passed,
    final_verdict: verdict,
    status: passed
      ? VERTICAL_AI_GLOBAL_CERTIFICATION_V1_STATUS
      : 'VERTICAL_AI_V2_GLOBAL_DOMAIN_NOT_READY',
    validation_passed: passed,
    certification_only: true,
    certification_name: CERTIFICATION_NAME,
    decision_fingerprint: decisionFingerprint,
    goal_truth_fingerprint: goalTruth.fingerprint,
    eligible_domain_count: eligibleCount,
    completed_domain_count: completedCount,
    certified_domain_count: certifiedCount,
    certified_domains: certifiedDomains,
    evidence_chain_complete: evidenceChainComplete,
    global_ready: globalReady,
    domain_completion_evidence: domainEvidence,
    contract_validation: contractValidation,
    certification_ref: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_PATH,
    evidence_chain_ref: VERTICAL_AI_GLOBAL_DOMAIN_EVIDENCE_CHAIN_CERTIFICATION_V1_PATH,
    contracts_ref: VERTICAL_AI_GLOBAL_CERTIFICATION_CONTRACTS_V1_PATH,
    registry_ref: VERTICAL_AI_GLOBAL_CERTIFICATION_REGISTRY_V1_PATH,
    checks: {
      GOAL_TRUTH_SATISFIED: allGoalsSatisfied,
      ALL_ELIGIBLE_DOMAINS_COMPLETED: allEligibleDomainsCompleted,
      DOMAIN_CERTIFICATIONS_VERIFIED: domainCertificationsVerified,
      EVIDENCE_CHAIN_COMPLETE: evidenceChainComplete,
      GLOBAL_READY: globalReady,
      ONTOLOGY_PRESENT: pathExists(root, PROJECT_BRAIN_VERTICAL_ONTOLOGY_V1_PATH),
      LPM_PRESENT: pathExists(root, PROJECT_BRAIN_LPM_V1_PATH),
    },
    issues,
    execution_flags: {
      global_certification: true,
      certification_only: true,
      read_only: true,
      brain_modification: false,
      lpm_mutation: false,
      evidence_derived: true,
    },
  };

  writeJson(root, VERTICAL_AI_GLOBAL_CERTIFICATION_V1_REPORT_PATH, report);

  return {
    passed,
    verdict,
    reportPath: VERTICAL_AI_GLOBAL_CERTIFICATION_V1_REPORT_PATH,
  };
}
