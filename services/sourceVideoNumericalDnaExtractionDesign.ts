import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  NUMERICAL_EXTRACTION_FEASIBILITY_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REGISTRY_PATH,
} from './sourceVideoNumericalDnaAudit.js';

export const SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE =
  'PHASE-SOURCE-VIDEO-DNA-REAL-003' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SYSTEM_ID =
  'SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PASS_VERDICT =
  'PASS_SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_FAIL_VERDICT =
  'FAIL_SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_V1' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_STATUS =
  'SOURCE_VIDEO_NUMERICAL_DNA_DESIGNED' as const;

export const SOURCE_VIDEO_NUMERICAL_DNA_DESIGN_DATASET_DIR =
  'datasets/source_video_numerical_dna_design' as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SCHEMA_PATH =
  `${SOURCE_VIDEO_NUMERICAL_DNA_DESIGN_DATASET_DIR}/source-video-numerical-extraction-design.schema.json` as const;
export const SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_MANIFEST_PATH =
  `${SOURCE_VIDEO_NUMERICAL_DNA_DESIGN_DATASET_DIR}/source-video-numerical-extraction-design-manifest.json` as const;

export const SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_REPORT_PATH =
  'reports/source_video_numerical_dna/SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_REPORT.json' as const;
export const NUMERICAL_DNA_EXTRACTION_SPECIFICATION_PATH =
  'reports/source_video_numerical_dna/NUMERICAL_DNA_EXTRACTION_SPECIFICATION.json' as const;
export const NUMERICAL_DNA_REAL_EXTRACTION_GAP_REPORT_PATH =
  'reports/source_video_numerical_dna/NUMERICAL_DNA_REAL_EXTRACTION_GAP_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  metadata_only: true as const,
  gpu_execution: false as const,
  frame_extraction: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export type SubsystemId =
  | 'frame_coordinates'
  | 'composition_coordinates'
  | 'camera_path'
  | 'blocking_data'
  | 'motion_vectors'
  | 'edit_rhythm'
  | 'scene_remap';

export interface SubsystemExtractionDesign {
  subsystem_id: SubsystemId;
  input_source: string;
  output_structure: string;
  required_fields: string[];
  confidence_method: string;
  validation_method: string;
  failure_conditions: string[];
}

export interface SourceVideoNumericalExtractionDesignManifest {
  design_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SYSTEM_ID;
  version: 'extraction_design_v1';
  design_only: true;
  metadata_only: true;
  extraction_design_complete: true;
  numerical_dna_extracted: false;
  numerical_dna_complete: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  schema_path: typeof SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SCHEMA_PATH;
  audit_registry_ref: typeof SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REGISTRY_PATH;
  feasibility_report_ref: typeof NUMERICAL_EXTRACTION_FEASIBILITY_REPORT_PATH;
  subsystems: SubsystemExtractionDesign[];
  generated_at: string;
}

export interface MinimumViableExtraction {
  frame_coordinates: boolean;
  composition_coordinates: boolean;
  camera_path: boolean;
  blocking_data: boolean;
  motion_vectors: boolean;
  edit_rhythm: boolean;
  scene_remap: boolean;
}

export interface NumericalDnaExtractionSpecification {
  specification_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SYSTEM_ID;
  generated_at: string;
  design_only: true;
  extraction_design_complete: true;
  numerical_dna_extracted: false;
  numerical_dna_complete: false;
  field_definitions: Record<string, string>;
  data_shapes: Record<string, string>;
  audit_requirements: string[];
  future_verify_requirements: string[];
  minimum_viable_extraction: MinimumViableExtraction;
}

export interface NumericalDnaRealExtractionGapReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SYSTEM_ID;
  generated_at: string;
  design_complete: true;
  implementation_complete: false;
  extraction_design_complete: true;
  numerical_dna_extracted: false;
  numerical_dna_complete: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  remaining_work: string[];
}

export interface SourceVideoNumericalDnaExtractionDesignReport {
  report_id: string;
  phase: typeof SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE;
  system_id: typeof SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_STATUS
    | 'SOURCE_VIDEO_NUMERICAL_DNA_DESIGN_NOT_READY';
  validation_passed: boolean;
  extraction_design_complete: true;
  numerical_dna_extracted: false;
  numerical_dna_complete: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  all_7_subsystems_designed: boolean;
  validation_methods_defined: boolean;
  failure_conditions_defined: boolean;
  minimum_viable_extraction_defined: boolean;
  specification_exists: boolean;
  gap_report_exists: boolean;
  subsystems: SubsystemExtractionDesign[];
  checks: {
    design_dataset_exists: boolean;
    schema_exists: boolean;
    manifest_exists: boolean;
    all_7_subsystems_designed: boolean;
    validation_methods_defined: boolean;
    failure_conditions_defined: boolean;
    minimum_viable_extraction_defined: boolean;
    specification_exists: boolean;
    gap_report_exists: boolean;
  };
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

const SUBSYSTEM_DESIGNS: SubsystemExtractionDesign[] = [
  {
    subsystem_id: 'frame_coordinates',
    input_source:
      'imports/source_videos/{source_video_id}.mp4 + frame_sampling_plan + scene_detection_segments',
    output_structure:
      'exports/source_video_numerical_dna/{source_video_id}/frame-coordinates.json',
    required_fields: [
      'source_video_id',
      'frame_index',
      'timestamp_ms',
      'normalized_x',
      'normalized_y',
      'coordinate_space',
      'confidence_score',
    ],
    confidence_method:
      'Weighted blend of sampling coverage ratio, scene boundary alignment, and cross-frame temporal consistency score.',
    validation_method:
      'Verify required fields present, timestamps monotonic, coordinates within [0,1], confidence_score >= threshold per frame.',
    failure_conditions: [
      'frame_index_missing',
      'timestamp_not_monotonic',
      'coordinate_out_of_bounds',
      'confidence_below_threshold',
      'sampling_coverage_insufficient',
    ],
  },
  {
    subsystem_id: 'composition_coordinates',
    input_source:
      'frame_coordinates.json + subject_detection_candidates + horizon_line_estimates',
    output_structure:
      'exports/source_video_numerical_dna/{source_video_id}/composition-coordinates.json',
    required_fields: [
      'source_video_id',
      'frame_index',
      'subject_bbox',
      'horizon_line_y',
      'rule_of_thirds_anchor',
      'headroom_ratio',
      'confidence_score',
    ],
    confidence_method:
      'Detector agreement score between subject bbox candidates and composition grid fit residual.',
    validation_method:
      'Validate bbox within frame bounds, horizon_line_y in [0,1], rule_of_thirds_anchor enum valid, confidence threshold gate.',
    failure_conditions: [
      'subject_bbox_missing',
      'horizon_line_missing',
      'composition_grid_mismatch',
      'confidence_below_threshold',
      'headroom_ratio_out_of_range',
    ],
  },
  {
    subsystem_id: 'camera_path',
    input_source:
      'frame_coordinates.json + composition_coordinates.json + camera_behavior_dna_candidates',
    output_structure: 'exports/source_video_numerical_dna/{source_video_id}/camera-path.json',
    required_fields: [
      'source_video_id',
      'segment_id',
      'camera_position',
      'camera_rotation',
      'focal_length_mm',
      'path_samples',
      'confidence_score',
    ],
    confidence_method:
      'Spline fit residual across path_samples with penalty for discontinuous velocity changes.',
    validation_method:
      'Check path_samples continuity, camera_position present for each sample, rotation euler bounds, confidence aggregate >= threshold.',
    failure_conditions: [
      'camera_position_missing',
      'trajectory_not_continuous',
      'rotation_out_of_bounds',
      'path_sample_gap_exceeded',
      'confidence_below_threshold',
    ],
  },
  {
    subsystem_id: 'blocking_data',
    input_source:
      'frame_coordinates.json + composition_coordinates.json + character_detection_candidates',
    output_structure: 'exports/source_video_numerical_dna/{source_video_id}/blocking-data.json',
    required_fields: [
      'source_video_id',
      'frame_index',
      'character_id',
      'screen_position',
      'depth_layer',
      'eyeline_vector',
      'interaction_pairs',
      'confidence_score',
    ],
    confidence_method:
      'Multi-frame identity persistence score combined with eyeline-vector stability across adjacent frames.',
    validation_method:
      'Ensure character_id stable within scene segment, screen_position in bounds, depth_layer enum valid, eyeline unit vector normalized.',
    failure_conditions: [
      'character_id_unstable',
      'screen_position_missing',
      'depth_layer_invalid',
      'eyeline_vector_missing',
      'confidence_below_threshold',
    ],
  },
  {
    subsystem_id: 'motion_vectors',
    input_source:
      'frame_coordinates.json + consecutive_frame_pairs + optical_flow_estimation_plan',
    output_structure: 'exports/source_video_numerical_dna/{source_video_id}/motion-vectors.json',
    required_fields: [
      'source_video_id',
      'frame_pair_index',
      'vector_field_ref',
      'dominant_motion_magnitude',
      'dominant_motion_direction',
      'confidence_score',
    ],
    confidence_method:
      'Optical flow field coherence score averaged over region-of-interest masks derived from subject_bbox.',
    validation_method:
      'Validate vector_field_ref resolvable, magnitude non-negative, direction in radians [-pi, pi], temporal pair continuity.',
    failure_conditions: [
      'vector_field_missing',
      'motion_magnitude_invalid',
      'flow_field_incoherent',
      'frame_pair_gap_exceeded',
      'confidence_below_threshold',
    ],
  },
  {
    subsystem_id: 'edit_rhythm',
    input_source:
      'scene_detection_segments + shot_boundary_candidates + audio_silence_markers',
    output_structure: 'exports/source_video_numerical_dna/{source_video_id}/edit-rhythm.json',
    required_fields: [
      'source_video_id',
      'edit_point_index',
      'timestamp_ms',
      'shot_duration_ms',
      'cut_type',
      'rhythm_bucket',
      'confidence_score',
    ],
    confidence_method:
      'Boundary detector consensus score weighted by shot_duration distribution fit against source group rhythm profile.',
    validation_method:
      'Verify edit points monotonic, shot_duration_ms > 0, cut_type enum valid, rhythm_bucket assigned, confidence threshold met.',
    failure_conditions: [
      'edit_point_missing',
      'shot_duration_invalid',
      'cut_type_unknown',
      'rhythm_profile_mismatch',
      'confidence_below_threshold',
    ],
  },
  {
    subsystem_id: 'scene_remap',
    input_source:
      'frame_coordinates.json + camera_path.json + blocking_data.json + gonegi_spatial_graph_template',
    output_structure: 'exports/source_video_numerical_dna/{source_video_id}/scene-remap.json',
    required_fields: [
      'source_video_id',
      'source_scene_id',
      'gonegi_scene_id',
      'remap_transform',
      'character_region_map',
      'anchor_persistence_map',
      'confidence_score',
    ],
    confidence_method:
      'Transform fit residual between source blocking positions and Gonegi spatial graph target regions with anchor lock penalty.',
    validation_method:
      'Validate remap_transform invertible, character_region_map complete for active characters, anchor_persistence_map covers critical anchors.',
    failure_conditions: [
      'remap_transform_missing',
      'character_region_map_incomplete',
      'anchor_persistence_missing',
      'spatial_graph_template_unbound',
      'confidence_below_threshold',
    ],
  },
];

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function fileExists(root: string, rel: string): boolean {
  return fs.existsSync(path.join(root, rel));
}

function subsystemDesignComplete(design: SubsystemExtractionDesign): boolean {
  return (
    design.input_source.length > 0 &&
    design.output_structure.length > 0 &&
    design.required_fields.length > 0 &&
    design.confidence_method.length > 0 &&
    design.validation_method.length > 0 &&
    design.failure_conditions.length > 0
  );
}

export function buildSubsystemDesigns(): SubsystemExtractionDesign[] {
  return SUBSYSTEM_DESIGNS.map((design) => ({ ...design, required_fields: [...design.required_fields], failure_conditions: [...design.failure_conditions] }));
}

export function buildSourceVideoNumericalExtractionDesignManifest(): SourceVideoNumericalExtractionDesignManifest {
  return {
    design_id: 'source-video-numerical-extraction-design-v1',
    phase: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SYSTEM_ID,
    version: 'extraction_design_v1',
    design_only: true,
    metadata_only: true,
    extraction_design_complete: true,
    numerical_dna_extracted: false,
    numerical_dna_complete: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    schema_path: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SCHEMA_PATH,
    audit_registry_ref: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REGISTRY_PATH,
    feasibility_report_ref: NUMERICAL_EXTRACTION_FEASIBILITY_REPORT_PATH,
    subsystems: buildSubsystemDesigns(),
    generated_at: new Date().toISOString(),
  };
}

export function buildNumericalDnaExtractionSpecification(): NumericalDnaExtractionSpecification {
  return {
    specification_id: 'numerical-dna-extraction-specification-v1',
    phase: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    design_only: true,
    extraction_design_complete: true,
    numerical_dna_extracted: false,
    numerical_dna_complete: false,
    field_definitions: {
      source_video_id: 'Canonical active source identifier (e.g. GHIBLI_01).',
      frame_index: 'Zero-based frame index within sampled extraction set.',
      timestamp_ms: 'Frame timestamp in milliseconds from source video start.',
      normalized_x: 'Horizontal coordinate normalized to [0,1] frame width.',
      normalized_y: 'Vertical coordinate normalized to [0,1] frame height.',
      coordinate_space: 'Coordinate reference frame enum: screen_normalized | world_estimated.',
      confidence_score: 'Per-record confidence in [0,1] produced by subsystem confidence_method.',
      subject_bbox: 'Normalized bounding box [x,y,w,h] for primary subject.',
      horizon_line_y: 'Normalized vertical position of horizon line.',
      camera_position: 'Camera position vector [x,y,z] in scene units.',
      camera_rotation: 'Camera rotation euler [pitch,yaw,roll] in degrees.',
      path_samples: 'Ordered array of camera path samples with timestamps.',
      depth_layer: 'Spatial depth enum: foreground | midground | background.',
      eyeline_vector: 'Unit vector [x,y] describing character eyeline direction.',
      vector_field_ref: 'Relative path to optical flow field artifact.',
      cut_type: 'Edit cut classification enum: hard_cut | dissolve | fade.',
      rhythm_bucket: 'Edit rhythm tempo bucket enum: slow | medium | fast.',
      remap_transform: 'Affine or projective transform mapping source to Gonegi coordinates.',
      character_region_map: 'Map of character_id to Gonegi spatial region label.',
      anchor_persistence_map: 'Map of anchor_id to persistence lock metadata.',
    },
    data_shapes: {
      frame_coordinates: '{ source_video_id, frames: [{ frame_index, timestamp_ms, normalized_x, normalized_y, confidence_score }] }',
      composition_coordinates:
        '{ source_video_id, frames: [{ frame_index, subject_bbox, horizon_line_y, rule_of_thirds_anchor, confidence_score }] }',
      camera_path:
        '{ source_video_id, segments: [{ segment_id, path_samples: [{ timestamp_ms, camera_position, camera_rotation }], confidence_score }] }',
      blocking_data:
        '{ source_video_id, frames: [{ frame_index, characters: [{ character_id, screen_position, depth_layer, eyeline_vector }] }] }',
      motion_vectors:
        '{ source_video_id, frame_pairs: [{ frame_pair_index, vector_field_ref, dominant_motion_magnitude, dominant_motion_direction }] }',
      edit_rhythm:
        '{ source_video_id, edit_points: [{ edit_point_index, timestamp_ms, shot_duration_ms, cut_type, rhythm_bucket }] }',
      scene_remap:
        '{ source_video_id, scenes: [{ source_scene_id, gonegi_scene_id, remap_transform, character_region_map, anchor_persistence_map }] }',
    },
    audit_requirements: [
      'All minimum_viable_extraction subsystems must produce non-empty artifacts for primary sources.',
      'confidence_score must be present on every extracted record.',
      'failure_conditions must be enumerated in extraction reports when gates fail.',
      'Source coverage must remain ghibli=7, shinkai=2, live_action=1, mori=5 with missing_records=0.',
      'Design artifacts must not claim numerical_dna_complete or numerical_dna_extracted until real extraction PASS.',
    ],
    future_verify_requirements: [
      'verify:source-video-numerical-dna-extraction',
      'Per-subsystem PASS verdict with confidence threshold audit',
      'Cross-subsystem consistency: frame_coordinates timestamps align with camera_path samples',
      'scene_remap invertibility and anchor persistence lock validation',
      'Minimum viable extraction gate: frame_coordinates, composition_coordinates, camera_path, blocking_data PASS before motion_vectors and edit_rhythm',
    ],
    minimum_viable_extraction: {
      frame_coordinates: true,
      composition_coordinates: true,
      camera_path: true,
      blocking_data: true,
      motion_vectors: false,
      edit_rhythm: false,
      scene_remap: false,
    },
  };
}

export function buildNumericalDnaRealExtractionGapReport(): NumericalDnaRealExtractionGapReport {
  return {
    report_id: `numerical_dna_real_extraction_gap_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    design_complete: true,
    implementation_complete: false,
    extraction_design_complete: true,
    numerical_dna_extracted: false,
    numerical_dna_complete: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    remaining_work: [
      'Implement frame_coordinates extractor service with real frame sampling pipeline',
      'Implement composition_coordinates extractor with subject bbox and horizon detection',
      'Implement camera_path extractor with continuous trajectory validation',
      'Implement blocking_data extractor with character identity persistence',
      'Implement motion_vectors extractor (post-MVP)',
      'Implement edit_rhythm extractor (post-MVP)',
      'Implement scene_remap engine binding source frames to Gonegi spatial graph',
      'Create verify:source-video-numerical-dna-extraction for real extraction PASS',
      'Run extraction on primary sources in audit recommended order (GHIBLI_01 first)',
      'Materialize exports/source_video_numerical_dna/{source_video_id}/ artifacts for all 15 sources',
    ],
  };
}

export function runSourceVideoNumericalDnaExtractionDesignValidation(
  projectRoot?: string
): SourceVideoNumericalDnaExtractionDesignReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SourceVideoNumericalDnaExtractionDesignReport['issues'] = [];

  fs.mkdirSync(path.join(root, SOURCE_VIDEO_NUMERICAL_DNA_DESIGN_DATASET_DIR), {
    recursive: true,
  });

  const manifest = buildSourceVideoNumericalExtractionDesignManifest();
  writeJson(root, SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_MANIFEST_PATH, manifest);

  const specification = buildNumericalDnaExtractionSpecification();
  writeJson(root, NUMERICAL_DNA_EXTRACTION_SPECIFICATION_PATH, specification);

  const gapReport = buildNumericalDnaRealExtractionGapReport();
  writeJson(root, NUMERICAL_DNA_REAL_EXTRACTION_GAP_REPORT_PATH, gapReport);

  const design_dataset_exists = fileExists(root, SOURCE_VIDEO_NUMERICAL_DNA_DESIGN_DATASET_DIR);
  const schema_exists = fileExists(root, SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SCHEMA_PATH);
  const manifest_exists = fileExists(
    root,
    SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_MANIFEST_PATH
  );
  const specification_exists = fileExists(root, NUMERICAL_DNA_EXTRACTION_SPECIFICATION_PATH);
  const gap_report_exists = fileExists(root, NUMERICAL_DNA_REAL_EXTRACTION_GAP_REPORT_PATH);

  const all_7_subsystems_designed =
    manifest.subsystems.length === 7 &&
    manifest.subsystems.every((design) => subsystemDesignComplete(design));

  const validation_methods_defined = manifest.subsystems.every(
    (design) => design.validation_method.length > 0
  );

  const failure_conditions_defined = manifest.subsystems.every(
    (design) => design.failure_conditions.length > 0
  );

  const minimum_viable_extraction_defined =
    specification.minimum_viable_extraction !== undefined &&
    typeof specification.minimum_viable_extraction.frame_coordinates === 'boolean' &&
    typeof specification.minimum_viable_extraction.composition_coordinates === 'boolean' &&
    typeof specification.minimum_viable_extraction.camera_path === 'boolean' &&
    typeof specification.minimum_viable_extraction.blocking_data === 'boolean' &&
    typeof specification.minimum_viable_extraction.motion_vectors === 'boolean' &&
    typeof specification.minimum_viable_extraction.edit_rhythm === 'boolean';

  if (!design_dataset_exists) {
    issues.push({ code: 'DESIGN_DATASET_MISSING', message: 'Design dataset directory missing', severity: 'error' });
  }
  if (!schema_exists) {
    issues.push({ code: 'SCHEMA_MISSING', message: 'Extraction design schema missing', severity: 'error' });
  }
  if (!manifest_exists) {
    issues.push({ code: 'MANIFEST_MISSING', message: 'Extraction design manifest missing', severity: 'error' });
  }
  if (!all_7_subsystems_designed) {
    issues.push({ code: 'SUBSYSTEMS_INCOMPLETE', message: 'All 7 subsystems must be fully designed', severity: 'error' });
  }
  if (!validation_methods_defined) {
    issues.push({ code: 'VALIDATION_METHODS_MISSING', message: 'validation_method required for all subsystems', severity: 'error' });
  }
  if (!failure_conditions_defined) {
    issues.push({ code: 'FAILURE_CONDITIONS_MISSING', message: 'failure_conditions required for all subsystems', severity: 'error' });
  }
  if (!minimum_viable_extraction_defined) {
    issues.push({ code: 'MVP_UNDEFINED', message: 'minimum_viable_extraction must be defined', severity: 'error' });
  }
  if (!specification_exists) {
    issues.push({ code: 'SPECIFICATION_MISSING', message: 'NUMERICAL_DNA_EXTRACTION_SPECIFICATION.json missing', severity: 'error' });
  }
  if (!gap_report_exists) {
    issues.push({ code: 'GAP_REPORT_MISSING', message: 'NUMERICAL_DNA_REAL_EXTRACTION_GAP_REPORT.json missing', severity: 'error' });
  }
  if (!gapReport.design_complete || gapReport.implementation_complete) {
    issues.push({
      code: 'GAP_REPORT_STATE',
      message: 'Gap report must have design_complete=true and implementation_complete=false',
      severity: 'error',
    });
  }

  const validation_passed =
    design_dataset_exists &&
    schema_exists &&
    manifest_exists &&
    all_7_subsystems_designed &&
    validation_methods_defined &&
    failure_conditions_defined &&
    minimum_viable_extraction_defined &&
    specification_exists &&
    gap_report_exists &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: SourceVideoNumericalDnaExtractionDesignReport = {
    report_id: `source_video_numerical_dna_extraction_design_${Date.now().toString(36)}`,
    phase: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE,
    system_id: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PASS_VERDICT
      : SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_FAIL_VERDICT,
    status: validation_passed
      ? SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_STATUS
      : 'SOURCE_VIDEO_NUMERICAL_DNA_DESIGN_NOT_READY',
    validation_passed,
    extraction_design_complete: true,
    numerical_dna_extracted: false,
    numerical_dna_complete: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    all_7_subsystems_designed,
    validation_methods_defined,
    failure_conditions_defined,
    minimum_viable_extraction_defined,
    specification_exists,
    gap_report_exists,
    subsystems: manifest.subsystems,
    checks: {
      design_dataset_exists,
      schema_exists,
      manifest_exists,
      all_7_subsystems_designed,
      validation_methods_defined,
      failure_conditions_defined,
      minimum_viable_extraction_defined,
      specification_exists,
      gap_report_exists,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_REPORT_PATH, report);
  return report;
}

export function writeSourceVideoNumericalDnaExtractionDesignReport(
  projectRoot?: string
): SourceVideoNumericalDnaExtractionDesignReport {
  return runSourceVideoNumericalDnaExtractionDesignValidation(projectRoot);
}
