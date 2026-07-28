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
import {
  BACKEND_PROFILE_ID,
  BACKEND_PROFILE_PATH,
  BACKEND_PROFILE_VERSION,
} from '../services/directSpatialConditioningBackendProfileBuilder.js';
import { BACKEND_PROFILE_CERTIFICATION_PATH } from '../services/directSpatialConditioningBackendProfileCertificationBuilder.js';
import {
  BACKEND_TEMPLATE_ID,
  BACKEND_TEMPLATE_PATH,
  BACKEND_TEMPLATE_VERSION,
} from '../services/directSpatialConditioningBackendTemplateBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  DSC_REFERENCE_BACKEND_PHASE,
  REFERENCE_BACKEND_ID,
  REFERENCE_BACKEND_PATH,
  REFERENCE_BACKEND_VERSION,
  buildDirectSpatialConditioningReferenceBackend,
  type DirectSpatialConditioningReferenceBackend,
} from '../services/directSpatialConditioningReferenceBackendBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_REFERENCE_BACKEND_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_REFERENCE_BACKEND_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-reference-backend.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-reference-backend-implementation-registry-v1.json';

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
  'backend_id',
  'backend_version',
  'backend_kind',
  'template_ref',
  'profile_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_backend_identity',
  'template_binding',
  'profile_binding',
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
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, BACKEND_TEMPLATE_CERTIFICATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing template certification ${BACKEND_TEMPLATE_CERTIFICATION_PATH}`
  );
  process.exit(1);
}
if (!fs.existsSync(path.join(projectRoot, BACKEND_PROFILE_CERTIFICATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing profile certification ${BACKEND_PROFILE_CERTIFICATION_PATH}`
  );
  process.exit(1);
}

const templateCertification = readJson<{ certified?: boolean }>(
  BACKEND_TEMPLATE_CERTIFICATION_PATH
);
if (templateCertification.certified !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: backend template is not certified');
  process.exit(1);
}

const profileCertification = readJson<{ certified?: boolean }>(
  BACKEND_PROFILE_CERTIFICATION_PATH
);
if (profileCertification.certified !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: backend profile is not certified');
  process.exit(1);
}

let referenceBackend: DirectSpatialConditioningReferenceBackend;
try {
  referenceBackend =
    buildDirectSpatialConditioningReferenceBackend(projectRoot).referenceBackend;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`REFERENCE BACKEND FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (referenceBackend.phase !== DSC_REFERENCE_BACKEND_PHASE) {
  issues.push({ code: 'PHASE', message: referenceBackend.phase });
}
if (referenceBackend.mode !== 'design_only_reference_backend') {
  issues.push({ code: 'MODE', message: referenceBackend.mode });
}
if (referenceBackend.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: referenceBackend.target });
}
if (referenceBackend.backend_id !== REFERENCE_BACKEND_ID) {
  issues.push({ code: 'BACKEND_ID', message: referenceBackend.backend_id });
}
if (referenceBackend.backend_version !== REFERENCE_BACKEND_VERSION) {
  issues.push({ code: 'BACKEND_VERSION', message: referenceBackend.backend_version });
}
if (referenceBackend.backend_kind !== 'reference_backend') {
  issues.push({ code: 'BACKEND_KIND', message: referenceBackend.backend_kind });
}
if (referenceBackend.template_ref !== BACKEND_TEMPLATE_PATH) {
  issues.push({ code: 'TEMPLATE_REF', message: referenceBackend.template_ref });
}
if (referenceBackend.template_certification_ref !== BACKEND_TEMPLATE_CERTIFICATION_PATH) {
  issues.push({
    code: 'TEMPLATE_CERTIFICATION_REF',
    message: referenceBackend.template_certification_ref,
  });
}
if (referenceBackend.profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({ code: 'PROFILE_REF', message: referenceBackend.profile_ref });
}
if (referenceBackend.profile_certification_ref !== BACKEND_PROFILE_CERTIFICATION_PATH) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: referenceBackend.profile_certification_ref,
  });
}
if (
  referenceBackend.backend_design_certification_ref !== BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: referenceBackend.backend_design_certification_ref,
  });
}
if (referenceBackend.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: referenceBackend.implementation_spec_ref,
  });
}
if (referenceBackend.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: referenceBackend.execution_contract_ref,
  });
}
if (referenceBackend.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: referenceBackend.runtime_router_ref,
  });
}
if (referenceBackend.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: referenceBackend.adapter_registration_ref,
  });
}
if (referenceBackend.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: referenceBackend.compatibility_engine_ref,
  });
}
if (referenceBackend.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: referenceBackend.capability_registry_ref,
  });
}
if (referenceBackend.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: referenceBackend.adapter_foundation_ref,
  });
}
if (referenceBackend.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: referenceBackend.runtime_interface_ref,
  });
}
if (referenceBackend.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: referenceBackend.runtime_package_ref,
  });
}
if (
  JSON.stringify(referenceBackend.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${referenceBackend.sources_supported.length}`,
  });
}
if (
  JSON.stringify(referenceBackend.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: referenceBackend.required_channels.join(','),
  });
}
if (referenceBackend.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: referenceBackend.spatial_frame_ref });
}
if (
  referenceBackend.capability_set_id !== CAPABILITY_SET_ID ||
  referenceBackend.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${referenceBackend.capability_set_id}@${referenceBackend.capability_set_version}`,
  });
}

// 1) Reference backend schema.
const schema = referenceBackend.reference_backend_schema;
if (schema.schema_id !== 'dsc-reference-backend-schema-v1') {
  issues.push({ code: 'SCHEMA_ID', message: schema.schema_id });
}
if (
  schema.encoding !== 'application/json' ||
  schema.backend_id_policy !== 'opaque_backend_id_no_vendor_binding' ||
  schema.template_ref !== BACKEND_TEMPLATE_ID ||
  schema.profile_ref !== BACKEND_PROFILE_ID ||
  schema.optional_fields.length !== 0 ||
  schema.additional_fields
) {
  issues.push({ code: 'SCHEMA_POLICY', message: schema.backend_id_policy });
}
const schemaFields = schema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of schema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic backend identity.
const identity = referenceBackend.deterministic_backend_identity;
if (identity.identity_id !== 'dsc-reference-backend-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.backend_id !== REFERENCE_BACKEND_ID ||
  identity.backend_version !== REFERENCE_BACKEND_VERSION ||
  identity.identity_policy !== 'opaque_backend_id_no_vendor_binding' ||
  identity.derivation !== 'literal_constant_declared_at_design_time' ||
  identity.purity !== 'deterministic_pure_constant' ||
  identity.seed_dependence !== 'none' ||
  identity.time_dependence !== 'none' ||
  identity.randomness !== 'none' ||
  identity.vendor_binding !== 'none' ||
  identity.framework_binding !== 'none' ||
  identity.device_binding !== 'none' ||
  identity.capability_set_id !== CAPABILITY_SET_ID ||
  identity.capability_set_version !== CAPABILITY_SET_VERSION ||
  identity.adapter_interface_version !== 'v1' ||
  identity.declared_spatial_frame !== SPATIAL_FRAME.frame_id ||
  identity.declared_adapted_input_shape !== 'dsc_adapted_conditioning_input_v1'
) {
  issues.push({ code: 'IDENTITY_POLICY', message: identity.backend_id });
}
if (
  JSON.stringify(identity.declared_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'IDENTITY_CHANNELS',
    message: identity.declared_channels.join(','),
  });
}

// 3) Template binding.
const templateBinding = referenceBackend.template_binding;
if (templateBinding.binding_id !== 'dsc-reference-backend-template-binding-v1') {
  issues.push({ code: 'TEMPLATE_BINDING_ID', message: templateBinding.binding_id });
}
if (
  templateBinding.template_ref !== BACKEND_TEMPLATE_PATH ||
  templateBinding.template_id !== BACKEND_TEMPLATE_ID ||
  templateBinding.template_version !== BACKEND_TEMPLATE_VERSION ||
  templateBinding.template_phase !== 'PHASE-DSC-049' ||
  templateBinding.template_system_id !==
    'DIRECT_SPATIAL_CONDITIONING_BACKEND_TEMPLATE_V1' ||
  templateBinding.template_certification_ref !== BACKEND_TEMPLATE_CERTIFICATION_PATH ||
  templateBinding.binding_mode !== 'exact_reuse' ||
  templateBinding.skeleton_ref !==
    'dsc-backend-deterministic-implementation-skeleton-v1' ||
  templateBinding.extension_points_ref !== 'dsc-backend-template-extension-points-v1' ||
  templateBinding.validation_template_ref !==
    'dsc-backend-template-validation-template-v1' ||
  templateBinding.fills_extension_points_in_this_phase ||
  templateBinding.implements_skeleton_in_this_phase
) {
  issues.push({
    code: 'TEMPLATE_BINDING_POLICY',
    message: templateBinding.template_id,
  });
}

// 4) Profile binding.
const profileBinding = referenceBackend.profile_binding;
if (profileBinding.binding_id !== 'dsc-reference-backend-profile-binding-v1') {
  issues.push({ code: 'PROFILE_BINDING_ID', message: profileBinding.binding_id });
}
if (
  profileBinding.profile_ref !== BACKEND_PROFILE_PATH ||
  profileBinding.profile_id !== BACKEND_PROFILE_ID ||
  profileBinding.profile_version !== BACKEND_PROFILE_VERSION ||
  profileBinding.profile_phase !== 'PHASE-DSC-047' ||
  profileBinding.profile_system_id !==
    'DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_V1' ||
  profileBinding.profile_certification_ref !== BACKEND_PROFILE_CERTIFICATION_PATH ||
  profileBinding.binding_mode !== 'exact_reuse' ||
  profileBinding.capability_mapping_ref !==
    'dsc-backend-profile-deterministic-capability-mapping-v1' ||
  profileBinding.adapter_configuration_ref !==
    'dsc-backend-profile-adapter-configuration-v1' ||
  profileBinding.profile_validation_ref !== 'dsc-backend-profile-validation-v1' ||
  !profileBinding.inherits_capability_declarations ||
  !profileBinding.binds_profile_in_this_phase ||
  profileBinding.implements_profile_in_this_phase
) {
  issues.push({
    code: 'PROFILE_BINDING_POLICY',
    message: profileBinding.profile_id,
  });
}

// Read-only: no backend implemented in this phase.
const implemented = referenceBackend.implemented_backends;
if (
  implemented.count !== 0 ||
  implemented.entries.length !== 0 ||
  implemented.implements_backends_in_this_phase ||
  !implemented.implementation_policy
) {
  issues.push({ code: 'IMPLEMENTED_BACKENDS', message: `${implemented.count}` });
}

// Design constraints.
const constraints = referenceBackend.design_constraints;
if (
  !constraints.reference_backend_only ||
  !constraints.read_only ||
  !constraints.backend_agnostic ||
  !constraints.reuses_backend_template ||
  !constraints.reuses_certified_profile ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.implements_backends_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [REFERENCE_BACKEND_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(referenceBackend);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_reference_backend_${Date.now().toString(36)}`,
  phase: DSC_REFERENCE_BACKEND_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: referenceBackend.mode,
  backend_id: referenceBackend.backend_id,
  backend_version: referenceBackend.backend_version,
  backend_kind: referenceBackend.backend_kind,
  reference_backend_schema: schema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_backend_identity: identity.identity_id,
  template_binding: templateBinding.binding_id,
  template_id: templateBinding.template_id,
  profile_binding: profileBinding.binding_id,
  profile_id: profileBinding.profile_id,
  implemented_backends: implemented.count,
  sources_supported: referenceBackend.sources_supported.length,
  reuses_backend_template: true,
  reuses_certified_profile: true,
  backend_agnostic: true,
  design_constraints: referenceBackend.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    reference_backend: REFERENCE_BACKEND_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    template: BACKEND_TEMPLATE_PATH,
    template_certification: BACKEND_TEMPLATE_CERTIFICATION_PATH,
    profile: BACKEND_PROFILE_PATH,
    profile_certification: BACKEND_PROFILE_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_REFERENCE_BACKEND_VALIDATION_REPORT.json';
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
    `backend_id=${report.backend_id}`,
    `schema_fields=${report.schema_fields}`,
    `template_id=${report.template_id}`,
    `profile_id=${report.profile_id}`,
    `implemented_backends=${report.implemented_backends}`,
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
