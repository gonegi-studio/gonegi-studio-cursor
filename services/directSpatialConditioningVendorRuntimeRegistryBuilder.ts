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
import {
  DSC_VENDOR_RUNTIME_PROFILE_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_ID,
  VENDOR_RUNTIME_PROFILE_PATH,
  VENDOR_RUNTIME_PROFILE_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfile,
} from './directSpatialConditioningVendorRuntimeProfileBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-085: Direct Spatial Conditioning vendor runtime registry.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Indexes the PHASE-083 Vendor
 * Runtime Profile as the sole design-time runtime registration root:
 *   - runtime registry schema,
 *   - deterministic runtime registry identity,
 *   - Vendor Runtime Profile binding,
 *   - runtime registry composition, and
 *   - runtime registry manifest.
 *
 * The registry seals three design sections directly (runtime profile, schema,
 * registry) and seals everything the runtime profile owns transitively through
 * the runtime profile digest, so it never re-lists what the profile already
 * owns. It registers no concrete runtime, implements no vendor, declares no
 * runtime execution, performs no GPU or inference work, and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_REGISTRY_PHASE = 'PHASE-DSC-085' as const;
export const DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_REGISTRY_V1' as const;

export const VENDOR_RUNTIME_REGISTRY_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_REGISTRY_PATH =
  `${VENDOR_RUNTIME_REGISTRY_ROOT}/direct-spatial-conditioning-vendor-runtime-registry-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime registry. */
export const VENDOR_RUNTIME_REGISTRY_ID = 'dsc-vendor-runtime-registry-v1' as const;
export const VENDOR_RUNTIME_REGISTRY_VERSION = '1.0' as const;

/** Design-time contract set of the passing PHASE-083 runtime profile. */
export const VENDOR_RUNTIME_PROFILE_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile.schema.json' as const;
export const VENDOR_RUNTIME_PROFILE_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-registry-v1.json' as const;
export const VENDOR_RUNTIME_PROFILE_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_VALIDATION_REPORT.json' as const;

export const VENDOR_RUNTIME_PROFILE_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_V1' as const;

/**
 * Ordered runtime registry sections. Only the runtime profile's own design-time
 * contract set is sealed directly; everything it owns is sealed transitively.
 */
export const RUNTIME_REGISTRY_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind: 'runtime_profile_artifact' | 'runtime_profile_schema' | 'runtime_profile_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_profile',
    role: 'runtime_registry_root_profile',
    kind: 'runtime_profile_artifact',
    artifact_ref: VENDOR_RUNTIME_PROFILE_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_schema',
    role: 'runtime_profile_shape_contract',
    kind: 'runtime_profile_schema',
    artifact_ref: VENDOR_RUNTIME_PROFILE_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_registry',
    role: 'runtime_profile_provenance_registry',
    kind: 'runtime_profile_registry',
    artifact_ref: VENDOR_RUNTIME_PROFILE_REGISTRY_PATH,
  },
];

export interface RuntimeRegistrySchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeRegistrySchema {
  schema_id: 'dsc-vendor-runtime-registry-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_registry_id_policy: 'opaque_runtime_registry_id_no_vendor_binding';
  runtime_profile_ref: typeof VENDOR_RUNTIME_PROFILE_ID;
  required_fields: RuntimeRegistrySchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeRegistryIdentity {
  identity_id: 'dsc-vendor-runtime-registry-deterministic-identity-v1';
  description: string;
  runtime_registry_id: typeof VENDOR_RUNTIME_REGISTRY_ID;
  runtime_registry_version: typeof VENDOR_RUNTIME_REGISTRY_VERSION;
  identity_policy: 'opaque_runtime_registry_id_no_vendor_binding';
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

export interface VendorRuntimeProfileBinding {
  binding_id: 'dsc-vendor-runtime-registry-profile-binding-v1';
  description: string;
  runtime_profile_ref: string;
  runtime_profile_id: typeof VENDOR_RUNTIME_PROFILE_ID;
  runtime_profile_version: typeof VENDOR_RUNTIME_PROFILE_VERSION;
  runtime_profile_phase: typeof DSC_VENDOR_RUNTIME_PROFILE_PHASE;
  runtime_profile_system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_SYSTEM_ID;
  runtime_profile_evidence_ref: string;
  runtime_profile_verdict: typeof VENDOR_RUNTIME_PROFILE_VERDICT;
  runtime_profile_evidence_mode: 'phase_083_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_registry_root';
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  registers_runtime_in_this_phase: false;
  implements_runtime_profile_in_this_phase: false;
}

export interface RuntimeRegistrySection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeRegistryComposition {
  composition_id: 'dsc-vendor-runtime-registry-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_profile';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeRegistrySection[];
  transitive_seal: {
    policy: 'runtime_profile_contents_sealed_via_runtime_profile_digest';
    sealed_via: typeof VENDOR_RUNTIME_PROFILE_ID;
    sealed_component_count: number;
    re_lists_runtime_profile_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeRegistryManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeRegistryManifest {
  manifest_id: 'dsc-vendor-runtime-registry-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeRegistryManifestEntry[];
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  runtime_registry_digest: string;
  runtime_registry_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_profile_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeRegistry {
  vendor_runtime_registry_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_REGISTRY_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_registry';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_REGISTRY_V1';
  runtime_registry_id: typeof VENDOR_RUNTIME_REGISTRY_ID;
  runtime_registry_version: typeof VENDOR_RUNTIME_REGISTRY_VERSION;
  runtime_registry_kind: 'vendor_runtime_registry';
  runtime_profile_ref: string;
  runtime_profile_schema_ref: string;
  runtime_profile_registry_ref: string;
  runtime_profile_evidence_ref: string;
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
  runtime_registry_schema: VendorRuntimeRegistrySchema;
  deterministic_runtime_registry_identity: DeterministicRuntimeRegistryIdentity;
  vendor_runtime_profile_binding: VendorRuntimeProfileBinding;
  runtime_registry_composition: RuntimeRegistryComposition;
  runtime_registry_manifest: RuntimeRegistryManifest;
  registered_runtime_entries: {
    count: 0;
    entries: [];
    registration_policy: string;
    registers_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_registry_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_profile: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    registers_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime registry.
 * Reuses the PHASE-083 Vendor Runtime Profile by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime registry artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeRegistry(
  projectRoot?: string
): { vendorRuntimeRegistry: DirectSpatialConditioningVendorRuntimeRegistry } {
  const root = resolveProjectRoot(projectRoot);

  // Gate on the recorded PHASE-083 verdict: the runtime profile must have passed.
  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_PROFILE_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-083 vendor runtime profile did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_PROFILE_VERDICT) {
    throw new Error(
      `PHASE-083 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_PROFILE_PHASE) {
    throw new Error('PHASE-083 evidence does not cover the vendor runtime profile');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-083 evidence reports outstanding errors');
  }

  const runtimeProfile = readJson<DirectSpatialConditioningVendorRuntimeProfile>(
    root,
    VENDOR_RUNTIME_PROFILE_PATH
  );
  if (
    runtimeProfile.phase !== DSC_VENDOR_RUNTIME_PROFILE_PHASE ||
    runtimeProfile.system_id !== DSC_VENDOR_RUNTIME_PROFILE_SYSTEM_ID
  ) {
    throw new Error('PHASE-083 vendor runtime profile is missing or incompatible');
  }
  if (runtimeProfile.runtime_profile_id !== VENDOR_RUNTIME_PROFILE_ID) {
    throw new Error('Vendor runtime profile identity drifted');
  }
  if (runtimeProfile.runtime_profile_version !== VENDOR_RUNTIME_PROFILE_VERSION) {
    throw new Error('Vendor runtime profile version drifted');
  }
  if (!runtimeProfile.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime profile must remain vendor neutral');
  }
  if (!runtimeProfile.design_constraints.reuses_certified_vendor_runtime_bundle) {
    throw new Error(
      'Vendor runtime profile must reuse the certified vendor runtime bundle'
    );
  }
  if (runtimeProfile.profiled_runtime_vendors.count !== 0) {
    throw new Error('PHASE-083 must not have profiled runtime vendors');
  }
  if (runtimeProfile.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-083 must not declare runtime execution');
  }
  if (
    JSON.stringify(runtimeProfile.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime profile channels do not match foundation channels');
  }
  if (JSON.stringify(runtimeProfile.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
    throw new Error(
      'Vendor runtime profile sources_supported drifted from the certified corpus'
    );
  }
  if (runtimeProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime profile spatial frame drifted');
  }
  if (
    runtimeProfile.capability_set_id !== CAPABILITY_SET_ID ||
    runtimeProfile.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime profile capability set identity drifted');
  }

  // Re-seal the runtime profile transitively.
  const runtimeProfileManifest = runtimeProfile.runtime_profile_manifest;
  for (const entry of runtimeProfileManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed runtime profile section missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed runtime profile section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const surfaceIds =
    runtimeProfile.runtime_profile_composition.capability_profile.surfaces.map(
      (surface) => surface.surface_id
    );
  const recomputedRuntimeProfileDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeProfileManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `surfaces:${surfaceIds.join(',')}`,
        `sealed_runtime_bundle:${runtimeProfileManifest.sealed_runtime_bundle_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (recomputedRuntimeProfileDigest !== runtimeProfileManifest.runtime_profile_digest) {
    throw new Error('sealed runtime profile digest drifted from the runtime profile manifest');
  }
  const sealedComponentCount = runtimeProfileManifest.sealed_component_count;

  for (const spec of RUNTIME_REGISTRY_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime registry section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_REGISTRY_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime registry section id');
  }
  const sectionRefs = RUNTIME_REGISTRY_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime registry section artifact ref');
  }

  const runtime_registry_schema: VendorRuntimeRegistrySchema = {
    schema_id: 'dsc-vendor-runtime-registry-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime registry. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime registry binds one Vendor Runtime Profile as its root, seals the profile together with its schema and provenance registry, and seals the profile contents transitively through the runtime profile digest. It registers no concrete runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_registry_id_policy: 'opaque_runtime_registry_id_no_vendor_binding',
    runtime_profile_ref: VENDOR_RUNTIME_PROFILE_ID,
    required_fields: [
      {
        field: 'runtime_registry_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_registry_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime registry version string',
      },
      {
        field: 'runtime_registry_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_registry',
      },
      {
        field: 'runtime_profile_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime profile ${VENDOR_RUNTIME_PROFILE_ID}`,
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
        field: 'deterministic_runtime_registry_identity',
        type: 'dsc-vendor-runtime-registry-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_profile_binding',
        type: 'dsc-vendor-runtime-registry-profile-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Profile as the runtime registry root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_registry_composition',
        type: 'dsc-vendor-runtime-registry-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime profile, schema, and provenance registry sections; vendor-specific sections forbidden and profile contents never re-listed',
      },
      {
        field: 'runtime_registry_manifest',
        type: 'dsc-vendor-runtime-registry-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime profile digest and a runtime registry digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_registry_identity: DeterministicRuntimeRegistryIdentity = {
    identity_id: 'dsc-vendor-runtime-registry-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime registry. The runtime_registry_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_registry_id: VENDOR_RUNTIME_REGISTRY_ID,
    runtime_registry_version: VENDOR_RUNTIME_REGISTRY_VERSION,
    identity_policy: 'opaque_runtime_registry_id_no_vendor_binding',
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

  const vendor_runtime_profile_binding: VendorRuntimeProfileBinding = {
    binding_id: 'dsc-vendor-runtime-registry-profile-binding-v1',
    description:
      'Exact binding of the PHASE-083 Vendor Runtime Profile as the runtime registry root. The binding is gated at build time on the recorded PHASE-083 PASS verdict, and re-seals every runtime profile section and the runtime profile digest before the runtime registry is emitted.',
    runtime_profile_ref: VENDOR_RUNTIME_PROFILE_PATH,
    runtime_profile_id: VENDOR_RUNTIME_PROFILE_ID,
    runtime_profile_version: VENDOR_RUNTIME_PROFILE_VERSION,
    runtime_profile_phase: DSC_VENDOR_RUNTIME_PROFILE_PHASE,
    runtime_profile_system_id: DSC_VENDOR_RUNTIME_PROFILE_SYSTEM_ID,
    runtime_profile_evidence_ref: VENDOR_RUNTIME_PROFILE_EVIDENCE_PATH,
    runtime_profile_verdict: VENDOR_RUNTIME_PROFILE_VERDICT,
    runtime_profile_evidence_mode: 'phase_083_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_registry_root',
    sealed_runtime_profile_digest: runtimeProfileManifest.runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    registers_runtime_in_this_phase: false,
    implements_runtime_profile_in_this_phase: false,
  };

  const runtime_registry_composition: RuntimeRegistryComposition = {
    composition_id: 'dsc-vendor-runtime-registry-composition-v1',
    description:
      'Closed, fixed-order composition of the registration envelope around the Vendor Runtime Profile: the runtime profile artifact, its shape contract, and its provenance registry. The runtime profile contents (and everything sealed beneath them) are sealed transitively through the runtime profile digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_profile',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_REGISTRY_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_profile_contents_sealed_via_runtime_profile_digest',
      sealed_via: VENDOR_RUNTIME_PROFILE_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_profile_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeRegistryManifestEntry[] = RUNTIME_REGISTRY_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_registry_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_profile:${runtimeProfileManifest.runtime_profile_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_registry_manifest: RuntimeRegistryManifest = {
    manifest_id: 'dsc-vendor-runtime-registry-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime registry section. Digests are computed read-only from disk. The sealed runtime profile digest carries the profile contents (and everything sealed beneath them) transitively, and the runtime registry digest is the SHA256 of the ordered section digests and the sealed runtime profile digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_profile_digest: runtimeProfileManifest.runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_registry_digest,
    runtime_registry_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_profile_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeRegistry: DirectSpatialConditioningVendorRuntimeRegistry = {
    vendor_runtime_registry_id: 'direct-spatial-conditioning-vendor-runtime-registry-v1',
    phase: DSC_VENDOR_RUNTIME_REGISTRY_PHASE,
    system_id: DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_registry',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_REGISTRY_V1',
    runtime_registry_id: VENDOR_RUNTIME_REGISTRY_ID,
    runtime_registry_version: VENDOR_RUNTIME_REGISTRY_VERSION,
    runtime_registry_kind: 'vendor_runtime_registry',
    runtime_profile_ref: VENDOR_RUNTIME_PROFILE_PATH,
    runtime_profile_schema_ref: VENDOR_RUNTIME_PROFILE_SCHEMA_PATH,
    runtime_profile_registry_ref: VENDOR_RUNTIME_PROFILE_REGISTRY_PATH,
    runtime_profile_evidence_ref: VENDOR_RUNTIME_PROFILE_EVIDENCE_PATH,
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
    runtime_registry_schema,
    deterministic_runtime_registry_identity,
    vendor_runtime_profile_binding,
    runtime_registry_composition,
    runtime_registry_manifest,
    registered_runtime_entries: {
      count: 0,
      entries: [],
      registration_policy:
        'concrete vendor runtimes may be registered against this runtime registry only in a future implementation phase; none are registered here',
      registers_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_registry_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_profile: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      registers_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_REGISTRY_PATH, vendorRuntimeRegistry);
  return { vendorRuntimeRegistry };
}
