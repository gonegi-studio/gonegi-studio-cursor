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
  DSC_VENDOR_RUNTIME_TEMPLATE_PHASE,
  DSC_VENDOR_RUNTIME_TEMPLATE_SYSTEM_ID,
  VENDOR_RUNTIME_TEMPLATE_ID,
  VENDOR_RUNTIME_TEMPLATE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_TEMPLATE_PATH,
  VENDOR_RUNTIME_TEMPLATE_SCHEMA_PATH,
  VENDOR_RUNTIME_TEMPLATE_VERSION,
  type DirectSpatialConditioningVendorRuntimeTemplate,
} from './directSpatialConditioningVendorRuntimeTemplateBuilder.js';

/**
 * PHASE-DSC-095: Direct Spatial Conditioning vendor runtime specification.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Specifies the PHASE-093 Vendor
 * Runtime Template as the sole design-time publication root:
 *   - runtime specification schema,
 *   - deterministic runtime specification identity,
 *   - Vendor Runtime Template binding,
 *   - runtime specification composition, and
 *   - runtime specification manifest.
 *
 * The specification seals three design sections directly (runtime template
 * artifact, schema, implementation registry) and seals everything the runtime
 * template owns transitively through the runtime template digest. It specifies
 * no concrete runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_SPECIFICATION_PHASE = 'PHASE-DSC-095' as const;
export const DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_SPECIFICATION_V1' as const;

export const VENDOR_RUNTIME_SPECIFICATION_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_SPECIFICATION_PATH =
  `${VENDOR_RUNTIME_SPECIFICATION_ROOT}/direct-spatial-conditioning-vendor-runtime-specification-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime specification. */
export const VENDOR_RUNTIME_SPECIFICATION_ID =
  'dsc-vendor-runtime-specification-v1' as const;
export const VENDOR_RUNTIME_SPECIFICATION_VERSION = '1.0' as const;

/** Design-time contract set of the passing PHASE-093 runtime template. */
export const VENDOR_RUNTIME_TEMPLATE_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_TEMPLATE_VALIDATION_REPORT.json' as const;

export const VENDOR_RUNTIME_TEMPLATE_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_TEMPLATE_V1' as const;

export const VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-specification.schema.json' as const;
export const VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-specification-implementation-registry-v1.json' as const;

/**
 * Ordered runtime specification sections. Only the runtime template's own
 * design-time contract set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_SPECIFICATION_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_template_artifact'
    | 'runtime_template_schema'
    | 'runtime_template_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_template',
    role: 'runtime_specification_root_template',
    kind: 'runtime_template_artifact',
    artifact_ref: VENDOR_RUNTIME_TEMPLATE_PATH,
  },
  {
    section_id: 'vendor_runtime_template_schema',
    role: 'runtime_template_shape_contract',
    kind: 'runtime_template_schema',
    artifact_ref: VENDOR_RUNTIME_TEMPLATE_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_template_implementation_registry',
    role: 'runtime_template_provenance_registry',
    kind: 'runtime_template_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_TEMPLATE_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeSpecificationSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeSpecificationSchema {
  schema_id: 'dsc-vendor-runtime-specification-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_specification_id_policy: 'opaque_runtime_specification_id_no_vendor_binding';
  runtime_template_ref: typeof VENDOR_RUNTIME_TEMPLATE_ID;
  required_fields: RuntimeSpecificationSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeSpecificationIdentity {
  identity_id: 'dsc-vendor-runtime-specification-deterministic-identity-v1';
  description: string;
  runtime_specification_id: typeof VENDOR_RUNTIME_SPECIFICATION_ID;
  runtime_specification_version: typeof VENDOR_RUNTIME_SPECIFICATION_VERSION;
  identity_policy: 'opaque_runtime_specification_id_no_vendor_binding';
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

export interface VendorRuntimeTemplateBinding {
  binding_id: 'dsc-vendor-runtime-specification-template-binding-v1';
  description: string;
  runtime_template_ref: string;
  runtime_template_id: typeof VENDOR_RUNTIME_TEMPLATE_ID;
  runtime_template_version: typeof VENDOR_RUNTIME_TEMPLATE_VERSION;
  runtime_template_phase: typeof DSC_VENDOR_RUNTIME_TEMPLATE_PHASE;
  runtime_template_system_id: typeof DSC_VENDOR_RUNTIME_TEMPLATE_SYSTEM_ID;
  runtime_template_evidence_ref: string;
  runtime_template_verdict: typeof VENDOR_RUNTIME_TEMPLATE_VERDICT;
  runtime_template_evidence_mode: 'phase_093_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_specification_root';
  sealed_runtime_template_digest: string;
  sealed_runtime_family_digest: string;
  sealed_runtime_catalog_digest: string;
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  specifies_runtime_in_this_phase: false;
  implements_runtime_template_in_this_phase: false;
}

export interface RuntimeSpecificationSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeSpecificationComposition {
  composition_id: 'dsc-vendor-runtime-specification-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_template';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeSpecificationSection[];
  transitive_seal: {
    policy: 'runtime_template_contents_sealed_via_runtime_template_digest';
    sealed_via: typeof VENDOR_RUNTIME_TEMPLATE_ID;
    sealed_component_count: number;
    re_lists_runtime_template_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeSpecificationManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeSpecificationManifest {
  manifest_id: 'dsc-vendor-runtime-specification-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeSpecificationManifestEntry[];
  sealed_runtime_template_digest: string;
  sealed_runtime_family_digest: string;
  sealed_runtime_catalog_digest: string;
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  runtime_specification_digest: string;
  runtime_specification_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_template_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeSpecification {
  vendor_runtime_specification_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_SPECIFICATION_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_specification';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_SPECIFICATION_V1';
  runtime_specification_id: typeof VENDOR_RUNTIME_SPECIFICATION_ID;
  runtime_specification_version: typeof VENDOR_RUNTIME_SPECIFICATION_VERSION;
  runtime_specification_kind: 'vendor_runtime_specification';
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
  runtime_specification_schema: VendorRuntimeSpecificationSchema;
  deterministic_runtime_specification_identity: DeterministicRuntimeSpecificationIdentity;
  vendor_runtime_template_binding: VendorRuntimeTemplateBinding;
  runtime_specification_composition: RuntimeSpecificationComposition;
  runtime_specification_manifest: RuntimeSpecificationManifest;
  specified_runtime_entries: {
    count: 0;
    entries: [];
    specification_policy: string;
    specifies_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_specification_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_template: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    specifies_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime specification.
 * Reuses the PHASE-093 Vendor Runtime Template by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime specification artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeSpecification(
  projectRoot?: string
): { vendorRuntimeSpecification: DirectSpatialConditioningVendorRuntimeSpecification } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_TEMPLATE_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-093 vendor runtime template did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_TEMPLATE_VERDICT) {
    throw new Error(
      `PHASE-093 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_TEMPLATE_PHASE) {
    throw new Error('PHASE-093 evidence does not cover the vendor runtime template');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-093 evidence reports outstanding errors');
  }

  const runtimeTemplate = readJson<DirectSpatialConditioningVendorRuntimeTemplate>(
    root,
    VENDOR_RUNTIME_TEMPLATE_PATH
  );
  if (
    runtimeTemplate.phase !== DSC_VENDOR_RUNTIME_TEMPLATE_PHASE ||
    runtimeTemplate.system_id !== DSC_VENDOR_RUNTIME_TEMPLATE_SYSTEM_ID
  ) {
    throw new Error('PHASE-093 vendor runtime template is missing or incompatible');
  }
  if (runtimeTemplate.runtime_template_id !== VENDOR_RUNTIME_TEMPLATE_ID) {
    throw new Error('Vendor runtime template identity drifted');
  }
  if (runtimeTemplate.runtime_template_version !== VENDOR_RUNTIME_TEMPLATE_VERSION) {
    throw new Error('Vendor runtime template version drifted');
  }
  if (!runtimeTemplate.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime template must remain vendor neutral');
  }
  if (!runtimeTemplate.design_constraints.reuses_certified_vendor_runtime_family) {
    throw new Error(
      'Vendor runtime template must reuse the certified vendor runtime family'
    );
  }
  if (runtimeTemplate.templated_runtime_entries.count !== 0) {
    throw new Error('PHASE-093 must not have templated runtime entries');
  }
  if (runtimeTemplate.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-093 must not declare runtime execution');
  }
  if (
    JSON.stringify(runtimeTemplate.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime template channels do not match foundation channels');
  }
  if (JSON.stringify(runtimeTemplate.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
    throw new Error(
      'Vendor runtime template sources_supported drifted from the certified corpus'
    );
  }
  if (runtimeTemplate.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime template spatial frame drifted');
  }
  if (
    runtimeTemplate.capability_set_id !== CAPABILITY_SET_ID ||
    runtimeTemplate.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime template capability set identity drifted');
  }

  const runtimeTemplateManifest = runtimeTemplate.runtime_template_manifest;
  for (const entry of runtimeTemplateManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(
        `sealed runtime template section missing on disk: ${entry.artifact_ref}`
      );
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed runtime template section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const recomputedRuntimeTemplateDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeTemplateManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_family:${runtimeTemplateManifest.sealed_runtime_family_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (recomputedRuntimeTemplateDigest !== runtimeTemplateManifest.runtime_template_digest) {
    throw new Error(
      'sealed runtime template digest drifted from the runtime template manifest'
    );
  }
  const sealedComponentCount = runtimeTemplateManifest.sealed_component_count;

  for (const spec of RUNTIME_SPECIFICATION_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime specification section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_SPECIFICATION_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime specification section id');
  }
  const sectionRefs = RUNTIME_SPECIFICATION_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime specification section artifact ref');
  }

  const runtime_specification_schema: VendorRuntimeSpecificationSchema = {
    schema_id: 'dsc-vendor-runtime-specification-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime specification. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime specification binds one Vendor Runtime Template as its root, seals the template together with its schema and implementation registry, and seals the template contents transitively through the runtime template digest. It specifies no concrete runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_specification_id_policy: 'opaque_runtime_specification_id_no_vendor_binding',
    runtime_template_ref: VENDOR_RUNTIME_TEMPLATE_ID,
    required_fields: [
      {
        field: 'runtime_specification_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_specification_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime specification version string',
      },
      {
        field: 'runtime_specification_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_specification',
      },
      {
        field: 'runtime_template_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime template ${VENDOR_RUNTIME_TEMPLATE_ID}`,
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
        field: 'deterministic_runtime_specification_identity',
        type: 'dsc-vendor-runtime-specification-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_template_binding',
        type: 'dsc-vendor-runtime-specification-template-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Template as the runtime specification root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_specification_composition',
        type: 'dsc-vendor-runtime-specification-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime template artifact, schema, and implementation registry sections; vendor-specific sections forbidden and template contents never re-listed',
      },
      {
        field: 'runtime_specification_manifest',
        type: 'dsc-vendor-runtime-specification-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime template digest and a runtime specification digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_specification_identity: DeterministicRuntimeSpecificationIdentity =
    {
      identity_id: 'dsc-vendor-runtime-specification-deterministic-identity-v1',
      description:
        'Deterministic identity of the vendor runtime specification. The runtime_specification_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
      runtime_specification_id: VENDOR_RUNTIME_SPECIFICATION_ID,
      runtime_specification_version: VENDOR_RUNTIME_SPECIFICATION_VERSION,
      identity_policy: 'opaque_runtime_specification_id_no_vendor_binding',
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

  const vendor_runtime_template_binding: VendorRuntimeTemplateBinding = {
    binding_id: 'dsc-vendor-runtime-specification-template-binding-v1',
    description:
      'Exact binding of the PHASE-093 Vendor Runtime Template as the runtime specification root. The binding is gated at build time on the recorded PHASE-093 PASS verdict, and re-seals every runtime template section and the runtime template digest before the runtime specification is emitted.',
    runtime_template_ref: VENDOR_RUNTIME_TEMPLATE_PATH,
    runtime_template_id: VENDOR_RUNTIME_TEMPLATE_ID,
    runtime_template_version: VENDOR_RUNTIME_TEMPLATE_VERSION,
    runtime_template_phase: DSC_VENDOR_RUNTIME_TEMPLATE_PHASE,
    runtime_template_system_id: DSC_VENDOR_RUNTIME_TEMPLATE_SYSTEM_ID,
    runtime_template_evidence_ref: VENDOR_RUNTIME_TEMPLATE_EVIDENCE_PATH,
    runtime_template_verdict: VENDOR_RUNTIME_TEMPLATE_VERDICT,
    runtime_template_evidence_mode: 'phase_093_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_specification_root',
    sealed_runtime_template_digest: runtimeTemplateManifest.runtime_template_digest,
    sealed_runtime_family_digest: runtimeTemplateManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeTemplateManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeTemplateManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeTemplateManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeTemplateManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeTemplateManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeTemplateManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    specifies_runtime_in_this_phase: false,
    implements_runtime_template_in_this_phase: false,
  };

  const runtime_specification_composition: RuntimeSpecificationComposition = {
    composition_id: 'dsc-vendor-runtime-specification-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Template: the runtime template artifact, its shape contract, and its implementation registry. The runtime template contents (and everything sealed beneath them) are sealed transitively through the runtime template digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_template',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_SPECIFICATION_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_template_contents_sealed_via_runtime_template_digest',
      sealed_via: VENDOR_RUNTIME_TEMPLATE_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_template_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeSpecificationManifestEntry[] = RUNTIME_SPECIFICATION_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_specification_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_template:${runtimeTemplateManifest.runtime_template_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_specification_manifest: RuntimeSpecificationManifest = {
    manifest_id: 'dsc-vendor-runtime-specification-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime specification section. Digests are computed read-only from disk. The sealed runtime template digest carries the template contents (and everything sealed beneath them) transitively, and the runtime specification digest is the SHA256 of the ordered section digests and the sealed runtime template digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_template_digest: runtimeTemplateManifest.runtime_template_digest,
    sealed_runtime_family_digest: runtimeTemplateManifest.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeTemplateManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeTemplateManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeTemplateManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeTemplateManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeTemplateManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeTemplateManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_specification_digest,
    runtime_specification_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_template_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeSpecification: DirectSpatialConditioningVendorRuntimeSpecification = {
    vendor_runtime_specification_id:
      'direct-spatial-conditioning-vendor-runtime-specification-v1',
    phase: DSC_VENDOR_RUNTIME_SPECIFICATION_PHASE,
    system_id: DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_specification',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_SPECIFICATION_V1',
    runtime_specification_id: VENDOR_RUNTIME_SPECIFICATION_ID,
    runtime_specification_version: VENDOR_RUNTIME_SPECIFICATION_VERSION,
    runtime_specification_kind: 'vendor_runtime_specification',
    runtime_template_ref: VENDOR_RUNTIME_TEMPLATE_PATH,
    runtime_template_schema_ref: VENDOR_RUNTIME_TEMPLATE_SCHEMA_PATH,
    runtime_template_implementation_registry_ref:
      VENDOR_RUNTIME_TEMPLATE_IMPLEMENTATION_REGISTRY_PATH,
    runtime_template_evidence_ref: VENDOR_RUNTIME_TEMPLATE_EVIDENCE_PATH,
    runtime_family_ref: runtimeTemplate.runtime_family_ref,
    runtime_family_schema_ref: runtimeTemplate.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      runtimeTemplate.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: runtimeTemplate.runtime_family_evidence_ref,
    runtime_catalog_ref: runtimeTemplate.runtime_catalog_ref,
    runtime_catalog_schema_ref: runtimeTemplate.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      runtimeTemplate.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: runtimeTemplate.runtime_catalog_evidence_ref,
    runtime_index_ref: runtimeTemplate.runtime_index_ref,
    runtime_index_schema_ref: runtimeTemplate.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      runtimeTemplate.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: runtimeTemplate.runtime_index_evidence_ref,
    runtime_registry_ref: runtimeTemplate.runtime_registry_ref,
    runtime_profile_ref: runtimeTemplate.runtime_profile_ref,
    runtime_bundle_ref: runtimeTemplate.runtime_bundle_ref,
    runtime_package_ref: runtimeTemplate.runtime_package_ref,
    reference_bundle_ref: runtimeTemplate.reference_bundle_ref,
    package_ref: runtimeTemplate.package_ref,
    template_ref: runtimeTemplate.template_ref,
    template_certification_ref: runtimeTemplate.template_certification_ref,
    numerical_runtime_package_ref: runtimeTemplate.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_specification_schema,
    deterministic_runtime_specification_identity,
    vendor_runtime_template_binding,
    runtime_specification_composition,
    runtime_specification_manifest,
    specified_runtime_entries: {
      count: 0,
      entries: [],
      specification_policy:
        'concrete vendor runtimes may be specified from this runtime specification only in a future implementation phase; none are specified here',
      specifies_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_specification_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_template: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      specifies_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_SPECIFICATION_PATH, vendorRuntimeSpecification);
  return { vendorRuntimeSpecification };
}
