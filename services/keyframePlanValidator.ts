import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  deriveKeyframeSchedule,
  KEYFRAME_PLAN_PHASE,
  KEYFRAME_PLAN_REGISTRY_PATH,
  type KeyframePlan,
} from './keyframePlanBuilder.js';
import { loadSceneState, loadVideoShotState } from './videoShotStateBuilder.js';

export const KEYFRAME_PLAN_PASS_VERDICT = 'PASS_KEYFRAME_PLAN_BUILDER_V1' as const;
export const KEYFRAME_PLAN_FAIL_VERDICT = 'FAIL_KEYFRAME_PLAN_BUILDER_V1' as const;
export const KEYFRAME_PLAN_REPORT_PATH = 'reports/keyframe-plan-builder-report.json' as const;
export const KEYFRAME_PLAN_SCHEMA_PATH = 'datasets/keyframe_plan/keyframe-plan.schema.json' as const;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type KeyframePlanValidationResult = {
  keyframe_plan_id: string;
  valid: boolean;
  issues: ValidationIssue[];
};

export type KeyframePlanBuilderReport = {
  builder_id: string;
  phase: typeof KEYFRAME_PLAN_PHASE;
  timestamp: string;
  plan_count: number;
  keyframe_count: number;
  continuity_validation: 'PASS' | 'FAIL';
  identity_validation: 'PASS' | 'FAIL';
  camera_validation: 'PASS' | 'FAIL';
  plan_validations: KeyframePlanValidationResult[];
  issues: ValidationIssue[];
  gpu_execution: false;
  planning_only: true;
  final_verdict: typeof KEYFRAME_PLAN_PASS_VERDICT | typeof KEYFRAME_PLAN_FAIL_VERDICT;
};

function validateSourceExists(projectRoot: string, plan: KeyframePlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const video = loadVideoShotState(projectRoot, plan.source_video_shot_state_id);
  if (!video) {
    issues.push({
      code: 'MISSING_SOURCE_VIDEO_SHOT',
      message: `source_video_shot_state_id not found: ${plan.source_video_shot_state_id}`,
      severity: 'error',
      field: 'source_video_shot_state_id',
    });
  }

  const scene = loadSceneState(projectRoot, plan.source_scene_state_id);
  if (!scene) {
    issues.push({
      code: 'MISSING_SOURCE_SCENE_STATE',
      message: `source_scene_state_id not found: ${plan.source_scene_state_id}`,
      severity: 'error',
      field: 'source_scene_state_id',
    });
  }

  return issues;
}

function validateTimestamps(plan: KeyframePlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const expected = deriveKeyframeSchedule(plan.duration_seconds);

  if (plan.keyframes.length !== expected.length) {
    issues.push({
      code: 'INVALID_KEYFRAME_COUNT',
      message: `Expected ${expected.length} keyframes for ${plan.duration_seconds}s shot, got ${plan.keyframes.length}`,
      severity: 'error',
      field: 'keyframes',
    });
    return issues;
  }

  for (let i = 0; i < plan.keyframes.length; i += 1) {
    const kf = plan.keyframes[i];
    const exp = expected[i];

    if (kf.keyframe_index !== i) {
      issues.push({
        code: 'INVALID_KEYFRAME_INDEX',
        message: `Keyframe index mismatch at position ${i}`,
        severity: 'error',
        field: `keyframes[${i}].keyframe_index`,
      });
    }

    if (Math.abs(kf.timestamp - exp.timestamp) > 0.01) {
      issues.push({
        code: 'INVALID_TIMESTAMP',
        message: `Keyframe ${i} timestamp ${kf.timestamp} expected ${exp.timestamp}`,
        severity: 'error',
        field: `keyframes[${i}].timestamp`,
      });
    }

    if (kf.keyframe_role !== exp.role) {
      issues.push({
        code: 'INVALID_KEYFRAME_ROLE',
        message: `Keyframe ${i} role ${kf.keyframe_role} expected ${exp.role}`,
        severity: 'error',
        field: `keyframes[${i}].keyframe_role`,
      });
    }

    if (kf.timestamp < 0 || kf.timestamp > plan.duration_seconds) {
      issues.push({
        code: 'INVALID_TIMESTAMP',
        message: `Keyframe ${i} timestamp out of range`,
        severity: 'error',
        field: `keyframes[${i}].timestamp`,
      });
    }
  }

  const timestamps = plan.keyframes.map((k) => k.timestamp);
  for (let i = 1; i < timestamps.length; i += 1) {
    if (timestamps[i] <= timestamps[i - 1]) {
      issues.push({
        code: 'INVALID_TIMESTAMP_ORDER',
        message: 'Keyframe timestamps must be strictly increasing',
        severity: 'error',
        field: 'keyframes',
      });
      break;
    }
  }

  return issues;
}

function validateContinuityLocks(plan: KeyframePlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const first = plan.keyframes[0]?.continuity_locks;

  if (!first) {
    issues.push({
      code: 'MISSING_CONTINUITY_LOCKS',
      message: 'First keyframe missing continuity_locks',
      severity: 'error',
    });
    return issues;
  }

  for (const kf of plan.keyframes) {
    if (kf.continuity_locks.identity_locks.length === 0) {
      issues.push({
        code: 'CONTINUITY_LOCK_VIOLATION',
        message: `Keyframe ${kf.keyframe_index} missing identity_locks`,
        severity: 'error',
        field: `keyframes[${kf.keyframe_index}].continuity_locks.identity_locks`,
      });
    }
    if (kf.continuity_locks.location_locks.length === 0) {
      issues.push({
        code: 'CONTINUITY_LOCK_VIOLATION',
        message: `Keyframe ${kf.keyframe_index} missing location_locks`,
        severity: 'error',
        field: `keyframes[${kf.keyframe_index}].continuity_locks.location_locks`,
      });
    }

    const identityMatch =
      JSON.stringify(kf.continuity_locks.identity_locks) ===
      JSON.stringify(first.identity_locks);
    const locationMatch =
      JSON.stringify(kf.continuity_locks.location_locks) ===
      JSON.stringify(first.location_locks);

    if (!identityMatch || !locationMatch) {
      issues.push({
        code: 'CONTINUITY_LOCK_VIOLATION',
        message: `Keyframe ${kf.keyframe_index} continuity locks differ from plan baseline`,
        severity: 'error',
        field: `keyframes[${kf.keyframe_index}].continuity_locks`,
      });
    }
  }

  return issues;
}

function validateIdentityPreserved(
  projectRoot: string,
  plan: KeyframePlan
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const scene = loadSceneState(projectRoot, plan.source_scene_state_id);
  if (!scene) return issues;

  const protectedSet = new Set(scene.identity_state.protected_character_ids);
  const lockTokenSet = new Set(scene.identity_state.identity_lock_tokens);

  for (const kf of plan.keyframes) {
    if (!kf.camera_state.identity_safe) {
      issues.push({
        code: 'IDENTITY_VIOLATION',
        message: `Keyframe ${kf.keyframe_index} camera_state.identity_safe must be true`,
        severity: 'error',
        field: `keyframes[${kf.keyframe_index}].camera_state.identity_safe`,
      });
    }

    const kfProtected = new Set(kf.identity_state.protected_character_ids);
    if (
      protectedSet.size !== kfProtected.size ||
      ![...protectedSet].every((id) => kfProtected.has(id))
    ) {
      issues.push({
        code: 'IDENTITY_VIOLATION',
        message: `Keyframe ${kf.keyframe_index} protected_character_ids must match scene identity_state`,
        severity: 'error',
        field: `keyframes[${kf.keyframe_index}].identity_state.protected_character_ids`,
      });
    }

    const kfTokens = new Set(kf.identity_state.identity_lock_tokens);
    if (
      lockTokenSet.size !== kfTokens.size ||
      ![...lockTokenSet].every((token) => kfTokens.has(token))
    ) {
      issues.push({
        code: 'IDENTITY_VIOLATION',
        message: `Keyframe ${kf.keyframe_index} identity_lock_tokens must match scene identity_state`,
        severity: 'error',
        field: `keyframes[${kf.keyframe_index}].identity_state.identity_lock_tokens`,
      });
    }

    if (kf.scene_state_ref !== scene.scene_state_id) {
      issues.push({
        code: 'IDENTITY_VIOLATION',
        message: `Keyframe ${kf.keyframe_index} scene_state_ref mismatch`,
        severity: 'error',
        field: `keyframes[${kf.keyframe_index}].scene_state_ref`,
      });
    }
  }

  return issues;
}

function validateLocationLockPreserved(
  projectRoot: string,
  plan: KeyframePlan
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const scene = loadSceneState(projectRoot, plan.source_scene_state_id);
  if (!scene) return issues;

  for (const kf of plan.keyframes) {
    if (!kf.location_state.location_lock_preserved) {
      issues.push({
        code: 'LOCATION_LOCK_VIOLATION',
        message: `Keyframe ${kf.keyframe_index} location_lock_preserved must be true`,
        severity: 'error',
        field: `keyframes[${kf.keyframe_index}].location_state`,
      });
    }

    if (kf.location_state.location_id !== scene.location_state.location_id) {
      issues.push({
        code: 'LOCATION_LOCK_VIOLATION',
        message: `Keyframe ${kf.keyframe_index} location_id changed`,
        severity: 'error',
        field: `keyframes[${kf.keyframe_index}].location_state.location_id`,
      });
    }

    const sceneLayout = scene.location_state.layout_lock_id;
    if (sceneLayout && kf.location_state.layout_lock_id !== sceneLayout) {
      issues.push({
        code: 'LOCATION_LOCK_VIOLATION',
        message: `Keyframe ${kf.keyframe_index} layout_lock_id changed`,
        severity: 'error',
        field: `keyframes[${kf.keyframe_index}].location_state.layout_lock_id`,
      });
    }
  }

  return issues;
}

function validateCameraProgression(plan: KeyframePlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const progresses = plan.keyframes.map((k) => k.camera_state.motion_progress);

  if (progresses[0] !== 0) {
    issues.push({
      code: 'CAMERA_PROGRESSION_INVALID',
      message: 'First keyframe motion_progress must be 0',
      severity: 'error',
      field: 'keyframes[0].camera_state.motion_progress',
    });
  }

  const last = plan.keyframes[plan.keyframes.length - 1];
  if (last && last.camera_state.motion_progress !== 1) {
    issues.push({
      code: 'CAMERA_PROGRESSION_INVALID',
      message: 'Last keyframe motion_progress must be 1',
      severity: 'error',
      field: `keyframes[${last.keyframe_index}].camera_state.motion_progress`,
    });
  }

  for (let i = 1; i < progresses.length; i += 1) {
    if (progresses[i] < progresses[i - 1]) {
      issues.push({
        code: 'CAMERA_PROGRESSION_INVALID',
        message: 'camera motion_progress must be monotonically non-decreasing',
        severity: 'error',
        field: 'keyframes',
      });
      break;
    }
  }

  const roles = plan.keyframes.map((k) => k.keyframe_role);
  if (roles[0] !== 'start' || roles[roles.length - 1] !== 'end') {
    issues.push({
      code: 'CAMERA_PROGRESSION_INVALID',
      message: 'First keyframe must be start and last must be end',
      severity: 'error',
      field: 'keyframes',
    });
  }

  return issues;
}

function validateRegistry(projectRoot: string, plans: KeyframePlan[]): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, KEYFRAME_PLAN_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${KEYFRAME_PLAN_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const registry = readJsonRecord(root, KEYFRAME_PLAN_REGISTRY_PATH) as {
    keyframe_plans?: Array<{ keyframe_plan_id: string; plan_path: string }>;
  } | null;

  if (!registry?.keyframe_plans?.length) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${KEYFRAME_PLAN_REGISTRY_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const builtIds = new Set(plans.map((p) => p.keyframe_plan_id));
  for (const entry of registry.keyframe_plans) {
    if (!builtIds.has(entry.keyframe_plan_id)) {
      issues.push({
        code: 'REGISTRY_ORPHAN',
        message: `Registry missing built plan: ${entry.keyframe_plan_id}`,
        severity: 'error',
      });
    }
    if (!fs.existsSync(path.join(root, entry.plan_path))) {
      issues.push({
        code: 'MISSING_PLAN_FILE',
        message: `Plan file missing: ${entry.plan_path}`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function validateKeyframePlan(
  projectRoot: string,
  plan: KeyframePlan
): KeyframePlanValidationResult {
  const issues = [
    ...validateSourceExists(projectRoot, plan),
    ...validateTimestamps(plan),
    ...validateContinuityLocks(plan),
    ...validateIdentityPreserved(projectRoot, plan),
    ...validateLocationLockPreserved(projectRoot, plan),
    ...validateCameraProgression(plan),
  ];

  return {
    keyframe_plan_id: plan.keyframe_plan_id,
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

export function runKeyframePlanBuilderValidation(
  projectRoot: string,
  plans: KeyframePlan[]
): KeyframePlanBuilderReport {
  const registryIssues = validateRegistry(projectRoot, plans);
  const plan_validations = plans.map((plan) => validateKeyframePlan(projectRoot, plan));
  const issues = [...registryIssues, ...plan_validations.flatMap((v) => v.issues)];
  const errors = issues.filter((i) => i.severity === 'error');

  const continuityErrors = errors.filter((e) => e.code.startsWith('CONTINUITY'));
  const identityErrors = errors.filter((e) => e.code === 'IDENTITY_VIOLATION');
  const cameraErrors = errors.filter((e) => e.code === 'CAMERA_PROGRESSION_INVALID');

  const pass = errors.length === 0;

  return {
    builder_id: `keyframe_plan_builder_${Date.now().toString(36)}`,
    phase: KEYFRAME_PLAN_PHASE,
    timestamp: new Date().toISOString(),
    plan_count: plans.length,
    keyframe_count: plans.reduce((sum, p) => sum + p.keyframes.length, 0),
    continuity_validation: continuityErrors.length === 0 ? 'PASS' : 'FAIL',
    identity_validation: identityErrors.length === 0 ? 'PASS' : 'FAIL',
    camera_validation: cameraErrors.length === 0 ? 'PASS' : 'FAIL',
    plan_validations,
    issues,
    gpu_execution: false,
    planning_only: true,
    final_verdict: pass ? KEYFRAME_PLAN_PASS_VERDICT : KEYFRAME_PLAN_FAIL_VERDICT,
  };
}

export function writeKeyframePlanBuilderReport(
  projectRoot: string,
  plans: KeyframePlan[]
): KeyframePlanBuilderReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runKeyframePlanBuilderValidation(root, plans);

  const payload = {
    ...report,
    report_type: 'keyframe_plan_builder_report',
    report_version: 'v1',
    export_path: KEYFRAME_PLAN_REPORT_PATH,
    schema_path: KEYFRAME_PLAN_SCHEMA_PATH,
    registry_path: KEYFRAME_PLAN_REGISTRY_PATH,
    next_phase: 'PHASE-21 MOTION_PLAN_BUILDER_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, KEYFRAME_PLAN_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  return report;
}
