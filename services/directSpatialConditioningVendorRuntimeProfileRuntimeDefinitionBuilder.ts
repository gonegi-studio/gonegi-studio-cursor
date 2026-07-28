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
  DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID,
  VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileRuntimeDescriptor,
} from './directSpatialConditioningVendorRuntimeProfileRuntimeDescriptorBuilder.js';

/**
 * PHASE-DSC-139: Direct Spatial Conditioning vendor runtime profile runtime definition.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Describes the PHASE-DSC-137 Vendor
 * Runtime Profile Runtime Descriptor as the sole design-time runtime definition root:
 *   - runtime profile runtime definition schema,
 *   - deterministic runtime profile runtime definition identity,
 *   - Vendor Runtime Profile Runtime Descriptor binding,
 *   - runtime profile runtime definition composition, and
 *   - runtime profile runtime definition manifest.
 *
 * The profile runtime definition seals three design sections directly (runtime profile runtime descriptor
 * artifact, schema, implementation registry) and seals everything the profile runtime descriptor
 * owns transitively through the runtime profile runtime descriptor digest. It defines
 * no concrete profile runtime definition runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 *
 * PHASE-DSC-138 was not run, so the binding is gated on the recorded PHASE-DSC-137 PASS
 * verdict rather than a dedicated certification artifact.
 */

export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_PHASE = 'PHASE-DSC-139' as const;
export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_V1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_PATH =
  `${VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_ROOT}/direct-spatial-conditioning-vendor-runtime-profile-runtime-definition-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime profile runtime definition. */
export const VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_ID =
  'dsc-vendor-runtime-profile-runtime-definition-v1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-DSC-137 vendor runtime profile runtime descriptor. */
export const VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_EVIDENCE_PATH =
  VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VALIDATION_REPORT_PATH;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_V1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-runtime-definition.schema.json' as const;
export const VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-runtime-definition-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime profile runtime definition sections. Only the profile runtime definition's own
 * design-time publication set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_PROFILE_RUNTIME_DEFINITION_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_profile_runtime_descriptor_artifact'
    | 'runtime_profile_runtime_descriptor_schema'
    | 'runtime_profile_runtime_descriptor_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_profile_runtime_descriptor',
    role: 'runtime_profile_runtime_definition_root_profile_runtime_descriptor',
    kind: 'runtime_profile_runtime_descriptor_artifact',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_runtime_descriptor_schema',
    role: 'runtime_profile_runtime_descriptor_shape_contract',
    kind: 'runtime_profile_runtime_descriptor_schema',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_runtime_descriptor_implementation_registry',
    role: 'runtime_profile_runtime_descriptor_provenance_registry',
    kind: 'runtime_profile_runtime_descriptor_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeProfileRuntimeDefinitionSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeProfileRuntimeDefinitionSchema {
  schema_id: 'dsc-vendor-runtime-profile-runtime-definition-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_profile_runtime_definition_id_policy: 'opaque_runtime_profile_runtime_definition_id_no_vendor_binding';
  runtime_profile_runtime_descriptor_ref: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID;
  required_fields: RuntimeProfileRuntimeDefinitionSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeProfileRuntimeDefinitionIdentity {
  identity_id: 'dsc-vendor-runtime-profile-runtime-definition-deterministic-identity-v1';
  description: string;
  runtime_profile_runtime_definition_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_ID;
  runtime_profile_runtime_definition_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_VERSION;
  identity_policy: 'opaque_runtime_profile_runtime_definition_id_no_vendor_binding';
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

export interface VendorRuntimeProfileRuntimeDescriptorBinding {
  binding_id: 'dsc-vendor-runtime-profile-runtime-definition-profile-runtime-descriptor-binding-v1';
  description: string;
  runtime_profile_runtime_descriptor_ref: string;
  runtime_profile_runtime_descriptor_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID;
  runtime_profile_runtime_descriptor_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERSION;
  runtime_profile_runtime_descriptor_phase: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PHASE;
  runtime_profile_runtime_descriptor_system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SYSTEM_ID;
  runtime_profile_runtime_descriptor_evidence_ref: string;
  runtime_profile_runtime_descriptor_verdict: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERDICT;
  runtime_profile_runtime_descriptor_evidence_mode: 'phase_137_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_profile_runtime_definition_root';
  sealed_runtime_profile_runtime_descriptor_digest: string;
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
  definitions_profile_runtime_descriptor_in_this_phase: false;
  implements_runtime_profile_runtime_descriptor_in_this_phase: false;
}

export interface RuntimeProfileRuntimeDefinitionSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeProfileRuntimeDefinitionComposition {
  composition_id: 'dsc-vendor-runtime-profile-runtime-definition-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_profile_runtime_descriptor';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeProfileRuntimeDefinitionSection[];
  transitive_seal: {
    policy: 'runtime_profile_runtime_descriptor_contents_sealed_via_runtime_profile_runtime_descriptor_digest';
    sealed_via: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID;
    sealed_component_count: number;
    re_lists_runtime_profile_runtime_descriptor_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeProfileRuntimeDefinitionManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeProfileRuntimeDefinitionManifest {
  manifest_id: 'dsc-vendor-runtime-profile-runtime-definition-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeProfileRuntimeDefinitionManifestEntry[];
  sealed_runtime_profile_runtime_descriptor_digest: string;
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
  runtime_profile_runtime_definition_digest: string;
  runtime_profile_runtime_definition_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_profile_runtime_descriptor_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeProfileRuntimeDefinition {
  vendor_runtime_profile_runtime_definition_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_profile_runtime_definition';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_V1';
  runtime_profile_runtime_definition_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_ID;
  runtime_profile_runtime_definition_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_VERSION;
  runtime_profile_runtime_definition_kind: 'vendor_runtime_profile_runtime_definition';
  runtime_profile_runtime_descriptor_ref: string;
  runtime_profile_runtime_descriptor_schema_ref: string;
  runtime_profile_runtime_descriptor_implementation_registry_ref: string;
  runtime_profile_runtime_descriptor_evidence_ref: string;
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
  runtime_profile_runtime_definition_schema: VendorRuntimeProfileRuntimeDefinitionSchema;
  deterministic_runtime_profile_runtime_definition_identity: DeterministicRuntimeProfileRuntimeDefinitionIdentity;
  vendor_runtime_profile_runtime_descriptor_binding: VendorRuntimeProfileRuntimeDescriptorBinding;
  runtime_profile_runtime_definition_composition: RuntimeProfileRuntimeDefinitionComposition;
  runtime_profile_runtime_definition_manifest: RuntimeProfileRuntimeDefinitionManifest;
  profile_runtime_definition_runtime_entries: {
    count: 0;
    entries: [];
    defining_policy: string;
    definitions_profile_runtime_descriptor_in_this_phase: false;
  };
  design_constraints: {
    runtime_profile_runtime_definition_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_profile_runtime_descriptor: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    definitions_profile_runtime_descriptor_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime profile runtime definition.
 * Reuses the PHASE-DSC-137 Vendor Runtime Profile Runtime Descriptor by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime profile runtime definition artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeProfileRuntimeDefinition(
  projectRoot?: string
): { vendorRuntimeProfileRuntimeDefinition: DirectSpatialConditioningVendorRuntimeProfileRuntimeDefinition } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-DSC-137 vendor runtime profile runtime descriptor did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERDICT) {
    throw new Error(
      `PHASE-DSC-137 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PHASE) {
    throw new Error('PHASE-DSC-137 evidence does not cover the vendor runtime profile runtime descriptor');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-DSC-137 evidence reports outstanding errors');
  }

  const vendorRuntimeProfileRuntimeDescriptor =
    readJson<DirectSpatialConditioningVendorRuntimeProfileRuntimeDescriptor>(
      root,
      VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PATH
    );
  if (
    vendorRuntimeProfileRuntimeDescriptor.phase !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PHASE ||
    vendorRuntimeProfileRuntimeDescriptor.system_id !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SYSTEM_ID
  ) {
    throw new Error('PHASE-DSC-137 vendor runtime profile runtime descriptor is missing or incompatible');
  }
  if (
    vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_descriptor_id !==
    VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID
  ) {
    throw new Error('Vendor runtime profile runtime descriptor identity drifted');
  }
  if (
    vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_descriptor_version !==
    VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERSION
  ) {
    throw new Error('Vendor runtime profile runtime descriptor version drifted');
  }
  if (!vendorRuntimeProfileRuntimeDescriptor.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime profile runtime descriptor must remain vendor neutral');
  }
  if (
    !vendorRuntimeProfileRuntimeDescriptor.design_constraints.reuses_certified_vendor_runtime_profile_runtime_reference
  ) {
    throw new Error(
      'Vendor runtime profile runtime descriptor must reuse the certified vendor runtime profile runtime reference'
    );
  }
  if (vendorRuntimeProfileRuntimeDescriptor.profile_runtime_descriptor_runtime_entries.count !== 0) {
    throw new Error('PHASE-DSC-137 must not have assembled profile runtime descriptor runtime entries');
  }
  if (vendorRuntimeProfileRuntimeDescriptor.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-DSC-137 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeProfileRuntimeDescriptor.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime profile runtime descriptor channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeProfileRuntimeDescriptor.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime profile runtime descriptor sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeProfileRuntimeDescriptor.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime profile runtime descriptor spatial frame drifted');
  }
  if (
    vendorRuntimeProfileRuntimeDescriptor.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeProfileRuntimeDescriptor.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime profile runtime descriptor capability set identity drifted');
  }

  const runtimeProfileRuntimeDescriptorManifestUpstream =
    vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_descriptor_manifest;
  for (const entry of runtimeProfileRuntimeDescriptorManifestUpstream.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(
        `sealed runtime profile runtime descriptor section missing on disk: ${entry.artifact_ref}`
      );
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(
        `sealed runtime profile runtime descriptor section digest drifted: ${entry.artifact_ref}`
      );
    }
  }
  // Exact formula from the profile runtime descriptor builder (sealed prefix label unchanged).
  const recomputedRuntimeProfileRuntimeDescriptorDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeProfileRuntimeDescriptorManifestUpstream.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_profile_runtime_reference:${runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_runtime_reference_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeProfileRuntimeDescriptorDigest !==
    runtimeProfileRuntimeDescriptorManifestUpstream.runtime_profile_runtime_descriptor_digest
  ) {
    throw new Error(
      'sealed runtime profile runtime descriptor digest drifted from the runtime profile runtime descriptor manifest'
    );
  }
  const sealedComponentCount = runtimeProfileRuntimeDescriptorManifestUpstream.sealed_component_count;

  for (const spec of RUNTIME_PROFILE_RUNTIME_DEFINITION_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime profile runtime descriptor section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_PROFILE_RUNTIME_DEFINITION_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime profile runtime descriptor section id');
  }
  const sectionRefs = RUNTIME_PROFILE_RUNTIME_DEFINITION_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime profile runtime descriptor section artifact ref');
  }

  const runtime_profile_runtime_definition_schema: VendorRuntimeProfileRuntimeDefinitionSchema = {
    schema_id: 'dsc-vendor-runtime-profile-runtime-definition-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime profile runtime definition. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime profile runtime definition binds one Vendor Runtime Profile Runtime Descriptor as its root, seals the profile runtime descriptor together with its schema and implementation registry, and seals the profile runtime descriptor contents transitively through the runtime profile runtime descriptor digest. It defines no concrete profile runtime definition runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_profile_runtime_definition_id_policy: 'opaque_runtime_profile_runtime_definition_id_no_vendor_binding',
    runtime_profile_runtime_descriptor_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID,
    required_fields: [
      {
        field: 'runtime_profile_runtime_definition_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_profile_runtime_definition_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime profile runtime definition version string',
      },
      {
        field: 'runtime_profile_runtime_definition_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_profile_runtime_definition',
      },
      {
        field: 'runtime_profile_runtime_descriptor_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime profile runtime descriptor ${VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID}`,
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
        field: 'deterministic_runtime_profile_runtime_definition_identity',
        type: 'dsc-vendor-runtime-profile-runtime-definition-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_profile_runtime_descriptor_binding',
        type: 'dsc-vendor-runtime-profile-runtime-definition-profile-runtime-descriptor-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Profile Runtime Descriptor as the runtime profile runtime definition root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_profile_runtime_definition_composition',
        type: 'dsc-vendor-runtime-profile-runtime-definition-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime profile runtime descriptor artifact, schema, and implementation registry sections; vendor-specific sections forbidden and profile runtime descriptor contents never re-listed',
      },
      {
        field: 'runtime_profile_runtime_definition_manifest',
        type: 'dsc-vendor-runtime-profile-runtime-definition-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime profile runtime descriptor digest and a runtime profile runtime definition digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_profile_runtime_definition_identity: DeterministicRuntimeProfileRuntimeDefinitionIdentity =
    {
      identity_id: 'dsc-vendor-runtime-profile-runtime-definition-deterministic-identity-v1',
      description:
        'Deterministic identity of the vendor runtime profile runtime definition. The runtime_profile_runtime_definition_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
      runtime_profile_runtime_definition_id: VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_ID,
      runtime_profile_runtime_definition_version: VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_VERSION,
      identity_policy: 'opaque_runtime_profile_runtime_definition_id_no_vendor_binding',
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

  const vendor_runtime_profile_runtime_descriptor_binding: VendorRuntimeProfileRuntimeDescriptorBinding = {
    binding_id: 'dsc-vendor-runtime-profile-runtime-definition-profile-runtime-descriptor-binding-v1',
    description:
      'Exact binding of the PHASE-DSC-137 Vendor Runtime Profile Runtime Descriptor as the runtime profile runtime definition root. The binding is gated at build time on the recorded PHASE-DSC-137 PASS verdict, and re-seals every runtime profile runtime descriptor section and the runtime profile runtime descriptor digest before the runtime profile runtime definition is emitted.',
    runtime_profile_runtime_descriptor_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PATH,
    runtime_profile_runtime_descriptor_id: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID,
    runtime_profile_runtime_descriptor_version: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERSION,
    runtime_profile_runtime_descriptor_phase: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PHASE,
    runtime_profile_runtime_descriptor_system_id: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SYSTEM_ID,
    runtime_profile_runtime_descriptor_evidence_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_EVIDENCE_PATH,
    runtime_profile_runtime_descriptor_verdict: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_VERDICT,
    runtime_profile_runtime_descriptor_evidence_mode: 'phase_137_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_profile_runtime_definition_root',
    sealed_runtime_profile_runtime_descriptor_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.runtime_profile_runtime_descriptor_digest,
    sealed_runtime_profile_runtime_reference_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_runtime_reference_digest,
    sealed_runtime_profile_runtime_registry_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_runtime_registry_digest,
    sealed_runtime_profile_runtime_catalog_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_runtime_catalog_digest,
    sealed_runtime_profile_runtime_index_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_runtime_index_digest,
    sealed_runtime_profile_master_index_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_master_index_digest,
    sealed_runtime_profile_archive_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    definitions_profile_runtime_descriptor_in_this_phase: false,
    implements_runtime_profile_runtime_descriptor_in_this_phase: false,
  };

  const runtime_profile_runtime_definition_composition: RuntimeProfileRuntimeDefinitionComposition = {
    composition_id: 'dsc-vendor-runtime-profile-runtime-definition-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Profile Runtime Descriptor: the runtime profile runtime descriptor artifact, its shape contract, and its implementation registry. The runtime profile runtime descriptor contents (and everything sealed beneath them) are sealed transitively through the runtime profile runtime descriptor digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_profile_runtime_descriptor',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_PROFILE_RUNTIME_DEFINITION_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_profile_runtime_descriptor_contents_sealed_via_runtime_profile_runtime_descriptor_digest',
      sealed_via: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_profile_runtime_descriptor_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeProfileRuntimeDefinitionManifestEntry[] = RUNTIME_PROFILE_RUNTIME_DEFINITION_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_profile_runtime_definition_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_profile_runtime_descriptor:${runtimeProfileRuntimeDescriptorManifestUpstream.runtime_profile_runtime_descriptor_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_profile_runtime_definition_manifest: RuntimeProfileRuntimeDefinitionManifest = {
    manifest_id: 'dsc-vendor-runtime-profile-runtime-definition-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime profile runtime definition section. Digests are computed read-only from disk. The sealed runtime profile runtime descriptor digest carries the profile runtime descriptor contents (and everything sealed beneath them) transitively, and the runtime profile runtime definition digest is the SHA256 of the ordered section digests and the sealed runtime profile runtime descriptor digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_profile_runtime_descriptor_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.runtime_profile_runtime_descriptor_digest,
    sealed_runtime_profile_runtime_reference_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_runtime_reference_digest,
    sealed_runtime_profile_runtime_registry_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_runtime_registry_digest,
    sealed_runtime_profile_runtime_catalog_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_runtime_catalog_digest,
    sealed_runtime_profile_runtime_index_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_runtime_index_digest,
    sealed_runtime_profile_master_index_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_master_index_digest,
    sealed_runtime_profile_archive_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileRuntimeDescriptorManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_profile_runtime_definition_digest,
    runtime_profile_runtime_definition_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_profile_runtime_descriptor_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeProfileRuntimeDefinition: DirectSpatialConditioningVendorRuntimeProfileRuntimeDefinition = {
    vendor_runtime_profile_runtime_definition_id:
      'direct-spatial-conditioning-vendor-runtime-profile-runtime-definition-v1',
    phase: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_PHASE,
    system_id: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_profile_runtime_definition',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_V1',
    runtime_profile_runtime_definition_id: VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_ID,
    runtime_profile_runtime_definition_version: VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_VERSION,
    runtime_profile_runtime_definition_kind: 'vendor_runtime_profile_runtime_definition',
    runtime_profile_runtime_descriptor_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_PATH,
    runtime_profile_runtime_descriptor_schema_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_SCHEMA_PATH,
    runtime_profile_runtime_descriptor_implementation_registry_ref:
      VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_runtime_descriptor_evidence_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_DESCRIPTOR_EVIDENCE_PATH,
    runtime_profile_runtime_reference_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_reference_ref,
    runtime_profile_runtime_reference_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_reference_schema_ref,
    runtime_profile_runtime_reference_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_reference_implementation_registry_ref,
    runtime_profile_runtime_reference_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_reference_evidence_ref,
    runtime_profile_runtime_registry_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_registry_ref,
    runtime_profile_runtime_registry_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_registry_schema_ref,
    runtime_profile_runtime_registry_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_registry_implementation_registry_ref,
    runtime_profile_runtime_registry_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_registry_evidence_ref,
    runtime_profile_runtime_catalog_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_catalog_ref,
    runtime_profile_runtime_catalog_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_catalog_schema_ref,
    runtime_profile_runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_catalog_implementation_registry_ref,
    runtime_profile_runtime_catalog_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_catalog_evidence_ref,
    runtime_profile_runtime_index_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_index_ref,
    runtime_profile_runtime_index_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_index_schema_ref,
    runtime_profile_runtime_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_index_implementation_registry_ref,
    runtime_profile_runtime_index_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_runtime_index_evidence_ref,
    runtime_profile_master_index_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_master_index_ref,
    runtime_profile_master_index_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_master_index_schema_ref,
    runtime_profile_master_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_master_index_implementation_registry_ref,
    runtime_profile_master_index_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_master_index_evidence_ref,
    runtime_profile_archive_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_archive_ref,
    runtime_profile_archive_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_archive_schema_ref,
    runtime_profile_archive_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_archive_implementation_registry_ref,
    runtime_profile_archive_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_archive_evidence_ref,
    runtime_profile_bundle_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_bundle_ref,
    runtime_profile_bundle_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_bundle_schema_ref,
    runtime_profile_bundle_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_bundle_implementation_registry_ref,
    runtime_profile_bundle_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_bundle_evidence_ref,
    runtime_profile_package_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_package_ref,
    runtime_profile_package_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_package_schema_ref,
    runtime_profile_package_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_package_implementation_registry_ref,
    runtime_profile_package_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_package_evidence_ref,
    runtime_profile_definition_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_definition_ref,
    runtime_profile_definition_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_definition_schema_ref,
    runtime_profile_definition_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_definition_implementation_registry_ref,
    runtime_profile_definition_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_definition_evidence_ref,
    runtime_profile_descriptor_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_descriptor_ref,
    runtime_profile_descriptor_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_descriptor_schema_ref,
    runtime_profile_descriptor_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_descriptor_implementation_registry_ref,
    runtime_profile_descriptor_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_descriptor_evidence_ref,
    runtime_profile_reference_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_reference_ref,
    runtime_profile_reference_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_reference_schema_ref,
    runtime_profile_reference_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_reference_implementation_registry_ref,
    runtime_profile_reference_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_reference_evidence_ref,
    runtime_profile_registry_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_registry_ref,
    runtime_profile_registry_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_registry_schema_ref,
    runtime_profile_registry_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_registry_implementation_registry_ref,
    runtime_profile_registry_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_registry_evidence_ref,
    runtime_profile_catalog_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_catalog_ref,
    runtime_profile_catalog_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_catalog_schema_ref,
    runtime_profile_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_catalog_implementation_registry_ref,
    runtime_profile_catalog_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_catalog_evidence_ref,
    runtime_profile_index_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_index_ref,
    runtime_profile_index_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_index_schema_ref,
    runtime_profile_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_index_implementation_registry_ref,
    runtime_profile_index_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_index_evidence_ref,
    runtime_profile_collection_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_collection_ref,
    runtime_profile_collection_schema_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_collection_schema_ref,
    runtime_profile_collection_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_collection_implementation_registry_ref,
    runtime_profile_collection_evidence_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_collection_evidence_ref,
    runtime_profile_set_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_set_ref,
    runtime_profile_set_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_set_schema_ref,
    runtime_profile_set_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_profile_set_implementation_registry_ref,
    runtime_profile_set_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_set_evidence_ref,
    runtime_blueprint_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_blueprint_ref,
    runtime_blueprint_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_blueprint_schema_ref,
    runtime_blueprint_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_blueprint_implementation_registry_ref,
    runtime_blueprint_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_blueprint_evidence_ref,
    runtime_definition_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_definition_ref,
    runtime_definition_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_definition_schema_ref,
    runtime_definition_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_definition_implementation_registry_ref,
    runtime_definition_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_definition_evidence_ref,
    runtime_descriptor_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_descriptor_ref,
    runtime_descriptor_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_descriptor_schema_ref,
    runtime_descriptor_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_descriptor_implementation_registry_ref,
    runtime_descriptor_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_descriptor_evidence_ref,
    runtime_contract_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_contract_ref,
    runtime_contract_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_contract_schema_ref,
    runtime_contract_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_contract_implementation_registry_ref,
    runtime_contract_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_contract_evidence_ref,
    runtime_specification_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_specification_ref,
    runtime_specification_schema_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeDescriptor.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeProfileRuntimeDescriptor.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeProfileRuntimeDescriptor.reference_bundle_ref,
    package_ref: vendorRuntimeProfileRuntimeDescriptor.package_ref,
    template_ref: vendorRuntimeProfileRuntimeDescriptor.template_ref,
    template_certification_ref: vendorRuntimeProfileRuntimeDescriptor.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeProfileRuntimeDescriptor.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_profile_runtime_definition_schema,
    deterministic_runtime_profile_runtime_definition_identity,
    vendor_runtime_profile_runtime_descriptor_binding,
    runtime_profile_runtime_definition_composition,
    runtime_profile_runtime_definition_manifest,
    profile_runtime_definition_runtime_entries: {
      count: 0,
      entries: [],
      defining_policy:
        'concrete vendor runtime profile runtime definition entries may be registered into this profile runtime definition only in a future implementation phase; none are registered here',
      definitions_profile_runtime_descriptor_in_this_phase: false,
    },
    design_constraints: {
      runtime_profile_runtime_definition_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_profile_runtime_descriptor: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      definitions_profile_runtime_descriptor_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_PROFILE_RUNTIME_DEFINITION_PATH, vendorRuntimeProfileRuntimeDefinition);
  return { vendorRuntimeProfileRuntimeDefinition };
}
