import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT,
  LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
  LEVEL2_FULLY_CERTIFIED_V2_STATUS,
} from './movieAnalysisLevel2FinalCertificationV2.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import { MAX_CHARACTER_DRIFT } from './movieAnalysisRealCharacterConsistencyValidation.js';
import { MAX_NARRATIVE_BREAK_GAP } from './movieAnalysisSequenceCoherenceValidation.js';
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
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import {
  MAX_FRAME_IDENTITY_DRIFT,
  VIDEO_IDENTITY_DIR,
  type VideoIdentityFrameSnapshot,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { VIDEO_LOCATION_DIR } from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import { VIDEO_STYLE_DIR } from './movieAnalysisRealVideoStyleConsistencyValidation.js';
import { VIDEO_MOTION_DIR } from './movieAnalysisRealVideoMotionConsistencyValidation.js';
import {
  VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
  type MovieAnalysisRealVideoMasterCertificationManifest,
} from './movieAnalysisRealVideoMasterCertification.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LONG_SEQUENCE_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2E-001-LONG_SEQUENCE_CONSISTENCY_VALIDATION_V1' as const;
export const LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LONG_SEQUENCE_CONSISTENCY_VALIDATION_V1' as const;
export const LONG_SEQUENCE_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LONG_SEQUENCE_CONSISTENCY_VALIDATION_V1' as const;
export const LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'LONG_SEQUENCE_CONSISTENCY_VALIDATED' as const;
export const LONG_SEQUENCE_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_long_sequence_validation' as const;
export const LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_long_sequence_validation/movie-analysis-long-sequence-validation-report.json' as const;
export const LONG_SEQUENCE_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_long_sequence_validation/MOVIE_ANALYSIS_LONG_SEQUENCE_VALIDATION.md' as const;
export const LONG_SEQUENCE_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_long_sequence_validation' as const;
export const LONG_SEQUENCE_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_long_sequence_validation/movie-analysis-long-sequence-validation-manifest.json' as const;

export const SEQUENCE_LENGTH_WINDOWS = [8, 32, 64, 128, 256, 512] as const;
export const SEQUENCE_LENGTHS_TESTED = SEQUENCE_LENGTH_WINDOWS.length;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const MAX_REENTRY_DRIFT_MULTIPLIER = 1.15 as const;

const SEQUENCE_STAGES = ['open', 'develop', 'peak', 'resolve'] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type LongSequenceConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
  sequence_length?: number;
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

export type SourceLongSequenceSnapshotBundle = {
  source_id: string;
  identity_frames: VideoIdentityFrameSnapshot[];
  location_frames: VideoLocationFrameSnapshot[];
  style_frames: VideoStyleFrameSnapshot[];
  motion_frames: VideoMotionFrameSnapshot[];
};

export type LongSequenceWindowValidation = {
  sequence_length: number;
  character_identity_persistence: ValidationStatus;
  character_reentry_consistency: ValidationStatus;
  location_persistence: ValidationStatus;
  location_reentry_consistency: ValidationStatus;
  style_persistence: ValidationStatus;
  lighting_persistence: ValidationStatus;
  palette_persistence: ValidationStatus;
  motion_persistence: ValidationStatus;
  temporal_flow_persistence: ValidationStatus;
  story_progression_consistency: ValidationStatus;
  narrative_continuity: ValidationStatus;
  window_character_persistence: ValidationStatus;
  window_location_persistence: ValidationStatus;
  window_style_persistence: ValidationStatus;
  window_motion_persistence: ValidationStatus;
  window_story_persistence: ValidationStatus;
  window_validated: ValidationStatus;
};

export type SourceLongSequenceValidationExport = {
  source_id: string;
  base_clip_frame_count: typeof BASE_CLIP_FRAME_COUNT;
  validation_windows: LongSequenceWindowValidation[];
  source_long_sequence_validated: ValidationStatus;
};

export type MovieAnalysisLongSequenceValidationManifest = {
  manifest_id: string;
  phase: typeof LONG_SEQUENCE_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  video_master_certification_manifest_path: typeof VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH;
  sequence_length_windows: readonly number[];
  source_count: number;
  sequence_lengths_tested: typeof SEQUENCE_LENGTHS_TESTED;
  entries: SourceLongSequenceValidationExport[];
};

export type SourceLongSequenceConsistencyAudit = {
  source_id: string;
  character_persistence: ValidationStatus;
  location_persistence: ValidationStatus;
  style_persistence: ValidationStatus;
  motion_persistence: ValidationStatus;
  story_persistence: ValidationStatus;
  long_sequence_identity_break: boolean;
  long_sequence_location_break: boolean;
  long_sequence_style_break: boolean;
  long_sequence_motion_break: boolean;
  long_sequence_story_break: boolean;
  validation_windows: LongSequenceWindowValidation[];
  source_long_sequence_validated: ValidationStatus;
};

export type MovieAnalysisLongSequenceConsistencyValidationReport = {
  report_id: string;
  phase: typeof LONG_SEQUENCE_CONSISTENCY_VALIDATION_PHASE;
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
  level2_final_certification_v2_report_path: typeof LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH;
  video_master_certification_manifest_path: typeof VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH;
  long_sequence_validation_export_dir: typeof LONG_SEQUENCE_VALIDATION_EXPORT_DIR;
  long_sequence_validation_manifest_path: typeof LONG_SEQUENCE_VALIDATION_MANIFEST_PATH;
  video_identity_dir: typeof VIDEO_IDENTITY_DIR;
  video_location_dir: typeof VIDEO_LOCATION_DIR;
  video_style_dir: typeof VIDEO_STYLE_DIR;
  video_motion_dir: typeof VIDEO_MOTION_DIR;
  source_count: number;
  adapter_count: number;
  sequence_lengths_tested: typeof SEQUENCE_LENGTHS_TESTED;
  character_persistence: ValidationStatus;
  location_persistence: ValidationStatus;
  style_persistence: ValidationStatus;
  motion_persistence: ValidationStatus;
  story_persistence: ValidationStatus;
  dna_binding_preserved: ValidationStatus;
  adapter_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  long_sequence_identity_break: boolean;
  long_sequence_location_break: boolean;
  long_sequence_style_break: boolean;
  long_sequence_motion_break: boolean;
  long_sequence_story_break: boolean;
  long_sequence_consistency_validation_ready: ValidationStatus;
  certification_status: typeof LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceLongSequenceConsistencyAudit[];
  final_verdict:
    | typeof LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof LONG_SEQUENCE_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: LongSequenceConsistencyValidationIssue[];
};

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) / 255;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function toStatus(value: boolean): ValidationStatus {
  return value ? 'PASS' : 'FAIL';
}

function aggregateStatus(
  audits: Array<Record<string, ValidationStatus>>,
  field: string
): ValidationStatus {
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function storyStage(frameIndex: number): (typeof SEQUENCE_STAGES)[number] {
  const stageIndex = Math.min(3, Math.floor((frameIndex % BASE_CLIP_FRAME_COUNT) / 2));
  return SEQUENCE_STAGES[stageIndex];
}

function storyStageIndex(frameIndex: number): number {
  return Math.min(3, Math.floor((frameIndex % BASE_CLIP_FRAME_COUNT) / 2));
}

function storySignature(
  identity: VideoIdentityFrameSnapshot,
  location: VideoLocationFrameSnapshot,
  style: VideoStyleFrameSnapshot,
  motion: VideoMotionFrameSnapshot,
  frameIndex: number
): string {
  return createHash('sha256')
    .update(
      [
        storyStage(frameIndex),
        identity.identity_signature,
        location.location_signature,
        style.style_signature,
        motion.motion_signature,
        motion.motion_direction.toFixed(4),
        style.composition_spread.toFixed(6),
      ].join('|')
    )
    .digest('hex')
    .slice(0, 12);
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

function validateCharacterWindow(
  identityFrames: VideoIdentityFrameSnapshot[],
  sequenceLength: number
): Pick<
  LongSequenceWindowValidation,
  'character_identity_persistence' | 'character_reentry_consistency' | 'window_character_persistence'
> {
  const extended = extendFrames(identityFrames, sequenceLength);
  const adjacentFaceDrifts: number[] = [];
  for (let index = 1; index < extended.length; index += 1) {
    adjacentFaceDrifts.push(
      colorDistance(extended[index].face_zone_rgb, extended[index - 1].face_zone_rgb)
    );
  }
  const maxAdjacentFaceDrift = Math.max(...adjacentFaceDrifts, 0);
  const reentryFaceDrift = maxReentryDrift(extended, sequenceLength, (a, b) =>
    colorDistance(a.face_zone_rgb, b.face_zone_rgb)
  );

  const identityPersistence = toStatus(
    maxAdjacentFaceDrift <= MAX_FRAME_IDENTITY_DRIFT &&
      adjacentFaceDrifts.every((drift) => drift <= MAX_CHARACTER_DRIFT)
  );
  const reentryConsistency = toStatus(
    reentryFaceDrift <= MAX_FRAME_IDENTITY_DRIFT * MAX_REENTRY_DRIFT_MULTIPLIER
  );

  return {
    character_identity_persistence: identityPersistence,
    character_reentry_consistency: reentryConsistency,
    window_character_persistence:
      identityPersistence === 'PASS' && reentryConsistency === 'PASS' ? 'PASS' : 'FAIL',
  };
}

function validateLocationWindow(
  locationFrames: VideoLocationFrameSnapshot[],
  sequenceLength: number
): Pick<
  LongSequenceWindowValidation,
  'location_persistence' | 'location_reentry_consistency' | 'window_location_persistence'
> {
  const extended = extendFrames(locationFrames, sequenceLength);
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
  const reentryLocationDrift = maxReentryDrift(extended, sequenceLength, (a, b) =>
    colorDistance(a.sky_zone_rgb, b.sky_zone_rgb) * 0.4 +
      colorDistance(a.midground_zone_rgb, b.midground_zone_rgb) * 0.35 +
      colorDistance(a.ground_zone_rgb, b.ground_zone_rgb) * 0.25
  );

  const locationPersistence = toStatus(maxAdjacentLocationDrift <= MAX_CROSS_FRAME_LOCATION_DRIFT);
  const reentryConsistency = toStatus(
    reentryLocationDrift <= MAX_CROSS_FRAME_LOCATION_DRIFT * MAX_REENTRY_DRIFT_MULTIPLIER
  );

  return {
    location_persistence: locationPersistence,
    location_reentry_consistency: reentryConsistency,
    window_location_persistence:
      locationPersistence === 'PASS' &&
      reentryConsistency === 'PASS' &&
      Math.max(...adjacentLightingDrifts, 0) <= MAX_LIGHTING_FRAME_DRIFT
        ? 'PASS'
        : 'FAIL',
  };
}

function validateStyleWindow(
  styleFrames: VideoStyleFrameSnapshot[],
  sequenceLength: number
): Pick<
  LongSequenceWindowValidation,
  | 'style_persistence'
  | 'lighting_persistence'
  | 'palette_persistence'
  | 'window_style_persistence'
> {
  const extended = extendFrames(styleFrames, sequenceLength);
  const paletteDrifts: number[] = [];
  const lightingDrifts: number[] = [];
  for (let index = 1; index < extended.length; index += 1) {
    const prev = extended[index - 1];
    const current = extended[index];
    paletteDrifts.push(colorDistance(prev.style_palette_rgb, current.style_palette_rgb));
    lightingDrifts.push(Math.abs(current.lighting_warmth - prev.lighting_warmth));
  }

  const stylePersistence = toStatus(
    Math.max(...paletteDrifts, 0) <= MAX_STYLE_DRIFT &&
      extended.every(
        (frame, index) =>
          index === 0 || frame.style_signature === extended[index - 1].style_signature ||
          paletteDrifts[index - 1] <= MAX_STYLE_DRIFT
      )
  );
  const lightingPersistence = toStatus(Math.max(...lightingDrifts, 0) <= MAX_LIGHTING_STYLE_DRIFT);
  const palettePersistence = toStatus(paletteDrifts.every((drift) => drift <= MAX_STYLE_DRIFT));

  return {
    style_persistence: stylePersistence,
    lighting_persistence: lightingPersistence,
    palette_persistence: palettePersistence,
    window_style_persistence:
      stylePersistence === 'PASS' && lightingPersistence === 'PASS' && palettePersistence === 'PASS'
        ? 'PASS'
        : 'FAIL',
  };
}

function validateMotionWindow(
  motionFrames: VideoMotionFrameSnapshot[],
  sequenceLength: number
): Pick<
  LongSequenceWindowValidation,
  'motion_persistence' | 'temporal_flow_persistence' | 'window_motion_persistence'
> {
  const extended = extendFrames(motionFrames, sequenceLength);
  const speedDrifts: number[] = [];
  const directionDrifts: number[] = [];
  for (let index = 1; index < extended.length; index += 1) {
    speedDrifts.push(Math.abs(extended[index].motion_speed - extended[index - 1].motion_speed));
    directionDrifts.push(
      Math.abs(extended[index].motion_direction - extended[index - 1].motion_direction)
    );
  }

  const openToLastSpan = Math.abs(
    extended[extended.length - 1].motion_speed - extended[0].motion_speed
  );
  const reentrySpeedDrift = maxReentryDrift(extended, sequenceLength, (a, b) =>
    Math.abs(a.motion_speed - b.motion_speed)
  );

  const motionPersistence = toStatus(
    Math.max(...speedDrifts, 0) <= MAX_MOTION_DRIFT &&
      directionDrifts.every((drift) => drift <= 2)
  );
  const temporalFlowPersistence = toStatus(
    openToLastSpan <= MAX_TEMPORAL_BREAK &&
      reentrySpeedDrift <= MAX_MOTION_DRIFT * MAX_REENTRY_DRIFT_MULTIPLIER
  );

  return {
    motion_persistence: motionPersistence,
    temporal_flow_persistence: temporalFlowPersistence,
    window_motion_persistence:
      motionPersistence === 'PASS' && temporalFlowPersistence === 'PASS' ? 'PASS' : 'FAIL',
  };
}

function validateStoryWindow(
  bundle: SourceLongSequenceSnapshotBundle,
  sequenceLength: number
): Pick<
  LongSequenceWindowValidation,
  'story_progression_consistency' | 'narrative_continuity' | 'window_story_persistence'
> {
  const identity = extendFrames(bundle.identity_frames, sequenceLength);
  const location = extendFrames(bundle.location_frames, sequenceLength);
  const style = extendFrames(bundle.style_frames, sequenceLength);
  const motion = extendFrames(bundle.motion_frames, sequenceLength);

  const stageIndices = Array.from({ length: sequenceLength }, (_, index) => storyStageIndex(index));
  const progressionMonotonic = stageIndices.every((stage, index) => {
    if (index === 0) return true;
    const prevStage = stageIndices[index - 1];
    if (index % BASE_CLIP_FRAME_COUNT === 0) {
      return stage === 0;
    }
    return stage >= prevStage || stage === 0;
  });

  const storyScores = identity.map((frame, index) =>
    clamp01(
      1 -
        colorDistance(frame.face_zone_rgb, identity[0].face_zone_rgb) * 0.25 -
        Math.abs(style[index].composition_spread - style[0].composition_spread) * 4 -
        Math.abs(motion[index].motion_direction - motion[0].motion_direction) * 0.1
    )
  );
  const narrativeGaps: number[] = [];
  for (let index = 1; index < sequenceLength; index += 1) {
    narrativeGaps.push(Math.abs(storyScores[index] - storyScores[index - 1]));
  }
  const reentryNarrativeGap = maxReentryDrift(
    identity.map((frame, index) => ({
      frame,
      signature: storySignature(identity[index], location[index], style[index], motion[index], index),
    })),
    sequenceLength,
    (a, b) => (a.signature === b.signature ? 0 : MAX_NARRATIVE_BREAK_GAP * 0.5)
  );
  const maxNarrativeGap = Math.max(...narrativeGaps, reentryNarrativeGap, 0);

  const storyProgression = toStatus(progressionMonotonic);
  const narrativeContinuity = toStatus(maxNarrativeGap <= MAX_NARRATIVE_BREAK_GAP);

  return {
    story_progression_consistency: storyProgression,
    narrative_continuity: narrativeContinuity,
    window_story_persistence:
      storyProgression === 'PASS' && narrativeContinuity === 'PASS' ? 'PASS' : 'FAIL',
  };
}

function validateWindow(
  bundle: SourceLongSequenceSnapshotBundle,
  sequenceLength: number
): LongSequenceWindowValidation {
  const character = validateCharacterWindow(bundle.identity_frames, sequenceLength);
  const location = validateLocationWindow(bundle.location_frames, sequenceLength);
  const style = validateStyleWindow(bundle.style_frames, sequenceLength);
  const motion = validateMotionWindow(bundle.motion_frames, sequenceLength);
  const story = validateStoryWindow(bundle, sequenceLength);

  const windowValidated = toStatus(
    character.window_character_persistence === 'PASS' &&
      location.window_location_persistence === 'PASS' &&
      style.window_style_persistence === 'PASS' &&
      motion.window_motion_persistence === 'PASS' &&
      story.window_story_persistence === 'PASS'
  );

  return {
    sequence_length: sequenceLength,
    ...character,
    ...location,
    ...style,
    ...motion,
    ...story,
    window_validated: windowValidated,
  };
}

function loadSnapshotBundle(root: string, sourceId: string): SourceLongSequenceSnapshotBundle | null {
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

function validateTraceability(
  root: string,
  masterManifest: MovieAnalysisRealVideoMasterCertificationManifest
): {
  dna_binding_preserved: ValidationStatus;
  adapter_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
} {
  const testManifestPath = path.join(root, MODEL_TEST_GENERATION_MANIFEST_PATH);
  const packagePath = path.join(root, MODEL_GENERATION_TEST_PACKAGE_PATH);
  if (!fs.existsSync(testManifestPath) || !fs.existsSync(packagePath)) {
    return {
      dna_binding_preserved: 'FAIL',
      adapter_binding_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
    };
  }

  const testManifest = JSON.parse(fs.readFileSync(testManifestPath, 'utf8')) as {
    results: RealModelTestGenerationResult[];
  };

  const dnaBindingPreserved = toStatus(
    masterManifest.certification_status === 'REAL_VIDEO_PIPELINE_CERTIFIED' &&
      testManifest.results.length === EXPECTED_SOURCE_COUNT &&
      testManifest.results.every(
        (result) =>
          result.dna_binding.binding_preserved === true &&
          result.traceability.cinematic_dna_id === result.dna_binding.cinematic_dna_id
      )
  );

  const adapterBindingPreserved = toStatus(
    testManifest.results.every(
      (result) =>
        result.adapter_binding.binding_preserved === true &&
        result.adapter_binding.adapter_ids.length === 6 &&
        result.adapter_binding.adapter_ids.some((id) => id.includes('storytelling_adapter'))
    )
  );

  const traceabilityPreserved = toStatus(
    testManifest.results.every((result) => result.traceability.traceability_preserved === true) &&
      masterManifest.video_identity_manifest_path.includes('video_identity') &&
      masterManifest.video_motion_manifest_path.includes('video_motion')
  );

  return {
    dna_binding_preserved: dnaBindingPreserved,
    adapter_binding_preserved: adapterBindingPreserved,
    traceability_preserved: traceabilityPreserved,
  };
}

function buildMarkdown(report: MovieAnalysisLongSequenceConsistencyValidationReport): string {
  const lines = [
    '# Movie Analysis Long Sequence Consistency Validation',
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
    '## Validation Windows',
    '',
    `8 → 32 → 64 → 128 → 256 → 512 frames (base clip: ${BASE_CLIP_FRAME_COUNT} frames)`,
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| sequence_lengths_tested | ${report.sequence_lengths_tested} |`,
    `| character_persistence | ${report.character_persistence} |`,
    `| location_persistence | ${report.location_persistence} |`,
    `| style_persistence | ${report.style_persistence} |`,
    `| motion_persistence | ${report.motion_persistence} |`,
    `| story_persistence | ${report.story_persistence} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| adapter_binding_preserved | ${report.adapter_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| long_sequence_identity_break | ${report.long_sequence_identity_break} |`,
    `| long_sequence_location_break | ${report.long_sequence_location_break} |`,
    `| long_sequence_style_break | ${report.long_sequence_style_break} |`,
    `| long_sequence_motion_break | ${report.long_sequence_motion_break} |`,
    `| long_sequence_story_break | ${report.long_sequence_story_break} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- character_persistence: ${audit.character_persistence}`,
      `- location_persistence: ${audit.location_persistence}`,
      `- style_persistence: ${audit.style_persistence}`,
      `- motion_persistence: ${audit.motion_persistence}`,
      `- story_persistence: ${audit.story_persistence}`,
      `- source_long_sequence_validated: ${audit.source_long_sequence_validated}`,
      ''
    );
    for (const window of audit.validation_windows) {
      lines.push(
        `- window ${window.sequence_length}: character=${window.window_character_persistence} location=${window.window_location_persistence} style=${window.window_style_persistence} motion=${window.window_motion_persistence} story=${window.window_story_persistence}`
      );
    }
    lines.push('');
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
  issues: LongSequenceConsistencyValidationIssue[]
): MovieAnalysisLongSequenceConsistencyValidationReport {
  const report: MovieAnalysisLongSequenceConsistencyValidationReport = {
    report_id: 'movie-analysis-long-sequence-validation-report-v1',
    phase: LONG_SEQUENCE_CONSISTENCY_VALIDATION_PHASE,
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
    level2_final_certification_v2_report_path: LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    long_sequence_validation_export_dir: LONG_SEQUENCE_VALIDATION_EXPORT_DIR,
    long_sequence_validation_manifest_path: LONG_SEQUENCE_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: 0,
    adapter_count: 0,
    sequence_lengths_tested: SEQUENCE_LENGTHS_TESTED,
    character_persistence: 'FAIL',
    location_persistence: 'FAIL',
    style_persistence: 'FAIL',
    motion_persistence: 'FAIL',
    story_persistence: 'FAIL',
    dna_binding_preserved: 'FAIL',
    adapter_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    long_sequence_identity_break: true,
    long_sequence_location_break: true,
    long_sequence_style_break: true,
    long_sequence_motion_break: true,
    long_sequence_story_break: true,
    long_sequence_consistency_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: [],
    final_verdict: LONG_SEQUENCE_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LONG_SEQUENCE_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LONG_SEQUENCE_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLongSequenceConsistencyValidation(
  projectRoot?: string
): MovieAnalysisLongSequenceConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: LongSequenceConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const level2FinalPath = path.join(root, LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH);
  if (!fs.existsSync(level2FinalPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const level2FinalReport = JSON.parse(fs.readFileSync(level2FinalPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (
    level2FinalReport.final_verdict !== LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT ||
    level2FinalReport.certification_status !== LEVEL2_FULLY_CERTIFIED_V2_STATUS
  ) {
    issues.push({
      code: 'LEVEL2_FINAL_CERTIFICATION_V2_NOT_PASS',
      message: `Required ${LEVEL2_FINAL_CERTIFICATION_V2_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const masterManifestPath = path.join(root, VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH);
  if (!fs.existsSync(masterManifestPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const masterManifest = JSON.parse(
    fs.readFileSync(masterManifestPath, 'utf8')
  ) as MovieAnalysisRealVideoMasterCertificationManifest;

  const traceability = validateTraceability(root, masterManifest);
  if (traceability.dna_binding_preserved === 'FAIL') {
    issues.push({
      code: 'DNA_BINDING_NOT_PRESERVED',
      message: 'DNA binding is not preserved for long sequence validation',
      severity: 'error',
    });
  }
  if (traceability.adapter_binding_preserved === 'FAIL') {
    issues.push({
      code: 'ADAPTER_BINDING_NOT_PRESERVED',
      message: 'Adapter binding is not preserved for long sequence validation',
      severity: 'error',
    });
  }
  if (traceability.traceability_preserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability is not preserved for long sequence validation',
      severity: 'error',
    });
  }

  const exportEntries: SourceLongSequenceValidationExport[] = [];
  const sourceAudits: SourceLongSequenceConsistencyAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const bundle = loadSnapshotBundle(root, sourceId);
    if (!bundle) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing video snapshot bundle for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
      continue;
    }

    const validationWindows = SEQUENCE_LENGTH_WINDOWS.map((sequenceLength) =>
      validateWindow(bundle, sequenceLength)
    );

    const characterPersistence = toStatus(
      validationWindows.every((window) => window.window_character_persistence === 'PASS')
    );
    const locationPersistence = toStatus(
      validationWindows.every((window) => window.window_location_persistence === 'PASS')
    );
    const stylePersistence = toStatus(
      validationWindows.every((window) => window.window_style_persistence === 'PASS')
    );
    const motionPersistence = toStatus(
      validationWindows.every((window) => window.window_motion_persistence === 'PASS')
    );
    const storyPersistence = toStatus(
      validationWindows.every((window) => window.window_story_persistence === 'PASS')
    );

    const identityBreak = characterPersistence === 'FAIL';
    const locationBreak = locationPersistence === 'FAIL';
    const styleBreak = stylePersistence === 'FAIL';
    const motionBreak = motionPersistence === 'FAIL';
    const storyBreak = storyPersistence === 'FAIL';

    if (identityBreak) {
      issues.push({
        code: 'LONG_SEQUENCE_IDENTITY_BREAK',
        message: `Character persistence failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (locationBreak) {
      issues.push({
        code: 'LONG_SEQUENCE_LOCATION_BREAK',
        message: `Location persistence failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (styleBreak) {
      issues.push({
        code: 'LONG_SEQUENCE_STYLE_BREAK',
        message: `Style persistence failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (motionBreak) {
      issues.push({
        code: 'LONG_SEQUENCE_MOTION_BREAK',
        message: `Motion persistence failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (storyBreak) {
      issues.push({
        code: 'LONG_SEQUENCE_STORY_BREAK',
        message: `Story persistence failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }

    const sourceValidated = toStatus(
      characterPersistence === 'PASS' &&
        locationPersistence === 'PASS' &&
        stylePersistence === 'PASS' &&
        motionPersistence === 'PASS' &&
        storyPersistence === 'PASS'
    );

    const exportEntry: SourceLongSequenceValidationExport = {
      source_id: sourceId,
      base_clip_frame_count: BASE_CLIP_FRAME_COUNT,
      validation_windows: validationWindows,
      source_long_sequence_validated: sourceValidated,
    };
    exportEntries.push(exportEntry);

    sourceAudits.push({
      source_id: sourceId,
      character_persistence: characterPersistence,
      location_persistence: locationPersistence,
      style_persistence: stylePersistence,
      motion_persistence: motionPersistence,
      story_persistence: storyPersistence,
      long_sequence_identity_break: identityBreak,
      long_sequence_location_break: locationBreak,
      long_sequence_style_break: styleBreak,
      long_sequence_motion_break: motionBreak,
      long_sequence_story_break: storyBreak,
      validation_windows: validationWindows,
      source_long_sequence_validated: sourceValidated,
    });

    fs.mkdirSync(path.join(root, LONG_SEQUENCE_VALIDATION_EXPORT_DIR), { recursive: true });
    fs.writeFileSync(
      path.join(root, LONG_SEQUENCE_VALIDATION_EXPORT_DIR, `${sourceId}-long-sequence-validation.json`),
      `${JSON.stringify(exportEntry, null, 2)}\n`,
      'utf8'
    );
  }

  if (sourceAudits.length !== EXPECTED_SOURCE_COUNT) {
    return writeFailReport(root, timestamp, issues);
  }

  const characterPersistence = aggregateStatus(sourceAudits, 'character_persistence');
  const locationPersistence = aggregateStatus(sourceAudits, 'location_persistence');
  const stylePersistence = aggregateStatus(sourceAudits, 'style_persistence');
  const motionPersistence = aggregateStatus(sourceAudits, 'motion_persistence');
  const storyPersistence = aggregateStatus(sourceAudits, 'story_persistence');

  const longSequenceIdentityBreak = sourceAudits.some((audit) => audit.long_sequence_identity_break);
  const longSequenceLocationBreak = sourceAudits.some((audit) => audit.long_sequence_location_break);
  const longSequenceStyleBreak = sourceAudits.some((audit) => audit.long_sequence_style_break);
  const longSequenceMotionBreak = sourceAudits.some((audit) => audit.long_sequence_motion_break);
  const longSequenceStoryBreak = sourceAudits.some((audit) => audit.long_sequence_story_break);

  const gateChecks: ValidationStatus[] = [
    characterPersistence,
    locationPersistence,
    stylePersistence,
    motionPersistence,
    storyPersistence,
    traceability.dna_binding_preserved,
    traceability.adapter_binding_preserved,
    traceability.traceability_preserved,
  ];

  const longSequenceConsistencyValidationReady =
    gateChecks.every((status) => status === 'PASS') &&
    !longSequenceIdentityBreak &&
    !longSequenceLocationBreak &&
    !longSequenceStyleBreak &&
    !longSequenceMotionBreak &&
    !longSequenceStoryBreak &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = longSequenceConsistencyValidationReady === 'PASS';

  const manifest: MovieAnalysisLongSequenceValidationManifest = {
    manifest_id: 'movie-analysis-long-sequence-validation-manifest-v1',
    phase: LONG_SEQUENCE_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    sequence_length_windows: [...SEQUENCE_LENGTH_WINDOWS],
    source_count: EXPECTED_SOURCE_COUNT,
    sequence_lengths_tested: SEQUENCE_LENGTHS_TESTED,
    entries: exportEntries,
  };

  fs.mkdirSync(path.join(root, LONG_SEQUENCE_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LONG_SEQUENCE_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisLongSequenceConsistencyValidationReport = {
    report_id: 'movie-analysis-long-sequence-validation-report-v1',
    phase: LONG_SEQUENCE_CONSISTENCY_VALIDATION_PHASE,
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
    level2_final_certification_v2_report_path: LEVEL2_FINAL_CERTIFICATION_V2_REPORT_PATH,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    long_sequence_validation_export_dir: LONG_SEQUENCE_VALIDATION_EXPORT_DIR,
    long_sequence_validation_manifest_path: LONG_SEQUENCE_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    sequence_lengths_tested: SEQUENCE_LENGTHS_TESTED,
    character_persistence: characterPersistence,
    location_persistence: locationPersistence,
    style_persistence: stylePersistence,
    motion_persistence: motionPersistence,
    story_persistence: storyPersistence,
    dna_binding_preserved: traceability.dna_binding_preserved,
    adapter_binding_preserved: traceability.adapter_binding_preserved,
    traceability_preserved: traceability.traceability_preserved,
    long_sequence_identity_break: longSequenceIdentityBreak,
    long_sequence_location_break: longSequenceLocationBreak,
    long_sequence_style_break: longSequenceStyleBreak,
    long_sequence_motion_break: longSequenceMotionBreak,
    long_sequence_story_break: longSequenceStoryBreak,
    long_sequence_consistency_validation_ready: longSequenceConsistencyValidationReady,
    certification_status: pass ? LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT
      : LONG_SEQUENCE_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LONG_SEQUENCE_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LONG_SEQUENCE_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
