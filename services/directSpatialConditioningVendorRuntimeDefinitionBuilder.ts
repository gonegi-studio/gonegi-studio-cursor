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
  DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE,
  DSC_VENDOR_RUNTIME_DESCRIPTOR_SYSTEM_ID,
  VENDOR_RUNTIME_DESCRIPTOR_ID,
  VENDOR_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_SCHEMA_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_VERSION,
  type DirectSpatialConditioningVendorRuntimeDescriptor,
} from './directSpatialConditioningVendorRuntimeDescriptorBuilder.js';

/**
 * PHASE-DSC-101: Direct Spatial Conditioning vendor runtime definition.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Describes the PHASE-099 Vendor
 * Runtime Descriptor as the sole design-time publication root:
 *   - runtime definition schema,
 *   - deterministic runtime definition identity,
 *   - Vendor Runtime Descriptor binding,
 *   - runtime definition composition, and
 *   - runtime definition manifest.
 *
 * The definition seals three design sections directly (runtime descriptor
 * artifact, schema, implementation registry) and seals everything the runtime
 * descriptor owns transitively through the runtime descriptor digest. It defines
 * no concrete runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_DEFINITION_PHASE = 'PHASE-DSC-101' as const;
export const DSC_VENDOR_RUNTIME_DEFINITION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DEFINITION_V1' as const;

export const VENDOR_RUNTIME_DEFINITION_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_DEFINITION_PATH =
  `${VENDOR_RUNTIME_DEFINITION_ROOT}/direct-spatial-conditioning-vendor-runtime-definition-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime definition. */
export const VENDOR_RUNTIME_DEFINITION_ID = 'dsc-vendor-runtime-definition-v1' as const;
export const VENDOR_RUNTIME_DEFINITION_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-099 vendor runtime descriptor. */
export const VENDOR_RUNTIME_DESCRIPTOR_EVIDENCE_PATH =
  VENDOR_RUNTIME_DESCRIPTOR_VALIDATION_REPORT_PATH;

export const VENDOR_RUNTIME_DESCRIPTOR_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DESCRIPTOR_V1' as const;

export const VENDOR_RUNTIME_DEFINITION_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-definition.schema.json' as const;
export const VENDOR_RUNTIME_DEFINITION_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-definition-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_DEFINITION_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DEFINITION_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime definition sections. Only the runtime descriptor's own
 * design-time descriptor set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_DEFINITION_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_descriptor_artifact'
    | 'runtime_descriptor_schema'
    | 'runtime_descriptor_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_descriptor',
    role: 'runtime_definition_root_descriptor',
    kind: 'runtime_descriptor_artifact',
    artifact_ref: VENDOR_RUNTIME_DESCRIPTOR_PATH,
  },
  {
    section_id: 'vendor_runtime_descriptor_schema',
    role: 'runtime_descriptor_shape_contract',
    kind: 'runtime_descriptor_schema',
    artifact_ref: VENDOR_RUNTIME_DESCRIPTOR_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_descriptor_implementation_registry',
    role: 'runtime_descriptor_provenance_registry',
    kind: 'runtime_descriptor_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeDefinitionSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeDefinitionSchema {
  schema_id: 'dsc-vendor-runtime-definition-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_definition_id_policy: 'opaque_runtime_definition_id_no_vendor_binding';
  runtime_descriptor_ref: typeof VENDOR_RUNTIME_DESCRIPTOR_ID;
  required_fields: RuntimeDefinitionSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeDefinitionIdentity {
  identity_id: 'dsc-vendor-runtime-definition-deterministic-identity-v1';
  description: string;
  runtime_definition_id: typeof VENDOR_RUNTIME_DEFINITION_ID;
  runtime_definition_version: typeof VENDOR_RUNTIME_DEFINITION_VERSION;
  identity_policy: 'opaque_runtime_definition_id_no_vendor_binding';
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

export interface VendorRuntimeDescriptorBinding {
  binding_id: 'dsc-vendor-runtime-definition-descriptor-binding-v1';
  description: string;
  runtime_descriptor_ref: string;
  runtime_descriptor_id: typeof VENDOR_RUNTIME_DESCRIPTOR_ID;
  runtime_descriptor_version: typeof VENDOR_RUNTIME_DESCRIPTOR_VERSION;
  runtime_descriptor_phase: typeof DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE;
  runtime_descriptor_system_id: typeof DSC_VENDOR_RUNTIME_DESCRIPTOR_SYSTEM_ID;
  runtime_descriptor_evidence_ref: string;
  runtime_descriptor_verdict: typeof VENDOR_RUNTIME_DESCRIPTOR_VERDICT;
  runtime_descriptor_evidence_mode: 'phase_099_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_definition_root';
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
  defines_runtime_in_this_phase: false;
  implements_runtime_descriptor_in_this_phase: false;
}

export interface RuntimeDefinitionSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeDefinitionComposition {
  composition_id: 'dsc-vendor-runtime-definition-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_descriptor';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeDefinitionSection[];
  transitive_seal: {
    policy: 'runtime_descriptor_contents_sealed_via_runtime_descriptor_digest';
    sealed_via: typeof VENDOR_RUNTIME_DESCRIPTOR_ID;
    sealed_component_count: number;
    re_lists_runtime_descriptor_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeDefinitionManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeDefinitionManifest {
  manifest_id: 'dsc-vendor-runtime-definition-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeDefinitionManifestEntry[];
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
  runtime_definition_digest: string;
  runtime_definition_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_descriptor_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeDefinition {
  vendor_runtime_definition_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_DEFINITION_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_DEFINITION_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_definition';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DEFINITION_V1';
  runtime_definition_id: typeof VENDOR_RUNTIME_DEFINITION_ID;
  runtime_definition_version: typeof VENDOR_RUNTIME_DEFINITION_VERSION;
  runtime_definition_kind: 'vendor_runtime_definition';
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
  runtime_definition_schema: VendorRuntimeDefinitionSchema;
  deterministic_runtime_definition_identity: DeterministicRuntimeDefinitionIdentity;
  vendor_runtime_descriptor_binding: VendorRuntimeDescriptorBinding;
  runtime_definition_composition: RuntimeDefinitionComposition;
  runtime_definition_manifest: RuntimeDefinitionManifest;
  defined_runtime_entries: {
    count: 0;
    entries: [];
    defining_policy: string;
    defines_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_definition_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_descriptor: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    defines_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime definition.
 * Reuses the PHASE-099 Vendor Runtime Descriptor by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime definition artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeDefinition(
  projectRoot?: string
): { vendorRuntimeDefinition: DirectSpatialConditioningVendorRuntimeDefinition } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_DESCRIPTOR_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-099 vendor runtime descriptor did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_DESCRIPTOR_VERDICT) {
    throw new Error(
      `PHASE-099 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE) {
    throw new Error('PHASE-099 evidence does not cover the vendor runtime descriptor');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-099 evidence reports outstanding errors');
  }

  const vendorRuntimeDescriptor = readJson<DirectSpatialConditioningVendorRuntimeDescriptor>(
    root,
    VENDOR_RUNTIME_DESCRIPTOR_PATH
  );
  if (
    vendorRuntimeDescriptor.phase !== DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE ||
    vendorRuntimeDescriptor.system_id !== DSC_VENDOR_RUNTIME_DESCRIPTOR_SYSTEM_ID
  ) {
    throw new Error('PHASE-099 vendor runtime descriptor is missing or incompatible');
  }
  if (vendorRuntimeDescriptor.runtime_descriptor_id !== VENDOR_RUNTIME_DESCRIPTOR_ID) {
    throw new Error('Vendor runtime descriptor identity drifted');
  }
  if (vendorRuntimeDescriptor.runtime_descriptor_version !== VENDOR_RUNTIME_DESCRIPTOR_VERSION) {
    throw new Error('Vendor runtime descriptor version drifted');
  }
  if (!vendorRuntimeDescriptor.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime descriptor must remain vendor neutral');
  }
  if (!vendorRuntimeDescriptor.design_constraints.reuses_certified_vendor_runtime_contract) {
    throw new Error(
      'Vendor runtime descriptor must reuse the certified vendor runtime contract'
    );
  }
  if (vendorRuntimeDescriptor.described_runtime_entries.count !== 0) {
    throw new Error('PHASE-099 must not have described runtime entries');
  }
  if (vendorRuntimeDescriptor.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-099 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeDescriptor.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime descriptor channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeDescriptor.sources_supported) !== JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime descriptor sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeDescriptor.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime descriptor spatial frame drifted');
  }
  if (
    vendorRuntimeDescriptor.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeDescriptor.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime descriptor capability set identity drifted');
  }

  const runtimeDescriptorManifest = vendorRuntimeDescriptor.runtime_descriptor_manifest;
  for (const entry of runtimeDescriptorManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed runtime descriptor section missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed runtime descriptor section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const recomputedRuntimeDescriptorDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeDescriptorManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_contract:${runtimeDescriptorManifest.sealed_runtime_contract_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeDescriptorDigest !== runtimeDescriptorManifest.runtime_descriptor_digest
  ) {
    throw new Error(
      'sealed runtime descriptor digest drifted from the runtime descriptor manifest'
    );
  }
  const sealedComponentCount = runtimeDescriptorManifest.sealed_component_count;

  for (const spec of RUNTIME_DEFINITION_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime definition section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_DEFINITION_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime definition section id');
  }
  const sectionRefs = RUNTIME_DEFINITION_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime definition section artifact ref');
  }

  const runtime_definition_schema: VendorRuntimeDefinitionSchema = {
    schema_id: 'dsc-vendor-runtime-definition-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime definition. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime definition binds one Vendor Runtime Descriptor as its root, seals the descriptor together with its schema and implementation registry, and seals the descriptor contents transitively through the runtime descriptor digest. It defines no concrete runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_definition_id_policy: 'opaque_runtime_definition_id_no_vendor_binding',
    runtime_descriptor_ref: VENDOR_RUNTIME_DESCRIPTOR_ID,
    required_fields: [
      {
        field: 'runtime_definition_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_definition_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime definition version string',
      },
      {
        field: 'runtime_definition_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_definition',
      },
      {
        field: 'runtime_descriptor_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime descriptor ${VENDOR_RUNTIME_DESCRIPTOR_ID}`,
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
        field: 'deterministic_runtime_definition_identity',
        type: 'dsc-vendor-runtime-definition-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_descriptor_binding',
        type: 'dsc-vendor-runtime-definition-descriptor-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Descriptor as the runtime definition root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_definition_composition',
        type: 'dsc-vendor-runtime-definition-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime descriptor artifact, schema, and implementation registry sections; vendor-specific sections forbidden and descriptor contents never re-listed',
      },
      {
        field: 'runtime_definition_manifest',
        type: 'dsc-vendor-runtime-definition-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime descriptor digest and a runtime definition digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_definition_identity: DeterministicRuntimeDefinitionIdentity = {
    identity_id: 'dsc-vendor-runtime-definition-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime definition. The runtime_definition_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_definition_id: VENDOR_RUNTIME_DEFINITION_ID,
    runtime_definition_version: VENDOR_RUNTIME_DEFINITION_VERSION,
    identity_policy: 'opaque_runtime_definition_id_no_vendor_binding',
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

  const vendor_runtime_descriptor_binding: VendorRuntimeDescriptorBinding = {
    binding_id: 'dsc-vendor-runtime-definition-descriptor-binding-v1',
    description:
      'Exact binding of the PHASE-099 Vendor Runtime Descriptor as the runtime definition root. The binding is gated at build time on the recorded PHASE-099 PASS verdict, and re-seals every runtime descriptor section and the runtime descriptor digest before the runtime definition is emitted.',
    runtime_descriptor_ref: VENDOR_RUNTIME_DESCRIPTOR_PATH,
    runtime_descriptor_id: VENDOR_RUNTIME_DESCRIPTOR_ID,
    runtime_descriptor_version: VENDOR_RUNTIME_DESCRIPTOR_VERSION,
    runtime_descriptor_phase: DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE,
    runtime_descriptor_system_id: DSC_VENDOR_RUNTIME_DESCRIPTOR_SYSTEM_ID,
    runtime_descriptor_evidence_ref: VENDOR_RUNTIME_DESCRIPTOR_EVIDENCE_PATH,
    runtime_descriptor_verdict: VENDOR_RUNTIME_DESCRIPTOR_VERDICT,
    runtime_descriptor_evidence_mode: 'phase_099_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_definition_root',
    sealed_runtime_descriptor_digest: runtimeDescriptorManifest.runtime_descriptor_digest,
    sealed_runtime_contract_digest: runtimeDescriptorManifest.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeDescriptorManifest.sealed_runtime_specification_digest,
    sealed_runtime_template_digest: runtimeDescriptorManifest.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeDescriptorManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeDescriptorManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeDescriptorManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeDescriptorManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeDescriptorManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeDescriptorManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeDescriptorManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    defines_runtime_in_this_phase: false,
    implements_runtime_descriptor_in_this_phase: false,
  };

  const runtime_definition_composition: RuntimeDefinitionComposition = {
    composition_id: 'dsc-vendor-runtime-definition-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Descriptor: the runtime descriptor artifact, its shape contract, and its implementation registry. The runtime descriptor contents (and everything sealed beneath them) are sealed transitively through the runtime descriptor digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_descriptor',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_DEFINITION_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_descriptor_contents_sealed_via_runtime_descriptor_digest',
      sealed_via: VENDOR_RUNTIME_DESCRIPTOR_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_descriptor_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeDefinitionManifestEntry[] = RUNTIME_DEFINITION_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_definition_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_descriptor:${runtimeDescriptorManifest.runtime_descriptor_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_definition_manifest: RuntimeDefinitionManifest = {
    manifest_id: 'dsc-vendor-runtime-definition-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime definition section. Digests are computed read-only from disk. The sealed runtime descriptor digest carries the descriptor contents (and everything sealed beneath them) transitively, and the runtime definition digest is the SHA256 of the ordered section digests and the sealed runtime descriptor digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_descriptor_digest: runtimeDescriptorManifest.runtime_descriptor_digest,
    sealed_runtime_contract_digest: runtimeDescriptorManifest.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeDescriptorManifest.sealed_runtime_specification_digest,
    sealed_runtime_template_digest: runtimeDescriptorManifest.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeDescriptorManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeDescriptorManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeDescriptorManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeDescriptorManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeDescriptorManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeDescriptorManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeDescriptorManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_definition_digest,
    runtime_definition_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_descriptor_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeDefinition: DirectSpatialConditioningVendorRuntimeDefinition = {
    vendor_runtime_definition_id: 'direct-spatial-conditioning-vendor-runtime-definition-v1',
    phase: DSC_VENDOR_RUNTIME_DEFINITION_PHASE,
    system_id: DSC_VENDOR_RUNTIME_DEFINITION_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_definition',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DEFINITION_V1',
    runtime_definition_id: VENDOR_RUNTIME_DEFINITION_ID,
    runtime_definition_version: VENDOR_RUNTIME_DEFINITION_VERSION,
    runtime_definition_kind: 'vendor_runtime_definition',
    runtime_descriptor_ref: VENDOR_RUNTIME_DESCRIPTOR_PATH,
    runtime_descriptor_schema_ref: VENDOR_RUNTIME_DESCRIPTOR_SCHEMA_PATH,
    runtime_descriptor_implementation_registry_ref:
      VENDOR_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
    runtime_descriptor_evidence_ref: VENDOR_RUNTIME_DESCRIPTOR_EVIDENCE_PATH,
    runtime_contract_ref: vendorRuntimeDescriptor.runtime_contract_ref,
    runtime_contract_schema_ref: vendorRuntimeDescriptor.runtime_contract_schema_ref,
    runtime_contract_implementation_registry_ref:
      vendorRuntimeDescriptor.runtime_contract_implementation_registry_ref,
    runtime_contract_evidence_ref: vendorRuntimeDescriptor.runtime_contract_evidence_ref,
    runtime_specification_ref: vendorRuntimeDescriptor.runtime_specification_ref,
    runtime_specification_schema_ref: vendorRuntimeDescriptor.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeDescriptor.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref: vendorRuntimeDescriptor.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeDescriptor.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeDescriptor.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeDescriptor.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeDescriptor.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeDescriptor.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeDescriptor.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeDescriptor.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeDescriptor.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeDescriptor.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeDescriptor.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeDescriptor.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeDescriptor.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeDescriptor.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeDescriptor.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeDescriptor.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeDescriptor.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeDescriptor.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeDescriptor.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeDescriptor.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeDescriptor.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeDescriptor.reference_bundle_ref,
    package_ref: vendorRuntimeDescriptor.package_ref,
    template_ref: vendorRuntimeDescriptor.template_ref,
    template_certification_ref: vendorRuntimeDescriptor.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeDescriptor.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_definition_schema,
    deterministic_runtime_definition_identity,
    vendor_runtime_descriptor_binding,
    runtime_definition_composition,
    runtime_definition_manifest,
    defined_runtime_entries: {
      count: 0,
      entries: [],
      defining_policy:
        'concrete vendor runtimes may be defined from this runtime definition only in a future implementation phase; none are defined here',
      defines_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_definition_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_descriptor: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      defines_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_DEFINITION_PATH, vendorRuntimeDefinition);
  return { vendorRuntimeDefinition };
}
