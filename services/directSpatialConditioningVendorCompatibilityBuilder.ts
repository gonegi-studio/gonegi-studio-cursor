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
  VENDOR_PROFILE_ID,
  VENDOR_PROFILE_PATH,
} from './directSpatialConditioningVendorProfileBuilder.js';
import {
  DSC_VENDOR_REGISTRY_PHASE,
  DSC_VENDOR_REGISTRY_SYSTEM_ID,
  VENDOR_REGISTRY_PATH,
  type DirectSpatialConditioningVendorRegistry,
} from './directSpatialConditioningVendorRegistryBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-057: Direct Spatial Conditioning vendor compatibility specification.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines the vendor compatibility
 * specification over the verified PHASE-056 vendor registry:
 *   - compatibility schema,
 *   - compatibility report,
 *   - deterministic compatibility rules, and
 *   - compatibility flow.
 *
 * Declares a specification only. Evaluates no vendor, implements no vendor,
 * performs no GPU or inference work, and modifies no dataset. The vendor
 * registry is reused by exact reference.
 */

export const DSC_VENDOR_COMPATIBILITY_PHASE = 'PHASE-DSC-057' as const;
export const DSC_VENDOR_COMPATIBILITY_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_COMPATIBILITY_V1' as const;

export const VENDOR_COMPATIBILITY_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_COMPATIBILITY_PATH =
  `${VENDOR_COMPATIBILITY_ROOT}/direct-spatial-conditioning-vendor-compatibility-v1.json` as const;

export type CompatibilityFlowStageId =
  | 'bind_compatibility_inputs'
  | 'lookup_vendor_registry'
  | 'validate_registration_record'
  | 'resolve_capability_set'
  | 'apply_deterministic_rules'
  | 'aggregate_outcome'
  | 'emit_compatibility_report';

export interface CompatibilitySchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorCompatibilitySchema {
  schema_id: 'dsc-vendor-compatibility-schema-v1';
  description: string;
  encoding: 'application/json';
  identity_policy: 'opaque_compatibility_spec_id_no_vendor_binding';
  vendor_registry_ref: string;
  required_fields: CompatibilitySchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface CompatibilityReportField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorCompatibilityReport {
  report_schema_id: 'dsc-vendor-compatibility-report-schema-v1';
  report_id: 'dsc-vendor-compatibility-report-v1';
  description: string;
  encoding: 'application/json';
  required_fields: CompatibilityReportField[];
  outcome_values: ['compatible', 'incompatible'];
  rule_result_shape: {
    fields: string[];
    outcome_values: ['compatible', 'incompatible'];
  };
  ordering: {
    evaluated_rules: 'deterministic_compatibility_rules_order';
    failed_rules: 'deterministic_compatibility_rules_order';
    incompatibility_codes: 'first_failure_order_then_lexicographic';
  };
  additional_fields: false;
  materializes_tensors: false;
  materializes_frames: false;
  evaluates_vendors_in_this_phase: false;
}

export interface DeterministicCompatibilityRule {
  rule_id: string;
  order: number;
  category:
    | 'identity'
    | 'profile_binding'
    | 'capability'
    | 'lifecycle'
    | 'constraints';
  description: string;
  pass_condition: string;
  fail_code: string;
  mandatory: true;
  deterministic: true;
  evaluated_in_this_phase: false;
}

export interface DeterministicCompatibilityRules {
  rules_id: 'dsc-vendor-deterministic-compatibility-rules-v1';
  description: string;
  purity: 'deterministic_pure_function';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  vendor_invocation: 'none';
  aggregation_rule: 'all_mandatory_rules_must_pass';
  evaluation: 'collect_all_incompatibility_codes';
  rules: DeterministicCompatibilityRule[];
  evaluates_vendors_in_this_phase: false;
}

export interface CompatibilityFlowStage {
  stage_id: CompatibilityFlowStageId;
  order: number;
  description: string;
  inputs: string[];
  outputs: string[];
  side_effects: 'none';
  executed_in_this_phase: false;
}

export interface CompatibilityFlow {
  flow_id: 'dsc-vendor-compatibility-flow-v1';
  description: string;
  ordered_stages: CompatibilityFlowStage[];
  reuse_policy: {
    vendor_registry: 'mandatory_exact_reuse';
    vendor_profile: 'mandatory_read_only_via_registry';
  };
  accept_condition: 'compatibility report outcome is compatible';
  reject_condition: 'compatibility report outcome is incompatible';
  outcome_values: ['compatible', 'incompatible'];
  executes_flow_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorCompatibility {
  vendor_compatibility_id: string;
  phase: typeof DSC_VENDOR_COMPATIBILITY_PHASE;
  system_id: typeof DSC_VENDOR_COMPATIBILITY_SYSTEM_ID;
  mode: 'design_only_vendor_compatibility';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_COMPATIBILITY_V1';
  vendor_registry_ref: string;
  vendor_registry_phase: typeof DSC_VENDOR_REGISTRY_PHASE;
  vendor_registry_system_id: typeof DSC_VENDOR_REGISTRY_SYSTEM_ID;
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
  vendor_compatibility_schema: VendorCompatibilitySchema;
  compatibility_report: VendorCompatibilityReport;
  deterministic_compatibility_rules: DeterministicCompatibilityRules;
  compatibility_flow: CompatibilityFlow;
  evaluated_vendors: {
    count: 0;
    entries: [];
    evaluation_policy: string;
    evaluates_vendors_in_this_phase: false;
  };
  design_constraints: {
    compatibility_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_vendor_registry: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    evaluates_vendors_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const FLOW_STAGES: CompatibilityFlowStage[] = [
  {
    stage_id: 'bind_compatibility_inputs',
    order: 1,
    description:
      'Bind the opaque vendor registration record and vendor profile references as immutable compatibility inputs. No vendor is invoked.',
    inputs: ['vendor_registration_record', 'vendor_profile_ref'],
    outputs: ['bound_compatibility_inputs'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'lookup_vendor_registry',
    order: 2,
    description:
      'Read the PHASE-056 vendor registry surfaces by exact reference: registration record schema, lifecycle, validation rules, and uniqueness policy.',
    inputs: ['bound_compatibility_inputs', 'vendor_registry_ref'],
    outputs: ['registry_lookup_surface'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'validate_registration_record',
    order: 3,
    description:
      'Validate that the registration record shape matches dsc-vendor-registration-record-v1 and that identity fields remain opaque.',
    inputs: ['bound_compatibility_inputs', 'registry_lookup_surface'],
    outputs: ['validated_registration_record', 'record_rejection_codes'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'resolve_capability_set',
    order: 4,
    description:
      'Resolve the declared capability set identity and version against the frozen capability set bound by the vendor profile and registry.',
    inputs: ['validated_registration_record'],
    outputs: ['resolved_capability_set'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'apply_deterministic_rules',
    order: 5,
    description:
      'Apply every mandatory deterministic compatibility rule in declared order. Collect all failure codes; do not short-circuit.',
    inputs: ['validated_registration_record', 'resolved_capability_set'],
    outputs: ['rule_results', 'incompatibility_codes'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'aggregate_outcome',
    order: 6,
    description:
      'Aggregate rule results under all_mandatory_rules_must_pass. Compatible only when incompatibility_codes is empty.',
    inputs: ['rule_results', 'incompatibility_codes'],
    outputs: ['compatibility_outcome'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'emit_compatibility_report',
    order: 7,
    description:
      'Emit dsc-vendor-compatibility-report-v1 containing outcome, evaluated rules, failed rules, and incompatibility codes.',
    inputs: ['compatibility_outcome', 'rule_results', 'incompatibility_codes'],
    outputs: ['compatibility_report'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
];

const COMPATIBILITY_RULES: DeterministicCompatibilityRule[] = [
  {
    rule_id: 'RULE_VENDOR_REGISTRY_BOUND',
    order: 1,
    category: 'profile_binding',
    description:
      'Compatibility evaluation must bind the verified PHASE-056 vendor registry by exact reference.',
    pass_condition: 'vendor_registry_ref equals VENDOR_REGISTRY_PATH',
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_REGISTRY_BINDING',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
  },
  {
    rule_id: 'RULE_VENDOR_PROFILE_BOUND',
    order: 2,
    category: 'profile_binding',
    description:
      'Registration must bind dsc-vendor-profile-generic-v1 exactly.',
    pass_condition: `vendor_profile_id equals ${VENDOR_PROFILE_ID}`,
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_PROFILE_BINDING',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
  },
  {
    rule_id: 'RULE_IDENTITY_OPAQUE',
    order: 3,
    category: 'identity',
    description:
      'vendor_registration_id and opaque_vendor_handle must carry no vendor name, framework, or device semantics.',
    pass_condition: 'identity fields satisfy opaque_vendor_registration_id_no_vendor_name_binding',
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_IDENTITY',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
  },
  {
    rule_id: 'RULE_CAPABILITY_SET_LOCKED',
    order: 4,
    category: 'capability',
    description: 'Declared capability set must match the frozen capability set identity and version.',
    pass_condition: `capability_set_id equals ${CAPABILITY_SET_ID} and capability_set_version equals ${CAPABILITY_SET_VERSION}`,
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_CAPABILITY_SET',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
  },
  {
    rule_id: 'RULE_CAPABILITY_INTERFACE',
    order: 5,
    category: 'capability',
    description:
      'Registration must reference dsc-vendor-capability-interface-v1 with vendor-specific extensions forbidden.',
    pass_condition: 'vendor_capability_interface_ref equals dsc-vendor-capability-interface-v1',
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_CAPABILITY_INTERFACE',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
  },
  {
    rule_id: 'RULE_SPATIAL_FRAME_LOCKED',
    order: 6,
    category: 'constraints',
    description: 'Registration must operate exclusively in normalized_image_plane_v1.',
    pass_condition: `spatial_frame_ref equals ${SPATIAL_FRAME.frame_id}`,
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_SPATIAL_FRAME',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
  },
  {
    rule_id: 'RULE_CHANNEL_ORDER_FOUNDATION',
    order: 7,
    category: 'constraints',
    description: 'Declared channels must equal the six foundation channels in fixed order.',
    pass_condition: 'declared_channels equals CONDITIONING_CHANNEL_IDS',
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_CHANNEL_ORDER',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
  },
  {
    rule_id: 'RULE_LIFECYCLE_ACTIVE_OR_PENDING',
    order: 8,
    category: 'lifecycle',
    description:
      'Only pending or active lifecycle states may be evaluated for compatibility; deregistered records are incompatible.',
    pass_condition: 'lifecycle_state is pending or active',
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_LIFECYCLE',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
  },
  {
    rule_id: 'RULE_NO_GPU_NO_INFERENCE',
    order: 9,
    category: 'constraints',
    description: 'Registration must declare requires_gpu false and performs_inference false.',
    pass_condition: 'requires_gpu equals false and performs_inference equals false',
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_GPU_INFERENCE',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
  },
  {
    rule_id: 'RULE_NO_VENDOR_NAME',
    order: 10,
    category: 'identity',
    description: 'Registration must not embed a concrete vendor name.',
    pass_condition: 'no vendor_name field present and identity remains opaque',
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_VENDOR_NAME',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
  },
  {
    rule_id: 'RULE_DUPLICATE_ACTIVE_REJECTED',
    order: 11,
    category: 'lifecycle',
    description:
      'A second active registration for the same opaque_vendor_handle and vendor_profile_id is incompatible.',
    pass_condition: 'no duplicate active registration under registry uniqueness.active_key',
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_DUPLICATE_ACTIVE',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
  },
  {
    rule_id: 'RULE_DETERMINISM_INHERITED',
    order: 12,
    category: 'constraints',
    description:
      'Compatibility resolution must remain a pure deterministic function with no seed, time, or randomness dependence.',
    pass_condition:
      'purity equals deterministic_pure_function and seed/time/randomness/vendor_invocation equal none',
    fail_code: 'DSC_VENDOR_COMPAT_FAIL_NONDETERMINISTIC',
    mandatory: true,
    deterministic: true,
    evaluated_in_this_phase: false,
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
 * Build the design-only, read-only, vendor-neutral DSC vendor compatibility
 * specification. Reuses the PHASE-056 vendor registry by exact reference;
 * writes only the compatibility artifact. No vendor is evaluated and no
 * upstream artifact is modified.
 */
export function buildDirectSpatialConditioningVendorCompatibility(
  projectRoot?: string
): { vendorCompatibility: DirectSpatialConditioningVendorCompatibility } {
  const root = resolveProjectRoot(projectRoot);

  const familyCertification = readJson<{
    certified?: boolean;
    certified_system?: string;
  }>(root, BACKEND_FAMILY_CERTIFICATION_PATH);
  if (familyCertification.certified !== true) {
    throw new Error('PHASE-054 backend family is not certified');
  }

  const vendorRegistry = readJson<DirectSpatialConditioningVendorRegistry>(
    root,
    VENDOR_REGISTRY_PATH
  );
  if (
    vendorRegistry.phase !== DSC_VENDOR_REGISTRY_PHASE ||
    vendorRegistry.system_id !== DSC_VENDOR_REGISTRY_SYSTEM_ID
  ) {
    throw new Error('PHASE-056 vendor registry is missing or incompatible');
  }
  if (vendorRegistry.target !== 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REGISTRY_V1') {
    throw new Error('Vendor registry target is not the verified PASS verdict');
  }
  if (!vendorRegistry.design_constraints.vendor_neutral) {
    throw new Error('Vendor registry must remain vendor neutral');
  }
  if (!vendorRegistry.design_constraints.reuses_vendor_profile) {
    throw new Error('Vendor registry must reuse the vendor profile');
  }
  if (!vendorRegistry.design_constraints.no_vendor_implementation) {
    throw new Error('Vendor registry must forbid vendor implementation');
  }
  if (vendorRegistry.registered_vendors.count !== 0) {
    throw new Error('PHASE-056 must not have registered vendors in this design stack');
  }
  if (vendorRegistry.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
    throw new Error('Vendor registry vendor profile ref drifted');
  }
  if (
    JSON.stringify(vendorRegistry.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor registry channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRegistry.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Vendor registry sources_supported drifted from the certified corpus');
  }
  if (vendorRegistry.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor registry spatial frame drifted');
  }
  if (
    vendorRegistry.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRegistry.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor registry capability set identity drifted');
  }
  if (vendorRegistry.vendor_lifecycle.active_state !== 'active') {
    throw new Error('Vendor registry active lifecycle state drifted');
  }
  if (
    vendorRegistry.vendor_validation_rules.validation_id !==
    'dsc-vendor-registry-validation-rules-v1'
  ) {
    throw new Error('Vendor registry validation rules identity drifted');
  }

  const vendor_compatibility_schema: VendorCompatibilitySchema = {
    schema_id: 'dsc-vendor-compatibility-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor compatibility specification. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. The specification declares a report shape, deterministic rules, and an ordered flow without evaluating any vendor.',
    encoding: 'application/json',
    identity_policy: 'opaque_compatibility_spec_id_no_vendor_binding',
    vendor_registry_ref: VENDOR_REGISTRY_PATH,
    required_fields: [
      {
        field: 'vendor_compatibility_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'vendor_registry_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must reference the verified PHASE-056 vendor registry',
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
        field: 'compatibility_report',
        type: 'dsc-vendor-compatibility-report-v1',
        required: true,
        nullable: false,
        constraint: 'must declare the compatibility report schema',
      },
      {
        field: 'deterministic_compatibility_rules',
        type: 'dsc-vendor-deterministic-compatibility-rules-v1',
        required: true,
        nullable: false,
        constraint:
          'must declare a pure deterministic rule set with no seed, time, or randomness dependence',
      },
      {
        field: 'compatibility_flow',
        type: 'dsc-vendor-compatibility-flow-v1',
        required: true,
        nullable: false,
        constraint: 'must declare an ordered side-effect-free evaluation flow',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const compatibility_report: VendorCompatibilityReport = {
    report_schema_id: 'dsc-vendor-compatibility-report-schema-v1',
    report_id: 'dsc-vendor-compatibility-report-v1',
    description:
      'Shape of the vendor compatibility report emitted by the compatibility flow. Declared only; no report is produced in this phase.',
    encoding: 'application/json',
    required_fields: [
      {
        field: 'compatibility_report_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque report identity',
      },
      {
        field: 'vendor_registration_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque registration identity under evaluation',
      },
      {
        field: 'vendor_registry_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal the verified vendor registry path',
      },
      {
        field: 'vendor_profile_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${VENDOR_PROFILE_ID}`,
      },
      {
        field: 'capability_set_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${CAPABILITY_SET_VERSION}`,
      },
      {
        field: 'outcome',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must be compatible or incompatible',
      },
      {
        field: 'evaluated_rules',
        type: 'array',
        required: true,
        nullable: false,
        constraint: 'one entry per deterministic rule in declared order',
      },
      {
        field: 'failed_rules',
        type: 'array',
        required: true,
        nullable: false,
        constraint: 'subset of evaluated_rules with incompatible outcomes',
      },
      {
        field: 'incompatibility_codes',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'ordered fail codes collected under collect_all_incompatibility_codes',
      },
      {
        field: 'spatial_frame_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${SPATIAL_FRAME.frame_id}`,
      },
      {
        field: 'evaluated_at',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'audit timestamp; must not affect outcome or digests',
      },
    ],
    outcome_values: ['compatible', 'incompatible'],
    rule_result_shape: {
      fields: ['rule_id', 'outcome', 'fail_code'],
      outcome_values: ['compatible', 'incompatible'],
    },
    ordering: {
      evaluated_rules: 'deterministic_compatibility_rules_order',
      failed_rules: 'deterministic_compatibility_rules_order',
      incompatibility_codes: 'first_failure_order_then_lexicographic',
    },
    additional_fields: false,
    materializes_tensors: false,
    materializes_frames: false,
    evaluates_vendors_in_this_phase: false,
  };

  const deterministic_compatibility_rules: DeterministicCompatibilityRules = {
    rules_id: 'dsc-vendor-deterministic-compatibility-rules-v1',
    description:
      'Deterministic rules a vendor registration must satisfy to be compatible with the vendor profile and registry. Pure function of the registration record and registry surfaces; no vendor is invoked in this phase.',
    purity: 'deterministic_pure_function',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    vendor_invocation: 'none',
    aggregation_rule: 'all_mandatory_rules_must_pass',
    evaluation: 'collect_all_incompatibility_codes',
    rules: COMPATIBILITY_RULES,
    evaluates_vendors_in_this_phase: false,
  };

  const compatibility_flow: CompatibilityFlow = {
    flow_id: 'dsc-vendor-compatibility-flow-v1',
    description:
      'Ordered side-effect-free flow that produces a vendor compatibility report. Declared only; not executed in this phase.',
    ordered_stages: FLOW_STAGES,
    reuse_policy: {
      vendor_registry: 'mandatory_exact_reuse',
      vendor_profile: 'mandatory_read_only_via_registry',
    },
    accept_condition: 'compatibility report outcome is compatible',
    reject_condition: 'compatibility report outcome is incompatible',
    outcome_values: ['compatible', 'incompatible'],
    executes_flow_in_this_phase: false,
  };

  const vendorCompatibility: DirectSpatialConditioningVendorCompatibility = {
    vendor_compatibility_id: 'direct-spatial-conditioning-vendor-compatibility-v1',
    phase: DSC_VENDOR_COMPATIBILITY_PHASE,
    system_id: DSC_VENDOR_COMPATIBILITY_SYSTEM_ID,
    mode: 'design_only_vendor_compatibility',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_COMPATIBILITY_V1',
    vendor_registry_ref: VENDOR_REGISTRY_PATH,
    vendor_registry_phase: DSC_VENDOR_REGISTRY_PHASE,
    vendor_registry_system_id: DSC_VENDOR_REGISTRY_SYSTEM_ID,
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
    vendor_compatibility_schema,
    compatibility_report,
    deterministic_compatibility_rules,
    compatibility_flow,
    evaluated_vendors: {
      count: 0,
      entries: [],
      evaluation_policy:
        'vendors may be evaluated only in a future acceptance flow; none are evaluated here',
      evaluates_vendors_in_this_phase: false,
    },
    design_constraints: {
      compatibility_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_vendor_registry: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      evaluates_vendors_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_COMPATIBILITY_PATH, vendorCompatibility);
  return { vendorCompatibility };
}
