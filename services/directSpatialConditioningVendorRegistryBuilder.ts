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
  BACKEND_FAMILY_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
} from './directSpatialConditioningBackendFamilyBuilder.js';
import {
  BACKEND_FAMILY_CERTIFICATION_PATH,
  DSC_VENDOR_PROFILE_PHASE,
  DSC_VENDOR_PROFILE_SYSTEM_ID,
  VENDOR_PROFILE_ID,
  VENDOR_PROFILE_PATH,
  VENDOR_PROFILE_VERSION,
  type DirectSpatialConditioningVendorProfile,
} from './directSpatialConditioningVendorProfileBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-056: Direct Spatial Conditioning vendor registry.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines the vendor registry over
 * the verified PHASE-055 vendor profile:
 *   - vendor registry schema,
 *   - vendor registration record,
 *   - vendor lifecycle,
 *   - vendor deregistration policy, and
 *   - vendor validation rules.
 *
 * Declares a registry only. Registers no vendor, implements no vendor,
 * performs no GPU or inference work, and modifies no dataset. The vendor
 * profile is reused by exact reference.
 */

export const DSC_VENDOR_REGISTRY_PHASE = 'PHASE-DSC-056' as const;
export const DSC_VENDOR_REGISTRY_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_REGISTRY_V1' as const;

export const VENDOR_REGISTRY_ROOT = 'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_REGISTRY_PATH =
  `${VENDOR_REGISTRY_ROOT}/direct-spatial-conditioning-vendor-registry-v1.json` as const;

export type VendorLifecycleState =
  | 'pending'
  | 'active'
  | 'suspended'
  | 'deregistered';

export type VendorDeregistrationReason =
  | 'operator_requested'
  | 'capability_set_incompatible'
  | 'vendor_profile_revoked'
  | 'lifecycle_expired'
  | 'validation_rejected';

export interface VendorRegistrySchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRegistrySchema {
  schema_id: 'dsc-vendor-registry-schema-v1';
  description: string;
  encoding: 'application/json';
  registry_id_policy: 'opaque_registry_id_no_vendor_binding';
  vendor_profile_ref: typeof VENDOR_PROFILE_ID;
  required_fields: VendorRegistrySchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface VendorRegistrationRecordField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRegistrationRecord {
  record_schema_id: 'dsc-vendor-registration-record-v1';
  description: string;
  encoding: 'application/json';
  identity_policy: 'opaque_vendor_registration_id_no_vendor_name_binding';
  required_fields: VendorRegistrationRecordField[];
  uniqueness: {
    key: ['vendor_registration_id'];
    active_key: ['opaque_vendor_handle', 'vendor_profile_id'];
    duplicate_policy: 'reject_duplicate_active_registration';
    duplicate_code: 'DSC_VENDOR_REGISTRY_DUPLICATE_ACTIVE';
  };
  additional_fields: false;
  writes_records_in_this_phase: false;
}

export interface VendorLifecycleTransition {
  from: VendorLifecycleState;
  to: VendorLifecycleState;
  trigger: string;
  requires_vendor_profile_recheck: boolean;
  allowed: true;
}

export interface VendorLifecycle {
  lifecycle_id: 'dsc-vendor-registry-lifecycle-v1';
  description: string;
  states: VendorLifecycleState[];
  initial_state: 'pending';
  active_state: 'active';
  terminal_state: 'deregistered';
  transitions: VendorLifecycleTransition[];
  invariants: string[];
  registers_vendors_in_this_phase: false;
}

export interface VendorDeregistrationPolicy {
  policy_id: 'dsc-vendor-registry-deregistration-policy-v1';
  description: string;
  allowed_reasons: VendorDeregistrationReason[];
  effects: {
    lifecycle_state_becomes: 'deregistered';
    registration_record_retained: true;
    re_registration_policy: 'requires_new_registration_flow_and_fresh_vendor_validation';
    vendor_handles_released: true;
  };
  forbidden: string[];
  irreversible: true;
  executed_in_this_phase: false;
}

export interface VendorValidationCheck {
  check_id: string;
  description: string;
  rejection_code: string;
  mandatory: true;
  evaluation: 'design_time_declaration_only';
  status_in_this_phase: 'not_evaluated';
}

export interface VendorValidationRules {
  validation_id: 'dsc-vendor-registry-validation-rules-v1';
  description: string;
  evaluation: 'collect_all_rejections';
  accept_condition: 'zero rejection codes and vendor profile binding intact';
  outcome_values: ['accepted', 'rejected'];
  checks: VendorValidationCheck[];
  requires_vendor_profile_binding: true;
  requires_vendor_capability_interface: true;
  evaluates_vendors_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRegistry {
  vendor_registry_id: string;
  phase: typeof DSC_VENDOR_REGISTRY_PHASE;
  system_id: typeof DSC_VENDOR_REGISTRY_SYSTEM_ID;
  mode: 'design_only_vendor_registry';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REGISTRY_V1';
  vendor_profile_ref: string;
  vendor_profile_phase: typeof DSC_VENDOR_PROFILE_PHASE;
  vendor_profile_system_id: typeof DSC_VENDOR_PROFILE_SYSTEM_ID;
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
  vendor_registry_schema: VendorRegistrySchema;
  vendor_registration_record: VendorRegistrationRecord;
  vendor_lifecycle: VendorLifecycle;
  vendor_deregistration_policy: VendorDeregistrationPolicy;
  vendor_validation_rules: VendorValidationRules;
  registered_vendors: {
    count: 0;
    entries: [];
    registration_policy: string;
    registers_vendors_in_this_phase: false;
  };
  design_constraints: {
    registry_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_vendor_profile: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    registers_vendors_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const LIFECYCLE_TRANSITIONS: VendorLifecycleTransition[] = [
  {
    from: 'pending',
    to: 'active',
    trigger: 'vendor_validation_accepted',
    requires_vendor_profile_recheck: false,
    allowed: true,
  },
  {
    from: 'pending',
    to: 'deregistered',
    trigger: 'vendor_validation_rejected_or_abandoned',
    requires_vendor_profile_recheck: false,
    allowed: true,
  },
  {
    from: 'active',
    to: 'suspended',
    trigger: 'temporary_policy_hold',
    requires_vendor_profile_recheck: false,
    allowed: true,
  },
  {
    from: 'suspended',
    to: 'active',
    trigger: 'policy_hold_cleared_with_valid_vendor_profile',
    requires_vendor_profile_recheck: true,
    allowed: true,
  },
  {
    from: 'active',
    to: 'deregistered',
    trigger: 'deregistration_policy_invoked',
    requires_vendor_profile_recheck: false,
    allowed: true,
  },
  {
    from: 'suspended',
    to: 'deregistered',
    trigger: 'deregistration_policy_invoked',
    requires_vendor_profile_recheck: false,
    allowed: true,
  },
];

const VALIDATION_CHECKS: VendorValidationCheck[] = [
  {
    check_id: 'CHK_VENDOR_PROFILE_BOUND',
    description:
      'Registration must bind the verified PHASE-055 vendor profile by exact reference.',
    rejection_code: 'DSC_VENDOR_REGISTRY_FAIL_PROFILE_BINDING',
    mandatory: true,
    evaluation: 'design_time_declaration_only',
    status_in_this_phase: 'not_evaluated',
  },
  {
    check_id: 'CHK_VENDOR_IDENTITY_OPAQUE',
    description:
      'vendor_registration_id and opaque_vendor_handle must carry no vendor name, framework, or device semantics.',
    rejection_code: 'DSC_VENDOR_REGISTRY_FAIL_IDENTITY',
    mandatory: true,
    evaluation: 'design_time_declaration_only',
    status_in_this_phase: 'not_evaluated',
  },
  {
    check_id: 'CHK_CAPABILITY_INTERFACE',
    description:
      'Vendor must declare intent to satisfy dsc-vendor-capability-interface-v1 without vendor-specific extensions.',
    rejection_code: 'DSC_VENDOR_REGISTRY_FAIL_CAPABILITY_INTERFACE',
    mandatory: true,
    evaluation: 'design_time_declaration_only',
    status_in_this_phase: 'not_evaluated',
  },
  {
    check_id: 'CHK_CAPABILITY_SET_LOCKED',
    description: 'Registration must bind the frozen capability set identity and version.',
    rejection_code: 'DSC_VENDOR_REGISTRY_FAIL_CAPABILITY_SET',
    mandatory: true,
    evaluation: 'design_time_declaration_only',
    status_in_this_phase: 'not_evaluated',
  },
  {
    check_id: 'CHK_SPATIAL_FRAME_LOCKED',
    description: 'Registration must operate exclusively in normalized_image_plane_v1.',
    rejection_code: 'DSC_VENDOR_REGISTRY_FAIL_SPATIAL_FRAME',
    mandatory: true,
    evaluation: 'design_time_declaration_only',
    status_in_this_phase: 'not_evaluated',
  },
  {
    check_id: 'CHK_CHANNEL_ORDER_FOUNDATION',
    description: 'Registration must declare the six foundation channels in fixed order.',
    rejection_code: 'DSC_VENDOR_REGISTRY_FAIL_CHANNEL_ORDER',
    mandatory: true,
    evaluation: 'design_time_declaration_only',
    status_in_this_phase: 'not_evaluated',
  },
  {
    check_id: 'CHK_NO_GPU_NO_INFERENCE',
    description: 'Registration must not require GPU or perform inference.',
    rejection_code: 'DSC_VENDOR_REGISTRY_FAIL_GPU_INFERENCE',
    mandatory: true,
    evaluation: 'design_time_declaration_only',
    status_in_this_phase: 'not_evaluated',
  },
  {
    check_id: 'CHK_NO_VENDOR_NAME',
    description: 'Registration must not embed a concrete vendor name.',
    rejection_code: 'DSC_VENDOR_REGISTRY_FAIL_VENDOR_NAME',
    mandatory: true,
    evaluation: 'design_time_declaration_only',
    status_in_this_phase: 'not_evaluated',
  },
  {
    check_id: 'CHK_LIFECYCLE_STARTS_PENDING',
    description:
      'Newly allocated registrations must begin in the pending lifecycle state before activation.',
    rejection_code: 'DSC_VENDOR_REGISTRY_FAIL_LIFECYCLE_INITIAL',
    mandatory: true,
    evaluation: 'design_time_declaration_only',
    status_in_this_phase: 'not_evaluated',
  },
  {
    check_id: 'CHK_DUPLICATE_ACTIVE_REJECTED',
    description:
      'A second active registration for the same opaque_vendor_handle and vendor_profile_id must be rejected.',
    rejection_code: 'DSC_VENDOR_REGISTRY_DUPLICATE_ACTIVE',
    mandatory: true,
    evaluation: 'design_time_declaration_only',
    status_in_this_phase: 'not_evaluated',
  },
];

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/**
 * Build the design-only, read-only, vendor-neutral DSC vendor registry. Reuses
 * the PHASE-055 vendor profile by exact reference; writes only the registry
 * artifact. No vendor is registered, no lifecycle transition is executed, and
 * no upstream artifact is modified.
 */
export function buildDirectSpatialConditioningVendorRegistry(
  projectRoot?: string
): { vendorRegistry: DirectSpatialConditioningVendorRegistry } {
  const root = resolveProjectRoot(projectRoot);

  const familyCertification = readJson<{
    certified?: boolean;
    certified_system?: string;
  }>(root, BACKEND_FAMILY_CERTIFICATION_PATH);
  if (familyCertification.certified !== true) {
    throw new Error('PHASE-054 backend family is not certified');
  }

  const vendorProfile = readJson<DirectSpatialConditioningVendorProfile>(
    root,
    VENDOR_PROFILE_PATH
  );
  if (
    vendorProfile.phase !== DSC_VENDOR_PROFILE_PHASE ||
    vendorProfile.system_id !== DSC_VENDOR_PROFILE_SYSTEM_ID
  ) {
    throw new Error('PHASE-055 vendor profile is missing or incompatible');
  }
  if (vendorProfile.vendor_profile_id !== VENDOR_PROFILE_ID) {
    throw new Error('Vendor profile identity drifted');
  }
  if (vendorProfile.vendor_profile_version !== VENDOR_PROFILE_VERSION) {
    throw new Error('Vendor profile version drifted');
  }
  if (vendorProfile.target !== 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_PROFILE_V1') {
    throw new Error('Vendor profile target is not the verified PASS verdict');
  }
  if (!vendorProfile.design_constraints.vendor_neutral) {
    throw new Error('Vendor profile must remain vendor neutral');
  }
  if (!vendorProfile.design_constraints.reuses_certified_backend_family) {
    throw new Error('Vendor profile must reuse the certified backend family');
  }
  if (!vendorProfile.design_constraints.no_vendor_implementation) {
    throw new Error('Vendor profile must forbid vendor implementation');
  }
  if (vendorProfile.bound_vendors.count !== 0) {
    throw new Error('PHASE-055 must not have bound vendors in this design stack');
  }
  if (vendorProfile.family_ref !== BACKEND_FAMILY_PATH) {
    throw new Error('Vendor profile family ref drifted');
  }
  if (
    JSON.stringify(vendorProfile.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor profile channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorProfile.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Vendor profile sources_supported drifted from the certified corpus');
  }
  if (vendorProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor profile spatial frame drifted');
  }
  if (
    vendorProfile.capability_set_id !== CAPABILITY_SET_ID ||
    vendorProfile.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor profile capability set identity drifted');
  }

  const vendor_registry_schema: VendorRegistrySchema = {
    schema_id: 'dsc-vendor-registry-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor registry. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. The registry declares registration records, lifecycle, deregistration policy, and validation rules without registering any vendor.',
    encoding: 'application/json',
    registry_id_policy: 'opaque_registry_id_no_vendor_binding',
    vendor_profile_ref: VENDOR_PROFILE_ID,
    required_fields: [
      {
        field: 'vendor_registry_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'vendor_profile_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the verified vendor profile ${VENDOR_PROFILE_ID}`,
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
        field: 'vendor_registration_record',
        type: 'dsc-vendor-registration-record-v1',
        required: true,
        nullable: false,
        constraint: 'must declare the opaque registration record shape',
      },
      {
        field: 'vendor_lifecycle',
        type: 'dsc-vendor-registry-lifecycle-v1',
        required: true,
        nullable: false,
        constraint: 'must declare pending/active/suspended/deregistered lifecycle',
      },
      {
        field: 'vendor_deregistration_policy',
        type: 'dsc-vendor-registry-deregistration-policy-v1',
        required: true,
        nullable: false,
        constraint: 'must declare irreversible deregistration with retained records',
      },
      {
        field: 'vendor_validation_rules',
        type: 'dsc-vendor-registry-validation-rules-v1',
        required: true,
        nullable: false,
        constraint:
          'must declare mandatory validation checks over vendor profile binding and neutrality',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const vendor_registration_record: VendorRegistrationRecord = {
    record_schema_id: 'dsc-vendor-registration-record-v1',
    description:
      'Shape of a single vendor registration record. Identity fields are opaque; no vendor name is stored. Records are declared only; none are written in this phase.',
    encoding: 'application/json',
    identity_policy: 'opaque_vendor_registration_id_no_vendor_name_binding',
    required_fields: [
      {
        field: 'vendor_registration_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque registration identity allocated at acceptance',
      },
      {
        field: 'opaque_vendor_handle',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque vendor handle with no vendor name, framework, or device semantics',
      },
      {
        field: 'vendor_profile_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${VENDOR_PROFILE_ID}`,
      },
      {
        field: 'vendor_profile_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${VENDOR_PROFILE_VERSION}`,
      },
      {
        field: 'lifecycle_state',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must be one of vendor_lifecycle.states',
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
        field: 'declared_channels',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'must equal the six foundation channels in fixed order',
      },
      {
        field: 'vendor_capability_interface_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal dsc-vendor-capability-interface-v1',
      },
      {
        field: 'requires_gpu',
        type: 'boolean',
        required: true,
        nullable: false,
        constraint: 'must equal false',
      },
      {
        field: 'performs_inference',
        type: 'boolean',
        required: true,
        nullable: false,
        constraint: 'must equal false',
      },
    ],
    uniqueness: {
      key: ['vendor_registration_id'],
      active_key: ['opaque_vendor_handle', 'vendor_profile_id'],
      duplicate_policy: 'reject_duplicate_active_registration',
      duplicate_code: 'DSC_VENDOR_REGISTRY_DUPLICATE_ACTIVE',
    },
    additional_fields: false,
    writes_records_in_this_phase: false,
  };

  const vendor_lifecycle: VendorLifecycle = {
    lifecycle_id: 'dsc-vendor-registry-lifecycle-v1',
    description:
      'Lifecycle governing vendor registration records. States and transitions are declared only; no transition is executed in this phase.',
    states: ['pending', 'active', 'suspended', 'deregistered'],
    initial_state: 'pending',
    active_state: 'active',
    terminal_state: 'deregistered',
    transitions: LIFECYCLE_TRANSITIONS,
    invariants: [
      'every registration begins in pending',
      'only active registrations may be selected by downstream routing',
      'deregistered is terminal and irreversible under the deregistration policy',
      'suspended to active requires a vendor profile recheck',
      'no lifecycle transition invokes a vendor implementation, GPU, or inference path',
    ],
    registers_vendors_in_this_phase: false,
  };

  const vendor_deregistration_policy: VendorDeregistrationPolicy = {
    policy_id: 'dsc-vendor-registry-deregistration-policy-v1',
    description:
      'Irreversible deregistration policy for vendor registration records. Records are retained for audit; re-registration requires a fresh validation flow. Declared only; not executed in this phase.',
    allowed_reasons: [
      'operator_requested',
      'capability_set_incompatible',
      'vendor_profile_revoked',
      'lifecycle_expired',
      'validation_rejected',
    ],
    effects: {
      lifecycle_state_becomes: 'deregistered',
      registration_record_retained: true,
      re_registration_policy: 'requires_new_registration_flow_and_fresh_vendor_validation',
      vendor_handles_released: true,
    },
    forbidden: [
      'vendor implementation during deregistration',
      'gpu or inference execution during deregistration',
      'dataset modification during deregistration',
      'silent deletion of registration records',
      'reactivation of a deregistered record without a new registration',
    ],
    irreversible: true,
    executed_in_this_phase: false,
  };

  const vendor_validation_rules: VendorValidationRules = {
    validation_id: 'dsc-vendor-registry-validation-rules-v1',
    description:
      'Validation rules a vendor registration must satisfy before becoming active. Declared only; no vendor is evaluated in this phase.',
    evaluation: 'collect_all_rejections',
    accept_condition: 'zero rejection codes and vendor profile binding intact',
    outcome_values: ['accepted', 'rejected'],
    checks: VALIDATION_CHECKS,
    requires_vendor_profile_binding: true,
    requires_vendor_capability_interface: true,
    evaluates_vendors_in_this_phase: false,
  };

  const vendorRegistry: DirectSpatialConditioningVendorRegistry = {
    vendor_registry_id: 'direct-spatial-conditioning-vendor-registry-v1',
    phase: DSC_VENDOR_REGISTRY_PHASE,
    system_id: DSC_VENDOR_REGISTRY_SYSTEM_ID,
    mode: 'design_only_vendor_registry',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REGISTRY_V1',
    vendor_profile_ref: VENDOR_PROFILE_PATH,
    vendor_profile_phase: DSC_VENDOR_PROFILE_PHASE,
    vendor_profile_system_id: DSC_VENDOR_PROFILE_SYSTEM_ID,
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
    vendor_registry_schema,
    vendor_registration_record,
    vendor_lifecycle,
    vendor_deregistration_policy,
    vendor_validation_rules,
    registered_vendors: {
      count: 0,
      entries: [],
      registration_policy:
        'vendors may register only after a future acceptance flow against the vendor profile; none are registered here',
      registers_vendors_in_this_phase: false,
    },
    design_constraints: {
      registry_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_vendor_profile: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      registers_vendors_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_REGISTRY_PATH, vendorRegistry);
  return { vendorRegistry };
}
