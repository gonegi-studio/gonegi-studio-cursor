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
  DSC_VENDOR_RUNTIME_SPECIFICATION_PHASE,
  DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID,
  VENDOR_RUNTIME_SPECIFICATION_ID,
  VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_SPECIFICATION_PATH,
  VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH,
  VENDOR_RUNTIME_SPECIFICATION_VERSION,
  type DirectSpatialConditioningVendorRuntimeSpecification,
} from './directSpatialConditioningVendorRuntimeSpecificationBuilder.js';

/**
 * PHASE-DSC-097: Direct Spatial Conditioning vendor runtime contract.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Contracts the PHASE-095 Vendor
 * Runtime Specification as the sole design-time publication root:
 *   - runtime contract schema,
 *   - deterministic runtime contract identity,
 *   - Vendor Runtime Specification binding,
 *   - runtime contract composition, and
 *   - runtime contract manifest.
 *
 * The contract seals three design sections directly (runtime specification
 * artifact, schema, implementation registry) and seals everything the runtime
 * specification owns transitively through the runtime specification digest. It
 * contracts no concrete runtime, implements no vendor, declares no runtime
 * execution, performs no GPU or inference work, and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_CONTRACT_PHASE = 'PHASE-DSC-097' as const;
export const DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CONTRACT_V1' as const;

export const VENDOR_RUNTIME_CONTRACT_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_CONTRACT_PATH =
  `${VENDOR_RUNTIME_CONTRACT_ROOT}/direct-spatial-conditioning-vendor-runtime-contract-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime contract. */
export const VENDOR_RUNTIME_CONTRACT_ID = 'dsc-vendor-runtime-contract-v1' as const;
export const VENDOR_RUNTIME_CONTRACT_VERSION = '1.0' as const;

/** Design-time contract set of the passing PHASE-095 runtime specification. */
export const VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_SPECIFICATION_VALIDATION_REPORT.json' as const;

export const VENDOR_RUNTIME_SPECIFICATION_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_SPECIFICATION_V1' as const;

export const VENDOR_RUNTIME_CONTRACT_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-contract.schema.json' as const;
export const VENDOR_RUNTIME_CONTRACT_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-contract-implementation-registry-v1.json' as const;

/**
 * Ordered runtime contract sections. Only the runtime specification's own
 * design-time contract set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_CONTRACT_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_specification_artifact'
    | 'runtime_specification_schema'
    | 'runtime_specification_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_specification',
    role: 'runtime_contract_root_specification',
    kind: 'runtime_specification_artifact',
    artifact_ref: VENDOR_RUNTIME_SPECIFICATION_PATH,
  },
  {
    section_id: 'vendor_runtime_specification_schema',
    role: 'runtime_specification_shape_contract',
    kind: 'runtime_specification_schema',
    artifact_ref: VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_specification_implementation_registry',
    role: 'runtime_specification_provenance_registry',
    kind: 'runtime_specification_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeContractSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeContractSchema {
  schema_id: 'dsc-vendor-runtime-contract-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_contract_id_policy: 'opaque_runtime_contract_id_no_vendor_binding';
  runtime_specification_ref: typeof VENDOR_RUNTIME_SPECIFICATION_ID;
  required_fields: RuntimeContractSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeContractIdentity {
  identity_id: 'dsc-vendor-runtime-contract-deterministic-identity-v1';
  description: string;
  runtime_contract_id: typeof VENDOR_RUNTIME_CONTRACT_ID;
  runtime_contract_version: typeof VENDOR_RUNTIME_CONTRACT_VERSION;
  identity_policy: 'opaque_runtime_contract_id_no_vendor_binding';
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

export interface VendorRuntimeSpecificationBinding {
  binding_id: 'dsc-vendor-runtime-contract-specification-binding-v1';
  description: string;
  runtime_specification_ref: string;
  runtime_specification_id: typeof VENDOR_RUNTIME_SPECIFICATION_ID;
  runtime_specification_version: typeof VENDOR_RUNTIME_SPECIFICATION_VERSION;
  runtime_specification_phase: typeof DSC_VENDOR_RUNTIME_SPECIFICATION_PHASE;
  runtime_specification_system_id: typeof DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID;
  runtime_specification_evidence_ref: string;
  runtime_specification_verdict: typeof VENDOR_RUNTIME_SPECIFICATION_VERDICT;
  runtime_specification_evidence_mode: 'phase_095_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_contract_root';
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
  contracts_runtime_in_this_phase: false;
  implements_runtime_specification_in_this_phase: false;
}

export interface RuntimeContractSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeContractComposition {
  composition_id: 'dsc-vendor-runtime-contract-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_specification';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeContractSection[];
  transitive_seal: {
    policy: 'runtime_specification_contents_sealed_via_runtime_specification_digest';
    sealed_via: typeof VENDOR_RUNTIME_SPECIFICATION_ID;
    sealed_component_count: number;
    re_lists_runtime_specification_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeContractManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeContractManifest {
  manifest_id: 'dsc-vendor-runtime-contract-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeContractManifestEntry[];
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
  runtime_contract_digest: string;
  runtime_contract_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_specification_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeContract {
  vendor_runtime_contract_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_CONTRACT_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_contract';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CONTRACT_V1';
  runtime_contract_id: typeof VENDOR_RUNTIME_CONTRACT_ID;
  runtime_contract_version: typeof VENDOR_RUNTIME_CONTRACT_VERSION;
  runtime_contract_kind: 'vendor_runtime_contract';
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
  runtime_contract_schema: VendorRuntimeContractSchema;
  deterministic_runtime_contract_identity: DeterministicRuntimeContractIdentity;
  vendor_runtime_specification_binding: VendorRuntimeSpecificationBinding;
  runtime_contract_composition: RuntimeContractComposition;
  runtime_contract_manifest: RuntimeContractManifest;
  contracted_runtime_entries: {
    count: 0;
    entries: [];
    contracting_policy: string;
    contracts_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_contract_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_specification: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    contracts_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime contract.
 * Reuses the PHASE-095 Vendor Runtime Specification by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime contract artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeContract(
  projectRoot?: string
): { vendorRuntimeContract: DirectSpatialConditioningVendorRuntimeContract } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-095 vendor runtime specification did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_SPECIFICATION_VERDICT) {
    throw new Error(
      `PHASE-095 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_SPECIFICATION_PHASE) {
    throw new Error('PHASE-095 evidence does not cover the vendor runtime specification');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-095 evidence reports outstanding errors');
  }

  const runtimeSpecification = readJson<DirectSpatialConditioningVendorRuntimeSpecification>(
    root,
    VENDOR_RUNTIME_SPECIFICATION_PATH
  );
  if (
    runtimeSpecification.phase !== DSC_VENDOR_RUNTIME_SPECIFICATION_PHASE ||
    runtimeSpecification.system_id !== DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID
  ) {
    throw new Error('PHASE-095 vendor runtime specification is missing or incompatible');
  }
  if (runtimeSpecification.runtime_specification_id !== VENDOR_RUNTIME_SPECIFICATION_ID) {
    throw new Error('Vendor runtime specification identity drifted');
  }
  if (runtimeSpecification.runtime_specification_version !== VENDOR_RUNTIME_SPECIFICATION_VERSION) {
    throw new Error('Vendor runtime specification version drifted');
  }
  if (!runtimeSpecification.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime specification must remain vendor neutral');
  }
  if (!runtimeSpecification.design_constraints.reuses_certified_vendor_runtime_template) {
    throw new Error(
      'Vendor runtime specification must reuse the certified vendor runtime template'
    );
  }
  if (runtimeSpecification.specified_runtime_entries.count !== 0) {
    throw new Error('PHASE-095 must not have specified runtime entries');
  }
  if (runtimeSpecification.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-095 must not declare runtime execution');
  }
  if (
    JSON.stringify(runtimeSpecification.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime specification channels do not match foundation channels');
  }
  if (
    JSON.stringify(runtimeSpecification.sources_supported) !== JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime specification sources_supported drifted from the certified corpus'
    );
  }
  if (runtimeSpecification.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime specification spatial frame drifted');
  }
  if (
    runtimeSpecification.capability_set_id !== CAPABILITY_SET_ID ||
    runtimeSpecification.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime specification capability set identity drifted');
  }

  const runtimeSpecificationManifest = runtimeSpecification.runtime_specification_manifest;
  for (const entry of runtimeSpecificationManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(
        `sealed runtime specification section missing on disk: ${entry.artifact_ref}`
      );
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(
        `sealed runtime specification section digest drifted: ${entry.artifact_ref}`
      );
    }
  }
  const recomputedRuntimeSpecificationDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeSpecificationManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_template:${runtimeSpecificationManifest.sealed_runtime_template_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeSpecificationDigest !==
    runtimeSpecificationManifest.runtime_specification_digest
  ) {
    throw new Error(
      'sealed runtime specification digest drifted from the runtime specification manifest'
    );
  }
  const sealedComponentCount = runtimeSpecificationManifest.sealed_component_count;

  for (const spec of RUNTIME_CONTRACT_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime contract section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_CONTRACT_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime contract section id');
  }
  const sectionRefs = RUNTIME_CONTRACT_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime contract section artifact ref');
  }

  const runtime_contract_schema: VendorRuntimeContractSchema = {
    schema_id: 'dsc-vendor-runtime-contract-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime contract. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime contract binds one Vendor Runtime Specification as its root, seals the specification together with its schema and implementation registry, and seals the specification contents transitively through the runtime specification digest. It contracts no concrete runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_contract_id_policy: 'opaque_runtime_contract_id_no_vendor_binding',
    runtime_specification_ref: VENDOR_RUNTIME_SPECIFICATION_ID,
    required_fields: [
      {
        field: 'runtime_contract_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_contract_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime contract version string',
      },
      {
        field: 'runtime_contract_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_contract',
      },
      {
        field: 'runtime_specification_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime specification ${VENDOR_RUNTIME_SPECIFICATION_ID}`,
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
        field: 'deterministic_runtime_contract_identity',
        type: 'dsc-vendor-runtime-contract-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_specification_binding',
        type: 'dsc-vendor-runtime-contract-specification-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Specification as the runtime contract root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_contract_composition',
        type: 'dsc-vendor-runtime-contract-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime specification artifact, schema, and implementation registry sections; vendor-specific sections forbidden and specification contents never re-listed',
      },
      {
        field: 'runtime_contract_manifest',
        type: 'dsc-vendor-runtime-contract-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime specification digest and a runtime contract digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_contract_identity: DeterministicRuntimeContractIdentity = {
    identity_id: 'dsc-vendor-runtime-contract-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime contract. The runtime_contract_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_contract_id: VENDOR_RUNTIME_CONTRACT_ID,
    runtime_contract_version: VENDOR_RUNTIME_CONTRACT_VERSION,
    identity_policy: 'opaque_runtime_contract_id_no_vendor_binding',
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

  const vendor_runtime_specification_binding: VendorRuntimeSpecificationBinding = {
    binding_id: 'dsc-vendor-runtime-contract-specification-binding-v1',
    description:
      'Exact binding of the PHASE-095 Vendor Runtime Specification as the runtime contract root. The binding is gated at build time on the recorded PHASE-095 PASS verdict, and re-seals every runtime specification section and the runtime specification digest before the runtime contract is emitted.',
    runtime_specification_ref: VENDOR_RUNTIME_SPECIFICATION_PATH,
    runtime_specification_id: VENDOR_RUNTIME_SPECIFICATION_ID,
    runtime_specification_version: VENDOR_RUNTIME_SPECIFICATION_VERSION,
    runtime_specification_phase: DSC_VENDOR_RUNTIME_SPECIFICATION_PHASE,
    runtime_specification_system_id: DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID,
    runtime_specification_evidence_ref: VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH,
    runtime_specification_verdict: VENDOR_RUNTIME_SPECIFICATION_VERDICT,
    runtime_specification_evidence_mode: 'phase_095_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_contract_root',
    sealed_runtime_specification_digest:
      runtimeSpecificationManifest.runtime_specification_digest,
    sealed_runtime_template_digest: runtimeSpecificationManifest.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeSpecificationManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeSpecificationManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeSpecificationManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeSpecificationManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeSpecificationManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeSpecificationManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeSpecificationManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    contracts_runtime_in_this_phase: false,
    implements_runtime_specification_in_this_phase: false,
  };

  const runtime_contract_composition: RuntimeContractComposition = {
    composition_id: 'dsc-vendor-runtime-contract-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Specification: the runtime specification artifact, its shape contract, and its implementation registry. The runtime specification contents (and everything sealed beneath them) are sealed transitively through the runtime specification digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_specification',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_CONTRACT_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_specification_contents_sealed_via_runtime_specification_digest',
      sealed_via: VENDOR_RUNTIME_SPECIFICATION_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_specification_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeContractManifestEntry[] = RUNTIME_CONTRACT_SECTION_SPECS.map((spec) => ({
    section_id: spec.section_id,
    artifact_ref: spec.artifact_ref,
    sha256: sha256(root, spec.artifact_ref),
    bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
    content_addressed: true as const,
  }));

  const runtime_contract_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_specification:${runtimeSpecificationManifest.runtime_specification_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_contract_manifest: RuntimeContractManifest = {
    manifest_id: 'dsc-vendor-runtime-contract-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime contract section. Digests are computed read-only from disk. The sealed runtime specification digest carries the specification contents (and everything sealed beneath them) transitively, and the runtime contract digest is the SHA256 of the ordered section digests and the sealed runtime specification digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_specification_digest:
      runtimeSpecificationManifest.runtime_specification_digest,
    sealed_runtime_template_digest: runtimeSpecificationManifest.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeSpecificationManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeSpecificationManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeSpecificationManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeSpecificationManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeSpecificationManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeSpecificationManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeSpecificationManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_contract_digest,
    runtime_contract_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_specification_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeContract: DirectSpatialConditioningVendorRuntimeContract = {
    vendor_runtime_contract_id: 'direct-spatial-conditioning-vendor-runtime-contract-v1',
    phase: DSC_VENDOR_RUNTIME_CONTRACT_PHASE,
    system_id: DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_contract',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CONTRACT_V1',
    runtime_contract_id: VENDOR_RUNTIME_CONTRACT_ID,
    runtime_contract_version: VENDOR_RUNTIME_CONTRACT_VERSION,
    runtime_contract_kind: 'vendor_runtime_contract',
    runtime_specification_ref: VENDOR_RUNTIME_SPECIFICATION_PATH,
    runtime_specification_schema_ref: VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH,
    runtime_specification_implementation_registry_ref:
      VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH,
    runtime_specification_evidence_ref: VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH,
    runtime_template_ref: runtimeSpecification.runtime_template_ref,
    runtime_template_schema_ref: runtimeSpecification.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      runtimeSpecification.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: runtimeSpecification.runtime_template_evidence_ref,
    runtime_family_ref: runtimeSpecification.runtime_family_ref,
    runtime_family_schema_ref: runtimeSpecification.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      runtimeSpecification.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: runtimeSpecification.runtime_family_evidence_ref,
    runtime_catalog_ref: runtimeSpecification.runtime_catalog_ref,
    runtime_catalog_schema_ref: runtimeSpecification.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      runtimeSpecification.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: runtimeSpecification.runtime_catalog_evidence_ref,
    runtime_index_ref: runtimeSpecification.runtime_index_ref,
    runtime_index_schema_ref: runtimeSpecification.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      runtimeSpecification.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: runtimeSpecification.runtime_index_evidence_ref,
    runtime_registry_ref: runtimeSpecification.runtime_registry_ref,
    runtime_profile_ref: runtimeSpecification.runtime_profile_ref,
    runtime_bundle_ref: runtimeSpecification.runtime_bundle_ref,
    runtime_package_ref: runtimeSpecification.runtime_package_ref,
    reference_bundle_ref: runtimeSpecification.reference_bundle_ref,
    package_ref: runtimeSpecification.package_ref,
    template_ref: runtimeSpecification.template_ref,
    template_certification_ref: runtimeSpecification.template_certification_ref,
    numerical_runtime_package_ref: runtimeSpecification.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_contract_schema,
    deterministic_runtime_contract_identity,
    vendor_runtime_specification_binding,
    runtime_contract_composition,
    runtime_contract_manifest,
    contracted_runtime_entries: {
      count: 0,
      entries: [],
      contracting_policy:
        'concrete vendor runtimes may be contracted from this runtime contract only in a future implementation phase; none are contracted here',
      contracts_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_contract_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_specification: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      contracts_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_CONTRACT_PATH, vendorRuntimeContract);
  return { vendorRuntimeContract };
}
