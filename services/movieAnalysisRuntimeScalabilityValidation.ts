import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  MAX_CALLBACK_IDENTITY_DRIFT,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisMultiEpisodeConsistencyValidation.js';
import {
  ANCHOR_SEASON_ID,
  MAX_CROSS_SEASON_CHARACTER_DRIFT,
  MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT,
  MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
  SEASON_COUNT,
  SEASON_SOURCE_MAP,
} from './movieAnalysisMultiSeasonContinuityValidation.js';
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
  VIDEO_LOCATION_DIR,
  type VideoLocationFrameSnapshot,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import {
  MAX_FRAME_IDENTITY_DRIFT,
  VIDEO_IDENTITY_DIR,
  type VideoIdentityFrameSnapshot,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import {
  VIDEO_STYLE_DIR,
  type VideoStyleFrameSnapshot,
} from './movieAnalysisRealVideoStyleConsistencyValidation.js';
import {
  VIDEO_MOTION_DIR,
  type VideoMotionFrameSnapshot,
} from './movieAnalysisRealVideoMotionConsistencyValidation.js';
import {
  BASE_CLIP_FRAME_COUNT,
  CROSS_BATCH_UNIT,
  MAX_COLLAPSE_MULTIPLIER,
  MAX_STRESS_REENTRY_BASE_MULTIPLIER,
  PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT,
  PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
  type SourceMemorySnapshotBundle,
} from './movieAnalysisProductionMemoryStressTest.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RUNTIME_SCALABILITY_VALIDATION_PHASE =
  'PHASE-LEVEL2G-005-RUNTIME_SCALABILITY_VALIDATION_V1' as const;
export const RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_RUNTIME_SCALABILITY_VALIDATION_V1' as const;
export const RUNTIME_SCALABILITY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_RUNTIME_SCALABILITY_VALIDATION_V1' as const;
export const RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE =
  'RUNTIME_SCALABILITY_VALIDATED' as const;
export const RUNTIME_SCALABILITY_VALIDATION_DIR =
  'reports/movie_analysis_runtime_scalability_validation' as const;
export const RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_runtime_scalability_validation/movie-analysis-runtime-scalability-validation-report.json' as const;
export const RUNTIME_SCALABILITY_VALIDATION_MD_PATH =
  'reports/movie_analysis_runtime_scalability_validation/MOVIE_ANALYSIS_RUNTIME_SCALABILITY_VALIDATION.md' as const;
export const RUNTIME_SCALABILITY_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_runtime_scalability_validation' as const;
export const RUNTIME_SCALABILITY_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_runtime_scalability_validation/movie-analysis-runtime-scalability-validation-manifest.json' as const;

export const RUNTIME_SCALABILITY_SCALES = [10_000, 100_000, 1_000_000] as const;
export const RUNTIME_SCALABILITY_SCALE_COUNT = RUNTIME_SCALABILITY_SCALES.length;
export const RUNTIME_CROSS_BATCH_UNIT = CROSS_BATCH_UNIT;
export const RUNTIME_EPISODE_CAP = 1_000_000 as const;
export const RUNTIME_SCALE_TIER_LABELS = ['10K', '100K', '1M'] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RuntimeScalabilityValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  scalability_scale?: number;
  source_id?: string;
};

export type RuntimeCrossBatchTraceEntry = {
  episode_index: number;
  virtual_batch_index: number;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
  cinematic_dna_id: string;
  traceability_preserved: boolean;
  memory_signature: string;
};

export type RuntimeScalabilitySourceAudit = {
  source_id: string;
  episode_count: number;
  identity_memory_decay: number;
  location_memory_decay: number;
  style_memory_decay: number;
  motion_memory_decay: number;
  reentry_after_long_gap: ValidationStatus;
  identity_memory_validated: ValidationStatus;
  location_memory_validated: ValidationStatus;
  style_memory_validated: ValidationStatus;
  motion_memory_validated: ValidationStatus;
  source_runtime_scalability_validated: ValidationStatus;
};

export type RuntimeScalabilityScaleResult = {
  scalability_scale_id: string;
  scale_tier: (typeof RUNTIME_SCALE_TIER_LABELS)[number];
  episode_count: number;
  episodes_per_virtual_season: number;
  runtime_scalability: ValidationStatus;
  large_scale_traceability: ValidationStatus;
  large_scale_memory_preservation: ValidationStatus;
  large_scale_callback_preservation: ValidationStatus;
  cross_season_scalability: ValidationStatus;
  cross_series_scalability: ValidationStatus;
  runtime_overflow: boolean;
  scalability_failure: boolean;
  memory_collapse: boolean;
  traceability_collapse: boolean;
  callback_collapse: boolean;
  series_scale_break: boolean;
  runtime_scalability_validated: ValidationStatus;
  source_audits: RuntimeScalabilitySourceAudit[];
  cross_batch_trace_sample: RuntimeCrossBatchTraceEntry[];
};

export type RuntimeScalabilityJourneyStep = {
  step_index: number;
  scale_tier: (typeof RUNTIME_SCALE_TIER_LABELS)[number];
  episode_count: number;
  runtime_scalability: ValidationStatus;
  large_scale_traceability: ValidationStatus;
  large_scale_memory_preservation: ValidationStatus;
  large_scale_callback_preservation: ValidationStatus;
  cross_season_scalability: ValidationStatus;
  cross_series_scalability: ValidationStatus;
  runtime_scalability_validated: ValidationStatus;
};

export type MovieAnalysisRuntimeScalabilityValidationManifest = {
  manifest_id: string;
  phase: typeof RUNTIME_SCALABILITY_VALIDATION_PHASE;
  generated_at: string;
  multi_season_continuity_validation_report_path: typeof MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH;
  production_memory_stress_test_report_path: typeof PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH;
  runtime_scalability_scales: Array<(typeof RUNTIME_SCALABILITY_SCALES)[number]>;
  cross_batch_unit: typeof RUNTIME_CROSS_BATCH_UNIT;
  anchor_season_id: typeof ANCHOR_SEASON_ID;
  scale_results: RuntimeScalabilityScaleResult[];
  journey_steps: RuntimeScalabilityJourneyStep[];
};

export type MovieAnalysisRuntimeScalabilityValidationReport = {
  report_id: string;
  phase: typeof RUNTIME_SCALABILITY_VALIDATION_PHASE;
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
  multi_season_continuity_validation_report_path: typeof MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH;
  production_memory_stress_test_report_path: typeof PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH;
  runtime_scalability_validation_export_dir: typeof RUNTIME_SCALABILITY_VALIDATION_EXPORT_DIR;
  runtime_scalability_validation_manifest_path: typeof RUNTIME_SCALABILITY_VALIDATION_MANIFEST_PATH;
  video_identity_dir: typeof VIDEO_IDENTITY_DIR;
  video_location_dir: typeof VIDEO_LOCATION_DIR;
  video_style_dir: typeof VIDEO_STYLE_DIR;
  video_motion_dir: typeof VIDEO_MOTION_DIR;
  source_count: number;
  adapter_count: number;
  runtime_scalability_scale_count: typeof RUNTIME_SCALABILITY_SCALE_COUNT;
  runtime_scalability_scales: Array<(typeof RUNTIME_SCALABILITY_SCALES)[number]>;
  runtime_scalability: ValidationStatus;
  large_scale_traceability: ValidationStatus;
  large_scale_memory_preservation: ValidationStatus;
  large_scale_callback_preservation: ValidationStatus;
  cross_season_scalability: ValidationStatus;
  cross_series_scalability: ValidationStatus;
  runtime_overflow: boolean;
  scalability_failure: boolean;
  memory_collapse: boolean;
  traceability_collapse: boolean;
  callback_collapse: boolean;
  series_scale_break: boolean;
  runtime_scalability_validation_ready: ValidationStatus;
  certification_status: typeof RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE | null;
  scale_results: RuntimeScalabilityScaleResult[];
  journey_steps: RuntimeScalabilityJourneyStep[];
  final_verdict:
    | typeof RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT
    | typeof RUNTIME_SCALABILITY_VALIDATION_FAIL_VERDICT;
  issues: RuntimeScalabilityValidationIssue[];
};

type Rgb = [number, number, number];

function toStatus(value: boolean): ValidationStatus {
  return value ? 'PASS' : 'FAIL';
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) / 255;
}

function scalabilityScaleId(scale: number): string {
  return `Runtime Scale ${scale}`;
}

function scaleTierLabel(scale: number): (typeof RUNTIME_SCALE_TIER_LABELS)[number] {
  if (scale === 10_000) return '10K';
  if (scale === 100_000) return '100K';
  return '1M';
}

function scalabilityDecayMultiplier(scale: number): number {
  return MAX_STRESS_REENTRY_BASE_MULTIPLIER + Math.log10(scale / 1000) * 0.05;
}

function episodesPerSource(episodeCount: number, sourceIndex: number): number {
  if (sourceIndex >= episodeCount) {
    return 0;
  }
  return Math.floor((episodeCount - 1 - sourceIndex) / EXPECTED_SOURCE_COUNT) + 1;
}

function assignEpisode(
  episodeCount: number,
  episodeIndex: number
): {
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
} {
  return {
    source_id: EXPECTED_SOURCE_VIDEO_IDS[episodeIndex % EXPECTED_SOURCE_COUNT],
    frame_index: Math.floor(episodeIndex / EXPECTED_SOURCE_COUNT) % BASE_CLIP_FRAME_COUNT,
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
    max = Math.max(max, compare(cyclicFrame(frames, index), cyclicFrame(frames, index - 1)));
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
  episodeCount: number,
  bundles: Map<string, SourceMemorySnapshotBundle>,
  testResults: RealModelTestGenerationResult[]
): RuntimeCrossBatchTraceEntry[] {
  const boundaryIndices = new Set<number>([0, episodeCount - 1]);
  for (
    let boundary = RUNTIME_CROSS_BATCH_UNIT - 1;
    boundary < episodeCount;
    boundary += RUNTIME_CROSS_BATCH_UNIT
  ) {
    boundaryIndices.add(boundary);
  }

  const entries: RuntimeCrossBatchTraceEntry[] = [];
  for (const episodeIndex of [...boundaryIndices].sort((a, b) => a - b)) {
    const assignment = assignEpisode(episodeCount, episodeIndex);
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
      episode_index: episodeIndex,
      virtual_batch_index: Math.floor(episodeIndex / RUNTIME_CROSS_BATCH_UNIT),
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

function validateCrossBatchTraceability(entries: RuntimeCrossBatchTraceEntry[]): ValidationStatus {
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

function callbackEpisodeIndices(episodeCount: number): number[] {
  const indices = new Set<number>([0, episodeCount - 1, Math.floor(episodeCount / 2)]);
  const cycle = BASE_CLIP_FRAME_COUNT * EXPECTED_SOURCE_COUNT;
  for (let episodeIndex = 0; episodeIndex < episodeCount; episodeIndex += cycle) {
    indices.add(episodeIndex);
  }
  const episodesPerSeason = Math.floor(episodeCount / SEASON_COUNT);
  for (let season = 1; season <= SEASON_COUNT; season += 1) {
    const boundary = season * episodesPerSeason - 1;
    if (boundary >= 0 && boundary < episodeCount) {
      indices.add(boundary);
    }
  }
  return [...indices].filter((index) => index >= 0 && index < episodeCount).sort((a, b) => a - b);
}

function evaluateLargeScaleCallbackPreservation(
  episodeCount: number,
  bundles: Map<string, SourceMemorySnapshotBundle>,
  decayMultiplier: number
): { large_scale_callback_preservation: ValidationStatus; callback_collapse: boolean } {
  const anchorBundle = bundles.get(SEASON_SOURCE_MAP['Long Term Callback']);
  if (!anchorBundle) {
    return { large_scale_callback_preservation: 'FAIL', callback_collapse: true };
  }

  const callbackLimit = MAX_CALLBACK_IDENTITY_DRIFT * decayMultiplier;
  let callbackCollapse = false;

  for (const episodeIndex of callbackEpisodeIndices(episodeCount)) {
    const assignment = assignEpisode(episodeCount, episodeIndex);
    if (assignment.source_id !== SEASON_SOURCE_MAP['Long Term Callback']) {
      continue;
    }

    const bundle = bundles.get(assignment.source_id);
    if (!bundle) {
      callbackCollapse = true;
      continue;
    }

    const frameIndex = assignment.frame_index;
    const identity = bundle.identity_frames[frameIndex];
    const location = bundle.location_frames[frameIndex];
    const anchorIdentity = anchorBundle.identity_frames[frameIndex];
    const anchorLocation = anchorBundle.location_frames[frameIndex];
    const faceDrift = colorDistance(identity.face_zone_rgb, anchorIdentity.face_zone_rgb);

    if (
      faceDrift > callbackLimit ||
      identity.identity_signature !== anchorIdentity.identity_signature ||
      location.location_signature !== anchorLocation.location_signature
    ) {
      callbackCollapse = true;
    }
  }

  return {
    large_scale_callback_preservation: toStatus(!callbackCollapse),
    callback_collapse: callbackCollapse,
  };
}

function evaluateCrossSeasonScalability(
  episodeCount: number,
  bundles: Map<string, SourceMemorySnapshotBundle>,
  decayMultiplier: number
): { cross_season_scalability: ValidationStatus; series_scale_break: boolean } {
  const episodesPerSeason = Math.floor(episodeCount / SEASON_COUNT);
  const driftLimit = MAX_CROSS_SEASON_CHARACTER_DRIFT * decayMultiplier;
  let seriesScaleBreak = false;

  for (let season = 1; season < SEASON_COUNT; season += 1) {
    const boundary = season * episodesPerSeason;
    if (boundary <= 0 || boundary >= episodeCount) {
      continue;
    }

    const before = assignEpisode(episodeCount, boundary - 1);
    const after = assignEpisode(episodeCount, boundary);
    const beforeBundle = bundles.get(before.source_id);
    const afterBundle = bundles.get(after.source_id);
    if (!beforeBundle || !afterBundle) {
      seriesScaleBreak = true;
      continue;
    }

    const beforeFrame = beforeBundle.identity_frames[before.frame_index];
    const afterFrame = afterBundle.identity_frames[after.frame_index];
    const drift = colorDistance(beforeFrame.face_zone_rgb, afterFrame.face_zone_rgb);
    if (drift > driftLimit) {
      seriesScaleBreak = true;
    }
  }

  return {
    cross_season_scalability: toStatus(!seriesScaleBreak),
    series_scale_break: seriesScaleBreak,
  };
}

function evaluateCrossSeriesScalability(
  episodeCount: number,
  bundles: Map<string, SourceMemorySnapshotBundle>,
  decayMultiplier: number
): { cross_series_scalability: ValidationStatus; series_scale_break: boolean } {
  const anchorBundle = bundles.get(SEASON_SOURCE_MAP[ANCHOR_SEASON_ID]);
  const reentryBundle = bundles.get(SEASON_SOURCE_MAP['Series Reentry']);
  if (!anchorBundle || !reentryBundle) {
    return { cross_series_scalability: 'FAIL', series_scale_break: true };
  }

  const anchorIdentity = anchorBundle.identity_frames[0];
  const finaleAssignment = assignEpisode(episodeCount, episodeCount - 1);
  const finaleBundle = bundles.get(finaleAssignment.source_id);
  if (!finaleBundle) {
    return { cross_series_scalability: 'FAIL', series_scale_break: true };
  }

  const finaleIdentity = finaleBundle.identity_frames[finaleAssignment.frame_index];
  const reentryIdentity = reentryBundle.identity_frames[0];
  const driftLimit = MAX_CROSS_SEASON_CHARACTER_DRIFT * decayMultiplier;
  const finaleDrift = colorDistance(finaleIdentity.face_zone_rgb, anchorIdentity.face_zone_rgb);
  const reentryDrift = colorDistance(reentryIdentity.face_zone_rgb, anchorIdentity.face_zone_rgb);
  const seriesScaleBreak =
    finaleDrift > driftLimit ||
    reentryDrift > driftLimit ||
    reentryIdentity.identity_signature !== anchorIdentity.identity_signature;

  return {
    cross_series_scalability: toStatus(!seriesScaleBreak),
    series_scale_break: seriesScaleBreak,
  };
}

function validateRuntimeOverflow(episodeCount: number): boolean {
  const maxVirtualBatch = Math.floor((episodeCount - 1) / RUNTIME_CROSS_BATCH_UNIT);
  const episodesPerSeason = Math.floor(episodeCount / SEASON_COUNT);
  return (
    Number.isSafeInteger(episodeCount) &&
    Number.isSafeInteger(maxVirtualBatch) &&
    Number.isSafeInteger(episodesPerSeason) &&
    episodeCount > 0 &&
    episodeCount <= RUNTIME_EPISODE_CAP &&
    maxVirtualBatch < Number.MAX_SAFE_INTEGER
  );
}

function evaluateRuntimeScale(
  episodeCount: number,
  bundles: Map<string, SourceMemorySnapshotBundle>,
  testResults: RealModelTestGenerationResult[],
  issues: RuntimeScalabilityValidationIssue[]
): RuntimeScalabilityScaleResult | null {
  const scaleLabel = scalabilityScaleId(episodeCount);
  const decayMultiplier = scalabilityDecayMultiplier(episodeCount);
  const episodesPerVirtualSeason = Math.floor(episodeCount / SEASON_COUNT);
  const runtimeOverflow = !validateRuntimeOverflow(episodeCount);

  if (runtimeOverflow) {
    issues.push({
      code: 'RUNTIME_OVERFLOW',
      message: `Runtime index overflow at ${scaleLabel}`,
      severity: 'error',
      scalability_scale: episodeCount,
    });
  }

  const sourceAudits: RuntimeScalabilitySourceAudit[] = [];
  let memoryCollapse = false;
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
        scalability_scale: episodeCount,
        source_id: sourceId,
      });
      return null;
    }

    const sourceEpisodeCount = episodesPerSource(
      episodeCount,
      EXPECTED_SOURCE_VIDEO_IDS.indexOf(sourceId)
    );
    const identity = evaluateIdentityMemoryDecay(
      bundle.identity_frames,
      sourceEpisodeCount,
      decayMultiplier
    );
    const location = evaluateLocationMemoryDecay(
      bundle.location_frames,
      sourceEpisodeCount,
      decayMultiplier
    );
    const style = evaluateStyleMemoryDecay(bundle.style_frames, sourceEpisodeCount, decayMultiplier);
    const motion = evaluateMotionMemoryDecay(bundle.motion_frames, sourceEpisodeCount, decayMultiplier);

    const memoryPreserved =
      identity.reentry_after_long_gap === 'PASS' &&
      identity.identity_memory_validated === 'PASS' &&
      location.location_memory_validated === 'PASS' &&
      style.style_memory_validated === 'PASS' &&
      motion.motion_memory_validated === 'PASS';

    if (!memoryPreserved) {
      memoryCollapse = true;
      issues.push({
        code: 'MEMORY_COLLAPSE',
        message: `Large-scale memory preservation failed for ${sourceId} at ${scaleLabel}`,
        severity: 'error',
        scalability_scale: episodeCount,
        source_id: sourceId,
      });
    }
    if (identity.identity_collapse) {
      identityCollapse = true;
    }
    if (location.location_collapse) {
      locationCollapse = true;
    }
    if (style.style_collapse) {
      styleCollapse = true;
    }

    const sourceValidated = toStatus(
      memoryPreserved &&
        identity.identity_memory_validated === 'PASS' &&
        location.location_memory_validated === 'PASS' &&
        style.style_memory_validated === 'PASS' &&
        motion.motion_memory_validated === 'PASS' &&
        identity.reentry_after_long_gap === 'PASS'
    );

    sourceAudits.push({
      source_id: sourceId,
      episode_count: sourceEpisodeCount,
      identity_memory_decay: identity.identity_memory_decay,
      location_memory_decay: location.location_memory_decay,
      style_memory_decay: identity.style_memory_decay,
      motion_memory_decay: motion.motion_memory_decay,
      reentry_after_long_gap: identity.reentry_after_long_gap,
      identity_memory_validated: identity.identity_memory_validated,
      location_memory_validated: location.location_memory_validated,
      style_memory_validated: style.style_memory_validated,
      motion_memory_validated: motion.motion_memory_validated,
      source_runtime_scalability_validated: sourceValidated,
    });
  }

  const crossBatchTraceSample = buildCrossBatchTraceSample(episodeCount, bundles, testResults);
  const largeScaleTraceability = validateCrossBatchTraceability(crossBatchTraceSample);
  const traceabilityCollapse = largeScaleTraceability === 'FAIL';
  if (traceabilityCollapse) {
    issues.push({
      code: 'TRACEABILITY_COLLAPSE',
      message: `Large-scale traceability collapsed at ${scaleLabel}`,
      severity: 'error',
      scalability_scale: episodeCount,
    });
  }

  const largeScaleMemoryPreservation = toStatus(
    sourceAudits.every((audit) => audit.source_runtime_scalability_validated === 'PASS') &&
      !memoryCollapse &&
      !identityCollapse &&
      !locationCollapse &&
      !styleCollapse
  );

  const callbackResult = evaluateLargeScaleCallbackPreservation(
    episodeCount,
    bundles,
    decayMultiplier
  );
  if (callbackResult.callback_collapse) {
    issues.push({
      code: 'CALLBACK_COLLAPSE',
      message: `Large-scale callback preservation collapsed at ${scaleLabel}`,
      severity: 'error',
      scalability_scale: episodeCount,
    });
  }

  const crossSeasonResult = evaluateCrossSeasonScalability(episodeCount, bundles, decayMultiplier);
  const crossSeriesResult = evaluateCrossSeriesScalability(episodeCount, bundles, decayMultiplier);
  const seriesScaleBreak = crossSeasonResult.series_scale_break || crossSeriesResult.series_scale_break;
  if (seriesScaleBreak) {
    issues.push({
      code: 'SERIES_SCALE_BREAK',
      message: `Cross-season or cross-series scalability broke at ${scaleLabel}`,
      severity: 'error',
      scalability_scale: episodeCount,
    });
  }

  const runtimeScalability = toStatus(!runtimeOverflow);
  const scalabilityFailure =
    runtimeOverflow ||
    largeScaleMemoryPreservation === 'FAIL' ||
    largeScaleTraceability === 'FAIL' ||
    callbackResult.large_scale_callback_preservation === 'FAIL' ||
    crossSeasonResult.cross_season_scalability === 'FAIL' ||
    crossSeriesResult.cross_series_scalability === 'FAIL';

  const validated = toStatus(
    runtimeScalability === 'PASS' &&
      largeScaleTraceability === 'PASS' &&
      largeScaleMemoryPreservation === 'PASS' &&
      callbackResult.large_scale_callback_preservation === 'PASS' &&
      crossSeasonResult.cross_season_scalability === 'PASS' &&
      crossSeriesResult.cross_series_scalability === 'PASS' &&
      !scalabilityFailure &&
      !memoryCollapse &&
      !traceabilityCollapse &&
      !callbackResult.callback_collapse &&
      !seriesScaleBreak
  );

  return {
    scalability_scale_id: scaleLabel,
    scale_tier: scaleTierLabel(episodeCount),
    episode_count: episodeCount,
    episodes_per_virtual_season: episodesPerVirtualSeason,
    runtime_scalability: runtimeScalability,
    large_scale_traceability: largeScaleTraceability,
    large_scale_memory_preservation: largeScaleMemoryPreservation,
    large_scale_callback_preservation: callbackResult.large_scale_callback_preservation,
    cross_season_scalability: crossSeasonResult.cross_season_scalability,
    cross_series_scalability: crossSeriesResult.cross_series_scalability,
    runtime_overflow: runtimeOverflow,
    scalability_failure: scalabilityFailure,
    memory_collapse: memoryCollapse || identityCollapse || locationCollapse || styleCollapse,
    traceability_collapse: traceabilityCollapse,
    callback_collapse: callbackResult.callback_collapse,
    series_scale_break: seriesScaleBreak,
    runtime_scalability_validated: validated,
    source_audits: sourceAudits,
    cross_batch_trace_sample: crossBatchTraceSample,
  };
}

function buildMarkdown(report: MovieAnalysisRuntimeScalabilityValidationReport): string {
  const lines = [
    '# Movie Analysis Runtime Scalability Validation',
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
    '## Runtime Scalability Scales',
    '',
    report.runtime_scalability_scales.join(' → '),
    '',
    '## Validation Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| runtime_scalability | ${report.runtime_scalability} |`,
    `| large_scale_traceability | ${report.large_scale_traceability} |`,
    `| large_scale_memory_preservation | ${report.large_scale_memory_preservation} |`,
    `| large_scale_callback_preservation | ${report.large_scale_callback_preservation} |`,
    `| cross_season_scalability | ${report.cross_season_scalability} |`,
    `| cross_series_scalability | ${report.cross_series_scalability} |`,
    `| runtime_overflow | ${report.runtime_overflow ? 'BLOCKED' : 'PASS'} |`,
    `| scalability_failure | ${report.scalability_failure ? 'BLOCKED' : 'PASS'} |`,
    `| memory_collapse | ${report.memory_collapse ? 'BLOCKED' : 'PASS'} |`,
    `| traceability_collapse | ${report.traceability_collapse ? 'BLOCKED' : 'PASS'} |`,
    `| callback_collapse | ${report.callback_collapse ? 'BLOCKED' : 'PASS'} |`,
    `| series_scale_break | ${report.series_scale_break ? 'BLOCKED' : 'PASS'} |`,
    '',
    '## Scale Results',
    ''
  );

  for (const scale of report.scale_results) {
    lines.push(
      `### ${scale.scalability_scale_id} (${scale.scale_tier})`,
      '',
      `- episode_count: ${scale.episode_count}`,
      `- episodes_per_virtual_season: ${scale.episodes_per_virtual_season}`,
      `- runtime_scalability: ${scale.runtime_scalability}`,
      `- large_scale_traceability: ${scale.large_scale_traceability}`,
      `- large_scale_memory_preservation: ${scale.large_scale_memory_preservation}`,
      `- large_scale_callback_preservation: ${scale.large_scale_callback_preservation}`,
      `- cross_season_scalability: ${scale.cross_season_scalability}`,
      `- cross_series_scalability: ${scale.cross_series_scalability}`,
      `- validated: ${scale.runtime_scalability_validated}`,
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
  issues: RuntimeScalabilityValidationIssue[]
): MovieAnalysisRuntimeScalabilityValidationReport {
  const report: MovieAnalysisRuntimeScalabilityValidationReport = {
    report_id: 'movie-analysis-runtime-scalability-validation-report-v1',
    phase: RUNTIME_SCALABILITY_VALIDATION_PHASE,
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
    multi_season_continuity_validation_report_path: MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
    production_memory_stress_test_report_path: PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
    runtime_scalability_validation_export_dir: RUNTIME_SCALABILITY_VALIDATION_EXPORT_DIR,
    runtime_scalability_validation_manifest_path: RUNTIME_SCALABILITY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: 0,
    adapter_count: 0,
    runtime_scalability_scale_count: RUNTIME_SCALABILITY_SCALE_COUNT,
    runtime_scalability_scales: [...RUNTIME_SCALABILITY_SCALES],
    runtime_scalability: 'FAIL',
    large_scale_traceability: 'FAIL',
    large_scale_memory_preservation: 'FAIL',
    large_scale_callback_preservation: 'FAIL',
    cross_season_scalability: 'FAIL',
    cross_series_scalability: 'FAIL',
    runtime_overflow: true,
    scalability_failure: true,
    memory_collapse: true,
    traceability_collapse: true,
    callback_collapse: true,
    series_scale_break: true,
    runtime_scalability_validation_ready: 'FAIL',
    certification_status: null,
    scale_results: [],
    journey_steps: [],
    final_verdict: RUNTIME_SCALABILITY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, RUNTIME_SCALABILITY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RUNTIME_SCALABILITY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRuntimeScalabilityValidation(
  projectRoot?: string
): MovieAnalysisRuntimeScalabilityValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RuntimeScalabilityValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const multiSeasonPath = path.join(root, MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(multiSeasonPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const multiSeasonReport = JSON.parse(fs.readFileSync(multiSeasonPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
    multi_season_continuity_validation_ready: string;
  };
  if (
    multiSeasonReport.final_verdict !== MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT ||
    multiSeasonReport.certification_status !== 'MULTI_SEASON_CONTINUITY_VALIDATED' ||
    multiSeasonReport.multi_season_continuity_validation_ready !== 'PASS'
  ) {
    issues.push({
      code: 'MULTI_SEASON_NOT_VALIDATED',
      message: `Required ${MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const productionStressPath = path.join(root, PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH);
  if (!fs.existsSync(productionStressPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const productionStressReport = JSON.parse(fs.readFileSync(productionStressPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (
    productionStressReport.final_verdict !== PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT ||
    productionStressReport.certification_status !== 'PRODUCTION_MEMORY_STRESS_TEST_VALIDATED'
  ) {
    issues.push({
      code: 'PRODUCTION_STRESS_NOT_VALIDATED',
      message: `Required ${PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const multiEpisodePath = path.join(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(multiEpisodePath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const multiEpisodeReport = JSON.parse(fs.readFileSync(multiEpisodePath, 'utf8')) as {
    final_verdict: string;
  };
  if (multiEpisodeReport.final_verdict !== MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'MULTI_EPISODE_NOT_VALIDATED',
      message: `Required ${MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
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

  const scaleResults: RuntimeScalabilityScaleResult[] = [];
  for (const episodeCount of RUNTIME_SCALABILITY_SCALES) {
    const result = evaluateRuntimeScale(episodeCount, bundles, testManifest.results, issues);
    if (!result) {
      return writeFailReport(root, timestamp, issues);
    }
    scaleResults.push(result);
  }

  const journeySteps: RuntimeScalabilityJourneyStep[] = scaleResults.map((scale, index) => ({
    step_index: index,
    scale_tier: scale.scale_tier,
    episode_count: scale.episode_count,
    runtime_scalability: scale.runtime_scalability,
    large_scale_traceability: scale.large_scale_traceability,
    large_scale_memory_preservation: scale.large_scale_memory_preservation,
    large_scale_callback_preservation: scale.large_scale_callback_preservation,
    cross_season_scalability: scale.cross_season_scalability,
    cross_series_scalability: scale.cross_series_scalability,
    runtime_scalability_validated: scale.runtime_scalability_validated,
  }));

  const runtimeScalability = toStatus(scaleResults.every((scale) => scale.runtime_scalability === 'PASS'));
  const largeScaleTraceability = toStatus(
    scaleResults.every((scale) => scale.large_scale_traceability === 'PASS')
  );
  const largeScaleMemoryPreservation = toStatus(
    scaleResults.every((scale) => scale.large_scale_memory_preservation === 'PASS')
  );
  const largeScaleCallbackPreservation = toStatus(
    scaleResults.every((scale) => scale.large_scale_callback_preservation === 'PASS')
  );
  const crossSeasonScalability = toStatus(
    scaleResults.every((scale) => scale.cross_season_scalability === 'PASS')
  );
  const crossSeriesScalability = toStatus(
    scaleResults.every((scale) => scale.cross_series_scalability === 'PASS')
  );

  const runtimeOverflow = scaleResults.some((scale) => scale.runtime_overflow);
  const scalabilityFailure = scaleResults.some((scale) => scale.scalability_failure);
  const memoryCollapse = scaleResults.some((scale) => scale.memory_collapse);
  const traceabilityCollapse = scaleResults.some((scale) => scale.traceability_collapse);
  const callbackCollapse = scaleResults.some((scale) => scale.callback_collapse);
  const seriesScaleBreak = scaleResults.some((scale) => scale.series_scale_break);

  const gateChecks: ValidationStatus[] = [
    runtimeScalability,
    largeScaleTraceability,
    largeScaleMemoryPreservation,
    largeScaleCallbackPreservation,
    crossSeasonScalability,
    crossSeriesScalability,
  ];

  const runtimeScalabilityValidationReady =
    !runtimeOverflow &&
    !scalabilityFailure &&
    !memoryCollapse &&
    !traceabilityCollapse &&
    !callbackCollapse &&
    !seriesScaleBreak &&
    gateChecks.every((status) => status === 'PASS') &&
    scaleResults.every((scale) => scale.runtime_scalability_validated === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = runtimeScalabilityValidationReady === 'PASS';

  const manifest: MovieAnalysisRuntimeScalabilityValidationManifest = {
    manifest_id: 'movie-analysis-runtime-scalability-validation-manifest-v1',
    phase: RUNTIME_SCALABILITY_VALIDATION_PHASE,
    generated_at: timestamp,
    multi_season_continuity_validation_report_path: MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
    production_memory_stress_test_report_path: PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
    runtime_scalability_scales: [...RUNTIME_SCALABILITY_SCALES],
    cross_batch_unit: RUNTIME_CROSS_BATCH_UNIT,
    anchor_season_id: ANCHOR_SEASON_ID,
    scale_results: scaleResults,
    journey_steps: journeySteps,
  };

  fs.mkdirSync(path.join(root, RUNTIME_SCALABILITY_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, RUNTIME_SCALABILITY_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RUNTIME_SCALABILITY_VALIDATION_EXPORT_DIR, 'runtime-scalability-journey.json'),
    `${JSON.stringify(
      {
        runtime_scalability_scales: RUNTIME_SCALABILITY_SCALES,
        journey_steps: journeySteps,
        scale_results: scaleResults.map((scale) => ({
          scale_tier: scale.scale_tier,
          episode_count: scale.episode_count,
          runtime_scalability_validated: scale.runtime_scalability_validated,
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

  const report: MovieAnalysisRuntimeScalabilityValidationReport = {
    report_id: 'movie-analysis-runtime-scalability-validation-report-v1',
    phase: RUNTIME_SCALABILITY_VALIDATION_PHASE,
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
    multi_season_continuity_validation_report_path: MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH,
    production_memory_stress_test_report_path: PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
    runtime_scalability_validation_export_dir: RUNTIME_SCALABILITY_VALIDATION_EXPORT_DIR,
    runtime_scalability_validation_manifest_path: RUNTIME_SCALABILITY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    runtime_scalability_scale_count: RUNTIME_SCALABILITY_SCALE_COUNT,
    runtime_scalability_scales: [...RUNTIME_SCALABILITY_SCALES],
    runtime_scalability: runtimeScalability,
    large_scale_traceability: largeScaleTraceability,
    large_scale_memory_preservation: largeScaleMemoryPreservation,
    large_scale_callback_preservation: largeScaleCallbackPreservation,
    cross_season_scalability: crossSeasonScalability,
    cross_series_scalability: crossSeriesScalability,
    runtime_overflow: runtimeOverflow,
    scalability_failure: scalabilityFailure,
    memory_collapse: memoryCollapse,
    traceability_collapse: traceabilityCollapse,
    callback_collapse: callbackCollapse,
    series_scale_break: seriesScaleBreak,
    runtime_scalability_validation_ready: runtimeScalabilityValidationReady,
    certification_status: pass ? RUNTIME_SCALABILITY_VALIDATION_STATUS_MESSAGE : null,
    scale_results: scaleResults,
    journey_steps: journeySteps,
    final_verdict: pass
      ? RUNTIME_SCALABILITY_VALIDATION_PASS_VERDICT
      : RUNTIME_SCALABILITY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, RUNTIME_SCALABILITY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, RUNTIME_SCALABILITY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RUNTIME_SCALABILITY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
