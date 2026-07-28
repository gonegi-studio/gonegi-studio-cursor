import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';
import {
  ASSEMBLY_PATH,
  DSC_PACKET_ASSEMBLY_PHASE,
  DSC_PACKET_ASSEMBLY_SYSTEM_ID,
  RUNTIME_CONSUMPTION_LAYER,
  type DirectSpatialConditioningPacketAssembly,
} from './directSpatialConditioningPacketAssemblyBuilder.js';
import {
  DSC_PACKET_VALIDATION_PHASE,
  DSC_PACKET_VALIDATION_SYSTEM_ID,
  VALIDATION_PATH,
  type DirectSpatialConditioningPacketValidation,
} from './directSpatialConditioningPacketValidationBuilder.js';
import {
  NUMERICAL_RECONSTRUCTION_EXPORT_PHASE,
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from './numericalReconstructionExportBuilder.js';
import { PACKET_PATH } from './directSpatialConditioningPacketBuilder.js';

/**
 * PHASE-DSC-035: Direct Spatial Conditioning packet generation design.
 *
 * DESIGN ONLY / GENERATION ONLY. Specifies how a runtime generates a packet
 * instance from the PHASE-034 assembly specification, applies the PHASE-033
 * validation specification, and produces a validated packet outcome. Reuses
 * the certified Movie Reconstruction runtime package and the packet assembly
 * design by reference. Generates no live packet instances in this phase;
 * performs no backend, GPU, or inference work; modifies no dataset.
 */

export const DSC_PACKET_GENERATION_PHASE = 'PHASE-DSC-035' as const;
export const DSC_PACKET_GENERATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_PACKET_GENERATION_V1' as const;

export const GENERATION_ROOT = 'exports/direct_spatial_conditioning/v1' as const;
export const GENERATION_PATH =
  `${GENERATION_ROOT}/direct-spatial-conditioning-packet-generation-v1.json` as const;

export interface GenerationStep {
  step_index: number;
  step_id: string;
  description: string;
  reads: string[];
  produces: string;
  reuses: string | null;
}

export interface GeneratedPacketInstanceShape {
  packet_type: 'direct_spatial_conditioning_packet';
  packet_version: 'v1';
  encoding: 'application/json';
  required_sections: ['metadata', 'channels'];
  metadata_fields: string[];
  channel_order: ConditioningChannelId[];
  channel_envelope_fields: string[];
  component_fields_by_channel: Record<ConditioningChannelId, string[]>;
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
}

export interface ValidatedPacketOutputShape {
  artifact_kind: 'validated_conditioning_packet';
  required_fields: string[];
  outcome_values: ['accepted', 'rejected'];
  accepted_requires: string[];
  rejected_requires: string[];
  embeds_generated_packet_on_accept: true;
  embeds_rejection_codes_on_reject: true;
  materializes_tensors: false;
  materializes_frames: false;
}

export interface ChannelGenerationBinding {
  channel_id: ConditioningChannelId;
  order_index: number;
  assembly_channel_ref: ConditioningChannelId;
  foundation_consumption_slot: string;
  component_count: number;
  component_names: string[];
}

export interface DirectSpatialConditioningPacketGeneration {
  generation_specification_id: string;
  phase: typeof DSC_PACKET_GENERATION_PHASE;
  system_id: typeof DSC_PACKET_GENERATION_SYSTEM_ID;
  mode: 'design_only_generation';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_GENERATION_V1';
  assembly_ref: string;
  assembly_phase: typeof DSC_PACKET_ASSEMBLY_PHASE;
  assembly_system_id: typeof DSC_PACKET_ASSEMBLY_SYSTEM_ID;
  validation_ref: string;
  validation_phase: typeof DSC_PACKET_VALIDATION_PHASE;
  validation_system_id: typeof DSC_PACKET_VALIDATION_SYSTEM_ID;
  packet_ref: string;
  runtime_package_ref: string;
  runtime_package_phase: typeof NUMERICAL_RECONSTRUCTION_EXPORT_PHASE;
  runtime_consumption_layer: typeof RUNTIME_CONSUMPTION_LAYER;
  sources_supported: string[];
  generation_procedure: {
    ordered_stages: GenerationStep[];
    reuse_policy: {
      assembly: 'mandatory_exact_reuse';
      validation: 'mandatory_exact_reuse';
      runtime_package: 'mandatory_certified_read_only';
    };
    generation_policy: 'assemble_then_validate';
    instance_materialization_in_this_phase: false;
  };
  generated_packet_instance: GeneratedPacketInstanceShape;
  validated_packet_output: ValidatedPacketOutputShape;
  channel_generation_bindings: ChannelGenerationBinding[];
  design_constraints: {
    generation_only: true;
    reuses_packet_assembly: true;
    reuses_certified_runtime_package: true;
    backend: 'none';
    gpu: false;
    inference: false;
    generates_packet_instances_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const GENERATION_STEPS: GenerationStep[] = [
  {
    step_index: 0,
    step_id: 'bind_generation_inputs',
    description:
      'Bind the certified runtime package, selected source_video_id, caller packet_id, and the frozen assembly/validation/packet specifications.',
    reads: [
      'certified_runtime_package',
      'source_video_id',
      'packet_id',
      'packet_assembly_specification',
      'packet_validation_specification',
      'packet_specification',
    ],
    produces: 'generation_context',
    reuses: 'PHASE-DSC-034 required_inputs',
  },
  {
    step_index: 1,
    step_id: 'execute_assembly_order',
    description:
      'Run the PHASE-034 assembly_order steps exactly (resolve_source through finalize_packet) to produce an assembled packet candidate.',
    reads: ['generation_context', 'packet_assembly_specification'],
    produces: 'assembled_packet_candidate',
    reuses: 'PHASE-DSC-034 assembly_order',
  },
  {
    step_index: 2,
    step_id: 'apply_packet_validation',
    description:
      'Apply the PHASE-033 ordered validation stages (structural, metadata, channel_payload, cross_channel) and collect all rejection codes.',
    reads: ['assembled_packet_candidate', 'packet_validation_specification'],
    produces: 'validation_result',
    reuses: 'PHASE-DSC-033 validation_procedure',
  },
  {
    step_index: 3,
    step_id: 'produce_validated_packet',
    description:
      'If zero rejection codes were emitted, emit an accepted validated packet embedding the generated instance; otherwise emit a rejected outcome with rejection codes.',
    reads: ['assembled_packet_candidate', 'validation_result'],
    produces: 'validated_packet',
    reuses: null,
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
 * Build the design-only packet generation specification.
 * Reuses the frozen assembly and validation artifacts by reference and locks
 * the generated/validated packet shapes to those designs. Does not generate
 * live packet instances.
 */
export function buildDirectSpatialConditioningPacketGeneration(projectRoot?: string): {
  generation: DirectSpatialConditioningPacketGeneration;
} {
  const root = resolveProjectRoot(projectRoot);

  const assembly = readJson<DirectSpatialConditioningPacketAssembly>(root, ASSEMBLY_PATH);
  if (
    assembly.phase !== DSC_PACKET_ASSEMBLY_PHASE ||
    assembly.system_id !== DSC_PACKET_ASSEMBLY_SYSTEM_ID
  ) {
    throw new Error('PHASE-034 packet assembly specification is missing or incompatible');
  }
  if (assembly.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
    throw new Error('Assembly must reuse the certified PHASE-027 runtime package');
  }

  const validation = readJson<DirectSpatialConditioningPacketValidation>(
    root,
    VALIDATION_PATH
  );
  if (
    validation.phase !== DSC_PACKET_VALIDATION_PHASE ||
    validation.system_id !== DSC_PACKET_VALIDATION_SYSTEM_ID
  ) {
    throw new Error('PHASE-033 packet validation specification is missing or incompatible');
  }

  if (
    JSON.stringify(assembly.sources_supported) !== JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Assembly sources_supported must cover the certified 15-source corpus');
  }

  const channel_generation_bindings: ChannelGenerationBinding[] =
    assembly.channel_assemblies.map((channel) => ({
      channel_id: channel.channel_id,
      order_index: channel.order_index,
      assembly_channel_ref: channel.channel_id,
      foundation_consumption_slot: channel.foundation_consumption_slot,
      component_count: channel.component_source_mappings.length,
      component_names: channel.component_source_mappings.map((m) => m.packet_component),
    }));

  if (
    JSON.stringify(channel_generation_bindings.map((c) => c.channel_id)) !==
    JSON.stringify(CONDITIONING_CHANNEL_IDS)
  ) {
    throw new Error('Generation channel bindings drifted from foundation channel order');
  }

  const component_fields_by_channel = {} as Record<ConditioningChannelId, string[]>;
  for (const binding of channel_generation_bindings) {
    component_fields_by_channel[binding.channel_id] = binding.component_names;
  }

  const generation: DirectSpatialConditioningPacketGeneration = {
    generation_specification_id: 'direct-spatial-conditioning-packet-generation-v1',
    phase: DSC_PACKET_GENERATION_PHASE,
    system_id: DSC_PACKET_GENERATION_SYSTEM_ID,
    mode: 'design_only_generation',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_GENERATION_V1',
    assembly_ref: ASSEMBLY_PATH,
    assembly_phase: DSC_PACKET_ASSEMBLY_PHASE,
    assembly_system_id: DSC_PACKET_ASSEMBLY_SYSTEM_ID,
    validation_ref: VALIDATION_PATH,
    validation_phase: DSC_PACKET_VALIDATION_PHASE,
    validation_system_id: DSC_PACKET_VALIDATION_SYSTEM_ID,
    packet_ref: PACKET_PATH,
    runtime_package_ref: RUNTIME_PACKAGE_PATH,
    runtime_package_phase: NUMERICAL_RECONSTRUCTION_EXPORT_PHASE,
    runtime_consumption_layer: RUNTIME_CONSUMPTION_LAYER,
    sources_supported: [...SOURCE_IDS],
    generation_procedure: {
      ordered_stages: GENERATION_STEPS,
      reuse_policy: {
        assembly: 'mandatory_exact_reuse',
        validation: 'mandatory_exact_reuse',
        runtime_package: 'mandatory_certified_read_only',
      },
      generation_policy: 'assemble_then_validate',
      instance_materialization_in_this_phase: false,
    },
    generated_packet_instance: {
      packet_type: 'direct_spatial_conditioning_packet',
      packet_version: 'v1',
      encoding: 'application/json',
      required_sections: ['metadata', 'channels'],
      metadata_fields: assembly.metadata_assembly.map((entry) => entry.field),
      channel_order: [...CONDITIONING_CHANNEL_IDS],
      channel_envelope_fields: [
        'channel_id',
        'source_video_id',
        'spatial_frame_ref',
        'timestamp_ms',
        'components',
      ],
      component_fields_by_channel,
      spatial_frame_ref: SPATIAL_FRAME.frame_id,
    },
    validated_packet_output: {
      artifact_kind: 'validated_conditioning_packet',
      required_fields: [
        'packet_id',
        'source_video_id',
        'spatial_frame_ref',
        'outcome',
        'rejection_codes',
        'generated_packet',
        'assembly_ref',
        'validation_ref',
        'runtime_package_ref',
      ],
      outcome_values: ['accepted', 'rejected'],
      accepted_requires: [
        'outcome === "accepted"',
        'rejection_codes.length === 0',
        'generated_packet !== null',
      ],
      rejected_requires: [
        'outcome === "rejected"',
        'rejection_codes.length > 0',
        'generated_packet === null OR generated_packet retained_for_diagnostics_only',
      ],
      embeds_generated_packet_on_accept: true,
      embeds_rejection_codes_on_reject: true,
      materializes_tensors: false,
      materializes_frames: false,
    },
    channel_generation_bindings,
    design_constraints: {
      generation_only: true,
      reuses_packet_assembly: true,
      reuses_certified_runtime_package: true,
      backend: 'none',
      gpu: false,
      inference: false,
      generates_packet_instances_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, GENERATION_PATH, generation);
  return { generation };
}
