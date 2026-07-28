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
  DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_BUNDLE_ID,
  VENDOR_RUNTIME_PROFILE_BUNDLE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileBundle,
} from './directSpatialConditioningVendorRuntimeProfileBundleBuilder.js';

/**
 * PHASE-DSC-125: Direct Spatial Conditioning vendor runtime profile archive.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Describes the PHASE-DSC-123 Vendor
 * Runtime Profile Bundle as the sole design-time archive root:
 *   - runtime profile archive schema,
 *   - deterministic runtime profile archive identity,
 *   - Vendor Runtime Profile Bundle binding,
 *   - runtime profile archive composition, and
 *   - runtime profile archive manifest.
 *
 * The profile archive seals three design sections directly (runtime profile bundle
 * artifact, schema, implementation registry) and seals everything the profile bundle
 * owns transitively through the runtime profile bundle digest. It defines
 * no concrete profile archive runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 *
 * PHASE-DSC-124 was not run, so the binding is gated on the recorded PHASE-DSC-123 PASS
 * verdict rather than a dedicated certification artifact.
 */

export const DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_PHASE = 'PHASE-DSC-125' as const;
export const DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_ARCHIVE_V1' as const;

export const VENDOR_RUNTIME_PROFILE_ARCHIVE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_PROFILE_ARCHIVE_PATH =
  `${VENDOR_RUNTIME_PROFILE_ARCHIVE_ROOT}/direct-spatial-conditioning-vendor-runtime-profile-archive-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime profile archive. */
export const VENDOR_RUNTIME_PROFILE_ARCHIVE_ID =
  'dsc-vendor-runtime-profile-archive-v1' as const;

export const VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-DSC-123 vendor runtime profile bundle. */
export const VENDOR_RUNTIME_PROFILE_BUNDLE_EVIDENCE_PATH =
  VENDOR_RUNTIME_PROFILE_BUNDLE_VALIDATION_REPORT_PATH;

export const VENDOR_RUNTIME_PROFILE_BUNDLE_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_BUNDLE_V1' as const;

export const VENDOR_RUNTIME_PROFILE_ARCHIVE_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-archive.schema.json' as const;
export const VENDOR_RUNTIME_PROFILE_ARCHIVE_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-archive-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_PROFILE_ARCHIVE_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_ARCHIVE_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime profile archive sections. Only the profile archive's own
 * design-time publication set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_PROFILE_ARCHIVE_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_profile_bundle_artifact'
    | 'runtime_profile_bundle_schema'
    | 'runtime_profile_bundle_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_profile_bundle',
    role: 'runtime_profile_archive_root_profile_bundle',
    kind: 'runtime_profile_bundle_artifact',
    artifact_ref: VENDOR_RUNTIME_PROFILE_BUNDLE_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_bundle_schema',
    role: 'runtime_profile_bundle_shape_contract',
    kind: 'runtime_profile_bundle_schema',
    artifact_ref: VENDOR_RUNTIME_PROFILE_BUNDLE_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_bundle_implementation_registry',
    role: 'runtime_profile_bundle_provenance_registry',
    kind: 'runtime_profile_bundle_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_PROFILE_BUNDLE_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeProfileArchiveSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeProfileArchiveSchema {
  schema_id: 'dsc-vendor-runtime-profile-archive-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_profile_archive_id_policy: 'opaque_runtime_profile_archive_id_no_vendor_binding';
  runtime_profile_bundle_ref: typeof VENDOR_RUNTIME_PROFILE_BUNDLE_ID;
  required_fields: RuntimeProfileArchiveSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeProfileArchiveIdentity {
  identity_id: 'dsc-vendor-runtime-profile-archive-deterministic-identity-v1';
  description: string;
  runtime_profile_archive_id: typeof VENDOR_RUNTIME_PROFILE_ARCHIVE_ID;
  runtime_profile_archive_version: typeof VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION;
  identity_policy: 'opaque_runtime_profile_archive_id_no_vendor_binding';
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

export interface VendorRuntimeProfileBundleBinding {
  binding_id: 'dsc-vendor-runtime-profile-archive-profile-bundle-binding-v1';
  description: string;
  runtime_profile_bundle_ref: string;
  runtime_profile_bundle_id: typeof VENDOR_RUNTIME_PROFILE_BUNDLE_ID;
  runtime_profile_bundle_version: typeof VENDOR_RUNTIME_PROFILE_BUNDLE_VERSION;
  runtime_profile_bundle_phase: typeof DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_PHASE;
  runtime_profile_bundle_system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_SYSTEM_ID;
  runtime_profile_bundle_evidence_ref: string;
  runtime_profile_bundle_verdict: typeof VENDOR_RUNTIME_PROFILE_BUNDLE_VERDICT;
  runtime_profile_bundle_evidence_mode: 'phase_123_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_profile_archive_root';
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
  archives_profile_bundle_in_this_phase: false;
  implements_runtime_profile_bundle_in_this_phase: false;
}

export interface RuntimeProfileArchiveSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeProfileArchiveComposition {
  composition_id: 'dsc-vendor-runtime-profile-archive-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_profile_bundle';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeProfileArchiveSection[];
  transitive_seal: {
    policy: 'runtime_profile_bundle_contents_sealed_via_runtime_profile_bundle_digest';
    sealed_via: typeof VENDOR_RUNTIME_PROFILE_BUNDLE_ID;
    sealed_component_count: number;
    re_lists_runtime_profile_bundle_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeProfileArchiveManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeProfileArchiveManifest {
  manifest_id: 'dsc-vendor-runtime-profile-archive-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeProfileArchiveManifestEntry[];
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
  runtime_profile_archive_digest: string;
  runtime_profile_archive_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_profile_bundle_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeProfileArchive {
  vendor_runtime_profile_archive_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_profile_archive';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_ARCHIVE_V1';
  runtime_profile_archive_id: typeof VENDOR_RUNTIME_PROFILE_ARCHIVE_ID;
  runtime_profile_archive_version: typeof VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION;
  runtime_profile_archive_kind: 'vendor_runtime_profile_archive';
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
  runtime_profile_archive_schema: VendorRuntimeProfileArchiveSchema;
  deterministic_runtime_profile_archive_identity: DeterministicRuntimeProfileArchiveIdentity;
  vendor_runtime_profile_bundle_binding: VendorRuntimeProfileBundleBinding;
  runtime_profile_archive_composition: RuntimeProfileArchiveComposition;
  runtime_profile_archive_manifest: RuntimeProfileArchiveManifest;
  profile_archive_runtime_entries: {
    count: 0;
    entries: [];
    archiving_policy: string;
    archives_profile_bundle_in_this_phase: false;
  };
  design_constraints: {
    runtime_profile_archive_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_profile_bundle: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    archives_profile_bundle_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime profile archive.
 * Reuses the PHASE-DSC-123 Vendor Runtime Profile Bundle by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime profile archive artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeProfileArchive(
  projectRoot?: string
): { vendorRuntimeProfileArchive: DirectSpatialConditioningVendorRuntimeProfileArchive } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_PROFILE_BUNDLE_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-DSC-123 vendor runtime profile bundle did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_PROFILE_BUNDLE_VERDICT) {
    throw new Error(
      `PHASE-DSC-123 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_PHASE) {
    throw new Error('PHASE-DSC-123 evidence does not cover the vendor runtime profile bundle');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-DSC-123 evidence reports outstanding errors');
  }

  const vendorRuntimeProfileBundle =
    readJson<DirectSpatialConditioningVendorRuntimeProfileBundle>(
      root,
      VENDOR_RUNTIME_PROFILE_BUNDLE_PATH
    );
  if (
    vendorRuntimeProfileBundle.phase !== DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_PHASE ||
    vendorRuntimeProfileBundle.system_id !== DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_SYSTEM_ID
  ) {
    throw new Error('PHASE-DSC-123 vendor runtime profile bundle is missing or incompatible');
  }
  if (
    vendorRuntimeProfileBundle.runtime_profile_bundle_id !==
    VENDOR_RUNTIME_PROFILE_BUNDLE_ID
  ) {
    throw new Error('Vendor runtime profile bundle identity drifted');
  }
  if (
    vendorRuntimeProfileBundle.runtime_profile_bundle_version !==
    VENDOR_RUNTIME_PROFILE_BUNDLE_VERSION
  ) {
    throw new Error('Vendor runtime profile bundle version drifted');
  }
  if (!vendorRuntimeProfileBundle.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime profile bundle must remain vendor neutral');
  }
  if (
    !vendorRuntimeProfileBundle.design_constraints.reuses_certified_vendor_runtime_profile_package
  ) {
    throw new Error(
      'Vendor runtime profile bundle must reuse the certified vendor runtime profile package'
    );
  }
  if (vendorRuntimeProfileBundle.profile_bundle_runtime_entries.count !== 0) {
    throw new Error('PHASE-DSC-123 must not have assembled profile bundle runtime entries');
  }
  if (vendorRuntimeProfileBundle.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-DSC-123 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeProfileBundle.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime profile bundle channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeProfileBundle.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime profile bundle sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeProfileBundle.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime profile bundle spatial frame drifted');
  }
  if (
    vendorRuntimeProfileBundle.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeProfileBundle.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime profile bundle capability set identity drifted');
  }

  const runtimeProfileBundleManifestUpstream =
    vendorRuntimeProfileBundle.runtime_profile_bundle_manifest;
  for (const entry of runtimeProfileBundleManifestUpstream.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(
        `sealed runtime profile bundle section missing on disk: ${entry.artifact_ref}`
      );
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(
        `sealed runtime profile bundle section digest drifted: ${entry.artifact_ref}`
      );
    }
  }
  // Exact formula from the profile bundle builder (sealed prefix label unchanged).
  const recomputedRuntimeProfileBundleDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeProfileBundleManifestUpstream.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_profile_package:${runtimeProfileBundleManifestUpstream.sealed_runtime_profile_package_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeProfileBundleDigest !==
    runtimeProfileBundleManifestUpstream.runtime_profile_bundle_digest
  ) {
    throw new Error(
      'sealed runtime profile bundle digest drifted from the runtime profile bundle manifest'
    );
  }
  const sealedComponentCount = runtimeProfileBundleManifestUpstream.sealed_component_count;

  for (const spec of RUNTIME_PROFILE_ARCHIVE_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime profile bundle section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_PROFILE_ARCHIVE_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime profile bundle section id');
  }
  const sectionRefs = RUNTIME_PROFILE_ARCHIVE_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime profile bundle section artifact ref');
  }

  const runtime_profile_archive_schema: VendorRuntimeProfileArchiveSchema = {
    schema_id: 'dsc-vendor-runtime-profile-archive-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime profile archive. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime profile archive binds one Vendor Runtime Profile Bundle as its root, seals the profile bundle together with its schema and implementation registry, and seals the profile bundle contents transitively through the runtime profile bundle digest. It defines no concrete profile archive runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_profile_archive_id_policy: 'opaque_runtime_profile_archive_id_no_vendor_binding',
    runtime_profile_bundle_ref: VENDOR_RUNTIME_PROFILE_BUNDLE_ID,
    required_fields: [
      {
        field: 'runtime_profile_archive_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_profile_archive_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime profile archive version string',
      },
      {
        field: 'runtime_profile_archive_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_profile_archive',
      },
      {
        field: 'runtime_profile_bundle_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime profile bundle ${VENDOR_RUNTIME_PROFILE_BUNDLE_ID}`,
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
        field: 'deterministic_runtime_profile_archive_identity',
        type: 'dsc-vendor-runtime-profile-archive-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_profile_bundle_binding',
        type: 'dsc-vendor-runtime-profile-archive-profile-bundle-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Profile Bundle as the runtime profile archive root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_profile_archive_composition',
        type: 'dsc-vendor-runtime-profile-archive-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime profile bundle artifact, schema, and implementation registry sections; vendor-specific sections forbidden and profile bundle contents never re-listed',
      },
      {
        field: 'runtime_profile_archive_manifest',
        type: 'dsc-vendor-runtime-profile-archive-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime profile bundle digest and a runtime profile archive digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_profile_archive_identity: DeterministicRuntimeProfileArchiveIdentity =
    {
      identity_id: 'dsc-vendor-runtime-profile-archive-deterministic-identity-v1',
      description:
        'Deterministic identity of the vendor runtime profile archive. The runtime_profile_archive_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
      runtime_profile_archive_id: VENDOR_RUNTIME_PROFILE_ARCHIVE_ID,
      runtime_profile_archive_version: VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION,
      identity_policy: 'opaque_runtime_profile_archive_id_no_vendor_binding',
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

  const vendor_runtime_profile_bundle_binding: VendorRuntimeProfileBundleBinding = {
    binding_id: 'dsc-vendor-runtime-profile-archive-profile-bundle-binding-v1',
    description:
      'Exact binding of the PHASE-DSC-123 Vendor Runtime Profile Bundle as the runtime profile archive root. The binding is gated at build time on the recorded PHASE-DSC-123 PASS verdict, and re-seals every runtime profile bundle section and the runtime profile bundle digest before the runtime profile archive is emitted.',
    runtime_profile_bundle_ref: VENDOR_RUNTIME_PROFILE_BUNDLE_PATH,
    runtime_profile_bundle_id: VENDOR_RUNTIME_PROFILE_BUNDLE_ID,
    runtime_profile_bundle_version: VENDOR_RUNTIME_PROFILE_BUNDLE_VERSION,
    runtime_profile_bundle_phase: DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_PHASE,
    runtime_profile_bundle_system_id: DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_SYSTEM_ID,
    runtime_profile_bundle_evidence_ref: VENDOR_RUNTIME_PROFILE_BUNDLE_EVIDENCE_PATH,
    runtime_profile_bundle_verdict: VENDOR_RUNTIME_PROFILE_BUNDLE_VERDICT,
    runtime_profile_bundle_evidence_mode: 'phase_123_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_profile_archive_root',
    sealed_runtime_profile_bundle_digest:
      runtimeProfileBundleManifestUpstream.runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    archives_profile_bundle_in_this_phase: false,
    implements_runtime_profile_bundle_in_this_phase: false,
  };

  const runtime_profile_archive_composition: RuntimeProfileArchiveComposition = {
    composition_id: 'dsc-vendor-runtime-profile-archive-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Profile Bundle: the runtime profile bundle artifact, its shape contract, and its implementation registry. The runtime profile bundle contents (and everything sealed beneath them) are sealed transitively through the runtime profile bundle digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_profile_bundle',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_PROFILE_ARCHIVE_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_profile_bundle_contents_sealed_via_runtime_profile_bundle_digest',
      sealed_via: VENDOR_RUNTIME_PROFILE_BUNDLE_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_profile_bundle_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeProfileArchiveManifestEntry[] = RUNTIME_PROFILE_ARCHIVE_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_profile_archive_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_profile_bundle:${runtimeProfileBundleManifestUpstream.runtime_profile_bundle_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_profile_archive_manifest: RuntimeProfileArchiveManifest = {
    manifest_id: 'dsc-vendor-runtime-profile-archive-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime profile archive section. Digests are computed read-only from disk. The sealed runtime profile bundle digest carries the profile bundle contents (and everything sealed beneath them) transitively, and the runtime profile archive digest is the SHA256 of the ordered section digests and the sealed runtime profile bundle digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileBundleManifestUpstream.runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileBundleManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileBundleManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_profile_archive_digest,
    runtime_profile_archive_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_profile_bundle_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeProfileArchive: DirectSpatialConditioningVendorRuntimeProfileArchive = {
    vendor_runtime_profile_archive_id:
      'direct-spatial-conditioning-vendor-runtime-profile-archive-v1',
    phase: DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_PHASE,
    system_id: DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_profile_archive',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_ARCHIVE_V1',
    runtime_profile_archive_id: VENDOR_RUNTIME_PROFILE_ARCHIVE_ID,
    runtime_profile_archive_version: VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION,
    runtime_profile_archive_kind: 'vendor_runtime_profile_archive',
    runtime_profile_bundle_ref: VENDOR_RUNTIME_PROFILE_BUNDLE_PATH,
    runtime_profile_bundle_schema_ref: VENDOR_RUNTIME_PROFILE_BUNDLE_SCHEMA_PATH,
    runtime_profile_bundle_implementation_registry_ref:
      VENDOR_RUNTIME_PROFILE_BUNDLE_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_bundle_evidence_ref: VENDOR_RUNTIME_PROFILE_BUNDLE_EVIDENCE_PATH,
    runtime_profile_package_ref: vendorRuntimeProfileBundle.runtime_profile_package_ref,
    runtime_profile_package_schema_ref: vendorRuntimeProfileBundle.runtime_profile_package_schema_ref,
    runtime_profile_package_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_profile_package_implementation_registry_ref,
    runtime_profile_package_evidence_ref: vendorRuntimeProfileBundle.runtime_profile_package_evidence_ref,
    runtime_profile_definition_ref: vendorRuntimeProfileBundle.runtime_profile_definition_ref,
    runtime_profile_definition_schema_ref: vendorRuntimeProfileBundle.runtime_profile_definition_schema_ref,
    runtime_profile_definition_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_profile_definition_implementation_registry_ref,
    runtime_profile_definition_evidence_ref: vendorRuntimeProfileBundle.runtime_profile_definition_evidence_ref,
    runtime_profile_descriptor_ref: vendorRuntimeProfileBundle.runtime_profile_descriptor_ref,
    runtime_profile_descriptor_schema_ref: vendorRuntimeProfileBundle.runtime_profile_descriptor_schema_ref,
    runtime_profile_descriptor_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_profile_descriptor_implementation_registry_ref,
    runtime_profile_descriptor_evidence_ref: vendorRuntimeProfileBundle.runtime_profile_descriptor_evidence_ref,
    runtime_profile_reference_ref: vendorRuntimeProfileBundle.runtime_profile_reference_ref,
    runtime_profile_reference_schema_ref: vendorRuntimeProfileBundle.runtime_profile_reference_schema_ref,
    runtime_profile_reference_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_profile_reference_implementation_registry_ref,
    runtime_profile_reference_evidence_ref: vendorRuntimeProfileBundle.runtime_profile_reference_evidence_ref,
    runtime_profile_registry_ref: vendorRuntimeProfileBundle.runtime_profile_registry_ref,
    runtime_profile_registry_schema_ref: vendorRuntimeProfileBundle.runtime_profile_registry_schema_ref,
    runtime_profile_registry_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_profile_registry_implementation_registry_ref,
    runtime_profile_registry_evidence_ref: vendorRuntimeProfileBundle.runtime_profile_registry_evidence_ref,
    runtime_profile_catalog_ref: vendorRuntimeProfileBundle.runtime_profile_catalog_ref,
    runtime_profile_catalog_schema_ref: vendorRuntimeProfileBundle.runtime_profile_catalog_schema_ref,
    runtime_profile_catalog_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_profile_catalog_implementation_registry_ref,
    runtime_profile_catalog_evidence_ref: vendorRuntimeProfileBundle.runtime_profile_catalog_evidence_ref,
    runtime_profile_index_ref: vendorRuntimeProfileBundle.runtime_profile_index_ref,
    runtime_profile_index_schema_ref: vendorRuntimeProfileBundle.runtime_profile_index_schema_ref,
    runtime_profile_index_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_profile_index_implementation_registry_ref,
    runtime_profile_index_evidence_ref: vendorRuntimeProfileBundle.runtime_profile_index_evidence_ref,
    runtime_profile_collection_ref: vendorRuntimeProfileBundle.runtime_profile_collection_ref,
    runtime_profile_collection_schema_ref:
      vendorRuntimeProfileBundle.runtime_profile_collection_schema_ref,
    runtime_profile_collection_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_profile_collection_implementation_registry_ref,
    runtime_profile_collection_evidence_ref:
      vendorRuntimeProfileBundle.runtime_profile_collection_evidence_ref,
    runtime_profile_set_ref: vendorRuntimeProfileBundle.runtime_profile_set_ref,
    runtime_profile_set_schema_ref: vendorRuntimeProfileBundle.runtime_profile_set_schema_ref,
    runtime_profile_set_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_profile_set_implementation_registry_ref,
    runtime_profile_set_evidence_ref: vendorRuntimeProfileBundle.runtime_profile_set_evidence_ref,
    runtime_blueprint_ref: vendorRuntimeProfileBundle.runtime_blueprint_ref,
    runtime_blueprint_schema_ref: vendorRuntimeProfileBundle.runtime_blueprint_schema_ref,
    runtime_blueprint_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_blueprint_implementation_registry_ref,
    runtime_blueprint_evidence_ref: vendorRuntimeProfileBundle.runtime_blueprint_evidence_ref,
    runtime_definition_ref: vendorRuntimeProfileBundle.runtime_definition_ref,
    runtime_definition_schema_ref: vendorRuntimeProfileBundle.runtime_definition_schema_ref,
    runtime_definition_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_definition_implementation_registry_ref,
    runtime_definition_evidence_ref: vendorRuntimeProfileBundle.runtime_definition_evidence_ref,
    runtime_descriptor_ref: vendorRuntimeProfileBundle.runtime_descriptor_ref,
    runtime_descriptor_schema_ref: vendorRuntimeProfileBundle.runtime_descriptor_schema_ref,
    runtime_descriptor_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_descriptor_implementation_registry_ref,
    runtime_descriptor_evidence_ref: vendorRuntimeProfileBundle.runtime_descriptor_evidence_ref,
    runtime_contract_ref: vendorRuntimeProfileBundle.runtime_contract_ref,
    runtime_contract_schema_ref: vendorRuntimeProfileBundle.runtime_contract_schema_ref,
    runtime_contract_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_contract_implementation_registry_ref,
    runtime_contract_evidence_ref: vendorRuntimeProfileBundle.runtime_contract_evidence_ref,
    runtime_specification_ref: vendorRuntimeProfileBundle.runtime_specification_ref,
    runtime_specification_schema_ref:
      vendorRuntimeProfileBundle.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref:
      vendorRuntimeProfileBundle.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeProfileBundle.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeProfileBundle.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeProfileBundle.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeProfileBundle.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeProfileBundle.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeProfileBundle.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeProfileBundle.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeProfileBundle.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeProfileBundle.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeProfileBundle.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeProfileBundle.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeProfileBundle.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeProfileBundle.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeProfileBundle.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeProfileBundle.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeProfileBundle.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeProfileBundle.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeProfileBundle.reference_bundle_ref,
    package_ref: vendorRuntimeProfileBundle.package_ref,
    template_ref: vendorRuntimeProfileBundle.template_ref,
    template_certification_ref: vendorRuntimeProfileBundle.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeProfileBundle.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_profile_archive_schema,
    deterministic_runtime_profile_archive_identity,
    vendor_runtime_profile_bundle_binding,
    runtime_profile_archive_composition,
    runtime_profile_archive_manifest,
    profile_archive_runtime_entries: {
      count: 0,
      entries: [],
      archiving_policy:
        'concrete vendor runtime profile archive entries may be registered into this profile archive only in a future implementation phase; none are registered here',
      archives_profile_bundle_in_this_phase: false,
    },
    design_constraints: {
      runtime_profile_archive_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_profile_bundle: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      archives_profile_bundle_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_PROFILE_ARCHIVE_PATH, vendorRuntimeProfileArchive);
  return { vendorRuntimeProfileArchive };
}
