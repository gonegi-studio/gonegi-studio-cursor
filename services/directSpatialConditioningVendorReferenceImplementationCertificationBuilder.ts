import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  FOUNDATION_PATH,
  SPATIAL_FRAME,
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
  type DirectSpatialConditioningVendorProfile,
} from './directSpatialConditioningVendorProfileBuilder.js';
import { VENDOR_REGISTRY_PATH } from './directSpatialConditioningVendorRegistryBuilder.js';
import { VENDOR_COMPATIBILITY_PATH } from './directSpatialConditioningVendorCompatibilityBuilder.js';
import { VENDOR_ROUTER_PATH } from './directSpatialConditioningVendorRouterBuilder.js';
import { VENDOR_EXECUTION_CONTRACT_PATH } from './directSpatialConditioningVendorExecutionContractBuilder.js';
import { VENDOR_IMPLEMENTATION_SPEC_PATH } from './directSpatialConditioningVendorImplementationSpecBuilder.js';
import {
  VENDOR_REFERENCE_PROFILE_ID,
  VENDOR_REFERENCE_PROFILE_PATH,
  VENDOR_REFERENCE_PROFILE_VERSION,
} from './directSpatialConditioningVendorReferenceProfileBuilder.js';
import { VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceProfileCertificationBuilder.js';
import {
  DSC_VENDOR_TEMPLATE_PHASE,
  DSC_VENDOR_TEMPLATE_SYSTEM_ID,
  VENDOR_TEMPLATE_ID,
  VENDOR_TEMPLATE_PATH,
  VENDOR_TEMPLATE_VERSION,
  type DirectSpatialConditioningVendorTemplate,
} from './directSpatialConditioningVendorTemplateBuilder.js';
import {
  DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE,
  DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID,
  VENDOR_REFERENCE_IMPLEMENTATION_ID,
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_VERSION,
  VENDOR_TEMPLATE_CERTIFIED_TARGET,
  type DirectSpatialConditioningVendorReferenceImplementation,
} from './directSpatialConditioningVendorReferenceImplementationBuilder.js';
import { DSC_CERTIFICATION_PATH } from './directSpatialConditioningProductionCertificationBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-068: Direct Spatial Conditioning vendor reference implementation
 * certification.
 *
 * CERTIFICATION ONLY. Re-checks the four already-verified surfaces of the
 * PHASE-067 vendor reference implementation on disk, plus their evidence
 * chain, reproducibility, and immutability. Purely read-only over the verified
 * artifacts: the reference implementation builder is not invoked, nothing is
 * recalculated, and no existing artifact or dataset is modified. Only the
 * certification file is written. Vendor neutral: no vendor is implemented,
 * bound, or evaluated.
 */

export const DSC_VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PHASE =
  'PHASE-DSC-068' as const;
export const DSC_VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_V1' as const;

export const VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_ROOT =
  'exports/direct_spatial_conditioning_backend_certification/v1' as const;
export const VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH =
  `${VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_ROOT}/direct-spatial-conditioning-vendor-reference-implementation-certification-v1.json` as const;

export const VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_CHECKS = [
  'implementation_schema',
  'identity',
  'vendor_template_binding',
  'reference_implementation_profile',
  'evidence_chain',
  'reproducibility',
  'immutability',
] as const;

export type VendorReferenceImplementationCertificationCheckId =
  (typeof VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_CHECKS)[number];

export const VENDOR_REFERENCE_IMPLEMENTATION_SURFACES = [
  'implementation_schema',
  'identity',
  'vendor_template_binding',
  'reference_implementation_profile',
] as const;

export type VendorReferenceImplementationSurfaceId =
  (typeof VENDOR_REFERENCE_IMPLEMENTATION_SURFACES)[number];

/** Artifacts this certification must never modify. */
export const VENDOR_REFERENCE_IMPLEMENTATION_PROTECTED_ARTIFACTS: string[] = [
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  VENDOR_TEMPLATE_PATH,
  VENDOR_REFERENCE_PROFILE_PATH,
  VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
  VENDOR_IMPLEMENTATION_SPEC_PATH,
  VENDOR_EXECUTION_CONTRACT_PATH,
  VENDOR_ROUTER_PATH,
  VENDOR_COMPATIBILITY_PATH,
  VENDOR_REGISTRY_PATH,
  VENDOR_PROFILE_PATH,
  FOUNDATION_PATH,
  CONTRACT_PATH,
  PACKET_PATH,
  VALIDATION_PATH,
  ASSEMBLY_PATH,
  GENERATION_PATH,
  RUNTIME_INTERFACE_PATH,
  RUNTIME_VALIDATION_PATH,
  BACKEND_ADAPTER_FOUNDATION_PATH,
  BACKEND_CAPABILITY_REGISTRY_PATH,
  BACKEND_COMPATIBILITY_ENGINE_PATH,
  BACKEND_ADAPTER_REGISTRATION_PATH,
  BACKEND_RUNTIME_ROUTER_PATH,
  BACKEND_EXECUTION_CONTRACT_PATH,
  BACKEND_IMPLEMENTATION_SPEC_PATH,
  BACKEND_PROFILE_PATH,
  BACKEND_TEMPLATE_PATH,
  REFERENCE_BACKEND_PATH,
  BACKEND_FAMILY_PATH,
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  BACKEND_FAMILY_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  DSC_CERTIFICATION_PATH,
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];

export interface VendorReferenceImplementationCertificationCheckResult {
  check: VendorReferenceImplementationCertificationCheckId;
  passed: boolean;
  detail: string;
  evidence: Record<string, unknown>;
  errors: string[];
}

export interface VendorReferenceImplementationEvidenceChainLink {
  from_surface: string;
  field: string;
  to_artifact: string;
  resolved: boolean;
  matches_expected: boolean;
}

export interface DirectSpatialConditioningVendorReferenceImplementationCertification {
  certification_id: string;
  phase: typeof DSC_VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PHASE;
  system_id: typeof DSC_VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_SYSTEM_ID;
  mode: 'read_only_certification';
  target: string;
  certified: boolean;
  certified_system: 'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_V1';
  surfaces_certified: VendorReferenceImplementationSurfaceId[];
  implementation_id: typeof VENDOR_REFERENCE_IMPLEMENTATION_ID;
  implementation_version: typeof VENDOR_REFERENCE_IMPLEMENTATION_VERSION;
  checks: VendorReferenceImplementationCertificationCheckResult[];
  evidence_chain: VendorReferenceImplementationEvidenceChainLink[];
  artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }>;
  upstream_certified_system: {
    vendor_template_ref: string;
    vendor_template_certified: boolean;
    vendor_reference_profile_ref: string;
    vendor_reference_profile_certification_ref: string;
    vendor_reference_profile_certified: boolean;
    vendor_implementation_spec_ref: string;
    vendor_design_certified: boolean;
    runtime_package_ref: string;
    sources_supported: number;
  };
  vendor_neutrality: {
    vendor_neutral: true;
    vendors_bound: 0;
    vendors_implemented: 0;
    capability_set_id: typeof CAPABILITY_SET_ID;
    capability_set_version: typeof CAPABILITY_SET_VERSION;
  };
  integrity_method: 'sha256_read_only_recheck';
  error_count: number;
  created_at: string;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function exists(root: string, relativePath: string): boolean {
  return fs.existsSync(path.join(root, relativePath));
}

function sha256(root: string, relativePath: string): string | null {
  const full = path.join(root, relativePath);
  if (!fs.existsSync(full)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  const full = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

type AnyRecord = Record<string, unknown>;

const EXPECTED_METHODS = [
  'describe_capabilities',
  'check_compatibility',
  'bind_conditioning_input',
  'release_conditioning_binding',
];

const EXPECTED_EXTENSION_POINTS = [
  'EXT_VENDOR_DECLARE_CAPABILITIES',
  'EXT_VENDOR_RESOLVE_COMPATIBILITY',
  'EXT_VENDOR_BIND_CONDITIONING_INPUT',
  'EXT_VENDOR_RELEASE_BINDING',
];

/**
 * Certify the Direct Spatial Conditioning vendor reference implementation by
 * re-checking the four implementation surfaces, their evidence chain,
 * reproducibility, and immutability on disk. Read-only over every verified
 * artifact; writes only the certification file. Does not invoke the reference
 * implementation builder and recalculates nothing.
 */
export function buildDirectSpatialConditioningVendorReferenceImplementationCertification(
  projectRoot?: string
): {
  certification: DirectSpatialConditioningVendorReferenceImplementationCertification;
} {
  const root = resolveProjectRoot(projectRoot);
  const created_at = new Date().toISOString();

  const baseline = new Map<string, string | null>();
  for (const artifact of VENDOR_REFERENCE_IMPLEMENTATION_PROTECTED_ARTIFACTS) {
    baseline.set(artifact, sha256(root, artifact));
  }

  const checks: VendorReferenceImplementationCertificationCheckResult[] = [];
  const evidence_chain: VendorReferenceImplementationEvidenceChainLink[] = [];

  if (!exists(root, VENDOR_REFERENCE_IMPLEMENTATION_PATH)) {
    throw new Error(
      `missing verified vendor reference implementation ${VENDOR_REFERENCE_IMPLEMENTATION_PATH}`
    );
  }

  const implementation =
    readJson<DirectSpatialConditioningVendorReferenceImplementation>(
      root,
      VENDOR_REFERENCE_IMPLEMENTATION_PATH
    );

  // Shared identity / neutrality preconditions on the verified implementation.
  const identityErrors: string[] = [];
  if (implementation.phase !== DSC_VENDOR_REFERENCE_IMPLEMENTATION_PHASE) {
    identityErrors.push(`phase ${implementation.phase}`);
  }
  if (implementation.system_id !== DSC_VENDOR_REFERENCE_IMPLEMENTATION_SYSTEM_ID) {
    identityErrors.push(`system_id ${implementation.system_id}`);
  }
  if (implementation.mode !== 'design_only_vendor_reference_implementation') {
    identityErrors.push(`mode ${implementation.mode}`);
  }
  if (
    implementation.target !==
    'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_V1'
  ) {
    identityErrors.push(`target ${implementation.target}`);
  }
  if (implementation.implementation_id !== VENDOR_REFERENCE_IMPLEMENTATION_ID) {
    identityErrors.push(`implementation_id ${implementation.implementation_id}`);
  }
  if (implementation.implementation_version !== VENDOR_REFERENCE_IMPLEMENTATION_VERSION) {
    identityErrors.push(
      `implementation_version ${implementation.implementation_version}`
    );
  }
  if (implementation.implementation_kind !== 'reference_vendor_implementation') {
    identityErrors.push(`implementation_kind ${implementation.implementation_kind}`);
  }

  const constraints = implementation.design_constraints;
  if (!constraints.reference_implementation_only) {
    identityErrors.push('not reference_implementation_only');
  }
  if (!constraints.read_only) identityErrors.push('not read_only');
  if (!constraints.vendor_neutral) identityErrors.push('not vendor neutral');
  if (!constraints.reuses_certified_vendor_template) {
    identityErrors.push('does not reuse certified vendor template');
  }
  if (!constraints.reuses_certified_vendor_reference_profile) {
    identityErrors.push('does not reuse certified vendor reference profile');
  }
  if (!constraints.no_actual_implementation) {
    identityErrors.push('actual implementation allowed');
  }
  if (!constraints.no_vendor_implementation) {
    identityErrors.push('vendor implementation allowed');
  }
  if (constraints.backend !== 'none') identityErrors.push('backend not none');
  if (!constraints.no_backend_implementation) {
    identityErrors.push('backend implementation allowed');
  }
  if (constraints.gpu) identityErrors.push('gpu enabled');
  if (constraints.inference) identityErrors.push('inference enabled');
  if (constraints.placeholders) identityErrors.push('placeholders declared');
  if (constraints.modifies_existing_datasets) {
    identityErrors.push('declares dataset modification');
  }
  if (constraints.implements_vendors_in_this_phase) {
    identityErrors.push('implements vendors in this phase');
  }
  if (
    implementation.implemented_vendors.count !== 0 ||
    implementation.implemented_vendors.entries.length !== 0 ||
    implementation.implemented_vendors.implements_vendors_in_this_phase
  ) {
    identityErrors.push('implemented_vendors not empty');
  }

  // 1) implementation_schema
  {
    const errors = [...identityErrors];
    const schema = implementation.reference_implementation_schema;
    if (schema.schema_id !== 'dsc-vendor-reference-implementation-schema-v1') {
      errors.push(`schema_id ${schema.schema_id}`);
    }
    if (schema.encoding !== 'application/json') {
      errors.push(`encoding ${schema.encoding}`);
    }
    if (
      schema.implementation_id_policy !==
      'opaque_implementation_id_no_vendor_binding'
    ) {
      errors.push(`implementation_id_policy ${schema.implementation_id_policy}`);
    }
    if (schema.template_ref !== VENDOR_TEMPLATE_ID) {
      errors.push(`template_ref ${schema.template_ref}`);
    }
    if (schema.profile_ref !== VENDOR_REFERENCE_PROFILE_ID) {
      errors.push(`profile_ref ${schema.profile_ref}`);
    }
    if (schema.optional_fields.length !== 0 || schema.additional_fields) {
      errors.push('schema allows optional or additional fields');
    }
    if (schema.required_fields.length !== 12) {
      errors.push(`required_fields ${schema.required_fields.length}`);
    }
    const expectedFields = [
      'implementation_id',
      'implementation_version',
      'implementation_kind',
      'template_ref',
      'profile_ref',
      'capability_set_id',
      'capability_set_version',
      'spatial_frame_ref',
      'required_channels',
      'deterministic_implementation_identity',
      'vendor_template_binding',
      'reference_implementation_profile',
    ];
    const actualFields = schema.required_fields.map((field) => field.field);
    if (JSON.stringify(actualFields) !== JSON.stringify(expectedFields)) {
      errors.push(`field order ${actualFields.join(',')}`);
    }
    for (const field of schema.required_fields) {
      if (!field.required || field.nullable || !field.type || !field.constraint) {
        errors.push(`incomplete field ${field.field}`);
      }
    }

    checks.push({
      check: 'implementation_schema',
      passed: errors.length === 0,
      detail:
        'reference_implementation_schema present with opaque identity policy and twelve required fields',
      evidence: {
        schema_id: schema.schema_id,
        required_fields: schema.required_fields.length,
        implementation_id_policy: schema.implementation_id_policy,
      },
      errors,
    });
  }

  // 2) identity
  {
    const errors = [...identityErrors];
    const identity = implementation.deterministic_implementation_identity;
    if (
      identity.identity_id !==
      'dsc-vendor-reference-implementation-deterministic-identity-v1'
    ) {
      errors.push(`identity_id ${identity.identity_id}`);
    }
    if (identity.implementation_id !== VENDOR_REFERENCE_IMPLEMENTATION_ID) {
      errors.push(`implementation_id ${identity.implementation_id}`);
    }
    if (identity.implementation_version !== VENDOR_REFERENCE_IMPLEMENTATION_VERSION) {
      errors.push(`implementation_version ${identity.implementation_version}`);
    }
    if (identity.identity_policy !== 'opaque_implementation_id_no_vendor_binding') {
      errors.push(`identity_policy ${identity.identity_policy}`);
    }
    if (identity.derivation !== 'literal_constant_declared_at_design_time') {
      errors.push(`derivation ${identity.derivation}`);
    }
    if (identity.purity !== 'deterministic_pure_constant') {
      errors.push(`purity ${identity.purity}`);
    }
    if (
      identity.seed_dependence !== 'none' ||
      identity.time_dependence !== 'none' ||
      identity.randomness !== 'none'
    ) {
      errors.push('identity not free of seed/time/randomness');
    }
    if (
      identity.vendor_binding !== 'none' ||
      identity.framework_binding !== 'none' ||
      identity.device_binding !== 'none' ||
      identity.vendor_name !== 'none'
    ) {
      errors.push('identity carries vendor/framework/device binding');
    }
    if (
      identity.capability_set_id !== CAPABILITY_SET_ID ||
      identity.capability_set_version !== CAPABILITY_SET_VERSION
    ) {
      errors.push('identity capability set drift');
    }
    if (identity.vendor_interface_version !== 'v1') {
      errors.push(`vendor_interface_version ${identity.vendor_interface_version}`);
    }
    if (identity.declared_spatial_frame !== SPATIAL_FRAME.frame_id) {
      errors.push(`declared_spatial_frame ${identity.declared_spatial_frame}`);
    }
    if (identity.declared_adapted_input_shape !== 'dsc_adapted_conditioning_input_v1') {
      errors.push(
        `declared_adapted_input_shape ${identity.declared_adapted_input_shape}`
      );
    }
    if (
      JSON.stringify(identity.declared_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('identity channel drift');
    }

    checks.push({
      check: 'identity',
      passed: errors.length === 0,
      detail:
        'deterministic implementation identity is opaque, vendor-neutral, and free of seed/time/randomness',
      evidence: {
        identity_id: identity.identity_id,
        implementation_id: identity.implementation_id,
        implementation_version: identity.implementation_version,
        vendor_name: identity.vendor_name,
      },
      errors,
    });
  }

  // 3) vendor_template_binding
  {
    const errors = [...identityErrors];
    const binding = implementation.vendor_template_binding;
    if (
      binding.binding_id !==
      'dsc-vendor-reference-implementation-template-binding-v1'
    ) {
      errors.push(`binding_id ${binding.binding_id}`);
    }
    if (binding.template_ref !== VENDOR_TEMPLATE_PATH) {
      errors.push(`template_ref ${binding.template_ref}`);
    }
    if (binding.template_id !== VENDOR_TEMPLATE_ID) {
      errors.push(`template_id ${binding.template_id}`);
    }
    if (binding.template_version !== VENDOR_TEMPLATE_VERSION) {
      errors.push(`template_version ${binding.template_version}`);
    }
    if (binding.template_phase !== DSC_VENDOR_TEMPLATE_PHASE) {
      errors.push(`template_phase ${binding.template_phase}`);
    }
    if (binding.template_system_id !== DSC_VENDOR_TEMPLATE_SYSTEM_ID) {
      errors.push(`template_system_id ${binding.template_system_id}`);
    }
    if (binding.certified_target !== VENDOR_TEMPLATE_CERTIFIED_TARGET) {
      errors.push(`certified_target ${binding.certified_target}`);
    }
    if (binding.binding_mode !== 'exact_reuse') {
      errors.push(`binding_mode ${binding.binding_mode}`);
    }
    if (binding.skeleton_ref !== 'dsc-vendor-deterministic-implementation-skeleton-v1') {
      errors.push(`skeleton_ref ${binding.skeleton_ref}`);
    }
    if (binding.extension_points_ref !== 'dsc-vendor-template-extension-points-v1') {
      errors.push(`extension_points_ref ${binding.extension_points_ref}`);
    }
    if (binding.validation_template_ref !== 'dsc-vendor-template-validation-template-v1') {
      errors.push(`validation_template_ref ${binding.validation_template_ref}`);
    }
    if (binding.fills_extension_points_in_this_phase) {
      errors.push('fills extension points in this phase');
    }
    if (binding.implements_skeleton_in_this_phase) {
      errors.push('implements skeleton in this phase');
    }
    const adoptedIds = binding.extension_points_adopted.map(
      (point) => point.extension_point_id
    );
    if (JSON.stringify(adoptedIds) !== JSON.stringify(EXPECTED_EXTENSION_POINTS)) {
      errors.push(`extension_points_adopted ${adoptedIds.join(',')}`);
    }
    for (const point of binding.extension_points_adopted) {
      if (!point.adopted || point.filled_in_this_phase || !point.target_method_id) {
        errors.push(`adopted point incomplete ${point.extension_point_id}`);
      }
    }

    // Upstream certified Vendor Template must still carry its PASS target.
    if (!exists(root, VENDOR_TEMPLATE_PATH)) {
      errors.push('vendor template missing');
    } else {
      const template = readJson<AnyRecord>(root, VENDOR_TEMPLATE_PATH);
      if (template.target !== VENDOR_TEMPLATE_CERTIFIED_TARGET) {
        errors.push('vendor template not certified with PASS target');
      }
    }

    checks.push({
      check: 'vendor_template_binding',
      passed: errors.length === 0,
      detail:
        'vendor template binding exactly reuses the certified Vendor Template and adopts its four extension points without filling any',
      evidence: {
        binding_id: binding.binding_id,
        certified_target: binding.certified_target,
        extension_points_adopted: binding.extension_points_adopted.length,
        binding_mode: binding.binding_mode,
      },
      errors,
    });
  }

  // 4) reference_implementation_profile
  {
    const errors = [...identityErrors];
    const profile = implementation.reference_implementation_profile;
    if (
      profile.implementation_profile_id !==
      'dsc-vendor-reference-implementation-profile-v1'
    ) {
      errors.push(`implementation_profile_id ${profile.implementation_profile_id}`);
    }
    if (profile.vendor_reference_profile_ref !== VENDOR_REFERENCE_PROFILE_PATH) {
      errors.push(
        `vendor_reference_profile_ref ${profile.vendor_reference_profile_ref}`
      );
    }
    if (profile.vendor_reference_profile_id !== VENDOR_REFERENCE_PROFILE_ID) {
      errors.push(
        `vendor_reference_profile_id ${profile.vendor_reference_profile_id}`
      );
    }
    if (profile.vendor_reference_profile_version !== VENDOR_REFERENCE_PROFILE_VERSION) {
      errors.push(
        `vendor_reference_profile_version ${profile.vendor_reference_profile_version}`
      );
    }
    if (
      profile.profile_certification_ref !== VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH
    ) {
      errors.push(`profile_certification_ref ${profile.profile_certification_ref}`);
    }
    if (profile.capability_profile_ref !== 'dsc-vendor-reference-capability-profile-v1') {
      errors.push(`capability_profile_ref ${profile.capability_profile_ref}`);
    }
    if (profile.binding_mode !== 'exact_reuse') {
      errors.push(`binding_mode ${profile.binding_mode}`);
    }
    if (
      profile.capability_set_id !== CAPABILITY_SET_ID ||
      profile.capability_set_version !== CAPABILITY_SET_VERSION
    ) {
      errors.push('capability set drift');
    }
    if (profile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
      errors.push(`spatial_frame_ref ${profile.spatial_frame_ref}`);
    }
    if (
      JSON.stringify(profile.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('profile channel drift');
    }
    if (profile.purity !== 'deterministic_pure_function_per_step') {
      errors.push(`purity ${profile.purity}`);
    }
    if (
      profile.seed_dependence !== 'none' ||
      profile.time_dependence !== 'none' ||
      profile.randomness !== 'none'
    ) {
      errors.push('profile not free of seed/time/randomness');
    }
    if (profile.step_order !== 'fixed_declared_order') {
      errors.push(`step_order ${profile.step_order}`);
    }
    if (
      !profile.inherits_capability_declarations ||
      profile.undeclared_capability_policy !== 'reject' ||
      profile.vendor_specific_extensions !== 'forbidden' ||
      profile.requires_gpu ||
      profile.performs_inference ||
      profile.implements_methods_in_this_phase
    ) {
      errors.push('profile constraint violation');
    }
    const stepMethods = profile.steps.map((step) => step.method_id);
    if (JSON.stringify(stepMethods) !== JSON.stringify(EXPECTED_METHODS)) {
      errors.push(`step methods ${stepMethods.join(',')}`);
    }
    profile.steps.forEach((step, index) => {
      if (
        step.order !== index + 1 ||
        step.coverage_state !== 'declared_not_implemented' ||
        step.side_effects !== 'none' ||
        !step.deterministic ||
        step.requires_gpu ||
        step.performs_inference ||
        step.implemented_in_this_phase ||
        !step.signature ||
        !step.extension_point_ref
      ) {
        errors.push(`step incomplete ${step.step_id}`);
      }
    });
    if (profile.capability_entries.length !== 6) {
      errors.push(`capability_entries ${profile.capability_entries.length}`);
    }
    for (const entry of profile.capability_entries) {
      if (
        entry.declared_state !== 'supported' ||
        entry.inherited_from !== VENDOR_REFERENCE_PROFILE_ID ||
        !entry.source_ref ||
        !entry.deterministic ||
        entry.implemented_in_this_phase
      ) {
        errors.push(`capability entry incomplete ${entry.capability_id}`);
      }
    }
    if (JSON.stringify(profile.methods_required) !== JSON.stringify(EXPECTED_METHODS)) {
      errors.push(`methods_required ${profile.methods_required.join(',')}`);
    }

    checks.push({
      check: 'reference_implementation_profile',
      passed: errors.length === 0,
      detail:
        'reference implementation profile declares four unimplemented steps and inherits six certified capability declarations with four required methods',
      evidence: {
        implementation_profile_id: profile.implementation_profile_id,
        steps: profile.steps.length,
        capability_entries: profile.capability_entries.length,
        methods_required: profile.methods_required.length,
      },
      errors,
    });
  }

  // 5) Evidence chain — implementation refs resolve to exact expected artifacts.
  {
    const errors: string[] = [];
    const links: Array<{ from: string; field: string; expected: string }> = [
      { from: 'vendor_reference_implementation', field: 'template_ref', expected: VENDOR_TEMPLATE_PATH },
      { from: 'vendor_reference_implementation', field: 'profile_ref', expected: VENDOR_REFERENCE_PROFILE_PATH },
      {
        from: 'vendor_reference_implementation',
        field: 'profile_certification_ref',
        expected: VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_reference_implementation',
        field: 'vendor_implementation_spec_ref',
        expected: VENDOR_IMPLEMENTATION_SPEC_PATH,
      },
      {
        from: 'vendor_reference_implementation',
        field: 'vendor_execution_contract_ref',
        expected: VENDOR_EXECUTION_CONTRACT_PATH,
      },
      { from: 'vendor_reference_implementation', field: 'vendor_router_ref', expected: VENDOR_ROUTER_PATH },
      {
        from: 'vendor_reference_implementation',
        field: 'vendor_compatibility_ref',
        expected: VENDOR_COMPATIBILITY_PATH,
      },
      { from: 'vendor_reference_implementation', field: 'vendor_registry_ref', expected: VENDOR_REGISTRY_PATH },
      { from: 'vendor_reference_implementation', field: 'vendor_profile_ref', expected: VENDOR_PROFILE_PATH },
      { from: 'vendor_reference_implementation', field: 'family_ref', expected: BACKEND_FAMILY_PATH },
      {
        from: 'vendor_reference_implementation',
        field: 'family_certification_ref',
        expected: BACKEND_FAMILY_CERTIFICATION_PATH,
      },
      { from: 'vendor_reference_implementation', field: 'reference_backend_ref', expected: REFERENCE_BACKEND_PATH },
      {
        from: 'vendor_reference_implementation',
        field: 'reference_backend_certification_ref',
        expected: REFERENCE_BACKEND_CERTIFICATION_PATH,
      },
      { from: 'vendor_reference_implementation', field: 'backend_template_ref', expected: BACKEND_TEMPLATE_PATH },
      {
        from: 'vendor_reference_implementation',
        field: 'backend_template_certification_ref',
        expected: BACKEND_TEMPLATE_CERTIFICATION_PATH,
      },
      { from: 'vendor_reference_implementation', field: 'backend_profile_ref', expected: BACKEND_PROFILE_PATH },
      {
        from: 'vendor_reference_implementation',
        field: 'backend_profile_certification_ref',
        expected: BACKEND_PROFILE_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_reference_implementation',
        field: 'backend_design_certification_ref',
        expected: BACKEND_DESIGN_CERTIFICATION_PATH,
      },
      { from: 'vendor_reference_implementation', field: 'runtime_interface_ref', expected: RUNTIME_INTERFACE_PATH },
      { from: 'vendor_reference_implementation', field: 'runtime_package_ref', expected: RUNTIME_PACKAGE_PATH },
      { from: 'vendor_template_binding', field: 'template_ref', expected: VENDOR_TEMPLATE_PATH },
      {
        from: 'reference_implementation_profile',
        field: 'vendor_reference_profile_ref',
        expected: VENDOR_REFERENCE_PROFILE_PATH,
      },
      {
        from: 'reference_implementation_profile',
        field: 'profile_certification_ref',
        expected: VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
      },
    ];

    for (const link of links) {
      let source: AnyRecord;
      if (link.from === 'vendor_template_binding') {
        source = implementation.vendor_template_binding as unknown as AnyRecord;
      } else if (link.from === 'reference_implementation_profile') {
        source = implementation.reference_implementation_profile as unknown as AnyRecord;
      } else {
        source = implementation as unknown as AnyRecord;
      }
      const value = source[link.field] as string | undefined;
      const matches = value === link.expected;
      const resolved = typeof value === 'string' && exists(root, value);
      evidence_chain.push({
        from_surface: link.from,
        field: link.field,
        to_artifact: link.expected,
        resolved,
        matches_expected: matches,
      });
      if (!matches) errors.push(`${link.from}.${link.field} = ${String(value)}`);
      if (!resolved) errors.push(`${link.from}.${link.field} unresolved on disk`);
    }

    let vendorTemplateCertified = false;
    if (!exists(root, VENDOR_TEMPLATE_PATH)) {
      errors.push('vendor template missing');
    } else {
      const template = readJson<AnyRecord>(root, VENDOR_TEMPLATE_PATH);
      vendorTemplateCertified = template.target === VENDOR_TEMPLATE_CERTIFIED_TARGET;
      if (!vendorTemplateCertified) {
        errors.push('vendor template not certified with PASS target');
      }
    }

    let profileCertified = false;
    if (!exists(root, VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH)) {
      errors.push('vendor reference profile certification missing');
    } else {
      const profileCert = readJson<AnyRecord>(
        root,
        VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH
      );
      profileCertified = profileCert.certified === true;
      if (!profileCertified) {
        errors.push('vendor reference profile not certified');
      }
    }

    let vendorDesignCertified = false;
    if (!exists(root, VENDOR_IMPLEMENTATION_SPEC_PATH)) {
      errors.push('vendor implementation specification missing');
    } else {
      const implSpec = readJson<AnyRecord>(root, VENDOR_IMPLEMENTATION_SPEC_PATH);
      vendorDesignCertified =
        implSpec.target ===
        'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1';
      if (!vendorDesignCertified) {
        errors.push('vendor design stack not certified');
      }
    }

    checks.push({
      check: 'evidence_chain',
      passed: errors.length === 0,
      detail:
        'vendor reference implementation references certified Vendor Template, certified Vendor Reference Profile, and the full vendor/backend stack by exact path',
      evidence: {
        links_verified: evidence_chain.length,
        vendor_template_certified: vendorTemplateCertified,
        vendor_reference_profile_certified: profileCertified,
        vendor_design_certified: vendorDesignCertified,
      },
      errors,
    });
  }

  // 6) Reproducibility — derived surfaces still match upstream exactly. Read-only:
  //    the implementation builder is not invoked and nothing is recalculated.
  {
    const errors: string[] = [];

    const template = readJson<DirectSpatialConditioningVendorTemplate>(
      root,
      VENDOR_TEMPLATE_PATH
    );
    const templateSteps = template.deterministic_implementation_skeleton.steps;
    const profile = implementation.reference_implementation_profile;

    if (
      JSON.stringify(profile.steps.map((step) => step.method_id)) !==
      JSON.stringify(templateSteps.map((step) => step.method_id))
    ) {
      errors.push('profile step / template skeleton method drift');
    }
    const templateSignatures = new Map(
      templateSteps.map((step) => [step.method_id, step.signature])
    );
    const templatePoints = new Map(
      templateSteps.map((step) => [step.method_id, step.extension_point_ref])
    );
    for (const step of profile.steps) {
      if (step.signature !== templateSignatures.get(step.method_id)) {
        errors.push(`profile signature drift ${step.method_id}`);
      }
      if (step.extension_point_ref !== templatePoints.get(step.method_id)) {
        errors.push(`profile extension point drift ${step.method_id}`);
      }
    }
    const templatePointIds = template.extension_points.points.map(
      (point) => point.extension_point_id
    );
    const adoptedIds = implementation.vendor_template_binding.extension_points_adopted.map(
      (point) => point.extension_point_id
    );
    if (JSON.stringify(adoptedIds) !== JSON.stringify(templatePointIds)) {
      errors.push('adopted extension points / template extension point drift');
    }

    const referenceProfile = readJson<AnyRecord>(root, VENDOR_REFERENCE_PROFILE_PATH);
    const capabilityProfile =
      referenceProfile.reference_vendor_capability_profile as AnyRecord;
    const certifiedCapabilityIds = (
      capabilityProfile.entries as Array<{ capability_id: string }>
    ).map((entry) => entry.capability_id);
    const profileCapabilityIds = profile.capability_entries.map(
      (entry) => entry.capability_id
    );
    if (JSON.stringify(profileCapabilityIds) !== JSON.stringify(certifiedCapabilityIds)) {
      errors.push('capability entries / certified capability profile drift');
    }
    if (
      JSON.stringify(profile.methods_required) !==
      JSON.stringify(capabilityProfile.methods_required)
    ) {
      errors.push('methods_required / certified capability profile drift');
    }

    const vendorProfile = readJson<DirectSpatialConditioningVendorProfile>(
      root,
      VENDOR_PROFILE_PATH
    );
    const vendorMethodIds = vendorProfile.vendor_capability_interface.methods.map(
      (method) => method.method_id
    );
    if (JSON.stringify(profile.methods_required) !== JSON.stringify(vendorMethodIds)) {
      errors.push('methods_required / vendor interface method drift');
    }

    if (
      JSON.stringify(implementation.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('implementation channel drift');
    }
    if (
      JSON.stringify(
        implementation.deterministic_implementation_identity.declared_channels
      ) !== JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('identity channel drift');
    }
    if (
      JSON.stringify(profile.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('profile channel drift');
    }
    if (
      JSON.stringify(implementation.sources_supported) !==
      JSON.stringify([...SOURCE_IDS])
    ) {
      errors.push('sources drift');
    }
    if (implementation.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
      errors.push('spatial frame drift');
    }
    if (
      implementation.capability_set_id !== CAPABILITY_SET_ID ||
      implementation.capability_set_version !== CAPABILITY_SET_VERSION
    ) {
      errors.push('capability set drift');
    }

    // Byte stability: hashing the verified implementation twice must agree.
    const first = sha256(root, VENDOR_REFERENCE_IMPLEMENTATION_PATH);
    const second = sha256(root, VENDOR_REFERENCE_IMPLEMENTATION_PATH);
    if (first === null || first !== second) {
      errors.push(`unstable artifact ${VENDOR_REFERENCE_IMPLEMENTATION_PATH}`);
    }

    checks.push({
      check: 'reproducibility',
      passed: errors.length === 0,
      detail:
        'profile steps, adopted extension points, capability entries, channels, sources, spatial frame, and capability set still match upstream exactly; implementation artifact is byte-stable',
      evidence: {
        steps_tracked: profile.steps.length,
        capabilities_tracked: profileCapabilityIds.length,
        channels_tracked: implementation.required_channels.length,
        method: 'read_only_derived_parity',
      },
      errors,
    });
  }

  // 7) Immutability — nothing in the protected set changed during certification.
  const artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }> =
    [];
  {
    const errors: string[] = [];
    for (const artifact of VENDOR_REFERENCE_IMPLEMENTATION_PROTECTED_ARTIFACTS) {
      const full = path.join(root, artifact);
      if (!fs.existsSync(full)) {
        errors.push(`protected artifact missing ${artifact}`);
        continue;
      }
      const current = sha256(root, artifact);
      if (current !== baseline.get(artifact)) {
        errors.push(`protected artifact mutated ${artifact}`);
        continue;
      }
      artifact_digests.push({
        artifact,
        sha256: current as string,
        bytes: fs.statSync(full).size,
      });
    }

    checks.push({
      check: 'immutability',
      passed: errors.length === 0,
      detail:
        'verified vendor reference implementation, certified Vendor Template, certified Vendor Reference Profile, and the DSC V1 stack are unchanged',
      evidence: {
        protected_artifacts: VENDOR_REFERENCE_IMPLEMENTATION_PROTECTED_ARTIFACTS.length,
        digests_recorded: artifact_digests.length,
      },
      errors,
    });
  }

  const errorCount = checks.reduce((sum, entry) => sum + entry.errors.length, 0);
  const certified = checks.every((entry) => entry.passed) && errorCount === 0;

  let vendorTemplateCertified = false;
  if (exists(root, VENDOR_TEMPLATE_PATH)) {
    vendorTemplateCertified =
      readJson<AnyRecord>(root, VENDOR_TEMPLATE_PATH).target ===
      VENDOR_TEMPLATE_CERTIFIED_TARGET;
  }

  let profileCertified = false;
  if (exists(root, VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH)) {
    profileCertified =
      readJson<AnyRecord>(root, VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH).certified ===
      true;
  }

  let vendorDesignCertified = false;
  if (exists(root, VENDOR_IMPLEMENTATION_SPEC_PATH)) {
    vendorDesignCertified =
      readJson<AnyRecord>(root, VENDOR_IMPLEMENTATION_SPEC_PATH).target ===
      'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1';
  }

  const certification: DirectSpatialConditioningVendorReferenceImplementationCertification =
    {
      certification_id:
        'direct-spatial-conditioning-vendor-reference-implementation-certification-v1',
      phase: DSC_VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PHASE,
      system_id: DSC_VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_SYSTEM_ID,
      mode: 'read_only_certification',
      target:
        'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_V1',
      certified,
      certified_system:
        'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_IMPLEMENTATION_V1',
      surfaces_certified: [...VENDOR_REFERENCE_IMPLEMENTATION_SURFACES],
      implementation_id: VENDOR_REFERENCE_IMPLEMENTATION_ID,
      implementation_version: VENDOR_REFERENCE_IMPLEMENTATION_VERSION,
      checks,
      evidence_chain,
      artifact_digests,
      upstream_certified_system: {
        vendor_template_ref: VENDOR_TEMPLATE_PATH,
        vendor_template_certified: vendorTemplateCertified,
        vendor_reference_profile_ref: VENDOR_REFERENCE_PROFILE_PATH,
        vendor_reference_profile_certification_ref:
          VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
        vendor_reference_profile_certified: profileCertified,
        vendor_implementation_spec_ref: VENDOR_IMPLEMENTATION_SPEC_PATH,
        vendor_design_certified: vendorDesignCertified,
        runtime_package_ref: RUNTIME_PACKAGE_PATH,
        sources_supported: SOURCE_IDS.length,
      },
      vendor_neutrality: {
        vendor_neutral: true,
        vendors_bound: 0,
        vendors_implemented: 0,
        capability_set_id: CAPABILITY_SET_ID,
        capability_set_version: CAPABILITY_SET_VERSION,
      },
      integrity_method: 'sha256_read_only_recheck',
      error_count: errorCount,
      created_at,
    };

  writeJson(root, VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH, certification);
  return { certification };
}
