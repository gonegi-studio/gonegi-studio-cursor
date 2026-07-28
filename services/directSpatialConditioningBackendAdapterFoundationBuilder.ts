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
import {
  DSC_RUNTIME_INTERFACE_PHASE,
  DSC_RUNTIME_INTERFACE_SYSTEM_ID,
  RUNTIME_INTERFACE_PATH,
  type DirectSpatialConditioningRuntimeInterface,
} from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-039: Direct Spatial Conditioning backend adapter foundation.
 *
 * DESIGN ONLY / ABSTRACTION ONLY / BACKEND AGNOSTIC. Defines the abstraction
 * layer that any future conditioning backend must satisfy in order to consume
 * the certified DSC validated output:
 *   - a backend interface (abstract methods a backend adapter must implement),
 *   - a packet adapter (backend-agnostic mapping from the PHASE-036 validated
 *     output surface to a neutral adapted conditioning input), and
 *   - a capability contract (declarations a backend must publish for the
 *     adapter to consider it compatible).
 *
 * Implements no backend, binds to no specific framework, performs no GPU or
 * inference work, materializes no tensors/frames, and modifies no dataset.
 * Every abstract method is declared, never implemented, in this phase.
 */

export const DSC_BACKEND_ADAPTER_FOUNDATION_PHASE = 'PHASE-DSC-039' as const;
export const DSC_BACKEND_ADAPTER_FOUNDATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_FOUNDATION_V1' as const;

export const BACKEND_ADAPTER_FOUNDATION_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const BACKEND_ADAPTER_FOUNDATION_PATH =
  `${BACKEND_ADAPTER_FOUNDATION_ROOT}/direct-spatial-conditioning-backend-adapter-foundation-v1.json` as const;

export type BackendInterfaceMethodId =
  | 'describe_capabilities'
  | 'check_compatibility'
  | 'bind_conditioning_input'
  | 'release_conditioning_binding';

export interface BackendInterfaceMethod {
  method_id: BackendInterfaceMethodId;
  signature: string;
  description: string;
  input_ref: string;
  output_ref: string;
  side_effects: 'none';
  abstract: true;
  implemented_in_this_phase: false;
  requires_specific_backend: false;
  requires_gpu: false;
  performs_inference: false;
}

export interface ChannelAdapterMapping {
  channel_id: ConditioningChannelId;
  source_channel_ref: ConditioningChannelId;
  adapted_channel_key: string;
  component_names: string[];
  value_space_ref: typeof SPATIAL_FRAME.frame_id;
  transform: 'identity_passthrough';
  lossless: true;
}

export interface PacketAdapter {
  adapter_id: 'dsc-packet-adapter-v1';
  description: string;
  input_surface_ref: 'dsc_runtime_validated_output_v1';
  input_artifact_kind: 'validated_conditioning_packet';
  runtime_interface_ref: string;
  output_shape: {
    shape_id: 'dsc_adapted_conditioning_input_v1';
    encoding: 'backend_agnostic_structured';
    spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
    required_sections: ['metadata', 'channels'];
    channel_order: ConditioningChannelId[];
  };
  channel_mappings: ChannelAdapterMapping[];
  passthrough_policy: 'structure_preserving_no_transform';
  accepts_outcome: 'accepted';
  rejects_outcome_handling: 'not_adapted_backend_receives_rejection_report';
  materializes_tensors: false;
  materializes_frames: false;
}

export interface CapabilityRequirement {
  capability_id: string;
  description: string;
  requirement: 'mandatory';
  declared_by_backend: true;
  evaluated_at: 'check_compatibility';
}

export interface CapabilityContract {
  contract_id: 'dsc-backend-capability-contract-v1';
  description: string;
  backend_agnostic: true;
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  required_channels: ConditioningChannelId[];
  required_sources: number;
  adapted_input_shape_ref: 'dsc_adapted_conditioning_input_v1';
  required_capabilities: CapabilityRequirement[];
  compatibility_rules: string[];
  guarantees: string[];
  forbidden: string[];
}

export interface DirectSpatialConditioningBackendAdapterFoundation {
  adapter_foundation_id: string;
  phase: typeof DSC_BACKEND_ADAPTER_FOUNDATION_PHASE;
  system_id: typeof DSC_BACKEND_ADAPTER_FOUNDATION_SYSTEM_ID;
  mode: 'design_only_abstraction';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_FOUNDATION_V1';
  runtime_interface_ref: string;
  runtime_interface_phase: typeof DSC_RUNTIME_INTERFACE_PHASE;
  runtime_interface_system_id: typeof DSC_RUNTIME_INTERFACE_SYSTEM_ID;
  runtime_package_ref: string;
  sources_supported: string[];
  backend_interface: {
    interface_id: 'dsc-backend-adapter-interface-v1';
    version: 'v1';
    transport: 'abstract_function_surface';
    consumes: 'validated_conditioning_packet';
    produces: 'conditioning_binding_handle';
    methods: BackendInterfaceMethod[];
  };
  packet_adapter: PacketAdapter;
  capability_contract: CapabilityContract;
  design_constraints: {
    abstraction_only: true;
    backend_agnostic: true;
    reuses_runtime_interface: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    materializes_tensors: false;
    materializes_frames: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const BACKEND_INTERFACE_METHODS: BackendInterfaceMethod[] = [
  {
    method_id: 'describe_capabilities',
    signature: 'describe_capabilities() -> backend_capability_descriptor',
    description:
      'Backend publishes the capability descriptor it satisfies against the DSC capability contract. Declared abstractly; no backend implements it in this phase.',
    input_ref: 'none',
    output_ref: 'backend_capability_descriptor',
    side_effects: 'none',
    abstract: true,
    implemented_in_this_phase: false,
    requires_specific_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
  {
    method_id: 'check_compatibility',
    signature:
      'check_compatibility(backend_capability_descriptor, dsc_adapted_conditioning_input_v1) -> compatibility_report',
    description:
      'Evaluate a backend capability descriptor against the adapted conditioning input using the capability contract compatibility rules. Pure comparison, no backend invocation.',
    input_ref: 'backend_capability_descriptor + dsc_adapted_conditioning_input_v1',
    output_ref: 'compatibility_report',
    side_effects: 'none',
    abstract: true,
    implemented_in_this_phase: false,
    requires_specific_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
  {
    method_id: 'bind_conditioning_input',
    signature:
      'bind_conditioning_input(dsc_adapted_conditioning_input_v1) -> conditioning_binding_handle',
    description:
      'Backend receives the structure-preserving adapted conditioning input and returns an opaque binding handle. Abstract only; this phase materializes nothing.',
    input_ref: 'dsc_adapted_conditioning_input_v1',
    output_ref: 'conditioning_binding_handle',
    side_effects: 'none',
    abstract: true,
    implemented_in_this_phase: false,
    requires_specific_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
  {
    method_id: 'release_conditioning_binding',
    signature: 'release_conditioning_binding(conditioning_binding_handle) -> void',
    description:
      'Backend releases a previously issued binding handle. Abstract lifecycle method; not implemented in this phase.',
    input_ref: 'conditioning_binding_handle',
    output_ref: 'void',
    side_effects: 'none',
    abstract: true,
    implemented_in_this_phase: false,
    requires_specific_backend: false,
    requires_gpu: false,
    performs_inference: false,
  },
];

const CAPABILITY_REQUIREMENTS: CapabilityRequirement[] = [
  {
    capability_id: 'accepts_validated_conditioning_packet',
    description:
      'Backend consumes the PHASE-036 validated conditioning packet via the adapted input; it never reads datasets directly.',
    requirement: 'mandatory',
    declared_by_backend: true,
    evaluated_at: 'check_compatibility',
  },
  {
    capability_id: 'supports_spatial_frame_normalized_image_plane_v1',
    description:
      'Backend operates in the locked normalized_image_plane_v1 spatial frame without reprojection.',
    requirement: 'mandatory',
    declared_by_backend: true,
    evaluated_at: 'check_compatibility',
  },
  {
    capability_id: 'supports_all_six_conditioning_channels',
    description:
      'Backend accepts all six conditioning channels in the fixed channel order defined by the foundation.',
    requirement: 'mandatory',
    declared_by_backend: true,
    evaluated_at: 'check_compatibility',
  },
  {
    capability_id: 'structure_preserving_ingestion',
    description:
      'Backend ingests the adapted input losslessly; the adapter applies only identity passthrough and performs no transform.',
    requirement: 'mandatory',
    declared_by_backend: true,
    evaluated_at: 'check_compatibility',
  },
  {
    capability_id: 'side_effect_free_ingestion',
    description:
      'Ingestion mutates no certified artifact or dataset and produces only an opaque binding handle.',
    requirement: 'mandatory',
    declared_by_backend: true,
    evaluated_at: 'check_compatibility',
  },
  {
    capability_id: 'source_corpus_agnostic',
    description:
      'Backend works uniformly across the certified 15-source corpus without per-source specialization.',
    requirement: 'mandatory',
    declared_by_backend: true,
    evaluated_at: 'check_compatibility',
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
 * Build the design-only, backend-agnostic DSC backend adapter foundation.
 * Reuses the PHASE-036 runtime interface (validated output surface) and the
 * PHASE-032 packet component definitions by reference. Writes only the adapter
 * foundation artifact; no upstream artifact or dataset is modified.
 */
export function buildDirectSpatialConditioningBackendAdapterFoundation(
  projectRoot?: string
): { adapterFoundation: DirectSpatialConditioningBackendAdapterFoundation } {
  const root = resolveProjectRoot(projectRoot);

  const runtimeInterface = readJson<DirectSpatialConditioningRuntimeInterface>(
    root,
    RUNTIME_INTERFACE_PATH
  );
  if (
    runtimeInterface.phase !== DSC_RUNTIME_INTERFACE_PHASE ||
    runtimeInterface.system_id !== DSC_RUNTIME_INTERFACE_SYSTEM_ID
  ) {
    throw new Error('PHASE-036 runtime interface is missing or incompatible');
  }
  if (runtimeInterface.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
    throw new Error('Runtime interface must reuse the certified runtime package');
  }
  if (runtimeInterface.validated_output.artifact_kind !== 'validated_conditioning_packet') {
    throw new Error('Runtime interface validated output artifact kind drifted');
  }
  if (
    JSON.stringify(runtimeInterface.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Runtime interface sources_supported must cover the certified corpus');
  }

  const packet = readJson<DirectSpatialConditioningPacket>(root, PACKET_PATH);
  if (
    JSON.stringify(packet.packet_structure.channel_order) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Packet channel order does not match foundation channels');
  }

  // Backend-agnostic per-channel mapping. Component names are reused verbatim
  // from the frozen packet specification so the adapter introduces no drift.
  const channel_mappings: ChannelAdapterMapping[] = CONDITIONING_CHANNEL_IDS.map(
    (channelId) => {
      const payload = packet.channel_payloads.find((p) => p.channel_id === channelId);
      if (!payload) {
        throw new Error(`Packet missing channel ${channelId}`);
      }
      return {
        channel_id: channelId,
        source_channel_ref: channelId,
        adapted_channel_key: `adapted_${channelId}`,
        component_names: payload.component_fields.map((component) => component.name),
        value_space_ref: SPATIAL_FRAME.frame_id,
        transform: 'identity_passthrough',
        lossless: true,
      };
    }
  );

  const packet_adapter: PacketAdapter = {
    adapter_id: 'dsc-packet-adapter-v1',
    description:
      'Backend-agnostic mapping from the PHASE-036 validated output surface to a neutral adapted conditioning input. Identity passthrough only; no transform, tensor, or frame materialization.',
    input_surface_ref: 'dsc_runtime_validated_output_v1',
    input_artifact_kind: 'validated_conditioning_packet',
    runtime_interface_ref: RUNTIME_INTERFACE_PATH,
    output_shape: {
      shape_id: 'dsc_adapted_conditioning_input_v1',
      encoding: 'backend_agnostic_structured',
      spatial_frame_ref: SPATIAL_FRAME.frame_id,
      required_sections: ['metadata', 'channels'],
      channel_order: [...CONDITIONING_CHANNEL_IDS],
    },
    channel_mappings,
    passthrough_policy: 'structure_preserving_no_transform',
    accepts_outcome: 'accepted',
    rejects_outcome_handling: 'not_adapted_backend_receives_rejection_report',
    materializes_tensors: false,
    materializes_frames: false,
  };

  const capability_contract: CapabilityContract = {
    contract_id: 'dsc-backend-capability-contract-v1',
    description:
      'Backend-agnostic capabilities a conditioning backend must declare and satisfy to be considered compatible with the DSC adapted conditioning input.',
    backend_agnostic: true,
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    required_sources: SOURCE_IDS.length,
    adapted_input_shape_ref: 'dsc_adapted_conditioning_input_v1',
    required_capabilities: CAPABILITY_REQUIREMENTS,
    compatibility_rules: [
      'backend must declare every mandatory capability in required_capabilities',
      'backend declared spatial frame must equal normalized_image_plane_v1',
      'backend declared channels must cover all six required_channels in fixed order',
      'backend must accept the adapted input losslessly under identity passthrough',
      'backend must be source-agnostic across the certified 15-source corpus',
      'a missing or unequal declaration yields an incompatible compatibility_report',
    ],
    guarantees: [
      'the abstraction binds to no specific backend, framework, or device',
      'the packet adapter preserves packet structure with identity passthrough only',
      'only accepted validated packets are adapted; rejected outcomes are passed through as rejection reports',
      'compatibility is decided purely by declaration comparison with no backend invocation',
      'no capability requires GPU, inference, tensor, or frame materialization',
    ],
    forbidden: [
      'concrete backend implementation',
      'framework or device binding',
      'gpu execution',
      'model inference',
      'tensor materialization',
      'frame materialization',
      'dataset modification',
      'placeholder capability declarations',
    ],
  };

  const adapterFoundation: DirectSpatialConditioningBackendAdapterFoundation = {
    adapter_foundation_id: 'direct-spatial-conditioning-backend-adapter-foundation-v1',
    phase: DSC_BACKEND_ADAPTER_FOUNDATION_PHASE,
    system_id: DSC_BACKEND_ADAPTER_FOUNDATION_SYSTEM_ID,
    mode: 'design_only_abstraction',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_FOUNDATION_V1',
    runtime_interface_ref: RUNTIME_INTERFACE_PATH,
    runtime_interface_phase: DSC_RUNTIME_INTERFACE_PHASE,
    runtime_interface_system_id: DSC_RUNTIME_INTERFACE_SYSTEM_ID,
    runtime_package_ref: RUNTIME_PACKAGE_PATH,
    sources_supported: [...SOURCE_IDS],
    backend_interface: {
      interface_id: 'dsc-backend-adapter-interface-v1',
      version: 'v1',
      transport: 'abstract_function_surface',
      consumes: 'validated_conditioning_packet',
      produces: 'conditioning_binding_handle',
      methods: BACKEND_INTERFACE_METHODS,
    },
    packet_adapter,
    capability_contract,
    design_constraints: {
      abstraction_only: true,
      backend_agnostic: true,
      reuses_runtime_interface: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      materializes_tensors: false,
      materializes_frames: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, BACKEND_ADAPTER_FOUNDATION_PATH, adapterFoundation);
  return { adapterFoundation };
}
