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
} from './directSpatialConditioningBackendAdapterFoundationBuilder.js';
import {
  BACKEND_CAPABILITY_REGISTRY_PATH,
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
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
  BACKEND_PROFILE_ID,
  BACKEND_PROFILE_PATH,
  BACKEND_PROFILE_VERSION,
  DSC_BACKEND_PROFILE_PHASE,
  DSC_BACKEND_PROFILE_SYSTEM_ID,
  type DirectSpatialConditioningBackendProfile,
} from './directSpatialConditioningBackendProfileBuilder.js';
import {
  BACKEND_PROFILE_CERTIFICATION_PATH,
} from './directSpatialConditioningBackendProfileCertificationBuilder.js';
import {
  BACKEND_TEMPLATE_ID,
  BACKEND_TEMPLATE_PATH,
  BACKEND_TEMPLATE_VERSION,
  DSC_BACKEND_TEMPLATE_PHASE,
  DSC_BACKEND_TEMPLATE_SYSTEM_ID,
  type DirectSpatialConditioningBackendTemplate,
} from './directSpatialConditioningBackendTemplateBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-051: Direct Spatial Conditioning reference backend.
 *
 * DESIGN ONLY / READ-ONLY / BACKEND AGNOSTIC. Defines the first concrete
 * reference backend as a design declaration over the certified PHASE-049
 * generic template and certified PHASE-047 backend profile:
 *   - reference backend schema,
 *   - deterministic backend identity,
 *   - generic template binding, and
 *   - certified profile binding.
 *
 * Declares a reference backend only. Implements no method, fills no extension
 * point, performs no GPU or inference work, and modifies no dataset. The
 * certified template and certified profile are reused by exact reference.
 */

export const DSC_REFERENCE_BACKEND_PHASE = 'PHASE-DSC-051' as const;
export const DSC_REFERENCE_BACKEND_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_REFERENCE_BACKEND_V1' as const;

export const REFERENCE_BACKEND_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const REFERENCE_BACKEND_PATH =
  `${REFERENCE_BACKEND_ROOT}/direct-spatial-conditioning-reference-backend-v1.json` as const;

/** Opaque deterministic identity of the first reference backend. */
export const REFERENCE_BACKEND_ID = 'dsc-reference-backend-v1' as const;
export const REFERENCE_BACKEND_VERSION = '1.0' as const;

/**
 * PHASE-050 certified the generic template. The certification artifact is
 * reused by exact path; no builder is invoked and nothing is recalculated.
 */
export const BACKEND_TEMPLATE_CERTIFICATION_PATH =
  'exports/direct_spatial_conditioning_backend_certification/v1/direct-spatial-conditioning-backend-template-certification-v1.json' as const;

export interface ReferenceBackendSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface ReferenceBackendSchema {
  schema_id: 'dsc-reference-backend-schema-v1';
  description: string;
  encoding: 'application/json';
  backend_id_policy: 'opaque_backend_id_no_vendor_binding';
  template_ref: typeof BACKEND_TEMPLATE_ID;
  profile_ref: typeof BACKEND_PROFILE_ID;
  required_fields: ReferenceBackendSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicBackendIdentity {
  identity_id: 'dsc-reference-backend-deterministic-identity-v1';
  description: string;
  backend_id: typeof REFERENCE_BACKEND_ID;
  backend_version: typeof REFERENCE_BACKEND_VERSION;
  identity_policy: 'opaque_backend_id_no_vendor_binding';
  derivation: 'literal_constant_declared_at_design_time';
  purity: 'deterministic_pure_constant';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  vendor_binding: 'none';
  framework_binding: 'none';
  device_binding: 'none';
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  adapter_interface_version: 'v1';
  declared_spatial_frame: typeof SPATIAL_FRAME.frame_id;
  declared_adapted_input_shape: 'dsc_adapted_conditioning_input_v1';
  declared_channels: ConditioningChannelId[];
}

export interface TemplateBinding {
  binding_id: 'dsc-reference-backend-template-binding-v1';
  description: string;
  template_ref: string;
  template_id: typeof BACKEND_TEMPLATE_ID;
  template_version: typeof BACKEND_TEMPLATE_VERSION;
  template_phase: typeof DSC_BACKEND_TEMPLATE_PHASE;
  template_system_id: typeof DSC_BACKEND_TEMPLATE_SYSTEM_ID;
  template_certification_ref: string;
  binding_mode: 'exact_reuse';
  skeleton_ref: 'dsc-backend-deterministic-implementation-skeleton-v1';
  extension_points_ref: 'dsc-backend-template-extension-points-v1';
  validation_template_ref: 'dsc-backend-template-validation-template-v1';
  fills_extension_points_in_this_phase: false;
  implements_skeleton_in_this_phase: false;
}

export interface ProfileBinding {
  binding_id: 'dsc-reference-backend-profile-binding-v1';
  description: string;
  profile_ref: string;
  profile_id: typeof BACKEND_PROFILE_ID;
  profile_version: typeof BACKEND_PROFILE_VERSION;
  profile_phase: typeof DSC_BACKEND_PROFILE_PHASE;
  profile_system_id: typeof DSC_BACKEND_PROFILE_SYSTEM_ID;
  profile_certification_ref: string;
  binding_mode: 'exact_reuse';
  capability_mapping_ref: 'dsc-backend-profile-deterministic-capability-mapping-v1';
  adapter_configuration_ref: 'dsc-backend-profile-adapter-configuration-v1';
  profile_validation_ref: 'dsc-backend-profile-validation-v1';
  inherits_capability_declarations: true;
  binds_profile_in_this_phase: true;
  implements_profile_in_this_phase: false;
}

export interface DirectSpatialConditioningReferenceBackend {
  reference_backend_id: string;
  phase: typeof DSC_REFERENCE_BACKEND_PHASE;
  system_id: typeof DSC_REFERENCE_BACKEND_SYSTEM_ID;
  mode: 'design_only_reference_backend';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_REFERENCE_BACKEND_V1';
  backend_id: typeof REFERENCE_BACKEND_ID;
  backend_version: typeof REFERENCE_BACKEND_VERSION;
  backend_kind: 'reference_backend';
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
  reference_backend_schema: ReferenceBackendSchema;
  deterministic_backend_identity: DeterministicBackendIdentity;
  template_binding: TemplateBinding;
  profile_binding: ProfileBinding;
  implemented_backends: {
    count: 0;
    entries: [];
    implementation_policy: string;
    implements_backends_in_this_phase: false;
  };
  design_constraints: {
    reference_backend_only: true;
    read_only: true;
    backend_agnostic: true;
    reuses_backend_template: true;
    reuses_certified_profile: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    implements_backends_in_this_phase: false;
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
 * Build the design-only, read-only first DSC reference backend. Reuses the
 * certified PHASE-049 template and certified PHASE-047 profile by exact
 * reference; writes only the reference backend artifact. No backend method is
 * implemented, no extension point is filled, and no upstream artifact is
 * modified.
 */
export function buildDirectSpatialConditioningReferenceBackend(
  projectRoot?: string
): { referenceBackend: DirectSpatialConditioningReferenceBackend } {
  const root = resolveProjectRoot(projectRoot);

  const templateCertification = readJson<{
    certified?: boolean;
    certified_system?: string;
  }>(root, BACKEND_TEMPLATE_CERTIFICATION_PATH);
  if (templateCertification.certified !== true) {
    throw new Error('PHASE-050 backend template is not certified');
  }
  if (
    templateCertification.certified_system !==
    'DIRECT_SPATIAL_CONDITIONING_BACKEND_TEMPLATE_V1'
  ) {
    throw new Error('PHASE-050 certification does not cover the backend template');
  }

  const profileCertification = readJson<{
    certified?: boolean;
    certified_system?: string;
  }>(root, BACKEND_PROFILE_CERTIFICATION_PATH);
  if (profileCertification.certified !== true) {
    throw new Error('PHASE-048 backend profile is not certified');
  }
  if (
    profileCertification.certified_system !==
    'DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_V1'
  ) {
    throw new Error('PHASE-048 certification does not cover the backend profile');
  }

  const template = readJson<DirectSpatialConditioningBackendTemplate>(
    root,
    BACKEND_TEMPLATE_PATH
  );
  if (
    template.phase !== DSC_BACKEND_TEMPLATE_PHASE ||
    template.system_id !== DSC_BACKEND_TEMPLATE_SYSTEM_ID
  ) {
    throw new Error('PHASE-049 backend template is missing or incompatible');
  }
  if (template.template_id !== BACKEND_TEMPLATE_ID) {
    throw new Error('Backend template identity drifted');
  }
  if (template.template_version !== BACKEND_TEMPLATE_VERSION) {
    throw new Error('Backend template version drifted');
  }
  if (!template.design_constraints.backend_agnostic) {
    throw new Error('Backend template must remain backend agnostic');
  }
  if (!template.design_constraints.reuses_certified_profile) {
    throw new Error('Backend template must reuse the certified profile');
  }
  if (template.templated_backends.count !== 0) {
    throw new Error('PHASE-049 must not have templated backends in this design stack');
  }
  if (template.profile_ref !== BACKEND_PROFILE_PATH) {
    throw new Error('Backend template profile ref drifted');
  }
  if (
    JSON.stringify(template.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Backend template channels do not match foundation channels');
  }
  if (JSON.stringify(template.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
    throw new Error('Backend template sources_supported drifted from the certified corpus');
  }
  if (template.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Backend template spatial frame drifted');
  }
  if (
    template.capability_set_id !== CAPABILITY_SET_ID ||
    template.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Backend template capability set identity drifted');
  }

  const profile = readJson<DirectSpatialConditioningBackendProfile>(
    root,
    BACKEND_PROFILE_PATH
  );
  if (
    profile.phase !== DSC_BACKEND_PROFILE_PHASE ||
    profile.system_id !== DSC_BACKEND_PROFILE_SYSTEM_ID
  ) {
    throw new Error('PHASE-047 backend profile is missing or incompatible');
  }
  if (profile.profile_id !== BACKEND_PROFILE_ID) {
    throw new Error('Backend profile identity drifted');
  }
  if (profile.profile_version !== BACKEND_PROFILE_VERSION) {
    throw new Error('Backend profile version drifted');
  }
  if (!profile.design_constraints.backend_agnostic) {
    throw new Error('Backend profile must remain backend agnostic');
  }
  if (profile.bound_backends.count !== 0) {
    throw new Error('PHASE-047 must not have bound backends in this design stack');
  }
  if (
    JSON.stringify(profile.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Backend profile channels do not match foundation channels');
  }
  if (profile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Backend profile spatial frame drifted');
  }
  if (
    profile.capability_set_id !== CAPABILITY_SET_ID ||
    profile.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Backend profile capability set identity drifted');
  }

  const reference_backend_schema: ReferenceBackendSchema = {
    schema_id: 'dsc-reference-backend-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning reference backend. Identity is opaque; no vendor, framework, or device binding is expressed. A reference backend binds the certified generic template and certified profile without implementing adapter methods.',
    encoding: 'application/json',
    backend_id_policy: 'opaque_backend_id_no_vendor_binding',
    template_ref: BACKEND_TEMPLATE_ID,
    profile_ref: BACKEND_PROFILE_ID,
    required_fields: [
      {
        field: 'backend_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor, framework, or device semantics',
      },
      {
        field: 'backend_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor backend version string',
      },
      {
        field: 'backend_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal reference_backend for the first concrete backend',
      },
      {
        field: 'template_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the certified template ${BACKEND_TEMPLATE_ID}`,
      },
      {
        field: 'profile_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the certified profile ${BACKEND_PROFILE_ID}`,
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
        field: 'deterministic_backend_identity',
        type: 'dsc-reference-backend-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor, framework, or device dependence',
      },
      {
        field: 'template_binding',
        type: 'dsc-reference-backend-template-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the certified generic template without filling extension points',
      },
      {
        field: 'profile_binding',
        type: 'dsc-reference-backend-profile-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the certified backend profile without implementing the profile',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_backend_identity: DeterministicBackendIdentity = {
    identity_id: 'dsc-reference-backend-deterministic-identity-v1',
    description:
      'Deterministic identity of the first reference backend. The backend_id is a literal design-time constant with no seed, time, randomness, vendor, framework, or device dependence.',
    backend_id: REFERENCE_BACKEND_ID,
    backend_version: REFERENCE_BACKEND_VERSION,
    identity_policy: 'opaque_backend_id_no_vendor_binding',
    derivation: 'literal_constant_declared_at_design_time',
    purity: 'deterministic_pure_constant',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    vendor_binding: 'none',
    framework_binding: 'none',
    device_binding: 'none',
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    adapter_interface_version: 'v1',
    declared_spatial_frame: SPATIAL_FRAME.frame_id,
    declared_adapted_input_shape: 'dsc_adapted_conditioning_input_v1',
    declared_channels: [...CONDITIONING_CHANNEL_IDS],
  };

  const template_binding: TemplateBinding = {
    binding_id: 'dsc-reference-backend-template-binding-v1',
    description:
      'Exact binding of the certified PHASE-049 generic backend template. The reference backend adopts the deterministic skeleton and closed extension point set without implementing any step or filling any extension point.',
    template_ref: BACKEND_TEMPLATE_PATH,
    template_id: BACKEND_TEMPLATE_ID,
    template_version: BACKEND_TEMPLATE_VERSION,
    template_phase: DSC_BACKEND_TEMPLATE_PHASE,
    template_system_id: DSC_BACKEND_TEMPLATE_SYSTEM_ID,
    template_certification_ref: BACKEND_TEMPLATE_CERTIFICATION_PATH,
    binding_mode: 'exact_reuse',
    skeleton_ref: 'dsc-backend-deterministic-implementation-skeleton-v1',
    extension_points_ref: 'dsc-backend-template-extension-points-v1',
    validation_template_ref: 'dsc-backend-template-validation-template-v1',
    fills_extension_points_in_this_phase: false,
    implements_skeleton_in_this_phase: false,
  };

  const profile_binding: ProfileBinding = {
    binding_id: 'dsc-reference-backend-profile-binding-v1',
    description:
      'Exact binding of the certified PHASE-047 backend profile. The reference backend inherits the deterministic capability mapping and adapter configuration without implementing the profile or binding a live backend.',
    profile_ref: BACKEND_PROFILE_PATH,
    profile_id: BACKEND_PROFILE_ID,
    profile_version: BACKEND_PROFILE_VERSION,
    profile_phase: DSC_BACKEND_PROFILE_PHASE,
    profile_system_id: DSC_BACKEND_PROFILE_SYSTEM_ID,
    profile_certification_ref: BACKEND_PROFILE_CERTIFICATION_PATH,
    binding_mode: 'exact_reuse',
    capability_mapping_ref: 'dsc-backend-profile-deterministic-capability-mapping-v1',
    adapter_configuration_ref: 'dsc-backend-profile-adapter-configuration-v1',
    profile_validation_ref: 'dsc-backend-profile-validation-v1',
    inherits_capability_declarations: true,
    binds_profile_in_this_phase: true,
    implements_profile_in_this_phase: false,
  };

  const referenceBackend: DirectSpatialConditioningReferenceBackend = {
    reference_backend_id: 'direct-spatial-conditioning-reference-backend-v1',
    phase: DSC_REFERENCE_BACKEND_PHASE,
    system_id: DSC_REFERENCE_BACKEND_SYSTEM_ID,
    mode: 'design_only_reference_backend',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_REFERENCE_BACKEND_V1',
    backend_id: REFERENCE_BACKEND_ID,
    backend_version: REFERENCE_BACKEND_VERSION,
    backend_kind: 'reference_backend',
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
    reference_backend_schema,
    deterministic_backend_identity,
    template_binding,
    profile_binding,
    implemented_backends: {
      count: 0,
      entries: [],
      implementation_policy:
        'the reference backend is declared as a design binding only; adapter methods are not implemented in this phase',
      implements_backends_in_this_phase: false,
    },
    design_constraints: {
      reference_backend_only: true,
      read_only: true,
      backend_agnostic: true,
      reuses_backend_template: true,
      reuses_certified_profile: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      implements_backends_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, REFERENCE_BACKEND_PATH, referenceBackend);
  return { referenceBackend };
}
