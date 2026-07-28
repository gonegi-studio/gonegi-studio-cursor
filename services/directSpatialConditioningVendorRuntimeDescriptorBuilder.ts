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
  VENDOR_RUNTIME_CONTRACT_ID,
  VENDOR_RUNTIME_CONTRACT_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_CONTRACT_PATH,
  VENDOR_RUNTIME_CONTRACT_SCHEMA_PATH,
  VENDOR_RUNTIME_CONTRACT_VERSION,
  DSC_VENDOR_RUNTIME_CONTRACT_PHASE,
  DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID,
  type DirectSpatialConditioningVendorRuntimeContract,
} from './directSpatialConditioningVendorRuntimeContractBuilder.js';

/**
 * PHASE-DSC-099: Direct Spatial Conditioning vendor runtime descriptor.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Describes the PHASE-097 Vendor
 * Runtime Contract as the sole design-time publication root:
 *   - runtime descriptor schema,
 *   - deterministic runtime descriptor identity,
 *   - Vendor Runtime Contract binding,
 *   - runtime descriptor composition, and
 *   - runtime descriptor manifest.
 *
 * The descriptor seals three design sections directly (runtime contract
 * artifact, schema, implementation registry) and seals everything the runtime
 * contract owns transitively through the runtime contract digest. It describes
 * no concrete runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE = 'PHASE-DSC-099' as const;
export const DSC_VENDOR_RUNTIME_DESCRIPTOR_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DESCRIPTOR_V1' as const;

export const VENDOR_RUNTIME_DESCRIPTOR_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_DESCRIPTOR_PATH =
  `${VENDOR_RUNTIME_DESCRIPTOR_ROOT}/direct-spatial-conditioning-vendor-runtime-descriptor-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime descriptor. */
export const VENDOR_RUNTIME_DESCRIPTOR_ID = 'dsc-vendor-runtime-descriptor-v1' as const;
export const VENDOR_RUNTIME_DESCRIPTOR_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-097 vendor runtime contract. */
export const VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CONTRACT_VALIDATION_REPORT.json' as const;

export const VENDOR_RUNTIME_CONTRACT_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CONTRACT_V1' as const;

export const VENDOR_RUNTIME_DESCRIPTOR_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-descriptor.schema.json' as const;
export const VENDOR_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-descriptor-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_DESCRIPTOR_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DESCRIPTOR_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime descriptor sections. Only the runtime contract's own
 * design-time contract set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_DESCRIPTOR_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_contract_artifact'
    | 'runtime_contract_schema'
    | 'runtime_contract_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_contract',
    role: 'runtime_descriptor_root_contract',
    kind: 'runtime_contract_artifact',
    artifact_ref: VENDOR_RUNTIME_CONTRACT_PATH,
  },
  {
    section_id: 'vendor_runtime_contract_schema',
    role: 'runtime_contract_shape_contract',
    kind: 'runtime_contract_schema',
    artifact_ref: VENDOR_RUNTIME_CONTRACT_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_contract_implementation_registry',
    role: 'runtime_contract_provenance_registry',
    kind: 'runtime_contract_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_CONTRACT_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeDescriptorSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeDescriptorSchema {
  schema_id: 'dsc-vendor-runtime-descriptor-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_descriptor_id_policy: 'opaque_runtime_descriptor_id_no_vendor_binding';
  runtime_contract_ref: typeof VENDOR_RUNTIME_CONTRACT_ID;
  required_fields: RuntimeDescriptorSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeDescriptorIdentity {
  identity_id: 'dsc-vendor-runtime-descriptor-deterministic-identity-v1';
  description: string;
  runtime_descriptor_id: typeof VENDOR_RUNTIME_DESCRIPTOR_ID;
  runtime_descriptor_version: typeof VENDOR_RUNTIME_DESCRIPTOR_VERSION;
  identity_policy: 'opaque_runtime_descriptor_id_no_vendor_binding';
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

export interface VendorRuntimeContractBinding {
  binding_id: 'dsc-vendor-runtime-descriptor-contract-binding-v1';
  description: string;
  runtime_contract_ref: string;
  runtime_contract_id: typeof VENDOR_RUNTIME_CONTRACT_ID;
  runtime_contract_version: typeof VENDOR_RUNTIME_CONTRACT_VERSION;
  runtime_contract_phase: typeof DSC_VENDOR_RUNTIME_CONTRACT_PHASE;
  runtime_contract_system_id: typeof DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID;
  runtime_contract_evidence_ref: string;
  runtime_contract_verdict: typeof VENDOR_RUNTIME_CONTRACT_VERDICT;
  runtime_contract_evidence_mode: 'phase_097_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_descriptor_root';
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
  describes_runtime_in_this_phase: false;
  implements_runtime_contract_in_this_phase: false;
}

export interface RuntimeDescriptorSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeDescriptorComposition {
  composition_id: 'dsc-vendor-runtime-descriptor-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_contract';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeDescriptorSection[];
  transitive_seal: {
    policy: 'runtime_contract_contents_sealed_via_runtime_contract_digest';
    sealed_via: typeof VENDOR_RUNTIME_CONTRACT_ID;
    sealed_component_count: number;
    re_lists_runtime_contract_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeDescriptorManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeDescriptorManifest {
  manifest_id: 'dsc-vendor-runtime-descriptor-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeDescriptorManifestEntry[];
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
  runtime_descriptor_digest: string;
  runtime_descriptor_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_contract_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeDescriptor {
  vendor_runtime_descriptor_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_DESCRIPTOR_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_descriptor';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DESCRIPTOR_V1';
  runtime_descriptor_id: typeof VENDOR_RUNTIME_DESCRIPTOR_ID;
  runtime_descriptor_version: typeof VENDOR_RUNTIME_DESCRIPTOR_VERSION;
  runtime_descriptor_kind: 'vendor_runtime_descriptor';
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
  runtime_descriptor_schema: VendorRuntimeDescriptorSchema;
  deterministic_runtime_descriptor_identity: DeterministicRuntimeDescriptorIdentity;
  vendor_runtime_contract_binding: VendorRuntimeContractBinding;
  runtime_descriptor_composition: RuntimeDescriptorComposition;
  runtime_descriptor_manifest: RuntimeDescriptorManifest;
  described_runtime_entries: {
    count: 0;
    entries: [];
    describing_policy: string;
    describes_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_descriptor_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_contract: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    describes_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime descriptor.
 * Reuses the PHASE-097 Vendor Runtime Contract by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime descriptor artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeDescriptor(
  projectRoot?: string
): { vendorRuntimeDescriptor: DirectSpatialConditioningVendorRuntimeDescriptor } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-097 vendor runtime contract did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_CONTRACT_VERDICT) {
    throw new Error(
      `PHASE-097 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_CONTRACT_PHASE) {
    throw new Error('PHASE-097 evidence does not cover the vendor runtime contract');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-097 evidence reports outstanding errors');
  }

  const vendorRuntimeContract = readJson<DirectSpatialConditioningVendorRuntimeContract>(
    root,
    VENDOR_RUNTIME_CONTRACT_PATH
  );
  if (
    vendorRuntimeContract.phase !== DSC_VENDOR_RUNTIME_CONTRACT_PHASE ||
    vendorRuntimeContract.system_id !== DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID
  ) {
    throw new Error('PHASE-097 vendor runtime contract is missing or incompatible');
  }
  if (vendorRuntimeContract.runtime_contract_id !== VENDOR_RUNTIME_CONTRACT_ID) {
    throw new Error('Vendor runtime contract identity drifted');
  }
  if (vendorRuntimeContract.runtime_contract_version !== VENDOR_RUNTIME_CONTRACT_VERSION) {
    throw new Error('Vendor runtime contract version drifted');
  }
  if (!vendorRuntimeContract.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime contract must remain vendor neutral');
  }
  if (!vendorRuntimeContract.design_constraints.reuses_certified_vendor_runtime_specification) {
    throw new Error(
      'Vendor runtime contract must reuse the certified vendor runtime specification'
    );
  }
  if (vendorRuntimeContract.contracted_runtime_entries.count !== 0) {
    throw new Error('PHASE-097 must not have contracted runtime entries');
  }
  if (vendorRuntimeContract.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-097 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeContract.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime contract channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeContract.sources_supported) !== JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime contract sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeContract.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime contract spatial frame drifted');
  }
  if (
    vendorRuntimeContract.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeContract.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime contract capability set identity drifted');
  }

  const runtimeContractManifest = vendorRuntimeContract.runtime_contract_manifest;
  for (const entry of runtimeContractManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed runtime contract section missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed runtime contract section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const recomputedRuntimeContractDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeContractManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_specification:${runtimeContractManifest.sealed_runtime_specification_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeContractDigest !== runtimeContractManifest.runtime_contract_digest
  ) {
    throw new Error(
      'sealed runtime contract digest drifted from the runtime contract manifest'
    );
  }
  const sealedComponentCount = runtimeContractManifest.sealed_component_count;

  for (const spec of RUNTIME_DESCRIPTOR_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime descriptor section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_DESCRIPTOR_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime descriptor section id');
  }
  const sectionRefs = RUNTIME_DESCRIPTOR_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime descriptor section artifact ref');
  }

  const runtime_descriptor_schema: VendorRuntimeDescriptorSchema = {
    schema_id: 'dsc-vendor-runtime-descriptor-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime descriptor. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime descriptor binds one Vendor Runtime Contract as its root, seals the contract together with its schema and implementation registry, and seals the contract contents transitively through the runtime contract digest. It describes no concrete runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_descriptor_id_policy: 'opaque_runtime_descriptor_id_no_vendor_binding',
    runtime_contract_ref: VENDOR_RUNTIME_CONTRACT_ID,
    required_fields: [
      {
        field: 'runtime_descriptor_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_descriptor_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime descriptor version string',
      },
      {
        field: 'runtime_descriptor_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_descriptor',
      },
      {
        field: 'runtime_contract_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime contract ${VENDOR_RUNTIME_CONTRACT_ID}`,
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
        field: 'deterministic_runtime_descriptor_identity',
        type: 'dsc-vendor-runtime-descriptor-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_contract_binding',
        type: 'dsc-vendor-runtime-descriptor-contract-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Contract as the runtime descriptor root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_descriptor_composition',
        type: 'dsc-vendor-runtime-descriptor-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime contract artifact, schema, and implementation registry sections; vendor-specific sections forbidden and contract contents never re-listed',
      },
      {
        field: 'runtime_descriptor_manifest',
        type: 'dsc-vendor-runtime-descriptor-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime contract digest and a runtime descriptor digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_descriptor_identity: DeterministicRuntimeDescriptorIdentity = {
    identity_id: 'dsc-vendor-runtime-descriptor-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime descriptor. The runtime_descriptor_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_descriptor_id: VENDOR_RUNTIME_DESCRIPTOR_ID,
    runtime_descriptor_version: VENDOR_RUNTIME_DESCRIPTOR_VERSION,
    identity_policy: 'opaque_runtime_descriptor_id_no_vendor_binding',
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

  const vendor_runtime_contract_binding: VendorRuntimeContractBinding = {
    binding_id: 'dsc-vendor-runtime-descriptor-contract-binding-v1',
    description:
      'Exact binding of the PHASE-097 Vendor Runtime Contract as the runtime descriptor root. The binding is gated at build time on the recorded PHASE-097 PASS verdict, and re-seals every runtime contract section and the runtime contract digest before the runtime descriptor is emitted.',
    runtime_contract_ref: VENDOR_RUNTIME_CONTRACT_PATH,
    runtime_contract_id: VENDOR_RUNTIME_CONTRACT_ID,
    runtime_contract_version: VENDOR_RUNTIME_CONTRACT_VERSION,
    runtime_contract_phase: DSC_VENDOR_RUNTIME_CONTRACT_PHASE,
    runtime_contract_system_id: DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID,
    runtime_contract_evidence_ref: VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH,
    runtime_contract_verdict: VENDOR_RUNTIME_CONTRACT_VERDICT,
    runtime_contract_evidence_mode: 'phase_097_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_descriptor_root',
    sealed_runtime_contract_digest: runtimeContractManifest.runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeContractManifest.sealed_runtime_specification_digest,
    sealed_runtime_template_digest: runtimeContractManifest.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeContractManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeContractManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeContractManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeContractManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeContractManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeContractManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeContractManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    describes_runtime_in_this_phase: false,
    implements_runtime_contract_in_this_phase: false,
  };

  const runtime_descriptor_composition: RuntimeDescriptorComposition = {
    composition_id: 'dsc-vendor-runtime-descriptor-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Contract: the runtime contract artifact, its shape contract, and its implementation registry. The runtime contract contents (and everything sealed beneath them) are sealed transitively through the runtime contract digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_contract',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_DESCRIPTOR_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_contract_contents_sealed_via_runtime_contract_digest',
      sealed_via: VENDOR_RUNTIME_CONTRACT_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_contract_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeDescriptorManifestEntry[] = RUNTIME_DESCRIPTOR_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_descriptor_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_contract:${runtimeContractManifest.runtime_contract_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_descriptor_manifest: RuntimeDescriptorManifest = {
    manifest_id: 'dsc-vendor-runtime-descriptor-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime descriptor section. Digests are computed read-only from disk. The sealed runtime contract digest carries the contract contents (and everything sealed beneath them) transitively, and the runtime descriptor digest is the SHA256 of the ordered section digests and the sealed runtime contract digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_contract_digest: runtimeContractManifest.runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeContractManifest.sealed_runtime_specification_digest,
    sealed_runtime_template_digest: runtimeContractManifest.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeContractManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeContractManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeContractManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeContractManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeContractManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeContractManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeContractManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_descriptor_digest,
    runtime_descriptor_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_contract_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeDescriptor: DirectSpatialConditioningVendorRuntimeDescriptor = {
    vendor_runtime_descriptor_id: 'direct-spatial-conditioning-vendor-runtime-descriptor-v1',
    phase: DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE,
    system_id: DSC_VENDOR_RUNTIME_DESCRIPTOR_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_descriptor',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DESCRIPTOR_V1',
    runtime_descriptor_id: VENDOR_RUNTIME_DESCRIPTOR_ID,
    runtime_descriptor_version: VENDOR_RUNTIME_DESCRIPTOR_VERSION,
    runtime_descriptor_kind: 'vendor_runtime_descriptor',
    runtime_contract_ref: VENDOR_RUNTIME_CONTRACT_PATH,
    runtime_contract_schema_ref: VENDOR_RUNTIME_CONTRACT_SCHEMA_PATH,
    runtime_contract_implementation_registry_ref: VENDOR_RUNTIME_CONTRACT_IMPLEMENTATION_REGISTRY_PATH,
    runtime_contract_evidence_ref: VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH,
    runtime_specification_ref: vendorRuntimeContract.runtime_specification_ref,
    runtime_specification_schema_ref: vendorRuntimeContract.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeContract.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref: vendorRuntimeContract.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeContract.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeContract.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeContract.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeContract.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeContract.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeContract.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeContract.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeContract.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeContract.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeContract.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeContract.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeContract.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeContract.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeContract.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeContract.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeContract.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeContract.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeContract.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeContract.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeContract.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeContract.reference_bundle_ref,
    package_ref: vendorRuntimeContract.package_ref,
    template_ref: vendorRuntimeContract.template_ref,
    template_certification_ref: vendorRuntimeContract.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeContract.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_descriptor_schema,
    deterministic_runtime_descriptor_identity,
    vendor_runtime_contract_binding,
    runtime_descriptor_composition,
    runtime_descriptor_manifest,
    described_runtime_entries: {
      count: 0,
      entries: [],
      describing_policy:
        'concrete vendor runtimes may be described from this runtime descriptor only in a future implementation phase; none are described here',
      describes_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_descriptor_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_contract: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      describes_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_DESCRIPTOR_PATH, vendorRuntimeDescriptor);
  return { vendorRuntimeDescriptor };
}
