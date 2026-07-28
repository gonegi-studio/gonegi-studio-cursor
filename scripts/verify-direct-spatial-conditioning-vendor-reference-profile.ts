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
  VENDOR_PROFILE_VERSION,
  type DirectSpatialConditioningVendorProfile,
} from '../services/directSpatialConditioningVendorProfileBuilder.js';
import { VENDOR_REGISTRY_PATH } from '../services/directSpatialConditioningVendorRegistryBuilder.js';
import { VENDOR_COMPATIBILITY_PATH } from '../services/directSpatialConditioningVendorCompatibilityBuilder.js';
import { VENDOR_ROUTER_PATH } from '../services/directSpatialConditioningVendorRouterBuilder.js';
import { VENDOR_EXECUTION_CONTRACT_PATH } from '../services/directSpatialConditioningVendorExecutionContractBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE,
  DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_SPEC_PATH,
} from '../services/directSpatialConditioningVendorImplementationSpecBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_REFERENCE_PROFILE_PHASE,
  VENDOR_REFERENCE_PROFILE_ID,
  VENDOR_REFERENCE_PROFILE_PATH,
  VENDOR_REFERENCE_PROFILE_VERSION,
  buildDirectSpatialConditioningVendorReferenceProfile,
  type DirectSpatialConditioningVendorReferenceProfile,
} from '../services/directSpatialConditioningVendorReferenceProfileBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-profile.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-profile-implementation-registry-v1.json';

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
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_vendor_identity',
  'vendor_design_binding',
  'reference_vendor_capability_profile',
];

const EXPECTED_METHODS = [
  'describe_capabilities',
  'check_compatibility',
  'bind_conditioning_input',
  'release_conditioning_binding',
];

const EXPECTED_DESIGN_LAYERS = [
  'vendor_profile',
  'vendor_registry',
  'vendor_compatibility',
  'vendor_router',
  'vendor_execution_contract',
  'vendor_implementation_spec',
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
  VENDOR_REGISTRY_PATH,
  VENDOR_COMPATIBILITY_PATH,
  VENDOR_ROUTER_PATH,
  VENDOR_EXECUTION_CONTRACT_PATH,
  VENDOR_IMPLEMENTATION_SPEC_PATH,
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

if (!fs.existsSync(path.join(projectRoot, VENDOR_IMPLEMENTATION_SPEC_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor implementation spec ${VENDOR_IMPLEMENTATION_SPEC_PATH}`
  );
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

const vendorImplementationSpec = readJson<{ target?: string }>(
  VENDOR_IMPLEMENTATION_SPEC_PATH
);
if (
  vendorImplementationSpec.target !==
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1'
) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: vendor design is not certified with the PASS target'
  );
  process.exit(1);
}

const vendorProfile = readJson<DirectSpatialConditioningVendorProfile>(
  VENDOR_PROFILE_PATH
);

let vendorReferenceProfile: DirectSpatialConditioningVendorReferenceProfile;
try {
  vendorReferenceProfile =
    buildDirectSpatialConditioningVendorReferenceProfile(projectRoot)
      .vendorReferenceProfile;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(
    `VENDOR REFERENCE PROFILE FAILED: ${(error as Error).message}`
  );
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorReferenceProfile.phase !== DSC_VENDOR_REFERENCE_PROFILE_PHASE) {
  issues.push({ code: 'PHASE', message: vendorReferenceProfile.phase });
}
if (vendorReferenceProfile.mode !== 'design_only_vendor_reference_profile') {
  issues.push({ code: 'MODE', message: vendorReferenceProfile.mode });
}
if (vendorReferenceProfile.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorReferenceProfile.target });
}
if (vendorReferenceProfile.vendor_profile_id !== VENDOR_REFERENCE_PROFILE_ID) {
  issues.push({
    code: 'VENDOR_PROFILE_ID',
    message: vendorReferenceProfile.vendor_profile_id,
  });
}
if (
  vendorReferenceProfile.vendor_profile_version !== VENDOR_REFERENCE_PROFILE_VERSION
) {
  issues.push({
    code: 'VENDOR_PROFILE_VERSION',
    message: vendorReferenceProfile.vendor_profile_version,
  });
}
if (vendorReferenceProfile.vendor_profile_kind !== 'reference_vendor_profile') {
  issues.push({
    code: 'VENDOR_PROFILE_KIND',
    message: vendorReferenceProfile.vendor_profile_kind,
  });
}
if (
  vendorReferenceProfile.vendor_implementation_spec_ref !==
  VENDOR_IMPLEMENTATION_SPEC_PATH
) {
  issues.push({
    code: 'VENDOR_IMPLEMENTATION_SPEC_REF',
    message: vendorReferenceProfile.vendor_implementation_spec_ref,
  });
}
if (
  vendorReferenceProfile.vendor_implementation_spec_phase !==
  DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE
) {
  issues.push({
    code: 'VENDOR_IMPLEMENTATION_SPEC_PHASE',
    message: vendorReferenceProfile.vendor_implementation_spec_phase,
  });
}
if (
  vendorReferenceProfile.vendor_implementation_spec_system_id !==
  DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID
) {
  issues.push({
    code: 'VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID',
    message: vendorReferenceProfile.vendor_implementation_spec_system_id,
  });
}
if (
  vendorReferenceProfile.vendor_execution_contract_ref !==
  VENDOR_EXECUTION_CONTRACT_PATH
) {
  issues.push({
    code: 'VENDOR_EXECUTION_CONTRACT_REF',
    message: vendorReferenceProfile.vendor_execution_contract_ref,
  });
}
if (vendorReferenceProfile.vendor_router_ref !== VENDOR_ROUTER_PATH) {
  issues.push({
    code: 'VENDOR_ROUTER_REF',
    message: vendorReferenceProfile.vendor_router_ref,
  });
}
if (
  vendorReferenceProfile.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH
) {
  issues.push({
    code: 'VENDOR_COMPATIBILITY_REF',
    message: vendorReferenceProfile.vendor_compatibility_ref,
  });
}
if (vendorReferenceProfile.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
  issues.push({
    code: 'VENDOR_REGISTRY_REF',
    message: vendorReferenceProfile.vendor_registry_ref,
  });
}
if (vendorReferenceProfile.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
  issues.push({
    code: 'VENDOR_PROFILE_REF',
    message: vendorReferenceProfile.vendor_profile_ref,
  });
}
if (vendorReferenceProfile.family_ref !== BACKEND_FAMILY_PATH) {
  issues.push({ code: 'FAMILY_REF', message: vendorReferenceProfile.family_ref });
}
if (
  vendorReferenceProfile.family_certification_ref !==
  BACKEND_FAMILY_CERTIFICATION_PATH
) {
  issues.push({
    code: 'FAMILY_CERTIFICATION_REF',
    message: vendorReferenceProfile.family_certification_ref,
  });
}
if (vendorReferenceProfile.reference_backend_ref !== REFERENCE_BACKEND_PATH) {
  issues.push({
    code: 'REFERENCE_BACKEND_REF',
    message: vendorReferenceProfile.reference_backend_ref,
  });
}
if (
  vendorReferenceProfile.reference_backend_certification_ref !==
  REFERENCE_BACKEND_CERTIFICATION_PATH
) {
  issues.push({
    code: 'REFERENCE_BACKEND_CERTIFICATION_REF',
    message: vendorReferenceProfile.reference_backend_certification_ref,
  });
}
if (vendorReferenceProfile.template_ref !== BACKEND_TEMPLATE_PATH) {
  issues.push({
    code: 'TEMPLATE_REF',
    message: vendorReferenceProfile.template_ref,
  });
}
if (
  vendorReferenceProfile.template_certification_ref !==
  BACKEND_TEMPLATE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'TEMPLATE_CERTIFICATION_REF',
    message: vendorReferenceProfile.template_certification_ref,
  });
}
if (vendorReferenceProfile.profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({
    code: 'PROFILE_REF',
    message: vendorReferenceProfile.profile_ref,
  });
}
if (
  vendorReferenceProfile.profile_certification_ref !==
  BACKEND_PROFILE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: vendorReferenceProfile.profile_certification_ref,
  });
}
if (
  vendorReferenceProfile.backend_design_certification_ref !==
  BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: vendorReferenceProfile.backend_design_certification_ref,
  });
}
if (
  vendorReferenceProfile.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH
) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: vendorReferenceProfile.implementation_spec_ref,
  });
}
if (
  vendorReferenceProfile.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH
) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: vendorReferenceProfile.execution_contract_ref,
  });
}
if (vendorReferenceProfile.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: vendorReferenceProfile.runtime_router_ref,
  });
}
if (
  vendorReferenceProfile.adapter_registration_ref !==
  BACKEND_ADAPTER_REGISTRATION_PATH
) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: vendorReferenceProfile.adapter_registration_ref,
  });
}
if (
  vendorReferenceProfile.compatibility_engine_ref !==
  BACKEND_COMPATIBILITY_ENGINE_PATH
) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: vendorReferenceProfile.compatibility_engine_ref,
  });
}
if (
  vendorReferenceProfile.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH
) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: vendorReferenceProfile.capability_registry_ref,
  });
}
if (
  vendorReferenceProfile.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH
) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: vendorReferenceProfile.adapter_foundation_ref,
  });
}
if (vendorReferenceProfile.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: vendorReferenceProfile.runtime_interface_ref,
  });
}
if (vendorReferenceProfile.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: vendorReferenceProfile.runtime_package_ref,
  });
}
if (
  JSON.stringify(vendorReferenceProfile.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorReferenceProfile.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorReferenceProfile.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorReferenceProfile.required_channels.join(','),
  });
}
if (vendorReferenceProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({
    code: 'SPATIAL_FRAME',
    message: vendorReferenceProfile.spatial_frame_ref,
  });
}
if (
  vendorReferenceProfile.capability_set_id !== CAPABILITY_SET_ID ||
  vendorReferenceProfile.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorReferenceProfile.capability_set_id}@${vendorReferenceProfile.capability_set_version}`,
  });
}

// 1) Reference vendor profile schema.
const profileSchema = vendorReferenceProfile.reference_vendor_profile_schema;
if (profileSchema.schema_id !== 'dsc-vendor-reference-profile-schema-v1') {
  issues.push({ code: 'SCHEMA_ID', message: profileSchema.schema_id });
}
if (
  profileSchema.encoding !== 'application/json' ||
  profileSchema.vendor_profile_id_policy !==
    'opaque_vendor_profile_id_no_vendor_binding' ||
  profileSchema.generic_vendor_profile_ref !== VENDOR_PROFILE_ID ||
  profileSchema.optional_fields.length !== 0 ||
  profileSchema.additional_fields
) {
  issues.push({
    code: 'SCHEMA_POLICY',
    message: profileSchema.vendor_profile_id_policy,
  });
}
const schemaFields = profileSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of profileSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic vendor identity.
const identity = vendorReferenceProfile.deterministic_vendor_identity;
if (
  identity.identity_id !== 'dsc-vendor-reference-profile-deterministic-identity-v1'
) {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.vendor_profile_id !== VENDOR_REFERENCE_PROFILE_ID ||
  identity.vendor_profile_version !== VENDOR_REFERENCE_PROFILE_VERSION ||
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
  identity.spatial_frame_ref !== SPATIAL_FRAME.frame_id ||
  JSON.stringify(identity.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({ code: 'IDENTITY_POLICY', message: identity.vendor_profile_id });
}

// 3) Certified Vendor Design binding.
const binding = vendorReferenceProfile.vendor_design_binding;
if (
  binding.binding_id !== 'dsc-vendor-reference-profile-vendor-design-binding-v1'
) {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.vendor_implementation_spec_ref !== VENDOR_IMPLEMENTATION_SPEC_PATH ||
  binding.vendor_implementation_spec_phase !== DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE ||
  binding.vendor_implementation_spec_system_id !==
    DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID ||
  binding.certified_target !==
    'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1' ||
  binding.vendor_execution_contract_ref !== VENDOR_EXECUTION_CONTRACT_PATH ||
  binding.vendor_router_ref !== VENDOR_ROUTER_PATH ||
  binding.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH ||
  binding.vendor_registry_ref !== VENDOR_REGISTRY_PATH ||
  binding.generic_vendor_profile_ref !== VENDOR_PROFILE_PATH ||
  binding.generic_vendor_profile_id !== VENDOR_PROFILE_ID ||
  binding.generic_vendor_profile_version !== VENDOR_PROFILE_VERSION ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'vendor_reference_profile_design_anchor' ||
  binding.instantiates_vendors_in_this_phase ||
  binding.implements_design_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.certified_target });
}
if (
  JSON.stringify(binding.design_layers_bound) !==
  JSON.stringify(EXPECTED_DESIGN_LAYERS)
) {
  issues.push({
    code: 'DESIGN_LAYERS',
    message: binding.design_layers_bound.join(','),
  });
}

// 4) Reference vendor capability profile.
const capabilityProfile =
  vendorReferenceProfile.reference_vendor_capability_profile;
if (
  capabilityProfile.capability_profile_id !==
  'dsc-vendor-reference-capability-profile-v1'
) {
  issues.push({
    code: 'CAPABILITY_PROFILE_ID',
    message: capabilityProfile.capability_profile_id,
  });
}
if (
  capabilityProfile.vendor_capability_interface_ref !==
    'dsc-vendor-capability-interface-v1' ||
  capabilityProfile.generic_vendor_profile_ref !== VENDOR_PROFILE_PATH ||
  capabilityProfile.capability_set_id !== CAPABILITY_SET_ID ||
  capabilityProfile.capability_set_version !== CAPABILITY_SET_VERSION ||
  capabilityProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id ||
  JSON.stringify(capabilityProfile.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS]) ||
  capabilityProfile.purity !== 'deterministic_pure_function' ||
  capabilityProfile.seed_dependence !== 'none' ||
  capabilityProfile.time_dependence !== 'none' ||
  capabilityProfile.randomness !== 'none' ||
  capabilityProfile.ordering !==
    'vendor_capability_interface_required_capability_declarations_order' ||
  capabilityProfile.undeclared_capability_policy !== 'reject' ||
  capabilityProfile.unknown_capability_policy !== 'reject' ||
  capabilityProfile.vendor_specific_extensions !== 'forbidden' ||
  capabilityProfile.requires_gpu ||
  capabilityProfile.performs_inference ||
  !capabilityProfile.maps_capabilities_in_this_phase ||
  capabilityProfile.implements_capabilities_in_this_phase
) {
  issues.push({
    code: 'CAPABILITY_PROFILE_POLICY',
    message: capabilityProfile.capability_profile_id,
  });
}
if (
  JSON.stringify(capabilityProfile.methods_required) !==
  JSON.stringify(EXPECTED_METHODS)
) {
  issues.push({
    code: 'CAPABILITY_METHODS',
    message: capabilityProfile.methods_required.join(','),
  });
}
const expectedCapabilityIds =
  vendorProfile.vendor_capability_interface.required_capability_declarations.map(
    (declaration) => declaration.capability_id
  );
const mappedCapabilityIds = capabilityProfile.entries.map(
  (entry) => entry.capability_id
);
if (JSON.stringify(mappedCapabilityIds) !== JSON.stringify(expectedCapabilityIds)) {
  issues.push({
    code: 'CAPABILITY_ENTRIES_DRIFT',
    message: mappedCapabilityIds.join(','),
  });
}
if (capabilityProfile.entries.length !== 6) {
  issues.push({
    code: 'CAPABILITY_ENTRIES_COUNT',
    message: `${capabilityProfile.entries.length}`,
  });
}
for (const entry of capabilityProfile.entries) {
  if (
    entry.declared_state !== 'supported' ||
    entry.mapping_rule !== 'mandatory_capability_maps_to_supported' ||
    entry.capability_version !== CAPABILITY_SET_VERSION ||
    entry.inherited_from !== 'dsc-vendor-capability-interface-v1' ||
    !entry.source_ref ||
    !entry.deterministic ||
    entry.evaluated_at !== 'profile_construction'
  ) {
    issues.push({
      code: 'CAPABILITY_ENTRY_INCOMPLETE',
      message: entry.capability_id,
    });
  }
}

// Read-only: no vendors bound in this phase.
const bound = vendorReferenceProfile.bound_vendors;
if (
  bound.count !== 0 ||
  bound.entries.length !== 0 ||
  bound.binds_vendors_in_this_phase ||
  !bound.binding_policy
) {
  issues.push({ code: 'BOUND_VENDORS', message: `${bound.count}` });
}

// Design constraints.
const constraints = vendorReferenceProfile.design_constraints;
if (
  !constraints.profile_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_design ||
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

for (const requiredArtifact of [
  VENDOR_REFERENCE_PROFILE_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorReferenceProfile);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_reference_profile_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_REFERENCE_PROFILE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorReferenceProfile.mode,
  vendor_profile_id: vendorReferenceProfile.vendor_profile_id,
  vendor_profile_version: vendorReferenceProfile.vendor_profile_version,
  reference_vendor_profile_schema: profileSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_vendor_identity: identity.identity_id,
  vendor_design_binding: binding.binding_id,
  design_layers_bound: binding.design_layers_bound.length,
  reference_vendor_capability_profile: capabilityProfile.capability_profile_id,
  capability_entries: capabilityProfile.entries.length,
  methods_required: capabilityProfile.methods_required.length,
  bound_vendors: bound.count,
  sources_supported: vendorReferenceProfile.sources_supported.length,
  reuses_certified_vendor_design: true,
  vendor_neutral: true,
  no_vendor_implementation: true,
  design_constraints: vendorReferenceProfile.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_reference_profile: VENDOR_REFERENCE_PROFILE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    vendor_implementation_spec: VENDOR_IMPLEMENTATION_SPEC_PATH,
    vendor_profile: VENDOR_PROFILE_PATH,
    family_certification: BACKEND_FAMILY_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_VALIDATION_REPORT.json';
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
    `design_layers=${report.design_layers_bound}`,
    `capability_entries=${report.capability_entries}`,
    `methods=${report.methods_required}`,
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
