import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';
import {
  PACKET_PATH,
  type DirectSpatialConditioningPacket,
} from './directSpatialConditioningPacketBuilder.js';
import { VALIDATION_PATH } from './directSpatialConditioningPacketValidationBuilder.js';
import {
  NUMERICAL_RECONSTRUCTION_EXPORT_PHASE,
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
  type NumericalReconstructionRuntimePackage,
} from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-034: Direct Spatial Conditioning packet assembly design.
 *
 * DESIGN ONLY / ASSEMBLY ONLY. Specifies how a runtime maps the certified
 * Movie Reconstruction runtime package (PHASE-027) consumption layer into a
 * PHASE-032 conditioning packet: required inputs, ordered assembly steps, and
 * field-level source mappings. Assembles no packet instance; performs no
 * backend, GPU, or inference work; modifies no dataset.
 */

export const DSC_PACKET_ASSEMBLY_PHASE = 'PHASE-DSC-034' as const;
export const DSC_PACKET_ASSEMBLY_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_PACKET_ASSEMBLY_V1' as const;

export const ASSEMBLY_ROOT = 'exports/direct_spatial_conditioning/v1' as const;
export const ASSEMBLY_PATH =
  `${ASSEMBLY_ROOT}/direct-spatial-conditioning-packet-assembly-v1.json` as const;

export const CONTRACT_ID = 'direct-spatial-conditioning-contract-v1' as const;
export const RUNTIME_CONSUMPTION_LAYER = 'consumption' as const;

export type ExtractionMode =
  | 'direct_copy'
  | 'rename_copy'
  | 'unit_normalize_degrees_to_radians'
  | 'deterministic_label';

export type EnvelopeSourceKind = 'constant' | 'runtime_record_field' | 'caller_provided';

export interface ComponentSourceMapping {
  packet_component: string;
  value_kind: string;
  source_consumption_slot: string;
  payload_path: string;
  additional_source_paths: string[];
  extraction: ExtractionMode;
  label_rule: {
    from_fields: string[];
    bands: string[];
  } | null;
  note: string;
}

export interface EnvelopeFieldMapping {
  field: string;
  source_kind: EnvelopeSourceKind;
  value: string | number | null;
  runtime_record_path: string | null;
  note: string;
}

export interface ChannelAssembly {
  channel_id: ConditioningChannelId;
  order_index: number;
  foundation_consumption_slot: string;
  runtime_layer: typeof RUNTIME_CONSUMPTION_LAYER;
  envelope_field_mappings: EnvelopeFieldMapping[];
  component_source_mappings: ComponentSourceMapping[];
}

export interface RequiredInput {
  input_id: string;
  kind: 'certified_artifact' | 'runtime_selector' | 'caller_value' | 'design_artifact';
  ref: string | null;
  description: string;
  read_only: true;
}

export interface AssemblyStep {
  step_index: number;
  step_id: string;
  description: string;
  reads: string[];
  produces: string;
}

export interface DirectSpatialConditioningPacketAssembly {
  assembly_specification_id: string;
  phase: typeof DSC_PACKET_ASSEMBLY_PHASE;
  system_id: typeof DSC_PACKET_ASSEMBLY_SYSTEM_ID;
  mode: 'design_only_assembly';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_ASSEMBLY_V1';
  packet_ref: string;
  validation_ref: string;
  runtime_package_ref: string;
  runtime_package_phase: typeof NUMERICAL_RECONSTRUCTION_EXPORT_PHASE;
  runtime_consumption_layer: typeof RUNTIME_CONSUMPTION_LAYER;
  sources_supported: string[];
  required_inputs: RequiredInput[];
  assembly_order: AssemblyStep[];
  metadata_assembly: EnvelopeFieldMapping[];
  channel_assemblies: ChannelAssembly[];
  design_constraints: {
    assembly_only: true;
    reuses_certified_runtime_package: true;
    backend: 'none';
    gpu: false;
    inference: false;
    assembles_packet_instances_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const FRAME = SPATIAL_FRAME.frame_id;

const METADATA_ASSEMBLY: EnvelopeFieldMapping[] = [
  {
    field: 'packet_id',
    source_kind: 'caller_provided',
    value: null,
    runtime_record_path: null,
    note: 'Caller-assigned opaque runtime packet identity; not sourced from datasets.',
  },
  {
    field: 'packet_version',
    source_kind: 'constant',
    value: 'v1',
    runtime_record_path: null,
    note: 'Fixed by the PHASE-032 packet specification.',
  },
  {
    field: 'source_video_id',
    source_kind: 'runtime_record_field',
    value: null,
    runtime_record_path: 'source_video_id',
    note: 'Copied from the selected consumption record source_video_id.',
  },
  {
    field: 'spatial_frame_ref',
    source_kind: 'constant',
    value: FRAME,
    runtime_record_path: null,
    note: 'Locked spatial frame shared by every channel.',
  },
  {
    field: 'timebase',
    source_kind: 'constant',
    value: 'milliseconds',
    runtime_record_path: null,
    note: 'All timestamps expressed in milliseconds.',
  },
  {
    field: 'contract_id',
    source_kind: 'constant',
    value: CONTRACT_ID,
    runtime_record_path: null,
    note: 'References the PHASE-031 conditioning contract.',
  },
  {
    field: 'channel_count',
    source_kind: 'constant',
    value: 6,
    runtime_record_path: null,
    note: 'Fixed channel cardinality declared by the packet specification.',
  },
];

function envelopeFieldMappings(channelId: ConditioningChannelId): EnvelopeFieldMapping[] {
  return [
    {
      field: 'channel_id',
      source_kind: 'constant',
      value: channelId,
      runtime_record_path: null,
      note: 'Fixed to the channel being assembled.',
    },
    {
      field: 'source_video_id',
      source_kind: 'runtime_record_field',
      value: null,
      runtime_record_path: 'source_video_id',
      note: 'Copied from the selected consumption record source_video_id.',
    },
    {
      field: 'spatial_frame_ref',
      source_kind: 'constant',
      value: FRAME,
      runtime_record_path: null,
      note: 'Locked spatial frame.',
    },
    {
      field: 'timestamp_ms',
      source_kind: 'runtime_record_field',
      value: null,
      runtime_record_path: 'identity.source_timestamp_ms',
      note: 'Copied from the consumption record anchor timestamp.',
    },
    {
      field: 'components',
      source_kind: 'constant',
      value: 'assembled_from_component_source_mappings',
      runtime_record_path: null,
      note: 'Populated from component_source_mappings of this channel.',
    },
  ];
}

function component(
  packet_component: string,
  value_kind: string,
  source_consumption_slot: string,
  payload_path: string,
  extraction: ExtractionMode,
  note: string,
  additional_source_paths: string[] = [],
  label_rule: ComponentSourceMapping['label_rule'] = null
): ComponentSourceMapping {
  return {
    packet_component,
    value_kind,
    source_consumption_slot,
    payload_path,
    additional_source_paths,
    extraction,
    label_rule,
    note,
  };
}

/**
 * Field-level mapping from the certified runtime package consumption slots into
 * each packet channel's components. Each payload_path is resolved against the
 * matching pipeline binding's `payload` object in the consumption record.
 */
const CHANNEL_COMPONENT_SOURCES: Record<ConditioningChannelId, ComponentSourceMapping[]> = {
  camera_pose_field: [
    component(
      'translation_u',
      'number',
      'camera_temporal',
      'camera_motion.camera_translation.dx',
      'direct_copy',
      'Normalized camera translation along u.'
    ),
    component(
      'translation_v',
      'number',
      'camera_temporal',
      'camera_motion.camera_translation.dy',
      'direct_copy',
      'Normalized camera translation along v.'
    ),
    component(
      'rotation_rad',
      'number',
      'camera_temporal',
      'camera_motion.camera_rotation',
      'unit_normalize_degrees_to_radians',
      'In-plane camera rotation; deterministic degrees to radians normalization.'
    ),
    component(
      'zoom_scale',
      'number',
      'camera_temporal',
      'camera_motion.zoom_strength',
      'direct_copy',
      'Unitless zoom scale magnitude.'
    ),
  ],
  camera_temporal_track: [
    component(
      'motion_type',
      'string',
      'camera_temporal',
      'camera_motion.camera_motion_type',
      'direct_copy',
      'Camera motion class label.'
    ),
    component(
      'magnitude',
      'number',
      'camera_temporal',
      'camera_motion.motion_magnitude',
      'direct_copy',
      'Camera motion magnitude.'
    ),
    component(
      'translation_u',
      'number',
      'camera_temporal',
      'camera_motion.camera_translation.dx',
      'direct_copy',
      'Pair translation along u.'
    ),
    component(
      'translation_v',
      'number',
      'camera_temporal',
      'camera_motion.camera_translation.dy',
      'direct_copy',
      'Pair translation along v.'
    ),
  ],
  subject_position_field: [
    component(
      'center_u',
      'number',
      'framing',
      'composition_metrics.subject_screen_position.x',
      'direct_copy',
      'Subject screen-position center u.'
    ),
    component(
      'center_v',
      'number',
      'framing',
      'composition_metrics.subject_screen_position.y',
      'direct_copy',
      'Subject screen-position center v.'
    ),
    component(
      'displacement_u',
      'number',
      'subject_temporal',
      'subject_motion.subject_translation.dx',
      'direct_copy',
      'Subject displacement along u.'
    ),
    component(
      'displacement_v',
      'number',
      'subject_temporal',
      'subject_motion.subject_translation.dy',
      'direct_copy',
      'Subject displacement along v.'
    ),
  ],
  framing_composition_map: [
    component(
      'shot_scale',
      'string',
      'framing',
      'composition_metrics.subject_area_ratio',
      'deterministic_label',
      'Shot-scale label from subject area ratio bands (deterministic lookup, no inference).',
      [],
      {
        from_fields: ['composition_metrics.subject_area_ratio'],
        bands: ['area_ratio>=0.5:close', '0.2<=area_ratio<0.5:medium', 'area_ratio<0.2:wide'],
      }
    ),
    component(
      'composition_region',
      'string',
      'framing',
      'composition_metrics.subject_screen_position.x',
      'deterministic_label',
      'Composition region from subject screen-position thirds (deterministic lookup, no inference).',
      ['composition_metrics.subject_screen_position.y'],
      {
        from_fields: [
          'composition_metrics.subject_screen_position.x',
          'composition_metrics.subject_screen_position.y',
        ],
        bands: [
          'x<0.33:left',
          '0.33<=x<0.66:center',
          'x>=0.66:right',
          'y<0.33:top',
          '0.33<=y<0.66:middle',
          'y>=0.66:bottom',
        ],
      }
    ),
  ],
  edit_rhythm_boundaries: [
    component(
      'cut_timestamp_ms',
      'number_array',
      'edit_rhythm',
      'camera_transition_metrics.cut_timestamps_ms',
      'rename_copy',
      'Ordered cut boundary timestamps (source field cut_timestamps_ms).'
    ),
    component(
      'shot_duration_ms',
      'number_array',
      'edit_rhythm',
      'camera_transition_metrics.shot_duration_ms',
      'direct_copy',
      'Per-shot durations aligned to cut boundaries.'
    ),
  ],
  scene_energy_field: [
    component(
      'motion_magnitude',
      'number',
      'scene_energy',
      'scene_dynamics.visual_focus_shift.magnitude',
      'direct_copy',
      'Scene motion magnitude from visual focus shift.'
    ),
    component(
      'camera_subject_relationship',
      'string',
      'scene_energy',
      'scene_dynamics.motion_relationship',
      'direct_copy',
      'Camera/subject relationship class.'
    ),
    component(
      'relative_velocity',
      'number',
      'scene_energy',
      'scene_dynamics.relative_velocity.magnitude',
      'direct_copy',
      'Camera vs subject relative velocity magnitude.'
    ),
  ],
};

const FOUNDATION_SLOT_BY_CHANNEL: Record<ConditioningChannelId, string> = {
  camera_pose_field: 'camera_pose',
  camera_temporal_track: 'camera_temporal',
  subject_position_field: 'subject_temporal',
  framing_composition_map: 'framing',
  edit_rhythm_boundaries: 'edit_rhythm',
  scene_energy_field: 'scene_energy',
};

const REQUIRED_INPUTS: RequiredInput[] = [
  {
    input_id: 'certified_runtime_package',
    kind: 'certified_artifact',
    ref: RUNTIME_PACKAGE_PATH,
    description:
      'Certified Movie Reconstruction runtime package (PHASE-027); read-only source of consumption records.',
    read_only: true,
  },
  {
    input_id: 'source_video_id',
    kind: 'runtime_selector',
    ref: null,
    description: 'One of the 15 certified corpus source ids selecting which consumption record to map.',
    read_only: true,
  },
  {
    input_id: 'packet_id',
    kind: 'caller_value',
    ref: null,
    description: 'Caller-assigned opaque packet identity written to packet metadata.',
    read_only: true,
  },
  {
    input_id: 'packet_specification',
    kind: 'design_artifact',
    ref: PACKET_PATH,
    description: 'PHASE-032 packet specification defining the target packet shape.',
    read_only: true,
  },
  {
    input_id: 'packet_validation_specification',
    kind: 'design_artifact',
    ref: VALIDATION_PATH,
    description: 'PHASE-033 validation specification applied as the post-assembly acceptance gate.',
    read_only: true,
  },
];

const ASSEMBLY_ORDER: AssemblyStep[] = [
  {
    step_index: 0,
    step_id: 'resolve_source',
    description:
      'Validate source_video_id is a certified corpus id and locate its entry in the runtime package.',
    reads: ['certified_runtime_package', 'source_video_id'],
    produces: 'runtime_source_entry',
  },
  {
    step_index: 1,
    step_id: 'load_consumption_record',
    description:
      'Load the consumption layer record referenced by runtime_package.sources[sid].layers.consumption.',
    reads: ['runtime_source_entry'],
    produces: 'consumption_record',
  },
  {
    step_index: 2,
    step_id: 'assemble_metadata',
    description: 'Populate packet metadata from constants, caller packet_id, and consumption record fields.',
    reads: ['consumption_record', 'packet_id'],
    produces: 'packet_metadata',
  },
  {
    step_index: 3,
    step_id: 'assemble_channels_in_order',
    description:
      'For each channel in packet channel_order, copy envelope fields and map components from the named consumption slots.',
    reads: ['consumption_record', 'packet_specification'],
    produces: 'packet_channels',
  },
  {
    step_index: 4,
    step_id: 'finalize_packet',
    description: 'Combine metadata and ordered channels into a packet conforming to the PHASE-032 specification.',
    reads: ['packet_metadata', 'packet_channels'],
    produces: 'assembled_packet_candidate',
  },
  {
    step_index: 5,
    step_id: 'apply_validation_gate',
    description:
      'Apply the PHASE-033 validation specification; accept only when zero rejection codes are emitted.',
    reads: ['assembled_packet_candidate', 'packet_validation_specification'],
    produces: 'validation_outcome',
  },
];

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/**
 * Build the design-only packet assembly specification. Reads the certified
 * runtime package and PHASE-032 packet spec (read-only) to guarantee the
 * mapping covers exactly the packet surface, then emits the assembly design.
 */
export function buildDirectSpatialConditioningPacketAssembly(projectRoot?: string): {
  assembly: DirectSpatialConditioningPacketAssembly;
} {
  const root = resolveProjectRoot(projectRoot);

  const runtimePackage = readJson<NumericalReconstructionRuntimePackage>(
    root,
    RUNTIME_PACKAGE_PATH
  );
  if (runtimePackage.phase !== NUMERICAL_RECONSTRUCTION_EXPORT_PHASE) {
    throw new Error('Certified runtime package must remain PHASE-027');
  }
  if (!runtimePackage.load_order.includes(RUNTIME_CONSUMPTION_LAYER)) {
    throw new Error('Runtime package load_order missing consumption layer');
  }
  if (runtimePackage.sources.length !== SOURCE_IDS.length) {
    throw new Error('Runtime package source count mismatch');
  }

  const packet = readJson<DirectSpatialConditioningPacket>(root, PACKET_PATH);
  if (
    JSON.stringify(packet.packet_structure.channel_order) !==
    JSON.stringify(CONDITIONING_CHANNEL_IDS)
  ) {
    throw new Error('Packet channel order does not match foundation channels');
  }

  // Coverage: assembly must map exactly the packet's declared components.
  const channel_assemblies: ChannelAssembly[] = CONDITIONING_CHANNEL_IDS.map(
    (channelId, index) => {
      const payload = packet.channel_payloads.find((p) => p.channel_id === channelId);
      if (!payload) throw new Error(`Packet missing channel ${channelId}`);
      const mappings = CHANNEL_COMPONENT_SOURCES[channelId];
      const declared = payload.component_fields.map((c) => c.name);
      const mapped = mappings.map((m) => m.packet_component);
      if (JSON.stringify(declared) !== JSON.stringify(mapped)) {
        throw new Error(`Assembly component drift for ${channelId}`);
      }
      return {
        channel_id: channelId,
        order_index: index,
        foundation_consumption_slot: FOUNDATION_SLOT_BY_CHANNEL[channelId],
        runtime_layer: RUNTIME_CONSUMPTION_LAYER,
        envelope_field_mappings: envelopeFieldMappings(channelId),
        component_source_mappings: mappings,
      };
    }
  );

  const assembly: DirectSpatialConditioningPacketAssembly = {
    assembly_specification_id: 'direct-spatial-conditioning-packet-assembly-v1',
    phase: DSC_PACKET_ASSEMBLY_PHASE,
    system_id: DSC_PACKET_ASSEMBLY_SYSTEM_ID,
    mode: 'design_only_assembly',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_ASSEMBLY_V1',
    packet_ref: PACKET_PATH,
    validation_ref: VALIDATION_PATH,
    runtime_package_ref: RUNTIME_PACKAGE_PATH,
    runtime_package_phase: NUMERICAL_RECONSTRUCTION_EXPORT_PHASE,
    runtime_consumption_layer: RUNTIME_CONSUMPTION_LAYER,
    sources_supported: [...SOURCE_IDS],
    required_inputs: REQUIRED_INPUTS,
    assembly_order: ASSEMBLY_ORDER,
    metadata_assembly: METADATA_ASSEMBLY,
    channel_assemblies,
    design_constraints: {
      assembly_only: true,
      reuses_certified_runtime_package: true,
      backend: 'none',
      gpu: false,
      inference: false,
      assembles_packet_instances_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, ASSEMBLY_PATH, assembly);
  return { assembly };
}
