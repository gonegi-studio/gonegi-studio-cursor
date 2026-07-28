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
  DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_ID,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_PATH,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileArchive,
} from './directSpatialConditioningVendorRuntimeProfileArchiveBuilder.js';

/**
 * PHASE-DSC-127: Direct Spatial Conditioning vendor runtime profile master index.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Describes the PHASE-DSC-125 Vendor
 * Runtime Profile Archive as the sole design-time master index root:
 *   - runtime profile master index schema,
 *   - deterministic runtime profile master index identity,
 *   - Vendor Runtime Profile Archive binding,
 *   - runtime profile master index composition, and
 *   - runtime profile master index manifest.
 *
 * The profile master index seals three design sections directly (runtime profile archive
 * artifact, schema, implementation registry) and seals everything the profile archive
 * owns transitively through the runtime profile archive digest. It defines
 * no concrete profile master index runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 *
 * PHASE-DSC-126 was not run, so the binding is gated on the recorded PHASE-DSC-125 PASS
 * verdict rather than a dedicated certification artifact.
 */

export const DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PHASE = 'PHASE-DSC-127' as const;
export const DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_V1' as const;

export const VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PATH =
  `${VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ROOT}/direct-spatial-conditioning-vendor-runtime-profile-master-index-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime profile master index. */
export const VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID =
  'dsc-vendor-runtime-profile-master-index-v1' as const;

export const VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-DSC-125 vendor runtime profile archive. */
export const VENDOR_RUNTIME_PROFILE_ARCHIVE_EVIDENCE_PATH =
  VENDOR_RUNTIME_PROFILE_ARCHIVE_VALIDATION_REPORT_PATH;

export const VENDOR_RUNTIME_PROFILE_ARCHIVE_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_ARCHIVE_V1' as const;

export const VENDOR_RUNTIME_PROFILE_MASTER_INDEX_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-master-index.schema.json' as const;
export const VENDOR_RUNTIME_PROFILE_MASTER_INDEX_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-master-index-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime profile master index sections. Only the profile master index's own
 * design-time publication set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_PROFILE_MASTER_INDEX_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_profile_archive_artifact'
    | 'runtime_profile_archive_schema'
    | 'runtime_profile_archive_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_profile_archive',
    role: 'runtime_profile_master_index_root_profile_archive',
    kind: 'runtime_profile_archive_artifact',
    artifact_ref: VENDOR_RUNTIME_PROFILE_ARCHIVE_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_archive_schema',
    role: 'runtime_profile_archive_shape_contract',
    kind: 'runtime_profile_archive_schema',
    artifact_ref: VENDOR_RUNTIME_PROFILE_ARCHIVE_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_archive_implementation_registry',
    role: 'runtime_profile_archive_provenance_registry',
    kind: 'runtime_profile_archive_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_PROFILE_ARCHIVE_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeProfileMasterIndexSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeProfileMasterIndexSchema {
  schema_id: 'dsc-vendor-runtime-profile-master-index-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_profile_master_index_id_policy: 'opaque_runtime_profile_master_index_id_no_vendor_binding';
  runtime_profile_archive_ref: typeof VENDOR_RUNTIME_PROFILE_ARCHIVE_ID;
  required_fields: RuntimeProfileMasterIndexSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeProfileMasterIndexIdentity {
  identity_id: 'dsc-vendor-runtime-profile-master-index-deterministic-identity-v1';
  description: string;
  runtime_profile_master_index_id: typeof VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID;
  runtime_profile_master_index_version: typeof VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERSION;
  identity_policy: 'opaque_runtime_profile_master_index_id_no_vendor_binding';
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

export interface VendorRuntimeProfileArchiveBinding {
  binding_id: 'dsc-vendor-runtime-profile-master-index-profile-archive-binding-v1';
  description: string;
  runtime_profile_archive_ref: string;
  runtime_profile_archive_id: typeof VENDOR_RUNTIME_PROFILE_ARCHIVE_ID;
  runtime_profile_archive_version: typeof VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION;
  runtime_profile_archive_phase: typeof DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_PHASE;
  runtime_profile_archive_system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_SYSTEM_ID;
  runtime_profile_archive_evidence_ref: string;
  runtime_profile_archive_verdict: typeof VENDOR_RUNTIME_PROFILE_ARCHIVE_VERDICT;
  runtime_profile_archive_evidence_mode: 'phase_125_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_profile_master_index_root';
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
  indexes_profile_archive_in_this_phase: false;
  implements_runtime_profile_archive_in_this_phase: false;
}

export interface RuntimeProfileMasterIndexSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeProfileMasterIndexComposition {
  composition_id: 'dsc-vendor-runtime-profile-master-index-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_profile_archive';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeProfileMasterIndexSection[];
  transitive_seal: {
    policy: 'runtime_profile_archive_contents_sealed_via_runtime_profile_archive_digest';
    sealed_via: typeof VENDOR_RUNTIME_PROFILE_ARCHIVE_ID;
    sealed_component_count: number;
    re_lists_runtime_profile_archive_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeProfileMasterIndexManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeProfileMasterIndexManifest {
  manifest_id: 'dsc-vendor-runtime-profile-master-index-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeProfileMasterIndexManifestEntry[];
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
  runtime_profile_master_index_digest: string;
  runtime_profile_master_index_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_profile_archive_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeProfileMasterIndex {
  vendor_runtime_profile_master_index_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_profile_master_index';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_V1';
  runtime_profile_master_index_id: typeof VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID;
  runtime_profile_master_index_version: typeof VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERSION;
  runtime_profile_master_index_kind: 'vendor_runtime_profile_master_index';
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
  runtime_profile_master_index_schema: VendorRuntimeProfileMasterIndexSchema;
  deterministic_runtime_profile_master_index_identity: DeterministicRuntimeProfileMasterIndexIdentity;
  vendor_runtime_profile_archive_binding: VendorRuntimeProfileArchiveBinding;
  runtime_profile_master_index_composition: RuntimeProfileMasterIndexComposition;
  runtime_profile_master_index_manifest: RuntimeProfileMasterIndexManifest;
  profile_master_index_runtime_entries: {
    count: 0;
    entries: [];
    indexing_policy: string;
    indexes_profile_archive_in_this_phase: false;
  };
  design_constraints: {
    runtime_profile_master_index_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_profile_archive: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    indexes_profile_archive_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime profile master index.
 * Reuses the PHASE-DSC-125 Vendor Runtime Profile Archive by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime profile master index artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeProfileMasterIndex(
  projectRoot?: string
): { vendorRuntimeProfileMasterIndex: DirectSpatialConditioningVendorRuntimeProfileMasterIndex } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_PROFILE_ARCHIVE_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-DSC-125 vendor runtime profile archive did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_PROFILE_ARCHIVE_VERDICT) {
    throw new Error(
      `PHASE-DSC-125 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_PHASE) {
    throw new Error('PHASE-DSC-125 evidence does not cover the vendor runtime profile archive');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-DSC-125 evidence reports outstanding errors');
  }

  const vendorRuntimeProfileArchive =
    readJson<DirectSpatialConditioningVendorRuntimeProfileArchive>(
      root,
      VENDOR_RUNTIME_PROFILE_ARCHIVE_PATH
    );
  if (
    vendorRuntimeProfileArchive.phase !== DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_PHASE ||
    vendorRuntimeProfileArchive.system_id !== DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_SYSTEM_ID
  ) {
    throw new Error('PHASE-DSC-125 vendor runtime profile archive is missing or incompatible');
  }
  if (
    vendorRuntimeProfileArchive.runtime_profile_archive_id !==
    VENDOR_RUNTIME_PROFILE_ARCHIVE_ID
  ) {
    throw new Error('Vendor runtime profile archive identity drifted');
  }
  if (
    vendorRuntimeProfileArchive.runtime_profile_archive_version !==
    VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION
  ) {
    throw new Error('Vendor runtime profile archive version drifted');
  }
  if (!vendorRuntimeProfileArchive.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime profile archive must remain vendor neutral');
  }
  if (
    !vendorRuntimeProfileArchive.design_constraints.reuses_certified_vendor_runtime_profile_bundle
  ) {
    throw new Error(
      'Vendor runtime profile archive must reuse the certified vendor runtime profile bundle'
    );
  }
  if (vendorRuntimeProfileArchive.profile_archive_runtime_entries.count !== 0) {
    throw new Error('PHASE-DSC-125 must not have assembled profile archive runtime entries');
  }
  if (vendorRuntimeProfileArchive.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-DSC-125 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeProfileArchive.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime profile archive channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeProfileArchive.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime profile archive sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeProfileArchive.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime profile archive spatial frame drifted');
  }
  if (
    vendorRuntimeProfileArchive.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeProfileArchive.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime profile archive capability set identity drifted');
  }

  const runtimeProfileArchiveManifestUpstream =
    vendorRuntimeProfileArchive.runtime_profile_archive_manifest;
  for (const entry of runtimeProfileArchiveManifestUpstream.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(
        `sealed runtime profile archive section missing on disk: ${entry.artifact_ref}`
      );
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(
        `sealed runtime profile archive section digest drifted: ${entry.artifact_ref}`
      );
    }
  }
  // Exact formula from the profile archive builder (sealed prefix label unchanged).
  const recomputedRuntimeProfileArchiveDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeProfileArchiveManifestUpstream.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_profile_bundle:${runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_bundle_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeProfileArchiveDigest !==
    runtimeProfileArchiveManifestUpstream.runtime_profile_archive_digest
  ) {
    throw new Error(
      'sealed runtime profile archive digest drifted from the runtime profile archive manifest'
    );
  }
  const sealedComponentCount = runtimeProfileArchiveManifestUpstream.sealed_component_count;

  for (const spec of RUNTIME_PROFILE_MASTER_INDEX_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime profile archive section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_PROFILE_MASTER_INDEX_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime profile archive section id');
  }
  const sectionRefs = RUNTIME_PROFILE_MASTER_INDEX_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime profile archive section artifact ref');
  }

  const runtime_profile_master_index_schema: VendorRuntimeProfileMasterIndexSchema = {
    schema_id: 'dsc-vendor-runtime-profile-master-index-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime profile master index. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime profile master index binds one Vendor Runtime Profile Archive as its root, seals the profile archive together with its schema and implementation registry, and seals the profile archive contents transitively through the runtime profile archive digest. It defines no concrete profile master index runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_profile_master_index_id_policy: 'opaque_runtime_profile_master_index_id_no_vendor_binding',
    runtime_profile_archive_ref: VENDOR_RUNTIME_PROFILE_ARCHIVE_ID,
    required_fields: [
      {
        field: 'runtime_profile_master_index_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_profile_master_index_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime profile master index version string',
      },
      {
        field: 'runtime_profile_master_index_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_profile_master_index',
      },
      {
        field: 'runtime_profile_archive_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime profile archive ${VENDOR_RUNTIME_PROFILE_ARCHIVE_ID}`,
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
        field: 'deterministic_runtime_profile_master_index_identity',
        type: 'dsc-vendor-runtime-profile-master-index-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_profile_archive_binding',
        type: 'dsc-vendor-runtime-profile-master-index-profile-archive-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Profile Archive as the runtime profile master index root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_profile_master_index_composition',
        type: 'dsc-vendor-runtime-profile-master-index-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime profile archive artifact, schema, and implementation registry sections; vendor-specific sections forbidden and profile archive contents never re-listed',
      },
      {
        field: 'runtime_profile_master_index_manifest',
        type: 'dsc-vendor-runtime-profile-master-index-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime profile archive digest and a runtime profile master index digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_profile_master_index_identity: DeterministicRuntimeProfileMasterIndexIdentity =
    {
      identity_id: 'dsc-vendor-runtime-profile-master-index-deterministic-identity-v1',
      description:
        'Deterministic identity of the vendor runtime profile master index. The runtime_profile_master_index_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
      runtime_profile_master_index_id: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID,
      runtime_profile_master_index_version: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERSION,
      identity_policy: 'opaque_runtime_profile_master_index_id_no_vendor_binding',
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

  const vendor_runtime_profile_archive_binding: VendorRuntimeProfileArchiveBinding = {
    binding_id: 'dsc-vendor-runtime-profile-master-index-profile-archive-binding-v1',
    description:
      'Exact binding of the PHASE-DSC-125 Vendor Runtime Profile Archive as the runtime profile master index root. The binding is gated at build time on the recorded PHASE-DSC-125 PASS verdict, and re-seals every runtime profile archive section and the runtime profile archive digest before the runtime profile master index is emitted.',
    runtime_profile_archive_ref: VENDOR_RUNTIME_PROFILE_ARCHIVE_PATH,
    runtime_profile_archive_id: VENDOR_RUNTIME_PROFILE_ARCHIVE_ID,
    runtime_profile_archive_version: VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION,
    runtime_profile_archive_phase: DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_PHASE,
    runtime_profile_archive_system_id: DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_SYSTEM_ID,
    runtime_profile_archive_evidence_ref: VENDOR_RUNTIME_PROFILE_ARCHIVE_EVIDENCE_PATH,
    runtime_profile_archive_verdict: VENDOR_RUNTIME_PROFILE_ARCHIVE_VERDICT,
    runtime_profile_archive_evidence_mode: 'phase_125_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_profile_master_index_root',
    sealed_runtime_profile_archive_digest:
      runtimeProfileArchiveManifestUpstream.runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    indexes_profile_archive_in_this_phase: false,
    implements_runtime_profile_archive_in_this_phase: false,
  };

  const runtime_profile_master_index_composition: RuntimeProfileMasterIndexComposition = {
    composition_id: 'dsc-vendor-runtime-profile-master-index-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Profile Archive: the runtime profile archive artifact, its shape contract, and its implementation registry. The runtime profile archive contents (and everything sealed beneath them) are sealed transitively through the runtime profile archive digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_profile_archive',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_PROFILE_MASTER_INDEX_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_profile_archive_contents_sealed_via_runtime_profile_archive_digest',
      sealed_via: VENDOR_RUNTIME_PROFILE_ARCHIVE_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_profile_archive_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeProfileMasterIndexManifestEntry[] = RUNTIME_PROFILE_MASTER_INDEX_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_profile_master_index_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_profile_archive:${runtimeProfileArchiveManifestUpstream.runtime_profile_archive_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_profile_master_index_manifest: RuntimeProfileMasterIndexManifest = {
    manifest_id: 'dsc-vendor-runtime-profile-master-index-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime profile master index section. Digests are computed read-only from disk. The sealed runtime profile archive digest carries the profile archive contents (and everything sealed beneath them) transitively, and the runtime profile master index digest is the SHA256 of the ordered section digests and the sealed runtime profile archive digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_profile_archive_digest:
      runtimeProfileArchiveManifestUpstream.runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileArchiveManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileArchiveManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_profile_master_index_digest,
    runtime_profile_master_index_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_profile_archive_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeProfileMasterIndex: DirectSpatialConditioningVendorRuntimeProfileMasterIndex = {
    vendor_runtime_profile_master_index_id:
      'direct-spatial-conditioning-vendor-runtime-profile-master-index-v1',
    phase: DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PHASE,
    system_id: DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_profile_master_index',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_V1',
    runtime_profile_master_index_id: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID,
    runtime_profile_master_index_version: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERSION,
    runtime_profile_master_index_kind: 'vendor_runtime_profile_master_index',
    runtime_profile_archive_ref: VENDOR_RUNTIME_PROFILE_ARCHIVE_PATH,
    runtime_profile_archive_schema_ref: VENDOR_RUNTIME_PROFILE_ARCHIVE_SCHEMA_PATH,
    runtime_profile_archive_implementation_registry_ref:
      VENDOR_RUNTIME_PROFILE_ARCHIVE_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_archive_evidence_ref: VENDOR_RUNTIME_PROFILE_ARCHIVE_EVIDENCE_PATH,
    runtime_profile_bundle_ref: vendorRuntimeProfileArchive.runtime_profile_bundle_ref,
    runtime_profile_bundle_schema_ref: vendorRuntimeProfileArchive.runtime_profile_bundle_schema_ref,
    runtime_profile_bundle_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_profile_bundle_implementation_registry_ref,
    runtime_profile_bundle_evidence_ref: vendorRuntimeProfileArchive.runtime_profile_bundle_evidence_ref,
    runtime_profile_package_ref: vendorRuntimeProfileArchive.runtime_profile_package_ref,
    runtime_profile_package_schema_ref: vendorRuntimeProfileArchive.runtime_profile_package_schema_ref,
    runtime_profile_package_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_profile_package_implementation_registry_ref,
    runtime_profile_package_evidence_ref: vendorRuntimeProfileArchive.runtime_profile_package_evidence_ref,
    runtime_profile_definition_ref: vendorRuntimeProfileArchive.runtime_profile_definition_ref,
    runtime_profile_definition_schema_ref: vendorRuntimeProfileArchive.runtime_profile_definition_schema_ref,
    runtime_profile_definition_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_profile_definition_implementation_registry_ref,
    runtime_profile_definition_evidence_ref: vendorRuntimeProfileArchive.runtime_profile_definition_evidence_ref,
    runtime_profile_descriptor_ref: vendorRuntimeProfileArchive.runtime_profile_descriptor_ref,
    runtime_profile_descriptor_schema_ref: vendorRuntimeProfileArchive.runtime_profile_descriptor_schema_ref,
    runtime_profile_descriptor_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_profile_descriptor_implementation_registry_ref,
    runtime_profile_descriptor_evidence_ref: vendorRuntimeProfileArchive.runtime_profile_descriptor_evidence_ref,
    runtime_profile_reference_ref: vendorRuntimeProfileArchive.runtime_profile_reference_ref,
    runtime_profile_reference_schema_ref: vendorRuntimeProfileArchive.runtime_profile_reference_schema_ref,
    runtime_profile_reference_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_profile_reference_implementation_registry_ref,
    runtime_profile_reference_evidence_ref: vendorRuntimeProfileArchive.runtime_profile_reference_evidence_ref,
    runtime_profile_registry_ref: vendorRuntimeProfileArchive.runtime_profile_registry_ref,
    runtime_profile_registry_schema_ref: vendorRuntimeProfileArchive.runtime_profile_registry_schema_ref,
    runtime_profile_registry_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_profile_registry_implementation_registry_ref,
    runtime_profile_registry_evidence_ref: vendorRuntimeProfileArchive.runtime_profile_registry_evidence_ref,
    runtime_profile_catalog_ref: vendorRuntimeProfileArchive.runtime_profile_catalog_ref,
    runtime_profile_catalog_schema_ref: vendorRuntimeProfileArchive.runtime_profile_catalog_schema_ref,
    runtime_profile_catalog_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_profile_catalog_implementation_registry_ref,
    runtime_profile_catalog_evidence_ref: vendorRuntimeProfileArchive.runtime_profile_catalog_evidence_ref,
    runtime_profile_index_ref: vendorRuntimeProfileArchive.runtime_profile_index_ref,
    runtime_profile_index_schema_ref: vendorRuntimeProfileArchive.runtime_profile_index_schema_ref,
    runtime_profile_index_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_profile_index_implementation_registry_ref,
    runtime_profile_index_evidence_ref: vendorRuntimeProfileArchive.runtime_profile_index_evidence_ref,
    runtime_profile_collection_ref: vendorRuntimeProfileArchive.runtime_profile_collection_ref,
    runtime_profile_collection_schema_ref:
      vendorRuntimeProfileArchive.runtime_profile_collection_schema_ref,
    runtime_profile_collection_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_profile_collection_implementation_registry_ref,
    runtime_profile_collection_evidence_ref:
      vendorRuntimeProfileArchive.runtime_profile_collection_evidence_ref,
    runtime_profile_set_ref: vendorRuntimeProfileArchive.runtime_profile_set_ref,
    runtime_profile_set_schema_ref: vendorRuntimeProfileArchive.runtime_profile_set_schema_ref,
    runtime_profile_set_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_profile_set_implementation_registry_ref,
    runtime_profile_set_evidence_ref: vendorRuntimeProfileArchive.runtime_profile_set_evidence_ref,
    runtime_blueprint_ref: vendorRuntimeProfileArchive.runtime_blueprint_ref,
    runtime_blueprint_schema_ref: vendorRuntimeProfileArchive.runtime_blueprint_schema_ref,
    runtime_blueprint_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_blueprint_implementation_registry_ref,
    runtime_blueprint_evidence_ref: vendorRuntimeProfileArchive.runtime_blueprint_evidence_ref,
    runtime_definition_ref: vendorRuntimeProfileArchive.runtime_definition_ref,
    runtime_definition_schema_ref: vendorRuntimeProfileArchive.runtime_definition_schema_ref,
    runtime_definition_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_definition_implementation_registry_ref,
    runtime_definition_evidence_ref: vendorRuntimeProfileArchive.runtime_definition_evidence_ref,
    runtime_descriptor_ref: vendorRuntimeProfileArchive.runtime_descriptor_ref,
    runtime_descriptor_schema_ref: vendorRuntimeProfileArchive.runtime_descriptor_schema_ref,
    runtime_descriptor_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_descriptor_implementation_registry_ref,
    runtime_descriptor_evidence_ref: vendorRuntimeProfileArchive.runtime_descriptor_evidence_ref,
    runtime_contract_ref: vendorRuntimeProfileArchive.runtime_contract_ref,
    runtime_contract_schema_ref: vendorRuntimeProfileArchive.runtime_contract_schema_ref,
    runtime_contract_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_contract_implementation_registry_ref,
    runtime_contract_evidence_ref: vendorRuntimeProfileArchive.runtime_contract_evidence_ref,
    runtime_specification_ref: vendorRuntimeProfileArchive.runtime_specification_ref,
    runtime_specification_schema_ref:
      vendorRuntimeProfileArchive.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref:
      vendorRuntimeProfileArchive.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeProfileArchive.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeProfileArchive.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeProfileArchive.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeProfileArchive.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeProfileArchive.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeProfileArchive.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeProfileArchive.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeProfileArchive.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeProfileArchive.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeProfileArchive.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeProfileArchive.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeProfileArchive.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeProfileArchive.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeProfileArchive.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeProfileArchive.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeProfileArchive.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeProfileArchive.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeProfileArchive.reference_bundle_ref,
    package_ref: vendorRuntimeProfileArchive.package_ref,
    template_ref: vendorRuntimeProfileArchive.template_ref,
    template_certification_ref: vendorRuntimeProfileArchive.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeProfileArchive.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_profile_master_index_schema,
    deterministic_runtime_profile_master_index_identity,
    vendor_runtime_profile_archive_binding,
    runtime_profile_master_index_composition,
    runtime_profile_master_index_manifest,
    profile_master_index_runtime_entries: {
      count: 0,
      entries: [],
      indexing_policy:
        'concrete vendor runtime profile master index entries may be registered into this profile master index only in a future implementation phase; none are registered here',
      indexes_profile_archive_in_this_phase: false,
    },
    design_constraints: {
      runtime_profile_master_index_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_profile_archive: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      indexes_profile_archive_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PATH, vendorRuntimeProfileMasterIndex);
  return { vendorRuntimeProfileMasterIndex };
}
