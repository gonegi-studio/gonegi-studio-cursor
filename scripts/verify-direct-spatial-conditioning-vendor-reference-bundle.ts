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
import {
  DSC_VENDOR_REFERENCE_PACKAGE_PHASE,
  DSC_VENDOR_REFERENCE_PACKAGE_SYSTEM_ID,
  VENDOR_REFERENCE_PACKAGE_ID,
  VENDOR_REFERENCE_PACKAGE_PATH,
  VENDOR_REFERENCE_PACKAGE_VERSION,
  type DirectSpatialConditioningVendorReferencePackage,
} from '../services/directSpatialConditioningVendorReferencePackageBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  BUNDLE_SECTION_SPECS,
  DSC_VENDOR_REFERENCE_BUNDLE_PHASE,
  VENDOR_REFERENCE_BUNDLE_ID,
  VENDOR_REFERENCE_BUNDLE_PATH,
  VENDOR_REFERENCE_BUNDLE_VERSION,
  VENDOR_REFERENCE_PACKAGE_EVIDENCE_PATH,
  VENDOR_REFERENCE_PACKAGE_REGISTRY_PATH,
  VENDOR_REFERENCE_PACKAGE_SCHEMA_PATH,
  VENDOR_REFERENCE_PACKAGE_VERDICT,
  buildDirectSpatialConditioningVendorReferenceBundle,
  type DirectSpatialConditioningVendorReferenceBundle,
} from '../services/directSpatialConditioningVendorReferenceBundleBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_BUNDLE_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_BUNDLE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-bundle.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-bundle-registry-v1.json';

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
  'bundle_id',
  'bundle_version',
  'bundle_kind',
  'package_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_bundle_identity',
  'vendor_reference_package_binding',
  'bundle_composition',
  'bundle_manifest',
];

const EXPECTED_SECTION_IDS = BUNDLE_SECTION_SPECS.map((spec) => spec.section_id);

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
  VENDOR_REFERENCE_PACKAGE_SCHEMA_PATH,
  VENDOR_REFERENCE_PACKAGE_REGISTRY_PATH,
  VENDOR_REFERENCE_PACKAGE_EVIDENCE_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

for (const required of [
  VENDOR_REFERENCE_PACKAGE_PATH,
  VENDOR_REFERENCE_PACKAGE_SCHEMA_PATH,
  VENDOR_REFERENCE_PACKAGE_REGISTRY_PATH,
  VENDOR_REFERENCE_PACKAGE_EVIDENCE_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing vendor reference package input ${required}`);
    process.exit(1);
  }
}

const packageEvidence = readJson<{
  final_verdict?: string;
  validation_passed?: boolean;
  phase?: string;
  error_count?: number;
}>(VENDOR_REFERENCE_PACKAGE_EVIDENCE_PATH);
if (packageEvidence.validation_passed !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor reference package did not pass validation');
  process.exit(1);
}
if (packageEvidence.final_verdict !== VENDOR_REFERENCE_PACKAGE_VERDICT) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: package evidence does not carry the PHASE-075 PASS verdict'
  );
  process.exit(1);
}
if (packageEvidence.phase !== DSC_VENDOR_REFERENCE_PACKAGE_PHASE) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: evidence does not cover the vendor reference package');
  process.exit(1);
}

const referencePackage = readJson<DirectSpatialConditioningVendorReferencePackage>(
  VENDOR_REFERENCE_PACKAGE_PATH
);
if (referencePackage.system_id !== DSC_VENDOR_REFERENCE_PACKAGE_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor reference package system id mismatch');
  process.exit(1);
}

let vendorReferenceBundle: DirectSpatialConditioningVendorReferenceBundle;
try {
  vendorReferenceBundle =
    buildDirectSpatialConditioningVendorReferenceBundle(projectRoot)
      .vendorReferenceBundle;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR REFERENCE BUNDLE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorReferenceBundle.phase !== DSC_VENDOR_REFERENCE_BUNDLE_PHASE) {
  issues.push({ code: 'PHASE', message: vendorReferenceBundle.phase });
}
if (vendorReferenceBundle.mode !== 'design_only_vendor_reference_bundle') {
  issues.push({ code: 'MODE', message: vendorReferenceBundle.mode });
}
if (vendorReferenceBundle.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorReferenceBundle.target });
}
if (vendorReferenceBundle.bundle_id !== VENDOR_REFERENCE_BUNDLE_ID) {
  issues.push({ code: 'BUNDLE_ID', message: vendorReferenceBundle.bundle_id });
}
if (vendorReferenceBundle.bundle_version !== VENDOR_REFERENCE_BUNDLE_VERSION) {
  issues.push({ code: 'BUNDLE_VERSION', message: vendorReferenceBundle.bundle_version });
}
if (vendorReferenceBundle.bundle_kind !== 'vendor_reference_bundle') {
  issues.push({ code: 'BUNDLE_KIND', message: vendorReferenceBundle.bundle_kind });
}

const refChecks: Array<[string, string, string]> = [
  ['package_ref', vendorReferenceBundle.package_ref, VENDOR_REFERENCE_PACKAGE_PATH],
  [
    'package_schema_ref',
    vendorReferenceBundle.package_schema_ref,
    VENDOR_REFERENCE_PACKAGE_SCHEMA_PATH,
  ],
  [
    'package_registry_ref',
    vendorReferenceBundle.package_registry_ref,
    VENDOR_REFERENCE_PACKAGE_REGISTRY_PATH,
  ],
  [
    'package_evidence_ref',
    vendorReferenceBundle.package_evidence_ref,
    VENDOR_REFERENCE_PACKAGE_EVIDENCE_PATH,
  ],
  ['template_ref', vendorReferenceBundle.template_ref, VENDOR_IMPLEMENTATION_TEMPLATE_PATH],
  [
    'template_certification_ref',
    vendorReferenceBundle.template_certification_ref,
    VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  ],
  ['runtime_package_ref', vendorReferenceBundle.runtime_package_ref, RUNTIME_PACKAGE_PATH],
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
  JSON.stringify(vendorReferenceBundle.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorReferenceBundle.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorReferenceBundle.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorReferenceBundle.required_channels.join(','),
  });
}
if (vendorReferenceBundle.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorReferenceBundle.spatial_frame_ref });
}
if (
  vendorReferenceBundle.capability_set_id !== CAPABILITY_SET_ID ||
  vendorReferenceBundle.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorReferenceBundle.capability_set_id}@${vendorReferenceBundle.capability_set_version}`,
  });
}

// 1) Bundle schema.
const bundleSchema = vendorReferenceBundle.bundle_schema;
if (bundleSchema.schema_id !== 'dsc-vendor-reference-bundle-schema-v1') {
  issues.push({ code: 'BUNDLE_SCHEMA_ID', message: bundleSchema.schema_id });
}
if (
  bundleSchema.encoding !== 'application/json' ||
  bundleSchema.bundle_id_policy !== 'opaque_bundle_id_no_vendor_binding' ||
  bundleSchema.package_ref !== VENDOR_REFERENCE_PACKAGE_ID ||
  bundleSchema.optional_fields.length !== 0 ||
  bundleSchema.additional_fields
) {
  issues.push({ code: 'BUNDLE_SCHEMA_POLICY', message: bundleSchema.bundle_id_policy });
}
const schemaFields = bundleSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'BUNDLE_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of bundleSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'BUNDLE_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic bundle identity.
const identity = vendorReferenceBundle.deterministic_bundle_identity;
if (identity.identity_id !== 'dsc-vendor-reference-bundle-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.bundle_id !== VENDOR_REFERENCE_BUNDLE_ID ||
  identity.bundle_version !== VENDOR_REFERENCE_BUNDLE_VERSION ||
  identity.identity_policy !== 'opaque_bundle_id_no_vendor_binding' ||
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

// 3) Vendor Reference Package binding.
const binding = vendorReferenceBundle.vendor_reference_package_binding;
if (binding.binding_id !== 'dsc-vendor-reference-bundle-package-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.package_ref !== VENDOR_REFERENCE_PACKAGE_PATH ||
  binding.package_id !== VENDOR_REFERENCE_PACKAGE_ID ||
  binding.package_version !== VENDOR_REFERENCE_PACKAGE_VERSION ||
  binding.package_phase !== DSC_VENDOR_REFERENCE_PACKAGE_PHASE ||
  binding.package_system_id !== DSC_VENDOR_REFERENCE_PACKAGE_SYSTEM_ID ||
  binding.package_evidence_ref !== VENDOR_REFERENCE_PACKAGE_EVIDENCE_PATH ||
  binding.package_verdict !== VENDOR_REFERENCE_PACKAGE_VERDICT ||
  binding.package_evidence_mode !== 'phase_075_pass_verdict_gated_at_build_time' ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'bundle_root' ||
  binding.bundles_vendors_in_this_phase ||
  binding.implements_package_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}
if (
  binding.package_id !== referencePackage.package_id ||
  binding.package_version !== referencePackage.package_version
) {
  issues.push({ code: 'BINDING_PACKAGE_DRIFT', message: binding.package_id });
}

// 4) Bundle composition.
const composition = vendorReferenceBundle.bundle_composition;
if (composition.composition_id !== 'dsc-vendor-reference-bundle-composition-v1') {
  issues.push({ code: 'COMPOSITION_ID', message: composition.composition_id });
}
if (
  composition.root_section_id !== 'vendor_reference_package' ||
  composition.section_order !== 'fixed_declared_order' ||
  !composition.closed_set ||
  composition.vendor_specific_sections !== 'forbidden' ||
  composition.includes_implementations
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

// The bundle must never re-list what the package already owns.
const packageMemberRefs = new Set(
  referencePackage.package_manifest.entries.map((entry) => entry.artifact_ref)
);
for (const section of composition.sections) {
  if (section.section_id !== 'vendor_reference_package' &&
      packageMemberRefs.has(section.artifact_ref)) {
    issues.push({ code: 'SECTION_DUPLICATES_PACKAGE_MEMBER', message: section.artifact_ref });
  }
}
const transitive = composition.transitive_seal;
if (
  transitive.policy !== 'package_members_sealed_via_package_digest' ||
  transitive.sealed_via !== VENDOR_REFERENCE_PACKAGE_ID ||
  transitive.re_lists_package_members ||
  transitive.sealed_component_count !== referencePackage.package_manifest.entries.length
) {
  issues.push({ code: 'TRANSITIVE_SEAL', message: `${transitive.sealed_component_count}` });
}

// 5) Bundle manifest (content-addressed, read-only).
const manifest = vendorReferenceBundle.bundle_manifest;
if (manifest.manifest_id !== 'dsc-vendor-reference-bundle-manifest-v1') {
  issues.push({ code: 'MANIFEST_ID', message: manifest.manifest_id });
}
if (
  manifest.integrity_method !== 'sha256_content_addressed_read_only' ||
  manifest.bundle_digest_method !==
    'sha256_of_ordered_section_digests_and_sealed_package_digest' ||
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

// Transitive seal: recompute every package member and the package digest.
const packageManifest = referencePackage.package_manifest;
for (const entry of packageManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({ code: 'SEALED_MEMBER_DRIFT', message: entry.artifact_ref });
  }
}
const recomputedPackageDigest = crypto
  .createHash('sha256')
  .update(
    packageManifest.entries
      .map((entry) => `${entry.component_id}:${entry.sha256}`)
      .join('\n')
  )
  .digest('hex');
if (recomputedPackageDigest !== packageManifest.package_digest) {
  issues.push({ code: 'SEALED_PACKAGE_DIGEST_DRIFT', message: recomputedPackageDigest });
}
if (
  manifest.sealed_package_digest !== packageManifest.package_digest ||
  binding.sealed_package_digest !== packageManifest.package_digest
) {
  issues.push({
    code: 'SEALED_PACKAGE_DIGEST_MISMATCH',
    message: manifest.sealed_package_digest,
  });
}
if (
  manifest.sealed_component_count !== packageManifest.entries.length ||
  binding.sealed_component_count !== packageManifest.entries.length
) {
  issues.push({
    code: 'SEALED_COMPONENT_COUNT',
    message: `${manifest.sealed_component_count}`,
  });
}

const expectedBundleDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...manifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_package:${manifest.sealed_package_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (manifest.bundle_digest !== expectedBundleDigest) {
  issues.push({ code: 'BUNDLE_DIGEST_DRIFT', message: manifest.bundle_digest });
}

// Design only: no vendor bundled in this phase.
const bundled = vendorReferenceBundle.bundled_vendors;
if (
  bundled.count !== 0 ||
  bundled.entries.length !== 0 ||
  bundled.bundles_vendors_in_this_phase ||
  !bundled.bundling_policy
) {
  issues.push({ code: 'BUNDLED_VENDORS', message: `${bundled.count}` });
}

// Design constraints.
const constraints = vendorReferenceBundle.design_constraints;
if (
  !constraints.bundle_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_reference_package ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.bundles_vendors_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

// Reproducibility: a second build must produce a byte-identical artifact.
const firstSerialized = JSON.stringify(vendorReferenceBundle);
const rebuilt = buildDirectSpatialConditioningVendorReferenceBundle(projectRoot)
  .vendorReferenceBundle;
const rebuiltSerialized = JSON.stringify({
  ...rebuilt,
  created_at: vendorReferenceBundle.created_at,
});
if (firstSerialized !== rebuiltSerialized) {
  issues.push({ code: 'NON_REPRODUCIBLE', message: 'rebuild diverged from first build' });
}

for (const requiredArtifact of [VENDOR_REFERENCE_BUNDLE_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorReferenceBundle);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_reference_bundle_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_REFERENCE_BUNDLE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorReferenceBundle.mode,
  bundle_id: vendorReferenceBundle.bundle_id,
  bundle_version: vendorReferenceBundle.bundle_version,
  bundle_kind: vendorReferenceBundle.bundle_kind,
  bundle_schema: bundleSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_bundle_identity: identity.identity_id,
  vendor_reference_package_binding: binding.binding_id,
  package_verdict: binding.package_verdict,
  package_evidence_mode: binding.package_evidence_mode,
  bundle_composition: composition.composition_id,
  section_count: composition.sections.length,
  bundle_manifest: manifest.manifest_id,
  manifest_entry_count: manifest.entries.length,
  sealed_component_count: manifest.sealed_component_count,
  sealed_package_digest: manifest.sealed_package_digest,
  bundle_digest: manifest.bundle_digest,
  bundled_vendors: bundled.count,
  sources_supported: vendorReferenceBundle.sources_supported.length,
  reuses_certified_vendor_reference_package: true,
  vendor_neutral: true,
  design_constraints: vendorReferenceBundle.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_reference_bundle: VENDOR_REFERENCE_BUNDLE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    package: VENDOR_REFERENCE_PACKAGE_PATH,
    package_schema: VENDOR_REFERENCE_PACKAGE_SCHEMA_PATH,
    package_registry: VENDOR_REFERENCE_PACKAGE_REGISTRY_PATH,
    package_evidence: VENDOR_REFERENCE_PACKAGE_EVIDENCE_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_BUNDLE_VALIDATION_REPORT.json';
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
    `bundle_id=${report.bundle_id}`,
    `schema_fields=${report.schema_fields}`,
    `sections=${report.section_count}`,
    `manifest_entries=${report.manifest_entry_count}`,
    `sealed_components=${report.sealed_component_count}`,
    `bundled_vendors=${report.bundled_vendors}`,
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
