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
import {
  VENDOR_REFERENCE_PROFILE_ID,
  VENDOR_REFERENCE_PROFILE_PATH,
} from './directSpatialConditioningVendorReferenceProfileBuilder.js';
import { VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceProfileCertificationBuilder.js';
import {
  VENDOR_TEMPLATE_ID,
  VENDOR_TEMPLATE_PATH,
} from './directSpatialConditioningVendorTemplateBuilder.js';
import {
  VENDOR_REFERENCE_IMPLEMENTATION_ID,
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  type DirectSpatialConditioningVendorReferenceImplementation,
} from './directSpatialConditioningVendorReferenceImplementationBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH } from './directSpatialConditioningVendorReferenceImplementationCertificationBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE,
  DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_FAMILY_ID,
  VENDOR_IMPLEMENTATION_FAMILY_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_VERSION,
  type DirectSpatialConditioningVendorImplementationFamily,
} from './directSpatialConditioningVendorImplementationFamilyBuilder.js';
import { VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH } from './directSpatialConditioningVendorImplementationFamilyCertificationBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE,
  DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_PROFILE_ID,
  VENDOR_IMPLEMENTATION_PROFILE_PATH,
  VENDOR_IMPLEMENTATION_PROFILE_VERSION,
  type DirectSpatialConditioningVendorImplementationProfile,
} from './directSpatialConditioningVendorImplementationProfileBuilder.js';
import { DSC_CERTIFICATION_PATH } from './directSpatialConditioningProductionCertificationBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-072: Direct Spatial Conditioning vendor implementation profile
 * certification.
 *
 * CERTIFICATION ONLY. Re-checks the four already-verified surfaces of the
 * PHASE-071 vendor implementation profile on disk, plus their evidence chain,
 * reproducibility, and immutability. Purely read-only over the verified
 * artifacts: the profile builder is not invoked, nothing is recalculated, and
 * no existing artifact or dataset is modified. Only the certification file is
 * written. Vendor neutral: no vendor is implemented, bound, or evaluated.
 */

export const DSC_VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PHASE =
  'PHASE-DSC-072' as const;
export const DSC_VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_V1' as const;

export const VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_ROOT =
  'exports/direct_spatial_conditioning_backend_certification/v1' as const;
export const VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH =
  `${VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_ROOT}/direct-spatial-conditioning-vendor-implementation-profile-certification-v1.json` as const;

export const VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_CHECKS = [
  'implementation_profile_schema',
  'identity',
  'vendor_implementation_family_binding',
  'implementation_capability_profile',
  'evidence_chain',
  'reproducibility',
  'immutability',
] as const;

export type VendorImplementationProfileCertificationCheckId =
  (typeof VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_CHECKS)[number];

export const VENDOR_IMPLEMENTATION_PROFILE_SURFACES = [
  'implementation_profile_schema',
  'identity',
  'vendor_implementation_family_binding',
  'implementation_capability_profile',
] as const;

export type VendorImplementationProfileSurfaceId =
  (typeof VENDOR_IMPLEMENTATION_PROFILE_SURFACES)[number];

/** Artifacts this certification must never modify. */
export const VENDOR_IMPLEMENTATION_PROFILE_PROTECTED_ARTIFACTS: string[] = [
  VENDOR_IMPLEMENTATION_PROFILE_PATH,
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

export interface VendorImplementationProfileCertificationCheckResult {
  check: VendorImplementationProfileCertificationCheckId;
  passed: boolean;
  detail: string;
  evidence: Record<string, unknown>;
  errors: string[];
}

export interface VendorImplementationProfileEvidenceChainLink {
  from_surface: string;
  field: string;
  to_artifact: string;
  resolved: boolean;
  matches_expected: boolean;
}

export interface DirectSpatialConditioningVendorImplementationProfileCertification {
  certification_id: string;
  phase: typeof DSC_VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PHASE;
  system_id: typeof DSC_VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_SYSTEM_ID;
  mode: 'read_only_certification';
  target: string;
  certified: boolean;
  certified_system: 'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_V1';
  surfaces_certified: VendorImplementationProfileSurfaceId[];
  profile_id: typeof VENDOR_IMPLEMENTATION_PROFILE_ID;
  profile_version: typeof VENDOR_IMPLEMENTATION_PROFILE_VERSION;
  checks: VendorImplementationProfileCertificationCheckResult[];
  evidence_chain: VendorImplementationProfileEvidenceChainLink[];
  artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }>;
  upstream_certified_system: {
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
    profiled_members: 0;
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
  'profile_id',
  'profile_version',
  'profile_kind',
  'family_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_profile_identity',
  'vendor_implementation_family_binding',
  'implementation_capability_profile',
];

/**
 * Certify the Direct Spatial Conditioning vendor implementation profile by
 * re-checking the four profile surfaces, their evidence chain, reproducibility,
 * and immutability on disk. Read-only over every verified artifact; writes only
 * the certification file. Does not invoke the profile builder and recalculates
 * nothing.
 */
export function buildDirectSpatialConditioningVendorImplementationProfileCertification(
  projectRoot?: string
): {
  certification: DirectSpatialConditioningVendorImplementationProfileCertification;
} {
  const root = resolveProjectRoot(projectRoot);
  const created_at = new Date().toISOString();

  const baseline = new Map<string, string | null>();
  for (const artifact of VENDOR_IMPLEMENTATION_PROFILE_PROTECTED_ARTIFACTS) {
    baseline.set(artifact, sha256(root, artifact));
  }

  const checks: VendorImplementationProfileCertificationCheckResult[] = [];
  const evidence_chain: VendorImplementationProfileEvidenceChainLink[] = [];

  if (!exists(root, VENDOR_IMPLEMENTATION_PROFILE_PATH)) {
    throw new Error(
      `missing verified vendor implementation profile ${VENDOR_IMPLEMENTATION_PROFILE_PATH}`
    );
  }

  const profile = readJson<DirectSpatialConditioningVendorImplementationProfile>(
    root,
    VENDOR_IMPLEMENTATION_PROFILE_PATH
  );

  // Shared identity / neutrality preconditions on the verified profile.
  const identityErrors: string[] = [];
  if (profile.phase !== DSC_VENDOR_IMPLEMENTATION_PROFILE_PHASE) {
    identityErrors.push(`phase ${profile.phase}`);
  }
  if (profile.system_id !== DSC_VENDOR_IMPLEMENTATION_PROFILE_SYSTEM_ID) {
    identityErrors.push(`system_id ${profile.system_id}`);
  }
  if (profile.mode !== 'design_only_vendor_implementation_profile') {
    identityErrors.push(`mode ${profile.mode}`);
  }
  if (
    profile.target !== 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_V1'
  ) {
    identityErrors.push(`target ${profile.target}`);
  }
  if (profile.profile_id !== VENDOR_IMPLEMENTATION_PROFILE_ID) {
    identityErrors.push(`profile_id ${profile.profile_id}`);
  }
  if (profile.profile_version !== VENDOR_IMPLEMENTATION_PROFILE_VERSION) {
    identityErrors.push(`profile_version ${profile.profile_version}`);
  }
  if (profile.profile_kind !== 'generic_vendor_implementation_profile') {
    identityErrors.push(`profile_kind ${profile.profile_kind}`);
  }

  const constraints = profile.design_constraints;
  if (!constraints.profile_only) identityErrors.push('not profile_only');
  if (!constraints.read_only) identityErrors.push('not read_only');
  if (!constraints.vendor_neutral) identityErrors.push('not vendor neutral');
  if (!constraints.reuses_certified_vendor_implementation_family) {
    identityErrors.push('does not reuse certified vendor implementation family');
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
  if (constraints.measures_members_in_this_phase) {
    identityErrors.push('measures members in this phase');
  }
  if (
    profile.profiled_members.count !== 0 ||
    profile.profiled_members.entries.length !== 0 ||
    profile.profiled_members.measures_members_in_this_phase
  ) {
    identityErrors.push('profiled_members not empty');
  }

  // 1) implementation_profile_schema
  {
    const errors = [...identityErrors];
    const schema = profile.implementation_profile_schema;
    if (schema.schema_id !== 'dsc-vendor-implementation-profile-schema-v1') {
      errors.push(`schema_id ${schema.schema_id}`);
    }
    if (schema.encoding !== 'application/json') {
      errors.push(`encoding ${schema.encoding}`);
    }
    if (schema.profile_id_policy !== 'opaque_profile_id_no_vendor_binding') {
      errors.push(`profile_id_policy ${schema.profile_id_policy}`);
    }
    if (schema.family_ref !== VENDOR_IMPLEMENTATION_FAMILY_ID) {
      errors.push(`family_ref ${schema.family_ref}`);
    }
    if (schema.optional_fields.length !== 0 || schema.additional_fields) {
      errors.push('schema allows optional or additional fields');
    }
    if (schema.required_fields.length !== 11) {
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
      check: 'implementation_profile_schema',
      passed: errors.length === 0,
      detail:
        'implementation_profile_schema present with opaque profile identity policy and eleven required fields',
      evidence: {
        schema_id: schema.schema_id,
        required_fields: schema.required_fields.length,
        profile_id_policy: schema.profile_id_policy,
      },
      errors,
    });
  }

  // 2) identity
  {
    const errors = [...identityErrors];
    const identity = profile.deterministic_profile_identity;
    if (
      identity.identity_id !==
      'dsc-vendor-implementation-profile-deterministic-identity-v1'
    ) {
      errors.push(`identity_id ${identity.identity_id}`);
    }
    if (identity.profile_id !== VENDOR_IMPLEMENTATION_PROFILE_ID) {
      errors.push(`profile_id ${identity.profile_id}`);
    }
    if (identity.profile_version !== VENDOR_IMPLEMENTATION_PROFILE_VERSION) {
      errors.push(`profile_version ${identity.profile_version}`);
    }
    if (identity.identity_policy !== 'opaque_profile_id_no_vendor_binding') {
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
        'deterministic profile identity is opaque, vendor-neutral, and free of seed/time/randomness',
      evidence: {
        identity_id: identity.identity_id,
        profile_id: identity.profile_id,
        profile_version: identity.profile_version,
        vendor_name: identity.vendor_name,
      },
      errors,
    });
  }

  // 3) vendor_implementation_family_binding
  {
    const errors = [...identityErrors];
    const binding = profile.vendor_implementation_family_binding;
    if (binding.binding_id !== 'dsc-vendor-implementation-profile-family-binding-v1') {
      errors.push(`binding_id ${binding.binding_id}`);
    }
    if (binding.family_ref !== VENDOR_IMPLEMENTATION_FAMILY_PATH) {
      errors.push(`family_ref ${binding.family_ref}`);
    }
    if (binding.family_id !== VENDOR_IMPLEMENTATION_FAMILY_ID) {
      errors.push(`family_id ${binding.family_id}`);
    }
    if (binding.family_version !== VENDOR_IMPLEMENTATION_FAMILY_VERSION) {
      errors.push(`family_version ${binding.family_version}`);
    }
    if (binding.family_phase !== DSC_VENDOR_IMPLEMENTATION_FAMILY_PHASE) {
      errors.push(`family_phase ${binding.family_phase}`);
    }
    if (binding.family_system_id !== DSC_VENDOR_IMPLEMENTATION_FAMILY_SYSTEM_ID) {
      errors.push(`family_system_id ${binding.family_system_id}`);
    }
    if (binding.family_certification_ref !== VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH) {
      errors.push(`family_certification_ref ${binding.family_certification_ref}`);
    }
    if (binding.binding_mode !== 'exact_reuse') {
      errors.push(`binding_mode ${binding.binding_mode}`);
    }
    if (binding.role !== 'family_conformance_profile') {
      errors.push(`role ${binding.role}`);
    }
    if (binding.family_contract_ref !== 'dsc-vendor-implementation-family-contract-v1') {
      errors.push(`family_contract_ref ${binding.family_contract_ref}`);
    }
    if (binding.reference_implementation_ref !== VENDOR_REFERENCE_IMPLEMENTATION_PATH) {
      errors.push(
        `reference_implementation_ref ${binding.reference_implementation_ref}`
      );
    }
    if (binding.reference_implementation_id !== VENDOR_REFERENCE_IMPLEMENTATION_ID) {
      errors.push(`reference_implementation_id ${binding.reference_implementation_id}`);
    }
    if (binding.template_ref !== VENDOR_TEMPLATE_PATH) {
      errors.push(`template_ref ${binding.template_ref}`);
    }
    if (binding.template_id !== VENDOR_TEMPLATE_ID) {
      errors.push(`template_id ${binding.template_id}`);
    }
    if (binding.profile_ref !== VENDOR_REFERENCE_PROFILE_PATH) {
      errors.push(`profile_ref ${binding.profile_ref}`);
    }
    if (binding.profile_id !== VENDOR_REFERENCE_PROFILE_ID) {
      errors.push(`profile_id ${binding.profile_id}`);
    }
    if (binding.measures_members_in_this_phase) {
      errors.push('measures members in this phase');
    }
    if (binding.implements_family_in_this_phase) {
      errors.push('implements family in this phase');
    }

    // Upstream certified Vendor Implementation Family must still be certified.
    if (!exists(root, VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH)) {
      errors.push('vendor implementation family certification missing');
    } else {
      const familyCert = readJson<AnyRecord>(
        root,
        VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH
      );
      if (familyCert.certified !== true) {
        errors.push('vendor implementation family not certified');
      }
      if (
        familyCert.certified_system !==
        'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_FAMILY_V1'
      ) {
        errors.push('vendor implementation family certification system mismatch');
      }
    }

    checks.push({
      check: 'vendor_implementation_family_binding',
      passed: errors.length === 0,
      detail:
        'vendor implementation family binding exactly reuses the certified Vendor Implementation Family as the conformance basis without measuring members',
      evidence: {
        binding_id: binding.binding_id,
        family_id: binding.family_id,
        binding_mode: binding.binding_mode,
        role: binding.role,
      },
      errors,
    });
  }

  // 4) implementation_capability_profile
  {
    const errors = [...identityErrors];
    const capabilityProfile = profile.implementation_capability_profile;
    if (
      capabilityProfile.capability_profile_id !==
      'dsc-vendor-implementation-capability-profile-v1'
    ) {
      errors.push(`capability_profile_id ${capabilityProfile.capability_profile_id}`);
    }
    if (
      capabilityProfile.family_contract_ref !==
      'dsc-vendor-implementation-family-contract-v1'
    ) {
      errors.push(`family_contract_ref ${capabilityProfile.family_contract_ref}`);
    }
    if (
      capabilityProfile.capability_set_id !== CAPABILITY_SET_ID ||
      capabilityProfile.capability_set_version !== CAPABILITY_SET_VERSION
    ) {
      errors.push('capability set drift');
    }
    if (
      capabilityProfile.vendor_capability_interface_ref !==
      'dsc-vendor-capability-interface-v1'
    ) {
      errors.push(
        `vendor_capability_interface_ref ${capabilityProfile.vendor_capability_interface_ref}`
      );
    }
    if (capabilityProfile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
      errors.push(`spatial_frame_ref ${capabilityProfile.spatial_frame_ref}`);
    }
    if (
      JSON.stringify(capabilityProfile.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('capability profile channel drift');
    }
    if (capabilityProfile.required_sources !== SOURCE_IDS.length) {
      errors.push(`required_sources ${capabilityProfile.required_sources}`);
    }
    if (capabilityProfile.adapted_input_shape_ref !== 'dsc_adapted_conditioning_input_v1') {
      errors.push(
        `adapted_input_shape_ref ${capabilityProfile.adapted_input_shape_ref}`
      );
    }
    if (capabilityProfile.binding_mode !== 'exact_reuse') {
      errors.push(`binding_mode ${capabilityProfile.binding_mode}`);
    }
    if (capabilityProfile.purity !== 'deterministic_pure_declaration') {
      errors.push(`purity ${capabilityProfile.purity}`);
    }
    if (
      capabilityProfile.seed_dependence !== 'none' ||
      capabilityProfile.time_dependence !== 'none' ||
      capabilityProfile.randomness !== 'none'
    ) {
      errors.push('capability profile not free of seed/time/randomness');
    }
    if (
      capabilityProfile.aggregation_rule !== 'all_mandatory_capabilities_supported' ||
      capabilityProfile.undeclared_capability_policy !== 'reject' ||
      capabilityProfile.vendor_specific_capabilities !== 'forbidden' ||
      capabilityProfile.vendor_specific_extensions !== 'forbidden' ||
      !capabilityProfile.inherits_capability_declarations ||
      capabilityProfile.requires_gpu ||
      capabilityProfile.performs_inference ||
      capabilityProfile.evaluates_members_in_this_phase
    ) {
      errors.push('capability profile constraint violation');
    }
    if (capabilityProfile.capability_entries.length !== 6) {
      errors.push(
        `capability_entries ${capabilityProfile.capability_entries.length}`
      );
    }
    for (const entry of capabilityProfile.capability_entries) {
      if (
        entry.declared_state !== 'required' ||
        entry.requirement !== 'mandatory' ||
        entry.inherited_from !== 'dsc-vendor-implementation-family-contract-v1' ||
        !entry.deterministic ||
        entry.evaluated_in_this_phase
      ) {
        errors.push(`capability incomplete ${entry.capability_id}`);
      }
    }
    if (
      JSON.stringify(capabilityProfile.methods_required) !==
      JSON.stringify(EXPECTED_METHODS)
    ) {
      errors.push(`methods_required ${capabilityProfile.methods_required.join(',')}`);
    }
    const methodIds = capabilityProfile.method_entries.map((entry) => entry.method_id);
    if (JSON.stringify(methodIds) !== JSON.stringify(EXPECTED_METHODS)) {
      errors.push(`method_entries ${methodIds.join(',')}`);
    }
    const extensionPoints = capabilityProfile.method_entries.map(
      (entry) => entry.extension_point_ref
    );
    if (JSON.stringify(extensionPoints) !== JSON.stringify(EXPECTED_EXTENSION_POINTS)) {
      errors.push(`extension_points ${extensionPoints.join(',')}`);
    }
    for (const entry of capabilityProfile.method_entries) {
      if (
        entry.requirement !== 'mandatory' ||
        entry.inherited_from !== 'dsc-vendor-implementation-family-contract-v1' ||
        entry.conformance_state !== 'declared_not_evaluated' ||
        !entry.deterministic ||
        entry.side_effects !== 'none' ||
        entry.evaluated_in_this_phase
      ) {
        errors.push(`method incomplete ${entry.method_id}`);
      }
    }

    checks.push({
      check: 'implementation_capability_profile',
      passed: errors.length === 0,
      detail:
        'implementation capability profile declares six mandatory capabilities and four mandatory methods without evaluating any member',
      evidence: {
        capability_profile_id: capabilityProfile.capability_profile_id,
        capability_entries: capabilityProfile.capability_entries.length,
        method_entries: capabilityProfile.method_entries.length,
        evaluates_members_in_this_phase:
          capabilityProfile.evaluates_members_in_this_phase,
      },
      errors,
    });
  }

  // 5) Evidence chain — profile refs resolve to exact expected artifacts.
  {
    const errors: string[] = [];
    const links: Array<{ from: string; field: string; expected: string }> = [
      {
        from: 'vendor_implementation_profile',
        field: 'family_ref',
        expected: VENDOR_IMPLEMENTATION_FAMILY_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'family_certification_ref',
        expected: VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'reference_implementation_ref',
        expected: VENDOR_REFERENCE_IMPLEMENTATION_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'reference_implementation_certification_ref',
        expected: VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'template_ref',
        expected: VENDOR_TEMPLATE_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'profile_ref',
        expected: VENDOR_REFERENCE_PROFILE_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'profile_certification_ref',
        expected: VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'vendor_implementation_spec_ref',
        expected: VENDOR_IMPLEMENTATION_SPEC_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'vendor_execution_contract_ref',
        expected: VENDOR_EXECUTION_CONTRACT_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'vendor_router_ref',
        expected: VENDOR_ROUTER_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'vendor_compatibility_ref',
        expected: VENDOR_COMPATIBILITY_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'vendor_registry_ref',
        expected: VENDOR_REGISTRY_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'vendor_profile_ref',
        expected: VENDOR_PROFILE_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'backend_family_ref',
        expected: BACKEND_FAMILY_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'backend_family_certification_ref',
        expected: BACKEND_FAMILY_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'reference_backend_ref',
        expected: REFERENCE_BACKEND_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'reference_backend_certification_ref',
        expected: REFERENCE_BACKEND_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'backend_template_ref',
        expected: BACKEND_TEMPLATE_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'backend_template_certification_ref',
        expected: BACKEND_TEMPLATE_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'backend_profile_ref',
        expected: BACKEND_PROFILE_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'backend_profile_certification_ref',
        expected: BACKEND_PROFILE_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'backend_design_certification_ref',
        expected: BACKEND_DESIGN_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'implementation_spec_ref',
        expected: BACKEND_IMPLEMENTATION_SPEC_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'execution_contract_ref',
        expected: BACKEND_EXECUTION_CONTRACT_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'runtime_router_ref',
        expected: BACKEND_RUNTIME_ROUTER_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'adapter_registration_ref',
        expected: BACKEND_ADAPTER_REGISTRATION_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'compatibility_engine_ref',
        expected: BACKEND_COMPATIBILITY_ENGINE_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'capability_registry_ref',
        expected: BACKEND_CAPABILITY_REGISTRY_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'adapter_foundation_ref',
        expected: BACKEND_ADAPTER_FOUNDATION_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'runtime_interface_ref',
        expected: RUNTIME_INTERFACE_PATH,
      },
      {
        from: 'vendor_implementation_profile',
        field: 'runtime_package_ref',
        expected: RUNTIME_PACKAGE_PATH,
      },
      {
        from: 'vendor_implementation_family_binding',
        field: 'family_ref',
        expected: VENDOR_IMPLEMENTATION_FAMILY_PATH,
      },
      {
        from: 'vendor_implementation_family_binding',
        field: 'family_certification_ref',
        expected: VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_implementation_family_binding',
        field: 'reference_implementation_ref',
        expected: VENDOR_REFERENCE_IMPLEMENTATION_PATH,
      },
      {
        from: 'vendor_implementation_family_binding',
        field: 'template_ref',
        expected: VENDOR_TEMPLATE_PATH,
      },
      {
        from: 'vendor_implementation_family_binding',
        field: 'profile_ref',
        expected: VENDOR_REFERENCE_PROFILE_PATH,
      },
    ];

    for (const link of links) {
      let source: AnyRecord;
      if (link.from === 'vendor_implementation_family_binding') {
        source = profile.vendor_implementation_family_binding as unknown as AnyRecord;
      } else {
        source = profile as unknown as AnyRecord;
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
      const template = readJson<AnyRecord>(root, VENDOR_TEMPLATE_PATH);
      vendorTemplateCertified =
        template.target === 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_TEMPLATE_V1';
      if (!vendorTemplateCertified) {
        errors.push('vendor template not certified with PASS target');
      }
    }

    let referenceProfileCertified = false;
    if (!exists(root, VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH)) {
      errors.push('vendor reference profile certification missing');
    } else {
      const profileCert = readJson<AnyRecord>(
        root,
        VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH
      );
      referenceProfileCertified = profileCert.certified === true;
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
        'vendor implementation profile references certified Vendor Implementation Family, certified Vendor Reference Implementation, certified Vendor Template, certified Vendor Reference Profile, and the full vendor/backend stack by exact path',
      evidence: {
        links_verified: evidence_chain.length,
        vendor_implementation_family_certified: familyCertified,
        vendor_reference_implementation_certified: referenceImplementationCertified,
        vendor_template_certified: vendorTemplateCertified,
        vendor_reference_profile_certified: referenceProfileCertified,
        vendor_design_certified: vendorDesignCertified,
      },
      errors,
    });
  }

  // 6) Reproducibility — derived surfaces still match upstream exactly. Read-only:
  //    the profile builder is not invoked and nothing is recalculated.
  {
    const errors: string[] = [];

    const family = readJson<DirectSpatialConditioningVendorImplementationFamily>(
      root,
      VENDOR_IMPLEMENTATION_FAMILY_PATH
    );
    const contract = family.implementation_family_contract;
    const capabilityProfile = profile.implementation_capability_profile;

    const contractCapabilityIds = contract.required_capabilities.map(
      (entry) => entry.capability_id
    );
    const profileCapabilityIds = capabilityProfile.capability_entries.map(
      (entry) => entry.capability_id
    );
    if (JSON.stringify(profileCapabilityIds) !== JSON.stringify(contractCapabilityIds)) {
      errors.push('capability entries / family contract capability drift');
    }

    const contractMethodIds = contract.required_methods.map((entry) => entry.method_id);
    if (
      JSON.stringify(capabilityProfile.methods_required) !==
      JSON.stringify(contractMethodIds)
    ) {
      errors.push('methods_required / family contract methods drift');
    }
    const methodEntryIds = capabilityProfile.method_entries.map((entry) => entry.method_id);
    if (JSON.stringify(methodEntryIds) !== JSON.stringify(contractMethodIds)) {
      errors.push('method_entries / family contract methods drift');
    }

    const contractPointByMethod = new Map(
      contract.required_methods.map((entry) => [
        entry.method_id,
        entry.extension_point_ref,
      ])
    );
    for (const entry of capabilityProfile.method_entries) {
      if (entry.extension_point_ref !== contractPointByMethod.get(entry.method_id)) {
        errors.push(`method extension point drift ${entry.method_id}`);
      }
    }

    const referenceImplementation =
      readJson<DirectSpatialConditioningVendorReferenceImplementation>(
        root,
        VENDOR_REFERENCE_IMPLEMENTATION_PATH
      );
    const referenceCapabilityIds =
      referenceImplementation.reference_implementation_profile.capability_entries.map(
        (entry) => entry.capability_id
      );
    if (JSON.stringify(profileCapabilityIds) !== JSON.stringify(referenceCapabilityIds)) {
      errors.push('capability entries / reference implementation profile drift');
    }

    if (
      profile.vendor_implementation_family_binding.family_id !== family.family_id ||
      profile.vendor_implementation_family_binding.family_version !== family.family_version
    ) {
      errors.push('family binding identity drift');
    }
    if (profile.template_ref !== family.template_ref) {
      errors.push('profile template_ref / family template_ref drift');
    }
    if (profile.profile_ref !== family.profile_ref) {
      errors.push('profile profile_ref / family profile_ref drift');
    }
    if (profile.reference_implementation_ref !== family.reference_implementation_ref) {
      errors.push(
        'profile reference_implementation_ref / family reference_implementation_ref drift'
      );
    }

    if (
      JSON.stringify(profile.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('profile channel drift');
    }
    if (
      JSON.stringify(profile.deterministic_profile_identity.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('identity channel drift');
    }
    if (
      JSON.stringify(capabilityProfile.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('capability profile channel drift');
    }
    if (JSON.stringify(profile.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
      errors.push('sources drift');
    }
    if (profile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
      errors.push('spatial frame drift');
    }
    if (
      profile.capability_set_id !== CAPABILITY_SET_ID ||
      profile.capability_set_version !== CAPABILITY_SET_VERSION
    ) {
      errors.push('capability set drift');
    }

    // Byte stability: hashing the verified profile twice must agree.
    const first = sha256(root, VENDOR_IMPLEMENTATION_PROFILE_PATH);
    const second = sha256(root, VENDOR_IMPLEMENTATION_PROFILE_PATH);
    if (first === null || first !== second) {
      errors.push(`unstable artifact ${VENDOR_IMPLEMENTATION_PROFILE_PATH}`);
    }

    checks.push({
      check: 'reproducibility',
      passed: errors.length === 0,
      detail:
        'capability entries, methods, extension points, channels, sources, spatial frame, and capability set still match the certified Vendor Implementation Family contract and Vendor Reference Implementation exactly; profile artifact is byte-stable',
      evidence: {
        capabilities_tracked: profileCapabilityIds.length,
        methods_tracked: methodEntryIds.length,
        channels_tracked: profile.required_channels.length,
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
    for (const artifact of VENDOR_IMPLEMENTATION_PROFILE_PROTECTED_ARTIFACTS) {
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
        'verified vendor implementation profile, certified Vendor Implementation Family, certified Vendor Reference Implementation, certified Vendor Template, certified Vendor Reference Profile, and the DSC V1 stack are unchanged',
      evidence: {
        protected_artifacts: VENDOR_IMPLEMENTATION_PROFILE_PROTECTED_ARTIFACTS.length,
        digests_recorded: artifact_digests.length,
      },
      errors,
    });
  }

  const errorCount = checks.reduce((sum, entry) => sum + entry.errors.length, 0);
  const certified = checks.every((entry) => entry.passed) && errorCount === 0;

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

  const certification: DirectSpatialConditioningVendorImplementationProfileCertification =
    {
      certification_id:
        'direct-spatial-conditioning-vendor-implementation-profile-certification-v1',
      phase: DSC_VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PHASE,
      system_id: DSC_VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_SYSTEM_ID,
      mode: 'read_only_certification',
      target:
        'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_V1',
      certified,
      certified_system: 'DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_PROFILE_V1',
      surfaces_certified: [...VENDOR_IMPLEMENTATION_PROFILE_SURFACES],
      profile_id: VENDOR_IMPLEMENTATION_PROFILE_ID,
      profile_version: VENDOR_IMPLEMENTATION_PROFILE_VERSION,
      checks,
      evidence_chain,
      artifact_digests,
      upstream_certified_system: {
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
        profiled_members: 0,
        capability_set_id: CAPABILITY_SET_ID,
        capability_set_version: CAPABILITY_SET_VERSION,
      },
      integrity_method: 'sha256_read_only_recheck',
      error_count: errorCount,
      created_at,
    };

  writeJson(root, VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH, certification);
  return { certification };
}
