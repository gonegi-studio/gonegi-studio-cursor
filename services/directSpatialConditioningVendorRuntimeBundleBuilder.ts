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
import {
  DSC_VENDOR_RUNTIME_PACKAGE_PHASE,
  DSC_VENDOR_RUNTIME_PACKAGE_SYSTEM_ID,
  VENDOR_RUNTIME_PACKAGE_ID,
  VENDOR_RUNTIME_PACKAGE_PATH,
  VENDOR_RUNTIME_PACKAGE_VERSION,
  type DirectSpatialConditioningVendorRuntimePackage,
} from './directSpatialConditioningVendorRuntimePackageBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-081: Direct Spatial Conditioning vendor runtime bundle.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Wraps the PHASE-079 Vendor Runtime
 * Package in a distributable runtime envelope:
 *   - runtime bundle schema,
 *   - deterministic runtime bundle identity,
 *   - Vendor Runtime Package binding,
 *   - runtime bundle composition, and
 *   - runtime bundle manifest.
 *
 * The runtime bundle seals three design sections directly (runtime package,
 * schema, registry) and seals everything the runtime package owns transitively
 * through the runtime package digest, so it never re-lists what the package
 * already owns. Implements no vendor, declares no runtime execution, performs
 * no GPU or inference work, and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_BUNDLE_PHASE = 'PHASE-DSC-081' as const;
export const DSC_VENDOR_RUNTIME_BUNDLE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BUNDLE_V1' as const;

export const VENDOR_RUNTIME_BUNDLE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_BUNDLE_PATH =
  `${VENDOR_RUNTIME_BUNDLE_ROOT}/direct-spatial-conditioning-vendor-runtime-bundle-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime bundle. */
export const VENDOR_RUNTIME_BUNDLE_ID = 'dsc-vendor-runtime-bundle-v1' as const;
export const VENDOR_RUNTIME_BUNDLE_VERSION = '1.0' as const;

/** Design-time contract set of the passing PHASE-079 runtime package. */
export const VENDOR_RUNTIME_PACKAGE_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-package.schema.json' as const;
export const VENDOR_RUNTIME_PACKAGE_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-package-registry-v1.json' as const;
export const VENDOR_RUNTIME_PACKAGE_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PACKAGE_VALIDATION_REPORT.json' as const;

export const VENDOR_RUNTIME_PACKAGE_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PACKAGE_V1' as const;

/**
 * Ordered runtime bundle sections. Only the runtime package's own design-time
 * contract set is sealed directly; everything it owns is sealed transitively.
 */
export const RUNTIME_BUNDLE_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind: 'runtime_package_artifact' | 'runtime_package_schema' | 'runtime_package_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_package',
    role: 'runtime_bundle_root_package',
    kind: 'runtime_package_artifact',
    artifact_ref: VENDOR_RUNTIME_PACKAGE_PATH,
  },
  {
    section_id: 'vendor_runtime_package_schema',
    role: 'runtime_package_shape_contract',
    kind: 'runtime_package_schema',
    artifact_ref: VENDOR_RUNTIME_PACKAGE_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_package_registry',
    role: 'runtime_package_provenance_registry',
    kind: 'runtime_package_registry',
    artifact_ref: VENDOR_RUNTIME_PACKAGE_REGISTRY_PATH,
  },
];

export interface RuntimeBundleSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeBundleSchema {
  schema_id: 'dsc-vendor-runtime-bundle-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_bundle_id_policy: 'opaque_runtime_bundle_id_no_vendor_binding';
  runtime_package_ref: typeof VENDOR_RUNTIME_PACKAGE_ID;
  required_fields: RuntimeBundleSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeBundleIdentity {
  identity_id: 'dsc-vendor-runtime-bundle-deterministic-identity-v1';
  description: string;
  runtime_bundle_id: typeof VENDOR_RUNTIME_BUNDLE_ID;
  runtime_bundle_version: typeof VENDOR_RUNTIME_BUNDLE_VERSION;
  identity_policy: 'opaque_runtime_bundle_id_no_vendor_binding';
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

export interface VendorRuntimePackageBinding {
  binding_id: 'dsc-vendor-runtime-bundle-package-binding-v1';
  description: string;
  runtime_package_ref: string;
  runtime_package_id: typeof VENDOR_RUNTIME_PACKAGE_ID;
  runtime_package_version: typeof VENDOR_RUNTIME_PACKAGE_VERSION;
  runtime_package_phase: typeof DSC_VENDOR_RUNTIME_PACKAGE_PHASE;
  runtime_package_system_id: typeof DSC_VENDOR_RUNTIME_PACKAGE_SYSTEM_ID;
  runtime_package_evidence_ref: string;
  runtime_package_verdict: typeof VENDOR_RUNTIME_PACKAGE_VERDICT;
  runtime_package_evidence_mode: 'phase_079_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_bundle_root';
  sealed_runtime_package_digest: string;
  sealed_bundle_digest: string;
  sealed_package_digest: string;
  sealed_component_count: number;
  bundles_runtime_in_this_phase: false;
  implements_runtime_package_in_this_phase: false;
}

export interface RuntimeBundleSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeBundleComposition {
  composition_id: 'dsc-vendor-runtime-bundle-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_package';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeBundleSection[];
  transitive_seal: {
    policy: 'runtime_package_contents_sealed_via_runtime_package_digest';
    sealed_via: typeof VENDOR_RUNTIME_PACKAGE_ID;
    sealed_component_count: number;
    re_lists_runtime_package_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeBundleManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeBundleManifest {
  manifest_id: 'dsc-vendor-runtime-bundle-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeBundleManifestEntry[];
  sealed_runtime_package_digest: string;
  sealed_bundle_digest: string;
  sealed_package_digest: string;
  sealed_component_count: number;
  runtime_bundle_digest: string;
  runtime_bundle_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_package_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeBundle {
  vendor_runtime_bundle_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_BUNDLE_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_BUNDLE_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_bundle';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BUNDLE_V1';
  runtime_bundle_id: typeof VENDOR_RUNTIME_BUNDLE_ID;
  runtime_bundle_version: typeof VENDOR_RUNTIME_BUNDLE_VERSION;
  runtime_bundle_kind: 'vendor_runtime_bundle';
  runtime_package_ref: string;
  runtime_package_schema_ref: string;
  runtime_package_registry_ref: string;
  runtime_package_evidence_ref: string;
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
  runtime_bundle_schema: VendorRuntimeBundleSchema;
  deterministic_runtime_bundle_identity: DeterministicRuntimeBundleIdentity;
  vendor_runtime_package_binding: VendorRuntimePackageBinding;
  runtime_bundle_composition: RuntimeBundleComposition;
  runtime_bundle_manifest: RuntimeBundleManifest;
  runtime_bundled_vendors: {
    count: 0;
    entries: [];
    bundling_policy: string;
    bundles_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_bundle_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_package: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    bundles_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime bundle.
 * Reuses the PHASE-079 Vendor Runtime Package by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime bundle artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeBundle(
  projectRoot?: string
): { vendorRuntimeBundle: DirectSpatialConditioningVendorRuntimeBundle } {
  const root = resolveProjectRoot(projectRoot);

  // Gate on the recorded PHASE-079 verdict: the runtime package must have passed.
  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_PACKAGE_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-079 vendor runtime package did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_PACKAGE_VERDICT) {
    throw new Error(
      `PHASE-079 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_PACKAGE_PHASE) {
    throw new Error('PHASE-079 evidence does not cover the vendor runtime package');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-079 evidence reports outstanding errors');
  }

  const runtimePackage = readJson<DirectSpatialConditioningVendorRuntimePackage>(
    root,
    VENDOR_RUNTIME_PACKAGE_PATH
  );
  if (
    runtimePackage.phase !== DSC_VENDOR_RUNTIME_PACKAGE_PHASE ||
    runtimePackage.system_id !== DSC_VENDOR_RUNTIME_PACKAGE_SYSTEM_ID
  ) {
    throw new Error('PHASE-079 vendor runtime package is missing or incompatible');
  }
  if (runtimePackage.runtime_package_id !== VENDOR_RUNTIME_PACKAGE_ID) {
    throw new Error('Vendor runtime package identity drifted');
  }
  if (runtimePackage.runtime_package_version !== VENDOR_RUNTIME_PACKAGE_VERSION) {
    throw new Error('Vendor runtime package version drifted');
  }
  if (!runtimePackage.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime package must remain vendor neutral');
  }
  if (!runtimePackage.design_constraints.reuses_certified_vendor_reference_bundle) {
    throw new Error(
      'Vendor runtime package must reuse the certified vendor reference bundle'
    );
  }
  if (runtimePackage.runtime_vendors.count !== 0) {
    throw new Error('PHASE-079 must not have packaged runtime vendors');
  }
  if (runtimePackage.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-079 must not declare runtime execution');
  }
  if (
    JSON.stringify(runtimePackage.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime package channels do not match foundation channels');
  }
  if (
    JSON.stringify(runtimePackage.sources_supported) !== JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime package sources_supported drifted from the certified corpus'
    );
  }
  if (runtimePackage.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime package spatial frame drifted');
  }
  if (
    runtimePackage.capability_set_id !== CAPABILITY_SET_ID ||
    runtimePackage.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime package capability set identity drifted');
  }

  // Re-seal the runtime package transitively.
  const runtimePackageManifest = runtimePackage.runtime_package_manifest;
  for (const entry of runtimePackageManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(
        `sealed runtime package section missing on disk: ${entry.artifact_ref}`
      );
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(
        `sealed runtime package section digest drifted: ${entry.artifact_ref}`
      );
    }
  }
  const recomputedRuntimePackageDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimePackageManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_bundle:${runtimePackageManifest.sealed_bundle_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (recomputedRuntimePackageDigest !== runtimePackageManifest.runtime_package_digest) {
    throw new Error(
      'sealed runtime package digest drifted from the runtime package manifest'
    );
  }
  const sealedComponentCount = runtimePackageManifest.sealed_component_count;

  for (const spec of RUNTIME_BUNDLE_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime bundle section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_BUNDLE_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime bundle section id');
  }
  const sectionRefs = RUNTIME_BUNDLE_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime bundle section artifact ref');
  }

  const runtime_bundle_schema: VendorRuntimeBundleSchema = {
    schema_id: 'dsc-vendor-runtime-bundle-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime bundle. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime bundle binds one Vendor Runtime Package as its root, seals that package together with its schema and registry, and seals the package contents transitively through the runtime package digest. It is a design-time delivery envelope and declares no runtime execution.',
    encoding: 'application/json',
    runtime_bundle_id_policy: 'opaque_runtime_bundle_id_no_vendor_binding',
    runtime_package_ref: VENDOR_RUNTIME_PACKAGE_ID,
    required_fields: [
      {
        field: 'runtime_bundle_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_bundle_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime bundle version string',
      },
      {
        field: 'runtime_bundle_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_bundle',
      },
      {
        field: 'runtime_package_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime package ${VENDOR_RUNTIME_PACKAGE_ID}`,
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
        field: 'deterministic_runtime_bundle_identity',
        type: 'dsc-vendor-runtime-bundle-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_package_binding',
        type: 'dsc-vendor-runtime-bundle-package-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Package as the runtime bundle root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_bundle_composition',
        type: 'dsc-vendor-runtime-bundle-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime package, schema, and registry sections; vendor-specific sections forbidden and runtime package contents never re-listed',
      },
      {
        field: 'runtime_bundle_manifest',
        type: 'dsc-vendor-runtime-bundle-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime package digest and a runtime bundle digest over both',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_bundle_identity: DeterministicRuntimeBundleIdentity = {
    identity_id: 'dsc-vendor-runtime-bundle-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime bundle. The runtime_bundle_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_bundle_id: VENDOR_RUNTIME_BUNDLE_ID,
    runtime_bundle_version: VENDOR_RUNTIME_BUNDLE_VERSION,
    identity_policy: 'opaque_runtime_bundle_id_no_vendor_binding',
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

  const vendor_runtime_package_binding: VendorRuntimePackageBinding = {
    binding_id: 'dsc-vendor-runtime-bundle-package-binding-v1',
    description:
      'Exact binding of the PHASE-079 Vendor Runtime Package as the runtime bundle root. The binding is gated at build time on the recorded PHASE-079 PASS verdict, and re-seals every runtime package section and the runtime package digest before the runtime bundle is emitted.',
    runtime_package_ref: VENDOR_RUNTIME_PACKAGE_PATH,
    runtime_package_id: VENDOR_RUNTIME_PACKAGE_ID,
    runtime_package_version: VENDOR_RUNTIME_PACKAGE_VERSION,
    runtime_package_phase: DSC_VENDOR_RUNTIME_PACKAGE_PHASE,
    runtime_package_system_id: DSC_VENDOR_RUNTIME_PACKAGE_SYSTEM_ID,
    runtime_package_evidence_ref: VENDOR_RUNTIME_PACKAGE_EVIDENCE_PATH,
    runtime_package_verdict: VENDOR_RUNTIME_PACKAGE_VERDICT,
    runtime_package_evidence_mode: 'phase_079_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_bundle_root',
    sealed_runtime_package_digest: runtimePackageManifest.runtime_package_digest,
    sealed_bundle_digest: runtimePackageManifest.sealed_bundle_digest,
    sealed_package_digest: runtimePackageManifest.sealed_package_digest,
    sealed_component_count: sealedComponentCount,
    bundles_runtime_in_this_phase: false,
    implements_runtime_package_in_this_phase: false,
  };

  const runtime_bundle_composition: RuntimeBundleComposition = {
    composition_id: 'dsc-vendor-runtime-bundle-composition-v1',
    description:
      'Closed, fixed-order composition of the runtime-oriented delivery envelope around the Vendor Runtime Package: the runtime package artifact, its shape contract, and its provenance registry. The runtime package contents (and everything sealed beneath them) are sealed transitively through the runtime package digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_package',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_BUNDLE_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_package_contents_sealed_via_runtime_package_digest',
      sealed_via: VENDOR_RUNTIME_PACKAGE_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_package_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeBundleManifestEntry[] = RUNTIME_BUNDLE_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_bundle_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_package:${runtimePackageManifest.runtime_package_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_bundle_manifest: RuntimeBundleManifest = {
    manifest_id: 'dsc-vendor-runtime-bundle-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime bundle section. Digests are computed read-only from disk. The sealed runtime package digest carries the runtime package contents (and everything sealed beneath them) transitively, and the runtime bundle digest is the SHA256 of the ordered section digests followed by the sealed runtime package digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_package_digest: runtimePackageManifest.runtime_package_digest,
    sealed_bundle_digest: runtimePackageManifest.sealed_bundle_digest,
    sealed_package_digest: runtimePackageManifest.sealed_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_bundle_digest,
    runtime_bundle_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_package_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeBundle: DirectSpatialConditioningVendorRuntimeBundle = {
    vendor_runtime_bundle_id: 'direct-spatial-conditioning-vendor-runtime-bundle-v1',
    phase: DSC_VENDOR_RUNTIME_BUNDLE_PHASE,
    system_id: DSC_VENDOR_RUNTIME_BUNDLE_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_bundle',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BUNDLE_V1',
    runtime_bundle_id: VENDOR_RUNTIME_BUNDLE_ID,
    runtime_bundle_version: VENDOR_RUNTIME_BUNDLE_VERSION,
    runtime_bundle_kind: 'vendor_runtime_bundle',
    runtime_package_ref: VENDOR_RUNTIME_PACKAGE_PATH,
    runtime_package_schema_ref: VENDOR_RUNTIME_PACKAGE_SCHEMA_PATH,
    runtime_package_registry_ref: VENDOR_RUNTIME_PACKAGE_REGISTRY_PATH,
    runtime_package_evidence_ref: VENDOR_RUNTIME_PACKAGE_EVIDENCE_PATH,
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
    runtime_bundle_schema,
    deterministic_runtime_bundle_identity,
    vendor_runtime_package_binding,
    runtime_bundle_composition,
    runtime_bundle_manifest,
    runtime_bundled_vendors: {
      count: 0,
      entries: [],
      bundling_policy:
        'concrete vendor runtimes may be bundled against this runtime bundle only in a future implementation phase; none are bundled here',
      bundles_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_bundle_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_package: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      bundles_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_BUNDLE_PATH, vendorRuntimeBundle);
  return { vendorRuntimeBundle };
}
