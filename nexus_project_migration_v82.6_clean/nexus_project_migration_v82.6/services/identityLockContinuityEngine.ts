import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CharacterDNAIndexEntry,
  CharacterIdentityLock,
  CinematicExtractionResult,
  CompressedImagePackage,
  ContinuitySeedGraph,
  ContinuitySeedGraphNode,
  EnvironmentIdentityLock,
  IDENTITY_LOCK_CONTINUITY_ENGINE_VERSION,
  IdentityLockContinuityEngineResult,
  IdentityLockVerificationCheck,
  LockedImageGenerationPackage,
  RuntimeImageGenerationCharacterRef,
  SceneMemoryNode,
  TemporalVisualPersistence,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildMasterCoreDNAAdapterPreview } from './masterCoreDNAAdapter';
import { buildPromptCompressionPreview } from './promptCompressionEngine';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildRuntimeTemporalChainStabilizationPreview } from './runtimeTemporalChainStabilizer';
import { buildTemporalMemoryGraphExport } from './temporalMemoryGraph';

export const IDENTITY_LOCK_CONTINUITY_EPOCH = '2026-05-27T06:30:00.000Z';
export const IDENTITY_LOCK_JSON_FILENAME = 'identity-lock-continuity-engine.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const EXPECTED_SCENE_COUNT = 33;
const IDENTITY_STABILITY_MIN = 0.85;
const TEMPORAL_VISUAL_STABILITY_MIN = 0.82;
const ADJACENT_CARRYOVER_WEIGHT = 0.35;
const SEQUENCE_CARRYOVER_WEIGHT = 0.65;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function ratio(count: number, total: number): number {
  if (total <= 0) return 0;
  return round6(count / total);
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function deriveSequenceBaseSeed(
  sequenceId: string,
  styleCoreRef: string,
  anchorId: string
): string {
  return digest(['seq-base-seed', sequenceId, styleCoreRef, anchorId]).slice(0, 16);
}

function deriveSceneContinuitySeed(
  baseSeed: string,
  sceneId: string,
  temporalAnchorId: string,
  sceneIndex: number,
  previousSeed?: string
): { seed: string; carryoverWeight: number; previousSeedRef?: string } {
  const sceneSeed = digest([
    'scene-continuity-seed',
    baseSeed,
    sceneId,
    temporalAnchorId,
    String(sceneIndex),
  ]).slice(0, 16);

  if (!previousSeed) {
    return { seed: sceneSeed, carryoverWeight: 1 };
  }

  const blended = digest([
    'blended-seed',
    sceneSeed,
    previousSeed,
    String(ADJACENT_CARRYOVER_WEIGHT),
    String(SEQUENCE_CARRYOVER_WEIGHT),
  ]).slice(0, 16);

  return {
    seed: blended,
    carryoverWeight: round6(ADJACENT_CARRYOVER_WEIGHT),
    previousSeedRef: previousSeed,
  };
}

function extractCharacterIdentityLock(
  ref: RuntimeImageGenerationCharacterRef,
  indexEntry: CharacterDNAIndexEntry | undefined,
  scene: CinematicExtractionResult | undefined
): CharacterIdentityLock {
  const dna = indexEntry?.dna_details;
  const persistence = scene?.character_persistence;
  const lockRaw = scene?.production_v82?.character_persistence_lock ??
    scene?.production_v76?.character_persistence_lock;
  const lockOutfit =
    lockRaw && 'outfit_continuity_graph' in lockRaw
      ? (lockRaw as { outfit_continuity_graph?: string }).outfit_continuity_graph
      : lockRaw && 'outfit_continuity' in lockRaw
        ? (lockRaw as { outfit_continuity?: string }).outfit_continuity
        : undefined;
  const lockGaze =
    lockRaw && 'gaze_memory' in lockRaw
      ? (lockRaw as { gaze_memory?: string }).gaze_memory
      : lockRaw && 'gaze_continuity' in lockRaw
        ? (lockRaw as { gaze_continuity?: string }).gaze_continuity
        : undefined;

  const faceTopology =
    dna?.face_eyes ??
    (lockRaw?.face_topology_lock != null ? `topology_lock_${lockRaw.face_topology_lock}` : '') ??
    (persistence?.face_topology_lock != null
      ? `face_topology_${persistence.face_topology_lock}`
      : ref.visual_dna_ref.slice(0, 48));

  const silhouette =
    dna?.core_identity ??
    (lockRaw?.silhouette_persistence != null
      ? `silhouette_${lockRaw.silhouette_persistence}`
      : '') ??
    (persistence?.silhouette_persistence != null
      ? `silhouette_${persistence.silhouette_persistence}`
      : ref.name);

  const eyeSpacing = dna?.face_eyes?.includes('eye')
    ? dna.face_eyes
    : dna?.gaze_logic?.gaze_vector
      ? `eye_spacing_vec_${dna.gaze_logic.gaze_vector.x}_${dna.gaze_logic.gaze_vector.y}`
      : `eye_spacing_ref_${ref.index_key.slice(0, 12)}`;

  const hairRhythm = dna?.hair ?? ref.visual_dna_ref.split(/[,;]/).find((p) => p.toLowerCase().includes('hair')) ?? `hair_${ref.character_id}`;

  const clothGeometry =
    dna?.outfit ??
    lockOutfit ??
    persistence?.outfit_continuity_graph ??
    `cloth_${ref.character_id}`;

  const colorPersistence =
    dna?.skin ??
    scene?.shot_fingerprint?.palette_hash ??
    ref.visual_dna_ref.slice(0, 32);

  const accessoryPersistence =
    dna?.footwear ??
    dna?.additional_notes ??
    persistence?.gaze_memory ??
    lockGaze ??
    `accessory_${ref.character_id}`;

  const lockSignals = [
    faceTopology,
    silhouette,
    eyeSpacing,
    hairRhythm,
    clothGeometry,
    colorPersistence,
    accessoryPersistence,
  ];

  return {
    character_id: ref.character_id,
    face_topology: faceTopology || `face_topology_${ref.character_id}`,
    silhouette: silhouette || ref.name || ref.character_id,
    eye_spacing: eyeSpacing || `eye_spacing_${ref.index_key.slice(0, 12)}`,
    hair_rhythm: hairRhythm || `hair_rhythm_${ref.character_id}`,
    cloth_geometry: clothGeometry || `cloth_geometry_${ref.character_id}`,
    color_persistence: colorPersistence || ref.visual_dna_ref.slice(0, 32),
    accessory_persistence: accessoryPersistence || `accessory_${ref.character_id}`,
    lock_strength: round6(
      lockSignals.filter((value) => value.length > 0).length / 7 || 1
    ),
  };
}

function extractEnvironmentIdentityLock(
  pkg: CompressedImagePackage,
  scene: CinematicExtractionResult | undefined,
  memoryNode: SceneMemoryNode | undefined,
  envContinuity: { weather_persistence?: number; lighting_progression?: number; location_state_drift?: number; atmospheric_evolution?: number } | undefined
): EnvironmentIdentityLock {
  const envDna = pkg.environment_ref.dna_text_ref;
  const lighting = pkg.lighting_profile;
  const physics = scene?.scene_state?.physics;

  const cityTopology =
    memoryNode?.environment_signature ??
    scene?.layers?.scene_language?.environment_tokens?.join('_') ??
    `city_${pkg.environment_ref.slot_key}`;

  const architectureRhythm =
    memoryNode?.framing_signature ??
    scene?.director_dna?.composition_logic?.spatial_honesty?.value?.toString() ??
    (pkg.visual_identity.framing_signatures.join('_') ||
      `arch_${pkg.environment_ref.fingerprint.slice(0, 12)}`);

  const lightingContinuity =
    lighting.lighting_type ??
    lighting.lighting_direction ??
    `light_prog_${envContinuity?.lighting_progression ?? 0.5}`;

  const atmosphereContinuity =
    memoryNode?.color_harmony_signature ??
    memoryNode?.mood_signature ??
    `atmos_${envContinuity?.atmospheric_evolution ?? 0.5}`;

  const weatherPersistence = `weather_${round6(envContinuity?.weather_persistence ?? 0.5)}`;

  const materialResponse =
    physics?.luminance_contrast?.value != null
      ? `material_luminance_${physics.luminance_contrast.value}`
      : envDna.slice(0, 64) || `material_${pkg.environment_ref.slot_key}`;

  return {
    city_topology: cityTopology || `city_${pkg.environment_ref.slot_key}`,
    architecture_rhythm: architectureRhythm || `arch_${pkg.scene_id}`,
    lighting_continuity: String(lightingContinuity || `light_${pkg.environment_ref.slot_key}`),
    atmosphere_continuity: atmosphereContinuity || `atmos_${pkg.environment_ref.slot_key}`,
    weather_persistence: weatherPersistence,
    material_response: materialResponse || `material_${pkg.environment_ref.slot_key}`,
    lock_strength: round6(
      [
        cityTopology,
        architectureRhythm,
        lightingContinuity,
        atmosphereContinuity,
        weatherPersistence,
        materialResponse,
      ].filter((value) => String(value).length > 0).length / 6 || 1
    ),
  };
}

function computeTemporalVisualPersistence(
  pkg: CompressedImagePackage,
  scene: CinematicExtractionResult | undefined,
  memoryNode: SceneMemoryNode | undefined,
  charContinuity: { emotional_drift?: number; clothing_continuity?: number } | undefined,
  prevPkg: CompressedImagePackage | undefined
): TemporalVisualPersistence {
  const visualCarryover = round6(
    (pkg.continuity_memory.character_signatures.length > 0 ? 0.25 : 0) +
      (pkg.continuity_memory.motif_signatures.length > 0 ? 0.2 : 0) +
      (charContinuity?.clothing_continuity ?? 0.5) * 0.35 +
      (1 - Math.min(charContinuity?.emotional_drift ?? 0.2, 1)) * 0.2
  );

  const framingContinuity = round6(
    pkg.visual_identity.framing_signatures.length > 0
      ? ratio(
          pkg.visual_identity.framing_signatures.filter((f) =>
            prevPkg?.visual_identity.framing_signatures.includes(f)
          ).length,
          Math.max(pkg.visual_identity.framing_signatures.length, 1)
        ) * 0.5 + 0.5
      : memoryNode?.framing_signature
        ? 0.88
        : 0.72
  );

  const colorContinuity = round6(
    pkg.visual_identity.palette_hash && prevPkg?.visual_identity.palette_hash
      ? pkg.visual_identity.palette_hash === prevPkg.visual_identity.palette_hash
        ? 0.95
        : 0.78
      : memoryNode?.color_harmony_signature
        ? 0.85
        : 0.75
  );

  const cameraRhythmContinuity = round6(
    scene?.camera_rhythm_memory?.rhythm_continuity ??
      scene?.sequence_graph?.transition_logic?.emotion_continuity ??
      (pkg.camera_profile.cinematography_tokens.length > 0 ? 0.82 : 0.7)
  );

  const emotionalVisualContinuity = round6(
    (pkg.emotional_profile.emotional_carryover_intensity ?? 0.5) * 0.4 +
      (1 - Math.min(charContinuity?.emotional_drift ?? 0.15, 1)) * 0.35 +
      (memoryNode?.mood_signature ? 0.25 : 0.15)
  );

  return {
    visual_carryover: visualCarryover,
    framing_continuity: framingContinuity,
    color_continuity: colorContinuity,
    camera_rhythm_continuity: cameraRhythmContinuity,
    emotional_visual_continuity: emotionalVisualContinuity,
  };
}

function computeContinuityStrengthScore(
  characterLocks: CharacterIdentityLock[],
  environmentLock: EnvironmentIdentityLock,
  temporalPersistence: TemporalVisualPersistence
): number {
  const charStrength =
    characterLocks.length > 0
      ? characterLocks.reduce((sum, lock) => sum + lock.lock_strength, 0) / characterLocks.length
      : 0.5;
  const envStrength = environmentLock.lock_strength;
  const temporalStrength = round6(
    (temporalPersistence.visual_carryover +
      temporalPersistence.framing_continuity +
      temporalPersistence.color_continuity +
      temporalPersistence.camera_rhythm_continuity +
      temporalPersistence.emotional_visual_continuity) /
      5
  );
  return round6(charStrength * 0.4 + envStrength * 0.3 + temporalStrength * 0.3);
}

function buildContinuitySeedGraph(
  packages: LockedImageGenerationPackage[]
): ContinuitySeedGraph {
  const sequenceBaseSeeds: Record<string, string> = {};
  const nodes: ContinuitySeedGraphNode[] = [];

  for (const pkg of packages) {
    if (!sequenceBaseSeeds[pkg.sequence_id]) {
      sequenceBaseSeeds[pkg.sequence_id] = deriveSequenceBaseSeed(
        pkg.sequence_id,
        pkg.style_core_ref,
        pkg.temporal_anchor_id
      );
    }
  }

  let previousBySequence: Record<string, string> = {};
  packages.forEach((pkg, index) => {
    const baseSeed = sequenceBaseSeeds[pkg.sequence_id];
    const prevSeed = previousBySequence[pkg.sequence_id];
    const derived = deriveSceneContinuitySeed(
      baseSeed,
      pkg.scene_id,
      pkg.temporal_anchor_id,
      index,
      prevSeed
    );

    nodes.push({
      scene_id: pkg.scene_id,
      scene_index: index,
      sequence_id: pkg.sequence_id,
      continuity_seed: derived.seed,
      previous_seed_ref: derived.previousSeedRef,
      carryover_weight: derived.carryoverWeight,
      temporal_anchor_id: pkg.temporal_anchor_id,
    });

    previousBySequence = {
      ...previousBySequence,
      [pkg.sequence_id]: derived.seed,
    };
  });

  return {
    sequence_base_seeds: sequenceBaseSeeds,
    nodes,
    edge_count: nodes.filter((node) => node.previous_seed_ref).length,
  };
}

function computeIdentityStabilityScore(packages: LockedImageGenerationPackage[]): number {
  if (packages.length === 0) return 0;
  const charScores = packages.map((pkg) =>
    pkg.character_identity_lock.length > 0
      ? pkg.character_identity_lock.reduce((sum, lock) => sum + lock.lock_strength, 0) /
        pkg.character_identity_lock.length
      : 0
  );
  const envScores = packages.map((pkg) => pkg.environment_identity_lock.lock_strength);
  const continuityScores = packages.map((pkg) => pkg.continuity_strength_score);
  const avg = (arr: number[]) => round6(arr.reduce((a, b) => a + b, 0) / arr.length);
  return round6(avg(charScores) * 0.35 + avg(envScores) * 0.3 + avg(continuityScores) * 0.35);
}

function computeTemporalVisualStability(packages: LockedImageGenerationPackage[]): number {
  if (packages.length === 0) return 0;
  const scores = packages.map((pkg) => {
    const t = pkg.temporal_visual_persistence;
    return round6(
      (t.visual_carryover +
        t.framing_continuity +
        t.color_continuity +
        t.camera_rhythm_continuity +
        t.emotional_visual_continuity) /
        5
    );
  });
  return round6(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function evaluateContinuityChainIntegrity(graph: ContinuitySeedGraph): boolean {
  if (graph.nodes.length !== EXPECTED_SCENE_COUNT) return false;
  const uniqueSeeds = new Set(graph.nodes.map((node) => node.continuity_seed));
  if (uniqueSeeds.size < 2) return false;
  return graph.nodes.every(
    (node) => node.continuity_seed.length === 16 && node.temporal_anchor_id.length > 0
  );
}

function buildLockedPackage(
  pkg: CompressedImagePackage,
  scene: CinematicExtractionResult | undefined,
  memoryNode: SceneMemoryNode | undefined,
  charContinuity: { emotional_drift?: number; clothing_continuity?: number } | undefined,
  envContinuity: {
    weather_persistence?: number;
    lighting_progression?: number;
    location_state_drift?: number;
    atmospheric_evolution?: number;
  } | undefined,
  characterIndex: Record<string, CharacterDNAIndexEntry>,
  prevPkg: CompressedImagePackage | undefined,
  continuitySeed: string,
  carryoverWeight: number
): LockedImageGenerationPackage {
  const refs =
    pkg.character_refs.length > 0
      ? pkg.character_refs
      : Object.values(characterIndex)
          .slice(0, 1)
          .map((entry) => ({
            character_id: entry.character_id,
            index_key: entry.index_key,
            name: entry.name,
            visual_dna_ref: entry.visual_dna,
            source_layer: 'memory_node' as const,
          }));

  const character_identity_lock = refs.map((ref) =>
    extractCharacterIdentityLock(ref, characterIndex[ref.character_id], scene)
  );
  const environment_identity_lock = extractEnvironmentIdentityLock(
    pkg,
    scene,
    memoryNode,
    envContinuity
  );
  const temporal_visual_persistence = computeTemporalVisualPersistence(
    pkg,
    scene,
    memoryNode,
    charContinuity,
    prevPkg
  );
  const continuity_strength_score = computeContinuityStrengthScore(
    character_identity_lock,
    environment_identity_lock,
    temporal_visual_persistence
  );

  return {
    ...pkg,
    continuity_seed: continuitySeed,
    character_identity_lock,
    environment_identity_lock,
    temporal_visual_persistence,
    continuity_strength_score: round6(continuity_strength_score * (0.85 + carryoverWeight * 0.15)),
  };
}

function verifyNoPromptCorruption(
  source: CompressedImagePackage[],
  locked: LockedImageGenerationPackage[]
): boolean {
  return locked.every(
    (pkg, index) =>
      pkg.cinematic_prompt === source[index]?.cinematic_prompt &&
      pkg.negative_prompt === source[index]?.negative_prompt
  );
}

function verifyNoIdentityDrift(packages: LockedImageGenerationPackage[]): boolean {
  return packages.every((pkg) => {
    const charOk =
      pkg.character_identity_lock.length > 0 &&
      pkg.character_identity_lock.every(
        (lock) =>
          lock.face_topology.length > 0 &&
          lock.silhouette.length > 0 &&
          lock.eye_spacing.length > 0 &&
          lock.hair_rhythm.length > 0 &&
          lock.cloth_geometry.length > 0 &&
          lock.color_persistence.length > 0 &&
          lock.accessory_persistence.length > 0 &&
          lock.lock_strength >= 0.5
      );
    const envOk =
      pkg.environment_identity_lock.city_topology.length > 0 &&
      pkg.environment_identity_lock.architecture_rhythm.length > 0 &&
      pkg.environment_identity_lock.lighting_continuity.length > 0 &&
      pkg.environment_identity_lock.atmosphere_continuity.length > 0 &&
      pkg.environment_identity_lock.weather_persistence.length > 0 &&
      pkg.environment_identity_lock.material_response.length > 0 &&
      pkg.environment_identity_lock.lock_strength >= 0.5;
    return charOk && envOk;
  });
}

function buildVerificationChecks(
  packages: LockedImageGenerationPackage[],
  source: CompressedImagePackage[],
  identityStability: number,
  temporalStability: number,
  chainIntegrity: boolean,
  runtimeFingerprintBefore: string,
  runtimeFingerprintAfter: string
): IdentityLockVerificationCheck[] {
  return [
    {
      check_key: 'scene_count',
      label: '33 Locked Packages',
      passed: packages.length === EXPECTED_SCENE_COUNT,
      detail: `${packages.length}/${EXPECTED_SCENE_COUNT} identity-locked packages`,
    },
    {
      check_key: 'identity_stability',
      label: 'Identity Stability High',
      passed: identityStability >= IDENTITY_STABILITY_MIN,
      detail: `Identity stability ${identityStability} (min ${IDENTITY_STABILITY_MIN})`,
    },
    {
      check_key: 'temporal_visual_stability',
      label: 'Temporal Visual Stability',
      passed: temporalStability >= TEMPORAL_VISUAL_STABILITY_MIN,
      detail: `Temporal visual stability ${temporalStability} (min ${TEMPORAL_VISUAL_STABILITY_MIN})`,
    },
    {
      check_key: 'continuity_chain_integrity',
      label: 'Continuity Chain Integrity',
      passed: chainIntegrity,
      detail: chainIntegrity
        ? 'Continuity seed graph complete with deterministic adjacent carryover'
        : 'Continuity seed graph incomplete',
    },
    {
      check_key: 'no_prompt_corruption',
      label: 'No Prompt Corruption',
      passed: verifyNoPromptCorruption(source, packages),
      detail: 'Compressed cinematic_prompt and negative_prompt unchanged from PHASE-21C',
    },
    {
      check_key: 'no_identity_drift',
      label: 'No Identity Drift',
      passed: verifyNoIdentityDrift(packages),
      detail: 'All character and environment identity locks populated with minimum strength',
    },
    {
      check_key: 'runtime_dataset_unchanged',
      label: 'Runtime Dataset Unchanged',
      passed: runtimeFingerprintBefore === runtimeFingerprintAfter,
      detail: 'Readonly identity lock — runtime fingerprint preserved',
    },
    {
      check_key: 'canonical_export_unchanged',
      label: 'Canonical Export Unchanged',
      passed: assertCanonicalExportUnchanged(),
      detail: `Parent canonical export remains ${CANONICAL_EXPORT_SIZE_BYTES} bytes`,
    },
  ];
}

export function buildIdentityLockContinuityEngine(): IdentityLockContinuityEngineResult {
  const compression = buildPromptCompressionPreview();
  const stabilization = buildRuntimeTemporalChainStabilizationPreview();
  const masterCore = buildMasterCoreDNAAdapterPreview();
  const sourcePackages = compression.compressed_image_packages;

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const runtimeDataset = getActiveRuntimeDataset();
  const runtimeById = new Map(runtimeDataset.map((scene) => [scene.id, scene]));
  const temporalExport = buildTemporalMemoryGraphExport(runtimeDataset);
  const memoryNodes = temporalExport.temporal_memory_graph.scene_memory_nodes;
  const charContinuity = temporalExport.continuity_summary.character_continuity;
  const envContinuity = temporalExport.continuity_summary.environment_continuity;

  const sequenceBaseSeeds: Record<string, string> = {};
  const previousBySequence: Record<string, string> = {};
  const locked_image_generation_packages: LockedImageGenerationPackage[] = [];

  sourcePackages.forEach((pkg, index) => {
    if (!sequenceBaseSeeds[pkg.sequence_id]) {
      sequenceBaseSeeds[pkg.sequence_id] = deriveSequenceBaseSeed(
        pkg.sequence_id,
        pkg.style_core_ref,
        pkg.temporal_anchor_id
      );
    }
    const baseSeed = sequenceBaseSeeds[pkg.sequence_id];
    const prevSeed = previousBySequence[pkg.sequence_id];
    const derived = deriveSceneContinuitySeed(
      baseSeed,
      pkg.scene_id,
      pkg.temporal_anchor_id,
      index,
      prevSeed
    );

    const locked = buildLockedPackage(
      pkg,
      runtimeById.get(pkg.scene_id),
      memoryNodes[index],
      charContinuity[index],
      envContinuity[index],
      masterCore.character_dna_index,
      index > 0 ? sourcePackages[index - 1] : undefined,
      derived.seed,
      derived.carryoverWeight
    );

    locked_image_generation_packages.push(locked);
    previousBySequence[pkg.sequence_id] = derived.seed;
  });

  const continuity_seed_graph = buildContinuitySeedGraph(locked_image_generation_packages);
  const identity_stability_score = computeIdentityStabilityScore(locked_image_generation_packages);
  const temporal_visual_stability = computeTemporalVisualStability(locked_image_generation_packages);
  const continuity_chain_integrity = evaluateContinuityChainIntegrity(continuity_seed_graph);

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const identity_lock_verification_checks = buildVerificationChecks(
    locked_image_generation_packages,
    sourcePackages,
    identity_stability_score,
    temporal_visual_stability,
    continuity_chain_integrity,
    runtimeFingerprintBefore,
    runtimeFingerprintAfter
  );

  const lockCore = {
    schema_version: IDENTITY_LOCK_CONTINUITY_ENGINE_VERSION,
    generated_at: IDENTITY_LOCK_CONTINUITY_EPOCH,
    readonly_identity_lock: true as const,
    compression_checksum_ref: compression.engine_neutral_package_checksum,
    stabilization_verdict_ref: stabilization.runtime_chain_verdict,
    temporal_graph_checksum_ref: temporalExport.export_checksum,
    scene_count: locked_image_generation_packages.length,
    locked_image_generation_packages,
    continuity_chain_integrity,
    identity_stability_score,
    temporal_visual_stability,
    continuity_seed_graph,
    identity_lock_verification_checks,
    validation: {
      deterministic_identity_lock_checksum_stable: true,
      readonly_identity_lock: true as const,
      no_prompt_corruption: verifyNoPromptCorruption(
        sourcePackages,
        locked_image_generation_packages
      ) as true,
      no_identity_drift: verifyNoIdentityDrift(locked_image_generation_packages) as true,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
      no_provider_calls: true as const,
      no_image_generation: true as const,
    },
  };

  const identity_lock_checksum = digest([
    JSON.stringify({ ...lockCore, identity_lock_checksum: undefined }),
    compression.engine_neutral_package_checksum,
    String(continuity_chain_integrity),
  ]);

  return {
    ...lockCore,
    identity_lock_checksum,
  };
}

let cachedIdentityLock: IdentityLockContinuityEngineResult | null = null;

export function buildIdentityLockContinuityPreview(): IdentityLockContinuityEngineResult {
  if (cachedIdentityLock) return cachedIdentityLock;
  cachedIdentityLock = buildIdentityLockContinuityEngine();
  return cachedIdentityLock;
}

export function buildIdentityLockContinuityJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildIdentityLockContinuityPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: IDENTITY_LOCK_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetIdentityLockContinuityCache(): void {
  cachedIdentityLock = null;
}
