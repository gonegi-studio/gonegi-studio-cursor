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
  DSC_VENDOR_RUNTIME_FAMILY_PHASE,
  DSC_VENDOR_RUNTIME_FAMILY_SYSTEM_ID,
  VENDOR_RUNTIME_FAMILY_ID,
  VENDOR_RUNTIME_FAMILY_PATH,
  VENDOR_RUNTIME_FAMILY_VERSION,
  type DirectSpatialConditioningVendorRuntimeFamily,
} from './directSpatialConditioningVendorRuntimeFamilyBuilder.js';

/**
 * PHASE-DSC-093: Direct Spatial Conditioning vendor runtime template.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Templates the PHASE-091 Vendor
 * Runtime Family as the sole design-time publication root:
 *   - runtime template schema,
 *   - deterministic runtime template identity,
 *   - Vendor Runtime Family binding,
 *   - runtime template composition, and
 *   - runtime template manifest.
 *
 * The template seals three design sections directly (runtime family artifact,
 * schema, implementation registry) and seals everything the runtime family
 * owns transitively through the runtime family digest. It templates no concrete
 * runtime, implements no vendor, declares no runtime execution, performs no GPU
 * or inference work, and modifies no member.
 */

export const DSC_VENDOR_RUNTIME_TEMPLATE_PHASE = 'PHASE-DSC-093' as const;
export const DSC_VENDOR_RUNTIME_TEMPLATE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_TEMPLATE_V1' as const;

export const VENDOR_RUNTIME_TEMPLATE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_TEMPLATE_PATH =
  `${VENDOR_RUNTIME_TEMPLATE_ROOT}/direct-spatial-conditioning-vendor-runtime-template-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime template. */
export const VENDOR_RUNTIME_TEMPLATE_ID = 'dsc-vendor-runtime-template-v1' as const;
export const VENDOR_RUNTIME_TEMPLATE_VERSION = '1.0' as const;

/** Design-time contract set of the passing PHASE-091 runtime family. */
export const VENDOR_RUNTIME_FAMILY_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-family.schema.json' as const;
export const VENDOR_RUNTIME_FAMILY_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-family-implementation-registry-v1.json' as const;
export const VENDOR_RUNTIME_FAMILY_EVIDENCE_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_FAMILY_VALIDATION_REPORT.json' as const;

export const VENDOR_RUNTIME_FAMILY_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_FAMILY_V1' as const;

export const VENDOR_RUNTIME_TEMPLATE_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-template.schema.json' as const;
export const VENDOR_RUNTIME_TEMPLATE_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-template-implementation-registry-v1.json' as const;

/**
 * Ordered runtime template sections. Only the runtime family's own design-time
 * contract set is sealed directly; everything it owns is sealed transitively.
 */
export const RUNTIME_TEMPLATE_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_family_artifact'
    | 'runtime_family_schema'
    | 'runtime_family_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_family',
    role: 'runtime_template_root_family',
    kind: 'runtime_family_artifact',
    artifact_ref: VENDOR_RUNTIME_FAMILY_PATH,
  },
  {
    section_id: 'vendor_runtime_family_schema',
    role: 'runtime_family_shape_contract',
    kind: 'runtime_family_schema',
    artifact_ref: VENDOR_RUNTIME_FAMILY_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_family_implementation_registry',
    role: 'runtime_family_provenance_registry',
    kind: 'runtime_family_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_FAMILY_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeTemplateSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeTemplateSchema {
  schema_id: 'dsc-vendor-runtime-template-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_template_id_policy: 'opaque_runtime_template_id_no_vendor_binding';
  runtime_family_ref: typeof VENDOR_RUNTIME_FAMILY_ID;
  required_fields: RuntimeTemplateSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeTemplateIdentity {
  identity_id: 'dsc-vendor-runtime-template-deterministic-identity-v1';
  description: string;
  runtime_template_id: typeof VENDOR_RUNTIME_TEMPLATE_ID;
  runtime_template_version: typeof VENDOR_RUNTIME_TEMPLATE_VERSION;
  identity_policy: 'opaque_runtime_template_id_no_vendor_binding';
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

export interface VendorRuntimeFamilyBinding {
  binding_id: 'dsc-vendor-runtime-template-family-binding-v1';
  description: string;
  runtime_family_ref: string;
  runtime_family_id: typeof VENDOR_RUNTIME_FAMILY_ID;
  runtime_family_version: typeof VENDOR_RUNTIME_FAMILY_VERSION;
  runtime_family_phase: typeof DSC_VENDOR_RUNTIME_FAMILY_PHASE;
  runtime_family_system_id: typeof DSC_VENDOR_RUNTIME_FAMILY_SYSTEM_ID;
  runtime_family_evidence_ref: string;
  runtime_family_verdict: typeof VENDOR_RUNTIME_FAMILY_VERDICT;
  runtime_family_evidence_mode: 'phase_091_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_template_root';
  sealed_runtime_family_digest: string;
  sealed_runtime_catalog_digest: string;
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  templates_runtime_in_this_phase: false;
  implements_runtime_family_in_this_phase: false;
}

export interface RuntimeTemplateSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeTemplateComposition {
  composition_id: 'dsc-vendor-runtime-template-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_family';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeTemplateSection[];
  transitive_seal: {
    policy: 'runtime_family_contents_sealed_via_runtime_family_digest';
    sealed_via: typeof VENDOR_RUNTIME_FAMILY_ID;
    sealed_component_count: number;
    re_lists_runtime_family_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeTemplateManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeTemplateManifest {
  manifest_id: 'dsc-vendor-runtime-template-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeTemplateManifestEntry[];
  sealed_runtime_family_digest: string;
  sealed_runtime_catalog_digest: string;
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  runtime_template_digest: string;
  runtime_template_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_family_digest';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorRuntimeTemplate {
  vendor_runtime_template_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_TEMPLATE_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_TEMPLATE_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_template';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_TEMPLATE_V1';
  runtime_template_id: typeof VENDOR_RUNTIME_TEMPLATE_ID;
  runtime_template_version: typeof VENDOR_RUNTIME_TEMPLATE_VERSION;
  runtime_template_kind: 'vendor_runtime_template';
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
  runtime_template_schema: VendorRuntimeTemplateSchema;
  deterministic_runtime_template_identity: DeterministicRuntimeTemplateIdentity;
  vendor_runtime_family_binding: VendorRuntimeFamilyBinding;
  runtime_template_composition: RuntimeTemplateComposition;
  runtime_template_manifest: RuntimeTemplateManifest;
  templated_runtime_entries: {
    count: 0;
    entries: [];
    templating_policy: string;
    templates_runtime_in_this_phase: false;
  };
  design_constraints: {
    runtime_template_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_family: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    templates_runtime_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime template.
 * Reuses the PHASE-091 Vendor Runtime Family by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime template artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeTemplate(
  projectRoot?: string
): { vendorRuntimeTemplate: DirectSpatialConditioningVendorRuntimeTemplate } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_FAMILY_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-091 vendor runtime family did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_FAMILY_VERDICT) {
    throw new Error(
      `PHASE-091 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_FAMILY_PHASE) {
    throw new Error('PHASE-091 evidence does not cover the vendor runtime family');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-091 evidence reports outstanding errors');
  }

  const runtimeFamily = readJson<DirectSpatialConditioningVendorRuntimeFamily>(
    root,
    VENDOR_RUNTIME_FAMILY_PATH
  );
  if (
    runtimeFamily.phase !== DSC_VENDOR_RUNTIME_FAMILY_PHASE ||
    runtimeFamily.system_id !== DSC_VENDOR_RUNTIME_FAMILY_SYSTEM_ID
  ) {
    throw new Error('PHASE-091 vendor runtime family is missing or incompatible');
  }
  if (runtimeFamily.runtime_family_id !== VENDOR_RUNTIME_FAMILY_ID) {
    throw new Error('Vendor runtime family identity drifted');
  }
  if (runtimeFamily.runtime_family_version !== VENDOR_RUNTIME_FAMILY_VERSION) {
    throw new Error('Vendor runtime family version drifted');
  }
  if (!runtimeFamily.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime family must remain vendor neutral');
  }
  if (!runtimeFamily.design_constraints.reuses_certified_vendor_runtime_catalog) {
    throw new Error(
      'Vendor runtime family must reuse the certified vendor runtime catalog'
    );
  }
  if (runtimeFamily.family_runtime_members.count !== 0) {
    throw new Error('PHASE-091 must not have grouped runtime family members');
  }
  if (runtimeFamily.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-091 must not declare runtime execution');
  }
  if (
    JSON.stringify(runtimeFamily.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime family channels do not match foundation channels');
  }
  if (JSON.stringify(runtimeFamily.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
    throw new Error(
      'Vendor runtime family sources_supported drifted from the certified corpus'
    );
  }
  if (runtimeFamily.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime family spatial frame drifted');
  }
  if (
    runtimeFamily.capability_set_id !== CAPABILITY_SET_ID ||
    runtimeFamily.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime family capability set identity drifted');
  }

  const runtimeFamilyManifest = runtimeFamily.runtime_family_manifest;
  for (const entry of runtimeFamilyManifest.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(`sealed runtime family section missing on disk: ${entry.artifact_ref}`);
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(`sealed runtime family section digest drifted: ${entry.artifact_ref}`);
    }
  }
  const recomputedRuntimeFamilyDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeFamilyManifest.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_catalog:${runtimeFamilyManifest.sealed_runtime_catalog_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (recomputedRuntimeFamilyDigest !== runtimeFamilyManifest.runtime_family_digest) {
    throw new Error('sealed runtime family digest drifted from the runtime family manifest');
  }
  const sealedComponentCount = runtimeFamilyManifest.sealed_component_count;

  for (const spec of RUNTIME_TEMPLATE_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime template section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_TEMPLATE_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime template section id');
  }
  const sectionRefs = RUNTIME_TEMPLATE_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime template section artifact ref');
  }

  const runtime_template_schema: VendorRuntimeTemplateSchema = {
    schema_id: 'dsc-vendor-runtime-template-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime template. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime template binds one Vendor Runtime Family as its root, seals the family together with its schema and implementation registry, and seals the family contents transitively through the runtime family digest. It templates no concrete runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_template_id_policy: 'opaque_runtime_template_id_no_vendor_binding',
    runtime_family_ref: VENDOR_RUNTIME_FAMILY_ID,
    required_fields: [
      {
        field: 'runtime_template_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_template_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime template version string',
      },
      {
        field: 'runtime_template_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_template',
      },
      {
        field: 'runtime_family_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime family ${VENDOR_RUNTIME_FAMILY_ID}`,
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
        field: 'deterministic_runtime_template_identity',
        type: 'dsc-vendor-runtime-template-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_family_binding',
        type: 'dsc-vendor-runtime-template-family-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Family as the runtime template root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_template_composition',
        type: 'dsc-vendor-runtime-template-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime family artifact, schema, and implementation registry sections; vendor-specific sections forbidden and family contents never re-listed',
      },
      {
        field: 'runtime_template_manifest',
        type: 'dsc-vendor-runtime-template-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime family digest and a runtime template digest over sections and that digest',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_template_identity: DeterministicRuntimeTemplateIdentity = {
    identity_id: 'dsc-vendor-runtime-template-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor runtime template. The runtime_template_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    runtime_template_id: VENDOR_RUNTIME_TEMPLATE_ID,
    runtime_template_version: VENDOR_RUNTIME_TEMPLATE_VERSION,
    identity_policy: 'opaque_runtime_template_id_no_vendor_binding',
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

  const vendor_runtime_family_binding: VendorRuntimeFamilyBinding = {
    binding_id: 'dsc-vendor-runtime-template-family-binding-v1',
    description:
      'Exact binding of the PHASE-091 Vendor Runtime Family as the runtime template root. The binding is gated at build time on the recorded PHASE-091 PASS verdict, and re-seals every runtime family section and the runtime family digest before the runtime template is emitted.',
    runtime_family_ref: VENDOR_RUNTIME_FAMILY_PATH,
    runtime_family_id: VENDOR_RUNTIME_FAMILY_ID,
    runtime_family_version: VENDOR_RUNTIME_FAMILY_VERSION,
    runtime_family_phase: DSC_VENDOR_RUNTIME_FAMILY_PHASE,
    runtime_family_system_id: DSC_VENDOR_RUNTIME_FAMILY_SYSTEM_ID,
    runtime_family_evidence_ref: VENDOR_RUNTIME_FAMILY_EVIDENCE_PATH,
    runtime_family_verdict: VENDOR_RUNTIME_FAMILY_VERDICT,
    runtime_family_evidence_mode: 'phase_091_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_template_root',
    sealed_runtime_family_digest: runtimeFamilyManifest.runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeFamilyManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeFamilyManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeFamilyManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeFamilyManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeFamilyManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeFamilyManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    templates_runtime_in_this_phase: false,
    implements_runtime_family_in_this_phase: false,
  };

  const runtime_template_composition: RuntimeTemplateComposition = {
    composition_id: 'dsc-vendor-runtime-template-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Family: the runtime family artifact, its shape contract, and its implementation registry. The runtime family contents (and everything sealed beneath them) are sealed transitively through the runtime family digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_family',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_TEMPLATE_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
      policy: 'runtime_family_contents_sealed_via_runtime_family_digest',
      sealed_via: VENDOR_RUNTIME_FAMILY_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_family_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeTemplateManifestEntry[] = RUNTIME_TEMPLATE_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_template_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_family:${runtimeFamilyManifest.runtime_family_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_template_manifest: RuntimeTemplateManifest = {
    manifest_id: 'dsc-vendor-runtime-template-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime template section. Digests are computed read-only from disk. The sealed runtime family digest carries the family contents (and everything sealed beneath them) transitively, and the runtime template digest is the SHA256 of the ordered section digests and the sealed runtime family digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_family_digest: runtimeFamilyManifest.runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeFamilyManifest.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeFamilyManifest.sealed_runtime_index_digest,
    sealed_runtime_registry_digest: runtimeFamilyManifest.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeFamilyManifest.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeFamilyManifest.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeFamilyManifest.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_template_digest,
    runtime_template_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_family_digest',
    verifies_implementations_in_this_phase: false,
  };

  const vendorRuntimeTemplate: DirectSpatialConditioningVendorRuntimeTemplate = {
    vendor_runtime_template_id: 'direct-spatial-conditioning-vendor-runtime-template-v1',
    phase: DSC_VENDOR_RUNTIME_TEMPLATE_PHASE,
    system_id: DSC_VENDOR_RUNTIME_TEMPLATE_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_template',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_TEMPLATE_V1',
    runtime_template_id: VENDOR_RUNTIME_TEMPLATE_ID,
    runtime_template_version: VENDOR_RUNTIME_TEMPLATE_VERSION,
    runtime_template_kind: 'vendor_runtime_template',
    runtime_family_ref: VENDOR_RUNTIME_FAMILY_PATH,
    runtime_family_schema_ref: VENDOR_RUNTIME_FAMILY_SCHEMA_PATH,
    runtime_family_implementation_registry_ref:
      VENDOR_RUNTIME_FAMILY_IMPLEMENTATION_REGISTRY_PATH,
    runtime_family_evidence_ref: VENDOR_RUNTIME_FAMILY_EVIDENCE_PATH,
    runtime_catalog_ref: runtimeFamily.runtime_catalog_ref,
    runtime_catalog_schema_ref: runtimeFamily.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      runtimeFamily.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: runtimeFamily.runtime_catalog_evidence_ref,
    runtime_index_ref: runtimeFamily.runtime_index_ref,
    runtime_index_schema_ref: runtimeFamily.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      runtimeFamily.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: runtimeFamily.runtime_index_evidence_ref,
    runtime_registry_ref: runtimeFamily.runtime_registry_ref,
    runtime_profile_ref: runtimeFamily.runtime_profile_ref,
    runtime_bundle_ref: runtimeFamily.runtime_bundle_ref,
    runtime_package_ref: runtimeFamily.runtime_package_ref,
    reference_bundle_ref: runtimeFamily.reference_bundle_ref,
    package_ref: runtimeFamily.package_ref,
    template_ref: runtimeFamily.template_ref,
    template_certification_ref: runtimeFamily.template_certification_ref,
    numerical_runtime_package_ref: runtimeFamily.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_template_schema,
    deterministic_runtime_template_identity,
    vendor_runtime_family_binding,
    runtime_template_composition,
    runtime_template_manifest,
    templated_runtime_entries: {
      count: 0,
      entries: [],
      templating_policy:
        'concrete vendor runtimes may be templated from this runtime template only in a future implementation phase; none are templated here',
      templates_runtime_in_this_phase: false,
    },
    design_constraints: {
      runtime_template_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_family: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      templates_runtime_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_RUNTIME_TEMPLATE_PATH, vendorRuntimeTemplate);
  return { vendorRuntimeTemplate };
}
