import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL_PATH,
  GPU_VALIDATION_ENTRY_CRITERIA_PATH,
} from './videoRuntimeEnforcement.js';
import { ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH } from './environmentIdentityBinding.js';
import { OBJECT_IDENTITY_BINDING_PACKAGE_PATH } from './objectIdentityBinding.js';
import { TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH } from './temporalPreservationBinding.js';

export const GPU_VALIDATION_DATASET_PHASE = 'PHASE-GPU-CONDITIONING-VALIDATION-003' as const;
export const GPU_VALIDATION_DATASET_SYSTEM_ID = 'GPU_VALIDATION_DATASET_V1' as const;
export const GPU_VALIDATION_DATASET_PASS_VERDICT = 'PASS_GPU_VALIDATION_DATASET_V1' as const;
export const GPU_VALIDATION_DATASET_FAIL_VERDICT = 'FAIL_GPU_VALIDATION_DATASET_V1' as const;
export const GPU_VALIDATION_DATASET_STATUS = 'GPU_VALIDATION_DATASETS_DEFINED' as const;

export const GPU_VALIDATION_DATASET_DIR = 'datasets/gpu_validation' as const;
export const GPU_VALIDATION_DATASET_MANIFEST_PATH =
  `${GPU_VALIDATION_DATASET_DIR}/gpu-validation-dataset-manifest.json` as const;

export const GPU_VALIDATION_DATASET_REPORT_PATH =
  'reports/movie_reconstruction/GPU_VALIDATION_DATASET_REPORT.json' as const;
export const GPU_VALIDATION_COVERAGE_REPORT_PATH =
  'reports/movie_reconstruction/GPU_VALIDATION_COVERAGE_REPORT.json' as const;
export const GPU_VALIDATION_EXECUTION_PLAN_PATH =
  'reports/movie_reconstruction/GPU_VALIDATION_EXECUTION_PLAN.json' as const;

const VALIDATION_CHANNELS = [
  'environment_identity',
  'object_identity',
  'temporal_preservation',
  'camera_continuity',
  'multi_scene_consistency',
] as const;

type ValidationChannel = (typeof VALIDATION_CHANNELS)[number];

const DIFFICULTY_TIERS = ['easy', 'medium', 'hard'] as const;

const CHANNEL_PRIORITY = [
  'environment_identity',
  'temporal_preservation',
  'object_identity',
  'camera_continuity',
  'multi_scene_consistency',
] as const;

const EXECUTION_FLAGS = {
  dataset_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface GpuValidationDatasetChannelEntry {
  validation_channel: ValidationChannel;
  dataset_path: string;
  dataset_size: number;
  target_batch_size: number;
  measurement_methods: string[];
  pass_thresholds: Record<string, number>;
  difficulty_tiers: string[];
  failure_examples: string[];
  primary_movie_reconstruction_target: boolean;
}

export interface GpuValidationDatasetReport {
  report_id: string;
  phase: typeof GPU_VALIDATION_DATASET_PHASE;
  system_id: typeof GPU_VALIDATION_DATASET_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof GPU_VALIDATION_DATASET_STATUS | 'GPU_VALIDATION_DATASETS_NOT_DEFINED';
  validation_passed: boolean;
  validation_datasets_defined: boolean;
  measurement_methods_linked: boolean;
  pass_thresholds_defined: boolean;
  difficulty_tiers_defined: boolean;
  failure_examples_defined: boolean;
  execution_plan_defined: boolean;
  channel_priority_defined: boolean;
  gpu_validation_executed: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  channels: GpuValidationDatasetChannelEntry[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface GpuValidationCoverageReport {
  report_id: string;
  phase: typeof GPU_VALIDATION_DATASET_PHASE;
  system_id: typeof GPU_VALIDATION_DATASET_SYSTEM_ID;
  generated_at: string;
  covered_channels: string[];
  missing_channels: string[];
  coverage_ratio: number;
  highest_risk_channel: string;
}

export interface GpuValidationExecutionPlan {
  report_id: string;
  phase: typeof GPU_VALIDATION_DATASET_PHASE;
  system_id: typeof GPU_VALIDATION_DATASET_SYSTEM_ID;
  generated_at: string;
  execution_plan_defined: true;
  execution_order: string[];
  channel_priority: string[];
  batch_schedule: Array<{
    validation_channel: string;
    batch_index: number;
    sample_count: number;
    difficulty_tier: string;
  }>;
  expected_outputs: string[];
  failure_escalation_rules: string[];
}

interface ChannelDatasetDefinition {
  validation_channel: ValidationChannel;
  dataset_size: number;
  target_batch_size: number;
  measurement_methods: string[];
  pass_thresholds: Record<string, number>;
  failure_examples: string[];
  binding_ref: string;
  sample_seeds: Array<{
    sample_id: string;
    difficulty_tier: (typeof DIFFICULTY_TIERS)[number];
    source_ref: string;
  }>;
}

const CHANNEL_DEFINITIONS: ChannelDatasetDefinition[] = [
  {
    validation_channel: 'environment_identity',
    dataset_size: 60,
    target_batch_size: 50,
    measurement_methods: ['reference_bank_match_score', 'environment_traceability_score'],
    pass_thresholds: {
      reference_bank_match_score: 0.98,
      environment_traceability_score: 0.95,
      hard_tier_pass_threshold: 0.92,
    },
    failure_examples: ['different_staircase', 'missing_railing', 'hallucinated_architecture'],
    binding_ref: ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
    sample_seeds: [
      { sample_id: 'env_easy_001', difficulty_tier: 'easy', source_ref: 'titanic_staircase_001' },
      { sample_id: 'env_med_001', difficulty_tier: 'medium', source_ref: 'ghibli_kitchen_001' },
      { sample_id: 'env_hard_001', difficulty_tier: 'hard', source_ref: 'mori_forest_clearing_001' },
    ],
  },
  {
    validation_channel: 'object_identity',
    dataset_size: 48,
    target_batch_size: 40,
    measurement_methods: ['identity_signature_match_score', 'variation_tolerance_band_score'],
    pass_thresholds: {
      identity_signature_match_score: 0.97,
      variation_tolerance_band_score: 0.9,
      hard_tier_pass_threshold: 0.85,
    },
    failure_examples: ['wrong_prop_variant', 'identity_embedding_drift', 'role_weight_ignored'],
    binding_ref: OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
    sample_seeds: [
      { sample_id: 'obj_easy_001', difficulty_tier: 'easy', source_ref: 'suitcase_001' },
      { sample_id: 'obj_med_001', difficulty_tier: 'medium', source_ref: 'lantern_001' },
      { sample_id: 'obj_hard_001', difficulty_tier: 'hard', source_ref: 'chair_014' },
    ],
  },
  {
    validation_channel: 'temporal_preservation',
    dataset_size: 36,
    target_batch_size: 30,
    measurement_methods: ['edit_rhythm_alignment_score', 'continuity_signature_score'],
    pass_thresholds: {
      edit_rhythm_alignment_score: 0.9,
      continuity_signature_score: 0.88,
      hard_tier_pass_threshold: 0.82,
    },
    failure_examples: ['edit_rhythm_desync', 'shot_boundary_jump', 'causal_transition_break'],
    binding_ref: TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
    sample_seeds: [
      { sample_id: 'tmp_easy_001', difficulty_tier: 'easy', source_ref: 'timeline_ghibli_001_001' },
      { sample_id: 'tmp_med_001', difficulty_tier: 'medium', source_ref: 'timeline_titanic_014_003' },
      { sample_id: 'tmp_hard_001', difficulty_tier: 'hard', source_ref: 'transition_014_015' },
    ],
  },
  {
    validation_channel: 'camera_continuity',
    dataset_size: 30,
    target_batch_size: 25,
    measurement_methods: ['motion_vector_delta_score', 'eyeline_vector_stability_score'],
    pass_thresholds: {
      motion_vector_delta_score: 0.85,
      eyeline_vector_stability_score: 0.82,
      hard_tier_pass_threshold: 0.75,
    },
    failure_examples: ['camera_inertia_break', 'eyeline_vector_jump', 'motion_smoothing_failure'],
    binding_ref: TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
    sample_seeds: [
      { sample_id: 'cam_easy_001', difficulty_tier: 'easy', source_ref: 'timeline_mori_001_001' },
      { sample_id: 'cam_med_001', difficulty_tier: 'medium', source_ref: 'camera_inertia_anchor' },
      { sample_id: 'cam_hard_001', difficulty_tier: 'hard', source_ref: 'cross_shot_motion_jump' },
    ],
  },
  {
    validation_channel: 'multi_scene_consistency',
    dataset_size: 42,
    target_batch_size: 35,
    measurement_methods: ['anchor_persistence_score', 'scene_remap_lineage_score'],
    pass_thresholds: {
      anchor_persistence_score: 0.85,
      scene_remap_lineage_score: 0.9,
      hard_tier_pass_threshold: 0.8,
    },
    failure_examples: ['anchor_position_drift', 'scene_remap_lineage_break', 'cross_scene_memory_loss'],
    binding_ref: ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
    sample_seeds: [
      { sample_id: 'msc_easy_001', difficulty_tier: 'easy', source_ref: 'gonegi_harbor_dock_001' },
      { sample_id: 'msc_med_001', difficulty_tier: 'medium', source_ref: 'scene_transition_chain' },
      { sample_id: 'msc_hard_001', difficulty_tier: 'hard', source_ref: 'multi_scene_anchor_drift' },
    ],
  },
];

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function datasetPathForChannel(channel: ValidationChannel): string {
  return `${GPU_VALIDATION_DATASET_DIR}/${channel}-validation-dataset.json`;
}

function writeChannelDatasets(root: string): void {
  for (const def of CHANNEL_DEFINITIONS) {
    const rel = datasetPathForChannel(def.validation_channel);
    writeJson(root, rel, {
      dataset_id: `${def.validation_channel}-validation-dataset-v1`,
      validation_channel: def.validation_channel,
      phase: GPU_VALIDATION_DATASET_PHASE,
      dataset_size: def.dataset_size,
      target_batch_size: def.target_batch_size,
      difficulty_tiers: [...DIFFICULTY_TIERS],
      binding_ref: def.binding_ref,
      measurement_methods: def.measurement_methods,
      pass_thresholds: def.pass_thresholds,
      failure_examples: def.failure_examples,
      sample_seeds: def.sample_seeds,
      gpu_execution: false,
      dataset_only: true,
    });
  }
}

function buildDatasetReportEntries(): GpuValidationDatasetChannelEntry[] {
  return CHANNEL_DEFINITIONS.map((def) => ({
    validation_channel: def.validation_channel,
    dataset_path: datasetPathForChannel(def.validation_channel),
    dataset_size: def.dataset_size,
    target_batch_size: def.target_batch_size,
    measurement_methods: [...def.measurement_methods],
    pass_thresholds: { ...def.pass_thresholds },
    difficulty_tiers: [...DIFFICULTY_TIERS],
    failure_examples: [...def.failure_examples],
    primary_movie_reconstruction_target: def.validation_channel === 'environment_identity',
  }));
}

function buildExecutionPlan(): GpuValidationExecutionPlan {
  const batch_schedule = CHANNEL_DEFINITIONS.flatMap((def, channelIndex) =>
    DIFFICULTY_TIERS.map((tier, tierIndex) => ({
      validation_channel: def.validation_channel,
      batch_index: channelIndex * DIFFICULTY_TIERS.length + tierIndex + 1,
      sample_count: Math.ceil(def.target_batch_size / DIFFICULTY_TIERS.length),
      difficulty_tier: tier,
    }))
  );

  return {
    report_id: `gpu_validation_execution_plan_${Date.now().toString(36)}`,
    phase: GPU_VALIDATION_DATASET_PHASE,
    system_id: GPU_VALIDATION_DATASET_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    execution_plan_defined: true,
    execution_order: [...CHANNEL_PRIORITY],
    channel_priority: [...CHANNEL_PRIORITY],
    batch_schedule,
    expected_outputs: [
      'per_channel_measurement_scores.json',
      'per_tier_pass_fail_matrix.json',
      'failure_escalation_audit_log.json',
      'hard_tier_movie_reconstruction_readiness_score.json',
    ],
    failure_escalation_rules: [
      'STRICT channel hard-tier failure escalates to expected_degradation_path audit',
      'Two consecutive medium-tier failures escalate channel to hard-tier revalidation',
      'environment_identity failure always escalates before other channels proceed',
      'Hard Tier Pass is the primary Movie Reconstruction target',
      'Validation Dataset Defined != Validation Executed',
    ],
  };
}

export function runGpuValidationDatasetValidation(
  projectRoot?: string
): GpuValidationDatasetReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GpuValidationDatasetReport['issues'] = [];

  const prerequisitePaths = [
    GPU_VALIDATION_DATASET_MANIFEST_PATH,
    VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL_PATH,
    GPU_VALIDATION_ENTRY_CRITERIA_PATH,
    ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
    OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
    TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
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

  writeChannelDatasets(root);

  const channels = buildDatasetReportEntries();

  const validation_datasets_defined =
    channels.length === VALIDATION_CHANNELS.length &&
    channels.every((entry) => fs.existsSync(path.join(root, entry.dataset_path)));

  const measurement_methods_linked = channels.every(
    (entry) => entry.measurement_methods.length > 0
  );
  const pass_thresholds_defined = channels.every(
    (entry) => Object.keys(entry.pass_thresholds).length > 0
  );
  const difficulty_tiers_defined = channels.every(
    (entry) =>
      entry.difficulty_tiers.length === 3 &&
      entry.difficulty_tiers.includes('easy') &&
      entry.difficulty_tiers.includes('medium') &&
      entry.difficulty_tiers.includes('hard')
  );
  const failure_examples_defined = channels.every(
    (entry) => entry.failure_examples.length > 0
  );

  const executionPlan = buildExecutionPlan();
  const execution_plan_defined = executionPlan.execution_plan_defined === true;
  const channel_priority_defined =
    executionPlan.channel_priority.length === VALIDATION_CHANNELS.length &&
    executionPlan.channel_priority[0] === 'environment_identity';

  const environmentEntry = channels.find(
    (entry) => entry.validation_channel === 'environment_identity'
  );

  if (!environmentEntry) {
    issues.push({
      code: 'ENVIRONMENT_DATASET',
      message: 'environment_identity validation dataset required',
      severity: 'error',
    });
  } else if (
    !environmentEntry.failure_examples.includes('different_staircase') ||
    !environmentEntry.failure_examples.includes('missing_railing') ||
    !environmentEntry.failure_examples.includes('hallucinated_architecture')
  ) {
    issues.push({
      code: 'ENVIRONMENT_FAILURE_EXAMPLES',
      message: 'environment_identity failure_examples must match required example',
      severity: 'error',
    });
  }

  if (!validation_datasets_defined) {
    issues.push({ code: 'DATASETS', message: 'validation datasets must be defined', severity: 'error' });
  }
  if (!measurement_methods_linked) {
    issues.push({ code: 'MEASUREMENT_METHODS', message: 'measurement_methods must be linked', severity: 'error' });
  }
  if (!pass_thresholds_defined) {
    issues.push({ code: 'PASS_THRESHOLDS', message: 'pass_thresholds must be defined', severity: 'error' });
  }
  if (!difficulty_tiers_defined) {
    issues.push({ code: 'DIFFICULTY_TIERS', message: 'difficulty_tiers must be defined', severity: 'error' });
  }
  if (!failure_examples_defined) {
    issues.push({ code: 'FAILURE_EXAMPLES', message: 'failure_examples must be defined', severity: 'error' });
  }
  if (!execution_plan_defined) {
    issues.push({ code: 'EXECUTION_PLAN', message: 'execution_plan must be defined', severity: 'error' });
  }
  if (!channel_priority_defined) {
    issues.push({ code: 'CHANNEL_PRIORITY', message: 'channel_priority must be defined', severity: 'error' });
  }

  const validation_passed =
    validation_datasets_defined &&
    measurement_methods_linked &&
    pass_thresholds_defined &&
    difficulty_tiers_defined &&
    failure_examples_defined &&
    execution_plan_defined &&
    channel_priority_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const covered_channels = channels.map((entry) => entry.validation_channel);
  const missing_channels: string[] = [];
  const coverage_ratio =
    VALIDATION_CHANNELS.length === 0
      ? 0
      : Number((covered_channels.length / VALIDATION_CHANNELS.length).toFixed(2));

  const report: GpuValidationDatasetReport = {
    report_id: `gpu_validation_dataset_${Date.now().toString(36)}`,
    phase: GPU_VALIDATION_DATASET_PHASE,
    system_id: GPU_VALIDATION_DATASET_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? GPU_VALIDATION_DATASET_PASS_VERDICT
      : GPU_VALIDATION_DATASET_FAIL_VERDICT,
    status: validation_passed
      ? GPU_VALIDATION_DATASET_STATUS
      : 'GPU_VALIDATION_DATASETS_NOT_DEFINED',
    validation_passed,
    validation_datasets_defined,
    measurement_methods_linked,
    pass_thresholds_defined,
    difficulty_tiers_defined,
    failure_examples_defined,
    execution_plan_defined,
    channel_priority_defined,
    gpu_validation_executed: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    channels,
    checks: {
      validation_datasets_defined,
      measurement_methods_linked,
      pass_thresholds_defined,
      difficulty_tiers_defined,
      failure_examples_defined,
      execution_plan_defined,
      channel_priority_defined,
      environment_dataset_example_present: Boolean(environmentEntry),
      gpu_validation_executed_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  const coverageReport: GpuValidationCoverageReport = {
    report_id: `gpu_validation_coverage_${Date.now().toString(36)}`,
    phase: GPU_VALIDATION_DATASET_PHASE,
    system_id: GPU_VALIDATION_DATASET_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    covered_channels,
    missing_channels,
    coverage_ratio,
    highest_risk_channel: 'environment_identity',
  };

  writeJson(root, GPU_VALIDATION_DATASET_REPORT_PATH, report);
  writeJson(root, GPU_VALIDATION_COVERAGE_REPORT_PATH, coverageReport);
  writeJson(root, GPU_VALIDATION_EXECUTION_PLAN_PATH, executionPlan);

  return report;
}

export function writeGpuValidationDatasetReport(
  projectRoot?: string
): GpuValidationDatasetReport {
  return runGpuValidationDatasetValidation(projectRoot);
}
