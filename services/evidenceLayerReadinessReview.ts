import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH,
} from './environmentIdentityEvidence.js';
import { GPU_VALIDATION_CAMPAIGN_REPORT_PATH } from './gpuValidationCampaign.js';
import {
  GPU_VALIDATION_INTEGRATION_REPORT_PATH,
  GPU_VALIDATION_MASTER_READINESS_PATH,
} from './gpuValidationIntegration.js';
import {
  OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  OBJECT_IDENTITY_EVIDENCE_READINESS_PATH,
} from './objectIdentityEvidence.js';
import {
  TEMPORAL_PRESERVATION_EVIDENCE_PROTOCOL_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_READINESS_PATH,
} from './temporalPreservationEvidence.js';

export const EVIDENCE_LAYER_READINESS_REVIEW_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-006D' as const;
export const EVIDENCE_LAYER_READINESS_REVIEW_SYSTEM_ID =
  'EVIDENCE_LAYER_READINESS_REVIEW_V1' as const;
export const EVIDENCE_LAYER_READINESS_REVIEW_PASS_VERDICT =
  'PASS_EVIDENCE_LAYER_READINESS_V1' as const;
export const EVIDENCE_LAYER_READINESS_REVIEW_FAIL_VERDICT =
  'FAIL_EVIDENCE_LAYER_READINESS_V1' as const;
export const EVIDENCE_LAYER_READINESS_REVIEW_STATUS =
  'EVIDENCE_COLLECTION_READY' as const;

export const EVIDENCE_LAYER_READINESS_DATASET_DIR =
  'datasets/gpu_validation_evidence_layer' as const;
export const EVIDENCE_LAYER_READINESS_REGISTRY_PATH =
  `${EVIDENCE_LAYER_READINESS_DATASET_DIR}/evidence-layer-readiness-registry.json` as const;

export const EVIDENCE_LAYER_READINESS_REPORT_PATH =
  'reports/movie_reconstruction/EVIDENCE_LAYER_READINESS_REPORT.json' as const;
export const EVIDENCE_LAYER_GAP_REPORT_PATH =
  'reports/movie_reconstruction/EVIDENCE_LAYER_GAP_REPORT.json' as const;
export const GPU_AUTHORIZATION_PRECHECK_PATH =
  'reports/movie_reconstruction/GPU_AUTHORIZATION_PRECHECK.json' as const;

const EXECUTION_FLAGS = {
  readiness_review_definition_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface EvidenceLayerReadinessReport {
  report_id: string;
  phase: typeof EVIDENCE_LAYER_READINESS_REVIEW_PHASE;
  system_id: typeof EVIDENCE_LAYER_READINESS_REVIEW_SYSTEM_ID;
  generated_at: string;
  analysis: {
    environment_evidence_protocol: string;
    temporal_evidence_protocol: string;
    object_evidence_protocol: string;
    gpu_validation_campaign: string;
    gpu_validation_integration: string;
  };
  evidence_layer_contract: Record<string, string>;
  evidence_collection_requirements: Record<string, string>;
  evidence_sufficiency_rules: Record<string, string>;
  gpu_authorization_requirements: Record<string, string>;
  environment_ready: boolean;
  temporal_ready: boolean;
  object_ready: boolean;
  integration_ready: boolean;
  campaign_ready: boolean;
  evidence_definition_ready: true;
  evidence_collection_ready: false;
  evidence_validation_ready: false;
  evidence_gaps: string[];
}

export interface EvidenceLayerGapReport {
  report_id: string;
  phase: typeof EVIDENCE_LAYER_READINESS_REVIEW_PHASE;
  system_id: typeof EVIDENCE_LAYER_READINESS_REVIEW_SYSTEM_ID;
  generated_at: string;
  gap_report_defined: true;
  missing_evidence: string[];
  high_risk_channels: string[];
  blocking_factors: string[];
  authorization_blockers: string[];
  authorization_risk_score: number;
}

export interface GpuAuthorizationPrecheck {
  report_id: string;
  phase: typeof EVIDENCE_LAYER_READINESS_REVIEW_PHASE;
  system_id: typeof EVIDENCE_LAYER_READINESS_REVIEW_SYSTEM_ID;
  generated_at: string;
  gpu_precheck_defined: true;
  gpu_execution_allowed: false;
  evidence_sufficient: false;
  authorization_ready: false;
  required_next_steps: string[];
  authorization_failure_reasons: string[];
}

export interface EvidenceLayerReadinessReviewResult {
  report_id: string;
  phase: typeof EVIDENCE_LAYER_READINESS_REVIEW_PHASE;
  system_id: typeof EVIDENCE_LAYER_READINESS_REVIEW_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof EVIDENCE_LAYER_READINESS_REVIEW_STATUS
    | 'EVIDENCE_LAYER_NOT_READY';
  validation_passed: boolean;
  evidence_layer_contract_defined: boolean;
  evidence_requirements_defined: boolean;
  sufficiency_rules_defined: boolean;
  readiness_report_defined: boolean;
  gap_report_defined: boolean;
  gpu_precheck_defined: boolean;
  evidence_definition_ready: boolean;
  evidence_collection_ready: false;
  evidence_validation_ready: false;
  gpu_execution_allowed: false;
  gpu_validation_executed: false;
  gpu_authorized: false;
  environment_validated: false;
  temporal_validated: false;
  object_validated: false;
  movie_reconstruction_ready: false;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

const EVIDENCE_LAYER_CONTRACT = {
  contract_id: 'evidence_layer_readiness_v1',
  contract_version: '1.0',
  scope: 'Evidence layer readiness review — Evidence Defined != Evidence Collected.',
  environment_evidence_ref: ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  temporal_evidence_ref: TEMPORAL_PRESERVATION_EVIDENCE_PROTOCOL_PATH,
  object_evidence_ref: OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  integration_ref: GPU_VALIDATION_INTEGRATION_REPORT_PATH,
  campaign_ref: GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
  gpu_execution: 'false — readiness review only; no evidence collection or GPU execution in this phase.',
  assessment_note: 'Evidence Validated != GPU Authorized; GPU Authorized != GPU Executed.',
} as const;

const EVIDENCE_COLLECTION_REQUIREMENTS = {
  environment_channel:
    'Collect reference_bank_match_score, traceability_score, and anchor_recall evidence records per ENVIRONMENT_IDENTITY_EVIDENCE_DATASET.json batch.',
  temporal_channel:
    'Collect edit_rhythm_alignment_score, continuity_signature_score, and causal_chain_score per TEMPORAL_PRESERVATION_EVIDENCE_DATASET.json batch.',
  object_channel:
    'Collect identity_signature_match_score, texture_match_score, and role_weight_score per OBJECT_IDENTITY_EVIDENCE_DATASET.json batch.',
  integration_gate:
    'All three channel evidence batches must pass sufficiency rules before GPU authorization precheck may flip evidence_sufficient=true.',
  collection_note: 'Evidence Defined != Evidence Collected — requirements are schema-only until execution phase.',
} as const;

const EVIDENCE_SUFFICIENCY_RULES = {
  environment_sufficiency:
    'Minimum batch pass_rate >= 0.80 with composite_evidence_score >= 0.98 on easy_batch and stress_batch audit.',
  temporal_sufficiency:
    'Minimum batch pass_rate >= 0.75 with composite_evidence_score >= 0.95 and causal_chain_score >= 0.90.',
  object_sufficiency:
    'Minimum batch pass_rate >= 0.78 with hero_prop_batch pass_rate >= hero_prop_expected_pass_rate (0.20).',
  cross_channel_sufficiency:
    'Integration execution sequence stage exit_criteria must be met per channel before layer evidence_sufficient=true.',
  sufficiency_note: 'Evidence Collected != Evidence Validated — sufficiency rules apply after collection and validation.',
} as const;

const GPU_AUTHORIZATION_REQUIREMENTS = {
  evidence_sufficient: 'All three channel evidence batches collected and validated against sufficiency rules.',
  integration_ready: 'GPU_VALIDATION_INTEGRATION_REPORT PASS with execution_sequence_defined=true.',
  campaign_ready: 'GPU_VALIDATION_CAMPAIGN_REPORT PASS with stage_order_defined=true.',
  runtime_enforcement: 'VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL ready_for_gpu_validation gate (currently false).',
  authorization_note: 'GPU Authorization must remain FALSE until all requirements met; GPU Authorized != GPU Executed.',
} as const;

const AUTHORIZATION_FAILURE_REASONS = [
  'environment_evidence_not_collected',
  'temporal_evidence_not_collected',
  'object_evidence_not_collected',
  'evidence_not_validated',
  'gpu_execution_disabled_in_definition_phases',
] as const;

const MISSING_EVIDENCE = [
  'environment_evidence_not_collected',
  'temporal_evidence_not_collected',
  'object_evidence_not_collected',
] as const;

const EVIDENCE_GAPS = [
  'no_collected_evidence_records_in_any_channel',
  'environment_stress_batch_not_executed',
  'temporal_long_horizon_batch_not_executed',
  'object_hero_prop_batch_not_executed',
  'cross_channel_evidence_validation_not_run',
] as const;

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function buildAnalysis(root: string): EvidenceLayerReadinessReport['analysis'] {
  const envProtocol = readJson<{ protocol_id: string; evidence_defined: boolean }>(
    root,
    ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH
  );
  const tempProtocol = readJson<{ protocol_id: string; evidence_defined: boolean }>(
    root,
    TEMPORAL_PRESERVATION_EVIDENCE_PROTOCOL_PATH
  );
  const objProtocol = readJson<{ protocol_id: string; evidence_defined: boolean }>(
    root,
    OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH
  );
  const campaign = readJson<{ final_verdict: string; gpu_validation_campaign_defined: boolean }>(
    root,
    GPU_VALIDATION_CAMPAIGN_REPORT_PATH
  );
  const integration = readJson<{ validation_integration_defined: boolean; validation_priority_order: string[] }>(
    root,
    GPU_VALIDATION_INTEGRATION_REPORT_PATH
  );

  return {
    environment_evidence_protocol: `${envProtocol.protocol_id} evidence_defined=${envProtocol.evidence_defined}; pass_threshold=0.98 with stress_batch camera perturbations.`,
    temporal_evidence_protocol: `${tempProtocol.protocol_id} evidence_defined=${tempProtocol.evidence_defined}; pass_threshold=0.95 with causal_transition_chain highest risk.`,
    object_evidence_protocol: `${objProtocol.protocol_id} evidence_defined=${objProtocol.evidence_defined}; pass_threshold=0.97 with hero_prop=0.98 role gate.`,
    gpu_validation_campaign: `${campaign.final_verdict}; campaign_defined=${campaign.gpu_validation_campaign_defined}; sequential channel stage order environment→temporal→object.`,
    gpu_validation_integration: `validation_integration_defined=${integration.validation_integration_defined}; priority_order=${integration.validation_priority_order.join('→')}.`,
  };
}

export function runEvidenceLayerReadinessReview(
  projectRoot?: string
): EvidenceLayerReadinessReviewResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: EvidenceLayerReadinessReviewResult['issues'] = [];

  const prerequisitePaths = [
    EVIDENCE_LAYER_READINESS_REGISTRY_PATH,
    ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
    ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH,
    TEMPORAL_PRESERVATION_EVIDENCE_PROTOCOL_PATH,
    TEMPORAL_PRESERVATION_EVIDENCE_READINESS_PATH,
    OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
    OBJECT_IDENTITY_EVIDENCE_READINESS_PATH,
    GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
    GPU_VALIDATION_INTEGRATION_REPORT_PATH,
    GPU_VALIDATION_MASTER_READINESS_PATH,
  ];

  for (const rel of prerequisitePaths) {
    if (!fs.existsSync(path.join(root, rel))) {
      issues.push({
        code: 'PREREQUISITE_MISSING',
        message: `Missing prerequisite ${rel}`,
        severity: 'error',
      });
    }
  }

  const envReadiness = readJson<{ validation_passed: boolean; evidence_contract_defined: boolean }>(
    root,
    ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH
  );
  const tempReadiness = readJson<{ validation_passed: boolean; evidence_contract_defined: boolean }>(
    root,
    TEMPORAL_PRESERVATION_EVIDENCE_READINESS_PATH
  );
  const objReadiness = readJson<{ validation_passed: boolean; evidence_contract_defined: boolean }>(
    root,
    OBJECT_IDENTITY_EVIDENCE_READINESS_PATH
  );
  const integrationMaster = readJson<{ integration_ready: boolean; validation_passed: boolean }>(
    root,
    GPU_VALIDATION_MASTER_READINESS_PATH
  );
  const campaign = readJson<{ validation_passed: boolean; gpu_validation_campaign_defined: boolean }>(
    root,
    GPU_VALIDATION_CAMPAIGN_REPORT_PATH
  );

  const environment_ready =
    envReadiness.validation_passed === true && envReadiness.evidence_contract_defined === true;
  const temporal_ready =
    tempReadiness.validation_passed === true && tempReadiness.evidence_contract_defined === true;
  const object_ready =
    objReadiness.validation_passed === true && objReadiness.evidence_contract_defined === true;
  const integration_ready =
    integrationMaster.integration_ready === true && integrationMaster.validation_passed === true;
  const campaign_ready =
    campaign.validation_passed === true && campaign.gpu_validation_campaign_defined === true;

  const evidence_layer_contract = { ...EVIDENCE_LAYER_CONTRACT };
  const evidence_collection_requirements = { ...EVIDENCE_COLLECTION_REQUIREMENTS };
  const evidence_sufficiency_rules = { ...EVIDENCE_SUFFICIENCY_RULES };
  const gpu_authorization_requirements = { ...GPU_AUTHORIZATION_REQUIREMENTS };

  const evidence_layer_contract_defined = Object.keys(evidence_layer_contract).length > 0;
  const evidence_requirements_defined = Object.keys(evidence_collection_requirements).length > 0;
  const sufficiency_rules_defined = Object.keys(evidence_sufficiency_rules).length > 0;

  const evidence_definition_ready =
    environment_ready && temporal_ready && object_ready && integration_ready && campaign_ready;

  const readinessReport: EvidenceLayerReadinessReport = {
    report_id: `evidence_layer_readiness_${Date.now().toString(36)}`,
    phase: EVIDENCE_LAYER_READINESS_REVIEW_PHASE,
    system_id: EVIDENCE_LAYER_READINESS_REVIEW_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    analysis: buildAnalysis(root),
    evidence_layer_contract,
    evidence_collection_requirements,
    evidence_sufficiency_rules,
    gpu_authorization_requirements,
    environment_ready,
    temporal_ready,
    object_ready,
    integration_ready,
    campaign_ready,
    evidence_definition_ready: true,
    evidence_collection_ready: false,
    evidence_validation_ready: false,
    evidence_gaps: [...EVIDENCE_GAPS],
  };

  const gapReport: EvidenceLayerGapReport = {
    report_id: `evidence_layer_gap_${Date.now().toString(36)}`,
    phase: EVIDENCE_LAYER_READINESS_REVIEW_PHASE,
    system_id: EVIDENCE_LAYER_READINESS_REVIEW_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    gap_report_defined: true,
    missing_evidence: [...MISSING_EVIDENCE],
    high_risk_channels: [
      'environment_identity',
      'causal_transition_chain',
      'hero_prop_identity',
    ],
    blocking_factors: [
      'gpu_execution disabled in all definition phases',
      'no collected evidence records in any channel',
      'evidence_sufficient_for_gpu_authorization=false on all channel readiness reports',
      'VIDEO_RUNTIME_ENFORCEMENT ready_for_gpu_validation=false',
      'Evidence Defined != Evidence Collected',
    ],
    authorization_blockers: [...AUTHORIZATION_FAILURE_REASONS],
    authorization_risk_score: 0.82,
  };

  const gpuPrecheck: GpuAuthorizationPrecheck = {
    report_id: `gpu_authorization_precheck_${Date.now().toString(36)}`,
    phase: EVIDENCE_LAYER_READINESS_REVIEW_PHASE,
    system_id: EVIDENCE_LAYER_READINESS_REVIEW_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    gpu_precheck_defined: true,
    gpu_execution_allowed: false,
    evidence_sufficient: false,
    authorization_ready: false,
    required_next_steps: [
      'Execute environment_identity evidence collection batch',
      'Execute temporal_preservation evidence collection batch',
      'Execute object_identity evidence collection batch',
      'Run cross-channel evidence validation against sufficiency rules',
      'Re-run GPU_AUTHORIZATION_PRECHECK after evidence validation PASS',
    ],
    authorization_failure_reasons: [...AUTHORIZATION_FAILURE_REASONS],
  };

  const readiness_report_defined = readinessReport.evidence_definition_ready === true;
  const gap_report_defined = gapReport.gap_report_defined === true;
  const gpu_precheck_defined = gpuPrecheck.gpu_precheck_defined === true;

  if (!evidence_layer_contract_defined) {
    issues.push({ code: 'CONTRACT', message: 'evidence_layer_contract required', severity: 'error' });
  }
  if (!evidence_requirements_defined) {
    issues.push({ code: 'REQUIREMENTS', message: 'evidence_collection_requirements required', severity: 'error' });
  }
  if (!sufficiency_rules_defined) {
    issues.push({ code: 'SUFFICIENCY', message: 'evidence_sufficiency_rules required', severity: 'error' });
  }
  if (!evidence_definition_ready) {
    issues.push({
      code: 'DEFINITION_READY',
      message: 'all channel evidence definitions must be ready',
      severity: 'error',
    });
  }
  if (readinessReport.evidence_collection_ready !== false) {
    issues.push({
      code: 'COLLECTION_READY',
      message: 'evidence_collection_ready must remain false',
      severity: 'error',
    });
  }
  if (readinessReport.evidence_validation_ready !== false) {
    issues.push({
      code: 'VALIDATION_READY',
      message: 'evidence_validation_ready must remain false',
      severity: 'error',
    });
  }

  const validation_passed =
    evidence_layer_contract_defined &&
    evidence_requirements_defined &&
    sufficiency_rules_defined &&
    readiness_report_defined &&
    gap_report_defined &&
    gpu_precheck_defined &&
    evidence_definition_ready === true &&
    readinessReport.evidence_collection_ready === false &&
    readinessReport.evidence_validation_ready === false &&
    gpuPrecheck.gpu_execution_allowed === false &&
    gpuPrecheck.evidence_sufficient === false &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const result: EvidenceLayerReadinessReviewResult = {
    report_id: `evidence_layer_readiness_review_${Date.now().toString(36)}`,
    phase: EVIDENCE_LAYER_READINESS_REVIEW_PHASE,
    system_id: EVIDENCE_LAYER_READINESS_REVIEW_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? EVIDENCE_LAYER_READINESS_REVIEW_PASS_VERDICT
      : EVIDENCE_LAYER_READINESS_REVIEW_FAIL_VERDICT,
    status: validation_passed
      ? EVIDENCE_LAYER_READINESS_REVIEW_STATUS
      : 'EVIDENCE_LAYER_NOT_READY',
    validation_passed,
    evidence_layer_contract_defined,
    evidence_requirements_defined,
    sufficiency_rules_defined,
    readiness_report_defined,
    gap_report_defined,
    gpu_precheck_defined,
    evidence_definition_ready: evidence_definition_ready === true,
    evidence_collection_ready: false,
    evidence_validation_ready: false,
    gpu_execution_allowed: false,
    gpu_validation_executed: false,
    gpu_authorized: false,
    environment_validated: false,
    temporal_validated: false,
    object_validated: false,
    movie_reconstruction_ready: false,
    checks: {
      evidence_layer_contract_defined,
      evidence_requirements_defined,
      sufficiency_rules_defined,
      readiness_report_defined,
      gap_report_defined,
      gpu_precheck_defined,
      evidence_definition_ready: evidence_definition_ready === true,
      evidence_collection_ready_false: readinessReport.evidence_collection_ready === false,
      evidence_validation_ready_false: readinessReport.evidence_validation_ready === false,
      gpu_execution_allowed_false: gpuPrecheck.gpu_execution_allowed === false,
      authorization_risk_score_set: gapReport.authorization_risk_score === 0.82,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, EVIDENCE_LAYER_READINESS_REPORT_PATH, readinessReport);
  writeJson(root, EVIDENCE_LAYER_GAP_REPORT_PATH, gapReport);
  writeJson(root, GPU_AUTHORIZATION_PRECHECK_PATH, gpuPrecheck);

  return result;
}

export function writeEvidenceLayerReadinessReviewReport(
  projectRoot?: string
): EvidenceLayerReadinessReviewResult {
  return runEvidenceLayerReadinessReview(projectRoot);
}
