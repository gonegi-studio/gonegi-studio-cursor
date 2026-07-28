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
  VENDOR_PROFILE_ID,
  VENDOR_PROFILE_PATH,
  VENDOR_PROFILE_VERSION,
  type DirectSpatialConditioningVendorProfile,
} from './directSpatialConditioningVendorProfileBuilder.js';
import { VENDOR_REGISTRY_PATH } from './directSpatialConditioningVendorRegistryBuilder.js';
import { VENDOR_COMPATIBILITY_PATH } from './directSpatialConditioningVendorCompatibilityBuilder.js';
import { VENDOR_ROUTER_PATH } from './directSpatialConditioningVendorRouterBuilder.js';
import { VENDOR_EXECUTION_CONTRACT_PATH } from './directSpatialConditioningVendorExecutionContractBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE,
  DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID,
  VENDOR_IMPLEMENTATION_SPEC_PATH,
} from './directSpatialConditioningVendorImplementationSpecBuilder.js';
import {
  DSC_VENDOR_REFERENCE_PROFILE_PHASE,
  DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID,
  VENDOR_REFERENCE_PROFILE_ID,
  VENDOR_REFERENCE_PROFILE_PATH,
  VENDOR_REFERENCE_PROFILE_VERSION,
  type DirectSpatialConditioningVendorReferenceProfile,
} from './directSpatialConditioningVendorReferenceProfileBuilder.js';
import {
  DSC_CERTIFICATION_PATH,
} from './directSpatialConditioningProductionCertificationBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-064: Direct Spatial Conditioning vendor reference profile certification.
 *
 * CERTIFICATION ONLY. Re-checks the four already-verified surfaces of the
 * PHASE-063 vendor reference profile on disk, plus their evidence chain,
 * reproducibility, and immutability. Purely read-only over the certified
 * artifacts: the reference profile builder is not invoked, nothing is
 * recalculated, and no existing artifact or dataset is modified. Only the
 * certification file is written. Vendor neutral: no vendor is implemented,
 * bound, or evaluated.
 */

export const DSC_VENDOR_REFERENCE_PROFILE_CERTIFICATION_PHASE =
  'PHASE-DSC-064' as const;
export const DSC_VENDOR_REFERENCE_PROFILE_CERTIFICATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_CERTIFICATION_V1' as const;

export const VENDOR_REFERENCE_PROFILE_CERTIFICATION_ROOT =
  'exports/direct_spatial_conditioning_backend_certification/v1' as const;
export const VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH =
  `${VENDOR_REFERENCE_PROFILE_CERTIFICATION_ROOT}/direct-spatial-conditioning-vendor-reference-profile-certification-v1.json` as const;

export const VENDOR_REFERENCE_PROFILE_CERTIFICATION_CHECKS = [
  'profile_schema',
  'identity',
  'vendor_design_binding',
  'capability_profile',
  'evidence_chain',
  'reproducibility',
  'immutability',
] as const;

export type VendorReferenceProfileCertificationCheckId =
  (typeof VENDOR_REFERENCE_PROFILE_CERTIFICATION_CHECKS)[number];

export const VENDOR_REFERENCE_PROFILE_SURFACES = [
  'profile_schema',
  'identity',
  'vendor_design_binding',
  'capability_profile',
] as const;

export type VendorReferenceProfileSurfaceId =
  (typeof VENDOR_REFERENCE_PROFILE_SURFACES)[number];

/** Artifacts this certification must never modify. */
export const VENDOR_REFERENCE_PROFILE_PROTECTED_ARTIFACTS: string[] = [
  VENDOR_REFERENCE_PROFILE_PATH,
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

export interface VendorReferenceProfileCertificationCheckResult {
  check: VendorReferenceProfileCertificationCheckId;
  passed: boolean;
  detail: string;
  evidence: Record<string, unknown>;
  errors: string[];
}

export interface VendorReferenceProfileEvidenceChainLink {
  from_surface: string;
  field: string;
  to_artifact: string;
  resolved: boolean;
  matches_expected: boolean;
}

export interface DirectSpatialConditioningVendorReferenceProfileCertification {
  certification_id: string;
  phase: typeof DSC_VENDOR_REFERENCE_PROFILE_CERTIFICATION_PHASE;
  system_id: typeof DSC_VENDOR_REFERENCE_PROFILE_CERTIFICATION_SYSTEM_ID;
  mode: 'read_only_certification';
  target: string;
  certified: boolean;
  certified_system: 'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_V1';
  surfaces_certified: VendorReferenceProfileSurfaceId[];
  vendor_profile_id: typeof VENDOR_REFERENCE_PROFILE_ID;
  vendor_profile_version: typeof VENDOR_REFERENCE_PROFILE_VERSION;
  checks: VendorReferenceProfileCertificationCheckResult[];
  evidence_chain: VendorReferenceProfileEvidenceChainLink[];
  artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }>;
  upstream_certified_system: {
    vendor_implementation_spec_ref: string;
    vendor_design_certified: boolean;
    vendor_profile_ref: string;
    family_certification_ref: string;
    family_certified: boolean;
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

/**
 * Certify the Direct Spatial Conditioning vendor reference profile by
 * re-checking the four profile surfaces, their evidence chain,
 * reproducibility, and immutability on disk. Read-only over every certified
 * artifact; writes only the certification file. Does not invoke the profile
 * builder and recalculates nothing.
 */
export function buildDirectSpatialConditioningVendorReferenceProfileCertification(
  projectRoot?: string
): {
  certification: DirectSpatialConditioningVendorReferenceProfileCertification;
} {
  const root = resolveProjectRoot(projectRoot);
  const created_at = new Date().toISOString();

  const baseline = new Map<string, string | null>();
  for (const artifact of VENDOR_REFERENCE_PROFILE_PROTECTED_ARTIFACTS) {
    baseline.set(artifact, sha256(root, artifact));
  }

  const checks: VendorReferenceProfileCertificationCheckResult[] = [];
  const evidence_chain: VendorReferenceProfileEvidenceChainLink[] = [];

  if (!exists(root, VENDOR_REFERENCE_PROFILE_PATH)) {
    throw new Error(
      `missing verified vendor reference profile ${VENDOR_REFERENCE_PROFILE_PATH}`
    );
  }

  const profile = readJson<DirectSpatialConditioningVendorReferenceProfile>(
    root,
    VENDOR_REFERENCE_PROFILE_PATH
  );

  // Shared identity / neutrality preconditions on the verified profile.
  const identityErrors: string[] = [];
  if (profile.phase !== DSC_VENDOR_REFERENCE_PROFILE_PHASE) {
    identityErrors.push(`phase ${profile.phase}`);
  }
  if (profile.system_id !== DSC_VENDOR_REFERENCE_PROFILE_SYSTEM_ID) {
    identityErrors.push(`system_id ${profile.system_id}`);
  }
  if (profile.mode !== 'design_only_vendor_reference_profile') {
    identityErrors.push(`mode ${profile.mode}`);
  }
  if (
    profile.target !== 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_V1'
  ) {
    identityErrors.push(`target ${profile.target}`);
  }
  if (profile.vendor_profile_id !== VENDOR_REFERENCE_PROFILE_ID) {
    identityErrors.push(`vendor_profile_id ${profile.vendor_profile_id}`);
  }
  if (profile.vendor_profile_version !== VENDOR_REFERENCE_PROFILE_VERSION) {
    identityErrors.push(`vendor_profile_version ${profile.vendor_profile_version}`);
  }
  if (profile.vendor_profile_kind !== 'reference_vendor_profile') {
    identityErrors.push(`vendor_profile_kind ${profile.vendor_profile_kind}`);
  }

  const constraints = profile.design_constraints;
  if (!constraints.profile_only) identityErrors.push('not profile_only');
  if (!constraints.read_only) identityErrors.push('not read_only');
  if (!constraints.vendor_neutral) identityErrors.push('not vendor neutral');
  if (!constraints.reuses_certified_vendor_design) {
    identityErrors.push('does not reuse certified vendor design');
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
  if (constraints.binds_vendors_in_this_phase) {
    identityErrors.push('binds vendors in this phase');
  }
  if (
    profile.bound_vendors.count !== 0 ||
    profile.bound_vendors.entries.length !== 0 ||
    profile.bound_vendors.binds_vendors_in_this_phase
  ) {
    identityErrors.push('bound_vendors not empty');
  }

  // 1) profile_schema
  {
    const errors = [...identityErrors];
    const schema = profile.reference_vendor_profile_schema;
    if (schema.schema_id !== 'dsc-vendor-reference-profile-schema-v1') {
      errors.push(`schema_id ${schema.schema_id}`);
    }
    if (schema.encoding !== 'application/json') {
      errors.push(`encoding ${schema.encoding}`);
    }
    if (schema.vendor_profile_id_policy !== 'opaque_vendor_profile_id_no_vendor_binding') {
      errors.push(`vendor_profile_id_policy ${schema.vendor_profile_id_policy}`);
    }
    if (schema.generic_vendor_profile_ref !== VENDOR_PROFILE_ID) {
      errors.push(`generic_vendor_profile_ref ${schema.generic_vendor_profile_ref}`);
    }
    if (schema.optional_fields.length !== 0 || schema.additional_fields) {
      errors.push('schema allows optional or additional fields');
    }
    if (schema.required_fields.length !== 10) {
      errors.push(`required_fields ${schema.required_fields.length}`);
    }
    const expectedFields = [
      'vendor_profile_id',
      'vendor_profile_version',
      'vendor_profile_kind',
      'capability_set_id',
      'capability_set_version',
      'spatial_frame_ref',
      'required_channels',
      'deterministic_vendor_identity',
      'vendor_design_binding',
      'reference_vendor_capability_profile',
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
      check: 'profile_schema',
      passed: errors.length === 0,
      detail:
        'reference_vendor_profile_schema present with opaque identity policy and ten required fields',
      evidence: {
        schema_id: schema.schema_id,
        required_fields: schema.required_fields.length,
        vendor_profile_id_policy: schema.vendor_profile_id_policy,
      },
      errors,
    });
  }

  // 2) identity
  {
    const errors = [...identityErrors];
    const identity = profile.deterministic_vendor_identity;
    if (
      identity.identity_id !==
      'dsc-vendor-reference-profile-deterministic-identity-v1'
    ) {
      errors.push(`identity_id ${identity.identity_id}`);
    }
    if (identity.vendor_profile_id !== VENDOR_REFERENCE_PROFILE_ID) {
      errors.push(`vendor_profile_id ${identity.vendor_profile_id}`);
    }
    if (identity.vendor_profile_version !== VENDOR_REFERENCE_PROFILE_VERSION) {
      errors.push(`vendor_profile_version ${identity.vendor_profile_version}`);
    }
    if (identity.identity_policy !== 'opaque_vendor_profile_id_no_vendor_binding') {
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
        'deterministic vendor identity is opaque, vendor-neutral, and free of seed/time/randomness',
      evidence: {
        identity_id: identity.identity_id,
        vendor_profile_id: identity.vendor_profile_id,
        vendor_profile_version: identity.vendor_profile_version,
        vendor_name: identity.vendor_name,
      },
      errors,
    });
  }

  // 3) vendor_design_binding (profile binding)
  {
    const errors = [...identityErrors];
    const binding = profile.vendor_design_binding;
    if (
      binding.binding_id !== 'dsc-vendor-reference-profile-vendor-design-binding-v1'
    ) {
      errors.push(`binding_id ${binding.binding_id}`);
    }
    if (binding.vendor_implementation_spec_ref !== VENDOR_IMPLEMENTATION_SPEC_PATH) {
      errors.push(
        `vendor_implementation_spec_ref ${binding.vendor_implementation_spec_ref}`
      );
    }
    if (binding.vendor_implementation_spec_phase !== DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE) {
      errors.push(
        `vendor_implementation_spec_phase ${binding.vendor_implementation_spec_phase}`
      );
    }
    if (
      binding.vendor_implementation_spec_system_id !==
      DSC_VENDOR_IMPLEMENTATION_SPEC_SYSTEM_ID
    ) {
      errors.push(
        `vendor_implementation_spec_system_id ${binding.vendor_implementation_spec_system_id}`
      );
    }
    if (
      binding.certified_target !==
      'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1'
    ) {
      errors.push(`certified_target ${binding.certified_target}`);
    }
    if (binding.vendor_execution_contract_ref !== VENDOR_EXECUTION_CONTRACT_PATH) {
      errors.push(
        `vendor_execution_contract_ref ${binding.vendor_execution_contract_ref}`
      );
    }
    if (binding.vendor_router_ref !== VENDOR_ROUTER_PATH) {
      errors.push(`vendor_router_ref ${binding.vendor_router_ref}`);
    }
    if (binding.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH) {
      errors.push(`vendor_compatibility_ref ${binding.vendor_compatibility_ref}`);
    }
    if (binding.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
      errors.push(`vendor_registry_ref ${binding.vendor_registry_ref}`);
    }
    if (binding.generic_vendor_profile_ref !== VENDOR_PROFILE_PATH) {
      errors.push(`generic_vendor_profile_ref ${binding.generic_vendor_profile_ref}`);
    }
    if (binding.generic_vendor_profile_id !== VENDOR_PROFILE_ID) {
      errors.push(`generic_vendor_profile_id ${binding.generic_vendor_profile_id}`);
    }
    if (binding.generic_vendor_profile_version !== VENDOR_PROFILE_VERSION) {
      errors.push(
        `generic_vendor_profile_version ${binding.generic_vendor_profile_version}`
      );
    }
    if (binding.binding_mode !== 'exact_reuse') {
      errors.push(`binding_mode ${binding.binding_mode}`);
    }
    if (binding.role !== 'vendor_reference_profile_design_anchor') {
      errors.push(`role ${binding.role}`);
    }
    const expectedLayers = [
      'vendor_profile',
      'vendor_registry',
      'vendor_compatibility',
      'vendor_router',
      'vendor_execution_contract',
      'vendor_implementation_spec',
    ];
    if (
      JSON.stringify(binding.design_layers_bound) !== JSON.stringify(expectedLayers)
    ) {
      errors.push(`design_layers_bound ${binding.design_layers_bound.join(',')}`);
    }
    if (binding.instantiates_vendors_in_this_phase) {
      errors.push('instantiates vendors in this phase');
    }
    if (binding.implements_design_in_this_phase) {
      errors.push('implements design in this phase');
    }

    // Upstream certified Vendor Design must still carry its PASS target.
    if (!exists(root, VENDOR_IMPLEMENTATION_SPEC_PATH)) {
      errors.push('vendor implementation spec missing');
    } else {
      const implSpec = readJson<AnyRecord>(root, VENDOR_IMPLEMENTATION_SPEC_PATH);
      if (
        implSpec.target !==
        'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1'
      ) {
        errors.push('vendor design not certified with PASS target');
      }
    }

    checks.push({
      check: 'vendor_design_binding',
      passed: errors.length === 0,
      detail:
        'vendor design binding exactly reuses the certified Vendor Design stack across six layers',
      evidence: {
        binding_id: binding.binding_id,
        certified_target: binding.certified_target,
        design_layers_bound: binding.design_layers_bound.length,
        binding_mode: binding.binding_mode,
      },
      errors,
    });
  }

  // 4) capability_profile
  {
    const errors = [...identityErrors];
    const capabilityProfile = profile.reference_vendor_capability_profile;
    if (
      capabilityProfile.capability_profile_id !==
      'dsc-vendor-reference-capability-profile-v1'
    ) {
      errors.push(`capability_profile_id ${capabilityProfile.capability_profile_id}`);
    }
    if (
      capabilityProfile.vendor_capability_interface_ref !==
      'dsc-vendor-capability-interface-v1'
    ) {
      errors.push(
        `vendor_capability_interface_ref ${capabilityProfile.vendor_capability_interface_ref}`
      );
    }
    if (capabilityProfile.generic_vendor_profile_ref !== VENDOR_PROFILE_PATH) {
      errors.push(
        `generic_vendor_profile_ref ${capabilityProfile.generic_vendor_profile_ref}`
      );
    }
    if (
      capabilityProfile.capability_set_id !== CAPABILITY_SET_ID ||
      capabilityProfile.capability_set_version !== CAPABILITY_SET_VERSION
    ) {
      errors.push('capability set drift');
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
    if (capabilityProfile.purity !== 'deterministic_pure_function') {
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
      capabilityProfile.ordering !==
      'vendor_capability_interface_required_capability_declarations_order'
    ) {
      errors.push(`ordering ${capabilityProfile.ordering}`);
    }
    if (
      capabilityProfile.undeclared_capability_policy !== 'reject' ||
      capabilityProfile.unknown_capability_policy !== 'reject'
    ) {
      errors.push('capability rejection policy drift');
    }
    if (capabilityProfile.vendor_specific_extensions !== 'forbidden') {
      errors.push('vendor-specific extensions allowed');
    }
    if (
      capabilityProfile.requires_gpu ||
      capabilityProfile.performs_inference ||
      !capabilityProfile.maps_capabilities_in_this_phase ||
      capabilityProfile.implements_capabilities_in_this_phase
    ) {
      errors.push('capability profile constraint violation');
    }
    const expectedMethods = [
      'describe_capabilities',
      'check_compatibility',
      'bind_conditioning_input',
      'release_conditioning_binding',
    ];
    if (
      JSON.stringify(capabilityProfile.methods_required) !==
      JSON.stringify(expectedMethods)
    ) {
      errors.push(`methods_required ${capabilityProfile.methods_required.join(',')}`);
    }
    if (capabilityProfile.entries.length !== 6) {
      errors.push(`entries ${capabilityProfile.entries.length}`);
    }
    for (const entry of capabilityProfile.entries) {
      if (
        entry.declared_state !== 'supported' ||
        entry.mapping_rule !== 'mandatory_capability_maps_to_supported' ||
        entry.capability_version !== CAPABILITY_SET_VERSION ||
        entry.inherited_from !== 'dsc-vendor-capability-interface-v1' ||
        !entry.deterministic ||
        entry.evaluated_at !== 'profile_construction'
      ) {
        errors.push(`entry incomplete ${entry.capability_id}`);
      }
    }

    checks.push({
      check: 'capability_profile',
      passed: errors.length === 0,
      detail:
        'reference vendor capability profile maps six mandatory capabilities to supported with four required methods',
      evidence: {
        capability_profile_id: capabilityProfile.capability_profile_id,
        entries: capabilityProfile.entries.length,
        methods_required: capabilityProfile.methods_required.length,
        purity: capabilityProfile.purity,
      },
      errors,
    });
  }

  // 5) Evidence chain — profile refs resolve to exact expected upstream artifacts.
  {
    const errors: string[] = [];
    const links: Array<{ from: string; field: string; expected: string }> = [
      {
        from: 'vendor_reference_profile',
        field: 'vendor_implementation_spec_ref',
        expected: VENDOR_IMPLEMENTATION_SPEC_PATH,
      },
      {
        from: 'vendor_reference_profile',
        field: 'vendor_execution_contract_ref',
        expected: VENDOR_EXECUTION_CONTRACT_PATH,
      },
      {
        from: 'vendor_reference_profile',
        field: 'vendor_router_ref',
        expected: VENDOR_ROUTER_PATH,
      },
      {
        from: 'vendor_reference_profile',
        field: 'vendor_compatibility_ref',
        expected: VENDOR_COMPATIBILITY_PATH,
      },
      {
        from: 'vendor_reference_profile',
        field: 'vendor_registry_ref',
        expected: VENDOR_REGISTRY_PATH,
      },
      {
        from: 'vendor_reference_profile',
        field: 'vendor_profile_ref',
        expected: VENDOR_PROFILE_PATH,
      },
      {
        from: 'vendor_reference_profile',
        field: 'family_ref',
        expected: BACKEND_FAMILY_PATH,
      },
      {
        from: 'vendor_reference_profile',
        field: 'family_certification_ref',
        expected: BACKEND_FAMILY_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_reference_profile',
        field: 'backend_design_certification_ref',
        expected: BACKEND_DESIGN_CERTIFICATION_PATH,
      },
      {
        from: 'vendor_reference_profile',
        field: 'implementation_spec_ref',
        expected: BACKEND_IMPLEMENTATION_SPEC_PATH,
      },
      {
        from: 'vendor_reference_profile',
        field: 'runtime_interface_ref',
        expected: RUNTIME_INTERFACE_PATH,
      },
      {
        from: 'vendor_reference_profile',
        field: 'runtime_package_ref',
        expected: RUNTIME_PACKAGE_PATH,
      },
      {
        from: 'vendor_design_binding',
        field: 'vendor_implementation_spec_ref',
        expected: VENDOR_IMPLEMENTATION_SPEC_PATH,
      },
      {
        from: 'vendor_design_binding',
        field: 'generic_vendor_profile_ref',
        expected: VENDOR_PROFILE_PATH,
      },
      {
        from: 'reference_vendor_capability_profile',
        field: 'generic_vendor_profile_ref',
        expected: VENDOR_PROFILE_PATH,
      },
    ];

    for (const link of links) {
      let source: AnyRecord;
      if (link.from === 'vendor_design_binding') {
        source = profile.vendor_design_binding as unknown as AnyRecord;
      } else if (link.from === 'reference_vendor_capability_profile') {
        source = profile.reference_vendor_capability_profile as unknown as AnyRecord;
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

    let familyCertified = false;
    if (!exists(root, BACKEND_FAMILY_CERTIFICATION_PATH)) {
      errors.push('backend family certification missing');
    } else {
      const familyCert = readJson<AnyRecord>(root, BACKEND_FAMILY_CERTIFICATION_PATH);
      familyCertified = familyCert.certified === true;
      if (!familyCertified) {
        errors.push('backend family not certified');
      }
    }

    checks.push({
      check: 'evidence_chain',
      passed: errors.length === 0,
      detail:
        'vendor reference profile references certified Vendor Design, generic vendor profile, family certification, and the full vendor/backend stack by exact path',
      evidence: {
        links_verified: evidence_chain.length,
        vendor_design_certified: vendorDesignCertified,
        family_certified: familyCertified,
        vendor_implementation_spec_ref: VENDOR_IMPLEMENTATION_SPEC_PATH,
      },
      errors,
    });
  }

  // 6) Reproducibility — derived surfaces still match upstream exactly. Read-only:
  //    the profile builder is not invoked and nothing is recalculated.
  {
    const errors: string[] = [];

    const vendorProfile = readJson<DirectSpatialConditioningVendorProfile>(
      root,
      VENDOR_PROFILE_PATH
    );
    const expectedCapabilityIds =
      vendorProfile.vendor_capability_interface.required_capability_declarations.map(
        (declaration) => declaration.capability_id
      );
    const mappedIds = profile.reference_vendor_capability_profile.entries.map(
      (entry) => entry.capability_id
    );
    if (JSON.stringify(mappedIds) !== JSON.stringify(expectedCapabilityIds)) {
      errors.push('capability profile / vendor interface declaration drift');
    }

    const expectedMethods = vendorProfile.vendor_capability_interface.methods.map(
      (method) => method.method_id
    );
    if (
      JSON.stringify(profile.reference_vendor_capability_profile.methods_required) !==
      JSON.stringify(expectedMethods)
    ) {
      errors.push('capability methods / vendor interface method drift');
    }

    if (
      JSON.stringify(profile.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('profile channel drift');
    }
    if (
      JSON.stringify(profile.deterministic_vendor_identity.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('identity channel drift');
    }
    if (
      JSON.stringify(profile.reference_vendor_capability_profile.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('capability profile channel drift');
    }
    if (
      JSON.stringify(profile.sources_supported) !== JSON.stringify([...SOURCE_IDS])
    ) {
      errors.push('sources drift');
    }
    if (profile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
      errors.push('spatial frame drift');
    }
    if (
      profile.deterministic_vendor_identity.spatial_frame_ref !== SPATIAL_FRAME.frame_id
    ) {
      errors.push('identity spatial frame drift');
    }
    if (
      profile.reference_vendor_capability_profile.spatial_frame_ref !==
      SPATIAL_FRAME.frame_id
    ) {
      errors.push('capability profile spatial frame drift');
    }
    if (
      profile.capability_set_id !== CAPABILITY_SET_ID ||
      profile.capability_set_version !== CAPABILITY_SET_VERSION
    ) {
      errors.push('profile capability set drift');
    }
    if (
      profile.reference_vendor_capability_profile.capability_set_id !==
        CAPABILITY_SET_ID ||
      profile.reference_vendor_capability_profile.capability_set_version !==
        CAPABILITY_SET_VERSION
    ) {
      errors.push('capability profile capability set drift');
    }

    // Byte stability: hashing the verified profile twice must agree.
    const first = sha256(root, VENDOR_REFERENCE_PROFILE_PATH);
    const second = sha256(root, VENDOR_REFERENCE_PROFILE_PATH);
    if (first === null || first !== second) {
      errors.push(`unstable artifact ${VENDOR_REFERENCE_PROFILE_PATH}`);
    }

    checks.push({
      check: 'reproducibility',
      passed: errors.length === 0,
      detail:
        'capability profile, channels, sources, spatial frame, and capability set still match upstream exactly; profile artifact is byte-stable',
      evidence: {
        capabilities_tracked: mappedIds.length,
        channels_tracked: profile.required_channels.length,
        sources_tracked: profile.sources_supported.length,
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
    for (const artifact of VENDOR_REFERENCE_PROFILE_PROTECTED_ARTIFACTS) {
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
        'verified vendor reference profile, certified Vendor Design stack, backend certifications, and DSC V1 stack are unchanged',
      evidence: {
        protected_artifacts: VENDOR_REFERENCE_PROFILE_PROTECTED_ARTIFACTS.length,
        digests_recorded: artifact_digests.length,
      },
      errors,
    });
  }

  const errorCount = checks.reduce((sum, entry) => sum + entry.errors.length, 0);
  const certified = checks.every((entry) => entry.passed) && errorCount === 0;

  let vendorDesignCertified = false;
  if (exists(root, VENDOR_IMPLEMENTATION_SPEC_PATH)) {
    const implSpec = readJson<AnyRecord>(root, VENDOR_IMPLEMENTATION_SPEC_PATH);
    vendorDesignCertified =
      implSpec.target ===
      'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1';
  }

  let familyCertified = false;
  if (exists(root, BACKEND_FAMILY_CERTIFICATION_PATH)) {
    familyCertified =
      readJson<AnyRecord>(root, BACKEND_FAMILY_CERTIFICATION_PATH).certified === true;
  }

  const certification: DirectSpatialConditioningVendorReferenceProfileCertification =
    {
      certification_id:
        'direct-spatial-conditioning-vendor-reference-profile-certification-v1',
      phase: DSC_VENDOR_REFERENCE_PROFILE_CERTIFICATION_PHASE,
      system_id: DSC_VENDOR_REFERENCE_PROFILE_CERTIFICATION_SYSTEM_ID,
      mode: 'read_only_certification',
      target:
        'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_CERTIFICATION_V1',
      certified,
      certified_system: 'DIRECT_SPATIAL_CONDITIONING_VENDOR_REFERENCE_PROFILE_V1',
      surfaces_certified: [...VENDOR_REFERENCE_PROFILE_SURFACES],
      vendor_profile_id: VENDOR_REFERENCE_PROFILE_ID,
      vendor_profile_version: VENDOR_REFERENCE_PROFILE_VERSION,
      checks,
      evidence_chain,
      artifact_digests,
      upstream_certified_system: {
        vendor_implementation_spec_ref: VENDOR_IMPLEMENTATION_SPEC_PATH,
        vendor_design_certified: vendorDesignCertified,
        vendor_profile_ref: VENDOR_PROFILE_PATH,
        family_certification_ref: BACKEND_FAMILY_CERTIFICATION_PATH,
        family_certified: familyCertified,
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

  writeJson(root, VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH, certification);
  return { certification };
}
