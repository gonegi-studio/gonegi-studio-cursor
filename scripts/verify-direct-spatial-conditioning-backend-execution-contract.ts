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
import {
  BACKEND_RUNTIME_ROUTER_PATH,
  type DirectSpatialConditioningBackendRuntimeRouter,
} from '../services/directSpatialConditioningBackendRuntimeRouterBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  BACKEND_EXECUTION_CONTRACT_PATH,
  DSC_BACKEND_EXECUTION_CONTRACT_PHASE,
  buildDirectSpatialConditioningBackendExecutionContract,
  type DirectSpatialConditioningBackendExecutionContract,
} from '../services/directSpatialConditioningBackendExecutionContractBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_EXECUTION_CONTRACT_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_BACKEND_EXECUTION_CONTRACT_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-execution-contract.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-execution-contract-implementation-registry-v1.json';

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
  'selected_registration_id',
  'selected_backend_id',
  'adapted_conditioning_input_ref',
  'capability_set_version',
  'spatial_frame_ref',
  'channel_order',
  'requested_at',
];

const EXPECTED_RESPONSE_FIELDS = [
  'execution_id',
  'outcome',
  'selected_registration_id',
  'selected_backend_id',
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
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, BACKEND_RUNTIME_ROUTER_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(`PRECHECK FAILED: missing runtime router ${BACKEND_RUNTIME_ROUTER_PATH}`);
  process.exit(1);
}

const runtimeRouter = readJson<DirectSpatialConditioningBackendRuntimeRouter>(
  BACKEND_RUNTIME_ROUTER_PATH
);

let executionContract: DirectSpatialConditioningBackendExecutionContract;
try {
  executionContract =
    buildDirectSpatialConditioningBackendExecutionContract(projectRoot).executionContract;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`EXECUTION CONTRACT FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (executionContract.phase !== DSC_BACKEND_EXECUTION_CONTRACT_PHASE) {
  issues.push({ code: 'PHASE', message: executionContract.phase });
}
if (executionContract.mode !== 'design_only_contract') {
  issues.push({ code: 'MODE', message: executionContract.mode });
}
if (executionContract.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: executionContract.target });
}
if (executionContract.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: executionContract.runtime_router_ref,
  });
}
if (executionContract.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: executionContract.adapter_registration_ref,
  });
}
if (executionContract.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: executionContract.compatibility_engine_ref,
  });
}
if (executionContract.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: executionContract.capability_registry_ref,
  });
}
if (executionContract.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: executionContract.adapter_foundation_ref,
  });
}
if (executionContract.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: executionContract.runtime_interface_ref,
  });
}
if (executionContract.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: executionContract.runtime_package_ref,
  });
}
if (
  JSON.stringify(executionContract.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${executionContract.sources_supported.length}`,
  });
}
if (
  JSON.stringify(executionContract.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: executionContract.required_channels.join(','),
  });
}
if (executionContract.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: executionContract.spatial_frame_ref });
}
if (
  executionContract.capability_set_id !== CAPABILITY_SET_ID ||
  executionContract.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${executionContract.capability_set_id}@${executionContract.capability_set_version}`,
  });
}
if (
  executionContract.runtime_router_phase !== runtimeRouter.phase ||
  executionContract.runtime_router_system_id !== runtimeRouter.system_id
) {
  issues.push({ code: 'ROUTER_IDENTITY_DRIFT', message: 'phase/system_id' });
}

// 1) Execution request.
const request = executionContract.execution_request;
if (request.request_schema_id !== 'dsc-backend-execution-request-v1') {
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
const response = executionContract.execution_response;
if (response.response_schema_id !== 'dsc-backend-execution-response-v1') {
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
const lifecycle = executionContract.execution_lifecycle;
if (lifecycle.lifecycle_id !== 'dsc-backend-execution-lifecycle-v1') {
  issues.push({ code: 'LIFECYCLE_ID', message: lifecycle.lifecycle_id });
}
if (JSON.stringify(lifecycle.states) !== JSON.stringify(EXPECTED_STATES)) {
  issues.push({ code: 'LIFECYCLE_STATES', message: lifecycle.states.join(',') });
}
if (
  lifecycle.initial_state !== 'accepted' ||
  JSON.stringify(lifecycle.terminal_states) !== JSON.stringify(EXPECTED_TERMINAL) ||
  lifecycle.executes_backends_in_this_phase
) {
  issues.push({ code: 'LIFECYCLE_ANCHORS', message: lifecycle.initial_state });
}
if (lifecycle.transitions.length < 10) {
  issues.push({ code: 'LIFECYCLE_TRANSITIONS', message: `${lifecycle.transitions.length}` });
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
    !EXPECTED_STATES.includes(transition.from) ||
    !EXPECTED_STATES.includes(transition.to)
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
const guarantees = executionContract.deterministic_execution_guarantees;
if (guarantees.guarantees_id !== 'dsc-backend-deterministic-execution-guarantees-v1') {
  issues.push({ code: 'GUARANTEES_ID', message: guarantees.guarantees_id });
}
if (
  guarantees.purity !==
    'deterministic_pure_function_of_request_and_routed_registration' ||
  guarantees.seed_dependence !== 'none' ||
  guarantees.time_dependence !== 'none' ||
  guarantees.randomness !== 'none' ||
  !guarantees.backend_agnostic ||
  !guarantees.same_inputs_same_outcome ||
  guarantees.executes_backends_in_this_phase
) {
  issues.push({ code: 'GUARANTEES_PURITY', message: guarantees.purity });
}
if (
  guarantees.ordering.channel_order !== 'foundation_channel_order' ||
  guarantees.ordering.response_fields !== 'response_schema_field_order' ||
  guarantees.ordering.lifecycle_events !== 'lifecycle_transition_order'
) {
  issues.push({ code: 'GUARANTEES_ORDERING', message: JSON.stringify(guarantees.ordering) });
}
if (guarantees.forbidden.length < 5 || guarantees.guarantees.length < 5) {
  issues.push({ code: 'GUARANTEES_TEXT', message: 'forbidden/guarantees' });
}

// Read-only: no backend executed in this phase.
const executed = executionContract.executed_backends;
if (
  executed.count !== 0 ||
  executed.entries.length !== 0 ||
  executed.executes_backends_in_this_phase ||
  !executed.execution_policy
) {
  issues.push({ code: 'EXECUTED_BACKENDS', message: `${executed.count}` });
}

// Design constraints.
const constraints = executionContract.design_constraints;
if (
  !constraints.contract_only ||
  !constraints.read_only ||
  !constraints.backend_agnostic ||
  !constraints.reuses_runtime_router ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.executes_backends_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [
  BACKEND_EXECUTION_CONTRACT_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(executionContract);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_backend_execution_contract_${Date.now().toString(36)}`,
  phase: DSC_BACKEND_EXECUTION_CONTRACT_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: executionContract.mode,
  execution_request: request.request_schema_id,
  request_fields: requestFields.length,
  execution_response: response.response_schema_id,
  response_fields: responseFields.length,
  execution_lifecycle: lifecycle.lifecycle_id,
  lifecycle_states: lifecycle.states,
  lifecycle_transitions: lifecycle.transitions.length,
  deterministic_execution_guarantees: guarantees.guarantees_id,
  executed_backends: executed.count,
  sources_supported: executionContract.sources_supported.length,
  reuses_runtime_router: true,
  backend_agnostic: true,
  design_constraints: executionContract.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    execution_contract: BACKEND_EXECUTION_CONTRACT_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    runtime_router: BACKEND_RUNTIME_ROUTER_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_BACKEND_EXECUTION_CONTRACT_VALIDATION_REPORT.json';
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
    `executed_backends=${report.executed_backends}`,
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
