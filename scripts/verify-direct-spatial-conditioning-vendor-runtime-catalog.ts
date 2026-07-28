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
import { VENDOR_RUNTIME_PACKAGE_PATH } from '../services/directSpatialConditioningVendorRuntimePackageBuilder.js';
import { VENDOR_RUNTIME_BUNDLE_PATH } from '../services/directSpatialConditioningVendorRuntimeBundleBuilder.js';
import { VENDOR_RUNTIME_PROFILE_PATH } from '../services/directSpatialConditioningVendorRuntimeProfileBuilder.js';
import {
  DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID,
  VENDOR_RUNTIME_REGISTRY_PATH,
  type DirectSpatialConditioningVendorRuntimeRegistry,
} from '../services/directSpatialConditioningVendorRuntimeRegistryBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_RUNTIME_INDEX_PHASE,
  DSC_VENDOR_RUNTIME_INDEX_SYSTEM_ID,
  VENDOR_RUNTIME_INDEX_ID,
  VENDOR_RUNTIME_INDEX_PATH,
  VENDOR_RUNTIME_INDEX_VERSION,
  VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH,
  VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH,
  type DirectSpatialConditioningVendorRuntimeIndex,
} from '../services/directSpatialConditioningVendorRuntimeIndexBuilder.js';
import {
  DSC_VENDOR_RUNTIME_CATALOG_PHASE,
  DSC_VENDOR_RUNTIME_CATALOG_SYSTEM_ID,
  RUNTIME_CATALOG_SECTION_SPECS,
  VENDOR_RUNTIME_CATALOG_ID,
  VENDOR_RUNTIME_CATALOG_PATH,
  VENDOR_RUNTIME_CATALOG_VERSION,
  VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
  VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
  VENDOR_RUNTIME_INDEX_VERDICT,
  buildDirectSpatialConditioningVendorRuntimeCatalog,
  type DirectSpatialConditioningVendorRuntimeCatalog,
} from '../services/directSpatialConditioningVendorRuntimeCatalogBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CATALOG_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CATALOG_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-catalog.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-catalog-implementation-registry-v1.json';

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
  'runtime_catalog_id',
  'runtime_catalog_version',
  'runtime_catalog_kind',
  'runtime_index_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_runtime_catalog_identity',
  'vendor_runtime_index_binding',
  'runtime_catalog_composition',
  'runtime_catalog_manifest',
];

const EXPECTED_SECTION_IDS = RUNTIME_CATALOG_SECTION_SPECS.map((spec) => spec.section_id);

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
  VENDOR_RUNTIME_BUNDLE_PATH,
  VENDOR_RUNTIME_PROFILE_PATH,
  VENDOR_RUNTIME_REGISTRY_PATH,
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
  VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH,
  VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH,
  VENDOR_RUNTIME_INDEX_PATH,
  VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
  VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

for (const required of [
  VENDOR_RUNTIME_INDEX_PATH,
  VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
  VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing vendor runtime index input ${required}`);
    process.exit(1);
  }
}

const indexEvidence = readJson<{
  final_verdict?: string;
  validation_passed?: boolean;
  phase?: string;
  error_count?: number;
}>(VENDOR_RUNTIME_INDEX_EVIDENCE_PATH);
if (indexEvidence.validation_passed !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime index did not pass validation');
  process.exit(1);
}
if (indexEvidence.final_verdict !== VENDOR_RUNTIME_INDEX_VERDICT) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: runtime index evidence does not carry the PHASE-087 PASS verdict'
  );
  process.exit(1);
}
if (indexEvidence.phase !== DSC_VENDOR_RUNTIME_INDEX_PHASE) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: evidence does not cover the vendor runtime index');
  process.exit(1);
}

const runtimeIndex = readJson<DirectSpatialConditioningVendorRuntimeIndex>(
  VENDOR_RUNTIME_INDEX_PATH
);
if (runtimeIndex.system_id !== DSC_VENDOR_RUNTIME_INDEX_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime index system id mismatch');
  process.exit(1);
}

const runtimeRegistry = readJson<DirectSpatialConditioningVendorRuntimeRegistry>(
  VENDOR_RUNTIME_REGISTRY_PATH
);
if (runtimeRegistry.system_id !== DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime registry system id mismatch');
  process.exit(1);
}

let vendorRuntimeCatalog: DirectSpatialConditioningVendorRuntimeCatalog;
try {
  vendorRuntimeCatalog =
    buildDirectSpatialConditioningVendorRuntimeCatalog(projectRoot).vendorRuntimeCatalog;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME CATALOG FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (vendorRuntimeCatalog.phase !== DSC_VENDOR_RUNTIME_CATALOG_PHASE) {
  issues.push({ code: 'PHASE', message: vendorRuntimeCatalog.phase });
}
if (vendorRuntimeCatalog.system_id !== DSC_VENDOR_RUNTIME_CATALOG_SYSTEM_ID) {
  issues.push({ code: 'SYSTEM_ID', message: vendorRuntimeCatalog.system_id });
}
if (vendorRuntimeCatalog.mode !== 'design_only_vendor_runtime_catalog') {
  issues.push({ code: 'MODE', message: vendorRuntimeCatalog.mode });
}
if (vendorRuntimeCatalog.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorRuntimeCatalog.target });
}
if (vendorRuntimeCatalog.runtime_catalog_id !== VENDOR_RUNTIME_CATALOG_ID) {
  issues.push({ code: 'RUNTIME_CATALOG_ID', message: vendorRuntimeCatalog.runtime_catalog_id });
}
if (vendorRuntimeCatalog.runtime_catalog_version !== VENDOR_RUNTIME_CATALOG_VERSION) {
  issues.push({
    code: 'RUNTIME_CATALOG_VERSION',
    message: vendorRuntimeCatalog.runtime_catalog_version,
  });
}
if (vendorRuntimeCatalog.runtime_catalog_kind !== 'vendor_runtime_catalog') {
  issues.push({
    code: 'RUNTIME_CATALOG_KIND',
    message: vendorRuntimeCatalog.runtime_catalog_kind,
  });
}

const refChecks: Array<[string, string, string]> = [
  ['runtime_index_ref', vendorRuntimeCatalog.runtime_index_ref, VENDOR_RUNTIME_INDEX_PATH],
  [
    'runtime_index_schema_ref',
    vendorRuntimeCatalog.runtime_index_schema_ref,
    VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
  ],
  [
    'runtime_index_implementation_registry_ref',
    vendorRuntimeCatalog.runtime_index_implementation_registry_ref,
    VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_index_evidence_ref',
    vendorRuntimeCatalog.runtime_index_evidence_ref,
    VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
  ],
  [
    'runtime_registry_ref',
    vendorRuntimeCatalog.runtime_registry_ref,
    VENDOR_RUNTIME_REGISTRY_PATH,
  ],
  [
    'runtime_profile_ref',
    vendorRuntimeCatalog.runtime_profile_ref,
    VENDOR_RUNTIME_PROFILE_PATH,
  ],
  [
    'runtime_bundle_ref',
    vendorRuntimeCatalog.runtime_bundle_ref,
    VENDOR_RUNTIME_BUNDLE_PATH,
  ],
  [
    'runtime_package_ref',
    vendorRuntimeCatalog.runtime_package_ref,
    VENDOR_RUNTIME_PACKAGE_PATH,
  ],
  [
    'reference_bundle_ref',
    vendorRuntimeCatalog.reference_bundle_ref,
    VENDOR_REFERENCE_BUNDLE_PATH,
  ],
  ['package_ref', vendorRuntimeCatalog.package_ref, VENDOR_REFERENCE_PACKAGE_PATH],
  ['template_ref', vendorRuntimeCatalog.template_ref, VENDOR_IMPLEMENTATION_TEMPLATE_PATH],
  [
    'template_certification_ref',
    vendorRuntimeCatalog.template_certification_ref,
    VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  ],
  [
    'numerical_runtime_package_ref',
    vendorRuntimeCatalog.numerical_runtime_package_ref,
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
  JSON.stringify(vendorRuntimeCatalog.sources_supported) !== JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorRuntimeCatalog.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorRuntimeCatalog.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorRuntimeCatalog.required_channels.join(','),
  });
}
if (vendorRuntimeCatalog.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorRuntimeCatalog.spatial_frame_ref });
}
if (
  vendorRuntimeCatalog.capability_set_id !== CAPABILITY_SET_ID ||
  vendorRuntimeCatalog.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorRuntimeCatalog.capability_set_id}@${vendorRuntimeCatalog.capability_set_version}`,
  });
}

// 1) Runtime catalog schema.
const catalogSchema = vendorRuntimeCatalog.runtime_catalog_schema;
if (catalogSchema.schema_id !== 'dsc-vendor-runtime-catalog-schema-v1') {
  issues.push({ code: 'RUNTIME_CATALOG_SCHEMA_ID', message: catalogSchema.schema_id });
}
if (
  catalogSchema.encoding !== 'application/json' ||
  catalogSchema.runtime_catalog_id_policy !== 'opaque_runtime_catalog_id_no_vendor_binding' ||
  catalogSchema.runtime_index_ref !== VENDOR_RUNTIME_INDEX_ID ||
  catalogSchema.optional_fields.length !== 0 ||
  catalogSchema.additional_fields
) {
  issues.push({
    code: 'RUNTIME_CATALOG_SCHEMA_POLICY',
    message: catalogSchema.runtime_catalog_id_policy,
  });
}
const schemaFields = catalogSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'RUNTIME_CATALOG_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of catalogSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'RUNTIME_CATALOG_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic runtime catalog identity.
const identity = vendorRuntimeCatalog.deterministic_runtime_catalog_identity;
if (identity.identity_id !== 'dsc-vendor-runtime-catalog-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.runtime_catalog_id !== VENDOR_RUNTIME_CATALOG_ID ||
  identity.runtime_catalog_version !== VENDOR_RUNTIME_CATALOG_VERSION ||
  identity.identity_policy !== 'opaque_runtime_catalog_id_no_vendor_binding' ||
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

// 3) Vendor Runtime Index binding.
const binding = vendorRuntimeCatalog.vendor_runtime_index_binding;
if (binding.binding_id !== 'dsc-vendor-runtime-catalog-index-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.runtime_index_ref !== VENDOR_RUNTIME_INDEX_PATH ||
  binding.runtime_index_id !== VENDOR_RUNTIME_INDEX_ID ||
  binding.runtime_index_version !== VENDOR_RUNTIME_INDEX_VERSION ||
  binding.runtime_index_phase !== DSC_VENDOR_RUNTIME_INDEX_PHASE ||
  binding.runtime_index_system_id !== DSC_VENDOR_RUNTIME_INDEX_SYSTEM_ID ||
  binding.runtime_index_evidence_ref !== VENDOR_RUNTIME_INDEX_EVIDENCE_PATH ||
  binding.runtime_index_verdict !== VENDOR_RUNTIME_INDEX_VERDICT ||
  binding.runtime_index_evidence_mode !== 'phase_087_pass_verdict_gated_at_build_time' ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'runtime_catalog_root' ||
  binding.catalogs_runtime_in_this_phase ||
  binding.implements_runtime_index_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}
if (
  binding.runtime_index_id !== runtimeIndex.runtime_index_id ||
  binding.runtime_index_version !== runtimeIndex.runtime_index_version
) {
  issues.push({ code: 'BINDING_INDEX_DRIFT', message: binding.runtime_index_id });
}

// 4) Runtime catalog composition.
const composition = vendorRuntimeCatalog.runtime_catalog_composition;
if (composition.composition_id !== 'dsc-vendor-runtime-catalog-composition-v1') {
  issues.push({ code: 'COMPOSITION_ID', message: composition.composition_id });
}
if (
  composition.root_section_id !== 'vendor_runtime_index' ||
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

const runtimeIndexManifest = runtimeIndex.runtime_index_manifest;
const indexMemberRefs = new Set(
  runtimeIndexManifest.entries.map((entry) => entry.artifact_ref)
);
for (const section of composition.sections) {
  if (
    section.section_id !== 'vendor_runtime_index' &&
    indexMemberRefs.has(section.artifact_ref)
  ) {
    issues.push({
      code: 'SECTION_DUPLICATES_RUNTIME_INDEX_MEMBER',
      message: section.artifact_ref,
    });
  }
}
const transitive = composition.transitive_seal;
if (
  transitive.policy !== 'runtime_index_contents_sealed_via_runtime_index_digest' ||
  transitive.sealed_via !== VENDOR_RUNTIME_INDEX_ID ||
  transitive.re_lists_runtime_index_contents ||
  transitive.sealed_component_count !== runtimeIndexManifest.sealed_component_count
) {
  issues.push({ code: 'TRANSITIVE_SEAL', message: `${transitive.sealed_component_count}` });
}

// 5) Runtime catalog manifest.
const manifest = vendorRuntimeCatalog.runtime_catalog_manifest;
if (manifest.manifest_id !== 'dsc-vendor-runtime-catalog-manifest-v1') {
  issues.push({ code: 'MANIFEST_ID', message: manifest.manifest_id });
}
if (
  manifest.integrity_method !== 'sha256_content_addressed_read_only' ||
  manifest.runtime_catalog_digest_method !==
    'sha256_of_ordered_section_digests_and_sealed_runtime_index_digest' ||
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

for (const entry of runtimeIndexManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({
      code: 'SEALED_RUNTIME_INDEX_SECTION_DRIFT',
      message: entry.artifact_ref,
    });
  }
}
const recomputedRuntimeIndexDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimeIndexManifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_registry:${runtimeIndexManifest.sealed_runtime_registry_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (recomputedRuntimeIndexDigest !== runtimeIndexManifest.runtime_index_digest) {
  issues.push({
    code: 'SEALED_RUNTIME_INDEX_DIGEST_DRIFT',
    message: recomputedRuntimeIndexDigest,
  });
}

const runtimeRegistryManifest = runtimeRegistry.runtime_registry_manifest;
for (const entry of runtimeRegistryManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({
      code: 'SEALED_RUNTIME_REGISTRY_SECTION_DRIFT',
      message: entry.artifact_ref,
    });
  }
}
const recomputedRuntimeRegistryDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimeRegistryManifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_profile:${runtimeRegistryManifest.sealed_runtime_profile_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (recomputedRuntimeRegistryDigest !== runtimeRegistryManifest.runtime_registry_digest) {
  issues.push({
    code: 'SEALED_RUNTIME_REGISTRY_DIGEST_DRIFT',
    message: recomputedRuntimeRegistryDigest,
  });
}

if (
  manifest.sealed_runtime_index_digest !== runtimeIndexManifest.runtime_index_digest ||
  binding.sealed_runtime_index_digest !== runtimeIndexManifest.runtime_index_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_INDEX_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_index_digest,
  });
}
if (
  manifest.sealed_runtime_registry_digest !==
    runtimeIndexManifest.sealed_runtime_registry_digest ||
  binding.sealed_runtime_registry_digest !==
    runtimeIndexManifest.sealed_runtime_registry_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_REGISTRY_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_registry_digest,
  });
}
if (
  manifest.sealed_runtime_profile_digest !==
    runtimeIndexManifest.sealed_runtime_profile_digest ||
  binding.sealed_runtime_profile_digest !== runtimeIndexManifest.sealed_runtime_profile_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_digest,
  });
}
if (
  manifest.sealed_runtime_bundle_digest !==
    runtimeIndexManifest.sealed_runtime_bundle_digest ||
  binding.sealed_runtime_bundle_digest !== runtimeIndexManifest.sealed_runtime_bundle_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_BUNDLE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_bundle_digest,
  });
}
if (
  manifest.sealed_runtime_package_digest !==
    runtimeIndexManifest.sealed_runtime_package_digest ||
  binding.sealed_runtime_package_digest !== runtimeIndexManifest.sealed_runtime_package_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PACKAGE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_package_digest,
  });
}
if (
  manifest.sealed_component_count !== runtimeIndexManifest.sealed_component_count ||
  binding.sealed_component_count !== runtimeIndexManifest.sealed_component_count
) {
  issues.push({
    code: 'SEALED_COMPONENT_COUNT',
    message: `${manifest.sealed_component_count}`,
  });
}

const expectedRuntimeCatalogDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...manifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_index:${manifest.sealed_runtime_index_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (manifest.runtime_catalog_digest !== expectedRuntimeCatalogDigest) {
  issues.push({
    code: 'RUNTIME_CATALOG_DIGEST_DRIFT',
    message: manifest.runtime_catalog_digest,
  });
}

const cataloged = vendorRuntimeCatalog.cataloged_runtime_entries;
if (
  cataloged.count !== 0 ||
  cataloged.entries.length !== 0 ||
  cataloged.catalogs_runtime_in_this_phase ||
  !cataloged.cataloging_policy
) {
  issues.push({ code: 'CATALOGED_RUNTIME_ENTRIES', message: `${cataloged.count}` });
}

const constraints = vendorRuntimeCatalog.design_constraints;
if (
  !constraints.runtime_catalog_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_runtime_index ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.declares_runtime_execution ||
  constraints.catalogs_runtime_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

const firstSerialized = JSON.stringify(vendorRuntimeCatalog);
const rebuilt = buildDirectSpatialConditioningVendorRuntimeCatalog(projectRoot)
  .vendorRuntimeCatalog;
const rebuiltSerialized = JSON.stringify({
  ...rebuilt,
  created_at: vendorRuntimeCatalog.created_at,
});
if (firstSerialized !== rebuiltSerialized) {
  issues.push({ code: 'NON_REPRODUCIBLE', message: 'rebuild diverged from first build' });
}

for (const requiredArtifact of [VENDOR_RUNTIME_CATALOG_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorRuntimeCatalog);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_runtime_catalog_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_RUNTIME_CATALOG_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorRuntimeCatalog.mode,
  runtime_catalog_id: vendorRuntimeCatalog.runtime_catalog_id,
  runtime_catalog_version: vendorRuntimeCatalog.runtime_catalog_version,
  runtime_catalog_kind: vendorRuntimeCatalog.runtime_catalog_kind,
  runtime_catalog_schema: catalogSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_runtime_catalog_identity: identity.identity_id,
  vendor_runtime_index_binding: binding.binding_id,
  runtime_index_verdict: binding.runtime_index_verdict,
  runtime_index_evidence_mode: binding.runtime_index_evidence_mode,
  runtime_catalog_composition: composition.composition_id,
  section_count: composition.sections.length,
  runtime_catalog_manifest: manifest.manifest_id,
  manifest_entry_count: manifest.entries.length,
  sealed_component_count: manifest.sealed_component_count,
  sealed_runtime_index_digest: manifest.sealed_runtime_index_digest,
  runtime_catalog_digest: manifest.runtime_catalog_digest,
  cataloged_runtime_entries: cataloged.count,
  sources_supported: vendorRuntimeCatalog.sources_supported.length,
  reuses_certified_vendor_runtime_index: true,
  vendor_neutral: true,
  design_constraints: vendorRuntimeCatalog.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_runtime_catalog: VENDOR_RUNTIME_CATALOG_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    runtime_index: VENDOR_RUNTIME_INDEX_PATH,
    runtime_index_schema: VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
    runtime_index_implementation_registry: VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
    runtime_index_evidence: VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
    runtime_registry: VENDOR_RUNTIME_REGISTRY_PATH,
    runtime_registry_schema: VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH,
    runtime_registry_implementation_registry:
      VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
    runtime_registry_evidence: VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CATALOG_VALIDATION_REPORT.json';
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
    `runtime_catalog_id=${report.runtime_catalog_id}`,
    `schema_fields=${report.schema_fields}`,
    `sections=${report.section_count}`,
    `manifest_entries=${report.manifest_entry_count}`,
    `sealed_components=${report.sealed_component_count}`,
    `cataloged_runtime_entries=${report.cataloged_runtime_entries}`,
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
