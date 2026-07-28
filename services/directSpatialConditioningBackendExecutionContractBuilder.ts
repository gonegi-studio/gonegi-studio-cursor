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
  DSC_BACKEND_RUNTIME_ROUTER_PHASE,
  DSC_BACKEND_RUNTIME_ROUTER_SYSTEM_ID,
  type DirectSpatialConditioningBackendRuntimeRouter,
} from './directSpatialConditioningBackendRuntimeRouterBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-044: Direct Spatial Conditioning backend execution contract.
 *
 * DESIGN ONLY / READ-ONLY / BACKEND AGNOSTIC. Defines the contract a future
 * backend execution surface MUST satisfy after the PHASE-043 runtime router
 * has selected a registered adapter:
 *   - execution request (inputs required to start an execution),
 *   - execution response (outputs returned when an execution completes),
 *   - execution lifecycle (states and allowed transitions), and
 *   - deterministic execution guarantees (purity and reproducibility rules).
 *
 * Executes no backend, implements no backend, performs no GPU or inference
 * work, and modifies no dataset. Every lifecycle transition is declared, never
 * executed, in this phase. The PHASE-043 runtime router is reused by exact
 * reference; execution is permitted only after a routed outcome.
 */

export const DSC_BACKEND_EXECUTION_CONTRACT_PHASE = 'PHASE-DSC-044' as const;
export const DSC_BACKEND_EXECUTION_CONTRACT_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_BACKEND_EXECUTION_CONTRACT_V1' as const;

export const BACKEND_EXECUTION_CONTRACT_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const BACKEND_EXECUTION_CONTRACT_PATH =
  `${BACKEND_EXECUTION_CONTRACT_ROOT}/direct-spatial-conditioning-backend-execution-contract-v1.json` as const;

export type ExecutionLifecycleState =
  | 'accepted'
  | 'bound'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'released';

export type ExecutionOutcome = 'succeeded' | 'failed' | 'cancelled';

export interface ContractField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface ExecutionRequestSpec {
  request_schema_id: 'dsc-backend-execution-request-v1';
  description: string;
  encoding: 'application/json';
  required_fields: ContractField[];
  optional_fields: [];
  preconditions: string[];
  requires_routed_outcome: true;
  additional_fields: false;
}

export interface ExecutionResponseSpec {
  response_schema_id: 'dsc-backend-execution-response-v1';
  description: string;
  encoding: 'application/json';
  required_fields: ContractField[];
  optional_fields: [];
  outcome_values: ['succeeded', 'failed', 'cancelled'];
  additional_fields: false;
  materializes_tensors: false;
  materializes_frames: false;
}

export interface ExecutionLifecycleTransition {
  from: ExecutionLifecycleState;
  to: ExecutionLifecycleState;
  trigger: string;
  allowed: true;
  side_effects: 'none';
}

export interface ExecutionLifecycle {
  lifecycle_id: 'dsc-backend-execution-lifecycle-v1';
  description: string;
  states: ExecutionLifecycleState[];
  initial_state: 'accepted';
  terminal_states: ['succeeded', 'failed', 'cancelled', 'released'];
  transitions: ExecutionLifecycleTransition[];
  invariants: string[];
  executes_backends_in_this_phase: false;
}

export interface DeterministicExecutionGuarantees {
  guarantees_id: 'dsc-backend-deterministic-execution-guarantees-v1';
  description: string;
  purity: 'deterministic_pure_function_of_request_and_routed_registration';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  backend_agnostic: true;
  same_inputs_same_outcome: true;
  ordering: {
    channel_order: 'foundation_channel_order';
    response_fields: 'response_schema_field_order';
    lifecycle_events: 'lifecycle_transition_order';
  };
  forbidden: string[];
  guarantees: string[];
  executes_backends_in_this_phase: false;
}

export interface DirectSpatialConditioningBackendExecutionContract {
  execution_contract_id: string;
  phase: typeof DSC_BACKEND_EXECUTION_CONTRACT_PHASE;
  system_id: typeof DSC_BACKEND_EXECUTION_CONTRACT_SYSTEM_ID;
  mode: 'design_only_contract';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_EXECUTION_CONTRACT_V1';
  runtime_router_ref: string;
  runtime_router_phase: typeof DSC_BACKEND_RUNTIME_ROUTER_PHASE;
  runtime_router_system_id: typeof DSC_BACKEND_RUNTIME_ROUTER_SYSTEM_ID;
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
  execution_request: ExecutionRequestSpec;
  execution_response: ExecutionResponseSpec;
  execution_lifecycle: ExecutionLifecycle;
  deterministic_execution_guarantees: DeterministicExecutionGuarantees;
  executed_backends: {
    count: 0;
    entries: [];
    execution_policy: string;
    executes_backends_in_this_phase: false;
  };
  design_constraints: {
    contract_only: true;
    read_only: true;
    backend_agnostic: true;
    reuses_runtime_router: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    executes_backends_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const LIFECYCLE_TRANSITIONS: ExecutionLifecycleTransition[] = [
  {
    from: 'accepted',
    to: 'bound',
    trigger: 'conditioning_input_bound_to_selected_registration',
    allowed: true,
    side_effects: 'none',
  },
  {
    from: 'bound',
    to: 'running',
    trigger: 'execution_started_against_routed_adapter',
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
 * Build the design-only, read-only DSC backend execution contract.
 * Reuses the PHASE-043 runtime router by exact reference; writes only the
 * contract artifact. No backend is executed and no upstream artifact is
 * modified.
 */
export function buildDirectSpatialConditioningBackendExecutionContract(
  projectRoot?: string
): { executionContract: DirectSpatialConditioningBackendExecutionContract } {
  const root = resolveProjectRoot(projectRoot);

  const runtimeRouter = readJson<DirectSpatialConditioningBackendRuntimeRouter>(
    root,
    BACKEND_RUNTIME_ROUTER_PATH
  );
  if (
    runtimeRouter.phase !== DSC_BACKEND_RUNTIME_ROUTER_PHASE ||
    runtimeRouter.system_id !== DSC_BACKEND_RUNTIME_ROUTER_SYSTEM_ID
  ) {
    throw new Error('PHASE-043 runtime router is missing or incompatible');
  }
  if (!runtimeRouter.design_constraints.backend_agnostic) {
    throw new Error('Runtime router must remain backend agnostic');
  }
  if (!runtimeRouter.design_constraints.reuses_adapter_registration) {
    throw new Error('Runtime router must reuse adapter registration');
  }
  if (runtimeRouter.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
    throw new Error('Runtime router adapter registration ref drifted');
  }
  if (runtimeRouter.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
    throw new Error('Runtime router compatibility engine ref drifted');
  }
  if (runtimeRouter.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
    throw new Error('Runtime router capability registry ref drifted');
  }
  if (
    JSON.stringify(runtimeRouter.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Runtime router channels do not match foundation channels');
  }
  if (
    JSON.stringify(runtimeRouter.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Runtime router sources_supported drifted from the certified corpus');
  }
  if (runtimeRouter.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Runtime router spatial frame drifted');
  }
  if (
    runtimeRouter.capability_set_id !== CAPABILITY_SET_ID ||
    runtimeRouter.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Runtime router capability set identity drifted');
  }
  if (runtimeRouter.routed_backends.count !== 0) {
    throw new Error('PHASE-043 must not have routed backends in this design stack');
  }
  if (runtimeRouter.routing_report.report_id !== 'dsc-backend-routing-report-v1') {
    throw new Error('Runtime router routing report identity drifted');
  }

  const execution_request: ExecutionRequestSpec = {
    request_schema_id: 'dsc-backend-execution-request-v1',
    description:
      'Shape of one backend execution request. Execution is accepted only after a PHASE-043 routing report with outcome routed and a selected active registration.',
    encoding: 'application/json',
    required_fields: [
      {
        field: 'execution_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque execution identity; carries no vendor, framework, or device semantics',
      },
      {
        field: 'routing_report_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'reference to the PHASE-043 routing report that selected the registration',
      },
      {
        field: 'routing_outcome',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal routed',
      },
      {
        field: 'selected_registration_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'opaque registration_id copied from the routing report selected_registration_id',
      },
      {
        field: 'selected_backend_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'opaque backend_id copied from the routing report selected_backend_id',
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
      'selected registration must still be lifecycle active at bind time',
      'adapted conditioning input must reference dsc_adapted_conditioning_input_v1',
      'spatial frame must equal normalized_image_plane_v1',
      'channel order must equal the foundation channel order',
      'no backend implementation, GPU, or inference path is required to accept the request',
    ],
    requires_routed_outcome: true,
    additional_fields: false,
  };

  const execution_response: ExecutionResponseSpec = {
    response_schema_id: 'dsc-backend-execution-response-v1',
    description:
      'Shape of one backend execution response. Outcomes are succeeded, failed, or cancelled; response emission materializes no tensors or frames.',
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
        field: 'selected_registration_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque registration_id copied from the request',
      },
      {
        field: 'selected_backend_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque backend_id copied from the request',
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
          'zero or more DSC_BACKEND_EXECUTION_* codes; empty iff outcome is succeeded',
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

  const execution_lifecycle: ExecutionLifecycle = {
    lifecycle_id: 'dsc-backend-execution-lifecycle-v1',
    description:
      'Lifecycle states and allowed transitions for one backend execution. Terminal business outcomes are succeeded, failed, and cancelled; released is the terminal resource state after handle release.',
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
      'bound requires a routed registration and an adapted conditioning input binding',
      'running may transition only to succeeded, failed, or cancelled',
      'succeeded, failed, and cancelled always release to released',
      'no lifecycle transition invokes GPU, inference, or dataset modification',
      'requested_at and completed_at are audit fields and never gate transitions',
    ],
    executes_backends_in_this_phase: false,
  };

  const deterministic_execution_guarantees: DeterministicExecutionGuarantees = {
    guarantees_id: 'dsc-backend-deterministic-execution-guarantees-v1',
    description:
      'Determinism rules a future execution implementation must satisfy. Guarantees are declared only; no backend is executed in this phase.',
    purity: 'deterministic_pure_function_of_request_and_routed_registration',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    backend_agnostic: true,
    same_inputs_same_outcome: true,
    ordering: {
      channel_order: 'foundation_channel_order',
      response_fields: 'response_schema_field_order',
      lifecycle_events: 'lifecycle_transition_order',
    },
    forbidden: [
      'non-deterministic selection among equal registrations',
      'wall-clock dependence in outcome or result_digest',
      'random sampling during execution',
      'gpu or inference execution in this contract phase',
      'tensor or frame materialization in the response',
      'dataset modification during execution',
      'bypassing the PHASE-043 routed registration',
    ],
    guarantees: [
      'identical execution requests against the same routed registration produce the same outcome and result_digest',
      'channel order in request and response equals the foundation channel order',
      'failure_codes are empty if and only if outcome is succeeded',
      'unroutable or fallback routing outcomes never enter accepted',
      'audit timestamps may differ across runs without changing result_digest',
      'execution never invents a backend outside the routed registration',
    ],
    executes_backends_in_this_phase: false,
  };

  const executionContract: DirectSpatialConditioningBackendExecutionContract = {
    execution_contract_id: 'direct-spatial-conditioning-backend-execution-contract-v1',
    phase: DSC_BACKEND_EXECUTION_CONTRACT_PHASE,
    system_id: DSC_BACKEND_EXECUTION_CONTRACT_SYSTEM_ID,
    mode: 'design_only_contract',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_EXECUTION_CONTRACT_V1',
    runtime_router_ref: BACKEND_RUNTIME_ROUTER_PATH,
    runtime_router_phase: DSC_BACKEND_RUNTIME_ROUTER_PHASE,
    runtime_router_system_id: DSC_BACKEND_RUNTIME_ROUTER_SYSTEM_ID,
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
    executed_backends: {
      count: 0,
      entries: [],
      execution_policy:
        'backend execution is performed by future phases; this phase defines the execution contract only and binds to no backend',
      executes_backends_in_this_phase: false,
    },
    design_constraints: {
      contract_only: true,
      read_only: true,
      backend_agnostic: true,
      reuses_runtime_router: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      executes_backends_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, BACKEND_EXECUTION_CONTRACT_PATH, executionContract);
  return { executionContract };
}
