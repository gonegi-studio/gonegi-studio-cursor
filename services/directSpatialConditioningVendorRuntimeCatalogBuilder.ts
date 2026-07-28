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
import { VENDOR_IMPLEMENTATION_TEMPLATE_PATH } from './directSpatialConditioningVendorImplementationTemplateBuilder.js';
import { VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH } from './directSpatialConditioningVendorImplementationTemplateCertificationBuilder.js';
import { VENDOR_REFERENCE_PACKAGE_PATH } from './directSpatialConditioningVendorReferencePackageBuilder.js';
import { VENDOR_REFERENCE_BUNDLE_PATH } from './directSpatialConditioningVendorReferenceBundleBuilder.js';
import { VENDOR_RUNTIME_PACKAGE_PATH } from './directSpatialConditioningVendorRuntimePackageBuilder.js';
import { VENDOR_RUNTIME_BUNDLE_PATH } from './directSpatialConditioningVendorRuntimeBundleBuilder.js';
import { VENDOR_RUNTIME_PROFILE_PATH } from './directSpatialConditioningVendorRuntimeProfileBuilder.js';
import { VENDOR_RUNTIME_REGISTRY_PATH } from './directSpatialConditioningVendorRuntimeRegistryBuilder.js';
import {
  DSC_VENDOR_RUNTIME_INDEX_PHASE,
  DSC_VENDOR_RUNTIME_INDEX_SYSTEM_ID,
  VENDOR_RUNTIME_INDEX_ID,
  VENDOR_RUNTIME_INDEX_PATH,
  VENDOR_RUNTIME_INDEX_VERSION,
  type DirectSpatialConditioningVendorRuntimeIndex,
} from './directSpatialConditioningVendorRuntimeIndexBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-089: Direct Spatial Conditioning vendor runtime catalog.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Catalogs the PHASE-087 Vendor
 * Runtime Index as the sole design-time publication root:
 *   - runtime catalog schema,
 *   - deterministic runtime catalog identity,
 *   - Vendor Runtime Index binding,
 *   - runtime catalog composition, and
 *   - runtime catalog manifest.
 *
 * The catalog seals three design sections directly (runtime index, schema,
 * implementation registry) and seals everything the runtime index owns
 * transitively through the runtime index digest, so it never re-lists what
 * the index already owns. It catalogs no concrete runtime, implements no
 * vendor, declares no runtime execution, performs no GPU or inference work,
 * and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_CATALOG_PHASE = 'PHASE-DSC-089' as const;
export const DSC_VENDOR_RUNTIME_CATALOG_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CATALOG_V1' as const;

export const VENDOR_RUNTIME_CATALOG_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_CATALOG_PATH =
  `${VENDOR_RUNTIME_CATALOG_ROOT}/direct-spatial-conditioning-vendor-runtime-catalog-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime catalog. */
export const VENDOR_RUNTIME_CATALOG_ID = 'dsc-vendor-runtime-catalog-v1' as const;
export const VENDOR_RUNTIME_CATALOG_VERSION = '1.0' as const;

/** Design-time contract set of the passing PHASE-087 runtime index. */
export const VENDOR_RUNTIME_INDEX_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-index.schema.json' as const;
export const VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-index-implementation-registry-v1.json' as const;
export const VENDOR_RUNTIME_INDEX_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_INDEX_VALIDATION_REPORT.json' as const;

export const VENDOR_RUNTIME_INDEX_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_INDEX_V1' as const;

/**
 * Ordered runtime catalog sections. Only the runtime index's own design-time
 * contract set is sealed directly; everything it owns is sealed transitively.
 */
export const RUNTIME_CATALOG_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_index_artifact'
    | 'runtime_index_schema'
    | 'runtime_index_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_index',
    role: 'runtime_catalog_root_index',
    kind: 'runtime_index_artifact',
    artifact_ref: VENDOR_RUNTIME_INDEX_PATH,
  },
  {
    section_id: 'vendor_runtime_index_schema',
    role: 'runtime_index_shape_contract',
    kind: 'runtime_index_schema',
    artifact_ref: VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_index_implementation_registry',
    role: 'runtime_index_provenance_registry',
    kind: 'runtime_index_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeCatalogSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeCatalogSchema {
  schema_id: 'dsc-vendor-runtime-catalog-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_catalog_id_policy: 'opaque_runtime_catalog_id_no_vendor_binding';
  runtime_index_ref: typeof VENDOR_RUNTIME_INDEX_ID;
  required_fields: RuntimeCatalogSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeCatalogIdentity {
  identity_id: 'dsc-vendor-runtime-catalog-deterministic-identity-v1';
  description: string;
  runtime_catalog_id: typeof VENDOR_RUNTIME_CATALOG_ID;
  runtime_catalog_version: typeof VENDOR_RUNTIME_CATALOG_VERSION;
  identity_policy: 'opaque_runtime_catalog_id_no_vendor_binding';
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

export interface VendorRuntimeIndexBinding {
  binding_id: 'dsc-vendor-runtime-catalog-index-binding-v1';
  description: string;
  runtime_index_ref: string;
  runtime_index_id: typeof VENDOR_RUNTIME_INDEX_ID;
  runtime_index_version: typeof VENDOR_RUNTIME_INDEX_VERSION;
  runtime_index_phase: typeof DSC_VENDOR_RUNTIME_INDEX_PHASE;
  runtime_index_system_id: typeof DSC_VENDOR_RUNTIME_INDEX_SYSTEM_ID;
  runtime_index_evidence_ref: string;
  runtime_index_verdict: typeof VENDOR_RUNTIME_INDEX_VERDICT;
  runtime_index_evidence_mode: 'phase_087_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_catalog_root';
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  catalogs_runtime_in_this_phase: false;
  implements_runtime_index_in_this_phase: false;
}

export interface RuntimeCatalogSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeCatalogComposition {
  composition_id: 'dsc-vendor-runtime-catalog-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_index';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeCatalogSection[];
  transitive_seal: {
    policy: 'runtime_index_contents_sealed_via_runtime_index_digest';
    sealed_via: typeof VENDOR_RUNTIME_INDEX_ID;
    sealed_component_count: number;
    re_lists_runtime_index_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeCatalogManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeCatalogManifest {
  manifest_id: 'dsc-vendor-runtime-catalog-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeCatalogManifestEntry[];
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  runtime_catalog_digest: string;
  runtime_catalog_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_index_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeCatalog {
  vendor_runtime_catalog_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_CATALOG_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_CATALOG_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_catalog';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CATALOG_V1';
  runtime_catalog_id: typeof VENDOR_RUNTIME_CATALOG_ID;
  runtime_catalog_version: typeof VENDOR_RUNTIME_CATALOG_VERSION;
  runtime_catalog_kind: 'vendor_runtime_catalog';
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
  runtime_catalog_schema: VendorRuntimeCatalogSchema;
  deterministic_runtime_catalog_identity: DeterministicRuntimeCatalogIdentity;
  vendor_runtime_index_binding: VendorRuntimeIndexBinding;
  runtime_catalog_composition: RuntimeCatalogComposition;
  runtime_catalog_manifest: RuntimeCatalogManifest;
  cataloged_runtime_entries: {
    count: 0;
    entries: [];
    cataloging_policy: string;
    catalogs_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_catalog_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_index: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    catalogs_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime catalog.
 * Reuses the PHASE-087 Vendor Runtime Index by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime catalog artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeCatalog(
  projectRoot?: string
): { vendorRuntimeCatalog: DirectSpatialConditioningVendorRuntimeCatalog } {
  const root = resolveProjectRoot(projectRoot);

  // Gate on the recorded PHASE-087 verdict: the runtime index must have passed.
  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_INDEX_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-087 vendor runtime index did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_INDEX_VERDICT) {
    throw new Error(
      `PHASE-087 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_INDEX_PHASE) {
    throw new Error('PHASE-087 evidence does not cover the vendor runtime index');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-087 evidence reports outstanding errors');
  }

  const runtimeIndex = readJson<DirectSpatialConditioningVendorRuntimeIndex>(
    root,
    VENDOR_RUNTIME_INDEX_PATH
  );
  if (
    runtimeIndex.phase !== DSC_VENDOR_RUNTIME_INDEX_PHASE ||
    runtimeIndex.system_id !== DSC_VENDOR_RUNTIME_INDEX_SYSTEM_ID
  ) {
    throw new Error('PHASE-087 vendor runtime index is missing or incompatible');
  }
  if (runtimeIndex.runtime_index_id !== VENDOR_RUNTIME_INDEX_ID) {
    throw new Error('Vendor runtime index identity drifted');
  }
  if (runtimeIndex.runtime_index_version !== VENDOR_RUNTIME_INDEX_VERSION) {
    throw new Error('Vendor runtime index version drifted');
  }
  if (!runtimeIndex.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime index must remain vendor neutral');
  }
  if (!runtimeIndex.design_constraints.reuses_certified_vendor_runtime_registry) {
    throw new Error(
      'Vendor runtime index must reuse the certified vendor runtime registry'
    );
  }
  if (runtimeIndex.indexed_runtime_entries.count !== 0) {
    throw new Error('PHASE-087 must not have indexed runtime entries');
  }
  if (runtimeIndex.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-087 must not declare runtime execution');
  }
  if (
    JSON.stringify(runtimeIndex.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime index channels do not match foundation channels');
  }
  if (JSON.stringify(runtimeIndex.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
    throw new Error(
      'Vendor runtime index sources_supported drifted from the certified corpus'
    );
  }
  if (runtimeIndex.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime index spatial frame drifted');
  }
  if (
    runtimeIndex.capability_set_id !== CAPABILITY_SET_ID ||
    runtimeIndex.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime index capability set identity drifted');
  }

  // Re-seal the runtime index transitively.
  const runtimeIndexManifest = runtimeIndex.runtime_index_manifest;
  for (const entry of runtimeIndexManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed runtime index section missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed runtime index section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const recomputedRuntimeIndexDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeIndexManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_registry:${runtimeIndexManifest.sealed_runtime_registry_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (recomputedRuntimeIndexDigest !== runtimeIndexManifest.runtime_index_digest) {
    throw new Error('sealed runtime index digest drifted from the runtime index manifest');
  }
  const sealedComponentCount = runtimeIndexManifest.sealed_component_count;

  for (const spec of RUNTIME_CATALOG_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime catalog section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_CATALOG_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime catalog section id');
  }
  const sectionRefs = RUNTIME_CATALOG_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime catalog section artifact ref');
  }

  const runtime_catalog_schema: VendorRuntimeCatalogSchema = {
    schema_id: 'dsc-vendor-runtime-catalog-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime catalog. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime catalog binds one Vendor Runtime Index as its root, seals the index together with its schema and implementation registry, and seals the index contents transitively through the runtime index digest. It catalogs no concrete runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_catalog_id_policy: 'opaque_runtime_catalog_id_no_vendor_binding',
    runtime_index_ref: VENDOR_RUNTIME_INDEX_ID,
    required_fields: [
      {
        field: 'runtime_catalog_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_catalog_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime catalog version string',
      },
      {
        field: 'runtime_catalog_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_catalog',
      },
      {
        field: 'runtime_index_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime index ${VENDOR_RUNTIME_INDEX_ID}`,
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
        field: 'deterministic_runtime_catalog_identity',
        type: 'dsc-vendor-runtime-catalog-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_index_binding',
        type: 'dsc-vendor-runtime-catalog-index-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Index as the runtime catalog root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_catalog_composition',
        type: 'dsc-vendor-runtime-catalog-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime index, schema, and implementation registry sections; vendor-specific sections forbidden and index contents never re-listed',
      },
      {
        field: 'runtime_catalog_manifest',
        type: 'dsc-vendor-runtime-catalog-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime index digest and a runtime catalog digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_catalog_identity: DeterministicRuntimeCatalogIdentity = {
    identity_id: 'dsc-vendor-runtime-catalog-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime catalog. The runtime_catalog_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_catalog_id: VENDOR_RUNTIME_CATALOG_ID,
    runtime_catalog_version: VENDOR_RUNTIME_CATALOG_VERSION,
    identity_policy: 'opaque_runtime_catalog_id_no_vendor_binding',
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

  const vendor_runtime_index_binding: VendorRuntimeIndexBinding = {
    binding_id: 'dsc-vendor-runtime-catalog-index-binding-v1',
    description:
      'Exact binding of the PHASE-087 Vendor Runtime Index as the runtime catalog root. The binding is gated at build time on the recorded PHASE-087 PASS verdict, and re-seals every runtime index section and the runtime index digest before the runtime catalog is emitted.',
    runtime_index_ref: VENDOR_RUNTIME_INDEX_PATH,
    runtime_index_id: VENDOR_RUNTIME_INDEX_ID,
    runtime_index_version: VENDOR_RUNTIME_INDEX_VERSION,
    runtime_index_phase: DSC_VENDOR_RUNTIME_INDEX_PHASE,
    runtime_index_system_id: DSC_VENDOR_RUNTIME_INDEX_SYSTEM_ID,
    runtime_index_evidence_ref: VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
    runtime_index_verdict: VENDOR_RUNTIME_INDEX_VERDICT,
    runtime_index_evidence_mode: 'phase_087_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_catalog_root',
    sealed_runtime_index_digest: runtimeIndexManifest.runtime_index_digest,
    sealed_runtime_registry_digest: runtimeIndexManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeIndexManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeIndexManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeIndexManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    catalogs_runtime_in_this_phase: false,
    implements_runtime_index_in_this_phase: false,
  };

  const runtime_catalog_composition: RuntimeCatalogComposition = {
    composition_id: 'dsc-vendor-runtime-catalog-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Index: the runtime index artifact, its shape contract, and its implementation registry. The runtime index contents (and everything sealed beneath them) are sealed transitively through the runtime index digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_index',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_CATALOG_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_index_contents_sealed_via_runtime_index_digest',
      sealed_via: VENDOR_RUNTIME_INDEX_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_index_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeCatalogManifestEntry[] = RUNTIME_CATALOG_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_catalog_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_index:${runtimeIndexManifest.runtime_index_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_catalog_manifest: RuntimeCatalogManifest = {
    manifest_id: 'dsc-vendor-runtime-catalog-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime catalog section. Digests are computed read-only from disk. The sealed runtime index digest carries the index contents (and everything sealed beneath them) transitively, and the runtime catalog digest is the SHA256 of the ordered section digests and the sealed runtime index digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_index_digest: runtimeIndexManifest.runtime_index_digest,
    sealed_runtime_registry_digest: runtimeIndexManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeIndexManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeIndexManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeIndexManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_catalog_digest,
    runtime_catalog_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_index_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeCatalog: DirectSpatialConditioningVendorRuntimeCatalog = {
    vendor_runtime_catalog_id: 'direct-spatial-conditioning-vendor-runtime-catalog-v1',
    phase: DSC_VENDOR_RUNTIME_CATALOG_PHASE,
    system_id: DSC_VENDOR_RUNTIME_CATALOG_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_catalog',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CATALOG_V1',
    runtime_catalog_id: VENDOR_RUNTIME_CATALOG_ID,
    runtime_catalog_version: VENDOR_RUNTIME_CATALOG_VERSION,
    runtime_catalog_kind: 'vendor_runtime_catalog',
    runtime_index_ref: VENDOR_RUNTIME_INDEX_PATH,
    runtime_index_schema_ref: VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
    runtime_index_implementation_registry_ref:
      VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
    runtime_index_evidence_ref: VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
    runtime_registry_ref: VENDOR_RUNTIME_REGISTRY_PATH,
    runtime_profile_ref: VENDOR_RUNTIME_PROFILE_PATH,
    runtime_bundle_ref: VENDOR_RUNTIME_BUNDLE_PATH,
    runtime_package_ref: VENDOR_RUNTIME_PACKAGE_PATH,
    reference_bundle_ref: VENDOR_REFERENCE_BUNDLE_PATH,
    package_ref: VENDOR_REFERENCE_PACKAGE_PATH,
    template_ref: VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
    template_certification_ref: VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
    numerical_runtime_package_ref: RUNTIME_PACKAGE_PATH,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_catalog_schema,
    deterministic_runtime_catalog_identity,
    vendor_runtime_index_binding,
    runtime_catalog_composition,
    runtime_catalog_manifest,
    cataloged_runtime_entries: {
      count: 0,
      entries: [],
      cataloging_policy:
        'concrete vendor runtimes may be cataloged against this runtime catalog only in a future implementation phase; none are cataloged here',
      catalogs_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_catalog_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_index: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      catalogs_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_CATALOG_PATH, vendorRuntimeCatalog);
  return { vendorRuntimeCatalog };
}
