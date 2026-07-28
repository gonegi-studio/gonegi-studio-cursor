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
  DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID,
  VENDOR_RUNTIME_PROFILE_MASTER_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PATH,
  VENDOR_RUNTIME_PROFILE_MASTER_INDEX_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileMasterIndex,
} from './directSpatialConditioningVendorRuntimeProfileMasterIndexBuilder.js';

/**
 * PHASE-DSC-129: Direct Spatial Conditioning vendor runtime profile runtime index.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Describes the PHASE-DSC-127 Vendor
 * Runtime Profile Master Index as the sole design-time runtime index root:
 *   - runtime profile runtime index schema,
 *   - deterministic runtime profile runtime index identity,
 *   - Vendor Runtime Profile Master Index binding,
 *   - runtime profile runtime index composition, and
 *   - runtime profile runtime index manifest.
 *
 * The profile runtime index seals three design sections directly (runtime profile master index
 * artifact, schema, implementation registry) and seals everything the profile master index
 * owns transitively through the runtime profile master index digest. It defines
 * no concrete profile runtime index runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 *
 * PHASE-DSC-128 was not run, so the binding is gated on the recorded PHASE-DSC-127 PASS
 * verdict rather than a dedicated certification artifact.
 */

export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_PHASE = 'PHASE-DSC-129' as const;
export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_V1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_PATH =
  `${VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_ROOT}/direct-spatial-conditioning-vendor-runtime-profile-runtime-index-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime profile runtime index. */
export const VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_ID =
  'dsc-vendor-runtime-profile-runtime-index-v1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-DSC-127 vendor runtime profile master index. */
export const VENDOR_RUNTIME_PROFILE_MASTER_INDEX_EVIDENCE_PATH =
  VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VALIDATION_REPORT_PATH;

export const VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_V1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-runtime-index.schema.json' as const;
export const VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-runtime-index-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime profile runtime index sections. Only the profile runtime index's own
 * design-time publication set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_PROFILE_RUNTIME_INDEX_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_profile_master_index_artifact'
    | 'runtime_profile_master_index_schema'
    | 'runtime_profile_master_index_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_profile_master_index',
    role: 'runtime_profile_runtime_index_root_profile_master_index',
    kind: 'runtime_profile_master_index_artifact',
    artifact_ref: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_master_index_schema',
    role: 'runtime_profile_master_index_shape_contract',
    kind: 'runtime_profile_master_index_schema',
    artifact_ref: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_master_index_implementation_registry',
    role: 'runtime_profile_master_index_provenance_registry',
    kind: 'runtime_profile_master_index_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeProfileRuntimeIndexSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeProfileRuntimeIndexSchema {
  schema_id: 'dsc-vendor-runtime-profile-runtime-index-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_profile_runtime_index_id_policy: 'opaque_runtime_profile_runtime_index_id_no_vendor_binding';
  runtime_profile_master_index_ref: typeof VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID;
  required_fields: RuntimeProfileRuntimeIndexSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeProfileRuntimeIndexIdentity {
  identity_id: 'dsc-vendor-runtime-profile-runtime-index-deterministic-identity-v1';
  description: string;
  runtime_profile_runtime_index_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_ID;
  runtime_profile_runtime_index_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_VERSION;
  identity_policy: 'opaque_runtime_profile_runtime_index_id_no_vendor_binding';
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

export interface VendorRuntimeProfileMasterIndexBinding {
  binding_id: 'dsc-vendor-runtime-profile-runtime-index-profile-master-index-binding-v1';
  description: string;
  runtime_profile_master_index_ref: string;
  runtime_profile_master_index_id: typeof VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID;
  runtime_profile_master_index_version: typeof VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERSION;
  runtime_profile_master_index_phase: typeof DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PHASE;
  runtime_profile_master_index_system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_SYSTEM_ID;
  runtime_profile_master_index_evidence_ref: string;
  runtime_profile_master_index_verdict: typeof VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERDICT;
  runtime_profile_master_index_evidence_mode: 'phase_127_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_profile_runtime_index_root';
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
  indexes_profile_master_index_in_this_phase: false;
  implements_runtime_profile_master_index_in_this_phase: false;
}

export interface RuntimeProfileRuntimeIndexSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeProfileRuntimeIndexComposition {
  composition_id: 'dsc-vendor-runtime-profile-runtime-index-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_profile_master_index';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeProfileRuntimeIndexSection[];
  transitive_seal: {
    policy: 'runtime_profile_master_index_contents_sealed_via_runtime_profile_master_index_digest';
    sealed_via: typeof VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID;
    sealed_component_count: number;
    re_lists_runtime_profile_master_index_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeProfileRuntimeIndexManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeProfileRuntimeIndexManifest {
  manifest_id: 'dsc-vendor-runtime-profile-runtime-index-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeProfileRuntimeIndexManifestEntry[];
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
  runtime_profile_runtime_index_digest: string;
  runtime_profile_runtime_index_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_profile_master_index_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeProfileRuntimeIndex {
  vendor_runtime_profile_runtime_index_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_profile_runtime_index';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_V1';
  runtime_profile_runtime_index_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_ID;
  runtime_profile_runtime_index_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_VERSION;
  runtime_profile_runtime_index_kind: 'vendor_runtime_profile_runtime_index';
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
  runtime_profile_runtime_index_schema: VendorRuntimeProfileRuntimeIndexSchema;
  deterministic_runtime_profile_runtime_index_identity: DeterministicRuntimeProfileRuntimeIndexIdentity;
  vendor_runtime_profile_master_index_binding: VendorRuntimeProfileMasterIndexBinding;
  runtime_profile_runtime_index_composition: RuntimeProfileRuntimeIndexComposition;
  runtime_profile_runtime_index_manifest: RuntimeProfileRuntimeIndexManifest;
  profile_runtime_index_runtime_entries: {
    count: 0;
    entries: [];
    indexing_policy: string;
    indexes_profile_master_index_in_this_phase: false;
  };
  design_constraints: {
    runtime_profile_runtime_index_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_profile_master_index: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    indexes_profile_master_index_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime profile runtime index.
 * Reuses the PHASE-DSC-127 Vendor Runtime Profile Master Index by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime profile runtime index artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeProfileRuntimeIndex(
  projectRoot?: string
): { vendorRuntimeProfileRuntimeIndex: DirectSpatialConditioningVendorRuntimeProfileRuntimeIndex } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_PROFILE_MASTER_INDEX_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-DSC-127 vendor runtime profile master index did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERDICT) {
    throw new Error(
      `PHASE-DSC-127 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PHASE) {
    throw new Error('PHASE-DSC-127 evidence does not cover the vendor runtime profile master index');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-DSC-127 evidence reports outstanding errors');
  }

  const vendorRuntimeProfileMasterIndex =
    readJson<DirectSpatialConditioningVendorRuntimeProfileMasterIndex>(
      root,
      VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PATH
    );
  if (
    vendorRuntimeProfileMasterIndex.phase !== DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PHASE ||
    vendorRuntimeProfileMasterIndex.system_id !== DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_SYSTEM_ID
  ) {
    throw new Error('PHASE-DSC-127 vendor runtime profile master index is missing or incompatible');
  }
  if (
    vendorRuntimeProfileMasterIndex.runtime_profile_master_index_id !==
    VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID
  ) {
    throw new Error('Vendor runtime profile master index identity drifted');
  }
  if (
    vendorRuntimeProfileMasterIndex.runtime_profile_master_index_version !==
    VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERSION
  ) {
    throw new Error('Vendor runtime profile master index version drifted');
  }
  if (!vendorRuntimeProfileMasterIndex.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime profile master index must remain vendor neutral');
  }
  if (
    !vendorRuntimeProfileMasterIndex.design_constraints.reuses_certified_vendor_runtime_profile_archive
  ) {
    throw new Error(
      'Vendor runtime profile master index must reuse the certified vendor runtime profile archive'
    );
  }
  if (vendorRuntimeProfileMasterIndex.profile_master_index_runtime_entries.count !== 0) {
    throw new Error('PHASE-DSC-127 must not have assembled profile master index runtime entries');
  }
  if (vendorRuntimeProfileMasterIndex.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-DSC-127 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeProfileMasterIndex.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime profile master index channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeProfileMasterIndex.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime profile master index sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeProfileMasterIndex.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime profile master index spatial frame drifted');
  }
  if (
    vendorRuntimeProfileMasterIndex.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeProfileMasterIndex.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime profile master index capability set identity drifted');
  }

  const runtimeProfileMasterIndexManifestUpstream =
    vendorRuntimeProfileMasterIndex.runtime_profile_master_index_manifest;
  for (const entry of runtimeProfileMasterIndexManifestUpstream.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(
        `sealed runtime profile master index section missing on disk: ${entry.artifact_ref}`
      );
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(
        `sealed runtime profile master index section digest drifted: ${entry.artifact_ref}`
      );
    }
  }
  // Exact formula from the profile master index builder (sealed prefix label unchanged).
  const recomputedRuntimeProfileMasterIndexDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeProfileMasterIndexManifestUpstream.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_profile_archive:${runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_archive_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeProfileMasterIndexDigest !==
    runtimeProfileMasterIndexManifestUpstream.runtime_profile_master_index_digest
  ) {
    throw new Error(
      'sealed runtime profile master index digest drifted from the runtime profile master index manifest'
    );
  }
  const sealedComponentCount = runtimeProfileMasterIndexManifestUpstream.sealed_component_count;

  for (const spec of RUNTIME_PROFILE_RUNTIME_INDEX_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime profile master index section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_PROFILE_RUNTIME_INDEX_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime profile master index section id');
  }
  const sectionRefs = RUNTIME_PROFILE_RUNTIME_INDEX_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime profile master index section artifact ref');
  }

  const runtime_profile_runtime_index_schema: VendorRuntimeProfileRuntimeIndexSchema = {
    schema_id: 'dsc-vendor-runtime-profile-runtime-index-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime profile runtime index. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime profile runtime index binds one Vendor Runtime Profile Master Index as its root, seals the profile master index together with its schema and implementation registry, and seals the profile master index contents transitively through the runtime profile master index digest. It defines no concrete profile runtime index runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_profile_runtime_index_id_policy: 'opaque_runtime_profile_runtime_index_id_no_vendor_binding',
    runtime_profile_master_index_ref: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID,
    required_fields: [
      {
        field: 'runtime_profile_runtime_index_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_profile_runtime_index_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime profile runtime index version string',
      },
      {
        field: 'runtime_profile_runtime_index_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_profile_runtime_index',
      },
      {
        field: 'runtime_profile_master_index_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime profile master index ${VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID}`,
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
        field: 'deterministic_runtime_profile_runtime_index_identity',
        type: 'dsc-vendor-runtime-profile-runtime-index-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_profile_master_index_binding',
        type: 'dsc-vendor-runtime-profile-runtime-index-profile-master-index-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Profile Master Index as the runtime profile runtime index root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_profile_runtime_index_composition',
        type: 'dsc-vendor-runtime-profile-runtime-index-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime profile master index artifact, schema, and implementation registry sections; vendor-specific sections forbidden and profile master index contents never re-listed',
      },
      {
        field: 'runtime_profile_runtime_index_manifest',
        type: 'dsc-vendor-runtime-profile-runtime-index-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime profile master index digest and a runtime profile runtime index digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_profile_runtime_index_identity: DeterministicRuntimeProfileRuntimeIndexIdentity =
    {
      identity_id: 'dsc-vendor-runtime-profile-runtime-index-deterministic-identity-v1',
      description:
        'Deterministic identity of the vendor runtime profile runtime index. The runtime_profile_runtime_index_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
      runtime_profile_runtime_index_id: VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_ID,
      runtime_profile_runtime_index_version: VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_VERSION,
      identity_policy: 'opaque_runtime_profile_runtime_index_id_no_vendor_binding',
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

  const vendor_runtime_profile_master_index_binding: VendorRuntimeProfileMasterIndexBinding = {
    binding_id: 'dsc-vendor-runtime-profile-runtime-index-profile-master-index-binding-v1',
    description:
      'Exact binding of the PHASE-DSC-127 Vendor Runtime Profile Master Index as the runtime profile runtime index root. The binding is gated at build time on the recorded PHASE-DSC-127 PASS verdict, and re-seals every runtime profile master index section and the runtime profile master index digest before the runtime profile runtime index is emitted.',
    runtime_profile_master_index_ref: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PATH,
    runtime_profile_master_index_id: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID,
    runtime_profile_master_index_version: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERSION,
    runtime_profile_master_index_phase: DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PHASE,
    runtime_profile_master_index_system_id: DSC_VENDOR_RUNTIME_PROFILE_MASTER_INDEX_SYSTEM_ID,
    runtime_profile_master_index_evidence_ref: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_EVIDENCE_PATH,
    runtime_profile_master_index_verdict: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_VERDICT,
    runtime_profile_master_index_evidence_mode: 'phase_127_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_profile_runtime_index_root',
    sealed_runtime_profile_master_index_digest:
      runtimeProfileMasterIndexManifestUpstream.runtime_profile_master_index_digest,
    sealed_runtime_profile_archive_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    indexes_profile_master_index_in_this_phase: false,
    implements_runtime_profile_master_index_in_this_phase: false,
  };

  const runtime_profile_runtime_index_composition: RuntimeProfileRuntimeIndexComposition = {
    composition_id: 'dsc-vendor-runtime-profile-runtime-index-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Profile Master Index: the runtime profile master index artifact, its shape contract, and its implementation registry. The runtime profile master index contents (and everything sealed beneath them) are sealed transitively through the runtime profile master index digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_profile_master_index',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_PROFILE_RUNTIME_INDEX_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_profile_master_index_contents_sealed_via_runtime_profile_master_index_digest',
      sealed_via: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_profile_master_index_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeProfileRuntimeIndexManifestEntry[] = RUNTIME_PROFILE_RUNTIME_INDEX_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_profile_runtime_index_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_profile_master_index:${runtimeProfileMasterIndexManifestUpstream.runtime_profile_master_index_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_profile_runtime_index_manifest: RuntimeProfileRuntimeIndexManifest = {
    manifest_id: 'dsc-vendor-runtime-profile-runtime-index-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime profile runtime index section. Digests are computed read-only from disk. The sealed runtime profile master index digest carries the profile master index contents (and everything sealed beneath them) transitively, and the runtime profile runtime index digest is the SHA256 of the ordered section digests and the sealed runtime profile master index digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_profile_master_index_digest:
      runtimeProfileMasterIndexManifestUpstream.runtime_profile_master_index_digest,
    sealed_runtime_profile_archive_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileMasterIndexManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileMasterIndexManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_profile_runtime_index_digest,
    runtime_profile_runtime_index_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_profile_master_index_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeProfileRuntimeIndex: DirectSpatialConditioningVendorRuntimeProfileRuntimeIndex = {
    vendor_runtime_profile_runtime_index_id:
      'direct-spatial-conditioning-vendor-runtime-profile-runtime-index-v1',
    phase: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_PHASE,
    system_id: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_profile_runtime_index',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_V1',
    runtime_profile_runtime_index_id: VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_ID,
    runtime_profile_runtime_index_version: VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_VERSION,
    runtime_profile_runtime_index_kind: 'vendor_runtime_profile_runtime_index',
    runtime_profile_master_index_ref: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_PATH,
    runtime_profile_master_index_schema_ref: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_SCHEMA_PATH,
    runtime_profile_master_index_implementation_registry_ref:
      VENDOR_RUNTIME_PROFILE_MASTER_INDEX_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_master_index_evidence_ref: VENDOR_RUNTIME_PROFILE_MASTER_INDEX_EVIDENCE_PATH,
    runtime_profile_archive_ref: vendorRuntimeProfileMasterIndex.runtime_profile_archive_ref,
    runtime_profile_archive_schema_ref: vendorRuntimeProfileMasterIndex.runtime_profile_archive_schema_ref,
    runtime_profile_archive_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_archive_implementation_registry_ref,
    runtime_profile_archive_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_profile_archive_evidence_ref,
    runtime_profile_bundle_ref: vendorRuntimeProfileMasterIndex.runtime_profile_bundle_ref,
    runtime_profile_bundle_schema_ref: vendorRuntimeProfileMasterIndex.runtime_profile_bundle_schema_ref,
    runtime_profile_bundle_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_bundle_implementation_registry_ref,
    runtime_profile_bundle_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_profile_bundle_evidence_ref,
    runtime_profile_package_ref: vendorRuntimeProfileMasterIndex.runtime_profile_package_ref,
    runtime_profile_package_schema_ref: vendorRuntimeProfileMasterIndex.runtime_profile_package_schema_ref,
    runtime_profile_package_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_package_implementation_registry_ref,
    runtime_profile_package_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_profile_package_evidence_ref,
    runtime_profile_definition_ref: vendorRuntimeProfileMasterIndex.runtime_profile_definition_ref,
    runtime_profile_definition_schema_ref: vendorRuntimeProfileMasterIndex.runtime_profile_definition_schema_ref,
    runtime_profile_definition_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_definition_implementation_registry_ref,
    runtime_profile_definition_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_profile_definition_evidence_ref,
    runtime_profile_descriptor_ref: vendorRuntimeProfileMasterIndex.runtime_profile_descriptor_ref,
    runtime_profile_descriptor_schema_ref: vendorRuntimeProfileMasterIndex.runtime_profile_descriptor_schema_ref,
    runtime_profile_descriptor_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_descriptor_implementation_registry_ref,
    runtime_profile_descriptor_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_profile_descriptor_evidence_ref,
    runtime_profile_reference_ref: vendorRuntimeProfileMasterIndex.runtime_profile_reference_ref,
    runtime_profile_reference_schema_ref: vendorRuntimeProfileMasterIndex.runtime_profile_reference_schema_ref,
    runtime_profile_reference_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_reference_implementation_registry_ref,
    runtime_profile_reference_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_profile_reference_evidence_ref,
    runtime_profile_registry_ref: vendorRuntimeProfileMasterIndex.runtime_profile_registry_ref,
    runtime_profile_registry_schema_ref: vendorRuntimeProfileMasterIndex.runtime_profile_registry_schema_ref,
    runtime_profile_registry_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_registry_implementation_registry_ref,
    runtime_profile_registry_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_profile_registry_evidence_ref,
    runtime_profile_catalog_ref: vendorRuntimeProfileMasterIndex.runtime_profile_catalog_ref,
    runtime_profile_catalog_schema_ref: vendorRuntimeProfileMasterIndex.runtime_profile_catalog_schema_ref,
    runtime_profile_catalog_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_catalog_implementation_registry_ref,
    runtime_profile_catalog_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_profile_catalog_evidence_ref,
    runtime_profile_index_ref: vendorRuntimeProfileMasterIndex.runtime_profile_index_ref,
    runtime_profile_index_schema_ref: vendorRuntimeProfileMasterIndex.runtime_profile_index_schema_ref,
    runtime_profile_index_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_index_implementation_registry_ref,
    runtime_profile_index_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_profile_index_evidence_ref,
    runtime_profile_collection_ref: vendorRuntimeProfileMasterIndex.runtime_profile_collection_ref,
    runtime_profile_collection_schema_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_collection_schema_ref,
    runtime_profile_collection_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_collection_implementation_registry_ref,
    runtime_profile_collection_evidence_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_collection_evidence_ref,
    runtime_profile_set_ref: vendorRuntimeProfileMasterIndex.runtime_profile_set_ref,
    runtime_profile_set_schema_ref: vendorRuntimeProfileMasterIndex.runtime_profile_set_schema_ref,
    runtime_profile_set_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_profile_set_implementation_registry_ref,
    runtime_profile_set_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_profile_set_evidence_ref,
    runtime_blueprint_ref: vendorRuntimeProfileMasterIndex.runtime_blueprint_ref,
    runtime_blueprint_schema_ref: vendorRuntimeProfileMasterIndex.runtime_blueprint_schema_ref,
    runtime_blueprint_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_blueprint_implementation_registry_ref,
    runtime_blueprint_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_blueprint_evidence_ref,
    runtime_definition_ref: vendorRuntimeProfileMasterIndex.runtime_definition_ref,
    runtime_definition_schema_ref: vendorRuntimeProfileMasterIndex.runtime_definition_schema_ref,
    runtime_definition_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_definition_implementation_registry_ref,
    runtime_definition_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_definition_evidence_ref,
    runtime_descriptor_ref: vendorRuntimeProfileMasterIndex.runtime_descriptor_ref,
    runtime_descriptor_schema_ref: vendorRuntimeProfileMasterIndex.runtime_descriptor_schema_ref,
    runtime_descriptor_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_descriptor_implementation_registry_ref,
    runtime_descriptor_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_descriptor_evidence_ref,
    runtime_contract_ref: vendorRuntimeProfileMasterIndex.runtime_contract_ref,
    runtime_contract_schema_ref: vendorRuntimeProfileMasterIndex.runtime_contract_schema_ref,
    runtime_contract_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_contract_implementation_registry_ref,
    runtime_contract_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_contract_evidence_ref,
    runtime_specification_ref: vendorRuntimeProfileMasterIndex.runtime_specification_ref,
    runtime_specification_schema_ref:
      vendorRuntimeProfileMasterIndex.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref:
      vendorRuntimeProfileMasterIndex.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeProfileMasterIndex.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeProfileMasterIndex.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeProfileMasterIndex.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeProfileMasterIndex.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeProfileMasterIndex.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeProfileMasterIndex.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeProfileMasterIndex.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeProfileMasterIndex.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeProfileMasterIndex.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeProfileMasterIndex.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeProfileMasterIndex.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeProfileMasterIndex.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeProfileMasterIndex.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeProfileMasterIndex.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeProfileMasterIndex.reference_bundle_ref,
    package_ref: vendorRuntimeProfileMasterIndex.package_ref,
    template_ref: vendorRuntimeProfileMasterIndex.template_ref,
    template_certification_ref: vendorRuntimeProfileMasterIndex.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeProfileMasterIndex.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_profile_runtime_index_schema,
    deterministic_runtime_profile_runtime_index_identity,
    vendor_runtime_profile_master_index_binding,
    runtime_profile_runtime_index_composition,
    runtime_profile_runtime_index_manifest,
    profile_runtime_index_runtime_entries: {
      count: 0,
      entries: [],
      indexing_policy:
        'concrete vendor runtime profile runtime index entries may be registered into this profile runtime index only in a future implementation phase; none are registered here',
      indexes_profile_master_index_in_this_phase: false,
    },
    design_constraints: {
      runtime_profile_runtime_index_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_profile_master_index: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      indexes_profile_master_index_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_PROFILE_RUNTIME_INDEX_PATH, vendorRuntimeProfileRuntimeIndex);
  return { vendorRuntimeProfileRuntimeIndex };
}
