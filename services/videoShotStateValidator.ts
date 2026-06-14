import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import type { SceneState } from './sceneStateBuilder.js';
import {
  loadSceneState,
  SCENE_STATE_REGISTRY_PATH,
  VIDEO_SHOT_REGISTRY_PATH,
  VIDEO_SHOT_STATE_PHASE,
  type VideoShotState,
} from './videoShotStateBuilder.js';

export const VIDEO_SHOT_PASS_VERDICT = 'PASS_VIDEO_SHOT_STATE_PREPARATION_V1' as const;
export const VIDEO_SHOT_FAIL_VERDICT = 'FAIL_VIDEO_SHOT_STATE_PREPARATION_V1' as const;
export const VIDEO_SHOT_PREPARATION_REPORT_PATH =
  'reports/video-shot-state-preparation-report.json' as const;
export const VIDEO_SHOT_SCHEMA_PATH = 'datasets/video_state/video-shot-state.schema.json' as const;

const VALID_FPS = new Set([12, 24, 25, 30]);
const FORBIDDEN_MOTION_PATTERNS = [
  /must_show/i,
  /fail.?if.?ignored/i,
  /relocate/i,
  /swap.?landmark/i,
  /remove.?prop/i,
  /identity.?override/i,
  /face.?replace/i,
];

export type ValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
};

export type VideoShotValidationResult = {
  video_shot_state_id: string;
  valid: boolean;
  issues: ValidationIssue[];
};

export type VideoShotPreparationReport = {
  preparation_id: string;
  phase: typeof VIDEO_SHOT_STATE_PHASE;
  timestamp: string;
  video_state_count: number;
  source_scene_state_links: readonly {
    video_shot_state_id: string;
    source_scene_state_id: string;
    linked: boolean;
  }[];
  validation_result: 'PASS' | 'FAIL';
  motion_safety_result: 'PASS' | 'FAIL';
  continuity_lock_result: 'PASS' | 'FAIL';
  video_shot_validations: VideoShotValidationResult[];
  issues: ValidationIssue[];
  gpu_execution: false;
  preparation_only: true;
  final_verdict: typeof VIDEO_SHOT_PASS_VERDICT | typeof VIDEO_SHOT_FAIL_VERDICT;
};

function containsForbiddenMotion(text: string): boolean {
  return FORBIDDEN_MOTION_PATTERNS.some((pattern) => pattern.test(text));
}

function validateDurationAndTiming(state: VideoShotState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (state.duration_seconds <= 0 || state.duration_seconds > 120) {
    issues.push({
      code: 'INVALID_DURATION',
      message: `duration_seconds must be between 0 and 120, got ${state.duration_seconds}`,
      severity: 'error',
      field: 'duration_seconds',
    });
  }

  if (!VALID_FPS.has(state.fps_target)) {
    issues.push({
      code: 'INVALID_FPS',
      message: `fps_target must be one of 12, 24, 25, 30; got ${state.fps_target}`,
      severity: 'error',
      field: 'fps_target',
    });
  }

  const expectedMax = Math.round(state.duration_seconds * state.fps_target);
  if (state.keyframe_count < 2) {
    issues.push({
      code: 'INVALID_KEYFRAME_COUNT',
      message: 'keyframe_count must be at least 2',
      severity: 'error',
      field: 'keyframe_count',
    });
  } else if (state.keyframe_count > expectedMax) {
    issues.push({
      code: 'INVALID_KEYFRAME_COUNT',
      message: `keyframe_count ${state.keyframe_count} exceeds frame budget ${expectedMax}`,
      severity: 'error',
      field: 'keyframe_count',
    });
  }

  return issues;
}

function validateSourceSceneState(
  projectRoot: string,
  state: VideoShotState
): { issues: ValidationIssue[]; scene: SceneState | null } {
  const issues: ValidationIssue[] = [];
  const scene = loadSceneState(projectRoot, state.source_scene_state_id);

  if (!scene) {
    issues.push({
      code: 'MISSING_SOURCE_SCENE_STATE',
      message: `source_scene_state_id not found: ${state.source_scene_state_id}`,
      severity: 'error',
      field: 'source_scene_state_id',
    });
    return { issues, scene: null };
  }

  if (scene.scene_state_id !== state.source_scene_state_id) {
    issues.push({
      code: 'SOURCE_SCENE_MISMATCH',
      message: 'Loaded scene state id does not match source_scene_state_id',
      severity: 'error',
      field: 'source_scene_state_id',
    });
  }

  return { issues, scene };
}

function validateMotionSafety(
  state: VideoShotState,
  scene: SceneState | null
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!state.camera_motion.identity_safe) {
    issues.push({
      code: 'IDENTITY_MOTION_VIOLATION',
      message: 'camera_motion.identity_safe must be true',
      severity: 'error',
      field: 'camera_motion.identity_safe',
    });
  }

  const cameraText = `${state.camera_motion.motion_type} ${state.camera_motion.path_description}`;
  if (containsForbiddenMotion(cameraText)) {
    issues.push({
      code: 'IDENTITY_MOTION_VIOLATION',
      message: 'camera_motion contains forbidden identity-overriding pattern',
      severity: 'error',
      field: 'camera_motion',
    });
  }

  for (const motion of state.character_motion) {
    if (!motion.identity_lock_preserved) {
      issues.push({
        code: 'IDENTITY_MOTION_VIOLATION',
        message: `character_motion for ${motion.character_id} must preserve identity lock`,
        severity: 'error',
        field: `character_motion.${motion.character_id}`,
      });
    }
    if (containsForbiddenMotion(`${motion.motion_type} ${motion.path_description}`)) {
      issues.push({
        code: 'IDENTITY_MOTION_VIOLATION',
        message: `character_motion for ${motion.character_id} contains forbidden pattern`,
        severity: 'error',
        field: `character_motion.${motion.character_id}`,
      });
    }
  }

  if (!state.environment_motion.location_lock_preserved) {
    issues.push({
      code: 'LOCATION_MOTION_VIOLATION',
      message: 'environment_motion.location_lock_preserved must be true',
      severity: 'error',
      field: 'environment_motion.location_lock_preserved',
    });
  }

  if (containsForbiddenMotion(state.environment_motion.path_description)) {
    issues.push({
      code: 'LOCATION_MOTION_VIOLATION',
      message: 'environment_motion violates location lock constraints',
      severity: 'error',
      field: 'environment_motion.path_description',
    });
  }

  if (scene) {
    for (const motion of state.character_motion) {
      if (motion.end_position && motion.start_position && motion.end_position !== motion.start_position) {
        const compositionLocked = scene.composition_state.character_positions[motion.character_id];
        if (compositionLocked && compositionLocked !== motion.start_position) {
          issues.push({
            code: 'COMPOSITION_MOTION_VIOLATION',
            message: `character_motion start_position conflicts with composition_state for ${motion.character_id}`,
            severity: 'error',
            field: `character_motion.${motion.character_id}`,
          });
        }
      }
    }

    for (const propId of scene.composition_state.prop_anchor_ids) {
      const lockPresent = state.continuity_locks.composition_locks.some((lock) =>
        lock.includes(propId)
      );
      if (!lockPresent) {
        issues.push({
          code: 'COMPOSITION_MOTION_VIOLATION',
          message: `continuity_locks missing prop_anchor:${propId}`,
          severity: 'error',
          field: 'continuity_locks.composition_locks',
        });
      }
    }
  }

  return issues;
}

function validateContinuityLocks(state: VideoShotState, scene: SceneState | null): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (state.continuity_locks.identity_locks.length === 0) {
    issues.push({
      code: 'CONTINUITY_LOCK_MISSING',
      message: 'identity_locks must not be empty',
      severity: 'error',
      field: 'continuity_locks.identity_locks',
    });
  }

  if (state.continuity_locks.location_locks.length === 0) {
    issues.push({
      code: 'CONTINUITY_LOCK_MISSING',
      message: 'location_locks must not be empty',
      severity: 'error',
      field: 'continuity_locks.location_locks',
    });
  }

  if (scene) {
    for (const characterId of scene.identity_state.protected_character_ids) {
      const covered = state.continuity_locks.identity_locks.some((lock) => lock.includes(characterId));
      if (!covered) {
        issues.push({
          code: 'CONTINUITY_LOCK_MISSING',
          message: `identity_locks missing protected character ${characterId}`,
          severity: 'error',
          field: 'continuity_locks.identity_locks',
        });
      }
    }

    const locationCovered = state.continuity_locks.location_locks.some((lock) =>
      lock.includes(scene.location_state.location_id)
    );
    if (!locationCovered) {
      issues.push({
        code: 'CONTINUITY_LOCK_MISSING',
        message: `location_locks missing location_id:${scene.location_state.location_id}`,
        severity: 'error',
        field: 'continuity_locks.location_locks',
      });
    }
  }

  return issues;
}

function validateRenderIntent(state: VideoShotState): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!state.render_intent.preparation_only || state.render_intent.gpu_execution) {
    issues.push({
      code: 'INVALID_RENDER_INTENT',
      message: 'render_intent must be preparation_only=true and gpu_execution=false',
      severity: 'error',
      field: 'render_intent',
    });
  }

  return issues;
}

export function validateVideoShotState(
  projectRoot: string,
  state: VideoShotState
): VideoShotValidationResult {
  const { issues: sourceIssues, scene } = validateSourceSceneState(projectRoot, state);
  const issues = [
    ...validateDurationAndTiming(state),
    ...sourceIssues,
    ...validateMotionSafety(state, scene),
    ...validateContinuityLocks(state, scene),
    ...validateRenderIntent(state),
  ];

  return {
    video_shot_state_id: state.video_shot_state_id,
    valid: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
  };
}

export function validateVideoShotRegistry(
  projectRoot: string,
  states: VideoShotState[]
): ValidationIssue[] {
  const root = resolveProjectRoot(projectRoot);
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, VIDEO_SHOT_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `Missing ${VIDEO_SHOT_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  const registry = readJsonRecord(root, VIDEO_SHOT_REGISTRY_PATH) as {
    video_shot_states?: Array<{ video_shot_state_id: string; state_path: string }>;
  } | null;

  if (!registry?.video_shot_states?.length) {
    issues.push({
      code: 'MISSING_REGISTRY',
      message: `Missing or empty ${VIDEO_SHOT_REGISTRY_PATH}`,
      severity: 'error',
    });
    return issues;
  }

  const builtIds = new Set(states.map((s) => s.video_shot_state_id));
  for (const entry of registry.video_shot_states) {
    if (!builtIds.has(entry.video_shot_state_id)) {
      issues.push({
        code: 'REGISTRY_ORPHAN',
        message: `Registry entry missing built video shot state: ${entry.video_shot_state_id}`,
        severity: 'error',
      });
    }
    if (!fs.existsSync(path.join(root, entry.state_path))) {
      issues.push({
        code: 'MISSING_STATE_FILE',
        message: `Registry state_path missing: ${entry.state_path}`,
        severity: 'error',
      });
    }
  }

  const sceneRegistry = readJsonRecord(root, SCENE_STATE_REGISTRY_PATH);
  if (!sceneRegistry) {
    issues.push({
      code: 'MISSING_SCENE_REGISTRY',
      message: `Missing ${SCENE_STATE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  return issues;
}

export function runVideoShotPreparationValidation(
  projectRoot: string,
  states: VideoShotState[]
): VideoShotPreparationReport {
  const registryIssues = validateVideoShotRegistry(projectRoot, states);
  const video_shot_validations = states.map((state) =>
    validateVideoShotState(projectRoot, state)
  );

  const issues = [...registryIssues, ...video_shot_validations.flatMap((v) => v.issues)];
  const errors = issues.filter((i) => i.severity === 'error');

  const motionErrors = errors.filter((e) =>
    [
      'IDENTITY_MOTION_VIOLATION',
      'LOCATION_MOTION_VIOLATION',
      'COMPOSITION_MOTION_VIOLATION',
    ].includes(e.code)
  );
  const continuityErrors = errors.filter((e) => e.code === 'CONTINUITY_LOCK_MISSING');
  const validationErrors = errors.filter(
    (e) =>
      ![
        'IDENTITY_MOTION_VIOLATION',
        'LOCATION_MOTION_VIOLATION',
        'COMPOSITION_MOTION_VIOLATION',
        'CONTINUITY_LOCK_MISSING',
      ].includes(e.code)
  );

  const source_scene_state_links = states.map((state) => ({
    video_shot_state_id: state.video_shot_state_id,
    source_scene_state_id: state.source_scene_state_id,
    linked: loadSceneState(projectRoot, state.source_scene_state_id) !== null,
  }));

  const pass = errors.length === 0;

  return {
    preparation_id: `video_shot_prep_${Date.now().toString(36)}`,
    phase: VIDEO_SHOT_STATE_PHASE,
    timestamp: new Date().toISOString(),
    video_state_count: states.length,
    source_scene_state_links: Object.freeze(source_scene_state_links),
    validation_result: validationErrors.length === 0 ? 'PASS' : 'FAIL',
    motion_safety_result: motionErrors.length === 0 ? 'PASS' : 'FAIL',
    continuity_lock_result: continuityErrors.length === 0 ? 'PASS' : 'FAIL',
    video_shot_validations,
    issues,
    gpu_execution: false,
    preparation_only: true,
    final_verdict: pass ? VIDEO_SHOT_PASS_VERDICT : VIDEO_SHOT_FAIL_VERDICT,
  };
}

export function writeVideoShotPreparationReport(
  projectRoot: string,
  states: VideoShotState[]
): VideoShotPreparationReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runVideoShotPreparationValidation(root, states);

  const payload = {
    ...report,
    report_type: 'video_shot_state_preparation_report',
    report_version: 'v1',
    export_path: VIDEO_SHOT_PREPARATION_REPORT_PATH,
    schema_path: VIDEO_SHOT_SCHEMA_PATH,
    registry_path: VIDEO_SHOT_REGISTRY_PATH,
    next_phase: 'PHASE-20 KEYFRAME_PLAN_BUILDER_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_SHOT_PREPARATION_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  return report;
}
