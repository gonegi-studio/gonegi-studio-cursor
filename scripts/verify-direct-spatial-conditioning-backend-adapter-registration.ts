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
import {
  BACKEND_COMPATIBILITY_ENGINE_PATH,
  type DirectSpatialConditioningBackendCompatibilityEngine,
} from '../services/directSpatialConditioningBackendCompatibilityEngineBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  BACKEND_ADAPTER_REGISTRATION_PATH,
  DSC_BACKEND_ADAPTER_REGISTRATION_PHASE,
  buildDirectSpatialConditioningBackendAdapterRegistration,
  type DirectSpatialConditioningBackendAdapterRegistration,
} from '../services/directSpatialConditioningBackendAdapterRegistrationBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_REGISTRATION_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_REGISTRATION_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-adapter-registration.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-adapter-registration-implementation-registry-v1.json';

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

const EXPECTED_STAGES = [
  'bind_registration_request',
  'run_compatibility_engine',
  'validate_registration_payload',
  'allocate_registration_identity',
  'write_registration_record',
  'emit_registration_receipt',
];

const EXPECTED_RECORD_FIELDS = [
  'registration_id',
  'backend_id',
  'backend_version',
  'adapter_interface_version',
  'capability_set_id',
  'capability_set_version',
  'compatibility_report_ref',
  'compatibility_outcome',
  'lifecycle_state',
  'registered_channels',
  'spatial_frame_ref',
  'created_at',
];

const EXPECTED_STATES = ['pending', 'active', 'suspended', 'deregistered'];

const EXPECTED_DEREG_REASONS = [
  'caller_requested',
  'capability_set_major_mismatch',
  'compatibility_revoked',
  'lifecycle_expired',
  'policy_violation',
];

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
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, BACKEND_COMPATIBILITY_ENGINE_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing compatibility engine ${BACKEND_COMPATIBILITY_ENGINE_PATH}`
  );
  process.exit(1);
}

const compatibilityEngine = readJson<DirectSpatialConditioningBackendCompatibilityEngine>(
  BACKEND_COMPATIBILITY_ENGINE_PATH
);

let adapterRegistration: DirectSpatialConditioningBackendAdapterRegistration;
try {
  adapterRegistration =
    buildDirectSpatialConditioningBackendAdapterRegistration(projectRoot)
      .adapterRegistration;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`ADAPTER REGISTRATION FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (adapterRegistration.phase !== DSC_BACKEND_ADAPTER_REGISTRATION_PHASE) {
  issues.push({ code: 'PHASE', message: adapterRegistration.phase });
}
if (adapterRegistration.mode !== 'design_only_registration') {
  issues.push({ code: 'MODE', message: adapterRegistration.mode });
}
if (adapterRegistration.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: adapterRegistration.target });
}
if (adapterRegistration.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: adapterRegistration.compatibility_engine_ref,
  });
}
if (adapterRegistration.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: adapterRegistration.capability_registry_ref,
  });
}
if (adapterRegistration.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: adapterRegistration.adapter_foundation_ref,
  });
}
if (adapterRegistration.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: adapterRegistration.runtime_interface_ref,
  });
}
if (adapterRegistration.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: adapterRegistration.runtime_package_ref,
  });
}
if (
  JSON.stringify(adapterRegistration.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${adapterRegistration.sources_supported.length}`,
  });
}
if (
  JSON.stringify(adapterRegistration.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: adapterRegistration.required_channels.join(','),
  });
}
if (adapterRegistration.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: adapterRegistration.spatial_frame_ref });
}
if (
  adapterRegistration.capability_set_id !== CAPABILITY_SET_ID ||
  adapterRegistration.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${adapterRegistration.capability_set_id}@${adapterRegistration.capability_set_version}`,
  });
}

// Engine reuse must match the frozen engine identities.
if (
  adapterRegistration.compatibility_engine_phase !== compatibilityEngine.phase ||
  adapterRegistration.compatibility_engine_system_id !== compatibilityEngine.system_id
) {
  issues.push({ code: 'ENGINE_IDENTITY_DRIFT', message: 'phase/system_id' });
}

// 1) Registration flow.
const flow = adapterRegistration.registration_flow;
if (flow.flow_id !== 'dsc-backend-adapter-registration-flow-v1') {
  issues.push({ code: 'FLOW_ID', message: flow.flow_id });
}
const stageIds = flow.ordered_stages.map((stage) => stage.stage_id);
if (JSON.stringify(stageIds) !== JSON.stringify(EXPECTED_STAGES)) {
  issues.push({ code: 'FLOW_STAGES', message: stageIds.join(',') });
}
for (let index = 0; index < flow.ordered_stages.length; index += 1) {
  const stage = flow.ordered_stages[index];
  if (
    stage.order !== index + 1 ||
    stage.side_effects !== 'none' ||
    stage.executed_in_this_phase ||
    stage.inputs.length === 0 ||
    stage.outputs.length === 0 ||
    !stage.description
  ) {
    issues.push({ code: 'FLOW_STAGE_INCOMPLETE', message: stage.stage_id });
  }
}
if (
  flow.reuse_policy.compatibility_engine !== 'mandatory_exact_reuse' ||
  flow.reuse_policy.capability_registry !== 'mandatory_read_only_via_engine'
) {
  issues.push({ code: 'FLOW_REUSE_POLICY', message: JSON.stringify(flow.reuse_policy) });
}
if (
  !flow.ordered_stages.some((stage) => stage.stage_id === 'run_compatibility_engine')
) {
  issues.push({ code: 'FLOW_MISSING_ENGINE_STAGE', message: 'run_compatibility_engine' });
}

// 2) Registration schema.
const schema = adapterRegistration.registration_schema;
if (schema.schema_id !== 'dsc-backend-adapter-registration-record-v1') {
  issues.push({ code: 'SCHEMA_ID', message: schema.schema_id });
}
const recordFields = schema.required_fields.map((field) => field.field);
if (JSON.stringify(recordFields) !== JSON.stringify(EXPECTED_RECORD_FIELDS)) {
  issues.push({ code: 'SCHEMA_FIELDS', message: recordFields.join(',') });
}
for (const field of schema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}
if (
  schema.optional_fields.length !== 0 ||
  schema.additional_fields ||
  schema.identity_policy !== 'opaque_registration_id_no_vendor_binding'
) {
  issues.push({ code: 'SCHEMA_POLICY', message: schema.identity_policy });
}
if (
  JSON.stringify(schema.uniqueness.unique_on) !==
    JSON.stringify([
      'backend_id',
      'adapter_interface_version',
      'capability_set_version',
    ]) ||
  schema.uniqueness.duplicate_policy !== 'reject_duplicate_active_registration' ||
  schema.uniqueness.duplicate_code !== 'DSC_BACKEND_REGISTRATION_DUPLICATE_ACTIVE'
) {
  issues.push({ code: 'SCHEMA_UNIQUENESS', message: schema.uniqueness.duplicate_code });
}

// 3) Lifecycle.
const lifecycle = adapterRegistration.lifecycle;
if (lifecycle.lifecycle_id !== 'dsc-backend-adapter-registration-lifecycle-v1') {
  issues.push({ code: 'LIFECYCLE_ID', message: lifecycle.lifecycle_id });
}
if (JSON.stringify(lifecycle.states) !== JSON.stringify(EXPECTED_STATES)) {
  issues.push({ code: 'LIFECYCLE_STATES', message: lifecycle.states.join(',') });
}
if (
  lifecycle.initial_state !== 'pending' ||
  lifecycle.active_state !== 'active' ||
  lifecycle.terminal_state !== 'deregistered' ||
  lifecycle.registers_adapters_in_this_phase
) {
  issues.push({ code: 'LIFECYCLE_ANCHORS', message: lifecycle.initial_state });
}
if (lifecycle.transitions.length < 6) {
  issues.push({ code: 'LIFECYCLE_TRANSITIONS', message: `${lifecycle.transitions.length}` });
}
const seenTransitions = new Set<string>();
for (const transition of lifecycle.transitions) {
  const key = `${transition.from}->${transition.to}:${transition.trigger}`;
  if (seenTransitions.has(key)) {
    issues.push({ code: 'LIFECYCLE_TRANSITION_DUPLICATE', message: key });
  }
  seenTransitions.add(key);
  if (!transition.allowed || !transition.trigger) {
    issues.push({ code: 'LIFECYCLE_TRANSITION_INCOMPLETE', message: key });
  }
  if (!EXPECTED_STATES.includes(transition.from) || !EXPECTED_STATES.includes(transition.to)) {
    issues.push({ code: 'LIFECYCLE_TRANSITION_STATE', message: key });
  }
}
const hasPendingToActive = lifecycle.transitions.some(
  (transition) => transition.from === 'pending' && transition.to === 'active'
);
const hasActiveToDeregistered = lifecycle.transitions.some(
  (transition) => transition.from === 'active' && transition.to === 'deregistered'
);
const suspendedToActive = lifecycle.transitions.find(
  (transition) => transition.from === 'suspended' && transition.to === 'active'
);
if (!hasPendingToActive || !hasActiveToDeregistered) {
  issues.push({ code: 'LIFECYCLE_REQUIRED_TRANSITIONS', message: 'pending/active/deregistered' });
}
if (!suspendedToActive || !suspendedToActive.requires_compatibility_recheck) {
  issues.push({
    code: 'LIFECYCLE_SUSPENDED_RECHECK',
    message: 'suspended->active must recheck compatibility',
  });
}
if (lifecycle.invariants.length < 5) {
  issues.push({ code: 'LIFECYCLE_INVARIANTS', message: `${lifecycle.invariants.length}` });
}

// 3-1) Deregistration policy.
const dereg = adapterRegistration.deregistration_policy;
if (dereg.policy_id !== 'dsc-backend-adapter-deregistration-policy-v1') {
  issues.push({ code: 'DEREG_ID', message: dereg.policy_id });
}
if (JSON.stringify(dereg.allowed_reasons) !== JSON.stringify(EXPECTED_DEREG_REASONS)) {
  issues.push({ code: 'DEREG_REASONS', message: dereg.allowed_reasons.join(',') });
}
if (
  dereg.effects.lifecycle_state_becomes !== 'deregistered' ||
  !dereg.effects.registration_record_retained ||
  dereg.effects.re_registration_policy !==
    'requires_new_registration_flow_and_fresh_compatibility_report' ||
  !dereg.effects.binding_handles_released ||
  !dereg.irreversible ||
  dereg.executed_in_this_phase
) {
  issues.push({ code: 'DEREG_EFFECTS', message: JSON.stringify(dereg.effects) });
}
if (dereg.forbidden.length < 5) {
  issues.push({ code: 'DEREG_FORBIDDEN', message: `${dereg.forbidden.length}` });
}

// 4) Registration validation.
const validation = adapterRegistration.registration_validation;
if (validation.validation_id !== 'dsc-backend-adapter-registration-validation-v1') {
  issues.push({ code: 'VALIDATION_ID', message: validation.validation_id });
}
if (
  validation.evaluation !== 'collect_all_rejections' ||
  validation.accept_condition !==
    'zero rejection codes and compatibility outcome compatible' ||
  JSON.stringify(validation.outcome_values) !== JSON.stringify(['accepted', 'rejected']) ||
  !validation.requires_compatible_engine_outcome ||
  validation.evaluates_registrations_in_this_phase
) {
  issues.push({ code: 'VALIDATION_POLICY', message: validation.accept_condition });
}
if (validation.checks.length < 9) {
  issues.push({ code: 'VALIDATION_CHECKS', message: `${validation.checks.length}` });
}
const seenCheckIds = new Set<string>();
const seenCodes = new Set<string>();
for (const check of validation.checks) {
  if (seenCheckIds.has(check.check_id)) {
    issues.push({ code: 'VALIDATION_CHECK_DUPLICATE', message: check.check_id });
  }
  seenCheckIds.add(check.check_id);
  if (seenCodes.has(check.rejection_code)) {
    issues.push({ code: 'VALIDATION_CODE_DUPLICATE', message: check.rejection_code });
  }
  seenCodes.add(check.rejection_code);
  if (
    !check.mandatory ||
    !check.stage_ref ||
    !check.description ||
    !/^DSC_BACKEND_REGISTRATION_[A-Z0-9_]+$/.test(check.rejection_code)
  ) {
    issues.push({ code: 'VALIDATION_CHECK_INCOMPLETE', message: check.check_id });
  }
}
if (!seenCheckIds.has('compatibility_outcome_must_be_compatible')) {
  issues.push({
    code: 'VALIDATION_MISSING_COMPAT_CHECK',
    message: 'compatibility_outcome_must_be_compatible',
  });
}

// Read-only: no adapter registered in this phase.
const registered = adapterRegistration.registered_adapters;
if (
  registered.count !== 0 ||
  registered.entries.length !== 0 ||
  registered.registers_adapters_in_this_phase ||
  !registered.registration_policy
) {
  issues.push({ code: 'REGISTERED_ADAPTERS', message: `${registered.count}` });
}

// Design constraints.
const constraints = adapterRegistration.design_constraints;
if (
  !constraints.registration_only ||
  !constraints.read_only ||
  !constraints.backend_agnostic ||
  !constraints.reuses_compatibility_engine ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.registers_adapters_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [
  BACKEND_ADAPTER_REGISTRATION_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(adapterRegistration);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_backend_adapter_registration_${Date.now().toString(36)}`,
  phase: DSC_BACKEND_ADAPTER_REGISTRATION_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: adapterRegistration.mode,
  registration_flow: flow.flow_id,
  registration_stages: stageIds,
  registration_schema: schema.schema_id,
  registration_fields: recordFields.length,
  lifecycle: lifecycle.lifecycle_id,
  lifecycle_states: lifecycle.states,
  lifecycle_transitions: lifecycle.transitions.length,
  deregistration_policy: dereg.policy_id,
  deregistration_reasons: dereg.allowed_reasons.length,
  registration_validation: validation.validation_id,
  validation_checks: validation.checks.length,
  registered_adapters: registered.count,
  sources_supported: adapterRegistration.sources_supported.length,
  reuses_compatibility_engine: true,
  backend_agnostic: true,
  design_constraints: adapterRegistration.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    adapter_registration: BACKEND_ADAPTER_REGISTRATION_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    compatibility_engine: BACKEND_COMPATIBILITY_ENGINE_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_REGISTRATION_VALIDATION_REPORT.json';
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
    `stages=${report.registration_stages.length}`,
    `fields=${report.registration_fields}`,
    `lifecycle_states=${report.lifecycle_states.length}`,
    `transitions=${report.lifecycle_transitions}`,
    `validation_checks=${report.validation_checks}`,
    `registered_adapters=${report.registered_adapters}`,
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
