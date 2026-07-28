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
  DSC_VENDOR_RUNTIME_PROFILE_SET_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_SET_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_SET_ID,
  VENDOR_RUNTIME_PROFILE_SET_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_SET_PATH,
  VENDOR_RUNTIME_PROFILE_SET_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_SET_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_SET_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileSet,
} from './directSpatialConditioningVendorRuntimeProfileSetBuilder.js';

/**
 * PHASE-DSC-107: Direct Spatial Conditioning vendor runtime profile collection.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Describes the PHASE-DSC-105 Vendor
 * Runtime Profile Set as the sole design-time publication root:
 *   - runtime profile collection schema,
 *   - deterministic runtime profile collection identity,
 *   - Vendor Runtime Profile Set binding,
 *   - runtime profile collection composition, and
 *   - runtime profile collection manifest.
 *
 * The profile set seals three design sections directly (runtime profile set
 * artifact, schema, implementation registry) and seals everything the runtime
 * transitively through the runtime profile set digest. It defines
 * no concrete profile collection runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_PROFILE_COLLECTION_PHASE = 'PHASE-DSC-107' as const;
export const DSC_VENDOR_RUNTIME_PROFILE_COLLECTION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_COLLECTION_V1' as const;

export const VENDOR_RUNTIME_PROFILE_COLLECTION_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_PROFILE_COLLECTION_PATH =
  `${VENDOR_RUNTIME_PROFILE_COLLECTION_ROOT}/direct-spatial-conditioning-vendor-runtime-profile-collection-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime profile collection. */
export const VENDOR_RUNTIME_PROFILE_COLLECTION_ID =
  'dsc-vendor-runtime-profile-collection-v1' as const;

export const VENDOR_RUNTIME_PROFILE_COLLECTION_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-DSC-105 vendor runtime profile set. */
export const VENDOR_RUNTIME_PROFILE_SET_EVIDENCE_PATH =
  VENDOR_RUNTIME_PROFILE_SET_VALIDATION_REPORT_PATH;

export const VENDOR_RUNTIME_PROFILE_SET_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_SET_V1' as const;

export const VENDOR_RUNTIME_PROFILE_COLLECTION_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-collection.schema.json' as const;
export const VENDOR_RUNTIME_PROFILE_COLLECTION_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-collection-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_PROFILE_COLLECTION_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_COLLECTION_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime profile set sections. Only the profile set's own
 * design-time publication set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_PROFILE_COLLECTION_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_profile_set_artifact'
    | 'runtime_profile_set_schema'
    | 'runtime_profile_set_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_profile_set',
    role: 'runtime_profile_collection_root_profile_set',
    kind: 'runtime_profile_set_artifact',
    artifact_ref: VENDOR_RUNTIME_PROFILE_SET_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_set_schema',
    role: 'runtime_profile_set_shape_contract',
    kind: 'runtime_profile_set_schema',
    artifact_ref: VENDOR_RUNTIME_PROFILE_SET_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_set_implementation_registry',
    role: 'runtime_profile_set_provenance_registry',
    kind: 'runtime_profile_set_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_PROFILE_SET_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeProfileCollectionSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeProfileCollectionSchema {
  schema_id: 'dsc-vendor-runtime-profile-collection-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_profile_collection_id_policy: 'opaque_runtime_profile_collection_id_no_vendor_binding';
  runtime_profile_set_ref: typeof VENDOR_RUNTIME_PROFILE_SET_ID;
  required_fields: RuntimeProfileCollectionSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeProfileCollectionIdentity {
  identity_id: 'dsc-vendor-runtime-profile-collection-deterministic-identity-v1';
  description: string;
  runtime_profile_collection_id: typeof VENDOR_RUNTIME_PROFILE_COLLECTION_ID;
  runtime_profile_collection_version: typeof VENDOR_RUNTIME_PROFILE_COLLECTION_VERSION;
  identity_policy: 'opaque_runtime_profile_collection_id_no_vendor_binding';
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

export interface VendorRuntimeProfileSetBinding {
  binding_id: 'dsc-vendor-runtime-profile-collection-profile-set-binding-v1';
  description: string;
  runtime_profile_set_ref: string;
  runtime_profile_set_id: typeof VENDOR_RUNTIME_PROFILE_SET_ID;
  runtime_profile_set_version: typeof VENDOR_RUNTIME_PROFILE_SET_VERSION;
  runtime_profile_set_phase: typeof DSC_VENDOR_RUNTIME_PROFILE_SET_PHASE;
  runtime_profile_set_system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_SET_SYSTEM_ID;
  runtime_profile_set_evidence_ref: string;
  runtime_profile_set_verdict: typeof VENDOR_RUNTIME_PROFILE_SET_VERDICT;
  runtime_profile_set_evidence_mode: 'phase_105_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_profile_collection_root';
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
  assembles_profile_collection_in_this_phase: false;
  implements_runtime_profile_set_in_this_phase: false;
}

export interface RuntimeProfileCollectionSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeProfileCollectionComposition {
  composition_id: 'dsc-vendor-runtime-profile-collection-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_profile_set';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeProfileCollectionSection[];
  transitive_seal: {
    policy: 'runtime_profile_set_contents_sealed_via_runtime_profile_set_digest';
    sealed_via: typeof VENDOR_RUNTIME_PROFILE_SET_ID;
    sealed_component_count: number;
    re_lists_runtime_profile_set_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeProfileCollectionManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeProfileCollectionManifest {
  manifest_id: 'dsc-vendor-runtime-profile-collection-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeProfileCollectionManifestEntry[];
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
  runtime_profile_collection_digest: string;
  runtime_profile_collection_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_profile_set_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeProfileCollection {
  vendor_runtime_profile_collection_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_PROFILE_COLLECTION_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_COLLECTION_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_profile_collection';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_COLLECTION_V1';
  runtime_profile_collection_id: typeof VENDOR_RUNTIME_PROFILE_COLLECTION_ID;
  runtime_profile_collection_version: typeof VENDOR_RUNTIME_PROFILE_COLLECTION_VERSION;
  runtime_profile_collection_kind: 'vendor_runtime_profile_collection';
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
  runtime_profile_collection_schema: VendorRuntimeProfileCollectionSchema;
  deterministic_runtime_profile_collection_identity: DeterministicRuntimeProfileCollectionIdentity;
  vendor_runtime_profile_set_binding: VendorRuntimeProfileSetBinding;
  runtime_profile_collection_composition: RuntimeProfileCollectionComposition;
  runtime_profile_collection_manifest: RuntimeProfileCollectionManifest;
  profile_collection_runtime_entries: {
    count: 0;
    entries: [];
    assembly_policy: string;
    assembles_profile_collection_in_this_phase: false;
  };
  design_constraints: {
    runtime_profile_collection_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_profile_set: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    assembles_profile_collection_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime profile collection.
 * Reuses the PHASE-DSC-105 Vendor Runtime Profile Set by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime profile collection artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeProfileCollection(
  projectRoot?: string
): { vendorRuntimeProfileCollection: DirectSpatialConditioningVendorRuntimeProfileCollection } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_PROFILE_SET_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-DSC-105 vendor runtime profile set did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_PROFILE_SET_VERDICT) {
    throw new Error(
      `PHASE-DSC-105 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_PROFILE_SET_PHASE) {
    throw new Error('PHASE-DSC-105 evidence does not cover the vendor runtime profile set');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-DSC-105 evidence reports outstanding errors');
  }

  const vendorRuntimeProfileSet = readJson<DirectSpatialConditioningVendorRuntimeProfileSet>(
    root,
    VENDOR_RUNTIME_PROFILE_SET_PATH
  );
  if (
    vendorRuntimeProfileSet.phase !== DSC_VENDOR_RUNTIME_PROFILE_SET_PHASE ||
    vendorRuntimeProfileSet.system_id !== DSC_VENDOR_RUNTIME_PROFILE_SET_SYSTEM_ID
  ) {
    throw new Error('PHASE-DSC-105 vendor runtime profile set is missing or incompatible');
  }
  if (vendorRuntimeProfileSet.runtime_profile_set_id !== VENDOR_RUNTIME_PROFILE_SET_ID) {
    throw new Error('Vendor runtime profile set identity drifted');
  }
  if (vendorRuntimeProfileSet.runtime_profile_set_version !== VENDOR_RUNTIME_PROFILE_SET_VERSION) {
    throw new Error('Vendor runtime profile set version drifted');
  }
  if (!vendorRuntimeProfileSet.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime profile set must remain vendor neutral');
  }
  if (!vendorRuntimeProfileSet.design_constraints.reuses_certified_vendor_runtime_blueprint) {
    throw new Error(
      'Vendor runtime profile set must reuse the certified vendor runtime blueprint'
    );
  }
  if (vendorRuntimeProfileSet.profile_set_runtime_entries.count !== 0) {
    throw new Error('PHASE-DSC-105 must not have assembled profile set runtime entries');
  }
  if (vendorRuntimeProfileSet.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-DSC-105 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeProfileSet.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime profile set channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeProfileSet.sources_supported) !== JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime profile set sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeProfileSet.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime profile set spatial frame drifted');
  }
  if (
    vendorRuntimeProfileSet.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeProfileSet.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime profile set capability set identity drifted');
  }

  const runtimeProfileSetManifest = vendorRuntimeProfileSet.runtime_profile_set_manifest;
  for (const entry of runtimeProfileSetManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed runtime profile set section missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed runtime profile set section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const recomputedRuntimeProfileSetDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeProfileSetManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_blueprint:${runtimeProfileSetManifest.sealed_runtime_blueprint_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeProfileSetDigest !== runtimeProfileSetManifest.runtime_profile_set_digest
  ) {
    throw new Error(
      'sealed runtime profile set digest drifted from the runtime profile set manifest'
    );
  }
  const sealedComponentCount = runtimeProfileSetManifest.sealed_component_count;

  for (const spec of RUNTIME_PROFILE_COLLECTION_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime profile collection section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_PROFILE_COLLECTION_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime profile collection section id');
  }
  const sectionRefs = RUNTIME_PROFILE_COLLECTION_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime profile collection section artifact ref');
  }

  const runtime_profile_collection_schema: VendorRuntimeProfileCollectionSchema = {
    schema_id: 'dsc-vendor-runtime-profile-collection-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime profile collection. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime profile collection binds one Vendor Runtime Profile Set as its root, seals the profile set together with its schema and implementation registry, and seals the profile set contents transitively through the runtime profile set digest. It defines no concrete profile collection runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_profile_collection_id_policy: 'opaque_runtime_profile_collection_id_no_vendor_binding',
    runtime_profile_set_ref: VENDOR_RUNTIME_PROFILE_SET_ID,
    required_fields: [
      {
        field: 'runtime_profile_collection_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_profile_collection_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime profile collection version string',
      },
      {
        field: 'runtime_profile_collection_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_profile_collection',
      },
      {
        field: 'runtime_profile_set_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime profile set ${VENDOR_RUNTIME_PROFILE_SET_ID}`,
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
        field: 'deterministic_runtime_profile_collection_identity',
        type: 'dsc-vendor-runtime-profile-collection-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_profile_set_binding',
        type: 'dsc-vendor-runtime-profile-collection-profile-set-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Profile Set as the runtime profile collection root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_profile_collection_composition',
        type: 'dsc-vendor-runtime-profile-collection-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime profile set artifact, schema, and implementation registry sections; vendor-specific sections forbidden and profile set contents never re-listed',
      },
      {
        field: 'runtime_profile_collection_manifest',
        type: 'dsc-vendor-runtime-profile-collection-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime profile set digest and a runtime profile collection digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_profile_collection_identity: DeterministicRuntimeProfileCollectionIdentity =
    {
      identity_id: 'dsc-vendor-runtime-profile-collection-deterministic-identity-v1',
      description:
        'Deterministic identity of the vendor runtime profile collection. The runtime_profile_collection_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
      runtime_profile_collection_id: VENDOR_RUNTIME_PROFILE_COLLECTION_ID,
      runtime_profile_collection_version: VENDOR_RUNTIME_PROFILE_COLLECTION_VERSION,
      identity_policy: 'opaque_runtime_profile_collection_id_no_vendor_binding',
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

  const vendor_runtime_profile_set_binding: VendorRuntimeProfileSetBinding = {
    binding_id: 'dsc-vendor-runtime-profile-collection-profile-set-binding-v1',
    description:
      'Exact binding of the PHASE-DSC-105 Vendor Runtime Profile Set as the runtime profile collection root. The binding is gated at build time on the recorded PHASE-DSC-105 PASS verdict, and re-seals every runtime profile set section and the runtime profile set digest before the runtime profile collection is emitted.',
    runtime_profile_set_ref: VENDOR_RUNTIME_PROFILE_SET_PATH,
    runtime_profile_set_id: VENDOR_RUNTIME_PROFILE_SET_ID,
    runtime_profile_set_version: VENDOR_RUNTIME_PROFILE_SET_VERSION,
    runtime_profile_set_phase: DSC_VENDOR_RUNTIME_PROFILE_SET_PHASE,
    runtime_profile_set_system_id: DSC_VENDOR_RUNTIME_PROFILE_SET_SYSTEM_ID,
    runtime_profile_set_evidence_ref: VENDOR_RUNTIME_PROFILE_SET_EVIDENCE_PATH,
    runtime_profile_set_verdict: VENDOR_RUNTIME_PROFILE_SET_VERDICT,
    runtime_profile_set_evidence_mode: 'phase_105_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_profile_collection_root',
    sealed_runtime_profile_set_digest: runtimeProfileSetManifest.runtime_profile_set_digest,
    sealed_runtime_blueprint_digest: runtimeProfileSetManifest.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest: runtimeProfileSetManifest.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest: runtimeProfileSetManifest.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest: runtimeProfileSetManifest.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileSetManifest.sealed_runtime_specification_digest,
    sealed_runtime_template_digest: runtimeProfileSetManifest.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileSetManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileSetManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileSetManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeProfileSetManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileSetManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileSetManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileSetManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    assembles_profile_collection_in_this_phase: false,
    implements_runtime_profile_set_in_this_phase: false,
  };

  const runtime_profile_collection_composition: RuntimeProfileCollectionComposition = {
    composition_id: 'dsc-vendor-runtime-profile-collection-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Profile Set: the runtime profile set artifact, its shape contract, and its implementation registry. The runtime profile set contents (and everything sealed beneath them) are sealed transitively through the runtime profile set digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_profile_set',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_PROFILE_COLLECTION_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_profile_set_contents_sealed_via_runtime_profile_set_digest',
      sealed_via: VENDOR_RUNTIME_PROFILE_SET_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_profile_set_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeProfileCollectionManifestEntry[] =
    RUNTIME_PROFILE_COLLECTION_SECTION_SPECS.map((spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    }));

  const runtime_profile_collection_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_profile_set:${runtimeProfileSetManifest.runtime_profile_set_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_profile_collection_manifest: RuntimeProfileCollectionManifest = {
    manifest_id: 'dsc-vendor-runtime-profile-collection-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime profile collection section. Digests are computed read-only from disk. The sealed runtime profile set digest carries the blueprint contents (and everything sealed beneath them) transitively, and the runtime profile collection digest is the SHA256 of the ordered section digests and the sealed runtime profile set digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_profile_set_digest: runtimeProfileSetManifest.runtime_profile_set_digest,
    sealed_runtime_blueprint_digest: runtimeProfileSetManifest.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest: runtimeProfileSetManifest.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest: runtimeProfileSetManifest.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest: runtimeProfileSetManifest.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileSetManifest.sealed_runtime_specification_digest,
    sealed_runtime_template_digest: runtimeProfileSetManifest.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileSetManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileSetManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileSetManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeProfileSetManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileSetManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileSetManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileSetManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_profile_collection_digest,
    runtime_profile_collection_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_profile_set_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeProfileCollection: DirectSpatialConditioningVendorRuntimeProfileCollection = {
    vendor_runtime_profile_collection_id:
      'direct-spatial-conditioning-vendor-runtime-profile-collection-v1',
    phase: DSC_VENDOR_RUNTIME_PROFILE_COLLECTION_PHASE,
    system_id: DSC_VENDOR_RUNTIME_PROFILE_COLLECTION_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_profile_collection',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_COLLECTION_V1',
    runtime_profile_collection_id: VENDOR_RUNTIME_PROFILE_COLLECTION_ID,
    runtime_profile_collection_version: VENDOR_RUNTIME_PROFILE_COLLECTION_VERSION,
    runtime_profile_collection_kind: 'vendor_runtime_profile_collection',
    runtime_profile_set_ref: VENDOR_RUNTIME_PROFILE_SET_PATH,
    runtime_profile_set_schema_ref: VENDOR_RUNTIME_PROFILE_SET_SCHEMA_PATH,
    runtime_profile_set_implementation_registry_ref:
      VENDOR_RUNTIME_PROFILE_SET_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_set_evidence_ref: VENDOR_RUNTIME_PROFILE_SET_EVIDENCE_PATH,
    runtime_blueprint_ref: vendorRuntimeProfileSet.runtime_blueprint_ref,
    runtime_blueprint_schema_ref: vendorRuntimeProfileSet.runtime_blueprint_schema_ref,
    runtime_blueprint_implementation_registry_ref:
      vendorRuntimeProfileSet.runtime_blueprint_implementation_registry_ref,
    runtime_blueprint_evidence_ref: vendorRuntimeProfileSet.runtime_blueprint_evidence_ref,
    runtime_definition_ref: vendorRuntimeProfileSet.runtime_definition_ref,
    runtime_definition_schema_ref: vendorRuntimeProfileSet.runtime_definition_schema_ref,
    runtime_definition_implementation_registry_ref:
      vendorRuntimeProfileSet.runtime_definition_implementation_registry_ref,
    runtime_definition_evidence_ref: vendorRuntimeProfileSet.runtime_definition_evidence_ref,
    runtime_descriptor_ref: vendorRuntimeProfileSet.runtime_descriptor_ref,
    runtime_descriptor_schema_ref: vendorRuntimeProfileSet.runtime_descriptor_schema_ref,
    runtime_descriptor_implementation_registry_ref:
      vendorRuntimeProfileSet.runtime_descriptor_implementation_registry_ref,
    runtime_descriptor_evidence_ref: vendorRuntimeProfileSet.runtime_descriptor_evidence_ref,
    runtime_contract_ref: vendorRuntimeProfileSet.runtime_contract_ref,
    runtime_contract_schema_ref: vendorRuntimeProfileSet.runtime_contract_schema_ref,
    runtime_contract_implementation_registry_ref:
      vendorRuntimeProfileSet.runtime_contract_implementation_registry_ref,
    runtime_contract_evidence_ref: vendorRuntimeProfileSet.runtime_contract_evidence_ref,
    runtime_specification_ref: vendorRuntimeProfileSet.runtime_specification_ref,
    runtime_specification_schema_ref: vendorRuntimeProfileSet.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeProfileSet.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref: vendorRuntimeProfileSet.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeProfileSet.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeProfileSet.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeProfileSet.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeProfileSet.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeProfileSet.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeProfileSet.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeProfileSet.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeProfileSet.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeProfileSet.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeProfileSet.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileSet.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeProfileSet.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeProfileSet.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeProfileSet.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeProfileSet.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeProfileSet.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeProfileSet.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeProfileSet.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeProfileSet.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeProfileSet.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeProfileSet.reference_bundle_ref,
    package_ref: vendorRuntimeProfileSet.package_ref,
    template_ref: vendorRuntimeProfileSet.template_ref,
    template_certification_ref: vendorRuntimeProfileSet.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeProfileSet.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_profile_collection_schema,
    deterministic_runtime_profile_collection_identity,
    vendor_runtime_profile_set_binding,
    runtime_profile_collection_composition,
    runtime_profile_collection_manifest,
    profile_collection_runtime_entries: {
      count: 0,
      entries: [],
      assembly_policy:
        'concrete vendor runtime profile collections may be assembled into this profile collection only in a future implementation phase; none are assembled here',
      assembles_profile_collection_in_this_phase: false,
    },
    design_constraints: {
      runtime_profile_collection_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_profile_set: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      assembles_profile_collection_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_PROFILE_COLLECTION_PATH, vendorRuntimeProfileCollection);
  return { vendorRuntimeProfileCollection };
}
