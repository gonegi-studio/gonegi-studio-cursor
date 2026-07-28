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
  type DirectSpatialConditioningBackendCapabilityRegistry,
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
  REFERENCE_BACKEND_ID,
  REFERENCE_BACKEND_PATH,
  REFERENCE_BACKEND_VERSION,
} from '../services/directSpatialConditioningReferenceBackendBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  BACKEND_FAMILY_ID,
  BACKEND_FAMILY_PATH,
  BACKEND_FAMILY_VERSION,
  DSC_BACKEND_FAMILY_PHASE,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  buildDirectSpatialConditioningBackendFamily,
  type DirectSpatialConditioningBackendFamily,
} from '../services/directSpatialConditioningBackendFamilyBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_FAMILY_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_BACKEND_FAMILY_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-family.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-family-implementation-registry-v1.json';

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
  'family_id',
  'family_version',
  'family_kind',
  'reference_backend_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_family_identity',
  'reference_backend_binding',
  'family_capability_contract',
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
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, REFERENCE_BACKEND_CERTIFICATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing reference backend certification ${REFERENCE_BACKEND_CERTIFICATION_PATH}`
  );
  process.exit(1);
}

const referenceCertification = readJson<{ certified?: boolean }>(
  REFERENCE_BACKEND_CERTIFICATION_PATH
);
if (referenceCertification.certified !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: reference backend is not certified');
  process.exit(1);
}

const capabilityRegistry = readJson<DirectSpatialConditioningBackendCapabilityRegistry>(
  BACKEND_CAPABILITY_REGISTRY_PATH
);
const registeredCapabilityIds =
  capabilityRegistry.capability_schema.registered_capability_ids;

let backendFamily: DirectSpatialConditioningBackendFamily;
try {
  backendFamily =
    buildDirectSpatialConditioningBackendFamily(projectRoot).backendFamily;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`BACKEND FAMILY FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (backendFamily.phase !== DSC_BACKEND_FAMILY_PHASE) {
  issues.push({ code: 'PHASE', message: backendFamily.phase });
}
if (backendFamily.mode !== 'design_only_family') {
  issues.push({ code: 'MODE', message: backendFamily.mode });
}
if (backendFamily.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: backendFamily.target });
}
if (backendFamily.family_id !== BACKEND_FAMILY_ID) {
  issues.push({ code: 'FAMILY_ID', message: backendFamily.family_id });
}
if (backendFamily.family_version !== BACKEND_FAMILY_VERSION) {
  issues.push({ code: 'FAMILY_VERSION', message: backendFamily.family_version });
}
if (backendFamily.family_kind !== 'generic_backend_family') {
  issues.push({ code: 'FAMILY_KIND', message: backendFamily.family_kind });
}
if (backendFamily.reference_backend_ref !== REFERENCE_BACKEND_PATH) {
  issues.push({
    code: 'REFERENCE_BACKEND_REF',
    message: backendFamily.reference_backend_ref,
  });
}
if (
  backendFamily.reference_backend_certification_ref !==
  REFERENCE_BACKEND_CERTIFICATION_PATH
) {
  issues.push({
    code: 'REFERENCE_BACKEND_CERTIFICATION_REF',
    message: backendFamily.reference_backend_certification_ref,
  });
}
if (backendFamily.template_ref !== BACKEND_TEMPLATE_PATH) {
  issues.push({ code: 'TEMPLATE_REF', message: backendFamily.template_ref });
}
if (backendFamily.template_certification_ref !== BACKEND_TEMPLATE_CERTIFICATION_PATH) {
  issues.push({
    code: 'TEMPLATE_CERTIFICATION_REF',
    message: backendFamily.template_certification_ref,
  });
}
if (backendFamily.profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({ code: 'PROFILE_REF', message: backendFamily.profile_ref });
}
if (backendFamily.profile_certification_ref !== BACKEND_PROFILE_CERTIFICATION_PATH) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: backendFamily.profile_certification_ref,
  });
}
if (
  backendFamily.backend_design_certification_ref !== BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: backendFamily.backend_design_certification_ref,
  });
}
if (backendFamily.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: backendFamily.implementation_spec_ref,
  });
}
if (backendFamily.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: backendFamily.execution_contract_ref,
  });
}
if (backendFamily.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: backendFamily.runtime_router_ref,
  });
}
if (backendFamily.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: backendFamily.adapter_registration_ref,
  });
}
if (backendFamily.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: backendFamily.compatibility_engine_ref,
  });
}
if (backendFamily.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: backendFamily.capability_registry_ref,
  });
}
if (backendFamily.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: backendFamily.adapter_foundation_ref,
  });
}
if (backendFamily.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: backendFamily.runtime_interface_ref,
  });
}
if (backendFamily.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: backendFamily.runtime_package_ref,
  });
}
if (
  JSON.stringify(backendFamily.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${backendFamily.sources_supported.length}`,
  });
}
if (
  JSON.stringify(backendFamily.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: backendFamily.required_channels.join(','),
  });
}
if (backendFamily.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: backendFamily.spatial_frame_ref });
}
if (
  backendFamily.capability_set_id !== CAPABILITY_SET_ID ||
  backendFamily.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${backendFamily.capability_set_id}@${backendFamily.capability_set_version}`,
  });
}

// 1) Backend family schema.
const familySchema = backendFamily.backend_family_schema;
if (familySchema.schema_id !== 'dsc-backend-family-schema-v1') {
  issues.push({ code: 'FAMILY_SCHEMA_ID', message: familySchema.schema_id });
}
if (
  familySchema.encoding !== 'application/json' ||
  familySchema.family_id_policy !== 'opaque_family_id_no_vendor_binding' ||
  familySchema.reference_backend_ref !== REFERENCE_BACKEND_ID ||
  familySchema.optional_fields.length !== 0 ||
  familySchema.additional_fields
) {
  issues.push({ code: 'FAMILY_SCHEMA_POLICY', message: familySchema.family_id_policy });
}
const schemaFields = familySchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'FAMILY_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of familySchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'FAMILY_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic family identity.
const identity = backendFamily.deterministic_family_identity;
if (identity.identity_id !== 'dsc-backend-family-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.family_id !== BACKEND_FAMILY_ID ||
  identity.family_version !== BACKEND_FAMILY_VERSION ||
  identity.identity_policy !== 'opaque_family_id_no_vendor_binding' ||
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
  identity.spatial_frame_ref !== SPATIAL_FRAME.frame_id
) {
  issues.push({ code: 'IDENTITY_POLICY', message: identity.family_id });
}
if (
  JSON.stringify(identity.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'IDENTITY_CHANNELS',
    message: identity.required_channels.join(','),
  });
}

// 3) Reference backend binding.
const binding = backendFamily.reference_backend_binding;
if (binding.binding_id !== 'dsc-backend-family-reference-backend-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.reference_backend_ref !== REFERENCE_BACKEND_PATH ||
  binding.backend_id !== REFERENCE_BACKEND_ID ||
  binding.backend_version !== REFERENCE_BACKEND_VERSION ||
  binding.reference_backend_phase !== 'PHASE-DSC-051' ||
  binding.reference_backend_system_id !==
    'DIRECT_SPATIAL_CONDITIONING_REFERENCE_BACKEND_V1' ||
  binding.reference_backend_certification_ref !==
    REFERENCE_BACKEND_CERTIFICATION_PATH ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'family_archetype' ||
  binding.template_ref !== BACKEND_TEMPLATE_PATH ||
  binding.profile_ref !== BACKEND_PROFILE_PATH ||
  binding.instantiates_members_in_this_phase ||
  binding.implements_reference_backend_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.backend_id });
}

// 4) Family capability contract.
const contract = backendFamily.family_capability_contract;
if (contract.contract_id !== 'dsc-backend-family-capability-contract-v1') {
  issues.push({ code: 'CONTRACT_ID', message: contract.contract_id });
}
if (
  contract.capability_set_id !== CAPABILITY_SET_ID ||
  contract.capability_set_version !== CAPABILITY_SET_VERSION ||
  contract.capability_contract_ref !== 'dsc-backend-capability-contract-v1' ||
  contract.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH ||
  contract.profile_capability_mapping_ref !==
    'dsc-backend-profile-deterministic-capability-mapping-v1' ||
  contract.spatial_frame_ref !== SPATIAL_FRAME.frame_id ||
  contract.required_sources !== SOURCE_IDS.length ||
  contract.adapted_input_shape_ref !== 'dsc_adapted_conditioning_input_v1' ||
  contract.inheritance_rule !==
    'every_family_member_must_satisfy_all_mandatory_capabilities' ||
  contract.aggregation_rule !== 'all_mandatory_capabilities_supported' ||
  contract.vendor_specific_capabilities !== 'forbidden' ||
  contract.requires_gpu ||
  contract.performs_inference ||
  contract.evaluates_members_in_this_phase
) {
  issues.push({ code: 'CONTRACT_POLICY', message: contract.contract_id });
}
if (
  JSON.stringify(contract.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'CONTRACT_CHANNELS',
    message: contract.required_channels.join(','),
  });
}
const contractCapabilityIds = contract.required_capabilities.map(
  (capability) => capability.capability_id
);
if (JSON.stringify(contractCapabilityIds) !== JSON.stringify(registeredCapabilityIds)) {
  issues.push({
    code: 'CONTRACT_CAPABILITY_ORDER',
    message: contractCapabilityIds.join(','),
  });
}
for (const capability of contract.required_capabilities) {
  if (
    capability.requirement !== 'mandatory' ||
    capability.inherited_from !==
      'capability_registry.capability_schema.registered_capability_ids' ||
    capability.declared_state_required !== 'supported' ||
    !capability.family_member_must_declare
  ) {
    issues.push({
      code: 'CONTRACT_CAPABILITY_INCOMPLETE',
      message: capability.capability_id,
    });
  }
}

// Read-only: no family members instantiated in this phase.
const members = backendFamily.family_members;
if (
  members.count !== 0 ||
  members.entries.length !== 0 ||
  members.instantiates_members_in_this_phase ||
  !members.membership_policy
) {
  issues.push({ code: 'FAMILY_MEMBERS', message: `${members.count}` });
}

// Design constraints.
const constraints = backendFamily.design_constraints;
if (
  !constraints.family_only ||
  !constraints.read_only ||
  !constraints.backend_agnostic ||
  !constraints.reuses_certified_reference_backend ||
  !constraints.no_vendor_specific_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.instantiates_members_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [BACKEND_FAMILY_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(backendFamily);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_backend_family_${Date.now().toString(36)}`,
  phase: DSC_BACKEND_FAMILY_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: backendFamily.mode,
  family_id: backendFamily.family_id,
  family_version: backendFamily.family_version,
  family_kind: backendFamily.family_kind,
  backend_family_schema: familySchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_family_identity: identity.identity_id,
  reference_backend_binding: binding.binding_id,
  reference_backend_id: binding.backend_id,
  family_capability_contract: contract.contract_id,
  required_capabilities: contract.required_capabilities.length,
  family_members: members.count,
  sources_supported: backendFamily.sources_supported.length,
  reuses_certified_reference_backend: true,
  no_vendor_specific_implementation: true,
  backend_agnostic: true,
  design_constraints: backendFamily.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    backend_family: BACKEND_FAMILY_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    reference_backend: REFERENCE_BACKEND_PATH,
    reference_backend_certification: REFERENCE_BACKEND_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_BACKEND_FAMILY_VALIDATION_REPORT.json';
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
    `family_id=${report.family_id}`,
    `schema_fields=${report.schema_fields}`,
    `reference_backend_id=${report.reference_backend_id}`,
    `required_capabilities=${report.required_capabilities}`,
    `family_members=${report.family_members}`,
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
