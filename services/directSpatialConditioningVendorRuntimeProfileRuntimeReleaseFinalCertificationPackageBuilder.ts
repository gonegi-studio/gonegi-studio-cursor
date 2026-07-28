import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';
import {
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
} from './directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import { SOURCE_IDS } from './numericalReconstructionExportBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseFinalPackage,
  DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_ID,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseFinalPackage,
} from './directSpatialConditioningVendorRuntimeProfileRuntimeReleaseFinalPackageBuilder.js';

/**
 * PHASE-DSC-178: Direct Spatial Conditioning vendor runtime profile runtime release final package.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Describes the PHASE-DSC-177 Vendor
 * Runtime Profile Runtime Archive Certification Report as the sole design-time runtime archive final bundle root:
 *   - runtime profile runtime release final package runtime archive schema,
 *   - deterministic runtime profile runtime release final package runtime archive identity,
 *   - Vendor Runtime Profile Runtime Release Final Package binding,
 *   - runtime profile runtime release final package runtime archive composition, and
 *   - runtime profile runtime release final package runtime archive manifest.
 *
 * The profile runtime release final package runtime archive seals three design sections directly (runtime profile runtime release final package
 * artifact, schema, implementation registry) and seals everything the profile runtime release final package
 * owns transitively through the runtime profile runtime release final package digest. It defines
 * no concrete profile runtime release final package runtime archive runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 *
 * This certification package is gated on the recorded PHASE-DSC-177 PASS
 * verdict rather than a dedicated certification artifact.
 */

export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_PHASE = 'PHASE-DSC-178' as const;
export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_V1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_PATH =
  `${VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_ROOT}/direct-spatial-conditioning-vendor-runtime-profile-runtime-release-final-certification-package-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime profile runtime release final package runtime archive. */
export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_ID =
  'dsc-vendor-runtime-profile-runtime-release-final-certification-package-v1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-DSC-177 vendor runtime profile runtime release final package. */
export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_EVIDENCE_PATH =
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_VALIDATION_REPORT_PATH;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_V1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-runtime-release-final-certification-package.schema.json' as const;
export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-runtime-release-final-certification-package-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime profile runtime release final package runtime archive sections. Only the profile runtime release final package runtime archive's own
 * design-time publication set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_profile_runtime_release_final_package_artifact'
    | 'runtime_profile_runtime_release_final_package_schema'
    | 'runtime_profile_runtime_release_final_package_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_profile_runtime_release_final_certification_package',
    role: 'runtime_profile_runtime_release_final_certification_package_root_profile_runtime_release_final_package',
    kind: 'runtime_profile_runtime_release_final_package_artifact',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_runtime_release_final_certification_package_schema',
    role: 'runtime_profile_runtime_release_final_package_shape_contract',
    kind: 'runtime_profile_runtime_release_final_package_schema',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_runtime_release_final_certification_package_implementation_registry',
    role: 'runtime_profile_runtime_release_final_package_provenance_registry',
    kind: 'runtime_profile_runtime_release_final_package_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeProfileRuntimeReleaseFinalCertificationPackageSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeProfileRuntimeReleaseFinalCertificationPackageSchema {
  schema_id: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_profile_runtime_release_final_certification_package_id_policy: 'opaque_runtime_profile_runtime_release_final_certification_package_id_no_vendor_binding';
  runtime_profile_runtime_release_final_package_ref: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_ID;
  required_fields: RuntimeProfileRuntimeReleaseFinalCertificationPackageSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeProfileRuntimeReleaseFinalCertificationPackageIdentity {
  identity_id: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-deterministic-identity-v1';
  description: string;
  runtime_profile_runtime_release_final_certification_package_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_ID;
  runtime_profile_runtime_release_final_certification_package_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_VERSION;
  identity_policy: 'opaque_runtime_profile_runtime_release_final_certification_package_id_no_vendor_binding';
  derivation: 'literal_constant_declared_at_design_time';
  purity: 'deterministic_pure_constant';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  vendor_binding: 'none';
  framework_binding: 'none';
  device_binding: 'none';
  vendor_name: 'none';
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  required_channels: ConditioningChannelId[];
}

export interface VendorRuntimeProfileRuntimeReleaseFinalPackageBinding {
  binding_id: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-profile-runtime-release-final-package-binding-v1';
  description: string;
  runtime_profile_runtime_release_final_package_ref: string;
  runtime_profile_runtime_release_final_package_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_ID;
  runtime_profile_runtime_release_final_package_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_VERSION;
  runtime_profile_runtime_release_final_package_phase: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_PHASE;
  runtime_profile_runtime_release_final_package_system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_SYSTEM_ID;
  runtime_profile_runtime_release_final_package_evidence_ref: string;
  runtime_profile_runtime_release_final_package_verdict: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_VERDICT;
  runtime_profile_runtime_release_final_package_evidence_mode: 'phase_177_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_profile_runtime_release_final_certification_package_root';
  sealed_runtime_profile_runtime_release_final_package_digest: string;
  sealed_runtime_profile_runtime_release_final_bundle_digest: string;
  sealed_runtime_profile_runtime_release_archive_certification_report_digest: string;
  sealed_runtime_profile_runtime_release_archive_certification_package_digest: string;
  sealed_runtime_profile_runtime_release_archive_package_digest: string;
  sealed_runtime_profile_runtime_release_archive_digest: string;
  sealed_runtime_profile_runtime_bundle_certification_report_digest: string;
  sealed_runtime_profile_runtime_bundle_certification_package_digest: string;
  sealed_runtime_profile_runtime_bundle_digest: string;
  sealed_runtime_profile_runtime_package_digest: string;
  sealed_runtime_profile_runtime_definition_digest: string;
  sealed_runtime_profile_runtime_descriptor_digest: string;
  sealed_runtime_profile_runtime_reference_digest: string;
  sealed_runtime_profile_runtime_registry_digest: string;
  sealed_runtime_profile_runtime_catalog_digest: string;
  sealed_runtime_profile_runtime_index_digest: string;
  sealed_runtime_profile_master_index_digest: string;
  sealed_runtime_profile_archive_digest: string;
  sealed_runtime_profile_bundle_digest: string;
  sealed_runtime_profile_package_digest: string;
  sealed_runtime_profile_definition_digest: string;
  sealed_runtime_profile_descriptor_digest: string;
  sealed_runtime_profile_reference_digest: string;
  sealed_runtime_profile_registry_digest: string;
  sealed_runtime_profile_catalog_digest: string;
  sealed_runtime_profile_index_digest: string;
  sealed_runtime_profile_collection_digest: string;
  sealed_runtime_profile_set_digest: string;
  sealed_runtime_blueprint_digest: string;
  sealed_runtime_definition_digest: string;
  sealed_runtime_descriptor_digest: string;
  sealed_runtime_contract_digest: string;
  sealed_runtime_specification_digest: string;
  sealed_runtime_template_digest: string;
  sealed_runtime_family_digest: string;
  sealed_runtime_catalog_digest: string;
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  certifies_profile_runtime_release_final_package_in_this_phase: false;
  implements_runtime_profile_runtime_release_final_package_in_this_phase: false;
}

export interface RuntimeProfileRuntimeReleaseFinalCertificationPackageSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeProfileRuntimeReleaseFinalCertificationPackageComposition {
  composition_id: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_profile_runtime_release_final_certification_package';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeProfileRuntimeReleaseFinalCertificationPackageSection[];
  transitive_seal: {
    policy: 'runtime_profile_runtime_release_final_package_contents_sealed_via_runtime_profile_runtime_release_final_package_digest';
    sealed_via: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_ID;
    sealed_component_count: number;
    re_lists_runtime_profile_runtime_release_final_package_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeProfileRuntimeReleaseFinalCertificationPackageManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeProfileRuntimeReleaseFinalCertificationPackageManifest {
  manifest_id: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeProfileRuntimeReleaseFinalCertificationPackageManifestEntry[];
  sealed_runtime_profile_runtime_release_final_package_digest: string;
  sealed_runtime_profile_runtime_release_final_bundle_digest: string;
  sealed_runtime_profile_runtime_release_archive_certification_report_digest: string;
  sealed_runtime_profile_runtime_release_archive_certification_package_digest: string;
  sealed_runtime_profile_runtime_release_archive_package_digest: string;
  sealed_runtime_profile_runtime_release_archive_digest: string;
  sealed_runtime_profile_runtime_bundle_certification_report_digest: string;
  sealed_runtime_profile_runtime_bundle_certification_package_digest: string;
  sealed_runtime_profile_runtime_bundle_digest: string;
  sealed_runtime_profile_runtime_package_digest: string;
  sealed_runtime_profile_runtime_definition_digest: string;
  sealed_runtime_profile_runtime_descriptor_digest: string;
  sealed_runtime_profile_runtime_reference_digest: string;
  sealed_runtime_profile_runtime_registry_digest: string;
  sealed_runtime_profile_runtime_catalog_digest: string;
  sealed_runtime_profile_runtime_index_digest: string;
  sealed_runtime_profile_master_index_digest: string;
  sealed_runtime_profile_archive_digest: string;
  sealed_runtime_profile_bundle_digest: string;
  sealed_runtime_profile_package_digest: string;
  sealed_runtime_profile_definition_digest: string;
  sealed_runtime_profile_descriptor_digest: string;
  sealed_runtime_profile_reference_digest: string;
  sealed_runtime_profile_registry_digest: string;
  sealed_runtime_profile_catalog_digest: string;
  sealed_runtime_profile_index_digest: string;
  sealed_runtime_profile_collection_digest: string;
  sealed_runtime_profile_set_digest: string;
  sealed_runtime_blueprint_digest: string;
  sealed_runtime_definition_digest: string;
  sealed_runtime_descriptor_digest: string;
  sealed_runtime_contract_digest: string;
  sealed_runtime_specification_digest: string;
  sealed_runtime_template_digest: string;
  sealed_runtime_family_digest: string;
  sealed_runtime_catalog_digest: string;
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  runtime_profile_runtime_release_final_certification_package_digest: string;
  runtime_profile_runtime_release_final_certification_package_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_profile_runtime_release_final_package_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseFinalCertificationPackage {
  vendor_runtime_profile_runtime_release_final_certification_package_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_profile_runtime_release_final_certification_package';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_V1';
  runtime_profile_runtime_release_final_certification_package_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_ID;
  runtime_profile_runtime_release_final_certification_package_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_VERSION;
  runtime_profile_runtime_release_final_certification_package_kind: 'vendor_runtime_profile_runtime_release_final_certification_package';
  runtime_profile_runtime_release_final_package_ref: string;
  runtime_profile_runtime_archive_certification_report_schema_ref: string;
  runtime_profile_runtime_archive_certification_report_implementation_registry_ref: string;
  runtime_profile_runtime_release_final_package_evidence_ref: string;
  runtime_profile_runtime_archive_ref: string;
  runtime_profile_runtime_archive_schema_ref: string;
  runtime_profile_runtime_archive_implementation_registry_ref: string;
  runtime_profile_runtime_archive_evidence_ref: string;
  runtime_profile_runtime_bundle_certification_report_ref: string;
  runtime_profile_runtime_bundle_certification_report_schema_ref: string;
  runtime_profile_runtime_bundle_certification_report_implementation_registry_ref: string;
  runtime_profile_runtime_bundle_certification_report_evidence_ref: string;
  runtime_profile_runtime_bundle_certification_package_ref: string;
  runtime_profile_runtime_bundle_certification_package_schema_ref: string;
  runtime_profile_runtime_bundle_certification_package_implementation_registry_ref: string;
  runtime_profile_runtime_bundle_certification_package_evidence_ref: string;
  runtime_profile_runtime_bundle_ref: string;
  runtime_profile_runtime_bundle_schema_ref: string;
  runtime_profile_runtime_bundle_implementation_registry_ref: string;
  runtime_profile_runtime_bundle_evidence_ref: string;
  runtime_profile_runtime_package_ref: string;
  runtime_profile_runtime_package_schema_ref: string;
  runtime_profile_runtime_package_implementation_registry_ref: string;
  runtime_profile_runtime_package_evidence_ref: string;
  runtime_profile_runtime_definition_ref: string;
  runtime_profile_runtime_definition_schema_ref: string;
  runtime_profile_runtime_definition_implementation_registry_ref: string;
  runtime_profile_runtime_definition_evidence_ref: string;
  runtime_profile_runtime_descriptor_ref: string;
  runtime_profile_runtime_descriptor_schema_ref: string;
  runtime_profile_runtime_descriptor_implementation_registry_ref: string;
  runtime_profile_runtime_descriptor_evidence_ref: string;
  runtime_profile_runtime_reference_ref: string;
  runtime_profile_runtime_reference_schema_ref: string;
  runtime_profile_runtime_reference_implementation_registry_ref: string;
  runtime_profile_runtime_reference_evidence_ref: string;
  runtime_profile_runtime_registry_ref: string;
  runtime_profile_runtime_registry_schema_ref: string;
  runtime_profile_runtime_registry_implementation_registry_ref: string;
  runtime_profile_runtime_registry_evidence_ref: string;
  runtime_profile_runtime_catalog_ref: string;
  runtime_profile_runtime_catalog_schema_ref: string;
  runtime_profile_runtime_catalog_implementation_registry_ref: string;
  runtime_profile_runtime_catalog_evidence_ref: string;
  runtime_profile_runtime_index_ref: string;
  runtime_profile_runtime_index_schema_ref: string;
  runtime_profile_runtime_index_implementation_registry_ref: string;
  runtime_profile_runtime_index_evidence_ref: string;
  runtime_profile_master_index_ref: string;
  runtime_profile_master_index_schema_ref: string;
  runtime_profile_master_index_implementation_registry_ref: string;
  runtime_profile_master_index_evidence_ref: string;
  runtime_profile_archive_ref: string;
  runtime_profile_archive_schema_ref: string;
  runtime_profile_archive_implementation_registry_ref: string;
  runtime_profile_archive_evidence_ref: string;
  runtime_profile_bundle_ref: string;
  runtime_profile_bundle_schema_ref: string;
  runtime_profile_bundle_implementation_registry_ref: string;
  runtime_profile_bundle_evidence_ref: string;
  runtime_profile_package_ref: string;
  runtime_profile_package_schema_ref: string;
  runtime_profile_package_implementation_registry_ref: string;
  runtime_profile_package_evidence_ref: string;
  runtime_profile_definition_ref: string;
  runtime_profile_definition_schema_ref: string;
  runtime_profile_definition_implementation_registry_ref: string;
  runtime_profile_definition_evidence_ref: string;
  runtime_profile_descriptor_ref: string;
  runtime_profile_descriptor_schema_ref: string;
  runtime_profile_descriptor_implementation_registry_ref: string;
  runtime_profile_descriptor_evidence_ref: string;
  runtime_profile_reference_ref: string;
  runtime_profile_reference_schema_ref: string;
  runtime_profile_reference_implementation_registry_ref: string;
  runtime_profile_reference_evidence_ref: string;
  runtime_profile_registry_ref: string;
  runtime_profile_registry_schema_ref: string;
  runtime_profile_registry_implementation_registry_ref: string;
  runtime_profile_registry_evidence_ref: string;
  runtime_profile_catalog_ref: string;
  runtime_profile_catalog_schema_ref: string;
  runtime_profile_catalog_implementation_registry_ref: string;
  runtime_profile_catalog_evidence_ref: string;
  runtime_profile_index_ref: string;
  runtime_profile_index_schema_ref: string;
  runtime_profile_index_implementation_registry_ref: string;
  runtime_profile_index_evidence_ref: string;
  runtime_profile_collection_ref: string;
  runtime_profile_collection_schema_ref: string;
  runtime_profile_collection_implementation_registry_ref: string;
  runtime_profile_collection_evidence_ref: string;
  runtime_profile_set_ref: string;
  runtime_profile_set_schema_ref: string;
  runtime_profile_set_implementation_registry_ref: string;
  runtime_profile_set_evidence_ref: string;
  runtime_blueprint_ref: string;
  runtime_blueprint_schema_ref: string;
  runtime_blueprint_implementation_registry_ref: string;
  runtime_blueprint_evidence_ref: string;
  runtime_definition_ref: string;
  runtime_definition_schema_ref: string;
  runtime_definition_implementation_registry_ref: string;
  runtime_definition_evidence_ref: string;
  runtime_descriptor_ref: string;
  runtime_descriptor_schema_ref: string;
  runtime_descriptor_implementation_registry_ref: string;
  runtime_descriptor_evidence_ref: string;
  runtime_contract_ref: string;
  runtime_contract_schema_ref: string;
  runtime_contract_implementation_registry_ref: string;
  runtime_contract_evidence_ref: string;
  runtime_specification_ref: string;
  runtime_specification_schema_ref: string;
  runtime_specification_implementation_registry_ref: string;
  runtime_specification_evidence_ref: string;
  runtime_template_ref: string;
  runtime_template_schema_ref: string;
  runtime_template_implementation_registry_ref: string;
  runtime_template_evidence_ref: string;
  runtime_family_ref: string;
  runtime_family_schema_ref: string;
  runtime_family_implementation_registry_ref: string;
  runtime_family_evidence_ref: string;
  runtime_catalog_ref: string;
  runtime_catalog_schema_ref: string;
  runtime_catalog_implementation_registry_ref: string;
  runtime_catalog_evidence_ref: string;
  runtime_index_ref: string;
  runtime_index_schema_ref: string;
  runtime_index_implementation_registry_ref: string;
  runtime_index_evidence_ref: string;
  runtime_registry_ref: string;
  runtime_profile_ref: string;
  runtime_bundle_ref: string;
  runtime_package_ref: string;
  reference_bundle_ref: string;
  package_ref: string;
  template_ref: string;
  template_certification_ref: string;
  numerical_runtime_package_ref: string;
  sources_supported: string[];
  required_channels: ConditioningChannelId[];
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  runtime_profile_runtime_release_final_certification_package_schema: VendorRuntimeProfileRuntimeReleaseFinalCertificationPackageSchema;
  deterministic_runtime_profile_runtime_release_final_certification_package_identity: DeterministicRuntimeProfileRuntimeReleaseFinalCertificationPackageIdentity;
  vendor_runtime_profile_runtime_release_final_certification_package_binding: VendorRuntimeProfileRuntimeReleaseFinalPackageBinding;
  runtime_profile_runtime_release_final_certification_package_composition: RuntimeProfileRuntimeReleaseFinalCertificationPackageComposition;
  runtime_profile_runtime_release_final_certification_package_manifest: RuntimeProfileRuntimeReleaseFinalCertificationPackageManifest;
  profile_runtime_release_final_certification_package_runtime_entries: {
    count: 0;
    entries: [];
    certifying_policy: string;
    certifies_profile_runtime_release_final_package_in_this_phase: false;
  };
  design_constraints: {
    runtime_profile_runtime_release_final_certification_package_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_profile_runtime_release_final_package: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    certifies_profile_runtime_release_final_package_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function sha256(root: string, relativePath: string): string {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(root, relativePath)))
    .digest('hex');
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/**
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime profile runtime release final package runtime archive.
 * Reuses the PHASE-DSC-177 Vendor Runtime Profile Runtime Release Final Package by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime profile runtime release final package runtime archive artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseFinalCertificationPackage(
  projectRoot?: string
): { vendorRuntimeProfileRuntimeReleaseFinalCertificationPackage: DirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseFinalCertificationPackage } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-DSC-177 vendor runtime profile runtime release final package did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_VERDICT) {
    throw new Error(
      `PHASE-DSC-177 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_PHASE) {
    throw new Error('PHASE-DSC-177 evidence does not cover the vendor runtime profile runtime release final package');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-DSC-177 evidence reports outstanding errors');
  }

  const vendorRuntimeProfileRuntimeReleaseFinalPackage =
    buildDirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseFinalPackage(root)
      .vendorRuntimeProfileRuntimeReleaseFinalPackage;
  if (
    vendorRuntimeProfileRuntimeReleaseFinalPackage.phase !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_PHASE ||
    vendorRuntimeProfileRuntimeReleaseFinalPackage.system_id !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_SYSTEM_ID
  ) {
    throw new Error('PHASE-DSC-177 vendor runtime profile runtime release final package is missing or incompatible');
  }
  if (
    vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_release_final_package_id !==
    VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_ID
  ) {
    throw new Error('Vendor runtime profile runtime release final package identity drifted');
  }
  if (
    vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_release_final_package_version !==
    VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_VERSION
  ) {
    throw new Error('Vendor runtime profile runtime release final package version drifted');
  }
  if (!vendorRuntimeProfileRuntimeReleaseFinalPackage.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime profile runtime release final package must remain vendor neutral');
  }
  if (
    !vendorRuntimeProfileRuntimeReleaseFinalPackage.design_constraints
      .reuses_certified_vendor_runtime_profile_runtime_release_final_bundle
  ) {
    throw new Error(
      'Vendor runtime profile runtime release final certification package must reuse the certified vendor runtime profile runtime release final package'
    );
  }
  if (vendorRuntimeProfileRuntimeReleaseFinalPackage.profile_runtime_release_final_package_runtime_entries.count !== 0) {
    throw new Error('PHASE-DSC-177 must not have assembled profile runtime release final package runtime entries');
  }
  if (vendorRuntimeProfileRuntimeReleaseFinalPackage.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-DSC-177 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeProfileRuntimeReleaseFinalPackage.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime profile runtime release final package channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeProfileRuntimeReleaseFinalPackage.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime profile runtime release final package sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeProfileRuntimeReleaseFinalPackage.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime profile runtime release final package spatial frame drifted');
  }
  if (
    vendorRuntimeProfileRuntimeReleaseFinalPackage.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeProfileRuntimeReleaseFinalPackage.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime profile runtime release final package capability set identity drifted');
  }

  const runtimeProfileRuntimeReleaseFinalPackageManifestUpstream =
    vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_release_final_package_manifest;
  for (const entry of runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(
        `sealed runtime profile runtime release final package section missing on disk: ${entry.artifact_ref}`
      );
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(
        `sealed runtime profile runtime release final package section digest drifted: ${entry.artifact_ref}`
      );
    }
  }
  // Exact formula from the profile runtime release final package builder (sealed prefix label unchanged).
  const recomputedRuntimeProfileRuntimeReleaseFinalPackageDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_profile_runtime_release_final_bundle:${runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_release_final_bundle_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeProfileRuntimeReleaseFinalPackageDigest !==
    runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.runtime_profile_runtime_release_final_package_digest
  ) {
    throw new Error(
      'sealed runtime profile runtime release final package digest drifted from the runtime profile runtime release final package manifest'
    );
  }
  const sealedComponentCount = runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_component_count;

  for (const spec of RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime profile runtime release final package section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime profile runtime release final package section id');
  }
  const sectionRefs = RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime profile runtime release final package section artifact ref');
  }

  const runtime_profile_runtime_release_final_certification_package_schema: VendorRuntimeProfileRuntimeReleaseFinalCertificationPackageSchema = {
    schema_id: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime profile runtime release final package runtime archive. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime profile runtime release final package runtime archive binds one Vendor Runtime Profile Runtime Release Final Package as its root, seals the profile runtime release final package together with its schema and implementation registry, and seals the profile runtime release final package contents transitively through the runtime profile runtime release final package digest. It defines no concrete profile runtime release final package runtime archive runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_profile_runtime_release_final_certification_package_id_policy: 'opaque_runtime_profile_runtime_release_final_certification_package_id_no_vendor_binding',
    runtime_profile_runtime_release_final_package_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_ID,
    required_fields: [
      {
        field: 'runtime_profile_runtime_release_final_certification_package_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_profile_runtime_release_final_certification_package_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime profile runtime release final package runtime archive version string',
      },
      {
        field: 'runtime_profile_runtime_release_final_certification_package_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_profile_runtime_release_final_certification_package',
      },
      {
        field: 'runtime_profile_runtime_release_final_package_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime profile runtime release final package ${VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_ID}`,
      },
      {
        field: 'capability_set_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${CAPABILITY_SET_ID}`,
      },
      {
        field: 'capability_set_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${CAPABILITY_SET_VERSION}`,
      },
      {
        field: 'spatial_frame_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${SPATIAL_FRAME.frame_id}`,
      },
      {
        field: 'required_channels',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'must equal the six foundation channels in fixed order',
      },
      {
        field: 'deterministic_runtime_profile_runtime_release_final_certification_package_identity',
        type: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_profile_runtime_release_final_certification_package_binding',
        type: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-profile-runtime-release-final-package-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Profile Runtime Release Final Package as the runtime profile runtime release final package runtime archive root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_profile_runtime_release_final_certification_package_composition',
        type: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime profile runtime release final package artifact, schema, and implementation registry sections; vendor-specific sections forbidden and profile runtime release final package contents never re-listed',
      },
      {
        field: 'runtime_profile_runtime_release_final_certification_package_manifest',
        type: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime profile runtime release final package digest and a runtime profile runtime release final package runtime archive digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_profile_runtime_release_final_certification_package_identity: DeterministicRuntimeProfileRuntimeReleaseFinalCertificationPackageIdentity =
    {
      identity_id: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-deterministic-identity-v1',
      description:
        'Deterministic identity of the vendor runtime profile runtime release final package runtime archive. The runtime_profile_runtime_release_final_certification_package_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
      runtime_profile_runtime_release_final_certification_package_id: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_ID,
      runtime_profile_runtime_release_final_certification_package_version: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_VERSION,
      identity_policy: 'opaque_runtime_profile_runtime_release_final_certification_package_id_no_vendor_binding',
      derivation: 'literal_constant_declared_at_design_time',
      purity: 'deterministic_pure_constant',
      seed_dependence: 'none',
      time_dependence: 'none',
      randomness: 'none',
      vendor_binding: 'none',
      framework_binding: 'none',
      device_binding: 'none',
      vendor_name: 'none',
      capability_set_id: CAPABILITY_SET_ID,
      capability_set_version: CAPABILITY_SET_VERSION,
      spatial_frame_ref: SPATIAL_FRAME.frame_id,
      required_channels: [...CONDITIONING_CHANNEL_IDS],
    };

  const vendor_runtime_profile_runtime_release_final_certification_package_binding: VendorRuntimeProfileRuntimeReleaseFinalPackageBinding = {
    binding_id: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-profile-runtime-release-final-package-binding-v1',
    description:
      'Exact binding of the PHASE-DSC-177 Vendor Runtime Profile Runtime Release Final Package as the runtime profile runtime release final package runtime archive root. The binding is gated at build time on the recorded PHASE-DSC-177 PASS verdict, and re-seals every runtime profile runtime release final package section and the runtime profile runtime release final package digest before the runtime profile runtime release final package runtime archive is emitted.',
    runtime_profile_runtime_release_final_package_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_PATH,
    runtime_profile_runtime_release_final_package_id: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_ID,
    runtime_profile_runtime_release_final_package_version: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_VERSION,
    runtime_profile_runtime_release_final_package_phase: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_PHASE,
    runtime_profile_runtime_release_final_package_system_id: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_SYSTEM_ID,
    runtime_profile_runtime_release_final_package_evidence_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_EVIDENCE_PATH,
    runtime_profile_runtime_release_final_package_verdict: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_VERDICT,
    runtime_profile_runtime_release_final_package_evidence_mode: 'phase_177_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_profile_runtime_release_final_certification_package_root',
    sealed_runtime_profile_runtime_release_final_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.runtime_profile_runtime_release_final_package_digest,
    sealed_runtime_profile_runtime_release_final_bundle_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_release_final_bundle_digest,
    sealed_runtime_profile_runtime_release_archive_certification_report_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_certification_report_digest,
    sealed_runtime_profile_runtime_release_archive_certification_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_certification_package_digest,
    sealed_runtime_profile_runtime_release_archive_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_package_digest,
    sealed_runtime_profile_runtime_release_archive_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_digest,
    sealed_runtime_profile_runtime_bundle_certification_report_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_bundle_certification_report_digest,
    sealed_runtime_profile_runtime_bundle_certification_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_bundle_certification_package_digest,
    sealed_runtime_profile_runtime_bundle_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_bundle_digest,
    sealed_runtime_profile_runtime_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_package_digest,
    sealed_runtime_profile_runtime_definition_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_definition_digest,
    sealed_runtime_profile_runtime_descriptor_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_descriptor_digest,
    sealed_runtime_profile_runtime_reference_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_reference_digest,
    sealed_runtime_profile_runtime_registry_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_registry_digest,
    sealed_runtime_profile_runtime_catalog_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_catalog_digest,
    sealed_runtime_profile_runtime_index_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_index_digest,
    sealed_runtime_profile_master_index_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_master_index_digest,
    sealed_runtime_profile_archive_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    certifies_profile_runtime_release_final_package_in_this_phase: false,
    implements_runtime_profile_runtime_release_final_package_in_this_phase: false,
  };

  const runtime_profile_runtime_release_final_certification_package_composition: RuntimeProfileRuntimeReleaseFinalCertificationPackageComposition = {
    composition_id: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Profile Runtime Release Final Package: the runtime profile runtime release final package artifact, its shape contract, and its implementation registry. The runtime profile runtime release final package contents (and everything sealed beneath them) are sealed transitively through the runtime profile runtime release final package digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_profile_runtime_release_final_certification_package',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_profile_runtime_release_final_package_contents_sealed_via_runtime_profile_runtime_release_final_package_digest',
      sealed_via: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_profile_runtime_release_final_package_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeProfileRuntimeReleaseFinalCertificationPackageManifestEntry[] = RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_profile_runtime_release_final_certification_package_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_profile_runtime_release_final_package:${runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.runtime_profile_runtime_release_final_package_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_profile_runtime_release_final_certification_package_manifest: RuntimeProfileRuntimeReleaseFinalCertificationPackageManifest = {
    manifest_id: 'dsc-vendor-runtime-profile-runtime-release-final-certification-package-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime profile runtime release final package runtime archive section. Digests are computed read-only from disk. The sealed runtime profile runtime release final package digest carries the profile runtime release final package contents (and everything sealed beneath them) transitively, and the runtime profile runtime release final package runtime archive digest is the SHA256 of the ordered section digests and the sealed runtime profile runtime release final package digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_profile_runtime_release_final_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.runtime_profile_runtime_release_final_package_digest,
    sealed_runtime_profile_runtime_release_final_bundle_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_release_final_bundle_digest,
    sealed_runtime_profile_runtime_release_archive_certification_report_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_certification_report_digest,
    sealed_runtime_profile_runtime_release_archive_certification_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_certification_package_digest,
    sealed_runtime_profile_runtime_release_archive_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_package_digest,
    sealed_runtime_profile_runtime_release_archive_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_digest,
    sealed_runtime_profile_runtime_bundle_certification_report_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_bundle_certification_report_digest,
    sealed_runtime_profile_runtime_bundle_certification_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_bundle_certification_package_digest,
    sealed_runtime_profile_runtime_bundle_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_bundle_digest,
    sealed_runtime_profile_runtime_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_package_digest,
    sealed_runtime_profile_runtime_definition_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_definition_digest,
    sealed_runtime_profile_runtime_descriptor_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_descriptor_digest,
    sealed_runtime_profile_runtime_reference_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_reference_digest,
    sealed_runtime_profile_runtime_registry_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_registry_digest,
    sealed_runtime_profile_runtime_catalog_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_catalog_digest,
    sealed_runtime_profile_runtime_index_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_runtime_index_digest,
    sealed_runtime_profile_master_index_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_master_index_digest,
    sealed_runtime_profile_archive_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileRuntimeReleaseFinalPackageManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_profile_runtime_release_final_certification_package_digest,
    runtime_profile_runtime_release_final_certification_package_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_profile_runtime_release_final_package_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeProfileRuntimeReleaseFinalCertificationPackage: DirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseFinalCertificationPackage = {
    vendor_runtime_profile_runtime_release_final_certification_package_id:
      'direct-spatial-conditioning-vendor-runtime-profile-runtime-release-final-certification-package-v1',
    phase: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_PHASE,
    system_id: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_profile_runtime_release_final_certification_package',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_V1',
    runtime_profile_runtime_release_final_certification_package_id: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_ID,
    runtime_profile_runtime_release_final_certification_package_version: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_VERSION,
    runtime_profile_runtime_release_final_certification_package_kind: 'vendor_runtime_profile_runtime_release_final_certification_package',
    runtime_profile_runtime_release_final_package_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_PATH,
    runtime_profile_runtime_release_final_package_schema_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_SCHEMA_PATH,
    runtime_profile_runtime_release_final_package_implementation_registry_ref:
      VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_runtime_release_final_package_evidence_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_PACKAGE_EVIDENCE_PATH,
    runtime_profile_runtime_archive_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_archive_ref,
    runtime_profile_runtime_archive_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_archive_schema_ref,
    runtime_profile_runtime_archive_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_archive_implementation_registry_ref,
    runtime_profile_runtime_archive_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_archive_evidence_ref,
    runtime_profile_runtime_bundle_certification_report_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_certification_report_ref,
    runtime_profile_runtime_bundle_certification_report_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_certification_report_schema_ref,
    runtime_profile_runtime_bundle_certification_report_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_certification_report_implementation_registry_ref,
    runtime_profile_runtime_bundle_certification_report_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_certification_report_evidence_ref,
    runtime_profile_runtime_bundle_certification_package_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_certification_package_ref,
    runtime_profile_runtime_bundle_certification_package_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_certification_package_schema_ref,
    runtime_profile_runtime_bundle_certification_package_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_certification_package_implementation_registry_ref,
    runtime_profile_runtime_bundle_certification_package_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_certification_package_evidence_ref,
    runtime_profile_runtime_bundle_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_ref,
    runtime_profile_runtime_bundle_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_schema_ref,
    runtime_profile_runtime_bundle_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_implementation_registry_ref,
    runtime_profile_runtime_bundle_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_bundle_evidence_ref,
    runtime_profile_runtime_package_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_package_ref,
    runtime_profile_runtime_package_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_package_schema_ref,
    runtime_profile_runtime_package_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_package_implementation_registry_ref,
    runtime_profile_runtime_package_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_package_evidence_ref,
    runtime_profile_runtime_definition_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_definition_ref,
    runtime_profile_runtime_definition_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_definition_schema_ref,
    runtime_profile_runtime_definition_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_definition_implementation_registry_ref,
    runtime_profile_runtime_definition_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_definition_evidence_ref,
    runtime_profile_runtime_descriptor_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_descriptor_ref,
    runtime_profile_runtime_descriptor_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_descriptor_schema_ref,
    runtime_profile_runtime_descriptor_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_descriptor_implementation_registry_ref,
    runtime_profile_runtime_descriptor_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_descriptor_evidence_ref,
    runtime_profile_runtime_reference_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_reference_ref,
    runtime_profile_runtime_reference_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_reference_schema_ref,
    runtime_profile_runtime_reference_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_reference_implementation_registry_ref,
    runtime_profile_runtime_reference_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_reference_evidence_ref,
    runtime_profile_runtime_registry_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_registry_ref,
    runtime_profile_runtime_registry_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_registry_schema_ref,
    runtime_profile_runtime_registry_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_registry_implementation_registry_ref,
    runtime_profile_runtime_registry_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_registry_evidence_ref,
    runtime_profile_runtime_catalog_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_catalog_ref,
    runtime_profile_runtime_catalog_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_catalog_schema_ref,
    runtime_profile_runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_catalog_implementation_registry_ref,
    runtime_profile_runtime_catalog_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_catalog_evidence_ref,
    runtime_profile_runtime_index_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_index_ref,
    runtime_profile_runtime_index_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_index_schema_ref,
    runtime_profile_runtime_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_index_implementation_registry_ref,
    runtime_profile_runtime_index_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_runtime_index_evidence_ref,
    runtime_profile_master_index_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_master_index_ref,
    runtime_profile_master_index_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_master_index_schema_ref,
    runtime_profile_master_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_master_index_implementation_registry_ref,
    runtime_profile_master_index_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_master_index_evidence_ref,
    runtime_profile_archive_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_archive_ref,
    runtime_profile_archive_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_archive_schema_ref,
    runtime_profile_archive_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_archive_implementation_registry_ref,
    runtime_profile_archive_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_archive_evidence_ref,
    runtime_profile_bundle_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_bundle_ref,
    runtime_profile_bundle_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_bundle_schema_ref,
    runtime_profile_bundle_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_bundle_implementation_registry_ref,
    runtime_profile_bundle_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_bundle_evidence_ref,
    runtime_profile_package_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_package_ref,
    runtime_profile_package_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_package_schema_ref,
    runtime_profile_package_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_package_implementation_registry_ref,
    runtime_profile_package_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_package_evidence_ref,
    runtime_profile_definition_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_definition_ref,
    runtime_profile_definition_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_definition_schema_ref,
    runtime_profile_definition_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_definition_implementation_registry_ref,
    runtime_profile_definition_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_definition_evidence_ref,
    runtime_profile_descriptor_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_descriptor_ref,
    runtime_profile_descriptor_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_descriptor_schema_ref,
    runtime_profile_descriptor_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_descriptor_implementation_registry_ref,
    runtime_profile_descriptor_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_descriptor_evidence_ref,
    runtime_profile_reference_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_reference_ref,
    runtime_profile_reference_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_reference_schema_ref,
    runtime_profile_reference_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_reference_implementation_registry_ref,
    runtime_profile_reference_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_reference_evidence_ref,
    runtime_profile_registry_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_registry_ref,
    runtime_profile_registry_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_registry_schema_ref,
    runtime_profile_registry_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_registry_implementation_registry_ref,
    runtime_profile_registry_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_registry_evidence_ref,
    runtime_profile_catalog_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_catalog_ref,
    runtime_profile_catalog_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_catalog_schema_ref,
    runtime_profile_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_catalog_implementation_registry_ref,
    runtime_profile_catalog_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_catalog_evidence_ref,
    runtime_profile_index_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_index_ref,
    runtime_profile_index_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_index_schema_ref,
    runtime_profile_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_index_implementation_registry_ref,
    runtime_profile_index_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_index_evidence_ref,
    runtime_profile_collection_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_collection_ref,
    runtime_profile_collection_schema_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_collection_schema_ref,
    runtime_profile_collection_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_collection_implementation_registry_ref,
    runtime_profile_collection_evidence_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_collection_evidence_ref,
    runtime_profile_set_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_set_ref,
    runtime_profile_set_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_set_schema_ref,
    runtime_profile_set_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_set_implementation_registry_ref,
    runtime_profile_set_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_set_evidence_ref,
    runtime_blueprint_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_blueprint_ref,
    runtime_blueprint_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_blueprint_schema_ref,
    runtime_blueprint_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_blueprint_implementation_registry_ref,
    runtime_blueprint_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_blueprint_evidence_ref,
    runtime_definition_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_definition_ref,
    runtime_definition_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_definition_schema_ref,
    runtime_definition_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_definition_implementation_registry_ref,
    runtime_definition_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_definition_evidence_ref,
    runtime_descriptor_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_descriptor_ref,
    runtime_descriptor_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_descriptor_schema_ref,
    runtime_descriptor_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_descriptor_implementation_registry_ref,
    runtime_descriptor_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_descriptor_evidence_ref,
    runtime_contract_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_contract_ref,
    runtime_contract_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_contract_schema_ref,
    runtime_contract_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_contract_implementation_registry_ref,
    runtime_contract_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_contract_evidence_ref,
    runtime_specification_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_specification_ref,
    runtime_specification_schema_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.reference_bundle_ref,
    package_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.package_ref,
    template_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.template_ref,
    template_certification_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeProfileRuntimeReleaseFinalPackage.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_profile_runtime_release_final_certification_package_schema,
    deterministic_runtime_profile_runtime_release_final_certification_package_identity,
    vendor_runtime_profile_runtime_release_final_certification_package_binding,
    runtime_profile_runtime_release_final_certification_package_composition,
    runtime_profile_runtime_release_final_certification_package_manifest,
    profile_runtime_release_final_certification_package_runtime_entries: {
      count: 0,
      entries: [],
      certifying_policy:
        'concrete vendor runtime profile runtime release final package runtime archive entries may be registered into this profile runtime release final package runtime archive only in a future implementation phase; none are registered here',
      certifies_profile_runtime_release_final_package_in_this_phase: false,
    },
    design_constraints: {
      runtime_profile_runtime_release_final_certification_package_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_profile_runtime_release_final_package: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      certifies_profile_runtime_release_final_package_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: '2026-07-27T00:00:00.000Z',
  };

  writeJson(root, VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_FINAL_CERTIFICATION_PACKAGE_PATH, vendorRuntimeProfileRuntimeReleaseFinalCertificationPackage);
  return { vendorRuntimeProfileRuntimeReleaseFinalCertificationPackage };
}
