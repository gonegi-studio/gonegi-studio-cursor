import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH,
  LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  LONG_SEQUENCE_VALIDATION_MANIFEST_PATH,
} from './movieAnalysisLongSequenceConsistencyValidation.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import { SOURCE_LOCATION_DNA_ANCHORS } from './movieAnalysisRealLocationConsistencyValidation.js';
import { MAX_NARRATIVE_BREAK_GAP } from './movieAnalysisSequenceCoherenceValidation.js';
import { MAX_MOTION_DRIFT } from './movieAnalysisRealMultiFrameMotionConsistencyValidation.js';
import { MAX_STYLE_DRIFT } from './movieAnalysisRealMultiFrameStyleConsistencyValidation.js';
import {
  MAX_CROSS_FRAME_LOCATION_DRIFT,
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

export const MULTI_SCENE_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2E-002-MULTI_SCENE_CONSISTENCY_VALIDATION_V1' as const;
export const MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_MULTI_SCENE_CONSISTENCY_VALIDATION_V1' as const;
export const MULTI_SCENE_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_MULTI_SCENE_CONSISTENCY_VALIDATION_V1' as const;
export const MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'MULTI_SCENE_CONSISTENCY_VALIDATED' as const;
export const MULTI_SCENE_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_multi_scene_validation' as const;
export const MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_multi_scene_validation/movie-analysis-multi-scene-consistency-validation-report.json' as const;
export const MULTI_SCENE_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_multi_scene_validation/MOVIE_ANALYSIS_MULTI_SCENE_CONSISTENCY_VALIDATION.md' as const;
export const MULTI_SCENE_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_multi_scene_validation' as const;
export const MULTI_SCENE_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_multi_scene_validation/movie-analysis-multi-scene-consistency-validation-manifest.json' as const;

export const MULTI_SCENE_IDS = ['Scene A', 'Scene B', 'Scene C', 'Scene D'] as const;
export const MULTI_SCENE_COUNT = MULTI_SCENE_IDS.length;
export const SCENE_TRANSITION_COUNT = MULTI_SCENE_COUNT - 1;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const EXIT_FRAME_INDEX = BASE_CLIP_FRAME_COUNT - 1;
export const ENTRY_FRAME_INDEX = 0;

export const MAX_CROSS_SCENE_CHARACTER_DRIFT = 0.35 as const;
export const MAX_CROSS_SCENE_LOCATION_DRIFT = MAX_CROSS_FRAME_LOCATION_DRIFT;
export const MAX_CROSS_SCENE_STYLE_DRIFT = MAX_STYLE_DRIFT;
export const MAX_CROSS_SCENE_MOTION_DRIFT = MAX_MOTION_DRIFT;
export const MAX_CROSS_SCENE_STORY_GAP = MAX_NARRATIVE_BREAK_GAP;

export const SCENE_SOURCE_MAP: Record<
  (typeof MULTI_SCENE_IDS)[number],
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
> = {
  'Scene A': 'GHIBLI_01',
  'Scene B': 'LITTLE_WOMEN_01',
  'Scene C': 'MORI_01',
  'Scene D': 'SHINKAI_01',
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type MultiSceneConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  scene_id?: string;
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

export type SceneSnapshotBundle = {
  scene_id: (typeof MULTI_SCENE_IDS)[number];
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
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

export type SceneTransitionValidation = {
  transition_id: string;
  from_scene_id: (typeof MULTI_SCENE_IDS)[number];
  to_scene_id: (typeof MULTI_SCENE_IDS)[number];
  from_source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  to_source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  character_cross_scene_consistency: ValidationStatus;
  location_cross_scene_consistency: ValidationStatus;
  style_cross_scene_consistency: ValidationStatus;
  motion_cross_scene_consistency: ValidationStatus;
  story_cross_scene_continuity: ValidationStatus;
  scene_transition_break: boolean;
  character_scene_drift: boolean;
  location_scene_drift: boolean;
  style_scene_drift: boolean;
  story_continuity_break: boolean;
  transition_validated: ValidationStatus;
};

export type SceneReentryValidation = {
  reentry_id: string;
  from_scene_id: 'Scene D';
  to_scene_id: 'Scene A';
  from_source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  to_source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  character_reentry_consistency: ValidationStatus;
  location_reentry_consistency: ValidationStatus;
  reentry_validated: ValidationStatus;
};

export type MovieAnalysisMultiSceneConsistencyValidationManifest = {
  manifest_id: string;
  phase: typeof MULTI_SCENE_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  long_sequence_validation_manifest_path: typeof LONG_SEQUENCE_VALIDATION_MANIFEST_PATH;
  video_master_certification_manifest_path: typeof VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH;
  scene_chain: Array<{
    scene_id: (typeof MULTI_SCENE_IDS)[number];
    source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  }>;
  scene_transition_count: typeof SCENE_TRANSITION_COUNT;
  transitions: SceneTransitionValidation[];
  reentry: SceneReentryValidation;
};

export type MovieAnalysisMultiSceneConsistencyValidationReport = {
  report_id: string;
  phase: typeof MULTI_SCENE_CONSISTENCY_VALIDATION_PHASE;
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
  long_sequence_consistency_validation_report_path: typeof LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH;
  long_sequence_validation_manifest_path: typeof LONG_SEQUENCE_VALIDATION_MANIFEST_PATH;
  video_master_certification_manifest_path: typeof VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH;
  multi_scene_validation_export_dir: typeof MULTI_SCENE_VALIDATION_EXPORT_DIR;
  multi_scene_validation_manifest_path: typeof MULTI_SCENE_VALIDATION_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  scene_count: typeof MULTI_SCENE_COUNT;
  scene_transition_count: typeof SCENE_TRANSITION_COUNT;
  character_cross_scene_consistency: ValidationStatus;
  location_cross_scene_consistency: ValidationStatus;
  style_cross_scene_consistency: ValidationStatus;
  motion_cross_scene_consistency: ValidationStatus;
  story_cross_scene_continuity: ValidationStatus;
  character_reentry_consistency: ValidationStatus;
  location_reentry_consistency: ValidationStatus;
  dna_binding_preserved: ValidationStatus;
  adapter_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  scene_transition_break: boolean;
  character_scene_drift: boolean;
  location_scene_drift: boolean;
  style_scene_drift: boolean;
  story_continuity_break: boolean;
  multi_scene_consistency_validation_ready: ValidationStatus;
  certification_status: typeof MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  scene_bundles: SceneSnapshotBundle[];
  scene_transitions: SceneTransitionValidation[];
  scene_reentry: SceneReentryValidation;
  final_verdict:
    | typeof MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof MULTI_SCENE_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: MultiSceneConsistencyValidationIssue[];
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

function storySignature(bundle: SceneSnapshotBundle, frameIndex: number): string {
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
      ].join('|')
    )
    .digest('hex')
    .slice(0, 12);
}

function locationCompositeDrift(a: VideoLocationFrameSnapshot, b: VideoLocationFrameSnapshot): number {
  return (
    colorDistance(a.sky_zone_rgb, b.sky_zone_rgb) * 0.4 +
    colorDistance(a.midground_zone_rgb, b.midground_zone_rgb) * 0.35 +
    colorDistance(a.ground_zone_rgb, b.ground_zone_rgb) * 0.25
  );
}

function sceneInternalIdentityStable(bundle: SceneSnapshotBundle): boolean {
  const first = bundle.identity_frames[ENTRY_FRAME_INDEX];
  const last = bundle.identity_frames[EXIT_FRAME_INDEX];
  return (
    colorDistance(first.face_zone_rgb, last.face_zone_rgb) <= MAX_FRAME_IDENTITY_DRIFT &&
    first.face_zone_variance >= 12 &&
    last.face_zone_variance >= 12
  );
}

function loadSceneBundle(
  root: string,
  sceneId: (typeof MULTI_SCENE_IDS)[number],
  testResults: RealModelTestGenerationResult[]
): SceneSnapshotBundle | null {
  const sourceId = SCENE_SOURCE_MAP[sceneId];
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

  const anchors = SOURCE_LOCATION_DNA_ANCHORS[sourceId];
  const testResult = testResults.find((result) => result.source_id === sourceId) ?? null;

  return {
    scene_id: sceneId,
    source_id: sourceId,
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

function validateTransition(
  fromScene: SceneSnapshotBundle,
  toScene: SceneSnapshotBundle
): SceneTransitionValidation {
  const exitIdentity = fromScene.identity_frames[EXIT_FRAME_INDEX];
  const entryIdentity = toScene.identity_frames[ENTRY_FRAME_INDEX];
  const exitLocation = fromScene.location_frames[EXIT_FRAME_INDEX];
  const entryLocation = toScene.location_frames[ENTRY_FRAME_INDEX];
  const exitStyle = fromScene.style_frames[EXIT_FRAME_INDEX];
  const entryStyle = toScene.style_frames[ENTRY_FRAME_INDEX];
  const exitMotion = fromScene.motion_frames[EXIT_FRAME_INDEX];
  const entryMotion = toScene.motion_frames[ENTRY_FRAME_INDEX];

  const characterBridgeDrift = colorDistance(exitIdentity.face_zone_rgb, entryIdentity.face_zone_rgb);
  const characterCrossScene = toStatus(
    sceneInternalIdentityStable(fromScene) &&
      sceneInternalIdentityStable(toScene) &&
      characterBridgeDrift <= MAX_CROSS_SCENE_CHARACTER_DRIFT &&
      fromScene.test_result?.dna_binding.binding_preserved === true &&
      toScene.test_result?.dna_binding.binding_preserved === true
  );

  const fromAnchors = SOURCE_LOCATION_DNA_ANCHORS[fromScene.source_id];
  const toAnchors = SOURCE_LOCATION_DNA_ANCHORS[toScene.source_id];
  const locationBridgeDrift = locationCompositeDrift(exitLocation, entryLocation);
  const lightingBridgeDrift = Math.abs(exitLocation.lighting_warmth - entryLocation.lighting_warmth);
  const locationCrossScene = toStatus(
    fromScene.location_dna_id === fromAnchors.location_dna_id &&
      toScene.location_dna_id === toAnchors.location_dna_id &&
      locationBridgeDrift <= MAX_CROSS_SCENE_LOCATION_DRIFT &&
      lightingBridgeDrift <= MAX_CROSS_SCENE_LOCATION_DRIFT
  );

  const styleBridgeDrift = colorDistance(exitStyle.style_palette_rgb, entryStyle.style_palette_rgb);
  const styleCrossScene = toStatus(
    styleBridgeDrift <= MAX_CROSS_SCENE_STYLE_DRIFT &&
      Math.abs(exitStyle.lighting_warmth - entryStyle.lighting_warmth) <= MAX_CROSS_SCENE_STYLE_DRIFT &&
      fromScene.test_result?.adapter_binding.adapter_ids.some((id) =>
        id.includes('transition_adapter')
      ) === true &&
      toScene.test_result?.adapter_binding.adapter_ids.some((id) =>
        id.includes('transition_adapter')
      ) === true
  );

  const motionBridgeDrift = Math.abs(exitMotion.motion_speed - entryMotion.motion_speed);
  const motionCrossScene = toStatus(
    motionBridgeDrift <= MAX_CROSS_SCENE_MOTION_DRIFT &&
      Math.abs(exitMotion.motion_direction - entryMotion.motion_direction) <= 2
  );

  const exitStory = storySignature(fromScene, EXIT_FRAME_INDEX);
  const entryStory = storySignature(toScene, ENTRY_FRAME_INDEX);
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
  const storyCrossScene = toStatus(
    storyStageIndex(EXIT_FRAME_INDEX) === 3 &&
      storyStageIndex(ENTRY_FRAME_INDEX) === 0 &&
      storyGap <= MAX_CROSS_SCENE_STORY_GAP &&
      fromScene.test_result?.prompt.includes('scene_scene_resolve') === true &&
      toScene.test_result?.prompt.includes('scene_scene_open') === true
  );

  const characterSceneDrift = characterCrossScene === 'FAIL';
  const locationSceneDrift = locationCrossScene === 'FAIL';
  const styleSceneDrift = styleCrossScene === 'FAIL';
  const storyContinuityBreak = storyCrossScene === 'FAIL';
  const sceneTransitionBreak =
    characterSceneDrift || locationSceneDrift || styleSceneDrift || storyContinuityBreak;

  return {
    transition_id: `${fromScene.scene_id}_to_${toScene.scene_id}`,
    from_scene_id: fromScene.scene_id,
    to_scene_id: toScene.scene_id,
    from_source_id: fromScene.source_id,
    to_source_id: toScene.source_id,
    character_cross_scene_consistency: characterCrossScene,
    location_cross_scene_consistency: locationCrossScene,
    style_cross_scene_consistency: styleCrossScene,
    motion_cross_scene_consistency: motionCrossScene,
    story_cross_scene_continuity: storyCrossScene,
    scene_transition_break: sceneTransitionBreak,
    character_scene_drift: characterSceneDrift,
    location_scene_drift: locationSceneDrift,
    style_scene_drift: styleSceneDrift,
    story_continuity_break: storyContinuityBreak,
    transition_validated: sceneTransitionBreak ? 'FAIL' : 'PASS',
  };
}

function validateReentry(
  fromScene: SceneSnapshotBundle,
  toScene: SceneSnapshotBundle
): SceneReentryValidation {
  const exitIdentity = fromScene.identity_frames[EXIT_FRAME_INDEX];
  const entryIdentity = toScene.identity_frames[ENTRY_FRAME_INDEX];
  const exitLocation = fromScene.location_frames[EXIT_FRAME_INDEX];
  const entryLocation = toScene.location_frames[ENTRY_FRAME_INDEX];

  const characterReentry = toStatus(
    colorDistance(exitIdentity.face_zone_rgb, entryIdentity.face_zone_rgb) <=
      MAX_CROSS_SCENE_CHARACTER_DRIFT &&
      sceneInternalIdentityStable(toScene) &&
      toScene.test_result?.dna_binding.binding_preserved === true
  );

  const toAnchors = SOURCE_LOCATION_DNA_ANCHORS[toScene.source_id];
  const locationReentry = toStatus(
    toScene.location_dna_id === toAnchors.location_dna_id &&
      toScene.indoor_anchor_id === toAnchors.indoor_anchor_id &&
      locationCompositeDrift(exitLocation, entryLocation) <=
        MAX_CROSS_SCENE_LOCATION_DRIFT * 1.15 &&
      entryLocation.location_signature === toScene.location_frames[ENTRY_FRAME_INDEX].location_signature
  );

  return {
    reentry_id: 'Scene_D_to_Scene_A_reentry',
    from_scene_id: 'Scene D',
    to_scene_id: 'Scene A',
    from_source_id: fromScene.source_id,
    to_source_id: toScene.source_id,
    character_reentry_consistency: characterReentry,
    location_reentry_consistency: locationReentry,
    reentry_validated:
      characterReentry === 'PASS' && locationReentry === 'PASS' ? 'PASS' : 'FAIL',
  };
}

function validateTraceability(
  root: string,
  masterManifest: MovieAnalysisRealVideoMasterCertificationManifest,
  sceneBundles: SceneSnapshotBundle[]
): {
  dna_binding_preserved: ValidationStatus;
  adapter_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
} {
  const testManifestPath = path.join(root, MODEL_TEST_GENERATION_MANIFEST_PATH);
  if (!fs.existsSync(testManifestPath)) {
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
      sceneBundles.every(
        (bundle) =>
          bundle.test_result?.dna_binding.binding_preserved === true &&
          bundle.test_result.traceability.cinematic_dna_id ===
            bundle.test_result.dna_binding.cinematic_dna_id
      )
  );

  const adapterBindingPreserved = toStatus(
    sceneBundles.every(
      (bundle) =>
        bundle.test_result?.adapter_binding.binding_preserved === true &&
        bundle.test_result.adapter_binding.adapter_ids.some((id) =>
          id.includes('continuity_adapter')
        ) &&
        bundle.test_result.adapter_binding.adapter_ids.some((id) =>
          id.includes('storytelling_adapter')
        )
    )
  );

  const traceabilityPreserved = toStatus(
    testManifest.results.every((result) => result.traceability.traceability_preserved === true) &&
      fs.existsSync(path.join(root, MODEL_GENERATION_TEST_PACKAGE_PATH))
  );

  return {
    dna_binding_preserved: dnaBindingPreserved,
    adapter_binding_preserved: adapterBindingPreserved,
    traceability_preserved: traceabilityPreserved,
  };
}

function buildMarkdown(report: MovieAnalysisMultiSceneConsistencyValidationReport): string {
  const lines = [
    '# Movie Analysis Multi Scene Consistency Validation',
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
    '## Scene Chain',
    '',
    'Scene A → Scene B → Scene C → Scene D',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| character_cross_scene_consistency | ${report.character_cross_scene_consistency} |`,
    `| location_cross_scene_consistency | ${report.location_cross_scene_consistency} |`,
    `| style_cross_scene_consistency | ${report.style_cross_scene_consistency} |`,
    `| motion_cross_scene_consistency | ${report.motion_cross_scene_consistency} |`,
    `| story_cross_scene_continuity | ${report.story_cross_scene_continuity} |`,
    `| character_reentry_consistency | ${report.character_reentry_consistency} |`,
    `| location_reentry_consistency | ${report.location_reentry_consistency} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| adapter_binding_preserved | ${report.adapter_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| scene_transition_break | ${report.scene_transition_break} |`,
    '',
    '## Scene Transitions',
    ''
  );

  for (const transition of report.scene_transitions) {
    lines.push(
      `### ${transition.transition_id}`,
      '',
      `- character: ${transition.character_cross_scene_consistency}`,
      `- location: ${transition.location_cross_scene_consistency}`,
      `- style: ${transition.style_cross_scene_consistency}`,
      `- motion: ${transition.motion_cross_scene_consistency}`,
      `- story: ${transition.story_cross_scene_continuity}`,
      `- validated: ${transition.transition_validated}`,
      ''
    );
  }

  lines.push(
    '## Scene Reentry',
    '',
    `- character_reentry_consistency: ${report.scene_reentry.character_reentry_consistency}`,
    `- location_reentry_consistency: ${report.scene_reentry.location_reentry_consistency}`,
    `- reentry_validated: ${report.scene_reentry.reentry_validated}`,
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
  issues: MultiSceneConsistencyValidationIssue[]
): MovieAnalysisMultiSceneConsistencyValidationReport {
  const report: MovieAnalysisMultiSceneConsistencyValidationReport = {
    report_id: 'movie-analysis-multi-scene-consistency-validation-report-v1',
    phase: MULTI_SCENE_CONSISTENCY_VALIDATION_PHASE,
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
    long_sequence_consistency_validation_report_path: LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH,
    long_sequence_validation_manifest_path: LONG_SEQUENCE_VALIDATION_MANIFEST_PATH,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    multi_scene_validation_export_dir: MULTI_SCENE_VALIDATION_EXPORT_DIR,
    multi_scene_validation_manifest_path: MULTI_SCENE_VALIDATION_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    scene_count: MULTI_SCENE_COUNT,
    scene_transition_count: SCENE_TRANSITION_COUNT,
    character_cross_scene_consistency: 'FAIL',
    location_cross_scene_consistency: 'FAIL',
    style_cross_scene_consistency: 'FAIL',
    motion_cross_scene_consistency: 'FAIL',
    story_cross_scene_continuity: 'FAIL',
    character_reentry_consistency: 'FAIL',
    location_reentry_consistency: 'FAIL',
    dna_binding_preserved: 'FAIL',
    adapter_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    scene_transition_break: true,
    character_scene_drift: true,
    location_scene_drift: true,
    style_scene_drift: true,
    story_continuity_break: true,
    multi_scene_consistency_validation_ready: 'FAIL',
    certification_status: null,
    scene_bundles: [],
    scene_transitions: [],
    scene_reentry: {
      reentry_id: 'Scene_D_to_Scene_A_reentry',
      from_scene_id: 'Scene D',
      to_scene_id: 'Scene A',
      from_source_id: 'SHINKAI_01',
      to_source_id: 'GHIBLI_01',
      character_reentry_consistency: 'FAIL',
      location_reentry_consistency: 'FAIL',
      reentry_validated: 'FAIL',
    },
    final_verdict: MULTI_SCENE_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MULTI_SCENE_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MULTI_SCENE_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisMultiSceneConsistencyValidation(
  projectRoot?: string
): MovieAnalysisMultiSceneConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MultiSceneConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const longSequencePath = path.join(root, LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(longSequencePath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const longSequenceReport = JSON.parse(fs.readFileSync(longSequencePath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (
    longSequenceReport.final_verdict !== LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT ||
    longSequenceReport.certification_status !== LONG_SEQUENCE_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LONG_SEQUENCE_NOT_VALIDATED',
      message: `Required ${LONG_SEQUENCE_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(path.join(root, LONG_SEQUENCE_VALIDATION_MANIFEST_PATH))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${LONG_SEQUENCE_VALIDATION_MANIFEST_PATH}`,
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

  const sceneBundles: SceneSnapshotBundle[] = [];
  for (const sceneId of MULTI_SCENE_IDS) {
    const bundle = loadSceneBundle(root, sceneId, testManifest.results);
    if (!bundle) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing scene snapshot bundle for ${sceneId}`,
        severity: 'error',
        scene_id: sceneId,
      });
      continue;
    }
    sceneBundles.push(bundle);
  }

  if (sceneBundles.length !== MULTI_SCENE_COUNT) {
    return writeFailReport(root, timestamp, issues);
  }

  const sceneTransitions: SceneTransitionValidation[] = [];
  for (let index = 0; index < MULTI_SCENE_IDS.length - 1; index += 1) {
    const fromScene = sceneBundles[index];
    const toScene = sceneBundles[index + 1];
    const transition = validateTransition(fromScene, toScene);
    sceneTransitions.push(transition);

    if (transition.scene_transition_break) {
      issues.push({
        code: 'SCENE_TRANSITION_BREAK',
        message: `Scene transition failed: ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }
    if (transition.character_scene_drift) {
      issues.push({
        code: 'CHARACTER_SCENE_DRIFT',
        message: `Character drift at ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }
    if (transition.location_scene_drift) {
      issues.push({
        code: 'LOCATION_SCENE_DRIFT',
        message: `Location drift at ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }
    if (transition.style_scene_drift) {
      issues.push({
        code: 'STYLE_SCENE_DRIFT',
        message: `Style drift at ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }
    if (transition.story_continuity_break) {
      issues.push({
        code: 'STORY_CONTINUITY_BREAK',
        message: `Story continuity break at ${transition.transition_id}`,
        severity: 'error',
        transition_id: transition.transition_id,
      });
    }
  }

  const sceneA = sceneBundles[0];
  const sceneD = sceneBundles[3];
  const sceneReentry = validateReentry(sceneD, sceneA);
  if (sceneReentry.reentry_validated === 'FAIL') {
    issues.push({
      code: 'SCENE_REENTRY_BREAK',
      message: 'Scene D to Scene A reentry validation failed',
      severity: 'error',
    });
  }

  const traceability = validateTraceability(root, masterManifest, sceneBundles);
  if (traceability.dna_binding_preserved === 'FAIL') {
    issues.push({
      code: 'DNA_BINDING_NOT_PRESERVED',
      message: 'DNA binding is not preserved across scenes',
      severity: 'error',
    });
  }
  if (traceability.adapter_binding_preserved === 'FAIL') {
    issues.push({
      code: 'ADAPTER_BINDING_NOT_PRESERVED',
      message: 'Adapter binding is not preserved across scenes',
      severity: 'error',
    });
  }
  if (traceability.traceability_preserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability is not preserved across scenes',
      severity: 'error',
    });
  }

  const aggregateTransitionField = (
    field: keyof SceneTransitionValidation
  ): ValidationStatus =>
    sceneTransitions.every((transition) => transition[field] === 'PASS') ? 'PASS' : 'FAIL';

  const characterCrossSceneConsistency = aggregateTransitionField(
    'character_cross_scene_consistency'
  );
  const locationCrossSceneConsistency = aggregateTransitionField('location_cross_scene_consistency');
  const styleCrossSceneConsistency = aggregateTransitionField('style_cross_scene_consistency');
  const motionCrossSceneConsistency = aggregateTransitionField('motion_cross_scene_consistency');
  const storyCrossSceneContinuity = aggregateTransitionField('story_cross_scene_continuity');

  const sceneTransitionBreak = sceneTransitions.some((transition) => transition.scene_transition_break);
  const characterSceneDrift = sceneTransitions.some((transition) => transition.character_scene_drift);
  const locationSceneDrift = sceneTransitions.some((transition) => transition.location_scene_drift);
  const styleSceneDrift = sceneTransitions.some((transition) => transition.style_scene_drift);
  const storyContinuityBreak = sceneTransitions.some((transition) => transition.story_continuity_break);

  const gateChecks: ValidationStatus[] = [
    characterCrossSceneConsistency,
    locationCrossSceneConsistency,
    styleCrossSceneConsistency,
    motionCrossSceneConsistency,
    storyCrossSceneContinuity,
    sceneReentry.character_reentry_consistency,
    sceneReentry.location_reentry_consistency,
    traceability.dna_binding_preserved,
    traceability.adapter_binding_preserved,
    traceability.traceability_preserved,
  ];

  const multiSceneConsistencyValidationReady =
    !sceneTransitionBreak &&
    sceneReentry.reentry_validated === 'PASS' &&
    gateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = multiSceneConsistencyValidationReady === 'PASS';

  const manifest: MovieAnalysisMultiSceneConsistencyValidationManifest = {
    manifest_id: 'movie-analysis-multi-scene-consistency-validation-manifest-v1',
    phase: MULTI_SCENE_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    long_sequence_validation_manifest_path: LONG_SEQUENCE_VALIDATION_MANIFEST_PATH,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    scene_chain: sceneBundles.map((bundle) => ({
      scene_id: bundle.scene_id,
      source_id: bundle.source_id,
    })),
    scene_transition_count: SCENE_TRANSITION_COUNT,
    transitions: sceneTransitions,
    reentry: sceneReentry,
  };

  fs.mkdirSync(path.join(root, MULTI_SCENE_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MULTI_SCENE_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MULTI_SCENE_VALIDATION_EXPORT_DIR, 'multi-scene-transition-validation.json'),
    `${JSON.stringify({ transitions: sceneTransitions, reentry: sceneReentry }, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisMultiSceneConsistencyValidationReport = {
    report_id: 'movie-analysis-multi-scene-consistency-validation-report-v1',
    phase: MULTI_SCENE_CONSISTENCY_VALIDATION_PHASE,
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
    long_sequence_consistency_validation_report_path: LONG_SEQUENCE_CONSISTENCY_VALIDATION_REPORT_PATH,
    long_sequence_validation_manifest_path: LONG_SEQUENCE_VALIDATION_MANIFEST_PATH,
    video_master_certification_manifest_path: VIDEO_MASTER_CERTIFICATION_MANIFEST_PATH,
    multi_scene_validation_export_dir: MULTI_SCENE_VALIDATION_EXPORT_DIR,
    multi_scene_validation_manifest_path: MULTI_SCENE_VALIDATION_MANIFEST_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    scene_count: MULTI_SCENE_COUNT,
    scene_transition_count: SCENE_TRANSITION_COUNT,
    character_cross_scene_consistency: characterCrossSceneConsistency,
    location_cross_scene_consistency: locationCrossSceneConsistency,
    style_cross_scene_consistency: styleCrossSceneConsistency,
    motion_cross_scene_consistency: motionCrossSceneConsistency,
    story_cross_scene_continuity: storyCrossSceneContinuity,
    character_reentry_consistency: sceneReentry.character_reentry_consistency,
    location_reentry_consistency: sceneReentry.location_reentry_consistency,
    dna_binding_preserved: traceability.dna_binding_preserved,
    adapter_binding_preserved: traceability.adapter_binding_preserved,
    traceability_preserved: traceability.traceability_preserved,
    scene_transition_break: sceneTransitionBreak,
    character_scene_drift: characterSceneDrift,
    location_scene_drift: locationSceneDrift,
    style_scene_drift: styleSceneDrift,
    story_continuity_break: storyContinuityBreak,
    multi_scene_consistency_validation_ready: multiSceneConsistencyValidationReady,
    certification_status: pass ? MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    scene_bundles: sceneBundles.map((bundle) => ({
      ...bundle,
      identity_frames: bundle.identity_frames,
      location_frames: bundle.location_frames,
      style_frames: bundle.style_frames,
      motion_frames: bundle.motion_frames,
      test_result: bundle.test_result
        ? {
            source_id: bundle.test_result.source_id,
            dna_binding: bundle.test_result.dna_binding,
            adapter_binding: bundle.test_result.adapter_binding,
            traceability: bundle.test_result.traceability,
            prompt: bundle.test_result.prompt,
          }
        : null,
    })) as SceneSnapshotBundle[],
    scene_transitions: sceneTransitions,
    scene_reentry: sceneReentry,
    final_verdict: pass
      ? MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT
      : MULTI_SCENE_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MULTI_SCENE_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MULTI_SCENE_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
