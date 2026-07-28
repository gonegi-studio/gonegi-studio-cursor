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
  DSC_VENDOR_RUNTIME_DEFINITION_PHASE,
  DSC_VENDOR_RUNTIME_DEFINITION_SYSTEM_ID,
  VENDOR_RUNTIME_DEFINITION_ID,
  VENDOR_RUNTIME_DEFINITION_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_DEFINITION_PATH,
  VENDOR_RUNTIME_DEFINITION_SCHEMA_PATH,
  VENDOR_RUNTIME_DEFINITION_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_DEFINITION_VERSION,
  type DirectSpatialConditioningVendorRuntimeDefinition,
} from './directSpatialConditioningVendorRuntimeDefinitionBuilder.js';

/**
 * PHASE-DSC-103: Direct Spatial Conditioning vendor runtime blueprint.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Describes the PHASE-101 Vendor
 * Runtime Definition as the sole design-time publication root:
 *   - runtime blueprint schema,
 *   - deterministic runtime blueprint identity,
 *   - Vendor Runtime Definition binding,
 *   - runtime blueprint composition, and
 *   - runtime blueprint manifest.
 *
 * The blueprint seals three design sections directly (runtime definition
 * artifact, schema, implementation registry) and seals everything the runtime
 * definition owns transitively through the runtime definition digest. It defines
 * no concrete runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_BLUEPRINT_PHASE = 'PHASE-DSC-103' as const;
export const DSC_VENDOR_RUNTIME_BLUEPRINT_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BLUEPRINT_V1' as const;

export const VENDOR_RUNTIME_BLUEPRINT_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_BLUEPRINT_PATH =
  `${VENDOR_RUNTIME_BLUEPRINT_ROOT}/direct-spatial-conditioning-vendor-runtime-blueprint-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime blueprint. */
export const VENDOR_RUNTIME_BLUEPRINT_ID = 'dsc-vendor-runtime-blueprint-v1' as const;
export const VENDOR_RUNTIME_BLUEPRINT_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-101 vendor runtime definition. */
export const VENDOR_RUNTIME_DEFINITION_EVIDENCE_PATH =
  VENDOR_RUNTIME_DEFINITION_VALIDATION_REPORT_PATH;

export const VENDOR_RUNTIME_DEFINITION_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DEFINITION_V1' as const;

export const VENDOR_RUNTIME_BLUEPRINT_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-blueprint.schema.json' as const;
export const VENDOR_RUNTIME_BLUEPRINT_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-blueprint-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_BLUEPRINT_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BLUEPRINT_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime blueprint sections. Only the runtime definition's own
 * design-time definition set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_BLUEPRINT_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_definition_artifact'
    | 'runtime_definition_schema'
    | 'runtime_definition_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_definition',
    role: 'runtime_blueprint_root_definition',
    kind: 'runtime_definition_artifact',
    artifact_ref: VENDOR_RUNTIME_DEFINITION_PATH,
  },
  {
    section_id: 'vendor_runtime_definition_schema',
    role: 'runtime_definition_shape_contract',
    kind: 'runtime_definition_schema',
    artifact_ref: VENDOR_RUNTIME_DEFINITION_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_definition_implementation_registry',
    role: 'runtime_definition_provenance_registry',
    kind: 'runtime_definition_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_DEFINITION_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeBlueprintSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeBlueprintSchema {
  schema_id: 'dsc-vendor-runtime-blueprint-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_blueprint_id_policy: 'opaque_runtime_blueprint_id_no_vendor_binding';
  runtime_definition_ref: typeof VENDOR_RUNTIME_DEFINITION_ID;
  required_fields: RuntimeBlueprintSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeBlueprintIdentity {
  identity_id: 'dsc-vendor-runtime-blueprint-deterministic-identity-v1';
  description: string;
  runtime_blueprint_id: typeof VENDOR_RUNTIME_BLUEPRINT_ID;
  runtime_blueprint_version: typeof VENDOR_RUNTIME_BLUEPRINT_VERSION;
  identity_policy: 'opaque_runtime_blueprint_id_no_vendor_binding';
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

export interface VendorRuntimeDefinitionBinding {
  binding_id: 'dsc-vendor-runtime-blueprint-definition-binding-v1';
  description: string;
  runtime_definition_ref: string;
  runtime_definition_id: typeof VENDOR_RUNTIME_DEFINITION_ID;
  runtime_definition_version: typeof VENDOR_RUNTIME_DEFINITION_VERSION;
  runtime_definition_phase: typeof DSC_VENDOR_RUNTIME_DEFINITION_PHASE;
  runtime_definition_system_id: typeof DSC_VENDOR_RUNTIME_DEFINITION_SYSTEM_ID;
  runtime_definition_evidence_ref: string;
  runtime_definition_verdict: typeof VENDOR_RUNTIME_DEFINITION_VERDICT;
  runtime_definition_evidence_mode: 'phase_101_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_blueprint_root';
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
  blueprints_runtime_in_this_phase: false;
  implements_runtime_definition_in_this_phase: false;
}

export interface RuntimeBlueprintSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeBlueprintComposition {
  composition_id: 'dsc-vendor-runtime-blueprint-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_definition';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeBlueprintSection[];
  transitive_seal: {
    policy: 'runtime_definition_contents_sealed_via_runtime_definition_digest';
    sealed_via: typeof VENDOR_RUNTIME_DEFINITION_ID;
    sealed_component_count: number;
    re_lists_runtime_definition_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeBlueprintManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeBlueprintManifest {
  manifest_id: 'dsc-vendor-runtime-blueprint-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeBlueprintManifestEntry[];
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
  runtime_blueprint_digest: string;
  runtime_blueprint_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_definition_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeBlueprint {
  vendor_runtime_blueprint_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_BLUEPRINT_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_BLUEPRINT_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_blueprint';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BLUEPRINT_V1';
  runtime_blueprint_id: typeof VENDOR_RUNTIME_BLUEPRINT_ID;
  runtime_blueprint_version: typeof VENDOR_RUNTIME_BLUEPRINT_VERSION;
  runtime_blueprint_kind: 'vendor_runtime_blueprint';
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
  runtime_blueprint_schema: VendorRuntimeBlueprintSchema;
  deterministic_runtime_blueprint_identity: DeterministicRuntimeBlueprintIdentity;
  vendor_runtime_definition_binding: VendorRuntimeDefinitionBinding;
  runtime_blueprint_composition: RuntimeBlueprintComposition;
  runtime_blueprint_manifest: RuntimeBlueprintManifest;
  blueprinted_runtime_entries: {
    count: 0;
    entries: [];
    blueprinting_policy: string;
    blueprints_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_blueprint_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_definition: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    blueprints_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime blueprint.
 * Reuses the PHASE-101 Vendor Runtime Definition by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime blueprint artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeBlueprint(
  projectRoot?: string
): { vendorRuntimeBlueprint: DirectSpatialConditioningVendorRuntimeBlueprint } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_DEFINITION_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-101 vendor runtime definition did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_DEFINITION_VERDICT) {
    throw new Error(
      `PHASE-101 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_DEFINITION_PHASE) {
    throw new Error('PHASE-101 evidence does not cover the vendor runtime definition');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-101 evidence reports outstanding errors');
  }

  const vendorRuntimeDefinition = readJson<DirectSpatialConditioningVendorRuntimeDefinition>(
    root,
    VENDOR_RUNTIME_DEFINITION_PATH
  );
  if (
    vendorRuntimeDefinition.phase !== DSC_VENDOR_RUNTIME_DEFINITION_PHASE ||
    vendorRuntimeDefinition.system_id !== DSC_VENDOR_RUNTIME_DEFINITION_SYSTEM_ID
  ) {
    throw new Error('PHASE-101 vendor runtime definition is missing or incompatible');
  }
  if (vendorRuntimeDefinition.runtime_definition_id !== VENDOR_RUNTIME_DEFINITION_ID) {
    throw new Error('Vendor runtime definition identity drifted');
  }
  if (vendorRuntimeDefinition.runtime_definition_version !== VENDOR_RUNTIME_DEFINITION_VERSION) {
    throw new Error('Vendor runtime definition version drifted');
  }
  if (!vendorRuntimeDefinition.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime definition must remain vendor neutral');
  }
  if (!vendorRuntimeDefinition.design_constraints.reuses_certified_vendor_runtime_descriptor) {
    throw new Error(
      'Vendor runtime definition must reuse the certified vendor runtime descriptor'
    );
  }
  if (vendorRuntimeDefinition.defined_runtime_entries.count !== 0) {
    throw new Error('PHASE-101 must not have defined runtime entries');
  }
  if (vendorRuntimeDefinition.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-101 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeDefinition.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime definition channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeDefinition.sources_supported) !== JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime definition sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeDefinition.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime definition spatial frame drifted');
  }
  if (
    vendorRuntimeDefinition.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeDefinition.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime definition capability set identity drifted');
  }

  const runtimeDefinitionManifest = vendorRuntimeDefinition.runtime_definition_manifest;
  for (const entry of runtimeDefinitionManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed runtime definition section missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed runtime definition section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const recomputedRuntimeDefinitionDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeDefinitionManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_descriptor:${runtimeDefinitionManifest.sealed_runtime_descriptor_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeDefinitionDigest !== runtimeDefinitionManifest.runtime_definition_digest
  ) {
    throw new Error(
      'sealed runtime definition digest drifted from the runtime definition manifest'
    );
  }
  const sealedComponentCount = runtimeDefinitionManifest.sealed_component_count;

  for (const spec of RUNTIME_BLUEPRINT_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime blueprint section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_BLUEPRINT_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime blueprint section id');
  }
  const sectionRefs = RUNTIME_BLUEPRINT_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime blueprint section artifact ref');
  }

  const runtime_blueprint_schema: VendorRuntimeBlueprintSchema = {
    schema_id: 'dsc-vendor-runtime-blueprint-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime blueprint. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime blueprint binds one Vendor Runtime Definition as its root, seals the definition together with its schema and implementation registry, and seals the definition contents transitively through the runtime definition digest. It defines no concrete runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_blueprint_id_policy: 'opaque_runtime_blueprint_id_no_vendor_binding',
    runtime_definition_ref: VENDOR_RUNTIME_DEFINITION_ID,
    required_fields: [
      {
        field: 'runtime_blueprint_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_blueprint_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime blueprint version string',
      },
      {
        field: 'runtime_blueprint_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_blueprint',
      },
      {
        field: 'runtime_definition_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime definition ${VENDOR_RUNTIME_DEFINITION_ID}`,
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
        field: 'deterministic_runtime_blueprint_identity',
        type: 'dsc-vendor-runtime-blueprint-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_definition_binding',
        type: 'dsc-vendor-runtime-blueprint-definition-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Definition as the runtime blueprint root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_blueprint_composition',
        type: 'dsc-vendor-runtime-blueprint-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime definition artifact, schema, and implementation registry sections; vendor-specific sections forbidden and definition contents never re-listed',
      },
      {
        field: 'runtime_blueprint_manifest',
        type: 'dsc-vendor-runtime-blueprint-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime definition digest and a runtime blueprint digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_blueprint_identity: DeterministicRuntimeBlueprintIdentity = {
    identity_id: 'dsc-vendor-runtime-blueprint-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime blueprint. The runtime_blueprint_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_blueprint_id: VENDOR_RUNTIME_BLUEPRINT_ID,
    runtime_blueprint_version: VENDOR_RUNTIME_BLUEPRINT_VERSION,
    identity_policy: 'opaque_runtime_blueprint_id_no_vendor_binding',
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

  const vendor_runtime_definition_binding: VendorRuntimeDefinitionBinding = {
    binding_id: 'dsc-vendor-runtime-blueprint-definition-binding-v1',
    description:
      'Exact binding of the PHASE-101 Vendor Runtime Definition as the runtime blueprint root. The binding is gated at build time on the recorded PHASE-101 PASS verdict, and re-seals every runtime definition section and the runtime definition digest before the runtime blueprint is emitted.',
    runtime_definition_ref: VENDOR_RUNTIME_DEFINITION_PATH,
    runtime_definition_id: VENDOR_RUNTIME_DEFINITION_ID,
    runtime_definition_version: VENDOR_RUNTIME_DEFINITION_VERSION,
    runtime_definition_phase: DSC_VENDOR_RUNTIME_DEFINITION_PHASE,
    runtime_definition_system_id: DSC_VENDOR_RUNTIME_DEFINITION_SYSTEM_ID,
    runtime_definition_evidence_ref: VENDOR_RUNTIME_DEFINITION_EVIDENCE_PATH,
    runtime_definition_verdict: VENDOR_RUNTIME_DEFINITION_VERDICT,
    runtime_definition_evidence_mode: 'phase_101_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_blueprint_root',
    sealed_runtime_definition_digest: runtimeDefinitionManifest.runtime_definition_digest,
    sealed_runtime_descriptor_digest: runtimeDefinitionManifest.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest: runtimeDefinitionManifest.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeDefinitionManifest.sealed_runtime_specification_digest,
    sealed_runtime_template_digest: runtimeDefinitionManifest.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeDefinitionManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeDefinitionManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeDefinitionManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeDefinitionManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeDefinitionManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeDefinitionManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeDefinitionManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    blueprints_runtime_in_this_phase: false,
    implements_runtime_definition_in_this_phase: false,
  };

  const runtime_blueprint_composition: RuntimeBlueprintComposition = {
    composition_id: 'dsc-vendor-runtime-blueprint-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Definition: the runtime definition artifact, its shape contract, and its implementation registry. The runtime definition contents (and everything sealed beneath them) are sealed transitively through the runtime definition digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_definition',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_BLUEPRINT_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_definition_contents_sealed_via_runtime_definition_digest',
      sealed_via: VENDOR_RUNTIME_DEFINITION_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_definition_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeBlueprintManifestEntry[] = RUNTIME_BLUEPRINT_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_blueprint_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_definition:${runtimeDefinitionManifest.runtime_definition_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_blueprint_manifest: RuntimeBlueprintManifest = {
    manifest_id: 'dsc-vendor-runtime-blueprint-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime blueprint section. Digests are computed read-only from disk. The sealed runtime definition digest carries the definition contents (and everything sealed beneath them) transitively, and the runtime blueprint digest is the SHA256 of the ordered section digests and the sealed runtime definition digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_definition_digest: runtimeDefinitionManifest.runtime_definition_digest,
    sealed_runtime_descriptor_digest: runtimeDefinitionManifest.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest: runtimeDefinitionManifest.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeDefinitionManifest.sealed_runtime_specification_digest,
    sealed_runtime_template_digest: runtimeDefinitionManifest.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeDefinitionManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeDefinitionManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeDefinitionManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeDefinitionManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeDefinitionManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeDefinitionManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeDefinitionManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_blueprint_digest,
    runtime_blueprint_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_definition_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeBlueprint: DirectSpatialConditioningVendorRuntimeBlueprint = {
    vendor_runtime_blueprint_id: 'direct-spatial-conditioning-vendor-runtime-blueprint-v1',
    phase: DSC_VENDOR_RUNTIME_BLUEPRINT_PHASE,
    system_id: DSC_VENDOR_RUNTIME_BLUEPRINT_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_blueprint',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_BLUEPRINT_V1',
    runtime_blueprint_id: VENDOR_RUNTIME_BLUEPRINT_ID,
    runtime_blueprint_version: VENDOR_RUNTIME_BLUEPRINT_VERSION,
    runtime_blueprint_kind: 'vendor_runtime_blueprint',
    runtime_definition_ref: VENDOR_RUNTIME_DEFINITION_PATH,
    runtime_definition_schema_ref: VENDOR_RUNTIME_DEFINITION_SCHEMA_PATH,
    runtime_definition_implementation_registry_ref:
      VENDOR_RUNTIME_DEFINITION_IMPLEMENTATION_REGISTRY_PATH,
    runtime_definition_evidence_ref: VENDOR_RUNTIME_DEFINITION_EVIDENCE_PATH,
    runtime_descriptor_ref: vendorRuntimeDefinition.runtime_descriptor_ref,
    runtime_descriptor_schema_ref: vendorRuntimeDefinition.runtime_descriptor_schema_ref,
    runtime_descriptor_implementation_registry_ref:
      vendorRuntimeDefinition.runtime_descriptor_implementation_registry_ref,
    runtime_descriptor_evidence_ref: vendorRuntimeDefinition.runtime_descriptor_evidence_ref,
    runtime_contract_ref: vendorRuntimeDefinition.runtime_contract_ref,
    runtime_contract_schema_ref: vendorRuntimeDefinition.runtime_contract_schema_ref,
    runtime_contract_implementation_registry_ref:
      vendorRuntimeDefinition.runtime_contract_implementation_registry_ref,
    runtime_contract_evidence_ref: vendorRuntimeDefinition.runtime_contract_evidence_ref,
    runtime_specification_ref: vendorRuntimeDefinition.runtime_specification_ref,
    runtime_specification_schema_ref: vendorRuntimeDefinition.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeDefinition.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref: vendorRuntimeDefinition.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeDefinition.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeDefinition.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeDefinition.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeDefinition.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeDefinition.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeDefinition.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeDefinition.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeDefinition.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeDefinition.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeDefinition.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeDefinition.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeDefinition.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeDefinition.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeDefinition.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeDefinition.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeDefinition.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeDefinition.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeDefinition.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeDefinition.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeDefinition.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeDefinition.reference_bundle_ref,
    package_ref: vendorRuntimeDefinition.package_ref,
    template_ref: vendorRuntimeDefinition.template_ref,
    template_certification_ref: vendorRuntimeDefinition.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeDefinition.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_blueprint_schema,
    deterministic_runtime_blueprint_identity,
    vendor_runtime_definition_binding,
    runtime_blueprint_composition,
    runtime_blueprint_manifest,
    blueprinted_runtime_entries: {
      count: 0,
      entries: [],
      blueprinting_policy:
        'concrete vendor runtimes may be blueprinted from this runtime blueprint only in a future implementation phase; none are blueprinted here',
      blueprints_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_blueprint_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_definition: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      blueprints_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_BLUEPRINT_PATH, vendorRuntimeBlueprint);
  return { vendorRuntimeBlueprint };
}
