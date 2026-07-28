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
  DSC_VENDOR_REFERENCE_PROFILE_PHASE,
  DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID,
  VENDOR_REFERENCE_PROFILE_ID,
  VENDOR_REFERENCE_PROFILE_PATH,
  VENDOR_REFERENCE_PROFILE_VERSION,
  type DirectSpatialConditioningVendorReferenceProfile,
} from './directSpatialConditioningVendorReferenceProfileBuilder.js';
import { VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceProfileCertificationBuilder.js';
import {
  DSC_VENDOR_TEMPLATE_PHASE,
  DSC_VENDOR_TEMPLATE_SYSTEM_ID,
  VENDOR_TEMPLATE_ID,
  VENDOR_TEMPLATE_PATH,
  VENDOR_TEMPLATE_VERSION,
  type DirectSpatialConditioningVendorTemplate,
} from './directSpatialConditioningVendorTemplateBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-067: Direct Spatial Conditioning vendor reference implementation.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines the first reference vendor
 * implementation as a design declaration over the certified PHASE-065 generic
 * Vendor Template (whose PASS target is the certification reused here) and the
 * certified PHASE-063 Vendor Reference Profile:
 *   - reference implementation schema,
 *   - deterministic implementation identity,
 *   - certified Vendor Template binding, and
 *   - reference implementation profile.
 *
 * Declares a reference implementation only. Implements no method, fills no
 * extension point, performs no GPU or inference work, and modifies no dataset.
 * The certified Vendor Template and Vendor Reference Profile are reused by
 * exact reference.
 */

export const DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE = 'PHASE-DSC-067' as const;
export const DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_V1' as const;

export const VENDOR_REFERENCE_IMPLEMENTATION_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_REFERENCE_IMPLEMENTATION_PATH =
  `${VENDOR_REFERENCE_IMPLEMENTATION_ROOT}/direct-spatial-conditioning-vendor-reference-implementation-v1.json` as const;

/** Opaque deterministic identity of the first reference vendor implementation. */
export const VENDOR_REFERENCE_IMPLEMENTATION_ID =
  'dsc-vendor-reference-implementation-v1' as const;
export const VENDOR_REFERENCE_IMPLEMENTATION_VERSION = '1.0' as const;

/**
 * PHASE-065 certified the generic Vendor Template through its PASS target. The
 * template artifact is reused by exact path; no builder is invoked and nothing
 * is recalculated.
 */
export const VENDOR_TEMPLATE_CERTIFIED_TARGET =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_TEMPLATE_V1' as const;

export interface ReferenceImplementationSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface ReferenceImplementationSchema {
  schema_id: 'dsc-vendor-reference-implementation-schema-v1';
  description: string;
  encoding: 'application/json';
  implementation_id_policy: 'opaque_implementation_id_no_vendor_binding';
  template_ref: typeof VENDOR_TEMPLATE_ID;
  profile_ref: typeof VENDOR_REFERENCE_PROFILE_ID;
  required_fields: ReferenceImplementationSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicImplementationIdentity {
  identity_id: 'dsc-vendor-reference-implementation-deterministic-identity-v1';
  description: string;
  implementation_id: typeof VENDOR_REFERENCE_IMPLEMENTATION_ID;
  implementation_version: typeof VENDOR_REFERENCE_IMPLEMENTATION_VERSION;
  identity_policy: 'opaque_implementation_id_no_vendor_binding';
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
  vendor_interface_version: 'v1';
  declared_spatial_frame: typeof SPATIAL_FRAME.frame_id;
  declared_adapted_input_shape: 'dsc_adapted_conditioning_input_v1';
  declared_channels: ConditioningChannelId[];
}

export interface TemplateBindingExtensionPoint {
  extension_point_id: string;
  target_method_id: string;
  adopted: true;
  filled_in_this_phase: false;
}

export interface VendorTemplateBinding {
  binding_id: 'dsc-vendor-reference-implementation-template-binding-v1';
  description: string;
  template_ref: string;
  template_id: typeof VENDOR_TEMPLATE_ID;
  template_version: typeof VENDOR_TEMPLATE_VERSION;
  template_phase: typeof DSC_VENDOR_TEMPLATE_PHASE;
  template_system_id: typeof DSC_VENDOR_TEMPLATE_SYSTEM_ID;
  certified_target: typeof VENDOR_TEMPLATE_CERTIFIED_TARGET;
  binding_mode: 'exact_reuse';
  skeleton_ref: 'dsc-vendor-deterministic-implementation-skeleton-v1';
  extension_points_ref: 'dsc-vendor-template-extension-points-v1';
  validation_template_ref: 'dsc-vendor-template-validation-template-v1';
  extension_points_adopted: TemplateBindingExtensionPoint[];
  fills_extension_points_in_this_phase: false;
  implements_skeleton_in_this_phase: false;
}

export interface ReferenceImplementationStep {
  step_id: string;
  order: number;
  method_id: string;
  signature: string;
  extension_point_ref: string;
  coverage_state: 'declared_not_implemented';
  side_effects: 'none';
  deterministic: true;
  requires_gpu: false;
  performs_inference: false;
  implemented_in_this_phase: false;
}

export interface ReferenceImplementationCapabilityEntry {
  capability_id: string;
  declared_state: 'supported';
  inherited_from: typeof VENDOR_REFERENCE_PROFILE_ID;
  source_ref: string;
  deterministic: true;
  implemented_in_this_phase: false;
}

export interface ReferenceImplementationProfile {
  implementation_profile_id: 'dsc-vendor-reference-implementation-profile-v1';
  description: string;
  vendor_reference_profile_ref: string;
  vendor_reference_profile_id: typeof VENDOR_REFERENCE_PROFILE_ID;
  vendor_reference_profile_version: typeof VENDOR_REFERENCE_PROFILE_VERSION;
  vendor_reference_profile_phase: typeof DSC_VENDOR_REFERENCE_PROFILE_PHASE;
  vendor_reference_profile_system_id: typeof DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID;
  profile_certification_ref: string;
  capability_profile_ref: 'dsc-vendor-reference-capability-profile-v1';
  binding_mode: 'exact_reuse';
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  required_channels: ConditioningChannelId[];
  purity: 'deterministic_pure_function_per_step';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  step_order: 'fixed_declared_order';
  steps: ReferenceImplementationStep[];
  capability_entries: ReferenceImplementationCapabilityEntry[];
  methods_required: string[];
  inherits_capability_declarations: true;
  undeclared_capability_policy: 'reject';
  vendor_specific_extensions: 'forbidden';
  requires_gpu: false;
  performs_inference: false;
  implements_methods_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorReferenceImplementation {
  vendor_reference_implementation_id: string;
  phase: typeof DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE;
  system_id: typeof DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID;
  mode: 'design_only_vendor_reference_implementation';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_V1';
  implementation_id: typeof VENDOR_REFERENCE_IMPLEMENTATION_ID;
  implementation_version: typeof VENDOR_REFERENCE_IMPLEMENTATION_VERSION;
  implementation_kind: 'reference_vendor_implementation';
  template_ref: string;
  template_certified_target: typeof VENDOR_TEMPLATE_CERTIFIED_TARGET;
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
  reference_implementation_schema: ReferenceImplementationSchema;
  deterministic_implementation_identity: DeterministicImplementationIdentity;
  vendor_template_binding: VendorTemplateBinding;
  reference_implementation_profile: ReferenceImplementationProfile;
  implemented_vendors: {
    count: 0;
    entries: [];
    implementation_policy: string;
    implements_vendors_in_this_phase: false;
  };
  design_constraints: {
    reference_implementation_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_template: true;
    reuses_certified_vendor_reference_profile: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    implements_vendors_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral first DSC reference vendor
 * implementation. Reuses the certified PHASE-065 Vendor Template and certified
 * PHASE-063 Vendor Reference Profile by exact reference; writes only the
 * reference implementation artifact. No vendor method is implemented, no
 * extension point is filled, and no upstream artifact is modified.
 */
export function buildDirectSpatialConditioningVendorReferenceImplementation(
  projectRoot?: string
): {
  vendorReferenceImplementation: DirectSpatialConditioningVendorReferenceImplementation;
} {
  const root = resolveProjectRoot(projectRoot);

  const profileCertification = readJson<{
    certified?: boolean;
    certified_system?: string;
  }>(root, VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH);
  if (profileCertification.certified !== true) {
    throw new Error('PHASE-064 vendor reference profile is not certified');
  }
  if (
    profileCertification.certified_system !==
    'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_V1'
  ) {
    throw new Error('PHASE-064 certification does not cover the vendor reference profile');
  }

  const template = readJson<DirectSpatialConditioningVendorTemplate>(
    root,
    VENDOR_TEMPLATE_PATH
  );
  if (
    template.phase !== DSC_VENDOR_TEMPLATE_PHASE ||
    template.system_id !== DSC_VENDOR_TEMPLATE_SYSTEM_ID
  ) {
    throw new Error('PHASE-065 vendor template is missing or incompatible');
  }
  if (template.target !== VENDOR_TEMPLATE_CERTIFIED_TARGET) {
    throw new Error('Vendor template is not certified with the PASS target');
  }
  if (template.template_id !== VENDOR_TEMPLATE_ID) {
    throw new Error('Vendor template identity drifted');
  }
  if (template.template_version !== VENDOR_TEMPLATE_VERSION) {
    throw new Error('Vendor template version drifted');
  }
  if (!template.design_constraints.vendor_neutral) {
    throw new Error('Vendor template must remain vendor neutral');
  }
  if (!template.design_constraints.reuses_certified_vendor_reference_profile) {
    throw new Error('Vendor template must reuse the certified vendor reference profile');
  }
  if (template.templated_vendors.count !== 0) {
    throw new Error('PHASE-065 must not have templated vendors in this design stack');
  }
  if (template.profile_ref !== VENDOR_REFERENCE_PROFILE_PATH) {
    throw new Error('Vendor template profile ref drifted');
  }
  if (template.profile_certification_ref !== VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH) {
    throw new Error('Vendor template profile certification ref drifted');
  }
  if (
    JSON.stringify(template.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor template channels do not match foundation channels');
  }
  if (JSON.stringify(template.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
    throw new Error('Vendor template sources_supported drifted from the certified corpus');
  }
  if (template.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor template spatial frame drifted');
  }
  if (
    template.capability_set_id !== CAPABILITY_SET_ID ||
    template.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor template capability set identity drifted');
  }

  const referenceProfile = readJson<DirectSpatialConditioningVendorReferenceProfile>(
    root,
    VENDOR_REFERENCE_PROFILE_PATH
  );
  if (
    referenceProfile.phase !== DSC_VENDOR_REFERENCE_PROFILE_PHASE ||
    referenceProfile.system_id !== DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID
  ) {
    throw new Error('PHASE-063 vendor reference profile is missing or incompatible');
  }
  if (referenceProfile.vendor_profile_id !== VENDOR_REFERENCE_PROFILE_ID) {
    throw new Error('Vendor reference profile identity drifted');
  }
  if (referenceProfile.vendor_profile_version !== VENDOR_REFERENCE_PROFILE_VERSION) {
    throw new Error('Vendor reference profile version drifted');
  }
  if (!referenceProfile.design_constraints.vendor_neutral) {
    throw new Error('Vendor reference profile must remain vendor neutral');
  }
  if (referenceProfile.bound_vendors.count !== 0) {
    throw new Error('PHASE-063 must not have bound vendors in this design stack');
  }
  if (
    JSON.stringify(referenceProfile.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor reference profile channels do not match foundation channels');
  }
  if (referenceProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor reference profile spatial frame drifted');
  }
  if (
    referenceProfile.capability_set_id !== CAPABILITY_SET_ID ||
    referenceProfile.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor reference profile capability set identity drifted');
  }

  const skeleton = template.deterministic_implementation_skeleton;
  const extensionPoints = template.extension_points;
  const capabilityProfile = referenceProfile.reference_vendor_capability_profile;

  if (skeleton.steps.length !== extensionPoints.points.length) {
    throw new Error('Vendor template skeleton and extension point sets are inconsistent');
  }
  if (
    JSON.stringify(skeleton.steps.map((step) => step.method_id)) !==
    JSON.stringify(capabilityProfile.methods_required)
  ) {
    throw new Error(
      'Vendor template skeleton methods drifted from the reference capability profile'
    );
  }

  const reference_implementation_schema: ReferenceImplementationSchema = {
    schema_id: 'dsc-vendor-reference-implementation-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning reference vendor implementation. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A reference implementation binds the certified generic Vendor Template and certified Vendor Reference Profile without implementing any vendor method.',
    encoding: 'application/json',
    implementation_id_policy: 'opaque_implementation_id_no_vendor_binding',
    template_ref: VENDOR_TEMPLATE_ID,
    profile_ref: VENDOR_REFERENCE_PROFILE_ID,
    required_fields: [
      {
        field: 'implementation_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'implementation_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor implementation version string',
      },
      {
        field: 'implementation_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'must equal reference_vendor_implementation for the first reference implementation',
      },
      {
        field: 'template_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the certified vendor template ${VENDOR_TEMPLATE_ID}`,
      },
      {
        field: 'profile_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the certified vendor reference profile ${VENDOR_REFERENCE_PROFILE_ID}`,
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
        field: 'deterministic_implementation_identity',
        type: 'dsc-vendor-reference-implementation-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_template_binding',
        type: 'dsc-vendor-reference-implementation-template-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the certified generic Vendor Template without filling extension points',
      },
      {
        field: 'reference_implementation_profile',
        type: 'dsc-vendor-reference-implementation-profile-v1',
        required: true,
        nullable: false,
        constraint:
          'declares one step per template skeleton step and inherits every certified capability declaration without implementing any method',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_implementation_identity: DeterministicImplementationIdentity = {
    identity_id: 'dsc-vendor-reference-implementation-deterministic-identity-v1',
    description:
      'Deterministic identity of the first reference vendor implementation. The implementation_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    implementation_id: VENDOR_REFERENCE_IMPLEMENTATION_ID,
    implementation_version: VENDOR_REFERENCE_IMPLEMENTATION_VERSION,
    identity_policy: 'opaque_implementation_id_no_vendor_binding',
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
    vendor_interface_version: 'v1',
    declared_spatial_frame: SPATIAL_FRAME.frame_id,
    declared_adapted_input_shape: 'dsc_adapted_conditioning_input_v1',
    declared_channels: [...CONDITIONING_CHANNEL_IDS],
  };

  const vendor_template_binding: VendorTemplateBinding = {
    binding_id: 'dsc-vendor-reference-implementation-template-binding-v1',
    description:
      'Exact binding of the certified PHASE-065 generic Vendor Template. The reference implementation adopts the deterministic skeleton and closed extension point set without implementing any step or filling any extension point.',
    template_ref: VENDOR_TEMPLATE_PATH,
    template_id: VENDOR_TEMPLATE_ID,
    template_version: VENDOR_TEMPLATE_VERSION,
    template_phase: DSC_VENDOR_TEMPLATE_PHASE,
    template_system_id: DSC_VENDOR_TEMPLATE_SYSTEM_ID,
    certified_target: VENDOR_TEMPLATE_CERTIFIED_TARGET,
    binding_mode: 'exact_reuse',
    skeleton_ref: 'dsc-vendor-deterministic-implementation-skeleton-v1',
    extension_points_ref: 'dsc-vendor-template-extension-points-v1',
    validation_template_ref: 'dsc-vendor-template-validation-template-v1',
    extension_points_adopted: extensionPoints.points.map((point) => ({
      extension_point_id: point.extension_point_id,
      target_method_id: point.target_method_id,
      adopted: true as const,
      filled_in_this_phase: false as const,
    })),
    fills_extension_points_in_this_phase: false,
    implements_skeleton_in_this_phase: false,
  };

  const reference_implementation_profile: ReferenceImplementationProfile = {
    implementation_profile_id: 'dsc-vendor-reference-implementation-profile-v1',
    description:
      'Reference implementation profile derived deterministically from the certified Vendor Template skeleton and the certified reference vendor capability profile. Every step is declared and left unimplemented; every certified capability declaration is inherited unchanged.',
    vendor_reference_profile_ref: VENDOR_REFERENCE_PROFILE_PATH,
    vendor_reference_profile_id: VENDOR_REFERENCE_PROFILE_ID,
    vendor_reference_profile_version: VENDOR_REFERENCE_PROFILE_VERSION,
    vendor_reference_profile_phase: DSC_VENDOR_REFERENCE_PROFILE_PHASE,
    vendor_reference_profile_system_id: DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID,
    profile_certification_ref: VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
    capability_profile_ref: 'dsc-vendor-reference-capability-profile-v1',
    binding_mode: 'exact_reuse',
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    purity: 'deterministic_pure_function_per_step',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    step_order: 'fixed_declared_order',
    steps: skeleton.steps.map((step) => ({
      step_id: step.step_id,
      order: step.order,
      method_id: step.method_id,
      signature: step.signature,
      extension_point_ref: step.extension_point_ref,
      coverage_state: 'declared_not_implemented' as const,
      side_effects: 'none' as const,
      deterministic: true as const,
      requires_gpu: false as const,
      performs_inference: false as const,
      implemented_in_this_phase: false as const,
    })),
    capability_entries: capabilityProfile.entries.map((entry) => ({
      capability_id: entry.capability_id,
      declared_state: 'supported' as const,
      inherited_from: VENDOR_REFERENCE_PROFILE_ID,
      source_ref: `${VENDOR_REFERENCE_PROFILE_PATH}#reference_vendor_capability_profile.entries`,
      deterministic: true as const,
      implemented_in_this_phase: false as const,
    })),
    methods_required: [...capabilityProfile.methods_required],
    inherits_capability_declarations: true,
    undeclared_capability_policy: 'reject',
    vendor_specific_extensions: 'forbidden',
    requires_gpu: false,
    performs_inference: false,
    implements_methods_in_this_phase: false,
  };

  const vendorReferenceImplementation: DirectSpatialConditioningVendorReferenceImplementation =
    {
      vendor_reference_implementation_id:
        'direct-spatial-conditioning-vendor-reference-implementation-v1',
      phase: DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE,
      system_id: DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID,
      mode: 'design_only_vendor_reference_implementation',
      target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_V1',
      implementation_id: VENDOR_REFERENCE_IMPLEMENTATION_ID,
      implementation_version: VENDOR_REFERENCE_IMPLEMENTATION_VERSION,
      implementation_kind: 'reference_vendor_implementation',
      template_ref: VENDOR_TEMPLATE_PATH,
      template_certified_target: VENDOR_TEMPLATE_CERTIFIED_TARGET,
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
      reference_implementation_schema,
      deterministic_implementation_identity,
      vendor_template_binding,
      reference_implementation_profile,
      implemented_vendors: {
        count: 0,
        entries: [],
        implementation_policy:
          'the reference vendor implementation is declared as a design binding only; vendor methods are not implemented in this phase',
        implements_vendors_in_this_phase: false,
      },
      design_constraints: {
        reference_implementation_only: true,
        read_only: true,
        vendor_neutral: true,
        reuses_certified_vendor_template: true,
        reuses_certified_vendor_reference_profile: true,
        no_actual_implementation: true,
        no_vendor_implementation: true,
        backend: 'none',
        no_backend_implementation: true,
        gpu: false,
        inference: false,
        implements_vendors_in_this_phase: false,
        modifies_existing_datasets: false,
        placeholders: false,
      },
      created_at: new Date().toISOString(),
    };

  writeJson(root, VENDOR_REFERENCE_IMPLEMENTATION_PATH, vendorReferenceImplementation);
  return { vendorReferenceImplementation };
}
