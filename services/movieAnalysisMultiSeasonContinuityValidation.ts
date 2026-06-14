import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
} from './movieAnalysisCharacterEvolutionValidation.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  MAX_CALLBACK_IDENTITY_DRIFT,
  MAX_CHARACTER_GROWTH_REGRESSION,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisMultiEpisodeConsistencyValidation.js';
import {
  RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
} from './movieAnalysisRelationshipEvolutionValidation.js';
import {
  STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
  STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisStoryArcConsistencyValidation.js';
import {
  WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
  WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
} from './movieAnalysisWorldStateMemoryValidation.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import { SOURCE_LOCATION_DNA_ANCHORS } from './movieAnalysisRealLocationConsistencyValidation.js';
import {
  MAX_FACE_IDENTITY_DRIFT,
  VIDEO_IDENTITY_DIR,
  type VideoIdentityFrameSnapshot,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import {
  MAX_CROSS_FRAME_LOCATION_DRIFT,
  VIDEO_LOCATION_DIR,
  type VideoLocationFrameSnapshot,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import {
  VIDEO_MOTION_DIR,
  type VideoMotionFrameSnapshot,
} from './movieAnalysisRealVideoMotionConsistencyValidation.js';
import {
  VIDEO_STYLE_DIR,
  type VideoStyleFrameSnapshot,
} from './movieAnalysisRealVideoStyleConsistencyValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MULTI_SEASON_CONTINUITY_VALIDATION_PHASE =
  'PHASE-LEVEL2G-004-MULTI_SEASON_CONTINUITY_VALIDATION_V1' as const;
export const MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_MULTI_SEASON_CONTINUITY_VALIDATION_V1' as const;
export const MULTI_SEASON_CONTINUITY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_MULTI_SEASON_CONTINUITY_VALIDATION_V1' as const;
export const MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE =
  'MULTI_SEASON_CONTINUITY_VALIDATED' as const;
export const MULTI_SEASON_CONTINUITY_VALIDATION_DIR =
  'reports/movie_analysis_multi_season_continuity_validation' as const;
export const MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_multi_season_continuity_validation/movie-analysis-multi-season-continuity-validation-report.json' as const;
export const MULTI_SEASON_CONTINUITY_VALIDATION_MD_PATH =
  'reports/movie_analysis_multi_season_continuity_validation/MOVIE_ANALYSIS_MULTI_SEASON_CONTINUITY_VALIDATION.md' as const;
export const MULTI_SEASON_CONTINUITY_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_multi_season_continuity_validation' as const;
export const MULTI_SEASON_CONTINUITY_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_multi_season_continuity_validation/movie-analysis-multi-season-continuity-validation-manifest.json' as const;

export const SEASON_IDS = ['Season 1', 'Season 2', 'Season 3', 'Season N'] as const;
export const LONG_TERM_CALLBACK_SEASON_ID = 'Long Term Callback' as const;
export const SERIES_REENTRY_SEASON_ID = 'Series Reentry' as const;
export const MULTI_SEASON_JOURNEY_IDS = [
  ...SEASON_IDS,
  LONG_TERM_CALLBACK_SEASON_ID,
  SERIES_REENTRY_SEASON_ID,
] as const;
export const ANCHOR_SEASON_ID = 'Season 1' as const;
export const SEASON_COUNT = SEASON_IDS.length;
export const MULTI_SEASON_JOURNEY_COUNT = MULTI_SEASON_JOURNEY_IDS.length;
export const MULTI_SEASON_TRANSITION_COUNT = MULTI_SEASON_JOURNEY_COUNT - 1;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const ENTRY_FRAME_INDEX = 0;
export const EXIT_FRAME_INDEX = BASE_CLIP_FRAME_COUNT - 1;

export const MAX_CROSS_SEASON_CHARACTER_DRIFT = 0.35 as const;
export const MAX_CROSS_SEASON_LOCATION_DRIFT = MAX_CROSS_FRAME_LOCATION_DRIFT;

export const SEASON_SOURCE_MAP: Record<
  (typeof MULTI_SEASON_JOURNEY_IDS)[number],
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
> = {
  'Season 1': 'GHIBLI_01',
  'Season 2': 'LITTLE_WOMEN_01',
  'Season 3': 'MORI_01',
  'Season N': 'SHINKAI_01',
  'Long Term Callback': 'GHIBLI_01',
  'Series Reentry': 'GHIBLI_01',
};

export const SEASON_RELATIONSHIP_STAGES: Record<(typeof MULTI_SEASON_JOURNEY_IDS)[number], string> = {
  'Season 1': 'establishment',
  'Season 2': 'deepening',
  'Season 3': 'conflict',
  'Season N': 'culmination',
  'Long Term Callback': 'resolution',
  'Series Reentry': 'resolution',
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

export type MultiSeasonContinuityValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  season_id?: string;
  transition_id?: string;
};

export type SeasonSeriesAnchor = {
  season_id: typeof ANCHOR_SEASON_ID;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  identity_signature: string;
  location_signature: string;
  series_memory_signature: string;
  growth_score: number;
  relationship_stage: string;
};

export type SeasonSnapshotBundle = {
  season_id: (typeof MULTI_SEASON_JOURNEY_IDS)[number];
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  relationship_stage: string;
  relationship_stage_order: number;
  location_dna_id: string;
  indoor_anchor_id: string;
  identity_frames: VideoIdentityFrameSnapshot[];
  location_frames: VideoLocationFrameSnapshot[];
  style_frames: VideoStyleFrameSnapshot[];
  motion_frames: VideoMotionFrameSnapshot[];
  test_result: RealModelTestGenerationResult | null;
};

export type SeasonJourneyStep = {
  step_index: number;
  season_id: (typeof MULTI_SEASON_JOURNEY_IDS)[number];
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  relationship_stage: string;
  growth_score: number;
  season_to_season_consistency: ValidationStatus;
  character_growth_carryover: ValidationStatus;
  relationship_carryover: ValidationStatus;
  world_state_carryover: ValidationStatus;
  series_arc_continuity: ValidationStatus;
};

export type SeasonTransitionValidation = {
  transition_id: string;
  from_season_id: (typeof MULTI_SEASON_JOURNEY_IDS)[number];
  to_season_id: (typeof MULTI_SEASON_JOURNEY_IDS)[number];
  season_finale_to_next_season_bridge: ValidationStatus;
  season_to_season_consistency: ValidationStatus;
  character_growth_carryover: ValidationStatus;
  relationship_carryover: ValidationStatus;
  world_state_carryover: ValidationStatus;
  series_arc_continuity: ValidationStatus;
  season_reset: boolean;
  continuity_break: boolean;
  transition_validated: ValidationStatus;
};

export type LongTermCallbackValidation = {
  season_id: typeof LONG_TERM_CALLBACK_SEASON_ID;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  long_term_callback: ValidationStatus;
  callback_loss: boolean;
  callback_validated: ValidationStatus;
};

export type MovieAnalysisMultiSeasonContinuityValidationManifest = {
  manifest_id: string;
  phase: typeof MULTI_SEASON_CONTINUITY_VALIDATION_PHASE;
  generated_at: string;
  world_state_memory_validation_report_path: typeof WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH;
  anchor_season_id: typeof ANCHOR_SEASON_ID;
  journey_path: Array<{
    season_id: (typeof MULTI_SEASON_JOURNEY_IDS)[number];
    source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  }>;
  series_anchor: SeasonSeriesAnchor;
  journey_steps: SeasonJourneyStep[];
  season_transitions: SeasonTransitionValidation[];
  long_term_callback_validation: LongTermCallbackValidation;
};

export type MovieAnalysisMultiSeasonContinuityValidationReport = {
  report_id: string;
  phase: typeof MULTI_SEASON_CONTINUITY_VALIDATION_PHASE;
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
  world_state_memory_validation_report_path: typeof WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH;
  character_evolution_validation_report_path: typeof CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH;
  relationship_evolution_validation_report_path: typeof RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH;
  multi_season_continuity_validation_export_dir: typeof MULTI_SEASON_CONTINUITY_VALIDATION_EXPORT_DIR;
  multi_season_continuity_validation_manifest_path: typeof MULTI_SEASON_CONTINUITY_VALIDATION_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  season_count: typeof SEASON_COUNT;
  multi_season_journey_count: typeof MULTI_SEASON_JOURNEY_COUNT;
  multi_season_transition_count: typeof MULTI_SEASON_TRANSITION_COUNT;
  season_to_season_consistency: ValidationStatus;
  character_growth_carryover: ValidationStatus;
  relationship_carryover: ValidationStatus;
  world_state_carryover: ValidationStatus;
  long_term_callback: ValidationStatus;
  series_arc_continuity: ValidationStatus;
  season_finale_to_next_season_bridge: ValidationStatus;
  season_reset: boolean;
  season_memory_loss: boolean;
  arc_break: boolean;
  callback_loss: boolean;
  world_state_reset: boolean;
  continuity_break: boolean;
  dna_binding_preserved: ValidationStatus;
  adapter_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  multi_season_continuity_validation_ready: ValidationStatus;
  certification_status: typeof MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE | null;
  series_anchor: SeasonSeriesAnchor;
  journey_steps: SeasonJourneyStep[];
  season_transitions: SeasonTransitionValidation[];
  long_term_callback_validation: LongTermCallbackValidation;
  final_verdict:
    | typeof MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT
    | typeof MULTI_SEASON_CONTINUITY_VALIDATION_FAIL_VERDICT;
  issues: MultiSeasonContinuityValidationIssue[];
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

function loadReport<T>(projectRoot: string, reportPath: string): T | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
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

function seriesMemorySignature(bundle: SeasonSnapshotBundle, frameIndex: number): string {
  const identity = bundle.identity_frames[frameIndex];
  const location = bundle.location_frames[frameIndex];
  const style = bundle.style_frames[frameIndex];
  const motion = bundle.motion_frames[frameIndex];
  return createHash('sha256')
    .update(
      [
        bundle.season_id,
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

function locationCompositeDrift(a: VideoLocationFrameSnapshot, b: VideoLocationFrameSnapshot): number {
  return (
    colorDistance(a.sky_zone_rgb, b.sky_zone_rgb) * 0.4 +
    colorDistance(a.midground_zone_rgb, b.midground_zone_rgb) * 0.35 +
    colorDistance(a.ground_zone_rgb, b.ground_zone_rgb) * 0.25
  );
}

function loadSeasonBundle(
  root: string,
  seasonId: (typeof MULTI_SEASON_JOURNEY_IDS)[number],
  testResults: RealModelTestGenerationResult[]
): SeasonSnapshotBundle | null {
  const sourceId = SEASON_SOURCE_MAP[seasonId];
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

  const relationshipStage = SEASON_RELATIONSHIP_STAGES[seasonId];

  return {
    season_id: seasonId,
    source_id: sourceId,
    relationship_stage: relationshipStage,
    relationship_stage_order: RELATIONSHIP_STAGE_ORDER[relationshipStage],
    location_dna_id: location.location_dna_id,
    indoor_anchor_id: location.indoor_anchor_id,
    identity_frames: identity.frames,
    location_frames: location.frames,
    style_frames: style.frames,
    motion_frames: motion.frames,
    test_result: testResults.find((result) => result.source_id === sourceId) ?? null,
  };
}

function validateDnaBinding(testResults: RealModelTestGenerationResult[]): ValidationStatus {
  return toStatus(
    testResults.length === EXPECTED_SOURCE_COUNT &&
      testResults.every(
        (result) =>
          result.dna_binding.binding_preserved === true &&
          result.traceability.cinematic_dna_id === result.dna_binding.cinematic_dna_id
      )
  );
}

function validateAdapterBinding(testResults: RealModelTestGenerationResult[]): ValidationStatus {
  return toStatus(
    testResults.length === EXPECTED_SOURCE_COUNT &&
      testResults.every((result) => result.adapter_binding.binding_preserved === true)
  );
}

function validateTraceability(testResults: RealModelTestGenerationResult[]): ValidationStatus {
  return toStatus(
    testResults.length === EXPECTED_SOURCE_COUNT &&
      testResults.every((result) => result.traceability.traceability_preserved === true)
  );
}

function validateSeasonTransition(
  fromSeason: SeasonSnapshotBundle,
  toSeason: SeasonSnapshotBundle,
  seriesAnchor: SeasonSeriesAnchor,
  isCallbackTransition: boolean
): SeasonTransitionValidation {
  const exitIdentity = fromSeason.identity_frames[EXIT_FRAME_INDEX];
  const entryIdentity = toSeason.identity_frames[ENTRY_FRAME_INDEX];
  const exitStyle = fromSeason.style_frames[EXIT_FRAME_INDEX];
  const entryStyle = toSeason.style_frames[ENTRY_FRAME_INDEX];
  const exitMotion = fromSeason.motion_frames[EXIT_FRAME_INDEX];
  const entryMotion = toSeason.motion_frames[ENTRY_FRAME_INDEX];
  const exitLocation = fromSeason.location_frames[EXIT_FRAME_INDEX];
  const entryLocation = toSeason.location_frames[ENTRY_FRAME_INDEX];

  const characterBridgeDrift = colorDistance(exitIdentity.face_zone_rgb, entryIdentity.face_zone_rgb);
  const growthDrop =
    growthScore(exitStyle, exitMotion, exitIdentity) -
    growthScore(entryStyle, entryMotion, entryIdentity);

  const characterGrowthCarryover = isCallbackTransition
    ? toStatus(true)
    : toStatus(
        characterBridgeDrift <= MAX_CROSS_SEASON_CHARACTER_DRIFT &&
          growthDrop <= MAX_CHARACTER_GROWTH_REGRESSION &&
          characterBridgeDrift <= MAX_FACE_IDENTITY_DRIFT
      );

  const relationshipRegression =
    toSeason.relationship_stage_order < fromSeason.relationship_stage_order;
  const relationshipCarryover = toStatus(
    !relationshipRegression &&
      toSeason.test_result?.prompt.includes('continuity_continuity_layout') === true
  );

  const fromAnchors = SOURCE_LOCATION_DNA_ANCHORS[fromSeason.source_id];
  const toAnchors = SOURCE_LOCATION_DNA_ANCHORS[toSeason.source_id];
  const locationBridgeDrift = locationCompositeDrift(exitLocation, entryLocation);

  const worldStateCarryover = isCallbackTransition
    ? toStatus(
        toSeason.location_dna_id === SOURCE_LOCATION_DNA_ANCHORS[toSeason.source_id].location_dna_id &&
          entryLocation.location_signature === seriesAnchor.location_signature
      )
    : toStatus(
        fromSeason.location_dna_id === fromAnchors.location_dna_id &&
          toSeason.location_dna_id === toAnchors.location_dna_id &&
          locationBridgeDrift <= MAX_CROSS_SEASON_LOCATION_DRIFT
      );

  const seasonBridge = toStatus(
    fromSeason.test_result?.prompt.includes('scene_scene_resolve') === true &&
      toSeason.test_result?.prompt.includes('scene_scene_open') === true &&
      fromSeason.test_result?.dna_binding.binding_preserved === true &&
      toSeason.test_result?.dna_binding.binding_preserved === true
  );

  const seasonToSeasonConsistency = toStatus(
    seasonBridge === 'PASS' &&
      characterGrowthCarryover === 'PASS' &&
      relationshipCarryover === 'PASS' &&
      worldStateCarryover === 'PASS'
  );

  const seriesArcContinuity = toStatus(
    seasonToSeasonConsistency === 'PASS' &&
      toSeason.relationship_stage_order >= fromSeason.relationship_stage_order
  );

  const seasonReset = relationshipRegression || seasonBridge === 'FAIL';
  const continuityBreak = seasonToSeasonConsistency === 'FAIL';

  return {
    transition_id: `${fromSeason.season_id}_to_${toSeason.season_id}`,
    from_season_id: fromSeason.season_id,
    to_season_id: toSeason.season_id,
    season_finale_to_next_season_bridge: seasonBridge,
    season_to_season_consistency: seasonToSeasonConsistency,
    character_growth_carryover: characterGrowthCarryover,
    relationship_carryover: relationshipCarryover,
    world_state_carryover: worldStateCarryover,
    series_arc_continuity: seriesArcContinuity,
    season_reset: seasonReset,
    continuity_break: continuityBreak,
    transition_validated: continuityBreak ? 'FAIL' : 'PASS',
  };
}

function validateLongTermCallback(
  anchorSeason: SeasonSnapshotBundle,
  callbackSeason: SeasonSnapshotBundle,
  seriesAnchor: SeasonSeriesAnchor
): LongTermCallbackValidation {
  const anchorIdentity = anchorSeason.identity_frames[ENTRY_FRAME_INDEX];
  const callbackIdentity = callbackSeason.identity_frames[ENTRY_FRAME_INDEX];
  const callbackLocation = callbackSeason.location_frames[ENTRY_FRAME_INDEX];

  const faceDrift = colorDistance(anchorIdentity.face_zone_rgb, callbackIdentity.face_zone_rgb);
  const callbackBridge =
    callbackSeason.test_result?.prompt.includes('continuity_environment_hold') === true ||
    callbackSeason.test_result?.prompt.includes('continuity_environment_bridge') === true;

  const longTermCallback = toStatus(
    faceDrift <= MAX_CALLBACK_IDENTITY_DRIFT &&
      callbackIdentity.identity_signature === anchorIdentity.identity_signature &&
      callbackLocation.location_signature === seriesAnchor.location_signature &&
      seriesAnchor.series_memory_signature.length > 0 &&
      callbackBridge &&
      callbackSeason.test_result?.adapter_binding.adapter_ids.some((id) =>
        id.includes('continuity_adapter')
      ) === true
  );

  return {
    season_id: LONG_TERM_CALLBACK_SEASON_ID,
    source_id: callbackSeason.source_id,
    long_term_callback: longTermCallback,
    callback_loss: longTermCallback === 'FAIL',
    callback_validated: longTermCallback,
  };
}

function buildMarkdown(report: MovieAnalysisMultiSeasonContinuityValidationReport): string {
  const lines = [
    '# Movie Analysis Multi-Season Continuity Validation',
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
    '## Season Journey',
    '',
    'Season 1 → Season 2 → Season 3 → Season N → Long Term Callback → Series Reentry',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| season_to_season_consistency | ${report.season_to_season_consistency} |`,
    `| character_growth_carryover | ${report.character_growth_carryover} |`,
    `| relationship_carryover | ${report.relationship_carryover} |`,
    `| world_state_carryover | ${report.world_state_carryover} |`,
    `| long_term_callback | ${report.long_term_callback} |`,
    `| series_arc_continuity | ${report.series_arc_continuity} |`,
    `| season_finale_to_next_season_bridge | ${report.season_finale_to_next_season_bridge} |`,
    `| season_reset | ${report.season_reset ? 'BLOCKED' : 'PASS'} |`,
    `| season_memory_loss | ${report.season_memory_loss ? 'BLOCKED' : 'PASS'} |`,
    `| arc_break | ${report.arc_break ? 'BLOCKED' : 'PASS'} |`,
    `| callback_loss | ${report.callback_loss ? 'BLOCKED' : 'PASS'} |`,
    `| world_state_reset | ${report.world_state_reset ? 'BLOCKED' : 'PASS'} |`,
    `| continuity_break | ${report.continuity_break ? 'BLOCKED' : 'PASS'} |`,
    '',
    '## Season Transitions',
    ''
  );

  for (const transition of report.season_transitions) {
    lines.push(
      `- ${transition.transition_id}: bridge=${transition.season_finale_to_next_season_bridge} consistency=${transition.season_to_season_consistency} validated=${transition.transition_validated}`
    );
  }

  lines.push(
    '',
    '## Long Term Callback',
    '',
    `- long_term_callback: ${report.long_term_callback_validation.long_term_callback}`,
    `- callback_validated: ${report.long_term_callback_validation.callback_validated}`,
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
  issues: MultiSeasonContinuityValidationIssue[]
): MovieAnalysisMultiSeasonContinuityValidationReport {
  const report: MovieAnalysisMultiSeasonContinuityValidationReport = {
    report_id: 'movie-analysis-multi-season-continuity-validation-report-v1',
    phase: MULTI_SEASON_CONTINUITY_VALIDATION_PHASE,
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
    world_state_memory_validation_report_path: WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
    character_evolution_validation_report_path: CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
    relationship_evolution_validation_report_path: RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
    multi_season_continuity_validation_export_dir: MULTI_SEASON_CONTINUITY_VALIDATION_EXPORT_DIR,
    multi_season_continuity_validation_manifest_path: MULTI_SEASON_CONTINUITY_VALIDATION_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    season_count: SEASON_COUNT,
    multi_season_journey_count: MULTI_SEASON_JOURNEY_COUNT,
    multi_season_transition_count: MULTI_SEASON_TRANSITION_COUNT,
    season_to_season_consistency: 'FAIL',
    character_growth_carryover: 'FAIL',
    relationship_carryover: 'FAIL',
    world_state_carryover: 'FAIL',
    long_term_callback: 'FAIL',
    series_arc_continuity: 'FAIL',
    season_finale_to_next_season_bridge: 'FAIL',
    season_reset: true,
    season_memory_loss: true,
    arc_break: true,
    callback_loss: true,
    world_state_reset: true,
    continuity_break: true,
    dna_binding_preserved: 'FAIL',
    adapter_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    multi_season_continuity_validation_ready: 'FAIL',
    certification_status: null,
    series_anchor: {
      season_id: ANCHOR_SEASON_ID,
      source_id: 'GHIBLI_01',
      identity_signature: '',
      location_signature: '',
      series_memory_signature: '',
      growth_score: 0,
      relationship_stage: 'establishment',
    },
    journey_steps: [],
    season_transitions: [],
    long_term_callback_validation: {
      season_id: LONG_TERM_CALLBACK_SEASON_ID,
      source_id: 'GHIBLI_01',
      long_term_callback: 'FAIL',
      callback_loss: true,
      callback_validated: 'FAIL',
    },
    final_verdict: MULTI_SEASON_CONTINUITY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MULTI_SEASON_CONTINUITY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MULTI_SEASON_CONTINUITY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisMultiSeasonContinuityValidation(
  projectRoot?: string
): MovieAnalysisMultiSeasonContinuityValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MultiSeasonContinuityValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const worldStateReport = loadReport<{
    final_verdict: string;
    world_state_memory_validation_ready: ValidationStatus;
  }>(root, WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH);
  if (
    !worldStateReport ||
    worldStateReport.final_verdict !== WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT ||
    worldStateReport.world_state_memory_validation_ready !== 'PASS'
  ) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: `Required ${WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const storyArcReport = loadReport<{ final_verdict: string }>(
    root,
    STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH
  );
  if (!storyArcReport || storyArcReport.final_verdict !== STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Required ${STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const multiEpisodeReport = loadReport<{
    final_verdict: string;
    cross_episode_callback: ValidationStatus;
    series_continuity: ValidationStatus;
  }>(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH);
  if (
    !multiEpisodeReport ||
    multiEpisodeReport.final_verdict !== MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'MISSING_UPSTREAM',
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

  const seasonBundles: SeasonSnapshotBundle[] = [];
  for (const seasonId of MULTI_SEASON_JOURNEY_IDS) {
    const bundle = loadSeasonBundle(root, seasonId, testManifest.results);
    if (!bundle) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing season snapshots for ${seasonId}`,
        severity: 'error',
        season_id: seasonId,
      });
      return writeFailReport(root, timestamp, issues);
    }
    seasonBundles.push(bundle);
  }

  const anchorBundle = seasonBundles[0];
  const anchorIdentity = anchorBundle.identity_frames[ENTRY_FRAME_INDEX];
  const anchorLocation = anchorBundle.location_frames[ENTRY_FRAME_INDEX];
  const anchorStyle = anchorBundle.style_frames[ENTRY_FRAME_INDEX];
  const anchorMotion = anchorBundle.motion_frames[ENTRY_FRAME_INDEX];

  const seriesAnchor: SeasonSeriesAnchor = {
    season_id: ANCHOR_SEASON_ID,
    source_id: anchorBundle.source_id,
    identity_signature: anchorIdentity.identity_signature,
    location_signature: anchorLocation.location_signature,
    series_memory_signature: seriesMemorySignature(anchorBundle, ENTRY_FRAME_INDEX),
    growth_score: growthScore(anchorStyle, anchorMotion, anchorIdentity),
    relationship_stage: anchorBundle.relationship_stage,
  };

  const seasonTransitions: SeasonTransitionValidation[] = [];
  for (let index = 0; index < seasonBundles.length - 1; index += 1) {
    const fromSeason = seasonBundles[index];
    const toSeason = seasonBundles[index + 1];
    const isCallbackTransition =
      toSeason.season_id === LONG_TERM_CALLBACK_SEASON_ID ||
      toSeason.season_id === SERIES_REENTRY_SEASON_ID;

    const transition = validateSeasonTransition(
      fromSeason,
      toSeason,
      seriesAnchor,
      isCallbackTransition
    );
    seasonTransitions.push(transition);

    if (transition.season_reset) {
      issues.push({
        code: 'SEASON_RESET',
        message: `Season reset detected at ${transition.transition_id}`,
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
  }

  const callbackBundle = seasonBundles.find(
    (bundle) => bundle.season_id === LONG_TERM_CALLBACK_SEASON_ID
  )!;
  const longTermCallbackValidation = validateLongTermCallback(
    anchorBundle,
    callbackBundle,
    seriesAnchor
  );

  if (longTermCallbackValidation.callback_loss) {
    issues.push({
      code: 'CALLBACK_LOSS',
      message: 'Long-term season callback failed',
      severity: 'error',
      season_id: LONG_TERM_CALLBACK_SEASON_ID,
    });
  }

  const dnaBinding = validateDnaBinding(testManifest.results);
  const adapterBinding = validateAdapterBinding(testManifest.results);
  const traceabilityPreserved = validateTraceability(testManifest.results);

  const journeySteps: SeasonJourneyStep[] = seasonBundles.map((bundle, index) => {
    const entryIdentity = bundle.identity_frames[ENTRY_FRAME_INDEX];
    const entryStyle = bundle.style_frames[ENTRY_FRAME_INDEX];
    const entryMotion = bundle.motion_frames[ENTRY_FRAME_INDEX];
    const score = growthScore(entryStyle, entryMotion, entryIdentity);
    const transition = index > 0 ? seasonTransitions[index - 1] : null;

    const characterGrowthCarryover = toStatus(
      colorDistance(anchorIdentity.face_zone_rgb, entryIdentity.face_zone_rgb) <=
        MAX_FACE_IDENTITY_DRIFT &&
        score >= seriesAnchor.growth_score - MAX_CHARACTER_GROWTH_REGRESSION
    );

    const anchors = SOURCE_LOCATION_DNA_ANCHORS[bundle.source_id];
    const worldStateCarryover = toStatus(
      bundle.location_dna_id === anchors.location_dna_id &&
        bundle.test_result?.dna_binding.binding_preserved === true
    );

    return {
      step_index: index,
      season_id: bundle.season_id,
      source_id: bundle.source_id,
      relationship_stage: bundle.relationship_stage,
      growth_score: score,
      season_to_season_consistency: transition?.season_to_season_consistency ?? 'PASS',
      character_growth_carryover: characterGrowthCarryover,
      relationship_carryover: transition?.relationship_carryover ?? 'PASS',
      world_state_carryover: worldStateCarryover,
      series_arc_continuity: transition?.series_arc_continuity ?? 'PASS',
    };
  });

  // Fix relationship_carryover for Season 1 (no transition)
  journeySteps[0].relationship_carryover = 'PASS';

  const seasonToSeasonConsistency = toStatus(
    seasonTransitions.every((transition) => transition.season_to_season_consistency === 'PASS')
  );
  const characterGrowthCarryover = toStatus(
    journeySteps.every((step) => step.character_growth_carryover === 'PASS')
  );
  const relationshipCarryover = toStatus(
    seasonTransitions.every((transition) => transition.relationship_carryover === 'PASS')
  );
  const worldStateCarryover = toStatus(
    journeySteps.every((step) => step.world_state_carryover === 'PASS')
  );
  const longTermCallback = longTermCallbackValidation.long_term_callback;
  const seriesArcContinuity = toStatus(
    seasonTransitions.every((transition) => transition.series_arc_continuity === 'PASS') &&
      multiEpisodeReport.series_continuity === 'PASS'
  );
  const seasonFinaleBridge = toStatus(
    seasonTransitions.every((transition) => transition.season_finale_to_next_season_bridge === 'PASS')
  );

  const seasonReset = seasonTransitions.some((transition) => transition.season_reset);
  const seasonMemoryLoss =
    journeySteps.some((step) => step.character_growth_carryover === 'FAIL') ||
    journeySteps.some((step) => step.world_state_carryover === 'FAIL');
  const arcBreak = seriesArcContinuity === 'FAIL';
  const callbackLoss = longTermCallbackValidation.callback_loss;
  const worldStateReset = worldStateCarryover === 'FAIL';
  const continuityBreak =
    seasonToSeasonConsistency === 'FAIL' ||
    seasonTransitions.some((transition) => transition.continuity_break);

  const gateChecks: ValidationStatus[] = [
    seasonToSeasonConsistency,
    characterGrowthCarryover,
    relationshipCarryover,
    worldStateCarryover,
    longTermCallback,
    seriesArcContinuity,
    seasonFinaleBridge,
    dnaBinding,
    adapterBinding,
    traceabilityPreserved,
  ];

  const multiSeasonContinuityValidationReady =
    !seasonReset &&
    !seasonMemoryLoss &&
    !arcBreak &&
    !callbackLoss &&
    !worldStateReset &&
    !continuityBreak &&
    gateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = multiSeasonContinuityValidationReady === 'PASS';

  const manifest: MovieAnalysisMultiSeasonContinuityValidationManifest = {
    manifest_id: 'movie-analysis-multi-season-continuity-validation-manifest-v1',
    phase: MULTI_SEASON_CONTINUITY_VALIDATION_PHASE,
    generated_at: timestamp,
    world_state_memory_validation_report_path: WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
    anchor_season_id: ANCHOR_SEASON_ID,
    journey_path: MULTI_SEASON_JOURNEY_IDS.map((seasonId) => ({
      season_id: seasonId,
      source_id: SEASON_SOURCE_MAP[seasonId],
    })),
    series_anchor: seriesAnchor,
    journey_steps: journeySteps,
    season_transitions: seasonTransitions,
    long_term_callback_validation: longTermCallbackValidation,
  };

  fs.mkdirSync(path.join(root, MULTI_SEASON_CONTINUITY_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MULTI_SEASON_CONTINUITY_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(
      root,
      MULTI_SEASON_CONTINUITY_VALIDATION_EXPORT_DIR,
      'multi-season-continuity-journey.json'
    ),
    `${JSON.stringify(
      {
        journey_path: manifest.journey_path,
        series_anchor: seriesAnchor,
        journey_steps: journeySteps,
        season_transitions: seasonTransitions,
        long_term_callback_validation: longTermCallbackValidation,
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

  const report: MovieAnalysisMultiSeasonContinuityValidationReport = {
    report_id: 'movie-analysis-multi-season-continuity-validation-report-v1',
    phase: MULTI_SEASON_CONTINUITY_VALIDATION_PHASE,
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
    world_state_memory_validation_report_path: WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
    character_evolution_validation_report_path: CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
    relationship_evolution_validation_report_path: RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH,
    multi_season_continuity_validation_export_dir: MULTI_SEASON_CONTINUITY_VALIDATION_EXPORT_DIR,
    multi_season_continuity_validation_manifest_path: MULTI_SEASON_CONTINUITY_VALIDATION_MANIFEST_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    season_count: SEASON_COUNT,
    multi_season_journey_count: MULTI_SEASON_JOURNEY_COUNT,
    multi_season_transition_count: MULTI_SEASON_TRANSITION_COUNT,
    season_to_season_consistency: seasonToSeasonConsistency,
    character_growth_carryover: characterGrowthCarryover,
    relationship_carryover: relationshipCarryover,
    world_state_carryover: worldStateCarryover,
    long_term_callback: longTermCallback,
    series_arc_continuity: seriesArcContinuity,
    season_finale_to_next_season_bridge: seasonFinaleBridge,
    season_reset: seasonReset,
    season_memory_loss: seasonMemoryLoss,
    arc_break: arcBreak,
    callback_loss: callbackLoss,
    world_state_reset: worldStateReset,
    continuity_break: continuityBreak,
    dna_binding_preserved: dnaBinding,
    adapter_binding_preserved: adapterBinding,
    traceability_preserved: traceabilityPreserved,
    multi_season_continuity_validation_ready: multiSeasonContinuityValidationReady,
    certification_status: pass ? MULTI_SEASON_CONTINUITY_VALIDATION_STATUS_MESSAGE : null,
    series_anchor: seriesAnchor,
    journey_steps: journeySteps,
    season_transitions: seasonTransitions,
    long_term_callback_validation: longTermCallbackValidation,
    final_verdict: pass
      ? MULTI_SEASON_CONTINUITY_VALIDATION_PASS_VERDICT
      : MULTI_SEASON_CONTINUITY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MULTI_SEASON_CONTINUITY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MULTI_SEASON_CONTINUITY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MULTI_SEASON_CONTINUITY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
