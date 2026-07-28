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
  DSC_BACKEND_ADAPTER_REGISTRATION_PHASE,
  DSC_BACKEND_ADAPTER_REGISTRATION_SYSTEM_ID,
  type DirectSpatialConditioningBackendAdapterRegistration,
} from './directSpatialConditioningBackendAdapterRegistrationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-043: Direct Spatial Conditioning backend runtime router.
 *
 * DESIGN ONLY / READ-ONLY / BACKEND AGNOSTIC. Defines how a future DSC runtime
 * selects among registered backend adapters using the frozen PHASE-042
 * registration surface:
 *   - backend selection flow (ordered stages),
 *   - deterministic routing policy (stable tie-breaking over active registrations),
 *   - fallback policy (what happens when no route is selected), and
 *   - routing report (shape of the selection result).
 *
 * Selects no backend, implements no backend, evaluates no live registration, and
 * performs no GPU, inference, or dataset modification. Every stage is declared,
 * never executed, in this phase. The PHASE-042 adapter registration is reused by
 * exact reference; only active registrations are eligible for routing.
 */

export const DSC_BACKEND_RUNTIME_ROUTER_PHASE = 'PHASE-DSC-043' as const;
export const DSC_BACKEND_RUNTIME_ROUTER_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_BACKEND_RUNTIME_ROUTER_V1' as const;

export const BACKEND_RUNTIME_ROUTER_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const BACKEND_RUNTIME_ROUTER_PATH =
  `${BACKEND_RUNTIME_ROUTER_ROOT}/direct-spatial-conditioning-backend-runtime-router-v1.json` as const;

export type SelectionStageId =
  | 'bind_routing_request'
  | 'lookup_active_registrations'
  | 'filter_eligible_adapters'
  | 'rank_candidates'
  | 'select_primary_route'
  | 'apply_fallback_if_needed'
  | 'emit_routing_report';

export type RoutingOutcome = 'routed' | 'fallback' | 'unroutable';

export interface SelectionStage {
  stage_id: SelectionStageId;
  order: number;
  description: string;
  inputs: string[];
  outputs: string[];
  side_effects: 'none';
  executed_in_this_phase: false;
}

export interface RankingKey {
  key_id: string;
  order: number;
  field: string;
  direction: 'ascending' | 'descending';
  description: string;
}

export interface DeterministicRoutingPolicy {
  policy_id: 'dsc-backend-deterministic-routing-policy-v1';
  description: string;
  eligibility: {
    lifecycle_state_required: 'active';
    compatibility_outcome_required: 'compatible';
    capability_set_id_required: typeof CAPABILITY_SET_ID;
    spatial_frame_required: typeof SPATIAL_FRAME.frame_id;
    channel_coverage_required: 'exact_foundation_order';
  };
  ranking_keys: RankingKey[];
  selection_rule: 'first_after_stable_sort';
  tie_breakers: string[];
  purity: 'deterministic_pure_function';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  backend_invocation: 'none';
  selects_backends_in_this_phase: false;
}

export interface FallbackBranch {
  branch_id: string;
  condition: string;
  action: string;
  outcome: RoutingOutcome;
  rejection_or_code: string | null;
}

export interface FallbackPolicy {
  policy_id: 'dsc-backend-routing-fallback-policy-v1';
  description: string;
  primary_exhausted_behavior: 'evaluate_fallback_branches_in_order';
  branches: FallbackBranch[];
  forbidden: string[];
  never_invents_backend: true;
  never_bypasses_registration: true;
  executed_in_this_phase: false;
}

export interface RoutingReportField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface RoutingReportSchema {
  report_schema_id: 'dsc-backend-routing-report-schema-v1';
  report_id: 'dsc-backend-routing-report-v1';
  description: string;
  encoding: 'application/json';
  required_fields: RoutingReportField[];
  outcome_values: ['routed', 'fallback', 'unroutable'];
  candidate_entry_shape: {
    fields: string[];
  };
  ordering: {
    candidates_considered: 'ranking_key_order';
    rejected_candidates: 'ranking_key_order';
  };
  additional_fields: false;
  materializes_tensors: false;
  materializes_frames: false;
}

export interface DirectSpatialConditioningBackendRuntimeRouter {
  runtime_router_id: string;
  phase: typeof DSC_BACKEND_RUNTIME_ROUTER_PHASE;
  system_id: typeof DSC_BACKEND_RUNTIME_ROUTER_SYSTEM_ID;
  mode: 'design_only_router';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_RUNTIME_ROUTER_V1';
  adapter_registration_ref: string;
  adapter_registration_phase: typeof DSC_BACKEND_ADAPTER_REGISTRATION_PHASE;
  adapter_registration_system_id: typeof DSC_BACKEND_ADAPTER_REGISTRATION_SYSTEM_ID;
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
  selection_flow: {
    flow_id: 'dsc-backend-selection-flow-v1';
    description: string;
    ordered_stages: SelectionStage[];
    reuse_policy: {
      adapter_registration: 'mandatory_exact_reuse';
      compatibility_engine: 'mandatory_read_only_via_registration';
    };
    accept_condition: 'routing report outcome is routed or fallback with declared branch';
    reject_condition: 'routing report outcome is unroutable';
    outcome_values: ['routed', 'fallback', 'unroutable'];
  };
  deterministic_routing_policy: DeterministicRoutingPolicy;
  fallback_policy: FallbackPolicy;
  routing_report: RoutingReportSchema;
  routed_backends: {
    count: 0;
    entries: [];
    routing_policy: string;
    routes_backends_in_this_phase: false;
  };
  design_constraints: {
    router_only: true;
    read_only: true;
    backend_agnostic: true;
    reuses_adapter_registration: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    routes_backends_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const SELECTION_STAGES: SelectionStage[] = [
  {
    stage_id: 'bind_routing_request',
    order: 1,
    description:
      'Bind the opaque routing request, adapted conditioning input reference, and optional preferred registration_id as immutable routing inputs. No backend is invoked.',
    inputs: [
      'routing_request',
      'adapted_conditioning_input_ref',
      'optional_preferred_registration_id',
    ],
    outputs: ['bound_routing_inputs'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'lookup_active_registrations',
    order: 2,
    description:
      'Read the PHASE-042 registration surface and collect registrations whose lifecycle_state is active. Lookup is read-only and never mutates registration records.',
    inputs: ['bound_routing_inputs', 'adapter_registration_ref'],
    outputs: ['active_registration_snapshot'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'filter_eligible_adapters',
    order: 3,
    description:
      'Apply the deterministic routing eligibility rules (active lifecycle, compatible outcome, capability set, spatial frame, exact channel coverage).',
    inputs: ['active_registration_snapshot', 'bound_routing_inputs'],
    outputs: ['eligible_candidates', 'rejected_candidates'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'rank_candidates',
    order: 4,
    description:
      'Stable-sort eligible candidates by the declared ranking keys. Sorting is pure, seedless, and time-independent.',
    inputs: ['eligible_candidates'],
    outputs: ['ranked_candidates'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'select_primary_route',
    order: 5,
    description:
      'Select the first candidate after stable sort as the primary route. If a preferred registration_id is bound and still eligible, it is forced to rank first only when it already satisfies eligibility.',
    inputs: ['ranked_candidates', 'bound_routing_inputs'],
    outputs: ['primary_route_or_null'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'apply_fallback_if_needed',
    order: 6,
    description:
      'If no primary route exists, evaluate fallback branches in declaration order. Fallback never invents a backend and never bypasses registration.',
    inputs: ['primary_route_or_null', 'rejected_candidates'],
    outputs: ['routing_outcome', 'fallback_branch_or_null'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'emit_routing_report',
    order: 7,
    description:
      'Emit the routing report conforming to the routing report schema. Report emission is the only declared output of the flow.',
    inputs: [
      'bound_routing_inputs',
      'ranked_candidates',
      'rejected_candidates',
      'primary_route_or_null',
      'routing_outcome',
      'fallback_branch_or_null',
    ],
    outputs: ['routing_report'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
];

const RANKING_KEYS: RankingKey[] = [
  {
    key_id: 'preferred_registration_first',
    order: 1,
    field: 'matches_preferred_registration_id',
    direction: 'descending',
    description:
      'Eligible preferred registration_id, when present, ranks before all other eligible candidates.',
  },
  {
    key_id: 'capability_set_version_desc',
    order: 2,
    field: 'capability_set_version',
    direction: 'descending',
    description:
      'Higher supported capability_set_version ranks first within the same major.',
  },
  {
    key_id: 'backend_version_asc',
    order: 3,
    field: 'backend_version',
    direction: 'ascending',
    description:
      'Lexicographically smaller backend_version ranks first to keep ties stable and backend-agnostic.',
  },
  {
    key_id: 'registration_id_asc',
    order: 4,
    field: 'registration_id',
    direction: 'ascending',
    description:
      'Opaque registration_id ascending is the final deterministic tie-breaker.',
  },
];

const FALLBACK_BRANCHES: FallbackBranch[] = [
  {
    branch_id: 'no_active_registrations',
    condition: 'active_registration_snapshot is empty',
    action: 'emit unroutable report with DSC_BACKEND_ROUTING_NO_ACTIVE_REGISTRATION',
    outcome: 'unroutable',
    rejection_or_code: 'DSC_BACKEND_ROUTING_NO_ACTIVE_REGISTRATION',
  },
  {
    branch_id: 'active_but_none_eligible',
    condition: 'active registrations exist but eligible_candidates is empty',
    action: 'emit unroutable report with DSC_BACKEND_ROUTING_NO_ELIGIBLE_ADAPTER',
    outcome: 'unroutable',
    rejection_or_code: 'DSC_BACKEND_ROUTING_NO_ELIGIBLE_ADAPTER',
  },
  {
    branch_id: 'preferred_ineligible_use_next_ranked',
    condition:
      'preferred registration_id was bound but became ineligible; ranked eligible candidates remain',
    action: 'select first ranked eligible candidate and mark outcome routed',
    outcome: 'routed',
    rejection_or_code: null,
  },
  {
    branch_id: 'explicit_unroutable_terminal',
    condition: 'no primary route and no earlier fallback branch matched',
    action: 'emit unroutable report with DSC_BACKEND_ROUTING_UNROUTABLE',
    outcome: 'unroutable',
    rejection_or_code: 'DSC_BACKEND_ROUTING_UNROUTABLE',
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
 * Build the design-only, read-only DSC backend runtime router.
 * Reuses the PHASE-042 adapter registration by exact reference; writes only the
 * router artifact. No backend is selected and no upstream artifact is modified.
 */
export function buildDirectSpatialConditioningBackendRuntimeRouter(
  projectRoot?: string
): { runtimeRouter: DirectSpatialConditioningBackendRuntimeRouter } {
  const root = resolveProjectRoot(projectRoot);

  const adapterRegistration = readJson<DirectSpatialConditioningBackendAdapterRegistration>(
    root,
    BACKEND_ADAPTER_REGISTRATION_PATH
  );
  if (
    adapterRegistration.phase !== DSC_BACKEND_ADAPTER_REGISTRATION_PHASE ||
    adapterRegistration.system_id !== DSC_BACKEND_ADAPTER_REGISTRATION_SYSTEM_ID
  ) {
    throw new Error('PHASE-042 adapter registration is missing or incompatible');
  }
  if (!adapterRegistration.design_constraints.backend_agnostic) {
    throw new Error('Adapter registration must remain backend agnostic');
  }
  if (!adapterRegistration.design_constraints.reuses_compatibility_engine) {
    throw new Error('Adapter registration must reuse the compatibility engine');
  }
  if (adapterRegistration.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
    throw new Error('Adapter registration compatibility engine ref drifted');
  }
  if (adapterRegistration.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
    throw new Error('Adapter registration capability registry ref drifted');
  }
  if (
    JSON.stringify(adapterRegistration.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Adapter registration channels do not match foundation channels');
  }
  if (
    JSON.stringify(adapterRegistration.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Adapter registration sources_supported drifted from the certified corpus');
  }
  if (adapterRegistration.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Adapter registration spatial frame drifted');
  }
  if (
    adapterRegistration.capability_set_id !== CAPABILITY_SET_ID ||
    adapterRegistration.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Adapter registration capability set identity drifted');
  }
  if (adapterRegistration.lifecycle.active_state !== 'active') {
    throw new Error('Adapter registration active lifecycle state drifted');
  }
  if (adapterRegistration.registered_adapters.count !== 0) {
    throw new Error('PHASE-042 must not have registered adapters in this design stack');
  }

  const deterministic_routing_policy: DeterministicRoutingPolicy = {
    policy_id: 'dsc-backend-deterministic-routing-policy-v1',
    description:
      'Pure, seedless, time-independent policy that ranks eligible active registrations and selects the first after stable sort. Declared only; never executed in this phase.',
    eligibility: {
      lifecycle_state_required: 'active',
      compatibility_outcome_required: 'compatible',
      capability_set_id_required: CAPABILITY_SET_ID,
      spatial_frame_required: SPATIAL_FRAME.frame_id,
      channel_coverage_required: 'exact_foundation_order',
    },
    ranking_keys: RANKING_KEYS,
    selection_rule: 'first_after_stable_sort',
    tie_breakers: [
      'stages execute strictly in selection_flow order',
      'ranking keys apply in ascending key order',
      'stable sort preserves relative order for equal keys until a later key decides',
      'registration_id ascending is the final tie-breaker and never depends on wall clock',
    ],
    purity: 'deterministic_pure_function',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    backend_invocation: 'none',
    selects_backends_in_this_phase: false,
  };

  const fallback_policy: FallbackPolicy = {
    policy_id: 'dsc-backend-routing-fallback-policy-v1',
    description:
      'Ordered fallback branches evaluated only when select_primary_route yields no route. Fallback never invents a backend and never bypasses the PHASE-042 registration surface.',
    primary_exhausted_behavior: 'evaluate_fallback_branches_in_order',
    branches: FALLBACK_BRANCHES,
    forbidden: [
      'inventing an unregistered backend',
      'routing a pending, suspended, or deregistered registration',
      'bypassing PHASE-042 registration uniqueness or lifecycle rules',
      'gpu or inference execution during fallback',
      'dataset modification during fallback',
      'non-deterministic random selection among candidates',
    ],
    never_invents_backend: true,
    never_bypasses_registration: true,
    executed_in_this_phase: false,
  };

  const routing_report: RoutingReportSchema = {
    report_schema_id: 'dsc-backend-routing-report-schema-v1',
    report_id: 'dsc-backend-routing-report-v1',
    description:
      'Typed report schema for the routing decision emitted by emit_routing_report. Outcome is routed, fallback, or unroutable; additional fields are forbidden.',
    encoding: 'application/json',
    required_fields: [
      {
        field: 'routing_request_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque caller-assigned routing request identity',
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
        constraint:
          'opaque registration_id when outcome is routed; empty string when unroutable or when fallback does not select a registration',
      },
      {
        field: 'selected_backend_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'opaque backend_id copied from the selected registration when routed; empty string otherwise',
      },
      {
        field: 'fallback_branch_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'fallback branch_id when outcome is fallback or an unroutable fallback branch fired; empty string when routed without fallback',
      },
      {
        field: 'candidates_considered',
        type: 'array<candidate_entry>',
        required: true,
        nullable: false,
        constraint: 'eligible candidates after ranking, in ranking key order',
      },
      {
        field: 'rejected_candidates',
        type: 'array<candidate_entry>',
        required: true,
        nullable: false,
        constraint: 'active but ineligible candidates, in ranking key order',
      },
      {
        field: 'routing_codes',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint:
          'zero or more DSC_BACKEND_ROUTING_* codes; empty iff outcome is routed without fallback codes',
      },
      {
        field: 'capability_set_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'capability_set_version of the selected registration, or empty when unroutable',
      },
      {
        field: 'spatial_frame_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${SPATIAL_FRAME.frame_id}`,
      },
    ],
    outcome_values: ['routed', 'fallback', 'unroutable'],
    candidate_entry_shape: {
      fields: [
        'registration_id',
        'backend_id',
        'lifecycle_state',
        'capability_set_version',
        'eligibility',
        'rank_index_or_null',
        'rejection_code_or_null',
      ],
    },
    ordering: {
      candidates_considered: 'ranking_key_order',
      rejected_candidates: 'ranking_key_order',
    },
    additional_fields: false,
    materializes_tensors: false,
    materializes_frames: false,
  };

  const runtimeRouter: DirectSpatialConditioningBackendRuntimeRouter = {
    runtime_router_id: 'direct-spatial-conditioning-backend-runtime-router-v1',
    phase: DSC_BACKEND_RUNTIME_ROUTER_PHASE,
    system_id: DSC_BACKEND_RUNTIME_ROUTER_SYSTEM_ID,
    mode: 'design_only_router',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_RUNTIME_ROUTER_V1',
    adapter_registration_ref: BACKEND_ADAPTER_REGISTRATION_PATH,
    adapter_registration_phase: DSC_BACKEND_ADAPTER_REGISTRATION_PHASE,
    adapter_registration_system_id: DSC_BACKEND_ADAPTER_REGISTRATION_SYSTEM_ID,
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
    selection_flow: {
      flow_id: 'dsc-backend-selection-flow-v1',
      description:
        'Ordered backend selection stages a future runtime router must execute. Stages are declared only; none are executed in this phase. Candidate source is exclusively the reused PHASE-042 adapter registration.',
      ordered_stages: SELECTION_STAGES,
      reuse_policy: {
        adapter_registration: 'mandatory_exact_reuse',
        compatibility_engine: 'mandatory_read_only_via_registration',
      },
      accept_condition: 'routing report outcome is routed or fallback with declared branch',
      reject_condition: 'routing report outcome is unroutable',
      outcome_values: ['routed', 'fallback', 'unroutable'],
    },
    deterministic_routing_policy,
    fallback_policy,
    routing_report,
    routed_backends: {
      count: 0,
      entries: [],
      routing_policy:
        'backend routing is performed by future phases; this phase defines the router surface only and binds to no backend',
      routes_backends_in_this_phase: false,
    },
    design_constraints: {
      router_only: true,
      read_only: true,
      backend_agnostic: true,
      reuses_adapter_registration: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      routes_backends_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, BACKEND_RUNTIME_ROUTER_PATH, runtimeRouter);
  return { runtimeRouter };
}
