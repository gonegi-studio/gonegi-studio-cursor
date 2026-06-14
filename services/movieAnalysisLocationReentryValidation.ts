import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  CHARACTER_REENTRY_VALIDATION_PASS_VERDICT,
  CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
  CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE,
  CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH,
} from './movieAnalysisCharacterReentryValidation.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import { SOURCE_LOCATION_DNA_ANCHORS } from './movieAnalysisRealLocationConsistencyValidation.js';
import {
  MAX_CROSS_FRAME_LOCATION_DRIFT,
  MAX_LIGHTING_FRAME_DRIFT,
  VIDEO_LOCATION_DIR,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LOCATION_REENTRY_VALIDATION_PHASE =
  'PHASE-LEVEL2E-004-LOCATION_REENTRY_VALIDATION_V1' as const;
export const LOCATION_REENTRY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LOCATION_REENTRY_VALIDATION_V1' as const;
export const LOCATION_REENTRY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LOCATION_REENTRY_VALIDATION_V1' as const;
export const LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE =
  'LOCATION_REENTRY_VALIDATED' as const;
export const LOCATION_REENTRY_VALIDATION_DIR =
  'reports/movie_analysis_location_reentry_validation' as const;
export const LOCATION_REENTRY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_location_reentry_validation/movie-analysis-location-reentry-validation-report.json' as const;
export const LOCATION_REENTRY_VALIDATION_MD_PATH =
  'reports/movie_analysis_location_reentry_validation/MOVIE_ANALYSIS_LOCATION_REENTRY_VALIDATION.md' as const;
export const LOCATION_REENTRY_VALIDATION_EXPORT_DIR =
  'exports/movie_analysis_location_reentry_validation' as const;
export const LOCATION_REENTRY_VALIDATION_MANIFEST_PATH =
  'exports/movie_analysis_location_reentry_validation/movie-analysis-location-reentry-validation-manifest.json' as const;

export const LOCATION_JOURNEY_IDS = [
  'Harbor',
  'Market',
  'Cafe',
  'Forest',
  'Station',
  'Harbor',
] as const;
export const LOCATION_JOURNEY_COUNT = LOCATION_JOURNEY_IDS.length;
export const LOCATION_TRANSITION_COUNT = LOCATION_JOURNEY_COUNT - 1;
export const ANCHOR_LOCATION_ID = 'Harbor' as const;
export const REENTRY_LOCATION_ID = 'Harbor' as const;
export const BASE_CLIP_FRAME_COUNT = CLIP_FRAMES_PER_SOURCE;
export const ANCHOR_FRAME_INDEX = 0;
export const EXIT_FRAME_INDEX = BASE_CLIP_FRAME_COUNT - 1;

export const MAX_LOCATION_MEMORY_DRIFT = MAX_CROSS_FRAME_LOCATION_DRIFT;

export const LOCATION_JOURNEY_SOURCE_MAP: Record<
  number,
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
> = {
  0: 'GHIBLI_01',
  1: 'LITTLE_WOMEN_01',
  2: 'MORI_01',
  3: 'SHINKAI_01',
  4: 'LITTLE_WOMEN_01',
  5: 'GHIBLI_01',
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type LocationReentryValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  location_id?: string;
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

export type LocationSnapshotBundle = {
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  location_dna_id: string;
  indoor_anchor_id: string;
  lighting_anchor_id: string;
  frames: VideoLocationFrameSnapshot[];
};

export type LocationIdentityAnchor = {
  location_id: typeof ANCHOR_LOCATION_ID;
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  frame_index: number;
  location_dna_id: string;
  indoor_anchor_id: string;
  lighting_anchor_id: string;
  location_signature: string;
  layout_signature: string;
  lighting_warmth: number;
  indoor_anchor_strength: number;
  sky_zone_rgb: [number, number, number];
  midground_zone_rgb: [number, number, number];
  ground_zone_rgb: [number, number, number];
  memory_signature: string;
};

export type LocationJourneyStep = {
  step_index: number;
  location_id: (typeof LOCATION_JOURNEY_IDS)[number];
  source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  entry_frame: VideoLocationFrameSnapshot;
  exit_frame: VideoLocationFrameSnapshot;
  location_identity: ValidationStatus;
  indoor_anchor: ValidationStatus;
  layout_anchor: ValidationStatus;
  lighting_anchor: ValidationStatus;
  environment_dna: ValidationStatus;
  location_memory_preserved: ValidationStatus;
};

export type LocationReentryResult = {
  anchor_location_id: typeof ANCHOR_LOCATION_ID;
  reentry_location_id: typeof REENTRY_LOCATION_ID;
  anchor_source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  journey_location_count: typeof LOCATION_JOURNEY_COUNT;
  journey_transition_count: typeof LOCATION_TRANSITION_COUNT;
  location_identity: ValidationStatus;
  indoor_anchor: ValidationStatus;
  layout_anchor: ValidationStatus;
  lighting_anchor: ValidationStatus;
  environment_dna: ValidationStatus;
  location_memory_preserved: ValidationStatus;
  location_reentry_failure: boolean;
  location_memory_loss: boolean;
  location_reentry_validated: ValidationStatus;
};

export type MovieAnalysisLocationReentryValidationManifest = {
  manifest_id: string;
  phase: typeof LOCATION_REENTRY_VALIDATION_PHASE;
  generated_at: string;
  character_reentry_validation_manifest_path: typeof CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH;
  anchor_location_id: typeof ANCHOR_LOCATION_ID;
  reentry_location_id: typeof REENTRY_LOCATION_ID;
  journey_path: Array<{
    step_index: number;
    location_id: (typeof LOCATION_JOURNEY_IDS)[number];
    source_id: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number];
  }>;
  location_anchor: LocationIdentityAnchor;
  journey_steps: LocationJourneyStep[];
  reentry_result: LocationReentryResult;
};

export type MovieAnalysisLocationReentryValidationReport = {
  report_id: string;
  phase: typeof LOCATION_REENTRY_VALIDATION_PHASE;
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
  character_reentry_validation_report_path: typeof CHARACTER_REENTRY_VALIDATION_REPORT_PATH;
  character_reentry_validation_manifest_path: typeof CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH;
  location_reentry_validation_export_dir: typeof LOCATION_REENTRY_VALIDATION_EXPORT_DIR;
  location_reentry_validation_manifest_path: typeof LOCATION_REENTRY_VALIDATION_MANIFEST_PATH;
  video_location_dir: typeof VIDEO_LOCATION_DIR;
  source_count: number;
  adapter_count: number;
  journey_location_count: typeof LOCATION_JOURNEY_COUNT;
  journey_transition_count: typeof LOCATION_TRANSITION_COUNT;
  location_identity: ValidationStatus;
  indoor_anchor: ValidationStatus;
  layout_anchor: ValidationStatus;
  lighting_anchor: ValidationStatus;
  environment_dna: ValidationStatus;
  location_memory_preserved: ValidationStatus;
  location_reentry_failure: boolean;
  location_memory_loss: boolean;
  location_reentry_validation_ready: ValidationStatus;
  certification_status: typeof LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE | null;
  location_anchor: LocationIdentityAnchor;
  journey_steps: LocationJourneyStep[];
  reentry_result: LocationReentryResult;
  final_verdict:
    | typeof LOCATION_REENTRY_VALIDATION_PASS_VERDICT
    | typeof LOCATION_REENTRY_VALIDATION_FAIL_VERDICT;
  issues: LocationReentryValidationIssue[];
};

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) / 255;
}

function toStatus(value: boolean): ValidationStatus {
  return value ? 'PASS' : 'FAIL';
}

function locationCompositeDrift(a: VideoLocationFrameSnapshot, b: VideoLocationFrameSnapshot): number {
  return (
    colorDistance(a.sky_zone_rgb, b.sky_zone_rgb) * 0.4 +
    colorDistance(a.midground_zone_rgb, b.midground_zone_rgb) * 0.35 +
    colorDistance(a.ground_zone_rgb, b.ground_zone_rgb) * 0.25
  );
}

function memorySignature(
  bundle: LocationSnapshotBundle,
  frame: VideoLocationFrameSnapshot
): string {
  return createHash('sha256')
    .update(
      [
        bundle.location_dna_id,
        bundle.indoor_anchor_id,
        bundle.lighting_anchor_id,
        frame.location_signature,
        frame.layout_signature,
        frame.lighting_warmth.toFixed(6),
      ].join('|')
    )
    .digest('hex')
    .slice(0, 16);
}

function loadLocationBundle(
  root: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): LocationSnapshotBundle | null {
  const locationPath = path.join(root, VIDEO_LOCATION_DIR, `${sourceId}-video-location.json`);
  if (!fs.existsSync(locationPath)) {
    return null;
  }

  const location = JSON.parse(fs.readFileSync(locationPath, 'utf8')) as {
    location_dna_id: string;
    indoor_anchor_id: string;
    lighting_anchor_id: string;
    frames: VideoLocationFrameSnapshot[];
  };

  if (location.frames.length !== BASE_CLIP_FRAME_COUNT) {
    return null;
  }

  return {
    source_id: sourceId,
    location_dna_id: location.location_dna_id,
    indoor_anchor_id: location.indoor_anchor_id,
    lighting_anchor_id: location.lighting_anchor_id,
    frames: location.frames,
  };
}

function compareLocationToAnchor(
  anchor: LocationIdentityAnchor,
  bundle: LocationSnapshotBundle,
  frame: VideoLocationFrameSnapshot,
  testResult: RealModelTestGenerationResult | null
): {
  location_identity: ValidationStatus;
  indoor_anchor: ValidationStatus;
  layout_anchor: ValidationStatus;
  lighting_anchor: ValidationStatus;
  environment_dna: ValidationStatus;
  location_memory_preserved: ValidationStatus;
} {
  const compositeDrift = locationCompositeDrift(
    {
      sky_zone_rgb: anchor.sky_zone_rgb,
      midground_zone_rgb: anchor.midground_zone_rgb,
      ground_zone_rgb: anchor.ground_zone_rgb,
    } as VideoLocationFrameSnapshot,
    frame
  );
  const lightingDrift = Math.abs(anchor.lighting_warmth - frame.lighting_warmth);
  const anchors = SOURCE_LOCATION_DNA_ANCHORS[bundle.source_id];
  const memoryMatch = memorySignature(bundle, frame) === anchor.memory_signature;

  const locationIdentity = toStatus(
    compositeDrift <= MAX_LOCATION_MEMORY_DRIFT &&
      frame.location_signature === anchor.location_signature
  );
  const indoorAnchor = toStatus(
    bundle.indoor_anchor_id === anchors.indoor_anchor_id &&
      bundle.indoor_anchor_id === anchor.indoor_anchor_id &&
      Math.abs(frame.indoor_anchor_strength - anchor.indoor_anchor_strength) <= 0.05
  );
  const layoutAnchor = toStatus(frame.layout_signature === anchor.layout_signature);
  const lightingAnchor = toStatus(
    bundle.lighting_anchor_id === anchors.lighting_anchor_id &&
      bundle.lighting_anchor_id === anchor.lighting_anchor_id &&
      lightingDrift <= MAX_LIGHTING_FRAME_DRIFT
  );
  const environmentDna = toStatus(
    bundle.location_dna_id === anchors.location_dna_id &&
      bundle.location_dna_id === anchor.location_dna_id &&
      testResult?.dna_binding.binding_preserved === true &&
      testResult.prompt.includes('continuity_environment_hold')
  );

  const locationMemoryPreserved = toStatus(
    locationIdentity === 'PASS' &&
      indoorAnchor === 'PASS' &&
      layoutAnchor === 'PASS' &&
      lightingAnchor === 'PASS' &&
      environmentDna === 'PASS' &&
      compositeDrift <= MAX_LOCATION_MEMORY_DRIFT &&
      memoryMatch
  );

  return {
    location_identity: locationIdentity,
    indoor_anchor: indoorAnchor,
    layout_anchor: layoutAnchor,
    lighting_anchor: lightingAnchor,
    environment_dna: environmentDna,
    location_memory_preserved: locationMemoryPreserved,
  };
}

function buildMarkdown(report: MovieAnalysisLocationReentryValidationReport): string {
  const lines = [
    '# Movie Analysis Location Reentry Validation',
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
    'Harbor → Market → Cafe → Forest → Station → Harbor',
    '',
    '## Certification Checks',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| location_identity | ${report.location_identity} |`,
    `| indoor_anchor | ${report.indoor_anchor} |`,
    `| layout_anchor | ${report.layout_anchor} |`,
    `| lighting_anchor | ${report.lighting_anchor} |`,
    `| environment_dna | ${report.environment_dna} |`,
    `| location_memory_preserved | ${report.location_memory_preserved} |`,
    `| location_reentry_failure | ${report.location_reentry_failure} |`,
    `| location_memory_loss | ${report.location_memory_loss} |`,
    '',
    '## Journey Steps',
    ''
  );

  for (const step of report.journey_steps) {
    lines.push(
      `- ${step.location_id} (${step.source_id}): location=${step.location_identity} indoor=${step.indoor_anchor} layout=${step.layout_anchor} lighting=${step.lighting_anchor} dna=${step.environment_dna} memory=${step.location_memory_preserved}`
    );
  }

  lines.push(
    '',
    '## Reentry Result',
    '',
    `- location_identity: ${report.reentry_result.location_identity}`,
    `- indoor_anchor: ${report.reentry_result.indoor_anchor}`,
    `- layout_anchor: ${report.reentry_result.layout_anchor}`,
    `- lighting_anchor: ${report.reentry_result.lighting_anchor}`,
    `- environment_dna: ${report.reentry_result.environment_dna}`,
    `- location_reentry_validated: ${report.reentry_result.location_reentry_validated}`,
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
  issues: LocationReentryValidationIssue[]
): MovieAnalysisLocationReentryValidationReport {
  const report: MovieAnalysisLocationReentryValidationReport = {
    report_id: 'movie-analysis-location-reentry-validation-report-v1',
    phase: LOCATION_REENTRY_VALIDATION_PHASE,
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
    character_reentry_validation_report_path: CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
    character_reentry_validation_manifest_path: CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH,
    location_reentry_validation_export_dir: LOCATION_REENTRY_VALIDATION_EXPORT_DIR,
    location_reentry_validation_manifest_path: LOCATION_REENTRY_VALIDATION_MANIFEST_PATH,
    video_location_dir: VIDEO_LOCATION_DIR,
    source_count: 0,
    adapter_count: 0,
    journey_location_count: LOCATION_JOURNEY_COUNT,
    journey_transition_count: LOCATION_TRANSITION_COUNT,
    location_identity: 'FAIL',
    indoor_anchor: 'FAIL',
    layout_anchor: 'FAIL',
    lighting_anchor: 'FAIL',
    environment_dna: 'FAIL',
    location_memory_preserved: 'FAIL',
    location_reentry_failure: true,
    location_memory_loss: true,
    location_reentry_validation_ready: 'FAIL',
    certification_status: null,
    location_anchor: {
      location_id: 'Harbor',
      source_id: 'GHIBLI_01',
      frame_index: 0,
      location_dna_id: '',
      indoor_anchor_id: '',
      lighting_anchor_id: '',
      location_signature: '',
      layout_signature: '',
      lighting_warmth: 0,
      indoor_anchor_strength: 0,
      sky_zone_rgb: [0, 0, 0],
      midground_zone_rgb: [0, 0, 0],
      ground_zone_rgb: [0, 0, 0],
      memory_signature: '',
    },
    journey_steps: [],
    reentry_result: {
      anchor_location_id: 'Harbor',
      reentry_location_id: 'Harbor',
      anchor_source_id: 'GHIBLI_01',
      journey_location_count: LOCATION_JOURNEY_COUNT,
      journey_transition_count: LOCATION_TRANSITION_COUNT,
      location_identity: 'FAIL',
      indoor_anchor: 'FAIL',
      layout_anchor: 'FAIL',
      lighting_anchor: 'FAIL',
      environment_dna: 'FAIL',
      location_memory_preserved: 'FAIL',
      location_reentry_failure: true,
      location_memory_loss: true,
      location_reentry_validated: 'FAIL',
    },
    final_verdict: LOCATION_REENTRY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LOCATION_REENTRY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LOCATION_REENTRY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LOCATION_REENTRY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLocationReentryValidation(
  projectRoot?: string
): MovieAnalysisLocationReentryValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: LocationReentryValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const characterReentryPath = path.join(root, CHARACTER_REENTRY_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(characterReentryPath)) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${CHARACTER_REENTRY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const characterReentryReport = JSON.parse(fs.readFileSync(characterReentryPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (
    characterReentryReport.final_verdict !== CHARACTER_REENTRY_VALIDATION_PASS_VERDICT ||
    characterReentryReport.certification_status !== CHARACTER_REENTRY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'CHARACTER_REENTRY_NOT_VALIDATED',
      message: `Required ${CHARACTER_REENTRY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(path.join(root, CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH))) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing ${CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH}`,
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

  const anchorSourceId = LOCATION_JOURNEY_SOURCE_MAP[0];
  const anchorBundle = loadLocationBundle(root, anchorSourceId);
  if (!anchorBundle) {
    issues.push({
      code: 'MISSING_UPSTREAM',
      message: `Missing location snapshot for ${anchorSourceId}`,
      severity: 'error',
      location_id: ANCHOR_LOCATION_ID,
    });
    return writeFailReport(root, timestamp, issues);
  }

  const anchorFrame = anchorBundle.frames[ANCHOR_FRAME_INDEX];
  const locationAnchor: LocationIdentityAnchor = {
    location_id: ANCHOR_LOCATION_ID,
    source_id: anchorSourceId,
    frame_index: ANCHOR_FRAME_INDEX,
    location_dna_id: anchorBundle.location_dna_id,
    indoor_anchor_id: anchorBundle.indoor_anchor_id,
    lighting_anchor_id: anchorBundle.lighting_anchor_id,
    location_signature: anchorFrame.location_signature,
    layout_signature: anchorFrame.layout_signature,
    lighting_warmth: anchorFrame.lighting_warmth,
    indoor_anchor_strength: anchorFrame.indoor_anchor_strength,
    sky_zone_rgb: anchorFrame.sky_zone_rgb,
    midground_zone_rgb: anchorFrame.midground_zone_rgb,
    ground_zone_rgb: anchorFrame.ground_zone_rgb,
    memory_signature: memorySignature(anchorBundle, anchorFrame),
  };

  const journeySteps: LocationJourneyStep[] = [];
  for (let stepIndex = 0; stepIndex < LOCATION_JOURNEY_COUNT; stepIndex += 1) {
    const locationId = LOCATION_JOURNEY_IDS[stepIndex];
    const sourceId = LOCATION_JOURNEY_SOURCE_MAP[stepIndex];
    const bundle = loadLocationBundle(root, sourceId);
    if (!bundle) {
      issues.push({
        code: 'MISSING_UPSTREAM',
        message: `Missing location snapshot for ${sourceId} (${locationId})`,
        severity: 'error',
        location_id: locationId,
      });
      return writeFailReport(root, timestamp, issues);
    }

    const testResult = testManifest.results.find((result) => result.source_id === sourceId) ?? null;
    const entryFrame = bundle.frames[ANCHOR_FRAME_INDEX];
    const exitFrame = bundle.frames[EXIT_FRAME_INDEX];
    const comparison =
      sourceId === anchorSourceId
        ? compareLocationToAnchor(locationAnchor, bundle, entryFrame, testResult)
        : {
            location_identity: toStatus(true),
            indoor_anchor: toStatus(
              bundle.indoor_anchor_id === SOURCE_LOCATION_DNA_ANCHORS[sourceId].indoor_anchor_id
            ),
            layout_anchor: toStatus(true),
            lighting_anchor: toStatus(
              bundle.lighting_anchor_id === SOURCE_LOCATION_DNA_ANCHORS[sourceId].lighting_anchor_id
            ),
            environment_dna: toStatus(
              bundle.location_dna_id === SOURCE_LOCATION_DNA_ANCHORS[sourceId].location_dna_id &&
                testResult?.dna_binding.binding_preserved === true
            ),
            location_memory_preserved: toStatus(false),
          };

    if (sourceId === anchorSourceId && comparison.location_memory_preserved === 'FAIL') {
      issues.push({
        code: 'LOCATION_MEMORY_LOSS',
        message: `Location memory lost at ${locationId}`,
        severity: 'error',
        location_id: locationId,
      });
    }

    journeySteps.push({
      step_index: stepIndex,
      location_id: locationId,
      source_id: sourceId,
      entry_frame: entryFrame,
      exit_frame: exitFrame,
      ...comparison,
    });
  }

  const reentryBundle = loadLocationBundle(root, anchorSourceId)!;
  const reentryTestResult =
    testManifest.results.find((result) => result.source_id === anchorSourceId) ?? null;
  const reentryFrame = reentryBundle.frames[ANCHOR_FRAME_INDEX];
  const reentryComparison = compareLocationToAnchor(
    locationAnchor,
    reentryBundle,
    reentryFrame,
    reentryTestResult
  );

  if (reentryComparison.location_identity === 'FAIL') {
    issues.push({
      code: 'LOCATION_REENTRY_FAILURE',
      message: 'Location identity failed on Harbor reentry',
      severity: 'error',
      location_id: REENTRY_LOCATION_ID,
    });
  }
  if (reentryComparison.indoor_anchor === 'FAIL') {
    issues.push({
      code: 'LOCATION_REENTRY_FAILURE',
      message: 'Indoor anchor failed on Harbor reentry',
      severity: 'error',
      location_id: REENTRY_LOCATION_ID,
    });
  }
  if (reentryComparison.layout_anchor === 'FAIL') {
    issues.push({
      code: 'LOCATION_REENTRY_FAILURE',
      message: 'Layout anchor failed on Harbor reentry',
      severity: 'error',
      location_id: REENTRY_LOCATION_ID,
    });
  }
  if (reentryComparison.lighting_anchor === 'FAIL') {
    issues.push({
      code: 'LOCATION_REENTRY_FAILURE',
      message: 'Lighting anchor failed on Harbor reentry',
      severity: 'error',
      location_id: REENTRY_LOCATION_ID,
    });
  }
  if (reentryComparison.environment_dna === 'FAIL') {
    issues.push({
      code: 'LOCATION_REENTRY_FAILURE',
      message: 'Environment DNA failed on Harbor reentry',
      severity: 'error',
      location_id: REENTRY_LOCATION_ID,
    });
  }
  if (reentryComparison.location_memory_preserved === 'FAIL') {
    issues.push({
      code: 'LOCATION_MEMORY_LOSS',
      message: 'Location memory lost on Harbor reentry after full journey',
      severity: 'error',
      location_id: REENTRY_LOCATION_ID,
    });
  }

  const harborSteps = journeySteps.filter((step) => step.source_id === anchorSourceId);
  const locationMemoryPreserved = toStatus(
    harborSteps.every((step) => step.location_memory_preserved === 'PASS') &&
      reentryComparison.location_memory_preserved === 'PASS'
  );

  const locationReentryFailure =
    reentryComparison.location_identity === 'FAIL' ||
    reentryComparison.indoor_anchor === 'FAIL' ||
    reentryComparison.layout_anchor === 'FAIL' ||
    reentryComparison.lighting_anchor === 'FAIL' ||
    reentryComparison.environment_dna === 'FAIL';

  const locationMemoryLoss =
    locationMemoryPreserved === 'FAIL' || reentryComparison.location_memory_preserved === 'FAIL';

  const reentryResult: LocationReentryResult = {
    anchor_location_id: ANCHOR_LOCATION_ID,
    reentry_location_id: REENTRY_LOCATION_ID,
    anchor_source_id: anchorSourceId,
    journey_location_count: LOCATION_JOURNEY_COUNT,
    journey_transition_count: LOCATION_TRANSITION_COUNT,
    location_identity: reentryComparison.location_identity,
    indoor_anchor: reentryComparison.indoor_anchor,
    layout_anchor: reentryComparison.layout_anchor,
    lighting_anchor: reentryComparison.lighting_anchor,
    environment_dna: reentryComparison.environment_dna,
    location_memory_preserved: reentryComparison.location_memory_preserved,
    location_reentry_failure: locationReentryFailure,
    location_memory_loss: locationMemoryLoss,
    location_reentry_validated:
      !locationReentryFailure && !locationMemoryLoss ? 'PASS' : 'FAIL',
  };

  const gateChecks: ValidationStatus[] = [
    reentryComparison.location_identity,
    reentryComparison.indoor_anchor,
    reentryComparison.layout_anchor,
    reentryComparison.lighting_anchor,
    reentryComparison.environment_dna,
    locationMemoryPreserved,
  ];

  const locationReentryValidationReady =
    !locationReentryFailure &&
    !locationMemoryLoss &&
    gateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = locationReentryValidationReady === 'PASS';

  const manifest: MovieAnalysisLocationReentryValidationManifest = {
    manifest_id: 'movie-analysis-location-reentry-validation-manifest-v1',
    phase: LOCATION_REENTRY_VALIDATION_PHASE,
    generated_at: timestamp,
    character_reentry_validation_manifest_path: CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH,
    anchor_location_id: ANCHOR_LOCATION_ID,
    reentry_location_id: REENTRY_LOCATION_ID,
    journey_path: LOCATION_JOURNEY_IDS.map((locationId, stepIndex) => ({
      step_index: stepIndex,
      location_id: locationId,
      source_id: LOCATION_JOURNEY_SOURCE_MAP[stepIndex],
    })),
    location_anchor: locationAnchor,
    journey_steps: journeySteps,
    reentry_result: reentryResult,
  };

  fs.mkdirSync(path.join(root, LOCATION_REENTRY_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LOCATION_REENTRY_VALIDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LOCATION_REENTRY_VALIDATION_EXPORT_DIR, 'location-reentry-journey.json'),
    `${JSON.stringify(
      {
        journey_path: manifest.journey_path,
        location_anchor: locationAnchor,
        journey_steps: journeySteps.map((step) => ({
          step_index: step.step_index,
          location_id: step.location_id,
          source_id: step.source_id,
          location_identity: step.location_identity,
          indoor_anchor: step.indoor_anchor,
          layout_anchor: step.layout_anchor,
          lighting_anchor: step.lighting_anchor,
          environment_dna: step.environment_dna,
          location_memory_preserved: step.location_memory_preserved,
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

  const report: MovieAnalysisLocationReentryValidationReport = {
    report_id: 'movie-analysis-location-reentry-validation-report-v1',
    phase: LOCATION_REENTRY_VALIDATION_PHASE,
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
    character_reentry_validation_report_path: CHARACTER_REENTRY_VALIDATION_REPORT_PATH,
    character_reentry_validation_manifest_path: CHARACTER_REENTRY_VALIDATION_MANIFEST_PATH,
    location_reentry_validation_export_dir: LOCATION_REENTRY_VALIDATION_EXPORT_DIR,
    location_reentry_validation_manifest_path: LOCATION_REENTRY_VALIDATION_MANIFEST_PATH,
    video_location_dir: VIDEO_LOCATION_DIR,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    journey_location_count: LOCATION_JOURNEY_COUNT,
    journey_transition_count: LOCATION_TRANSITION_COUNT,
    location_identity: reentryComparison.location_identity,
    indoor_anchor: reentryComparison.indoor_anchor,
    layout_anchor: reentryComparison.layout_anchor,
    lighting_anchor: reentryComparison.lighting_anchor,
    environment_dna: reentryComparison.environment_dna,
    location_memory_preserved: locationMemoryPreserved,
    location_reentry_failure: locationReentryFailure,
    location_memory_loss: locationMemoryLoss,
    location_reentry_validation_ready: locationReentryValidationReady,
    certification_status: pass ? LOCATION_REENTRY_VALIDATION_STATUS_MESSAGE : null,
    location_anchor: locationAnchor,
    journey_steps: journeySteps,
    reentry_result: reentryResult,
    final_verdict: pass
      ? LOCATION_REENTRY_VALIDATION_PASS_VERDICT
      : LOCATION_REENTRY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LOCATION_REENTRY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LOCATION_REENTRY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LOCATION_REENTRY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
