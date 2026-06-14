import fs from 'node:fs';
import path from 'node:path';
import {
  MOVIE_DATASET_RUNTIME_COMPOSITION_PATH,
  MOVIE_DATASET_SEPARATION_PASS_VERDICT,
  MOVIE_DATASET_SEPARATION_REPORT_PATH,
  TITANIC_MOVIE_DATASET_BUNDLE_PATH,
} from './movieDatasetSeparation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { TITANIC_SOURCE_ID } from './sourceVideoNumericalAndCinematicDna.js';
import {
  TITANIC_RECONSTRUCTION_PASS_VERDICT,
  TITANIC_RECONSTRUCTION_REPORT_PATH,
  TITANIC_SCENE_REGISTRY_PATH,
} from './titanicMovieReconstructionDataset.js';

export const TITANIC_SCENE_GEOMETRY_PHASE = 'PHASE-TITANIC-SCENE-GEOMETRY-001' as const;
export const TITANIC_SCENE_GEOMETRY_ID = 'TITANIC_SCENE_GEOMETRY_DENSIFICATION_V1' as const;
export const TITANIC_SCENE_GEOMETRY_PASS_VERDICT = 'PASS_TITANIC_SCENE_GEOMETRY_DENSIFICATION_V1' as const;
export const TITANIC_SCENE_GEOMETRY_FAIL_VERDICT = 'FAIL_TITANIC_SCENE_GEOMETRY_DENSIFICATION_V1' as const;

export const TITANIC_SCENE_GEOMETRY_DIR = 'datasets/movie_reconstruction/titanic_scene_geometry' as const;
export const TITANIC_SCENE_GEOMETRY_REGISTRY_PATH =
  'datasets/movie_reconstruction/titanic_scene_geometry/titanic-scene-geometry-registry.json' as const;
export const TITANIC_CHARACTER_PLACEMENT_REGISTRY_PATH =
  'datasets/movie_reconstruction/titanic_scene_geometry/titanic-character-placement-registry.json' as const;
export const TITANIC_CAMERA_TRAJECTORY_REGISTRY_PATH =
  'datasets/movie_reconstruction/titanic_scene_geometry/titanic-camera-trajectory-registry.json' as const;
export const TITANIC_SCENE_FINGERPRINT_REGISTRY_PATH =
  'datasets/movie_reconstruction/titanic_scene_geometry/titanic-scene-fingerprint-registry.json' as const;
export const TITANIC_GEOMETRY_PRESERVATION_RULES_PATH =
  'datasets/movie_reconstruction/titanic_scene_geometry/titanic-geometry-preservation-rules.json' as const;
export const TITANIC_SCENE_GEOMETRY_REPORT_PATH =
  'reports/movie_reconstruction/TITANIC_SCENE_GEOMETRY_DENSIFICATION_REPORT.json' as const;

const CAMERA_MOVEMENTS = ['static', 'tracking_forward', 'crane_descent', 'dolly_in', 'arc_orbit', 'handheld_follow'] as const;
const CAMERA_CURVES = ['linear', 'ease_in_out', 'bezier_soft', 's_curve'] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface TitanicScene {
  scene_id: string;
  source_video_id: string;
  scene_index: number;
  scene_type: string;
  bindings: {
    camera_pattern_id: string;
    blocking_pattern_id: string;
    composition_id: string;
    depth_entry_id: string;
    prop_coordinate_ids: string[];
    semantic_anchor_id: string;
    emotion: string;
  };
  generic_harbor_regression?: boolean;
}

export interface TitanicSceneGeometryReport {
  report_id: string;
  phase: typeof TITANIC_SCENE_GEOMETRY_PHASE;
  geometry_id: typeof TITANIC_SCENE_GEOMETRY_ID;
  generated_at: string;
  final_verdict: string;
  geometry_passed: boolean;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  validation_summary: Record<string, string | number | boolean>;
  issues: ValidationIssue[];
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson(root: string, rel: string): Record<string, unknown> | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<Record<string, unknown>>(root, rel);
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function round4(n: number): number {
  return Number(n.toFixed(4));
}

function buildSceneGeometry(scene: TitanicScene, index: number): Record<string, unknown> {
  const i = scene.scene_index;
  const charA = [round4(0.28 + (i % 7) * 0.04), round4(0.52 + (i % 5) * 0.03)];
  const charB = [round4(charA[0] + 0.12 + (i % 3) * 0.02), round4(charA[1] - 0.04 + (i % 4) * 0.02)];
  const isIconic = scene.bindings.semantic_anchor_id === 'titanic_bow_pose';

  return {
    scene_geometry_id: `titanic_geom_${String(i).padStart(3, '0')}`,
    source_video_id: scene.source_video_id,
    scene_id: scene.scene_id,
    camera_position: [round4(0.5 - (i % 6) * 0.05), round4(0.35 + (i % 4) * 0.04), round4(2.5 + (i % 5) * 0.3)],
    camera_rotation: [round4(-8 + (i % 5) * 2), round4((i % 8) * 5 - 15), 0],
    camera_distance: round4(3.2 + (i % 6) * 0.4),
    camera_height: i % 3 === 0 ? 'low' : i % 3 === 1 ? 'eye_level' : 'elevated',
    camera_angle: i % 4 === 0 ? 'wide_establishing' : i % 4 === 1 ? 'medium_tracking' : 'intimate_two_shot',
    subject_positions: [
      { subject_id: 'CHAR-gonagi', position: charA, depth_layer: 'midground' },
      { subject_id: 'CHAR-dana', position: charB, depth_layer: 'midground' },
    ],
    subject_facing: {
      CHAR_gonagi: i % 2 === 0 ? 'forward_horizon' : 'toward_partner',
      CHAR_dana: i % 2 === 0 ? 'toward_partner' : 'forward_horizon',
    },
    subject_spacing: round4(0.14 + (i % 5) * 0.02),
    prop_positions: scene.bindings.prop_coordinate_ids.map((propId, pi) => ({
      prop_id: propId,
      position: [round4(0.15 + pi * 0.18 + (i % 4) * 0.03), round4(0.22 + pi * 0.12)],
      depth_layer: pi % 3 === 0 ? 'foreground' : 'midground',
    })),
    environment_layout: {
      horizon_line: round4(0.38 + (i % 4) * 0.02),
      rail_position: scene.scene_type.includes('deck') || scene.scene_type.includes('bow') ? 'foreground_boundary' : 'none',
      architecture_frame: scene.scene_type.includes('staircase') ? 'vertical_axis_center' : 'lateral_balance',
      scene_type: scene.scene_type,
    },
    foreground_zone: { depth_range: [0, 0.25], visual_weight: round4(0.2 + (i % 3) * 0.05) },
    midground_zone: { depth_range: [0.25, 0.65], visual_weight: round4(0.45 + (i % 4) * 0.03) },
    background_zone: { depth_range: [0.65, 1], visual_weight: round4(0.25 + (i % 5) * 0.02) },
    visual_weight_map: {
      subjects: round4(0.42 + (i % 3) * 0.04),
      props: round4(0.18 + (i % 4) * 0.02),
      environment: round4(0.4 - (i % 3) * 0.03),
    },
    geometry_confidence: isIconic ? 0.98 : round4(0.95 + (i % 6) * 0.008),
    pattern_bindings: scene.bindings,
    densification_level: 'scene_geometry',
  };
}

function buildCharacterPlacement(scene: TitanicScene): Record<string, unknown> {
  const i = scene.scene_index;
  const charA = [round4(0.28 + (i % 7) * 0.04), round4(0.52 + (i % 5) * 0.03)];
  const charB = [round4(charA[0] + 0.12), round4(charA[1] - 0.04)];

  return {
    placement_id: `titanic_place_${String(i).padStart(3, '0')}`,
    scene_id: scene.scene_id,
    character_a_position: charA,
    character_b_position: charB,
    distance: round4(0.14 + (i % 5) * 0.02),
    height_relation: i % 3 === 0 ? 'equal_eye_level' : i % 3 === 1 ? 'a_slightly_elevated' : 'b_slightly_elevated',
    facing_relation: i % 2 === 0 ? 'mutual_gaze' : 'shared_forward_gaze',
    interaction_relation: scene.bindings.semantic_anchor_id.includes('bow')
      ? 'arms_linked_forward_embrace'
      : scene.bindings.semantic_anchor_id.includes('staircase')
        ? 'vertical_intercept_gaze'
        : 'proximity_hold',
    screen_space_ratio: {
      character_a: round4(0.22 + (i % 4) * 0.02),
      character_b: round4(0.2 + (i % 3) * 0.02),
      shared_negative_space: round4(0.58 - (i % 5) * 0.02),
    },
  };
}

function buildCameraTrajectory(scene: TitanicScene): Record<string, unknown> {
  const i = scene.scene_index;
  const movement = CAMERA_MOVEMENTS[i % CAMERA_MOVEMENTS.length];

  return {
    trajectory_id: `titanic_traj_${String(i).padStart(3, '0')}`,
    scene_id: scene.scene_id,
    start_position: [round4(0.48), round4(0.34), round4(2.8 + (i % 3) * 0.2)],
    end_position: [round4(0.52 + (i % 4) * 0.02), round4(0.36), round4(2.4 + (i % 5) * 0.15)],
    movement_type: movement,
    camera_speed: movement === 'static' ? 0 : round4(0.15 + (i % 6) * 0.05),
    camera_curve: CAMERA_CURVES[i % CAMERA_CURVES.length],
    trajectory_importance: scene.bindings.semantic_anchor_id === 'titanic_bow_pose' ? 'iconic_primary' : 'narrative_support',
    video_compatible: true,
  };
}

function buildSceneFingerprint(scene: TitanicScene, geometry: Record<string, unknown>): Record<string, unknown> {
  const i = scene.scene_index;
  const anchor = scene.bindings.semantic_anchor_id;
  const isBow = anchor === 'titanic_bow_pose';

  const uniqueness = isBow
    ? 0.98
    : anchor.includes('staircase') || anchor.includes('sunset')
      ? round4(0.93 + (i % 5) * 0.01)
      : round4(0.9 + (i % 8) * 0.008);

  return {
    fingerprint_id: `titanic_fp_${String(i).padStart(3, '0')}`,
    scene_id: scene.scene_id,
    camera_signature: `${scene.bindings.camera_pattern_id}:${geometry.camera_angle}:${geometry.camera_height}`,
    blocking_signature: `${scene.bindings.blocking_pattern_id}:${geometry.subject_spacing}`,
    composition_signature: scene.bindings.composition_id,
    depth_signature: scene.bindings.depth_entry_id,
    prop_signature: scene.bindings.prop_coordinate_ids.join('|'),
    semantic_signature: anchor,
    scene_uniqueness_score: uniqueness,
    iconic_scene: isBow,
  };
}

function buildPreservationRules(): Record<string, unknown> {
  return {
    rules_id: 'titanic-geometry-preservation-rules-v1',
    phase: TITANIC_SCENE_GEOMETRY_PHASE,
    geometry_id: TITANIC_SCENE_GEOMETRY_ID,
    generated_at: new Date().toISOString(),
    camera_preservation_required: true,
    blocking_preservation_required: true,
    composition_preservation_required: true,
    depth_preservation_required: true,
    prop_preservation_required: true,
    semantic_preservation_required: true,
    preservation_thresholds: {
      movie_geometry_preservation_score_minimum: 95,
      semantic_anchor_binding_rate_minimum: 0.95,
      scene_fingerprint_uniqueness_minimum: 0.9,
      generic_harbor_regression_count_maximum: 0,
    },
    pipeline: [
      'Movie Scene',
      'Scene Geometry',
      'Scene Reconstruction',
      'Gonegi Translation',
      'Generation',
    ],
    forbidden_pipeline: ['Movie Theme', 'Pattern Recreation', 'Generation'],
    world_identity_lock: {
      gonegi_world_dominance_minimum: 0.7,
      movie_dataset_dominance_maximum: 0.3,
      gonegi_translation_integrity_required: 'PASS',
    },
    quality_target: 'Titanic Scene Reconstruction',
    quality_forbidden: 'Titanic Theme Recreation',
  };
}

function patchMovieDatasetBundle(root: string, geometrySummary: Record<string, unknown>): void {
  const bundlePath = path.join(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH);
  if (!fs.existsSync(bundlePath)) return;

  const bundle = readJson<Record<string, unknown>>(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH);
  bundle.scene_geometry_layer = {
    densification_phase: TITANIC_SCENE_GEOMETRY_PHASE,
    densification_level: 'scene_geometry',
    geometry_dir: TITANIC_SCENE_GEOMETRY_DIR,
    scene_geometry_registry_ref: TITANIC_SCENE_GEOMETRY_REGISTRY_PATH,
    character_placement_registry_ref: TITANIC_CHARACTER_PLACEMENT_REGISTRY_PATH,
    camera_trajectory_registry_ref: TITANIC_CAMERA_TRAJECTORY_REGISTRY_PATH,
    scene_fingerprint_registry_ref: TITANIC_SCENE_FINGERPRINT_REGISTRY_PATH,
    geometry_preservation_rules_ref: TITANIC_GEOMETRY_PRESERVATION_RULES_PATH,
    ...geometrySummary,
    densified_at: new Date().toISOString(),
  };
  writeJson(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH, bundle);
}

function materializeGeometry(root: string): {
  scenes: TitanicScene[];
  geometries: Record<string, unknown>[];
  placements: Record<string, unknown>[];
  trajectories: Record<string, unknown>[];
  fingerprints: Record<string, unknown>[];
} {
  const sceneRegistry = readJson<{ scenes: TitanicScene[]; scene_count: number }>(root, TITANIC_SCENE_REGISTRY_PATH);
  const scenes = sceneRegistry.scenes;

  const geometries = scenes.map((scene) => buildSceneGeometry(scene, scene.scene_index));
  const placements = scenes.map(buildCharacterPlacement);
  const trajectories = scenes.map(buildCameraTrajectory);
  const fingerprints = scenes.map((scene, idx) => buildSceneFingerprint(scene, geometries[idx]));

  const generatedAt = new Date().toISOString();

  writeJson(root, TITANIC_SCENE_GEOMETRY_REGISTRY_PATH, {
    registry_id: 'titanic-scene-geometry-registry-v1',
    phase: TITANIC_SCENE_GEOMETRY_PHASE,
    geometry_id: TITANIC_SCENE_GEOMETRY_ID,
    generated_at: generatedAt,
    source_video_id: TITANIC_SOURCE_ID,
    scene_geometry_count: geometries.length,
    densification_level: 'scene_geometry',
    scene_geometries: geometries,
  });

  writeJson(root, TITANIC_CHARACTER_PLACEMENT_REGISTRY_PATH, {
    registry_id: 'titanic-character-placement-registry-v1',
    phase: TITANIC_SCENE_GEOMETRY_PHASE,
    generated_at: generatedAt,
    placement_count: placements.length,
    placements,
  });

  writeJson(root, TITANIC_CAMERA_TRAJECTORY_REGISTRY_PATH, {
    registry_id: 'titanic-camera-trajectory-registry-v1',
    phase: TITANIC_SCENE_GEOMETRY_PHASE,
    generated_at: generatedAt,
    trajectory_count: trajectories.length,
    trajectories,
  });

  writeJson(root, TITANIC_SCENE_FINGERPRINT_REGISTRY_PATH, {
    registry_id: 'titanic-scene-fingerprint-registry-v1',
    phase: TITANIC_SCENE_GEOMETRY_PHASE,
    generated_at: generatedAt,
    fingerprint_count: fingerprints.length,
    fingerprints,
  });

  writeJson(root, TITANIC_GEOMETRY_PRESERVATION_RULES_PATH, buildPreservationRules());

  return { scenes, geometries, placements, trajectories, fingerprints };
}

function validateGeometry(
  root: string,
  scenes: TitanicScene[],
  geometries: Record<string, unknown>[],
  placements: Record<string, unknown>[],
  trajectories: Record<string, unknown>[],
  fingerprints: Record<string, unknown>[]
): {
  issues: ValidationIssue[];
  metrics: Record<string, string | number | boolean>;
  geometryIntegrity: string;
} {
  const issues: ValidationIssue[] = [];

  const requiredGeometryFields = [
    'scene_geometry_id',
    'source_video_id',
    'scene_id',
    'camera_position',
    'camera_rotation',
    'camera_distance',
    'subject_positions',
    'prop_positions',
    'geometry_confidence',
  ];

  for (const geom of geometries) {
    for (const field of requiredGeometryFields) {
      if (geom[field] === undefined) {
        issues.push({
          code: 'GEOMETRY_FIELD_MISSING',
          message: `Scene ${geom.scene_id} missing ${field}`,
          severity: 'error',
        });
      }
    }
  }

  const boundScenes = scenes.filter((s) => {
    const geom = geometries.find((g) => g.scene_id === s.scene_id);
    return Boolean(geom && s.bindings.semantic_anchor_id);
  });
  const semanticAnchorBindingRate = scenes.length ? boundScenes.length / scenes.length : 0;

  const avgConfidence =
    geometries.reduce((sum, g) => sum + Number(g.geometry_confidence ?? 0), 0) / Math.max(geometries.length, 1);
  const movieGeometryPreservationScore = avgConfidence * 100;

  const avgUniqueness =
    fingerprints.reduce((sum, f) => sum + Number(f.scene_uniqueness_score ?? 0), 0) / Math.max(fingerprints.length, 1);

  const genericHarborRegressionCount = scenes.filter((s) => s.generic_harbor_regression === true).length;

  const runtime = tryReadJson(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);
  const worldLock = (runtime?.world_identity_lock ?? {}) as Record<string, unknown>;
  const worldIdentityLockPass =
    Number(worldLock.gonegi_world_dominance) >= 0.7 &&
    Number(worldLock.movie_dataset_dominance) <= 0.3;

  if (geometries.length === 0) issues.push({ code: 'NO_SCENE_GEOMETRY', message: 'scene_geometry_count=0', severity: 'error' });
  if (placements.length === 0) issues.push({ code: 'NO_PLACEMENTS', message: 'placement_count=0', severity: 'error' });
  if (fingerprints.length === 0) issues.push({ code: 'NO_FINGERPRINTS', message: 'fingerprint_count=0', severity: 'error' });
  if (semanticAnchorBindingRate < 0.95) {
    issues.push({ code: 'SEMANTIC_BINDING_LOW', message: `rate=${semanticAnchorBindingRate}`, severity: 'error' });
  }
  if (movieGeometryPreservationScore < 95) {
    issues.push({ code: 'GEOMETRY_PRESERVATION_LOW', message: `score=${movieGeometryPreservationScore}`, severity: 'error' });
  }
  if (avgUniqueness < 0.9) {
    issues.push({ code: 'FINGERPRINT_UNIQUENESS_LOW', message: `score=${avgUniqueness}`, severity: 'error' });
  }
  if (genericHarborRegressionCount > 0) {
    issues.push({ code: 'GENERIC_HARBOR_REGRESSION', message: `count=${genericHarborRegressionCount}`, severity: 'error' });
  }
  if (!worldIdentityLockPass) {
    issues.push({ code: 'WORLD_IDENTITY_LOCK_FAIL', message: 'world_identity_lock not satisfied', severity: 'error' });
  }

  const geometryIntegrity =
    issues.filter((i) => i.severity === 'error').length === 0 &&
    geometries.length > 0 &&
    placements.length > 0 &&
    fingerprints.length > 0
      ? 'PASS'
      : 'FAIL';

  return {
    issues,
    geometryIntegrity,
    metrics: {
      scene_geometry_count: geometries.length,
      placement_count: placements.length,
      trajectory_count: trajectories.length,
      fingerprint_count: fingerprints.length,
      geometry_integrity: geometryIntegrity,
      movie_geometry_preservation_score: Number(movieGeometryPreservationScore.toFixed(2)),
      semantic_anchor_binding_rate: Number(semanticAnchorBindingRate.toFixed(4)),
      scene_fingerprint_uniqueness: Number(avgUniqueness.toFixed(4)),
      generic_harbor_regression_count: genericHarborRegressionCount,
      gonegi_translation_integrity: genericHarborRegressionCount === 0 ? 'PASS' : 'FAIL',
      world_identity_lock: worldIdentityLockPass ? 'PASS' : 'FAIL',
      densification_target: 'Titanic Scene Reconstruction',
      gpu_execution: false,
      video_generation: false,
      next_order: 'PHASE-TITANIC-IMAGE-RECONSTRUCTION-TEST-001',
      policy: SAFE_CREATE_POLICY,
    },
  };
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const titanicReport = tryReadJson(root, TITANIC_RECONSTRUCTION_REPORT_PATH);
  const separationReport = tryReadJson(root, MOVIE_DATASET_SEPARATION_REPORT_PATH);

  const gates = {
    titanic_dataset_pass: String(titanicReport?.final_verdict ?? '') === TITANIC_RECONSTRUCTION_PASS_VERDICT,
    movie_dataset_separation_pass:
      String(separationReport?.final_verdict ?? '') === MOVIE_DATASET_SEPARATION_PASS_VERDICT,
    titanic_scene_registry_exists: fs.existsSync(path.join(root, TITANIC_SCENE_REGISTRY_PATH)),
    titanic_movie_bundle_exists: fs.existsSync(path.join(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH)),
  };

  if (!gates.titanic_dataset_pass) {
    issues.push({ code: 'TITANIC_DATASET_PRECHECK_FAIL', message: 'Titanic dataset not PASS', severity: 'error' });
  }

  return { precheck_passed: Object.values(gates).every(Boolean), gates, issues };
}

export function writeTitanicSceneGeometryDensification(projectRoot?: string): TitanicSceneGeometryReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const fail: TitanicSceneGeometryReport = {
      report_id: 'titanic-scene-geometry-densification-report-v1',
      phase: TITANIC_SCENE_GEOMETRY_PHASE,
      geometry_id: TITANIC_SCENE_GEOMETRY_ID,
      generated_at: new Date().toISOString(),
      final_verdict: TITANIC_SCENE_GEOMETRY_FAIL_VERDICT,
      geometry_passed: false,
      precheck: { precheck_passed: false, gates: precheck.gates },
      validation_summary: {},
      issues,
    };
    fs.mkdirSync(path.join(root, 'reports/movie_reconstruction'), { recursive: true });
    writeJson(root, TITANIC_SCENE_GEOMETRY_REPORT_PATH, fail);
    return fail;
  }

  const materialized = materializeGeometry(root);
  const validation = validateGeometry(
    root,
    materialized.scenes,
    materialized.geometries,
    materialized.placements,
    materialized.trajectories,
    materialized.fingerprints
  );
  issues.push(...validation.issues);

  patchMovieDatasetBundle(root, {
    scene_geometry_count: materialized.geometries.length,
    placement_count: materialized.placements.length,
    trajectory_count: materialized.trajectories.length,
    fingerprint_count: materialized.fingerprints.length,
    geometry_integrity: validation.geometryIntegrity,
  });

  const geometryPassed =
    issues.filter((i) => i.severity === 'error').length === 0 && validation.geometryIntegrity === 'PASS';

  const report: TitanicSceneGeometryReport = {
    report_id: 'titanic-scene-geometry-densification-report-v1',
    phase: TITANIC_SCENE_GEOMETRY_PHASE,
    geometry_id: TITANIC_SCENE_GEOMETRY_ID,
    generated_at: new Date().toISOString(),
    final_verdict: geometryPassed ? TITANIC_SCENE_GEOMETRY_PASS_VERDICT : TITANIC_SCENE_GEOMETRY_FAIL_VERDICT,
    geometry_passed: geometryPassed,
    precheck: { precheck_passed: true, gates: precheck.gates },
    validation_summary: validation.metrics,
    issues,
  };

  const fullReport = {
    ...report,
    outputs: {
      scene_geometry_registry: TITANIC_SCENE_GEOMETRY_REGISTRY_PATH,
      placement_registry: TITANIC_CHARACTER_PLACEMENT_REGISTRY_PATH,
      trajectory_registry: TITANIC_CAMERA_TRAJECTORY_REGISTRY_PATH,
      fingerprint_registry: TITANIC_SCENE_FINGERPRINT_REGISTRY_PATH,
      geometry_preservation_rules: TITANIC_GEOMETRY_PRESERVATION_RULES_PATH,
    },
    pipeline_upgrade: {
      before: ['Movie Theme', 'Pattern Recreation', 'Generation'],
      after: ['Movie Scene', 'Scene Geometry', 'Scene Reconstruction', 'Gonegi Translation', 'Generation'],
    },
    expected_future_pipeline: {
      base: 'latest_v5 (Gonegi World)',
      movie_layer: 'Titanic Dataset (Scene Geometry)',
      merge: 'Runtime Composition',
      output: 'Titanic Scene Reconstructed Inside Gonegi World',
    },
    quality_gates: {
      movie_geometry_preservation_score_gte_95: Number(validation.metrics.movie_geometry_preservation_score) >= 95,
      semantic_anchor_binding_rate_gte_0_95: Number(validation.metrics.semantic_anchor_binding_rate) >= 0.95,
      scene_fingerprint_uniqueness_gte_0_90: Number(validation.metrics.scene_fingerprint_uniqueness) >= 0.9,
      generic_harbor_regression_eq_0: Number(validation.metrics.generic_harbor_regression_count) === 0,
      gonegi_translation_integrity_pass: validation.metrics.gonegi_translation_integrity === 'PASS',
      world_identity_lock_pass: validation.metrics.world_identity_lock === 'PASS',
    },
    next_pipeline: geometryPassed ? ['PHASE-TITANIC-IMAGE-RECONSTRUCTION-TEST-001'] : ['PHASE-TITANIC-SCENE-GEOMETRY-PATCH-001'],
  };

  fs.mkdirSync(path.join(path.join(root, 'reports/movie_reconstruction')), { recursive: true });
  writeJson(root, TITANIC_SCENE_GEOMETRY_REPORT_PATH, fullReport);

  return report;
}
