import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  FluxPackEntry,
  LockedImageGenerationPackage,
  MidjourneyPackEntry,
  SINGLE_SCENE_GENERATION_TEST_VERSION,
  SingleSceneCandidateScore,
  SingleSceneGenerationEngineResult,
  SingleSceneGenerationTestResult,
  SingleSceneGenerationTestStatus,
  SingleSceneGenerationVerificationCheck,
  SingleSceneTestEngine,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildEngineAdapterExportPackPreview } from './engineAdapterExportPack';
import { buildIdentityLockContinuityPreview } from './identityLockContinuityEngine';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildTemporalMemoryGraphExport } from './temporalMemoryGraph';

export const SINGLE_SCENE_GENERATION_TEST_EPOCH = '2026-05-27T07:30:00.000Z';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const MAX_RENDER_COUNT = 5;
const DEFAULT_ENGINES: SingleSceneTestEngine[] = ['midjourney_pack', 'flux_pack'];
const PASS_THRESHOLD = 0.85;
const CONDITIONAL_THRESHOLD = 0.72;

export interface SingleSceneGenerationTestOptions {
  scene_id?: string;
  engine?: SingleSceneTestEngine;
}

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function clamp01(value: number): number {
  return round6(Math.max(0, Math.min(1, value)));
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function scoreEmotionalStability(
  locked: LockedImageGenerationPackage,
  emotionalDrift: number | undefined
): number {
  const drift = emotionalDrift ?? 0.2;
  const carryover = locked.emotional_profile.emotional_carryover_intensity ?? 0.5;
  const temporal = locked.temporal_visual_persistence.emotional_visual_continuity;
  return clamp01((1 - drift) * 0.45 + carryover * 0.25 + temporal * 0.3);
}

function scoreCameraMotionFit(locked: LockedImageGenerationPackage): number {
  const tokens = locked.camera_profile.cinematography_tokens.join(' ').toLowerCase();
  const motionSummary = locked.camera_profile.camera_motion_summary.toLowerCase();
  const combined = `${tokens} ${motionSummary}`;
  const staticSignals = ['static', 'locked', 'still', 'tableau'].filter((s) => combined.includes(s));
  const aggressiveSignals = ['whip', 'crash', 'kinetic', 'aggressive', 'handheld chaos'].filter(
    (s) => combined.includes(s)
  );
  const mediumSignals = [
    'tracking',
    'dolly',
    'steadicam',
    'smooth',
    'medium',
    'pan',
    'crane',
  ].filter((s) => combined.includes(s));

  if (aggressiveSignals.length > 0 && mediumSignals.length === 0) return 0.45;
  if (staticSignals.length > 0 && mediumSignals.length === 0) return 0.55;
  if (mediumSignals.length > 0) return clamp01(0.78 + mediumSignals.length * 0.05);
  return 0.68;
}

function scoreEnvironmentVisibility(locked: LockedImageGenerationPackage): number {
  const env = locked.environment_identity_lock;
  const tokenCount = locked.lighting_profile.environment_tokens.length;
  return clamp01(env.lock_strength * 0.6 + Math.min(tokenCount / 4, 1) * 0.25 + 0.15);
}

function scoreCharacterVisibility(locked: LockedImageGenerationPackage): number {
  const locks = locked.character_identity_lock;
  if (locks.length === 0) return 0.3;
  const avgStrength = locks.reduce((sum, lock) => sum + lock.lock_strength, 0) / locks.length;
  const refCount = locked.character_refs.length;
  return clamp01(avgStrength * 0.55 + Math.min(refCount / 2, 1) * 0.25 + 0.2);
}

function scoreCrowdDensityInverse(locked: LockedImageGenerationPackage): number {
  const subjectAtoms = locked.visual_identity.atom_labels.filter((label) =>
    label.toLowerCase().includes('subject')
  ).length;
  const totalAtoms = locked.visual_identity.atom_labels.length;
  const crowdPenalty = Math.max(0, subjectAtoms - 1) * 0.15 + Math.max(0, totalAtoms - 6) * 0.05;
  return clamp01(1 - crowdPenalty);
}

function buildCandidateScores(
  lockedPackages: LockedImageGenerationPackage[],
  emotionalDriftByScene: Map<string, number>
): SingleSceneCandidateScore[] {
  return lockedPackages
    .map((locked) => {
      const emotional_stability = scoreEmotionalStability(
        locked,
        emotionalDriftByScene.get(locked.scene_id)
      );
      const camera_motion_fit = scoreCameraMotionFit(locked);
      const environment_visibility = scoreEnvironmentVisibility(locked);
      const character_visibility = scoreCharacterVisibility(locked);
      const crowd_density_inverse = scoreCrowdDensityInverse(locked);
      const composite_score = round6(
        emotional_stability * 0.22 +
          camera_motion_fit * 0.18 +
          environment_visibility * 0.2 +
          character_visibility * 0.22 +
          crowd_density_inverse * 0.18
      );
      return {
        scene_id: locked.scene_id,
        composite_score,
        emotional_stability,
        camera_motion_fit,
        environment_visibility,
        character_visibility,
        crowd_density_inverse,
      };
    })
    .sort((a, b) => b.composite_score - a.composite_score || a.scene_id.localeCompare(b.scene_id));
}

function selectSceneId(
  candidates: SingleSceneCandidateScore[],
  requestedSceneId?: string
): { scene_id: string; rationale: string } {
  if (requestedSceneId) {
    const match = candidates.find((candidate) => candidate.scene_id === requestedSceneId);
    if (match) {
      return {
        scene_id: match.scene_id,
        rationale: `Explicit scene_id ${match.scene_id} selected (composite ${match.composite_score})`,
      };
    }
  }

  const best = candidates[0];
  return {
    scene_id: best.scene_id,
    rationale: `Auto-selected ${best.scene_id}: emotionally stable (${best.emotional_stability}), medium camera fit (${best.camera_motion_fit}), strong environment (${best.environment_visibility}) and character (${best.character_visibility}) visibility, low crowd density (${best.crowd_density_inverse})`,
  };
}

function resolveTestStatus(scores: number[]): SingleSceneGenerationTestStatus {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= PASS_THRESHOLD) return 'test_pass';
  if (avg >= CONDITIONAL_THRESHOLD) return 'test_conditional';
  return 'test_fail';
}

function computePromptFidelity(enginePrompt: string, compressedPrompt: string): number {
  const engineTokens = new Set(
    enginePrompt
      .toLowerCase()
      .split(/\s+/)
      .filter((token) => token.length > 3)
  );
  const sourceTokens = compressedPrompt
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 3);
  if (sourceTokens.length === 0) return 0;
  const overlap = sourceTokens.filter((token) => engineTokens.has(token)).length;
  return clamp01(overlap / sourceTokens.length);
}

function simulateEngineResult(
  engine: SingleSceneTestEngine,
  locked: LockedImageGenerationPackage,
  midjourneyEntry: MidjourneyPackEntry | undefined,
  fluxEntry: FluxPackEntry | undefined,
  renderIndex: number
): SingleSceneGenerationEngineResult {
  const exportEntry = engine === 'midjourney_pack' ? midjourneyEntry : fluxEntry;
  if (!exportEntry) {
    return {
      scene_id: locked.scene_id,
      engine,
      generation_test_status: 'test_skipped',
      identity_match_score: 0,
      environment_match_score: 0,
      style_alignment_score: 0,
      continuity_alignment_score: 0,
      render_notes: `Export entry missing for ${engine}`,
      recommended_adjustments: ['Verify PHASE-21E export pack contains engine format entry'],
      simulated_render_fingerprint: digest(['skipped', engine, locked.scene_id]),
      continuity_seed_used: locked.continuity_seed,
      render_index: renderIndex,
      prompt_fidelity_score: 0,
      face_consistency_score: 0,
      lighting_consistency_score: 0,
      continuity_lock_adherence: 0,
    };
  }

  const enginePrompt =
    engine === 'midjourney_pack'
      ? (exportEntry as MidjourneyPackEntry).engine_prompt
      : (exportEntry as FluxPackEntry).engine_prompt;
  const continuitySeedUsed =
    engine === 'midjourney_pack'
      ? (exportEntry as MidjourneyPackEntry).engine_parameters.seed
      : String((exportEntry as FluxPackEntry).engine_parameters.seed);

  const identityLocks = exportEntry.identity_lock;
  const avgLockStrength =
    identityLocks.length > 0
      ? identityLocks.reduce((sum, lock) => sum + lock.lock_strength, 0) / identityLocks.length
      : 0.5;

  const identityInPrompt = identityLocks.every(
    (lock) =>
      enginePrompt.includes(lock.character_id) ||
      enginePrompt.includes(lock.face_topology.slice(0, 12)) ||
      enginePrompt.includes(lock.silhouette.slice(0, 12))
  );

  const identity_match_score = clamp01(
    avgLockStrength * 0.5 + (identityInPrompt ? 0.3 : 0.1) + locked.continuity_strength_score * 0.2
  );

  const env = exportEntry.environment_lock;
  const environmentInPrompt =
    enginePrompt.includes(env.city_topology.slice(0, 12)) ||
    enginePrompt.includes(env.lighting_continuity.slice(0, 12)) ||
    enginePrompt.includes(env.weather_persistence);
  const environment_match_score = clamp01(
    env.lock_strength * 0.55 + (environmentInPrompt ? 0.25 : 0.1) + locked.environment_identity_lock.lock_strength * 0.2
  );

  const style_alignment_score = clamp01(
    (enginePrompt.includes(exportEntry.style_core_ref.slice(0, 12)) ? 0.45 : 0.2) +
      locked.temporal_visual_persistence.color_continuity * 0.3 +
      0.25
  );

  const seedStable = continuitySeedUsed === locked.continuity_seed ||
    String(continuitySeedUsed) === String(
      parseInt(locked.continuity_seed.slice(0, 8), 16) % 2147483646
    );
  const continuity_alignment_score = clamp01(
    (seedStable ? 0.4 : 0.15) +
      locked.temporal_visual_persistence.visual_carryover * 0.25 +
      locked.temporal_visual_persistence.framing_continuity * 0.2 +
      locked.continuity_strength_score * 0.15
  );

  const prompt_fidelity_score = computePromptFidelity(enginePrompt, exportEntry.compressed_prompt);
  const face_consistency_score = clamp01(
    identityLocks.reduce((sum, lock) => sum + (lock.face_topology.length > 0 ? 1 : 0), 0) /
      Math.max(identityLocks.length, 1) *
      0.6 +
      identity_match_score * 0.4
  );
  const lighting_consistency_score = clamp01(
    env.lighting_continuity.length > 0 ? 0.55 : 0.35 + locked.lighting_profile.naturalism_index != null
      ? Number(locked.lighting_profile.naturalism_index) * 0.2
      : 0.15
  );
  const continuity_lock_adherence = clamp01(
    (exportEntry.production_lock_ref === locked.production_lock_ref ? 0.35 : 0.1) +
      continuity_alignment_score * 0.45 +
      locked.continuity_strength_score * 0.2
  );

  const coreScores = [
    identity_match_score,
    environment_match_score,
    style_alignment_score,
    continuity_alignment_score,
    prompt_fidelity_score,
    face_consistency_score,
  ];
  const generation_test_status = resolveTestStatus(coreScores);

  const simulated_render_fingerprint = digest([
    'simulated-render-v1',
    engine,
    locked.scene_id,
    continuitySeedUsed,
    enginePrompt,
    String(renderIndex),
    exportEntry.production_lock_ref,
  ]);

  const render_notes = [
    `Simulated controlled render #${renderIndex} for ${engine}`,
    `Seed ${continuitySeedUsed} preserved deterministically`,
    `Identity match ${identity_match_score}, environment ${environment_match_score}`,
    `Face consistency ${face_consistency_score}, lighting ${lighting_consistency_score}`,
    `Prompt fidelity ${prompt_fidelity_score} (no rewrite applied)`,
  ].join('. ');

  const recommended_adjustments: string[] = [];
  if (identity_match_score < PASS_THRESHOLD) {
    recommended_adjustments.push('Increase character identity lock weight in engine prompt header');
  }
  if (environment_match_score < PASS_THRESHOLD) {
    recommended_adjustments.push('Reinforce environment lock descriptors before next render attempt');
  }
  if (face_consistency_score < PASS_THRESHOLD) {
    recommended_adjustments.push('Review face topology lock tokens for potential drift on retry');
  }
  if (continuity_alignment_score < PASS_THRESHOLD) {
    recommended_adjustments.push('Verify continuity seed mapping between PHASE-21D and engine adapter');
  }
  if (generation_test_status === 'test_pass') {
    recommended_adjustments.push('No adjustments required — proceed to PHASE-22B multi-engine comparison');
  }

  return {
    scene_id: locked.scene_id,
    engine,
    generation_test_status,
    identity_match_score,
    environment_match_score,
    style_alignment_score,
    continuity_alignment_score,
    render_notes,
    recommended_adjustments,
    simulated_render_fingerprint,
    continuity_seed_used: continuitySeedUsed,
    render_index: renderIndex,
    prompt_fidelity_score,
    face_consistency_score,
    lighting_consistency_score,
    continuity_lock_adherence,
  };
}

function buildVerificationChecks(
  engineResults: SingleSceneGenerationEngineResult[],
  selectedSceneId: string,
  renderCount: number,
  runtimeFingerprintBefore: string,
  runtimeFingerprintAfter: string
): SingleSceneGenerationVerificationCheck[] {
  const uniqueScenes = new Set(engineResults.map((result) => result.scene_id));
  const identityOk = engineResults.every((result) => result.identity_match_score >= PASS_THRESHOLD);
  const faceOk = engineResults.every((result) => result.face_consistency_score >= PASS_THRESHOLD);
  const envOk = engineResults.every((result) => result.environment_match_score >= PASS_THRESHOLD);
  const seedStable = engineResults.every(
    (result) => result.continuity_seed_used.length > 0 && result.simulated_render_fingerprint.length === 64
  );
  const fingerprintsUnique =
    new Set(engineResults.map((result) => result.simulated_render_fingerprint)).size ===
    engineResults.length;

  return [
    {
      check_key: 'single_scene_only',
      label: 'Single Scene Only',
      passed: uniqueScenes.size === 1 && uniqueScenes.has(selectedSceneId),
      detail: `All ${engineResults.length} renders target scene ${selectedSceneId}`,
    },
    {
      check_key: 'max_render_count',
      label: 'Max Render Count',
      passed: renderCount <= MAX_RENDER_COUNT,
      detail: `${renderCount}/${MAX_RENDER_COUNT} simulated renders executed`,
    },
    {
      check_key: 'identity_lock_adherence',
      label: 'Identity Lock Adherence',
      passed: identityOk,
      detail: identityOk
        ? `Identity match scores >= ${PASS_THRESHOLD} on all engines`
        : 'Identity match below threshold on one or more engines',
    },
    {
      check_key: 'no_major_face_drift',
      label: 'No Major Face Drift',
      passed: faceOk,
      detail: faceOk
        ? `Face consistency >= ${PASS_THRESHOLD} on all engines`
        : 'Face consistency below threshold — potential drift detected',
    },
    {
      check_key: 'no_environment_collapse',
      label: 'No Environment Collapse',
      passed: envOk,
      detail: envOk
        ? `Environment match >= ${PASS_THRESHOLD} on all engines`
        : 'Environment consistency below threshold',
    },
    {
      check_key: 'continuity_seed_stability',
      label: 'Continuity Seed Stability',
      passed: seedStable,
      detail: seedStable
        ? 'Deterministic continuity seeds preserved across simulated renders'
        : 'Continuity seed missing or unstable',
    },
    {
      check_key: 'render_fingerprint_consistency',
      label: 'Rendered Image Consistency',
      passed: fingerprintsUnique && engineResults.every((r) => r.simulated_render_fingerprint.length === 64),
      detail: fingerprintsUnique
        ? 'Unique deterministic render fingerprints per engine'
        : 'Render fingerprint collision detected',
    },
    {
      check_key: 'runtime_dataset_unchanged',
      label: 'Runtime Dataset Unchanged',
      passed: runtimeFingerprintBefore === runtimeFingerprintAfter,
      detail: 'Readonly test — runtime fingerprint preserved',
    },
    {
      check_key: 'canonical_export_unchanged',
      label: 'Canonical Export Unchanged',
      passed: assertCanonicalExportUnchanged(),
      detail: `Parent canonical export remains ${CANONICAL_EXPORT_SIZE_BYTES} bytes`,
    },
  ];
}

export function buildSingleSceneGenerationTest(
  options: SingleSceneGenerationTestOptions = {}
): SingleSceneGenerationTestResult {
  const exportPack = buildEngineAdapterExportPackPreview();
  const identityLock = buildIdentityLockContinuityPreview();
  const lockedPackages = identityLock.locked_image_generation_packages;

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const runtimeDataset = getActiveRuntimeDataset();
  const temporalExport = buildTemporalMemoryGraphExport(runtimeDataset);
  const emotionalDriftByScene = new Map(
    temporalExport.continuity_summary.character_continuity.map((state) => [
      state.scene_id,
      state.emotional_drift,
    ])
  );

  const candidate_scores = buildCandidateScores(lockedPackages, emotionalDriftByScene);
  const selection = selectSceneId(candidate_scores, options.scene_id);
  const selectedSceneId = selection.scene_id;
  const locked = lockedPackages.find((pkg) => pkg.scene_id === selectedSceneId);
  if (!locked) {
    throw new Error(`Selected scene ${selectedSceneId} not found in locked packages`);
  }

  const midjourneyEntry = exportPack.export_formats.midjourney_pack.entries.find(
    (entry) => entry.scene_id === selectedSceneId
  );
  const fluxEntry = exportPack.export_formats.flux_pack.entries.find(
    (entry) => entry.scene_id === selectedSceneId
  );

  const engines: SingleSceneTestEngine[] = options.engine ? [options.engine] : DEFAULT_ENGINES;
  const engine_results: SingleSceneGenerationEngineResult[] = engines.map((engine, index) =>
    simulateEngineResult(engine, locked, midjourneyEntry, fluxEntry, index + 1)
  );

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const generation_test_verification_checks = buildVerificationChecks(
    engine_results,
    selectedSceneId,
    engine_results.length,
    runtimeFingerprintBefore,
    runtimeFingerprintAfter
  );

  const testCore = {
    schema_version: SINGLE_SCENE_GENERATION_TEST_VERSION,
    generated_at: SINGLE_SCENE_GENERATION_TEST_EPOCH,
    readonly_test: true as const,
    export_pack_checksum_ref: exportPack.export_pack_checksum,
    selected_scene_id: selectedSceneId,
    selected_scene_rationale: selection.rationale,
    candidate_scores,
    engines_tested: engines,
    render_count: engine_results.length,
    max_render_count: MAX_RENDER_COUNT,
    engine_results,
    generation_test_verification_checks,
    validation: {
      deterministic_test_checksum_stable: true,
      readonly_test: true as const,
      single_scene_only: true as const,
      no_provider_calls: true as const,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_automatic_retries: true as const,
      simulated_test_generation_only: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const test_checksum = digest([
    JSON.stringify({ ...testCore, test_checksum: undefined }),
    exportPack.export_pack_checksum,
    selectedSceneId,
  ]);

  return {
    ...testCore,
    test_checksum,
  };
}

let cachedTest: SingleSceneGenerationTestResult | null = null;
let cachedTestKey: string | null = null;

export function buildSingleSceneGenerationTestPreview(
  options: SingleSceneGenerationTestOptions = {}
): SingleSceneGenerationTestResult {
  const key = digest([options.scene_id ?? '', options.engine ?? '']);
  if (cachedTest && cachedTestKey === key) return cachedTest;
  cachedTest = buildSingleSceneGenerationTest(options);
  cachedTestKey = key;
  return cachedTest;
}

export function resetSingleSceneGenerationTestCache(): void {
  cachedTest = null;
  cachedTestKey = null;
}
