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
import {
  DSC_VENDOR_RUNTIME_REGISTRY_PHASE,
  DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID,
  VENDOR_RUNTIME_REGISTRY_ID,
  VENDOR_RUNTIME_REGISTRY_PATH,
  VENDOR_RUNTIME_REGISTRY_VERSION,
  type DirectSpatialConditioningVendorRuntimeRegistry,
} from './directSpatialConditioningVendorRuntimeRegistryBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-087: Direct Spatial Conditioning vendor runtime index.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Indexes the PHASE-085 Vendor
 * Runtime Registry as the sole design-time lookup root:
 *   - runtime index schema,
 *   - deterministic runtime index identity,
 *   - Vendor Runtime Registry binding,
 *   - runtime index composition, and
 *   - runtime index manifest.
 *
 * The index seals three design sections directly (runtime registry, schema,
 * implementation registry) and seals everything the runtime registry owns
 * transitively through the runtime registry digest, so it never re-lists what
 * the registry already owns. It indexes no concrete runtime, implements no
 * vendor, declares no runtime execution, performs no GPU or inference work,
 * and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_INDEX_PHASE = 'PHASE-DSC-087' as const;
export const DSC_VENDOR_RUNTIME_INDEX_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_INDEX_V1' as const;

export const VENDOR_RUNTIME_INDEX_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_INDEX_PATH =
  `${VENDOR_RUNTIME_INDEX_ROOT}/direct-spatial-conditioning-vendor-runtime-index-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime index. */
export const VENDOR_RUNTIME_INDEX_ID = 'dsc-vendor-runtime-index-v1' as const;
export const VENDOR_RUNTIME_INDEX_VERSION = '1.0' as const;

/** Design-time contract set of the passing PHASE-085 runtime registry. */
export const VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-registry.schema.json' as const;
export const VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-registry-implementation-registry-v1.json' as const;
export const VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_REGISTRY_VALIDATION_REPORT.json' as const;

export const VENDOR_RUNTIME_REGISTRY_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_REGISTRY_V1' as const;

/**
 * Ordered runtime index sections. Only the runtime registry's own design-time
 * contract set is sealed directly; everything it owns is sealed transitively.
 */
export const RUNTIME_INDEX_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_registry_artifact'
    | 'runtime_registry_schema'
    | 'runtime_registry_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_registry',
    role: 'runtime_index_root_registry',
    kind: 'runtime_registry_artifact',
    artifact_ref: VENDOR_RUNTIME_REGISTRY_PATH,
  },
  {
    section_id: 'vendor_runtime_registry_schema',
    role: 'runtime_registry_shape_contract',
    kind: 'runtime_registry_schema',
    artifact_ref: VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_registry_implementation_registry',
    role: 'runtime_registry_provenance_registry',
    kind: 'runtime_registry_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeIndexSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeIndexSchema {
  schema_id: 'dsc-vendor-runtime-index-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_index_id_policy: 'opaque_runtime_index_id_no_vendor_binding';
  runtime_registry_ref: typeof VENDOR_RUNTIME_REGISTRY_ID;
  required_fields: RuntimeIndexSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeIndexIdentity {
  identity_id: 'dsc-vendor-runtime-index-deterministic-identity-v1';
  description: string;
  runtime_index_id: typeof VENDOR_RUNTIME_INDEX_ID;
  runtime_index_version: typeof VENDOR_RUNTIME_INDEX_VERSION;
  identity_policy: 'opaque_runtime_index_id_no_vendor_binding';
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

export interface VendorRuntimeRegistryBinding {
  binding_id: 'dsc-vendor-runtime-index-registry-binding-v1';
  description: string;
  runtime_registry_ref: string;
  runtime_registry_id: typeof VENDOR_RUNTIME_REGISTRY_ID;
  runtime_registry_version: typeof VENDOR_RUNTIME_REGISTRY_VERSION;
  runtime_registry_phase: typeof DSC_VENDOR_RUNTIME_REGISTRY_PHASE;
  runtime_registry_system_id: typeof DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID;
  runtime_registry_evidence_ref: string;
  runtime_registry_verdict: typeof VENDOR_RUNTIME_REGISTRY_VERDICT;
  runtime_registry_evidence_mode: 'phase_085_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_index_root';
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  indexes_runtime_in_this_phase: false;
  implements_runtime_registry_in_this_phase: false;
}

export interface RuntimeIndexSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeIndexComposition {
  composition_id: 'dsc-vendor-runtime-index-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_registry';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeIndexSection[];
  transitive_seal: {
    policy: 'runtime_registry_contents_sealed_via_runtime_registry_digest';
    sealed_via: typeof VENDOR_RUNTIME_REGISTRY_ID;
    sealed_component_count: number;
    re_lists_runtime_registry_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeIndexManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeIndexManifest {
  manifest_id: 'dsc-vendor-runtime-index-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeIndexManifestEntry[];
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  runtime_index_digest: string;
  runtime_index_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_registry_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeIndex {
  vendor_runtime_index_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_INDEX_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_INDEX_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_index';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_INDEX_V1';
  runtime_index_id: typeof VENDOR_RUNTIME_INDEX_ID;
  runtime_index_version: typeof VENDOR_RUNTIME_INDEX_VERSION;
  runtime_index_kind: 'vendor_runtime_index';
  runtime_registry_ref: string;
  runtime_registry_schema_ref: string;
  runtime_registry_implementation_registry_ref: string;
  runtime_registry_evidence_ref: string;
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
  runtime_index_schema: VendorRuntimeIndexSchema;
  deterministic_runtime_index_identity: DeterministicRuntimeIndexIdentity;
  vendor_runtime_registry_binding: VendorRuntimeRegistryBinding;
  runtime_index_composition: RuntimeIndexComposition;
  runtime_index_manifest: RuntimeIndexManifest;
  indexed_runtime_entries: {
    count: 0;
    entries: [];
    indexing_policy: string;
    indexes_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_index_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_registry: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    indexes_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime index.
 * Reuses the PHASE-085 Vendor Runtime Registry by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime index artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeIndex(
  projectRoot?: string
): { vendorRuntimeIndex: DirectSpatialConditioningVendorRuntimeIndex } {
  const root = resolveProjectRoot(projectRoot);

  // Gate on the recorded PHASE-085 verdict: the runtime registry must have passed.
  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-085 vendor runtime registry did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_REGISTRY_VERDICT) {
    throw new Error(
      `PHASE-085 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_REGISTRY_PHASE) {
    throw new Error('PHASE-085 evidence does not cover the vendor runtime registry');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-085 evidence reports outstanding errors');
  }

  const runtimeRegistry = readJson<DirectSpatialConditioningVendorRuntimeRegistry>(
    root,
    VENDOR_RUNTIME_REGISTRY_PATH
  );
  if (
    runtimeRegistry.phase !== DSC_VENDOR_RUNTIME_REGISTRY_PHASE ||
    runtimeRegistry.system_id !== DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID
  ) {
    throw new Error('PHASE-085 vendor runtime registry is missing or incompatible');
  }
  if (runtimeRegistry.runtime_registry_id !== VENDOR_RUNTIME_REGISTRY_ID) {
    throw new Error('Vendor runtime registry identity drifted');
  }
  if (runtimeRegistry.runtime_registry_version !== VENDOR_RUNTIME_REGISTRY_VERSION) {
    throw new Error('Vendor runtime registry version drifted');
  }
  if (!runtimeRegistry.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime registry must remain vendor neutral');
  }
  if (!runtimeRegistry.design_constraints.reuses_certified_vendor_runtime_profile) {
    throw new Error(
      'Vendor runtime registry must reuse the certified vendor runtime profile'
    );
  }
  if (runtimeRegistry.registered_runtime_entries.count !== 0) {
    throw new Error('PHASE-085 must not have registered runtime entries');
  }
  if (runtimeRegistry.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-085 must not declare runtime execution');
  }
  if (
    JSON.stringify(runtimeRegistry.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime registry channels do not match foundation channels');
  }
  if (JSON.stringify(runtimeRegistry.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
    throw new Error(
      'Vendor runtime registry sources_supported drifted from the certified corpus'
    );
  }
  if (runtimeRegistry.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime registry spatial frame drifted');
  }
  if (
    runtimeRegistry.capability_set_id !== CAPABILITY_SET_ID ||
    runtimeRegistry.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime registry capability set identity drifted');
  }

  // Re-seal the runtime registry transitively.
  const runtimeRegistryManifest = runtimeRegistry.runtime_registry_manifest;
  for (const entry of runtimeRegistryManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed runtime registry section missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed runtime registry section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const recomputedRuntimeRegistryDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeRegistryManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_profile:${runtimeRegistryManifest.sealed_runtime_profile_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (recomputedRuntimeRegistryDigest !== runtimeRegistryManifest.runtime_registry_digest) {
    throw new Error(
      'sealed runtime registry digest drifted from the runtime registry manifest'
    );
  }
  const sealedComponentCount = runtimeRegistryManifest.sealed_component_count;

  for (const spec of RUNTIME_INDEX_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime index section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_INDEX_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime index section id');
  }
  const sectionRefs = RUNTIME_INDEX_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime index section artifact ref');
  }

  const runtime_index_schema: VendorRuntimeIndexSchema = {
    schema_id: 'dsc-vendor-runtime-index-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime index. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime index binds one Vendor Runtime Registry as its root, seals the registry together with its schema and implementation registry, and seals the registry contents transitively through the runtime registry digest. It indexes no concrete runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_index_id_policy: 'opaque_runtime_index_id_no_vendor_binding',
    runtime_registry_ref: VENDOR_RUNTIME_REGISTRY_ID,
    required_fields: [
      {
        field: 'runtime_index_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_index_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime index version string',
      },
      {
        field: 'runtime_index_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_index',
      },
      {
        field: 'runtime_registry_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime registry ${VENDOR_RUNTIME_REGISTRY_ID}`,
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
        field: 'deterministic_runtime_index_identity',
        type: 'dsc-vendor-runtime-index-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_registry_binding',
        type: 'dsc-vendor-runtime-index-registry-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Registry as the runtime index root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_index_composition',
        type: 'dsc-vendor-runtime-index-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime registry, schema, and implementation registry sections; vendor-specific sections forbidden and registry contents never re-listed',
      },
      {
        field: 'runtime_index_manifest',
        type: 'dsc-vendor-runtime-index-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime registry digest and a runtime index digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_index_identity: DeterministicRuntimeIndexIdentity = {
    identity_id: 'dsc-vendor-runtime-index-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime index. The runtime_index_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_index_id: VENDOR_RUNTIME_INDEX_ID,
    runtime_index_version: VENDOR_RUNTIME_INDEX_VERSION,
    identity_policy: 'opaque_runtime_index_id_no_vendor_binding',
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

  const vendor_runtime_registry_binding: VendorRuntimeRegistryBinding = {
    binding_id: 'dsc-vendor-runtime-index-registry-binding-v1',
    description:
      'Exact binding of the PHASE-085 Vendor Runtime Registry as the runtime index root. The binding is gated at build time on the recorded PHASE-085 PASS verdict, and re-seals every runtime registry section and the runtime registry digest before the runtime index is emitted.',
    runtime_registry_ref: VENDOR_RUNTIME_REGISTRY_PATH,
    runtime_registry_id: VENDOR_RUNTIME_REGISTRY_ID,
    runtime_registry_version: VENDOR_RUNTIME_REGISTRY_VERSION,
    runtime_registry_phase: DSC_VENDOR_RUNTIME_REGISTRY_PHASE,
    runtime_registry_system_id: DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID,
    runtime_registry_evidence_ref: VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH,
    runtime_registry_verdict: VENDOR_RUNTIME_REGISTRY_VERDICT,
    runtime_registry_evidence_mode: 'phase_085_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_index_root',
    sealed_runtime_registry_digest: runtimeRegistryManifest.runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeRegistryManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeRegistryManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeRegistryManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    indexes_runtime_in_this_phase: false,
    implements_runtime_registry_in_this_phase: false,
  };

  const runtime_index_composition: RuntimeIndexComposition = {
    composition_id: 'dsc-vendor-runtime-index-composition-v1',
    description:
      'Closed, fixed-order composition of the lookup envelope around the Vendor Runtime Registry: the runtime registry artifact, its shape contract, and its implementation registry. The runtime registry contents (and everything sealed beneath them) are sealed transitively through the runtime registry digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_registry',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_INDEX_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_registry_contents_sealed_via_runtime_registry_digest',
      sealed_via: VENDOR_RUNTIME_REGISTRY_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_registry_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeIndexManifestEntry[] = RUNTIME_INDEX_SECTION_SPECS.map((spec) => ({
    section_id: spec.section_id,
    artifact_ref: spec.artifact_ref,
    sha256: sha256(root, spec.artifact_ref),
    bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
    content_addressed: true as const,
  }));

  const runtime_index_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_registry:${runtimeRegistryManifest.runtime_registry_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_index_manifest: RuntimeIndexManifest = {
    manifest_id: 'dsc-vendor-runtime-index-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime index section. Digests are computed read-only from disk. The sealed runtime registry digest carries the registry contents (and everything sealed beneath them) transitively, and the runtime index digest is the SHA256 of the ordered section digests and the sealed runtime registry digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_registry_digest: runtimeRegistryManifest.runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeRegistryManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeRegistryManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeRegistryManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_index_digest,
    runtime_index_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_registry_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeIndex: DirectSpatialConditioningVendorRuntimeIndex = {
    vendor_runtime_index_id: 'direct-spatial-conditioning-vendor-runtime-index-v1',
    phase: DSC_VENDOR_RUNTIME_INDEX_PHASE,
    system_id: DSC_VENDOR_RUNTIME_INDEX_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_index',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_INDEX_V1',
    runtime_index_id: VENDOR_RUNTIME_INDEX_ID,
    runtime_index_version: VENDOR_RUNTIME_INDEX_VERSION,
    runtime_index_kind: 'vendor_runtime_index',
    runtime_registry_ref: VENDOR_RUNTIME_REGISTRY_PATH,
    runtime_registry_schema_ref: VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH,
    runtime_registry_implementation_registry_ref:
      VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
    runtime_registry_evidence_ref: VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH,
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
    runtime_index_schema,
    deterministic_runtime_index_identity,
    vendor_runtime_registry_binding,
    runtime_index_composition,
    runtime_index_manifest,
    indexed_runtime_entries: {
      count: 0,
      entries: [],
      indexing_policy:
        'concrete vendor runtimes may be indexed against this runtime index only in a future implementation phase; none are indexed here',
      indexes_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_index_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_registry: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      indexes_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_INDEX_PATH, vendorRuntimeIndex);
  return { vendorRuntimeIndex };
}
