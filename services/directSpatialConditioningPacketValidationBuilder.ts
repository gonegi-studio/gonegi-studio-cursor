import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';
import type { ComponentValueKind } from './directSpatialConditioningContractBuilder.js';
import {
  DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE,
  DIRECT_SPATIAL_CONDITIONING_PACKET_SYSTEM_ID,
  PACKET_PATH,
  type DirectSpatialConditioningPacket,
} from './directSpatialConditioningPacketBuilder.js';

/**
 * PHASE-DSC-033: Direct Spatial Conditioning packet validation design.
 *
 * DESIGN ONLY / VALIDATION ONLY. Specifies how a runtime MUST validate a
 * PHASE-032 conditioning packet: metadata checks, per-channel payload checks,
 * cross-channel consistency checks, and the rejection code catalog. No packet
 * instance is validated here, and no backend, GPU, inference, or dataset
 * access occurs.
 */

export const DSC_PACKET_VALIDATION_PHASE = 'PHASE-DSC-033' as const;
export const DSC_PACKET_VALIDATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_PACKET_VALIDATION_V1' as const;

export const VALIDATION_ROOT = 'exports/direct_spatial_conditioning/v1' as const;
export const VALIDATION_PATH =
  `${VALIDATION_ROOT}/direct-spatial-conditioning-packet-validation-v1.json` as const;

export type RejectionCategory =
  | 'structural'
  | 'metadata'
  | 'channel_payload'
  | 'cross_channel';

export interface RejectionCode {
  code: string;
  category: RejectionCategory;
  severity: 'reject';
  description: string;
  remediation: string;
}

export interface ValidationCheck {
  check_id: string;
  stage: 'structural' | 'metadata' | 'channel_payload' | 'cross_channel';
  applies_to: string;
  description: string;
  predicate: string;
  rejection_code: string;
}

export interface ChannelPayloadValidation {
  channel_id: ConditioningChannelId;
  payload_id: string;
  envelope_checks: ValidationCheck[];
  component_checks: ValidationCheck[];
  closed_component_set: true;
}

export interface DirectSpatialConditioningPacketValidation {
  validation_specification_id: string;
  phase: typeof DSC_PACKET_VALIDATION_PHASE;
  system_id: typeof DSC_PACKET_VALIDATION_SYSTEM_ID;
  mode: 'design_only_validation';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_VALIDATION_V1';
  packet_ref: string;
  packet_phase: typeof DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE;
  packet_system_id: typeof DIRECT_SPATIAL_CONDITIONING_PACKET_SYSTEM_ID;
  validation_procedure: {
    ordered_stages: Array<'structural' | 'metadata' | 'channel_payload' | 'cross_channel'>;
    evaluation: 'collect_all_rejections';
    accept_condition: 'zero rejection codes emitted across all stages';
    outcome_values: ['accepted', 'rejected'];
  };
  kind_predicates: Record<ComponentValueKind, string>;
  structural_checks: ValidationCheck[];
  metadata_checks: ValidationCheck[];
  channel_payload_validations: ChannelPayloadValidation[];
  cross_channel_checks: ValidationCheck[];
  rejection_codes: RejectionCode[];
  design_constraints: {
    validation_only: true;
    backend: 'none';
    gpu: false;
    inference: false;
    validates_packet_instances_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

export const KIND_PREDICATES: Record<ComponentValueKind, string> = {
  number: 'typeof value === "number" AND Number.isFinite(value)',
  string: 'typeof value === "string" AND value.length > 0',
  boolean: 'typeof value === "boolean"',
  number_array:
    'Array.isArray(value) AND value.length > 0 AND value.every(Number.isFinite)',
  string_array:
    'Array.isArray(value) AND value.every(v => typeof v === "string" AND v.length > 0)',
};

export const REJECTION_CODES: RejectionCode[] = [
  {
    code: 'DSC_REJ_PACKET_NOT_OBJECT',
    category: 'structural',
    severity: 'reject',
    description: 'Packet root is not a JSON object.',
    remediation: 'Send an application/json object with metadata and channels sections.',
  },
  {
    code: 'DSC_REJ_SECTION_MISSING',
    category: 'structural',
    severity: 'reject',
    description: 'A required top-level section (metadata or channels) is absent.',
    remediation: 'Include both required sections declared by the packet specification.',
  },
  {
    code: 'DSC_REJ_SECTION_UNKNOWN',
    category: 'structural',
    severity: 'reject',
    description: 'Packet carries a top-level section outside the declared required sections.',
    remediation: 'Remove sections not declared by the packet specification.',
  },
  {
    code: 'DSC_REJ_CHANNELS_NOT_ARRAY',
    category: 'structural',
    severity: 'reject',
    description: 'channels section is not an array.',
    remediation: 'Encode channels as an array of channel payload objects.',
  },
  {
    code: 'DSC_REJ_METADATA_FIELD_MISSING',
    category: 'metadata',
    severity: 'reject',
    description: 'A required metadata field is absent.',
    remediation: 'Populate every metadata field declared by the packet specification.',
  },
  {
    code: 'DSC_REJ_METADATA_FIELD_NULL',
    category: 'metadata',
    severity: 'reject',
    description: 'A required metadata field is null.',
    remediation: 'Metadata fields are non-nullable; supply a concrete value.',
  },
  {
    code: 'DSC_REJ_METADATA_FIELD_TYPE',
    category: 'metadata',
    severity: 'reject',
    description: 'A metadata field violates its declared type.',
    remediation: 'Match the declared metadata field type.',
  },
  {
    code: 'DSC_REJ_METADATA_PACKET_VERSION',
    category: 'metadata',
    severity: 'reject',
    description: 'metadata.packet_version does not equal the specified packet version.',
    remediation: 'Set metadata.packet_version to v1.',
  },
  {
    code: 'DSC_REJ_METADATA_SPATIAL_FRAME',
    category: 'metadata',
    severity: 'reject',
    description: 'metadata.spatial_frame_ref does not equal the locked spatial frame.',
    remediation: `Set metadata.spatial_frame_ref to ${SPATIAL_FRAME.frame_id}.`,
  },
  {
    code: 'DSC_REJ_METADATA_TIMEBASE',
    category: 'metadata',
    severity: 'reject',
    description: 'metadata.timebase is not milliseconds.',
    remediation: 'Set metadata.timebase to milliseconds.',
  },
  {
    code: 'DSC_REJ_METADATA_CONTRACT_ID',
    category: 'metadata',
    severity: 'reject',
    description: 'metadata.contract_id does not reference the PHASE-031 conditioning contract.',
    remediation: 'Set metadata.contract_id to direct-spatial-conditioning-contract-v1.',
  },
  {
    code: 'DSC_REJ_METADATA_CHANNEL_COUNT',
    category: 'metadata',
    severity: 'reject',
    description: 'metadata.channel_count does not equal the declared channel cardinality.',
    remediation: 'Set metadata.channel_count to 6.',
  },
  {
    code: 'DSC_REJ_CHANNEL_UNKNOWN',
    category: 'channel_payload',
    severity: 'reject',
    description: 'Packet carries a channel_id outside the six declared channels.',
    remediation: 'Send only the six declared conditioning channels.',
  },
  {
    code: 'DSC_REJ_ENVELOPE_FIELD_MISSING',
    category: 'channel_payload',
    severity: 'reject',
    description: 'A required channel envelope field is absent.',
    remediation: 'Populate every envelope field declared for the channel payload.',
  },
  {
    code: 'DSC_REJ_ENVELOPE_FIELD_NULL',
    category: 'channel_payload',
    severity: 'reject',
    description: 'A required channel envelope field is null.',
    remediation: 'Envelope fields are non-nullable; supply a concrete value.',
  },
  {
    code: 'DSC_REJ_CHANNEL_ID_MISMATCH',
    category: 'channel_payload',
    severity: 'reject',
    description: 'Channel payload channel_id does not match its payload definition.',
    remediation: 'Set channel_id to the channel the payload declares.',
  },
  {
    code: 'DSC_REJ_CHANNEL_FRAME_MISMATCH',
    category: 'channel_payload',
    severity: 'reject',
    description: 'Channel spatial_frame_ref does not equal the locked spatial frame.',
    remediation: `Set channel spatial_frame_ref to ${SPATIAL_FRAME.frame_id}.`,
  },
  {
    code: 'DSC_REJ_CHANNEL_TIMESTAMP_INVALID',
    category: 'channel_payload',
    severity: 'reject',
    description: 'Channel timestamp_ms is not a finite number greater than or equal to zero.',
    remediation: 'Send a finite non-negative millisecond timestamp.',
  },
  {
    code: 'DSC_REJ_CHANNEL_SOURCE_ID_EMPTY',
    category: 'channel_payload',
    severity: 'reject',
    description: 'Channel source_video_id is empty or not a string.',
    remediation: 'Send a non-empty certified corpus source id.',
  },
  {
    code: 'DSC_REJ_COMPONENTS_NOT_OBJECT',
    category: 'channel_payload',
    severity: 'reject',
    description: 'Channel components is not a JSON object.',
    remediation: 'Encode components as a JSON object keyed by component name.',
  },
  {
    code: 'DSC_REJ_COMPONENT_MISSING',
    category: 'channel_payload',
    severity: 'reject',
    description: 'A declared component is absent from the channel components object.',
    remediation: 'Supply every component declared for the channel.',
  },
  {
    code: 'DSC_REJ_COMPONENT_NULL',
    category: 'channel_payload',
    severity: 'reject',
    description: 'A declared component is null.',
    remediation: 'Components are non-nullable; supply a concrete value.',
  },
  {
    code: 'DSC_REJ_COMPONENT_TYPE',
    category: 'channel_payload',
    severity: 'reject',
    description: 'A component value violates its declared value kind.',
    remediation: 'Match the component value kind declared by the packet specification.',
  },
  {
    code: 'DSC_REJ_COMPONENT_UNKNOWN',
    category: 'channel_payload',
    severity: 'reject',
    description: 'Channel components object carries a component outside the declared set.',
    remediation: 'The component set is closed; remove undeclared components.',
  },
  {
    code: 'DSC_REJ_CHANNEL_SET_INCOMPLETE',
    category: 'cross_channel',
    severity: 'reject',
    description: 'Packet does not carry all six declared conditioning channels.',
    remediation: 'Include every declared channel exactly once.',
  },
  {
    code: 'DSC_REJ_CHANNEL_DUPLICATE',
    category: 'cross_channel',
    severity: 'reject',
    description: 'A channel_id appears more than once in the packet.',
    remediation: 'Send each channel exactly once.',
  },
  {
    code: 'DSC_REJ_CHANNEL_ORDER',
    category: 'cross_channel',
    severity: 'reject',
    description: 'Channel sequence does not follow the declared channel order.',
    remediation: 'Order channels as declared by the packet specification.',
  },
  {
    code: 'DSC_REJ_SOURCE_ID_DIVERGENT',
    category: 'cross_channel',
    severity: 'reject',
    description: 'Channel source_video_id values disagree with metadata.source_video_id.',
    remediation: 'All channels must describe the same source video as the metadata.',
  },
  {
    code: 'DSC_REJ_FRAME_DIVERGENT',
    category: 'cross_channel',
    severity: 'reject',
    description: 'Channel spatial_frame_ref values disagree with metadata.spatial_frame_ref.',
    remediation: 'All channels must share the metadata spatial frame.',
  },
  {
    code: 'DSC_REJ_CHANNEL_COUNT_DIVERGENT',
    category: 'cross_channel',
    severity: 'reject',
    description: 'metadata.channel_count disagrees with the number of channel payloads sent.',
    remediation: 'Keep metadata.channel_count equal to channels.length.',
  },
  {
    code: 'DSC_REJ_EDIT_RHYTHM_LENGTH_MISMATCH',
    category: 'cross_channel',
    severity: 'reject',
    description:
      'edit_rhythm_boundaries cut_timestamp_ms and shot_duration_ms have different lengths.',
    remediation: 'Send one duration per cut boundary.',
  },
];

const STRUCTURAL_CHECKS: ValidationCheck[] = [
  {
    check_id: 'STRUCT_PACKET_IS_OBJECT',
    stage: 'structural',
    applies_to: 'packet',
    description: 'Packet root must be a JSON object.',
    predicate: 'typeof packet === "object" AND packet !== null AND !Array.isArray(packet)',
    rejection_code: 'DSC_REJ_PACKET_NOT_OBJECT',
  },
  {
    check_id: 'STRUCT_REQUIRED_SECTIONS_PRESENT',
    stage: 'structural',
    applies_to: 'packet',
    description: 'Packet must contain the metadata and channels sections.',
    predicate: 'has(packet, "metadata") AND has(packet, "channels")',
    rejection_code: 'DSC_REJ_SECTION_MISSING',
  },
  {
    check_id: 'STRUCT_NO_UNKNOWN_SECTIONS',
    stage: 'structural',
    applies_to: 'packet',
    description: 'Packet must not carry sections beyond the declared required sections.',
    predicate: 'keys(packet) subset_of ["metadata", "channels"]',
    rejection_code: 'DSC_REJ_SECTION_UNKNOWN',
  },
  {
    check_id: 'STRUCT_CHANNELS_IS_ARRAY',
    stage: 'structural',
    applies_to: 'packet.channels',
    description: 'channels section must be an array of channel payloads.',
    predicate: 'Array.isArray(packet.channels)',
    rejection_code: 'DSC_REJ_CHANNELS_NOT_ARRAY',
  },
];

const CROSS_CHANNEL_CHECKS: ValidationCheck[] = [
  {
    check_id: 'CROSS_CHANNEL_SET_COMPLETE',
    stage: 'cross_channel',
    applies_to: 'packet.channels',
    description: 'All six declared conditioning channels must be present.',
    predicate: 'set(packet.channels[].channel_id) === declared_channel_ids',
    rejection_code: 'DSC_REJ_CHANNEL_SET_INCOMPLETE',
  },
  {
    check_id: 'CROSS_CHANNEL_NO_DUPLICATES',
    stage: 'cross_channel',
    applies_to: 'packet.channels',
    description: 'No channel_id may appear more than once.',
    predicate: 'unique(packet.channels[].channel_id)',
    rejection_code: 'DSC_REJ_CHANNEL_DUPLICATE',
  },
  {
    check_id: 'CROSS_CHANNEL_ORDER_MATCHES',
    stage: 'cross_channel',
    applies_to: 'packet.channels',
    description: 'Channel sequence must follow the declared channel order.',
    predicate: 'packet.channels[].channel_id === declared_channel_order',
    rejection_code: 'DSC_REJ_CHANNEL_ORDER',
  },
  {
    check_id: 'CROSS_SOURCE_ID_CONSISTENT',
    stage: 'cross_channel',
    applies_to: 'packet',
    description: 'Every channel source_video_id must equal metadata.source_video_id.',
    predicate:
      'packet.channels.every(c => c.source_video_id === packet.metadata.source_video_id)',
    rejection_code: 'DSC_REJ_SOURCE_ID_DIVERGENT',
  },
  {
    check_id: 'CROSS_SPATIAL_FRAME_CONSISTENT',
    stage: 'cross_channel',
    applies_to: 'packet',
    description: 'Every channel spatial_frame_ref must equal metadata.spatial_frame_ref.',
    predicate:
      'packet.channels.every(c => c.spatial_frame_ref === packet.metadata.spatial_frame_ref)',
    rejection_code: 'DSC_REJ_FRAME_DIVERGENT',
  },
  {
    check_id: 'CROSS_CHANNEL_COUNT_CONSISTENT',
    stage: 'cross_channel',
    applies_to: 'packet',
    description: 'metadata.channel_count must equal the number of channel payloads.',
    predicate: 'packet.metadata.channel_count === packet.channels.length',
    rejection_code: 'DSC_REJ_CHANNEL_COUNT_DIVERGENT',
  },
  {
    check_id: 'CROSS_EDIT_RHYTHM_LENGTHS_ALIGN',
    stage: 'cross_channel',
    applies_to: 'edit_rhythm_boundaries',
    description:
      'edit_rhythm_boundaries must carry one shot duration per cut boundary timestamp.',
    predicate:
      'components.cut_timestamp_ms.length === components.shot_duration_ms.length',
    rejection_code: 'DSC_REJ_EDIT_RHYTHM_LENGTH_MISMATCH',
  },
];

function metadataChecks(packet: DirectSpatialConditioningPacket): ValidationCheck[] {
  const checks: ValidationCheck[] = [];
  for (const field of packet.metadata.fields) {
    checks.push({
      check_id: `META_PRESENT_${field.field.toUpperCase()}`,
      stage: 'metadata',
      applies_to: `metadata.${field.field}`,
      description: `metadata.${field.field} must be present (${field.constraint}).`,
      predicate: `has(packet.metadata, "${field.field}")`,
      rejection_code: 'DSC_REJ_METADATA_FIELD_MISSING',
    });
    checks.push({
      check_id: `META_NONNULL_${field.field.toUpperCase()}`,
      stage: 'metadata',
      applies_to: `metadata.${field.field}`,
      description: `metadata.${field.field} must not be null.`,
      predicate: `packet.metadata.${field.field} !== null`,
      rejection_code: 'DSC_REJ_METADATA_FIELD_NULL',
    });
    checks.push({
      check_id: `META_TYPE_${field.field.toUpperCase()}`,
      stage: 'metadata',
      applies_to: `metadata.${field.field}`,
      description: `metadata.${field.field} must be of declared type ${field.type}.`,
      predicate: `type_of(packet.metadata.${field.field}) === "${field.type}"`,
      rejection_code: 'DSC_REJ_METADATA_FIELD_TYPE',
    });
  }

  checks.push(
    {
      check_id: 'META_VALUE_PACKET_VERSION',
      stage: 'metadata',
      applies_to: 'metadata.packet_version',
      description: 'metadata.packet_version must equal the specified packet version.',
      predicate: `packet.metadata.packet_version === "${packet.packet_structure.packet_version}"`,
      rejection_code: 'DSC_REJ_METADATA_PACKET_VERSION',
    },
    {
      check_id: 'META_VALUE_SPATIAL_FRAME',
      stage: 'metadata',
      applies_to: 'metadata.spatial_frame_ref',
      description: 'metadata.spatial_frame_ref must equal the locked spatial frame.',
      predicate: `packet.metadata.spatial_frame_ref === "${SPATIAL_FRAME.frame_id}"`,
      rejection_code: 'DSC_REJ_METADATA_SPATIAL_FRAME',
    },
    {
      check_id: 'META_VALUE_TIMEBASE',
      stage: 'metadata',
      applies_to: 'metadata.timebase',
      description: 'metadata.timebase must be milliseconds.',
      predicate: 'packet.metadata.timebase === "milliseconds"',
      rejection_code: 'DSC_REJ_METADATA_TIMEBASE',
    },
    {
      check_id: 'META_VALUE_CONTRACT_ID',
      stage: 'metadata',
      applies_to: 'metadata.contract_id',
      description: 'metadata.contract_id must reference the PHASE-031 conditioning contract.',
      predicate: 'packet.metadata.contract_id === "direct-spatial-conditioning-contract-v1"',
      rejection_code: 'DSC_REJ_METADATA_CONTRACT_ID',
    },
    {
      check_id: 'META_VALUE_CHANNEL_COUNT',
      stage: 'metadata',
      applies_to: 'metadata.channel_count',
      description: 'metadata.channel_count must equal the declared channel cardinality.',
      predicate: `packet.metadata.channel_count === ${packet.packet_structure.channel_cardinality}`,
      rejection_code: 'DSC_REJ_METADATA_CHANNEL_COUNT',
    }
  );

  return checks;
}

function channelPayloadValidations(
  packet: DirectSpatialConditioningPacket
): ChannelPayloadValidation[] {
  return packet.channel_payloads.map((payload) => {
    const upper = payload.channel_id.toUpperCase();
    const envelope_checks: ValidationCheck[] = [];

    for (const field of payload.envelope_fields) {
      envelope_checks.push({
        check_id: `ENV_PRESENT_${upper}_${field.field.toUpperCase()}`,
        stage: 'channel_payload',
        applies_to: `${payload.channel_id}.${field.field}`,
        description: `${payload.channel_id}.${field.field} must be present (${field.constraint}).`,
        predicate: `has(channel, "${field.field}")`,
        rejection_code: 'DSC_REJ_ENVELOPE_FIELD_MISSING',
      });
      envelope_checks.push({
        check_id: `ENV_NONNULL_${upper}_${field.field.toUpperCase()}`,
        stage: 'channel_payload',
        applies_to: `${payload.channel_id}.${field.field}`,
        description: `${payload.channel_id}.${field.field} must not be null.`,
        predicate: `channel.${field.field} !== null`,
        rejection_code: 'DSC_REJ_ENVELOPE_FIELD_NULL',
      });
    }

    envelope_checks.push(
      {
        check_id: `ENV_CHANNEL_ID_${upper}`,
        stage: 'channel_payload',
        applies_to: `${payload.channel_id}.channel_id`,
        description: `channel_id must equal ${payload.channel_id}.`,
        predicate: `channel.channel_id === "${payload.channel_id}"`,
        rejection_code: 'DSC_REJ_CHANNEL_ID_MISMATCH',
      },
      {
        check_id: `ENV_KNOWN_CHANNEL_${upper}`,
        stage: 'channel_payload',
        applies_to: `${payload.channel_id}.channel_id`,
        description: 'channel_id must be one of the six declared conditioning channels.',
        predicate: 'channel.channel_id in declared_channel_ids',
        rejection_code: 'DSC_REJ_CHANNEL_UNKNOWN',
      },
      {
        check_id: `ENV_FRAME_${upper}`,
        stage: 'channel_payload',
        applies_to: `${payload.channel_id}.spatial_frame_ref`,
        description: 'spatial_frame_ref must equal the locked spatial frame.',
        predicate: `channel.spatial_frame_ref === "${SPATIAL_FRAME.frame_id}"`,
        rejection_code: 'DSC_REJ_CHANNEL_FRAME_MISMATCH',
      },
      {
        check_id: `ENV_SOURCE_ID_${upper}`,
        stage: 'channel_payload',
        applies_to: `${payload.channel_id}.source_video_id`,
        description: 'source_video_id must be a non-empty string.',
        predicate:
          'typeof channel.source_video_id === "string" AND channel.source_video_id.length > 0',
        rejection_code: 'DSC_REJ_CHANNEL_SOURCE_ID_EMPTY',
      },
      {
        check_id: `ENV_TIMESTAMP_${upper}`,
        stage: 'channel_payload',
        applies_to: `${payload.channel_id}.timestamp_ms`,
        description: 'timestamp_ms must be a finite number greater than or equal to zero.',
        predicate: 'Number.isFinite(channel.timestamp_ms) AND channel.timestamp_ms >= 0',
        rejection_code: 'DSC_REJ_CHANNEL_TIMESTAMP_INVALID',
      },
      {
        check_id: `ENV_COMPONENTS_OBJECT_${upper}`,
        stage: 'channel_payload',
        applies_to: `${payload.channel_id}.components`,
        description: 'components must be a JSON object.',
        predicate:
          'typeof channel.components === "object" AND channel.components !== null AND !Array.isArray(channel.components)',
        rejection_code: 'DSC_REJ_COMPONENTS_NOT_OBJECT',
      }
    );

    const component_checks: ValidationCheck[] = [];
    for (const component of payload.component_fields) {
      const name = component.name.toUpperCase();
      component_checks.push({
        check_id: `COMP_PRESENT_${upper}_${name}`,
        stage: 'channel_payload',
        applies_to: `${payload.channel_id}.components.${component.name}`,
        description: `${component.name} must be present (${component.description}).`,
        predicate: `has(channel.components, "${component.name}")`,
        rejection_code: 'DSC_REJ_COMPONENT_MISSING',
      });
      component_checks.push({
        check_id: `COMP_NONNULL_${upper}_${name}`,
        stage: 'channel_payload',
        applies_to: `${payload.channel_id}.components.${component.name}`,
        description: `${component.name} must not be null.`,
        predicate: `channel.components.${component.name} !== null`,
        rejection_code: 'DSC_REJ_COMPONENT_NULL',
      });
      component_checks.push({
        check_id: `COMP_KIND_${upper}_${name}`,
        stage: 'channel_payload',
        applies_to: `${payload.channel_id}.components.${component.name}`,
        description: `${component.name} must satisfy value kind ${component.kind}.`,
        predicate: KIND_PREDICATES[component.kind].replace(
          /value/g,
          `channel.components.${component.name}`
        ),
        rejection_code: 'DSC_REJ_COMPONENT_TYPE',
      });
    }

    component_checks.push({
      check_id: `COMP_CLOSED_SET_${upper}`,
      stage: 'channel_payload',
      applies_to: `${payload.channel_id}.components`,
      description: 'components must not carry names outside the declared component set.',
      predicate: `keys(channel.components) subset_of [${payload.component_fields
        .map((c) => `"${c.name}"`)
        .join(', ')}]`,
      rejection_code: 'DSC_REJ_COMPONENT_UNKNOWN',
    });

    return {
      channel_id: payload.channel_id,
      payload_id: payload.payload_id,
      envelope_checks,
      component_checks,
      closed_component_set: true as const,
    };
  });
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/**
 * Build the design-only packet validation specification from the PHASE-032
 * packet design. Derives every check from the declared packet fields so the
 * validation surface cannot drift from the packet surface.
 */
export function buildDirectSpatialConditioningPacketValidation(projectRoot?: string): {
  validation: DirectSpatialConditioningPacketValidation;
} {
  const root = resolveProjectRoot(projectRoot);
  const packet = readJson<DirectSpatialConditioningPacket>(root, PACKET_PATH);
  if (
    packet.phase !== DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE ||
    packet.system_id !== DIRECT_SPATIAL_CONDITIONING_PACKET_SYSTEM_ID
  ) {
    throw new Error('PHASE-032 packet specification is missing or incompatible');
  }
  if (
    JSON.stringify(packet.packet_structure.channel_order) !==
    JSON.stringify(CONDITIONING_CHANNEL_IDS)
  ) {
    throw new Error('Packet channel order does not match foundation channels');
  }

  const validation: DirectSpatialConditioningPacketValidation = {
    validation_specification_id: 'direct-spatial-conditioning-packet-validation-v1',
    phase: DSC_PACKET_VALIDATION_PHASE,
    system_id: DSC_PACKET_VALIDATION_SYSTEM_ID,
    mode: 'design_only_validation',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_VALIDATION_V1',
    packet_ref: PACKET_PATH,
    packet_phase: DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE,
    packet_system_id: DIRECT_SPATIAL_CONDITIONING_PACKET_SYSTEM_ID,
    validation_procedure: {
      ordered_stages: ['structural', 'metadata', 'channel_payload', 'cross_channel'],
      evaluation: 'collect_all_rejections',
      accept_condition: 'zero rejection codes emitted across all stages',
      outcome_values: ['accepted', 'rejected'],
    },
    kind_predicates: KIND_PREDICATES,
    structural_checks: STRUCTURAL_CHECKS,
    metadata_checks: metadataChecks(packet),
    channel_payload_validations: channelPayloadValidations(packet),
    cross_channel_checks: CROSS_CHANNEL_CHECKS,
    rejection_codes: REJECTION_CODES,
    design_constraints: {
      validation_only: true,
      backend: 'none',
      gpu: false,
      inference: false,
      validates_packet_instances_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VALIDATION_PATH, validation);
  return { validation };
}
