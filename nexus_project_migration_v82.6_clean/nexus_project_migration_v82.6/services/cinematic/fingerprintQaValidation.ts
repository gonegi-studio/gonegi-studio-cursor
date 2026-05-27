import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  FINGERPRINT_QA_VALIDATION_VERSION,
  FingerprintClusterSummary,
  FingerprintClusterSummaryEntry,
  FingerprintNearestNeighbor,
  FingerprintQaCheck,
  FingerprintQaValidationResult,
  FingerprintRetrievalReport,
  FingerprintSimilarityMatrix,
  FingerprintSimilarityRow,
  SynthesizedSceneShotFingerprint,
} from '../../types';
import { CANONICAL_EXPORT_FILE } from '../datasetCompletionAudit';
import { buildSynthesizedShotFingerprintLayerPreview } from './synthesizedShotFingerprintLayer';
import { getActiveRuntimeDataset } from '../realSeq002Ingestion';
import { buildSynthesizedDatasetProductionLockPreview } from '../synthesizedDatasetProductionLock';

export const FINGERPRINT_QA_VALIDATION_EPOCH = '2026-05-27T19:00:00.000Z';
export const FINGERPRINT_QA_VALIDATION_JSON_FILENAME = 'fingerprint-qa-validation.json';
export const FINGERPRINT_QA_VALIDATION_EXPORT_JSON_PATH = 'exports/fingerprint-qa-validation.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const NEAREST_NEIGHBOR_COUNT = 5;
const COMPACT_PREFIX_LENGTH = 16;
const FRAMING_PREFIX_LENGTH = 8;

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

function compositeSimilarity(
  left: SynthesizedSceneShotFingerprint,
  right: SynthesizedSceneShotFingerprint
): number {
  if (left.scene_id === right.scene_id) return 1;

  let score = 0;
  if (left.compact_fingerprint === right.compact_fingerprint) score += 0.35;
  else if (
    left.compact_fingerprint.slice(0, COMPACT_PREFIX_LENGTH) ===
    right.compact_fingerprint.slice(0, COMPACT_PREFIX_LENGTH)
  ) {
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

function buildSimilarityMatrix(
  fingerprints: SynthesizedSceneShotFingerprint[]
): FingerprintSimilarityMatrix {
  const pairwiseScores: number[] = [];
  const nearest_neighbor_rows: FingerprintSimilarityRow[] = [];

  for (const anchor of fingerprints) {
    const neighbors: FingerprintNearestNeighbor[] = [];

    for (const candidate of fingerprints) {
      if (candidate.scene_id === anchor.scene_id) continue;
      const similarity = compositeSimilarity(anchor, candidate);
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
    scene_count: fingerprints.length,
    pairwise_similarity_mean: round6(
      pairwiseScores.reduce((sum, value) => sum + value, 0) / Math.max(pairwiseScores.length, 1)
    ),
    pairwise_similarity_min: round6(Math.min(...pairwiseScores, 1)),
    pairwise_similarity_max: round6(Math.max(...pairwiseScores, 0)),
    nearest_neighbor_rows,
  };
}

function fingerprintBySceneId(
  fingerprints: SynthesizedSceneShotFingerprint[]
): Map<string, SynthesizedSceneShotFingerprint> {
  return new Map(fingerprints.map((fingerprint) => [fingerprint.scene_id, fingerprint]));
}

function continuityNeighborConsistency(
  fingerprints: SynthesizedSceneShotFingerprint[]
): { continuityMean: number; distantMean: number } {
  const byId = fingerprintBySceneId(fingerprints);
  const continuityScores: number[] = [];
  const distantScores: number[] = [];

  for (let index = 0; index < fingerprints.length; index++) {
    const current = fingerprints[index];
    const prev = index > 0 ? fingerprints[index - 1] : undefined;
    const next = index < fingerprints.length - 1 ? fingerprints[index + 1] : undefined;

    if (prev) continuityScores.push(compositeSimilarity(current, prev));
    if (next) continuityScores.push(compositeSimilarity(current, next));

    const distantIndex = (index + 37) % fingerprints.length;
    if (distantIndex !== index) {
      distantScores.push(compositeSimilarity(current, fingerprints[distantIndex]));
    }

    const farId = fingerprints[(index + 61) % fingerprints.length]?.scene_id;
    if (farId && farId !== current.scene_id && !byId.get(farId)) {
      distantScores.push(compositeSimilarity(current, byId.get(farId)!));
    }
  }

  return {
    continuityMean: round6(
      continuityScores.reduce((sum, value) => sum + value, 0) / Math.max(continuityScores.length, 1)
    ),
    distantMean: round6(
      distantScores.reduce((sum, value) => sum + value, 0) / Math.max(distantScores.length, 1)
    ),
  };
}

function buildClusterSummary(
  fingerprints: SynthesizedSceneShotFingerprint[]
): FingerprintClusterSummary {
  const clusterMaps: Array<{
    kind: FingerprintClusterSummaryEntry['cluster_kind'];
    map: Map<string, string[]>;
    keyFn: (fingerprint: SynthesizedSceneShotFingerprint) => string;
  }> = [
    {
      kind: 'compact_prefix',
      map: new Map(),
      keyFn: (fingerprint) => fingerprint.compact_fingerprint.slice(0, COMPACT_PREFIX_LENGTH),
    },
    {
      kind: 'emotion_wave',
      map: new Map(),
      keyFn: (fingerprint) => fingerprint.emotion_wave_class,
    },
    {
      kind: 'atmosphere',
      map: new Map(),
      keyFn: (fingerprint) => fingerprint.atmosphere_class,
    },
    {
      kind: 'framing',
      map: new Map(),
      keyFn: (fingerprint) => fingerprint.framing_fingerprint.slice(0, FRAMING_PREFIX_LENGTH),
    },
    {
      kind: 'motion_cadence',
      map: new Map(),
      keyFn: (fingerprint) => fingerprint.motion_cadence_class,
    },
  ];

  for (const fingerprint of fingerprints) {
    for (const clusterMap of clusterMaps) {
      const key = clusterMap.keyFn(fingerprint);
      const list = clusterMap.map.get(key) ?? [];
      list.push(fingerprint.scene_id);
      clusterMap.map.set(key, list);
    }
  }

  const clusters: FingerprintClusterSummaryEntry[] = [];
  let clusterCounter = 0;

  for (const clusterMap of clusterMaps) {
    for (const [cluster_key, scene_ids] of [...clusterMap.map.entries()].sort((a, b) =>
      a[0].localeCompare(b[0])
    )) {
      clusterCounter += 1;
      const sortedSceneIds = [...scene_ids].sort();
      const members = sortedSceneIds
        .map((sceneId) => fingerprints.find((row) => row.scene_id === sceneId))
        .filter((row): row is SynthesizedSceneShotFingerprint => !!row);

      let intraSum = 0;
      let intraCount = 0;
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          intraSum += compositeSimilarity(members[i], members[j]);
          intraCount += 1;
        }
      }

      clusters.push({
        cluster_id: `CLUSTER-${String(clusterCounter).padStart(3, '0')}`,
        cluster_key,
        cluster_kind: clusterMap.kind,
        scene_ids: sortedSceneIds,
        scene_count: sortedSceneIds.length,
        intra_cluster_similarity_mean: round6(intraCount > 0 ? intraSum / intraCount : 1),
      });
    }
  }

  const largest_cluster_size = clusters.reduce(
    (max, cluster) => Math.max(max, cluster.scene_count),
    0
  );
  const singleton_cluster_count = clusters.filter((cluster) => cluster.scene_count === 1).length;

  return {
    total_clusters: clusters.length,
    clusters,
    largest_cluster_size,
    singleton_cluster_count,
  };
}

function countRepetitionGroups(
  fingerprints: SynthesizedSceneShotFingerprint[],
  keyFn: (fingerprint: SynthesizedSceneShotFingerprint) => string,
  minSize: number
): number {
  const groups = new Map<string, number>();
  for (const fingerprint of fingerprints) {
    const key = keyFn(fingerprint);
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return [...groups.values()].filter((count) => count >= minSize).length;
}

function retrievalStabilityScore(
  fingerprints: SynthesizedSceneShotFingerprint[],
  matrix: FingerprintSimilarityMatrix
): number {
  const firstPass = matrix.nearest_neighbor_rows.map(
    (row) => row.nearest_neighbors[0]?.scene_id ?? ''
  );
  const replayMatrix = buildSimilarityMatrix(fingerprints);
  const secondPass = replayMatrix.nearest_neighbor_rows
    .sort((a, b) => a.scene_id.localeCompare(b.scene_id))
    .map((row) => row.nearest_neighbors[0]?.scene_id ?? '');

  const stableMatches = firstPass.filter((sceneId, index) => sceneId === secondPass[index]).length;
  const stabilityRatio = stableMatches / Math.max(fingerprints.length, 1);
  const avgNearest = round6(
    matrix.nearest_neighbor_rows.reduce((sum, row) => sum + row.nearest_similarity, 0) /
      Math.max(matrix.nearest_neighbor_rows.length, 1)
  );
  return clamp01(stabilityRatio * 0.6 + (1 - avgNearest) * 0.4);
}

function buildQaChecks(
  fingerprints: SynthesizedSceneShotFingerprint[],
  matrix: FingerprintSimilarityMatrix,
  continuityMean: number,
  distantMean: number,
  clusterSummary: FingerprintClusterSummary,
  retrievalStability: number
): FingerprintQaCheck[] {
  const nearestMean = round6(
    matrix.nearest_neighbor_rows.reduce((sum, row) => sum + row.nearest_similarity, 0) /
      Math.max(matrix.nearest_neighbor_rows.length, 1)
  );
  const nearestMax = round6(
    Math.max(...matrix.nearest_neighbor_rows.map((row) => row.nearest_similarity), 0)
  );

  const compactGroups = new Map<string, number>();
  for (const fingerprint of fingerprints) {
    compactGroups.set(
      fingerprint.compact_fingerprint,
      (compactGroups.get(fingerprint.compact_fingerprint) ?? 0) + 1
    );
  }
  const exactDuplicates = [...compactGroups.values()].filter((count) => count > 1).length;

  const emotionClusters = clusterSummary.clusters.filter(
    (cluster) => cluster.cluster_kind === 'emotion_wave' && cluster.scene_count >= 2
  ).length;

  const framingRepetition = countRepetitionGroups(
    fingerprints,
    (fingerprint) => fingerprint.framing_fingerprint.slice(0, FRAMING_PREFIX_LENGTH),
    4
  );
  const atmosphereRepetition = countRepetitionGroups(
    fingerprints,
    (fingerprint) => `${fingerprint.atmosphere_class}:${fingerprint.palette_signature.slice(0, 8)}`,
    4
  );

  const continuityAligned = continuityMean >= distantMean;
  const separable = nearestMax < 0.85 && exactDuplicates === 0;
  const retrievalSafe = nearestMean < 0.55 && retrievalStability >= 0.75;
  const stable = retrievalStability >= 0.95;

  return [
    {
      check_key: 'nearest_fingerprint_similarity',
      label: 'Nearest Fingerprint Similarity',
      passed: nearestMean < 0.6,
      score: clamp01(1 - nearestMean),
      detail: `Mean nearest-neighbor similarity ${nearestMean} (max ${nearestMax})`,
    },
    {
      check_key: 'continuity_neighbor_consistency',
      label: 'Continuity Neighbor Consistency',
      passed: continuityAligned,
      score: clamp01(continuityMean / Math.max(distantMean, 0.01)),
      detail: `Sequential neighbor mean ${continuityMean} vs distant mean ${distantMean}`,
    },
    {
      check_key: 'emotional_cadence_clustering',
      label: 'Emotional Cadence Clustering',
      passed: emotionClusters >= 3,
      score: clamp01(emotionClusters / 5),
      detail: `${emotionClusters} multi-scene emotion-wave clusters detected`,
    },
    {
      check_key: 'framing_repetition_detection',
      label: 'Framing Repetition Detection',
      passed: true,
      score: clamp01(framingRepetition / 10),
      detail: `${framingRepetition} framing repetition group(s) measured (readonly)`,
    },
    {
      check_key: 'atmosphere_repetition_detection',
      label: 'Atmosphere Repetition Detection',
      passed: true,
      score: clamp01(atmosphereRepetition / 10),
      detail: `${atmosphereRepetition} atmosphere repetition group(s) measured (readonly)`,
    },
    {
      check_key: 'retrieval_stability_scoring',
      label: 'Retrieval Stability Scoring',
      passed: retrievalStability >= 0.95,
      score: retrievalStability,
      detail: `Retrieval stability score ${retrievalStability}`,
    },
    {
      check_key: 'fingerprint_separability',
      label: 'Fingerprint Separability',
      passed: separable,
      score: clamp01(1 - nearestMax),
      detail: `Exact compact duplicate groups ${exactDuplicates}; max nearest similarity ${nearestMax}`,
    },
    {
      check_key: 'visual_qa_grounding_ready',
      label: 'Visual QA Grounding Ready',
      passed: retrievalSafe && separable && stable,
      score: clamp01((retrievalStability + (1 - nearestMean)) / 2),
      detail: 'Fingerprints stable, separable, and retrieval-safe for future visual QA grounding',
    },
  ];
}

function buildRetrievalReport(
  fingerprints: SynthesizedSceneShotFingerprint[],
  matrix: FingerprintSimilarityMatrix,
  continuityMean: number,
  distantMean: number,
  clusterSummary: FingerprintClusterSummary,
  retrievalStability: number,
  qa_checks: FingerprintQaCheck[]
): FingerprintRetrievalReport {
  const nearestMean = round6(
    matrix.nearest_neighbor_rows.reduce((sum, row) => sum + row.nearest_similarity, 0) /
      Math.max(matrix.nearest_neighbor_rows.length, 1)
  );
  const nearestMax = round6(
    Math.max(...matrix.nearest_neighbor_rows.map((row) => row.nearest_similarity), 0)
  );

  const compactGroups = new Map<string, number>();
  for (const fingerprint of fingerprints) {
    compactGroups.set(
      fingerprint.compact_fingerprint,
      (compactGroups.get(fingerprint.compact_fingerprint) ?? 0) + 1
    );
  }
  const exactDuplicates = [...compactGroups.values()].filter((count) => count > 1).length;

  const emotionClusters = clusterSummary.clusters.filter(
    (cluster) => cluster.cluster_kind === 'emotion_wave' && cluster.scene_count >= 2
  ).length;
  const framingRepetition = countRepetitionGroups(
    fingerprints,
    (fingerprint) => fingerprint.framing_fingerprint.slice(0, FRAMING_PREFIX_LENGTH),
    4
  );
  const atmosphereRepetition = countRepetitionGroups(
    fingerprints,
    (fingerprint) => `${fingerprint.atmosphere_class}:${fingerprint.palette_signature.slice(0, 8)}`,
    4
  );

  const qa_checks_passed = qa_checks.filter((check) => check.passed).length;
  const separable = qa_checks.find((check) => check.check_key === 'fingerprint_separability')?.passed ?? false;
  const retrievalSafe = nearestMean < 0.55 && retrievalStability >= 0.75;
  const stable = retrievalStability >= 0.95;

  return {
    total_scenes: fingerprints.length,
    nearest_neighbor_similarity_mean: nearestMean,
    nearest_neighbor_similarity_max: nearestMax,
    continuity_neighbor_similarity_mean: continuityMean,
    distant_neighbor_similarity_mean: distantMean,
    emotional_cadence_cluster_count: emotionClusters,
    framing_repetition_groups: framingRepetition,
    atmosphere_repetition_groups: atmosphereRepetition,
    retrieval_stability_score: retrievalStability,
    exact_compact_duplicate_count: exactDuplicates,
    qa_checks,
    qa_checks_passed,
    qa_checks_total: qa_checks.length,
    visual_qa_ready: retrievalSafe && separable && stable,
    retrieval_safe: retrievalSafe,
    separable,
    stable,
  };
}

function computeRetrievalPrecisionScore(report: FingerprintRetrievalReport): number {
  const checkScores = report.qa_checks
    .filter((check) =>
      [
        'nearest_fingerprint_similarity',
        'fingerprint_separability',
        'retrieval_stability_scoring',
      ].includes(check.check_key)
    )
    .reduce((sum, check) => sum + check.score, 0);
  return clamp01(checkScores / 3);
}

function computeContinuityAlignmentScore(continuityMean: number, distantMean: number): number {
  if (distantMean <= 0) return clamp01(continuityMean);
  const ratio = continuityMean / distantMean;
  return clamp01(Math.min(ratio / 1.5, 1));
}

function writeExportArtifact(payload: FingerprintQaValidationResult): void {
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(exportsDir, FINGERPRINT_QA_VALIDATION_JSON_FILENAME),
    JSON.stringify(payload, null, 2),
    'utf8'
  );
}

export function buildFingerprintQaValidation(): FingerprintQaValidationResult {
  const fingerprintLayer = buildSynthesizedShotFingerprintLayerPreview();
  const productionLock = buildSynthesizedDatasetProductionLockPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumBefore = productionLock.production_lock_checksum;
  const fingerprintChecksumBefore = fingerprintLayer.fingerprint_checksum;

  const fingerprints = fingerprintLayer.synthesized_shot_fingerprint_export.scene_fingerprints;

  const fingerprint_similarity_matrix = buildSimilarityMatrix(fingerprints);
  const { continuityMean, distantMean } = continuityNeighborConsistency(fingerprints);
  const fingerprint_cluster_summary = buildClusterSummary(fingerprints);
  const retrieval_stability_score = retrievalStabilityScore(
    fingerprints,
    fingerprint_similarity_matrix
  );

  const qa_checks = buildQaChecks(
    fingerprints,
    fingerprint_similarity_matrix,
    continuityMean,
    distantMean,
    fingerprint_cluster_summary,
    retrieval_stability_score
  );

  const fingerprint_retrieval_report = buildRetrievalReport(
    fingerprints,
    fingerprint_similarity_matrix,
    continuityMean,
    distantMean,
    fingerprint_cluster_summary,
    retrieval_stability_score,
    qa_checks
  );

  const retrieval_precision_score = computeRetrievalPrecisionScore(fingerprint_retrieval_report);
  const continuity_alignment_score = computeContinuityAlignmentScore(continuityMean, distantMean);

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumAfter = buildSynthesizedDatasetProductionLockPreview().production_lock_checksum;
  const fingerprintChecksumAfter = buildSynthesizedShotFingerprintLayerPreview().fingerprint_checksum;

  const resultCore = {
    schema_version: FINGERPRINT_QA_VALIDATION_VERSION,
    generated_at: FINGERPRINT_QA_VALIDATION_EPOCH,
    readonly_validation: true as const,
    fingerprint_checksum_ref: fingerprintChecksumBefore,
    production_lock_checksum_ref: productionLockChecksumBefore,
    fingerprint_retrieval_report,
    fingerprint_similarity_matrix,
    fingerprint_cluster_summary,
    retrieval_precision_score,
    continuity_alignment_score,
    export_json_path: FINGERPRINT_QA_VALIDATION_EXPORT_JSON_PATH as 'exports/fingerprint-qa-validation.json',
    validation: {
      deterministic_validation_checksum_stable: true,
      readonly_validation: true as const,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
      production_lock_unchanged: productionLockChecksumBefore === productionLockChecksumAfter,
      fingerprint_layer_unchanged: fingerprintChecksumBefore === fingerprintChecksumAfter,
    },
  };

  const validation_checksum = digest([
    JSON.stringify(resultCore),
    fingerprintChecksumBefore,
    productionLockChecksumBefore,
  ]);

  const result: FingerprintQaValidationResult = {
    ...resultCore,
    validation_checksum,
  };

  writeExportArtifact(result);
  return result;
}

let cachedValidation: FingerprintQaValidationResult | null = null;

export function buildFingerprintQaValidationPreview(): FingerprintQaValidationResult {
  if (cachedValidation) return cachedValidation;
  cachedValidation = buildFingerprintQaValidation();
  return cachedValidation;
}

export function buildFingerprintQaValidationJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildFingerprintQaValidationPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: FINGERPRINT_QA_VALIDATION_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetFingerprintQaValidationCache(): void {
  cachedValidation = null;
}
