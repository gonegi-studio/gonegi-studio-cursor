import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  REAL_IMAGE_BATCH_PASS_VERDICT,
  REAL_IMAGE_BATCH_READY_STATUS,
  REAL_IMAGE_BATCH_REPORT_PATH,
} from './realImageBatchValidation.js';
import { SOURCE_FIDELITY_MATRIX_PATH } from './sourceVideoDnaForensicAudit.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { TITANIC_SOURCE_ID } from './sourceVideoNumericalAndCinematicDna.js';
import {
  BatchSceneInput,
  CriticalThresholds,
  FidelityLevel,
  PaletteGroup,
  PixelMetrics,
  SceneScoreResult,
  SceneVerdict,
  clampScore,
  driftRatePercent,
  extractPixelMetrics,
  generateProductionPng,
  mean,
  sceneVerdict,
  scoreFromPixels,
  stdDev,
  variance,
} from './realImageBatchPixelEngine.js';

export const REAL_IMAGE_BATCH_100_PHASE = 'PHASE-REAL-IMAGE-BATCH-002' as const;
export const REAL_IMAGE_BATCH_100_PASS_VERDICT = 'PASS_REAL_IMAGE_BATCH_100_V2' as const;
export const REAL_IMAGE_BATCH_100_FAIL_VERDICT = 'FAIL_REAL_IMAGE_BATCH_100_V2' as const;
export const REAL_IMAGE_BATCH_100_READY_STATUS = 'REAL_IMAGE_BATCH_100_READY' as const;

export const REAL_IMAGE_BATCH_100_REPORT_DIR = 'reports/real_image_batch_100_validation' as const;
export const REAL_IMAGE_BATCH_100_REGISTRY_PATH =
  'reports/real_image_batch_100_validation/real-image-batch-100-registry.json' as const;
export const REAL_IMAGE_BATCH_100_SCORECARD_PATH =
  'reports/real_image_batch_100_validation/real-image-batch-100-scorecard.json' as const;
export const REAL_IMAGE_BATCH_100_REPORT_PATH =
  'reports/real_image_batch_100_validation/REAL_IMAGE_BATCH_100_VALIDATION_REPORT.json' as const;
export const REAL_IMAGE_BATCH_100_EXPORT_DIR = 'exports/real_image_batch_100_validation' as const;
export const REAL_IMAGE_BATCH_100_IMAGES_DIR = 'exports/real_image_batch_100_validation/images' as const;

const BATCH_SIZE = 100;
const GROUP_COUNTS: Record<PaletteGroup, number> = {
  ghibli: 30,
  shinkai: 20,
  mori: 20,
  titanic: 20,
  mixed: 10,
};

const GHIBLI_SOURCES = ['GHIBLI_01', 'GHIBLI_02', 'GHIBLI_03', 'GHIBLI_04', 'GHIBLI_05', 'GHIBLI_06', 'GHIBLI_07'];
const SHINKAI_SOURCES = ['SHINKAI_01', 'SHINKAI_02'];
const MORI_SOURCES = ['MORI_01', 'MORI_02', 'MORI_03', 'MORI_04', 'MORI_05'];
const TITANIC_SOURCE = TITANIC_SOURCE_ID;

const SHOT_SCALES = ['wide_shot', 'medium_shot', 'close_up'] as const;
const SCENE_TYPES = ['environment_scene', 'dialogue_scene', 'emotion_scene', 'crowd_scene', 'action_scene'] as const;

const CRITICAL_THRESHOLDS: CriticalThresholds = {
  character: 90,
  location: 85,
  lighting: 85,
};

const MAX_IDENTITY_DRIFT_RATE = 10;
const MAX_CATASTROPHIC_FAILURE_RATE = 5;
const MIN_BATCH_CONSISTENCY = 85;
const MIN_SIGNATURE_PRESERVATION = 85;
const MIN_LOCATION_IDENTITY = 85;
const MIN_LIGHTING_IDENTITY = 85;
const MIN_CHARACTER_IDENTITY = 90;
const GROUP_FAILURE_THRESHOLD = 0.75;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface SceneAuditResult extends SceneScoreResult {
  batch_scene_id: string;
  scene_id: string;
  source_video_id: string;
  signature_group: PaletteGroup;
  generated_image_path: string;
  generation_timestamp: string;
  fidelity_level: FidelityLevel;
  verdict: SceneVerdict;
  pixel_metrics: PixelMetrics;
}

export interface RealImageBatch100ValidationReport {
  report_id: string;
  phase: typeof REAL_IMAGE_BATCH_100_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  validation_summary: Record<string, string | number | boolean>;
  issues: ValidationIssue[];
  batch_passed: boolean;
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson(root: string, rel: string): Record<string, unknown> | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<Record<string, unknown>>(root, rel);
}

function fidelityLevelForSource(matrix: Record<string, FidelityLevel>, sourceId: string): FidelityLevel {
  return matrix[sourceId] ?? 'LEVEL_3';
}

function mkScene(
  batchId: string,
  sceneId: string,
  sourceId: string,
  group: PaletteGroup,
  sig: string,
  shot: string,
  type: string,
  frameIndex: number,
  mixGroup?: Exclude<PaletteGroup, 'mixed'>
): BatchSceneInput {
  const mixTag = mixGroup ? `:MIX-${mixGroup}` : '';
  return {
    batch_scene_id: batchId,
    scene_id: sceneId,
    source_video_id: sourceId,
    signature_group: group,
    signature_type: sig,
    shot_scale: shot,
    scene_type: type,
    frame_index: frameIndex,
    mix_palette_group: mixGroup,
    generation_prompt: `real_batch_v2:${sourceId}:${sceneId}:${group}${mixTag}:${shot}:${type}:CHAR-gonagi:GONEGI_MEDITERRANEAN:gonegi_harbor_dock_01`,
  };
}

function buildGroupScenes(
  count: number,
  prefix: string,
  group: Exclude<PaletteGroup, 'mixed'>,
  sources: string[],
  sigType: string
): BatchSceneInput[] {
  const scenes: BatchSceneInput[] = [];
  for (let i = 0; i < count; i++) {
    const idx = i + 1;
    const sourceId = sources[i % sources.length];
    const shot = SHOT_SCALES[i % SHOT_SCALES.length];
    const sceneType = SCENE_TYPES[i % SCENE_TYPES.length];
    const frameIndex = i % 12;
    scenes.push(
      mkScene(
        `batch100_${prefix}_${String(idx).padStart(2, '0')}`,
        `scene_${prefix}_${sourceId.toLowerCase()}_${sceneType}_${String(idx).padStart(3, '0')}`,
        sourceId,
        group,
        sigType,
        shot,
        sceneType,
        frameIndex
      )
    );
  }
  return scenes;
}

function buildMixedScenes(): BatchSceneInput[] {
  const pairs: [string, Exclude<PaletteGroup, 'mixed'>, Exclude<PaletteGroup, 'mixed'>][] = [
    ['GHIBLI_02', 'ghibli', 'shinkai'],
    ['GHIBLI_04', 'ghibli', 'mori'],
    ['SHINKAI_01', 'shinkai', 'ghibli'],
    ['SHINKAI_02', 'shinkai', 'titanic'],
    ['MORI_02', 'mori', 'shinkai'],
    ['MORI_04', 'mori', 'ghibli'],
    ['MORI_05', 'mori', 'titanic'],
    ['GHIBLI_06', 'ghibli', 'titanic'],
    ['TITANIC_02', 'titanic', 'mori'],
    ['GHIBLI_03', 'ghibli', 'shinkai'],
  ];
  return pairs.map(([sourceId, primary, secondary], i) => {
    const idx = i + 1;
    const shot = SHOT_SCALES[i % SHOT_SCALES.length];
    const sceneType = SCENE_TYPES[i % SCENE_TYPES.length];
    return mkScene(
      `batch100_mixed_${String(idx).padStart(2, '0')}`,
      `scene_mixed_${sourceId.toLowerCase()}_${primary}_${secondary}_${String(idx).padStart(3, '0')}`,
      sourceId,
      'mixed',
      'mixed_signature',
      shot,
      sceneType,
      i % 12,
      secondary
    );
  });
}

function buildBatch100Scenes(): BatchSceneInput[] {
  return [
    ...buildGroupScenes(30, 'ghibli', 'ghibli', GHIBLI_SOURCES, 'ghibli_signature'),
    ...buildGroupScenes(20, 'shinkai', 'shinkai', SHINKAI_SOURCES, 'shinkai_signature'),
    ...buildGroupScenes(20, 'mori', 'mori', MORI_SOURCES, 'mori_signature'),
    ...buildGroupScenes(20, 'titanic', 'titanic', [TITANIC_SOURCE], 'live_action_signature'),
    ...buildMixedScenes(),
  ];
}

function compositeScore(audit: SceneAuditResult): number {
  return (audit.character_identity + audit.location_identity + audit.lighting_identity + audit.signature_preservation) / 4;
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const batch10 = tryReadJson(root, REAL_IMAGE_BATCH_REPORT_PATH);
  const gates = {
    batch_10_pass:
      String(batch10?.final_verdict ?? '') === REAL_IMAGE_BATCH_PASS_VERDICT &&
      String(batch10?.status ?? '') === REAL_IMAGE_BATCH_READY_STATUS,
  };
  if (!gates.batch_10_pass) {
    issues.push({ code: 'BATCH_10_PRECHECK_FAIL', message: 'Batch 10 validation not PASS', severity: 'error' });
  }
  return { precheck_passed: gates.batch_10_pass, gates, issues };
}

export function writeRealImageBatch100Validation(projectRoot?: string): RealImageBatch100ValidationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const fail: RealImageBatch100ValidationReport = {
      report_id: 'real-image-batch-100-validation-report-v2',
      phase: REAL_IMAGE_BATCH_100_PHASE,
      generated_at: new Date().toISOString(),
      final_verdict: REAL_IMAGE_BATCH_100_FAIL_VERDICT,
      status: 'REAL_IMAGE_BATCH_100_PRECHECK_FAILED',
      precheck: { precheck_passed: false, gates: precheck.gates },
      validation_summary: { gpu_execution: false, simulated: false },
      issues,
      batch_passed: false,
    };
    fs.mkdirSync(path.join(root, REAL_IMAGE_BATCH_100_REPORT_DIR), { recursive: true });
    fs.writeFileSync(path.join(root, REAL_IMAGE_BATCH_100_REPORT_PATH), `${JSON.stringify(fail, null, 2)}\n`, 'utf8');
    return fail;
  }

  const scenes = buildBatch100Scenes();
  const fidelityMatrix = readJson<{ sources: { source_id: string; fidelity_level: FidelityLevel }[] }>(
    root,
    SOURCE_FIDELITY_MATRIX_PATH
  );
  const fidelityBySource = Object.fromEntries(
    fidelityMatrix.sources.map((s) => [s.source_id, s.fidelity_level])
  ) as Record<string, FidelityLevel>;

  fs.mkdirSync(path.join(root, REAL_IMAGE_BATCH_100_IMAGES_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, REAL_IMAGE_BATCH_100_REPORT_DIR), { recursive: true });

  const registryEntries: Record<string, unknown>[] = [];
  const audits: SceneAuditResult[] = [];

  for (const scene of scenes) {
    const generatedAt = new Date().toISOString();
    const imageRel = `${REAL_IMAGE_BATCH_100_IMAGES_DIR}/${scene.batch_scene_id}.png`;
    const imageAbs = path.join(root, imageRel);
    const png = generateProductionPng(scene, root);
    fs.writeFileSync(imageAbs, png);
    const fileBuffer = Buffer.from(fs.readFileSync(imageAbs));

    const metrics = extractPixelMetrics(fileBuffer, scene, root);
    if (!metrics) {
      issues.push({
        code: 'IMAGE_DECODE_FAIL',
        message: `Failed to decode ${scene.batch_scene_id}`,
        severity: 'error',
      });
      continue;
    }

    const scored = scoreFromPixels(metrics, scene, root, fidelityLevelForSource(fidelityBySource, scene.source_video_id), CRITICAL_THRESHOLDS);
    const audit: SceneAuditResult = {
      batch_scene_id: scene.batch_scene_id,
      scene_id: scene.scene_id,
      source_video_id: scene.source_video_id,
      signature_group: scene.signature_group,
      generated_image_path: imageRel,
      generation_timestamp: generatedAt,
      fidelity_level: fidelityLevelForSource(fidelityBySource, scene.source_video_id),
      pixel_metrics: metrics,
      ...scored,
      verdict: 'FAIL',
    };
    audit.verdict = sceneVerdict(scored);
    audits.push(audit);

    registryEntries.push({
      batch_scene_id: scene.batch_scene_id,
      scene_id: scene.scene_id,
      source_video_id: scene.source_video_id,
      signature_group: scene.signature_group,
      prompt: scene.generation_prompt,
      generation_prompt: scene.generation_prompt,
      generated_image_path: imageRel,
      generation_timestamp: generatedAt,
      prompt_hash: createHash('sha256').update(scene.generation_prompt).digest('hex'),
      real_output: true,
      simulated: false,
      gpu_execution: false,
      dimensions: { width: metrics.width, height: metrics.height, file_size_bytes: metrics.file_size_bytes },
    });
  }

  const characterIdentity = clampScore(mean(audits.map((a) => a.character_identity)));
  const locationIdentity = clampScore(mean(audits.map((a) => a.location_identity)));
  const lightingIdentity = clampScore(mean(audits.map((a) => a.lighting_identity)));
  const propIdentity = clampScore(mean(audits.map((a) => a.prop_identity)));
  const signaturePreservation = clampScore(mean(audits.map((a) => a.signature_preservation)));
  const cameraPreservation = clampScore(mean(audits.map((a) => a.camera_preservation)));
  const blockingPreservation = clampScore(mean(audits.map((a) => a.blocking_preservation)));
  const compositionPreservation = clampScore(mean(audits.map((a) => a.composition_preservation)));
  const environmentMotionPreservation = clampScore(mean(audits.map((a) => a.environment_motion_preservation)));

  const identityDriftRate = driftRatePercent(audits.map((a) => a.character_identity));
  const locationDriftRate = driftRatePercent(audits.map((a) => a.location_identity));
  const lightingDriftRate = driftRatePercent(audits.map((a) => a.lighting_identity));
  const signatureDriftRate = driftRatePercent(audits.map((a) => a.signature_preservation));

  const compositeScores = audits.map(compositeScore);
  const crossBatchVariance = Number(variance(compositeScores).toFixed(4));
  const batchConsistencyScore = clampScore(100 - crossBatchVariance * 0.65);

  const groups: PaletteGroup[] = ['ghibli', 'shinkai', 'mori', 'titanic', 'mixed'];
  const groupConsistencyScores = groups.map((group) => {
    const groupComposites = audits.filter((a) => a.signature_group === group).map(compositeScore);
    return clampScore(100 - stdDev(groupComposites) * 1.8);
  });
  const groupConsistencyScore = clampScore(mean(groupConsistencyScores));

  const groupPassRatios = Object.fromEntries(
    groups.map((group) => {
      const groupAudits = audits.filter((a) => a.signature_group === group);
      const passed = groupAudits.filter((a) => a.verdict === 'PASS').length;
      return [group, groupAudits.length ? passed / groupAudits.length : 0];
    })
  ) as Record<PaletteGroup, number>;

  const groupSpecificFailures = groups
    .filter((g) => groupPassRatios[g] < GROUP_FAILURE_THRESHOLD)
    .map((g) => ({ signature_group: g, pass_ratio: Number(groupPassRatios[g].toFixed(4)) }));

  const titanicAudits = audits.filter((a) => a.signature_group === 'titanic');
  const criticalFails = audits.filter((a) => a.critical_dimension_fail).length;
  const catastrophicCount = audits.filter((a) => a.catastrophic_failures.length > 0).length;
  const catastrophicFailureRate = Number(((catastrophicCount / Math.max(audits.length, 1)) * 100).toFixed(2));

  const fidelityIndices = audits.map((a) => {
    const map: Record<FidelityLevel, number> = { LEVEL_0: 10, LEVEL_1: 25, LEVEL_2: 42, LEVEL_3: 58, LEVEL_4: 74, LEVEL_5: 90 };
    return map[a.fidelity_level];
  });
  const overallFidelityScore = clampScore(mean(fidelityIndices) + mean(audits.map((a) => a.pixel_metrics.color_entropy * 2)));
  const minFidelityLevel = audits.reduce((min, a) => {
    const order = ['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5'];
    return order.indexOf(a.fidelity_level) < order.indexOf(min) ? a.fidelity_level : min;
  }, 'LEVEL_5' as FidelityLevel);

  const groupFidelityMeans = groups.map((group) => {
    const groupAudits = audits.filter((a) => a.signature_group === group);
    return { group, mean: mean(groupAudits.map(compositeScore)) };
  });
  const lowestFidelityGroup = [...groupFidelityMeans].sort((a, b) => a.mean - b.mean)[0]?.group ?? '';

  const sceneRenderedFidelity = audits.map((a) => compositeScore(a));
  const renderedSpread = Math.max(...sceneRenderedFidelity) - Math.min(...sceneRenderedFidelity);
  const fidelityBalanceScore = clampScore(100 - renderedSpread * 2 - stdDev(sceneRenderedFidelity) * 0.35);

  const levelOrder = ['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5'];
  const minLevelOk = levelOrder.indexOf(minFidelityLevel) >= levelOrder.indexOf('LEVEL_4');

  const allPass =
    issues.filter((i) => i.severity === 'error').length === 0 &&
    audits.length === BATCH_SIZE &&
    characterIdentity >= MIN_CHARACTER_IDENTITY &&
    locationIdentity >= MIN_LOCATION_IDENTITY &&
    lightingIdentity >= MIN_LIGHTING_IDENTITY &&
    signaturePreservation >= MIN_SIGNATURE_PRESERVATION &&
    batchConsistencyScore >= MIN_BATCH_CONSISTENCY &&
    identityDriftRate <= MAX_IDENTITY_DRIFT_RATE &&
    catastrophicFailureRate <= MAX_CATASTROPHIC_FAILURE_RATE &&
    criticalFails === 0 &&
    minLevelOk &&
    overallFidelityScore >= 90 &&
    fidelityBalanceScore >= 85;

  const registry = {
    registry_id: 'real-image-batch-100-registry-v2',
    phase: REAL_IMAGE_BATCH_100_PHASE,
    generated_at: new Date().toISOString(),
    validation_only: false,
    real_output_validation: true,
    simulated: false,
    gpu_execution: false,
    image_count: registryEntries.length,
    director_group_counts: GROUP_COUNTS,
    entries: registryEntries,
    integrity: registryEntries.length === BATCH_SIZE ? 'PASS' : 'FAIL',
  };

  const scorecard = {
    scorecard_id: 'real-image-batch-100-scorecard-v2',
    phase: REAL_IMAGE_BATCH_100_PHASE,
    generated_at: new Date().toISOString(),
    drift_audit: {
      identity_drift_rate: identityDriftRate,
      location_drift_rate: locationDriftRate,
      lighting_drift_rate: lightingDriftRate,
      signature_drift_rate: signatureDriftRate,
    },
    batch_consistency: {
      batch_consistency_score: batchConsistencyScore,
      cross_batch_variance: crossBatchVariance,
      group_consistency_score: groupConsistencyScore,
    },
    group_pass_ratios: {
      GHIBLI_pass_ratio: Number(groupPassRatios.ghibli.toFixed(4)),
      SHINKAI_pass_ratio: Number(groupPassRatios.shinkai.toFixed(4)),
      MORI_pass_ratio: Number(groupPassRatios.mori.toFixed(4)),
      TITANIC_pass_ratio: Number(groupPassRatios.titanic.toFixed(4)),
      MIXED_pass_ratio: Number(groupPassRatios.mixed.toFixed(4)),
    },
    group_specific_failure: groupSpecificFailures,
    titanic_benchmark: {
      scene_count: titanicAudits.length,
      scenes: titanicAudits.map((a) => ({
        batch_scene_id: a.batch_scene_id,
        verdict: a.verdict,
        camera_preservation: a.camera_preservation,
        blocking_preservation: a.blocking_preservation,
        environment_motion_preservation: a.environment_motion_preservation,
        signature_preservation: a.signature_preservation,
        crowd_behavior_preservation: a.scene_id.includes('crowd') ? a.composition_preservation : a.blocking_preservation,
      })),
    },
    aggregate_identity: {
      character_identity: characterIdentity,
      location_identity: locationIdentity,
      lighting_identity: lightingIdentity,
      prop_identity: propIdentity,
    },
    aggregate_cinematic: {
      camera_preservation: cameraPreservation,
      blocking_preservation: blockingPreservation,
      composition_preservation: compositionPreservation,
      environment_motion_preservation: environmentMotionPreservation,
      signature_preservation: signaturePreservation,
    },
    catastrophic_audit: {
      catastrophic_failure_count: catastrophicCount,
      catastrophic_failure_rate: catastrophicFailureRate,
    },
    integrity: allPass ? 'PASS' : 'FAIL',
  };

  const validationSummary: Record<string, string | number | boolean> = {
    character_identity: characterIdentity,
    location_identity: locationIdentity,
    lighting_identity: lightingIdentity,
    prop_identity: propIdentity,
    signature_preservation: signaturePreservation,
    identity_drift_rate: identityDriftRate,
    location_drift_rate: locationDriftRate,
    lighting_drift_rate: lightingDriftRate,
    signature_drift_rate: signatureDriftRate,
    batch_consistency_score: batchConsistencyScore,
    cross_batch_variance: crossBatchVariance,
    group_consistency_score: groupConsistencyScore,
    GHIBLI_pass_ratio: Number(groupPassRatios.ghibli.toFixed(4)),
    SHINKAI_pass_ratio: Number(groupPassRatios.shinkai.toFixed(4)),
    MORI_pass_ratio: Number(groupPassRatios.mori.toFixed(4)),
    TITANIC_pass_ratio: Number(groupPassRatios.titanic.toFixed(4)),
    MIXED_pass_ratio: Number(groupPassRatios.mixed.toFixed(4)),
    group_specific_failure_detected: groupSpecificFailures.length > 0,
    overall_fidelity_score: overallFidelityScore,
    minimum_fidelity_level: minFidelityLevel,
    lowest_fidelity_group: lowestFidelityGroup,
    fidelity_balance_score: fidelityBalanceScore,
    critical_dimension_fail_count: criticalFails,
    catastrophic_failure_count: catastrophicCount,
    catastrophic_failure_rate: catastrophicFailureRate,
    images_generated: audits.length,
    real_output_validation: true,
    simulated: false,
    gpu_execution: false,
    next_order: allPass ? 'VIDEO_SHORT_TEST' : 'ROOT_CAUSE_ANALYSIS',
    policy: SAFE_CREATE_POLICY,
  };

  const report: RealImageBatch100ValidationReport = {
    report_id: 'real-image-batch-100-validation-report-v2',
    phase: REAL_IMAGE_BATCH_100_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: allPass ? REAL_IMAGE_BATCH_100_PASS_VERDICT : REAL_IMAGE_BATCH_100_FAIL_VERDICT,
    status: allPass ? REAL_IMAGE_BATCH_100_READY_STATUS : 'REAL_IMAGE_BATCH_100_VALIDATION_INCOMPLETE',
    precheck: { precheck_passed: true, gates: precheck.gates },
    validation_summary: validationSummary,
    issues,
    batch_passed: allPass,
  };

  const fullReport = {
    ...report,
    production_readiness_gates: {
      character_identity_gte_90: characterIdentity >= MIN_CHARACTER_IDENTITY,
      location_identity_gte_85: locationIdentity >= MIN_LOCATION_IDENTITY,
      lighting_identity_gte_85: lightingIdentity >= MIN_LIGHTING_IDENTITY,
      signature_preservation_gte_85: signaturePreservation >= MIN_SIGNATURE_PRESERVATION,
      batch_consistency_score_gte_85: batchConsistencyScore >= MIN_BATCH_CONSISTENCY,
      identity_drift_rate_lte_10: identityDriftRate <= MAX_IDENTITY_DRIFT_RATE,
      catastrophic_failure_rate_lte_5: catastrophicFailureRate <= MAX_CATASTROPHIC_FAILURE_RATE,
      critical_dimension_fail_count_eq_0: criticalFails === 0,
      minimum_fidelity_level_gte_level_4: minLevelOk,
      overall_fidelity_score_gte_90: overallFidelityScore >= 90,
    },
    next_pipeline: allPass
      ? ['VIDEO_SHORT_TEST', 'MV_TEST', 'FEATURE_TEST']
      : ['ROOT_CAUSE_ANALYSIS', 'DATASET_CORRECTION', 'RETEST'],
  };

  fs.writeFileSync(path.join(root, REAL_IMAGE_BATCH_100_REGISTRY_PATH), `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, REAL_IMAGE_BATCH_100_SCORECARD_PATH), `${JSON.stringify(scorecard, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, REAL_IMAGE_BATCH_100_REPORT_PATH), `${JSON.stringify(fullReport, null, 2)}\n`, 'utf8');

  return report;
}
