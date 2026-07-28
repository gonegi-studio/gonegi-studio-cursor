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
import {
  DSC_VENDOR_COMPATIBILITY_PHASE,
  DSC_VENDOR_COMPATIBILITY_SYSTEM_ID,
  VENDOR_COMPATIBILITY_PATH,
  type DirectSpatialConditioningVendorCompatibility,
} from './directSpatialConditioningVendorCompatibilityBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-059: Direct Spatial Conditioning vendor router.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines how a future DSC runtime
 * selects among compatible vendor registrations, reusing the certified
 * PHASE-057 vendor compatibility specification (whose PASS target is the
 * certification reused here):
 *   - router schema,
 *   - deterministic routing policy,
 *   - fallback policy, and
 *   - routing report.
 *
 * Selects no vendor, implements no vendor, evaluates no live registration, and
 * performs no GPU, inference, or dataset modification. Every stage is declared,
 * never executed, in this phase. The vendor compatibility specification is
 * reused by exact reference; only compatible, active registrations are eligible.
 */

export const DSC_VENDOR_ROUTER_PHASE = 'PHASE-DSC-059' as const;
export const DSC_VENDOR_ROUTER_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_ROUTER_V1' as const;

export const VENDOR_ROUTER_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_ROUTER_PATH =
  `${VENDOR_ROUTER_ROOT}/direct-spatial-conditioning-vendor-router-v1.json` as const;

export type RoutingStageId =
  | 'bind_routing_request'
  | 'lookup_compatible_vendors'
  | 'filter_eligible_vendors'
  | 'rank_candidates'
  | 'select_primary_route'
  | 'apply_fallback_if_needed'
  | 'emit_routing_report';

export type VendorRoutingOutcome = 'routed' | 'fallback' | 'unroutable';

export interface RoutingStage {
  stage_id: RoutingStageId;
  order: number;
  description: string;
  inputs: string[];
  outputs: string[];
  side_effects: 'none';
  executed_in_this_phase: false;
}

export interface RouterSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRouterSchema {
  schema_id: 'dsc-vendor-router-schema-v1';
  description: string;
  encoding: 'application/json';
  identity_policy: 'opaque_router_id_no_vendor_binding';
  vendor_compatibility_ref: string;
  required_fields: RouterSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface RankingKey {
  key_id: string;
  order: number;
  field: string;
  direction: 'ascending' | 'descending';
  description: string;
}

export interface DeterministicRoutingPolicy {
  policy_id: 'dsc-vendor-deterministic-routing-policy-v1';
  description: string;
  eligibility: {
    lifecycle_state_required: 'active';
    compatibility_outcome_required: 'compatible';
    vendor_profile_binding_required: true;
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
  vendor_invocation: 'none';
  routes_vendors_in_this_phase: false;
}

export interface FallbackBranch {
  branch_id: string;
  order: number;
  condition: string;
  action: string;
  outcome: VendorRoutingOutcome;
  routing_code: string | null;
}

export interface FallbackPolicy {
  policy_id: 'dsc-vendor-routing-fallback-policy-v1';
  description: string;
  primary_exhausted_behavior: 'evaluate_fallback_branches_in_order';
  branches: FallbackBranch[];
  forbidden: string[];
  never_invents_vendor: true;
  never_bypasses_compatibility: true;
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
  report_schema_id: 'dsc-vendor-routing-report-schema-v1';
  report_id: 'dsc-vendor-routing-report-v1';
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
    routing_codes: 'first_failure_order_then_lexicographic';
  };
  additional_fields: false;
  materializes_tensors: false;
  materializes_frames: false;
  routes_vendors_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRouter {
  vendor_router_id: string;
  phase: typeof DSC_VENDOR_ROUTER_PHASE;
  system_id: typeof DSC_VENDOR_ROUTER_SYSTEM_ID;
  mode: 'design_only_vendor_router';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_ROUTER_V1';
  vendor_compatibility_ref: string;
  vendor_compatibility_phase: typeof DSC_VENDOR_COMPATIBILITY_PHASE;
  vendor_compatibility_system_id: typeof DSC_VENDOR_COMPATIBILITY_SYSTEM_ID;
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
  vendor_router_schema: VendorRouterSchema;
  routing_flow: {
    flow_id: 'dsc-vendor-routing-flow-v1';
    description: string;
    ordered_stages: RoutingStage[];
    reuse_policy: {
      vendor_compatibility: 'mandatory_exact_reuse';
      vendor_registry: 'mandatory_read_only_via_compatibility';
    };
    accept_condition: 'routing report outcome is routed or fallback with declared branch';
    reject_condition: 'routing report outcome is unroutable';
    outcome_values: ['routed', 'fallback', 'unroutable'];
    executes_flow_in_this_phase: false;
  };
  deterministic_routing_policy: DeterministicRoutingPolicy;
  fallback_policy: FallbackPolicy;
  routing_report: RoutingReportSchema;
  routed_vendors: {
    count: 0;
    entries: [];
    routing_policy: string;
    routes_vendors_in_this_phase: false;
  };
  design_constraints: {
    router_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_vendor_compatibility: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    routes_vendors_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

const ROUTING_STAGES: RoutingStage[] = [
  {
    stage_id: 'bind_routing_request',
    order: 1,
    description:
      'Bind the opaque routing request, adapted conditioning input reference, and optional preferred vendor_registration_id as immutable routing inputs. No vendor is invoked.',
    inputs: [
      'routing_request',
      'adapted_conditioning_input_ref',
      'optional_preferred_vendor_registration_id',
    ],
    outputs: ['bound_routing_inputs'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'lookup_compatible_vendors',
    order: 2,
    description:
      'Read the PHASE-057 vendor compatibility surface and collect vendor registrations whose compatibility outcome is compatible. Lookup is read-only and never mutates records.',
    inputs: ['bound_routing_inputs', 'vendor_compatibility_ref'],
    outputs: ['compatible_vendor_snapshot'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'filter_eligible_vendors',
    order: 3,
    description:
      'Apply the deterministic routing eligibility rules (active lifecycle, compatible outcome, vendor profile binding, capability set, spatial frame, exact channel coverage).',
    inputs: ['compatible_vendor_snapshot', 'bound_routing_inputs'],
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
      'Select the first candidate after stable sort as the primary route. A bound preferred vendor_registration_id is forced to rank first only when it already satisfies eligibility.',
    inputs: ['ranked_candidates', 'bound_routing_inputs'],
    outputs: ['primary_route_or_null'],
    side_effects: 'none',
    executed_in_this_phase: false,
  },
  {
    stage_id: 'apply_fallback_if_needed',
    order: 6,
    description:
      'If no primary route exists, evaluate fallback branches in declaration order. Fallback never invents a vendor and never bypasses the vendor compatibility specification.',
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
    field: 'matches_preferred_vendor_registration_id',
    direction: 'descending',
    description:
      'Eligible preferred vendor_registration_id, when present, ranks before all other eligible candidates.',
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
    key_id: 'vendor_profile_version_desc',
    order: 3,
    field: 'vendor_profile_version',
    direction: 'descending',
    description:
      'Higher bound vendor_profile_version ranks first to prefer the most current profile binding.',
  },
  {
    key_id: 'vendor_registration_id_asc',
    order: 4,
    field: 'vendor_registration_id',
    direction: 'ascending',
    description:
      'Opaque vendor_registration_id ascending is the final deterministic tie-breaker.',
  },
];

const FALLBACK_BRANCHES: FallbackBranch[] = [
  {
    branch_id: 'no_compatible_vendors',
    order: 1,
    condition: 'compatible_vendor_snapshot is empty',
    action: 'emit unroutable report with DSC_VENDOR_ROUTING_NO_COMPATIBLE_VENDOR',
    outcome: 'unroutable',
    routing_code: 'DSC_VENDOR_ROUTING_NO_COMPATIBLE_VENDOR',
  },
  {
    branch_id: 'compatible_but_none_eligible',
    order: 2,
    condition: 'compatible vendors exist but eligible_candidates is empty',
    action: 'emit unroutable report with DSC_VENDOR_ROUTING_NO_ELIGIBLE_VENDOR',
    outcome: 'unroutable',
    routing_code: 'DSC_VENDOR_ROUTING_NO_ELIGIBLE_VENDOR',
  },
  {
    branch_id: 'preferred_ineligible_use_next_ranked',
    order: 3,
    condition:
      'preferred vendor_registration_id was bound but became ineligible; ranked eligible candidates remain',
    action: 'select first ranked eligible candidate and mark outcome routed',
    outcome: 'routed',
    routing_code: null,
  },
  {
    branch_id: 'explicit_unroutable_terminal',
    order: 4,
    condition: 'no primary route and no earlier fallback branch matched',
    action: 'emit unroutable report with DSC_VENDOR_ROUTING_UNROUTABLE',
    outcome: 'unroutable',
    routing_code: 'DSC_VENDOR_ROUTING_UNROUTABLE',
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
 * Build the design-only, read-only, vendor-neutral DSC vendor router. Reuses
 * the certified PHASE-057 vendor compatibility specification by exact reference
 * (its PASS target is the certification reused here); writes only the router
 * artifact. No vendor is routed and no upstream artifact is modified.
 */
export function buildDirectSpatialConditioningVendorRouter(
  projectRoot?: string
): { vendorRouter: DirectSpatialConditioningVendorRouter } {
  const root = resolveProjectRoot(projectRoot);

  const familyCertification = readJson<{ certified?: boolean }>(
    root,
    BACKEND_FAMILY_CERTIFICATION_PATH
  );
  if (familyCertification.certified !== true) {
    throw new Error('PHASE-054 backend family is not certified');
  }

  const vendorCompatibility = readJson<DirectSpatialConditioningVendorCompatibility>(
    root,
    VENDOR_COMPATIBILITY_PATH
  );
  if (
    vendorCompatibility.phase !== DSC_VENDOR_COMPATIBILITY_PHASE ||
    vendorCompatibility.system_id !== DSC_VENDOR_COMPATIBILITY_SYSTEM_ID
  ) {
    throw new Error('PHASE-057 vendor compatibility is missing or incompatible');
  }
  if (
    vendorCompatibility.target !==
    'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_COMPATIBILITY_V1'
  ) {
    throw new Error(
      'Vendor compatibility target is not the certified PASS verdict'
    );
  }
  if (!vendorCompatibility.design_constraints.vendor_neutral) {
    throw new Error('Vendor compatibility must remain vendor neutral');
  }
  if (!vendorCompatibility.design_constraints.reuses_vendor_registry) {
    throw new Error('Vendor compatibility must reuse the vendor registry');
  }
  if (!vendorCompatibility.design_constraints.no_vendor_implementation) {
    throw new Error('Vendor compatibility must forbid vendor implementation');
  }
  if (vendorCompatibility.evaluated_vendors.count !== 0) {
    throw new Error('PHASE-057 must not have evaluated vendors in this design stack');
  }
  if (vendorCompatibility.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
    throw new Error('Vendor compatibility vendor registry ref drifted');
  }
  if (vendorCompatibility.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
    throw new Error('Vendor compatibility vendor profile ref drifted');
  }
  if (
    JSON.stringify(vendorCompatibility.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor compatibility channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorCompatibility.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Vendor compatibility sources_supported drifted from the certified corpus');
  }
  if (vendorCompatibility.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor compatibility spatial frame drifted');
  }
  if (
    vendorCompatibility.capability_set_id !== CAPABILITY_SET_ID ||
    vendorCompatibility.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor compatibility capability set identity drifted');
  }
  if (
    vendorCompatibility.compatibility_report.report_id !==
    'dsc-vendor-compatibility-report-v1'
  ) {
    throw new Error('Vendor compatibility report identity drifted');
  }
  if (
    vendorCompatibility.deterministic_compatibility_rules.rules_id !==
    'dsc-vendor-deterministic-compatibility-rules-v1'
  ) {
    throw new Error('Vendor compatibility rules identity drifted');
  }

  const vendor_router_schema: VendorRouterSchema = {
    schema_id: 'dsc-vendor-router-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor router specification. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. The specification declares a routing policy, fallback policy, report shape, and ordered flow without routing any vendor.',
    encoding: 'application/json',
    identity_policy: 'opaque_router_id_no_vendor_binding',
    vendor_compatibility_ref: VENDOR_COMPATIBILITY_PATH,
    required_fields: [
      {
        field: 'vendor_router_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'vendor_compatibility_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must reference the certified PHASE-057 vendor compatibility specification',
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
        field: 'deterministic_routing_policy',
        type: 'dsc-vendor-deterministic-routing-policy-v1',
        required: true,
        nullable: false,
        constraint:
          'must declare a pure deterministic routing policy with no seed, time, or randomness dependence',
      },
      {
        field: 'fallback_policy',
        type: 'dsc-vendor-routing-fallback-policy-v1',
        required: true,
        nullable: false,
        constraint: 'must declare ordered fallback branches that never invent a vendor',
      },
      {
        field: 'routing_report',
        type: 'dsc-vendor-routing-report-v1',
        required: true,
        nullable: false,
        constraint: 'must declare the routing report schema',
      },
      {
        field: 'routing_flow',
        type: 'dsc-vendor-routing-flow-v1',
        required: true,
        nullable: false,
        constraint: 'must declare an ordered side-effect-free routing flow',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_routing_policy: DeterministicRoutingPolicy = {
    policy_id: 'dsc-vendor-deterministic-routing-policy-v1',
    description:
      'Pure, seedless, time-independent policy that ranks eligible compatible vendor registrations and selects the first after stable sort. Declared only; never executed in this phase.',
    eligibility: {
      lifecycle_state_required: 'active',
      compatibility_outcome_required: 'compatible',
      vendor_profile_binding_required: true,
      capability_set_id_required: CAPABILITY_SET_ID,
      spatial_frame_required: SPATIAL_FRAME.frame_id,
      channel_coverage_required: 'exact_foundation_order',
    },
    ranking_keys: RANKING_KEYS,
    selection_rule: 'first_after_stable_sort',
    tie_breakers: [
      'stages execute strictly in routing_flow order',
      'ranking keys apply in ascending key order',
      'stable sort preserves relative order for equal keys until a later key decides',
      'vendor_registration_id ascending is the final tie-breaker and never depends on wall clock',
    ],
    purity: 'deterministic_pure_function',
    seed_dependence: 'none',
    time_dependence: 'none',
    randomness: 'none',
    vendor_invocation: 'none',
    routes_vendors_in_this_phase: false,
  };

  const fallback_policy: FallbackPolicy = {
    policy_id: 'dsc-vendor-routing-fallback-policy-v1',
    description:
      'Ordered fallback branches evaluated only when select_primary_route yields no route. Fallback never invents a vendor and never bypasses the PHASE-057 vendor compatibility specification.',
    primary_exhausted_behavior: 'evaluate_fallback_branches_in_order',
    branches: FALLBACK_BRANCHES,
    forbidden: [
      'inventing an unregistered or incompatible vendor',
      'routing a pending, suspended, or deregistered registration',
      'routing a vendor whose compatibility outcome is incompatible',
      'bypassing PHASE-057 vendor compatibility rules or the vendor profile binding',
      'gpu or inference execution during fallback',
      'dataset modification during fallback',
      'non-deterministic random selection among candidates',
    ],
    never_invents_vendor: true,
    never_bypasses_compatibility: true,
    executed_in_this_phase: false,
  };

  const routing_report: RoutingReportSchema = {
    report_schema_id: 'dsc-vendor-routing-report-schema-v1',
    report_id: 'dsc-vendor-routing-report-v1',
    description:
      'Typed report schema for the routing decision emitted by emit_routing_report. Outcome is routed, fallback, or unroutable; additional fields are forbidden. Declared only; no report is produced in this phase.',
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
        field: 'selected_vendor_registration_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'opaque vendor_registration_id when outcome is routed; empty string when unroutable or when fallback does not select a registration',
      },
      {
        field: 'selected_vendor_handle',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'opaque_vendor_handle copied from the selected registration when routed; empty string otherwise',
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
        constraint: 'compatible but ineligible candidates, in ranking key order',
      },
      {
        field: 'routing_codes',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint:
          'zero or more DSC_VENDOR_ROUTING_* codes; empty iff outcome is routed without fallback codes',
      },
      {
        field: 'capability_set_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'capability_set_version of the selected registration, or empty when unroutable',
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
        'vendor_registration_id',
        'opaque_vendor_handle',
        'lifecycle_state',
        'capability_set_version',
        'compatibility_outcome',
        'eligibility',
        'rank_index_or_null',
        'rejection_code_or_null',
      ],
    },
    ordering: {
      candidates_considered: 'ranking_key_order',
      rejected_candidates: 'ranking_key_order',
      routing_codes: 'first_failure_order_then_lexicographic',
    },
    additional_fields: false,
    materializes_tensors: false,
    materializes_frames: false,
    routes_vendors_in_this_phase: false,
  };

  const vendorRouter: DirectSpatialConditioningVendorRouter = {
    vendor_router_id: 'direct-spatial-conditioning-vendor-router-v1',
    phase: DSC_VENDOR_ROUTER_PHASE,
    system_id: DSC_VENDOR_ROUTER_SYSTEM_ID,
    mode: 'design_only_vendor_router',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_ROUTER_V1',
    vendor_compatibility_ref: VENDOR_COMPATIBILITY_PATH,
    vendor_compatibility_phase: DSC_VENDOR_COMPATIBILITY_PHASE,
    vendor_compatibility_system_id: DSC_VENDOR_COMPATIBILITY_SYSTEM_ID,
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
    vendor_router_schema,
    routing_flow: {
      flow_id: 'dsc-vendor-routing-flow-v1',
      description:
        'Ordered vendor routing stages a future runtime router must execute. Stages are declared only; none are executed in this phase. Candidate source is exclusively the reused PHASE-057 vendor compatibility specification.',
      ordered_stages: ROUTING_STAGES,
      reuse_policy: {
        vendor_compatibility: 'mandatory_exact_reuse',
        vendor_registry: 'mandatory_read_only_via_compatibility',
      },
      accept_condition:
        'routing report outcome is routed or fallback with declared branch',
      reject_condition: 'routing report outcome is unroutable',
      outcome_values: ['routed', 'fallback', 'unroutable'],
      executes_flow_in_this_phase: false,
    },
    deterministic_routing_policy,
    fallback_policy,
    routing_report,
    routed_vendors: {
      count: 0,
      entries: [],
      routing_policy:
        'vendor routing is performed by future phases; this phase defines the router surface only and binds to no vendor',
      routes_vendors_in_this_phase: false,
    },
    design_constraints: {
      router_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_vendor_compatibility: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      routes_vendors_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_ROUTER_PATH, vendorRouter);
  return { vendorRouter };
}
