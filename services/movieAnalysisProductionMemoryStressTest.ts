import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH,
} from './movieAnalysisProductionBatchConsistencyValidation.js';
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

export const PRODUCTION_MEMORY_STRESS_TEST_PHASE =
  'PHASE-LEVEL2E-007-PRODUCTION_MEMORY_STRESS_TEST_V1' as const;
export const PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PRODUCTION_MEMORY_STRESS_TEST_V1' as const;
export const PRODUCTION_MEMORY_STRESS_TEST_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PRODUCTION_MEMORY_STRESS_TEST_V1' as const;
export const PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE =
  'PRODUCTION_MEMORY_STRESS_TEST_VALIDATED' as const;
export const PRODUCTION_MEMORY_STRESS_TEST_DIR =
  'reports/movie_analysis_production_memory_stress_test' as const;
export const PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH =
  'reports/movie_analysis_production_memory_stress_test/movie-analysis-production-memory-stress-test-report.json' as const;
export const PRODUCTION_MEMORY_STRESS_TEST_MD_PATH =
  'reports/movie_analysis_production_memory_stress_test/MOVIE_ANALYSIS_PRODUCTION_MEMORY_STRESS_TEST.md' as const;
export const PRODUCTION_MEMORY_STRESS_TEST_EXPORT_DIR =
  'exports/movie_analysis_production_memory_stress_test' as const;
export const PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH =
  'exports/movie_analysis_production_memory_stress_test/movie-analysis-production-memory-stress-test-manifest.json' as const;

export const STRESS_TEST_SCALES = [5000, 10000, 50000] as const;
export const STRESS_TEST_SCALE_COUNT = STRESS_TEST_SCALES.length;
export const CROSS_BATCH_UNIT = 1000 as const;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const MAX_STRESS_REENTRY_BASE_MULTIPLIER = 1.15 as const;
export const MAX_COLLAPSE_MULTIPLIER = 2 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type ProductionMemoryStressTestIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  stress_scale?: number;
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

export type SourceMemorySnapshotBundle = {
  source_id: string;
  identity_frames: VideoIdentityFrameSnapshot[];
  location_frames: VideoLocationFrameSnapshot[];
  style_frames: VideoStyleFrameSnapshot[];
  motion_frames: VideoMotionFrameSnapshot[];
};

export type CrossBatchTraceEntry = {
  scene_index: number;
  virtual_batch_index: number;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
  cinematic_dna_id: string;
  traceability_preserved: boolean;
  memory_signature: string;
};

export type SourceMemoryStressAudit = {
  source_id: string;
  scene_count: number;
  identity_memory_decay: number;
  location_memory_decay: number;
  style_memory_decay: number;
  motion_memory_decay: number;
  reentry_after_long_gap: ValidationStatus;
  identity_memory_validated: ValidationStatus;
  location_memory_validated: ValidationStatus;
  style_memory_validated: ValidationStatus;
  motion_memory_validated: ValidationStatus;
  source_memory_stress_validated: ValidationStatus;
};

export type MemoryStressScaleResult = {
  stress_scale_id: string;
  production_scale: number;
  scene_count: number;
  identity_memory_decay: ValidationStatus;
  location_memory_decay: ValidationStatus;
  style_memory_decay: ValidationStatus;
  motion_memory_decay: ValidationStatus;
  reentry_after_long_gap: ValidationStatus;
  cross_batch_traceability: ValidationStatus;
  memory_loss: boolean;
  identity_collapse: boolean;
  location_collapse: boolean;
  style_collapse: boolean;
  traceability_break: boolean;
  production_memory_stress_validated: ValidationStatus;
  source_audits: SourceMemoryStressAudit[];
  cross_batch_trace_sample: CrossBatchTraceEntry[];
};

export type MovieAnalysisProductionMemoryStressTestManifest = {
  manifest_id: string;
  phase: typeof PRODUCTION_MEMORY_STRESS_TEST_PHASE;
  generated_at: string;
  production_batch_consistency_validation_manifest_path: typeof PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH;
  stress_test_scales: Array<(typeof STRESS_TEST_SCALES)[number]>;
  cross_batch_unit: typeof CROSS_BATCH_UNIT;
  scale_results: MemoryStressScaleResult[];
};

export type MovieAnalysisProductionMemoryStressTestReport = {
  report_id: string;
  phase: typeof PRODUCTION_MEMORY_STRESS_TEST_PHASE;
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
  production_batch_consistency_validation_report_path: typeof PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH;
  production_batch_consistency_validation_manifest_path: typeof PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH;
  production_memory_stress_test_export_dir: typeof PRODUCTION_MEMORY_STRESS_TEST_EXPORT_DIR;
  production_memory_stress_test_manifest_path: typeof PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH;
  video_identity_dir: typeof VIDEO_IDENTITY_DIR;
  video_location_dir: typeof VIDEO_LOCATION_DIR;
  video_style_dir: typeof VIDEO_STYLE_DIR;
  video_motion_dir: typeof VIDEO_MOTION_DIR;
  source_count: number;
  adapter_count: number;
  stress_test_scale_count: typeof STRESS_TEST_SCALE_COUNT;
  stress_test_scales: Array<(typeof STRESS_TEST_SCALES)[number]>;
  identity_memory_decay: ValidationStatus;
  location_memory_decay: ValidationStatus;
  style_memory_decay: ValidationStatus;
  motion_memory_decay: ValidationStatus;
  reentry_after_long_gap: ValidationStatus;
  cross_batch_traceability: ValidationStatus;
  memory_loss: boolean;
  identity_collapse: boolean;
  location_collapse: boolean;
  style_collapse: boolean;
  traceability_break: boolean;
  production_memory_stress_test_ready: ValidationStatus;
  certification_status: typeof PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE | null;
  scale_results: MemoryStressScaleResult[];
  final_verdict:
    | typeof PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT
    | typeof PRODUCTION_MEMORY_STRESS_TEST_FAIL_VERDICT;
  issues: ProductionMemoryStressTestIssue[];
};

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) / 255;
}

function toStatus(value: boolean): ValidationStatus {
  return value ? 'PASS' : 'FAIL';
}

function stressScaleId(scale: number): string {
  return `Production Scale ${scale}`;
}

function stressDecayMultiplier(scale: number): number {
  return MAX_STRESS_REENTRY_BASE_MULTIPLIER + Math.log10(scale / 1000) * 0.05;
}

function scenesPerSource(productionScale: number, sourceIndex: number): number {
  if (sourceIndex >= productionScale) {
    return 0;
  }
  return Math.floor((productionScale - 1 - sourceIndex) / EXPECTED_SOURCE_COUNT) + 1;
}

function assignScene(productionScale: number, sceneIndex: number): {
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
} {
  return {
    source_id: EXPECTED_SOURCE_VIDEO_IDS[sceneIndex % EXPECTED_SOURCE_COUNT],
    frame_index: Math.floor(sceneIndex / EXPECTED_SOURCE_COUNT) % BASE_CLIP_FRAME_COUNT,
  };
}

function cyclicFrame<T extends { frame_index: number }>(frames: T[], index: number): T {
  return {
    ...frames[index % frames.length],
    frame_index: index,
  };
}

function locationCompositeDrift(a: VideoLocationFrameSnapshot, b: VideoLocationFrameSnapshot): number {
  return (
    colorDistance(a.sky_zone_rgb, b.sky_zone_rgb) * 0.4 +
    colorDistance(a.midground_zone_rgb, b.midground_zone_rgb) * 0.35 +
    colorDistance(a.ground_zone_rgb, b.ground_zone_rgb) * 0.25
  );
}

function maxCyclicAdjacentDrift<T>(
  frames: T[],
  sceneCount: number,
  compare: (a: T, b: T) => number
): number {
  let max = 0;
  for (let index = 1; index < sceneCount; index += 1) {
    max = Math.max(
      max,
      compare(cyclicFrame(frames, index), cyclicFrame(frames, index - 1))
    );
  }
  return max;
}

function maxCyclicReentryDrift<T>(
  frames: T[],
  sceneCount: number,
  compare: (a: T, b: T) => number
): number {
  let maxGap = 0;
  const anchor = cyclicFrame(frames, 0);
  for (let index = BASE_CLIP_FRAME_COUNT; index < sceneCount; index += BASE_CLIP_FRAME_COUNT) {
    maxGap = Math.max(maxGap, compare(cyclicFrame(frames, index), anchor));
  }
  if (sceneCount > BASE_CLIP_FRAME_COUNT) {
    maxGap = Math.max(
      maxGap,
      compare(
        cyclicFrame(frames, BASE_CLIP_FRAME_COUNT - 1),
        cyclicFrame(frames, BASE_CLIP_FRAME_COUNT)
      )
    );
  }
  return maxGap;
}

function longGapIndices(sceneCount: number): number[] {
  const indices = new Set<number>([
    0,
    sceneCount - 1,
    Math.floor(sceneCount / 2),
    sceneCount - BASE_CLIP_FRAME_COUNT,
  ]);
  for (let index = BASE_CLIP_FRAME_COUNT; index < sceneCount; index += BASE_CLIP_FRAME_COUNT) {
    indices.add(index);
  }
  return [...indices].filter((index) => index >= 0 && index < sceneCount).sort((a, b) => a - b);
}

function memorySignature(
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

function evaluateIdentityMemoryDecay(
  identityFrames: VideoIdentityFrameSnapshot[],
  sceneCount: number,
  decayMultiplier: number
): {
  identity_memory_decay: number;
  identity_memory_validated: ValidationStatus;
  identity_collapse: boolean;
  reentry_after_long_gap: ValidationStatus;
} {
  const anchor = identityFrames[0];
  const adjacentDrift = maxCyclicAdjacentDrift(identityFrames, sceneCount, (a, b) =>
    colorDistance(a.face_zone_rgb, b.face_zone_rgb)
  );
  const reentryDrift = maxCyclicReentryDrift(identityFrames, sceneCount, (a, b) =>
    colorDistance(a.face_zone_rgb, b.face_zone_rgb)
  );

  const longGapDrifts = longGapIndices(sceneCount).map((index) =>
    colorDistance(cyclicFrame(identityFrames, index).face_zone_rgb, anchor.face_zone_rgb)
  );
  const longGapDrift = Math.max(...longGapDrifts, 0);
  const identityMemoryDecay = Math.max(adjacentDrift, reentryDrift, longGapDrift);

  const decayLimit = MAX_FRAME_IDENTITY_DRIFT * decayMultiplier;
  const collapseLimit = MAX_FRAME_IDENTITY_DRIFT * MAX_COLLAPSE_MULTIPLIER;
  const identityCollapse = identityMemoryDecay > collapseLimit;

  return {
    identity_memory_decay: identityMemoryDecay,
    identity_memory_validated: toStatus(
      identityMemoryDecay <= decayLimit &&
        adjacentDrift <= MAX_CHARACTER_DRIFT &&
        longGapDrift <= decayLimit
    ),
    identity_collapse: identityCollapse,
    reentry_after_long_gap: toStatus(longGapDrift <= decayLimit && reentryDrift <= decayLimit),
  };
}

function evaluateLocationMemoryDecay(
  locationFrames: VideoLocationFrameSnapshot[],
  sceneCount: number,
  decayMultiplier: number
): {
  location_memory_decay: number;
  location_memory_validated: ValidationStatus;
  location_collapse: boolean;
} {
  const anchor = locationFrames[0];
  const adjacentDrift = maxCyclicAdjacentDrift(locationFrames, sceneCount, locationCompositeDrift);
  const reentryDrift = maxCyclicReentryDrift(locationFrames, sceneCount, locationCompositeDrift);
  const longGapDrifts = longGapIndices(sceneCount).map((index) =>
    locationCompositeDrift(cyclicFrame(locationFrames, index), anchor)
  );
  const longGapDrift = Math.max(...longGapDrifts, 0);
  const locationMemoryDecay = Math.max(adjacentDrift, reentryDrift, longGapDrift);

  const decayLimit = MAX_CROSS_FRAME_LOCATION_DRIFT * decayMultiplier;
  const collapseLimit = MAX_CROSS_FRAME_LOCATION_DRIFT * MAX_COLLAPSE_MULTIPLIER;

  return {
    location_memory_decay: locationMemoryDecay,
    location_memory_validated: toStatus(locationMemoryDecay <= decayLimit),
    location_collapse: locationMemoryDecay > collapseLimit,
  };
}

function evaluateStyleMemoryDecay(
  styleFrames: VideoStyleFrameSnapshot[],
  sceneCount: number,
  decayMultiplier: number
): {
  style_memory_decay: number;
  style_memory_validated: ValidationStatus;
  style_collapse: boolean;
} {
  const anchor = styleFrames[0];
  const adjacentDrift = maxCyclicAdjacentDrift(styleFrames, sceneCount, (a, b) =>
    colorDistance(a.style_palette_rgb, b.style_palette_rgb)
  );
  const reentryDrift = maxCyclicReentryDrift(styleFrames, sceneCount, (a, b) =>
    colorDistance(a.style_palette_rgb, b.style_palette_rgb)
  );
  const longGapDrifts = longGapIndices(sceneCount).map((index) =>
    colorDistance(cyclicFrame(styleFrames, index).style_palette_rgb, anchor.style_palette_rgb)
  );
  const longGapDrift = Math.max(...longGapDrifts, 0);
  const styleMemoryDecay = Math.max(adjacentDrift, reentryDrift, longGapDrift);

  const decayLimit = MAX_STYLE_DRIFT * decayMultiplier;
  const collapseLimit = MAX_STYLE_DRIFT * MAX_COLLAPSE_MULTIPLIER;

  return {
    style_memory_decay: styleMemoryDecay,
    style_memory_validated: toStatus(
      styleMemoryDecay <= decayLimit && longGapDrift <= MAX_LIGHTING_STYLE_DRIFT * decayMultiplier
    ),
    style_collapse: styleMemoryDecay > collapseLimit,
  };
}

function evaluateMotionMemoryDecay(
  motionFrames: VideoMotionFrameSnapshot[],
  sceneCount: number,
  decayMultiplier: number
): {
  motion_memory_decay: number;
  motion_memory_validated: ValidationStatus;
} {
  const anchor = motionFrames[0];
  const adjacentDrift = maxCyclicAdjacentDrift(motionFrames, sceneCount, (a, b) =>
    Math.abs(a.motion_speed - b.motion_speed)
  );
  const reentryDrift = maxCyclicReentryDrift(motionFrames, sceneCount, (a, b) =>
    Math.abs(a.motion_speed - b.motion_speed)
  );
  const longGapDrifts = longGapIndices(sceneCount).map((index) =>
    Math.abs(cyclicFrame(motionFrames, index).motion_speed - anchor.motion_speed)
  );
  const longGapDrift = Math.max(...longGapDrifts, 0);
  const openToLastSpan = Math.abs(
    cyclicFrame(motionFrames, sceneCount - 1).motion_speed - anchor.motion_speed
  );
  const motionMemoryDecay = Math.max(adjacentDrift, reentryDrift, longGapDrift, openToLastSpan);

  const decayLimit = MAX_MOTION_DRIFT * decayMultiplier;

  return {
    motion_memory_decay: motionMemoryDecay,
    motion_memory_validated: toStatus(
      motionMemoryDecay <= decayLimit && openToLastSpan <= MAX_TEMPORAL_BREAK * decayMultiplier
    ),
  };
}

function loadSnapshotBundle(root: string, sourceId: string): SourceMemorySnapshotBundle | null {
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

function buildCrossBatchTraceSample(
  productionScale: number,
  bundles: Map<string, SourceMemorySnapshotBundle>,
  testResults: RealModelTestGenerationResult[]
): CrossBatchTraceEntry[] {
  const boundaryIndices = new Set<number>([0, productionScale - 1]);
  for (
    let boundary = CROSS_BATCH_UNIT - 1;
    boundary < productionScale;
    boundary += CROSS_BATCH_UNIT
  ) {
    boundaryIndices.add(boundary);
  }

  const sampleIndices = [...boundaryIndices].sort((a, b) => a - b);
  const entries: CrossBatchTraceEntry[] = [];

  for (const sceneIndex of sampleIndices) {
    const assignment = assignScene(productionScale, sceneIndex);
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

    entries.push({
      scene_index: sceneIndex,
      virtual_batch_index: Math.floor(sceneIndex / CROSS_BATCH_UNIT),
      source_id: assignment.source_id,
      frame_index: assignment.frame_index,
      cinematic_dna_id: testResult.dna_binding.cinematic_dna_id,
      traceability_preserved: testResult.traceability.traceability_preserved === true,
      memory_signature: memorySignature(
        assignment.source_id,
        assignment.frame_index,
        identity,
        location,
        style,
        motion
      ),
    });
  }

  return entries;
}

function validateCrossBatchTraceability(entries: CrossBatchTraceEntry[]): ValidationStatus {
  return toStatus(
    entries.length > 0 &&
      entries.every(
        (entry) =>
          entry.traceability_preserved === true &&
          entry.cinematic_dna_id.length > 0 &&
          entry.memory_signature.length > 0
      )
  );
}

function evaluateStressScale(
  productionScale: number,
  bundles: Map<string, SourceMemorySnapshotBundle>,
  testResults: RealModelTestGenerationResult[],
  issues: ProductionMemoryStressTestIssue[]
): MemoryStressScaleResult | null {
  const scaleLabel = stressScaleId(productionScale);
  const decayMultiplier = stressDecayMultiplier(productionScale);
  const sourceAudits: SourceMemoryStressAudit[] = [];
  let memoryLoss = false;
  let identityCollapse = false;
  let locationCollapse = false;
  let styleCollapse = false;

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const bundle = bundles.get(sourceId);
    if (!bundle) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing snapshot bundle for ${sourceId} at ${scaleLabel}`,
        severity: 'error',
        stress_scale: productionScale,
        source_id: sourceId,
      });
      return null;
    }

    const sceneCount = scenesPerSource(
      productionScale,
      EXPECTED_SOURCE_VIDEO_IDS.indexOf(sourceId)
    );
    const identity = evaluateIdentityMemoryDecay(
      bundle.identity_frames,
      sceneCount,
      decayMultiplier
    );
    const location = evaluateLocationMemoryDecay(
      bundle.location_frames,
      sceneCount,
      decayMultiplier
    );
    const style = evaluateStyleMemoryDecay(bundle.style_frames, sceneCount, decayMultiplier);
    const motion = evaluateMotionMemoryDecay(bundle.motion_frames, sceneCount, decayMultiplier);

    const memoryPreserved =
      identity.reentry_after_long_gap === 'PASS' &&
      identity.identity_memory_validated === 'PASS' &&
      location.location_memory_validated === 'PASS' &&
      style.style_memory_validated === 'PASS' &&
      motion.motion_memory_validated === 'PASS';

    if (!memoryPreserved) {
      memoryLoss = true;
      issues.push({
        code: 'MEMORY_LOSS',
        message: `Memory loss detected for ${sourceId} at ${scaleLabel}`,
        severity: 'error',
        stress_scale: productionScale,
        source_id: sourceId,
      });
    }
    if (identity.identity_collapse) {
      identityCollapse = true;
      issues.push({
        code: 'IDENTITY_COLLAPSE',
        message: `Identity collapse for ${sourceId} at ${scaleLabel}`,
        severity: 'error',
        stress_scale: productionScale,
        source_id: sourceId,
      });
    }
    if (location.location_collapse) {
      locationCollapse = true;
      issues.push({
        code: 'LOCATION_COLLAPSE',
        message: `Location collapse for ${sourceId} at ${scaleLabel}`,
        severity: 'error',
        stress_scale: productionScale,
        source_id: sourceId,
      });
    }
    if (style.style_collapse) {
      styleCollapse = true;
      issues.push({
        code: 'STYLE_COLLAPSE',
        message: `Style collapse for ${sourceId} at ${scaleLabel}`,
        severity: 'error',
        stress_scale: productionScale,
        source_id: sourceId,
      });
    }

    const sourceValidated = toStatus(
      identity.identity_memory_validated === 'PASS' &&
        location.location_memory_validated === 'PASS' &&
        style.style_memory_validated === 'PASS' &&
        motion.motion_memory_validated === 'PASS' &&
        identity.reentry_after_long_gap === 'PASS' &&
        memoryPreserved
    );

    sourceAudits.push({
      source_id: sourceId,
      scene_count: sceneCount,
      identity_memory_decay: identity.identity_memory_decay,
      location_memory_decay: location.location_memory_decay,
      style_memory_decay: style.style_memory_decay,
      motion_memory_decay: motion.motion_memory_decay,
      reentry_after_long_gap: identity.reentry_after_long_gap,
      identity_memory_validated: identity.identity_memory_validated,
      location_memory_validated: location.location_memory_validated,
      style_memory_validated: style.style_memory_validated,
      motion_memory_validated: motion.motion_memory_validated,
      source_memory_stress_validated: sourceValidated,
    });
  }

  const crossBatchTraceSample = buildCrossBatchTraceSample(productionScale, bundles, testResults);
  const crossBatchTraceability = validateCrossBatchTraceability(crossBatchTraceSample);
  const traceabilityBreak = crossBatchTraceability === 'FAIL';

  if (traceabilityBreak) {
    issues.push({
      code: 'TRACEABILITY_BREAK',
      message: `Cross-batch traceability failed at ${scaleLabel}`,
      severity: 'error',
      stress_scale: productionScale,
    });
  }

  const identityMemoryDecay = toStatus(
    sourceAudits.every((audit) => audit.identity_memory_validated === 'PASS')
  );
  const locationMemoryDecay = toStatus(
    sourceAudits.every((audit) => audit.location_memory_validated === 'PASS')
  );
  const styleMemoryDecay = toStatus(
    sourceAudits.every((audit) => audit.style_memory_validated === 'PASS')
  );
  const motionMemoryDecay = toStatus(
    sourceAudits.every((audit) => audit.motion_memory_validated === 'PASS')
  );
  const reentryAfterLongGap = toStatus(
    sourceAudits.every((audit) => audit.reentry_after_long_gap === 'PASS')
  );

  const validated = toStatus(
    identityMemoryDecay === 'PASS' &&
      locationMemoryDecay === 'PASS' &&
      styleMemoryDecay === 'PASS' &&
      motionMemoryDecay === 'PASS' &&
      reentryAfterLongGap === 'PASS' &&
      crossBatchTraceability === 'PASS' &&
      !memoryLoss &&
      !identityCollapse &&
      !locationCollapse &&
      !styleCollapse &&
      !traceabilityBreak
  );

  return {
    stress_scale_id: scaleLabel,
    production_scale: productionScale,
    scene_count: productionScale,
    identity_memory_decay: identityMemoryDecay,
    location_memory_decay: locationMemoryDecay,
    style_memory_decay: styleMemoryDecay,
    motion_memory_decay: motionMemoryDecay,
    reentry_after_long_gap: reentryAfterLongGap,
    cross_batch_traceability: crossBatchTraceability,
    memory_loss: memoryLoss,
    identity_collapse: identityCollapse,
    location_collapse: locationCollapse,
    style_collapse: styleCollapse,
    traceability_break: traceabilityBreak,
    production_memory_stress_validated: validated,
    source_audits: sourceAudits,
    cross_batch_trace_sample: crossBatchTraceSample,
  };
}

function buildMarkdown(report: MovieAnalysisProductionMemoryStressTestReport): string {
  const lines = [
    '# Movie Analysis Production Memory Stress Test',
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
    '## Stress Test Scales',
    '',
    report.stress_test_scales.join(', '),
    '',
    '## Validation Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| identity_memory_decay | ${report.identity_memory_decay} |`,
    `| location_memory_decay | ${report.location_memory_decay} |`,
    `| style_memory_decay | ${report.style_memory_decay} |`,
    `| motion_memory_decay | ${report.motion_memory_decay} |`,
    `| reentry_after_long_gap | ${report.reentry_after_long_gap} |`,
    `| cross_batch_traceability | ${report.cross_batch_traceability} |`,
    `| memory_loss | ${report.memory_loss ? 'BLOCKED' : 'PASS'} |`,
    `| identity_collapse | ${report.identity_collapse ? 'BLOCKED' : 'PASS'} |`,
    `| location_collapse | ${report.location_collapse ? 'BLOCKED' : 'PASS'} |`,
    `| style_collapse | ${report.style_collapse ? 'BLOCKED' : 'PASS'} |`,
    `| traceability_break | ${report.traceability_break ? 'BLOCKED' : 'PASS'} |`,
    '',
    '## Scale Results',
    ''
  );

  for (const scale of report.scale_results) {
    lines.push(
      `### ${scale.stress_scale_id}`,
      '',
      `- scene_count: ${scale.scene_count}`,
      `- identity_memory_decay: ${scale.identity_memory_decay}`,
      `- location_memory_decay: ${scale.location_memory_decay}`,
      `- style_memory_decay: ${scale.style_memory_decay}`,
      `- motion_memory_decay: ${scale.motion_memory_decay}`,
      `- reentry_after_long_gap: ${scale.reentry_after_long_gap}`,
      `- cross_batch_traceability: ${scale.cross_batch_traceability}`,
      `- validated: ${scale.production_memory_stress_validated}`,
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
  issues: ProductionMemoryStressTestIssue[]
): MovieAnalysisProductionMemoryStressTestReport {
  const report: MovieAnalysisProductionMemoryStressTestReport = {
    report_id: 'movie-analysis-production-memory-stress-test-report-v1',
    phase: PRODUCTION_MEMORY_STRESS_TEST_PHASE,
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
    production_batch_consistency_validation_report_path: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH,
    production_batch_consistency_validation_manifest_path: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    production_memory_stress_test_export_dir: PRODUCTION_MEMORY_STRESS_TEST_EXPORT_DIR,
    production_memory_stress_test_manifest_path: PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: 0,
    adapter_count: 0,
    stress_test_scale_count: STRESS_TEST_SCALE_COUNT,
    stress_test_scales: [...STRESS_TEST_SCALES],
    identity_memory_decay: 'FAIL',
    location_memory_decay: 'FAIL',
    style_memory_decay: 'FAIL',
    motion_memory_decay: 'FAIL',
    reentry_after_long_gap: 'FAIL',
    cross_batch_traceability: 'FAIL',
    memory_loss: true,
    identity_collapse: true,
    location_collapse: true,
    style_collapse: true,
    traceability_break: true,
    production_memory_stress_test_ready: 'FAIL',
    certification_status: null,
    scale_results: [],
    final_verdict: PRODUCTION_MEMORY_STRESS_TEST_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_MEMORY_STRESS_TEST_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_MEMORY_STRESS_TEST_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisProductionMemoryStressTest(
  projectRoot?: string
): MovieAnalysisProductionMemoryStressTestReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProductionMemoryStressTestIssue[] = [];
  const timestamp = new Date().toISOString();

  const productionBatchPath = path.join(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(productionBatchPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const productionBatchReport = JSON.parse(fs.readFileSync(productionBatchPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (
    productionBatchReport.final_verdict !== PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT ||
    productionBatchReport.certification_status !== PRODUCTION_BATCH_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'PRODUCTION_BATCH_NOT_VALIDATED',
      message: `Required ${PRODUCTION_BATCH_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH}`,
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

  const bundles = new Map<string, SourceMemorySnapshotBundle>();
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

  const scaleResults: MemoryStressScaleResult[] = [];
  for (const productionScale of STRESS_TEST_SCALES) {
    const scaleResult = evaluateStressScale(
      productionScale,
      bundles,
      testManifest.results,
      issues
    );
    if (!scaleResult) {
      return writeFailReport(root, timestamp, issues);
    }
    scaleResults.push(scaleResult);
  }

  const identityMemoryDecay = toStatus(
    scaleResults.every((scale) => scale.identity_memory_decay === 'PASS')
  );
  const locationMemoryDecay = toStatus(
    scaleResults.every((scale) => scale.location_memory_decay === 'PASS')
  );
  const styleMemoryDecay = toStatus(
    scaleResults.every((scale) => scale.style_memory_decay === 'PASS')
  );
  const motionMemoryDecay = toStatus(
    scaleResults.every((scale) => scale.motion_memory_decay === 'PASS')
  );
  const reentryAfterLongGap = toStatus(
    scaleResults.every((scale) => scale.reentry_after_long_gap === 'PASS')
  );
  const crossBatchTraceability = toStatus(
    scaleResults.every((scale) => scale.cross_batch_traceability === 'PASS')
  );
  const memoryLoss = scaleResults.some((scale) => scale.memory_loss);
  const identityCollapse = scaleResults.some((scale) => scale.identity_collapse);
  const locationCollapse = scaleResults.some((scale) => scale.location_collapse);
  const styleCollapse = scaleResults.some((scale) => scale.style_collapse);
  const traceabilityBreak = scaleResults.some((scale) => scale.traceability_break);

  const gateChecks: ValidationStatus[] = [
    identityMemoryDecay,
    locationMemoryDecay,
    styleMemoryDecay,
    motionMemoryDecay,
    reentryAfterLongGap,
    crossBatchTraceability,
  ];

  const productionMemoryStressTestReady =
    gateChecks.every((status) => status === 'PASS') &&
    !memoryLoss &&
    !identityCollapse &&
    !locationCollapse &&
    !styleCollapse &&
    !traceabilityBreak &&
    scaleResults.every((scale) => scale.production_memory_stress_validated === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = productionMemoryStressTestReady === 'PASS';

  const manifest: MovieAnalysisProductionMemoryStressTestManifest = {
    manifest_id: 'movie-analysis-production-memory-stress-test-manifest-v1',
    phase: PRODUCTION_MEMORY_STRESS_TEST_PHASE,
    generated_at: timestamp,
    production_batch_consistency_validation_manifest_path:
      PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    stress_test_scales: [...STRESS_TEST_SCALES],
    cross_batch_unit: CROSS_BATCH_UNIT,
    scale_results: scaleResults,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_MEMORY_STRESS_TEST_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_MEMORY_STRESS_TEST_EXPORT_DIR, 'production-memory-stress-scales.json'),
    `${JSON.stringify(
      {
        stress_test_scales: STRESS_TEST_SCALES,
        cross_batch_unit: CROSS_BATCH_UNIT,
        scale_results: scaleResults.map((scale) => ({
          stress_scale_id: scale.stress_scale_id,
          production_scale: scale.production_scale,
          scene_count: scale.scene_count,
          identity_memory_decay: scale.identity_memory_decay,
          location_memory_decay: scale.location_memory_decay,
          style_memory_decay: scale.style_memory_decay,
          motion_memory_decay: scale.motion_memory_decay,
          reentry_after_long_gap: scale.reentry_after_long_gap,
          cross_batch_traceability: scale.cross_batch_traceability,
          memory_loss: scale.memory_loss,
          identity_collapse: scale.identity_collapse,
          location_collapse: scale.location_collapse,
          style_collapse: scale.style_collapse,
          traceability_break: scale.traceability_break,
          production_memory_stress_validated: scale.production_memory_stress_validated,
          source_audits: scale.source_audits,
          cross_batch_trace_sample: scale.cross_batch_trace_sample,
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

  const report: MovieAnalysisProductionMemoryStressTestReport = {
    report_id: 'movie-analysis-production-memory-stress-test-report-v1',
    phase: PRODUCTION_MEMORY_STRESS_TEST_PHASE,
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
    production_batch_consistency_validation_report_path: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_REPORT_PATH,
    production_batch_consistency_validation_manifest_path: PRODUCTION_BATCH_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    production_memory_stress_test_export_dir: PRODUCTION_MEMORY_STRESS_TEST_EXPORT_DIR,
    production_memory_stress_test_manifest_path: PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    stress_test_scale_count: STRESS_TEST_SCALE_COUNT,
    stress_test_scales: [...STRESS_TEST_SCALES],
    identity_memory_decay: identityMemoryDecay,
    location_memory_decay: locationMemoryDecay,
    style_memory_decay: styleMemoryDecay,
    motion_memory_decay: motionMemoryDecay,
    reentry_after_long_gap: reentryAfterLongGap,
    cross_batch_traceability: crossBatchTraceability,
    memory_loss: memoryLoss,
    identity_collapse: identityCollapse,
    location_collapse: locationCollapse,
    style_collapse: styleCollapse,
    traceability_break: traceabilityBreak,
    production_memory_stress_test_ready: productionMemoryStressTestReady,
    certification_status: pass ? PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE : null,
    scale_results: scaleResults,
    final_verdict: pass
      ? PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT
      : PRODUCTION_MEMORY_STRESS_TEST_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_MEMORY_STRESS_TEST_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_MEMORY_STRESS_TEST_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
