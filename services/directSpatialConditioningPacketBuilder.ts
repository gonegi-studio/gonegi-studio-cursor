import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONTRACT_PATH,
  DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE,
  DIRECT_SPATIAL_CONDITIONING_CONTRACT_SYSTEM_ID,
  type ChannelComponentSchema,
  type DirectSpatialConditioningContract,
} from './directSpatialConditioningContractBuilder.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';

/**
 * PHASE-DSC-032: runtime conditioning packet design.
 * Packet specification only: no packet instance, values, backend, GPU, inference,
 * tensor/frame materialization, or dataset access.
 */
export const DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE = 'PHASE-DSC-032' as const;
export const DIRECT_SPATIAL_CONDITIONING_PACKET_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_PACKET_V1' as const;
export const PACKET_ROOT = 'exports/direct_spatial_conditioning/v1' as const;
export const PACKET_PATH =
  `${PACKET_ROOT}/direct-spatial-conditioning-packet-v1.json` as const;

export interface PacketFieldDefinition {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface ChannelPayloadDefinition {
  channel_id: ConditioningChannelId;
  payload_id: string;
  contract_input_schema_ref: string;
  envelope_fields: PacketFieldDefinition[];
  component_fields: ChannelComponentSchema[];
  serialization: 'json_object';
  additional_components: false;
}

export interface DirectSpatialConditioningPacket {
  packet_specification_id: string;
  phase: typeof DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE;
  system_id: typeof DIRECT_SPATIAL_CONDITIONING_PACKET_SYSTEM_ID;
  mode: 'design_only_packet';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_V1';
  contract_ref: string;
  contract_phase: typeof DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE;
  contract_system_id: typeof DIRECT_SPATIAL_CONDITIONING_CONTRACT_SYSTEM_ID;
  packet_structure: {
    packet_type: 'direct_spatial_conditioning_packet';
    packet_version: 'v1';
    encoding: 'application/json';
    required_sections: ['metadata', 'channels'];
    channel_cardinality: 6;
    channel_order: ConditioningChannelId[];
    additional_channels: false;
  };
  metadata: {
    schema_id: 'dsc-packet-metadata-v1';
    fields: PacketFieldDefinition[];
    spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  };
  channel_payloads: ChannelPayloadDefinition[];
  packet_invariants: string[];
  design_constraints: {
    packet_only: true;
    backend: 'none';
    gpu: false;
    inference: false;
    materializes_tensors: false;
    materializes_frames: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const ENVELOPE_FIELDS: PacketFieldDefinition[] = [
  {
    field: 'channel_id',
    type: 'conditioning_channel_id',
    required: true,
    nullable: false,
    constraint: 'must equal enclosing channel payload definition channel_id',
  },
  {
    field: 'source_video_id',
    type: 'string',
    required: true,
    nullable: false,
    constraint: 'non-empty certified corpus source id',
  },
  {
    field: 'spatial_frame_ref',
    type: 'string',
    required: true,
    nullable: false,
    constraint: 'must equal normalized_image_plane_v1',
  },
  {
    field: 'timestamp_ms',
    type: 'finite_number',
    required: true,
    nullable: false,
    constraint: 'greater than or equal to zero',
  },
  {
    field: 'components',
    type: 'json_object',
    required: true,
    nullable: false,
    constraint: 'exact component set declared by channel payload definition',
  },
];

const METADATA_FIELDS: PacketFieldDefinition[] = [
  {
    field: 'packet_id',
    type: 'string',
    required: true,
    nullable: false,
    constraint: 'non-empty caller-assigned runtime identity',
  },
  {
    field: 'packet_version',
    type: 'string',
    required: true,
    nullable: false,
    constraint: 'must equal v1',
  },
  {
    field: 'source_video_id',
    type: 'string',
    required: true,
    nullable: false,
    constraint: 'non-empty certified corpus source id shared by every channel',
  },
  {
    field: 'spatial_frame_ref',
    type: 'string',
    required: true,
    nullable: false,
    constraint: 'must equal normalized_image_plane_v1',
  },
  {
    field: 'timebase',
    type: 'string',
    required: true,
    nullable: false,
    constraint: 'must equal milliseconds',
  },
  {
    field: 'contract_id',
    type: 'string',
    required: true,
    nullable: false,
    constraint: 'must equal direct-spatial-conditioning-contract-v1',
  },
  {
    field: 'channel_count',
    type: 'integer',
    required: true,
    nullable: false,
    constraint: 'must equal 6',
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

export function buildDirectSpatialConditioningPacket(projectRoot?: string): {
  packet: DirectSpatialConditioningPacket;
} {
  const root = resolveProjectRoot(projectRoot);
  const contract = readJson<DirectSpatialConditioningContract>(root, CONTRACT_PATH);
  if (
    contract.phase !== DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE ||
    contract.system_id !== DIRECT_SPATIAL_CONDITIONING_CONTRACT_SYSTEM_ID
  ) {
    throw new Error('PHASE-031 conditioning contract is missing or incompatible');
  }

  const channelPayloads = CONDITIONING_CHANNEL_IDS.map((channelId) => {
    const channelContract = contract.channel_contracts.find(
      (entry) => entry.channel_id === channelId
    );
    if (!channelContract) throw new Error(`Missing contract channel ${channelId}`);
    return {
      channel_id: channelId,
      payload_id: `dsc-channel-payload-${channelId}-v1`,
      contract_input_schema_ref: channelContract.input_schema.schema_id,
      envelope_fields: ENVELOPE_FIELDS,
      component_fields: channelContract.input_schema.fields.components,
      serialization: 'json_object' as const,
      additional_components: false as const,
    };
  });

  const packet: DirectSpatialConditioningPacket = {
    packet_specification_id: 'direct-spatial-conditioning-packet-v1',
    phase: DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE,
    system_id: DIRECT_SPATIAL_CONDITIONING_PACKET_SYSTEM_ID,
    mode: 'design_only_packet',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_V1',
    contract_ref: CONTRACT_PATH,
    contract_phase: DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE,
    contract_system_id: DIRECT_SPATIAL_CONDITIONING_CONTRACT_SYSTEM_ID,
    packet_structure: {
      packet_type: 'direct_spatial_conditioning_packet',
      packet_version: 'v1',
      encoding: 'application/json',
      required_sections: ['metadata', 'channels'],
      channel_cardinality: 6,
      channel_order: [...CONDITIONING_CHANNEL_IDS],
      additional_channels: false,
    },
    metadata: {
      schema_id: 'dsc-packet-metadata-v1',
      fields: METADATA_FIELDS,
      spatial_frame_ref: SPATIAL_FRAME.frame_id,
    },
    channel_payloads: channelPayloads,
    packet_invariants: [
      'metadata.source_video_id equals every channel source_video_id',
      'metadata.spatial_frame_ref equals every channel spatial_frame_ref',
      'channel payload set equals the six PHASE-031 contract channels',
      'each channel components object contains exactly its declared component fields',
      'timestamps use the metadata timebase and are finite non-negative milliseconds',
      'packet carries data only and triggers no execution or inference',
    ],
    design_constraints: {
      packet_only: true,
      backend: 'none',
      gpu: false,
      inference: false,
      materializes_tensors: false,
      materializes_frames: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, PACKET_PATH, packet);
  return { packet };
}
