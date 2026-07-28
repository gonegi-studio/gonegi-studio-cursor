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
import { VENDOR_ROUTER_PATH } from '../services/directSpatialConditioningVendorRouterBuilder.js';
import { VENDOR_EXECUTION_CONTRACT_PATH } from '../services/directSpatialConditioningVendorExecutionContractBuilder.js';
import { VENDOR_IMPLEMENTATION_SPEC_PATH } from '../services/directSpatialConditioningVendorImplementationSpecBuilder.js';
import {
  VENDOR_REFERENCE_PROFILE_ID,
  VENDOR_REFERENCE_PROFILE_PATH,
} from '../services/directSpatialConditioningVendorReferenceProfileBuilder.js';
import { VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorReferenceProfileCertificationBuilder.js';
import {
  VENDOR_TEMPLATE_ID,
  VENDOR_TEMPLATE_PATH,
} from '../services/directSpatialConditioningVendorTemplateBuilder.js';
import {
  VENDOR_REFERENCE_IMPLEMENTATION_ID,
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  type DirectSpatialConditioningVendorReferenceImplementation,
} from '../services/directSpatialConditioningVendorReferenceImplementationBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorReferenceImplementationCertificationBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE,
  DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_FAMILY_ID,
  VENDOR_IMPLEMENTATION_FAMILY_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_VERSION,
  type DirectSpatialConditioningVendorImplementationFamily,
} from '../services/directSpatialConditioningVendorImplementationFamilyBuilder.js';
import { VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorImplementationFamilyCertificationBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE,
  VENDOR_IMPLEMENTATION_PROFILE_ID,
  VENDOR_IMPLEMENTATION_PROFILE_PATH,
  VENDOR_IMPLEMENTATION_PROFILE_VERSION,
  buildDirectSpatialConditioningVendorImplementationProfile,
  type DirectSpatialConditioningVendorImplementationProfile,
} from '../services/directSpatialConditioningVendorImplementationProfileBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-implementation-profile.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-implementation-profile-implementation-registry-v1.json';

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

const EXPECTED_METHODS = [
  'describe_capabilities',
  'check_compatibility',
  'bind_conditioning_input',
  'release_conditioning_binding',
];

const EXPECTED_EXTENSION_POINTS = [
  'EXT_VENDOR_DECLARE_CAPABILITIES',
  'EXT_VENDOR_RESOLVE_COMPATIBILITY',
  'EXT_VENDOR_BIND_CONDITIONING_INPUT',
  'EXT_VENDOR_RELEASE_BINDING',
];

const EXPECTED_SCHEMA_FIELDS = [
  'profile_id',
  'profile_version',
  'profile_kind',
  'family_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_profile_identity',
  'vendor_implementation_family_binding',
  'implementation_capability_profile',
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
  VENDOR_REFERENCE_PROFILE_PATH,
  VENDOR_TEMPLATE_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_PATH,
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  BACKEND_FAMILY_CERTIFICATION_PATH,
  VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, VENDOR_IMPLEMENTATION_FAMILY_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor implementation family ${VENDOR_IMPLEMENTATION_FAMILY_PATH}`
  );
  process.exit(1);
}
if (
  !fs.existsSync(path.join(projectRoot, VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH))
) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor implementation family certification ${VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH}`
  );
  process.exit(1);
}

const familyCertification = readJson<{
  certified?: boolean;
  certified_system?: string;
}>(VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH);
if (familyCertification.certified !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor implementation family is not certified');
  process.exit(1);
}
if (
  familyCertification.certified_system !== DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID
) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: certification does not cover the vendor implementation family');
  process.exit(1);
}

const family = readJson<DirectSpatialConditioningVendorImplementationFamily>(
  VENDOR_IMPLEMENTATION_FAMILY_PATH
);
const referenceImplementation =
  readJson<DirectSpatialConditioningVendorReferenceImplementation>(
    VENDOR_REFERENCE_IMPLEMENTATION_PATH
  );

let vendorImplementationProfile: DirectSpatialConditioningVendorImplementationProfile;
try {
  vendorImplementationProfile =
    buildDirectSpatialConditioningVendorImplementationProfile(projectRoot)
      .vendorImplementationProfile;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR IMPLEMENTATION PROFILE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorImplementationProfile.phase !== DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE) {
  issues.push({ code: 'PHASE', message: vendorImplementationProfile.phase });
}
if (vendorImplementationProfile.mode !== 'design_only_vendor_implementation_profile') {
  issues.push({ code: 'MODE', message: vendorImplementationProfile.mode });
}
if (vendorImplementationProfile.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorImplementationProfile.target });
}
if (vendorImplementationProfile.profile_id !== VENDOR_IMPLEMENTATION_PROFILE_ID) {
  issues.push({ code: 'PROFILE_ID', message: vendorImplementationProfile.profile_id });
}
if (vendorImplementationProfile.profile_version !== VENDOR_IMPLEMENTATION_PROFILE_VERSION) {
  issues.push({
    code: 'PROFILE_VERSION',
    message: vendorImplementationProfile.profile_version,
  });
}
if (vendorImplementationProfile.profile_kind !== 'generic_vendor_implementation_profile') {
  issues.push({ code: 'PROFILE_KIND', message: vendorImplementationProfile.profile_kind });
}

const refChecks: Array<[string, string, string]> = [
  ['family_ref', vendorImplementationProfile.family_ref, VENDOR_IMPLEMENTATION_FAMILY_PATH],
  [
    'family_certification_ref',
    vendorImplementationProfile.family_certification_ref,
    VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
  ],
  [
    'reference_implementation_ref',
    vendorImplementationProfile.reference_implementation_ref,
    VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  ],
  [
    'reference_implementation_certification_ref',
    vendorImplementationProfile.reference_implementation_certification_ref,
    VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
  ],
  ['template_ref', vendorImplementationProfile.template_ref, VENDOR_TEMPLATE_PATH],
  ['profile_ref', vendorImplementationProfile.profile_ref, VENDOR_REFERENCE_PROFILE_PATH],
  [
    'profile_certification_ref',
    vendorImplementationProfile.profile_certification_ref,
    VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
  ],
  [
    'vendor_implementation_spec_ref',
    vendorImplementationProfile.vendor_implementation_spec_ref,
    VENDOR_IMPLEMENTATION_SPEC_PATH,
  ],
  [
    'vendor_execution_contract_ref',
    vendorImplementationProfile.vendor_execution_contract_ref,
    VENDOR_EXECUTION_CONTRACT_PATH,
  ],
  ['vendor_router_ref', vendorImplementationProfile.vendor_router_ref, VENDOR_ROUTER_PATH],
  [
    'vendor_compatibility_ref',
    vendorImplementationProfile.vendor_compatibility_ref,
    VENDOR_COMPATIBILITY_PATH,
  ],
  [
    'vendor_registry_ref',
    vendorImplementationProfile.vendor_registry_ref,
    VENDOR_REGISTRY_PATH,
  ],
  ['vendor_profile_ref', vendorImplementationProfile.vendor_profile_ref, VENDOR_PROFILE_PATH],
  ['backend_family_ref', vendorImplementationProfile.backend_family_ref, BACKEND_FAMILY_PATH],
  [
    'backend_family_certification_ref',
    vendorImplementationProfile.backend_family_certification_ref,
    BACKEND_FAMILY_CERTIFICATION_PATH,
  ],
  [
    'reference_backend_ref',
    vendorImplementationProfile.reference_backend_ref,
    REFERENCE_BACKEND_PATH,
  ],
  [
    'reference_backend_certification_ref',
    vendorImplementationProfile.reference_backend_certification_ref,
    REFERENCE_BACKEND_CERTIFICATION_PATH,
  ],
  [
    'backend_template_ref',
    vendorImplementationProfile.backend_template_ref,
    BACKEND_TEMPLATE_PATH,
  ],
  [
    'backend_template_certification_ref',
    vendorImplementationProfile.backend_template_certification_ref,
    BACKEND_TEMPLATE_CERTIFICATION_PATH,
  ],
  [
    'backend_profile_ref',
    vendorImplementationProfile.backend_profile_ref,
    BACKEND_PROFILE_PATH,
  ],
  [
    'backend_profile_certification_ref',
    vendorImplementationProfile.backend_profile_certification_ref,
    BACKEND_PROFILE_CERTIFICATION_PATH,
  ],
  [
    'backend_design_certification_ref',
    vendorImplementationProfile.backend_design_certification_ref,
    BACKEND_DESIGN_CERTIFICATION_PATH,
  ],
  [
    'implementation_spec_ref',
    vendorImplementationProfile.implementation_spec_ref,
    BACKEND_IMPLEMENTATION_SPEC_PATH,
  ],
  [
    'execution_contract_ref',
    vendorImplementationProfile.execution_contract_ref,
    BACKEND_EXECUTION_CONTRACT_PATH,
  ],
  [
    'runtime_router_ref',
    vendorImplementationProfile.runtime_router_ref,
    BACKEND_RUNTIME_ROUTER_PATH,
  ],
  [
    'adapter_registration_ref',
    vendorImplementationProfile.adapter_registration_ref,
    BACKEND_ADAPTER_REGISTRATION_PATH,
  ],
  [
    'compatibility_engine_ref',
    vendorImplementationProfile.compatibility_engine_ref,
    BACKEND_COMPATIBILITY_ENGINE_PATH,
  ],
  [
    'capability_registry_ref',
    vendorImplementationProfile.capability_registry_ref,
    BACKEND_CAPABILITY_REGISTRY_PATH,
  ],
  [
    'adapter_foundation_ref',
    vendorImplementationProfile.adapter_foundation_ref,
    BACKEND_ADAPTER_FOUNDATION_PATH,
  ],
  [
    'runtime_interface_ref',
    vendorImplementationProfile.runtime_interface_ref,
    RUNTIME_INTERFACE_PATH,
  ],
  [
    'runtime_package_ref',
    vendorImplementationProfile.runtime_package_ref,
    RUNTIME_PACKAGE_PATH,
  ],
];
for (const [code, actual, expected] of refChecks) {
  if (actual !== expected) {
    issues.push({ code: `REF_${code.toUpperCase()}`, message: `${actual}` });
  }
  if (!fs.existsSync(path.join(projectRoot, expected))) {
    issues.push({ code: `UNRESOLVED_${code.toUpperCase()}`, message: expected });
  }
}

if (
  JSON.stringify(vendorImplementationProfile.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorImplementationProfile.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorImplementationProfile.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorImplementationProfile.required_channels.join(','),
  });
}
if (vendorImplementationProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({
    code: 'SPATIAL_FRAME',
    message: vendorImplementationProfile.spatial_frame_ref,
  });
}
if (
  vendorImplementationProfile.capability_set_id !== CAPABILITY_SET_ID ||
  vendorImplementationProfile.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorImplementationProfile.capability_set_id}@${vendorImplementationProfile.capability_set_version}`,
  });
}

// 1) Implementation profile schema.
const profileSchema = vendorImplementationProfile.implementation_profile_schema;
if (profileSchema.schema_id !== 'dsc-vendor-implementation-profile-schema-v1') {
  issues.push({ code: 'PROFILE_SCHEMA_ID', message: profileSchema.schema_id });
}
if (
  profileSchema.encoding !== 'application/json' ||
  profileSchema.profile_id_policy !== 'opaque_profile_id_no_vendor_binding' ||
  profileSchema.family_ref !== VENDOR_IMPLEMENTATION_FAMILY_ID ||
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

// 2) Deterministic profile identity.
const identity = vendorImplementationProfile.deterministic_profile_identity;
if (identity.identity_id !== 'dsc-vendor-implementation-profile-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.profile_id !== VENDOR_IMPLEMENTATION_PROFILE_ID ||
  identity.profile_version !== VENDOR_IMPLEMENTATION_PROFILE_VERSION ||
  identity.identity_policy !== 'opaque_profile_id_no_vendor_binding' ||
  identity.derivation !== 'literal_constant_declared_at_design_time' ||
  identity.purity !== 'deterministic_pure_constant' ||
  identity.seed_dependence !== 'none' ||
  identity.time_dependence !== 'none' ||
  identity.randomness !== 'none' ||
  identity.vendor_binding !== 'none' ||
  identity.framework_binding !== 'none' ||
  identity.device_binding !== 'none' ||
  identity.vendor_name !== 'none' ||
  identity.spatial_frame_ref !== SPATIAL_FRAME.frame_id
) {
  issues.push({ code: 'IDENTITY_POLICY', message: identity.derivation });
}
if (
  identity.capability_set_id !== CAPABILITY_SET_ID ||
  identity.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({ code: 'IDENTITY_CAPABILITY_SET', message: identity.capability_set_id });
}
if (
  JSON.stringify(identity.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({ code: 'IDENTITY_CHANNELS', message: identity.required_channels.join(',') });
}

// 3) Certified Vendor Implementation Family binding.
const binding = vendorImplementationProfile.vendor_implementation_family_binding;
if (binding.binding_id !== 'dsc-vendor-implementation-profile-family-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.family_ref !== VENDOR_IMPLEMENTATION_FAMILY_PATH ||
  binding.family_id !== VENDOR_IMPLEMENTATION_FAMILY_ID ||
  binding.family_version !== VENDOR_IMPLEMENTATION_FAMILY_VERSION ||
  binding.family_phase !== DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE ||
  binding.family_system_id !== DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID ||
  binding.family_certification_ref !== VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'family_conformance_profile' ||
  binding.family_contract_ref !== 'dsc-vendor-implementation-family-contract-v1' ||
  binding.reference_implementation_ref !== VENDOR_REFERENCE_IMPLEMENTATION_PATH ||
  binding.reference_implementation_id !== VENDOR_REFERENCE_IMPLEMENTATION_ID ||
  binding.template_ref !== VENDOR_TEMPLATE_PATH ||
  binding.template_id !== VENDOR_TEMPLATE_ID ||
  binding.profile_ref !== VENDOR_REFERENCE_PROFILE_PATH ||
  binding.profile_id !== VENDOR_REFERENCE_PROFILE_ID ||
  binding.measures_members_in_this_phase ||
  binding.implements_family_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}
if (
  binding.family_id !== family.family_id ||
  binding.family_version !== family.family_version
) {
  issues.push({ code: 'BINDING_FAMILY_DRIFT', message: binding.family_id });
}

// 4) Implementation capability profile.
const capabilityProfile = vendorImplementationProfile.implementation_capability_profile;
if (capabilityProfile.capability_profile_id !== 'dsc-vendor-implementation-capability-profile-v1') {
  issues.push({ code: 'CAPABILITY_PROFILE_ID', message: capabilityProfile.capability_profile_id });
}
if (
  capabilityProfile.family_contract_ref !== 'dsc-vendor-implementation-family-contract-v1' ||
  capabilityProfile.capability_set_id !== CAPABILITY_SET_ID ||
  capabilityProfile.capability_set_version !== CAPABILITY_SET_VERSION ||
  capabilityProfile.vendor_capability_interface_ref !== 'dsc-vendor-capability-interface-v1' ||
  capabilityProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id ||
  capabilityProfile.required_sources !== SOURCE_IDS.length ||
  capabilityProfile.adapted_input_shape_ref !== 'dsc_adapted_conditioning_input_v1' ||
  capabilityProfile.binding_mode !== 'exact_reuse' ||
  capabilityProfile.purity !== 'deterministic_pure_declaration' ||
  capabilityProfile.seed_dependence !== 'none' ||
  capabilityProfile.time_dependence !== 'none' ||
  capabilityProfile.randomness !== 'none' ||
  capabilityProfile.aggregation_rule !== 'all_mandatory_capabilities_supported' ||
  capabilityProfile.undeclared_capability_policy !== 'reject' ||
  capabilityProfile.vendor_specific_capabilities !== 'forbidden' ||
  capabilityProfile.vendor_specific_extensions !== 'forbidden' ||
  !capabilityProfile.inherits_capability_declarations ||
  capabilityProfile.requires_gpu ||
  capabilityProfile.performs_inference ||
  capabilityProfile.evaluates_members_in_this_phase
) {
  issues.push({ code: 'CAPABILITY_PROFILE_POLICY', message: capabilityProfile.binding_mode });
}
if (
  JSON.stringify(capabilityProfile.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'CAPABILITY_PROFILE_CHANNELS',
    message: capabilityProfile.required_channels.join(','),
  });
}

// Reproducibility: capabilities and methods must mirror the certified family contract.
const contract = family.implementation_family_contract;
const contractCapabilityIds = contract.required_capabilities.map(
  (entry) => entry.capability_id
);
const profileCapabilityIds = capabilityProfile.capability_entries.map(
  (entry) => entry.capability_id
);
if (JSON.stringify(profileCapabilityIds) !== JSON.stringify(contractCapabilityIds)) {
  issues.push({
    code: 'CAPABILITY_PROFILE_CAPABILITY_DRIFT',
    message: profileCapabilityIds.join(','),
  });
}
if (new Set(profileCapabilityIds).size !== profileCapabilityIds.length) {
  issues.push({
    code: 'CAPABILITY_PROFILE_CAPABILITY_DUPLICATE',
    message: profileCapabilityIds.join(','),
  });
}
for (const entry of capabilityProfile.capability_entries) {
  if (
    entry.declared_state !== 'required' ||
    entry.requirement !== 'mandatory' ||
    entry.inherited_from !== 'dsc-vendor-implementation-family-contract-v1' ||
    !entry.deterministic ||
    entry.evaluated_in_this_phase
  ) {
    issues.push({ code: 'CAPABILITY_PROFILE_ENTRY_INCOMPLETE', message: entry.capability_id });
  }
}

const contractMethodIds = contract.required_methods.map((entry) => entry.method_id);
if (JSON.stringify(capabilityProfile.methods_required) !== JSON.stringify(EXPECTED_METHODS)) {
  issues.push({
    code: 'CAPABILITY_PROFILE_METHODS',
    message: capabilityProfile.methods_required.join(','),
  });
}
if (JSON.stringify(capabilityProfile.methods_required) !== JSON.stringify(contractMethodIds)) {
  issues.push({
    code: 'CAPABILITY_PROFILE_METHOD_DRIFT',
    message: capabilityProfile.methods_required.join(','),
  });
}
const methodEntryIds = capabilityProfile.method_entries.map((entry) => entry.method_id);
if (JSON.stringify(methodEntryIds) !== JSON.stringify(EXPECTED_METHODS)) {
  issues.push({ code: 'CAPABILITY_PROFILE_METHOD_ENTRIES', message: methodEntryIds.join(',') });
}
const extensionPoints = capabilityProfile.method_entries.map(
  (entry) => entry.extension_point_ref
);
if (JSON.stringify(extensionPoints) !== JSON.stringify(EXPECTED_EXTENSION_POINTS)) {
  issues.push({ code: 'CAPABILITY_PROFILE_EXTENSION_POINTS', message: extensionPoints.join(',') });
}
const contractPointByMethod = new Map(
  contract.required_methods.map((entry) => [entry.method_id, entry.extension_point_ref])
);
for (const entry of capabilityProfile.method_entries) {
  if (entry.extension_point_ref !== contractPointByMethod.get(entry.method_id)) {
    issues.push({ code: 'CAPABILITY_PROFILE_EXTENSION_POINT_DRIFT', message: entry.method_id });
  }
  if (
    entry.requirement !== 'mandatory' ||
    entry.inherited_from !== 'dsc-vendor-implementation-family-contract-v1' ||
    entry.conformance_state !== 'declared_not_evaluated' ||
    !entry.deterministic ||
    entry.side_effects !== 'none' ||
    entry.evaluated_in_this_phase
  ) {
    issues.push({ code: 'CAPABILITY_PROFILE_METHOD_INCOMPLETE', message: entry.method_id });
  }
}

// Cross-check against the certified reference implementation profile too.
const implementationProfileCapabilityIds =
  referenceImplementation.reference_implementation_profile.capability_entries.map(
    (entry) => entry.capability_id
  );
if (
  JSON.stringify(profileCapabilityIds) !==
  JSON.stringify(implementationProfileCapabilityIds)
) {
  issues.push({
    code: 'CAPABILITY_PROFILE_REFERENCE_DRIFT',
    message: profileCapabilityIds.join(','),
  });
}

// Design only: no member profiled in this phase.
const members = vendorImplementationProfile.profiled_members;
if (
  members.count !== 0 ||
  members.entries.length !== 0 ||
  members.measures_members_in_this_phase ||
  !members.profiling_policy
) {
  issues.push({ code: 'PROFILED_MEMBERS', message: `${members.count}` });
}

// Design constraints.
const constraints = vendorImplementationProfile.design_constraints;
if (
  !constraints.profile_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_implementation_family ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.measures_members_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [
  VENDOR_IMPLEMENTATION_PROFILE_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorImplementationProfile);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_implementation_profile_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorImplementationProfile.mode,
  profile_id: vendorImplementationProfile.profile_id,
  profile_version: vendorImplementationProfile.profile_version,
  profile_kind: vendorImplementationProfile.profile_kind,
  implementation_profile_schema: profileSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_profile_identity: identity.identity_id,
  vendor_implementation_family_binding: binding.binding_id,
  implementation_capability_profile: capabilityProfile.capability_profile_id,
  required_capabilities: profileCapabilityIds.length,
  required_methods: capabilityProfile.methods_required,
  required_extension_points: extensionPoints,
  profiled_members: members.count,
  sources_supported: vendorImplementationProfile.sources_supported.length,
  reuses_certified_vendor_implementation_family: true,
  vendor_neutral: true,
  design_constraints: vendorImplementationProfile.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_implementation_profile: VENDOR_IMPLEMENTATION_PROFILE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    family: VENDOR_IMPLEMENTATION_FAMILY_PATH,
    family_certification: VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_VALIDATION_REPORT.json';
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
    `schema_fields=${report.schema_fields}`,
    `required_capabilities=${report.required_capabilities}`,
    `required_methods=${report.required_methods.length}`,
    `extension_points=${report.required_extension_points.length}`,
    `profiled_members=${report.profiled_members}`,
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
