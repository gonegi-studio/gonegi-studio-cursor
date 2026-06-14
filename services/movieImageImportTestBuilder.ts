import fs from 'node:fs';
import path from 'node:path';
import {
  MOVIE_IMAGE_APP_EXPORT_PHASE,
  MOVIE_IMAGE_APP_EXPORT_SYSTEM_ID,
  MovieImageAppExportDataset,
  MovieImageAppSceneExport,
  loadMovieImageAppExportDataset,
} from './movieImageAppExportBuilder.js';
import { LEGACY_MOVIE_SPATIAL_EXPORT_ROOT } from './generationOutputPaths.js';
import { MOVIE_SPATIAL_ARCHIVE_DIR } from './generationOutputPaths.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_IMAGE_IMPORT_TEST_PHASE = 'PHASE-IMAGE-IMPORT-TEST-001' as const;
export const MOVIE_IMAGE_IMPORT_TEST_SYSTEM_ID = 'MOVIE_IMAGE_IMPORT_TEST_V1' as const;
export const MOVIE_IMAGE_IMPORT_TEST_PASS_VERDICT = 'PASS_IMAGE_IMPORT_TEST_PACKAGE_V1' as const;
export const MOVIE_IMAGE_IMPORT_TEST_FAIL_VERDICT = 'FAIL_IMAGE_IMPORT_TEST_PACKAGE_V1' as const;

export const MOVIE_IMAGE_IMPORT_TEST_SOURCE_PATH =
  `${LEGACY_MOVIE_SPATIAL_EXPORT_ROOT}/titanic-image-app-export.json` as const;
export const MOVIE_IMAGE_IMPORT_TEST_OUTPUT_DIR =
  `${MOVIE_SPATIAL_ARCHIVE_DIR}/import_tests` as const;
export const MOVIE_IMAGE_IMPORT_TEST_REPORT_PATH =
  'reports/movie_spatial/IMAGE_IMPORT_TEST_REPORT.json' as const;

export const MOVIE_IMAGE_IMPORT_TEST_OUTPUTS = [
  {
    test_id: 'single-scene',
    scene_count: 1,
    output_path: `${MOVIE_SPATIAL_ARCHIVE_DIR}/import_tests/titanic-import-test-single-scene.json`,
  },
  {
    test_id: '3-scenes',
    scene_count: 3,
    output_path: `${MOVIE_SPATIAL_ARCHIVE_DIR}/import_tests/titanic-import-test-3-scenes.json`,
  },
  {
    test_id: '10-scenes',
    scene_count: 10,
    output_path: `${MOVIE_SPATIAL_ARCHIVE_DIR}/import_tests/titanic-import-test-10-scenes.json`,
  },
] as const;

export const MOVIE_IMAGE_IMPORT_TEST_SCENARIO_ONLY_OUTPUT =
  `${MOVIE_SPATIAL_ARCHIVE_DIR}/import_tests/titanic-import-test-scenario-only.json` as const;

export interface MusicDramaScenarioOnlyPayload {
  artStyle: string;
  timeSetting: string;
  scenario: string;
  character: string;
}

export interface ImageImportTestPackageSummary {
  test_id: string;
  output_path: string;
  scene_count: number;
  file_size_bytes: number;
}

export interface ImageImportTestReport {
  report_id: string;
  phase: typeof MOVIE_IMAGE_IMPORT_TEST_PHASE;
  system_id: typeof MOVIE_IMAGE_IMPORT_TEST_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  source_export_path: typeof MOVIE_IMAGE_IMPORT_TEST_SOURCE_PATH;
  source_scene_count: number;
  metrics: {
    single_scene_size: number;
    three_scene_size: number;
    ten_scene_size: number;
    scenario_only_size: number;
  };
  packages: ImageImportTestPackageSummary[];
  scenario_only_path: typeof MOVIE_IMAGE_IMPORT_TEST_SCENARIO_ONLY_OUTPUT;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function fileSizeBytes(root: string, rel: string): number {
  return fs.statSync(path.join(root, rel)).size;
}

function buildScenarioOnlyPayload(scene: MovieImageAppSceneExport): MusicDramaScenarioOnlyPayload {
  return {
    artStyle: scene.artStyle,
    timeSetting: scene.timeSetting,
    scenario: scene.scenario,
    character: scene.character,
  };
}

function buildImportTestDataset(
  source: MovieImageAppExportDataset,
  sceneCount: number,
  testId: string
): MovieImageAppExportDataset {
  const sceneExports = source.scene_exports.slice(0, sceneCount);
  if (sceneExports.length !== sceneCount) {
    throw new Error(
      `Insufficient scenes in source export: requested ${sceneCount}, available ${source.scene_exports.length}`
    );
  }

  return {
    export_dataset_id: `titanic-import-test-${testId}-v1`,
    phase: source.phase,
    system_id: source.system_id,
    movie_id: source.movie_id,
    source_master_scenario_ref: source.source_master_scenario_ref,
    generated_at: new Date().toISOString(),
    scene_export_count: sceneExports.length,
    direct_generation_ready: sceneExports.every((entry) => entry.generation_ready),
    scene_exports: sceneExports,
    execution_flags: source.execution_flags,
  };
}

function validatePackages(
  root: string,
  source: MovieImageAppExportDataset,
  summaries: ImageImportTestPackageSummary[],
  scenarioOnly: MusicDramaScenarioOnlyPayload
): ImageImportTestReport['issues'] {
  const issues: ImageImportTestReport['issues'] = [];

  if (!fs.existsSync(path.join(root, MOVIE_IMAGE_IMPORT_TEST_SOURCE_PATH))) {
    issues.push({
      code: 'SOURCE_EXPORT_MISSING',
      message: `Source export not found: ${MOVIE_IMAGE_IMPORT_TEST_SOURCE_PATH}`,
      severity: 'error',
    });
  }

  for (const spec of MOVIE_IMAGE_IMPORT_TEST_OUTPUTS) {
    const summary = summaries.find((entry) => entry.test_id === spec.test_id);
    if (!summary) {
      issues.push({
        code: 'PACKAGE_SUMMARY_MISSING',
        message: `Missing summary for test_id=${spec.test_id}`,
        severity: 'error',
      });
      continue;
    }

    if (summary.scene_count !== spec.scene_count) {
      issues.push({
        code: 'PACKAGE_SCENE_COUNT_MISMATCH',
        message: `${spec.output_path}: expected ${spec.scene_count} scenes, got ${summary.scene_count}`,
        severity: 'error',
      });
    }

    if (summary.file_size_bytes <= 0) {
      issues.push({
        code: 'PACKAGE_FILE_EMPTY',
        message: `${spec.output_path}: file size must be > 0`,
        severity: 'error',
      });
    }

    const loaded = JSON.parse(
      fs.readFileSync(path.join(root, spec.output_path), 'utf8')
    ) as MovieImageAppExportDataset;

    if (loaded.scene_export_count !== spec.scene_count) {
      issues.push({
        code: 'DATASET_SCENE_EXPORT_COUNT_MISMATCH',
        message: `${spec.output_path}: scene_export_count=${loaded.scene_export_count}`,
        severity: 'error',
      });
    }

    if (loaded.scene_exports.length !== spec.scene_count) {
      issues.push({
        code: 'DATASET_SCENE_EXPORTS_LENGTH_MISMATCH',
        message: `${spec.output_path}: scene_exports.length=${loaded.scene_exports.length}`,
        severity: 'error',
      });
    }

    if (loaded.phase !== MOVIE_IMAGE_APP_EXPORT_PHASE) {
      issues.push({
        code: 'DATASET_PHASE_MISMATCH',
        message: `${spec.output_path}: phase=${loaded.phase}`,
        severity: 'error',
      });
    }

    if (loaded.system_id !== MOVIE_IMAGE_APP_EXPORT_SYSTEM_ID) {
      issues.push({
        code: 'DATASET_SYSTEM_ID_MISMATCH',
        message: `${spec.output_path}: system_id=${loaded.system_id}`,
        severity: 'error',
      });
    }
  }

  const firstScene = source.scene_exports[0];
  for (const field of ['artStyle', 'timeSetting', 'scenario', 'character'] as const) {
    if (scenarioOnly[field] !== firstScene[field]) {
      issues.push({
        code: 'SCENARIO_ONLY_FIELD_MISMATCH',
        message: `scenario-only ${field} does not match first source scene`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function buildMovieImageImportTestPackages(projectRoot?: string): {
  source: MovieImageAppExportDataset;
  packages: MovieImageAppExportDataset[];
  scenarioOnly: MusicDramaScenarioOnlyPayload;
} {
  const root = resolveProjectRoot(projectRoot);
  const source = loadMovieImageAppExportDataset(root, 'titanic');
  if (!source) {
    throw new Error(`Missing source export: ${MOVIE_IMAGE_IMPORT_TEST_SOURCE_PATH}`);
  }

  const packages = MOVIE_IMAGE_IMPORT_TEST_OUTPUTS.map((spec) =>
    buildImportTestDataset(source, spec.scene_count, spec.test_id)
  );
  const scenarioOnly = buildScenarioOnlyPayload(source.scene_exports[0]);

  return { source, packages, scenarioOnly };
}

export function writeMovieImageImportTestPackages(projectRoot?: string): ImageImportTestReport {
  const root = resolveProjectRoot(projectRoot);
  const { source, packages, scenarioOnly } = buildMovieImageImportTestPackages(root);

  const packageSummaries: ImageImportTestPackageSummary[] = [];

  for (let index = 0; index < MOVIE_IMAGE_IMPORT_TEST_OUTPUTS.length; index += 1) {
    const spec = MOVIE_IMAGE_IMPORT_TEST_OUTPUTS[index];
    writeJson(root, spec.output_path, packages[index]);
    packageSummaries.push({
      test_id: spec.test_id,
      output_path: spec.output_path,
      scene_count: spec.scene_count,
      file_size_bytes: fileSizeBytes(root, spec.output_path),
    });
  }

  writeJson(root, MOVIE_IMAGE_IMPORT_TEST_SCENARIO_ONLY_OUTPUT, scenarioOnly);
  const scenarioOnlySize = fileSizeBytes(root, MOVIE_IMAGE_IMPORT_TEST_SCENARIO_ONLY_OUTPUT);

  const issues = validatePackages(root, source, packageSummaries, scenarioOnly);
  const validationPassed = issues.every((issue) => issue.severity !== 'error');

  const report: ImageImportTestReport = {
    report_id: 'IMAGE-IMPORT-TEST-REPORT-V1',
    phase: MOVIE_IMAGE_IMPORT_TEST_PHASE,
    system_id: MOVIE_IMAGE_IMPORT_TEST_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_IMAGE_IMPORT_TEST_PASS_VERDICT
      : MOVIE_IMAGE_IMPORT_TEST_FAIL_VERDICT,
    validation_passed: validationPassed,
    source_export_path: MOVIE_IMAGE_IMPORT_TEST_SOURCE_PATH,
    source_scene_count: source.scene_export_count,
    metrics: {
      single_scene_size: packageSummaries.find((entry) => entry.test_id === 'single-scene')
        ?.file_size_bytes ?? 0,
      three_scene_size: packageSummaries.find((entry) => entry.test_id === '3-scenes')
        ?.file_size_bytes ?? 0,
      ten_scene_size: packageSummaries.find((entry) => entry.test_id === '10-scenes')
        ?.file_size_bytes ?? 0,
      scenario_only_size: scenarioOnlySize,
    },
    packages: packageSummaries,
    scenario_only_path: MOVIE_IMAGE_IMPORT_TEST_SCENARIO_ONLY_OUTPUT,
    issues,
  };

  writeJson(root, MOVIE_IMAGE_IMPORT_TEST_REPORT_PATH, report);
  return report;
}
