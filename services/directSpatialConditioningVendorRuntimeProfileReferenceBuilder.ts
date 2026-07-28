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
  DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_REGISTRY_ID,
  VENDOR_RUNTIME_PROFILE_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_REGISTRY_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_REGISTRY_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_REGISTRY_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileRegistry,
} from './directSpatialConditioningVendorRuntimeProfileRegistryBuilder.js';

/**
 * PHASE-DSC-115: Direct Spatial Conditioning vendor runtime profile reference.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Describes the PHASE-DSC-113 Vendor
 * Runtime Profile Registry as the sole design-time publication root:
 *   - runtime profile reference schema,
 *   - deterministic runtime profile reference identity,
 *   - Vendor Runtime Profile Registry binding,
 *   - runtime profile reference composition, and
 *   - runtime profile reference manifest.
 *
 * The profile reference seals three design sections directly (runtime profile registry
 * artifact, schema, implementation registry) and seals everything the profile registry
 * owns transitively through the runtime profile registry digest. It defines
 * no concrete profile reference runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_PROFILE_REFERENCE_PHASE = 'PHASE-DSC-115' as const;
export const DSC_VENDOR_RUNTIME_PROFILE_REFERENCE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_REFERENCE_V1' as const;

export const VENDOR_RUNTIME_PROFILE_REFERENCE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_PROFILE_REFERENCE_PATH =
  `${VENDOR_RUNTIME_PROFILE_REFERENCE_ROOT}/direct-spatial-conditioning-vendor-runtime-profile-reference-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime profile reference. */
export const VENDOR_RUNTIME_PROFILE_REFERENCE_ID =
  'dsc-vendor-runtime-profile-reference-v1' as const;

export const VENDOR_RUNTIME_PROFILE_REFERENCE_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-DSC-113 vendor runtime profile registry. */
export const VENDOR_RUNTIME_PROFILE_REGISTRY_EVIDENCE_PATH =
  VENDOR_RUNTIME_PROFILE_REGISTRY_VALIDATION_REPORT_PATH;

export const VENDOR_RUNTIME_PROFILE_REGISTRY_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_REGISTRY_V1' as const;

export const VENDOR_RUNTIME_PROFILE_REFERENCE_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-reference.schema.json' as const;
export const VENDOR_RUNTIME_PROFILE_REFERENCE_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-reference-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_PROFILE_REFERENCE_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_REFERENCE_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime profile reference sections. Only the profile reference's own
 * design-time publication set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_PROFILE_REFERENCE_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_profile_registry_artifact'
    | 'runtime_profile_registry_schema'
    | 'runtime_profile_registry_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_profile_registry',
    role: 'runtime_profile_reference_root_profile_registry',
    kind: 'runtime_profile_registry_artifact',
    artifact_ref: VENDOR_RUNTIME_PROFILE_REGISTRY_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_registry_schema',
    role: 'runtime_profile_registry_shape_contract',
    kind: 'runtime_profile_registry_schema',
    artifact_ref: VENDOR_RUNTIME_PROFILE_REGISTRY_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_registry_implementation_registry',
    role: 'runtime_profile_registry_provenance_registry',
    kind: 'runtime_profile_registry_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_PROFILE_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeProfileReferenceSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeProfileReferenceSchema {
  schema_id: 'dsc-vendor-runtime-profile-reference-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_profile_reference_id_policy: 'opaque_runtime_profile_reference_id_no_vendor_binding';
  runtime_profile_registry_ref: typeof VENDOR_RUNTIME_PROFILE_REGISTRY_ID;
  required_fields: RuntimeProfileReferenceSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeProfileReferenceIdentity {
  identity_id: 'dsc-vendor-runtime-profile-reference-deterministic-identity-v1';
  description: string;
  runtime_profile_reference_id: typeof VENDOR_RUNTIME_PROFILE_REFERENCE_ID;
  runtime_profile_reference_version: typeof VENDOR_RUNTIME_PROFILE_REFERENCE_VERSION;
  identity_policy: 'opaque_runtime_profile_reference_id_no_vendor_binding';
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

export interface VendorRuntimeProfileRegistryBinding {
  binding_id: 'dsc-vendor-runtime-profile-reference-profile-registry-binding-v1';
  description: string;
  runtime_profile_registry_ref: string;
  runtime_profile_registry_id: typeof VENDOR_RUNTIME_PROFILE_REGISTRY_ID;
  runtime_profile_registry_version: typeof VENDOR_RUNTIME_PROFILE_REGISTRY_VERSION;
  runtime_profile_registry_phase: typeof DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_PHASE;
  runtime_profile_registry_system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_SYSTEM_ID;
  runtime_profile_registry_evidence_ref: string;
  runtime_profile_registry_verdict: typeof VENDOR_RUNTIME_PROFILE_REGISTRY_VERDICT;
  runtime_profile_registry_evidence_mode: 'phase_113_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_profile_reference_root';
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
  references_profile_registry_in_this_phase: false;
  implements_runtime_profile_registry_in_this_phase: false;
}

export interface RuntimeProfileReferenceSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeProfileReferenceComposition {
  composition_id: 'dsc-vendor-runtime-profile-reference-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_profile_registry';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeProfileReferenceSection[];
  transitive_seal: {
    policy: 'runtime_profile_registry_contents_sealed_via_runtime_profile_registry_digest';
    sealed_via: typeof VENDOR_RUNTIME_PROFILE_REGISTRY_ID;
    sealed_component_count: number;
    re_lists_runtime_profile_registry_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeProfileReferenceManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeProfileReferenceManifest {
  manifest_id: 'dsc-vendor-runtime-profile-reference-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeProfileReferenceManifestEntry[];
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
  runtime_profile_reference_digest: string;
  runtime_profile_reference_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_profile_registry_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeProfileReference {
  vendor_runtime_profile_reference_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_PROFILE_REFERENCE_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_REFERENCE_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_profile_reference';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_REFERENCE_V1';
  runtime_profile_reference_id: typeof VENDOR_RUNTIME_PROFILE_REFERENCE_ID;
  runtime_profile_reference_version: typeof VENDOR_RUNTIME_PROFILE_REFERENCE_VERSION;
  runtime_profile_reference_kind: 'vendor_runtime_profile_reference';
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
  runtime_profile_reference_schema: VendorRuntimeProfileReferenceSchema;
  deterministic_runtime_profile_reference_identity: DeterministicRuntimeProfileReferenceIdentity;
  vendor_runtime_profile_registry_binding: VendorRuntimeProfileRegistryBinding;
  runtime_profile_reference_composition: RuntimeProfileReferenceComposition;
  runtime_profile_reference_manifest: RuntimeProfileReferenceManifest;
  profile_reference_runtime_entries: {
    count: 0;
    entries: [];
    referencing_policy: string;
    references_profile_registry_in_this_phase: false;
  };
  design_constraints: {
    runtime_profile_reference_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_profile_registry: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    references_profile_registry_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime profile reference.
 * Reuses the PHASE-DSC-113 Vendor Runtime Profile Registry by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime profile reference artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeProfileReference(
  projectRoot?: string
): { vendorRuntimeProfileReference: DirectSpatialConditioningVendorRuntimeProfileReference } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_PROFILE_REGISTRY_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-DSC-113 vendor runtime profile registry did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_PROFILE_REGISTRY_VERDICT) {
    throw new Error(
      `PHASE-DSC-113 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_PHASE) {
    throw new Error('PHASE-DSC-113 evidence does not cover the vendor runtime profile registry');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-DSC-113 evidence reports outstanding errors');
  }

  const vendorRuntimeProfileRegistry =
    readJson<DirectSpatialConditioningVendorRuntimeProfileRegistry>(
      root,
      VENDOR_RUNTIME_PROFILE_REGISTRY_PATH
    );
  if (
    vendorRuntimeProfileRegistry.phase !== DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_PHASE ||
    vendorRuntimeProfileRegistry.system_id !== DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_SYSTEM_ID
  ) {
    throw new Error('PHASE-DSC-113 vendor runtime profile registry is missing or incompatible');
  }
  if (
    vendorRuntimeProfileRegistry.runtime_profile_registry_id !==
    VENDOR_RUNTIME_PROFILE_REGISTRY_ID
  ) {
    throw new Error('Vendor runtime profile registry identity drifted');
  }
  if (
    vendorRuntimeProfileRegistry.runtime_profile_registry_version !==
    VENDOR_RUNTIME_PROFILE_REGISTRY_VERSION
  ) {
    throw new Error('Vendor runtime profile registry version drifted');
  }
  if (!vendorRuntimeProfileRegistry.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime profile registry must remain vendor neutral');
  }
  if (
    !vendorRuntimeProfileRegistry.design_constraints.reuses_certified_vendor_runtime_profile_catalog
  ) {
    throw new Error(
      'Vendor runtime profile registry must reuse the certified vendor runtime profile index'
    );
  }
  if (vendorRuntimeProfileRegistry.profile_registry_runtime_entries.count !== 0) {
    throw new Error('PHASE-DSC-113 must not have assembled profile registry runtime entries');
  }
  if (vendorRuntimeProfileRegistry.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-DSC-113 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeProfileRegistry.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime profile registry channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeProfileRegistry.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime profile registry sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeProfileRegistry.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime profile registry spatial frame drifted');
  }
  if (
    vendorRuntimeProfileRegistry.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeProfileRegistry.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime profile registry capability set identity drifted');
  }

  const runtimeProfileRegistryManifestUpstream =
    vendorRuntimeProfileRegistry.runtime_profile_registry_manifest;
  for (const entry of runtimeProfileRegistryManifestUpstream.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(
        `sealed runtime profile registry section missing on disk: ${entry.artifact_ref}`
      );
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(
        `sealed runtime profile registry section digest drifted: ${entry.artifact_ref}`
      );
    }
  }
  const recomputedRuntimeProfileRegistryDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeProfileRegistryManifestUpstream.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_profile_catalog:${runtimeProfileRegistryManifestUpstream.sealed_runtime_profile_catalog_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeProfileRegistryDigest !==
    runtimeProfileRegistryManifestUpstream.runtime_profile_registry_digest
  ) {
    throw new Error(
      'sealed runtime profile registry digest drifted from the runtime profile registry manifest'
    );
  }
  const sealedComponentCount = runtimeProfileRegistryManifestUpstream.sealed_component_count;

  for (const spec of RUNTIME_PROFILE_REFERENCE_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime profile registry section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_PROFILE_REFERENCE_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime profile registry section id');
  }
  const sectionRefs = RUNTIME_PROFILE_REFERENCE_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime profile registry section artifact ref');
  }

  const runtime_profile_reference_schema: VendorRuntimeProfileReferenceSchema = {
    schema_id: 'dsc-vendor-runtime-profile-reference-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime profile reference. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime profile reference binds one Vendor Runtime Profile Registry as its root, seals the profile registry together with its schema and implementation registry, and seals the profile registry contents transitively through the runtime profile registry digest. It defines no concrete profile reference runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_profile_reference_id_policy: 'opaque_runtime_profile_reference_id_no_vendor_binding',
    runtime_profile_registry_ref: VENDOR_RUNTIME_PROFILE_REGISTRY_ID,
    required_fields: [
      {
        field: 'runtime_profile_reference_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_profile_reference_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime profile reference version string',
      },
      {
        field: 'runtime_profile_reference_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_profile_reference',
      },
      {
        field: 'runtime_profile_registry_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime profile registry ${VENDOR_RUNTIME_PROFILE_REGISTRY_ID}`,
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
        field: 'deterministic_runtime_profile_reference_identity',
        type: 'dsc-vendor-runtime-profile-reference-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_profile_registry_binding',
        type: 'dsc-vendor-runtime-profile-reference-profile-registry-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Profile Registry as the runtime profile reference root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_profile_reference_composition',
        type: 'dsc-vendor-runtime-profile-reference-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime profile registry artifact, schema, and implementation registry sections; vendor-specific sections forbidden and profile registry contents never re-listed',
      },
      {
        field: 'runtime_profile_reference_manifest',
        type: 'dsc-vendor-runtime-profile-reference-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime profile registry digest and a runtime profile reference digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_profile_reference_identity: DeterministicRuntimeProfileReferenceIdentity = {
    identity_id: 'dsc-vendor-runtime-profile-reference-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime profile reference. The runtime_profile_reference_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_profile_reference_id: VENDOR_RUNTIME_PROFILE_REFERENCE_ID,
    runtime_profile_reference_version: VENDOR_RUNTIME_PROFILE_REFERENCE_VERSION,
    identity_policy: 'opaque_runtime_profile_reference_id_no_vendor_binding',
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

  const vendor_runtime_profile_registry_binding: VendorRuntimeProfileRegistryBinding = {
    binding_id: 'dsc-vendor-runtime-profile-reference-profile-registry-binding-v1',
    description:
      'Exact binding of the PHASE-DSC-113 Vendor Runtime Profile Registry as the runtime profile reference root. The binding is gated at build time on the recorded PHASE-DSC-113 PASS verdict, and re-seals every runtime profile registry section and the runtime profile registry digest before the runtime profile reference is emitted.',
    runtime_profile_registry_ref: VENDOR_RUNTIME_PROFILE_REGISTRY_PATH,
    runtime_profile_registry_id: VENDOR_RUNTIME_PROFILE_REGISTRY_ID,
    runtime_profile_registry_version: VENDOR_RUNTIME_PROFILE_REGISTRY_VERSION,
    runtime_profile_registry_phase: DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_PHASE,
    runtime_profile_registry_system_id: DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_SYSTEM_ID,
    runtime_profile_registry_evidence_ref: VENDOR_RUNTIME_PROFILE_REGISTRY_EVIDENCE_PATH,
    runtime_profile_registry_verdict: VENDOR_RUNTIME_PROFILE_REGISTRY_VERDICT,
    runtime_profile_registry_evidence_mode: 'phase_113_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_profile_reference_root',
    sealed_runtime_profile_registry_digest:
      runtimeProfileRegistryManifestUpstream.runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    references_profile_registry_in_this_phase: false,
    implements_runtime_profile_registry_in_this_phase: false,
  };

  const runtime_profile_reference_composition: RuntimeProfileReferenceComposition = {
    composition_id: 'dsc-vendor-runtime-profile-reference-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Profile Registry: the runtime profile registry artifact, its shape contract, and its implementation registry. The runtime profile registry contents (and everything sealed beneath them) are sealed transitively through the runtime profile registry digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_profile_registry',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_PROFILE_REFERENCE_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_profile_registry_contents_sealed_via_runtime_profile_registry_digest',
      sealed_via: VENDOR_RUNTIME_PROFILE_REGISTRY_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_profile_registry_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeProfileReferenceManifestEntry[] = RUNTIME_PROFILE_REFERENCE_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_profile_reference_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_profile_registry:${runtimeProfileRegistryManifestUpstream.runtime_profile_registry_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_profile_reference_manifest: RuntimeProfileReferenceManifest = {
    manifest_id: 'dsc-vendor-runtime-profile-reference-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime profile reference section. Digests are computed read-only from disk. The sealed runtime profile registry digest carries the profile registry contents (and everything sealed beneath them) transitively, and the runtime profile reference digest is the SHA256 of the ordered section digests and the sealed runtime profile registry digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_profile_registry_digest:
      runtimeProfileRegistryManifestUpstream.runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileRegistryManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileRegistryManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_profile_reference_digest,
    runtime_profile_reference_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_profile_registry_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeProfileReference: DirectSpatialConditioningVendorRuntimeProfileReference = {
    vendor_runtime_profile_reference_id:
      'direct-spatial-conditioning-vendor-runtime-profile-reference-v1',
    phase: DSC_VENDOR_RUNTIME_PROFILE_REFERENCE_PHASE,
    system_id: DSC_VENDOR_RUNTIME_PROFILE_REFERENCE_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_profile_reference',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_REFERENCE_V1',
    runtime_profile_reference_id: VENDOR_RUNTIME_PROFILE_REFERENCE_ID,
    runtime_profile_reference_version: VENDOR_RUNTIME_PROFILE_REFERENCE_VERSION,
    runtime_profile_reference_kind: 'vendor_runtime_profile_reference',
    runtime_profile_registry_ref: VENDOR_RUNTIME_PROFILE_REGISTRY_PATH,
    runtime_profile_registry_schema_ref: VENDOR_RUNTIME_PROFILE_REGISTRY_SCHEMA_PATH,
    runtime_profile_registry_implementation_registry_ref:
      VENDOR_RUNTIME_PROFILE_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_registry_evidence_ref: VENDOR_RUNTIME_PROFILE_REGISTRY_EVIDENCE_PATH,
    runtime_profile_catalog_ref: vendorRuntimeProfileRegistry.runtime_profile_catalog_ref,
    runtime_profile_catalog_schema_ref: vendorRuntimeProfileRegistry.runtime_profile_catalog_schema_ref,
    runtime_profile_catalog_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_profile_catalog_implementation_registry_ref,
    runtime_profile_catalog_evidence_ref: vendorRuntimeProfileRegistry.runtime_profile_catalog_evidence_ref,
    runtime_profile_index_ref: vendorRuntimeProfileRegistry.runtime_profile_index_ref,
    runtime_profile_index_schema_ref: vendorRuntimeProfileRegistry.runtime_profile_index_schema_ref,
    runtime_profile_index_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_profile_index_implementation_registry_ref,
    runtime_profile_index_evidence_ref: vendorRuntimeProfileRegistry.runtime_profile_index_evidence_ref,
    runtime_profile_collection_ref: vendorRuntimeProfileRegistry.runtime_profile_collection_ref,
    runtime_profile_collection_schema_ref:
      vendorRuntimeProfileRegistry.runtime_profile_collection_schema_ref,
    runtime_profile_collection_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_profile_collection_implementation_registry_ref,
    runtime_profile_collection_evidence_ref:
      vendorRuntimeProfileRegistry.runtime_profile_collection_evidence_ref,
    runtime_profile_set_ref: vendorRuntimeProfileRegistry.runtime_profile_set_ref,
    runtime_profile_set_schema_ref: vendorRuntimeProfileRegistry.runtime_profile_set_schema_ref,
    runtime_profile_set_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_profile_set_implementation_registry_ref,
    runtime_profile_set_evidence_ref: vendorRuntimeProfileRegistry.runtime_profile_set_evidence_ref,
    runtime_blueprint_ref: vendorRuntimeProfileRegistry.runtime_blueprint_ref,
    runtime_blueprint_schema_ref: vendorRuntimeProfileRegistry.runtime_blueprint_schema_ref,
    runtime_blueprint_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_blueprint_implementation_registry_ref,
    runtime_blueprint_evidence_ref: vendorRuntimeProfileRegistry.runtime_blueprint_evidence_ref,
    runtime_definition_ref: vendorRuntimeProfileRegistry.runtime_definition_ref,
    runtime_definition_schema_ref: vendorRuntimeProfileRegistry.runtime_definition_schema_ref,
    runtime_definition_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_definition_implementation_registry_ref,
    runtime_definition_evidence_ref: vendorRuntimeProfileRegistry.runtime_definition_evidence_ref,
    runtime_descriptor_ref: vendorRuntimeProfileRegistry.runtime_descriptor_ref,
    runtime_descriptor_schema_ref: vendorRuntimeProfileRegistry.runtime_descriptor_schema_ref,
    runtime_descriptor_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_descriptor_implementation_registry_ref,
    runtime_descriptor_evidence_ref: vendorRuntimeProfileRegistry.runtime_descriptor_evidence_ref,
    runtime_contract_ref: vendorRuntimeProfileRegistry.runtime_contract_ref,
    runtime_contract_schema_ref: vendorRuntimeProfileRegistry.runtime_contract_schema_ref,
    runtime_contract_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_contract_implementation_registry_ref,
    runtime_contract_evidence_ref: vendorRuntimeProfileRegistry.runtime_contract_evidence_ref,
    runtime_specification_ref: vendorRuntimeProfileRegistry.runtime_specification_ref,
    runtime_specification_schema_ref:
      vendorRuntimeProfileRegistry.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref:
      vendorRuntimeProfileRegistry.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeProfileRegistry.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeProfileRegistry.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeProfileRegistry.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeProfileRegistry.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeProfileRegistry.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeProfileRegistry.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeProfileRegistry.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeProfileRegistry.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeProfileRegistry.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeProfileRegistry.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeProfileRegistry.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeProfileRegistry.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeProfileRegistry.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeProfileRegistry.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeProfileRegistry.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeProfileRegistry.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeProfileRegistry.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeProfileRegistry.reference_bundle_ref,
    package_ref: vendorRuntimeProfileRegistry.package_ref,
    template_ref: vendorRuntimeProfileRegistry.template_ref,
    template_certification_ref: vendorRuntimeProfileRegistry.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeProfileRegistry.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_profile_reference_schema,
    deterministic_runtime_profile_reference_identity,
    vendor_runtime_profile_registry_binding,
    runtime_profile_reference_composition,
    runtime_profile_reference_manifest,
    profile_reference_runtime_entries: {
      count: 0,
      entries: [],
      referencing_policy:
        'concrete vendor runtime profile reference entries may be registered into this profile reference only in a future implementation phase; none are registered here',
      references_profile_registry_in_this_phase: false,
    },
    design_constraints: {
      runtime_profile_reference_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_profile_registry: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      references_profile_registry_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_PROFILE_REFERENCE_PATH, vendorRuntimeProfileReference);
  return { vendorRuntimeProfileReference };
}
