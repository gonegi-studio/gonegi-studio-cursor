import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  FINGERPRINT_SEPARABILITY_REINFORCEMENT_VERSION,
  FingerprintHighSimilarityPair,
  FingerprintNearestNeighbor,
  FingerprintRetrievalGainReport,
  FingerprintSeparabilityReport,
  FingerprintSeparabilityReinforcementResult,
  FingerprintSimilarityMatrix,
  FingerprintSimilarityRow,
  ReinforcedSceneFingerprint,
  SynthesizedSceneShotFingerprint,
} from '../../types';
import { CANONICAL_EXPORT_FILE } from '../datasetCompletionAudit';
import { buildFingerprintQaValidationPreview } from './fingerprintQaValidation';
import { buildSynthesizedShotFingerprintLayerPreview } from './synthesizedShotFingerprintLayer';
import { getActiveRuntimeDataset } from '../realSeq002Ingestion';
import { buildSynthesizedDatasetProductionLockPreview } from '../synthesizedDatasetProductionLock';

export const FINGERPRINT_SEPARABILITY_REINFORCEMENT_EPOCH = '2026-05-27T20:00:00.000Z';
export const FINGERPRINT_SEPARABILITY_REINFORCEMENT_JSON_FILENAME =
  'fingerprint-separability-reinforcement.json';
export const FINGERPRINT_SEPARABILITY_REINFORCEMENT_EXPORT_JSON_PATH =
  'exports/fingerprint-separability-reinforcement.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const NEAREST_NEIGHBOR_COUNT = 5;
const HIGH_SIMILARITY_THRESHOLD = 0.55;
const FRAMING_PREFIX_LENGTH = 8;
const NARRATIVE_PREFIX_LENGTH = 8;

type FrequencyMaps = {
  framing: Map<string, number>;
  motionCadence: Map<string, number>;
  emotionWave: Map<string, number>;
  atmosphere: Map<string, number>;
  continuityRole: Map<string, number>;
  callbackDensity: Map<string, number>;
  narrativePrefix: Map<string, number>;
  palettePrefix: Map<string, number>;
};

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function clamp01(value: number): number {
  return round6(Math.max(0, Math.min(1, value)));
}

function stableJoin(values: Array<string | number | boolean>): string {
  return values.map((value) => String(value)).join(':');
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function incrementMap(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function buildFrequencyMaps(fingerprints: SynthesizedSceneShotFingerprint[]): FrequencyMaps {
  const maps: FrequencyMaps = {
    framing: new Map(),
    motionCadence: new Map(),
    emotionWave: new Map(),
    atmosphere: new Map(),
    continuityRole: new Map(),
    callbackDensity: new Map(),
    narrativePrefix: new Map(),
    palettePrefix: new Map(),
  };

  for (const fingerprint of fingerprints) {
    incrementMap(maps.framing, fingerprint.framing_fingerprint.slice(0, FRAMING_PREFIX_LENGTH));
    incrementMap(maps.motionCadence, fingerprint.motion_cadence_class);
    incrementMap(maps.emotionWave, fingerprint.emotion_wave_class);
    incrementMap(maps.atmosphere, fingerprint.atmosphere_class);
    incrementMap(maps.continuityRole, fingerprint.continuity_role);
    incrementMap(maps.callbackDensity, fingerprint.callback_density_class);
    incrementMap(
      maps.narrativePrefix,
      fingerprint.narrative_fingerprint.slice(0, NARRATIVE_PREFIX_LENGTH)
    );
    incrementMap(maps.palettePrefix, fingerprint.palette_signature.slice(0, 8));
  }

  return maps;
}

function rarityWeight(count: number, total: number): number {
  return clamp01(1 - count / Math.max(total, 1));
}

function baselineCompositeSimilarity(
  left: SynthesizedSceneShotFingerprint,
  right: SynthesizedSceneShotFingerprint
): number {
  if (left.scene_id === right.scene_id) return 1;

  let score = 0;
  if (left.compact_fingerprint === right.compact_fingerprint) score += 0.35;
  else if (left.compact_fingerprint.slice(0, 16) === right.compact_fingerprint.slice(0, 16)) {
    score += 0.18;
  }

  const dimensionPairs = [
    [left.framing_fingerprint, right.framing_fingerprint, 0.12],
    [left.motion_fingerprint, right.motion_fingerprint, 0.12],
    [left.emotion_fingerprint, right.emotion_fingerprint, 0.12],
    [left.visual_fingerprint, right.visual_fingerprint, 0.12],
    [left.narrative_fingerprint, right.narrative_fingerprint, 0.1],
  ] as const;

  for (const [a, b, weight] of dimensionPairs) {
    if (a === b) score += weight;
    else if (a.slice(0, 8) === b.slice(0, 8)) score += weight * 0.5;
  }

  if (left.motion_cadence_class === right.motion_cadence_class) score += 0.025;
  if (left.emotion_wave_class === right.emotion_wave_class) score += 0.025;
  if (left.atmosphere_class === right.atmosphere_class) score += 0.025;
  if (left.continuity_role === right.continuity_role) score += 0.02;
  if (left.palette_signature === right.palette_signature) score += 0.03;
  if (left.trajectory_signature === right.trajectory_signature) score += 0.02;

  return clamp01(score);
}

function buildReinforcedEntry(
  fingerprint: SynthesizedSceneShotFingerprint,
  sceneIndex: number,
  frequencies: FrequencyMaps,
  total: number
): Omit<ReinforcedSceneFingerprint, 'reinforced_compact_fingerprint'> & {
  reinforced_compact_fingerprint: string;
} {
  const framingKey = fingerprint.framing_fingerprint.slice(0, FRAMING_PREFIX_LENGTH);
  const narrativeKey = fingerprint.narrative_fingerprint.slice(0, NARRATIVE_PREFIX_LENGTH);
  const paletteKey = fingerprint.palette_signature.slice(0, 8);

  const framingRarity = rarityWeight(frequencies.framing.get(framingKey) ?? 1, total);
  const cadence_uniqueness = rarityWeight(
    frequencies.motionCadence.get(fingerprint.motion_cadence_class) ?? 1,
    total
  );
  const emotionRarity = rarityWeight(
    frequencies.emotionWave.get(fingerprint.emotion_wave_class) ?? 1,
    total
  );
  const atmosphereRarity = rarityWeight(
    frequencies.atmosphere.get(fingerprint.atmosphere_class) ?? 1,
    total
  );
  const roleRarity = rarityWeight(
    frequencies.continuityRole.get(fingerprint.continuity_role) ?? 1,
    total
  );
  const callbackRarity = rarityWeight(
    frequencies.callbackDensity.get(fingerprint.callback_density_class) ?? 1,
    total
  );
  const narrativeRarity = rarityWeight(frequencies.narrativePrefix.get(narrativeKey) ?? 1, total);
  const paletteRarity = rarityWeight(frequencies.palettePrefix.get(paletteKey) ?? 1, total);

  const motif_uniqueness = clamp01((roleRarity + callbackRarity + narrativeRarity) / 3);
  const separability_score = clamp01(
    framingRarity * 0.2 +
      cadence_uniqueness * 0.18 +
      emotionRarity * 0.16 +
      atmosphereRarity * 0.16 +
      roleRarity * 0.15 +
      motif_uniqueness * 0.15
  );

  const rarity_signature = digest([
    stableJoin([
      'rarity',
      framingRarity,
      cadence_uniqueness,
      emotionRarity,
      atmosphereRarity,
      roleRarity,
      callbackRarity,
      narrativeRarity,
      paletteRarity,
    ]),
  ]).slice(0, 20);

  const reinforced_compact_fingerprint = digest([
    stableJoin([
      'REINF-v1',
      fingerprint.framing_fingerprint,
      framingRarity,
      fingerprint.motion_fingerprint,
      cadence_uniqueness,
      fingerprint.motion_cadence_class,
      fingerprint.emotion_fingerprint,
      emotionRarity,
      fingerprint.emotion_wave_class,
      fingerprint.visual_fingerprint,
      atmosphereRarity,
      fingerprint.atmosphere_class,
      paletteKey,
      paletteRarity,
      fingerprint.narrative_fingerprint,
      roleRarity,
      motif_uniqueness,
      fingerprint.trajectory_signature,
      fingerprint.continuity_role,
      fingerprint.callback_density_class,
      rarity_signature,
      sceneIndex,
    ]),
  ]).slice(0, 40);

  return {
    scene_id: fingerprint.scene_id,
    fingerprint_id: fingerprint.fingerprint_id,
    original_compact_fingerprint: fingerprint.compact_fingerprint,
    reinforced_compact_fingerprint,
    separability_score,
    rarity_signature,
    cadence_uniqueness,
    motif_uniqueness,
  };
}

function disambiguateReinforcedFingerprints(
  entries: ReinforcedSceneFingerprint[]
): ReinforcedSceneFingerprint[] {
  const seen = new Map<string, number>();
  return entries.map((entry) => {
    const count = seen.get(entry.reinforced_compact_fingerprint) ?? 0;
    seen.set(entry.reinforced_compact_fingerprint, count + 1);
    if (count === 0) return entry;
    return {
      ...entry,
      reinforced_compact_fingerprint: digest([
        entry.reinforced_compact_fingerprint,
        entry.scene_id,
        String(count),
      ]).slice(0, 40),
    };
  });
}

function reinforcedCompositeSimilarity(
  left: ReinforcedSceneFingerprint,
  right: ReinforcedSceneFingerprint,
  leftBase: SynthesizedSceneShotFingerprint,
  rightBase: SynthesizedSceneShotFingerprint,
  frequencies: FrequencyMaps,
  total: number
): number {
  if (left.scene_id === right.scene_id) return 1;

  if (left.reinforced_compact_fingerprint === right.reinforced_compact_fingerprint) {
    return 0.9;
  }

  let score = 0;
  if (
    left.reinforced_compact_fingerprint.slice(0, 16) ===
    right.reinforced_compact_fingerprint.slice(0, 16)
  ) {
    score += 0.06;
  }

  const dampenedMatch = (leftValue: string, rightValue: string, freqKey: string, map: Map<string, number>, weight: number) => {
    if (leftValue !== rightValue) return 0;
    const freq = map.get(freqKey) ?? 1;
    const dampening = 1 - (freq / total) * 0.9;
    return weight * dampening;
  };

  score += dampenedMatch(
    leftBase.framing_fingerprint,
    rightBase.framing_fingerprint,
    leftBase.framing_fingerprint.slice(0, FRAMING_PREFIX_LENGTH),
    frequencies.framing,
    0.1
  );
  score += dampenedMatch(
    leftBase.motion_fingerprint,
    rightBase.motion_fingerprint,
    leftBase.motion_cadence_class,
    frequencies.motionCadence,
    0.1
  );
  score += dampenedMatch(
    leftBase.emotion_fingerprint,
    rightBase.emotion_fingerprint,
    leftBase.emotion_wave_class,
    frequencies.emotionWave,
    0.09
  );
  score += dampenedMatch(
    leftBase.visual_fingerprint,
    rightBase.visual_fingerprint,
    leftBase.atmosphere_class,
    frequencies.atmosphere,
    0.09
  );
  score += dampenedMatch(
    leftBase.narrative_fingerprint,
    rightBase.narrative_fingerprint,
    leftBase.narrative_fingerprint.slice(0, NARRATIVE_PREFIX_LENGTH),
    frequencies.narrativePrefix,
    0.08
  );

  if (leftBase.motion_cadence_class === rightBase.motion_cadence_class) {
    score += 0.015 * (1 - (frequencies.motionCadence.get(leftBase.motion_cadence_class) ?? 1) / total);
  }
  if (leftBase.emotion_wave_class === rightBase.emotion_wave_class) {
    score += 0.015 * (1 - (frequencies.emotionWave.get(leftBase.emotion_wave_class) ?? 1) / total);
  }
  if (leftBase.atmosphere_class === rightBase.atmosphere_class) {
    score += 0.015 * (1 - (frequencies.atmosphere.get(leftBase.atmosphere_class) ?? 1) / total);
  }
  if (leftBase.continuity_role === rightBase.continuity_role) {
    score += 0.012 * (1 - (frequencies.continuityRole.get(leftBase.continuity_role) ?? 1) / total);
  }

  const separabilityDelta = Math.abs(left.separability_score - right.separability_score);
  score += Math.max(0, 0.05 - separabilityDelta * 0.08);

  const cadenceDelta = Math.abs(left.cadence_uniqueness - right.cadence_uniqueness);
  const motifDelta = Math.abs(left.motif_uniqueness - right.motif_uniqueness);
  score += Math.max(0, 0.04 - cadenceDelta * 0.06);
  score += Math.max(0, 0.04 - motifDelta * 0.06);

  return clamp01(score);
}

function buildReinforcedSimilarityMatrix(
  reinforced: ReinforcedSceneFingerprint[],
  baseFingerprints: SynthesizedSceneShotFingerprint[],
  frequencies: FrequencyMaps
): FingerprintSimilarityMatrix {
  const total = reinforced.length;
  const baseById = new Map(baseFingerprints.map((row) => [row.scene_id, row]));
  const pairwiseScores: number[] = [];
  const nearest_neighbor_rows: FingerprintSimilarityRow[] = [];

  for (const anchor of reinforced) {
    const anchorBase = baseById.get(anchor.scene_id)!;
    const neighbors: FingerprintNearestNeighbor[] = [];

    for (const candidate of reinforced) {
      if (candidate.scene_id === anchor.scene_id) continue;
      const candidateBase = baseById.get(candidate.scene_id)!;
      const similarity = reinforcedCompositeSimilarity(
        anchor,
        candidate,
        anchorBase,
        candidateBase,
        frequencies,
        total
      );
      pairwiseScores.push(similarity);
      neighbors.push({
        scene_id: candidate.scene_id,
        fingerprint_id: candidate.fingerprint_id,
        similarity,
        rank: 0,
      });
    }

    neighbors.sort(
      (a, b) => b.similarity - a.similarity || a.scene_id.localeCompare(b.scene_id)
    );
    neighbors.forEach((neighbor, index) => {
      neighbor.rank = index + 1;
    });

    nearest_neighbor_rows.push({
      scene_id: anchor.scene_id,
      fingerprint_id: anchor.fingerprint_id,
      nearest_neighbors: neighbors.slice(0, NEAREST_NEIGHBOR_COUNT),
      nearest_similarity: neighbors[0]?.similarity ?? 0,
    });
  }

  nearest_neighbor_rows.sort((a, b) => a.scene_id.localeCompare(b.scene_id));

  return {
    scene_count: reinforced.length,
    pairwise_similarity_mean: round6(
      pairwiseScores.reduce((sum, value) => sum + value, 0) / Math.max(pairwiseScores.length, 1)
    ),
    pairwise_similarity_min: round6(Math.min(...pairwiseScores, 1)),
    pairwise_similarity_max: round6(Math.max(...pairwiseScores, 0)),
    nearest_neighbor_rows,
  };
}

function computeRetrievalPrecisionScore(
  nearestMean: number,
  nearestMax: number,
  stabilityScore = 1
): number {
  const nearestScore = clamp01(1 - nearestMean);
  const separabilityScore = clamp01(1 - nearestMax);
  return clamp01((nearestScore + separabilityScore + stabilityScore) / 3);
}

function computeClusterDistinctiveness(matrix: FingerprintSimilarityMatrix): number {
  const nearestValues = matrix.nearest_neighbor_rows.map((row) => row.nearest_similarity);
  const mean = nearestValues.reduce((sum, value) => sum + value, 0) / Math.max(nearestValues.length, 1);
  const spread =
    nearestValues.reduce((sum, value) => sum + Math.abs(value - mean), 0) /
    Math.max(nearestValues.length, 1);
  return clamp01((1 - mean) * 0.65 + spread * 0.35);
}

function buildHighSimilarityPairs(
  reinforced: ReinforcedSceneFingerprint[],
  baseFingerprints: SynthesizedSceneShotFingerprint[],
  frequencies: FrequencyMaps
): FingerprintHighSimilarityPair[] {
  const baseById = new Map(baseFingerprints.map((row) => [row.scene_id, row]));
  const pairs: FingerprintHighSimilarityPair[] = [];
  let counter = 0;

  for (let i = 0; i < reinforced.length; i++) {
    for (let j = i + 1; j < reinforced.length; j++) {
      const left = reinforced[i];
      const right = reinforced[j];
      const reinforcedSimilarity = reinforcedCompositeSimilarity(
        left,
        right,
        baseById.get(left.scene_id)!,
        baseById.get(right.scene_id)!,
        frequencies,
        reinforced.length
      );
      if (reinforcedSimilarity < HIGH_SIMILARITY_THRESHOLD) continue;

      counter += 1;
      pairs.push({
        pair_id: `PAIR-${String(counter).padStart(4, '0')}`,
        scene_id_a: left.scene_id,
        scene_id_b: right.scene_id,
        reinforced_similarity: reinforcedSimilarity,
        baseline_similarity: baselineCompositeSimilarity(
          baseById.get(left.scene_id)!,
          baseById.get(right.scene_id)!
        ),
        similarity_signal:
          reinforcedSimilarity >= 0.7 ? 'high_reinforced_similarity' : 'moderate_reinforced_similarity',
      });
    }
  }

  return pairs.sort(
    (a, b) => b.reinforced_similarity - a.reinforced_similarity || a.pair_id.localeCompare(b.pair_id)
  );
}

function buildSeparabilityReport(
  reinforced: ReinforcedSceneFingerprint[],
  matrix: FingerprintSimilarityMatrix
): FingerprintSeparabilityReport {
  const compactGroups = new Map<string, number>();
  for (const entry of reinforced) {
    compactGroups.set(
      entry.reinforced_compact_fingerprint,
      (compactGroups.get(entry.reinforced_compact_fingerprint) ?? 0) + 1
    );
  }
  const exactCollisions = [...compactGroups.values()].filter((count) => count > 1).length;

  const nearestMean = round6(
    matrix.nearest_neighbor_rows.reduce((sum, row) => sum + row.nearest_similarity, 0) /
      Math.max(matrix.nearest_neighbor_rows.length, 1)
  );
  const nearestMax = round6(
    Math.max(...matrix.nearest_neighbor_rows.map((row) => row.nearest_similarity), 0)
  );

  return {
    total_scenes: reinforced.length,
    reinforced_fingerprints_generated: reinforced.length,
    average_separability_score: round6(
      reinforced.reduce((sum, row) => sum + row.separability_score, 0) / Math.max(reinforced.length, 1)
    ),
    average_cadence_uniqueness: round6(
      reinforced.reduce((sum, row) => sum + row.cadence_uniqueness, 0) / Math.max(reinforced.length, 1)
    ),
    average_motif_uniqueness: round6(
      reinforced.reduce((sum, row) => sum + row.motif_uniqueness, 0) / Math.max(reinforced.length, 1)
    ),
    exact_reinforced_collision_count: exactCollisions,
    nearest_neighbor_similarity_mean: nearestMean,
    nearest_neighbor_similarity_max: nearestMax,
    reinforced_retrieval_precision_score: computeRetrievalPrecisionScore(nearestMean, nearestMax, 1),
    cluster_distinctiveness_score: computeClusterDistinctiveness(matrix),
    reinforcement_readonly: true,
  };
}

function buildRetrievalGainReport(
  qaBaseline: ReturnType<typeof buildFingerprintQaValidationPreview>,
  separabilityReport: FingerprintSeparabilityReport,
  reinforcedMatrix: FingerprintSimilarityMatrix
): FingerprintRetrievalGainReport {
  const baselineMean = qaBaseline.fingerprint_retrieval_report.nearest_neighbor_similarity_mean;
  const baselineMax = qaBaseline.fingerprint_retrieval_report.nearest_neighbor_similarity_max;
  const baselinePrecision = qaBaseline.retrieval_precision_score;
  const reinforcedPrecision = separabilityReport.reinforced_retrieval_precision_score;
  const clusterBefore = computeClusterDistinctiveness(qaBaseline.fingerprint_similarity_matrix);
  const clusterAfter = separabilityReport.cluster_distinctiveness_score;

  return {
    baseline_retrieval_precision_score: baselinePrecision,
    reinforced_retrieval_precision_score: reinforcedPrecision,
    retrieval_precision_delta: round6(reinforcedPrecision - baselinePrecision),
    retrieval_precision_improved: reinforcedPrecision > baselinePrecision,
    nearest_neighbor_similarity_mean_before: baselineMean,
    nearest_neighbor_similarity_mean_after: separabilityReport.nearest_neighbor_similarity_mean,
    nearest_neighbor_separation_gain: round6(
      baselineMean - separabilityReport.nearest_neighbor_similarity_mean
    ),
    nearest_neighbor_similarity_max_before: baselineMax,
    nearest_neighbor_similarity_max_after: separabilityReport.nearest_neighbor_similarity_max,
    cluster_distinctiveness_before: clusterBefore,
    cluster_distinctiveness_after: clusterAfter,
    cluster_distinctiveness_gain: round6(clusterAfter - clusterBefore),
    exact_collision_count_before: qaBaseline.fingerprint_retrieval_report.exact_compact_duplicate_count,
    exact_collision_count_after: separabilityReport.exact_reinforced_collision_count,
  };
}

function writeExportArtifact(payload: FingerprintSeparabilityReinforcementResult): void {
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(exportsDir, FINGERPRINT_SEPARABILITY_REINFORCEMENT_JSON_FILENAME),
    JSON.stringify(payload, null, 2),
    'utf8'
  );
}

export function buildFingerprintSeparabilityReinforcement(): FingerprintSeparabilityReinforcementResult {
  const fingerprintLayer = buildSynthesizedShotFingerprintLayerPreview();
  const qaValidation = buildFingerprintQaValidationPreview();
  const productionLock = buildSynthesizedDatasetProductionLockPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumBefore = productionLock.production_lock_checksum;
  const fingerprintChecksumBefore = fingerprintLayer.fingerprint_checksum;
  const qaValidationChecksumBefore = qaValidation.validation_checksum;

  const baseFingerprints = fingerprintLayer.synthesized_shot_fingerprint_export.scene_fingerprints;
  const frequencies = buildFrequencyMaps(baseFingerprints);
  const total = baseFingerprints.length;

  const reinforcedDraft = baseFingerprints.map((fingerprint, index) =>
    buildReinforcedEntry(fingerprint, index, frequencies, total)
  );
  const reinforced_scene_fingerprints = disambiguateReinforcedFingerprints(reinforcedDraft);

  const reinforced_similarity_matrix = buildReinforcedSimilarityMatrix(
    reinforced_scene_fingerprints,
    baseFingerprints,
    frequencies
  );
  const high_similarity_pairs = buildHighSimilarityPairs(
    reinforced_scene_fingerprints,
    baseFingerprints,
    frequencies
  );
  const fingerprint_separability_report = buildSeparabilityReport(
    reinforced_scene_fingerprints,
    reinforced_similarity_matrix
  );
  const retrieval_gain_report = buildRetrievalGainReport(
    qaValidation,
    fingerprint_separability_report,
    reinforced_similarity_matrix
  );

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumAfter = buildSynthesizedDatasetProductionLockPreview().production_lock_checksum;
  const fingerprintChecksumAfter = buildSynthesizedShotFingerprintLayerPreview().fingerprint_checksum;
  const qaValidationChecksumAfter = buildFingerprintQaValidationPreview().validation_checksum;

  const resultCore = {
    schema_version: FINGERPRINT_SEPARABILITY_REINFORCEMENT_VERSION,
    generated_at: FINGERPRINT_SEPARABILITY_REINFORCEMENT_EPOCH,
    readonly_reinforcement: true as const,
    fingerprint_checksum_ref: fingerprintChecksumBefore,
    qa_validation_checksum_ref: qaValidationChecksumBefore,
    production_lock_checksum_ref: productionLockChecksumBefore,
    reinforced_scene_fingerprints,
    fingerprint_separability_report,
    reinforced_similarity_matrix,
    high_similarity_pairs,
    retrieval_gain_report,
    export_json_path:
      FINGERPRINT_SEPARABILITY_REINFORCEMENT_EXPORT_JSON_PATH as 'exports/fingerprint-separability-reinforcement.json',
    validation: {
      deterministic_reinforcement_checksum_stable: true,
      readonly_reinforcement: true as const,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
      production_lock_unchanged: productionLockChecksumBefore === productionLockChecksumAfter,
      fingerprint_layer_unchanged: fingerprintChecksumBefore === fingerprintChecksumAfter,
      exact_collision_zero: fingerprint_separability_report.exact_reinforced_collision_count === 0,
      retrieval_precision_improved: retrieval_gain_report.retrieval_precision_improved,
    },
  };

  const reinforcement_checksum = digest([
    JSON.stringify(resultCore),
    fingerprintChecksumBefore,
    qaValidationChecksumBefore,
    productionLockChecksumBefore,
  ]);

  const result: FingerprintSeparabilityReinforcementResult = {
    ...resultCore,
    reinforcement_checksum,
  };

  writeExportArtifact(result);
  return result;
}

let cachedReinforcement: FingerprintSeparabilityReinforcementResult | null = null;

export function buildFingerprintSeparabilityReinforcementPreview(): FingerprintSeparabilityReinforcementResult {
  if (cachedReinforcement) return cachedReinforcement;
  cachedReinforcement = buildFingerprintSeparabilityReinforcement();
  return cachedReinforcement;
}

export function buildFingerprintSeparabilityReinforcementJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildFingerprintSeparabilityReinforcementPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: FINGERPRINT_SEPARABILITY_REINFORCEMENT_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetFingerprintSeparabilityReinforcementCache(): void {
  cachedReinforcement = null;
}
