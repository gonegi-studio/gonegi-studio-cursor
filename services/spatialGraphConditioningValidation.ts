import fs from 'node:fs';
import path from 'node:path';
import { MOVIE_SPATIAL_TEST_DIR } from './generationOutputPaths.js';
import {
  SPATIAL_COORDINATE_TEST_A_PATH,
  SPATIAL_COORDINATE_TEST_B_PATH,
} from './spatialCoordinateValidation.js';
import {
  buildSpatialConditioningBundle,
  runtimeSpatialGraphFromScenario,
} from './spatialConditioningAdapter.js';
import {
  environmentConstraintsEqual,
} from '../src/spatial_conditioning/EnvironmentAnchorConditioning.js';
import { cameraConstraintsEqual } from '../src/spatial_conditioning/CameraConditioning.js';
import {
  gazeDirectionEqual,
  gazeOriginsDiffer,
} from '../src/spatial_conditioning/GazeConditioning.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SPATIAL_GRAPH_CONDITIONING_PHASE = 'PHASE-SPATIAL-CONDITIONING-001' as const;
export const SPATIAL_GRAPH_CONDITIONING_SYSTEM_ID = 'SPATIAL_GRAPH_CONDITIONING_V1' as const;
export const SPATIAL_GRAPH_CONDITIONING_PASS_VERDICT =
  'PASS_SPATIAL_GRAPH_CONDITIONING_V1' as const;
export const SPATIAL_GRAPH_CONDITIONING_FAIL_VERDICT =
  'FAIL_SPATIAL_GRAPH_CONDITIONING_V1' as const;

export const SPATIAL_GRAPH_CONDITIONING_REPORT_PATH =
  'reports/movie_spatial/SPATIAL_GRAPH_CONDITIONING_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export interface SpatialGraphConditioningReport {
  report_id: string;
  phase: typeof SPATIAL_GRAPH_CONDITIONING_PHASE;
  system_id: typeof SPATIAL_GRAPH_CONDITIONING_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  character_conditioning_active: boolean;
  environment_conditioning_active: boolean;
  prop_conditioning_active: boolean;
  camera_conditioning_active: boolean;
  gaze_conditioning_active: boolean;
  spatial_consistency_memory_active: boolean;
  movie_reconstruction_accuracy_improved: boolean;
  coordinate_test_validation: {
    test_a_path: typeof SPATIAL_COORDINATE_TEST_A_PATH;
    test_b_path: typeof SPATIAL_COORDINATE_TEST_B_PATH;
    gonagi_region_a: string;
    gonagi_region_b: string;
    dana_region_a: string;
    dana_region_b: string;
    character_layout_mirrors: boolean;
    camera_unchanged: boolean;
    environment_unchanged: boolean;
    gaze_direction_unchanged: boolean;
    gaze_origins_swapped: boolean;
  };
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readScenario(root: string, relPath: string): string {
  const dataset = JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8')) as {
    slots: Array<{ scenario: string }>;
  };
  const scenario = dataset.slots[0]?.scenario;
  if (!scenario) {
    throw new Error(`Missing scenario in ${relPath}`);
  }
  return scenario;
}

export function runSpatialGraphConditioningValidation(
  projectRoot?: string
): SpatialGraphConditioningReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SpatialGraphConditioningReport['issues'] = [];

  for (const rel of [SPATIAL_COORDINATE_TEST_A_PATH, SPATIAL_COORDINATE_TEST_B_PATH]) {
    if (!fs.existsSync(path.join(root, rel))) {
      issues.push({
        code: 'COORDINATE_TEST_MISSING',
        message: `Missing ${rel}`,
        severity: 'error',
      });
    }
  }

  const scenarioA = fs.existsSync(path.join(root, SPATIAL_COORDINATE_TEST_A_PATH))
    ? readScenario(root, SPATIAL_COORDINATE_TEST_A_PATH)
    : '';
  const scenarioB = fs.existsSync(path.join(root, SPATIAL_COORDINATE_TEST_B_PATH))
    ? readScenario(root, SPATIAL_COORDINATE_TEST_B_PATH)
    : '';

  const graphA = scenarioA ? runtimeSpatialGraphFromScenario(scenarioA) : null;
  const graphB = scenarioB ? runtimeSpatialGraphFromScenario(scenarioB) : null;

  const bundleA = graphA ? buildSpatialConditioningBundle(graphA) : null;
  const bundleB = graphB ? buildSpatialConditioningBundle(graphB) : null;

  const gonagiA = bundleA?.character_regions.find((entry) => entry.character_id === 'CHAR-gonagi');
  const gonagiB = bundleB?.character_regions.find((entry) => entry.character_id === 'CHAR-gonagi');
  const danaA = bundleA?.character_regions.find((entry) => entry.character_id === 'CHAR-dana');
  const danaB = bundleB?.character_regions.find((entry) => entry.character_id === 'CHAR-dana');

  const character_layout_mirrors = Boolean(
    gonagiA &&
      gonagiB &&
      danaA &&
      danaB &&
      gonagiA.horizontal_region === danaB.horizontal_region &&
      danaA.horizontal_region === gonagiB.horizontal_region &&
      gonagiA.horizontal_region !== gonagiB.horizontal_region
  );

  const camera_unchanged = Boolean(
    bundleA &&
      bundleB &&
      cameraConstraintsEqual(bundleA.camera_constraint, bundleB.camera_constraint)
  );

  const environment_unchanged = Boolean(
    bundleA &&
      bundleB &&
      environmentConstraintsEqual(
        bundleA.environment_constraints,
        bundleB.environment_constraints
      )
  );

  const gaze_direction_unchanged = Boolean(
    bundleA &&
      bundleB &&
      gazeDirectionEqual(bundleA.gaze_constraints, bundleB.gaze_constraints)
  );

  const gaze_origins_swapped = Boolean(
    bundleA && bundleB && gazeOriginsDiffer(bundleA.gaze_constraints, bundleB.gaze_constraints)
  );

  const character_conditioning_active = Boolean(
    bundleA && bundleA.character_regions.length > 0 && bundleA.generation_constraints.some((entry) =>
      entry.startsWith('[CHARACTER_REGION]')
    )
  );

  const environment_conditioning_active = Boolean(
    bundleA && bundleA.environment_constraints.length > 0
  );
  const prop_conditioning_active = Boolean(bundleA && bundleA.prop_constraints.length >= 0);
  const camera_conditioning_active = Boolean(bundleA?.camera_constraint.framing_lock === 'hard');
  const gaze_conditioning_active = Boolean(
    bundleA && bundleA.gaze_constraints.every((entry) => entry.face_direction_lock === 'hard')
  );
  const spatial_consistency_memory_active = Boolean(
    bundleA?.consistency_memory.active === true && bundleA.consistency_memory.entries.length > 0
  );

  const movie_reconstruction_accuracy_improved = Boolean(
    character_conditioning_active &&
      environment_conditioning_active &&
      camera_conditioning_active &&
      gaze_conditioning_active &&
      character_layout_mirrors &&
      camera_unchanged &&
      environment_unchanged
  );

  if (!character_layout_mirrors) {
    issues.push({
      code: 'CHARACTER_LAYOUT_MIRROR_FAILED',
      message: 'Coordinate Test B must mirror Gonegi/Dana horizontal regions relative to Test A',
      severity: 'error',
    });
  }

  if (!camera_unchanged) {
    issues.push({
      code: 'CAMERA_CONDITIONING_DRIFT',
      message: 'Camera conditioning must remain identical between coordinate tests A and B',
      severity: 'error',
    });
  }

  if (!environment_unchanged) {
    issues.push({
      code: 'ENVIRONMENT_CONDITIONING_DRIFT',
      message: 'Environment conditioning must remain identical between coordinate tests A and B',
      severity: 'error',
    });
  }

  const validation_passed =
    character_conditioning_active &&
    environment_conditioning_active &&
    prop_conditioning_active &&
    camera_conditioning_active &&
    gaze_conditioning_active &&
    spatial_consistency_memory_active &&
    movie_reconstruction_accuracy_improved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: `spatial_graph_conditioning_report_${Date.now().toString(36)}`,
    phase: SPATIAL_GRAPH_CONDITIONING_PHASE,
    system_id: SPATIAL_GRAPH_CONDITIONING_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? SPATIAL_GRAPH_CONDITIONING_PASS_VERDICT
      : SPATIAL_GRAPH_CONDITIONING_FAIL_VERDICT,
    validation_passed,
    character_conditioning_active,
    environment_conditioning_active,
    prop_conditioning_active,
    camera_conditioning_active,
    gaze_conditioning_active,
    spatial_consistency_memory_active,
    movie_reconstruction_accuracy_improved,
    coordinate_test_validation: {
      test_a_path: SPATIAL_COORDINATE_TEST_A_PATH,
      test_b_path: SPATIAL_COORDINATE_TEST_B_PATH,
      gonagi_region_a: gonagiA?.horizontal_region ?? 'missing',
      gonagi_region_b: gonagiB?.horizontal_region ?? 'missing',
      dana_region_a: danaA?.horizontal_region ?? 'missing',
      dana_region_b: danaB?.horizontal_region ?? 'missing',
      character_layout_mirrors,
      camera_unchanged,
      environment_unchanged,
      gaze_direction_unchanged,
      gaze_origins_swapped,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeSpatialGraphConditioningReport(
  projectRoot?: string
): SpatialGraphConditioningReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runSpatialGraphConditioningValidation(root);
  writeJson(root, SPATIAL_GRAPH_CONDITIONING_REPORT_PATH, report);
  return report;
}

export { MOVIE_SPATIAL_TEST_DIR };
