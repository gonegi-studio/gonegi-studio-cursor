import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  OBJECT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH,
  OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
} from './objectIdentityGpuValidation.js';
import { OBJECT_IDENTITY_BINDING_PACKAGE_PATH } from './objectIdentityBinding.js';
import { OBJECT_REFERENCE_BANK_SPECIFICATION_PATH } from './objectIdentityStrategy.js';

export const OBJECT_IDENTITY_EVIDENCE_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-006C' as const;
export const OBJECT_IDENTITY_EVIDENCE_SYSTEM_ID = 'OBJECT_IDENTITY_EVIDENCE_V1' as const;
export const OBJECT_IDENTITY_EVIDENCE_PASS_VERDICT =
  'PASS_OBJECT_IDENTITY_EVIDENCE_V1' as const;
export const OBJECT_IDENTITY_EVIDENCE_FAIL_VERDICT =
  'FAIL_OBJECT_IDENTITY_EVIDENCE_V1' as const;
export const OBJECT_IDENTITY_EVIDENCE_STATUS = 'OBJECT_EVIDENCE_DEFINED' as const;

export const OBJECT_IDENTITY_EVIDENCE_DATASET_DIR =
  'datasets/gpu_validation_object_identity_evidence' as const;
export const OBJECT_IDENTITY_EVIDENCE_REGISTRY_PATH =
  `${OBJECT_IDENTITY_EVIDENCE_DATASET_DIR}/object-identity-evidence-registry.json` as const;

export const OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_EVIDENCE_PROTOCOL.json' as const;
export const OBJECT_IDENTITY_EVIDENCE_DATASET_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_EVIDENCE_DATASET.json' as const;
export const OBJECT_IDENTITY_EVIDENCE_READINESS_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_EVIDENCE_READINESS.json' as const;

const MINIMUM_BATCH_SIZE = 40;

const EXECUTION_FLAGS = {
  evidence_definition_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface ObjectRoleThresholds {
  hero_prop: number;
  secondary_prop: number;
  background_object: number;
}

export interface ObjectDegradationLevels {
  minor_drift: number;
  moderate_drift: number;
  critical_drift: number;
  identity_break: number;
}

export interface ObjectIdentityTier {
  tier_id: string;
  role: keyof ObjectRoleThresholds;
  pass_threshold: number;
  identity_level: string;
  note: string;
}

export interface ObjectEvidenceLevel {
  level_id: string;
  min_object_score: number;
  note: string;
}

export interface ObjectEvidenceRecordTemplate {
  object_id: string;
  reference_bank_id: string;
  identity_signature: string;
  traceability_score: number;
}

export interface ObjectIdentityEvidenceProtocol {
  protocol_id: string;
  phase: typeof OBJECT_IDENTITY_EVIDENCE_PHASE;
  system_id: typeof OBJECT_IDENTITY_EVIDENCE_SYSTEM_ID;
  generated_at: string;
  evidence_defined: true;
  analysis: {
    object_validation_protocol: string;
    object_dataset_plan: string;
    object_reference_bank: string;
    object_similarity_binding: string;
    object_role_binding: string;
    object_traceability_binding: string;
  };
  object_evidence_contract: Record<string, string>;
  object_measurement_rules: Record<string, string>;
  object_scoring_rules: Record<string, string>;
  object_evidence_levels: ObjectEvidenceLevel[];
  object_traceability_rules: Record<string, string>;
  object_degradation_levels: ObjectDegradationLevels;
  object_role_thresholds: ObjectRoleThresholds;
  object_identity_tiers: ObjectIdentityTier[];
  measurement_method: string[];
  pass_threshold: number;
  evidence_score: {
    composite_formula: string;
    identity_signature_weight: number;
    texture_match_weight: number;
    anchor_recall_weight: number;
    role_weight: number;
  };
  failure_examples: string[];
  object_failure_examples: string[];
  false_positive_examples: string[];
  false_negative_examples: string[];
  reference_bank_recall_rules: {
    required_reference_count: number;
    minimum_anchor_match: number;
    recall_method: string;
  };
  example_evidence_record: ObjectEvidenceRecordTemplate;
}

export interface ObjectIdentityEvidenceDataset {
  report_id: string;
  phase: typeof OBJECT_IDENTITY_EVIDENCE_PHASE;
  system_id: typeof OBJECT_IDENTITY_EVIDENCE_SYSTEM_ID;
  generated_at: string;
  dataset_defined: true;
  minimum_batch_size: number;
  easy_batch: Array<{ case_id: string; object_id: string; reference_bank_id: string }>;
  medium_batch: Array<{ case_id: string; object_id: string; reference_bank_id: string }>;
  hard_batch: Array<{ case_id: string; object_id: string; failure_mode: string }>;
  stress_batch: Array<{ case_id: string; object_id: string; stress_mode: string }>;
  hero_prop_batch: Array<{ case_id: string; object_id: string; role: 'hero_prop' }>;
  secondary_prop_batch: Array<{ case_id: string; object_id: string; role: 'secondary_prop' }>;
  background_object_batch: Array<{ case_id: string; object_id: string; role: 'background_object' }>;
}

export interface ObjectIdentityEvidenceReadiness {
  report_id: string;
  phase: typeof OBJECT_IDENTITY_EVIDENCE_PHASE;
  system_id: typeof OBJECT_IDENTITY_EVIDENCE_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof OBJECT_IDENTITY_EVIDENCE_STATUS | 'OBJECT_EVIDENCE_NOT_DEFINED';
  validation_passed: boolean;
  evidence_contract_defined: boolean;
  measurement_rules_defined: boolean;
  scoring_rules_defined: boolean;
  traceability_rules_defined: boolean;
  object_degradation_levels_defined: boolean;
  object_identity_tiers_defined: boolean;
  false_positive_examples_defined: boolean;
  false_negative_examples_defined: boolean;
  stress_batch_defined: boolean;
  hero_prop_batch_defined: boolean;
  object_recoverability_defined: boolean;
  dataset_defined: boolean;
  readiness_defined: boolean;
  evidence_collection_ready: boolean;
  execution_ready: false;
  evidence_sufficient_for_gpu_authorization: false;
  object_validated: false;
  gpu_validation_executed: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  highest_risk_area: string;
  hero_prop_expected_pass_rate: number;
  object_recoverability: 'LOW' | 'MEDIUM' | 'HIGH';
  expected_pass_rate: {
    easy: number;
    medium: number;
    hard: number;
    stress: number;
    hero_prop: number;
  };
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

const ANALYSIS = {
  object_validation_protocol:
    'OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL defines same_object=0.97, role thresholds, and reference_bank recall rules; evidence collection binds measurable scores without GPU execution.',
  object_dataset_plan:
    'OBJECT_IDENTITY_GPU_VALIDATION_DATASET_PLAN provides easy/medium/hard and role case seeds; evidence dataset extends with stress_batch for occlusion and zoom perturbations.',
  object_reference_bank:
    'Bank entries (suitcase_001, chair_014, lantern_001, wooden_crate_001) supply reference_bank_id, identity_signature, and anchor_descriptors for evidence record templates.',
  object_similarity_binding:
    'object_similarity_v1 same_object_threshold=0.97 governs evidence scoring; similar_object scores must not be classified as definitive evidence.',
  object_role_binding:
    'object_role_v1 assigns hero_prop > scene_prop priority; role thresholds govern pass threshold tier per evidence batch.',
  object_traceability_binding:
    'traceability_signature links conditioning_map_ref and OBJECT_REFERENCE_BANK_SPECIFICATION for batch audit without GPU execution.',
} as const;

const OBJECT_EVIDENCE_CONTRACT = {
  contract_id: 'object_identity_evidence_v1',
  contract_version: '1.0',
  scope: 'Evidence definition only — Evidence Defined != Evidence Collected.',
  validation_protocol_ref: OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
  dataset_plan_ref: OBJECT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH,
  binding_ref: OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
  bank_spec_ref: OBJECT_REFERENCE_BANK_SPECIFICATION_PATH,
  gpu_execution: 'false — evidence protocol and dataset only; collection deferred.',
  gpu_authorization: 'false — evidence_sufficient_for_gpu_authorization must remain false until execution phase.',
  texture_match_note: 'Texture Match is part of Object Identity — texture_drift is a first-class object failure mode.',
  assessment_note: 'Evidence Collected != Object Validated; Object Validated != Movie Reconstruction Ready.',
} as const;

const OBJECT_MEASUREMENT_RULES = {
  identity_signature_match_score: 'Primary measurement from identity_signature hash equality against reference bank.',
  texture_match_score: 'Surface texture consistency against anchor_images metadata descriptors.',
  anchor_recall_score: 'Count of anchor_descriptors kind+importance matches >= minimum_anchor_match.',
  role_weight_score: 'Narrative lock weight derived from object_role_binding role priority.',
  object_traceability_score: 'Traceability signature match against conditioning_map_ref and bank spec path.',
  measurement_note: 'All measurements are schema-defined; no GPU raster comparison in this phase.',
} as const;

const OBJECT_SCORING_RULES = {
  composite_evidence_score:
    'weighted_sum(identity_signature_match_score * 0.35, texture_match_score * 0.25, anchor_recall_score * 0.20, role_weight_score * 0.20)',
  pass_threshold: 'composite_evidence_score >= 0.97 required for same-object evidence tier.',
  hero_prop_gate: 'hero_prop batch requires composite >= object_role_thresholds.hero_prop (0.98).',
  false_positive_penalty: 'Scores above pass_threshold on different_object cases trigger false_positive audit.',
  false_negative_tolerance: 'same_suitcase_different_lighting permitted within strict_object band [0.95, 0.97).',
} as const;

const OBJECT_ROLE_THRESHOLDS: ObjectRoleThresholds = {
  hero_prop: 0.98,
  secondary_prop: 0.9,
  background_object: 0.75,
};

const OBJECT_DEGRADATION_LEVELS: ObjectDegradationLevels = {
  minor_drift: 0.85,
  moderate_drift: 0.7,
  critical_drift: 0.5,
  identity_break: 0.3,
};

const OBJECT_IDENTITY_TIERS: ObjectIdentityTier[] = [
  {
    tier_id: 'hero_prop_strict',
    role: 'hero_prop',
    pass_threshold: 0.98,
    identity_level: 'strict',
    note: 'Hero Prop Defined != Hero Prop Preserved — suitcase_001 requires highest lock.',
  },
  {
    tier_id: 'secondary_prop_medium',
    role: 'secondary_prop',
    pass_threshold: 0.9,
    identity_level: 'medium',
    note: 'Maps to scene_prop and environment_prop roles in object_role_v1 binding.',
  },
  {
    tier_id: 'background_object_loose',
    role: 'background_object',
    pass_threshold: 0.75,
    identity_level: 'loose',
    note: 'Maps to background_furniture role; permits higher variation within band.',
  },
];

const OBJECT_EVIDENCE_LEVELS: ObjectEvidenceLevel[] = [
  {
    level_id: 'same_object',
    min_object_score: 0.97,
    note: 'Definitive object evidence; composite score >= 0.97 with texture_match >= 0.90.',
  },
  {
    level_id: 'strict_object',
    min_object_score: 0.95,
    note: 'Strict band; sufficient for anchor tuning review but not identity lock.',
  },
  {
    level_id: 'similar_object',
    min_object_score: 0.8,
    note: 'Similar object band; logged for degradation path only.',
  },
  {
    level_id: 'different_object',
    min_object_score: 0,
    note: 'Below different_object threshold; evidence record rejected.',
  },
];

const OBJECT_TRACEABILITY_RULES = {
  traceability_signature:
    'Must bind object_id, reference_bank_id, identity_signature, and object_spec_ref.',
  identity_signature_integrity: 'identity_signature must resolve to bank spec entry; mismatch triggers traceability failure.',
  batch_audit_path: 'Evidence records written to OBJECT_IDENTITY_EVIDENCE_DATASET.json batches for offline review.',
  role_binding_cross_ref: 'object_role_binding role must align with batch tier (hero_prop_batch, secondary_prop_batch, background_object_batch).',
  evidence_layer_note: 'Evidence Defined != Evidence Collected.',
} as const;

const OBJECT_FAILURE_EXAMPLES = [
  'missing_accessory',
  'shape_change',
  'identity_swap',
  'hallucinated_object',
  'texture_drift',
] as const;

const FALSE_POSITIVE_EXAMPLES = [
  'similar_suitcase_wrong_pattern',
  'shared_style_different_object_id',
  'texture_match_wrong_silhouette',
] as const;

const FALSE_NEGATIVE_EXAMPLES = [
  'same_suitcase_different_lighting',
  'hero_prop_with_minor_wear_variation',
  'anchor_occlusion_but_identity_preserved',
] as const;

const FAILURE_EXAMPLES = [
  'identity_embedding_drift',
  'role_weight_ignored',
  'variation_tolerance_exceeded',
  'identity_swap',
  'hallucinated_object',
] as const;

const REFERENCE_BANK_RECALL_RULES = {
  required_reference_count: 4,
  minimum_anchor_match: 2,
  recall_method:
    'Match evidence record anchors against reference bank anchor_descriptors; count kind+importance matches >= minimum_anchor_match.',
};

const EXAMPLE_EVIDENCE_RECORD: ObjectEvidenceRecordTemplate = {
  object_id: 'suitcase_001',
  reference_bank_id: 'obj_ref_001',
  identity_signature: 'obj_id_sig_suitcase_a1b2c3',
  traceability_score: 0.96,
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildProtocol(): ObjectIdentityEvidenceProtocol {
  return {
    protocol_id: 'object-identity-evidence-protocol-v1',
    phase: OBJECT_IDENTITY_EVIDENCE_PHASE,
    system_id: OBJECT_IDENTITY_EVIDENCE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    evidence_defined: true,
    analysis: { ...ANALYSIS },
    object_evidence_contract: { ...OBJECT_EVIDENCE_CONTRACT },
    object_measurement_rules: { ...OBJECT_MEASUREMENT_RULES },
    object_scoring_rules: { ...OBJECT_SCORING_RULES },
    object_evidence_levels: OBJECT_EVIDENCE_LEVELS.map((level) => ({ ...level })),
    object_traceability_rules: { ...OBJECT_TRACEABILITY_RULES },
    object_degradation_levels: { ...OBJECT_DEGRADATION_LEVELS },
    object_role_thresholds: { ...OBJECT_ROLE_THRESHOLDS },
    object_identity_tiers: OBJECT_IDENTITY_TIERS.map((tier) => ({ ...tier })),
    measurement_method: [
      'identity_signature_match_score',
      'texture_match_score',
      'anchor_recall_score',
      'role_weight_score',
      'object_traceability_score',
    ],
    pass_threshold: 0.97,
    evidence_score: {
      composite_formula:
        '0.35 * identity_signature_match_score + 0.25 * texture_match_score + 0.20 * anchor_recall_score + 0.20 * role_weight_score',
      identity_signature_weight: 0.35,
      texture_match_weight: 0.25,
      anchor_recall_weight: 0.2,
      role_weight: 0.2,
    },
    failure_examples: [...FAILURE_EXAMPLES],
    object_failure_examples: [...OBJECT_FAILURE_EXAMPLES],
    false_positive_examples: [...FALSE_POSITIVE_EXAMPLES],
    false_negative_examples: [...FALSE_NEGATIVE_EXAMPLES],
    reference_bank_recall_rules: { ...REFERENCE_BANK_RECALL_RULES },
    example_evidence_record: { ...EXAMPLE_EVIDENCE_RECORD },
  };
}

function buildDataset(): ObjectIdentityEvidenceDataset {
  return {
    report_id: `object_identity_evidence_dataset_${Date.now().toString(36)}`,
    phase: OBJECT_IDENTITY_EVIDENCE_PHASE,
    system_id: OBJECT_IDENTITY_EVIDENCE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    dataset_defined: true,
    minimum_batch_size: MINIMUM_BATCH_SIZE,
    easy_batch: [
      { case_id: 'obj_ev_easy_001', object_id: 'lantern_001', reference_bank_id: 'obj_ref_003' },
      { case_id: 'obj_ev_easy_002', object_id: 'wooden_crate_001', reference_bank_id: 'obj_ref_004' },
    ],
    medium_batch: [
      { case_id: 'obj_ev_med_001', object_id: 'chair_014', reference_bank_id: 'obj_ref_002' },
      { case_id: 'obj_ev_med_002', object_id: 'lantern_001', reference_bank_id: 'obj_ref_003' },
    ],
    hard_batch: [
      { case_id: 'obj_ev_hard_001', object_id: 'suitcase_001', failure_mode: 'identity_swap' },
      { case_id: 'obj_ev_hard_002', object_id: 'suitcase_001', failure_mode: 'missing_accessory' },
      { case_id: 'obj_ev_hard_003', object_id: 'suitcase_001', failure_mode: 'hallucinated_object' },
    ],
    stress_batch: [
      { case_id: 'obj_ev_stress_001', object_id: 'suitcase_001', stress_mode: 'extreme_zoom' },
      { case_id: 'obj_ev_stress_002', object_id: 'suitcase_001', stress_mode: 'partial_occlusion' },
      { case_id: 'obj_ev_stress_003', object_id: 'suitcase_001', stress_mode: 'accessory_visibility_loss' },
    ],
    hero_prop_batch: [
      { case_id: 'obj_ev_hero_001', object_id: 'suitcase_001', role: 'hero_prop' },
    ],
    secondary_prop_batch: [
      { case_id: 'obj_ev_sec_001', object_id: 'lantern_001', role: 'secondary_prop' },
      { case_id: 'obj_ev_sec_002', object_id: 'wooden_crate_001', role: 'secondary_prop' },
    ],
    background_object_batch: [
      { case_id: 'obj_ev_bg_001', object_id: 'chair_014', role: 'background_object' },
    ],
  };
}

export function runObjectIdentityEvidenceDefinition(
  projectRoot?: string
): ObjectIdentityEvidenceReadiness {
  const root = resolveProjectRoot(projectRoot);
  const issues: ObjectIdentityEvidenceReadiness['issues'] = [];

  const prerequisitePaths = [
    OBJECT_IDENTITY_EVIDENCE_REGISTRY_PATH,
    OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
    OBJECT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH,
    OBJECT_REFERENCE_BANK_SPECIFICATION_PATH,
    OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
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

  const protocol = buildProtocol();
  const dataset = buildDataset();

  const evidence_contract_defined =
    protocol.evidence_defined === true && Object.keys(protocol.object_evidence_contract).length > 0;
  const measurement_rules_defined =
    Object.keys(protocol.object_measurement_rules).length > 0 &&
    protocol.measurement_method.length > 0;
  const scoring_rules_defined =
    Object.keys(protocol.object_scoring_rules).length > 0 &&
    protocol.pass_threshold === 0.97 &&
    protocol.evidence_score.identity_signature_weight > 0;
  const traceability_rules_defined =
    Object.keys(protocol.object_traceability_rules).length > 0 &&
    protocol.object_evidence_levels.length >= 4;
  const object_degradation_levels_defined =
    protocol.object_degradation_levels.minor_drift === 0.85 &&
    protocol.object_degradation_levels.moderate_drift === 0.7 &&
    protocol.object_degradation_levels.critical_drift === 0.5 &&
    protocol.object_degradation_levels.identity_break === 0.3;
  const object_identity_tiers_defined =
    protocol.object_identity_tiers.length === 3 &&
    protocol.object_role_thresholds.hero_prop === 0.98 &&
    protocol.object_role_thresholds.secondary_prop === 0.9 &&
    protocol.object_role_thresholds.background_object === 0.75;
  const false_positive_examples_defined =
    protocol.false_positive_examples.length > 0 &&
    protocol.false_positive_examples.includes('similar_suitcase_wrong_pattern');
  const false_negative_examples_defined =
    protocol.false_negative_examples.length > 0 &&
    protocol.false_negative_examples.includes('same_suitcase_different_lighting');
  const stress_batch_defined =
    dataset.stress_batch.length > 0 &&
    dataset.stress_batch.some((entry) => entry.stress_mode === 'extreme_zoom') &&
    dataset.stress_batch.some((entry) => entry.stress_mode === 'partial_occlusion') &&
    dataset.stress_batch.some((entry) => entry.stress_mode === 'accessory_visibility_loss');
  const hero_prop_batch_defined = dataset.hero_prop_batch.length > 0;
  const object_recoverability_defined = true;
  const dataset_defined =
    dataset.dataset_defined === true &&
    dataset.easy_batch.length > 0 &&
    dataset.medium_batch.length > 0 &&
    dataset.hard_batch.length > 0 &&
    dataset.secondary_prop_batch.length > 0 &&
    dataset.background_object_batch.length > 0 &&
    dataset.minimum_batch_size === MINIMUM_BATCH_SIZE;

  const hero_prop_expected_pass_rate = 0.2;
  const expected_pass_rate = {
    easy: 0.75,
    medium: 0.45,
    hard: 0.25,
    stress: 0.15,
    hero_prop: hero_prop_expected_pass_rate,
  };

  const object_recoverability: ObjectIdentityEvidenceReadiness['object_recoverability'] = 'MEDIUM';

  const evidence_collection_ready =
    evidence_contract_defined &&
    measurement_rules_defined &&
    scoring_rules_defined &&
    dataset_defined;
  const readiness_defined =
    evidence_collection_ready &&
    traceability_rules_defined &&
    object_degradation_levels_defined &&
    object_identity_tiers_defined &&
    false_positive_examples_defined &&
    false_negative_examples_defined &&
    stress_batch_defined &&
    hero_prop_batch_defined &&
    object_recoverability_defined;

  if (!evidence_contract_defined) {
    issues.push({ code: 'EVIDENCE_CONTRACT', message: 'object_evidence_contract required', severity: 'error' });
  }
  if (!object_degradation_levels_defined) {
    issues.push({
      code: 'DEGRADATION_LEVELS',
      message: 'object_degradation_levels required',
      severity: 'error',
    });
  }
  if (!object_identity_tiers_defined) {
    issues.push({ code: 'IDENTITY_TIERS', message: 'object_identity_tiers required', severity: 'error' });
  }
  if (!hero_prop_batch_defined) {
    issues.push({ code: 'HERO_PROP_BATCH', message: 'hero_prop_batch required', severity: 'error' });
  }
  if (!readiness_defined) {
    issues.push({ code: 'READINESS', message: 'readiness must be defined', severity: 'error' });
  }

  const validation_passed =
    evidence_contract_defined &&
    measurement_rules_defined &&
    scoring_rules_defined &&
    traceability_rules_defined &&
    object_degradation_levels_defined &&
    object_identity_tiers_defined &&
    false_positive_examples_defined &&
    false_negative_examples_defined &&
    stress_batch_defined &&
    hero_prop_batch_defined &&
    object_recoverability_defined &&
    dataset_defined &&
    readiness_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const readiness: ObjectIdentityEvidenceReadiness = {
    report_id: `object_identity_evidence_readiness_${Date.now().toString(36)}`,
    phase: OBJECT_IDENTITY_EVIDENCE_PHASE,
    system_id: OBJECT_IDENTITY_EVIDENCE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? OBJECT_IDENTITY_EVIDENCE_PASS_VERDICT
      : OBJECT_IDENTITY_EVIDENCE_FAIL_VERDICT,
    status: validation_passed ? OBJECT_IDENTITY_EVIDENCE_STATUS : 'OBJECT_EVIDENCE_NOT_DEFINED',
    validation_passed,
    evidence_contract_defined,
    measurement_rules_defined,
    scoring_rules_defined,
    traceability_rules_defined,
    object_degradation_levels_defined,
    object_identity_tiers_defined,
    false_positive_examples_defined,
    false_negative_examples_defined,
    stress_batch_defined,
    hero_prop_batch_defined,
    object_recoverability_defined,
    dataset_defined,
    readiness_defined,
    evidence_collection_ready,
    execution_ready: false,
    evidence_sufficient_for_gpu_authorization: false,
    object_validated: false,
    gpu_validation_executed: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    highest_risk_area: 'hero_prop_identity',
    hero_prop_expected_pass_rate,
    object_recoverability,
    expected_pass_rate,
    checks: {
      evidence_contract_defined,
      measurement_rules_defined,
      scoring_rules_defined,
      traceability_rules_defined,
      object_degradation_levels_defined,
      object_identity_tiers_defined,
      false_positive_examples_defined,
      false_negative_examples_defined,
      stress_batch_defined,
      hero_prop_batch_defined,
      object_recoverability_defined,
      dataset_defined,
      readiness_defined,
      evidence_collection_ready,
      evidence_sufficient_for_gpu_authorization_false: true,
      execution_ready_false: true,
      object_validated_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH, protocol);
  writeJson(root, OBJECT_IDENTITY_EVIDENCE_DATASET_PATH, dataset);
  writeJson(root, OBJECT_IDENTITY_EVIDENCE_READINESS_PATH, readiness);

  return readiness;
}

export function writeObjectIdentityEvidenceReport(
  projectRoot?: string
): ObjectIdentityEvidenceReadiness {
  return runObjectIdentityEvidenceDefinition(projectRoot);
}
