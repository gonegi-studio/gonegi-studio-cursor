import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH } from './movieAnalysisProductionRuntimeCertification.js';
import {
  MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
  MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT,
  MV_GENERATION_PLANNING_ENGINE_REPORT_PATH,
  MV_GENERATION_PLANNING_READY_STATUS,
  type MvGenerationPlan,
  type MvGenerationPlanningEngineArtifact,
  type MvGenerationUnit,
} from './mvGenerationPlanningEngine.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  type MvType,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_PRODUCTION_RUNTIME_ENGINE_PHASE =
  'PHASE-DIGITAL-STUDIO-006-MV_PRODUCTION_RUNTIME_ENGINE_V1' as const;
export const MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT =
  'PASS_MV_PRODUCTION_RUNTIME_ENGINE_V1' as const;
export const MV_PRODUCTION_RUNTIME_ENGINE_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_RUNTIME_ENGINE_V1' as const;
export const MV_PRODUCTION_RUNTIME_READY_STATUS = 'MV_PRODUCTION_RUNTIME_READY' as const;
export const MV_PRODUCTION_RUNTIME_ENGINE_DIR = 'reports/mv_production_runtime_engine' as const;
export const MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH =
  'reports/mv_production_runtime_engine/mv-production-runtime-engine-report.json' as const;
export const MV_PRODUCTION_RUNTIME_ENGINE_MD_PATH =
  'reports/mv_production_runtime_engine/MV_PRODUCTION_RUNTIME_ENGINE.md' as const;
export const MV_PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR =
  'exports/mv_production_runtime_engine' as const;
export const MV_PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH =
  'exports/mv_production_runtime_engine/mv-production-runtime-engine-manifest.json' as const;
export const MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH =
  'exports/mv_production_runtime_engine/mv-production-runtime-engine.json' as const;

export const RUNTIME_ARTIFACT_WRITE_SCOPE = 'exports/mv_production_runtime_engine/' as const;

export const RUNTIME_MODE_TEST_MODE_ONLY = 'test_mode_only' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type RuntimeStatus = 'PASS' | 'FAIL';

export type MvProductionRuntimeEngineIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  mv_type?: MvType;
  check_id?: string;
};

export type RuntimeCheck = {
  check_id: string;
  check_label: string;
  status: RuntimeStatus;
};

export type MvRuntimeUnit = {
  unit_id: string;
  shot_id: string;
  scene_ref: string;
  queue_position: number;
  generation_prompt_seed: string;
  visual_intent: string;
  emotion_beat_ref: string;
  lyric_or_music_section_ref: string;
  image_runtime_ref: string;
  video_runtime_ref: string;
  consistency_runtime_ref: string;
  music_sync_runtime_ref: string;
  adapter_bindings: string[];
  unit_ready: RuntimeStatus;
};

export type ExecutionQueueEntry = {
  queue_index: number;
  unit_id: string;
  shot_id: string;
  stage: 'image' | 'video' | 'consistency' | 'quality_gate';
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  execution_allowed: false;
};

export type ImageRuntimePlan = {
  plan_id: string;
  target_count: number;
  runtime_refs: string[];
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  external_call_allowed: false;
  gpu_execution_allowed: false;
  plan_valid: boolean;
};

export type VideoRuntimePlan = {
  plan_id: string;
  target_count: number;
  runtime_refs: string[];
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  external_call_allowed: false;
  gpu_execution_allowed: false;
  plan_valid: boolean;
};

export type ConsistencyRuntimeEntry = {
  unit_id: string;
  shot_id: string;
  consistency_runtime_ref: string;
  continuity_preserved: RuntimeStatus;
};

export type ConsistencyRuntimePlan = {
  plan_id: string;
  entry_count: number;
  entries: ConsistencyRuntimeEntry[];
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  plan_valid: boolean;
};

export type QualityGateRuntimeEntry = {
  unit_id: string;
  shot_id: string;
  gate_id: string;
  gate_label: string;
  gate_passed: RuntimeStatus;
};

export type QualityGateRuntimePlan = {
  plan_id: string;
  entry_count: number;
  entries: QualityGateRuntimeEntry[];
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  plan_valid: boolean;
};

export type AdapterExecutionStep = {
  adapter_id: string;
  unit_id: string;
  shot_id: string;
  execution_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  external_call_allowed: false;
  gpu_execution_allowed: false;
  step_ready: RuntimeStatus;
};

export type AdapterExecutionPlan = {
  plan_id: string;
  step_count: number;
  steps: AdapterExecutionStep[];
  plan_valid: boolean;
};

export type MvRuntimeMusicSyncPlan = {
  sync_id: string;
  beat_markers: Array<{
    shot_ref: string;
    scene_ref: string;
    timestamp_seconds: number;
    sync_preserved: RuntimeStatus;
  }>;
  sync_valid: boolean;
};

export type FailureRecoveryStep = {
  step_id: string;
  failure_class: string;
  recovery_action: string;
  max_retries: number;
  recovery_ready: RuntimeStatus;
};

export type FailureRecoveryPlan = {
  plan_id: string;
  step_count: number;
  steps: FailureRecoveryStep[];
  recovery_ready: boolean;
};

export type MvRuntimeTraceability = {
  source_generation_plan_ref: typeof MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH;
  generation_plan_id: string;
  mv_shot_assembly_id: string;
  mv_scene_assembly_id: string;
  mv_blueprint_id: string;
  mv_foundation_id: string;
  upstream_runtime_id: string;
  dataset_refs: string[];
  trace_integrity: RuntimeStatus;
};

export type MvRuntimePlan = {
  mv_runtime_id: string;
  source_generation_plan_ref: typeof MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH;
  mv_type: MvType;
  mv_type_preserved: boolean;
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  external_call_allowed: false;
  gpu_execution_allowed: false;
  runtime_units: MvRuntimeUnit[];
  execution_queue: ExecutionQueueEntry[];
  image_runtime_plan: ImageRuntimePlan;
  video_runtime_plan: VideoRuntimePlan;
  consistency_runtime_plan: ConsistencyRuntimePlan;
  quality_gate_runtime_plan: QualityGateRuntimePlan;
  adapter_execution_plan: AdapterExecutionPlan;
  music_sync_runtime_plan: MvRuntimeMusicSyncPlan;
  failure_recovery_plan: FailureRecoveryPlan;
  lyric_or_music_section_ref: string[];
  visual_intent: string[];
  emotion_beat_ref: string[];
  generation_prompt_seed: string[];
  traceability_chain: MvRuntimeTraceability;
  runtime_ready: RuntimeStatus;
};

export type MvProductionRuntimeEngineArtifact = {
  engine_id: string;
  phase: typeof MV_PRODUCTION_RUNTIME_ENGINE_PHASE;
  generated_at: string;
  source_generation_plan_ref: typeof MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH;
  generation_planning_engine_id: string;
  mv_runtime_plans: MvRuntimePlan[];
  safety_flags: {
    runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
    generation: false;
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_execution: false;
    external_call_allowed: false;
    no_execution: true;
    no_rendering: true;
    production_mode_blocked: true;
  };
  generation_plan_consumed: boolean;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    runtime_artifact_write_scope: typeof RUNTIME_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  runtime_planning_complete: boolean;
};

export type MvProductionRuntimeEngineManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_RUNTIME_ENGINE_PHASE;
  generated_at: string;
  runtime_plan_count: typeof MV_TYPE_COUNT;
  generation_plan_consumed: RuntimeStatus;
  runtime_ready: RuntimeStatus;
  execution_queue_valid: RuntimeStatus;
  image_runtime_plan_valid: RuntimeStatus;
  video_runtime_plan_valid: RuntimeStatus;
  consistency_runtime_plan_valid: RuntimeStatus;
  quality_gate_runtime_plan_valid: RuntimeStatus;
  adapter_execution_plan_valid: RuntimeStatus;
  failure_recovery_ready: RuntimeStatus;
  runtime_mode_valid: RuntimeStatus;
  external_call_blocked: RuntimeStatus;
  gpu_execution_blocked: RuntimeStatus;
  music_sync_preserved: RuntimeStatus;
  mv_type_preserved: RuntimeStatus;
  generation_prompt_seed_ready: RuntimeStatus;
  traceability_preserved: boolean;
  production_mode_blocked: RuntimeStatus;
  certification_status: typeof MV_PRODUCTION_RUNTIME_READY_STATUS | null;
};

export type MvProductionRuntimeEngineReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_RUNTIME_ENGINE_PHASE;
  timestamp: string;
  runtime_mode: typeof RUNTIME_MODE_TEST_MODE_ONLY;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  source_generation_plan_ref: typeof MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH;
  mv_generation_planning_engine_report_path: typeof MV_GENERATION_PLANNING_ENGINE_REPORT_PATH;
  mv_production_runtime_engine_export_dir: typeof MV_PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR;
  mv_production_runtime_engine_manifest_path: typeof MV_PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH;
  mv_production_runtime_engine_artifact_path: typeof MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  runtime_plan_count: typeof MV_TYPE_COUNT;
  generation_plan_consumed: RuntimeStatus;
  runtime_ready: RuntimeStatus;
  execution_queue_valid: RuntimeStatus;
  image_runtime_plan_valid: RuntimeStatus;
  video_runtime_plan_valid: RuntimeStatus;
  consistency_runtime_plan_valid: RuntimeStatus;
  quality_gate_runtime_plan_valid: RuntimeStatus;
  adapter_execution_plan_valid: RuntimeStatus;
  failure_recovery_ready: RuntimeStatus;
  runtime_mode_valid: RuntimeStatus;
  external_call_blocked: RuntimeStatus;
  gpu_execution_blocked: RuntimeStatus;
  music_sync_preserved: RuntimeStatus;
  mv_type_preserved: RuntimeStatus;
  generation_prompt_seed_ready: RuntimeStatus;
  traceability_preserved: boolean;
  production_mode_blocked: RuntimeStatus;
  generation_plan_missing: boolean;
  runtime_invalid: boolean;
  execution_queue_invalid: boolean;
  image_runtime_plan_missing: boolean;
  video_runtime_plan_missing: boolean;
  consistency_runtime_plan_missing: boolean;
  quality_gate_runtime_plan_missing: boolean;
  adapter_execution_plan_missing: boolean;
  failure_recovery_missing: boolean;
  runtime_mode_invalid: boolean;
  external_call_enabled: boolean;
  gpu_execution_enabled: boolean;
  music_sync_loss: boolean;
  mv_type_loss: boolean;
  generation_prompt_seed_missing: boolean;
  traceability_loss: boolean;
  production_mode_unblocked: boolean;
  mv_production_runtime_engine_ready: RuntimeStatus;
  certification_status: typeof MV_PRODUCTION_RUNTIME_READY_STATUS | null;
  mv_runtime_plans: MvRuntimePlan[];
  runtime_checks: RuntimeCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT
    | typeof MV_PRODUCTION_RUNTIME_ENGINE_FAIL_VERDICT;
  issues: MvProductionRuntimeEngineIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const READ_ONLY_UPSTREAM_PATHS = [MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH] as const;

const RUNTIME_EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
  MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_RUNTIME_ENGINE_DIR,
  MV_PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR,
  MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH,
  MV_PRODUCTION_RUNTIME_ENGINE_MD_PATH,
  ...RUNTIME_EXPORT_WRITE_PATHS,
] as const;

const FAILURE_RECOVERY_TEMPLATES: FailureRecoveryStep[] = [
  {
    step_id: 'RECOVERY-IMAGE-STALL',
    failure_class: 'image_runtime_stall',
    recovery_action: 'requeue_image_unit_test_mode',
    max_retries: 0,
    recovery_ready: 'PASS',
  },
  {
    step_id: 'RECOVERY-VIDEO-STALL',
    failure_class: 'video_runtime_stall',
    recovery_action: 'requeue_video_unit_test_mode',
    max_retries: 0,
    recovery_ready: 'PASS',
  },
  {
    step_id: 'RECOVERY-CONSISTENCY-BREAK',
    failure_class: 'consistency_break',
    recovery_action: 'hold_unit_and_flag_test_mode',
    max_retries: 0,
    recovery_ready: 'PASS',
  },
  {
    step_id: 'RECOVERY-QUALITY-GATE-FAIL',
    failure_class: 'quality_gate_fail',
    recovery_action: 'skip_execution_test_mode',
    max_retries: 0,
    recovery_ready: 'PASS',
  },
];

function toStatus(pass: boolean): RuntimeStatus {
  return pass ? 'PASS' : 'FAIL';
}

function loadJson<T>(root: string, relativePath: string): T | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

function snapshotFile(root: string, relativePath: string): FileSnapshot | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  const stat = fs.statSync(fullPath);
  return { size: stat.size, mtimeMs: stat.mtimeMs };
}

function snapshotsUnchanged(
  root: string,
  snapshots: Record<string, FileSnapshot | null>
): boolean {
  for (const [relativePath, snapshot] of Object.entries(snapshots)) {
    if (!snapshot) return false;
    const current = snapshotFile(root, relativePath);
    if (!current || current.size !== snapshot.size || current.mtimeMs !== snapshot.mtimeMs) {
      return false;
    }
  }
  return true;
}

function isUnderRuntimeWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(RUNTIME_ARTIFACT_WRITE_SCOPE) ||
    relativePath === RUNTIME_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function imageRuntimeRefForUnit(mvType: MvType, unit: MvGenerationUnit): string {
  return `runtime_image_${mvType}_${unit.shot_id}`;
}

function videoRuntimeRefForUnit(mvType: MvType, unit: MvGenerationUnit): string {
  return `runtime_video_${mvType}_${unit.shot_id}`;
}

function consistencyRuntimeRefForUnit(unit: MvGenerationUnit): string {
  return `runtime_consistency_${unit.consistency_target}`;
}

function musicSyncRuntimeRefForUnit(unit: MvGenerationUnit): string {
  return `runtime_sync_${unit.music_sync_ref}`;
}

function buildRuntimeUnit(
  generationPlan: MvGenerationPlan,
  unit: MvGenerationUnit,
  index: number
): MvRuntimeUnit {
  const imageRuntimeRef = imageRuntimeRefForUnit(generationPlan.mv_type, unit);
  const videoRuntimeRef = videoRuntimeRefForUnit(generationPlan.mv_type, unit);
  const consistencyRuntimeRef = consistencyRuntimeRefForUnit(unit);
  const musicSyncRuntimeRef = musicSyncRuntimeRefForUnit(unit);

  const unitReady =
    unit.unit_ready === 'PASS' &&
    unit.generation_prompt_seed.length > 0 &&
    unit.visual_intent.length > 0 &&
    unit.emotion_beat_ref.length > 0 &&
    unit.lyric_or_music_section_ref.length > 0 &&
    unit.adapter_requirements.length > 0 &&
    imageRuntimeRef.length > 0 &&
    videoRuntimeRef.length > 0 &&
    consistencyRuntimeRef.length > 0 &&
    musicSyncRuntimeRef.length > 0;

  return {
    unit_id: unit.unit_id,
    shot_id: unit.shot_id,
    scene_ref: unit.scene_ref,
    queue_position: index + 1,
    generation_prompt_seed: unit.generation_prompt_seed,
    visual_intent: unit.visual_intent,
    emotion_beat_ref: unit.emotion_beat_ref,
    lyric_or_music_section_ref: unit.lyric_or_music_section_ref,
    image_runtime_ref: imageRuntimeRef,
    video_runtime_ref: videoRuntimeRef,
    consistency_runtime_ref: consistencyRuntimeRef,
    music_sync_runtime_ref: musicSyncRuntimeRef,
    adapter_bindings: unit.adapter_requirements,
    unit_ready: toStatus(unitReady),
  };
}

function buildExecutionQueue(runtimeUnits: MvRuntimeUnit[]): ExecutionQueueEntry[] {
  const stages: ExecutionQueueEntry['stage'][] = [
    'image',
    'video',
    'consistency',
    'quality_gate',
  ];
  const queue: ExecutionQueueEntry[] = [];
  let queueIndex = 0;

  for (const unit of runtimeUnits) {
    for (const stage of stages) {
      queue.push({
        queue_index: queueIndex,
        unit_id: unit.unit_id,
        shot_id: unit.shot_id,
        stage,
        runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
        execution_allowed: false,
      });
      queueIndex += 1;
    }
  }

  return queue;
}

function buildQualityGateRuntimeEntries(unit: MvRuntimeUnit): QualityGateRuntimeEntry[] {
  return [
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-RUNTIME-MODE',
      gate_label: 'Runtime Mode Test Only',
      gate_passed: 'PASS',
    },
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-EXTERNAL-CALL-BLOCKED',
      gate_label: 'External Call Blocked',
      gate_passed: 'PASS',
    },
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-GPU-BLOCKED',
      gate_label: 'GPU Execution Blocked',
      gate_passed: 'PASS',
    },
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-PROMPT-SEED',
      gate_label: 'Prompt Seed Present',
      gate_passed: toStatus(unit.generation_prompt_seed.length > 0),
    },
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-NO-EXECUTION',
      gate_label: 'No Real Execution',
      gate_passed: 'PASS',
    },
  ];
}

function buildAdapterExecutionSteps(
  runtimeUnits: MvRuntimeUnit[]
): AdapterExecutionStep[] {
  const steps: AdapterExecutionStep[] = [];

  for (const unit of runtimeUnits) {
    for (const adapterId of unit.adapter_bindings) {
      steps.push({
        adapter_id: adapterId,
        unit_id: unit.unit_id,
        shot_id: unit.shot_id,
        execution_mode: RUNTIME_MODE_TEST_MODE_ONLY,
        external_call_allowed: false,
        gpu_execution_allowed: false,
        step_ready: toStatus(unit.unit_ready === 'PASS'),
      });
    }
  }

  return steps;
}

function buildRuntimePlan(generationPlan: MvGenerationPlan): MvRuntimePlan {
  const runtimeUnits = generationPlan.generation_units.map((unit, index) =>
    buildRuntimeUnit(generationPlan, unit, index)
  );

  const executionQueue = buildExecutionQueue(runtimeUnits);

  const imageRuntimeRefs = runtimeUnits.map((unit) => unit.image_runtime_ref);
  const videoRuntimeRefs = runtimeUnits.map((unit) => unit.video_runtime_ref);

  const consistencyEntries: ConsistencyRuntimeEntry[] = runtimeUnits.map((unit) => ({
    unit_id: unit.unit_id,
    shot_id: unit.shot_id,
    consistency_runtime_ref: unit.consistency_runtime_ref,
    continuity_preserved: toStatus(unit.consistency_runtime_ref.length > 0),
  }));

  const qualityEntries = runtimeUnits.flatMap((unit) => buildQualityGateRuntimeEntries(unit));
  const adapterSteps = buildAdapterExecutionSteps(runtimeUnits);

  const imagePlanValid = imageRuntimeRefs.length > 0;
  const videoPlanValid = videoRuntimeRefs.length > 0;
  const consistencyPlanValid = consistencyEntries.every(
    (entry) => entry.continuity_preserved === 'PASS'
  );
  const qualityGatePlanValid = qualityEntries.every((entry) => entry.gate_passed === 'PASS');
  const adapterPlanValid =
    adapterSteps.length > 0 && adapterSteps.every((step) => step.step_ready === 'PASS');
  const executionQueueValid =
    executionQueue.length === runtimeUnits.length * 4 &&
    executionQueue.every(
      (entry) =>
        entry.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY && entry.execution_allowed === false
    );

  const musicSyncRuntimePlan: MvRuntimeMusicSyncPlan = {
    sync_id: `${generationPlan.mv_type}_runtime_music_sync_v1`,
    beat_markers: generationPlan.music_sync_plan.beat_markers.map((marker) => ({
      shot_ref: marker.shot_ref,
      scene_ref: marker.scene_ref,
      timestamp_seconds: marker.timestamp_seconds,
      sync_preserved: marker.sync_preserved,
    })),
    sync_valid: generationPlan.music_sync_plan.sync_valid,
  };

  const failureRecoveryPlan: FailureRecoveryPlan = {
    plan_id: `${generationPlan.mv_type}_failure_recovery_plan_v1`,
    step_count: FAILURE_RECOVERY_TEMPLATES.length,
    steps: FAILURE_RECOVERY_TEMPLATES.map((step) => ({ ...step })),
    recovery_ready: FAILURE_RECOVERY_TEMPLATES.every((step) => step.recovery_ready === 'PASS'),
  };

  const lyricOrMusicSectionRefs = runtimeUnits.map((unit) => unit.lyric_or_music_section_ref);
  const visualIntents = runtimeUnits.map((unit) => unit.visual_intent);
  const emotionBeatRefs = runtimeUnits.map((unit) => unit.emotion_beat_ref);
  const generationPromptSeeds = runtimeUnits.map((unit) => unit.generation_prompt_seed);

  const traceabilityChain: MvRuntimeTraceability = {
    source_generation_plan_ref: MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    generation_plan_id: generationPlan.generation_plan_id,
    mv_shot_assembly_id: generationPlan.traceability_chain.mv_shot_assembly_id,
    mv_scene_assembly_id: generationPlan.traceability_chain.mv_scene_assembly_id,
    mv_blueprint_id: generationPlan.traceability_chain.mv_blueprint_id,
    mv_foundation_id: generationPlan.traceability_chain.mv_foundation_id,
    upstream_runtime_id: generationPlan.traceability_chain.upstream_runtime_id,
    dataset_refs: generationPlan.traceability_chain.dataset_refs,
    trace_integrity:
      generationPlan.traceability_chain.trace_integrity === 'PASS' ? 'PASS' : 'FAIL',
  };

  const mvTypePreserved =
    generationPlan.mv_type_preserved === true &&
    runtimeUnits.every((unit) => unit.unit_ready === 'PASS');

  const runtimeReady =
    mvTypePreserved &&
    runtimeUnits.length === generationPlan.generation_units.length &&
    imagePlanValid &&
    videoPlanValid &&
    consistencyPlanValid &&
    qualityGatePlanValid &&
    adapterPlanValid &&
    executionQueueValid &&
    musicSyncRuntimePlan.sync_valid &&
    failureRecoveryPlan.recovery_ready &&
    generationPromptSeeds.every((seed) => seed.length > 0) &&
    traceabilityChain.trace_integrity === 'PASS';

  return {
    mv_runtime_id: `${generationPlan.mv_type}_runtime_plan_v1`,
    source_generation_plan_ref: MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    mv_type: generationPlan.mv_type,
    mv_type_preserved: mvTypePreserved,
    runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
    external_call_allowed: false,
    gpu_execution_allowed: false,
    runtime_units: runtimeUnits,
    execution_queue: executionQueue,
    image_runtime_plan: {
      plan_id: `${generationPlan.mv_type}_image_runtime_plan_v1`,
      target_count: imageRuntimeRefs.length,
      runtime_refs: imageRuntimeRefs,
      runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
      external_call_allowed: false,
      gpu_execution_allowed: false,
      plan_valid: imagePlanValid,
    },
    video_runtime_plan: {
      plan_id: `${generationPlan.mv_type}_video_runtime_plan_v1`,
      target_count: videoRuntimeRefs.length,
      runtime_refs: videoRuntimeRefs,
      runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
      external_call_allowed: false,
      gpu_execution_allowed: false,
      plan_valid: videoPlanValid,
    },
    consistency_runtime_plan: {
      plan_id: `${generationPlan.mv_type}_consistency_runtime_plan_v1`,
      entry_count: consistencyEntries.length,
      entries: consistencyEntries,
      runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
      plan_valid: consistencyPlanValid,
    },
    quality_gate_runtime_plan: {
      plan_id: `${generationPlan.mv_type}_quality_gate_runtime_plan_v1`,
      entry_count: qualityEntries.length,
      entries: qualityEntries,
      runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
      plan_valid: qualityGatePlanValid,
    },
    adapter_execution_plan: {
      plan_id: `${generationPlan.mv_type}_adapter_execution_plan_v1`,
      step_count: adapterSteps.length,
      steps: adapterSteps,
      plan_valid: adapterPlanValid,
    },
    music_sync_runtime_plan: musicSyncRuntimePlan,
    failure_recovery_plan: failureRecoveryPlan,
    lyric_or_music_section_ref: lyricOrMusicSectionRefs,
    visual_intent: visualIntents,
    emotion_beat_ref: emotionBeatRefs,
    generation_prompt_seed: generationPromptSeeds,
    traceability_chain: traceabilityChain,
    runtime_ready: toStatus(runtimeReady),
  };
}

function buildMarkdown(report: MvProductionRuntimeEngineReport): string {
  const lines = [
    '# MV Production Runtime Engine',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    `**Source Generation Plan:** ${report.source_generation_plan_ref}`,
    `**Runtime Mode:** ${report.runtime_mode}`,
    '',
    '## Flow',
    '',
    'Generation Planning → Runtime Engine → Future MV Execution',
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| generation_plan_consumed | ${report.generation_plan_consumed} |`,
    `| runtime_ready | ${report.runtime_ready} |`,
    `| execution_queue_valid | ${report.execution_queue_valid} |`,
    `| image_runtime_plan_valid | ${report.image_runtime_plan_valid} |`,
    `| video_runtime_plan_valid | ${report.video_runtime_plan_valid} |`,
    `| consistency_runtime_plan_valid | ${report.consistency_runtime_plan_valid} |`,
    `| quality_gate_runtime_plan_valid | ${report.quality_gate_runtime_plan_valid} |`,
    `| adapter_execution_plan_valid | ${report.adapter_execution_plan_valid} |`,
    `| failure_recovery_ready | ${report.failure_recovery_ready} |`,
    `| runtime_mode_valid | ${report.runtime_mode_valid} |`,
    `| external_call_blocked | ${report.external_call_blocked} |`,
    `| gpu_execution_blocked | ${report.gpu_execution_blocked} |`,
    `| music_sync_preserved | ${report.music_sync_preserved} |`,
    `| mv_type_preserved | ${report.mv_type_preserved} |`,
    `| generation_prompt_seed_ready | ${report.generation_prompt_seed_ready} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    '',
    '## Runtime Plans',
    ''
  );

  for (const plan of report.mv_runtime_plans) {
    lines.push(
      `- ${plan.mv_runtime_id} (${plan.mv_type}): units=${plan.runtime_units.length} queue=${plan.execution_queue.length} images=${plan.image_runtime_plan.target_count} videos=${plan.video_runtime_plan.target_count} gates=${plan.quality_gate_runtime_plan.entry_count} ready=${plan.runtime_ready}`
    );
  }

  lines.push('', '## Runtime Checks', '');
  for (const check of report.runtime_checks) {
    lines.push(`- ${check.check_id}: ${check.status}`);
  }

  if (report.issues.length > 0) {
    lines.push('', '## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: MvProductionRuntimeEngineIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionRuntimeEngineReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvProductionRuntimeEngineReport = {
    report_id: 'mv-production-runtime-engine-report-v1',
    phase: MV_PRODUCTION_RUNTIME_ENGINE_PHASE,
    timestamp,
    runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_generation_plan_ref: MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    mv_generation_planning_engine_report_path: MV_GENERATION_PLANNING_ENGINE_REPORT_PATH,
    mv_production_runtime_engine_export_dir: MV_PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR,
    mv_production_runtime_engine_manifest_path: MV_PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
    mv_production_runtime_engine_artifact_path: MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    runtime_plan_count: MV_TYPE_COUNT,
    generation_plan_consumed: 'FAIL',
    runtime_ready: 'FAIL',
    execution_queue_valid: 'FAIL',
    image_runtime_plan_valid: 'FAIL',
    video_runtime_plan_valid: 'FAIL',
    consistency_runtime_plan_valid: 'FAIL',
    quality_gate_runtime_plan_valid: 'FAIL',
    adapter_execution_plan_valid: 'FAIL',
    failure_recovery_ready: 'FAIL',
    runtime_mode_valid: 'FAIL',
    external_call_blocked: 'FAIL',
    gpu_execution_blocked: 'FAIL',
    music_sync_preserved: 'FAIL',
    mv_type_preserved: 'FAIL',
    generation_prompt_seed_ready: 'FAIL',
    traceability_preserved: false,
    production_mode_blocked: 'FAIL',
    generation_plan_missing: true,
    runtime_invalid: true,
    execution_queue_invalid: true,
    image_runtime_plan_missing: true,
    video_runtime_plan_missing: true,
    consistency_runtime_plan_missing: true,
    quality_gate_runtime_plan_missing: true,
    adapter_execution_plan_missing: true,
    failure_recovery_missing: true,
    runtime_mode_invalid: true,
    external_call_enabled: true,
    gpu_execution_enabled: true,
    music_sync_loss: true,
    mv_type_loss: true,
    generation_prompt_seed_missing: true,
    traceability_loss: true,
    production_mode_unblocked: true,
    mv_production_runtime_engine_ready: 'FAIL',
    certification_status: null,
    mv_runtime_plans: [],
    runtime_checks: [],
    final_verdict: MV_PRODUCTION_RUNTIME_ENGINE_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message: 'Generation planning artifact was modified during runtime planning write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_RUNTIME_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionRuntimeEngine(
  projectRoot?: string
): MvProductionRuntimeEngineReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionRuntimeEngineIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const generationPlanningReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    mv_generation_planning_engine_ready: RuntimeStatus;
    generation_plan_ready: RuntimeStatus;
    traceability_preserved: boolean;
  }>(root, MV_GENERATION_PLANNING_ENGINE_REPORT_PATH);
  const generationPlanningArtifact = loadJson<MvGenerationPlanningEngineArtifact>(
    root,
    MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH
  );

  const generationPlanningPrecheckValid =
    generationPlanningReport !== null &&
    generationPlanningReport.final_verdict === MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT &&
    generationPlanningReport.certification_status === MV_GENERATION_PLANNING_READY_STATUS &&
    generationPlanningReport.mv_generation_planning_engine_ready === 'PASS' &&
    generationPlanningReport.generation_plan_ready === 'PASS' &&
    generationPlanningArtifact !== null &&
    generationPlanningArtifact.generation_planning_complete === true;

  if (!generationPlanningPrecheckValid) {
    issues.push({
      code: 'GENERATION_PLANNING_PRECHECK_FAILED',
      message: `Required ${MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT} with ${MV_GENERATION_PLANNING_READY_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const runtimeCertArtifact = loadJson<{
    production_mode_blocked: boolean;
    real_generation_blocked: boolean;
    no_external_calls: boolean;
    no_gpu_execution: boolean;
  }>(root, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH);

  if (!runtimeCertArtifact) {
    issues.push({
      code: 'RUNTIME_CERTIFICATION_MISSING',
      message: 'Missing production runtime certification artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const mvRuntimePlans = generationPlanningArtifact.generation_plans.map((generationPlan) =>
    buildRuntimePlan(generationPlan)
  );

  const generationPlanConsumed =
    generationPlanningArtifact.shot_assembly_consumed === true &&
    generationPlanningArtifact.generation_planning_complete === true &&
    mvRuntimePlans.every(
      (plan) =>
        plan.source_generation_plan_ref === MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH &&
        plan.traceability_chain.generation_plan_id.length > 0
    );

  const runtimeReady = mvRuntimePlans.every((plan) => plan.runtime_ready === 'PASS');
  const executionQueueValid = mvRuntimePlans.every(
    (plan) =>
      plan.execution_queue.length === plan.runtime_units.length * 4 &&
      plan.execution_queue.every(
        (entry) =>
          entry.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY && entry.execution_allowed === false
      )
  );
  const imageRuntimePlanValid = mvRuntimePlans.every(
    (plan) => plan.image_runtime_plan.plan_valid
  );
  const videoRuntimePlanValid = mvRuntimePlans.every(
    (plan) => plan.video_runtime_plan.plan_valid
  );
  const consistencyRuntimePlanValid = mvRuntimePlans.every(
    (plan) => plan.consistency_runtime_plan.plan_valid
  );
  const qualityGateRuntimePlanValid = mvRuntimePlans.every(
    (plan) => plan.quality_gate_runtime_plan.plan_valid
  );
  const adapterExecutionPlanValid = mvRuntimePlans.every(
    (plan) => plan.adapter_execution_plan.plan_valid
  );
  const failureRecoveryReady = mvRuntimePlans.every(
    (plan) => plan.failure_recovery_plan.recovery_ready
  );
  const runtimeModeValid = mvRuntimePlans.every(
    (plan) =>
      plan.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY &&
      plan.image_runtime_plan.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY &&
      plan.video_runtime_plan.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY &&
      plan.consistency_runtime_plan.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY &&
      plan.quality_gate_runtime_plan.runtime_mode === RUNTIME_MODE_TEST_MODE_ONLY
  );
  const externalCallBlocked = mvRuntimePlans.every(
    (plan) =>
      plan.external_call_allowed === false &&
      plan.image_runtime_plan.external_call_allowed === false &&
      plan.video_runtime_plan.external_call_allowed === false &&
      plan.adapter_execution_plan.steps.every((step) => step.external_call_allowed === false)
  );
  const gpuExecutionBlocked = mvRuntimePlans.every(
    (plan) =>
      plan.gpu_execution_allowed === false &&
      plan.image_runtime_plan.gpu_execution_allowed === false &&
      plan.video_runtime_plan.gpu_execution_allowed === false &&
      plan.adapter_execution_plan.steps.every((step) => step.gpu_execution_allowed === false)
  );
  const musicSyncPreserved = mvRuntimePlans.every(
    (plan) => plan.music_sync_runtime_plan.sync_valid
  );
  const mvTypePreserved = mvRuntimePlans.every((plan) => plan.mv_type_preserved === true);
  const generationPromptSeedReady = mvRuntimePlans.every((plan) =>
    plan.generation_prompt_seed.every((seed) => seed.length > 0)
  );
  const traceabilityPreserved =
    generationPlanningArtifact.traceability_preserved === true &&
    mvRuntimePlans.every((plan) => plan.traceability_chain.trace_integrity === 'PASS');

  const productionModeBlocked =
    runtimeCertArtifact.production_mode_blocked === true &&
    runtimeCertArtifact.real_generation_blocked === true &&
    runtimeCertArtifact.no_external_calls === true &&
    runtimeCertArtifact.no_gpu_execution === true &&
    generationPlanningArtifact.safety_flags.production_mode_blocked === true;

  const runtimeWriteScopeValid = RUNTIME_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderRuntimeWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && runtimeWriteScopeValid;

  const runtimePlanningComplete =
    generationPlanConsumed &&
    runtimeReady &&
    executionQueueValid &&
    imageRuntimePlanValid &&
    videoRuntimePlanValid &&
    consistencyRuntimePlanValid &&
    qualityGateRuntimePlanValid &&
    adapterExecutionPlanValid &&
    failureRecoveryReady &&
    runtimeModeValid &&
    externalCallBlocked &&
    gpuExecutionBlocked &&
    musicSyncPreserved &&
    mvTypePreserved &&
    generationPromptSeedReady &&
    traceabilityPreserved &&
    productionModeBlocked &&
    safeCreatePolicyVerified;

  const generationPlanMissing = !generationPlanConsumed;
  const runtimeInvalid = !runtimeReady;
  const executionQueueInvalid = !executionQueueValid;
  const imageRuntimePlanMissing = !imageRuntimePlanValid;
  const videoRuntimePlanMissing = !videoRuntimePlanValid;
  const consistencyRuntimePlanMissing = !consistencyRuntimePlanValid;
  const qualityGateRuntimePlanMissing = !qualityGateRuntimePlanValid;
  const adapterExecutionPlanMissing = !adapterExecutionPlanValid;
  const failureRecoveryMissing = !failureRecoveryReady;
  const runtimeModeInvalidFlag = !runtimeModeValid;
  const externalCallEnabled = !externalCallBlocked;
  const gpuExecutionEnabled = !gpuExecutionBlocked;
  const musicSyncLoss = !musicSyncPreserved;
  const mvTypeLoss = !mvTypePreserved;
  const generationPromptSeedMissing = !generationPromptSeedReady;
  const traceabilityLoss = !traceabilityPreserved;
  const productionModeUnblocked = !productionModeBlocked;

  if (generationPlanMissing) {
    issues.push({
      code: 'GENERATION_PLAN_MISSING',
      message: 'Generation plan was not consumed',
      severity: 'error',
    });
  }
  if (runtimeInvalid) {
    issues.push({
      code: 'RUNTIME_INVALID',
      message: 'Runtime plan is invalid or incomplete',
      severity: 'error',
    });
  }
  if (executionQueueInvalid) {
    issues.push({
      code: 'EXECUTION_QUEUE_INVALID',
      message: 'Execution queue is invalid',
      severity: 'error',
    });
  }
  if (imageRuntimePlanMissing) {
    issues.push({
      code: 'IMAGE_RUNTIME_PLAN_MISSING',
      message: 'Image runtime plan is missing or invalid',
      severity: 'error',
    });
  }
  if (videoRuntimePlanMissing) {
    issues.push({
      code: 'VIDEO_RUNTIME_PLAN_MISSING',
      message: 'Video runtime plan is missing or invalid',
      severity: 'error',
    });
  }
  if (consistencyRuntimePlanMissing) {
    issues.push({
      code: 'CONSISTENCY_RUNTIME_PLAN_MISSING',
      message: 'Consistency runtime plan is missing or invalid',
      severity: 'error',
    });
  }
  if (qualityGateRuntimePlanMissing) {
    issues.push({
      code: 'QUALITY_GATE_RUNTIME_PLAN_MISSING',
      message: 'Quality gate runtime plan is missing or invalid',
      severity: 'error',
    });
  }
  if (adapterExecutionPlanMissing) {
    issues.push({
      code: 'ADAPTER_EXECUTION_PLAN_MISSING',
      message: 'Adapter execution plan is missing or invalid',
      severity: 'error',
    });
  }
  if (failureRecoveryMissing) {
    issues.push({
      code: 'FAILURE_RECOVERY_MISSING',
      message: 'Failure recovery plan is missing or not ready',
      severity: 'error',
    });
  }
  if (runtimeModeInvalidFlag) {
    issues.push({
      code: 'RUNTIME_MODE_INVALID',
      message: 'Runtime mode must be test_mode_only',
      severity: 'error',
    });
  }
  if (externalCallEnabled) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'External calls must be blocked',
      severity: 'error',
    });
  }
  if (gpuExecutionEnabled) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'GPU execution must be blocked',
      severity: 'error',
    });
  }
  if (musicSyncLoss) {
    issues.push({
      code: 'MUSIC_SYNC_LOSS',
      message: 'Music sync plan is not preserved',
      severity: 'error',
    });
  }
  if (mvTypeLoss) {
    issues.push({ code: 'MV_TYPE_LOSS', message: 'MV type was not preserved', severity: 'error' });
  }
  if (generationPromptSeedMissing) {
    issues.push({
      code: 'GENERATION_PROMPT_SEED_MISSING',
      message: 'Generation prompt seeds are missing',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability chain is not preserved',
      severity: 'error',
    });
  }
  if (productionModeUnblocked) {
    issues.push({
      code: 'PRODUCTION_MODE_UNBLOCKED',
      message: 'Production mode is not blocked',
      severity: 'error',
    });
  }
  if (!safeCreatePolicyVerified) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Safe create policy was violated',
      severity: 'error',
    });
  }

  const runtimeChecks: RuntimeCheck[] = [
    {
      check_id: 'generation_plan_consumed',
      check_label: 'Generation Plan Consumed',
      status: toStatus(generationPlanConsumed),
    },
    {
      check_id: 'runtime_ready',
      check_label: 'Runtime Ready',
      status: toStatus(runtimeReady),
    },
    {
      check_id: 'execution_queue_valid',
      check_label: 'Execution Queue Valid',
      status: toStatus(executionQueueValid),
    },
    {
      check_id: 'image_runtime_plan_valid',
      check_label: 'Image Runtime Plan Valid',
      status: toStatus(imageRuntimePlanValid),
    },
    {
      check_id: 'video_runtime_plan_valid',
      check_label: 'Video Runtime Plan Valid',
      status: toStatus(videoRuntimePlanValid),
    },
    {
      check_id: 'consistency_runtime_plan_valid',
      check_label: 'Consistency Runtime Plan Valid',
      status: toStatus(consistencyRuntimePlanValid),
    },
    {
      check_id: 'quality_gate_runtime_plan_valid',
      check_label: 'Quality Gate Runtime Plan Valid',
      status: toStatus(qualityGateRuntimePlanValid),
    },
    {
      check_id: 'adapter_execution_plan_valid',
      check_label: 'Adapter Execution Plan Valid',
      status: toStatus(adapterExecutionPlanValid),
    },
    {
      check_id: 'failure_recovery_ready',
      check_label: 'Failure Recovery Ready',
      status: toStatus(failureRecoveryReady),
    },
    {
      check_id: 'runtime_mode_valid',
      check_label: 'Runtime Mode Valid',
      status: toStatus(runtimeModeValid),
    },
    {
      check_id: 'external_call_blocked',
      check_label: 'External Call Blocked',
      status: toStatus(externalCallBlocked),
    },
    {
      check_id: 'gpu_execution_blocked',
      check_label: 'GPU Execution Blocked',
      status: toStatus(gpuExecutionBlocked),
    },
    {
      check_id: 'music_sync_preserved',
      check_label: 'Music Sync Preserved',
      status: toStatus(musicSyncPreserved),
    },
    {
      check_id: 'mv_type_preserved',
      check_label: 'MV Type Preserved',
      status: toStatus(mvTypePreserved),
    },
    {
      check_id: 'generation_prompt_seed_ready',
      check_label: 'Generation Prompt Seed Ready',
      status: toStatus(generationPromptSeedReady),
    },
    {
      check_id: 'traceability_preserved',
      check_label: 'Traceability Preserved',
      status: toStatus(traceabilityPreserved),
    },
    {
      check_id: 'production_mode_blocked',
      check_label: 'Production Mode Blocked',
      status: toStatus(productionModeBlocked),
    },
  ];

  const pass =
    runtimePlanningComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionRuntimeEngineArtifact = {
    engine_id: 'mv-production-runtime-engine-v1',
    phase: MV_PRODUCTION_RUNTIME_ENGINE_PHASE,
    generated_at: timestamp,
    source_generation_plan_ref: MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    generation_planning_engine_id: generationPlanningArtifact.engine_id,
    mv_runtime_plans: mvRuntimePlans,
    safety_flags: {
      runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
      generation: false,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
      production_mode_blocked: true,
    },
    generation_plan_consumed: generationPlanConsumed,
    production_mode_blocked: true,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      runtime_artifact_write_scope: RUNTIME_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    runtime_planning_complete: runtimePlanningComplete,
  };

  const manifest: MvProductionRuntimeEngineManifest = {
    manifest_id: 'mv-production-runtime-engine-manifest-v1',
    phase: MV_PRODUCTION_RUNTIME_ENGINE_PHASE,
    generated_at: timestamp,
    runtime_plan_count: MV_TYPE_COUNT,
    generation_plan_consumed: toStatus(generationPlanConsumed),
    runtime_ready: toStatus(runtimeReady),
    execution_queue_valid: toStatus(executionQueueValid),
    image_runtime_plan_valid: toStatus(imageRuntimePlanValid),
    video_runtime_plan_valid: toStatus(videoRuntimePlanValid),
    consistency_runtime_plan_valid: toStatus(consistencyRuntimePlanValid),
    quality_gate_runtime_plan_valid: toStatus(qualityGateRuntimePlanValid),
    adapter_execution_plan_valid: toStatus(adapterExecutionPlanValid),
    failure_recovery_ready: toStatus(failureRecoveryReady),
    runtime_mode_valid: toStatus(runtimeModeValid),
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    music_sync_preserved: toStatus(musicSyncPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    generation_prompt_seed_ready: toStatus(generationPromptSeedReady),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    certification_status: pass ? MV_PRODUCTION_RUNTIME_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionRuntimeEngineReport = {
    report_id: 'mv-production-runtime-engine-report-v1',
    phase: MV_PRODUCTION_RUNTIME_ENGINE_PHASE,
    timestamp,
    runtime_mode: RUNTIME_MODE_TEST_MODE_ONLY,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_generation_plan_ref: MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    mv_generation_planning_engine_report_path: MV_GENERATION_PLANNING_ENGINE_REPORT_PATH,
    mv_production_runtime_engine_export_dir: MV_PRODUCTION_RUNTIME_ENGINE_EXPORT_DIR,
    mv_production_runtime_engine_manifest_path: MV_PRODUCTION_RUNTIME_ENGINE_MANIFEST_PATH,
    mv_production_runtime_engine_artifact_path: MV_PRODUCTION_RUNTIME_ENGINE_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    runtime_plan_count: MV_TYPE_COUNT,
    generation_plan_consumed: toStatus(generationPlanConsumed),
    runtime_ready: toStatus(runtimeReady),
    execution_queue_valid: toStatus(executionQueueValid),
    image_runtime_plan_valid: toStatus(imageRuntimePlanValid),
    video_runtime_plan_valid: toStatus(videoRuntimePlanValid),
    consistency_runtime_plan_valid: toStatus(consistencyRuntimePlanValid),
    quality_gate_runtime_plan_valid: toStatus(qualityGateRuntimePlanValid),
    adapter_execution_plan_valid: toStatus(adapterExecutionPlanValid),
    failure_recovery_ready: toStatus(failureRecoveryReady),
    runtime_mode_valid: toStatus(runtimeModeValid),
    external_call_blocked: toStatus(externalCallBlocked),
    gpu_execution_blocked: toStatus(gpuExecutionBlocked),
    music_sync_preserved: toStatus(musicSyncPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    generation_prompt_seed_ready: toStatus(generationPromptSeedReady),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    generation_plan_missing: generationPlanMissing,
    runtime_invalid: runtimeInvalid,
    execution_queue_invalid: executionQueueInvalid,
    image_runtime_plan_missing: imageRuntimePlanMissing,
    video_runtime_plan_missing: videoRuntimePlanMissing,
    consistency_runtime_plan_missing: consistencyRuntimePlanMissing,
    quality_gate_runtime_plan_missing: qualityGateRuntimePlanMissing,
    adapter_execution_plan_missing: adapterExecutionPlanMissing,
    failure_recovery_missing: failureRecoveryMissing,
    runtime_mode_invalid: runtimeModeInvalidFlag,
    external_call_enabled: externalCallEnabled,
    gpu_execution_enabled: gpuExecutionEnabled,
    music_sync_loss: musicSyncLoss,
    mv_type_loss: mvTypeLoss,
    generation_prompt_seed_missing: generationPromptSeedMissing,
    traceability_loss: traceabilityLoss,
    production_mode_unblocked: productionModeUnblocked,
    mv_production_runtime_engine_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_RUNTIME_READY_STATUS : null,
    mv_runtime_plans: mvRuntimePlans,
    runtime_checks: runtimeChecks,
    final_verdict: pass
      ? MV_PRODUCTION_RUNTIME_ENGINE_PASS_VERDICT
      : MV_PRODUCTION_RUNTIME_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_RUNTIME_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_RUNTIME_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
