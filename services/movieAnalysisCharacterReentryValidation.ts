import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH,
  MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  MULTI_SCENE_VALIDATION_MANIFEST_PATH,
} from './movieAnalysisMultiSceneConsistencyValidation.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import {
  MAX_CLOTHING_DRIFT,
  MAX_FACE_IDENTITY_DRIFT,
  MAX_FRAME_IDENTITY_DRIFT,
  MAX_HAIRSTYLE_DRIFT,
  MIN_FACE_ZONE_VARIANCE,
  VIDEO_IDENTITY_DIR,
  type VideoIdentityFrameSnapshot,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const CHARACTER_REENTRY_VALIDATION_PHASE =
  'PHASE-LEVEL2E-003-CHARACTER_REENTRY_VALIDATION_V1' as const;
export const CHARACTER_REENTRY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_CHARACTER_REENTRY_VALIDATION_V1' as const;
export const CHARACTER_REENTRY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_CHARACTER_REENTRY_VALIDATION_V1' as const;
export const CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE =
  'CHARACTER_REENTRY_VALIDATED' as const;
export const CHARACTER_REENTRY_VALIDATION_DIR =
  'reports/movie_analysis_character_reentry_validation' as const;
export const CHARACTER_REENTRY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_character_reentry_validation/movie-analysis-character-reentry-validation-report.json' as const;
export const CHARACTER_REENTRY_VALIDATION_MD_PATH =
  'reports/movie_analysis_character_reentry_validation/MOVIE_ANALYSIS_CHARACTER_REENTRY_VALIDATION.md' as const;
export const CHARACTER_REENTRY_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_character_reentry_validation' as const;
export const CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_character_reentry_validation/movie-analysis-character-reentry-validation-manifest.json' as const;

export const CHARACTER_REENTRY_SCENE_IDS = [
  'Scene A',
  'Scene B',
  'Scene C',
  'Scene D',
  'Scene E',
  'Scene F',
] as const;
export const CHARACTER_REENTRY_SCENE_COUNT = CHARACTER_REENTRY_SCENE_IDS.length;
export const CHARACTER_REENTRY_TRANSITION_COUNT = CHARACTER_REENTRY_SCENE_COUNT - 1;
export const ANCHOR_SCENE_ID = 'Scene A' as const;
export const REENTRY_SCENE_ID = 'Scene A' as const;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const ANCHOR_FRAME_INDEX = 0;
export const EXIT_FRAME_INDEX = BASE_CLIP_FRAME_COUNT - 1;

export const MAX_IDENTITY_MEMORY_DRIFT = MAX_FRAME_IDENTITY_DRIFT;

export const CHARACTER_REENTRY_SCENE_SOURCE_MAP: Record<
  (typeof CHARACTER_REENTRY_SCENE_IDS)[number],
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
> = {
  'Scene A': 'GHIBLI_01',
  'Scene B': 'LITTLE_WOMEN_01',
  'Scene C': 'MORI_01',
  'Scene D': 'SHINKAI_01',
  'Scene E': 'GHIBLI_01',
  'Scene F': 'LITTLE_WOMEN_01',
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type CharacterReentryValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  scene_id?: string;
};

export type CharacterIdentityAnchor = {
  scene_id: (typeof CHARACTER_REENTRY_SCENE_IDS)[number];
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
  face_zone_rgb: [number, number, number];
  hair_zone_rgb: [number, number, number];
  clothing_zone_rgb: [number, number, number];
  identity_signature: string;
  face_zone_variance: number;
  memory_signature: string;
};

export type CharacterJourneyStep = {
  step_index: number;
  scene_id: (typeof CHARACTER_REENTRY_SCENE_IDS)[number];
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  entry_frame: VideoIdentityFrameSnapshot;
  exit_frame: VideoIdentityFrameSnapshot;
  face_identity: ValidationStatus;
  hair_identity: ValidationStatus;
  costume_identity: ValidationStatus;
  identity_memory_preserved: ValidationStatus;
};

export type CharacterReentryResult = {
  anchor_scene_id: typeof ANCHOR_SCENE_ID;
  reentry_scene_id: typeof REENTRY_SCENE_ID;
  anchor_source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  journey_scene_count: typeof CHARACTER_REENTRY_SCENE_COUNT;
  journey_transition_count: typeof CHARACTER_REENTRY_TRANSITION_COUNT;
  face_identity: ValidationStatus;
  hair_identity: ValidationStatus;
  costume_identity: ValidationStatus;
  dna_binding: ValidationStatus;
  adapter_binding: ValidationStatus;
  identity_memory_preserved: ValidationStatus;
  character_reentry_failure: boolean;
  identity_memory_loss: boolean;
  character_reentry_validated: ValidationStatus;
};

export type MovieAnalysisCharacterReentryValidationManifest = {
  manifest_id: string;
  phase: typeof CHARACTER_REENTRY_VALIDATION_PHASE;
  generated_at: string;
  multi_scene_validation_manifest_path: typeof MULTI_SCENE_VALIDATION_MANIFEST_PATH;
  anchor_scene_id: typeof ANCHOR_SCENE_ID;
  reentry_scene_id: typeof REENTRY_SCENE_ID;
  journey_path: Array<{
    scene_id: (typeof CHARACTER_REENTRY_SCENE_IDS)[number];
    source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  }>;
  identity_anchor: CharacterIdentityAnchor;
  journey_steps: CharacterJourneyStep[];
  reentry_result: CharacterReentryResult;
};

export type MovieAnalysisCharacterReentryValidationReport = {
  report_id: string;
  phase: typeof CHARACTER_REENTRY_VALIDATION_PHASE;
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
  multi_scene_consistency_validation_report_path: typeof MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH;
  multi_scene_validation_manifest_path: typeof MULTI_SCENE_VALIDATION_MANIFEST_PATH;
  character_reentry_validation_export_dir: typeof CHARACTER_REENTRY_VALIDATION_EXPORT_DIR;
  character_reentry_validation_manifest_path: typeof CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH;
  video_identity_dir: typeof VIDEO_IDENTITY_DIR;
  source_count: number;
  adapter_count: number;
  journey_scene_count: typeof CHARACTER_REENTRY_SCENE_COUNT;
  journey_transition_count: typeof CHARACTER_REENTRY_TRANSITION_COUNT;
  face_identity: ValidationStatus;
  hair_identity: ValidationStatus;
  costume_identity: ValidationStatus;
  dna_binding: ValidationStatus;
  adapter_binding: ValidationStatus;
  identity_memory_preserved: ValidationStatus;
  character_reentry_failure: boolean;
  identity_memory_loss: boolean;
  character_reentry_validation_ready: ValidationStatus;
  certification_status: typeof CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE | null;
  identity_anchor: CharacterIdentityAnchor;
  journey_steps: CharacterJourneyStep[];
  reentry_result: CharacterReentryResult;
  final_verdict:
    | typeof CHARACTER_REENTRY_VALIDATION_PASS_VERDICT
    | typeof CHARACTER_REENTRY_VALIDATION_FAIL_VERDICT;
  issues: CharacterReentryValidationIssue[];
};

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) / 255;
}

function toStatus(value: boolean): ValidationStatus {
  return value ? 'PASS' : 'FAIL';
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

function loadIdentitySnapshot(
  root: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): VideoIdentityFrameSnapshot[] | null {
  const identityPath = path.join(root, VIDEO_IDENTITY_DIR, `${sourceId}-video-identity.json`);
  if (!fs.existsSync(identityPath)) {
    return null;
  }
  const identity = JSON.parse(fs.readFileSync(identityPath, 'utf8')) as {
    frames: VideoIdentityFrameSnapshot[];
  };
  if (identity.frames.length !== BASE_CLIP_FRAME_COUNT) {
    return null;
  }
  return identity.frames;
}

function compareIdentityToAnchor(
  anchor: CharacterIdentityAnchor,
  frame: VideoIdentityFrameSnapshot
): {
  face_identity: ValidationStatus;
  hair_identity: ValidationStatus;
  costume_identity: ValidationStatus;
  identity_memory_preserved: ValidationStatus;
} {
  const faceDrift = colorDistance(anchor.face_zone_rgb, frame.face_zone_rgb);
  const hairDrift = colorDistance(anchor.hair_zone_rgb, frame.hair_zone_rgb);
  const clothingDrift = colorDistance(anchor.clothing_zone_rgb, frame.clothing_zone_rgb);
  const memoryMatch = memorySignature(frame) === anchor.memory_signature;

  const faceIdentity = toStatus(
    faceDrift <= MAX_FACE_IDENTITY_DRIFT && frame.face_zone_variance >= MIN_FACE_ZONE_VARIANCE
  );
  const hairIdentity = toStatus(hairDrift <= MAX_HAIRSTYLE_DRIFT);
  const costumeIdentity = toStatus(clothingDrift <= MAX_CLOTHING_DRIFT);
  const identityMemoryPreserved = toStatus(
    faceDrift <= MAX_IDENTITY_MEMORY_DRIFT &&
      hairDrift <= MAX_IDENTITY_MEMORY_DRIFT &&
      clothingDrift <= MAX_IDENTITY_MEMORY_DRIFT &&
      frame.identity_signature === anchor.identity_signature &&
      memoryMatch
  );

  return {
    face_identity: faceIdentity,
    hair_identity: hairIdentity,
    costume_identity: costumeIdentity,
    identity_memory_preserved: identityMemoryPreserved,
  };
}

function validateDnaBinding(testResult: RealModelTestGenerationResult | null): ValidationStatus {
  return toStatus(
    testResult?.dna_binding.binding_preserved === true &&
      testResult.dna_binding.cinematic_dna_id.length > 0 &&
      testResult.traceability.cinematic_dna_id === testResult.dna_binding.cinematic_dna_id
  );
}

function validateAdapterBinding(testResult: RealModelTestGenerationResult | null): ValidationStatus {
  return toStatus(
    testResult?.adapter_binding.binding_preserved === true &&
      testResult.adapter_binding.adapter_ids.some((id) => id.includes('emotion_adapter')) &&
      testResult.adapter_binding.adapter_ids.some((id) => id.includes('storytelling_adapter'))
  );
}

function buildMarkdown(report: MovieAnalysisCharacterReentryValidationReport): string {
  const lines = [
    '# Movie Analysis Character Reentry Validation',
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
    '## Journey Path',
    '',
    'Scene A → Scene B → Scene C → Scene D → Scene E → Scene F → Scene A (reentry)',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| face_identity | ${report.face_identity} |`,
    `| hair_identity | ${report.hair_identity} |`,
    `| costume_identity | ${report.costume_identity} |`,
    `| dna_binding | ${report.dna_binding} |`,
    `| adapter_binding | ${report.adapter_binding} |`,
    `| identity_memory_preserved | ${report.identity_memory_preserved} |`,
    `| character_reentry_failure | ${report.character_reentry_failure} |`,
    `| identity_memory_loss | ${report.identity_memory_loss} |`,
    '',
    '## Journey Steps',
    ''
  );

  for (const step of report.journey_steps) {
    lines.push(
      `- ${step.scene_id} (${step.source_id}): face=${step.face_identity} hair=${step.hair_identity} costume=${step.costume_identity} memory=${step.identity_memory_preserved}`
    );
  }

  lines.push(
    '',
    '## Reentry Result',
    '',
    `- face_identity: ${report.reentry_result.face_identity}`,
    `- hair_identity: ${report.reentry_result.hair_identity}`,
    `- costume_identity: ${report.reentry_result.costume_identity}`,
    `- dna_binding: ${report.reentry_result.dna_binding}`,
    `- adapter_binding: ${report.reentry_result.adapter_binding}`,
    `- character_reentry_validated: ${report.reentry_result.character_reentry_validated}`,
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
  issues: CharacterReentryValidationIssue[]
): MovieAnalysisCharacterReentryValidationReport {
  const report: MovieAnalysisCharacterReentryValidationReport = {
    report_id: 'movie-analysis-character-reentry-validation-report-v1',
    phase: CHARACTER_REENTRY_VALIDATION_PHASE,
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
    multi_scene_consistency_validation_report_path: MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH,
    multi_scene_validation_manifest_path: MULTI_SCENE_VALIDATION_MANIFEST_PATH,
    character_reentry_validation_export_dir: CHARACTER_REENTRY_VALIDATION_EXPORT_DIR,
    character_reentry_validation_manifest_path: CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    source_count: 0,
    adapter_count: 0,
    journey_scene_count: CHARACTER_REENTRY_SCENE_COUNT,
    journey_transition_count: CHARACTER_REENTRY_TRANSITION_COUNT,
    face_identity: 'FAIL',
    hair_identity: 'FAIL',
    costume_identity: 'FAIL',
    dna_binding: 'FAIL',
    adapter_binding: 'FAIL',
    identity_memory_preserved: 'FAIL',
    character_reentry_failure: true,
    identity_memory_loss: true,
    character_reentry_validation_ready: 'FAIL',
    certification_status: null,
    identity_anchor: {
      scene_id: 'Scene A',
      source_id: 'GHIBLI_01',
      frame_index: 0,
      face_zone_rgb: [0, 0, 0],
      hair_zone_rgb: [0, 0, 0],
      clothing_zone_rgb: [0, 0, 0],
      identity_signature: '',
      face_zone_variance: 0,
      memory_signature: '',
    },
    journey_steps: [],
    reentry_result: {
      anchor_scene_id: 'Scene A',
      reentry_scene_id: 'Scene A',
      anchor_source_id: 'GHIBLI_01',
      journey_scene_count: CHARACTER_REENTRY_SCENE_COUNT,
      journey_transition_count: CHARACTER_REENTRY_TRANSITION_COUNT,
      face_identity: 'FAIL',
      hair_identity: 'FAIL',
      costume_identity: 'FAIL',
      dna_binding: 'FAIL',
      adapter_binding: 'FAIL',
      identity_memory_preserved: 'FAIL',
      character_reentry_failure: true,
      identity_memory_loss: true,
      character_reentry_validated: 'FAIL',
    },
    final_verdict: CHARACTER_REENTRY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, CHARACTER_REENTRY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, CHARACTER_REENTRY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CHARACTER_REENTRY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisCharacterReentryValidation(
  projectRoot?: string
): MovieAnalysisCharacterReentryValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: CharacterReentryValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const multiScenePath = path.join(root, MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(multiScenePath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const multiSceneReport = JSON.parse(fs.readFileSync(multiScenePath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (
    multiSceneReport.final_verdict !== MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT ||
    multiSceneReport.certification_status !== MULTI_SCENE_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'MULTI_SCENE_NOT_VALIDATED',
      message: `Required ${MULTI_SCENE_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(path.join(root, MULTI_SCENE_VALIDATION_MANIFEST_PATH))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${MULTI_SCENE_VALIDATION_MANIFEST_PATH}`,
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

  const anchorSourceId = CHARACTER_REENTRY_SCENE_SOURCE_MAP[ANCHOR_SCENE_ID];
  const anchorFrames = loadIdentitySnapshot(root, anchorSourceId);
  if (!anchorFrames) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing identity snapshot for ${anchorSourceId}`,
      severity: 'error',
      scene_id: ANCHOR_SCENE_ID,
    });
    return writeFailReport(root, timestamp, issues);
  }

  const anchorFrame = anchorFrames[ANCHOR_FRAME_INDEX];
  const identityAnchor: CharacterIdentityAnchor = {
    scene_id: ANCHOR_SCENE_ID,
    source_id: anchorSourceId,
    frame_index: ANCHOR_FRAME_INDEX,
    face_zone_rgb: anchorFrame.face_zone_rgb,
    hair_zone_rgb: anchorFrame.hair_zone_rgb,
    clothing_zone_rgb: anchorFrame.clothing_zone_rgb,
    identity_signature: anchorFrame.identity_signature,
    face_zone_variance: anchorFrame.face_zone_variance,
    memory_signature: memorySignature(anchorFrame),
  };

  const anchorTestResult =
    testManifest.results.find((result) => result.source_id === anchorSourceId) ?? null;

  const journeySteps: CharacterJourneyStep[] = [];
  for (let index = 0; index < CHARACTER_REENTRY_SCENE_IDS.length; index += 1) {
    const sceneId = CHARACTER_REENTRY_SCENE_IDS[index];
    const sourceId = CHARACTER_REENTRY_SCENE_SOURCE_MAP[sceneId];
    const frames = loadIdentitySnapshot(root, sourceId);
    if (!frames) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing identity snapshot for ${sourceId} (${sceneId})`,
        severity: 'error',
        scene_id: sceneId,
      });
      return writeFailReport(root, timestamp, issues);
    }

    const entryFrame = frames[ANCHOR_FRAME_INDEX];
    const exitFrame = frames[EXIT_FRAME_INDEX];
    const comparison = compareIdentityToAnchor(identityAnchor, entryFrame);

    if (sourceId === anchorSourceId) {
      if (comparison.identity_memory_preserved === 'FAIL') {
        issues.push({
          code: 'IDENTITY_MEMORY_LOSS',
          message: `Identity memory lost at ${sceneId}`,
          severity: 'error',
          scene_id: sceneId,
        });
      }
    }

    journeySteps.push({
      step_index: index,
      scene_id: sceneId,
      source_id: sourceId,
      entry_frame: entryFrame,
      exit_frame: exitFrame,
      ...comparison,
    });
  }

  const reentryFrame = anchorFrames[ANCHOR_FRAME_INDEX];
  const reentryComparison = compareIdentityToAnchor(identityAnchor, reentryFrame);
  const dnaBinding = validateDnaBinding(anchorTestResult);
  const adapterBinding = validateAdapterBinding(anchorTestResult);

  if (reentryComparison.face_identity === 'FAIL') {
    issues.push({
      code: 'CHARACTER_REENTRY_FAILURE',
      message: 'Face identity failed on Scene A reentry',
      severity: 'error',
      scene_id: REENTRY_SCENE_ID,
    });
  }
  if (reentryComparison.hair_identity === 'FAIL') {
    issues.push({
      code: 'CHARACTER_REENTRY_FAILURE',
      message: 'Hair identity failed on Scene A reentry',
      severity: 'error',
      scene_id: REENTRY_SCENE_ID,
    });
  }
  if (reentryComparison.costume_identity === 'FAIL') {
    issues.push({
      code: 'CHARACTER_REENTRY_FAILURE',
      message: 'Costume identity failed on Scene A reentry',
      severity: 'error',
      scene_id: REENTRY_SCENE_ID,
    });
  }
  if (dnaBinding === 'FAIL') {
    issues.push({
      code: 'CHARACTER_REENTRY_FAILURE',
      message: 'DNA binding failed on Scene A reentry',
      severity: 'error',
      scene_id: REENTRY_SCENE_ID,
    });
  }
  if (adapterBinding === 'FAIL') {
    issues.push({
      code: 'CHARACTER_REENTRY_FAILURE',
      message: 'Adapter binding failed on Scene A reentry',
      severity: 'error',
      scene_id: REENTRY_SCENE_ID,
    });
  }
  if (reentryComparison.identity_memory_preserved === 'FAIL') {
    issues.push({
      code: 'IDENTITY_MEMORY_LOSS',
      message: 'Identity memory lost on Scene A reentry after A→F journey',
      severity: 'error',
      scene_id: REENTRY_SCENE_ID,
    });
  }

  const ghibliSteps = journeySteps.filter((step) => step.source_id === anchorSourceId);
  const identityMemoryPreserved = toStatus(
    ghibliSteps.every((step) => step.identity_memory_preserved === 'PASS') &&
      reentryComparison.identity_memory_preserved === 'PASS'
  );

  const characterReentryFailure =
    reentryComparison.face_identity === 'FAIL' ||
    reentryComparison.hair_identity === 'FAIL' ||
    reentryComparison.costume_identity === 'FAIL' ||
    dnaBinding === 'FAIL' ||
    adapterBinding === 'FAIL';

  const identityMemoryLoss =
    identityMemoryPreserved === 'FAIL' || reentryComparison.identity_memory_preserved === 'FAIL';

  const reentryResult: CharacterReentryResult = {
    anchor_scene_id: ANCHOR_SCENE_ID,
    reentry_scene_id: REENTRY_SCENE_ID,
    anchor_source_id: anchorSourceId,
    journey_scene_count: CHARACTER_REENTRY_SCENE_COUNT,
    journey_transition_count: CHARACTER_REENTRY_TRANSITION_COUNT,
    face_identity: reentryComparison.face_identity,
    hair_identity: reentryComparison.hair_identity,
    costume_identity: reentryComparison.costume_identity,
    dna_binding: dnaBinding,
    adapter_binding: adapterBinding,
    identity_memory_preserved: reentryComparison.identity_memory_preserved,
    character_reentry_failure: characterReentryFailure,
    identity_memory_loss: identityMemoryLoss,
    character_reentry_validated:
      !characterReentryFailure && !identityMemoryLoss ? 'PASS' : 'FAIL',
  };

  const gateChecks: ValidationStatus[] = [
    reentryComparison.face_identity,
    reentryComparison.hair_identity,
    reentryComparison.costume_identity,
    dnaBinding,
    adapterBinding,
    identityMemoryPreserved,
  ];

  const characterReentryValidationReady =
    !characterReentryFailure &&
    !identityMemoryLoss &&
    gateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = characterReentryValidationReady === 'PASS';

  const manifest: MovieAnalysisCharacterReentryValidationManifest = {
    manifest_id: 'movie-analysis-character-reentry-validation-manifest-v1',
    phase: CHARACTER_REENTRY_VALIDATION_PHASE,
    generated_at: timestamp,
    multi_scene_validation_manifest_path: MULTI_SCENE_VALIDATION_MANIFEST_PATH,
    anchor_scene_id: ANCHOR_SCENE_ID,
    reentry_scene_id: REENTRY_SCENE_ID,
    journey_path: CHARACTER_REENTRY_SCENE_IDS.map((sceneId) => ({
      scene_id: sceneId,
      source_id: CHARACTER_REENTRY_SCENE_SOURCE_MAP[sceneId],
    })),
    identity_anchor: identityAnchor,
    journey_steps: journeySteps,
    reentry_result: reentryResult,
  };

  fs.mkdirSync(path.join(root, CHARACTER_REENTRY_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CHARACTER_REENTRY_VALIDATION_EXPORT_DIR, 'character-reentry-journey.json'),
    `${JSON.stringify(
      {
        journey_path: manifest.journey_path,
        identity_anchor: identityAnchor,
        journey_steps: journeySteps.map((step) => ({
          step_index: step.step_index,
          scene_id: step.scene_id,
          source_id: step.source_id,
          face_identity: step.face_identity,
          hair_identity: step.hair_identity,
          costume_identity: step.costume_identity,
          identity_memory_preserved: step.identity_memory_preserved,
        })),
        reentry_result: reentryResult,
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

  const report: MovieAnalysisCharacterReentryValidationReport = {
    report_id: 'movie-analysis-character-reentry-validation-report-v1',
    phase: CHARACTER_REENTRY_VALIDATION_PHASE,
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
    multi_scene_consistency_validation_report_path: MULTI_SCENE_CONSISTENCY_VALIDATION_REPORT_PATH,
    multi_scene_validation_manifest_path: MULTI_SCENE_VALIDATION_MANIFEST_PATH,
    character_reentry_validation_export_dir: CHARACTER_REENTRY_VALIDATION_EXPORT_DIR,
    character_reentry_validation_manifest_path: CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    journey_scene_count: CHARACTER_REENTRY_SCENE_COUNT,
    journey_transition_count: CHARACTER_REENTRY_TRANSITION_COUNT,
    face_identity: reentryComparison.face_identity,
    hair_identity: reentryComparison.hair_identity,
    costume_identity: reentryComparison.costume_identity,
    dna_binding: dnaBinding,
    adapter_binding: adapterBinding,
    identity_memory_preserved: identityMemoryPreserved,
    character_reentry_failure: characterReentryFailure,
    identity_memory_loss: identityMemoryLoss,
    character_reentry_validation_ready: characterReentryValidationReady,
    certification_status: pass ? CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE : null,
    identity_anchor: identityAnchor,
    journey_steps: journeySteps,
    reentry_result: reentryResult,
    final_verdict: pass
      ? CHARACTER_REENTRY_VALIDATION_PASS_VERDICT
      : CHARACTER_REENTRY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, CHARACTER_REENTRY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, CHARACTER_REENTRY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CHARACTER_REENTRY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
