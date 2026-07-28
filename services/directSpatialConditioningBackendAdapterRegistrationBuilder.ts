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
  DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE,
  DSC_BACKEND_COMPATIBILITY_ENGINE_SYSTEM_ID,
  type DirectSpatialConditioningBackendCompatibilityEngine,
} from './directSpatialConditioningBackendCompatibilityEngineBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-042: Direct Spatial Conditioning backend adapter registration.
 *
 * DESIGN ONLY / READ-ONLY / BACKEND AGNOSTIC. Defines how a compatible backend
 * adapter becomes a registered adapter against the frozen PHASE-041
 * compatibility engine:
 *   - registration flow (ordered stages),
 *   - registration schema (record shape),
 *   - lifecycle + deregistration policy, and
 *   - registration validation (acceptance/rejection rules).
 *
 * Registers no adapter, implements no backend, evaluates no descriptor, and
 * performs no GPU, inference, or dataset modification. Every stage is declared,
 * never executed, in this phase. The PHASE-041 engine is reused by exact
 * reference; only compatible outcomes may proceed to registration.
 */

export const DSC_BACKEND_ADAPTER_REGISTRATION_PHASE = 'PHASE-DSC-042' as const;
export const DSC_BACKEND_ADAPTER_REGISTRATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_REGISTRATION_V1' as const;

export const BACKEND_ADAPTER_REGISTRATION_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const BACKEND_ADAPTER_REGISTRATION_PATH =
  `${BACKEND_ADAPTER_REGISTRATION_ROOT}/direct-spatial-conditioning-backend-adapter-registration-v1.json` as const;

export type RegistrationStageId =
  | 'bind_registration_request'
  | 'run_compatibility_engine'
  | 'validate_registration_payload'
  | 'allocate_registration_identity'
  | 'write_registration_record'
  | 'emit_registration_receipt';

export type LifecycleState =
  | 'pending'
  | 'active'
  | 'suspended'
  | 'deregistered';

export type DeregistrationReason =
  | 'caller_requested'
  | 'capability_set_major_mismatch'
  | 'compatibility_revoked'
  | 'lifecycle_expired'
  | 'policy_violation';

export interface RegistrationStage {
  stage_id: RegistrationStageId;
  order: number;
  description: string;
  inputs: string[];
  outputs: string[];
  side_effects: 'none';
  executed_in_this_phase: false;
}

export interface RegistrationField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface RegistrationSchema {
  schema_id: 'dsc-backend-adapter-registration-record-v1';
  description: string;
  encoding: 'application/json';
  required_fields: RegistrationField[];
  optional_fields: [];
  identity_policy: 'opaque_registration_id_no_vendor_binding';
  uniqueness: {
    unique_on: ['backend_id', 'adapter_interface_version', 'capability_set_version'];
    duplicate_policy: 'reject_duplicate_active_registration';
    duplicate_code: 'DSC_BACKEND_REGISTRATION_DUPLICATE_ACTIVE';
  };
  additional_fields: false;
}

export interface LifecycleTransition {
  from: LifecycleState;
  to: LifecycleState;
  trigger: string;
  requires_compatibility_recheck: boolean;
  allowed: true;
}

export interface AdapterLifecycle {
  lifecycle_id: 'dsc-backend-adapter-registration-lifecycle-v1';
  description: string;
  states: LifecycleState[];
  initial_state: 'pending';
  active_state: 'active';
  terminal_state: 'deregistered';
  transitions: LifecycleTransition[];
  invariants: string[];
  registers_adapters_in_this_phase: false;
}

export interface DeregistrationPolicy {
  policy_id: 'dsc-backend-adapter-deregistration-policy-v1';
  description: string;
  allowed_reasons: DeregistrationReason[];
  effects: {
    lifecycle_state_becomes: 'deregistered';
    registration_record_retained: true;
    re_registration_policy: 'requires_new_registration_flow_and_fresh_compatibility_report';
    binding_handles_released: true;
  };
  forbidden: string[];
  irreversible: true;
  executed_in_this_phase: false;
}

export interface RegistrationValidationCheck {
  check_id: string;
  stage_ref: RegistrationStageId | 'cross_stage';
  description: string;
  rejection_code: string;
  mandatory: true;
}

export interface RegistrationValidation {
  validation_id: 'dsc-backend-adapter-registration-validation-v1';
  description: string;
  evaluation: 'collect_all_rejections';
  accept_condition: 'zero rejection codes and compatibility outcome compatible';
  outcome_values: ['accepted', 'rejected'];
  checks: RegistrationValidationCheck[];
  requires_compatible_engine_outcome: true;
  evaluates_registrations_in_this_phase: false;
}

export interface DirectSpatialConditioningBackendAdapterRegistration {
  adapter_registration_id: string;
  phase: typeof DSC_BACKEND_ADAPTER_REGISTRATION_PHASE;
  system_id: typeof DSC_BACKEND_ADAPTER_REGISTRATION_SYSTEM_ID;
  mode: 'design_only_registration';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_REGISTRATION_V1';
  compatibility_engine_ref: string;
  compatibility_engine_phase: typeof DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE;
  compatibility_engine_system_id: typeof DSC_BACKEND_COMPATIBILITY_ENGINE_SYSTEM_ID;
  capability_registry_ref: string;
  adapter_foundation_ref: string;
  runtime_interface_ref: string;
  runtime_package_ref: string;
  sources_supported: string[];
  required_channels: ConditioningChannelId[];
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  registration_flow: {
    flow_id: 'dsc-backend-adapter-registration-flow-v1';
    description: string;
    ordered_stages: RegistrationStage[];
    reuse_policy: {
      compatibility_engine: 'mandatory_exact_reuse';
      capability_registry: 'mandatory_read_only_via_engine';
    };
    accept_condition: 'registration validation accepted and record written';
    reject_condition: 'one or more registration rejection codes emitted';
  };
  registration_schema: RegistrationSchema;
  lifecycle: AdapterLifecycle;
  deregistration_policy: DeregistrationPolicy;
  registration_validation: RegistrationValidation;
  registered_adapters: {
    count: 0;
    entries: [];
    registration_policy: string;
    registers_adapters_in_this_phase: false;
  };
  design_constraints: {
    registration_only: true;
    read_only: true;
    backend_agnostic: true;
    reuses_compatibility_engine: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    registers_adapters_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const REGISTRATION_STAGES: RegistrationStage[] = [
  {
    stage_id: 'bind_registration_request',
    order: 1,
    description:
      'Bind the opaque backend_id, descriptor, and adapted conditioning input reference as immutable registration inputs. No backend is invoked.',
    inputs: ['registration_request', 'backend_descriptor', 'adapted_conditioning_input_ref'],
    outputs: ['bound_registration_inputs'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'run_compatibility_engine',
    order: 2,
    description:
      'Reuse the PHASE-041 compatibility engine evaluation flow by exact reference. Only a compatible outcome may proceed; incompatible reports reject registration.',
    inputs: ['bound_registration_inputs', 'compatibility_engine_ref'],
    outputs: ['compatibility_report'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'validate_registration_payload',
    order: 3,
    description:
      'Apply registration validation checks against the payload, compatibility report, and uniqueness policy before any identity is allocated.',
    inputs: ['bound_registration_inputs', 'compatibility_report'],
    outputs: ['validated_registration_payload', 'registration_rejection_codes'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'allocate_registration_identity',
    order: 4,
    description:
      'Allocate an opaque registration_id with no vendor, framework, or device semantics. Allocation is declared only; not performed in this phase.',
    inputs: ['validated_registration_payload'],
    outputs: ['registration_id'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'write_registration_record',
    order: 5,
    description:
      'Project the validated payload into the registration record schema and transition lifecycle from pending to active. Declared only; no record is written in this phase.',
    inputs: ['registration_id', 'validated_registration_payload', 'compatibility_report'],
    outputs: ['registration_record'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'emit_registration_receipt',
    order: 6,
    description:
      'Emit the registration receipt containing registration_id, lifecycle_state, and compatibility report outcome. Receipt emission is the only declared output of the flow.',
    inputs: ['registration_record'],
    outputs: ['registration_receipt'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
];

const LIFECYCLE_TRANSITIONS: LifecycleTransition[] = [
  {
    from: 'pending',
    to: 'active',
    trigger: 'registration_validation_accepted',
    requires_compatibility_recheck: false,
    allowed: true,
  },
  {
    from: 'pending',
    to: 'deregistered',
    trigger: 'registration_validation_rejected_or_abandoned',
    requires_compatibility_recheck: false,
    allowed: true,
  },
  {
    from: 'active',
    to: 'suspended',
    trigger: 'temporary_policy_hold',
    requires_compatibility_recheck: false,
    allowed: true,
  },
  {
    from: 'suspended',
    to: 'active',
    trigger: 'policy_hold_cleared_with_compatible_report',
    requires_compatibility_recheck: true,
    allowed: true,
  },
  {
    from: 'active',
    to: 'deregistered',
    trigger: 'deregistration_policy_invoked',
    requires_compatibility_recheck: false,
    allowed: true,
  },
  {
    from: 'suspended',
    to: 'deregistered',
    trigger: 'deregistration_policy_invoked',
    requires_compatibility_recheck: false,
    allowed: true,
  },
];

const REGISTRATION_VALIDATION_CHECKS: RegistrationValidationCheck[] = [
  {
    check_id: 'compatibility_outcome_must_be_compatible',
    stage_ref: 'run_compatibility_engine',
    description:
      'PHASE-041 compatibility report outcome must equal compatible before registration may continue.',
    rejection_code: 'DSC_BACKEND_REGISTRATION_INCOMPATIBLE',
    mandatory: true,
  },
  {
    check_id: 'descriptor_identity_opaque',
    stage_ref: 'validate_registration_payload',
    description:
      'backend_id must be a non-empty opaque identifier with no vendor, framework, or device semantics.',
    rejection_code: 'DSC_BACKEND_REGISTRATION_IDENTITY_INVALID',
    mandatory: true,
  },
  {
    check_id: 'capability_set_version_supported',
    stage_ref: 'validate_registration_payload',
    description:
      'declared capability_set_version must be one of the supported versions of dsc-backend-capability-set-v1.',
    rejection_code: 'DSC_BACKEND_REGISTRATION_CAPABILITY_SET_UNSUPPORTED',
    mandatory: true,
  },
  {
    check_id: 'adapter_interface_version_matches',
    stage_ref: 'validate_registration_payload',
    description:
      'adapter_interface_version must equal the PHASE-039 backend interface version reused by the engine.',
    rejection_code: 'DSC_BACKEND_REGISTRATION_INTERFACE_VERSION_MISMATCH',
    mandatory: true,
  },
  {
    check_id: 'spatial_frame_locked',
    stage_ref: 'validate_registration_payload',
    description:
      'declared_spatial_frame must equal normalized_image_plane_v1.',
    rejection_code: 'DSC_BACKEND_REGISTRATION_SPATIAL_FRAME_MISMATCH',
    mandatory: true,
  },
  {
    check_id: 'channel_coverage_complete',
    stage_ref: 'validate_registration_payload',
    description:
      'declared_channels must equal the six required channels in the fixed foundation order.',
    rejection_code: 'DSC_BACKEND_REGISTRATION_CHANNEL_COVERAGE_INCOMPLETE',
    mandatory: true,
  },
  {
    check_id: 'no_duplicate_active_registration',
    stage_ref: 'validate_registration_payload',
    description:
      'an active registration with the same backend_id, adapter_interface_version, and capability_set_version is rejected.',
    rejection_code: 'DSC_BACKEND_REGISTRATION_DUPLICATE_ACTIVE',
    mandatory: true,
  },
  {
    check_id: 'lifecycle_starts_pending',
    stage_ref: 'allocate_registration_identity',
    description:
      'newly allocated registrations must begin in the pending lifecycle state before activation.',
    rejection_code: 'DSC_BACKEND_REGISTRATION_LIFECYCLE_INVALID',
    mandatory: true,
  },
  {
    check_id: 'no_backend_implementation_required',
    stage_ref: 'cross_stage',
    description:
      'registration must not require a concrete backend, GPU, or inference implementation to succeed.',
    rejection_code: 'DSC_BACKEND_REGISTRATION_BACKEND_IMPLEMENTATION_FORBIDDEN',
    mandatory: true,
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
 * Build the design-only, read-only DSC backend adapter registration surface.
 * Reuses the PHASE-041 compatibility engine by exact reference; writes only the
 * registration artifact. No adapter is registered and no upstream artifact is
 * modified.
 */
export function buildDirectSpatialConditioningBackendAdapterRegistration(
  projectRoot?: string
): { adapterRegistration: DirectSpatialConditioningBackendAdapterRegistration } {
  const root = resolveProjectRoot(projectRoot);

  const compatibilityEngine = readJson<DirectSpatialConditioningBackendCompatibilityEngine>(
    root,
    BACKEND_COMPATIBILITY_ENGINE_PATH
  );
  if (
    compatibilityEngine.phase !== DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE ||
    compatibilityEngine.system_id !== DSC_BACKEND_COMPATIBILITY_ENGINE_SYSTEM_ID
  ) {
    throw new Error('PHASE-041 compatibility engine is missing or incompatible');
  }
  if (!compatibilityEngine.design_constraints.backend_agnostic) {
    throw new Error('Compatibility engine must remain backend agnostic');
  }
  if (!compatibilityEngine.design_constraints.reuses_capability_registry) {
    throw new Error('Compatibility engine must reuse the capability registry');
  }
  if (compatibilityEngine.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
    throw new Error('Compatibility engine capability registry ref drifted');
  }
  if (
    JSON.stringify(compatibilityEngine.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Compatibility engine channels do not match foundation channels');
  }
  if (
    JSON.stringify(compatibilityEngine.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Compatibility engine sources_supported drifted from the certified corpus');
  }
  if (compatibilityEngine.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Compatibility engine spatial frame drifted');
  }

  const reportSchema = compatibilityEngine.report_schema;
  if (reportSchema.report_id !== 'dsc-backend-compatibility-report-v1') {
    throw new Error('Compatibility report identity drifted');
  }

  const registration_schema: RegistrationSchema = {
    schema_id: 'dsc-backend-adapter-registration-record-v1',
    description:
      'Shape of one backend adapter registration record. Identity is opaque; registration succeeds only after a compatible PHASE-041 report.',
    encoding: 'application/json',
    required_fields: [
      {
        field: 'registration_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque registration identity; carries no vendor, framework, or device semantics',
      },
      {
        field: 'backend_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque backend_id copied from the validated descriptor',
      },
      {
        field: 'backend_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'non-empty backend-owned version string from the descriptor',
      },
      {
        field: 'adapter_interface_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal the PHASE-039 backend interface version',
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
        constraint: `must be a supported version of ${CAPABILITY_SET_ID}`,
      },
      {
        field: 'compatibility_report_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'reference to the PHASE-041 compatibility report that accepted this registration',
      },
      {
        field: 'compatibility_outcome',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal compatible',
      },
      {
        field: 'lifecycle_state',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must be one of lifecycle.states',
      },
      {
        field: 'registered_channels',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'must equal the six required channels in fixed foundation order',
      },
      {
        field: 'spatial_frame_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${SPATIAL_FRAME.frame_id}`,
      },
      {
        field: 'created_at',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'ISO-8601 timestamp assigned at write_registration_record',
      },
    ],
    optional_fields: [],
    identity_policy: 'opaque_registration_id_no_vendor_binding',
    uniqueness: {
      unique_on: ['backend_id', 'adapter_interface_version', 'capability_set_version'],
      duplicate_policy: 'reject_duplicate_active_registration',
      duplicate_code: 'DSC_BACKEND_REGISTRATION_DUPLICATE_ACTIVE',
    },
    additional_fields: false,
  };

  const lifecycle: AdapterLifecycle = {
    lifecycle_id: 'dsc-backend-adapter-registration-lifecycle-v1',
    description:
      'Lifecycle states and allowed transitions for a registered backend adapter. Terminal state is deregistered; re-entry requires a new registration flow.',
    states: ['pending', 'active', 'suspended', 'deregistered'],
    initial_state: 'pending',
    active_state: 'active',
    terminal_state: 'deregistered',
    transitions: LIFECYCLE_TRANSITIONS,
    invariants: [
      'every registration begins in pending',
      'only pending may transition to active after validation acceptance',
      'deregistered is terminal and irreversible under the deregistration policy',
      'suspended to active always requires a fresh compatible compatibility report',
      'no lifecycle transition invokes a backend, GPU, or inference path',
    ],
    registers_adapters_in_this_phase: false,
  };

  const deregistration_policy: DeregistrationPolicy = {
    policy_id: 'dsc-backend-adapter-deregistration-policy-v1',
    description:
      'Rules governing how an active or suspended registration becomes deregistered. Records are retained; re-registration requires a full new flow and a fresh compatible report.',
    allowed_reasons: [
      'caller_requested',
      'capability_set_major_mismatch',
      'compatibility_revoked',
      'lifecycle_expired',
      'policy_violation',
    ],
    effects: {
      lifecycle_state_becomes: 'deregistered',
      registration_record_retained: true,
      re_registration_policy:
        'requires_new_registration_flow_and_fresh_compatibility_report',
      binding_handles_released: true,
    },
    forbidden: [
      'silent deletion of registration records',
      'reactivation without a new registration flow',
      'backend invocation during deregistration',
      'gpu or inference execution during deregistration',
      'dataset modification during deregistration',
    ],
    irreversible: true,
    executed_in_this_phase: false,
  };

  const registration_validation: RegistrationValidation = {
    validation_id: 'dsc-backend-adapter-registration-validation-v1',
    description:
      'Mandatory checks a registration request must pass after a compatible PHASE-041 report. Checks are declared only; no registration is evaluated in this phase.',
    evaluation: 'collect_all_rejections',
    accept_condition: 'zero rejection codes and compatibility outcome compatible',
    outcome_values: ['accepted', 'rejected'],
    checks: REGISTRATION_VALIDATION_CHECKS,
    requires_compatible_engine_outcome: true,
    evaluates_registrations_in_this_phase: false,
  };

  const adapterRegistration: DirectSpatialConditioningBackendAdapterRegistration = {
    adapter_registration_id: 'direct-spatial-conditioning-backend-adapter-registration-v1',
    phase: DSC_BACKEND_ADAPTER_REGISTRATION_PHASE,
    system_id: DSC_BACKEND_ADAPTER_REGISTRATION_SYSTEM_ID,
    mode: 'design_only_registration',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_REGISTRATION_V1',
    compatibility_engine_ref: BACKEND_COMPATIBILITY_ENGINE_PATH,
    compatibility_engine_phase: DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE,
    compatibility_engine_system_id: DSC_BACKEND_COMPATIBILITY_ENGINE_SYSTEM_ID,
    capability_registry_ref: BACKEND_CAPABILITY_REGISTRY_PATH,
    adapter_foundation_ref: BACKEND_ADAPTER_FOUNDATION_PATH,
    runtime_interface_ref: RUNTIME_INTERFACE_PATH,
    runtime_package_ref: RUNTIME_PACKAGE_PATH,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    registration_flow: {
      flow_id: 'dsc-backend-adapter-registration-flow-v1',
      description:
        'Ordered registration stages a future adapter registrar must execute. Stages are declared only; none are executed in this phase. Compatibility is decided exclusively by the reused PHASE-041 engine.',
      ordered_stages: REGISTRATION_STAGES,
      reuse_policy: {
        compatibility_engine: 'mandatory_exact_reuse',
        capability_registry: 'mandatory_read_only_via_engine',
      },
      accept_condition: 'registration validation accepted and record written',
      reject_condition: 'one or more registration rejection codes emitted',
    },
    registration_schema,
    lifecycle,
    deregistration_policy,
    registration_validation,
    registered_adapters: {
      count: 0,
      entries: [],
      registration_policy:
        'adapter registration is performed by future phases; this phase defines the registration surface only and binds to no backend',
      registers_adapters_in_this_phase: false,
    },
    design_constraints: {
      registration_only: true,
      read_only: true,
      backend_agnostic: true,
      reuses_compatibility_engine: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      registers_adapters_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, BACKEND_ADAPTER_REGISTRATION_PATH, adapterRegistration);
  return { adapterRegistration };
}
