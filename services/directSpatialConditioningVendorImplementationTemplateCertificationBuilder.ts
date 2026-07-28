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
import {
  DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE,
  DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_PROFILE_ID,
  VENDOR_IMPLEMENTATION_PROFILE_PATH,
  VENDOR_IMPLEMENTATION_PROFILE_VERSION,
  type DirectSpatialConditioningVendorImplementationProfile,
} from './directSpatialConditioningVendorImplementationProfileBuilder.js';
import { VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningVendorImplementationProfileCertificationBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE,
  DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_TEMPLATE_ID,
  VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
  VENDOR_IMPLEMENTATION_TEMPLATE_VERSION,
  type DirectSpatialConditioningVendorImplementationTemplate,
} from './directSpatialConditioningVendorImplementationTemplateBuilder.js';
import { DSC_CERTIFICATION_PATH } from './directSpatialConditioningProductionCertificationBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-074: Direct Spatial Conditioning vendor implementation template
 * certification.
 *
 * CERTIFICATION ONLY. Re-checks the five already-verified surfaces of the
 * PHASE-073 vendor implementation template on disk, plus their evidence chain,
 * reproducibility, and immutability. Purely read-only over the verified
 * artifacts: the template builder is not invoked, nothing is recalculated, and
 * no existing artifact or dataset is modified. Only the certification file is
 * written. Vendor neutral: no vendor is implemented, bound, or evaluated.
 */

export const DSC_VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PHASE =
  'PHASE-DSC-074' as const;
export const DSC_VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_V1' as const;

export const VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_ROOT =
  'exports/direct_spatial_conditioning_backend_certification/v1' as const;
export const VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH =
  `${VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_ROOT}/direct-spatial-conditioning-vendor-implementation-template-certification-v1.json` as const;

export const VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_CHECKS = [
  'implementation_template_schema',
  'identity',
  'vendor_implementation_profile_binding',
  'implementation_skeleton',
  'extension_points',
  'evidence_chain',
  'reproducibility',
  'immutability',
] as const;

export type VendorImplementationTemplateCertificationCheckId =
  (typeof VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_CHECKS)[number];

export const VENDOR_IMPLEMENTATION_TEMPLATE_SURFACES = [
  'implementation_template_schema',
  'identity',
  'vendor_implementation_profile_binding',
  'implementation_skeleton',
  'extension_points',
] as const;

export type VendorImplementationTemplateSurfaceId =
  (typeof VENDOR_IMPLEMENTATION_TEMPLATE_SURFACES)[number];

/** Artifacts this certification must never modify. */
export const VENDOR_IMPLEMENTATION_TEMPLATE_PROTECTED_ARTIFACTS: string[] = [
  VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
  VENDOR_IMPLEMENTATION_PROFILE_PATH,
  VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
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

export interface VendorImplementationTemplateCertificationCheckResult {
  check: VendorImplementationTemplateCertificationCheckId;
  passed: boolean;
  detail: string;
  evidence: Record<string, unknown>;
  errors: string[];
}

export interface VendorImplementationTemplateEvidenceChainLink {
  from_surface: string;
  field: string;
  to_artifact: string;
  resolved: boolean;
  matches_expected: boolean;
}

export interface DirectSpatialConditioningVendorImplementationTemplateCertification {
  certification_id: string;
  phase: typeof DSC_VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PHASE;
  system_id: typeof DSC_VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_SYSTEM_ID;
  mode: 'read_only_certification';
  target: string;
  certified: boolean;
  certified_system: 'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_V1';
  surfaces_certified: VendorImplementationTemplateSurfaceId[];
  template_id: typeof VENDOR_IMPLEMENTATION_TEMPLATE_ID;
  template_version: typeof VENDOR_IMPLEMENTATION_TEMPLATE_VERSION;
  checks: VendorImplementationTemplateCertificationCheckResult[];
  evidence_chain: VendorImplementationTemplateEvidenceChainLink[];
  artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }>;
  upstream_certified_system: {
    vendor_implementation_profile_ref: string;
    vendor_implementation_profile_certification_ref: string;
    vendor_implementation_profile_certified: boolean;
    vendor_implementation_family_ref: string;
    vendor_implementation_family_certification_ref: string;
    vendor_implementation_family_certified: boolean;
    vendor_reference_implementation_ref: string;
    vendor_reference_implementation_certification_ref: string;
    vendor_reference_implementation_certified: boolean;
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
    templated_implementations: 0;
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

const EXPECTED_SCHEMA_FIELDS = [
  'template_id',
  'template_version',
  'template_kind',
  'implementation_profile_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_template_identity',
  'vendor_implementation_profile_binding',
  'deterministic_implementation_skeleton',
  'extension_points',
];

/**
 * Certify the Direct Spatial Conditioning vendor implementation template by
 * re-checking the five template surfaces, their evidence chain, reproducibility,
 * and immutability on disk. Read-only over every verified artifact; writes only
 * the certification file. Does not invoke the template builder and recalculates
 * nothing.
 */
export function buildDirectSpatialConditioningVendorImplementationTemplateCertification(
  projectRoot?: string
): {
  certification: DirectSpatialConditioningVendorImplementationTemplateCertification;
} {
  const root = resolveProjectRoot(projectRoot);
  const created_at = new Date().toISOString();

  const baseline = new Map<string, string | null>();
  for (const artifact of VENDOR_IMPLEMENTATION_TEMPLATE_PROTECTED_ARTIFACTS) {
    baseline.set(artifact, sha256(root, artifact));
  }

  const checks: VendorImplementationTemplateCertificationCheckResult[] = [];
  const evidence_chain: VendorImplementationTemplateEvidenceChainLink[] = [];

  if (!exists(root, VENDOR_IMPLEMENTATION_TEMPLATE_PATH)) {
    throw new Error(
      `missing verified vendor implementation template ${VENDOR_IMPLEMENTATION_TEMPLATE_PATH}`
    );
  }

  const template = readJson<DirectSpatialConditioningVendorImplementationTemplate>(
    root,
    VENDOR_IMPLEMENTATION_TEMPLATE_PATH
  );

  // Shared identity / neutrality preconditions on the verified template.
  const identityErrors: string[] = [];
  if (template.phase !== DSC_VENDOR_IMPLEMENTATION_TEMPLATE_PHASE) {
    identityErrors.push(`phase ${template.phase}`);
  }
  if (template.system_id !== DSC_VENDOR_IMPLEMENTATION_TEMPLATE_SYSTEM_ID) {
    identityErrors.push(`system_id ${template.system_id}`);
  }
  if (template.mode !== 'design_only_vendor_implementation_template') {
    identityErrors.push(`mode ${template.mode}`);
  }
  if (
    template.target !==
    'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_V1'
  ) {
    identityErrors.push(`target ${template.target}`);
  }
  if (template.template_id !== VENDOR_IMPLEMENTATION_TEMPLATE_ID) {
    identityErrors.push(`template_id ${template.template_id}`);
  }
  if (template.template_version !== VENDOR_IMPLEMENTATION_TEMPLATE_VERSION) {
    identityErrors.push(`template_version ${template.template_version}`);
  }
  if (template.template_kind !== 'generic_vendor_implementation_template') {
    identityErrors.push(`template_kind ${template.template_kind}`);
  }

  const constraints = template.design_constraints;
  if (!constraints.template_only) identityErrors.push('not template_only');
  if (!constraints.read_only) identityErrors.push('not read_only');
  if (!constraints.vendor_neutral) identityErrors.push('not vendor neutral');
  if (!constraints.reuses_certified_vendor_implementation_profile) {
    identityErrors.push('does not reuse certified vendor implementation profile');
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
  if (constraints.templates_implementations_in_this_phase) {
    identityErrors.push('templates implementations in this phase');
  }
  if (
    template.templated_implementations.count !== 0 ||
    template.templated_implementations.entries.length !== 0 ||
    template.templated_implementations.templates_implementations_in_this_phase
  ) {
    identityErrors.push('templated_implementations not empty');
  }

  // 1) implementation_template_schema
  {
    const errors = [...identityErrors];
    const schema = template.implementation_template_schema;
    if (schema.schema_id !== 'dsc-vendor-implementation-template-schema-v1') {
      errors.push(`schema_id ${schema.schema_id}`);
    }
    if (schema.encoding !== 'application/json') {
      errors.push(`encoding ${schema.encoding}`);
    }
    if (schema.template_id_policy !== 'opaque_template_id_no_vendor_binding') {
      errors.push(`template_id_policy ${schema.template_id_policy}`);
    }
    if (schema.profile_ref !== VENDOR_IMPLEMENTATION_PROFILE_ID) {
      errors.push(`profile_ref ${schema.profile_ref}`);
    }
    if (schema.optional_fields.length !== 0 || schema.additional_fields) {
      errors.push('schema allows optional or additional fields');
    }
    if (schema.required_fields.length !== 12) {
      errors.push(`required_fields ${schema.required_fields.length}`);
    }
    const actualFields = schema.required_fields.map((field) => field.field);
    if (JSON.stringify(actualFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
      errors.push(`field order ${actualFields.join(',')}`);
    }
    for (const field of schema.required_fields) {
      if (!field.required || field.nullable || !field.type || !field.constraint) {
        errors.push(`incomplete field ${field.field}`);
      }
    }

    checks.push({
      check: 'implementation_template_schema',
      passed: errors.length === 0,
      detail:
        'implementation_template_schema present with opaque template identity policy and twelve required fields',
      evidence: {
        schema_id: schema.schema_id,
        required_fields: schema.required_fields.length,
        template_id_policy: schema.template_id_policy,
      },
      errors,
    });
  }

  // 2) identity
  {
    const errors = [...identityErrors];
    const identity = template.deterministic_template_identity;
    if (
      identity.identity_id !==
      'dsc-vendor-implementation-template-deterministic-identity-v1'
    ) {
      errors.push(`identity_id ${identity.identity_id}`);
    }
    if (identity.template_id !== VENDOR_IMPLEMENTATION_TEMPLATE_ID) {
      errors.push(`template_id ${identity.template_id}`);
    }
    if (identity.template_version !== VENDOR_IMPLEMENTATION_TEMPLATE_VERSION) {
      errors.push(`template_version ${identity.template_version}`);
    }
    if (identity.identity_policy !== 'opaque_template_id_no_vendor_binding') {
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
    if (identity.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
      errors.push(`spatial_frame_ref ${identity.spatial_frame_ref}`);
    }
    if (
      JSON.stringify(identity.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('identity channel drift');
    }

    checks.push({
      check: 'identity',
      passed: errors.length === 0,
      detail:
        'deterministic template identity is opaque, vendor-neutral, and free of seed/time/randomness',
      evidence: {
        identity_id: identity.identity_id,
        template_id: identity.template_id,
        template_version: identity.template_version,
        vendor_name: identity.vendor_name,
      },
      errors,
    });
  }

  // 3) vendor_implementation_profile_binding
  {
    const errors = [...identityErrors];
    const binding = template.vendor_implementation_profile_binding;
    if (binding.binding_id !== 'dsc-vendor-implementation-template-profile-binding-v1') {
      errors.push(`binding_id ${binding.binding_id}`);
    }
    if (binding.profile_ref !== VENDOR_IMPLEMENTATION_PROFILE_PATH) {
      errors.push(`profile_ref ${binding.profile_ref}`);
    }
    if (binding.profile_id !== VENDOR_IMPLEMENTATION_PROFILE_ID) {
      errors.push(`profile_id ${binding.profile_id}`);
    }
    if (binding.profile_version !== VENDOR_IMPLEMENTATION_PROFILE_VERSION) {
      errors.push(`profile_version ${binding.profile_version}`);
    }
    if (binding.profile_phase !== DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE) {
      errors.push(`profile_phase ${binding.profile_phase}`);
    }
    if (binding.profile_system_id !== DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID) {
      errors.push(`profile_system_id ${binding.profile_system_id}`);
    }
    if (
      binding.profile_certification_ref !== VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH
    ) {
      errors.push(`profile_certification_ref ${binding.profile_certification_ref}`);
    }
    if (binding.binding_mode !== 'exact_reuse') {
      errors.push(`binding_mode ${binding.binding_mode}`);
    }
    if (binding.role !== 'implementation_conformance_template') {
      errors.push(`role ${binding.role}`);
    }
    if (
      binding.capability_profile_ref !== 'dsc-vendor-implementation-capability-profile-v1'
    ) {
      errors.push(`capability_profile_ref ${binding.capability_profile_ref}`);
    }
    if (binding.family_ref !== VENDOR_IMPLEMENTATION_FAMILY_PATH) {
      errors.push(`family_ref ${binding.family_ref}`);
    }
    if (
      binding.family_certification_ref !== VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH
    ) {
      errors.push(`family_certification_ref ${binding.family_certification_ref}`);
    }
    if (binding.fills_extension_points_in_this_phase) {
      errors.push('fills extension points in this phase');
    }
    if (binding.implements_skeleton_in_this_phase) {
      errors.push('implements skeleton in this phase');
    }

    if (!exists(root, VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH)) {
      errors.push('vendor implementation profile certification missing');
    } else {
      const profileCert = readJson<AnyRecord>(
        root,
        VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH
      );
      if (profileCert.certified !== true) {
        errors.push('vendor implementation profile not certified');
      }
      if (
        profileCert.certified_system !==
        'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_V1'
      ) {
        errors.push('vendor implementation profile certification system mismatch');
      }
    }

    checks.push({
      check: 'vendor_implementation_profile_binding',
      passed: errors.length === 0,
      detail:
        'vendor implementation profile binding exactly reuses the certified Vendor Implementation Profile as the conformance basis without filling extension points',
      evidence: {
        binding_id: binding.binding_id,
        profile_id: binding.profile_id,
        binding_mode: binding.binding_mode,
        role: binding.role,
      },
      errors,
    });
  }

  // 4) implementation_skeleton
  {
    const errors = [...identityErrors];
    const skeleton = template.deterministic_implementation_skeleton;
    if (skeleton.skeleton_id !== 'dsc-vendor-implementation-deterministic-skeleton-v1') {
      errors.push(`skeleton_id ${skeleton.skeleton_id}`);
    }
    if (
      skeleton.capability_profile_ref !== 'dsc-vendor-implementation-capability-profile-v1'
    ) {
      errors.push(`capability_profile_ref ${skeleton.capability_profile_ref}`);
    }
    if (skeleton.vendor_capability_interface_ref !== 'dsc-vendor-capability-interface-v1') {
      errors.push(
        `vendor_capability_interface_ref ${skeleton.vendor_capability_interface_ref}`
      );
    }
    if (skeleton.purity !== 'deterministic_pure_function_per_step') {
      errors.push(`purity ${skeleton.purity}`);
    }
    if (
      skeleton.seed_dependence !== 'none' ||
      skeleton.time_dependence !== 'none' ||
      skeleton.randomness !== 'none'
    ) {
      errors.push('skeleton not free of seed/time/randomness');
    }
    if (skeleton.step_order !== 'fixed_declared_order') {
      errors.push(`step_order ${skeleton.step_order}`);
    }
    if (
      !skeleton.same_inputs_same_outcome ||
      skeleton.requires_gpu ||
      skeleton.performs_inference ||
      skeleton.implements_steps_in_this_phase
    ) {
      errors.push('skeleton constraint violation');
    }
    if (skeleton.steps.length !== 4) {
      errors.push(`steps ${skeleton.steps.length}`);
    }
    const stepMethods = skeleton.steps.map((step) => step.method_id);
    if (JSON.stringify(stepMethods) !== JSON.stringify(EXPECTED_METHODS)) {
      errors.push(`step methods ${stepMethods.join(',')}`);
    }
    skeleton.steps.forEach((step, index) => {
      if (
        step.order !== index + 1 ||
        step.side_effects !== 'none' ||
        !step.deterministic ||
        step.inherited_from !== 'dsc-vendor-implementation-capability-profile-v1' ||
        step.implemented_in_this_phase ||
        !step.signature ||
        step.reads.length === 0 ||
        !step.emits ||
        !step.extension_point_ref
      ) {
        errors.push(`step incomplete ${step.step_id}`);
      }
    });
    const stepExtensionPoints = skeleton.steps.map((step) => step.extension_point_ref);
    if (JSON.stringify(stepExtensionPoints) !== JSON.stringify(EXPECTED_EXTENSION_POINTS)) {
      errors.push(`step extension points ${stepExtensionPoints.join(',')}`);
    }

    checks.push({
      check: 'implementation_skeleton',
      passed: errors.length === 0,
      detail:
        'deterministic implementation skeleton declares four fixed-order unimplemented steps matching the certified capability profile methods',
      evidence: {
        skeleton_id: skeleton.skeleton_id,
        steps: skeleton.steps.length,
        implements_steps_in_this_phase: skeleton.implements_steps_in_this_phase,
      },
      errors,
    });
  }

  // 5) extension_points
  {
    const errors = [...identityErrors];
    const extensionPoints = template.extension_points;
    if (
      extensionPoints.extension_points_id !==
      'dsc-vendor-implementation-template-extension-points-v1'
    ) {
      errors.push(`extension_points_id ${extensionPoints.extension_points_id}`);
    }
    if (!extensionPoints.closed_set) {
      errors.push('extension points not a closed set');
    }
    if (
      extensionPoints.unknown_extension_policy !== 'reject_undeclared_extension_point'
    ) {
      errors.push(
        `unknown_extension_policy ${extensionPoints.unknown_extension_policy}`
      );
    }
    if (extensionPoints.fills_extension_points_in_this_phase) {
      errors.push('fills extension points in this phase');
    }
    if (extensionPoints.points.length !== 4) {
      errors.push(`points ${extensionPoints.points.length}`);
    }
    const pointIds = extensionPoints.points.map((point) => point.extension_point_id);
    if (JSON.stringify(pointIds) !== JSON.stringify(EXPECTED_EXTENSION_POINTS)) {
      errors.push(`extension_point_ids ${pointIds.join(',')}`);
    }
    const targetMethods = extensionPoints.points.map((point) => point.target_method_id);
    if (JSON.stringify(targetMethods) !== JSON.stringify(EXPECTED_METHODS)) {
      errors.push(`target_methods ${targetMethods.join(',')}`);
    }
    for (const point of extensionPoints.points) {
      if (
        point.inherited_from !== 'dsc-vendor-implementation-capability-profile-v1' ||
        !point.must_remain_deterministic ||
        point.may_require_gpu ||
        point.may_perform_inference ||
        point.may_modify_certified_artifacts ||
        point.filled_in_this_phase ||
        !point.contract ||
        !point.category
      ) {
        errors.push(`extension point incomplete ${point.extension_point_id}`);
      }
    }

    // Skeleton and extension points must stay paired one-to-one.
    const skeletonPointIds =
      template.deterministic_implementation_skeleton.steps.map(
        (step) => step.extension_point_ref
      );
    if (JSON.stringify(pointIds) !== JSON.stringify(skeletonPointIds)) {
      errors.push('extension points / skeleton extension point pairing drift');
    }

    checks.push({
      check: 'extension_points',
      passed: errors.length === 0,
      detail:
        'closed set of four unfilled extension points matches the skeleton steps and certified capability profile',
      evidence: {
        extension_points_id: extensionPoints.extension_points_id,
        points: extensionPoints.points.length,
        fills_extension_points_in_this_phase:
          extensionPoints.fills_extension_points_in_this_phase,
      },
      errors,
    });
  }

  // 6) Evidence chain
  {
    const errors: string[] = [];
    const links: Array<{ from: string; field: string; expected: string }> = [
      {
        from: 'vendor_implementation_template',
        field: 'implementation_profile_ref',
        expected: VENDOR_IMPLEMENTATION_PROFILE_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'implementation_profile_certification_ref',
        expected: VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'family_ref',
        expected: VENDOR_IMPLEMENTATION_FAMILY_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'family_certification_ref',
        expected: VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'reference_implementation_ref',
        expected: VENDOR_REFERENCE_IMPLEMENTATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'reference_implementation_certification_ref',
        expected: VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'vendor_template_ref',
        expected: VENDOR_TEMPLATE_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'vendor_reference_profile_ref',
        expected: VENDOR_REFERENCE_PROFILE_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'vendor_reference_profile_certification_ref',
        expected: VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'vendor_implementation_spec_ref',
        expected: VENDOR_IMPLEMENTATION_SPEC_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'vendor_execution_contract_ref',
        expected: VENDOR_EXECUTION_CONTRACT_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'vendor_router_ref',
        expected: VENDOR_ROUTER_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'vendor_compatibility_ref',
        expected: VENDOR_COMPATIBILITY_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'vendor_registry_ref',
        expected: VENDOR_REGISTRY_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'vendor_profile_ref',
        expected: VENDOR_PROFILE_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'backend_family_ref',
        expected: BACKEND_FAMILY_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'backend_family_certification_ref',
        expected: BACKEND_FAMILY_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'reference_backend_ref',
        expected: REFERENCE_BACKEND_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'reference_backend_certification_ref',
        expected: REFERENCE_BACKEND_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'backend_template_ref',
        expected: BACKEND_TEMPLATE_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'backend_template_certification_ref',
        expected: BACKEND_TEMPLATE_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'backend_profile_ref',
        expected: BACKEND_PROFILE_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'backend_profile_certification_ref',
        expected: BACKEND_PROFILE_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'backend_design_certification_ref',
        expected: BACKEND_DESIGN_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'implementation_spec_ref',
        expected: BACKEND_IMPLEMENTATION_SPEC_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'execution_contract_ref',
        expected: BACKEND_EXECUTION_CONTRACT_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'runtime_router_ref',
        expected: BACKEND_RUNTIME_ROUTER_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'adapter_registration_ref',
        expected: BACKEND_ADAPTER_REGISTRATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'compatibility_engine_ref',
        expected: BACKEND_COMPATIBILITY_ENGINE_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'capability_registry_ref',
        expected: BACKEND_CAPABILITY_REGISTRY_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'adapter_foundation_ref',
        expected: BACKEND_ADAPTER_FOUNDATION_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'runtime_interface_ref',
        expected: RUNTIME_INTERFACE_PATH,
      },
      {
        from: 'vendor_implementation_template',
        field: 'runtime_package_ref',
        expected: RUNTIME_PACKAGE_PATH,
      },
      {
        from: 'vendor_implementation_profile_binding',
        field: 'profile_ref',
        expected: VENDOR_IMPLEMENTATION_PROFILE_PATH,
      },
      {
        from: 'vendor_implementation_profile_binding',
        field: 'profile_certification_ref',
        expected: VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_profile_binding',
        field: 'family_ref',
        expected: VENDOR_IMPLEMENTATION_FAMILY_PATH,
      },
      {
        from: 'vendor_implementation_profile_binding',
        field: 'family_certification_ref',
        expected: VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
      },
    ];

    for (const link of links) {
      let source: AnyRecord;
      if (link.from === 'vendor_implementation_profile_binding') {
        source = template.vendor_implementation_profile_binding as unknown as AnyRecord;
      } else {
        source = template as unknown as AnyRecord;
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

    let profileCertified = false;
    if (!exists(root, VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH)) {
      errors.push('vendor implementation profile certification missing');
    } else {
      const profileCert = readJson<AnyRecord>(
        root,
        VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH
      );
      profileCertified = profileCert.certified === true;
      if (!profileCertified) {
        errors.push('vendor implementation profile not certified');
      }
    }

    let familyCertified = false;
    if (!exists(root, VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH)) {
      errors.push('vendor implementation family certification missing');
    } else {
      const familyCert = readJson<AnyRecord>(
        root,
        VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH
      );
      familyCertified = familyCert.certified === true;
      if (!familyCertified) {
        errors.push('vendor implementation family not certified');
      }
    }

    let referenceImplementationCertified = false;
    if (!exists(root, VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH)) {
      errors.push('vendor reference implementation certification missing');
    } else {
      const implementationCert = readJson<AnyRecord>(
        root,
        VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH
      );
      referenceImplementationCertified = implementationCert.certified === true;
      if (!referenceImplementationCertified) {
        errors.push('vendor reference implementation not certified');
      }
    }

    let vendorTemplateCertified = false;
    if (!exists(root, VENDOR_TEMPLATE_PATH)) {
      errors.push('vendor template missing');
    } else {
      const vendorTemplate = readJson<AnyRecord>(root, VENDOR_TEMPLATE_PATH);
      vendorTemplateCertified =
        vendorTemplate.target === 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_TEMPLATE_V1';
      if (!vendorTemplateCertified) {
        errors.push('vendor template not certified with PASS target');
      }
    }

    let referenceProfileCertified = false;
    if (!exists(root, VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH)) {
      errors.push('vendor reference profile certification missing');
    } else {
      const referenceProfileCert = readJson<AnyRecord>(
        root,
        VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH
      );
      referenceProfileCertified = referenceProfileCert.certified === true;
      if (!referenceProfileCertified) {
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
        'vendor implementation template references certified Vendor Implementation Profile, certified Vendor Implementation Family, certified Vendor Reference Implementation, certified Vendor Template, certified Vendor Reference Profile, and the full vendor/backend stack by exact path',
      evidence: {
        links_verified: evidence_chain.length,
        vendor_implementation_profile_certified: profileCertified,
        vendor_implementation_family_certified: familyCertified,
        vendor_reference_implementation_certified: referenceImplementationCertified,
        vendor_template_certified: vendorTemplateCertified,
        vendor_reference_profile_certified: referenceProfileCertified,
        vendor_design_certified: vendorDesignCertified,
      },
      errors,
    });
  }

  // 7) Reproducibility
  {
    const errors: string[] = [];

    const implementationProfile =
      readJson<DirectSpatialConditioningVendorImplementationProfile>(
        root,
        VENDOR_IMPLEMENTATION_PROFILE_PATH
      );
    const capabilityProfile = implementationProfile.implementation_capability_profile;
    const skeleton = template.deterministic_implementation_skeleton;
    const extensionPoints = template.extension_points;

    if (
      JSON.stringify(skeleton.steps.map((step) => step.method_id)) !==
      JSON.stringify(capabilityProfile.methods_required)
    ) {
      errors.push('skeleton methods / capability profile methods_required drift');
    }
    if (
      JSON.stringify(skeleton.steps.map((step) => step.method_id)) !==
      JSON.stringify(
        capabilityProfile.method_entries.map((entry) => entry.method_id)
      )
    ) {
      errors.push('skeleton methods / capability profile method_entries drift');
    }

    const capabilityPointByMethod = new Map(
      capabilityProfile.method_entries.map((entry) => [
        entry.method_id,
        entry.extension_point_ref,
      ])
    );
    for (const step of skeleton.steps) {
      if (step.extension_point_ref !== capabilityPointByMethod.get(step.method_id)) {
        errors.push(`skeleton extension point drift ${step.method_id}`);
      }
    }
    for (const point of extensionPoints.points) {
      if (
        point.extension_point_id !== capabilityPointByMethod.get(point.target_method_id)
      ) {
        errors.push(`extension point drift ${point.target_method_id}`);
      }
    }

    if (
      template.vendor_implementation_profile_binding.profile_id !==
        implementationProfile.profile_id ||
      template.vendor_implementation_profile_binding.profile_version !==
        implementationProfile.profile_version
    ) {
      errors.push('profile binding identity drift');
    }
    if (template.family_ref !== implementationProfile.family_ref) {
      errors.push('template family_ref / profile family_ref drift');
    }
    if (
      template.reference_implementation_ref !==
      implementationProfile.reference_implementation_ref
    ) {
      errors.push(
        'template reference_implementation_ref / profile reference_implementation_ref drift'
      );
    }

    if (
      JSON.stringify(template.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('template channel drift');
    }
    if (
      JSON.stringify(template.deterministic_template_identity.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('identity channel drift');
    }
    if (JSON.stringify(template.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
      errors.push('sources drift');
    }
    if (template.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
      errors.push('spatial frame drift');
    }
    if (
      template.capability_set_id !== CAPABILITY_SET_ID ||
      template.capability_set_version !== CAPABILITY_SET_VERSION
    ) {
      errors.push('capability set drift');
    }

    const first = sha256(root, VENDOR_IMPLEMENTATION_TEMPLATE_PATH);
    const second = sha256(root, VENDOR_IMPLEMENTATION_TEMPLATE_PATH);
    if (first === null || first !== second) {
      errors.push(`unstable artifact ${VENDOR_IMPLEMENTATION_TEMPLATE_PATH}`);
    }

    checks.push({
      check: 'reproducibility',
      passed: errors.length === 0,
      detail:
        'skeleton methods, extension points, channels, sources, spatial frame, and capability set still match the certified Vendor Implementation Profile exactly; template artifact is byte-stable',
      evidence: {
        steps_tracked: skeleton.steps.length,
        extension_points_tracked: extensionPoints.points.length,
        channels_tracked: template.required_channels.length,
        method: 'read_only_derived_parity',
      },
      errors,
    });
  }

  // 8) Immutability
  const artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }> =
    [];
  {
    const errors: string[] = [];
    for (const artifact of VENDOR_IMPLEMENTATION_TEMPLATE_PROTECTED_ARTIFACTS) {
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
        'verified vendor implementation template, certified Vendor Implementation Profile, certified Vendor Implementation Family, certified Vendor Reference Implementation, certified Vendor Template, certified Vendor Reference Profile, and the DSC V1 stack are unchanged',
      evidence: {
        protected_artifacts: VENDOR_IMPLEMENTATION_TEMPLATE_PROTECTED_ARTIFACTS.length,
        digests_recorded: artifact_digests.length,
      },
      errors,
    });
  }

  const errorCount = checks.reduce((sum, entry) => sum + entry.errors.length, 0);
  const certified = checks.every((entry) => entry.passed) && errorCount === 0;

  let profileCertified = false;
  if (exists(root, VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH)) {
    profileCertified =
      readJson<AnyRecord>(root, VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH)
        .certified === true;
  }

  let familyCertified = false;
  if (exists(root, VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH)) {
    familyCertified =
      readJson<AnyRecord>(root, VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH)
        .certified === true;
  }

  let referenceImplementationCertified = false;
  if (exists(root, VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH)) {
    referenceImplementationCertified =
      readJson<AnyRecord>(root, VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH)
        .certified === true;
  }

  let vendorTemplateCertified = false;
  if (exists(root, VENDOR_TEMPLATE_PATH)) {
    vendorTemplateCertified =
      readJson<AnyRecord>(root, VENDOR_TEMPLATE_PATH).target ===
      'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_TEMPLATE_V1';
  }

  let referenceProfileCertified = false;
  if (exists(root, VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH)) {
    referenceProfileCertified =
      readJson<AnyRecord>(root, VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH).certified ===
      true;
  }

  let vendorDesignCertified = false;
  if (exists(root, VENDOR_IMPLEMENTATION_SPEC_PATH)) {
    vendorDesignCertified =
      readJson<AnyRecord>(root, VENDOR_IMPLEMENTATION_SPEC_PATH).target ===
      'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1';
  }

  const certification: DirectSpatialConditioningVendorImplementationTemplateCertification =
    {
      certification_id:
        'direct-spatial-conditioning-vendor-implementation-template-certification-v1',
      phase: DSC_VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PHASE,
      system_id: DSC_VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_SYSTEM_ID,
      mode: 'read_only_certification',
      target:
        'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_V1',
      certified,
      certified_system: 'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_TEMPLATE_V1',
      surfaces_certified: [...VENDOR_IMPLEMENTATION_TEMPLATE_SURFACES],
      template_id: VENDOR_IMPLEMENTATION_TEMPLATE_ID,
      template_version: VENDOR_IMPLEMENTATION_TEMPLATE_VERSION,
      checks,
      evidence_chain,
      artifact_digests,
      upstream_certified_system: {
        vendor_implementation_profile_ref: VENDOR_IMPLEMENTATION_PROFILE_PATH,
        vendor_implementation_profile_certification_ref:
          VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
        vendor_implementation_profile_certified: profileCertified,
        vendor_implementation_family_ref: VENDOR_IMPLEMENTATION_FAMILY_PATH,
        vendor_implementation_family_certification_ref:
          VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
        vendor_implementation_family_certified: familyCertified,
        vendor_reference_implementation_ref: VENDOR_REFERENCE_IMPLEMENTATION_PATH,
        vendor_reference_implementation_certification_ref:
          VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
        vendor_reference_implementation_certified: referenceImplementationCertified,
        vendor_template_ref: VENDOR_TEMPLATE_PATH,
        vendor_template_certified: vendorTemplateCertified,
        vendor_reference_profile_ref: VENDOR_REFERENCE_PROFILE_PATH,
        vendor_reference_profile_certification_ref:
          VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
        vendor_reference_profile_certified: referenceProfileCertified,
        vendor_implementation_spec_ref: VENDOR_IMPLEMENTATION_SPEC_PATH,
        vendor_design_certified: vendorDesignCertified,
        runtime_package_ref: RUNTIME_PACKAGE_PATH,
        sources_supported: SOURCE_IDS.length,
      },
      vendor_neutrality: {
        vendor_neutral: true,
        vendors_bound: 0,
        vendors_implemented: 0,
        templated_implementations: 0,
        capability_set_id: CAPABILITY_SET_ID,
        capability_set_version: CAPABILITY_SET_VERSION,
      },
      integrity_method: 'sha256_read_only_recheck',
      error_count: errorCount,
      created_at,
    };

  writeJson(root, VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH, certification);
  return { certification };
}
