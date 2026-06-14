export const GENERATION_OUTPUT_LOCK_PHASE = 'PHASE-PROJECT-GOVERNANCE-004' as const;
export const GENERATION_OUTPUT_LOCK_SYSTEM_ID = 'GENERATION_OUTPUT_LOCK_V1' as const;
export const GENERATION_OUTPUT_RULES_PATH =
  'project_governance/GENERATION_OUTPUT_RULES.json' as const;

export const MOVIE_SPATIAL_EXPORT_ROOT = 'exports/movie_spatial' as const;

export const LEGACY_MOVIE_SPATIAL_EXPORT_ROOT = 'legacy/exports/movie_spatial' as const;

export const MOVIE_SPATIAL_ACTIVE_DIR = `${MOVIE_SPATIAL_EXPORT_ROOT}/ACTIVE` as const;
export const MOVIE_SPATIAL_TEST_DIR = `${MOVIE_SPATIAL_EXPORT_ROOT}/TEST` as const;
export const MOVIE_SPATIAL_MANUAL_DIR = `${MOVIE_SPATIAL_EXPORT_ROOT}/MANUAL` as const;
export const MOVIE_SPATIAL_ARCHIVE_DIR = `${MOVIE_SPATIAL_EXPORT_ROOT}/ARCHIVE` as const;

export const MOVIE_SPATIAL_CONTROLLED_DIRS = [
  MOVIE_SPATIAL_ACTIVE_DIR,
  MOVIE_SPATIAL_TEST_DIR,
  MOVIE_SPATIAL_MANUAL_DIR,
  MOVIE_SPATIAL_ARCHIVE_DIR,
] as const;

export const NATIVE_IMPORT_V8_ACTIVE_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: `${MOVIE_SPATIAL_ACTIVE_DIR}/titanic-image-app-native-import-v8.json`,
  },
  {
    movie_id: 'spirited_away',
    output_path: `${MOVIE_SPATIAL_ACTIVE_DIR}/spirited-away-image-app-native-import-v8.json`,
  },
] as const;

export const IMAGE_APP_TEST_PACK_OUTPUTS = [
  {
    movie_id: 'titanic',
    scene_count: 1,
    output_path: `${MOVIE_SPATIAL_TEST_DIR}/titanic-test-1scene.json`,
  },
  {
    movie_id: 'titanic',
    scene_count: 3,
    output_path: `${MOVIE_SPATIAL_TEST_DIR}/titanic-test-3scene.json`,
  },
  {
    movie_id: 'spirited_away',
    scene_count: 1,
    output_path: `${MOVIE_SPATIAL_TEST_DIR}/spirited-away-test-1scene.json`,
  },
  {
    movie_id: 'spirited_away',
    scene_count: 3,
    output_path: `${MOVIE_SPATIAL_TEST_DIR}/spirited-away-test-3scene.json`,
  },
] as const;

export const REAL_IMAGE_APP_MANUAL_ASSETS = {
  scene_001: `${MOVIE_SPATIAL_MANUAL_DIR}/real_scene_001.png`,
  scene_002: `${MOVIE_SPATIAL_MANUAL_DIR}/real_scene_002.png`,
  scene_003: `${MOVIE_SPATIAL_MANUAL_DIR}/real_scene_003.png`,
  report: `${MOVIE_SPATIAL_MANUAL_DIR}/REAL_IMAGE_APP_MANUAL_REPORT.json`,
  intake: 'datasets/movie_spatial/image_app_manual/REAL_IMAGE_APP_MANUAL_INTAKE.json',
} as const;

export const IMAGE_APP_REAL_TEST_ARCHIVE_DIR =
  `${MOVIE_SPATIAL_ARCHIVE_DIR}/image_app_real_test` as const;

export const FORBIDDEN_IMAGE_APP_OUTPUT_PREFIXES = [
  'datasets/',
  'reports/movie_spatial/',
  'schemas/',
  'exports/image-app-',
  'exports/movie_replica/',
] as const;

export const REGISTERED_IMAGE_APP_EXPORT_PATHS = [
  ...NATIVE_IMPORT_V8_ACTIVE_OUTPUTS.map((spec) => spec.output_path),
  ...IMAGE_APP_TEST_PACK_OUTPUTS.map((spec) => spec.output_path),
  REAL_IMAGE_APP_MANUAL_ASSETS.scene_001,
  REAL_IMAGE_APP_MANUAL_ASSETS.scene_002,
  REAL_IMAGE_APP_MANUAL_ASSETS.scene_003,
  REAL_IMAGE_APP_MANUAL_ASSETS.report,
] as const;

export function isUnderMovieSpatialExportRoot(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/');
  return normalized === MOVIE_SPATIAL_EXPORT_ROOT || normalized.startsWith(`${MOVIE_SPATIAL_EXPORT_ROOT}/`);
}

export function isControlledMovieSpatialPath(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/');
  return MOVIE_SPATIAL_CONTROLLED_DIRS.some(
    (dir) => normalized === dir || normalized.startsWith(`${dir}/`)
  );
}

export function isForbiddenImageAppOutputPath(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/');
  if (FORBIDDEN_IMAGE_APP_OUTPUT_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }
  if (isUnderMovieSpatialExportRoot(normalized) && !isControlledMovieSpatialPath(normalized)) {
    return true;
  }
  return false;
}
