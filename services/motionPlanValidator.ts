import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { loadKeyframePlan } from './keyframePlanBuilder.js';
import {
  CAMERA_MOTION_CATEGORIES,
  CHARACTER_MOTION_CATEGORIES,
  EMOTION_MOTION_CATEGORIES,
  ENVIRONMENT_MOTION_CATEGORIES,
  MOTION_PLAN_PHASE,
  MOTION_PLAN_REGISTRY_PATH,
  type MotionPlan,
} from './motionPlanBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOTION_PLAN_PASS_VERDICT = 'PASS_MOTION_PLAN_BUILDER_V1' as const;
export const MOTION_PLAN_FAIL_VERDICT = 'FAIL_MOTION_PLAN_BUILDER_V1' as const;
export const MOTION_PLAN_REPORT_PATH = 'reports/motion-plan-builder-report.json' as const;
export const MOTION_PLAN_SCHEMA_PATH = 'datasets/motion_plan/motion-plan.schema.json' as const;

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type MotionPlanValidationResult = {
  motion_plan_id: string;
  valid: boolean;
  issues: ValidationIssue[];
};

export type MotionPlanBuilderReport = {
  builder_id: string;
  phase: typeof MOTION_PLAN_PHASE;
  timestamp: string;
  motion_plan_count: number;
  segment_count: number;
  continuity_validation: 'PASS' | 'FAIL';
  identity_validation: 'PASS' | 'FAIL';
  camera_validation: 'PASS' | 'FAIL';
  environment_validation: 'PASS' | 'FAIL';
  plan_validations: MotionPlanValidationResult[];
  issues: ValidationIssue[];
  gpu_execution: false;
  planning_only: true;
  final_verdict: typeof MOTION_PLAN_PASS_VERDICT | typeof MOTION_PLAN_FAIL_VERDICT;
};

function validateSourceExists(projectRoot: string, plan: MotionPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const keyframePlan = loadKeyframePlan(projectRoot, plan.source_keyframe_plan_id);

  if (!keyframePlan) {
    issues.push({
      code: 'MISSING_SOURCE_KEYFRAME_PLAN',
      message: `source_keyframe_plan_id not found: ${plan.source_keyframe_plan_id}`,
      severity: 'error',
      field: 'source_keyframe_plan_id',
    });
    return issues;
  }

  if (keyframePlan.source_video_shot_state_id !== plan.source_video_shot_state_id) {
    issues.push({
      code: 'SOURCE_MISMATCH',
      message: 'source_video_shot_state_id does not match keyframe plan',
      severity: 'error',
      field: 'source_video_shot_state_id',
    });
  }

  const expectedSegments = keyframePlan.keyframes.length - 1;
  if (plan.motion_segments.length !== expectedSegments) {
    issues.push({
      code: 'SEGMENT_COUNT_MISMATCH',
      message: `Expected ${expectedSegments} segments, got ${plan.motion_segments.length}`,
      severity: 'error',
      field: 'motion_segments',
    });
  }

  return issues;
}

function validateSegmentContinuity(
  projectRoot: string,
  plan: MotionPlan
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const keyframePlan = loadKeyframePlan(projectRoot, plan.source_keyframe_plan_id);
  if (!keyframePlan) return issues;

  for (const segment of plan.motion_segments) {
    const fromKf = keyframePlan.keyframes[segment.from_keyframe];
    const toKf = keyframePlan.keyframes[segment.to_keyframe];

    if (!fromKf || !toKf) {
      issues.push({
        code: 'SEGMENT_CONTINUITY_BREAK',
        message: `Segment ${segment.segment_id} references missing keyframe indices`,
        severity: 'error',
        field: segment.segment_id,
      });
      continue;
    }

    if (segment.to_keyframe !== segment.from_keyframe + 1) {
      issues.push({
        code: 'SEGMENT_CONTINUITY_BREAK',
        message: `Segment ${segment.segment_id} must connect consecutive keyframes`,
        severity: 'error',
        field: segment.segment_id,
      });
    }

    const expectedDuration = Math.round((toKf.timestamp - fromKf.timestamp) * 1000) / 1000;
    if (Math.abs(segment.duration_seconds - expectedDuration) > 0.01) {
      issues.push({
        code: 'SEGMENT_CONTINUITY_BREAK',
        message: `Segment ${segment.segment_id} duration ${segment.duration_seconds} expected ${expectedDuration}`,
        severity: 'error',
        field: `${segment.segment_id}.duration_seconds`,
      });
    }
  }

  return issues;
}

function validateIdentityPreservation(
  projectRoot: string,
  plan: MotionPlan
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const keyframePlan = loadKeyframePlan(projectRoot, plan.source_keyframe_plan_id);
  if (!keyframePlan) return issues;

  const baseline = keyframePlan.keyframes[0]?.continuity_locks.identity_locks ?? [];

  for (const segment of plan.motion_segments) {
    if (!segment.camera_motion.identity_safe) {
      issues.push({
        code: 'IDENTITY_VIOLATION',
        message: `Segment ${segment.segment_id} camera_motion.identity_safe must be true`,
        severity: 'error',
        field: `${segment.segment_id}.camera_motion`,
      });
    }

    for (const charMotion of segment.character_motion) {
      if (!charMotion.identity_lock_preserved) {
        issues.push({
          code: 'IDENTITY_VIOLATION',
          message: `Segment ${segment.segment_id} character ${charMotion.character_id} identity lock not preserved`,
          severity: 'error',
          field: `${segment.segment_id}.character_motion`,
        });
      }
    }

    const identityMatch =
      JSON.stringify(segment.continuity_locks.identity_locks) === JSON.stringify(baseline);
    if (!identityMatch) {
      issues.push({
        code: 'IDENTITY_VIOLATION',
        message: `Segment ${segment.segment_id} identity_locks differ from keyframe baseline`,
        severity: 'error',
        field: `${segment.segment_id}.continuity_locks.identity_locks`,
      });
    }
  }

  return issues;
}

function validateLocationLockPreservation(
  projectRoot: string,
  plan: MotionPlan
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const keyframePlan = loadKeyframePlan(projectRoot, plan.source_keyframe_plan_id);
  if (!keyframePlan) return issues;

  const baselineLocation = keyframePlan.keyframes[0]?.continuity_locks.location_locks ?? [];

  for (const segment of plan.motion_segments) {
    if (!segment.environment_motion.location_lock_preserved) {
      issues.push({
        code: 'LOCATION_LOCK_VIOLATION',
        message: `Segment ${segment.segment_id} location_lock_preserved must be true`,
        severity: 'error',
        field: `${segment.segment_id}.environment_motion`,
      });
    }

    const locationMatch =
      JSON.stringify(segment.continuity_locks.location_locks) === JSON.stringify(baselineLocation);
    if (!locationMatch) {
      issues.push({
        code: 'LOCATION_LOCK_VIOLATION',
        message: `Segment ${segment.segment_id} location_locks changed`,
        severity: 'error',
        field: `${segment.segment_id}.continuity_locks.location_locks`,
      });
    }
  }

  return issues;
}

function validatePropLockPreservation(
  projectRoot: string,
  plan: MotionPlan
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const keyframePlan = loadKeyframePlan(projectRoot, plan.source_keyframe_plan_id);
  if (!keyframePlan) return issues;

  const baselineComposition =
    keyframePlan.keyframes[0]?.continuity_locks.composition_locks ?? [];
  const hasProps = baselineComposition.some((lock) => lock.startsWith('prop_anchor:'));

  for (const segment of plan.motion_segments) {
    if (hasProps && !segment.environment_motion.prop_lock_preserved) {
      issues.push({
        code: 'PROP_LOCK_VIOLATION',
        message: `Segment ${segment.segment_id} prop_lock_preserved must be true when props exist`,
        severity: 'error',
        field: `${segment.segment_id}.environment_motion.prop_lock_preserved`,
      });
    }

    if (hasProps) {
      const propLocks = segment.continuity_locks.composition_locks.filter((l) =>
        l.startsWith('prop_anchor:')
      );
      const baselinePropLocks = baselineComposition.filter((l) => l.startsWith('prop_anchor:'));
      if (JSON.stringify(propLocks) !== JSON.stringify(baselinePropLocks)) {
        issues.push({
          code: 'PROP_LOCK_VIOLATION',
          message: `Segment ${segment.segment_id} prop continuity locks changed`,
          severity: 'error',
          field: `${segment.segment_id}.continuity_locks.composition_locks`,
        });
      }
    }
  }

  return issues;
}

function validateCameraProgression(plan: MotionPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const segment of plan.motion_segments) {
    if (!CAMERA_MOTION_CATEGORIES.includes(segment.camera_motion.motion_category)) {
      issues.push({
        code: 'INVALID_CAMERA_MOTION',
        message: `Invalid camera motion category: ${segment.camera_motion.motion_category}`,
        severity: 'error',
        field: `${segment.segment_id}.camera_motion.motion_category`,
      });
    }

    if (segment.camera_motion.motion_progress_delta < 0) {
      issues.push({
        code: 'CAMERA_PROGRESSION_INVALID',
        message: `Segment ${segment.segment_id} negative motion_progress_delta`,
        severity: 'error',
        field: `${segment.segment_id}.camera_motion`,
      });
    }
  }

  const totalDelta = plan.motion_segments.reduce(
    (sum, s) => sum + s.camera_motion.motion_progress_delta,
    0
  );
  if (Math.abs(totalDelta - 1) > 0.05) {
    issues.push({
      code: 'CAMERA_PROGRESSION_INVALID',
      message: `Total camera motion_progress_delta ${totalDelta} expected ~1.0`,
      severity: 'error',
      field: 'motion_segments',
    });
  }

  return issues;
}

function validateMotionConflicts(plan: MotionPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const segment of plan.motion_segments) {
    const camera = segment.camera_motion.motion_category;

    for (const charMotion of segment.character_motion) {
      if (charMotion.motion_category === 'walk' && camera === 'static') {
        issues.push({
          code: 'MOTION_CONFLICT',
          message: `Segment ${segment.segment_id}: walk with static camera requires dolly or pan`,
          severity: 'error',
          field: segment.segment_id,
        });
      }
      if (
        (charMotion.motion_category === 'sit' || charMotion.motion_category === 'idle') &&
        camera === 'orbit'
      ) {
        issues.push({
          code: 'MOTION_CONFLICT',
          message: `Segment ${segment.segment_id}: orbit camera conflicts with seated/idle character`,
          severity: 'error',
          field: segment.segment_id,
        });
      }
    }

    if (camera === 'push_in' && segment.camera_motion.speed === 'moderate' && segment.character_motion.some((c) => c.motion_category === 'walk')) {
      issues.push({
        code: 'MOTION_CONFLICT',
        message: `Segment ${segment.segment_id}: push_in + walk may violate composition lock`,
        severity: 'error',
        field: segment.segment_id,
      });
    }
  }

  return issues;
}

function validateMotionCategories(plan: MotionPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const segment of plan.motion_segments) {
    if (!EMOTION_MOTION_CATEGORIES.includes(segment.emotion_motion.motion_category)) {
      issues.push({
        code: 'INVALID_EMOTION_MOTION',
        message: `Invalid emotion motion category: ${segment.emotion_motion.motion_category}`,
        severity: 'error',
      });
    }
    if (!ENVIRONMENT_MOTION_CATEGORIES.includes(segment.environment_motion.motion_category)) {
      issues.push({
        code: 'INVALID_ENVIRONMENT_MOTION',
        message: `Invalid environment motion category: ${segment.environment_motion.motion_category}`,
        severity: 'error',
      });
    }
    for (const char of segment.character_motion) {
      if (!CHARACTER_MOTION_CATEGORIES.includes(char.motion_category)) {
        issues.push({
          code: 'INVALID_CHARACTER_MOTION',
          message: `Invalid character motion category: ${char.motion_category}`,
          severity: 'error',
        });
      }
    }
  }

  return issues;
}

function validateRegistry(projectRoot: string, plans: MotionPlan[]): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOTION_PLAN_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${MOTION_PLAN_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const registry = readJsonRecord(root, MOTION_PLAN_REGISTRY_PATH) as {
    motion_plans?: Array<{ motion_plan_id: string; plan_path: string }>;
  } | null;

  if (!registry?.motion_plans?.length) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing ${MOTION_PLAN_REGISTRY_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const builtIds = new Set(plans.map((p) => p.motion_plan_id));
  for (const entry of registry.motion_plans) {
    if (!builtIds.has(entry.motion_plan_id)) {
      issues.push({
        code: 'REGISTRY_ORPHAN',
        message: `Registry missing built plan: ${entry.motion_plan_id}`,
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

export function validateMotionPlan(
  projectRoot: string,
  plan: MotionPlan
): MotionPlanValidationResult {
  const issues = [
    ...validateSourceExists(projectRoot, plan),
    ...validateSegmentContinuity(projectRoot, plan),
    ...validateIdentityPreservation(projectRoot, plan),
    ...validateLocationLockPreservation(projectRoot, plan),
    ...validatePropLockPreservation(projectRoot, plan),
    ...validateCameraProgression(plan),
    ...validateMotionConflicts(plan),
    ...validateMotionCategories(plan),
  ];

  return {
    motion_plan_id: plan.motion_plan_id,
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

export function runMotionPlanBuilderValidation(
  projectRoot: string,
  plans: MotionPlan[]
): MotionPlanBuilderReport {
  const registryIssues = validateRegistry(projectRoot, plans);
  const plan_validations = plans.map((plan) => validateMotionPlan(projectRoot, plan));
  const issues = [...registryIssues, ...plan_validations.flatMap((v) => v.issues)];
  const errors = issues.filter((i) => i.severity === 'error');

  const continuityErrors = errors.filter((e) =>
    ['SEGMENT_CONTINUITY_BREAK', 'SEGMENT_COUNT_MISMATCH', 'PROP_LOCK_VIOLATION'].includes(e.code)
  );
  const identityErrors = errors.filter((e) => e.code === 'IDENTITY_VIOLATION');
  const cameraErrors = errors.filter((e) =>
    ['CAMERA_PROGRESSION_INVALID', 'INVALID_CAMERA_MOTION', 'MOTION_CONFLICT'].includes(e.code)
  );
  const environmentErrors = errors.filter((e) =>
    ['LOCATION_LOCK_VIOLATION', 'INVALID_ENVIRONMENT_MOTION'].includes(e.code)
  );

  const pass = errors.length === 0;

  return {
    builder_id: `motion_plan_builder_${Date.now().toString(36)}`,
    phase: MOTION_PLAN_PHASE,
    timestamp: new Date().toISOString(),
    motion_plan_count: plans.length,
    segment_count: plans.reduce((sum, p) => sum + p.motion_segments.length, 0),
    continuity_validation: continuityErrors.length === 0 ? 'PASS' : 'FAIL',
    identity_validation: identityErrors.length === 0 ? 'PASS' : 'FAIL',
    camera_validation: cameraErrors.length === 0 ? 'PASS' : 'FAIL',
    environment_validation: environmentErrors.length === 0 ? 'PASS' : 'FAIL',
    plan_validations,
    issues,
    gpu_execution: false,
    planning_only: true,
    final_verdict: pass ? MOTION_PLAN_PASS_VERDICT : MOTION_PLAN_FAIL_VERDICT,
  };
}

export function writeMotionPlanBuilderReport(
  projectRoot: string,
  plans: MotionPlan[]
): MotionPlanBuilderReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runMotionPlanBuilderValidation(root, plans);

  const payload = {
    ...report,
    report_type: 'motion_plan_builder_report',
    report_version: 'v1',
    export_path: MOTION_PLAN_REPORT_PATH,
    schema_path: MOTION_PLAN_SCHEMA_PATH,
    registry_path: MOTION_PLAN_REGISTRY_PATH,
    next_phase: 'PHASE-22 GPU_RENDER_PAYLOAD_PREPARATION_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, MOTION_PLAN_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  return report;
}
