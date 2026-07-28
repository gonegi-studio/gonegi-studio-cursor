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
  type DirectSpatialConditioningVendorProfile,
} from './directSpatialConditioningVendorProfileBuilder.js';
import { VENDOR_REGISTRY_PATH } from './directSpatialConditioningVendorRegistryBuilder.js';
import { VENDOR_COMPATIBILITY_PATH } from './directSpatialConditioningVendorCompatibilityBuilder.js';
import { VENDOR_ROUTER_PATH } from './directSpatialConditioningVendorRouterBuilder.js';
import {
  DSC_VENDOR_EXECUTION_CONTRACT_PHASE,
  DSC_VENDOR_EXECUTION_CONTRACT_SYSTEM_ID,
  VENDOR_EXECUTION_CONTRACT_PATH,
  type DirectSpatialConditioningVendorExecutionContract,
} from './directSpatialConditioningVendorExecutionContractBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-061: Direct Spatial Conditioning vendor implementation specification.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Defines what a future vendor
 * implementation MUST satisfy against the certified PHASE-060 vendor execution
 * contract and the upstream vendor stack:
 *   - vendor implementation requirements,
 *   - required interfaces (exact method surface to implement),
 *   - deterministic compliance checklist, and
 *   - implementation report schema.
 *
 * Implements no vendor, executes no method, performs no GPU or inference work,
 * and modifies no dataset. Every requirement is declared, never satisfied, in
 * this phase. The PHASE-060 vendor execution contract is reused by exact
 * reference (its PASS target is the certification reused here).
 */

export const DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE = 'PHASE-DSC-061' as const;
export const DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1' as const;

export const VENDOR_IMPLEMENTATION_SPEC_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_IMPLEMENTATION_SPEC_PATH =
  `${VENDOR_IMPLEMENTATION_SPEC_ROOT}/direct-spatial-conditioning-vendor-implementation-spec-v1.json` as const;

export interface VendorImplementationRequirement {
  requirement_id: string;
  category:
    | 'identity'
    | 'interface'
    | 'compatibility'
    | 'registry'
    | 'routing'
    | 'execution'
    | 'determinism'
    | 'constraints';
  description: string;
  mandatory: true;
  evidence_ref: string;
  implemented_in_this_phase: false;
}

export interface RequiredVendorInterfaceMethod {
  method_id: string;
  signature: string;
  source_interface: 'dsc-vendor-capability-interface-v1';
  abstract: true;
  must_be_implemented_by_vendor: true;
  requires_gpu: false;
  performs_inference: false;
  implemented_in_this_phase: false;
}

export interface RequiredVendorInterfaceSurface {
  surface_id: string;
  artifact_ref: string;
  purpose: string;
  mandatory: true;
}

export interface RequiredVendorInterfaces {
  interfaces_id: 'dsc-vendor-required-interfaces-v1';
  description: string;
  vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1';
  vendor_profile_ref: string;
  methods: RequiredVendorInterfaceMethod[];
  surfaces: RequiredVendorInterfaceSurface[];
  implements_interfaces_in_this_phase: false;
}

export interface VendorComplianceChecklistItem {
  check_id: string;
  requirement_id: string;
  description: string;
  evaluation: 'design_time_declaration_only';
  pass_condition: string;
  fail_code: string;
  status_in_this_phase: 'not_evaluated';
  mandatory: true;
}

export interface VendorDeterministicComplianceChecklist {
  checklist_id: 'dsc-vendor-deterministic-compliance-checklist-v1';
  description: string;
  evaluation: 'collect_all_failures';
  accept_condition: 'zero failed checks';
  outcome_values: ['compliant', 'non_compliant'];
  items: VendorComplianceChecklistItem[];
  evaluates_implementations_in_this_phase: false;
}

export interface VendorImplementationReportField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorImplementationReportSchema {
  report_schema_id: 'dsc-vendor-implementation-report-schema-v1';
  report_id: 'dsc-vendor-implementation-report-v1';
  description: string;
  encoding: 'application/json';
  required_fields: VendorImplementationReportField[];
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

export interface DirectSpatialConditioningVendorImplementationSpec {
  vendor_implementation_spec_id: string;
  phase: typeof DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE;
  system_id: typeof DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID;
  mode: 'design_only_vendor_implementation_spec';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1';
  vendor_execution_contract_ref: string;
  vendor_execution_contract_phase: typeof DSC_VENDOR_EXECUTION_CONTRACT_PHASE;
  vendor_execution_contract_system_id: typeof DSC_VENDOR_EXECUTION_CONTRACT_SYSTEM_ID;
  vendor_router_ref: string;
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
  vendor_implementation_requirements: {
    requirements_id: 'dsc-vendor-implementation-requirements-v1';
    description: string;
    requirements: VendorImplementationRequirement[];
  };
  required_interfaces: RequiredVendorInterfaces;
  deterministic_compliance_checklist: VendorDeterministicComplianceChecklist;
  implementation_report: VendorImplementationReportSchema;
  implemented_vendors: {
    count: 0;
    entries: [];
    implementation_policy: string;
    implements_vendors_in_this_phase: false;
  };
  design_constraints: {
    specification_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_vendor_execution_contract: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    implements_vendors_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor implementation
 * specification. Reuses the certified PHASE-060 vendor execution contract by
 * exact reference (its PASS target is the certification reused here); writes
 * only the specification artifact. No vendor is implemented and no upstream
 * artifact is modified.
 */
export function buildDirectSpatialConditioningVendorImplementationSpec(
  projectRoot?: string
): { vendorImplementationSpec: DirectSpatialConditioningVendorImplementationSpec } {
  const root = resolveProjectRoot(projectRoot);

  const familyCertification = readJson<{ certified?: boolean }>(
    root,
    BACKEND_FAMILY_CERTIFICATION_PATH
  );
  if (familyCertification.certified !== true) {
    throw new Error('PHASE-054 backend family is not certified');
  }

  const vendorExecutionContract =
    readJson<DirectSpatialConditioningVendorExecutionContract>(
      root,
      VENDOR_EXECUTION_CONTRACT_PATH
    );
  if (
    vendorExecutionContract.phase !== DSC_VENDOR_EXECUTION_CONTRACT_PHASE ||
    vendorExecutionContract.system_id !== DSC_VENDOR_EXECUTION_CONTRACT_SYSTEM_ID
  ) {
    throw new Error('PHASE-060 vendor execution contract is missing or incompatible');
  }
  if (
    vendorExecutionContract.target !==
    'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_EXECUTION_CONTRACT_V1'
  ) {
    throw new Error(
      'Vendor execution contract target is not the certified PASS verdict'
    );
  }
  if (!vendorExecutionContract.design_constraints.vendor_neutral) {
    throw new Error('Vendor execution contract must remain vendor neutral');
  }
  if (!vendorExecutionContract.design_constraints.reuses_vendor_router) {
    throw new Error('Vendor execution contract must reuse the vendor router');
  }
  if (!vendorExecutionContract.design_constraints.no_vendor_implementation) {
    throw new Error('Vendor execution contract must forbid vendor implementation');
  }
  if (vendorExecutionContract.vendor_router_ref !== VENDOR_ROUTER_PATH) {
    throw new Error('Vendor execution contract vendor router ref drifted');
  }
  if (vendorExecutionContract.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH) {
    throw new Error('Vendor execution contract vendor compatibility ref drifted');
  }
  if (vendorExecutionContract.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
    throw new Error('Vendor execution contract vendor registry ref drifted');
  }
  if (vendorExecutionContract.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
    throw new Error('Vendor execution contract vendor profile ref drifted');
  }
  if (
    JSON.stringify(vendorExecutionContract.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error(
      'Vendor execution contract channels do not match foundation channels'
    );
  }
  if (
    JSON.stringify(vendorExecutionContract.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor execution contract sources_supported drifted from the certified corpus'
    );
  }
  if (vendorExecutionContract.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor execution contract spatial frame drifted');
  }
  if (
    vendorExecutionContract.capability_set_id !== CAPABILITY_SET_ID ||
    vendorExecutionContract.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor execution contract capability set identity drifted');
  }
  if (vendorExecutionContract.executed_vendors.count !== 0) {
    throw new Error(
      'PHASE-060 must not have executed vendors in this design stack'
    );
  }
  if (
    vendorExecutionContract.execution_request.request_schema_id !==
    'dsc-vendor-execution-request-v1'
  ) {
    throw new Error('Vendor execution request identity drifted');
  }
  if (
    vendorExecutionContract.execution_response.response_schema_id !==
    'dsc-vendor-execution-response-v1'
  ) {
    throw new Error('Vendor execution response identity drifted');
  }

  const vendorProfile = readJson<DirectSpatialConditioningVendorProfile>(
    root,
    VENDOR_PROFILE_PATH
  );
  if (
    vendorProfile.vendor_capability_interface.interface_id !==
    'dsc-vendor-capability-interface-v1'
  ) {
    throw new Error('Vendor profile capability interface identity drifted');
  }
  const vendorMethods = vendorProfile.vendor_capability_interface.methods;
  if (vendorMethods.length !== 4) {
    throw new Error(
      'Vendor capability interface must expose exactly four abstract methods'
    );
  }

  const requirements: VendorImplementationRequirement[] = [
    {
      requirement_id: 'REQ_OPAQUE_VENDOR_IDENTITY',
      category: 'identity',
      description:
        'Vendor must publish opaque vendor_registration_id and opaque_vendor_handle with no vendor name, framework, or device semantics.',
      mandatory: true,
      evidence_ref: 'vendor_registry.vendor_registration_record.identity_policy',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_IMPLEMENT_VENDOR_INTERFACE',
      category: 'interface',
      description:
        'Vendor must implement all four PHASE-055 abstract capability interface methods without requiring GPU or inference.',
      mandatory: true,
      evidence_ref: 'vendor_profile.vendor_capability_interface.methods',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_CAPABILITY_DECLARATION_COMPLETE',
      category: 'compatibility',
      description:
        'Vendor must declare every mandatory capability against dsc-backend-capability-set-v1 via the vendor capability interface.',
      mandatory: true,
      evidence_ref:
        'vendor_profile.vendor_capability_interface.required_capability_declarations',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_VENDOR_COMPATIBILITY_PASS',
      category: 'compatibility',
      description:
        'Vendor registration must resolve compatible under the PHASE-057 vendor compatibility specification before routing.',
      mandatory: true,
      evidence_ref: 'vendor_compatibility.deterministic_compatibility_rules',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_REGISTRY_ACTIVE_ONLY',
      category: 'registry',
      description:
        'Only PHASE-056 registrations in lifecycle active may be considered for routing and execution.',
      mandatory: true,
      evidence_ref: 'vendor_registry.vendor_lifecycle.active_state',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_ROUTER_ROUTED_OUTCOME',
      category: 'routing',
      description:
        'Execution may begin only after a PHASE-059 routing report with outcome routed.',
      mandatory: true,
      evidence_ref: 'vendor_router.routing_report.outcome_values',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_EXECUTION_REQUEST_SHAPE',
      category: 'execution',
      description:
        'Vendor execution entry must accept dsc-vendor-execution-request-v1 exactly.',
      mandatory: true,
      evidence_ref: 'vendor_execution_contract.execution_request',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_EXECUTION_RESPONSE_SHAPE',
      category: 'execution',
      description:
        'Vendor execution exit must emit dsc-vendor-execution-response-v1 exactly.',
      mandatory: true,
      evidence_ref: 'vendor_execution_contract.execution_response',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_EXECUTION_LIFECYCLE',
      category: 'execution',
      description:
        'Vendor must honor the PHASE-060 execution lifecycle transitions with side_effects none.',
      mandatory: true,
      evidence_ref: 'vendor_execution_contract.execution_lifecycle',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_DETERMINISTIC_OUTCOME',
      category: 'determinism',
      description:
        'Identical requests against the same routed vendor registration must yield the same outcome and result_digest.',
      mandatory: true,
      evidence_ref: 'vendor_execution_contract.deterministic_execution_guarantees',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_SPATIAL_FRAME_LOCKED',
      category: 'constraints',
      description:
        'Vendor must operate exclusively in normalized_image_plane_v1 without reprojection.',
      mandatory: true,
      evidence_ref: 'vendor_profile.vendor_capability_interface.spatial_frame_ref',
      implemented_in_this_phase: false,
    },
    {
      requirement_id: 'REQ_NO_GPU_NO_INFERENCE',
      category: 'constraints',
      description:
        'Vendor implementation under this specification must not require GPU or perform inference.',
      mandatory: true,
      evidence_ref: 'design_constraints.gpu_inference',
      implemented_in_this_phase: false,
    },
  ];

  const required_interfaces: RequiredVendorInterfaces = {
    interfaces_id: 'dsc-vendor-required-interfaces-v1',
    description:
      'Exact interface surface a vendor must implement. Methods are reused verbatim from the PHASE-055 vendor capability interface; this phase adds no new methods and implements none.',
    vendor_capability_interface_ref: 'dsc-vendor-capability-interface-v1',
    vendor_profile_ref: VENDOR_PROFILE_PATH,
    methods: vendorMethods.map((method) => ({
      method_id: method.method_id,
      signature: method.signature,
      source_interface: 'dsc-vendor-capability-interface-v1' as const,
      abstract: true as const,
      must_be_implemented_by_vendor: true as const,
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
        surface_id: 'dsc-vendor-execution-request-v1',
        artifact_ref: VENDOR_EXECUTION_CONTRACT_PATH,
        purpose: 'Execution request accepted after a routed vendor routing report.',
        mandatory: true,
      },
      {
        surface_id: 'dsc-vendor-execution-response-v1',
        artifact_ref: VENDOR_EXECUTION_CONTRACT_PATH,
        purpose: 'Execution response emitted at succeeded, failed, or cancelled.',
        mandatory: true,
      },
      {
        surface_id: 'dsc-vendor-routing-report-v1',
        artifact_ref: VENDOR_ROUTER_PATH,
        purpose:
          'Routing report proving selected_vendor_registration_id before execution.',
        mandatory: true,
      },
      {
        surface_id: 'dsc-vendor-compatibility-report-v1',
        artifact_ref: VENDOR_COMPATIBILITY_PATH,
        purpose:
          'Compatibility report required before a registration becomes eligible for routing.',
        mandatory: true,
      },
    ],
    implements_interfaces_in_this_phase: false,
  };

  const checklistItems: VendorComplianceChecklistItem[] = requirements.map(
    (requirement) => ({
      check_id: `CHK_${requirement.requirement_id.replace(/^REQ_/, '')}`,
      requirement_id: requirement.requirement_id,
      description: requirement.description,
      evaluation: 'design_time_declaration_only' as const,
      pass_condition: `${requirement.requirement_id} evidence present and constraints satisfied`,
      fail_code: `DSC_VENDOR_IMPL_FAIL_${requirement.requirement_id.replace(/^REQ_/, '')}`,
      status_in_this_phase: 'not_evaluated' as const,
      mandatory: true as const,
    })
  );

  checklistItems.push(
    {
      check_id: 'CHK_NO_SEED_DEPENDENCE',
      requirement_id: 'REQ_DETERMINISTIC_OUTCOME',
      description: 'Implementation must declare seed_dependence none.',
      evaluation: 'design_time_declaration_only',
      pass_condition: 'seed_dependence equals none',
      fail_code: 'DSC_VENDOR_IMPL_FAIL_SEED_DEPENDENCE',
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
      fail_code: 'DSC_VENDOR_IMPL_FAIL_TIME_DEPENDENCE',
      status_in_this_phase: 'not_evaluated',
      mandatory: true,
    },
    {
      check_id: 'CHK_NO_RANDOMNESS',
      requirement_id: 'REQ_DETERMINISTIC_OUTCOME',
      description: 'Implementation must declare randomness none.',
      evaluation: 'design_time_declaration_only',
      pass_condition: 'randomness equals none',
      fail_code: 'DSC_VENDOR_IMPL_FAIL_RANDOMNESS',
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
      fail_code: 'DSC_VENDOR_IMPL_FAIL_CHANNEL_ORDER',
      status_in_this_phase: 'not_evaluated',
      mandatory: true,
    }
  );

  const deterministic_compliance_checklist: VendorDeterministicComplianceChecklist = {
    checklist_id: 'dsc-vendor-deterministic-compliance-checklist-v1',
    description:
      'Deterministic compliance checklist a future vendor implementation must pass. Every item is declared not_evaluated in this phase; no implementation is scored.',
    evaluation: 'collect_all_failures',
    accept_condition: 'zero failed checks',
    outcome_values: ['compliant', 'non_compliant'],
    items: checklistItems,
    evaluates_implementations_in_this_phase: false,
  };

  const implementation_report: VendorImplementationReportSchema = {
    report_schema_id: 'dsc-vendor-implementation-report-schema-v1',
    report_id: 'dsc-vendor-implementation-report-v1',
    description:
      'Typed report schema for a future vendor implementation compliance evaluation. This phase defines the schema only and evaluates no implementation.',
    encoding: 'application/json',
    required_fields: [
      {
        field: 'implementation_report_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque report identity with no vendor name binding',
      },
      {
        field: 'opaque_vendor_handle',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'opaque_vendor_handle under evaluation',
      },
      {
        field: 'vendor_execution_contract_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal the PHASE-060 vendor execution contract path',
      },
      {
        field: 'vendor_implementation_spec_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal this vendor implementation specification path',
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
        constraint:
          'fail codes collected from failed checks; empty iff outcome compliant',
      },
      {
        field: 'methods_implemented',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint:
          'must cover all required vendor capability interface method_ids when compliant',
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

  const vendorImplementationSpec: DirectSpatialConditioningVendorImplementationSpec = {
    vendor_implementation_spec_id:
      'direct-spatial-conditioning-vendor-implementation-spec-v1',
    phase: DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE,
    system_id: DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID,
    mode: 'design_only_vendor_implementation_spec',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1',
    vendor_execution_contract_ref: VENDOR_EXECUTION_CONTRACT_PATH,
    vendor_execution_contract_phase: DSC_VENDOR_EXECUTION_CONTRACT_PHASE,
    vendor_execution_contract_system_id: DSC_VENDOR_EXECUTION_CONTRACT_SYSTEM_ID,
    vendor_router_ref: VENDOR_ROUTER_PATH,
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
    vendor_implementation_requirements: {
      requirements_id: 'dsc-vendor-implementation-requirements-v1',
      description:
        'Mandatory requirements a future vendor implementation must satisfy. Requirements are declared only; none are implemented in this phase.',
      requirements,
    },
    required_interfaces,
    deterministic_compliance_checklist,
    implementation_report,
    implemented_vendors: {
      count: 0,
      entries: [],
      implementation_policy:
        'vendor implementation is performed by future phases; this phase defines the specification only and binds to no vendor',
      implements_vendors_in_this_phase: false,
    },
    design_constraints: {
      specification_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_vendor_execution_contract: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      implements_vendors_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_IMPLEMENTATION_SPEC_PATH, vendorImplementationSpec);
  return { vendorImplementationSpec };
}
