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
import { VENDOR_IMPLEMENTATION_TEMPLATE_PATH } from '../services/directSpatialConditioningVendorImplementationTemplateBuilder.js';
import { VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorImplementationTemplateCertificationBuilder.js';
import { VENDOR_REFERENCE_PACKAGE_PATH } from '../services/directSpatialConditioningVendorReferencePackageBuilder.js';
import {
  DSC_VENDOR_REFERENCE_BUNDLE_PHASE,
  DSC_VENDOR_REFERENCE_BUNDLE_SYSTEM_ID,
  VENDOR_REFERENCE_BUNDLE_ID,
  VENDOR_REFERENCE_BUNDLE_PATH,
  VENDOR_REFERENCE_BUNDLE_VERSION,
  type DirectSpatialConditioningVendorReferenceBundle,
} from '../services/directSpatialConditioningVendorReferenceBundleBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_RUNTIME_PACKAGE_PHASE,
  RUNTIME_PACKAGE_SECTION_SPECS,
  VENDOR_REFERENCE_BUNDLE_EVIDENCE_PATH,
  VENDOR_REFERENCE_BUNDLE_REGISTRY_PATH,
  VENDOR_REFERENCE_BUNDLE_SCHEMA_PATH,
  VENDOR_REFERENCE_BUNDLE_VERDICT,
  VENDOR_RUNTIME_PACKAGE_ID,
  VENDOR_RUNTIME_PACKAGE_PATH,
  VENDOR_RUNTIME_PACKAGE_VERSION,
  buildDirectSpatialConditioningVendorRuntimePackage,
  type DirectSpatialConditioningVendorRuntimePackage,
} from '../services/directSpatialConditioningVendorRuntimePackageBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PACKAGE_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PACKAGE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-package.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-package-registry-v1.json';

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
  'runtime_package_id',
  'runtime_package_version',
  'runtime_package_kind',
  'bundle_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_runtime_package_identity',
  'vendor_reference_bundle_binding',
  'runtime_package_composition',
  'runtime_package_manifest',
];

const EXPECTED_SECTION_IDS = RUNTIME_PACKAGE_SECTION_SPECS.map((spec) => spec.section_id);

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
  VENDOR_REFERENCE_PACKAGE_PATH,
  VENDOR_REFERENCE_BUNDLE_PATH,
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
  VENDOR_REFERENCE_BUNDLE_SCHEMA_PATH,
  VENDOR_REFERENCE_BUNDLE_REGISTRY_PATH,
  VENDOR_REFERENCE_BUNDLE_EVIDENCE_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

for (const required of [
  VENDOR_REFERENCE_BUNDLE_PATH,
  VENDOR_REFERENCE_BUNDLE_SCHEMA_PATH,
  VENDOR_REFERENCE_BUNDLE_REGISTRY_PATH,
  VENDOR_REFERENCE_BUNDLE_EVIDENCE_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing vendor reference bundle input ${required}`);
    process.exit(1);
  }
}

const bundleEvidence = readJson<{
  final_verdict?: string;
  validation_passed?: boolean;
  phase?: string;
  error_count?: number;
}>(VENDOR_REFERENCE_BUNDLE_EVIDENCE_PATH);
if (bundleEvidence.validation_passed !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor reference bundle did not pass validation');
  process.exit(1);
}
if (bundleEvidence.final_verdict !== VENDOR_REFERENCE_BUNDLE_VERDICT) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: bundle evidence does not carry the PHASE-077 PASS verdict');
  process.exit(1);
}
if (bundleEvidence.phase !== DSC_VENDOR_REFERENCE_BUNDLE_PHASE) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: evidence does not cover the vendor reference bundle');
  process.exit(1);
}

const referenceBundle = readJson<DirectSpatialConditioningVendorReferenceBundle>(
  VENDOR_REFERENCE_BUNDLE_PATH
);
if (referenceBundle.system_id !== DSC_VENDOR_REFERENCE_BUNDLE_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor reference bundle system id mismatch');
  process.exit(1);
}

let vendorRuntimePackage: DirectSpatialConditioningVendorRuntimePackage;
try {
  vendorRuntimePackage =
    buildDirectSpatialConditioningVendorRuntimePackage(projectRoot).vendorRuntimePackage;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PACKAGE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorRuntimePackage.phase !== DSC_VENDOR_RUNTIME_PACKAGE_PHASE) {
  issues.push({ code: 'PHASE', message: vendorRuntimePackage.phase });
}
if (vendorRuntimePackage.mode !== 'design_only_vendor_runtime_package') {
  issues.push({ code: 'MODE', message: vendorRuntimePackage.mode });
}
if (vendorRuntimePackage.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorRuntimePackage.target });
}
if (vendorRuntimePackage.runtime_package_id !== VENDOR_RUNTIME_PACKAGE_ID) {
  issues.push({ code: 'RUNTIME_PACKAGE_ID', message: vendorRuntimePackage.runtime_package_id });
}
if (vendorRuntimePackage.runtime_package_version !== VENDOR_RUNTIME_PACKAGE_VERSION) {
  issues.push({
    code: 'RUNTIME_PACKAGE_VERSION',
    message: vendorRuntimePackage.runtime_package_version,
  });
}
if (vendorRuntimePackage.runtime_package_kind !== 'vendor_runtime_package') {
  issues.push({ code: 'RUNTIME_PACKAGE_KIND', message: vendorRuntimePackage.runtime_package_kind });
}

const refChecks: Array<[string, string, string]> = [
  ['bundle_ref', vendorRuntimePackage.bundle_ref, VENDOR_REFERENCE_BUNDLE_PATH],
  [
    'bundle_schema_ref',
    vendorRuntimePackage.bundle_schema_ref,
    VENDOR_REFERENCE_BUNDLE_SCHEMA_PATH,
  ],
  [
    'bundle_registry_ref',
    vendorRuntimePackage.bundle_registry_ref,
    VENDOR_REFERENCE_BUNDLE_REGISTRY_PATH,
  ],
  [
    'bundle_evidence_ref',
    vendorRuntimePackage.bundle_evidence_ref,
    VENDOR_REFERENCE_BUNDLE_EVIDENCE_PATH,
  ],
  ['package_ref', vendorRuntimePackage.package_ref, VENDOR_REFERENCE_PACKAGE_PATH],
  ['template_ref', vendorRuntimePackage.template_ref, VENDOR_IMPLEMENTATION_TEMPLATE_PATH],
  [
    'template_certification_ref',
    vendorRuntimePackage.template_certification_ref,
    VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  ],
  [
    'numerical_runtime_package_ref',
    vendorRuntimePackage.numerical_runtime_package_ref,
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
  JSON.stringify(vendorRuntimePackage.sources_supported) !== JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorRuntimePackage.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorRuntimePackage.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorRuntimePackage.required_channels.join(','),
  });
}
if (vendorRuntimePackage.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorRuntimePackage.spatial_frame_ref });
}
if (
  vendorRuntimePackage.capability_set_id !== CAPABILITY_SET_ID ||
  vendorRuntimePackage.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorRuntimePackage.capability_set_id}@${vendorRuntimePackage.capability_set_version}`,
  });
}

// 1) Runtime package schema.
const runtimeSchema = vendorRuntimePackage.runtime_package_schema;
if (runtimeSchema.schema_id !== 'dsc-vendor-runtime-package-schema-v1') {
  issues.push({ code: 'RUNTIME_SCHEMA_ID', message: runtimeSchema.schema_id });
}
if (
  runtimeSchema.encoding !== 'application/json' ||
  runtimeSchema.runtime_package_id_policy !==
    'opaque_runtime_package_id_no_vendor_binding' ||
  runtimeSchema.bundle_ref !== VENDOR_REFERENCE_BUNDLE_ID ||
  runtimeSchema.optional_fields.length !== 0 ||
  runtimeSchema.additional_fields
) {
  issues.push({
    code: 'RUNTIME_SCHEMA_POLICY',
    message: runtimeSchema.runtime_package_id_policy,
  });
}
const schemaFields = runtimeSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'RUNTIME_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of runtimeSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'RUNTIME_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic runtime package identity.
const identity = vendorRuntimePackage.deterministic_runtime_package_identity;
if (identity.identity_id !== 'dsc-vendor-runtime-package-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.runtime_package_id !== VENDOR_RUNTIME_PACKAGE_ID ||
  identity.runtime_package_version !== VENDOR_RUNTIME_PACKAGE_VERSION ||
  identity.identity_policy !== 'opaque_runtime_package_id_no_vendor_binding' ||
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

// 3) Vendor Reference Bundle binding.
const binding = vendorRuntimePackage.vendor_reference_bundle_binding;
if (binding.binding_id !== 'dsc-vendor-runtime-package-bundle-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.bundle_ref !== VENDOR_REFERENCE_BUNDLE_PATH ||
  binding.bundle_id !== VENDOR_REFERENCE_BUNDLE_ID ||
  binding.bundle_version !== VENDOR_REFERENCE_BUNDLE_VERSION ||
  binding.bundle_phase !== DSC_VENDOR_REFERENCE_BUNDLE_PHASE ||
  binding.bundle_system_id !== DSC_VENDOR_REFERENCE_BUNDLE_SYSTEM_ID ||
  binding.bundle_evidence_ref !== VENDOR_REFERENCE_BUNDLE_EVIDENCE_PATH ||
  binding.bundle_verdict !== VENDOR_REFERENCE_BUNDLE_VERDICT ||
  binding.bundle_evidence_mode !== 'phase_077_pass_verdict_gated_at_build_time' ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'runtime_root' ||
  binding.packages_runtime_in_this_phase ||
  binding.implements_bundle_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}
if (
  binding.bundle_id !== referenceBundle.bundle_id ||
  binding.bundle_version !== referenceBundle.bundle_version
) {
  issues.push({ code: 'BINDING_BUNDLE_DRIFT', message: binding.bundle_id });
}

// 4) Runtime package composition.
const composition = vendorRuntimePackage.runtime_package_composition;
if (composition.composition_id !== 'dsc-vendor-runtime-package-composition-v1') {
  issues.push({ code: 'COMPOSITION_ID', message: composition.composition_id });
}
if (
  composition.root_section_id !== 'vendor_reference_bundle' ||
  composition.section_order !== 'fixed_declared_order' ||
  !composition.closed_set ||
  composition.vendor_specific_sections !== 'forbidden' ||
  composition.includes_implementations ||
  composition.declares_runtime_execution
) {
  issues.push({
    code: 'COMPOSITION_POLICY',
    message: composition.vendor_specific_sections,
  });
}
const sectionIds = composition.sections.map((section) => section.section_id);
if (JSON.stringify(sectionIds) !== JSON.stringify(EXPECTED_SECTION_IDS)) {
  issues.push({ code: 'COMPOSITION_SECTIONS', message: sectionIds.join(',') });
}
composition.sections.forEach((section, index) => {
  if (section.order !== index + 1) {
    issues.push({ code: 'SECTION_ORDER', message: section.section_id });
  }
  if (!fs.existsSync(path.join(projectRoot, section.artifact_ref))) {
    issues.push({ code: 'SECTION_UNRESOLVED', message: section.artifact_ref });
  }
  if (!section.role || !section.kind) {
    issues.push({ code: 'SECTION_INCOMPLETE', message: section.section_id });
  }
});
if (new Set(sectionIds).size !== sectionIds.length) {
  issues.push({ code: 'SECTION_ID_DUPLICATE', message: `${sectionIds.length}` });
}
const sectionRefs = composition.sections.map((section) => section.artifact_ref);
if (new Set(sectionRefs).size !== sectionRefs.length) {
  issues.push({ code: 'SECTION_REF_DUPLICATE', message: `${sectionRefs.length}` });
}

// The runtime package must never re-list what the bundle already owns.
const bundleMemberRefs = new Set(
  referenceBundle.bundle_manifest.entries.map((entry) => entry.artifact_ref)
);
for (const section of composition.sections) {
  if (
    section.section_id !== 'vendor_reference_bundle' &&
    bundleMemberRefs.has(section.artifact_ref)
  ) {
    issues.push({ code: 'SECTION_DUPLICATES_BUNDLE_MEMBER', message: section.artifact_ref });
  }
}
const transitive = composition.transitive_seal;
if (
  transitive.policy !== 'bundle_contents_sealed_via_bundle_digest' ||
  transitive.sealed_via !== VENDOR_REFERENCE_BUNDLE_ID ||
  transitive.re_lists_bundle_contents ||
  transitive.sealed_component_count !== referenceBundle.bundle_manifest.sealed_component_count
) {
  issues.push({ code: 'TRANSITIVE_SEAL', message: `${transitive.sealed_component_count}` });
}

// 5) Runtime package manifest (content-addressed, read-only).
const manifest = vendorRuntimePackage.runtime_package_manifest;
if (manifest.manifest_id !== 'dsc-vendor-runtime-package-manifest-v1') {
  issues.push({ code: 'MANIFEST_ID', message: manifest.manifest_id });
}
if (
  manifest.integrity_method !== 'sha256_content_addressed_read_only' ||
  manifest.runtime_package_digest_method !==
    'sha256_of_ordered_section_digests_and_sealed_bundle_digest' ||
  manifest.verifies_implementations_in_this_phase
) {
  issues.push({ code: 'MANIFEST_POLICY', message: manifest.integrity_method });
}
if (manifest.entry_count !== manifest.entries.length) {
  issues.push({ code: 'MANIFEST_ENTRY_COUNT', message: `${manifest.entry_count}` });
}
if (manifest.entries.length !== composition.sections.length) {
  issues.push({
    code: 'MANIFEST_COMPOSITION_MISMATCH',
    message: `${manifest.entries.length}`,
  });
}
const manifestSectionIds = manifest.entries.map((entry) => entry.section_id);
if (JSON.stringify(manifestSectionIds) !== JSON.stringify(EXPECTED_SECTION_IDS)) {
  issues.push({ code: 'MANIFEST_SECTIONS', message: manifestSectionIds.join(',') });
}
for (const entry of manifest.entries) {
  if (!entry.content_addressed || !/^[a-f0-9]{64}$/.test(entry.sha256) || entry.bytes < 1) {
    issues.push({ code: 'MANIFEST_ENTRY_INCOMPLETE', message: entry.section_id });
    continue;
  }
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({ code: 'MANIFEST_DIGEST_DRIFT', message: entry.section_id });
  }
}

// Transitive seal: recompute every bundle section and the bundle digest.
const bundleManifest = referenceBundle.bundle_manifest;
for (const entry of bundleManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({ code: 'SEALED_BUNDLE_SECTION_DRIFT', message: entry.artifact_ref });
  }
}
const recomputedBundleDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...bundleManifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_package:${bundleManifest.sealed_package_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (recomputedBundleDigest !== bundleManifest.bundle_digest) {
  issues.push({ code: 'SEALED_BUNDLE_DIGEST_DRIFT', message: recomputedBundleDigest });
}
if (
  manifest.sealed_bundle_digest !== bundleManifest.bundle_digest ||
  binding.sealed_bundle_digest !== bundleManifest.bundle_digest
) {
  issues.push({
    code: 'SEALED_BUNDLE_DIGEST_MISMATCH',
    message: manifest.sealed_bundle_digest,
  });
}
if (
  manifest.sealed_package_digest !== bundleManifest.sealed_package_digest ||
  binding.sealed_package_digest !== bundleManifest.sealed_package_digest
) {
  issues.push({
    code: 'SEALED_PACKAGE_DIGEST_MISMATCH',
    message: manifest.sealed_package_digest,
  });
}
if (
  manifest.sealed_component_count !== bundleManifest.sealed_component_count ||
  binding.sealed_component_count !== bundleManifest.sealed_component_count
) {
  issues.push({
    code: 'SEALED_COMPONENT_COUNT',
    message: `${manifest.sealed_component_count}`,
  });
}

const expectedRuntimePackageDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...manifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_bundle:${manifest.sealed_bundle_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (manifest.runtime_package_digest !== expectedRuntimePackageDigest) {
  issues.push({ code: 'RUNTIME_PACKAGE_DIGEST_DRIFT', message: manifest.runtime_package_digest });
}

// Design only: no vendor runtime packaged in this phase.
const runtimeVendors = vendorRuntimePackage.runtime_vendors;
if (
  runtimeVendors.count !== 0 ||
  runtimeVendors.entries.length !== 0 ||
  runtimeVendors.packages_runtime_in_this_phase ||
  !runtimeVendors.runtime_policy
) {
  issues.push({ code: 'RUNTIME_VENDORS', message: `${runtimeVendors.count}` });
}

// Design constraints.
const constraints = vendorRuntimePackage.design_constraints;
if (
  !constraints.runtime_package_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_reference_bundle ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.declares_runtime_execution ||
  constraints.packages_runtime_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

// Reproducibility: a second build must produce a byte-identical artifact.
const firstSerialized = JSON.stringify(vendorRuntimePackage);
const rebuilt = buildDirectSpatialConditioningVendorRuntimePackage(projectRoot)
  .vendorRuntimePackage;
const rebuiltSerialized = JSON.stringify({
  ...rebuilt,
  created_at: vendorRuntimePackage.created_at,
});
if (firstSerialized !== rebuiltSerialized) {
  issues.push({ code: 'NON_REPRODUCIBLE', message: 'rebuild diverged from first build' });
}

for (const requiredArtifact of [VENDOR_RUNTIME_PACKAGE_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorRuntimePackage);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_runtime_package_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_RUNTIME_PACKAGE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorRuntimePackage.mode,
  runtime_package_id: vendorRuntimePackage.runtime_package_id,
  runtime_package_version: vendorRuntimePackage.runtime_package_version,
  runtime_package_kind: vendorRuntimePackage.runtime_package_kind,
  runtime_package_schema: runtimeSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_runtime_package_identity: identity.identity_id,
  vendor_reference_bundle_binding: binding.binding_id,
  bundle_verdict: binding.bundle_verdict,
  bundle_evidence_mode: binding.bundle_evidence_mode,
  runtime_package_composition: composition.composition_id,
  section_count: composition.sections.length,
  runtime_package_manifest: manifest.manifest_id,
  manifest_entry_count: manifest.entries.length,
  sealed_component_count: manifest.sealed_component_count,
  sealed_bundle_digest: manifest.sealed_bundle_digest,
  runtime_package_digest: manifest.runtime_package_digest,
  runtime_vendors: runtimeVendors.count,
  sources_supported: vendorRuntimePackage.sources_supported.length,
  reuses_certified_vendor_reference_bundle: true,
  vendor_neutral: true,
  design_constraints: vendorRuntimePackage.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_runtime_package: VENDOR_RUNTIME_PACKAGE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    bundle: VENDOR_REFERENCE_BUNDLE_PATH,
    bundle_schema: VENDOR_REFERENCE_BUNDLE_SCHEMA_PATH,
    bundle_registry: VENDOR_REFERENCE_BUNDLE_REGISTRY_PATH,
    bundle_evidence: VENDOR_REFERENCE_BUNDLE_EVIDENCE_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PACKAGE_VALIDATION_REPORT.json';
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
    `runtime_package_id=${report.runtime_package_id}`,
    `schema_fields=${report.schema_fields}`,
    `sections=${report.section_count}`,
    `manifest_entries=${report.manifest_entry_count}`,
    `sealed_components=${report.sealed_component_count}`,
    `runtime_vendors=${report.runtime_vendors}`,
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
