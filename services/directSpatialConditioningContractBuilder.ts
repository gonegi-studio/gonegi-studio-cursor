import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  DIRECT_SPATIAL_CONDITIONING_FOUNDATION_PHASE,
  DIRECT_SPATIAL_CONDITIONING_FOUNDATION_SYSTEM_ID,
  FOUNDATION_PATH,
  SPATIAL_CONDITIONING_CHANNELS,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';

/**
 * PHASE-DSC-031: Direct Spatial Conditioning Contract.
 *
 * DESIGN ONLY / CONTRACT ONLY. Defines the runtime conditioning contract that
 * a future Direct Spatial Conditioning runtime MUST satisfy when consuming the
 * PHASE-030 foundation channels. Does not execute, materialize, infer, or
 * modify any dataset.
 */

export const DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE =
  'PHASE-DSC-031' as const;
export const DIRECT_SPATIAL_CONDITIONING_CONTRACT_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_CONTRACT_V1' as const;

export const CONTRACT_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const CONTRACT_PATH =
  `${CONTRACT_ROOT}/direct-spatial-conditioning-contract-v1.json` as const;

export type ComponentValueKind =
  | 'number'
  | 'string'
  | 'boolean'
  | 'number_array'
  | 'string_array';

export interface ChannelComponentSchema {
  name: string;
  kind: ComponentValueKind;
  required: true;
  nullable: false;
  description: string;
}

export interface ChannelInputSchema {
  schema_id: string;
  channel_id: ConditioningChannelId;
  required_fields: string[];
  fields: {
    channel_id: { const: ConditioningChannelId };
    source_video_id: { type: 'string'; required: true };
    spatial_frame_ref: { const: string };
    timestamp_ms: { type: 'number'; required: true; min: 0 };
    components: ChannelComponentSchema[];
  };
}

export interface ChannelOutputSchema {
  schema_id: string;
  channel_id: ConditioningChannelId;
  produces: 'validated_conditioning_packet';
  fields: {
    channel_id: { const: ConditioningChannelId };
    validation_status: { enum: ['accepted', 'rejected'] };
    accepted: { type: 'boolean' };
    rejection_codes: { type: 'string_array' };
    spatial_frame_ref: { const: string };
  };
  materializes_tensors: false;
  materializes_frames: false;
}

export interface ChannelValidationRule {
  rule_id: string;
  applies_to: ConditioningChannelId | '*';
  severity: 'error';
  description: string;
  predicate: string;
}

export interface ChannelContract {
  channel_id: ConditioningChannelId;
  foundation_channel_ref: ConditioningChannelId;
  spatial_frame_ref: string;
  consumption_slot: string;
  integrated_layer: string;
  input_schema: ChannelInputSchema;
  output_schema: ChannelOutputSchema;
  validation_rule_ids: string[];
  requires_backend: false;
  requires_gpu: false;
  performs_inference: false;
}

export interface DirectSpatialConditioningContract {
  contract_id: string;
  phase: typeof DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE;
  system_id: typeof DIRECT_SPATIAL_CONDITIONING_CONTRACT_SYSTEM_ID;
  mode: 'design_only_contract';
  target: string;
  foundation_ref: string;
  foundation_phase: typeof DIRECT_SPATIAL_CONDITIONING_FOUNDATION_PHASE;
  foundation_system_id: typeof DIRECT_SPATIAL_CONDITIONING_FOUNDATION_SYSTEM_ID;
  spatial_frame: typeof SPATIAL_FRAME;
  channel_contracts: ChannelContract[];
  input_schema: {
    schema_id: string;
    description: string;
    required_top_level: string[];
    required_channel_count: 6;
    required_channel_ids: ConditioningChannelId[];
    packet_shape: {
      source_video_id: string;
      spatial_frame_ref: string;
      channels: string;
    };
  };
  output_schema: {
    schema_id: string;
    description: string;
    produces: 'validated_conditioning_bundle';
    required_fields: string[];
    materializes_tensors: false;
    materializes_frames: false;
    emits_inference: false;
  };
  validation_rules: ChannelValidationRule[];
  design_constraints: {
    backend: 'none';
    gpu: false;
    inference: false;
    modifies_existing_datasets: false;
    placeholders: false;
    contract_only: true;
  };
  created_at: string;
}

const COMPONENT_SCHEMAS: Record<ConditioningChannelId, ChannelComponentSchema[]> = {
  camera_pose_field: [
    { name: 'translation_u', kind: 'number', required: true, nullable: false, description: 'Camera translation along u in normalized frame' },
    { name: 'translation_v', kind: 'number', required: true, nullable: false, description: 'Camera translation along v in normalized frame' },
    { name: 'rotation_rad', kind: 'number', required: true, nullable: false, description: 'In-plane rotation in radians' },
    { name: 'zoom_scale', kind: 'number', required: true, nullable: false, description: 'Unitless zoom scale factor' },
  ],
  camera_temporal_track: [
    { name: 'motion_type', kind: 'string', required: true, nullable: false, description: 'Camera motion class label' },
    { name: 'magnitude', kind: 'number', required: true, nullable: false, description: 'Motion magnitude over adjacent pair' },
    { name: 'translation_u', kind: 'number', required: true, nullable: false, description: 'Pair translation along u' },
    { name: 'translation_v', kind: 'number', required: true, nullable: false, description: 'Pair translation along v' },
  ],
  subject_position_field: [
    { name: 'center_u', kind: 'number', required: true, nullable: false, description: 'Subject bbox center u' },
    { name: 'center_v', kind: 'number', required: true, nullable: false, description: 'Subject bbox center v' },
    { name: 'displacement_u', kind: 'number', required: true, nullable: false, description: 'Subject displacement along u' },
    { name: 'displacement_v', kind: 'number', required: true, nullable: false, description: 'Subject displacement along v' },
  ],
  framing_composition_map: [
    { name: 'shot_scale', kind: 'string', required: true, nullable: false, description: 'Shot-scale categorical label' },
    { name: 'composition_region', kind: 'string', required: true, nullable: false, description: 'Composition region occupancy descriptor' },
  ],
  edit_rhythm_boundaries: [
    { name: 'cut_timestamp_ms', kind: 'number_array', required: true, nullable: false, description: 'Ordered cut boundary timestamps in ms' },
    { name: 'shot_duration_ms', kind: 'number_array', required: true, nullable: false, description: 'Per-shot durations in ms' },
  ],
  scene_energy_field: [
    { name: 'motion_magnitude', kind: 'number', required: true, nullable: false, description: 'Scene motion magnitude scalar' },
    { name: 'camera_subject_relationship', kind: 'string', required: true, nullable: false, description: 'Camera/subject relationship class' },
    { name: 'relative_velocity', kind: 'number', required: true, nullable: false, description: 'Camera vs subject relative velocity' },
  ],
};

export const CONTRACT_VALIDATION_RULES: ChannelValidationRule[] = [
  {
    rule_id: 'REQ_ALL_SIX_CHANNELS',
    applies_to: '*',
    severity: 'error',
    description: 'A conditioning packet MUST include exactly the six foundation channels.',
    predicate: 'packet.channels.length === 6 AND set(packet.channels[].channel_id) === foundation.channel_ids',
  },
  {
    rule_id: 'REQ_SPATIAL_FRAME_LOCK',
    applies_to: '*',
    severity: 'error',
    description: 'Every channel MUST reference normalized_image_plane_v1.',
    predicate: 'channel.spatial_frame_ref === "normalized_image_plane_v1"',
  },
  {
    rule_id: 'REQ_SOURCE_VIDEO_ID',
    applies_to: '*',
    severity: 'error',
    description: 'source_video_id MUST be a non-empty string from the certified 15-source corpus.',
    predicate: 'typeof source_video_id === "string" AND source_video_id.length > 0',
  },
  {
    rule_id: 'REQ_TIMESTAMP_NONNEGATIVE',
    applies_to: '*',
    severity: 'error',
    description: 'timestamp_ms MUST be a finite number >= 0.',
    predicate: 'Number.isFinite(timestamp_ms) AND timestamp_ms >= 0',
  },
  {
    rule_id: 'REQ_COMPONENTS_COMPLETE',
    applies_to: '*',
    severity: 'error',
    description: 'All declared components for the channel MUST be present, non-null, and typed correctly.',
    predicate: 'forall component in channel.input_schema.fields.components: present AND not null AND kind_matches',
  },
  {
    rule_id: 'REQ_NO_BACKEND',
    applies_to: '*',
    severity: 'error',
    description: 'Contract forbids backend invocation during validation.',
    predicate: 'requires_backend === false',
  },
  {
    rule_id: 'REQ_NO_GPU',
    applies_to: '*',
    severity: 'error',
    description: 'Contract forbids GPU usage during validation.',
    predicate: 'requires_gpu === false',
  },
  {
    rule_id: 'REQ_NO_INFERENCE',
    applies_to: '*',
    severity: 'error',
    description: 'Contract forbids inference / model execution.',
    predicate: 'performs_inference === false',
  },
  {
    rule_id: 'REQ_NO_TENSOR_MATERIALIZATION',
    applies_to: '*',
    severity: 'error',
    description: 'Output MUST NOT materialize tensors or frames under this contract phase.',
    predicate: 'output.materializes_tensors === false AND output.materializes_frames === false',
  },
  {
    rule_id: 'REQ_FOUNDATION_ALIGNMENT',
    applies_to: '*',
    severity: 'error',
    description: 'Each channel_id MUST match a PHASE-030 foundation channel with identical component names.',
    predicate: 'channel.foundation_channel_ref in foundation.channels AND components_equal',
  },
  {
    rule_id: 'REQ_CAMERA_POSE_COMPONENTS',
    applies_to: 'camera_pose_field',
    severity: 'error',
    description: 'camera_pose_field MUST carry translation_u, translation_v, rotation_rad, zoom_scale.',
    predicate: 'components === [translation_u, translation_v, rotation_rad, zoom_scale]',
  },
  {
    rule_id: 'REQ_CAMERA_TEMPORAL_COMPONENTS',
    applies_to: 'camera_temporal_track',
    severity: 'error',
    description: 'camera_temporal_track MUST carry motion_type, magnitude, translation_u, translation_v.',
    predicate: 'components === [motion_type, magnitude, translation_u, translation_v]',
  },
  {
    rule_id: 'REQ_SUBJECT_POSITION_COMPONENTS',
    applies_to: 'subject_position_field',
    severity: 'error',
    description: 'subject_position_field MUST carry center_u, center_v, displacement_u, displacement_v.',
    predicate: 'components === [center_u, center_v, displacement_u, displacement_v]',
  },
  {
    rule_id: 'REQ_FRAMING_COMPONENTS',
    applies_to: 'framing_composition_map',
    severity: 'error',
    description: 'framing_composition_map MUST carry shot_scale, composition_region.',
    predicate: 'components === [shot_scale, composition_region]',
  },
  {
    rule_id: 'REQ_EDIT_RHYTHM_COMPONENTS',
    applies_to: 'edit_rhythm_boundaries',
    severity: 'error',
    description: 'edit_rhythm_boundaries MUST carry cut_timestamp_ms and shot_duration_ms arrays of equal length.',
    predicate: 'Array.isArray(cut_timestamp_ms) AND Array.isArray(shot_duration_ms) AND lengths_equal',
  },
  {
    rule_id: 'REQ_SCENE_ENERGY_COMPONENTS',
    applies_to: 'scene_energy_field',
    severity: 'error',
    description: 'scene_energy_field MUST carry motion_magnitude, camera_subject_relationship, relative_velocity.',
    predicate: 'components === [motion_magnitude, camera_subject_relationship, relative_velocity]',
  },
];

function writeJson(root: string, rel: string, value: unknown): void {
  const full = path.join(root, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildChannelContract(channelId: ConditioningChannelId): ChannelContract {
  const foundation = SPATIAL_CONDITIONING_CHANNELS.find((c) => c.channel_id === channelId);
  if (!foundation) {
    throw new Error(`Missing foundation channel: ${channelId}`);
  }
  const components = COMPONENT_SCHEMAS[channelId];
  const foundationComponents = foundation.value_space.components;
  if (JSON.stringify(components.map((c) => c.name)) !== JSON.stringify([...foundationComponents])) {
    throw new Error(`Component schema drift for ${channelId}`);
  }

  const channelRules = CONTRACT_VALIDATION_RULES
    .filter((r) => r.applies_to === '*' || r.applies_to === channelId)
    .map((r) => r.rule_id);

  return {
    channel_id: channelId,
    foundation_channel_ref: channelId,
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    consumption_slot: foundation.upstream.consumption_slot,
    integrated_layer: foundation.upstream.integrated_layer,
    input_schema: {
      schema_id: `dsc-channel-input-${channelId}-v1`,
      channel_id: channelId,
      required_fields: [
        'channel_id',
        'source_video_id',
        'spatial_frame_ref',
        'timestamp_ms',
        'components',
      ],
      fields: {
        channel_id: { const: channelId },
        source_video_id: { type: 'string', required: true },
        spatial_frame_ref: { const: SPATIAL_FRAME.frame_id },
        timestamp_ms: { type: 'number', required: true, min: 0 },
        components,
      },
    },
    output_schema: {
      schema_id: `dsc-channel-output-${channelId}-v1`,
      channel_id: channelId,
      produces: 'validated_conditioning_packet',
      fields: {
        channel_id: { const: channelId },
        validation_status: { enum: ['accepted', 'rejected'] },
        accepted: { type: 'boolean' },
        rejection_codes: { type: 'string_array' },
        spatial_frame_ref: { const: SPATIAL_FRAME.frame_id },
      },
      materializes_tensors: false,
      materializes_frames: false,
    },
    validation_rule_ids: channelRules,
    requires_backend: false,
    requires_gpu: false,
    performs_inference: false,
  };
}

/**
 * Build the design-only Direct Spatial Conditioning runtime contract.
 * Assembled from foundation constants + in-code component schemas.
 * Does not read datasets or execute any channel.
 */
export function buildDirectSpatialConditioningContract(projectRoot?: string): {
  contract: DirectSpatialConditioningContract;
} {
  const root = resolveProjectRoot(projectRoot);
  const created_at = new Date().toISOString();

  const channel_contracts = CONDITIONING_CHANNEL_IDS.map(buildChannelContract);

  const contract: DirectSpatialConditioningContract = {
    contract_id: 'direct-spatial-conditioning-contract-v1',
    phase: DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE,
    system_id: DIRECT_SPATIAL_CONDITIONING_CONTRACT_SYSTEM_ID,
    mode: 'design_only_contract',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_CONTRACT_V1',
    foundation_ref: FOUNDATION_PATH,
    foundation_phase: DIRECT_SPATIAL_CONDITIONING_FOUNDATION_PHASE,
    foundation_system_id: DIRECT_SPATIAL_CONDITIONING_FOUNDATION_SYSTEM_ID,
    spatial_frame: SPATIAL_FRAME,
    channel_contracts,
    input_schema: {
      schema_id: 'dsc-runtime-input-bundle-v1',
      description:
        'Runtime conditioning input bundle: one source_video_id + six channel packets over normalized_image_plane_v1.',
      required_top_level: [
        'source_video_id',
        'spatial_frame_ref',
        'channels',
      ],
      required_channel_count: 6,
      required_channel_ids: [...CONDITIONING_CHANNEL_IDS],
      packet_shape: {
        source_video_id: 'string (certified corpus id)',
        spatial_frame_ref: 'normalized_image_plane_v1',
        channels: 'array[6] of channel input packets matching per-channel input_schema',
      },
    },
    output_schema: {
      schema_id: 'dsc-runtime-output-bundle-v1',
      description:
        'Validated conditioning bundle: accept/reject per channel with rejection codes. No tensors, frames, or inference.',
      produces: 'validated_conditioning_bundle',
      required_fields: [
        'source_video_id',
        'spatial_frame_ref',
        'channel_results',
        'bundle_accepted',
      ],
      materializes_tensors: false,
      materializes_frames: false,
      emits_inference: false,
    },
    validation_rules: CONTRACT_VALIDATION_RULES,
    design_constraints: {
      backend: 'none',
      gpu: false,
      inference: false,
      modifies_existing_datasets: false,
      placeholders: false,
      contract_only: true,
    },
    created_at,
  };

  writeJson(root, CONTRACT_PATH, contract);
  return { contract };
}
