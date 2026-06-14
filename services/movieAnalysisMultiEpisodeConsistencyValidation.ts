import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
  STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
  STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH,
} from './movieAnalysisStoryArcConsistencyValidation.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import { SOURCE_LOCATION_DNA_ANCHORS } from './movieAnalysisRealLocationConsistencyValidation.js';
import {
  MAX_EMOTION_STEP,
  MAX_NARRATIVE_BREAK_GAP,
} from './movieAnalysisSequenceCoherenceValidation.js';
import {
  MAX_CROSS_FRAME_LOCATION_DRIFT,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import {
  MAX_FACE_IDENTITY_DRIFT,
  MAX_FRAME_IDENTITY_DRIFT,
  MAX_HAIRSTYLE_DRIFT,
  MAX_CLOTHING_DRIFT,
  MIN_FACE_ZONE_VARIANCE,
  VIDEO_IDENTITY_DIR,
  type VideoIdentityFrameSnapshot,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { VIDEO_LOCATION_DIR } from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import { VIDEO_STYLE_DIR } from './movieAnalysisRealVideoStyleConsistencyValidation.js';
import { VIDEO_MOTION_DIR } from './movieAnalysisRealVideoMotionConsistencyValidation.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MULTI_EPISODE_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2E-009-MULTI_EPISODE_CONSISTENCY_VALIDATION_V1' as const;
export const MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_MULTI_EPISODE_CONSISTENCY_VALIDATION_V1' as const;
export const MULTI_EPISODE_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_MULTI_EPISODE_CONSISTENCY_VALIDATION_V1' as const;
export const MULTI_EPISODE_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'MULTI_EPISODE_CONSISTENCY_VALIDATED' as const;
export const MULTI_EPISODE_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_multi_episode_consistency_validation' as const;
export const MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_multi_episode_consistency_validation/movie-analysis-multi-episode-consistency-validation-report.json' as const;
export const MULTI_EPISODE_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_multi_episode_consistency_validation/MOVIE_ANALYSIS_MULTI_EPISODE_CONSISTENCY_VALIDATION.md' as const;
export const MULTI_EPISODE_CONSISTENCY_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_multi_episode_consistency_validation' as const;
export const MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_multi_episode_consistency_validation/movie-analysis-multi-episode-consistency-validation-manifest.json' as const;

export const EPISODE_IDS = [
  'Episode 1',
  'Episode 2',
  'Episode 3',
  'Episode 4',
  'Final Callback Episode',
] as const;
export const EPISODE_COUNT = EPISODE_IDS.length;
export const EPISODE_TRANSITION_COUNT = EPISODE_COUNT - 1;
export const ANCHOR_EPISODE_ID = 'Episode 1' as const;
export const FINAL_CALLBACK_EPISODE_ID = 'Final Callback Episode' as const;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const ENTRY_FRAME_INDEX = 0;
export const EXIT_FRAME_INDEX = BASE_CLIP_FRAME_COUNT - 1;

export const MAX_CROSS_EPISODE_CHARACTER_DRIFT = 0.35 as const;
export const MAX_CROSS_EPISODE_LOCATION_DRIFT = MAX_CROSS_FRAME_LOCATION_DRIFT;
export const MAX_CROSS_EPISODE_STORY_GAP = MAX_NARRATIVE_BREAK_GAP;
export const MAX_CHARACTER_GROWTH_REGRESSION = MAX_EMOTION_STEP;
export const MAX_CALLBACK_IDENTITY_DRIFT = MAX_FACE_IDENTITY_DRIFT;
export const MAX_EPISODE_MEMORY_DRIFT = MAX_FRAME_IDENTITY_DRIFT;

export const EPISODE_SOURCE_MAP: Record<
  (typeof EPISODE_IDS)[number],
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
> = {
  'Episode 1': 'GHIBLI_01',
  'Episode 2': 'LITTLE_WOMEN_01',
  'Episode 3': 'MORI_01',
  'Episode 4': 'SHINKAI_01',
  'Final Callback Episode': 'GHIBLI_01',
};

export const EPISODE_RELATIONSHIP_STAGES: Record<(typeof EPISODE_IDS)[number], string> = {
  'Episode 1': 'establishment',
  'Episode 2': 'deepening',
  'Episode 3': 'conflict',
  'Episode 4': 'culmination',
  'Final Callback Episode': 'resolution',
};

const RELATIONSHIP_STAGE_ORDER: Record<string, number> = {
  establishment: 0,
  deepening: 1,
  conflict: 2,
  culmination: 3,
  resolution: 4,
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type MultiEpisodeConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  episode_id?: string;
  transition_id?: string;
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

export type EpisodeSnapshotBundle = {
  episode_id: (typeof EPISODE_IDS)[number];
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  relationship_stage: string;
  relationship_stage_order: number;
  location_dna_id: string;
  indoor_anchor_id: string;
  lighting_anchor_id: string;
  identity_frames: VideoIdentityFrameSnapshot[];
  location_frames: VideoLocationFrameSnapshot[];
  style_frames: VideoStyleFrameSnapshot[];
  motion_frames: VideoMotionFrameSnapshot[];
  test_result: RealModelTestGenerationResult | null;
};

export type SeriesAnchor = {
  episode_id: typeof ANCHOR_EPISODE_ID;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
  identity_signature: string;
  location_signature: string;
  series_memory_signature: string;
  growth_score: number;
  relationship_stage: string;
};

export type EpisodeTransitionValidation = {
  transition_id: string;
  from_episode_id: (typeof EPISODE_IDS)[number];
  to_episode_id: (typeof EPISODE_IDS)[number];
  episode_to_episode_consistency: ValidationStatus;
  character_growth_preservation: ValidationStatus;
  relationship_progression_preservation: ValidationStatus;
  location_recall_preservation: ValidationStatus;
  series_continuity: ValidationStatus;
  episode_memory_loss: boolean;
  series_reset: boolean;
  relationship_regression: boolean;
  continuity_break: boolean;
  transition_validated: ValidationStatus;
};

export type FinalCallbackValidation = {
  callback_episode_id: typeof FINAL_CALLBACK_EPISODE_ID;
  anchor_episode_id: typeof ANCHOR_EPISODE_ID;
  cross_episode_callback: ValidationStatus;
  location_recall_preservation: ValidationStatus;
  character_growth_preservation: ValidationStatus;
  callback_failure: boolean;
  episode_memory_loss: boolean;
  callback_validated: ValidationStatus;
};

export type MovieAnalysisMultiEpisodeConsistencyValidationManifest = {
  manifest_id: string;
  phase: typeof MULTI_EPISODE_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  story_arc_consistency_validation_manifest_path: typeof STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH;
  episode_path: Array<{
    episode_id: (typeof EPISODE_IDS)[number];
    source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  }>;
  series_anchor: SeriesAnchor;
  episode_bundles: EpisodeSnapshotBundle[];
  episode_transitions: EpisodeTransitionValidation[];
  final_callback_validation: FinalCallbackValidation;
};

export type MovieAnalysisMultiEpisodeConsistencyValidationReport = {
  report_id: string;
  phase: typeof MULTI_EPISODE_CONSISTENCY_VALIDATION_PHASE;
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
  story_arc_consistency_validation_report_path: typeof STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH;
  story_arc_consistency_validation_manifest_path: typeof STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH;
  multi_episode_consistency_validation_export_dir: typeof MULTI_EPISODE_CONSISTENCY_VALIDATION_EXPORT_DIR;
  multi_episode_consistency_validation_manifest_path: typeof MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH;
  video_identity_dir: typeof VIDEO_IDENTITY_DIR;
  video_location_dir: typeof VIDEO_LOCATION_DIR;
  video_style_dir: typeof VIDEO_STYLE_DIR;
  video_motion_dir: typeof VIDEO_MOTION_DIR;
  source_count: number;
  adapter_count: number;
  episode_count: typeof EPISODE_COUNT;
  episode_transition_count: typeof EPISODE_TRANSITION_COUNT;
  episode_to_episode_consistency: ValidationStatus;
  character_growth_preservation: ValidationStatus;
  relationship_progression_preservation: ValidationStatus;
  location_recall_preservation: ValidationStatus;
  cross_episode_callback: ValidationStatus;
  series_continuity: ValidationStatus;
  dna_binding_preserved: ValidationStatus;
  adapter_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  episode_memory_loss: boolean;
  series_reset: boolean;
  relationship_regression: boolean;
  callback_failure: boolean;
  continuity_break: boolean;
  traceability_loss: boolean;
  multi_episode_consistency_validation_ready: ValidationStatus;
  certification_status: typeof MULTI_EPISODE_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  series_anchor: SeriesAnchor;
  episode_bundles: EpisodeSnapshotBundle[];
  episode_transitions: EpisodeTransitionValidation[];
  final_callback_validation: FinalCallbackValidation;
  final_verdict:
    | typeof MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof MULTI_EPISODE_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: MultiEpisodeConsistencyValidationIssue[];
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

function storyStageIndex(frameIndex: number): number {
  return Math.min(3, Math.floor((frameIndex % BASE_CLIP_FRAME_COUNT) / 2));
}

function growthScore(
  style: VideoStyleFrameSnapshot,
  motion: VideoMotionFrameSnapshot,
  identity: VideoIdentityFrameSnapshot
): number {
  return clamp01(
    style.lighting_warmth * 0.45 +
      motion.luminance * 0.25 +
      motion.motion_speed * 0.15 +
      identity.face_zone_variance / 100
  );
}

function locationCompositeDrift(a: VideoLocationFrameSnapshot, b: VideoLocationFrameSnapshot): number {
  return (
    colorDistance(a.sky_zone_rgb, b.sky_zone_rgb) * 0.4 +
    colorDistance(a.midground_zone_rgb, b.midground_zone_rgb) * 0.35 +
    colorDistance(a.ground_zone_rgb, b.ground_zone_rgb) * 0.25
  );
}

function seriesMemorySignature(bundle: EpisodeSnapshotBundle, frameIndex: number): string {
  const identity = bundle.identity_frames[frameIndex];
  const location = bundle.location_frames[frameIndex];
  const style = bundle.style_frames[frameIndex];
  const motion = bundle.motion_frames[frameIndex];
  return createHash('sha256')
    .update(
      [
        bundle.episode_id,
        bundle.source_id,
        identity.identity_signature,
        location.location_signature,
        style.style_signature,
        motion.motion_signature,
        bundle.relationship_stage,
      ].join('|')
    )
    .digest('hex')
    .slice(0, 16);
}

function episodeInternalStable(bundle: EpisodeSnapshotBundle): boolean {
  const first = bundle.identity_frames[ENTRY_FRAME_INDEX];
  const last = bundle.identity_frames[EXIT_FRAME_INDEX];
  return (
    colorDistance(first.face_zone_rgb, last.face_zone_rgb) <= MAX_FRAME_IDENTITY_DRIFT &&
    first.face_zone_variance >= MIN_FACE_ZONE_VARIANCE &&
    last.face_zone_variance >= MIN_FACE_ZONE_VARIANCE
  );
}

function loadEpisodeBundle(
  root: string,
  episodeId: (typeof EPISODE_IDS)[number],
  testResults: RealModelTestGenerationResult[]
): EpisodeSnapshotBundle | null {
  const sourceId = EPISODE_SOURCE_MAP[episodeId];
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
    location_dna_id: string;
    indoor_anchor_id: string;
    lighting_anchor_id: string;
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

  const testResult = testResults.find((result) => result.source_id === sourceId) ?? null;
  const relationshipStage = EPISODE_RELATIONSHIP_STAGES[episodeId];

  return {
    episode_id: episodeId,
    source_id: sourceId,
    relationship_stage: relationshipStage,
    relationship_stage_order: RELATIONSHIP_STAGE_ORDER[relationshipStage],
    location_dna_id: location.location_dna_id,
    indoor_anchor_id: location.indoor_anchor_id,
    lighting_anchor_id: location.lighting_anchor_id,
    identity_frames: identity.frames,
    location_frames: location.frames,
    style_frames: style.frames,
    motion_frames: motion.frames,
    test_result: testResult,
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

function validateAdapterBinding(episodeBundles: EpisodeSnapshotBundle[]): ValidationStatus {
  return toStatus(
    episodeBundles.every(
      (bundle) =>
        bundle.test_result?.adapter_binding.binding_preserved === true &&
        bundle.test_result.adapter_binding.adapter_ids.some((id) =>
          id.includes('storytelling_adapter')
        ) &&
        bundle.test_result.adapter_binding.adapter_ids.some((id) =>
          id.includes('continuity_adapter')
        )
    )
  );
}

function validateTraceability(episodeBundles: EpisodeSnapshotBundle[]): ValidationStatus {
  return toStatus(
    episodeBundles.every(
      (bundle) => bundle.test_result?.traceability.traceability_preserved === true
    )
  );
}

function validateEpisodeTransition(
  fromEpisode: EpisodeSnapshotBundle,
  toEpisode: EpisodeSnapshotBundle,
  isFinalCallbackTransition: boolean
): EpisodeTransitionValidation {
  const exitIdentity = fromEpisode.identity_frames[EXIT_FRAME_INDEX];
  const entryIdentity = toEpisode.identity_frames[ENTRY_FRAME_INDEX];
  const exitLocation = fromEpisode.location_frames[EXIT_FRAME_INDEX];
  const entryLocation = toEpisode.location_frames[ENTRY_FRAME_INDEX];
  const exitStyle = fromEpisode.style_frames[EXIT_FRAME_INDEX];
  const entryStyle = toEpisode.style_frames[ENTRY_FRAME_INDEX];
  const exitMotion = fromEpisode.motion_frames[EXIT_FRAME_INDEX];
  const entryMotion = toEpisode.motion_frames[ENTRY_FRAME_INDEX];

  const characterBridgeDrift = colorDistance(exitIdentity.face_zone_rgb, entryIdentity.face_zone_rgb);
  const characterGrowthDrop =
    growthScore(exitStyle, exitMotion, exitIdentity) -
    growthScore(entryStyle, entryMotion, entryIdentity);

  const characterGrowth = isFinalCallbackTransition
    ? toStatus(true)
    : toStatus(
        episodeInternalStable(fromEpisode) &&
          episodeInternalStable(toEpisode) &&
          characterBridgeDrift <= MAX_CROSS_EPISODE_CHARACTER_DRIFT &&
          characterGrowthDrop <= MAX_CHARACTER_GROWTH_REGRESSION
      );

  const relationshipRegression =
    toEpisode.relationship_stage_order < fromEpisode.relationship_stage_order;
  const relationshipProgression = toStatus(
    !relationshipRegression &&
      toEpisode.test_result?.prompt.includes('continuity_continuity_layout') === true
  );

  const fromAnchors = SOURCE_LOCATION_DNA_ANCHORS[fromEpisode.source_id];
  const toAnchors = SOURCE_LOCATION_DNA_ANCHORS[toEpisode.source_id];
  const locationBridgeDrift = locationCompositeDrift(exitLocation, entryLocation);
  const locationRecall = isFinalCallbackTransition
    ? toStatus(true)
    : toStatus(
        fromEpisode.location_dna_id === fromAnchors.location_dna_id &&
          toEpisode.location_dna_id === toAnchors.location_dna_id &&
          locationBridgeDrift <= MAX_CROSS_EPISODE_LOCATION_DRIFT
      );

  const storyGap =
    exitStyle.style_signature === entryStyle.style_signature
      ? 0
      : clamp01(
          colorDistance(exitStyle.style_palette_rgb, entryStyle.style_palette_rgb) * 0.4 +
            Math.abs(exitMotion.motion_speed - entryMotion.motion_speed) * 0.3
        );
  const episodeConsistency = toStatus(
    storyStageIndex(EXIT_FRAME_INDEX) === 3 &&
      storyStageIndex(ENTRY_FRAME_INDEX) === 0 &&
      storyGap <= MAX_CROSS_EPISODE_STORY_GAP &&
      fromEpisode.test_result?.prompt.includes('scene_scene_resolve') === true &&
      toEpisode.test_result?.prompt.includes('scene_scene_open') === true &&
      fromEpisode.test_result?.dna_binding.binding_preserved === true &&
      toEpisode.test_result?.dna_binding.binding_preserved === true
  );

  const seriesReset =
    storyGap > MAX_CROSS_EPISODE_STORY_GAP ||
    (fromEpisode.test_result?.prompt.includes('scene_scene_resolve') !== true &&
      !isFinalCallbackTransition);

  const continuityBreak = episodeConsistency === 'FAIL';
  const episodeMemoryLoss =
    !isFinalCallbackTransition &&
    characterBridgeDrift > MAX_EPISODE_MEMORY_DRIFT &&
    fromEpisode.source_id === toEpisode.source_id;

  const seriesContinuity = toStatus(
    episodeConsistency === 'PASS' &&
      characterGrowth === 'PASS' &&
      relationshipProgression === 'PASS' &&
      locationRecall === 'PASS'
  );

  const transitionBreak =
    episodeConsistency === 'FAIL' ||
    characterGrowth === 'FAIL' ||
    relationshipProgression === 'FAIL' ||
    locationRecall === 'FAIL';

  return {
    transition_id: `${fromEpisode.episode_id}_to_${toEpisode.episode_id}`,
    from_episode_id: fromEpisode.episode_id,
    to_episode_id: toEpisode.episode_id,
    episode_to_episode_consistency: episodeConsistency,
    character_growth_preservation: characterGrowth,
    relationship_progression_preservation: relationshipProgression,
    location_recall_preservation: locationRecall,
    series_continuity: seriesContinuity,
    episode_memory_loss: episodeMemoryLoss,
    series_reset: seriesReset,
    relationship_regression: relationshipRegression,
    continuity_break: continuityBreak,
    transition_validated: transitionBreak ? 'FAIL' : 'PASS',
  };
}

function validateFinalCallback(
  anchorEpisode: EpisodeSnapshotBundle,
  callbackEpisode: EpisodeSnapshotBundle,
  seriesAnchor: SeriesAnchor
): FinalCallbackValidation {
  const anchorIdentity = anchorEpisode.identity_frames[ENTRY_FRAME_INDEX];
  const callbackIdentity = callbackEpisode.identity_frames[ENTRY_FRAME_INDEX];
  const anchorLocation = anchorEpisode.location_frames[ENTRY_FRAME_INDEX];
  const callbackLocation = callbackEpisode.location_frames[ENTRY_FRAME_INDEX];
  const callbackStyle = callbackEpisode.style_frames[ENTRY_FRAME_INDEX];
  const callbackMotion = callbackEpisode.motion_frames[ENTRY_FRAME_INDEX];

  const faceDrift = colorDistance(anchorIdentity.face_zone_rgb, callbackIdentity.face_zone_rgb);
  const hairDrift = colorDistance(anchorIdentity.hair_zone_rgb, callbackIdentity.hair_zone_rgb);
  const clothingDrift = colorDistance(
    anchorIdentity.clothing_zone_rgb,
    callbackIdentity.clothing_zone_rgb
  );
  const callbackSignature = seriesMemorySignature(callbackEpisode, ENTRY_FRAME_INDEX);
  const callbackBridge =
    callbackEpisode.test_result?.prompt.includes('continuity_environment_hold') === true ||
    callbackEpisode.test_result?.prompt.includes('continuity_environment_bridge') === true;

  const crossEpisodeCallback = toStatus(
    faceDrift <= MAX_CALLBACK_IDENTITY_DRIFT &&
      hairDrift <= MAX_HAIRSTYLE_DRIFT &&
      clothingDrift <= MAX_CLOTHING_DRIFT &&
      callbackIdentity.identity_signature === anchorIdentity.identity_signature &&
      callbackSignature.length > 0 &&
      seriesAnchor.series_memory_signature.length > 0 &&
      callbackBridge &&
      callbackEpisode.test_result?.adapter_binding.adapter_ids.some((id) =>
        id.includes('continuity_adapter')
      ) === true
  );

  const anchors = SOURCE_LOCATION_DNA_ANCHORS[anchorEpisode.source_id];
  const locationRecall = toStatus(
    callbackEpisode.location_dna_id === anchors.location_dna_id &&
      callbackEpisode.indoor_anchor_id === anchors.indoor_anchor_id &&
      callbackLocation.location_signature === anchorLocation.location_signature &&
      locationCompositeDrift(anchorLocation, callbackLocation) <=
        MAX_CROSS_EPISODE_LOCATION_DRIFT * 1.15
  );

  const callbackGrowth = growthScore(
    callbackStyle,
    callbackMotion,
    callbackIdentity
  );
  const characterGrowth = toStatus(
    callbackGrowth >= seriesAnchor.growth_score - MAX_CHARACTER_GROWTH_REGRESSION
  );

  const callbackFailure = crossEpisodeCallback === 'FAIL' || locationRecall === 'FAIL';
  const episodeMemoryLoss =
    callbackIdentity.identity_signature !== anchorIdentity.identity_signature ||
    faceDrift > MAX_EPISODE_MEMORY_DRIFT;

  return {
    callback_episode_id: FINAL_CALLBACK_EPISODE_ID,
    anchor_episode_id: ANCHOR_EPISODE_ID,
    cross_episode_callback: crossEpisodeCallback,
    location_recall_preservation: locationRecall,
    character_growth_preservation: characterGrowth,
    callback_failure: callbackFailure,
    episode_memory_loss: episodeMemoryLoss,
    callback_validated:
      crossEpisodeCallback === 'PASS' &&
      locationRecall === 'PASS' &&
      characterGrowth === 'PASS' &&
      !episodeMemoryLoss
        ? 'PASS'
        : 'FAIL',
  };
}

function buildMarkdown(report: MovieAnalysisMultiEpisodeConsistencyValidationReport): string {
  const lines = [
    '# Movie Analysis Multi-Episode Consistency Validation',
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
    '## Episode Path',
    '',
    'Episode 1 → Episode 2 → Episode 3 → Episode 4 → Final Callback Episode',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| episode_to_episode_consistency | ${report.episode_to_episode_consistency} |`,
    `| character_growth_preservation | ${report.character_growth_preservation} |`,
    `| relationship_progression_preservation | ${report.relationship_progression_preservation} |`,
    `| location_recall_preservation | ${report.location_recall_preservation} |`,
    `| cross_episode_callback | ${report.cross_episode_callback} |`,
    `| series_continuity | ${report.series_continuity} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| adapter_binding_preserved | ${report.adapter_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| episode_memory_loss | ${report.episode_memory_loss ? 'BLOCKED' : 'PASS'} |`,
    `| series_reset | ${report.series_reset ? 'BLOCKED' : 'PASS'} |`,
    `| relationship_regression | ${report.relationship_regression ? 'BLOCKED' : 'PASS'} |`,
    `| callback_failure | ${report.callback_failure ? 'BLOCKED' : 'PASS'} |`,
    `| continuity_break | ${report.continuity_break ? 'BLOCKED' : 'PASS'} |`,
    `| traceability_loss | ${report.traceability_loss ? 'BLOCKED' : 'PASS'} |`,
    '',
    '## Episode Transitions',
    ''
  );

  for (const transition of report.episode_transitions) {
    lines.push(
      `- ${transition.transition_id}: episode=${transition.episode_to_episode_consistency} growth=${transition.character_growth_preservation} relationship=${transition.relationship_progression_preservation} location=${transition.location_recall_preservation} continuity=${transition.series_continuity} validated=${transition.transition_validated}`
    );
  }

  lines.push(
    '',
    '## Final Callback',
    '',
    `- cross_episode_callback: ${report.final_callback_validation.cross_episode_callback}`,
    `- location_recall_preservation: ${report.final_callback_validation.location_recall_preservation}`,
    `- character_growth_preservation: ${report.final_callback_validation.character_growth_preservation}`,
    `- callback_validated: ${report.final_callback_validation.callback_validated}`,
    ''
  );

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
  issues: MultiEpisodeConsistencyValidationIssue[]
): MovieAnalysisMultiEpisodeConsistencyValidationReport {
  const emptyAnchor: SeriesAnchor = {
    episode_id: ANCHOR_EPISODE_ID,
    source_id: 'GHIBLI_01',
    frame_index: 0,
    identity_signature: '',
    location_signature: '',
    series_memory_signature: '',
    growth_score: 0,
    relationship_stage: '',
  };

  const report: MovieAnalysisMultiEpisodeConsistencyValidationReport = {
    report_id: 'movie-analysis-multi-episode-consistency-validation-report-v1',
    phase: MULTI_EPISODE_CONSISTENCY_VALIDATION_PHASE,
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
    story_arc_consistency_validation_report_path: STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
    story_arc_consistency_validation_manifest_path: STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    multi_episode_consistency_validation_export_dir: MULTI_EPISODE_CONSISTENCY_VALIDATION_EXPORT_DIR,
    multi_episode_consistency_validation_manifest_path: MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: 0,
    adapter_count: 0,
    episode_count: EPISODE_COUNT,
    episode_transition_count: EPISODE_TRANSITION_COUNT,
    episode_to_episode_consistency: 'FAIL',
    character_growth_preservation: 'FAIL',
    relationship_progression_preservation: 'FAIL',
    location_recall_preservation: 'FAIL',
    cross_episode_callback: 'FAIL',
    series_continuity: 'FAIL',
    dna_binding_preserved: 'FAIL',
    adapter_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    episode_memory_loss: true,
    series_reset: true,
    relationship_regression: true,
    callback_failure: true,
    continuity_break: true,
    traceability_loss: true,
    multi_episode_consistency_validation_ready: 'FAIL',
    certification_status: null,
    series_anchor: emptyAnchor,
    episode_bundles: [],
    episode_transitions: [],
    final_callback_validation: {
      callback_episode_id: FINAL_CALLBACK_EPISODE_ID,
      anchor_episode_id: ANCHOR_EPISODE_ID,
      cross_episode_callback: 'FAIL',
      location_recall_preservation: 'FAIL',
      character_growth_preservation: 'FAIL',
      callback_failure: true,
      episode_memory_loss: true,
      callback_validated: 'FAIL',
    },
    final_verdict: MULTI_EPISODE_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisMultiEpisodeConsistencyValidation(
  projectRoot?: string
): MovieAnalysisMultiEpisodeConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MultiEpisodeConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const storyArcPath = path.join(root, STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(storyArcPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const storyArcReport = JSON.parse(fs.readFileSync(storyArcPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (storyArcReport.final_verdict !== STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'STORY_ARC_NOT_VALIDATED',
      message: `Required ${STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (storyArcReport.certification_status !== STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE) {
    issues.push({
      code: 'STORY_ARC_NOT_VALIDATED',
      message: `Required status ${STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(path.join(root, STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH}`,
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

  const episodeBundles: EpisodeSnapshotBundle[] = [];
  for (const episodeId of EPISODE_IDS) {
    const bundle = loadEpisodeBundle(root, episodeId, testManifest.results);
    if (!bundle) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing snapshot bundle for ${episodeId}`,
        severity: 'error',
        episode_id: episodeId,
      });
      return writeFailReport(root, timestamp, issues);
    }
    episodeBundles.push(bundle);
  }

  const anchorBundle = episodeBundles.find((bundle) => bundle.episode_id === ANCHOR_EPISODE_ID)!;
  const callbackBundle = episodeBundles.find(
    (bundle) => bundle.episode_id === FINAL_CALLBACK_EPISODE_ID
  )!;
  const anchorStyle = anchorBundle.style_frames[ENTRY_FRAME_INDEX];
  const anchorMotion = anchorBundle.motion_frames[ENTRY_FRAME_INDEX];
  const anchorIdentity = anchorBundle.identity_frames[ENTRY_FRAME_INDEX];

  const seriesAnchor: SeriesAnchor = {
    episode_id: ANCHOR_EPISODE_ID,
    source_id: anchorBundle.source_id,
    frame_index: ENTRY_FRAME_INDEX,
    identity_signature: anchorIdentity.identity_signature,
    location_signature: anchorBundle.location_frames[ENTRY_FRAME_INDEX].location_signature,
    series_memory_signature: seriesMemorySignature(anchorBundle, ENTRY_FRAME_INDEX),
    growth_score: growthScore(anchorStyle, anchorMotion, anchorIdentity),
    relationship_stage: anchorBundle.relationship_stage,
  };

  const episodeTransitions: EpisodeTransitionValidation[] = [];
  for (let index = 0; index < EPISODE_IDS.length - 1; index += 1) {
    const fromEpisode = episodeBundles[index];
    const toEpisode = episodeBundles[index + 1];
    const isFinalCallbackTransition = toEpisode.episode_id === FINAL_CALLBACK_EPISODE_ID;
    const transition = validateEpisodeTransition(
      fromEpisode,
      toEpisode,
      isFinalCallbackTransition
    );

    if (transition.episode_memory_loss) {
      issues.push({
        code: 'EPISODE_MEMORY_LOSS',
        message: `Episode memory loss at ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }
    if (transition.series_reset) {
      issues.push({
        code: 'SERIES_RESET',
        message: `Series reset at ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }
    if (transition.relationship_regression) {
      issues.push({
        code: 'RELATIONSHIP_REGRESSION',
        message: `Relationship regression at ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }
    if (transition.continuity_break) {
      issues.push({
        code: 'CONTINUITY_BREAK',
        message: `Continuity break at ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }

    episodeTransitions.push(transition);
  }

  const finalCallbackValidation = validateFinalCallback(
    anchorBundle,
    callbackBundle,
    seriesAnchor
  );
  if (finalCallbackValidation.callback_failure) {
    issues.push({
      code: 'CALLBACK_FAILURE',
      message: 'Final callback episode failed series recall',
      severity: 'error',
      episode_id: FINAL_CALLBACK_EPISODE_ID,
    });
  }
  if (finalCallbackValidation.episode_memory_loss) {
    issues.push({
      code: 'EPISODE_MEMORY_LOSS',
      message: 'Episode 1 memory lost in Final Callback Episode',
      severity: 'error',
      episode_id: FINAL_CALLBACK_EPISODE_ID,
    });
  }

  const dnaBindingPreserved = validateDnaBinding(testManifest.results);
  const adapterBindingPreserved = validateAdapterBinding(episodeBundles);
  const traceabilityPreserved = validateTraceability(episodeBundles);
  const traceabilityLoss =
    dnaBindingPreserved === 'FAIL' ||
    adapterBindingPreserved === 'FAIL' ||
    traceabilityPreserved === 'FAIL';

  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Series traceability binding lost across episodes',
      severity: 'error',
    });
  }

  const episodeToEpisodeConsistency = toStatus(
    episodeTransitions.every(
      (transition) => transition.episode_to_episode_consistency === 'PASS'
    )
  );
  const characterGrowthPreservation = toStatus(
    episodeTransitions.every(
      (transition) => transition.character_growth_preservation === 'PASS'
    ) && finalCallbackValidation.character_growth_preservation === 'PASS'
  );
  const relationshipProgressionPreservation = toStatus(
    episodeTransitions.every(
      (transition) => transition.relationship_progression_preservation === 'PASS'
    )
  );
  const locationRecallPreservation = toStatus(
    episodeTransitions.every(
      (transition) => transition.location_recall_preservation === 'PASS'
    ) && finalCallbackValidation.location_recall_preservation === 'PASS'
  );
  const crossEpisodeCallback = finalCallbackValidation.cross_episode_callback;
  const seriesContinuity = toStatus(
    episodeTransitions.every((transition) => transition.series_continuity === 'PASS') &&
      finalCallbackValidation.callback_validated === 'PASS'
  );

  const episodeMemoryLoss =
    episodeTransitions.some((transition) => transition.episode_memory_loss) ||
    finalCallbackValidation.episode_memory_loss;
  const seriesReset = episodeTransitions.some((transition) => transition.series_reset);
  const relationshipRegression = episodeTransitions.some(
    (transition) => transition.relationship_regression
  );
  const callbackFailure = finalCallbackValidation.callback_failure;
  const continuityBreak = episodeTransitions.some((transition) => transition.continuity_break);

  const gateChecks: ValidationStatus[] = [
    episodeToEpisodeConsistency,
    characterGrowthPreservation,
    relationshipProgressionPreservation,
    locationRecallPreservation,
    crossEpisodeCallback,
    seriesContinuity,
    dnaBindingPreserved,
    adapterBindingPreserved,
    traceabilityPreserved,
  ];

  const multiEpisodeConsistencyValidationReady =
    gateChecks.every((status) => status === 'PASS') &&
    !episodeMemoryLoss &&
    !seriesReset &&
    !relationshipRegression &&
    !callbackFailure &&
    !continuityBreak &&
    !traceabilityLoss &&
    episodeTransitions.every((transition) => transition.transition_validated === 'PASS') &&
    finalCallbackValidation.callback_validated === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = multiEpisodeConsistencyValidationReady === 'PASS';

  const manifest: MovieAnalysisMultiEpisodeConsistencyValidationManifest = {
    manifest_id: 'movie-analysis-multi-episode-consistency-validation-manifest-v1',
    phase: MULTI_EPISODE_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    story_arc_consistency_validation_manifest_path: STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    episode_path: EPISODE_IDS.map((episodeId) => ({
      episode_id: episodeId,
      source_id: EPISODE_SOURCE_MAP[episodeId],
    })),
    series_anchor: seriesAnchor,
    episode_bundles: episodeBundles,
    episode_transitions: episodeTransitions,
    final_callback_validation: finalCallbackValidation,
  };

  fs.mkdirSync(path.join(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_EXPORT_DIR), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(
      root,
      MULTI_EPISODE_CONSISTENCY_VALIDATION_EXPORT_DIR,
      'multi-episode-series-journey.json'
    ),
    `${JSON.stringify(
      {
        episode_path: manifest.episode_path,
        series_anchor: seriesAnchor,
        episode_transitions: episodeTransitions.map((transition) => ({
          transition_id: transition.transition_id,
          episode_to_episode_consistency: transition.episode_to_episode_consistency,
          character_growth_preservation: transition.character_growth_preservation,
          relationship_progression_preservation: transition.relationship_progression_preservation,
          location_recall_preservation: transition.location_recall_preservation,
          series_continuity: transition.series_continuity,
          episode_memory_loss: transition.episode_memory_loss,
          series_reset: transition.series_reset,
          relationship_regression: transition.relationship_regression,
          continuity_break: transition.continuity_break,
          transition_validated: transition.transition_validated,
        })),
        final_callback_validation: finalCallbackValidation,
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

  const report: MovieAnalysisMultiEpisodeConsistencyValidationReport = {
    report_id: 'movie-analysis-multi-episode-consistency-validation-report-v1',
    phase: MULTI_EPISODE_CONSISTENCY_VALIDATION_PHASE,
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
    story_arc_consistency_validation_report_path: STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
    story_arc_consistency_validation_manifest_path: STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    multi_episode_consistency_validation_export_dir: MULTI_EPISODE_CONSISTENCY_VALIDATION_EXPORT_DIR,
    multi_episode_consistency_validation_manifest_path: MULTI_EPISODE_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    episode_count: EPISODE_COUNT,
    episode_transition_count: EPISODE_TRANSITION_COUNT,
    episode_to_episode_consistency: episodeToEpisodeConsistency,
    character_growth_preservation: characterGrowthPreservation,
    relationship_progression_preservation: relationshipProgressionPreservation,
    location_recall_preservation: locationRecallPreservation,
    cross_episode_callback: crossEpisodeCallback,
    series_continuity: seriesContinuity,
    dna_binding_preserved: dnaBindingPreserved,
    adapter_binding_preserved: adapterBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    episode_memory_loss: episodeMemoryLoss,
    series_reset: seriesReset,
    relationship_regression: relationshipRegression,
    callback_failure: callbackFailure,
    continuity_break: continuityBreak,
    traceability_loss: traceabilityLoss,
    multi_episode_consistency_validation_ready: multiEpisodeConsistencyValidationReady,
    certification_status: pass ? MULTI_EPISODE_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    series_anchor: seriesAnchor,
    episode_bundles: episodeBundles,
    episode_transitions: episodeTransitions,
    final_callback_validation: finalCallbackValidation,
    final_verdict: pass
      ? MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT
      : MULTI_EPISODE_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
