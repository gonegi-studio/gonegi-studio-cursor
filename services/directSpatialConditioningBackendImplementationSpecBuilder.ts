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
  DSC_BACKEND_EXECUTION_CONTRACT_PHASE,
  DSC_BACKEND_EXECUTION_CONTRACT_SYSTEM_ID,
  type DirectSpatialConditioningBackendExecutionContract,
} from './directSpatialConditioningBackendExecutionContractBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-045: Direct Spatial Conditioning backend implementation specification.
 *
 * DESIGN ONLY / READ-ONLY / BACKEND AGNOSTIC. Defines what a future backend
 * adapter implementation MUST satisfy against the frozen PHASE-044 execution
 * contract and the upstream adapter/router stack:
 *   - adapter implementation requirements,
 *   - required interfaces (exact method surface to implement),
 *   - deterministic compliance checklist, and
 *   - implementation report schema.
 *
 * Implements no backend, executes no method, performs no GPU or inference work,
 * and modifies no dataset. Every requirement is declared, never satisfied, in
 * this phase. The PHASE-044 execution contract is reused by exact reference.
 */

export const DSC_BACKEND_IMPLEMENTATION_SPEC_PHASE = 'PHASE-DSC-045' as const;
export const DSC_BACKEND_IMPLEMENTATION_SPEC_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_BACKEND_IMPLEMENTATION_SPEC_V1' as const;

export const BACKEND_IMPLEMENTATION_SPEC_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const BACKEND_IMPLEMENTATION_SPEC_PATH =
  `${BACKEND_IMPLEMENTATION_SPEC_ROOT}/direct-spatial-conditioning-backend-implementation-spec-v1.json` as const;

export type ComplianceStatus = 'pass' | 'fail' | 'not_evaluated';

export interface ImplementationRequirement {
  requirement_id: string;
  category:
    | 'identity'
    | 'interface'
    | 'compatibility'
    | 'registration'
    | 'routing'
    | 'execution'
    | 'determinism'
    | 'constraints';
  description: string;
  mandatory: true;
  evidence_ref: string;
  implemented_in_this_phase: false;
}

export interface RequiredInterfaceMethod {
  method_id: string;
  signature: string;
  source_interface: 'dsc-backend-adapter-interface-v1';
  abstract: true;
  must_be_implemented_by_adapter: true;
  requires_gpu: false;
  performs_inference: false;
  implemented_in_this_phase: false;
}

export interface RequiredInterfaceSurface {
  surface_id: string;
  artifact_ref: string;
  purpose: string;
  mandatory: true;
}

export interface RequiredInterfaces {
  interfaces_id: 'dsc-backend-required-interfaces-v1';
  description: string;
  adapter_interface_ref: 'dsc-backend-adapter-interface-v1';
  adapter_foundation_ref: string;
  methods: RequiredInterfaceMethod[];
  surfaces: RequiredInterfaceSurface[];
  implements_interfaces_in_this_phase: false;
}

export interface ComplianceChecklistItem {
  check_id: string;
  requirement_id: string;
  description: string;
  evaluation: 'design_time_declaration_only';
  pass_condition: string;
  fail_code: string;
  status_in_this_phase: 'not_evaluated';
  mandatory: true;
}

export interface DeterministicComplianceChecklist {
  checklist_id: 'dsc-backend-deterministic-compliance-checklist-v1';
  description: string;
  evaluation: 'collect_all_failures';
  accept_condition: 'zero failed checks';
  outcome_values: ['compliant', 'non_compliant'];
  items: ComplianceChecklistItem[];
  evaluates_implementations_in_this_phase: false;
}

export interface ImplementationReportField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface ImplementationReportSchema {
  report_schema_id: 'dsc-backend-implementation-report-schema-v1';
  report_id: 'dsc-backend-implementation-report-v1';
  description: string;
  encoding: 'application/json';
  required_fields: ImplementationReportField[];
  outcome_values: ['compliant', 'non_compliant'];
  checklist_entry_shape: {
    fields: string[];
    status_values: ['pass', 'fail', 'not_evaluated'];
  };
  ordering: {
    checklist_results: 'checklist_item_order';
    failed_checks: 'checklist_item_order';
  };
  additional_fields: false;
  materializes_tensors: false;
  materializes_frames: false;
  evaluates_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningBackendImplementationSpec {
  implementation_spec_id: string;
  phase: typeof DSC_BACKEND_IMPLEMENTATION_SPEC_PHASE;
  system_id: typeof DSC_BACKEND_IMPLEMENTATION_SPEC_SYSTEM_ID;
  mode: 'design_only_specification';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_IMPLEMENTATION_SPEC_V1';
  execution_contract_ref: string;
  execution_contract_phase: typeof DSC_BACKEND_EXECUTION_CONTRACT_PHASE;
  execution_contract_system_id: typeof DSC_BACKEND_EXECUTION_CONTRACT_SYSTEM_ID;
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
  adapter_implementation_requirements: {
    requirements_id: 'dsc-backend-adapter-implementation-requirements-v1';
    description: string;
    requirements: ImplementationRequirement[];
  };
  required_interfaces: RequiredInterfaces;
  deterministic_compliance_checklist: DeterministicComplianceChecklist;
  implementation_report: ImplementationReportSchema;
  implemented_backends: {
    count: 0;
    entries: [];
    implementation_policy: string;
    implements_backends_in_this_phase: false;
  };
  design_constraints: {
    specification_only: true;
    read_only: true;
    backend_agnostic: true;
    reuses_execution_contract: true;
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
 * Build the design-only, read-only DSC backend implementation specification.
 * Reuses the PHASE-044 execution contract and PHASE-039 adapter foundation by
 * exact reference; writes only the specification artifact. No backend is
 * implemented and no upstream artifact is modified.
 */
export function buildDirectSpatialConditioningBackendImplementationSpec(
  projectRoot?: string
): { implementationSpec: DirectSpatialConditioningBackendImplementationSpec } {
  const root = resolveProjectRoot(projectRoot);

  const executionContract = readJson<DirectSpatialConditioningBackendExecutionContract>(
    root,
    BACKEND_EXECUTION_CONTRACT_PATH
  );
  if (
    executionContract.phase !== DSC_BACKEND_EXECUTION_CONTRACT_PHASE ||
    executionContract.system_id !== DSC_BACKEND_EXECUTION_CONTRACT_SYSTEM_ID
  ) {
    throw new Error('PHASE-044 execution contract is missing or incompatible');
  }
  if (!executionContract.design_constraints.backend_agnostic) {
    throw new Error('Execution contract must remain backend agnostic');
  }
  if (!executionContract.design_constraints.reuses_runtime_router) {
    throw new Error('Execution contract must reuse the runtime router');
  }
  if (executionContract.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
    throw new Error('Execution contract runtime router ref drifted');
  }
  if (executionContract.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
    throw new Error('Execution contract adapter registration ref drifted');
  }
  if (executionContract.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
    throw new Error('Execution contract adapter foundation ref drifted');
  }
  if (
    JSON.stringify(executionContract.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Execution contract channels do not match foundation channels');
  }
  if (
    JSON.stringify(executionContract.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error('Execution contract sources_supported drifted from the certified corpus');
  }
  if (executionContract.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Execution contract spatial frame drifted');
  }
  if (
    executionContract.capability_set_id !== CAPABILITY_SET_ID ||
    executionContract.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Execution contract capability set identity drifted');
  }
  if (executionContract.executed_backends.count !== 0) {
    throw new Error('PHASE-044 must not have executed backends in this design stack');
  }

  const adapterFoundation = readJson<DirectSpatialConditioningBackendAdapterFoundation>(
    root,
    BACKEND_ADAPTER_FOUNDATION_PATH
  );
  if (adapterFoundation.backend_interface.interface_id !== 'dsc-backend-adapter-interface-v1') {
    throw new Error('Adapter foundation interface identity drifted');
  }
  const foundationMethods = adapterFoundation.backend_interface.methods;
  if (foundationMethods.length !== 4) {
    throw new Error('Adapter foundation must expose exactly four abstract methods');
  }

  const requirements: ImplementationRequirement[] = [
    {
      requirement_id: 'REQ_OPAQUE_BACKEND_IDENTITY',
      category: 'identity',
      description:
        'Adapter must publish an opaque backend_id with no vendor, framework, or device semantics.',
      mandatory: true,
      evidence_ref: 'capability_registry.backend_descriptor.identity_policy',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_IMPLEMENT_ADAPTER_INTERFACE',
      category: 'interface',
      description:
        'Adapter must implement all four PHASE-039 abstract methods without requiring GPU or inference.',
      mandatory: true,
      evidence_ref: 'adapter_foundation.backend_interface.methods',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_CAPABILITY_DECLARATION_COMPLETE',
      category: 'compatibility',
      description:
        'Adapter must declare every mandatory capability against dsc-backend-capability-set-v1.',
      mandatory: true,
      evidence_ref: 'capability_registry.capability_schema.registered_capability_ids',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_COMPATIBILITY_ENGINE_PASS',
      category: 'compatibility',
      description:
        'Adapter descriptor must resolve compatible under the PHASE-041 compatibility engine before registration.',
      mandatory: true,
      evidence_ref: 'compatibility_engine.deterministic_algorithm',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_REGISTRATION_ACTIVE_ONLY',
      category: 'registration',
      description:
        'Only PHASE-042 registrations in lifecycle active may be considered for routing and execution.',
      mandatory: true,
      evidence_ref: 'adapter_registration.lifecycle.active_state',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_ROUTER_ROUTED_OUTCOME',
      category: 'routing',
      description:
        'Execution may begin only after a PHASE-043 routing report with outcome routed.',
      mandatory: true,
      evidence_ref: 'runtime_router.routing_report.outcome_values',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_EXECUTION_REQUEST_SHAPE',
      category: 'execution',
      description:
        'Adapter execution entry must accept dsc-backend-execution-request-v1 exactly.',
      mandatory: true,
      evidence_ref: 'execution_contract.execution_request',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_EXECUTION_RESPONSE_SHAPE',
      category: 'execution',
      description:
        'Adapter execution exit must emit dsc-backend-execution-response-v1 exactly.',
      mandatory: true,
      evidence_ref: 'execution_contract.execution_response',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_EXECUTION_LIFECYCLE',
      category: 'execution',
      description:
        'Adapter must honor the PHASE-044 execution lifecycle transitions with side_effects none.',
      mandatory: true,
      evidence_ref: 'execution_contract.execution_lifecycle',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_DETERMINISTIC_OUTCOME',
      category: 'determinism',
      description:
        'Identical requests against the same routed registration must yield the same outcome and result_digest.',
      mandatory: true,
      evidence_ref: 'execution_contract.deterministic_execution_guarantees',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_SPATIAL_FRAME_LOCKED',
      category: 'constraints',
      description:
        'Adapter must operate exclusively in normalized_image_plane_v1 without reprojection.',
      mandatory: true,
      evidence_ref: 'adapter_foundation.capability_contract.spatial_frame_ref',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_NO_GPU_NO_INFERENCE',
      category: 'constraints',
      description:
        'Adapter implementation under this specification must not require GPU or perform inference.',
      mandatory: true,
      evidence_ref: 'design_constraints.gpu_inference',
      implemented_in_this_phase: false,
    },
  ];

  const required_interfaces: RequiredInterfaces = {
    interfaces_id: 'dsc-backend-required-interfaces-v1',
    description:
      'Exact interface surface a backend adapter must implement. Methods are reused verbatim from the PHASE-039 adapter foundation; this phase adds no new methods and implements none.',
    adapter_interface_ref: 'dsc-backend-adapter-interface-v1',
    adapter_foundation_ref: BACKEND_ADAPTER_FOUNDATION_PATH,
    methods: foundationMethods.map((method) => ({
      method_id: method.method_id,
      signature: method.signature,
      source_interface: 'dsc-backend-adapter-interface-v1' as const,
      abstract: true as const,
      must_be_implemented_by_adapter: true as const,
      requires_gpu: false as const,
      performs_inference: false as const,
      implemented_in_this_phase: false as const,
    })),
    surfaces: [
      {
        surface_id: 'dsc_adapted_conditioning_input_v1',
        artifact_ref: BACKEND_ADAPTER_FOUNDATION_PATH,
        purpose: 'Adapted conditioning input accepted by bind_conditioning_input.',
        mandatory: true,
      },
      {
        surface_id: 'dsc-backend-execution-request-v1',
        artifact_ref: BACKEND_EXECUTION_CONTRACT_PATH,
        purpose: 'Execution request accepted after a routed routing report.',
        mandatory: true,
      },
      {
        surface_id: 'dsc-backend-execution-response-v1',
        artifact_ref: BACKEND_EXECUTION_CONTRACT_PATH,
        purpose: 'Execution response emitted at succeeded, failed, or cancelled.',
        mandatory: true,
      },
      {
        surface_id: 'dsc-backend-routing-report-v1',
        artifact_ref: BACKEND_RUNTIME_ROUTER_PATH,
        purpose: 'Routing report proving selected_registration_id before execution.',
        mandatory: true,
      },
      {
        surface_id: 'dsc-backend-compatibility-report-v1',
        artifact_ref: BACKEND_COMPATIBILITY_ENGINE_PATH,
        purpose: 'Compatibility report required before registration becomes active.',
        mandatory: true,
      },
    ],
    implements_interfaces_in_this_phase: false,
  };

  const checklistItems: ComplianceChecklistItem[] = requirements.map((requirement) => ({
    check_id: `CHK_${requirement.requirement_id.replace(/^REQ_/, '')}`,
    requirement_id: requirement.requirement_id,
    description: requirement.description,
    evaluation: 'design_time_declaration_only' as const,
    pass_condition: `${requirement.requirement_id} evidence present and constraints satisfied`,
    fail_code: `DSC_BACKEND_IMPL_FAIL_${requirement.requirement_id.replace(/^REQ_/, '')}`,
    status_in_this_phase: 'not_evaluated' as const,
    mandatory: true as const,
  }));

  // Extra determinism checks locked to the execution contract guarantees.
  checklistItems.push(
    {
      check_id: 'CHK_NO_SEED_DEPENDENCE',
      requirement_id: 'REQ_DETERMINISTIC_OUTCOME',
      description: 'Implementation must declare seed_dependence none.',
      evaluation: 'design_time_declaration_only',
      pass_condition: 'seed_dependence equals none',
      fail_code: 'DSC_BACKEND_IMPL_FAIL_SEED_DEPENDENCE',
      status_in_this_phase: 'not_evaluated',
      mandatory: true,
    },
    {
      check_id: 'CHK_NO_TIME_DEPENDENCE',
      requirement_id: 'REQ_DETERMINISTIC_OUTCOME',
      description:
        'Implementation must declare time_dependence none; audit timestamps must not affect result_digest.',
      evaluation: 'design_time_declaration_only',
      pass_condition: 'time_dependence equals none',
      fail_code: 'DSC_BACKEND_IMPL_FAIL_TIME_DEPENDENCE',
      status_in_this_phase: 'not_evaluated',
      mandatory: true,
    },
    {
      check_id: 'CHK_NO_RANDOMNESS',
      requirement_id: 'REQ_DETERMINISTIC_OUTCOME',
      description: 'Implementation must declare randomness none.',
      evaluation: 'design_time_declaration_only',
      pass_condition: 'randomness equals none',
      fail_code: 'DSC_BACKEND_IMPL_FAIL_RANDOMNESS',
      status_in_this_phase: 'not_evaluated',
      mandatory: true,
    },
    {
      check_id: 'CHK_CHANNEL_ORDER_FOUNDATION',
      requirement_id: 'REQ_SPATIAL_FRAME_LOCKED',
      description:
        'Request and response channel_order must equal the foundation channel order.',
      evaluation: 'design_time_declaration_only',
      pass_condition: 'channel_order equals foundation channel order',
      fail_code: 'DSC_BACKEND_IMPL_FAIL_CHANNEL_ORDER',
      status_in_this_phase: 'not_evaluated',
      mandatory: true,
    }
  );

  const deterministic_compliance_checklist: DeterministicComplianceChecklist = {
    checklist_id: 'dsc-backend-deterministic-compliance-checklist-v1',
    description:
      'Deterministic compliance checklist a future adapter implementation must pass. Every item is declared not_evaluated in this phase; no implementation is scored.',
    evaluation: 'collect_all_failures',
    accept_condition: 'zero failed checks',
    outcome_values: ['compliant', 'non_compliant'],
    items: checklistItems,
    evaluates_implementations_in_this_phase: false,
  };

  const implementation_report: ImplementationReportSchema = {
    report_schema_id: 'dsc-backend-implementation-report-schema-v1',
    report_id: 'dsc-backend-implementation-report-v1',
    description:
      'Typed report schema for a future implementation compliance evaluation. This phase defines the schema only and evaluates no implementation.',
    encoding: 'application/json',
    required_fields: [
      {
        field: 'implementation_report_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque report identity with no vendor binding',
      },
      {
        field: 'backend_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque backend_id under evaluation',
      },
      {
        field: 'execution_contract_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal the PHASE-044 execution contract path',
      },
      {
        field: 'implementation_spec_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal this implementation specification path',
      },
      {
        field: 'outcome',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must be one of outcome_values',
      },
      {
        field: 'checklist_results',
        type: 'array<checklist_entry>',
        required: true,
        nullable: false,
        constraint: 'one entry per checklist item in checklist item order',
      },
      {
        field: 'failed_checks',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'check_ids with status fail, in checklist item order',
      },
      {
        field: 'fail_codes',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'fail codes collected from failed checks; empty iff outcome compliant',
      },
      {
        field: 'methods_implemented',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'must cover all required adapter interface method_ids when compliant',
      },
      {
        field: 'spatial_frame_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${SPATIAL_FRAME.frame_id}`,
      },
      {
        field: 'capability_set_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must be a supported version of ${CAPABILITY_SET_ID}`,
      },
      {
        field: 'evaluated_at',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'ISO-8601 audit timestamp; must not affect deterministic checklist outcomes',
      },
    ],
    outcome_values: ['compliant', 'non_compliant'],
    checklist_entry_shape: {
      fields: [
        'check_id',
        'requirement_id',
        'status',
        'fail_code_or_null',
        'evidence_note',
      ],
      status_values: ['pass', 'fail', 'not_evaluated'],
    },
    ordering: {
      checklist_results: 'checklist_item_order',
      failed_checks: 'checklist_item_order',
    },
    additional_fields: false,
    materializes_tensors: false,
    materializes_frames: false,
    evaluates_implementations_in_this_phase: false,
  };

  const implementationSpec: DirectSpatialConditioningBackendImplementationSpec = {
    implementation_spec_id: 'direct-spatial-conditioning-backend-implementation-spec-v1',
    phase: DSC_BACKEND_IMPLEMENTATION_SPEC_PHASE,
    system_id: DSC_BACKEND_IMPLEMENTATION_SPEC_SYSTEM_ID,
    mode: 'design_only_specification',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_IMPLEMENTATION_SPEC_V1',
    execution_contract_ref: BACKEND_EXECUTION_CONTRACT_PATH,
    execution_contract_phase: DSC_BACKEND_EXECUTION_CONTRACT_PHASE,
    execution_contract_system_id: DSC_BACKEND_EXECUTION_CONTRACT_SYSTEM_ID,
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
    adapter_implementation_requirements: {
      requirements_id: 'dsc-backend-adapter-implementation-requirements-v1',
      description:
        'Mandatory requirements a future backend adapter implementation must satisfy. Requirements are declared only; none are implemented in this phase.',
      requirements,
    },
    required_interfaces,
    deterministic_compliance_checklist,
    implementation_report,
    implemented_backends: {
      count: 0,
      entries: [],
      implementation_policy:
        'backend implementation is performed by future phases; this phase defines the specification only and binds to no backend',
      implements_backends_in_this_phase: false,
    },
    design_constraints: {
      specification_only: true,
      read_only: true,
      backend_agnostic: true,
      reuses_execution_contract: true,
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

  writeJson(root, BACKEND_IMPLEMENTATION_SPEC_PATH, implementationSpec);
  return { implementationSpec };
}
