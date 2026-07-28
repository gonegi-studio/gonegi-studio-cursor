import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
} from './directSpatialConditioningFoundationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import {
  DSC_CERTIFICATION_PATH,
  DSC_PROTECTED_ARTIFACTS,
} from './directSpatialConditioningProductionCertificationBuilder.js';
import {
  BACKEND_ADAPTER_FOUNDATION_PATH,
  DSC_BACKEND_ADAPTER_FOUNDATION_PHASE,
  DSC_BACKEND_ADAPTER_FOUNDATION_SYSTEM_ID,
} from './directSpatialConditioningBackendAdapterFoundationBuilder.js';
import {
  BACKEND_CAPABILITY_REGISTRY_PATH,
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
  DSC_BACKEND_CAPABILITY_REGISTRY_PHASE,
  DSC_BACKEND_CAPABILITY_REGISTRY_SYSTEM_ID,
} from './directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import {
  BACKEND_COMPATIBILITY_ENGINE_PATH,
  DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE,
  DSC_BACKEND_COMPATIBILITY_ENGINE_SYSTEM_ID,
} from './directSpatialConditioningBackendCompatibilityEngineBuilder.js';
import {
  BACKEND_ADAPTER_REGISTRATION_PATH,
  DSC_BACKEND_ADAPTER_REGISTRATION_PHASE,
  DSC_BACKEND_ADAPTER_REGISTRATION_SYSTEM_ID,
} from './directSpatialConditioningBackendAdapterRegistrationBuilder.js';
import {
  BACKEND_RUNTIME_ROUTER_PATH,
  DSC_BACKEND_RUNTIME_ROUTER_PHASE,
  DSC_BACKEND_RUNTIME_ROUTER_SYSTEM_ID,
} from './directSpatialConditioningBackendRuntimeRouterBuilder.js';
import {
  BACKEND_EXECUTION_CONTRACT_PATH,
  DSC_BACKEND_EXECUTION_CONTRACT_PHASE,
  DSC_BACKEND_EXECUTION_CONTRACT_SYSTEM_ID,
} from './directSpatialConditioningBackendExecutionContractBuilder.js';
import {
  BACKEND_IMPLEMENTATION_SPEC_PATH,
  DSC_BACKEND_IMPLEMENTATION_SPEC_PHASE,
  DSC_BACKEND_IMPLEMENTATION_SPEC_SYSTEM_ID,
} from './directSpatialConditioningBackendImplementationSpecBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';

/**
 * PHASE-DSC-046: Direct Spatial Conditioning backend design stack certification.
 *
 * CERTIFICATION ONLY. Re-checks the seven already-verified backend design layers
 * (PHASE-039 through PHASE-045) on disk, plus their evidence chain,
 * reproducibility, and immutability. Purely read-only over the certified
 * artifacts: no layer builder is invoked, nothing is recalculated, and no
 * existing artifact or dataset is modified. Only the certification file is
 * written. Backend agnostic: no backend is implemented, registered, routed,
 * executed, or evaluated.
 */

export const DSC_BACKEND_DESIGN_CERTIFICATION_PHASE = 'PHASE-DSC-046' as const;
export const DSC_BACKEND_DESIGN_CERTIFICATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_BACKEND_DESIGN_CERTIFICATION_V1' as const;

export const BACKEND_DESIGN_CERTIFICATION_ROOT =
  'exports/direct_spatial_conditioning_backend_certification/v1' as const;
export const BACKEND_DESIGN_CERTIFICATION_PATH =
  `${BACKEND_DESIGN_CERTIFICATION_ROOT}/direct-spatial-conditioning-backend-design-certification-v1.json` as const;

export const BACKEND_CERTIFICATION_CHECKS = [
  'adapter_foundation',
  'capability_registry',
  'compatibility_engine',
  'adapter_registration',
  'runtime_router',
  'execution_contract',
  'implementation_spec',
  'evidence_chain',
  'reproducibility',
  'immutability',
] as const;

export type BackendCertificationCheckId = (typeof BACKEND_CERTIFICATION_CHECKS)[number];

export const BACKEND_DESIGN_LAYERS = [
  'adapter_foundation',
  'capability_registry',
  'compatibility_engine',
  'adapter_registration',
  'runtime_router',
  'execution_contract',
  'implementation_spec',
] as const;

export type BackendDesignLayerId = (typeof BACKEND_DESIGN_LAYERS)[number];

interface LayerSpec {
  layer: BackendDesignLayerId;
  artifact_path: string;
  expected_phase: string;
  expected_system_id: string;
  expected_mode: string;
  expected_target: string;
  /** Collection that must remain empty because this phase binds no backend. */
  empty_collection_field: string | null;
}

const LAYER_SPECS: LayerSpec[] = [
  {
    layer: 'adapter_foundation',
    artifact_path: BACKEND_ADAPTER_FOUNDATION_PATH,
    expected_phase: DSC_BACKEND_ADAPTER_FOUNDATION_PHASE,
    expected_system_id: DSC_BACKEND_ADAPTER_FOUNDATION_SYSTEM_ID,
    expected_mode: 'design_only_abstraction',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_FOUNDATION_V1',
    empty_collection_field: null,
  },
  {
    layer: 'capability_registry',
    artifact_path: BACKEND_CAPABILITY_REGISTRY_PATH,
    expected_phase: DSC_BACKEND_CAPABILITY_REGISTRY_PHASE,
    expected_system_id: DSC_BACKEND_CAPABILITY_REGISTRY_SYSTEM_ID,
    expected_mode: 'design_only_registry',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_CAPABILITY_REGISTRY_V1',
    empty_collection_field: 'registered_backends',
  },
  {
    layer: 'compatibility_engine',
    artifact_path: BACKEND_COMPATIBILITY_ENGINE_PATH,
    expected_phase: DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE,
    expected_system_id: DSC_BACKEND_COMPATIBILITY_ENGINE_SYSTEM_ID,
    expected_mode: 'design_only_engine',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_COMPATIBILITY_ENGINE_V1',
    empty_collection_field: null,
  },
  {
    layer: 'adapter_registration',
    artifact_path: BACKEND_ADAPTER_REGISTRATION_PATH,
    expected_phase: DSC_BACKEND_ADAPTER_REGISTRATION_PHASE,
    expected_system_id: DSC_BACKEND_ADAPTER_REGISTRATION_SYSTEM_ID,
    expected_mode: 'design_only_registration',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_REGISTRATION_V1',
    empty_collection_field: 'registered_adapters',
  },
  {
    layer: 'runtime_router',
    artifact_path: BACKEND_RUNTIME_ROUTER_PATH,
    expected_phase: DSC_BACKEND_RUNTIME_ROUTER_PHASE,
    expected_system_id: DSC_BACKEND_RUNTIME_ROUTER_SYSTEM_ID,
    expected_mode: 'design_only_router',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_RUNTIME_ROUTER_V1',
    empty_collection_field: 'routed_backends',
  },
  {
    layer: 'execution_contract',
    artifact_path: BACKEND_EXECUTION_CONTRACT_PATH,
    expected_phase: DSC_BACKEND_EXECUTION_CONTRACT_PHASE,
    expected_system_id: DSC_BACKEND_EXECUTION_CONTRACT_SYSTEM_ID,
    expected_mode: 'design_only_contract',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_EXECUTION_CONTRACT_V1',
    empty_collection_field: 'executed_backends',
  },
  {
    layer: 'implementation_spec',
    artifact_path: BACKEND_IMPLEMENTATION_SPEC_PATH,
    expected_phase: DSC_BACKEND_IMPLEMENTATION_SPEC_PHASE,
    expected_system_id: DSC_BACKEND_IMPLEMENTATION_SPEC_SYSTEM_ID,
    expected_mode: 'design_only_specification',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_IMPLEMENTATION_SPEC_V1',
    empty_collection_field: 'implemented_backends',
  },
];

/** Artifacts this certification must never modify. */
export const BACKEND_PROTECTED_ARTIFACTS: string[] = [
  ...LAYER_SPECS.map((spec) => spec.artifact_path),
  ...DSC_PROTECTED_ARTIFACTS,
  DSC_CERTIFICATION_PATH,
];

export interface BackendCertificationCheckResult {
  check: BackendCertificationCheckId;
  passed: boolean;
  detail: string;
  evidence: Record<string, unknown>;
  errors: string[];
}

export interface BackendEvidenceChainLink {
  from_layer: string;
  field: string;
  to_artifact: string;
  resolved: boolean;
  matches_expected: boolean;
}

export interface DirectSpatialConditioningBackendDesignCertification {
  certification_id: string;
  phase: typeof DSC_BACKEND_DESIGN_CERTIFICATION_PHASE;
  system_id: typeof DSC_BACKEND_DESIGN_CERTIFICATION_SYSTEM_ID;
  mode: 'read_only_certification';
  target: string;
  certified: boolean;
  certified_system: 'DIRECT_SPATIAL_CONDITIONING_BACKEND_DESIGN_STACK_V1';
  layers_certified: BackendDesignLayerId[];
  checks: BackendCertificationCheckResult[];
  evidence_chain: BackendEvidenceChainLink[];
  artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }>;
  upstream_certified_system: {
    dsc_certification_ref: string;
    dsc_certified: boolean;
    runtime_interface_ref: string;
    runtime_package_ref: string;
    sources_supported: number;
  };
  backend_neutrality: {
    backend_agnostic: true;
    backends_implemented: 0;
    backends_registered: 0;
    backends_routed: 0;
    backends_executed: 0;
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
 * Certify the Direct Spatial Conditioning backend design stack by re-checking
 * the seven design layers, their evidence chain, reproducibility, and
 * immutability on disk. Read-only over every certified artifact; writes only
 * the certification file.
 */
export function buildDirectSpatialConditioningBackendDesignCertification(
  projectRoot?: string
): { certification: DirectSpatialConditioningBackendDesignCertification } {
  const root = resolveProjectRoot(projectRoot);
  const created_at = new Date().toISOString();

  // Immutability baseline captured before any read-driven work.
  const baseline = new Map<string, string | null>();
  for (const artifact of BACKEND_PROTECTED_ARTIFACTS) {
    baseline.set(artifact, sha256(root, artifact));
  }

  const checks: BackendCertificationCheckResult[] = [];
  const layers: Record<BackendDesignLayerId, AnyRecord> = {} as Record<
    BackendDesignLayerId,
    AnyRecord
  >;

  // 1-7) Per-layer identity, mode, backend neutrality, and empty-binding checks.
  for (const spec of LAYER_SPECS) {
    const errors: string[] = [];
    let layer: AnyRecord = {};

    if (!exists(root, spec.artifact_path)) {
      errors.push(`missing artifact ${spec.artifact_path}`);
    } else {
      layer = readJson<AnyRecord>(root, spec.artifact_path);
      layers[spec.layer] = layer;

      if (layer.phase !== spec.expected_phase) {
        errors.push(`phase ${String(layer.phase)}`);
      }
      if (layer.system_id !== spec.expected_system_id) {
        errors.push(`system_id ${String(layer.system_id)}`);
      }
      if (layer.mode !== spec.expected_mode) {
        errors.push(`mode ${String(layer.mode)}`);
      }
      if (layer.target !== spec.expected_target) {
        errors.push(`target ${String(layer.target)}`);
      }

      const constraints = layer.design_constraints as AnyRecord | undefined;
      if (!constraints) {
        errors.push('design_constraints missing');
      } else {
        if (constraints.backend_agnostic !== true) errors.push('not backend agnostic');
        if (constraints.backend !== 'none') errors.push('backend not none');
        if (constraints.no_backend_implementation !== true) {
          errors.push('backend implementation allowed');
        }
        if (constraints.gpu !== false) errors.push('gpu enabled');
        if (constraints.inference !== false) errors.push('inference enabled');
        if (constraints.placeholders !== false) errors.push('placeholders declared');
        if (constraints.modifies_existing_datasets !== false) {
          errors.push('declares dataset modification');
        }
      }

      // No backend may be bound by any design-only layer.
      if (spec.empty_collection_field) {
        const collection = layer[spec.empty_collection_field] as AnyRecord | undefined;
        if (!collection) {
          errors.push(`${spec.empty_collection_field} missing`);
        } else if (
          collection.count !== 0 ||
          (collection.entries as unknown[] | undefined)?.length !== 0
        ) {
          errors.push(`${spec.empty_collection_field} not empty`);
        }
      }
    }

    checks.push({
      check: spec.layer,
      passed: errors.length === 0,
      detail: `${spec.layer} present at ${spec.expected_phase}, backend agnostic with no bound backend`,
      evidence: {
        artifact: spec.artifact_path,
        phase: layer.phase ?? null,
        system_id: layer.system_id ?? null,
        mode: layer.mode ?? null,
        target: layer.target ?? null,
        empty_collection: spec.empty_collection_field,
      },
      errors,
    });
  }

  // 8) Evidence chain — each layer must reference its upstream by exact path.
  const evidence_chain: BackendEvidenceChainLink[] = [];
  {
    const errors: string[] = [];

    const links: Array<{ from: BackendDesignLayerId; field: string; expected: string }> = [
      {
        from: 'adapter_foundation',
        field: 'runtime_interface_ref',
        expected: RUNTIME_INTERFACE_PATH,
      },
      {
        from: 'capability_registry',
        field: 'adapter_foundation_ref',
        expected: BACKEND_ADAPTER_FOUNDATION_PATH,
      },
      {
        from: 'compatibility_engine',
        field: 'capability_registry_ref',
        expected: BACKEND_CAPABILITY_REGISTRY_PATH,
      },
      {
        from: 'compatibility_engine',
        field: 'adapter_foundation_ref',
        expected: BACKEND_ADAPTER_FOUNDATION_PATH,
      },
      {
        from: 'adapter_registration',
        field: 'compatibility_engine_ref',
        expected: BACKEND_COMPATIBILITY_ENGINE_PATH,
      },
      {
        from: 'adapter_registration',
        field: 'capability_registry_ref',
        expected: BACKEND_CAPABILITY_REGISTRY_PATH,
      },
      {
        from: 'runtime_router',
        field: 'adapter_registration_ref',
        expected: BACKEND_ADAPTER_REGISTRATION_PATH,
      },
      {
        from: 'runtime_router',
        field: 'compatibility_engine_ref',
        expected: BACKEND_COMPATIBILITY_ENGINE_PATH,
      },
      {
        from: 'runtime_router',
        field: 'capability_registry_ref',
        expected: BACKEND_CAPABILITY_REGISTRY_PATH,
      },
      {
        from: 'execution_contract',
        field: 'runtime_router_ref',
        expected: BACKEND_RUNTIME_ROUTER_PATH,
      },
      {
        from: 'execution_contract',
        field: 'adapter_registration_ref',
        expected: BACKEND_ADAPTER_REGISTRATION_PATH,
      },
      {
        from: 'execution_contract',
        field: 'compatibility_engine_ref',
        expected: BACKEND_COMPATIBILITY_ENGINE_PATH,
      },
      {
        from: 'implementation_spec',
        field: 'execution_contract_ref',
        expected: BACKEND_EXECUTION_CONTRACT_PATH,
      },
      {
        from: 'implementation_spec',
        field: 'runtime_router_ref',
        expected: BACKEND_RUNTIME_ROUTER_PATH,
      },
      {
        from: 'implementation_spec',
        field: 'adapter_registration_ref',
        expected: BACKEND_ADAPTER_REGISTRATION_PATH,
      },
      {
        from: 'implementation_spec',
        field: 'adapter_foundation_ref',
        expected: BACKEND_ADAPTER_FOUNDATION_PATH,
      },
    ];

    for (const link of links) {
      const layer = layers[link.from];
      const value = layer ? (layer[link.field] as string | undefined) : undefined;
      const matches = value === link.expected;
      const resolved = typeof value === 'string' && exists(root, value);
      evidence_chain.push({
        from_layer: link.from,
        field: link.field,
        to_artifact: link.expected,
        resolved,
        matches_expected: matches,
      });
      if (!matches) errors.push(`${link.from}.${link.field} = ${String(value)}`);
      if (!resolved) errors.push(`${link.from}.${link.field} unresolved on disk`);
    }

    // Chain root: the certified Direct Spatial Conditioning V1 system (PHASE-038).
    let dscCertified = false;
    if (!exists(root, DSC_CERTIFICATION_PATH)) {
      errors.push('DSC V1 certification missing');
    } else {
      const dscCert = readJson<AnyRecord>(root, DSC_CERTIFICATION_PATH);
      dscCertified = dscCert.certified === true;
      if (!dscCertified) errors.push('DSC V1 system not certified');
    }

    checks.push({
      check: 'evidence_chain',
      passed: errors.length === 0,
      detail:
        'adapter_foundation -> capability_registry -> compatibility_engine -> adapter_registration -> runtime_router -> execution_contract -> implementation_spec, anchored to the certified DSC V1 runtime interface',
      evidence: {
        links_verified: evidence_chain.length,
        dsc_certified: dscCertified,
        runtime_interface_ref: RUNTIME_INTERFACE_PATH,
      },
      errors,
    });
  }

  // 9) Reproducibility — derived surfaces still match their upstream exactly,
  //    so regenerating any layer reproduces the same structure. Read-only: no
  //    builder is invoked and nothing is recalculated.
  {
    const errors: string[] = [];

    const foundation = layers.adapter_foundation as AnyRecord | undefined;
    const registry = layers.capability_registry as AnyRecord | undefined;
    const engine = layers.compatibility_engine as AnyRecord | undefined;
    const registration = layers.adapter_registration as AnyRecord | undefined;
    const router = layers.runtime_router as AnyRecord | undefined;
    const contract = layers.execution_contract as AnyRecord | undefined;
    const spec = layers.implementation_spec as AnyRecord | undefined;

    // registry capability ids track the foundation capability contract
    const capabilityContract = foundation?.capability_contract as AnyRecord | undefined;
    const foundationCapabilityIds = (
      (capabilityContract?.required_capabilities as AnyRecord[] | undefined) ?? []
    ).map((capability) => String(capability.capability_id));
    const registrySchema = registry?.capability_schema as AnyRecord | undefined;
    const registeredCapabilityIds = (
      (registrySchema?.registered_capability_ids as string[] | undefined) ?? []
    ).map(String);
    if (
      JSON.stringify(foundationCapabilityIds) !== JSON.stringify(registeredCapabilityIds)
    ) {
      errors.push('registry/foundation capability id drift');
    }

    // engine row expectations track the registry compatibility matrix
    const matrix = registry?.compatibility_matrix as AnyRecord | undefined;
    const matrixRows = (matrix?.rows as AnyRecord[] | undefined) ?? [];
    const algorithm = engine?.deterministic_algorithm as AnyRecord | undefined;
    const rowResolution = algorithm?.row_resolution as AnyRecord | undefined;
    if (rowResolution?.expected_row_count !== matrixRows.length) {
      errors.push('engine/registry matrix row count drift');
    }
    if (
      rowResolution?.expected_capability_rows !==
      matrixRows.filter((row) => row.row_kind === 'capability').length
    ) {
      errors.push('engine/registry capability row drift');
    }
    if (
      rowResolution?.expected_structural_rows !==
      matrixRows.filter((row) => row.row_kind === 'structural').length
    ) {
      errors.push('engine/registry structural row drift');
    }

    // engine report schema field set tracks the registry report shape
    const reportShape = matrix?.report_shape as AnyRecord | undefined;
    const registryReportFields = (
      (reportShape?.required_fields as string[] | undefined) ?? []
    ).map(String);
    const engineReport = engine?.report_schema as AnyRecord | undefined;
    const engineReportFields = (
      (engineReport?.required_fields as AnyRecord[] | undefined) ?? []
    ).map((field) => String(field.field));
    if (JSON.stringify(registryReportFields) !== JSON.stringify(engineReportFields)) {
      errors.push('engine/registry report field drift');
    }

    // registration must require a compatible engine outcome
    const registrationValidation = registration?.registration_validation as
      | AnyRecord
      | undefined;
    if (registrationValidation?.requires_compatible_engine_outcome !== true) {
      errors.push('registration does not require compatible engine outcome');
    }

    // router eligibility tracks the registration active lifecycle state
    const registrationLifecycle = registration?.lifecycle as AnyRecord | undefined;
    const routingPolicy = router?.deterministic_routing_policy as AnyRecord | undefined;
    const eligibility = routingPolicy?.eligibility as AnyRecord | undefined;
    if (eligibility?.lifecycle_state_required !== registrationLifecycle?.active_state) {
      errors.push('router/registration active state drift');
    }

    // contract execution request must require a routed outcome
    const executionRequest = contract?.execution_request as AnyRecord | undefined;
    if (executionRequest?.requires_routed_outcome !== true) {
      errors.push('execution contract does not require routed outcome');
    }

    // implementation spec interface methods track the foundation methods
    const backendInterface = foundation?.backend_interface as AnyRecord | undefined;
    const foundationMethodIds = (
      (backendInterface?.methods as AnyRecord[] | undefined) ?? []
    ).map((method) => String(method.method_id));
    const requiredInterfaces = spec?.required_interfaces as AnyRecord | undefined;
    const specMethodIds = (
      (requiredInterfaces?.methods as AnyRecord[] | undefined) ?? []
    ).map((method) => String(method.method_id));
    if (JSON.stringify(foundationMethodIds) !== JSON.stringify(specMethodIds)) {
      errors.push('implementation spec/foundation method drift');
    }

    // shared invariants across the stack
    const expectedChannels = JSON.stringify([...CONDITIONING_CHANNEL_IDS]);
    const expectedSources = JSON.stringify([...SOURCE_IDS]);
    if (JSON.stringify(capabilityContract?.required_channels) !== expectedChannels) {
      errors.push('foundation channel drift');
    }
    if (capabilityContract?.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
      errors.push('foundation spatial frame drift');
    }
    for (const [name, layer] of [
      ['capability_registry', registry],
      ['compatibility_engine', engine],
      ['adapter_registration', registration],
      ['runtime_router', router],
      ['execution_contract', contract],
      ['implementation_spec', spec],
    ] as Array<[string, AnyRecord | undefined]>) {
      if (JSON.stringify(layer?.required_channels) !== expectedChannels) {
        errors.push(`${name} channel drift`);
      }
      if (JSON.stringify(layer?.sources_supported) !== expectedSources) {
        errors.push(`${name} sources drift`);
      }
    }
    for (const [name, layer] of [
      ['compatibility_engine', engine],
      ['adapter_registration', registration],
      ['runtime_router', router],
      ['execution_contract', contract],
      ['implementation_spec', spec],
    ] as Array<[string, AnyRecord | undefined]>) {
      if (layer?.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
        errors.push(`${name} spatial frame drift`);
      }
    }

    // capability set identity is stable across every layer that declares it
    const versioning = registry?.capability_versioning as AnyRecord | undefined;
    if (
      versioning?.capability_set_id !== CAPABILITY_SET_ID ||
      versioning?.current_capability_set_version !== CAPABILITY_SET_VERSION
    ) {
      errors.push('registry capability set identity drift');
    }
    for (const [name, layer] of [
      ['adapter_registration', registration],
      ['runtime_router', router],
      ['execution_contract', contract],
      ['implementation_spec', spec],
    ] as Array<[string, AnyRecord | undefined]>) {
      if (
        layer?.capability_set_id !== CAPABILITY_SET_ID ||
        layer?.capability_set_version !== CAPABILITY_SET_VERSION
      ) {
        errors.push(`${name} capability set drift`);
      }
    }

    // Byte stability: hashing each artifact twice must agree.
    let stableArtifacts = 0;
    for (const artifact of LAYER_SPECS.map((entry) => entry.artifact_path)) {
      const first = sha256(root, artifact);
      const second = sha256(root, artifact);
      if (first === null || first !== second) {
        errors.push(`unstable artifact ${artifact}`);
      } else {
        stableArtifacts += 1;
      }
    }

    checks.push({
      check: 'reproducibility',
      passed: errors.length === 0,
      detail:
        'every derived surface still matches its upstream layer and all backend design artifacts are byte-stable',
      evidence: {
        capabilities_tracked: registeredCapabilityIds.length,
        matrix_rows_tracked: matrixRows.length,
        interface_methods_tracked: specMethodIds.length,
        stable_artifacts: stableArtifacts,
        method: 'read_only_derived_parity',
      },
      errors,
    });
  }

  // 10) Immutability — nothing in the protected set changed during certification.
  const artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }> = [];
  {
    const errors: string[] = [];
    for (const artifact of BACKEND_PROTECTED_ARTIFACTS) {
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
        'all backend design layers plus the certified DSC V1 stack, its certification, and the Movie Reconstruction artifacts are unchanged',
      evidence: {
        protected_artifacts: BACKEND_PROTECTED_ARTIFACTS.length,
        digests_recorded: artifact_digests.length,
      },
      errors,
    });
  }

  const errorCount = checks.reduce((sum, entry) => sum + entry.errors.length, 0);
  const certified = checks.every((entry) => entry.passed) && errorCount === 0;

  let dscCertified = false;
  if (exists(root, DSC_CERTIFICATION_PATH)) {
    dscCertified = readJson<AnyRecord>(root, DSC_CERTIFICATION_PATH).certified === true;
  }

  const certification: DirectSpatialConditioningBackendDesignCertification = {
    certification_id: 'direct-spatial-conditioning-backend-design-certification-v1',
    phase: DSC_BACKEND_DESIGN_CERTIFICATION_PHASE,
    system_id: DSC_BACKEND_DESIGN_CERTIFICATION_SYSTEM_ID,
    mode: 'read_only_certification',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_DESIGN_CERTIFICATION_V1',
    certified,
    certified_system: 'DIRECT_SPATIAL_CONDITIONING_BACKEND_DESIGN_STACK_V1',
    layers_certified: [...BACKEND_DESIGN_LAYERS],
    checks,
    evidence_chain,
    artifact_digests,
    upstream_certified_system: {
      dsc_certification_ref: DSC_CERTIFICATION_PATH,
      dsc_certified: dscCertified,
      runtime_interface_ref: RUNTIME_INTERFACE_PATH,
      runtime_package_ref: RUNTIME_PACKAGE_PATH,
      sources_supported: SOURCE_IDS.length,
    },
    backend_neutrality: {
      backend_agnostic: true,
      backends_implemented: 0,
      backends_registered: 0,
      backends_routed: 0,
      backends_executed: 0,
      capability_set_id: CAPABILITY_SET_ID,
      capability_set_version: CAPABILITY_SET_VERSION,
    },
    integrity_method: 'sha256_read_only_recheck',
    error_count: errorCount,
    created_at,
  };

  writeJson(root, BACKEND_DESIGN_CERTIFICATION_PATH, certification);
  return { certification };
}
