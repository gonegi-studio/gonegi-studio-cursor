import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { buildBlockingExtractionPlaceholder } from './sourceVideoNumericalDna/blockingExtraction.js';
import { buildCameraPathExtractionPlaceholder } from './sourceVideoNumericalDna/cameraPathExtraction.js';
import { buildCompositionCoordinateExtractionPlaceholder } from './sourceVideoNumericalDna/compositionCoordinateExtraction.js';
import { buildEditRhythmExtractionPlaceholder } from './sourceVideoNumericalDna/editRhythmExtraction.js';
import { buildFrameCoordinateExtractionPlaceholder } from './sourceVideoNumericalDna/frameCoordinateExtraction.js';
import { buildMotionVectorExtractionPlaceholder } from './sourceVideoNumericalDna/motionVectorExtraction.js';
import { buildSceneRemapEnginePlaceholder } from './sourceVideoNumericalDna/sceneRemapEngine.js';

export const SOURCE_VIDEO_NUMERICAL_DNA_PHASE = 'PHASE-SOURCE-VIDEO-DNA-REAL-001' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_SYSTEM_ID =
  'SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_PASS_VERDICT =
  'PASS_SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_FAIL_VERDICT =
  'FAIL_SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_STATUS =
  'SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_READY' as const;

export const SOURCE_VIDEO_NUMERICAL_DNA_DATASET_DIR =
  'datasets/source_video_numerical_dna' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_SCHEMA_PATH =
  `${SOURCE_VIDEO_NUMERICAL_DNA_DATASET_DIR}/source-video-numerical-dna.schema.json` as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH =
  `${SOURCE_VIDEO_NUMERICAL_DNA_DATASET_DIR}/source-video-numerical-dna-registry.json` as const;

export const SOURCE_VIDEO_NUMERICAL_DNA_EXPORT_DIR =
  'exports/source_video_numerical_dna' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_EXPORT_PATH =
  `${SOURCE_VIDEO_NUMERICAL_DNA_EXPORT_DIR}/source-video-numerical-dna-foundation.json` as const;

export const SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_REPORT_PATH =
  'reports/source_video_numerical_dna/SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_REPORT.json' as const;
export const NUMERICAL_DNA_GAP_ANALYSIS_REPORT_PATH =
  'reports/source_video_numerical_dna/NUMERICAL_DNA_GAP_ANALYSIS_REPORT.json' as const;

const EXECUTION_FLAGS = {
  metadata_only: true as const,
  placeholder_only: true as const,
  gpu_execution: false as const,
  frame_extraction: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

const COVERAGE_TARGETS = {
  ghibli: 7,
  shinkai: 2,
  live_action: 1,
  mori: 5,
  total: 15,
} as const;

const SOURCE_VIDEO_DEFINITIONS: Array<{
  source_video_id: string;
  source_group: 'ghibli' | 'shinkai' | 'live_action' | 'mori';
  primary_source?: boolean;
}> = [
  { source_video_id: 'GHIBLI_01', source_group: 'ghibli', primary_source: true },
  { source_video_id: 'GHIBLI_02', source_group: 'ghibli' },
  { source_video_id: 'GHIBLI_03', source_group: 'ghibli' },
  { source_video_id: 'GHIBLI_04', source_group: 'ghibli' },
  { source_video_id: 'GHIBLI_05', source_group: 'ghibli' },
  { source_video_id: 'GHIBLI_06', source_group: 'ghibli' },
  { source_video_id: 'GHIBLI_07', source_group: 'ghibli' },
  { source_video_id: 'SHINKAI_01', source_group: 'shinkai', primary_source: true },
  { source_video_id: 'SHINKAI_02', source_group: 'shinkai' },
  { source_video_id: 'LITTLE_WOMEN_01', source_group: 'live_action', primary_source: true },
  { source_video_id: 'MORI_01', source_group: 'mori', primary_source: true },
  { source_video_id: 'MORI_02', source_group: 'mori' },
  { source_video_id: 'MORI_03', source_group: 'mori' },
  { source_video_id: 'MORI_04', source_group: 'mori' },
  { source_video_id: 'MORI_05', source_group: 'mori' },
];

const BUILDER_MODULES = [
  {
    extractor_id: 'frame_coordinates' as const,
    builder_module: 'services/sourceVideoNumericalDna/frameCoordinateExtraction.ts',
    build: buildFrameCoordinateExtractionPlaceholder,
  },
  {
    extractor_id: 'composition_coordinates' as const,
    builder_module: 'services/sourceVideoNumericalDna/compositionCoordinateExtraction.ts',
    build: buildCompositionCoordinateExtractionPlaceholder,
  },
  {
    extractor_id: 'camera_path' as const,
    builder_module: 'services/sourceVideoNumericalDna/cameraPathExtraction.ts',
    build: buildCameraPathExtractionPlaceholder,
  },
  {
    extractor_id: 'blocking_data' as const,
    builder_module: 'services/sourceVideoNumericalDna/blockingExtraction.ts',
    build: buildBlockingExtractionPlaceholder,
  },
  {
    extractor_id: 'motion_vectors' as const,
    builder_module: 'services/sourceVideoNumericalDna/motionVectorExtraction.ts',
    build: buildMotionVectorExtractionPlaceholder,
  },
  {
    extractor_id: 'edit_rhythm' as const,
    builder_module: 'services/sourceVideoNumericalDna/editRhythmExtraction.ts',
    build: buildEditRhythmExtractionPlaceholder,
  },
  {
    extractor_id: 'scene_remap' as const,
    builder_module: 'services/sourceVideoNumericalDna/sceneRemapEngine.ts',
    build: buildSceneRemapEnginePlaceholder,
  },
];

export interface SourceVideoNumericalDnaRegistryRecord {
  source_video_id: string;
  source_group: 'ghibli' | 'shinkai' | 'live_action' | 'mori';
  registry_status: 'registered';
  extraction_status: 'placeholder_only';
  metadata_only: true;
  placeholder_only: true;
  primary_source?: boolean;
}

export interface SourceVideoNumericalDnaRegistry {
  registry_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_SYSTEM_ID;
  version: 'foundation_v1';
  schema_path: typeof SOURCE_VIDEO_NUMERICAL_DNA_SCHEMA_PATH;
  metadata_only: true;
  placeholder_only: true;
  coverage: {
    ghibli: number;
    shinkai: number;
    live_action: number;
    mori: number;
    total: number;
    missing_records: number;
  };
  source_records: SourceVideoNumericalDnaRegistryRecord[];
  generated_at: string;
}

export interface ExtractorPlaceholderRef {
  extractor_id:
    | 'frame_coordinates'
    | 'composition_coordinates'
    | 'camera_path'
    | 'blocking_data'
    | 'motion_vectors'
    | 'edit_rhythm'
    | 'scene_remap';
  builder_module: string;
  placeholder_only: true;
  real_extraction_enabled: false;
  status: 'foundation_ready';
}

export interface SourceVideoNumericalDnaFoundationExport {
  foundation_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_SYSTEM_ID;
  version: 'foundation_v1';
  metadata_only: true;
  placeholder_only: true;
  numerical_dna_complete: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  schema_path: typeof SOURCE_VIDEO_NUMERICAL_DNA_SCHEMA_PATH;
  registry_path: typeof SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH;
  coverage: SourceVideoNumericalDnaRegistry['coverage'];
  source_records: SourceVideoNumericalDnaRegistryRecord[];
  extractor_placeholders: ExtractorPlaceholderRef[];
  execution_flags: typeof EXECUTION_FLAGS;
  generated_at: string;
}

export interface NumericalDnaGapAnalysisReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_SYSTEM_ID;
  generated_at: string;
  implemented: string[];
  placeholder_only: string[];
  not_implemented: string[];
}

export interface SourceVideoNumericalDnaFoundationReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof SOURCE_VIDEO_NUMERICAL_DNA_STATUS | 'SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_NOT_READY';
  validation_passed: boolean;
  metadata_only: true;
  placeholder_only: true;
  numerical_dna_complete: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  coverage: SourceVideoNumericalDnaRegistry['coverage'];
  checks: {
    dataset_dir_exists: boolean;
    schema_exists: boolean;
    registry_exists: boolean;
    all_builders_exist: boolean;
    export_exists: boolean;
    coverage_ghibli_7: boolean;
    coverage_shinkai_2: boolean;
    coverage_live_action_1: boolean;
    coverage_mori_5: boolean;
    missing_records_zero: boolean;
    gap_analysis_exists: boolean;
  };
  builder_modules: string[];
  output_paths: {
    registry: typeof SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH;
    export: typeof SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_EXPORT_PATH;
    foundation_report: typeof SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_REPORT_PATH;
    gap_analysis_report: typeof NUMERICAL_DNA_GAP_ANALYSIS_REPORT_PATH;
  };
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function countByGroup(records: SourceVideoNumericalDnaRegistryRecord[]): {
  ghibli: number;
  shinkai: number;
  live_action: number;
  mori: number;
} {
  return {
    ghibli: records.filter((record) => record.source_group === 'ghibli').length,
    shinkai: records.filter((record) => record.source_group === 'shinkai').length,
    live_action: records.filter((record) => record.source_group === 'live_action').length,
    mori: records.filter((record) => record.source_group === 'mori').length,
  };
}

export function buildSourceVideoNumericalDnaRegistry(): SourceVideoNumericalDnaRegistry {
  const source_records: SourceVideoNumericalDnaRegistryRecord[] = SOURCE_VIDEO_DEFINITIONS.map(
    (entry) => ({
      source_video_id: entry.source_video_id,
      source_group: entry.source_group,
      registry_status: 'registered' as const,
      extraction_status: 'placeholder_only' as const,
      metadata_only: true as const,
      placeholder_only: true as const,
      ...(entry.primary_source ? { primary_source: true } : {}),
    })
  );

  const groupCounts = countByGroup(source_records);
  const expectedTotal =
    COVERAGE_TARGETS.ghibli +
    COVERAGE_TARGETS.shinkai +
    COVERAGE_TARGETS.live_action +
    COVERAGE_TARGETS.mori;
  const missing_records = Math.max(0, expectedTotal - source_records.length);

  return {
    registry_id: 'source-video-numerical-dna-registry-v1',
    phase: SOURCE_VIDEO_NUMERICAL_DNA_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_SYSTEM_ID,
    version: 'foundation_v1',
    schema_path: SOURCE_VIDEO_NUMERICAL_DNA_SCHEMA_PATH,
    metadata_only: true,
    placeholder_only: true,
    coverage: {
      ghibli: groupCounts.ghibli,
      shinkai: groupCounts.shinkai,
      live_action: groupCounts.live_action,
      mori: groupCounts.mori,
      total: source_records.length,
      missing_records,
    },
    source_records,
    generated_at: new Date().toISOString(),
  };
}

export function buildExtractorPlaceholderRefs(): ExtractorPlaceholderRef[] {
  return BUILDER_MODULES.map((entry) => {
    entry.build();
    return {
      extractor_id: entry.extractor_id,
      builder_module: entry.builder_module,
      placeholder_only: true,
      real_extraction_enabled: false,
      status: 'foundation_ready',
    };
  });
}

export function buildSourceVideoNumericalDnaFoundationExport(
  registry: SourceVideoNumericalDnaRegistry
): SourceVideoNumericalDnaFoundationExport {
  return {
    foundation_id: 'source-video-numerical-dna-foundation-v1',
    phase: SOURCE_VIDEO_NUMERICAL_DNA_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_SYSTEM_ID,
    version: 'foundation_v1',
    metadata_only: true,
    placeholder_only: true,
    numerical_dna_complete: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    schema_path: SOURCE_VIDEO_NUMERICAL_DNA_SCHEMA_PATH,
    registry_path: SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH,
    coverage: registry.coverage,
    source_records: registry.source_records,
    extractor_placeholders: buildExtractorPlaceholderRefs(),
    execution_flags: { ...EXECUTION_FLAGS },
    generated_at: new Date().toISOString(),
  };
}

export function buildNumericalDnaGapAnalysisReport(): NumericalDnaGapAnalysisReport {
  return {
    report_id: `numerical_dna_gap_analysis_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_NUMERICAL_DNA_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    implemented: [],
    placeholder_only: [
      'frame_coordinates',
      'composition_coordinates',
      'camera_path',
      'blocking_data',
      'motion_vectors',
      'edit_rhythm',
      'scene_remap',
    ],
    not_implemented: ['real_numerical_extraction'],
  };
}

export function runSourceVideoNumericalDnaFoundationValidation(
  projectRoot?: string
): SourceVideoNumericalDnaFoundationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SourceVideoNumericalDnaFoundationReport['issues'] = [];

  fs.mkdirSync(path.join(root, SOURCE_VIDEO_NUMERICAL_DNA_DATASET_DIR), { recursive: true });

  const registry = buildSourceVideoNumericalDnaRegistry();
  writeJson(root, SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH, registry);

  const foundationExport = buildSourceVideoNumericalDnaFoundationExport(registry);
  writeJson(root, SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_EXPORT_PATH, foundationExport);

  const gapAnalysis = buildNumericalDnaGapAnalysisReport();
  writeJson(root, NUMERICAL_DNA_GAP_ANALYSIS_REPORT_PATH, gapAnalysis);

  const dataset_dir_exists = fs.existsSync(path.join(root, SOURCE_VIDEO_NUMERICAL_DNA_DATASET_DIR));
  const schema_exists = fs.existsSync(path.join(root, SOURCE_VIDEO_NUMERICAL_DNA_SCHEMA_PATH));
  const registry_exists = fs.existsSync(path.join(root, SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH));
  const export_exists = fs.existsSync(
    path.join(root, SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_EXPORT_PATH)
  );
  const gap_analysis_exists = fs.existsSync(path.join(root, NUMERICAL_DNA_GAP_ANALYSIS_REPORT_PATH));

  const builder_modules = BUILDER_MODULES.map((entry) => entry.builder_module);
  const all_builders_exist = builder_modules.every((rel) => fs.existsSync(path.join(root, rel)));

  const coverage_ghibli_7 = registry.coverage.ghibli === COVERAGE_TARGETS.ghibli;
  const coverage_shinkai_2 = registry.coverage.shinkai === COVERAGE_TARGETS.shinkai;
  const coverage_live_action_1 = registry.coverage.live_action === COVERAGE_TARGETS.live_action;
  const coverage_mori_5 = registry.coverage.mori === COVERAGE_TARGETS.mori;
  const missing_records_zero = registry.coverage.missing_records === 0;

  if (!dataset_dir_exists) {
    issues.push({ code: 'DATASET_DIR_MISSING', message: 'datasets/source_video_numerical_dna/ missing', severity: 'error' });
  }
  if (!schema_exists) {
    issues.push({ code: 'SCHEMA_MISSING', message: 'source-video-numerical-dna.schema.json missing', severity: 'error' });
  }
  if (!registry_exists) {
    issues.push({ code: 'REGISTRY_MISSING', message: 'source-video-numerical-dna-registry.json missing', severity: 'error' });
  }
  if (!all_builders_exist) {
    issues.push({ code: 'BUILDER_MISSING', message: 'One or more placeholder builder modules missing', severity: 'error' });
  }
  if (!export_exists) {
    issues.push({ code: 'EXPORT_MISSING', message: 'source-video-numerical-dna-foundation.json missing', severity: 'error' });
  }
  if (!coverage_ghibli_7) {
    issues.push({ code: 'COVERAGE_GHIBLI', message: 'ghibli coverage must be 7', severity: 'error' });
  }
  if (!coverage_shinkai_2) {
    issues.push({ code: 'COVERAGE_SHINKAI', message: 'shinkai coverage must be 2', severity: 'error' });
  }
  if (!coverage_live_action_1) {
    issues.push({ code: 'COVERAGE_LIVE_ACTION', message: 'live_action coverage must be 1', severity: 'error' });
  }
  if (!coverage_mori_5) {
    issues.push({ code: 'COVERAGE_MORI', message: 'mori coverage must be 5', severity: 'error' });
  }
  if (!missing_records_zero) {
    issues.push({ code: 'MISSING_RECORDS', message: 'missing_records must be 0', severity: 'error' });
  }
  if (!gap_analysis_exists) {
    issues.push({ code: 'GAP_ANALYSIS_MISSING', message: 'NUMERICAL_DNA_GAP_ANALYSIS_REPORT.json missing', severity: 'error' });
  }

  const expectedPlaceholderOnly = [
    'frame_coordinates',
    'composition_coordinates',
    'camera_path',
    'blocking_data',
    'motion_vectors',
    'edit_rhythm',
    'scene_remap',
  ];
  if (
    gapAnalysis.implemented.length !== 0 ||
    gapAnalysis.not_implemented.join(',') !== 'real_numerical_extraction' ||
    gapAnalysis.placeholder_only.join(',') !== expectedPlaceholderOnly.join(',')
  ) {
    issues.push({
      code: 'GAP_ANALYSIS_STRUCTURE',
      message: 'Gap analysis structure does not match expected foundation layout',
      severity: 'error',
    });
  }

  const validation_passed =
    dataset_dir_exists &&
    schema_exists &&
    registry_exists &&
    all_builders_exist &&
    export_exists &&
    coverage_ghibli_7 &&
    coverage_shinkai_2 &&
    coverage_live_action_1 &&
    coverage_mori_5 &&
    missing_records_zero &&
    gap_analysis_exists &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: `source_video_numerical_dna_foundation_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_NUMERICAL_DNA_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? SOURCE_VIDEO_NUMERICAL_DNA_PASS_VERDICT
      : SOURCE_VIDEO_NUMERICAL_DNA_FAIL_VERDICT,
    status: validation_passed
      ? SOURCE_VIDEO_NUMERICAL_DNA_STATUS
      : 'SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_NOT_READY',
    validation_passed,
    metadata_only: true,
    placeholder_only: true,
    numerical_dna_complete: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    coverage: registry.coverage,
    checks: {
      dataset_dir_exists,
      schema_exists,
      registry_exists,
      all_builders_exist,
      export_exists,
      coverage_ghibli_7,
      coverage_shinkai_2,
      coverage_live_action_1,
      coverage_mori_5,
      missing_records_zero,
      gap_analysis_exists,
    },
    builder_modules,
    output_paths: {
      registry: SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH,
      export: SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_EXPORT_PATH,
      foundation_report: SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_REPORT_PATH,
      gap_analysis_report: NUMERICAL_DNA_GAP_ANALYSIS_REPORT_PATH,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeSourceVideoNumericalDnaFoundationReport(
  projectRoot?: string
): SourceVideoNumericalDnaFoundationReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runSourceVideoNumericalDnaFoundationValidation(root);
  writeJson(root, SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_REPORT_PATH, report);
  return report;
}
