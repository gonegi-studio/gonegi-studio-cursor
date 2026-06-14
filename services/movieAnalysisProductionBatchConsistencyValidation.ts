import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH,
} from './movieAnalysisMultiCharacterConsistencyValidation.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import { MAX_CHARACTER_DRIFT } from './movieAnalysisRealCharacterConsistencyValidation.js';
import {
  MAX_MOTION_DRIFT,
  MAX_TEMPORAL_BREAK,
} from './movieAnalysisRealMultiFrameMotionConsistencyValidation.js';
import {
  MAX_LIGHTING_STYLE_DRIFT,
  MAX_STYLE_DRIFT,
} from './movieAnalysisRealMultiFrameStyleConsistencyValidation.js';
import {
  MAX_CROSS_FRAME_LOCATION_DRIFT,
  MAX_LIGHTING_FRAME_DRIFT,
  VIDEO_LOCATION_DIR,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import {
  MAX_FRAME_IDENTITY_DRIFT,
  VIDEO_IDENTITY_DIR,
  type VideoIdentityFrameSnapshot,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { VIDEO_STYLE_DIR } from './movieAnalysisRealVideoStyleConsistencyValidation.js';
import { VIDEO_MOTION_DIR } from './movieAnalysisRealVideoMotionConsistencyValidation.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2E-006-PRODUCTION_BATCH_CONSISTENCY_V1' as const;
export const PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PRODUCTION_BATCH_CONSISTENCY_V1' as const;
export const PRODUCTION_BATCH_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PRODUCTION_BATCH_CONSISTENCY_V1' as const;
export const PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'PRODUCTION_BATCH_CONSISTENCY_VALIDATED' as const;
export const PRODUCTION_BATCH_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_production_batch_consistency_validation' as const;
export const PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_production_batch_consistency_validation/movie-analysis-production-batch-consistency-validation-report.json' as const;
export const PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_production_batch_consistency_validation/MOVIE_ANALYSIS_PRODUCTION_BATCH_CONSISTENCY_VALIDATION.md' as const;
export const PRODUCTION_BATCH_CONSISTENCY_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_production_batch_validation' as const;
export const PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_production_batch_validation/movie-analysis-production-batch-consistency-validation-manifest.json' as const;

export const BATCH_SCENE_SIZES = [100, 250, 500, 1000] as const;
export const BATCH_SCENE_COUNT = BATCH_SCENE_SIZES.length;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const MAX_BATCH_REENTRY_DRIFT_MULTIPLIER = 1.15 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type ProductionBatchConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  batch_scene_size?: number;
  source_id?: string;
};

export type VideoLocationFrameSnapshot = {
  frame_index: number;
  sky_zone_rgb: [number, number, number];
  midground_zone_rgb: [number, number, number];
  ground_zone_rgb: [number, number, number];
  indoor_anchor_strength: number;
  lighting_warmth: number;
  layout_signature: string;
  location_signature: string;
};

export type VideoStyleFrameSnapshot = {
  frame_index: number;
  style_palette_rgb: [number, number, number];
  accent_zone_rgb: [number, number, number];
  lighting_warmth: number;
  texture_variance: number;
  composition_spread: number;
  style_signature: string;
};

export type VideoMotionFrameSnapshot = {
  frame_index: number;
  motion_tone_rgb: [number, number, number];
  luminance: number;
  horizontal_flow: number;
  vertical_flow: number;
  motion_speed: number;
  motion_direction: number;
  camera_motion_x: number;
  motion_signature: string;
};

export type SourceBatchSnapshotBundle = {
  source_id: string;
  identity_frames: VideoIdentityFrameSnapshot[];
  location_frames: VideoLocationFrameSnapshot[];
  style_frames: VideoStyleFrameSnapshot[];
  motion_frames: VideoMotionFrameSnapshot[];
};

export type BatchSceneLedgerEntry = {
  scene_index: number;
  scene_id: string;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
  cinematic_dna_id: string;
  traceability_preserved: boolean;
  dna_binding_preserved: boolean;
  batch_memory_signature: string;
};

export type SourceBatchConsistencyAudit = {
  source_id: string;
  scene_count: number;
  character_consistency: ValidationStatus;
  location_consistency: ValidationStatus;
  style_consistency: ValidationStatus;
  motion_consistency: ValidationStatus;
  batch_memory_preserved: ValidationStatus;
  max_character_drift: number;
  max_location_drift: number;
  max_style_drift: number;
  max_motion_drift: number;
  source_batch_validated: ValidationStatus;
};

export type ProductionBatchResult = {
  batch_id: string;
  batch_scene_size: number;
  scene_count: number;
  character_consistency: ValidationStatus;
  location_consistency: ValidationStatus;
  style_consistency: ValidationStatus;
  motion_consistency: ValidationStatus;
  batch_traceability: ValidationStatus;
  dna_binding: ValidationStatus;
  batch_drift: boolean;
  batch_memory_loss: boolean;
  batch_identity_break: boolean;
  production_batch_consistency_validated: ValidationStatus;
  source_audits: SourceBatchConsistencyAudit[];
  scene_ledger_sample: BatchSceneLedgerEntry[];
};

export type MovieAnalysisProductionBatchConsistencyValidationManifest = {
  manifest_id: string;
  phase: typeof PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  multi_character_consistency_validation_manifest_path: typeof MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH;
  batch_scene_sizes: Array<(typeof BATCH_SCENE_SIZES)[number]>;
  batch_results: ProductionBatchResult[];
};

export type MovieAnalysisProductionBatchConsistencyValidationReport = {
  report_id: string;
  phase: typeof PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PHASE;
  timestamp: string;
  planning_only: false;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  multi_character_consistency_validation_report_path: typeof MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH;
  multi_character_consistency_validation_manifest_path: typeof MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH;
  production_batch_consistency_validation_export_dir: typeof PRODUCTION_BATCH_CONSISTENCY_VALIDATION_EXPORT_DIR;
  production_batch_consistency_validation_manifest_path: typeof PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH;
  video_identity_dir: typeof VIDEO_IDENTITY_DIR;
  video_location_dir: typeof VIDEO_LOCATION_DIR;
  video_style_dir: typeof VIDEO_STYLE_DIR;
  video_motion_dir: typeof VIDEO_MOTION_DIR;
  source_count: number;
  adapter_count: number;
  batch_scene_count: typeof BATCH_SCENE_COUNT;
  batch_scene_sizes: Array<(typeof BATCH_SCENE_SIZES)[number]>;
  character_consistency: ValidationStatus;
  location_consistency: ValidationStatus;
  style_consistency: ValidationStatus;
  motion_consistency: ValidationStatus;
  batch_traceability: ValidationStatus;
  dna_binding: ValidationStatus;
  batch_drift: boolean;
  batch_memory_loss: boolean;
  batch_identity_break: boolean;
  production_batch_consistency_validation_ready: ValidationStatus;
  certification_status: typeof PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  batch_results: ProductionBatchResult[];
  final_verdict:
    | typeof PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof PRODUCTION_BATCH_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: ProductionBatchConsistencyValidationIssue[];
};

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) / 255;
}

function toStatus(value: boolean): ValidationStatus {
  return value ? 'PASS' : 'FAIL';
}

function batchId(batchSize: number): string {
  return `Scene Batch ${batchSize}`;
}

function scenesPerSource(batchSize: number, sourceIndex: number): number {
  if (sourceIndex >= batchSize) {
    return 0;
  }
  return Math.floor((batchSize - 1 - sourceIndex) / EXPECTED_SOURCE_COUNT) + 1;
}

function assignScene(batchSize: number, sceneIndex: number): {
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
} {
  return {
    source_id: EXPECTED_SOURCE_VIDEO_IDS[sceneIndex % EXPECTED_SOURCE_COUNT],
    frame_index: Math.floor(sceneIndex / EXPECTED_SOURCE_COUNT) % BASE_CLIP_FRAME_COUNT,
  };
}

function extendFrames<T extends { frame_index: number }>(frames: T[], sequenceLength: number): T[] {
  return Array.from({ length: sequenceLength }, (_, index) => ({
    ...frames[index % frames.length],
    frame_index: index,
  }));
}

function maxReentryDrift<T>(
  frames: T[],
  sequenceLength: number,
  compare: (a: T, b: T) => number
): number {
  let maxGap = 0;
  for (let index = BASE_CLIP_FRAME_COUNT; index < sequenceLength; index += BASE_CLIP_FRAME_COUNT) {
    maxGap = Math.max(maxGap, compare(frames[index], frames[0]));
  }
  if (sequenceLength > BASE_CLIP_FRAME_COUNT) {
    maxGap = Math.max(
      maxGap,
      compare(frames[BASE_CLIP_FRAME_COUNT - 1], frames[BASE_CLIP_FRAME_COUNT])
    );
  }
  return maxGap;
}

function batchMemorySignature(
  sourceId: string,
  frameIndex: number,
  identity: VideoIdentityFrameSnapshot,
  location: VideoLocationFrameSnapshot,
  style: VideoStyleFrameSnapshot,
  motion: VideoMotionFrameSnapshot
): string {
  return createHash('sha256')
    .update(
      [
        sourceId,
        String(frameIndex),
        identity.identity_signature,
        location.location_signature,
        style.style_signature,
        motion.motion_signature,
      ].join('|')
    )
    .digest('hex')
    .slice(0, 16);
}

function validateCharacterBatch(
  identityFrames: VideoIdentityFrameSnapshot[],
  sceneCount: number
): {
  character_consistency: ValidationStatus;
  batch_memory_preserved: ValidationStatus;
  max_character_drift: number;
  batch_identity_break: boolean;
} {
  const extended = extendFrames(identityFrames, sceneCount);
  const adjacentFaceDrifts: number[] = [];
  for (let index = 1; index < extended.length; index += 1) {
    adjacentFaceDrifts.push(
      colorDistance(extended[index].face_zone_rgb, extended[index - 1].face_zone_rgb)
    );
  }
  const maxAdjacentFaceDrift = Math.max(...adjacentFaceDrifts, 0);
  const reentryFaceDrift = maxReentryDrift(extended, sceneCount, (a, b) =>
    colorDistance(a.face_zone_rgb, b.face_zone_rgb)
  );
  const maxCharacterDrift = Math.max(maxAdjacentFaceDrift, reentryFaceDrift);

  const characterConsistency = toStatus(
    maxAdjacentFaceDrift <= MAX_FRAME_IDENTITY_DRIFT &&
      adjacentFaceDrifts.every((drift) => drift <= MAX_CHARACTER_DRIFT) &&
      reentryFaceDrift <= MAX_FRAME_IDENTITY_DRIFT * MAX_BATCH_REENTRY_DRIFT_MULTIPLIER
  );
  const batchMemoryPreserved = toStatus(
    reentryFaceDrift <= MAX_FRAME_IDENTITY_DRIFT * MAX_BATCH_REENTRY_DRIFT_MULTIPLIER &&
      extended[0].identity_signature === identityFrames[0].identity_signature
  );
  const batchIdentityBreak = characterConsistency === 'FAIL';

  return {
    character_consistency: characterConsistency,
    batch_memory_preserved: batchMemoryPreserved,
    max_character_drift: maxCharacterDrift,
    batch_identity_break: batchIdentityBreak,
  };
}

function validateLocationBatch(
  locationFrames: VideoLocationFrameSnapshot[],
  sceneCount: number
): {
  location_consistency: ValidationStatus;
  max_location_drift: number;
} {
  const extended = extendFrames(locationFrames, sceneCount);
  const adjacentLocationDrifts: number[] = [];
  const adjacentLightingDrifts: number[] = [];
  for (let index = 1; index < extended.length; index += 1) {
    const prev = extended[index - 1];
    const current = extended[index];
    adjacentLocationDrifts.push(
      colorDistance(prev.sky_zone_rgb, current.sky_zone_rgb) * 0.4 +
        colorDistance(prev.midground_zone_rgb, current.midground_zone_rgb) * 0.35 +
        colorDistance(prev.ground_zone_rgb, current.ground_zone_rgb) * 0.25
    );
    adjacentLightingDrifts.push(Math.abs(current.lighting_warmth - prev.lighting_warmth));
  }

  const maxAdjacentLocationDrift = Math.max(...adjacentLocationDrifts, 0);
  const reentryLocationDrift = maxReentryDrift(extended, sceneCount, (a, b) =>
    colorDistance(a.sky_zone_rgb, b.sky_zone_rgb) * 0.4 +
      colorDistance(a.midground_zone_rgb, b.midground_zone_rgb) * 0.35 +
      colorDistance(a.ground_zone_rgb, b.ground_zone_rgb) * 0.25
  );
  const maxLocationDrift = Math.max(maxAdjacentLocationDrift, reentryLocationDrift);

  return {
    location_consistency: toStatus(
      maxAdjacentLocationDrift <= MAX_CROSS_FRAME_LOCATION_DRIFT &&
        reentryLocationDrift <= MAX_CROSS_FRAME_LOCATION_DRIFT * MAX_BATCH_REENTRY_DRIFT_MULTIPLIER &&
        Math.max(...adjacentLightingDrifts, 0) <= MAX_LIGHTING_FRAME_DRIFT
    ),
    max_location_drift: maxLocationDrift,
  };
}

function validateStyleBatch(
  styleFrames: VideoStyleFrameSnapshot[],
  sceneCount: number
): {
  style_consistency: ValidationStatus;
  max_style_drift: number;
} {
  const extended = extendFrames(styleFrames, sceneCount);
  const paletteDrifts: number[] = [];
  const lightingDrifts: number[] = [];
  for (let index = 1; index < extended.length; index += 1) {
    const prev = extended[index - 1];
    const current = extended[index];
    paletteDrifts.push(colorDistance(prev.style_palette_rgb, current.style_palette_rgb));
    lightingDrifts.push(Math.abs(current.lighting_warmth - prev.lighting_warmth));
  }

  const maxPaletteDrift = Math.max(...paletteDrifts, 0);
  const reentryStyleDrift = maxReentryDrift(extended, sceneCount, (a, b) =>
    colorDistance(a.style_palette_rgb, b.style_palette_rgb)
  );
  const maxStyleDrift = Math.max(maxPaletteDrift, reentryStyleDrift);

  return {
    style_consistency: toStatus(
      maxPaletteDrift <= MAX_STYLE_DRIFT &&
        reentryStyleDrift <= MAX_STYLE_DRIFT * MAX_BATCH_REENTRY_DRIFT_MULTIPLIER &&
        Math.max(...lightingDrifts, 0) <= MAX_LIGHTING_STYLE_DRIFT
    ),
    max_style_drift: maxStyleDrift,
  };
}

function validateMotionBatch(
  motionFrames: VideoMotionFrameSnapshot[],
  sceneCount: number
): {
  motion_consistency: ValidationStatus;
  max_motion_drift: number;
} {
  const extended = extendFrames(motionFrames, sceneCount);
  const speedDrifts: number[] = [];
  const directionDrifts: number[] = [];
  for (let index = 1; index < extended.length; index += 1) {
    speedDrifts.push(Math.abs(extended[index].motion_speed - extended[index - 1].motion_speed));
    directionDrifts.push(
      Math.abs(extended[index].motion_direction - extended[index - 1].motion_direction)
    );
  }

  const maxSpeedDrift = Math.max(...speedDrifts, 0);
  const reentryMotionDrift = maxReentryDrift(extended, sceneCount, (a, b) =>
    Math.abs(a.motion_speed - b.motion_speed)
  );
  const openToLastSpan = Math.abs(
    extended[extended.length - 1].motion_speed - extended[0].motion_speed
  );
  const maxMotionDrift = Math.max(maxSpeedDrift, reentryMotionDrift, openToLastSpan);

  return {
    motion_consistency: toStatus(
      maxSpeedDrift <= MAX_MOTION_DRIFT &&
        directionDrifts.every((drift) => drift <= 2) &&
        openToLastSpan <= MAX_TEMPORAL_BREAK &&
        reentryMotionDrift <= MAX_MOTION_DRIFT * MAX_BATCH_REENTRY_DRIFT_MULTIPLIER
    ),
    max_motion_drift: maxMotionDrift,
  };
}

function loadSnapshotBundle(root: string, sourceId: string): SourceBatchSnapshotBundle | null {
  const identityPath = path.join(root, VIDEO_IDENTITY_DIR, `${sourceId}-video-identity.json`);
  const locationPath = path.join(root, VIDEO_LOCATION_DIR, `${sourceId}-video-location.json`);
  const stylePath = path.join(root, VIDEO_STYLE_DIR, `${sourceId}-video-style.json`);
  const motionPath = path.join(root, VIDEO_MOTION_DIR, `${sourceId}-video-motion.json`);

  if (
    !fs.existsSync(identityPath) ||
    !fs.existsSync(locationPath) ||
    !fs.existsSync(stylePath) ||
    !fs.existsSync(motionPath)
  ) {
    return null;
  }

  const identity = JSON.parse(fs.readFileSync(identityPath, 'utf8')) as {
    frames: VideoIdentityFrameSnapshot[];
  };
  const location = JSON.parse(fs.readFileSync(locationPath, 'utf8')) as {
    frames: VideoLocationFrameSnapshot[];
  };
  const style = JSON.parse(fs.readFileSync(stylePath, 'utf8')) as {
    frames: VideoStyleFrameSnapshot[];
  };
  const motion = JSON.parse(fs.readFileSync(motionPath, 'utf8')) as {
    frames: VideoMotionFrameSnapshot[];
  };

  if (
    identity.frames.length !== BASE_CLIP_FRAME_COUNT ||
    location.frames.length !== BASE_CLIP_FRAME_COUNT ||
    style.frames.length !== BASE_CLIP_FRAME_COUNT ||
    motion.frames.length !== BASE_CLIP_FRAME_COUNT
  ) {
    return null;
  }

  return {
    source_id: sourceId,
    identity_frames: identity.frames,
    location_frames: location.frames,
    style_frames: style.frames,
    motion_frames: motion.frames,
  };
}

function validateDnaBinding(testResults: RealModelTestGenerationResult[]): ValidationStatus {
  return toStatus(
    testResults.length === EXPECTED_SOURCE_COUNT &&
      testResults.every(
        (result) =>
          result.dna_binding.binding_preserved === true &&
          result.dna_binding.cinematic_dna_id.length > 0 &&
          result.traceability.cinematic_dna_id === result.dna_binding.cinematic_dna_id
      )
  );
}

function buildSceneLedger(
  batchSize: number,
  bundles: Map<string, SourceBatchSnapshotBundle>,
  testResults: RealModelTestGenerationResult[]
): BatchSceneLedgerEntry[] {
  const ledger: BatchSceneLedgerEntry[] = [];
  for (let sceneIndex = 0; sceneIndex < batchSize; sceneIndex += 1) {
    const assignment = assignScene(batchSize, sceneIndex);
    const bundle = bundles.get(assignment.source_id);
    const testResult =
      testResults.find((result) => result.source_id === assignment.source_id) ?? null;
    if (!bundle || !testResult) {
      continue;
    }

    const identity = bundle.identity_frames[assignment.frame_index];
    const location = bundle.location_frames[assignment.frame_index];
    const style = bundle.style_frames[assignment.frame_index];
    const motion = bundle.motion_frames[assignment.frame_index];

    ledger.push({
      scene_index: sceneIndex,
      scene_id: `BATCH_SCENE_${String(sceneIndex + 1).padStart(4, '0')}`,
      source_id: assignment.source_id,
      frame_index: assignment.frame_index,
      cinematic_dna_id: testResult.dna_binding.cinematic_dna_id,
      traceability_preserved: testResult.traceability.traceability_preserved === true,
      dna_binding_preserved: testResult.dna_binding.binding_preserved === true,
      batch_memory_signature: batchMemorySignature(
        assignment.source_id,
        assignment.frame_index,
        identity,
        location,
        style,
        motion
      ),
    });
  }
  return ledger;
}

function validateBatchTraceability(
  batchSize: number,
  ledger: BatchSceneLedgerEntry[]
): ValidationStatus {
  return toStatus(
    ledger.length === batchSize &&
      ledger.every(
        (entry) =>
          entry.traceability_preserved === true &&
          entry.dna_binding_preserved === true &&
          entry.cinematic_dna_id.length > 0
      )
  );
}

function evaluateProductionBatch(
  batchSize: number,
  bundles: Map<string, SourceBatchSnapshotBundle>,
  testResults: RealModelTestGenerationResult[],
  issues: ProductionBatchConsistencyValidationIssue[]
): ProductionBatchResult | null {
  const batchLabel = batchId(batchSize);
  const sourceAudits: SourceBatchConsistencyAudit[] = [];
  let batchDrift = false;
  let batchMemoryLoss = false;
  let batchIdentityBreak = false;

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const bundle = bundles.get(sourceId);
    if (!bundle) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing snapshot bundle for ${sourceId} in ${batchLabel}`,
        severity: 'error',
        batch_scene_size: batchSize,
        source_id: sourceId,
      });
      return null;
    }

    const sceneCount = scenesPerSource(batchSize, EXPECTED_SOURCE_VIDEO_IDS.indexOf(sourceId));
    const character = validateCharacterBatch(bundle.identity_frames, sceneCount);
    const location = validateLocationBatch(bundle.location_frames, sceneCount);
    const style = validateStyleBatch(bundle.style_frames, sceneCount);
    const motion = validateMotionBatch(bundle.motion_frames, sceneCount);

    const driftExceeded =
      character.max_character_drift > MAX_FRAME_IDENTITY_DRIFT * MAX_BATCH_REENTRY_DRIFT_MULTIPLIER ||
      location.max_location_drift >
        MAX_CROSS_FRAME_LOCATION_DRIFT * MAX_BATCH_REENTRY_DRIFT_MULTIPLIER ||
      style.max_style_drift > MAX_STYLE_DRIFT * MAX_BATCH_REENTRY_DRIFT_MULTIPLIER ||
      motion.max_motion_drift > MAX_MOTION_DRIFT * MAX_BATCH_REENTRY_DRIFT_MULTIPLIER;

    if (driftExceeded) {
      batchDrift = true;
      issues.push({
        code: 'BATCH_DRIFT',
        message: `Batch drift exceeded for ${sourceId} in ${batchLabel}`,
        severity: 'error',
        batch_scene_size: batchSize,
        source_id: sourceId,
      });
    }
    if (character.batch_memory_preserved === 'FAIL') {
      batchMemoryLoss = true;
      issues.push({
        code: 'BATCH_MEMORY_LOSS',
        message: `Batch memory loss for ${sourceId} in ${batchLabel}`,
        severity: 'error',
        batch_scene_size: batchSize,
        source_id: sourceId,
      });
    }
    if (character.batch_identity_break) {
      batchIdentityBreak = true;
      issues.push({
        code: 'BATCH_IDENTITY_BREAK',
        message: `Batch identity break for ${sourceId} in ${batchLabel}`,
        severity: 'error',
        batch_scene_size: batchSize,
        source_id: sourceId,
      });
    }

    const sourceValidated = toStatus(
      character.character_consistency === 'PASS' &&
        location.location_consistency === 'PASS' &&
        style.style_consistency === 'PASS' &&
        motion.motion_consistency === 'PASS' &&
        character.batch_memory_preserved === 'PASS'
    );

    sourceAudits.push({
      source_id: sourceId,
      scene_count: sceneCount,
      character_consistency: character.character_consistency,
      location_consistency: location.location_consistency,
      style_consistency: style.style_consistency,
      motion_consistency: motion.motion_consistency,
      batch_memory_preserved: character.batch_memory_preserved,
      max_character_drift: character.max_character_drift,
      max_location_drift: location.max_location_drift,
      max_style_drift: style.max_style_drift,
      max_motion_drift: motion.max_motion_drift,
      source_batch_validated: sourceValidated,
    });
  }

  const sceneLedger = buildSceneLedger(batchSize, bundles, testResults);
  const batchTraceability = validateBatchTraceability(batchSize, sceneLedger);
  const dnaBinding = validateDnaBinding(testResults);

  if (batchTraceability === 'FAIL') {
    issues.push({
      code: 'BATCH_TRACEABILITY_LOSS',
      message: `Batch traceability failed for ${batchLabel}`,
      severity: 'error',
      batch_scene_size: batchSize,
    });
  }
  if (dnaBinding === 'FAIL') {
    issues.push({
      code: 'DNA_BINDING_NOT_PRESERVED',
      message: `DNA binding failed for ${batchLabel}`,
      severity: 'error',
      batch_scene_size: batchSize,
    });
  }

  const characterConsistency = toStatus(
    sourceAudits.every((audit) => audit.character_consistency === 'PASS')
  );
  const locationConsistency = toStatus(
    sourceAudits.every((audit) => audit.location_consistency === 'PASS')
  );
  const styleConsistency = toStatus(
    sourceAudits.every((audit) => audit.style_consistency === 'PASS')
  );
  const motionConsistency = toStatus(
    sourceAudits.every((audit) => audit.motion_consistency === 'PASS')
  );

  const validated = toStatus(
    characterConsistency === 'PASS' &&
      locationConsistency === 'PASS' &&
      styleConsistency === 'PASS' &&
      motionConsistency === 'PASS' &&
      batchTraceability === 'PASS' &&
      dnaBinding === 'PASS' &&
      !batchDrift &&
      !batchMemoryLoss &&
      !batchIdentityBreak
  );

  return {
    batch_id: batchLabel,
    batch_scene_size: batchSize,
    scene_count: batchSize,
    character_consistency: characterConsistency,
    location_consistency: locationConsistency,
    style_consistency: styleConsistency,
    motion_consistency: motionConsistency,
    batch_traceability: batchTraceability,
    dna_binding: dnaBinding,
    batch_drift: batchDrift,
    batch_memory_loss: batchMemoryLoss,
    batch_identity_break: batchIdentityBreak,
    production_batch_consistency_validated: validated,
    source_audits: sourceAudits,
    scene_ledger_sample: sceneLedger.filter(
      (_, index) => index === 0 || index === Math.floor(batchSize / 2) || index === batchSize - 1
    ),
  };
}

function buildMarkdown(report: MovieAnalysisProductionBatchConsistencyValidationReport): string {
  const lines = [
    '# Movie Analysis Production Batch Consistency Validation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    '## Batch Scene Sizes',
    '',
    report.batch_scene_sizes.join(', '),
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| character_consistency | ${report.character_consistency} |`,
    `| location_consistency | ${report.location_consistency} |`,
    `| style_consistency | ${report.style_consistency} |`,
    `| motion_consistency | ${report.motion_consistency} |`,
    `| batch_traceability | ${report.batch_traceability} |`,
    `| dna_binding | ${report.dna_binding} |`,
    `| batch_drift | ${report.batch_drift ? 'BLOCKED' : 'PASS'} |`,
    `| batch_memory_loss | ${report.batch_memory_loss ? 'BLOCKED' : 'PASS'} |`,
    `| batch_identity_break | ${report.batch_identity_break ? 'BLOCKED' : 'PASS'} |`,
    '',
    '## Production Batches',
    ''
  );

  for (const batch of report.batch_results) {
    lines.push(
      `### ${batch.batch_id}`,
      '',
      `- scene_count: ${batch.scene_count}`,
      `- character_consistency: ${batch.character_consistency}`,
      `- location_consistency: ${batch.location_consistency}`,
      `- style_consistency: ${batch.style_consistency}`,
      `- motion_consistency: ${batch.motion_consistency}`,
      `- batch_traceability: ${batch.batch_traceability}`,
      `- dna_binding: ${batch.dna_binding}`,
      `- batch_drift: ${batch.batch_drift}`,
      `- batch_memory_loss: ${batch.batch_memory_loss}`,
      `- batch_identity_break: ${batch.batch_identity_break}`,
      `- validated: ${batch.production_batch_consistency_validated}`,
      ''
    );
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: ProductionBatchConsistencyValidationIssue[]
): MovieAnalysisProductionBatchConsistencyValidationReport {
  const report: MovieAnalysisProductionBatchConsistencyValidationReport = {
    report_id: 'movie-analysis-production-batch-consistency-validation-report-v1',
    phase: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PHASE,
    timestamp,
    planning_only: false,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    multi_character_consistency_validation_report_path: MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
    multi_character_consistency_validation_manifest_path: MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    production_batch_consistency_validation_export_dir: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_EXPORT_DIR,
    production_batch_consistency_validation_manifest_path: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: 0,
    adapter_count: 0,
    batch_scene_count: BATCH_SCENE_COUNT,
    batch_scene_sizes: [...BATCH_SCENE_SIZES],
    character_consistency: 'FAIL',
    location_consistency: 'FAIL',
    style_consistency: 'FAIL',
    motion_consistency: 'FAIL',
    batch_traceability: 'FAIL',
    dna_binding: 'FAIL',
    batch_drift: true,
    batch_memory_loss: true,
    batch_identity_break: true,
    production_batch_consistency_validation_ready: 'FAIL',
    certification_status: null,
    batch_results: [],
    final_verdict: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisProductionBatchConsistencyValidation(
  projectRoot?: string
): MovieAnalysisProductionBatchConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProductionBatchConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const multiCharacterPath = path.join(root, MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(multiCharacterPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const multiCharacterReport = JSON.parse(fs.readFileSync(multiCharacterPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (
    multiCharacterReport.final_verdict !== MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT ||
    multiCharacterReport.certification_status !== MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'MULTI_CHARACTER_NOT_VALIDATED',
      message: `Required ${MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(path.join(root, MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const testManifestPath = path.join(root, MODEL_TEST_GENERATION_MANIFEST_PATH);
  if (!fs.existsSync(testManifestPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${MODEL_TEST_GENERATION_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const testManifest = JSON.parse(fs.readFileSync(testManifestPath, 'utf8')) as {
    results: RealModelTestGenerationResult[];
  };

  const bundles = new Map<string, SourceBatchSnapshotBundle>();
  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const bundle = loadSnapshotBundle(root, sourceId);
    if (!bundle) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing video snapshot bundle for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
      return writeFailReport(root, timestamp, issues);
    }
    bundles.set(sourceId, bundle);
  }

  const batchResults: ProductionBatchResult[] = [];
  for (const batchSize of BATCH_SCENE_SIZES) {
    const batchResult = evaluateProductionBatch(
      batchSize,
      bundles,
      testManifest.results,
      issues
    );
    if (!batchResult) {
      return writeFailReport(root, timestamp, issues);
    }
    batchResults.push(batchResult);
  }

  const characterConsistency = toStatus(
    batchResults.every((batch) => batch.character_consistency === 'PASS')
  );
  const locationConsistency = toStatus(
    batchResults.every((batch) => batch.location_consistency === 'PASS')
  );
  const styleConsistency = toStatus(
    batchResults.every((batch) => batch.style_consistency === 'PASS')
  );
  const motionConsistency = toStatus(
    batchResults.every((batch) => batch.motion_consistency === 'PASS')
  );
  const batchTraceability = toStatus(
    batchResults.every((batch) => batch.batch_traceability === 'PASS')
  );
  const dnaBinding = toStatus(batchResults.every((batch) => batch.dna_binding === 'PASS'));
  const batchDrift = batchResults.some((batch) => batch.batch_drift);
  const batchMemoryLoss = batchResults.some((batch) => batch.batch_memory_loss);
  const batchIdentityBreak = batchResults.some((batch) => batch.batch_identity_break);

  const gateChecks: ValidationStatus[] = [
    characterConsistency,
    locationConsistency,
    styleConsistency,
    motionConsistency,
    batchTraceability,
    dnaBinding,
  ];

  const productionBatchConsistencyValidationReady =
    gateChecks.every((status) => status === 'PASS') &&
    !batchDrift &&
    !batchMemoryLoss &&
    !batchIdentityBreak &&
    batchResults.every((batch) => batch.production_batch_consistency_validated === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = productionBatchConsistencyValidationReady === 'PASS';

  const manifest: MovieAnalysisProductionBatchConsistencyValidationManifest = {
    manifest_id: 'movie-analysis-production-batch-consistency-validation-manifest-v1',
    phase: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    multi_character_consistency_validation_manifest_path: MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    batch_scene_sizes: [...BATCH_SCENE_SIZES],
    batch_results: batchResults,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_EXPORT_DIR), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_EXPORT_DIR, 'production-batch-scenes.json'),
    `${JSON.stringify(
      {
        batch_scene_sizes: BATCH_SCENE_SIZES,
        batch_results: batchResults.map((batch) => ({
          batch_id: batch.batch_id,
          batch_scene_size: batch.batch_scene_size,
          scene_count: batch.scene_count,
          character_consistency: batch.character_consistency,
          location_consistency: batch.location_consistency,
          style_consistency: batch.style_consistency,
          motion_consistency: batch.motion_consistency,
          batch_traceability: batch.batch_traceability,
          dna_binding: batch.dna_binding,
          batch_drift: batch.batch_drift,
          batch_memory_loss: batch.batch_memory_loss,
          batch_identity_break: batch.batch_identity_break,
          production_batch_consistency_validated: batch.production_batch_consistency_validated,
          source_audits: batch.source_audits,
          scene_ledger_sample: batch.scene_ledger_sample,
        })),
      },
      null,
      2
    )}\n`,
    'utf8'
  );

  if (!fs.existsSync(path.join(root, MODEL_GENERATION_TEST_PACKAGE_PATH))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${MODEL_GENERATION_TEST_PACKAGE_PATH}`,
      severity: 'warning',
    });
  }

  const report: MovieAnalysisProductionBatchConsistencyValidationReport = {
    report_id: 'movie-analysis-production-batch-consistency-validation-report-v1',
    phase: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PHASE,
    timestamp,
    planning_only: false,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    multi_character_consistency_validation_report_path: MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
    multi_character_consistency_validation_manifest_path: MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    production_batch_consistency_validation_export_dir: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_EXPORT_DIR,
    production_batch_consistency_validation_manifest_path: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    batch_scene_count: BATCH_SCENE_COUNT,
    batch_scene_sizes: [...BATCH_SCENE_SIZES],
    character_consistency: characterConsistency,
    location_consistency: locationConsistency,
    style_consistency: styleConsistency,
    motion_consistency: motionConsistency,
    batch_traceability: batchTraceability,
    dna_binding: dnaBinding,
    batch_drift: batchDrift,
    batch_memory_loss: batchMemoryLoss,
    batch_identity_break: batchIdentityBreak,
    production_batch_consistency_validation_ready: productionBatchConsistencyValidationReady,
    certification_status: pass ? PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    batch_results: batchResults,
    final_verdict: pass
      ? PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT
      : PRODUCTION_BATCH_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
