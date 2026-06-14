import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SOURCE_VIDEO_NUMERICAL_DNA_FULL_EXPORT_PATH,
  buildSourceVideoNumericalDnaFullExport,
  type SourceFullExtractionRecord,
  type SourceVideoNumericalDnaFullExport,
} from './sourceVideoNumericalDnaFullExtraction.js';
import { MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_REPORT_PATH } from './movieReconstructionConditioningArchitectureDecision.js';

export const CONDITIONING_MAP_EXPORT_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-004' as const;
export const CONDITIONING_MAP_EXPORT_SYSTEM_ID = 'CONDITIONING_MAP_EXPORT_V1' as const;
export const CONDITIONING_MAP_EXPORT_PASS_VERDICT =
  'PASS_CONDITIONING_MAP_EXPORT_V1' as const;
export const CONDITIONING_MAP_EXPORT_FAIL_VERDICT = 'FAIL_CONDITIONING_MAP_EXPORT_V1' as const;
export const CONDITIONING_MAP_EXPORT_STATUS = 'CONDITIONING_MAP_EXPORT_READY' as const;

export const CONDITIONING_MAP_EXPORT_DATASET_DIR =
  'datasets/movie_reconstruction_conditioning_map_export' as const;
export const CONDITIONING_MAP_EXPORT_CONTRACT_PATH =
  `${CONDITIONING_MAP_EXPORT_DATASET_DIR}/conditioning-map-export-contract.json` as const;

export const CONDITIONING_MAP_EXPORT_DIR = 'exports/movie_reconstruction_conditioning' as const;
export const CONDITIONING_MAP_EXPORT_BUNDLE_PATH =
  `${CONDITIONING_MAP_EXPORT_DIR}/conditioning-map-export-bundle.json` as const;

export const CONDITIONING_MAP_EXPORT_REPORT_PATH =
  'reports/movie_reconstruction/CONDITIONING_MAP_EXPORT_REPORT.json' as const;

const CONTRACT_VERSION = '1.0' as const;
const COVERAGE_TARGET = 15;
const ESTIMATED_BACKEND_COUNT = 3;

const EXECUTION_FLAGS = {
  contract_version: CONTRACT_VERSION,
  adapter_required: true as const,
  backend_independent_format: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  raster_maps_deferred: true as const,
  safe_create_only: true as const,
};

export interface ExportedLayoutMapFrame {
  frame_index: number;
  timestamp_ms: number;
  layout_elements: Array<{
    element_id: string;
    element_type: 'subject' | 'vanishing_point';
    normalized_x: number;
    normalized_y: number;
    depth_layer: 'foreground' | 'midground' | 'background';
  }>;
}

export interface ExportedDepthMapFrame {
  frame_index: number;
  timestamp_ms: number;
  depth_samples: Array<{
    element_id: string;
    z_normalized: number;
    depth_layer: 'foreground' | 'midground' | 'background';
  }>;
}

export interface ExportedPoseMapFrame {
  frame_index: number;
  characters: Array<{
    character_id: string;
    screen_position: [number, number];
    eyeline_vector: [number, number];
    keypoint_descriptor_ref: string;
  }>;
}

export interface ExportedBlockingMapFrame {
  frame_index: number;
  character_regions: Array<{
    character_id: string;
    screen_position: [number, number];
    depth_layer: 'foreground' | 'midground' | 'background';
    region_label: string;
  }>;
  interaction_pairs: string[];
}

export interface SourceConditioningMapExport {
  source_video_id: string;
  source_group: 'ghibli' | 'shinkai' | 'live_action' | 'mori';
  layout_map: {
    source_video_id: string;
    format: 'normalized_layout_elements_v1';
    frames: ExportedLayoutMapFrame[];
  };
  depth_map: {
    source_video_id: string;
    format: 'normalized_depth_samples_v1';
    frames: ExportedDepthMapFrame[];
  };
  pose_map: {
    source_video_id: string;
    format: 'skeleton_keypoint_descriptors_v1';
    frames: ExportedPoseMapFrame[];
  };
  blocking_map: {
    source_video_id: string;
    format: 'character_region_masks_v1';
    frames: ExportedBlockingMapFrame[];
  };
  environment_identity_map: {
    source_video_id: string;
    format: 'reserved_v1';
    status: 'reserved';
    reserved_for: 'environment_identity';
    scene_remap_ref: string;
  };
}

export interface ConditioningMapExportBundle {
  bundle_id: string;
  phase: typeof CONDITIONING_MAP_EXPORT_PHASE;
  system_id: typeof CONDITIONING_MAP_EXPORT_SYSTEM_ID;
  contract_version: typeof CONTRACT_VERSION;
  backend_independent: true;
  adapter_required: true;
  estimated_backend_count: typeof ESTIMATED_BACKEND_COUNT;
  conditioning_contract_defined: true;
  backend_independent_format_defined: true;
  layout_map_exportable: true;
  depth_map_exportable: true;
  pose_map_exportable: true;
  blocking_map_exportable: true;
  environment_identity_map_reserved: true;
  coverage: {
    total: number;
    missing_sources: number;
    export_coverage_ratio: number;
  };
  sources: SourceConditioningMapExport[];
  execution_flags: typeof EXECUTION_FLAGS;
  generated_at: string;
}

export interface ConditioningMapExportReport {
  report_id: string;
  phase: typeof CONDITIONING_MAP_EXPORT_PHASE;
  system_id: typeof CONDITIONING_MAP_EXPORT_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof CONDITIONING_MAP_EXPORT_STATUS | 'CONDITIONING_MAP_EXPORT_NOT_READY';
  validation_passed: boolean;
  conditioning_implemented: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  contract_version: typeof CONTRACT_VERSION;
  adapter_required: true;
  estimated_backend_count: typeof ESTIMATED_BACKEND_COUNT;
  conditioning_contract_defined: boolean;
  backend_independent_format_defined: boolean;
  layout_map_exportable: boolean;
  depth_map_exportable: boolean;
  pose_map_exportable: boolean;
  blocking_map_exportable: boolean;
  environment_identity_map_reserved: boolean;
  export_coverage_ratio: number;
  missing_sources: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
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

function loadFullExport(root: string): SourceVideoNumericalDnaFullExport {
  const existing = readJson<SourceVideoNumericalDnaFullExport>(
    root,
    SOURCE_VIDEO_NUMERICAL_DNA_FULL_EXPORT_PATH
  );
  if (
    existing &&
    existing.full_extraction_complete === true &&
    Array.isArray(existing.sources) &&
    existing.sources.length === COVERAGE_TARGET
  ) {
    return existing;
  }
  return buildSourceVideoNumericalDnaFullExport(root);
}

function depthLayerFromY(y: number): 'foreground' | 'midground' | 'background' {
  if (y > 0.55) return 'foreground';
  if (y > 0.35) return 'midground';
  return 'background';
}

function regionLabel(x: number): string {
  if (x < 0.4) return 'LEFT';
  if (x > 0.6) return 'RIGHT';
  return 'CENTER';
}

export function exportSourceConditioningMaps(
  source: SourceFullExtractionRecord
): SourceConditioningMapExport {
  const layoutFrames: ExportedLayoutMapFrame[] = source.frame_coordinates.frames.map(
    (frame, index) => {
      const composition = source.composition_coordinates.frames[index];
      const bbox = composition?.subject_bbox ?? [frame.normalized_x - 0.05, frame.normalized_y - 0.05, 0.1, 0.1];
      const [cx, cy] = [bbox[0] + bbox[2] / 2, bbox[1] + bbox[3] / 2];
      return {
        frame_index: frame.frame_index,
        timestamp_ms: frame.timestamp_ms,
        layout_elements: [
          {
            element_id: 'subject-primary',
            element_type: 'subject' as const,
            normalized_x: Number(cx.toFixed(4)),
            normalized_y: Number(cy.toFixed(4)),
            depth_layer: depthLayerFromY(cy),
          },
          {
            element_id: 'vanishing-primary',
            element_type: 'vanishing_point' as const,
            normalized_x: Number(frame.normalized_x.toFixed(4)),
            normalized_y: Number(frame.normalized_y.toFixed(4)),
            depth_layer: 'background' as const,
          },
        ],
      };
    }
  );

  const depthFrames: ExportedDepthMapFrame[] = source.blocking_data.frames.map((frame) => {
    const samples = frame.characters.map((character) => ({
      element_id: character.character_id,
      z_normalized: Number(
        (character.depth_layer === 'foreground'
          ? 0.2
          : character.depth_layer === 'midground'
            ? 0.5
            : 0.85
        ).toFixed(4)
      ),
      depth_layer: character.depth_layer,
    }));
    const frameCoord = source.frame_coordinates.frames.find(
      (entry) => entry.frame_index === frame.frame_index
    );
    return {
      frame_index: frame.frame_index,
      timestamp_ms: frameCoord?.timestamp_ms ?? 0,
      depth_samples: samples,
    };
  });

  const poseFrames: ExportedPoseMapFrame[] = source.blocking_data.frames.map((frame) => ({
    frame_index: frame.frame_index,
    characters: frame.characters.map((character) => ({
      character_id: character.character_id,
      screen_position: character.screen_position,
      eyeline_vector: character.eyeline_vector,
      keypoint_descriptor_ref: `pose_descriptor/${source.source_video_id}/frame_${frame.frame_index}/${character.character_id}.json`,
    })),
  }));

  const blockingFrames: ExportedBlockingMapFrame[] = source.blocking_data.frames.map((frame) => ({
    frame_index: frame.frame_index,
    character_regions: frame.characters.map((character) => ({
      character_id: character.character_id,
      screen_position: character.screen_position,
      depth_layer: character.depth_layer,
      region_label: regionLabel(character.screen_position[0]),
    })),
    interaction_pairs: frame.interaction_pairs,
  }));

  const primaryScene = source.scene_remap.scenes[0];

  return {
    source_video_id: source.source_video_id,
    source_group: source.source_group,
    layout_map: {
      source_video_id: source.source_video_id,
      format: 'normalized_layout_elements_v1',
      frames: layoutFrames,
    },
    depth_map: {
      source_video_id: source.source_video_id,
      format: 'normalized_depth_samples_v1',
      frames: depthFrames,
    },
    pose_map: {
      source_video_id: source.source_video_id,
      format: 'skeleton_keypoint_descriptors_v1',
      frames: poseFrames,
    },
    blocking_map: {
      source_video_id: source.source_video_id,
      format: 'character_region_masks_v1',
      frames: blockingFrames,
    },
    environment_identity_map: {
      source_video_id: source.source_video_id,
      format: 'reserved_v1',
      status: 'reserved',
      reserved_for: 'environment_identity',
      scene_remap_ref: primaryScene?.gonegi_scene_id ?? 'pending_scene_remap',
    },
  };
}

export function buildConditioningMapExportBundle(root: string): ConditioningMapExportBundle {
  const fullExport = loadFullExport(root);
  const sources = fullExport.sources.map(exportSourceConditioningMaps);
  const missing_sources = Math.max(0, COVERAGE_TARGET - sources.length);

  return {
    bundle_id: 'conditioning-map-export-bundle-v1',
    phase: CONDITIONING_MAP_EXPORT_PHASE,
    system_id: CONDITIONING_MAP_EXPORT_SYSTEM_ID,
    contract_version: CONTRACT_VERSION,
    backend_independent: true,
    adapter_required: true,
    estimated_backend_count: ESTIMATED_BACKEND_COUNT,
    conditioning_contract_defined: true,
    backend_independent_format_defined: true,
    layout_map_exportable: true,
    depth_map_exportable: true,
    pose_map_exportable: true,
    blocking_map_exportable: true,
    environment_identity_map_reserved: true,
    coverage: {
      total: sources.length,
      missing_sources,
      export_coverage_ratio: sources.length / COVERAGE_TARGET,
    },
    sources,
    execution_flags: { ...EXECUTION_FLAGS },
    generated_at: new Date().toISOString(),
  };
}

export function runConditioningMapExportValidation(
  projectRoot?: string
): ConditioningMapExportReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ConditioningMapExportReport['issues'] = [];

  const contractExists = fs.existsSync(path.join(root, CONDITIONING_MAP_EXPORT_CONTRACT_PATH));
  const architectureExists = fs.existsSync(
    path.join(root, MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_REPORT_PATH)
  );

  if (!contractExists) {
    issues.push({
      code: 'CONTRACT_MISSING',
      message: `Missing ${CONDITIONING_MAP_EXPORT_CONTRACT_PATH}`,
      severity: 'error',
    });
  }
  if (!architectureExists) {
    issues.push({
      code: 'ARCHITECTURE_PREREQUISITE',
      message: 'Architecture decision report required as prerequisite',
      severity: 'error',
    });
  }

  const bundle = buildConditioningMapExportBundle(root);
  writeJson(root, CONDITIONING_MAP_EXPORT_BUNDLE_PATH, bundle);

  const allSourcesComplete = bundle.sources.every(
    (source) =>
      source.layout_map.frames.length > 0 &&
      source.depth_map.frames.length > 0 &&
      source.pose_map.frames.length > 0 &&
      source.blocking_map.frames.length > 0 &&
      source.environment_identity_map.status === 'reserved'
  );

  const conditioning_contract_defined = contractExists;
  const backend_independent_format_defined = bundle.backend_independent === true;
  const layout_map_exportable = bundle.sources.every((s) => s.layout_map.frames.length > 0);
  const depth_map_exportable = bundle.sources.every((s) => s.depth_map.frames.length > 0);
  const pose_map_exportable = bundle.sources.every((s) => s.pose_map.frames.length > 0);
  const blocking_map_exportable = bundle.sources.every((s) => s.blocking_map.frames.length > 0);
  const environment_identity_map_reserved = bundle.sources.every(
    (s) => s.environment_identity_map.status === 'reserved'
  );
  const export_coverage_ratio = bundle.coverage.export_coverage_ratio;
  const missing_sources = bundle.coverage.missing_sources;

  if (missing_sources !== 0) {
    issues.push({ code: 'MISSING_SOURCES', message: 'missing_sources must be 0', severity: 'error' });
  }
  if (export_coverage_ratio !== 1) {
    issues.push({
      code: 'COVERAGE_RATIO',
      message: 'export_coverage_ratio must be 1.0',
      severity: 'error',
    });
  }
  if (!allSourcesComplete) {
    issues.push({
      code: 'INCOMPLETE_EXPORT',
      message: 'All sources must have complete map exports',
      severity: 'error',
    });
  }

  const validation_passed =
    conditioning_contract_defined &&
    backend_independent_format_defined &&
    layout_map_exportable &&
    depth_map_exportable &&
    pose_map_exportable &&
    blocking_map_exportable &&
    environment_identity_map_reserved &&
    export_coverage_ratio === 1 &&
    missing_sources === 0 &&
    allSourcesComplete &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: ConditioningMapExportReport = {
    report_id: `conditioning_map_export_${Date.now().toString(36)}`,
    phase: CONDITIONING_MAP_EXPORT_PHASE,
    system_id: CONDITIONING_MAP_EXPORT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed ? CONDITIONING_MAP_EXPORT_PASS_VERDICT : CONDITIONING_MAP_EXPORT_FAIL_VERDICT,
    status: validation_passed ? CONDITIONING_MAP_EXPORT_STATUS : 'CONDITIONING_MAP_EXPORT_NOT_READY',
    validation_passed,
    conditioning_implemented: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    contract_version: CONTRACT_VERSION,
    adapter_required: true,
    estimated_backend_count: ESTIMATED_BACKEND_COUNT,
    conditioning_contract_defined,
    backend_independent_format_defined,
    layout_map_exportable,
    depth_map_exportable,
    pose_map_exportable,
    blocking_map_exportable,
    environment_identity_map_reserved,
    export_coverage_ratio,
    missing_sources,
    checks: {
      conditioning_contract_defined,
      backend_independent_format_defined,
      layout_map_exportable,
      depth_map_exportable,
      pose_map_exportable,
      blocking_map_exportable,
      environment_identity_map_reserved,
      export_coverage_ratio_one: export_coverage_ratio === 1,
      missing_sources_zero: missing_sources === 0,
      all_sources_complete: allSourcesComplete,
      adapter_required: true,
      estimated_backend_count_three: ESTIMATED_BACKEND_COUNT === 3,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, CONDITIONING_MAP_EXPORT_REPORT_PATH, report);
  return report;
}

export function writeConditioningMapExportReport(
  projectRoot?: string
): ConditioningMapExportReport {
  return runConditioningMapExportValidation(projectRoot);
}
