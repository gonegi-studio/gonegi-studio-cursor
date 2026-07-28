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
import {
  DSC_VENDOR_ROUTER_PHASE,
  DSC_VENDOR_ROUTER_SYSTEM_ID,
  VENDOR_ROUTER_PATH,
  type DirectSpatialConditioningVendorRouter,
} from './directSpatialConditioningVendorRouterBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-060: Direct Spatial Conditioning vendor execution contract.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines the contract a future
 * vendor execution surface MUST satisfy after the certified PHASE-059 vendor
 * router has selected a compatible registration:
 *   - execution request (inputs required to start an execution),
 *   - execution response (outputs returned when an execution completes),
 *   - execution lifecycle (states and allowed transitions), and
 *   - deterministic execution guarantees (purity and reproducibility rules).
 *
 * Executes no vendor, implements no vendor, performs no GPU or inference
 * work, and modifies no dataset. Every lifecycle transition is declared, never
 * executed, in this phase. The PHASE-059 vendor router is reused by exact
 * reference (its PASS target is the certification reused here); execution is
 * permitted only after a routed outcome.
 */

export const DSC_VENDOR_EXECUTION_CONTRACT_PHASE = 'PHASE-DSC-060' as const;
export const DSC_VENDOR_EXECUTION_CONTRACT_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_EXECUTION_CONTRACT_V1' as const;

export const VENDOR_EXECUTION_CONTRACT_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_EXECUTION_CONTRACT_PATH =
  `${VENDOR_EXECUTION_CONTRACT_ROOT}/direct-spatial-conditioning-vendor-execution-contract-v1.json` as const;

export type VendorExecutionLifecycleState =
  | 'accepted'
  | 'bound'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'released';

export type VendorExecutionOutcome = 'succeeded' | 'failed' | 'cancelled';

export interface ContractField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorExecutionRequestSpec {
  request_schema_id: 'dsc-vendor-execution-request-v1';
  description: string;
  encoding: 'application/json';
  required_fields: ContractField[];
  optional_fields: [];
  preconditions: string[];
  requires_routed_outcome: true;
  additional_fields: false;
}

export interface VendorExecutionResponseSpec {
  response_schema_id: 'dsc-vendor-execution-response-v1';
  description: string;
  encoding: 'application/json';
  required_fields: ContractField[];
  optional_fields: [];
  outcome_values: ['succeeded', 'failed', 'cancelled'];
  additional_fields: false;
  materializes_tensors: false;
  materializes_frames: false;
}

export interface VendorExecutionLifecycleTransition {
  from: VendorExecutionLifecycleState;
  to: VendorExecutionLifecycleState;
  trigger: string;
  allowed: true;
  side_effects: 'none';
}

export interface VendorExecutionLifecycle {
  lifecycle_id: 'dsc-vendor-execution-lifecycle-v1';
  description: string;
  states: VendorExecutionLifecycleState[];
  initial_state: 'accepted';
  terminal_states: ['succeeded', 'failed', 'cancelled', 'released'];
  transitions: VendorExecutionLifecycleTransition[];
  invariants: string[];
  executes_vendors_in_this_phase: false;
}

export interface VendorDeterministicExecutionGuarantees {
  guarantees_id: 'dsc-vendor-deterministic-execution-guarantees-v1';
  description: string;
  purity: 'deterministic_pure_function_of_request_and_routed_vendor_registration';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  vendor_neutral: true;
  same_inputs_same_outcome: true;
  ordering: {
    channel_order: 'foundation_channel_order';
    response_fields: 'response_schema_field_order';
    lifecycle_events: 'lifecycle_transition_order';
  };
  forbidden: string[];
  guarantees: string[];
  executes_vendors_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorExecutionContract {
  vendor_execution_contract_id: string;
  phase: typeof DSC_VENDOR_EXECUTION_CONTRACT_PHASE;
  system_id: typeof DSC_VENDOR_EXECUTION_CONTRACT_SYSTEM_ID;
  mode: 'design_only_vendor_execution_contract';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_EXECUTION_CONTRACT_V1';
  vendor_router_ref: string;
  vendor_router_phase: typeof DSC_VENDOR_ROUTER_PHASE;
  vendor_router_system_id: typeof DSC_VENDOR_ROUTER_SYSTEM_ID;
  vendor_compatibility_ref: string;
  vendor_registry_ref: string;
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
  execution_request: VendorExecutionRequestSpec;
  execution_response: VendorExecutionResponseSpec;
  execution_lifecycle: VendorExecutionLifecycle;
  deterministic_execution_guarantees: VendorDeterministicExecutionGuarantees;
  executed_vendors: {
    count: 0;
    entries: [];
    execution_policy: string;
    executes_vendors_in_this_phase: false;
  };
  design_constraints: {
    contract_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_vendor_router: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    executes_vendors_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const LIFECYCLE_TRANSITIONS: VendorExecutionLifecycleTransition[] = [
  {
    from: 'accepted',
    to: 'bound',
    trigger: 'conditioning_input_bound_to_selected_vendor_registration',
    allowed: true,
    side_effects: 'none',
  },
  {
    from: 'bound',
    to: 'running',
    trigger: 'execution_started_against_routed_vendor',
    allowed: true,
    side_effects: 'none',
  },
  {
    from: 'running',
    to: 'succeeded',
    trigger: 'execution_completed_with_valid_response',
    allowed: true,
    side_effects: 'none',
  },
  {
    from: 'running',
    to: 'failed',
    trigger: 'execution_failed_with_declared_failure_code',
    allowed: true,
    side_effects: 'none',
  },
  {
    from: 'running',
    to: 'cancelled',
    trigger: 'execution_cancelled_by_caller_or_policy',
    allowed: true,
    side_effects: 'none',
  },
  {
    from: 'accepted',
    to: 'cancelled',
    trigger: 'execution_cancelled_before_bind',
    allowed: true,
    side_effects: 'none',
  },
  {
    from: 'bound',
    to: 'cancelled',
    trigger: 'execution_cancelled_before_running',
    allowed: true,
    side_effects: 'none',
  },
  {
    from: 'succeeded',
    to: 'released',
    trigger: 'binding_handle_released_after_success',
    allowed: true,
    side_effects: 'none',
  },
  {
    from: 'failed',
    to: 'released',
    trigger: 'binding_handle_released_after_failure',
    allowed: true,
    side_effects: 'none',
  },
  {
    from: 'cancelled',
    to: 'released',
    trigger: 'binding_handle_released_after_cancellation',
    allowed: true,
    side_effects: 'none',
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
 * Build the design-only, read-only, vendor-neutral DSC vendor execution
 * contract. Reuses the certified PHASE-059 vendor router by exact reference
 * (its PASS target is the certification reused here); writes only the
 * contract artifact. No vendor is executed and no upstream artifact is
 * modified.
 */
export function buildDirectSpatialConditioningVendorExecutionContract(
  projectRoot?: string
): { vendorExecutionContract: DirectSpatialConditioningVendorExecutionContract } {
  const root = resolveProjectRoot(projectRoot);

  const familyCertification = readJson<{ certified?: boolean }>(
    root,
    BACKEND_FAMILY_CERTIFICATION_PATH
  );
  if (familyCertification.certified !== true) {
    throw new Error('PHASE-054 backend family is not certified');
  }

  const vendorRouter = readJson<DirectSpatialConditioningVendorRouter>(
    root,
    VENDOR_ROUTER_PATH
  );
  if (
    vendorRouter.phase !== DSC_VENDOR_ROUTER_PHASE ||
    vendorRouter.system_id !== DSC_VENDOR_ROUTER_SYSTEM_ID
  ) {
    throw new Error('PHASE-059 vendor router is missing or incompatible');
  }
  if (
    vendorRouter.target !== 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_ROUTER_V1'
  ) {
    throw new Error('Vendor router target is not the certified PASS verdict');
  }
  if (!vendorRouter.design_constraints.vendor_neutral) {
    throw new Error('Vendor router must remain vendor neutral');
  }
  if (!vendorRouter.design_constraints.reuses_vendor_compatibility) {
    throw new Error('Vendor router must reuse vendor compatibility');
  }
  if (!vendorRouter.design_constraints.no_vendor_implementation) {
    throw new Error('Vendor router must forbid vendor implementation');
  }
  if (vendorRouter.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH) {
    throw new Error('Vendor router vendor compatibility ref drifted');
  }
  if (vendorRouter.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
    throw new Error('Vendor router vendor registry ref drifted');
  }
  if (vendorRouter.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
    throw new Error('Vendor router vendor profile ref drifted');
  }
  if (
    JSON.stringify(vendorRouter.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor router channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRouter.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Vendor router sources_supported drifted from the certified corpus');
  }
  if (vendorRouter.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor router spatial frame drifted');
  }
  if (
    vendorRouter.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRouter.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor router capability set identity drifted');
  }
  if (vendorRouter.routed_vendors.count !== 0) {
    throw new Error('PHASE-059 must not have routed vendors in this design stack');
  }
  if (vendorRouter.routing_report.report_id !== 'dsc-vendor-routing-report-v1') {
    throw new Error('Vendor router routing report identity drifted');
  }
  if (
    vendorRouter.deterministic_routing_policy.policy_id !==
    'dsc-vendor-deterministic-routing-policy-v1'
  ) {
    throw new Error('Vendor router routing policy identity drifted');
  }

  const execution_request: VendorExecutionRequestSpec = {
    request_schema_id: 'dsc-vendor-execution-request-v1',
    description:
      'Shape of one vendor execution request. Execution is accepted only after a PHASE-059 routing report with outcome routed and a selected active compatible vendor registration.',
    encoding: 'application/json',
    required_fields: [
      {
        field: 'execution_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque execution identity; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'routing_report_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'reference to the PHASE-059 vendor routing report that selected the registration',
      },
      {
        field: 'routing_outcome',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal routed',
      },
      {
        field: 'selected_vendor_registration_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'opaque vendor_registration_id copied from the routing report selected_vendor_registration_id',
      },
      {
        field: 'selected_vendor_handle',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'opaque_vendor_handle copied from the routing report selected_vendor_handle',
      },
      {
        field: 'adapted_conditioning_input_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'reference to dsc_adapted_conditioning_input_v1 produced by the packet adapter',
      },
      {
        field: 'capability_set_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must be a supported version of ${CAPABILITY_SET_ID}`,
      },
      {
        field: 'spatial_frame_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${SPATIAL_FRAME.frame_id}`,
      },
      {
        field: 'channel_order',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'must equal the six required channels in fixed foundation order',
      },
      {
        field: 'requested_at',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'ISO-8601 timestamp recorded for audit only; must not affect deterministic outcome',
      },
    ],
    optional_fields: [],
    preconditions: [
      'routing report outcome must equal routed',
      'selected vendor registration must still be lifecycle active at bind time',
      'selected vendor registration must remain compatible under PHASE-057 rules',
      'adapted conditioning input must reference dsc_adapted_conditioning_input_v1',
      'spatial frame must equal normalized_image_plane_v1',
      'channel order must equal the foundation channel order',
      'no vendor implementation, GPU, or inference path is required to accept the request',
    ],
    requires_routed_outcome: true,
    additional_fields: false,
  };

  const execution_response: VendorExecutionResponseSpec = {
    response_schema_id: 'dsc-vendor-execution-response-v1',
    description:
      'Shape of one vendor execution response. Outcomes are succeeded, failed, or cancelled; response emission materializes no tensors or frames.',
    encoding: 'application/json',
    required_fields: [
      {
        field: 'execution_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque execution_id copied from the request',
      },
      {
        field: 'outcome',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must be one of outcome_values',
      },
      {
        field: 'selected_vendor_registration_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque vendor_registration_id copied from the request',
      },
      {
        field: 'selected_vendor_handle',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque_vendor_handle copied from the request',
      },
      {
        field: 'lifecycle_state',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'must be succeeded, failed, or cancelled at response emission; released follows later',
      },
      {
        field: 'routing_report_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'same routing_report_ref as the request',
      },
      {
        field: 'result_digest',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'sha256 hex digest of the canonical response payload excluding requested_at and wall-clock fields; empty string when outcome is cancelled before bind',
      },
      {
        field: 'failure_codes',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint:
          'zero or more DSC_VENDOR_EXECUTION_* codes; empty iff outcome is succeeded',
      },
      {
        field: 'spatial_frame_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${SPATIAL_FRAME.frame_id}`,
      },
      {
        field: 'channel_order',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'must equal the request channel_order',
      },
      {
        field: 'completed_at',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'ISO-8601 timestamp recorded for audit only; must not affect deterministic outcome',
      },
    ],
    optional_fields: [],
    outcome_values: ['succeeded', 'failed', 'cancelled'],
    additional_fields: false,
    materializes_tensors: false,
    materializes_frames: false,
  };

  const execution_lifecycle: VendorExecutionLifecycle = {
    lifecycle_id: 'dsc-vendor-execution-lifecycle-v1',
    description:
      'Lifecycle states and allowed transitions for one vendor execution. Terminal business outcomes are succeeded, failed, and cancelled; released is the terminal resource state after handle release.',
    states: [
      'accepted',
      'bound',
      'running',
      'succeeded',
      'failed',
      'cancelled',
      'released',
    ],
    initial_state: 'accepted',
    terminal_states: ['succeeded', 'failed', 'cancelled', 'released'],
    transitions: LIFECYCLE_TRANSITIONS,
    invariants: [
      'every execution begins in accepted after request validation',
      'bound requires a routed vendor registration and an adapted conditioning input binding',
      'running may transition only to succeeded, failed, or cancelled',
      'succeeded, failed, and cancelled always release to released',
      'no lifecycle transition invokes GPU, inference, or dataset modification',
      'requested_at and completed_at are audit fields and never gate transitions',
      'no lifecycle transition invents a vendor outside the routed registration',
    ],
    executes_vendors_in_this_phase: false,
  };

  const deterministic_execution_guarantees: VendorDeterministicExecutionGuarantees = {
    guarantees_id: 'dsc-vendor-deterministic-execution-guarantees-v1',
    description:
      'Determinism rules a future vendor execution implementation must satisfy. Guarantees are declared only; no vendor is executed in this phase.',
    purity: 'deterministic_pure_function_of_request_and_routed_vendor_registration',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    vendor_neutral: true,
    same_inputs_same_outcome: true,
    ordering: {
      channel_order: 'foundation_channel_order',
      response_fields: 'response_schema_field_order',
      lifecycle_events: 'lifecycle_transition_order',
    },
    forbidden: [
      'non-deterministic selection among equal vendor registrations',
      'wall-clock dependence in outcome or result_digest',
      'random sampling during execution',
      'gpu or inference execution in this contract phase',
      'tensor or frame materialization in the response',
      'dataset modification during execution',
      'bypassing the PHASE-059 routed vendor registration',
      'embedding a concrete vendor name, framework, or device in execution identity',
    ],
    guarantees: [
      'identical execution requests against the same routed vendor registration produce the same outcome and result_digest',
      'channel order in request and response equals the foundation channel order',
      'failure_codes are empty if and only if outcome is succeeded',
      'unroutable or fallback routing outcomes never enter accepted',
      'audit timestamps may differ across runs without changing result_digest',
      'execution never invents a vendor outside the routed registration',
      'execution identity remains opaque and vendor-neutral',
    ],
    executes_vendors_in_this_phase: false,
  };

  const vendorExecutionContract: DirectSpatialConditioningVendorExecutionContract = {
    vendor_execution_contract_id:
      'direct-spatial-conditioning-vendor-execution-contract-v1',
    phase: DSC_VENDOR_EXECUTION_CONTRACT_PHASE,
    system_id: DSC_VENDOR_EXECUTION_CONTRACT_SYSTEM_ID,
    mode: 'design_only_vendor_execution_contract',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_EXECUTION_CONTRACT_V1',
    vendor_router_ref: VENDOR_ROUTER_PATH,
    vendor_router_phase: DSC_VENDOR_ROUTER_PHASE,
    vendor_router_system_id: DSC_VENDOR_ROUTER_SYSTEM_ID,
    vendor_compatibility_ref: VENDOR_COMPATIBILITY_PATH,
    vendor_registry_ref: VENDOR_REGISTRY_PATH,
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
    execution_request,
    execution_response,
    execution_lifecycle,
    deterministic_execution_guarantees,
    executed_vendors: {
      count: 0,
      entries: [],
      execution_policy:
        'vendor execution is performed by future phases; this phase defines the execution contract only and binds to no vendor',
      executes_vendors_in_this_phase: false,
    },
    design_constraints: {
      contract_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_vendor_router: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      executes_vendors_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_EXECUTION_CONTRACT_PATH, vendorExecutionContract);
  return { vendorExecutionContract };
}
