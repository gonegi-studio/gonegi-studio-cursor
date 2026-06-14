import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  GPU_PAYLOAD_PHASE,
  GPU_PAYLOAD_REGISTRY_PATH,
  loadSourcesForVideoShot,
  type GpuRenderPayload,
} from './gpuRenderPayloadBuilder.js';
import { loadKeyframePlan } from './keyframePlanBuilder.js';
import { loadVideoShotState } from './videoShotStateBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GPU_PAYLOAD_PASS_VERDICT = 'PASS_GPU_RENDER_PAYLOAD_PREPARATION_V1' as const;
export const GPU_PAYLOAD_FAIL_VERDICT = 'FAIL_GPU_RENDER_PAYLOAD_PREPARATION_V1' as const;
export const GPU_PAYLOAD_REPORT_PATH = 'reports/gpu-render-payload-preparation-report.json' as const;
export const GPU_PAYLOAD_SCHEMA_PATH = 'datasets/gpu_payload/gpu-render-payload.schema.json' as const;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type GpuPayloadValidationResult = {
  gpu_payload_id: string;
  valid: boolean;
  issues: ValidationIssue[];
};

export type GpuRenderPayloadPreparationReport = {
  preparation_id: string;
  phase: typeof GPU_PAYLOAD_PHASE;
  timestamp: string;
  payload_count: number;
  source_chain_status: 'PASS' | 'FAIL';
  identity_lock_status: 'PASS' | 'FAIL';
  motion_alignment_status: 'PASS' | 'FAIL';
  execution_safety_status: 'PASS' | 'FAIL';
  payload_validations: GpuPayloadValidationResult[];
  issues: ValidationIssue[];
  gpu_execution: false;
  preparation_only: true;
  final_verdict: typeof GPU_PAYLOAD_PASS_VERDICT | typeof GPU_PAYLOAD_FAIL_VERDICT;
};

function validateSourceLinks(projectRoot: string, payload: GpuRenderPayload): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sources = loadSourcesForVideoShot(projectRoot, payload.source_video_shot_state_id);

  if (!sources) {
    issues.push({
      code: 'SOURCE_CHAIN_BROKEN',
      message: `Source chain missing for ${payload.source_video_shot_state_id}`,
      severity: 'error',
    });
    return issues;
  }

  const { video, keyframePlan, motionPlan } = sources;

  if (payload.source_video_shot_state_id !== video.video_shot_state_id) {
    issues.push({ code: 'SOURCE_MISMATCH', message: 'video shot id mismatch', severity: 'error' });
  }
  if (payload.source_keyframe_plan_id !== keyframePlan.keyframe_plan_id) {
    issues.push({ code: 'SOURCE_MISMATCH', message: 'keyframe plan id mismatch', severity: 'error' });
  }
  if (payload.source_motion_plan_id !== motionPlan.motion_plan_id) {
    issues.push({ code: 'SOURCE_MISMATCH', message: 'motion plan id mismatch', severity: 'error' });
  }
  if (payload.source_scene_state_id !== keyframePlan.source_scene_state_id) {
    issues.push({ code: 'SOURCE_MISMATCH', message: 'scene state id mismatch', severity: 'error' });
  }
  if (video.source_scene_state_id !== keyframePlan.source_scene_state_id) {
    issues.push({
      code: 'SOURCE_CHAIN_BROKEN',
      message: 'video shot and keyframe plan scene state mismatch',
      severity: 'error',
    });
  }
  if (motionPlan.source_keyframe_plan_id !== keyframePlan.keyframe_plan_id) {
    issues.push({
      code: 'SOURCE_CHAIN_BROKEN',
      message: 'motion plan and keyframe plan mismatch',
      severity: 'error',
    });
  }

  return issues;
}

function validateTimingAlignment(projectRoot: string, payload: GpuRenderPayload): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const video = loadVideoShotState(projectRoot, payload.source_video_shot_state_id);
  const keyframePlan = loadKeyframePlan(projectRoot, payload.source_keyframe_plan_id);

  if (!video || !keyframePlan) return issues;

  if (payload.duration_seconds !== video.duration_seconds) {
    issues.push({
      code: 'TIMING_MISMATCH',
      message: `payload duration ${payload.duration_seconds} != video ${video.duration_seconds}`,
      severity: 'error',
      field: 'duration_seconds',
    });
  }
  if (keyframePlan.duration_seconds !== video.duration_seconds) {
    issues.push({
      code: 'TIMING_MISMATCH',
      message: 'keyframe plan duration does not match video shot',
      severity: 'error',
    });
  }
  if (payload.fps_target !== video.fps_target) {
    issues.push({
      code: 'TIMING_MISMATCH',
      message: `payload fps ${payload.fps_target} != video ${video.fps_target}`,
      severity: 'error',
      field: 'fps_target',
    });
  }
  if (keyframePlan.fps_target !== video.fps_target) {
    issues.push({
      code: 'TIMING_MISMATCH',
      message: 'keyframe plan fps does not match video shot',
      severity: 'error',
    });
  }

  return issues;
}

function validateMotionAlignment(payload: GpuRenderPayload): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (payload.keyframes.length !== payload.motion_segments.length + 1) {
    issues.push({
      code: 'MOTION_ALIGNMENT_FAIL',
      message: `keyframes (${payload.keyframes.length}) must equal motion_segments (${payload.motion_segments.length}) + 1`,
      severity: 'error',
      field: 'keyframes',
    });
  }

  for (const segment of payload.motion_segments) {
    if (segment.to_keyframe !== segment.from_keyframe + 1) {
      issues.push({
        code: 'MOTION_ALIGNMENT_FAIL',
        message: `Segment ${segment.segment_id} must connect consecutive keyframes`,
        severity: 'error',
        field: segment.segment_id,
      });
    }
  }

  const segmentDuration = payload.motion_segments.reduce((s, seg) => s + seg.duration_seconds, 0);
  if (Math.abs(segmentDuration - payload.duration_seconds) > 0.02) {
    issues.push({
      code: 'MOTION_ALIGNMENT_FAIL',
      message: `motion segment total ${segmentDuration}s != payload duration ${payload.duration_seconds}s`,
      severity: 'error',
      field: 'motion_segments',
    });
  }

  return issues;
}

function validateIdentityLocks(projectRoot: string, payload: GpuRenderPayload): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const keyframePlan = loadKeyframePlan(projectRoot, payload.source_keyframe_plan_id);
  if (!keyframePlan) return issues;

  const baseline = keyframePlan.keyframes[0]?.continuity_locks.identity_locks ?? [];

  if (payload.identity_locks.length === 0) {
    issues.push({
      code: 'IDENTITY_LOCK_FAIL',
      message: 'identity_locks must not be empty',
      severity: 'error',
      field: 'identity_locks',
    });
  }

  if (JSON.stringify(payload.identity_locks) !== JSON.stringify(baseline)) {
    issues.push({
      code: 'IDENTITY_LOCK_FAIL',
      message: 'payload identity_locks must match keyframe plan baseline',
      severity: 'error',
      field: 'identity_locks',
    });
  }

  for (const kf of payload.keyframes) {
    if (!kf.scene_state_ref) {
      issues.push({
        code: 'IDENTITY_LOCK_FAIL',
        message: `keyframe ${kf.keyframe_index} missing scene_state_ref`,
        severity: 'error',
      });
    }
  }

  return issues;
}

function validateLocationAndCompositionLocks(
  projectRoot: string,
  payload: GpuRenderPayload
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const keyframePlan = loadKeyframePlan(projectRoot, payload.source_keyframe_plan_id);
  if (!keyframePlan) return issues;

  const baseline = keyframePlan.keyframes[0]?.continuity_locks;

  if (JSON.stringify(payload.location_locks) !== JSON.stringify(baseline?.location_locks ?? [])) {
    issues.push({
      code: 'LOCATION_LOCK_FAIL',
      message: 'payload location_locks must match keyframe plan baseline',
      severity: 'error',
      field: 'location_locks',
    });
  }

  if (
    JSON.stringify(payload.composition_locks) !== JSON.stringify(baseline?.composition_locks ?? [])
  ) {
    issues.push({
      code: 'COMPOSITION_LOCK_FAIL',
      message: 'payload composition_locks must match keyframe plan baseline',
      severity: 'error',
      field: 'composition_locks',
    });
  }

  const expectedProps = (baseline?.composition_locks ?? []).filter((l) =>
    l.startsWith('prop_anchor:')
  );
  if (JSON.stringify(payload.prop_locks) !== JSON.stringify(expectedProps)) {
    issues.push({
      code: 'PROP_LOCK_FAIL',
      message: 'payload prop_locks must match keyframe prop anchors',
      severity: 'error',
      field: 'prop_locks',
    });
  }

  return issues;
}

function validateExecutionSafety(payload: GpuRenderPayload): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (payload.execution_flags.gpu_execution !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      field: 'execution_flags.gpu_execution',
    });
  }
  if (payload.execution_flags.preparation_only !== true) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'execution_flags.preparation_only must be true',
      severity: 'error',
      field: 'execution_flags.preparation_only',
    });
  }
  if (payload.execution_flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      field: 'execution_flags.external_call_allowed',
    });
  }

  if (!payload.negative_constraints.some((c) => c.includes('no_gpu_execution'))) {
    issues.push({
      code: 'EXECUTION_UNSAFE',
      message: 'negative_constraints must include no_gpu_execution guard',
      severity: 'error',
      field: 'negative_constraints',
    });
  }

  return issues;
}

function validateRegistry(projectRoot: string, payloads: GpuRenderPayload[]): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, GPU_PAYLOAD_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${GPU_PAYLOAD_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const registry = readJsonRecord(root, GPU_PAYLOAD_REGISTRY_PATH) as {
    gpu_render_payloads?: Array<{ gpu_payload_id: string; payload_path: string }>;
  } | null;

  if (!registry?.gpu_render_payloads?.length) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${GPU_PAYLOAD_REGISTRY_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const builtIds = new Set(payloads.map((p) => p.gpu_payload_id));
  for (const entry of registry.gpu_render_payloads) {
    if (!builtIds.has(entry.gpu_payload_id)) {
      issues.push({
        code: 'REGISTRY_ORPHAN',
        message: `Registry missing built payload: ${entry.gpu_payload_id}`,
        severity: 'error',
      });
    }
    if (!fs.existsSync(path.join(root, entry.payload_path))) {
      issues.push({
        code: 'MISSING_PAYLOAD_FILE',
        message: `Payload file missing: ${entry.payload_path}`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function validateGpuRenderPayload(
  projectRoot: string,
  payload: GpuRenderPayload
): GpuPayloadValidationResult {
  const issues = [
    ...validateSourceLinks(projectRoot, payload),
    ...validateTimingAlignment(projectRoot, payload),
    ...validateMotionAlignment(payload),
    ...validateIdentityLocks(projectRoot, payload),
    ...validateLocationAndCompositionLocks(projectRoot, payload),
    ...validateExecutionSafety(payload),
  ];

  return {
    gpu_payload_id: payload.gpu_payload_id,
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

export function runGpuRenderPayloadValidation(
  projectRoot: string,
  payloads: GpuRenderPayload[]
): GpuRenderPayloadPreparationReport {
  const registryIssues = validateRegistry(projectRoot, payloads);
  const payload_validations = payloads.map((p) => validateGpuRenderPayload(projectRoot, p));
  const issues = [...registryIssues, ...payload_validations.flatMap((v) => v.issues)];
  const errors = issues.filter((i) => i.severity === 'error');

  const sourceChainErrors = errors.filter((e) =>
    ['SOURCE_CHAIN_BROKEN', 'SOURCE_MISMATCH', 'TIMING_MISMATCH', 'MISSING_REGISTRY'].includes(
      e.code
    )
  );
  const identityErrors = errors.filter((e) =>
    ['IDENTITY_LOCK_FAIL', 'PROP_LOCK_FAIL'].includes(e.code)
  );
  const motionErrors = errors.filter((e) => e.code === 'MOTION_ALIGNMENT_FAIL');
  const executionErrors = errors.filter((e) => e.code === 'EXECUTION_UNSAFE');
  const locationCompositionErrors = errors.filter((e) =>
    ['LOCATION_LOCK_FAIL', 'COMPOSITION_LOCK_FAIL'].includes(e.code)
  );

  const pass = errors.length === 0;

  return {
    preparation_id: `gpu_payload_prep_${Date.now().toString(36)}`,
    phase: GPU_PAYLOAD_PHASE,
    timestamp: new Date().toISOString(),
    payload_count: payloads.length,
    source_chain_status: sourceChainErrors.length === 0 ? 'PASS' : 'FAIL',
    identity_lock_status:
      identityErrors.length === 0 && locationCompositionErrors.length === 0 ? 'PASS' : 'FAIL',
    motion_alignment_status: motionErrors.length === 0 ? 'PASS' : 'FAIL',
    execution_safety_status: executionErrors.length === 0 ? 'PASS' : 'FAIL',
    payload_validations,
    issues,
    gpu_execution: false,
    preparation_only: true,
    final_verdict: pass ? GPU_PAYLOAD_PASS_VERDICT : GPU_PAYLOAD_FAIL_VERDICT,
  };
}

export function writeGpuRenderPayloadPreparationReport(
  projectRoot: string,
  payloads: GpuRenderPayload[]
): GpuRenderPayloadPreparationReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runGpuRenderPayloadValidation(root, payloads);

  const payload = {
    ...report,
    report_type: 'gpu_render_payload_preparation_report',
    report_version: 'v1',
    export_path: GPU_PAYLOAD_REPORT_PATH,
    schema_path: GPU_PAYLOAD_SCHEMA_PATH,
    registry_path: GPU_PAYLOAD_REGISTRY_PATH,
    next_phase: 'PHASE-23 VIDEO_RUNTIME_INTERFACE_DESIGN_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, GPU_PAYLOAD_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  return report;
}
