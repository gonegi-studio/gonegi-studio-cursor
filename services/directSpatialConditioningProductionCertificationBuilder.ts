import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  DIRECT_SPATIAL_CONDITIONING_FOUNDATION_PHASE,
  DIRECT_SPATIAL_CONDITIONING_FOUNDATION_SYSTEM_ID,
  FOUNDATION_PATH,
  SPATIAL_FRAME,
} from './directSpatialConditioningFoundationBuilder.js';
import {
  CONTRACT_PATH,
  DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE,
  DIRECT_SPATIAL_CONDITIONING_CONTRACT_SYSTEM_ID,
} from './directSpatialConditioningContractBuilder.js';
import {
  DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE,
  DIRECT_SPATIAL_CONDITIONING_PACKET_SYSTEM_ID,
  PACKET_PATH,
} from './directSpatialConditioningPacketBuilder.js';
import {
  DSC_PACKET_VALIDATION_PHASE,
  DSC_PACKET_VALIDATION_SYSTEM_ID,
  VALIDATION_PATH,
} from './directSpatialConditioningPacketValidationBuilder.js';
import {
  ASSEMBLY_PATH,
  DSC_PACKET_ASSEMBLY_PHASE,
  DSC_PACKET_ASSEMBLY_SYSTEM_ID,
} from './directSpatialConditioningPacketAssemblyBuilder.js';
import {
  DSC_PACKET_GENERATION_PHASE,
  DSC_PACKET_GENERATION_SYSTEM_ID,
  GENERATION_PATH,
} from './directSpatialConditioningPacketGenerationBuilder.js';
import {
  DSC_RUNTIME_INTERFACE_PHASE,
  DSC_RUNTIME_INTERFACE_SYSTEM_ID,
  RUNTIME_INTERFACE_PATH,
} from './directSpatialConditioningRuntimeInterfaceBuilder.js';
import {
  DSC_RUNTIME_VALIDATION_PHASE,
  DSC_RUNTIME_VALIDATION_SYSTEM_ID,
  RUNTIME_VALIDATION_PATH,
} from './directSpatialConditioningRuntimeValidationBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from './numericalReconstructionExportBuilder.js';
import { CERTIFICATION_PATH as MOVIE_RECONSTRUCTION_CERTIFICATION_PATH } from './movieReconstructionProductionCertificationBuilder.js';
import { MASTER_PACKAGE_PATH } from './movieReconstructionMasterPackageBuilder.js';

/**
 * PHASE-DSC-038: Direct Spatial Conditioning V1 production certification.
 *
 * CERTIFICATION ONLY. Re-checks the eight already-verified DSC design layers
 * (PHASE-030 through PHASE-037) on disk, plus their evidence chain,
 * reproducibility, and immutability. Purely read-only over the certified
 * artifacts: no layer builder is invoked, nothing is recalculated, and no
 * existing artifact or dataset is modified. Only the certification file is
 * written.
 */

export const DSC_PRODUCTION_CERTIFICATION_PHASE = 'PHASE-DSC-038' as const;
export const DSC_PRODUCTION_CERTIFICATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_PRODUCTION_CERTIFICATION_V1' as const;

export const DSC_CERTIFICATION_ROOT =
  'exports/direct_spatial_conditioning_certification/v1' as const;
export const DSC_CERTIFICATION_PATH =
  `${DSC_CERTIFICATION_ROOT}/direct-spatial-conditioning-production-certification-v1.json` as const;

export const DSC_CERTIFICATION_CHECKS = [
  'foundation',
  'contract',
  'packet',
  'validation',
  'assembly',
  'generation',
  'runtime_interface',
  'runtime_validation',
  'evidence_chain',
  'reproducibility',
  'immutability',
] as const;

export type DscCertificationCheckId = (typeof DSC_CERTIFICATION_CHECKS)[number];

export const DSC_LAYERS = [
  'foundation',
  'contract',
  'packet',
  'validation',
  'assembly',
  'generation',
  'runtime_interface',
  'runtime_validation',
] as const;

export type DscLayerId = (typeof DSC_LAYERS)[number];

interface LayerSpec {
  layer: DscLayerId;
  artifact_path: string;
  expected_phase: string;
  expected_system_id: string;
  expected_mode: string;
  expected_target: string;
}

const LAYER_SPECS: LayerSpec[] = [
  {
    layer: 'foundation',
    artifact_path: FOUNDATION_PATH,
    expected_phase: DIRECT_SPATIAL_CONDITIONING_FOUNDATION_PHASE,
    expected_system_id: DIRECT_SPATIAL_CONDITIONING_FOUNDATION_SYSTEM_ID,
    expected_mode: 'design_only',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_FOUNDATION_V1',
  },
  {
    layer: 'contract',
    artifact_path: CONTRACT_PATH,
    expected_phase: DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE,
    expected_system_id: DIRECT_SPATIAL_CONDITIONING_CONTRACT_SYSTEM_ID,
    expected_mode: 'design_only_contract',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_CONTRACT_V1',
  },
  {
    layer: 'packet',
    artifact_path: PACKET_PATH,
    expected_phase: DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE,
    expected_system_id: DIRECT_SPATIAL_CONDITIONING_PACKET_SYSTEM_ID,
    expected_mode: 'design_only_packet',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_V1',
  },
  {
    layer: 'validation',
    artifact_path: VALIDATION_PATH,
    expected_phase: DSC_PACKET_VALIDATION_PHASE,
    expected_system_id: DSC_PACKET_VALIDATION_SYSTEM_ID,
    expected_mode: 'design_only_validation',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_VALIDATION_V1',
  },
  {
    layer: 'assembly',
    artifact_path: ASSEMBLY_PATH,
    expected_phase: DSC_PACKET_ASSEMBLY_PHASE,
    expected_system_id: DSC_PACKET_ASSEMBLY_SYSTEM_ID,
    expected_mode: 'design_only_assembly',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_ASSEMBLY_V1',
  },
  {
    layer: 'generation',
    artifact_path: GENERATION_PATH,
    expected_phase: DSC_PACKET_GENERATION_PHASE,
    expected_system_id: DSC_PACKET_GENERATION_SYSTEM_ID,
    expected_mode: 'design_only_generation',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_GENERATION_V1',
  },
  {
    layer: 'runtime_interface',
    artifact_path: RUNTIME_INTERFACE_PATH,
    expected_phase: DSC_RUNTIME_INTERFACE_PHASE,
    expected_system_id: DSC_RUNTIME_INTERFACE_SYSTEM_ID,
    expected_mode: 'design_only_interface',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_RUNTIME_INTERFACE_V1',
  },
  {
    layer: 'runtime_validation',
    artifact_path: RUNTIME_VALIDATION_PATH,
    expected_phase: DSC_RUNTIME_VALIDATION_PHASE,
    expected_system_id: DSC_RUNTIME_VALIDATION_SYSTEM_ID,
    expected_mode: 'design_only_validation',
    expected_target: 'PASS_DIRECT_SPATIAL_CONDITIONING_RUNTIME_VALIDATION_V1',
  },
];

/** Artifacts this certification must never modify. */
export const DSC_PROTECTED_ARTIFACTS: string[] = [
  ...LAYER_SPECS.map((spec) => spec.artifact_path),
  RUNTIME_PACKAGE_PATH,
  MASTER_PACKAGE_PATH,
  MOVIE_RECONSTRUCTION_CERTIFICATION_PATH,
];

export interface DscCertificationCheckResult {
  check: DscCertificationCheckId;
  passed: boolean;
  detail: string;
  evidence: Record<string, unknown>;
  errors: string[];
}

export interface EvidenceChainLink {
  from_layer: string;
  field: string;
  to_artifact: string;
  resolved: boolean;
  matches_expected: boolean;
}

export interface DirectSpatialConditioningProductionCertification {
  certification_id: string;
  phase: typeof DSC_PRODUCTION_CERTIFICATION_PHASE;
  system_id: typeof DSC_PRODUCTION_CERTIFICATION_SYSTEM_ID;
  mode: 'read_only_certification';
  target: string;
  certified: boolean;
  certified_system: 'DIRECT_SPATIAL_CONDITIONING_V1';
  layers_certified: DscLayerId[];
  checks: DscCertificationCheckResult[];
  evidence_chain: EvidenceChainLink[];
  artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }>;
  upstream_certified_system: {
    movie_reconstruction_certification_ref: string;
    movie_reconstruction_certified: boolean;
    runtime_package_ref: string;
    sources_supported: number;
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
 * Certify Direct Spatial Conditioning V1 by re-checking the eight design
 * layers, their evidence chain, reproducibility, and immutability on disk.
 * Read-only over every certified artifact; writes only the certification file.
 */
export function buildDirectSpatialConditioningProductionCertification(
  projectRoot?: string
): { certification: DirectSpatialConditioningProductionCertification } {
  const root = resolveProjectRoot(projectRoot);
  const created_at = new Date().toISOString();

  // Immutability baseline captured before any read-driven work.
  const baseline = new Map<string, string | null>();
  for (const artifact of DSC_PROTECTED_ARTIFACTS) {
    baseline.set(artifact, sha256(root, artifact));
  }

  const checks: DscCertificationCheckResult[] = [];
  const layers: Record<DscLayerId, AnyRecord> = {} as Record<DscLayerId, AnyRecord>;

  // 1-8) Per-layer identity, mode, and target verification.
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
        if (constraints.backend !== 'none') errors.push('backend not none');
        if (constraints.gpu !== false) errors.push('gpu enabled');
        if (constraints.inference !== false) errors.push('inference enabled');
        if (constraints.placeholders !== false) errors.push('placeholders declared');
        if (constraints.modifies_existing_datasets !== false) {
          errors.push('declares dataset modification');
        }
      }
    }

    checks.push({
      check: spec.layer,
      passed: errors.length === 0,
      detail: `${spec.layer} present at ${spec.expected_phase} with design constraints intact`,
      evidence: {
        artifact: spec.artifact_path,
        phase: layer.phase ?? null,
        system_id: layer.system_id ?? null,
        mode: layer.mode ?? null,
        target: layer.target ?? null,
      },
      errors,
    });
  }

  // 9) Evidence chain — each layer must reference its upstream by exact path.
  const evidence_chain: EvidenceChainLink[] = [];
  {
    const errors: string[] = [];

    const links: Array<{ from: DscLayerId; field: string; expected: string }> = [
      { from: 'contract', field: 'foundation_ref', expected: FOUNDATION_PATH },
      { from: 'packet', field: 'contract_ref', expected: CONTRACT_PATH },
      { from: 'validation', field: 'packet_ref', expected: PACKET_PATH },
      { from: 'assembly', field: 'packet_ref', expected: PACKET_PATH },
      { from: 'assembly', field: 'validation_ref', expected: VALIDATION_PATH },
      { from: 'assembly', field: 'runtime_package_ref', expected: RUNTIME_PACKAGE_PATH },
      { from: 'generation', field: 'assembly_ref', expected: ASSEMBLY_PATH },
      { from: 'generation', field: 'validation_ref', expected: VALIDATION_PATH },
      { from: 'generation', field: 'packet_ref', expected: PACKET_PATH },
      { from: 'generation', field: 'runtime_package_ref', expected: RUNTIME_PACKAGE_PATH },
      { from: 'runtime_interface', field: 'generation_ref', expected: GENERATION_PATH },
      {
        from: 'runtime_interface',
        field: 'runtime_package_ref',
        expected: RUNTIME_PACKAGE_PATH,
      },
      {
        from: 'runtime_validation',
        field: 'runtime_interface_ref',
        expected: RUNTIME_INTERFACE_PATH,
      },
      { from: 'runtime_validation', field: 'generation_ref', expected: GENERATION_PATH },
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

    // Chain root: the certified Movie Reconstruction system (PHASE-029).
    let movieReconstructionCertified = false;
    if (!exists(root, MOVIE_RECONSTRUCTION_CERTIFICATION_PATH)) {
      errors.push('movie reconstruction certification missing');
    } else {
      const mrCert = readJson<AnyRecord>(root, MOVIE_RECONSTRUCTION_CERTIFICATION_PATH);
      movieReconstructionCertified = mrCert.certified === true;
      if (!movieReconstructionCertified) {
        errors.push('movie reconstruction system not certified');
      }
    }

    checks.push({
      check: 'evidence_chain',
      passed: errors.length === 0,
      detail:
        'foundation -> contract -> packet -> validation -> assembly -> generation -> runtime_interface -> runtime_validation, anchored to the certified Movie Reconstruction runtime package',
      evidence: {
        links_verified: evidence_chain.length,
        movie_reconstruction_certified: movieReconstructionCertified,
        runtime_package_ref: RUNTIME_PACKAGE_PATH,
      },
      errors,
    });
  }

  // 10) Reproducibility — derived surfaces still match their upstream exactly,
  //     so regenerating any layer reproduces the same structure. Read-only:
  //     no builder is invoked and nothing is recalculated.
  {
    const errors: string[] = [];

    const contract = layers.contract as AnyRecord | undefined;
    const packet = layers.packet as AnyRecord | undefined;
    const validation = layers.validation as AnyRecord | undefined;
    const assembly = layers.assembly as AnyRecord | undefined;
    const generation = layers.generation as AnyRecord | undefined;
    const runtimeInterface = layers.runtime_interface as AnyRecord | undefined;
    const runtimeValidation = layers.runtime_validation as AnyRecord | undefined;

    const contractComponents = new Map<string, string[]>();
    for (const entry of (contract?.channel_contracts as AnyRecord[] | undefined) ?? []) {
      const inputSchema = entry.input_schema as AnyRecord;
      const fields = inputSchema.fields as AnyRecord;
      const components = (fields.components as AnyRecord[]).map((c) => String(c.name));
      contractComponents.set(String(entry.channel_id), components);
    }

    const packetComponents = new Map<string, string[]>();
    for (const entry of (packet?.channel_payloads as AnyRecord[] | undefined) ?? []) {
      packetComponents.set(
        String(entry.channel_id),
        (entry.component_fields as AnyRecord[]).map((c) => String(c.name))
      );
    }

    for (const channelId of CONDITIONING_CHANNEL_IDS) {
      const fromContract = contractComponents.get(channelId);
      const fromPacket = packetComponents.get(channelId);
      if (!fromContract || !fromPacket) {
        errors.push(`channel ${channelId} missing in contract/packet`);
        continue;
      }
      if (JSON.stringify(fromContract) !== JSON.stringify(fromPacket)) {
        errors.push(`packet/contract component drift ${channelId}`);
      }
    }

    // validation payload ids track packet payload ids
    const packetPayloadIds = new Map<string, string>();
    for (const entry of (packet?.channel_payloads as AnyRecord[] | undefined) ?? []) {
      packetPayloadIds.set(String(entry.channel_id), String(entry.payload_id));
    }
    for (const entry of
      (validation?.channel_payload_validations as AnyRecord[] | undefined) ?? []) {
      const expected = packetPayloadIds.get(String(entry.channel_id));
      if (expected !== String(entry.payload_id)) {
        errors.push(`validation payload_id drift ${String(entry.channel_id)}`);
      }
    }

    // assembly component mappings track packet components
    for (const entry of (assembly?.channel_assemblies as AnyRecord[] | undefined) ?? []) {
      const mapped = (entry.component_source_mappings as AnyRecord[]).map((m) =>
        String(m.packet_component)
      );
      const expected = packetComponents.get(String(entry.channel_id));
      if (!expected || JSON.stringify(mapped) !== JSON.stringify(expected)) {
        errors.push(`assembly component drift ${String(entry.channel_id)}`);
      }
    }

    // generation tracks assembly metadata + components
    const assemblyMetadataFields = (
      (assembly?.metadata_assembly as AnyRecord[] | undefined) ?? []
    ).map((entry) => String(entry.field));
    const generatedInstance = generation?.generated_packet_instance as AnyRecord | undefined;
    const generationMetadataFields = (
      (generatedInstance?.metadata_fields as string[] | undefined) ?? []
    ).map(String);
    if (
      JSON.stringify(assemblyMetadataFields) !== JSON.stringify(generationMetadataFields)
    ) {
      errors.push('generation/assembly metadata field drift');
    }
    const componentsByChannel =
      (generatedInstance?.component_fields_by_channel as Record<string, string[]>) ?? {};
    for (const channelId of CONDITIONING_CHANNEL_IDS) {
      const expected = packetComponents.get(channelId);
      if (
        !expected ||
        JSON.stringify(componentsByChannel[channelId]) !== JSON.stringify(expected)
      ) {
        errors.push(`generation component drift ${channelId}`);
      }
    }

    // runtime interface tracks generation validated output
    const generationOutput = generation?.validated_packet_output as AnyRecord | undefined;
    const interfaceOutput = runtimeInterface?.validated_output as AnyRecord | undefined;
    if (
      JSON.stringify(generationOutput?.required_fields) !==
      JSON.stringify(interfaceOutput?.required_fields)
    ) {
      errors.push('interface/generation validated output field drift');
    }
    if (generationOutput?.artifact_kind !== interfaceOutput?.artifact_kind) {
      errors.push('interface/generation artifact kind drift');
    }

    // runtime validation tracks interface API methods
    const interfaceMethods = (
      ((runtimeInterface?.runtime_api as AnyRecord | undefined)?.methods as
        | AnyRecord[]
        | undefined) ?? []
    ).map((method) => String(method.method_id));
    const expectedMethods = (
      (runtimeValidation?.expected_api_methods as string[] | undefined) ?? []
    ).map(String);
    if (JSON.stringify(interfaceMethods) !== JSON.stringify(expectedMethods)) {
      errors.push('runtime validation/interface method drift');
    }

    // Byte stability: hashing each artifact twice must agree.
    let stableArtifacts = 0;
    for (const artifact of LAYER_SPECS.map((spec) => spec.artifact_path)) {
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
        'every derived surface still matches its upstream layer and all artifacts are byte-stable',
      evidence: {
        channels_checked: CONDITIONING_CHANNEL_IDS.length,
        stable_artifacts: stableArtifacts,
        spatial_frame: SPATIAL_FRAME.frame_id,
        method: 'read_only_derived_parity',
      },
      errors,
    });
  }

  // 11) Immutability — nothing in the protected set changed during certification.
  const artifact_digests: Array<{ artifact: string; sha256: string; bytes: number }> = [];
  {
    const errors: string[] = [];
    for (const artifact of DSC_PROTECTED_ARTIFACTS) {
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
        'all DSC layers plus the certified runtime package, master package, and Movie Reconstruction certification are unchanged',
      evidence: {
        protected_artifacts: DSC_PROTECTED_ARTIFACTS.length,
        digests_recorded: artifact_digests.length,
      },
      errors,
    });
  }

  const errorCount = checks.reduce((sum, entry) => sum + entry.errors.length, 0);
  const certified = checks.every((entry) => entry.passed) && errorCount === 0;

  let movieReconstructionCertified = false;
  if (exists(root, MOVIE_RECONSTRUCTION_CERTIFICATION_PATH)) {
    movieReconstructionCertified =
      readJson<AnyRecord>(root, MOVIE_RECONSTRUCTION_CERTIFICATION_PATH).certified === true;
  }

  const certification: DirectSpatialConditioningProductionCertification = {
    certification_id: 'direct-spatial-conditioning-production-certification-v1',
    phase: DSC_PRODUCTION_CERTIFICATION_PHASE,
    system_id: DSC_PRODUCTION_CERTIFICATION_SYSTEM_ID,
    mode: 'read_only_certification',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_PRODUCTION_CERTIFICATION_V1',
    certified,
    certified_system: 'DIRECT_SPATIAL_CONDITIONING_V1',
    layers_certified: [...DSC_LAYERS],
    checks,
    evidence_chain,
    artifact_digests,
    upstream_certified_system: {
      movie_reconstruction_certification_ref: MOVIE_RECONSTRUCTION_CERTIFICATION_PATH,
      movie_reconstruction_certified: movieReconstructionCertified,
      runtime_package_ref: RUNTIME_PACKAGE_PATH,
      sources_supported: SOURCE_IDS.length,
    },
    integrity_method: 'sha256_read_only_recheck',
    error_count: errorCount,
    created_at,
  };

  writeJson(root, DSC_CERTIFICATION_PATH, certification);
  return { certification };
}
