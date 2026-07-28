import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
} from './directSpatialConditioningFoundationBuilder.js';
import {
  BACKEND_PROTECTED_ARTIFACTS,
  BACKEND_DESIGN_CERTIFICATION_PATH,
} from './directSpatialConditioningBackendDesignCertificationBuilder.js';
import {
  BACKEND_ADAPTER_FOUNDATION_PATH,
} from './directSpatialConditioningBackendAdapterFoundationBuilder.js';
import {
  BACKEND_CAPABILITY_REGISTRY_PATH,
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
  type DirectSpatialConditioningBackendCapabilityRegistry,
} from './directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import {
  BACKEND_COMPATIBILITY_ENGINE_PATH,
} from './directSpatialConditioningBackendCompatibilityEngineBuilder.js';
import {
  BACKEND_ADAPTER_REGISTRATION_PATH,
} from './directSpatialConditioningBackendAdapterRegistrationBuilder.js';
import {
  BACKEND_RUNTIME_ROUTER_PATH,
} from './directSpatialConditioningBackendRuntimeRouterBuilder.js';
import {
  BACKEND_EXECUTION_CONTRACT_PATH,
} from './directSpatialConditioningBackendExecutionContractBuilder.js';
import {
  BACKEND_IMPLEMENTATION_SPEC_PATH,
} from './directSpatialConditioningBackendImplementationSpecBuilder.js';
import {
  BACKEND_PROFILE_ID,
  BACKEND_PROFILE_PATH,
  BACKEND_PROFILE_VERSION,
  DSC_BACKEND_PROFILE_PHASE,
  DSC_BACKEND_PROFILE_SYSTEM_ID,
  type DirectSpatialConditioningBackendProfile,
} from './directSpatialConditioningBackendProfileBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-048: Direct Spatial Conditioning backend profile certification.
 *
 * CERTIFICATION ONLY. Re-checks the four already-verified surfaces of the
 * PHASE-047 backend profile on disk, plus their evidence chain,
 * reproducibility, and immutability. Purely read-only over the certified
 * artifacts: the profile builder is not invoked, nothing is recalculated, and
 * no existing artifact or dataset is modified. Only the certification file is
 * written. Backend agnostic: no backend is implemented, bound, or evaluated.
 */

export const DSC_BACKEND_PROFILE_CERTIFICATION_PHASE = 'PHASE-DSC-048' as const;
export const DSC_BACKEND_PROFILE_CERTIFICATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_CERTIFICATION_V1' as const;

export const BACKEND_PROFILE_CERTIFICATION_ROOT =
  'exports/direct_spatial_conditioning_backend_certification/v1' as const;
export const BACKEND_PROFILE_CERTIFICATION_PATH =
  `${BACKEND_PROFILE_CERTIFICATION_ROOT}/direct-spatial-conditioning-backend-profile-certification-v1.json` as const;

export const BACKEND_PROFILE_CERTIFICATION_CHECKS = [
  'profile_schema',
  'capability_mapping',
  'adapter_configuration',
  'profile_validation',
  'evidence_chain',
  'reproducibility',
  'immutability',
] as const;

export type BackendProfileCertificationCheckId =
  (typeof BACKEND_PROFILE_CERTIFICATION_CHECKS)[number];

export const BACKEND_PROFILE_SURFACES = [
  'profile_schema',
  'capability_mapping',
  'adapter_configuration',
  'profile_validation',
] as const;

export type BackendProfileSurfaceId = (typeof BACKEND_PROFILE_SURFACES)[number];

/** Artifacts this certification must never modify. */
export const BACKEND_PROFILE_PROTECTED_ARTIFACTS: string[] = [
  BACKEND_PROFILE_PATH,
  BACKEND_DESIGN_CERTIFICATION_PATH,
  ...BACKEND_PROTECTED_ARTIFACTS,
];

export interface BackendProfileCertificationCheckResult {
  check: BackendProfileCertificationCheckId;
  passed: boolean;
  detail: string;
  evidence: Record<string, unknown>;
  errors: string[];
}

export interface BackendProfileEvidenceChainLink {
  from_surface: string;
  field: string;
  to_artifact: string;
  resolved: boolean;
  matches_expected: boolean;
}

export interface DirectSpatialConditioningBackendProfileCertification {
  certification_id: string;
  phase: typeof DSC_BACKEND_PROFILE_CERTIFICATION_PHASE;
  system_id: typeof DSC_BACKEND_PROFILE_CERTIFICATION_SYSTEM_ID;
  mode: 'read_only_certification';
  target: string;
  certified: boolean;
  certified_system: 'DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_V1';
  surfaces_certified: BackendProfileSurfaceId[];
  profile_id: typeof BACKEND_PROFILE_ID;
  profile_version: typeof BACKEND_PROFILE_VERSION;
  checks: BackendProfileCertificationCheckResult[];
  evidence_chain: BackendProfileEvidenceChainLink[];
  artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }>;
  upstream_certified_system: {
    backend_design_certification_ref: string;
    backend_design_certified: boolean;
    implementation_spec_ref: string;
    capability_registry_ref: string;
    runtime_package_ref: string;
    sources_supported: number;
  };
  backend_neutrality: {
    backend_agnostic: true;
    backends_bound: 0;
    backends_implemented: 0;
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
 * Certify the Direct Spatial Conditioning backend profile by re-checking the
 * four profile surfaces, their evidence chain, reproducibility, and
 * immutability on disk. Read-only over every certified artifact; writes only
 * the certification file.
 */
export function buildDirectSpatialConditioningBackendProfileCertification(
  projectRoot?: string
): { certification: DirectSpatialConditioningBackendProfileCertification } {
  const root = resolveProjectRoot(projectRoot);
  const created_at = new Date().toISOString();

  const baseline = new Map<string, string | null>();
  for (const artifact of BACKEND_PROFILE_PROTECTED_ARTIFACTS) {
    baseline.set(artifact, sha256(root, artifact));
  }

  const checks: BackendProfileCertificationCheckResult[] = [];
  const evidence_chain: BackendProfileEvidenceChainLink[] = [];

  if (!exists(root, BACKEND_PROFILE_PATH)) {
    throw new Error(`missing verified profile ${BACKEND_PROFILE_PATH}`);
  }

  const profile = readJson<DirectSpatialConditioningBackendProfile>(
    root,
    BACKEND_PROFILE_PATH
  );

  // Shared identity / neutrality preconditions on the verified profile.
  const identityErrors: string[] = [];
  if (profile.phase !== DSC_BACKEND_PROFILE_PHASE) {
    identityErrors.push(`phase ${profile.phase}`);
  }
  if (profile.system_id !== DSC_BACKEND_PROFILE_SYSTEM_ID) {
    identityErrors.push(`system_id ${profile.system_id}`);
  }
  if (profile.mode !== 'design_only_profile') {
    identityErrors.push(`mode ${profile.mode}`);
  }
  if (profile.target !== 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_V1') {
    identityErrors.push(`target ${profile.target}`);
  }
  if (profile.profile_id !== BACKEND_PROFILE_ID) {
    identityErrors.push(`profile_id ${profile.profile_id}`);
  }
  if (profile.profile_version !== BACKEND_PROFILE_VERSION) {
    identityErrors.push(`profile_version ${profile.profile_version}`);
  }
  if (profile.profile_kind !== 'reference_profile') {
    identityErrors.push(`profile_kind ${profile.profile_kind}`);
  }

  const constraints = profile.design_constraints;
  if (!constraints.profile_only) identityErrors.push('not profile_only');
  if (!constraints.read_only) identityErrors.push('not read_only');
  if (!constraints.backend_agnostic) identityErrors.push('not backend agnostic');
  if (!constraints.reuses_implementation_spec) {
    identityErrors.push('does not reuse implementation spec');
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
  if (constraints.binds_backends_in_this_phase) {
    identityErrors.push('binds backends in this phase');
  }
  if (
    profile.bound_backends.count !== 0 ||
    profile.bound_backends.entries.length !== 0 ||
    profile.bound_backends.binds_backends_in_this_phase
  ) {
    identityErrors.push('bound_backends not empty');
  }

  // 1) profile_schema
  {
    const errors = [...identityErrors];
    const schema = profile.backend_profile_schema;
    if (schema.schema_id !== 'dsc-backend-profile-schema-v1') {
      errors.push(`schema_id ${schema.schema_id}`);
    }
    if (schema.encoding !== 'application/json') {
      errors.push(`encoding ${schema.encoding}`);
    }
    if (schema.profile_id_policy !== 'opaque_profile_id_no_vendor_binding') {
      errors.push(`profile_id_policy ${schema.profile_id_policy}`);
    }
    if (schema.optional_fields.length !== 0 || schema.additional_fields) {
      errors.push('schema allows optional or additional fields');
    }
    if (schema.required_fields.length !== 10) {
      errors.push(`required_fields ${schema.required_fields.length}`);
    }
    const expectedFields = [
      'profile_id',
      'profile_version',
      'profile_kind',
      'capability_set_id',
      'capability_set_version',
      'spatial_frame_ref',
      'required_channels',
      'deterministic_capability_mapping',
      'adapter_configuration',
      'profile_validation',
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
        'backend_profile_schema present with opaque identity policy and ten required fields',
      evidence: {
        schema_id: schema.schema_id,
        required_fields: schema.required_fields.length,
        profile_id_policy: schema.profile_id_policy,
      },
      errors,
    });
  }

  // 2) capability_mapping
  {
    const errors = [...identityErrors];
    const mapping = profile.deterministic_capability_mapping;
    if (mapping.mapping_id !== 'dsc-backend-profile-deterministic-capability-mapping-v1') {
      errors.push(`mapping_id ${mapping.mapping_id}`);
    }
    if (mapping.purity !== 'deterministic_pure_function') {
      errors.push(`purity ${mapping.purity}`);
    }
    if (
      mapping.seed_dependence !== 'none' ||
      mapping.time_dependence !== 'none' ||
      mapping.randomness !== 'none'
    ) {
      errors.push('mapping not free of seed/time/randomness');
    }
    if (
      mapping.capability_set_id !== CAPABILITY_SET_ID ||
      mapping.capability_set_version !== CAPABILITY_SET_VERSION
    ) {
      errors.push('capability set drift');
    }
    if (mapping.ordering !== 'capability_registry_registered_capability_ids_order') {
      errors.push(`ordering ${mapping.ordering}`);
    }
    if (
      mapping.undeclared_capability_policy !== 'reject' ||
      mapping.unknown_capability_policy !== 'reject'
    ) {
      errors.push('capability rejection policy drift');
    }
    if (!mapping.maps_capabilities_in_this_phase) {
      errors.push('does not map capabilities');
    }
    if (mapping.evaluates_backends_in_this_phase) {
      errors.push('evaluates backends in this phase');
    }
    if (mapping.entries.length === 0) {
      errors.push('empty capability mapping');
    }
    for (const entry of mapping.entries) {
      if (
        entry.declared_state !== 'supported' ||
        entry.mapping_rule !== 'mandatory_capability_maps_to_supported' ||
        entry.capability_version !== CAPABILITY_SET_VERSION ||
        !entry.deterministic ||
        entry.evaluated_at !== 'profile_construction'
      ) {
        errors.push(`entry incomplete ${entry.capability_id}`);
      }
    }

    checks.push({
      check: 'capability_mapping',
      passed: errors.length === 0,
      detail:
        'deterministic capability mapping covers every mandatory capability as supported',
      evidence: {
        mapping_id: mapping.mapping_id,
        entries: mapping.entries.length,
        purity: mapping.purity,
      },
      errors,
    });
  }

  // 3) adapter_configuration
  {
    const errors = [...identityErrors];
    const config = profile.adapter_configuration;
    if (config.configuration_id !== 'dsc-backend-profile-adapter-configuration-v1') {
      errors.push(`configuration_id ${config.configuration_id}`);
    }
    if (config.packet_adapter_ref !== 'dsc-packet-adapter-v1') {
      errors.push(`packet_adapter_ref ${config.packet_adapter_ref}`);
    }
    if (config.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
      errors.push(`adapter_foundation_ref ${config.adapter_foundation_ref}`);
    }
    if (config.adapted_input_shape_ref !== 'dsc_adapted_conditioning_input_v1') {
      errors.push(`adapted_input_shape_ref ${config.adapted_input_shape_ref}`);
    }
    if (config.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
      errors.push(`spatial_frame_ref ${config.spatial_frame_ref}`);
    }
    if (
      JSON.stringify(config.channel_order) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('channel_order drift');
    }
    if (config.channel_transform !== 'identity_passthrough') {
      errors.push(`channel_transform ${config.channel_transform}`);
    }
    if (config.passthrough_policy !== 'structure_preserving_no_transform') {
      errors.push(`passthrough_policy ${config.passthrough_policy}`);
    }
    if (config.binding_policy !== 'opaque_conditioning_binding_handle') {
      errors.push(`binding_policy ${config.binding_policy}`);
    }
    if (
      config.requires_gpu ||
      config.performs_inference ||
      config.materializes_tensors ||
      config.materializes_frames ||
      !config.configures_adapter_in_this_phase ||
      config.implements_adapter_in_this_phase
    ) {
      errors.push('adapter configuration constraint violation');
    }

    checks.push({
      check: 'adapter_configuration',
      passed: errors.length === 0,
      detail:
        'adapter configuration reuses dsc-packet-adapter-v1 with identity passthrough and no GPU or inference',
      evidence: {
        configuration_id: config.configuration_id,
        packet_adapter_ref: config.packet_adapter_ref,
        channel_order: config.channel_order.length,
        requires_gpu: config.requires_gpu,
        performs_inference: config.performs_inference,
      },
      errors,
    });
  }

  // 4) profile_validation
  {
    const errors = [...identityErrors];
    const validation = profile.profile_validation;
    if (validation.validation_id !== 'dsc-backend-profile-validation-v1') {
      errors.push(`validation_id ${validation.validation_id}`);
    }
    if (
      validation.evaluation !== 'collect_all_failures' ||
      validation.accept_condition !== 'zero failed checks' ||
      JSON.stringify(validation.outcome_values) !==
        JSON.stringify(['valid', 'invalid'])
    ) {
      errors.push('validation policy drift');
    }
    if (
      !validation.requires_complete_capability_mapping ||
      !validation.requires_adapter_configuration ||
      validation.validates_backends_in_this_phase
    ) {
      errors.push('validation constraint violation');
    }
    if (validation.checks.length < 12) {
      errors.push(`checks ${validation.checks.length}`);
    }
    const expectedChecks = [
      'CHK_PROFILE_IDENTITY_OPAQUE',
      'CHK_CAPABILITY_SET_LOCKED',
      'CHK_CAPABILITY_MAPPING_COMPLETE',
      'CHK_CAPABILITY_MAPPING_SUPPORTED',
      'CHK_MAPPING_DETERMINISTIC',
      'CHK_ADAPTER_PACKET_ADAPTER',
      'CHK_ADAPTER_CHANNEL_ORDER',
      'CHK_ADAPTER_IDENTITY_PASSTHROUGH',
      'CHK_SPATIAL_FRAME_LOCKED',
      'CHK_NO_GPU_NO_INFERENCE',
      'CHK_NO_BACKEND_BOUND',
      'CHK_REUSES_IMPLEMENTATION_SPEC',
    ];
    const actualChecks = validation.checks.map((check) => check.check_id);
    for (const required of expectedChecks) {
      if (!actualChecks.includes(required)) {
        errors.push(`missing check ${required}`);
      }
    }
    for (const check of validation.checks) {
      if (
        !check.mandatory ||
        check.evaluation !== 'design_time_declaration_only' ||
        check.status_in_this_phase !== 'passed_by_construction' ||
        !/^DSC_BACKEND_PROFILE_FAIL_[A-Z0-9_]+$/.test(check.fail_code)
      ) {
        errors.push(`incomplete check ${check.check_id}`);
      }
    }

    checks.push({
      check: 'profile_validation',
      passed: errors.length === 0,
      detail:
        'profile validation declares twelve mandatory checks passed by construction with no backend validation',
      evidence: {
        validation_id: validation.validation_id,
        checks: validation.checks.length,
        validates_backends_in_this_phase: validation.validates_backends_in_this_phase,
      },
      errors,
    });
  }

  // 5) Evidence chain — profile refs resolve to exact expected upstream artifacts.
  {
    const errors: string[] = [];
    const links: Array<{ from: string; field: string; expected: string }> = [
      {
        from: 'backend_profile',
        field: 'implementation_spec_ref',
        expected: BACKEND_IMPLEMENTATION_SPEC_PATH,
      },
      {
        from: 'backend_profile',
        field: 'backend_design_certification_ref',
        expected: BACKEND_DESIGN_CERTIFICATION_PATH,
      },
      {
        from: 'backend_profile',
        field: 'execution_contract_ref',
        expected: BACKEND_EXECUTION_CONTRACT_PATH,
      },
      {
        from: 'backend_profile',
        field: 'runtime_router_ref',
        expected: BACKEND_RUNTIME_ROUTER_PATH,
      },
      {
        from: 'backend_profile',
        field: 'adapter_registration_ref',
        expected: BACKEND_ADAPTER_REGISTRATION_PATH,
      },
      {
        from: 'backend_profile',
        field: 'compatibility_engine_ref',
        expected: BACKEND_COMPATIBILITY_ENGINE_PATH,
      },
      {
        from: 'backend_profile',
        field: 'capability_registry_ref',
        expected: BACKEND_CAPABILITY_REGISTRY_PATH,
      },
      {
        from: 'backend_profile',
        field: 'adapter_foundation_ref',
        expected: BACKEND_ADAPTER_FOUNDATION_PATH,
      },
      {
        from: 'backend_profile',
        field: 'runtime_interface_ref',
        expected: RUNTIME_INTERFACE_PATH,
      },
      {
        from: 'backend_profile',
        field: 'runtime_package_ref',
        expected: RUNTIME_PACKAGE_PATH,
      },
      {
        from: 'adapter_configuration',
        field: 'adapter_foundation_ref',
        expected: BACKEND_ADAPTER_FOUNDATION_PATH,
      },
    ];

    for (const link of links) {
      const source =
        link.from === 'adapter_configuration'
          ? (profile.adapter_configuration as unknown as AnyRecord)
          : (profile as unknown as AnyRecord);
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

    let backendDesignCertified = false;
    if (!exists(root, BACKEND_DESIGN_CERTIFICATION_PATH)) {
      errors.push('backend design certification missing');
    } else {
      const designCert = readJson<AnyRecord>(root, BACKEND_DESIGN_CERTIFICATION_PATH);
      backendDesignCertified = designCert.certified === true;
      if (!backendDesignCertified) {
        errors.push('backend design stack not certified');
      }
    }

    checks.push({
      check: 'evidence_chain',
      passed: errors.length === 0,
      detail:
        'backend profile references implementation_spec, backend design certification, and the full adapter stack by exact path',
      evidence: {
        links_verified: evidence_chain.length,
        backend_design_certified: backendDesignCertified,
        implementation_spec_ref: BACKEND_IMPLEMENTATION_SPEC_PATH,
      },
      errors,
    });
  }

  // 6) Reproducibility — derived surfaces still match upstream exactly. Read-only:
  //    the profile builder is not invoked and nothing is recalculated.
  {
    const errors: string[] = [];

    const capabilityRegistry = readJson<DirectSpatialConditioningBackendCapabilityRegistry>(
      root,
      BACKEND_CAPABILITY_REGISTRY_PATH
    );
    const registeredCapabilityIds =
      capabilityRegistry.capability_schema.registered_capability_ids;
    const mappedIds = profile.deterministic_capability_mapping.entries.map(
      (entry) => entry.capability_id
    );
    if (JSON.stringify(mappedIds) !== JSON.stringify(registeredCapabilityIds)) {
      errors.push('capability mapping / registry id drift');
    }

    if (
      JSON.stringify(profile.required_channels) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('profile channel drift');
    }
    if (
      JSON.stringify(profile.adapter_configuration.channel_order) !==
      JSON.stringify([...CONDITIONING_CHANNEL_IDS])
    ) {
      errors.push('adapter configuration channel drift');
    }
    if (
      JSON.stringify(profile.sources_supported) !==
      JSON.stringify([...SOURCE_IDS])
    ) {
      errors.push('sources drift');
    }
    if (profile.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
      errors.push('spatial frame drift');
    }
    if (profile.adapter_configuration.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
      errors.push('adapter spatial frame drift');
    }
    if (
      profile.capability_set_id !== CAPABILITY_SET_ID ||
      profile.capability_set_version !== CAPABILITY_SET_VERSION
    ) {
      errors.push('profile capability set drift');
    }
    if (
      profile.deterministic_capability_mapping.capability_set_id !== CAPABILITY_SET_ID ||
      profile.deterministic_capability_mapping.capability_set_version !==
        CAPABILITY_SET_VERSION
    ) {
      errors.push('mapping capability set drift');
    }

    // Byte stability: hashing the verified profile twice must agree.
    const first = sha256(root, BACKEND_PROFILE_PATH);
    const second = sha256(root, BACKEND_PROFILE_PATH);
    if (first === null || first !== second) {
      errors.push(`unstable artifact ${BACKEND_PROFILE_PATH}`);
    }

    checks.push({
      check: 'reproducibility',
      passed: errors.length === 0,
      detail:
        'capability mapping, channels, sources, spatial frame, and capability set still match upstream exactly; profile artifact is byte-stable',
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
  const artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }> = [];
  {
    const errors: string[] = [];
    for (const artifact of BACKEND_PROFILE_PROTECTED_ARTIFACTS) {
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
        'verified backend profile, backend design certification, backend design layers, and certified DSC V1 stack are unchanged',
      evidence: {
        protected_artifacts: BACKEND_PROFILE_PROTECTED_ARTIFACTS.length,
        digests_recorded: artifact_digests.length,
      },
      errors,
    });
  }

  const errorCount = checks.reduce((sum, entry) => sum + entry.errors.length, 0);
  const certified = checks.every((entry) => entry.passed) && errorCount === 0;

  let backendDesignCertified = false;
  if (exists(root, BACKEND_DESIGN_CERTIFICATION_PATH)) {
    backendDesignCertified =
      readJson<AnyRecord>(root, BACKEND_DESIGN_CERTIFICATION_PATH).certified === true;
  }

  const certification: DirectSpatialConditioningBackendProfileCertification = {
    certification_id: 'direct-spatial-conditioning-backend-profile-certification-v1',
    phase: DSC_BACKEND_PROFILE_CERTIFICATION_PHASE,
    system_id: DSC_BACKEND_PROFILE_CERTIFICATION_SYSTEM_ID,
    mode: 'read_only_certification',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_CERTIFICATION_V1',
    certified,
    certified_system: 'DIRECT_SPATIAL_CONDITIONING_BACKEND_PROFILE_V1',
    surfaces_certified: [...BACKEND_PROFILE_SURFACES],
    profile_id: BACKEND_PROFILE_ID,
    profile_version: BACKEND_PROFILE_VERSION,
    checks,
    evidence_chain,
    artifact_digests,
    upstream_certified_system: {
      backend_design_certification_ref: BACKEND_DESIGN_CERTIFICATION_PATH,
      backend_design_certified: backendDesignCertified,
      implementation_spec_ref: BACKEND_IMPLEMENTATION_SPEC_PATH,
      capability_registry_ref: BACKEND_CAPABILITY_REGISTRY_PATH,
      runtime_package_ref: RUNTIME_PACKAGE_PATH,
      sources_supported: SOURCE_IDS.length,
    },
    backend_neutrality: {
      backend_agnostic: true,
      backends_bound: 0,
      backends_implemented: 0,
      capability_set_id: CAPABILITY_SET_ID,
      capability_set_version: CAPABILITY_SET_VERSION,
    },
    integrity_method: 'sha256_read_only_recheck',
    error_count: errorCount,
    created_at,
  };

  writeJson(root, BACKEND_PROFILE_CERTIFICATION_PATH, certification);
  return { certification };
}
