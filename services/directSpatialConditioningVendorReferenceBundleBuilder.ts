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
import {
  DSC_VENDOR_REFERENCE_PACKAGE_PHASE,
  DSC_VENDOR_REFERENCE_PACKAGE_SYSTEM_ID,
  VENDOR_REFERENCE_PACKAGE_ID,
  VENDOR_REFERENCE_PACKAGE_PATH,
  VENDOR_REFERENCE_PACKAGE_VERSION,
  type DirectSpatialConditioningVendorReferencePackage,
} from './directSpatialConditioningVendorReferencePackageBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-077: Direct Spatial Conditioning vendor reference bundle.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Wraps the certified PHASE-075
 * Vendor Reference Package in a distributable envelope:
 *   - bundle schema,
 *   - deterministic bundle identity,
 *   - certified Vendor Reference Package binding,
 *   - bundle composition, and
 *   - bundle manifest.
 *
 * The bundle seals three design sections directly (package, schema, registry)
 * and seals the package's own members transitively through the package digest,
 * so it never re-lists what the package already owns. Implements no vendor,
 * performs no GPU or inference work, and modifies no member.
 */

export const DSC_VENDOR_REFERENCE_BUNDLE_PHASE = 'PHASE-DSC-077' as const;
export const DSC_VENDOR_REFERENCE_BUNDLE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_BUNDLE_V1' as const;

export const VENDOR_REFERENCE_BUNDLE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_REFERENCE_BUNDLE_PATH =
  `${VENDOR_REFERENCE_BUNDLE_ROOT}/direct-spatial-conditioning-vendor-reference-bundle-v1.json` as const;

/** Opaque deterministic identity of the vendor reference bundle. */
export const VENDOR_REFERENCE_BUNDLE_ID = 'dsc-vendor-reference-bundle-v1' as const;
export const VENDOR_REFERENCE_BUNDLE_VERSION = '1.0' as const;

/** Design-time contract set of the certified PHASE-075 package. */
export const VENDOR_REFERENCE_PACKAGE_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-package.schema.json' as const;
export const VENDOR_REFERENCE_PACKAGE_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-package-implementation-registry-v1.json' as const;
export const VENDOR_REFERENCE_PACKAGE_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PACKAGE_VALIDATION_REPORT.json' as const;

export const VENDOR_REFERENCE_PACKAGE_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PACKAGE_V1' as const;

/**
 * Ordered bundle sections. Only the package's own design-time contract set is
 * sealed directly; the package's internal members are sealed transitively.
 */
export const BUNDLE_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind: 'package_artifact' | 'package_schema' | 'package_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_reference_package',
    role: 'bundle_root_package',
    kind: 'package_artifact',
    artifact_ref: VENDOR_REFERENCE_PACKAGE_PATH,
  },
  {
    section_id: 'vendor_reference_package_schema',
    role: 'package_shape_contract',
    kind: 'package_schema',
    artifact_ref: VENDOR_REFERENCE_PACKAGE_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_reference_package_registry',
    role: 'package_provenance_registry',
    kind: 'package_registry',
    artifact_ref: VENDOR_REFERENCE_PACKAGE_REGISTRY_PATH,
  },
];

export interface BundleSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorReferenceBundleSchema {
  schema_id: 'dsc-vendor-reference-bundle-schema-v1';
  description: string;
  encoding: 'application/json';
  bundle_id_policy: 'opaque_bundle_id_no_vendor_binding';
  package_ref: typeof VENDOR_REFERENCE_PACKAGE_ID;
  required_fields: BundleSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicBundleIdentity {
  identity_id: 'dsc-vendor-reference-bundle-deterministic-identity-v1';
  description: string;
  bundle_id: typeof VENDOR_REFERENCE_BUNDLE_ID;
  bundle_version: typeof VENDOR_REFERENCE_BUNDLE_VERSION;
  identity_policy: 'opaque_bundle_id_no_vendor_binding';
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

export interface VendorReferencePackageBinding {
  binding_id: 'dsc-vendor-reference-bundle-package-binding-v1';
  description: string;
  package_ref: string;
  package_id: typeof VENDOR_REFERENCE_PACKAGE_ID;
  package_version: typeof VENDOR_REFERENCE_PACKAGE_VERSION;
  package_phase: typeof DSC_VENDOR_REFERENCE_PACKAGE_PHASE;
  package_system_id: typeof DSC_VENDOR_REFERENCE_PACKAGE_SYSTEM_ID;
  package_evidence_ref: string;
  package_verdict: typeof VENDOR_REFERENCE_PACKAGE_VERDICT;
  package_evidence_mode: 'phase_075_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'bundle_root';
  sealed_package_digest: string;
  sealed_component_count: number;
  bundles_vendors_in_this_phase: false;
  implements_package_in_this_phase: false;
}

export interface BundleSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface BundleComposition {
  composition_id: 'dsc-vendor-reference-bundle-composition-v1';
  description: string;
  root_section_id: 'vendor_reference_package';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: BundleSection[];
  transitive_seal: {
    policy: 'package_members_sealed_via_package_digest';
    sealed_via: typeof VENDOR_REFERENCE_PACKAGE_ID;
    sealed_component_count: number;
    re_lists_package_members: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
}

export interface BundleManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface BundleManifest {
  manifest_id: 'dsc-vendor-reference-bundle-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: BundleManifestEntry[];
  sealed_package_digest: string;
  sealed_component_count: number;
  bundle_digest: string;
  bundle_digest_method: 'sha256_of_ordered_section_digests_and_sealed_package_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorReferenceBundle {
  vendor_reference_bundle_id: string;
  phase: typeof DSC_VENDOR_REFERENCE_BUNDLE_PHASE;
  system_id: typeof DSC_VENDOR_REFERENCE_BUNDLE_SYSTEM_ID;
  mode: 'design_only_vendor_reference_bundle';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_BUNDLE_V1';
  bundle_id: typeof VENDOR_REFERENCE_BUNDLE_ID;
  bundle_version: typeof VENDOR_REFERENCE_BUNDLE_VERSION;
  bundle_kind: 'vendor_reference_bundle';
  package_ref: string;
  package_schema_ref: string;
  package_registry_ref: string;
  package_evidence_ref: string;
  template_ref: string;
  template_certification_ref: string;
  runtime_package_ref: string;
  sources_supported: string[];
  required_channels: ConditioningChannelId[];
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  bundle_schema: VendorReferenceBundleSchema;
  deterministic_bundle_identity: DeterministicBundleIdentity;
  vendor_reference_package_binding: VendorReferencePackageBinding;
  bundle_composition: BundleComposition;
  bundle_manifest: BundleManifest;
  bundled_vendors: {
    count: 0;
    entries: [];
    bundling_policy: string;
    bundles_vendors_in_this_phase: false;
  };
  design_constraints: {
    bundle_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_reference_package: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    bundles_vendors_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor reference bundle.
 * Reuses the PHASE-075 Vendor Reference Package by exact reference, gated on its
 * recorded PASS verdict; writes only the bundle artifact.
 */
export function buildDirectSpatialConditioningVendorReferenceBundle(
  projectRoot?: string
): { vendorReferenceBundle: DirectSpatialConditioningVendorReferenceBundle } {
  const root = resolveProjectRoot(projectRoot);

  // Gate on the recorded PHASE-075 verdict: the package must have passed.
  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_REFERENCE_PACKAGE_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-075 vendor reference package did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_REFERENCE_PACKAGE_VERDICT) {
    throw new Error(
      `PHASE-075 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_REFERENCE_PACKAGE_PHASE) {
    throw new Error('PHASE-075 evidence does not cover the vendor reference package');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-075 evidence reports outstanding errors');
  }

  const referencePackage = readJson<DirectSpatialConditioningVendorReferencePackage>(
    root,
    VENDOR_REFERENCE_PACKAGE_PATH
  );
  if (
    referencePackage.phase !== DSC_VENDOR_REFERENCE_PACKAGE_PHASE ||
    referencePackage.system_id !== DSC_VENDOR_REFERENCE_PACKAGE_SYSTEM_ID
  ) {
    throw new Error('PHASE-075 vendor reference package is missing or incompatible');
  }
  if (referencePackage.package_id !== VENDOR_REFERENCE_PACKAGE_ID) {
    throw new Error('Vendor reference package identity drifted');
  }
  if (referencePackage.package_version !== VENDOR_REFERENCE_PACKAGE_VERSION) {
    throw new Error('Vendor reference package version drifted');
  }
  if (!referencePackage.design_constraints.vendor_neutral) {
    throw new Error('Vendor reference package must remain vendor neutral');
  }
  if (!referencePackage.design_constraints.reuses_certified_vendor_implementation_template) {
    throw new Error(
      'Vendor reference package must reuse the certified vendor implementation template'
    );
  }
  if (referencePackage.packaged_vendors.count !== 0) {
    throw new Error('PHASE-075 must not have packaged vendors');
  }
  if (
    JSON.stringify(referencePackage.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error(
      'Vendor reference package channels do not match foundation channels'
    );
  }
  if (
    JSON.stringify(referencePackage.sources_supported) !== JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor reference package sources_supported drifted from the certified corpus'
    );
  }
  if (referencePackage.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor reference package spatial frame drifted');
  }
  if (
    referencePackage.capability_set_id !== CAPABILITY_SET_ID ||
    referencePackage.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor reference package capability set identity drifted');
  }

  // Re-seal the package transitively: recompute its members and package digest.
  const packageManifest = referencePackage.package_manifest;
  for (const entry of packageManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed package member missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed package member digest drifted: ${entry.artifact_ref}`);
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
    throw new Error('sealed package digest drifted from the package manifest');
  }
  const sealedComponentCount = packageManifest.entries.length;

  for (const spec of BUNDLE_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`bundle section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = BUNDLE_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate bundle section id');
  }
  const sectionRefs = BUNDLE_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate bundle section artifact ref');
  }

  const bundle_schema: VendorReferenceBundleSchema = {
    schema_id: 'dsc-vendor-reference-bundle-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor reference bundle. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A bundle binds one Vendor Reference Package as its root, seals that package together with its schema and registry, and seals the package members transitively through the package digest.',
    encoding: 'application/json',
    bundle_id_policy: 'opaque_bundle_id_no_vendor_binding',
    package_ref: VENDOR_REFERENCE_PACKAGE_ID,
    required_fields: [
      {
        field: 'bundle_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'bundle_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor bundle version string',
      },
      {
        field: 'bundle_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_reference_bundle',
      },
      {
        field: 'package_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor reference package ${VENDOR_REFERENCE_PACKAGE_ID}`,
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
        field: 'deterministic_bundle_identity',
        type: 'dsc-vendor-reference-bundle-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_reference_package_binding',
        type: 'dsc-vendor-reference-bundle-package-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Reference Package as the bundle root, gated on its recorded PASS verdict',
      },
      {
        field: 'bundle_composition',
        type: 'dsc-vendor-reference-bundle-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of package, schema, and registry sections; vendor-specific sections forbidden and package members never re-listed',
      },
      {
        field: 'bundle_manifest',
        type: 'dsc-vendor-reference-bundle-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed package digest and a bundle digest over both',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_bundle_identity: DeterministicBundleIdentity = {
    identity_id: 'dsc-vendor-reference-bundle-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor reference bundle. The bundle_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    bundle_id: VENDOR_REFERENCE_BUNDLE_ID,
    bundle_version: VENDOR_REFERENCE_BUNDLE_VERSION,
    identity_policy: 'opaque_bundle_id_no_vendor_binding',
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

  const vendor_reference_package_binding: VendorReferencePackageBinding = {
    binding_id: 'dsc-vendor-reference-bundle-package-binding-v1',
    description:
      'Exact binding of the PHASE-075 Vendor Reference Package as the bundle root. The binding is gated at build time on the recorded PHASE-075 PASS verdict, and re-seals every package member and the package digest before the bundle is emitted.',
    package_ref: VENDOR_REFERENCE_PACKAGE_PATH,
    package_id: VENDOR_REFERENCE_PACKAGE_ID,
    package_version: VENDOR_REFERENCE_PACKAGE_VERSION,
    package_phase: DSC_VENDOR_REFERENCE_PACKAGE_PHASE,
    package_system_id: DSC_VENDOR_REFERENCE_PACKAGE_SYSTEM_ID,
    package_evidence_ref: VENDOR_REFERENCE_PACKAGE_EVIDENCE_PATH,
    package_verdict: VENDOR_REFERENCE_PACKAGE_VERDICT,
    package_evidence_mode: 'phase_075_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'bundle_root',
    sealed_package_digest: packageManifest.package_digest,
    sealed_component_count: sealedComponentCount,
    bundles_vendors_in_this_phase: false,
    implements_package_in_this_phase: false,
  };

  const bundle_composition: BundleComposition = {
    composition_id: 'dsc-vendor-reference-bundle-composition-v1',
    description:
      'Closed, fixed-order composition of the distributable envelope around the Vendor Reference Package: the package artifact, its shape contract, and its provenance registry. The package members are sealed transitively through the package digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_reference_package',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: BUNDLE_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'package_members_sealed_via_package_digest',
      sealed_via: VENDOR_REFERENCE_PACKAGE_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_package_members: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
  };

  const entries: BundleManifestEntry[] = BUNDLE_SECTION_SPECS.map((spec) => ({
    section_id: spec.section_id,
    artifact_ref: spec.artifact_ref,
    sha256: sha256(root, spec.artifact_ref),
    bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
    content_addressed: true as const,
  }));

  const bundle_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_package:${packageManifest.package_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const bundle_manifest: BundleManifest = {
    manifest_id: 'dsc-vendor-reference-bundle-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every bundle section. Digests are computed read-only from disk. The sealed package digest carries the package members transitively, and the bundle digest is the SHA256 of the ordered section digests followed by the sealed package digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_package_digest: packageManifest.package_digest,
    sealed_component_count: sealedComponentCount,
    bundle_digest,
    bundle_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_package_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorReferenceBundle: DirectSpatialConditioningVendorReferenceBundle = {
    vendor_reference_bundle_id:
      'direct-spatial-conditioning-vendor-reference-bundle-v1',
    phase: DSC_VENDOR_REFERENCE_BUNDLE_PHASE,
    system_id: DSC_VENDOR_REFERENCE_BUNDLE_SYSTEM_ID,
    mode: 'design_only_vendor_reference_bundle',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_BUNDLE_V1',
    bundle_id: VENDOR_REFERENCE_BUNDLE_ID,
    bundle_version: VENDOR_REFERENCE_BUNDLE_VERSION,
    bundle_kind: 'vendor_reference_bundle',
    package_ref: VENDOR_REFERENCE_PACKAGE_PATH,
    package_schema_ref: VENDOR_REFERENCE_PACKAGE_SCHEMA_PATH,
    package_registry_ref: VENDOR_REFERENCE_PACKAGE_REGISTRY_PATH,
    package_evidence_ref: VENDOR_REFERENCE_PACKAGE_EVIDENCE_PATH,
    template_ref: VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
    template_certification_ref: VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
    runtime_package_ref: RUNTIME_PACKAGE_PATH,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    bundle_schema,
    deterministic_bundle_identity,
    vendor_reference_package_binding,
    bundle_composition,
    bundle_manifest,
    bundled_vendors: {
      count: 0,
      entries: [],
      bundling_policy:
        'concrete vendors may be bundled against this reference bundle only in a future implementation phase; none are bundled here',
      bundles_vendors_in_this_phase: false,
    },
    design_constraints: {
      bundle_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_reference_package: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      bundles_vendors_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_REFERENCE_BUNDLE_PATH, vendorReferenceBundle);
  return { vendorReferenceBundle };
}
