import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  CHARACTER_REENTRY_VALIDATION_PASS_VERDICT,
  CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
} from './movieAnalysisCharacterReentryValidation.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT,
  LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
} from './movieAnalysisLevel2CompletenessAudit.js';
import {
  LEVEL2_COMPLETE_STATUS,
  LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
} from './movieAnalysisLevel2MasterCertificationV3.js';
import { MAX_CHARACTER_GROWTH_REGRESSION } from './movieAnalysisMultiEpisodeConsistencyValidation.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import {
  MAX_FACE_IDENTITY_DRIFT,
  MAX_FRAME_IDENTITY_DRIFT,
  MAX_HAIRSTYLE_DRIFT,
  MIN_FACE_ZONE_VARIANCE,
  VIDEO_IDENTITY_DIR,
  type VideoIdentityFrameSnapshot,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
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

export const CHARACTER_EVOLUTION_VALIDATION_PHASE =
  'PHASE-LEVEL2G-001-CHARACTER_EVOLUTION_VALIDATION_V1' as const;
export const CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_CHARACTER_EVOLUTION_VALIDATION_V1' as const;
export const CHARACTER_EVOLUTION_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_CHARACTER_EVOLUTION_VALIDATION_V1' as const;
export const CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE =
  'CHARACTER_EVOLUTION_VALIDATED' as const;
export const CHARACTER_EVOLUTION_VALIDATION_DIR =
  'reports/movie_analysis_character_evolution_validation' as const;
export const CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_character_evolution_validation/movie-analysis-character-evolution-validation-report.json' as const;
export const CHARACTER_EVOLUTION_VALIDATION_MD_PATH =
  'reports/movie_analysis_character_evolution_validation/MOVIE_ANALYSIS_CHARACTER_EVOLUTION_VALIDATION.md' as const;
export const CHARACTER_EVOLUTION_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_character_evolution_validation' as const;
export const CHARACTER_EVOLUTION_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_character_evolution_validation/movie-analysis-character-evolution-validation-manifest.json' as const;

export const AGE_STAGE_IDS = ['Child', 'Teen', 'Young Adult', 'Adult'] as const;
export const PERSONALITY_STAGE_IDS = ['naive', 'curious', 'determined', 'mature'] as const;
export const ROLE_STAGE_IDS = ['student', 'apprentice', 'worker', 'mentor'] as const;
export const REENTRY_STAGE_ID = 'Reentry' as const;
export const GROWTH_JOURNEY_STAGE_IDS = [...AGE_STAGE_IDS, REENTRY_STAGE_ID] as const;
export const GROWTH_JOURNEY_STAGE_COUNT = GROWTH_JOURNEY_STAGE_IDS.length;
export const GROWTH_JOURNEY_TRANSITION_COUNT = GROWTH_JOURNEY_STAGE_COUNT - 1;
export const ANCHOR_AGE_STAGE_ID = 'Child' as const;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const ENTRY_FRAME_INDEX = 0;

export const MIN_COSTUME_EVOLUTION_DELTA = 0.008 as const;
export const MAX_IDENTITY_MEMORY_DRIFT = MAX_FRAME_IDENTITY_DRIFT;

export const AGE_STAGE_SOURCE_MAP: Record<(typeof AGE_STAGE_IDS)[number], (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]> = {
  Child: 'GHIBLI_01',
  Teen: 'LITTLE_WOMEN_01',
  'Young Adult': 'MORI_01',
  Adult: 'SHINKAI_01',
};

export const GROWTH_STAGE_SOURCE_MAP: Record<
  (typeof GROWTH_JOURNEY_STAGE_IDS)[number],
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
> = {
  ...AGE_STAGE_SOURCE_MAP,
  Reentry: 'GHIBLI_01',
};

const AGE_STAGE_ORDER: Record<(typeof AGE_STAGE_IDS)[number], number> = {
  Child: 0,
  Teen: 1,
  'Young Adult': 2,
  Adult: 3,
};

const PERSONALITY_STAGE_ORDER: Record<(typeof PERSONALITY_STAGE_IDS)[number], number> = {
  naive: 0,
  curious: 1,
  determined: 2,
  mature: 3,
};

const ROLE_STAGE_ORDER: Record<(typeof ROLE_STAGE_IDS)[number], number> = {
  student: 0,
  apprentice: 1,
  worker: 2,
  mentor: 3,
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type CharacterEvolutionValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  age_stage?: string;
};

export type CharacterDnaAnchor = {
  age_stage: typeof ANCHOR_AGE_STAGE_ID;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
  face_zone_rgb: [number, number, number];
  hair_zone_rgb: [number, number, number];
  clothing_zone_rgb: [number, number, number];
  identity_signature: string;
  core_visual_dna_signature: string;
  memory_signature: string;
  face_zone_variance: number;
};

export type CharacterGrowthJourneyStep = {
  step_index: number;
  age_stage: (typeof GROWTH_JOURNEY_STAGE_IDS)[number];
  personality_stage: (typeof PERSONALITY_STAGE_IDS)[number] | null;
  role_stage: (typeof ROLE_STAGE_IDS)[number] | null;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  entry_frame: VideoIdentityFrameSnapshot;
  face_identity: ValidationStatus;
  hair_identity: ValidationStatus;
  core_visual_dna_preserved: ValidationStatus;
  costume_evolution: ValidationStatus;
  growth_score: number;
  age_progression_valid: ValidationStatus;
  personality_evolution_valid: ValidationStatus;
  role_evolution_valid: ValidationStatus;
};

export type CharacterEvolutionReentryResult = {
  age_stage: typeof REENTRY_STAGE_ID;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  face_identity: ValidationStatus;
  hair_identity: ValidationStatus;
  core_visual_dna_preserved: ValidationStatus;
  growth_memory_preserved: ValidationStatus;
};

export type MovieAnalysisCharacterEvolutionValidationManifest = {
  manifest_id: string;
  phase: typeof CHARACTER_EVOLUTION_VALIDATION_PHASE;
  generated_at: string;
  character_reentry_validation_report_path: typeof CHARACTER_REENTRY_VALIDATION_REPORT_PATH;
  anchor_age_stage: typeof ANCHOR_AGE_STAGE_ID;
  journey_path: Array<{
    age_stage: (typeof GROWTH_JOURNEY_STAGE_IDS)[number];
    personality_stage: (typeof PERSONALITY_STAGE_IDS)[number] | null;
    role_stage: (typeof ROLE_STAGE_IDS)[number] | null;
    source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  }>;
  character_dna_anchor: CharacterDnaAnchor;
  journey_steps: CharacterGrowthJourneyStep[];
  reentry_result: CharacterEvolutionReentryResult;
};

export type MovieAnalysisCharacterEvolutionValidationReport = {
  report_id: string;
  phase: typeof CHARACTER_EVOLUTION_VALIDATION_PHASE;
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
  level2_master_certification_v3_report_path: typeof LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH;
  level2_completeness_audit_report_path: typeof LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH;
  character_reentry_validation_report_path: typeof CHARACTER_REENTRY_VALIDATION_REPORT_PATH;
  character_evolution_validation_export_dir: typeof CHARACTER_EVOLUTION_VALIDATION_EXPORT_DIR;
  character_evolution_validation_manifest_path: typeof CHARACTER_EVOLUTION_VALIDATION_MANIFEST_PATH;
  video_identity_dir: typeof VIDEO_IDENTITY_DIR;
  video_style_dir: typeof VIDEO_STYLE_DIR;
  video_motion_dir: typeof VIDEO_MOTION_DIR;
  source_count: number;
  adapter_count: number;
  growth_journey_stage_count: typeof GROWTH_JOURNEY_STAGE_COUNT;
  growth_journey_transition_count: typeof GROWTH_JOURNEY_TRANSITION_COUNT;
  character_identity_preserved: ValidationStatus;
  age_progression_valid: ValidationStatus;
  costume_evolution_valid: ValidationStatus;
  personality_evolution_valid: ValidationStatus;
  role_evolution_valid: ValidationStatus;
  growth_memory_preserved: ValidationStatus;
  dna_binding_preserved: ValidationStatus;
  adapter_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  identity_loss: boolean;
  character_reset: boolean;
  growth_regression: boolean;
  dna_binding_break: boolean;
  adapter_binding_break: boolean;
  traceability_loss: boolean;
  character_evolution_validation_ready: ValidationStatus;
  certification_status: typeof CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE | null;
  character_dna_anchor: CharacterDnaAnchor;
  journey_steps: CharacterGrowthJourneyStep[];
  reentry_result: CharacterEvolutionReentryResult;
  final_verdict:
    | typeof CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT
    | typeof CHARACTER_EVOLUTION_VALIDATION_FAIL_VERDICT;
  issues: CharacterEvolutionValidationIssue[];
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

function coreVisualDnaSignature(faceZone: Rgb, hairZone: Rgb): string {
  return createHash('sha256').update(`${faceZone.join(',')}|${hairZone.join(',')}`).digest('hex').slice(0, 16);
}

function memorySignature(frame: VideoIdentityFrameSnapshot): string {
  return createHash('sha256')
    .update(
      [
        frame.identity_signature,
        frame.face_zone_rgb.join(','),
        frame.hair_zone_rgb.join(','),
        frame.clothing_zone_rgb.join(','),
      ].join('|')
    )
    .digest('hex')
    .slice(0, 16);
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

function loadIdentitySnapshot(
  root: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): VideoIdentityFrameSnapshot[] | null {
  const identityPath = path.join(root, VIDEO_IDENTITY_DIR, `${sourceId}-video-identity.json`);
  if (!fs.existsSync(identityPath)) return null;
  const identity = JSON.parse(fs.readFileSync(identityPath, 'utf8')) as {
    frames: VideoIdentityFrameSnapshot[];
  };
  if (identity.frames.length !== BASE_CLIP_FRAME_COUNT) return null;
  return identity.frames;
}

function loadStyleFrame(
  root: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number],
  frameIndex: number
): VideoStyleFrameSnapshot | null {
  const stylePath = path.join(root, VIDEO_STYLE_DIR, `${sourceId}-video-style.json`);
  if (!fs.existsSync(stylePath)) return null;
  const style = JSON.parse(fs.readFileSync(stylePath, 'utf8')) as {
    frames: VideoStyleFrameSnapshot[];
  };
  return style.frames[frameIndex] ?? null;
}

function loadMotionFrame(
  root: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number],
  frameIndex: number
): VideoMotionFrameSnapshot | null {
  const motionPath = path.join(root, VIDEO_MOTION_DIR, `${sourceId}-video-motion.json`);
  if (!fs.existsSync(motionPath)) return null;
  const motion = JSON.parse(fs.readFileSync(motionPath, 'utf8')) as {
    frames: VideoMotionFrameSnapshot[];
  };
  return motion.frames[frameIndex] ?? null;
}

function compareFaceHairToAnchor(
  anchor: CharacterDnaAnchor,
  frame: VideoIdentityFrameSnapshot
): {
  face_identity: ValidationStatus;
  hair_identity: ValidationStatus;
  core_visual_dna_preserved: ValidationStatus;
} {
  const faceDrift = colorDistance(anchor.face_zone_rgb, frame.face_zone_rgb);
  const hairDrift = colorDistance(anchor.hair_zone_rgb, frame.hair_zone_rgb);

  const faceIdentity = toStatus(
    faceDrift <= MAX_FACE_IDENTITY_DRIFT && frame.face_zone_variance >= MIN_FACE_ZONE_VARIANCE
  );
  const hairIdentity = toStatus(hairDrift <= MAX_HAIRSTYLE_DRIFT);
  const coreVisualDnaPreserved = toStatus(
    faceDrift <= MAX_IDENTITY_MEMORY_DRIFT &&
      hairDrift <= MAX_IDENTITY_MEMORY_DRIFT &&
      frame.face_zone_variance >= MIN_FACE_ZONE_VARIANCE
  );

  return {
    face_identity: faceIdentity,
    hair_identity: hairIdentity,
    core_visual_dna_preserved: coreVisualDnaPreserved,
  };
}

function compareReentryMemory(
  anchor: CharacterDnaAnchor,
  frame: VideoIdentityFrameSnapshot
): CharacterEvolutionReentryResult {
  const faceDrift = colorDistance(anchor.face_zone_rgb, frame.face_zone_rgb);
  const hairDrift = colorDistance(anchor.hair_zone_rgb, frame.hair_zone_rgb);
  const memoryMatch = memorySignature(frame) === anchor.memory_signature;

  const faceIdentity = toStatus(
    faceDrift <= MAX_FACE_IDENTITY_DRIFT && frame.face_zone_variance >= MIN_FACE_ZONE_VARIANCE
  );
  const hairIdentity = toStatus(hairDrift <= MAX_HAIRSTYLE_DRIFT);
  const coreVisualDnaPreserved = toStatus(
    faceDrift <= MAX_IDENTITY_MEMORY_DRIFT &&
      hairDrift <= MAX_IDENTITY_MEMORY_DRIFT &&
      coreVisualDnaSignature(frame.face_zone_rgb, frame.hair_zone_rgb) === anchor.core_visual_dna_signature
  );
  const growthMemoryPreserved = toStatus(
    faceIdentity === 'PASS' &&
      hairIdentity === 'PASS' &&
      coreVisualDnaPreserved === 'PASS' &&
      frame.identity_signature === anchor.identity_signature &&
      memoryMatch
  );

  return {
    age_stage: REENTRY_STAGE_ID,
    source_id: anchor.source_id,
    face_identity: faceIdentity,
    hair_identity: hairIdentity,
    core_visual_dna_preserved: coreVisualDnaPreserved,
    growth_memory_preserved: growthMemoryPreserved,
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

function buildMarkdown(report: MovieAnalysisCharacterEvolutionValidationReport): string {
  const lines = [
    '# Movie Analysis Character Evolution Validation',
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
    '## Growth Journey',
    '',
    'Child → Teen → Young Adult → Adult → Reentry',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| character_identity_preserved | ${report.character_identity_preserved} |`,
    `| age_progression_valid | ${report.age_progression_valid} |`,
    `| costume_evolution_valid | ${report.costume_evolution_valid} |`,
    `| personality_evolution_valid | ${report.personality_evolution_valid} |`,
    `| role_evolution_valid | ${report.role_evolution_valid} |`,
    `| growth_memory_preserved | ${report.growth_memory_preserved} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| adapter_binding_preserved | ${report.adapter_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| identity_loss | ${report.identity_loss ? 'BLOCKED' : 'PASS'} |`,
    `| character_reset | ${report.character_reset ? 'BLOCKED' : 'PASS'} |`,
    `| growth_regression | ${report.growth_regression ? 'BLOCKED' : 'PASS'} |`,
    '',
    '## Journey Steps',
    ''
  );

  for (const step of report.journey_steps) {
    lines.push(
      `### ${step.age_stage}`,
      '',
      `- source_id: ${step.source_id}`,
      `- personality_stage: ${step.personality_stage ?? 'n/a'}`,
      `- role_stage: ${step.role_stage ?? 'n/a'}`,
      `- face_identity: ${step.face_identity}`,
      `- hair_identity: ${step.hair_identity}`,
      `- core_visual_dna_preserved: ${step.core_visual_dna_preserved}`,
      `- costume_evolution: ${step.costume_evolution}`,
      `- growth_score: ${step.growth_score}`,
      ''
    );
  }

  lines.push(
    '## Reentry',
    '',
    `- face_identity: ${report.reentry_result.face_identity}`,
    `- hair_identity: ${report.reentry_result.hair_identity}`,
    `- core_visual_dna_preserved: ${report.reentry_result.core_visual_dna_preserved}`,
    `- growth_memory_preserved: ${report.reentry_result.growth_memory_preserved}`,
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
  issues: CharacterEvolutionValidationIssue[]
): MovieAnalysisCharacterEvolutionValidationReport {
  const report: MovieAnalysisCharacterEvolutionValidationReport = {
    report_id: 'movie-analysis-character-evolution-validation-report-v1',
    phase: CHARACTER_EVOLUTION_VALIDATION_PHASE,
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
    level2_master_certification_v3_report_path: LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
    level2_completeness_audit_report_path: LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
    character_reentry_validation_report_path: CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
    character_evolution_validation_export_dir: CHARACTER_EVOLUTION_VALIDATION_EXPORT_DIR,
    character_evolution_validation_manifest_path: CHARACTER_EVOLUTION_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: 0,
    adapter_count: 0,
    growth_journey_stage_count: GROWTH_JOURNEY_STAGE_COUNT,
    growth_journey_transition_count: GROWTH_JOURNEY_TRANSITION_COUNT,
    character_identity_preserved: 'FAIL',
    age_progression_valid: 'FAIL',
    costume_evolution_valid: 'FAIL',
    personality_evolution_valid: 'FAIL',
    role_evolution_valid: 'FAIL',
    growth_memory_preserved: 'FAIL',
    dna_binding_preserved: 'FAIL',
    adapter_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    identity_loss: true,
    character_reset: true,
    growth_regression: true,
    dna_binding_break: true,
    adapter_binding_break: true,
    traceability_loss: true,
    character_evolution_validation_ready: 'FAIL',
    certification_status: null,
    character_dna_anchor: {
      age_stage: ANCHOR_AGE_STAGE_ID,
      source_id: 'GHIBLI_01',
      frame_index: ENTRY_FRAME_INDEX,
      face_zone_rgb: [0, 0, 0],
      hair_zone_rgb: [0, 0, 0],
      clothing_zone_rgb: [0, 0, 0],
      identity_signature: '',
      core_visual_dna_signature: '',
      memory_signature: '',
      face_zone_variance: 0,
    },
    journey_steps: [],
    reentry_result: {
      age_stage: REENTRY_STAGE_ID,
      source_id: 'GHIBLI_01',
      face_identity: 'FAIL',
      hair_identity: 'FAIL',
      core_visual_dna_preserved: 'FAIL',
      growth_memory_preserved: 'FAIL',
    },
    final_verdict: CHARACTER_EVOLUTION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, CHARACTER_EVOLUTION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CHARACTER_EVOLUTION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisCharacterEvolutionValidation(
  projectRoot?: string
): MovieAnalysisCharacterEvolutionValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: CharacterEvolutionValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const v3Report = loadReport<{
    final_verdict: string;
    certification_status: string | null;
    level2_master_certification_v3_ready: string;
  }>(root, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH);
  if (
    !v3Report ||
    v3Report.final_verdict !== LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT ||
    v3Report.certification_status !== LEVEL2_COMPLETE_STATUS ||
    v3Report.level2_master_certification_v3_ready !== 'PASS'
  ) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: 'Level2 master certification V3 must be PASS with LEVEL2_COMPLETE',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const gapAuditReport = loadReport<{ final_verdict: string }>(
    root,
    LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH
  );
  if (!gapAuditReport || gapAuditReport.final_verdict !== LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: `Required ${LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const characterReentryReport = loadReport<{
    final_verdict: string;
    face_identity: ValidationStatus;
    hair_identity: ValidationStatus;
    identity_memory_preserved: ValidationStatus;
  }>(root, CHARACTER_REENTRY_VALIDATION_REPORT_PATH);
  if (
    !characterReentryReport ||
    characterReentryReport.final_verdict !== CHARACTER_REENTRY_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Required ${CHARACTER_REENTRY_VALIDATION_PASS_VERDICT}`,
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

  const anchorSourceId = AGE_STAGE_SOURCE_MAP[ANCHOR_AGE_STAGE_ID];
  const anchorFrames = loadIdentitySnapshot(root, anchorSourceId);
  if (!anchorFrames) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing identity snapshot for ${anchorSourceId}`,
      severity: 'error',
      age_stage: ANCHOR_AGE_STAGE_ID,
    });
    return writeFailReport(root, timestamp, issues);
  }

  const anchorFrame = anchorFrames[ENTRY_FRAME_INDEX];
  const characterDnaAnchor: CharacterDnaAnchor = {
    age_stage: ANCHOR_AGE_STAGE_ID,
    source_id: anchorSourceId,
    frame_index: ENTRY_FRAME_INDEX,
    face_zone_rgb: anchorFrame.face_zone_rgb,
    hair_zone_rgb: anchorFrame.hair_zone_rgb,
    clothing_zone_rgb: anchorFrame.clothing_zone_rgb,
    identity_signature: anchorFrame.identity_signature,
    core_visual_dna_signature: coreVisualDnaSignature(anchorFrame.face_zone_rgb, anchorFrame.hair_zone_rgb),
    memory_signature: memorySignature(anchorFrame),
    face_zone_variance: anchorFrame.face_zone_variance,
  };

  const journeySteps: CharacterGrowthJourneyStep[] = [];
  let previousClothing: Rgb | null = null;
  let previousGrowthScore: number | null = null;
  let previousAgeOrder: number | null = null;
  let previousPersonalityOrder: number | null = null;
  let previousRoleOrder: number | null = null;

  for (let index = 0; index < GROWTH_JOURNEY_STAGE_IDS.length; index += 1) {
    const ageStage = GROWTH_JOURNEY_STAGE_IDS[index];
    const sourceId = GROWTH_STAGE_SOURCE_MAP[ageStage];
    const personalityStage =
      ageStage === REENTRY_STAGE_ID ? null : PERSONALITY_STAGE_IDS[index as 0 | 1 | 2 | 3];
    const roleStage = ageStage === REENTRY_STAGE_ID ? null : ROLE_STAGE_IDS[index as 0 | 1 | 2 | 3];

    const frames = loadIdentitySnapshot(root, sourceId);
    const styleFrame = loadStyleFrame(root, sourceId, ENTRY_FRAME_INDEX);
    const motionFrame = loadMotionFrame(root, sourceId, ENTRY_FRAME_INDEX);
    if (!frames || !styleFrame || !motionFrame) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing growth snapshots for ${sourceId} (${ageStage})`,
        severity: 'error',
        age_stage: ageStage,
      });
      return writeFailReport(root, timestamp, issues);
    }

    const entryFrame = frames[ENTRY_FRAME_INDEX];
    const comparison = compareFaceHairToAnchor(characterDnaAnchor, entryFrame);
    const score = growthScore(styleFrame, motionFrame, entryFrame);

    const clothingDistance =
      previousClothing === null ? 0 : colorDistance(previousClothing, entryFrame.clothing_zone_rgb);
    const costumeEvolution =
      ageStage === ANCHOR_AGE_STAGE_ID || ageStage === REENTRY_STAGE_ID
        ? 'PASS'
        : toStatus(clothingDistance >= MIN_COSTUME_EVOLUTION_DELTA);

    const ageOrder = ageStage === REENTRY_STAGE_ID ? AGE_STAGE_ORDER.Adult : AGE_STAGE_ORDER[ageStage as (typeof AGE_STAGE_IDS)[number]];
    const ageProgressionValid =
      ageStage === REENTRY_STAGE_ID
        ? 'PASS'
        : toStatus(previousAgeOrder === null || ageOrder === previousAgeOrder + 1);

    const personalityOrder =
      personalityStage === null ? null : PERSONALITY_STAGE_ORDER[personalityStage];
    const personalityEvolutionValid =
      personalityOrder === null
        ? 'PASS'
        : toStatus(
            previousPersonalityOrder === null || personalityOrder === previousPersonalityOrder + 1
          );

    const roleOrder = roleStage === null ? null : ROLE_STAGE_ORDER[roleStage];
    const roleEvolutionValid =
      roleOrder === null
        ? 'PASS'
        : toStatus(previousRoleOrder === null || roleOrder === previousRoleOrder + 1);

    if (comparison.face_identity === 'FAIL' || comparison.hair_identity === 'FAIL') {
      issues.push({
        code: 'IDENTITY_LOSS',
        message: `Face or hair identity lost at ${ageStage}`,
        severity: 'error',
        age_stage: ageStage,
      });
    }

    if (ageStage !== REENTRY_STAGE_ID && costumeEvolution === 'FAIL') {
      issues.push({
        code: 'GROWTH_REGRESSION',
        message: `Costume evolution not observed at ${ageStage}`,
        severity: 'error',
        age_stage: ageStage,
      });
    }

    if (
      previousGrowthScore !== null &&
      ageStage !== REENTRY_STAGE_ID &&
      score < previousGrowthScore - MAX_CHARACTER_GROWTH_REGRESSION
    ) {
      issues.push({
        code: 'GROWTH_REGRESSION',
        message: `Personality growth regression at ${ageStage}`,
        severity: 'error',
        age_stage: ageStage,
      });
    }

    if (ageProgressionValid === 'FAIL' || personalityEvolutionValid === 'FAIL' || roleEvolutionValid === 'FAIL') {
      issues.push({
        code: 'GROWTH_REGRESSION',
        message: `Stage progression invalid at ${ageStage}`,
        severity: 'error',
        age_stage: ageStage,
      });
    }

    journeySteps.push({
      step_index: index,
      age_stage: ageStage,
      personality_stage: personalityStage,
      role_stage: roleStage,
      source_id: sourceId,
      entry_frame: entryFrame,
      face_identity: comparison.face_identity,
      hair_identity: comparison.hair_identity,
      core_visual_dna_preserved: comparison.core_visual_dna_preserved,
      costume_evolution: costumeEvolution,
      growth_score: score,
      age_progression_valid: ageProgressionValid,
      personality_evolution_valid: personalityEvolutionValid,
      role_evolution_valid: roleEvolutionValid,
    });

    previousClothing = entryFrame.clothing_zone_rgb;
    previousGrowthScore = ageStage === REENTRY_STAGE_ID ? previousGrowthScore : score;
    previousAgeOrder = ageStage === REENTRY_STAGE_ID ? previousAgeOrder : ageOrder;
    previousPersonalityOrder = personalityOrder ?? previousPersonalityOrder;
    previousRoleOrder = roleOrder ?? previousRoleOrder;
  }

  const growthSteps = journeySteps.filter((step) => step.age_stage !== REENTRY_STAGE_ID);
  const reentryComparison = compareReentryMemory(characterDnaAnchor, anchorFrames[ENTRY_FRAME_INDEX]);
  const dnaBinding = validateDnaBinding(testManifest.results);
  const adapterBinding = validateAdapterBinding(testManifest.results);
  const traceabilityPreserved = validateTraceability(testManifest.results);

  if (reentryComparison.growth_memory_preserved === 'FAIL') {
    issues.push({
      code: 'CHARACTER_RESET',
      message: 'Growth memory not preserved on Child reentry after evolution journey',
      severity: 'error',
      age_stage: REENTRY_STAGE_ID,
    });
  }

  if (dnaBinding === 'FAIL') {
    issues.push({
      code: 'DNA_BINDING_BREAK',
      message: 'DNA binding break detected across growth journey sources',
      severity: 'error',
    });
  }
  if (adapterBinding === 'FAIL') {
    issues.push({
      code: 'ADAPTER_BINDING_BREAK',
      message: 'Adapter binding break detected across growth journey sources',
      severity: 'error',
    });
  }
  if (traceabilityPreserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability loss detected across growth journey sources',
      severity: 'error',
    });
  }

  const characterIdentityPreserved = toStatus(
    growthSteps.every(
      (step) => step.face_identity === 'PASS' && step.hair_identity === 'PASS' && step.core_visual_dna_preserved === 'PASS'
    ) && reentryComparison.face_identity === 'PASS' && reentryComparison.hair_identity === 'PASS'
  );

  const ageProgressionValid = toStatus(
    growthSteps.every((step) => step.age_progression_valid === 'PASS')
  );

  const costumeEvolutionValid = toStatus(
    growthSteps
      .filter((step) => step.age_stage !== ANCHOR_AGE_STAGE_ID)
      .every((step) => step.costume_evolution === 'PASS')
  );

  const personalityEvolutionValid = toStatus(
    growthSteps.every((step) => step.personality_evolution_valid === 'PASS') &&
      !growthSteps.some(
        (step, idx) =>
          idx > 0 &&
          step.growth_score < growthSteps[idx - 1].growth_score - MAX_CHARACTER_GROWTH_REGRESSION
      )
  );

  const roleEvolutionValid = toStatus(
    growthSteps.every((step) => step.role_evolution_valid === 'PASS')
  );

  const growthMemoryPreserved = reentryComparison.growth_memory_preserved;

  const identityLoss =
    characterIdentityPreserved === 'FAIL' ||
    growthSteps.some((step) => step.face_identity === 'FAIL' || step.hair_identity === 'FAIL');

  const growthRegression =
    ageProgressionValid === 'FAIL' ||
    personalityEvolutionValid === 'FAIL' ||
    roleEvolutionValid === 'FAIL' ||
    costumeEvolutionValid === 'FAIL';

  const characterReset = growthMemoryPreserved === 'FAIL' || reentryComparison.core_visual_dna_preserved === 'FAIL';
  const dnaBindingBreak = dnaBinding === 'FAIL';
  const adapterBindingBreak = adapterBinding === 'FAIL';
  const traceabilityLoss = traceabilityPreserved === 'FAIL';

  const gateChecks: ValidationStatus[] = [
    characterIdentityPreserved,
    ageProgressionValid,
    costumeEvolutionValid,
    personalityEvolutionValid,
    roleEvolutionValid,
    growthMemoryPreserved,
    dnaBinding,
    adapterBinding,
    traceabilityPreserved,
  ];

  const characterEvolutionValidationReady =
    !identityLoss &&
    !characterReset &&
    !growthRegression &&
    !dnaBindingBreak &&
    !adapterBindingBreak &&
    !traceabilityLoss &&
    gateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = characterEvolutionValidationReady === 'PASS';

  const manifest: MovieAnalysisCharacterEvolutionValidationManifest = {
    manifest_id: 'movie-analysis-character-evolution-validation-manifest-v1',
    phase: CHARACTER_EVOLUTION_VALIDATION_PHASE,
    generated_at: timestamp,
    character_reentry_validation_report_path: CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
    anchor_age_stage: ANCHOR_AGE_STAGE_ID,
    journey_path: GROWTH_JOURNEY_STAGE_IDS.map((ageStage, index) => ({
      age_stage: ageStage,
      personality_stage:
        ageStage === REENTRY_STAGE_ID ? null : PERSONALITY_STAGE_IDS[index as 0 | 1 | 2 | 3],
      role_stage: ageStage === REENTRY_STAGE_ID ? null : ROLE_STAGE_IDS[index as 0 | 1 | 2 | 3],
      source_id: GROWTH_STAGE_SOURCE_MAP[ageStage],
    })),
    character_dna_anchor: characterDnaAnchor,
    journey_steps: journeySteps,
    reentry_result: reentryComparison,
  };

  fs.mkdirSync(path.join(root, CHARACTER_EVOLUTION_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, CHARACTER_EVOLUTION_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CHARACTER_EVOLUTION_VALIDATION_EXPORT_DIR, 'character-evolution-journey.json'),
    `${JSON.stringify(
      {
        journey_path: manifest.journey_path,
        character_dna_anchor: characterDnaAnchor,
        journey_steps: journeySteps.map((step) => ({
          step_index: step.step_index,
          age_stage: step.age_stage,
          personality_stage: step.personality_stage,
          role_stage: step.role_stage,
          source_id: step.source_id,
          face_identity: step.face_identity,
          hair_identity: step.hair_identity,
          core_visual_dna_preserved: step.core_visual_dna_preserved,
          costume_evolution: step.costume_evolution,
          growth_score: step.growth_score,
          age_progression_valid: step.age_progression_valid,
          personality_evolution_valid: step.personality_evolution_valid,
          role_evolution_valid: step.role_evolution_valid,
        })),
        reentry_result: reentryComparison,
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

  const report: MovieAnalysisCharacterEvolutionValidationReport = {
    report_id: 'movie-analysis-character-evolution-validation-report-v1',
    phase: CHARACTER_EVOLUTION_VALIDATION_PHASE,
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
    level2_master_certification_v3_report_path: LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
    level2_completeness_audit_report_path: LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
    character_reentry_validation_report_path: CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
    character_evolution_validation_export_dir: CHARACTER_EVOLUTION_VALIDATION_EXPORT_DIR,
    character_evolution_validation_manifest_path: CHARACTER_EVOLUTION_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_style_dir: VIDEO_STYLE_DIR,
    video_motion_dir: VIDEO_MOTION_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    growth_journey_stage_count: GROWTH_JOURNEY_STAGE_COUNT,
    growth_journey_transition_count: GROWTH_JOURNEY_TRANSITION_COUNT,
    character_identity_preserved: characterIdentityPreserved,
    age_progression_valid: ageProgressionValid,
    costume_evolution_valid: costumeEvolutionValid,
    personality_evolution_valid: personalityEvolutionValid,
    role_evolution_valid: roleEvolutionValid,
    growth_memory_preserved: growthMemoryPreserved,
    dna_binding_preserved: dnaBinding,
    adapter_binding_preserved: adapterBinding,
    traceability_preserved: traceabilityPreserved,
    identity_loss: identityLoss,
    character_reset: characterReset,
    growth_regression: growthRegression,
    dna_binding_break: dnaBindingBreak,
    adapter_binding_break: adapterBindingBreak,
    traceability_loss: traceabilityLoss,
    character_evolution_validation_ready: characterEvolutionValidationReady,
    certification_status: pass ? CHARACTER_EVOLUTION_VALIDATION_STATUS_MESSAGE : null,
    character_dna_anchor: characterDnaAnchor,
    journey_steps: journeySteps,
    reentry_result: reentryComparison,
    final_verdict: pass
      ? CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT
      : CHARACTER_EVOLUTION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, CHARACTER_EVOLUTION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CHARACTER_EVOLUTION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}

function loadReport<T>(projectRoot: string, reportPath: string): T | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}
