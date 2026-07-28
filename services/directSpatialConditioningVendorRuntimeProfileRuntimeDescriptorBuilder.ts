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
  DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_ID,
  VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileRuntimeReference,
} from './directSpatialConditioningVendorRuntimeProfileRuntimeReferenceBuilder.js';

/**
 * PHASE-DSC-137: Direct Spatial Conditioning vendor runtime profile runtime descriptor.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Describes the PHASE-DSC-135 Vendor
 * Runtime Profile Runtime Reference as the sole design-time runtime descriptor root:
 *   - runtime profile runtime descriptor schema,
 *   - deterministic runtime profile runtime descriptor identity,
 *   - Vendor Runtime Profile Runtime Reference binding,
 *   - runtime profile runtime descriptor composition, and
 *   - runtime profile runtime descriptor manifest.
 *
 * The profile runtime descriptor seals three design sections directly (runtime profile runtime reference
 * artifact, schema, implementation registry) and seals everything the profile runtime reference
 * owns transitively through the runtime profile runtime reference digest. It defines
 * no concrete profile runtime descriptor runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 *
 * PHASE-DSC-136 was not run, so the binding is gated on the recorded PHASE-DSC-135 PASS
 * verdict rather than a dedicated certification artifact.
 */

export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PHASE = 'PHASE-DSC-137' as const;
export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_V1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PATH =
  `${VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ROOT}/direct-spatial-conditioning-vendor-runtime-profile-runtime-descriptor-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime profile runtime descriptor. */
export const VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID =
  'dsc-vendor-runtime-profile-runtime-descriptor-v1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-DSC-135 vendor runtime profile runtime reference. */
export const VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_EVIDENCE_PATH =
  VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_VALIDATION_REPORT_PATH;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_V1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-runtime-descriptor.schema.json' as const;
export const VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-runtime-descriptor-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime profile runtime descriptor sections. Only the profile runtime descriptor's own
 * design-time publication set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_profile_runtime_reference_artifact'
    | 'runtime_profile_runtime_reference_schema'
    | 'runtime_profile_runtime_reference_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_profile_runtime_reference',
    role: 'runtime_profile_runtime_descriptor_root_profile_runtime_reference',
    kind: 'runtime_profile_runtime_reference_artifact',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_runtime_reference_schema',
    role: 'runtime_profile_runtime_reference_shape_contract',
    kind: 'runtime_profile_runtime_reference_schema',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_runtime_reference_implementation_registry',
    role: 'runtime_profile_runtime_reference_provenance_registry',
    kind: 'runtime_profile_runtime_reference_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeProfileRuntimeDescriptorSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeProfileRuntimeDescriptorSchema {
  schema_id: 'dsc-vendor-runtime-profile-runtime-descriptor-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_profile_runtime_descriptor_id_policy: 'opaque_runtime_profile_runtime_descriptor_id_no_vendor_binding';
  runtime_profile_runtime_reference_ref: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_ID;
  required_fields: RuntimeProfileRuntimeDescriptorSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeProfileRuntimeDescriptorIdentity {
  identity_id: 'dsc-vendor-runtime-profile-runtime-descriptor-deterministic-identity-v1';
  description: string;
  runtime_profile_runtime_descriptor_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID;
  runtime_profile_runtime_descriptor_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERSION;
  identity_policy: 'opaque_runtime_profile_runtime_descriptor_id_no_vendor_binding';
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

export interface VendorRuntimeProfileRuntimeReferenceBinding {
  binding_id: 'dsc-vendor-runtime-profile-runtime-descriptor-profile-runtime-reference-binding-v1';
  description: string;
  runtime_profile_runtime_reference_ref: string;
  runtime_profile_runtime_reference_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_ID;
  runtime_profile_runtime_reference_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_VERSION;
  runtime_profile_runtime_reference_phase: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_PHASE;
  runtime_profile_runtime_reference_system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_SYSTEM_ID;
  runtime_profile_runtime_reference_evidence_ref: string;
  runtime_profile_runtime_reference_verdict: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_VERDICT;
  runtime_profile_runtime_reference_evidence_mode: 'phase_135_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_profile_runtime_descriptor_root';
  sealed_runtime_profile_runtime_reference_digest: string;
  sealed_runtime_profile_runtime_registry_digest: string;
  sealed_runtime_profile_runtime_catalog_digest: string;
  sealed_runtime_profile_runtime_index_digest: string;
  sealed_runtime_profile_master_index_digest: string;
  sealed_runtime_profile_archive_digest: string;
  sealed_runtime_profile_bundle_digest: string;
  sealed_runtime_profile_package_digest: string;
  sealed_runtime_profile_definition_digest: string;
  sealed_runtime_profile_descriptor_digest: string;
  sealed_runtime_profile_reference_digest: string;
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
  descriptors_profile_runtime_reference_in_this_phase: false;
  implements_runtime_profile_runtime_reference_in_this_phase: false;
}

export interface RuntimeProfileRuntimeDescriptorSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeProfileRuntimeDescriptorComposition {
  composition_id: 'dsc-vendor-runtime-profile-runtime-descriptor-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_profile_runtime_reference';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeProfileRuntimeDescriptorSection[];
  transitive_seal: {
    policy: 'runtime_profile_runtime_reference_contents_sealed_via_runtime_profile_runtime_reference_digest';
    sealed_via: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_ID;
    sealed_component_count: number;
    re_lists_runtime_profile_runtime_reference_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeProfileRuntimeDescriptorManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeProfileRuntimeDescriptorManifest {
  manifest_id: 'dsc-vendor-runtime-profile-runtime-descriptor-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeProfileRuntimeDescriptorManifestEntry[];
  sealed_runtime_profile_runtime_reference_digest: string;
  sealed_runtime_profile_runtime_registry_digest: string;
  sealed_runtime_profile_runtime_catalog_digest: string;
  sealed_runtime_profile_runtime_index_digest: string;
  sealed_runtime_profile_master_index_digest: string;
  sealed_runtime_profile_archive_digest: string;
  sealed_runtime_profile_bundle_digest: string;
  sealed_runtime_profile_package_digest: string;
  sealed_runtime_profile_definition_digest: string;
  sealed_runtime_profile_descriptor_digest: string;
  sealed_runtime_profile_reference_digest: string;
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
  runtime_profile_runtime_descriptor_digest: string;
  runtime_profile_runtime_descriptor_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_profile_runtime_reference_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeProfileRuntimeDescriptor {
  vendor_runtime_profile_runtime_descriptor_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_profile_runtime_descriptor';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_V1';
  runtime_profile_runtime_descriptor_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID;
  runtime_profile_runtime_descriptor_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERSION;
  runtime_profile_runtime_descriptor_kind: 'vendor_runtime_profile_runtime_descriptor';
  runtime_profile_runtime_reference_ref: string;
  runtime_profile_runtime_reference_schema_ref: string;
  runtime_profile_runtime_reference_implementation_registry_ref: string;
  runtime_profile_runtime_reference_evidence_ref: string;
  runtime_profile_runtime_registry_ref: string;
  runtime_profile_runtime_registry_schema_ref: string;
  runtime_profile_runtime_registry_implementation_registry_ref: string;
  runtime_profile_runtime_registry_evidence_ref: string;
  runtime_profile_runtime_catalog_ref: string;
  runtime_profile_runtime_catalog_schema_ref: string;
  runtime_profile_runtime_catalog_implementation_registry_ref: string;
  runtime_profile_runtime_catalog_evidence_ref: string;
  runtime_profile_runtime_index_ref: string;
  runtime_profile_runtime_index_schema_ref: string;
  runtime_profile_runtime_index_implementation_registry_ref: string;
  runtime_profile_runtime_index_evidence_ref: string;
  runtime_profile_master_index_ref: string;
  runtime_profile_master_index_schema_ref: string;
  runtime_profile_master_index_implementation_registry_ref: string;
  runtime_profile_master_index_evidence_ref: string;
  runtime_profile_archive_ref: string;
  runtime_profile_archive_schema_ref: string;
  runtime_profile_archive_implementation_registry_ref: string;
  runtime_profile_archive_evidence_ref: string;
  runtime_profile_bundle_ref: string;
  runtime_profile_bundle_schema_ref: string;
  runtime_profile_bundle_implementation_registry_ref: string;
  runtime_profile_bundle_evidence_ref: string;
  runtime_profile_package_ref: string;
  runtime_profile_package_schema_ref: string;
  runtime_profile_package_implementation_registry_ref: string;
  runtime_profile_package_evidence_ref: string;
  runtime_profile_definition_ref: string;
  runtime_profile_definition_schema_ref: string;
  runtime_profile_definition_implementation_registry_ref: string;
  runtime_profile_definition_evidence_ref: string;
  runtime_profile_descriptor_ref: string;
  runtime_profile_descriptor_schema_ref: string;
  runtime_profile_descriptor_implementation_registry_ref: string;
  runtime_profile_descriptor_evidence_ref: string;
  runtime_profile_reference_ref: string;
  runtime_profile_reference_schema_ref: string;
  runtime_profile_reference_implementation_registry_ref: string;
  runtime_profile_reference_evidence_ref: string;
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
  runtime_profile_runtime_descriptor_schema: VendorRuntimeProfileRuntimeDescriptorSchema;
  deterministic_runtime_profile_runtime_descriptor_identity: DeterministicRuntimeProfileRuntimeDescriptorIdentity;
  vendor_runtime_profile_runtime_reference_binding: VendorRuntimeProfileRuntimeReferenceBinding;
  runtime_profile_runtime_descriptor_composition: RuntimeProfileRuntimeDescriptorComposition;
  runtime_profile_runtime_descriptor_manifest: RuntimeProfileRuntimeDescriptorManifest;
  profile_runtime_descriptor_runtime_entries: {
    count: 0;
    entries: [];
    describing_policy: string;
    descriptors_profile_runtime_reference_in_this_phase: false;
  };
  design_constraints: {
    runtime_profile_runtime_descriptor_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_profile_runtime_reference: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    descriptors_profile_runtime_reference_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime profile runtime descriptor.
 * Reuses the PHASE-DSC-135 Vendor Runtime Profile Runtime Reference by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime profile runtime descriptor artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeProfileRuntimeDescriptor(
  projectRoot?: string
): { vendorRuntimeProfileRuntimeDescriptor: DirectSpatialConditioningVendorRuntimeProfileRuntimeDescriptor } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-DSC-135 vendor runtime profile runtime reference did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_VERDICT) {
    throw new Error(
      `PHASE-DSC-135 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_PHASE) {
    throw new Error('PHASE-DSC-135 evidence does not cover the vendor runtime profile runtime reference');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-DSC-135 evidence reports outstanding errors');
  }

  const vendorRuntimeProfileRuntimeReference =
    readJson<DirectSpatialConditioningVendorRuntimeProfileRuntimeReference>(
      root,
      VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_PATH
    );
  if (
    vendorRuntimeProfileRuntimeReference.phase !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_PHASE ||
    vendorRuntimeProfileRuntimeReference.system_id !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_SYSTEM_ID
  ) {
    throw new Error('PHASE-DSC-135 vendor runtime profile runtime reference is missing or incompatible');
  }
  if (
    vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_reference_id !==
    VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_ID
  ) {
    throw new Error('Vendor runtime profile runtime reference identity drifted');
  }
  if (
    vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_reference_version !==
    VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_VERSION
  ) {
    throw new Error('Vendor runtime profile runtime reference version drifted');
  }
  if (!vendorRuntimeProfileRuntimeReference.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime profile runtime reference must remain vendor neutral');
  }
  if (
    !vendorRuntimeProfileRuntimeReference.design_constraints.reuses_certified_vendor_runtime_profile_runtime_registry
  ) {
    throw new Error(
      'Vendor runtime profile runtime reference must reuse the certified vendor runtime profile runtime registry'
    );
  }
  if (vendorRuntimeProfileRuntimeReference.profile_runtime_reference_runtime_entries.count !== 0) {
    throw new Error('PHASE-DSC-135 must not have assembled profile runtime reference runtime entries');
  }
  if (vendorRuntimeProfileRuntimeReference.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-DSC-135 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeProfileRuntimeReference.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime profile runtime reference channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeProfileRuntimeReference.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime profile runtime reference sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeProfileRuntimeReference.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime profile runtime reference spatial frame drifted');
  }
  if (
    vendorRuntimeProfileRuntimeReference.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeProfileRuntimeReference.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime profile runtime reference capability set identity drifted');
  }

  const runtimeProfileRuntimeReferenceManifestUpstream =
    vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_reference_manifest;
  for (const entry of runtimeProfileRuntimeReferenceManifestUpstream.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(
        `sealed runtime profile runtime reference section missing on disk: ${entry.artifact_ref}`
      );
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(
        `sealed runtime profile runtime reference section digest drifted: ${entry.artifact_ref}`
      );
    }
  }
  // Exact formula from the profile runtime reference builder (sealed prefix label unchanged).
  const recomputedRuntimeProfileRuntimeReferenceDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeProfileRuntimeReferenceManifestUpstream.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_profile_runtime_registry:${runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_runtime_registry_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeProfileRuntimeReferenceDigest !==
    runtimeProfileRuntimeReferenceManifestUpstream.runtime_profile_runtime_reference_digest
  ) {
    throw new Error(
      'sealed runtime profile runtime reference digest drifted from the runtime profile runtime reference manifest'
    );
  }
  const sealedComponentCount = runtimeProfileRuntimeReferenceManifestUpstream.sealed_component_count;

  for (const spec of RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime profile runtime reference section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime profile runtime reference section id');
  }
  const sectionRefs = RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime profile runtime reference section artifact ref');
  }

  const runtime_profile_runtime_descriptor_schema: VendorRuntimeProfileRuntimeDescriptorSchema = {
    schema_id: 'dsc-vendor-runtime-profile-runtime-descriptor-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime profile runtime descriptor. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime profile runtime descriptor binds one Vendor Runtime Profile Runtime Reference as its root, seals the profile runtime reference together with its schema and implementation registry, and seals the profile runtime reference contents transitively through the runtime profile runtime reference digest. It defines no concrete profile runtime descriptor runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_profile_runtime_descriptor_id_policy: 'opaque_runtime_profile_runtime_descriptor_id_no_vendor_binding',
    runtime_profile_runtime_reference_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_ID,
    required_fields: [
      {
        field: 'runtime_profile_runtime_descriptor_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_profile_runtime_descriptor_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime profile runtime descriptor version string',
      },
      {
        field: 'runtime_profile_runtime_descriptor_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_profile_runtime_descriptor',
      },
      {
        field: 'runtime_profile_runtime_reference_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime profile runtime reference ${VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_ID}`,
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
        field: 'deterministic_runtime_profile_runtime_descriptor_identity',
        type: 'dsc-vendor-runtime-profile-runtime-descriptor-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_profile_runtime_reference_binding',
        type: 'dsc-vendor-runtime-profile-runtime-descriptor-profile-runtime-reference-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Profile Runtime Reference as the runtime profile runtime descriptor root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_profile_runtime_descriptor_composition',
        type: 'dsc-vendor-runtime-profile-runtime-descriptor-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime profile runtime reference artifact, schema, and implementation registry sections; vendor-specific sections forbidden and profile runtime reference contents never re-listed',
      },
      {
        field: 'runtime_profile_runtime_descriptor_manifest',
        type: 'dsc-vendor-runtime-profile-runtime-descriptor-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime profile runtime reference digest and a runtime profile runtime descriptor digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_profile_runtime_descriptor_identity: DeterministicRuntimeProfileRuntimeDescriptorIdentity =
    {
      identity_id: 'dsc-vendor-runtime-profile-runtime-descriptor-deterministic-identity-v1',
      description:
        'Deterministic identity of the vendor runtime profile runtime descriptor. The runtime_profile_runtime_descriptor_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
      runtime_profile_runtime_descriptor_id: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID,
      runtime_profile_runtime_descriptor_version: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERSION,
      identity_policy: 'opaque_runtime_profile_runtime_descriptor_id_no_vendor_binding',
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

  const vendor_runtime_profile_runtime_reference_binding: VendorRuntimeProfileRuntimeReferenceBinding = {
    binding_id: 'dsc-vendor-runtime-profile-runtime-descriptor-profile-runtime-reference-binding-v1',
    description:
      'Exact binding of the PHASE-DSC-135 Vendor Runtime Profile Runtime Reference as the runtime profile runtime descriptor root. The binding is gated at build time on the recorded PHASE-DSC-135 PASS verdict, and re-seals every runtime profile runtime reference section and the runtime profile runtime reference digest before the runtime profile runtime descriptor is emitted.',
    runtime_profile_runtime_reference_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_PATH,
    runtime_profile_runtime_reference_id: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_ID,
    runtime_profile_runtime_reference_version: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_VERSION,
    runtime_profile_runtime_reference_phase: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_PHASE,
    runtime_profile_runtime_reference_system_id: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_SYSTEM_ID,
    runtime_profile_runtime_reference_evidence_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_EVIDENCE_PATH,
    runtime_profile_runtime_reference_verdict: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_VERDICT,
    runtime_profile_runtime_reference_evidence_mode: 'phase_135_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_profile_runtime_descriptor_root',
    sealed_runtime_profile_runtime_reference_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.runtime_profile_runtime_reference_digest,
    sealed_runtime_profile_runtime_registry_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_runtime_registry_digest,
    sealed_runtime_profile_runtime_catalog_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_runtime_catalog_digest,
    sealed_runtime_profile_runtime_index_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_runtime_index_digest,
    sealed_runtime_profile_master_index_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_master_index_digest,
    sealed_runtime_profile_archive_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    descriptors_profile_runtime_reference_in_this_phase: false,
    implements_runtime_profile_runtime_reference_in_this_phase: false,
  };

  const runtime_profile_runtime_descriptor_composition: RuntimeProfileRuntimeDescriptorComposition = {
    composition_id: 'dsc-vendor-runtime-profile-runtime-descriptor-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Profile Runtime Reference: the runtime profile runtime reference artifact, its shape contract, and its implementation registry. The runtime profile runtime reference contents (and everything sealed beneath them) are sealed transitively through the runtime profile runtime reference digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_profile_runtime_reference',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_profile_runtime_reference_contents_sealed_via_runtime_profile_runtime_reference_digest',
      sealed_via: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_profile_runtime_reference_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeProfileRuntimeDescriptorManifestEntry[] = RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_profile_runtime_descriptor_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_profile_runtime_reference:${runtimeProfileRuntimeReferenceManifestUpstream.runtime_profile_runtime_reference_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_profile_runtime_descriptor_manifest: RuntimeProfileRuntimeDescriptorManifest = {
    manifest_id: 'dsc-vendor-runtime-profile-runtime-descriptor-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime profile runtime descriptor section. Digests are computed read-only from disk. The sealed runtime profile runtime reference digest carries the profile runtime reference contents (and everything sealed beneath them) transitively, and the runtime profile runtime descriptor digest is the SHA256 of the ordered section digests and the sealed runtime profile runtime reference digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_profile_runtime_reference_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.runtime_profile_runtime_reference_digest,
    sealed_runtime_profile_runtime_registry_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_runtime_registry_digest,
    sealed_runtime_profile_runtime_catalog_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_runtime_catalog_digest,
    sealed_runtime_profile_runtime_index_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_runtime_index_digest,
    sealed_runtime_profile_master_index_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_master_index_digest,
    sealed_runtime_profile_archive_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileRuntimeReferenceManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_profile_runtime_descriptor_digest,
    runtime_profile_runtime_descriptor_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_profile_runtime_reference_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeProfileRuntimeDescriptor: DirectSpatialConditioningVendorRuntimeProfileRuntimeDescriptor = {
    vendor_runtime_profile_runtime_descriptor_id:
      'direct-spatial-conditioning-vendor-runtime-profile-runtime-descriptor-v1',
    phase: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PHASE,
    system_id: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_profile_runtime_descriptor',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_V1',
    runtime_profile_runtime_descriptor_id: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID,
    runtime_profile_runtime_descriptor_version: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERSION,
    runtime_profile_runtime_descriptor_kind: 'vendor_runtime_profile_runtime_descriptor',
    runtime_profile_runtime_reference_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_PATH,
    runtime_profile_runtime_reference_schema_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_SCHEMA_PATH,
    runtime_profile_runtime_reference_implementation_registry_ref:
      VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_runtime_reference_evidence_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_REFERENCE_EVIDENCE_PATH,
    runtime_profile_runtime_registry_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_registry_ref,
    runtime_profile_runtime_registry_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_registry_schema_ref,
    runtime_profile_runtime_registry_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_registry_implementation_registry_ref,
    runtime_profile_runtime_registry_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_registry_evidence_ref,
    runtime_profile_runtime_catalog_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_catalog_ref,
    runtime_profile_runtime_catalog_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_catalog_schema_ref,
    runtime_profile_runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_catalog_implementation_registry_ref,
    runtime_profile_runtime_catalog_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_catalog_evidence_ref,
    runtime_profile_runtime_index_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_index_ref,
    runtime_profile_runtime_index_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_index_schema_ref,
    runtime_profile_runtime_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_index_implementation_registry_ref,
    runtime_profile_runtime_index_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_runtime_index_evidence_ref,
    runtime_profile_master_index_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_master_index_ref,
    runtime_profile_master_index_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_master_index_schema_ref,
    runtime_profile_master_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_master_index_implementation_registry_ref,
    runtime_profile_master_index_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_master_index_evidence_ref,
    runtime_profile_archive_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_archive_ref,
    runtime_profile_archive_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_archive_schema_ref,
    runtime_profile_archive_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_archive_implementation_registry_ref,
    runtime_profile_archive_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_archive_evidence_ref,
    runtime_profile_bundle_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_bundle_ref,
    runtime_profile_bundle_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_bundle_schema_ref,
    runtime_profile_bundle_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_bundle_implementation_registry_ref,
    runtime_profile_bundle_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_bundle_evidence_ref,
    runtime_profile_package_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_package_ref,
    runtime_profile_package_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_package_schema_ref,
    runtime_profile_package_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_package_implementation_registry_ref,
    runtime_profile_package_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_package_evidence_ref,
    runtime_profile_definition_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_definition_ref,
    runtime_profile_definition_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_definition_schema_ref,
    runtime_profile_definition_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_definition_implementation_registry_ref,
    runtime_profile_definition_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_definition_evidence_ref,
    runtime_profile_descriptor_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_descriptor_ref,
    runtime_profile_descriptor_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_descriptor_schema_ref,
    runtime_profile_descriptor_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_descriptor_implementation_registry_ref,
    runtime_profile_descriptor_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_descriptor_evidence_ref,
    runtime_profile_reference_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_reference_ref,
    runtime_profile_reference_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_reference_schema_ref,
    runtime_profile_reference_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_reference_implementation_registry_ref,
    runtime_profile_reference_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_reference_evidence_ref,
    runtime_profile_registry_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_registry_ref,
    runtime_profile_registry_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_registry_schema_ref,
    runtime_profile_registry_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_registry_implementation_registry_ref,
    runtime_profile_registry_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_registry_evidence_ref,
    runtime_profile_catalog_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_catalog_ref,
    runtime_profile_catalog_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_catalog_schema_ref,
    runtime_profile_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_catalog_implementation_registry_ref,
    runtime_profile_catalog_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_catalog_evidence_ref,
    runtime_profile_index_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_index_ref,
    runtime_profile_index_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_index_schema_ref,
    runtime_profile_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_index_implementation_registry_ref,
    runtime_profile_index_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_index_evidence_ref,
    runtime_profile_collection_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_collection_ref,
    runtime_profile_collection_schema_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_collection_schema_ref,
    runtime_profile_collection_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_collection_implementation_registry_ref,
    runtime_profile_collection_evidence_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_collection_evidence_ref,
    runtime_profile_set_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_set_ref,
    runtime_profile_set_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_set_schema_ref,
    runtime_profile_set_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_profile_set_implementation_registry_ref,
    runtime_profile_set_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_set_evidence_ref,
    runtime_blueprint_ref: vendorRuntimeProfileRuntimeReference.runtime_blueprint_ref,
    runtime_blueprint_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_blueprint_schema_ref,
    runtime_blueprint_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_blueprint_implementation_registry_ref,
    runtime_blueprint_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_blueprint_evidence_ref,
    runtime_definition_ref: vendorRuntimeProfileRuntimeReference.runtime_definition_ref,
    runtime_definition_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_definition_schema_ref,
    runtime_definition_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_definition_implementation_registry_ref,
    runtime_definition_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_definition_evidence_ref,
    runtime_descriptor_ref: vendorRuntimeProfileRuntimeReference.runtime_descriptor_ref,
    runtime_descriptor_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_descriptor_schema_ref,
    runtime_descriptor_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_descriptor_implementation_registry_ref,
    runtime_descriptor_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_descriptor_evidence_ref,
    runtime_contract_ref: vendorRuntimeProfileRuntimeReference.runtime_contract_ref,
    runtime_contract_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_contract_schema_ref,
    runtime_contract_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_contract_implementation_registry_ref,
    runtime_contract_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_contract_evidence_ref,
    runtime_specification_ref: vendorRuntimeProfileRuntimeReference.runtime_specification_ref,
    runtime_specification_schema_ref:
      vendorRuntimeProfileRuntimeReference.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref:
      vendorRuntimeProfileRuntimeReference.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeProfileRuntimeReference.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeProfileRuntimeReference.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeProfileRuntimeReference.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeProfileRuntimeReference.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeProfileRuntimeReference.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReference.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeProfileRuntimeReference.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeProfileRuntimeReference.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeProfileRuntimeReference.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeProfileRuntimeReference.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeProfileRuntimeReference.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeProfileRuntimeReference.reference_bundle_ref,
    package_ref: vendorRuntimeProfileRuntimeReference.package_ref,
    template_ref: vendorRuntimeProfileRuntimeReference.template_ref,
    template_certification_ref: vendorRuntimeProfileRuntimeReference.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeProfileRuntimeReference.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_profile_runtime_descriptor_schema,
    deterministic_runtime_profile_runtime_descriptor_identity,
    vendor_runtime_profile_runtime_reference_binding,
    runtime_profile_runtime_descriptor_composition,
    runtime_profile_runtime_descriptor_manifest,
    profile_runtime_descriptor_runtime_entries: {
      count: 0,
      entries: [],
      describing_policy:
        'concrete vendor runtime profile runtime descriptor entries may be registered into this profile runtime descriptor only in a future implementation phase; none are registered here',
      descriptors_profile_runtime_reference_in_this_phase: false,
    },
    design_constraints: {
      runtime_profile_runtime_descriptor_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_profile_runtime_reference: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      descriptors_profile_runtime_reference_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PATH, vendorRuntimeProfileRuntimeDescriptor);
  return { vendorRuntimeProfileRuntimeDescriptor };
}
