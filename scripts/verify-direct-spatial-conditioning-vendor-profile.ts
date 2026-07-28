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
  type DirectSpatialConditioningBackendAdapterFoundation,
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
  BACKEND_FAMILY_ID,
  BACKEND_FAMILY_PATH,
  BACKEND_FAMILY_VERSION,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
} from '../services/directSpatialConditioningBackendFamilyBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  BACKEND_FAMILY_CERTIFICATION_PATH,
  DSC_VENDOR_PROFILE_PHASE,
  VENDOR_PROFILE_ID,
  VENDOR_PROFILE_PATH,
  VENDOR_PROFILE_VERSION,
  buildDirectSpatialConditioningVendorProfile,
  type DirectSpatialConditioningVendorProfile,
} from '../services/directSpatialConditioningVendorProfileBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_PROFILE_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_PROFILE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-profile.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-profile-implementation-registry-v1.json';

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
  'vendor_profile_id',
  'vendor_profile_version',
  'vendor_profile_kind',
  'family_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_vendor_profile_identity',
  'backend_family_binding',
  'vendor_capability_interface',
];

const EXPECTED_METHODS = [
  'describe_capabilities',
  'check_compatibility',
  'bind_conditioning_input',
  'release_conditioning_binding',
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

const adapterFoundation = readJson<DirectSpatialConditioningBackendAdapterFoundation>(
  BACKEND_ADAPTER_FOUNDATION_PATH
);
const capabilityRegistry = readJson<DirectSpatialConditioningBackendCapabilityRegistry>(
  BACKEND_CAPABILITY_REGISTRY_PATH
);
const registeredCapabilityIds =
  capabilityRegistry.capability_schema.registered_capability_ids;

let vendorProfile: DirectSpatialConditioningVendorProfile;
try {
  vendorProfile =
    buildDirectSpatialConditioningVendorProfile(projectRoot).vendorProfile;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR PROFILE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorProfile.phase !== DSC_VENDOR_PROFILE_PHASE) {
  issues.push({ code: 'PHASE', message: vendorProfile.phase });
}
if (vendorProfile.mode !== 'design_only_vendor_profile') {
  issues.push({ code: 'MODE', message: vendorProfile.mode });
}
if (vendorProfile.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorProfile.target });
}
if (vendorProfile.vendor_profile_id !== VENDOR_PROFILE_ID) {
  issues.push({ code: 'VENDOR_PROFILE_ID', message: vendorProfile.vendor_profile_id });
}
if (vendorProfile.vendor_profile_version !== VENDOR_PROFILE_VERSION) {
  issues.push({
    code: 'VENDOR_PROFILE_VERSION',
    message: vendorProfile.vendor_profile_version,
  });
}
if (vendorProfile.vendor_profile_kind !== 'generic_vendor_profile') {
  issues.push({
    code: 'VENDOR_PROFILE_KIND',
    message: vendorProfile.vendor_profile_kind,
  });
}
if (vendorProfile.family_ref !== BACKEND_FAMILY_PATH) {
  issues.push({ code: 'FAMILY_REF', message: vendorProfile.family_ref });
}
if (vendorProfile.family_certification_ref !== BACKEND_FAMILY_CERTIFICATION_PATH) {
  issues.push({
    code: 'FAMILY_CERTIFICATION_REF',
    message: vendorProfile.family_certification_ref,
  });
}
if (vendorProfile.reference_backend_ref !== REFERENCE_BACKEND_PATH) {
  issues.push({
    code: 'REFERENCE_BACKEND_REF',
    message: vendorProfile.reference_backend_ref,
  });
}
if (
  vendorProfile.reference_backend_certification_ref !==
  REFERENCE_BACKEND_CERTIFICATION_PATH
) {
  issues.push({
    code: 'REFERENCE_BACKEND_CERTIFICATION_REF',
    message: vendorProfile.reference_backend_certification_ref,
  });
}
if (vendorProfile.template_ref !== BACKEND_TEMPLATE_PATH) {
  issues.push({ code: 'TEMPLATE_REF', message: vendorProfile.template_ref });
}
if (vendorProfile.template_certification_ref !== BACKEND_TEMPLATE_CERTIFICATION_PATH) {
  issues.push({
    code: 'TEMPLATE_CERTIFICATION_REF',
    message: vendorProfile.template_certification_ref,
  });
}
if (vendorProfile.profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({ code: 'PROFILE_REF', message: vendorProfile.profile_ref });
}
if (vendorProfile.profile_certification_ref !== BACKEND_PROFILE_CERTIFICATION_PATH) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: vendorProfile.profile_certification_ref,
  });
}
if (
  vendorProfile.backend_design_certification_ref !== BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: vendorProfile.backend_design_certification_ref,
  });
}
if (vendorProfile.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: vendorProfile.implementation_spec_ref,
  });
}
if (vendorProfile.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: vendorProfile.execution_contract_ref,
  });
}
if (vendorProfile.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: vendorProfile.runtime_router_ref,
  });
}
if (vendorProfile.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: vendorProfile.adapter_registration_ref,
  });
}
if (vendorProfile.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: vendorProfile.compatibility_engine_ref,
  });
}
if (vendorProfile.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: vendorProfile.capability_registry_ref,
  });
}
if (vendorProfile.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: vendorProfile.adapter_foundation_ref,
  });
}
if (vendorProfile.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: vendorProfile.runtime_interface_ref,
  });
}
if (vendorProfile.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: vendorProfile.runtime_package_ref,
  });
}
if (
  JSON.stringify(vendorProfile.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorProfile.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorProfile.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorProfile.required_channels.join(','),
  });
}
if (vendorProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorProfile.spatial_frame_ref });
}
if (
  vendorProfile.capability_set_id !== CAPABILITY_SET_ID ||
  vendorProfile.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorProfile.capability_set_id}@${vendorProfile.capability_set_version}`,
  });
}

// 1) Vendor profile schema.
const schema = vendorProfile.vendor_profile_schema;
if (schema.schema_id !== 'dsc-vendor-profile-schema-v1') {
  issues.push({ code: 'SCHEMA_ID', message: schema.schema_id });
}
if (
  schema.encoding !== 'application/json' ||
  schema.vendor_profile_id_policy !== 'opaque_vendor_profile_id_no_vendor_binding' ||
  schema.family_ref !== BACKEND_FAMILY_ID ||
  schema.optional_fields.length !== 0 ||
  schema.additional_fields
) {
  issues.push({ code: 'SCHEMA_POLICY', message: schema.vendor_profile_id_policy });
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

// 2) Deterministic vendor profile identity.
const identity = vendorProfile.deterministic_vendor_profile_identity;
if (identity.identity_id !== 'dsc-vendor-profile-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.vendor_profile_id !== VENDOR_PROFILE_ID ||
  identity.vendor_profile_version !== VENDOR_PROFILE_VERSION ||
  identity.identity_policy !== 'opaque_vendor_profile_id_no_vendor_binding' ||
  identity.derivation !== 'literal_constant_declared_at_design_time' ||
  identity.purity !== 'deterministic_pure_constant' ||
  identity.seed_dependence !== 'none' ||
  identity.time_dependence !== 'none' ||
  identity.randomness !== 'none' ||
  identity.vendor_binding !== 'none' ||
  identity.framework_binding !== 'none' ||
  identity.device_binding !== 'none' ||
  identity.vendor_name !== 'none' ||
  identity.capability_set_id !== CAPABILITY_SET_ID ||
  identity.capability_set_version !== CAPABILITY_SET_VERSION ||
  identity.spatial_frame_ref !== SPATIAL_FRAME.frame_id
) {
  issues.push({ code: 'IDENTITY_POLICY', message: identity.vendor_profile_id });
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

// 3) Backend family binding.
const binding = vendorProfile.backend_family_binding;
if (binding.binding_id !== 'dsc-vendor-profile-backend-family-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.family_ref !== BACKEND_FAMILY_PATH ||
  binding.family_id !== BACKEND_FAMILY_ID ||
  binding.family_version !== BACKEND_FAMILY_VERSION ||
  binding.family_phase !== 'PHASE-DSC-053' ||
  binding.family_system_id !== 'DIRECT_SPATIAL_CONDITIONING_BACKEND_FAMILY_V1' ||
  binding.family_certification_ref !== BACKEND_FAMILY_CERTIFICATION_PATH ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'vendor_profile_family_anchor' ||
  binding.reference_backend_ref !== REFERENCE_BACKEND_PATH ||
  binding.family_capability_contract_ref !==
    'dsc-backend-family-capability-contract-v1' ||
  binding.instantiates_vendors_in_this_phase ||
  binding.implements_family_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.family_id });
}

// 4) Vendor capability interface.
const capabilityInterface = vendorProfile.vendor_capability_interface;
if (capabilityInterface.interface_id !== 'dsc-vendor-capability-interface-v1') {
  issues.push({ code: 'INTERFACE_ID', message: capabilityInterface.interface_id });
}
if (
  capabilityInterface.adapter_interface_ref !== 'dsc-backend-adapter-interface-v1' ||
  capabilityInterface.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH ||
  capabilityInterface.family_capability_contract_ref !==
    'dsc-backend-family-capability-contract-v1' ||
  capabilityInterface.capability_set_id !== CAPABILITY_SET_ID ||
  capabilityInterface.capability_set_version !== CAPABILITY_SET_VERSION ||
  capabilityInterface.spatial_frame_ref !== SPATIAL_FRAME.frame_id ||
  capabilityInterface.vendor_specific_extensions !== 'forbidden' ||
  capabilityInterface.requires_gpu ||
  capabilityInterface.performs_inference ||
  capabilityInterface.implements_interface_in_this_phase
) {
  issues.push({
    code: 'INTERFACE_POLICY',
    message: capabilityInterface.interface_id,
  });
}
if (
  JSON.stringify(capabilityInterface.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'INTERFACE_CHANNELS',
    message: capabilityInterface.required_channels.join(','),
  });
}
const methodIds = capabilityInterface.methods.map((method) => method.method_id);
if (JSON.stringify(methodIds) !== JSON.stringify(EXPECTED_METHODS)) {
  issues.push({ code: 'INTERFACE_METHODS', message: methodIds.join(',') });
}
const foundationMethodIds = adapterFoundation.backend_interface.methods.map(
  (method) => method.method_id
);
if (JSON.stringify(methodIds) !== JSON.stringify(foundationMethodIds)) {
  issues.push({ code: 'INTERFACE_METHOD_DRIFT', message: methodIds.join(',') });
}
const foundationSignatures = new Map(
  adapterFoundation.backend_interface.methods.map((method) => [
    method.method_id,
    method.signature,
  ])
);
for (const method of capabilityInterface.methods) {
  if (
    method.signature !== foundationSignatures.get(method.method_id) ||
    method.source_interface !== 'dsc-backend-adapter-interface-v1' ||
    !method.abstract ||
    !method.vendor_must_implement ||
    method.requires_gpu ||
    method.performs_inference ||
    method.implemented_in_this_phase
  ) {
    issues.push({ code: 'INTERFACE_METHOD_INCOMPLETE', message: method.method_id });
  }
}
const declarationIds = capabilityInterface.required_capability_declarations.map(
  (declaration) => declaration.capability_id
);
if (JSON.stringify(declarationIds) !== JSON.stringify(registeredCapabilityIds)) {
  issues.push({
    code: 'INTERFACE_CAPABILITY_ORDER',
    message: declarationIds.join(','),
  });
}
for (const declaration of capabilityInterface.required_capability_declarations) {
  if (
    declaration.requirement !== 'mandatory' ||
    declaration.declared_state_required !== 'supported' ||
    declaration.inherited_from !== 'dsc-backend-family-capability-contract-v1' ||
    !declaration.vendor_must_declare
  ) {
    issues.push({
      code: 'INTERFACE_CAPABILITY_INCOMPLETE',
      message: declaration.capability_id,
    });
  }
}

// Read-only: no vendors bound in this phase.
const bound = vendorProfile.bound_vendors;
if (
  bound.count !== 0 ||
  bound.entries.length !== 0 ||
  bound.binds_vendors_in_this_phase ||
  !bound.binding_policy
) {
  issues.push({ code: 'BOUND_VENDORS', message: `${bound.count}` });
}

// Design constraints.
const constraints = vendorProfile.design_constraints;
if (
  !constraints.vendor_profile_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_backend_family ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.binds_vendors_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [VENDOR_PROFILE_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorProfile);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_profile_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_PROFILE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorProfile.mode,
  vendor_profile_id: vendorProfile.vendor_profile_id,
  vendor_profile_version: vendorProfile.vendor_profile_version,
  vendor_profile_kind: vendorProfile.vendor_profile_kind,
  vendor_profile_schema: schema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_vendor_profile_identity: identity.identity_id,
  backend_family_binding: binding.binding_id,
  family_id: binding.family_id,
  vendor_capability_interface: capabilityInterface.interface_id,
  interface_methods: methodIds,
  required_capability_declarations: declarationIds.length,
  bound_vendors: bound.count,
  sources_supported: vendorProfile.sources_supported.length,
  reuses_certified_backend_family: true,
  vendor_neutral: true,
  no_vendor_implementation: true,
  design_constraints: vendorProfile.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_profile: VENDOR_PROFILE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    family: BACKEND_FAMILY_PATH,
    family_certification: BACKEND_FAMILY_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_PROFILE_VALIDATION_REPORT.json';
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
    `vendor_profile_id=${report.vendor_profile_id}`,
    `schema_fields=${report.schema_fields}`,
    `family_id=${report.family_id}`,
    `methods=${report.interface_methods.length}`,
    `capabilities=${report.required_capability_declarations}`,
    `bound_vendors=${report.bound_vendors}`,
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
