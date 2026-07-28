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
import {
  DSC_VENDOR_REFERENCE_BUNDLE_PHASE,
  DSC_VENDOR_REFERENCE_BUNDLE_SYSTEM_ID,
  VENDOR_REFERENCE_BUNDLE_ID,
  VENDOR_REFERENCE_BUNDLE_PATH,
  VENDOR_REFERENCE_BUNDLE_VERSION,
  type DirectSpatialConditioningVendorReferenceBundle,
} from './directSpatialConditioningVendorReferenceBundleBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-079: Direct Spatial Conditioning vendor runtime package.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Wraps the PHASE-077 Vendor
 * Reference Bundle in a runtime-oriented delivery package:
 *   - runtime package schema,
 *   - deterministic runtime package identity,
 *   - Vendor Reference Bundle binding,
 *   - runtime package composition, and
 *   - runtime package manifest.
 *
 * The runtime package seals three design sections directly (bundle, schema,
 * registry) and seals everything the bundle owns transitively through the
 * bundle digest, so it never re-lists the bundle's or package's members.
 * Implements no vendor, performs no GPU or inference work, and modifies no
 * member. A runtime package here is a design-time delivery descriptor only; it
 * declares no runtime process, thread, device, or execution.
 */

export const DSC_VENDOR_RUNTIME_PACKAGE_PHASE = 'PHASE-DSC-079' as const;
export const DSC_VENDOR_RUNTIME_PACKAGE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PACKAGE_V1' as const;

export const VENDOR_RUNTIME_PACKAGE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_PACKAGE_PATH =
  `${VENDOR_RUNTIME_PACKAGE_ROOT}/direct-spatial-conditioning-vendor-runtime-package-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime package. */
export const VENDOR_RUNTIME_PACKAGE_ID = 'dsc-vendor-runtime-package-v1' as const;
export const VENDOR_RUNTIME_PACKAGE_VERSION = '1.0' as const;

/** Design-time contract set of the passing PHASE-077 bundle. */
export const VENDOR_REFERENCE_BUNDLE_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-bundle.schema.json' as const;
export const VENDOR_REFERENCE_BUNDLE_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-reference-bundle-registry-v1.json' as const;
export const VENDOR_REFERENCE_BUNDLE_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_BUNDLE_VALIDATION_REPORT.json' as const;

export const VENDOR_REFERENCE_BUNDLE_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_BUNDLE_V1' as const;

/**
 * Ordered runtime package sections. Only the bundle's own design-time contract
 * set is sealed directly; everything the bundle owns is sealed transitively.
 */
export const RUNTIME_PACKAGE_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind: 'bundle_artifact' | 'bundle_schema' | 'bundle_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_reference_bundle',
    role: 'runtime_root_bundle',
    kind: 'bundle_artifact',
    artifact_ref: VENDOR_REFERENCE_BUNDLE_PATH,
  },
  {
    section_id: 'vendor_reference_bundle_schema',
    role: 'bundle_shape_contract',
    kind: 'bundle_schema',
    artifact_ref: VENDOR_REFERENCE_BUNDLE_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_reference_bundle_registry',
    role: 'bundle_provenance_registry',
    kind: 'bundle_registry',
    artifact_ref: VENDOR_REFERENCE_BUNDLE_REGISTRY_PATH,
  },
];

export interface RuntimePackageSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimePackageSchema {
  schema_id: 'dsc-vendor-runtime-package-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_package_id_policy: 'opaque_runtime_package_id_no_vendor_binding';
  bundle_ref: typeof VENDOR_REFERENCE_BUNDLE_ID;
  required_fields: RuntimePackageSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimePackageIdentity {
  identity_id: 'dsc-vendor-runtime-package-deterministic-identity-v1';
  description: string;
  runtime_package_id: typeof VENDOR_RUNTIME_PACKAGE_ID;
  runtime_package_version: typeof VENDOR_RUNTIME_PACKAGE_VERSION;
  identity_policy: 'opaque_runtime_package_id_no_vendor_binding';
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

export interface VendorReferenceBundleBinding {
  binding_id: 'dsc-vendor-runtime-package-bundle-binding-v1';
  description: string;
  bundle_ref: string;
  bundle_id: typeof VENDOR_REFERENCE_BUNDLE_ID;
  bundle_version: typeof VENDOR_REFERENCE_BUNDLE_VERSION;
  bundle_phase: typeof DSC_VENDOR_REFERENCE_BUNDLE_PHASE;
  bundle_system_id: typeof DSC_VENDOR_REFERENCE_BUNDLE_SYSTEM_ID;
  bundle_evidence_ref: string;
  bundle_verdict: typeof VENDOR_REFERENCE_BUNDLE_VERDICT;
  bundle_evidence_mode: 'phase_077_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_root';
  sealed_bundle_digest: string;
  sealed_package_digest: string;
  sealed_component_count: number;
  packages_runtime_in_this_phase: false;
  implements_bundle_in_this_phase: false;
}

export interface RuntimePackageSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimePackageComposition {
  composition_id: 'dsc-vendor-runtime-package-composition-v1';
  description: string;
  root_section_id: 'vendor_reference_bundle';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimePackageSection[];
  transitive_seal: {
    policy: 'bundle_contents_sealed_via_bundle_digest';
    sealed_via: typeof VENDOR_REFERENCE_BUNDLE_ID;
    sealed_component_count: number;
    re_lists_bundle_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimePackageManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimePackageManifest {
  manifest_id: 'dsc-vendor-runtime-package-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimePackageManifestEntry[];
  sealed_bundle_digest: string;
  sealed_package_digest: string;
  sealed_component_count: number;
  runtime_package_digest: string;
  runtime_package_digest_method: 'sha256_of_ordered_section_digests_and_sealed_bundle_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimePackage {
  vendor_runtime_package_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_PACKAGE_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_PACKAGE_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_package';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PACKAGE_V1';
  runtime_package_id: typeof VENDOR_RUNTIME_PACKAGE_ID;
  runtime_package_version: typeof VENDOR_RUNTIME_PACKAGE_VERSION;
  runtime_package_kind: 'vendor_runtime_package';
  bundle_ref: string;
  bundle_schema_ref: string;
  bundle_registry_ref: string;
  bundle_evidence_ref: string;
  package_ref: string;
  template_ref: string;
  template_certification_ref: string;
  numerical_runtime_package_ref: string;
  sources_supported: string[];
  required_channels: ConditioningChannelId[];
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  runtime_package_schema: VendorRuntimePackageSchema;
  deterministic_runtime_package_identity: DeterministicRuntimePackageIdentity;
  vendor_reference_bundle_binding: VendorReferenceBundleBinding;
  runtime_package_composition: RuntimePackageComposition;
  runtime_package_manifest: RuntimePackageManifest;
  runtime_vendors: {
    count: 0;
    entries: [];
    runtime_policy: string;
    packages_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_package_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_reference_bundle: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    packages_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime package.
 * Reuses the PHASE-077 Vendor Reference Bundle by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime package artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimePackage(
  projectRoot?: string
): { vendorRuntimePackage: DirectSpatialConditioningVendorRuntimePackage } {
  const root = resolveProjectRoot(projectRoot);

  // Gate on the recorded PHASE-077 verdict: the bundle must have passed.
  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_REFERENCE_BUNDLE_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-077 vendor reference bundle did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_REFERENCE_BUNDLE_VERDICT) {
    throw new Error(
      `PHASE-077 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_REFERENCE_BUNDLE_PHASE) {
    throw new Error('PHASE-077 evidence does not cover the vendor reference bundle');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-077 evidence reports outstanding errors');
  }

  const referenceBundle = readJson<DirectSpatialConditioningVendorReferenceBundle>(
    root,
    VENDOR_REFERENCE_BUNDLE_PATH
  );
  if (
    referenceBundle.phase !== DSC_VENDOR_REFERENCE_BUNDLE_PHASE ||
    referenceBundle.system_id !== DSC_VENDOR_REFERENCE_BUNDLE_SYSTEM_ID
  ) {
    throw new Error('PHASE-077 vendor reference bundle is missing or incompatible');
  }
  if (referenceBundle.bundle_id !== VENDOR_REFERENCE_BUNDLE_ID) {
    throw new Error('Vendor reference bundle identity drifted');
  }
  if (referenceBundle.bundle_version !== VENDOR_REFERENCE_BUNDLE_VERSION) {
    throw new Error('Vendor reference bundle version drifted');
  }
  if (!referenceBundle.design_constraints.vendor_neutral) {
    throw new Error('Vendor reference bundle must remain vendor neutral');
  }
  if (!referenceBundle.design_constraints.reuses_certified_vendor_reference_package) {
    throw new Error(
      'Vendor reference bundle must reuse the certified vendor reference package'
    );
  }
  if (referenceBundle.bundled_vendors.count !== 0) {
    throw new Error('PHASE-077 must not have bundled vendors');
  }
  if (
    JSON.stringify(referenceBundle.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor reference bundle channels do not match foundation channels');
  }
  if (
    JSON.stringify(referenceBundle.sources_supported) !== JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor reference bundle sources_supported drifted from the certified corpus'
    );
  }
  if (referenceBundle.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor reference bundle spatial frame drifted');
  }
  if (
    referenceBundle.capability_set_id !== CAPABILITY_SET_ID ||
    referenceBundle.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor reference bundle capability set identity drifted');
  }

  // Re-seal the bundle transitively: recompute its sections and bundle digest.
  const bundleManifest = referenceBundle.bundle_manifest;
  for (const entry of bundleManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed bundle section missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed bundle section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const recomputedBundleDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...bundleManifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_package:${bundleManifest.sealed_package_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (recomputedBundleDigest !== bundleManifest.bundle_digest) {
    throw new Error('sealed bundle digest drifted from the bundle manifest');
  }
  const sealedComponentCount = bundleManifest.sealed_component_count;

  for (const spec of RUNTIME_PACKAGE_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime package section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_PACKAGE_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime package section id');
  }
  const sectionRefs = RUNTIME_PACKAGE_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime package section artifact ref');
  }

  const runtime_package_schema: VendorRuntimePackageSchema = {
    schema_id: 'dsc-vendor-runtime-package-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime package. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime package binds one Vendor Reference Bundle as its root, seals that bundle together with its schema and registry, and seals the bundle contents transitively through the bundle digest. It is a design-time delivery descriptor and declares no runtime execution.',
    encoding: 'application/json',
    runtime_package_id_policy: 'opaque_runtime_package_id_no_vendor_binding',
    bundle_ref: VENDOR_REFERENCE_BUNDLE_ID,
    required_fields: [
      {
        field: 'runtime_package_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_package_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime package version string',
      },
      {
        field: 'runtime_package_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_package',
      },
      {
        field: 'bundle_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor reference bundle ${VENDOR_REFERENCE_BUNDLE_ID}`,
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
        field: 'deterministic_runtime_package_identity',
        type: 'dsc-vendor-runtime-package-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_reference_bundle_binding',
        type: 'dsc-vendor-runtime-package-bundle-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Reference Bundle as the runtime root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_package_composition',
        type: 'dsc-vendor-runtime-package-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of bundle, schema, and registry sections; vendor-specific sections forbidden and bundle contents never re-listed',
      },
      {
        field: 'runtime_package_manifest',
        type: 'dsc-vendor-runtime-package-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed bundle digest and a runtime package digest over both',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_package_identity: DeterministicRuntimePackageIdentity = {
    identity_id: 'dsc-vendor-runtime-package-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime package. The runtime_package_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_package_id: VENDOR_RUNTIME_PACKAGE_ID,
    runtime_package_version: VENDOR_RUNTIME_PACKAGE_VERSION,
    identity_policy: 'opaque_runtime_package_id_no_vendor_binding',
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

  const vendor_reference_bundle_binding: VendorReferenceBundleBinding = {
    binding_id: 'dsc-vendor-runtime-package-bundle-binding-v1',
    description:
      'Exact binding of the PHASE-077 Vendor Reference Bundle as the runtime root. The binding is gated at build time on the recorded PHASE-077 PASS verdict, and re-seals every bundle section and the bundle digest before the runtime package is emitted.',
    bundle_ref: VENDOR_REFERENCE_BUNDLE_PATH,
    bundle_id: VENDOR_REFERENCE_BUNDLE_ID,
    bundle_version: VENDOR_REFERENCE_BUNDLE_VERSION,
    bundle_phase: DSC_VENDOR_REFERENCE_BUNDLE_PHASE,
    bundle_system_id: DSC_VENDOR_REFERENCE_BUNDLE_SYSTEM_ID,
    bundle_evidence_ref: VENDOR_REFERENCE_BUNDLE_EVIDENCE_PATH,
    bundle_verdict: VENDOR_REFERENCE_BUNDLE_VERDICT,
    bundle_evidence_mode: 'phase_077_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_root',
    sealed_bundle_digest: bundleManifest.bundle_digest,
    sealed_package_digest: bundleManifest.sealed_package_digest,
    sealed_component_count: sealedComponentCount,
    packages_runtime_in_this_phase: false,
    implements_bundle_in_this_phase: false,
  };

  const runtime_package_composition: RuntimePackageComposition = {
    composition_id: 'dsc-vendor-runtime-package-composition-v1',
    description:
      'Closed, fixed-order composition of the runtime-oriented delivery package around the Vendor Reference Bundle: the bundle artifact, its shape contract, and its provenance registry. The bundle contents (and the package members beneath them) are sealed transitively through the bundle digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_reference_bundle',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_PACKAGE_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'bundle_contents_sealed_via_bundle_digest',
      sealed_via: VENDOR_REFERENCE_BUNDLE_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_bundle_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimePackageManifestEntry[] = RUNTIME_PACKAGE_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_package_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_bundle:${bundleManifest.bundle_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_package_manifest: RuntimePackageManifest = {
    manifest_id: 'dsc-vendor-runtime-package-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime package section. Digests are computed read-only from disk. The sealed bundle digest carries the bundle contents (and the package members beneath them) transitively, and the runtime package digest is the SHA256 of the ordered section digests followed by the sealed bundle digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_bundle_digest: bundleManifest.bundle_digest,
    sealed_package_digest: bundleManifest.sealed_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_package_digest,
    runtime_package_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_bundle_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimePackage: DirectSpatialConditioningVendorRuntimePackage = {
    vendor_runtime_package_id:
      'direct-spatial-conditioning-vendor-runtime-package-v1',
    phase: DSC_VENDOR_RUNTIME_PACKAGE_PHASE,
    system_id: DSC_VENDOR_RUNTIME_PACKAGE_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_package',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PACKAGE_V1',
    runtime_package_id: VENDOR_RUNTIME_PACKAGE_ID,
    runtime_package_version: VENDOR_RUNTIME_PACKAGE_VERSION,
    runtime_package_kind: 'vendor_runtime_package',
    bundle_ref: VENDOR_REFERENCE_BUNDLE_PATH,
    bundle_schema_ref: VENDOR_REFERENCE_BUNDLE_SCHEMA_PATH,
    bundle_registry_ref: VENDOR_REFERENCE_BUNDLE_REGISTRY_PATH,
    bundle_evidence_ref: VENDOR_REFERENCE_BUNDLE_EVIDENCE_PATH,
    package_ref: VENDOR_REFERENCE_PACKAGE_PATH,
    template_ref: VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
    template_certification_ref: VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
    numerical_runtime_package_ref: RUNTIME_PACKAGE_PATH,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_package_schema,
    deterministic_runtime_package_identity,
    vendor_reference_bundle_binding,
    runtime_package_composition,
    runtime_package_manifest,
    runtime_vendors: {
      count: 0,
      entries: [],
      runtime_policy:
        'concrete vendor runtimes may be packaged against this runtime package only in a future implementation phase; none are packaged here',
      packages_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_package_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_reference_bundle: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      packages_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_PACKAGE_PATH, vendorRuntimePackage);
  return { vendorRuntimePackage };
}
