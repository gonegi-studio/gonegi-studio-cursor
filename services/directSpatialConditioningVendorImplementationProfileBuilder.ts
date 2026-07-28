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
  VENDOR_PROFILE_PATH,
} from './directSpatialConditioningVendorProfileBuilder.js';
import { VENDOR_REGISTRY_PATH } from './directSpatialConditioningVendorRegistryBuilder.js';
import { VENDOR_COMPATIBILITY_PATH } from './directSpatialConditioningVendorCompatibilityBuilder.js';
import { VENDOR_ROUTER_PATH } from './directSpatialConditioningVendorRouterBuilder.js';
import { VENDOR_EXECUTION_CONTRACT_PATH } from './directSpatialConditioningVendorExecutionContractBuilder.js';
import { VENDOR_IMPLEMENTATION_SPEC_PATH } from './directSpatialConditioningVendorImplementationSpecBuilder.js';
import {
  VENDOR_REFERENCE_PROFILE_ID,
  VENDOR_REFERENCE_PROFILE_PATH,
} from './directSpatialConditioningVendorReferenceProfileBuilder.js';
import { VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceProfileCertificationBuilder.js';
import {
  VENDOR_TEMPLATE_ID,
  VENDOR_TEMPLATE_PATH,
} from './directSpatialConditioningVendorTemplateBuilder.js';
import {
  VENDOR_REFERENCE_IMPLEMENTATION_ID,
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
} from './directSpatialConditioningVendorReferenceImplementationBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceImplementationCertificationBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE,
  DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_FAMILY_ID,
  VENDOR_IMPLEMENTATION_FAMILY_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_VERSION,
  type DirectSpatialConditioningVendorImplementationFamily,
} from './directSpatialConditioningVendorImplementationFamilyBuilder.js';
import { VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH } from './directSpatialConditioningVendorImplementationFamilyCertificationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-071: Direct Spatial Conditioning vendor implementation profile.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines the generic profile that a
 * vendor implementation family member is measured against, over the certified
 * PHASE-069 Vendor Implementation Family and PHASE-070 certification:
 *   - implementation profile schema,
 *   - deterministic profile identity,
 *   - certified Vendor Implementation Family binding, and
 *   - implementation capability profile.
 *
 * Declares a profile only. Implements no vendor, performs no GPU or inference
 * work, and modifies no dataset. The certified Vendor Implementation Family is
 * reused by exact reference; its contract capabilities and methods are adopted
 * without being filled.
 */

export const DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE = 'PHASE-DSC-071' as const;
export const DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_V1' as const;

export const VENDOR_IMPLEMENTATION_PROFILE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_IMPLEMENTATION_PROFILE_PATH =
  `${VENDOR_IMPLEMENTATION_PROFILE_ROOT}/direct-spatial-conditioning-vendor-implementation-profile-v1.json` as const;

/** Opaque deterministic identity of the generic vendor implementation profile. */
export const VENDOR_IMPLEMENTATION_PROFILE_ID =
  'dsc-vendor-implementation-profile-generic-v1' as const;
export const VENDOR_IMPLEMENTATION_PROFILE_VERSION = '1.0' as const;

export interface ProfileSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorImplementationProfileSchema {
  schema_id: 'dsc-vendor-implementation-profile-schema-v1';
  description: string;
  encoding: 'application/json';
  profile_id_policy: 'opaque_profile_id_no_vendor_binding';
  family_ref: typeof VENDOR_IMPLEMENTATION_FAMILY_ID;
  required_fields: ProfileSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicProfileIdentity {
  identity_id: 'dsc-vendor-implementation-profile-deterministic-identity-v1';
  description: string;
  profile_id: typeof VENDOR_IMPLEMENTATION_PROFILE_ID;
  profile_version: typeof VENDOR_IMPLEMENTATION_PROFILE_VERSION;
  identity_policy: 'opaque_profile_id_no_vendor_binding';
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

export interface VendorImplementationFamilyBinding {
  binding_id: 'dsc-vendor-implementation-profile-family-binding-v1';
  description: string;
  family_ref: string;
  family_id: typeof VENDOR_IMPLEMENTATION_FAMILY_ID;
  family_version: typeof VENDOR_IMPLEMENTATION_FAMILY_VERSION;
  family_phase: typeof DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE;
  family_system_id: typeof DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID;
  family_certification_ref: string;
  binding_mode: 'exact_reuse';
  role: 'family_conformance_profile';
  family_contract_ref: 'dsc-vendor-implementation-family-contract-v1';
  reference_implementation_ref: string;
  reference_implementation_id: typeof VENDOR_REFERENCE_IMPLEMENTATION_ID;
  template_ref: string;
  template_id: typeof VENDOR_TEMPLATE_ID;
  profile_ref: string;
  profile_id: typeof VENDOR_REFERENCE_PROFILE_ID;
  measures_members_in_this_phase: false;
  implements_family_in_this_phase: false;
}

export interface ProfileCapabilityEntry {
  capability_id: string;
  declared_state: 'required';
  requirement: 'mandatory';
  inherited_from: 'dsc-vendor-implementation-family-contract-v1';
  deterministic: true;
  evaluated_in_this_phase: false;
}

export interface ProfileMethodEntry {
  method_id: string;
  requirement: 'mandatory';
  extension_point_ref: string;
  inherited_from: 'dsc-vendor-implementation-family-contract-v1';
  conformance_state: 'declared_not_evaluated';
  deterministic: true;
  side_effects: 'none';
  evaluated_in_this_phase: false;
}

export interface ImplementationCapabilityProfile {
  capability_profile_id: 'dsc-vendor-implementation-capability-profile-v1';
  description: string;
  family_contract_ref: 'dsc-vendor-implementation-family-contract-v1';
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1';
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  required_channels: ConditioningChannelId[];
  required_sources: number;
  adapted_input_shape_ref: 'dsc_adapted_conditioning_input_v1';
  binding_mode: 'exact_reuse';
  purity: 'deterministic_pure_declaration';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  capability_entries: ProfileCapabilityEntry[];
  methods_required: string[];
  method_entries: ProfileMethodEntry[];
  aggregation_rule: 'all_mandatory_capabilities_supported';
  undeclared_capability_policy: 'reject';
  vendor_specific_capabilities: 'forbidden';
  vendor_specific_extensions: 'forbidden';
  inherits_capability_declarations: true;
  requires_gpu: false;
  performs_inference: false;
  evaluates_members_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorImplementationProfile {
  vendor_implementation_profile_id: string;
  phase: typeof DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE;
  system_id: typeof DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID;
  mode: 'design_only_vendor_implementation_profile';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_V1';
  profile_id: typeof VENDOR_IMPLEMENTATION_PROFILE_ID;
  profile_version: typeof VENDOR_IMPLEMENTATION_PROFILE_VERSION;
  profile_kind: 'generic_vendor_implementation_profile';
  family_ref: string;
  family_certification_ref: string;
  reference_implementation_ref: string;
  reference_implementation_certification_ref: string;
  template_ref: string;
  profile_ref: string;
  profile_certification_ref: string;
  vendor_implementation_spec_ref: string;
  vendor_execution_contract_ref: string;
  vendor_router_ref: string;
  vendor_compatibility_ref: string;
  vendor_registry_ref: string;
  vendor_profile_ref: string;
  backend_family_ref: string;
  backend_family_certification_ref: string;
  reference_backend_ref: string;
  reference_backend_certification_ref: string;
  backend_template_ref: string;
  backend_template_certification_ref: string;
  backend_profile_ref: string;
  backend_profile_certification_ref: string;
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
  implementation_profile_schema: VendorImplementationProfileSchema;
  deterministic_profile_identity: DeterministicProfileIdentity;
  vendor_implementation_family_binding: VendorImplementationFamilyBinding;
  implementation_capability_profile: ImplementationCapabilityProfile;
  profiled_members: {
    count: 0;
    entries: [];
    profiling_policy: string;
    measures_members_in_this_phase: false;
  };
  design_constraints: {
    profile_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_implementation_family: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    measures_members_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral generic DSC vendor
 * implementation profile. Reuses the certified PHASE-069 Vendor Implementation
 * Family by exact reference; writes only the profile artifact. No member is
 * profiled, no vendor is implemented, and no upstream artifact is modified.
 */
export function buildDirectSpatialConditioningVendorImplementationProfile(
  projectRoot?: string
): { vendorImplementationProfile: DirectSpatialConditioningVendorImplementationProfile } {
  const root = resolveProjectRoot(projectRoot);

  const familyCertification = readJson<{
    certified?: boolean;
    certified_system?: string;
  }>(root, VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH);
  if (familyCertification.certified !== true) {
    throw new Error('PHASE-070 vendor implementation family is not certified');
  }
  if (
    familyCertification.certified_system !==
    'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_FAMILY_V1'
  ) {
    throw new Error(
      'PHASE-070 certification does not cover the vendor implementation family'
    );
  }

  const family = readJson<DirectSpatialConditioningVendorImplementationFamily>(
    root,
    VENDOR_IMPLEMENTATION_FAMILY_PATH
  );
  if (
    family.phase !== DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE ||
    family.system_id !== DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID
  ) {
    throw new Error('PHASE-069 vendor implementation family is missing or incompatible');
  }
  if (family.family_id !== VENDOR_IMPLEMENTATION_FAMILY_ID) {
    throw new Error('Vendor implementation family identity drifted');
  }
  if (family.family_version !== VENDOR_IMPLEMENTATION_FAMILY_VERSION) {
    throw new Error('Vendor implementation family version drifted');
  }
  if (!family.design_constraints.vendor_neutral) {
    throw new Error('Vendor implementation family must remain vendor neutral');
  }
  if (!family.design_constraints.reuses_certified_vendor_reference_implementation) {
    throw new Error(
      'Vendor implementation family must reuse the certified vendor reference implementation'
    );
  }
  if (family.family_members.count !== 0) {
    throw new Error('PHASE-069 must not have instantiated family members');
  }
  if (family.reference_implementation_ref !== VENDOR_REFERENCE_IMPLEMENTATION_PATH) {
    throw new Error('Vendor implementation family reference implementation ref drifted');
  }
  if (family.template_ref !== VENDOR_TEMPLATE_PATH) {
    throw new Error('Vendor implementation family template ref drifted');
  }
  if (family.profile_ref !== VENDOR_REFERENCE_PROFILE_PATH) {
    throw new Error('Vendor implementation family profile ref drifted');
  }
  if (
    JSON.stringify(family.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor implementation family channels do not match foundation channels');
  }
  if (JSON.stringify(family.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
    throw new Error(
      'Vendor implementation family sources_supported drifted from the certified corpus'
    );
  }
  if (family.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor implementation family spatial frame drifted');
  }
  if (
    family.capability_set_id !== CAPABILITY_SET_ID ||
    family.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor implementation family capability set identity drifted');
  }

  const contract = family.implementation_family_contract;
  if (contract.contract_id !== 'dsc-vendor-implementation-family-contract-v1') {
    throw new Error('Vendor implementation family contract identity drifted');
  }
  if (contract.required_capabilities.length === 0) {
    throw new Error('Vendor implementation family contract declares no capabilities');
  }
  if (contract.required_methods.length === 0) {
    throw new Error('Vendor implementation family contract declares no methods');
  }

  const implementation_profile_schema: VendorImplementationProfileSchema = {
    schema_id: 'dsc-vendor-implementation-profile-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning generic vendor implementation profile. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A profile binds the certified Vendor Implementation Family and publishes the capability profile every family member is measured against, without measuring any member.',
    encoding: 'application/json',
    profile_id_policy: 'opaque_profile_id_no_vendor_binding',
    family_ref: VENDOR_IMPLEMENTATION_FAMILY_ID,
    required_fields: [
      {
        field: 'profile_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
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
        constraint: 'must equal generic_vendor_implementation_profile',
      },
      {
        field: 'family_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the certified vendor implementation family ${VENDOR_IMPLEMENTATION_FAMILY_ID}`,
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
        field: 'deterministic_profile_identity',
        type: 'dsc-vendor-implementation-profile-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_implementation_family_binding',
        type: 'dsc-vendor-implementation-profile-family-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the certified Vendor Implementation Family as the conformance basis',
      },
      {
        field: 'implementation_capability_profile',
        type: 'dsc-vendor-implementation-capability-profile-v1',
        required: true,
        nullable: false,
        constraint:
          'must inherit every mandatory capability and method from the certified family contract; vendor-specific capabilities and extensions are forbidden',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_profile_identity: DeterministicProfileIdentity = {
    identity_id: 'dsc-vendor-implementation-profile-deterministic-identity-v1',
    description:
      'Deterministic identity of the generic vendor implementation profile. The profile_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    profile_id: VENDOR_IMPLEMENTATION_PROFILE_ID,
    profile_version: VENDOR_IMPLEMENTATION_PROFILE_VERSION,
    identity_policy: 'opaque_profile_id_no_vendor_binding',
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

  const vendor_implementation_family_binding: VendorImplementationFamilyBinding = {
    binding_id: 'dsc-vendor-implementation-profile-family-binding-v1',
    description:
      'Exact binding of the certified PHASE-069 Vendor Implementation Family as the conformance basis. The profile adopts the family contract capabilities and methods without measuring any member or implementing any vendor method.',
    family_ref: VENDOR_IMPLEMENTATION_FAMILY_PATH,
    family_id: VENDOR_IMPLEMENTATION_FAMILY_ID,
    family_version: VENDOR_IMPLEMENTATION_FAMILY_VERSION,
    family_phase: DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE,
    family_system_id: DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID,
    family_certification_ref: VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
    binding_mode: 'exact_reuse',
    role: 'family_conformance_profile',
    family_contract_ref: 'dsc-vendor-implementation-family-contract-v1',
    reference_implementation_ref: VENDOR_REFERENCE_IMPLEMENTATION_PATH,
    reference_implementation_id: VENDOR_REFERENCE_IMPLEMENTATION_ID,
    template_ref: VENDOR_TEMPLATE_PATH,
    template_id: VENDOR_TEMPLATE_ID,
    profile_ref: VENDOR_REFERENCE_PROFILE_PATH,
    profile_id: VENDOR_REFERENCE_PROFILE_ID,
    measures_members_in_this_phase: false,
    implements_family_in_this_phase: false,
  };

  const implementation_capability_profile: ImplementationCapabilityProfile = {
    capability_profile_id: 'dsc-vendor-implementation-capability-profile-v1',
    description:
      'Capability profile every member of the vendor implementation family is measured against. Inherited exactly from the certified family contract. Vendor-specific capabilities and extensions are forbidden; no member is measured in this phase.',
    family_contract_ref: 'dsc-vendor-implementation-family-contract-v1',
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1',
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    required_sources: SOURCE_IDS.length,
    adapted_input_shape_ref: 'dsc_adapted_conditioning_input_v1',
    binding_mode: 'exact_reuse',
    purity: 'deterministic_pure_declaration',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    capability_entries: contract.required_capabilities.map((entry) => ({
      capability_id: entry.capability_id,
      declared_state: 'required' as const,
      requirement: 'mandatory' as const,
      inherited_from: 'dsc-vendor-implementation-family-contract-v1' as const,
      deterministic: true as const,
      evaluated_in_this_phase: false as const,
    })),
    methods_required: contract.required_methods.map((entry) => entry.method_id),
    method_entries: contract.required_methods.map((entry) => ({
      method_id: entry.method_id,
      requirement: 'mandatory' as const,
      extension_point_ref: entry.extension_point_ref,
      inherited_from: 'dsc-vendor-implementation-family-contract-v1' as const,
      conformance_state: 'declared_not_evaluated' as const,
      deterministic: true as const,
      side_effects: 'none' as const,
      evaluated_in_this_phase: false as const,
    })),
    aggregation_rule: 'all_mandatory_capabilities_supported',
    undeclared_capability_policy: 'reject',
    vendor_specific_capabilities: 'forbidden',
    vendor_specific_extensions: 'forbidden',
    inherits_capability_declarations: true,
    requires_gpu: false,
    performs_inference: false,
    evaluates_members_in_this_phase: false,
  };

  const vendorImplementationProfile: DirectSpatialConditioningVendorImplementationProfile =
    {
      vendor_implementation_profile_id:
        'direct-spatial-conditioning-vendor-implementation-profile-v1',
      phase: DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE,
      system_id: DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID,
      mode: 'design_only_vendor_implementation_profile',
      target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_V1',
      profile_id: VENDOR_IMPLEMENTATION_PROFILE_ID,
      profile_version: VENDOR_IMPLEMENTATION_PROFILE_VERSION,
      profile_kind: 'generic_vendor_implementation_profile',
      family_ref: VENDOR_IMPLEMENTATION_FAMILY_PATH,
      family_certification_ref: VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
      reference_implementation_ref: VENDOR_REFERENCE_IMPLEMENTATION_PATH,
      reference_implementation_certification_ref:
        VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
      template_ref: VENDOR_TEMPLATE_PATH,
      profile_ref: VENDOR_REFERENCE_PROFILE_PATH,
      profile_certification_ref: VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
      vendor_implementation_spec_ref: VENDOR_IMPLEMENTATION_SPEC_PATH,
      vendor_execution_contract_ref: VENDOR_EXECUTION_CONTRACT_PATH,
      vendor_router_ref: VENDOR_ROUTER_PATH,
      vendor_compatibility_ref: VENDOR_COMPATIBILITY_PATH,
      vendor_registry_ref: VENDOR_REGISTRY_PATH,
      vendor_profile_ref: VENDOR_PROFILE_PATH,
      backend_family_ref: BACKEND_FAMILY_PATH,
      backend_family_certification_ref: BACKEND_FAMILY_CERTIFICATION_PATH,
      reference_backend_ref: REFERENCE_BACKEND_PATH,
      reference_backend_certification_ref: REFERENCE_BACKEND_CERTIFICATION_PATH,
      backend_template_ref: BACKEND_TEMPLATE_PATH,
      backend_template_certification_ref: BACKEND_TEMPLATE_CERTIFICATION_PATH,
      backend_profile_ref: BACKEND_PROFILE_PATH,
      backend_profile_certification_ref: BACKEND_PROFILE_CERTIFICATION_PATH,
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
      implementation_profile_schema,
      deterministic_profile_identity,
      vendor_implementation_family_binding,
      implementation_capability_profile,
      profiled_members: {
        count: 0,
        entries: [],
        profiling_policy:
          'vendor family members may be measured against this profile only in a future implementation phase; none are measured here',
        measures_members_in_this_phase: false,
      },
      design_constraints: {
        profile_only: true,
        read_only: true,
        vendor_neutral: true,
        reuses_certified_vendor_implementation_family: true,
        no_actual_implementation: true,
        no_vendor_implementation: true,
        backend: 'none',
        no_backend_implementation: true,
        gpu: false,
        inference: false,
        measures_members_in_this_phase: false,
        modifies_existing_datasets: false,
        placeholders: false,
      },
      created_at: new Date().toISOString(),
    };

  writeJson(root, VENDOR_IMPLEMENTATION_PROFILE_PATH, vendorImplementationProfile);
  return { vendorImplementationProfile };
}
