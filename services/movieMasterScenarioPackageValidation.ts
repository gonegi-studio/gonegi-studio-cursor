import fs from 'node:fs';
import path from 'node:path';
import {
  ART_STYLE_REF,
  MASTER_SCENARIO_PACKAGE_OUTPUTS,
  MOVIE_MASTER_SCENARIO_PACKAGE_FAIL_VERDICT,
  MOVIE_MASTER_SCENARIO_PACKAGE_PASS_VERDICT,
  MOVIE_MASTER_SCENARIO_PACKAGE_PHASE,
  MOVIE_MASTER_SCENARIO_PACKAGE_REPORT_PATH,
  MOVIE_MASTER_SCENARIO_PACKAGE_SCHEMA_PATH,
  MOVIE_MASTER_SCENARIO_PACKAGE_SYSTEM_ID,
  MasterScenarioScenePackage,
  MovieMasterScenarioPackageDataset,
  REQUIRED_IMAGE_APP_PAYLOAD_FIELDS,
  loadAllMovieMasterScenarioPackageDatasets,
  writeMovieMasterScenarioPackages,
} from './movieMasterScenarioPackageBuilder.js';
import { MOVIE_SPATIAL_DIR } from './movieSpatialEngineBuilder.js';
import { MOVIE_SPATIAL_GRAPH_PASS_VERDICT } from './movieSpatialGraphBuilder.js';
import { writeMovieSpatialGraphReport } from './movieSpatialGraphValidation.js';
import { CHARACTER_SIMPLE_LIBRARY_PATH, TIME_SETTING_LIBRARY_PATH } from './scenarioGenerator/scenario-generator-foundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_MASTER_SCENARIO_PACKAGE_VALIDATION_PHASE =
  'PHASE-MOVIE-MASTER-SCENARIO-PACKAGE-VALIDATION-001' as const;
export const MOVIE_MASTER_SCENARIO_PACKAGE_VALIDATION_ID =
  'MOVIE_MASTER_SCENARIO_PACKAGE_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

const MASTER_SCENARIO_IMAGE_APP_FIELDS = [
  'version',
  'artStyle',
  'timeSetting',
  'scenario',
  'character',
  ...REQUIRED_IMAGE_APP_PAYLOAD_FIELDS,
  'spatial_context',
] as const;

export interface MovieMasterScenarioPackageReport {
  report_id: string;
  phase: typeof MOVIE_MASTER_SCENARIO_PACKAGE_PHASE;
  validation_phase: typeof MOVIE_MASTER_SCENARIO_PACKAGE_VALIDATION_PHASE;
  system_id: typeof MOVIE_MASTER_SCENARIO_PACKAGE_SYSTEM_ID;
  validation_id: typeof MOVIE_MASTER_SCENARIO_PACKAGE_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  master_package_created: boolean;
  image_app_direct_input_ready: boolean;
  art_style_present: boolean;
  time_setting_present: boolean;
  character_profiles_present: boolean;
  serialized_scenario_present: boolean;
  master_scenario_present: boolean;
  generation_ready: boolean;
  status: string;
  upstream_spatial_graph_verdict: string;
  metrics: {
    movie_count: number;
    scene_count: number;
    master_package_count: number;
    generation_ready_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    package_dataset_id: string;
    scene_count: number;
    generation_ready_count: number;
  }>;
  issues: ValidationIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateScenePackage(scenePackage: MasterScenarioScenePackage): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${scenePackage.movie_id}/${scenePackage.scene_id}`;

  if (!hasNonEmptyString(scenePackage.art_style_ref)) {
    issues.push({ code: 'ART_STYLE_REF_MISSING', message: `${prefix}: art_style_ref missing`, severity: 'error' });
  }

  if (!hasNonEmptyString(scenePackage.time_setting_ref)) {
    issues.push({
      code: 'TIME_SETTING_REF_MISSING',
      message: `${prefix}: time_setting_ref missing`,
      severity: 'error',
    });
  }

  if (!Array.isArray(scenePackage.character_profile_refs) || scenePackage.character_profile_refs.length === 0) {
    issues.push({
      code: 'CHARACTER_PROFILES_MISSING',
      message: `${prefix}: character_profile_refs missing`,
      severity: 'error',
    });
  }

  if (!hasNonEmptyString(scenePackage.serialized_scenario_ref)) {
    issues.push({
      code: 'SERIALIZED_SCENARIO_REF_MISSING',
      message: `${prefix}: serialized_scenario_ref missing`,
      severity: 'error',
    });
  }

  if (!scenePackage.master_scenario) {
    issues.push({
      code: 'MASTER_SCENARIO_MISSING',
      message: `${prefix}: master_scenario missing`,
      severity: 'error',
    });
    return issues;
  }

  for (const field of MASTER_SCENARIO_IMAGE_APP_FIELDS) {
    const value = scenePackage.master_scenario[field as keyof typeof scenePackage.master_scenario];
    if (value === undefined || value === null) {
      issues.push({
        code: 'MASTER_SCENARIO_FIELD_MISSING',
        message: `${prefix}: master_scenario.${field} missing`,
        severity: 'error',
      });
      continue;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
      issues.push({
        code: 'MASTER_SCENARIO_FIELD_EMPTY',
        message: `${prefix}: master_scenario.${field} empty`,
        severity: 'error',
      });
    }
  }

  if (!scenePackage.generation_ready) {
    issues.push({
      code: 'GENERATION_NOT_READY',
      message: `${prefix}: generation_ready must be true`,
      severity: 'error',
    });
  }

  return issues;
}

function summarizeDataset(dataset: MovieMasterScenarioPackageDataset): {
  movie_id: string;
  package_dataset_id: string;
  scene_count: number;
  generation_ready_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (dataset.scene_packages.length === 0) {
    issues.push({
      code: 'NO_SCENE_PACKAGES',
      message: `${dataset.movie_id}: scene_packages is empty`,
      severity: 'error',
    });
  }

  for (const scenePackage of dataset.scene_packages) {
    issues.push(...validateScenePackage(scenePackage));
  }

  return {
    movie_id: dataset.movie_id,
    package_dataset_id: dataset.package_dataset_id,
    scene_count: dataset.scene_packages.length,
    generation_ready_count: dataset.scene_packages.filter((entry) => entry.generation_ready).length,
    issues,
  };
}

export function runMovieMasterScenarioPackageValidation(
  root: string,
  datasets: MovieMasterScenarioPackageDataset[],
  upstreamSpatialGraphVerdict: string
): MovieMasterScenarioPackageReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_SPATIAL_DIR))) {
    issues.push({
      code: 'MISSING_SPATIAL_DIR',
      message: `${MOVIE_SPATIAL_DIR} does not exist`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, MOVIE_MASTER_SCENARIO_PACKAGE_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_MASTER_SCENARIO_PACKAGE_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, ART_STYLE_REF))) {
    issues.push({
      code: 'MISSING_ART_STYLE_REF',
      message: `${ART_STYLE_REF} does not exist`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, CHARACTER_SIMPLE_LIBRARY_PATH))) {
    issues.push({
      code: 'MISSING_CHARACTER_LIBRARY',
      message: `${CHARACTER_SIMPLE_LIBRARY_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, TIME_SETTING_LIBRARY_PATH))) {
    issues.push({
      code: 'MISSING_TIME_SETTING_LIBRARY',
      message: `${TIME_SETTING_LIBRARY_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (datasets.length === 0) {
    issues.push({
      code: 'NO_DATASETS',
      message: 'No master scenario package datasets found',
      severity: 'error',
    });
  }

  if (upstreamSpatialGraphVerdict !== MOVIE_SPATIAL_GRAPH_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_SPATIAL_GRAPH_NOT_PASS',
      message: `Upstream spatial graph verdict is ${upstreamSpatialGraphVerdict}`,
      severity: 'error',
    });
  }

  const summaries = datasets.map((dataset) => summarizeDataset(dataset));
  issues.push(...summaries.flatMap((summary) => summary.issues));

  const metrics = {
    movie_count: datasets.length,
    scene_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    master_package_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    generation_ready_count: summaries.reduce((sum, summary) => sum + summary.generation_ready_count, 0),
  };

  const masterPackageCreated = datasets.length > 0 && metrics.scene_count > 0;
  const generationReady = metrics.generation_ready_count === metrics.scene_count && metrics.scene_count > 0;

  const allPackages = datasets.flatMap((dataset) => dataset.scene_packages);
  const artStylePresent = allPackages.every((entry) => hasNonEmptyString(entry.art_style_ref));
  const timeSettingPresent = allPackages.every((entry) => hasNonEmptyString(entry.time_setting_ref));
  const characterProfilesPresent = allPackages.every(
    (entry) => Array.isArray(entry.character_profile_refs) && entry.character_profile_refs.length > 0
  );
  const serializedScenarioPresent = allPackages.every((entry) => hasNonEmptyString(entry.serialized_scenario_ref));
  const masterScenarioPresent = allPackages.every(
    (entry) => entry.master_scenario && hasNonEmptyString(entry.master_scenario.scenario)
  );
  const imageAppDirectInputReady =
    masterPackageCreated &&
    generationReady &&
    artStylePresent &&
    timeSettingPresent &&
    characterProfilesPresent &&
    serializedScenarioPresent &&
    masterScenarioPresent;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed = errors.length === 0 && imageAppDirectInputReady;

  return {
    report_id: `movie_master_scenario_package_report_${Date.now().toString(36)}`,
    phase: MOVIE_MASTER_SCENARIO_PACKAGE_PHASE,
    validation_phase: MOVIE_MASTER_SCENARIO_PACKAGE_VALIDATION_PHASE,
    system_id: MOVIE_MASTER_SCENARIO_PACKAGE_SYSTEM_ID,
    validation_id: MOVIE_MASTER_SCENARIO_PACKAGE_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_MASTER_SCENARIO_PACKAGE_PASS_VERDICT
      : MOVIE_MASTER_SCENARIO_PACKAGE_FAIL_VERDICT,
    validation_passed: validationPassed,
    master_package_created: masterPackageCreated,
    image_app_direct_input_ready: imageAppDirectInputReady,
    art_style_present: artStylePresent,
    time_setting_present: timeSettingPresent,
    character_profiles_present: characterProfilesPresent,
    serialized_scenario_present: serializedScenarioPresent,
    master_scenario_present: masterScenarioPresent,
    generation_ready: generationReady,
    status: validationPassed
      ? MOVIE_MASTER_SCENARIO_PACKAGE_PASS_VERDICT
      : MOVIE_MASTER_SCENARIO_PACKAGE_FAIL_VERDICT,
    upstream_spatial_graph_verdict: upstreamSpatialGraphVerdict,
    metrics,
    movie_summaries: summaries.map((summary) => ({
      movie_id: summary.movie_id,
      package_dataset_id: summary.package_dataset_id,
      scene_count: summary.scene_count,
      generation_ready_count: summary.generation_ready_count,
    })),
    issues,
  };
}

export function writeMovieMasterScenarioPackageReport(
  projectRoot?: string
): MovieMasterScenarioPackageReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieSpatialGraphReport(root);
  writeMovieMasterScenarioPackages(root);
  const datasets = loadAllMovieMasterScenarioPackageDatasets(root);
  const report = runMovieMasterScenarioPackageValidation(root, datasets, upstreamReport.final_verdict);
  writeJson(root, MOVIE_MASTER_SCENARIO_PACKAGE_REPORT_PATH, report);
  return report;
}
