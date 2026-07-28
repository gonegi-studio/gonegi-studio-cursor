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
import { VENDOR_REFERENCE_BUNDLE_PATH } from '../services/directSpatialConditioningVendorReferenceBundleBuilder.js';
import {
  DSC_VENDOR_RUNTIME_PACKAGE_PHASE,
  DSC_VENDOR_RUNTIME_PACKAGE_SYSTEM_ID,
  VENDOR_RUNTIME_PACKAGE_ID,
  VENDOR_RUNTIME_PACKAGE_PATH,
  VENDOR_RUNTIME_PACKAGE_VERSION,
  type DirectSpatialConditioningVendorRuntimePackage,
} from '../services/directSpatialConditioningVendorRuntimePackageBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_RUNTIME_BUNDLE_PHASE,
  RUNTIME_BUNDLE_SECTION_SPECS,
  VENDOR_RUNTIME_BUNDLE_ID,
  VENDOR_RUNTIME_BUNDLE_PATH,
  VENDOR_RUNTIME_BUNDLE_VERSION,
  VENDOR_RUNTIME_PACKAGE_EVIDENCE_PATH,
  VENDOR_RUNTIME_PACKAGE_REGISTRY_PATH,
  VENDOR_RUNTIME_PACKAGE_SCHEMA_PATH,
  VENDOR_RUNTIME_PACKAGE_VERDICT,
  buildDirectSpatialConditioningVendorRuntimeBundle,
  type DirectSpatialConditioningVendorRuntimeBundle,
} from '../services/directSpatialConditioningVendorRuntimeBundleBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BUNDLE_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BUNDLE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-bundle.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-bundle-registry-v1.json';

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
  'runtime_bundle_id',
  'runtime_bundle_version',
  'runtime_bundle_kind',
  'runtime_package_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_runtime_bundle_identity',
  'vendor_runtime_package_binding',
  'runtime_bundle_composition',
  'runtime_bundle_manifest',
];

const EXPECTED_SECTION_IDS = RUNTIME_BUNDLE_SECTION_SPECS.map((spec) => spec.section_id);

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
  VENDOR_RUNTIME_PACKAGE_PATH,
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
  VENDOR_RUNTIME_PACKAGE_SCHEMA_PATH,
  VENDOR_RUNTIME_PACKAGE_REGISTRY_PATH,
  VENDOR_RUNTIME_PACKAGE_EVIDENCE_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

for (const required of [
  VENDOR_RUNTIME_PACKAGE_PATH,
  VENDOR_RUNTIME_PACKAGE_SCHEMA_PATH,
  VENDOR_RUNTIME_PACKAGE_REGISTRY_PATH,
  VENDOR_RUNTIME_PACKAGE_EVIDENCE_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing vendor runtime package input ${required}`);
    process.exit(1);
  }
}

const packageEvidence = readJson<{
  final_verdict?: string;
  validation_passed?: boolean;
  phase?: string;
  error_count?: number;
}>(VENDOR_RUNTIME_PACKAGE_EVIDENCE_PATH);
if (packageEvidence.validation_passed !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime package did not pass validation');
  process.exit(1);
}
if (packageEvidence.final_verdict !== VENDOR_RUNTIME_PACKAGE_VERDICT) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: runtime package evidence does not carry the PHASE-079 PASS verdict'
  );
  process.exit(1);
}
if (packageEvidence.phase !== DSC_VENDOR_RUNTIME_PACKAGE_PHASE) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: evidence does not cover the vendor runtime package');
  process.exit(1);
}

const runtimePackage = readJson<DirectSpatialConditioningVendorRuntimePackage>(
  VENDOR_RUNTIME_PACKAGE_PATH
);
if (runtimePackage.system_id !== DSC_VENDOR_RUNTIME_PACKAGE_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime package system id mismatch');
  process.exit(1);
}

let vendorRuntimeBundle: DirectSpatialConditioningVendorRuntimeBundle;
try {
  vendorRuntimeBundle =
    buildDirectSpatialConditioningVendorRuntimeBundle(projectRoot).vendorRuntimeBundle;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME BUNDLE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (vendorRuntimeBundle.phase !== DSC_VENDOR_RUNTIME_BUNDLE_PHASE) {
  issues.push({ code: 'PHASE', message: vendorRuntimeBundle.phase });
}
if (vendorRuntimeBundle.mode !== 'design_only_vendor_runtime_bundle') {
  issues.push({ code: 'MODE', message: vendorRuntimeBundle.mode });
}
if (vendorRuntimeBundle.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorRuntimeBundle.target });
}
if (vendorRuntimeBundle.runtime_bundle_id !== VENDOR_RUNTIME_BUNDLE_ID) {
  issues.push({ code: 'RUNTIME_BUNDLE_ID', message: vendorRuntimeBundle.runtime_bundle_id });
}
if (vendorRuntimeBundle.runtime_bundle_version !== VENDOR_RUNTIME_BUNDLE_VERSION) {
  issues.push({
    code: 'RUNTIME_BUNDLE_VERSION',
    message: vendorRuntimeBundle.runtime_bundle_version,
  });
}
if (vendorRuntimeBundle.runtime_bundle_kind !== 'vendor_runtime_bundle') {
  issues.push({
    code: 'RUNTIME_BUNDLE_KIND',
    message: vendorRuntimeBundle.runtime_bundle_kind,
  });
}

const refChecks: Array<[string, string, string]> = [
  [
    'runtime_package_ref',
    vendorRuntimeBundle.runtime_package_ref,
    VENDOR_RUNTIME_PACKAGE_PATH,
  ],
  [
    'runtime_package_schema_ref',
    vendorRuntimeBundle.runtime_package_schema_ref,
    VENDOR_RUNTIME_PACKAGE_SCHEMA_PATH,
  ],
  [
    'runtime_package_registry_ref',
    vendorRuntimeBundle.runtime_package_registry_ref,
    VENDOR_RUNTIME_PACKAGE_REGISTRY_PATH,
  ],
  [
    'runtime_package_evidence_ref',
    vendorRuntimeBundle.runtime_package_evidence_ref,
    VENDOR_RUNTIME_PACKAGE_EVIDENCE_PATH,
  ],
  [
    'reference_bundle_ref',
    vendorRuntimeBundle.reference_bundle_ref,
    VENDOR_REFERENCE_BUNDLE_PATH,
  ],
  ['package_ref', vendorRuntimeBundle.package_ref, VENDOR_REFERENCE_PACKAGE_PATH],
  ['template_ref', vendorRuntimeBundle.template_ref, VENDOR_IMPLEMENTATION_TEMPLATE_PATH],
  [
    'template_certification_ref',
    vendorRuntimeBundle.template_certification_ref,
    VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  ],
  [
    'numerical_runtime_package_ref',
    vendorRuntimeBundle.numerical_runtime_package_ref,
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
  JSON.stringify(vendorRuntimeBundle.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorRuntimeBundle.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorRuntimeBundle.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorRuntimeBundle.required_channels.join(','),
  });
}
if (vendorRuntimeBundle.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorRuntimeBundle.spatial_frame_ref });
}
if (
  vendorRuntimeBundle.capability_set_id !== CAPABILITY_SET_ID ||
  vendorRuntimeBundle.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorRuntimeBundle.capability_set_id}@${vendorRuntimeBundle.capability_set_version}`,
  });
}

// 1) Runtime bundle schema.
const runtimeBundleSchema = vendorRuntimeBundle.runtime_bundle_schema;
if (runtimeBundleSchema.schema_id !== 'dsc-vendor-runtime-bundle-schema-v1') {
  issues.push({ code: 'RUNTIME_BUNDLE_SCHEMA_ID', message: runtimeBundleSchema.schema_id });
}
if (
  runtimeBundleSchema.encoding !== 'application/json' ||
  runtimeBundleSchema.runtime_bundle_id_policy !==
    'opaque_runtime_bundle_id_no_vendor_binding' ||
  runtimeBundleSchema.runtime_package_ref !== VENDOR_RUNTIME_PACKAGE_ID ||
  runtimeBundleSchema.optional_fields.length !== 0 ||
  runtimeBundleSchema.additional_fields
) {
  issues.push({
    code: 'RUNTIME_BUNDLE_SCHEMA_POLICY',
    message: runtimeBundleSchema.runtime_bundle_id_policy,
  });
}
const schemaFields = runtimeBundleSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'RUNTIME_BUNDLE_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of runtimeBundleSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'RUNTIME_BUNDLE_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic runtime bundle identity.
const identity = vendorRuntimeBundle.deterministic_runtime_bundle_identity;
if (identity.identity_id !== 'dsc-vendor-runtime-bundle-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.runtime_bundle_id !== VENDOR_RUNTIME_BUNDLE_ID ||
  identity.runtime_bundle_version !== VENDOR_RUNTIME_BUNDLE_VERSION ||
  identity.identity_policy !== 'opaque_runtime_bundle_id_no_vendor_binding' ||
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

// 3) Vendor Runtime Package binding.
const binding = vendorRuntimeBundle.vendor_runtime_package_binding;
if (binding.binding_id !== 'dsc-vendor-runtime-bundle-package-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.runtime_package_ref !== VENDOR_RUNTIME_PACKAGE_PATH ||
  binding.runtime_package_id !== VENDOR_RUNTIME_PACKAGE_ID ||
  binding.runtime_package_version !== VENDOR_RUNTIME_PACKAGE_VERSION ||
  binding.runtime_package_phase !== DSC_VENDOR_RUNTIME_PACKAGE_PHASE ||
  binding.runtime_package_system_id !== DSC_VENDOR_RUNTIME_PACKAGE_SYSTEM_ID ||
  binding.runtime_package_evidence_ref !== VENDOR_RUNTIME_PACKAGE_EVIDENCE_PATH ||
  binding.runtime_package_verdict !== VENDOR_RUNTIME_PACKAGE_VERDICT ||
  binding.runtime_package_evidence_mode !== 'phase_079_pass_verdict_gated_at_build_time' ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'runtime_bundle_root' ||
  binding.bundles_runtime_in_this_phase ||
  binding.implements_runtime_package_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}
if (
  binding.runtime_package_id !== runtimePackage.runtime_package_id ||
  binding.runtime_package_version !== runtimePackage.runtime_package_version
) {
  issues.push({ code: 'BINDING_PACKAGE_DRIFT', message: binding.runtime_package_id });
}

// 4) Runtime bundle composition.
const composition = vendorRuntimeBundle.runtime_bundle_composition;
if (composition.composition_id !== 'dsc-vendor-runtime-bundle-composition-v1') {
  issues.push({ code: 'COMPOSITION_ID', message: composition.composition_id });
}
if (
  composition.root_section_id !== 'vendor_runtime_package' ||
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

const packageMemberRefs = new Set(
  runtimePackage.runtime_package_manifest.entries.map((entry) => entry.artifact_ref)
);
for (const section of composition.sections) {
  if (
    section.section_id !== 'vendor_runtime_package' &&
    packageMemberRefs.has(section.artifact_ref)
  ) {
    issues.push({
      code: 'SECTION_DUPLICATES_RUNTIME_PACKAGE_MEMBER',
      message: section.artifact_ref,
    });
  }
}
const transitive = composition.transitive_seal;
if (
  transitive.policy !== 'runtime_package_contents_sealed_via_runtime_package_digest' ||
  transitive.sealed_via !== VENDOR_RUNTIME_PACKAGE_ID ||
  transitive.re_lists_runtime_package_contents ||
  transitive.sealed_component_count !==
    runtimePackage.runtime_package_manifest.sealed_component_count
) {
  issues.push({ code: 'TRANSITIVE_SEAL', message: `${transitive.sealed_component_count}` });
}

// 5) Runtime bundle manifest.
const manifest = vendorRuntimeBundle.runtime_bundle_manifest;
if (manifest.manifest_id !== 'dsc-vendor-runtime-bundle-manifest-v1') {
  issues.push({ code: 'MANIFEST_ID', message: manifest.manifest_id });
}
if (
  manifest.integrity_method !== 'sha256_content_addressed_read_only' ||
  manifest.runtime_bundle_digest_method !==
    'sha256_of_ordered_section_digests_and_sealed_runtime_package_digest' ||
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

const runtimePackageManifest = runtimePackage.runtime_package_manifest;
for (const entry of runtimePackageManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({
      code: 'SEALED_RUNTIME_PACKAGE_SECTION_DRIFT',
      message: entry.artifact_ref,
    });
  }
}
const recomputedRuntimePackageDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimePackageManifest.entries.map(
        (entry) => `${entry.section_id}:${entry.sha256}`
      ),
      `sealed_bundle:${runtimePackageManifest.sealed_bundle_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (recomputedRuntimePackageDigest !== runtimePackageManifest.runtime_package_digest) {
  issues.push({
    code: 'SEALED_RUNTIME_PACKAGE_DIGEST_DRIFT',
    message: recomputedRuntimePackageDigest,
  });
}
if (
  manifest.sealed_runtime_package_digest !== runtimePackageManifest.runtime_package_digest ||
  binding.sealed_runtime_package_digest !== runtimePackageManifest.runtime_package_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PACKAGE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_package_digest,
  });
}
if (
  manifest.sealed_bundle_digest !== runtimePackageManifest.sealed_bundle_digest ||
  binding.sealed_bundle_digest !== runtimePackageManifest.sealed_bundle_digest
) {
  issues.push({
    code: 'SEALED_BUNDLE_DIGEST_MISMATCH',
    message: manifest.sealed_bundle_digest,
  });
}
if (
  manifest.sealed_package_digest !== runtimePackageManifest.sealed_package_digest ||
  binding.sealed_package_digest !== runtimePackageManifest.sealed_package_digest
) {
  issues.push({
    code: 'SEALED_PACKAGE_DIGEST_MISMATCH',
    message: manifest.sealed_package_digest,
  });
}
if (
  manifest.sealed_component_count !== runtimePackageManifest.sealed_component_count ||
  binding.sealed_component_count !== runtimePackageManifest.sealed_component_count
) {
  issues.push({
    code: 'SEALED_COMPONENT_COUNT',
    message: `${manifest.sealed_component_count}`,
  });
}

const expectedRuntimeBundleDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...manifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_package:${manifest.sealed_runtime_package_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (manifest.runtime_bundle_digest !== expectedRuntimeBundleDigest) {
  issues.push({
    code: 'RUNTIME_BUNDLE_DIGEST_DRIFT',
    message: manifest.runtime_bundle_digest,
  });
}

const bundled = vendorRuntimeBundle.runtime_bundled_vendors;
if (
  bundled.count !== 0 ||
  bundled.entries.length !== 0 ||
  bundled.bundles_runtime_in_this_phase ||
  !bundled.bundling_policy
) {
  issues.push({ code: 'RUNTIME_BUNDLED_VENDORS', message: `${bundled.count}` });
}

const constraints = vendorRuntimeBundle.design_constraints;
if (
  !constraints.runtime_bundle_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_runtime_package ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.declares_runtime_execution ||
  constraints.bundles_runtime_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

const firstSerialized = JSON.stringify(vendorRuntimeBundle);
const rebuilt = buildDirectSpatialConditioningVendorRuntimeBundle(projectRoot)
  .vendorRuntimeBundle;
const rebuiltSerialized = JSON.stringify({
  ...rebuilt,
  created_at: vendorRuntimeBundle.created_at,
});
if (firstSerialized !== rebuiltSerialized) {
  issues.push({ code: 'NON_REPRODUCIBLE', message: 'rebuild diverged from first build' });
}

for (const requiredArtifact of [VENDOR_RUNTIME_BUNDLE_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorRuntimeBundle);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_runtime_bundle_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_RUNTIME_BUNDLE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorRuntimeBundle.mode,
  runtime_bundle_id: vendorRuntimeBundle.runtime_bundle_id,
  runtime_bundle_version: vendorRuntimeBundle.runtime_bundle_version,
  runtime_bundle_kind: vendorRuntimeBundle.runtime_bundle_kind,
  runtime_bundle_schema: runtimeBundleSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_runtime_bundle_identity: identity.identity_id,
  vendor_runtime_package_binding: binding.binding_id,
  runtime_package_verdict: binding.runtime_package_verdict,
  runtime_package_evidence_mode: binding.runtime_package_evidence_mode,
  runtime_bundle_composition: composition.composition_id,
  section_count: composition.sections.length,
  runtime_bundle_manifest: manifest.manifest_id,
  manifest_entry_count: manifest.entries.length,
  sealed_component_count: manifest.sealed_component_count,
  sealed_runtime_package_digest: manifest.sealed_runtime_package_digest,
  runtime_bundle_digest: manifest.runtime_bundle_digest,
  runtime_bundled_vendors: bundled.count,
  sources_supported: vendorRuntimeBundle.sources_supported.length,
  reuses_certified_vendor_runtime_package: true,
  vendor_neutral: true,
  design_constraints: vendorRuntimeBundle.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_runtime_bundle: VENDOR_RUNTIME_BUNDLE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    runtime_package: VENDOR_RUNTIME_PACKAGE_PATH,
    runtime_package_schema: VENDOR_RUNTIME_PACKAGE_SCHEMA_PATH,
    runtime_package_registry: VENDOR_RUNTIME_PACKAGE_REGISTRY_PATH,
    runtime_package_evidence: VENDOR_RUNTIME_PACKAGE_EVIDENCE_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BUNDLE_VALIDATION_REPORT.json';
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
    `runtime_bundle_id=${report.runtime_bundle_id}`,
    `schema_fields=${report.schema_fields}`,
    `sections=${report.section_count}`,
    `manifest_entries=${report.manifest_entry_count}`,
    `sealed_components=${report.sealed_component_count}`,
    `runtime_bundled_vendors=${report.runtime_bundled_vendors}`,
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
