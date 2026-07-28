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
import { VENDOR_REFERENCE_PROFILE_PATH } from '../services/directSpatialConditioningVendorReferenceProfileBuilder.js';
import { VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorReferenceProfileCertificationBuilder.js';
import { VENDOR_TEMPLATE_PATH } from '../services/directSpatialConditioningVendorTemplateBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_PATH } from '../services/directSpatialConditioningVendorReferenceImplementationBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorReferenceImplementationCertificationBuilder.js';
import { VENDOR_IMPLEMENTATION_FAMILY_PATH } from '../services/directSpatialConditioningVendorImplementationFamilyBuilder.js';
import { VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorImplementationFamilyCertificationBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE,
  DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_PROFILE_ID,
  VENDOR_IMPLEMENTATION_PROFILE_PATH,
  VENDOR_IMPLEMENTATION_PROFILE_VERSION,
  type DirectSpatialConditioningVendorImplementationProfile,
} from '../services/directSpatialConditioningVendorImplementationProfileBuilder.js';
import { VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorImplementationProfileCertificationBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE,
  VENDOR_IMPLEMENTATION_TEMPLATE_ID,
  VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
  VENDOR_IMPLEMENTATION_TEMPLATE_VERSION,
  buildDirectSpatialConditioningVendorImplementationTemplate,
  type DirectSpatialConditioningVendorImplementationTemplate,
} from '../services/directSpatialConditioningVendorImplementationTemplateBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-implementation-template.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-implementation-template-implementation-registry-v1.json';

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
  'template_id',
  'template_version',
  'template_kind',
  'implementation_profile_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_template_identity',
  'vendor_implementation_profile_binding',
  'deterministic_implementation_skeleton',
  'extension_points',
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
  VENDOR_IMPLEMENTATION_PROFILE_PATH,
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  BACKEND_FAMILY_CERTIFICATION_PATH,
  VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
  VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, VENDOR_IMPLEMENTATION_PROFILE_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor implementation profile ${VENDOR_IMPLEMENTATION_PROFILE_PATH}`
  );
  process.exit(1);
}
if (
  !fs.existsSync(path.join(projectRoot, VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH))
) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor implementation profile certification ${VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH}`
  );
  process.exit(1);
}

const profileCertification = readJson<{
  certified?: boolean;
  certified_system?: string;
}>(VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH);
if (profileCertification.certified !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor implementation profile is not certified');
  process.exit(1);
}
if (
  profileCertification.certified_system !== DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID
) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: certification does not cover the vendor implementation profile'
  );
  process.exit(1);
}

const implementationProfile =
  readJson<DirectSpatialConditioningVendorImplementationProfile>(
    VENDOR_IMPLEMENTATION_PROFILE_PATH
  );

let vendorImplementationTemplate: DirectSpatialConditioningVendorImplementationTemplate;
try {
  vendorImplementationTemplate =
    buildDirectSpatialConditioningVendorImplementationTemplate(projectRoot)
      .vendorImplementationTemplate;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR IMPLEMENTATION TEMPLATE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorImplementationTemplate.phase !== DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE) {
  issues.push({ code: 'PHASE', message: vendorImplementationTemplate.phase });
}
if (vendorImplementationTemplate.mode !== 'design_only_vendor_implementation_template') {
  issues.push({ code: 'MODE', message: vendorImplementationTemplate.mode });
}
if (vendorImplementationTemplate.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorImplementationTemplate.target });
}
if (vendorImplementationTemplate.template_id !== VENDOR_IMPLEMENTATION_TEMPLATE_ID) {
  issues.push({ code: 'TEMPLATE_ID', message: vendorImplementationTemplate.template_id });
}
if (
  vendorImplementationTemplate.template_version !== VENDOR_IMPLEMENTATION_TEMPLATE_VERSION
) {
  issues.push({
    code: 'TEMPLATE_VERSION',
    message: vendorImplementationTemplate.template_version,
  });
}
if (
  vendorImplementationTemplate.template_kind !== 'generic_vendor_implementation_template'
) {
  issues.push({
    code: 'TEMPLATE_KIND',
    message: vendorImplementationTemplate.template_kind,
  });
}

const refChecks: Array<[string, string, string]> = [
  [
    'implementation_profile_ref',
    vendorImplementationTemplate.implementation_profile_ref,
    VENDOR_IMPLEMENTATION_PROFILE_PATH,
  ],
  [
    'implementation_profile_certification_ref',
    vendorImplementationTemplate.implementation_profile_certification_ref,
    VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
  ],
  [
    'family_ref',
    vendorImplementationTemplate.family_ref,
    VENDOR_IMPLEMENTATION_FAMILY_PATH,
  ],
  [
    'family_certification_ref',
    vendorImplementationTemplate.family_certification_ref,
    VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
  ],
  [
    'reference_implementation_ref',
    vendorImplementationTemplate.reference_implementation_ref,
    VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  ],
  [
    'reference_implementation_certification_ref',
    vendorImplementationTemplate.reference_implementation_certification_ref,
    VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
  ],
  [
    'vendor_template_ref',
    vendorImplementationTemplate.vendor_template_ref,
    VENDOR_TEMPLATE_PATH,
  ],
  [
    'vendor_reference_profile_ref',
    vendorImplementationTemplate.vendor_reference_profile_ref,
    VENDOR_REFERENCE_PROFILE_PATH,
  ],
  [
    'vendor_reference_profile_certification_ref',
    vendorImplementationTemplate.vendor_reference_profile_certification_ref,
    VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
  ],
  [
    'vendor_implementation_spec_ref',
    vendorImplementationTemplate.vendor_implementation_spec_ref,
    VENDOR_IMPLEMENTATION_SPEC_PATH,
  ],
  [
    'vendor_execution_contract_ref',
    vendorImplementationTemplate.vendor_execution_contract_ref,
    VENDOR_EXECUTION_CONTRACT_PATH,
  ],
  [
    'vendor_router_ref',
    vendorImplementationTemplate.vendor_router_ref,
    VENDOR_ROUTER_PATH,
  ],
  [
    'vendor_compatibility_ref',
    vendorImplementationTemplate.vendor_compatibility_ref,
    VENDOR_COMPATIBILITY_PATH,
  ],
  [
    'vendor_registry_ref',
    vendorImplementationTemplate.vendor_registry_ref,
    VENDOR_REGISTRY_PATH,
  ],
  [
    'vendor_profile_ref',
    vendorImplementationTemplate.vendor_profile_ref,
    VENDOR_PROFILE_PATH,
  ],
  [
    'backend_family_ref',
    vendorImplementationTemplate.backend_family_ref,
    BACKEND_FAMILY_PATH,
  ],
  [
    'backend_family_certification_ref',
    vendorImplementationTemplate.backend_family_certification_ref,
    BACKEND_FAMILY_CERTIFICATION_PATH,
  ],
  [
    'reference_backend_ref',
    vendorImplementationTemplate.reference_backend_ref,
    REFERENCE_BACKEND_PATH,
  ],
  [
    'reference_backend_certification_ref',
    vendorImplementationTemplate.reference_backend_certification_ref,
    REFERENCE_BACKEND_CERTIFICATION_PATH,
  ],
  [
    'backend_template_ref',
    vendorImplementationTemplate.backend_template_ref,
    BACKEND_TEMPLATE_PATH,
  ],
  [
    'backend_template_certification_ref',
    vendorImplementationTemplate.backend_template_certification_ref,
    BACKEND_TEMPLATE_CERTIFICATION_PATH,
  ],
  [
    'backend_profile_ref',
    vendorImplementationTemplate.backend_profile_ref,
    BACKEND_PROFILE_PATH,
  ],
  [
    'backend_profile_certification_ref',
    vendorImplementationTemplate.backend_profile_certification_ref,
    BACKEND_PROFILE_CERTIFICATION_PATH,
  ],
  [
    'backend_design_certification_ref',
    vendorImplementationTemplate.backend_design_certification_ref,
    BACKEND_DESIGN_CERTIFICATION_PATH,
  ],
  [
    'implementation_spec_ref',
    vendorImplementationTemplate.implementation_spec_ref,
    BACKEND_IMPLEMENTATION_SPEC_PATH,
  ],
  [
    'execution_contract_ref',
    vendorImplementationTemplate.execution_contract_ref,
    BACKEND_EXECUTION_CONTRACT_PATH,
  ],
  [
    'runtime_router_ref',
    vendorImplementationTemplate.runtime_router_ref,
    BACKEND_RUNTIME_ROUTER_PATH,
  ],
  [
    'adapter_registration_ref',
    vendorImplementationTemplate.adapter_registration_ref,
    BACKEND_ADAPTER_REGISTRATION_PATH,
  ],
  [
    'compatibility_engine_ref',
    vendorImplementationTemplate.compatibility_engine_ref,
    BACKEND_COMPATIBILITY_ENGINE_PATH,
  ],
  [
    'capability_registry_ref',
    vendorImplementationTemplate.capability_registry_ref,
    BACKEND_CAPABILITY_REGISTRY_PATH,
  ],
  [
    'adapter_foundation_ref',
    vendorImplementationTemplate.adapter_foundation_ref,
    BACKEND_ADAPTER_FOUNDATION_PATH,
  ],
  [
    'runtime_interface_ref',
    vendorImplementationTemplate.runtime_interface_ref,
    RUNTIME_INTERFACE_PATH,
  ],
  [
    'runtime_package_ref',
    vendorImplementationTemplate.runtime_package_ref,
    RUNTIME_PACKAGE_PATH,
  ],
];
for (const [code, actual, expected] of refChecks) {
  if (actual !== expected) {
    issues.push({ code: `REF_${code.toUpperCase()}`, message: actual });
  }
  if (!fs.existsSync(path.join(projectRoot, expected))) {
    issues.push({ code: `UNRESOLVED_${code.toUpperCase()}`, message: expected });
  }
}

if (
  JSON.stringify(vendorImplementationTemplate.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorImplementationTemplate.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorImplementationTemplate.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorImplementationTemplate.required_channels.join(','),
  });
}
if (vendorImplementationTemplate.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({
    code: 'SPATIAL_FRAME',
    message: vendorImplementationTemplate.spatial_frame_ref,
  });
}
if (
  vendorImplementationTemplate.capability_set_id !== CAPABILITY_SET_ID ||
  vendorImplementationTemplate.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorImplementationTemplate.capability_set_id}@${vendorImplementationTemplate.capability_set_version}`,
  });
}

// 1) Implementation template schema.
const templateSchema = vendorImplementationTemplate.implementation_template_schema;
if (templateSchema.schema_id !== 'dsc-vendor-implementation-template-schema-v1') {
  issues.push({ code: 'TEMPLATE_SCHEMA_ID', message: templateSchema.schema_id });
}
if (
  templateSchema.encoding !== 'application/json' ||
  templateSchema.template_id_policy !== 'opaque_template_id_no_vendor_binding' ||
  templateSchema.profile_ref !== VENDOR_IMPLEMENTATION_PROFILE_ID ||
  templateSchema.optional_fields.length !== 0 ||
  templateSchema.additional_fields
) {
  issues.push({
    code: 'TEMPLATE_SCHEMA_POLICY',
    message: templateSchema.template_id_policy,
  });
}
const schemaFields = templateSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'TEMPLATE_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of templateSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'TEMPLATE_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic template identity.
const identity = vendorImplementationTemplate.deterministic_template_identity;
if (
  identity.identity_id !==
  'dsc-vendor-implementation-template-deterministic-identity-v1'
) {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.template_id !== VENDOR_IMPLEMENTATION_TEMPLATE_ID ||
  identity.template_version !== VENDOR_IMPLEMENTATION_TEMPLATE_VERSION ||
  identity.identity_policy !== 'opaque_template_id_no_vendor_binding' ||
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

// 3) Certified Vendor Implementation Profile binding.
const binding = vendorImplementationTemplate.vendor_implementation_profile_binding;
if (binding.binding_id !== 'dsc-vendor-implementation-template-profile-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.profile_ref !== VENDOR_IMPLEMENTATION_PROFILE_PATH ||
  binding.profile_id !== VENDOR_IMPLEMENTATION_PROFILE_ID ||
  binding.profile_version !== VENDOR_IMPLEMENTATION_PROFILE_VERSION ||
  binding.profile_phase !== DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE ||
  binding.profile_system_id !== DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID ||
  binding.profile_certification_ref !== VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'implementation_conformance_template' ||
  binding.capability_profile_ref !== 'dsc-vendor-implementation-capability-profile-v1' ||
  binding.family_ref !== VENDOR_IMPLEMENTATION_FAMILY_PATH ||
  binding.family_certification_ref !== VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH ||
  binding.fills_extension_points_in_this_phase ||
  binding.implements_skeleton_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}
if (
  binding.profile_id !== implementationProfile.profile_id ||
  binding.profile_version !== implementationProfile.profile_version
) {
  issues.push({ code: 'BINDING_PROFILE_DRIFT', message: binding.profile_id });
}

// 4) Deterministic implementation skeleton.
const skeleton = vendorImplementationTemplate.deterministic_implementation_skeleton;
if (skeleton.skeleton_id !== 'dsc-vendor-implementation-deterministic-skeleton-v1') {
  issues.push({ code: 'SKELETON_ID', message: skeleton.skeleton_id });
}
if (
  skeleton.capability_profile_ref !== 'dsc-vendor-implementation-capability-profile-v1' ||
  skeleton.vendor_capability_interface_ref !== 'dsc-vendor-capability-interface-v1' ||
  skeleton.purity !== 'deterministic_pure_function_per_step' ||
  skeleton.seed_dependence !== 'none' ||
  skeleton.time_dependence !== 'none' ||
  skeleton.randomness !== 'none' ||
  skeleton.step_order !== 'fixed_declared_order' ||
  !skeleton.same_inputs_same_outcome ||
  skeleton.requires_gpu ||
  skeleton.performs_inference ||
  skeleton.implements_steps_in_this_phase
) {
  issues.push({ code: 'SKELETON_POLICY', message: skeleton.purity });
}
const stepMethods = skeleton.steps.map((step) => step.method_id);
if (JSON.stringify(stepMethods) !== JSON.stringify(EXPECTED_METHODS)) {
  issues.push({ code: 'SKELETON_METHODS', message: stepMethods.join(',') });
}
const capabilityMethods =
  implementationProfile.implementation_capability_profile.methods_required;
if (JSON.stringify(stepMethods) !== JSON.stringify(capabilityMethods)) {
  issues.push({ code: 'SKELETON_METHOD_DRIFT', message: stepMethods.join(',') });
}
const capabilityPointByMethod = new Map(
  implementationProfile.implementation_capability_profile.method_entries.map((entry) => [
    entry.method_id,
    entry.extension_point_ref,
  ])
);
skeleton.steps.forEach((step, index) => {
  if (step.order !== index + 1) {
    issues.push({ code: 'SKELETON_STEP_ORDER', message: step.step_id });
  }
  if (step.extension_point_ref !== capabilityPointByMethod.get(step.method_id)) {
    issues.push({ code: 'SKELETON_EXTENSION_POINT_DRIFT', message: step.method_id });
  }
  if (
    step.side_effects !== 'none' ||
    !step.deterministic ||
    step.inherited_from !== 'dsc-vendor-implementation-capability-profile-v1' ||
    step.implemented_in_this_phase ||
    !step.signature ||
    step.reads.length === 0 ||
    !step.emits
  ) {
    issues.push({ code: 'SKELETON_STEP_INCOMPLETE', message: step.step_id });
  }
});

// 5) Extension points.
const extensionPoints = vendorImplementationTemplate.extension_points;
if (
  extensionPoints.extension_points_id !==
  'dsc-vendor-implementation-template-extension-points-v1'
) {
  issues.push({
    code: 'EXTENSION_POINTS_ID',
    message: extensionPoints.extension_points_id,
  });
}
if (
  !extensionPoints.closed_set ||
  extensionPoints.unknown_extension_policy !== 'reject_undeclared_extension_point' ||
  extensionPoints.fills_extension_points_in_this_phase
) {
  issues.push({
    code: 'EXTENSION_POINTS_POLICY',
    message: extensionPoints.unknown_extension_policy,
  });
}
const pointIds = extensionPoints.points.map((point) => point.extension_point_id);
if (JSON.stringify(pointIds) !== JSON.stringify(EXPECTED_EXTENSION_POINTS)) {
  issues.push({ code: 'EXTENSION_POINTS', message: pointIds.join(',') });
}
const targetMethods = extensionPoints.points.map((point) => point.target_method_id);
if (JSON.stringify(targetMethods) !== JSON.stringify(EXPECTED_METHODS)) {
  issues.push({ code: 'EXTENSION_POINT_METHODS', message: targetMethods.join(',') });
}
for (const point of extensionPoints.points) {
  if (point.extension_point_id !== capabilityPointByMethod.get(point.target_method_id)) {
    issues.push({
      code: 'EXTENSION_POINT_PROFILE_DRIFT',
      message: point.target_method_id,
    });
  }
  if (
    point.inherited_from !== 'dsc-vendor-implementation-capability-profile-v1' ||
    !point.must_remain_deterministic ||
    point.may_require_gpu ||
    point.may_perform_inference ||
    point.may_modify_certified_artifacts ||
    point.filled_in_this_phase ||
    !point.contract ||
    !point.category
  ) {
    issues.push({ code: 'EXTENSION_POINT_INCOMPLETE', message: point.extension_point_id });
  }
}

// Design only: no implementation templated in this phase.
const templated = vendorImplementationTemplate.templated_implementations;
if (
  templated.count !== 0 ||
  templated.entries.length !== 0 ||
  templated.templates_implementations_in_this_phase ||
  !templated.templating_policy
) {
  issues.push({ code: 'TEMPLATED_IMPLEMENTATIONS', message: `${templated.count}` });
}

// Design constraints.
const constraints = vendorImplementationTemplate.design_constraints;
if (
  !constraints.template_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_implementation_profile ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.templates_implementations_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [
  VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorImplementationTemplate);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_implementation_template_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorImplementationTemplate.mode,
  template_id: vendorImplementationTemplate.template_id,
  template_version: vendorImplementationTemplate.template_version,
  template_kind: vendorImplementationTemplate.template_kind,
  implementation_template_schema: templateSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_template_identity: identity.identity_id,
  vendor_implementation_profile_binding: binding.binding_id,
  deterministic_implementation_skeleton: skeleton.skeleton_id,
  skeleton_steps: skeleton.steps.length,
  extension_points: pointIds,
  templated_implementations: templated.count,
  sources_supported: vendorImplementationTemplate.sources_supported.length,
  reuses_certified_vendor_implementation_profile: true,
  vendor_neutral: true,
  design_constraints: vendorImplementationTemplate.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_implementation_template: VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    implementation_profile: VENDOR_IMPLEMENTATION_PROFILE_PATH,
    implementation_profile_certification:
      VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_VALIDATION_REPORT.json';
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
    `template_id=${report.template_id}`,
    `schema_fields=${report.schema_fields}`,
    `skeleton_steps=${report.skeleton_steps}`,
    `extension_points=${report.extension_points.length}`,
    `templated_implementations=${report.templated_implementations}`,
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
