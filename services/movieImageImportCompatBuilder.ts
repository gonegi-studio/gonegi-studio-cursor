import fs from 'node:fs';
import path from 'node:path';
import {
  ImageAppExportBlockingContext,
  ImageAppExportCameraContext,
  ImageAppExportCompositionContext,
  ImageAppExportSpatialContext,
  ImageAppGenerationPayload,
  MovieImageAppExportDataset,
  MovieImageAppSceneExport,
} from './movieImageAppExportBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_IMAGE_IMPORT_COMPAT_PHASE = 'PHASE-IMAGE-IMPORT-COMPAT-001' as const;
export const MOVIE_IMAGE_IMPORT_COMPAT_SYSTEM_ID = 'MOVIE_IMAGE_IMPORT_COMPAT_V1' as const;
export const MOVIE_IMAGE_IMPORT_COMPAT_PASS_VERDICT = 'PASS_IMAGE_IMPORT_COMPAT_V1' as const;
export const MOVIE_IMAGE_IMPORT_COMPAT_FAIL_VERDICT = 'FAIL_IMAGE_IMPORT_COMPAT_V1' as const;

export const MOVIE_IMAGE_IMPORT_COMPAT_SOURCE_PATH =
  'exports/movie_spatial/tests/titanic-import-test-single-scene.json' as const;
export const MOVIE_IMAGE_IMPORT_COMPAT_OUTPUT_PATH =
  'exports/movie_spatial/tests/titanic-import-test-single-scene-slots.json' as const;
export const MOVIE_IMAGE_IMPORT_COMPAT_REPORT_PATH =
  'reports/movie_spatial/IMAGE_IMPORT_COMPAT_REPORT.json' as const;

export const IMPORT_COMPAT_REQUIRED_4_FIELDS = [
  'artStyle',
  'timeSetting',
  'scenario',
  'character',
] as const;

export const IMPORT_COMPAT_SLOT_PRESERVED_FIELDS = [
  ...IMPORT_COMPAT_REQUIRED_4_FIELDS,
  'spatial_context',
  'camera_context',
  'blocking_context',
  'composition_context',
  'generation_payload',
] as const;

export type ImportCompatRequired4Field = (typeof IMPORT_COMPAT_REQUIRED_4_FIELDS)[number];
export type ImportCompatSlotPreservedField = (typeof IMPORT_COMPAT_SLOT_PRESERVED_FIELDS)[number];

export interface MovieImageImportCompatSlot {
  slot_id: string;
  slot_order: number;
  scene_id: string;
  export_id: string;
  movie_id: string;
  artStyle: string;
  timeSetting: string;
  scenario: string;
  character: string;
  spatial_context: ImageAppExportSpatialContext;
  camera_context: ImageAppExportCameraContext;
  blocking_context: ImageAppExportBlockingContext;
  composition_context: ImageAppExportCompositionContext;
  generation_payload: ImageAppGenerationPayload;
}

export interface MovieImageImportCompatPackage {
  compat_package_id: string;
  phase: typeof MOVIE_IMAGE_IMPORT_COMPAT_PHASE;
  system_id: typeof MOVIE_IMAGE_IMPORT_COMPAT_SYSTEM_ID;
  generated_at: string;
  source_export_path: typeof MOVIE_IMAGE_IMPORT_COMPAT_SOURCE_PATH;
  source_export_dataset_id: string;
  movie_id: string;
  slot_count: number;
  import_ready: boolean;
  slots: MovieImageImportCompatSlot[];
}

export interface ImageImportCompatReport {
  report_id: string;
  phase: typeof MOVIE_IMAGE_IMPORT_COMPAT_PHASE;
  system_id: typeof MOVIE_IMAGE_IMPORT_COMPAT_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  slots_created: boolean;
  slot_count: number;
  required_4_fields_present: boolean;
  source_export_path: typeof MOVIE_IMAGE_IMPORT_COMPAT_SOURCE_PATH;
  output_path: typeof MOVIE_IMAGE_IMPORT_COMPAT_OUTPUT_PATH;
  output_size_bytes: number;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function fileSizeBytes(root: string, rel: string): number {
  return fs.statSync(path.join(root, rel)).size;
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function loadMovieImageImportCompatSource(
  projectRoot?: string
): MovieImageAppExportDataset {
  const root = resolveProjectRoot(projectRoot);
  const full = path.join(root, MOVIE_IMAGE_IMPORT_COMPAT_SOURCE_PATH);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing source export: ${MOVIE_IMAGE_IMPORT_COMPAT_SOURCE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieImageAppExportDataset;
}

export function sceneExportToImportSlot(
  sceneExport: MovieImageAppSceneExport,
  slotOrder: number
): MovieImageImportCompatSlot {
  return {
    slot_id: `import-slot-${slotOrder}`,
    slot_order: slotOrder,
    scene_id: sceneExport.scene_id,
    export_id: sceneExport.export_id,
    movie_id: sceneExport.movie_id,
    artStyle: sceneExport.artStyle,
    timeSetting: sceneExport.timeSetting,
    scenario: sceneExport.scenario,
    character: sceneExport.character,
    spatial_context: sceneExport.spatial_context,
    camera_context: sceneExport.camera_context,
    blocking_context: sceneExport.blocking_context,
    composition_context: sceneExport.composition_context,
    generation_payload: sceneExport.generation_payload,
  };
}

export function buildMovieImageImportCompatPackage(
  source: MovieImageAppExportDataset
): MovieImageImportCompatPackage {
  const slots = source.scene_exports.map((sceneExport, index) =>
    sceneExportToImportSlot(sceneExport, index + 1)
  );

  return {
    compat_package_id: `${source.export_dataset_id}-slots-v1`,
    phase: MOVIE_IMAGE_IMPORT_COMPAT_PHASE,
    system_id: MOVIE_IMAGE_IMPORT_COMPAT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    source_export_path: MOVIE_IMAGE_IMPORT_COMPAT_SOURCE_PATH,
    source_export_dataset_id: source.export_dataset_id,
    movie_id: source.movie_id,
    slot_count: slots.length,
    import_ready: slots.length > 0,
    slots,
  };
}

function slotHasRequired4Fields(slot: MovieImageImportCompatSlot): boolean {
  return IMPORT_COMPAT_REQUIRED_4_FIELDS.every((field) => hasNonEmptyString(slot[field]));
}

function slotHasPreservedFields(slot: MovieImageImportCompatSlot): boolean {
  for (const field of IMPORT_COMPAT_REQUIRED_4_FIELDS) {
    if (!hasNonEmptyString(slot[field])) return false;
  }

  const objectFields = [
    'spatial_context',
    'camera_context',
    'blocking_context',
    'composition_context',
    'generation_payload',
  ] as const;

  for (const field of objectFields) {
    const value = slot[field];
    if (typeof value !== 'object' || value === null) return false;
  }

  return true;
}

function validateCompatPackage(
  root: string,
  source: MovieImageAppExportDataset,
  compatPackage: MovieImageImportCompatPackage
): ImageImportCompatReport['issues'] {
  const issues: ImageImportCompatReport['issues'] = [];

  if (compatPackage.slot_count !== source.scene_exports.length) {
    issues.push({
      code: 'SLOT_COUNT_MISMATCH',
      message: `slot_count=${compatPackage.slot_count}, source scene_exports=${source.scene_exports.length}`,
      severity: 'error',
    });
  }

  if (compatPackage.slots.length === 0) {
    issues.push({
      code: 'SLOTS_EMPTY',
      message: 'No import slots created',
      severity: 'error',
    });
  }

  for (const slot of compatPackage.slots) {
    if (!slotHasRequired4Fields(slot)) {
      issues.push({
        code: 'REQUIRED_4_FIELDS_MISSING',
        message: `${slot.slot_id}: one or more Music Drama fields missing`,
        severity: 'error',
      });
    }

    if (!slotHasPreservedFields(slot)) {
      issues.push({
        code: 'PRESERVED_FIELDS_MISSING',
        message: `${slot.slot_id}: one or more preserved context fields missing`,
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, MOVIE_IMAGE_IMPORT_COMPAT_OUTPUT_PATH))) {
    issues.push({
      code: 'OUTPUT_MISSING',
      message: `Output not written: ${MOVIE_IMAGE_IMPORT_COMPAT_OUTPUT_PATH}`,
      severity: 'error',
    });
  }

  return issues;
}

export function writeMovieImageImportCompatPackage(projectRoot?: string): ImageImportCompatReport {
  const root = resolveProjectRoot(projectRoot);
  const source = loadMovieImageImportCompatSource(root);
  const compatPackage = buildMovieImageImportCompatPackage(source);

  writeJson(root, MOVIE_IMAGE_IMPORT_COMPAT_OUTPUT_PATH, compatPackage);
  const outputSizeBytes = fileSizeBytes(root, MOVIE_IMAGE_IMPORT_COMPAT_OUTPUT_PATH);

  const issues = validateCompatPackage(root, source, compatPackage);
  const slotsCreated = compatPackage.slots.length > 0;
  const required4FieldsPresent =
    slotsCreated && compatPackage.slots.every((slot) => slotHasRequired4Fields(slot));
  const validationPassed =
    issues.every((issue) => issue.severity !== 'error') &&
    slotsCreated &&
    required4FieldsPresent;

  const report: ImageImportCompatReport = {
    report_id: 'IMAGE-IMPORT-COMPAT-REPORT-V1',
    phase: MOVIE_IMAGE_IMPORT_COMPAT_PHASE,
    system_id: MOVIE_IMAGE_IMPORT_COMPAT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_IMAGE_IMPORT_COMPAT_PASS_VERDICT
      : MOVIE_IMAGE_IMPORT_COMPAT_FAIL_VERDICT,
    validation_passed: validationPassed,
    slots_created: slotsCreated,
    slot_count: compatPackage.slot_count,
    required_4_fields_present: required4FieldsPresent,
    source_export_path: MOVIE_IMAGE_IMPORT_COMPAT_SOURCE_PATH,
    output_path: MOVIE_IMAGE_IMPORT_COMPAT_OUTPUT_PATH,
    output_size_bytes: outputSizeBytes,
    issues,
  };

  writeJson(root, MOVIE_IMAGE_IMPORT_COMPAT_REPORT_PATH, report);
  return report;
}
