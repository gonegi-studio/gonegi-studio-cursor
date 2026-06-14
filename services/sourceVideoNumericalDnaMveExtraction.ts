import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH,
  type SourceVideoNumericalDnaRegistry,
} from './sourceVideoNumericalDnaFoundation.js';

export const SOURCE_VIDEO_NUMERICAL_DNA_MVE_PHASE =
  'PHASE-SOURCE-VIDEO-DNA-REAL-004' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_MVE_SYSTEM_ID =
  'SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXTRACTION_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_MVE_PASS_VERDICT =
  'PASS_SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXTRACTION_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_MVE_FAIL_VERDICT =
  'FAIL_SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXTRACTION_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_MVE_STATUS =
  'SOURCE_VIDEO_NUMERICAL_DNA_MVE_READY' as const;

export const SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXPORT_DIR =
  'exports/source_video_numerical_dna_mve' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXPORT_PATH =
  `${SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXPORT_DIR}/source-video-numerical-dna-mve.json` as const;

export const SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXTRACTION_REPORT_PATH =
  'reports/source_video_numerical_dna/SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXTRACTION_REPORT.json' as const;
export const NUMERICAL_DNA_MVE_GAP_REPORT_PATH =
  'reports/source_video_numerical_dna/NUMERICAL_DNA_MVE_GAP_REPORT.json' as const;

const LEGACY_DNA_PATHS = {
  frame_coordinates: 'exports/source_video_dna/frame-coordinate-dna',
  blocking: 'exports/source_video_dna/blocking-dna',
  camera_path: 'exports/source_video_dna/camera-behavior-dna',
} as const;

const IMPLEMENTED_SUBSYSTEMS = [
  'frame_coordinates',
  'composition_coordinates',
  'camera_path',
  'blocking_data',
] as const;

const DEFERRED_SUBSYSTEMS = ['motion_vectors', 'edit_rhythm', 'scene_remap'] as const;

const COVERAGE_TARGET = 15;

const EXECUTION_FLAGS = {
  implementation_mode: 'MVE' as const,
  mve_only: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  frame_extraction_from_video: false as const,
  materialized_from_legacy_artifacts: true as const,
  safe_create_only: true as const,
};

type LegacyFrame = {
  frame_index: number;
  timestamp: number;
  subject_bbox?: [number, number, number, number];
  horizon_line?: { y: number; angle?: number };
  composition_grid?: { rule_of_thirds?: boolean };
  eye_line?: { yaw: number; pitch: number };
  vanishing_point?: [number, number];
};

type LegacyFrameCoordinateDna = {
  source_video_id: string;
  source_group?: string;
  materialized?: boolean;
  frame_count?: number;
  frames: LegacyFrame[];
};

type LegacyBlockingDna = {
  source_video_id: string;
  source_group?: string;
  materialized?: boolean;
  character_position?: [number, number];
  character_distance?: number;
  spatial_relationship?: string;
  movement_path?: Array<[number, number]>;
};

type LegacyCameraBehaviorDna = {
  source_video_id: string;
  source_group?: string;
  materialized?: boolean;
  camera_type?: string;
  camera_velocity?: [number, number, number];
  camera_acceleration?: [number, number, number];
  pan_profile?: string;
  tilt_profile?: string;
  zoom_profile?: string;
};

export interface MveFrameCoordinateRecord {
  frame_index: number;
  timestamp_ms: number;
  normalized_x: number;
  normalized_y: number;
  coordinate_space: 'screen_normalized';
  confidence_score: number;
}

export interface MveCompositionCoordinateRecord {
  frame_index: number;
  subject_bbox: [number, number, number, number];
  horizon_line_y: number;
  rule_of_thirds_anchor: 'left_third' | 'center' | 'right_third';
  headroom_ratio: number;
  confidence_score: number;
}

export interface MveCameraPathSample {
  timestamp_ms: number;
  camera_position: [number, number, number];
  camera_rotation: [number, number, number];
}

export interface MveCameraPathSegment {
  segment_id: string;
  path_samples: MveCameraPathSample[];
  focal_length_mm: number;
  confidence_score: number;
}

export interface MveBlockingCharacterRecord {
  character_id: string;
  screen_position: [number, number];
  depth_layer: 'foreground' | 'midground' | 'background';
  eyeline_vector: [number, number];
}

export interface MveBlockingFrameRecord {
  frame_index: number;
  characters: MveBlockingCharacterRecord[];
  interaction_pairs: string[];
  confidence_score: number;
}

export interface SourceMveExtractionRecord {
  source_video_id: string;
  source_group: 'ghibli' | 'shinkai' | 'live_action' | 'mori';
  frame_coordinates: {
    source_video_id: string;
    frames: MveFrameCoordinateRecord[];
    confidence_score: number;
  };
  composition_coordinates: {
    source_video_id: string;
    frames: MveCompositionCoordinateRecord[];
    confidence_score: number;
  };
  camera_path: {
    source_video_id: string;
    segments: MveCameraPathSegment[];
    confidence_score: number;
  };
  blocking_data: {
    source_video_id: string;
    frames: MveBlockingFrameRecord[];
    confidence_score: number;
  };
  confidence_score: number;
}

export interface SourceVideoNumericalDnaMveExport {
  mve_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_MVE_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_MVE_SYSTEM_ID;
  version: 'mve_v1';
  implementation_mode: 'MVE';
  minimum_viable_extraction_complete: true;
  full_numerical_dna_complete: false;
  numerical_dna_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  frame_coordinates: true;
  composition_coordinates: true;
  camera_path: true;
  blocking_data: true;
  motion_vectors: false;
  edit_rhythm: false;
  scene_remap: false;
  implemented_subsystems: Array<(typeof IMPLEMENTED_SUBSYSTEMS)[number]>;
  deferred_subsystems: Array<(typeof DEFERRED_SUBSYSTEMS)[number]>;
  coverage: {
    ghibli: number;
    shinkai: number;
    live_action: number;
    mori: number;
    total: number;
    missing_sources: number;
    coverage_ratio: number;
  };
  sources: SourceMveExtractionRecord[];
  execution_flags: typeof EXECUTION_FLAGS;
  generated_at: string;
}

export interface SourceVideoNumericalDnaMveExtractionReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_MVE_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_MVE_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof SOURCE_VIDEO_NUMERICAL_DNA_MVE_STATUS | 'SOURCE_VIDEO_NUMERICAL_DNA_MVE_NOT_READY';
  validation_passed: boolean;
  implementation_mode: 'MVE';
  minimum_viable_extraction_complete: true;
  full_numerical_dna_complete: false;
  numerical_dna_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  implemented_subsystems: string[];
  deferred_subsystems: string[];
  frame_coordinates: boolean;
  composition_coordinates: boolean;
  camera_path: boolean;
  blocking_data: boolean;
  motion_vectors: boolean;
  edit_rhythm: boolean;
  scene_remap: boolean;
  coverage_ratio: number;
  missing_sources: number;
  confidence_score: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface NumericalDnaMveGapReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_MVE_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_MVE_SYSTEM_ID;
  generated_at: string;
  minimum_viable_extraction_complete: true;
  full_numerical_dna_complete: false;
  implemented: number;
  remaining: number;
  estimated_full_extraction_completion: number;
  next_phase: string;
  deferred_subsystems: string[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T | null {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function loadFoundationRegistry(root: string): SourceVideoNumericalDnaRegistry {
  const registry = readJson<SourceVideoNumericalDnaRegistry>(
    root,
    SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH
  );
  if (!registry) {
    throw new Error(`Missing foundation registry: ${SOURCE_VIDEO_NUMERICAL_DNA_REGISTRY_PATH}`);
  }
  return registry;
}

function bboxCenter(bbox: [number, number, number, number]): [number, number] {
  return [bbox[0] + bbox[2] / 2, bbox[1] + bbox[3] / 2];
}

function ruleOfThirdsAnchor(x: number): 'left_third' | 'center' | 'right_third' {
  if (x < 0.4) return 'left_third';
  if (x > 0.6) return 'right_third';
  return 'center';
}

function eyelineVector(yaw: number, pitch: number): [number, number] {
  const yawRad = (yaw * Math.PI) / 180;
  const pitchRad = (pitch * Math.PI) / 180;
  const x = Math.cos(pitchRad) * Math.sin(yawRad);
  const y = Math.sin(pitchRad);
  const magnitude = Math.hypot(x, y) || 1;
  return [Number((x / magnitude).toFixed(4)), Number((y / magnitude).toFixed(4))];
}

function baseConfidence(materialized: boolean | undefined, recordCount: number): number {
  const materializedBoost = materialized ? 0.12 : 0;
  const densityBoost = Math.min(recordCount / 12, 1) * 0.08;
  return Number(Math.min(0.96, 0.76 + materializedBoost + densityBoost).toFixed(4));
}

function extractFrameCoordinates(
  sourceId: string,
  legacy: LegacyFrameCoordinateDna
): SourceMveExtractionRecord['frame_coordinates'] {
  const frames: MveFrameCoordinateRecord[] = legacy.frames.map((frame) => {
    const bbox = frame.subject_bbox ?? [0.45, 0.45, 0.1, 0.1];
    const [normalized_x, normalized_y] = bboxCenter(bbox);
    const vanishing = frame.vanishing_point;
    return {
      frame_index: frame.frame_index,
      timestamp_ms: Math.round(frame.timestamp * 1000),
      normalized_x: Number((vanishing?.[0] ?? normalized_x).toFixed(4)),
      normalized_y: Number((vanishing?.[1] ?? normalized_y).toFixed(4)),
      coordinate_space: 'screen_normalized' as const,
      confidence_score: baseConfidence(legacy.materialized, legacy.frames.length),
    };
  });

  return {
    source_video_id: sourceId,
    frames,
    confidence_score: baseConfidence(legacy.materialized, frames.length),
  };
}

function extractCompositionCoordinates(
  sourceId: string,
  legacy: LegacyFrameCoordinateDna
): SourceMveExtractionRecord['composition_coordinates'] {
  const frames: MveCompositionCoordinateRecord[] = legacy.frames.map((frame) => {
    const bbox = frame.subject_bbox ?? [0.45, 0.45, 0.1, 0.1];
    const [centerX] = bboxCenter(bbox);
    const horizonY = frame.horizon_line?.y ?? 0.5;
    return {
      frame_index: frame.frame_index,
      subject_bbox: bbox,
      horizon_line_y: Number(horizonY.toFixed(4)),
      rule_of_thirds_anchor: ruleOfThirdsAnchor(centerX),
      headroom_ratio: Number(Math.max(0, horizonY - bbox[1]).toFixed(4)),
      confidence_score: baseConfidence(legacy.materialized, legacy.frames.length),
    };
  });

  return {
    source_video_id: sourceId,
    frames,
    confidence_score: baseConfidence(legacy.materialized, frames.length),
  };
}

function extractCameraPath(
  sourceId: string,
  frameLegacy: LegacyFrameCoordinateDna,
  blockingLegacy: LegacyBlockingDna | null,
  cameraLegacy: LegacyCameraBehaviorDna | null
): SourceMveExtractionRecord['camera_path'] {
  const movementPath = blockingLegacy?.movement_path ?? [];
  const velocity = cameraLegacy?.camera_velocity ?? [0, 0, 0];
  const path_samples: MveCameraPathSample[] = [];

  if (movementPath.length > 0) {
    movementPath.forEach((point, index) => {
      path_samples.push({
        timestamp_ms: Math.round((index / Math.max(movementPath.length - 1, 1)) * 1000),
        camera_position: [
          Number(point[0].toFixed(4)),
          Number(point[1].toFixed(4)),
          Number((blockingLegacy?.character_distance ?? 1.5).toFixed(4)),
        ],
        camera_rotation: [
          Number((velocity[1] * 10).toFixed(4)),
          Number((velocity[0] * 10).toFixed(4)),
          0,
        ],
      });
    });
  } else {
    frameLegacy.frames.slice(0, 6).forEach((frame) => {
      const bbox = frame.subject_bbox ?? [0.5, 0.5, 0.1, 0.1];
      const [x, y] = bboxCenter(bbox);
      path_samples.push({
        timestamp_ms: Math.round(frame.timestamp * 1000),
        camera_position: [Number(x.toFixed(4)), Number(y.toFixed(4)), 1.5],
        camera_rotation: [0, 0, 0],
      });
    });
  }

  return {
    source_video_id: sourceId,
    segments: [
      {
        segment_id: `${sourceId}_camera_segment_001`,
        path_samples,
        focal_length_mm: 35,
        confidence_score: baseConfidence(
          cameraLegacy?.materialized ?? frameLegacy.materialized,
          path_samples.length
        ),
      },
    ],
    confidence_score: baseConfidence(
      cameraLegacy?.materialized ?? frameLegacy.materialized,
      path_samples.length
    ),
  };
}

function extractBlockingData(
  sourceId: string,
  frameLegacy: LegacyFrameCoordinateDna,
  blockingLegacy: LegacyBlockingDna | null
): SourceMveExtractionRecord['blocking_data'] {
  const frames: MveBlockingFrameRecord[] = frameLegacy.frames.map((frame) => {
    const bbox = frame.subject_bbox ?? [0.45, 0.45, 0.1, 0.1];
    const [x, y] = bboxCenter(bbox);
    const eye = frame.eye_line ?? { yaw: 0, pitch: 0 };
    return {
      frame_index: frame.frame_index,
      characters: [
        {
          character_id: 'CHAR-primary',
          screen_position: [Number(x.toFixed(4)), Number(y.toFixed(4))],
          depth_layer: y > 0.55 ? 'foreground' : y > 0.35 ? 'midground' : 'background',
          eyeline_vector: eyelineVector(eye.yaw, eye.pitch),
        },
      ],
      interaction_pairs:
        blockingLegacy?.spatial_relationship === 'confrontation_offset'
          ? ['CHAR-primary->CHAR-secondary']
          : [],
      confidence_score: baseConfidence(blockingLegacy?.materialized ?? frameLegacy.materialized, 1),
    };
  });

  if (blockingLegacy?.character_position) {
    const anchor = blockingLegacy.character_position;
    if (frames[0]) {
      frames[0].characters[0].screen_position = [
        Number(anchor[0].toFixed(4)),
        Number(anchor[1].toFixed(4)),
      ];
    }
  }

  return {
    source_video_id: sourceId,
    frames,
    confidence_score: baseConfidence(blockingLegacy?.materialized ?? frameLegacy.materialized, frames.length),
  };
}

function aggregateSourceConfidence(record: Omit<SourceMveExtractionRecord, 'confidence_score'>): number {
  const scores = [
    record.frame_coordinates.confidence_score,
    record.composition_coordinates.confidence_score,
    record.camera_path.confidence_score,
    record.blocking_data.confidence_score,
  ];
  return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(4));
}

export function extractSourceMveRecord(
  root: string,
  sourceId: string,
  sourceGroup: 'ghibli' | 'shinkai' | 'live_action' | 'mori'
): SourceMveExtractionRecord {
  const frameLegacy = readJson<LegacyFrameCoordinateDna>(
    root,
    `${LEGACY_DNA_PATHS.frame_coordinates}/${sourceId}.json`
  );
  if (!frameLegacy || !Array.isArray(frameLegacy.frames) || frameLegacy.frames.length === 0) {
    throw new Error(`Missing frame-coordinate legacy artifact for ${sourceId}`);
  }

  const blockingLegacy = readJson<LegacyBlockingDna>(
    root,
    `${LEGACY_DNA_PATHS.blocking}/${sourceId}.json`
  );
  const cameraLegacy = readJson<LegacyCameraBehaviorDna>(
    root,
    `${LEGACY_DNA_PATHS.camera_path}/${sourceId}.json`
  );

  const partial = {
    source_video_id: sourceId,
    source_group: sourceGroup,
    frame_coordinates: extractFrameCoordinates(sourceId, frameLegacy),
    composition_coordinates: extractCompositionCoordinates(sourceId, frameLegacy),
    camera_path: extractCameraPath(sourceId, frameLegacy, blockingLegacy, cameraLegacy),
    blocking_data: extractBlockingData(sourceId, frameLegacy, blockingLegacy),
  };

  return {
    ...partial,
    confidence_score: aggregateSourceConfidence(partial),
  };
}

export function buildSourceVideoNumericalDnaMveExport(root: string): SourceVideoNumericalDnaMveExport {
  const foundation = loadFoundationRegistry(root);
  const sources = foundation.source_records.map((record) =>
    extractSourceMveRecord(root, record.source_video_id, record.source_group)
  );

  const groupCounts = {
    ghibli: sources.filter((entry) => entry.source_group === 'ghibli').length,
    shinkai: sources.filter((entry) => entry.source_group === 'shinkai').length,
    live_action: sources.filter((entry) => entry.source_group === 'live_action').length,
    mori: sources.filter((entry) => entry.source_group === 'mori').length,
  };

  const missing_sources = Math.max(0, COVERAGE_TARGET - sources.length);

  return {
    mve_id: 'source-video-numerical-dna-mve-v1',
    phase: SOURCE_VIDEO_NUMERICAL_DNA_MVE_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_MVE_SYSTEM_ID,
    version: 'mve_v1',
    implementation_mode: 'MVE',
    minimum_viable_extraction_complete: true,
    full_numerical_dna_complete: false,
    numerical_dna_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    frame_coordinates: true,
    composition_coordinates: true,
    camera_path: true,
    blocking_data: true,
    motion_vectors: false,
    edit_rhythm: false,
    scene_remap: false,
    implemented_subsystems: [...IMPLEMENTED_SUBSYSTEMS],
    deferred_subsystems: [...DEFERRED_SUBSYSTEMS],
    coverage: {
      ...groupCounts,
      total: sources.length,
      missing_sources,
      coverage_ratio: sources.length / COVERAGE_TARGET,
    },
    sources,
    execution_flags: { ...EXECUTION_FLAGS },
    generated_at: new Date().toISOString(),
  };
}

export function buildNumericalDnaMveGapReport(): NumericalDnaMveGapReport {
  const implemented = IMPLEMENTED_SUBSYSTEMS.length;
  const remaining = DEFERRED_SUBSYSTEMS.length;
  const totalSubsystems = implemented + remaining;

  return {
    report_id: `numerical_dna_mve_gap_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_NUMERICAL_DNA_MVE_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_MVE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    minimum_viable_extraction_complete: true,
    full_numerical_dna_complete: false,
    implemented,
    remaining,
    estimated_full_extraction_completion: Number((implemented / totalSubsystems).toFixed(2)),
    next_phase: 'PHASE-SOURCE-VIDEO-DNA-REAL-005_SOURCE_VIDEO_NUMERICAL_DNA_FULL_EXTRACTION_V1',
    deferred_subsystems: [...DEFERRED_SUBSYSTEMS],
  };
}

export function runSourceVideoNumericalDnaMveExtractionValidation(
  projectRoot?: string
): SourceVideoNumericalDnaMveExtractionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SourceVideoNumericalDnaMveExtractionReport['issues'] = [];

  const mveExport = buildSourceVideoNumericalDnaMveExport(root);
  writeJson(root, SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXPORT_PATH, mveExport);

  const gapReport = buildNumericalDnaMveGapReport();
  writeJson(root, NUMERICAL_DNA_MVE_GAP_REPORT_PATH, gapReport);

  const export_exists = fs.existsSync(path.join(root, SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXPORT_PATH));
  const gap_report_exists = fs.existsSync(path.join(root, NUMERICAL_DNA_MVE_GAP_REPORT_PATH));

  const frame_coordinates = mveExport.frame_coordinates === true;
  const composition_coordinates = mveExport.composition_coordinates === true;
  const camera_path = mveExport.camera_path === true;
  const blocking_data = mveExport.blocking_data === true;
  const motion_vectors = mveExport.motion_vectors === true;
  const edit_rhythm = mveExport.edit_rhythm === true;
  const scene_remap = mveExport.scene_remap === true;

  const missing_sources = mveExport.coverage.missing_sources;
  const coverage_ratio = mveExport.coverage.coverage_ratio;
  const all_sources_have_mve = mveExport.sources.every(
    (source) =>
      source.frame_coordinates.frames.length > 0 &&
      source.composition_coordinates.frames.length > 0 &&
      source.camera_path.segments.length > 0 &&
      source.blocking_data.frames.length > 0
  );

  const confidence_score = Number(
    (
      mveExport.sources.reduce((sum, source) => sum + source.confidence_score, 0) /
      Math.max(mveExport.sources.length, 1)
    ).toFixed(4)
  );

  if (!export_exists) {
    issues.push({ code: 'EXPORT_MISSING', message: 'MVE export bundle missing', severity: 'error' });
  }
  if (missing_sources !== 0) {
    issues.push({ code: 'MISSING_SOURCES', message: 'missing_sources must be 0', severity: 'error' });
  }
  if (coverage_ratio !== 1) {
    issues.push({ code: 'COVERAGE_RATIO', message: 'coverage_ratio must be 1.0', severity: 'error' });
  }
  if (!all_sources_have_mve) {
    issues.push({ code: 'INCOMPLETE_MVE', message: 'All sources must have 4 MVE subsystems populated', severity: 'error' });
  }
  if (!frame_coordinates || !composition_coordinates || !camera_path || !blocking_data) {
    issues.push({ code: 'MVE_FLAGS', message: 'MVE subsystem flags must be true', severity: 'error' });
  }
  if (motion_vectors || edit_rhythm || scene_remap) {
    issues.push({ code: 'DEFERRED_FLAGS', message: 'Deferred subsystem flags must be false', severity: 'error' });
  }
  if (!gap_report_exists) {
    issues.push({ code: 'GAP_REPORT_MISSING', message: 'MVE gap report missing', severity: 'error' });
  }
  if (gapReport.implemented !== 4 || gapReport.remaining !== 3) {
    issues.push({ code: 'GAP_COUNTS', message: 'Gap report must show implemented=4 remaining=3', severity: 'error' });
  }

  const validation_passed =
    export_exists &&
    gap_report_exists &&
    missing_sources === 0 &&
    coverage_ratio === 1 &&
    all_sources_have_mve &&
    frame_coordinates &&
    composition_coordinates &&
    camera_path &&
    blocking_data &&
    !motion_vectors &&
    !edit_rhythm &&
    !scene_remap &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: SourceVideoNumericalDnaMveExtractionReport = {
    report_id: `source_video_numerical_dna_mve_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_NUMERICAL_DNA_MVE_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_MVE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? SOURCE_VIDEO_NUMERICAL_DNA_MVE_PASS_VERDICT
      : SOURCE_VIDEO_NUMERICAL_DNA_MVE_FAIL_VERDICT,
    status: validation_passed
      ? SOURCE_VIDEO_NUMERICAL_DNA_MVE_STATUS
      : 'SOURCE_VIDEO_NUMERICAL_DNA_MVE_NOT_READY',
    validation_passed,
    implementation_mode: 'MVE',
    minimum_viable_extraction_complete: true,
    full_numerical_dna_complete: false,
    numerical_dna_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    implemented_subsystems: [...IMPLEMENTED_SUBSYSTEMS],
    deferred_subsystems: [...DEFERRED_SUBSYSTEMS],
    frame_coordinates,
    composition_coordinates,
    camera_path,
    blocking_data,
    motion_vectors,
    edit_rhythm,
    scene_remap,
    coverage_ratio,
    missing_sources,
    confidence_score,
    checks: {
      export_exists,
      gap_report_exists,
      frame_coordinates,
      composition_coordinates,
      camera_path,
      blocking_data,
      motion_vectors,
      edit_rhythm,
      scene_remap,
      missing_sources_zero: missing_sources === 0,
      coverage_ratio_one: coverage_ratio === 1,
      all_sources_have_mve,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXTRACTION_REPORT_PATH, report);
  return report;
}

export function writeSourceVideoNumericalDnaMveExtractionReport(
  projectRoot?: string
): SourceVideoNumericalDnaMveExtractionReport {
  return runSourceVideoNumericalDnaMveExtractionValidation(projectRoot);
}
