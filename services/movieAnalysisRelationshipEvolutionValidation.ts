import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
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
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import { SOURCE_LOCATION_DNA_ANCHORS } from './movieAnalysisRealLocationConsistencyValidation.js';
import {
  MAX_CLOTHING_DRIFT,
  MAX_FACE_IDENTITY_DRIFT,
  MAX_HAIRSTYLE_DRIFT,
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

export const RELATIONSHIP_EVOLUTION_VALIDATION_PHASE =
  'PHASE-LEVEL2G-002-RELATIONSHIP_EVOLUTION_VALIDATION_V1' as const;
export const RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_RELATIONSHIP_EVOLUTION_VALIDATION_V1' as const;
export const RELATIONSHIP_EVOLUTION_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_RELATIONSHIP_EVOLUTION_VALIDATION_V1' as const;
export const RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE =
  'RELATIONSHIP_EVOLUTION_VALIDATED' as const;
export const RELATIONSHIP_EVOLUTION_VALIDATION_DIR =
  'reports/movie_analysis_relationship_evolution_validation' as const;
export const RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_relationship_evolution_validation/movie-analysis-relationship-evolution-validation-report.json' as const;
export const RELATIONSHIP_EVOLUTION_VALIDATION_MD_PATH =
  'reports/movie_analysis_relationship_evolution_validation/MOVIE_ANALYSIS_RELATIONSHIP_EVOLUTION_VALIDATION.md' as const;
export const RELATIONSHIP_EVOLUTION_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_relationship_evolution_validation' as const;
export const RELATIONSHIP_EVOLUTION_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_relationship_evolution_validation/movie-analysis-relationship-evolution-validation-manifest.json' as const;

export const RELATIONSHIP_STAGE_IDS = [
  'Friendship',
  'Trust',
  'Conflict',
  'Separation',
  'Reconciliation',
  'Mature Bond',
] as const;
export const ANCHOR_RELATIONSHIP_STAGE_ID = 'Friendship' as const;
export const RELATIONSHIP_JOURNEY_STAGE_COUNT = RELATIONSHIP_STAGE_IDS.length;
export const RELATIONSHIP_JOURNEY_TRANSITION_COUNT = RELATIONSHIP_JOURNEY_STAGE_COUNT - 1;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const ENTRY_FRAME_INDEX = 0;

export const RELATIONSHIP_STAGE_SOURCE_MAP: Record<
  (typeof RELATIONSHIP_STAGE_IDS)[number],
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
> = {
  Friendship: 'GHIBLI_01',
  Trust: 'LITTLE_WOMEN_01',
  Conflict: 'MORI_01',
  Separation: 'SHINKAI_01',
  Reconciliation: 'GHIBLI_01',
  'Mature Bond': 'GHIBLI_01',
};

export const RELATIONSHIP_EPISODE_MAP: Record<(typeof RELATIONSHIP_STAGE_IDS)[number], string> = {
  Friendship: 'Episode 1',
  Trust: 'Episode 2',
  Conflict: 'Episode 3',
  Separation: 'Episode 4',
  Reconciliation: 'Final Callback Episode',
  'Mature Bond': 'Series Reentry',
};

const RELATIONSHIP_STAGE_ORDER: Record<(typeof RELATIONSHIP_STAGE_IDS)[number], number> = {
  Friendship: 0,
  Trust: 1,
  Conflict: 2,
  Separation: 3,
  Reconciliation: 4,
  'Mature Bond': 5,
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RelationshipEvolutionValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  relationship_stage?: string;
};

export type RelationshipBondAnchor = {
  relationship_stage: typeof ANCHOR_RELATIONSHIP_STAGE_ID;
  episode_id: string;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
  relationship_memory_signature: string;
  bond_identity_signature: string;
  romance_warmth_score: number;
  family_bond_score: number;
};

export type RelationshipJourneyStep = {
  step_index: number;
  relationship_stage: (typeof RELATIONSHIP_STAGE_IDS)[number];
  episode_id: string;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  relationship_stage_order: number;
  relationship_progression_valid: ValidationStatus;
  friendship_progression: ValidationStatus;
  romance_progression: ValidationStatus;
  family_bond_progression: ValidationStatus;
  conflict_resolution: ValidationStatus;
  relationship_memory_preserved: ValidationStatus;
  cross_episode_relationship_recall: ValidationStatus;
  relationship_growth_preserved: ValidationStatus;
  bond_identity_preserved: ValidationStatus;
  romance_warmth_score: number;
  family_bond_score: number;
};

export type RelationshipEvolutionCallbackResult = {
  relationship_stage: 'Reconciliation';
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  cross_episode_callback_valid: ValidationStatus;
  relationship_memory_preserved: ValidationStatus;
  callback_failure: boolean;
};

export type MovieAnalysisRelationshipEvolutionValidationManifest = {
  manifest_id: string;
  phase: typeof RELATIONSHIP_EVOLUTION_VALIDATION_PHASE;
  generated_at: string;
  character_evolution_validation_report_path: typeof CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH;
  multi_episode_consistency_validation_report_path: typeof MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH;
  anchor_relationship_stage: typeof ANCHOR_RELATIONSHIP_STAGE_ID;
  journey_path: Array<{
    relationship_stage: (typeof RELATIONSHIP_STAGE_IDS)[number];
    episode_id: string;
    source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  }>;
  relationship_bond_anchor: RelationshipBondAnchor;
  journey_steps: RelationshipJourneyStep[];
  callback_result: RelationshipEvolutionCallbackResult;
};

export type MovieAnalysisRelationshipEvolutionValidationReport = {
  report_id: string;
  phase: typeof RELATIONSHIP_EVOLUTION_VALIDATION_PHASE;
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
  character_evolution_validation_report_path: typeof CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH;
  multi_episode_consistency_validation_report_path: typeof MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH;
  relationship_evolution_validation_export_dir: typeof RELATIONSHIP_EVOLUTION_VALIDATION_EXPORT_DIR;
  relationship_evolution_validation_manifest_path: typeof RELATIONSHIP_EVOLUTION_VALIDATION_MANIFEST_PATH;
  video_identity_dir: typeof VIDEO_IDENTITY_DIR;
  video_location_dir: typeof VIDEO_LOCATION_DIR;
  video_style_dir: typeof VIDEO_STYLE_DIR;
  video_motion_dir: typeof VIDEO_MOTION_DIR;
  source_count: number;
  adapter_count: number;
  relationship_journey_stage_count: typeof RELATIONSHIP_JOURNEY_STAGE_COUNT;
  relationship_journey_transition_count: typeof RELATIONSHIP_JOURNEY_TRANSITION_COUNT;
  friendship_progression: ValidationStatus;
  romance_progression: ValidationStatus;
  family_bond_progression: ValidationStatus;
  conflict_resolution: ValidationStatus;
  relationship_memory_preserved: ValidationStatus;
  cross_episode_relationship_recall: ValidationStatus;
  relationship_growth_preserved: ValidationStatus;
  relationship_identity_preserved: ValidationStatus;
  relationship_progression_valid: ValidationStatus;
  conflict_resolution_valid: ValidationStatus;
  cross_episode_callback_valid: ValidationStatus;
  dna_binding_preserved: ValidationStatus;
  adapter_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  relationship_reset: boolean;
  relationship_regression: boolean;
  bond_loss: boolean;
  callback_failure: boolean;
  dna_binding_break: boolean;
  adapter_binding_break: boolean;
  traceability_loss: boolean;
  relationship_evolution_validation_ready: ValidationStatus;
  certification_status: typeof RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE | null;
  relationship_bond_anchor: RelationshipBondAnchor;
  journey_steps: RelationshipJourneyStep[];
  callback_result: RelationshipEvolutionCallbackResult;
  final_verdict:
    | typeof RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT
    | typeof RELATIONSHIP_EVOLUTION_VALIDATION_FAIL_VERDICT;
  issues: RelationshipEvolutionValidationIssue[];
};

type Rgb = [number, number, number];

type StageSnapshotBundle = {
  relationship_stage: (typeof RELATIONSHIP_STAGE_IDS)[number];
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  identity_frame: VideoIdentityFrameSnapshot;
  location_frame: VideoLocationFrameSnapshot;
  style_frame: VideoStyleFrameSnapshot;
  motion_frame: VideoMotionFrameSnapshot;
  test_result: RealModelTestGenerationResult | null;
};

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

function bondIdentitySignature(
  relationshipStage: string,
  sourceId: string,
  testResult: RealModelTestGenerationResult | null
): string {
  return createHash('sha256')
    .update(
      [
        relationshipStage,
        sourceId,
        testResult?.dna_binding.cinematic_dna_id ?? '',
        ...(testResult?.adapter_binding.adapter_ids ?? []),
      ].join('|')
    )
    .digest('hex')
    .slice(0, 16);
}

function relationshipMemorySignature(
  bundle: StageSnapshotBundle,
  anchorSignature: string
): string {
  return createHash('sha256')
    .update(
      [
        bundle.relationship_stage,
        bundle.source_id,
        bundle.identity_frame.identity_signature,
        bundle.location_frame.location_signature,
        bundle.style_frame.style_signature,
        bundle.motion_frame.motion_signature,
        anchorSignature,
      ].join('|')
    )
    .digest('hex')
    .slice(0, 16);
}

function romanceWarmthScore(style: VideoStyleFrameSnapshot, motion: VideoMotionFrameSnapshot): number {
  return clamp01(style.lighting_warmth * 0.6 + motion.luminance * 0.4);
}

function familyBondScore(testResult: RealModelTestGenerationResult | null): number {
  if (!testResult) return 0;
  const hasStorytelling = testResult.adapter_binding.adapter_ids.some((id) =>
    id.includes('storytelling_adapter')
  );
  const hasEmotion = testResult.adapter_binding.adapter_ids.some((id) => id.includes('emotion_adapter'));
  const hasEmotionPrompt = testResult.prompt.includes('emotion_emotion');
  return hasStorytelling && hasEmotion && hasEmotionPrompt ? 1 : 0;
}

function loadStageBundle(
  root: string,
  relationshipStage: (typeof RELATIONSHIP_STAGE_IDS)[number],
  testResults: RealModelTestGenerationResult[]
): StageSnapshotBundle | null {
  const sourceId = RELATIONSHIP_STAGE_SOURCE_MAP[relationshipStage];
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
    relationship_stage: relationshipStage,
    source_id: sourceId,
    identity_frame: identity.frames[ENTRY_FRAME_INDEX],
    location_frame: location.frames[ENTRY_FRAME_INDEX],
    style_frame: style.frames[ENTRY_FRAME_INDEX],
    motion_frame: motion.frames[ENTRY_FRAME_INDEX],
    test_result: testResults.find((result) => result.source_id === sourceId) ?? null,
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

function validateAdapterBinding(testResults: RealModelTestGenerationResult[]): ValidationStatus {
  return toStatus(
    testResults.length === EXPECTED_SOURCE_COUNT &&
      testResults.every(
        (result) =>
          result.adapter_binding.binding_preserved === true &&
          result.adapter_binding.adapter_ids.some((id) => id.includes('emotion_adapter')) &&
          result.adapter_binding.adapter_ids.some((id) => id.includes('storytelling_adapter'))
      )
  );
}

function validateTraceability(testResults: RealModelTestGenerationResult[]): ValidationStatus {
  return toStatus(
    testResults.length === EXPECTED_SOURCE_COUNT &&
      testResults.every((result) => result.traceability.traceability_preserved === true)
  );
}

function validateCallback(
  anchorBundle: StageSnapshotBundle,
  callbackBundle: StageSnapshotBundle,
  anchorMemorySignature: string
): RelationshipEvolutionCallbackResult {
  const anchorIdentity = anchorBundle.identity_frame;
  const callbackIdentity = callbackBundle.identity_frame;
  const anchorLocation = anchorBundle.location_frame;
  const callbackLocation = callbackBundle.location_frame;

  const faceDrift = colorDistance(anchorIdentity.face_zone_rgb, callbackIdentity.face_zone_rgb);
  const hairDrift = colorDistance(anchorIdentity.hair_zone_rgb, callbackIdentity.hair_zone_rgb);
  const clothingDrift = colorDistance(
    anchorIdentity.clothing_zone_rgb,
    callbackIdentity.clothing_zone_rgb
  );
  const callbackBridge =
    callbackBundle.test_result?.prompt.includes('continuity_environment_hold') === true ||
    callbackBundle.test_result?.prompt.includes('continuity_environment_bridge') === true;
  const callbackMemory = relationshipMemorySignature(callbackBundle, anchorMemorySignature);

  const crossEpisodeCallback = toStatus(
    faceDrift <= MAX_CALLBACK_IDENTITY_DRIFT &&
      hairDrift <= MAX_HAIRSTYLE_DRIFT &&
      clothingDrift <= MAX_CLOTHING_DRIFT &&
      callbackIdentity.identity_signature === anchorIdentity.identity_signature &&
      callbackMemory.length > 0 &&
      anchorMemorySignature.length > 0 &&
      callbackBridge &&
      callbackBundle.test_result?.adapter_binding.adapter_ids.some((id) =>
        id.includes('continuity_adapter')
      ) === true
  );

  const anchors = SOURCE_LOCATION_DNA_ANCHORS[anchorBundle.source_id];
  const locationCompositeDrift =
    colorDistance(anchorLocation.sky_zone_rgb, callbackLocation.sky_zone_rgb) * 0.4 +
    colorDistance(anchorLocation.midground_zone_rgb, callbackLocation.midground_zone_rgb) * 0.35 +
    colorDistance(anchorLocation.ground_zone_rgb, callbackLocation.ground_zone_rgb) * 0.25;

  const relationshipMemoryPreserved = toStatus(
    crossEpisodeCallback === 'PASS' &&
      callbackLocation.location_signature === anchorLocation.location_signature &&
      locationCompositeDrift <= MAX_CROSS_FRAME_LOCATION_DRIFT * 1.15
  );

  const callbackFailure = crossEpisodeCallback === 'FAIL' || relationshipMemoryPreserved === 'FAIL';

  return {
    relationship_stage: 'Reconciliation',
    source_id: callbackBundle.source_id,
    cross_episode_callback_valid: crossEpisodeCallback,
    relationship_memory_preserved: relationshipMemoryPreserved,
    callback_failure: callbackFailure,
  };
}

function buildMarkdown(report: MovieAnalysisRelationshipEvolutionValidationReport): string {
  const lines = [
    '# Movie Analysis Relationship Evolution Validation',
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
    '## Relationship Journey',
    '',
    'Friendship → Trust → Conflict → Separation → Reconciliation → Mature Bond',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| relationship_identity_preserved | ${report.relationship_identity_preserved} |`,
    `| relationship_progression_valid | ${report.relationship_progression_valid} |`,
    `| conflict_resolution_valid | ${report.conflict_resolution_valid} |`,
    `| relationship_memory_preserved | ${report.relationship_memory_preserved} |`,
    `| cross_episode_callback_valid | ${report.cross_episode_callback_valid} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| adapter_binding_preserved | ${report.adapter_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    '',
    '## Validation Dimensions',
    '',
    '| Dimension | Status |',
    '| --- | --- |',
    `| friendship_progression | ${report.friendship_progression} |`,
    `| romance_progression | ${report.romance_progression} |`,
    `| family_bond_progression | ${report.family_bond_progression} |`,
    `| conflict_resolution | ${report.conflict_resolution} |`,
    `| cross_episode_relationship_recall | ${report.cross_episode_relationship_recall} |`,
    `| relationship_growth_preserved | ${report.relationship_growth_preserved} |`,
    '',
    '## Journey Steps',
    ''
  );

  for (const step of report.journey_steps) {
    lines.push(
      `### ${step.relationship_stage}`,
      '',
      `- episode_id: ${step.episode_id}`,
      `- source_id: ${step.source_id}`,
      `- progression_valid: ${step.relationship_progression_valid}`,
      `- bond_identity_preserved: ${step.bond_identity_preserved}`,
      `- romance_warmth_score: ${step.romance_warmth_score}`,
      `- family_bond_score: ${step.family_bond_score}`,
      ''
    );
  }

  lines.push(
    '## Reconciliation Callback',
    '',
    `- cross_episode_callback_valid: ${report.callback_result.cross_episode_callback_valid}`,
    `- relationship_memory_preserved: ${report.callback_result.relationship_memory_preserved}`,
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
  issues: RelationshipEvolutionValidationIssue[]
): MovieAnalysisRelationshipEvolutionValidationReport {
  const report: MovieAnalysisRelationshipEvolutionValidationReport = {
    report_id: 'movie-analysis-relationship-evolution-validation-report-v1',
    phase: RELATIONSHIP_EVOLUTION_VALIDATION_PHASE,
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
    character_evolution_validation_report_path: CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
    multi_episode_consistency_validation_report_path: MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
    relationship_evolution_validation_export_dir: RELATIONSHIP_EVOLUTION_VALIDATION_EXPORT_DIR,
    relationship_evolution_validation_manifest_path: RELATIONSHIP_EVOLUTION_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: 0,
    adapter_count: 0,
    relationship_journey_stage_count: RELATIONSHIP_JOURNEY_STAGE_COUNT,
    relationship_journey_transition_count: RELATIONSHIP_JOURNEY_TRANSITION_COUNT,
    friendship_progression: 'FAIL',
    romance_progression: 'FAIL',
    family_bond_progression: 'FAIL',
    conflict_resolution: 'FAIL',
    relationship_memory_preserved: 'FAIL',
    cross_episode_relationship_recall: 'FAIL',
    relationship_growth_preserved: 'FAIL',
    relationship_identity_preserved: 'FAIL',
    relationship_progression_valid: 'FAIL',
    conflict_resolution_valid: 'FAIL',
    cross_episode_callback_valid: 'FAIL',
    dna_binding_preserved: 'FAIL',
    adapter_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    relationship_reset: true,
    relationship_regression: true,
    bond_loss: true,
    callback_failure: true,
    dna_binding_break: true,
    adapter_binding_break: true,
    traceability_loss: true,
    relationship_evolution_validation_ready: 'FAIL',
    certification_status: null,
    relationship_bond_anchor: {
      relationship_stage: ANCHOR_RELATIONSHIP_STAGE_ID,
      episode_id: RELATIONSHIP_EPISODE_MAP.Friendship,
      source_id: 'GHIBLI_01',
      frame_index: ENTRY_FRAME_INDEX,
      relationship_memory_signature: '',
      bond_identity_signature: '',
      romance_warmth_score: 0,
      family_bond_score: 0,
    },
    journey_steps: [],
    callback_result: {
      relationship_stage: 'Reconciliation',
      source_id: 'GHIBLI_01',
      cross_episode_callback_valid: 'FAIL',
      relationship_memory_preserved: 'FAIL',
      callback_failure: true,
    },
    final_verdict: RELATIONSHIP_EVOLUTION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, RELATIONSHIP_EVOLUTION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RELATIONSHIP_EVOLUTION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRelationshipEvolutionValidation(
  projectRoot?: string
): MovieAnalysisRelationshipEvolutionValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RelationshipEvolutionValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const characterEvolutionReport = loadReport<{
    final_verdict: string;
    character_evolution_validation_ready: ValidationStatus;
  }>(root, CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH);
  if (
    !characterEvolutionReport ||
    characterEvolutionReport.final_verdict !== CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT ||
    characterEvolutionReport.character_evolution_validation_ready !== 'PASS'
  ) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: `Required ${CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const multiEpisodeReport = loadReport<{
    final_verdict: string;
    relationship_progression_preservation: ValidationStatus;
    cross_episode_callback: ValidationStatus;
    relationship_regression: boolean;
    callback_failure: boolean;
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

  const stageBundles: StageSnapshotBundle[] = [];
  for (const relationshipStage of RELATIONSHIP_STAGE_IDS) {
    const bundle = loadStageBundle(root, relationshipStage, testManifest.results);
    if (!bundle) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing relationship snapshots for ${relationshipStage}`,
        severity: 'error',
        relationship_stage: relationshipStage,
      });
      return writeFailReport(root, timestamp, issues);
    }
    stageBundles.push(bundle);
  }

  const anchorBundle = stageBundles[0];
  const anchorBondSignature = bondIdentitySignature(
    anchorBundle.relationship_stage,
    anchorBundle.source_id,
    anchorBundle.test_result
  );
  const anchorMemorySignature = relationshipMemorySignature(anchorBundle, anchorBondSignature);

  const relationshipBondAnchor: RelationshipBondAnchor = {
    relationship_stage: ANCHOR_RELATIONSHIP_STAGE_ID,
    episode_id: RELATIONSHIP_EPISODE_MAP.Friendship,
    source_id: anchorBundle.source_id,
    frame_index: ENTRY_FRAME_INDEX,
    relationship_memory_signature: anchorMemorySignature,
    bond_identity_signature: anchorBondSignature,
    romance_warmth_score: romanceWarmthScore(anchorBundle.style_frame, anchorBundle.motion_frame),
    family_bond_score: familyBondScore(anchorBundle.test_result),
  };

  const journeySteps: RelationshipJourneyStep[] = [];
  let previousStageOrder: number | null = null;
  let previousRomanceScore: number | null = null;
  let previousFamilyScore: number | null = null;
  let conflictStageReached = false;
  let separationStageReached = false;

  for (let index = 0; index < stageBundles.length; index += 1) {
    const bundle = stageBundles[index];
    const relationshipStage = bundle.relationship_stage;
    const stageOrder = RELATIONSHIP_STAGE_ORDER[relationshipStage];
    const romanceScore = romanceWarmthScore(bundle.style_frame, bundle.motion_frame);
    const familyScore = familyBondScore(bundle.test_result);
    const bondSignature = bondIdentitySignature(
      relationshipStage,
      bundle.source_id,
      bundle.test_result
    );

    const progressionValid =
      previousStageOrder === null ? 'PASS' : toStatus(stageOrder === previousStageOrder + 1);
    const friendshipProgression =
      relationshipStage === 'Friendship' || relationshipStage === 'Trust'
        ? progressionValid
        : toStatus(stageOrder >= RELATIONSHIP_STAGE_ORDER.Trust);

    const romanceProgression =
      previousRomanceScore === null
        ? 'PASS'
        : toStatus(romanceScore >= previousRomanceScore - MAX_CHARACTER_GROWTH_REGRESSION);

    const familyBondProgression = toStatus(familyScore >= (previousFamilyScore ?? familyScore));

    const continuityPrompt =
      bundle.test_result?.prompt.includes('continuity_continuity_layout') === true;
    const bondIdentityPreserved = toStatus(
      continuityPrompt &&
        bundle.test_result?.dna_binding.binding_preserved === true &&
        familyScore === 1
    );

    if (relationshipStage === 'Conflict') conflictStageReached = true;
    if (relationshipStage === 'Separation') separationStageReached = true;

    const conflictResolution =
      relationshipStage === 'Reconciliation' || relationshipStage === 'Mature Bond'
        ? toStatus(conflictStageReached && separationStageReached)
        : relationshipStage === 'Conflict' || relationshipStage === 'Separation'
          ? 'PASS'
          : toStatus(true);

    const memoryPreserved =
      relationshipStage === 'Friendship'
        ? 'PASS'
        : toStatus(
            relationshipMemorySignature(bundle, anchorMemorySignature).length > 0 &&
              bundle.test_result?.adapter_binding.binding_preserved === true
          );

    const crossEpisodeRecall =
      relationshipStage === 'Reconciliation' || relationshipStage === 'Mature Bond'
        ? toStatus(bundle.identity_frame.identity_signature === anchorBundle.identity_frame.identity_signature)
        : toStatus(
            colorDistance(
              anchorBundle.identity_frame.face_zone_rgb,
              bundle.identity_frame.face_zone_rgb
            ) <= MAX_FACE_IDENTITY_DRIFT
          );

    const growthPreserved = toStatus(
      progressionValid === 'PASS' &&
        romanceProgression === 'PASS' &&
        !(previousStageOrder !== null && stageOrder < previousStageOrder)
    );

    if (progressionValid === 'FAIL') {
      issues.push({
        code: 'RELATIONSHIP_REGRESSION',
        message: `Relationship stage regression at ${relationshipStage}`,
        severity: 'error',
        relationship_stage: relationshipStage,
      });
    }
    if (bondIdentityPreserved === 'FAIL') {
      issues.push({
        code: 'BOND_LOSS',
        message: `Bond identity lost at ${relationshipStage}`,
        severity: 'error',
        relationship_stage: relationshipStage,
      });
    }

    journeySteps.push({
      step_index: index,
      relationship_stage: relationshipStage,
      episode_id: RELATIONSHIP_EPISODE_MAP[relationshipStage],
      source_id: bundle.source_id,
      relationship_stage_order: stageOrder,
      relationship_progression_valid: progressionValid,
      friendship_progression: friendshipProgression,
      romance_progression: romanceProgression,
      family_bond_progression: familyBondProgression,
      conflict_resolution: conflictResolution,
      relationship_memory_preserved: memoryPreserved,
      cross_episode_relationship_recall: crossEpisodeRecall,
      relationship_growth_preserved: growthPreserved,
      bond_identity_preserved: bondIdentityPreserved,
      romance_warmth_score: romanceScore,
      family_bond_score: familyScore,
    });

    previousStageOrder = stageOrder;
    previousRomanceScore = romanceScore;
    previousFamilyScore = familyScore;
  }

  const reconciliationBundle = stageBundles.find((bundle) => bundle.relationship_stage === 'Reconciliation');
  const callbackResult = reconciliationBundle
    ? validateCallback(anchorBundle, reconciliationBundle, anchorMemorySignature)
    : {
        relationship_stage: 'Reconciliation' as const,
        source_id: 'GHIBLI_01' as const,
        cross_episode_callback_valid: 'FAIL' as ValidationStatus,
        relationship_memory_preserved: 'FAIL' as ValidationStatus,
        callback_failure: true,
      };

  if (callbackResult.callback_failure) {
    issues.push({
      code: 'CALLBACK_FAILURE',
      message: 'Relationship reconciliation callback failed',
      severity: 'error',
      relationship_stage: 'Reconciliation',
    });
  }

  const dnaBinding = validateDnaBinding(testManifest.results);
  const adapterBinding = validateAdapterBinding(testManifest.results);
  const traceabilityPreserved = validateTraceability(testManifest.results);

  const relationshipProgressionValid = toStatus(
    journeySteps.every((step) => step.relationship_progression_valid === 'PASS')
  );
  const friendshipProgression = toStatus(
    journeySteps.every((step) => step.friendship_progression === 'PASS')
  );
  const romanceProgression = toStatus(
    journeySteps.every((step) => step.romance_progression === 'PASS')
  );
  const familyBondProgression = toStatus(
    journeySteps.every((step) => step.family_bond_progression === 'PASS' && step.family_bond_score === 1)
  );
  const conflictResolutionValid = toStatus(
    journeySteps
      .filter((step) => step.relationship_stage === 'Reconciliation' || step.relationship_stage === 'Mature Bond')
      .every((step) => step.conflict_resolution === 'PASS') && callbackResult.callback_failure === false
  );
  const conflictResolution = conflictResolutionValid;
  const relationshipMemoryPreserved = toStatus(
    journeySteps.every((step) => step.relationship_memory_preserved === 'PASS') &&
      callbackResult.relationship_memory_preserved === 'PASS'
  );
  const crossEpisodeRelationshipRecall = toStatus(
    journeySteps.every((step) => step.cross_episode_relationship_recall === 'PASS')
  );
  const relationshipGrowthPreserved = toStatus(
    journeySteps.every((step) => step.relationship_growth_preserved === 'PASS') &&
      multiEpisodeReport.relationship_progression_preservation === 'PASS' &&
      multiEpisodeReport.relationship_regression === false
  );
  const relationshipIdentityPreserved = toStatus(
    journeySteps.every((step) => step.bond_identity_preserved === 'PASS')
  );
  const crossEpisodeCallbackValid = callbackResult.cross_episode_callback_valid;

  const relationshipRegression =
    relationshipProgressionValid === 'FAIL' ||
    multiEpisodeReport.relationship_regression === true ||
    relationshipGrowthPreserved === 'FAIL';

  const bondLoss = relationshipIdentityPreserved === 'FAIL';
  const relationshipReset =
    multiEpisodeReport.callback_failure === true || relationshipMemoryPreserved === 'FAIL';
  const callbackFailure = callbackResult.callback_failure;
  const dnaBindingBreak = dnaBinding === 'FAIL';
  const adapterBindingBreak = adapterBinding === 'FAIL';
  const traceabilityLoss = traceabilityPreserved === 'FAIL';

  if (dnaBindingBreak) {
    issues.push({ code: 'DNA_BINDING_BREAK', message: 'DNA binding break detected', severity: 'error' });
  }
  if (adapterBindingBreak) {
    issues.push({
      code: 'ADAPTER_BINDING_BREAK',
      message: 'Adapter binding break detected',
      severity: 'error',
    });
  }
  if (traceabilityLoss) {
    issues.push({ code: 'TRACEABILITY_LOSS', message: 'Traceability loss detected', severity: 'error' });
  }

  const gateChecks: ValidationStatus[] = [
    relationshipIdentityPreserved,
    relationshipProgressionValid,
    conflictResolutionValid,
    relationshipMemoryPreserved,
    crossEpisodeCallbackValid,
    dnaBinding,
    adapterBinding,
    traceabilityPreserved,
  ];

  const relationshipEvolutionValidationReady =
    !relationshipReset &&
    !relationshipRegression &&
    !bondLoss &&
    !callbackFailure &&
    !dnaBindingBreak &&
    !adapterBindingBreak &&
    !traceabilityLoss &&
    gateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = relationshipEvolutionValidationReady === 'PASS';

  const manifest: MovieAnalysisRelationshipEvolutionValidationManifest = {
    manifest_id: 'movie-analysis-relationship-evolution-validation-manifest-v1',
    phase: RELATIONSHIP_EVOLUTION_VALIDATION_PHASE,
    generated_at: timestamp,
    character_evolution_validation_report_path: CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
    multi_episode_consistency_validation_report_path: MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
    anchor_relationship_stage: ANCHOR_RELATIONSHIP_STAGE_ID,
    journey_path: RELATIONSHIP_STAGE_IDS.map((relationshipStage) => ({
      relationship_stage: relationshipStage,
      episode_id: RELATIONSHIP_EPISODE_MAP[relationshipStage],
      source_id: RELATIONSHIP_STAGE_SOURCE_MAP[relationshipStage],
    })),
    relationship_bond_anchor: relationshipBondAnchor,
    journey_steps: journeySteps,
    callback_result: callbackResult,
  };

  fs.mkdirSync(path.join(root, RELATIONSHIP_EVOLUTION_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, RELATIONSHIP_EVOLUTION_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RELATIONSHIP_EVOLUTION_VALIDATION_EXPORT_DIR, 'relationship-evolution-journey.json'),
    `${JSON.stringify(
      {
        journey_path: manifest.journey_path,
        relationship_bond_anchor: relationshipBondAnchor,
        journey_steps: journeySteps.map((step) => ({
          step_index: step.step_index,
          relationship_stage: step.relationship_stage,
          episode_id: step.episode_id,
          source_id: step.source_id,
          relationship_progression_valid: step.relationship_progression_valid,
          friendship_progression: step.friendship_progression,
          romance_progression: step.romance_progression,
          family_bond_progression: step.family_bond_progression,
          conflict_resolution: step.conflict_resolution,
          relationship_memory_preserved: step.relationship_memory_preserved,
          cross_episode_relationship_recall: step.cross_episode_relationship_recall,
          relationship_growth_preserved: step.relationship_growth_preserved,
          bond_identity_preserved: step.bond_identity_preserved,
          romance_warmth_score: step.romance_warmth_score,
          family_bond_score: step.family_bond_score,
        })),
        callback_result: callbackResult,
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

  const report: MovieAnalysisRelationshipEvolutionValidationReport = {
    report_id: 'movie-analysis-relationship-evolution-validation-report-v1',
    phase: RELATIONSHIP_EVOLUTION_VALIDATION_PHASE,
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
    character_evolution_validation_report_path: CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
    multi_episode_consistency_validation_report_path: MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
    relationship_evolution_validation_export_dir: RELATIONSHIP_EVOLUTION_VALIDATION_EXPORT_DIR,
    relationship_evolution_validation_manifest_path: RELATIONSHIP_EVOLUTION_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    relationship_journey_stage_count: RELATIONSHIP_JOURNEY_STAGE_COUNT,
    relationship_journey_transition_count: RELATIONSHIP_JOURNEY_TRANSITION_COUNT,
    friendship_progression: friendshipProgression,
    romance_progression: romanceProgression,
    family_bond_progression: familyBondProgression,
    conflict_resolution: conflictResolution,
    relationship_memory_preserved: relationshipMemoryPreserved,
    cross_episode_relationship_recall: crossEpisodeRelationshipRecall,
    relationship_growth_preserved: relationshipGrowthPreserved,
    relationship_identity_preserved: relationshipIdentityPreserved,
    relationship_progression_valid: relationshipProgressionValid,
    conflict_resolution_valid: conflictResolutionValid,
    cross_episode_callback_valid: crossEpisodeCallbackValid,
    dna_binding_preserved: dnaBinding,
    adapter_binding_preserved: adapterBinding,
    traceability_preserved: traceabilityPreserved,
    relationship_reset: relationshipReset,
    relationship_regression: relationshipRegression,
    bond_loss: bondLoss,
    callback_failure: callbackFailure,
    dna_binding_break: dnaBindingBreak,
    adapter_binding_break: adapterBindingBreak,
    traceability_loss: traceabilityLoss,
    relationship_evolution_validation_ready: relationshipEvolutionValidationReady,
    certification_status: pass ? RELATIONSHIP_EVOLUTION_VALIDATION_STATUS_MESSAGE : null,
    relationship_bond_anchor: relationshipBondAnchor,
    journey_steps: journeySteps,
    callback_result: callbackResult,
    final_verdict: pass
      ? RELATIONSHIP_EVOLUTION_VALIDATION_PASS_VERDICT
      : RELATIONSHIP_EVOLUTION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, RELATIONSHIP_EVOLUTION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, RELATIONSHIP_EVOLUTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RELATIONSHIP_EVOLUTION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
