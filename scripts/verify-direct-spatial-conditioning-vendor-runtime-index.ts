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
  DSC_VENDOR_RUNTIME_REGISTRY_PHASE,
  DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID,
  VENDOR_RUNTIME_REGISTRY_ID,
  VENDOR_RUNTIME_REGISTRY_PATH,
  VENDOR_RUNTIME_REGISTRY_VERSION,
  type DirectSpatialConditioningVendorRuntimeRegistry,
} from '../services/directSpatialConditioningVendorRuntimeRegistryBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_RUNTIME_INDEX_PHASE,
  RUNTIME_INDEX_SECTION_SPECS,
  VENDOR_RUNTIME_INDEX_ID,
  VENDOR_RUNTIME_INDEX_PATH,
  VENDOR_RUNTIME_INDEX_VERSION,
  VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH,
  VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH,
  VENDOR_RUNTIME_REGISTRY_VERDICT,
  buildDirectSpatialConditioningVendorRuntimeIndex,
  type DirectSpatialConditioningVendorRuntimeIndex,
} from '../services/directSpatialConditioningVendorRuntimeIndexBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_INDEX_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_INDEX_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-index.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-index-implementation-registry-v1.json';

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
  'runtime_index_id',
  'runtime_index_version',
  'runtime_index_kind',
  'runtime_registry_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_runtime_index_identity',
  'vendor_runtime_registry_binding',
  'runtime_index_composition',
  'runtime_index_manifest',
];

const EXPECTED_SECTION_IDS = RUNTIME_INDEX_SECTION_SPECS.map((spec) => spec.section_id);

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
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

for (const required of [
  VENDOR_RUNTIME_REGISTRY_PATH,
  VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH,
  VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing vendor runtime registry input ${required}`);
    process.exit(1);
  }
}

const registryEvidence = readJson<{
  final_verdict?: string;
  validation_passed?: boolean;
  phase?: string;
  error_count?: number;
}>(VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH);
if (registryEvidence.validation_passed !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime registry did not pass validation');
  process.exit(1);
}
if (registryEvidence.final_verdict !== VENDOR_RUNTIME_REGISTRY_VERDICT) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: runtime registry evidence does not carry the PHASE-085 PASS verdict'
  );
  process.exit(1);
}
if (registryEvidence.phase !== DSC_VENDOR_RUNTIME_REGISTRY_PHASE) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: evidence does not cover the vendor runtime registry');
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

let vendorRuntimeIndex: DirectSpatialConditioningVendorRuntimeIndex;
try {
  vendorRuntimeIndex =
    buildDirectSpatialConditioningVendorRuntimeIndex(projectRoot).vendorRuntimeIndex;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME INDEX FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (vendorRuntimeIndex.phase !== DSC_VENDOR_RUNTIME_INDEX_PHASE) {
  issues.push({ code: 'PHASE', message: vendorRuntimeIndex.phase });
}
if (vendorRuntimeIndex.mode !== 'design_only_vendor_runtime_index') {
  issues.push({ code: 'MODE', message: vendorRuntimeIndex.mode });
}
if (vendorRuntimeIndex.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorRuntimeIndex.target });
}
if (vendorRuntimeIndex.runtime_index_id !== VENDOR_RUNTIME_INDEX_ID) {
  issues.push({ code: 'RUNTIME_INDEX_ID', message: vendorRuntimeIndex.runtime_index_id });
}
if (vendorRuntimeIndex.runtime_index_version !== VENDOR_RUNTIME_INDEX_VERSION) {
  issues.push({
    code: 'RUNTIME_INDEX_VERSION',
    message: vendorRuntimeIndex.runtime_index_version,
  });
}
if (vendorRuntimeIndex.runtime_index_kind !== 'vendor_runtime_index') {
  issues.push({
    code: 'RUNTIME_INDEX_KIND',
    message: vendorRuntimeIndex.runtime_index_kind,
  });
}

const refChecks: Array<[string, string, string]> = [
  [
    'runtime_registry_ref',
    vendorRuntimeIndex.runtime_registry_ref,
    VENDOR_RUNTIME_REGISTRY_PATH,
  ],
  [
    'runtime_registry_schema_ref',
    vendorRuntimeIndex.runtime_registry_schema_ref,
    VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH,
  ],
  [
    'runtime_registry_implementation_registry_ref',
    vendorRuntimeIndex.runtime_registry_implementation_registry_ref,
    VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_registry_evidence_ref',
    vendorRuntimeIndex.runtime_registry_evidence_ref,
    VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH,
  ],
  [
    'runtime_profile_ref',
    vendorRuntimeIndex.runtime_profile_ref,
    VENDOR_RUNTIME_PROFILE_PATH,
  ],
  [
    'runtime_bundle_ref',
    vendorRuntimeIndex.runtime_bundle_ref,
    VENDOR_RUNTIME_BUNDLE_PATH,
  ],
  [
    'runtime_package_ref',
    vendorRuntimeIndex.runtime_package_ref,
    VENDOR_RUNTIME_PACKAGE_PATH,
  ],
  [
    'reference_bundle_ref',
    vendorRuntimeIndex.reference_bundle_ref,
    VENDOR_REFERENCE_BUNDLE_PATH,
  ],
  ['package_ref', vendorRuntimeIndex.package_ref, VENDOR_REFERENCE_PACKAGE_PATH],
  ['template_ref', vendorRuntimeIndex.template_ref, VENDOR_IMPLEMENTATION_TEMPLATE_PATH],
  [
    'template_certification_ref',
    vendorRuntimeIndex.template_certification_ref,
    VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  ],
  [
    'numerical_runtime_package_ref',
    vendorRuntimeIndex.numerical_runtime_package_ref,
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
  JSON.stringify(vendorRuntimeIndex.sources_supported) !== JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorRuntimeIndex.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorRuntimeIndex.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorRuntimeIndex.required_channels.join(','),
  });
}
if (vendorRuntimeIndex.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorRuntimeIndex.spatial_frame_ref });
}
if (
  vendorRuntimeIndex.capability_set_id !== CAPABILITY_SET_ID ||
  vendorRuntimeIndex.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorRuntimeIndex.capability_set_id}@${vendorRuntimeIndex.capability_set_version}`,
  });
}

// 1) Runtime index schema.
const indexSchema = vendorRuntimeIndex.runtime_index_schema;
if (indexSchema.schema_id !== 'dsc-vendor-runtime-index-schema-v1') {
  issues.push({ code: 'RUNTIME_INDEX_SCHEMA_ID', message: indexSchema.schema_id });
}
if (
  indexSchema.encoding !== 'application/json' ||
  indexSchema.runtime_index_id_policy !== 'opaque_runtime_index_id_no_vendor_binding' ||
  indexSchema.runtime_registry_ref !== VENDOR_RUNTIME_REGISTRY_ID ||
  indexSchema.optional_fields.length !== 0 ||
  indexSchema.additional_fields
) {
  issues.push({
    code: 'RUNTIME_INDEX_SCHEMA_POLICY',
    message: indexSchema.runtime_index_id_policy,
  });
}
const schemaFields = indexSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'RUNTIME_INDEX_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of indexSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'RUNTIME_INDEX_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic runtime index identity.
const identity = vendorRuntimeIndex.deterministic_runtime_index_identity;
if (identity.identity_id !== 'dsc-vendor-runtime-index-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.runtime_index_id !== VENDOR_RUNTIME_INDEX_ID ||
  identity.runtime_index_version !== VENDOR_RUNTIME_INDEX_VERSION ||
  identity.identity_policy !== 'opaque_runtime_index_id_no_vendor_binding' ||
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

// 3) Vendor Runtime Registry binding.
const binding = vendorRuntimeIndex.vendor_runtime_registry_binding;
if (binding.binding_id !== 'dsc-vendor-runtime-index-registry-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.runtime_registry_ref !== VENDOR_RUNTIME_REGISTRY_PATH ||
  binding.runtime_registry_id !== VENDOR_RUNTIME_REGISTRY_ID ||
  binding.runtime_registry_version !== VENDOR_RUNTIME_REGISTRY_VERSION ||
  binding.runtime_registry_phase !== DSC_VENDOR_RUNTIME_REGISTRY_PHASE ||
  binding.runtime_registry_system_id !== DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID ||
  binding.runtime_registry_evidence_ref !== VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH ||
  binding.runtime_registry_verdict !== VENDOR_RUNTIME_REGISTRY_VERDICT ||
  binding.runtime_registry_evidence_mode !== 'phase_085_pass_verdict_gated_at_build_time' ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'runtime_index_root' ||
  binding.indexes_runtime_in_this_phase ||
  binding.implements_runtime_registry_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}
if (
  binding.runtime_registry_id !== runtimeRegistry.runtime_registry_id ||
  binding.runtime_registry_version !== runtimeRegistry.runtime_registry_version
) {
  issues.push({ code: 'BINDING_REGISTRY_DRIFT', message: binding.runtime_registry_id });
}

// 4) Runtime index composition.
const composition = vendorRuntimeIndex.runtime_index_composition;
if (composition.composition_id !== 'dsc-vendor-runtime-index-composition-v1') {
  issues.push({ code: 'COMPOSITION_ID', message: composition.composition_id });
}
if (
  composition.root_section_id !== 'vendor_runtime_registry' ||
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

const registryMemberRefs = new Set(
  runtimeRegistry.runtime_registry_manifest.entries.map((entry) => entry.artifact_ref)
);
for (const section of composition.sections) {
  if (
    section.section_id !== 'vendor_runtime_registry' &&
    registryMemberRefs.has(section.artifact_ref)
  ) {
    issues.push({
      code: 'SECTION_DUPLICATES_RUNTIME_REGISTRY_MEMBER',
      message: section.artifact_ref,
    });
  }
}
const transitive = composition.transitive_seal;
if (
  transitive.policy !== 'runtime_registry_contents_sealed_via_runtime_registry_digest' ||
  transitive.sealed_via !== VENDOR_RUNTIME_REGISTRY_ID ||
  transitive.re_lists_runtime_registry_contents ||
  transitive.sealed_component_count !==
    runtimeRegistry.runtime_registry_manifest.sealed_component_count
) {
  issues.push({ code: 'TRANSITIVE_SEAL', message: `${transitive.sealed_component_count}` });
}

// 5) Runtime index manifest.
const manifest = vendorRuntimeIndex.runtime_index_manifest;
if (manifest.manifest_id !== 'dsc-vendor-runtime-index-manifest-v1') {
  issues.push({ code: 'MANIFEST_ID', message: manifest.manifest_id });
}
if (
  manifest.integrity_method !== 'sha256_content_addressed_read_only' ||
  manifest.runtime_index_digest_method !==
    'sha256_of_ordered_section_digests_and_sealed_runtime_registry_digest' ||
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
  manifest.sealed_runtime_registry_digest !==
    runtimeRegistryManifest.runtime_registry_digest ||
  binding.sealed_runtime_registry_digest !==
    runtimeRegistryManifest.runtime_registry_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_REGISTRY_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_registry_digest,
  });
}
if (
  manifest.sealed_runtime_profile_digest !==
    runtimeRegistryManifest.sealed_runtime_profile_digest ||
  binding.sealed_runtime_profile_digest !==
    runtimeRegistryManifest.sealed_runtime_profile_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_digest,
  });
}
if (
  manifest.sealed_runtime_bundle_digest !==
    runtimeRegistryManifest.sealed_runtime_bundle_digest ||
  binding.sealed_runtime_bundle_digest !==
    runtimeRegistryManifest.sealed_runtime_bundle_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_BUNDLE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_bundle_digest,
  });
}
if (
  manifest.sealed_runtime_package_digest !==
    runtimeRegistryManifest.sealed_runtime_package_digest ||
  binding.sealed_runtime_package_digest !==
    runtimeRegistryManifest.sealed_runtime_package_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PACKAGE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_package_digest,
  });
}
if (
  manifest.sealed_component_count !== runtimeRegistryManifest.sealed_component_count ||
  binding.sealed_component_count !== runtimeRegistryManifest.sealed_component_count
) {
  issues.push({
    code: 'SEALED_COMPONENT_COUNT',
    message: `${manifest.sealed_component_count}`,
  });
}

const expectedRuntimeIndexDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...manifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_registry:${manifest.sealed_runtime_registry_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (manifest.runtime_index_digest !== expectedRuntimeIndexDigest) {
  issues.push({
    code: 'RUNTIME_INDEX_DIGEST_DRIFT',
    message: manifest.runtime_index_digest,
  });
}

const indexed = vendorRuntimeIndex.indexed_runtime_entries;
if (
  indexed.count !== 0 ||
  indexed.entries.length !== 0 ||
  indexed.indexes_runtime_in_this_phase ||
  !indexed.indexing_policy
) {
  issues.push({ code: 'INDEXED_RUNTIME_ENTRIES', message: `${indexed.count}` });
}

const constraints = vendorRuntimeIndex.design_constraints;
if (
  !constraints.runtime_index_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_runtime_registry ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.declares_runtime_execution ||
  constraints.indexes_runtime_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

const firstSerialized = JSON.stringify(vendorRuntimeIndex);
const rebuilt = buildDirectSpatialConditioningVendorRuntimeIndex(projectRoot)
  .vendorRuntimeIndex;
const rebuiltSerialized = JSON.stringify({
  ...rebuilt,
  created_at: vendorRuntimeIndex.created_at,
});
if (firstSerialized !== rebuiltSerialized) {
  issues.push({ code: 'NON_REPRODUCIBLE', message: 'rebuild diverged from first build' });
}

for (const requiredArtifact of [VENDOR_RUNTIME_INDEX_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorRuntimeIndex);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_runtime_index_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_RUNTIME_INDEX_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorRuntimeIndex.mode,
  runtime_index_id: vendorRuntimeIndex.runtime_index_id,
  runtime_index_version: vendorRuntimeIndex.runtime_index_version,
  runtime_index_kind: vendorRuntimeIndex.runtime_index_kind,
  runtime_index_schema: indexSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_runtime_index_identity: identity.identity_id,
  vendor_runtime_registry_binding: binding.binding_id,
  runtime_registry_verdict: binding.runtime_registry_verdict,
  runtime_registry_evidence_mode: binding.runtime_registry_evidence_mode,
  runtime_index_composition: composition.composition_id,
  section_count: composition.sections.length,
  runtime_index_manifest: manifest.manifest_id,
  manifest_entry_count: manifest.entries.length,
  sealed_component_count: manifest.sealed_component_count,
  sealed_runtime_registry_digest: manifest.sealed_runtime_registry_digest,
  runtime_index_digest: manifest.runtime_index_digest,
  indexed_runtime_entries: indexed.count,
  sources_supported: vendorRuntimeIndex.sources_supported.length,
  reuses_certified_vendor_runtime_registry: true,
  vendor_neutral: true,
  design_constraints: vendorRuntimeIndex.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_runtime_index: VENDOR_RUNTIME_INDEX_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
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
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_INDEX_VALIDATION_REPORT.json';
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
    `runtime_index_id=${report.runtime_index_id}`,
    `schema_fields=${report.schema_fields}`,
    `sections=${report.section_count}`,
    `manifest_entries=${report.manifest_entry_count}`,
    `sealed_components=${report.sealed_component_count}`,
    `indexed_runtime_entries=${report.indexed_runtime_entries}`,
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
