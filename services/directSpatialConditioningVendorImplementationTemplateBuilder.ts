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
  type DirectSpatialConditioningVendorProfile,
} from './directSpatialConditioningVendorProfileBuilder.js';
import { VENDOR_REGISTRY_PATH } from './directSpatialConditioningVendorRegistryBuilder.js';
import { VENDOR_COMPATIBILITY_PATH } from './directSpatialConditioningVendorCompatibilityBuilder.js';
import { VENDOR_ROUTER_PATH } from './directSpatialConditioningVendorRouterBuilder.js';
import { VENDOR_EXECUTION_CONTRACT_PATH } from './directSpatialConditioningVendorExecutionContractBuilder.js';
import { VENDOR_IMPLEMENTATION_SPEC_PATH } from './directSpatialConditioningVendorImplementationSpecBuilder.js';
import { VENDOR_REFERENCE_PROFILE_PATH } from './directSpatialConditioningVendorReferenceProfileBuilder.js';
import { VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceProfileCertificationBuilder.js';
import { VENDOR_TEMPLATE_PATH } from './directSpatialConditioningVendorTemplateBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_PATH } from './directSpatialConditioningVendorReferenceImplementationBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceImplementationCertificationBuilder.js';
import { VENDOR_IMPLEMENTATION_FAMILY_PATH } from './directSpatialConditioningVendorImplementationFamilyBuilder.js';
import { VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH } from './directSpatialConditioningVendorImplementationFamilyCertificationBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE,
  DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_PROFILE_ID,
  VENDOR_IMPLEMENTATION_PROFILE_PATH,
  VENDOR_IMPLEMENTATION_PROFILE_VERSION,
  type DirectSpatialConditioningVendorImplementationProfile,
} from './directSpatialConditioningVendorImplementationProfileBuilder.js';
import { VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningVendorImplementationProfileCertificationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-073: Direct Spatial Conditioning vendor implementation template.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines the generic template a
 * concrete vendor implementation is written against, over the certified
 * PHASE-071 Vendor Implementation Profile and PHASE-072 certification:
 *   - implementation template schema,
 *   - deterministic template identity,
 *   - certified Vendor Implementation Profile binding,
 *   - deterministic implementation skeleton, and
 *   - extension points.
 *
 * Declares a template only. Implements no vendor, fills no extension point,
 * performs no GPU or inference work, and modifies no dataset. The certified
 * Vendor Implementation Profile is reused by exact reference; its capability
 * profile methods and extension points are adopted without being filled.
 */

export const DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE = 'PHASE-DSC-073' as const;
export const DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_V1' as const;

export const VENDOR_IMPLEMENTATION_TEMPLATE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_IMPLEMENTATION_TEMPLATE_PATH =
  `${VENDOR_IMPLEMENTATION_TEMPLATE_ROOT}/direct-spatial-conditioning-vendor-implementation-template-v1.json` as const;

/** Opaque deterministic identity of the generic vendor implementation template. */
export const VENDOR_IMPLEMENTATION_TEMPLATE_ID =
  'dsc-vendor-implementation-template-generic-v1' as const;
export const VENDOR_IMPLEMENTATION_TEMPLATE_VERSION = '1.0' as const;

export interface TemplateSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorImplementationTemplateSchema {
  schema_id: 'dsc-vendor-implementation-template-schema-v1';
  description: string;
  encoding: 'application/json';
  template_id_policy: 'opaque_template_id_no_vendor_binding';
  profile_ref: typeof VENDOR_IMPLEMENTATION_PROFILE_ID;
  required_fields: TemplateSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicTemplateIdentity {
  identity_id: 'dsc-vendor-implementation-template-deterministic-identity-v1';
  description: string;
  template_id: typeof VENDOR_IMPLEMENTATION_TEMPLATE_ID;
  template_version: typeof VENDOR_IMPLEMENTATION_TEMPLATE_VERSION;
  identity_policy: 'opaque_template_id_no_vendor_binding';
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

export interface VendorImplementationProfileBinding {
  binding_id: 'dsc-vendor-implementation-template-profile-binding-v1';
  description: string;
  profile_ref: string;
  profile_id: typeof VENDOR_IMPLEMENTATION_PROFILE_ID;
  profile_version: typeof VENDOR_IMPLEMENTATION_PROFILE_VERSION;
  profile_phase: typeof DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE;
  profile_system_id: typeof DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID;
  profile_certification_ref: string;
  binding_mode: 'exact_reuse';
  role: 'implementation_conformance_template';
  capability_profile_ref: 'dsc-vendor-implementation-capability-profile-v1';
  family_ref: string;
  family_certification_ref: string;
  fills_extension_points_in_this_phase: false;
  implements_skeleton_in_this_phase: false;
}

export interface SkeletonStep {
  step_id: string;
  order: number;
  method_id: string;
  signature: string;
  description: string;
  reads: string[];
  emits: string;
  side_effects: 'none';
  deterministic: true;
  extension_point_ref: string;
  inherited_from: 'dsc-vendor-implementation-capability-profile-v1';
  implemented_in_this_phase: false;
}

export interface DeterministicImplementationSkeleton {
  skeleton_id: 'dsc-vendor-implementation-deterministic-skeleton-v1';
  description: string;
  capability_profile_ref: 'dsc-vendor-implementation-capability-profile-v1';
  vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1';
  purity: 'deterministic_pure_function_per_step';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  step_order: 'fixed_declared_order';
  steps: SkeletonStep[];
  same_inputs_same_outcome: true;
  requires_gpu: false;
  performs_inference: false;
  implements_steps_in_this_phase: false;
}

export interface ExtensionPoint {
  extension_point_id: string;
  target_method_id: string;
  category: 'capability_declaration' | 'compatibility' | 'binding' | 'lifecycle';
  description: string;
  contract: string;
  inherited_from: 'dsc-vendor-implementation-capability-profile-v1';
  must_remain_deterministic: true;
  may_require_gpu: false;
  may_perform_inference: false;
  may_modify_certified_artifacts: false;
  filled_in_this_phase: false;
}

export interface ExtensionPoints {
  extension_points_id: 'dsc-vendor-implementation-template-extension-points-v1';
  description: string;
  closed_set: true;
  points: ExtensionPoint[];
  unknown_extension_policy: 'reject_undeclared_extension_point';
  fills_extension_points_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorImplementationTemplate {
  vendor_implementation_template_id: string;
  phase: typeof DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE;
  system_id: typeof DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID;
  mode: 'design_only_vendor_implementation_template';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_V1';
  template_id: typeof VENDOR_IMPLEMENTATION_TEMPLATE_ID;
  template_version: typeof VENDOR_IMPLEMENTATION_TEMPLATE_VERSION;
  template_kind: 'generic_vendor_implementation_template';
  implementation_profile_ref: string;
  implementation_profile_certification_ref: string;
  family_ref: string;
  family_certification_ref: string;
  reference_implementation_ref: string;
  reference_implementation_certification_ref: string;
  vendor_template_ref: string;
  vendor_reference_profile_ref: string;
  vendor_reference_profile_certification_ref: string;
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
  implementation_template_schema: VendorImplementationTemplateSchema;
  deterministic_template_identity: DeterministicTemplateIdentity;
  vendor_implementation_profile_binding: VendorImplementationProfileBinding;
  deterministic_implementation_skeleton: DeterministicImplementationSkeleton;
  extension_points: ExtensionPoints;
  templated_implementations: {
    count: 0;
    entries: [];
    templating_policy: string;
    templates_implementations_in_this_phase: false;
  };
  design_constraints: {
    template_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_implementation_profile: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    templates_implementations_in_this_phase: false;
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

/** Extension point metadata for each abstract vendor capability method, in method order. */
const EXTENSION_POINT_SPECS: Array<{
  method_id: string;
  extension_point_id: string;
  category: ExtensionPoint['category'];
  description: string;
  contract: string;
  signature: string;
  reads: string[];
  emits: string;
}> = [
  {
    method_id: 'describe_capabilities',
    extension_point_id: 'EXT_VENDOR_DECLARE_CAPABILITIES',
    category: 'capability_declaration',
    description:
      'Concrete vendor implementation publishes its capability declarations for the registered capability set.',
    contract:
      'must emit one declaration per registered capability id in registry order and declare no unregistered id',
    signature: 'describe_capabilities() -> dsc_vendor_capability_declaration_set_v1',
    reads: ['capability_registry', 'capability_set'],
    emits: 'dsc_vendor_capability_declaration_set_v1',
  },
  {
    method_id: 'check_compatibility',
    extension_point_id: 'EXT_VENDOR_RESOLVE_COMPATIBILITY',
    category: 'compatibility',
    description:
      'Concrete vendor implementation resolves its descriptor against the vendor compatibility matrix rows.',
    contract:
      'must return a dsc-vendor-compatibility-report-v1 whose outcome derives only from declared capabilities and matrix rows',
    signature:
      'check_compatibility(vendor_descriptor) -> dsc_vendor_compatibility_report_v1',
    reads: ['vendor_descriptor', 'compatibility_matrix', 'capability_declarations'],
    emits: 'dsc_vendor_compatibility_report_v1',
  },
  {
    method_id: 'bind_conditioning_input',
    extension_point_id: 'EXT_VENDOR_BIND_CONDITIONING_INPUT',
    category: 'binding',
    description:
      'Concrete vendor implementation ingests the adapted conditioning input and issues an opaque binding handle.',
    contract:
      'must consume dsc_adapted_conditioning_input_v1 losslessly in the fixed channel order and mutate no certified artifact',
    signature:
      'bind_conditioning_input(dsc_adapted_conditioning_input_v1) -> dsc_vendor_binding_handle_v1',
    reads: ['dsc_adapted_conditioning_input_v1', 'spatial_frame'],
    emits: 'dsc_vendor_binding_handle_v1',
  },
  {
    method_id: 'release_conditioning_binding',
    extension_point_id: 'EXT_VENDOR_RELEASE_BINDING',
    category: 'lifecycle',
    description:
      'Concrete vendor implementation releases a previously issued conditioning binding handle.',
    contract:
      'must release the handle idempotently and leave no residual state or side effect',
    signature: 'release_conditioning_binding(dsc_vendor_binding_handle_v1) -> void',
    reads: ['dsc_vendor_binding_handle_v1'],
    emits: 'void',
  },
];

/**
 * Build the design-only, read-only, vendor-neutral generic DSC vendor
 * implementation template. Reuses the certified PHASE-071 Vendor Implementation
 * Profile by exact reference; writes only the template artifact. No vendor is
 * implemented, no extension point is filled, and no upstream artifact is
 * modified.
 */
export function buildDirectSpatialConditioningVendorImplementationTemplate(
  projectRoot?: string
): {
  vendorImplementationTemplate: DirectSpatialConditioningVendorImplementationTemplate;
} {
  const root = resolveProjectRoot(projectRoot);

  const profileCertification = readJson<{
    certified?: boolean;
    certified_system?: string;
  }>(root, VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH);
  if (profileCertification.certified !== true) {
    throw new Error('PHASE-072 vendor implementation profile is not certified');
  }
  if (
    profileCertification.certified_system !==
    'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_V1'
  ) {
    throw new Error(
      'PHASE-072 certification does not cover the vendor implementation profile'
    );
  }

  const implementationProfile =
    readJson<DirectSpatialConditioningVendorImplementationProfile>(
      root,
      VENDOR_IMPLEMENTATION_PROFILE_PATH
    );
  if (
    implementationProfile.phase !== DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE ||
    implementationProfile.system_id !== DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID
  ) {
    throw new Error(
      'PHASE-071 vendor implementation profile is missing or incompatible'
    );
  }
  if (implementationProfile.profile_id !== VENDOR_IMPLEMENTATION_PROFILE_ID) {
    throw new Error('Vendor implementation profile identity drifted');
  }
  if (implementationProfile.profile_version !== VENDOR_IMPLEMENTATION_PROFILE_VERSION) {
    throw new Error('Vendor implementation profile version drifted');
  }
  if (!implementationProfile.design_constraints.vendor_neutral) {
    throw new Error('Vendor implementation profile must remain vendor neutral');
  }
  if (
    !implementationProfile.design_constraints.reuses_certified_vendor_implementation_family
  ) {
    throw new Error(
      'Vendor implementation profile must reuse the certified vendor implementation family'
    );
  }
  if (implementationProfile.profiled_members.count !== 0) {
    throw new Error('PHASE-071 must not have profiled members');
  }
  if (
    JSON.stringify(implementationProfile.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error(
      'Vendor implementation profile channels do not match foundation channels'
    );
  }
  if (
    JSON.stringify(implementationProfile.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor implementation profile sources_supported drifted from the certified corpus'
    );
  }
  if (implementationProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor implementation profile spatial frame drifted');
  }
  if (
    implementationProfile.capability_set_id !== CAPABILITY_SET_ID ||
    implementationProfile.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor implementation profile capability set identity drifted');
  }

  const capabilityProfile = implementationProfile.implementation_capability_profile;
  if (
    capabilityProfile.capability_profile_id !==
    'dsc-vendor-implementation-capability-profile-v1'
  ) {
    throw new Error('Vendor implementation capability profile identity drifted');
  }
  if (
    JSON.stringify(capabilityProfile.methods_required) !==
    JSON.stringify(EXTENSION_POINT_SPECS.map((spec) => spec.method_id))
  ) {
    throw new Error(
      'Vendor implementation capability profile methods drifted from template steps'
    );
  }
  const profileExtensionPoints = capabilityProfile.method_entries.map(
    (entry) => entry.extension_point_ref
  );
  if (
    JSON.stringify(profileExtensionPoints) !==
    JSON.stringify(EXTENSION_POINT_SPECS.map((spec) => spec.extension_point_id))
  ) {
    throw new Error(
      'Vendor implementation capability profile extension points drifted from template'
    );
  }

  const vendorProfile = readJson<DirectSpatialConditioningVendorProfile>(
    root,
    VENDOR_PROFILE_PATH
  );
  const vendorMethodIds = vendorProfile.vendor_capability_interface.methods.map(
    (method) => method.method_id
  );
  if (
    JSON.stringify(vendorMethodIds) !==
    JSON.stringify(EXTENSION_POINT_SPECS.map((spec) => spec.method_id))
  ) {
    throw new Error(
      'Vendor capability interface methods drifted from implementation template steps'
    );
  }

  const implementation_template_schema: VendorImplementationTemplateSchema = {
    schema_id: 'dsc-vendor-implementation-template-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning generic vendor implementation template. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A template binds the certified Vendor Implementation Profile and publishes a deterministic skeleton with closed extension points, without implementing any vendor.',
    encoding: 'application/json',
    template_id_policy: 'opaque_template_id_no_vendor_binding',
    profile_ref: VENDOR_IMPLEMENTATION_PROFILE_ID,
    required_fields: [
      {
        field: 'template_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'template_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor template version string',
      },
      {
        field: 'template_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal generic_vendor_implementation_template',
      },
      {
        field: 'implementation_profile_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the certified vendor implementation profile ${VENDOR_IMPLEMENTATION_PROFILE_ID}`,
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
        field: 'deterministic_template_identity',
        type: 'dsc-vendor-implementation-template-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_implementation_profile_binding',
        type: 'dsc-vendor-implementation-template-profile-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the certified Vendor Implementation Profile as the conformance basis',
      },
      {
        field: 'deterministic_implementation_skeleton',
        type: 'dsc-vendor-implementation-deterministic-skeleton-v1',
        required: true,
        nullable: false,
        constraint:
          'must declare four fixed-order skeleton steps matching the certified capability profile methods',
      },
      {
        field: 'extension_points',
        type: 'dsc-vendor-implementation-template-extension-points-v1',
        required: true,
        nullable: false,
        constraint:
          'must declare a closed set of four extension points matching the certified capability profile; none may be filled in this phase',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_template_identity: DeterministicTemplateIdentity = {
    identity_id: 'dsc-vendor-implementation-template-deterministic-identity-v1',
    description:
      'Deterministic identity of the generic vendor implementation template. The template_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    template_id: VENDOR_IMPLEMENTATION_TEMPLATE_ID,
    template_version: VENDOR_IMPLEMENTATION_TEMPLATE_VERSION,
    identity_policy: 'opaque_template_id_no_vendor_binding',
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

  const vendor_implementation_profile_binding: VendorImplementationProfileBinding = {
    binding_id: 'dsc-vendor-implementation-template-profile-binding-v1',
    description:
      'Exact binding of the certified PHASE-071 Vendor Implementation Profile as the conformance basis. The template adopts the capability profile methods and extension points without filling any extension point or implementing any skeleton step.',
    profile_ref: VENDOR_IMPLEMENTATION_PROFILE_PATH,
    profile_id: VENDOR_IMPLEMENTATION_PROFILE_ID,
    profile_version: VENDOR_IMPLEMENTATION_PROFILE_VERSION,
    profile_phase: DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE,
    profile_system_id: DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID,
    profile_certification_ref: VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
    binding_mode: 'exact_reuse',
    role: 'implementation_conformance_template',
    capability_profile_ref: 'dsc-vendor-implementation-capability-profile-v1',
    family_ref: VENDOR_IMPLEMENTATION_FAMILY_PATH,
    family_certification_ref: VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
    fills_extension_points_in_this_phase: false,
    implements_skeleton_in_this_phase: false,
  };

  const deterministic_implementation_skeleton: DeterministicImplementationSkeleton = {
    skeleton_id: 'dsc-vendor-implementation-deterministic-skeleton-v1',
    description:
      'Fixed-order deterministic skeleton every vendor implementation written against this template must declare. Steps mirror the certified Vendor Implementation Profile capability methods exactly; none are implemented in this phase.',
    capability_profile_ref: 'dsc-vendor-implementation-capability-profile-v1',
    vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1',
    purity: 'deterministic_pure_function_per_step',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    step_order: 'fixed_declared_order',
    steps: EXTENSION_POINT_SPECS.map((spec, index) => ({
      step_id: `step_${String(index + 1).padStart(2, '0')}_${spec.method_id}`,
      order: index + 1,
      method_id: spec.method_id,
      signature: spec.signature,
      description: spec.description,
      reads: [...spec.reads],
      emits: spec.emits,
      side_effects: 'none' as const,
      deterministic: true as const,
      extension_point_ref: spec.extension_point_id,
      inherited_from: 'dsc-vendor-implementation-capability-profile-v1' as const,
      implemented_in_this_phase: false as const,
    })),
    same_inputs_same_outcome: true,
    requires_gpu: false,
    performs_inference: false,
    implements_steps_in_this_phase: false,
  };

  const extension_points: ExtensionPoints = {
    extension_points_id: 'dsc-vendor-implementation-template-extension-points-v1',
    description:
      'Closed set of extension points for the vendor implementation template. One point per skeleton step, inherited from the certified Vendor Implementation Profile capability methods. None are filled in this phase.',
    closed_set: true,
    points: EXTENSION_POINT_SPECS.map((spec) => ({
      extension_point_id: spec.extension_point_id,
      target_method_id: spec.method_id,
      category: spec.category,
      description: spec.description,
      contract: spec.contract,
      inherited_from: 'dsc-vendor-implementation-capability-profile-v1' as const,
      must_remain_deterministic: true as const,
      may_require_gpu: false as const,
      may_perform_inference: false as const,
      may_modify_certified_artifacts: false as const,
      filled_in_this_phase: false as const,
    })),
    unknown_extension_policy: 'reject_undeclared_extension_point',
    fills_extension_points_in_this_phase: false,
  };

  const vendorImplementationTemplate: DirectSpatialConditioningVendorImplementationTemplate =
    {
      vendor_implementation_template_id:
        'direct-spatial-conditioning-vendor-implementation-template-v1',
      phase: DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE,
      system_id: DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID,
      mode: 'design_only_vendor_implementation_template',
      target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_V1',
      template_id: VENDOR_IMPLEMENTATION_TEMPLATE_ID,
      template_version: VENDOR_IMPLEMENTATION_TEMPLATE_VERSION,
      template_kind: 'generic_vendor_implementation_template',
      implementation_profile_ref: VENDOR_IMPLEMENTATION_PROFILE_PATH,
      implementation_profile_certification_ref:
        VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
      family_ref: VENDOR_IMPLEMENTATION_FAMILY_PATH,
      family_certification_ref: VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
      reference_implementation_ref: VENDOR_REFERENCE_IMPLEMENTATION_PATH,
      reference_implementation_certification_ref:
        VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
      vendor_template_ref: VENDOR_TEMPLATE_PATH,
      vendor_reference_profile_ref: VENDOR_REFERENCE_PROFILE_PATH,
      vendor_reference_profile_certification_ref:
        VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
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
      implementation_template_schema,
      deterministic_template_identity,
      vendor_implementation_profile_binding,
      deterministic_implementation_skeleton,
      extension_points,
      templated_implementations: {
        count: 0,
        entries: [],
        templating_policy:
          'vendor implementations may be written against this template only in a future implementation phase; none are templated here',
        templates_implementations_in_this_phase: false,
      },
      design_constraints: {
        template_only: true,
        read_only: true,
        vendor_neutral: true,
        reuses_certified_vendor_implementation_profile: true,
        no_actual_implementation: true,
        no_vendor_implementation: true,
        backend: 'none',
        no_backend_implementation: true,
        gpu: false,
        inference: false,
        templates_implementations_in_this_phase: false,
        modifies_existing_datasets: false,
        placeholders: false,
      },
      created_at: new Date().toISOString(),
    };

  writeJson(root, VENDOR_IMPLEMENTATION_TEMPLATE_PATH, vendorImplementationTemplate);
  return { vendorImplementationTemplate };
}
