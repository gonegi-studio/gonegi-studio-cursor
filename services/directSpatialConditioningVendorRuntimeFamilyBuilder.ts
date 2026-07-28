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
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_RUNTIME_CATALOG_PHASE,
  DSC_VENDOR_RUNTIME_CATALOG_SYSTEM_ID,
  VENDOR_RUNTIME_CATALOG_ID,
  VENDOR_RUNTIME_CATALOG_PATH,
  VENDOR_RUNTIME_CATALOG_VERSION,
  VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
  VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
  type DirectSpatialConditioningVendorRuntimeCatalog,
} from './directSpatialConditioningVendorRuntimeCatalogBuilder.js';

/**
 * PHASE-DSC-091: Direct Spatial Conditioning vendor runtime family.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Families the PHASE-089 Vendor
 * Runtime Catalog as the sole design-time publication root:
 *   - runtime family schema,
 *   - deterministic runtime family identity,
 *   - Vendor Runtime Catalog binding,
 *   - runtime family composition, and
 *   - runtime family manifest.
 *
 * The family seals three design sections directly (runtime catalog, schema,
 * implementation registry) and seals everything the runtime catalog owns
 * transitively through the runtime catalog digest, so it never re-lists what
 * the catalog already owns. It families no concrete runtime, implements no
 * vendor, declares no runtime execution, performs no GPU or inference work,
 * and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_FAMILY_PHASE = 'PHASE-DSC-091' as const;
export const DSC_VENDOR_RUNTIME_FAMILY_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_FAMILY_V1' as const;

export const VENDOR_RUNTIME_FAMILY_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_FAMILY_PATH =
  `${VENDOR_RUNTIME_FAMILY_ROOT}/direct-spatial-conditioning-vendor-runtime-family-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime family. */
export const VENDOR_RUNTIME_FAMILY_ID = 'dsc-vendor-runtime-family-v1' as const;
export const VENDOR_RUNTIME_FAMILY_VERSION = '1.0' as const;

/** Design-time contract set of the passing PHASE-089 runtime catalog. */
export const VENDOR_RUNTIME_CATALOG_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-catalog.schema.json' as const;
export const VENDOR_RUNTIME_CATALOG_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-catalog-implementation-registry-v1.json' as const;
export const VENDOR_RUNTIME_CATALOG_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CATALOG_VALIDATION_REPORT.json' as const;

export const VENDOR_RUNTIME_CATALOG_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CATALOG_V1' as const;

/**
 * Ordered runtime family sections. Only the runtime catalog's own design-time
 * contract set is sealed directly; everything it owns is sealed transitively.
 */
export const RUNTIME_FAMILY_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_catalog_artifact'
    | 'runtime_catalog_schema'
    | 'runtime_catalog_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_catalog',
    role: 'runtime_family_root_catalog',
    kind: 'runtime_catalog_artifact',
    artifact_ref: VENDOR_RUNTIME_CATALOG_PATH,
  },
  {
    section_id: 'vendor_runtime_catalog_schema',
    role: 'runtime_catalog_shape_contract',
    kind: 'runtime_catalog_schema',
    artifact_ref: VENDOR_RUNTIME_CATALOG_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_catalog_implementation_registry',
    role: 'runtime_catalog_provenance_registry',
    kind: 'runtime_catalog_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_CATALOG_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeFamilySchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeFamilySchema {
  schema_id: 'dsc-vendor-runtime-family-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_family_id_policy: 'opaque_runtime_family_id_no_vendor_binding';
  runtime_catalog_ref: typeof VENDOR_RUNTIME_CATALOG_ID;
  required_fields: RuntimeFamilySchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeFamilyIdentity {
  identity_id: 'dsc-vendor-runtime-family-deterministic-identity-v1';
  description: string;
  runtime_family_id: typeof VENDOR_RUNTIME_FAMILY_ID;
  runtime_family_version: typeof VENDOR_RUNTIME_FAMILY_VERSION;
  identity_policy: 'opaque_runtime_family_id_no_vendor_binding';
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

export interface VendorRuntimeCatalogBinding {
  binding_id: 'dsc-vendor-runtime-family-catalog-binding-v1';
  description: string;
  runtime_catalog_ref: string;
  runtime_catalog_id: typeof VENDOR_RUNTIME_CATALOG_ID;
  runtime_catalog_version: typeof VENDOR_RUNTIME_CATALOG_VERSION;
  runtime_catalog_phase: typeof DSC_VENDOR_RUNTIME_CATALOG_PHASE;
  runtime_catalog_system_id: typeof DSC_VENDOR_RUNTIME_CATALOG_SYSTEM_ID;
  runtime_catalog_evidence_ref: string;
  runtime_catalog_verdict: typeof VENDOR_RUNTIME_CATALOG_VERDICT;
  runtime_catalog_evidence_mode: 'phase_089_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_family_root';
  sealed_runtime_catalog_digest: string;
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  families_runtime_in_this_phase: false;
  implements_runtime_catalog_in_this_phase: false;
}

export interface RuntimeFamilySection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeFamilyComposition {
  composition_id: 'dsc-vendor-runtime-family-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_catalog';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeFamilySection[];
  transitive_seal: {
    policy: 'runtime_catalog_contents_sealed_via_runtime_catalog_digest';
    sealed_via: typeof VENDOR_RUNTIME_CATALOG_ID;
    sealed_component_count: number;
    re_lists_runtime_catalog_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeFamilyManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeFamilyManifest {
  manifest_id: 'dsc-vendor-runtime-family-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeFamilyManifestEntry[];
  sealed_runtime_catalog_digest: string;
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  runtime_family_digest: string;
  runtime_family_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_catalog_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeFamily {
  vendor_runtime_family_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_FAMILY_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_FAMILY_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_family';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_FAMILY_V1';
  runtime_family_id: typeof VENDOR_RUNTIME_FAMILY_ID;
  runtime_family_version: typeof VENDOR_RUNTIME_FAMILY_VERSION;
  runtime_family_kind: 'vendor_runtime_family';
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
  runtime_family_schema: VendorRuntimeFamilySchema;
  deterministic_runtime_family_identity: DeterministicRuntimeFamilyIdentity;
  vendor_runtime_catalog_binding: VendorRuntimeCatalogBinding;
  runtime_family_composition: RuntimeFamilyComposition;
  runtime_family_manifest: RuntimeFamilyManifest;
  family_runtime_members: {
    count: 0;
    entries: [];
    membership_policy: string;
    families_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_family_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_catalog: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    families_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime family.
 * Reuses the PHASE-089 Vendor Runtime Catalog by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime family artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeFamily(
  projectRoot?: string
): { vendorRuntimeFamily: DirectSpatialConditioningVendorRuntimeFamily } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_CATALOG_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-089 vendor runtime catalog did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_CATALOG_VERDICT) {
    throw new Error(
      `PHASE-089 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_CATALOG_PHASE) {
    throw new Error('PHASE-089 evidence does not cover the vendor runtime catalog');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-089 evidence reports outstanding errors');
  }

  const runtimeCatalog = readJson<DirectSpatialConditioningVendorRuntimeCatalog>(
    root,
    VENDOR_RUNTIME_CATALOG_PATH
  );
  if (
    runtimeCatalog.phase !== DSC_VENDOR_RUNTIME_CATALOG_PHASE ||
    runtimeCatalog.system_id !== DSC_VENDOR_RUNTIME_CATALOG_SYSTEM_ID
  ) {
    throw new Error('PHASE-089 vendor runtime catalog is missing or incompatible');
  }
  if (runtimeCatalog.runtime_catalog_id !== VENDOR_RUNTIME_CATALOG_ID) {
    throw new Error('Vendor runtime catalog identity drifted');
  }
  if (runtimeCatalog.runtime_catalog_version !== VENDOR_RUNTIME_CATALOG_VERSION) {
    throw new Error('Vendor runtime catalog version drifted');
  }
  if (!runtimeCatalog.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime catalog must remain vendor neutral');
  }
  if (!runtimeCatalog.design_constraints.reuses_certified_vendor_runtime_index) {
    throw new Error(
      'Vendor runtime catalog must reuse the certified vendor runtime index'
    );
  }
  if (runtimeCatalog.cataloged_runtime_entries.count !== 0) {
    throw new Error('PHASE-089 must not have cataloged runtime entries');
  }
  if (runtimeCatalog.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-089 must not declare runtime execution');
  }
  if (
    JSON.stringify(runtimeCatalog.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime catalog channels do not match foundation channels');
  }
  if (JSON.stringify(runtimeCatalog.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
    throw new Error(
      'Vendor runtime catalog sources_supported drifted from the certified corpus'
    );
  }
  if (runtimeCatalog.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime catalog spatial frame drifted');
  }
  if (
    runtimeCatalog.capability_set_id !== CAPABILITY_SET_ID ||
    runtimeCatalog.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime catalog capability set identity drifted');
  }

  const runtimeCatalogManifest = runtimeCatalog.runtime_catalog_manifest;
  for (const entry of runtimeCatalogManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed runtime catalog section missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed runtime catalog section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const recomputedRuntimeCatalogDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeCatalogManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_index:${runtimeCatalogManifest.sealed_runtime_index_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (recomputedRuntimeCatalogDigest !== runtimeCatalogManifest.runtime_catalog_digest) {
    throw new Error('sealed runtime catalog digest drifted from the runtime catalog manifest');
  }
  const sealedComponentCount = runtimeCatalogManifest.sealed_component_count;

  for (const spec of RUNTIME_FAMILY_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime family section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_FAMILY_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime family section id');
  }
  const sectionRefs = RUNTIME_FAMILY_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime family section artifact ref');
  }

  const runtime_family_schema: VendorRuntimeFamilySchema = {
    schema_id: 'dsc-vendor-runtime-family-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime family. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime family binds one Vendor Runtime Catalog as its root, seals the catalog together with its schema and implementation registry, and seals the catalog contents transitively through the runtime catalog digest. It families no concrete runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_family_id_policy: 'opaque_runtime_family_id_no_vendor_binding',
    runtime_catalog_ref: VENDOR_RUNTIME_CATALOG_ID,
    required_fields: [
      {
        field: 'runtime_family_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_family_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime family version string',
      },
      {
        field: 'runtime_family_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_family',
      },
      {
        field: 'runtime_catalog_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime catalog ${VENDOR_RUNTIME_CATALOG_ID}`,
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
        field: 'deterministic_runtime_family_identity',
        type: 'dsc-vendor-runtime-family-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_catalog_binding',
        type: 'dsc-vendor-runtime-family-catalog-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Catalog as the runtime family root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_family_composition',
        type: 'dsc-vendor-runtime-family-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime catalog, schema, and implementation registry sections; vendor-specific sections forbidden and catalog contents never re-listed',
      },
      {
        field: 'runtime_family_manifest',
        type: 'dsc-vendor-runtime-family-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime catalog digest and a runtime family digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_family_identity: DeterministicRuntimeFamilyIdentity = {
    identity_id: 'dsc-vendor-runtime-family-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime family. The runtime_family_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_family_id: VENDOR_RUNTIME_FAMILY_ID,
    runtime_family_version: VENDOR_RUNTIME_FAMILY_VERSION,
    identity_policy: 'opaque_runtime_family_id_no_vendor_binding',
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

  const vendor_runtime_catalog_binding: VendorRuntimeCatalogBinding = {
    binding_id: 'dsc-vendor-runtime-family-catalog-binding-v1',
    description:
      'Exact binding of the PHASE-089 Vendor Runtime Catalog as the runtime family root. The binding is gated at build time on the recorded PHASE-089 PASS verdict, and re-seals every runtime catalog section and the runtime catalog digest before the runtime family is emitted.',
    runtime_catalog_ref: VENDOR_RUNTIME_CATALOG_PATH,
    runtime_catalog_id: VENDOR_RUNTIME_CATALOG_ID,
    runtime_catalog_version: VENDOR_RUNTIME_CATALOG_VERSION,
    runtime_catalog_phase: DSC_VENDOR_RUNTIME_CATALOG_PHASE,
    runtime_catalog_system_id: DSC_VENDOR_RUNTIME_CATALOG_SYSTEM_ID,
    runtime_catalog_evidence_ref: VENDOR_RUNTIME_CATALOG_EVIDENCE_PATH,
    runtime_catalog_verdict: VENDOR_RUNTIME_CATALOG_VERDICT,
    runtime_catalog_evidence_mode: 'phase_089_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_family_root',
    sealed_runtime_catalog_digest: runtimeCatalogManifest.runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeCatalogManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeCatalogManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeCatalogManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeCatalogManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeCatalogManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    families_runtime_in_this_phase: false,
    implements_runtime_catalog_in_this_phase: false,
  };

  const runtime_family_composition: RuntimeFamilyComposition = {
    composition_id: 'dsc-vendor-runtime-family-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Catalog: the runtime catalog artifact, its shape contract, and its implementation registry. The runtime catalog contents (and everything sealed beneath them) are sealed transitively through the runtime catalog digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_catalog',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_FAMILY_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_catalog_contents_sealed_via_runtime_catalog_digest',
      sealed_via: VENDOR_RUNTIME_CATALOG_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_catalog_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeFamilyManifestEntry[] = RUNTIME_FAMILY_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_family_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_catalog:${runtimeCatalogManifest.runtime_catalog_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_family_manifest: RuntimeFamilyManifest = {
    manifest_id: 'dsc-vendor-runtime-family-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime family section. Digests are computed read-only from disk. The sealed runtime catalog digest carries the catalog contents (and everything sealed beneath them) transitively, and the runtime family digest is the SHA256 of the ordered section digests and the sealed runtime catalog digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_catalog_digest: runtimeCatalogManifest.runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeCatalogManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeCatalogManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeCatalogManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeCatalogManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeCatalogManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_family_digest,
    runtime_family_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_catalog_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeFamily: DirectSpatialConditioningVendorRuntimeFamily = {
    vendor_runtime_family_id: 'direct-spatial-conditioning-vendor-runtime-family-v1',
    phase: DSC_VENDOR_RUNTIME_FAMILY_PHASE,
    system_id: DSC_VENDOR_RUNTIME_FAMILY_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_family',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_FAMILY_V1',
    runtime_family_id: VENDOR_RUNTIME_FAMILY_ID,
    runtime_family_version: VENDOR_RUNTIME_FAMILY_VERSION,
    runtime_family_kind: 'vendor_runtime_family',
    runtime_catalog_ref: VENDOR_RUNTIME_CATALOG_PATH,
    runtime_catalog_schema_ref: VENDOR_RUNTIME_CATALOG_SCHEMA_PATH,
    runtime_catalog_implementation_registry_ref:
      VENDOR_RUNTIME_CATALOG_IMPLEMENTATION_REGISTRY_PATH,
    runtime_catalog_evidence_ref: VENDOR_RUNTIME_CATALOG_EVIDENCE_PATH,
    runtime_index_ref: runtimeCatalog.runtime_index_ref,
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
    runtime_family_schema,
    deterministic_runtime_family_identity,
    vendor_runtime_catalog_binding,
    runtime_family_composition,
    runtime_family_manifest,
    family_runtime_members: {
      count: 0,
      entries: [],
      membership_policy:
        'concrete vendor runtimes may be grouped into this runtime family only in a future implementation phase; none are grouped here',
      families_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_family_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_catalog: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      families_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_FAMILY_PATH, vendorRuntimeFamily);
  return { vendorRuntimeFamily };
}
