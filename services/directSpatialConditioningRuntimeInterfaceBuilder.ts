import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';
import {
  DSC_PACKET_GENERATION_PHASE,
  DSC_PACKET_GENERATION_SYSTEM_ID,
  GENERATION_PATH,
  type DirectSpatialConditioningPacketGeneration,
} from './directSpatialConditioningPacketGenerationBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-036: Direct Spatial Conditioning runtime interface design.
 *
 * DESIGN ONLY / INTERFACE ONLY. Defines the runtime API, packet input surface,
 * validated output surface, and interface contract that a future DSC runtime
 * MUST expose. Reuses the PHASE-035 packet generation specification by
 * reference. Implements no runtime, performs no backend/GPU/inference work,
 * and modifies no dataset.
 */

export const DSC_RUNTIME_INTERFACE_PHASE = 'PHASE-DSC-036' as const;
export const DSC_RUNTIME_INTERFACE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_RUNTIME_INTERFACE_V1' as const;

export const RUNTIME_INTERFACE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const RUNTIME_INTERFACE_PATH =
  `${RUNTIME_INTERFACE_ROOT}/direct-spatial-conditioning-runtime-interface-v1.json` as const;

export type RuntimeApiMethodId =
  | 'list_sources'
  | 'generate_packet'
  | 'validate_packet'
  | 'produce_validated_packet';

export interface RuntimeApiMethod {
  method_id: RuntimeApiMethodId;
  signature: string;
  description: string;
  input_ref: string;
  output_ref: string;
  generation_step_ref: string | null;
  side_effects: 'none';
  requires_backend: false;
  requires_gpu: false;
  performs_inference: false;
}

export interface PacketInputSurface {
  surface_id: 'dsc_runtime_packet_input_v1';
  description: string;
  required_fields: Array<{
    field: string;
    type: string;
    required: true;
    nullable: false;
    constraint: string;
  }>;
  optional_fields: [];
  accepted_packet_shape: {
    packet_type: 'direct_spatial_conditioning_packet';
    packet_version: 'v1';
    required_sections: ['metadata', 'channels'];
    channel_order: ConditioningChannelId[];
    spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  };
  generation_input_alignment: {
    generation_ref: string;
    maps_to_generation_step: 'bind_generation_inputs';
  };
}

export interface ValidatedOutputSurface {
  surface_id: 'dsc_runtime_validated_output_v1';
  description: string;
  artifact_kind: 'validated_conditioning_packet';
  required_fields: string[];
  outcome_values: ['accepted', 'rejected'];
  accepted_packet_embedded: true;
  rejection_codes_embedded: true;
  generation_output_alignment: {
    generation_ref: string;
    maps_to_generation_step: 'produce_validated_packet';
    validated_packet_output_ref: string;
  };
  materializes_tensors: false;
  materializes_frames: false;
}

export interface InterfaceContract {
  contract_id: 'dsc-runtime-interface-contract-v1';
  description: string;
  mandatory_methods: RuntimeApiMethodId[];
  packet_input_surface_ref: string;
  validated_output_surface_ref: string;
  generation_ref: string;
  runtime_package_ref: string;
  guarantees: string[];
  forbidden: string[];
}

export interface DirectSpatialConditioningRuntimeInterface {
  runtime_interface_id: string;
  phase: typeof DSC_RUNTIME_INTERFACE_PHASE;
  system_id: typeof DSC_RUNTIME_INTERFACE_SYSTEM_ID;
  mode: 'design_only_interface';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_RUNTIME_INTERFACE_V1';
  generation_ref: string;
  generation_phase: typeof DSC_PACKET_GENERATION_PHASE;
  generation_system_id: typeof DSC_PACKET_GENERATION_SYSTEM_ID;
  runtime_package_ref: string;
  sources_supported: string[];
  runtime_api: {
    api_id: 'dsc-runtime-api-v1';
    version: 'v1';
    transport: 'in_process_function_surface';
    methods: RuntimeApiMethod[];
  };
  packet_input: PacketInputSurface;
  validated_output: ValidatedOutputSurface;
  interface_contract: InterfaceContract;
  design_constraints: {
    interface_only: true;
    reuses_packet_generation: true;
    backend: 'none';
    gpu: false;
    inference: false;
    implements_runtime_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const RUNTIME_API_METHODS: RuntimeApiMethod[] = [
  {
    method_id: 'list_sources',
    signature: 'list_sources() -> source_video_id[]',
    description:
      'Return the certified 15-source corpus identifiers available through the reused Movie Reconstruction runtime package.',
    input_ref: 'none',
    output_ref: 'source_video_id[]',
    generation_step_ref: null,
    side_effects: 'none',
    requires_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
  {
    method_id: 'generate_packet',
    signature:
      'generate_packet(source_video_id, packet_id) -> assembled_packet_candidate',
    description:
      'Execute PHASE-035 generation steps bind_generation_inputs and execute_assembly_order to produce an assembled packet candidate from the certified runtime package.',
    input_ref: 'dsc_runtime_packet_input_v1',
    output_ref: 'assembled_packet_candidate',
    generation_step_ref: 'execute_assembly_order',
    side_effects: 'none',
    requires_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
  {
    method_id: 'validate_packet',
    signature: 'validate_packet(assembled_packet_candidate) -> validation_result',
    description:
      'Execute PHASE-035 generation step apply_packet_validation against the PHASE-033 validation specification.',
    input_ref: 'assembled_packet_candidate',
    output_ref: 'validation_result',
    generation_step_ref: 'apply_packet_validation',
    side_effects: 'none',
    requires_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
  {
    method_id: 'produce_validated_packet',
    signature:
      'produce_validated_packet(source_video_id, packet_id) -> validated_conditioning_packet',
    description:
      'Run the full PHASE-035 assemble-then-validate generation procedure and return the validated packet outcome.',
    input_ref: 'dsc_runtime_packet_input_v1',
    output_ref: 'dsc_runtime_validated_output_v1',
    generation_step_ref: 'produce_validated_packet',
    side_effects: 'none',
    requires_backend: false,
    requires_gpu: false,
    performs_inference: false,
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
 * Build the design-only DSC runtime interface specification.
 * Reuses PHASE-035 generation for packet input/validated output alignment.
 */
export function buildDirectSpatialConditioningRuntimeInterface(projectRoot?: string): {
  runtimeInterface: DirectSpatialConditioningRuntimeInterface;
} {
  const root = resolveProjectRoot(projectRoot);
  const generation = readJson<DirectSpatialConditioningPacketGeneration>(
    root,
    GENERATION_PATH
  );

  if (
    generation.phase !== DSC_PACKET_GENERATION_PHASE ||
    generation.system_id !== DSC_PACKET_GENERATION_SYSTEM_ID
  ) {
    throw new Error('PHASE-035 packet generation specification is missing or incompatible');
  }
  if (generation.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
    throw new Error('Generation must reuse the certified PHASE-027 runtime package');
  }
  if (
    JSON.stringify(generation.sources_supported) !== JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Generation sources_supported must cover the certified corpus');
  }

  const packet_input: PacketInputSurface = {
    surface_id: 'dsc_runtime_packet_input_v1',
    description:
      'Caller inputs required to generate a packet through the PHASE-035 generation procedure.',
    required_fields: [
      {
        field: 'source_video_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must be one of the certified 15-source corpus identifiers',
      },
      {
        field: 'packet_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'non-empty caller-assigned opaque packet identity',
      },
    ],
    optional_fields: [],
    accepted_packet_shape: {
      packet_type: generation.generated_packet_instance.packet_type,
      packet_version: generation.generated_packet_instance.packet_version,
      required_sections: generation.generated_packet_instance.required_sections,
      channel_order: [...CONDITIONING_CHANNEL_IDS],
      spatial_frame_ref: SPATIAL_FRAME.frame_id,
    },
    generation_input_alignment: {
      generation_ref: GENERATION_PATH,
      maps_to_generation_step: 'bind_generation_inputs',
    },
  };

  const validated_output: ValidatedOutputSurface = {
    surface_id: 'dsc_runtime_validated_output_v1',
    description:
      'Validated packet outcome produced by the PHASE-035 produce_validated_packet generation step.',
    artifact_kind: generation.validated_packet_output.artifact_kind,
    required_fields: [...generation.validated_packet_output.required_fields],
    outcome_values: ['accepted', 'rejected'],
    accepted_packet_embedded: true,
    rejection_codes_embedded: true,
    generation_output_alignment: {
      generation_ref: GENERATION_PATH,
      maps_to_generation_step: 'produce_validated_packet',
      validated_packet_output_ref: 'generation.validated_packet_output',
    },
    materializes_tensors: false,
    materializes_frames: false,
  };

  const interface_contract: InterfaceContract = {
    contract_id: 'dsc-runtime-interface-contract-v1',
    description:
      'Interface contract locking the DSC runtime API methods, packet input, and validated output to the PHASE-035 generation design.',
    mandatory_methods: RUNTIME_API_METHODS.map((method) => method.method_id),
    packet_input_surface_ref: packet_input.surface_id,
    validated_output_surface_ref: validated_output.surface_id,
    generation_ref: GENERATION_PATH,
    runtime_package_ref: RUNTIME_PACKAGE_PATH,
    guarantees: [
      'list_sources returns exactly the certified 15-source corpus',
      'generate_packet follows PHASE-035 assemble-then-validate generation policy',
      'validate_packet applies PHASE-033 rejection codes without mutation',
      'produce_validated_packet returns validated_conditioning_packet with accepted or rejected outcome',
      'all methods are side-effect free with respect to datasets and certified artifacts',
    ],
    forbidden: [
      'backend invocation',
      'gpu execution',
      'model inference',
      'tensor materialization',
      'frame materialization',
      'dataset modification',
      'placeholder packet fields',
    ],
  };

  const runtimeInterface: DirectSpatialConditioningRuntimeInterface = {
    runtime_interface_id: 'direct-spatial-conditioning-runtime-interface-v1',
    phase: DSC_RUNTIME_INTERFACE_PHASE,
    system_id: DSC_RUNTIME_INTERFACE_SYSTEM_ID,
    mode: 'design_only_interface',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_RUNTIME_INTERFACE_V1',
    generation_ref: GENERATION_PATH,
    generation_phase: DSC_PACKET_GENERATION_PHASE,
    generation_system_id: DSC_PACKET_GENERATION_SYSTEM_ID,
    runtime_package_ref: RUNTIME_PACKAGE_PATH,
    sources_supported: [...SOURCE_IDS],
    runtime_api: {
      api_id: 'dsc-runtime-api-v1',
      version: 'v1',
      transport: 'in_process_function_surface',
      methods: RUNTIME_API_METHODS,
    },
    packet_input,
    validated_output,
    interface_contract,
    design_constraints: {
      interface_only: true,
      reuses_packet_generation: true,
      backend: 'none',
      gpu: false,
      inference: false,
      implements_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, RUNTIME_INTERFACE_PATH, runtimeInterface);
  return { runtimeInterface };
}
