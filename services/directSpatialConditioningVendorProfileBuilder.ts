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
} from './directSpatialConditioningBackendImplementationSpecBuilder.js';
import {
  BACKEND_DESIGN_CERTIFICATION_PATH,
} from './directSpatialConditioningBackendDesignCertificationBuilder.js';
import {
  BACKEND_PROFILE_PATH,
} from './directSpatialConditioningBackendProfileBuilder.js';
import {
  BACKEND_PROFILE_CERTIFICATION_PATH,
} from './directSpatialConditioningBackendProfileCertificationBuilder.js';
import {
  BACKEND_TEMPLATE_PATH,
} from './directSpatialConditioningBackendTemplateBuilder.js';
import {
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_PATH,
} from './directSpatialConditioningReferenceBackendBuilder.js';
import {
  BACKEND_FAMILY_ID,
  BACKEND_FAMILY_PATH,
  BACKEND_FAMILY_VERSION,
  DSC_BACKEND_FAMILY_PHASE,
  DSC_BACKEND_FAMILY_SYSTEM_ID,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  type DirectSpatialConditioningBackendFamily,
} from './directSpatialConditioningBackendFamilyBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-055: Direct Spatial Conditioning generic vendor profile.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines the generic vendor profile
 * over the certified PHASE-053 backend family:
 *   - vendor profile schema,
 *   - deterministic vendor profile identity,
 *   - certified backend family binding, and
 *   - vendor capability interface.
 *
 * Declares a vendor-neutral profile only. Implements no vendor, binds no
 * vendor name, performs no GPU or inference work, and modifies no dataset.
 * The certified backend family is reused by exact reference.
 */

export const DSC_VENDOR_PROFILE_PHASE = 'PHASE-DSC-055' as const;
export const DSC_VENDOR_PROFILE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_PROFILE_V1' as const;

export const VENDOR_PROFILE_ROOT = 'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_PROFILE_PATH =
  `${VENDOR_PROFILE_ROOT}/direct-spatial-conditioning-vendor-profile-v1.json` as const;

export const VENDOR_PROFILE_ID = 'dsc-vendor-profile-generic-v1' as const;
export const VENDOR_PROFILE_VERSION = '1.0' as const;

/**
 * PHASE-054 certified the backend family. The certification artifact is reused
 * by exact path; no builder is invoked and nothing is recalculated.
 */
export const BACKEND_FAMILY_CERTIFICATION_PATH =
  'exports/direct_spatial_conditioning_backend_certification/v1/direct-spatial-conditioning-backend-family-certification-v1.json' as const;

export interface VendorProfileSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorProfileSchema {
  schema_id: 'dsc-vendor-profile-schema-v1';
  description: string;
  encoding: 'application/json';
  vendor_profile_id_policy: 'opaque_vendor_profile_id_no_vendor_binding';
  family_ref: typeof BACKEND_FAMILY_ID;
  required_fields: VendorProfileSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicVendorProfileIdentity {
  identity_id: 'dsc-vendor-profile-deterministic-identity-v1';
  description: string;
  vendor_profile_id: typeof VENDOR_PROFILE_ID;
  vendor_profile_version: typeof VENDOR_PROFILE_VERSION;
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

export interface BackendFamilyBinding {
  binding_id: 'dsc-vendor-profile-backend-family-binding-v1';
  description: string;
  family_ref: string;
  family_id: typeof BACKEND_FAMILY_ID;
  family_version: typeof BACKEND_FAMILY_VERSION;
  family_phase: typeof DSC_BACKEND_FAMILY_PHASE;
  family_system_id: typeof DSC_BACKEND_FAMILY_SYSTEM_ID;
  family_certification_ref: string;
  binding_mode: 'exact_reuse';
  role: 'vendor_profile_family_anchor';
  reference_backend_ref: string;
  family_capability_contract_ref: 'dsc-backend-family-capability-contract-v1';
  instantiates_vendors_in_this_phase: false;
  implements_family_in_this_phase: false;
}

export interface VendorCapabilityMethod {
  method_id: string;
  signature: string;
  source_interface: 'dsc-backend-adapter-interface-v1';
  abstract: true;
  vendor_must_implement: true;
  requires_gpu: false;
  performs_inference: false;
  implemented_in_this_phase: false;
}

export interface VendorCapabilityDeclaration {
  capability_id: string;
  requirement: 'mandatory';
  declared_state_required: 'supported';
  inherited_from: 'dsc-backend-family-capability-contract-v1';
  vendor_must_declare: true;
}

export interface VendorCapabilityInterface {
  interface_id: 'dsc-vendor-capability-interface-v1';
  description: string;
  adapter_interface_ref: 'dsc-backend-adapter-interface-v1';
  adapter_foundation_ref: string;
  family_capability_contract_ref: 'dsc-backend-family-capability-contract-v1';
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  required_channels: ConditioningChannelId[];
  methods: VendorCapabilityMethod[];
  required_capability_declarations: VendorCapabilityDeclaration[];
  vendor_specific_extensions: 'forbidden';
  requires_gpu: false;
  performs_inference: false;
  implements_interface_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorProfile {
  vendor_profile_artifact_id: string;
  phase: typeof DSC_VENDOR_PROFILE_PHASE;
  system_id: typeof DSC_VENDOR_PROFILE_SYSTEM_ID;
  mode: 'design_only_vendor_profile';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_PROFILE_V1';
  vendor_profile_id: typeof VENDOR_PROFILE_ID;
  vendor_profile_version: typeof VENDOR_PROFILE_VERSION;
  vendor_profile_kind: 'generic_vendor_profile';
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
  vendor_profile_schema: VendorProfileSchema;
  deterministic_vendor_profile_identity: DeterministicVendorProfileIdentity;
  backend_family_binding: BackendFamilyBinding;
  vendor_capability_interface: VendorCapabilityInterface;
  bound_vendors: {
    count: 0;
    entries: [];
    binding_policy: string;
    binds_vendors_in_this_phase: false;
  };
  design_constraints: {
    vendor_profile_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_backend_family: true;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor profile. Reuses
 * the certified PHASE-053 backend family by exact reference; writes only the
 * vendor profile artifact. No vendor is implemented, no vendor name is bound,
 * and no upstream artifact is modified.
 */
export function buildDirectSpatialConditioningVendorProfile(
  projectRoot?: string
): { vendorProfile: DirectSpatialConditioningVendorProfile } {
  const root = resolveProjectRoot(projectRoot);

  const familyCertification = readJson<{
    certified?: boolean;
    certified_system?: string;
  }>(root, BACKEND_FAMILY_CERTIFICATION_PATH);
  if (familyCertification.certified !== true) {
    throw new Error('PHASE-054 backend family is not certified');
  }
  if (
    familyCertification.certified_system !==
    'DIRECT_SPATIAL_CONDITIONING_BACKEND_FAMILY_V1'
  ) {
    throw new Error('PHASE-054 certification does not cover the backend family');
  }

  const backendFamily = readJson<DirectSpatialConditioningBackendFamily>(
    root,
    BACKEND_FAMILY_PATH
  );
  if (
    backendFamily.phase !== DSC_BACKEND_FAMILY_PHASE ||
    backendFamily.system_id !== DSC_BACKEND_FAMILY_SYSTEM_ID
  ) {
    throw new Error('PHASE-053 backend family is missing or incompatible');
  }
  if (backendFamily.family_id !== BACKEND_FAMILY_ID) {
    throw new Error('Backend family identity drifted');
  }
  if (backendFamily.family_version !== BACKEND_FAMILY_VERSION) {
    throw new Error('Backend family version drifted');
  }
  if (!backendFamily.design_constraints.backend_agnostic) {
    throw new Error('Backend family must remain backend agnostic');
  }
  if (!backendFamily.design_constraints.reuses_certified_reference_backend) {
    throw new Error('Backend family must reuse the certified reference backend');
  }
  if (!backendFamily.design_constraints.no_vendor_specific_implementation) {
    throw new Error('Backend family must forbid vendor-specific implementation');
  }
  if (backendFamily.family_members.count !== 0) {
    throw new Error('PHASE-053 must not have instantiated family members');
  }
  if (backendFamily.reference_backend_ref !== REFERENCE_BACKEND_PATH) {
    throw new Error('Backend family reference backend ref drifted');
  }
  if (
    JSON.stringify(backendFamily.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Backend family channels do not match foundation channels');
  }
  if (
    JSON.stringify(backendFamily.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Backend family sources_supported drifted from the certified corpus');
  }
  if (backendFamily.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Backend family spatial frame drifted');
  }
  if (
    backendFamily.capability_set_id !== CAPABILITY_SET_ID ||
    backendFamily.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Backend family capability set identity drifted');
  }

  const familyCapabilityIds =
    backendFamily.family_capability_contract.required_capabilities.map(
      (capability) => capability.capability_id
    );

  const capabilityRegistry = readJson<DirectSpatialConditioningBackendCapabilityRegistry>(
    root,
    BACKEND_CAPABILITY_REGISTRY_PATH
  );
  const registeredCapabilityIds =
    capabilityRegistry.capability_schema.registered_capability_ids;
  if (JSON.stringify(familyCapabilityIds) !== JSON.stringify(registeredCapabilityIds)) {
    throw new Error('Family capability contract / registry capability id drift');
  }

  const adapterFoundation = readJson<DirectSpatialConditioningBackendAdapterFoundation>(
    root,
    BACKEND_ADAPTER_FOUNDATION_PATH
  );
  const foundationMethods = adapterFoundation.backend_interface.methods;
  if (foundationMethods.length !== 4) {
    throw new Error('Adapter foundation must expose exactly four abstract methods');
  }

  const vendor_profile_schema: VendorProfileSchema = {
    schema_id: 'dsc-vendor-profile-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning generic vendor profile. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A vendor profile binds the certified backend family and publishes a vendor capability interface without implementing any vendor.',
    encoding: 'application/json',
    vendor_profile_id_policy: 'opaque_vendor_profile_id_no_vendor_binding',
    family_ref: BACKEND_FAMILY_ID,
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
        constraint: 'must equal generic_vendor_profile',
      },
      {
        field: 'family_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the certified backend family ${BACKEND_FAMILY_ID}`,
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
        field: 'deterministic_vendor_profile_identity',
        type: 'dsc-vendor-profile-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'backend_family_binding',
        type: 'dsc-vendor-profile-backend-family-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the certified backend family as the vendor profile family anchor',
      },
      {
        field: 'vendor_capability_interface',
        type: 'dsc-vendor-capability-interface-v1',
        required: true,
        nullable: false,
        constraint:
          'must mirror the four abstract adapter methods and every mandatory family capability; vendor-specific extensions are forbidden',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_vendor_profile_identity: DeterministicVendorProfileIdentity = {
    identity_id: 'dsc-vendor-profile-deterministic-identity-v1',
    description:
      'Deterministic identity of the generic vendor profile. The vendor_profile_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    vendor_profile_id: VENDOR_PROFILE_ID,
    vendor_profile_version: VENDOR_PROFILE_VERSION,
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

  const backend_family_binding: BackendFamilyBinding = {
    binding_id: 'dsc-vendor-profile-backend-family-binding-v1',
    description:
      'Exact binding of the certified PHASE-053 backend family as the vendor profile family anchor. The vendor profile inherits the family capability contract and reference backend archetype without instantiating vendors or implementing the family.',
    family_ref: BACKEND_FAMILY_PATH,
    family_id: BACKEND_FAMILY_ID,
    family_version: BACKEND_FAMILY_VERSION,
    family_phase: DSC_BACKEND_FAMILY_PHASE,
    family_system_id: DSC_BACKEND_FAMILY_SYSTEM_ID,
    family_certification_ref: BACKEND_FAMILY_CERTIFICATION_PATH,
    binding_mode: 'exact_reuse',
    role: 'vendor_profile_family_anchor',
    reference_backend_ref: REFERENCE_BACKEND_PATH,
    family_capability_contract_ref: 'dsc-backend-family-capability-contract-v1',
    instantiates_vendors_in_this_phase: false,
    implements_family_in_this_phase: false,
  };

  const vendor_capability_interface: VendorCapabilityInterface = {
    interface_id: 'dsc-vendor-capability-interface-v1',
    description:
      'Vendor-neutral capability interface a future vendor must satisfy. Methods are reused verbatim from the PHASE-039 adapter foundation; required declarations are inherited from the family capability contract. No vendor-specific extension is permitted and nothing is implemented in this phase.',
    adapter_interface_ref: 'dsc-backend-adapter-interface-v1',
    adapter_foundation_ref: BACKEND_ADAPTER_FOUNDATION_PATH,
    family_capability_contract_ref: 'dsc-backend-family-capability-contract-v1',
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    methods: foundationMethods.map((method) => ({
      method_id: method.method_id,
      signature: method.signature,
      source_interface: 'dsc-backend-adapter-interface-v1' as const,
      abstract: true as const,
      vendor_must_implement: true as const,
      requires_gpu: false as const,
      performs_inference: false as const,
      implemented_in_this_phase: false as const,
    })),
    required_capability_declarations: familyCapabilityIds.map((capability_id) => ({
      capability_id,
      requirement: 'mandatory' as const,
      declared_state_required: 'supported' as const,
      inherited_from: 'dsc-backend-family-capability-contract-v1' as const,
      vendor_must_declare: true as const,
    })),
    vendor_specific_extensions: 'forbidden',
    requires_gpu: false,
    performs_inference: false,
    implements_interface_in_this_phase: false,
  };

  const vendorProfile: DirectSpatialConditioningVendorProfile = {
    vendor_profile_artifact_id: 'direct-spatial-conditioning-vendor-profile-v1',
    phase: DSC_VENDOR_PROFILE_PHASE,
    system_id: DSC_VENDOR_PROFILE_SYSTEM_ID,
    mode: 'design_only_vendor_profile',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_PROFILE_V1',
    vendor_profile_id: VENDOR_PROFILE_ID,
    vendor_profile_version: VENDOR_PROFILE_VERSION,
    vendor_profile_kind: 'generic_vendor_profile',
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
    vendor_profile_schema,
    deterministic_vendor_profile_identity,
    backend_family_binding,
    vendor_capability_interface,
    bound_vendors: {
      count: 0,
      entries: [],
      binding_policy:
        'vendors may bind to this profile only in a future design or implementation phase; none are bound here',
      binds_vendors_in_this_phase: false,
    },
    design_constraints: {
      vendor_profile_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_backend_family: true,
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

  writeJson(root, VENDOR_PROFILE_PATH, vendorProfile);
  return { vendorProfile };
}
