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
  VENDOR_REFERENCE_PROFILE_VERSION,
  type DirectSpatialConditioningVendorReferenceProfile,
} from '../services/directSpatialConditioningVendorReferenceProfileBuilder.js';
import { VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorReferenceProfileCertificationBuilder.js';
import {
  DSC_VENDOR_TEMPLATE_PHASE,
  DSC_VENDOR_TEMPLATE_SYSTEM_ID,
  VENDOR_TEMPLATE_ID,
  VENDOR_TEMPLATE_PATH,
  VENDOR_TEMPLATE_VERSION,
  type DirectSpatialConditioningVendorTemplate,
} from '../services/directSpatialConditioningVendorTemplateBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE,
  VENDOR_REFERENCE_IMPLEMENTATION_ID,
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_VERSION,
  VENDOR_TEMPLATE_CERTIFIED_TARGET,
  buildDirectSpatialConditioningVendorReferenceImplementation,
  type DirectSpatialConditioningVendorReferenceImplementation,
} from '../services/directSpatialConditioningVendorReferenceImplementationBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-implementation.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-implementation-implementation-registry-v1.json';

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
  'implementation_id',
  'implementation_version',
  'implementation_kind',
  'template_ref',
  'profile_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_implementation_identity',
  'vendor_template_binding',
  'reference_implementation_profile',
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
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  BACKEND_FAMILY_CERTIFICATION_PATH,
  VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, VENDOR_TEMPLATE_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(`PRECHECK FAILED: missing vendor template ${VENDOR_TEMPLATE_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(projectRoot, VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor reference profile certification ${VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH}`
  );
  process.exit(1);
}

const profileCertification = readJson<{ certified?: boolean }>(
  VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH
);
if (profileCertification.certified !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor reference profile is not certified');
  process.exit(1);
}

const vendorTemplate = readJson<DirectSpatialConditioningVendorTemplate>(
  VENDOR_TEMPLATE_PATH
);
if (vendorTemplate.target !== VENDOR_TEMPLATE_CERTIFIED_TARGET) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor template is not certified with the PASS target');
  process.exit(1);
}

const referenceProfile = readJson<DirectSpatialConditioningVendorReferenceProfile>(
  VENDOR_REFERENCE_PROFILE_PATH
);

let referenceImplementation: DirectSpatialConditioningVendorReferenceImplementation;
try {
  referenceImplementation =
    buildDirectSpatialConditioningVendorReferenceImplementation(projectRoot)
      .vendorReferenceImplementation;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR REFERENCE IMPLEMENTATION FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (referenceImplementation.phase !== DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE) {
  issues.push({ code: 'PHASE', message: referenceImplementation.phase });
}
if (referenceImplementation.mode !== 'design_only_vendor_reference_implementation') {
  issues.push({ code: 'MODE', message: referenceImplementation.mode });
}
if (referenceImplementation.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: referenceImplementation.target });
}
if (referenceImplementation.implementation_id !== VENDOR_REFERENCE_IMPLEMENTATION_ID) {
  issues.push({
    code: 'IMPLEMENTATION_ID',
    message: referenceImplementation.implementation_id,
  });
}
if (
  referenceImplementation.implementation_version !== VENDOR_REFERENCE_IMPLEMENTATION_VERSION
) {
  issues.push({
    code: 'IMPLEMENTATION_VERSION',
    message: referenceImplementation.implementation_version,
  });
}
if (referenceImplementation.implementation_kind !== 'reference_vendor_implementation') {
  issues.push({
    code: 'IMPLEMENTATION_KIND',
    message: referenceImplementation.implementation_kind,
  });
}
if (referenceImplementation.template_ref !== VENDOR_TEMPLATE_PATH) {
  issues.push({ code: 'TEMPLATE_REF', message: referenceImplementation.template_ref });
}
if (referenceImplementation.template_certified_target !== VENDOR_TEMPLATE_CERTIFIED_TARGET) {
  issues.push({
    code: 'TEMPLATE_CERTIFIED_TARGET',
    message: referenceImplementation.template_certified_target,
  });
}
if (referenceImplementation.profile_ref !== VENDOR_REFERENCE_PROFILE_PATH) {
  issues.push({ code: 'PROFILE_REF', message: referenceImplementation.profile_ref });
}
if (
  referenceImplementation.profile_certification_ref !==
  VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: referenceImplementation.profile_certification_ref,
  });
}
if (
  referenceImplementation.vendor_implementation_spec_ref !== VENDOR_IMPLEMENTATION_SPEC_PATH
) {
  issues.push({
    code: 'VENDOR_IMPLEMENTATION_SPEC_REF',
    message: referenceImplementation.vendor_implementation_spec_ref,
  });
}
if (
  referenceImplementation.vendor_execution_contract_ref !== VENDOR_EXECUTION_CONTRACT_PATH
) {
  issues.push({
    code: 'VENDOR_EXECUTION_CONTRACT_REF',
    message: referenceImplementation.vendor_execution_contract_ref,
  });
}
if (referenceImplementation.vendor_router_ref !== VENDOR_ROUTER_PATH) {
  issues.push({
    code: 'VENDOR_ROUTER_REF',
    message: referenceImplementation.vendor_router_ref,
  });
}
if (referenceImplementation.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH) {
  issues.push({
    code: 'VENDOR_COMPATIBILITY_REF',
    message: referenceImplementation.vendor_compatibility_ref,
  });
}
if (referenceImplementation.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
  issues.push({
    code: 'VENDOR_REGISTRY_REF',
    message: referenceImplementation.vendor_registry_ref,
  });
}
if (referenceImplementation.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
  issues.push({
    code: 'VENDOR_PROFILE_REF',
    message: referenceImplementation.vendor_profile_ref,
  });
}
if (referenceImplementation.family_ref !== BACKEND_FAMILY_PATH) {
  issues.push({ code: 'FAMILY_REF', message: referenceImplementation.family_ref });
}
if (referenceImplementation.family_certification_ref !== BACKEND_FAMILY_CERTIFICATION_PATH) {
  issues.push({
    code: 'FAMILY_CERTIFICATION_REF',
    message: referenceImplementation.family_certification_ref,
  });
}
if (referenceImplementation.reference_backend_ref !== REFERENCE_BACKEND_PATH) {
  issues.push({
    code: 'REFERENCE_BACKEND_REF',
    message: referenceImplementation.reference_backend_ref,
  });
}
if (
  referenceImplementation.reference_backend_certification_ref !==
  REFERENCE_BACKEND_CERTIFICATION_PATH
) {
  issues.push({
    code: 'REFERENCE_BACKEND_CERTIFICATION_REF',
    message: referenceImplementation.reference_backend_certification_ref,
  });
}
if (referenceImplementation.backend_template_ref !== BACKEND_TEMPLATE_PATH) {
  issues.push({
    code: 'BACKEND_TEMPLATE_REF',
    message: referenceImplementation.backend_template_ref,
  });
}
if (
  referenceImplementation.backend_template_certification_ref !==
  BACKEND_TEMPLATE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_TEMPLATE_CERTIFICATION_REF',
    message: referenceImplementation.backend_template_certification_ref,
  });
}
if (referenceImplementation.backend_profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({
    code: 'BACKEND_PROFILE_REF',
    message: referenceImplementation.backend_profile_ref,
  });
}
if (
  referenceImplementation.backend_profile_certification_ref !==
  BACKEND_PROFILE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_PROFILE_CERTIFICATION_REF',
    message: referenceImplementation.backend_profile_certification_ref,
  });
}
if (
  referenceImplementation.backend_design_certification_ref !==
  BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: referenceImplementation.backend_design_certification_ref,
  });
}
if (referenceImplementation.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: referenceImplementation.implementation_spec_ref,
  });
}
if (referenceImplementation.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: referenceImplementation.execution_contract_ref,
  });
}
if (referenceImplementation.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: referenceImplementation.runtime_router_ref,
  });
}
if (referenceImplementation.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: referenceImplementation.adapter_registration_ref,
  });
}
if (referenceImplementation.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: referenceImplementation.compatibility_engine_ref,
  });
}
if (referenceImplementation.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: referenceImplementation.capability_registry_ref,
  });
}
if (referenceImplementation.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: referenceImplementation.adapter_foundation_ref,
  });
}
if (referenceImplementation.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: referenceImplementation.runtime_interface_ref,
  });
}
if (referenceImplementation.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: referenceImplementation.runtime_package_ref,
  });
}
if (
  JSON.stringify(referenceImplementation.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${referenceImplementation.sources_supported.length}`,
  });
}
if (
  JSON.stringify(referenceImplementation.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: referenceImplementation.required_channels.join(','),
  });
}
if (referenceImplementation.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: referenceImplementation.spatial_frame_ref });
}
if (
  referenceImplementation.capability_set_id !== CAPABILITY_SET_ID ||
  referenceImplementation.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${referenceImplementation.capability_set_id}@${referenceImplementation.capability_set_version}`,
  });
}

// 1) Reference implementation schema.
const implementationSchema = referenceImplementation.reference_implementation_schema;
if (implementationSchema.schema_id !== 'dsc-vendor-reference-implementation-schema-v1') {
  issues.push({ code: 'IMPLEMENTATION_SCHEMA_ID', message: implementationSchema.schema_id });
}
if (
  implementationSchema.encoding !== 'application/json' ||
  implementationSchema.implementation_id_policy !==
    'opaque_implementation_id_no_vendor_binding' ||
  implementationSchema.template_ref !== VENDOR_TEMPLATE_ID ||
  implementationSchema.profile_ref !== VENDOR_REFERENCE_PROFILE_ID ||
  implementationSchema.optional_fields.length !== 0 ||
  implementationSchema.additional_fields
) {
  issues.push({
    code: 'IMPLEMENTATION_SCHEMA_POLICY',
    message: implementationSchema.implementation_id_policy,
  });
}
const schemaFields = implementationSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'IMPLEMENTATION_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of implementationSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'IMPLEMENTATION_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic implementation identity.
const identity = referenceImplementation.deterministic_implementation_identity;
if (
  identity.identity_id !== 'dsc-vendor-reference-implementation-deterministic-identity-v1'
) {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.implementation_id !== VENDOR_REFERENCE_IMPLEMENTATION_ID ||
  identity.implementation_version !== VENDOR_REFERENCE_IMPLEMENTATION_VERSION ||
  identity.identity_policy !== 'opaque_implementation_id_no_vendor_binding' ||
  identity.derivation !== 'literal_constant_declared_at_design_time' ||
  identity.purity !== 'deterministic_pure_constant' ||
  identity.seed_dependence !== 'none' ||
  identity.time_dependence !== 'none' ||
  identity.randomness !== 'none' ||
  identity.vendor_binding !== 'none' ||
  identity.framework_binding !== 'none' ||
  identity.device_binding !== 'none' ||
  identity.vendor_name !== 'none' ||
  identity.vendor_interface_version !== 'v1' ||
  identity.declared_spatial_frame !== SPATIAL_FRAME.frame_id ||
  identity.declared_adapted_input_shape !== 'dsc_adapted_conditioning_input_v1'
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
  JSON.stringify(identity.declared_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'IDENTITY_CHANNELS',
    message: identity.declared_channels.join(','),
  });
}

// 3) Certified Vendor Template binding.
const templateBinding = referenceImplementation.vendor_template_binding;
if (
  templateBinding.binding_id !== 'dsc-vendor-reference-implementation-template-binding-v1'
) {
  issues.push({ code: 'TEMPLATE_BINDING_ID', message: templateBinding.binding_id });
}
if (
  templateBinding.template_ref !== VENDOR_TEMPLATE_PATH ||
  templateBinding.template_id !== VENDOR_TEMPLATE_ID ||
  templateBinding.template_version !== VENDOR_TEMPLATE_VERSION ||
  templateBinding.template_phase !== DSC_VENDOR_TEMPLATE_PHASE ||
  templateBinding.template_system_id !== DSC_VENDOR_TEMPLATE_SYSTEM_ID ||
  templateBinding.certified_target !== VENDOR_TEMPLATE_CERTIFIED_TARGET ||
  templateBinding.binding_mode !== 'exact_reuse' ||
  templateBinding.skeleton_ref !== 'dsc-vendor-deterministic-implementation-skeleton-v1' ||
  templateBinding.extension_points_ref !== 'dsc-vendor-template-extension-points-v1' ||
  templateBinding.validation_template_ref !== 'dsc-vendor-template-validation-template-v1' ||
  templateBinding.fills_extension_points_in_this_phase ||
  templateBinding.implements_skeleton_in_this_phase
) {
  issues.push({ code: 'TEMPLATE_BINDING_POLICY', message: templateBinding.binding_mode });
}
const adoptedPointIds = templateBinding.extension_points_adopted.map(
  (point) => point.extension_point_id
);
if (JSON.stringify(adoptedPointIds) !== JSON.stringify(EXPECTED_EXTENSION_POINTS)) {
  issues.push({ code: 'TEMPLATE_BINDING_POINTS', message: adoptedPointIds.join(',') });
}
const templatePointIds = vendorTemplate.extension_points.points.map(
  (point) => point.extension_point_id
);
if (JSON.stringify(adoptedPointIds) !== JSON.stringify(templatePointIds)) {
  issues.push({ code: 'TEMPLATE_BINDING_POINT_DRIFT', message: adoptedPointIds.join(',') });
}
for (const point of templateBinding.extension_points_adopted) {
  if (!point.adopted || point.filled_in_this_phase || !point.target_method_id) {
    issues.push({ code: 'TEMPLATE_BINDING_POINT_INCOMPLETE', message: point.extension_point_id });
  }
}

// 4) Reference implementation profile.
const implementationProfile = referenceImplementation.reference_implementation_profile;
if (
  implementationProfile.implementation_profile_id !==
  'dsc-vendor-reference-implementation-profile-v1'
) {
  issues.push({
    code: 'IMPLEMENTATION_PROFILE_ID',
    message: implementationProfile.implementation_profile_id,
  });
}
if (
  implementationProfile.vendor_reference_profile_ref !== VENDOR_REFERENCE_PROFILE_PATH ||
  implementationProfile.vendor_reference_profile_id !== VENDOR_REFERENCE_PROFILE_ID ||
  implementationProfile.vendor_reference_profile_version !==
    VENDOR_REFERENCE_PROFILE_VERSION ||
  implementationProfile.profile_certification_ref !==
    VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH ||
  implementationProfile.capability_profile_ref !==
    'dsc-vendor-reference-capability-profile-v1' ||
  implementationProfile.binding_mode !== 'exact_reuse' ||
  implementationProfile.purity !== 'deterministic_pure_function_per_step' ||
  implementationProfile.seed_dependence !== 'none' ||
  implementationProfile.time_dependence !== 'none' ||
  implementationProfile.randomness !== 'none' ||
  implementationProfile.step_order !== 'fixed_declared_order' ||
  !implementationProfile.inherits_capability_declarations ||
  implementationProfile.undeclared_capability_policy !== 'reject' ||
  implementationProfile.vendor_specific_extensions !== 'forbidden' ||
  implementationProfile.requires_gpu ||
  implementationProfile.performs_inference ||
  implementationProfile.implements_methods_in_this_phase
) {
  issues.push({
    code: 'IMPLEMENTATION_PROFILE_POLICY',
    message: implementationProfile.binding_mode,
  });
}
if (
  implementationProfile.capability_set_id !== CAPABILITY_SET_ID ||
  implementationProfile.capability_set_version !== CAPABILITY_SET_VERSION ||
  implementationProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id
) {
  issues.push({
    code: 'IMPLEMENTATION_PROFILE_CAPABILITY_SET',
    message: implementationProfile.capability_set_id,
  });
}
if (
  JSON.stringify(implementationProfile.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'IMPLEMENTATION_PROFILE_CHANNELS',
    message: implementationProfile.required_channels.join(','),
  });
}

const profileStepMethods = implementationProfile.steps.map((step) => step.method_id);
if (JSON.stringify(profileStepMethods) !== JSON.stringify(EXPECTED_METHODS)) {
  issues.push({ code: 'PROFILE_STEP_METHODS', message: profileStepMethods.join(',') });
}
const templateSteps = vendorTemplate.deterministic_implementation_skeleton.steps;
if (
  JSON.stringify(profileStepMethods) !==
  JSON.stringify(templateSteps.map((step) => step.method_id))
) {
  issues.push({ code: 'PROFILE_STEP_DRIFT', message: profileStepMethods.join(',') });
}
const templateSignatures = new Map(
  templateSteps.map((step) => [step.method_id, step.signature])
);
const templateStepPoints = new Map(
  templateSteps.map((step) => [step.method_id, step.extension_point_ref])
);
implementationProfile.steps.forEach((step, index) => {
  if (step.order !== index + 1) {
    issues.push({ code: 'PROFILE_STEP_ORDER', message: step.step_id });
  }
  if (step.signature !== templateSignatures.get(step.method_id)) {
    issues.push({ code: 'PROFILE_SIGNATURE_DRIFT', message: step.method_id });
  }
  if (step.extension_point_ref !== templateStepPoints.get(step.method_id)) {
    issues.push({ code: 'PROFILE_EXTENSION_POINT_DRIFT', message: step.method_id });
  }
  if (
    step.coverage_state !== 'declared_not_implemented' ||
    step.side_effects !== 'none' ||
    !step.deterministic ||
    step.requires_gpu ||
    step.performs_inference ||
    step.implemented_in_this_phase
  ) {
    issues.push({ code: 'PROFILE_STEP_INCOMPLETE', message: step.step_id });
  }
});

const certifiedCapabilityIds =
  referenceProfile.reference_vendor_capability_profile.entries.map(
    (entry) => entry.capability_id
  );
const profileCapabilityIds = implementationProfile.capability_entries.map(
  (entry) => entry.capability_id
);
if (JSON.stringify(profileCapabilityIds) !== JSON.stringify(certifiedCapabilityIds)) {
  issues.push({
    code: 'PROFILE_CAPABILITY_DRIFT',
    message: profileCapabilityIds.join(','),
  });
}
for (const entry of implementationProfile.capability_entries) {
  if (
    entry.declared_state !== 'supported' ||
    entry.inherited_from !== VENDOR_REFERENCE_PROFILE_ID ||
    !entry.source_ref ||
    !entry.deterministic ||
    entry.implemented_in_this_phase
  ) {
    issues.push({ code: 'PROFILE_CAPABILITY_INCOMPLETE', message: entry.capability_id });
  }
}
if (JSON.stringify(implementationProfile.methods_required) !== JSON.stringify(EXPECTED_METHODS)) {
  issues.push({
    code: 'PROFILE_METHODS_REQUIRED',
    message: implementationProfile.methods_required.join(','),
  });
}

// Read-only: no vendor implemented in this phase.
const implemented = referenceImplementation.implemented_vendors;
if (
  implemented.count !== 0 ||
  implemented.entries.length !== 0 ||
  implemented.implements_vendors_in_this_phase ||
  !implemented.implementation_policy
) {
  issues.push({ code: 'IMPLEMENTED_VENDORS', message: `${implemented.count}` });
}

// Design constraints.
const constraints = referenceImplementation.design_constraints;
if (
  !constraints.reference_implementation_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_template ||
  !constraints.reuses_certified_vendor_reference_profile ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.implements_vendors_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(referenceImplementation);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_reference_implementation_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: referenceImplementation.mode,
  implementation_id: referenceImplementation.implementation_id,
  implementation_version: referenceImplementation.implementation_version,
  implementation_kind: referenceImplementation.implementation_kind,
  reference_implementation_schema: implementationSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_implementation_identity: identity.identity_id,
  vendor_template_binding: templateBinding.binding_id,
  extension_points_adopted: adoptedPointIds,
  reference_implementation_profile: implementationProfile.implementation_profile_id,
  profile_steps: implementationProfile.steps.length,
  capability_entries: implementationProfile.capability_entries.length,
  methods_required: implementationProfile.methods_required,
  implemented_vendors: implemented.count,
  sources_supported: referenceImplementation.sources_supported.length,
  reuses_certified_vendor_template: true,
  reuses_certified_vendor_reference_profile: true,
  vendor_neutral: true,
  design_constraints: referenceImplementation.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_reference_implementation: VENDOR_REFERENCE_IMPLEMENTATION_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    template: VENDOR_TEMPLATE_PATH,
    profile: VENDOR_REFERENCE_PROFILE_PATH,
    profile_certification: VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_VALIDATION_REPORT.json';
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
    `implementation_id=${report.implementation_id}`,
    `schema_fields=${report.schema_fields}`,
    `extension_points=${report.extension_points_adopted.length}`,
    `profile_steps=${report.profile_steps}`,
    `capability_entries=${report.capability_entries}`,
    `implemented_vendors=${report.implemented_vendors}`,
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
