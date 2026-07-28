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
  BACKEND_PROFILE_ID,
  BACKEND_PROFILE_PATH,
} from './directSpatialConditioningBackendProfileBuilder.js';
import {
  BACKEND_PROFILE_CERTIFICATION_PATH,
} from './directSpatialConditioningBackendProfileCertificationBuilder.js';
import {
  BACKEND_TEMPLATE_ID,
  BACKEND_TEMPLATE_PATH,
} from './directSpatialConditioningBackendTemplateBuilder.js';
import {
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  DSC_REFERENCE_BACKEND_PHASE,
  DSC_REFERENCE_BACKEND_SYSTEM_ID,
  REFERENCE_BACKEND_ID,
  REFERENCE_BACKEND_PATH,
  REFERENCE_BACKEND_VERSION,
  type DirectSpatialConditioningReferenceBackend,
} from './directSpatialConditioningReferenceBackendBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-053: Direct Spatial Conditioning generic backend family.
 *
 * DESIGN ONLY / READ-ONLY / BACKEND AGNOSTIC. Defines the generic backend
 * family over the certified PHASE-051 reference backend:
 *   - backend family schema,
 *   - deterministic family identity,
 *   - certified reference backend binding, and
 *   - family capability contract.
 *
 * Declares a family only. Instantiates no family member, implements no
 * vendor-specific backend, performs no GPU or inference work, and modifies no
 * dataset. The certified reference backend is reused by exact reference.
 */

export const DSC_BACKEND_FAMILY_PHASE = 'PHASE-DSC-053' as const;
export const DSC_BACKEND_FAMILY_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_BACKEND_FAMILY_V1' as const;

export const BACKEND_FAMILY_ROOT = 'exports/direct_spatial_conditioning/v1' as const;
export const BACKEND_FAMILY_PATH =
  `${BACKEND_FAMILY_ROOT}/direct-spatial-conditioning-backend-family-v1.json` as const;

export const BACKEND_FAMILY_ID = 'dsc-backend-family-generic-v1' as const;
export const BACKEND_FAMILY_VERSION = '1.0' as const;

/**
 * PHASE-052 certified the reference backend. The certification artifact is
 * reused by exact path; no builder is invoked and nothing is recalculated.
 */
export const REFERENCE_BACKEND_CERTIFICATION_PATH =
  'exports/direct_spatial_conditioning_backend_certification/v1/direct-spatial-conditioning-reference-backend-certification-v1.json' as const;

export interface FamilySchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface BackendFamilySchema {
  schema_id: 'dsc-backend-family-schema-v1';
  description: string;
  encoding: 'application/json';
  family_id_policy: 'opaque_family_id_no_vendor_binding';
  reference_backend_ref: typeof REFERENCE_BACKEND_ID;
  required_fields: FamilySchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicFamilyIdentity {
  identity_id: 'dsc-backend-family-deterministic-identity-v1';
  description: string;
  family_id: typeof BACKEND_FAMILY_ID;
  family_version: typeof BACKEND_FAMILY_VERSION;
  identity_policy: 'opaque_family_id_no_vendor_binding';
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
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  required_channels: ConditioningChannelId[];
}

export interface ReferenceBackendBinding {
  binding_id: 'dsc-backend-family-reference-backend-binding-v1';
  description: string;
  reference_backend_ref: string;
  backend_id: typeof REFERENCE_BACKEND_ID;
  backend_version: typeof REFERENCE_BACKEND_VERSION;
  reference_backend_phase: typeof DSC_REFERENCE_BACKEND_PHASE;
  reference_backend_system_id: typeof DSC_REFERENCE_BACKEND_SYSTEM_ID;
  reference_backend_certification_ref: string;
  binding_mode: 'exact_reuse';
  role: 'family_archetype';
  template_ref: string;
  profile_ref: string;
  instantiates_members_in_this_phase: false;
  implements_reference_backend_in_this_phase: false;
}

export interface FamilyCapabilityRequirement {
  capability_id: string;
  requirement: 'mandatory';
  inherited_from: 'capability_registry.capability_schema.registered_capability_ids';
  declared_state_required: 'supported';
  family_member_must_declare: true;
}

export interface FamilyCapabilityContract {
  contract_id: 'dsc-backend-family-capability-contract-v1';
  description: string;
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  capability_contract_ref: 'dsc-backend-capability-contract-v1';
  capability_registry_ref: string;
  profile_capability_mapping_ref: 'dsc-backend-profile-deterministic-capability-mapping-v1';
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  required_channels: ConditioningChannelId[];
  required_sources: number;
  adapted_input_shape_ref: 'dsc_adapted_conditioning_input_v1';
  required_capabilities: FamilyCapabilityRequirement[];
  inheritance_rule: 'every_family_member_must_satisfy_all_mandatory_capabilities';
  aggregation_rule: 'all_mandatory_capabilities_supported';
  vendor_specific_capabilities: 'forbidden';
  requires_gpu: false;
  performs_inference: false;
  evaluates_members_in_this_phase: false;
}

export interface DirectSpatialConditioningBackendFamily {
  backend_family_id: string;
  phase: typeof DSC_BACKEND_FAMILY_PHASE;
  system_id: typeof DSC_BACKEND_FAMILY_SYSTEM_ID;
  mode: 'design_only_family';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_FAMILY_V1';
  family_id: typeof BACKEND_FAMILY_ID;
  family_version: typeof BACKEND_FAMILY_VERSION;
  family_kind: 'generic_backend_family';
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
  backend_family_schema: BackendFamilySchema;
  deterministic_family_identity: DeterministicFamilyIdentity;
  reference_backend_binding: ReferenceBackendBinding;
  family_capability_contract: FamilyCapabilityContract;
  family_members: {
    count: 0;
    entries: [];
    membership_policy: string;
    instantiates_members_in_this_phase: false;
  };
  design_constraints: {
    family_only: true;
    read_only: true;
    backend_agnostic: true;
    reuses_certified_reference_backend: true;
    no_vendor_specific_implementation: true;
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
 * Build the design-only, read-only generic DSC backend family. Reuses the
 * certified PHASE-051 reference backend by exact reference; writes only the
 * family artifact. No family member is instantiated, no vendor-specific
 * backend is implemented, and no upstream artifact is modified.
 */
export function buildDirectSpatialConditioningBackendFamily(
  projectRoot?: string
): { backendFamily: DirectSpatialConditioningBackendFamily } {
  const root = resolveProjectRoot(projectRoot);

  const referenceCertification = readJson<{
    certified?: boolean;
    certified_system?: string;
  }>(root, REFERENCE_BACKEND_CERTIFICATION_PATH);
  if (referenceCertification.certified !== true) {
    throw new Error('PHASE-052 reference backend is not certified');
  }
  if (
    referenceCertification.certified_system !==
    'DIRECT_SPATIAL_CONDITIONING_REFERENCE_BACKEND_V1'
  ) {
    throw new Error('PHASE-052 certification does not cover the reference backend');
  }

  const referenceBackend = readJson<DirectSpatialConditioningReferenceBackend>(
    root,
    REFERENCE_BACKEND_PATH
  );
  if (
    referenceBackend.phase !== DSC_REFERENCE_BACKEND_PHASE ||
    referenceBackend.system_id !== DSC_REFERENCE_BACKEND_SYSTEM_ID
  ) {
    throw new Error('PHASE-051 reference backend is missing or incompatible');
  }
  if (referenceBackend.backend_id !== REFERENCE_BACKEND_ID) {
    throw new Error('Reference backend identity drifted');
  }
  if (referenceBackend.backend_version !== REFERENCE_BACKEND_VERSION) {
    throw new Error('Reference backend version drifted');
  }
  if (!referenceBackend.design_constraints.backend_agnostic) {
    throw new Error('Reference backend must remain backend agnostic');
  }
  if (!referenceBackend.design_constraints.reuses_backend_template) {
    throw new Error('Reference backend must reuse the backend template');
  }
  if (!referenceBackend.design_constraints.reuses_certified_profile) {
    throw new Error('Reference backend must reuse the certified profile');
  }
  if (referenceBackend.implemented_backends.count !== 0) {
    throw new Error('PHASE-051 must not have implemented backends in this design stack');
  }
  if (referenceBackend.template_ref !== BACKEND_TEMPLATE_PATH) {
    throw new Error('Reference backend template ref drifted');
  }
  if (referenceBackend.profile_ref !== BACKEND_PROFILE_PATH) {
    throw new Error('Reference backend profile ref drifted');
  }
  if (
    JSON.stringify(referenceBackend.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Reference backend channels do not match foundation channels');
  }
  if (
    JSON.stringify(referenceBackend.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Reference backend sources_supported drifted from the certified corpus'
    );
  }
  if (referenceBackend.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Reference backend spatial frame drifted');
  }
  if (
    referenceBackend.capability_set_id !== CAPABILITY_SET_ID ||
    referenceBackend.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Reference backend capability set identity drifted');
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
  const foundationCapabilityIds =
    adapterFoundation.capability_contract.required_capabilities.map(
      (capability) => capability.capability_id
    );
  if (JSON.stringify(foundationCapabilityIds) !== JSON.stringify(registeredCapabilityIds)) {
    throw new Error('Capability registry / foundation capability id drift');
  }

  const backend_family_schema: BackendFamilySchema = {
    schema_id: 'dsc-backend-family-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning generic backend family. Identity is opaque; no vendor, framework, or device binding is expressed. A family binds the certified reference backend as its archetype and publishes a family capability contract without instantiating members.',
    encoding: 'application/json',
    family_id_policy: 'opaque_family_id_no_vendor_binding',
    reference_backend_ref: REFERENCE_BACKEND_ID,
    required_fields: [
      {
        field: 'family_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor, framework, or device semantics',
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
        constraint: 'must equal generic_backend_family',
      },
      {
        field: 'reference_backend_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the certified reference backend ${REFERENCE_BACKEND_ID}`,
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
        type: 'dsc-backend-family-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor, framework, or device dependence',
      },
      {
        field: 'reference_backend_binding',
        type: 'dsc-backend-family-reference-backend-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the certified reference backend as the family archetype',
      },
      {
        field: 'family_capability_contract',
        type: 'dsc-backend-family-capability-contract-v1',
        required: true,
        nullable: false,
        constraint:
          'must cover every registered mandatory capability and forbid vendor-specific capabilities',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_family_identity: DeterministicFamilyIdentity = {
    identity_id: 'dsc-backend-family-deterministic-identity-v1',
    description:
      'Deterministic identity of the generic backend family. The family_id is a literal design-time constant with no seed, time, randomness, vendor, framework, or device dependence.',
    family_id: BACKEND_FAMILY_ID,
    family_version: BACKEND_FAMILY_VERSION,
    identity_policy: 'opaque_family_id_no_vendor_binding',
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
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    required_channels: [...CONDITIONING_CHANNEL_IDS],
  };

  const reference_backend_binding: ReferenceBackendBinding = {
    binding_id: 'dsc-backend-family-reference-backend-binding-v1',
    description:
      'Exact binding of the certified PHASE-051 reference backend as the family archetype. The family inherits the reference backend template and profile bindings without instantiating members or implementing the reference backend.',
    reference_backend_ref: REFERENCE_BACKEND_PATH,
    backend_id: REFERENCE_BACKEND_ID,
    backend_version: REFERENCE_BACKEND_VERSION,
    reference_backend_phase: DSC_REFERENCE_BACKEND_PHASE,
    reference_backend_system_id: DSC_REFERENCE_BACKEND_SYSTEM_ID,
    reference_backend_certification_ref: REFERENCE_BACKEND_CERTIFICATION_PATH,
    binding_mode: 'exact_reuse',
    role: 'family_archetype',
    template_ref: BACKEND_TEMPLATE_PATH,
    profile_ref: BACKEND_PROFILE_PATH,
    instantiates_members_in_this_phase: false,
    implements_reference_backend_in_this_phase: false,
  };

  const family_capability_contract: FamilyCapabilityContract = {
    contract_id: 'dsc-backend-family-capability-contract-v1',
    description:
      'Capability contract every member of the generic backend family must satisfy. Inherited from the frozen capability registry and the certified profile capability mapping. Vendor-specific capabilities are forbidden; no member evaluation occurs in this phase.',
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    capability_contract_ref: 'dsc-backend-capability-contract-v1',
    capability_registry_ref: BACKEND_CAPABILITY_REGISTRY_PATH,
    profile_capability_mapping_ref:
      'dsc-backend-profile-deterministic-capability-mapping-v1',
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    required_sources: SOURCE_IDS.length,
    adapted_input_shape_ref: 'dsc_adapted_conditioning_input_v1',
    required_capabilities: registeredCapabilityIds.map((capability_id) => ({
      capability_id,
      requirement: 'mandatory' as const,
      inherited_from:
        'capability_registry.capability_schema.registered_capability_ids' as const,
      declared_state_required: 'supported' as const,
      family_member_must_declare: true as const,
    })),
    inheritance_rule: 'every_family_member_must_satisfy_all_mandatory_capabilities',
    aggregation_rule: 'all_mandatory_capabilities_supported',
    vendor_specific_capabilities: 'forbidden',
    requires_gpu: false,
    performs_inference: false,
    evaluates_members_in_this_phase: false,
  };

  const backendFamily: DirectSpatialConditioningBackendFamily = {
    backend_family_id: 'direct-spatial-conditioning-backend-family-v1',
    phase: DSC_BACKEND_FAMILY_PHASE,
    system_id: DSC_BACKEND_FAMILY_SYSTEM_ID,
    mode: 'design_only_family',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_FAMILY_V1',
    family_id: BACKEND_FAMILY_ID,
    family_version: BACKEND_FAMILY_VERSION,
    family_kind: 'generic_backend_family',
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
    backend_family_schema,
    deterministic_family_identity,
    reference_backend_binding,
    family_capability_contract,
    family_members: {
      count: 0,
      entries: [],
      membership_policy:
        'family members may join only in a future design or implementation phase; none are instantiated here beyond the reference backend archetype binding',
      instantiates_members_in_this_phase: false,
    },
    design_constraints: {
      family_only: true,
      read_only: true,
      backend_agnostic: true,
      reuses_certified_reference_backend: true,
      no_vendor_specific_implementation: true,
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

  writeJson(root, BACKEND_FAMILY_PATH, backendFamily);
  return { backendFamily };
}
