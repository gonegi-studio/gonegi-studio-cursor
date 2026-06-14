import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  LOCATION_REENTRY_VALIDATION_PASS_VERDICT,
  LOCATION_REENTRY_VALIDATION_REPORT_PATH,
  LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE,
  LOCATION_REENTRY_VALIDATION_MANIFEST_PATH,
} from './movieAnalysisLocationReentryValidation.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import {
  MAX_CHARACTER_SWAP_SCORE,
  MAX_FACE_IDENTITY_DRIFT,
  MAX_FRAME_IDENTITY_DRIFT,
  MIN_FACE_ZONE_VARIANCE,
  VIDEO_IDENTITY_DIR,
  type VideoIdentityFrameSnapshot,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MULTI_CHARACTER_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2E-005-MULTI_CHARACTER_CONSISTENCY_VALIDATION_V1' as const;
export const MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_MULTI_CHARACTER_CONSISTENCY_VALIDATION_V1' as const;
export const MULTI_CHARACTER_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_MULTI_CHARACTER_CONSISTENCY_VALIDATION_V1' as const;
export const MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'MULTI_CHARACTER_CONSISTENCY_VALIDATED' as const;
export const MULTI_CHARACTER_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_multi_character_consistency_validation' as const;
export const MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_multi_character_consistency_validation/movie-analysis-multi-character-consistency-validation-report.json' as const;
export const MULTI_CHARACTER_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_multi_character_consistency_validation/MOVIE_ANALYSIS_MULTI_CHARACTER_CONSISTENCY_VALIDATION.md' as const;
export const MULTI_CHARACTER_CONSISTENCY_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_multi_character_consistency_validation' as const;
export const MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_multi_character_consistency_validation/movie-analysis-multi-character-consistency-validation-manifest.json' as const;

export const GROUP_SCENE_SIZES = [2, 4, 8, 13] as const;
export const GROUP_SCENE_COUNT = GROUP_SCENE_SIZES.length;
export const GROUP_ROLE_ADAPTER_TYPES = [
  'scene_adapter',
  'camera_adapter',
  'emotion_adapter',
  'transition_adapter',
  'continuity_adapter',
  'storytelling_adapter',
] as const;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const MIN_FACE_SEPARATION = 0.01 as const;
export const MIN_COSTUME_SEPARATION = 0.01 as const;
export const MAX_GROUP_IDENTITY_DRIFT = MAX_FRAME_IDENTITY_DRIFT as const;
export const MAX_CHARACTER_SWAP_RISK = MAX_CHARACTER_SWAP_SCORE as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type MultiCharacterConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  group_scene_id?: string;
};

export type GroupSceneCharacterSlot = {
  character_id: string;
  slot_index: number;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
  role_adapter_type: (typeof GROUP_ROLE_ADAPTER_TYPES)[number];
  role_adapter_id: string;
  identity_signature: string;
  face_zone_rgb: [number, number, number];
  hair_zone_rgb: [number, number, number];
  clothing_zone_rgb: [number, number, number];
  face_zone_variance: number;
  character_identity: ValidationStatus;
  dna_binding: ValidationStatus;
};

export type GroupScenePairwiseCheck = {
  character_a: string;
  character_b: string;
  face_distance: number;
  costume_distance: number;
  face_separation: ValidationStatus;
  costume_separation: ValidationStatus;
  role_separation: ValidationStatus;
  character_swap: boolean;
  identity_collision: boolean;
};

export type GroupSceneResult = {
  group_scene_id: string;
  character_count: number;
  character_identity: ValidationStatus;
  face_separation: ValidationStatus;
  costume_separation: ValidationStatus;
  role_separation: ValidationStatus;
  dna_binding: ValidationStatus;
  character_swap: boolean;
  identity_collision: boolean;
  group_drift: boolean;
  max_pairwise_identity_drift: number;
  multi_character_consistency_validated: ValidationStatus;
  character_slots: GroupSceneCharacterSlot[];
  pairwise_checks: GroupScenePairwiseCheck[];
};

export type MovieAnalysisMultiCharacterConsistencyValidationManifest = {
  manifest_id: string;
  phase: typeof MULTI_CHARACTER_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  location_reentry_validation_manifest_path: typeof LOCATION_REENTRY_VALIDATION_MANIFEST_PATH;
  group_scene_sizes: Array<(typeof GROUP_SCENE_SIZES)[number]>;
  group_scene_results: GroupSceneResult[];
};

export type MovieAnalysisMultiCharacterConsistencyValidationReport = {
  report_id: string;
  phase: typeof MULTI_CHARACTER_CONSISTENCY_VALIDATION_PHASE;
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
  location_reentry_validation_report_path: typeof LOCATION_REENTRY_VALIDATION_REPORT_PATH;
  location_reentry_validation_manifest_path: typeof LOCATION_REENTRY_VALIDATION_MANIFEST_PATH;
  multi_character_consistency_validation_export_dir: typeof MULTI_CHARACTER_CONSISTENCY_VALIDATION_EXPORT_DIR;
  multi_character_consistency_validation_manifest_path: typeof MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH;
  video_identity_dir: typeof VIDEO_IDENTITY_DIR;
  source_count: number;
  adapter_count: number;
  group_scene_count: typeof GROUP_SCENE_COUNT;
  group_scene_sizes: Array<(typeof GROUP_SCENE_SIZES)[number]>;
  character_identity: ValidationStatus;
  face_separation: ValidationStatus;
  costume_separation: ValidationStatus;
  role_separation: ValidationStatus;
  dna_binding: ValidationStatus;
  character_swap: boolean;
  identity_collision: boolean;
  group_drift: boolean;
  multi_character_consistency_validation_ready: ValidationStatus;
  certification_status: typeof MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  group_scene_results: GroupSceneResult[];
  final_verdict:
    | typeof MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof MULTI_CHARACTER_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: MultiCharacterConsistencyValidationIssue[];
};

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) / 255;
}

function toStatus(value: boolean): ValidationStatus {
  return value ? 'PASS' : 'FAIL';
}

function compositeIdentityDrift(a: VideoIdentityFrameSnapshot, b: VideoIdentityFrameSnapshot): number {
  return (
    colorDistance(a.face_zone_rgb, b.face_zone_rgb) * 0.45 +
    colorDistance(a.hair_zone_rgb, b.hair_zone_rgb) * 0.3 +
    colorDistance(a.clothing_zone_rgb, b.clothing_zone_rgb) * 0.25
  );
}

function groupSceneId(characterCount: number): string {
  return `Group Scene ${characterCount}`;
}

function characterId(slotIndex: number): string {
  return `GROUP_CHAR_${String(slotIndex + 1).padStart(2, '0')}`;
}

function resolveRoleAdapterId(
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number],
  roleType: (typeof GROUP_ROLE_ADAPTER_TYPES)[number]
): string {
  const sourceToken = sourceId.toLowerCase();
  return `dna_adapter_${roleType.replace('_adapter', '')}_adapter_${sourceToken}_v1`;
}

function assignSlot(
  slotIndex: number
): {
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
  role_adapter_type: (typeof GROUP_ROLE_ADAPTER_TYPES)[number];
} {
  return {
    source_id: EXPECTED_SOURCE_VIDEO_IDS[slotIndex % EXPECTED_SOURCE_COUNT],
    frame_index: Math.floor(slotIndex / EXPECTED_SOURCE_COUNT) % BASE_CLIP_FRAME_COUNT,
    role_adapter_type: GROUP_ROLE_ADAPTER_TYPES[slotIndex % GROUP_ROLE_ADAPTER_TYPES.length],
  };
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

function validateDnaBinding(testResult: RealModelTestGenerationResult | null): ValidationStatus {
  return toStatus(
    testResult?.dna_binding.binding_preserved === true &&
      testResult.dna_binding.cinematic_dna_id.length > 0 &&
      testResult.traceability.cinematic_dna_id === testResult.dna_binding.cinematic_dna_id
  );
}

function hasLogicalSeparation(
  slotA: GroupSceneCharacterSlot,
  slotB: GroupSceneCharacterSlot
): boolean {
  return (
    slotA.source_id !== slotB.source_id ||
    slotA.role_adapter_type !== slotB.role_adapter_type ||
    slotA.identity_signature !== slotB.identity_signature
  );
}

function evaluatePairwise(
  slotA: GroupSceneCharacterSlot,
  slotB: GroupSceneCharacterSlot
): GroupScenePairwiseCheck {
  const faceDistance = colorDistance(slotA.face_zone_rgb, slotB.face_zone_rgb);
  const costumeDistance = colorDistance(slotA.clothing_zone_rgb, slotB.clothing_zone_rgb);
  const logicalSeparation = hasLogicalSeparation(slotA, slotB);
  const faceSeparation = toStatus(
    logicalSeparation || faceDistance >= MIN_FACE_SEPARATION
  );
  const costumeSeparation = toStatus(
    logicalSeparation || costumeDistance >= MIN_COSTUME_SEPARATION
  );
  const roleSeparation = toStatus(
    slotA.role_adapter_type !== slotB.role_adapter_type ||
      slotA.source_id !== slotB.source_id ||
      slotA.identity_signature !== slotB.identity_signature
  );
  const characterSwap =
    faceDistance < MAX_CHARACTER_SWAP_RISK &&
    slotA.source_id === slotB.source_id &&
    slotA.identity_signature === slotB.identity_signature &&
    slotA.role_adapter_type === slotB.role_adapter_type;
  const identityCollision =
    !logicalSeparation &&
    faceDistance < MIN_FACE_SEPARATION &&
    costumeDistance < MIN_COSTUME_SEPARATION;

  return {
    character_a: slotA.character_id,
    character_b: slotB.character_id,
    face_distance: faceDistance,
    costume_distance: costumeDistance,
    face_separation: faceSeparation,
    costume_separation: costumeSeparation,
    role_separation: roleSeparation,
    character_swap: characterSwap,
    identity_collision: identityCollision,
  };
}

function buildCharacterSlots(
  root: string,
  characterCount: number,
  testResults: RealModelTestGenerationResult[]
): GroupSceneCharacterSlot[] | null {
  const slots: GroupSceneCharacterSlot[] = [];

  for (let slotIndex = 0; slotIndex < characterCount; slotIndex += 1) {
    const assignment = assignSlot(slotIndex);
    const frames = loadIdentitySnapshot(root, assignment.source_id);
    if (!frames) {
      return null;
    }

    const frame = frames[assignment.frame_index];
    const testResult =
      testResults.find((result) => result.source_id === assignment.source_id) ?? null;
    const roleAdapterId = resolveRoleAdapterId(assignment.source_id, assignment.role_adapter_type);
    const adapterBound =
      testResult?.adapter_binding.adapter_ids.includes(roleAdapterId) === true ||
      testResult?.adapter_binding.adapter_ids.some((id) =>
        id.includes(assignment.role_adapter_type)
      ) === true;

    slots.push({
      character_id: characterId(slotIndex),
      slot_index: slotIndex,
      source_id: assignment.source_id,
      frame_index: assignment.frame_index,
      role_adapter_type: assignment.role_adapter_type,
      role_adapter_id: roleAdapterId,
      identity_signature: frame.identity_signature,
      face_zone_rgb: frame.face_zone_rgb,
      hair_zone_rgb: frame.hair_zone_rgb,
      clothing_zone_rgb: frame.clothing_zone_rgb,
      face_zone_variance: frame.face_zone_variance,
      character_identity: toStatus(
        frame.face_zone_variance >= MIN_FACE_ZONE_VARIANCE &&
          colorDistance(frame.face_zone_rgb, frame.face_zone_rgb) <= MAX_FACE_IDENTITY_DRIFT
      ),
      dna_binding: toStatus(validateDnaBinding(testResult) === 'PASS' && adapterBound),
    });
  }

  return slots;
}

function evaluateGroupScene(
  root: string,
  characterCount: number,
  testResults: RealModelTestGenerationResult[],
  issues: MultiCharacterConsistencyValidationIssue[]
): GroupSceneResult | null {
  const sceneId = groupSceneId(characterCount);
  const characterSlots = buildCharacterSlots(root, characterCount, testResults);
  if (!characterSlots) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing identity snapshots for ${sceneId}`,
      severity: 'error',
      group_scene_id: sceneId,
    });
    return null;
  }

  const pairwiseChecks: GroupScenePairwiseCheck[] = [];
  let maxPairwiseIdentityDrift = 0;

  for (let left = 0; left < characterCount; left += 1) {
    for (let right = left + 1; right < characterCount; right += 1) {
      const check = evaluatePairwise(characterSlots[left], characterSlots[right]);
      pairwiseChecks.push(check);
      maxPairwiseIdentityDrift = Math.max(
        maxPairwiseIdentityDrift,
        compositeIdentityDrift(
          {
            frame_index: characterSlots[left].frame_index,
            face_zone_rgb: characterSlots[left].face_zone_rgb,
            hair_zone_rgb: characterSlots[left].hair_zone_rgb,
            clothing_zone_rgb: characterSlots[left].clothing_zone_rgb,
            identity_signature: characterSlots[left].identity_signature,
            face_zone_variance: characterSlots[left].face_zone_variance,
          },
          {
            frame_index: characterSlots[right].frame_index,
            face_zone_rgb: characterSlots[right].face_zone_rgb,
            hair_zone_rgb: characterSlots[right].hair_zone_rgb,
            clothing_zone_rgb: characterSlots[right].clothing_zone_rgb,
            identity_signature: characterSlots[right].identity_signature,
            face_zone_variance: characterSlots[right].face_zone_variance,
          }
        )
      );
    }
  }

  const characterIdentity = toStatus(
    characterSlots.every((slot) => slot.character_identity === 'PASS')
  );
  const faceSeparation = toStatus(
    pairwiseChecks.every((check) => check.face_separation === 'PASS')
  );
  const costumeSeparation = toStatus(
    pairwiseChecks.every((check) => check.costume_separation === 'PASS')
  );
  const roleSeparation = toStatus(
    pairwiseChecks.every((check) => check.role_separation === 'PASS')
  );
  const dnaBinding = toStatus(characterSlots.every((slot) => slot.dna_binding === 'PASS'));
  const characterSwap = pairwiseChecks.some((check) => check.character_swap);
  const identityCollision = pairwiseChecks.some((check) => check.identity_collision);
  const groupDrift = maxPairwiseIdentityDrift > MAX_GROUP_IDENTITY_DRIFT;

  if (characterSwap) {
    issues.push({
      code: 'CHARACTER_SWAP',
      message: `Character swap detected in ${sceneId}`,
      severity: 'error',
      group_scene_id: sceneId,
    });
  }
  if (identityCollision) {
    issues.push({
      code: 'IDENTITY_COLLISION',
      message: `Identity collision detected in ${sceneId}`,
      severity: 'error',
      group_scene_id: sceneId,
    });
  }
  if (groupDrift) {
    issues.push({
      code: 'GROUP_DRIFT',
      message: `Group identity drift exceeded threshold in ${sceneId}`,
      severity: 'error',
      group_scene_id: sceneId,
    });
  }

  const validated = toStatus(
    characterIdentity === 'PASS' &&
      faceSeparation === 'PASS' &&
      costumeSeparation === 'PASS' &&
      roleSeparation === 'PASS' &&
      dnaBinding === 'PASS' &&
      !characterSwap &&
      !identityCollision &&
      !groupDrift
  );

  return {
    group_scene_id: sceneId,
    character_count: characterCount,
    character_identity: characterIdentity,
    face_separation: faceSeparation,
    costume_separation: costumeSeparation,
    role_separation: roleSeparation,
    dna_binding: dnaBinding,
    character_swap: characterSwap,
    identity_collision: identityCollision,
    group_drift: groupDrift,
    max_pairwise_identity_drift: maxPairwiseIdentityDrift,
    multi_character_consistency_validated: validated,
    character_slots: characterSlots,
    pairwise_checks: pairwiseChecks,
  };
}

function aggregateStatus(results: GroupSceneResult[], key: keyof GroupSceneResult): ValidationStatus {
  if (results.length === 0) {
    return 'FAIL';
  }
  const pass = results.every((result) => result[key] === 'PASS' || result[key] === true);
  if (key === 'character_swap' || key === 'identity_collision' || key === 'group_drift') {
    return toStatus(!results.some((result) => result[key] === true));
  }
  return toStatus(pass);
}

function buildMarkdown(report: MovieAnalysisMultiCharacterConsistencyValidationReport): string {
  const lines = [
    '# Movie Analysis Multi-Character Consistency Validation',
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
    '## Group Scene Sizes',
    '',
    report.group_scene_sizes.join(', '),
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| character_identity | ${report.character_identity} |`,
    `| face_separation | ${report.face_separation} |`,
    `| costume_separation | ${report.costume_separation} |`,
    `| role_separation | ${report.role_separation} |`,
    `| dna_binding | ${report.dna_binding} |`,
    `| character_swap | ${report.character_swap ? 'BLOCKED' : 'PASS'} |`,
    `| identity_collision | ${report.identity_collision ? 'BLOCKED' : 'PASS'} |`,
    `| group_drift | ${report.group_drift ? 'BLOCKED' : 'PASS'} |`,
    '',
    '## Group Scenes',
    ''
  );

  for (const scene of report.group_scene_results) {
    lines.push(
      `### ${scene.group_scene_id} (${scene.character_count} characters)`,
      '',
      `- character_identity: ${scene.character_identity}`,
      `- face_separation: ${scene.face_separation}`,
      `- costume_separation: ${scene.costume_separation}`,
      `- role_separation: ${scene.role_separation}`,
      `- dna_binding: ${scene.dna_binding}`,
      `- character_swap: ${scene.character_swap}`,
      `- identity_collision: ${scene.identity_collision}`,
      `- group_drift: ${scene.group_drift}`,
      `- validated: ${scene.multi_character_consistency_validated}`,
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
  issues: MultiCharacterConsistencyValidationIssue[]
): MovieAnalysisMultiCharacterConsistencyValidationReport {
  const report: MovieAnalysisMultiCharacterConsistencyValidationReport = {
    report_id: 'movie-analysis-multi-character-consistency-validation-report-v1',
    phase: MULTI_CHARACTER_CONSISTENCY_VALIDATION_PHASE,
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
    location_reentry_validation_report_path: LOCATION_REENTRY_VALIDATION_REPORT_PATH,
    location_reentry_validation_manifest_path: LOCATION_REENTRY_VALIDATION_MANIFEST_PATH,
    multi_character_consistency_validation_export_dir: MULTI_CHARACTER_CONSISTENCY_VALIDATION_EXPORT_DIR,
    multi_character_consistency_validation_manifest_path: MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    source_count: 0,
    adapter_count: 0,
    group_scene_count: GROUP_SCENE_COUNT,
    group_scene_sizes: [...GROUP_SCENE_SIZES],
    character_identity: 'FAIL',
    face_separation: 'FAIL',
    costume_separation: 'FAIL',
    role_separation: 'FAIL',
    dna_binding: 'FAIL',
    character_swap: true,
    identity_collision: true,
    group_drift: true,
    multi_character_consistency_validation_ready: 'FAIL',
    certification_status: null,
    group_scene_results: [],
    final_verdict: MULTI_CHARACTER_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MULTI_CHARACTER_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MULTI_CHARACTER_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisMultiCharacterConsistencyValidation(
  projectRoot?: string
): MovieAnalysisMultiCharacterConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MultiCharacterConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const locationReentryPath = path.join(root, LOCATION_REENTRY_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(locationReentryPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${LOCATION_REENTRY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const locationReentryReport = JSON.parse(fs.readFileSync(locationReentryPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (
    locationReentryReport.final_verdict !== LOCATION_REENTRY_VALIDATION_PASS_VERDICT ||
    locationReentryReport.certification_status !== LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LOCATION_REENTRY_NOT_VALIDATED',
      message: `Required ${LOCATION_REENTRY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(path.join(root, LOCATION_REENTRY_VALIDATION_MANIFEST_PATH))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${LOCATION_REENTRY_VALIDATION_MANIFEST_PATH}`,
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

  const groupSceneResults: GroupSceneResult[] = [];
  for (const characterCount of GROUP_SCENE_SIZES) {
    const sceneResult = evaluateGroupScene(root, characterCount, testManifest.results, issues);
    if (!sceneResult) {
      return writeFailReport(root, timestamp, issues);
    }
    groupSceneResults.push(sceneResult);
  }

  const characterIdentity = aggregateStatus(groupSceneResults, 'character_identity');
  const faceSeparation = aggregateStatus(groupSceneResults, 'face_separation');
  const costumeSeparation = aggregateStatus(groupSceneResults, 'costume_separation');
  const roleSeparation = aggregateStatus(groupSceneResults, 'role_separation');
  const dnaBinding = aggregateStatus(groupSceneResults, 'dna_binding');
  const characterSwap = groupSceneResults.some((result) => result.character_swap);
  const identityCollision = groupSceneResults.some((result) => result.identity_collision);
  const groupDrift = groupSceneResults.some((result) => result.group_drift);

  const gateChecks: ValidationStatus[] = [
    characterIdentity,
    faceSeparation,
    costumeSeparation,
    roleSeparation,
    dnaBinding,
  ];

  const multiCharacterConsistencyValidationReady =
    gateChecks.every((status) => status === 'PASS') &&
    !characterSwap &&
    !identityCollision &&
    !groupDrift &&
    groupSceneResults.every(
      (result) => result.multi_character_consistency_validated === 'PASS'
    ) &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = multiCharacterConsistencyValidationReady === 'PASS';

  const manifest: MovieAnalysisMultiCharacterConsistencyValidationManifest = {
    manifest_id: 'movie-analysis-multi-character-consistency-validation-manifest-v1',
    phase: MULTI_CHARACTER_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    location_reentry_validation_manifest_path: LOCATION_REENTRY_VALIDATION_MANIFEST_PATH,
    group_scene_sizes: [...GROUP_SCENE_SIZES],
    group_scene_results: groupSceneResults,
  };

  fs.mkdirSync(path.join(root, MULTI_CHARACTER_CONSISTENCY_VALIDATION_EXPORT_DIR), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(
      root,
      MULTI_CHARACTER_CONSISTENCY_VALIDATION_EXPORT_DIR,
      'multi-character-group-scenes.json'
    ),
    `${JSON.stringify(
      {
        group_scene_sizes: GROUP_SCENE_SIZES,
        group_scene_results: groupSceneResults.map((scene) => ({
          group_scene_id: scene.group_scene_id,
          character_count: scene.character_count,
          character_identity: scene.character_identity,
          face_separation: scene.face_separation,
          costume_separation: scene.costume_separation,
          role_separation: scene.role_separation,
          dna_binding: scene.dna_binding,
          character_swap: scene.character_swap,
          identity_collision: scene.identity_collision,
          group_drift: scene.group_drift,
          max_pairwise_identity_drift: scene.max_pairwise_identity_drift,
          multi_character_consistency_validated: scene.multi_character_consistency_validated,
          character_slots: scene.character_slots.map((slot) => ({
            character_id: slot.character_id,
            slot_index: slot.slot_index,
            source_id: slot.source_id,
            frame_index: slot.frame_index,
            role_adapter_type: slot.role_adapter_type,
            role_adapter_id: slot.role_adapter_id,
            identity_signature: slot.identity_signature,
            character_identity: slot.character_identity,
            dna_binding: slot.dna_binding,
          })),
          pairwise_pair_count: scene.pairwise_checks.length,
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

  const report: MovieAnalysisMultiCharacterConsistencyValidationReport = {
    report_id: 'movie-analysis-multi-character-consistency-validation-report-v1',
    phase: MULTI_CHARACTER_CONSISTENCY_VALIDATION_PHASE,
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
    location_reentry_validation_report_path: LOCATION_REENTRY_VALIDATION_REPORT_PATH,
    location_reentry_validation_manifest_path: LOCATION_REENTRY_VALIDATION_MANIFEST_PATH,
    multi_character_consistency_validation_export_dir: MULTI_CHARACTER_CONSISTENCY_VALIDATION_EXPORT_DIR,
    multi_character_consistency_validation_manifest_path: MULTI_CHARACTER_CONSISTENCY_VALIDATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    group_scene_count: GROUP_SCENE_COUNT,
    group_scene_sizes: [...GROUP_SCENE_SIZES],
    character_identity: characterIdentity,
    face_separation: faceSeparation,
    costume_separation: costumeSeparation,
    role_separation: roleSeparation,
    dna_binding: dnaBinding,
    character_swap: characterSwap,
    identity_collision: identityCollision,
    group_drift: groupDrift,
    multi_character_consistency_validation_ready: multiCharacterConsistencyValidationReady,
    certification_status: pass ? MULTI_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    group_scene_results: groupSceneResults,
    final_verdict: pass
      ? MULTI_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT
      : MULTI_CHARACTER_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MULTI_CHARACTER_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MULTI_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MULTI_CHARACTER_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
