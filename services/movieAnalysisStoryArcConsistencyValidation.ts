import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT,
  PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
  PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE,
  PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH,
} from './movieAnalysisProductionMemoryStressTest.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import {
  MAX_EMOTION_STEP,
  MAX_NARRATIVE_BREAK_GAP,
} from './movieAnalysisSequenceCoherenceValidation.js';
import { MAX_MOTION_DRIFT } from './movieAnalysisRealMultiFrameMotionConsistencyValidation.js';
import { MAX_STYLE_DRIFT } from './movieAnalysisRealMultiFrameStyleConsistencyValidation.js';
import {
  MAX_CROSS_FRAME_LOCATION_DRIFT,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import {
  MAX_FRAME_IDENTITY_DRIFT,
  MIN_FACE_ZONE_VARIANCE,
  VIDEO_IDENTITY_DIR,
  type VideoIdentityFrameSnapshot,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { VIDEO_LOCATION_DIR } from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import { VIDEO_STYLE_DIR } from './movieAnalysisRealVideoStyleConsistencyValidation.js';
import { VIDEO_MOTION_DIR } from './movieAnalysisRealVideoMotionConsistencyValidation.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const STORY_ARC_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2E-008-STORY_ARC_CONSISTENCY_VALIDATION_V1' as const;
export const STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_STORY_ARC_CONSISTENCY_VALIDATION_V1' as const;
export const STORY_ARC_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_STORY_ARC_CONSISTENCY_VALIDATION_V1' as const;
export const STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'STORY_ARC_CONSISTENCY_VALIDATED' as const;
export const STORY_ARC_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_story_arc_consistency_validation' as const;
export const STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_story_arc_consistency_validation/movie-analysis-story-arc-consistency-validation-report.json' as const;
export const STORY_ARC_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_story_arc_consistency_validation/MOVIE_ANALYSIS_STORY_ARC_CONSISTENCY_VALIDATION.md' as const;
export const STORY_ARC_CONSISTENCY_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_story_arc_consistency_validation' as const;
export const STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_story_arc_consistency_validation/movie-analysis-story-arc-consistency-validation-manifest.json' as const;

export const STORY_ARC_ACT_IDS = ['ACT1', 'ACT2', 'ACT3', 'ENDING'] as const;
export const STORY_ARC_ACT_COUNT = STORY_ARC_ACT_IDS.length;
export const STORY_ARC_TRANSITION_COUNT = STORY_ARC_ACT_COUNT - 1;
export const ANCHOR_ACT_ID = 'ACT1' as const;
export const ENDING_ACT_ID = 'ENDING' as const;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const ENTRY_FRAME_INDEX = 0;
export const EXIT_FRAME_INDEX = BASE_CLIP_FRAME_COUNT - 1;

export const MAX_CROSS_ACT_CHARACTER_DRIFT = 0.35 as const;
export const MAX_CROSS_ACT_LOCATION_DRIFT = MAX_CROSS_FRAME_LOCATION_DRIFT;
export const MAX_CROSS_ACT_STYLE_DRIFT = MAX_STYLE_DRIFT;
export const MAX_CROSS_ACT_MOTION_DRIFT = MAX_MOTION_DRIFT;
export const MAX_CROSS_ACT_STORY_GAP = MAX_NARRATIVE_BREAK_GAP;
export const MAX_EMOTION_ARC_RESET = MAX_EMOTION_STEP;
export const MAX_CALLBACK_MEMORY_DRIFT = MAX_FRAME_IDENTITY_DRIFT * 1.2;

export const ACT_SOURCE_MAP: Record<
  (typeof STORY_ARC_ACT_IDS)[number],
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
> = {
  ACT1: 'GHIBLI_01',
  ACT2: 'LITTLE_WOMEN_01',
  ACT3: 'MORI_01',
  ENDING: 'SHINKAI_01',
};

export const ACT_EMOTION_TOKENS: Record<(typeof STORY_ARC_ACT_IDS)[number], string> = {
  ACT1: 'emotion_emotion_release',
  ACT2: 'emotion_emotion_hold',
  ACT3: 'emotion_emotion_release',
  ENDING: 'emotion_emotion_rise',
};

export const ACT_RELATIONSHIP_STAGES: Record<(typeof STORY_ARC_ACT_IDS)[number], string> = {
  ACT1: 'establishment',
  ACT2: 'deepening',
  ACT3: 'conflict',
  ENDING: 'resolution',
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type StoryArcConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  act_id?: string;
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

export type ActSnapshotBundle = {
  act_id: (typeof STORY_ARC_ACT_IDS)[number];
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  relationship_stage: string;
  emotion_token: string;
  location_dna_id: string;
  indoor_anchor_id: string;
  lighting_anchor_id: string;
  narrative_style_id: string;
  identity_frames: VideoIdentityFrameSnapshot[];
  location_frames: VideoLocationFrameSnapshot[];
  style_frames: VideoStyleFrameSnapshot[];
  motion_frames: VideoMotionFrameSnapshot[];
  test_result: RealModelTestGenerationResult | null;
};

export type StoryArcAnchor = {
  act_id: typeof ANCHOR_ACT_ID;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
  identity_signature: string;
  story_signature: string;
  callback_memory_signature: string;
  emotion_score: number;
  relationship_stage: string;
};

export type ActTransitionValidation = {
  transition_id: string;
  from_act_id: (typeof STORY_ARC_ACT_IDS)[number];
  to_act_id: (typeof STORY_ARC_ACT_IDS)[number];
  character_arc_consistency: ValidationStatus;
  emotion_arc_consistency: ValidationStatus;
  relationship_arc_consistency: ValidationStatus;
  story_progression_consistency: ValidationStatus;
  story_arc_break: boolean;
  emotion_reset: boolean;
  relationship_reset: boolean;
  transition_validated: ValidationStatus;
};

export type StoryArcEndingValidation = {
  ending_act_id: typeof ENDING_ACT_ID;
  anchor_act_id: typeof ANCHOR_ACT_ID;
  callback_memory_consistency: ValidationStatus;
  ending_resolution_consistency: ValidationStatus;
  callback_loss: boolean;
  ending_inconsistency: boolean;
  ending_validated: ValidationStatus;
};

export type MovieAnalysisStoryArcConsistencyValidationManifest = {
  manifest_id: string;
  phase: typeof STORY_ARC_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  production_memory_stress_test_manifest_path: typeof PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH;
  story_arc_path: Array<{
    act_id: (typeof STORY_ARC_ACT_IDS)[number];
    source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  }>;
  story_arc_anchor: StoryArcAnchor;
  act_bundles: ActSnapshotBundle[];
  act_transitions: ActTransitionValidation[];
  ending_validation: StoryArcEndingValidation;
};

export type MovieAnalysisStoryArcConsistencyValidationReport = {
  report_id: string;
  phase: typeof STORY_ARC_CONSISTENCY_VALIDATION_PHASE;
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
  production_memory_stress_test_report_path: typeof PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH;
  production_memory_stress_test_manifest_path: typeof PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH;
  story_arc_consistency_validation_export_dir: typeof STORY_ARC_CONSISTENCY_VALIDATION_EXPORT_DIR;
  story_arc_consistency_validation_manifest_path: typeof STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH;
  video_identity_dir: typeof VIDEO_IDENTITY_DIR;
  video_location_dir: typeof VIDEO_LOCATION_DIR;
  video_style_dir: typeof VIDEO_STYLE_DIR;
  video_motion_dir: typeof VIDEO_MOTION_DIR;
  source_count: number;
  adapter_count: number;
  story_arc_act_count: typeof STORY_ARC_ACT_COUNT;
  story_arc_transition_count: typeof STORY_ARC_TRANSITION_COUNT;
  character_arc_consistency: ValidationStatus;
  emotion_arc_consistency: ValidationStatus;
  relationship_arc_consistency: ValidationStatus;
  story_progression_consistency: ValidationStatus;
  callback_memory_consistency: ValidationStatus;
  ending_resolution_consistency: ValidationStatus;
  story_arc_break: boolean;
  emotion_reset: boolean;
  relationship_reset: boolean;
  callback_loss: boolean;
  ending_inconsistency: boolean;
  story_arc_consistency_validation_ready: ValidationStatus;
  certification_status: typeof STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  story_arc_anchor: StoryArcAnchor;
  act_bundles: ActSnapshotBundle[];
  act_transitions: ActTransitionValidation[];
  ending_validation: StoryArcEndingValidation;
  final_verdict:
    | typeof STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof STORY_ARC_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: StoryArcConsistencyValidationIssue[];
};

type Rgb = [number, number, number];

const SEQUENCE_STAGES = ['open', 'develop', 'peak', 'resolve'] as const;

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

function emotionScore(
  style: VideoStyleFrameSnapshot,
  motion: VideoMotionFrameSnapshot
): number {
  return clamp01(
    style.lighting_warmth * 0.55 + motion.luminance * 0.25 + motion.motion_speed * 0.2
  );
}

function storySignature(bundle: ActSnapshotBundle, frameIndex: number): string {
  const identity = bundle.identity_frames[frameIndex];
  const location = bundle.location_frames[frameIndex];
  const style = bundle.style_frames[frameIndex];
  const motion = bundle.motion_frames[frameIndex];
  return createHash('sha256')
    .update(
      [
        SEQUENCE_STAGES[storyStageIndex(frameIndex)],
        identity.identity_signature,
        location.location_signature,
        style.style_signature,
        motion.motion_signature,
        bundle.relationship_stage,
      ].join('|')
    )
    .digest('hex')
    .slice(0, 12);
}

function callbackMemorySignature(bundle: ActSnapshotBundle, frameIndex: number): string {
  const identity = bundle.identity_frames[frameIndex];
  const style = bundle.style_frames[frameIndex];
  const motion = bundle.motion_frames[frameIndex];
  return createHash('sha256')
    .update(
      [
        bundle.act_id,
        bundle.source_id,
        identity.identity_signature,
        style.style_signature,
        motion.motion_signature,
        bundle.emotion_token,
        bundle.relationship_stage,
      ].join('|')
    )
    .digest('hex')
    .slice(0, 16);
}

function actInternalIdentityStable(bundle: ActSnapshotBundle): boolean {
  const first = bundle.identity_frames[ENTRY_FRAME_INDEX];
  const last = bundle.identity_frames[EXIT_FRAME_INDEX];
  return (
    colorDistance(first.face_zone_rgb, last.face_zone_rgb) <= MAX_FRAME_IDENTITY_DRIFT &&
    first.face_zone_variance >= MIN_FACE_ZONE_VARIANCE &&
    last.face_zone_variance >= MIN_FACE_ZONE_VARIANCE
  );
}

function loadActBundle(
  root: string,
  actId: (typeof STORY_ARC_ACT_IDS)[number],
  testResults: RealModelTestGenerationResult[]
): ActSnapshotBundle | null {
  const sourceId = ACT_SOURCE_MAP[actId];
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
    narrative_style_id?: string;
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

  return {
    act_id: actId,
    source_id: sourceId,
    relationship_stage: ACT_RELATIONSHIP_STAGES[actId],
    emotion_token: ACT_EMOTION_TOKENS[actId],
    location_dna_id: location.location_dna_id,
    indoor_anchor_id: location.indoor_anchor_id,
    lighting_anchor_id: location.lighting_anchor_id,
    narrative_style_id: style.narrative_style_id ?? `narrative_style_${sourceId.toLowerCase()}_v1`,
    identity_frames: identity.frames,
    location_frames: location.frames,
    style_frames: style.frames,
    motion_frames: motion.frames,
    test_result: testResult,
  };
}

function validateActTransition(
  fromAct: ActSnapshotBundle,
  toAct: ActSnapshotBundle
): ActTransitionValidation {
  const exitIdentity = fromAct.identity_frames[EXIT_FRAME_INDEX];
  const entryIdentity = toAct.identity_frames[ENTRY_FRAME_INDEX];
  const exitStyle = fromAct.style_frames[EXIT_FRAME_INDEX];
  const entryStyle = toAct.style_frames[ENTRY_FRAME_INDEX];
  const exitMotion = fromAct.motion_frames[EXIT_FRAME_INDEX];
  const entryMotion = toAct.motion_frames[ENTRY_FRAME_INDEX];

  const characterBridgeDrift = colorDistance(exitIdentity.face_zone_rgb, entryIdentity.face_zone_rgb);
  const characterArc = toStatus(
    actInternalIdentityStable(fromAct) &&
      actInternalIdentityStable(toAct) &&
      characterBridgeDrift <= MAX_CROSS_ACT_CHARACTER_DRIFT &&
      fromAct.test_result?.dna_binding.binding_preserved === true &&
      toAct.test_result?.dna_binding.binding_preserved === true
  );

  const exitEmotion = emotionScore(exitStyle, exitMotion);
  const entryEmotion = emotionScore(entryStyle, entryMotion);
  const emotionDrop = exitEmotion - entryEmotion;
  const emotionTokenPresent =
    toAct.test_result?.prompt.includes(toAct.emotion_token) === true &&
    fromAct.test_result?.prompt.includes(fromAct.emotion_token) === true;
  const emotionArc = toStatus(
    emotionTokenPresent &&
      emotionDrop <= MAX_EMOTION_ARC_RESET &&
      (toAct.act_id === 'ENDING' ? entryEmotion >= exitEmotion - MAX_EMOTION_ARC_RESET : true)
  );
  const emotionReset = emotionDrop > MAX_EMOTION_ARC_RESET || !emotionTokenPresent;

  const relationshipTokenPresent =
    toAct.test_result?.prompt.includes('continuity_continuity_layout') === true &&
    toAct.test_result?.adapter_binding.adapter_ids.some((id) =>
      id.includes('storytelling_adapter')
    ) === true;
  const relationshipStageProgress =
    fromAct.relationship_stage !== toAct.relationship_stage ||
    toAct.relationship_stage === 'resolution';
  const relationshipArc = toStatus(relationshipTokenPresent && relationshipStageProgress);
  const relationshipReset = !relationshipTokenPresent || !relationshipStageProgress;

  const exitStory = storySignature(fromAct, EXIT_FRAME_INDEX);
  const entryStory = storySignature(toAct, ENTRY_FRAME_INDEX);
  const storyGap =
    exitStory === entryStory
      ? 0
      : clamp01(
          colorDistance(exitStyle.style_palette_rgb, entryStyle.style_palette_rgb) * 0.4 +
            Math.abs(exitMotion.motion_speed - entryMotion.motion_speed) * 0.3 +
            (storyStageIndex(EXIT_FRAME_INDEX) === 3 && storyStageIndex(ENTRY_FRAME_INDEX) === 0
              ? 0
              : 0.2)
        );
  const storyProgression = toStatus(
    storyStageIndex(EXIT_FRAME_INDEX) === 3 &&
      storyStageIndex(ENTRY_FRAME_INDEX) === 0 &&
      storyGap <= MAX_CROSS_ACT_STORY_GAP &&
      fromAct.test_result?.prompt.includes('scene_scene_resolve') === true &&
      toAct.test_result?.prompt.includes('scene_scene_open') === true
  );
  const storyArcBreak = storyProgression === 'FAIL';

  const transitionBreak =
    characterArc === 'FAIL' ||
    emotionArc === 'FAIL' ||
    relationshipArc === 'FAIL' ||
    storyProgression === 'FAIL';

  return {
    transition_id: `${fromAct.act_id}_to_${toAct.act_id}`,
    from_act_id: fromAct.act_id,
    to_act_id: toAct.act_id,
    character_arc_consistency: characterArc,
    emotion_arc_consistency: emotionArc,
    relationship_arc_consistency: relationshipArc,
    story_progression_consistency: storyProgression,
    story_arc_break: storyArcBreak,
    emotion_reset: emotionReset,
    relationship_reset: relationshipReset,
    transition_validated: transitionBreak ? 'FAIL' : 'PASS',
  };
}

function validateEnding(
  anchorAct: ActSnapshotBundle,
  endingAct: ActSnapshotBundle,
  storyArcAnchor: StoryArcAnchor
): StoryArcEndingValidation {
  const anchorEntryIdentity = anchorAct.identity_frames[ENTRY_FRAME_INDEX];
  const endingExitIdentity = endingAct.identity_frames[EXIT_FRAME_INDEX];
  const endingExitStyle = endingAct.style_frames[EXIT_FRAME_INDEX];
  const endingExitMotion = endingAct.motion_frames[EXIT_FRAME_INDEX];

  const callbackDrift = colorDistance(
    anchorEntryIdentity.face_zone_rgb,
    endingExitIdentity.face_zone_rgb
  );
  const endingCallbackSignature = callbackMemorySignature(endingAct, EXIT_FRAME_INDEX);
  const callbackBridge =
    endingAct.test_result?.prompt.includes('continuity_environment_bridge') === true ||
    endingAct.test_result?.prompt.includes('continuity_environment_hold') === true;
  const callbackMemory = toStatus(
    callbackDrift <= MAX_CALLBACK_MEMORY_DRIFT &&
      callbackBridge &&
      endingCallbackSignature.length > 0 &&
      storyArcAnchor.callback_memory_signature.length > 0 &&
      endingAct.test_result?.adapter_binding.adapter_ids.some((id) =>
        id.includes('continuity_adapter')
      ) === true
  );
  const callbackLoss = callbackMemory === 'FAIL';

  const endingEmotion = emotionScore(endingExitStyle, endingExitMotion);
  const endingResolution = toStatus(
    storyStageIndex(EXIT_FRAME_INDEX) === 3 &&
      endingAct.test_result?.prompt.includes('scene_scene_resolve') === true &&
      endingAct.test_result?.prompt.includes(ACT_EMOTION_TOKENS.ENDING) === true &&
      endingAct.relationship_stage === 'resolution' &&
      endingEmotion >= storyArcAnchor.emotion_score - MAX_EMOTION_ARC_RESET &&
      Math.abs(endingExitMotion.motion_speed - anchorAct.motion_frames[ENTRY_FRAME_INDEX].motion_speed) <=
        MAX_CROSS_ACT_MOTION_DRIFT
  );
  const endingInconsistency = endingResolution === 'FAIL';

  return {
    ending_act_id: ENDING_ACT_ID,
    anchor_act_id: ANCHOR_ACT_ID,
    callback_memory_consistency: callbackMemory,
    ending_resolution_consistency: endingResolution,
    callback_loss: callbackLoss,
    ending_inconsistency: endingInconsistency,
    ending_validated:
      callbackMemory === 'PASS' && endingResolution === 'PASS' ? 'PASS' : 'FAIL',
  };
}

function buildMarkdown(report: MovieAnalysisStoryArcConsistencyValidationReport): string {
  const lines = [
    '# Movie Analysis Story Arc Consistency Validation',
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
    '## Story Arc Path',
    '',
    'ACT1 → ACT2 → ACT3 → ENDING',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| character_arc_consistency | ${report.character_arc_consistency} |`,
    `| emotion_arc_consistency | ${report.emotion_arc_consistency} |`,
    `| relationship_arc_consistency | ${report.relationship_arc_consistency} |`,
    `| story_progression_consistency | ${report.story_progression_consistency} |`,
    `| callback_memory_consistency | ${report.callback_memory_consistency} |`,
    `| ending_resolution_consistency | ${report.ending_resolution_consistency} |`,
    `| story_arc_break | ${report.story_arc_break ? 'BLOCKED' : 'PASS'} |`,
    `| emotion_reset | ${report.emotion_reset ? 'BLOCKED' : 'PASS'} |`,
    `| relationship_reset | ${report.relationship_reset ? 'BLOCKED' : 'PASS'} |`,
    `| callback_loss | ${report.callback_loss ? 'BLOCKED' : 'PASS'} |`,
    `| ending_inconsistency | ${report.ending_inconsistency ? 'BLOCKED' : 'PASS'} |`,
    '',
    '## Act Transitions',
    ''
  );

  for (const transition of report.act_transitions) {
    lines.push(
      `- ${transition.transition_id}: character=${transition.character_arc_consistency} emotion=${transition.emotion_arc_consistency} relationship=${transition.relationship_arc_consistency} story=${transition.story_progression_consistency} validated=${transition.transition_validated}`
    );
  }

  lines.push(
    '',
    '## Ending Validation',
    '',
    `- callback_memory_consistency: ${report.ending_validation.callback_memory_consistency}`,
    `- ending_resolution_consistency: ${report.ending_validation.ending_resolution_consistency}`,
    `- ending_validated: ${report.ending_validation.ending_validated}`,
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
  issues: StoryArcConsistencyValidationIssue[]
): MovieAnalysisStoryArcConsistencyValidationReport {
  const emptyAnchor: StoryArcAnchor = {
    act_id: ANCHOR_ACT_ID,
    source_id: 'GHIBLI_01',
    frame_index: 0,
    identity_signature: '',
    story_signature: '',
    callback_memory_signature: '',
    emotion_score: 0,
    relationship_stage: '',
  };

  const report: MovieAnalysisStoryArcConsistencyValidationReport = {
    report_id: 'movie-analysis-story-arc-consistency-validation-report-v1',
    phase: STORY_ARC_CONSISTENCY_VALIDATION_PHASE,
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
    production_memory_stress_test_report_path: PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
    production_memory_stress_test_manifest_path: PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH,
    story_arc_consistency_validation_export_dir: STORY_ARC_CONSISTENCY_VALIDATION_EXPORT_DIR,
    story_arc_consistency_validation_manifest_path: STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: 0,
    adapter_count: 0,
    story_arc_act_count: STORY_ARC_ACT_COUNT,
    story_arc_transition_count: STORY_ARC_TRANSITION_COUNT,
    character_arc_consistency: 'FAIL',
    emotion_arc_consistency: 'FAIL',
    relationship_arc_consistency: 'FAIL',
    story_progression_consistency: 'FAIL',
    callback_memory_consistency: 'FAIL',
    ending_resolution_consistency: 'FAIL',
    story_arc_break: true,
    emotion_reset: true,
    relationship_reset: true,
    callback_loss: true,
    ending_inconsistency: true,
    story_arc_consistency_validation_ready: 'FAIL',
    certification_status: null,
    story_arc_anchor: emptyAnchor,
    act_bundles: [],
    act_transitions: [],
    ending_validation: {
      ending_act_id: ENDING_ACT_ID,
      anchor_act_id: ANCHOR_ACT_ID,
      callback_memory_consistency: 'FAIL',
      ending_resolution_consistency: 'FAIL',
      callback_loss: true,
      ending_inconsistency: true,
      ending_validated: 'FAIL',
    },
    final_verdict: STORY_ARC_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, STORY_ARC_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, STORY_ARC_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisStoryArcConsistencyValidation(
  projectRoot?: string
): MovieAnalysisStoryArcConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: StoryArcConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const memoryStressPath = path.join(root, PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH);
  if (!fs.existsSync(memoryStressPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const memoryStressReport = JSON.parse(fs.readFileSync(memoryStressPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (
    memoryStressReport.final_verdict !== PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT ||
    memoryStressReport.certification_status !== PRODUCTION_MEMORY_STRESS_TEST_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'PRODUCTION_MEMORY_STRESS_NOT_VALIDATED',
      message: `Required ${PRODUCTION_MEMORY_STRESS_TEST_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH}`,
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

  const actBundles: ActSnapshotBundle[] = [];
  for (const actId of STORY_ARC_ACT_IDS) {
    const bundle = loadActBundle(root, actId, testManifest.results);
    if (!bundle) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing snapshot bundle for ${actId}`,
        severity: 'error',
        act_id: actId,
      });
      return writeFailReport(root, timestamp, issues);
    }
    if (bundle.test_result?.prompt.includes(bundle.emotion_token) !== true) {
      issues.push({
        code: 'EMOTION_ARC_TOKEN_MISSING',
        message: `Missing ${bundle.emotion_token} for ${actId}`,
        severity: 'error',
        act_id: actId,
      });
    }
    actBundles.push(bundle);
  }

  const anchorBundle = actBundles.find((bundle) => bundle.act_id === ANCHOR_ACT_ID)!;
  const endingBundle = actBundles.find((bundle) => bundle.act_id === ENDING_ACT_ID)!;
  const anchorStyle = anchorBundle.style_frames[ENTRY_FRAME_INDEX];
  const anchorMotion = anchorBundle.motion_frames[ENTRY_FRAME_INDEX];

  const storyArcAnchor: StoryArcAnchor = {
    act_id: ANCHOR_ACT_ID,
    source_id: anchorBundle.source_id,
    frame_index: ENTRY_FRAME_INDEX,
    identity_signature: anchorBundle.identity_frames[ENTRY_FRAME_INDEX].identity_signature,
    story_signature: storySignature(anchorBundle, ENTRY_FRAME_INDEX),
    callback_memory_signature: callbackMemorySignature(anchorBundle, ENTRY_FRAME_INDEX),
    emotion_score: emotionScore(anchorStyle, anchorMotion),
    relationship_stage: anchorBundle.relationship_stage,
  };

  const actTransitions: ActTransitionValidation[] = [];
  for (let index = 0; index < STORY_ARC_ACT_IDS.length - 1; index += 1) {
    const fromAct = actBundles[index];
    const toAct = actBundles[index + 1];
    const transition = validateActTransition(fromAct, toAct);
    if (transition.story_arc_break) {
      issues.push({
        code: 'STORY_ARC_BREAK',
        message: `Story arc break at ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }
    if (transition.emotion_reset) {
      issues.push({
        code: 'EMOTION_RESET',
        message: `Emotion reset at ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }
    if (transition.relationship_reset) {
      issues.push({
        code: 'RELATIONSHIP_RESET',
        message: `Relationship reset at ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }
    actTransitions.push(transition);
  }

  const endingValidation = validateEnding(anchorBundle, endingBundle, storyArcAnchor);
  if (endingValidation.callback_loss) {
    issues.push({
      code: 'CALLBACK_LOSS',
      message: 'ACT1 callback memory lost in ENDING',
      severity: 'error',
      act_id: ENDING_ACT_ID,
    });
  }
  if (endingValidation.ending_inconsistency) {
    issues.push({
      code: 'ENDING_INCONSISTENCY',
      message: 'ENDING resolution inconsistent with story arc',
      severity: 'error',
      act_id: ENDING_ACT_ID,
    });
  }

  const characterArcConsistency = toStatus(
    actTransitions.every((transition) => transition.character_arc_consistency === 'PASS') &&
      actInternalIdentityStable(anchorBundle) &&
      actInternalIdentityStable(endingBundle)
  );
  const emotionArcConsistency = toStatus(
    actTransitions.every((transition) => transition.emotion_arc_consistency === 'PASS')
  );
  const relationshipArcConsistency = toStatus(
    actTransitions.every((transition) => transition.relationship_arc_consistency === 'PASS')
  );
  const storyProgressionConsistency = toStatus(
    actTransitions.every((transition) => transition.story_progression_consistency === 'PASS')
  );
  const callbackMemoryConsistency = endingValidation.callback_memory_consistency;
  const endingResolutionConsistency = endingValidation.ending_resolution_consistency;

  const storyArcBreak = actTransitions.some((transition) => transition.story_arc_break);
  const emotionReset = actTransitions.some((transition) => transition.emotion_reset);
  const relationshipReset = actTransitions.some((transition) => transition.relationship_reset);
  const callbackLoss = endingValidation.callback_loss;
  const endingInconsistency = endingValidation.ending_inconsistency;

  const gateChecks: ValidationStatus[] = [
    characterArcConsistency,
    emotionArcConsistency,
    relationshipArcConsistency,
    storyProgressionConsistency,
    callbackMemoryConsistency,
    endingResolutionConsistency,
  ];

  const storyArcConsistencyValidationReady =
    gateChecks.every((status) => status === 'PASS') &&
    !storyArcBreak &&
    !emotionReset &&
    !relationshipReset &&
    !callbackLoss &&
    !endingInconsistency &&
    actTransitions.every((transition) => transition.transition_validated === 'PASS') &&
    endingValidation.ending_validated === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = storyArcConsistencyValidationReady === 'PASS';

  const manifest: MovieAnalysisStoryArcConsistencyValidationManifest = {
    manifest_id: 'movie-analysis-story-arc-consistency-validation-manifest-v1',
    phase: STORY_ARC_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    production_memory_stress_test_manifest_path: PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH,
    story_arc_path: STORY_ARC_ACT_IDS.map((actId) => ({
      act_id: actId,
      source_id: ACT_SOURCE_MAP[actId],
    })),
    story_arc_anchor: storyArcAnchor,
    act_bundles: actBundles,
    act_transitions: actTransitions,
    ending_validation: endingValidation,
  };

  fs.mkdirSync(path.join(root, STORY_ARC_CONSISTENCY_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, STORY_ARC_CONSISTENCY_VALIDATION_EXPORT_DIR, 'story-arc-journey.json'),
    `${JSON.stringify(
      {
        story_arc_path: manifest.story_arc_path,
        story_arc_anchor: storyArcAnchor,
        act_transitions: actTransitions.map((transition) => ({
          transition_id: transition.transition_id,
          character_arc_consistency: transition.character_arc_consistency,
          emotion_arc_consistency: transition.emotion_arc_consistency,
          relationship_arc_consistency: transition.relationship_arc_consistency,
          story_progression_consistency: transition.story_progression_consistency,
          story_arc_break: transition.story_arc_break,
          emotion_reset: transition.emotion_reset,
          relationship_reset: transition.relationship_reset,
          transition_validated: transition.transition_validated,
        })),
        ending_validation: endingValidation,
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

  const report: MovieAnalysisStoryArcConsistencyValidationReport = {
    report_id: 'movie-analysis-story-arc-consistency-validation-report-v1',
    phase: STORY_ARC_CONSISTENCY_VALIDATION_PHASE,
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
    production_memory_stress_test_report_path: PRODUCTION_MEMORY_STRESS_TEST_REPORT_PATH,
    production_memory_stress_test_manifest_path: PRODUCTION_MEMORY_STRESS_TEST_MANIFEST_PATH,
    story_arc_consistency_validation_export_dir: STORY_ARC_CONSISTENCY_VALIDATION_EXPORT_DIR,
    story_arc_consistency_validation_manifest_path: STORY_ARC_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    story_arc_act_count: STORY_ARC_ACT_COUNT,
    story_arc_transition_count: STORY_ARC_TRANSITION_COUNT,
    character_arc_consistency: characterArcConsistency,
    emotion_arc_consistency: emotionArcConsistency,
    relationship_arc_consistency: relationshipArcConsistency,
    story_progression_consistency: storyProgressionConsistency,
    callback_memory_consistency: callbackMemoryConsistency,
    ending_resolution_consistency: endingResolutionConsistency,
    story_arc_break: storyArcBreak,
    emotion_reset: emotionReset,
    relationship_reset: relationshipReset,
    callback_loss: callbackLoss,
    ending_inconsistency: endingInconsistency,
    story_arc_consistency_validation_ready: storyArcConsistencyValidationReady,
    certification_status: pass ? STORY_ARC_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    story_arc_anchor: storyArcAnchor,
    act_bundles: actBundles,
    act_transitions: actTransitions,
    ending_validation: endingValidation,
    final_verdict: pass
      ? STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT
      : STORY_ARC_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, STORY_ARC_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, STORY_ARC_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
