import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { SOURCE_IDS as OFFICIAL_SOURCE_IDS } from './numericalCinematographyIntegrationBuilder.js';
import {
  CERTIFICATION_PATH,
  MOVIE_RECONSTRUCTION_PRODUCTION_CERTIFICATION_SYSTEM_ID,
} from './movieReconstructionProductionCertificationBuilder.js';
import {
  MASTER_PACKAGE_PATH,
  MASTER_PACKAGE_ROOT,
} from './movieReconstructionMasterPackageBuilder.js';

/**
 * PHASE-MOVIE-RECONSTRUCTION-030: Direct Spatial Conditioning Foundation.
 *
 * DESIGN ONLY. This module defines the *interfaces* by which the certified
 * Movie Reconstruction V1 outputs (PHASE-029) would be exposed as spatial
 * conditioning inputs to a future direct-conditioning stage.
 *
 * It performs:
 *   - NO backend calls, NO GPU, NO inference, NO tensor materialization.
 *   - NO reads or writes of any existing dataset.
 *   - NO placeholders (every interface is fully specified from in-code constants).
 *
 * The builder emits a single deterministic design artifact describing the
 * conditioning channels, their upstream verified sources, the shared spatial
 * coordinate frame, and the input/output contracts.
 */

export const DIRECT_SPATIAL_CONDITIONING_FOUNDATION_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-030' as const;
export const DIRECT_SPATIAL_CONDITIONING_FOUNDATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_FOUNDATION_V1' as const;

export const FOUNDATION_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const FOUNDATION_PATH =
  `${FOUNDATION_ROOT}/direct-spatial-conditioning-foundation-v1.json` as const;

/**
 * Shared, backend-agnostic spatial coordinate frame all conditioning channels
 * are expressed in. Purely a design convention — no pixels are read.
 */
export const SPATIAL_FRAME = {
  frame_id: 'normalized_image_plane_v1',
  origin: 'top_left',
  x_axis: { name: 'u', range: [0, 1], direction: 'left_to_right' },
  y_axis: { name: 'v', range: [0, 1], direction: 'top_to_bottom' },
  aspect_policy: 'source_native_aspect_preserved',
  units: 'normalized_fraction_of_frame',
  handedness: 'image_raster',
} as const;

export type ConditioningChannelId =
  | 'camera_pose_field'
  | 'camera_temporal_track'
  | 'subject_position_field'
  | 'framing_composition_map'
  | 'edit_rhythm_boundaries'
  | 'scene_energy_field';

export interface ConditioningChannelUpstream {
  consumption_slot: string;
  pipeline_stage: string;
  integrated_layer: string;
  verified_source_verdict: string;
}

/**
 * A single spatial conditioning interface. Declares WHAT signal is exposed,
 * WHERE it comes from (verified upstream), and HOW it is represented in the
 * shared spatial frame — without producing any values.
 */
export interface SpatialConditioningChannel {
  channel_id: ConditioningChannelId;
  direction: 'conditioning_input';
  spatial_frame_ref: string;
  representation: string;
  value_space: {
    kind: 'continuous' | 'discrete' | 'temporal_sequence';
    components: string[];
    units: string;
    range_policy: string;
  };
  upstream: ConditioningChannelUpstream;
  determinism: 'design_only_no_inference';
  requires_backend: false;
  requires_gpu: false;
  performs_inference: false;
}

export interface DirectSpatialConditioningInputContract {
  source_system: 'MOVIE_RECONSTRUCTION_V1';
  certification_ref: string;
  certification_system_id: string;
  master_package_ref: string;
  master_package_root: string;
  sources_supported: number;
  read_only: true;
  no_dataset_modification: true;
}

export interface DirectSpatialConditioningOutputContract {
  produces: 'spatial_conditioning_specification';
  materializes_tensors: false;
  materializes_frames: false;
  emitted_by_this_phase: false;
  downstream_consumer: 'direct_spatial_conditioning_runtime (future phase)';
  channel_ids: ConditioningChannelId[];
}

export interface DirectSpatialConditioningFoundation {
  foundation_id: string;
  phase: typeof DIRECT_SPATIAL_CONDITIONING_FOUNDATION_PHASE;
  system_id: typeof DIRECT_SPATIAL_CONDITIONING_FOUNDATION_SYSTEM_ID;
  mode: 'design_only';
  target: string;
  spatial_frame: typeof SPATIAL_FRAME;
  channels: SpatialConditioningChannel[];
  input_contract: DirectSpatialConditioningInputContract;
  output_contract: DirectSpatialConditioningOutputContract;
  design_constraints: {
    backend: 'none';
    gpu: false;
    inference: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const CERTIFIED_UPSTREAM_VERDICT =
  'PASS_VERIFIED_MOVIE_RECONSTRUCTION_PRODUCTION_CERTIFICATION_V1' as const;

/**
 * The six certified reconstruction consumption slots (PHASE-023), each mapped to
 * exactly one spatial conditioning channel. Slot/stage/layer strings mirror the
 * verified consumption records so the interface stays traceable to real sources.
 */
export const SPATIAL_CONDITIONING_CHANNELS: SpatialConditioningChannel[] = [
  {
    channel_id: 'camera_pose_field',
    direction: 'conditioning_input',
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    representation:
      'per-anchor camera transform (translation in normalized frame, in-plane rotation, zoom scale)',
    value_space: {
      kind: 'continuous',
      components: ['translation_u', 'translation_v', 'rotation_rad', 'zoom_scale'],
      units: 'normalized_fraction_of_frame + radians + unitless_scale',
      range_policy: 'derived_from_verified_geometry_layer_no_recompute',
    },
    upstream: {
      consumption_slot: 'camera_pose',
      pipeline_stage: 'camera_geometry_reconstruction',
      integrated_layer: 'geometry',
      verified_source_verdict: CERTIFIED_UPSTREAM_VERDICT,
    },
    determinism: 'design_only_no_inference',
    requires_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
  {
    channel_id: 'camera_temporal_track',
    direction: 'conditioning_input',
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    representation:
      'temporal sequence of camera motion vectors across adjacent frame pairs',
    value_space: {
      kind: 'temporal_sequence',
      components: ['motion_type', 'magnitude', 'translation_u', 'translation_v'],
      units: 'normalized_fraction_of_frame_per_pair',
      range_policy: 'derived_from_verified_camera_motion_layer_no_recompute',
    },
    upstream: {
      consumption_slot: 'camera_temporal',
      pipeline_stage: 'camera_motion_reconstruction',
      integrated_layer: 'camera_motion',
      verified_source_verdict: CERTIFIED_UPSTREAM_VERDICT,
    },
    determinism: 'design_only_no_inference',
    requires_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
  {
    channel_id: 'subject_position_field',
    direction: 'conditioning_input',
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    representation:
      'subject bounding-box center and displacement trajectory in normalized frame',
    value_space: {
      kind: 'temporal_sequence',
      components: ['center_u', 'center_v', 'displacement_u', 'displacement_v'],
      units: 'normalized_fraction_of_frame',
      range_policy: 'derived_from_verified_subject_motion_layer_no_recompute',
    },
    upstream: {
      consumption_slot: 'subject_temporal',
      pipeline_stage: 'subject_motion_reconstruction',
      integrated_layer: 'subject_motion',
      verified_source_verdict: CERTIFIED_UPSTREAM_VERDICT,
    },
    determinism: 'design_only_no_inference',
    requires_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
  {
    channel_id: 'framing_composition_map',
    direction: 'conditioning_input',
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    representation:
      'shot-scale class plus composition region occupancy over the normalized frame',
    value_space: {
      kind: 'discrete',
      components: ['shot_scale', 'composition_region'],
      units: 'categorical_label + normalized_region_bounds',
      range_policy: 'derived_from_verified_composition_layer_no_recompute',
    },
    upstream: {
      consumption_slot: 'framing',
      pipeline_stage: 'composition_framing_reconstruction',
      integrated_layer: 'composition',
      verified_source_verdict: CERTIFIED_UPSTREAM_VERDICT,
    },
    determinism: 'design_only_no_inference',
    requires_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
  {
    channel_id: 'edit_rhythm_boundaries',
    direction: 'conditioning_input',
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    representation:
      'cut-boundary timestamps partitioning the timeline into spatially-continuous segments',
    value_space: {
      kind: 'temporal_sequence',
      components: ['cut_timestamp_ms', 'shot_duration_ms'],
      units: 'milliseconds',
      range_policy: 'derived_from_verified_transition_layer_no_recompute',
    },
    upstream: {
      consumption_slot: 'edit_rhythm',
      pipeline_stage: 'temporal_edit_reconstruction',
      integrated_layer: 'transition',
      verified_source_verdict: CERTIFIED_UPSTREAM_VERDICT,
    },
    determinism: 'design_only_no_inference',
    requires_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
  {
    channel_id: 'scene_energy_field',
    direction: 'conditioning_input',
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    representation:
      'scalar scene-energy derived from camera/subject relationship and relative velocity',
    value_space: {
      kind: 'continuous',
      components: ['motion_magnitude', 'camera_subject_relationship', 'relative_velocity'],
      units: 'unitless_scalar + categorical_relationship',
      range_policy: 'derived_from_verified_scene_dynamics_layer_no_recompute',
    },
    upstream: {
      consumption_slot: 'scene_energy',
      pipeline_stage: 'scene_dynamics_reconstruction',
      integrated_layer: 'scene_dynamics',
      verified_source_verdict: CERTIFIED_UPSTREAM_VERDICT,
    },
    determinism: 'design_only_no_inference',
    requires_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
];

export const CONDITIONING_CHANNEL_IDS: ConditioningChannelId[] =
  SPATIAL_CONDITIONING_CHANNELS.map((c) => c.channel_id);

function writeJson(root: string, rel: string, value: unknown): void {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/**
 * Build the design-only Direct Spatial Conditioning foundation artifact.
 * Deterministic: assembled purely from in-code constants. Does not read or
 * modify any dataset; only writes the foundation design document.
 */
export function buildDirectSpatialConditioningFoundation(
  projectRoot?: string
): { foundation: DirectSpatialConditioningFoundation } {
  const root = resolveProjectRoot(projectRoot);
  const created_at = new Date().toISOString();

  const foundation: DirectSpatialConditioningFoundation = {
    foundation_id: 'direct-spatial-conditioning-foundation-v1',
    phase: DIRECT_SPATIAL_CONDITIONING_FOUNDATION_PHASE,
    system_id: DIRECT_SPATIAL_CONDITIONING_FOUNDATION_SYSTEM_ID,
    mode: 'design_only',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_FOUNDATION_V1',
    spatial_frame: SPATIAL_FRAME,
    channels: SPATIAL_CONDITIONING_CHANNELS,
    input_contract: {
      source_system: 'MOVIE_RECONSTRUCTION_V1',
      certification_ref: CERTIFICATION_PATH,
      certification_system_id:
        MOVIE_RECONSTRUCTION_PRODUCTION_CERTIFICATION_SYSTEM_ID,
      master_package_ref: MASTER_PACKAGE_PATH,
      master_package_root: MASTER_PACKAGE_ROOT,
      sources_supported: OFFICIAL_SOURCE_IDS.length,
      read_only: true,
      no_dataset_modification: true,
    },
    output_contract: {
      produces: 'spatial_conditioning_specification',
      materializes_tensors: false,
      materializes_frames: false,
      emitted_by_this_phase: false,
      downstream_consumer: 'direct_spatial_conditioning_runtime (future phase)',
      channel_ids: CONDITIONING_CHANNEL_IDS,
    },
    design_constraints: {
      backend: 'none',
      gpu: false,
      inference: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at,
  };

  writeJson(root, FOUNDATION_PATH, foundation);
  return { foundation };
}
