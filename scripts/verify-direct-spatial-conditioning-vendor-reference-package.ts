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
import { VENDOR_IMPLEMENTATION_PROFILE_PATH } from '../services/directSpatialConditioningVendorImplementationProfileBuilder.js';
import { VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorImplementationProfileCertificationBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE,
  DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_TEMPLATE_ID,
  VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
  VENDOR_IMPLEMENTATION_TEMPLATE_VERSION,
} from '../services/directSpatialConditioningVendorImplementationTemplateBuilder.js';
import { VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorImplementationTemplateCertificationBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_REFERENCE_PACKAGE_PHASE,
  PACKAGE_COMPONENT_SPECS,
  VENDOR_REFERENCE_PACKAGE_ID,
  VENDOR_REFERENCE_PACKAGE_PATH,
  VENDOR_REFERENCE_PACKAGE_VERSION,
  buildDirectSpatialConditioningVendorReferencePackage,
  type DirectSpatialConditioningVendorReferencePackage,
} from '../services/directSpatialConditioningVendorReferencePackageBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PACKAGE_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PACKAGE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-package.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-package-implementation-registry-v1.json';

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
  'package_id',
  'package_version',
  'package_kind',
  'template_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_package_identity',
  'vendor_implementation_template_binding',
  'package_composition',
  'package_manifest',
];

const EXPECTED_COMPONENT_IDS = PACKAGE_COMPONENT_SPECS.map((spec) => spec.component_id);

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
  VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  BACKEND_FAMILY_CERTIFICATION_PATH,
  VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
  VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
  VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, VENDOR_IMPLEMENTATION_TEMPLATE_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor implementation template ${VENDOR_IMPLEMENTATION_TEMPLATE_PATH}`
  );
  process.exit(1);
}
if (
  !fs.existsSync(path.join(projectRoot, VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH))
) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor implementation template certification ${VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH}`
  );
  process.exit(1);
}

const templateCertification = readJson<{
  certified?: boolean;
  certified_system?: string;
}>(VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH);
if (templateCertification.certified !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor implementation template is not certified');
  process.exit(1);
}
if (
  templateCertification.certified_system !== DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID
) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: certification does not cover the vendor implementation template'
  );
  process.exit(1);
}

let vendorReferencePackage: DirectSpatialConditioningVendorReferencePackage;
try {
  vendorReferencePackage =
    buildDirectSpatialConditioningVendorReferencePackage(projectRoot)
      .vendorReferencePackage;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR REFERENCE PACKAGE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorReferencePackage.phase !== DSC_VENDOR_REFERENCE_PACKAGE_PHASE) {
  issues.push({ code: 'PHASE', message: vendorReferencePackage.phase });
}
if (vendorReferencePackage.mode !== 'design_only_vendor_reference_package') {
  issues.push({ code: 'MODE', message: vendorReferencePackage.mode });
}
if (vendorReferencePackage.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorReferencePackage.target });
}
if (vendorReferencePackage.package_id !== VENDOR_REFERENCE_PACKAGE_ID) {
  issues.push({ code: 'PACKAGE_ID', message: vendorReferencePackage.package_id });
}
if (vendorReferencePackage.package_version !== VENDOR_REFERENCE_PACKAGE_VERSION) {
  issues.push({
    code: 'PACKAGE_VERSION',
    message: vendorReferencePackage.package_version,
  });
}
if (vendorReferencePackage.package_kind !== 'vendor_reference_package') {
  issues.push({ code: 'PACKAGE_KIND', message: vendorReferencePackage.package_kind });
}

const refChecks: Array<[string, string, string]> = [
  ['template_ref', vendorReferencePackage.template_ref, VENDOR_IMPLEMENTATION_TEMPLATE_PATH],
  [
    'template_certification_ref',
    vendorReferencePackage.template_certification_ref,
    VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  ],
  [
    'implementation_profile_ref',
    vendorReferencePackage.implementation_profile_ref,
    VENDOR_IMPLEMENTATION_PROFILE_PATH,
  ],
  [
    'implementation_profile_certification_ref',
    vendorReferencePackage.implementation_profile_certification_ref,
    VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
  ],
  ['family_ref', vendorReferencePackage.family_ref, VENDOR_IMPLEMENTATION_FAMILY_PATH],
  [
    'family_certification_ref',
    vendorReferencePackage.family_certification_ref,
    VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
  ],
  [
    'reference_implementation_ref',
    vendorReferencePackage.reference_implementation_ref,
    VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  ],
  [
    'reference_implementation_certification_ref',
    vendorReferencePackage.reference_implementation_certification_ref,
    VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
  ],
  ['runtime_package_ref', vendorReferencePackage.runtime_package_ref, RUNTIME_PACKAGE_PATH],
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
  JSON.stringify(vendorReferencePackage.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorReferencePackage.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorReferencePackage.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorReferencePackage.required_channels.join(','),
  });
}
if (vendorReferencePackage.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorReferencePackage.spatial_frame_ref });
}
if (
  vendorReferencePackage.capability_set_id !== CAPABILITY_SET_ID ||
  vendorReferencePackage.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorReferencePackage.capability_set_id}@${vendorReferencePackage.capability_set_version}`,
  });
}

// 1) Reference package schema.
const packageSchema = vendorReferencePackage.reference_package_schema;
if (packageSchema.schema_id !== 'dsc-vendor-reference-package-schema-v1') {
  issues.push({ code: 'PACKAGE_SCHEMA_ID', message: packageSchema.schema_id });
}
if (
  packageSchema.encoding !== 'application/json' ||
  packageSchema.package_id_policy !== 'opaque_package_id_no_vendor_binding' ||
  packageSchema.template_ref !== VENDOR_IMPLEMENTATION_TEMPLATE_ID ||
  packageSchema.optional_fields.length !== 0 ||
  packageSchema.additional_fields
) {
  issues.push({
    code: 'PACKAGE_SCHEMA_POLICY',
    message: packageSchema.package_id_policy,
  });
}
const schemaFields = packageSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'PACKAGE_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of packageSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'PACKAGE_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic package identity.
const identity = vendorReferencePackage.deterministic_package_identity;
if (identity.identity_id !== 'dsc-vendor-reference-package-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.package_id !== VENDOR_REFERENCE_PACKAGE_ID ||
  identity.package_version !== VENDOR_REFERENCE_PACKAGE_VERSION ||
  identity.identity_policy !== 'opaque_package_id_no_vendor_binding' ||
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

// 3) Certified Vendor Implementation Template binding.
const binding = vendorReferencePackage.vendor_implementation_template_binding;
if (binding.binding_id !== 'dsc-vendor-reference-package-template-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.template_ref !== VENDOR_IMPLEMENTATION_TEMPLATE_PATH ||
  binding.template_id !== VENDOR_IMPLEMENTATION_TEMPLATE_ID ||
  binding.template_version !== VENDOR_IMPLEMENTATION_TEMPLATE_VERSION ||
  binding.template_phase !== DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE ||
  binding.template_system_id !== DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID ||
  binding.template_certification_ref !==
    VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'package_root' ||
  binding.packages_vendors_in_this_phase ||
  binding.implements_template_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}

// 4) Package composition.
const composition = vendorReferencePackage.package_composition;
if (composition.composition_id !== 'dsc-vendor-reference-package-composition-v1') {
  issues.push({ code: 'COMPOSITION_ID', message: composition.composition_id });
}
if (
  composition.root_component_id !== 'vendor_implementation_template' ||
  composition.component_order !== 'fixed_declared_order' ||
  !composition.closed_set ||
  composition.vendor_specific_components !== 'forbidden' ||
  composition.includes_implementations
) {
  issues.push({
    code: 'COMPOSITION_POLICY',
    message: composition.vendor_specific_components,
  });
}
const componentIds = composition.components.map((component) => component.component_id);
if (JSON.stringify(componentIds) !== JSON.stringify(EXPECTED_COMPONENT_IDS)) {
  issues.push({ code: 'COMPOSITION_COMPONENTS', message: `${componentIds.length}` });
}
composition.components.forEach((component, index) => {
  if (component.order !== index + 1) {
    issues.push({ code: 'COMPONENT_ORDER', message: component.component_id });
  }
  if (!fs.existsSync(path.join(projectRoot, component.artifact_ref))) {
    issues.push({ code: 'COMPONENT_UNRESOLVED', message: component.artifact_ref });
  }
  if (!component.role || !component.layer) {
    issues.push({ code: 'COMPONENT_INCOMPLETE', message: component.component_id });
  }
});
if (new Set(componentIds).size !== componentIds.length) {
  issues.push({ code: 'COMPONENT_ID_DUPLICATE', message: `${componentIds.length}` });
}
const componentRefs = composition.components.map((component) => component.artifact_ref);
if (new Set(componentRefs).size !== componentRefs.length) {
  issues.push({ code: 'COMPONENT_REF_DUPLICATE', message: `${componentRefs.length}` });
}

// 5) Package manifest (content-addressed, read-only).
const manifest = vendorReferencePackage.package_manifest;
if (manifest.manifest_id !== 'dsc-vendor-reference-package-manifest-v1') {
  issues.push({ code: 'MANIFEST_ID', message: manifest.manifest_id });
}
if (
  manifest.integrity_method !== 'sha256_content_addressed_read_only' ||
  manifest.package_digest_method !== 'sha256_of_ordered_member_digests' ||
  manifest.verifies_implementations_in_this_phase
) {
  issues.push({ code: 'MANIFEST_POLICY', message: manifest.integrity_method });
}
if (manifest.entry_count !== manifest.entries.length) {
  issues.push({ code: 'MANIFEST_ENTRY_COUNT', message: `${manifest.entry_count}` });
}
if (manifest.entries.length !== composition.components.length) {
  issues.push({
    code: 'MANIFEST_COMPOSITION_MISMATCH',
    message: `${manifest.entries.length}`,
  });
}
const manifestComponentIds = manifest.entries.map((entry) => entry.component_id);
if (JSON.stringify(manifestComponentIds) !== JSON.stringify(EXPECTED_COMPONENT_IDS)) {
  issues.push({
    code: 'MANIFEST_COMPONENTS',
    message: `${manifestComponentIds.length}`,
  });
}
for (const entry of manifest.entries) {
  if (!entry.content_addressed || !/^[a-f0-9]{64}$/.test(entry.sha256) || entry.bytes < 1) {
    issues.push({ code: 'MANIFEST_ENTRY_INCOMPLETE', message: entry.component_id });
    continue;
  }
  // Recompute the digest from disk: the manifest must be content-addressed.
  const actualDigest = sha256(entry.artifact_ref);
  if (actualDigest !== entry.sha256) {
    issues.push({ code: 'MANIFEST_DIGEST_DRIFT', message: entry.component_id });
  }
}
const expectedPackageDigest = crypto
  .createHash('sha256')
  .update(
    manifest.entries.map((entry) => `${entry.component_id}:${entry.sha256}`).join('\n')
  )
  .digest('hex');
if (manifest.package_digest !== expectedPackageDigest) {
  issues.push({ code: 'PACKAGE_DIGEST_DRIFT', message: manifest.package_digest });
}

// Design only: no vendor packaged in this phase.
const packaged = vendorReferencePackage.packaged_vendors;
if (
  packaged.count !== 0 ||
  packaged.entries.length !== 0 ||
  packaged.packages_vendors_in_this_phase ||
  !packaged.packaging_policy
) {
  issues.push({ code: 'PACKAGED_VENDORS', message: `${packaged.count}` });
}

// Design constraints.
const constraints = vendorReferencePackage.design_constraints;
if (
  !constraints.package_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_implementation_template ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.packages_vendors_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

// Reproducibility: a second build must produce a byte-identical artifact.
const firstSerialized = JSON.stringify(vendorReferencePackage);
const rebuilt = buildDirectSpatialConditioningVendorReferencePackage(projectRoot)
  .vendorReferencePackage;
const rebuiltSerialized = JSON.stringify({
  ...rebuilt,
  created_at: vendorReferencePackage.created_at,
});
if (firstSerialized !== rebuiltSerialized) {
  issues.push({ code: 'NON_REPRODUCIBLE', message: 'rebuild diverged from first build' });
}

for (const requiredArtifact of [
  VENDOR_REFERENCE_PACKAGE_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorReferencePackage);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_reference_package_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_REFERENCE_PACKAGE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorReferencePackage.mode,
  package_id: vendorReferencePackage.package_id,
  package_version: vendorReferencePackage.package_version,
  package_kind: vendorReferencePackage.package_kind,
  reference_package_schema: packageSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_package_identity: identity.identity_id,
  vendor_implementation_template_binding: binding.binding_id,
  package_composition: composition.composition_id,
  component_count: composition.components.length,
  package_manifest: manifest.manifest_id,
  manifest_entry_count: manifest.entries.length,
  package_digest: manifest.package_digest,
  packaged_vendors: packaged.count,
  sources_supported: vendorReferencePackage.sources_supported.length,
  reuses_certified_vendor_implementation_template: true,
  vendor_neutral: true,
  design_constraints: vendorReferencePackage.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_reference_package: VENDOR_REFERENCE_PACKAGE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    template: VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
    template_certification: VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PACKAGE_VALIDATION_REPORT.json';
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
    `package_id=${report.package_id}`,
    `schema_fields=${report.schema_fields}`,
    `components=${report.component_count}`,
    `manifest_entries=${report.manifest_entry_count}`,
    `packaged_vendors=${report.packaged_vendors}`,
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
