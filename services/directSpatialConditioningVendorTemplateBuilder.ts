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
import {
  VENDOR_IMPLEMENTATION_SPEC_PATH,
  type DirectSpatialConditioningVendorImplementationSpec,
} from './directSpatialConditioningVendorImplementationSpecBuilder.js';
import {
  DSC_VENDOR_REFERENCE_PROFILE_PHASE,
  DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID,
  VENDOR_REFERENCE_PROFILE_ID,
  VENDOR_REFERENCE_PROFILE_PATH,
  VENDOR_REFERENCE_PROFILE_VERSION,
  type DirectSpatialConditioningVendorReferenceProfile,
} from './directSpatialConditioningVendorReferenceProfileBuilder.js';
import { VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceProfileCertificationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-065: Direct Spatial Conditioning generic vendor template.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines the generic template a
 * concrete vendor is written against, over the certified PHASE-063 Vendor
 * Reference Profile and PHASE-064 profile certification:
 *   - vendor template schema,
 *   - deterministic implementation skeleton,
 *   - extension points, and
 *   - validation template.
 *
 * Declares a template only. Implements no vendor, fills no extension point,
 * performs no GPU or inference work, and modifies no dataset. The certified
 * Vendor Reference Profile is reused by exact reference.
 */

export const DSC_VENDOR_TEMPLATE_PHASE = 'PHASE-DSC-065' as const;
export const DSC_VENDOR_TEMPLATE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_TEMPLATE_V1' as const;

export const VENDOR_TEMPLATE_ROOT = 'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_TEMPLATE_PATH =
  `${VENDOR_TEMPLATE_ROOT}/direct-spatial-conditioning-vendor-template-v1.json` as const;

export const VENDOR_TEMPLATE_ID = 'dsc-vendor-template-generic-v1' as const;
export const VENDOR_TEMPLATE_VERSION = '1.0' as const;

export interface TemplateSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorTemplateSchema {
  schema_id: 'dsc-vendor-template-schema-v1';
  description: string;
  encoding: 'application/json';
  template_id_policy: 'opaque_template_id_no_vendor_binding';
  profile_ref: typeof VENDOR_REFERENCE_PROFILE_ID;
  required_fields: TemplateSchemaField[];
  optional_fields: [];
  additional_fields: false;
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
  implemented_in_this_phase: false;
}

export interface DeterministicImplementationSkeleton {
  skeleton_id: 'dsc-vendor-deterministic-implementation-skeleton-v1';
  description: string;
  vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1';
  implementation_spec_ref: string;
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
  must_remain_deterministic: true;
  may_require_gpu: false;
  may_perform_inference: false;
  may_modify_certified_artifacts: false;
  filled_in_this_phase: false;
}

export interface ExtensionPoints {
  extension_points_id: 'dsc-vendor-template-extension-points-v1';
  description: string;
  closed_set: true;
  points: ExtensionPoint[];
  unknown_extension_policy: 'reject_undeclared_extension_point';
  fills_extension_points_in_this_phase: false;
}

export interface ValidationTemplateCheck {
  check_id: string;
  target: 'skeleton' | 'extension_point' | 'profile_binding' | 'constraints';
  description: string;
  evaluation: 'design_time_declaration_only';
  pass_condition: string;
  fail_code: string;
  mandatory: true;
  status_in_this_phase: 'not_evaluated';
}

export interface ValidationTemplate {
  validation_template_id: 'dsc-vendor-template-validation-template-v1';
  description: string;
  evaluation: 'collect_all_failures';
  accept_condition: 'zero failed checks';
  outcome_values: ['conforms', 'non_conforming'];
  checks: ValidationTemplateCheck[];
  profile_validation_ref: 'dsc-vendor-reference-profile-validation-v1';
  requires_all_steps_declared: true;
  requires_all_extension_points_declared: true;
  validates_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorTemplate {
  vendor_template_id: string;
  phase: typeof DSC_VENDOR_TEMPLATE_PHASE;
  system_id: typeof DSC_VENDOR_TEMPLATE_SYSTEM_ID;
  mode: 'design_only_vendor_template';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_TEMPLATE_V1';
  template_id: typeof VENDOR_TEMPLATE_ID;
  template_version: typeof VENDOR_TEMPLATE_VERSION;
  template_kind: 'generic_vendor_template';
  profile_ref: string;
  profile_phase: typeof DSC_VENDOR_REFERENCE_PROFILE_PHASE;
  profile_system_id: typeof DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID;
  profile_certification_ref: string;
  vendor_reference_profile_id: typeof VENDOR_REFERENCE_PROFILE_ID;
  vendor_reference_profile_version: typeof VENDOR_REFERENCE_PROFILE_VERSION;
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
  vendor_template_schema: VendorTemplateSchema;
  deterministic_implementation_skeleton: DeterministicImplementationSkeleton;
  extension_points: ExtensionPoints;
  validation_template: ValidationTemplate;
  templated_vendors: {
    count: 0;
    entries: [];
    templating_policy: string;
    templates_vendors_in_this_phase: false;
  };
  design_constraints: {
    template_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_reference_profile: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    templates_vendors_in_this_phase: false;
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

/** Extension point declared for each abstract vendor capability method, in method order. */
const EXTENSION_POINT_SPECS: Array<{
  method_id: string;
  extension_point_id: string;
  category: ExtensionPoint['category'];
  description: string;
  contract: string;
}> = [
  {
    method_id: 'describe_capabilities',
    extension_point_id: 'EXT_VENDOR_DECLARE_CAPABILITIES',
    category: 'capability_declaration',
    description:
      'Concrete vendor publishes its capability declarations for the registered capability set.',
    contract:
      'must emit one declaration per registered capability id in registry order and declare no unregistered id',
  },
  {
    method_id: 'check_compatibility',
    extension_point_id: 'EXT_VENDOR_RESOLVE_COMPATIBILITY',
    category: 'compatibility',
    description:
      'Concrete vendor resolves its descriptor against the vendor compatibility matrix rows.',
    contract:
      'must return a dsc-vendor-compatibility-report-v1 whose outcome derives only from declared capabilities and matrix rows',
  },
  {
    method_id: 'bind_conditioning_input',
    extension_point_id: 'EXT_VENDOR_BIND_CONDITIONING_INPUT',
    category: 'binding',
    description:
      'Concrete vendor ingests the adapted conditioning input and issues an opaque binding handle.',
    contract:
      'must consume dsc_adapted_conditioning_input_v1 losslessly in the fixed channel order and mutate no certified artifact',
  },
  {
    method_id: 'release_conditioning_binding',
    extension_point_id: 'EXT_VENDOR_RELEASE_BINDING',
    category: 'lifecycle',
    description:
      'Concrete vendor releases a previously issued conditioning binding handle.',
    contract:
      'must release the handle idempotently and leave no residual state or side effect',
  },
];

/**
 * Build the design-only, read-only generic DSC vendor template. Reuses the
 * certified PHASE-063 Vendor Reference Profile and PHASE-064 certification by
 * exact reference; writes only the template artifact. No vendor is
 * implemented, no extension point is filled, and no upstream artifact is
 * modified.
 */
export function buildDirectSpatialConditioningVendorTemplate(
  projectRoot?: string
): { vendorTemplate: DirectSpatialConditioningVendorTemplate } {
  const root = resolveProjectRoot(projectRoot);

  const profileCertification = readJson<{ certified?: boolean; certified_system?: string }>(
    root,
    VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH
  );
  if (profileCertification.certified !== true) {
    throw new Error('PHASE-064 vendor reference profile is not certified');
  }
  if (
    profileCertification.certified_system !==
    'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_V1'
  ) {
    throw new Error('PHASE-064 certification does not cover the vendor reference profile');
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
  if (referenceProfile.vendor_implementation_spec_ref !== VENDOR_IMPLEMENTATION_SPEC_PATH) {
    throw new Error('Vendor reference profile implementation spec ref drifted');
  }
  if (referenceProfile.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
    throw new Error('Vendor reference profile capability registry ref drifted');
  }
  if (referenceProfile.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
    throw new Error('Vendor reference profile adapter foundation ref drifted');
  }
  if (
    JSON.stringify(referenceProfile.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor reference profile channels do not match foundation channels');
  }
  if (
    JSON.stringify(referenceProfile.sources_supported) !== JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor reference profile sources_supported drifted from the certified corpus'
    );
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

  const implementationSpec = readJson<DirectSpatialConditioningVendorImplementationSpec>(
    root,
    VENDOR_IMPLEMENTATION_SPEC_PATH
  );
  const specMethods = implementationSpec.required_interfaces.methods;
  if (specMethods.length !== EXTENSION_POINT_SPECS.length) {
    throw new Error('Vendor implementation specification method count drifted from the template');
  }

  const vendorProfile = readJson<DirectSpatialConditioningVendorProfile>(
    root,
    VENDOR_PROFILE_PATH
  );
  const vendorMethods = vendorProfile.vendor_capability_interface.methods;
  if (
    JSON.stringify(vendorMethods.map((method) => method.method_id)) !==
    JSON.stringify(specMethods.map((method) => method.method_id))
  ) {
    throw new Error('Vendor capability interface / implementation specification method drift');
  }
  if (
    JSON.stringify(vendorMethods.map((method) => method.method_id)) !==
    JSON.stringify(EXTENSION_POINT_SPECS.map((spec) => spec.method_id))
  ) {
    throw new Error('Template steps do not mirror the vendor capability interface methods');
  }

  const adapterFoundation = readJson<DirectSpatialConditioningBackendAdapterFoundation>(
    root,
    BACKEND_ADAPTER_FOUNDATION_PATH
  );
  const foundationMethods = adapterFoundation.backend_interface.methods;
  if (
    JSON.stringify(foundationMethods.map((method) => method.method_id)) !==
    JSON.stringify(EXTENSION_POINT_SPECS.map((spec) => spec.method_id))
  ) {
    throw new Error('Adapter foundation methods drifted from vendor template steps');
  }

  const vendor_template_schema: VendorTemplateSchema = {
    schema_id: 'dsc-vendor-template-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning generic vendor template. Identity is opaque; no vendor name, framework, or device binding is expressed. Templates declare an implementation skeleton, extension points, and a validation template without implementing a vendor.',
    encoding: 'application/json',
    template_id_policy: 'opaque_template_id_no_vendor_binding',
    profile_ref: VENDOR_REFERENCE_PROFILE_ID,
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
        constraint: 'must equal generic_vendor_template',
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
        field: 'deterministic_implementation_skeleton',
        type: 'dsc-vendor-deterministic-implementation-skeleton-v1',
        required: true,
        nullable: false,
        constraint:
          'one ordered step per abstract vendor capability method with side_effects none',
      },
      {
        field: 'extension_points',
        type: 'dsc-vendor-template-extension-points-v1',
        required: true,
        nullable: false,
        constraint: 'closed set with one extension point per skeleton step',
      },
      {
        field: 'validation_template',
        type: 'dsc-vendor-template-validation-template-v1',
        required: true,
        nullable: false,
        constraint:
          'must declare mandatory conformance checks over skeleton and extension points',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const steps: SkeletonStep[] = EXTENSION_POINT_SPECS.map((spec, index) => {
    const foundationMethod = foundationMethods[index];
    const reads =
      spec.method_id === 'describe_capabilities'
        ? ['reference_vendor_capability_profile.entries']
        : spec.method_id === 'check_compatibility'
          ? [
              'vendor_capability_descriptor',
              'vendor_compatibility.compatibility_matrix',
            ]
          : spec.method_id === 'bind_conditioning_input'
            ? ['dsc_adapted_conditioning_input_v1']
            : ['conditioning_binding_handle'];
    return {
      step_id: `STEP_VENDOR_${spec.method_id.toUpperCase()}`,
      order: index + 1,
      method_id: spec.method_id,
      signature: foundationMethod.signature,
      description: spec.description,
      reads,
      emits: foundationMethod.output_ref,
      side_effects: 'none' as const,
      deterministic: true as const,
      extension_point_ref: spec.extension_point_id,
      implemented_in_this_phase: false as const,
    };
  });

  const deterministic_implementation_skeleton: DeterministicImplementationSkeleton = {
    skeleton_id: 'dsc-vendor-deterministic-implementation-skeleton-v1',
    description:
      'Ordered deterministic skeleton a concrete vendor follows. Each step mirrors one abstract PHASE-055 vendor capability method and is a pure function of its declared inputs. No step is implemented in this phase.',
    vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1',
    implementation_spec_ref: VENDOR_IMPLEMENTATION_SPEC_PATH,
    purity: 'deterministic_pure_function_per_step',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    step_order: 'fixed_declared_order',
    steps,
    same_inputs_same_outcome: true,
    requires_gpu: false,
    performs_inference: false,
    implements_steps_in_this_phase: false,
  };

  const extension_points: ExtensionPoints = {
    extension_points_id: 'dsc-vendor-template-extension-points-v1',
    description:
      'Closed set of extension points a concrete vendor fills. Every point is bound to exactly one skeleton step and inherits the deterministic constraints of the template.',
    closed_set: true,
    points: EXTENSION_POINT_SPECS.map((spec) => ({
      extension_point_id: spec.extension_point_id,
      target_method_id: spec.method_id,
      category: spec.category,
      description: spec.description,
      contract: spec.contract,
      must_remain_deterministic: true as const,
      may_require_gpu: false as const,
      may_perform_inference: false as const,
      may_modify_certified_artifacts: false as const,
      filled_in_this_phase: false as const,
    })),
    unknown_extension_policy: 'reject_undeclared_extension_point',
    fills_extension_points_in_this_phase: false,
  };

  const validation_template: ValidationTemplate = {
    validation_template_id: 'dsc-vendor-template-validation-template-v1',
    description:
      'Conformance checks a templated vendor implementation must pass. Declared only; no implementation is evaluated in this phase.',
    evaluation: 'collect_all_failures',
    accept_condition: 'zero failed checks',
    outcome_values: ['conforms', 'non_conforming'],
    checks: [
      {
        check_id: 'CHK_TEMPLATE_IDENTITY_OPAQUE',
        target: 'constraints',
        description:
          'template_id must be opaque with no vendor name, framework, or device semantics.',
        evaluation: 'design_time_declaration_only',
        pass_condition: `template_id equals ${VENDOR_TEMPLATE_ID}`,
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_IDENTITY',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_PROFILE_BINDING',
        target: 'profile_binding',
        description:
          'Template must bind the certified PHASE-063 Vendor Reference Profile by exact reference.',
        evaluation: 'design_time_declaration_only',
        pass_condition: `profile_ref equals ${VENDOR_REFERENCE_PROFILE_PATH} and the profile certification is certified`,
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_PROFILE_BINDING',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_SKELETON_STEP_COVERAGE',
        target: 'skeleton',
        description:
          'Skeleton must declare exactly one step per abstract vendor capability method in interface order.',
        evaluation: 'design_time_declaration_only',
        pass_condition:
          'skeleton step method_ids equal vendor_capability_interface.methods method_ids',
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_STEP_COVERAGE',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_SKELETON_ORDER_FIXED',
        target: 'skeleton',
        description: 'Skeleton step order must be contiguous and fixed.',
        evaluation: 'design_time_declaration_only',
        pass_condition: 'step order values equal 1..n without gaps or duplicates',
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_STEP_ORDER',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_SKELETON_SIDE_EFFECT_FREE',
        target: 'skeleton',
        description: 'Every skeleton step must declare side_effects none.',
        evaluation: 'design_time_declaration_only',
        pass_condition: 'every step.side_effects equals none',
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_SIDE_EFFECTS',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_SKELETON_DETERMINISTIC',
        target: 'skeleton',
        description:
          'Skeleton must be deterministic with no seed, time, or randomness dependence.',
        evaluation: 'design_time_declaration_only',
        pass_condition:
          'purity equals deterministic_pure_function_per_step and seed/time/randomness equal none',
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_NONDETERMINISTIC',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_EXTENSION_POINT_COVERAGE',
        target: 'extension_point',
        description:
          'Every skeleton step must reference exactly one declared extension point and vice versa.',
        evaluation: 'design_time_declaration_only',
        pass_condition:
          'step extension_point_ref values equal extension_points.points extension_point_ids',
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_EXTENSION_COVERAGE',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_EXTENSION_SET_CLOSED',
        target: 'extension_point',
        description: 'Extension point set must be closed and reject undeclared points.',
        evaluation: 'design_time_declaration_only',
        pass_condition:
          'closed_set equals true and unknown_extension_policy equals reject_undeclared_extension_point',
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_EXTENSION_OPEN',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_EXTENSION_DETERMINISM_INHERITED',
        target: 'extension_point',
        description:
          'Every extension point must inherit determinism and forbid GPU, inference, and artifact mutation.',
        evaluation: 'design_time_declaration_only',
        pass_condition:
          'must_remain_deterministic equals true and may_require_gpu, may_perform_inference, may_modify_certified_artifacts equal false',
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_EXTENSION_CONSTRAINTS',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_CHANNEL_ORDER_FOUNDATION',
        target: 'constraints',
        description: 'Template channels must match the foundation channel order.',
        evaluation: 'design_time_declaration_only',
        pass_condition: 'required_channels equals CONDITIONING_CHANNEL_IDS',
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_CHANNEL_ORDER',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_SPATIAL_FRAME_LOCKED',
        target: 'constraints',
        description: 'Template must operate exclusively in normalized_image_plane_v1.',
        evaluation: 'design_time_declaration_only',
        pass_condition: `spatial_frame_ref equals ${SPATIAL_FRAME.frame_id}`,
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_SPATIAL_FRAME',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_NO_GPU_NO_INFERENCE',
        target: 'constraints',
        description: 'Template must not require GPU or perform inference.',
        evaluation: 'design_time_declaration_only',
        pass_condition: 'requires_gpu equals false and performs_inference equals false',
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_GPU_INFERENCE',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
      {
        check_id: 'CHK_NO_VENDOR_TEMPLATED',
        target: 'constraints',
        description: 'Template must bind zero vendors in this design-only phase.',
        evaluation: 'design_time_declaration_only',
        pass_condition:
          'templated_vendors.count equals 0 and templates_vendors_in_this_phase equals false',
        fail_code: 'DSC_VENDOR_TEMPLATE_FAIL_VENDOR_TEMPLATED',
        mandatory: true,
        status_in_this_phase: 'not_evaluated',
      },
    ],
    profile_validation_ref: 'dsc-vendor-reference-profile-validation-v1',
    requires_all_steps_declared: true,
    requires_all_extension_points_declared: true,
    validates_implementations_in_this_phase: false,
  };

  const vendorTemplate: DirectSpatialConditioningVendorTemplate = {
    vendor_template_id: 'direct-spatial-conditioning-vendor-template-v1',
    phase: DSC_VENDOR_TEMPLATE_PHASE,
    system_id: DSC_VENDOR_TEMPLATE_SYSTEM_ID,
    mode: 'design_only_vendor_template',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_TEMPLATE_V1',
    template_id: VENDOR_TEMPLATE_ID,
    template_version: VENDOR_TEMPLATE_VERSION,
    template_kind: 'generic_vendor_template',
    profile_ref: VENDOR_REFERENCE_PROFILE_PATH,
    profile_phase: DSC_VENDOR_REFERENCE_PROFILE_PHASE,
    profile_system_id: DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID,
    profile_certification_ref: VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
    vendor_reference_profile_id: VENDOR_REFERENCE_PROFILE_ID,
    vendor_reference_profile_version: VENDOR_REFERENCE_PROFILE_VERSION,
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
    vendor_template_schema,
    deterministic_implementation_skeleton,
    extension_points,
    validation_template,
    templated_vendors: {
      count: 0,
      entries: [],
      templating_policy:
        'vendors may adopt this template only in a future implementation phase; none are templated here',
      templates_vendors_in_this_phase: false,
    },
    design_constraints: {
      template_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_reference_profile: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      templates_vendors_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_TEMPLATE_PATH, vendorTemplate);
  return { vendorTemplate };
}
