import fs from 'node:fs';
import path from 'node:path';
import {
  detectArtStyleIdOnly,
  detectCharacterDnaMarker,
  detectMetadataFields,
  detectTimesettingMetadataFormat,
} from './imageAppPromptLoader.js';
import {
  copySourceOfTruthArtStyle,
  copySourceOfTruthCharacterFieldFromGraph,
  copySourceOfTruthTimeSettingPrompt,
  SOURCE_OF_TRUTH_DIR,
} from './sourceOfTruthLoader.js';
import {
  MASTER_DATASET_BINDING_OUTPUTS,
  MOVIE_MASTER_DATASET_BINDING_FAIL_VERDICT,
  MOVIE_MASTER_DATASET_BINDING_PASS_VERDICT,
  MOVIE_MASTER_DATASET_BINDING_PHASE,
  MOVIE_MASTER_DATASET_BINDING_REPORT_PATH,
  MOVIE_MASTER_DATASET_BINDING_SCHEMA_PATH,
  MOVIE_MASTER_DATASET_BINDING_SYSTEM_ID,
  MovieMasterDatasetSceneBinding,
  generateScenarioFromSpatialGraph,
  loadAllMovieMasterDatasetBindingDatasets,
  resolveMasterStyleArtStyle,
  writeMovieMasterDatasetBindings,
} from './movieMasterDatasetBinding.js';
import { MOVIE_IMAGE_APP_EXPORT_PASS_VERDICT } from './movieImageAppExportBuilder.js';
import { writeMovieImageAppExportReport } from './movieImageAppExportValidation.js';
import {
  MovieSpatialGraph,
  loadAllMovieSpatialGraphDatasets,
} from './movieSpatialGraphBuilder.js';
import {
  MovieSpatialSceneRecord,
  loadAllMovieSpatialEngineDatasets,
} from './movieSpatialEngineBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_MASTER_DATASET_BINDING_VALIDATION_PHASE =
  'PHASE-MOVIE-MASTER-DATASET-BINDING-VALIDATION-001' as const;
export const MOVIE_MASTER_DATASET_BINDING_VALIDATION_ID =
  'MOVIE_MASTER_DATASET_BINDING_VALIDATION_V1' as const;

const FORBIDDEN_SERIALIZER_ART_STYLES = [
  'Hand-painted Studio Ghibli-inspired cinematic illustration, warm Mediterranean Gonegi world tone, soft watercolor backgrounds, expressive character eyes, preserved period interior grammar without Titanic world identity.',
  'Hand-painted Studio Ghibli-inspired cinematic illustration, Mediterranean Gonegi mythic tone, luminous spirit-world atmosphere, soft layered backgrounds, expressive character eyes.',
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieMasterDatasetBindingReport {
  report_id: string;
  phase: typeof MOVIE_MASTER_DATASET_BINDING_PHASE;
  validation_phase: typeof MOVIE_MASTER_DATASET_BINDING_VALIDATION_PHASE;
  system_id: typeof MOVIE_MASTER_DATASET_BINDING_SYSTEM_ID;
  validation_id: typeof MOVIE_MASTER_DATASET_BINDING_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  master_binding_complete: boolean;
  master_style_locked: boolean;
  time_library_locked: boolean;
  character_library_locked: boolean;
  scenario_generation_only: boolean;
  image_app_native_format_ready: boolean;
  art_style_generated: boolean;
  time_setting_generated: boolean;
  character_generated: boolean;
  scenario_generated: boolean;
  master_style_bound: boolean;
  time_library_bound: boolean;
  character_library_bound: boolean;
  status: string;
  upstream_image_app_export_verdict: string;
  metrics: {
    scene_count: number;
    master_style_binding_count: number;
    time_binding_count: number;
    character_binding_count: number;
    generated_scenario_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    binding_dataset_id: string;
    scene_count: number;
    bound_count: number;
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

function validateSceneBinding(
  binding: MovieMasterDatasetSceneBinding,
  masterArtStyle: string,
  graphBySceneId: Map<string, MovieSpatialGraph>,
  spatialSceneById: Map<string, MovieSpatialSceneRecord>,
  root: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${binding.movie_id}/${binding.scene_id}`;

  if (binding.binding_status !== 'bound') {
    issues.push({
      code: 'BINDING_STATUS_NOT_BOUND',
      message: `${prefix}: binding_status=${binding.binding_status}`,
      severity: 'error',
    });
  }

  if (!binding.art_style_ref.startsWith(`${SOURCE_OF_TRUTH_DIR}/`)) {
    issues.push({
      code: 'ART_STYLE_REF_NOT_SOURCE_OF_TRUTH',
      message: `${prefix}: art_style_ref=${binding.art_style_ref}`,
      severity: 'error',
    });
  }

  if (!binding.time_setting_ref.startsWith(`${SOURCE_OF_TRUTH_DIR}/`)) {
    issues.push({
      code: 'TIME_SETTING_REF_NOT_SOURCE_OF_TRUTH',
      message: `${prefix}: time_setting_ref=${binding.time_setting_ref}`,
      severity: 'error',
    });
  }

  if (!binding.character_ref.startsWith(`${SOURCE_OF_TRUTH_DIR}/`)) {
    issues.push({
      code: 'CHARACTER_REF_NOT_SOURCE_OF_TRUTH',
      message: `${prefix}: character_ref=${binding.character_ref}`,
      severity: 'error',
    });
  }

  if (binding.field_binding.artStyle.generated) {
    issues.push({
      code: 'ART_STYLE_GENERATED_FORBIDDEN',
      message: `${prefix}: artStyle must be reference-only`,
      severity: 'error',
    });
  }

  if (binding.field_binding.timeSetting.generated) {
    issues.push({
      code: 'TIME_SETTING_GENERATED_FORBIDDEN',
      message: `${prefix}: timeSetting must be reference-only`,
      severity: 'error',
    });
  }

  if (binding.field_binding.character.generated) {
    issues.push({
      code: 'CHARACTER_GENERATED_FORBIDDEN',
      message: `${prefix}: character must be reference-only`,
      severity: 'error',
    });
  }

  if (!binding.field_binding.scenario.generated) {
    issues.push({
      code: 'SCENARIO_NOT_GENERATED',
      message: `${prefix}: scenario must be generated from spatial graph`,
      severity: 'error',
    });
  }

  if (FORBIDDEN_SERIALIZER_ART_STYLES.includes(binding.image_app_native_format.artStyle as (typeof FORBIDDEN_SERIALIZER_ART_STYLES)[number])) {
    if (binding.image_app_native_format.artStyle !== masterArtStyle) {
      issues.push({
        code: 'ART_STYLE_SERIALIZER_LEAK',
        message: `${prefix}: artStyle matches forbidden serializer-generated movie style`,
        severity: 'error',
      });
    }
  }

  if (detectArtStyleIdOnly(binding.image_app_native_format.artStyle)) {
    issues.push({
      code: 'ART_STYLE_ID_ONLY_FORBIDDEN',
      message: `${prefix}: artStyle must be approved prompt sentence, not style ID`,
      severity: 'error',
    });
  }

  if (binding.image_app_native_format.artStyle !== masterArtStyle) {
    issues.push({
      code: 'ART_STYLE_NOT_MASTER_BOUND',
      message: `${prefix}: artStyle does not match master_style_core binding`,
      severity: 'error',
    });
  }

  const graph = graphBySceneId.get(binding.scene_id);
  if (graph) {
    const expectedScenario = generateScenarioFromSpatialGraph(
      graph,
      spatialSceneById.get(binding.scene_id) ?? null
    );
    if (binding.image_app_native_format.scenario !== expectedScenario) {
      issues.push({
        code: 'SCENARIO_GRAPH_MISMATCH',
        message: `${prefix}: scenario does not match spatial graph generation`,
        severity: 'error',
      });
    }

    const expectedCharacter = copySourceOfTruthCharacterFieldFromGraph(graph, root);
    if (binding.image_app_native_format.character !== expectedCharacter) {
      issues.push({
        code: 'CHARACTER_PROMPT_COPY_MISMATCH',
        message: `${prefix}: character does not match Image App prompt copy`,
        severity: 'error',
      });
    }
    if (detectCharacterDnaMarker(binding.image_app_native_format.character)) {
      issues.push({
        code: 'CHARACTER_DNA_FORMAT_FORBIDDEN',
        message: `${prefix}: character must not use CHARACTER_DNA database format`,
        severity: 'error',
      });
    }
    if (detectMetadataFields(binding.image_app_native_format.character)) {
      issues.push({
        code: 'CHARACTER_METADATA_FORBIDDEN',
        message: `${prefix}: character must not contain metadata fields`,
        severity: 'error',
      });
    }

    const timeSettingId = binding.time_setting_ref.split('=').pop() ?? '';
    const expectedTimeSetting = copySourceOfTruthTimeSettingPrompt(timeSettingId, root);
    if (binding.image_app_native_format.timeSetting !== expectedTimeSetting) {
      issues.push({
        code: 'TIME_SETTING_PROMPT_COPY_MISMATCH',
        message: `${prefix}: timeSetting does not match Image App prompt copy`,
        severity: 'error',
      });
    }
    if (detectTimesettingMetadataFormat(binding.image_app_native_format.timeSetting)) {
      issues.push({
        code: 'TIME_SETTING_METADATA_FORBIDDEN',
        message: `${prefix}: timeSetting must not use database metadata format`,
        severity: 'error',
      });
    }
  }

  for (const field of ['artStyle', 'timeSetting', 'scenario', 'character'] as const) {
    if (!hasNonEmptyString(binding.image_app_native_format[field])) {
      issues.push({
        code: 'NATIVE_FORMAT_FIELD_MISSING',
        message: `${prefix}: image_app_native_format.${field} missing`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function buildMovieMasterDatasetBindingReport(root: string): MovieMasterDatasetBindingReport {
  const upstreamImageAppExportReport = writeMovieImageAppExportReport(root);
  const upstreamImageAppExportVerdict = upstreamImageAppExportReport.final_verdict;

  writeMovieMasterDatasetBindings(root);
  const datasets = loadAllMovieMasterDatasetBindingDatasets(root);
  const graphDatasets = loadAllMovieSpatialGraphDatasets(root);
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);
  const masterArtStyle = resolveMasterStyleArtStyle(root).value;

  const graphBySceneId = new Map<string, MovieSpatialGraph>();
  const spatialSceneById = new Map<string, MovieSpatialSceneRecord>();

  for (const graphDataset of graphDatasets) {
    for (const graph of graphDataset.spatial_graphs) {
      graphBySceneId.set(graph.scene_id, graph);
    }
  }

  for (const engineDataset of engineDatasets) {
    for (const scene of engineDataset.spatial_scenes) {
      spatialSceneById.set(scene.scene_id, scene);
    }
  }

  const issues: ValidationIssue[] = [];
  let masterStyleBindingCount = 0;
  let timeBindingCount = 0;
  let characterBindingCount = 0;
  let generatedScenarioCount = 0;

  for (const dataset of datasets) {
    if (dataset.binding_count !== dataset.scene_bindings.length) {
      issues.push({
        code: 'BINDING_COUNT_MISMATCH',
        message: `${dataset.movie_id}: binding_count=${dataset.binding_count}, scene_bindings=${dataset.scene_bindings.length}`,
        severity: 'error',
      });
    }

    for (const binding of dataset.scene_bindings) {
      if (binding.art_style_ref.startsWith(`${SOURCE_OF_TRUTH_DIR}/`)) {
        masterStyleBindingCount += 1;
      }
      if (binding.time_setting_ref.startsWith(`${SOURCE_OF_TRUTH_DIR}/`)) {
        timeBindingCount += 1;
      }
      if (binding.character_ref.startsWith(`${SOURCE_OF_TRUTH_DIR}/`)) {
        characterBindingCount += 1;
      }
      if (binding.field_binding.scenario.generated) {
        generatedScenarioCount += 1;
      }

      issues.push(
        ...validateSceneBinding(binding, masterArtStyle, graphBySceneId, spatialSceneById, root)
      );
    }
  }

  const sceneCount = datasets.reduce((sum, dataset) => sum + dataset.scene_bindings.length, 0);
  const boundCount = datasets.reduce(
    (sum, dataset) =>
      sum + dataset.scene_bindings.filter((binding) => binding.binding_status === 'bound').length,
    0
  );

  const artStyleGenerated = datasets.some((dataset) =>
    dataset.scene_bindings.some((binding) => binding.field_binding.artStyle.generated)
  );
  const timeSettingGenerated = datasets.some((dataset) =>
    dataset.scene_bindings.some((binding) => binding.field_binding.timeSetting.generated)
  );
  const characterGenerated = datasets.some((dataset) =>
    dataset.scene_bindings.some((binding) => binding.field_binding.character.generated)
  );
  const scenarioGenerated =
    generatedScenarioCount === sceneCount &&
    datasets.every((dataset) =>
      dataset.scene_bindings.every((binding) => binding.field_binding.scenario.generated)
    );

  const masterStyleBound = masterStyleBindingCount === sceneCount;
  const timeLibraryBound = timeBindingCount === sceneCount;
  const characterLibraryBound = characterBindingCount === sceneCount;
  const masterBindingComplete =
    boundCount === sceneCount &&
    masterStyleBound &&
    timeLibraryBound &&
    characterLibraryBound &&
    scenarioGenerated;
  const masterStyleLocked = !artStyleGenerated && masterStyleBound;
  const timeLibraryLocked = !timeSettingGenerated && timeLibraryBound;
  const characterLibraryLocked = !characterGenerated && characterLibraryBound;
  const scenarioGenerationOnly =
    scenarioGenerated && !artStyleGenerated && !timeSettingGenerated && !characterGenerated;
  const imageAppNativeFormatReady = datasets.every((dataset) =>
    dataset.scene_bindings.every((binding) =>
      ['artStyle', 'timeSetting', 'scenario', 'character'].every((field) =>
        hasNonEmptyString(binding.image_app_native_format[field as keyof typeof binding.image_app_native_format])
      )
    )
  );

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    masterBindingComplete &&
    masterStyleLocked &&
    timeLibraryLocked &&
    characterLibraryLocked &&
    scenarioGenerationOnly &&
    imageAppNativeFormatReady &&
    upstreamImageAppExportVerdict === MOVIE_IMAGE_APP_EXPORT_PASS_VERDICT;

  return {
    report_id: `movie_master_dataset_binding_report_${Date.now().toString(36)}`,
    phase: MOVIE_MASTER_DATASET_BINDING_PHASE,
    validation_phase: MOVIE_MASTER_DATASET_BINDING_VALIDATION_PHASE,
    system_id: MOVIE_MASTER_DATASET_BINDING_SYSTEM_ID,
    validation_id: MOVIE_MASTER_DATASET_BINDING_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_MASTER_DATASET_BINDING_PASS_VERDICT
      : MOVIE_MASTER_DATASET_BINDING_FAIL_VERDICT,
    validation_passed: validationPassed,
    master_binding_complete: masterBindingComplete,
    master_style_locked: masterStyleLocked,
    time_library_locked: timeLibraryLocked,
    character_library_locked: characterLibraryLocked,
    scenario_generation_only: scenarioGenerationOnly,
    image_app_native_format_ready: imageAppNativeFormatReady,
    art_style_generated: artStyleGenerated,
    time_setting_generated: timeSettingGenerated,
    character_generated: characterGenerated,
    scenario_generated: scenarioGenerated,
    master_style_bound: masterStyleBound,
    time_library_bound: timeLibraryBound,
    character_library_bound: characterLibraryBound,
    status: validationPassed
      ? MOVIE_MASTER_DATASET_BINDING_PASS_VERDICT
      : MOVIE_MASTER_DATASET_BINDING_FAIL_VERDICT,
    upstream_image_app_export_verdict: upstreamImageAppExportVerdict,
    metrics: {
      scene_count: sceneCount,
      master_style_binding_count: masterStyleBindingCount,
      time_binding_count: timeBindingCount,
      character_binding_count: characterBindingCount,
      generated_scenario_count: generatedScenarioCount,
    },
    movie_summaries: datasets.map((dataset) => ({
      movie_id: dataset.movie_id,
      binding_dataset_id: dataset.binding_dataset_id,
      scene_count: dataset.scene_bindings.length,
      bound_count: dataset.scene_bindings.filter((binding) => binding.binding_status === 'bound')
        .length,
    })),
    issues,
  };
}

export function writeMovieMasterDatasetBindingReport(projectRoot?: string): MovieMasterDatasetBindingReport {
  const root = resolveProjectRoot(projectRoot);
  const report = buildMovieMasterDatasetBindingReport(root);
  writeJson(root, MOVIE_MASTER_DATASET_BINDING_REPORT_PATH, report);
  return report;
}

export { MASTER_DATASET_BINDING_OUTPUTS, MOVIE_MASTER_DATASET_BINDING_SCHEMA_PATH };
