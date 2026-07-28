import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  FOUNDATION_PATH,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';
import { CONTRACT_PATH } from './directSpatialConditioningContractBuilder.js';
import { PACKET_PATH } from './directSpatialConditioningPacketBuilder.js';
import { VALIDATION_PATH } from './directSpatialConditioningPacketValidationBuilder.js';
import { ASSEMBLY_PATH } from './directSpatialConditioningPacketAssemblyBuilder.js';
import { GENERATION_PATH } from './directSpatialConditioningPacketGenerationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_VALIDATION_PATH } from './directSpatialConditioningRuntimeValidationBuilder.js';
import { BACKEND_ADAPTER_FOUNDATION_PATH } from './directSpatialConditioningBackendAdapterFoundationBuilder.js';
import {
  BACKEND_CAPABILITY_REGISTRY_PATH,
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
} from './directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import { BACKEND_COMPATIBILITY_ENGINE_PATH } from './directSpatialConditioningBackendCompatibilityEngineBuilder.js';
import { BACKEND_ADAPTER_REGISTRATION_PATH } from './directSpatialConditioningBackendAdapterRegistrationBuilder.js';
import { BACKEND_RUNTIME_ROUTER_PATH } from './directSpatialConditioningBackendRuntimeRouterBuilder.js';
import { BACKEND_EXECUTION_CONTRACT_PATH } from './directSpatialConditioningBackendExecutionContractBuilder.js';
import { BACKEND_IMPLEMENTATION_SPEC_PATH } from './directSpatialConditioningBackendImplementationSpecBuilder.js';
import { BACKEND_DESIGN_CERTIFICATION_PATH } from './directSpatialConditioningBackendDesignCertificationBuilder.js';
import { BACKEND_PROFILE_PATH } from './directSpatialConditioningBackendProfileBuilder.js';
import { BACKEND_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningBackendProfileCertificationBuilder.js';
import { BACKEND_TEMPLATE_PATH } from './directSpatialConditioningBackendTemplateBuilder.js';
import {
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_PATH,
} from './directSpatialConditioningReferenceBackendBuilder.js';
import {
  BACKEND_FAMILY_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
} from './directSpatialConditioningBackendFamilyBuilder.js';
import {
  BACKEND_FAMILY_CERTIFICATION_PATH,
  VENDOR_PROFILE_PATH,
} from './directSpatialConditioningVendorProfileBuilder.js';
import { VENDOR_REGISTRY_PATH } from './directSpatialConditioningVendorRegistryBuilder.js';
import { VENDOR_COMPATIBILITY_PATH } from './directSpatialConditioningVendorCompatibilityBuilder.js';
import { VENDOR_ROUTER_PATH } from './directSpatialConditioningVendorRouterBuilder.js';
import { VENDOR_EXECUTION_CONTRACT_PATH } from './directSpatialConditioningVendorExecutionContractBuilder.js';
import { VENDOR_IMPLEMENTATION_SPEC_PATH } from './directSpatialConditioningVendorImplementationSpecBuilder.js';
import { VENDOR_REFERENCE_PROFILE_PATH } from './directSpatialConditioningVendorReferenceProfileBuilder.js';
import { VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceProfileCertificationBuilder.js';
import { VENDOR_TEMPLATE_PATH } from './directSpatialConditioningVendorTemplateBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_PATH } from './directSpatialConditioningVendorReferenceImplementationBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceImplementationCertificationBuilder.js';
import { VENDOR_IMPLEMENTATION_FAMILY_PATH } from './directSpatialConditioningVendorImplementationFamilyBuilder.js';
import { VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH } from './directSpatialConditioningVendorImplementationFamilyCertificationBuilder.js';
import { VENDOR_IMPLEMENTATION_PROFILE_PATH } from './directSpatialConditioningVendorImplementationProfileBuilder.js';
import { VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningVendorImplementationProfileCertificationBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE,
  DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_TEMPLATE_ID,
  VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
  VENDOR_IMPLEMENTATION_TEMPLATE_VERSION,
  type DirectSpatialConditioningVendorImplementationTemplate,
} from './directSpatialConditioningVendorImplementationTemplateBuilder.js';
import { VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH } from './directSpatialConditioningVendorImplementationTemplateCertificationBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-075: Direct Spatial Conditioning vendor reference package.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. Composes the certified vendor
 * design stack into a single reference package over the certified PHASE-073
 * Vendor Implementation Template and PHASE-074 certification:
 *   - reference package schema,
 *   - deterministic package identity,
 *   - certified Vendor Implementation Template binding,
 *   - package composition, and
 *   - package manifest.
 *
 * Composes references only. Implements no vendor, performs no GPU or inference
 * work, and modifies no dataset. Every member is reused by exact reference and
 * content-addressed by a read-only SHA256 digest.
 */

export const DSC_VENDOR_REFERENCE_PACKAGE_PHASE = 'PHASE-DSC-075' as const;
export const DSC_VENDOR_REFERENCE_PACKAGE_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PACKAGE_V1' as const;

export const VENDOR_REFERENCE_PACKAGE_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_REFERENCE_PACKAGE_PATH =
  `${VENDOR_REFERENCE_PACKAGE_ROOT}/direct-spatial-conditioning-vendor-reference-package-v1.json` as const;

/** Opaque deterministic identity of the vendor reference package. */
export const VENDOR_REFERENCE_PACKAGE_ID =
  'dsc-vendor-reference-package-v1' as const;
export const VENDOR_REFERENCE_PACKAGE_VERSION = '1.0' as const;

/** Ordered composition of the certified vendor design stack. */
export const PACKAGE_COMPONENT_SPECS: Array<{
  component_id: string;
  role: string;
  layer: 'vendor_design' | 'vendor_certification' | 'backend_design' | 'backend_certification' | 'runtime';
  artifact_ref: string;
}> = [
  { component_id: 'vendor_implementation_template', role: 'implementation_conformance_template', layer: 'vendor_design', artifact_ref: VENDOR_IMPLEMENTATION_TEMPLATE_PATH },
  { component_id: 'vendor_implementation_template_certification', role: 'implementation_template_certification', layer: 'vendor_certification', artifact_ref: VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH },
  { component_id: 'vendor_implementation_profile', role: 'implementation_conformance_profile', layer: 'vendor_design', artifact_ref: VENDOR_IMPLEMENTATION_PROFILE_PATH },
  { component_id: 'vendor_implementation_profile_certification', role: 'implementation_profile_certification', layer: 'vendor_certification', artifact_ref: VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH },
  { component_id: 'vendor_implementation_family', role: 'implementation_family', layer: 'vendor_design', artifact_ref: VENDOR_IMPLEMENTATION_FAMILY_PATH },
  { component_id: 'vendor_implementation_family_certification', role: 'implementation_family_certification', layer: 'vendor_certification', artifact_ref: VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH },
  { component_id: 'vendor_reference_implementation', role: 'reference_implementation', layer: 'vendor_design', artifact_ref: VENDOR_REFERENCE_IMPLEMENTATION_PATH },
  { component_id: 'vendor_reference_implementation_certification', role: 'reference_implementation_certification', layer: 'vendor_certification', artifact_ref: VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH },
  { component_id: 'vendor_template', role: 'vendor_template', layer: 'vendor_design', artifact_ref: VENDOR_TEMPLATE_PATH },
  { component_id: 'vendor_reference_profile', role: 'reference_profile', layer: 'vendor_design', artifact_ref: VENDOR_REFERENCE_PROFILE_PATH },
  { component_id: 'vendor_reference_profile_certification', role: 'reference_profile_certification', layer: 'vendor_certification', artifact_ref: VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH },
  { component_id: 'vendor_profile', role: 'vendor_profile', layer: 'vendor_design', artifact_ref: VENDOR_PROFILE_PATH },
  { component_id: 'vendor_registry', role: 'vendor_registry', layer: 'vendor_design', artifact_ref: VENDOR_REGISTRY_PATH },
  { component_id: 'vendor_compatibility', role: 'vendor_compatibility', layer: 'vendor_design', artifact_ref: VENDOR_COMPATIBILITY_PATH },
  { component_id: 'vendor_router', role: 'vendor_router', layer: 'vendor_design', artifact_ref: VENDOR_ROUTER_PATH },
  { component_id: 'vendor_execution_contract', role: 'vendor_execution_contract', layer: 'vendor_design', artifact_ref: VENDOR_EXECUTION_CONTRACT_PATH },
  { component_id: 'vendor_implementation_spec', role: 'vendor_implementation_spec', layer: 'vendor_design', artifact_ref: VENDOR_IMPLEMENTATION_SPEC_PATH },
  { component_id: 'backend_family', role: 'backend_family', layer: 'backend_design', artifact_ref: BACKEND_FAMILY_PATH },
  { component_id: 'backend_family_certification', role: 'backend_family_certification', layer: 'backend_certification', artifact_ref: BACKEND_FAMILY_CERTIFICATION_PATH },
  { component_id: 'reference_backend', role: 'reference_backend', layer: 'backend_design', artifact_ref: REFERENCE_BACKEND_PATH },
  { component_id: 'reference_backend_certification', role: 'reference_backend_certification', layer: 'backend_certification', artifact_ref: REFERENCE_BACKEND_CERTIFICATION_PATH },
  { component_id: 'backend_template', role: 'backend_template', layer: 'backend_design', artifact_ref: BACKEND_TEMPLATE_PATH },
  { component_id: 'backend_template_certification', role: 'backend_template_certification', layer: 'backend_certification', artifact_ref: BACKEND_TEMPLATE_CERTIFICATION_PATH },
  { component_id: 'backend_profile', role: 'backend_profile', layer: 'backend_design', artifact_ref: BACKEND_PROFILE_PATH },
  { component_id: 'backend_profile_certification', role: 'backend_profile_certification', layer: 'backend_certification', artifact_ref: BACKEND_PROFILE_CERTIFICATION_PATH },
  { component_id: 'backend_design_certification', role: 'backend_design_certification', layer: 'backend_certification', artifact_ref: BACKEND_DESIGN_CERTIFICATION_PATH },
  { component_id: 'backend_implementation_spec', role: 'backend_implementation_spec', layer: 'backend_design', artifact_ref: BACKEND_IMPLEMENTATION_SPEC_PATH },
  { component_id: 'backend_execution_contract', role: 'backend_execution_contract', layer: 'backend_design', artifact_ref: BACKEND_EXECUTION_CONTRACT_PATH },
  { component_id: 'backend_runtime_router', role: 'backend_runtime_router', layer: 'backend_design', artifact_ref: BACKEND_RUNTIME_ROUTER_PATH },
  { component_id: 'backend_adapter_registration', role: 'backend_adapter_registration', layer: 'backend_design', artifact_ref: BACKEND_ADAPTER_REGISTRATION_PATH },
  { component_id: 'backend_compatibility_engine', role: 'backend_compatibility_engine', layer: 'backend_design', artifact_ref: BACKEND_COMPATIBILITY_ENGINE_PATH },
  { component_id: 'backend_capability_registry', role: 'backend_capability_registry', layer: 'backend_design', artifact_ref: BACKEND_CAPABILITY_REGISTRY_PATH },
  { component_id: 'backend_adapter_foundation', role: 'backend_adapter_foundation', layer: 'backend_design', artifact_ref: BACKEND_ADAPTER_FOUNDATION_PATH },
  { component_id: 'foundation', role: 'foundation', layer: 'backend_design', artifact_ref: FOUNDATION_PATH },
  { component_id: 'contract', role: 'contract', layer: 'backend_design', artifact_ref: CONTRACT_PATH },
  { component_id: 'packet', role: 'packet', layer: 'backend_design', artifact_ref: PACKET_PATH },
  { component_id: 'packet_validation', role: 'packet_validation', layer: 'backend_design', artifact_ref: VALIDATION_PATH },
  { component_id: 'packet_assembly', role: 'packet_assembly', layer: 'backend_design', artifact_ref: ASSEMBLY_PATH },
  { component_id: 'packet_generation', role: 'packet_generation', layer: 'backend_design', artifact_ref: GENERATION_PATH },
  { component_id: 'runtime_interface', role: 'runtime_interface', layer: 'backend_design', artifact_ref: RUNTIME_INTERFACE_PATH },
  { component_id: 'runtime_validation', role: 'runtime_validation', layer: 'backend_design', artifact_ref: RUNTIME_VALIDATION_PATH },
  { component_id: 'runtime_package', role: 'numerical_runtime_package', layer: 'runtime', artifact_ref: RUNTIME_PACKAGE_PATH },
];

export interface PackageSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorReferencePackageSchema {
  schema_id: 'dsc-vendor-reference-package-schema-v1';
  description: string;
  encoding: 'application/json';
  package_id_policy: 'opaque_package_id_no_vendor_binding';
  template_ref: typeof VENDOR_IMPLEMENTATION_TEMPLATE_ID;
  required_fields: PackageSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicPackageIdentity {
  identity_id: 'dsc-vendor-reference-package-deterministic-identity-v1';
  description: string;
  package_id: typeof VENDOR_REFERENCE_PACKAGE_ID;
  package_version: typeof VENDOR_REFERENCE_PACKAGE_VERSION;
  identity_policy: 'opaque_package_id_no_vendor_binding';
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

export interface VendorImplementationTemplateBinding {
  binding_id: 'dsc-vendor-reference-package-template-binding-v1';
  description: string;
  template_ref: string;
  template_id: typeof VENDOR_IMPLEMENTATION_TEMPLATE_ID;
  template_version: typeof VENDOR_IMPLEMENTATION_TEMPLATE_VERSION;
  template_phase: typeof DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE;
  template_system_id: typeof DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID;
  template_certification_ref: string;
  binding_mode: 'exact_reuse';
  role: 'package_root';
  packages_vendors_in_this_phase: false;
  implements_template_in_this_phase: false;
}

export interface PackageComponent {
  component_id: string;
  role: string;
  layer: string;
  artifact_ref: string;
  order: number;
}

export interface PackageComposition {
  composition_id: 'dsc-vendor-reference-package-composition-v1';
  description: string;
  root_component_id: 'vendor_implementation_template';
  component_order: 'fixed_declared_order';
  closed_set: true;
  components: PackageComponent[];
  vendor_specific_components: 'forbidden';
  includes_implementations: false;
}

export interface PackageManifestEntry {
  component_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface PackageManifest {
  manifest_id: 'dsc-vendor-reference-package-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: PackageManifestEntry[];
  package_digest: string;
  package_digest_method: 'sha256_of_ordered_member_digests';
  verifies_implementations_in_this_phase: false;
}

export interface DirectSpatialConditioningVendorReferencePackage {
  vendor_reference_package_id: string;
  phase: typeof DSC_VENDOR_REFERENCE_PACKAGE_PHASE;
  system_id: typeof DSC_VENDOR_REFERENCE_PACKAGE_SYSTEM_ID;
  mode: 'design_only_vendor_reference_package';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PACKAGE_V1';
  package_id: typeof VENDOR_REFERENCE_PACKAGE_ID;
  package_version: typeof VENDOR_REFERENCE_PACKAGE_VERSION;
  package_kind: 'vendor_reference_package';
  template_ref: string;
  template_certification_ref: string;
  implementation_profile_ref: string;
  implementation_profile_certification_ref: string;
  family_ref: string;
  family_certification_ref: string;
  reference_implementation_ref: string;
  reference_implementation_certification_ref: string;
  runtime_package_ref: string;
  sources_supported: string[];
  required_channels: ConditioningChannelId[];
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  reference_package_schema: VendorReferencePackageSchema;
  deterministic_package_identity: DeterministicPackageIdentity;
  vendor_implementation_template_binding: VendorImplementationTemplateBinding;
  package_composition: PackageComposition;
  package_manifest: PackageManifest;
  packaged_vendors: {
    count: 0;
    entries: [];
    packaging_policy: string;
    packages_vendors_in_this_phase: false;
  };
  design_constraints: {
    package_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_implementation_template: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    packages_vendors_in_this_phase: false;
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
 * Build the design-only, read-only, vendor-neutral DSC vendor reference
 * package. Reuses the certified PHASE-073 Vendor Implementation Template by
 * exact reference; writes only the package artifact. No vendor is implemented,
 * no member is modified, and every member is content-addressed by a read-only
 * SHA256 digest.
 */
export function buildDirectSpatialConditioningVendorReferencePackage(
  projectRoot?: string
): { vendorReferencePackage: DirectSpatialConditioningVendorReferencePackage } {
  const root = resolveProjectRoot(projectRoot);

  const templateCertification = readJson<{
    certified?: boolean;
    certified_system?: string;
  }>(root, VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH);
  if (templateCertification.certified !== true) {
    throw new Error('PHASE-074 vendor implementation template is not certified');
  }
  if (
    templateCertification.certified_system !==
    'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_V1'
  ) {
    throw new Error(
      'PHASE-074 certification does not cover the vendor implementation template'
    );
  }

  const template = readJson<DirectSpatialConditioningVendorImplementationTemplate>(
    root,
    VENDOR_IMPLEMENTATION_TEMPLATE_PATH
  );
  if (
    template.phase !== DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE ||
    template.system_id !== DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID
  ) {
    throw new Error(
      'PHASE-073 vendor implementation template is missing or incompatible'
    );
  }
  if (template.template_id !== VENDOR_IMPLEMENTATION_TEMPLATE_ID) {
    throw new Error('Vendor implementation template identity drifted');
  }
  if (template.template_version !== VENDOR_IMPLEMENTATION_TEMPLATE_VERSION) {
    throw new Error('Vendor implementation template version drifted');
  }
  if (!template.design_constraints.vendor_neutral) {
    throw new Error('Vendor implementation template must remain vendor neutral');
  }
  if (!template.design_constraints.reuses_certified_vendor_implementation_profile) {
    throw new Error(
      'Vendor implementation template must reuse the certified vendor implementation profile'
    );
  }
  if (template.templated_implementations.count !== 0) {
    throw new Error('PHASE-073 must not have templated implementations');
  }
  if (
    JSON.stringify(template.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error(
      'Vendor implementation template channels do not match foundation channels'
    );
  }
  if (JSON.stringify(template.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
    throw new Error(
      'Vendor implementation template sources_supported drifted from the certified corpus'
    );
  }
  if (template.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor implementation template spatial frame drifted');
  }
  if (
    template.capability_set_id !== CAPABILITY_SET_ID ||
    template.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor implementation template capability set identity drifted');
  }

  // Every composed member must exist on disk before it is content-addressed.
  for (const spec of PACKAGE_COMPONENT_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`package member missing on disk: ${spec.artifact_ref}`);
    }
  }
  const componentIds = PACKAGE_COMPONENT_SPECS.map((spec) => spec.component_id);
  if (new Set(componentIds).size !== componentIds.length) {
    throw new Error('duplicate package component id');
  }
  const componentRefs = PACKAGE_COMPONENT_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(componentRefs).size !== componentRefs.length) {
    throw new Error('duplicate package component artifact ref');
  }

  const reference_package_schema: VendorReferencePackageSchema = {
    schema_id: 'dsc-vendor-reference-package-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor reference package. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A package binds the certified Vendor Implementation Template and composes the certified vendor design stack into a content-addressed manifest, without implementing any vendor.',
    encoding: 'application/json',
    package_id_policy: 'opaque_package_id_no_vendor_binding',
    template_ref: VENDOR_IMPLEMENTATION_TEMPLATE_ID,
    required_fields: [
      {
        field: 'package_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'package_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor package version string',
      },
      {
        field: 'package_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_reference_package',
      },
      {
        field: 'template_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the certified vendor implementation template ${VENDOR_IMPLEMENTATION_TEMPLATE_ID}`,
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
        field: 'deterministic_package_identity',
        type: 'dsc-vendor-reference-package-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_implementation_template_binding',
        type: 'dsc-vendor-reference-package-template-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the certified Vendor Implementation Template as the package root',
      },
      {
        field: 'package_composition',
        type: 'dsc-vendor-reference-package-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of certified vendor and backend design members; vendor-specific components forbidden',
      },
      {
        field: 'package_manifest',
        type: 'dsc-vendor-reference-package-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per composition member and a package digest over the ordered member digests',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_package_identity: DeterministicPackageIdentity = {
    identity_id: 'dsc-vendor-reference-package-deterministic-identity-v1',
    description:
      'Deterministic identity of the vendor reference package. The package_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
    package_id: VENDOR_REFERENCE_PACKAGE_ID,
    package_version: VENDOR_REFERENCE_PACKAGE_VERSION,
    identity_policy: 'opaque_package_id_no_vendor_binding',
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

  const vendor_implementation_template_binding: VendorImplementationTemplateBinding = {
    binding_id: 'dsc-vendor-reference-package-template-binding-v1',
    description:
      'Exact binding of the certified PHASE-073 Vendor Implementation Template as the package root. The package composes the certified stack around this template without implementing any vendor.',
    template_ref: VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
    template_id: VENDOR_IMPLEMENTATION_TEMPLATE_ID,
    template_version: VENDOR_IMPLEMENTATION_TEMPLATE_VERSION,
    template_phase: DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE,
    template_system_id: DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID,
    template_certification_ref: VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
    binding_mode: 'exact_reuse',
    role: 'package_root',
    packages_vendors_in_this_phase: false,
    implements_template_in_this_phase: false,
  };

  const package_composition: PackageComposition = {
    composition_id: 'dsc-vendor-reference-package-composition-v1',
    description:
      'Closed, fixed-order composition of the certified vendor and backend design stack. The certified Vendor Implementation Template is the root; every other member is included by exact reference. No vendor-specific component and no implementation is included.',
    root_component_id: 'vendor_implementation_template',
    component_order: 'fixed_declared_order',
    closed_set: true,
    components: PACKAGE_COMPONENT_SPECS.map((spec, index) => ({
      component_id: spec.component_id,
      role: spec.role,
      layer: spec.layer,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    vendor_specific_components: 'forbidden',
    includes_implementations: false,
  };

  const entries: PackageManifestEntry[] = PACKAGE_COMPONENT_SPECS.map((spec) => {
    const digest = sha256(root, spec.artifact_ref);
    return {
      component_id: spec.component_id,
      artifact_ref: spec.artifact_ref,
      sha256: digest,
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    };
  });

  const package_digest = crypto
    .createHash('sha256')
    .update(entries.map((entry) => `${entry.component_id}:${entry.sha256}`).join('\n'))
    .digest('hex');

  const package_manifest: PackageManifest = {
    manifest_id: 'dsc-vendor-reference-package-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every composition member. Digests are computed read-only over the certified artifacts on disk; the package digest is the SHA256 of the ordered member digests. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    package_digest,
    package_digest_method: 'sha256_of_ordered_member_digests',
    verifies_implementations_in_this_phase: false,
  };

  const vendorReferencePackage: DirectSpatialConditioningVendorReferencePackage = {
    vendor_reference_package_id:
      'direct-spatial-conditioning-vendor-reference-package-v1',
    phase: DSC_VENDOR_REFERENCE_PACKAGE_PHASE,
    system_id: DSC_VENDOR_REFERENCE_PACKAGE_SYSTEM_ID,
    mode: 'design_only_vendor_reference_package',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PACKAGE_V1',
    package_id: VENDOR_REFERENCE_PACKAGE_ID,
    package_version: VENDOR_REFERENCE_PACKAGE_VERSION,
    package_kind: 'vendor_reference_package',
    template_ref: VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
    template_certification_ref: VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
    implementation_profile_ref: VENDOR_IMPLEMENTATION_PROFILE_PATH,
    implementation_profile_certification_ref:
      VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
    family_ref: VENDOR_IMPLEMENTATION_FAMILY_PATH,
    family_certification_ref: VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
    reference_implementation_ref: VENDOR_REFERENCE_IMPLEMENTATION_PATH,
    reference_implementation_certification_ref:
      VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
    runtime_package_ref: RUNTIME_PACKAGE_PATH,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    reference_package_schema,
    deterministic_package_identity,
    vendor_implementation_template_binding,
    package_composition,
    package_manifest,
    packaged_vendors: {
      count: 0,
      entries: [],
      packaging_policy:
        'concrete vendors may be packaged against this reference package only in a future implementation phase; none are packaged here',
      packages_vendors_in_this_phase: false,
    },
    design_constraints: {
      package_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_implementation_template: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      packages_vendors_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: new Date().toISOString(),
  };

  writeJson(root, VENDOR_REFERENCE_PACKAGE_PATH, vendorReferencePackage);
  return { vendorReferencePackage };
}
