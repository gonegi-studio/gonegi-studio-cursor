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
import {
  DSC_VENDOR_RUNTIME_BUNDLE_PHASE,
  DSC_VENDOR_RUNTIME_BUNDLE_SYSTEM_ID,
  VENDOR_RUNTIME_BUNDLE_ID,
  VENDOR_RUNTIME_BUNDLE_PATH,
  VENDOR_RUNTIME_BUNDLE_VERSION,
  type DirectSpatialConditioningVendorRuntimeBundle,
} from './directSpatialConditioningVendorRuntimeBundleBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-083: Direct Spatial Conditioning vendor runtime profile.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Profiles the PHASE-081 Vendor
 * Runtime Bundle for a target deployment surface:
 *   - runtime profile schema,
 *   - deterministic runtime profile identity,
 *   - Vendor Runtime Bundle binding,
 *   - runtime profile composition, and
 *   - runtime profile manifest.
 *
 * The profile seals three design sections directly (runtime bundle, schema,
 * registry) and seals everything the runtime bundle owns transitively through
 * the runtime bundle digest, so it never re-lists what the bundle already
 * owns. It selects a vendor-neutral capability profile only; it implements no
 * vendor, declares no runtime execution, performs no GPU or inference work, and
 * modifies no member.
 */

export const DSC_VENDOR_RUNTIME_PROFILE_PHASE = 'PHASE-DSC-083' as const;
export const DSC_VENDOR_RUNTIME_PROFILE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_V1' as const;

export const VENDOR_RUNTIME_PROFILE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_PROFILE_PATH =
  `${VENDOR_RUNTIME_PROFILE_ROOT}/direct-spatial-conditioning-vendor-runtime-profile-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime profile. */
export const VENDOR_RUNTIME_PROFILE_ID = 'dsc-vendor-runtime-profile-v1' as const;
export const VENDOR_RUNTIME_PROFILE_VERSION = '1.0' as const;

/** Design-time contract set of the passing PHASE-081 runtime bundle. */
export const VENDOR_RUNTIME_BUNDLE_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-bundle.schema.json' as const;
export const VENDOR_RUNTIME_BUNDLE_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-bundle-registry-v1.json' as const;
export const VENDOR_RUNTIME_BUNDLE_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BUNDLE_VALIDATION_REPORT.json' as const;

export const VENDOR_RUNTIME_BUNDLE_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BUNDLE_V1' as const;

/**
 * Ordered runtime profile sections. Only the runtime bundle's own design-time
 * contract set is sealed directly; everything it owns is sealed transitively.
 */
export const RUNTIME_PROFILE_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind: 'runtime_bundle_artifact' | 'runtime_bundle_schema' | 'runtime_bundle_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_bundle',
    role: 'runtime_profile_root_bundle',
    kind: 'runtime_bundle_artifact',
    artifact_ref: VENDOR_RUNTIME_BUNDLE_PATH,
  },
  {
    section_id: 'vendor_runtime_bundle_schema',
    role: 'runtime_bundle_shape_contract',
    kind: 'runtime_bundle_schema',
    artifact_ref: VENDOR_RUNTIME_BUNDLE_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_bundle_registry',
    role: 'runtime_bundle_provenance_registry',
    kind: 'runtime_bundle_registry',
    artifact_ref: VENDOR_RUNTIME_BUNDLE_REGISTRY_PATH,
  },
];

/**
 * Vendor-neutral deployment surfaces the profile declares support for. These
 * are abstract capability tiers, not concrete devices, frameworks, or vendors.
 */
export const RUNTIME_PROFILE_SURFACE_IDS = [
  'reference_cpu_surface',
  'accelerated_surface',
  'batch_surface',
] as const;
export type RuntimeProfileSurfaceId = (typeof RUNTIME_PROFILE_SURFACE_IDS)[number];

export interface RuntimeProfileSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeProfileSchema {
  schema_id: 'dsc-vendor-runtime-profile-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_profile_id_policy: 'opaque_runtime_profile_id_no_vendor_binding';
  runtime_bundle_ref: typeof VENDOR_RUNTIME_BUNDLE_ID;
  required_fields: RuntimeProfileSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeProfileIdentity {
  identity_id: 'dsc-vendor-runtime-profile-deterministic-identity-v1';
  description: string;
  runtime_profile_id: typeof VENDOR_RUNTIME_PROFILE_ID;
  runtime_profile_version: typeof VENDOR_RUNTIME_PROFILE_VERSION;
  identity_policy: 'opaque_runtime_profile_id_no_vendor_binding';
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

export interface VendorRuntimeBundleBinding {
  binding_id: 'dsc-vendor-runtime-profile-bundle-binding-v1';
  description: string;
  runtime_bundle_ref: string;
  runtime_bundle_id: typeof VENDOR_RUNTIME_BUNDLE_ID;
  runtime_bundle_version: typeof VENDOR_RUNTIME_BUNDLE_VERSION;
  runtime_bundle_phase: typeof DSC_VENDOR_RUNTIME_BUNDLE_PHASE;
  runtime_bundle_system_id: typeof DSC_VENDOR_RUNTIME_BUNDLE_SYSTEM_ID;
  runtime_bundle_evidence_ref: string;
  runtime_bundle_verdict: typeof VENDOR_RUNTIME_BUNDLE_VERDICT;
  runtime_bundle_evidence_mode: 'phase_081_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_profile_root';
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  profiles_runtime_in_this_phase: false;
  implements_runtime_bundle_in_this_phase: false;
}

export interface RuntimeProfileCapabilitySurface {
  surface_id: RuntimeProfileSurfaceId;
  order: number;
  description: string;
  requires_gpu: false;
  performs_inference: false;
  vendor_binding: 'none';
  device_binding: 'none';
  selected_in_this_phase: false;
}

export interface RuntimeProfileCapabilityProfile {
  capability_profile_id: 'dsc-vendor-runtime-capability-profile-v1';
  description: string;
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  surface_order: 'fixed_declared_order';
  closed_set: true;
  surfaces: RuntimeProfileCapabilitySurface[];
  required_channels: ConditioningChannelId[];
  binds_concrete_surface_in_this_phase: false;
}

export interface RuntimeProfileSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeProfileComposition {
  composition_id: 'dsc-vendor-runtime-profile-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_bundle';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeProfileSection[];
  capability_profile: RuntimeProfileCapabilityProfile;
  transitive_seal: {
    policy: 'runtime_bundle_contents_sealed_via_runtime_bundle_digest';
    sealed_via: typeof VENDOR_RUNTIME_BUNDLE_ID;
    sealed_component_count: number;
    re_lists_runtime_bundle_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeProfileManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeProfileManifest {
  manifest_id: 'dsc-vendor-runtime-profile-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeProfileManifestEntry[];
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  capability_surface_count: number;
  runtime_profile_digest: string;
  runtime_profile_digest_method: 'sha256_of_ordered_section_digests_surfaces_and_sealed_runtime_bundle_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeProfile {
  vendor_runtime_profile_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_PROFILE_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_profile';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_V1';
  runtime_profile_id: typeof VENDOR_RUNTIME_PROFILE_ID;
  runtime_profile_version: typeof VENDOR_RUNTIME_PROFILE_VERSION;
  runtime_profile_kind: 'vendor_runtime_profile';
  runtime_bundle_ref: string;
  runtime_bundle_schema_ref: string;
  runtime_bundle_registry_ref: string;
  runtime_bundle_evidence_ref: string;
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
  runtime_profile_schema: VendorRuntimeProfileSchema;
  deterministic_runtime_profile_identity: DeterministicRuntimeProfileIdentity;
  vendor_runtime_bundle_binding: VendorRuntimeBundleBinding;
  runtime_profile_composition: RuntimeProfileComposition;
  runtime_profile_manifest: RuntimeProfileManifest;
  profiled_runtime_vendors: {
    count: 0;
    entries: [];
    profiling_policy: string;
    profiles_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_profile_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_bundle: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    binds_concrete_surface_in_this_phase: false;
    profiles_runtime_in_this_phase: false;
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

const SURFACE_DESCRIPTIONS: Record<RuntimeProfileSurfaceId, string> = {
  reference_cpu_surface:
    'Deterministic reference surface with no acceleration; vendor-neutral and device-agnostic.',
  accelerated_surface:
    'Abstract accelerated capability tier; declares no concrete device, framework, or vendor.',
  batch_surface:
    'Abstract batch-oriented capability tier; declares no concrete device, framework, or vendor.',
};

/**
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime profile.
 * Reuses the PHASE-081 Vendor Runtime Bundle by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime profile artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeProfile(
  projectRoot?: string
): { vendorRuntimeProfile: DirectSpatialConditioningVendorRuntimeProfile } {
  const root = resolveProjectRoot(projectRoot);

  // Gate on the recorded PHASE-081 verdict: the runtime bundle must have passed.
  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_BUNDLE_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-081 vendor runtime bundle did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_BUNDLE_VERDICT) {
    throw new Error(
      `PHASE-081 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_BUNDLE_PHASE) {
    throw new Error('PHASE-081 evidence does not cover the vendor runtime bundle');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-081 evidence reports outstanding errors');
  }

  const runtimeBundle = readJson<DirectSpatialConditioningVendorRuntimeBundle>(
    root,
    VENDOR_RUNTIME_BUNDLE_PATH
  );
  if (
    runtimeBundle.phase !== DSC_VENDOR_RUNTIME_BUNDLE_PHASE ||
    runtimeBundle.system_id !== DSC_VENDOR_RUNTIME_BUNDLE_SYSTEM_ID
  ) {
    throw new Error('PHASE-081 vendor runtime bundle is missing or incompatible');
  }
  if (runtimeBundle.runtime_bundle_id !== VENDOR_RUNTIME_BUNDLE_ID) {
    throw new Error('Vendor runtime bundle identity drifted');
  }
  if (runtimeBundle.runtime_bundle_version !== VENDOR_RUNTIME_BUNDLE_VERSION) {
    throw new Error('Vendor runtime bundle version drifted');
  }
  if (!runtimeBundle.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime bundle must remain vendor neutral');
  }
  if (!runtimeBundle.design_constraints.reuses_certified_vendor_runtime_package) {
    throw new Error(
      'Vendor runtime bundle must reuse the certified vendor runtime package'
    );
  }
  if (runtimeBundle.runtime_bundled_vendors.count !== 0) {
    throw new Error('PHASE-081 must not have bundled runtime vendors');
  }
  if (runtimeBundle.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-081 must not declare runtime execution');
  }
  if (
    JSON.stringify(runtimeBundle.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime bundle channels do not match foundation channels');
  }
  if (JSON.stringify(runtimeBundle.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
    throw new Error(
      'Vendor runtime bundle sources_supported drifted from the certified corpus'
    );
  }
  if (runtimeBundle.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime bundle spatial frame drifted');
  }
  if (
    runtimeBundle.capability_set_id !== CAPABILITY_SET_ID ||
    runtimeBundle.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime bundle capability set identity drifted');
  }

  // Re-seal the runtime bundle transitively.
  const runtimeBundleManifest = runtimeBundle.runtime_bundle_manifest;
  for (const entry of runtimeBundleManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed runtime bundle section missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed runtime bundle section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const recomputedRuntimeBundleDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeBundleManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_package:${runtimeBundleManifest.sealed_runtime_package_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (recomputedRuntimeBundleDigest !== runtimeBundleManifest.runtime_bundle_digest) {
    throw new Error('sealed runtime bundle digest drifted from the runtime bundle manifest');
  }
  const sealedComponentCount = runtimeBundleManifest.sealed_component_count;

  for (const spec of RUNTIME_PROFILE_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime profile section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_PROFILE_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime profile section id');
  }
  const sectionRefs = RUNTIME_PROFILE_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime profile section artifact ref');
  }

  const runtime_profile_schema: VendorRuntimeProfileSchema = {
    schema_id: 'dsc-vendor-runtime-profile-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime profile. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime profile binds one Vendor Runtime Bundle as its root, declares a closed set of vendor-neutral capability surfaces, seals the bundle together with its schema and registry, and seals the bundle contents transitively through the runtime bundle digest. It selects no concrete surface and declares no runtime execution.',
    encoding: 'application/json',
    runtime_profile_id_policy: 'opaque_runtime_profile_id_no_vendor_binding',
    runtime_bundle_ref: VENDOR_RUNTIME_BUNDLE_ID,
    required_fields: [
      {
        field: 'runtime_profile_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_profile_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime profile version string',
      },
      {
        field: 'runtime_profile_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_profile',
      },
      {
        field: 'runtime_bundle_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime bundle ${VENDOR_RUNTIME_BUNDLE_ID}`,
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
        field: 'deterministic_runtime_profile_identity',
        type: 'dsc-vendor-runtime-profile-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_bundle_binding',
        type: 'dsc-vendor-runtime-profile-bundle-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Bundle as the runtime profile root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_profile_composition',
        type: 'dsc-vendor-runtime-profile-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime bundle, schema, and registry sections plus a vendor-neutral capability profile; vendor-specific sections forbidden and bundle contents never re-listed',
      },
      {
        field: 'runtime_profile_manifest',
        type: 'dsc-vendor-runtime-profile-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime bundle digest and a runtime profile digest over sections, surfaces, and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_profile_identity: DeterministicRuntimeProfileIdentity = {
    identity_id: 'dsc-vendor-runtime-profile-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime profile. The runtime_profile_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_profile_id: VENDOR_RUNTIME_PROFILE_ID,
    runtime_profile_version: VENDOR_RUNTIME_PROFILE_VERSION,
    identity_policy: 'opaque_runtime_profile_id_no_vendor_binding',
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

  const vendor_runtime_bundle_binding: VendorRuntimeBundleBinding = {
    binding_id: 'dsc-vendor-runtime-profile-bundle-binding-v1',
    description:
      'Exact binding of the PHASE-081 Vendor Runtime Bundle as the runtime profile root. The binding is gated at build time on the recorded PHASE-081 PASS verdict, and re-seals every runtime bundle section and the runtime bundle digest before the runtime profile is emitted.',
    runtime_bundle_ref: VENDOR_RUNTIME_BUNDLE_PATH,
    runtime_bundle_id: VENDOR_RUNTIME_BUNDLE_ID,
    runtime_bundle_version: VENDOR_RUNTIME_BUNDLE_VERSION,
    runtime_bundle_phase: DSC_VENDOR_RUNTIME_BUNDLE_PHASE,
    runtime_bundle_system_id: DSC_VENDOR_RUNTIME_BUNDLE_SYSTEM_ID,
    runtime_bundle_evidence_ref: VENDOR_RUNTIME_BUNDLE_EVIDENCE_PATH,
    runtime_bundle_verdict: VENDOR_RUNTIME_BUNDLE_VERDICT,
    runtime_bundle_evidence_mode: 'phase_081_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_profile_root',
    sealed_runtime_bundle_digest: runtimeBundleManifest.runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeBundleManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    profiles_runtime_in_this_phase: false,
    implements_runtime_bundle_in_this_phase: false,
  };

  const capability_profile: RuntimeProfileCapabilityProfile = {
    capability_profile_id: 'dsc-vendor-runtime-capability-profile-v1',
    description:
      'Closed, fixed-order set of vendor-neutral deployment surfaces the runtime profile declares support for. Each surface is an abstract capability tier that binds no concrete device, framework, or vendor, requires no GPU, performs no inference, and is not selected in this phase.',
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    surface_order: 'fixed_declared_order',
    closed_set: true,
    surfaces: RUNTIME_PROFILE_SURFACE_IDS.map((surfaceId, index) => ({
      surface_id: surfaceId,
      order: index + 1,
      description: SURFACE_DESCRIPTIONS[surfaceId],
      requires_gpu: false,
      performs_inference: false,
      vendor_binding: 'none',
      device_binding: 'none',
      selected_in_this_phase: false,
    })),
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    binds_concrete_surface_in_this_phase: false,
  };

  const runtime_profile_composition: RuntimeProfileComposition = {
    composition_id: 'dsc-vendor-runtime-profile-composition-v1',
    description:
      'Closed, fixed-order composition of the profiling envelope around the Vendor Runtime Bundle: the runtime bundle artifact, its shape contract, and its provenance registry, together with a vendor-neutral capability profile. The runtime bundle contents (and everything sealed beneath them) are sealed transitively through the runtime bundle digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_bundle',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_PROFILE_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    capability_profile,
    transitive_seal: {
      policy: 'runtime_bundle_contents_sealed_via_runtime_bundle_digest',
      sealed_via: VENDOR_RUNTIME_BUNDLE_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_bundle_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeProfileManifestEntry[] = RUNTIME_PROFILE_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_profile_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `surfaces:${capability_profile.surfaces.map((surface) => surface.surface_id).join(',')}`,
        `sealed_runtime_bundle:${runtimeBundleManifest.runtime_bundle_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_profile_manifest: RuntimeProfileManifest = {
    manifest_id: 'dsc-vendor-runtime-profile-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime profile section. Digests are computed read-only from disk. The sealed runtime bundle digest carries the bundle contents (and everything sealed beneath them) transitively, and the runtime profile digest is the SHA256 of the ordered section digests, the capability surface ids, and the sealed runtime bundle digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_bundle_digest: runtimeBundleManifest.runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeBundleManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    capability_surface_count: capability_profile.surfaces.length,
    runtime_profile_digest,
    runtime_profile_digest_method:
      'sha256_of_ordered_section_digests_surfaces_and_sealed_runtime_bundle_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeProfile: DirectSpatialConditioningVendorRuntimeProfile = {
    vendor_runtime_profile_id: 'direct-spatial-conditioning-vendor-runtime-profile-v1',
    phase: DSC_VENDOR_RUNTIME_PROFILE_PHASE,
    system_id: DSC_VENDOR_RUNTIME_PROFILE_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_profile',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_V1',
    runtime_profile_id: VENDOR_RUNTIME_PROFILE_ID,
    runtime_profile_version: VENDOR_RUNTIME_PROFILE_VERSION,
    runtime_profile_kind: 'vendor_runtime_profile',
    runtime_bundle_ref: VENDOR_RUNTIME_BUNDLE_PATH,
    runtime_bundle_schema_ref: VENDOR_RUNTIME_BUNDLE_SCHEMA_PATH,
    runtime_bundle_registry_ref: VENDOR_RUNTIME_BUNDLE_REGISTRY_PATH,
    runtime_bundle_evidence_ref: VENDOR_RUNTIME_BUNDLE_EVIDENCE_PATH,
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
    runtime_profile_schema,
    deterministic_runtime_profile_identity,
    vendor_runtime_bundle_binding,
    runtime_profile_composition,
    runtime_profile_manifest,
    profiled_runtime_vendors: {
      count: 0,
      entries: [],
      profiling_policy:
        'concrete vendor runtimes may be profiled against this runtime profile only in a future implementation phase; none are profiled here',
      profiles_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_profile_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_bundle: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      binds_concrete_surface_in_this_phase: false,
      profiles_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_PROFILE_PATH, vendorRuntimeProfile);
  return { vendorRuntimeProfile };
}
