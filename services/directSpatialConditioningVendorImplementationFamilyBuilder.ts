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
  DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE,
  DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID,
  VENDOR_REFERENCE_IMPLEMENTATION_ID,
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_VERSION,
  type DirectSpatialConditioningVendorReferenceImplementation,
} from './directSpatialConditioningVendorReferenceImplementationBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceImplementationCertificationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-069: Direct Spatial Conditioning vendor implementation family.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines the generic family that
 * future vendor implementations join, over the certified PHASE-067 Vendor
 * Reference Implementation and PHASE-068 certification:
 *   - implementation family schema,
 *   - deterministic family identity,
 *   - certified Vendor Reference Implementation binding, and
 *   - implementation family contract.
 *
 * Declares a family only. Instantiates no member, implements no vendor,
 * performs no GPU or inference work, and modifies no dataset. The certified
 * Vendor Reference Implementation is reused by exact reference as the family
 * archetype.
 */

export const DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE = 'PHASE-DSC-069' as const;
export const DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_FAMILY_V1' as const;

export const VENDOR_IMPLEMENTATION_FAMILY_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_IMPLEMENTATION_FAMILY_PATH =
  `${VENDOR_IMPLEMENTATION_FAMILY_ROOT}/direct-spatial-conditioning-vendor-implementation-family-v1.json` as const;

/** Opaque deterministic identity of the generic vendor implementation family. */
export const VENDOR_IMPLEMENTATION_FAMILY_ID =
  'dsc-vendor-implementation-family-generic-v1' as const;
export const VENDOR_IMPLEMENTATION_FAMILY_VERSION = '1.0' as const;

export interface FamilySchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorImplementationFamilySchema {
  schema_id: 'dsc-vendor-implementation-family-schema-v1';
  description: string;
  encoding: 'application/json';
  family_id_policy: 'opaque_family_id_no_vendor_binding';
  reference_implementation_ref: typeof VENDOR_REFERENCE_IMPLEMENTATION_ID;
  required_fields: FamilySchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicFamilyIdentity {
  identity_id: 'dsc-vendor-implementation-family-deterministic-identity-v1';
  description: string;
  family_id: typeof VENDOR_IMPLEMENTATION_FAMILY_ID;
  family_version: typeof VENDOR_IMPLEMENTATION_FAMILY_VERSION;
  identity_policy: 'opaque_family_id_no_vendor_binding';
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

export interface ReferenceImplementationBinding {
  binding_id: 'dsc-vendor-implementation-family-reference-implementation-binding-v1';
  description: string;
  reference_implementation_ref: string;
  implementation_id: typeof VENDOR_REFERENCE_IMPLEMENTATION_ID;
  implementation_version: typeof VENDOR_REFERENCE_IMPLEMENTATION_VERSION;
  reference_implementation_phase: typeof DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE;
  reference_implementation_system_id: typeof DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID;
  reference_implementation_certification_ref: string;
  binding_mode: 'exact_reuse';
  role: 'family_archetype';
  template_ref: string;
  template_id: typeof VENDOR_TEMPLATE_ID;
  profile_ref: string;
  profile_id: typeof VENDOR_REFERENCE_PROFILE_ID;
  implementation_profile_ref: 'dsc-vendor-reference-implementation-profile-v1';
  instantiates_members_in_this_phase: false;
  implements_reference_implementation_in_this_phase: false;
}

export interface FamilyCapabilityRequirement {
  capability_id: string;
  requirement: 'mandatory';
  inherited_from: 'dsc-vendor-reference-implementation-profile-v1';
  declared_state_required: 'supported';
  family_member_must_declare: true;
}

export interface FamilyMethodRequirement {
  method_id: string;
  requirement: 'mandatory';
  extension_point_ref: string;
  inherited_from: 'dsc-vendor-deterministic-implementation-skeleton-v1';
  family_member_must_implement: true;
  implemented_in_this_phase: false;
}

export interface ImplementationFamilyContract {
  contract_id: 'dsc-vendor-implementation-family-contract-v1';
  description: string;
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1';
  capability_registry_ref: string;
  reference_implementation_profile_ref: 'dsc-vendor-reference-implementation-profile-v1';
  template_skeleton_ref: 'dsc-vendor-deterministic-implementation-skeleton-v1';
  template_extension_points_ref: 'dsc-vendor-template-extension-points-v1';
  template_validation_ref: 'dsc-vendor-template-validation-template-v1';
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  required_channels: ConditioningChannelId[];
  required_sources: number;
  adapted_input_shape_ref: 'dsc_adapted_conditioning_input_v1';
  required_capabilities: FamilyCapabilityRequirement[];
  required_methods: FamilyMethodRequirement[];
  membership_rule: 'every_family_member_must_bind_the_certified_vendor_reference_implementation';
  inheritance_rule: 'every_family_member_must_satisfy_all_mandatory_capabilities';
  aggregation_rule: 'all_mandatory_capabilities_supported';
  determinism_rule: 'every_family_member_must_remain_deterministic_and_side_effect_free';
  vendor_specific_capabilities: 'forbidden';
  vendor_specific_extensions: 'forbidden';
  undeclared_capability_policy: 'reject';
  requires_gpu: false;
  performs_inference: false;
  evaluates_members_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorImplementationFamily {
  vendor_implementation_family_id: string;
  phase: typeof DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE;
  system_id: typeof DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID;
  mode: 'design_only_vendor_implementation_family';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_FAMILY_V1';
  family_id: typeof VENDOR_IMPLEMENTATION_FAMILY_ID;
  family_version: typeof VENDOR_IMPLEMENTATION_FAMILY_VERSION;
  family_kind: 'generic_vendor_implementation_family';
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
  family_ref: string;
  family_certification_ref: string;
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
  implementation_family_schema: VendorImplementationFamilySchema;
  deterministic_family_identity: DeterministicFamilyIdentity;
  reference_implementation_binding: ReferenceImplementationBinding;
  implementation_family_contract: ImplementationFamilyContract;
  family_members: {
    count: 0;
    entries: [];
    membership_policy: string;
    instantiates_members_in_this_phase: false;
  };
  design_constraints: {
    family_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_reference_implementation: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    instantiates_members_in_this_phase: false;
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
 * implementation family. Reuses the certified PHASE-067 Vendor Reference
 * Implementation by exact reference; writes only the family artifact. No
 * family member is instantiated, no vendor is implemented, and no upstream
 * artifact is modified.
 */
export function buildDirectSpatialConditioningVendorImplementationFamily(
  projectRoot?: string
): { vendorImplementationFamily: DirectSpatialConditioningVendorImplementationFamily } {
  const root = resolveProjectRoot(projectRoot);

  const referenceCertification = readJson<{
    certified?: boolean;
    certified_system?: string;
  }>(root, VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH);
  if (referenceCertification.certified !== true) {
    throw new Error('PHASE-068 vendor reference implementation is not certified');
  }
  if (
    referenceCertification.certified_system !==
    'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_V1'
  ) {
    throw new Error(
      'PHASE-068 certification does not cover the vendor reference implementation'
    );
  }

  const referenceImplementation =
    readJson<DirectSpatialConditioningVendorReferenceImplementation>(
      root,
      VENDOR_REFERENCE_IMPLEMENTATION_PATH
    );
  if (
    referenceImplementation.phase !== DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE ||
    referenceImplementation.system_id !== DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID
  ) {
    throw new Error('PHASE-067 vendor reference implementation is missing or incompatible');
  }
  if (referenceImplementation.implementation_id !== VENDOR_REFERENCE_IMPLEMENTATION_ID) {
    throw new Error('Vendor reference implementation identity drifted');
  }
  if (
    referenceImplementation.implementation_version !==
    VENDOR_REFERENCE_IMPLEMENTATION_VERSION
  ) {
    throw new Error('Vendor reference implementation version drifted');
  }
  if (!referenceImplementation.design_constraints.vendor_neutral) {
    throw new Error('Vendor reference implementation must remain vendor neutral');
  }
  if (!referenceImplementation.design_constraints.reuses_certified_vendor_template) {
    throw new Error('Vendor reference implementation must reuse the certified vendor template');
  }
  if (
    !referenceImplementation.design_constraints
      .reuses_certified_vendor_reference_profile
  ) {
    throw new Error(
      'Vendor reference implementation must reuse the certified vendor reference profile'
    );
  }
  if (!referenceImplementation.design_constraints.no_actual_implementation) {
    throw new Error('Vendor reference implementation must declare no actual implementation');
  }
  if (referenceImplementation.implemented_vendors.count !== 0) {
    throw new Error(
      'PHASE-067 must not have implemented vendors in this design stack'
    );
  }
  if (referenceImplementation.template_ref !== VENDOR_TEMPLATE_PATH) {
    throw new Error('Vendor reference implementation template ref drifted');
  }
  if (referenceImplementation.profile_ref !== VENDOR_REFERENCE_PROFILE_PATH) {
    throw new Error('Vendor reference implementation profile ref drifted');
  }
  if (
    referenceImplementation.profile_certification_ref !==
    VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH
  ) {
    throw new Error('Vendor reference implementation profile certification ref drifted');
  }
  if (
    JSON.stringify(referenceImplementation.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error(
      'Vendor reference implementation channels do not match foundation channels'
    );
  }
  if (
    JSON.stringify(referenceImplementation.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor reference implementation sources_supported drifted from the certified corpus'
    );
  }
  if (referenceImplementation.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor reference implementation spatial frame drifted');
  }
  if (
    referenceImplementation.capability_set_id !== CAPABILITY_SET_ID ||
    referenceImplementation.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor reference implementation capability set identity drifted');
  }

  const implementationProfile =
    referenceImplementation.reference_implementation_profile;
  const templateBinding = referenceImplementation.vendor_template_binding;
  if (
    implementationProfile.steps.length !==
    templateBinding.extension_points_adopted.length
  ) {
    throw new Error(
      'Vendor reference implementation steps and adopted extension points are inconsistent'
    );
  }
  if (
    JSON.stringify(implementationProfile.steps.map((step) => step.method_id)) !==
    JSON.stringify(implementationProfile.methods_required)
  ) {
    throw new Error(
      'Vendor reference implementation step methods drifted from required methods'
    );
  }

  const implementation_family_schema: VendorImplementationFamilySchema = {
    schema_id: 'dsc-vendor-implementation-family-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning generic vendor implementation family. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A family binds the certified Vendor Reference Implementation as its archetype and publishes the contract every future member must satisfy, without instantiating any member.',
    encoding: 'application/json',
    family_id_policy: 'opaque_family_id_no_vendor_binding',
    reference_implementation_ref: VENDOR_REFERENCE_IMPLEMENTATION_ID,
    required_fields: [
      {
        field: 'family_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'family_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor family version string',
      },
      {
        field: 'family_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal generic_vendor_implementation_family',
      },
      {
        field: 'reference_implementation_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the certified reference implementation ${VENDOR_REFERENCE_IMPLEMENTATION_ID}`,
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
        field: 'deterministic_family_identity',
        type: 'dsc-vendor-implementation-family-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'reference_implementation_binding',
        type: 'dsc-vendor-implementation-family-reference-implementation-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the certified Vendor Reference Implementation as the family archetype',
      },
      {
        field: 'implementation_family_contract',
        type: 'dsc-vendor-implementation-family-contract-v1',
        required: true,
        nullable: false,
        constraint:
          'must declare every mandatory capability and method a family member satisfies; vendor-specific capabilities and extensions are forbidden',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_family_identity: DeterministicFamilyIdentity = {
    identity_id: 'dsc-vendor-implementation-family-deterministic-identity-v1',
    description:
      'Deterministic identity of the generic vendor implementation family. The family_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    family_id: VENDOR_IMPLEMENTATION_FAMILY_ID,
    family_version: VENDOR_IMPLEMENTATION_FAMILY_VERSION,
    identity_policy: 'opaque_family_id_no_vendor_binding',
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

  const reference_implementation_binding: ReferenceImplementationBinding = {
    binding_id: 'dsc-vendor-implementation-family-reference-implementation-binding-v1',
    description:
      'Exact binding of the certified PHASE-067 Vendor Reference Implementation as the family archetype. The family adopts its declared steps, adopted extension points, and inherited capability declarations without instantiating a member or implementing any vendor method.',
    reference_implementation_ref: VENDOR_REFERENCE_IMPLEMENTATION_PATH,
    implementation_id: VENDOR_REFERENCE_IMPLEMENTATION_ID,
    implementation_version: VENDOR_REFERENCE_IMPLEMENTATION_VERSION,
    reference_implementation_phase: DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE,
    reference_implementation_system_id: DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID,
    reference_implementation_certification_ref:
      VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
    binding_mode: 'exact_reuse',
    role: 'family_archetype',
    template_ref: VENDOR_TEMPLATE_PATH,
    template_id: VENDOR_TEMPLATE_ID,
    profile_ref: VENDOR_REFERENCE_PROFILE_PATH,
    profile_id: VENDOR_REFERENCE_PROFILE_ID,
    implementation_profile_ref: 'dsc-vendor-reference-implementation-profile-v1',
    instantiates_members_in_this_phase: false,
    implements_reference_implementation_in_this_phase: false,
  };

  const extensionPointByMethod = new Map(
    templateBinding.extension_points_adopted.map((point) => [
      point.target_method_id,
      point.extension_point_id,
    ])
  );

  const implementation_family_contract: ImplementationFamilyContract = {
    contract_id: 'dsc-vendor-implementation-family-contract-v1',
    description:
      'Contract every member of the generic vendor implementation family must satisfy. Inherited from the certified Vendor Reference Implementation profile and the certified Vendor Template skeleton. Vendor-specific capabilities and extensions are forbidden; no member evaluation occurs in this phase.',
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1',
    capability_registry_ref: BACKEND_CAPABILITY_REGISTRY_PATH,
    reference_implementation_profile_ref:
      'dsc-vendor-reference-implementation-profile-v1',
    template_skeleton_ref: 'dsc-vendor-deterministic-implementation-skeleton-v1',
    template_extension_points_ref: 'dsc-vendor-template-extension-points-v1',
    template_validation_ref: 'dsc-vendor-template-validation-template-v1',
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    required_sources: SOURCE_IDS.length,
    adapted_input_shape_ref: 'dsc_adapted_conditioning_input_v1',
    required_capabilities: implementationProfile.capability_entries.map((entry) => ({
      capability_id: entry.capability_id,
      requirement: 'mandatory' as const,
      inherited_from: 'dsc-vendor-reference-implementation-profile-v1' as const,
      declared_state_required: 'supported' as const,
      family_member_must_declare: true as const,
    })),
    required_methods: implementationProfile.steps.map((step) => ({
      method_id: step.method_id,
      requirement: 'mandatory' as const,
      extension_point_ref:
        extensionPointByMethod.get(step.method_id) ?? step.extension_point_ref,
      inherited_from: 'dsc-vendor-deterministic-implementation-skeleton-v1' as const,
      family_member_must_implement: true as const,
      implemented_in_this_phase: false as const,
    })),
    membership_rule:
      'every_family_member_must_bind_the_certified_vendor_reference_implementation',
    inheritance_rule: 'every_family_member_must_satisfy_all_mandatory_capabilities',
    aggregation_rule: 'all_mandatory_capabilities_supported',
    determinism_rule:
      'every_family_member_must_remain_deterministic_and_side_effect_free',
    vendor_specific_capabilities: 'forbidden',
    vendor_specific_extensions: 'forbidden',
    undeclared_capability_policy: 'reject',
    requires_gpu: false,
    performs_inference: false,
    evaluates_members_in_this_phase: false,
  };

  const vendorImplementationFamily: DirectSpatialConditioningVendorImplementationFamily =
    {
      vendor_implementation_family_id:
        'direct-spatial-conditioning-vendor-implementation-family-v1',
      phase: DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE,
      system_id: DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID,
      mode: 'design_only_vendor_implementation_family',
      target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_FAMILY_V1',
      family_id: VENDOR_IMPLEMENTATION_FAMILY_ID,
      family_version: VENDOR_IMPLEMENTATION_FAMILY_VERSION,
      family_kind: 'generic_vendor_implementation_family',
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
      family_ref: BACKEND_FAMILY_PATH,
      family_certification_ref: BACKEND_FAMILY_CERTIFICATION_PATH,
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
      implementation_family_schema,
      deterministic_family_identity,
      reference_implementation_binding,
      implementation_family_contract,
      family_members: {
        count: 0,
        entries: [],
        membership_policy:
          'vendor implementations may join this family only in a future implementation phase; none are instantiated here',
        instantiates_members_in_this_phase: false,
      },
      design_constraints: {
        family_only: true,
        read_only: true,
        vendor_neutral: true,
        reuses_certified_vendor_reference_implementation: true,
        no_actual_implementation: true,
        no_vendor_implementation: true,
        backend: 'none',
        no_backend_implementation: true,
        gpu: false,
        inference: false,
        instantiates_members_in_this_phase: false,
        modifies_existing_datasets: false,
        placeholders: false,
      },
      created_at: new Date().toISOString(),
    };

  writeJson(root, VENDOR_IMPLEMENTATION_FAMILY_PATH, vendorImplementationFamily);
  return { vendorImplementationFamily };
}
