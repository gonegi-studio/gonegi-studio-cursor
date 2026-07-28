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
import {
  BACKEND_ADAPTER_FOUNDATION_PATH,
} from '../services/directSpatialConditioningBackendAdapterFoundationBuilder.js';
import {
  BACKEND_CAPABILITY_REGISTRY_PATH,
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
  type DirectSpatialConditioningBackendCapabilityRegistry,
} from '../services/directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import { BACKEND_COMPATIBILITY_ENGINE_PATH } from '../services/directSpatialConditioningBackendCompatibilityEngineBuilder.js';
import { BACKEND_ADAPTER_REGISTRATION_PATH } from '../services/directSpatialConditioningBackendAdapterRegistrationBuilder.js';
import { BACKEND_RUNTIME_ROUTER_PATH } from '../services/directSpatialConditioningBackendRuntimeRouterBuilder.js';
import { BACKEND_EXECUTION_CONTRACT_PATH } from '../services/directSpatialConditioningBackendExecutionContractBuilder.js';
import {
  BACKEND_IMPLEMENTATION_SPEC_PATH,
  type DirectSpatialConditioningBackendImplementationSpec,
} from '../services/directSpatialConditioningBackendImplementationSpecBuilder.js';
import { BACKEND_DESIGN_CERTIFICATION_PATH } from '../services/directSpatialConditioningBackendDesignCertificationBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  BACKEND_PROFILE_ID,
  BACKEND_PROFILE_PATH,
  BACKEND_PROFILE_VERSION,
  DSC_BACKEND_PROFILE_PHASE,
  buildDirectSpatialConditioningBackendProfile,
  type DirectSpatialConditioningBackendProfile,
} from '../services/directSpatialConditioningBackendProfileBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-profile.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-profile-implementation-registry-v1.json';

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
  'profile_id',
  'profile_version',
  'profile_kind',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_capability_mapping',
  'adapter_configuration',
  'profile_validation',
];

const EXPECTED_VALIDATION_CHECKS = [
  'CHK_PROFILE_IDENTITY_OPAQUE',
  'CHK_CAPABILITY_SET_LOCKED',
  'CHK_CAPABILITY_MAPPING_COMPLETE',
  'CHK_CAPABILITY_MAPPING_SUPPORTED',
  'CHK_MAPPING_DETERMINISTIC',
  'CHK_ADAPTER_PACKET_ADAPTER',
  'CHK_ADAPTER_CHANNEL_ORDER',
  'CHK_ADAPTER_IDENTITY_PASSTHROUGH',
  'CHK_SPATIAL_FRAME_LOCKED',
  'CHK_NO_GPU_NO_INFERENCE',
  'CHK_NO_BACKEND_BOUND',
  'CHK_REUSES_IMPLEMENTATION_SPEC',
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
  BACKEND_DESIGN_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, BACKEND_IMPLEMENTATION_SPEC_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing implementation specification ${BACKEND_IMPLEMENTATION_SPEC_PATH}`
  );
  process.exit(1);
}

const implementationSpec = readJson<DirectSpatialConditioningBackendImplementationSpec>(
  BACKEND_IMPLEMENTATION_SPEC_PATH
);
const capabilityRegistry = readJson<DirectSpatialConditioningBackendCapabilityRegistry>(
  BACKEND_CAPABILITY_REGISTRY_PATH
);
const registeredCapabilityIds =
  capabilityRegistry.capability_schema.registered_capability_ids;

let backendProfile: DirectSpatialConditioningBackendProfile;
try {
  backendProfile =
    buildDirectSpatialConditioningBackendProfile(projectRoot).backendProfile;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`BACKEND PROFILE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (backendProfile.phase !== DSC_BACKEND_PROFILE_PHASE) {
  issues.push({ code: 'PHASE', message: backendProfile.phase });
}
if (backendProfile.mode !== 'design_only_profile') {
  issues.push({ code: 'MODE', message: backendProfile.mode });
}
if (backendProfile.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: backendProfile.target });
}
if (backendProfile.profile_id !== BACKEND_PROFILE_ID) {
  issues.push({ code: 'PROFILE_ID', message: backendProfile.profile_id });
}
if (backendProfile.profile_version !== BACKEND_PROFILE_VERSION) {
  issues.push({ code: 'PROFILE_VERSION', message: backendProfile.profile_version });
}
if (backendProfile.profile_kind !== 'reference_profile') {
  issues.push({ code: 'PROFILE_KIND', message: backendProfile.profile_kind });
}
if (backendProfile.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: backendProfile.implementation_spec_ref,
  });
}
if (backendProfile.backend_design_certification_ref !== BACKEND_DESIGN_CERTIFICATION_PATH) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: backendProfile.backend_design_certification_ref,
  });
}
if (backendProfile.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: backendProfile.execution_contract_ref,
  });
}
if (backendProfile.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: backendProfile.runtime_router_ref,
  });
}
if (backendProfile.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: backendProfile.adapter_registration_ref,
  });
}
if (backendProfile.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: backendProfile.compatibility_engine_ref,
  });
}
if (backendProfile.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: backendProfile.capability_registry_ref,
  });
}
if (backendProfile.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: backendProfile.adapter_foundation_ref,
  });
}
if (backendProfile.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: backendProfile.runtime_interface_ref,
  });
}
if (backendProfile.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: backendProfile.runtime_package_ref,
  });
}
if (
  JSON.stringify(backendProfile.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${backendProfile.sources_supported.length}`,
  });
}
if (
  JSON.stringify(backendProfile.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: backendProfile.required_channels.join(','),
  });
}
if (backendProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: backendProfile.spatial_frame_ref });
}
if (
  backendProfile.capability_set_id !== CAPABILITY_SET_ID ||
  backendProfile.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${backendProfile.capability_set_id}@${backendProfile.capability_set_version}`,
  });
}
if (
  backendProfile.implementation_spec_phase !== implementationSpec.phase ||
  backendProfile.implementation_spec_system_id !== implementationSpec.system_id
) {
  issues.push({ code: 'SPEC_IDENTITY_DRIFT', message: 'phase/system_id' });
}

// 1) Backend profile schema.
const profileSchema = backendProfile.backend_profile_schema;
if (profileSchema.schema_id !== 'dsc-backend-profile-schema-v1') {
  issues.push({ code: 'PROFILE_SCHEMA_ID', message: profileSchema.schema_id });
}
if (
  profileSchema.encoding !== 'application/json' ||
  profileSchema.profile_id_policy !== 'opaque_profile_id_no_vendor_binding' ||
  profileSchema.optional_fields.length !== 0 ||
  profileSchema.additional_fields
) {
  issues.push({ code: 'PROFILE_SCHEMA_POLICY', message: profileSchema.profile_id_policy });
}
const schemaFields = profileSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'PROFILE_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of profileSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'PROFILE_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic capability mapping.
const mapping = backendProfile.deterministic_capability_mapping;
if (mapping.mapping_id !== 'dsc-backend-profile-deterministic-capability-mapping-v1') {
  issues.push({ code: 'MAPPING_ID', message: mapping.mapping_id });
}
if (
  mapping.purity !== 'deterministic_pure_function' ||
  mapping.seed_dependence !== 'none' ||
  mapping.time_dependence !== 'none' ||
  mapping.randomness !== 'none' ||
  mapping.ordering !== 'capability_registry_registered_capability_ids_order' ||
  mapping.undeclared_capability_policy !== 'reject' ||
  mapping.unknown_capability_policy !== 'reject' ||
  !mapping.maps_capabilities_in_this_phase ||
  mapping.evaluates_backends_in_this_phase
) {
  issues.push({ code: 'MAPPING_POLICY', message: mapping.purity });
}
if (
  mapping.capability_set_id !== CAPABILITY_SET_ID ||
  mapping.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'MAPPING_CAPABILITY_SET',
    message: `${mapping.capability_set_id}@${mapping.capability_set_version}`,
  });
}
const mappedIds = mapping.entries.map((entry) => entry.capability_id);
if (JSON.stringify(mappedIds) !== JSON.stringify(registeredCapabilityIds)) {
  issues.push({ code: 'MAPPING_ORDER', message: mappedIds.join(',') });
}
if (mapping.entries.length !== registeredCapabilityIds.length) {
  issues.push({ code: 'MAPPING_COUNT', message: `${mapping.entries.length}` });
}
for (const entry of mapping.entries) {
  if (
    entry.declared_state !== 'supported' ||
    entry.mapping_rule !== 'mandatory_capability_maps_to_supported' ||
    entry.capability_version !== CAPABILITY_SET_VERSION ||
    !entry.deterministic ||
    entry.evaluated_at !== 'profile_construction' ||
    !entry.source_ref
  ) {
    issues.push({ code: 'MAPPING_ENTRY_INCOMPLETE', message: entry.capability_id });
  }
}

// 3) Adapter configuration.
const adapterConfig = backendProfile.adapter_configuration;
if (adapterConfig.configuration_id !== 'dsc-backend-profile-adapter-configuration-v1') {
  issues.push({ code: 'ADAPTER_CONFIG_ID', message: adapterConfig.configuration_id });
}
if (
  adapterConfig.packet_adapter_ref !== 'dsc-packet-adapter-v1' ||
  adapterConfig.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH ||
  adapterConfig.adapted_input_shape_ref !== 'dsc_adapted_conditioning_input_v1' ||
  adapterConfig.spatial_frame_ref !== SPATIAL_FRAME.frame_id ||
  adapterConfig.channel_transform !== 'identity_passthrough' ||
  adapterConfig.passthrough_policy !== 'structure_preserving_no_transform' ||
  adapterConfig.binding_policy !== 'opaque_conditioning_binding_handle' ||
  adapterConfig.requires_gpu ||
  adapterConfig.performs_inference ||
  adapterConfig.materializes_tensors ||
  adapterConfig.materializes_frames ||
  !adapterConfig.configures_adapter_in_this_phase ||
  adapterConfig.implements_adapter_in_this_phase
) {
  issues.push({
    code: 'ADAPTER_CONFIG_POLICY',
    message: adapterConfig.packet_adapter_ref,
  });
}
if (
  JSON.stringify(adapterConfig.channel_order) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'ADAPTER_CHANNEL_ORDER',
    message: adapterConfig.channel_order.join(','),
  });
}

// 4) Profile validation.
const validation = backendProfile.profile_validation;
if (validation.validation_id !== 'dsc-backend-profile-validation-v1') {
  issues.push({ code: 'VALIDATION_ID', message: validation.validation_id });
}
if (
  validation.evaluation !== 'collect_all_failures' ||
  validation.accept_condition !== 'zero failed checks' ||
  JSON.stringify(validation.outcome_values) !== JSON.stringify(['valid', 'invalid']) ||
  !validation.requires_complete_capability_mapping ||
  !validation.requires_adapter_configuration ||
  validation.validates_backends_in_this_phase
) {
  issues.push({ code: 'VALIDATION_POLICY', message: validation.accept_condition });
}
if (validation.checks.length < 12) {
  issues.push({ code: 'VALIDATION_CHECKS', message: `${validation.checks.length}` });
}
const seenCheckIds = new Set<string>();
const seenFailCodes = new Set<string>();
for (const check of validation.checks) {
  if (seenCheckIds.has(check.check_id)) {
    issues.push({ code: 'VALIDATION_CHECK_DUPLICATE', message: check.check_id });
  }
  seenCheckIds.add(check.check_id);
  if (seenFailCodes.has(check.fail_code)) {
    issues.push({ code: 'VALIDATION_CODE_DUPLICATE', message: check.fail_code });
  }
  seenFailCodes.add(check.fail_code);
  if (
    !check.mandatory ||
    check.evaluation !== 'design_time_declaration_only' ||
    check.status_in_this_phase !== 'passed_by_construction' ||
    !check.pass_condition ||
    !/^DSC_BACKEND_PROFILE_FAIL_[A-Z0-9_]+$/.test(check.fail_code)
  ) {
    issues.push({ code: 'VALIDATION_CHECK_INCOMPLETE', message: check.check_id });
  }
}
for (const requiredCheck of EXPECTED_VALIDATION_CHECKS) {
  if (!seenCheckIds.has(requiredCheck)) {
    issues.push({ code: 'VALIDATION_MISSING', message: requiredCheck });
  }
}

// Read-only: no backend bound in this phase.
const bound = backendProfile.bound_backends;
if (
  bound.count !== 0 ||
  bound.entries.length !== 0 ||
  bound.binds_backends_in_this_phase ||
  !bound.binding_policy
) {
  issues.push({ code: 'BOUND_BACKENDS', message: `${bound.count}` });
}

// Design constraints.
const constraints = backendProfile.design_constraints;
if (
  !constraints.profile_only ||
  !constraints.read_only ||
  !constraints.backend_agnostic ||
  !constraints.reuses_implementation_spec ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.binds_backends_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [BACKEND_PROFILE_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(backendProfile);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_backend_profile_${Date.now().toString(36)}`,
  phase: DSC_BACKEND_PROFILE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: backendProfile.mode,
  profile_id: backendProfile.profile_id,
  profile_version: backendProfile.profile_version,
  profile_kind: backendProfile.profile_kind,
  backend_profile_schema: profileSchema.schema_id,
  profile_schema_fields: schemaFields.length,
  deterministic_capability_mapping: mapping.mapping_id,
  capability_mapping_entries: mapping.entries.length,
  adapter_configuration: adapterConfig.configuration_id,
  profile_validation: validation.validation_id,
  profile_validation_checks: validation.checks.length,
  bound_backends: bound.count,
  sources_supported: backendProfile.sources_supported.length,
  reuses_implementation_spec: true,
  backend_agnostic: true,
  design_constraints: backendProfile.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    backend_profile: BACKEND_PROFILE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    implementation_spec: BACKEND_IMPLEMENTATION_SPEC_PATH,
    backend_design_certification: BACKEND_DESIGN_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_VALIDATION_REPORT.json';
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
    `profile_id=${report.profile_id}`,
    `schema_fields=${report.profile_schema_fields}`,
    `mapping_entries=${report.capability_mapping_entries}`,
    `validation_checks=${report.profile_validation_checks}`,
    `bound_backends=${report.bound_backends}`,
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
