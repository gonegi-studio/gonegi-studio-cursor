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
  DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE,
  DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID,
  VENDOR_REFERENCE_IMPLEMENTATION_ID,
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_VERSION,
  type DirectSpatialConditioningVendorReferenceImplementation,
} from '../services/directSpatialConditioningVendorReferenceImplementationBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorReferenceImplementationCertificationBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE,
  VENDOR_IMPLEMENTATION_FAMILY_ID,
  VENDOR_IMPLEMENTATION_FAMILY_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_VERSION,
  buildDirectSpatialConditioningVendorImplementationFamily,
  type DirectSpatialConditioningVendorImplementationFamily,
} from '../services/directSpatialConditioningVendorImplementationFamilyBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_FAMILY_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_FAMILY_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-implementation-family.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-implementation-family-implementation-registry-v1.json';

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
  'family_id',
  'family_version',
  'family_kind',
  'reference_implementation_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_family_identity',
  'reference_implementation_binding',
  'implementation_family_contract',
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
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  BACKEND_FAMILY_CERTIFICATION_PATH,
  VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, VENDOR_REFERENCE_IMPLEMENTATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor reference implementation ${VENDOR_REFERENCE_IMPLEMENTATION_PATH}`
  );
  process.exit(1);
}
if (
  !fs.existsSync(
    path.join(projectRoot, VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH)
  )
) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor reference implementation certification ${VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH}`
  );
  process.exit(1);
}

const implementationCertification = readJson<{
  certified?: boolean;
  certified_system?: string;
  target?: string;
}>(VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH);
if (implementationCertification.certified !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor reference implementation is not certified');
  process.exit(1);
}
if (
  implementationCertification.certified_system !==
  DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID
) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: certification does not cover the vendor reference implementation'
  );
  process.exit(1);
}

const referenceImplementation =
  readJson<DirectSpatialConditioningVendorReferenceImplementation>(
    VENDOR_REFERENCE_IMPLEMENTATION_PATH
  );

let vendorImplementationFamily: DirectSpatialConditioningVendorImplementationFamily;
try {
  vendorImplementationFamily =
    buildDirectSpatialConditioningVendorImplementationFamily(projectRoot)
      .vendorImplementationFamily;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR IMPLEMENTATION FAMILY FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorImplementationFamily.phase !== DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE) {
  issues.push({ code: 'PHASE', message: vendorImplementationFamily.phase });
}
if (vendorImplementationFamily.mode !== 'design_only_vendor_implementation_family') {
  issues.push({ code: 'MODE', message: vendorImplementationFamily.mode });
}
if (vendorImplementationFamily.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorImplementationFamily.target });
}
if (vendorImplementationFamily.family_id !== VENDOR_IMPLEMENTATION_FAMILY_ID) {
  issues.push({ code: 'FAMILY_ID', message: vendorImplementationFamily.family_id });
}
if (vendorImplementationFamily.family_version !== VENDOR_IMPLEMENTATION_FAMILY_VERSION) {
  issues.push({
    code: 'FAMILY_VERSION',
    message: vendorImplementationFamily.family_version,
  });
}
if (vendorImplementationFamily.family_kind !== 'generic_vendor_implementation_family') {
  issues.push({ code: 'FAMILY_KIND', message: vendorImplementationFamily.family_kind });
}
if (
  vendorImplementationFamily.reference_implementation_ref !==
  VENDOR_REFERENCE_IMPLEMENTATION_PATH
) {
  issues.push({
    code: 'REFERENCE_IMPLEMENTATION_REF',
    message: vendorImplementationFamily.reference_implementation_ref,
  });
}
if (
  vendorImplementationFamily.reference_implementation_certification_ref !==
  VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH
) {
  issues.push({
    code: 'REFERENCE_IMPLEMENTATION_CERTIFICATION_REF',
    message: vendorImplementationFamily.reference_implementation_certification_ref,
  });
}
if (vendorImplementationFamily.template_ref !== VENDOR_TEMPLATE_PATH) {
  issues.push({ code: 'TEMPLATE_REF', message: vendorImplementationFamily.template_ref });
}
if (vendorImplementationFamily.profile_ref !== VENDOR_REFERENCE_PROFILE_PATH) {
  issues.push({ code: 'PROFILE_REF', message: vendorImplementationFamily.profile_ref });
}
if (
  vendorImplementationFamily.profile_certification_ref !==
  VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: vendorImplementationFamily.profile_certification_ref,
  });
}
if (
  vendorImplementationFamily.vendor_implementation_spec_ref !==
  VENDOR_IMPLEMENTATION_SPEC_PATH
) {
  issues.push({
    code: 'VENDOR_IMPLEMENTATION_SPEC_REF',
    message: vendorImplementationFamily.vendor_implementation_spec_ref,
  });
}
if (
  vendorImplementationFamily.vendor_execution_contract_ref !==
  VENDOR_EXECUTION_CONTRACT_PATH
) {
  issues.push({
    code: 'VENDOR_EXECUTION_CONTRACT_REF',
    message: vendorImplementationFamily.vendor_execution_contract_ref,
  });
}
if (vendorImplementationFamily.vendor_router_ref !== VENDOR_ROUTER_PATH) {
  issues.push({
    code: 'VENDOR_ROUTER_REF',
    message: vendorImplementationFamily.vendor_router_ref,
  });
}
if (vendorImplementationFamily.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH) {
  issues.push({
    code: 'VENDOR_COMPATIBILITY_REF',
    message: vendorImplementationFamily.vendor_compatibility_ref,
  });
}
if (vendorImplementationFamily.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
  issues.push({
    code: 'VENDOR_REGISTRY_REF',
    message: vendorImplementationFamily.vendor_registry_ref,
  });
}
if (vendorImplementationFamily.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
  issues.push({
    code: 'VENDOR_PROFILE_REF',
    message: vendorImplementationFamily.vendor_profile_ref,
  });
}
if (vendorImplementationFamily.family_ref !== BACKEND_FAMILY_PATH) {
  issues.push({ code: 'FAMILY_REF', message: vendorImplementationFamily.family_ref });
}
if (
  vendorImplementationFamily.family_certification_ref !== BACKEND_FAMILY_CERTIFICATION_PATH
) {
  issues.push({
    code: 'FAMILY_CERTIFICATION_REF',
    message: vendorImplementationFamily.family_certification_ref,
  });
}
if (vendorImplementationFamily.reference_backend_ref !== REFERENCE_BACKEND_PATH) {
  issues.push({
    code: 'REFERENCE_BACKEND_REF',
    message: vendorImplementationFamily.reference_backend_ref,
  });
}
if (
  vendorImplementationFamily.reference_backend_certification_ref !==
  REFERENCE_BACKEND_CERTIFICATION_PATH
) {
  issues.push({
    code: 'REFERENCE_BACKEND_CERTIFICATION_REF',
    message: vendorImplementationFamily.reference_backend_certification_ref,
  });
}
if (vendorImplementationFamily.backend_template_ref !== BACKEND_TEMPLATE_PATH) {
  issues.push({
    code: 'BACKEND_TEMPLATE_REF',
    message: vendorImplementationFamily.backend_template_ref,
  });
}
if (
  vendorImplementationFamily.backend_template_certification_ref !==
  BACKEND_TEMPLATE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_TEMPLATE_CERTIFICATION_REF',
    message: vendorImplementationFamily.backend_template_certification_ref,
  });
}
if (vendorImplementationFamily.backend_profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({
    code: 'BACKEND_PROFILE_REF',
    message: vendorImplementationFamily.backend_profile_ref,
  });
}
if (
  vendorImplementationFamily.backend_profile_certification_ref !==
  BACKEND_PROFILE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_PROFILE_CERTIFICATION_REF',
    message: vendorImplementationFamily.backend_profile_certification_ref,
  });
}
if (
  vendorImplementationFamily.backend_design_certification_ref !==
  BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: vendorImplementationFamily.backend_design_certification_ref,
  });
}
if (vendorImplementationFamily.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: vendorImplementationFamily.implementation_spec_ref,
  });
}
if (vendorImplementationFamily.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: vendorImplementationFamily.execution_contract_ref,
  });
}
if (vendorImplementationFamily.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: vendorImplementationFamily.runtime_router_ref,
  });
}
if (
  vendorImplementationFamily.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH
) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: vendorImplementationFamily.adapter_registration_ref,
  });
}
if (
  vendorImplementationFamily.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH
) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: vendorImplementationFamily.compatibility_engine_ref,
  });
}
if (vendorImplementationFamily.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: vendorImplementationFamily.capability_registry_ref,
  });
}
if (vendorImplementationFamily.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: vendorImplementationFamily.adapter_foundation_ref,
  });
}
if (vendorImplementationFamily.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: vendorImplementationFamily.runtime_interface_ref,
  });
}
if (vendorImplementationFamily.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: vendorImplementationFamily.runtime_package_ref,
  });
}
if (
  JSON.stringify(vendorImplementationFamily.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorImplementationFamily.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorImplementationFamily.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorImplementationFamily.required_channels.join(','),
  });
}
if (vendorImplementationFamily.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({
    code: 'SPATIAL_FRAME',
    message: vendorImplementationFamily.spatial_frame_ref,
  });
}
if (
  vendorImplementationFamily.capability_set_id !== CAPABILITY_SET_ID ||
  vendorImplementationFamily.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorImplementationFamily.capability_set_id}@${vendorImplementationFamily.capability_set_version}`,
  });
}

// 1) Implementation family schema.
const familySchema = vendorImplementationFamily.implementation_family_schema;
if (familySchema.schema_id !== 'dsc-vendor-implementation-family-schema-v1') {
  issues.push({ code: 'FAMILY_SCHEMA_ID', message: familySchema.schema_id });
}
if (
  familySchema.encoding !== 'application/json' ||
  familySchema.family_id_policy !== 'opaque_family_id_no_vendor_binding' ||
  familySchema.reference_implementation_ref !== VENDOR_REFERENCE_IMPLEMENTATION_ID ||
  familySchema.optional_fields.length !== 0 ||
  familySchema.additional_fields
) {
  issues.push({
    code: 'FAMILY_SCHEMA_POLICY',
    message: familySchema.family_id_policy,
  });
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
const identity = vendorImplementationFamily.deterministic_family_identity;
if (identity.identity_id !== 'dsc-vendor-implementation-family-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.family_id !== VENDOR_IMPLEMENTATION_FAMILY_ID ||
  identity.family_version !== VENDOR_IMPLEMENTATION_FAMILY_VERSION ||
  identity.identity_policy !== 'opaque_family_id_no_vendor_binding' ||
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

// 3) Certified Vendor Reference Implementation binding.
const binding = vendorImplementationFamily.reference_implementation_binding;
if (
  binding.binding_id !==
  'dsc-vendor-implementation-family-reference-implementation-binding-v1'
) {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.reference_implementation_ref !== VENDOR_REFERENCE_IMPLEMENTATION_PATH ||
  binding.implementation_id !== VENDOR_REFERENCE_IMPLEMENTATION_ID ||
  binding.implementation_version !== VENDOR_REFERENCE_IMPLEMENTATION_VERSION ||
  binding.reference_implementation_phase !== DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE ||
  binding.reference_implementation_system_id !==
    DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID ||
  binding.reference_implementation_certification_ref !==
    VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'family_archetype' ||
  binding.template_ref !== VENDOR_TEMPLATE_PATH ||
  binding.template_id !== VENDOR_TEMPLATE_ID ||
  binding.profile_ref !== VENDOR_REFERENCE_PROFILE_PATH ||
  binding.profile_id !== VENDOR_REFERENCE_PROFILE_ID ||
  binding.implementation_profile_ref !== 'dsc-vendor-reference-implementation-profile-v1' ||
  binding.instantiates_members_in_this_phase ||
  binding.implements_reference_implementation_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}
if (
  binding.implementation_id !== referenceImplementation.implementation_id ||
  binding.implementation_version !== referenceImplementation.implementation_version
) {
  issues.push({ code: 'BINDING_IDENTITY_DRIFT', message: binding.implementation_id });
}

// 4) Implementation family contract.
const contract = vendorImplementationFamily.implementation_family_contract;
if (contract.contract_id !== 'dsc-vendor-implementation-family-contract-v1') {
  issues.push({ code: 'CONTRACT_ID', message: contract.contract_id });
}
if (
  contract.capability_set_id !== CAPABILITY_SET_ID ||
  contract.capability_set_version !== CAPABILITY_SET_VERSION ||
  contract.vendor_capability_interface_ref !== 'dsc-vendor-capability-interface-v1' ||
  contract.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH ||
  contract.reference_implementation_profile_ref !==
    'dsc-vendor-reference-implementation-profile-v1' ||
  contract.template_skeleton_ref !== 'dsc-vendor-deterministic-implementation-skeleton-v1' ||
  contract.template_extension_points_ref !== 'dsc-vendor-template-extension-points-v1' ||
  contract.template_validation_ref !== 'dsc-vendor-template-validation-template-v1' ||
  contract.spatial_frame_ref !== SPATIAL_FRAME.frame_id ||
  contract.required_sources !== SOURCE_IDS.length ||
  contract.adapted_input_shape_ref !== 'dsc_adapted_conditioning_input_v1' ||
  contract.membership_rule !==
    'every_family_member_must_bind_the_certified_vendor_reference_implementation' ||
  contract.inheritance_rule !==
    'every_family_member_must_satisfy_all_mandatory_capabilities' ||
  contract.aggregation_rule !== 'all_mandatory_capabilities_supported' ||
  contract.determinism_rule !==
    'every_family_member_must_remain_deterministic_and_side_effect_free' ||
  contract.vendor_specific_capabilities !== 'forbidden' ||
  contract.vendor_specific_extensions !== 'forbidden' ||
  contract.undeclared_capability_policy !== 'reject' ||
  contract.requires_gpu ||
  contract.performs_inference ||
  contract.evaluates_members_in_this_phase
) {
  issues.push({ code: 'CONTRACT_POLICY', message: contract.membership_rule });
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

const certifiedCapabilityIds =
  referenceImplementation.reference_implementation_profile.capability_entries.map(
    (entry) => entry.capability_id
  );
const contractCapabilityIds = contract.required_capabilities.map(
  (entry) => entry.capability_id
);
if (JSON.stringify(contractCapabilityIds) !== JSON.stringify(certifiedCapabilityIds)) {
  issues.push({
    code: 'CONTRACT_CAPABILITY_DRIFT',
    message: contractCapabilityIds.join(','),
  });
}
if (new Set(contractCapabilityIds).size !== contractCapabilityIds.length) {
  issues.push({
    code: 'CONTRACT_CAPABILITY_DUPLICATE',
    message: contractCapabilityIds.join(','),
  });
}
for (const entry of contract.required_capabilities) {
  if (
    entry.requirement !== 'mandatory' ||
    entry.inherited_from !== 'dsc-vendor-reference-implementation-profile-v1' ||
    entry.declared_state_required !== 'supported' ||
    !entry.family_member_must_declare
  ) {
    issues.push({ code: 'CONTRACT_CAPABILITY_INCOMPLETE', message: entry.capability_id });
  }
}

const contractMethodIds = contract.required_methods.map((entry) => entry.method_id);
if (JSON.stringify(contractMethodIds) !== JSON.stringify(EXPECTED_METHODS)) {
  issues.push({ code: 'CONTRACT_METHODS', message: contractMethodIds.join(',') });
}
if (
  JSON.stringify(contractMethodIds) !==
  JSON.stringify(referenceImplementation.reference_implementation_profile.methods_required)
) {
  issues.push({ code: 'CONTRACT_METHOD_DRIFT', message: contractMethodIds.join(',') });
}
const contractExtensionPoints = contract.required_methods.map(
  (entry) => entry.extension_point_ref
);
if (JSON.stringify(contractExtensionPoints) !== JSON.stringify(EXPECTED_EXTENSION_POINTS)) {
  issues.push({
    code: 'CONTRACT_EXTENSION_POINTS',
    message: contractExtensionPoints.join(','),
  });
}
const adoptedPointByMethod = new Map(
  referenceImplementation.vendor_template_binding.extension_points_adopted.map((point) => [
    point.target_method_id,
    point.extension_point_id,
  ])
);
for (const entry of contract.required_methods) {
  if (entry.extension_point_ref !== adoptedPointByMethod.get(entry.method_id)) {
    issues.push({ code: 'CONTRACT_EXTENSION_POINT_DRIFT', message: entry.method_id });
  }
  if (
    entry.requirement !== 'mandatory' ||
    entry.inherited_from !== 'dsc-vendor-deterministic-implementation-skeleton-v1' ||
    !entry.family_member_must_implement ||
    entry.implemented_in_this_phase
  ) {
    issues.push({ code: 'CONTRACT_METHOD_INCOMPLETE', message: entry.method_id });
  }
}

// Design only: no family member instantiated in this phase.
const members = vendorImplementationFamily.family_members;
if (
  members.count !== 0 ||
  members.entries.length !== 0 ||
  members.instantiates_members_in_this_phase ||
  !members.membership_policy
) {
  issues.push({ code: 'FAMILY_MEMBERS', message: `${members.count}` });
}

// Design constraints.
const constraints = vendorImplementationFamily.design_constraints;
if (
  !constraints.family_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_reference_implementation ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
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

for (const requiredArtifact of [
  VENDOR_IMPLEMENTATION_FAMILY_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorImplementationFamily);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_implementation_family_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorImplementationFamily.mode,
  family_id: vendorImplementationFamily.family_id,
  family_version: vendorImplementationFamily.family_version,
  family_kind: vendorImplementationFamily.family_kind,
  implementation_family_schema: familySchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_family_identity: identity.identity_id,
  reference_implementation_binding: binding.binding_id,
  implementation_family_contract: contract.contract_id,
  required_capabilities: contractCapabilityIds.length,
  required_methods: contractMethodIds,
  required_extension_points: contractExtensionPoints,
  family_members: members.count,
  sources_supported: vendorImplementationFamily.sources_supported.length,
  reuses_certified_vendor_reference_implementation: true,
  vendor_neutral: true,
  design_constraints: vendorImplementationFamily.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_implementation_family: VENDOR_IMPLEMENTATION_FAMILY_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    reference_implementation: VENDOR_REFERENCE_IMPLEMENTATION_PATH,
    reference_implementation_certification:
      VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
    template: VENDOR_TEMPLATE_PATH,
    profile: VENDOR_REFERENCE_PROFILE_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_FAMILY_VALIDATION_REPORT.json';
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
    `required_capabilities=${report.required_capabilities}`,
    `required_methods=${report.required_methods.length}`,
    `extension_points=${report.required_extension_points.length}`,
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
