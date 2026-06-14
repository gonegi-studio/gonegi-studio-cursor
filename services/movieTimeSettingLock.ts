import fs from 'node:fs';
import path from 'node:path';
import {
  copyCanonicalArtStyle,
  copyCanonicalCharacterFieldFromGraph,
  copyCanonicalTimeSetting,
} from './generationContextLoader.js';
import { ImageAppNativeImportSlot } from './movieMasterDatasetBinding.js';
import {
  evaluateCharacterDNAChecks,
  writeMovieCharacterDNALockReport,
} from './movieCharacterDNALock.js';
import { generateHardenedScenarioFromSpatialGraph } from './movieScenarioHardening.js';
import {
  MovieSpatialGraph,
  MovieSpatialGraphDataset,
  SPATIAL_GRAPH_OUTPUTS,
  loadAllMovieSpatialGraphDatasets,
} from './movieSpatialGraphBuilder.js';
import {
  MovieSpatialEngineDataset,
  MovieSpatialSceneRecord,
  loadAllMovieSpatialEngineDatasets,
} from './movieSpatialEngineBuilder.js';
import {
  TIME_SETTING_LIBRARY_PATH,
  loadTimeSettingLibrary,
} from './scenarioGenerator/scenario-generator-foundation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_TIMESETTING_LOCK_PHASE = 'PHASE-MOVIE-SPATIAL-013D' as const;
export const MOVIE_TIMESETTING_LOCK_SYSTEM_ID = 'MOVIE_TIMESETTING_LOCK_V1' as const;
export const MOVIE_TIMESETTING_LOCK_PASS_VERDICT = 'PASS_MOVIE_TIMESETTING_LOCK_V1' as const;
export const MOVIE_TIMESETTING_LOCK_FAIL_VERDICT = 'FAIL_MOVIE_TIMESETTING_LOCK_V1' as const;

export const MOVIE_TIMESETTING_LOCK_REPORT_PATH =
  'reports/movie_spatial/MOVIE_TIMESETTING_LOCK_REPORT.json' as const;
export const MOVIE_TIMESETTING_LOCK_SCHEMA_PATH =
  'datasets/movie_spatial/movie-image-app-native-import-v4.schema.json' as const;

export const NATIVE_IMPORT_V4_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'exports/movie_spatial/titanic-image-app-native-import-v4.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'exports/movie_spatial/spirited-away-image-app-native-import-v4.json',
  },
] as const;

export const TIME_SETTING_MARKER = '[TIME_SETTING]' as const;

export const TIME_SETTING_LOCK_FIELDS = [
  'time_id',
  'location_id',
  'lighting_id',
  'weather_id',
  'color_temperature',
  'atmosphere',
] as const;

export const FORBIDDEN_FREEFORM_TIMESETTING_PATTERNS = [
  /^Sunrise,/,
  /^Morning sunshine/,
  /^Warm golden hour/,
  /^Early afternoon light/,
  /^Twilight #/,
  /^Night #/,
] as const;

export interface TimeSettingLibraryEntryFull {
  time_setting_id: string;
  label: string;
  time_of_day: string;
  weather: string;
  light_color: string;
  shadow_color: string;
  atmosphere: string;
  surface_effect: string;
  movement_effect: string;
  recommended_locations: string[];
  scenario_usage_rule: string;
  raw_timeSetting: string;
}

export interface TimeSettingLockChecks {
  time_library_locked: boolean;
  location_id_present: boolean;
  lighting_id_present: boolean;
  weather_present: boolean;
  generated_time_setting: boolean;
}

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface TimeSettingSlotResult {
  scene_id: string;
  slot_index: number;
  time_setting_id: string;
  location_id: string;
  timeSetting_length: number;
  checks: TimeSettingLockChecks;
  time_lock_passed: boolean;
}

export interface MovieImageAppNativeImportV4Dataset {
  native_import_id: string;
  phase: typeof MOVIE_TIMESETTING_LOCK_PHASE;
  system_id: typeof MOVIE_TIMESETTING_LOCK_SYSTEM_ID;
  version: 'v4';
  movie_id: string;
  source_spatial_graph_ref: string;
  source_time_setting_library_ref: typeof TIME_SETTING_LIBRARY_PATH;
  generated_at: string;
  slot_count: number;
  time_setting_lock: true;
  time_setting_locked: boolean;
  environment_identity_locked: boolean;
  music_drama_import_ready: boolean;
  slots: ImageAppNativeImportSlot[];
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface MovieTimeSettingLockReport {
  report_id: string;
  phase: typeof MOVIE_TIMESETTING_LOCK_PHASE;
  system_id: typeof MOVIE_TIMESETTING_LOCK_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  time_setting_locked: boolean;
  environment_identity_locked: boolean;
  source_time_setting_library_ref: typeof TIME_SETTING_LIBRARY_PATH;
  upstream_character_dna_lock_verdict: string;
  checks: {
    time_library_locked: boolean;
    location_id_present: boolean;
    lighting_id_present: boolean;
    weather_present: boolean;
    generated_time_setting: boolean;
  };
  metrics: {
    movie_count: number;
    scene_count: number;
    locked_slot_count: number;
    average_timeSetting_length: number;
    time_lock_pass_rate: number;
    time_setting_library_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    output_path: string;
    slot_count: number;
    time_lock_pass_count: number;
  }>;
  slot_results_sample: TimeSettingSlotResult[];
  issues: ValidationIssue[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function refForMovie<T extends { movie_id: string; output_path: string }>(
  specs: readonly T[],
  movieId: string
): string {
  const spec = specs.find((entry) => entry.movie_id === movieId);
  if (!spec) throw new Error(`Missing ref spec for movie_id=${movieId}`);
  return spec.output_path;
}

function serializeLockValue(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function loadFullTimeSettingLibrary(root: string): TimeSettingLibraryEntryFull[] {
  const library = loadTimeSettingLibrary() as { items: TimeSettingLibraryEntryFull[] };
  if (!fs.existsSync(path.join(root, TIME_SETTING_LIBRARY_PATH))) {
    throw new Error(`Missing time setting library: ${TIME_SETTING_LIBRARY_PATH}`);
  }
  return library.items;
}

function findTimeSettingEntry(
  items: TimeSettingLibraryEntryFull[],
  timeSettingId: string
): TimeSettingLibraryEntryFull {
  const entry = items.find((item) => item.time_setting_id === timeSettingId);
  if (!entry) {
    throw new Error(`Missing time-setting-library entry for time_setting_id=${timeSettingId}`);
  }
  return entry;
}

export function resolveLockedTimeSettingId(graph: MovieSpatialGraph): string {
  const environment = graph.environment_nodes[0];
  const category = environment?.scene_category?.toLowerCase() ?? '';
  const envType = environment?.environment_type?.toLowerCase() ?? '';

  if (envType.includes('spirit') || category.includes('bath')) return 'deep_dawn_mist';
  if (
    envType.includes('luxury') ||
    category.includes('promenade') ||
    category.includes('staircase') ||
    category.includes('salon')
  ) {
    return 'warm_golden_hour';
  }
  if (category.includes('harbor') || category.includes('dock')) return 'morning_sunshine';
  if (envType.includes('work')) return 'windy_harbor_afternoon';
  return 'early_afternoon_breeze';
}

export function deriveLockedLocationId(
  graph: MovieSpatialGraph,
  entry: TimeSettingLibraryEntryFull
): string {
  const environment = graph.environment_nodes[0];
  const category = environment?.scene_category?.toLowerCase() ?? '';
  const envType = environment?.environment_type?.toLowerCase() ?? '';
  const recommended = entry.recommended_locations;

  const pick = (locationId: string): string | null =>
    recommended.includes(locationId) ? locationId : null;

  if (category.includes('harbor') || category.includes('dock') || envType.includes('harbor')) {
    return pick('harbor') ?? recommended[0];
  }
  if (
    envType.includes('luxury') ||
    envType.includes('interior') ||
    category.includes('salon') ||
    category.includes('staircase')
  ) {
    return pick('domestic') ?? recommended[0];
  }
  if (envType.includes('spirit') || category.includes('bath') || category.includes('wood')) {
    return pick('woodland') ?? recommended[0];
  }
  if (category.includes('promenade') || category.includes('village')) {
    return pick('village') ?? recommended[0];
  }

  return recommended[0] ?? 'harbor';
}

export function deriveLockedLightingId(entry: TimeSettingLibraryEntryFull): string {
  const shadowSuffix = entry.shadow_color
    ? `_shadow_${entry.shadow_color.replace('#', '')}`
    : '';
  return `${entry.time_of_day}_${entry.weather}_${entry.light_color.replace('#', '')}${shadowSuffix}`;
}

export function serializeLockedTimeSetting(
  graph: MovieSpatialGraph,
  entry: TimeSettingLibraryEntryFull,
  locationId: string
): string {
  const parts = [
    `time_id=${serializeLockValue(entry.time_setting_id)}`,
    `location_id=${serializeLockValue(locationId)}`,
    `lighting_id=${serializeLockValue(deriveLockedLightingId(entry))}`,
    `weather_id=${serializeLockValue(entry.weather)}`,
    `color_temperature=${serializeLockValue(entry.light_color)}`,
    `atmosphere=${serializeLockValue(entry.atmosphere)}`,
  ];
  return `${TIME_SETTING_MARKER} ${parts.join(' ')}`;
}

export function buildLockedTimeSettingFieldFromGraph(
  graph: MovieSpatialGraph,
  root?: string
): { value: string; timeSettingId: string; locationId: string; entry: TimeSettingLibraryEntryFull } {
  const projectRoot = root ?? resolveProjectRoot();
  const items = loadFullTimeSettingLibrary(projectRoot);
  const timeSettingId = resolveLockedTimeSettingId(graph);
  const entry = findTimeSettingEntry(items, timeSettingId);
  const locationId = deriveLockedLocationId(graph, entry);
  return {
    value: serializeLockedTimeSetting(graph, entry, locationId),
    timeSettingId,
    locationId,
    entry,
  };
}

export function detectFreeformTimeSetting(timeSetting: string): boolean {
  if (timeSetting.includes(TIME_SETTING_MARKER)) {
    return false;
  }
  return FORBIDDEN_FREEFORM_TIMESETTING_PATTERNS.some((pattern) => pattern.test(timeSetting));
}

export function evaluateTimeSettingLockChecks(
  graph: MovieSpatialGraph,
  timeSetting: string,
  root?: string
): TimeSettingLockChecks {
  const projectRoot = root ?? resolveProjectRoot();
  const timeSettingId = resolveLockedTimeSettingId(graph);
  const expected = copyCanonicalTimeSetting(timeSettingId, projectRoot);
  const generatedTimeSetting = detectFreeformTimeSetting(timeSetting);

  return {
    time_library_locked: timeSetting === expected,
    location_id_present: timeSetting.includes('location_id='),
    lighting_id_present: timeSetting.includes('lighting_id='),
    weather_present: timeSetting.includes('weather_id='),
    generated_time_setting: generatedTimeSetting,
  };
}

function buildNativeImportV4Slot(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  root: string
): ImageAppNativeImportSlot {
  const timeSettingId = resolveLockedTimeSettingId(graph);
  return {
    artStyle: copyCanonicalArtStyle(root),
    timeSetting: copyCanonicalTimeSetting(timeSettingId, root),
    scenario: generateHardenedScenarioFromSpatialGraph(graph, spatialScene),
    character: copyCanonicalCharacterFieldFromGraph(graph, root),
  };
}

function validateTimeSettingSlot(
  graph: MovieSpatialGraph,
  slot: ImageAppNativeImportSlot,
  root: string
): { issues: ValidationIssue[]; result: TimeSettingSlotResult } {
  const timeSettingId = resolveLockedTimeSettingId(graph);
  const expectedTimeSetting = copyCanonicalTimeSetting(timeSettingId, root);
  const checks = evaluateTimeSettingLockChecks(graph, slot.timeSetting, root);
  const issues: ValidationIssue[] = [];

  if (!checks.time_library_locked) {
    issues.push({
      code: 'TIME_LIBRARY_NOT_LOCKED',
      message: `${graph.scene_id}: timeSetting does not exactly match locked time-setting-library serialization`,
      severity: 'error',
    });
  }

  if (!checks.location_id_present) {
    issues.push({
      code: 'LOCATION_ID_MISSING',
      message: `${graph.scene_id}: location_id missing from timeSetting`,
      severity: 'error',
    });
  }

  if (!checks.lighting_id_present) {
    issues.push({
      code: 'LIGHTING_ID_MISSING',
      message: `${graph.scene_id}: lighting_id missing from timeSetting`,
      severity: 'error',
    });
  }

  if (!checks.weather_present) {
    issues.push({
      code: 'WEATHER_ID_MISSING',
      message: `${graph.scene_id}: weather_id missing from timeSetting`,
      severity: 'error',
    });
  }

  if (checks.generated_time_setting) {
    issues.push({
      code: 'GENERATED_TIME_SETTING_FORBIDDEN',
      message: `${graph.scene_id}: timeSetting uses forbidden generated or freeform serializer output`,
      severity: 'error',
    });
  }

  for (const field of TIME_SETTING_LOCK_FIELDS) {
    if (!slot.timeSetting.includes(`${field}=`)) {
      issues.push({
        code: 'TIME_SETTING_FIELD_MISSING',
        message: `${graph.scene_id}: timeSetting missing ${field}`,
        severity: 'error',
      });
    }
  }

  if (slot.timeSetting !== expectedTimeSetting) {
    issues.push({
      code: 'TIME_SETTING_EXACT_MISMATCH',
      message: `${graph.scene_id}: timeSetting exact mismatch against generation context copy`,
      severity: 'error',
    });
  }

  const locationMatch = expectedTimeSetting.match(/location_id=([^\s]+)/);
  const locationId = locationMatch?.[1] ?? 'unknown';

  const characterChecks = evaluateCharacterDNAChecks(graph, slot.character, root);
  if (!characterChecks.full_character_dna_present) {
    issues.push({
      code: 'UPSTREAM_CHARACTER_DNA_NOT_LOCKED',
      message: `${graph.scene_id}: character field is not DNA locked`,
      severity: 'error',
    });
  }

  return {
    issues,
    result: {
      scene_id: graph.scene_id,
      slot_index: 0,
      time_setting_id: timeSettingId,
      location_id: locationId,
      timeSetting_length: slot.timeSetting.length,
      checks,
      time_lock_passed: issues.every((issue) => issue.severity !== 'error'),
    },
  };
}

export function buildMovieImageAppNativeImportV4Dataset(
  graphDataset: MovieSpatialGraphDataset,
  engineDataset: MovieSpatialEngineDataset,
  root: string
): MovieImageAppNativeImportV4Dataset {
  const spatialSceneById = new Map(
    engineDataset.spatial_scenes.map((scene) => [scene.scene_id, scene])
  );
  const slots = graphDataset.spatial_graphs.map((graph) =>
    buildNativeImportV4Slot(
      graph,
      spatialSceneById.get(graph.scene_id) ?? null,
      root
    )
  );

  const slotResults = graphDataset.spatial_graphs.map((graph, index) =>
    validateTimeSettingSlot(graph, slots[index], root)
  );
  const allPassed = slotResults.every((entry) => entry.result.time_lock_passed);

  return {
    native_import_id: `${graphDataset.movie_id}-image-app-native-import-v4`,
    phase: MOVIE_TIMESETTING_LOCK_PHASE,
    system_id: MOVIE_TIMESETTING_LOCK_SYSTEM_ID,
    version: 'v4',
    movie_id: graphDataset.movie_id,
    source_spatial_graph_ref: refForMovie(SPATIAL_GRAPH_OUTPUTS, graphDataset.movie_id),
    source_time_setting_library_ref: TIME_SETTING_LIBRARY_PATH,
    generated_at: new Date().toISOString(),
    slot_count: slots.length,
    time_setting_lock: true,
    time_setting_locked: allPassed,
    environment_identity_locked: allPassed,
    music_drama_import_ready: slots.length > 0,
    slots,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function runMovieTimeSettingLockValidation(root: string): MovieTimeSettingLockReport {
  const characterDnaLockReport = writeMovieCharacterDNALockReport(root);
  const timeSettingLibrary = loadFullTimeSettingLibrary(root);
  const graphDatasets = loadAllMovieSpatialGraphDatasets(root);
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);

  const issues: ValidationIssue[] = [];
  const slotResults: TimeSettingSlotResult[] = [];
  const movieSummaries: MovieTimeSettingLockReport['movie_summaries'] = [];
  let totalTimeSettingLength = 0;
  let lockedSlotCount = 0;
  let timeLockPassCount = 0;

  for (const spec of NATIVE_IMPORT_V4_OUTPUTS) {
    const graphDataset = graphDatasets.find((entry) => entry.movie_id === spec.movie_id);
    const engineDataset = engineDatasets.find((entry) => entry.movie_id === spec.movie_id);
    if (!graphDataset || !engineDataset) {
      issues.push({
        code: 'SOURCE_DATASET_MISSING',
        message: `Missing spatial graph or engine dataset for movie_id=${spec.movie_id}`,
        severity: 'error',
      });
      continue;
    }

    const dataset = buildMovieImageAppNativeImportV4Dataset(
      graphDataset,
      engineDataset,
      root
    );
    writeJson(root, spec.output_path, dataset);

    let moviePassCount = 0;
    graphDataset.spatial_graphs.forEach((graph, index) => {
      const validation = validateTimeSettingSlot(graph, dataset.slots[index], root);
      issues.push(...validation.issues);
      slotResults.push({
        ...validation.result,
        scene_id: graph.scene_id,
        slot_index: index,
      });
      totalTimeSettingLength += dataset.slots[index].timeSetting.length;
      lockedSlotCount += 1;
      if (validation.result.time_lock_passed) {
        timeLockPassCount += 1;
        moviePassCount += 1;
      }
    });

    movieSummaries.push({
      movie_id: spec.movie_id,
      output_path: spec.output_path,
      slot_count: dataset.slot_count,
      time_lock_pass_count: moviePassCount,
    });

    if (!dataset.time_setting_locked || !dataset.environment_identity_locked) {
      issues.push({
        code: 'DATASET_TIME_LOCK_FLAG_FALSE',
        message: `${spec.output_path}: time_setting_locked or environment_identity_locked is false`,
        severity: 'error',
      });
    }
  }

  const aggregateChecks = {
    time_library_locked: slotResults.every((entry) => entry.checks.time_library_locked),
    location_id_present: slotResults.every((entry) => entry.checks.location_id_present),
    lighting_id_present: slotResults.every((entry) => entry.checks.lighting_id_present),
    weather_present: slotResults.every((entry) => entry.checks.weather_present),
    generated_time_setting: slotResults.some((entry) => entry.checks.generated_time_setting),
  };

  const errors = issues.filter((issue) => issue.severity === 'error');
  const timeLockPassRate =
    lockedSlotCount > 0 ? Math.round((timeLockPassCount / lockedSlotCount) * 10000) / 10000 : 0;
  const timeSettingLocked =
    timeLockPassCount === lockedSlotCount &&
    aggregateChecks.time_library_locked &&
    aggregateChecks.location_id_present &&
    aggregateChecks.lighting_id_present &&
    aggregateChecks.weather_present &&
    !aggregateChecks.generated_time_setting &&
    errors.length === 0;
  const environmentIdentityLocked = timeSettingLocked;

  const validationPassed =
    timeSettingLocked &&
    environmentIdentityLocked &&
    characterDnaLockReport.final_verdict.startsWith('PASS');

  return {
    report_id: `movie_timesetting_lock_report_${Date.now().toString(36)}`,
    phase: MOVIE_TIMESETTING_LOCK_PHASE,
    system_id: MOVIE_TIMESETTING_LOCK_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_TIMESETTING_LOCK_PASS_VERDICT
      : MOVIE_TIMESETTING_LOCK_FAIL_VERDICT,
    validation_passed: validationPassed,
    time_setting_locked: timeSettingLocked,
    environment_identity_locked: environmentIdentityLocked,
    source_time_setting_library_ref: TIME_SETTING_LIBRARY_PATH,
    upstream_character_dna_lock_verdict: characterDnaLockReport.final_verdict,
    checks: aggregateChecks,
    metrics: {
      movie_count: movieSummaries.length,
      scene_count: lockedSlotCount,
      locked_slot_count: lockedSlotCount,
      average_timeSetting_length:
        lockedSlotCount > 0
          ? Math.round((totalTimeSettingLength / lockedSlotCount) * 100) / 100
          : 0,
      time_lock_pass_rate: timeLockPassRate,
      time_setting_library_count: timeSettingLibrary.length,
    },
    movie_summaries: movieSummaries,
    slot_results_sample: slotResults.slice(0, 3),
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeMovieTimeSettingLockReport(projectRoot?: string): MovieTimeSettingLockReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runMovieTimeSettingLockValidation(root);
  writeJson(root, MOVIE_TIMESETTING_LOCK_REPORT_PATH, report);
  return report;
}

export function loadMovieImageAppNativeImportV4Dataset(
  root: string,
  movieId: string
): MovieImageAppNativeImportV4Dataset | null {
  const spec = NATIVE_IMPORT_V4_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieImageAppNativeImportV4Dataset;
}

export { SAFE_CREATE_POLICY };
