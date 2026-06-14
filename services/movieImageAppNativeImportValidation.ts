import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_NATIVE_IMPORT_OUTPUTS,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_FAIL_VERDICT,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_PASS_VERDICT,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_PHASE,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_REPORT_PATH,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_SCHEMA_PATH,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_SYSTEM_ID,
  NATIVE_IMPORT_REQUIRED_SLOT_FIELDS,
  ImageAppNativeImportSlot,
  MovieImageAppNativeImportDataset,
  loadAllMovieImageAppNativeImportDatasets,
  writeMovieImageAppNativeImports,
} from './movieImageAppNativeImportBuilder.js';
import {
  MOVIE_MASTER_DATASET_BINDING_PASS_VERDICT,
  resolveMasterStyleArtStyle,
} from './movieMasterDatasetBinding.js';
import { writeMovieMasterDatasetBindingReport } from './movieMasterDatasetBindingValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_IMAGE_APP_NATIVE_IMPORT_VALIDATION_PHASE =
  'PHASE-MOVIE-IMAGE-APP-NATIVE-IMPORT-VALIDATION-001' as const;
export const MOVIE_IMAGE_APP_NATIVE_IMPORT_VALIDATION_ID =
  'MOVIE_IMAGE_APP_NATIVE_IMPORT_VALIDATION_V1' as const;

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

export interface MovieImageAppNativeImportReport {
  report_id: string;
  phase: typeof MOVIE_IMAGE_APP_NATIVE_IMPORT_PHASE;
  validation_phase: typeof MOVIE_IMAGE_APP_NATIVE_IMPORT_VALIDATION_PHASE;
  system_id: typeof MOVIE_IMAGE_APP_NATIVE_IMPORT_SYSTEM_ID;
  validation_id: typeof MOVIE_IMAGE_APP_NATIVE_IMPORT_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  native_import_created: boolean;
  music_drama_import_ready: boolean;
  image_generation_ready: boolean;
  slots_present: boolean;
  slot_count: number;
  artStyle_present: boolean;
  timeSetting_present: boolean;
  scenario_present: boolean;
  character_present: boolean;
  native_import_format_valid: boolean;
  status: string;
  upstream_master_dataset_binding_verdict: string;
  metrics: {
    movie_count: number;
    slot_count: number;
    export_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    native_import_id: string;
    slot_count: number;
    music_drama_import_ready: boolean;
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

function validateSlot(
  slot: ImageAppNativeImportSlot,
  index: number,
  masterArtStyle: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `slot[${index}]`;

  for (const field of NATIVE_IMPORT_REQUIRED_SLOT_FIELDS) {
    if (!hasNonEmptyString(slot[field])) {
      issues.push({
        code: 'SLOT_FIELD_MISSING',
        message: `${prefix}: ${field} is missing`,
        severity: 'error',
      });
    }
  }

  if (FORBIDDEN_SERIALIZER_ART_STYLES.includes(slot.artStyle as (typeof FORBIDDEN_SERIALIZER_ART_STYLES)[number])) {
    issues.push({
      code: 'ART_STYLE_SERIALIZER_LEAK',
      message: `${prefix}: artStyle matches forbidden serializer-generated style`,
      severity: 'error',
    });
  }

  if (slot.artStyle !== masterArtStyle) {
    issues.push({
      code: 'ART_STYLE_NOT_MASTER_BOUND',
      message: `${prefix}: artStyle does not match master_style_core binding`,
      severity: 'error',
    });
  }

  return issues;
}

function validateNativeImportDataset(
  dataset: MovieImageAppNativeImportDataset,
  masterArtStyle: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = dataset.movie_id;

  if (!Array.isArray(dataset.slots) || dataset.slots.length === 0) {
    issues.push({
      code: 'SLOTS_EMPTY',
      message: `${prefix}: slots array is empty`,
      severity: 'error',
    });
    return issues;
  }

  if (dataset.slot_count !== dataset.slots.length) {
    issues.push({
      code: 'SLOT_COUNT_MISMATCH',
      message: `${prefix}: slot_count=${dataset.slot_count}, slots.length=${dataset.slots.length}`,
      severity: 'error',
    });
  }

  if (dataset.phase !== MOVIE_IMAGE_APP_NATIVE_IMPORT_PHASE) {
    issues.push({
      code: 'PHASE_MISMATCH',
      message: `${prefix}: phase=${dataset.phase}`,
      severity: 'error',
    });
  }

  dataset.slots.forEach((slot, index) => {
    issues.push(...validateSlot(slot, index, masterArtStyle));
  });

  return issues;
}

export function buildMovieImageAppNativeImportReport(root: string): MovieImageAppNativeImportReport {
  const upstreamBindingReport = writeMovieMasterDatasetBindingReport(root);
  const upstreamVerdict = upstreamBindingReport.final_verdict;

  writeMovieImageAppNativeImports(root);
  const datasets = loadAllMovieImageAppNativeImportDatasets(root);
  const masterArtStyle = resolveMasterStyleArtStyle(root).value;

  const issues: ValidationIssue[] = [];
  let totalSlots = 0;

  for (const spec of IMAGE_APP_NATIVE_IMPORT_OUTPUTS) {
    if (!fs.existsSync(path.join(root, spec.output_path))) {
      issues.push({
        code: 'NATIVE_IMPORT_OUTPUT_MISSING',
        message: `Missing output: ${spec.output_path}`,
        severity: 'error',
      });
    }
  }

  for (const dataset of datasets) {
    totalSlots += dataset.slots.length;
    issues.push(...validateNativeImportDataset(dataset, masterArtStyle));
  }

  const slotsPresent = datasets.every(
    (dataset) => Array.isArray(dataset.slots) && dataset.slots.length > 0
  );
  const slotCount = totalSlots;
  const artStylePresent = datasets.every((dataset) =>
    dataset.slots.every((slot) => hasNonEmptyString(slot.artStyle))
  );
  const timeSettingPresent = datasets.every((dataset) =>
    dataset.slots.every((slot) => hasNonEmptyString(slot.timeSetting))
  );
  const scenarioPresent = datasets.every((dataset) =>
    dataset.slots.every((slot) => hasNonEmptyString(slot.scenario))
  );
  const characterPresent = datasets.every((dataset) =>
    dataset.slots.every((slot) => hasNonEmptyString(slot.character))
  );
  const nativeImportFormatValid =
    slotsPresent &&
    slotCount > 0 &&
    artStylePresent &&
    timeSettingPresent &&
    scenarioPresent &&
    characterPresent &&
    datasets.every((dataset) => dataset.slot_count === dataset.slots.length);

  const nativeImportCreated =
    datasets.length === IMAGE_APP_NATIVE_IMPORT_OUTPUTS.length &&
    IMAGE_APP_NATIVE_IMPORT_OUTPUTS.every((spec) =>
      fs.existsSync(path.join(root, spec.output_path))
    );

  const musicDramaImportReady =
    nativeImportCreated &&
    nativeImportFormatValid &&
    datasets.every((dataset) => dataset.music_drama_import_ready);

  const imageGenerationReady =
    musicDramaImportReady && upstreamVerdict === MOVIE_MASTER_DATASET_BINDING_PASS_VERDICT;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    nativeImportCreated &&
    musicDramaImportReady &&
    imageGenerationReady &&
    nativeImportFormatValid;

  return {
    report_id: `movie_image_app_native_import_report_${Date.now().toString(36)}`,
    phase: MOVIE_IMAGE_APP_NATIVE_IMPORT_PHASE,
    validation_phase: MOVIE_IMAGE_APP_NATIVE_IMPORT_VALIDATION_PHASE,
    system_id: MOVIE_IMAGE_APP_NATIVE_IMPORT_SYSTEM_ID,
    validation_id: MOVIE_IMAGE_APP_NATIVE_IMPORT_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_IMAGE_APP_NATIVE_IMPORT_PASS_VERDICT
      : MOVIE_IMAGE_APP_NATIVE_IMPORT_FAIL_VERDICT,
    validation_passed: validationPassed,
    native_import_created: nativeImportCreated,
    music_drama_import_ready: musicDramaImportReady,
    image_generation_ready: imageGenerationReady,
    slots_present: slotsPresent,
    slot_count: slotCount,
    artStyle_present: artStylePresent,
    timeSetting_present: timeSettingPresent,
    scenario_present: scenarioPresent,
    character_present: characterPresent,
    native_import_format_valid: nativeImportFormatValid,
    status: validationPassed
      ? MOVIE_IMAGE_APP_NATIVE_IMPORT_PASS_VERDICT
      : MOVIE_IMAGE_APP_NATIVE_IMPORT_FAIL_VERDICT,
    upstream_master_dataset_binding_verdict: upstreamVerdict,
    metrics: {
      movie_count: datasets.length,
      slot_count: slotCount,
      export_count: datasets.length,
    },
    movie_summaries: datasets.map((dataset) => ({
      movie_id: dataset.movie_id,
      native_import_id: dataset.native_import_id,
      slot_count: dataset.slots.length,
      music_drama_import_ready: dataset.music_drama_import_ready,
    })),
    issues,
  };
}

export function writeMovieImageAppNativeImportReport(
  projectRoot?: string
): MovieImageAppNativeImportReport {
  const root = resolveProjectRoot(projectRoot);
  const report = buildMovieImageAppNativeImportReport(root);
  writeJson(root, MOVIE_IMAGE_APP_NATIVE_IMPORT_REPORT_PATH, report);
  return report;
}

export { IMAGE_APP_NATIVE_IMPORT_OUTPUTS, MOVIE_IMAGE_APP_NATIVE_IMPORT_SCHEMA_PATH };
