import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';
import { BACKEND_ADAPTER_FOUNDATION_PATH } from './directSpatialConditioningBackendAdapterFoundationBuilder.js';
import {
  BACKEND_CAPABILITY_REGISTRY_PATH,
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
} from './directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import { BACKEND_COMPATIBILITY_ENGINE_PATH } from './directSpatialConditioningBackendCompatibilityEngineBuilder.js';
import { BACKEND_ADAPTER_REGISTRATION_PATH } from './directSpatialConditioningBackendAdapterRegistrationBuilder.js';
import { BACKEND_RUNTIME_ROUTER_PATH } from './directSpatialConditioningBackendRuntimeRouterBuilder.js';
import { BACKEND_EXECUTION_CONTRACT_PATH } from './directSpatialConditioningBackendExecutionContractBuilder.js';
import { BACKEND_IMPLEMENTATION_SPEC_PATH } from './directSpatialConditioningBackendImplementationSpecBuilder.js';
import { BACKEND_DESIGN_CERTIFICATION_PATH } from './directSpatialConditioningBackendDesignCertificationBuilder.js';
import { BACKEND_PROFILE_PATH } from './directSpatialConditioningBackendProfileBuilder.js';
import { BACKEND_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningBackendProfileCertificationBuilder.js';
import { BACKEND_TEMPLATE_PATH } from './directSpatialConditioningBackendTemplateBuilder.js';
import {
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_PATH,
} from './directSpatialConditioningReferenceBackendBuilder.js';
import {
  BACKEND_FAMILY_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
} from './directSpatialConditioningBackendFamilyBuilder.js';
import {
  BACKEND_FAMILY_CERTIFICATION_PATH,
  VENDOR_PROFILE_ID,
  VENDOR_PROFILE_PATH,
  VENDOR_PROFILE_VERSION,
  type DirectSpatialConditioningVendorProfile,
} from './directSpatialConditioningVendorProfileBuilder.js';
import { VENDOR_REGISTRY_PATH } from './directSpatialConditioningVendorRegistryBuilder.js';
import { VENDOR_COMPATIBILITY_PATH } from './directSpatialConditioningVendorCompatibilityBuilder.js';
import { VENDOR_ROUTER_PATH } from './directSpatialConditioningVendorRouterBuilder.js';
import { VENDOR_EXECUTION_CONTRACT_PATH } from './directSpatialConditioningVendorExecutionContractBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE,
  DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_SPEC_PATH,
  type DirectSpatialConditioningVendorImplementationSpec,
} from './directSpatialConditioningVendorImplementationSpecBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-063: Direct Spatial Conditioning reference vendor profile.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines the first reference vendor
 * profile over the certified Vendor Design stack (PHASE-061 vendor
 * implementation specification whose PASS target is the certification reused
 * here, plus the upstream vendor design layers it anchors):
 *   - reference vendor profile schema,
 *   - deterministic vendor identity,
 *   - certified Vendor Design binding, and
 *   - reference vendor capability profile.
 *
 * Declares a reference profile only. Implements no vendor, binds no vendor
 * name, performs no GPU or inference work, and modifies no dataset. The
 * certified Vendor Design is reused by exact reference.
 */

export const DSC_VENDOR_REFERENCE_PROFILE_PHASE = 'PHASE-DSC-063' as const;
export const DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_V1' as const;

export const VENDOR_REFERENCE_PROFILE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_REFERENCE_PROFILE_PATH =
  `${VENDOR_REFERENCE_PROFILE_ROOT}/direct-spatial-conditioning-vendor-reference-profile-v1.json` as const;

/** Opaque deterministic identity of the first reference vendor profile. */
export const VENDOR_REFERENCE_PROFILE_ID =
  'dsc-vendor-profile-reference-v1' as const;
export const VENDOR_REFERENCE_PROFILE_VERSION = '1.0' as const;

export type CapabilityDeclarationState = 'supported' | 'unsupported';

export interface ReferenceVendorProfileSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface ReferenceVendorProfileSchema {
  schema_id: 'dsc-vendor-reference-profile-schema-v1';
  description: string;
  encoding: 'application/json';
  vendor_profile_id_policy: 'opaque_vendor_profile_id_no_vendor_binding';
  generic_vendor_profile_ref: typeof VENDOR_PROFILE_ID;
  required_fields: ReferenceVendorProfileSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicVendorIdentity {
  identity_id: 'dsc-vendor-reference-profile-deterministic-identity-v1';
  description: string;
  vendor_profile_id: typeof VENDOR_REFERENCE_PROFILE_ID;
  vendor_profile_version: typeof VENDOR_REFERENCE_PROFILE_VERSION;
  identity_policy: 'opaque_vendor_profile_id_no_vendor_binding';
  derivation: 'literal_constant_declared_at_design_time';
  purity: 'deterministic_pure_constant';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  vendor_binding: 'none';
  framework_binding: 'none';
  device_binding: 'none';
  vendor_name: 'none';
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  required_channels: ConditioningChannelId[];
}

export interface VendorDesignBinding {
  binding_id: 'dsc-vendor-reference-profile-vendor-design-binding-v1';
  description: string;
  vendor_implementation_spec_ref: string;
  vendor_implementation_spec_phase: typeof DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE;
  vendor_implementation_spec_system_id: typeof DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID;
  certified_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1';
  vendor_execution_contract_ref: string;
  vendor_router_ref: string;
  vendor_compatibility_ref: string;
  vendor_registry_ref: string;
  generic_vendor_profile_ref: string;
  generic_vendor_profile_id: typeof VENDOR_PROFILE_ID;
  generic_vendor_profile_version: typeof VENDOR_PROFILE_VERSION;
  binding_mode: 'exact_reuse';
  role: 'vendor_reference_profile_design_anchor';
  design_layers_bound: string[];
  instantiates_vendors_in_this_phase: false;
  implements_design_in_this_phase: false;
}

export interface ReferenceVendorCapabilityEntry {
  capability_id: string;
  declared_state: CapabilityDeclarationState;
  mapping_rule: 'mandatory_capability_maps_to_supported';
  capability_version: typeof CAPABILITY_SET_VERSION;
  inherited_from: 'dsc-vendor-capability-interface-v1';
  source_ref: string;
  deterministic: true;
  evaluated_at: 'profile_construction';
}

export interface ReferenceVendorCapabilityProfile {
  capability_profile_id: 'dsc-vendor-reference-capability-profile-v1';
  description: string;
  vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1';
  generic_vendor_profile_ref: string;
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  required_channels: ConditioningChannelId[];
  purity: 'deterministic_pure_function';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  ordering: 'vendor_capability_interface_required_capability_declarations_order';
  entries: ReferenceVendorCapabilityEntry[];
  methods_required: string[];
  undeclared_capability_policy: 'reject';
  unknown_capability_policy: 'reject';
  vendor_specific_extensions: 'forbidden';
  requires_gpu: false;
  performs_inference: false;
  maps_capabilities_in_this_phase: true;
  implements_capabilities_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorReferenceProfile {
  vendor_reference_profile_artifact_id: string;
  phase: typeof DSC_VENDOR_REFERENCE_PROFILE_PHASE;
  system_id: typeof DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID;
  mode: 'design_only_vendor_reference_profile';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_V1';
  vendor_profile_id: typeof VENDOR_REFERENCE_PROFILE_ID;
  vendor_profile_version: typeof VENDOR_REFERENCE_PROFILE_VERSION;
  vendor_profile_kind: 'reference_vendor_profile';
  vendor_implementation_spec_ref: string;
  vendor_implementation_spec_phase: typeof DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE;
  vendor_implementation_spec_system_id: typeof DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID;
  vendor_execution_contract_ref: string;
  vendor_router_ref: string;
  vendor_compatibility_ref: string;
  vendor_registry_ref: string;
  vendor_profile_ref: string;
  family_ref: string;
  family_certification_ref: string;
  reference_backend_ref: string;
  reference_backend_certification_ref: string;
  template_ref: string;
  template_certification_ref: string;
  profile_ref: string;
  profile_certification_ref: string;
  backend_design_certification_ref: string;
  implementation_spec_ref: string;
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
  reference_vendor_profile_schema: ReferenceVendorProfileSchema;
  deterministic_vendor_identity: DeterministicVendorIdentity;
  vendor_design_binding: VendorDesignBinding;
  reference_vendor_capability_profile: ReferenceVendorCapabilityProfile;
  bound_vendors: {
    count: 0;
    entries: [];
    binding_policy: string;
    binds_vendors_in_this_phase: false;
  };
  design_constraints: {
    profile_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_design: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    binds_vendors_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC reference vendor
 * profile. Reuses the certified Vendor Design (PHASE-061 vendor implementation
 * specification PASS target) by exact reference; writes only the reference
 * profile artifact. No vendor is implemented and no upstream artifact is
 * modified.
 */
export function buildDirectSpatialConditioningVendorReferenceProfile(
  projectRoot?: string
): { vendorReferenceProfile: DirectSpatialConditioningVendorReferenceProfile } {
  const root = resolveProjectRoot(projectRoot);

  const familyCertification = readJson<{ certified?: boolean }>(
    root,
    BACKEND_FAMILY_CERTIFICATION_PATH
  );
  if (familyCertification.certified !== true) {
    throw new Error('PHASE-054 backend family is not certified');
  }

  const vendorImplementationSpec =
    readJson<DirectSpatialConditioningVendorImplementationSpec>(
      root,
      VENDOR_IMPLEMENTATION_SPEC_PATH
    );
  if (
    vendorImplementationSpec.phase !== DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE ||
    vendorImplementationSpec.system_id !== DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID
  ) {
    throw new Error(
      'PHASE-061 vendor implementation specification is missing or incompatible'
    );
  }
  if (
    vendorImplementationSpec.target !==
    'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1'
  ) {
    throw new Error(
      'Vendor implementation specification target is not the certified PASS verdict'
    );
  }
  if (!vendorImplementationSpec.design_constraints.vendor_neutral) {
    throw new Error('Vendor implementation specification must remain vendor neutral');
  }
  if (!vendorImplementationSpec.design_constraints.reuses_vendor_execution_contract) {
    throw new Error(
      'Vendor implementation specification must reuse the vendor execution contract'
    );
  }
  if (!vendorImplementationSpec.design_constraints.no_vendor_implementation) {
    throw new Error(
      'Vendor implementation specification must forbid vendor implementation'
    );
  }
  if (
    vendorImplementationSpec.vendor_execution_contract_ref !==
    VENDOR_EXECUTION_CONTRACT_PATH
  ) {
    throw new Error(
      'Vendor implementation specification vendor execution contract ref drifted'
    );
  }
  if (vendorImplementationSpec.vendor_router_ref !== VENDOR_ROUTER_PATH) {
    throw new Error('Vendor implementation specification vendor router ref drifted');
  }
  if (
    vendorImplementationSpec.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH
  ) {
    throw new Error(
      'Vendor implementation specification vendor compatibility ref drifted'
    );
  }
  if (vendorImplementationSpec.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
    throw new Error('Vendor implementation specification vendor registry ref drifted');
  }
  if (vendorImplementationSpec.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
    throw new Error('Vendor implementation specification vendor profile ref drifted');
  }
  if (
    JSON.stringify(vendorImplementationSpec.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error(
      'Vendor implementation specification channels do not match foundation channels'
    );
  }
  if (
    JSON.stringify(vendorImplementationSpec.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor implementation specification sources_supported drifted from the certified corpus'
    );
  }
  if (vendorImplementationSpec.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor implementation specification spatial frame drifted');
  }
  if (
    vendorImplementationSpec.capability_set_id !== CAPABILITY_SET_ID ||
    vendorImplementationSpec.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error(
      'Vendor implementation specification capability set identity drifted'
    );
  }
  if (vendorImplementationSpec.implemented_vendors.count !== 0) {
    throw new Error(
      'PHASE-061 must not have implemented vendors in this design stack'
    );
  }

  const vendorProfile = readJson<DirectSpatialConditioningVendorProfile>(
    root,
    VENDOR_PROFILE_PATH
  );
  if (vendorProfile.vendor_profile_id !== VENDOR_PROFILE_ID) {
    throw new Error('Generic vendor profile identity drifted');
  }
  if (
    vendorProfile.vendor_capability_interface.interface_id !==
    'dsc-vendor-capability-interface-v1'
  ) {
    throw new Error('Vendor capability interface identity drifted');
  }
  const capabilityDeclarations =
    vendorProfile.vendor_capability_interface.required_capability_declarations;
  if (capabilityDeclarations.length === 0) {
    throw new Error('Vendor capability interface exposes no required declarations');
  }
  const methodIds = vendorProfile.vendor_capability_interface.methods.map(
    (method) => method.method_id
  );
  if (methodIds.length !== 4) {
    throw new Error('Vendor capability interface must expose exactly four methods');
  }

  const reference_vendor_profile_schema: ReferenceVendorProfileSchema = {
    schema_id: 'dsc-vendor-reference-profile-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning reference vendor profile. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A reference profile binds the certified Vendor Design and publishes a reference capability profile without implementing any vendor.',
    encoding: 'application/json',
    vendor_profile_id_policy: 'opaque_vendor_profile_id_no_vendor_binding',
    generic_vendor_profile_ref: VENDOR_PROFILE_ID,
    required_fields: [
      {
        field: 'vendor_profile_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'vendor_profile_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor vendor profile version string',
      },
      {
        field: 'vendor_profile_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal reference_vendor_profile for the first reference profile',
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
        field: 'deterministic_vendor_identity',
        type: 'dsc-vendor-reference-profile-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_design_binding',
        type: 'dsc-vendor-reference-profile-vendor-design-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the certified Vendor Design as the reference profile design anchor',
      },
      {
        field: 'reference_vendor_capability_profile',
        type: 'dsc-vendor-reference-capability-profile-v1',
        required: true,
        nullable: false,
        constraint:
          'must map every mandatory vendor capability declaration to supported; vendor-specific extensions are forbidden',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_vendor_identity: DeterministicVendorIdentity = {
    identity_id: 'dsc-vendor-reference-profile-deterministic-identity-v1',
    description:
      'Deterministic identity of the reference vendor profile. The vendor_profile_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    vendor_profile_id: VENDOR_REFERENCE_PROFILE_ID,
    vendor_profile_version: VENDOR_REFERENCE_PROFILE_VERSION,
    identity_policy: 'opaque_vendor_profile_id_no_vendor_binding',
    derivation: 'literal_constant_declared_at_design_time',
    purity: 'deterministic_pure_constant',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    vendor_binding: 'none',
    framework_binding: 'none',
    device_binding: 'none',
    vendor_name: 'none',
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    required_channels: [...CONDITIONING_CHANNEL_IDS],
  };

  const vendor_design_binding: VendorDesignBinding = {
    binding_id: 'dsc-vendor-reference-profile-vendor-design-binding-v1',
    description:
      'Exact binding of the certified Vendor Design stack as the reference vendor profile design anchor. The certified design is the PHASE-061 vendor implementation specification whose PASS target certifies the vendor design layers from generic vendor profile through implementation specification.',
    vendor_implementation_spec_ref: VENDOR_IMPLEMENTATION_SPEC_PATH,
    vendor_implementation_spec_phase: DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE,
    vendor_implementation_spec_system_id: DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID,
    certified_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1',
    vendor_execution_contract_ref: VENDOR_EXECUTION_CONTRACT_PATH,
    vendor_router_ref: VENDOR_ROUTER_PATH,
    vendor_compatibility_ref: VENDOR_COMPATIBILITY_PATH,
    vendor_registry_ref: VENDOR_REGISTRY_PATH,
    generic_vendor_profile_ref: VENDOR_PROFILE_PATH,
    generic_vendor_profile_id: VENDOR_PROFILE_ID,
    generic_vendor_profile_version: VENDOR_PROFILE_VERSION,
    binding_mode: 'exact_reuse',
    role: 'vendor_reference_profile_design_anchor',
    design_layers_bound: [
      'vendor_profile',
      'vendor_registry',
      'vendor_compatibility',
      'vendor_router',
      'vendor_execution_contract',
      'vendor_implementation_spec',
    ],
    instantiates_vendors_in_this_phase: false,
    implements_design_in_this_phase: false,
  };

  const reference_vendor_capability_profile: ReferenceVendorCapabilityProfile = {
    capability_profile_id: 'dsc-vendor-reference-capability-profile-v1',
    description:
      'Reference vendor capability profile derived deterministically from the PHASE-055 vendor capability interface. Every mandatory capability declaration maps to supported; no vendor-specific extension is permitted and nothing is implemented in this phase.',
    vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1',
    generic_vendor_profile_ref: VENDOR_PROFILE_PATH,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    purity: 'deterministic_pure_function',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    ordering: 'vendor_capability_interface_required_capability_declarations_order',
    entries: capabilityDeclarations.map((declaration) => ({
      capability_id: declaration.capability_id,
      declared_state: 'supported' as const,
      mapping_rule: 'mandatory_capability_maps_to_supported' as const,
      capability_version: CAPABILITY_SET_VERSION,
      inherited_from: 'dsc-vendor-capability-interface-v1' as const,
      source_ref: `${VENDOR_PROFILE_PATH}#vendor_capability_interface.required_capability_declarations`,
      deterministic: true as const,
      evaluated_at: 'profile_construction' as const,
    })),
    methods_required: [...methodIds],
    undeclared_capability_policy: 'reject',
    unknown_capability_policy: 'reject',
    vendor_specific_extensions: 'forbidden',
    requires_gpu: false,
    performs_inference: false,
    maps_capabilities_in_this_phase: true,
    implements_capabilities_in_this_phase: false,
  };

  const vendorReferenceProfile: DirectSpatialConditioningVendorReferenceProfile = {
    vendor_reference_profile_artifact_id:
      'direct-spatial-conditioning-vendor-reference-profile-v1',
    phase: DSC_VENDOR_REFERENCE_PROFILE_PHASE,
    system_id: DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID,
    mode: 'design_only_vendor_reference_profile',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_V1',
    vendor_profile_id: VENDOR_REFERENCE_PROFILE_ID,
    vendor_profile_version: VENDOR_REFERENCE_PROFILE_VERSION,
    vendor_profile_kind: 'reference_vendor_profile',
    vendor_implementation_spec_ref: VENDOR_IMPLEMENTATION_SPEC_PATH,
    vendor_implementation_spec_phase: DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE,
    vendor_implementation_spec_system_id: DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID,
    vendor_execution_contract_ref: VENDOR_EXECUTION_CONTRACT_PATH,
    vendor_router_ref: VENDOR_ROUTER_PATH,
    vendor_compatibility_ref: VENDOR_COMPATIBILITY_PATH,
    vendor_registry_ref: VENDOR_REGISTRY_PATH,
    vendor_profile_ref: VENDOR_PROFILE_PATH,
    family_ref: BACKEND_FAMILY_PATH,
    family_certification_ref: BACKEND_FAMILY_CERTIFICATION_PATH,
    reference_backend_ref: REFERENCE_BACKEND_PATH,
    reference_backend_certification_ref: REFERENCE_BACKEND_CERTIFICATION_PATH,
    template_ref: BACKEND_TEMPLATE_PATH,
    template_certification_ref: BACKEND_TEMPLATE_CERTIFICATION_PATH,
    profile_ref: BACKEND_PROFILE_PATH,
    profile_certification_ref: BACKEND_PROFILE_CERTIFICATION_PATH,
    backend_design_certification_ref: BACKEND_DESIGN_CERTIFICATION_PATH,
    implementation_spec_ref: BACKEND_IMPLEMENTATION_SPEC_PATH,
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
    reference_vendor_profile_schema,
    deterministic_vendor_identity,
    vendor_design_binding,
    reference_vendor_capability_profile,
    bound_vendors: {
      count: 0,
      entries: [],
      binding_policy:
        'vendors may bind to this reference profile only in a future design or implementation phase; none are bound here',
      binds_vendors_in_this_phase: false,
    },
    design_constraints: {
      profile_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_design: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      binds_vendors_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_REFERENCE_PROFILE_PATH, vendorReferenceProfile);
  return { vendorReferenceProfile };
}
