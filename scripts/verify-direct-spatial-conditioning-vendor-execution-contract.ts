import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  FOUNDATION_PATH,
  SPATIAL_FRAME,
} from '../services/directSpatialConditioningFoundationBuilder.js';
import { CONTRACT_PATH } from '../services/directSpatialConditioningContractBuilder.js';
import { PACKET_PATH } from '../services/directSpatialConditioningPacketBuilder.js';
import { VALIDATION_PATH } from '../services/directSpatialConditioningPacketValidationBuilder.js';
import { ASSEMBLY_PATH } from '../services/directSpatialConditioningPacketAssemblyBuilder.js';
import { GENERATION_PATH } from '../services/directSpatialConditioningPacketGenerationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from '../services/directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_VALIDATION_PATH } from '../services/directSpatialConditioningRuntimeValidationBuilder.js';
import { BACKEND_ADAPTER_FOUNDATION_PATH } from '../services/directSpatialConditioningBackendAdapterFoundationBuilder.js';
import {
  BACKEND_CAPABILITY_REGISTRY_PATH,
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
} from '../services/directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import { BACKEND_COMPATIBILITY_ENGINE_PATH } from '../services/directSpatialConditioningBackendCompatibilityEngineBuilder.js';
import { BACKEND_ADAPTER_REGISTRATION_PATH } from '../services/directSpatialConditioningBackendAdapterRegistrationBuilder.js';
import { BACKEND_RUNTIME_ROUTER_PATH } from '../services/directSpatialConditioningBackendRuntimeRouterBuilder.js';
import { BACKEND_EXECUTION_CONTRACT_PATH } from '../services/directSpatialConditioningBackendExecutionContractBuilder.js';
import { BACKEND_IMPLEMENTATION_SPEC_PATH } from '../services/directSpatialConditioningBackendImplementationSpecBuilder.js';
import { BACKEND_DESIGN_CERTIFICATION_PATH } from '../services/directSpatialConditioningBackendDesignCertificationBuilder.js';
import { BACKEND_PROFILE_PATH } from '../services/directSpatialConditioningBackendProfileBuilder.js';
import { BACKEND_PROFILE_CERTIFICATION_PATH } from '../services/directSpatialConditioningBackendProfileCertificationBuilder.js';
import { BACKEND_TEMPLATE_PATH } from '../services/directSpatialConditioningBackendTemplateBuilder.js';
import {
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_PATH,
} from '../services/directSpatialConditioningReferenceBackendBuilder.js';
import {
  BACKEND_FAMILY_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
} from '../services/directSpatialConditioningBackendFamilyBuilder.js';
import {
  BACKEND_FAMILY_CERTIFICATION_PATH,
  VENDOR_PROFILE_PATH,
} from '../services/directSpatialConditioningVendorProfileBuilder.js';
import { VENDOR_REGISTRY_PATH } from '../services/directSpatialConditioningVendorRegistryBuilder.js';
import { VENDOR_COMPATIBILITY_PATH } from '../services/directSpatialConditioningVendorCompatibilityBuilder.js';
import {
  DSC_VENDOR_ROUTER_PHASE,
  DSC_VENDOR_ROUTER_SYSTEM_ID,
  VENDOR_ROUTER_PATH,
} from '../services/directSpatialConditioningVendorRouterBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_EXECUTION_CONTRACT_PHASE,
  VENDOR_EXECUTION_CONTRACT_PATH,
  buildDirectSpatialConditioningVendorExecutionContract,
  type DirectSpatialConditioningVendorExecutionContract,
} from '../services/directSpatialConditioningVendorExecutionContractBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_EXECUTION_CONTRACT_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_EXECUTION_CONTRACT_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-execution-contract.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-execution-contract-implementation-registry-v1.json';

interface Issue {
  code: string;
  message: string;
}
const issues: Issue[] = [];

function sha256(relativePath: string): string | null {
  const fullPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')) as T;
}

const EXPECTED_REQUEST_FIELDS = [
  'execution_id',
  'routing_report_ref',
  'routing_outcome',
  'selected_vendor_registration_id',
  'selected_vendor_handle',
  'adapted_conditioning_input_ref',
  'capability_set_version',
  'spatial_frame_ref',
  'channel_order',
  'requested_at',
];

const EXPECTED_RESPONSE_FIELDS = [
  'execution_id',
  'outcome',
  'selected_vendor_registration_id',
  'selected_vendor_handle',
  'lifecycle_state',
  'routing_report_ref',
  'result_digest',
  'failure_codes',
  'spatial_frame_ref',
  'channel_order',
  'completed_at',
];

const EXPECTED_STATES = [
  'accepted',
  'bound',
  'running',
  'succeeded',
  'failed',
  'cancelled',
  'released',
];

const EXPECTED_TERMINAL = ['succeeded', 'failed', 'cancelled', 'released'];

const protectedPaths = [
  FOUNDATION_PATH,
  CONTRACT_PATH,
  PACKET_PATH,
  VALIDATION_PATH,
  ASSEMBLY_PATH,
  GENERATION_PATH,
  RUNTIME_INTERFACE_PATH,
  RUNTIME_VALIDATION_PATH,
  BACKEND_ADAPTER_FOUNDATION_PATH,
  BACKEND_CAPABILITY_REGISTRY_PATH,
  BACKEND_COMPATIBILITY_ENGINE_PATH,
  BACKEND_ADAPTER_REGISTRATION_PATH,
  BACKEND_RUNTIME_ROUTER_PATH,
  BACKEND_EXECUTION_CONTRACT_PATH,
  BACKEND_IMPLEMENTATION_SPEC_PATH,
  BACKEND_PROFILE_PATH,
  BACKEND_TEMPLATE_PATH,
  REFERENCE_BACKEND_PATH,
  BACKEND_FAMILY_PATH,
  VENDOR_PROFILE_PATH,
  VENDOR_REGISTRY_PATH,
  VENDOR_COMPATIBILITY_PATH,
  VENDOR_ROUTER_PATH,
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  BACKEND_FAMILY_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, VENDOR_ROUTER_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(`PRECHECK FAILED: missing vendor router ${VENDOR_ROUTER_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(projectRoot, BACKEND_FAMILY_CERTIFICATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing backend family certification ${BACKEND_FAMILY_CERTIFICATION_PATH}`
  );
  process.exit(1);
}

const familyCertification = readJson<{ certified?: boolean }>(
  BACKEND_FAMILY_CERTIFICATION_PATH
);
if (familyCertification.certified !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: backend family is not certified');
  process.exit(1);
}

const vendorRouter = readJson<{ target?: string }>(VENDOR_ROUTER_PATH);
if (vendorRouter.target !== 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_ROUTER_V1') {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: vendor router is not certified with the PASS target'
  );
  process.exit(1);
}

let vendorExecutionContract: DirectSpatialConditioningVendorExecutionContract;
try {
  vendorExecutionContract =
    buildDirectSpatialConditioningVendorExecutionContract(projectRoot)
      .vendorExecutionContract;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR EXECUTION CONTRACT FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorExecutionContract.phase !== DSC_VENDOR_EXECUTION_CONTRACT_PHASE) {
  issues.push({ code: 'PHASE', message: vendorExecutionContract.phase });
}
if (vendorExecutionContract.mode !== 'design_only_vendor_execution_contract') {
  issues.push({ code: 'MODE', message: vendorExecutionContract.mode });
}
if (vendorExecutionContract.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorExecutionContract.target });
}
if (vendorExecutionContract.vendor_router_ref !== VENDOR_ROUTER_PATH) {
  issues.push({
    code: 'VENDOR_ROUTER_REF',
    message: vendorExecutionContract.vendor_router_ref,
  });
}
if (vendorExecutionContract.vendor_router_phase !== DSC_VENDOR_ROUTER_PHASE) {
  issues.push({
    code: 'VENDOR_ROUTER_PHASE',
    message: vendorExecutionContract.vendor_router_phase,
  });
}
if (vendorExecutionContract.vendor_router_system_id !== DSC_VENDOR_ROUTER_SYSTEM_ID) {
  issues.push({
    code: 'VENDOR_ROUTER_SYSTEM_ID',
    message: vendorExecutionContract.vendor_router_system_id,
  });
}
if (vendorExecutionContract.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH) {
  issues.push({
    code: 'VENDOR_COMPATIBILITY_REF',
    message: vendorExecutionContract.vendor_compatibility_ref,
  });
}
if (vendorExecutionContract.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
  issues.push({
    code: 'VENDOR_REGISTRY_REF',
    message: vendorExecutionContract.vendor_registry_ref,
  });
}
if (vendorExecutionContract.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
  issues.push({
    code: 'VENDOR_PROFILE_REF',
    message: vendorExecutionContract.vendor_profile_ref,
  });
}
if (vendorExecutionContract.family_ref !== BACKEND_FAMILY_PATH) {
  issues.push({ code: 'FAMILY_REF', message: vendorExecutionContract.family_ref });
}
if (
  vendorExecutionContract.family_certification_ref !== BACKEND_FAMILY_CERTIFICATION_PATH
) {
  issues.push({
    code: 'FAMILY_CERTIFICATION_REF',
    message: vendorExecutionContract.family_certification_ref,
  });
}
if (vendorExecutionContract.reference_backend_ref !== REFERENCE_BACKEND_PATH) {
  issues.push({
    code: 'REFERENCE_BACKEND_REF',
    message: vendorExecutionContract.reference_backend_ref,
  });
}
if (
  vendorExecutionContract.reference_backend_certification_ref !==
  REFERENCE_BACKEND_CERTIFICATION_PATH
) {
  issues.push({
    code: 'REFERENCE_BACKEND_CERTIFICATION_REF',
    message: vendorExecutionContract.reference_backend_certification_ref,
  });
}
if (vendorExecutionContract.template_ref !== BACKEND_TEMPLATE_PATH) {
  issues.push({
    code: 'TEMPLATE_REF',
    message: vendorExecutionContract.template_ref,
  });
}
if (
  vendorExecutionContract.template_certification_ref !==
  BACKEND_TEMPLATE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'TEMPLATE_CERTIFICATION_REF',
    message: vendorExecutionContract.template_certification_ref,
  });
}
if (vendorExecutionContract.profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({ code: 'PROFILE_REF', message: vendorExecutionContract.profile_ref });
}
if (
  vendorExecutionContract.profile_certification_ref !==
  BACKEND_PROFILE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: vendorExecutionContract.profile_certification_ref,
  });
}
if (
  vendorExecutionContract.backend_design_certification_ref !==
  BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: vendorExecutionContract.backend_design_certification_ref,
  });
}
if (
  vendorExecutionContract.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH
) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: vendorExecutionContract.implementation_spec_ref,
  });
}
if (vendorExecutionContract.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: vendorExecutionContract.execution_contract_ref,
  });
}
if (vendorExecutionContract.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: vendorExecutionContract.runtime_router_ref,
  });
}
if (
  vendorExecutionContract.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH
) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: vendorExecutionContract.adapter_registration_ref,
  });
}
if (
  vendorExecutionContract.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH
) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: vendorExecutionContract.compatibility_engine_ref,
  });
}
if (
  vendorExecutionContract.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH
) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: vendorExecutionContract.capability_registry_ref,
  });
}
if (
  vendorExecutionContract.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH
) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: vendorExecutionContract.adapter_foundation_ref,
  });
}
if (vendorExecutionContract.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: vendorExecutionContract.runtime_interface_ref,
  });
}
if (vendorExecutionContract.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: vendorExecutionContract.runtime_package_ref,
  });
}
if (
  JSON.stringify(vendorExecutionContract.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorExecutionContract.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorExecutionContract.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorExecutionContract.required_channels.join(','),
  });
}
if (vendorExecutionContract.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({
    code: 'SPATIAL_FRAME',
    message: vendorExecutionContract.spatial_frame_ref,
  });
}
if (
  vendorExecutionContract.capability_set_id !== CAPABILITY_SET_ID ||
  vendorExecutionContract.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorExecutionContract.capability_set_id}@${vendorExecutionContract.capability_set_version}`,
  });
}

// 1) Execution request.
const request = vendorExecutionContract.execution_request;
if (request.request_schema_id !== 'dsc-vendor-execution-request-v1') {
  issues.push({ code: 'REQUEST_ID', message: request.request_schema_id });
}
const requestFields = request.required_fields.map((field) => field.field);
if (JSON.stringify(requestFields) !== JSON.stringify(EXPECTED_REQUEST_FIELDS)) {
  issues.push({ code: 'REQUEST_FIELDS', message: requestFields.join(',') });
}
for (const field of request.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'REQUEST_FIELD_INCOMPLETE', message: field.field });
  }
}
if (
  request.optional_fields.length !== 0 ||
  request.additional_fields ||
  !request.requires_routed_outcome ||
  request.preconditions.length < 5
) {
  issues.push({ code: 'REQUEST_POLICY', message: 'preconditions/routed' });
}

// 2) Execution response.
const response = vendorExecutionContract.execution_response;
if (response.response_schema_id !== 'dsc-vendor-execution-response-v1') {
  issues.push({ code: 'RESPONSE_ID', message: response.response_schema_id });
}
const responseFields = response.required_fields.map((field) => field.field);
if (JSON.stringify(responseFields) !== JSON.stringify(EXPECTED_RESPONSE_FIELDS)) {
  issues.push({ code: 'RESPONSE_FIELDS', message: responseFields.join(',') });
}
for (const field of response.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'RESPONSE_FIELD_INCOMPLETE', message: field.field });
  }
}
if (
  JSON.stringify(response.outcome_values) !==
    JSON.stringify(['succeeded', 'failed', 'cancelled']) ||
  response.optional_fields.length !== 0 ||
  response.additional_fields ||
  response.materializes_tensors ||
  response.materializes_frames
) {
  issues.push({ code: 'RESPONSE_POLICY', message: 'outcomes/materialization' });
}

// 3) Execution lifecycle.
const lifecycle = vendorExecutionContract.execution_lifecycle;
if (lifecycle.lifecycle_id !== 'dsc-vendor-execution-lifecycle-v1') {
  issues.push({ code: 'LIFECYCLE_ID', message: lifecycle.lifecycle_id });
}
if (JSON.stringify(lifecycle.states) !== JSON.stringify(EXPECTED_STATES)) {
  issues.push({ code: 'LIFECYCLE_STATES', message: lifecycle.states.join(',') });
}
if (
  lifecycle.initial_state !== 'accepted' ||
  JSON.stringify(lifecycle.terminal_states) !== JSON.stringify(EXPECTED_TERMINAL) ||
  lifecycle.executes_vendors_in_this_phase
) {
  issues.push({ code: 'LIFECYCLE_ANCHORS', message: lifecycle.initial_state });
}
if (lifecycle.transitions.length !== 10) {
  issues.push({
    code: 'LIFECYCLE_TRANSITIONS',
    message: `${lifecycle.transitions.length}`,
  });
}
const seenTransitions = new Set<string>();
for (const transition of lifecycle.transitions) {
  const key = `${transition.from}->${transition.to}:${transition.trigger}`;
  if (seenTransitions.has(key)) {
    issues.push({ code: 'LIFECYCLE_TRANSITION_DUPLICATE', message: key });
  }
  seenTransitions.add(key);
  if (
    !transition.allowed ||
    transition.side_effects !== 'none' ||
    !transition.trigger ||
    !(EXPECTED_STATES as string[]).includes(transition.from) ||
    !(EXPECTED_STATES as string[]).includes(transition.to)
  ) {
    issues.push({ code: 'LIFECYCLE_TRANSITION_INCOMPLETE', message: key });
  }
}
const requiredTransitions = [
  ['accepted', 'bound'],
  ['bound', 'running'],
  ['running', 'succeeded'],
  ['running', 'failed'],
  ['running', 'cancelled'],
  ['succeeded', 'released'],
  ['failed', 'released'],
  ['cancelled', 'released'],
];
for (const [from, to] of requiredTransitions) {
  if (
    !lifecycle.transitions.some(
      (transition) => transition.from === from && transition.to === to
    )
  ) {
    issues.push({ code: 'LIFECYCLE_REQUIRED_TRANSITION', message: `${from}->${to}` });
  }
}
if (lifecycle.invariants.length < 5) {
  issues.push({ code: 'LIFECYCLE_INVARIANTS', message: `${lifecycle.invariants.length}` });
}

// 4) Deterministic execution guarantees.
const guarantees = vendorExecutionContract.deterministic_execution_guarantees;
if (guarantees.guarantees_id !== 'dsc-vendor-deterministic-execution-guarantees-v1') {
  issues.push({ code: 'GUARANTEES_ID', message: guarantees.guarantees_id });
}
if (
  guarantees.purity !==
    'deterministic_pure_function_of_request_and_routed_vendor_registration' ||
  guarantees.seed_dependence !== 'none' ||
  guarantees.time_dependence !== 'none' ||
  guarantees.randomness !== 'none' ||
  !guarantees.vendor_neutral ||
  !guarantees.same_inputs_same_outcome ||
  guarantees.executes_vendors_in_this_phase
) {
  issues.push({ code: 'GUARANTEES_PURITY', message: guarantees.purity });
}
if (
  guarantees.ordering.channel_order !== 'foundation_channel_order' ||
  guarantees.ordering.response_fields !== 'response_schema_field_order' ||
  guarantees.ordering.lifecycle_events !== 'lifecycle_transition_order'
) {
  issues.push({
    code: 'GUARANTEES_ORDERING',
    message: JSON.stringify(guarantees.ordering),
  });
}
if (guarantees.forbidden.length < 5 || guarantees.guarantees.length < 5) {
  issues.push({ code: 'GUARANTEES_TEXT', message: 'forbidden/guarantees' });
}

// Read-only: no vendors executed in this phase.
const executed = vendorExecutionContract.executed_vendors;
if (
  executed.count !== 0 ||
  executed.entries.length !== 0 ||
  executed.executes_vendors_in_this_phase ||
  !executed.execution_policy
) {
  issues.push({ code: 'EXECUTED_VENDORS', message: `${executed.count}` });
}

// Design constraints.
const constraints = vendorExecutionContract.design_constraints;
if (
  !constraints.contract_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_vendor_router ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.executes_vendors_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [
  VENDOR_EXECUTION_CONTRACT_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorExecutionContract);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_execution_contract_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_EXECUTION_CONTRACT_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorExecutionContract.mode,
  execution_request: request.request_schema_id,
  request_fields: requestFields.length,
  execution_response: response.response_schema_id,
  response_fields: responseFields.length,
  execution_lifecycle: lifecycle.lifecycle_id,
  lifecycle_states: lifecycle.states,
  lifecycle_transitions: lifecycle.transitions.length,
  deterministic_execution_guarantees: guarantees.guarantees_id,
  executed_vendors: executed.count,
  sources_supported: vendorExecutionContract.sources_supported.length,
  reuses_vendor_router: true,
  vendor_neutral: true,
  no_vendor_implementation: true,
  design_constraints: vendorExecutionContract.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_execution_contract: VENDOR_EXECUTION_CONTRACT_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    vendor_router: VENDOR_ROUTER_PATH,
    vendor_compatibility: VENDOR_COMPATIBILITY_PATH,
    family_certification: BACKEND_FAMILY_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_EXECUTION_CONTRACT_VALIDATION_REPORT.json';
fs.mkdirSync(path.dirname(path.join(projectRoot, reportPath)), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, reportPath),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8'
);

console.log(report.final_verdict);
console.log(
  [
    `mode=${report.mode}`,
    `request_fields=${report.request_fields}`,
    `response_fields=${report.response_fields}`,
    `lifecycle_states=${report.lifecycle_states.length}`,
    `transitions=${report.lifecycle_transitions}`,
    `executed_vendors=${report.executed_vendors}`,
    `upstream_unmodified=${report.upstream_protected_unmodified}`,
    `error_count=${report.error_count}`,
  ].join(' | ')
);

if (!validationPassed) {
  for (const issue of issues) {
    console.error(`[error] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
