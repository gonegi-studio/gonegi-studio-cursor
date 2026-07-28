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
  VENDOR_PROFILE_ID,
  VENDOR_PROFILE_PATH,
} from '../services/directSpatialConditioningVendorProfileBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_REGISTRY_PHASE,
  VENDOR_REGISTRY_PATH,
  buildDirectSpatialConditioningVendorRegistry,
  type DirectSpatialConditioningVendorRegistry,
} from '../services/directSpatialConditioningVendorRegistryBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REGISTRY_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_REGISTRY_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-registry.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-registry-implementation-registry-v1.json';

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

const EXPECTED_SCHEMA_FIELDS = [
  'vendor_registry_id',
  'vendor_profile_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'vendor_registration_record',
  'vendor_lifecycle',
  'vendor_deregistration_policy',
  'vendor_validation_rules',
];

const EXPECTED_RECORD_FIELDS = [
  'vendor_registration_id',
  'opaque_vendor_handle',
  'vendor_profile_id',
  'vendor_profile_version',
  'lifecycle_state',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'declared_channels',
  'vendor_capability_interface_ref',
  'requires_gpu',
  'performs_inference',
];

const EXPECTED_STATES = ['pending', 'active', 'suspended', 'deregistered'];

const EXPECTED_DEREGISTRATION_REASONS = [
  'operator_requested',
  'capability_set_incompatible',
  'vendor_profile_revoked',
  'lifecycle_expired',
  'validation_rejected',
];

const EXPECTED_VALIDATION_CHECKS = [
  'CHK_VENDOR_PROFILE_BOUND',
  'CHK_VENDOR_IDENTITY_OPAQUE',
  'CHK_CAPABILITY_INTERFACE',
  'CHK_CAPABILITY_SET_LOCKED',
  'CHK_SPATIAL_FRAME_LOCKED',
  'CHK_CHANNEL_ORDER_FOUNDATION',
  'CHK_NO_GPU_NO_INFERENCE',
  'CHK_NO_VENDOR_NAME',
  'CHK_LIFECYCLE_STARTS_PENDING',
  'CHK_DUPLICATE_ACTIVE_REJECTED',
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
  BACKEND_ADAPTER_REGISTRATION_PATH,
  BACKEND_RUNTIME_ROUTER_PATH,
  BACKEND_EXECUTION_CONTRACT_PATH,
  BACKEND_IMPLEMENTATION_SPEC_PATH,
  BACKEND_PROFILE_PATH,
  BACKEND_TEMPLATE_PATH,
  REFERENCE_BACKEND_PATH,
  BACKEND_FAMILY_PATH,
  VENDOR_PROFILE_PATH,
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

if (!fs.existsSync(path.join(projectRoot, VENDOR_PROFILE_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(`PRECHECK FAILED: missing vendor profile ${VENDOR_PROFILE_PATH}`);
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

let vendorRegistry: DirectSpatialConditioningVendorRegistry;
try {
  vendorRegistry =
    buildDirectSpatialConditioningVendorRegistry(projectRoot).vendorRegistry;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR REGISTRY FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorRegistry.phase !== DSC_VENDOR_REGISTRY_PHASE) {
  issues.push({ code: 'PHASE', message: vendorRegistry.phase });
}
if (vendorRegistry.mode !== 'design_only_vendor_registry') {
  issues.push({ code: 'MODE', message: vendorRegistry.mode });
}
if (vendorRegistry.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorRegistry.target });
}
if (vendorRegistry.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
  issues.push({
    code: 'VENDOR_PROFILE_REF',
    message: vendorRegistry.vendor_profile_ref,
  });
}
if (vendorRegistry.family_ref !== BACKEND_FAMILY_PATH) {
  issues.push({ code: 'FAMILY_REF', message: vendorRegistry.family_ref });
}
if (vendorRegistry.family_certification_ref !== BACKEND_FAMILY_CERTIFICATION_PATH) {
  issues.push({
    code: 'FAMILY_CERTIFICATION_REF',
    message: vendorRegistry.family_certification_ref,
  });
}
if (vendorRegistry.reference_backend_ref !== REFERENCE_BACKEND_PATH) {
  issues.push({
    code: 'REFERENCE_BACKEND_REF',
    message: vendorRegistry.reference_backend_ref,
  });
}
if (
  vendorRegistry.reference_backend_certification_ref !==
  REFERENCE_BACKEND_CERTIFICATION_PATH
) {
  issues.push({
    code: 'REFERENCE_BACKEND_CERTIFICATION_REF',
    message: vendorRegistry.reference_backend_certification_ref,
  });
}
if (vendorRegistry.template_ref !== BACKEND_TEMPLATE_PATH) {
  issues.push({ code: 'TEMPLATE_REF', message: vendorRegistry.template_ref });
}
if (vendorRegistry.template_certification_ref !== BACKEND_TEMPLATE_CERTIFICATION_PATH) {
  issues.push({
    code: 'TEMPLATE_CERTIFICATION_REF',
    message: vendorRegistry.template_certification_ref,
  });
}
if (vendorRegistry.profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({ code: 'PROFILE_REF', message: vendorRegistry.profile_ref });
}
if (vendorRegistry.profile_certification_ref !== BACKEND_PROFILE_CERTIFICATION_PATH) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: vendorRegistry.profile_certification_ref,
  });
}
if (
  vendorRegistry.backend_design_certification_ref !== BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: vendorRegistry.backend_design_certification_ref,
  });
}
if (vendorRegistry.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: vendorRegistry.implementation_spec_ref,
  });
}
if (vendorRegistry.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: vendorRegistry.execution_contract_ref,
  });
}
if (vendorRegistry.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: vendorRegistry.runtime_router_ref,
  });
}
if (vendorRegistry.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: vendorRegistry.adapter_registration_ref,
  });
}
if (vendorRegistry.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: vendorRegistry.compatibility_engine_ref,
  });
}
if (vendorRegistry.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: vendorRegistry.capability_registry_ref,
  });
}
if (vendorRegistry.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: vendorRegistry.adapter_foundation_ref,
  });
}
if (vendorRegistry.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: vendorRegistry.runtime_interface_ref,
  });
}
if (vendorRegistry.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: vendorRegistry.runtime_package_ref,
  });
}
if (
  JSON.stringify(vendorRegistry.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorRegistry.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorRegistry.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorRegistry.required_channels.join(','),
  });
}
if (vendorRegistry.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorRegistry.spatial_frame_ref });
}
if (
  vendorRegistry.capability_set_id !== CAPABILITY_SET_ID ||
  vendorRegistry.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorRegistry.capability_set_id}@${vendorRegistry.capability_set_version}`,
  });
}

// 1) Vendor registry schema.
const registrySchema = vendorRegistry.vendor_registry_schema;
if (registrySchema.schema_id !== 'dsc-vendor-registry-schema-v1') {
  issues.push({ code: 'REGISTRY_SCHEMA_ID', message: registrySchema.schema_id });
}
if (
  registrySchema.encoding !== 'application/json' ||
  registrySchema.registry_id_policy !== 'opaque_registry_id_no_vendor_binding' ||
  registrySchema.vendor_profile_ref !== VENDOR_PROFILE_ID ||
  registrySchema.optional_fields.length !== 0 ||
  registrySchema.additional_fields
) {
  issues.push({
    code: 'REGISTRY_SCHEMA_POLICY',
    message: registrySchema.registry_id_policy,
  });
}
const schemaFields = registrySchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'REGISTRY_SCHEMA_FIELDS', message: schemaFields.join(',') });
}

// 2) Vendor registration record.
const record = vendorRegistry.vendor_registration_record;
if (record.record_schema_id !== 'dsc-vendor-registration-record-v1') {
  issues.push({ code: 'RECORD_SCHEMA_ID', message: record.record_schema_id });
}
if (
  record.encoding !== 'application/json' ||
  record.identity_policy !==
    'opaque_vendor_registration_id_no_vendor_name_binding' ||
  record.additional_fields ||
  record.writes_records_in_this_phase
) {
  issues.push({ code: 'RECORD_POLICY', message: record.identity_policy });
}
const recordFields = record.required_fields.map((field) => field.field);
if (JSON.stringify(recordFields) !== JSON.stringify(EXPECTED_RECORD_FIELDS)) {
  issues.push({ code: 'RECORD_FIELDS', message: recordFields.join(',') });
}
if (
  JSON.stringify(record.uniqueness.key) !== JSON.stringify(['vendor_registration_id']) ||
  JSON.stringify(record.uniqueness.active_key) !==
    JSON.stringify(['opaque_vendor_handle', 'vendor_profile_id']) ||
  record.uniqueness.duplicate_policy !== 'reject_duplicate_active_registration' ||
  record.uniqueness.duplicate_code !== 'DSC_VENDOR_REGISTRY_DUPLICATE_ACTIVE'
) {
  issues.push({ code: 'RECORD_UNIQUENESS', message: record.uniqueness.duplicate_code });
}

// 3) Vendor lifecycle.
const lifecycle = vendorRegistry.vendor_lifecycle;
if (lifecycle.lifecycle_id !== 'dsc-vendor-registry-lifecycle-v1') {
  issues.push({ code: 'LIFECYCLE_ID', message: lifecycle.lifecycle_id });
}
if (
  JSON.stringify(lifecycle.states) !== JSON.stringify(EXPECTED_STATES) ||
  lifecycle.initial_state !== 'pending' ||
  lifecycle.active_state !== 'active' ||
  lifecycle.terminal_state !== 'deregistered' ||
  lifecycle.registers_vendors_in_this_phase
) {
  issues.push({ code: 'LIFECYCLE_POLICY', message: lifecycle.initial_state });
}
if (lifecycle.transitions.length !== 6) {
  issues.push({
    code: 'LIFECYCLE_TRANSITIONS',
    message: `${lifecycle.transitions.length}`,
  });
}
const suspendedToActive = lifecycle.transitions.find(
  (transition) => transition.from === 'suspended' && transition.to === 'active'
);
if (!suspendedToActive || !suspendedToActive.requires_vendor_profile_recheck) {
  issues.push({ code: 'LIFECYCLE_RECHECK', message: 'suspended->active' });
}
for (const transition of lifecycle.transitions) {
  if (!transition.allowed || !transition.trigger) {
    issues.push({
      code: 'LIFECYCLE_TRANSITION_INCOMPLETE',
      message: `${transition.from}->${transition.to}`,
    });
  }
}
if (lifecycle.invariants.length < 5) {
  issues.push({ code: 'LIFECYCLE_INVARIANTS', message: `${lifecycle.invariants.length}` });
}

// 3-1) Vendor deregistration policy.
const deregistration = vendorRegistry.vendor_deregistration_policy;
if (deregistration.policy_id !== 'dsc-vendor-registry-deregistration-policy-v1') {
  issues.push({ code: 'DEREGISTRATION_ID', message: deregistration.policy_id });
}
if (
  JSON.stringify(deregistration.allowed_reasons) !==
    JSON.stringify(EXPECTED_DEREGISTRATION_REASONS) ||
  deregistration.effects.lifecycle_state_becomes !== 'deregistered' ||
  !deregistration.effects.registration_record_retained ||
  deregistration.effects.re_registration_policy !==
    'requires_new_registration_flow_and_fresh_vendor_validation' ||
  !deregistration.effects.vendor_handles_released ||
  !deregistration.irreversible ||
  deregistration.executed_in_this_phase ||
  deregistration.forbidden.length < 5
) {
  issues.push({
    code: 'DEREGISTRATION_POLICY',
    message: deregistration.effects.lifecycle_state_becomes,
  });
}

// 4) Vendor validation rules.
const validation = vendorRegistry.vendor_validation_rules;
if (validation.validation_id !== 'dsc-vendor-registry-validation-rules-v1') {
  issues.push({ code: 'VALIDATION_ID', message: validation.validation_id });
}
if (
  validation.evaluation !== 'collect_all_rejections' ||
  validation.accept_condition !==
    'zero rejection codes and vendor profile binding intact' ||
  JSON.stringify(validation.outcome_values) !==
    JSON.stringify(['accepted', 'rejected']) ||
  !validation.requires_vendor_profile_binding ||
  !validation.requires_vendor_capability_interface ||
  validation.evaluates_vendors_in_this_phase
) {
  issues.push({ code: 'VALIDATION_POLICY', message: validation.accept_condition });
}
if (validation.checks.length < 10) {
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
    check.evaluation !== 'design_time_declaration_only' ||
    check.status_in_this_phase !== 'not_evaluated' ||
    !/^DSC_VENDOR_REGISTRY_[A-Z0-9_]+$/.test(check.rejection_code)
  ) {
    issues.push({ code: 'VALIDATION_CHECK_INCOMPLETE', message: check.check_id });
  }
}
for (const requiredCheck of EXPECTED_VALIDATION_CHECKS) {
  if (!seenCheckIds.has(requiredCheck)) {
    issues.push({ code: 'VALIDATION_MISSING', message: requiredCheck });
  }
}

// Read-only: no vendors registered in this phase.
const registered = vendorRegistry.registered_vendors;
if (
  registered.count !== 0 ||
  registered.entries.length !== 0 ||
  registered.registers_vendors_in_this_phase ||
  !registered.registration_policy
) {
  issues.push({ code: 'REGISTERED_VENDORS', message: `${registered.count}` });
}

// Design constraints.
const constraints = vendorRegistry.design_constraints;
if (
  !constraints.registry_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_vendor_profile ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.registers_vendors_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [VENDOR_REGISTRY_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorRegistry);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_registry_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_REGISTRY_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorRegistry.mode,
  vendor_registry_schema: registrySchema.schema_id,
  schema_fields: schemaFields.length,
  vendor_registration_record: record.record_schema_id,
  registration_record_fields: recordFields.length,
  vendor_lifecycle: lifecycle.lifecycle_id,
  lifecycle_states: lifecycle.states,
  lifecycle_transitions: lifecycle.transitions.length,
  vendor_deregistration_policy: deregistration.policy_id,
  deregistration_reasons: deregistration.allowed_reasons.length,
  vendor_validation_rules: validation.validation_id,
  validation_checks: validation.checks.length,
  registered_vendors: registered.count,
  sources_supported: vendorRegistry.sources_supported.length,
  reuses_vendor_profile: true,
  vendor_neutral: true,
  no_vendor_implementation: true,
  design_constraints: vendorRegistry.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_registry: VENDOR_REGISTRY_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    vendor_profile: VENDOR_PROFILE_PATH,
    family_certification: BACKEND_FAMILY_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_REGISTRY_VALIDATION_REPORT.json';
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
    `schema_fields=${report.schema_fields}`,
    `record_fields=${report.registration_record_fields}`,
    `lifecycle_transitions=${report.lifecycle_transitions}`,
    `deregistration_reasons=${report.deregistration_reasons}`,
    `validation_checks=${report.validation_checks}`,
    `registered_vendors=${report.registered_vendors}`,
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
