import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';
import {
  BACKEND_ADAPTER_FOUNDATION_PATH,
  type DirectSpatialConditioningBackendAdapterFoundation,
} from './directSpatialConditioningBackendAdapterFoundationBuilder.js';
import {
  BACKEND_CAPABILITY_REGISTRY_PATH,
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
  type DirectSpatialConditioningBackendCapabilityRegistry,
} from './directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import {
  BACKEND_COMPATIBILITY_ENGINE_PATH,
} from './directSpatialConditioningBackendCompatibilityEngineBuilder.js';
import {
  BACKEND_ADAPTER_REGISTRATION_PATH,
} from './directSpatialConditioningBackendAdapterRegistrationBuilder.js';
import {
  BACKEND_RUNTIME_ROUTER_PATH,
} from './directSpatialConditioningBackendRuntimeRouterBuilder.js';
import {
  BACKEND_EXECUTION_CONTRACT_PATH,
} from './directSpatialConditioningBackendExecutionContractBuilder.js';
import {
  BACKEND_IMPLEMENTATION_SPEC_PATH,
  DSC_BACKEND_IMPLEMENTATION_SPEC_PHASE,
  DSC_BACKEND_IMPLEMENTATION_SPEC_SYSTEM_ID,
  type DirectSpatialConditioningBackendImplementationSpec,
} from './directSpatialConditioningBackendImplementationSpecBuilder.js';
import {
  BACKEND_DESIGN_CERTIFICATION_PATH,
} from './directSpatialConditioningBackendDesignCertificationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-047: Direct Spatial Conditioning backend profile.
 *
 * DESIGN ONLY / READ-ONLY / BACKEND PROFILE ONLY. Defines the first backend
 * profile over the frozen PHASE-045 implementation specification and the
 * certified PHASE-046 backend design stack:
 *   - backend profile schema,
 *   - deterministic capability mapping,
 *   - adapter configuration, and
 *   - profile validation.
 *
 * Declares a reference profile only. Implements no backend, binds no vendor or
 * device, performs no GPU or inference work, and modifies no dataset. The
 * PHASE-045 implementation specification and PHASE-040 capability registry are
 * reused by exact reference.
 */

export const DSC_BACKEND_PROFILE_PHASE = 'PHASE-DSC-047' as const;
export const DSC_BACKEND_PROFILE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_V1' as const;

export const BACKEND_PROFILE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const BACKEND_PROFILE_PATH =
  `${BACKEND_PROFILE_ROOT}/direct-spatial-conditioning-backend-profile-v1.json` as const;

export const BACKEND_PROFILE_ID = 'dsc-backend-profile-reference-v1' as const;
export const BACKEND_PROFILE_VERSION = '1.0' as const;

export type CapabilityDeclarationState = 'supported' | 'unsupported';

export interface ProfileSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface BackendProfileSchema {
  schema_id: 'dsc-backend-profile-schema-v1';
  description: string;
  encoding: 'application/json';
  profile_id_policy: 'opaque_profile_id_no_vendor_binding';
  required_fields: ProfileSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface CapabilityMappingEntry {
  capability_id: string;
  declared_state: CapabilityDeclarationState;
  mapping_rule: 'mandatory_capability_maps_to_supported';
  capability_version: typeof CAPABILITY_SET_VERSION;
  source_ref: string;
  deterministic: true;
  evaluated_at: 'profile_construction';
}

export interface DeterministicCapabilityMapping {
  mapping_id: 'dsc-backend-profile-deterministic-capability-mapping-v1';
  description: string;
  purity: 'deterministic_pure_function';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  ordering: 'capability_registry_registered_capability_ids_order';
  entries: CapabilityMappingEntry[];
  undeclared_capability_policy: 'reject';
  unknown_capability_policy: 'reject';
  maps_capabilities_in_this_phase: true;
  evaluates_backends_in_this_phase: false;
}

export interface AdapterConfiguration {
  configuration_id: 'dsc-backend-profile-adapter-configuration-v1';
  description: string;
  packet_adapter_ref: 'dsc-packet-adapter-v1';
  adapter_foundation_ref: string;
  adapted_input_shape_ref: 'dsc_adapted_conditioning_input_v1';
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  channel_order: ConditioningChannelId[];
  channel_transform: 'identity_passthrough';
  passthrough_policy: 'structure_preserving_no_transform';
  binding_policy: 'opaque_conditioning_binding_handle';
  requires_gpu: false;
  performs_inference: false;
  materializes_tensors: false;
  materializes_frames: false;
  configures_adapter_in_this_phase: true;
  implements_adapter_in_this_phase: false;
}

export interface ProfileValidationCheck {
  check_id: string;
  description: string;
  evaluation: 'design_time_declaration_only';
  pass_condition: string;
  fail_code: string;
  mandatory: true;
  status_in_this_phase: 'not_evaluated' | 'passed_by_construction';
}

export interface ProfileValidation {
  validation_id: 'dsc-backend-profile-validation-v1';
  description: string;
  evaluation: 'collect_all_failures';
  accept_condition: 'zero failed checks';
  outcome_values: ['valid', 'invalid'];
  checks: ProfileValidationCheck[];
  requires_complete_capability_mapping: true;
  requires_adapter_configuration: true;
  validates_backends_in_this_phase: false;
}

export interface DirectSpatialConditioningBackendProfile {
  backend_profile_id: string;
  phase: typeof DSC_BACKEND_PROFILE_PHASE;
  system_id: typeof DSC_BACKEND_PROFILE_SYSTEM_ID;
  mode: 'design_only_profile';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_V1';
  profile_id: typeof BACKEND_PROFILE_ID;
  profile_version: typeof BACKEND_PROFILE_VERSION;
  profile_kind: 'reference_profile';
  implementation_spec_ref: string;
  implementation_spec_phase: typeof DSC_BACKEND_IMPLEMENTATION_SPEC_PHASE;
  implementation_spec_system_id: typeof DSC_BACKEND_IMPLEMENTATION_SPEC_SYSTEM_ID;
  backend_design_certification_ref: string;
  execution_contract_ref: string;
  runtime_router_ref: string;
  adapter_registration_ref: string;
  compatibility_engine_ref: string;
  capability_registry_ref: string;
  adapter_foundation_ref: string;
  runtime_interface_ref: string;
  runtime_package_ref: string;
  sources_supported: string[];
  required_channels: ConditioningChannelId[];
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  backend_profile_schema: BackendProfileSchema;
  deterministic_capability_mapping: DeterministicCapabilityMapping;
  adapter_configuration: AdapterConfiguration;
  profile_validation: ProfileValidation;
  bound_backends: {
    count: 0;
    entries: [];
    binding_policy: string;
    binds_backends_in_this_phase: false;
  };
  design_constraints: {
    profile_only: true;
    read_only: true;
    backend_agnostic: true;
    reuses_implementation_spec: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    binds_backends_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
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
 * Build the design-only, read-only first DSC backend profile. Reuses the
 * PHASE-045 implementation specification and PHASE-040 capability registry by
 * exact reference; writes only the profile artifact. No backend is implemented
 * and no upstream artifact is modified.
 */
export function buildDirectSpatialConditioningBackendProfile(
  projectRoot?: string
): { backendProfile: DirectSpatialConditioningBackendProfile } {
  const root = resolveProjectRoot(projectRoot);

  const implementationSpec = readJson<DirectSpatialConditioningBackendImplementationSpec>(
    root,
    BACKEND_IMPLEMENTATION_SPEC_PATH
  );
  if (
    implementationSpec.phase !== DSC_BACKEND_IMPLEMENTATION_SPEC_PHASE ||
    implementationSpec.system_id !== DSC_BACKEND_IMPLEMENTATION_SPEC_SYSTEM_ID
  ) {
    throw new Error('PHASE-045 implementation specification is missing or incompatible');
  }
  if (!implementationSpec.design_constraints.backend_agnostic) {
    throw new Error('Implementation specification must remain backend agnostic');
  }
  if (!implementationSpec.design_constraints.reuses_execution_contract) {
    throw new Error('Implementation specification must reuse the execution contract');
  }
  if (implementationSpec.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
    throw new Error('Implementation specification execution contract ref drifted');
  }
  if (implementationSpec.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
    throw new Error('Implementation specification capability registry ref drifted');
  }
  if (implementationSpec.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
    throw new Error('Implementation specification adapter foundation ref drifted');
  }
  if (
    JSON.stringify(implementationSpec.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Implementation specification channels do not match foundation channels');
  }
  if (
    JSON.stringify(implementationSpec.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Implementation specification sources_supported drifted from the certified corpus'
    );
  }
  if (implementationSpec.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Implementation specification spatial frame drifted');
  }
  if (
    implementationSpec.capability_set_id !== CAPABILITY_SET_ID ||
    implementationSpec.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Implementation specification capability set identity drifted');
  }
  if (implementationSpec.implemented_backends.count !== 0) {
    throw new Error('PHASE-045 must not have implemented backends in this design stack');
  }

  const certification = readJson<{ certified?: boolean }>(
    root,
    BACKEND_DESIGN_CERTIFICATION_PATH
  );
  if (certification.certified !== true) {
    throw new Error('PHASE-046 backend design stack is not certified');
  }

  const capabilityRegistry = readJson<DirectSpatialConditioningBackendCapabilityRegistry>(
    root,
    BACKEND_CAPABILITY_REGISTRY_PATH
  );
  const registeredCapabilityIds =
    capabilityRegistry.capability_schema.registered_capability_ids;
  if (registeredCapabilityIds.length === 0) {
    throw new Error('Capability registry exposes no registered capability ids');
  }

  const adapterFoundation = readJson<DirectSpatialConditioningBackendAdapterFoundation>(
    root,
    BACKEND_ADAPTER_FOUNDATION_PATH
  );
  if (adapterFoundation.packet_adapter.adapter_id !== 'dsc-packet-adapter-v1') {
    throw new Error('Adapter foundation packet adapter identity drifted');
  }
  if (
    JSON.stringify(adapterFoundation.packet_adapter.output_shape.channel_order) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Adapter foundation channel order drifted');
  }
  const foundationCapabilityIds =
    adapterFoundation.capability_contract.required_capabilities.map(
      (capability) => capability.capability_id
    );
  if (JSON.stringify(foundationCapabilityIds) !== JSON.stringify(registeredCapabilityIds)) {
    throw new Error('Capability registry / foundation capability id drift');
  }

  const backend_profile_schema: BackendProfileSchema = {
    schema_id: 'dsc-backend-profile-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning backend profile. Identity is opaque; no vendor, framework, or device binding is expressed. Profiles declare capability mappings and adapter configuration without implementing a backend.',
    encoding: 'application/json',
    profile_id_policy: 'opaque_profile_id_no_vendor_binding',
    required_fields: [
      {
        field: 'profile_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor, framework, or device semantics',
      },
      {
        field: 'profile_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor profile version string',
      },
      {
        field: 'profile_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal reference_profile for the first profile',
      },
      {
        field: 'capability_set_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${CAPABILITY_SET_ID}`,
      },
      {
        field: 'capability_set_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${CAPABILITY_SET_VERSION}`,
      },
      {
        field: 'spatial_frame_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${SPATIAL_FRAME.frame_id}`,
      },
      {
        field: 'required_channels',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'must equal the six foundation channels in fixed order',
      },
      {
        field: 'deterministic_capability_mapping',
        type: 'dsc-backend-profile-deterministic-capability-mapping-v1',
        required: true,
        nullable: false,
        constraint:
          'one supported entry per registered capability id in registry order',
      },
      {
        field: 'adapter_configuration',
        type: 'dsc-backend-profile-adapter-configuration-v1',
        required: true,
        nullable: false,
        constraint:
          'must reuse dsc-packet-adapter-v1 with identity passthrough and no GPU or inference',
      },
      {
        field: 'profile_validation',
        type: 'dsc-backend-profile-validation-v1',
        required: true,
        nullable: false,
        constraint: 'must declare mandatory validation checks for the profile',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_capability_mapping: DeterministicCapabilityMapping = {
    mapping_id: 'dsc-backend-profile-deterministic-capability-mapping-v1',
    description:
      'Deterministic mapping from each registered mandatory capability to a supported declaration for the first reference profile. Pure function of the capability registry order; no seed, time, or randomness dependence.',
    purity: 'deterministic_pure_function',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    ordering: 'capability_registry_registered_capability_ids_order',
    entries: registeredCapabilityIds.map((capability_id) => ({
      capability_id,
      declared_state: 'supported' as const,
      mapping_rule: 'mandatory_capability_maps_to_supported' as const,
      capability_version: CAPABILITY_SET_VERSION,
      source_ref: 'capability_registry.capability_schema.registered_capability_ids',
      deterministic: true as const,
      evaluated_at: 'profile_construction' as const,
    })),
    undeclared_capability_policy: 'reject',
    unknown_capability_policy: 'reject',
    maps_capabilities_in_this_phase: true,
    evaluates_backends_in_this_phase: false,
  };

  const adapter_configuration: AdapterConfiguration = {
    configuration_id: 'dsc-backend-profile-adapter-configuration-v1',
    description:
      'Adapter configuration bound to the PHASE-039 packet adapter for the first reference profile. Declares identity passthrough over the six conditioning channels in foundation order. Configures no backend implementation and requires neither GPU nor inference.',
    packet_adapter_ref: 'dsc-packet-adapter-v1',
    adapter_foundation_ref: BACKEND_ADAPTER_FOUNDATION_PATH,
    adapted_input_shape_ref: 'dsc_adapted_conditioning_input_v1',
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    channel_order: [...CONDITIONING_CHANNEL_IDS],
    channel_transform: 'identity_passthrough',
    passthrough_policy: 'structure_preserving_no_transform',
    binding_policy: 'opaque_conditioning_binding_handle',
    requires_gpu: false,
    performs_inference: false,
    materializes_tensors: false,
    materializes_frames: false,
    configures_adapter_in_this_phase: true,
    implements_adapter_in_this_phase: false,
  };

  const profile_validation: ProfileValidation = {
    validation_id: 'dsc-backend-profile-validation-v1',
    description:
      'Validation rules the first backend profile must satisfy at design time. Checks are passed by construction for this reference profile; no backend is validated in this phase.',
    evaluation: 'collect_all_failures',
    accept_condition: 'zero failed checks',
    outcome_values: ['valid', 'invalid'],
    checks: [
      {
        check_id: 'CHK_PROFILE_IDENTITY_OPAQUE',
        description: 'profile_id must be opaque with no vendor, framework, or device semantics.',
        evaluation: 'design_time_declaration_only',
        pass_condition: 'profile_id equals dsc-backend-profile-reference-v1',
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_IDENTITY',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
      {
        check_id: 'CHK_CAPABILITY_SET_LOCKED',
        description: 'Profile must bind the frozen capability set identity and version.',
        evaluation: 'design_time_declaration_only',
        pass_condition: `capability_set_id equals ${CAPABILITY_SET_ID} and capability_set_version equals ${CAPABILITY_SET_VERSION}`,
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_CAPABILITY_SET',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
      {
        check_id: 'CHK_CAPABILITY_MAPPING_COMPLETE',
        description:
          'Deterministic capability mapping must cover every registered capability id exactly once in registry order.',
        evaluation: 'design_time_declaration_only',
        pass_condition:
          'mapping entry ids equal capability_registry.capability_schema.registered_capability_ids',
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_MAPPING_INCOMPLETE',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
      {
        check_id: 'CHK_CAPABILITY_MAPPING_SUPPORTED',
        description:
          'Every mapped mandatory capability must declare state supported under the reference profile rule.',
        evaluation: 'design_time_declaration_only',
        pass_condition: 'every entry.declared_state equals supported',
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_MAPPING_UNSUPPORTED',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
      {
        check_id: 'CHK_MAPPING_DETERMINISTIC',
        description:
          'Capability mapping must be a pure deterministic function with no seed, time, or randomness dependence.',
        evaluation: 'design_time_declaration_only',
        pass_condition:
          'purity equals deterministic_pure_function and seed/time/randomness equal none',
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_MAPPING_NONDETERMINISTIC',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
      {
        check_id: 'CHK_ADAPTER_PACKET_ADAPTER',
        description: 'Adapter configuration must reuse dsc-packet-adapter-v1 exactly.',
        evaluation: 'design_time_declaration_only',
        pass_condition: 'packet_adapter_ref equals dsc-packet-adapter-v1',
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_ADAPTER_REF',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
      {
        check_id: 'CHK_ADAPTER_CHANNEL_ORDER',
        description: 'Adapter configuration channel order must match foundation channel order.',
        evaluation: 'design_time_declaration_only',
        pass_condition: 'channel_order equals CONDITIONING_CHANNEL_IDS',
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_CHANNEL_ORDER',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
      {
        check_id: 'CHK_ADAPTER_IDENTITY_PASSTHROUGH',
        description:
          'Adapter configuration must declare identity passthrough with structure-preserving policy.',
        evaluation: 'design_time_declaration_only',
        pass_condition:
          'channel_transform equals identity_passthrough and passthrough_policy equals structure_preserving_no_transform',
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_TRANSFORM',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
      {
        check_id: 'CHK_SPATIAL_FRAME_LOCKED',
        description: 'Profile must operate exclusively in normalized_image_plane_v1.',
        evaluation: 'design_time_declaration_only',
        pass_condition: `spatial_frame_ref equals ${SPATIAL_FRAME.frame_id}`,
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_SPATIAL_FRAME',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
      {
        check_id: 'CHK_NO_GPU_NO_INFERENCE',
        description: 'Profile adapter configuration must not require GPU or perform inference.',
        evaluation: 'design_time_declaration_only',
        pass_condition: 'requires_gpu equals false and performs_inference equals false',
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_GPU_INFERENCE',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
      {
        check_id: 'CHK_NO_BACKEND_BOUND',
        description: 'Profile must bind zero backends in this design-only phase.',
        evaluation: 'design_time_declaration_only',
        pass_condition: 'bound_backends.count equals 0 and binds_backends_in_this_phase equals false',
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_BACKEND_BOUND',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
      {
        check_id: 'CHK_REUSES_IMPLEMENTATION_SPEC',
        description:
          'Profile must reuse the frozen PHASE-045 implementation specification by exact reference.',
        evaluation: 'design_time_declaration_only',
        pass_condition: 'implementation_spec_ref equals BACKEND_IMPLEMENTATION_SPEC_PATH',
        fail_code: 'DSC_BACKEND_PROFILE_FAIL_SPEC_REF',
        mandatory: true,
        status_in_this_phase: 'passed_by_construction',
      },
    ],
    requires_complete_capability_mapping: true,
    requires_adapter_configuration: true,
    validates_backends_in_this_phase: false,
  };

  const backendProfile: DirectSpatialConditioningBackendProfile = {
    backend_profile_id: 'direct-spatial-conditioning-backend-profile-v1',
    phase: DSC_BACKEND_PROFILE_PHASE,
    system_id: DSC_BACKEND_PROFILE_SYSTEM_ID,
    mode: 'design_only_profile',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_V1',
    profile_id: BACKEND_PROFILE_ID,
    profile_version: BACKEND_PROFILE_VERSION,
    profile_kind: 'reference_profile',
    implementation_spec_ref: BACKEND_IMPLEMENTATION_SPEC_PATH,
    implementation_spec_phase: DSC_BACKEND_IMPLEMENTATION_SPEC_PHASE,
    implementation_spec_system_id: DSC_BACKEND_IMPLEMENTATION_SPEC_SYSTEM_ID,
    backend_design_certification_ref: BACKEND_DESIGN_CERTIFICATION_PATH,
    execution_contract_ref: BACKEND_EXECUTION_CONTRACT_PATH,
    runtime_router_ref: BACKEND_RUNTIME_ROUTER_PATH,
    adapter_registration_ref: BACKEND_ADAPTER_REGISTRATION_PATH,
    compatibility_engine_ref: BACKEND_COMPATIBILITY_ENGINE_PATH,
    capability_registry_ref: BACKEND_CAPABILITY_REGISTRY_PATH,
    adapter_foundation_ref: BACKEND_ADAPTER_FOUNDATION_PATH,
    runtime_interface_ref: RUNTIME_INTERFACE_PATH,
    runtime_package_ref: RUNTIME_PACKAGE_PATH,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    backend_profile_schema,
    deterministic_capability_mapping,
    adapter_configuration,
    profile_validation,
    bound_backends: {
      count: 0,
      entries: [],
      binding_policy:
        'backends may bind to this profile only after a future implementation phase; none are bound here',
      binds_backends_in_this_phase: false,
    },
    design_constraints: {
      profile_only: true,
      read_only: true,
      backend_agnostic: true,
      reuses_implementation_spec: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      binds_backends_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, BACKEND_PROFILE_PATH, backendProfile);
  return { backendProfile };
}
